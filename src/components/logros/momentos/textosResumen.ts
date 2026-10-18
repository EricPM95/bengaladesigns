/**
 * LOS TEXTOS DEL RESUMEN DEL DÍA Y DEL VIAJE (Tanda 8B5). Funciones puras (sin React) para poder probarlas: siempre empiezan por mayúscula, con el singular y el plural bien puestos.
 */

/** Las filas con número: «1 Pedazo nuevo», «2 Pedazos nuevos». */
export const FILAS: Record<string, [string, string]> = {
  pedazo: ['Pedazo nuevo', 'Pedazos nuevos'],
  coleccion: ['Colección completa', 'Colecciones completas'],
  emblema: ['Emblema Oculto', 'Emblemas Ocultos'],
  pais: ['País nuevo', 'Países nuevos'],
  destino_nuevo: ['Destino nuevo', 'Destinos nuevos'],
  continente: ['Continente nuevo', 'Continentes nuevos'],
  maravilla: ['Maravilla del mundo', 'Maravillas del mundo'],
  patrimonio: ['Patrimonio de la Humanidad', 'Patrimonios de la Humanidad'],
  viajero: ['Logro de viajero', 'Logros de viajero'],
}
export const ORDEN_FILAS = ['pedazo', 'coleccion', 'emblema', 'pais', 'destino_nuevo', 'continente', 'maravilla', 'patrimonio', 'viajero']

export const fila = (clave: string, n: number): string => FILAS[clave]?.[n === 1 ? 0 : 1] ?? ''

/** «El Vaticano» → «del Vaticano»; «Roma» → «de Roma». */
const DE = (nombre: string): string => (/^el\s/i.test(nombre) ? `del ${nombre.replace(/^el\s/i, '')}` : `de ${nombre}`)
const NOMBRE_SELLO: Record<string, string> = { roma: 'Roma', vaticano: 'El Vaticano' }

/** La fila del sello (sin número): si nace, «Tu sello de Roma, en bronce» («Tu sello del Vaticano, en plata»); si solo sube, «Tu sello sube a oro». */
export function textoDeSello(nace: boolean, selloId: string, grado: string, nombre?: string | null): string {
  if (!nace) return `Tu sello sube a ${grado}`
  return `Tu sello ${DE(nombre || NOMBRE_SELLO[selloId] || selloId)}, en ${grado}`
}

/** La línea de abajo del resumen: «Roma aún esconde 9 secretos.» / «…1 secreto.» / «Has encontrado todos los secretos de Roma.». */
export function lineaDeSecretos(ciudad: string, total: number, encontrados: number, antes = false): string | null {
  if (!(total > 0)) return null
  const lugar = ciudad || 'este destino'
  // Antes del viaje (nada encontrado y nada empezado): «Roma esconde 12 secretos», sin «aún».
  if (antes && encontrados === 0) return `${lugar} esconde ${total} ${total === 1 ? 'secreto' : 'secretos'}`
  const quedan = total - encontrados
  if (quedan <= 0) return `Has encontrado todos los secretos de ${lugar}.`
  return `${lugar} aún esconde ${quedan} ${quedan === 1 ? 'secreto' : 'secretos'}.`
}
