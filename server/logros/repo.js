/**
 * LA BASE DE DATOS DE LOS LOGROS CON SUPABASE (Tanda 8A): el `repo` que usa server/logros/servicio.js, con el cliente de la clave de servicio.
 * La prueba usa otro `repo` (de PGlite) con la misma forma, así la lógica del servicio se prueba entera sobre las migraciones de verdad.
 * Un error de Postgrest nunca se traga: se lanza (el cliente de Supabase no lanza solo).
 */

const ok = (resultado, donde) => {
  if (resultado.error) throw new Error(`${donde}: ${resultado.error.message}`)
  return resultado.data
}

export function repoSupabase(admin, { destinosConPionero = [] } = {}) {
  return {
    async hechosDe(userId) {
      return ok(await admin.from('logro_hechos').select('*').eq('user_id', userId).is('deshecho_en', null), 'hechosDe')
    },
    async insertarHecho(fila) {
      return ok(await admin.from('logro_hechos').insert(fila).select().single(), 'insertarHecho')
    },
    async deshacerHecho(id, cuando) {
      ok(await admin.from('logro_hechos').update({ deshecho_en: cuando }).eq('id', id), 'deshacerHecho')
    },
    async viajesDe(userId) {
      const propios = ok(await admin.from('trips').select('id, route, traveler_id').eq('traveler_id', userId), 'viajesDe')
      const miembros = ok(await admin.from('trip_members').select('trip_id').eq('user_id', userId), 'viajesDe(miembro)')
      let ajenos = []
      if (miembros.length > 0) ajenos = ok(await admin.from('trips').select('id, route, traveler_id').in('id', miembros.map((m) => m.trip_id)), 'viajesDe(ajenos)')
      const todos = [...propios, ...ajenos]
      if (todos.length === 0) return []
      // Con el Pase Dúo, el viaje es «en pareja» para los dos: hay una invitación con un pase Dúo en ese viaje.
      const invitaciones = ok(await admin.from('trip_invitations').select('trip_id, pass_id').in('trip_id', todos.map((t) => t.id)).not('pass_id', 'is', null), 'viajesDe(invitaciones)')
      let duo = new Set()
      if (invitaciones.length > 0) {
        const pases = ok(await admin.from('passes').select('id, tipo').in('id', invitaciones.map((i) => i.pass_id)), 'viajesDe(pases)')
        const duos = new Set(pases.filter((p) => p.tipo === 'duo').map((p) => p.id))
        duo = new Set(invitaciones.filter((i) => duos.has(i.pass_id)).map((i) => i.trip_id))
      }
      return todos.map((t) => ({ ...t, es_duo: duo.has(t.id) }))
    },
    async logrosDe(userId) {
      return ok(await admin.from('achievements').select('*').eq('user_id', userId), 'logrosDe')
    },
    async insertarLogros(userId, filas) {
      const dedup = [...new Map(filas.map((f) => [`${f.destino}|${f.logro}|${f.escalon}`, f])).values()]
      const datos = ok(
        await admin.from('achievements').upsert(dedup.map((f) => ({ user_id: userId, ...f, escalon: String(f.escalon) })), { onConflict: 'user_id,destino,logro,escalon', ignoreDuplicates: true }).select(),
        'insertarLogros',
      )
      return datos ?? []
    },
    async borrarLogros(userId, claves) {
      for (const c of claves) ok(await admin.from('achievements').delete().eq('user_id', userId).eq('destino', c.destino).eq('logro', c.logro).eq('escalon', String(c.escalon)), 'borrarLogros')
    },
    async cuentaDe(userId) {
      const viajero = ok(await admin.from('travelers').select('alta_cuenta').eq('id', userId).maybeSingle(), 'cuentaDe')
      const conf = ok(await admin.from('app_config').select('value').eq('key', 'salida_app').maybeSingle(), 'cuentaDe(salida)')
      return { alta_cuenta: viajero?.alta_cuenta ?? null, salida: conf?.value ? String(conf.value).slice(0, 10) : null }
    },
    async ordenPionero(userId) {
      const salida = {}
      for (const d of destinosConPionero) {
        const { data, error } = await admin.rpc('logro_orden_pionero', { p_user: userId, p_destino: d })
        if (error) throw new Error(`ordenPionero: ${error.message}`)
        if (data != null) salida[d] = data
      }
      return salida
    },
    async probadorDe(userId) {
      const fila = ok(await admin.from('achievements').select('ganado_en').eq('user_id', userId).eq('logro', 'viajero:probador').maybeSingle(), 'probadorDe')
      return fila?.ganado_en ?? null
    },
    async ultimaFrase(userId) {
      const fila = ok(await admin.from('achievements').select('frase').eq('user_id', userId).not('frase', 'is', null).order('ganado_en', { ascending: false }).limit(1).maybeSingle(), 'ultimaFrase')
      return fila?.frase ?? null
    },
    async pasesDe(userId) {
      // Los pases anulados (pago devuelto, migración 0026) ya no valen. Sin la migración aplicada no existe la columna `estado` y valen todos, como antes.
      const traer = async (filtrar, donde) => {
        const conEstado = filtrar(admin.from('passes').select('id, destino, tipo').eq('estado', 'activo'))
        const r = await conEstado
        if (r.error && /estado/.test(r.error.message)) return ok(await filtrar(admin.from('passes').select('id, destino, tipo')), donde)
        return ok(r, donde)
      }
      const propios = await traer((c) => c.or(`comprador_id.eq.${userId},para_id.eq.${userId}`), 'pasesDe')
      const unidos = ok(await admin.from('pass_members').select('pass_id').eq('user_id', userId), 'pasesDe(miembro)')
      let ajenos = []
      if (unidos.length > 0) ajenos = await traer((c) => c.in('id', unidos.map((u) => u.pass_id)), 'pasesDe(ajenos)')
      return [...propios, ...ajenos]
    },
    async pruebaDe(userId) {
      return ok(await admin.from('hoy_prueba').select('*').eq('user_id', userId).maybeSingle(), 'pruebaDe')
    },
    async guardarPrueba(userId, fila) {
      ok(await admin.from('hoy_prueba').upsert({ user_id: userId, ...fila, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }), 'guardarPrueba')
    },
    /** «Verme como viajero sin pase» (0030, Tanda 10B): solo lo escribe la ruta de administrador. Sin la tabla (migración sin aplicar), siempre apagado. */
    async sinPaseDe(userId) {
      const r = await admin.from('admin_sin_pase').select('activo').eq('user_id', userId).maybeSingle()
      return r.error ? false : Boolean(r.data?.activo)
    },
    async ponerSinPase(userId, activo) {
      const r = await admin.from('admin_sin_pase').upsert({ user_id: userId, activo: Boolean(activo), updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      return r.error ? { ok: false, error: r.error.message } : { ok: true }
    },
    async perfilDe(userId) {
      // `exp_max` (0025): la mayor EXP que ha tenido; sin la migración aplicada, 0 (la EXP se calcula igual, solo que no se guarda el máximo).
      let fila = null
      const r = await admin.from('logro_perfil').select('previos, vitrina, exp_max').eq('user_id', userId).maybeSingle()
      if (r.error && /exp_max/.test(r.error.message)) fila = ok(await admin.from('logro_perfil').select('previos, vitrina').eq('user_id', userId).maybeSingle(), 'perfilDe')
      else fila = ok(r, 'perfilDe')
      return { previos: fila?.previos ?? { paises: [], dias: 0 }, vitrina: fila?.vitrina ?? { baldas: {}, titulo: null }, exp_max: fila?.exp_max ?? 0 }
    },
    async guardarPerfil(userId, parcial) {
      ok(await admin.from('logro_perfil').upsert({ user_id: userId, ...parcial, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }), 'guardarPerfil')
    },
    /** Los amigos que ha invitado esta persona (0025): [{ invitado, creado_en, viaje_acabado_en }]. Sin la migración, ninguno. */
    async referidosDe(userId) {
      const r = await admin.from('logro_referidos').select('invitado_id, creado_en, viaje_acabado_en').eq('invitador_id', userId)
      if (r.error) return []
      return (r.data ?? []).map((x) => ({ invitado: x.invitado_id, creado_en: x.creado_en, viaje_acabado_en: x.viaje_acabado_en }))
    },
    /** Quién invitó a esta persona (0025), o null. */
    async invitadorDe(userId) {
      const r = await admin.from('logro_referidos').select('invitador_id, viaje_acabado_en').eq('invitado_id', userId).maybeSingle()
      return r.error ? null : r.data
    },
    /** Apunta que `invitador` invitó a `invitado` (solo el primero; nadie se invita a sí mismo). */
    async apuntarInvitacion(invitadorId, invitadoId) {
      if (invitadorId === invitadoId) return false
      ok(await admin.from('logro_referidos').upsert({ invitador_id: invitadorId, invitado_id: invitadoId }, { onConflict: 'invitado_id', ignoreDuplicates: true }), 'apuntarInvitacion')
      return true
    },
    async marcarInvitacionCumplida(invitadoId, cuando) {
      ok(await admin.from('logro_referidos').update({ viaje_acabado_en: cuando }).eq('invitado_id', invitadoId).is('viaje_acabado_en', null), 'marcarInvitacionCumplida')
    },
    /** Las cuentas con algún hecho (para el sorteo): sus ids. */
    async cuentasConHechos() {
      const filas = ok(await admin.from('logro_hechos').select('user_id').is('deshecho_en', null), 'cuentasConHechos')
      return [...new Set((filas ?? []).map((f) => f.user_id))]
    },
    async marcarAnimacion(userId, claves, vista) {
      for (const c of claves) ok(await admin.from('achievements').update({ animacion_vista: vista }).eq('user_id', userId).eq('destino', c.destino).eq('logro', c.logro).eq('escalon', String(c.escalon)), 'marcarAnimacion')
    },
    async encolarAvisos(filas) {
      if (filas.length === 0) return []
      return ok(await admin.from('logro_avisos').upsert(filas, { onConflict: 'user_id,trip_id,tipo', ignoreDuplicates: true }).select(), 'encolarAvisos') ?? []
    },
    async avisosPendientes(ahoraIso) {
      return ok(await admin.from('logro_avisos').select('*').is('enviado_en', null).lte('enviar_en', ahoraIso).order('enviar_en'), 'avisosPendientes')
    },
    async marcarAvisoEnviado(id, cuando) {
      ok(await admin.from('logro_avisos').update({ enviado_en: cuando }).eq('id', id), 'marcarAvisoEnviado')
    },
    async suscripcionesDe(userId) {
      return ok(await admin.from('push_suscripciones').select('endpoint, claves').eq('user_id', userId), 'suscripcionesDe')
    },
    async guardarSuscripcion(userId, endpoint, claves) {
      ok(await admin.from('push_suscripciones').upsert({ user_id: userId, endpoint, claves }, { onConflict: 'endpoint' }), 'guardarSuscripcion')
    },
    async contarLogros() {
      const { data, error } = await admin.rpc('logro_contar')
      if (error) throw new Error(`contarLogros: ${error.message}`)
      return data ?? []
    },
    async usuarioPorEmail(email) {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      if (error) throw new Error(`usuarioPorEmail: ${error.message}`)
      return (data?.users ?? []).find((u) => String(u.email ?? '').toLowerCase() === String(email).toLowerCase()) ?? null
    },
    async darProbador(userId, cuando) {
      return ok(await admin.from('achievements').upsert({ user_id: userId, logro: 'viajero:probador', escalon: '', destino: '*', ganado_en: cuando }, { onConflict: 'user_id,destino,logro,escalon', ignoreDuplicates: true }).select(), 'darProbador')
    },
  }
}
