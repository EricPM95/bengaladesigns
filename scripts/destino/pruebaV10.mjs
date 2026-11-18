// La prueba de la Tanda V10: «TODOS MIS LOGROS» (la tarjeta de cada destino con su foto y sus números, a todo el ancho si es uno solo, el selector «Destinos · Países», los logros de viajero del mismo tamaño y la página del destino con foto).
//   APP_URL=http://localhost:5199 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV10.mjs
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

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
const APP = process.env.APP_URL ?? 'http://localhost:5199'
const CAPTURAS = 'docs/dias/V10_capturas'
fs.mkdirSync(CAPTURAS, { recursive: true })

/* ───────── 1. Servidor y código ───────── */
console.log('1. El servidor y el código')
{
  const gan = leer('server/logros/pantallas/ganados.js')
  debe(/empezadas/.test(gan) && /pedazos: \{ ganados: pedazosGanados/.test(gan) && /avance: posibles > 0 \? hechos \/ posibles : 0/.test(gan), 'números', 'cada destino manda sus colecciones empezadas, sus pedazos y el % del destino ENTERO (pedazos y emblemas ganados entre el total)')
  const lista = leer('src/components/logros/pantallas/todos/TodosLista.tsx')
  debe(!/Sello de \$\{NOMBRE_DE_GRADO/.test(lista) && /nombre_grado/.test(lista), 'medalla', 'la tarjeta dice la medalla del destino como la hoja de logros (nombre y grado), no «Sello de plata»')
  debe(/data-selector-destinos-paises/.test(lista) && /background: '#1C2230', color: '#FFFDF8', padding: '16px 18px'/.test(lista), 'diseño', 'el selector pequeño «Destinos / Países» y la tarjeta oscura de arriba')
}

/* ───────── 2. En pantalla ───────── */
console.log('2. En pantalla (móvil de 390 px, demo de logros)')
const b = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=completa&apertura=0', ancho: 390, alto: 844 })
const ev = (js) => b.evaluar(js)
try {
  for (let i = 0; i < 120 && !(await ev("typeof window.__rutaPrueba === 'function'")); i++) await b.esp(500)
  await ev('window.__rutaPrueba().then(() => true)')
  const R = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore)"
  for (let i = 0; i < 90 && !(await ev(R + '.then((S) => Boolean(S.getState().route))')); i++) await b.esp(1000)
  await b.esp(2500)
  for (let i = 0; i < 6; i++) {
    await ev("(() => { const e = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Empezar mi día|Vale)$/.test(x.textContent.trim())); e?.click(); return true })()")
    await b.esp(600)
  }
  // Los datos del demo («poco»: Roma con un pedazo) y, para la fila, una copia como Lanzarote.
  const ponerGanados = async (n) => {
    const datosDemo = JSON.parse(leer('src/lib/logrosDemo_ganados_datos.json'))
    await ev(`import('/src/components/logros/pantallas/todos/api.ts').then((api) => {
      const g = ${JSON.stringify(datosDemo.lleno)}
      const poco = ${JSON.stringify(datosDemo.poco)}
      const base = { ...g, por_destino: poco.por_destino, paises: g.paises }
      if (${n} === 2) base.por_destino = [...poco.por_destino, { ...poco.por_destino[0], destino: 'lanzarote', ciudad: 'Lanzarote', sello: { ...poco.por_destino[0].sello, id: 'lanzarote', nombre: 'Lanzarote', nombre_grado: 'Primeros pasos en Lanzarote' }, pedazos: { ganados: 3, total: 41 }, colecciones: { completas: 0, total: 7, empezadas: 2 }, secretos: { encontrados: 2, total: 11 }, avance: 5 / 52 }]
      api.useGanados.getState().poner(base)
      return true
    })`)
  }
  const abrirTodos = async () => {
    await ev("import('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().cerrarTodo(); setTimeout(() => m.useLogrosPantallas.getState().abrir({ t: 'todos', pestana: 'todos' }), 100); return true })")
    for (let i = 0; i < 40 && !(await ev("Boolean(document.querySelector('[data-todos]'))")); i++) await b.esp(300)
    await b.esp(1500)
  }
  const leerDestinos = () =>
    ev(`(() => {
      const r = (e) => e ? (({ left, right, top, bottom, width, height }) => ({ left: Math.round(left), right: Math.round(right), width: Math.round(width), height: Math.round(height) }))(e.getBoundingClientRect()) : null
      const fila = document.querySelector('[data-fila-de-destinos]')
      const tarjetas = Array.from(document.querySelectorAll('[data-tarjeta-de-destino]'))
      return { modo: fila?.dataset.filaDeDestinos, fila: r(fila), tarjetas: tarjetas.map((t) => ({ destino: t.dataset.tarjetaDeDestino, ...r(t), foto: t.querySelector('[data-foto-de-destino]')?.dataset.fotoDeDestino, medalla: t.querySelector('[data-medalla-del-destino]')?.innerText, numeros: t.querySelector('[data-numeros-del-destino]')?.innerText, pct: t.querySelector('[aria-label$="del destino"]')?.innerText.trim() })) }
    })()`)

  // 2a. Un solo destino: la tarjeta, a todo el ancho; con foto y con los números de lo que lleva.
  await ev("window.__demoGanados.poner('poco'); true")
  await abrirTodos()
  const uno = await leerDestinos()
  debe(uno.modo === 'uno' && uno.tarjetas.length === 1 && uno.tarjetas[0].width >= uno.fila.width - 44, 'ancho', `con 1 destino, la tarjeta a todo el ancho (${uno.tarjetas[0]?.width} de ${uno.fila?.width})`)
  debe(uno.tarjetas[0]?.foto === '1', 'foto', 'la tarjeta lleva la FOTO del destino arriba')
  debe(/\d+ colecciones? empezadas?/.test(uno.tarjetas[0]?.numeros ?? '') && /\d+ pedazos?/.test(uno.tarjetas[0]?.numeros ?? '') && !/0 de \d+ colecciones/.test(uno.tarjetas[0]?.numeros ?? ''), 'números', `los números dicen lo que lleva, no «0 de 11» («${uno.tarjetas[0]?.numeros}»)`)
  debe(/^Bronce · Primeros pasos en Roma$/.test(uno.tarjetas[0]?.medalla ?? '') && !/Sello de/.test(uno.tarjetas[0]?.medalla ?? ''), 'medalla', `la medalla del destino como en la hoja de logros («${uno.tarjetas[0]?.medalla}»)`)
  debe(Number.parseInt(uno.tarjetas[0]?.pct ?? '', 10) >= 1, 'números', `el % del destino entero (${uno.tarjetas[0]?.pct})`)
  await b.captura(`${CAPTURAS}/todos_1_destino.jpg`)
  // Resto de «Todos mis logros».
  const resto = await ev(`(() => {
    const d = document.querySelector('[data-todos]')
    const caja = d.firstElementChild; const cs = getComputedStyle(caja)
    const tiles = Array.from(d.querySelectorAll('[data-tarjeta-de-viajero]')).map((t) => { const r = t.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)] })
    const sel = d.querySelector('[data-selector-destinos-paises]')
    const llaves = /\\{[a-z_]+\\}/i.test(d.innerText)
    return { fondo: cs.backgroundColor, texto: caja.innerText.split(String.fromCharCode(10)).join(' | '), tiles, selector: sel?.innerText.split(String.fromCharCode(10)).join(' · '), llaves, maravillas: Boolean(d.querySelector('[data-maravillas]')) }
  })()`)
  debe(/28, 34, 48/.test(resto.fondo) && /logros? conseguidos?/.test(resto.texto), 'arriba', `la tarjeta oscura con «N logros conseguidos» (${resto.texto})`)
  debe(resto.selector === 'Destinos · Países', 'selector', `el selector de dos opciones (${resto.selector})`)
  debe(resto.tiles.length >= 4 && resto.tiles.every((t) => t[0] === resto.tiles[0][0] && t[1] === resto.tiles[0][1]) && resto.tiles[0][0] >= 120, 'viajero', `los logros de viajero, todos del mismo tamaño y más grandes (${resto.tiles.length}: ${JSON.stringify(resto.tiles[0])})`)
  debe(resto.maravillas && !resto.llaves, 'resto', 'las 7 maravillas y ningún texto con {…}')
  await ev("document.querySelector('[data-todos]').scrollTop = 700; true")
  await b.esp(400)
  await b.captura(`${CAPTURAS}/todos_viajero.jpg`)
  // «Países»: una tarjeta por país, con el Vaticano dentro del viaje a Roma.
  await ev("document.querySelector('[data-todos]').scrollTop = 0; Array.from(document.querySelectorAll('[data-selector-destinos-paises] button')).find((x) => /Países/.test(x.textContent)).click(); true")
  await b.esp(600)
  const paises = await ev("document.querySelector('[data-todos]').innerText.split(String.fromCharCode(10)).join(' | ')")
  debe(/dentro del viaje a Roma|destino/.test(paises), 'países', 'en «Países», una tarjeta por país con sus destinos y medallas')
  await ev("Array.from(document.querySelectorAll('[data-selector-destinos-paises] button')).find((x) => /Destinos/.test(x.textContent)).click(); true")
  await b.esp(400)

  // 2b. Dos destinos: en fila y el segundo asoma.
  await abrirTodos()
  await b.esp(1500)
  await ponerGanados(2)
  await b.esp(1200)
  const dos = await leerDestinos()
  debe(dos.modo === 'varios' && dos.tarjetas.length === 2 && dos.tarjetas[0].width < 330 && dos.tarjetas[1].left < 390 && dos.tarjetas[1].right > 390, 'fila', `con 2 destinos, en fila y el segundo asoma (anchos ${dos.tarjetas.map((t) => t.width)}; el segundo empieza en ${dos.tarjetas[1]?.left})`)
  debe(/3 pedazos/.test(dos.tarjetas[1]?.numeros ?? '') && /2 secretos/.test(dos.tarjetas[1]?.numeros ?? '') && /2 colecciones empezadas/.test(dos.tarjetas[1]?.numeros ?? ''), 'números', `«2 colecciones empezadas · 3 pedazos · 2 secretos» («${dos.tarjetas[1]?.numeros}»)`)
  await b.captura(`${CAPTURAS}/todos_2_destinos.jpg`)

  // 2c. Tocar un destino: su página con la foto arriba.
  await ev("document.querySelector('[data-tarjeta-de-destino]').click(); true")
  for (let i = 0; i < 40 && !(await ev("Boolean(document.querySelector('[data-foto-de-destino]') && document.body.innerText.length > 100 && !document.querySelector('[data-todos]'))")); i++) await b.esp(300)
  await b.esp(1200)
  const pagina = await ev("({ foto: document.querySelector('[data-foto-de-destino]')?.dataset.fotoDeDestino, texto: document.body.innerText.slice(0, 200) })")
  debe(pagina.foto === '1', 'página', 'la página del destino lleva la foto arriba')
  await b.captura(`${CAPTURAS}/pagina_destino.jpg`)
} finally {
  await b.cerrar()
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
