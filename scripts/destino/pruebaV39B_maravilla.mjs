// La prueba de la Tanda V39B, parte UNA MARAVILLA NUEVA: de la 1.ª a la 6.ª maravilla, su propia pantalla (la medalla de las 7 con las monedas ya conseguidas en oro y las demás en plata; la nueva baja, encaja y se enciende;
// debajo «El Coliseo · 1 de 7» y su línea); ya NO va dentro de «Y además…»; la 7.ª sigue con su final. Con su partitura, su tarjeta en el estudio (1 de 7 y 4 de 7) y las líneas de los datos (el Cristo Redentor, corregido).
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV39B_maravilla.mjs
// La parte de código y datos no necesita servidores; la de pantalla, Vite. Ninguna parte toca el Supabase de producción ni lo guardado de nadie (el navegador de pruebas es de usar y tirar).
import fs from 'node:fs'
import { build } from 'esbuild'
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
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const cargar = async (entrada) => {
  const b = await build({ entryPoints: [entrada], bundle: true, format: 'esm', platform: 'node', write: false, define: { 'import.meta.env': '{}' } })
  return import('data:text/javascript;base64,' + Buffer.from(b.outputFiles[0].text).toString('base64'))
}
const J = async (a, js) => {
  const r = await a.evaluar(js)
  return typeof r === 'string' ? JSON.parse(r) : r
}
const esperar = async (a, js, n = 80) => {
  for (let i = 0; i < n; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(250)
  }
  return false
}
const toque = async (a, sel) => {
  const r = JSON.parse(await a.evaluar(`(() => { const e = document.querySelector('${sel}'); e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return JSON.stringify({ x: b.left + b.width / 2, y: b.top + b.height / 2 }) })()`))
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await a.cdp('Input.dispatchMouseEvent', { type, x: r.x, y: r.y, button: 'left', clickCount: 1 })
}
const cerca = (x, y, e = 1e-6) => Math.abs(x - y) < e

