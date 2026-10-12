// La prueba de la Tanda 6y9, parte de las pantallas (puntos 2 y 3).
//   API_URL=http://localhost:8853 node scripts/destino/pruebaFase6y9_pantallas.mjs      (con el servidor de la app encendido en ese puerto)
// Da fallo si:
//   1. la rueda de la hora de una entrada no llega a la ÚLTIMA ENTRADA oficial del tramo de esa fecha (con tramos de ejemplo y con el servidor), o no empieza en la apertura, o los turnos reales no mandan;
//   2. «Recuerda revisar la disponibilidad antes de añadirlo a tu ruta» no sale debajo de la rueda (entradas y Free Tour);
//   3. la hoja del Free Tour no lleva las 6 horas (10, 12, 15, 17, 19 y 21), los nombres «Después de comer» (15:00) y «Por la tarde» (17:00), el texto nuevo de arriba y [Ver disponibilidad] debajo de las horas;
//   4. [Ver disponibilidad] no abre el enlace de la tienda con NUESTRO código de afiliado y el aviso «Abriendo…», o sale el nombre de una empresa en un texto;
//   5. queda en src el texto viejo del Free Tour, o la lista de horas del Free Tour está escrita en más de un sitio.
import fs from 'node:fs'
import path from 'node:path'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const recorrer = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? recorrer(path.join(dir, e.name)) : [path.join(dir, e.name).replace(/\\/g, '/')]))
const fuentes = recorrer('src').filter((f) => /\.(ts|tsx)$/.test(f))
const API = process.env.API_URL ?? 'http://localhost:8787'

