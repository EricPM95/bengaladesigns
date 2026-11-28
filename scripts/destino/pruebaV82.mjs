// V82: «TODOS MIS LOGROS» NUEVO, SUS FICHAS, LAS MARAVILLAS, LOS EXCLUSIVOS Y LA TARJETA PARA PRESUMIR.
//   APP_URL=http://localhost:5173 node scripts/destino/pruebaV82.mjs      (con Vite en 5173; el servidor de la prueba es el de mentira de la demo: no toca Supabase)
// Comprueba: la vitrina solo en lo conseguido (una colección a medias no la ofrece), con la vitrina llena se abre `ElegirHueco`, la animación de las 7 maravillas una sola vez, un exclusivo que ya no se puede
// ganar no sale y uno abierto sale en silueta, y los mismos números en N1 y en la tarjeta para presumir. Un solo Chrome, cerrado al acabar.
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'
import { escenario } from './generarDemoGanados.mjs'
import { construirGanados } from '../../server/logros/pantallas/ganados.js'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const APP = process.env.APP_URL ?? 'http://localhost:5173'

/* 1. El servidor: los exclusivos que aún se pueden ganar */
console.log('1. El servidor (exclusivos abiertos)')
{
  const e = escenario({ completo: true })
  const ganados = (ahora) => construirGanados({ datos: e.datos, catalogos: e.catalogos, items: e.items, cuentan: e.cuentan, viajes: e.viajes, perfil: { vitrina: { baldas: {}, titulo: null } }, ahora: new Date(ahora) })
  const g26 = ganados('2026-10-20T10:00:00Z')
  const abiertos = g26.exclusivos_abiertos ?? []
  debe(abiertos.length > 0 && abiertos.every((x) => x.anio === '2026' && x.hasta === '2026-12-31'), 'abiertos-este-anio', `solo salen las ediciones de este año con su fecha: ${JSON.stringify(abiertos.map((x) => x.clave))}`)
  debe(abiertos.some((x) => x.destino === 'lanzarote') && !abiertos.some((x) => x.destino === 'roma'), 'lo-ganado-no-sale', 'Roma 2026 (ya ganada) no sale como «aún se puede ganar»; Lanzarote 2026 sí')
  debe(abiertos.every((x) => /^Visita .+ en 2026$/.test(x.como)), 'como-se-consigue', `lleva «Visita … en 2026»: ${abiertos[0]?.como}`)
  debe(!abiertos.some((x) => /probador|fundador|pionero/.test(x.clave)), 'solo-las-que-se-pueden-ganar', 'el Probador, el fundador y el pionero nunca salen como abiertos')
  const g27 = ganados('2027-02-03T10:00:00Z')
  debe((g27.exclusivos_abiertos ?? []).every((x) => x.anio === '2027'), 'cerrados-nunca', 'en 2027 la edición de 2026 ya no se puede ganar: no sale')
  debe(g27.exclusivos.some((x) => x.escalon === '2026'), 'tuyos-para-siempre', 'pero la que ya tenías sigue siendo tuya')
}

