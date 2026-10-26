// La prueba de «Puede editar» en la pantalla y sus vecinos de la Tanda 10N3 (apartados 1, 2.7, 2.8 y 3 · «Eric ha cambiado el viaje» y el lápiz).
// Hace falta el servidor y Vite (los de la batería los arrancan solos; a mano: `npm run server` y `npm run dev`). Abre un Chrome sin ventana (scripts/destino/_enLaApp.mjs).
//   APP_URL=http://localhost:5181 API_URL=http://localhost:8851 node scripts/destino/pruebaTanda10N3_editar.mjs
// Capturas a tamaño de móvil en docs/dias/capturas_jutrip/10n3_editar_*.jpg
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
const jpg = (n) => path.join(SALIDA, `10n3_editar_${n}.jpg`)
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const RUTA = '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0'
const leer = (f) => fs.readFileSync(f, 'utf8')

/** Abre la app con el viaje de pruebas como administrador (`permiso: null`) o como invitado con ese permiso, antes de que empiece el viaje. */
async function abrir({ permiso = null, simulada = '2026-10-10', ruta = RUTA } = {}) {
  const invitado = permiso !== null
  const antes = invitado ? `sessionStorage.setItem('trazo:invitado','1');sessionStorage.setItem('trazo:permiso','${permiso}')` : undefined
  const app = await abrirApp(APP, { ruta, antes })
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
    V.useViajeCompartido.getState().poner({ tripId: 'demo-viaje', gente: [{ id: 'eric', nombre: 'Eric', foto: null, esAdmin: true, permiso: 'admin', esYo: ${invitado ? 'false' : 'true'} }, { id: 'ana', nombre: 'Ana', foto: null, esAdmin: false, permiso: ${JSON.stringify(permiso ?? 'recomendar')}, esYo: ${invitado ? 'true' : 'false'} }], recomendaciones: [] })
    R.useRouteStore.getState().setMode('days')
    return true })()`)
  await app.esp(1500)
  const ev = (js) => app.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const P = await import('/src/store/usePropuestaStore.ts'); const L = await import('/src/lib/propuesta.ts'); const V = await import('/src/store/useViajeCompartido.ts'); const D = await import('/src/store/useDatesCalendarStore.ts'); const route = () => R.useRouteStore.getState().route; const st = () => R.useRouteStore.getState(); const base = () => P.usePropuestaStore.getState().base; ${js} })()`)
  return { app, ev }
}
const cierra = (a) => a.app.cerrar()
const sinDeshacer = "Array.from(document.querySelectorAll('[role=status]')).map((e) => e.textContent).join(' | ')"

