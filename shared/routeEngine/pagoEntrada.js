/**
 * Un sitio que cobra por acercarse (la Fontana de Trevi, desde el 2 de febrero de 2026: 2 € por la zona de dentro, junto al agua, de 9:00 a 22:00; los viernes, desde las 11:30;
 * gratis fuera de ese horario). El aviso depende de la hora a la que se llega. Dato: `entrada_de_pago` del sitio en roma.json (Tanda 6e, punto 2c).
 */
const toMin = (hhmm) => Number(String(hhmm).split(':')[0]) * 60 + Number(String(hhmm).split(':')[1])
const quitaCero = (hhmm) => String(hhmm).replace(/^0/, '')

/**
 * El aviso de pago a esa hora (minutos desde las 0:00) o null. `weekday`: «viernes» abre el pago a las 11:30.
 * Antes de que empiece el pago: «Gratis y sin gente: antes de las 9:00 no se paga». Durante el pago: «Hasta las 22:00, acercarte a la fuente cuesta 2 € (solo con tarjeta). Desde la plaza se ve gratis».
 */
export function avisoPagoEntrada(pago, minutos, weekday = null) {
  if (!pago?.horario_de_pago || !Number.isFinite(minutos)) return null
  const [abre, cierra] = String(pago.horario_de_pago).split('-')
  const esViernes = String(weekday ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() === 'viernes'
  const desde = esViernes && pago.viernes_desde ? pago.viernes_desde : abre
  if (minutos < toMin(desde)) return `Gratis y sin gente: antes de las ${quitaCero(desde)} no se paga`
  if (minutos < toMin(cierra)) return `Hasta las ${quitaCero(cierra)}, acercarte a la fuente cuesta ${pago.precio} (solo con tarjeta). Desde la plaza se ve gratis`
  return null
}
