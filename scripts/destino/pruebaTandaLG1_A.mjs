// La prueba de la Tanda LG1, apartado 1 (agente A, 4-nov): la pestaña «Logros» en la ficha de cada lugar (Design: Piezas/Ficha Lugar y App Explorar y fichas, apartado 02).
//   · la pestaña sale SOLO en los sitios que están en alguna colección (Resumen · Entradas · Tips · Logros);
//   · «X suma en N colecciones» con el número de verdad, y «X de Y» y «Te faltan N sitios» los de los datos (se comprueba con TODOS los sitios de las colecciones de Roma y de Lanzarote);
//   · los tres estados de los sitios: «Visto» (verde con ✓), «Estás aquí · te falta este» (naranja) y «Por ver»;
//   · al tocar un sitio de la lista se abre su ficha; sin pase, la pestaña sale cerrada (como la hoja de logros);
//   · Roma (Fontana de Trevi) y Lanzarote (Jameos del Agua), con captura 390×844.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTandaLG1_A.mjs
import fs from 'node:fs'
import path from 'node:path'
const { abrirApp } = await import('./_enLaApp.mjs')
const BASE = process.env.APP_URL ?? 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
let comprobaciones = 0
const fallos = []
const debe = (cond, texto) => { comprobaciones++; if (!cond) { fallos.push(texto); console.log(`✗ ${texto}`) } }
const leer = (f) => fs.readFileSync(f, 'utf8')
const json = (f) => JSON.parse(leer(f))
const esp = (ms) => new Promise((r) => setTimeout(r, ms))
const modulo = (ruta) => `(async () => { const n = performance.getEntriesByType('resource').map((r) => r.name).find((x) => x.includes(${JSON.stringify(ruta)})); return import(n || ${JSON.stringify(ruta)}) })()`
const STORE = modulo('/src/store/useRouteStore.ts')
const API = modulo('/src/components/logros/momentos/api.ts')

