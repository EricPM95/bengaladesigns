import type { Momento } from '../../../lib/logros'

/**
 * El orden y el reparto en pantallas de las sorpresas (Tanda 8B). Pura: sin React.
 *
 * El orden sale de «Logros · Momentos» (apartado J del diseño): primero el sello, después las colecciones (todas juntas), el emblema secreto y, al final,
 * «Y además…» con los logros de viajero. El servidor manda los momentos con otro orden (`ajustes.json › orden_momentos`: emblema primero); aquí se reordena
 * porque manda el diseño.
 */
export type TipoPantalla = 'sello' | 'colecciones' | 'emblema' | 'ademas' | 'pais' | 'destino_nuevo' | 'continente' | 'maravilla' | 'patrimonio' | 'viajero'

export interface Pantalla {
  id: string
  tipo: TipoPantalla
  momentos: Momento[]
}

const FAMILIA_ADEMAS = new Set(['maravilla', 'patrimonio', 'viajero', 'destino_nuevo', 'pais', 'continente'])
export const GRADOS = ['bronce', 'plata', 'oro', 'diamante'] as const

const texto = (m: Momento, k: string): string => String(m[k] ?? '')

export function planificar(momentos: Momento[]): Pantalla[] {
  const sellos = momentos.filter((m) => m.tipo === 'sello')
  const colecciones = momentos.filter((m) => m.tipo === 'suma' || m.tipo === 'coleccion')
  const completas = new Set(momentos.filter((m) => m.tipo === 'coleccion').map((m) => texto(m, 'id')))
  // Una colección completada sustituye a su «suma»: sale una sola vez, con el círculo cerrado.
  const filasColecciones = colecciones.filter((m) => m.tipo === 'coleccion' || !completas.has(texto(m, 'coleccion')))
  const emblemas = momentos.filter((m) => m.tipo === 'emblema')
  const hayColiseo = emblemas.some((m) => texto(m, 'id') === 'coliseo')
  // La película del Coliseo ya lleva dentro «Tu primera maravilla»: no sale dos veces.
  const resto = momentos.filter((m) => FAMILIA_ADEMAS.has(m.tipo) && !(hayColiseo && m.tipo === 'maravilla' && texto(m, 'id') === 'coliseo'))

  const salida: Pantalla[] = []
  sellos.forEach((m, i) => salida.push({ id: `sello${i}`, tipo: 'sello', momentos: [m] }))
  if (filasColecciones.length > 0) salida.push({ id: 'colecciones', tipo: 'colecciones', momentos: filasColecciones })
  emblemas.forEach((m, i) => salida.push({ id: `emblema${i}`, tipo: 'emblema', momentos: [m] }))
  if (resto.length === 1) salida.push({ id: 'uno', tipo: resto[0].tipo as TipoPantalla, momentos: resto })
  else if (resto.length > 1) salida.push({ id: 'ademas', tipo: 'ademas', momentos: resto })
  return salida
}

/** Las claves (destino|logro|escalon) de lo que se ha visto en una pantalla, para `animacion-vista`. */
export function clavesDe(p: Pantalla): { destino: string; logro: string; escalon: string }[] {
  const salida: { destino: string; logro: string; escalon: string }[] = []
  for (const m of p.momentos) {
    if (m.tipo === 'suma') {
      for (const s of (m.sitios as string[] | undefined) ?? []) salida.push({ destino: texto(m, 'destino'), logro: 'pedazo', escalon: `${texto(m, 'coleccion')}:${s}` })
    } else if (typeof m.clave === 'string') {
      const [destino, logro, escalon = ''] = m.clave.split('|')
      salida.push({ destino, logro, escalon })
    }
  }
  return salida
}

/** El sonido de la pantalla (los nombres de `sonidos.json`). */
export function sonidoDePantalla(t: TipoPantalla): string {
  const mapa: Record<TipoPantalla, string> = { sello: 'sello', colecciones: 'coleccion', emblema: 'emblema', pais: 'pais', destino_nuevo: 'pais', continente: 'pais', maravilla: 'maravilla', patrimonio: 'patrimonio', viajero: 'viajero', ademas: 'viajero' }
  return mapa[t]
}

/** ¿A dónde vuela lo ganado? Lo del destino, al botón flotante; lo de viajero, al Perfil. */
export function destinoDelVuelo(t: TipoPantalla): 'logros' | 'perfil' {
  return t === 'sello' || t === 'colecciones' || t === 'emblema' ? 'logros' : 'perfil'
}

export function gradoAnterior(m: Momento): string | null {
  const g = texto(m, 'grado')
  const i = GRADOS.indexOf(g as (typeof GRADOS)[number])
  if (i <= 0) return null
  if (texto(m, 'sello') === 'vaticano' && g === 'plata') return null // el Vaticano no tiene bronce
  return GRADOS[i - 1]
}
