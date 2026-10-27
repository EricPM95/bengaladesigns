// Tanda 10N6 (K1): el Free Tour sin la hoja vieja (apartado 1), elegir y confirmar (1b) y quitar una parada con entrada sin perder la entrada (1c).
//   SERVER_PORT=8871 node server/index.js   y   API_TARGET=http://localhost:8871 npx vite --config scripts/destino/_vite_estable.config.mjs --port 5201 --strictPort
//   APP_URL=http://localhost:5201 API_URL=http://localhost:8871 node scripts/destino/pruebaTanda10N6_confirmar.mjs
// No toca el motor de rutas. Imprime «N comprobaciones, M fallos» y sale con 1 si falla. Capturas: docs/dias/capturas_jutrip/10n6_*.jpg (390 x 844).
import fs from 'node:fs'
import path from 'node:path'
import { conViaje, modulo, SALIDA, esp } from './_10n5_comun.mjs'
import { capturarDesign } from './capturaDesign.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const foto = (n) => path.join(SALIDA, `10n6_${n}.jpg`)

/* ───────────── 1. El código ───────────── */
console.log('1. El código')
{
  const ft = sinComentarios(leer('src/components/route/reservas/FreeTourSheet.tsx'))
  debe(!/A qué hora lo quieres|FRANJAS|Quitar el Free Tour/.test(ft), 'ap1', 'FreeTourSheet.tsx ya no tiene la hoja de la hora')
  const dia = sinComentarios(leer('src/components/route/reservas/FreeTourDiaSheet.tsx'))
  debe(!/Quitar el Free Tour|aplicarFreeTour/.test(dia), 'ap1', '«¿A qué día lo añadimos?» ya no lleva «Quitar el Free Tour» (se quita como cualquier parada)')
  const todo = ['src/components/route/ExplorePanel.tsx', 'src/components/route/freeDay/AddToTripScreen.tsx', 'src/components/route/dayDetail/DayDetailPanel.tsx', 'src/components/route/placeExplorer/PlaceExplorerScreen.tsx'].map((f) => sinComentarios(leer(f))).join('\n')
  debe(!/A qué hora lo quieres/.test(todo), 'ap1', 'ningún sitio (EXPLORAR, «+ Añadir parada», ficha, RESERVAS) tiene la pregunta de la hora')
  const menu = sinComentarios(leer('src/components/route/dayDetail/StopMenu.tsx'))
  debe(!/ConfirmDialog/.test(menu) && !/Se confirma antes/.test(menu), '1b', 'quitar una parada normal ya no pregunta ni dice «Se confirma antes»')
  debe(/Sale de tu ruta\. Tienes su entrada: te preguntamos qué hacer con ella\./.test(menu), '1c', 'la línea de «Quitar parada» con entrada')
  const dlg = leer('src/components/route/dayDetail/QuitarConEntradaDialog.tsx')
  debe(/Quitar solo de la ruta/.test(dlg) && /Quitar también la entrada/.test(dlg) && /Cancelar/.test(dlg) && /bg-accent-red/.test(dlg), '1c', 'la confirmación con sus tres botones y el de borrar la entrada en rojo')
  const conf = leer('src/components/route/ConfirmDialog.tsx')
  debe(/peligro/.test(conf), '1b', 'ConfirmDialog sabe poner el botón en rojo')
  const fuentes = [
    'src/components/route/DayList.tsx',
    'src/components/route/RouteOverview.tsx',
    'src/components/route/excursions/ExcursionSinHueco.tsx',
    'src/components/route/DatesChangeDialog.tsx',
    'src/components/ui/ConfirmDeleteButton.tsx',
    'src/components/route/reservas/AddReservationSheet.tsx',
    'src/components/route/reservas/LlegadaYVuelta.tsx',
    'src/components/route/reservas/ReservedMarks.tsx',
    'src/components/compartir/PersonasDelViaje.tsx',
  ]
  for (const f of fuentes) debe(!/¿Seguro que quieres|¿Estás seguro|¿Eliminar |Sí, eliminar/.test(sinComentarios(leer(f)).replace(/¿Eliminar tu viaje/g, '')), '1b', `${path.basename(f)} pregunta con artículo y «Sí, …» (no «¿Estás seguro?»)`)
  const per = leer('src/components/compartir/PersonasDelViaje.tsx')
  debe(/¿Quitamos a \$\{nombre\} del viaje\?/.test(per) && /Dejará de verlo y su plaza del pase vuelve a ti\./.test(per) && /Sí, quitar/.test(per), '1b', '«Personas del viaje» → «¿Quitamos a Ana del viaje?» · «Dejará de verlo y su plaza del pase vuelve a ti.» · [Cancelar] [Sí, quitar]')
  const dl = sinComentarios(leer('src/components/route/DayList.tsx'))
  debe(/¿Quitamos \$\{elDia\(route, removeDay\.dayNumber\)\} de tu viaje\?/.test(dl) && /peligro/.test(dl), '1b', 'eliminar un día: «¿Quitamos el martes 14 de tu viaje?» con el botón rojo')
}

