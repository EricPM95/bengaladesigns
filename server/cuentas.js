/**
 * LAS CUENTAS, PARTE 1 (docs/dias/PLAN_CUENTAS.md): lo que solo puede hacer el servidor, con la clave de servicio de Supabase.
 *
 *   POST   /api/cuenta/reclamar   Entrar con una cuenta que ya existía desde un móvil que tenía una sesión anónima: pasa a la cuenta lo del móvil.
 *                                 Cabecera Authorization: Bearer <token de la cuenta>; cuerpo { anonToken } (el de la sesión anónima de antes).
 *   DELETE /api/cuenta            Borra la cuenta y todo lo suyo (V37, RGPD): hace lo mismo que `empezar_de_cero` (viajes, fotos, logros, datos, pases; un viaje o un pase con otras personas pasa a ellas) y además borra
 *                                 los archivos de las fotos y la cuenta de acceso (Supabase Auth). Se queda el registro de los pagos (`pagos_registro`: fecha e importe; contabilidad, la ley lo pide).
 *                                 Cabecera Authorization: Bearer <token de la cuenta>; cuerpo { confirmar: 'BORRAR' }. Solo desde la propia cuenta, con sesión de verdad (nunca anónima) y nunca la de un administrador.
 *
 * Sin la clave de servicio (SUPABASE_SERVICE_ROLE_KEY) las dos responden 503 con un aviso claro y no tocan nada. El cliente de Supabase con la clave de servicio
 * se pasa de fuera (`admin`), así las pruebas lo cambian por uno de mentira sin red. No toca el motor de rutas.
 */

export const BUCKET_FOTOS = 'fotos-viaje'
/** La foto del perfil (0026): su propio almacén, con una carpeta por persona. */
export const BUCKET_PERFILES = 'perfiles'
const SIN_CLAVE = 'Las cuentas todavía no están preparadas en el servidor (falta la clave de servicio de Supabase).'

export const tokenDe = (req) => {
  const cabecera = String(req.get?.('authorization') ?? req.headers?.authorization ?? '')
  return cabecera.startsWith('Bearer ') ? cabecera.slice(7).trim() || null : null
}

