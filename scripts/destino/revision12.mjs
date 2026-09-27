/**
 * Revisión de las 12 rutas de Roma (PROMPT_RUTAS_CURADAS, Parte D.2): de 2 a 7 días, con y sin Free Tour, todas en
 * completo y sin experiencias, en los mismos meses y días de salida que la propuesta (docs/REVISION_12_RUTAS_PROPUESTA.md).
 * Mismo formato que las demás revisiones (revisionLib.mjs), con tabla resumen al final. No arregla nada: es para leer.
 *
 *   node scripts/destino/revision12.mjs [salida.md]
 */

import { generarRevision } from './revisionLib.mjs'

const VIAJES = [
  { dias: 2, fecha: '2027-05-14', ritmo: 'completo', exps: [] },
  { dias: 2, fecha: '2026-11-13', ritmo: 'completo', exps: ['free_tour'] },
  { dias: 3, fecha: '2027-04-22', ritmo: 'completo', exps: [] },
  { dias: 3, fecha: '2027-06-10', ritmo: 'completo', exps: ['free_tour'] },
  { dias: 4, fecha: '2027-09-16', ritmo: 'completo', exps: [] },
  { dias: 4, fecha: '2027-05-06', ritmo: 'completo', exps: ['free_tour'] },
  { dias: 5, fecha: '2027-07-12', ritmo: 'completo', exps: [] },
  { dias: 5, fecha: '2027-10-18', ritmo: 'completo', exps: ['free_tour'] },
  { dias: 6, fecha: '2027-04-05', ritmo: 'completo', exps: [] },
  { dias: 6, fecha: '2027-08-02', ritmo: 'completo', exps: ['free_tour'] },
  { dias: 7, fecha: '2027-06-21', ritmo: 'completo', exps: [] },
  { dias: 7, fecha: '2026-12-07', ritmo: 'completo', exps: ['free_tour'] },
]

await generarRevision({
  viajes: VIAJES,
  path: process.argv[2] ?? 'docs/REVISION_12_RUTAS.md',
  titulo: '12 rutas de Roma',
  intro: [
    `Motor v3 con las rutas curadas de PROMPT_RUTAS_CURADAS.md, generado el ${new Date().toISOString().slice(0, 10)} con \`node scripts/destino/revision12.mjs\`. Los 12 viajes de siempre: de 2 a 7 días, con y sin Free Tour, en completo y sin experiencias (los mismos meses y días de salida que la propuesta).`,
    '',
    '- Nada de lo que sale aquí está arreglado: la tabla resumen y "lo que parece raro" están al final.',
  ],
  resumen: true,
})
