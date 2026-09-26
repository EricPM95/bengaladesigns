/**
 * Revisión completa de rutas para comprobar a mano: 33 viajes (sobre todo de 2, 3 y 4 días, y 3 en festivos),
 * con el motor actual. El formato y las comprobaciones viven en revisionLib.mjs.
 *
 *   node scripts/destino/revisionCompleta.mjs [salida.md]
 */

import { generarRevision } from './revisionLib.mjs'

// fecha: el primer día (AAAA-MM-DD); con ella salen el mes, el día de la semana y los horarios de ese día.
const VIAJES = [
  // 2 días
  { dias: 2, fecha: '2027-01-11', ritmo: 'completo', exps: ['arte_museos'] },
  { dias: 2, fecha: '2027-04-14', ritmo: 'tranquilo', exps: ['naturaleza_vistas'] },
  { dias: 2, fecha: '2027-07-17', ritmo: 'completo', exps: ['free_tour', 'barrios_sabores'] },
  { dias: 2, fecha: '2027-02-20', ritmo: 'tranquilo', exps: [], pool: ['Galería Borghese'] },
  { dias: 2, fecha: '2027-05-12', ritmo: 'completo', exps: ['barrios_sabores'], pool: ['Trastevere', "Castillo de Sant'Angelo"] },
  { dias: 2, fecha: '2027-07-12', ritmo: 'completo', exps: ['naturaleza_vistas'] },
  { dias: 2, fecha: '2027-01-13', ritmo: 'tranquilo', exps: ['arte_museos', 'barrios_sabores'] },
  { dias: 2, fecha: '2027-04-17', ritmo: 'completo', exps: [] },
  { dias: 2, fecha: '2027-08-04', ritmo: 'tranquilo', exps: ['free_tour'] },
  // 3 días
  { dias: 3, fecha: '2027-04-12', ritmo: 'completo', exps: ['arte_museos'] },
  { dias: 3, fecha: '2027-07-14', ritmo: 'tranquilo', exps: ['barrios_sabores'] },
  { dias: 3, fecha: '2027-01-16', ritmo: 'completo', exps: ['naturaleza_vistas'] },
  { dias: 3, fecha: '2027-05-15', ritmo: 'completo', exps: ['free_tour', 'arte_museos'], pool: ['Termas de Caracalla'] },
  { dias: 3, fecha: '2027-02-15', ritmo: 'tranquilo', exps: [] },
  { dias: 3, fecha: '2027-07-17', ritmo: 'completo', exps: ['barrios_sabores', 'naturaleza_vistas'], pool: ['Galería Borghese'] },
  { dias: 3, fecha: '2027-04-14', ritmo: 'tranquilo', exps: ['arte_museos'] },
  { dias: 3, fecha: '2027-08-07', ritmo: 'completo', exps: [] },
  { dias: 3, fecha: '2027-01-13', ritmo: 'tranquilo', exps: ['free_tour', 'naturaleza_vistas'] },
  // 4 días
  { dias: 4, fecha: '2027-01-11', ritmo: 'completo', exps: ['arte_museos', 'naturaleza_vistas'] },
  { dias: 4, fecha: '2027-04-17', ritmo: 'tranquilo', exps: ['barrios_sabores'] },
  { dias: 4, fecha: '2027-07-14', ritmo: 'completo', exps: ['free_tour'] },
  { dias: 4, fecha: '2027-05-10', ritmo: 'tranquilo', exps: [], pool: ["Castillo de Sant'Angelo", 'Basílica de San Clemente'] },
  { dias: 4, fecha: '2027-02-20', ritmo: 'completo', exps: ['naturaleza_vistas'] },
  { dias: 4, fecha: '2027-07-17', ritmo: 'completo', exps: ['arte_museos', 'barrios_sabores'], pool: ['Trastevere'] },
  { dias: 4, fecha: '2027-01-13', ritmo: 'tranquilo', exps: ['arte_museos'] },
  { dias: 4, fecha: '2027-04-12', ritmo: 'completo', exps: ['barrios_sabores', 'naturaleza_vistas'], pool: ['Termas de Caracalla'] },
  // Referencia: 1 y 5 días
  { dias: 1, fecha: '2027-05-15', ritmo: 'completo', exps: ['arte_museos'] },
  { dias: 1, fecha: '2027-01-11', ritmo: 'tranquilo', exps: [] },
  { dias: 5, fecha: '2027-04-12', ritmo: 'completo', exps: ['naturaleza_vistas', 'barrios_sabores'] },
  { dias: 5, fecha: '2027-07-17', ritmo: 'tranquilo', exps: ['free_tour', 'arte_museos'] },
  // Festivos (decisión del 2026-09-26): ningún imprescindible desaparece por estar cerrado.
  { dias: 2, fecha: '2026-12-24', ritmo: 'completo', exps: [] },
  { dias: 3, fecha: '2026-12-31', ritmo: 'completo', exps: [] },
  { dias: 2, fecha: '2027-05-01', ritmo: 'completo', exps: [] },
]

await generarRevision({
  viajes: VIAJES,
  path: process.argv[2] ?? 'docs/REVISION_RUTAS_COMPLETAS.md',
  titulo: 'Revisión completa de rutas de Roma',
  intro: [
    `Motor v3 tal cual está, generado el ${new Date().toISOString().slice(0, 10)} con \`node scripts/destino/revisionCompleta.mjs\`. ${VIAJES.length} viajes: sobre todo de 2, 3 y 4 días, dos de 1 y dos de 5 días como referencia, y 3 en festivos (24-25 de diciembre, 31 de diciembre al 2 de enero y 1-2 de mayo). Todos con fecha, así que los horarios, los cierres y la puesta de sol son los de ese día.`,
  ],
  comparaRitmos: true,
})
