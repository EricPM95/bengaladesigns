// Las capturas de la Tanda 10 (JUTRIP), en tamaño móvil (390 x 844), en docs/dias/capturas_jutrip/: la primera pantalla en sus estados A a G, pasos del formulario, la pantalla de entrar, la
// de apertura, el icono, las películas E12 y E13 (un fotograma del principio y uno del final) y la app por dentro, de día y de noche.
// Hace falta `npm run server` y `npm run dev` (y Internet: el buscador del origen es el de siempre).
//   API_URL=http://localhost:8787 node scripts/destino/capturasJutrip.mjs [parte ...]      (partes: primera formulario entrar apertura peliculas interior)
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const SALIDA = path.resolve('docs/dias/capturas_jutrip')
const partes = new Set(process.argv.slice(2))
const quiero = (p) => partes.size === 0 || partes.has(p)
const png = (n) => path.join(SALIDA, `${n}.jpg`)
const CANCUN = "window.__destinosCurados=[{clave:'roma',nombre:'Roma',pais:'Italia',iso:'it',lat:41.9028,lng:12.4964},{clave:'cancun',nombre:'Cancún',pais:'México',iso:'mx',lat:21.1619,lng:-86.8515}]"

async function esperarApp(app) {
  for (let i = 0; i < 120; i++) {
    // (En la primera pantalla, también la silueta de la tierra: es un trozo aparte y la primera vez tarda.)
    if (await app.evaluar("Boolean((document.querySelector('[data-primera-pantalla]') && document.querySelector('[data-mapa-primera] svg path')) || document.querySelector('[data-entrar]'))").catch(() => false)) return
    await app.esp(500)
  }
  throw new Error('La app no ha abierto')
}
const tocar = (app, selector) => app.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) return false; e.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true })()`)
/** Cierra los avisos que salen al abrir un viaje (temporada, fechas…). */
async function cerrarAvisos(app) {
  for (let i = 0; i < 4; i++) {
    const hecho = await app.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await app.esp(700)
  }
}
/** Escribe una ciudad en ORIGEN y elige el primer resultado del buscador. */
async function origen(app, texto) {
  await app.escribir('[data-campo-origen]', texto)
  for (let i = 0; i < 40; i++) {
    await app.esp(300)
    if (await app.evaluar("Boolean(document.querySelector('[data-origen-opcion]'))")) break
  }
  await app.evaluar("(() => { const e = document.querySelector('[data-origen-opcion]'); e.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); return true })()")
  await app.esp(1500)
}

if (quiero('primera')) {
  console.log('· primera pantalla A a F')
  let app = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&apertura=0' })
  await esperarApp(app)
  await app.esp(2500)
  await app.captura(png('primera_A_todos_los_pines'))
  await app.evaluar("document.querySelector('[data-campo-destino]').focus()")
  await app.esp(800)
  await app.captura(png('primera_B_tocando_destino'))
  await app.escribir('[data-campo-destino]', 'Tokio')
  await app.esp(800)
  await app.captura(png('primera_C_destino_que_no_tenemos'))
  await app.escribir('[data-campo-destino]', 'rom')
  await app.esp(400)
  await tocar(app, '[data-destino-card]')
  await app.esp(2500)
  await app.captura(png('primera_D_destino_elegido'))
  await origen(app, 'Madrid')
  await app.esp(2500)
  await app.captura(png('primera_E_madrid_roma'))
  app.cerrar()

  app = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&apertura=0' })
  await esperarApp(app)
  await app.esp(1500)
  await tocar(app, '[data-pin="Roma"]')
  await origen(app, 'Buenos Aires')
  await app.esp(2500)
  await app.captura(png('primera_F_buenosaires_roma'))
  app.cerrar()

  // G: con un destino curado «de mentira» (Cancún) también sale en el mapa.
  app = await abrirApp('http://localhost:5173', { antes: CANCUN })
  await esperarApp(app)
  await app.esp(1500)
  await tocar(app, '[data-pin="Cancún"]')
  await origen(app, 'Madrid')
  await app.esp(2500)
  await app.captura(png('primera_G_madrid_cancun'))
  app.cerrar()
}

/** Toca el primer botón o fila visible cuyo texto cumple la expresión. */
const clicTexto = (app, re) =>
  app.evaluar(`(() => { const r = ${re}; const visible = (e) => e.offsetParent !== null && e.getBoundingClientRect().width > 0; const buscar = (sel) => Array.from(document.querySelectorAll(sel)).filter((e) => r.test((e.innerText || '').trim()) && visible(e)); let c = buscar('button'); if (!c.length) c = buscar('[role=button],[role=radio],label,div,span').filter((e) => e.children.length < 4); const e = c[0]; if (!e) return false; e.click(); return (e.innerText || '').slice(0, 30) })()`)

if (quiero('formulario')) {
  console.log('· pasos del formulario')
  const app = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off' })
  await esperarApp(app)
  await app.esp(1500)
  await tocar(app, '[data-pin="Roma"]')
  await origen(app, 'Madrid')
  await tocar(app, '[data-trazar-ruta]')
  await app.esp(5000)
  await app.captura(png('form_2_transporte'))
  console.log(await clicTexto(app, '/^Avión/'))
  await app.esp(1200)
  await app.captura(png('form_2b_transporte_elegido'))
  console.log(await clicTexto(app, '/Continuar/'))
  await app.esp(2500)
  await app.captura(png('form_3_fechas'))
  // Dos días del calendario (del lunes 26 al jueves 29) y Continuar.
  console.log(await clicTexto(app, '/^26$/'))
  await app.esp(500)
  console.log(await clicTexto(app, '/^29$/'))
  await app.esp(800)
  await app.captura(png('form_3b_fechas_elegidas'))
  console.log(await clicTexto(app, '/^Continuar/'))
  await app.esp(2500)
  await app.captura(png('form_4_compania'))
  console.log(await clicTexto(app, '/^En pareja/'))
  await app.esp(800)
  await app.captura(png('form_4b_compania_elegida'))
  app.cerrar()
}

if (quiero('entrar')) {
  console.log('· pantalla de entrar')
  const app = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off' })
  await esperarApp(app)
  await app.evaluar("import('/src/dev/escaparate.ts').then(() => window.__escaparate.abrir('c3-A1'))")
  await app.esp(1500)
  await app.captura(png('entrar'))
  app.cerrar()
}

if (quiero('apertura')) {
  console.log('· apertura e icono')
  const app = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&apertura=1' })
  await app.esp(4000)
  await app.captura(png('apertura'))
  app.cerrar()
  const app2 = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off' })
  await esperarApp(app2)
  await app2.evaluar("import('/src/dev/escaparate.ts').then(() => window.__escaparate.abrir('c3-I1'))")
  await app2.esp(1500)
  await app2.captura(png('icono_en_la_pantalla_de_inicio'))
  app2.cerrar()
}
if (quiero('peliculas')) {
  console.log('· películas E12 y E13')
  for (const [id, nombre] of [['plaza_de_espana', 'E12_plaza_de_espana'], ['castillo_de_santangelo', 'E13_castillo_de_santangelo']]) {
    const app = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=on&logros=on&logrosDemo=1' })
    for (let i = 0; i < 120 && !(await app.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await app.esp(500)
    for (let i = 0; i < 60 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await app.esp(500)
    await app.evaluar('window.__rutaPrueba().then(() => true)')
    for (let i = 0; i < 60 && !(await app.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await app.esp(1000)
    await app.esp(6000)
    await cerrarAvisos(app)
    await app.evaluar(`window.__momentos.lanzar('emblema:${id}')`)
    await app.esp(2200)
    await app.captura(png(`${nombre}_1_principio`))
    await app.esp(4500)
    await app.captura(png(`${nombre}_2_mitad`))
    await app.esp(7500)
    await app.captura(png(`${nombre}_3_final`))
    app.cerrar()
  }
}

if (quiero('interior')) {
  for (const noche of [false]) {
    const sufijo = 'dia'
    console.log('· la app por dentro, de ' + sufijo)
    const app = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=on&logros=on&logrosDemo=1' })
    await esperarApp(app)
    for (let i = 0; i < 60 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await app.esp(500)
    await app.evaluar('window.__rutaPrueba().then(() => true)')
    for (let i = 0; i < 60 && !(await app.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await app.esp(1000)
    await app.esp(6000)
    await cerrarAvisos(app)
    const store = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState())"
    const modo = async (m) => {
      await app.evaluar(`${store}.then((s) => { s.setActiveDayId(null); s.setMode('${m}'); return true })`)
      await app.esp(2500)
      await cerrarAvisos(app)
    }
    await modo('today')
    await app.captura(png(`interior_HOY_${sufijo}`))
    await modo('route')
    await app.esp(2500)
    await app.captura(png(`interior_RUTA_${sufijo}`))
    await modo('days')
    await app.captura(png(`interior_DIAS_cerrado_${sufijo}`))
    await app.evaluar(`${store}.then((s) => { s.setActiveDayId(s.route.days[0].id); return true })`)
    await app.esp(4000)
    await app.captura(png(`interior_DIAS_dia_abierto_${sufijo}`))
    // La ficha de una parada: se toca el nombre de la primera parada del día abierto.
    await app.evaluar("(() => { const p = document.querySelector('[data-stop-id]'); if (!p) return false; (p.querySelector('button') || p).click(); return true })()")
    await app.esp(2500)
    await app.captura(png(`interior_DIAS_parada_abierta_${sufijo}`))
    await modo('explore')
    await app.esp(3000)
    await app.captura(png(`interior_EXPLORAR_${sufijo}`))
    await modo('bookings')
    await app.captura(png(`interior_RESERVAS_${sufijo}`))
    // Logros (la hoja de logros del viaje, con sus 14 secretos) y el Pase (Mis pases).
    await modo('today')
    for (const [id, nombre] of [['c3-L-P4', 'Pase_mis_pases'], ['T1', 'Logros_todos'], ['3a', 'Logros_la_hoja']]) {
      await app.evaluar(`import('/src/dev/escaparate.ts').then(() => window.__escaparate.abrir('${id}'))`)
      await app.esp(2500)
      await app.captura(png(`interior_${nombre}_${sufijo}`))
      await app.evaluar("try { window.__escaparate.limpiar() } catch (e) { /* nada abierto */ } true")
      await app.esp(500)
    }
    app.cerrar()
  }
}

if (quiero('hoy')) {
  // HOY de día y de noche (la tarjeta de la siguiente parada, los avisos de «cierra hoy» y «Cerca de ti»), con el HOY de ahora (v1) y el nuevo (v2).
  for (const v2 of [false, true]) {
    for (const noche of [false]) {
      const nombre = `hoy_${v2 ? 'v2' : 'v1'}_dia`
      console.log('· ' + nombre)
      const app = await abrirApp('http://localhost:5173', { ruta: `/?cuentas=on&logros=on&logrosDemo=1&hoy2=${v2 ? 'on' : 'off'}` })
      await esperarApp(app)
      for (let i = 0; i < 60 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await app.esp(500)
      await app.evaluar('window.__rutaPrueba().then(() => true)')
    for (let i = 0; i < 60 && !(await app.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await app.esp(1000)
      await app.esp(6000)
      await cerrarAvisos(app)
      const store = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState())"
      await app.evaluar(`${store}.then((s) => { s.setActiveDayId(null); s.setMode('today'); return true })`)
      await app.esp(3500)
      await cerrarAvisos(app)
      await app.captura(png(nombre))
      await app.evaluar("(() => { const e = document.querySelector('[data-hoy]'); if (e) e.scrollTop = 520; return true })()")
      await app.esp(800)
      await app.captura(png(nombre + '_abajo'))
      // Antes y después del viaje (la fecha de hoy fingida): las tarjetas de HOY que no son la de la siguiente parada.
      for (const [estado, dia] of [['antes', '2026-10-01'], ['despues', '2026-10-28']]) {
        await app.evaluar(`${store}.then(() => import('/src/store/useRouteStore.ts')).then((m) => { m.useRouteStore.setState({ dev_simulated_today_iso: '${dia}' }); return true })`)
        await app.esp(2500)
        await app.captura(png(`${nombre}_${estado}`))
      }
      app.cerrar()
    }
  }
}
if (quiero('tanda10b')) {
  // Tanda 10B: RUTA con avión, tren, autobús y coche (solo la ciudad y los puntos por donde se llega), DÍAS con el día de vuelta (con pase y sin él) y las pantallas con «Verme como viajero sin pase» encendido.
  const app = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=on&logros=on&logrosDemo=1' })
  for (let i = 0; i < 120 && !(await app.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await app.esp(500)
  for (let i = 0; i < 60 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await app.esp(500)
  await app.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 60 && !(await app.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await app.esp(1000)
  await app.esp(6000)
  await cerrarAvisos(app)
  const store = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState())"
  const poner = (codigo) => app.evaluar("import('/src/store/useRouteStore.ts').then((m) => { const set = m.useRouteStore.setState; const get = m.useRouteStore.getState; " + codigo + "; return true })")
  const medio = (id, punto) => poner("set({ route: { ...get().route, arrivalPointId: " + JSON.stringify(punto) + ", transportContext: { ...get().route.transportContext, transport_option: { ...get().route.transportContext.transport_option, id: '" + id + "' } } } })")
  for (const [id, punto, nombre] of [['flight', null, 'avion'], ['train', 'tiburtina', 'tren'], ['bus', null, 'autobus'], ['car', null, 'coche']]) {
    await medio(id, punto)
    await app.evaluar(`${store}.then((s) => { s.setActiveDayId(null); s.setMode('route'); return true })`)
    await app.esp(5000)
    await app.captura(png('ruta_mapa_' + nombre))
  }
  // El día de vuelta sin paradas y sin hora (en avión): con el pase y sin él.
  await medio('flight', null)
  await poner("const r = get().route; if (!r.days.some((d) => d.isReturnLeg)) set({ route: { ...r, days: [...r.days, { id: 'dret', dayNumber: r.days.length + 1, city: r.days[0].city, countryCode: r.days[0].countryCode, title: '', curatedTitle: '', stops: [], meals: [], excursions: [], isReturnLeg: true, colorIndex: 2 }] } })")
  await app.evaluar(`${store}.then((s) => { s.setMode('days'); s.setActiveDayId(null); return true })`)
  await app.esp(3500)
  await app.evaluar("(() => { const t = Array.from(document.querySelectorAll('h2,h3,span,p,div')).find((e) => e.children.length === 0 && (e.textContent || '').trim() === 'Hoy vuelves a casa'); const b = t && (t.closest('button') || t.closest('[role=button]') || t); if (b) b.click(); return Boolean(b) })()")
  await app.esp(4500)
  await app.evaluar("(() => { const t = document.querySelector('[data-tarjeta-ultimo-dia]'); if (t) t.scrollIntoView({ block: 'center' }); return true })()")
  await app.esp(1200)
  await app.captura(png('dias_vuelta_con_pase'))
  await app.evaluar("import('/src/store/useSinPasePrueba.ts').then((m) => { m.useSinPasePrueba.getState().poner(true); return true })")
  await app.esp(2500)
  await app.evaluar("(() => { const t = document.querySelector('[data-tarjeta-ultimo-dia]'); if (t) t.scrollIntoView({ block: 'center' }); return true })()")
  await app.esp(800)
  await app.captura(png('dias_vuelta_sin_pase_prueba'))
  await app.evaluar(`${store}.then((s) => { s.setActiveDayId(null); s.setMode('bookings'); return true })`)
  await app.esp(3000)
  await app.captura(png('reservas_sin_pase_prueba'))
  app.cerrar()
}
if (quiero('tanda10c')) {
  // Tanda 10C: la tarjeta de Roma con los tres iconos, el mapa de RUTA sin medio elegido y HOY y la barra con «Verme como viajero sin pase» encendido.
  const app = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=on&logros=on&logrosDemo=1' })
  for (let i = 0; i < 120 && !(await app.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await app.esp(500)
  for (let i = 0; i < 60 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await app.esp(500)
  await app.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 60 && !(await app.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await app.esp(1000)
  await app.esp(6000)
  await cerrarAvisos(app)
  const store = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState())"
  const poner = (codigo) => app.evaluar("import('/src/store/useRouteStore.ts').then((m) => { const set = m.useRouteStore.setState; const get = m.useRouteStore.getState; " + codigo + "; return true })")
  const ruta = () => app.evaluar(store + ".then((s) => { s.setActiveDayId(null); s.setMode('route'); return true })")
  // Sin medio elegido, desde Madrid: el medio que se deduce (avión, Fiumicino y Ciampino).
  await poner("const r = get().route; set({ route: { ...r, arrivalPointId: null, transportContext: { ...r.transportContext, transport_option: null }, answers: { ...r.answers, originPlace: { name: 'Madrid', fullName: 'Madrid, España', coordinates: { lat: 40.4168, lng: -3.7038 }, countryCode: 'es' } } } })")
  await ruta()
  await app.esp(5000)
  await app.captura(png('ruta_mapa_sin_medio_madrid'))
  await app.captura(png('ruta_tarjeta_tres_iconos'))
  // Sin medio y sin origen: Roma Termini, donde conecta todo.
  await poner("const r = get().route; set({ route: { ...r, answers: { ...r.answers, originPlace: undefined } } })")
  await ruta()
  await app.esp(5000)
  await app.captura(png('ruta_mapa_sin_medio_ni_origen'))
  // «Verme como viajero sin pase» encendido: HOY y la barra de abajo.
  await app.evaluar("import('/src/store/useSinPasePrueba.ts').then((m) => { m.useSinPasePrueba.getState().poner(true); return true })")
  await app.evaluar("import('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.setState({ dev_simulated_today_iso: '2026-10-01' }); return true })")
  await app.evaluar(store + ".then((s) => { s.setActiveDayId(null); s.setMode('today'); return true })")
  await app.esp(3500)
  await app.captura(png('hoy_sin_pase_antes_del_viaje'))
  await app.evaluar("(() => { const e = document.querySelector('[data-hoy]'); if (e) e.scrollTop = 600; return true })()")
  await app.esp(800)
  await app.captura(png('hoy_sin_pase_antes_del_viaje_abajo'))
  await app.evaluar("import('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.setState({ dev_simulated_today_iso: '2026-10-28' }); return true })")
  await app.esp(2500)
  await app.captura(png('hoy_sin_pase_despues_del_viaje'))
  app.cerrar()
}
console.log('listo')
