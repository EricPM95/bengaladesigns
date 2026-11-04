// (Herramienta de la tanda LL, Roma: ¿qué días de ruta llevan un grande que EMPIEZA a las 13:00 o más tarde?) node scripts/destino/_ll_grandes.mjs
import { planEscenario, toMin } from './llegadaLib.mjs'
const GRANDES = ['Coliseo', 'Foro Romano y Palatino', 'Museos Vaticanos y Capilla Sixtina', 'Galería Borghese']
const cuentas = {}
for (const inicio of ['2027-06-08', '2027-06-10', '2027-01-12', '2027-01-14', '2027-03-03', '2027-05-04', '2027-09-14', '2026-12-30']) {
  for (const n of [1, 2, 3, 4, 5, 6]) {
    for (const ft of [null, '10:00', '17:00']) {
      if (n === 1 && ft) continue
      for (const llegada of [undefined, { hora: '09:00', medio: 'avion', puntoId: 'fco', zona: 'centro' }, { hora: '14:30', medio: 'avion', puntoId: 'fco', zona: 'centro' }]) {
        const plan = planEscenario({ n, inicio, ft, diaCuatro: n >= 4 ? (n === 4 ? 'roma' : 'excursion') : null }, llegada ? { llegada } : {})
        if (!plan) continue
        for (const d of plan.days) {
          const id = d.curatedDay?.id ?? '?'
          for (const r of d.escritoRows ?? []) {
            if (r.tipo === 'parada' && GRANDES.includes(r.lugar) && r.modo !== 'fuera' && r.modo !== 'camino' && (r.min ?? 0) >= 45 && toMin(r.hora) >= 13 * 60) {
              const k = `${id}${llegada ? ' (con llegada ' + llegada.hora + ')' : ''} · ${r.lugar} a las ${r.hora}`
              cuentas[k] = (cuentas[k] ?? 0) + 1
            }
          }
        }
      }
    }
  }
}
for (const [k, v] of Object.entries(cuentas).sort()) console.log(v, k)
console.log('total de combinaciones con un grande desde las 13:00:', Object.keys(cuentas).length)