/* ───────── 1. Código y datos ───────── */
console.log('1. El plan, los datos, los tiempos y la partitura')
const datos = JSON.parse(leer('data/logros/viajero.json'))
const ORDEN = ['coliseo', 'gran_muralla', 'petra', 'cristo_redentor', 'machu_picchu', 'chichen_itza', 'taj_mahal']
const P = await cargar('src/components/logros/momentos/plan.ts')
const T = await cargar('src/lib/sonidos/tiempos.ts')
const PA = await cargar('src/lib/sonidos/partituras.ts')
const E = await cargar('src/lib/sonidos/estudio.ts')
const S = await cargar('src/lib/sonidos.ts')
const m = (tipo, extra = {}) => ({ tipo, nombre: tipo, primera_vez: true, ...extra })
const maravilla = (n) => m('maravilla', { id: ORDEN[n - 1], n, maravillas: ORDEN.slice(0, n), nombre: datos.maravillas[ORDEN[n - 1]].nombre, linea: datos.maravillas[ORDEN[n - 1]].linea })
{
  for (let n = 1; n <= 6; n++) {
    const pl = P.planificar([maravilla(n)])
    debe(pl.length === 1 && pl[0].tipo === 'maravilla_nueva' && pl[0].momentos[0].n === n, 'plan', `la maravilla ${n} de 7 (${ORDEN[n - 1]}) tiene su pantalla «Una maravilla nueva» (${pl.map((p) => p.tipo).join()})`)
  }
  const siete = P.planificar([maravilla(7)])
  debe(siete.length === 1 && siete[0].tipo === 'final7', 'plan', 'la 7.ª maravilla sigue con su final («El final de las 7 maravillas»)')
  const con = P.planificar([m('pais'), maravilla(2), m('patrimonio'), m('viajero')])
  debe(con.map((p) => p.tipo).join() === 'maravilla_nueva,pais,patrimonio,viajero' && con.every((p) => p.momentos.length === 1), 'ademas', `(V71) la maravilla en su pantalla y país, Patrimonio y logro de viajero cada uno en la suya, sin «Y además…» (${con.map((p) => p.tipo).join()})`)
  const sola = P.planificar([maravilla(3), m('pais')])
  debe(sola.map((p) => p.tipo).join() === 'maravilla_nueva,pais', 'ademas', 'con el país solo, cada una su pantalla: la maravilla y el sellado del pasaporte')
  // El orden: primero el emblema del Coliseo (su película), después la maravilla. El servidor ya los manda así; el cliente lo mantiene aunque lleguen al revés.
  const emblema = m('emblema', { id: 'coliseo', cat: 'emblema', maravilla: 'coliseo' })
  const sello = m('sello', { sello: 'roma', grado: 'bronce', cat: 'sello' })
  const cole = { ...maravilla(1), cat: 'maravilla' }
  const tal = P.planificar([emblema, cole])
  const alReves = P.planificar([cole, emblema])
  debe(tal.map((p) => p.tipo).join() === 'emblema,maravilla_nueva' && alReves.map((p) => p.tipo).join() === 'emblema,maravilla_nueva', 'orden', `el Coliseo: primero el emblema (su película) y después «Una maravilla nueva», llegue como llegue (${tal.map((p) => p.tipo).join()} / ${alReves.map((p) => p.tipo).join()})`)
  const todo = P.planificar(P.ordenarComoElServidor([{ ...m('pais'), cat: 'pais' }, cole, { ...m('suma'), coleccion: 'imprescindibles', cat: 'pedazo' }, emblema, sello, { ...m('patrimonio'), cat: 'patrimonio' }]))
  debe(todo.map((p) => p.tipo).join() === 'pedazos,emblema,sello,maravilla_nueva,pais,patrimonio', 'orden', `(V71) la ronda entera del Coliseo: pedazos, emblema, sello, «Una maravilla nueva», país y Patrimonio, cada uno su pantalla (${todo.map((p) => p.tipo).join()})`)
  debe(todo[3].momentos.length === 1, 'orden', 'sale de una en una')
  const dos = P.planificar([maravilla(1), maravilla(2)])
  debe(dos.map((p) => p.tipo).join() === 'maravilla_nueva,maravilla_nueva', 'orden', 'dos maravillas en la misma ronda: una pantalla cada una (de una en una)')
  debe(P.sonidoDePantalla('maravilla_nueva') === 'maravilla_nueva' && P.sonidoDePantalla('final7') === 'maravilla', 'sonido', 'la pantalla suena «maravilla_nueva»; el final de las 7 sigue con «maravilla»')
  const rep = sinComentarios(leer('src/components/logros/momentos/Reproductor.tsx'))
  debe(/return sonidoDePantalla\(p\.tipo\)/.test(rep) && !/maravilla_nueva/.test(rep), 'sonido', 'el Reproductor saca el sonido de cada pantalla del plan (una sola fuente: plan.ts)')
  // El primer aviso al ganarlo (reproducirMomentos / sonidoDeMomentos).
  const m1 = [{ tipo: 'maravilla', n: 1 }]
  debe(S.sonidoDeMomentos(['maravilla'], m1) === 'maravilla_nueva' && S.sonidoDeMomentos(['maravilla'], [{ tipo: 'maravilla', n: 7 }]) === 'maravilla' && S.sonidoDeMomentos(['maravilla']) === 'maravilla', 'sonido', 'al ganarla suena «maravilla_nueva» (1.ª a 6.ª) o «maravilla» (la 7.ª, el final)')
  debe(S.sonidoDeMomentos(['maravilla', 'emblema'], m1.concat([{ tipo: 'emblema' }])) === 'emblema' && S.sonidoDeMomentos(['maravilla', 'emblema']) === 'maravilla', 'sonido', 'con el emblema del Coliseo a la vez, suena el emblema (va primero); sin saber el número, como siempre')
  debe(S.IMPORTANCIA_DE_MOMENTOS.includes('maravilla_nueva'), 'sonido', 'está en la lista de importancia de los momentos')
}

