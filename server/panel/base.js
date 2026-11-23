/**
 * (V35A) LA BASE DEL PANEL: lee de Supabase (con la clave de servicio, SOLO en el servidor) lo que el panel necesita y lo deja en listas sencillas; los cálculos (periodos, embudo, ventas, calendario…) viven aparte, en
 * `calculos.js`, y son funciones puras que reciben esta base. Así el panel puede enseñar cualquier periodo SIN funciones SQL nuevas (esta tanda no lleva SQL). Solo lectura. NUNCA se lee ni se devuelve nada de tarjetas,
 * contraseñas, tokens, recibos, referencias de cobro ni fotos de nadie.
 *   · Solo cuentas de verdad (no las anónimas).
 *   · De cada viaje solo se piden unos pocos campos (destino, fechas y origen), nunca el viaje entero.
 */
const PAGINA = 1000
const TOPE = 20000

/** Todas las filas de una consulta (de 1000 en 1000, con tope). Si la tabla no existe o falla, lista vacía y se apunta el aviso. */
async function todas(admin, tabla, columnas, avisos, ordenar = null) {
  const filas = []
  try {
    for (let desde = 0; desde < TOPE; desde += PAGINA) {
      let q = admin.from(tabla).select(columnas).range(desde, desde + PAGINA - 1)
      if (ordenar) q = q.order(ordenar)
      const { data, error } = await q
      if (error) {
        avisos?.push(`${tabla}: ${error.message}`)
        break
      }
      filas.push(...(data ?? []))
      if ((data ?? []).length < PAGINA) break
    }
  } catch (e) {
    avisos?.push(`${tabla}: ${e?.message ?? e}`)
  }
  return filas
}

/**
 * (V35B) Lo que depende de la migración 0091: se intenta con las columnas nuevas y, si la base aún no las tiene (la 0091 está sin aplicar), con las de siempre. Devuelve las filas y si las columnas nuevas existen
 * (`nuevo`): el panel enseña «Pronto» donde falta, y nunca se rompe.
 */
async function conRespaldo(admin, tabla, columnasNuevas, columnasViejas, avisos) {
  const sin = []
  const filas = await todas(admin, tabla, columnasNuevas, sin)
  if (sin.length === 0) return { filas, nuevo: true }
  return { filas: columnasViejas ? await todas(admin, tabla, columnasViejas, avisos) : [], nuevo: false }
}

/**
 * (V41) Las respuestas de la primera vez para el panel. Primero con la franja de edad (0094) y el país (0091); sin la 0094, con el país y el año de nacimiento (el panel saca la franja del año); sin la 0091, solo lo básico.
 * `nuevo` sigue diciendo si existe el país (0091). Es la misma lectura de siempre (con la lectura general del panel, guardada 60 s): una consulta, ~100 bytes por persona; solo si falta la 0094 se repite una vez más sin la franja.
 */
async function primeraVezDelPanel(admin, avisos) {
  const sin = []
  const filas = await todas(admin, 'viajero_primera_vez', 'user_id,frecuencia,compania,anio_nacimiento,franja_edad,hecho_en,pais_vive', sin)
  if (sin.length === 0) return { filas, nuevo: true }
  return conRespaldo(admin, 'viajero_primera_vez', 'user_id,frecuencia,compania,anio_nacimiento,hecho_en,pais_vive', 'user_id,frecuencia,compania,anio_nacimiento,hecho_en', avisos)
}

/** Una tabla que solo existe con la 0091: si no existe, lista vacía y `nuevo: false` (sin avisos: es lo esperado). */
async function soloSiExiste(admin, tabla, columnas) {
  const sin = []
  const filas = await todas(admin, tabla, columnas, sin)
  return { filas, nuevo: sin.length === 0 }
}

/** Todas las cuentas de verdad con su correo, alta, último acceso y cómo entran (correo o Google). */
async function leerUsuarios(admin, avisos) {
  const salida = []
  try {
    for (let pagina = 1; pagina <= 40; pagina++) {
      const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: 1000 })
      if (error) {
        avisos?.push(`usuarios: ${error.message}`)
        break
      }
      const lista = data?.users ?? []
      for (const u of lista) {
        if (u.is_anonymous) continue
        const proveedores = u.app_metadata?.providers ?? (u.app_metadata?.provider ? [u.app_metadata.provider] : [])
        salida.push({
          id: u.id,
          email: u.email ?? '',
          alta: u.created_at ?? null,
          ultimo_acceso: u.last_sign_in_at ?? null,
          proveedor: proveedores.includes('google') ? 'google' : proveedores.includes('email') ? 'correo' : (proveedores[0] ?? null),
        })
      }
      if (lista.length < 1000) break
    }
  } catch (e) {
    avisos?.push(`usuarios: ${e?.message ?? e}`)
  }
  return salida
}

