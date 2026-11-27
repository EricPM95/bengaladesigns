// V80 (agente A: apartados 1, 2 y 3) · EL DÍA DE EXCURSIÓN EN HOY, PASO A PASO (por tu cuenta y organizada). Design «Día de excursión en HOY», EX1-EX6.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV80_a.mjs [pura|lanza|roma]      (sin argumento: las tres partes)
// 1. PURA (sin navegador): `src/lib/excursionHoy.ts` con los datos REALES de La Graciosa (`listas.json` DG) y los modos habituales de `_excursion_hoy.json`.
// 2. LANZAROTE (un Chrome): La Graciosa por tu cuenta: los pasos salen de los datos; el ferry por GPS, por botón y por hora; el último barco NO se supone; el aviso, 1 h 30 antes; consejos con X; ideas sin [He terminado].
// 3. ROMA (un Chrome): Pompeya organizada (cajas, botones, sin «Saltar» ni «Necesito más tiempo»), Florencia en tren (cajas SALIDA/LLEGADA/VUELTA, pasos, aviso).
// No toca el Supabase de producción (cuentas=off, Supabase bloqueado). Un Chrome, cerrado al acabar; por la cola.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { abrirV80, montar } from './_v80_a_comun.mjs'

const QUE = process.argv[2] ?? 'todo'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  console.log(cond ? '  ok' : '  MAL', regla, String(texto).slice(0, 200))
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => JSON.parse(fs.readFileSync(f, 'utf8'))
const RUTA_STORE = "(await import('/src/store/useRouteStore.ts')).useRouteStore"

