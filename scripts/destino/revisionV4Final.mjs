/**
 * Revisión final de v4 (PROMPTS_PENDIENTES_CODE, retoque 3.11, 2026-09-29): los 35 viajes de revisión con el motor v4
 * (días escritos) y las horas de 5 en 5, día a día, con horas, paradas, comidas y avisos. Son los 5 fines de semana
 * normales de revision20.mjs y los 30 de revisionCierre.mjs; la tabla y la auditoría, las de revision20.mjs.
 *   node scripts/destino/revisionV4Final.mjs [docs/revision/REVISION_V4_FINAL.md]
 */
const V = (dias, ritmo, ft, fecha, exps = [], nota) => ({ dias, ritmo, ft, exps, fecha, ...(nota ? { nota } : {}) })
globalThis.__REVISION_VIAJES = [
  // Las 5 fechas normales (fines de semana A-E de revision20.mjs).
  V(2, 'completo', false, '2027-05-15', [], 'fin de semana A'),
  V(3, 'completo', false, '2027-10-08', [], 'fin de semana B'),
  V(3, 'completo', true, '2027-05-21', [], 'fin de semana C'),
  V(3, 'completo', false, '2027-06-12', [], 'fin de semana D'),
  V(4, 'completo', false, '2027-09-17', [], 'fin de semana E'),
  // Los 30 del cierre de Roma (revisionCierre.mjs).
  V(2, 'completo', false, '2027-01-21'), V(3, 'completo', false, '2027-01-15'), V(4, 'completo', false, '2027-02-04'),
  V(3, 'completo', false, '2027-02-19'), V(2, 'completo', false, '2027-03-02'), V(3, 'completo', true, '2027-03-06'),
  V(4, 'completo', false, '2027-03-12'), V(2, 'completo', true, '2027-04-10'), V(3, 'tranquilo', false, '2027-04-15'),
  V(5, 'completo', false, '2027-04-19', ['barrios_sabores']), V(3, 'completo', false, '2027-05-02'),
  V(3, 'completo', false, '2027-05-06', ['arte_museos']), V(4, 'completo', true, '2027-05-28'),
  V(3, 'tranquilo', true, '2027-06-04'), V(2, 'tranquilo', false, '2027-06-19'),
  V(3, 'completo', false, '2027-06-23', ['naturaleza_vistas']), V(3, 'completo', true, '2027-07-02'),
  V(4, 'tranquilo', false, '2027-07-08'), V(3, 'completo', false, '2027-07-24'), V(2, 'completo', false, '2027-08-07'),
  V(5, 'completo', true, '2027-08-23'), V(3, 'completo', false, '2027-09-03', ['barrios_sabores']),
  V(3, 'completo', true, '2027-09-10', ['arte_museos']), V(2, 'completo', false, '2027-09-28'),
  V(4, 'completo', false, '2027-10-01', ['naturaleza_vistas']), V(3, 'completo', false, '2027-10-29'),
  V(3, 'completo', true, '2027-11-12'), V(2, 'completo', false, '2027-11-27'), V(3, 'completo', false, '2027-12-10'),
  V(5, 'tranquilo', true, '2027-12-13'),
]
globalThis.__REVISION_SCRIPT = 'scripts/destino/revisionV4Final.mjs'
globalThis.__REVISION_TITULO = '# Revisión final de v4: 35 viajes (5 fechas normales + los 30 del cierre), horas de 5 en 5'
// v4 es el motor por defecto (WRITTEN_DAYS_DEFAULT); sin ROUTE_ENGINE puesto, este script lo usa.
if (process.env.ROUTE_ENGINE && process.env.ROUTE_ENGINE.toLowerCase() !== 'v4') throw new Error(`ROUTE_ENGINE=${process.env.ROUTE_ENGINE}: esta revisión es de v4`)
if (!process.argv[2]) process.argv[2] = 'docs/revision/REVISION_V4_FINAL.md'
await import('./revision20.mjs')
