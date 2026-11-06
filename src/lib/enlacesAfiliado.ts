/**
 * LOS ENLACES DE AFILIADO, EN UN SOLO SITIO (Eric, 6-nov). Los usan RESERVAS (el vuelo, el coche, «Útil para el viaje») y HOY (seguro, eSIM, tarjeta). Para cambiar un código se cambia AQUÍ y en ningún otro archivo.
 * Nunca el nombre de la web en el texto de un botón: este archivo solo da direcciones.
 *
 * Comprobados el 6-nov con `curl -I` (las cuatro responden):
 *  · Vuelos (Skyscanner, red Impact): `https://skyscanner.pxf.io/B539xL` lleva a skyscanner.es con el identificador de afiliado. Con `?u=<dirección codificada>` (enlace profundo) acaba en LA BÚSQUEDA,
 *    por ejemplo `…/transporte/vuelos/bcn/ace/261108/261113/` (BCN → ACE, 8-13 nov), con el identificador de afiliado conservado.
 *  · Seguro (IATI): la página de inicio con `?r=` (responde 200).
 *  · eSIM (Holafly, red Impact): pasa por su redirección de afiliado (`holafly.sjv.io`, con `subId1=JUTRIP`) y acaba en esim.holafly.com/es.
 *  · Coche (DiscoverCars): `?a_aid=JUTRIP` en la portada en español (responde 200 y pone su cookie de afiliado `clickAf`). Su búsqueda con lugar y fechas NO se puede escribir en una dirección que se pueda
 *    comprobar desde fuera (las páginas de ubicación dan 404 y la búsqueda va por su formulario), así que se queda la portada con el código: nunca se inventa una dirección que no se ha visto abrir.
 * La tarjeta sin comisiones no lleva código (todavía).
 */
import { iatasDeCiudad } from './aeropuertosCiudad'
import { cityCode } from '../components/trazo/cityCode'

export const AFILIADO_VUELOS = 'https://skyscanner.pxf.io/B539xL'
export const AFILIADO_SEGURO = 'https://www.iatiseguros.com/?r=60565847640308'
export const AFILIADO_ESIM = 'https://holafly.sjv.io/NGxJQK'
export const AFILIADO_COCHE = 'https://www.discovercars.com/es?a_aid=JUTRIP'
export const AFILIADO_TARJETA = 'https://n26.com'

/** `2026-11-08` → `261108` (el formato de fecha de la búsqueda de vuelos). null si no es una fecha. */
export function fechaParaBuscador(iso: string | null | undefined): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '')
  return m ? `${m[1].slice(2)}${m[2]}${m[3]}` : null
}

/**
 * El código del buscador de una ciudad: el IATA de su aeropuerto si tiene uno solo (BCN, ACE), el de ciudad si tiene varios (ROM, LON). Sin ciudad en la tabla, null: nunca se inventa un código.
 * (`cityCode` da las tres primeras letras de las ciudades que no conoce: aquí solo se usa si la ciudad está en la tabla de aeropuertos.)
 */
export function codigoParaBuscador(ciudad: string | null | undefined): string | null {
  const nombre = (ciudad ?? '').split(',')[0].trim()
  if (!nombre) return null
  const iatas = iatasDeCiudad(nombre)
  if (iatas.length === 0) return null
  return (iatas.length === 1 ? iatas[0] : cityCode({ name: nombre })).toLowerCase()
}

/** Dirección de la búsqueda en el buscador de vuelos (sin afiliado): origen, destino y fechas del viaje; sin lo que no se sepa, la portada del buscador. */
export function direccionDeBusquedaDeVuelos(datos: { origen?: string | null; destino?: string | null; ida?: string | null; vuelta?: string | null }): string {
  const origen = codigoParaBuscador(datos.origen)
  const destino = codigoParaBuscador(datos.destino)
  if (!origen || !destino) return 'https://www.skyscanner.es/'
  const ida = fechaParaBuscador(datos.ida)
  const vuelta = ida ? fechaParaBuscador(datos.vuelta) : null
  return `https://www.skyscanner.es/transporte/vuelos/${origen}/${destino}/${ida ? `${ida}/` : ''}${vuelta ? `${vuelta}/` : ''}?adultsv2=1${vuelta ? '&rtn=1' : ida ? '&rtn=0' : ''}`
}

/** [Buscar vuelos]: el enlace de afiliado con la búsqueda del viaje (enlace profundo `?u=`). Sin datos, el enlace de afiliado a secas. */
export function enlaceBuscarVuelos(datos: { origen?: string | null; destino?: string | null; ida?: string | null; vuelta?: string | null } = {}): string {
  const destinoFinal = direccionDeBusquedaDeVuelos(datos)
  return destinoFinal === 'https://www.skyscanner.es/' ? AFILIADO_VUELOS : `${AFILIADO_VUELOS}?u=${encodeURIComponent(destinoFinal)}`
}

/** El enlace de alquiler de coche con nuestro código. */
export function enlaceAlquilerDeCoche(): string {
  return AFILIADO_COCHE
}
