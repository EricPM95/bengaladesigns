// La prueba de la Tanda 10I: la película del pase.
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
  const diseno = leer('docs/diseno/proyecto/Piezas/Pase Pelicula.dc.html')
  const gen = leer('src/components/pase/pelicula/gen/Pase_Pelicula.ts')
  const m = /export const plantilla = (.*)\nexport const css/.exec(gen)
  const plantilla = JSON.parse(m[1])
  const textos = []
  const recorre = (n) => {
    if (typeof n === 'string') {
      if (!n.includes('{{') && n.trim().length > 3) textos.push(n.trim())
      return
    }
    ;(n.c ?? []).forEach(recorre)
  }
  plantilla.forEach(recorre)
  const decodifica = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  const sinEtiquetas = decodifica(diseno.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, '\n'))
  const faltan = textos.filter((t) => !sinEtiquetas.includes(t))
  debe(textos.length > 150 && faltan.length === 0, 'textos', `los ${textos.length} textos de la película son los del archivo de Design, sin tocar (faltan: ${faltan.slice(0, 4).join(' | ') || 'ninguno'})`)
  // Los textos de H (títulos y subtítulos de cada escena) también son los de Design.
  const gl = leer('src/components/pase/pelicula/gen/Pase_Pelicula.ts')
  for (const t of ['Pon tu vuelo y dónde duermes.', 'Tu viaje se ordena solo.', 'Tu compañero de viaje', 'Te lleva, te avisa y se adelanta por ti.', 'Cada monumento te cuenta su historia.', 'Como una audioguía, en tu bolsillo.', 'Cada ciudad esconde secretos.', 'Cada sitio que ves, suma.', 'Gana experiencia y sube de nivel.', 'Rellena tu pasaporte', 'como siempre lo soñaste.', 'Tu viaje, guardado para siempre.']) {
    debe(gl.includes(t) && diseno.includes(t), 'textos', `«${t}» sale tal cual de Design`)
  }
  // Nada de fuera mientras se ve: ni en el código de la película ni en sus letras.
  const ficheros = [...fs.readdirSync('src/components/pase/pelicula/gen').map((f) => `src/components/pase/pelicula/gen/${f}`), 'src/components/pase/pelicula/pelicula.css', 'src/components/pase/pelicula/dc.tsx', 'src/components/pase/pelicula/adaptar.ts', 'src/components/pase/PeliculaPase.tsx', 'src/components/pase/PeliculaHost.tsx']
  const externos = []
  for (const f of ficheros) {
    for (const [i, l] of leer(f).split('\n').entries()) {
      const limpio = l.replace(/https?:\/\/www\.w3\.org\/[^\s"'`)]*/g, '').replace(/\/\/ GENERADO.*$/, '')
      if (/https?:\/\//.test(limpio) && !/^\s*(\*|\/\/)/.test(limpio)) externos.push(`${f}:${i + 1}`)
    }
  }
  debe(externos.length === 0, 'fuera', `ningún archivo de la película pide nada de fuera (${externos.join(', ') || 'ninguno'})`)
  const css = leer('src/components/pase/pelicula/pelicula.css')
  for (const familia of ['Geist', 'Geist Mono', 'Instrument Serif', 'Italiana']) debe(css.includes(`font-family: '${familia}'`), 'fuera', `la letra ${familia} va dentro de la app`)
  const fuentes = [...css.matchAll(/url\('([^']+)'\)/g)].map((x) => path.resolve('src/components/pase/pelicula', x[1]))
  debe(fuentes.length >= 8 && fuentes.every((f) => fs.existsSync(f)), 'fuera', `los ${fuentes.length} archivos de letras existen`)
  const mapas = leer('src/components/pase/pelicula/mapas.ts')
  debe(/land: "M/.test(mapas) && /countries: "M/.test(mapas) && /countries110: \{/.test(mapas), 'fuera', 'el mapa del mundo (world-atlas) va dentro de la app')
  debe(!/jsdelivr|unpkg|googleapis/.test(ficheros.map(leer).join('\n').replace(/\/\/ GENERADO[^\n]*/g, '').replace(/^\s*(\*|\/\/)[^\n]*$/gm, '')), 'fuera', 'ni jsdelivr, ni unpkg, ni googleapis')

  // La lista del final es UNA: la película, «Todo lo que incluye» y HOY la sacan del mismo sitio.
  const lista = leer('src/lib/listaDelPase.ts') // (la de Design, entera: la ajustada va encima, Tanda 10P)
  const nItems = (lista.match(/"titulo"/g) ?? []).length
  debe(nItems === 34, 'lista', `la lista del pase lleva 6 grupos y 28 filas (${nItems} títulos)`)
  const lh = leer('src/lib/listaDeHoy.ts')
  debe(/LISTA_DEL_PASE/.test(lh) && /listaAjustada/.test(lh) && /filasDeHoy\(\)/.test(leer('src/components/route/hoy/HoyAntes.tsx')), 'lista', 'HOY sin pase saca «Con el pase tendrás» de la lista del pase')
  debe(!/No me da tiempo\b/.test(leer('src/components/route/hoy/HoyAntes.tsx').replace(/^\s*(\/\/|\*|\/\*).*$/gm, '')), 'lista', 'ya no queda la lista vieja escrita en HOY («No me da tiempo»…)')
  debe(!fs.existsSync('src/components/pase/HojaDeCompra.tsx'), 'hoja', 'la hoja de compra de antes ya no existe: la sustituye «¿Cuántos sois?» de la película')
  debe(/abrirPase\(\): void/.test(leer('src/lib/pago.ts')) && /EVENTO_PAGAR/.test(leer('src/components/pase/PeliculaHost.tsx')) && !/EVENTO_PAGAR/.test(leer('src/components/pase/PagoHost.tsx').replace(/^\s*(\/\/|\*|\/\*).*$/gm, '')), 'abrir', 'abrirPase() lo escucha la película, no PagoHost')
  const pagoHost = leer('src/components/pase/PagoHost.tsx')
  debe(/crearPagoDelPase/.test(leer('src/components/pase/PeliculaPase.tsx')) && /irAPagar/.test(leer('src/components/pase/PeliculaPase.tsx')), 'comprar', '[Comprar] sigue creando el pago y yendo a pagar')
  debe(/desde="compra"/.test(pagoHost), 'comprar', '`abrir({ tipo: compra })` abre la película con la hoja ya abierta')
  // Una película para todos los destinos: ningún «Roma» escrito a mano en lo de la app (solo los ejemplos de Design).
  const adaptar = leer('src/components/pase/pelicula/adaptar.ts')
  debe(/nombreDelPase\(destino\)/.test(adaptar) && /TU VIAJE A \$\{destino\.toUpperCase\(\)\}/.test(adaptar), 'destino', 'los dos textos que cambian salen del dato del destino')
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
  const vista = await app0.evaluar("import('/src/lib/peliculaVista.ts').then((m) => ({ si: m.laCuentaDiceQueLaVio({ user_metadata: { pelicula_pase_vista: true } }), no: m.laCuentaDiceQueLaVio({ user_metadata: {} }), nada: m.laCuentaDiceQueLaVio(null) }))")
  debe(vista.si === true && vista.no === false && vista.nada === false, 'vista', 'la cuenta guarda si ya la vio (en los datos de la persona)')
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
    const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await a.esp(600)
  }
  return a
}
const abrirPase = (a) => a.evaluar("window.dispatchEvent(new CustomEvent('trazo:pagar')); true")
const hay = (a) => a.evaluar("Boolean(document.querySelector('[data-pelicula]'))")
const cuando = async (a, js, veces = 40) => {
  for (let i = 0; i < veces; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(300)
  }
  return false
}
const textoDe = (a) => a.evaluar("(document.querySelector('[data-pelicula]')?.innerText ?? '').split(String.fromCharCode(10)).map((x) => x.trim()).filter(Boolean).join(' | ')")
const clicEnTexto = (a, txt) => a.evaluar(`(() => { const e = Array.from(document.querySelectorAll('[data-pelicula] span, [data-pelicula] div, [data-pelicula] b')).find((x) => x.children.length === 0 && x.textContent.trim() === ${JSON.stringify(txt)}); if (!e) return false; e.click(); return true })()`)
const clic = async (a, x, y) => {
  for (const type of ['mousePressed', 'mouseReleased']) await a.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 })
}

// 3a. La primera vez: la película entera. Después, directa al final.
{
  const a = await conViaje()
  const modoAntes = await a.evaluar(`${store}.then((s) => s.mode)`)
  const antes = a.peticiones.length
  await abrirPase(a)
  debe(await cuando(a, "Boolean(document.querySelector('[data-pelicula]'))"), 'primera', 'abrirPase() abre la película')
  await a.esp(1500)
  debe((await a.evaluar("document.querySelector('[data-pelicula]').getAttribute('data-pelicula')")) === 'principio', 'primera', 'la primera vez sale entera, desde el principio')
  const t0 = await textoDe(a)
  debe(/Saltar/.test(t0), 'primera', 'con su botón [Saltar]')
  debe(!/Elegir mi pase/.test(t0), 'primera', 'y todavía no es el final')
  // (Tanda 10N5 §5: las rayitas son tocables: cada una es un [data-raya])
  const barra = await a.evaluar("document.querySelectorAll('[data-pelicula] [data-rayitas] [data-raya]').length")
  debe(barra === 7, 'primera', `la barra de arriba marca por qué escena va (7 tramos: ${barra})`)
  const escala = await a.evaluar("(() => { const r = document.querySelector('[data-pelicula] .pfr').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) } })()")
  debe(escala.w === 390 && escala.h === 844, 'primera', `se ve entera en un móvil de 390 x 844 (${escala.w} x ${escala.h})`)
  await a.captura(png('01_principio'))

  // Pasa de escena sola (la escena 1 empieza a los 17 s): se comprueba con [tocar a la derecha] para no esperar.
  await clic(a, 330, 420)
  await a.esp(1500)
  const t1 = await textoDe(a)
  debe(/JUE 17 · CENTRO HISTÓRICO|Tu compañero de viaje/.test(t1), 'primera', 'tocar a la derecha pasa a la escena siguiente')

  // [Saltar] lleva al final.
  debe(await clicEnTexto(a, 'Saltar'), 'saltar', 'se puede tocar [Saltar]')
  debe(await cuando(a, "/Elegir mi pase/.test(document.querySelector('[data-pelicula]')?.innerText ?? '')"), 'saltar', '[Saltar] lleva al final: [Elegir mi pase]')
  await a.esp(1200)
  const vista = await a.evaluar("localStorage.getItem('trazo:pelicula-pase-vista')")
  debe(vista === '1', 'saltar', 'queda guardado que ya la ha visto (sin sesión, en el móvil)')
  const finalTxt = await textoDe(a)
  debe(/Pase de Roma/.test(finalTxt.replace(/ \| /g, '')) || (await a.evaluar("Array.from(document.querySelectorAll('[data-pelicula] div')).some((d) => d.children.length >= 8 && Array.from(d.children).map((c) => c.textContent).join('') === 'Pase de Roma')")), 'final', 'el final dice «Pase de Roma» (el dato del destino)')
  debe(/Se paga una vez y no caduca/.test(finalTxt) && /Ver todo lo que incluye/.test(finalTxt) && /Elegir mi pase/.test(finalTxt), 'final', 'sin el pase: «Se paga una vez y no caduca», [Elegir mi pase] y [Ver todo lo que incluye]')
  debe(!/está activo/.test(finalTxt) && !/Verla otra vez/.test(finalTxt), 'final', 'y nada de «Tu Pase está activo»')
  await a.captura(png('02_final_sin_pase'))

  // Cerrar vuelve a la pantalla donde se estaba.
  debe(await a.evaluar("(() => { const c = document.querySelector('[data-pelicula-cerrar]'); if (!c) return false; c.click(); return true })()"), 'cerrar', 'el final tiene su ✕')
  await a.esp(800)
  debe(!(await hay(a)), 'cerrar', 'al cerrar, la película desaparece')
  debe((await a.evaluar(`${store}.then((s) => s.mode)`)) === modoAntes, 'cerrar', `y se vuelve a la pantalla donde se estaba (${modoAntes})`)

  // La segunda vez: directa al final.
  await abrirPase(a)
  debe(await cuando(a, "Boolean(document.querySelector('[data-pelicula]'))"), 'segunda', 'abrirPase() otra vez la abre')
  debe((await a.evaluar("document.querySelector('[data-pelicula]').getAttribute('data-pelicula')")) === 'final', 'segunda', 'la segunda vez sale directa al final')
  debe(await cuando(a, "/Elegir mi pase/.test(document.querySelector('[data-pelicula]')?.innerText ?? '')", 12), 'segunda', 'con la lista del pase y [Elegir mi pase] a la vista')
  // Nada de fuera mientras se ve: ni letras, ni imágenes, ni mapas.
  const nuevas = a.peticiones.slice(antes)
  const propios = [process.env.APP_URL, process.env.API_URL].filter(Boolean) // (los servidores de esta ejecución)
  const deFuera = nuevas.filter((u) => !propios.some((o) => u.startsWith(o)) && !/^(http:\/\/localhost:(5173|5181|5199|8787|8851)|http:\/\/127\.0\.0\.1:(5173|5181|5199|8787|8851)|data:|blob:)/.test(u) && !/supabase\.co\/auth\//.test(u)) // (lo único que sale es guardar en la cuenta que ya la vio)
  debe(deFuera.length === 0, 'fuera', `mientras se ve la película no se pide nada de fuera de la app (${deFuera.slice(0, 3).join(' ') || 'nada'})`)
  debe(nuevas.some((u) => /\/pelicula\/assets\/marco-nivel1\.png/.test(u)) && nuevas.some((u) => /geist-latin-wght-normal\.woff2/.test(u)), 'fuera', 'las imágenes y las letras salen de la app')
  const rotas = await a.evaluar("performance.getEntriesByType('resource').filter((e) => /\\/pelicula\\/assets\\//.test(e.name) && e.responseStatus >= 400).map((e) => e.name)")
  debe(rotas.length === 0, 'fuera', `y ninguna imagen sale rota (${rotas.join(' ') || 'ninguna'})`)

  // ¿Cuántos sois? con 4 (lo de siempre), 1 y 2.
  debe(await clicEnTexto(a, 'Elegir mi pase'), 'cuantos', 'se puede tocar [Elegir mi pase]')
  await a.esp(1500)
  let t = await textoDe(a)
  debe(/¿Cuántos sois\?/.test(t) && /4 personas/.test(t), 'cuantos', 'abre «¿Cuántos sois?», con 4 personas')
  debe(/Pase de 1 persona/.test(t) && /Pase Dúo · 2 personas/.test(t) && /Pase Grupo · 3 o más/.test(t), 'cuantos', 'con sus tres pases: de 1 persona, Dúo y Grupo')
  debe(/19,96 €/.test(t) && /27,96 €/.test(t) && /Ahorras 8,00 €/.test(t) && /Comprar · 19,96 €/.test(t), 'cuantos', 'con 4: 19,96 €, tachado 27,96 €, «Ahorras 8,00 €» y «Comprar · 19,96 €»')
  const colores = await a.evaluar("Array.from(document.querySelectorAll('[data-pelicula] span')).filter((x) => /^Comprar · /.test(x.textContent.trim()) && x.children.length === 0).map((x) => getComputedStyle(x).backgroundImage.slice(0, 40))")
  debe(colores.length === 1 && /linear-gradient/.test(colores[0]), 'cuantos', 'el botón es el champán de Design')
  await a.captura(png('05_cuantos_4'))
  const menos = (veces) => a.evaluar(`(() => { const e = Array.from(document.querySelectorAll('[data-pelicula] span')).find((x) => x.children.length === 0 && x.textContent.trim() === '−'); for (let i = 0; i < ${veces}; i++) e.click(); return true })()`)
  const mas = (veces) => a.evaluar(`(() => { const e = Array.from(document.querySelectorAll('[data-pelicula] span')).find((x) => x.children.length === 0 && x.textContent.trim() === '+'); for (let i = 0; i < ${veces}; i++) e.click(); return true })()`)
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
  const fuente = leer('src/components/pase/PeliculaPase.tsx')
  debe(fuente.includes('comprar: () => void comprar(hoja.plan, hoja.personas)') && fuente.includes('crearPagoDelPase({ destino, plan, personas, tripId })'), 'comprar', '[Comprar] manda qué pase y cuántas personas, como la hoja de antes')
  await a.evaluar("(() => { const e = document.querySelector('[data-comprar]'); e.click(); return true })()")
  await a.esp(1500)
  debe(await a.evaluar("Boolean(document.querySelector('[data-error-compra]'))"), 'comprar', 'y si algo falla, lo dice en palabras sencillas')
  a.cerrar()
}

// 3b. «Ver todo lo que incluye» = la misma lista del final.
{
  const a = await conViaje({ antes: "try{localStorage.setItem('trazo:pelicula-pase-vista','1')}catch(e){}" })
  await abrirPase(a)
  await cuando(a, "/Elegir mi pase/.test(document.querySelector('[data-pelicula]')?.innerText ?? '')", 20)
  await a.esp(1500)
  // La lista del final, en el orden en que sale en pantalla (títulos de grupo, nombre y línea).
  const final = await a.evaluar(`(() => {
    const lista = Array.from(document.querySelectorAll('[data-pelicula] div')).find((d) => d.style.overflowY === 'auto' && d.style.top === '196px')
    if (!lista) return null
    return Array.from(lista.children).map((c) => Array.from(c.querySelectorAll('span')).filter((s) => s.children.length === 0).map((s) => s.textContent.trim()).filter(Boolean).join(' ‖ ') || c.textContent.trim())
  })()`)
  await a.captura(png('06_final_sin_pase_lista'))
  debe(await clicEnTexto(a, 'Ver todo lo que incluye'), 'todo', 'se puede tocar [Ver todo lo que incluye]')
  await a.esp(1500)
  const hoja = await a.evaluar(`(() => {
    const t = Array.from(document.querySelectorAll('[data-pelicula] span')).find((x) => x.textContent.trim() === 'Todo lo que incluye')
    if (!t) return null
    const hoja = t.closest('div[style*="border-radius: 30px"]')
    const lista = Array.from(hoja.querySelectorAll('div')).find((d) => d.style.maxHeight === '470px')
    const grupos = []
    for (const caja of Array.from(lista.children)) {
      const cab = caja.children[0].textContent.trim()
      const filas = Array.from(caja.children).slice(1).map((f) => Array.from(f.querySelectorAll('span')).filter((s) => s.children.length === 0).map((s) => s.textContent.trim()).filter(Boolean))
      grupos.push({ cab, filas })
    }
    return grupos
  })()`)
  await a.captura(png('07_todo_incluye'))
  debe(Array.isArray(hoja) && hoja.length === 6, 'todo', `la hoja lleva los 6 grupos de la lista (${hoja?.length})`)
  const lista = await a.evaluar("import('/src/lib/listaAjustada.ts').then((m) => m.LISTA_DEL_PASE.map((g) => ({ cab: g.titulo, filas: g.items.map((i) => [i.titulo, i.linea].filter(Boolean)) })))")
  // (Tanda 10P: «HOY» sale en oro, en su propio trozo de texto: se junta con la línea para comparar)
  const juntar = (filas) => filas.map((fl) => (fl.length === 3 && fl[2] === 'HOY' ? [fl[0], `${fl[1]} HOY`] : fl))
  for (const g of hoja) g.filas = juntar(g.filas)
  debe(JSON.stringify(hoja) === JSON.stringify(lista), 'todo', 'y es la misma lista: los mismos nombres, las mismas líneas y el mismo orden que LISTA_DEL_PASE')
  // La del final de la película (la que se ve en pantalla) lleva los mismos nombres en el mismo orden.
  const deLista = lista.flatMap((g) => [g.cab, ...g.filas.map((f) => f.join(' ‖ '))])
  debe(Array.isArray(final) && JSON.stringify(final.map((x) => x.replace(/^‖ /, '').replace(/ con ‖ HOY$/, ' con HOY').replace(/^Invita a un amigo ‖ HOY$/, 'Invita a un amigo ‖ Gana 200 EXP cuando haga su primer viaje con HOY'))) === JSON.stringify(deLista.map((x) => x)), 'todo', `el final de la película y la hoja son la misma lista (${final?.length} filas)`)
  a.cerrar()
}

// 3c. Con el pase comprado: «✓ Tu Pase de Roma está activo», sin precio y sin hoja de compra.
{
  const a = await conViaje({ antes: "try{localStorage.setItem('trazo:pelicula-pase-vista','1')}catch(e){}; window.__pruebaDelPase = { cobro: true, conPase: true, puede: true, pruebaGastada: false }" })
  await abrirPase(a)
  await cuando(a, "/está activo/.test(document.querySelector('[data-pelicula]')?.innerText ?? '')", 25)
  await a.esp(1500)
  const t = await textoDe(a)
  debe(/✓ Tu Pase de Roma está activo/.test(t), 'con', 'con el pase: «✓ Tu Pase de Roma está activo»')
  debe(/Verla otra vez/.test(t) && /Ver todo lo que incluye/.test(t), 'con', 'con [Verla otra vez] y [Ver todo lo que incluye]')
  debe(!/Elegir mi pase/.test(t) && !/Se paga una vez y no caduca/.test(t) && !/€/.test(t), 'con', 'sin [Elegir mi pase], sin «Se paga una vez…» y sin precio')
  debe(!(await clicEnTexto(a, 'Elegir mi pase')), 'con', 'no hay [Elegir mi pase] que tocar')
  const hojaPago = await a.evaluar("import('/src/store/usePagoStore.ts').then((m) => m.usePagoStore.getState().hoja)")
  debe(hojaPago === null && !/¿Cuántos sois\?/.test(t), 'con', 'la hoja de compra no se abre')
  await a.captura(png('08_final_con_pase'))
  // [Verla otra vez]: la película entera desde el principio.
  debe(await clicEnTexto(a, 'Verla otra vez'), 'con', 'se puede tocar [Verla otra vez]')
  await a.esp(3000)
  const t2 = await textoDe(a)
  debe(/Saltar/.test(t2) && !/está activo/.test(t2), 'con', '[Verla otra vez] vuelve a empezar la película')
  a.cerrar()
}

// 3d. Otro destino: «Pase de {ese destino}» y «Tu viaje a {ese destino}».
{
  const a = await conViaje({ antes: "try{localStorage.setItem('trazo:pelicula-pase-vista','1')}catch(e){}" })
  await a.evaluar(`${store}.then((s) => { import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.setState({ route: { ...s.route, destination: 'Lisboa' } })); return true })`)
  await a.esp(800)
  await a.evaluar("try { localStorage.removeItem('trazo:pelicula-pase-vista') } catch (e) {}; true")
  await abrirPase(a)
  await cuando(a, "Boolean(document.querySelector('[data-pelicula]'))")
  await a.esp(800)
  debe((await a.evaluar("document.querySelector('[data-pelicula]').getAttribute('data-pelicula-destino')")) === 'Lisboa', 'destino', 'la película sabe el destino del viaje')
  // Escena 6 (la sexta toque a la derecha: 0 → 1 → 3 → 4 → 5 → 6): «TU VIAJE A LISBOA».
  for (let i = 0; i < 5; i++) { await clic(a, 330, 420); await a.esp(500) }
  await a.esp(3500)
  const t6 = await textoDe(a)
  debe(/TU VIAJE A LISBOA/.test(t6) && !/TU VIAJE A ROMA/.test(t6), 'destino', '«Tu viaje a Lisboa» en la tarjeta de la escena 6')
  debe(/10 oct \| Roma/.test(t6) || /Roma/.test(t6), 'destino', 'el resto sigue de Roma, como ejemplo (10 oct · Roma)')
  await a.captura(png('09_escena_6_lisboa'))
  debe(await clicEnTexto(a, 'Saltar'), 'destino', 'se salta al final')
  await cuando(a, "/Elegir mi pase/.test(document.querySelector('[data-pelicula]')?.innerText ?? '')", 20)
  await a.esp(1500)
  const letras = await a.evaluar("Array.from(document.querySelectorAll('[data-pelicula] div')).filter((d) => d.children.length >= 8 && Array.from(d.children).every((c) => c.tagName === 'SPAN' && c.textContent.length === 1)).map((d) => Array.from(d.children).map((c) => c.textContent).join(''))")
  debe(letras.includes('Pase de Lisboa') && !letras.includes('Pase de Roma'), 'destino', `el final dice «Pase de Lisboa» (${letras.join(' / ')})`)
  debe(await clicEnTexto(a, 'Elegir mi pase'), 'destino', 'abre «¿Cuántos sois?» también para otro destino')
  a.cerrar()
}

// 3e. HOY sin pase: «Con el pase tendrás» sale de la misma lista.
{
  const a = await conViaje({ antes: "window.__pruebaDelPase = { cobro: true, conPase: false, puede: false, pruebaGastada: true, prueba: { estado: 'gastada', fecha: '2026-06-02', tripId: 'otro-viaje' } }" })
  await a.evaluar("import('/src/store/useSyncStore.ts').then((m) => { m.useSyncStore.getState().setActiveTripId('viaje-de-esta-prueba'); return true })")
  await a.evaluar(`${store}.then((s) => { s.setDevSimulatedTodayIso('2026-10-19'); s.setActiveDayId(null); s.setMode('today'); return true })`)
  await a.esp(3500)
  const hoy = await a.evaluar(`(() => {
    const ul = document.querySelector('[data-lista-hoy]')
    if (!ul) return null
    return { filas: Array.from(ul.children).map((li) => Array.from(li.querySelectorAll('span')).filter((s) => s.children.length === 0 && s.textContent.trim()).map((s) => s.textContent.trim())), iconos: Array.from(ul.querySelectorAll('svg')).length, titulo: /con el pase tendrás/i.test(document.body.innerText) }
  })()`)
  debe(Boolean(hoy) && hoy.titulo, 'hoy', 'HOY sin pase enseña «Con el pase tendrás»')
  const esperadas = await a.evaluar("import('/src/lib/listaDeHoy.ts').then((m) => m.filasDeHoy().map((i) => [i.titulo, i.linea]))")
  debe(hoy && JSON.stringify(hoy.filas) === JSON.stringify(esperadas) && esperadas.length === 5, 'hoy', `con los nombres y las líneas de la lista del pase (${JSON.stringify(hoy?.filas?.map((f) => f[0]))})`)
  debe(hoy && hoy.iconos === 5, 'hoy', 'con sus iconos (los de la lista del pase)')
  const lista = await a.evaluar("import('/src/lib/listaAjustada.ts').then((m) => m.LISTA_DEL_PASE.flatMap((g) => g.items).map((i) => i.titulo))")
  debe(esperadas.every((f) => lista.includes(f[0])), 'hoy', 'todas están en la lista del final de la película')
  const posiciones = esperadas.map((f) => lista.indexOf(f[0]))
  debe(posiciones.every((p, i) => i === 0 || p > posiciones[i - 1]), 'hoy', 'y en el mismo orden que en la película')
  const viejos = await a.evaluar("/No me da tiempo|Escuchar lo que ves|Lo que tienes cerca|Los avisos del día/.test(document.body.innerText)")
  debe(!viejos, 'hoy', 'ya no quedan los nombres viejos')
  await a.evaluar("(() => { const e = document.querySelector('[data-lista-hoy]'); if (e) e.scrollIntoView({ block: 'center' }); return true })()")
  await a.esp(800)
  await a.captura(png('10_hoy_sin_pase_lista'))
  a.cerrar()
}

if (fallos.length) {
  console.log(`\n${fallos.length} FALLOS de ${comprobaciones}:`)
  for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
  process.exit(1)
}
console.log(`Tanda 10I: ${comprobaciones} comprobaciones, 0 fallos`)