/**
 * (V36) La base del panel se guarda en memoria un rato (por cliente de Supabase): Inicio, Ventas, Usuarios y Logros la pedían ENTERA cada uno por su lado (15 tablas y todas las cuentas) en cada clic, cada cambio de periodo y
 * cada tecla del buscador. Ahora, una lectura sirve a todos durante PANEL_BASE_TTL_MS (60 s por defecto; 0 = sin guardar) y dos peticiones a la vez comparten la misma lectura. Las escrituras del panel la olvidan (olvidarBase).
 */
const guardadas = new WeakMap()
const TTL_POR_DEFECTO_MS = 60000
export function olvidarBase(admin) {
  if (admin && typeof admin === 'object') guardadas.delete(admin)
}
export async function leerBase(admin, { ttl = null, env = process.env } = {}) {
  const vida = ttl ?? (Number.isFinite(Number(env.PANEL_BASE_TTL_MS)) && env.PANEL_BASE_TTL_MS !== undefined && env.PANEL_BASE_TTL_MS !== '' ? Number(env.PANEL_BASE_TTL_MS) : TTL_POR_DEFECTO_MS)
  if (vida <= 0 || !admin || typeof admin !== 'object') return leerBaseDeVerdad(admin)
  const g = guardadas.get(admin)
  if (g && Date.now() - g.en < vida) return g.promesa
  const promesa = leerBaseDeVerdad(admin)
  guardadas.set(admin, { en: Date.now(), promesa })
  promesa.catch(() => guardadas.delete(admin))
  return promesa
}

/** Lee todo lo que necesita el panel. `avisos` recoge lo que no se pudo leer (el panel sigue con lo que haya). */
async function leerBaseDeVerdad(admin) {
  const avisos = []
  // (V39) `trips` lleva ahora `updated_at` (+~30 bytes por viaje) para saber cuál es el último viaje de cada persona («Dónde viven» sin contestar: el origen de su último viaje). Misma lectura que ya había, guardada 60 s.
  const [usuarios, travelers, trips, miembros, pases, miembrosPase, pagos, logros, perfiles, primeraVez, avisosDestino, uso, clics, pruebas, proximamente] = await Promise.all([
    leerUsuarios(admin, avisos),
    todas(admin, 'travelers', 'id,nombre,alta_cuenta,zona', avisos),
    todas(admin, 'trips', 'id,traveler_id,destino:route->>destination,origen:route->>origin,lugar:route->answers->originPlace,inicio:route->answers->dateRange->>start,fin:route->answers->dateRange->>end,actualizado:updated_at', avisos),
    todas(admin, 'trip_members', 'trip_id,user_id,rol,created_at', avisos),
    todas(admin, 'passes', 'id,comprador_id,para_id,destino,tipo,estado,pago_ref,created_at,trip_id', avisos),
    todas(admin, 'pass_members', 'pass_id,user_id,unido_en', avisos),
    conRespaldo(admin, 'pagos_registro', 'pago_ref,destino,plan,personas,importe_cent,moneda,estado,proveedor,creado_en,devuelto_en,user_id,comision_cent,devuelto_cent', 'pago_ref,destino,plan,personas,importe_cent,moneda,estado,proveedor,creado_en,devuelto_en', avisos),
    todas(admin, 'achievements', 'user_id,logro,escalon,destino,ganado_en', avisos),
    todas(admin, 'logro_perfil', 'user_id,exp_max', avisos),
    primeraVezDelPanel(admin, avisos),
    todas(admin, 'avisos_destino', 'destino,destino_norm,creado_en,avisado_campana_en,avisado_correo_en', avisos),
    soloSiExiste(admin, 'uso_diario', 'user_id,dia,aparato,instalada'),
    soloSiExiste(admin, 'afiliados_clics', 'dia,destino,tipo,proveedor,clics'),
    soloSiExiste(admin, 'cuentas_de_prueba', 'email'),
    soloSiExiste(admin, 'destinos_proximamente', 'clave,nombre,pais,iso,continente,lat,lng,orden,creado_en'),
  ])
  // (V35B) `hay`: qué datos nuevos existen en la base (con la 0091 aplicada). Donde falta, el panel enseña «Pronto».
  const hay = { pagos: pagos.nuevo, pais: primeraVez.nuevo, uso: uso.nuevo, clics: clics.nuevo, pruebas: pruebas.nuevo, proximamente: proximamente.nuevo }
  return {
    usuarios, travelers, trips, miembros, pases, miembros_pase: miembrosPase, pagos: pagos.filas, logros, perfiles, primera_vez: primeraVez.filas, avisos_destino: avisosDestino,
    uso_diario: uso.filas, afiliados_clics: clics.filas, cuentas_de_prueba: pruebas.filas.map((x) => String(x.email).toLowerCase()), destinos_proximamente: proximamente.filas, hay, avisos,
  }
}
