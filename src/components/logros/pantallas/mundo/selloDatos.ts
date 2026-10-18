import { sinTildes } from './paises'

export type FormaDeSello = 'round' | 'rect' | 'oval'

const MON: Record<string, string> = {
  roma: 'M3 38 H57 M6 38 V15 Q30 4 54 15 V38 M6 23 H54 M6 30 H54 M11 38 V33 Q13.5 30.5 16 33 V38 M21 38 V33 Q23.5 30.5 26 33 V38 M34 38 V33 Q36.5 30.5 39 33 V38 M44 38 V33 Q46.5 30.5 49 33 V38 M11 23 V19 Q13.5 16.5 16 19 V23 M21 23 V18 Q23.5 15.5 26 18 V23 M34 23 V18 Q36.5 15.5 39 18 V23 M44 23 V19 Q46.5 16.5 49 19 V23',
  florencia: 'M6 38 H54 M10 38 V25 H44 V38 M16 25 Q27 3 38 25 M27 8 V3 M25 5 H29 M20 38 V32 Q22 29 24 32 V38 M30 38 V32 Q32 29 34 32 V38 M46 38 V14 H52 V38 M46 20 H52',
  paris: 'M18 39 L28 5 H32 L42 39 M22 27 H38 M25 17 H35 M24 39 Q30 31 36 39 M30 5 V0',
  lisboa: 'M18 38 V18 H42 V38 M14 38 H46 M22 18 V11 H38 V18 M26 11 V5 H34 V11 M24 26 H28 M32 26 H36 M28 38 V32 Q30 29 32 32 V38',
  atenas: 'M5 38 H55 M8 34 H52 M11 34 V17 M19 34 V17 M27 34 V17 M35 34 V17 M43 34 V17 M50 34 V17 M8 17 H52 M6 13 L30 5 L54 13 Z',
  amsterdam: 'M3 38 V19 L9 12 L15 19 V38 M15 38 V15 L21 7 L27 15 V38 M27 38 V20 L33 14 L39 20 V38 M39 38 V16 L45 10 L51 16 V38 M1 38 H57 M7 25 H11 M19 21 H23 M31 27 H35 M43 23 H47',
  londres: 'M24 38 V13 H36 V38 M21 38 H39 M24 13 L30 2 L36 13 M26 21 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M27 30 H33',
  pisa: 'M3 38H57M25 38L28 8M35 38L38 8M25.6 31H35.6M26.3 24H36.3M27 17H37M27.6 10H37.6M30 8V5H36V8',
}
MON.vaticano = MON.roma

/** «Ciudad del Vaticano» cabe en un sello como «Vaticano». */
export const corto = (s: string): string => s.replace(/^Ciudad del /i, '')

/** El dibujo del monumento de un sitio, o cadena vacía si no hay. */
export const monumentoDe = (sitio: string): string => MON[sinTildes(corto(sitio))] ?? ''

export const TINTAS = ['oklch(0.42 0.11 255)', 'oklch(0.42 0.1 155)', 'oklch(0.42 0.07 45)', 'oklch(0.4 0.09 320)', 'oklch(0.44 0.08 200)']
const FORMAS: FormaDeSello[] = ['round', 'rect', 'oval']

/** La forma y la tinta de un sello salen de su sitio y de su fecha: siempre las mismas, sin guardar nada. */
export function aspectoDeSello(sitio: string, fecha: string | null): { forma: FormaDeSello; tinta: string } {
  let h = 0
  for (const ch of `${sitio}|${fecha ?? ''}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return { forma: FORMAS[h % FORMAS.length], tinta: TINTAS[(h >>> 3) % TINTAS.length] }
}

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
/** «2026-10-13» → «13 OCT 2026». */
export const fechaDeSello = (f: string | null): string => (f ? `${Number(f.slice(8, 10))} ${MESES[Number(f.slice(5, 7)) - 1]} ${f.slice(0, 4)}` : '')