/** (V37) ¿Es una cuenta de administrador? (por variables del servidor, nunca un correo escrito en el código; igual que `esAdmin` de logros/rutas.js, que no se puede importar aquí sin un círculo.) */
export function esCuentaAdministradora(usuario, env = process.env) {
  const lista = String(env.LOGROS_ADMIN_EMAILS ?? '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean)
  const ids = String(env.LOGROS_ADMIN_IDS ?? '').split(',').map((x) => x.trim()).filter(Boolean)
  return Boolean(usuario) && (lista.includes(String(usuario.email ?? '').toLowerCase()) || ids.includes(usuario.id))
}

/** El usuario de ese token, o null si no vale. */
export async function quienEs(admin, token) {
  if (!token) return null
  const { data, error } = await admin.auth.getUser(token)
  return error || !data?.user ? null : data.user
}

/** Todos los archivos de la carpeta de ese usuario en el bucket de fotos (con sus subcarpetas), como rutas completas. */
export async function archivosDe(admin, uid, bucket = BUCKET_FOTOS) {
  const almacen = admin.storage.from(bucket)
  const rutas = []
  const pendientes = [uid]
  while (pendientes.length > 0) {
    const carpeta = pendientes.pop()
    const { data, error } = await almacen.list(carpeta, { limit: 1000 })
    if (error) throw new Error(`No se pudo listar ${carpeta}: ${error.message}`)
    for (const entrada of data ?? []) {
      // En el almacenamiento de Supabase una carpeta sale sin `id`; un archivo, con él.
      if (entrada.id) rutas.push(`${carpeta}/${entrada.name}`)
      else pendientes.push(`${carpeta}/${entrada.name}`)
    }
  }
  return rutas
}

/**
 * Borra la cuenta sin que pierdan nada los demás (parte 2): primero `preparar_borrado` (un viaje con invitados pasa a administrarlo el invitado que entró primero; un pase con otras
 * personas se queda con ellas), después los archivos de las fotos (no caen en cascada) y por último el usuario, que se lleva en cascada lo que quede suyo.
 */
export async function borrarCuenta(admin, token, { env = process.env } = {}) {
  const usuario = await quienEs(admin, token)
  if (!usuario) return { estado: 401, cuerpo: { error: 'Tu sesión no es válida. Entra otra vez y vuelve a probar.' } }
  // (V37) Solo desde la propia cuenta, con sesión de verdad: una sesión anónima no tiene cuenta que borrar, y la de un administrador la borra otro administrador.
  if (usuario.is_anonymous === true) return { estado: 403, cuerpo: { error: 'Entra con tu cuenta para poder borrarla.', anonima: true } }
  if (esCuentaAdministradora(usuario, env)) return { estado: 403, cuerpo: { error: 'Pídeselo a otro administrador.', administrador: true } }
  // 1. Se listan los archivos (si falla, no se ha borrado nada).
  let archivos
  try {
    archivos = await archivosDe(admin, usuario.id)
  } catch {
    return { estado: 500, cuerpo: { error: 'No se han podido leer tus fotos. No se ha borrado nada; vuelve a probar.' } }
  }
  // 2. Lo mismo que «Empezar de cero» (`empezar_de_cero`, migración 0091: viajes, fotos, logros, datos y pases; lo compartido pasa a los demás antes de borrar nada y los pagos NO se tocan). Si la función aún no existe (migración sin aplicar), se cae al camino de siempre: `preparar_borrado` y la cascada.
  let preparado = null
  const { data: hecho, error: errorBorrar } = await admin.rpc('empezar_de_cero', { p_uid: usuario.id })
  if (errorBorrar) {
    const falta = /empezar_de_cero|PGRST202|42883/.test(`${errorBorrar.code ?? ''} ${errorBorrar.message ?? ''}`)
    if (!falta) return { estado: 500, cuerpo: { error: 'No se pudo preparar el borrado. No se ha borrado nada; vuelve a probar.' } }
    const { data: prep, error: errorPreparar } = await admin.rpc('preparar_borrado', { p_uid: usuario.id })
    if (errorPreparar) return { estado: 500, cuerpo: { error: 'No se pudo preparar el borrado. No se ha borrado nada; vuelve a probar.' } }
    preparado = prep ?? null
  } else {
    preparado = hecho?.traspasado ?? null
  }
  for (let i = 0; i < archivos.length; i += 100) {
    const { error } = await admin.storage.from(BUCKET_FOTOS).remove(archivos.slice(i, i + 100))
    if (error) return { estado: 500, cuerpo: { error: 'No se pudieron borrar tus fotos. No se ha borrado nada más; vuelve a probar.' } }
  }
  // La foto del perfil (otro almacén): también se va con la cuenta.
  const delPerfil = await archivosDe(admin, usuario.id, BUCKET_PERFILES)
  if (delPerfil.length > 0) {
    const { error } = await admin.storage.from(BUCKET_PERFILES).remove(delPerfil)
    if (error) return { estado: 500, cuerpo: { error: 'No se pudo borrar tu foto de perfil. No se ha borrado nada más; vuelve a probar.' } }
  }
  const { error } = await admin.auth.admin.deleteUser(usuario.id)
  if (error) return { estado: 500, cuerpo: { error: 'Tus fotos se han borrado, pero no se pudo borrar la cuenta. Vuelve a probar.' } }
  return { estado: 200, cuerpo: { ok: true, archivosBorrados: archivos.length, traspasado: preparado ?? null } }
}

/** Pasa a la cuenta (token nuevo) lo de la sesión anónima (token viejo). */
export async function reclamarCuenta(admin, tokenNuevo, tokenViejo) {
  const nuevo = await quienEs(admin, tokenNuevo)
  if (!nuevo) return { estado: 401, cuerpo: { error: 'Tu sesión no es válida. Entra otra vez y vuelve a probar.' } }
  if (nuevo.is_anonymous === true) return { estado: 400, cuerpo: { error: 'Primero entra con tu cuenta.' } }
  const viejo = await quienEs(admin, tokenViejo)
  if (!viejo) return { estado: 400, cuerpo: { error: 'La sesión anterior de este móvil ya no vale; no hay nada que pasar a tu cuenta.' } }
  if (viejo.is_anonymous !== true) return { estado: 400, cuerpo: { error: 'La sesión anterior no era anónima; no se pasa nada.' } }
  if (viejo.id === nuevo.id) return { estado: 200, cuerpo: { ok: true, nada: true } }

  // 1. Los archivos de las fotos, a la carpeta de la cuenta nueva.
  const almacen = admin.storage.from(BUCKET_FOTOS)
  const movidos = []
  try {
    for (const ruta of await archivosDe(admin, viejo.id)) {
      const destino = `${nuevo.id}${ruta.slice(viejo.id.length)}`
      const { error } = await almacen.move(ruta, destino)
      if (error) throw new Error(error.message)
      movidos.push([ruta, destino])
    }
  } catch (error) {
    for (const [origen, destino] of movidos) await almacen.move(destino, origen) // (devolverlos a su sitio: la sesión anónima sigue como estaba)
    return { estado: 500, cuerpo: { error: 'No se pudieron pasar tus fotos. No se ha movido nada; vuelve a probar.', detalle: String(error?.message ?? error) } }
  }

  // 1b. Los hechos de los logros (Tanda 8A, migración 0023) pasan antes, porque borrar la sesión anónima se los llevaría. Sin la 0023 aplicada, no pasa nada.
  const { error: errorLogros } = await admin.rpc('reclamar_anonimo_logros', { p_viejo: viejo.id, p_nuevo: nuevo.id })
  if (errorLogros && !/reclamar_anonimo_logros|PGRST202|42883/.test(`${errorLogros.code ?? ''} ${errorLogros.message ?? ''}`)) {
    for (const [origen, destino] of movidos) await almacen.move(destino, origen)
    return { estado: 500, cuerpo: { error: 'No se pudieron pasar tus logros. No se ha movido nada; vuelve a probar.', detalle: errorLogros.message } }
  }

  // 1c. (Entrar sin doble carga) Cuánto hay de lo que `reclamar_anonimo` no cuenta (pases, plazas, logros, recomendaciones): con la cuenta del móvil vacía, la app no necesita recargarse. Ante la duda (falla la consulta), se cuenta como «hay».
  let otros = 0
  try {
    for (const [tabla, columna] of [['passes', 'comprador_id'], ['passes', 'para_id'], ['pass_members', 'user_id'], ['trip_members', 'user_id'], ['achievements', 'user_id'], ['trip_recommendations', 'author_id']]) {
      const { count, error: errorCuenta } = await admin.from(tabla).select('*', { count: 'exact', head: true }).eq(columna, viejo.id)
      if (errorCuenta) throw new Error(errorCuenta.message)
      otros += count ?? 0
    }
  } catch {
    otros = 1
  }

  // 2. Las filas, a la cuenta nueva (y fuera la sesión anónima, ya vacía).
  const { data, error } = await admin.rpc('reclamar_anonimo', { p_viejo: viejo.id, p_nuevo: nuevo.id })
  if (error) {
    for (const [origen, destino] of movidos) await almacen.move(destino, origen)
    return { estado: 500, cuerpo: { error: 'No se pudo pasar lo de este móvil a tu cuenta. No se ha cambiado nada; vuelve a probar.', detalle: error.message } }
  }
  return { estado: 200, cuerpo: { ok: true, pasado: data ?? null, archivosMovidos: movidos.length, otros } }
}

/** Monta las dos rutas en la aplicación de Express. `admin` = cliente de Supabase con la clave de servicio (o null). */
export function registrarRutasCuentas(app, admin) {
  const responder = (res, { estado, cuerpo }) => res.status(estado).json(cuerpo)
  app.post('/api/cuenta/reclamar', async (req, res) => {
    if (!admin) return res.status(503).json({ error: SIN_CLAVE })
    try {
      responder(res, await reclamarCuenta(admin, tokenDe(req), String(req.body?.anonToken ?? '') || null))
    } catch (error) {
      console.error('[cuenta/reclamar]', error)
      res.status(500).json({ error: 'No se pudo pasar lo de este móvil a tu cuenta.' })
    }
  })
  // Invitar a un amigo (la EXP de la 8C1): entrar por un enlace o un código de viaje, de pase o personal cuenta como invitación SI con eso se crea una cuenta nueva (lo decide la base de datos).
  app.post('/api/invitaciones/registrar', async (req, res) => {
    if (!admin) return res.status(503).json({ error: SIN_CLAVE })
    try {
      const usuario = await quienEs(admin, tokenDe(req))
      if (!usuario || usuario.is_anonymous === true) return res.status(401).json({ error: 'Tu sesión no es válida. Entra otra vez.' })
      const { data, error } = await admin.rpc('registrar_referido', { p_codigo: String(req.body?.codigo ?? ''), p_invitado: usuario.id })
      if (error) return res.status(500).json({ error: 'No se pudo apuntar la invitación.' })
      res.json({ ok: true, ...data })
    } catch (error) {
      console.error('[invitaciones/registrar]', error)
      res.status(500).json({ error: 'No se pudo apuntar la invitación.' })
    }
  })
  app.delete('/api/cuenta', async (req, res) => {
    if (!admin) return res.status(503).json({ error: SIN_CLAVE })
    try {
      // (V37) Hay que mandar { confirmar: 'BORRAR' } (la app lo manda al escribir la palabra en la hoja): un DELETE suelto no borra nada.
      if (tokenDe(req) && req.body?.confirmar !== 'BORRAR') return res.status(400).json({ error: 'Escribe BORRAR para confirmar que quieres borrar tu cuenta.' })
      responder(res, await borrarCuenta(admin, tokenDe(req)))
    } catch (error) {
      console.error('[cuenta/borrar]', error)
      res.status(500).json({ error: 'No se pudo borrar la cuenta.' })
    }
  })
}