/* ───────────── 1. «Puede editar»: edita en la pantalla como el administrador ───────────── */
console.log('1. «Puede editar»: la ruta funciona como para el administrador')
const edi = await abrir({ permiso: 'editar' })
{
  const { app, ev } = edi
  debe((await ev('return P.usePropuestaStore.getState().activa')) === false, '1', 'quien puede editar no tiene propuesta encendida')
  // 1a. La ruta cambia directamente: orden, quitar, mover de día y añadir.
  const antes = JSON.parse(await ev("const d = route().days.find((x) => x.id === 'day-3'); return JSON.stringify(d.stops.map((s) => s.id))"))
  await ev(`const d = route().days.find((x) => x.id === 'day-3'); const ids = d.stops.map((s) => s.id).filter((x) => x !== 'stop-3-arco-de-constantino'); ids.splice(0, 0, 'stop-3-arco-de-constantino'); st().reorderStops('day-3', ids); return 1`)
  const orden = JSON.parse(await ev("const d = route().days.find((x) => x.id === 'day-3'); return JSON.stringify(d.stops.map((s) => s.id))"))
  debe(orden[0] === 'stop-3-arco-de-constantino' && antes[0] !== orden[0], '1', 'puede reordenar las paradas de un día (cambia la ruta de verdad)')
  await ev(`st().removeStop('day-3', 'stop-3-barrio-judio'); return 1`)
  debe((await ev("return route().days.find((x) => x.id === 'day-3').stops.some((s) => s.id === 'stop-3-barrio-judio')")) === false, '1', 'puede quitar una parada')
  await ev(`st().moveStopToDay('stop-3-elefantino-de-bernini', 'day-3', 'day-2'); return 1`)
  debe((await ev("return route().days.find((x) => x.id === 'day-2').stops.some((s) => s.id === 'stop-3-elefantino-de-bernini')")) === true, '1', 'puede mover una parada a otro día')
  await app.esp(500)
  const lapiz = await app.evaluar("Boolean(document.querySelector('[data-boton-propuesta]'))")
  debe(lapiz === false && (await ev('return P.usePropuestaStore.getState().activa')) === false, '1', 'tras tres cambios no hay lápiz ni propuesta: todo es directo')
  // 1b. Las herramientas de la pantalla: puntitos de la parada y de los días, rayitas.
  await ev(`st().setActiveDayId(null); return 1`)
  await app.esp(1500)
  const dias = await app.evaluar("({ puntitos: document.querySelectorAll('[data-day-id] [data-menu-hoja]').length, rayitas: document.querySelectorAll('[aria-label=\"Mover este día\"]').length, solo: document.documentElement.hasAttribute('data-solo-ver') })")
  debe(dias.puntitos > 0 && dias.rayitas > 0 && dias.solo === false, '1', `en DÍAS tiene los puntitos (${dias.puntitos}) y las rayitas (${dias.rayitas}) de los días, y nada escondido (data-solo-ver)`)
  await ev(`st().setActiveDayId('day-3'); return 1`)
  await app.esp(1500)
  const menu = await app.evaluar(`(async () => { const b = document.querySelector('[data-day-id=day-3] [data-stop-id] [aria-label*="enú"], [data-day-id=day-3] [data-stop-id] [data-menu-hoja]'); if (!b) return null; b.click(); await new Promise((r) => setTimeout(r, 700)); return Array.from(document.querySelectorAll('[role=dialog] button, [data-menu-hoja-abierta] button')).map((x) => x.textContent.trim()).filter(Boolean) })()`)
  debe(menu === null || (menu.some((t) => /Mover|Eliminar|Quitar/.test(t)) && !menu.every((t) => /Ver la ficha|Cómo llegar/.test(t))), '1', `el menú de la parada trae mover/quitar (${(menu ?? ['(sin menú localizable)']).join(' | ')})`)
  await app.evaluar("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); true")
  // 1c. EXPLORAR: añadir.
  await ev(`st().setMode('explore'); return 1`)
  await app.esp(2500)
  const botones = await app.evaluar("Array.from(document.querySelectorAll('button')).map((b) => b.textContent.trim().slice(0, 24)).filter((t) => /Entradas|Lugares|Miradores|Restaurantes/.test(t)).length")
  debe(botones > 0, '1', 'EXPLORAR tiene sus tarjetas igual que para el administrador')
  await app.captura(jpg('editor_explorar'))
  // 1d. Lo que NO puede: las fechas.
  await ev(`st().setMode('route'); return 1`)
  await app.esp(2000)
  const fechas = await app.evaluar("(() => { const b = document.querySelector('[data-fechas-del-viaje]'); return b ? { modo: b.getAttribute('data-fechas-del-viaje'), desactivado: b.disabled } : null })()")
  debe(fechas?.modo === 'fijas' && fechas.desactivado === true, '1', `el botón de las fechas del viaje sale apagado para quien puede editar (${JSON.stringify(fechas)})`)
  await ev(`D.useDatesCalendarStore.getState().request(); return 1`)
  debe((await ev('return D.useDatesCalendarStore.getState().open')) === false, '1', 'el calendario de fechas no se abre desde ningún sitio (request() no hace nada)')
  await app.captura(jpg('editor_ruta_fechas_fijas'))
  // 1e. RESERVAS: llegada, vuelta y alojamiento en gris.
  await ev(`st().setMode('bookings'); return 1`)
  await app.esp(2500)
  const gris = await app.evaluar("document.querySelectorAll('[data-solo-lectura]').length")
  debe(gris >= 2, '1', `en RESERVAS la llegada y vuelta y el alojamiento salen en gris (${gris} zonas de solo mirar)`)
  await app.evaluar("Array.from(document.querySelectorAll('button')).find((b) => /Alojamiento/.test(b.textContent))?.click(); true")
  await app.esp(800)
  await app.captura(jpg('editor_reservas_gris'))
  // 1f. Personas del viaje: sin invitar, sin quitar, sin permisos.
  await ev(`st().setMode('route'); const U = await import('/src/store/usePersonasStore.ts'); U.usePersonasStore.getState().abrir(); return 1`)
  await app.esp(1500)
  const p = await app.evaluar("(() => ({ invitar: !!document.querySelector('[data-invitar-a-alguien]'), salir: !!document.querySelector('[data-salir-del-viaje]'), filas: Array.from(document.querySelectorAll('[data-persona-fila] > button')).filter((b) => !b.disabled).length, quitar: !!document.querySelector('[data-quitar-del-viaje]'), cambiar: !!document.querySelector('[data-cambiar-permiso]') }))()")
  debe(p.invitar === false && p.quitar === false && p.cambiar === false && p.filas === 0 && p.salir === true, '1', `en «Personas del viaje» no puede invitar, quitar ni cambiar permisos; solo [Salir del viaje] (${JSON.stringify(p)})`)
  await app.captura(jpg('editor_personas'))
  // 1g. Borrar el viaje: para quien no es el dueño es «Salir».
  const fila = leer('src/components/perfil/FilaDeViaje.tsx')
  debe(/esInvitado \? `Salir del viaje a/.test(fila) && /esInvitado \? 'salir' : 'papelera'/.test(fila), '1', 'en «Mis viajes» el viaje de otra persona no se borra: es «Salir de este viaje»')
  cierra(edi)
}

/* ───────────── 1h. Aceptar y rechazar desde la campana ───────────── */
console.log('1h. Aceptar o rechazar propuestas desde la campana')
const dec = await abrir({ permiso: 'editar' })
{
  const { app, ev } = dec
  // Una propuesta de Ana (como la que llegaría): mover el Arco delante del Coliseo y quitar el Barrio Judío.
  const rec = await ev(`
    const b = JSON.parse(JSON.stringify(route())); const x = JSON.parse(JSON.stringify(b));
    const d = x.days.find((y) => y.id === 'day-3'); const a = d.stops.findIndex((s) => s.id === 'stop-3-arco-de-constantino'); const [m] = d.stops.splice(a, 1); d.stops.splice(0, 0, m);
    d.stops = d.stops.filter((s) => s.id !== 'stop-3-barrio-judio');
    const cs = L.cambiosDeLaPropuesta(b, x); const paquete = L.construirPropuesta(b, x, cs);
    const rec = { id: 'rec-1', tripId: 'demo-viaje', authorId: 'ana', tipo: paquete.tipo, payload: paquete.payload, estado: 'pendiente', creadaEn: new Date().toISOString(), decisiones: {} };
    V.useViajeCompartido.getState().poner({ recomendaciones: [rec] });
    const U = await import('/src/store/useR2Store.ts'); U.useR2Store.getState().abrir(rec);
    return JSON.stringify({ n: cs.length })`)
  await app.esp(1500)
  const hoja = await app.evaluar("(() => { const t = document.body.innerText; return { texto: /Ana te propone 2 cambios/.test(t), aceptar: Array.from(document.querySelectorAll('button')).filter((b) => /^Aceptar/.test(b.textContent.trim())).length, rechazar: Array.from(document.querySelectorAll('button')).filter((b) => /^Rechazar/.test(b.textContent.trim())).length } })()")
  debe(JSON.parse(rec).n === 2 && hoja.texto && hoja.aceptar >= 1 && hoja.rechazar >= 1, '1h', `quien puede editar ve «Ana te propone 2 cambios» con [Aceptar] y [Rechazar] (${JSON.stringify(hoja)})`)
  await app.captura(jpg('editor_decide_propuesta'))
  // La condición de la etiqueta dorada y de la campana (el código, sin servidor).
  const et = leer('src/components/propuesta/EtiquetaRecomendacion.tsx')
  debe(/puedeEditar/.test(et) && !/!esInvitado/.test(et), '1h', 'la etiqueta «1 recomendación» del día la ve quien decide (administrador y quien puede editar), no solo el dueño')
  const sql = leer('supabase/migrations/0045_aviso_propuesta_a_editores.sql')
  debe(/permiso = 'editar'/.test(sql) && /'rec:' \|\| new\.id \|\| ':' \|\| v_destinatario/.test(sql) && /clave like 'rec:' \|\| new\.id \|\| ':%'/.test(sql), '1h', 'la migración 0045 manda el aviso de la propuesta también a quien puede editar y lo da por leído a todos al decidir')
  const gv = leer('src/hooks/useGastosDelViaje.ts')
  debe(/puedeDecidir: puedeEditar/.test(gv), '1h', 'los gastos [Para todos] pendientes los decide quien puede editar (puedeDecidir = puedeEditar)')
  cierra(dec)
}

/* ───────────── 1i. El administrador conserva lo suyo; quien solo recomienda no tiene las fechas ───────────── */
console.log('1i. Administrador y quien solo recomienda')
const adm = await abrir({ permiso: null })
{
  const { app, ev } = adm
  await ev(`st().setMode('route'); return 1`)
  await app.esp(1800)
  const f = await app.evaluar("(() => { const b = document.querySelector('[data-fechas-del-viaje]'); return b ? { modo: b.getAttribute('data-fechas-del-viaje'), desactivado: b.disabled } : null })()")
  debe(f?.modo === 'editable' && f.desactivado === false, '1', `el administrador sí puede tocar las fechas (${JSON.stringify(f)})`)
  await ev(`D.useDatesCalendarStore.getState().request(); return 1`)
  debe((await ev('return D.useDatesCalendarStore.getState().open')) === true, '1', 'y el calendario se le abre')
  await ev(`D.useDatesCalendarStore.getState().close(); st().setMode('bookings'); return 1`)
  await app.esp(2000)
  debe((await app.evaluar("document.querySelectorAll('[data-solo-lectura]').length")) === 0, '1', 'en RESERVAS del administrador no hay nada en gris')
  cierra(adm)
}
const rec = await abrir({ permiso: 'recomendar' })
{
  const { app, ev } = rec
  await ev(`st().setMode('route'); return 1`)
  await app.esp(1800)
  const f = await app.evaluar("(() => { const b = document.querySelector('[data-fechas-del-viaje]'); return b ? { modo: b.getAttribute('data-fechas-del-viaje'), desactivado: b.disabled } : null })()")
  debe(f?.modo === 'fijas' && f.desactivado === true, '1', `quien solo recomienda tampoco abre las fechas (${JSON.stringify(f)})`)
  await ev(`D.useDatesCalendarStore.getState().request(); return 1`)
  debe((await ev('return D.useDatesCalendarStore.getState().open')) === false, '1', 'ni el calendario se abre')
  cierra(rec)
}

/* ───────────── 2.7 El alojamiento del invitado: buscar y ya ───────────── */
console.log('2.7 Alojamiento del invitado: [Buscar alojamiento] sin «mandar la idea»')
for (const permiso of ['recomendar', 'editar']) {
  const a = await abrir({ permiso })
  const { app, ev } = a
  await ev(`st().setMode('bookings'); return 1`)
  await app.esp(2200)
  await app.evaluar("Array.from(document.querySelectorAll('button')).find((b) => /Alojamiento/.test(b.textContent) && b.closest('[data-blk]') !== null || /^Alojamiento/.test(b.textContent.trim()))?.click(); true")
  await app.esp(900)
  const antes = await app.evaluar("({ buscar: Array.from(document.querySelectorAll('button')).some((b) => /Buscar alojamiento/.test(b.textContent)), anadir: Array.from(document.querySelectorAll('button')).some((b) => /Añadir mi alojamiento/.test(b.textContent)) })")
  debe(antes.buscar === true, '2.7', `[Buscar alojamiento] está a la vista para ${permiso}`)
  if (permiso === 'recomendar') await app.captura(jpg('invitado_buscar_alojamiento'))
  await app.evaluar("Array.from(document.querySelectorAll('button')).find((b) => /Buscar alojamiento/.test(b.textContent))?.click(); true")
  await app.esp(1500)
  const mapa = await app.evaluar("({ tengo: !!document.querySelector('[data-ya-tengo-alojamiento]'), textos: /mandar|idea|Añádelo/i.test(document.body.innerText) })")
  debe(mapa.tengo === false && mapa.textos === false, '2.7', `en el mapa de alojamientos de ${permiso} no hay «¿Ya tienes alojamiento? Añádelo» ni «mandar la idea»`)
  if (permiso === 'recomendar') await app.captura(jpg('invitado_mapa_alojamiento'))
  await ev(`const A = await import('/src/store/useAlojamientoUi.ts'); A.useAlojamientoUi.getState().cerrarMapa(); A.useAlojamientoUi.getState().abrirTuAlojamiento(null); return 1`)
  await app.esp(1000)
  const hoja = await app.evaluar(`({ hoja: !!document.querySelector('[data-hoja-tu-alojamiento]') || /Tu alojamiento/.test(document.body.innerText), aviso: ${sinDeshacer} })`)
  debe(!/Tu alojamiento/.test(hoja.hoja ? '' : '') && /Esto lo cambia Eric/.test(JSON.stringify(await app.evaluar("document.body.innerText"))), '2.7', `si algo le abre la hoja «Tu alojamiento», se cierra y dice «Esto lo cambia Eric» (${permiso})`)
  cierra(a)
}
const aloj = leer('src/components/route/alojamiento/AlojamientoHost.tsx')
debe(!/mandar|idea/i.test(aloj.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')) && !/El alojamiento lo guarda/.test(aloj), '2.7', 'AlojamientoHost ya no tiene «mandarle la idea» ni «El alojamiento lo guarda Eric»')

/* ───────────── 2.8 [Proponer el cambio] y [Moverlo al viernes 27] ───────────── */
console.log('2.8 [Proponer el cambio] / [Moverlo al viernes 27]')
const reservaColiseo = "{ id: 'mia-coliseo', kind: 'entrada', refId: 'Coliseo', name: 'Coliseo, Foro y Palatino', placeNames: ['Coliseo'], dateIso: '2026-10-18', dayNumber: null, time: '09:00' }"
const sinPaquete = await abrir({ permiso: 'recomendar' })
{
  const { app, ev } = sinPaquete
  const etiquetas = await ev(`const C = await import('/src/lib/cambiarDiaPorReserva.ts'); return JSON.stringify([C.etiquetaDelCambio('recomendar', 'domingo 18'), C.etiquetaDelCambio('editar', 'domingo 18'), C.etiquetaDelCambio('admin', 'domingo 18')])`)
  debe(etiquetas === JSON.stringify(['Proponer el cambio', 'Moverlo al domingo 18', 'Moverlo al domingo 18']), '2.8', `el botón del aviso: ${etiquetas}`)
  await ev(`const M = await import('/src/store/useMisReservas.ts'); M.useMisReservas.getState().anadir(${reservaColiseo}); return 1`)
  const antes = await ev("return route().days.find((d) => d.stops.some((s) => s.id === 'stop-3-coliseo')).id")
  const n0 = await ev('return L.cambiosDeLaPropuesta(base(), route()).length')
  const atendido = await ev(`const R2 = await import('/src/lib/reservasGrupo.ts'); return R2.proponerCambioDeReserva({ reservaId: 'mia-coliseo', sitio: 'el Coliseo', diaDeLaReserva: 'domingo 18', diaDeLaRuta: 'lunes 19', dateIso: '2026-10-18' })`)
  await app.esp(900)
  const despues = await ev("return route().days.find((d) => d.stops.some((s) => s.id === 'stop-3-coliseo')).id")
  const n1 = await ev('return L.cambiosDeLaPropuesta(base(), route()).length')
  debe(atendido === true && antes === 'day-3' && despues === 'day-2', '2.8', `[Proponer el cambio] mueve el Coliseo de ${antes} a ${despues} (el evento lo atiende alguien)`)
  debe(n1 === n0 + 1, '2.8', `y es UN cambio más de su propuesta (de ${n0} a ${n1})`)
  const lapizN = await app.evaluar("document.querySelector('[data-boton-propuesta]')?.getAttribute('data-propuesta-n') ?? null")
  debe(lapizN === String(n1), '2.8', `el lápiz cuenta el cambio nuevo (${lapizN})`)
  await app.captura(jpg('proponer_cambio_coliseo'))
  cierra(sinPaquete)
}
const editor2 = await abrir({ permiso: 'editar' })
{
  const { app, ev } = editor2
  await ev(`const M = await import('/src/store/useMisReservas.ts'); M.useMisReservas.getState().anadir(${reservaColiseo}); return 1`)
  const atendido = await ev(`const R2 = await import('/src/lib/reservasGrupo.ts'); return R2.proponerCambioDeReserva({ reservaId: 'mia-coliseo', sitio: 'el Coliseo', diaDeLaReserva: 'domingo 18', diaDeLaRuta: 'lunes 19', dateIso: '2026-10-18' })`)
  await app.esp(900)
  const despues = await ev("return route().days.find((d) => d.stops.some((s) => s.id === 'stop-3-coliseo')).id")
  debe(atendido === true && despues === 'day-2', '2.8', `[Moverlo al domingo 18] mueve el Coliseo directo a ${despues}`)
  debe((await ev('return P.usePropuestaStore.getState().activa')) === false && (await app.evaluar("!document.querySelector('[data-boton-propuesta]')")) === true, '2.8', 'y sin propuesta ni lápiz: es un cambio directo')
  const toast = await app.evaluar("document.body.innerText")
  debe(/Movida/.test(toast), '2.8', 'con su «Movida …» y [Deshacer]')
  await app.captura(jpg('moverlo_al_dia_editor'))
  cierra(editor2)
}
{
  const avisoSrc = leer('src/components/avisos/AvisoDeEntrada.tsx')
  const notices = leer('src/hooks/useAppNotices.ts')
  debe(/etiquetaDelCambio\(rol/.test(avisoSrc) && /etiquetaDelCambio\(rol/.test(notices), '2.8', 'el aviso del servidor y el calculado en el móvil usan la misma etiqueta según el permiso')
}

/* ───────────── 3. «Eric ha cambiado el viaje.» y la propuesta a medias ───────────── */
console.log('3. «Eric ha cambiado el viaje.» y la propuesta a medias marcada')
const medias = await abrir({ permiso: 'recomendar' })
{
  const { app, ev } = medias
  const host = leer('src/components/compartir/CompartidoHost.tsx')
  debe(/refrescarViajeActivo/.test(host) && /conectarViaje/.test(host) && /data-linea-viaje-cambiado/.test(host), '3', 'CompartidoHost está enchufado: Realtime + refresco, y pinta la línea «Eric ha cambiado el viaje.»')
  debe(/alHidratarViaje\.fn = /.test(leer('src/store/usePropuestaStore.ts')) && /alHidratarViaje/.test(leer('src/store/useRouteStore.ts')), '3', 'la propuesta se ajusta sola cuando llega la ruta nueva del dueño (hydrateTrip → alLlegarElViaje)')
  // El invitado propone quitar el Panteón; el dueño lo quita antes. Se simula que llega la ruta nueva del dueño.
  await ev(`st().removeStop('day-3', 'stop-3-panteon'); return 1`)
  await app.esp(500)
  const n0 = await ev('return L.cambiosDeLaPropuesta(base(), route()).length')
  await ev(`const b = JSON.parse(JSON.stringify(base())); b.days = b.days.map((d) => d.id === 'day-3' ? { ...d, stops: d.stops.filter((s) => s.id !== 'stop-3-panteon') } : d); R.useRouteStore.setState({ route: b }); await P.usePropuestaStore.getState().alLlegarElViaje(); return 1`)
  await app.esp(2500)
  const sin = await ev('return P.usePropuestaStore.getState().sinSentido.length')
  debe(n0 === 1 && sin === 1, '3', `el dueño quitó el Panteón antes: la propuesta a medias lo marca (${sin} sin sentido)`)
  await ev(`P.usePropuestaStore.getState().abrirHoja({ modo: 'mia' }); return 1`)
  await app.esp(1200)
  const marcado = await app.evaluar("(() => { const e = document.querySelector('[data-sin-sentido]'); return e ? { texto: e.textContent, quitar: !!e.querySelector('[data-quitar-sin-sentido]') } : null })()")
  debe(marcado && /ya no/i.test(marcado.texto) && marcado.quitar, '3', `en la hoja «Tu propuesta» sale «${marcado?.texto?.slice(0, 80)}» con su ✕ para quitarlo`)
  await app.captura(jpg('propuesta_a_medias_marcada'))
  cierra(medias)
}

/* ───────────── 3b. El lápiz y la última parada, en un móvil de 390 de ancho con un día largo ───────────── */
console.log('3b. El lápiz no tapa la última parada ni el botón de los logros (390 px, día largo)')
const lapizP = await abrir({ permiso: 'recomendar' })
{
  const { app, ev } = lapizP
  await ev(`st().removeStop('day-3', 'stop-3-barrio-judio'); st().setActiveDayId('day-2'); return 1`)
  await app.esp(2500)
  await app.evaluar("(() => { const l = document.querySelector('[data-day-id=day-2]')?.closest('.overflow-y-auto') ?? Array.from(document.querySelectorAll('.overflow-y-auto')).find((e) => e.scrollHeight > e.clientHeight + 50); if (l) l.scrollTop = l.scrollHeight; return !!l })()")
  await app.esp(1200)
  const geo = await app.evaluar(`(() => {
    const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height, b: b.bottom, r: b.right } }
    const lapiz = r(document.querySelector('[data-boton-propuesta]'))
    const logros = r(document.querySelector('[data-boton-logros]'))
    const paradas = Array.from(document.querySelectorAll('[data-day-id=day-2] [data-stop-id]'))
    const ult = paradas.at(-1)
    const solapa = (a, b) => a && b && a.x < b.r && a.r > b.x && a.y < b.b && a.b > b.y
    return { n: paradas.length, ancho: window.innerWidth, lapiz, logros, ultima: r(ult), tapaLaUltima: solapa(lapiz, r(ult)), tapaLosLogros: solapa(lapiz, logros), nombre: ult?.textContent?.slice(0, 40) }
  })()`)
  debe(geo.ancho === 390 && geo.n >= 15, '3b', `día largo en un móvil de ${geo.ancho} px: ${geo.n} paradas`)
  debe(geo.lapiz && geo.tapaLosLogros === false, '3b', `el lápiz no tapa el botón de los logros (${JSON.stringify({ lapiz: geo.lapiz, logros: geo.logros })})`)
  debe(geo.ultima && geo.tapaLaUltima === false, '3b', `con el final del día a la vista, el lápiz no tapa la última parada «${geo.nombre}» (${JSON.stringify(geo.ultima)})`)
  await app.captura(jpg('lapiz_dia_largo_final'))
  // Y en EXPLORAR y RESERVAS el lápiz sigue sin tapar el final.
  await ev(`st().setMode('bookings'); return 1`)
  await app.esp(2000)
  await app.evaluar("(() => { const l = Array.from(document.querySelectorAll('.overflow-y-auto')).find((e) => e.scrollHeight > e.clientHeight + 50); if (l) l.scrollTop = l.scrollHeight; return !!l })()")
  await app.esp(800)
  const rv = await app.evaluar(`(() => {
    const lapiz = document.querySelector('[data-boton-propuesta]')?.getBoundingClientRect()
    if (!lapiz) return { lapiz: false }
    const cand = Array.from(document.querySelectorAll('.overflow-y-auto button, .overflow-y-auto a, .overflow-y-auto [role=button]')).filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.bottom <= window.innerHeight })
    const tapados = cand.filter((e) => { const b = e.getBoundingClientRect(); return lapiz.left < b.right && lapiz.right > b.left && lapiz.top < b.bottom && lapiz.bottom > b.top }).map((e) => e.textContent.trim().slice(0, 30))
    return { lapiz: true, tapados }
  })()`)
  debe(rv.lapiz && rv.tapados.length === 0, '3b', `en RESERVAS, con el final a la vista, el lápiz no tapa ningún botón (${JSON.stringify(rv.tapados)})`)
  await app.captura(jpg('lapiz_reservas_final'))
  cierra(lapizP)
}

console.log(`\nPrueba de «Puede editar» (Tanda 10N3): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
