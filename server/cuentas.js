/**
 * LAS CUENTAS, PARTE 1 (docs/dias/PLAN_CUENTAS.md): lo que solo puede hacer el servidor, con la clave de servicio de Supabase.
 *
 *   POST   /api/cuenta/reclamar   Entrar con una cuenta que ya existía desde un móvil que tenía una sesión anónima: pasa a la cuenta lo del móvil.
 *                                 Cabecera Authorization: Bearer <token de la cuenta>; cuerpo { anonToken } (el de la sesión anónima de antes).
 *   DELETE /api/cuenta            Borra la cuenta y todo lo suyo: archivos de las fotos y, en cascada, viajes, invitaciones, vistos, fotos, logros y pases.
 *                                 Cabecera Authorization: Bearer <token de la cuenta>.
 *
 * Sin la clave de servicio (SUPABASE_SERVICE_ROLE_KEY) las dos responden 503 con un aviso claro y no tocan nada. El cliente de Supabase con la clave de servicio
 * se pasa de fuera (`admin`), así las pruebas lo cambian por uno de mentira sin red. No toca el motor de rutas.
 */

export const BUCKET_FOTOS = 'fotos-viaje'
const SIN_CLAVE = 'Las cuentas todavía no están preparadas en el servidor (falta la clave de servicio de Supabase).'

export const tokenDe = (req) => {
  const cabecera = String(req.get?.('authorization') ?? req.headers?.authorization ?? '')
  return cabecera.startsWith('Bearer ') ? cabecera.slice(7).trim() || null : null
}

/** El usuario de ese token, o null si no vale. */
export async function quienEs(admin, token) {
  if (!token) return null
  const { data, error } = await admin.auth.getUser(token)
  return error || !data?.user ? null : data.user
}

/** Todos los archivos de la carpeta de ese usuario en el bucket de fotos (con sus subcarpetas), como rutas completas. */
export async function archivosDe(admin, uid) {
  const almacen = admin.storage.from(BUCKET_FOTOS)
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
export async function borrarCuenta(admin, token) {
  const usuario = await quienEs(admin, token)
  if (!usuario) return { estado: 401, cuerpo: { error: 'Tu sesión no es válida. Entra otra vez y vuelve a probar.' } }
  const { data: preparado, error: errorPreparar } = await admin.rpc('preparar_borrado', { p_uid: usuario.id })
  if (errorPreparar) return { estado: 500, cuerpo: { error: 'No se pudo preparar el borrado. No se ha borrado nada; vuelve a probar.' } }
  const archivos = await archivosDe(admin, usuario.id)
  for (let i = 0; i < archivos.length; i += 100) {
    const { error } = await admin.storage.from(BUCKET_FOTOS).remove(archivos.slice(i, i + 100))
    if (error) return { estado: 500, cuerpo: { error: 'No se pudieron borrar tus fotos. No se ha borrado nada más; vuelve a probar.' } }
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

  // 2. Las filas, a la cuenta nueva (y fuera la sesión anónima, ya vacía).
  const { data, error } = await admin.rpc('reclamar_anonimo', { p_viejo: viejo.id, p_nuevo: nuevo.id })
  if (error) {
    for (const [origen, destino] of movidos) await almacen.move(destino, origen)
    return { estado: 500, cuerpo: { error: 'No se pudo pasar lo de este móvil a tu cuenta. No se ha cambiado nada; vuelve a probar.', detalle: error.message } }
  }
  return { estado: 200, cuerpo: { ok: true, pasado: data ?? null, archivosMovidos: movidos.length } }
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
  app.delete('/api/cuenta', async (req, res) => {
    if (!admin) return res.status(503).json({ error: SIN_CLAVE })
    try {
      responder(res, await borrarCuenta(admin, tokenDe(req)))
    } catch (error) {
      console.error('[cuenta/borrar]', error)
      res.status(500).json({ error: 'No se pudo borrar la cuenta.' })
    }
  })
}
