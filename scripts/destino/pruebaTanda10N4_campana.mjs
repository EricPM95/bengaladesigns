// Tanda 10N4 §2 · «Gestionar los avisos» (la campana, a pantalla completa, como Design `Piezas/Avisos Gestion`).
//   APP_URL=http://localhost:5182 API_URL=http://localhost:8852 node scripts/destino/pruebaTanda10N4_campana.mjs
// Con el viaje de pruebas (window.__rutaPrueba) y avisos de ejemplo puestos en los almacenes (window.__avisos y window.__notices). Capturas de la app en docs/dias/capturas_jutrip/10n4_campana_*.jpg
// y, al lado, la pieza de Design (10n4_design_avisos_gestion.jpg).
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const sacarDesign = process.env.SIN_DESIGN !== '1'

/* ───────────── 1. Lo que se ve en el código ───────────── */
{
  const hoja = sinComentarios(leer('src/components/layout/NoticesSheet.tsx'))
  debe(!/Fecha especial · |' · leído'|· leído|\{item\.read && ' · leído'\}/.test(hoja), 'etiqueta', 'ya no existe la etiqueta «· Leído»')
  debe(/OpcionTarjeta/.test(hoja) && /Marcar como leído/.test(hoja) && /Marcar como no leído/.test(hoja) && /Eliminar/.test(hoja), 'hoja', 'la hoja usa las tarjetas de HojaOpciones (Marcar como leído / no leído / Eliminar)')
  debe(!/Marcar todos como leídos/.test(hoja), 'hoja', 'fuera «Marcar todos como leídos»')
  debe(!/if \(sinLeerDeLaCuenta > 0\) void marcarLeidosDeLaCuenta\(null\)/.test(hoja), 'abrir', 'cerrar la campana ya no marca todo como leído')
  debe(/delete.*Deshacer|Deshacer/.test(hoja), 'deshacer', 'lleva [Deshacer]')
  debe(!/#E9C77A.*Marcar leído/.test(hoja), 'barra', 'no hay barra de dos botones («Marcar leído»)')
  const mig = leer('supabase/migrations/0046_avisos_gestion.sql')
  debe(/oculto_en/.test(mig) && /marcar_avisos_no_leidos/.test(mig) && /ocultar_avisos/.test(mig), 'migracion', 'la 0046 existe: oculto_en, marcar_avisos_no_leidos y ocultar_avisos')
  const srv = leer('server/avisos.js')
  debe(/\/api\/avisos\/no-leidos/.test(srv) && /\/api\/avisos\/ocultar/.test(srv), 'servidor', 'rutas /api/avisos/no-leidos y /api/avisos/ocultar')
}

/* ───────────── 2. La campana en la app ───────────── */
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
const ev = (js) => a.evaluar(js)
for (let i = 0; i < 120 && !(await ev("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
for (let i = 0; i < 60 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
await ev('window.__rutaPrueba().then(() => true)')
for (let i = 0; i < 90 && !(await ev("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
await a.esp(3000)
for (let i = 0; i < 6; i++) {
  const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim()) && !x.closest('[data-campana]')); if (!b) return false; b.click(); return true })()")
  if (!h) break
  await a.esp(700)
}

const ahora = Date.now()
const hace = (min) => new Date(ahora - min * 60000).toISOString()
const AVISOS = [
  { id: 'c-perm', tipo: 'permiso', texto: 'Eric te ha dado permiso para editar el viaje a Roma.', quien: 'Eric', creado_en: hace(5), leido: false, payload: {}, etiqueta: null },
  { id: 'c-trevi', tipo: 'viaje_cambiado', texto: 'Eric ha añadido la Fontana di Trevi al sábado 14.', quien: 'Eric', creado_en: hace(9), leido: false, payload: { trip_id: 'x' }, etiqueta: null },
  { id: 'c-gasto', tipo: 'unido', texto: 'Ana ha añadido un gasto: Cena en Trastevere · 84 €.', quien: 'Ana', creado_en: hace(13), leido: false, payload: {}, etiqueta: null },
  { id: 'c-viejo', tipo: 'unido', texto: 'Laura se ha unido a tu viaje.', quien: 'Laura', creado_en: hace(300), leido: true, payload: {}, etiqueta: null },
]
const poner = () =>
  ev(`(() => {
    window.__avisos.getState().poner(${JSON.stringify(AVISOS)})
    window.__avisos.setState({ ocultos: [], noLeidos: [] })
    window.__notices.setState({ readIds: [], hiddenIds: [], unreadIds: [] })
    const n = window.__notices.getState()
    n.push({ id: 'p-info', kind: 'info', title: 'Sobre tu ruta', text: 'En invierno Roma madruga y cierra pronto. Hemos ajustado tu ruta para aprovechar cada hora de luz.' })
    n.push({ id: 'p-aviso', kind: 'warning', title: 'Revisa tu vuelta', text: 'Has cambiado los días del viaje.' })
    return true
  })()`)
await poner()
await a.esp(500)

const estadoCampana = () =>
  ev(`(() => {
    const c = document.querySelector('[data-campana]')
    if (!c) return null
    const filas = Array.from(c.querySelectorAll('[data-fila-aviso]'))
    const hoja = c.querySelector('[data-campana-hoja]')
    const lista = c.querySelector('[data-campana-lista]')
    const cr = c.getBoundingClientRect()
    return {
      llena: Math.round(cr.width) === innerWidth && Math.round(cr.height) === innerHeight,
      ojo: c.querySelector('p, span')?.textContent,
      encabezado: c.querySelector('#notices-heading')?.textContent,
      eyebrow: c.innerText.split('\\n')[0],
      textoTodo: c.innerText,
      filas: filas.map((f) => ({ clave: f.getAttribute('data-fila-aviso'), nuevo: f.getAttribute('data-sin-leer') === '1', elegido: f.getAttribute('data-elegido') === '1', circulo: Boolean(f.querySelector('[data-aviso-circulo]')), texto: f.innerText.replace(/\\s+/g, ' ').slice(0, 120), punto: Boolean(f.querySelector('[data-punto-aviso]')), peso: getComputedStyle(f.querySelector('span[style*="font"]') ?? f).fontWeight })),
      seleccionar: Boolean(c.querySelector('[data-campana-seleccionar]')),
      cancelar: Boolean(c.querySelector('[data-campana-cancelar]')),
      cuenta: c.querySelector('[data-campana-cuenta]')?.textContent ?? null,
      todos: c.querySelector('[data-campana-todos]')?.textContent ?? null,
      hoja: hoja ? { estado: hoja.getAttribute('data-campana-hoja'), top: Math.round(hoja.getBoundingClientRect().top), tarjetas: Array.from(hoja.querySelectorAll('[data-opcion-hoja]')).map((t) => ({ id: t.getAttribute('data-opcion-hoja'), titulo: t.querySelector('[data-opcion-titulo]')?.textContent, linea: t.querySelector('[data-opcion-linea]')?.textContent, peligro: t.getAttribute('data-peligro') === '1' })) } : null,
      ultimaFilaBottom: filas.length ? Math.round(lista.scrollHeight - 0) : 0,
      listaPadAbajo: parseFloat(getComputedStyle(lista).paddingBottom),
      toast: c.querySelector('[data-campana-toast]')?.innerText.replace(/\\s+/g, ' ') ?? null,
      botonAvisos: document.querySelector('button[aria-label^="Avisos"]')?.getAttribute('aria-label'),
    }
  })()`)
const clic = (sel, texto) =>
  ev(`(() => { const b = Array.from(document.querySelectorAll(${JSON.stringify(sel)})).find((x) => ${texto ? `(x.textContent || '').trim() === ${JSON.stringify(texto)}` : 'true'}); if (!b) return false; b.click(); return true })()`)
const clicFila = (clave) => ev(`(() => { const f = document.querySelector('[data-campana] [data-fila-aviso="${clave}"]'); if (!f) return false; f.click(); return true })()`)
const abrir = async () => {
  await clic('button[aria-label^="Avisos"]')
  await a.esp(700)
}

// 01 · Normal
debe((await estadoCampana()) === null, 'abrir', 'la campana empieza cerrada')
const antes = await ev(`document.querySelector('button[aria-label^="Avisos"]')?.getAttribute('aria-label')`)
await abrir()
let c = await estadoCampana()
debe(c?.llena, 'pantalla', 'la campana ocupa la pantalla entera')
debe(c?.eyebrow === 'TUS AVISOS' && c?.encabezado === 'Avisos', 'cabecera', `arriba «TUS AVISOS» y «Avisos» (${c?.eyebrow} / ${c?.encabezado})`)
debe(c?.seleccionar && !c?.cancelar, 'seleccionar', 'sale [Seleccionar]')
debe(c?.filas.length === 8, 'filas', `8 avisos (4 de la cuenta, 2 de la app y 2 de fechas del viaje): ${c?.filas.length}`)
debe(!/leído/i.test(c?.textoTodo.replace(/Marcar como leído/g, '') ?? ''), 'etiqueta', 'ninguna etiqueta «Leído» en la lista')
debe(c?.filas.filter((f) => f.nuevo).length === 5 && c.filas.filter((f) => f.punto).length === 5, 'nuevos', 'los nuevos llevan el puntito dorado (5)')
debe(c?.filas.some((f) => /^c:c-viejo/.test(f.clave) && !f.nuevo && !f.punto), 'leidos', 'el leído, sin puntito')
debe(c?.hoja?.estado === 'oculta', 'hoja', 'la hoja no se ve en la vista normal')
await a.captura(path.join(SALIDA, '10n4_campana_01_normal.jpg'))
// Abrir la campana NO marca nada como leído.
const tras = await ev(`document.querySelector('button[aria-label^="Avisos"]')?.getAttribute('aria-label')`)
debe(antes === tras || /nuevos/.test(tras ?? ''), 'abrir', `abrirla no marca todo como leído (${tras})`)
const sinLeerCuenta = await ev('window.__avisos.getState().avisos.filter((x) => !x.leido).length')
debe(sinLeerCuenta === 3, 'abrir', `tras abrir la campana, siguen 3 sin leer en la cuenta (${sinLeerCuenta})`)

// Tocar un aviso lo abre y lo marca leído
await clicFila('c:c-gasto')
await a.esp(500)
c = await estadoCampana()
const estadoGasto = await ev(`window.__avisos.getState().avisos.find((x) => x.id === 'c-gasto').leido`)
debe(estadoGasto === true, 'tocar', 'tocar un aviso de la cuenta lo marca como leído')
// Tocar un aviso de la app (info)
await clicFila('a:p-info')
await a.esp(300)
debe((await ev(`window.__notices.getState().readIds.includes('p-info')`)) === true, 'tocar', 'tocar un aviso de la app lo marca como leído')
// El aviso con botón de arreglar (warning) no se da por leído al tocarlo
await clicFila('a:p-aviso')
await a.esp(200)
c = await estadoCampana()
debe(c?.filas.find((f) => f.clave === 'a:p-aviso')?.nuevo === true, 'tocar', 'un aviso del viaje (no se marca como leído) sigue nuevo')

// Los que traen botones dentro los siguen llevando (gasto pendiente y entrada)
await ev(`(() => {
  const s = window.__avisos.getState()
  s.poner([...s.avisos,
    { id: 'c-pend', tipo: 'gasto_pendiente', texto: 'Ana quiere añadir al presupuesto', quien: 'Ana', creado_en: new Date().toISOString(), leido: false, payload: { gasto_id: 'g1', nombre: 'Cena en Trastevere', precio: 84, pago: 'Ana', gasto_estado: 'pendiente' }, etiqueta: null },
    { id: 'c-ent', tipo: 'reserva_grupo', texto: 'Eric ha reservado el Coliseo para ti: jueves 26, 8:00.', quien: 'Eric', creado_en: new Date().toISOString(), leido: false, payload: { caso: 'no_cuadra', trip_id: 'x', reserva_id: 'r1', sitio: 'Coliseo', dia_reserva: 'viernes 27', dia_ruta: 'jueves 26' }, etiqueta: null }])
  return true
})()`)
await a.esp(600)
const botones = await ev(`Array.from(document.querySelectorAll('[data-campana] button')).map((b) => (b.textContent || '').trim()).filter(Boolean)`)
debe(botones.includes('Aceptar') && botones.includes('Rechazar'), 'botones', `el gasto sigue llevando [Rechazar] [Aceptar] (${botones.join(' | ')})`)
debe(botones.includes('Ver mi reserva') || botones.includes('Proponer el cambio') || botones.some((b) => /Proponer|reserva/i.test(b)), 'botones', 'la entrada que no cuadra sigue llevando sus botones')
await a.captura(path.join(SALIDA, '10n4_campana_01b_botones.jpg'))
// Fuera lo añadido para que lo siguiente sea limpio
await ev(`(() => { window.__avisos.getState().poner(${JSON.stringify(AVISOS)}); return true })()`)
await poner()
await a.esp(500)

// 02 · Seleccionar
await clic('[data-campana-seleccionar]')
await a.esp(400)
c = await estadoCampana()
debe(c?.cancelar && !c?.seleccionar, 'seleccionar', '[Seleccionar] pasa a [Cancelar]')
debe(c?.cuenta === 'Elige uno o más avisos' && c?.todos === 'Seleccionar todos', 'seleccionar', `arriba «Elige uno o más avisos» y «Seleccionar todos» (${c?.cuenta} / ${c?.todos})`)
const conCirculo = c?.filas.filter((f) => f.circulo).length
debe(conCirculo === 7, 'circulos', `circulito en los que se pueden elegir (7 de 8; el aviso del viaje no): ${conCirculo}`)
debe(!c?.filas.find((f) => f.clave === 'a:p-aviso')?.circulo, 'circulos', 'el aviso del viaje (se arregla, no se elimina) no lleva circulito')
debe(c?.hoja?.estado === 'oculta', 'hoja', 'sin nada elegido, la hoja no se ve')
await a.captura(path.join(SALIDA, '10n4_campana_02a_seleccionar_vacio.jpg'))
await clicFila('c:c-perm')
await a.esp(700)
c = await estadoCampana()
debe(c?.cuenta === '1 seleccionado', 'seleccionar', `«1 seleccionado» (${c?.cuenta})`)
debe(c?.hoja?.estado === 'visible' && c.hoja.top > 400 && c.hoja.top < 844, 'hoja', `al elegir el primero sube la hoja desde abajo (arriba en ${c?.hoja?.top} px)`)
debe(c?.hoja?.tarjetas.length === 2, 'hoja', 'dos tarjetas')
debe(c?.hoja?.tarjetas[0]?.titulo === 'Marcar como leído' && c.hoja.tarjetas[0].linea === 'Dejan de salir como nuevos', 'hoja', 'la primera: «Marcar como leído» · «Dejan de salir como nuevos»')
debe(c?.hoja?.tarjetas[1]?.titulo === 'Eliminar' && c.hoja.tarjetas[1].peligro && c.hoja.tarjetas[1].linea === 'Se quitan de tu campana. Puedes deshacerlo', 'hoja', 'la última: «Eliminar», en rojo, con su línea')
debe(c?.filas.find((f) => f.clave === 'c:c-perm')?.elegido, 'seleccionar', 'el elegido se marca (fondo dorado claro y ✓)')
const fondoElegido = await ev(`(() => { const e = document.querySelector('[data-campana] [data-fila-aviso="c:c-perm"]'); return e ? getComputedStyle(e).backgroundColor : null })()`)
debe(fondoElegido === 'rgb(251, 243, 226)', 'colores', `fondo dorado claro #FBF3E2 al elegir (${fondoElegido})`)
// La hoja no tapa la lista: la lista deja su hueco abajo
debe(c?.listaPadAbajo >= 224, 'hueco', `la lista deja hueco abajo para la hoja (${c?.listaPadAbajo} px)`)
await clicFila('c:c-gasto')
await a.esp(300)
await a.captura(path.join(SALIDA, '10n4_campana_02_seleccionando.jpg'))
c = await estadoCampana()
debe(c?.cuenta === '2 seleccionados', 'seleccionar', `«2 seleccionados» (${c?.cuenta})`)
// Seleccionar todos / Quitar selección
await clic('[data-campana-todos]')
await a.esp(300)
c = await estadoCampana()
debe(c?.filas.filter((f) => f.elegido).length === 7 && c?.todos === 'Quitar selección', 'todos', `«Seleccionar todos» elige los 7 elegibles y pasa a «Quitar selección» (${c?.filas.filter((f) => f.elegido).length})`)
await clic('[data-campana-todos]')
await a.esp(700)
c = await estadoCampana()
debe(c?.hoja?.estado === 'oculta' && c.cuenta === 'Elige uno o más avisos', 'hoja', 'al no quedar ninguno, la hoja baja')
// Una vez más: solo leídos → «Marcar como no leído»
await clicFila('c:c-viejo')
await a.esp(500)
c = await estadoCampana()
debe(c?.hoja?.tarjetas[0]?.titulo === 'Marcar como no leído' && /Vuelven a salir como nuevos/.test(c.hoja.tarjetas[0].linea ?? ''), 'no-leido', 'si todos los elegidos ya están leídos, «Marcar como no leído»')
await a.captura(path.join(SALIDA, '10n4_campana_02c_no_leido.jpg'))
await clic('[data-opcion-hoja="no-leido"]')
await a.esp(500)
c = await estadoCampana()
debe(c?.filas.find((f) => f.clave === 'c:c-viejo')?.nuevo === true && !c.cancelar, 'no-leido', 'lo marca como no leído y vuelve a la campana normal')
// Marcar como leído
await clic('[data-campana-seleccionar]')
await clicFila('c:c-perm')
await clicFila('a:p-info')
await a.esp(500)
await clic('[data-opcion-hoja="leido"]')
await a.esp(500)
c = await estadoCampana()
debe(c?.filas.find((f) => f.clave === 'c:c-perm')?.nuevo === false && c.filas.find((f) => f.clave === 'a:p-info')?.nuevo === false, 'leido', '«Marcar como leído» deja los elegidos leídos (la cuenta y la app)')
debe(!c?.cancelar && c?.hoja?.estado === 'oculta', 'leido', 'y la campana vuelve a la normal, con la hoja abajo')

// Cancelar baja la hoja
await clic('[data-campana-seleccionar]')
await clicFila('c:c-trevi')
await a.esp(600)
debe((await estadoCampana())?.hoja?.estado === 'visible', 'hoja', 'sube otra vez')
await clic('[data-campana-cancelar]')
await a.esp(600)
c = await estadoCampana()
debe(c?.hoja?.estado === 'oculta' && c.seleccionar && c.filas.every((f) => !f.elegido), 'cancelar', '[Cancelar] baja la hoja y deja sin elegir')

// 03 · Eliminar
await clic('[data-campana-seleccionar]')
await clicFila('c:c-trevi')
await clicFila('a:p-info')
await a.esp(500)
await clic('[data-opcion-hoja="eliminar"]')
await a.esp(500)
c = await estadoCampana()
debe(c?.toast && /2 avisos eliminados/.test(c.toast) && /Deshacer/.test(c.toast), 'eliminar', `sale la franja «2 avisos eliminados» con [Deshacer] (${c?.toast})`)
debe(!c?.filas.some((f) => f.clave === 'c:c-trevi' || f.clave === 'a:p-info'), 'eliminar', 'los 2 ya no están en la campana')
debe(c?.filas.length === 6 && c.seleccionar && !c.cancelar, 'eliminar', 'la campana vuelve a la normal, sin preguntar nada más')
await a.captura(path.join(SALIDA, '10n4_campana_03_eliminados.jpg'))
await clic('[data-campana-deshacer]')
await a.esp(600)
c = await estadoCampana()
debe(c?.filas.length === 8 && !c.toast, 'deshacer', '[Deshacer] devuelve los 2')
// Eliminar otra vez y esperar a que se vaya la franja
await clic('[data-campana-seleccionar]')
await clicFila('c:c-viejo')
await a.esp(300)
await clic('[data-opcion-hoja="eliminar"]')
await a.esp(500)
c = await estadoCampana()
debe(/1 aviso eliminado/.test(c?.toast ?? ''), 'eliminar', '«1 aviso eliminado» en singular')
await a.esp(6800)
c = await estadoCampana()
debe(c?.toast === null, 'eliminar', 'la franja se va sola a los segundos')
// Lo eliminado se recuerda al cerrar y volver a abrir
await clic('button[aria-label="Cerrar"]')
await a.esp(500)
debe((await estadoCampana()) === null, 'cerrar', 'la campana se cierra con la ✕')
await abrir()
c = await estadoCampana()
debe(c?.filas.length === 7 && !c.filas.some((f) => f.clave === 'c:c-viejo'), 'eliminar', 'lo eliminado no vuelve al reabrir')
// Vaciar del todo
await ev(`(() => { window.__avisos.getState().poner([]); window.__notices.setState({ pushed: [] }); const r = window.__ruta.getState().route; window.__ruta.setState({ route: { ...r, dateNotices: [], contextBanner: null } }); return true })()`)
await a.esp(500)
c = await estadoCampana()
debe(/No tienes avisos/.test(c?.textoTodo ?? ''), 'vacia', 'sin avisos: «No tienes avisos»')
await clic('button[aria-label="Cerrar"]')
await a.esp(300)
a.cerrar()

/* ───────────── 3. Al lado de Design ───────────── */
if (sacarDesign) {
  try {
    await capturarDesign('Piezas/Avisos Gestion.dc.html', path.join(SALIDA, '10n4_design_avisos_gestion.jpg'), { ancho: 1500, alto: 900 })
  } catch (e) {
    console.log('(no se pudo capturar Design:', e.message, ')')
  }
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
