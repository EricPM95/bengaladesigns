/**
 * Revisión de rutas V2 (pedida el 2026-09-26, tras los 10 arreglos para cerrar Roma): 18 viajes de 2, 3 y 4 días
 * (6 por duración, con la misma matriz de ritmo, Free Tour, experiencias y pool) y los 3 de festivos. Mismo
 * formato que REVISION_RUTAS_COMPLETAS.md, con tabla resumen por viaje al final. No arregla nada: es para leer.
 *
 *   node scripts/destino/revisionV2.mjs [salida.md]
 */

import { generarRevision } from './revisionLib.mjs'

const POOL_A = ['Galería Borghese', "Castillo de Sant'Angelo"]
const POOL_B = ['Termas de Caracalla', 'Basílica de San Clemente']

// Por duración: 1 completo Arte; 2 completo Naturaleza + pool A; 3 completo Free Tour + Barrios; 4 completo Free
// Tour + Arte + Naturaleza + pool B; 5 tranquilo Barrios + pool A; 6 tranquilo Free Tour + Naturaleza.
// Meses enero, abril, julio y octubre y salidas en lunes, miércoles, sábado y domingo, sin repetir la pareja
// mes-día dentro de una duración (2027: Pascua es el 28 de marzo, fuera de todos).
const MATRIZ = [
  { ritmo: 'completo', exps: ['arte_museos'] },
  { ritmo: 'completo', exps: ['naturaleza_vistas'], pool: POOL_A },
  { ritmo: 'completo', exps: ['free_tour', 'barrios_sabores'] },
  { ritmo: 'completo', exps: ['free_tour', 'arte_museos', 'naturaleza_vistas'], pool: POOL_B },
  { ritmo: 'tranquilo', exps: ['barrios_sabores'], pool: POOL_A },
  { ritmo: 'tranquilo', exps: ['free_tour', 'naturaleza_vistas'] },
]
const FECHAS = {
  2: ['2027-01-11', '2027-04-14', '2027-07-17', '2027-10-17', '2027-01-16', '2027-07-12'],
  3: ['2027-04-12', '2027-07-14', '2027-10-16', '2027-01-17', '2027-04-17', '2027-10-13'],
  4: ['2027-07-18', '2027-10-11', '2027-01-13', '2027-04-18', '2027-07-14', '2027-01-16'],
}

const VIAJES = [
  ...[2, 3, 4].flatMap((dias) => MATRIZ.map((fila, i) => ({ dias, fecha: FECHAS[dias][i], ...fila }))),
  // Festivos (punto 10): ningún imprescindible desaparece por estar cerrado.
  { dias: 2, fecha: '2026-12-24', ritmo: 'completo', exps: [] },
  { dias: 3, fecha: '2026-12-31', ritmo: 'completo', exps: [] },
  { dias: 2, fecha: '2027-05-01', ritmo: 'completo', exps: [] },
]

await generarRevision({
  viajes: VIAJES,
  path: process.argv[2] ?? 'docs/REVISION_RUTAS_V2.md',
  titulo: 'Revisión de rutas de Roma — V2',
  intro: [
    `Motor v3 tras los 10 arreglos para cerrar Roma, generado el ${new Date().toISOString().slice(0, 10)} con \`node scripts/destino/revisionV2.mjs\`. ${VIAJES.length} viajes: 6 de 2 días, 6 de 3 y 6 de 4 (misma matriz en cada duración: completo con Arte; completo con Naturaleza y pool A; completo con Free Tour y Barrios; completo con Free Tour, Arte y Naturaleza y pool B; tranquilo con Barrios y pool A; tranquilo con Free Tour y Naturaleza) y los 3 de festivos (24-25 de diciembre, 31 de diciembre al 2 de enero y 1-2 de mayo).`,
    '',
    `- **Pool A**: ${POOL_A.join(' y ')}. **Pool B**: ${POOL_B.join(' y ')}.`,
    '- Meses: enero, abril, julio y octubre; salidas en lunes, miércoles, sábado y domingo, sin repetir la pareja mes-día dentro de una duración.',
    '- Nada de lo que sale aquí está arreglado: la tabla resumen y "lo que parece raro" están al final.',
  ],
  resumen: true,
})
