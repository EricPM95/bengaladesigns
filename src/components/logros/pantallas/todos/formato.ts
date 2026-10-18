import type { FilaDeViajero, ItemGanado } from './api'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
/** «2026-10-11» → «11 oct 2026». */
export function fechaCorta(f: string | null | undefined): string {
  if (!f || !/^\d{4}-\d{2}-\d{2}/.test(f)) return ''
  return `${Number(f.slice(8, 10))} ${MESES[Number(f.slice(5, 7)) - 1]} ${f.slice(0, 4)}`
}

export const MAYUS = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

export const NOMBRE_DE_GRADO: Record<string, string> = { bronce: 'Bronce', plata: 'Plata', oro: 'Oro', diamante: 'Diamante' }
export const COLOR_DE_GRADO: Record<string, string> = { bronce: '#A8734A', plata: '#8F969E', oro: '#B8964F', diamante: '#7F93C9' }
/** El fondo de la tarjeta de un destino (la foto de portada aún no existe: un degradado del color de su sello). */
export const FONDO_DE_GRADO: Record<string, string> = {
  bronce: 'linear-gradient(160deg,#C9D8A0,#6E8E4A 55%,#3A4A26)',
  plata: 'linear-gradient(160deg,#D9DEE4,#8A93A0 55%,#4A525E)',
  oro: 'linear-gradient(160deg,#E7B98A,#B9764A 55%,#5E3A2A)',
  diamante: 'linear-gradient(160deg,#B8CDE6,#5E7FA8 55%,#2E3E5E)',
}

/** Los grupos de logros de viajero: su color (los del diseño) y su matiz. */
export const GRUPO: Record<string, { color: string; matiz: number }> = {
  mundo: { color: 'oklch(0.58 0.14 38)', matiz: 40 },
  tiempo: { color: 'oklch(0.62 0.13 75)', matiz: 80 },
  como_viajas: { color: 'oklch(0.55 0.1 118)', matiz: 118 },
  coleccionista: { color: 'oklch(0.5 0.12 330)', matiz: 330 },
}
export const NOMBRE_DE_GRUPO: Record<string, string> = { mundo: 'El mundo', tiempo: 'El tiempo', como_viajas: 'Cómo viajas', coleccionista: 'Coleccionista' }

/** «Logro de viajero · El mundo», «Sello de ciudad · Oro»…: la etiqueta de arriba de cada pieza. */
export function etiquetaDe(it: Pick<ItemGanado, 'tipo' | 'grupo' | 'grado'>): string {
  switch (it.tipo) {
    case 'viajero':
      return `Logro de viajero · ${NOMBRE_DE_GRUPO[it.grupo ?? ''] ?? ''}`.replace(/ · $/, '')
    case 'sello':
      return `Sello de ciudad · ${NOMBRE_DE_GRADO[it.grado ?? ''] ?? ''}`.replace(/ · $/, '')
    case 'coleccion':
      return 'Colección completada'
    case 'emblema':
      return 'Emblema secreto'
    case 'maravilla':
      return 'Las 7 maravillas'
    case 'exclusivo':
      return 'Exclusivo'
  }
}

/** «Conseguido el 11 oct 2026», «Oro desde el 13 oct 2026»… */
export function cuandoDe(it: Pick<ItemGanado, 'tipo' | 'grado' | 'fecha'>): string {
  const f = fechaCorta(it.fecha)
  switch (it.tipo) {
    case 'sello':
      return `${NOMBRE_DE_GRADO[it.grado ?? ''] ?? ''} desde el ${f}`.trim()
    case 'coleccion':
      return `Completada el ${f}`
    case 'emblema':
      return `Encontrado el ${f}`
    case 'maravilla':
      return `Conseguida el ${f}`
    default:
      return `Conseguido el ${f}`
  }
}

/** «10 países visitados», «1 viaje»… la cuenta de una familia con escalones. */
export function cuentaDeFila(f: FilaDeViajero): string {
  if (!f.cuenta) return ''
  return `${f.cuenta.n} ${f.cuenta.n === 1 ? f.cuenta.unidad_uno : f.cuenta.unidad_varios}`
}

/** «te faltan 5 para Horizonte sin fin» (con la mayúscula del diseño en la ficha). */
export function textoSiguiente(f: FilaDeViajero): string | null {
  if (!f.siguiente) return null
  return `te ${f.siguiente.faltan === 1 ? 'falta 1' : `faltan ${f.siguiente.faltan}`} para ${f.siguiente.nombre}`
}