/* ═══ 1. La parte pura ═══ */
async function partePura() {
  console.log('1. Funciones puras y datos (sin navegador)')
  const salida = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'v80pura-')), 'puras.mjs')
  await build({ stdin: { contents: "export * from './src/lib/excursionHoy.ts'", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, format: 'esm', platform: 'node', outfile: salida, logLevel: 'error', define: { 'import.meta.env': '{}' } })
  const m = await import(pathToFileURL(salida).href)
  const dg = leer('data/dias/lanzarote/listas.json').dias.DG
  const lz = leer('data/dias/lanzarote/_excursion_hoy.json').excursiones
  const rm = leer('data/dias/roma/_excursion_hoy.json').excursiones

  // § 1: el modo
  debe(m.modoDeLaExcursion({ reserva: { kind: 'excursion' }, unidas: [], habitual: 'por_tu_cuenta' }) === 'organizada', 'modo-reserva', 'una reserva de excursión en RESERVAS la hace organizada (aunque lo habitual sea por tu cuenta)')
  debe(m.modoDeLaExcursion({ reserva: null, unidas: [{}], habitual: 'organizada' }) === 'por_tu_cuenta', 'modo-unidas', 'billetes unidos a la excursión la hacen por tu cuenta (aunque lo habitual sea organizada)')
  debe(m.modoDeLaExcursion({ reserva: null, unidas: [], habitual: 'organizada' }) === 'organizada' && m.modoDeLaExcursion({ reserva: null, unidas: [], habitual: 'por_tu_cuenta' }) === 'por_tu_cuenta', 'modo-habitual', 'sin nada guardado manda `modo_habitual`')
  debe(m.modoDeLaExcursion({ reserva: null, unidas: [], diaConTraslados: true }) === 'por_tu_cuenta' && m.modoDeLaExcursion({ reserva: null, unidas: [] }) === 'organizada', 'modo-sin-dato', 'sin dato habitual: por tu cuenta solo si el día trae traslados; si no, organizada')
  debe(rm.pompeya_sorrento.modo_habitual === 'organizada' && lz.la_graciosa.modo_habitual === 'por_tu_cuenta' && rm.florencia_tren.modo_habitual === 'por_tu_cuenta' && rm.napoles_pompeya_tren.modo_habitual === 'por_tu_cuenta', 'modo-datos', 'los datos: Pompeya organizada; La Graciosa, Florencia y Nápoles por tu cuenta')
  const todas = [...Object.values(lz), ...Object.values(rm)]
  debe(todas.every((x) => x.modo_habitual === 'organizada' || x.modo_habitual === 'por_tu_cuenta'), 'modo-valores', 'cada excursión con dato trae un modo válido')
  const rmOpc = leer('data/pipeline_v2/roma.json').excursions.options.map((o) => o.id)
  const lzOpc = leer('data/pipeline_v2/lanzarote.json').excursions.options.map((o) => o.id)
  debe(rmOpc.every((id) => rm[id]?.modo_habitual) && lzOpc.every((id) => lz[id]?.modo_habitual), 'modo-todas', 'TODAS las excursiones de Roma y Lanzarote tienen su modo habitual')
  debe(todas.every((x) => !x.ideas || x.ideas.every((i) => i.nombre && i.buscar && i.fuente)), 'ideas-fuente', 'cada idea de «Tu tiempo en…» trae su nombre, su búsqueda y su fuente')

  // La Graciosa: los datos reales
  const t = m.trasladosDelDia(dg)
  debe(t.coche?.hasta === 'Órzola' && t.coche.consejo === 'Reposta antes: en el norte hay pocas gasolineras.', 'dg-coche', `traslado en coche: a ${t.coche?.hasta}, consejo «${t.coche?.consejo}»`)
  debe(t.barco?.hora === '10:00' && t.barco.empresa === 'Líneas Romero' && t.barco.trayectoMin === 30, 'dg-barco', `ferry: ${t.barco?.hora}, ${t.barco?.empresa}, ${t.barco?.trayectoMin} min (el mayor de 25-30)`)
  debe(m.ultimaDeVuelta(dg.vuelta, '2026-11-27') === '17:00' && m.ultimaDeVuelta(dg.vuelta, '2026-01-15') === '17:00', 'ultima-invierno', 'último barco en invierno: 17:00')
  debe(m.ultimaDeVuelta(dg.vuelta, '2026-04-10') === '18:00' && m.ultimaDeVuelta(dg.vuelta, '2026-10-25') === '18:00', 'ultima-verano-1', '27 mar - 25 oct: 18:00 (también el 25 de octubre)')
  debe(m.ultimaDeVuelta(dg.vuelta, '2026-07-01') === '19:00' && m.ultimaDeVuelta(dg.vuelta, '2026-10-24') === '19:00' && m.ultimaDeVuelta(dg.vuelta, '2026-08-15') === '19:00', 'ultima-verano-2', '1 jul - 24 oct: 19:00')
  debe(m.ultimaDeVuelta(dg.vuelta, '2026-10-26') === '17:00' && m.ultimaDeVuelta(dg.vuelta, '2026-03-26') === '17:00' && m.ultimaDeVuelta(dg.vuelta, '2026-03-27') === '18:00', 'ultima-bordes', 'los bordes de temporada (26 oct y 26 mar: 17:00; 27 mar: 18:00)')
  debe(m.ultimaDeVuelta(null, '2026-11-27') === null, 'ultima-sin-dato', 'sin dato de vuelta, no hay último')
  debe(m.duracionLegible(61) === '1 h' && m.duracionLegible(75) === '1 h 15' && m.duracionLegible(43) === '45 min', 'duracion', '61 min = «1 h», 75 = «1 h 15», 43 = «45 min»')

  // Los pasos de La Graciosa, de los datos
  const base = { nombre: 'La Graciosa', medio: 'barco', dia: dg, coche: { activo: true, ida: { minutos: 61, km: 70, salir: '08:30' }, vuelta: { minutos: 61, km: 70 } }, unidas: [], dateIso: '2026-11-27', ahoraMin: 8 * 60, gps: 'sin', gpsEnSalida: false, estado: { ...m.ESTADO_VACIO } }
  const p = (o) => m.pasosDeLaExcursion({ ...base, ...o, estado: { ...base.estado, ...(o?.estado ?? {}) } })
  const quien = (r) => r.pasos.map((x) => `${x.numero}${x.hecho ? 'H' : x.ahora ? 'A' : '-'}`).join(' ')
  let r = p()
  debe(r.pasos.map((x) => x.tipo).join() === 'salida,ida,tiempo,vuelta,casa', 'pasos-tipos', `los 5 pasos salen de los datos (${r.pasos.map((x) => x.tipo)})`)
  debe(r.pasos[0].titulo === 'Coche hasta Órzola · 1 h' && r.pasos[0].sub === 'Reposta antes: en el norte hay pocas gasolineras.', 'paso-1', `paso 1: «${r.pasos[0].titulo}» + consejo del dato`)
  debe(r.pasos[1].titulo === 'Ferry de las 10:00 · Líneas Romero', 'paso-2', `paso 2: «${r.pasos[1].titulo}»`)
  debe(r.pasos[2].titulo === 'Tu tiempo en La Graciosa' && r.pasos[3].titulo === 'Ferry de vuelta · último a las 17:00' && r.pasos[4].titulo === 'Vuelta a tu alojamiento · en coche desde Órzola, 1 h', 'paso-3-5', `pasos 3, 4 y 5 («${r.pasos[3].titulo}», «${r.pasos[4].titulo}»)`)
  debe(quien(r) === '1A 2- 3- 4- 5-', 'ahora-1', `a las 8:00 sin nada: el paso 1 es el de ahora (${quien(r)})`)
  // el ferry: por GPS
  debe(quien(p({ gps: 'destino', ahoraMin: 11 * 60 })) === '1H 2H 3A 4- 5-', 'ferry-gps', 'el ferry se da por hecho con el GPS en la isla')
  debe(quien(p({ gps: 'destino', ahoraMin: 9 * 60 })) === '1H 2H 3A 4- 5-', 'ferry-gps-antes', 'con el GPS en la isla a las 9:00 (antes de la hora del ferry), ya está hecho')
  // por botón
  debe(quien(p({ estado: { embarcado: true }, ahoraMin: 9 * 60 })) === '1H 2H 3A 4- 5-', 'ferry-boton', 'con [He embarcado] se da por hecho')
  debe(quien(p({ estado: { llegado: true }, ahoraMin: 9 * 60 })) === '1H 2A 3- 4- 5-', 'llegado-boton', 'con [Ya he llegado] se da por hecho el paso 1 y toca el ferry')
  debe(quien(p({ gpsEnSalida: true, ahoraMin: 9 * 60 })) === '1H 2A 3- 4- 5-', 'llegado-gps', 'con el GPS en el puerto se da por hecho el paso 1')
  // por hora
  r = p({ ahoraMin: 10 * 60 + 29 })
  debe(!r.idaHecha && quien(r) === '1A 2- 3- 4- 5-', 'ferry-hora-antes', `a las 10:29 (10:00 + 30 min de trayecto = 10:30) todavía no (${quien(r)})`)
  r = p({ ahoraMin: 10 * 60 + 30 })
  debe(r.idaHecha && r.idaPorLaHora && quien(r) === '1H 2H 3A 4- 5-', 'ferry-hora', `a las 10:30, sin GPS ni botón, pasada la hora más el trayecto: hecho, y queda «¿No has cogido este barco?» (${quien(r)})`)
  debe(!p({ ahoraMin: 12 * 60, gps: 'destino' }).idaPorLaHora && !p({ ahoraMin: 12 * 60, estado: { embarcado: true } }).idaPorLaHora, 'ferry-hora-solo', 'con GPS o con botón NO sale «¿No has cogido este barco?»')
  r = p({ ahoraMin: 12 * 60, estado: { horaIda: '12:00', llegado: true } })
  debe(r.pasos[1].titulo === 'Ferry de las 12:00 · Líneas Romero' && quien(r) === '1H 2A 3- 4- 5-', 'cambiar-hora', `[Cambiar la hora]: recalcula los pasos (el ferry de las 12:00 vuelve a ser el de ahora; ${quien(r)})`)
  // sin trayecto conocido: la hora no da por hecho nada
  const sinTrayecto = m.pasosDeLaExcursion({ ...base, dia: { ...dg, partes: { unica: { manana: [{ tipo: 'traslado', como: 'ferry', texto: 'Ferry de las 10:00', hora: '10:00' }] } } }, ahoraMin: 15 * 60, estado: { ...base.estado } })
  debe(!sinTrayecto.idaHecha, 'ferry-hora-sin-trayecto', 'si el dato no trae el trayecto, la hora no da por hecho nada (no se inventa)')
  // el último de vuelta nunca se supone
  r = p({ gps: 'destino', ahoraMin: 17 * 60 + 5 })
  debe(!r.vueltaHecha && r.pasos[3].ahora && r.pasos[4].ahora === false, 'ultimo-no-supuesto', `a las 17:05 con el GPS en la isla: el barco de vuelta NO se da por hecho (${quien(r)})`)
  r = p({ ahoraMin: 23 * 60, estado: { embarcado: true } })
  debe(!r.vueltaHecha, 'ultimo-no-supuesto-hora', 'a las 23:00 sin GPS ni botón, tampoco')
  debe(quien(p({ ahoraMin: 17 * 60, estado: { embarcado: true, vuelto: true } })) === '1H 2H 3H 4H 5A', 'vuelta-boton', 'con [He embarcado] de vuelta se da por hecho y toca «Vuelta a tu alojamiento»')
  debe(p({ ahoraMin: 18 * 60, gps: 'otro', estado: { embarcado: true, estuvo: true } }).vueltaHecha, 'vuelta-gps', 'con el GPS ya fuera de la isla después de haber estado, se da por hecho')
  debe(!p({ ahoraMin: 18 * 60, gps: 'otro', estado: { embarcado: true, estuvo: false } }).vueltaHecha, 'vuelta-gps-sin-estar', 'el GPS fuera sin haber estado nunca en la isla no da la vuelta por hecha')
  // el aviso
  const aviso = (ahoraMin, o = {}) => m.avisoDelUltimo({ ultimaMin: 17 * 60, ahoraMin, idaHecha: true, vueltaHecha: false, ...o })
  debe(aviso(15 * 60 + 29) === null, 'aviso-antes', 'a las 15:29 (1 h 31 antes) no hay aviso')
  debe(aviso(15 * 60 + 30)?.quedan === 90 && aviso(16 * 60 + 15)?.quedan === 45, 'aviso-1h30', 'desde 1 h 30 antes (15:30: 90 min; 16:15: 45 min)')
  debe(aviso(17 * 60 + 5)?.quedan === 0, 'aviso-sigue', 'a las 17:05 el aviso SIGUE (no se supone que se cogió)')
  debe(aviso(16 * 60, { vueltaHecha: true }) === null && aviso(16 * 60, { idaHecha: false }) === null, 'aviso-no', 'sin aviso si ya se cogió el de vuelta o si ni siquiera se ha ido')

  // Las cajas
  const e = { ...base, ahoraMin: 8 * 60 }
  const cj = m.cajasPorTuCuenta(e, p())
  debe(cj.map((c) => c.dato).join() === 'salida,transporte,vuelta' && cj[0].grande === '8:30' && cj[0].sub === 'Desde tu alojamiento', 'cajas-salida', `SALIDA ${cj[0].grande} «${cj[0].sub}»`)
  debe(cj[1].etiqueta === 'FERRY' && cj[1].grande === '10:00' && /falta billete/.test(cj[1].sub) && cj[2].grande === '17:00' && cj[2].sub === 'Último barco', 'cajas-ferry-vuelta', `FERRY ${cj[1].grande} «${cj[1].sub}» · VUELTA ${cj[2].grande} «${cj[2].sub}»`)
  const ida = { id: 'a', kind: 'ferry', time: '10:00', origen: 'Órzola', compania: 'Líneas Romero' }
  const vuelta = { id: 'b', kind: 'ferry', time: '17:30', origen: 'La Graciosa' }
  const cj2 = m.cajasPorTuCuenta({ ...e, unidas: [ida, vuelta] }, p({ unidas: [ida, vuelta] }))
  debe(!/falta billete/.test(cj2[1].sub) && cj2[2].grande === '17:30' && cj2[2].sub === 'Tu barco', 'cajas-con-billete', 'con los billetes: sin «falta billete» y VUELTA es la de su billete («Tu barco»)')
  const tren = { id: 't', kind: 'tren', time: '08:15', returnTime: '09:50', origen: 'Roma Termini', destinoDeViaje: 'Santa Maria Novella' }
  const trenV = { id: 'tv', kind: 'tren', time: '19:10', origen: 'Santa Maria Novella' }
  const et = { nombre: 'Florencia', medio: 'tren', dia: null, coche: null, unidas: [tren, trenV], dateIso: '2026-11-28', ahoraMin: 7 * 60, gps: 'sin', gpsEnSalida: false, estado: { ...m.ESTADO_VACIO } }
  const rt = m.pasosDeLaExcursion(et)
  const ct = m.cajasPorTuCuenta(et, rt)
  debe(ct.map((c) => `${c.etiqueta} ${c.grande} ${c.sub}`).join(' | ') === 'SALIDA 8:15 Roma Termini | LLEGADA 9:50 Santa Maria Novella | VUELTA 19:10 Tu tren', 'cajas-tren', `tren: ${ct.map((c) => `${c.etiqueta} ${c.grande}`).join(' | ')}`)
  debe(rt.pasos.map((x) => x.tipo).join() === 'ida,tiempo,vuelta,casa' && rt.pasos[0].titulo === 'Tren a Florencia · 8:15 · Roma Termini' && rt.pasos[2].titulo === 'Tren de vuelta · 19:10', 'pasos-tren', `Florencia en tren: 4 pasos («${rt.pasos[0].titulo}», «${rt.pasos[2].titulo}»)`)
  debe(m.pasosDeLaExcursion({ ...et, ahoraMin: 9 * 60 + 49 }).idaHecha === false && m.pasosDeLaExcursion({ ...et, ahoraMin: 9 * 60 + 50 }).idaPorLaHora === true, 'tren-hora', 'el tren se da por hecho a la hora de LLEGADA del billete (9:50)')

  // § 3: las cajas de la organizada
  const o = m.cajasOrganizada({ recogida: 'Recogida en el hotel y traslado de regreso', duracion: '6 h', incluye: 'Barco a La Graciosa y paseo en velero con comida y barra libre' })
  debe(o.map((c) => `${c.etiqueta}:${c.grande}`).join() === 'RECOGIDA:En el hotel,DURACIÓN:6 h,TRANSPORTE:Incluido', 'org-hotel', `ficha del operador: ${o.map((c) => `${c.etiqueta}:${c.grande}`)}`)
  debe(o[0].sub === 'Sin hora aún', 'org-sin-hora', 'RECOGIDA «En el hotel» sin hora: «Sin hora aún» (la hora solo si la trae la reserva)')
  debe(m.cajasOrganizada({ recogida: 'Recogida en el hotel', horaDeRecogida: '07:30' })[0].sub === '7:30', 'org-con-hora', 'con la hora de la reserva, sale')
  const pm = m.cajasOrganizada({ meetingPoint: 'Piazza della Repubblica', horaDeRecogida: '07:30', duracion: '12-13 h' })
  debe(pm[0].grande === 'Punto de encuentro' && /Piazza della Repubblica/.test(pm[0].sub) && /7:30/.test(pm[0].sub), 'org-punto', `«${pm[0].grande}: ${pm[0].sub}»`)
  debe(m.cajasOrganizada({}).length === 0, 'org-nada', 'si no se sabe nada, no sale ninguna caja (nada inventado)')
  debe(m.cajasOrganizada({ descripcion: 'Incluye transporte en autobús, entrada a Pompeya' }).find((c) => c.dato === 'transporte')?.sub === 'Autocar', 'org-transporte', 'Pompeya: transporte incluido (autocar), de su descripción')
  debe(m.cajasOrganizada({ incluye: 'Entrada al museo. Transporte no incluido' }).find((c) => c.dato === 'transporte')?.grande === 'No incluido', 'org-no-incluido', '«Transporte no incluido» → «No incluido»')
  debe(!m.cajasOrganizada({ incluye: 'Entrada al museo' }).some((c) => c.dato === 'transporte'), 'org-transporte-desconocido', 'si la ficha no dice nada del transporte, la caja no sale')
}

