import type { Momento } from '../../../lib/logros'

/**
 * El reparto en pantallas de las sorpresas (Tanda 8B2). Pura: sin React. NO reordena: el orden lo manda el servidor (`ajustes.json › orden_momentos`, el único
 * sitio donde se decide) y aquí solo se AGRUPA lo que llega, en ese mismo orden:
 *   1) los pedazos nuevos, todos en una sola pantalla (en el sitio del primero);
 *   2) cada colección completada, una pantalla por colección;
 *   3) el Emblema Oculto y, si es de una maravilla, justo detrás su pantalla de la medalla («Tu primera maravilla · 1 de 7»);
 *   4) el sello, si sube;
 *   5) «Y además…» (país, destino, continente, Patrimonio, logros de viajero), en el sitio del primero.
 */
export type TipoPantalla = 'sello' | 'pedazos' | 'coleccion' | 'emblema' | 'ademas' | 'pais' | 'destino_nuevo' | 'continente' | 'maravilla' | 'patrimonio' | 'viajero'

export interface Pantalla {
  id: string
  tipo: TipoPantalla
  momentos: Momento[]
}

const FAMILIA_ADEMAS = new Set(['patrimonio', 'viajero', 'destino_nuevo', 'pais', 'continente'])
export const GRADOS = ['bronce', 'plata', 'oro', 'diamante'] as const

const texto = (m: Momento, k: string): string => String(m[k] ?? '')

export function planificar(momentos: Momento[]): Pantalla[] {
  const salida: Pantalla[] = []
  let pedazos: Pantalla | null = null
  let ademas: Pantalla | null = null
  momentos.forEach((m, i) => {
    if (m.tipo === 'suma') {
      if (!pedazos) salida.push((pedazos = { id: 'pedazos', tipo: 'pedazos', momentos: [] }))
      pedazos.momentos.push(m)
    } else if (m.tipo === 'suma_sello') {
      // El avance del sello ya se ve en las insignias y en el propio sello: sin pantalla.
    } else if (FAMILIA_ADEMAS.has(m.tipo)) {
      if (!ademas) salida.push((ademas = { id: 'ademas', tipo: 'ademas', momentos: [] }))
      ademas.momentos.push(m)
    } else salida.push({ id: `${m.tipo}${i}`, tipo: m.tipo as TipoPantalla, momentos: [m] })
  })
  // «Y además…» con uno solo es la pantalla de ese logro.
  if (ademas && ademas.momentos.length === 1) {
    ademas.tipo = ademas.momentos[0].tipo as TipoPantalla
    ademas.id = 'uno'
  }
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
  const mapa: Record<TipoPantalla, string> = { sello: 'sello', pedazos: 'pedazo', coleccion: 'coleccion', emblema: 'emblema', pais: 'pais', destino_nuevo: 'pais', continente: 'pais', maravilla: 'maravilla', patrimonio: 'patrimonio', viajero: 'viajero', ademas: 'viajero' }
  return mapa[t]
}

/** ¿A dónde vuela lo ganado? Lo del destino, al botón flotante; lo de viajero, al Perfil. */
export function destinoDelVuelo(t: TipoPantalla): 'logros' | 'perfil' {
  return t === 'sello' || t === 'pedazos' || t === 'coleccion' || t === 'emblema' ? 'logros' : 'perfil'
}

export function gradoAnterior(m: Momento): string | null {
  const g = texto(m, 'grado')
  const i = GRADOS.indexOf(g as (typeof GRADOS)[number])
  if (i <= 0) return null
  if (texto(m, 'sello') === 'vaticano' && g === 'plata') return null // el Vaticano no tiene bronce
  return GRADOS[i - 1]
}