// ── 1. El código: la cuarta pestaña y lo que la sostiene ──
{
  const f = leer('src/components/route/dayDetail/StopDetailSheet.tsx')
  debe(/type Tab = 'resumen' \| 'tickets' \| 'tips' \| 'logros'/.test(f), 'StopDetailSheet: el tipo de pestaña no incluye «logros»')
  debe(/\{ id: 'logros', label: 'Logros' \}/.test(f) && /\(hayLogros \? \(\['logros'\] as const\) : \[\]\)/.test(f), 'StopDetailSheet: «Logros» tiene que ser la cuarta pestaña y salir solo si hay colecciones')
  debe(/<PestanaLogros /.test(f) && /sitioDeLogros/.test(f), 'StopDetailSheet: falta montar PestanaLogros o la ficha del sitio tocado')
  const p = leer('src/components/logros/ficha/PestanaLogros.tsx')
  debe(/usePasePintable/.test(p) && /abrirAvisoPase\('logros'/.test(p) && /grayscale\(1\)/.test(p), 'PestanaLogros: la regla de gratis o pase tiene que ser la de la hoja de logros')
  debe(/pedirEstado\(/.test(p) && !/fetch\(/.test(p), 'PestanaLogros: los datos tienen que salir de pedirEstado (los mismos que la hoja)')
  debe(/<Insignia coleccion=\{t\.id\}/.test(p), 'PestanaLogros: la insignia con sus pedazos (Insignia, que en Lanzarote es la pieza de gajos)')
  const h = leer('src/components/logros/momentos/HojaLogros.tsx')
  debe(/<Insignia coleccion=\{c\.id\}/.test(h), 'HojaLogros: la insignia ya no es la misma pieza')
}

// ── 2. La verdad de los datos: para CADA sitio de CADA colección ──
const DESTINOS = {
  roma: { clave: 'roma', ciudad: 'Roma', datos: json('data/logros/roma.json'), places: json('data/pipeline_v2/roma.json').places },
  lanzarote: { clave: 'lanzarote', ciudad: 'Lanzarote', datos: json('data/logros/lanzarote.json'), places: json('data/pipeline_v2/lanzarote.json').places },
}
/** Un estado como el que manda el servidor, con los sitios vistos que se le digan (por defecto, uno de cada tres según una semilla). */
function estadoDe(d, vistos) {
  const nombre = (id) => d.places.find((p) => p.id === id)?.name ?? id
  const colecciones = d.datos.colecciones.map((c) => {
    const v = c.sitios.filter((s) => vistos(c.id, s))
    return { id: c.id, grupo: c.grupo, orden: c.orden, nombre: c.nombre, n: v.length, total: c.sitios.length, completa: v.length === c.sitios.length, en_tu_ruta: false, nuevo_hoy: false, al_completar: null, sitios: c.sitios.map((s) => ({ sitio: s, visto: v.includes(s), nombre: nombre(s), en_ruta: true })) }
  })
  return { ok: true, destino: d.clave, ciudad: d.ciudad, sellos: [], colecciones, secretos: { total: 0, encontrados: 0, texto: '', encontrados_lista: [] }, pendiente: { sorpresas: 0, pedazos: 0, dias_para_reclamar: null, texto: null }, puntito: false, con_tu_ruta_puedes_completar: null, viaje: { id: 'lg1', inicio: '2026-11-08', fin: '2026-11-13', hoy: '2026-11-08' } }
}
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 1000003, 7)
const unoDeTres = (c, s) => hash(`${c}:${s}`) % 3 === 0

// ── 3. En pantalla ──
async function conRuta(destino, version) {
  const lz = destino === 'lanzarote'
  const a = await abrirApp(BASE, { ruta: `/?cuentas=off&logros=on&logrosDemo=1&version=${version}&apertura=0`, ancho: 390, alto: 844, antes: version === 'gratis' ? 'window.__pruebaDelPase = { cobro: true, conPase: false, puede: true, pruebaGastada: false };' : '' })
  try {
    const fn = lz ? '__rutaLanzarote' : '__rutaPrueba'
    for (let i = 0; i < 360 && !(await a.evaluar(`typeof window.${fn} === 'function'`).catch(() => false)); i++) await esp(500)
    await a.evaluar(lz ? "window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler' }).then(() => true)" : 'Promise.resolve(window.__rutaPrueba()).then(() => true)')
    for (let i = 0; i < 90 && !(await a.evaluar(STORE + '.then((S) => Boolean(S.useRouteStore.getState().route))')); i++) await esp(1000)
    await esp(2500)
    await a.evaluar(`${STORE}.then((S) => { const e = S.useRouteStore.getState(); e.setActiveDayId(e.route.days[0].id); e.setMode('days'); return true })`)
    await esp(2000)
    for (let i = 0; i < 4; i++) {
      const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Siguiente|Genial|Ya lo sé|Empezar mi día)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!hecho) break
      await esp(500)
    }
    return a
  } catch (e) {
    a.cerrar()
    throw e
  }
}

