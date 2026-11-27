import { lugarCon } from './articulos'

/**
 * (V75 §5, D1-D2) LA FRASE DE LA HOJA DE ELIMINAR UNA RESERVA: «¿Seguro que quieres eliminar {frase}?». Una sola función para todas las tarjetas de RESERVAS (y las nuevas de ferry, tren, autobús y otra),
 * con su artículo sacado de los datos del destino (`lugarCon`: «tu entrada del Coliseo», «tu excursión a La Graciosa»). Vale igual para todos los destinos.
 */
const minus = (t: string): string => (t ? t[0].toLowerCase() + t.slice(1) : t)

/** «tu vuelo de ida» / «tu tren de vuelta» / «tu ferry de ida» / «tu autobús de vuelta». */
export const queEliminarTramo = (modo: 'avion' | 'tren' | 'bus' | 'ferry' | string, esIda: boolean): string => `tu ${modo === 'tren' ? 'tren' : modo === 'bus' ? 'autobús' : modo === 'ferry' ? 'ferry' : 'vuelo'} de ${esIda ? 'ida' : 'vuelta'}`
export const queEliminarAlojamiento = (): string => 'tu alojamiento'
export const queEliminarCoche = (): string => 'tu coche de alquiler'
/** «tu entrada del Coliseo». */
export const queEliminarEntrada = (nombre: string): string => (nombre.trim() ? `tu entrada ${lugarCon('de', nombre.split(',')[0].trim())}` : 'tu entrada')
/** «tu excursión a La Graciosa»; si el nombre ya empieza por «Excursión» o «Tour» («Tour en kayak»), «tu excursión a…» no se repite: «tu reserva de Tour en kayak». */
export const queEliminarExcursion = (nombre: string): string => {
  const n = nombre.trim()
  if (!n) return 'tu excursión'
  if (/^excursi[oó]n\b/i.test(n)) return `tu ${minus(n)}`
  if (/^(tour|free tour|actividad|visita|paseo|ruta|crucero|taller|clase)\b/i.test(n)) return `tu reserva de ${n}`
  return `tu excursión ${lugarCon('a', n)}`
}
/** Las reservas nuevas (V75 §3): «tu ferry a La Graciosa», «tu tren a Florencia», «tu autobús a Siena»; «otra»: «tu reserva de Tour en kayak». `destino` es el lugar de llegada (o el nombre en «otra»). */
export const queEliminarTransporteNuevo = (tipo: 'ferry' | 'tren' | 'bus' | 'otra', destinoONombre: string): string => {
  const d = destinoONombre.trim()
  if (tipo === 'otra') return d ? `tu reserva de ${d}` : 'tu reserva'
  const palabra = tipo === 'bus' ? 'autobús' : tipo
  return d ? `tu ${palabra} ${lugarCon('a', d)}` : `tu ${palabra}`
}
