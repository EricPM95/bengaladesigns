// Prueba de la Tanda 10S8, agente B (el motor de adaptar un día corto y el aviso de los imprescindibles).
//   node scripts/destino/pruebaTanda10S8_B.mjs                       (solo motor y código: sin navegador)
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 CON_NAVEGADOR=1 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S8_B.mjs   (con el aviso en pantalla; Vite y API reiniciados con el código nuevo)
// Casos: (1) con llegada a las 16:30 (+30 min al centro) entra el Panteón: primero los que cierran, al final los de cualquier hora; (2) el último día conserva su orden; (3) la comida que cae antes
// de la llegada se quita y la cena, dentro del día, se queda; (4) solo los GRANDES tienen su línea y el resto va en «Y N sitios más…» [Ver]; (5) el [Ver] abre «Si te sobra tiempo» de ese día.
import fs from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { adaptarDiaAlVuelo } from '../../shared/routeEngine/adaptarDiaVuelo.js'

let n = 0
let fallos = 0
const debe = (ok, id, texto) => { n++; if (!ok) { fallos++; console.log(`  FALLO ${id}: ${texto}`) } else console.log(`  ok    ${id}: ${texto}`) }
const min = (h) => { const [a, b] = String(h).split(':').map(Number); return a * 60 + b }
const leer = (f) => fs.readFileSync(f, 'utf8')

const D = findPipelineV2Data('Roma')
const travel = travelTimesFor('roma')
const FECHA = '2026-11-12' // jueves
async function diaDeRoma(numero, total = 4) {
  const day = await buildDayBlockV3(D, total, false, numero, null, FECHA, [], ['imprescindibles'], { city: 'Roma', scheduler: 'v3', month: null })
  const stops = day.stops.map((s, i) => ({ id: `d${numero}s${i}`, name: s.name, time: s.suggested_time, durationMinutes: s.duration_minutes, coordinates: { lat: s.latitude, lng: s.longitude }, night: /\(noche\)|de noche/i.test(s.name) }))
  const meals = day.meals.map((m) => ({ mealTime: m.time, time: m.suggested_time }))
  return { stops, meals }
}
const llamar = (dia, extra) => adaptarDiaAlVuelo({ destData: D, travel, stops: dia.stops, meals: dia.meals, dateIso: FECHA, ...extra })
const nombre = (dia, id) => dia.stops.find((s) => s.id === id)?.name
const dia1 = await diaDeRoma(1)
const dia3 = await diaDeRoma(3)

console.log('1. Llegada a las 16:30 (desde las 17:00): primero los que cierran')
const desde = min('16:30') + 30
const a = llamar(dia1, { desde })
const nombres = a.order.map((o) => nombre(dia1, o.id))
debe(nombres.includes('Panteón'), '1a', `con llegada a las 16:30 entra el Panteón (a las ${a.order.find((o) => nombre(dia1, o.id) === 'Panteón')?.time ?? '—'}); se quedan: ${nombres.join(', ')}`)
const pan = a.order.find((o) => nombre(dia1, o.id) === 'Panteón')
debe(Boolean(pan) && min(pan.time) + 45 <= 19 * 60, '1b', `el Panteón acaba antes de cerrar a las 19:00 (empieza ${pan?.time})`)
const iPan = nombres.indexOf('Panteón')
const iArco = nombres.indexOf('Arco de Constantino')
const iTortugas = nombres.indexOf('Fuente de las Tortugas')
debe(iArco === -1 || iPan < iArco, '1c', 'el Panteón va antes que el Arco de Constantino (se ve a cualquier hora)')
debe(iTortugas === -1 || iPan < iTortugas, '1d', 'el Panteón va antes que la Fuente de las Tortugas (a cualquier hora)')
const conservadas = [...a.order.map((o) => o.id), ...a.spare.map((s) => s.id)].sort()
debe(JSON.stringify(conservadas) === JSON.stringify(dia1.stops.map((s) => s.id).sort()), '1e', 'las mismas paradas: ninguna perdida ni añadida')
debe(a.order.every((o) => min(o.time) >= desde), '1f', `ninguna empieza antes de las 17:00 (la primera: ${a.order[0]?.time})`)
const horas = a.order.map((o) => min(o.time))
debe(horas.every((h, i) => i === 0 || h >= horas[i - 1]), '1g', 'las horas van en orden')
debe(JSON.stringify(a) === JSON.stringify(llamar(dia1, { desde })), '1h', 'determinista')
debe(a.order.filter((o) => /noche/.test(nombre(dia1, o.id))).every((o) => o.time === dia1.stops.find((s) => s.id === o.id).time), '1i', 'las de noche se quedan a su hora')

