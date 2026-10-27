// La prueba de la Tanda 10N4, parte G4: el aviso de «cierra» al añadir un sitio (sin botones, en rojo, con su concordancia), la cabecera de la ficha con el corazón, la pestaña Entradas con LO TUYO ARRIBA
// (azul oscuro con dorado si otro del grupo la tiene; verde si la tienes tú, sin «Fijada») y el botón redondo de la entrada en la tarjeta de DÍAS (frambuesa con numerito / verde con ✓, sin palabras,
// sin tapar las etiquetas). Los tres colores: frambuesa = te falta · verde = ya lo tienes · azul oscuro con dorado = otro del grupo la tiene.
// Hace falta el servidor y la app (abre un Chrome sin ventana: scripts/destino/_enLaApp.mjs). Capturas en docs/dias/capturas_jutrip/10n4_entradas_*.jpg y 10n4_cierra_*.jpg.
//   APP_URL=http://localhost:5185 API_URL=http://localhost:8855 node scripts/destino/pruebaTanda10N4_entradas.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarDesign } from './capturaDesign.mjs'

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
const APP = process.env.APP_URL ?? 'http://localhost:5173'

/* ───────────────────────── 1. Lo que se ve en el código ───────────────────────── */
{
  const hoja = sinComentarios(leer('src/components/route/freeDay/AddToDaySheet.tsx'))
  debe(!/Ponerlo|Dejarlo|data-poner-otro-dia|data-dejarlo-igual/.test(hoja), 'cierra', 'la hoja de añadir ya no lleva [Ponerlo el …] ni [Dejarlo … igual]')
  debe(!/otroDiaAbierto/.test(hoja), 'cierra', 'ni propone otro día')
  const boton = sinComentarios(leer('src/components/route/reservas/EntradaEdgeTab.tsx'))
  debe(!/Reservada ✓|Comprar entrada/.test(boton), 'boton', 'el botón de la entrada de DÍAS no lleva palabras («Reservada ✓», «Comprar entrada»)')
  const reserva = sinComentarios(leer('src/components/route/reservas/StopReservation.tsx'))
  debe(!/Fijada/.test(reserva) && !/FichaTuEntrada/.test(reserva), 'ficha', 'la pestaña Entradas ya no lleva la etiqueta «Fijada»')
  const cabecera = sinComentarios(leer('src/components/ui/MeGusta.tsx'))
  debe(/variante === 'cabecera'/.test(cabecera), 'ficha', 'el corazón de la cabecera de la ficha es una variante de la pieza única de «me gusta»')
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
const preparar = async (a) => {
  for (let intento = 0; intento < 3; intento++) {
    for (let i = 0; i < 240 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
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
  await a.evaluar("Promise.all([import('/src/store/useResumenVueloStore.ts'), import('/src/store/useViajeCompartido.ts'), import('/src/store/useMisReservas.ts')]).then(() => true)")
  await a.esp(2500)
  for (let i = 0; i < 6; i++) {
    const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await a.esp(600)
  }
}
const GENTE = [
  { id: 'p-eric', nombre: 'Eric', foto: null, esAdmin: true, permiso: 'admin' },
  { id: 'p-ana', nombre: 'Ana', foto: null, esAdmin: false, permiso: 'recomendar' },
  { id: 'p-luis', nombre: 'Luis', foto: null, esAdmin: false, permiso: 'recomendar' },
]
/** Quién soy: 'eric' (dueño) o 'ana' / 'luis' (invitados); '' = viaje sin compartir. */
const ponerGente = (a, yo) =>
  a.evaluar(`(async () => {
    const yo = ${JSON.stringify(yo)}
    const g = ${JSON.stringify(GENTE)}.map((p) => ({ ...p, esYo: p.id === 'p-' + yo }))
    sessionStorage.removeItem('trazo:invitado')
    sessionStorage.removeItem('trazo:permiso')
    if (yo && yo !== 'eric') { sessionStorage.setItem('trazo:invitado', '1'); sessionStorage.setItem('trazo:permiso', 'recomendar') }
    const urls = [...new Set(performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('store/useViajeCompartido.ts')))]
    const tiendas = [window.__viaje]
    for (const u of urls) tiendas.push((await import(/* @vite-ignore */ u)).useViajeCompartido)
    for (const st of new Set(tiendas)) {
      if (!st) continue
      st.setState({ cargar: async () => {} })
      st.getState().poner({ gente: yo ? g : [] })
    }
    return true
  })()`)

/** Pone o quita la entrada del Coliseo del dueño (para quién: ids). Devuelve el día en palabras y la hora corta. */
const entradaDelDueno = (a, paraQuien, quitar = false) =>
  a.evaluar(`(async () => {
    const { useRouteStore } = await import('/src/store/useRouteStore.ts')
    const b = await import('/src/lib/bookings.ts')
    const { fetchDestinationExcursions } = await import('/src/lib/destinationExcursions.ts')
    const { diaProsa } = await import('/src/lib/nombreDeDia.ts')
    const s = useRouteStore.getState()
    s.reservations.filter((r) => /Coliseo/.test(r.refId)).forEach((r) => s.removeReservation?.(r.id))
    if (${quitar}) return null
    const info = await fetchDestinationExcursions('Roma')
    const dia = s.route.days.find((d) => d.stops.some((x) => x.name === 'Coliseo'))
    const base = b.entranceTargetFor('Coliseo', info.entradas)
    const res = { id: 'res-coliseo-prueba', kind: 'entrada', ...base, dateIso: b.dateOfDay(s.route, dia), dayNumber: dia.dayNumber, time: '11:45', paraQuien: ${JSON.stringify(paraQuien)} }
    useRouteStore.getState().addReservation(res)
    return { dia: diaProsa(s.route, dia.dayNumber), dayId: dia.id }
  })()`)

const irADias = async (a, dayNumber) => {
  await a.evaluar("window.__ruta.getState().setMode('days'); true")
  await a.esp(1200)
  await a.evaluar(`(async () => { const { useRouteStore } = await import('/src/store/useRouteStore.ts'); const s = useRouteStore.getState(); const d = s.route.days.find((x) => x.dayNumber === ${dayNumber}); s.setActiveDayId?.(d.id); return true })()`)
  await a.esp(1500)
}
/** El botón de la entrada de la tarjeta de una parada: lo que es, cuántos y qué hay dentro. */
const botonDe = (a, nombre) =>
  a.evaluar(`(() => {
    const tit = Array.from(document.querySelectorAll('span.font-display')).find((x) => x.textContent === ${JSON.stringify(nombre)})
    const tarjeta = tit?.closest('div.relative.flex')
    const b = tarjeta?.querySelector('[data-boton-entrada]')
    if (!tarjeta) return { tarjeta: false }
    tarjeta.scrollIntoView({ block: 'center' })
    if (!b) return { tarjeta: true, boton: null, texto: null }
    const r = b.getBoundingClientRect()
    const e = getComputedStyle(b)
    const insignia = b.querySelector('span')
    const solapadas = Array.from(tarjeta.querySelectorAll('[data-etiquetas-tarjeta] > span, [data-etiquetas-tarjeta] > *')).filter((x) => { const q = x.getBoundingClientRect(); return q.width > 0 && q.right > r.left && q.left < r.right && q.bottom > r.top && q.top < r.bottom }).length
    return { tarjeta: true, boton: b.dataset.botonEntrada, cuantos: b.dataset.cuantos ?? null, texto: (b.textContent || '').trim(), ancho: Math.round(r.width), alto: Math.round(r.height), derecha: Math.round(tarjeta.getBoundingClientRect().right - r.right), abajo: Math.round(tarjeta.getBoundingClientRect().bottom - r.bottom), fondo: e.backgroundImage, insignia: insignia ? { texto: (insignia.textContent || '').trim(), tieneCheck: Boolean(insignia.querySelector('svg')) } : null, solapadas, etiquetas: Array.from(tarjeta.querySelectorAll('[data-etiquetas-tarjeta] > *')).length, textoTarjeta: tarjeta.innerText.replace(/\\s+/g, ' ') }
  })()`)
const abrirFichaEntradas = async (a, nombre) => {
  await a.evaluar(`(() => { const tit = Array.from(document.querySelectorAll('span.font-display')).find((x) => x.textContent === ${JSON.stringify(nombre)}); tit.closest('div.relative.flex').querySelector('[data-boton-entrada]').click(); return true })()`)
  await a.esp(2500)
}
const cerrarFicha = async (a) => {
  await a.evaluar("(() => { const b = document.querySelector('button[aria-label=\"Volver\"]'); b?.click(); return true })()")
  await a.esp(900)
}
/** Lo de arriba de la pestaña Entradas: el primer hijo de la columna y su aspecto. */
const entradasAbiertas = (a) =>
  a.evaluar(`(() => {
    const panel = document.querySelector('[data-ficha-panel]')
    const tabs = panel?.querySelector('[data-ficha-pestanas]')
    const columna = tabs?.parentElement
    if (!columna) return null
    const todos = Array.from(columna.children)
    const hijos = todos.slice(todos.indexOf(tabs) + 1).filter((c) => c.getBoundingClientRect().height > 0)
    const primeros = hijos.slice(0, 3)
    const caja = columna.querySelector('[data-ficha-seccion="tu-entrada"], [data-ficha-seccion="entrada-del-grupo"]')
    const est = caja ? getComputedStyle(caja) : null
    const dorado = columna.querySelector('[data-cuando]')
    return {
      tipoCaja: caja?.dataset.fichaSeccion ?? null,
      esLaPrimera: Boolean(caja) && hijos[0]?.contains(caja),
      texto: caja ? caja.innerText.replace(/\\s+/g, ' ').trim() : null,
      fondo: est?.backgroundImage !== 'none' ? est?.backgroundImage : est?.backgroundColor,
      colorDorado: dorado ? getComputedStyle(dorado).color : null,
      hora: columna.querySelector('[data-tu-hora]')?.textContent ?? null,
      botones: caja ? Array.from(caja.querySelectorAll('button')).map((b) => (b.textContent || '').trim()) : [],
      primerosTextos: primeros.map((c) => c.innerText.replace(/\\s+/g, ' ').slice(0, 60)),
      fijada: /Fijada/.test(columna.innerText),
      topCaja: caja ? Math.round(caja.getBoundingClientRect().top - tabs.getBoundingClientRect().bottom) : null,
      entradasParaComprar: Array.from(columna.querySelectorAll('button')).filter((b) => /^Reservar$/.test((b.textContent || '').trim())).length,
      alto: window.innerHeight,
      bajoElPliegue: caja ? caja.getBoundingClientRect().bottom > window.innerHeight : null,
    }
  })()`)

/* ───────────────────────── 2. El aviso de que cierra: la concordancia ───────────────────────── */
{
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
  try {
    await preparar(a)
    const frases = await a.evaluar("import('/src/lib/articulos.ts').then((m) => [m.cierraElSitio('Museos Capitolinos'), m.cierraElSitio('Galería Borghese'), m.cierraElSitio('Termas de Caracalla'), m.cierraElSitio('Trastevere'), m.cierraElSitio('Coliseo')])")
    debe(frases[0] === 'cierran los Museos Capitolinos', 'concordancia', `plural: «${frases[0]}»`)
    debe(frases[1] === 'cierra la Galería Borghese', 'concordancia', `femenino singular: «${frases[1]}»`)
    debe(frases[2] === 'cierran las Termas de Caracalla', 'concordancia', `femenino plural: «${frases[2]}»`)
    debe(frases[3] === 'cierra Trastevere', 'concordancia', `sin artículo: «${frases[3]}»`)
    debe(frases[4] === 'cierra el Coliseo', 'concordancia', `masculino singular: «${frases[4]}»`)
  } finally {
    a.cerrar()
  }
}

/* ───────────────────────── 3. La ficha y la tarjeta de DÍAS ───────────────────────── */
{
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
  try {
    await preparar(a)
    await ponerGente(a, '')

    /* — Sin entrada y sin compartir: botón frambuesa, sin numerito, sin palabras — */
    await irADias(a, 3)
    let b = await botonDe(a, 'Coliseo')
    debe(b.tarjeta && b.boton === 'falta' && b.texto === '', 'boton', `sin entrada: el botón de la tarjeta es frambuesa y sin palabras (${JSON.stringify({ boton: b.boton, texto: b.texto })})`)
    debe(b.ancho === 40 && b.alto === 40 && b.derecha >= 12 && b.derecha <= 13 && b.abajo >= 12 && b.abajo <= 13, 'boton', `redondo de 40 px, a 12 px del borde (${b.ancho}x${b.alto}, derecha ${b.derecha}, abajo ${b.abajo})`)
    debe(/oklch|rgb\(/.test(b.fondo ?? '') && !/63, 160, 102/.test(b.fondo ?? ''), 'colores', `y en frambuesa (${(b.fondo ?? '').slice(0, 80)})`)
    debe(!b.insignia, 'boton', 'sin numerito (nadie del grupo la tiene)')
    debe(!/Comprar entrada|Reservada/.test(b.textoTarjeta), 'boton', `ni «Comprar entrada» ni «Reservada» en la tarjeta (${b.textoTarjeta})`)
    await a.captura(path.join(SALIDA, '10n4_entradas_dias_falta.jpg'))

    /* — La cabecera de la ficha (Ficha Cabecera 01 y 02) — */
    await abrirFichaEntradas(a, 'Coliseo')
    const cab = await a.evaluar(`(() => {
      const c = document.querySelector('[data-ficha-cabecera]')
      if (!c) return null
      const foto = c.firstElementChild.getBoundingClientRect()
      const h1 = c.querySelector('h1')
      const corazon = c.querySelector('[data-megusta="cabecera"]')
      const camara = c.querySelector('button[aria-label*="foto" i]')
      const cs = camara ? camara.getBoundingClientRect() : null
      const pildoras = Array.from(c.querySelectorAll('[data-etiqueta-ficha]')).map((p) => ({ alto: Math.round(p.getBoundingClientRect().height), texto: p.innerText.trim(), fuente: getComputedStyle(p).fontSize }))
      return {
        foto: Math.round(foto.width) + 'x' + Math.round(foto.height),
        h1: { fuente: getComputedStyle(h1).fontSize, familia: getComputedStyle(h1).fontFamily.slice(0, 30) },
        corazon: corazon ? { ancho: Math.round(corazon.getBoundingClientRect().width), numero: corazon.querySelector('[data-megusta-numero]')?.textContent ?? null, pulsado: corazon.getAttribute('aria-pressed'), fondo: getComputedStyle(corazon).backgroundColor } : null,
        camara: cs ? { ancho: Math.round(cs.width), alto: Math.round(cs.height) } : null,
        pildoras,
        lo_recomiendan: /lo recomiendan/.test(c.innerText),
        derechaDelNombre: corazon ? corazon.getBoundingClientRect().left > h1.getBoundingClientRect().left : null,
      }
    })()`)
    debe(cab && cab.foto === '118x118', 'cabecera', `la foto de 118 x 118 (${cab?.foto})`)
    debe(cab && cab.h1.fuente === '33px', 'cabecera', `el nombre en 33 px (${cab?.h1.fuente})`)
    debe(cab && cab.pildoras.length >= 1 && cab.pildoras.every((p) => p.alto === 30 && p.fuente === '13px'), 'cabecera', `las pastillas de 30 px de alto y 13 px de letra (${JSON.stringify(cab?.pildoras)})`)
    debe(cab && cab.camara && cab.camara.ancho >= 40 && cab.camara.alto >= 40, 'cabecera', `la cámara de 40 px en la esquina de la foto (${JSON.stringify(cab?.camara)})`)
    debe(cab && !cab.lo_recomiendan, 'cabecera', 'ya no dice «lo recomiendan»')
    if (cab?.corazon) {
      debe(cab.corazon.ancho === 56 && cab.derechaDelNombre && /^\d/.test(cab.corazon.numero ?? ''), 'cabecera', `el corazón de 56 px a la derecha del nombre con su número (${JSON.stringify(cab.corazon)})`)
      const antes = Number((cab.corazon.numero ?? '0').replace('.', ''))
      await a.captura(path.join(SALIDA, '10n4_entradas_cabecera_01.jpg'))
      await a.evaluar("document.querySelector('[data-megusta=\"cabecera\"]').click(); true")
      await a.esp(900)
      const lleno = await a.evaluar(`(() => { const c = document.querySelector('[data-megusta="cabecera"]'); return { numero: c.querySelector('[data-megusta-numero]').textContent, pulsado: c.getAttribute('aria-pressed'), fondo: getComputedStyle(c).backgroundColor } })()`)
      debe(Number(lleno.numero.replace('.', '')) === antes + 1 && lleno.pulsado === 'true', 'cabecera', `al tocarlo sube de ${antes} a ${antes + 1} (${lleno.numero})`)
      debe(/oklch\(0\.55 0\.17 5|rgb\(1[78]\d, 5\d, \d+\)/.test(lleno.fondo), 'colores', `y se llena en frambuesa (${lleno.fondo})`)
      await a.captura(path.join(SALIDA, '10n4_entradas_cabecera_02.jpg'))
      await a.evaluar("document.querySelector('[data-megusta=\"cabecera\"]').click(); true")
      await a.esp(900)
      const vacio = await a.evaluar(`(() => { const c = document.querySelector('[data-megusta="cabecera"]'); return { numero: c.querySelector('[data-megusta-numero]').textContent, pulsado: c.getAttribute('aria-pressed') } })()`)
      debe(Number(vacio.numero.replace('.', '')) === antes && vacio.pulsado === 'false', 'cabecera', `al volver a tocarlo se quita y vuelve a ${antes} (${vacio.numero})`)
    } else {
      debe(false, 'cabecera', 'el corazón no sale en la ficha del Coliseo (¿no cargó el catálogo?)')
    }
    const sinEntrada = await entradasAbiertas(a)
    debe(sinEntrada && sinEntrada.tipoCaja === null && sinEntrada.entradasParaComprar >= 1, 'entradas', 'sin entrada de nadie: la pestaña enseña las entradas para comprar y ningún recuadro de arriba')
    await a.captura(path.join(SALIDA, '10n4_entradas_ficha_sin_entrada.jpg'))
    await cerrarFicha(a)

    /* — Dueño con su entrada (Eric): verde con ✓, «Tu entrada» arriba del todo — */
    const dueno = await entradaDelDueno(a, ['p-eric', 'p-ana'])
    await a.esp(1200)
    await ponerGente(a, 'eric')
    await a.esp(1200)
    b = await botonDe(a, 'Coliseo')
    debe(b.boton === 'tengo' && b.texto === '', 'boton', `con su entrada: el botón es verde y sin palabras (${JSON.stringify({ boton: b.boton, texto: b.texto })})`)
    debe(b.insignia && b.insignia.tieneCheck, 'boton', 'con el ✓ en un circulito blanco arriba a la derecha')
    debe(/63, 160, 102/.test(b.fondo ?? ''), 'colores', `en verde (${(b.fondo ?? '').slice(0, 80)})`)
    debe(!/Reservada|Comprar entrada/.test(b.textoTarjeta), 'boton', 'y sin la pastilla «Reservada ✓» en la tarjeta')
    await a.captura(path.join(SALIDA, '10n4_entradas_dias_tengo.jpg'))
    await abrirFichaEntradas(a, 'Coliseo')
    let e = await entradasAbiertas(a)
    debe(e && e.tipoCaja === 'tu-entrada' && e.esLaPrimera, 'entradas', `en la pestaña Entradas, «Tu entrada» es lo primero (${e?.primerosTextos?.[0]})`)
    debe(e && /^TU ENTRADA 11:45 Coliseo · /.test(e.texto ?? '') && e.hora === '11:45', 'entradas', `«Tu entrada», la hora en grande y «Coliseo · día» (${e?.texto})`)
    debe(e && e.botones.join('|') === 'Cambiar hora|Ver entrada', 'entradas', `con [Cambiar hora] y [Ver entrada] (${e?.botones})`)
    debe(e && !e.fijada, 'entradas', 'sin la etiqueta «Fijada»')
    debe(e && /234, 246, 236|rgb\(234, 246, 236\)/.test(e.fondo ?? ''), 'colores', `el recuadro es VERDE (${(e?.fondo ?? '').slice(0, 90)})`)
    debe(e && e.topCaja !== null && e.topCaja < 40 && e.bajoElPliegue === false, 'entradas', `y se ve nada más entrar, sin hacer scroll (a ${e?.topCaja} px de las pestañas)`)
    await a.captura(path.join(SALIDA, '10n4_entradas_ficha_tu_entrada.jpg'))
    // [Cambiar hora] abre la hoja de la reserva.
    await a.evaluar("document.querySelector('[data-cambiar-hora]').click(); true")
    await a.esp(1200)
    const hojaCambiar = await a.evaluar("Boolean(document.querySelector('#add-reservation-heading'))")
    debe(hojaCambiar === true, 'entradas', '[Cambiar hora] abre la hoja de la reserva')
    await a.evaluar("document.querySelector('[aria-labelledby=\"add-reservation-heading\"] button[aria-label=\"Cerrar\"]')?.click(); true")
    await a.esp(600)
    await cerrarFicha(a)

    /* — Luis (no incluido): frambuesa con el numerito «2»; en la ficha, azul oscuro con dorado — */
    await ponerGente(a, 'luis')
    await a.esp(1500)
    b = await botonDe(a, 'Coliseo')
    debe(b.boton === 'grupo' && b.cuantos === '2' && b.insignia && b.insignia.texto === '2' && b.texto === '2', 'boton', `si otros la tienen, frambuesa con el numerito de cuántos (${JSON.stringify({ boton: b.boton, cuantos: b.cuantos, insignia: b.insignia })})`)
    debe(!/63, 160, 102/.test(b.fondo ?? ''), 'colores', 'y sigue en frambuesa (no verde)')
    await a.captura(path.join(SALIDA, '10n4_entradas_dias_grupo.jpg'))
    await abrirFichaEntradas(a, 'Coliseo')
    e = await entradasAbiertas(a)
    debe(e && e.tipoCaja === 'entrada-del-grupo' && e.esLaPrimera, 'entradas', `otro del grupo la tiene: el recuadro azul oscuro es lo primero (${e?.primerosTextos?.[0]})`)
    debe(e && /^Eric la tiene para el .+ · 11:45 Reservar la mía a la misma hora ¿Ya la tienes\? Ya la tengo$/.test(e.texto ?? ''), 'entradas', `«Eric la tiene para el … · 11:45», [Reservar la mía a la misma hora] y «¿Ya la tienes? Ya la tengo» (${e?.texto})`)
    debe(e && /28, 34, 48/.test(e.fondo ?? '') && /233, 199, 122/.test(e.colorDorado ?? ''), 'colores', `azul oscuro con el día y la hora en dorado (${e?.fondo} · ${e?.colorDorado})`)
    debe(e && e.topCaja !== null && e.topCaja < 40 && e.bajoElPliegue === false, 'entradas', `y se ve nada más entrar (a ${e?.topCaja} px de las pestañas)`)
    await a.captura(path.join(SALIDA, '10n4_entradas_ficha_del_grupo.jpg'))
    await cerrarFicha(a)

    /* — Ana (incluida): verde, igual que la del dueño pero sin [Cambiar hora] — */
    await ponerGente(a, 'ana')
    await a.esp(1500)
    b = await botonDe(a, 'Coliseo')
    debe(b.boton === 'tengo' && b.insignia?.tieneCheck, 'boton', 'quien está incluido en la del dueño la ve verde con ✓')
    await abrirFichaEntradas(a, 'Coliseo')
    e = await entradasAbiertas(a)
    debe(e && e.tipoCaja === 'tu-entrada' && e.botones.join('|') === 'Ver entrada', 'entradas', `la incluida ve «Tu entrada» sin [Cambiar hora], que no es suya (${e?.botones})`)
    await cerrarFicha(a)
    await entradaDelDueno(a, null, true)

    /* — Las etiquetas nunca pasan por debajo del botón: se miran todas las paradas del día 3 y 1 — */
    await ponerGente(a, '')
    for (const dia of [1, 2, 3]) {
      await irADias(a, dia)
      const solap = await a.evaluar(`(() => {
        const out = []
        for (const t of document.querySelectorAll('[data-boton-entrada]')) {
          const tarjeta = t.closest('div.relative.flex')
          const r = t.getBoundingClientRect()
          const nombre = tarjeta.querySelector('span.font-display')?.textContent
          const hijos = Array.from(tarjeta.querySelectorAll('[data-etiquetas-tarjeta] *, .font-display')).filter((x) => x !== t && !t.contains(x))
          for (const x of hijos) {
            const q = x.getBoundingClientRect()
            if (q.width > 0 && q.height > 0 && q.right > r.left + 1 && q.left < r.right - 1 && q.bottom > r.top + 1 && q.top < r.bottom - 1) out.push(nombre + ' ← ' + (x.textContent || '').trim().slice(0, 20))
          }
        }
        return { n: document.querySelectorAll('[data-boton-entrada]').length, out }
      })()`)
      debe(solap.out.length === 0, 'solape', `día ${dia}: ${solap.n} botones de entrada y ninguna etiqueta ni nombre por debajo (${solap.out.join(', ')})`)
    }
    // Una parada de etiquetas largas (la de Design, 04): se fuerzan dos etiquetas largas y se mira que bajan de línea.
    await irADias(a, 3)
    await entradaDelDueno(a, ['p-eric'])
    await a.esp(1000)
    const largas = await a.evaluar(`(() => {
      const tit = Array.from(document.querySelectorAll('span.font-display')).find((x) => x.textContent === 'Coliseo')
      const tarjeta = tit.closest('div.relative.flex')
      const fila = tarjeta.querySelector('[data-etiquetas-tarjeta]')
      if (!fila) return { fila: false }
      tarjeta.scrollIntoView({ block: 'center' })
      for (const [i, texto] of ['Monumento histórico', 'Patrimonio UNESCO', 'Anfiteatro romano'].entries()) {
        const s = document.createElement('span')
        s.className = fila.firstElementChild?.className ?? 'inline-flex'
        s.style.background = '#EADFC9'
        s.textContent = texto
        s.dataset.prueba = String(i)
        fila.appendChild(s)
      }
      const b = tarjeta.querySelector('[data-boton-entrada]').getBoundingClientRect()
      const hijos = Array.from(fila.children).map((x) => { const q = x.getBoundingClientRect(); return { t: x.textContent, cortada: q.width < x.scrollWidth - 1, solapa: q.right > b.left + 1 && q.left < b.right - 1 && q.bottom > b.top + 1 && q.top < b.bottom - 1, tope: Math.round(q.top) } })
      return { fila: true, lineas: new Set(hijos.map((h) => h.tope)).size, hijos, alturaTarjeta: Math.round(tarjeta.getBoundingClientRect().height) }
    })()`)
    debe(largas.fila && largas.hijos.every((h) => !h.solapa && !h.cortada) && largas.lineas >= 2, 'solape', `con etiquetas largas bajan a otra línea, sin cortar ni tapar (${JSON.stringify(largas.hijos?.map((h) => [h.t, h.solapa, h.cortada]))}; ${largas.lineas} líneas)`)
    await a.captura(path.join(SALIDA, '10n4_entradas_dias_etiquetas_largas.jpg'))
  } finally {
    a.cerrar()
  }
}

/* ───────────────────────── 4. Las piezas de Design, para ponerlas al lado ───────────────────────── */
if (!process.env.SIN_DESIGN) {
  try {
    await capturarDesign('Piezas/Parada Entrada.dc.html', path.join(SALIDA, '10n4_design_parada_entrada.jpg'), { ancho: 1500, alto: 900 })
    await capturarDesign('Piezas/Ficha Cabecera.dc.html', path.join(SALIDA, '10n4_design_ficha_cabecera.jpg'), { ancho: 1500, alto: 900 })
  } catch (error) {
    console.log('(No se pudo capturar Design:', error.message, ')')
  }
}

/* ───────────────────────── Resultado ───────────────────────── */
for (const f of fallos) console.log(`✗ [${f.regla}] ${f.texto}`)
console.log(`\nPrueba de la Tanda 10N4 (G4, entradas y aviso de cierre): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
