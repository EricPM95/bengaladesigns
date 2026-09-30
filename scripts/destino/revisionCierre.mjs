/**
 * Cierre de Roma (2026-09-28): los 30 viajes de fechas normales del usuario (de enero a diciembre, sin festivos,
 * empezando cada día de la semana, de 2 a 5 días), con la misma revisión y la misma auditoría que revision20.mjs.
 *   node scripts/destino/revisionCierre.mjs docs/REVISION_CIERRE_ROMA.md
 */
const V = (dias, ft, fecha, exps = []) => ({ dias, ft, exps, fecha })
globalThis.__REVISION_VIAJES = [
  V(2, false, '2027-01-21'), V(3, false, '2027-01-15'), V(4, false, '2027-02-04'),
  V(3, false, '2027-02-19'), V(2, false, '2027-03-02'), V(3, true, '2027-03-06'),
  V(4, false, '2027-03-12'), V(2, true, '2027-04-10'), V(3, false, '2027-04-15'),
  V(5, false, '2027-04-19', ['barrios_sabores']), V(3, false, '2027-05-02'),
  V(3, false, '2027-05-06', ['arte_museos']), V(4, true, '2027-05-28'),
  V(3, true, '2027-06-04'), V(2, false, '2027-06-19'),
  V(3, false, '2027-06-23', ['naturaleza_vistas']), V(3, true, '2027-07-02'),
  V(4, false, '2027-07-08'), V(3, false, '2027-07-24'), V(2, false, '2027-08-07'),
  V(5, true, '2027-08-23'), V(3, false, '2027-09-03', ['barrios_sabores']),
  V(3, true, '2027-09-10', ['arte_museos']), V(2, false, '2027-09-28'),
  V(4, false, '2027-10-01', ['naturaleza_vistas']), V(3, false, '2027-10-29'),
  V(3, true, '2027-11-12'), V(2, false, '2027-11-27'), V(3, false, '2027-12-10'),
  V(5, true, '2027-12-13'),
]
globalThis.__REVISION_TITULO = '# Cierre de Roma: 30 viajes de fechas normales, tal como salen en la app'
if (!process.argv[2]) process.argv[2] = 'docs/REVISION_CIERRE_ROMA.md'
await import('./revision20.mjs')