/* ───────────── 2. Design, al lado ───────────── */
try {
  await capturarDesign('Piezas/Hojas Opciones.dc.html', foto('design_hojas_opciones'), { ancho: 1900, alto: 1000 })
} catch (e) {
  console.log('  (no se pudo capturar Design: ' + e.message + ')')
}

/* ───────────── 3. En la app ───────────── */
console.log('3. En la app')
let a = await conViaje({ version: 'pago', alto: 844 })
const ev = (js) => a.evaluar(js)
const store = (js) => ev(modulo('/src/store/useRouteStore.ts') + `.then((m) => { const s = m.useRouteStore.getState(); const r = s.route; ${js} })`)
const flow = (js) => ev(modulo('/src/store/useAddFlowStore.ts') + `.then((m) => { const f = m.useAddFlowStore.getState(); ${js} })`)
const cap = (n) => a.captura(foto(n))
const dia = (n) => `r.days.find((d) => d.dayNumber === ${n})`
const paradas = (n) => store(`return ${dia(n)}.stops.map((x) => ({ n: x.name, h: x.time, res: x.reservedId, ft: Boolean(x.isFreeTour) }))`)
const esperar = async (fn, veces = 60) => {
  for (let i = 0; i < veces; i++) {
    if (await fn().catch(() => false)) return true
    await esp(500)
  }
  return false
}
const modo = async (m) => {
  await store(`s.setMode(${JSON.stringify(m)}); return true`)
  await esp(1500)
}
const verDia = async (n) => {
  await modo('days')
  await store(`s.setActiveDayId(${dia(n)}.id); return true`)
  await esp(1800)
}
/** Abre el «···» de la parada con ese nombre y devuelve las tarjetas de su hoja. */
const abrirMenu = async (nombre) => {
  const ok = await ev(`(() => {
    const botones = Array.from(document.querySelectorAll('[data-menu-hoja="parada"]'))
    for (const b of botones) {
      let e = b
      let fila = null
      for (let i = 0; i < 10 && e.parentElement; i++) {
        e = e.parentElement
        if (e.querySelectorAll('[data-menu-hoja="parada"]').length > 1) break
        fila = e
      }
      if (fila && fila.textContent.includes(${JSON.stringify(nombre)})) { b.scrollIntoView({ block: 'center' }); b.click(); return true }
    }
    return false
  })()`)
  await esp(900)
  return ok
}
const leerHoja = () =>
  ev(`(() => {
    const h = document.querySelector('[data-hoja-opciones]')
    if (!h) return null
    const tarjetas = Array.from(h.querySelectorAll('[data-opcion-hoja]')).map((t) => ({ titulo: (t.querySelector('[data-opcion-titulo]')?.textContent ?? t.textContent).trim(), texto: t.textContent.trim(), deshabilitada: t.hasAttribute('data-deshabilitada'), peligro: t.hasAttribute('data-peligro') }))
    return { tarjetas, texto: h.textContent }
  })()`)