console.log('2. Comidas')
const almuerzo = a.meals.find((m) => m.mealTime === 'lunch')
const cena = a.meals.find((m) => m.mealTime === 'dinner')
debe(almuerzo && !almuerzo.keep, '2a', 'la comida de las 13:55, antes de la llegada, se quita (y no se recoloca)')
debe(cena && cena.keep && cena.time === '19:30', '2b', 'la cena, dentro del día, se queda a su hora (19:30)')
const antesDeCena = a.order.filter((o) => min(o.time) < min('19:30')).at(-1)
debe(cena?.afterId === (antesDeCena?.id ?? null), '2c', 'la cena se coloca tras la última parada que empieza antes de ella')
const sinColision = a.order.every((o) => { const ini = min(o.time); const fin = ini + dia1.stops.find((s) => s.id === o.id).durationMinutes; return fin <= min('19:30') + 5 || ini >= min('19:30') + 70 })
debe(sinColision, '2d', 'ninguna parada pisa la cena')

console.log('3. El último día (solo `hasta`) conserva el orden recibido')
const hasta = min('15:00') - 180
const d = llamar(dia3, { hasta })
const ordenOriginal = dia3.stops.map((s) => s.id).filter((id) => d.order.some((o) => o.id === id))
debe(JSON.stringify(d.order.map((o) => o.id)) === JSON.stringify(ordenOriginal), '3a', 'el último día no se reordena (mismo orden que el recibido)')
const trevi = d.order.find((o) => nombre(dia3, o.id) === 'Fontana de Trevi')
debe(Boolean(trevi) && trevi.time === '07:30', '3b', `lo que ya cabía no se mueve (Fontana de Trevi a las ${trevi?.time})`)

