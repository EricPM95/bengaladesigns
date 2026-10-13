// Explorador de la llegada con horas (Tanda 7, motor): enseña los días de un viaje con su llegada.
//   node scripts/destino/verLlegada.mjs n=3 inicio=2027-06-08 hora=15:30 [punto=fco] [medio=avion] [zona=centro] [ft=12:00] [ftsinhora=1] [res=Coliseo@1@10:30,...] [json=1]
import { planEscenario, FT, sumarDias, toHHMM } from './llegadaLib.mjs'

const a = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const n = Number(a.n ?? 3)
const inicio = a.inicio === 'sin' ? null : a.inicio ?? '2027-06-08'
const reservasGrandes = (a.res ? a.res.split(',') : []).map((t) => {
  const [name, dia, time] = t.split('@')
  const nombre = { Coliseo: 'Coliseo', Museos: 'Museos Vaticanos y Capilla Sixtina', Galeria: 'Galería Borghese' }[name] ?? name
  return { name: nombre, dayNumber: Number(dia), dateIso: inicio ? sumarDias(inicio, Number(dia) - 1) : null, time }
})
const esc = { n, inicio, mes: a.mes != null ? Number(a.mes) : 5, ft: a.ft && a.ft !== '-' ? a.ft : null, reservasGrandes, entradas: Object.fromEntries(reservasGrandes.map((r) => [r.name, r.time])), diaCuatro: a.d4 ?? (n >= 4 ? (n === 4 ? 'roma' : 'excursion') : null) }
if (a.ftsinhora) esc.ft = '10:00'
const llegada = a.hora ? { hora: a.hora, medio: a.medio ?? 'avion', puntoId: a.punto ?? null, zona: a.zona ?? null } : null
const extra = { llegada }
if (a.ftsinhora) { extra.hasFreeTour = true; extra.entradas = { ...Object.fromEntries(reservasGrandes.map((r) => [r.name, r.time])) } }
const plan = planEscenario(esc, extra)
if (!plan) { console.log('SIN PLAN'); process.exit(0) }
if (a.json) { console.log(JSON.stringify(plan.llegada, null, 1)); process.exit(0) }
if (plan.llegada) {
  const l = plan.llegada
  console.log(`LLEGADA ${l.entrada.hora} ${l.entrada.punto} zona=${l.entrada.zona} tabla=${l.tabla} fila=${l.fila.desde}-${l.fila.hasta ?? '…'} caso=${l.caso} pasa=${l.pasa_al_dia_2} orden=${(l.orden ?? []).join(',')} caído=${l.dia_caido?.id ?? '-'}`)
  for (const av of l.avisos) console.log(`   aviso[${av.tipo}] ${av.texto}`)
  for (const r of l.resumen) console.log(`   resumen[${r.tipo}] ${r.texto}`)
}
for (const d of plan.days) {
  if (!d.curatedDay) { console.log(`día ${d.dayNumber}: ${d.isExcursion ? 'EXCURSIÓN' : d.isBlank ? 'en blanco' : '—'}`); continue }
  console.log(`\ndía ${d.dayNumber} ${d.hours?.dateIso ?? ''} ${d.hours?.weekday ?? ''}  [${d.curatedDay.id}] ${d.curatedDay.variantes.join(',')}${d.llegadaDia ? '  <llegada>' : ''}`)
  for (const r of d.escritoRows ?? []) {
    const fijo = r.hora_fija ? `@${r.hora_fija}` : ''
    console.log(`   ${toHHMM(r.t0)} ${r.tipo.padEnd(7)} ${(r.titulo ?? r.lugar ?? '').slice(0, 44).padEnd(44)} ${String(r.min).padStart(3)}m ${r.modo ?? ''}${fijo}${r.llegada ? ' (llegada a)' : ''}${r.cerrado_este_dia ? ' CERRADO' : ''}`)
  }
  if ((d.spareRows ?? []).length) console.log(`   sobra: ${(d.spareRows ?? []).map((s) => s.lugar).join(', ')}`)
  for (const l of d.escritoLog ?? []) if (a.log) console.log(`   · ${l.que}: ${l.causa}`)
}
console.log('\nnoches:', [...plan.nightsByDay.entries()].map(([k, v]) => `${k}:${v.map((e) => e.name).join('+')}`).join(' | '))