/** Pone el estado de logros de prueba (el mismo que contestaría el servidor) y abre la ficha de `nombre`. Si no está en la ruta, se lo pone a la primera parada del día 1 (solo para esta prueba). */
async function abrirFicha(a, nombre, estado) {
  await a.evaluar(`${API}.then((m) => { m.datosDePrueba.estado = ${JSON.stringify(estado)}; return true })`)
  const dia = await a.evaluar(`${STORE}.then((S) => { const e = S.useRouteStore.getState(); const i = e.route.days.findIndex((d) => d.stops.some((x) => x.name === ${JSON.stringify(nombre)})); return i })`)
  if (dia < 0) {
    await a.evaluar(`${STORE}.then((S) => { const e = S.useRouteStore.getState(); const dias = e.route.days.map((d, i) => d.stops.findIndex((x) => !x.isBreak && !x.isFreeTour && !x.isFreeTime && !x.isArrival && !x.isFreeWalk) ); const i = dias.findIndex((k) => k >= 0); const copia = structuredClone(e.route); copia.days[i].stops[dias[i]].name = ${JSON.stringify(nombre)}; S.useRouteStore.setState({ route: copia }); e.setActiveDayId(copia.days[i].id); return true })`)
  } else {
    await a.evaluar(`${STORE}.then((S) => { const e = S.useRouteStore.getState(); e.setActiveDayId(e.route.days[${dia}].id); e.setMode('days'); return true })`)
  }
  await esp(2500)
  await a.evaluar(`(() => { const tit = Array.from(document.querySelectorAll('span.font-display')).find((x) => x.textContent === ${JSON.stringify(nombre)} || x.textContent.startsWith(${JSON.stringify(nombre + ',')})); tit?.scrollIntoView({ block: 'center' }); tit?.click(); return true })()`)
  for (let i = 0; i < 60 && !(await a.evaluar("Boolean(document.querySelector('[data-ficha-panel] [data-ficha-cabecera]'))")); i++) await esp(500)
  await esp(1500)
  return a.evaluar("Boolean(document.querySelector('[data-ficha-panel] [data-ficha-cabecera]'))")
}
const pestanas = (a) => a.evaluar("Array.from(document.querySelectorAll('[data-ficha-pestanas] button')).map((b) => b.textContent.trim())")
// Cierra la ficha de más arriba (la última abierta); si no hay ninguna, no toca nada (un «Volver» de más sacaría del viaje).
const cerrarFicha = async (a) => { await a.evaluar("(() => { const f = Array.from(document.querySelectorAll('[data-ficha-panel]')).map((p) => p.closest('.fixed')).filter(Boolean); const v = f.at(-1)?.querySelector('[aria-label=Volver]'); v?.click(); return true })()"); await esp(900) }
const leerPestana = (a) => a.evaluar(`(() => {
  const r = document.querySelector('[data-pestana-logros]'); if (!r) return null
  return { titulo: r.querySelector('[data-logros-titulo]')?.textContent ?? null, cerrada: Boolean(r.querySelector('[data-logros-cerrados]')),
    tarjetas: Array.from(r.querySelectorAll('[data-logros-coleccion]')).map((c) => ({ id: c.dataset.logrosColeccion, abierta: c.dataset.abierta === '1', nombre: c.querySelector('[data-logros-nombre]')?.textContent, cuenta: c.querySelector('[data-logros-cuenta]')?.textContent, faltan: c.querySelector('[data-logros-faltan]')?.textContent ?? null,
      insignia: Boolean(c.querySelector('svg, img, canvas, [data-gajos], [data-insignia], [data-hueco-insignia]')),
      sitios: Array.from(c.querySelectorAll('[data-logros-sitio]')).map((s) => ({ id: s.dataset.logrosSitio, estado: s.dataset.estado, texto: s.innerText.replace(/\\s+/g, ' ').trim() })) })) }
})()`)