/* ═══ 2. Lanzarote: La Graciosa por tu cuenta ═══ */
const ISLA = { lat: 29.2316, lng: -13.5036 }
const LEJOS = { lat: 28.8639, lng: -13.8277 }
const ferry = (id, time, origen, destino, extra = {}) => ({ id, kind: 'ferry', refId: id, name: `Ferry a ${destino}`, time, origen, destinoDeViaje: destino, compania: 'Líneas Romero', noMueve: true, unidaA: 'la_graciosa', ...extra })

async function parteLanzarote() {
  console.log('2. Lanzarote (iPhone 390x844): La Graciosa por tu cuenta')
  const v = await abrirV80('lanza')
  const { a, ev, clic, hay, texto } = v
  try {
    const dia = v.sonda.dias.find((d) => d.tipo === 'excursion').n
    const FECHA = '2026-11-27'
    const m = (o) => montar(v, { dia, fecha: FECHA, ...o })
    const pasos = () => ev("[...document.querySelectorAll('[data-hoy-paso]')].map((p) => (p.getAttribute('data-hoy-paso-numero') + (p.getAttribute('data-hoy-paso-estado') === 'hecho' ? 'H' : p.getAttribute('data-hoy-paso-estado') === 'ahora' ? 'A' : '-'))).join(' ')")
    const tipos = () => ev("[...document.querySelectorAll('[data-hoy-paso]')].map((p) => p.getAttribute('data-hoy-paso')).join()")
    const modo = () => ev(`${RUTA_STORE}.getState().mode`)

    /* — EX1: 8:00, sin nada — */
    await m({ min: 8 * 60 })
    debe(await hay('[data-hoy-excursion="por-tu-cuenta"]'), 'lz-por-tu-cuenta', 'La Graciosa sin reserva: por tu cuenta (modo habitual)')
    const tarjeta = await texto('[data-hoy-excursion-transporte]')
    debe(/EXCURSIÓN · VIE 27/.test(tarjeta) && /La Graciosa/.test(tarjeta), 'lz-ex1-cabecera', `la tarjeta: «${tarjeta.slice(0, 60)}»`)
    debe(/SALIDA/.test(tarjeta) && /FERRY/.test(tarjeta) && /10:00/.test(tarjeta) && /falta billete/i.test(tarjeta) && /VUELTA/.test(tarjeta) && /17:00/.test(tarjeta) && /Último barco/.test(tarjeta), 'lz-ex1-cajas', 'cajas SALIDA · FERRY (10:00, falta billete) · VUELTA (17:00, Último barco)')
    debe((await tipos()) === 'salida,ida,tiempo,vuelta,casa', 'lz-ex1-pasos', `los 5 pasos (${await tipos()})`)
    debe((await pasos()) === '1A 2- 3- 4- 5-', 'lz-ex1-ahora', `el paso 1 es el de ahora (${await pasos()})`)
    debe(/PASO 1 · AHORA/.test(await texto('[data-hoy-paso="salida"]')) && /^PASO 2$/.test((await texto('[data-hoy-paso="ida"] [data-hoy-paso-etiqueta]')).trim()), 'lz-ex1-numero', 'el número siempre: «PASO 1 · AHORA», «PASO 2»')
    debe(/Coche hasta Órzola/.test(await texto('[data-hoy-paso="salida"]')) && /Reposta antes/.test(await texto('[data-hoy-paso="salida"]')), 'lz-ex1-paso1', 'paso 1: coche hasta Órzola + consejo de los datos')
    debe(/Ferry de las 10:00 · Líneas Romero/.test(await texto('[data-hoy-paso="ida"]')), 'lz-ex1-paso2', 'paso 2: Ferry de las 10:00 · Líneas Romero (de `partes`)')
    debe((await hay('[data-hoy-paso="salida"] [data-hoy-excursion-como-llegar]')) && (await hay('[data-hoy-ya-he-llegado-salida]')), 'lz-ex1-botones', 'paso 1: [Cómo llegar] y [Ya he llegado]')
    debe(!(await hay('[data-hoy-saltar-parada]')) && !(await hay('[data-hoy-necesito-mas-tiempo]')), 'lz-sin-saltar', 'sin «Saltar parada» ni [Necesito más tiempo]')
    debe(!(await hay('[data-hoy-he-terminado]')), 'lz-tiempo-sin-terminado', '«Tu tiempo en La Graciosa» no lleva [He terminado] (ni nada de «terminado» en todo el día)')
    debe(await ev("document.querySelectorAll('[data-hoy-paso=\"tiempo\"] [data-hoy-idea-excursion]').length === 3"), 'lz-ideas-3', 'Tu tiempo: 3 ideas (playas reales de los datos)')
    const ideas = await ev("[...document.querySelectorAll('[data-hoy-idea-nombre]')].map((x) => x.textContent).join(' | ')")
    debe(/La Laja/.test(ideas) && /Salado/.test(ideas) && /La Francesa/.test(ideas), 'lz-ideas-nombres', `ideas: ${ideas}`)
    debe(await ev("[...document.querySelectorAll('[data-hoy-idea-como-llegar]')].every((x) => /google\\.com\\/maps/.test(x.getAttribute('href') ?? ''))"), 'lz-ideas-como-llegar', 'cada idea con su [Cómo llegar] (enlace de mapa)')
    const tiempo = await texto('[data-hoy-paso="tiempo"]')
    debe(/En Caleta de Sebo hay bares y restaurantes\./.test(tiempo) && !(await ev("[...document.querySelectorAll('[data-hoy-paso=\"tiempo\"] button')].some((b) => /restaurante|comer/i.test(b.textContent || ''))")), 'lz-restaurantes-una-linea', 'restaurantes: UNA línea, sin botón')
    debe(/No hay carreteras\./.test(tiempo), 'lz-nota-isla', 'la nota de `en_la_isla`')
    debe(!(await hay('[data-hoy-icono="que-vas-a-ver"]')), 'lz-sin-que-ver', 'sin «Qué ver» (La Graciosa no tiene «qué ver» en los datos: nunca un botón que no hace nada)')
    debe(await hay('[data-hoy-icono="escuchar"]'), 'lz-escuchar', '«Escuchar historia»: La Graciosa SÍ tiene historia en los datos')
    const hueco = await ev("document.querySelector('[data-hoy-hueco-que-hago-ahora]')?.innerText.trim() ?? ''")
    debe(!/¿Qué hago ahora\?/.test(await ev('document.body.innerText')) && hueco === '', 'lz-sin-que-hago-ahora', 'sin «¿Qué hago ahora?» en el día de excursión')
    // consejos con X
    debe((await hay('[data-consejos-del-dia]')) && (await hay('[data-consejos-x]')), 'lz-consejos-x', 'consejos con su X')
    await clic('[data-consejos-x]')
    await a.esp(500)
    debe(!(await hay('[data-consejos-del-dia]')), 'lz-consejos-cerrados', 'al pulsar la X, los consejos se van')
    await ev(`${RUTA_STORE}.getState().setMode('explore')`)
    await a.esp(700)
    await ev(`${RUTA_STORE}.getState().setMode('today')`)
    await a.esp(3000)
    debe(!(await hay('[data-consejos-del-dia]')) && (await hay('[data-hoy-excursion="por-tu-cuenta"]')), 'lz-consejos-no-vuelven', 'cambiar de pestaña y volver: los consejos cerrados NO vuelven ese día en ese viaje')
    // [Ya he llegado] → el ferry es el de ahora, sin billete
    await clic('[data-hoy-ya-he-llegado-salida]')
    await a.esp(600)
    debe((await pasos()) === '1H 2A 3- 4- 5-', 'lz-ya-he-llegado', `[Ya he llegado]: paso 1 hecho y toca el ferry (${await pasos()})`)
    debe((await hay('[data-hoy-sin-billete]')) && /Aún no tienes el billete del ferry/.test(await texto('[data-hoy-paso="ida"]')) && (await hay('[data-hoy-anadir-billete]')), 'lz-ex5-sin-billete', '«Aún no tienes el billete del ferry» con [Añadir tu reserva] (EX5)')
    debe(await hay('[data-hoy-he-embarcado]'), 'lz-he-embarcado', 'el ferry de ahora lleva [He embarcado]')
    await clic('[data-hoy-anadir-billete]')
    await a.esp(1500)
    debe((await modo()) === 'bookings', 'lz-anadir-a-reservas', '[Añadir tu reserva] lleva a RESERVAS')
    await m({ min: 9 * 60, estado: { llegado: true } })
    await clic('[data-hoy-he-embarcado]')
    await a.esp(600)
    debe((await pasos()) === '1H 2H 3A 4- 5-', 'lz-ferry-boton', `[He embarcado]: ferry hecho y «Tu tiempo» es el de ahora (${await pasos()})`)
    debe(!(await hay('[data-hoy-no-lo-cogiste]')), 'lz-ferry-boton-sin-aviso', 'por botón no sale «¿No has cogido este barco?»')

    /* — El ferry por GPS (EX2) — */
    await m({ min: 12 * 60 + 30, pos: ISLA })
    debe((await pasos()) === '1H 2H 3A 4- 5-', 'lz-ferry-gps', `con el GPS en la isla a las 12:30: pasos 1 y 2 hechos, «Tu tiempo» ahora (${await pasos()})`)
    debe(!(await hay('[data-hoy-no-lo-cogiste]')) && !(await hay('[data-hoy-aviso-ultimo]')), 'lz-ex2-sin-aviso', 'a las 12:30 no hay aviso del último barco')
    await m({ min: 9 * 60, pos: ISLA })
    debe((await pasos()) === '1H 2H 3A 4- 5-', 'lz-ferry-gps-pronto', 'el GPS en la isla lo da por hecho aunque la hora del ferry no haya pasado (9:00)')

    /* — El ferry por la hora — */
    await m({ min: 10 * 60 + 40 })
    debe((await pasos()) === '1H 2H 3A 4- 5-', 'lz-ferry-hora', `10:40 sin GPS ni botón: pasada la hora más el trayecto, hecho (${await pasos()})`)
    debe(await hay('[data-hoy-no-lo-cogiste]'), 'lz-no-lo-cogiste', 'en su paso queda «¿No has cogido este barco? [Cambiar la hora]»')
    await clic('[data-hoy-cambiar-hora]')
    await a.esp(800)
    debe(await hay('[data-hoja-de-hora-guardar]'), 'lz-cambiar-hora-hoja', '[Cambiar la hora] abre la rueda de la hora')
    await m({ min: 10 * 60 + 40, estado: { horaIda: '12:00', llegado: true } })
    debe((await pasos()) === '1H 2A 3- 4- 5-' && /Ferry de las 12:00/.test(await texto('[data-hoy-paso="ida"]')), 'lz-cambiar-hora-recalcula', `con la hora cambiada (12:00), los pasos se recalculan (${await pasos()})`)

    /* — El último barco: el aviso, 1 h 30 antes (EX3) — */
    await m({ min: 15 * 60 + 29, pos: ISLA })
    debe(!(await hay('[data-hoy-aviso-ultimo]')), 'lz-aviso-antes', 'a las 15:29 (1 h 31 antes) no hay aviso')
    await m({ min: 15 * 60 + 30, pos: ISLA })
    debe(await hay('[data-hoy-aviso-ultimo]'), 'lz-aviso-1h30', 'a las 15:30 (1 h 30 antes) sale el aviso')
    await m({ min: 16 * 60 + 15, pos: ISLA })
    const av = await texto('[data-hoy-aviso-ultimo]')
    debe(/El último barco sale a las 17:00/.test(av) && /Te quedan 45 min/.test(av), 'lz-ex3-aviso', `aviso (EX3): «${av}»`)
    debe((await ev("document.querySelector('[data-hoy-aviso-ultimo]')?.getAttribute('data-hoy-aviso-fila')")) === 'rojo' && (await hay('[data-hoy-ultimo-como-llegar]')) && /Cómo llegar al puerto/.test(await texto('[data-hoy-ultimo-como-llegar]')), 'lz-aviso-rojo', 'en la fila roja de siempre con [Cómo llegar al puerto]')
    debe((await pasos()) === '1H 2H 3H 4A 5-', 'lz-ex3-paso4', `a las 16:15 el barco de vuelta es el paso de ahora (${await pasos()})`)
    debe((await hay('[data-hoy-he-embarcado-vuelta]')) && (await hay('[data-hoy-vuelta-como-llegar]')), 'lz-ex3-botones', 'el de vuelta lleva [Cómo llegar al puerto] y [He embarcado]')
    // el último NO se supone
    await m({ min: 17 * 60 + 5, pos: ISLA })
    debe((await pasos()) === '1H 2H 3H 4A 5-' && (await hay('[data-hoy-aviso-ultimo]')), 'lz-ultimo-no-supuesto', `a las 17:05 con el GPS aún en la isla: sigue el aviso y el barco NO se da por cogido (${await pasos()})`)
    await m({ min: 20 * 60, estado: { embarcado: true } })
    debe((await pasos()) === '1H 2H 3H 4A 5-', 'lz-ultimo-no-supuesto-hora', `a las 20:00, sin GPS ni botón, tampoco (${await pasos()})`)
    await clic('[data-hoy-he-embarcado-vuelta]')
    await a.esp(700)
    debe((await pasos()) === '1H 2H 3H 4H 5A' && !(await hay('[data-hoy-aviso-ultimo]')), 'lz-vuelta-boton', `[He embarcado] de vuelta: paso 4 hecho, toca la vuelta al alojamiento y el aviso se va (${await pasos()})`)
    debe(await hay('[data-hoy-ideas-pendientes]'), 'lz-al-volver', 'al volver: «ideas y pendientes» (la pieza compartida), en lugar de «¿Qué hago ahora?»')
    await m({ min: 18 * 60, pos: LEJOS, estado: { embarcado: true, estuvo: true } })
    debe((await pasos()) === '1H 2H 3H 4H 5A', 'lz-vuelta-gps', `con el GPS ya fuera de la isla (después de haber estado): hecho (${await pasos()})`)

    /* — Con los billetes guardados (V76): la hora de su billete manda — */
    await m({ min: 16 * 60 + 30, pos: ISLA, reservas: [ferry('f-ida', '10:00', 'Órzola', 'La Graciosa'), ferry('f-vuelta', '17:30', 'La Graciosa', 'Órzola')] })
    const av2 = await texto('[data-hoy-aviso-ultimo]')
    debe(/Tu barco de vuelta sale a las 17:30/.test(av2) && /Te quedan 60 min/.test(av2), 'lz-aviso-billete', `con el billete de vuelta de las 17:30, el aviso es de SU hora (${av2})`)
    const t2 = await texto('[data-hoy-excursion-transporte]')
    debe(/VUELTA/.test(t2) && /17:30/.test(t2) && /Tu barco/.test(t2) && !/falta billete/i.test(t2), 'lz-cajas-billete', 'las cajas leen los billetes de RESERVAS (VUELTA 17:30 «Tu barco», sin «falta billete»)')
    debe((await ev("document.querySelectorAll('[data-hoy-fila-billete]').length")) === 2, 'lz-filas-billete', 'una fila por billete (ida y vuelta), las de V76')
    await m({ min: 9 * 60, estado: { llegado: true }, reservas: [ferry('f-ida', '10:00', 'Órzola', 'La Graciosa')] })
    debe(/Ferry de las 10:00 desde Órzola/.test(await texto('[data-hoy-paso="ida"]')) && !(await hay('[data-hoy-sin-billete]')), 'lz-fila-ida', 'con el billete de ida, el paso del ferry enseña su fila (y no «Aún no tienes el billete»)')

    /* — Una reserva de excursión organizada en RESERVAS la hace organizada — */
    await m({ min: 9 * 60, reservas: [{ id: 'r-lg', kind: 'excursion', refId: 'la_graciosa', name: 'Excursión a La Graciosa', time: '08:30', excursionId: 'la_graciosa', locator: 'CIV9' }] })
    debe((await hay('[data-hoy-excursion="organizada"]')) && !(await hay('[data-hoy-paso]')), 'lz-reserva-organizada', 'con una reserva de excursión guardada, La Graciosa pasa a organizada (sin pasos)')
    const org = await texto('[data-hoy-excursion-organizada]')
    debe(/RECOGIDA/.test(org) && /En el hotel/.test(org) && /8:30/.test(org), 'lz-organizada-recogida', `RECOGIDA «En el hotel» con la hora de la reserva (${org.slice(0, 100)})`)
  } finally {
    v.cerrar()
  }
}

