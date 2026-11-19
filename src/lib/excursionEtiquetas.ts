import type { Excursion } from './types'
import type { NombreIcono } from './iconos'

// (V18) Las partes puras del bloque de la excursión (sin React): las etiquetas de la tarjeta, solo las que son verdad, y el texto de «¿Qué hacemos con este día?».


export interface EtiquetaDeExcursion {
  id: 'duracion' | 'recogida' | 'comida' | 'entradas' | 'guia'
  icono: NombreIcono
  texto: string
}

/** Pura: las etiquetas de la tarjeta, SOLO las que sean verdad según los datos de la excursión (nunca una que no sepamos). */
export function etiquetasDeExcursion(e: Pick<Excursion, 'durationText' | 'durationHours' | 'incluye' | 'recogida'>): EtiquetaDeExcursion[] {
  const lista: EtiquetaDeExcursion[] = []
  const duracion = e.durationText?.trim() || (e.durationHours ? `${String(e.durationHours).replace('.', ',')} h` : '')
  if (duracion) lista.push({ id: 'duracion', icono: 'reloj', texto: duracion })
  const recogida = (e.recogida ?? '').toLowerCase()
  if (/recogida/.test(recogida) && !/sin recogida|verificar/.test(recogida)) lista.push({ id: 'recogida', icono: 'coche', texto: /hotel/.test(recogida) ? 'Recogida en el hotel' : 'Con recogida' })
  const incluye = (e.incluye ?? '').toLowerCase()
  if (/comida/.test(incluye) && !/comida no incluida|sin comida/.test(incluye)) lista.push({ id: 'comida', icono: 'comida', texto: 'Comida incluida' })
  if (/entrada/.test(incluye)) lista.push({ id: 'entradas', icono: 'reservas', texto: 'Entradas incluidas' })
  if (/gu[ií]a/.test(incluye)) lista.push({ id: 'guia', icono: 'perfil', texto: 'Con guía' })
  return lista
}

/** Pura: «Montadme una ruta por Lanzarote» → «Una ruta por Lanzarote, hecha a tu medida» (vale para quien viaja solo). */
export const textoDeRutaPorDestino = (destino: string): string => `Una ruta por ${destino}, hecha a tu medida`