console.log('   Las líneas son las de los datos')
{
  debe(ORDEN.every((id) => datos.maravillas[id]?.nombre && datos.maravillas[id]?.linea), 'datos', 'las siete maravillas tienen nombre y línea en data/logros/viajero.json')
  const cristo = datos.maravillas.cristo_redentor.linea
  debe(/30 metros/.test(cristo) && !/30 metros de brazos/.test(cristo) && !/brazos abiertos de 30/.test(cristo), 'cristo', `el Cristo Redentor ya no dice que mide 30 metros «de brazos» (mide unos 30 m de alto y 28 de brazo a brazo): «${cristo}»`)
  debe(/Río/.test(cristo) && /brazos abiertos/.test(cristo), 'cristo', 'y sigue hablando de sus brazos abiertos sobre Río')
  const mom1 = E.MOMENTOS_DEL_ESTUDIO.maravilla_nueva()[0]
  const mom4 = E.MOMENTOS_DEL_ESTUDIO.maravilla_nueva_cuatro()[0]
  debe(mom1.nombre === datos.maravillas.coliseo.nombre && mom1.linea === datos.maravillas.coliseo.linea && mom1.n === 1 && mom1.maravillas.join() === 'coliseo', 'estudio', 'la tarjeta de 1 de 7 usa el nombre y la línea de los datos (El Coliseo)')
  debe(mom4.nombre === datos.maravillas.cristo_redentor.nombre && mom4.linea === cristo && mom4.n === 4 && mom4.maravillas.length === 4 && mom4.maravillas[3] === 'cristo_redentor', 'estudio', 'la de 4 de 7, con el Cristo Redentor y tres monedas ya conseguidas')
  const srv = sinComentarios(leer('server/logros/momentos.js'))
  debe(/datos\.viajero\.maravillas\[it\.escalon\]/.test(srv) && /nombre: m\?\.nombre \?\? it\.escalon, linea: m\?\.linea \?\? null/.test(srv), 'datos', 'el servidor saca nombre y línea de la maravilla de data/logros/viajero.json (nada escrito en las pantallas)')
  const pant = sinComentarios(leer('src/components/logros/momentos/pantallas.tsx'))
  debe(!/La ciudad|Una estatua|mausoleo|serpiente de luz|Más de 20\.000/.test(pant), 'datos', 'las pantallas no llevan escritas las líneas de las maravillas')
  const dm = sinComentarios(leer('src/components/logros/momentos/demoMomentos.ts'))
  debe(!/rosada|brazos abiertos/.test(dm) && /maravillaGanada\(\['coliseo', 'petra'\]\)/.test(dm), 'datos', 'el modo de pruebas (demoMomentos) también las lee de los datos')
}

