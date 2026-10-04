// Los 20 viajes de ejemplo (regla 32), parada a parada y con sus horas.
//   node scripts/destino/viajesEjemplo.mjs   →   docs/reglas/VIAJES_EJEMPLO.md
import { writeFileSync } from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'

const D = findPipelineV2Data('Roma')
const VAT = 'Museos Vaticanos y Capilla Sixtina'

const VIAJES = [
  { n: 1, titulo: '1 día en enero', fecha: '2027-01-12', dias: 1 },
  { n: 2, titulo: '1 día en julio', fecha: '2027-07-14', dias: 1 },
  { n: 3, titulo: '1 día con Free Tour', fecha: '2027-04-20', dias: 1, ft: true },
  { n: 4, titulo: '1 día con Museos Vaticanos en el pool', fecha: '2027-10-12', dias: 1, pool: [VAT] },
  { n: 5, titulo: '2 días en abril', fecha: '2027-04-13', dias: 2 },
  { n: 6, titulo: '2 días con el Coliseo y los Museos Vaticanos en el pool', fecha: '2027-05-18', dias: 2, pool: ['Coliseo', VAT] },
  { n: 7, titulo: '3 días en noviembre con Free Tour (18 al 20)', fecha: '2027-11-18', dias: 3, ft: true },
  { n: 8, titulo: '3 días en agosto', fecha: '2027-08-10', dias: 3 },
  { n: 9, titulo: '3 días «Arte y Museos»', fecha: '2027-03-09', dias: 3, exps: ['arte_museos'] },
  { n: 10, titulo: '3 días «Naturaleza y Vistas»', fecha: '2027-06-08', dias: 3, exps: ['naturaleza_vistas'] },
  { n: 11, titulo: '4 días en marzo con entrada al Coliseo a las 15:30', fecha: '2027-03-02', dias: 4, reservas: { Coliseo: '15:30' } },
  { n: 12, titulo: '4 días «Barrios y Sabores»', fecha: '2027-09-14', dias: 4, exps: ['barrios_sabores'] },
  { n: 13, titulo: '4 días en mayo con la Galería Borghese en el pool', fecha: '2027-05-04', dias: 4, pool: ['Galería Borghese'] },
  { n: 14, titulo: '5 días en octubre', fecha: '2027-10-19', dias: 5 },
  { n: 15, titulo: '5 días en diciembre con Mercadillos (20 al 24)', fecha: '2027-12-20', dias: 5, exps: ['mercadillos_navidenos'] },
  { n: 16, titulo: '5 días en junio con entrada a los Museos Vaticanos a las 13:00', fecha: '2027-06-15', dias: 5, reservas: { [VAT]: '13:00' } },
  { n: 17, titulo: '7 días en septiembre', fecha: '2027-09-07', dias: 7 },
  { n: 18, titulo: '7 días en febrero con Free Tour', fecha: '2027-02-09', dias: 7, ft: true },
  { n: 19, titulo: '3 días en Semana Santa (jueves 25 al sábado 27 de marzo)', fecha: '2027-03-25', dias: 3 },
  { n: 20, titulo: '3 días que empiezan en lunes', fecha: '2027-11-08', dias: 3 },
]

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const hora = (s) => s.suggested_time ?? ''

const out = []
out.push('# Los 20 viajes de ejemplo (regla 32)\n')
out.push('Fichero fijo para la revisión «como un local». Se vuelve a generar con `node scripts/destino/viajesEjemplo.mjs`; cada viaje está en 2027. Cada línea es una parada con su hora y su duración en minutos.\n')
const problemas = []

for (const v of VIAJES) {
  const positive = [...(v.ft ? ['free_tour'] : []), ...(v.exps ?? [])]
  out.push(`\n## ${v.n}. ${v.titulo}\n`)
  out.push(`Salida el ${DIAS[new Date(`${v.fecha}T12:00:00Z`).getUTCDay()]} ${v.fecha} · ${v.dias} día${v.dias === 1 ? '' : 's'}${v.ft ? ' · con Free Tour' : ''}${v.exps ? ` · ${v.exps.join(' + ')}` : ''}${v.pool ? ` · pool: ${v.pool.join(' + ')}` : ''}${v.reservas ? ` · entrada: ${Object.entries(v.reservas).map(([l, h]) => `${l} a las ${h}`).join(', ')}` : ''}\n`)
  for (let n = 1; n <= v.dias; n++) {
    const fecha = addDays(v.fecha, n - 1)
    let day = null
    try {
      day = await buildDayBlockV3(D, v.dias + 1, Boolean(v.ft), n, null, v.fecha, v.pool ?? [], positive.length ? ['imprescindibles', ...positive] : [], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4', ...(v.reservas ? { entradas: v.reservas } : {}) })
    } catch (error) {
      problemas.push(`Viaje ${v.n}, día ${n}: ${error?.message}`)
    }
    if (!day) { out.push(`### Día ${n} (${DIAS[new Date(`${fecha}T12:00:00Z`).getUTCDay()]} ${fecha}) — SIN DÍA\n`); continue }
    out.push(`### Día ${n} · ${DIAS[new Date(`${fecha}T12:00:00Z`).getUTCDay()]} ${fecha} · ${day.curated_day?.id ?? ''} ${day.curated_day?.name ?? day.title ?? ''}\n`)
    const filas = []
    for (const m of day.meals ?? []) filas.push({ t: m.suggested_time ?? '', txt: `**${m.time === 'lunch' ? 'Comida' : m.time === 'dinner' ? 'Cena' : m.time}** ${typeof m.restaurant === 'string' ? m.restaurant : m.restaurant?.name ?? ''}${m.window_end ? ` (hasta ${m.window_end}, ${m.zone ?? ''})` : ` (${m.zone ?? ''})`}` })
    for (const s of day.stops ?? []) filas.push({ t: hora(s), txt: `${s.display_title ?? s.night_view_title ?? s.name} · ${s.duration_minutes} min${s.visit_mode === 'fuera' ? ' · por fuera' : s.visit_mode === 'dentro' ? ' · por dentro' : ''}${s.pass_through ? ' · de paso' : ''}${s.is_night_experience || s.night_view ? ' · de noche' : ''}${s.transit ? ` · ${s.transit.label}` : ''}` })
    filas.sort((a, b) => String(a.t).localeCompare(String(b.t)))
    for (const f of filas) out.push(`- ${f.t} ${f.txt}`)
    for (const f of day.free_times ?? []) out.push(`- (hueco) ${f.minutes} min antes de ${f.before}${f.title ? ` «${f.title}»` : ''}`)
    if (day.transfer_notice) out.push(`- Traslado: ${day.transfer_notice}`)
    for (const it of day.not_included ?? []) out.push(`- No incluido: ${it.name} (${it.reason})`)
    out.push('')
  }
}
if (problemas.length) out.push(`\n## Fallos al generar\n\n${problemas.map((p) => `- ${p}`).join('\n')}\n`)
writeFileSync('docs/reglas/VIAJES_EJEMPLO.md', out.join('\n'))
console.log(`escrito: ${VIAJES.length} viajes, ${problemas.length} fallos`)
