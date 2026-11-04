// (Herramienta de la tanda LL, Roma: enseña el día 1 y el de vuelta con una llegada y una vuelta.)  node scripts/destino/_ll_ver.mjs aterriza=14:30 punto=fco zona=centro inicio=2027-06-10 n=3 vuelo=19:40 [dias=0] [ft=10:00] [force=D1,D2,D4]
import { planEscenario } from './llegadaLib.mjs'
const a = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const n = Number(a.n ?? 3)
const llegada = a.aterriza ? { hora: a.aterriza, medio: a.medio ?? 'avion', puntoId: a.punto ?? 'fco', zona: a.zona ?? 'centro' } : undefined
const vuelta = a.vuelo ? { hora: a.vuelo, modo: a.modoV ?? 'flight', puntoId: a.puntoV ?? a.punto ?? 'fco', zona: a.zona ?? 'centro' } : undefined
const plan = planEscenario({ n, inicio: a.inicio ?? '2027-06-10', ft: a.ft ?? null }, { ...(llegada ? { llegada } : {}), ...(vuelta ? { vuelta } : {}), ...(a.force ? { forceOrder: a.force.split(',') } : {}) })
if (!plan) { console.log('SIN PLAN'); process.exit(0) }
console.log('ids:', plan.days.map((d) => d.curatedDay?.id ?? (d.isBlank ? 'blank' : '?')).join(', '), '| caso:', plan.llegada?.caso, '| fila:', plan.llegada?.fila?.desde, '| pasa:', plan.llegada?.pasa_al_dia_2, '| caido:', plan.llegada?.dia_caido?.id)
const mostrar = (d, etq) => {
  console.log(`--- ${etq} ${d.curatedDay?.id ?? ''}`)
  for (const r of d.escritoRows ?? []) console.log(`  ${r.hora ?? r.t1 ?? ''} ${r.tipo} ${r.lugar ?? r.titulo ?? r.restaurante ?? ''} (${r.min ?? ''}${r.modo ? ',' + r.modo : ''})`)
  if ((d.spareRows ?? []).length) console.log('  sobra:', d.spareRows.map((r) => r.lugar ?? r.titulo).join(' | '))
  if (d.escritoNights?.length) console.log('  noche:', d.escritoNights.map((x) => x.name + '@' + x.fixedStart).join(' | '))
}
const quien = a.dias ? a.dias.split(',').map(Number) : llegada ? [0] : []
for (const i of quien) if (plan.days[i]) mostrar(plan.days[i], `día ${plan.days[i].dayNumber}`)
if (plan.vuelta) {
  const v = plan.vuelta
  console.log('vuelta:', JSON.stringify({ contenido: v.contenido, fila: v.fila?.desde ?? v.fila?.indice, lleva: v.lleva, irse: v.interno?.irseMin, margen: v.interno?.margenMin, lista: v.listaId, paradasHastaIrte: v.paradasHastaIrte, tardeLibre: Boolean(v.tardeLibre) }))
  if (v.diaPlan) mostrar(v.diaPlan, 'día de vuelta')
}
