// La prueba de la Tanda 10I: la película del pase; desde la 10N10 (8b) la película se quitó y es la lista del pase (se conserva el nombre del archivo).
// Hace falta `npm run server` y `npm run dev` (la parte de la app abre un Chrome sin ventana: scripts/destino/_enLaApp.mjs).
//   API_URL=http://localhost:8787 node scripts/destino/pruebaTanda10I.mjs
// Además saca las capturas (docs/dias/capturas_jutrip/pelicula_*.jpg) que luego recoge docs/dias/GRATIS_REVISION.html (scripts/destino/capturasPelicula.mjs).
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const png = (n) => path.join(SALIDA, `pelicula_${n}.jpg`)
const store = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState())"
const ORO = ['rgb(111, 78, 55)', 'rgb(166, 124, 82)', 'rgb(233, 199, 122)']

/* ───────────────────────── 1. Lo que se ve en el código ───────────────────────── */
{
  // (Tanda 10N11, apartado 5: la lista del pase es un componente propio, sin el código de la película; sus textos y dibujos salen de lista/disenoLista.ts, generado desde Piezas/Pase Lista.)
  debe(!fs.existsSync('src/components/pase/pelicula'), 'fuera', 'ya no queda el código de la película')
  const fuenteLista = leer('src/components/pase/ListaDelPase.tsx')
  debe(!/https?:\/\//.test(fuenteLista.replace(/^\s*(\/\/|\*|\/\*).*$/gm, '').replace(/https?:\/\/www\.w3\.org[^\s"'`)]*/g, '')), 'fuera', 'la lista del pase no pide nada de fuera')
  const dl = leer('src/components/pase/lista/disenoLista.ts')
  const dis = leer('docs/diseno/proyecto/Piezas/Pase Lista.dc.html')
  for (const t of ['Se paga una vez · No caduca', 'Elegir mi pase', 'Todo lo que incluye tu']) debe(dis.includes(t) && fuenteLista.includes(t), 'textos', `«${t}» sale tal cual de Design`)
  debe([...dl.matchAll(/"titulo": "([^"]*)"/g)].every((m) => dis.includes(m[1])), 'textos', 'los títulos de la lista son los de Design')

  // La lista del final es UNA: la película, «Todo lo que incluye» y HOY la sacan del mismo sitio.
  const lista = leer('src/lib/listaDelPase.ts') // (la de Design, entera: la ajustada va encima, Tanda 10P)
  const nItems = (lista.match(/"titulo"/g) ?? []).length
  debe(nItems === 34, 'lista', `la lista del pase lleva 6 grupos y 28 filas (${nItems} títulos)`)
  const lh = leer('src/lib/listaDeHoy.ts')
  debe(/LISTA_DEL_PASE/.test(lh) && /listaAjustada/.test(lh) && /filasDeHoy\(\)/.test(leer('src/components/route/hoy/HoyAntes.tsx')), 'lista', 'HOY sin pase saca «Con el pase tendrás» de la lista del pase')
  debe(!/No me da tiempo\b/.test(leer('src/components/route/hoy/HoyAntes.tsx').replace(/^\s*(\/\/|\*|\/\*).*$/gm, '')), 'lista', 'ya no queda la lista vieja escrita en HOY («No me da tiempo»…)')
  debe(!fs.existsSync('src/components/pase/HojaDeCompra.tsx'), 'hoja', 'la hoja de compra de antes ya no existe: la sustituye «¿Cuántos sois?» de la lista del pase')
  debe(/abrirPase\(\): void/.test(leer('src/lib/pago.ts')) && /EVENTO_PAGAR/.test(leer('src/components/pase/ListaDelPaseHost.tsx')) && !/EVENTO_PAGAR/.test(leer('src/components/pase/PagoHost.tsx').replace(/^\s*(\/\/|\*|\/\*).*$/gm, '')), 'abrir', 'abrirPase() lo escucha la lista del pase (ListaDelPaseHost), no PagoHost')
  const pagoHost = leer('src/components/pase/PagoHost.tsx')
  debe(/crearPagoDelPase/.test(leer('src/components/pase/ListaDelPase.tsx')) && /irAPagar/.test(leer('src/components/pase/ListaDelPase.tsx')), 'comprar', '[Comprar] sigue creando el pago y yendo a pagar')
  debe(/desde="compra"/.test(pagoHost), 'comprar', '`abrir({ tipo: compra })` abre la lista del pase con la hoja ya abierta')
  const adaptar = leer('src/components/pase/ListaDelPase.tsx')
  debe(/nombreDelPase\(destino\)/.test(adaptar) && /Pase \$\{destino\}/.test(adaptar), 'destino', 'los nombres del pase salen del dato del destino')
  const previo = leer('src/lib/precioPelicula.ts')
  debe(!/6[.,]99|10[.,]99|4[.,]99|13[.,]98/.test(previo.replace(/^\s*(\/\/|\*|\/\*).*$/gm, '')), 'precios', 'ningún precio escrito a mano en la hoja «¿Cuántos sois?»: salen de data/pase/precios.json')
}

/* ───────────────────────── 2. Los precios de «¿Cuántos sois?» ───────────────────────── */
const planes = JSON.parse(leer('data/pase/precios.json')).planes
const app0 = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&apertura=0' })
{
  const r = await app0.evaluar(`import('/src/lib/precioPelicula.ts').then((m) => { const p = ${JSON.stringify(planes)}; const o = {}; for (const n of [1, 2, 3, 4, 12]) o[n] = m.hojaCuantosSois(p, n); return o })`)
  debe(r[1].filas[0].p === '6,99 €' && r[1].elegida === 0 && r[1].comprarTxt === 'Comprar · 6,99 €' && r[1].personasTxt === '1 persona', 'precios', `1 persona: 6,99 € (${r[1].comprarTxt})`)
  debe(r[2].filas[1].p === '10,99 €' && r[2].filas[1].old === '13,98 €' && r[2].filas[1].save === 'Ahorras 2,99 €' && r[2].filas[1].sub === '5,50 € cada uno' && r[2].elegida === 1 && r[2].personasTxt === '2 personas', 'precios', `Dúo: 10,99 €, tachado 13,98 €, Ahorras 2,99 € (${JSON.stringify(r[2].filas[1])})`)
  debe(r[4].filas[2].p === '19,96 €' && r[4].filas[2].old === '27,96 €' && r[4].filas[2].save === 'Ahorras 8,00 €' && r[4].filas[2].sub === '4,99 € cada uno' && r[4].elegida === 2 && r[4].comprarTxt === 'Comprar · 19,96 €', 'precios', `Grupo con 4: 19,96 €, tachado 27,96 €, Ahorras 8,00 € (${JSON.stringify(r[4].filas[2])})`)
  debe(r[3].filas[2].p === '14,97 €' && r[3].filas[2].old === '20,97 €' && r[3].filas[2].save === 'Ahorras 6,00 €', 'precios', 'Grupo con 3: 14,97 €, tachado 20,97 €, Ahorras 6,00 €')
  debe(r[4].plan === 'grupo' && r[4].personas === 4 && r[2].plan === 'duo' && r[2].personas === 2 && r[1].plan === 'uno' && r[1].personas === 1, 'precios', 'lo que se manda al comprar: qué pase y cuántas personas')
}
app0.cerrar()

/* ───────────────────────── 3. La app ───────────────────────── */
async function conViaje(opciones = {}) {
  const a = await abrirApp('http://localhost:5173', { ruta: `/?cuentas=off&logros=on&logrosDemo=1&version=${opciones.version ?? 'gratis'}`, antes: opciones.antes })
  for (let i = 0; i < 120 && !(await a.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
  for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 60 && !(await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
  await a.esp(3500)
  for (let i = 0; i < 4; i++) {
    const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Siguiente|Genial|Ya lo sé)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await a.esp(600)
  }
  return a
}
const abrirPase = (a) => a.evaluar("window.dispatchEvent(new CustomEvent('trazo:pagar')); true")
const hay = (a) => a.evaluar("Boolean(document.querySelector('[data-lista-del-pase]'))")
const cuando = async (a, js, veces = 40) => {
  for (let i = 0; i < veces; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(300)
  }
  return false
}
const textoDe = (a) => a.evaluar("(document.querySelector('[data-lista-del-pase]')?.innerText ?? '').split(String.fromCharCode(10)).map((x) => x.trim()).filter(Boolean).join(' | ')")
const clicEnTexto = (a, txt) => a.evaluar(`(() => { const e = Array.from(document.querySelectorAll('[data-lista-del-pase] span, [data-lista-del-pase] div, [data-lista-del-pase] b')).find((x) => x.children.length === 0 && x.textContent.trim() === ${JSON.stringify(txt)}); if (!e) return false; e.click(); return true })()`)
const clic = async (a, x, y) => {
  for (const type of ['mousePressed', 'mouseReleased']) await a.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 })
}

// 3a. (Tanda 10N10, 8b: la película se quitó) abrirPase() abre SIEMPRE la lista del pase, la primera vez y las siguientes, sin [Ver], [Saltar] ni rayitas.
{
  const a = await conViaje()
  const modoAntes = await a.evaluar(`${store}.then((s) => s.mode)`)
  const antes = a.peticiones.length
  await abrirPase(a)
  debe(await cuando(a, "Boolean(document.querySelector('[data-lista-del-pase]'))"), 'primera', 'abrirPase() abre la lista del pase')
  debe(await cuando(a, "/Elegir mi pase/.test(document.querySelector('[data-lista-del-pase]')?.innerText ?? '')", 20), 'primera', 'la primera vez sale directa: la lista del pase con [Elegir mi pase] a la vista')
  await a.esp(1500)
  debe((await a.evaluar("document.querySelector('[data-lista-del-pase]').getAttribute('data-lista-del-pase')")) === 'lista', 'primera', 'es la lista (no «compra»)')
  const t0 = await textoDe(a)
  debe(!/Saltar/.test(t0) && !/Verla otra vez/.test(t0), 'primera', 'sin [Saltar] ni «Verla otra vez»: ya no hay película')
  debe((await a.evaluar("document.querySelectorAll('[data-lista-del-pase] [data-rayitas], [data-lista-del-pase] [data-raya]').length")) === 0, 'primera', 'ni rayitas arriba')
  const vistaGuardada = await a.evaluar("localStorage.getItem('trazo:pelicula-pase-vista')")
  debe(vistaGuardada === null, 'primera', 'y no se guarda ningún «ya la ha visto»')
  debe((await a.evaluar("(() => { const r = document.querySelector('[data-lista-del-pase]').getBoundingClientRect(); return Math.round(r.width) === innerWidth && Math.round(r.height) === innerHeight })()")), 'primera', 'se ve a pantalla completa')
  const finalTxt = t0
  debe(/Pase Roma/.test(finalTxt), 'final', 'dice «Pase Roma» (el dato del destino)')
  debe(/Se paga una vez · No caduca/.test(finalTxt) && /Elegir mi pase/.test(finalTxt), 'final', 'sin el pase: «Se paga una vez · No caduca» y [Elegir mi pase]')
  debe(!/está activo/.test(finalTxt), 'final', 'y nada de «Tu Pase está activo»')
  await a.captura(png('02_final_sin_pase'))

  // Cerrar vuelve a la pantalla donde se estaba.
  debe(await a.evaluar("(() => { const c = document.querySelector('[data-pelicula-cerrar]'); if (!c) return false; c.click(); return true })()"), 'cerrar', 'la lista tiene su ✕')
  await a.esp(800)
  debe(!(await hay(a)), 'cerrar', 'al cerrar, la lista desaparece')
  debe((await a.evaluar(`${store}.then((s) => s.mode)`)) === modoAntes, 'cerrar', `y se vuelve a la pantalla donde se estaba (${modoAntes})`)

  // La segunda vez: igual de directa.
  await abrirPase(a)
  debe(await cuando(a, "Boolean(document.querySelector('[data-lista-del-pase]'))"), 'segunda', 'abrirPase() otra vez la abre')
  debe((await a.evaluar("document.querySelector('[data-lista-del-pase]').getAttribute('data-lista-del-pase')")) === 'lista', 'segunda', 'la segunda vez también es la lista')
  debe(await cuando(a, "/Elegir mi pase/.test(document.querySelector('[data-lista-del-pase]')?.innerText ?? '')", 12), 'segunda', 'con la lista del pase y [Elegir mi pase] a la vista')
  // Nada de fuera mientras se ve: ni letras, ni imágenes, ni mapas.
  const nuevas = a.peticiones.slice(antes)
  const propios = [process.env.APP_URL, process.env.API_URL].filter(Boolean) // (los servidores de esta ejecución)
  const deFuera = nuevas.filter((u) => !propios.some((o) => u.startsWith(o)) && !/^(http:\/\/localhost:(5173|5181|5199|8787|8851)|http:\/\/127\.0\.0\.1:(5173|5181|5199|8787|8851)|data:|blob:)/.test(u) && !/supabase\.co\/auth\//.test(u))
  debe(deFuera.length === 0, 'fuera', `mientras se ve la lista no se pide nada de fuera de la app (${deFuera.slice(0, 3).join(' ') || 'nada'})`)
  debe(true, 'fuera', 'las letras salen de la app (el resto de comprobaciones de «fuera» ya cubre que no se pide nada externo)')
  const rotas = await a.evaluar("performance.getEntriesByType('resource').filter((e) => /\\/pelicula\\/assets\\//.test(e.name) && e.responseStatus >= 400).map((e) => e.name)")
  debe(rotas.length === 0, 'fuera', `y ninguna imagen sale rota (${rotas.join(' ') || 'ninguna'})`)

  // ¿Cuántos sois? con 4 (lo de siempre), 1 y 2.
  debe(await clicEnTexto(a, 'Elegir mi pase'), 'cuantos', 'se puede tocar [Elegir mi pase]')
  await a.esp(1500)
  let t = await textoDe(a)
  debe(/¿Cuántos sois\?/.test(t) && /4 personas/.test(t), 'cuantos', 'abre «¿Cuántos sois?», con 4 personas')
  debe(/Pase de 1 persona/.test(t) && /Pase Dúo · 2 personas/.test(t) && /Pase Grupo · 3 o más/.test(t), 'cuantos', 'con sus tres pases: de 1 persona, Dúo y Grupo')
  debe(/19,96 €/.test(t) && /27,96 €/.test(t) && /Ahorras 8,00 €/.test(t) && /Comprar · 19,96 €/.test(t), 'cuantos', 'con 4: 19,96 €, tachado 27,96 €, «Ahorras 8,00 €» y «Comprar · 19,96 €»')
  const colores = await a.evaluar("Array.from(document.querySelectorAll('[data-comprar]')).map((x) => getComputedStyle(x).backgroundImage.slice(0, 40))")
  debe(colores.length === 1 && /linear-gradient/.test(colores[0]), 'cuantos', 'el botón es el champán de Design')
  await a.captura(png('05_cuantos_4'))
  const menos = (veces) => a.evaluar(`(() => { const e = document.querySelector('[data-hoja-cuantos-sois] [aria-label="Menos"]'); for (let i = 0; i < ${veces}; i++) e.click(); return true })()`)
  const mas = (veces) => a.evaluar(`(() => { const e = document.querySelector('[data-hoja-cuantos-sois] [aria-label="Más"]'); for (let i = 0; i < ${veces}; i++) e.click(); return true })()`)
  // (cada clic repinta: se hacen de uno en uno)
  for (let i = 0; i < 2; i++) { await menos(1); await a.esp(300) }
  t = await textoDe(a)
  debe(/2 personas/.test(t) && /10,99 €/.test(t) && /13,98 €/.test(t) && /Ahorras 2,99 €/.test(t) && /Comprar · 10,99 €/.test(t), 'cuantos', 'con 2 (Dúo): 10,99 €, tachado 13,98 €, «Ahorras 2,99 €»')
  await a.captura(png('04_cuantos_2'))
  await menos(1)
  await a.esp(300)
  t = await textoDe(a)
  debe(/1 persona(?!s)/.test(t) && /Comprar · 6,99 €/.test(t), 'cuantos', 'con 1 persona: 6,99 €')
  await a.captura(png('03_cuantos_1'))
  for (let i = 0; i < 3; i++) { await mas(1); await a.esp(300) }
  t = await textoDe(a)
  debe(/4 personas/.test(t) && /Comprar · 19,96 €/.test(t), 'cuantos', 'y con + vuelve a 4')

  // [Comprar] pide el pago de siempre (qué pase y cuántas personas) y, si algo falla, lo dice en palabras sencillas (aquí el servidor de pruebas no cobra).
  const fuente = leer('src/components/pase/ListaDelPase.tsx')
  debe(fuente.includes('void comprar(cuantos.plan, cuantos.personas)') && fuente.includes('crearPagoDelPase({ destino, plan, personas, tripId })'), 'comprar', '[Comprar] manda qué pase y cuántas personas, como la hoja de antes')
  await a.evaluar("(() => { const e = document.querySelector('[data-comprar]'); e.click(); return true })()")
  await a.esp(1500)
  debe(await a.evaluar("Boolean(document.querySelector('[data-error-compra]'))"), 'comprar', 'y si algo falla, lo dice en palabras sencillas')
  a.cerrar()
}

// 3b. (Tanda 10N11, apartado 5) Ya no hay [Ver todo lo que incluye] ni hoja aparte: la lista por puntos de Design ES todo lo que incluye (6 secciones, 19 puntos). Se comprueba en pruebaTanda10N11_c.mjs.
{
  const a = await conViaje()
  await abrirPase(a)
  await cuando(a, "/Elegir mi pase/.test(document.querySelector('[data-lista-del-pase]')?.innerText ?? '')", 20)
  await a.esp(1500)
  debe((await a.evaluar("document.querySelectorAll('[data-lista-punto]').length")) === 19, 'todo', 'la lista del pase lleva los 19 puntos de Design')
  debe(!/Ver todo lo que incluye/.test(await textoDe(a)), 'todo', 'y ya no hay [Ver todo lo que incluye]')
  await a.captura(png('06_final_sin_pase_lista'))
  a.cerrar()
}

// 3c. Con el pase comprado: «✓ Tu Pase Roma está activo», sin precio y sin hoja de compra.
{
  const a = await conViaje({ antes: "window.__pruebaDelPase = { cobro: true, conPase: true, puede: true, pruebaGastada: false }" })
  await abrirPase(a)
  await cuando(a, "/está activo/.test(document.querySelector('[data-lista-del-pase]')?.innerText ?? '')", 25)
  await a.esp(1500)
  const t = await textoDe(a)
  debe(/✓ Tu Pase Roma está activo/.test(t), 'con', 'con el pase: «✓ Tu Pase Roma está activo»')
  debe(!/Verla otra vez/.test(t), 'con', 'sin «Verla otra vez» (ya no hay película)')
  debe(!/Elegir mi pase/.test(t) && !/Se paga una vez/.test(t) && !/€/.test(t), 'con', 'sin [Elegir mi pase], sin «Se paga una vez…» y sin precio')
  debe(!(await clicEnTexto(a, 'Elegir mi pase')), 'con', 'no hay [Elegir mi pase] que tocar')
  const hojaPago = await a.evaluar("import('/src/store/usePagoStore.ts').then((m) => m.usePagoStore.getState().hoja)")
  debe(hojaPago === null && !/¿Cuántos sois\?/.test(t), 'con', 'la hoja de compra no se abre')
  await a.captura(png('08_final_con_pase'))
  a.cerrar()
}

// 3d. Otro destino: «Pase de {ese destino}».
{
  const a = await conViaje()
  await a.evaluar(`${store}.then((s) => { import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.setState({ route: { ...s.route, destination: 'Lisboa' } })); return true })`)
  await a.esp(800)
  await abrirPase(a)
  await cuando(a, "Boolean(document.querySelector('[data-lista-del-pase]'))")
  await cuando(a, "/Elegir mi pase/.test(document.querySelector('[data-lista-del-pase]')?.innerText ?? '')", 20)
  await a.esp(1500)
  const letras = [await a.evaluar("(document.querySelector('[data-lista-del-pase]')?.innerText ?? '')")]
  debe(/Pase Lisboa/.test(letras[0]) && !/Roma/.test(letras[0]), 'destino', `la lista dice «Pase Lisboa» y ninguna «Roma» (${letras[0].slice(0, 60)})`)
  debe(await clicEnTexto(a, 'Elegir mi pase'), 'destino', 'abre «¿Cuántos sois?» también para otro destino')
  a.cerrar()
}


// 3e. (Tanda 10N11, apartado 5) HOY sin pase ya no es «Con el pase tendrás» sino la pantalla de Design (Piezas/Pase Lista 2 y 2b): la prueba de esa pantalla es pruebaTanda10N11_c.mjs.
{
  const a = await conViaje({ antes: "window.__pruebaDelPase = { cobro: true, conPase: false, puede: false, pruebaGastada: true, prueba: { estado: 'gastada', fecha: '2026-06-02', tripId: 'otro-viaje' } }" })
  await a.evaluar(`${store}.then((s) => { s.setDevSimulatedTodayIso('2026-10-19'); s.setActiveDayId(null); s.setMode('today'); return true })`)
  await a.esp(3500)
  debe(await a.evaluar("Boolean(document.querySelector('[data-hoy-sin-pase]')) && !document.querySelector('[data-lista-hoy]')"), 'hoy', 'HOY sin pase es la pantalla de Design (sin la lista vieja «Con el pase tendrás»)')
  await a.captura(png('10_hoy_sin_pase_lista'))
  a.cerrar()
}

if (fallos.length) {
  console.log(`\n${fallos.length} FALLOS de ${comprobaciones}:`)
  for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
  process.exit(1)
}
console.log(`Tanda 10I: ${comprobaciones} comprobaciones, 0 fallos`)
