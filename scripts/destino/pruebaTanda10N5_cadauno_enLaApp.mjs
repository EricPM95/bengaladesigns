// Tanda 10N5 §6c · RESERVAS con el vuelo y el alojamiento de cada uno, en la app de verdad (Chrome sin ventana). No toca el motor de rutas.
//   APP_URL=http://localhost:5184 API_URL=http://localhost:8854 node scripts/destino/pruebaTanda10N5_cadauno_enLaApp.mjs
// Capturas de la app en docs/dias/capturas_jutrip/10n5_cadauno_*.jpg y, al lado, la pieza de Design (10n5_design_cadauno_0N.jpg). SIN_DESIGN=1 salta las de Design.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const sacarDesign = process.env.SIN_DESIGN !== '1'

const GENTE = [
  { id: 'p-eric', nombre: 'ERIC', foto: null, esAdmin: true, permiso: 'admin' },
  { id: 'p-ana', nombre: 'ana', foto: null, esAdmin: false, permiso: 'editar' },
  { id: 'p-laura', nombre: 'Laura', foto: null, esAdmin: false, permiso: 'recomendar' },
  { id: 'p-marcos', nombre: 'Marcos', foto: null, esAdmin: false, permiso: 'recomendar' },
]

const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
const ev = (js) => a.evaluar(js)
try {
  for (let i = 0; i < 360 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await ev('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 90 && !(await ev("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
  await ev("Promise.all([import('/src/store/useViajeCompartido.ts'), import('/src/store/useLoSuyo.ts')]).then(() => true)")
  await a.esp(2500)
  for (let i = 0; i < 6; i++) {
    const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  // El vuelo y el alojamiento del administrador (los pone el viaje).
  for (let i = 0; i < 40 && !(await ev("window.__ruta?.getState().route != null").catch(() => false)); i++) await a.esp(500)
  await ev(`(() => {
    const U = window.__ruta
    const dia = U.getState().route.days[0].id
    U.setState((s) => ({ route: { ...s.route, arrivalFlightTime: '11:15', departureFlightTime: '18:05', arrivalPointId: s.route.arrivalPointId ?? 'fiumicino', departurePointId: s.route.departurePointId ?? 'ciampino' }, accommodationSelections: { ...s.accommodationSelections, [dia]: { name: 'Hotel Prati', precio: null } } }))
    return true
  })()`)

  const ponerGente = (yo) =>
    ev(`(async () => {
      const yo = ${JSON.stringify(yo)}
      const g = ${JSON.stringify(GENTE)}.map((p) => ({ ...p, esYo: p.id === 'p-' + yo }))
      sessionStorage.removeItem('trazo:invitado'); sessionStorage.removeItem('trazo:permiso')
      if (yo && yo !== 'eric') { sessionStorage.setItem('trazo:invitado', '1'); sessionStorage.setItem('trazo:permiso', 'recomendar') }
      const urls = [...new Set(performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('store/useViajeCompartido.ts')))]
      const tiendas = [window.__viaje]
      for (const u of urls) tiendas.push((await import(/* @vite-ignore */ u)).useViajeCompartido)
      for (const st of new Set(tiendas)) { st.setState({ cargar: async () => {} }); st.getState().poner({ gente: yo ? g : [] }) }
      if (yo) window.__modoCuentas?.poner('cada_uno', 4) // (10N7) viaje «couple» con 4 personas saldría cuenta conjunta
      return true
    })()`)
  const loSuyo = async (js) => {
    return ev(`(async () => {
      const urls = [...new Set(performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('store/useLoSuyo.ts')))]
      const tiendas = [window.__loSuyo]
      for (const u of urls) tiendas.push((await import(/* @vite-ignore */ u)).useLoSuyo)
      for (const st of new Set(tiendas)) { st.setState({ cargar: async () => {} }); await (async (s) => { ${js} })(st) }
      return true
    })()`)
  }
  const irAReservas = async () => {
    await ev("window.__ruta.getState().setMode('bookings'); true")
    await a.esp(1800)
  }
  const texto = () => ev("(document.querySelector('[data-blk=\"llegada\"]')?.closest('div.grid, div.flex')?.parentElement?.innerText ?? document.body.innerText).replace(/\\s+/g, ' ')")
  const hoja = () => ev("document.querySelector('[role=\"dialog\"]')?.innerText.replace(/\\s+/g, ' ') ?? null")
  const clic = (sel) => ev(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)

  /* 01 · Ana (invitada): el vuelo y el alojamiento del administrador */
  await ponerGente('ana')
  await loSuyo('s.setState({ mio: { vuelo: null, alojamiento: null }, grupo: {}, entradas: [] })')
  await irAReservas()
  await a.esp(800)
  let t = await ev("document.body.innerText.replace(/\\s+/g, ' ')")
  debe(/Lo ha puesto Eric · para todos/.test(t), '6c-design-01', `Ana ve «Lo ha puesto Eric · para todos» (nombre guardado «ERIC»)`)
  debe(/Tengo otro vuelo/.test(t) && /Me alojo en otro sitio/.test(t) && /Pon el tuyo/.test(t), '6c-design-01', 'y las filas «Tengo otro vuelo» y «Me alojo en otro sitio» con «Pon el tuyo»')
  debe(!(await ev("Boolean(document.querySelector('[data-blk=\"llegada\"]'))")), '6c-1', 'el bloque gris del administrador ya no está (cada uno pone el suyo)')
  await a.captura(path.join(SALIDA, '10n5_cadauno_01_ana_vuelo_de_eric.jpg'))
  // 02 · el alojamiento
  await ev("document.querySelector('[data-lo-de-cada-uno]')?.scrollIntoView({block:'center'}); true")
  await a.captura(path.join(SALIDA, '10n5_cadauno_02_ana_alojamiento_de_eric.jpg'))

  // Ana pone SU vuelo
  await clic('[data-pon-el-tuyo="vuelo"]')
  await a.esp(900)
  const hojaVuelo = await hoja()
  debe(/Tu vuelo a/.test(hojaVuelo ?? '') && /Ida/.test(hojaVuelo ?? '') && /Vuelta/.test(hojaVuelo ?? ''), '6c-1', `la hoja de su vuelo (${(hojaVuelo ?? '').slice(0, 80)})`)
  await a.captura(path.join(SALIDA, '10n5_cadauno_03a_hoja_mi_vuelo.jpg'))
  await clic('[data-mi-vuelo-guardar]')
  await a.esp(900)
  t = await ev("document.body.innerText.replace(/\\s+/g, ' ')")
  debe(/Tuyo/.test(t) && /✈ Ida/.test(t) && /Cambiar/.test(t), '6c-3', 'tras guardar: «Tuyo», la línea de su vuelo y [Cambiar]')
  debe(await ev("Object.keys(localStorage).some((k) => k.startsWith('trazo:lo-suyo:v1:') && !k.includes('pendiente') && JSON.parse(localStorage.getItem(k)).vuelo)"), '6c-1', 'lo suyo se guarda en el propio móvil (y en la nube, con la 0049)')
  // Su alojamiento
  await clic('[data-pon-el-tuyo="alojamiento"]')
  await a.esp(900)
  await a.escribir('[role="dialog"] input[placeholder="Hotel Artemide"]', 'Trastevere')
  await a.esp(300)
  await ev("Array.from(document.querySelectorAll('[role=\"dialog\"] button')).find((b) => /^Guardar$/.test((b.textContent||'').trim()))?.click(); true")
  await a.esp(900)
  await ev("window.scrollTo(0,0); document.querySelector('[data-lo-de-cada-uno]')?.scrollIntoView({block:'start'}); true")
  t = await ev("document.body.innerText.replace(/\\s+/g, ' ')")
  debe(/Te alojas en Trastevere/.test(t), '6c-3', '«Te alojas en Trastevere» con «Tuyo»')
  await a.captura(path.join(SALIDA, '10n5_cadauno_03_ana_lo_suyo.jpg'))

  // Quien solo recomienda también puede (Laura)
  await ponerGente('laura')
  await loSuyo('s.setState({ mio: { vuelo: null, alojamiento: null } })')
  await a.esp(900)
  t = await ev("document.body.innerText.replace(/\\s+/g, ' ')")
  debe(/Tengo otro vuelo/.test(t), '6c-1', 'quien solo recomienda (Laura) también puede poner el suyo')

  /* 04 · Eric (administrador): a quién cubre y quién tiene otro */
  await ponerGente('eric')
  await loSuyo("s.setState({ mio: { vuelo: null, alojamiento: null }, grupo: { 'p-ana': { vuelo: true, alojamiento: false } } })")
  await a.esp(900)
  t = await ev("document.body.innerText.replace(/\\s+/g, ' ')")
  debe(/En este vuelo/.test(t) && /Tú, Laura y Marcos/.test(t), '6c-design-04', `Eric ve «En este vuelo · Tú, Laura y Marcos» (${(t.match(/En este vuelo[^A-Z]{0,40}[^.]{0,40}/) ?? [''])[0]})`)
  debe(/Otro vuelo/.test(t) && /Ana tiene su propio vuelo/.test(t), '6c-design-04', '«Otro vuelo · Ana tiene su propio vuelo» (nombre guardado «ana»)')
  await ev("document.querySelector('[data-lo-de-cada-uno=\"admin\"]')?.scrollIntoView({block:'center'}); true")
  await a.captura(path.join(SALIDA, '10n5_cadauno_04_eric_quien_va.jpg'))
  await clic('[data-en-este-lo-suyo="vuelo"]')
  await a.esp(800)
  const hojaPara = await hoja()
  debe(/¿Para quién (es|has comprado el vuelo)\?/i.test(hojaPara ?? '') && /1 de 4|4 de 4/.test(hojaPara ?? ''), '6c-design-04', `«En este vuelo» abre «¿Para quién es?» (${(hojaPara ?? '').slice(0, 90)})`)
  await a.captura(path.join(SALIDA, '10n5_cadauno_04b_para_quien.jpg'))
  // Marca solo a Ana además de Eric y guarda
  await ev("Array.from(document.querySelectorAll('[role=\"dialog\"] [data-elegir-pastilla]')).find((p) => /Laura/.test(p.textContent)).click(); true")
  await a.esp(200)
  await clic('[data-guardar-lo-suyo]')
  await a.esp(800)
  const entre = await ev("JSON.stringify(window.__ruta.getState().route.cuentasEntre ?? null)")
  debe(/llegada/.test(entre) && /vuelta/.test(entre), '6c-2', `el «¿Para quién es?» del vuelo se guarda con el viaje (${entre})`)
  await ev("(() => { window.__ruta.getState().setCuentasEntre('llegada', null); window.__ruta.getState().setCuentasEntre('vuelta', null); return true })()")

  /* 05 · los avisos */
  await ponerGente('ana')
  await ev(`(async () => {
    const { useFranjaStore } = await import('/src/store/useFranjaStore.ts').catch(() => ({}))
    return Boolean(useFranjaStore)
  })()`).catch(() => false)
  const franja = await ev(`(async () => {
    const t = await import('/shared/avisos/textos.js').catch(() => null)
    const m = await import('/src/store/useFranjaStore.ts').catch(() => null)
    if (!t || !m) return null
    const f = t.franjaDelAviso({ tipo: 'reserva_grupo', payload: { caso: 'vuelo_cambiado', quien: 'ERIC', para: 'todos', suyo_cambiado: true } })
    m.useFranjaStore.getState().mostrar([{ id: 'fr-1', clave: 'fr-1', titulo: f.titulo, detalle: f.detalle, icono: f.icono, quien: 'E' }])
    return f
  })()`)
  debe(franja && franja.titulo === 'Eric ha puesto el vuelo para todos.' && franja.detalle === 'Se ha cambiado el tuyo.', '6c-design-05', 'la franja de Ana: «Eric ha puesto el vuelo para todos.» / «Se ha cambiado el tuyo.»')
  await a.esp(900)
  await a.captura(path.join(SALIDA, '10n5_cadauno_05a_aviso_a_ana.jpg'))
  await ev("import('/src/store/useFranjaStore.ts').then((m) => { m.useFranjaStore.getState().cerrar(); return true })")
  await a.esp(1800)
  await ponerGente('eric')
  await ev(`(async () => {
    const t = await import('/shared/avisos/textos.js')
    const m = await import('/src/store/useFranjaStore.ts')
    const f = t.franjaDelAviso({ tipo: 'reserva_grupo', payload: { caso: 'vuelo_propio', quien: 'ana', detalle: 'Llegada a Roma · martes 10' } })
    m.useFranjaStore.getState().mostrar([{ id: 'fr-2', clave: 'fr-2', titulo: f.titulo, detalle: f.detalle, icono: f.icono, quien: 'A' }])
    return true
  })()`).catch(() => false)
  await a.esp(900)
  await a.captura(path.join(SALIDA, '10n5_cadauno_05_aviso_a_eric.jpg'))
  const franjaTxt = await ev("document.body.innerText.replace(/\\s+/g, ' ')")
  debe(/Ana ha puesto su propio vuelo\./.test(franjaTxt) && /Llegada a Roma · martes 10/.test(franjaTxt), '6c-design-05', 'la franja de Eric: «Ana ha puesto su propio vuelo.» / «Llegada a Roma · martes 10»')

  /* Sin compartir: nada cambia */
  await ponerGente('')
  await a.esp(900)
  const sinCompartir = await ev("Boolean(document.querySelector('[data-lo-de-cada-uno]')) || /Tengo otro vuelo/.test(document.body.innerText)")
  debe(!sinCompartir, '6c-0', 'un viaje que no se comparte no cambia: ni filas ni «Tengo otro vuelo»')
  await a.captura(path.join(SALIDA, '10n5_cadauno_00_sin_compartir.jpg'))
} finally {
  a.cerrar()
}

if (sacarDesign) {
  const pieza = 'Piezas/Reservas Cada Uno.dc.html'
  for (const [n, etiqueta] of [['01', '01 ·'], ['02', '02 ·'], ['03', '03 ·'], ['04', '04 ·'], ['05', '05 ·']]) {
    await capturarDesign(pieza, path.join(SALIDA, `10n5_design_cadauno_${n}.jpg`), { despues: `(() => { const e = Array.from(document.querySelectorAll('span')).find((s) => (s.textContent || '').startsWith(${JSON.stringify(etiqueta)})); e?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -12); return true })()` }).catch((e) => console.log('  (sin captura de Design)', n, e.message))
  }
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log('  ✗', f.regla, '·', f.texto)
process.exit(fallos.length ? 1 : 0)
