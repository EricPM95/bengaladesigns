import { esDestinoDeCoche } from '../../../lib/experienceCategoryBank'
import type { PuntoDeLista, SeccionDeLista } from './disenoLista'

/**
 * (LZ2b1) «La lista del pase de Lanzarote» (`docs/destinos/lanzarote/LANZAROTE_EXPLORAR_Y_PASE.md`): la de Roma (`disenoLista.ts`, generada de Design) con los textos de la isla.
 * Lo que aún NO existe en Lanzarote (el aviso de nubes y viento, los logros) sale FUERA de la lista; los textos que hablan de andar, de tren o de baños pasan a coche, ferry y gasolineras.
 * Roma y los demás destinos: la lista tal cual (esta función devuelve lo mismo que recibe).
 */
const TEXTOS: Record<string, string> = {
  'Pon tu vuelo o tu tren y el primer y el último día se ajustan a tus horas.': 'Pon tu vuelo o el ferry y el primer y el último día se ajustan a tus horas.',
  'Ordenamos tus días según tu llegada, tu vuelta y los cierres de los monumentos.': 'Ordenamos tus días según tu llegada, tu vuelta y los cierres de los sitios.',
  'Tu día paso a paso: la siguiente parada en grande, los minutos andando y cómo llegar.': 'Tu día paso a paso: la siguiente parada en grande, con los minutos en coche y dónde aparcar.',
  'Los baños, las fuentes de agua y dónde comer más cercanos, estés donde estés.': 'Las gasolineras, los aparcamientos y dónde comer más cercanos, estés donde estés.',
  'Con los minutos andando y cómo llegar.': 'Con los minutos en coche y dónde aparcar.',
  'Baños, fuentes de agua y dónde comer, los más cercanos.': 'Gasolineras, aparcamientos y dónde comer, los más cercanos.',
  'Escucha la historia de cada sitio, como una audioguía en tu móvil.': 'Escucha la historia de los 12 sitios que la tienen, como una audioguía en tu móvil.',
  'Tus logros, HOY y las historias siguen contigo.': 'HOY y las historias siguen contigo.',
  'Vuelve a Roma cuando quieras': 'Vuelve a Lanzarote cuando quieras',
  'Escucha la historia de cada sitio': 'Escucha la historia de los 12 sitios',
}
const QUITAR_FILAS = new Set(['Los avisos del día', 'Tus logros, mientras viajas'])
const QUITAR_SECCIONES = /LOGROS/i

const adaptar = (fila: PuntoDeLista): PuntoDeLista => ({ ...fila, titulo: TEXTOS[fila.titulo] ?? fila.titulo, linea: TEXTOS[fila.linea] ?? fila.linea })

export function listaParaDestino(secciones: SeccionDeLista[], destino: string | null | undefined): SeccionDeLista[] {
  if (!esDestinoDeCoche(destino)) return secciones
  return secciones.filter((s) => !QUITAR_SECCIONES.test(s.titulo)).map((s) => ({ ...s, filas: s.filas.filter((f) => !QUITAR_FILAS.has(f.titulo)).map(adaptar) }))
}

export function tarjetasDeHoyParaDestino(tarjetas: PuntoDeLista[], destino: string | null | undefined): PuntoDeLista[] {
  if (!esDestinoDeCoche(destino)) return tarjetas
  return tarjetas.filter((f) => !QUITAR_FILAS.has(f.titulo)).map(adaptar)
}