console.log('   Tiempos y partitura')
{
  const t = T.TIEMPOS_DE_MARAVILLA_NUEVA
  debe(t && cerca(t.llega, 0.8) && cerca(t.encaja, 0.8 + 1.5 * 0.72) && cerca(t.brilla, 0.8 + 0.95 + 1.4 * 0.35) && t.cta === 3.4 && t.nombre === 2.7 && t.linea === 3, 'tiempos', `los tiempos del diseño (baja a los 0,8 s, encaja a los ${t.encaja.toFixed(2)} s, el brillo más fuerte a los ${t.brilla.toFixed(2)} s, el nombre a 2,7, la línea a 3 y [Seguir] a 3,4)`)
  const p = PA.partituraDe('maravilla_nueva')
  debe(p && PA.IDS_DE_PARTITURA.includes('maravilla_nueva') && typeof PA.EN_PALABRAS.maravilla_nueva === 'string' && PA.EN_PALABRAS.maravilla_nueva.length > 20, 'partitura', 'la partitura «maravilla_nueva» existe, está en la lista y tiene su texto en palabras')
  const golpe = (a) => p.notas.find((n) => n.tipo === 'archivo' && n.archivo === a)
  debe(cerca(golpe('clic').golpe, t.encaja) && cerca(golpe('brillo').golpe, t.brilla) && golpe('vuelo').golpe < t.encaja && golpe('vuelo').golpe > t.llega, 'partitura', `el clic cae al encajar (${golpe('clic').golpe.toFixed(2)} s = encaja), el brillo cuando el emblema llega a su brillo más fuerte, y el vuuush de la bajada justo antes de encajar`)
  debe(!p.notas.some((n) => n.tipo === 'archivo' && (n.archivo === 'maravilla' || n.archivo === 'redoble')) && PA.partituraDe('maravilla').notas.some((n) => n.tipo === 'archivo' && n.archivo === 'maravilla'), 'partitura', 'distinta del final de las 7: ni el redoble ni el golpe grande «maravilla»')
  debe(p.notas.every((n) => n.tipo !== 'archivo' || PA.ARCHIVOS_DE_PREMIO.includes(n.archivo)), 'partitura', 'solo usa archivos de premio que ya existen (sin inventar archivos)')
  debe(p.notas.every((n) => (n.tipo === 'archivo' ? n.golpe : n.en) <= p.dura + 1e-9) && cerca(p.dura, t.cta), 'partitura', `ningún sonido pasa del final de la animación (${p.dura.toFixed(2)} s)`)
  const r = PA.partituraDe('maravilla_nueva', { reducido: true })
  debe(cerca(r.notas.find((n) => n.archivo === 'clic').golpe, t.encaja * 0.5) && cerca(r.dura, t.cta * 0.5), 'partitura', 'con «Reducir movimiento» las animaciones se acortan a la mitad y el sonido las sigue (como el resto de partituras)')
  // La tarjeta del estudio.
  const A = E.animacionDe('maravilla_nueva')
  const A4 = E.animacionDe('maravilla_nueva_cuatro')
  debe(A && A4 && A.grupo === 'Logros' && A4.grupo === 'Logros' && A.momentos === 'maravilla_nueva' && A4.momentos === 'maravilla_nueva_cuatro' && /1 de 7/.test(A.nombre) && /4 de 7/.test(A4.nombre), 'estudio', `dos tarjetas en «Logros»: «${A?.nombre}» y «${A4?.nombre}»`)
  debe(A.suena.join() === 'maravilla_nueva' && A.partituras.join() === 'maravilla_nueva' && A.principal.id === 'clic', 'estudio', 'suena su partitura y el sonido principal es el clic de encajar')
  const L = E.lineaDeTiempo(A)
  debe(cerca(L.dura, t.cta) && cerca(L.seguir, t.cta) && L.tramos[0].partitura === 'maravilla_nueva' && L.tramos[0].empieza === 0, 'estudio', `la línea de tiempo dura hasta [Seguir] (${L.dura.toFixed(1)} s) y arranca su partitura al empezar`)
  const marca = (r) => L.marcas.find((x) => x.rotulo === r)?.t
  debe(cerca(marca('encaja la moneda'), t.encaja) && cerca(marca('se enciende'), t.brilla) && cerca(marca('baja la moneda'), t.llega) && L.marcas.some((x) => x.rotulo === '[Seguir]' && cerca(x.t, t.cta)), 'estudio', 'con las marcas «baja la moneda», «encaja la moneda», «se enciende» y [Seguir]')
  debe(cerca(E.golpeDe(A), t.encaja) && cerca(E.duracionDe(A4), t.cta), 'estudio', 'la raya del golpe cae al encajar la moneda')
  const arch = E.archivosDeLaAnimacion(A)
  debe(arch[0] === 'clic' && arch.includes('vuelo') && arch.includes('brillo'), 'estudio', `Eric puede poner sonido a: ${arch.join(', ')}`)
  // Los momentos de ejemplo se ven como la pantalla de la app.
  const pl1 = P.planificar(P.ordenarComoElServidor(E.MOMENTOS_DEL_ESTUDIO.maravilla_nueva()))
  const pl4 = P.planificar(P.ordenarComoElServidor(E.MOMENTOS_DEL_ESTUDIO.maravilla_nueva_cuatro()))
  debe(pl1.map((x) => x.tipo).join() === 'maravilla_nueva' && pl4.map((x) => x.tipo).join() === 'maravilla_nueva', 'estudio', 'las dos tarjetas montan la pantalla «Una maravilla nueva»')
  debe(E.ANIMACIONES.length === 32 && E.ANIMACIONES.some((x) => x.id === 'maravilla'), 'estudio', `32 tarjetas en total, y «Final de las 7 maravillas» sigue (${E.ANIMACIONES.length})`)
}

