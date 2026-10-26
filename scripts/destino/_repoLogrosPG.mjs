// El repo del servicio de logros sobre PGlite (la misma forma que server/logros/repo.js sobre Supabase). Copia del de pruebaLogros1.mjs, más lo de la Tanda 10P (nombre y avisos de la campana).
// Uso: const repoPG = crearRepoPG(S) donde S(sql, params) ejecuta con el rol de servicio.
export function crearRepoPG(S) {
const repoPG = {
  hechosDe: (u) => S('select * from public.logro_hechos where user_id = $1 and deshecho_en is null', [u]).then((f) => f.map(normalizarHecho)),
  insertarHecho: async (f) =>
    normalizarHecho((await S(
      `insert into public.logro_hechos (user_id, trip_id, destino, tipo, sitio, stop_id, instante, recibido_en, ubic, valido, motivo, origen, foto_id, inicio, fin) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) returning *`,
      [f.user_id, f.trip_id, f.destino, f.tipo, f.sitio ?? null, f.stop_id ?? null, f.instante, f.recibido_en, f.ubic, f.valido, f.motivo ?? null, f.origen ?? null, f.foto_id ?? null, f.inicio, f.fin],
    ))[0]),
  deshacerHecho: (id, cuando) => S('update public.logro_hechos set deshecho_en = $2 where id = $1', [id, cuando]),
  viajesDe: async (u) => {
    const filas = await S('select t.id, t.route, t.traveler_id from public.trips t where t.traveler_id = $1 or t.id in (select trip_id from public.trip_members where user_id = $1)', [u])
    const duos = await S("select distinct i.trip_id from public.trip_invitations i join public.passes p on p.id = i.pass_id where p.tipo = 'duo'")
    return filas.map((t) => ({ ...t, es_duo: duos.some((d) => d.trip_id === t.id) }))
  },
  logrosDe: (u) => S('select * from public.achievements where user_id = $1', [u]),
  insertarLogros: async (u, filas) => {
    const dentro = []
    for (const f of filas) {
      const r = await S('insert into public.achievements (user_id, destino, logro, escalon, trip_id, ganado_en, frase) values ($1,$2,$3,$4,$5,$6,$7) on conflict (user_id, destino, logro, escalon) do nothing returning *', [u, f.destino, f.logro, String(f.escalon), f.trip_id ?? null, f.ganado_en, f.frase ?? null])
      dentro.push(...r)
    }
    return dentro
  },
  borrarLogros: async (u, claves) => {
    for (const c of claves) await S('delete from public.achievements where user_id = $1 and destino = $2 and logro = $3 and escalon = $4', [u, c.destino, c.logro, String(c.escalon)])
  },
  cuentaDe: async (u) => {
    const v = (await S('select alta_cuenta from public.travelers where id = $1', [u]))[0]
    const c = (await S("select value from public.app_config where key = 'salida_app'"))[0]
    return { alta_cuenta: v?.alta_cuenta ? new Date(v.alta_cuenta).toISOString() : null, salida: c ? String(c.value).slice(0, 10) : null }
  },
  ordenPionero: async (u) => {
    const salida = {}
    const r = (await S("select public.logro_orden_pionero($1, 'roma') as n", [u]))[0].n
    if (r != null) salida.roma = r
    return salida
  },
  probadorDe: async (u) => (await S("select ganado_en from public.achievements where user_id = $1 and logro = 'viajero:probador'", [u]))[0]?.ganado_en?.toISOString?.() ?? null,
  ultimaFrase: async (u) => (await S('select frase from public.achievements where user_id = $1 and frase is not null order by ganado_en desc limit 1', [u]))[0]?.frase ?? null,
  sinPaseDe: async (u) => Boolean((await S('select activo from public.admin_sin_pase where user_id = $1', [u]))[0]?.activo),
  ponerSinPase: async (u, activo) => {
    await S('insert into public.admin_sin_pase (user_id, activo) values ($1, $2) on conflict (user_id) do update set activo = excluded.activo, updated_at = now()', [u, Boolean(activo)])
    return { ok: true }
  },
  pasesDe: (u) => S('select id, destino, tipo from public.passes where comprador_id = $1 or para_id = $1 or id in (select pass_id from public.pass_members where user_id = $1)', [u]),
  pruebaDe: async (u) => {
    const f = (await S('select * from public.hoy_prueba where user_id = $1', [u]))[0]
    return f ? { ...f, fecha: new Date(f.fecha).toISOString().slice(0, 10), gastada_en: f.gastada_en ? new Date(f.gastada_en).toISOString() : null } : null
  },
  guardarPrueba: (u, f) =>
    S(
      `insert into public.hoy_prueba (user_id, trip_id, fecha, gastada_en, pospuesta, pregunta_hecha) values ($1,$2,$3,$4,$5,$6)
       on conflict (user_id) do update set trip_id = excluded.trip_id, fecha = excluded.fecha, gastada_en = excluded.gastada_en, pospuesta = excluded.pospuesta, pregunta_hecha = excluded.pregunta_hecha, updated_at = now()`,
      [u, f.trip_id, f.fecha, f.gastada_en, f.pospuesta, f.pregunta_hecha],
    ),
  perfilDe: async (u) => {
    const f = (await S('select previos, vitrina, exp_max from public.logro_perfil where user_id = $1', [u]))[0]
    return { previos: f?.previos ?? { paises: [], dias: 0 }, vitrina: f?.vitrina ?? { baldas: {}, titulo: null }, exp_max: f?.exp_max ?? 0 }
  },
  guardarPerfil: async (u, p) => {
    await S('insert into public.logro_perfil (user_id) values ($1) on conflict (user_id) do nothing', [u])
    if (p.previos) await S('update public.logro_perfil set previos = $2::jsonb where user_id = $1', [u, JSON.stringify(p.previos)])
    if (p.vitrina) await S('update public.logro_perfil set vitrina = $2::jsonb where user_id = $1', [u, JSON.stringify(p.vitrina)])
    if (p.exp_max != null) await S('update public.logro_perfil set exp_max = $2 where user_id = $1', [u, p.exp_max])
  },
  referidosDe: (u) => S('select invitado_id as invitado, creado_en, viaje_acabado_en from public.logro_referidos where invitador_id = $1', [u]),
  invitadorDe: async (u) => (await S('select invitador_id, viaje_acabado_en from public.logro_referidos where invitado_id = $1', [u]))[0] ?? null,
  apuntarInvitacion: async (a, b) => {
    if (a === b) return false
    await S('insert into public.logro_referidos (invitador_id, invitado_id) values ($1, $2) on conflict (invitado_id) do nothing', [a, b])
    return true
  },
  marcarInvitacionCumplida: (u, cuando) => S('update public.logro_referidos set viaje_acabado_en = $2 where invitado_id = $1 and viaje_acabado_en is null', [u, cuando]),
  cuentasConHechos: async () => [...new Set((await S('select user_id from public.logro_hechos where deshecho_en is null')).map((f) => f.user_id))],
  marcarAnimacion: async (u, claves, vista) => {
    for (const c of claves) await S('update public.achievements set animacion_vista = $5 where user_id = $1 and destino = $2 and logro = $3 and escalon = $4', [u, c.destino, c.logro, String(c.escalon), vista])
  },
  encolarAvisos: async (filas) => {
    const dentro = []
    for (const f of filas) dentro.push(...(await S('insert into public.logro_avisos (user_id, trip_id, tipo, enviar_en, payload) values ($1,$2,$3,$4,$5::jsonb) on conflict (user_id, trip_id, tipo) do nothing returning *', [f.user_id, f.trip_id, f.tipo, f.enviar_en, JSON.stringify(f.payload)])))
    return dentro
  },
  avisosPendientes: (ahora) => S('select * from public.logro_avisos where enviado_en is null and enviar_en <= $1 order by enviar_en', [ahora]),
  marcarAvisoEnviado: (id, cuando) => S('update public.logro_avisos set enviado_en = $2 where id = $1', [id, cuando]),
  suscripcionesDe: (u) => S('select endpoint, claves from public.push_suscripciones where user_id = $1', [u]),
  guardarSuscripcion: (u, e, c) => S('insert into public.push_suscripciones (user_id, endpoint, claves) values ($1,$2,$3::jsonb) on conflict (endpoint) do nothing', [u, e, JSON.stringify(c)]),
  contarLogros: () => S('select * from public.logro_contar()'),
  usuarioPorEmail: async (e) => (await S('select id, email from auth.users where email = $1', [e]))[0] ?? null,
  darProbador: (u, cuando) => S("insert into public.achievements (user_id, logro, escalon, destino, ganado_en) values ($1, 'viajero:probador', '', '*', $2) on conflict do nothing returning *", [u, cuando]),
}
function normalizarHecho(f) {
  return { ...f, instante: new Date(f.instante).toISOString(), recibido_en: new Date(f.recibido_en).toISOString(), inicio: f.inicio ? new Date(f.inicio).toISOString().slice(0, 10) : null, fin: f.fin ? new Date(f.fin).toISOString().slice(0, 10) : null, deshecho_en: f.deshecho_en ? new Date(f.deshecho_en).toISOString() : null }
}
// (Las fechas de tipo date las devuelve PGlite a las 00:00 UTC; se toma el día tal cual.)
  repoPG.nombreDe = async (u) => {
    const n = String((await S('select nombre from public.travelers where id = $1', [u]))[0]?.nombre ?? '').trim().split(' ')[0]
    return n || null
  }
  // Igual que crear_aviso (0026): una sola vez por (cuenta, clave). Devuelve true si lo crea ahora.
  repoPG.crearAvisoCampana = async (u, tipo, clave, payload = {}) => {
    try {
      const r = await S('insert into public.avisos (user_id, tipo, clave, payload) values ($1,$2,$3,$4::jsonb) on conflict (user_id, clave) do nothing returning id', [u, tipo, clave, JSON.stringify(payload)])
      return r.length > 0
    } catch {
      return false
    }
  }
  return repoPG
}