/* 2. El código: una pieza por tipo de ficha, y lo que no se debe ver */
console.log('2. El código')
{
  const hojas = leer('src/components/logros/pantallas/todos/HojasDeLogros.tsx')
  debe(/FichaAzul/.test(hojas) && /FichaGrande/.test(hojas) && /FichaHoja/.test(hojas), 'tres-fichas', 'tres piezas: FichaGrande (colección y medalla de destino), FichaAzul (exclusivo, maravilla, emblema) y FichaHoja (logro de viajero)')
  const azul = leer('src/components/logros/pantallas/todos/FichaAzul.tsx')
  for (const f of ['FichaAzul', 'FichaHoja', 'Escaparates', 'TodosLista', 'FichaGrande']) {
    const src = leer(`src/components/logros/pantallas/todos/${f}.tsx`)
    const textos = [...src.matchAll(/>([^<>{}\n]{3,})</g)].map((m) => m[1]).concat([...src.matchAll(/'([^'\n]{4,})'/g)].map((m) => m[1]))
    const malos = textos.filter((t) => /\bsello\b/i.test(t) && !/^[a-z_:|.-]+$/.test(t))
    debe(malos.length === 0, 'sin-sello-' + f, `«sello» no sale en los textos de ${f}: ${malos.slice(0, 2)}`)
  }
  const lista = leer('src/components/logros/pantallas/todos/TodosLista.tsx')
  debe(/ChapaDeFila/.test(lista) && !/MedallaDeSiete/.test(lista), 'la-que-toca', 'los logros que cuentan se dibujan con `Chapa` (la medalla de «la que toca», V79), no con un dibujo propio')
  debe(/BloqueMaravillas/.test(lista) && /BloqueExclusivos/.test(lista) && /CabeceraDeColeccion/.test(lista), 'n1-completa', 'N1: cabecera, maravillas y exclusivos')
}

/* 3. En la app */
console.log('3. En la app (un Chrome)')
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago', ancho: 390, alto: 844 })
const J = async (js) => {
  const r = await a.evaluar(js)
  return typeof r === 'string' && /^[[{]/.test(r) ? JSON.parse(r) : r
}
const esperar = async (js, n = 60) => {
  for (let i = 0; i < n; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(250)
  }
  return false
}
const API = "import('/src/components/logros/pantallas/todos/api.ts')"
const PAN = "import('/src/components/logros/pantallas/useLogrosPantallas.ts')"
const ficha = async (clave) => {
  await a.evaluar(`${API}.then((m) => { m.useHojasDeLogros.getState().abrirFicha(${JSON.stringify(clave)}); return true })`)
  await a.esp(900)
}
const cerrarFicha = async () => {
  await a.evaluar(`${API}.then((m) => { m.useHojasDeLogros.getState().cerrarFicha(); return true })`)
  await a.esp(300)
}
const pastillas = () => J("JSON.stringify([...document.querySelectorAll('[data-vitrina-de-ficha]')].map((e) => e.getAttribute('data-vitrina-de-ficha')))")
try {
  await esperar("typeof window.__momentos === 'object'", 120)
  await a.evaluar("window.localStorage.removeItem('jutrip.logros.final_siete_visto'); true")
  await a.evaluar(`${PAN}.then((m) => { m.useLogrosPantallas.getState().abrir({ t: 'todos', pestana: 'todos' }); return true })`)
  debe(await esperar("!!document.querySelector('[data-todos]') && !!document.querySelector('[data-cabecera-de-coleccion]')"), 'n1-abre', 'N1 abre con la cabecera nueva')
  await a.esp(1500)

  /* N1: la cabecera, los botones y los números */
  const n1 = await J("JSON.stringify({ cifras: [...document.querySelectorAll('[data-cabecera-de-coleccion] [data-cifra]')].map((e) => e.getAttribute('data-cifra') + '=' + e.firstElementChild.textContent), total: document.querySelector('[data-cabecera-de-coleccion] [data-total-de-coleccion]')?.textContent, botones: [...document.querySelectorAll('[data-presumir]')].map((b) => b.getAttribute('data-presumir') + ':' + b.textContent.trim()), tarjetasViajero: document.querySelectorAll('[data-tarjeta-de-viajero]').length, anchoTarjeta: document.querySelector('[data-tarjeta-de-viajero]')?.getBoundingClientRect().width, conBarrita: document.querySelectorAll('[data-tarjeta-de-viajero] [data-barrita-de-viajero]').length })")
  debe(n1.cifras.length === 4, 'n1-cifras', `las 4 cifras: ${n1.cifras}`)
  debe(n1.botones.length === 2 && n1.botones.every((b) => /Presumir de mi colección$/.test(b)), 'n1-presumir-dos', `[Presumir de mi colección] arriba y abajo, con el mismo nombre: ${n1.botones}`)
  debe(n1.anchoTarjeta >= 150, 'n1-grandes', `los logros de viajero son más grandes (${n1.anchoTarjeta} px)`)
  debe(n1.conBarrita > 0, 'n1-barrita', `los logros que cuentan llevan su barrita (${n1.conBarrita})`)
  const avance = await J("JSON.stringify([...document.querySelectorAll('[data-tarjeta-de-viajero]')].filter((t) => t.querySelector('[data-avance-de-viajero]')).map((t) => !!t.querySelector('[data-barrita-de-viajero]')))")
  debe(avance.length > 0 && avance.every(Boolean), 'n1-1-de-4', 'cada «x de y» lleva su barrita debajo')
  const pinesFuera = await J("JSON.stringify([...document.querySelectorAll('[data-tarjeta-de-viajero]')].filter((t) => t.getAttribute('data-ganado') === '0' && t.querySelector('[data-pin-vitrina]')).map((t) => t.getAttribute('data-fila')))")
  debe(pinesFuera.length === 0, 'n1-sin-pin-sin-ganar', `ninguna tarjeta sin conseguir lleva el «+» de la vitrina: ${pinesFuera}`)
  await a.captura('docs/dias/V82_capturas/N1_arriba_app.jpg')
  await a.evaluar("document.querySelector('[data-todos]').scrollTo(0, 1000); true")
  await a.esp(700)
  await a.captura('docs/dias/V82_capturas/N1_medio_app.jpg')

  /* 4. Las maravillas: la animación completa, una sola vez */
  console.log('4. Las 7 maravillas')
  const sieteGanadas = `${API}.then((m) => { const g = m.useGanados.getState().datos; m.useGanados.getState().poner({ ...g, maravillas: g.maravillas.map((x) => ({ ...x, ganada: true, clave: x.clave ?? '*|maravilla|' + x.id, fecha: x.fecha ?? '2026-10-10' })) }); return true })`
  const mirarMaravillas = async () => {
    await a.evaluar("document.querySelector('[data-maravillas]')?.scrollIntoView({ block: 'center' }); true")
    await a.esp(1500)
    return J("JSON.stringify({ modo: document.querySelector('[data-maravillas]')?.getAttribute('data-maravillas-modo'), ganadas: document.querySelector('[data-maravillas]')?.getAttribute('data-maravillas-ganadas'), final: !!document.querySelector('[data-final7]'), volver: !!document.querySelector('[data-volver-a-ver-maravillas]'), filas: [...document.querySelectorAll('[data-maravilla]')].map((e) => e.getAttribute('data-estado') + ':' + e.textContent.trim().slice(-10)) })")
  }
  const una = await mirarMaravillas()
  debe(una.modo === 'quieta' && !una.final && !una.volver, 'm-una', `con una maravilla: medalla quieta, sin animación ni [Volver a ver] (${una.modo})`)
  debe(una.filas.filter((f) => /^conseguida/.test(f)).length === 1 && una.filas.filter((f) => /^por-ver/.test(f)).length === 6, 'm-lista', `una «Conseguida» y seis «Por ver»: ${una.filas}`)
  await a.captura('docs/dias/V82_capturas/P1_app.jpg')
  await a.evaluar(sieteGanadas)
  const primera = await mirarMaravillas()
  debe(primera.modo === 'final' && primera.final, 'm-primera', `con las 7, la PRIMERA vez sale la animación completa (${primera.modo})`)
  debe(await a.evaluar("window.localStorage.getItem('jutrip.logros.final_siete_visto') === '1'"), 'm-apuntada', 'se apunta que ya se vio')
  // Se cierra y se vuelve a abrir (otra vez la pantalla).
  await a.evaluar(`${PAN}.then((m) => { m.useLogrosPantallas.getState().volver(); return true })`)
  await a.esp(600)
  await a.evaluar(`${PAN}.then((m) => { m.useLogrosPantallas.getState().abrir({ t: 'todos', pestana: 'todos' }); return true })`)
  await esperar("!!document.querySelector('[data-maravillas]')")
  await a.esp(1800)
  await a.evaluar(sieteGanadas)
  const segunda = await mirarMaravillas()
  debe(segunda.modo === 'brillo' && !segunda.final && segunda.volver, 'm-segunda', `la segunda vez: brillo suave y [Volver a ver], sin la animación (${segunda.modo})`)
  await a.captura('docs/dias/V82_capturas/P1c_app.jpg')
  await a.evaluar("document.querySelector('[data-volver-a-ver-maravillas]').click(); true")
  await a.esp(700)
  debe(await a.evaluar("document.querySelector('[data-maravillas]')?.getAttribute('data-maravillas-modo') === 'final'"), 'm-volver-a-ver', '[Volver a ver] la repite cuando se pide')

  /* 5. Los exclusivos */
  console.log('5. Los exclusivos')
  await a.evaluar("document.querySelector('[data-exclusivos]')?.scrollIntoView({ block: 'start' }); true")
  await a.esp(900)
  const ex = await J("JSON.stringify({ tuyos: [...document.querySelectorAll('[data-exclusivo][data-estado=tuyo]')].map((e) => e.getAttribute('data-exclusivo')), abiertos: [...document.querySelectorAll('[data-exclusivo][data-estado=se-puede-ganar]')].map((e) => e.getAttribute('data-exclusivo') + '|' + e.textContent), nota: document.querySelector('[data-solo-una-vez]')?.textContent, hasta: [...document.querySelectorAll('[data-hasta]')].map((e) => e.textContent) })")
  debe(ex.tuyos.length >= 2, 'ex-tuyos', `salen los tuyos: ${ex.tuyos.length}`)
  debe(ex.abiertos.length === 1 && /lanzarote/.test(ex.abiertos[0]) && /Visita Lanzarote en 2026/.test(ex.abiertos[0]), 'ex-abierto-en-silueta', `sale el que aún se puede ganar, con cómo: ${ex.abiertos}`)
  debe(ex.hasta.length === 1 && ex.hasta[0] === 'Hasta el 31 de diciembre', 'ex-hasta', `y hasta cuándo: ${ex.hasta}`)
  debe(!ex.abiertos.some((x) => /2025|probador/.test(x)) && !ex.tuyos.some((x) => /abierto:/.test(x)), 'ex-cerrado-no-sale', 'un exclusivo que ya no se puede ganar no sale')
  debe(/Solo se consiguen una vez: son tuyos para siempre/.test(ex.nota ?? ''), 'ex-texto', 'el texto «Solo se consiguen una vez: son tuyos para siempre»')
  const silueta = await a.evaluar("(() => { const c = document.querySelector('[data-exclusivo][data-estado=se-puede-ganar]'); return !!c && [...c.querySelectorAll('span')].some((e) => getComputedStyle(e).filter.includes('brightness(0)')) })()")
  debe(silueta, 'ex-silueta', 'el que aún se puede ganar va en silueta')
  await a.captura('docs/dias/V82_capturas/P2b_app.jpg')

  /* 6. La vitrina solo en lo conseguido */
  console.log('6. La vitrina solo en lo conseguido')
  const claves = await J(`${API}.then((m) => JSON.stringify(m.useGanados.getState().datos.items.map((i) => ({ c: i.clave, t: i.tipo, b: i.balda, s: !!i.superado }))))`)
  const viajeroGanado = claves.find((i) => i.t === 'viajero' && i.b === 'viajero' && !i.s)
  const exclusivo = claves.find((i) => i.t === 'exclusivo')
  const maravilla = claves.find((i) => i.t === 'maravilla')
  const emblema = claves.find((i) => i.t === 'emblema')
  await ficha(viajeroGanado.c)
  debe((await pastillas()).length === 1 && (await J("JSON.stringify(!!document.querySelector('[data-ficha-grande]') && !document.querySelector('[data-ficha-azul]'))")), 'v-viajero-ganado', 'un logro de viajero ganado: ficha clara (FichaHoja) con su pastilla de vitrina')
  const posicion = await J("JSON.stringify((() => { const p = document.querySelector('[data-vitrina-de-ficha]').getBoundingClientRect(); const f = document.querySelector('[data-ficha-grande]').getBoundingClientRect(); return { derecha: f.right - p.right, arriba: p.top - f.top } })())")
  debe(posicion.derecha < 30 && posicion.arriba < 90, 'v-arriba-derecha', `la pastilla va arriba a la derecha (${JSON.stringify(posicion)})`)
  await a.captura('docs/dias/V82_capturas/N2c_app.jpg')
  await cerrarFicha()
  await ficha('pendiente:cuatro_estaciones')
  debe((await pastillas()).length === 0 && (await a.evaluar("!!document.querySelector('[data-por-conseguir-de-ficha]') && !!document.querySelector('[data-entendido]')")), 'v-sin-ganar', 'un logro sin ganar: sin pastilla, con «Por conseguir» y [Entendido]')
  await a.captura('docs/dias/V82_capturas/N2b_app.jpg')
  await cerrarFicha()
  await ficha(exclusivo.c)
  debe((await a.evaluar("!!document.querySelector('[data-ficha-azul]')")), 'v-azul-exclusivo', 'un exclusivo abre la ficha azul (N2)')
  debe((await pastillas()).join() === 'puesto', 'v-exclusivo-pastilla', `el exclusivo ganado lleva la pastilla «En tu vitrina»: ${await pastillas()}`)
  await a.captura('docs/dias/V82_capturas/N2_app.jpg')
  const botonesAzul = await J("JSON.stringify([...document.querySelectorAll('[data-ficha-azul] button')].map((b) => b.textContent.trim()).filter(Boolean))")
  debe(botonesAzul.includes('Compartir') && botonesAzul.includes('Volver a ver') && botonesAzul.some((t) => /título/.test(t)), 'v-mismos-botones', `los mismos botones con los mismos nombres: ${botonesAzul}`)
  await cerrarFicha()
  await ficha(maravilla.c)
  debe(await a.evaluar("!!document.querySelector('[data-ficha-azul]')"), 'v-azul-maravilla', 'una maravilla abre la ficha azul')
  await cerrarFicha()
  await ficha(emblema.c)
  debe(await a.evaluar("!!document.querySelector('[data-ficha-azul]')"), 'v-azul-emblema', 'un emblema oculto abre la ficha azul')
  await cerrarFicha()
  await ficha('abierto:edicion_anio:lanzarote:2026')
  debe((await pastillas()).length === 0 && (await a.evaluar("!!document.querySelector('[data-entendido]') && /Visita Lanzarote en 2026/.test(document.querySelector('[data-ficha-azul]').textContent) && /Hasta el 31 de diciembre/.test(document.querySelector('[data-ficha-azul]').textContent)")), 'v-abierto-sin-vitrina', 'el exclusivo que aún no tienes: sin pastilla, con cómo y hasta cuándo')
  await cerrarFicha()
  // Una colección a medias (Lanzarote, 4 de 7) NO ofrece la vitrina; una conseguida sí.
  await a.evaluar("window.__demoDestino?.modo?.('parcial'); import('/src/lib/logrosDemo_ganados.ts').then((m) => { m.ponerLanzarote(4); return true })")
  await a.evaluar(`${API}.then((m) => m.useGanados.getState().cargar(true)).then(() => true)`)
  await a.esp(800)
  await ficha('coleccion:lanzarote:lz_imprescindibles')
  await esperar("!!document.querySelector('[data-ficha-grande] [data-insignia-grande]')")
  debe((await pastillas()).length === 0, 'v-coleccion-a-medias', `una colección a medias NO ofrece la vitrina: ${await pastillas()}`)
  await cerrarFicha()
  const colCompleta = claves.find((i) => i.t === 'coleccion')
  await ficha(colCompleta.c)
  await esperar("!!document.querySelector('[data-ficha-grande] [data-vitrina-de-ficha]')")
  debe((await pastillas()).length === 1, 'v-coleccion-completa', 'una colección conseguida sí la ofrece')
  await cerrarFicha()

  /* 7. Con la vitrina llena se abre ElegirHueco */
  console.log('7. Vitrina llena')
  const viajeros = claves.filter((i) => i.t === 'viajero' && i.b === 'viajero' && !i.s)
  debe(viajeros.length >= 5, 'llena-datos', `hay logros de viajero para llenar la balda (${viajeros.length})`)
  const cuatro = viajeros.slice(0, 4).map((i) => i.c)
  await a.evaluar(`${API}.then(async (m) => { await m.guardarBalda('viajero', ${JSON.stringify(cuatro)}); await m.useGanados.getState().cargar(true); return true })`)
  await a.esp(800)
  const quinto = viajeros[4].c
  await ficha(quinto)
  debe((await pastillas()).join() === 'libre', 'llena-pastilla', `el quinto, fuera de la vitrina, ofrece «Llevar a mi vitrina»: ${await pastillas()}`)
  await a.evaluar("document.querySelector('[data-vitrina-de-ficha]').click(); true")
  await a.esp(700)
  debe(await a.evaluar("!!document.querySelector('[data-elegir-hueco]')"), 'llena-elegir-hueco', 'con la vitrina llena, «Llevar a mi vitrina» abre ElegirHueco')
  const huecos = await a.evaluar("document.querySelectorAll('[data-elegir-hueco] [role=radio]').length")
  debe(huecos === 4, 'llena-4-huecos', `elige entre los huecos de la balda (${huecos})`)
  await cerrarFicha()
  await a.evaluar(`${API}.then((m) => { m.useHojasDeLogros.getState().cerrarHueco(); return true })`)

  /* 8. La tarjeta para presumir y los MISMOS números */
  console.log('8. La tarjeta para presumir')
  await a.evaluar("document.querySelector('[data-todos]').scrollTo(0, 0); true")
  await a.esp(500)
  const n1b = await J("JSON.stringify({ cifras: [...document.querySelectorAll('[data-cabecera-de-coleccion] [data-cifra]')].map((e) => e.getAttribute('data-cifra') + '=' + e.firstElementChild.textContent), total: document.querySelector('[data-cabecera-de-coleccion] [data-total-de-coleccion]')?.textContent })")
  await a.evaluar("document.querySelector('[data-presumir=arriba]').click(); true")
  debe(await esperar("!!document.querySelector('[data-tarjeta-para-presumir]')"), 'p3-abre', '[Presumir de mi colección] abre la tarjeta')
  await a.esp(1200)
  const p3 = await J("JSON.stringify({ cifras: [...document.querySelectorAll('[data-tarjeta-para-presumir] [data-cifra]')].map((e) => e.getAttribute('data-cifra') + '=' + e.firstElementChild.textContent), total: document.querySelector('[data-tarjeta-para-presumir] [data-total-de-coleccion]')?.textContent, medalla: !!document.querySelector('[data-medalla-maravillas-de-tarjeta]'), exclusivos: document.querySelectorAll('[data-exclusivo-de-tarjeta]').length, boton: document.querySelector('[data-compartir-coleccion]')?.textContent, orden: (() => { const t = document.querySelector('[data-tarjeta-para-presumir]'); const m = t.querySelector('[data-medalla-maravillas-de-tarjeta]'); const e = t.querySelector('[data-exclusivos-de-tarjeta]'); return !!m && !!e && !!(m.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING) })() })")
  debe(JSON.stringify(p3.cifras) === JSON.stringify(n1b.cifras) && p3.total === n1b.total, 'mismos-numeros', `los mismos números en N1 y en la tarjeta: ${n1b.total} ${n1b.cifras} / ${p3.total} ${p3.cifras}`)
  const nEx = await J(`${API}.then((m) => JSON.stringify(m.useGanados.getState().datos.exclusivos.length))`)
  debe(p3.exclusivos === Number(nEx) && Number(nEx) >= 2, 'p3-todos-los-exclusivos', `salen TODOS tus exclusivos (${p3.exclusivos} de ${nEx})`)
  debe(p3.medalla && p3.orden, 'p3-medalla-primero', 'la medalla de las maravillas va arriba, la primera, y los exclusivos después')
  debe(p3.boton === 'Compartir mi colección', 'p3-boton', `botón «${p3.boton}»`)
  await a.captura('docs/dias/V82_capturas/P3_app.jpg')
  // La imagen se puede preparar.
  const img = await a.evaluar("import('/src/components/logros/pantallas/todos/imagenDeColeccion.ts').then(async (m) => { const b = await m.elementoAImagen(document.querySelector('[data-tarjeta-para-presumir]')); if (!b) return 0; const url = URL.createObjectURL(b); window.__imagenV82 = url; const r = await new Promise((ok) => { const f = new FileReader(); f.onload = () => ok(f.result); f.readAsDataURL(b) }); window.__imagenV82datos = r; return b.size })")
  debe(img > 5000, 'p3-imagen', `la imagen para compartir se prepara (${img} bytes)`)
  const datosImg = await a.evaluar('window.__imagenV82datos')
  if (typeof datosImg === 'string' && datosImg.startsWith('data:image/png;base64,')) fs.writeFileSync('docs/dias/V82_capturas/P3_imagen_compartida.png', Buffer.from(datosImg.split(',')[1], 'base64'))
  // Con 0 maravillas no sale su medalla y con 3 o 4 exclusivos van en una fila.
  const cols = await a.evaluar("import('/src/components/logros/pantallas/TarjetaParaPresumir.tsx').then((m) => [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => m.columnasDeExclusivos(n)).join())")
  debe(cols === '1,2,3,4,3,3,4,4,4', 'p3-filas', `filas de 3 o 4 (${cols})`)
  await a.evaluar(`${PAN}.then((m) => { m.useLogrosPantallas.getState().volver(); return true })`)
  await a.evaluar("import('/src/lib/logrosDemo_ganados.ts').then((m) => { m.ponerEscenario('vacio'); return true })")
  await a.evaluar(`${API}.then((m) => m.useGanados.getState().cargar(true)).then(() => true)`)
  await a.esp(800)
  await a.evaluar("document.querySelector('[data-presumir=arriba]')?.click(); true")
  await esperar("!!document.querySelector('[data-tarjeta-para-presumir]')")
  await a.esp(800)
  debe(await a.evaluar("!document.querySelector('[data-medalla-maravillas-de-tarjeta]')"), 'p3-sin-maravillas', 'sin ninguna maravilla, la tarjeta no lleva su medalla')
  await a.evaluar("import('/src/lib/logrosDemo_ganados.ts').then((m) => { m.ponerEscenario('lleno'); return true })")
} finally {
  a.cerrar()
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
if (fallos.length) {
  for (const f of fallos) console.log(` - [${f.regla}] ${f.texto}`)
  process.exit(1)
}
process.exit(0)