/* ═══ 3. Roma: Pompeya organizada y Florencia en tren ═══ */
const POMPEYA = { id: 'pompeya_sorrento', title: 'Excursión a Pompeya y Sorrento', length: 'full-day', durationLabel: '13 h', price: 98.26, description: 'Descubre las ruinas de Pompeya con guía y pasea por Sorrento, la joya de la costa napolitana. Incluye transporte en autobús, entrada a Pompeya y tiempo libre en Sorrento.', durationText: '12-13 h', destinationCoords: { lat: 40.7497, lng: 14.4869 }, page: { nameBefore: 'Excursión a', nameDestination: 'Pompeya', nameAfter: ' y Sorrento', shortName: 'Pompeya', halfDay: false } }
const FLORENCIA = { id: 'florencia_tren', title: 'Excursión a Florencia en tren de alta velocidad', length: 'full-day', durationLabel: '13 h', price: 149, destinationCoords: { lat: 43.7696, lng: 11.2558 }, page: { nameBefore: 'Excursión a', nameDestination: 'Florencia', nameAfter: ' en tren de alta velocidad', shortName: 'Florencia', halfDay: false } }
const FLORENCIA_GPS = { lat: 43.7696, lng: 11.2558 }
const tren = (id, time, returnTime, origen, destino) => ({ id, kind: 'tren', refId: id, name: `Tren a ${destino}`, time, returnTime, origen, destinoDeViaje: destino, compania: 'Italo', noMueve: true, unidaA: 'florencia_tren' })

