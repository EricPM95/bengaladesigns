// La prueba de la Tanda 10N, parte A (cabecera, modo sin pase, hojas de los menús de DÍAS, «Cambiar hora» fuera y el estilo de elegir).
//   APP_URL=http://localhost:5181 API_URL=http://localhost:8851 node scripts/destino/pruebaTanda10N_cabecera.mjs
// Abre un Chrome sin ventana (scripts/destino/_enLaApp.mjs), a tamaño de móvil, y guarda las capturas en docs/dias/capturas_jutrip/10n_cabecera_*.jpg.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const cap = (a, nombre) => a.captura(path.join(SALIDA, `10n_cabecera_${nombre}.jpg`))

/* ───────────── 1. El código ───────────── */
{
  const hdr = leer('src/components/layout/Header.tsx')
  debe(/LogoPequeno/.test(hdr) && !/subtituloDelViaje/.test(hdr) && !/Viaje de \$\{/.test(hdr), 'cabecera', 'la cabecera lleva el logo y ya no el destino con fechas y personas')
  debe(!/'admin_sin_pase'/.test(leer('supabase/migrations/0032_empezar_de_cero.sql').replace(/--.*$/gm, '')), 'sin_pase', 'la migración 0032 ya no borra admin_sin_pase')
  debe(/admin_sin_pase/.test(leer('server/logros/reiniciar.js')), 'sin_pase', 'el servidor devuelve la fila «sin pase» a como estaba tras [Empezar de cero]')
  const stop = leer('src/components/route/dayDetail/StopMenu.tsx').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  debe(!/Cambiar hora|Poner hora|Quitar hora|TimeField|updateStopTime/.test(stop), 'cambiar_hora', '«Cambiar hora» ya no está en el menú de la parada')
  debe(/HojaDelMenu/.test(stop) && !/absolute right-0/.test(stop), 'hojas', 'el menú de la parada sale como hoja')
  debe(!/absolute right-0/.test(leer('src/components/route/dayDetail/DayMenu.tsx')), 'hojas', 'el menú del día sale como hoja')
  debe(/<Hoja /.test(leer('src/components/route/ConfirmDialog.tsx')), 'hojas', 'la confirmación sale como hoja')
  const el = leer('src/components/route/placeExplorer/PlaceExplorerScreen.tsx')
  debe(/InterruptorElegir/.test(el), 'elegir', '[Recomendados] [Cerca de ti] usan el estilo compartido')
}

/* ───────────── 2. La app ───────────── */
const preparar = async (a) => {
  for (let intento = 0; intento < 3; intento++) {
    for (let i = 0; i < 120 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
    try {
      await a.evaluar('window.__rutaPrueba().then(() => true)')
      break
    } catch (e) {
      if (intento === 2) throw e
      await a.evaluar('location.reload()').catch(() => undefined)
      await a.esp(5000)
    }
  }
  for (let i = 0; i < 80 && !(await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(500)
  await a.esp(2500)
}
const cerrarAvisos = async (a) => {
  for (let i = 0; i < 8; i++) {
    const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await a.esp(600)
  }
}
const modo = async (a, m) => {
  await a.evaluar(`import('/src/store/useRouteStore.ts').then((s) => { s.useRouteStore.getState().setMode('${m}'); return true })`)
  await a.esp(2200)
  await cerrarAvisos(a)
}

{
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
  await preparar(a)
  await cerrarAvisos(a)

  // La cabecera, en todas las pestañas.
  for (const [m, nombre] of [['route', 'ruta'], ['days', 'dias'], ['bookings', 'reservas'], ['explore', 'explorar'], ['today', 'hoy']]) {
    await modo(a, m)
    const h = await a.evaluar(`(() => { const h = document.querySelector('header'); if (!h) return null; return { logo: Boolean(h.querySelector('[data-cabecera-logo] svg')), cartera: Boolean(h.querySelector('[aria-label*="resupuesto"],[data-boton-cartera]')), campana: Boolean(h.querySelector('[aria-label^="Avisos"]')), perfil: Boolean(h.querySelector('[data-boton-perfil]')), texto: h.innerText.replace(/\\s+/g, ' ') } })()`)
    debe(h?.logo, `cabecera ${nombre}`, `en ${nombre} sale el logo`)
    debe(h?.campana && h?.perfil, `cabecera ${nombre}`, `en ${nombre} salen la campana y el perfil`)
    debe(h?.cartera, `cabecera ${nombre}`, `en ${nombre} sale la cartera`)
    debe(!/personas?\b/.test(h?.texto ?? 'personas') && !/oct|nov|dic/i.test(h?.texto ?? 'oct'), `cabecera ${nombre}`, `en ${nombre} ya no sale «Roma / fechas · personas» (${h?.texto})`)
    if (m === 'route') await cap(a, 'ruta')
    if (m === 'today') await cap(a, 'hoy')
  }

  // La tarjeta de HOY antes del viaje: la misma lista que la película.
  // (Antes del viaje: se simula que hoy es el 10 de octubre.)
  await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.setState({ dev_simulated_today_iso: '2026-10-10' }); return true })")
  await modo(a, 'today')
  await a.esp(1200)
  await cap(a, 'hoy_antes')
  const hoy = await a.evaluar(`(async () => { const l = await import('/src/lib/listaAjustada.ts'); const h = await import('/src/lib/listaDeHoy.ts'); const enPantalla = Array.from(document.querySelectorAll('[data-hoy-te-dara]')).map((e) => e.getAttribute('data-hoy-te-dara')); return { enPantalla, esperado: h.filasDeHoy().map((f) => f.titulo), pelicula: l.LISTA_DEL_PASE.flatMap((g) => g.items.map((i) => i.titulo)), texto: document.body.innerText } })()`)
  debe(hoy.enPantalla.length > 0 && hoy.enPantalla.join('|') === hoy.esperado.join('|'), 'hoy_lista', `la tarjeta de HOY sale de filasDeHoy (${hoy.enPantalla.join(', ')})`)
  debe(hoy.esperado.every((t) => hoy.pelicula.includes(t)), 'hoy_lista', 'todas las filas de HOY están en la lista del final de la película')
  debe(!/Tu día, paso a paso|Visto, No me da tiempo y Más visitas|Escuchar su historia/.test(hoy.texto), 'hoy_lista', 'ya no salen los nombres viejos')
  const v = leer('src/components/route/hoy/v2/HoyAntesV2.tsx')
  debe(/filasDeHoy/.test(v) && !/VISTA_PREVIA/.test(v), 'hoy_lista', 'HoyAntesV2 usa la lista compartida')

  await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.setState({ dev_simulated_today_iso: null }); return true })")
  // La pastilla del pase en RUTA y HOY dicen lo mismo.
  await modo(a, 'route')
  const pastilla = () => a.evaluar("document.querySelector('[data-pastilla-pase]')?.getAttribute('data-pastilla-pase') ?? null")
  debe((await pastilla()) === 'con', 'pase', 'con pase (modo pago) la pastilla dice «con»')
  await a.evaluar("window.__pruebaDelPase = { cobro: true, conPase: false, puede: false, pruebaGastada: true }; true")
  await a.evaluar("import('/src/store/useRouteStore.ts').then((s) => { s.useRouteStore.getState().setMode('days'); return true })")
  await a.esp(600)
  await modo(a, 'route')
  debe((await pastilla()) === 'sin', 'pase', 'si el servidor dice cobro y sin pase, la pastilla dice «sin» (lo mismo que HOY)')
  await cap(a, 'pastilla_sin_pase')
  await a.evaluar("window.__pruebaDelPase = { cobro: true, conPase: true, puede: true, pruebaGastada: false }; true")
  await modo(a, 'days')
  await modo(a, 'route')
  debe((await pastilla()) === 'con', 'pase', 'con el pase del servidor, «con»')
  await a.evaluar("delete window.__pruebaDelPase; true")
  await a.evaluar("import('/src/store/useSinPasePrueba.ts').then((m) => { m.useSinPasePrueba.getState().poner(true); return true })")
  await modo(a, 'days')
  await modo(a, 'route')
  debe((await pastilla()) === 'sin', 'pase', 'con «Verme como viajero sin pase» encendido, la pastilla dice «sin»')
  await a.evaluar("import('/src/store/useSinPasePrueba.ts').then((m) => { m.useSinPasePrueba.getState().poner(false); return true })")

  // DÍAS: los menús como hojas.
  await modo(a, 'days')
  await a.esp(1500)
  // Un día que no esté fijado (el de llegada lo está): su «Eliminar día» no sale en gris.
  const nDias = await a.evaluar("document.querySelectorAll('[data-menu-hoja=\"dia\"]').length")
  let dia = false
  for (let i = 0; i < nDias && !dia; i++) {
    await a.evaluar(`document.querySelectorAll('[data-menu-hoja="dia"]')[${i}].click(); true`)
    await a.esp(700)
    dia = await a.evaluar("Array.from(document.querySelectorAll('[data-opcion-hoja]')).some((b) => /Eliminar día/.test(b.textContent) && !b.disabled)")
    if (!dia) await a.evaluar("document.querySelector('[data-hoja=\"menu\"] [aria-label=\"Cerrar\"]')?.click(); true")
  }
  debe(dia, 'hojas', 'un día tiene su «···» con «Eliminar día»')
  await a.esp(900)
  const hojaDia = await a.evaluar(`(() => { const h = document.querySelector('[data-hoja="menu"]'); if (!h) return null; const p = h.querySelector('.hoja-panel'); return { tirador: Boolean(h.querySelector('[data-hoja-tirador]')), cerrar: Boolean(h.querySelector('[aria-label="Cerrar"]')), alto: p.getBoundingClientRect().height, ventana: window.innerHeight, texto: h.innerText.replace(/\\s+/g, ' ') } })()`)
  debe(hojaDia?.tirador && hojaDia?.cerrar, 'hojas', 'el menú del día lleva tirador y ✕')
  debe(hojaDia && hojaDia.alto < hojaDia.ventana * 0.5, 'hojas', `el menú del día es una hoja baja (${Math.round(hojaDia?.alto)} de ${hojaDia?.ventana} px)`)
  debe(/Eliminar día/.test(hojaDia?.texto ?? '') && /\d/.test(hojaDia?.texto ?? ''), 'hojas', `lleva el nombre del día arriba y «Eliminar día» (${hojaDia?.texto})`)
  await cap(a, 'menu_dia')
  await a.evaluar("Array.from(document.querySelectorAll('[data-opcion-hoja]')).find((b) => /Eliminar día/.test(b.textContent)).click(); true")
  await a.esp(900)
  const conf = await a.evaluar(`(() => { const h = document.querySelector('[data-hoja="confirmar"]'); return h ? { tirador: Boolean(h.querySelector('[data-hoja-tirador]')), cerrar: Boolean(h.querySelector('[aria-label="Cerrar"]')), texto: h.innerText.replace(/\\s+/g, ' ') } : null })()`)
  debe(conf?.tirador && conf?.cerrar && /Eliminar/.test(conf?.texto ?? ''), 'hojas', `«¿Eliminar…?» sale como hoja (${conf?.texto})`)
  await cap(a, 'confirmar_dia')
  await a.evaluar("document.querySelector('[data-hoja=\"confirmar\"] [aria-label=\"Cerrar\"]').click(); true")
  await a.esp(600)
  debe((await a.evaluar("document.querySelector('[data-hoja=\"confirmar\"]')")) === null, 'hojas', 'la ✕ cierra la confirmación')

  // El menú de una parada.
  const dias0 = await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState().route.days.map((d) => d.id))")
  const abrirParada = async () => {
    await a.evaluar("Array.from(document.querySelectorAll('[data-hoja=\"menu\"] [aria-label=\"Cerrar\"]')).forEach((b) => b.click()); true")
    await a.esp(400)
    const ok = await a.evaluar("(() => { const b = document.querySelector('[data-menu-hoja=\"parada\"]'); if (!b) return false; b.scrollIntoView({block:'center'}); b.click(); return true })()")
    await a.esp(900)
    return ok
  }
  debe(await abrirParada(), 'hojas', 'la parada tiene su «···»')
  const hojaP = await a.evaluar(`(() => { const h = document.querySelector('[data-hoja="menu"]'); if (!h) return null; const p = h.querySelector('.hoja-panel'); return { alto: p.getBoundingClientRect().height, ventana: window.innerHeight, opciones: Array.from(h.querySelectorAll('[data-opcion-hoja]')).map((b) => b.textContent.trim()), titulo: h.querySelector('span[style*="Instrument"]')?.textContent ?? '' } })()`)
  debe(hojaP && hojaP.alto < hojaP.ventana * 0.5, 'hojas', `el menú de la parada es una hoja baja (${Math.round(hojaP?.alto)} px)`)
  debe(hojaP?.titulo.length > 2, 'hojas', `lleva el nombre de la parada arriba (${hojaP?.titulo})`)
  debe(hojaP?.opciones.includes('Mover a otro día') && hojaP?.opciones.includes('Quitar parada'), 'hojas', `opciones una debajo de otra (${hojaP?.opciones.join(', ')})`)
  debe(!hojaP?.opciones.some((o) => /hora/i.test(o)), 'cambiar_hora', '«Cambiar hora» ya no sale entre las opciones de la parada')
  await cap(a, 'menu_parada')

  // «Mover a»: la ruedita.
  await a.evaluar("Array.from(document.querySelectorAll('[data-opcion-hoja]')).find((b) => /Mover a otro día/.test(b.textContent)).click(); true")
  await a.esp(900)
  const mover = await a.evaluar(`(() => { const m = document.querySelector('[data-mover-a-dia]'); if (!m) return null; const p = document.querySelector('[data-hoja="menu"] .hoja-panel'); return { ahora: m.querySelector('[data-ahora-en]')?.textContent ?? '', rueda: Boolean(m.querySelector('[role="listbox"]')), opciones: m.querySelectorAll('[role="option"]').length, boton: Array.from(m.querySelectorAll('button')).map((b) => b.textContent.trim()), alto: p.getBoundingClientRect().height, ventana: window.innerHeight } })()`)
  debe(mover?.rueda && mover?.opciones >= 1, 'mover', `«Mover a» elige el día con una rueda (${mover?.opciones} días)`)
  debe(/^Ahora: /.test(mover?.ahora ?? ''), 'mover', `con «Ahora: …» arriba (${mover?.ahora})`)
  debe(mover?.boton.includes('Mover aquí'), 'mover', 'y [Mover aquí] debajo')
  debe(mover && mover.alto < mover.ventana * 0.65, 'mover', `la hoja no ocupa media pantalla larga (${Math.round(mover?.alto)} px)`)
  await cap(a, 'mover_a')
  const antes = await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState().route.days.map((d) => d.stops?.length ?? 0).join(','))")
  await a.evaluar("Array.from(document.querySelectorAll('[data-mover-a-dia] button')).find((b) => /Mover aquí/.test(b.textContent)).click(); true")
  await a.esp(1500)
  const despues = await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState().route.days.map((d) => d.stops?.length ?? 0).join(','))")
  debe(antes !== despues, 'mover', `[Mover aquí] mueve la parada (${antes} → ${despues})`)
  debe((await a.evaluar("document.querySelector('[data-hoja=\"menu\"]')")) === null, 'mover', 'y la hoja se cierra')

  // Cerrar deslizando.
  await modo(a, 'days')
  debe(await abrirParada(), 'hojas', 'se vuelve a abrir el menú de una parada')
  await a.evaluar(`(() => { const t = document.querySelector('[data-hoja="menu"] [data-hoja-tirador]'); const r = t.getBoundingClientRect(); const x = r.x + r.width / 2; const y = r.y + r.height / 2; const ev = (tipo, dy) => t.dispatchEvent(new PointerEvent(tipo, { bubbles: true, pointerId: 1, clientX: x, clientY: y + dy })); ev('pointerdown', 0); ev('pointermove', 60); ev('pointermove', 140); ev('pointerup', 140); return true })()`)
  await a.esp(700)
  debe((await a.evaluar("document.querySelector('[data-hoja=\"menu\"]')")) === null, 'hojas', 'deslizar el tirador hacia abajo cierra la hoja')
  debe(await abrirParada(), 'hojas', 'otra vez abierta')
  await a.evaluar("document.querySelector('[data-hoja=\"menu\"] .hoja-fondo').click(); true")
  await a.esp(600)
  debe((await a.evaluar("document.querySelector('[data-hoja=\"menu\"]')")) === null, 'hojas', 'tocar fuera cierra la hoja')

  // EXPLORAR: el estilo de elegir.
  await modo(a, 'explore')
  await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^Atracciones/.test((x.textContent || '').trim()) && x.className.includes('rounded-[20px]')); b?.click(); return Boolean(b) })()")
  await a.esp(2500)
  const est = await a.evaluar(`(() => { const r = document.querySelector('[data-pestana="recommended"]'); const n = document.querySelector('[data-pestana="nearby"]'); if (!r || !n) return null; const cr = getComputedStyle(r); const cn = getComputedStyle(n); return { elegida: cr.backgroundColor, texto: cr.color, otra: cn.backgroundColor } })()`)
  debe(est?.elegida === 'rgb(28, 34, 48)', 'elegir', `[Recomendados] elegido en el azul oscuro de la marca (${est?.elegida})`)
  debe(est?.otra === 'rgb(255, 253, 248)', 'elegir', `[Cerca de ti] sin elegir, en blanco (${est?.otra})`)
  await cap(a, 'elegir_explorar')
  a.cerrar()
}

console.log(fallos.length ? fallos.map((f) => `✗ [${f.regla}] ${f.texto}`).join('\n') : '✓ todo bien')
console.log(`\nTanda 10N (cabecera): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
