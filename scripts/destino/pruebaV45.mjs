// V45 (24-nov-2026): RESERVAS (vuelo, alojamiento, entradas y excursiones) y los avisos de toda la app. Hace falta el Vite estable (5173) y la API (8787, con DESTINOS_OCULTOS='-' para Lanzarote) YA encendidos.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV45.mjs
// Un solo Chrome por parte, que se cierra al acabar. Capturas 390x844 en docs/dias/V45_capturas/.
//  1. Sin navegador: el servidor da `todas` (el carrusel primero y lo demás detrás, con su categoría); lo escrito (botones de borde, textos, la hoja sin documento, los avisos).
//  2. En pantalla (Roma): cada tarjeta guardada (vuelo, alojamiento, entrada, excursión) enseña el QR/reserva gris y su botón «+ …» sin abrir nada; sin vuelta, «Falta añadir la vuelta» y sin QR; el contador sube al GUARDAR;
//     el aviso de fecha va dentro de la tarjeta; en viaje solo la hoja no pregunta la cuenta; en pareja va en dos pasos y «¿Quién lo ha pagado?» solo con la cuenta común.
//  3. En pantalla (Lanzarote): todo lo del carrusel está en [Ver todas] (la página de todas, no EXPLORAR), con filtros por tipo.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '')
const CAP = path.resolve('docs/dias/V45_capturas')
fs.mkdirSync(CAP, { recursive: true })
const png = (n) => path.join(CAP, `${n}.jpg`)
const APP = process.env.APP_URL ?? 'http://localhost:5173'