console.log('4. Solo los grandes tienen su línea')
const lib = await import('../../src/lib/imprescindiblesGrandes.ts')
for (const grande of ['Coliseo', 'Foro Romano y Palatino', 'Museos Vaticanos y Capilla Sixtina', 'Basílica de San Pedro', 'Galería Borghese']) debe(lib.esImprescindibleGrande('Roma', grande), '4a', `${grande} es grande`)
for (const chico of ['Altar de la Patria', 'Piazza Navona', 'Plaza de San Pedro', 'Panteón']) debe(!lib.esImprescindibleGrande('Roma', chico), '4b', `${chico} no es grande`)
debe(lib.esImprescindibleGrande('Lisboa', 'Torre de Belém'), '4c', 'un destino sin lista: todos avisan uno a uno (como antes)')
// (antes → la línea «Y N sitios más…» contaba solo los imprescindibles que no caben → ahora → cuenta TODAS las paradas del día que no caben, sean imprescindibles o no → decisión de Eric (10R, 31-oct); la prueba nueva, pruebaTanda10R_C. Lo que aquí se comprueba (reparto de imprescindibles) sigue igual.)
const reparto = lib.repartirNoCaben([{ nombre: 'Coliseo' }, { nombre: 'Altar de la Patria' }, { nombre: 'Piazza Navona' }, { nombre: 'Museos Vaticanos y Capilla Sixtina' }], 'Roma')
debe(reparto.grandes.length === 2 && reparto.resto.length === 2, '4d', 'se reparten 2 grandes y 2 en la línea de «Y N sitios más»')
debe(lib.textoYMasSitios(4) === 'Y 4 sitios más pasan a “Si te sobra tiempo”.' && lib.textoYMasSitios(1) === 'Y 1 sitio más pasa a “Si te sobra tiempo”.', '4e', 'el texto «Y 4 sitios más pasan a “Si te sobra tiempo”.» (y el singular)')
debe(lib.repartirNoCaben([{ nombre: 'Coliseo' }], 'Roma').resto.length === 0, '4f', 'si no hay más que grandes, no hay línea de «Y N…»')
const aviso = leer('src/components/reorganizar/AvisoNoCabe.tsx')
debe(aviso.includes('repartirNoCaben') && aviso.includes('textoYMasSitios') && aviso.includes('data-no-cabe-ver') && aviso.includes('verSobraTiempo('), '4g', 'AvisoNoCabe usa el reparto, la línea de «Y N…» y [Ver]')
debe(leer('src/components/route/dayDetail/SpareStopsSection.tsx').includes('data-sobra-tiempo') && leer('src/components/route/dayDetail/DayDetailPanel.tsx').includes('<SpareStopsSection dayId={day.id}'), '4h', '«Si te sobra tiempo» sabe abrirse desde [Ver]')
debe(leer('src/store/useReorganizarStore.ts').includes('verSobraTiempoDe'), '4i', 'el almacén guarda qué día abrir')

console.log('5. La ruta normal no cambia')
const generador = ['server/engine/index.js', 'server/engine/buildDayV3.js', 'shared/routeEngine/listasTrip.js', 'shared/routeEngine/planTrip.js']
debe(generador.every((f) => !/adaptarDiaVuelo/.test(leer(f))), '5a', 'el generador de rutas no importa el módulo (la muestra de 60 fechas: node scripts/destino/muestraRutas60.mjs, «idéntica»)')