console.log('   Pantallas quietas, sin sonido; sin cambios en el final de las 7')
{
  const ms = sinComentarios(leer('src/components/logros/dibujos/MedallaSiete.tsx'))
  debe(!/\b(sonar|vibrar|reproducirMomentos|iniciarPartitura)\(/.test(ms), 'quieta', 'la medalla (también la animada) no hace sonar nada por sí sola: el sonido lo pide el Reproductor con la pantalla')
  debe(/className=\{animada \? undefined : 'ms-quieta'\}/.test(ms) && /sinMovimiento/.test(ms), 'quieta', 'sin `gana` (Logros, vitrina, Perfil) sigue QUIETA; con «Reducir movimiento», la moneda ya llegó, sin movimiento')
  const pant = sinComentarios(leer('src/components/logros/momentos/pantallas.tsx'))
  const dentro = /function PantallaUnaMaravillaNueva[\s\S]*?\n}\n/.exec(pant)?.[0] ?? ''
  debe(dentro.length > 200 && !/\bsonar\(|vibrar\(/.test(dentro) && /<MedallaDeSiete encendidas=\{encendidas\} gana=\{id\}/.test(dentro) && /UNA MARAVILLA NUEVA/.test(dentro) && /de 7/.test(dentro), 'pantalla', 'la pantalla nueva monta MedallaDeSiete con la moneda ganada, el rótulo y «n de 7»; no llama a sonar (sonar solo lo hace el Reproductor)')
  debe(/function PantallaFinal7/.test(pant) && /<FinalSieteMaravillas tam=\{300\} \/>/.test(pant) && /ctaEn="9s"/.test(pant), 'final7', 'el final de las 7 no se ha tocado (PantallaFinal7, su animación y su [Seguir] a los 9 s)')
  const fin = sinComentarios(leer('src/components/logros/momentos/FinalSieteMaravillas.tsx'))
  debe(fin.includes('m7Gather') && fin.includes('m7SpinIn') && fin.includes('m7Sweep'), 'final7', 'FinalSieteMaravillas sigue entera')
  const adem = /function PantallaAdemas[\s\S]*?\n}\n/.exec(pant)?.[0] ?? ''
  debe(!/PantallaAdemas/.test(pant) && adem === '', 'ademas', '(V71) la pantalla «Y además…» ya no existe: cada logro, la suya')
}

/* ───────── 2. La pantalla ───────── */
if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('2. (SIN VITE: la parte de la pantalla NO SE HA VERIFICADO)')
  console.log(`\nPrueba de la Tanda V39B (maravilla nueva): ${comprobaciones} comprobaciones · ${fallos.length} fallos · PANTALLA SIN VERIFICAR`)
  process.exit(fallos.length ? 1 : 0)
}
console.log('2. En la app (390 x 844): «Una maravilla nueva»')
const b = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=completa', ancho: 390, alto: 844 })
const CAP = 'docs/dias/V39B_capturas'
fs.mkdirSync(CAP, { recursive: true })
const vista = () =>
  J(
    b,
    `JSON.stringify((() => { const d = document.querySelector('[role=dialog][aria-label="Una maravilla nueva"]'); if (!d) return { abierta: false, otro: (document.querySelector('[role=dialog]')?.getAttribute('aria-label') ?? '') }; const med = d.querySelector('[data-maravilla-nueva]'); const monedas = [...d.querySelectorAll('[data-moneda]')].map((x) => ({ k: x.getAttribute('data-moneda'), e: x.getAttribute('data-encendida'), nueva: x.hasAttribute('data-nueva') })); return { abierta: true, texto: d.innerText.replace(/\\s+/g, ' '), estado: med?.getAttribute('data-maravilla-nueva'), cuenta: d.querySelector('[data-ms-cuenta]')?.textContent, monedas, oro: monedas.filter((x) => x.e === 'oro').length, plata: monedas.filter((x) => x.e === 'plata').length, etiqueta: d.querySelector('[data-etiqueta-moneda]')?.textContent ?? null, nombre: d.querySelector('[data-maravilla-nombre]')?.innerText ?? '', linea: d.querySelector('[data-maravilla-linea]')?.innerText ?? '', cta: [...d.querySelectorAll('button')].some((x) => x.textContent.trim() === 'Seguir'), ademas: /Y además/.test(d.innerText), rojo: getComputedStyle(d.querySelector('[data-moneda=\"coliseo\"]')).animationName }; })())`,
  )
