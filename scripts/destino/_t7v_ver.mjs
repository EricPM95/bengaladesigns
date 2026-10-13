// Explorador (Tanda 7, vuelta): enseña las filas de cada día de un viaje con vuelta. Uso: node scripts/destino/_t7v_ver.mjs <dias> <inicio> <horaVuelo> [json con extras de vuelta] [json con extras del motor]
import { planViaje } from './viajes20Lib.mjs'
import { arrivalInfoFor } from '../../server/engine/writtenDays.js'

const dias = Number(process.argv[2] ?? 3)
const inicio = process.argv[3] ?? '2027-04-30'
const hora = process.argv[4] ?? '17:00'
const extraVuelta = process.argv[5] ? JSON.parse(process.argv[5]) : {}
const extraMotor = process.argv[6] ? JSON.parse(process.argv[6]) : {}
const info = arrivalInfoFor('roma')
const plan = planViaje({ dias, inicio }, { vuelta: { hora, modo: 'flight', zona: 'centro', info, ...extraVuelta }, ...extraMotor })
const hh = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
const mostrar = (day, etiqueta) => {
  console.log(`\n== ${etiqueta} día ${day.dayNumber} ${day.weekday ?? ''} ${day.curatedDay?.id ?? ''} [${(day.curatedDay?.variantes ?? []).join(',')}]`)
  for (const r of day.escritoRows ?? []) console.log(`  ${hh(r.t0)}-${hh(r.t1)} ${r.tipo} ${r.lugar ?? ''}${r.modo ? ` (${r.modo})` : ''} ${r.min}${r.hora_fija ? ` [hora fija ${r.hora_fija}]` : ''}`)
  if ((day.spareRows ?? []).length) console.log('  sobra:', day.spareRows.map((s) => s.lugar).join(', '))
  if ((day.escritoNights ?? []).length) console.log('  noche:', day.escritoNights.map((n) => n.name).join(', '))
}
for (const day of plan.days) mostrar(day, 'RUTA')
if (plan.vuelta?.diaPlan) mostrar(plan.vuelta.diaPlan, 'VUELTA')
if (plan.vuelta) console.log('\nVUELTA', JSON.stringify({ ...plan.vuelta, diaPlan: undefined, tarjeta: plan.vuelta.tarjeta ? '(tarjeta)' : null, tarjetaUltimoDia: plan.vuelta.tarjetaUltimoDia ? '(tarjeta ultimo dia)' : null }, null, 1))
if (process.env.TARJETA && plan.vuelta?.tarjeta) console.log(JSON.stringify(plan.vuelta.tarjeta, null, 1))
if (process.env.TARJETA && plan.vuelta?.tarjetaUltimoDia) console.log(JSON.stringify(plan.vuelta.tarjetaUltimoDia, null, 1))
if (process.env.LOG && plan.vuelta?.diaPlan) console.log(JSON.stringify(plan.vuelta.diaPlan.escritoLog, null, 1))
