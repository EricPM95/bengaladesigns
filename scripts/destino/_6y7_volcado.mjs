// Para mirar a mano: las paradas y el grupo de cada una, día por día, de un viaje de prueba.
//   API_URL=http://localhost:8834 node scripts/destino/_6y7_volcado.mjs dias=3 ft=1 inicio=2027-03-10
import { prepararSSR } from './_ssr.mjs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { gruposDeDia } from '../../shared/routeEngine/fichaLugar.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const { M } = await prepararSSR('scripts/destino/_6y7_titulos_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const D = findPipelineV2Data('Roma')
const grupos = gruposDeDia(D)
const dias = Number(args.dias ?? 3)
const ft = args.ft !== '0'
for (let k = 1; k <= dias; k++) {
  const g = await buildDayBlockV3(D, dias + 1, ft, k, null, args.inicio ?? '2027-03-10', [], ft ? ['imprescindibles', 'free_tour'] : [], { city: 'Roma', scheduler: 'v3', engine: 'v4', mediaJornada: null, month: null, season: null, diaCuatro: dias >= 4 ? 'roma' : null, entradas: {}, reservasGrandes: [], forceOrder: null })
  const d = { ...M.mapSingleGeneratedDay('Roma', g, { id: `d${k}`, dayNumber: k, city: 'Roma', title: '', stops: [], meals: [], excursions: [] }), id: `d${k}`, dayNumber: k, city: 'Roma' }
  console.log(`Día ${k}:`)
  for (const s of M.paradasParaElTitulo(d)) console.log(`   ${s.time} ${s.name}  ->  ${s.isFreeTour ? 'Free Tour' : M.grupoDeParada(s, grupos)}${s.isNightExperience ? ' (nocturna)' : ''}${s.isFreeWalk || s.isZoneWalk ? ' (paseo)' : ''}`)
}
setTimeout(() => process.exit(0), 300).unref()