async function parteRoma() {
  console.log('3. Roma (iPhone 390x844): Pompeya organizada y Florencia en tren')
  const v = await abrirV80('roma')
  const { a, ev, clic, hay, texto } = v
  try {
    const pasos = () => ev("[...document.querySelectorAll('[data-hoy-paso]')].map((p) => (p.getAttribute('data-hoy-paso-numero') + (p.getAttribute('data-hoy-paso-estado') === 'hecho' ? 'H' : p.getAttribute('data-hoy-paso-estado') === 'ahora' ? 'A' : '-'))).join(' ')")
    const reservaP = (extra = {}) => ({ id: 'r-pompeya', kind: 'excursion', refId: 'pompeya_sorrento', name: 'Pompeya y Sorrento', time: '07:30', excursionId: 'pompeya_sorrento', locator: 'CIV123', ...extra })

    /* — EX4: Pompeya organizada — */
    await montar(v, { dia: 3, min: 9 * 60, fecha: '2026-11-26', excursion: POMPEYA, reservas: [reservaP({ meetingPoint: 'Piazza della Repubblica' })] })
    debe((await hay('[data-hoy-excursion="organizada"]')) && !(await hay('[data-hoy-paso]')), 'rm-organizada', 'Pompeya con su reserva: organizada, sin pasos (los lleva el guía)')
    const t = await texto('[data-hoy-excursion-organizada]')
    debe(/EXCURSIÓN · JUE 26/.test(t) && /Pompeya/.test(t), 'rm-ex4-cabecera', `la tarjeta: «${t.slice(0, 50)}»`)
    debe(/RECOGIDA/.test(t) && /Punto de encuentro/.test(t) && /Piazza della Repubblica/.test(t) && /7:30/.test(t), 'rm-ex4-recogida', 'RECOGIDA: «Punto de encuentro: …» con la hora de la reserva')
    debe(/DURACIÓN/.test(t) && /12-13 h/.test(t) && /TRANSPORTE/.test(t) && /Incluido/.test(t), 'rm-ex4-duracion-transporte', 'DURACIÓN (12-13 h) y TRANSPORTE (Incluido), de la ficha de la actividad')
    debe((await hay('[data-hoy-fila-billete]')) && /Pompeya y Sorrento/.test(await texto('[data-hoy-fila-billete]')), 'rm-ex4-reserva', 'la reserva con su QR (fila de billete)')
    debe((await hay('[data-consejos-del-dia]')) && (await hay('[data-consejos-x]')), 'rm-consejos-x', 'consejos de Pompeya con su X')
    debe(await hay('[data-hoy-he-terminado]'), 'rm-he-terminado', '[He terminado]')
    debe(!(await hay('[data-hoy-saltar-parada]')) && !(await hay('[data-hoy-necesito-mas-tiempo]')) && !/Saltar parada|Necesito más tiempo/.test(await ev('document.body.innerText')), 'rm-sin-saltar', 'sin «Saltar parada» ni [Necesito más tiempo]')
    debe(!/¿Qué hago ahora\?/.test(await ev('document.body.innerText')), 'rm-sin-que-hago-ahora', 'sin «¿Qué hago ahora?»')
    debe(!(await hay('[data-hoy-pedazos]')), 'rm-sin-pedazos', 'sin pedazos, no sale «Aquí ganas X pedazos»')
    debe(!(await hay('[data-hoy-icono="que-vas-a-ver"]')) && !(await hay('[data-hoy-icono="escuchar"]')), 'rm-sin-botones-vacios', 'Pompeya no tiene «qué ver» ni historia en los datos: esos botones NO salen (nunca un botón que no hace nada)')
    // sin punto de encuentro ni dato de recogida
    await montar(v, { dia: 3, min: 9 * 60, fecha: '2026-11-26', excursion: POMPEYA, reservas: [reservaP()] })
    const t2 = await texto('[data-hoy-excursion-organizada]')
    debe(!/RECOGIDA/.test(t2) && /DURACIÓN/.test(t2), 'rm-ex4-sin-recogida', 'sin punto de encuentro ni dato de recogida, la caja RECOGIDA no sale (nada inventado)')
    // los pedazos (demo de desarrollo: lo que diría el servidor)
    await a.evaluar("window.__pedazosDemo = { 'Pompeya': ['Casco de gladiador'] }; true")
    await montar(v, { dia: 3, min: 9 * 60, fecha: '2026-11-26', excursion: POMPEYA, reservas: [reservaP()] })
    const ped = await texto('[data-hoy-pedazos]')
    debe(/pedazo/i.test(ped) && /Casco de gladiador/.test(ped), 'rm-pedazos', `con pedazo: la pieza de la parada («${ped}»)`)
    await a.evaluar('delete window.__pedazosDemo; true')
    // [He terminado]
    await montar(v, { dia: 3, min: 9 * 60, fecha: '2026-11-26', excursion: POMPEYA, reservas: [reservaP()] })
    await clic('[data-hoy-he-terminado]')
    await a.esp(900)
    debe((await hay('[data-hoy-excursion-hecha]')) && !(await hay('[data-hoy-he-terminado]')), 'rm-terminado', '[He terminado]: «Excursión hecha»')
    debe(await hay('[data-hoy-ideas-pendientes]'), 'rm-al-volver', 'al terminar: «ideas y pendientes» (pieza compartida)')

    /* — EX6: Florencia en tren — */
    const reservasF = [tren('t-ida', '08:15', '09:50', 'Roma Termini', 'Santa Maria Novella'), tren('t-vuelta', '19:10', null, 'Santa Maria Novella', 'Roma Termini')]
    await montar(v, { dia: 3, min: 7 * 60 + 30, fecha: '2026-11-28', excursion: FLORENCIA, reservas: reservasF })
    debe(await hay('[data-hoy-excursion="por-tu-cuenta"]'), 'rm-florencia-por-tu-cuenta', 'Florencia con sus trenes unidos: por tu cuenta')
    const tf = await texto('[data-hoy-excursion-transporte]')
    debe(/EXCURSIÓN · SÁB 28/.test(tf) && /SALIDA/.test(tf) && /8:15/.test(tf) && /Roma Termini/.test(tf) && /LLEGADA/.test(tf) && /9:50/.test(tf) && /Santa Maria Novella/.test(tf) && /VUELTA/.test(tf) && /19:10/.test(tf) && /Tu tren/.test(tf), 'rm-ex6-cajas', 'EX6: SALIDA 8:15 Roma Termini · LLEGADA 9:50 Santa Maria Novella · VUELTA 19:10')
    debe((await ev("[...document.querySelectorAll('[data-hoy-paso]')].map((p) => p.getAttribute('data-hoy-paso')).join()")) === 'ida,tiempo,vuelta,casa', 'rm-ex6-pasos', 'cuatro pasos: tren de ida, «Tu tiempo en Florencia», tren de vuelta, vuelta al alojamiento (sin coche)')
    debe(/Tren a Florencia · 8:15 · Roma Termini/.test(await texto('[data-hoy-paso="ida"]')) && /PASO 1 · AHORA/.test(await texto('[data-hoy-paso="ida"]')), 'rm-ex6-paso1', 'PASO 1 · AHORA: Tren a Florencia · 8:15 · Roma Termini')
    debe((await hay('[data-hoy-paso="ida"] [data-hoy-fila-billete]')) && (await hay('[data-hoy-he-embarcado]')), 'rm-ex6-embarcado', 'el billete del tren con su fila y [He embarcado]')
    const ideasF = await ev("[...document.querySelectorAll('[data-hoy-idea-nombre]')].map((x) => x.textContent).join(' | ')")
    debe(/Duomo/.test(ideasF) && /Uffizi/.test(ideasF) && /Ponte Vecchio/.test(ideasF), 'rm-ex6-ideas', `Tu tiempo en Florencia: ${ideasF}`)
    debe(!(await ev("document.body.innerText.includes('Playa')")), 'rm-ex6-sin-playas', 'sin nada de La Graciosa en Florencia (los consejos y las ideas son de cada excursión)')
    await montar(v, { dia: 3, min: 12 * 60, pos: FLORENCIA_GPS, fecha: '2026-11-28', excursion: FLORENCIA, reservas: reservasF })
    debe((await pasos()) === '1H 2A 3- 4-', 'rm-tren-gps', `con el GPS en Florencia: el tren se da por hecho y «Tu tiempo» es el de ahora (${await pasos()})`)
    await montar(v, { dia: 3, min: 10 * 60, fecha: '2026-11-28', excursion: FLORENCIA, reservas: reservasF })
    debe((await pasos()) === '1H 2A 3- 4-' && (await hay('[data-hoy-no-lo-cogiste]')) && /¿No has cogido este tren\?/.test(await texto('[data-hoy-no-lo-cogiste]')), 'rm-tren-hora', 'sin GPS ni botón, pasada la llegada del billete (9:50): hecho y «¿No has cogido este tren? [Cambiar la hora]»')
    await montar(v, { dia: 3, min: 17 * 60 + 50, pos: FLORENCIA_GPS, fecha: '2026-11-28', excursion: FLORENCIA, reservas: reservasF })
    const avT = await texto('[data-hoy-aviso-ultimo]')
    debe(/Tu tren de vuelta sale a las 19:10/.test(avT) && /Te quedan 80 min/.test(avT) && /Cómo llegar a la estación/.test(await texto('[data-hoy-ultimo-como-llegar]')), 'rm-tren-aviso', `el aviso del tren de vuelta: «${avT}»`)
    // sin billetes: el modo habitual manda y dice que falta
    await montar(v, { dia: 3, min: 7 * 60, fecha: '2026-11-28', excursion: FLORENCIA, reservas: [] })
    debe((await hay('[data-hoy-excursion="por-tu-cuenta"]')) && /Falta billete/i.test(await texto('[data-hoy-excursion-transporte]')) && /Aún no tienes el billete del tren/.test(await texto('[data-hoy-paso="ida"]')), 'rm-florencia-sin-billete', 'Florencia sin billetes: por tu cuenta (modo habitual), con «Falta billete» y «Aún no tienes el billete del tren»')
  } finally {
    v.cerrar()
  }
}

if (QUE === 'todo' || QUE === 'pura') await partePura()
if (QUE === 'todo' || QUE === 'lanza') await parteLanzarote()
if (QUE === 'todo' || QUE === 'roma') await parteRoma()
console.log(`\nV80 (A): ${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log('  FALLO', f.regla, '·', f.texto)
process.exit(fallos.length ? 1 : 0)
