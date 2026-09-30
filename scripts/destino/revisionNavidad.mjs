/**
 * Revisión de Navidad (PROMPT_ROMA_NAVIDAD, 4): once viajes del 1 de diciembre al 8 de enero (con los de Fin de Año), parada a parada y con horas,
 * para revisarlos como un local. La tabla y la auditoría, las de revision20.mjs.
 *   node scripts/destino/revisionNavidad.mjs [docs/revision/NAVIDAD_ROMA.md]
 */
const V = (dias, ft, fecha, exps = [], nota) => ({ dias, ft, exps, fecha, ...(nota ? { nota } : {}) })
const M = ['mercadillos_navidenos']
globalThis.__REVISION_VIAJES = [
  V(3, false, '2026-12-07', M, '7-9 de diciembre, con mercadillos (el 8, la Inmaculada)'),
  V(5, false, '2026-12-23', M, '23-27 de diciembre, con mercadillos (Nochebuena, Navidad y San Esteban)'),
  V(3, false, '2026-12-24', [], '24-26 de diciembre, sin mercadillos'),
  V(4, false, '2026-12-30', [], '30 de diciembre-2 de enero (Nochevieja y Año Nuevo)'),
  V(2, false, '2026-12-31', [], '31 de diciembre-1 de enero'),
  V(5, false, '2027-01-04', M, '4-8 de enero, con mercadillos (Reyes el 6; el 7 y el 8, ya fuera de fechas)'),
  // Fin de Año (PROMPT_ROMA_FIN_DE_ANO, 1).
  V(4, false, '2026-12-29', [], '29 de diciembre-1 de enero'),
  V(4, true, '2026-12-31', [], '31 de diciembre-3 de enero, con Free Tour'),
  V(6, false, '2026-12-28', [], '28 de diciembre-2 de enero'),
  V(3, false, '2027-01-01', [], '1-3 de enero (sin la Nochevieja en el viaje)'),
  V(3, false, '2027-01-05', M, '5-7 de enero, con mercadillos (último día de Navona y la Befana)'),
]
globalThis.__REVISION_SCRIPT = 'scripts/destino/revisionNavidad.mjs'
globalThis.__REVISION_TITULO = '# Roma en Navidad y Fin de Año: 11 viajes para revisar como un local'
if (process.env.ROUTE_ENGINE && process.env.ROUTE_ENGINE.toLowerCase() !== 'v4') throw new Error(`ROUTE_ENGINE=${process.env.ROUTE_ENGINE}: esta revisión es de v4`)
if (!process.argv[2]) process.argv[2] = 'docs/revision/NAVIDAD_ROMA.md'
await import('./revision20.mjs')