try {
  await esperar(b, 'Boolean(window.__momentos)', 240)
  // M1: la primera, el Coliseo, 1 de 7.
  await b.evaluar("window.__retrasoMaravilla = 99; window.__momentos.lanzar('medalla'); true")
  await esperar(b, "Boolean(document.querySelector('[role=dialog][aria-label=\"Una maravilla nueva\"]'))", 40)
  await b.esp(1200)
  let v = await vista()
  debe(v.abierta && /UNA MARAVILLA NUEVA/.test(v.texto), 'm1', 'sale la pantalla «Una maravilla nueva» (con su rótulo)')
  debe(v.estado === 'espera' && v.cuenta === '0' && v.oro === 0 && v.plata === 7, 'm1', `al principio la moneda nueva aún no ha llegado: 0 encendidas, 7 apagadas, el centro dice 0 (${v.oro} oro, ${v.plata} plata, «${v.cuenta}»)`)
  debe(!v.ademas, 'm1', 'y no es «Y además…»')
  await b.captura(`${CAP}/maravilla_1_principio.jpg`)
  await b.evaluar("window.__retrasoMaravilla = undefined; window.__momentos.cerrar(); true")
  await b.esp(500)
  await b.evaluar("window.__momentos.lanzar('medalla'); true")
  await esperar(b, "Boolean(document.querySelector('[role=dialog][aria-label=\"Una maravilla nueva\"]'))", 40)
  await b.esp(1100)
  v = await vista()
  debe(v.estado === 'llego' && v.cuenta === '1' && v.oro === 1 && v.plata === 6, 'm1', `a los ~1 s la moneda llega: el centro cuenta 1 y hay 1 encendida (${v.oro} oro, ${v.plata} plata, «${v.cuenta}»)`)
  debe(v.monedas.find((x) => x.k === 'coliseo')?.e === 'oro' && v.monedas.find((x) => x.k === 'coliseo')?.nueva === true && /Join|m7Join/.test(v.rojo), 'm1', `y es el Coliseo, con su animación de llegada (${v.rojo})`)
  await b.esp(2700)
  v = await vista()
  debe(v.etiqueta === 'Coliseo', 'm1', `con la etiqueta de su nombre sobre la moneda (${v.etiqueta})`)
  debe(/El Coliseo · 1 de 7/.test(v.texto) && v.linea === datos.maravillas.coliseo.linea, 'm1', `debajo, «El Coliseo · 1 de 7» y su línea de los datos («${v.nombre.replace(/\s+/g, ' ')}» · «${v.linea}»)`)
  debe(v.cta, 'm1', 'y [Seguir]')
  await b.captura(`${CAP}/maravilla_1_final.jpg`)
  // El resto de monedas (apagadas) siguen en plata.
  debe(v.monedas.filter((x) => x.k !== 'coliseo').every((x) => x.e === 'plata'), 'm1', 'las otras seis, en plata')
  await b.evaluar("window.__momentos.cerrar(); true")
  await b.esp(500)

  // M2: la cuarta, el Cristo Redentor, 4 de 7.
  await b.evaluar("window.__retrasoMaravilla = 99; window.__momentos.lanzar('maravilla4'); true")
  await esperar(b, "Boolean(document.querySelector('[role=dialog][aria-label=\"Una maravilla nueva\"]'))", 40)
  await b.esp(1200)
  v = await vista()
  debe(v.estado === 'espera' && v.cuenta === '3' && v.oro === 3 && v.plata === 4 && v.monedas.find((x) => x.k === 'cristo')?.e === 'plata', 'm2', `4 de 7, al principio: tres monedas ya en oro, el centro dice 3 y la del Cristo aún apagada (${v.oro} oro, «${v.cuenta}»)`)
  await b.evaluar("window.__retrasoMaravilla = undefined; window.__momentos.cerrar(); true")
  await b.esp(500)
  await b.evaluar("window.__momentos.lanzar('maravilla4'); true")
  await esperar(b, "Boolean(document.querySelector('[role=dialog][aria-label=\"Una maravilla nueva\"]'))", 40)
  await b.esp(3900)
  v = await vista()
  debe(v.estado === 'llego' && v.cuenta === '4' && v.oro === 4 && v.plata === 3 && v.monedas.find((x) => x.k === 'cristo')?.e === 'oro' && v.monedas.find((x) => x.k === 'cristo')?.nueva, 'm2', `al final: 4 en oro, el centro dice 4, la nueva es el Cristo (${v.oro} oro, «${v.cuenta}»)`)
  debe(v.etiqueta === 'Cristo Redentor' && /El Cristo Redentor · 4 de 7/.test(v.texto) && v.linea === datos.maravillas.cristo_redentor.linea && /30 metros/.test(v.linea), 'm2', `«El Cristo Redentor · 4 de 7», su etiqueta y su línea corregida («${v.linea}»)`)
  await b.captura(`${CAP}/maravilla_4_final.jpg`)
  // Tocar la pantalla (o [Seguir]) la cierra: es la única.
  await toque(b, '[role=dialog][aria-label="Una maravilla nueva"] button')
  await b.esp(900)
  v = await vista()
  debe(!v.abierta, 'cierra', '[Seguir] cierra la pantalla (era la única de la ronda)')

  // La 2.ª maravilla (Petra) seguida del Patrimonio: primero «Una maravilla nueva» y ya no «Y además…» con ella.
  await b.evaluar("window.__momentos.serieSegundaMaravilla(); true")
  await esperar(b, "Boolean(document.querySelector('[role=dialog]'))", 60)
  await b.esp(800)
  const abre = await J(b, "JSON.stringify({ a: document.querySelector('[role=dialog]')?.getAttribute('aria-label'), t: document.querySelector('[role=dialog]')?.innerText.replace(/\\s+/g, ' ') })")
  debe(abre.a === 'Una maravilla nueva' && !/Y además/.test(abre.t), 'serie', `la serie «segunda maravilla» abre con «Una maravilla nueva», no con «Y además…» (${abre.a})`)
  await b.evaluar("window.__momentos.cerrar(); true")
  await b.esp(500)

  // La 7.ª: su final de siempre.
  await b.evaluar("window.__momentos.lanzar('final7'); true")
  await esperar(b, "Boolean(document.querySelector('[role=dialog]'))", 40)
  await b.esp(800)
  const f7 = await J(b, "JSON.stringify({ a: document.querySelector('[role=dialog]')?.getAttribute('aria-label'), una: Boolean(document.querySelector('[role=dialog][aria-label=\"Una maravilla nueva\"]')), fin: Boolean(document.querySelector('[data-final7]')) })")
  debe(f7.a === 'El final de las 7 maravillas' && !f7.una && f7.fin, 'final7', `la 7.ª sigue siendo «El final de las 7 maravillas» (${f7.a})`)
  await b.evaluar("window.__momentos.cerrar(); true")
  await b.esp(500)

  // Con «Reducir movimiento»: ya puesta, sin movimiento.
  await b.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await b.evaluar("window.__momentos.lanzar('maravilla4'); true")
  await esperar(b, "Boolean(document.querySelector('[role=dialog][aria-label=\"Una maravilla nueva\"]'))", 40)
  await b.esp(500)
  v = await vista()
  debe(v.estado === 'llego' && v.cuenta === '4' && v.oro === 4, 'reducido', `con «Reducir movimiento» sale ya puesta (4 de 7) sin esperar los 0,8 s (${v.estado}, ${v.cuenta})`)
  const mov = await J(b, "JSON.stringify([...document.querySelectorAll('[role=dialog][aria-label=\"Una maravilla nueva\"] .mo-con-mov')].map((x) => getComputedStyle(x).display))")
  debe(mov.length > 3 && mov.every((d) => d === 'none'), 'reducido', `y los destellos, chispas y ondas (${mov.length}) no se ven`)
  await b.captura(`${CAP}/maravilla_reducido.jpg`)
  await b.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })
  await b.evaluar("window.__momentos.cerrar(); true")
} finally {
  b.cerrar()
}

