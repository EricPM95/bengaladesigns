// La prueba de la parte de la PROPUESTA de la Tanda 10N (apartados 6, 6a y 6b): el invitado «Solo recomienda» cambia la ruta directamente y todo va a su propuesta.
// Hace falta el servidor y Vite (los de la batería los arrancan solos; a mano: `npm run server` y `npm run dev`). Abre un Chrome sin ventana (scripts/destino/_enLaApp.mjs).
//   node scripts/destino/pruebaTanda10N_propuesta.mjs
// Capturas a tamaño de móvil en docs/dias/capturas_jutrip/10n_propuesta_*.jpg
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) {
    fallos.push({ regla, texto })
    console.log(`  ✗ [${regla}] ${texto}`)
  }
}
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const jpg = (n) => path.join(SALIDA, `10n_propuesta_${n}.jpg`)
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const RUTA = '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0'

/** Abre la app con el viaje de pruebas, como invitado que solo recomienda (o como administrador), antes de que empiece el viaje. */
async function abrir({ invitado, permiso = 'recomendar', simulada = '2026-10-10' }) {
  const antes = invitado ? `sessionStorage.setItem('trazo:invitado','1');sessionStorage.setItem('trazo:permiso','${permiso}')` : undefined
  const app = await abrirApp(APP, { ruta: RUTA, antes })
  for (let i = 0; i < 300 && !(await app.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await app.esp(500)
  for (let i = 0; i < 240 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await app.esp(500)
  for (let intento = 0; intento < 8; intento++) {
    const ok = await app.evaluar('window.__rutaPrueba().then(() => true, (e) => String(e && e.message))').catch((e) => String(e))
    if (ok === true) break
    await app.esp(1500)
  }
  for (let i = 0; i < 90 && !(await app.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await app.esp(1000)
  await app.esp(2500)
  for (let i = 0; i < 6; i++) {
    const h = await app.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await app.esp(600)
  }
  await app.evaluar(`(async () => {
    const R = await import('/src/store/useRouteStore.ts'); const S = await import('/src/store/useSyncStore.ts'); const V = await import('/src/store/useViajeCompartido.ts')
    R.useRouteStore.getState().setDevSimulatedTodayIso(${JSON.stringify(simulada)})
    S.useSyncStore.setState({ activeTripId: 'demo-viaje' })
    V.useViajeCompartido.getState().poner({ tripId: 'demo-viaje', gente: [{ id: 'eric', nombre: 'Eric', foto: null, esAdmin: true, permiso: 'admin' }, { id: 'ana', nombre: 'Ana', foto: null, esAdmin: false, permiso: ${JSON.stringify(permiso)}, esYo: ${invitado ? 'true' : 'false'} }], recomendaciones: [] })
    R.useRouteStore.getState().setMode('days')
    return true })()`)
  await app.esp(1500)
  const ev = (js) => app.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const P = await import('/src/store/usePropuestaStore.ts'); const L = await import('/src/lib/propuesta.ts'); const Z = await import('/src/lib/propuestaDueno.ts'); const V = await import('/src/store/useViajeCompartido.ts'); const C = await import('/src/lib/cambiarParada.ts'); const A = await import('/src/store/useAddFlowStore.ts'); const route = () => R.useRouteStore.getState().route; const st = () => R.useRouteStore.getState(); const base = () => P.usePropuestaStore.getState().base; ${js} })()`)
  return { app, ev }
}
const cierra = (a) => a.app.cerrar()

/* ───────────── 1. El invitado cambia directamente y todo va a su propuesta ───────────── */
console.log('1. El invitado «Solo recomienda»: cambios directos, una línea por idea')
const inv = await abrir({ invitado: true })
{
  const { app, ev } = inv
  const activa = await ev('return P.usePropuestaStore.getState().activa')
  debe(activa === true, '6', 'quien solo recomienda y aún no está de viaje tiene la propuesta encendida (su ruta es su propuesta)')
  debe((await ev('return document.querySelector("[data-boton-propuesta]") === null')) === true, '6', 'sin ningún cambio el lápiz no sale (nunca «Aún sin cambios»)')
  debe((await ev('return document.querySelector("[data-recomendar-ruta]") === null && !document.body.textContent.includes("Recomendar otra ruta")')) === true, '6', 'no hay botón [Recomendar otra ruta]')
  const antesDelDueno = await ev('return JSON.stringify(base())')

  // a) cambiar el orden en el mismo día (paradas seguidas): Arco de Constantino delante del Coliseo.
  await ev(`const d = route().days.find((x) => x.id === 'day-3'); const ids = d.stops.map((s) => s.id); const a = ids.indexOf('stop-3-arco-de-constantino'); ids.splice(a, 1); ids.splice(0, 0, 'stop-3-arco-de-constantino'); st().reorderStops('day-3', ids); return 1`)
  await app.esp(400)
  let cs = JSON.parse(await ev('return JSON.stringify(L.cambiosDeLaPropuesta(base(), route()))'))
  debe(cs.length === 1 && cs[0].tipo === 'mover' && /^Primero el Arco de Constantino y después el Coliseo$/.test(cs[0].texto) && cs[0].sub === 'Antes: Coliseo → Arco de Constantino', 'texto', `cambiar el orden: «${cs[0]?.texto}» + «${cs[0]?.sub}»`)
  debe(/^Día 3 · Lun 19$/.test(cs[0]?.etiqueta ?? ''), 'texto', `la etiqueta del día: «${cs[0]?.etiqueta}»`)
  // mover otra vez la misma parada: sigue siendo UNA línea.
  await ev(`const d = route().days.find((x) => x.id === 'day-3'); const ids = d.stops.map((s) => s.id).filter((x) => x !== 'stop-3-arco-de-constantino'); ids.splice(2, 0, 'stop-3-arco-de-constantino'); st().reorderStops('day-3', ids); return 1`)
  cs = JSON.parse(await ev('return JSON.stringify(L.cambiosDeLaPropuesta(base(), route()))'))
  debe(cs.length === 1 && cs[0].tipo === 'mover' && !/después del Coliseo/.test(cs[0].texto), 'tiempo real', `mover dos veces actualiza la MISMA línea (${cs.length} línea): «${cs[0]?.texto}»`)
  // devolverla a donde estaba: la línea desaparece.
  await ev(`const d = route().days.find((x) => x.id === 'day-3'); const ids = d.stops.map((s) => s.id).filter((x) => x !== 'stop-3-arco-de-constantino'); ids.splice(1, 0, 'stop-3-arco-de-constantino'); st().reorderStops('day-3', ids); return 1`)
  cs = JSON.parse(await ev('return JSON.stringify(L.cambiosDeLaPropuesta(base(), route()))'))
  debe(cs.length === 0, 'tiempo real', 'devolverla a donde estaba quita la línea')
  // otra vez el cambio de orden, que se queda.
  await ev(`const d = route().days.find((x) => x.id === 'day-3'); const ids = d.stops.map((s) => s.id).filter((x) => x !== 'stop-3-arco-de-constantino'); ids.splice(0, 0, 'stop-3-arco-de-constantino'); st().reorderStops('day-3', ids); return 1`)

  // b) cambiar el orden con paradas NO seguidas: Altar de la Patria delante del Coliseo.
  await ev(`const d = route().days.find((x) => x.id === 'day-3'); const ids = d.stops.map((s) => s.id).filter((x) => x !== 'stop-3-altar-de-la-patria'); ids.splice(0, 0, 'stop-3-altar-de-la-patria'); st().reorderStops('day-3', ids); return 1`)
  // c) mover a otro día con «Mover a»: Barrio Judío del lunes 19 al domingo 18.
  const hueco = JSON.parse(await ev(`const d2 = route().days.find((x) => x.id === 'day-2'); const s = route().days.find((x) => x.id === 'day-3').stops.find((x) => x.id === 'stop-3-barrio-judio'); const esperado = L.indiceDeDestino(d2, s, undefined, '2026-10-18'); C.moverParadaAOtroDia('stop-3-barrio-judio', 'day-3', 'day-2'); const ahora = route().days.find((x) => x.id === 'day-2').stops.map((x) => x.id); return JSON.stringify({ esperado, donde: ahora.indexOf('stop-3-barrio-judio'), total: ahora.length })`))
  debe(hueco.donde === hueco.esperado && hueco.donde < hueco.total - 1, 'mover a', `«Mover a» lo pone donde menos hay que andar de más (posición ${hueco.donde} de ${hueco.total}, la que da mejorHueco: ${hueco.esperado}), no al final de la tarde`)
  // d) quitar
  await ev(`st().removeStop('day-3', 'stop-3-iglesia-del-gesu'); return 1`)
  // e) añadir (desde «+ Añadir parada»: addFlow → insertStopAt)
  await ev(`const tem = route().days.find((x) => x.id === 'day-1').stops.find((x) => x.id === 'stop-1-trastevere'); const n = { ...tem, id: 'nueva-fontana', name: 'Fontana di Trevi', fullName: 'Fontana di Trevi' }; A.withUndo('Añadido el domingo 18', () => st().insertStopAt('day-2', 1, n)); return 1`)
  await app.esp(500)
  cs = JSON.parse(await ev('return JSON.stringify(L.cambiosDeLaPropuesta(base(), route()))'))
  const por = (t) => cs.filter((c) => c.tipo === t)
  debe(cs.length === 5, 'lista', `cinco cambios, cada uno una línea (hay ${cs.length}: ${cs.map((c) => c.tipo).join(', ')})`)
  debe(por('mover').length === 2 && por('mover_dia').length === 1 && por('quitar').length === 1 && por('anadir').length === 1, 'lista', 'tipos: 2 de orden, 1 de mover a otro día, 1 quitar, 1 añadir (nada de quitar+añadir sueltos)')
  const md = por('mover_dia')[0]
  debe(/^Barrio Judío: del lunes 19 al domingo 18, después /.test(md?.texto ?? '') && /→/.test(md?.etiqueta ?? ''), 'texto', `mover a otro día en UNA línea: «${md?.texto}» (${md?.etiqueta})`)
  debe(/^Quitar la Iglesia del Gesù$/.test(por('quitar')[0]?.texto ?? ''), 'texto', `quitar: «${por('quitar')[0]?.texto}»`)
  debe(/^Añadir Fontana di Trevi, después (de|del|de la) /.test(por('anadir')[0]?.texto ?? ''), 'texto', `añadir: «${por('anadir')[0]?.texto}»`)
  debe(por('mover').some((c) => /pasa delante del Coliseo|pasa delante/.test(c.texto)), 'texto', 'orden con paradas no seguidas: «… pasa delante …»')
  // el aviso de abajo dice la verdad
  const aviso = await app.evaluar("document.querySelector('[data-aviso-propuesta]')?.textContent ?? null")
  debe(/^Añadido a tu propuesta · domingo 18/.test(aviso ?? ''), 'aviso', `el aviso dice «${aviso}» (no «Añadido el domingo 18» como si fuera su ruta)`)
  // el lápiz, con el número
  const lapiz = await app.evaluar("(() => { const b = document.querySelector('[data-boton-propuesta]'); return b ? { n: b.getAttribute('data-propuesta-n'), tipo: b.getAttribute('data-boton-propuesta') } : null })()")
  debe(lapiz?.n === '5' && lapiz?.tipo === 'sin-enviar', 'lápiz', `el lápiz cuenta ${lapiz?.n} y sale tras el primer cambio`)
  // deshacer del aviso: quita lo añadido de la propuesta
  await app.evaluar("(() => { const u = Array.from(document.querySelectorAll('button')).find((b) => /^Deshacer$/.test(b.textContent.trim()) && b.closest('[role=status]')); u?.click(); return !!u })()")
  await app.esp(500)
  cs = JSON.parse(await ev('return JSON.stringify(L.cambiosDeLaPropuesta(base(), route()))'))
  debe(cs.length === 4 && !cs.some((c) => c.tipo === 'anadir'), 'aviso', '[Deshacer] del aviso quita lo añadido de la propuesta y el lápiz baja a 4')
  await ev(`const tem = route().days.find((x) => x.id === 'day-1').stops.find((x) => x.id === 'stop-1-trastevere'); const n = { ...tem, id: 'nueva-fontana', name: 'Fontana di Trevi', fullName: 'Fontana di Trevi' }; st().insertStopAt('day-2', 1, n); return 1`)
  await app.esp(500)
  debe(JSON.stringify(JSON.parse(antesDelDueno)) === (await ev('return JSON.stringify(base())')), '6', 'el viaje del administrador (la base) no ha cambiado con nada de esto')

  // marcas en la ruta del invitado
  await ev(`R.useRouteStore.getState().setActiveDayId('day-2'); return 1`)
  await app.esp(1500)
  const marcas = await app.evaluar("Array.from(document.querySelectorAll('[data-propuesta]')).map((e) => e.getAttribute('data-propuesta'))")
  debe(marcas.includes('anadida'), 'marca', `lo añadido sale marcado como propuesta (borde de puntos y «Propuesta»): ${marcas.join()}`)
  await app.captura(jpg('dias_con_lapiz'))
  await ev(`R.useRouteStore.getState().setActiveDayId(null); return 1`)
  await app.esp(1200)
  const sinPuntitos = await app.evaluar("document.querySelectorAll('[data-day-id] [data-menu-hoja]').length === 0 && document.querySelector('[aria-label=\"Mover este día\"]') === null")
  debe(sinPuntitos === true, '6b', 'quien solo recomienda no tiene los tres puntitos del día ni las rayitas ≡ de los días')

  await ev(`R.useRouteStore.getState().setActiveDayId('day-2'); return 1`)
  await app.esp(800)
  // La hoja
  await app.evaluar("document.querySelector('[data-boton-propuesta]').click()")
  await app.esp(900)
  const hoja = await app.evaluar(`(() => { const f = (s) => document.querySelector(s)?.textContent ?? null; return { titulo: f('[data-propuesta-titulo]'), quien: f('[data-propuesta-quien]'), filas: Array.from(document.querySelectorAll('[data-cambio-propuesto]')).map((e) => ({ tipo: e.getAttribute('data-cambio-propuesto'), texto: e.querySelector('[data-cambio-texto]')?.textContent, undo: !!e.querySelector('[data-deshacer-cambio]') })), enviar: document.querySelector('[data-boton-hoja=enviar-propuesta]')?.textContent ?? null } })()`)
  debe(/^Tu propuesta · 5 cambios$/.test(hoja.titulo ?? '') && /^Para Eric · viaje a Roma$/.test(hoja.quien ?? ''), 'hoja', `la hoja: «${hoja.titulo}» / «${hoja.quien}»`)
  debe(hoja.filas.length === 5 && hoja.filas.every((f) => f.undo), 'hoja', 'cinco filas, cada una con su [Deshacer]')
  debe(hoja.enviar === 'Enviar a Eric', 'hoja', `[Enviar a Eric] siempre a mano abajo («${hoja.enviar}»)`)
  await app.captura(jpg('hoja_ana'))
  // detalle de «mover a otro día»
  await app.evaluar("document.querySelector('[data-cambio-propuesto=mover_dia]').click()")
  await app.esp(700)
  const det = await app.evaluar(`(() => ({ texto: document.querySelector('[data-detalle-texto]')?.textContent, km: document.querySelector('[data-mini-mapa-km]')?.textContent, dias: document.querySelectorAll('[data-detalle-dia]').length, marcas: Array.from(document.querySelectorAll('[data-detalle-marca]')).map((e) => e.textContent), deshacer: !!document.querySelector('[data-deshacer-este-cambio]') }))()`)
  debe(det.dias === 2 && det.deshacer && /\d,\d km/.test(det.km ?? '') && /Barrio Judío/.test(det.texto ?? ''), 'detalle', `el detalle de mover de día: dos días, mapa con kilómetros (${det.km}), [Deshacer este cambio]`)
  await app.captura(jpg('detalle_mover_dia'))
  await app.evaluar("document.querySelector('[data-detalle-pestana=antes]').click()")
  await app.esp(300)
  await app.evaluar("document.querySelector('[data-detalle-pestana=ahora]').click()")
  await app.evaluar("document.querySelector('[data-detalle-dia=\"1\"]').click()")
  await app.esp(300)
  const m2 = await app.evaluar("Array.from(document.querySelectorAll('[data-detalle-marca]')).map((e) => e.textContent)")
  debe(m2.includes('Entra'), 'detalle', `en el día de destino, la parada sale como «Entra» (${m2.join()})`)
  await app.evaluar("document.querySelector('[data-detalle-volver]').click()")
  await app.esp(300)

  // Enviar: manda UNA recomendación con todos los cambios (sin red: un puente de mentira)
  await app.evaluar("window.__enviado = null; window.__puente.recomendar = async (trip, tipo, payload) => { window.__enviado = { trip, tipo, payload }; return null }; true")
  await app.evaluar("document.querySelector('[data-boton-hoja=enviar-propuesta]').click()")
  await app.esp(1500)
  const env = JSON.parse(await app.evaluar('JSON.stringify(window.__enviado)'))
  debe(env && env.payload.version === 2 && env.payload.cambios.length === 5 && Array.isArray(env.payload.days), 'enviar', 'se manda UNA propuesta con los 5 cambios (y la ruta entera por si la otra app es antigua)')
  debe((await app.evaluar("Boolean(document.querySelector('[data-propuesta-enviada]'))")) === true, 'enviar', 'sale «Se lo hemos mandado a Eric»')
  fs.writeFileSync(path.resolve('docs/dias/_10n_propuesta_enviada.tmp.json'), JSON.stringify(env))
  await app.evaluar("document.querySelector('[data-propuesta-enviada] button').click()")

  // la propuesta enviada queda fija: cambiar algo después empieza otra
  await ev(`st().removeStop('day-1', 'stop-1-trastevere-de-noche'); return 1`)
  await app.esp(500)
  const tras = await app.evaluar("document.querySelector('[data-boton-propuesta]')?.getAttribute('data-propuesta-n')")
  // (en la prueba no hay base de datos: la propuesta enviada no vuelve en la lista; el lápiz cuenta todo lo que no se ha enviado)
  debe(tras !== null, 'enviar', 'lo que cambie después sigue contando en el lápiz')
  cierra(inv)
}

/* ───────────── 2. El administrador acepta uno, rechaza otro y [Aceptar todos] ───────────── */
console.log('2. El administrador decide cambio a cambio')
{
  const env = JSON.parse(fs.readFileSync(path.resolve('docs/dias/_10n_propuesta_enviada.tmp.json'), 'utf8'))
  fs.rmSync(path.resolve('docs/dias/_10n_propuesta_enviada.tmp.json'))
  const dueno = await abrir({ invitado: false })
  const { app, ev } = dueno
  const rec = { id: 'rec-1', tripId: 'demo-viaje', authorId: 'ana', tipo: env.tipo, payload: env.payload, estado: 'pendiente', creadaEn: '2026-10-10T10:00:00Z', decisiones: {} }
  await app.evaluar(`window.__guardado = {}; window.__puente.leerDecisiones = async () => ({ ...window.__guardado }); window.__puente.guardarDecisiones = async (id, d, e) => { window.__guardado = { ...d }; window.__estado = e; return null }; true`)
  const antes = JSON.parse(await ev('return JSON.stringify(route().days.map((d) => d.stops.map((s) => s.id)))'))
  await ev(`V.useViajeCompartido.getState().poner({ recomendaciones: [${JSON.stringify(rec)}] }); const R2 = await import('/src/store/useR2Store.ts'); R2.useR2Store.getState().abrir(${JSON.stringify(rec)}); return 1`)
  await app.esp(1500)
  const h = await app.evaluar(`(() => ({ titulo: document.querySelector('[data-propuesta-titulo]')?.textContent, todos: !!document.querySelector('[data-aceptar-todos]'), filas: document.querySelectorAll('[data-cambio-propuesto]').length, aceptar: document.querySelectorAll('[data-aceptar-cambio]').length, rechazar: document.querySelectorAll('[data-rechazar-cambio]').length }))()`)
  debe(/^Ana te propone 5 cambios en tu viaje a Roma$/.test(h.titulo ?? ''), 'dueño', `la hoja del dueño: «${h.titulo}»`)
  debe(h.todos && h.filas === 5 && h.aceptar === 5 && h.rechazar === 5, 'dueño', '[Aceptar todos] arriba y [Aceptar] [Rechazar] en cada cambio')
  await app.captura(jpg('dueno_ana_propone'))
  // detalle del dueño
  await app.evaluar("document.querySelector('[data-cambio-propuesto=mover_dia]').click()")
  await app.esp(600)
  debe((await app.evaluar("Boolean(document.querySelector('[data-detalle-aceptar]') && document.querySelector('[data-detalle-rechazar]'))")) === true, 'dueño', 'el detalle del dueño lleva [Rechazar] [Aceptar]')
  await app.captura(jpg('dueno_detalle'))
  await app.evaluar("document.querySelector('[data-detalle-volver]').click()")
  await app.esp(300)
  // aceptar el de mover de día
  await app.evaluar("document.querySelector('[data-cambio-propuesto=mover_dia] [data-aceptar-cambio]').click()")
  await app.esp(900)
  let ahora = JSON.parse(await ev('return JSON.stringify(route().days.map((d) => d.stops.map((s) => s.id)))'))
  const enDia2 = ahora[1].indexOf('stop-3-barrio-judio')
  debe(enDia2 >= 0 && !ahora[2].includes('stop-3-barrio-judio'), 'aceptar', 'aceptar «mover a otro día» pone la parada en el día 2 y la saca del 3')
  const donde = JSON.parse(await ev(`const rec = ${JSON.stringify(rec)}; const c = rec.payload.cambios.find((x) => x.tipo === 'mover_dia'); return JSON.stringify({ previa: c.despuesDeId, ahora: route().days[1].stops.map((s) => s.id) })`))
  debe(donde.previa === null || donde.ahora[donde.ahora.indexOf('stop-3-barrio-judio') - 1] === donde.previa, 'aceptar', 'se coloca justo donde decía (detrás de la misma parada)')
  // rechazar el de quitar
  await app.evaluar("document.querySelector('[data-cambio-propuesto=quitar] [data-rechazar-cambio]').click()")
  await app.esp(700)
  ahora = JSON.parse(await ev('return JSON.stringify(route().days.map((d) => d.stops.map((s) => s.id)))'))
  debe(ahora[2].includes('stop-3-iglesia-del-gesu'), 'rechazar', 'rechazar «quitar» deja la parada en la ruta')
  const dec1 = await app.evaluar('JSON.stringify(window.__guardado)')
  debe(Object.values(JSON.parse(dec1)).sort().join() === 'aceptado,rechazado', 'decisiones', 'se guarda qué se decidió de cada cambio')
  // aceptar todos
  await app.evaluar("document.querySelector('[data-aceptar-todos]')?.click()")
  await app.esp(1500)
  const fin = JSON.parse(await ev(`return JSON.stringify({ dias: route().days.map((d) => d.stops.map((s) => s.name)), dec: window.__guardado })`))
  const dec = Object.values(fin.dec)
  debe(dec.length === 5 && dec.filter((x) => x === 'aceptado').length === 4 && dec.filter((x) => x === 'rechazado').length === 1, 'aceptar todos', `[Aceptar todos] acepta los que faltan (${dec.filter((x) => x === 'aceptado').length} aceptados · ${dec.filter((x) => x === 'rechazado').length} rechazado)`)
  debe(fin.dias[1].includes('Fontana di Trevi') && fin.dias[2].indexOf('Arco de Constantino') < fin.dias[2].indexOf('Coliseo'), 'aceptar todos', 'lo aceptado sale en la ruta del dueño (la Fontana añadida y el Arco antes del Coliseo)')
  debe((await app.evaluar("document.querySelector('[data-propuesta-quien]')?.textContent")) === '4 aceptados · 1 rechazado', 'dueño', 'después, «4 aceptados · 1 rechazado»')
  debe((await app.evaluar("window.__estado")) === 'aceptada', 'dueño', 'ya decidido todo, la propuesta queda aceptada')
  await app.captura(jpg('dueno_decidida'))
  // otro a la vez: lo ya decidido no se vuelve a decidir
  const r2 = await ev(`const rec = ${JSON.stringify(rec)}; const c = rec.payload.cambios[0]; const r = await Z.decidirCambio({ ...rec, decisiones: {} }, c, 'rechazado'); return r.estado`)
  debe(r2 === 'ya_decidido', 'a la vez', 'si dos deciden a la vez, vale lo del primero: el segundo lo ve ya decidido')
  // lo que le llega al invitado
  const T = await ev(`const t = await import('/shared/avisos/textos.js'); return JSON.stringify([t.textoDelAviso({ tipo: 'recomendacion', payload: { autor: 'Ana', n_cambios: 5, destino: 'Roma' } }), t.textoDelAviso({ tipo: 'aceptada', payload: { admin: 'Eric', n_total: 5, n_aceptados: 3 } }), t.textoDelAviso({ tipo: 'sin_enviar', payload: { n: 2, admin: 'Eric' } })])`)
  const [t1, t2, t3] = JSON.parse(T)
  // Tanda 10N4 (§4b2): lo que ha decidido la persona, en una frase: «Ana te ha mandado una propuesta de 5 cambios para el viaje a Roma».
  debe(t1 === 'Ana te ha mandado una propuesta de 5 cambios para el viaje a Roma', 'campana', `campana del dueño: «${t1}»`)
  debe(t2 === 'Eric ha aceptado 3 de tus 5 cambios', 'campana', `lo que le llega al invitado: «${t2}»`)
  debe(t3 === 'Tienes 2 cambios sin enviar a Eric. Envíalos hoy, que mañana empieza el viaje.', 'campana', `el aviso del día antes: «${t3}»`)
  cierra(dueno)
}

/* ───────────── 3. Lo que le llega al invitado, el viaje que cambia y la propuesta a medias ───────────── */
console.log('3. La propuesta a medias cuando el dueño cambia el viaje')
{
  const inv2 = await abrir({ invitado: true })
  const { app, ev } = inv2
  await ev(`st().removeStop('day-3', 'stop-3-panteon'); const d = route().days.find((x) => x.id === 'day-3').stops.map((s) => s.id).filter((x) => x !== 'stop-3-plaza-venecia'); st().reorderStops('day-3', ['stop-3-plaza-venecia', ...d]); return 1`)
  await app.esp(500)
  // el dueño quita el Panteón y la Plaza Venecia
  const antes = JSON.parse(await ev('return JSON.stringify(L.cambiosDeLaPropuesta(base(), route()).map((c) => c.tipo))'))
  debe(antes.length === 2, 'a medias', `dos cambios antes de que el dueño cambie nada (${antes.join()})`)
  await ev(`const b = JSON.parse(JSON.stringify(base())); b.days = b.days.map((d) => d.id === 'day-3' ? { ...d, stops: d.stops.filter((s) => s.id !== 'stop-3-panteon') } : d); st().hydrateTrip({ route: b, bookings: { accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {} }, wishlist: [], uiState: { mode: 'days', activeDayId: null }, generationState: null }); return 1`)
  await app.esp(1500)
  const r = JSON.parse(await ev(`return JSON.stringify({ sin: P.usePropuestaStore.getState().sinSentido.map((c) => ({ t: c.tipo, m: c.sinSentido, texto: c.texto })), vivos: L.cambiosDeLaPropuesta(base(), route()).map((c) => c.tipo), enRuta: route().days[2].stops.some((s) => s.id === 'stop-3-panteon') })`))
  debe(r.sin.length === 1 && r.sin[0].t === 'quitar' && /ya no está/.test(r.sin[0].m) && !r.enRuta, 'a medias', `quitar el Panteón (que el dueño ya quitó) sale marcado: «${r.sin[0]?.m}»`)
  debe(r.vivos.length === 1 && r.vivos[0] === 'mover', 'a medias', 'el otro cambio se mantiene sobre la ruta nueva')
  await app.evaluar("document.querySelector('[data-boton-propuesta]').click()")
  await app.esp(800)
  const marcado = await app.evaluar("(() => { const e = document.querySelector('[data-sin-sentido]'); return e ? { texto: e.textContent, quitar: !!e.querySelector('[data-quitar-sin-sentido]') } : null })()")
  debe(marcado && /Ya no tiene sentido/.test(marcado.texto) && marcado.quitar, 'a medias', 'en la hoja sale marcado como «Ya no tiene sentido» y con [Quitar]')
  await app.captura(jpg('a_medias'))
  await app.evaluar("document.querySelector('[data-quitar-sin-sentido]').click()")
  await app.esp(400)
  debe((await ev('return P.usePropuestaStore.getState().sinSentido.length')) === 0, 'a medias', 'se puede quitar')
  // función pura
  const pura = JSON.parse(await ev(`const rb = JSON.parse(JSON.stringify(base())); const c = L.cambiosDeLaPropuesta(rb, (() => { const x = JSON.parse(JSON.stringify(rb)); x.days[2].stops.splice(2, 1); return x })()); const nueva = JSON.parse(JSON.stringify(rb)); nueva.days[2].stops.splice(2, 1); const r = L.ajustarPropuestaAlViaje({ cambios: c }, nueva); return JSON.stringify({ sin: r.sinSentido.length, cambios: r.cambios.length })`))
  debe(pura.sin === 1 && pura.cambios === 0, 'a medias', 'ajustarPropuestaAlViaje(propuesta, ruta) es una función pura y marca lo que ya no tiene sentido')
  // ida y vuelta: aplicar los cambios a la base da la ruta de quien propone
  const redonda = await ev(`const b = base(); const x = JSON.parse(JSON.stringify(b)); x.days[0].stops.reverse(); x.days[1].stops.splice(3, 2); const moved = x.days[2].stops.splice(1, 1)[0]; x.days[0].stops.splice(2, 0, moved); const cs = L.cambiosDeLaPropuesta(b, x); const r = L.ajustarPropuestaAlViaje({ cambios: cs }, b); return JSON.stringify(r.ruta.days.map((d) => d.stops.map((s) => s.id))) === JSON.stringify(x.days.map((d) => d.stops.map((s) => s.id))) && r.sinSentido.length === 0`)
  debe(redonda === true, 'a medias', 'poner los cambios sobre la ruta del dueño da otra vez la ruta de quien propone (ida y vuelta exacta)')
  cierra(inv2)
}

/* ───────────── 4. Durante el viaje no propone; el Free Tour; los permisos ───────────── */
console.log('4. Durante el viaje, Free Tour y permisos')
{
  const viaje = await abrir({ invitado: true, simulada: '2026-10-17' })
  const { app, ev } = viaje
  await app.esp(1500)
  const e = await app.evaluar(`(() => ({ solo: document.documentElement.hasAttribute('data-solo-ver'), lapiz: !!document.querySelector('[data-boton-propuesta]') }))()`)
  const activa = await ev('return P.usePropuestaStore.getState().activa')
  debe(activa === false && e.lapiz === false && e.solo === true, 'viaje', 'desde el primer día del viaje el invitado ya no propone: sin propuesta, sin lápiz, sin herramientas de cambiar la ruta')
  const menu = await app.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); R.useRouteStore.getState().setActiveDayId('day-1'); await new Promise((r) => setTimeout(r, 1500)); const b = document.querySelector('[data-day-id=day-1] [aria-label="Opciones de la parada"]'); b?.click(); await new Promise((r) => setTimeout(r, 500)); return Array.from(document.querySelectorAll('[data-hoja] button, [data-hoja] a')).map((x) => x.textContent.trim()).filter(Boolean) })()`)
  debe(menu.some((t) => /Ver la ficha/.test(t)) && !menu.some((t) => /Eliminar|Mover|Recomendar|Cambiar/.test(t)), 'viaje', `durante el viaje el menú de la parada solo deja ver la ficha y cómo llegar (${menu.join(' | ')})`)
  cierra(viaje)
  // Free Tour
  const ft = await abrir({ invitado: true })
  const disp = await ft.ev(`const f = await import('/src/components/route/reservas/FreeTourSheet.tsx'); return f.freeTourAvailable(route())`)
  debe(disp === true, '6a', 'el Free Tour está disponible para el invitado (freeTourAvailable con la ruta que le llega: días con curatedId)')
  await ft.ev(`R.useRouteStore.getState().setMode('explore'); return 1`)
  await ft.app.esp(2500)
  const tarjetas = await ft.app.evaluar("Array.from(document.querySelectorAll('button')).map((b) => b.textContent.trim().slice(0, 30)).filter((t) => /Entradas/.test(t))")
  debe(tarjetas.length > 0, '6a', 'EXPLORAR del invitado tiene la tarjeta Entradas (donde está el Free Tour)')
  await ft.app.evaluar("Array.from(document.querySelectorAll('button')).find((b) => /Entradas/.test(b.textContent))?.click(); true")
  await ft.app.esp(3500)
  const hayFT = await ft.app.evaluar("document.body.innerText.includes('Free Tour')")
  debe(hayFT === true, '6a', 'el Free Tour sale en la lista de Entradas del invitado, igual que para el dueño')
  await ft.app.captura(jpg('explorar_free_tour_invitado'))
  // añadir desde EXPLORAR: va a la propuesta
  const antesN = await ft.ev('return L.cambiosDeLaPropuesta(base(), route()).length')
  await ft.app.evaluar("(() => { const m = Array.from(document.querySelectorAll('button')).filter((b) => b.textContent.trim() === '+' || /^\\+ ?Añadir$/.test(b.textContent.trim())); m[1]?.click() ?? m[0]?.click(); return m.length })()")
  await ft.app.esp(1200)
  const hojaDia = await ft.app.evaluar("Boolean(document.querySelector('#add-to-day-heading'))")
  if (hojaDia) {
    await ft.app.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^Añadir (al|a la|el) /.test(x.textContent.trim())); b?.click(); return !!b })()")
    await ft.app.esp(1000)
    const texto = await ft.app.evaluar("document.querySelector('[data-aviso-propuesta]')?.textContent ?? null")
    const despuesN = await ft.ev('return L.cambiosDeLaPropuesta(base(), route()).length')
    debe(despuesN === antesN + 1 && /^Añadido a tu propuesta/.test(texto ?? ''), 'explorar', `añadir desde EXPLORAR va a la propuesta: «${texto}» (el lápiz sube de ${antesN} a ${despuesN})`)
  } else {
    debe(false, 'explorar', 'no se abrió la hoja «¿A qué día lo añadimos?» desde EXPLORAR')
  }
  cierra(ft)
  // permisos: el administrador y quien puede editar sí tienen puntitos y rayitas
  const adm = await abrir({ invitado: false })
  await adm.ev(`R.useRouteStore.getState().setActiveDayId(null); return 1`)
  await adm.app.esp(1500)
  const a = await adm.app.evaluar("({ puntitos: document.querySelectorAll('[data-day-id] [data-menu-hoja]').length, rayitas: document.querySelectorAll('[aria-label=\"Mover este día\"]').length, lapiz: !!document.querySelector('[data-boton-propuesta]') })")
  debe(a.puntitos > 0 && a.rayitas > 0 && !a.lapiz, '6b', `el administrador conserva los puntitos (${a.puntitos}) y las rayitas (${a.rayitas}) de los días y no tiene lápiz`)
  cierra(adm)
  const edi = await abrir({ invitado: true, permiso: 'editar' })
  await edi.ev(`R.useRouteStore.getState().setActiveDayId(null); return 1`)
  await edi.app.esp(1500)
  const b = await edi.app.evaluar("({ puntitos: document.querySelectorAll('[data-day-id] [data-menu-hoja]').length, rayitas: document.querySelectorAll('[aria-label=\"Mover este día\"]').length, lapiz: !!document.querySelector('[data-boton-propuesta]') })")
  const act = await edi.ev('return P.usePropuestaStore.getState().activa')
  debe(b.puntitos > 0 && b.rayitas > 0 && !b.lapiz && act === false, '6b', `quien puede editar conserva puntitos y rayitas y cambia la ruta directamente (sin propuesta): ${JSON.stringify(b)}`)
  cierra(edi)
  const rec = await abrir({ invitado: true })
  await rec.ev(`R.useRouteStore.getState().setActiveDayId(null); return 1`)
  await rec.app.esp(1500)
  const c = await rec.app.evaluar("({ puntitos: document.querySelectorAll('[data-day-id] [data-menu-hoja]').length, rayitas: document.querySelectorAll('[aria-label=\"Mover este día\"]').length })")
  debe(c.puntitos === 0 && c.rayitas === 0, '6b', 'quien solo recomienda no tiene ni puntitos ni rayitas en los días')
  cierra(rec)
}

console.log(`\nPrueba de la propuesta (Tanda 10N): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