async function pasada(destino, sitio, imagen) {
  const d = DESTINOS[destino]
  const cols = d.datos.colecciones.filter((c) => c.sitios.includes(sitio.id))
  const a = await conRuta(destino, 'pago')
  try {
    // 3a. Con el sitio SIN ver: «Estás aquí · te falta este» en las colecciones; el resto, según los datos.
    const vistos = (c, s) => s !== sitio.id && unoDeTres(c, s)
    const estado = estadoDe(d, vistos)
    const ok = await abrirFicha(a, sitio.nombre, estado)
    debe(ok, `${destino}: no se abre la ficha de ${sitio.nombre}`)
    if (!ok) return
    let tabs = await pestanas(a)
    debe(JSON.stringify(tabs.map((t) => t.replace(/\d+$/, '').trim())) === JSON.stringify(tabs.includes('Entradas') || tabs.some((t) => /^Entradas/.test(t)) ? ['Resumen', 'Entradas', 'Tips', 'Logros'] : ['Resumen', 'Tips', 'Logros']) && tabs.at(-1) === 'Logros', `${destino}: las pestañas de ${sitio.nombre} no acaban en «Logros» tras Resumen · Entradas · Tips (${tabs.join(' · ')})`)
    await a.evaluar("Array.from(document.querySelectorAll('[data-ficha-pestanas] button')).find((b) => b.textContent.trim() === 'Logros')?.click(); true")
    await esp(1200)
    let p = await leerPestana(a)
    debe(Boolean(p), `${destino}: al tocar «Logros» no sale la pestaña`)
    if (!p) return
    const n = cols.length
    debe(new RegExp(`^(El|La|Los|Las)? ?${sitio.nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} suman? en ${n} ${n === 1 ? 'colección' : 'colecciones'}$`).test(p.titulo ?? ''), `${destino}: el título no dice «suma en ${n} colecciones» (${p.titulo})`)
    debe(p.tarjetas.length === n, `${destino}: ${p.tarjetas.length} tarjetas, y ${sitio.nombre} está en ${n} colecciones de los datos`)
    for (const c of cols) {
      const t = p.tarjetas.find((x) => x.id === c.id)
      debe(Boolean(t), `${destino}: falta la tarjeta de ${c.id}`)
      if (!t) continue
      const ganados = c.sitios.filter((s) => vistos(c.id, s)).length
      debe(t.nombre === c.nombre, `${destino}/${c.id}: nombre «${t.nombre}» ≠ «${c.nombre}»`)
      debe(t.cuenta === `${ganados} de ${c.sitios.length}`, `${destino}/${c.id}: «${t.cuenta}» ≠ «${ganados} de ${c.sitios.length}»`)
      debe(t.insignia, `${destino}/${c.id}: la tarjeta no lleva la insignia`)
      const abierta = p.tarjetas[0].id === c.id
      debe(t.abierta === abierta, `${destino}/${c.id}: la primera tarjeta sale abierta y las demás plegadas`)
      if (t.abierta) {
        const faltan = c.sitios.length - ganados
        debe(t.faltan === (faltan === 1 ? 'Te falta 1 sitio' : `Te faltan ${faltan} sitios`), `${destino}/${c.id}: etiqueta «${t.faltan}»`)
        debe(t.sitios.length === c.sitios.length, `${destino}/${c.id}: ${t.sitios.length} sitios en la lista, ${c.sitios.length} en los datos`)
        debe(t.sitios.filter((s) => s.estado === 'visto').length === ganados && t.sitios.every((s) => s.estado !== 'visto' || /Visto/.test(s.texto)), `${destino}/${c.id}: los «Visto» no cuadran`)
        const este = t.sitios.filter((s) => s.estado === 'este')
        debe(este.length === 1 && este[0].id === sitio.id && /Estás aquí · te falta este/.test(este[0].texto), `${destino}/${c.id}: tiene que haber un solo «Estás aquí · te falta este» y ser ${sitio.id}`)
        debe(t.sitios.filter((s) => s.estado === 'pendiente').every((s) => /Por ver/.test(s.texto)) && t.sitios.filter((s) => s.estado === 'pendiente').length === faltan - 1, `${destino}/${c.id}: los «Por ver» no cuadran`)
      }
    }
    // Las otras tarjetas se abren y se cierran.
    if (n > 1) {
      await a.evaluar("document.querySelectorAll('[data-logros-coleccion] > button')[1]?.click(); true")
      await esp(500)
      p = await leerPestana(a)
      debe(p.tarjetas[1].abierta && p.tarjetas[1].faltan && p.tarjetas[1].sitios.length > 0, `${destino}: la segunda tarjeta no se abre al tocarla`)
      await a.evaluar("document.querySelectorAll('[data-logros-coleccion] > button')[1]?.click(); true")
      await esp(400)
      p = await leerPestana(a)
      debe(!p.tarjetas[1].abierta && p.tarjetas[1].sitios.length === 0, `${destino}: la segunda tarjeta no se pliega al volver a tocarla`)
    }
    // Captura de la pestaña (tarjeta primera abierta, bien a la vista).
    await a.evaluar("(() => { const e = document.querySelector('[data-pestana-logros]'); e?.scrollIntoView({ block: 'start' }); let s = e?.parentElement; while (s && s.scrollHeight <= s.clientHeight + 2) s = s.parentElement; s?.scrollBy(0, -78); return true })()")
    await esp(900)
    await a.captura(path.join(SALIDA, `lg1_${imagen}_1.jpg`))

    // 3b. Tocar un sitio de la lista abre SU ficha.
    const otro = cols[0].sitios.find((s) => s !== sitio.id)
    const nombreOtro = d.places.find((x) => x.id === otro).name
    await a.evaluar(`document.querySelector('[data-logros-sitio="${otro}"]')?.click(); true`)
    let abierta = false
    for (let i = 0; i < 40 && !abierta; i++) {
      await esp(500)
      abierta = await a.evaluar(`document.querySelectorAll('[data-ficha-panel] h1').length === 2 && Array.from(document.querySelectorAll('[data-ficha-panel] h1')).some((h) => h.textContent.trim().startsWith(${JSON.stringify(nombreOtro.slice(0, 12))}))`)
    }
    debe(abierta, `${destino}: al tocar «${nombreOtro}» en la lista no se abre su ficha`)
    await cerrarFicha(a) // vuelve a la ficha de antes
    const sigue = await a.evaluar("document.querySelectorAll('[data-ficha-panel] h1').length")
    debe(sigue === 1, `${destino}: tras volver de la ficha tocada tiene que quedar la de ${sitio.nombre} (${sigue} fichas abiertas)`)
    await cerrarFicha(a)

    // 3c. Con el sitio YA visto: «Visto» (verde con ✓) y ningún «Estás aquí».
    const estadoVisto = estadoDe(d, (c, s) => s === sitio.id || unoDeTres(c, s))
    await abrirFicha(a, sitio.nombre, estadoVisto)
    await a.evaluar("Array.from(document.querySelectorAll('[data-ficha-pestanas] button')).find((b) => b.textContent.trim() === 'Logros')?.click(); true")
    await esp(1200)
    p = await leerPestana(a)
    const filaYo = p?.tarjetas[0]?.sitios.find((s) => s.id === sitio.id)
    debe(filaYo?.estado === 'visto' && /Visto/.test(filaYo.texto) && !p.tarjetas.some((t) => t.sitios.some((s) => s.estado === 'este')), `${destino}: con ${sitio.nombre} ya visto tiene que decir «Visto» y no «Estás aquí» (${JSON.stringify(filaYo)})`)
    const verde = await a.evaluar(`(() => { const e = document.querySelector('[data-logros-sitio="${sitio.id}"]'); if (!e) return null; const marca = e.lastElementChild; return { marca: marca.textContent.trim(), fondo: getComputedStyle(marca).backgroundColor, texto: getComputedStyle(e.querySelector('span:nth-child(2) span:nth-child(2)') ?? e).color } })()`)
    debe(verde?.marca === '✓', `${destino}: la marca de «Visto» tiene que ser ✓ (${JSON.stringify(verde)})`)
    await cerrarFicha(a)

    // 3d. Un sitio que NO está en ninguna colección: la pestaña no sale.
    const sinEste = { ...estado, colecciones: estado.colecciones.map((c) => ({ ...c, sitios: c.sitios.filter((s) => s.sitio !== sitio.id) })) }
    await abrirFicha(a, sitio.nombre, sinEste)
    tabs = await pestanas(a)
    debe(!tabs.includes('Logros') && tabs.length >= 2, `${destino}: ${sitio.nombre} sin colección no debe llevar la pestaña «Logros» (${tabs.join(' · ')})`)
    await cerrarFicha(a)

    // 3e. Sin estado del servidor (nadie ha contestado): tampoco sale.
    await a.evaluar(`${API}.then((m) => { m.datosDePrueba.estado = null; return true })`)
    await abrirFicha(a, sitio.nombre, null).catch(() => false)
    tabs = await pestanas(a)
    debe(!tabs.includes('Logros'), `${destino}: sin respuesta del servidor no debe haber pestaña «Logros»`)
    await cerrarFicha(a)

    // 3f. TODOS los sitios de TODAS las colecciones: el número de colecciones y «X de Y» (se calcula en el navegador con la función real).
    const lista = await a.evaluar(`import('/src/components/logros/ficha/coleccionesDelSitio.ts').then((m) => { const est = ${JSON.stringify(estado)}; const salida = {}; for (const c of est.colecciones) for (const s of c.sitios) { if (salida[s.sitio]) continue; const t = m.coleccionesDelSitio(est, s.nombre); salida[s.sitio] = t.map((x) => [x.id, x.n, x.total, x.sitios.length, m.textoDeFaltan(x)]) } return salida })`)
    const ids = new Set(d.datos.colecciones.flatMap((c) => c.sitios))
    debe(Object.keys(lista).length === ids.size, `${destino}: faltan sitios en la comprobación completa`)
    let malos = 0
    for (const id of ids) {
      const esperadas = d.datos.colecciones.filter((c) => c.sitios.includes(id))
      const t = lista[id] ?? []
      const ok2 = t.length === esperadas.length && esperadas.every((c) => {
        const x = t.find((y) => y[0] === c.id)
        const v = c.sitios.filter((s) => vistos(c.id, s)).length
        return x && x[1] === v && x[2] === c.sitios.length && x[3] === c.sitios.length && x[4] === (c.sitios.length - v === 0 ? 'Colección completa' : c.sitios.length - v === 1 ? 'Te falta 1 sitio' : `Te faltan ${c.sitios.length - v} sitios`)
      })
      if (!ok2) { malos++; console.log(`  ✗ ${destino}/${id}: ${JSON.stringify(t)}`) }
    }
    debe(malos === 0, `${destino}: ${malos} sitios con el número de colecciones o «X de Y» distintos de los datos`)
    const libres = d.places.filter((x) => !ids.has(x.id)).slice(0, 12)
    const alguna = await a.evaluar(`import('/src/components/logros/ficha/coleccionesDelSitio.ts').then((m) => { const est = ${JSON.stringify(estado)}; return ${JSON.stringify(libres.map((x) => x.name))}.filter((n) => m.coleccionesDelSitio(est, n).length > 0) })`)
    debe(libres.length > 0 && alguna.length === 0, `${destino}: sitios sin colección que llevan pestaña: ${alguna.join(', ')}`)
  } finally {
    a.cerrar()
  }
}

