import type { Excursion } from './types'

// (V18) Las partes puras del bloque de la excursión (sin React): las etiquetas de la tarjeta, solo las que son verdad, y el texto de «¿Qué hacemos con este día?».

export const D = {
  reloj: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  recogida: 'M5 17h14l-1.5-6h-11zM7 17v2M17 17v2M12 5v6',
  comida: 'M7 3v8a3 3 0 0 0 3 3v7M7 3v5M10 3v5M17 3c-2 2-2 6 0 8v10',
  entradas: 'M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4zM10 6v12',
  guia: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
}

export interface EtiquetaDeExcursion {
  id: 'duracion' | 'recogida' | 'comida' | 'entradas' | 'guia'
  icono: string
  texto: string
}

/** Pura: las etiquetas de la tarjeta, SOLO las que sean verdad según los datos de la excursión (nunca una que no sepamos). */
export function etiquetasDeExcursion(e: Pick<Excursion, 'durationText' | 'durationHours' | 'incluye' | 'recogida'>): EtiquetaDeExcursion[] {
  const lista: EtiquetaDeExcursion[] = []
  const duracion = e.durationText?.trim() || (e.durationHours ? `${String(e.durationHours).replace('.', ',')} h` : '')
  if (duracion) lista.push({ id: 'duracion', icono: D.reloj, texto: duracion })
  const recogida = (e.recogida ?? '').toLowerCase()
  if (/recogida/.test(recogida) && !/sin recogida|verificar/.test(recogida)) lista.push({ id: 'recogida', icono: D.recogida, texto: /hotel/.test(recogida) ? 'Recogida en el hotel' : 'Con recogida' })
  const incluye = (e.incluye ?? '').toLowerCase()
  if (/comida/.test(incluye) && !/comida no incluida|sin comida/.test(incluye)) lista.push({ id: 'comida', icono: D.comida, texto: 'Comida incluida' })
  if (/entrada/.test(incluye)) lista.push({ id: 'entradas', icono: D.entradas, texto: 'Entradas incluidas' })
  if (/gu[ií]a/.test(incluye)) lista.push({ id: 'guia', icono: D.guia, texto: 'Con guía' })
  return lista
}

/** Pura: «Montadme una ruta por Lanzarote» → «Una ruta por Lanzarote, hecha a tu medida» (vale para quien viaja solo). */
export const textoDeRutaPorDestino = (destino: string): string => `Una ruta por ${destino}, hecha a tu medida`
