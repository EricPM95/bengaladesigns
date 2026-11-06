// Prueba de la 10S10, agente C (apartado 4: las excursiones): la página del día de excursión con las 8 de la 10R (nombre completo, enlace con nuestro código, «No reembolsable»),
// «¿Ya la has reservado? Añade tu confirmación» → RESERVAS › Excursiones con la hoja y el día puestos, y el bloque «Excursiones» de RESERVAS como «Entradas y Free Tour».
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S10_C.mjs [sinNavegador=1] [capturas=1]
// Necesita la API reiniciada (datos) y el Vite en 5173 con el código nuevo. Un Chrome, por la cola.
import fs from 'node:fs'
import path from 'node:path'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
const fallos = []
let n = 0
const debe = (cond, texto) => {
  n++
  if (!cond) fallos.push(texto)
}
const leer = (p) => fs.readFileSync(p, 'utf8')
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

// ── 1. Los datos de la página del día (servidor) ──────────────────────────────────────────────────────────────────────────────────────────────────────
const roma = JSON.parse(leer('data/pipeline_v2/roma.json'))
const { excursionPagePayload } = await import('../../server/engine/excursionPage.js')
const pagina = excursionPagePayload('roma', roma)
const tabla = Object.fromEntries(roma.excursions.options.map((o) => [o.id, o]))
// La página usa el id de sus datos (`opcion` si lo tiene) para casar con la tabla de la 10R.
const dias = JSON.parse(leer('data/dias/roma/_excursiones.json'))
const opcionDe = Object.fromEntries(dias.excursiones.map((e) => [e.id, e.opcion ?? e.id]))
debe(pagina?.options.length === 8, `la página del día lleva ${pagina?.options.length} excursiones (8)`)
debe(new Set(pagina?.options.map((o) => opcionDe[o.id])).size === 8, 'las 8 de la página son las 8 distintas de la tabla de la 10R')
for (const o of pagina?.options ?? []) {
  const t = tabla[opcionDe[o.id]]
  debe(Boolean(t), `${o.id}: no está en la tabla`)
  if (!t) continue
  const completo = `${o.name_before} ${o.name_destination}${o.name_after}`.replace(/\s+/g, ' ').trim()
  debe(completo === t.name, `${o.id}: nombre «${completo}» (tabla «${t.name}»)`)
  debe(o.affiliate_url === `https://www.civitatis.com/es/roma/${t.civitatis_slug}/`, `${o.id}: enlace ${o.affiliate_url}`)
  debe(!/[?&](aid|cmp)=/.test(o.affiliate_url ?? ''), `${o.id}: el enlace ya lleva el código escrito a mano (lo pone la app al pulsar)`)
  debe(o.price_from === t.price_from_eur, `${o.id}: precio ${o.price_from} (${t.price_from_eur})`)
  debe((o.cancellation ?? null) === (t.cancellation ?? null) && (o.cancellation_note ?? null) === (t.cancellation_note ?? null), `${o.id}: cancelación ${o.cancellation}`)
  debe(o.meeting_point === t.meeting_point, `${o.id}: punto de encuentro «${o.meeting_point}»`)
  debe(o.half_day === t.half_day, `${o.id}: medio día ${o.half_day} (tabla ${t.half_day})`)
  debe(o.example === false, `${o.id}: sigue marcada como ejemplo`)
}
debe(pagina?.options.filter((o) => o.cancellation === 'no_reembolsable').map((o) => o.id).sort().join() === 'florencia,napoles_pompeya_tren', 'solo Florencia en tren y Nápoles y Pompeya dicen «No reembolsable»')
debe(!/civitatis|getyourguide|stay22/i.test(leer('data/dias/roma/_excursiones.json') + leer('server/engine/excursionPage.js')), 'el nombre de la empresa no está escrito en los datos ni en excursionPage.js (lo vigila pruebaTanda6g)')

