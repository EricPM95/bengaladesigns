/**
 * LA TARJETA DEL DÍA DE VUELTA SIN HORA (Tanda 10B). Los textos y su variación según cómo vuelve el viajero (el medio que eligió en el formulario).
 * El número de ventajas sale SIEMPRE de la lista `data/pase/incluye.json` (una cosa por línea, sacada de «EN EL PASE» de docs/dias/GRATIS_Y_PASE.md), nunca a ojo:
 * con 21 o más, «más de 20 ventajas»; con menos, el número exacto.
 */
import incluye from '../../data/pase/incluye.json'
import type { ArrivalMode } from './arrivalReturn'

/** Cuántas cosas incluye hoy el pase (cada una por separado). */
export const totalVentajasDelPase = (lista: { ventajas: unknown[] } = incluye): number => lista.ventajas.length

/** «más de 20 ventajas» (con 21 o más, también con 30 o más) o, con menos, «N ventajas». */
export function textoDeVentajas(n: number): string {
  return n >= 21 ? 'más de 20 ventajas' : `${n} ventaja${n === 1 ? '' : 's'}`
}

/** El medio de la vuelta; null = no lo sabemos (el viajero no eligió ninguno). */
export type MedioDeVuelta = ArrivalMode | null

/** «tu vuelo», «tu tren»… (en coche, «tu hora de salida»; si no lo sabemos, «tu vuelo o tu tren»). */
export function tuMedio(modo: MedioDeVuelta): string {
  switch (modo) {
    case 'avion': return 'tu vuelo'
    case 'tren': return 'tu tren'
    case 'bus': return 'tu autobús'
    case 'ferry': return 'tu ferry'
    case 'coche': return 'tu hora de salida'
    default: return 'tu vuelo o tu tren'
  }
}

/** «la hora de tu vuelo» (en coche, «tu hora de salida», sin repetir). */
const laHoraDe = (modo: MedioDeVuelta): string => (modo === 'coche' ? 'tu hora de salida' : `la hora de ${tuMedio(modo)}`)

/** «llegar con tiempo al aeropuerto» → a la estación, al puerto; en coche, «salir con tiempo». */
function llegarConTiempo(modo: MedioDeVuelta): string {
  switch (modo) {
    case 'avion': return 'llegar con tiempo al aeropuerto'
    case 'tren':
    case 'bus': return 'llegar con tiempo a la estación'
    case 'ferry': return 'llegar con tiempo al puerto'
    case 'coche': return 'salir con tiempo'
    default: return 'llegar con tiempo al aeropuerto o a la estación'
  }
}

/** El botón de añadir la hora, con el nombre del medio: [+ Vuelo], [+ Tren], [+ Autobús], [+ Ferry], [+ Hora de salida]. */
export function botonDeLaHora(modo: MedioDeVuelta): string {
  switch (modo) {
    case 'tren': return '+ Tren'
    case 'bus': return '+ Autobús'
    case 'ferry': return '+ Ferry'
    case 'coche': return '+ Hora de salida'
    default: return '+ Vuelo'
  }
}

export interface ParteDeTexto {
  texto: string
  /** Resaltada en oro, como «Pase de Roma» en `TextoConPase`. */
  oro?: boolean
}

export interface TextosDelUltimoDia {
  titulo: string
  partes: ParteDeTexto[]
  /** Con el pase: el botón de la hora ([+ Vuelo]…); sin el pase: [Ver el Pase de Roma]. */
  botonPrincipal: string
  botonLugares: string
}

export function textosDelUltimoDia({ modo, destino, conPase, ventajas = totalVentajasDelPase() }: { modo: MedioDeVuelta; destino: string; conPase: boolean; ventajas?: number }): TextosDelUltimoDia {
  const nombrePase = `Pase de ${destino}`
  if (conPase) {
    return {
      titulo: `Tu último día, a la medida de ${tuMedio(modo)}`,
      partes: [{ texto: `Pon ${laHoraDe(modo)} y te montamos la mañana con lo que te da tiempo a ver.` }],
      botonPrincipal: botonDeLaHora(modo),
      botonLugares: '+ Añadir mis lugares',
    }
  }
  return {
    titulo: `El último día, a la medida de ${tuMedio(modo)}`,
    partes: [
      { texto: `Entre dejar el alojamiento, la maleta y ${llegarConTiempo(modo)}, el día de vuelta es el más difícil de organizar. Con el ` },
      { texto: nombrePase, oro: true },
      { texto: `, pones ${laHoraDe(modo)} y te montamos la mañana para que la aproveches al máximo, sin prisas ni sustos. ¡Y no es todo: tienes ` },
      { texto: textoDeVentajas(ventajas), oro: true },
      { texto: ' y tu viaje en directo con HOY!' },
    ],
    botonPrincipal: `Ver el ${nombrePase}`,
    botonLugares: '+ Añadir mis lugares',
  }
}
