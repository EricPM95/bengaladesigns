// Tanda 10S6 (agente P): apartados 3 y 4 — «Entradas y Free Tour» como Design `Piezas/Entradas Lista` (L1 y L2) y la cabecera del alojamiento sin línea bajo el título.
//   1 · el código: tarjetas nuevas, sin «Ver n más», con [Añadir otra reserva], sin botón de código en las reservadas, día entero en las etiquetas.
//   2 · en la app: «Por reservar» con «En tu ruta · Jueves 26» (día entero), [Reservar entrada] y «¿Ya la tienes? Añádela» (abre la hoja de siempre);
//       con una entrada guardada: «Reservadas» arriba con ✓, día entero · hora · precio y «Cambiar», sin botón de código; sin «Ver n más»; [Añadir otra reserva];
//       cabecera del alojamiento: solo título y estado.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S6_P.mjs
// Imprime «N comprobaciones, M fallos» y sale con 1 si falla.
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  ✗ [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const DIA = '(?:Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)'

console.log('1. El código')
{
  const ent = sinComentarios(leer('src/components/route/reservas/EntradasYFreeTour.tsx'))
  const tar = sinComentarios(leer('src/components/route/reservas/TarjetasEntradas.tsx'))
  debe(!/Ver \$\{masEntradas|setVerMas|Ver menos/.test(ent), 'ap3', 'sin «Ver n más»')
  debe(/data-anadir-otra-reserva/.test(ent) && /Añadir otra reserva/.test(ent), 'ap3', 'está [Añadir otra reserva]')
  debe(/Reservadas ·/.test(ent) && /Por reservar ·/.test(ent), 'ap3', 'las dos partes «Reservadas · n» y «Por reservar · n»')
  debe(/TarjetaReservada/.test(ent) && /TarjetaPorReservar/.test(ent) && /Cambiar/.test(tar) && /¿Ya la tienes\?/.test(tar) && /Añádela/.test(tar), 'ap3', 'las tarjetas de Design (reservada con «Cambiar», por reservar con «Añádela»)')
  debe(!/data-codigo|Ver el código|Ver código|QR/i.test(ent + tar), 'ap3', 'sin el botón del código de las reservadas')
  debe(/fechaCorta/.test(ent) && /diaTitulo/.test(ent) && /En tu ruta · /.test(ent), 'ap3', 'las etiquetas con el día entero («En tu ruta · Jueves 26»)')
  debe(!/(?:fechaCortaAbrev|diaCorto\()/.test(ent), 'ap3', 'ninguna fecha corta («Jue 26») en el bloque')
  const al = sinComentarios(leer('src/components/route/reservas/AlojamientoReservas.tsx'))
  const cab = al.slice(al.indexOf('data-aloj-cabecera') - 250, al.indexOf('data-aloj-cabecera') + 700)
  debe(!/nochesTexto|nombreHotel|fechasTexto|estancia/.test(cab.slice(0, cab.indexOf('{desplegado'))), 'ap4', 'el código de la cabecera del alojamiento no pinta ninguna línea bajo el título')
}

console.log('2. En la app')
let app = null
try {
  app = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=completa' })
  for (let i = 0; i < 240 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await app.esp(500)
  for (let intento = 0; intento < 8; intento++) {
    const ok = await app.evaluar('window.__rutaPrueba().then(() => true, (e) => String(e && e.message))').catch((e) => String(e))
    if (ok === true) break
    await app.esp(1500)
  }
  for (let i = 0; i < 90 && !(await app.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await app.esp(1000)
  await app.esp(2500)
  const ev = (js) => app.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const B = await import('/src/lib/bookings.ts'); const route = () => R.useRouteStore.getState().route; const st = () => R.useRouteStore.getState(); ${js} })()`)
  const bloque = "return (document.querySelector('[data-blk=\"entradas\"]')?.textContent ?? '').replace(/\\s+/g, ' ')"
  const abrirBloque = async () => {
    await ev("st().setMode('bookings'); return true")
    await app.esp(1800)
    await ev(`(() => { const b = document.querySelector('[data-blk="entradas"]'); if (b && b.children.length < 2) b.firstElementChild?.click(); return true })()`)
    await app.esp(1200)
  }
  await abrirBloque()

  // — L1: lo que falta por reservar —
  const l1 = await ev(`return {
    tarjetas: document.querySelectorAll('[data-tarjeta-por-reservar]').length,
    etiquetas: Array.from(document.querySelectorAll('[data-tarjeta-por-reservar]')).map((t) => t.firstElementChild?.nextElementSibling?.firstElementChild?.firstElementChild?.textContent ?? ''),
    botones: Array.from(document.querySelectorAll('[data-tarjeta-por-reservar] button')).map((b) => b.textContent.trim()),
    rotulo: document.querySelector('[data-seccion-por-reservar]')?.textContent ?? null,
    cabOscura: getComputedStyle(document.querySelector('[data-cabecera-entradas]') ?? document.body).backgroundColor,
    texto: (document.querySelector('[data-blk="entradas"]')?.textContent ?? '').replace(/\\s+/g, ' '),
  }`)
  debe(l1.tarjetas >= 1, 'ap3', `hay tarjetas «Por reservar» (${l1.tarjetas})`)
  debe(/^Por reservar · \d+$/i.test(l1.rotulo ?? ''), 'ap3', `rótulo «Por reservar · n» (${l1.rotulo})`)
  debe(l1.etiquetas.length > 0 && l1.etiquetas.every((e) => new RegExp(`^(Free Tour · )?En tu ruta · ${DIA} \\d+$`).test(e)), 'ap3', `etiquetas con el día entero (${JSON.stringify(l1.etiquetas)})`)
  debe(l1.botones.some((b) => /^Reservar (entrada|Free Tour)$/.test(b)) && l1.botones.includes('Añádela'), 'ap3', `[Reservar entrada] y «Añádela» (${JSON.stringify(l1.botones)})`)
  debe(/^rgb\(28, 34, 48\)$/.test(l1.cabOscura), 'ap3', `la cabecera oscura de Design (${l1.cabOscura})`)
  debe(/\d+ de \d+ reservadas/.test(l1.texto), 'ap3', 'la cabecera cuenta «n de m»')
  debe(!/Ver \d+ más|Ver menos/.test(l1.texto), 'ap3', 'sin «Ver n más»')
  debe(/Añadir otra reserva/.test(l1.texto), 'ap3', 'sale [Añadir otra reserva]')
  debe(!/Mié \d|Jue \d|Vie \d|Sáb \d|Lun \d|Mar \d|Dom \d/.test(l1.texto), 'ap3', 'ninguna fecha abreviada')
  await ev(`document.querySelector('[data-cabecera-entradas]')?.scrollIntoView({ block: 'start' }); return true`)
  await app.esp(600)
  await app.captura('docs/dias/capturas_jutrip/10s6_entradas_1.jpg').catch(() => {})

  // «Añádela» abre la hoja de guardar la entrada de siempre.
  await ev(`Array.from(document.querySelectorAll('[data-tarjeta-por-reservar] button')).find((b) => b.textContent.trim() === 'Añádela')?.click(); return true`)
  await app.esp(1200)
  const hoja = await ev(`return document.querySelector('#add-reservation-heading')?.innerText ?? ''`)
  debe(hoja.length > 0, 'ap3', `«Añádela» abre la hoja de guardar la entrada (${hoja.slice(0, 60)})`)
  await ev(`document.querySelector('#add-reservation-heading')?.closest('[role="dialog"]')?.querySelector('button[aria-label*="errar"], button[aria-label*="trás"]')?.click(); return true`)
  await app.esp(500)

  // — L2: con entradas guardadas —
  const nombres = await ev(`return Array.from(document.querySelectorAll('[data-entrada-nombre]')).map((x) => x.textContent)`)
  await app.esp(300)
  const base = await ev(`const r = route(); const d = r.days.filter((x) => !x.isReturnLeg && B.dateOfDay(r, x))[1] ?? r.days[0]; return { dateIso: B.dateOfDay(r, d), n: d.dayNumber }`)
  // Recarga la vista para cerrar la hoja si siguiera abierta.
  await ev("st().setMode('days'); return true")
  await app.esp(500)
  const elegidos = nombres.slice(0, 2)
  debe(elegidos.length >= 1, 'ap3', `hay al menos una entrada para guardar (${JSON.stringify(nombres)})`)
  for (const [i, nombre] of elegidos.entries()) {
    await ev(`st().addReservation({ id: 'res-10s6-${i}', kind: 'entrada', refId: ${JSON.stringify(nombre)}, name: ${JSON.stringify(nombre)}, placeNames: [${JSON.stringify(nombre)}], dateIso: ${JSON.stringify(base.dateIso)}, dayNumber: null, time: '09:15', precio: { amount: 50, currency: 'EUR' } }, null, null); return true`)
  }
  await app.esp(1500)
  await abrirBloque()
  const l2 = await ev(`return {
    rotuloRes: document.querySelector('[data-seccion-reservadas]')?.textContent ?? null,
    orden: (() => { const b = document.querySelector('[data-blk="entradas"]'); const a = b.querySelector('[data-seccion-reservadas]'); const c = b.querySelector('[data-seccion-por-reservar]'); return !c || (a && (a.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0) })(),
    filas: Array.from(document.querySelectorAll('[data-tarjeta-reservada]')).map((t) => ({ texto: t.textContent.replace(/\\s+/g, ' '), cambiar: Array.from(t.querySelectorAll('button')).map((b) => b.textContent.trim()), botones: t.querySelectorAll('button').length })),
    texto: (document.querySelector('[data-blk="entradas"]')?.textContent ?? '').replace(/\\s+/g, ' '),
  }`)
  debe(/^Reservadas · \d+$/i.test(l2.rotuloRes ?? ''), 'ap3', `rótulo «Reservadas · n» (${l2.rotuloRes})`)
  debe(l2.orden === true, 'ap3', '«Reservadas» va arriba y «Por reservar» debajo')
  debe(l2.filas.length === elegidos.length, 'ap3', `salen ${elegidos.length} reservadas (${l2.filas.length})`)
  for (const f of l2.filas) {
    debe(new RegExp(`${DIA} \\d+ · 09:15 · 50`).test(f.texto), 'ap3', `la reservada lleva día entero, hora y precio (${f.texto})`)
    debe(/Reservad[ao]/.test(f.texto), 'ap3', `lleva «Reservada» (${f.texto})`)
    debe(f.cambiar.length === 1 && f.cambiar[0] === 'Cambiar', 'ap3', `solo el botón «Cambiar», sin botón de código (${JSON.stringify(f.cambiar)})`)
  }
  debe(new RegExp(`${elegidos.length} de \\d+ reservadas`).test(l2.texto), 'ap3', 'la cabecera cuenta las reservadas')
  debe(!/Ver \d+ más|Ver menos/.test(l2.texto) && /Añadir otra reserva/.test(l2.texto), 'ap3', 'sin «Ver n más» y con [Añadir otra reserva]')
  // (Dos entradas el mismo día avisan de que coinciden: se cierra el aviso para ver el bloque.)
  await ev(`Array.from(document.querySelectorAll('[role="dialog"] button, [role="alertdialog"] button')).filter((b) => /^(cerrar|×|✕)$/i.test((b.getAttribute('aria-label') ?? b.textContent).trim())).forEach((b) => b.click()); return true`)
  await app.esp(1200)
  await ev(`document.querySelector('[data-cabecera-entradas]')?.scrollIntoView({ block: 'start' }); return true`)
  await app.esp(600)
  await app.captura('docs/dias/capturas_jutrip/10s6_entradas_2.jpg').catch(() => {})
  // «Cambiar» abre la hoja con la reserva.
  await ev(`document.querySelector('[data-tarjeta-reservada] button')?.click(); return true`)
  await app.esp(1200)
  const hojaCambiar = await ev(`return document.querySelector('#add-reservation-heading')?.innerText ?? ''`)
  debe(hojaCambiar.length > 0, 'ap3', '«Cambiar» abre la hoja de la reserva')
  for (const i of elegidos.keys()) await ev(`st().removeReservation('res-10s6-${i}'); return true`)

  // — Apartado 4: la cabecera del alojamiento —
  await ev("st().setMode('bookings'); return true")
  await app.esp(1500)
  const aloj = await ev(`const c = document.querySelector('[data-blk="aloj"] [data-aloj-cabecera], [data-blk="aloj"]'); return { texto: (c?.textContent ?? '').replace(/\\s+/g, ' ').trim(), hay: Boolean(document.querySelector('[data-blk="aloj"]')) }`)
  debe(aloj.hay, 'ap4', 'está el bloque del alojamiento')
  debe(!/\d+ noches?|noche\b/.test(aloj.texto.slice(0, 80)) && !/→/.test(aloj.texto.slice(0, 80)), 'ap4', `la cabecera no lleva «Roma · 3 noches» ni fechas (${aloj.texto.slice(0, 100)})`)
  const cabAloj = await ev(`const c = document.querySelector('[data-blk="aloj"] [data-aloj-cabecera]'); return c ? c.querySelectorAll(':scope > span:nth-of-type(2) > span').length : -1`)
  debe(cabAloj === -1 || cabAloj === 2, 'ap4', `la cabecera con algo guardado tiene solo título y estado (${cabAloj} líneas)`)
} catch (e) {
  debe(false, 'app', `la prueba falló: ${e && e.message}`)
} finally {
  try { await app?.cerrar?.() } catch {}
}
console.log(`${comprobaciones} comprobaciones, ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
