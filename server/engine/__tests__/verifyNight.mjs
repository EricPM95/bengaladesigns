// El sol decide qué es tarde y qué es noche (Estaciones, Parte 3): la noche empieza 30 min después de
// la puesta de sol; antes de cenar si cabe; un exterior que cierra antes de la noche no es nocturna.
import { nightStartsAt, nightTiming, planNightWalks } from '../../../shared/routeEngine/nightWalk.js'

const failures = []
const check = (label, actual, expected) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push(`${label}: ${JSON.stringify(actual)} ≠ ${JSON.stringify(expected)}`)
}
const t = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3))

check('la noche empieza 30 min tras la puesta de sol', nightStartsAt(t('17:00')), t('17:30'))
check('sin puesta de sol no se sabe', nightStartsAt(null), null)

const near = { name: 'A (noche)', coordinates: [41.9, 12.48] }
const nearer = { name: 'B (noche)', coordinates: [41.901, 12.481] }
const dinner = { lat: 41.9012, lng: 12.4812 }
// Invierno: anochece a las 17:00, la tarde acaba a las 17:00 y se cena a las 20:00 → antes de cenar,
// recorrido hacia la cena (acaba en lo más cercano a ella).
const winter = nightTiming([nearer, near], { sunset: t('17:00'), lastEnd: t('17:00'), lastCoords: { lat: 41.899, lng: 12.479 }, dinnerStart: t('20:00'), dinnerCoords: dinner })
check('invierno: antes de cenar', winter.beforeDinner, true)
check('invierno: hacia la cena', winter.entries.map((e) => e.name), ['A (noche)', 'B (noche)'])
check('invierno: empieza al anochecer', winter.start, t('17:30'))
// Verano: anochece a las 20:45 → después de cenar, desde las 21:30.
const summer = nightTiming([nearer, near], { sunset: t('20:45'), lastEnd: t('19:30'), lastCoords: null, dinnerStart: t('20:30'), dinnerCoords: dinner })
check('verano: después de cenar', summer.beforeDinner, false)
check('verano: a las 21:30', summer.start, t('21:30'))
// Tarde llena hasta la cena: aunque sea de noche, después de cenar.
const full = nightTiming([near], { sunset: t('17:00'), lastEnd: t('19:50'), lastCoords: null, dinnerStart: t('20:00'), dinnerCoords: dinner })
check('tarde llena: después de cenar', full.beforeDinner, false)

// Un jardín (exterior con horario) que cierra a las 18:00: con puesta de sol a las 17:00 la noche empieza
// a las 17:30 y aún está abierto; con puesta de sol a las 17:45 la noche es a las 18:15 y ya ha cerrado.
// Una iglesia (interior) se ve de noche desde fuera: su horario no cuenta.
const destData = {
  zones: { z: { center: [41.9, 12.48] } },
  places: [{ name: 'Jardín', type: 'exterior', windows: ['07:00-18:00'], level: 3 }, { name: 'Iglesia', type: 'interior', windows: ['07:00-18:00'], level: 3 }],
  night_experiences: [
    { name: 'Jardín (noche)', coordinates: [41.9, 12.48], conflicts_with: ['Jardín'] },
    { name: 'Iglesia (noche)', coordinates: [41.9001, 12.4801], conflicts_with: ['Iglesia'] },
  ],
}
const planFor = (sunset) => ({ days: [{ dayNumber: 1, hours: { sunset }, slots: { morning: { zone: 'z', units: [] }, afternoon: { zone: 'z', units: [] } } }] })
check('jardín abierto al anochecer (17:30)', (planNightWalks(destData, planFor(t('17:00'))).get(1) ?? []).map((e) => e.name).sort(), ['Iglesia (noche)', 'Jardín (noche)'])
check('jardín cerrado a la noche (18:15)', (planNightWalks(destData, planFor(t('17:45'))).get(1) ?? []).map((e) => e.name), ['Iglesia (noche)'])
const sunsetGarden = { ...destData, places: [{ name: 'Jardín', type: 'exterior', windows: ['07:00-sunset'], level: 3 }, destData.places[1]] }
check('lo que cierra al anochecer nunca es nocturna', (planNightWalks(sunsetGarden, planFor(t('20:45'))).get(1) ?? []).map((e) => e.name), ['Iglesia (noche)'])

if (failures.length) {
  console.log(failures.join('\n'))
  console.log(`❌ ${failures.length} fallos`)
  process.exit(1)
}
console.log('✅ sin fallos')