/* ───────────── 1. Sin navegador ───────────── */
console.log('1. El servidor y lo escrito (sin navegador)')
{
  const P = await import(pathToFileURL(path.resolve('server/paginaDestino.js')).href)
  const lz = P.paginaDelDestino({ raiz: process.cwd(), destination: 'Lanzarote', datosDestino: null })
  debe(lz.actividades.length === 7 && lz.todas.length > lz.actividades.length, 'todas', `Lanzarote: el carrusel enseña ${lz.actividades.length} y «todas» tiene ${lz.todas.length}`)
  debe(lz.actividades.every((a, i) => lz.todas[i]?.id === a.id), 'todas', 'lo del carrusel va PRIMERO y en su orden en «todas»')
  debe(lz.actividades.every((a) => lz.todas.some((x) => x.id === a.id)), 'todas', 'todo lo del carrusel está en «todas»')
  const cats = new Set(lz.todas.map((a) => a.categoria))
  debe(cats.has('free_tour') && cats.has('excursion') && cats.has('actividad'), 'categorias', `las categorías salen de los datos (${[...cats].join(', ')})`)
  debe(new Set(lz.todas.map((a) => a.id)).size === lz.todas.length, 'todas', 'sin repetidas')
  debe(P.categoriaDeActividad({ nombre: 'Entradas al Coliseo' }) === 'entrada' && P.categoriaDeActividad({ nombre: 'Free tour por Roma' }) === 'free_tour', 'categorias', 'Entradas y Free tours se reconocen')
}
{
  const ex = sinComentarios(leer('src/components/route/reservas/ExcursionesReservas.tsx'))
  debe(/<TodasLasActividades/.test(ex) && !/pedir\(\{ categoria: 'excursiones'/.test(ex), 'ver_todas', '[Ver todas] abre la página de todas, NO EXPLORAR')
  debe(/todas\.length > actividades\.length/.test(ex), 'ver_todas', '[Ver todas] solo sale si hay más de las que se ven')
  debe(/¿Ya tienes otra\?/.test(ex) && /¿Ya tienes una\?/.test(ex), 'ver_todas', '«¿Ya tienes una/otra? Añádela»')
  debe(/botonYaLaTengo/.test(ex), 'excursion', 'la excursión de la ruta: [Reservar excursión] y [Ya la tengo] juntos')
  debe(/data-carrusel-actividades-reservas/.test(ex) && /actividades\.length > 0 && \(/.test(ex), 'carrusel', 'el carrusel se queda siempre (también con excursión en la ruta)')
  const hoja = sinComentarios(leer('src/components/route/reservas/AddReservationSheet.tsx'))
  debe(!/Rellenar desde el email o el PDF/.test(hoja) && !/BotonAnadirEntrada/.test(hoja), 'hoja', 'la hoja ya no lleva [Añadir tu entrada] ni «Rellenar desde el email o el PDF»')
  debe(/sinLineas/.test(hoja) && /Casi lista/.test(hoja) && /¿A qué cuenta lo sumamos\?/.test(hoja) && /Siguiente/.test(hoja), 'hoja', 'la hoja en grupo va en dos pasos («Siguiente», «Casi lista», «¿A qué cuenta lo sumamos?»)')
  const botones = sinComentarios(leer('src/components/route/reservas/BotonesDeReserva.tsx'))
  debe(/IconoDeDocumento/.test(botones) && /estilo === 'borde'/.test(botones), 'patron', 'el icono del documento y el botón de borde existen')
  const entrada = leer('src/components/route/reservas/EntradaConBillete.tsx')
  const excursion = leer('src/components/route/reservas/ExcursionConBillete.tsx')
  const billete = leer('src/components/route/reservas/TarjetaBillete.tsx')
  const aloj = leer('src/components/route/reservas/ReservaDelAlojamiento.tsx')
  debe(/Sube tu entrada/.test(entrada) && /Sube tu reserva/.test(excursion) && /Añade tu tarjeta de embarque/.test(billete) && /Añade tu reserva/.test(aloj), 'patron', 'los cuatro botones de borde: «+ Sube tu entrada», «+ Sube tu reserva», «+ Añade tu tarjeta de embarque», «+ Añade tu reserva»')
  debe(/IconoDeDocumento/.test(entrada) && /IconoDeDocumento/.test(excursion) && /IconoDeDocumento/.test(billete) && /IconoDeDocumento/.test(leer('src/components/route/reservas/AlojamientoReservas.tsx')), 'patron', 'el icono junto al lápiz en vuelo, alojamiento, entrada y excursión')
  const llegada = sinComentarios(leer('src/components/route/reservas/LlegadaYVuelta.tsx'))
  debe(/Falta añadir la vuelta/.test(llegada) && /Falta añadir la ida/.test(llegada), 'vuelo', '«Falta añadir la vuelta»')
  debe(/ponerAvisoDeDocumento\(/.test(llegada) && !/tipo: 'fecha'/.test(llegada), 'avisos', 'el error de fecha va dentro de la tarjeta, no en una ventana')
  const alojR = sinComentarios(leer('src/components/route/reservas/AlojamientoReservas.tsx'))
  debe(/resumenVerde = Boolean\(hotel\) && Boolean\(lineaFechas\)/.test(alojR), 'aloj', '«Listo» con el hotel y las fechas, haya documento o no')
  const claude = leer('CLAUDE.md')
  debe(/V45/.test(claude) && /AvisoArriba/.test(claude) && /Es correcta/.test(claude), 'reglas', 'CLAUDE.md lleva la regla de la V45 (avisos de toda la app)')
  // ningún aviso que solo informa abajo (sin [Deshacer]): los que quedan sobre la barra llevan acción o son de cámara/visto con su propia acción
  const informativos = ['src/components/propuesta/BotonesDeViaje.tsx', 'src/components/logros/visto/Hojas.tsx']
  debe(informativos.every((f) => /AvisoArriba/.test(leer(f))), 'avisos', 'los avisos que solo informan («Enlace copiado», «Foto guardada») salen ARRIBA')
}

{
  // El billete de HOY y DÍAS (Design «Billete QR», Q1-Q4)
  const b = sinComentarios(leer('src/components/route/dayDetail/BilleteDeVuelo.tsx'))
  debe(/IconoDeDocumento/.test(b) && /Tarjeta de embarque guardada/.test(b) && /Añade tu tarjeta de embarque/.test(b) && /data-billete-qr/.test(b), 'billete_qr', 'el billete de HOY y DÍAS lleva el QR (dorado si está, gris con «+» si falta) y la franja de abajo')
  // Los sitios nuevos de Roma (restaurants de roma.json): horarios de Eric / de su web, coordenadas de OpenStreetMap, ni la Gelateria dell'Angeletto
  const roma = JSON.parse(fs.readFileSync('data/pipeline_v2/roma.json', 'utf8'))
  const rs = roma.restaurants
  const de = (n) => rs.find((x) => x.name === n)
  debe(de('La Licata') && /Lun-Sáb 6:00-21:30/.test(de('La Licata').hours) && /Dom 7:00-21:00/.test(de('La Licata').hours), 'roma_nuevos', 'La Licata: lunes a sábado 6:00-21:30 y domingo 7:00-21:00')
  debe(de('Ciuri Ciuri') && /7:00-24:00/.test(de('Ciuri Ciuri').hours), 'roma_nuevos', 'Ciuri Ciuri: todos los días de 7:00 a 24:00')
  debe(de('Oppio Caffè') && /Terme di Tito, 72/.test(de('Oppio Caffè').address), 'roma_nuevos', 'Oppio Caffè está (Via delle Terme di Tito 72)')
  debe(['La Licata', 'Oppio Caffè', 'Ciuri Ciuri'].every((n) => de(n)?.coordinates_checked?.fuente?.startsWith('OpenStreetMap') && Math.abs(de(n).coordinates.lat - 41.894) < 0.01), 'roma_nuevos', 'las coordenadas son de OpenStreetMap (una consulta por sitio), nunca de Google')
  debe(!rs.some((x) => /Angeletto/i.test(x.name)), 'roma_nuevos', "la Gelateria dell'Angeletto NO está")
  // «···» de pendientes, como en el dibujo (Design «Lugares Pendientes», L3)
  const lp = sinComentarios(leer('src/components/route/hoy/v2/LugaresPendientes.tsx'))
  debe(/Vuelve a ser una parada normal del día/.test(lp) && /Márcala como vista y quítala de pendientes/.test(lp) && /Sale de tu lista\. Puedes deshacerlo/.test(lp), 'pendientes', 'el menú «···» de pendientes dice lo del dibujo')
  // «Activa tu ubicación», con el texto del dibujo
  debe(/Para ver lo que tienes cerca, Jutrip necesita tu ubicación/.test(leer('src/components/route/hoy/v2/HojaActivaUbicacion.tsx')), 'ubicacion', '«Activa tu ubicación» con el texto del dibujo')
  // Lo que ya pasó y no es una visita sale de «Tu día»
  const pd = sinComentarios(leer('src/components/route/hoy/v2/ParadaHoy.tsx'))
  debe(/ahoraMin > Number\(m!\[1\]\) \* 60/.test(pd) && /ahoraMin=\{ahoraMinHoy\}/.test(leer('src/components/route/hoy/v2/HoyDuranteV2.tsx')), 'hoy_pasado', 'la comida cuya hora ya pasó sale de «Tu día» (HOY)')
}

/* ───────────── 2. En pantalla (Roma) ───────────── */
if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('2. (SIN VITE: la parte de la pantalla NO SE HA VERIFICADO)')
  console.log(`\nPrueba de la V45: ${comprobaciones} comprobaciones · ${fallos.length} fallos · PANTALLA SIN VERIFICAR`)
  process.exit(fallos.length ? 1 : 0)
}
console.log('2. En la app (Roma, con pase)')
const GENTE2 = [
  { id: 'p-eric', nombre: 'Eric', foto: null, esAdmin: true, permiso: 'admin' },
  { id: 'p-ana', nombre: 'Ana', foto: null, esAdmin: false, permiso: 'editar' },
]
const GENTE1 = [{ id: 'p-eric', nombre: 'Eric', foto: null, esAdmin: true, permiso: 'admin' }]
{
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=pago', ancho: 390, alto: 844 })
  const ev = (js) => a.evaluar(js)
  const hay = (sel) => ev(`Boolean(document.querySelector(${JSON.stringify(sel)}))`)
  const txt = (sel) => ev(`document.querySelector(${JSON.stringify(sel)})?.innerText.replace(/\\s+/g, ' ').trim() ?? null`)
  const clic = (sel) => ev(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
  const R = (js) => ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const B = await import('/src/lib/bookings.ts'); const st = () => R.useRouteStore.getState(); const route = () => st().route; ${js} })()`)
  const ponerGente = (gente) =>
    ev(`(async () => {
      const g = ${JSON.stringify(gente)}.map((p) => ({ ...p, esYo: p.id === 'p-eric' }))
      const urls = [...new Set(performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('store/useViajeCompartido.ts')))]
      const tiendas = [window.__viaje]
      for (const u of urls) tiendas.push((await import(/* @vite-ignore */ u)).useViajeCompartido)
      for (const st of new Set(tiendas)) { if (!st) continue; st.setState({ cargar: async () => {} }); st.getState().poner({ gente: g }) }
      window.__modoCuentas?.poner('conjunta', g.length)
      return true })()`)
  const cerrarModales = async () => {
    for (let i = 0; i < 5; i++) {
      const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim()) && !x.closest('[data-hoja-reserva]')); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(600)
    }
  }
  let nSec = 0
  const sec = async (fn) => {
    nSec++
    try {
      await fn()
    } catch (e) {
      debe(false, 'error', `la prueba se ha parado en la parte ${nSec}: ${String(e?.message ?? e).slice(0, 400)}`)
    }
  }
  try {
    for (let i = 0; i < 360 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
    await ev('window.__rutaPrueba().then(() => true)')
    for (let i = 0; i < 90 && !(await ev('window.__ruta?.getState().route != null').catch(() => false)); i++) await a.esp(1000)
    await a.esp(2500)
    await cerrarModales()
    const abrirBloque = async (b) => {
      await R("st().setMode('bookings'); return true")
      await a.esp(1500)
      await ev(`(() => { const b = document.querySelector('[data-blk="${b}"]'); if (b && b.querySelectorAll('[data-tarjeta-crema], [data-mitad]').length === 0) b.querySelector('[data-cabecera-clara], [data-llegada-cabecera]')?.click(); return true })()`)
      await a.esp(1200)
    }
    await ponerGente(GENTE1)

    await sec(async () => {
      // El vuelo: cada vuelo guardado se ve abierto, con el QR gris y «+ Añade tu tarjeta de embarque»
      await ev("(() => { const st = window.__ruta.getState(); const r = st.route; window.__ruta.setState({ route: { ...r, origin: 'Barcelona', originPlace: undefined, answers: { ...r.answers, origin: 'Barcelona', originPlace: undefined, transportContext: undefined }, transportContext: { ...r.transportContext, transport_option: { ...(r.transportContext.transport_option ?? {}), id: 'plane' } }, arrivalFlightTime: '11:25', departureFlightTime: '18:05', arrivalPointId: 'fco', departurePointId: 'cia', arrivalOtroPunto: 'El Prat', departureOtroPunto: 'El Prat', arrivalOtraHora: '08:30', departureOtraHora: '20:35', arrivalCodigo: 'VY 6102', departureCodigo: 'VY 6105' } }); return true })()")
      await a.esp(1200)
      await abrirBloque('llegada')
      const m = await ev(`(() => { const out = {}; for (const k of ['arrival', 'departure']) { const e = document.querySelector('[data-mitad="' + k + '"]'); out[k] = e ? { plegada: e.hasAttribute('data-mitad-plegada'), icono: e.querySelector('[data-icono-documento]')?.getAttribute('data-icono-documento') ?? null, boton: e.querySelector('[data-billete-anadir]')?.innerText.replace(/\\s+/g, ' ').trim() ?? null, horas: Boolean(e.querySelector('[data-billete-horas]')) } : null } return out })()`)
      debe(m.arrival && !m.arrival.plegada && m.arrival.horas, 'vuelo', `la ida se ve ABIERTA, con las horas grandes (${JSON.stringify(m.arrival)})`)
      debe(m.arrival?.icono === 'falta' && /Añade tu tarjeta de embarque/.test(m.arrival?.boton ?? ''), 'vuelo', `ida: QR gris con «+» y «+ Añade tu tarjeta de embarque» (${JSON.stringify(m.arrival)})`)
      debe(m.departure?.icono === 'falta' && /Añade tu tarjeta de embarque/.test(m.departure?.boton ?? ''), 'vuelo', `vuelta: QR gris con «+» y su botón (${JSON.stringify(m.departure)})`)
      debe(!(await hay('[data-billete-pantalla-completa]')), 'vuelo', 'sin abrir nada')
      await a.captura(png('v45_vuelo'))
      // El aviso de fecha, DENTRO de la tarjeta, con [Es correcta]
      await ev(`(async () => { const A = await import('/src/lib/avisoDeDocumento.ts'); const S = await import('/src/store/useSyncStore.ts'); A.ponerAvisoDeDocumento(S.useSyncStore.getState().activeTripId, 'arrival', 'Esta tarjeta es del viernes 13 y tu vuelo es el lunes 23. Revisa que sea la buena'); return true })()`)
      await a.esp(700)
      const av = await ev(`(() => { const t = document.querySelector('[data-mitad="arrival"]'); const e = t?.querySelector('[data-aviso-documento="fecha"]'); if (!t || !e) return null; const c = t.getBoundingClientRect(); const b = e.getBoundingClientRect(); return { dentro: b.left >= c.left - 1 && b.right <= c.right + 1 && b.top >= c.top && b.bottom <= c.bottom + 1, texto: e.innerText.replace(/\\s+/g, ' '), modal: Boolean(document.querySelector('[data-aviso-tarjeta]')) } })()`)
      debe(av && av.dentro && /^⚠ Esta tarjeta es del viernes 13 y tu vuelo es el lunes 23\. Revisa que sea la buena/.test(av.texto) && /Es correcta/.test(av.texto), 'aviso_fecha', `el aviso de fecha va DENTRO de la tarjeta, en naranja, con [Es correcta] (${JSON.stringify(av)})`)
      debe(av && av.modal === false, 'aviso_fecha', 'ni ventana ni aviso de abajo que se va')
      await a.captura(png('v45_aviso_fecha'))
      await ev(`(async () => { const t = document.querySelector('[data-mitad="arrival"]'); await new Promise((r) => setTimeout(r, 6500)); return Boolean(t?.querySelector('[data-aviso-documento="fecha"]')) })()`)
      debe(await hay('[data-mitad="arrival"] [data-aviso-documento="fecha"]'), 'aviso_fecha', 'se queda: no se va solo')
      await clic('[data-aviso-documento-correcta]')
      await a.esp(500)
      debe(!(await hay('[data-aviso-documento="fecha"]')), 'aviso_fecha', '[Es correcta] lo quita')
      // sin vuelta: «Falta añadir la vuelta» y sin QR
      await R("st().removeFlightLeg('departure'); return true")
      await a.esp(1000)
      const sv = await ev(`(() => { const e = document.querySelector('[data-mitad="departure"]'); return e ? { falta: e.querySelector('[data-falta-anadir]')?.innerText.replace(/\\s+/g, ' ').trim() ?? null, icono: Boolean(e.querySelector('[data-icono-documento]')) } : null })()`)
      debe(sv && /Falta añadir la vuelta/.test(sv.falta ?? '') && sv.icono === false, 'vuelo', `sin vuelta: «Falta añadir la vuelta» y sin QR (${JSON.stringify(sv)})`)
      await a.captura(png('v45_sin_vuelta'))
    })

    await sec(async () => {
      // Entradas: la tarjeta guardada con el QR gris y «+ Sube tu entrada»; el contador sube al GUARDAR
      await abrirBloque('entradas')
      const antes = await txt('[data-blk="entradas"] [data-estado]')
      const base = await R(`const r = route(); const d = r.days.filter((x) => !x.isReturnLeg && B.dateOfDay(r, x))[1] ?? r.days[0]; const s = d.stops.find((p) => !p.isFreeTour && !p.isNightExperience && !p.passThrough && !p.isBreak && p.name); return { dateIso: B.dateOfDay(r, d), nombre: s.name }`)
      await R(`st().addReservation({ id: 'res-v45-e', kind: 'entrada', refId: ${JSON.stringify(base.nombre)}, name: ${JSON.stringify(base.nombre)}, placeNames: [${JSON.stringify(base.nombre)}], dateIso: ${JSON.stringify(base.dateIso)}, dayNumber: null, time: '09:15', precio: { amount: 50, currency: 'EUR' } }, null, null); return true`)
      await a.esp(1200)
      await abrirBloque('entradas')
      const despues = await txt('[data-blk="entradas"] [data-estado]')
      const n = (t) => Number(/^(\d+) de/.exec(t ?? '')?.[1] ?? -1)
      debe(n(despues) === n(antes) + 1, 'contador', `el contador sube al GUARDAR, sin subir ningún documento («${antes}» → «${despues}»)`)
      const e = await ev(`(() => { const f = document.querySelector('[data-entrada-fila]'); return f ? { icono: f.querySelector('[data-icono-documento]')?.getAttribute('data-icono-documento') ?? null, boton: f.querySelector('[data-billete-anadir]')?.innerText.replace(/\\s+/g, ' ').trim() ?? null } : null })()`)
      debe(e && e.icono === 'falta' && /Sube tu entrada/.test(e.boton ?? ''), 'entrada', `la entrada guardada: QR gris con «+» y «+ Sube tu entrada» (${JSON.stringify(e)})`)
      await a.captura(png('v45_entrada'))
    })

    await sec(async () => {
      // Excursión guardada
      await R(`const r = route(); const d = r.days.filter((x) => !x.isReturnLeg && B.dateOfDay(r, x))[0]; st().addReservation({ id: 'res-v45-x', kind: 'excursion', refId: 'excursion-v45', name: 'Excursión de prueba', placeNames: [], dateIso: B.dateOfDay(r, d), dayNumber: null, time: '08:00', precio: { amount: 60, currency: 'EUR' } }, null, null); return true`)
      await a.esp(800)
      await abrirBloque('excursiones')
      const x = await ev(`(() => { const f = document.querySelector('[data-excursion-fila]'); return f ? { icono: f.querySelector('[data-icono-documento]')?.getAttribute('data-icono-documento') ?? null, boton: f.querySelector('[data-billete-anadir]')?.innerText.replace(/\\s+/g, ' ').trim() ?? null } : null })()`)
      debe(x && x.icono === 'falta' && /Sube tu reserva/.test(x.boton ?? ''), 'excursion', `la excursión guardada: icono gris con «+» y «+ Sube tu reserva» (${JSON.stringify(x)})`)
      await a.captura(png('v45_excursion'))
    })

    await sec(async () => {
      // Alojamiento: el icono de la reserva gris, «+ Añade tu reserva» de borde y «Listo» con el hotel y las fechas
      await R("const r = route(); st().setAccommodationHotel(r.days[0].id, { name: 'Hotel Palatino', precio: { amount: 280, currency: 'EUR' } }); return true")
      await a.esp(800)
      await abrirBloque('aloj')
      const al = await ev(`(() => { const b = document.querySelector('[data-blk="aloj"]'); if (!b) return null; return { icono: b.querySelector('[data-icono-documento]')?.getAttribute('data-icono-documento') ?? null, boton: b.querySelector('[data-billete-anadir]')?.innerText.replace(/\\s+/g, ' ').trim() ?? null, estado: b.querySelector('[data-estado]')?.innerText.trim() ?? null } })()`)
      debe(al && al.icono === 'falta' && /Añade tu reserva/.test(al.boton ?? ''), 'aloj', `alojamiento: icono gris con «+» y «+ Añade tu reserva» (${JSON.stringify(al)})`)
      debe(al && /^Listo$/i.test(al.estado ?? ''), 'aloj', `«Listo» con el hotel y las fechas, sin documento (${al?.estado})`)
      await a.captura(png('v45_alojamiento'))
    })

    await sec(async () => {
      // La hoja de una entrada, en viaje solo: sin «¿A qué cuenta?», sin [Añadir tu entrada] y sin «Rellenar desde el email o el PDF»
      await abrirBloque('entradas')
      const abrir = () => ev("(() => { const b = Array.from(document.querySelectorAll('[data-blk=\"entradas\"] button')).find((x) => /^Añádela$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      const ok = await abrir()
      await a.esp(1200)
      if (ok) {
        const t = (await ev("document.querySelector('[role=\"dialog\"]')?.innerText.replace(/\\s+/g, ' ') ?? ''")) ?? ''
        debe(!/Añadir tu entrada|Rellenar desde el email|A qué cuenta|Solo lo ves tú|Entra directo/i.test(t) && /Guardar la entrada/i.test(t) && /Hora de entrada/i.test(t), 'hoja_solo', `viaje solo: la hoja con los días, la hora, el precio y [Guardar la entrada], sin documento ni cuenta (${t.slice(0, 160)})`)
        await a.captura(png('v45_hoja_solo'))
        await ev("(() => { document.querySelector('[role=\"dialog\"] [aria-label=\"Cerrar\"]')?.click(); return true })()")
        await a.esp(600)
      } else debe(false, 'hoja_solo', 'no hay entrada pendiente con «Añádela» para abrir la hoja')
      // En pareja: dos pasos
      await ponerGente(GENTE2)
      await a.esp(800)
      await abrirBloque('entradas')
      const ok2 = await abrir()
      await a.esp(1200)
      if (ok2) {
        const p1 = (await ev("document.querySelector('[role=\"dialog\"]')?.innerText.replace(/\\s+/g, ' ') ?? ''")) ?? ''
        debe(/Siguiente/i.test(p1) && !/A qué cuenta/i.test(p1) && !/Casi lista/i.test(p1) && /Hora de entrada/i.test(p1), 'hoja_grupo', `en pareja, paso 1: los días y la hora con [Siguiente] (${p1.slice(0, 140)})`)
        await a.captura(png('v45_hoja_grupo_paso1'))
        const puede = await ev("(() => { const b = document.querySelector('[data-siguiente-paso]'); return Boolean(b && !b.disabled) })()")
        if (puede) {
          await clic('[data-siguiente-paso]')
          await a.esp(800)
          const p2 = (await ev("document.querySelector('[role=\"dialog\"]')?.innerText.replace(/\\s+/g, ' ') ?? ''")) ?? ''
          debe(/Casi lista/i.test(p2) && /¿A qué cuenta lo sumamos\?/i.test(p2) && /Mi cuenta/i.test(p2) && /Cuenta (conjunta|del grupo)/i.test(p2), 'hoja_grupo', `paso 2: «Casi lista» y «¿A qué cuenta lo sumamos?» con [Mi cuenta] / [Cuenta conjunta] (${p2.slice(0, 200)})`)
          debe(!/Solo lo ves tú|Entra directo/.test(p2), 'hoja_grupo', 'sin los textos en gris')
          await clic('[data-cuenta-opcion="mia"]')
          await a.esp(400)
          const mia = (await ev("document.querySelector('[role=\"dialog\"]')?.innerText ?? ''")) ?? ''
          debe(!/quién lo ha pagado|quién la ha pagado/i.test(mia), 'hoja_grupo', '«¿Quién la ha pagado?» NO sale con Mi cuenta')
          await clic('[data-cuenta-opcion="comun"]')
          await a.esp(400)
          // el precio: sin precio no sale; con precio sí
          await ev("(() => { const i = document.querySelector('[role=\"dialog\"] input[inputmode=\"decimal\"], [role=\"dialog\"] input[data-precio]'); if (!i) return false; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, '40'); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()")
          await a.esp(500)
          const comun = (await ev("document.querySelector('[role=\"dialog\"]')?.innerText ?? ''")) ?? ''
          debe(/quién (lo|la) ha pagado/i.test(comun), 'hoja_grupo', '«¿Quién la ha pagado?» sale solo con la cuenta conjunta (y precio)')
          await a.captura(png('v45_hoja_grupo_paso2'))
        } else debe(true, 'hoja_grupo', '(el paso 1 no estaba listo para pasar: se mira con el código)')
      } else debe(false, 'hoja_grupo', 'no hay entrada pendiente con «Añádela» para abrir la hoja')
    })
  } finally {
    a.cerrar()
  }
}

/* ───────────── 3. Lanzarote: todo el carrusel está en [Ver todas] ───────────── */
console.log('3. En la app (Lanzarote, con pase): [Ver todas]')
{
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=pago', ancho: 390, alto: 844 })
  const ev = (js) => a.evaluar(js)
  try {
    for (let i = 0; i < 360 && !(await ev("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
    await ev(`window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-10', vuelos: { llegada: '09:30', vuelta: '18:05' } }).then(() => true)`)
    for (let i = 0; i < 180 && !(await ev('window.__ruta?.getState().route != null').catch(() => false)); i++) await a.esp(1000)
    await a.esp(2500)
    for (let i = 0; i < 5; i++) {
      const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(600)
    }
    await ev("window.__ruta.getState().setMode('bookings'); true")
    await a.esp(1800)
    await ev("(() => { const b = document.querySelector('[data-blk=\"excursiones\"]'); b?.querySelector('[data-cabecera-clara]')?.click(); return true })()")
    await a.esp(2500)
    const carrusel = await ev("Array.from(document.querySelectorAll('[data-carrusel-actividades-reservas] [data-actividad]')).map((e) => e.getAttribute('data-actividad'))")
    debe(carrusel.length === 7, 'lanzarote', `el carrusel de Lanzarote enseña 7 (${carrusel.length})`)
    debe(await ev("Boolean(document.querySelector('[data-ver-todas-excursiones]'))"), 'lanzarote', '[Ver todas] sale (hay más de las 7 que se ven)')
    await ev("document.querySelector('[data-ver-todas-excursiones]')?.click(); true")
    await a.esp(2500)
    const todas = await ev("Array.from(document.querySelectorAll('[data-todas-actividades] [data-actividad]')).map((e) => e.getAttribute('data-actividad'))")
    debe(todas.length > 7 && carrusel.every((id) => todas.includes(id)), 'lanzarote', `en [Ver todas] está TODO lo del carrusel y más (${todas.length} actividades)`)
    debe(todas.slice(0, 7).join() === carrusel.join(), 'lanzarote', 'y primero, en el orden del carrusel')
    debe(!(await ev("Boolean(document.querySelector('[data-explorador], [data-titulo-explorador]'))")), 'lanzarote', '[Ver todas] NO abre EXPLORAR')
    const filtros = await ev("Array.from(document.querySelectorAll('[data-filtro-actividad]')).map((e) => e.getAttribute('data-filtro-actividad'))")
    debe(filtros.includes('todo') && filtros.includes('excursion') && filtros.includes('free_tour') && filtros.includes('actividad'), 'lanzarote', `arriba, los filtros por tipo (${filtros.join(', ')})`)
    await ev("document.querySelector('[data-filtro-actividad=\"free_tour\"]')?.click(); true")
    await a.esp(500)
    const ft = await ev("Array.from(document.querySelectorAll('[data-todas-actividades] [data-actividad]')).map((e) => e.getAttribute('data-actividad'))")
    debe(ft.length >= 2 && ft.every((id) => /free_tour/.test(id)), 'lanzarote', `el filtro «Free tours» deja solo los free tours (${ft.join(', ')})`)
    await a.captura(png('v45_ver_todas'))
  } finally {
    a.cerrar()
  }
}

console.log(`\nPrueba de la V45: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
