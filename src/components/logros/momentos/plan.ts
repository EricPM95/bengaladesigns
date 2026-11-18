import type { Momento } from '../../../lib/logros'
import ajustes from '../../../../data/logros/ajustes.json'

/**
 * El reparto en pantallas de las sorpresas (Tanda 8B2). Pura: sin React. NO reordena: el orden lo manda el servidor (`ajustes.json › orden_momentos`, el único
 * sitio donde se decide) y aquí solo se AGRUPA lo que llega, en ese mismo orden:
 *   (V3, regla de Eric, de uno en uno: lo del SITIO primero, lo GENERAL después; nunca dos pantallas a la vez)
 *   (V6) 1) los pedazos nuevos de TODAS las colecciones que avanzan sin completarse, en UNA pantalla;
 *   2) el Emblema Oculto (si es de una maravilla, su película; la maravilla va en «Y además…» como una tarjeta pequeña, 8B4);
 *   3) cada colección completada, una pantalla por colección;
 *   4) el sello, si sube;
 *   5) «Y además…» (país, destino, continente, maravilla, Patrimonio, logros de viajero), en el sitio del primero;
 *   6) la SÉPTIMA maravilla tiene su propia pantalla: «El final de las 7 maravillas» (la única animación de la medalla).
 */
export type TipoPantalla = 'sello' | 'pedazos' | 'coleccion' | 'emblema' | 'ademas' | 'pais' | 'destino_nuevo' | 'continente' | 'maravilla' | 'final7' | 'patrimonio' | 'viajero'

export interface Pantalla {
  id: string
  tipo: TipoPantalla
  momentos: Momento[]
}

const FAMILIA_ADEMAS = new Set(['patrimonio', 'viajero', 'destino_nuevo', 'pais', 'continente', 'maravilla'])
export const GRADOS = ['bronce', 'plata', 'oro', 'diamante'] as const

const texto = (m: Momento, k: string): string => String(m[k] ?? '')

/**
 * Cada respuesta del servidor ya llega en su orden. Pero lo ganado al tocar [Visto] y lo ganado con la foto llegan en dos respuestas, y se enseñan juntos: para que el orden siga
 * siendo UNO solo, aquí se ordena el conjunto con la MISMA lista del servidor (`data/logros/ajustes.json › orden_momentos`, leída tal cual, no copiada). Con una sola respuesta no cambia nada.
 */
export function ordenarComoElServidor(momentos: Momento[]): Momento[] {
  const orden: string[] = ajustes.orden_momentos
  const rango = (m: Momento) => {
    const i = orden.indexOf(String(m.cat ?? m.tipo))
    return i < 0 ? orden.length : i
  }
  const lista = momentos.map((m, i) => ({ m, i })).sort((a, b) => rango(a.m) - rango(b.m) || a.i - b.i).map(({ m }) => m)
  return lista
}

/** (V6, regla de Eric) El orden de las pantallas: las colecciones que avanzan (todas juntas) → cada colección completa → cada emblema oculto → el sello → lo demás (lo del viajero). */
const RANGO: Partial<Record<TipoPantalla, number>> = { pedazos: 0, coleccion: 1, emblema: 2, sello: 3, final7: 4 }

export function planificar(momentos: Momento[]): Pantalla[] {
  const salida: Pantalla[] = []
  let pedazos: Pantalla | null = null
  let ademas: Pantalla | null = null
  // (V6) Una colección que se COMPLETA tiene su pantalla: su último pedazo no sale en la de los pedazos nuevos (se marca como visto con la de la colección).
  const completadas = new Set(momentos.filter((m) => m.tipo === 'coleccion').map((m) => texto(m, 'id')))
  const sueltos: Momento[] = []
  momentos.forEach((m, i) => {
    if (m.tipo === 'suma') {
      // (V6) TODAS las colecciones que avanzan sin completarse, en UNA sola pantalla (cada insignia con su trozo nuevo).
      if (completadas.has(texto(m, 'coleccion'))) {
        sueltos.push(m)
        return
      }
      if (!pedazos) salida.push((pedazos = { id: 'pedazos', tipo: 'pedazos', momentos: [] }))
      pedazos.momentos.push(m)
    } else if (m.tipo === 'suma_sello') {
      // El avance del sello ya se ve en las insignias y en el propio sello: sin pantalla.
    } else if (m.tipo === 'maravilla' && Number(m.n ?? 0) >= 7) {
      salida.push({ id: 'final7', tipo: 'final7', momentos: [m] })
    } else if (FAMILIA_ADEMAS.has(m.tipo)) {
      if (!ademas) salida.push((ademas = { id: 'ademas', tipo: 'ademas', momentos: [] }))
      ademas.momentos.push(m)
    } else salida.push({ id: `${m.tipo}${i}`, tipo: m.tipo as TipoPantalla, momentos: [m] })
  })
  // «Y además…» con uno solo es la pantalla de ese logro.
  if (ademas && ademas.momentos.length === 1 && ademas.momentos[0].tipo !== 'maravilla') {
    ademas.tipo = ademas.momentos[0].tipo as TipoPantalla
    ademas.id = 'uno'
  }
  for (const m of sueltos) salida.find((p) => p.tipo === 'coleccion' && texto(p.momentos[0], 'id') === texto(m, 'coleccion'))?.momentos.push(m)
  return salida.map((p, i) => ({ p, i })).sort((a, b) => (RANGO[a.p.tipo] ?? 5) - (RANGO[b.p.tipo] ?? 5) || a.i - b.i).map(({ p }) => p)
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
  const mapa: Record<TipoPantalla, string> = { sello: 'sello', pedazos: 'pedazo', coleccion: 'coleccion', emblema: 'emblema', pais: 'pais', destino_nuevo: 'pais', continente: 'pais', maravilla: 'maravilla', final7: 'maravilla', patrimonio: 'patrimonio', viajero: 'viajero', ademas: 'viajero' }
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
