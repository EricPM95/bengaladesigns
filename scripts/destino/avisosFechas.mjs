/**
 * Avisos de fechas especiales de unos viajes (PROMPT_AVISO_FECHAS, Parte D): lo que sale en la ventana al entrar en
 * la ruta, tarjeta a tarjeta. Sin argumentos, los 6 viajes de la Parte D; con `salida.md`, además los escribe ahí.
 *
 *   node scripts/destino/avisosFechas.mjs [salida.md]
 */

import { writeFileSync } from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'

const D = findPipelineV2Data('Roma')
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export const VIAJES_PARTE_D = [
  { titulo: '2 días desde el domingo 26 de septiembre de 2027 (Vaticano en domingo)', dias: 2, fecha: '2027-09-26' },
  { titulo: '3 días desde el viernes 24 de diciembre de 2027 (Navidad)', dias: 3, fecha: '2027-12-24' },
  { titulo: '2 días desde el viernes 13 de agosto de 2027 (Ferragosto, cerrado todo el viaje)', dias: 2, fecha: '2027-08-13' },
  { titulo: '3 días desde el martes 1 de junio de 2027 (2 de junio y audiencia del miércoles)', dias: 3, fecha: '2027-06-01' },
  { titulo: '3 días desde el viernes 26 de marzo de 2027 (Pascua y Pasquetta)', dias: 3, fecha: '2027-03-26' },
  { titulo: '2 días sin fechas, mes de diciembre (solo los de temporada)', dias: 2, fecha: null, mes: 11 },
]

/** Los avisos de un viaje: los trae el primer día de ciudad (`date_notices`). */
export async function avisosDe({ dias, fecha, mes = null, ritmo = 'completo', exps = [], pool = [] }) {
  const positive = exps.length ? ['imprescindibles', ...exps] : []
  for (let n = 1; n <= dias; n++) {
    const day = await buildDayBlockV3(D, dias + 1, exps.includes('free_tour'), n, ritmo === 'completo' ? 'nonstop' : 'tranquilo', null, fecha, pool, positive, { city: 'Roma', scheduler: 'v3', month: mes })
    if (day?.date_notices) return day.date_notices
  }
  return []
}

/** Las tarjetas en Markdown. */
export function avisosMd(notices) {
  if (notices.length === 0) return ['_Ningún aviso._']
  return notices.flatMap((notice, index) => [
    `${index + 1}. **${notice.title}** · icono \`${notice.icon}\` · etiqueta del día: ${notice.day_number ? `«${notice.tag}» en el día ${notice.day_number}` : '— (sin fechas)'} · ${notice.kind}`,
    ...notice.texts.map((text) => `   > ${text}`),
  ])
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('avisosFechas.mjs')) {
  const out = []
  for (const viaje of VIAJES_PARTE_D) {
    const notices = await avisosDe(viaje)
    out.push(`## ${viaje.titulo}`, '', ...avisosMd(notices), '')
  }
  const text = out.join('\n')
  console.log(text)
  if (process.argv[2]) writeFileSync(process.argv[2], text)
}
void MESES
