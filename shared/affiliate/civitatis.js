/**
 * El código de afiliado de Civitatis, en un solo sitio para todos los destinos (Tanda 6o): cualquier enlace de Civitatis (entradas, excursiones, Free Tour,
 * búsquedas) sale con `aid=5206`, lo lleve ya o no, y si trae otro `aid` se cambia por el nuestro. Los enlaces que no son de Civitatis no se tocan.
 * Lo usa la app justo antes de seguir un enlace (CampaignLinks y openTicketShop) y lo recorre la prueba de la 6o.
 */
export const CIVITATIS_AID = '5206'

/** El buscador de Civitatis para una búsqueda (`pompeya desde roma`): ya con el `aid`. Es de donde salen los enlaces de «Reservar» de entradas y excursiones. */
export function civitatisSearchUrl(query) {
  return stampCivitatis(`https://www.civitatis.com/es/buscar?q=${encodeURIComponent(query)}`)
}

/** ¿Es un enlace de Civitatis (civitatis.com o un subdominio)? */
export function isCivitatisUrl(url) {
  try {
    return /(^|\.)civitatis\.com$/.test(new URL(url).hostname)
  } catch {
    return false
  }
}

/**
 * El enlace con `aid` y, si hay, el código de campaña del viaje. Lo que no es de Civitatis (o no es un enlace) vuelve igual.
 * @param {string} url
 * @param {{ campaignParam?: string, campaignCode?: string | null }} [options]
 */
export function stampCivitatis(url, { campaignParam = 'cmp', campaignCode = null } = {}) {
  if (!url || !isCivitatisUrl(url)) return url
  const parsed = new URL(url)
  parsed.searchParams.set('aid', CIVITATIS_AID)
  if (campaignCode) parsed.searchParams.set(campaignParam, campaignCode)
  return parsed.toString()
}
