// La prueba de la Tanda 10S7, apartado 2 (agente R): el botón «Reorganizar» del pase (Piezas/Reorganizar R1 a R4).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S7_R.mjs
// Un solo Chrome de prueba. Necesita el Vite estable y la API ya encendidos (con el código nuevo: si el Vite se arrancó antes, reiniciarlo).
// Comprueba, con pase: el botón sale solo si reorganizar cambia algo, la alerta, «Ahora no», reorganizar sin quitar nada y solo los días afectados, la franja con «Deshacer», lo movido iluminado,
// un solo aviso para los demás, el menú «···» del día, que nada se reorganiza solo (ni el vuelo al guardarlo), y sin pase nada de esto sale. Saca las capturas R1 a R4 (con la de Design al lado).
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarDesign } from './capturaDesign.mjs'
import { queCambioEnElViaje } from '../../shared/avisos/textos.js'

const BASE = process.env.APP_URL || 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
let comprobaciones = 0
const fallos = []
const debe = (cond, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push(texto)
    console.log('✗', texto)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')

// ── 0. Lo que se ve en el código (textos de Eric, sitio del botón, nada de reorganizar solo) ─────────────────────────────────────────────────────
{
  const host = leer('src/components/reorganizar/ReorganizarHost.tsx')
  debe(host.includes('¿Reorganizamos tu día?') && host.includes('Adaptamos tus paradas a tu viaje y tus reservas a su hora, para que no pierdas tiempo.'), 'la alerta no lleva los textos de Eric (R2)')
  debe(/>\s*Reorganizar\s*<\/button>/.test(host) && />\s*Ahora no\s*<\/button>/.test(host), 'la alerta no lleva [Reorganizar] y [Ahora no]')
  const lib = leer('src/lib/reorganizarDia.ts')
  debe(lib.includes("'Hemos reorganizado tu día'"), 'la franja no dice «Hemos reorganizado tu día» (R3)')
  const vuelo = leer('src/lib/cambioDeVuelo.ts')
  debe(!/regenerateRouteForDates\(/.test(vuelo.replace(/\/\*[\s\S]*?\*\//g, '')), 'cambioDeVuelo.ts todavía rehace los días solo (regenerateRouteForDates)')
  const lista = leer('src/components/route/DayList.tsx')
  debe(/onReorganize=\{conPase && sePuedeReorganizar\(day\)/.test(lista), 'el menú «···» del día no saca «Reorganizar este día» solo con pase')
  debe(!/ReorganizarDia/.test(leer('src/components/route/dayDetail/DayDetailPanel.tsx')), 'el panel del día todavía lleva el botón viejo «Reorganizar este día»')
  const permisos = leer('src/components/reorganizar/useBotonReorganizarVisible.ts')
  debe(/puedeEditar/.test(permisos) && /usePagoActivo/.test(permisos), 'el botón no mira el pase ni el permiso de editar')
  // Un solo aviso: una acción con nombre propio, con la frase de Eric.
  const frase = queCambioEnElViaje({ cambio: { accion: { tipo: 'reorganizar', dia_n: 4, fecha: '2026-11-26', n: 1 } } }, false)
  debe(/^ha reorganizado el jueves 26$/.test(frase), `el aviso a los demás no dice «ha reorganizado el jueves 26»: «${frase}»`)
  const varios = queCambioEnElViaje({ cambio: { accion: { tipo: 'reorganizar', dia_n: 4, fecha: '2026-11-26', n: 3 } } }, false)
  debe(/^ha reorganizado 3 días$/.test(varios), `con varios días: «${varios}»`)
}

// ── 1. En la app, con pase ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const store = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore)"
const s = (cuerpo) => `${store}.then(async (R) => { const st = () => R.getState(); ${cuerpo} })`
const antes = "try{localStorage.setItem('trazo:moneda-pase','EUR')}catch(x){}; try{sessionStorage.removeItem('trazo:version')}catch(x){}"
const a = await abrirApp(BASE, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=completa&apertura=0', antes, ancho: 390, alto: 844 })
try {
  for (let i = 0; i < 120 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 90 && !(await a.evaluar(s('return Boolean(st().route)'))); i++) await a.esp(1000)
  await a.esp(3000)
  await a.evaluar(s("st().setMode('days'); st().setActiveDayId(st().route.days[1].id); return true"))
  await a.esp(2500)

  // (La hoja de «Hemos preparado tu viaje para estas fechas» se cierra para ver los botones de abajo, como haría el viajero.)
  for (let i = 0; i < 6; i++) {
    const hecho = await a.evaluar("(() => { const h = Array.from(document.querySelectorAll('[role=\"dialog\"]')).find((x) => /HEMOS PREPARADO|Hemos preparado/.test(x.innerText || '')); if (!h) return true; const b = Array.from(h.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Ok|Genial)$/i.test((x.innerText || '').trim())); b?.click(); return false })()")
    if (hecho) break
    await a.esp(700)
  }
  await a.esp(1200)
  const hayBoton = () => a.evaluar("Boolean(document.querySelector('[data-boton-reorganizar]'))")
  const fotoDelViaje = () => a.evaluar(s('return JSON.stringify(st().route.days.map((d) => ({ id: d.id, n: d.dayNumber, stops: d.stops.map((x) => ({ id: x.id, t: x.time, r: x.reservedId ?? null })) })))')).then((t) => JSON.parse(t))
  const esperaBoton = async (segundos = 25) => {
    for (let i = 0; i < segundos * 2; i++) {
      if (await hayBoton()) return true
      await a.esp(500)
    }
    return false
  }

  const inicio = await fotoDelViaje()
  const dia2 = inicio[1]
  const dia3 = inicio[2]
  debe(dia2.stops.length >= 3 && dia3.stops.length >= 2, `el viaje de prueba no tiene paradas suficientes en los días 2 y 3 (${dia2.stops.length}, ${dia3.stops.length})`)
  debe(!(await hayBoton()), 'sale el botón «Reorganizar» sin que el viajero haya cambiado nada')

  // (a) Un día en mal orden (se pone al revés SIN pasar por un cambio que cuente: mismas paradas) y una parada que llega de otro día → el botón sale.
  await a.evaluar(s("const d = st().route.days[1]; R.setState({ route: { ...st().route, days: st().route.days.map((x) => (x.id === d.id ? { ...x, stops: [...x.stops].reverse() } : x)) } }); return true"))
  await a.esp(1500)
  debe(!(await hayBoton()), 'el botón sale solo por poner el orden de un día (no es un cambio que lo pida)')
  const llegada = dia3.stops[dia3.stops.length - 1].id
  const antesMover = await fotoDelViaje()
  await a.evaluar(s(`st().moveStopToDay(${JSON.stringify(llegada)}, st().route.days[2].id, st().route.days[1].id); return true`))
  const salio = await esperaBoton()
  debe(salio, 'tras pasar una parada a otro día (con el día en mal orden) no sale el botón «Reorganizar»')
  await a.esp(1200)
  const rect = await a.evaluar("(() => { const r = document.querySelector('[data-boton-reorganizar]')?.getBoundingClientRect(); const l = document.querySelector('[data-boton-logros]')?.getBoundingClientRect(); return JSON.stringify({ r: r && { t: r.top, b: r.bottom, l: r.left, w: r.width }, l: l && { t: l.top, b: l.bottom, l: l.left, w: l.width }, ancho: innerWidth }) })()").then(JSON.parse)
  if (rect.r && rect.l) {
    debe(rect.l && rect.r.b <= rect.l.t + 0.5, `el botón no va encima del de logros (${JSON.stringify(rect)})`)
    debe(Math.abs(rect.r.w - 56) < 1, `el botón no mide 56 px (${rect.r.w})`)
    debe(Math.abs((rect.r.l + rect.r.w / 2) - (rect.l.l + rect.l.w / 2)) < 3, 'el botón no está en columna con el de logros')
  }
  await a.captura(path.join(SALIDA, '10s7_reorganizar_R1_boton.jpg'))

  // (b) La alerta; «Ahora no» lo esconde; el próximo cambio lo vuelve a sacar.
  await a.evaluar("document.querySelector('[data-boton-reorganizar]').click(); true")
  await a.esp(900)
  const alerta = await a.evaluar("(document.querySelector('[data-alerta-reorganizar]')?.innerText || '')")
  debe(/¿Reorganizamos tu día\?/.test(alerta) && /Adaptamos tus paradas a tu viaje y tus reservas a su hora, para que no pierdas tiempo\./.test(alerta) && /Reorganizar/.test(alerta) && /Ahora no/.test(alerta), `la alerta no dice lo que debe: «${alerta}»`)
  await a.captura(path.join(SALIDA, '10s7_reorganizar_R2_alerta.jpg'))
  await a.evaluar("document.querySelector('[data-reorganizar-no]').click(); true")
  await a.esp(800)
  debe(!(await hayBoton()) && !(await a.evaluar("Boolean(document.querySelector('[data-alerta-reorganizar]'))")), '«Ahora no» no esconde el botón y la alerta')
  const trasAhoraNo = await fotoDelViaje()

  // Un cambio nuevo que lo pide (otra parada llega al día 2): vuelve a salir.
  const otra = trasAhoraNo[3] ? trasAhoraNo[3].stops[0]?.id : null
  const dia4 = trasAhoraNo[2]
  const mover2 = dia4.stops.find((x) => !x.r)?.id
  await a.evaluar(s(`st().moveStopToDay(${JSON.stringify(mover2)}, st().route.days[2].id, st().route.days[1].id); return true`))
  void otra
  debe(await esperaBoton(), 'tras «Ahora no», el próximo cambio no vuelve a sacar el botón')

  // (c) Reorganizar: solo los días afectados, sin quitar nada, con «Deshacer» y lo movido iluminado, y un solo aviso para los demás.
  const antesReorg = await fotoDelViaje()
  await a.evaluar("document.querySelector('[data-boton-reorganizar]').click(); true")
  await a.esp(700)
  await a.evaluar("document.querySelector('[data-reorganizar-si]').click(); true")
  let toast = ''
  for (let i = 0; i < 40 && !/Hemos reorganizado/.test(toast); i++) {
    await a.esp(500)
    toast = await a.evaluar("(() => { const t = Array.from(document.querySelectorAll('p')).find((p) => /Hemos reorganizado/.test(p.textContent || '')); return t ? t.parentElement.innerText : '' })()")
  }
  debe(/Hemos reorganizado tu día/.test(toast) && /Deshacer/.test(toast), `no sale la franja «Hemos reorganizado tu día» con [Deshacer]: «${toast}»`)
  debe(await a.evaluar("Boolean(document.querySelector('[data-aviso-reorganizado]'))"), 'la franja no lleva el círculo dorado con el ✓ (R3)')
  const iluminadas = await a.evaluar("document.querySelectorAll('[data-parada-marcada]').length")
  const infoDom = await a.evaluar(s("const m = await import('/src/store/useReorganizarStore.ts'); return JSON.stringify({ iluminadas: m.useReorganizarStore.getState().iluminadas.length, enDom: document.querySelectorAll('[data-stop-id]').length })"))
  debe(iluminadas > 0, `no se ilumina ninguna parada movida (${infoDom})`)
  await a.captura(path.join(SALIDA, '10s7_reorganizar_R3_franja.jpg'))
  const despuesReorg = await fotoDelViaje()
  const ids = (f) => f.map((d) => [...d.stops.map((x) => x.id)].sort().join(','))
  debe(JSON.stringify(ids(antesReorg)) === JSON.stringify(ids(despuesReorg)), 'reorganizar ha quitado, añadido o pasado de día alguna parada')
  const cambiados = antesReorg.filter((d, i) => JSON.stringify(d.stops.map((x) => x.id)) !== JSON.stringify(despuesReorg[i].stops.map((x) => x.id))).map((d) => d.n)
  debe(cambiados.length >= 1 && cambiados.every((n) => n === dia2.n), `reorganizar ha tocado días que no eran los afectados (${cambiados.join(',')}; solo el ${dia2.n})`)
  debe(!(await hayBoton()), 'el botón sigue después de reorganizar')
  const aviso = await a.evaluar(s("const u = st().route.ultimoCambio; return JSON.stringify(u ? { tipo: u.accion?.tipo, n: u.accion?.n, dia: u.accion?.dia_n } : null)")).then(JSON.parse)
  debe(aviso && aviso.tipo === 'reorganizar' && aviso.n === 1 && aviso.dia === dia2.n, `el aviso a los demás no es UNO solo de «reorganizar» del día ${dia2.n}: ${JSON.stringify(aviso)}`)
  // El día ya está en buen orden: el cálculo que decide el botón dice que no cambia nada.
  const yaBien = await a.evaluar(s("const m = await import('/src/lib/reorganizarDia.ts'); const c = await m.diasQueCambian([st().route.days[1].id]); return c.length"))
  debe(yaBien === 0, `tras reorganizar, el día 2 aún dice que cambiaría (${yaBien}): el botón saldría sin hacer falta`)
  // Deshacer lo devuelve todo.
  await a.evaluar("(Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Deshacer')).click(); true")
  await a.esp(900)
  const tras = await fotoDelViaje()
  debe(JSON.stringify(tras) === JSON.stringify(antesReorg), '«Deshacer» no devuelve la ruta tal cual estaba')

  // (d) El menú «···» del día: con pase sale «Reorganizar este día»; reorganiza ese día.
  await a.evaluar(s("st().setMode('days'); st().setActiveDayId(null); return true"))
  await a.esp(1500)
  const abrirMenu = () => a.evaluar("(() => { const b = document.querySelectorAll('button[aria-label=\"Más opciones del día\"]')[1]; if (!b) return false; b.click(); return true })()")
  debe(await abrirMenu(), 'no encuentro el menú «···» del día 2')
  await a.esp(900)
  const menu = await a.evaluar("Array.from(document.querySelectorAll('[role=\"dialog\"], [data-hoja]')).map((x) => x.innerText).join('|')")
  debe(/Reorganizar este día/.test(menu), `el menú «···» con pase no lleva «Reorganizar este día»: «${menu.slice(0, 200)}»`)
  await a.captura(path.join(SALIDA, '10s7_reorganizar_R4_menu.jpg'))
  await a.evaluar("(() => { const o = Array.from(document.querySelectorAll('button, [role=\"button\"]')).find((x) => /Reorganizar este día/.test(x.innerText || '')); o?.click(); return true })()")
  await a.esp(2500)
  const trasMenu = await fotoDelViaje()
  debe(JSON.stringify(trasMenu[1].stops.map((x) => x.id)) !== JSON.stringify(antesReorg[1].stops.map((x) => x.id)) || /buen orden/.test(await a.evaluar("document.body.innerText")), '«Reorganizar este día» del menú no hace nada ni dice que está en buen orden')
  debe(JSON.stringify(ids(trasMenu)) === JSON.stringify(ids(antesReorg)), 'el menú ha quitado o pasado de día alguna parada')
  await a.evaluar(s('const m = await import("/src/store/useAddFlowStore.ts"); m.useAddFlowStore.getState().undo(); return true'))

  // (e) Nada se reorganiza solo: guardar el vuelo no recoloca ningún día (y no arranca el rehacer).
  const antesVuelo = await fotoDelViaje()
  await a.evaluar(s("st().setArrivalFlightTime('21:40'); st().setDepartureFlightTime('09:15'); const m = await import('/src/lib/cambioDeVuelo.ts'); const r = m.rehacerPorCambioDeVuelo({ que: 'hora', mitad: 'arrival' }); return r"))
  await a.esp(2500)
  const rehaciendo = await a.evaluar(s('return st().rehaciendoRuta'))
  const trasVuelo = await fotoDelViaje()
  debe(rehaciendo === false, 'guardar el vuelo con pase arranca el rehacer de la ruta')
  debe(JSON.stringify(trasVuelo.map((d) => d.stops.map((x) => x.id))) === JSON.stringify(antesVuelo.map((d) => d.stops.map((x) => x.id))), 'guardar el vuelo con pase recoloca las paradas solo')
  // La zona del alojamiento tampoco rehace nada.
  await a.evaluar(s("const z = st().route.destination; const m = await import('/src/lib/cambioDeVuelo.ts'); st().setAccommodationZone('trastevere'); m.rehacerPorCambioDeVuelo({ que: 'zona', mitad: null }); return z"))
  await a.esp(2000)
  const trasZona = await fotoDelViaje()
  debe(JSON.stringify(trasZona.map((d) => d.stops.map((x) => x.id))) === JSON.stringify(antesVuelo.map((d) => d.stops.map((x) => x.id))), 'elegir la zona del alojamiento recoloca las paradas solo')

  // (f) Sin pase, nada: ni botón ni opción en el menú.
  await a.evaluar("history.replaceState(null, '', '/?cuentas=off&logros=on&version=gratis&apertura=0'); sessionStorage.setItem('trazo:version','gratis'); true")
  await a.evaluar(s("const d = st().route.days[1]; R.setState({ route: { ...st().route, days: st().route.days.map((x) => (x.id === d.id ? { ...x, stops: [...x.stops].reverse() } : x)) } }); const o = st().route.days.find((x) => x.id !== d.id && x.stops.length > 1); st().moveStopToDay(o.stops[0].id, o.id, d.id); return true"))
  // (Cambiar de pestaña repinta: en la app el pase llega por el aviso de `usePagoActivo`; aquí se cambió por la dirección y hay que repintar a mano.)
  await a.evaluar(s("st().setMode('explore'); return true"))
  await a.esp(1500)
  await a.evaluar(s("st().setMode('days'); return true"))
  await a.esp(3500)
  debe(!(await hayBoton()), 'sin pase sale el botón «Reorganizar»')
  await a.evaluar("(() => { document.querySelectorAll('[data-reorganizar-no]').forEach((b) => b.click()); return true })()")
  await a.evaluar(s("st().setActiveDayId(null); st().setMode('days'); return true"))
  await a.esp(1500)
  await a.evaluar("(() => { const b = document.querySelectorAll('button[aria-label=\"Más opciones del día\"]')[1]; b?.click(); return true })()")
  await a.esp(900)
  const menuSin = await a.evaluar("Array.from(document.querySelectorAll('[role=\"dialog\"], [data-hoja]')).map((x) => x.innerText).join('|')")
  debe(menuSin.length > 0 && !/Reorganizar este día/.test(menuSin), `sin pase el menú «···» lleva «Reorganizar este día»: «${menuSin.slice(0, 160)}»`)
} finally {
  a.cerrar()
}

// ── 2. Design al lado (R1 a R4) ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
if (process.env.SOLO_APP !== '1') {
  const ir = (rotulo) => `(() => { const t = Array.from(document.querySelectorAll('span')).find((x) => x.textContent.trim().startsWith(${JSON.stringify(rotulo)}) && x.children.length === 0); const tel = t.parentElement.querySelector('div'); tel.scrollIntoView({ block: 'start' }); return true })()`
  for (const [rotulo, nombre] of [['R1 ·', 'R1_boton'], ['R2 ·', 'R2_alerta'], ['R3 ·', 'R3_franja'], ['R4 ·', 'R4_menu']]) {
    try {
      await capturarDesign('Piezas/Reorganizar.dc.html', path.join(SALIDA, `10s7_reorganizar_${nombre}_design.jpg`), { ancho: 450, alto: 950, despues: ir(rotulo), espera: 8 })
    } catch (e) {
      console.log('(sin captura de Design', nombre, String(e).slice(0, 80), ')')
    }
  }
}

console.log(`\nPrueba 10S7 R (Reorganizar): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