// ── 2. El código ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const pag = sinComentarios(leer('src/components/route/dayDetail/excursion/ExcursionDayPage.tsx'))
  debe(/onAddConfirmation/.test(pag) && !/Código de reserva|Por ejemplo, CIV/.test(pag), 'la página ya no guarda un código: «Añade tu confirmación» lleva a RESERVAS')
  debe(/listName: excursion\.title/.test(pag), 'la lista «Ver más excursiones» usa el nombre completo')
  const res = sinComentarios(leer('src/components/route/reservas/ExcursionesReservas.tsx'))
  debe(/CabeceraBloque/.test(res) && /titulo="Excursiones"/.test(res) && /reservada/.test(res) && /Ninguna en tu ruta/.test(res), 'RESERVAS: el bloque Excursiones usa la cabecera compartida con sus dos estados')
  debe(/data-ver-mas-excursiones/.test(res) && !/self-start border-none bg-transparent px-1 py-0\.5/.test(res), 'RESERVAS: «Ver más excursiones» va dentro del bloque, no fuera')
  debe(/excursionPedida/.test(res), 'RESERVAS: el bloque abre la hoja de la excursión pedida desde DÍAS')
}

// ── 3. En la pantalla ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
if (args.sinNavegador !== '1') {
  const { abrirApp } = await import('./_enLaApp.mjs')
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=pago', ancho: 390, alto: 844 })
  try {
    const ev = (js) => a.evaluar(js)
    const esperar = async (js, vueltas = 40, ms = 500) => {
      for (let i = 0; i < vueltas; i++) {
        if (await ev(js).catch(() => false)) return true
        await a.esp(ms)
      }
      return false
    }
    for (let intento = 0; intento < 3; intento++) {
      try {
        await ev('window.__rutaPrueba().then(() => true)')
        break
      } catch (e) {
        if (intento === 2) throw e
        await ev('location.reload()').catch(() => undefined)
        await a.esp(5000)
      }
    }
    for (let i = 0; i < 90 && !(await ev('window.__ruta?.getState().route != null').catch(() => false)); i++) await a.esp(1000)
    await a.esp(1500)
    if (args.capturas === '1') fs.mkdirSync(SALIDA, { recursive: true })

    // El día 2 pasa a ser el día de excursión con las 8 (como lo trae el motor en el día 4): se monta con la misma pieza que usa la app al leer la respuesta.
    const opciones = JSON.stringify(pagina.options)
    const dia = await ev(`(async () => {
      const M = await import('/src/lib/mapGeneratedRoute.ts')
      const st = window.__ruta.getState()
      const day = st.route.days.find((d) => !d.isReturnLeg && d.dayNumber === 2) ?? st.route.days[1]
      const opts = ${opciones}.map(M.mapExcursionPage)
      st.replaceDayExact(day.id, { ...day, dayType: 'excursion', excursions: opts, selectedExcursionId: opts[0].id, interruptor: { mode: 'excursion', default: 'excursion', excursionId: opts[0].id, percentPhrase: null, other: null } })
      // (El bloque Excursiones solo sale desde excursiones_desde_dias = 4 días de viaje; el viaje de pruebas tiene 3 + la vuelta: el último día cuenta como día entero.)
      const ultimo = window.__ruta.getState().route.days.at(-1)
      if (ultimo.isReturnLeg) window.__ruta.getState().replaceDayExact(ultimo.id, { ...ultimo, isReturnLeg: false })
      window.__ruta.getState().setMode('days')
      window.__ruta.setState({ activeDayId: day.id })
      return day.id
    })()`)
    debe(Boolean(dia), 'se montó el día de excursión')

    // Abrir el día: la app lo abre al tocar su tarjeta; si no está a la vista, se pide por el almacén.
    await esperar(`/Excursión del día/i.test(document.body.innerText)`, 6)
    if (!(await ev(`/Excursión del día/i.test(document.body.innerText)`))) {
      await ev(`(() => { const b = Array.from(document.querySelectorAll('button, [role=button]')).find((x) => /^\\s*(Día|Dia)?\\s*2\\b/.test(x.textContent ?? '')); b?.click(); return Boolean(b) })()`)
      await esperar(`/Excursión del día/i.test(document.body.innerText)`, 10)
    }
    debe(await ev(`/Excursión del día/i.test(document.body.innerText)`), 'sale la página del día de excursión')
    // El aviso de fechas del viaje de pruebas («Hemos preparado tu viaje para estas fechas») tapa las capturas: se pasa hasta que se va.
    for (let i = 0; i < 4; i++) {
      const hay = await ev(`/HEMOS PREPARADO TU VIAJE/i.test(document.body.innerText)`)
      if (!hay) break
      await ev(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)/i.test((x.textContent ?? '').trim())); b?.click(); return Boolean(b) })()`)
      await a.esp(600)
    }

    // 3a. [Ver disponibilidad] con enlace (nuestro código al pulsarlo) y el nombre completo, en las 8.
    const nombres = pagina.options.map((o) => ({ id: o.id, completo: `${o.name_before} ${o.name_destination}${o.name_after}`.replace(/\s+/g, ' ').trim(), url: o.affiliate_url, noReemb: o.cancellation === 'no_reembolsable' }))
    for (const [i, o] of nombres.entries()) {
      if (i > 0) {
        await ev(`(() => { const ver = Array.from(document.querySelectorAll('button')).find((b) => /Ver más excursiones/.test(b.textContent ?? '')); const abierto = ver?.getAttribute('aria-expanded') === 'true'; if (ver && !abierto) ver.click(); return true })()`)
        await a.esp(300)
        const clic = await ev(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => x.textContent?.includes(${JSON.stringify(o.completo)}) && x.textContent.includes('desde')); b?.click(); return Boolean(b) })()`)
        debe(clic, `${o.id}: sale en «Ver más excursiones» con su nombre completo`)
        await a.esp(700)
      }
      const est = await ev(`(() => {
        const h = document.querySelector('h3 em')?.parentElement
        const enlace = Array.from(document.querySelectorAll('a')).find((x) => /Ver disponibilidad/.test(x.textContent ?? ''))
        return { titulo: (h?.textContent ?? '').replace(/\\s+/g, ' ').trim(), href: enlace?.getAttribute('href') ?? null, target: enlace?.getAttribute('target') ?? null, pendiente: /Enlace pendiente/.test(document.body.innerText), noReemb: Boolean(document.querySelector('[data-no-reembolsable]')) }
      })()`)
      debe(est.titulo === o.completo, `${o.id}: la página dice «${est.titulo}» (debería ser «${o.completo}»)`)
      debe(est.href === o.url && est.target === '_blank', `${o.id}: [Ver disponibilidad] va a ${est.href}`)
      debe(!est.pendiente, `${o.id}: sale «Enlace pendiente»`)
      debe(est.noReemb === o.noReemb, `${o.id}: «No reembolsable» ${est.noReemb ? 'sale' : 'no sale'}`)
      if (args.capturas === '1' && (o.id === 'florencia' || o.id === 'venecia_tren')) {
        await ev(`document.querySelector('h3 em')?.scrollIntoView({ block: 'start' }); true`)
        await a.esp(700)
        await a.captura(path.join(SALIDA, `10s10_excursion_pagina_${o.id}.jpg`))
      }
    }
    // El código de afiliado y la campaña los pone la app al pulsar (CampaignLinks): el enlace de la página los recibe sin tocarlo.
    const sellado = await ev(`(() => {
      const enlace = Array.from(document.querySelectorAll('a')).find((x) => /Ver disponibilidad/.test(x.textContent ?? ''))
      enlace?.addEventListener('click', (e) => e.preventDefault(), { once: true })
      enlace?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      return enlace?.href ?? null
    })()`)
    debe(/civitatis\.com/.test(sellado ?? '') && /[?&]aid=\d+/.test(sellado ?? ''), `el enlace al pulsarlo lleva el código de afiliado (${sellado})`)

    // 3b. «¿Ya la has reservado? Añade tu confirmación» → RESERVAS › Excursiones, con la hoja y el día puestos.
    await ev(`(() => { const ver = Array.from(document.querySelectorAll('button')).find((b) => /Ver más excursiones/.test(b.textContent ?? '')); if (ver?.getAttribute('aria-expanded') === 'true') ver.click(); return true })()`)
    await ev(`document.querySelector('[data-anadir-confirmacion]')?.scrollIntoView({ block: 'center' }); true`)
    await a.esp(500)
    debe(await ev(`Boolean(document.querySelector('[data-anadir-confirmacion]'))`), 'el botón «Añade tu confirmación» está')
    await ev(`document.querySelector('[data-anadir-confirmacion]')?.click(); true`)
    const hoja = await esperar(`Boolean(document.querySelector('[role=dialog]')) && /Excursión · elige día y hora/i.test(document.body.innerText)`, 30)
    debe(hoja, 'se abre la hoja de la excursión (elige día y hora) en RESERVAS')
    const modo = await ev(`window.__ruta.getState().mode`)
    debe(modo === 'bookings', `la pantalla pasa a RESERVAS (modo ${modo})`)
    const hojaTexto = await ev(`document.body.innerText`)
    debe(/Excursi[oó]n/.test(hojaTexto) && !/Código de reserva/.test(hojaTexto), 'la hoja es la de la excursión, no un código suelto')
    debe(await ev(`Boolean(document.querySelector('[data-blk="excursiones"]'))`), 'el bloque Excursiones está en RESERVAS')
    if (args.capturas === '1') await a.captura(path.join(SALIDA, '10s10_excursion_confirmacion_hoja.jpg'))
    // El día va puesto: la hoja trae el día de la excursión elegido (sin pedirlo de nuevo).
    const diaPuesto = await ev(`(() => { const st = window.__ruta.getState(); const dia = st.route.days.find((d) => d.id === ${JSON.stringify(dia)}); return Array.from(document.querySelectorAll('[role=dialog] [aria-pressed=true], [role=dialog] [aria-checked=true], [role=dialog] [data-selected=true]')).map((x) => x.textContent).join('|') + '#' + (dia?.dayNumber ?? '') })()`)
    debe(/2/.test(diaPuesto), `la hoja trae el día 2 puesto (${diaPuesto})`)

    // Cerrar la hoja (sin guardar) y mirar el bloque.
    await ev(`(() => { const x = Array.from(document.querySelectorAll('[role=dialog] button')).find((b) => /Cerrar|✕|×/.test(b.getAttribute('aria-label') ?? b.textContent ?? '')); x?.click(); return Boolean(x) })()`)
    await a.esp(800)
    if (await ev(`Boolean(document.querySelector('[role=dialog]'))`)) {
      await ev(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); true`)
      await a.esp(800)
    }
    // 3c. El bloque, abierto por la petición: cabecera, la excursión de la ruta, «Ver más excursiones» abajo y dentro.
    const bloque = await ev(`(() => {
      const b = document.querySelector('[data-blk="excursiones"]')
      if (!b) return null
      const cab = b.querySelector('[data-cabecera-bloque]')
      const ver = b.querySelector('[data-ver-mas-excursiones]')
      const hijos = Array.from(b.children)
      return {
        titulo: b.querySelector('[data-titulo-bloque]')?.textContent ?? '',
        cabecera: cab?.innerText.replace(/\\s+/g, ' ').trim() ?? '',
        tarjeta: /Reservar excursión/.test(b.innerText),
        ver: ver?.textContent ?? null,
        verEsUltimo: Boolean(ver) && (hijos[hijos.length - 1] === ver || hijos[hijos.length - 1]?.contains(ver) || b.lastElementChild?.previousElementSibling === ver),
        fuera: Array.from(document.querySelectorAll('button')).filter((x) => /Ver más excursiones/.test(x.textContent ?? '') && !b.contains(x)).length,
      }
    })()`)
    debe(Boolean(bloque), 'el bloque Excursiones sigue en RESERVAS')
    if (bloque) {
      debe(bloque.titulo === 'Excursiones', `título «${bloque.titulo}»`)
      debe(/0 de 1 reservada/.test(bloque.cabecera), `estado «${bloque.cabecera}» (0 de 1 reservada)`)
      debe(bloque.tarjeta, 'dentro: la excursión de tu ruta con [Reservar excursión]')
      debe(bloque.ver === 'Ver más excursiones', `dentro: «${bloque.ver}»`)
      debe(bloque.fuera === 0, `${bloque.fuera} «Ver más excursiones» fuera del bloque`)
    }
    if (args.capturas === '1') {
      await ev(`document.querySelector('[data-blk="excursiones"]')?.scrollIntoView({ block: 'start' }); true`)
      await a.esp(700)
      await a.captura(path.join(SALIDA, '10s10_excursion_bloque_abierto.jpg'))
    }

    // 3d. Cerrado al entrar, siempre: al cambiar de pantalla y volver, el bloque sale cerrado y el viajero lo abre y lo cierra.
    await ev(`window.__ruta.getState().setMode('days'); true`)
    await a.esp(800)
    await ev(`window.__ruta.getState().setMode('bookings'); true`)
    await esperar(`Boolean(document.querySelector('[data-blk="excursiones"]'))`, 20)
    const cerrado = await ev(`(() => { const b = document.querySelector('[data-blk="excursiones"]'); return { ver: Boolean(b?.querySelector('[data-ver-mas-excursiones]')), tarjeta: /Reservar excursión/.test(b?.innerText ?? ''), estado: b?.querySelector('[data-cabecera-bloque]')?.innerText.replace(/\\s+/g, ' ').trim() } })()`)
    debe(!cerrado.ver && !cerrado.tarjeta, 'al volver a RESERVAS el bloque Excursiones sale CERRADO')
    debe(/0 de 1 reservada/.test(cerrado.estado ?? ''), `cerrado enseña «${cerrado.estado}»`)
    if (args.capturas === '1') {
      await ev(`document.querySelector('[data-blk="excursiones"]')?.scrollIntoView({ block: 'center' }); true`)
      await a.esp(500)
      await a.captura(path.join(SALIDA, '10s10_excursion_bloque_cerrado.jpg'))
    }
    await ev(`document.querySelector('[data-blk="excursiones"] [data-cabecera-bloque]')?.click(); true`)
    await a.esp(500)
    debe(await ev(`Boolean(document.querySelector('[data-blk="excursiones"] [data-ver-mas-excursiones]'))`), 'tocar la cabecera abre el bloque')
    await ev(`document.querySelector('[data-blk="excursiones"] [data-cabecera-bloque]')?.click(); true`)
    await a.esp(500)
    debe(!(await ev(`Boolean(document.querySelector('[data-blk="excursiones"] [data-ver-mas-excursiones]'))`)), 'tocar otra vez la cabecera lo cierra')

    // 3e. «Ver más excursiones» (dentro) abre la lista de excursiones.
    await ev(`document.querySelector('[data-blk="excursiones"] [data-cabecera-bloque]')?.click(); true`)
    await a.esp(400)
    await ev(`document.querySelector('[data-blk="excursiones"] [data-ver-mas-excursiones]')?.click(); true`)
    debe(await esperar(`document.querySelectorAll('[role=dialog] ul > li').length >= 8`, 30), '«Ver más excursiones» abre la lista con las 8')
    await ev(`Array.from(document.querySelectorAll('[role=dialog] button')).find((b) => b.getAttribute('aria-label') === 'Cerrar')?.click(); true`)
    await a.esp(500)

    // 3f. Sin día de excursión: «Ninguna en tu ruta» y dentro solo «Ver más excursiones».
    await ev(`(() => { const st = window.__ruta.getState(); const day = st.route.days.find((d) => d.dayType === 'excursion'); st.replaceDayExact(day.id, { ...day, dayType: 'normal', selectedExcursionId: null, interruptor: undefined }); return true })()`)
    await a.esp(800)
    await ev(`window.__ruta.getState().setMode('days'); true`)
    await a.esp(500)
    await ev(`window.__ruta.getState().setMode('bookings'); true`)
    await esperar(`Boolean(document.querySelector('[data-blk="excursiones"]'))`, 20)
    const vacio = await ev(`(() => { const b = document.querySelector('[data-blk="excursiones"]'); return b?.querySelector('[data-cabecera-bloque]')?.innerText.replace(/\\s+/g, ' ').trim() ?? null })()`)
    debe(/Ninguna en tu ruta/.test(vacio ?? ''), `sin día de excursión el estado es «${vacio}»`)
    await ev(`document.querySelector('[data-blk="excursiones"] [data-cabecera-bloque]')?.click(); true`)
    await a.esp(500)
    const dentroVacio = await ev(`(() => { const b = document.querySelector('[data-blk="excursiones"]'); return { ver: Boolean(b?.querySelector('[data-ver-mas-excursiones]')), tarjeta: /Reservar excursión/.test(b?.innerText ?? ''), reservadas: Boolean(b?.querySelector('[data-seccion-reservadas]')) } })()`)
    debe(dentroVacio.ver && !dentroVacio.tarjeta && !dentroVacio.reservadas, 'sin día de excursión, dentro solo «Ver más excursiones»')
    if (args.capturas === '1') {
      await ev(`document.querySelector('[data-blk="excursiones"]')?.scrollIntoView({ block: 'center' }); true`)
      await a.esp(500)
      await a.captura(path.join(SALIDA, '10s10_excursion_bloque_sin_dia.jpg'))
    }
  } finally {
    a.cerrar()
  }
}

console.log(`pruebaTanda10S10_C: ${n} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(' ✗', f)
process.exit(fallos.length ? 1 : 0)
