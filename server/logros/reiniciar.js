/**
 * REINICIAR MIS PRUEBAS (tanda 9, punto 3). Solo para la cuenta de administrador, y SOLO para su propia cuenta: borra lo de pruebas de esa persona (su día de prueba de HOY, sus logros,
 * su EXP, los pases que ha comprado —con sus plazas— y sus avisos). Cada borrado lleva `.eq(columna, uid)` con el `uid` de la sesión: no hay forma de pasarle otra cuenta.
 * NO toca: sus viajes, sus fotos, su cuenta, ni los registros de los cobros (`pagos_registro`, que no llevan datos de persona y no se borran nunca).
 */
export const TABLAS_DE_PRUEBAS = [
  { tabla: 'hoy_prueba', columna: 'user_id', que: 'el día de prueba de HOY' },
  { tabla: 'logro_hechos', columna: 'user_id', que: 'los hechos de los logros' },
  { tabla: 'achievements', columna: 'user_id', que: 'los logros ganados' },
  { tabla: 'logro_avisos', columna: 'user_id', que: 'los avisos de los logros' },
  { tabla: 'logro_perfil', columna: 'user_id', que: 'la EXP' },
  { tabla: 'avisos', columna: 'user_id', que: 'los avisos de la campanita' },
  { tabla: 'passes', columna: 'comprador_id', que: 'los pases comprados (con sus plazas)' },
]

/**
 * EMPEZAR DE CERO (Tanda 10J). Deja la cuenta de administrador como recién creada: la base de datos lo hace en UNA transacción con `public.empezar_de_cero(uid)` (migración 0032; cada borrado
 * lleva `columna = uid`), y aquí se borran los archivos de las fotos del viaje y la marca de «ya vi la película del pase» de los datos de la persona. El `uid` sale de la sesión; no hay forma de
 * pasar otra cuenta. NO borra la cuenta, ni toca nada de Stripe, ni nada de otra cuenta.
 *
 * Orden: 1) se listan los archivos (si falla, no se ha borrado nada); 2) la transacción de la base de datos (si falla, no se ha borrado nada); 3) los archivos y la marca de la película.
 * Si 3 falla a medias, la base ya está a cero: se avisa en `avisos` (un archivo suelto en un almacén privado no enseña nada a nadie).
 * `archivosDe` se pasa de fuera (server/cuentas.js) para que las pruebas lo cambien.
 */
export async function empezarDeCero(admin, usuario, { archivosDe, bucket = 'fotos-viaje' } = {}) {
  const uid = usuario?.id
  if (!admin || !uid || typeof uid !== 'string') return { ok: false, borrados: {}, error: 'Falta la cuenta.' }
  let archivos = []
  try {
    archivos = archivosDe ? await archivosDe(admin, uid, bucket) : []
  } catch {
    return { ok: false, borrados: {}, error: 'No se han podido leer tus fotos. No se ha borrado nada; vuelve a probar.' }
  }
  // (Tanda 10N §3) «Verme como viajero sin pase» es un ajuste de las pruebas, no algo de la cuenta: [Empezar de cero] no lo toca. La 0032 ya no borra su fila; si la función de la base de datos es la vieja
  // (migración sin volver a aplicar), la fila se vuelve a poner aquí tal como estaba.
  let sinPaseAntes = null
  try {
    const previo = await admin.from('admin_sin_pase').select('activo').eq('user_id', uid).maybeSingle()
    if (!previo.error && previo.data) sinPaseAntes = Boolean(previo.data.activo)
  } catch {
    /* sin la tabla (0030 sin aplicar): nada que guardar */
  }
  const { data, error } = await admin.rpc('empezar_de_cero', { p_uid: uid })
  if (sinPaseAntes !== null) {
    try {
      await admin.from('admin_sin_pase').upsert({ user_id: uid, activo: sinPaseAntes, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    } catch {
      /* no se pudo volver a poner: el administrador lo enciende otra vez desde /?admin=logros */
    }
  }
  if (error) {
    const falta = /empezar_de_cero|PGRST202|42883/.test(`${error.code ?? ''} ${error.message ?? ''}`)
    return { ok: false, borrados: {}, error: falta ? 'Falta aplicar la migración 0032 en Supabase. No se ha borrado nada.' : 'No se ha podido borrar. No se ha borrado nada; vuelve a probar.' }
  }
  const avisos = []
  for (let i = 0; i < archivos.length; i += 100) {
    const { error: errorArchivos } = await admin.storage.from(bucket).remove(archivos.slice(i, i + 100))
    if (errorArchivos) avisos.push('Algunos archivos de fotos no se han podido borrar del almacén.')
  }
  const meta = usuario.user_metadata ?? {}
  // `null` quita la marca tanto si el servicio de cuentas mezcla los datos como si los reemplaza (la app solo la da por buena si vale exactamente `true`).
  const { error: errorMeta } = await admin.auth.admin.updateUserById(uid, { user_metadata: { ...meta, pelicula_pase_vista: null } })
  if (errorMeta) avisos.push('No se ha podido quitar la marca de la película del pase.')
  return { ok: true, borrados: data?.borrados ?? {}, traspasado: data?.traspasado ?? null, archivos: archivos.length, avisos }
}

/** Devuelve { ok, borrados: { tabla: n }, error? }. Si algo falla, lo dice y para (no sigue con lo demás). */
export async function reiniciarMisPruebas(admin, uid) {
  if (!admin || !uid || typeof uid !== 'string') return { ok: false, borrados: {}, error: 'Falta la cuenta.' }
  const borrados = {}
  for (const { tabla, columna } of TABLAS_DE_PRUEBAS) {
    const { error, count } = await admin.from(tabla).delete({ count: 'exact' }).eq(columna, uid)
    if (error) return { ok: false, borrados, error: `No se ha podido borrar ${tabla}.` }
    borrados[tabla] = count ?? 0
  }
  return { ok: true, borrados }
}
