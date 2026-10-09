/**
 * Colores de marca y enlaces de los partners de afiliación, en un solo sitio.
 *
 * Estaban repetidos por la app (el azul de Booking y el rojo de Civitatis vivían dentro de
 * DestinationDetailModal, y el proveedor de tickets tenía su propio rojo distinto): el color de
 * marca es lo que hace que el viajero sepa a dónde le lleva un botón antes de pulsarlo, así que
 * tiene que ser el mismo en las cuatro pantallas que lo usan.
 *
 * NINGUNA integración de afiliación está conectada todavía — ver FLUJO_TRANSPORTE.md. Estos enlaces
 * llevan al buscador público de cada partner, comprobado contra la web real, así que funcionan hoy
 * aunque no dejen comisión.
 *
 * TODO afiliación: cuando haya IDs, se añaden como parámetro en estas dos funciones (`aid` en
 * Booking, el suyo en Civitatis) y toda la app pasa a llevarlos sin tocar una sola pantalla.
 */

/** Azul de marca de Booking.com (vía agregador Stay22). */
import { civitatisSearchUrl, stampCivitatis } from '../../shared/affiliate/civitatis.js'

export const BOOKING_BLUE = '#003580'
/** Rojo de marca de Civitatis — deliberadamente distinto del azul de Booking, para que quede claro que llevan a sitios distintos. */
export const CIVITATIS_RED = '#E2231A'

// (Tanda 6z: ya no hay enlace de hoteles a otra web; todos los botones de hoteles abren el mapa de alojamientos de la app.)

/** Buscador de Civitatis. `query` es la búsqueda curada del destino ("pompeya desde roma"). */
export function buildActivitySearchUrl(query: string): string {
  return civitatisSearchUrl(query)
}

/**
 * El código de campaña de cada viaje en los enlaces de «Reservar» (PARA_CODE_RESERVAS, 5): así, cuando llega una venta con ese código, se sabe a
 * qué viaje pertenece sin saber nada del viajero (el código es al azar, `app-8F3K2`: ni nombre, ni email, ni nada del viaje).
 *
 * Solo en los enlaces de Civitatis. La documentación pública del programa solo explica `?aid=XXX` (el número de afiliado); el nombre del campo de
 * campaña es el que el panel del afiliado deja poner en cada enlace: se lee de `VITE_AFFILIATE_CAMPAIGN_PARAM` (por defecto `cmp`) y el número de
 * afiliado es siempre el 5206 (Tanda 6o): todos los enlaces de Civitatis de la app lo llevan sin tocar una sola pantalla.
 */
const CAMPAIGN_PARAM = (import.meta.env.VITE_AFFILIATE_CAMPAIGN_PARAM as string | undefined) || 'cmp'

/** El enlace de Civitatis con nuestro `aid` (siempre, `shared/affiliate/civitatis.js`) y el código de campaña del viaje si lo hay. Lo demás vuelve igual. */
export function withCampaign(url: string, campaignCode: string | null | undefined): string {
  return stampCivitatis(url, { campaignParam: CAMPAIGN_PARAM, campaignCode })
}