if (process.env.CON_NAVEGADOR === '1') {
  const path = await import('node:path')
  const { abrirApp } = await import('./_enLaApp.mjs')
  const BASE = process.env.APP_URL || 'http://localhost:5173'
  const SALIDA = path.resolve('docs/dias/capturas_jutrip')
  fs.mkdirSync(SALIDA, { recursive: true })
  console.log('6. En pantalla (llegada 16:30 con pase)')
  const store = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore)"
  const s = (cuerpo) => `${store}.then(async (R) => { const st = () => R.getState(); ${cuerpo} })`
  const antes = "try{localStorage.setItem('trazo:moneda-pase','EUR')}catch(x){}; try{sessionStorage.removeItem('trazo:version')}catch(x){}"
  const a2 = await abrirApp(BASE, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=completa&apertura=0', antes, ancho: 390, alto: 844 })
  try {
    for (let i = 0; i < 120 && !(await a2.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await a2.esp(500)
    await a2.evaluar('window.__rutaPrueba().then(() => true)')
    for (let i = 0; i < 90 && !(await a2.evaluar(s('return Boolean(st().route)'))); i++) await a2.esp(1000)
    await a2.esp(3000)
    await a2.evaluar(s("st().setMode('days'); st().setActiveDayId(st().route.days[0].id); return true"))
    await a2.esp(2000)
    for (let i = 0; i < 6; i++) {
      const hecho = await a2.evaluar("(() => { const h = Array.from(document.querySelectorAll('[role=\"dialog\"]')).find((x) => /HEMOS PREPARADO|Hemos preparado/.test(x.innerText || '')); if (!h) return true; const b = Array.from(h.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Ok|Genial)$/i.test((x.innerText || '').trim())); b?.click(); return false })()")
      if (hecho) break
      await a2.esp(700)
    }
    await a2.esp(1000)
    await a2.evaluar(s("st().setArrivalFlightTime('16:30'); const m = await import('/src/lib/adaptarVuelos.ts'); m.olvidarRespuestasDelMotor(); m.alCambiarElVuelo({ que: 'hora', mitad: 'arrival' }); return true"))
    let hayAlerta = false
    for (let i = 0; i < 140 && !hayAlerta; i++) { hayAlerta = await a2.evaluar("Boolean(document.querySelector('[data-alerta-adaptar]'))"); if (!hayAlerta) { await a2.evaluar("(() => { const h = document.querySelector('[data-hoja=\"resumen-vuelo\"]'); if (!h) return false; const b = Array.from(h.parentElement.querySelectorAll('button')).find((x) => /De acuerdo/.test(x.innerText || '')); b?.click(); return true })()"); await a2.esp(500) } }
    debe(hayAlerta, '6a', 'sale la alerta de adaptar los días a los vuelos')
    if (hayAlerta) {
      await a2.evaluar("document.querySelector('[data-adaptar-si]').click(); true")
      await a2.esp(2500)
      const lineas = () => a2.evaluar("JSON.stringify(Array.from(document.querySelectorAll('[data-no-cabe-texto]')).map((e) => e.innerText))").then(JSON.parse)
      const grandesEnPantalla = await lineas()
      debe(grandesEnPantalla.every((t) => /Coliseo|Foro|Vaticano|San Pedro|Borghese/i.test(t)), '6b', `en pantalla solo líneas de los grandes: ${JSON.stringify(grandesEnPantalla)}`)
      // Meto un imprescindible no grande que no cabe (como si el motor lo hubiera marcado) para ver la línea de «Y N sitios más».
      await a2.evaluar(s(`
        const d = st().route.days[0]; const extra = (d.spareStops || []).filter((x) => !/Coliseo|Foro Romano|Museos Vaticanos|San Pedro|Borghese/i.test(x.name)).slice(0, 4)
        const r = await import('/src/store/useReorganizarStore.ts'); const actual = r.useReorganizarStore.getState().noCaben
        r.useReorganizarStore.getState().ponerNoCaben([...actual.filter((x) => !extra.some((e) => e.id === x.stopId)), ...extra.map((e) => ({ dayId: d.id, dayNumber: d.dayNumber, stopId: e.id, nombre: e.name, weekday: 'jueves' }))])
        return true`))
      await a2.esp(600)
      const resto = await a2.evaluar("(() => { const e = document.querySelector('[data-no-cabe-resto-texto]'); return e ? e.innerText : '' })()")
      debe(/^Y \d+ sitios? más pasan? a “Si te sobra tiempo”\.$/.test(resto), '6c', `la línea de los demás: «${resto}»`)
      debe(await a2.evaluar("Boolean(document.querySelector('[data-no-cabe-ver]'))"), '6d', 'la línea lleva [Ver]')
      const caja = await a2.evaluar("(() => { const r = document.querySelector('[data-aviso-no-cabe]').getBoundingClientRect(); return JSON.stringify({ w: r.width, h: r.height }) })()").then(JSON.parse)
      debe(caja.w <= 391, '6e', `el aviso no se sale del ancho a 390 px (${caja.w})`)
      await a2.captura(path.join(SALIDA, '10s8_aviso_1.jpg'))
      await a2.evaluar("document.querySelector('[data-no-cabe-ver]').click(); true")
      await a2.esp(1500)
      const abierta = await a2.evaluar("(() => { const e = document.querySelector('[data-sobra-tiempo]'); return e ? Boolean(e.querySelector('ul')) : false })()")
      debe(abierta, '6f', '[Ver] lleva a «Si te sobra tiempo» del día y lo deja abierto')
      await a2.captura(path.join(SALIDA, '10s8_aviso_2.jpg'))
    }
  } finally {
    a2.cerrar()
  }
}

console.log(`\n${n} comprobaciones, ${fallos} fallos`)
process.exit(fallos ? 1 : 0)
