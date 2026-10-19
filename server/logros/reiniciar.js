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