const cerrarHojas = async () => {
  await ev("Array.from(document.querySelectorAll('[data-hoja-opciones] [data-hoja-cerrar], [data-hoja] [aria-label=\"Cerrar\"]')).forEach((b) => b.click()); true")
  await esp(400)
}
const clicTexto = (texto, dentro = 'document') =>
  ev(`(() => { const b = Array.from(${dentro}.querySelectorAll('button')).find((x) => (x.textContent || '').trim().includes(${JSON.stringify(texto)}) && x.offsetParent !== null); if (!b) return false; b.scrollIntoView({ block: 'center' }); b.click(); return true })()`)
const toast = () => flow("return f.toast?.message ?? null")

try {
  // El motor tarda en dejar el viaje quieto: se espera a que el día 3 tenga sus paradas.
  await esperar(async () => (await paradas(3)).length > 5)
  const original = await store('return r.days.filter((d) => !d.isReturnLeg).map((d) => d.curatedId)')
  debe(original.join() === 'D2,D4,D1', 'prep', `el viaje de pruebas: ${original.join()}`)

  /* ── 1b · Quitar una parada normal: sin pregunta y con [Deshacer] ── */
  console.log('1b. Quitar una parada normal')
  await verDia(3)
  debe(await abrirMenu('Arco de Constantino'), '1b', 'el «···» de la parada')
  const h1 = await leerHoja()
  const quitar1 = h1?.tarjetas.find((t) => t.titulo === 'Quitar parada')
  debe(quitar1 && !quitar1.deshabilitada && quitar1.peligro && /Sale de tu ruta\. Puedes deshacerlo/.test(quitar1.texto) && !/Se confirma antes/.test(h1.texto), '1b', `«Quitar parada»: ${quitar1?.texto}`)
  await cap('parada_normal_menu')
  await ev("document.querySelector('[data-hoja-opciones] [data-peligro]').click(); true")
  await esp(900)
  debe(!(await ev("Boolean(document.querySelector('[data-confirmar]'))")), '1b', 'sin ninguna pregunta')
  const sin = await paradas(3)
  debe(!sin.some((p) => p.n === 'Arco de Constantino'), '1b', 'la parada se ha quitado enseguida')
  const t1 = await toast()
  debe(t1 === 'Quitada de tu ruta: Arco de Constantino', '1b', `el aviso de abajo: «${t1}»`)
  await cap('parada_normal_quitada')
  await flow('f.undo(); return true')
  await esp(600)
  debe((await paradas(3)).some((p) => p.n === 'Arco de Constantino'), '1b', '[Deshacer] la devuelve')

  /* ── 1c · Parada con entrada ── */
  console.log('1c. Parada con entrada')
  await store(`s.addReservation({ id: 'res-col', kind: 'entrada', refId: 'Coliseo, Foro y Palatino', name: 'Coliseo, Foro y Palatino', placeNames: ['Coliseo', 'Foro Romano y Palatino'], dateIso: '2026-10-19', dayNumber: null, time: '09:15' }); return true`)
  const fijada = await esperar(async () => (await paradas(3)).some((p) => p.n === 'Coliseo' && p.res === 'res-col'))
  debe(fijada, '1c', 'con su entrada reservada, el Coliseo queda fijado')
  await verDia(3)
  debe(await abrirMenu('Coliseo'), '1c', 'el «···» del Coliseo')
  const h2 = await leerHoja()
  const por = (titulo) => h2?.tarjetas.find((t) => t.titulo === titulo)
  debe(h2?.tarjetas.map((t) => t.titulo).join('|') === 'Cambiar parada|Mover a otro día|Mover antes|Mover después|Quitar parada', '1c', `salen TODAS las opciones, como en cualquier parada (${h2?.tarjetas.map((t) => t.titulo).join(', ')})`)
  debe(por('Cambiar parada')?.deshabilitada && /Tienes entrada para el Coliseo/.test(por('Cambiar parada')?.texto ?? ''), '1c', `«Cambiar parada» en gris con el porqué (${por('Cambiar parada')?.texto})`)
  debe(por('Mover a otro día')?.deshabilitada && /Tienes entrada para el lunes 19 a las 9:15/.test(por('Mover a otro día')?.texto ?? ''), '1c', `«Mover a otro día» en gris con el porqué (${por('Mover a otro día')?.texto})`)
  debe(por('Mover antes')?.deshabilitada && por('Mover después')?.deshabilitada && /tu entrada de las 9:15/.test(por('Mover antes')?.texto ?? ''), '1c', 'mover antes y después, en gris diciendo por qué')
  debe(por('Quitar parada')?.peligro && !por('Quitar parada').deshabilitada && /Sale de tu ruta\. Tienes su entrada: te preguntamos qué hacer con ella\./.test(por('Quitar parada').texto) && h2.tarjetas.at(-1).titulo === 'Quitar parada', '1c', `«Quitar parada», la última, en rojo, con su línea (${por('Quitar parada')?.texto})`)
  await cap('entrada_menu')

  // Cancelar no toca nada
  await ev("document.querySelector('[data-hoja-opciones] [data-peligro]').click(); true")
  await esp(900)
  const dlg = await ev("(() => { const d = document.querySelector('[data-hoja=\"quitar-con-entrada\"]'); return d ? d.textContent : null })()")
  debe(dlg && /¿Quitamos el Coliseo de tu ruta\?/.test(dlg) && /Tienes su entrada para el lunes 19 a las 9:15\./.test(dlg), '1c', `la confirmación: «${dlg}»`)
  debe(/Quitar solo de la ruta/.test(dlg ?? '') && /Quitar también la entrada/.test(dlg ?? '') && /Cancelar/.test(dlg ?? '') && !/"/.test(dlg ?? ''), '1c', 'con [Quitar solo de la ruta] [Quitar también la entrada] [Cancelar], sin comillas')
  const rojo = await ev("getComputedStyle(document.querySelector('[data-quitar-tambien]')).backgroundColor")
  debe(/rgb\(\s*1[5-9]\d|rgb\(\s*2\d\d/.test(rojo ?? '') || /accent|179/.test(rojo ?? ''), '1c', `«Quitar también la entrada» en rojo (${rojo})`)
  await cap('entrada_confirmacion')
  await ev("document.querySelector('[data-quitar-cancelar]').click(); true")
  await esp(700)
  debe((await paradas(3)).some((p) => p.n === 'Coliseo') && (await store("return s.reservations.length")) === 1, '1c', '[Cancelar] no cambia nada')

  // Quitar solo de la ruta
  await abrirMenu('Coliseo')
  await ev("document.querySelector('[data-hoja-opciones] [data-peligro]').click(); true")
  await esp(700)
  await ev("document.querySelector('[data-quitar-solo]').click(); true")
  await esp(1500)
  debe(!(await paradas(3)).some((p) => p.n === 'Coliseo'), '1c', 'sale de la ruta')
  const r1 = await store("return s.reservations.map((x) => ({ id: x.id, fuera: Boolean(x.fueraDeRuta), time: x.time }))")
  debe(r1.length === 1 && r1[0].id === 'res-col' && r1[0].fuera, '1c', `la entrada SE QUEDA en RESERVAS, marcada fuera de la ruta (${JSON.stringify(r1)})`)
  debe((await toast()) === 'Quitada de tu ruta: Coliseo', '1c', `y el aviso de abajo: «${await toast()}»`)
  await cap('entrada_solo_de_la_ruta')
  // RESERVAS
  await modo('bookings')
  await esp(1500)
  await ev("Array.from(document.querySelectorAll('span')).find((x) => (x.textContent || '').trim() === 'Entradas y Free Tour')?.click(); true")
  await esp(1500)
  const fila = await ev("(() => { const f = document.querySelector('[data-fuera-de-ruta]'); return f ? f.textContent : null })()")
  debe(fila && /Ya no está en tu ruta/.test(fila) && /Volver a ponerla en su día/.test(fila), '1c', `en RESERVAS: «Ya no está en tu ruta» y la opción de volver a ponerla (${fila})`)
  await ev("document.querySelector('[data-fuera-de-ruta]')?.scrollIntoView({ block: 'center' }); true")
  await esp(400)
  await cap('entrada_ya_no_esta_en_tu_ruta')
  // El motor no la vuelve a fijar ni a mover
  const eng = await ev(modulo('/src/lib/engineReservas.ts') + ".then((m) => m.reservasParaMotor([{ kind: 'entrada', time: '09:15', placeNames: ['Coliseo'], dateIso: '2026-10-19', dayNumber: null, fueraDeRuta: true }, { kind: 'entrada', time: '09:15', placeNames: ['Coliseo'], dateIso: '2026-10-19', dayNumber: null }]).length)")
  debe(eng === 1, '1c', 'una entrada fuera de la ruta no la manda al motor (no fija ni mueve ningún día)')
  // Volver a ponerla
  await ev("document.querySelector('[data-fuera-de-ruta] button').click(); true")
  const vuelve = await esperar(async () => (await paradas(3)).some((p) => p.n === 'Coliseo' && p.res === 'res-col'))
  if (!vuelve) console.log('  DEBUG', await toast(), JSON.stringify(await paradas(3)).slice(0, 300), JSON.stringify(await store('return s.reservations')))
  debe(vuelve, '1c', 'con [Volver a ponerla en su día], el Coliseo vuelve a su día, fijado con su entrada')
  const h9 = (await paradas(3)).find((p) => p.n === 'Coliseo')
  debe(h9?.h === '09:15', '1c', `y a su hora (${h9?.h})`)
  debe((await store("return s.reservations[0].fueraDeRuta")) === false, '1c', 'la marca «Ya no está en tu ruta» se va')
  debe(!(await ev("Boolean(document.querySelector('[data-fuera-de-ruta]'))")), '1c', 'y la fila desaparece de RESERVAS')

  // [Deshacer] tras «solo de la ruta»
  await verDia(3)
  await abrirMenu('Coliseo')
  await ev("document.querySelector('[data-hoja-opciones] [data-peligro]').click(); true")
  await esp(600)
  await ev("document.querySelector('[data-quitar-solo]').click(); true")
  await esp(1200)
  await flow('f.undo(); return true')
  await esp(800)
  debe((await paradas(3)).some((p) => p.n === 'Coliseo' && p.res === 'res-col') && (await store("return s.reservations[0].fueraDeRuta")) !== true, '1c', '[Deshacer] devuelve la parada fijada y la entrada como estaban')

  // Quitar también la entrada
  await abrirMenu('Coliseo')
  await ev("document.querySelector('[data-hoja-opciones] [data-peligro]').click(); true")
  await esp(600)
  await ev("document.querySelector('[data-quitar-tambien]').click(); true")
  await esp(1500)
  debe(!(await paradas(3)).some((p) => p.n === 'Coliseo') && (await store('return s.reservations.length')) === 0, '1c', '[Quitar también la entrada]: sale la parada y se borra la entrada')
  debe((await toast()) === 'Quitadas: Coliseo y su entrada', '1c', `con su aviso: «${await toast()}»`)
  await flow('f.undo(); return true')
  await esp(800)
  debe((await paradas(3)).some((p) => p.n === 'Coliseo' && p.res === 'res-col') && (await store('return s.reservations.length')) === 1, '1c', '[Deshacer] devuelve las dos cosas (parada y entrada)')
  // (El día 3 ya lo ha tocado la persona a mano: para el Free Tour, un viaje nuevo.)
  a.cerrar()
  a = await conViaje({ version: 'pago', alto: 844 })
  await esperar(async () => (await paradas(3)).length > 5)

  /* ── 1 · El Free Tour ── */
  console.log('1. El Free Tour')
  await modo('explore')
  await clicTexto('Entradas')
  await esp(2500)
  const sumar = await ev(`(() => {
    const tit = Array.from(document.querySelectorAll('span, p, h3, div')).find((x) => /^Free Tour/.test((x.textContent || '').trim()) && x.children.length === 0)
    const tarjeta = tit?.closest('div.relative.flex')
    const b = tarjeta && Array.from(tarjeta.querySelectorAll('button')).find((x) => /Añadir|\\+/.test(x.textContent || ''))
    if (!b) return false
    b.click(); return true
  })()`)
  await esp(1300)
  const hoja = await ev("(() => { const h = document.querySelector('[data-free-tour-dia-sheet]'); return h ? { texto: h.textContent, titulo: h.querySelector('h2')?.textContent } : null })()")
  debe(sumar && hoja?.titulo === '¿A qué día lo añadimos?', 'ap1', `EXPLORAR · el Free Tour abre «¿A qué día lo añadimos?» (${hoja?.titulo})`)
  debe(hoja && !/A qué hora|Mañana|Mediodía|Quitar el Free Tour/.test(hoja.texto), 'ap1', 'y nunca «¿A qué hora lo quieres?» ni «Quitar el Free Tour»')
  await cap('freetour_hoja')
  await ev("document.querySelectorAll('[data-free-tour-dia-sheet] [data-dia-id]')[1]?.click(); true")
  await esp(400)
  await ev("document.querySelector('[data-free-tour-anadir]').click(); true")
  await esperar(async () => !(await ev("Boolean(document.querySelector('[data-free-tour-dia-sheet]'))")), 90)
  const conFt = await store('return r.days.filter((d) => !d.isReturnLeg).map((d) => d.curatedId)')
  debe(conFt.join() === 'D4,D3,D1-FT', 'ap1', `Free Tour añadido eligiendo el día (${conFt.join()})`)
  // Quitar el Free Tour: como cualquier parada
  await verDia(2)
  debe(await abrirMenu('Free Tour'), 'ap1', 'el Free Tour tiene su «···» como cualquier parada')
  const h3 = await leerHoja()
  const q3 = h3?.tarjetas.find((t) => t.titulo === 'Quitar parada')
  debe(q3 && q3.peligro && h3.tarjetas.at(-1).titulo === 'Quitar parada', 'ap1', `«Quitar parada», la última, en rojo (${h3?.tarjetas.map((t) => t.titulo).join(', ')})`)
  await cap('freetour_menu')
  await ev("document.querySelector('[data-hoja-opciones] [data-peligro]').click(); true")
  const sinFt = await esperar(async () => (await store('return r.days.filter((d) => !d.isReturnLeg).map((d) => d.curatedId).join()')) === 'D2,D4,D1', 90)
  debe(sinFt, 'ap1', 'se quita sin preguntar y los días vuelven a los de siempre')
  debe(/Free Tour quitado de tu ruta/.test((await toast()) ?? ''), 'ap1', `con su aviso: «${await toast()}»`)
  await flow('f.undo(); return true')
  await esp(800)
  debe((await store('return r.days.filter((d) => !d.isReturnLeg).map((d) => d.curatedId).join()')) === 'D4,D3,D1-FT', 'ap1', '[Deshacer] lo devuelve')

  // Free Tour con su reserva: misma confirmación, y la reserva se queda
  const ftInfo = await store("const d = r.days.find((x) => x.stops.some((y) => y.isFreeTour)); const p = d.stops.find((y) => y.isFreeTour); return { dia: d.dayNumber, nombre: p.name, hora: p.time, fecha: s.route.answers.dateRange.start }")
  const fechaFt = new Date(`${ftInfo.fecha}T12:00:00Z`)
  fechaFt.setUTCDate(fechaFt.getUTCDate() + ftInfo.dia - 1)
  await store(`s.addReservation({ id: 'res-ft', kind: 'entrada', refId: 'Free Tour', name: ${JSON.stringify(ftInfo.nombre)}, placeNames: [${JSON.stringify(ftInfo.nombre)}], dateIso: '${fechaFt.toISOString().slice(0, 10)}', dayNumber: null, time: '${ftInfo.hora}' }); return true`)
  await esp(1500)
  await verDia(ftInfo.dia)
  await abrirMenu('Free Tour')
  const h4 = await leerHoja()
  debe(h4?.tarjetas.length === 5 && h4.tarjetas.find((t) => t.titulo === 'Cambiar parada')?.deshabilitada, 'ap1', 'el Free Tour reservado: todas las opciones, las imposibles en gris')
  await ev("document.querySelector('[data-hoja-opciones] [data-peligro]').click(); true")
  await esp(800)
  const dlg2 = await ev("(() => { const d = document.querySelector('[data-hoja=\"quitar-con-entrada\"]'); return d ? d.textContent : null })()")
  debe(dlg2 && /¿Quitamos el Free Tour de tu ruta\?/.test(dlg2) && /Quitar solo de la ruta/.test(dlg2), '1c', `Free Tour con reserva: «${dlg2}»`)
  await cap('freetour_confirmacion')
  await ev("document.querySelector('[data-quitar-solo]').click(); true")
  await esperar(async () => (await store('return r.days.filter((d) => !d.isReturnLeg).map((d) => d.curatedId).join()')) === 'D2,D4,D1', 90)
  debe((await store("return s.reservations.some((x) => x.id === 'res-ft' && x.fueraDeRuta)")) === true, '1c', 'Free Tour «solo de la ruta»: la reserva se queda, fuera de la ruta')
  await flow('f.undo(); return true')
  await esp(800)
  await store("s.removeReservation('res-ft'); return true")

  /* ── 1b · Las confirmaciones que se quedan, en la app ── */
  console.log('1b. Eliminar un día')
  await verDia(1)
  const abreDia = await ev(`(() => { const b = document.querySelector('[data-menu-hoja="dia"]') ?? Array.from(document.querySelectorAll('button')).find((x) => /Opciones del día/.test(x.getAttribute('aria-label') ?? '')); if (!b) return false; b.scrollIntoView({ block: 'center' }); b.click(); return true })()`)
  await esp(900)
  if (abreDia) {
    const quitaDia = await ev("(() => { const t = Array.from(document.querySelectorAll('[data-opcion-hoja]')).find((x) => /Eliminar día/.test(x.textContent)); if (!t) return false; t.click(); return true })()")
    await esp(900)
    if (quitaDia) {
      const d3 = await ev("(() => { const d = document.querySelector('[data-hoja=\"confirmar\"]'); return d ? { texto: d.textContent, rojo: getComputedStyle(d.querySelector('[data-confirmar-si]')).backgroundColor } : null })()")
      debe(d3 && /¿Quitamos .* de tu viaje\?/.test(d3.texto) && /Sí, quitar/.test(d3.texto) && /Cancelar/.test(d3.texto), '1b', `eliminar un día: «${d3?.texto}»`)
      await cap('eliminar_dia')
      await ev("Array.from(document.querySelectorAll('[data-hoja=\"confirmar\"] button')).find((b) => /Cancelar/.test(b.textContent))?.click(); true")
    } else debe(false, '1b', 'no encuentro «Eliminar día» en el menú del día')
  } else debe(false, '1b', 'no encuentro el menú del día en RUTA')
} catch (e) {
  await a.captura(foto('error')).catch(() => undefined)
  debe(false, 'error', 'la prueba se paró: ' + String(e.message).split('\n')[0])
} finally {
  a.cerrar()
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