const { M } = await prepararSSR('scripts/destino/_6y9_pantallas_entrada.tsx')
const { createElement, renderToStaticMarkup, useRouteStore, horasDeLaRueda, AVISO_DISPONIBILIDAD, FREE_TOUR_FRANJAS, FREE_TOUR_HOURS } = M
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const html = (componente, props) => renderToStaticMarkup(createElement(componente, props))
const aTexto = (h) => h.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
const asMin = (h) => Number(h.split(':')[0]) * 60 + Number(h.split(':')[1])
const horasDe = (lugar, fecha, extra = {}) =>
  fetch(`${API}/api/reservation-hours`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma', place: lugar, date_iso: fecha ?? null, ...extra }) }).then((r) => r.json())

// ── 1. La rueda, hasta la última entrada ──
console.log('1. La rueda llega a la última entrada')
{
  // Con tramos de ejemplo (sin depender de los datos): la última hora de la rueda es la última entrada del tramo, no el cierre.
  const octubre = { cerrado: false, ventanas: [{ desde: '08:30', hasta: '17:30' }], turnos: null }
  const invierno = { cerrado: false, ventanas: [{ desde: '08:30', hasta: '14:30' }], turnos: null }
  const r1 = horasDeLaRueda(octubre)
  const r2 = horasDeLaRueda(invierno)
  debe(r1[0] === '08:30' && r1[r1.length - 1] === '17:30', '1 tramo ejemplo', `la rueda de un tramo 08:30-17:30 va de ${r1[0]} a ${r1[r1.length - 1]}`)
  debe(r2[0] === '08:30' && r2[r2.length - 1] === '14:30', '1 tramo ejemplo', `la rueda de un tramo 08:30-14:30 va de ${r2[0]} a ${r2[r2.length - 1]}`)
  const partido = horasDeLaRueda({ cerrado: false, ventanas: [{ desde: '09:00', hasta: '12:00' }, { desde: '14:00', hasta: '16:45' }], turnos: null })
  debe(partido[partido.length - 1] === '16:45' && partido.includes('11:45') && !partido.includes('13:00'), '1 tramo ejemplo', 'con un horario partido la rueda no respeta los dos tramos')
  const turnos = horasDeLaRueda({ cerrado: false, ventanas: [{ desde: '09:00', hasta: '18:00' }], turnos: ['09:00', '10:00', '17:45'] }, '12:30')
  debe(turnos.join(',') === '09:00,10:00,12:30,17:45', '1 turnos', `con turnos reales la rueda solo lleva esos (y la hora de la reserva que ya hay): ${turnos.join(',')}`)
  debe(horasDeLaRueda(null)[horasDeLaRueda(null).length - 1] === '19:45', '1 sin datos', 'sin datos la rueda no va de 8:00 a 19:45')

  // Con el servidor: la última hora de la rueda es la última entrada del día en cada sitio y cada mes (el día 15 de 2026).
  let revisados = 0
  for (const lugar of ['Coliseo', 'Foro Romano', 'Museos Vaticanos y Capilla Sixtina', 'Galería Borghese', 'Panteón']) {
    for (let mes = 1; mes <= 12; mes++) {
      const fecha = `2026-${String(mes).padStart(2, '0')}-15`
      const h = await horasDe(lugar, fecha)
      if (h.cerrado || !h.ventanas?.length) continue
      const rueda = horasDeLaRueda(h)
      const ultimaVentana = h.ventanas[h.ventanas.length - 1].hasta
      revisados++
      if (h.turnos?.length) {
        debe(rueda.every((x) => h.turnos.includes(x)), '1 turnos', `${lugar} ${fecha}: la rueda lleva horas que no son turnos reales`)
      } else {
        debe(asMin(rueda[rueda.length - 1]) <= asMin(ultimaVentana) && asMin(ultimaVentana) - asMin(rueda[rueda.length - 1]) < 15, '1 última entrada', `${lugar} ${fecha}: la rueda acaba en ${rueda[rueda.length - 1]} y la última entrada es ${ultimaVentana}`)
      }
    }
  }
  debe(revisados >= 30, '1 servidor', `solo se revisaron ${revisados} combinaciones de sitio y mes (se esperaban más de 30)`)
  // El caso de Eric: el Coliseo en octubre de 2026 llega a las 17:30 (apertura 08:30).
  const coliseoOctubre = await horasDe('Coliseo', '2026-10-15')
  const ruedaOctubre = horasDeLaRueda(coliseoOctubre)
  debe(ruedaOctubre[0] === '08:30' && ruedaOctubre[ruedaOctubre.length - 1] === '17:30', '1 Coliseo octubre', `la rueda del Coliseo el 15 de octubre va de ${ruedaOctubre[0]} a ${ruedaOctubre[ruedaOctubre.length - 1]} (debe ser 08:30 a 17:30)`)
  // Sin fechas, el del mes que eligió el viajero.
  const sinFechas = await horasDe('Coliseo', null, { month: 10 })
  const ruedaMes = horasDeLaRueda(sinFechas)
  const ultimaMes = sinFechas.ventanas[sinFechas.ventanas.length - 1]?.hasta
  debe(ultimaMes && asMin(ruedaMes[ruedaMes.length - 1]) <= asMin(ultimaMes) && asMin(ultimaMes) - asMin(ruedaMes[ruedaMes.length - 1]) < 15, '1 sin fechas', `sin fechas, la rueda acaba en ${ruedaMes[ruedaMes.length - 1]} y la última entrada del servidor es ${ultimaMes}`)
  // (Aviso, no fallo: el servidor sin fechas usa hoy la ESTACIÓN del mes —otoño: 15:30—, no el tramo por fechas; lo arregla el agente A al integrar `horarioDeLaFecha(sitio, mes)`.)
  if (ruedaMes[ruedaMes.length - 1] !== '17:30') console.log(`   AVISO: sin fechas, mes 10, el Coliseo acaba en ${ruedaMes[ruedaMes.length - 1]} (con fechas, 17:30): pendiente del horario por mes del agente A`)
}

// ── 2. El aviso de debajo de la rueda ──
console.log('2. El aviso de debajo de la rueda')
{
  debe(AVISO_DISPONIBILIDAD === 'Recuerda revisar la disponibilidad antes de añadirlo a tu ruta.', '2 texto', `el aviso no es el de Eric: «${AVISO_DISPONIBILIDAD}»`)
  const hoja = leer('src/components/route/reservas/AddReservationSheet.tsx')
  const iRueda = hoja.indexOf('<TimeListWheel')
  const iAviso = hoja.indexOf('{AVISO_DISPONIBILIDAD}')
  const iPrecio = hoja.indexOf('<CampoPrecio')
  debe(iRueda > 0 && iAviso > iRueda && iAviso < iPrecio, '2 sitio', 'el aviso no va entre la rueda y el precio, en la hoja de la hora')
  debe(/!isExcursion && \(\s*<p[^>]*>\s*\{AVISO_DISPONIBILIDAD\}/.test(hoja), '2 sitio', 'el aviso no sale en las entradas y el Free Tour (y solo ahí)')
  // La rueda toma las horas de UNA pieza compartida, sin su propia cuenta.
  debe(/horasDeLaRueda\(entryHours/.test(hoja) && /useHorarioDeEntrada\(/.test(hoja) && !/m \+= 15/.test(hoja), '2 una pieza', 'la rueda de la hoja de reserva vuelve a calcular las horas por su cuenta')

  // Pintada de verdad: una entrada y el Free Tour a mano.
  const ruta = {
    id: 'p6y9', destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2026-10-01', intensity: 1, budget: { items: [], total: 0 },
    days: [1, 2, 3].map((n) => ({ id: `d${n}`, dayNumber: n, city: 'Roma', countryCode: 'it', title: '', curatedTitle: '', stops: [], meals: [], excursions: [], dayType: 'normal', timesAreFinal: true, colorIndex: n - 1 })),
    answers: { dateRange: { start: '2026-10-15', end: '2026-10-17' }, days: 3, companion: 'solo', month: 10 },
    transportContext: { transport_option: { id: 'flight' }, archetype: null },
  }
  useRouteStore.setState({ screen: 'route', mode: 'reservas', route: ruta, reservations: [] })
  const entrada = aTexto(html(M.AddReservationSheet, { route: ruta, target: { kind: 'entrada', refId: 'Coliseo', name: 'Coliseo', placeNames: ['Coliseo'], currentDayId: 'd1', existing: null }, onClose() {} }))
  debe(plano(entrada).includes(AVISO_DISPONIBILIDAD), '2 pintado', 'la hoja de una entrada no enseña el aviso de la disponibilidad')
  const ft = aTexto(html(M.AddReservationSheet, { route: ruta, target: { kind: 'entrada', refId: 'Free Tour', name: 'Free Tour por Roma', placeNames: ['Free Tour por Roma'], currentDayId: 'd1', existing: null }, onClose() {} }))
  debe(plano(ft).includes(AVISO_DISPONIBILIDAD), '2 pintado', 'la hoja del Free Tour (como reserva) no enseña el aviso de la disponibilidad')
  for (const hora of FREE_TOUR_HOURS) debe(ft.split('\n').includes(hora), '2 pintado', `la hoja del Free Tour (como reserva) no enseña la hora ${hora}`)
}

// ── 3. La hoja del Free Tour ──
console.log('3. La hoja del Free Tour')
await M.fetchDestinationExcursions('Roma')
{
  debe(FREE_TOUR_HOURS.join(',') === '10:00,12:00,15:00,17:00,19:00,21:00', '3 horas', `las horas del Free Tour son ${FREE_TOUR_HOURS.join(', ')} (deben ser 10, 12, 15, 17, 19 y 21)`)
  const nombre = (hora) => FREE_TOUR_FRANJAS.find((f) => f.hora === hora)?.label
  debe(nombre('15:00') === 'Después de comer' && nombre('17:00') === 'Por la tarde', '3 nombres', `la de las 15:00 se llama «${nombre('15:00')}» y la de las 17:00 «${nombre('17:00')}»`)
  debe(FREE_TOUR_FRANJAS.find((f) => f.hora === '19:00')?.id === 'noche', '3 franja 19', 'el de las 19:00 no va como el de las 21:00 (franja de noche)')
  const ruta = {
    id: 'p6y9b', destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2026-10-01', intensity: 1, budget: { items: [], total: 0 },
    days: [1, 2, 3].map((n) => ({ id: `d${n}`, dayNumber: n, city: 'Roma', countryCode: 'it', curatedId: `D${n}`, title: '', curatedTitle: '', stops: [], meals: [], excursions: [], dayType: 'normal', timesAreFinal: true, colorIndex: n - 1 })),
    answers: { dateRange: { start: '2026-10-15', end: '2026-10-17' }, days: 3, companion: 'solo', month: 10 },
    transportContext: { transport_option: { id: 'flight' }, archetype: null },
  }
  useRouteStore.setState({ screen: 'route', mode: 'reservas', route: ruta, reservations: [] })
  const h = html(M.FreeTourSheet, { route: ruta, onClose() {} })
  const t = aTexto(h)
  const lineas = t.split('\n')
  for (const hora of FREE_TOUR_HOURS) debe(lineas.includes(hora), '3 horas pintadas', `la hoja del Free Tour no enseña ${hora}`)
  debe(lineas.includes('Después de comer') && lineas.includes('Por la tarde'), '3 nombres pintados', 'la hoja no enseña «Después de comer» y «Por la tarde»')
  debe(plano(t).includes('Lo ponemos al principio de tu viaje: es cuando más vale la pena, porque te ayuda a situarte. Recuerda revisar la disponibilidad antes de añadirlo a tu ruta.'), '3 texto de arriba', 'el texto de arriba de la hoja no es el nuevo')
  debe(!/se rehace con el Free Tour/.test(t), '3 texto viejo', 'la hoja aún enseña «Tu ruta se rehace con el Free Tour…»')
  const iUltimaHora = h.lastIndexOf('21:00')
  const iBoton = h.indexOf('Ver disponibilidad')
  debe(iBoton > iUltimaHora && iUltimaHora > 0, '3 botón', '[Ver disponibilidad] no va debajo de las horas')
  debe(/<button[^>]*bg-accent[^>]*>Ver disponibilidad<\/button>/.test(h), '3 botón', '[Ver disponibilidad] no es un botón de los nuestros (bg-accent, texto blanco)')
}

// ── 4. [Ver disponibilidad] ──
console.log('4. [Ver disponibilidad]')
{
  const pieza = leer('src/components/route/reservas/VerDisponibilidad.tsx')
  debe(/openTicketShop\(href, 'Abriendo…'\)/.test(pieza), '4 una pieza', '[Ver disponibilidad] no abre la tienda con openTicketShop y el aviso «Abriendo…»')
  // Lo que hace de verdad: abrir el enlace con nuestro código de afiliado y dejar el aviso.
  const abiertos = []
  globalThis.window.open = (url) => abiertos.push(url)
  const info = (await M.fetchDestinationExcursions('Roma')).entradasPorSitio['Free Tour']?.[0]
  M.openTicketShop(info?.url ?? 'https://www.civitatis.com/es/roma/free-tour-roma/', 'Abriendo…')
  debe(abiertos.length === 1 && /aid=5206/.test(abiertos[0]), '4 afiliado', `el enlace que se abre no lleva nuestro código de afiliado: ${abiertos[0]}`)
  debe(M.useAddFlowStore.getState().toast?.message === 'Abriendo…', '4 aviso', `el aviso no es «Abriendo…»: ${M.useAddFlowStore.getState().toast?.message}`)
  // Ningún nombre de empresa en los textos nuevos (el código puede importar rutas con su nombre; el texto, no).
  const nombres = /civitatis|getyourguide|viator|booking|stay22|tiqets|freetour\.com/i
  for (const f of ['src/components/route/reservas/VerDisponibilidad.tsx', 'src/components/route/reservas/FreeTourSheet.tsx', 'src/lib/freeTourHoras.ts', 'src/lib/horarioDeEntrada.ts']) {
    const texto = leer(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').split('\n').filter((l) => !/^\s*import /.test(l) && !/^\s*\/\//.test(l)).join('\n')
    debe(!nombres.test(texto), '4 sin empresa', `${f} nombra una empresa en su código/texto`)
  }
  const hojas = aTexto(html(M.FreeTourSheet, { route: { id: 'x', destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2026-10-01', intensity: 1, budget: { items: [], total: 0 }, days: [1, 2].map((n) => ({ id: `d${n}`, dayNumber: n, city: 'Roma', countryCode: 'it', curatedId: `D${n}`, title: '', curatedTitle: '', stops: [], meals: [], excursions: [], dayType: 'normal', timesAreFinal: true, colorIndex: n })), answers: { days: 2, companion: 'solo' }, transportContext: { transport_option: { id: 'flight' }, archetype: null } }, onClose() {} }))
  debe(!nombres.test(hojas), '4 sin empresa', 'la hoja del Free Tour enseña el nombre de una empresa')
}

// ── 5. Nada viejo en src ──
console.log('5. Nada viejo en src')
{
  const viejos = fuentes.filter((f) => /Tu ruta se rehace con el Free Tour|el día que lo lleva cambia a su versión/.test(leer(f)))
  debe(viejos.length === 0, '5 texto viejo', `queda el texto viejo del Free Tour en: ${viejos.join(', ')}`)
  const listas = fuentes.filter((f) => /\['10:00',\s*'12:00'/.test(leer(f)) || /hora: '17:00'/.test(leer(f)))
  debe(listas.length === 1 && listas[0] === 'src/lib/freeTourHoras.ts', '5 una lista', `la lista de horas del Free Tour está en ${listas.join(', ')} (debe estar solo en src/lib/freeTourHoras.ts)`)
  const mal = fuentes.filter((f) => f !== 'src/lib/freeTourHoras.ts' && /label: 'Por la tarde', hora: '15:00'/.test(leer(f)))
  debe(mal.length === 0, '5 nombre viejo', 'la de las 15:00 sigue llamándose «Por la tarde»')
}

// ── 6. Dos cambios de fechas seguidos: gana el último (P7) ──
console.log('6. Gana el último cambio de fechas')
{
  const ruta = {
    id: 'p6y9-p7', destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 },
    days: [1, 2, 3].map((n) => ({ id: `d${n}`, dayNumber: n, city: 'Roma', countryCode: 'it', title: '', curatedTitle: '', stops: [], meals: [], excursions: [], dayType: 'normal', timesAreFinal: true, colorIndex: n - 1 })),
    answers: { dateRange: { start: '2027-08-10', end: '2027-08-12' }, days: 3, companion: 'solo' },
    transportContext: { transport_option: { id: 'flight' }, archetype: null },
  }
  useRouteStore.setState({ screen: 'route', mode: 'days', route: ruta, rehaciendoRuta: false, rehacerGeneracion: 0, keepBookingsOnNextRoute: false })
  useRouteStore.getState().regenerateRouteForDates({ start: '2027-09-14', end: '2027-09-16' })
  const g1 = useRouteStore.getState().rehacerGeneracion
  useRouteStore.getState().regenerateRouteForDates({ start: '2027-10-05', end: '2027-10-07' })
  const s = useRouteStore.getState()
  debe(s.answers.dateRange?.start === '2027-10-05' && s.answers.month === 9, '6 gana el último', `con dos cambios seguidos las fechas son ${s.answers.dateRange?.start} (deben ser las del último, 2027-10-05)`)
  debe(s.rehacerGeneracion === g1 + 1 && s.rehaciendoRuta === true && s.screen === 'route', '6 gana el último', 'el segundo cambio no cuenta como un rehacer nuevo (generación) o saca al viajero de su pantalla')
  const comp = leer('src/components/route/RehacerRuta.tsx')
  debe(/<RehacerRutaEnMarcha key=\{generacion\}/.test(comp), '6 cancela el primero', 'RehacerRuta no se vuelve a montar con otra key por cada rehacer (el primero no se cancela)')
  const gen = leer('src/lib/useRouteGeneration.ts')
  debe(/cancelled = true/.test(gen) && /if \(cancelled\) return\s*\n\s*setRoute\(scheduled\)/.test(gen), '6 cancela el primero', 'useRouteGeneration no ignora el resultado de una generación cancelada')
  const reglas = fuentes.filter((f) => /rehaciendoRuta\) return state/.test(leer(f)))
  debe(reglas.length === 0, '6 una sola regla', `queda un sitio que ignora el segundo cambio: ${reglas.join(', ')}`)
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO [${f.regla}] ${f.texto}`)
process.exitCode = fallos.length ? 1 : 0
setTimeout(() => process.exit(process.exitCode), 300).unref()
