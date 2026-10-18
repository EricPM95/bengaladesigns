import type { LogroDeColeccion, MiColeccionDatos } from './api'

/** Pequeñas funciones puras de las pantallas de un destino (fechas, nombres y colores del diseño). Sin React, para poder probarlas. */

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

/** «2026-10-11» → «11 oct 2026». */
export function fechaCorta(fecha: string | null | undefined): string {
  if (!fecha || !/^\d{4}-\d{2}-\d{2}/.test(fecha)) return ''
  return `${Number(fecha.slice(8, 10))} ${MESES_CORTOS[Number(fecha.slice(5, 7)) - 1]} ${fecha.slice(0, 4)}`
}

/** «Día 3 · mié 12» a partir del número de día de la ruta y su fecha. */
export function diaDeRuta(dia: { numero: number | null; fecha: string | null } | null | undefined): string {
  if (!dia) return ''
  const f = dia.fecha && /^\d{4}-\d{2}-\d{2}/.test(dia.fecha) ? new Date(`${dia.fecha.slice(0, 10)}T12:00:00Z`) : null
  const cuando = f ? `${DIAS_CORTOS[f.getUTCDay()]} ${f.getUTCDate()}` : ''
  return [dia.numero != null ? `Día ${dia.numero}` : '', cuando].filter(Boolean).join(' · ')
}

/** «Roma» → «de Roma»; «El Vaticano» → «del Vaticano». */
export function conDe(nombre: string): string {
  return /^el\s/i.test(nombre) ? `del ${nombre.replace(/^el\s/i, '')}` : `de ${nombre}`
}

export const COLOR_DE_GRADO: Record<string, string> = { bronce: '#A8734A', plata: '#8F969E', oro: '#B8964F', diamante: '#7F93C9' }

/** El degradado de la cabecera de cada destino (el color de su foto mientras no haya una). */
export const FONDO_DE_DESTINO: Record<string, string> = { roma: 'linear-gradient(160deg,#E7B98A,#B9764A 55%,#5E3A2A)' }
export const FONDO_POR_DEFECTO = 'linear-gradient(160deg,#B8CDE6,#5E7FA8 55%,#2E3E5E)'

/** Los colores de cada grupo de «Mi colección» (Dashboard › De viajero). */
export const COLOR_DE_GRUPO: Record<string, string> = {
  mundo: 'oklch(0.58 0.14 38)',
  tiempo: 'oklch(0.62 0.13 75)',
  como_viajas: 'oklch(0.55 0.1 118)',
  coleccionista: 'oklch(0.5 0.12 330)',
}

/** El nombre corto de cada logro cuando el servidor no trae uno propio (las familias con escalones; en «Mi colección» y en el «cómo conseguirlo»). */
export const NOMBRE_DE_FAMILIA: Record<string, string> = {
  paises: 'Países',
  destinos: 'Destinos',
  capitales: 'Capitales',
  patrimonios: 'Patrimonios',
  viajes: 'Viajes',
  con_quien_solo: 'A mi aire',
  con_quien_pareja: 'En pareja',
  con_quien_amigos: 'Con amigos',
  con_quien_familia: 'En familia',
  cazador_emblemas: 'Cazador de emblemas',
  coleccionista: 'Coleccionista',
  conocedor: 'Conocedor',
  ciudad_completa: 'Ciudad al completo',
  todos_secretos: 'Todos sus secretos',
}

/** La clave del icono de línea de cada logro (en `IC_ESCALONES` o `IC_UNICOS`, de `iconosDashboard.ts`), para el hueco por conseguir. */
export const ICONO_DE_LOGRO: Record<string, { escalones?: string; unico?: string }> = {
  paises: { escalones: 'globo' },
  destinos: { escalones: 'pin' },
  capitales: { escalones: 'capital' },
  patrimonios: { escalones: 'templo' },
  viajes: { escalones: 'maleta' },
  con_quien_solo: { escalones: 'brujula' },
  con_quien_pareja: { escalones: 'pareja' },
  con_quien_amigos: { escalones: 'amigos' },
  con_quien_familia: { escalones: 'familia' },
  cazador_emblemas: { escalones: 'lupa' },
  coleccionista: { escalones: 'grid' },
  conocedor: { escalones: 'ciudad' },
  cuatro_estaciones: { escalones: 'cuatro estaciones' },
  doce_meses: { unico: 'Los 12 meses' },
  destino_cuatro_estaciones: { unico: 'Un destino, cuatro estaciones' },
  dos_paises_en_un_dia: { unico: 'Viajero nacional' },
  viajero_nacional: { unico: 'Viajero nacional' },
  otro_lado_ecuador: { unico: 'Al otro lado del ecuador' },
  navidad_fuera: { unico: 'Navidad fuera de casa' },
  nochevieja_fuera: { unico: 'Nochevieja fuera de casa' },
  tres_viajes_ano: { unico: 'Tres viajes en un año' },
  de_sol_a_sol: { unico: 'De sol a sol' },
  alondra: { unico: 'Alondra' },
  buho: { unico: 'Búho' },
  dia_perfecto: { unico: 'Día perfecto' },
  viaje_perfecto: { unico: 'Viaje perfecto' },
  imparable: { unico: 'Imparable' },
  escapada: { unico: 'Escapada' },
  gran_viaje: { unico: 'Gran viaje' },
  el_fotografo: { unico: 'El fotógrafo' },
  diamante_primera: { unico: 'Diamante a la primera' },
  nunca_ultima_vez: { unico: 'Nunca es la última vez' },
  ciudad_completa: { unico: 'Roma al completo' },
  todos_secretos: { unico: 'Todos los secretos de Roma' },
  tres_oro: { unico: 'Tres ciudades de oro' },
  tres_diamante: { unico: 'Tres ciudades de diamante' },
}

/** Parte la lista de logros de un grupo en páginas de 9 (3 × 3). */
export function enPaginas<T>(lista: T[], por = 9): T[][] {
  const paginas: T[][] = []
  for (let i = 0; i < lista.length; i += por) paginas.push(lista.slice(i, i + por))
  return paginas.length ? paginas : [[]]
}

export interface PaginaDeColeccion {
  grupo: string
  nombre: string
  logros: LogroDeColeccion[]
}
/** Las páginas de «Mi colección»: un grupo por página; si tiene más de 9 logros, sigue en otra página. */
export function paginasDe(datos: MiColeccionDatos): PaginaDeColeccion[] {
  return datos.grupos.flatMap((g) => enPaginas(g.logros).map((logros) => ({ grupo: g.id, nombre: g.nombre, logros })))
}