/* ───────── 3. El estudio: la tarjeta suena cuando encaja la moneda ───────── */
console.log('3. En el estudio (1280 x 1000): la tarjeta suena al encajar')
const MOCK = "const f = window.fetch.bind(window); window.fetch = (u, i) => String(u).includes('/api/admin/avisos-viajeros') ? Promise.resolve(new Response(JSON.stringify({ ok: true, nuevos: 0, avisos: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })) : f(u, i);"
const IFR = "document.querySelector('[data-visor-iframe]')"
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&admin=sonidos&apertura=0', ancho: 1280, alto: 1000, sinEsperarRoot: true, esperaFija: 5, antes: MOCK })
try {
  debe(await esperar(a, "document.querySelectorAll('[data-animacion-tarjeta]').length >= 20"), 'pagina', 'la página sale con su lista')
  debe(await esperar(a, `Boolean(${IFR}?.contentWindow?.__estudioVisor?.listo)`, 160), 'marco', 'el marco carga y queda listo')
  const ids = await J(a, "JSON.stringify([...document.querySelectorAll('[data-animacion-tarjeta]')].map((x) => x.getAttribute('data-animacion-tarjeta')))")
  debe(ids.length === 32 && ids.includes('maravilla_nueva') && ids.includes('maravilla_nueva_cuatro') && ids.includes('maravilla'), 'tarjetas', `la página lista las 32 tarjetas, con las dos de «Maravilla nueva» (${ids.length})`)
  for (const id of ['maravilla_nueva', 'maravilla_nueva_cuatro']) {
    await toque(a, `[data-animacion-tarjeta="${id}"]`)
    await esperar(a, `${IFR}.contentDocument.querySelector('[data-visor-de-animacion]')?.getAttribute('data-animacion-actual') === '${id}'`, 60)
    await a.evaluar(`${IFR}.contentWindow.__estudioVisor.parar(); true`)
    await a.esp(400)
    await a.evaluar(`${IFR}.contentWindow.__sonidosAgendados = []; true`)
    await toque(a, '[data-ver-con-sonido]')
    // Se mira el centro de la medalla varias veces nada más pulsar ▶: primero cuenta una menos (la moneda aún no ha llegado) y después, cuando llega, una más.
    const n = id === 'maravilla_nueva' ? 1 : 4
    const muestras = []
    for (let i = 0; i < 24; i++) {
      muestras.push(await a.evaluar(`${IFR}.contentDocument.querySelector('[data-ms-cuenta]')?.textContent ?? null`).catch(() => null))
      await a.esp(100)
    }
    debe(muestras.includes(String(n - 1)) && muestras.lastIndexOf(String(n)) > muestras.indexOf(String(n - 1)), 'estudio', `${id}: nada más pulsar ▶ el centro cuenta ${n - 1} (la moneda aún no ha llegado) y después ${n} (${muestras.join(',')})`)
    await a.esp(1500)
    const luego = await J(a, `JSON.stringify({ cuenta: ${IFR}.contentDocument.querySelector('[data-ms-cuenta]')?.textContent, txt: ${IFR}.contentDocument.body.innerText.replace(/\\s+/g, ' '), ag: (${IFR}.contentWindow.__sonidosAgendados ?? []).map((x) => ({ p: x.partitura, id: x.id, en: x.en })) })`)
    const mia = luego.ag.filter((x) => x.p === 'maravilla_nueva')
    const clic = mia.find((x) => x.id === 'clic')
    debe(luego.cuenta === String(n) && /UNA MARAVILLA NUEVA/.test(luego.txt) && new RegExp(`${n} de 7`).test(luego.txt), 'estudio', `${id}: el marco enseña «${n} de 7» y el centro cuenta ${luego.cuenta}`)
    debe(clic && Math.abs(clic.en - T.TIEMPOS_DE_MARAVILLA_NUEVA.encaja) < 1e-6, 'estudio', `${id}: suena el clic en el instante en que encaja la moneda (${clic?.en?.toFixed(2)} s = ${T.TIEMPOS_DE_MARAVILLA_NUEVA.encaja.toFixed(2)} s)`)
    debe(mia.some((x) => x.id === 'vuelo') && mia.some((x) => x.id === 'brillo') && !mia.some((x) => x.id === 'redoble' || x.id === 'maravilla'), 'estudio', `${id}: suenan el vuuush, el clic y el brillo (${mia.map((x) => x.id).join(', ')}), sin redoble ni golpe grande`)
    // Pantalla quieta: acabada la animación, no suena nada más.
    const antes = luego.ag.length
    await a.esp(2000)
    const despues = await J(a, `JSON.stringify((${IFR}.contentWindow.__sonidosAgendados ?? []).length)`)
    debe(despues === antes, 'quieta', `${id}: acabada la animación, la pantalla queda quieta y en silencio (${antes} → ${despues} sonidos programados)`)
    if (id === 'maravilla_nueva') await a.captura(`${CAP}/estudio_maravilla_nueva.jpg`)
    await a.evaluar(`${IFR}.contentWindow.__estudioVisor.parar(); true`)
  }
} finally {
  a.cerrar()
}

console.log(`\nPrueba de la Tanda V39B (maravilla nueva): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