console.log('Roma')
await pasada('roma', { id: 'fontana_de_trevi', nombre: 'Fontana de Trevi' }, 'trevi')
console.log('Lanzarote')
await pasada('lanzarote', { id: 'jameos_del_agua', nombre: 'Jameos del Agua' }, 'jameos')

// ── 4. Sin pase: la pestaña sale, cerrada y en gris, y tocarla abre el aviso del pase (la regla de la hoja de logros) ──
console.log('Sin pase')
{
  const d = DESTINOS.roma
  const a = await conRuta('roma', 'gratis')
  try {
    const ok = await abrirFicha(a, 'Fontana de Trevi', estadoDe(d, (c, s) => s !== 'fontana_de_trevi' && unoDeTres(c, s)))
    debe(ok, 'sin pase: no se abre la ficha de la Fontana de Trevi')
    await a.evaluar("Array.from(document.querySelectorAll('[data-ficha-pestanas] button')).find((b) => b.textContent.trim() === 'Logros')?.click(); true")
    await esp(1500)
    const p = await leerPestana(a)
    debe(p?.cerrada === true && p.tarjetas.length === 3, `sin pase: la pestaña tiene que salir cerrada (en gris) con sus 3 colecciones (${JSON.stringify(p && { cerrada: p.cerrada, n: p.tarjetas.length })})`)
    const gris = await a.evaluar("getComputedStyle(document.querySelector('[data-logros-cerrados]')).filter")
    debe(/grayscale/.test(gris), `sin pase: no está en gris (${gris})`)
    await a.evaluar("document.querySelector('[data-logros-cerrados] [data-logros-coleccion] > button')?.click(); true")
    await esp(1500)
    const aviso = await a.evaluar("document.body.innerText")
    debe(/pase/i.test(aviso) && (await a.evaluar("document.querySelectorAll('[data-ficha-panel] h1').length")) === 1, 'sin pase: al tocarla tiene que salir el aviso del pase (y no abrirse otra ficha)')
  } finally {
    a.cerrar()
  }
}

console.log(`\nPrueba LG1 A (la pestaña «Logros» de la ficha): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
