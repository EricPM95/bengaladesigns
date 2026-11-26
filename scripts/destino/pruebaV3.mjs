// PRUEBA DE LA TANDA V3 (15-nov): las 11 escenas de los emblemas de Lanzarote y los momentos de uno en uno (para todos los destinos).
//   APP_URL=http://localhost:5199 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV3.mjs
// NO crea cuentas ni viajes en el Supabase de producción: usa el modo de pruebas de los logros (`?logrosDemo=1`, solo en desarrollo) con el Vite de pruebas (Supabase de mentira).
// Capturas de móvil (para el REPASO) en docs/dias/V3_capturas/.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'
import { build } from 'esbuild'
import { abrirApp } from './_enLaApp.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const IDS = ['timanfaya', 'jameos', 'cueva_de_los_verdes', 'mirador_del_rio', 'fundacion_manrique', 'el_golfo', 'la_geria', 'la_graciosa', 'papagayo', 'lz_madrugador', 'atardecer_atlantico']
const lanza = JSON.parse(leer('data/logros/lanzarote.json'))
const CAPTURAS = 'docs/dias/V3_capturas'

/* ───────────────────────── 1. Las 11 escenas (el código) ───────────────────────── */
console.log('1. Las 11 escenas de Lanzarote')
{
  debe(JSON.stringify(lanza.emblemas.map((e) => e.id)) === JSON.stringify(IDS), 'ids', 'los 11 emblemas de lanzarote.json son exactamente los de la lista (y en su orden)')
  const index = leer('src/components/logros/momentos/escenas/index.ts')
  const host = leer('src/components/logros/momentos/EscenaDeEmblema.tsx')
  const listaHost = host.match(/const ESCENAS_LANZAROTE = \[([^\]]*)\]/)?.[1].match(/'([^']+)'/g)?.map((x) => x.slice(1, -1)) ?? []
  debe(JSON.stringify(listaHost) === JSON.stringify(IDS), 'ids', 'EscenaDeEmblema conoce los mismos 11 ids (para saltarse la frase de suspense del servidor)')
  // El diseño: las escenas y sus textos, tal cual.
  const pieza = leer('docs/diseno/proyecto/Piezas/Emblema Cine Lanza.dc.html')
  const ini = pieza.indexOf('const A=(at,cls)')
  const fin = pieza.indexOf('class Component extends DCLogic')
  const SC = new Function(pieza.slice(ini, fin) + '\nreturn SC;')()
  const TXT = new Function(`return ${pieza.slice(pieza.indexOf('const TXT=') + 'const TXT='.length, pieza.indexOf('}[K];'))}}`)()
  IDS.forEach((id, i) => {
    const k = String(i + 1)
    const archivo = `src/components/logros/momentos/escenas/lanza/${id}.ts`
    debe(fs.existsSync(archivo), 'escenas', `${id}: tiene su archivo de escena`)
    debe(index.includes(`${id}: () => import('./lanza/${id}')`), 'escenas', `${id}: su escena se carga solo al abrirla (import dinámico en escenas/index.ts)`)
    if (!fs.existsSync(archivo)) return
    const t = leer(archivo)
    const campo = (n) => JSON.parse(t.match(new RegExp(`\\n  ${n}: (".*"),\\n`))?.[1] ?? 'null')
    const em = lanza.emblemas.find((e) => e.id === id)
    debe(campo('svg') === SC[k].s && campo('bg') === SC[k].bg && campo('halo') === SC[k].halo, 'diseno', `${id}: el dibujo, el fondo y el halo son los de Design, tal cual`)
    debe(campo('frase') === SC[k].ph && campo('c1') === SC[k].c1 && campo('c2') === SC[k].c2, 'diseno', `${id}: la frase de suspense y las dos frases del sitio son las de Design`)
    debe(campo('nombre') === em.nombre && campo('nombre') === TXT[k][0] && campo('linea') === em.linea && campo('linea') === TXT[k][1], 'textos', `${id}: nombre y línea = los de lanzarote.json = los de Design («${em.nombre}»)`)
    debe(campo('id') === id, 'ids', `${id}: la escena lleva su id`)
  })
  debe(fs.existsSync('docs/diseno/proyecto/Emblemas Lanza Cine.dc.html') && fs.existsSync('docs/diseno/proyecto/Piezas/Emblema Cine Lanza.dc.html'), 'diseno', 'las dos páginas nuevas de Design están en docs/diseno/proyecto/')
  debe(execGit('status --porcelain -- docs/diseno/proyecto/uploads docs/diseno/proyecto/Archivo') === '', 'diseno', 'sin uploads/ ni Archivo/ nuevos (solo se han puesto al día las páginas nuevas)')
  debe(!/lz_madrugador/.test(leer('src/components/logros/momentos/escenas/madrugador.tsx')) && /lz_madrugador: \(\) => import\('\.\/lanza\/lz_madrugador'\)/.test(index) && /madrugador: \(\) => import\('\.\/madrugador'\)/.test(index), 'ids', '«lz_madrugador» (Lanzarote) y «madrugador» (Roma) tienen cada uno su escena')
  const cine = leer('src/components/logros/momentos/escenas/cineLanza.tsx')
  debe(!/\bfrases\b|ConfigEscena/.test(cine.replace(/\/\*[\s\S]*?\*\//g, '')) && /lzRecede 1\.6s 10s/.test(cine) && /lzEmerge/.test(cine) && /lzUp/.test(cine), 'diseno', 'cineLanza.tsx lleva la línea de tiempo de Design (se aleja a los 10 s, el emblema emerge a los 11, nombre y línea a 12,6 y 13,4)')
  const css = leer('src/components/logros/momentos/escenas/lanza/lanza.css')
  debe((css.match(/@keyframes lz/g) ?? []).length === 20, 'diseno', 'las 20 animaciones de Design (@keyframes lz…) están en lanza.css')
}
function execGit(args) {
  return execSync(`git ${args}`, { encoding: 'utf8' }).trim()
}

/* ───────────────────────── 2. La fila de momentos (la lógica) ───────────────────────── */
console.log('2. La fila de momentos, de uno en uno')
const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'pruebaV3-'))
{
  const abs = (f) => path.resolve(f).split(path.sep).join('/')
  fs.writeFileSync(path.join(carpeta, 'entrada.ts'), `export * from '${abs('src/components/logros/momentos/fila.ts')}'\nexport { planificar, ordenarComoElServidor } from '${abs('src/components/logros/momentos/plan.ts')}'\n`)
  await build({ entryPoints: [path.join(carpeta, 'entrada.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: path.join(carpeta, 'app.cjs'), logLevel: 'silent', loader: { '.json': 'json' } })
  const { filaVacia, pedir, soltar, repartir, ORDEN_DE_LA_FILA, planificar, ordenarComoElServidor } = createRequire(import.meta.url)(path.join(carpeta, 'app.cjs'))
  // Una pantalla sola: sale en el acto.
  let f = pedir(filaVacia(), 'ronda', false)
  debe(f.mostrando === 'ronda' && f.esperan.length === 0, 'fila', 'una sola pantalla pedida con la pantalla libre sale en el acto')
  // Mientras hay una, las demás esperan y NUNCA se muestran dos.
  f = pedir(f, 'exp', false)
  f = pedir(f, 'resumenViaje', false)
  debe(f.mostrando === 'ronda' && f.esperan.join() === 'exp,resumenViaje', 'fila', 'con una pantalla abierta, las demás esperan (no salen a la vez)')
  f = pedir(f, 'exp', false)
  debe(f.esperan.filter((k) => k === 'exp').length === 1, 'fila', 'pedir dos veces lo mismo no lo duplica')
  // Al cerrar, sale el siguiente (el primero de la fila, no el que llegó antes).
  f = soltar(f, 'ronda', false)
  debe(f.mostrando === 'exp' && f.esperan.join() === 'resumenViaje', 'fila', 'al cerrar la ronda sale la siguiente de la fila: la EXP, no el resumen del viaje que llegó antes')
  f = soltar(f, 'exp', false)
  f = soltar(f, 'resumenViaje', false)
  debe(f.mostrando === null && f.esperan.length === 0, 'fila', 'al cerrar la última, la fila queda vacía')
  // El orden de la fila.
  let g = pedir(filaVacia(), 'hojaLogros', true)
  for (const k of ['resumenViaje', 'primerDia', 'exp', 'resumenDia', 'ronda']) g = pedir(g, k, true)
  const vistas = []
  while (true) {
    g = repartir(g, false)
    if (!g.mostrando) break
    vistas.push(g.mostrando)
    g = soltar(g, g.mostrando, false)
  }
  debe(vistas.join() === ORDEN_DE_LA_FILA.join() && vistas.join() === 'ronda,resumenDia,exp,primerDia,resumenViaje,hojaLogros', 'fila', `el orden de la fila: ${vistas.join(' → ')}`)
  // Bloqueado (hoja del Visto o «Compartir» abiertos por la persona): nada sale hasta que se cierren.
  let h = pedir(filaVacia(), 'ronda', true)
  debe(h.mostrando === null && h.esperan.join() === 'ronda', 'fila', 'con la hoja del Visto o un «Compartir» abiertos, no sale nada: espera')
  h = repartir(h, false)
  debe(h.mostrando === 'ronda', 'fila', 'al cerrarse, sale lo que esperaba')
  // Soltar lo que está esperando (ya no hace falta) no toca lo que se está enseñando.
  let i = pedir(pedir(filaVacia(), 'ronda', false), 'exp', false)
  i = soltar(i, 'exp', false)
  debe(i.mostrando === 'ronda' && i.esperan.length === 0, 'fila', 'quitar lo que esperaba no cierra lo que se está viendo')

  // El reparto en pantallas: los pedazos de la MISMA colección juntos; la subida de nivel va aparte (no es un momento del servidor).
  const suma = (coleccion, sitio) => ({ tipo: 'suma', cat: 'pedazo', coleccion, destino: 'roma', nombre: coleccion, n: 1, total: 8, sitios: [sitio] })
  const p1 = planificar(ordenarComoElServidor([suma('imprescindibles', 'coliseo'), suma('imprescindibles', 'panteon')]))
  debe(p1.length === 1 && p1[0].tipo === 'pedazos' && p1[0].momentos.length === 2, 'pedazos', '2 pedazos de la MISMA colección salen juntos, en una sola pantalla')
  const p2 = planificar(ordenarComoElServidor([suma('imprescindibles', 'coliseo'), suma('cuatro_joyas', 'coliseo'), suma('imprescindibles', 'panteon')]))
  debe(p2.length === 1 && p2[0].tipo === 'pedazos' && p2[0].momentos.length === 3, 'pedazos', '(V6) pedazos de colecciones distintas: TODOS en una sola pantalla')
  const emb = { tipo: 'emblema', cat: 'emblema', id: 'timanfaya', clave: 'lanzarote|emblema|timanfaya' }
  const col = { tipo: 'coleccion', cat: 'coleccion', id: 'cuatro_joyas', clave: 'roma|coleccion|cuatro_joyas' }
  const sello = { tipo: 'sello', cat: 'sello', clave: 'roma|sello|roma:plata', grado: 'plata', sello: 'roma' }
  const viajero = { tipo: 'viajero', cat: 'viajero', clave: '*|viajero:paises|3', logro: 'paises', escalon: '3', destino: '*' }
  const orden = planificar(ordenarComoElServidor([viajero, sello, col, emb, suma('imprescindibles', 'coliseo')])).map((p) => p.tipo).join()
  debe(orden === 'pedazos,coleccion,emblema,sello,viajero', 'orden', `(V6) el orden: colecciones que avanzan → colección completa → emblema → sello → lo del viajero: ${orden}`)
  const aj = JSON.parse(leer('data/logros/ajustes.json'))
  debe(aj.orden_momentos.join() === 'pedazo,emblema,coleccion,sello,pais,destino_nuevo,continente,maravilla,patrimonio,viajero', 'orden', 'el servidor da ese mismo orden (ajustes.json › orden_momentos)')
  // Todos con su X o [Seguir]: la subida de nivel y el cambio de rango llevan su ✕.
  for (const f2 of ['SubeDeNivel', 'CambioDeRango']) debe(/aria-label="Cerrar"/.test(leer(`src/components/logros/pantallas/perfil/${f2}.tsx`)), 'cerrar', `${f2}: lleva su ✕`)
  // El anfitrión y la EXP piden turno en la fila (nada sale por su cuenta).
  const hostCodigo = leer('src/components/logros/momentos/MomentosHost.tsx') + leer('src/components/logros/momentos/ExpHost.tsx')
  debe(/pedir\('ronda'\)/.test(hostCodigo) && /pedir\('exp'\)/.test(hostCodigo) && /useTurno\('resumenDia'/.test(hostCodigo) && /useTurno\('primerDia'/.test(hostCodigo) && /useTurno\('hojaLogros'/.test(hostCodigo) && /useTurno\('resumenViaje'/.test(hostCodigo), 'fila', 'las sorpresas, el resumen del día y del viaje, la hoja de logros, «Hoy empiezas…» y la EXP piden su turno en la fila')
}

/* ───────────────────────── 2b. Cuándo sale el resumen del día (la lógica) ───────────────────────── */
console.log('2b. El resumen del día, una vez al final del día')
{
  const abs = (f) => path.resolve(f).split(path.sep).join('/')
  const c2 = fs.mkdtempSync(path.join(os.tmpdir(), 'pruebaV3b-'))
  fs.writeFileSync(path.join(c2, 'entrada.ts'), `export * from '${abs('src/components/logros/momentos/resumenDelDia.ts')}'\n`)
  await build({ entryPoints: [path.join(c2, 'entrada.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: path.join(c2, 'r.cjs'), logLevel: 'silent', define: { 'import.meta.env': '{}' } })
  const R = createRequire(import.meta.url)(path.join(c2, 'r.cjs'))
  const parada = (n, extra = {}) => ({ id: 's' + n, name: 'P' + n, kind: 'attraction', ...extra })
  const ruta = (paradas1, paradas2 = [parada(9)]) => ({ answers: { dateRange: { start: '2026-12-01', end: '2026-12-02' } }, days: [{ dayNumber: 1, stops: paradas1 }, { dayNumber: 2, stops: paradas2 }] })
  const nunca = () => false
  const una = ruta([parada(1, { checkedInAt: 'x' }), parada(2)])
  debe(R.diaCompleto(ruta([parada(1, { checkedInAt: 'x' }), parada(2, { saltada: true })]), '2026-12-01'), 'resumen', 'el día está completo si la última parada se SALTA (no solo si se marca)')
  debe(!R.diaCompleto(una, '2026-12-01'), 'resumen', 'con una parada sin marcar, el día no está completo')
  debe(R.diaPendienteDeResumen(una, '2026-12-01', 21, nunca) === '2026-12-01', 'resumen', 'el día acaba sin marcar la última: esa noche (desde las 21 h) la primera vez que se abre la app, sale el resumen')
  debe(R.diaPendienteDeResumen(una, '2026-12-01', 15, nunca) === null, 'resumen', 'a media tarde, con el día aún en marcha, no sale')
  debe(R.diaPendienteDeResumen(una, '2026-12-02', 9, nunca) === '2026-12-01', 'resumen', 'o al día siguiente, la primera vez que se abre la app')
  debe(R.diaPendienteDeResumen(una, '2026-12-03', 9, nunca) === null, 'resumen', 'dos días después ya no sale (era de esa noche o del día siguiente)')
  debe(R.diaPendienteDeResumen(una, '2026-12-02', 9, (iso) => iso === '2026-12-01') === null, 'resumen', 'si ya salió ese día, no vuelve a salir (una sola vez)')
  debe(R.diaPendienteDeResumen(ruta([parada(1), parada(2)]), '2026-12-02', 9, nunca) === null, 'resumen', 'un día sin ninguna parada hecha o saltada (no se usó) no saca resumen')
  const host = leer('src/components/logros/momentos/MomentosHost.tsx')
  debe(/diaPendienteDeResumen\(/.test(host) && /diaCompleto\(/.test(host) && /abrirResumenDia/.test(host), 'resumen', 'el anfitrión lo mira al abrir la app y al cambiar la ruta (marcar o saltar)')
  const rep = leer('src/components/logros/momentos/Reproductor.tsx').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  debe(!/ResumenDia/.test(rep), 'resumen', 'las rondas de sorpresas ya no acaban con el resumen del día')
  fs.rmSync(c2, { recursive: true, force: true })
}

/* ───────────────────────── 3. En el móvil (Chrome de pruebas, modo demo de los logros) ───────────────────────── */
console.log('3. En el móvil: las escenas y la fila')
const SONDEO = `
(() => {
  window.__v3 = { muestras: [], max: 0, firmas: [] }
  const pantallas = () => {
    const w = innerWidth, h = innerHeight
    const sal = []
    for (const e of document.querySelectorAll('body *')) {
      const c = getComputedStyle(e)
      if (c.position !== 'fixed' || Number(c.zIndex) < 8000) continue
      const r = e.getBoundingClientRect()
      const exp = e.hasAttribute('data-exp-ganada')
      if (!exp && !(r.width >= w * 0.85 && r.height >= h * 0.85)) continue
      if (sal.some((x) => x.contains(e))) continue
      sal.push(e)
    }
    return sal
  }
  setInterval(() => {
    const p = pantallas()
    window.__v3.max = Math.max(window.__v3.max, p.length)
    const firma = p.map((e) => e.hasAttribute('data-exp-ganada') ? 'exp' : e.hasAttribute('data-sube-de-nivel') ? 'nivel' : e.hasAttribute('data-cambio-de-rango') ? 'rango' : e.hasAttribute('data-suspense') ? 'suspense' : e.getAttribute('data-escena-lanza') ? 'escena:' + e.getAttribute('data-escena-lanza') : e.getAttribute('aria-label') || (e.innerText || '').slice(0, 24).replace(/\\s+/g, ' ')).join(' + ')
    const t = (e) => e.innerText || ''
    const botones = p.map((e) => Array.from(e.querySelectorAll('button')).map((b) => (b.getAttribute('aria-label') || t(b)).trim()).join('|')).join(' + ')
    const ult = window.__v3.firmas.at(-1)
    if (!ult || ult.firma !== firma) window.__v3.firmas.push({ firma, n: p.length, botones: new Set(botones.split('|')), t: Date.now() })
    else for (const b of botones.split('|')) ult.botones.add(b)
    if (p.length > 1) window.__v3.muestras.push(firma)
  }, 100)
})()`

async function abrirConViaje() {
  const app = await abrirApp(process.env.APP_URL || 'http://localhost:5199', { ruta: '/?cuentas=on&logros=on&logrosDemo=1' })
  for (let i = 0; i < 120 && !(await app.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await app.esp(500)
  for (let i = 0; i < 60 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await app.esp(500)
  await app.evaluar('window.__rutaPrueba().then(() => true)')
  await app.esp(6000)
  for (let i = 0; i < 4; i++) {
    const cerrado = await app.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!cerrado) break
    await app.esp(600)
  }
  for (let i = 0; i < 40 && !(await app.evaluar("typeof window.__momentos === 'object'")); i++) await app.esp(500)
  return app
}
const hayEscena = (id) => `Boolean(document.querySelector('[data-escena-lanza="${id}"]'))`
const cerrarTodo = async (app) => {
  await app.evaluar('window.__momentos.cerrar()')
  await app.esp(500)
}

{
  const app = await abrirConViaje()
  try {
    debe(await app.evaluar("typeof window.__momentos === 'object' && typeof window.__momentos.serieFila === 'function'"), 'demo', 'el modo de pruebas de los logros está disponible')
    // Cada escena se baja SOLO al abrirla: al abrir la app no se ha pedido ninguna.
    debe(!app.peticiones.some((u) => /escenas\/lanza\//.test(u)), 'carga', 'al abrir la app no se ha pedido ninguna escena de Lanzarote (ni su pieza)')
    await app.evaluar(SONDEO)
    fs.mkdirSync(CAPTURAS, { recursive: true })

    // 3a. Las 11 escenas, la primera vez (con la frase de suspense de Design) y tocándolas después (directo al sitio).
    for (const [k, id] of IDS.entries()) {
      const em = lanza.emblemas.find((e) => e.id === id)
      await app.evaluar(`window.__momentos.lanzar('emblema:${id}')`)
      const abierta = await app.hasta(hayEscena(id), { segundos: 40 })
      debe(abierta, 'escenas', `${id}: al descubrirlo sale su escena (no el fondo liso de reserva)`)
      if (k === 0) debe(app.peticiones.filter((u) => /escenas\/lanza\/[a-z_]+\.ts/.test(u)).every((u) => /timanfaya/.test(u)), 'carga', 'al abrir la de Timanfaya solo se baja la de Timanfaya (las otras 10, no)')
      if (!abierta) {
        await cerrarTodo(app)
        continue
      }
      // La frase de suspense, la primera vez.
      await app.esp(1200)
      const frase = await app.evaluar(`document.querySelector('[data-frase-suspense]')?.innerText ?? ''`)
      const piezaFrase = leer(`src/components/logros/momentos/escenas/lanza/${id}.ts`).match(/\n  frase: (".*"),\n/)?.[1]
      debe(frase === JSON.parse(piezaFrase), 'escenas', `${id}: la primera vez sale su frase de suspense («${frase}»)`)
      // No sale a la vez la del servidor («¡Eh! Aquí hay algo…»).
      debe(!(await app.evaluar("document.body.innerText.includes('Aquí hay algo')")), 'escenas', `${id}: sin doble suspense (no sale además la frase al azar del servidor)`)
      const fondoLiso = await app.evaluar(`getComputedStyle(document.querySelector('[data-escena-lanza="${id}"]')).backgroundImage`)
      debe(!/2E3550|141826/i.test(fondoLiso) && !/46,\\s*53,\\s*80|20,\\s*24,\\s*38/.test(fondoLiso), 'escenas', `${id}: su fondo es el de Design, no el liso de reserva`)
      if (['timanfaya', 'jameos', 'la_graciosa'].includes(id)) {
        // A mitad (cuando ya se dibuja el sitio, ≈ 6,5 s) y al final.
        await app.esp(7600)
        await app.captura(`${CAPTURAS}/${String(k + 1).padStart(2, '0')}_${id}_a_mitad.jpg`)
      }
      // Un toque salta a la revelación: el emblema con su nombre y su línea, y [Seguir].
      await app.evaluar(`document.querySelector('[data-escena-lanza="${id}"]').click()`)
      await app.esp(1200)
      const t = await app.evaluar(`document.querySelector('[data-escena-lanza="${id}"]').innerText`)
      debe(t.includes(em.nombre) && t.includes(em.linea) && /Seguir/.test(t), 'escenas', `${id}: al final sale su nombre «${em.nombre}», su línea y [Seguir]`)
      const dibujo = await app.evaluar(`Boolean(document.querySelector('[data-escena-lanza="${id}"] [data-emblema-lanza]'))`)
      debe(dibujo, 'escenas', `${id}: el emblema (el dibujo de Lanzarote) se ve en la revelación`)
      if (['timanfaya', 'jameos', 'la_graciosa'].includes(id)) await app.captura(`${CAPTURAS}/${String(k + 1).padStart(2, '0')}_${id}_final.jpg`)
      await cerrarTodo(app)
    }

    // 3b. Tocarlo después en la vitrina o en Logros (`repetir`): directo a la escena, sin la frase de suspense, y cada escena cargada solo al abrirla.
    for (const id of ['timanfaya', 'lz_madrugador']) {
      await app.evaluar(`window.__momentos.repetir('${id}')`)
      const abierta = await app.hasta(hayEscena(id), { segundos: 30 })
      debe(abierta, 'repetir', `${id}: al tocarlo ya guardado sale su escena`)
      await app.esp(600)
      debe(!(await app.evaluar("Boolean(document.querySelector('[data-frase-suspense]'))")), 'repetir', `${id}: sin frase de suspense al repetirla (directo al sitio)`)
      const adelantada = await app.evaluar(`(() => { const r = document.querySelector('[data-escena-lanza="${id}"]'); const a = r.getAnimations({ subtree: true }); return a.length > 5 && a.filter((x) => Number(x.currentTime) >= 2900).length > a.length / 2 })()`)
      debe(adelantada, 'repetir', `${id}: la película empieza ya en el sitio (se adelantan los 3 s de suspense)`)
      await cerrarTodo(app)
    }
    // Cada escena se baja sola al abrirla: el módulo de una escena que no se ha abierto no está pedido.
    debe(app.peticiones.some((u) => /escenas\/lanza\/timanfaya/.test(u)) && app.peticiones.some((u) => /escenas\/lanza\/lz_madrugador/.test(u)), 'carga', 'las escenas abiertas se han pedido al abrirlas')

    // 3c. La fila: 2 pedazos de la misma colección y una subida de nivel → 2 pantallas: los pedazos (con su «+EXP» como línea) y, al cerrar, la subida de nivel. Nada se pisa.
    await cerrarTodo(app)
    await app.evaluar('window.__v3.firmas.length = 0; window.__v3.max = 0; window.__v3.muestras.length = 0')
    await app.evaluar('window.__momentos.serieFila()')
    const visto = async (tipo, segundos) => app.hasta(tipo, { segundos })
    const seguir = "(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^Seguir$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()"
    const pedazos = await visto("/pedazo/i.test(document.body.innerText) && Array.from(document.querySelectorAll('button')).some((b) => /^Seguir$/.test((b.textContent || '').trim()))", 40)
    debe(pedazos, 'fila', 'salen los pedazos, con su [Seguir]')
    const textoPedazos = await app.evaluar('document.body.innerText')
    debe(/un pedazo nuevo/i.test(textoPedazos) && !/pedazos nuevos/i.test(textoPedazos), 'fila', 'los 2 pedazos de la misma colección van juntos, en una sola pantalla (una colección)')
    debe(!(await app.evaluar("Boolean(document.querySelector('[data-exp-linea]'))")), 'exp', '(V6) la EXP YA NO va como línea dentro de la pantalla de los pedazos: va al final, en una pantalla con el nivel')
    await app.esp(3000)
    await app.esp(500)
    await app.captura(`${CAPTURAS}/fila_1_pedazos_con_exp.jpg`)
    await app.evaluar(seguir)
    // Sin resumen del día ni cartel «+EXP» aparte: directo a la subida de nivel.
    const nivel = await visto("Boolean(document.querySelector('[data-exp-y-nivel]'))", 25)
    debe(nivel, 'fila', '(V6) al cerrar los pedazos sale la EXP con la subida de nivel en UNA pantalla (2 pantallas en total)')
    await app.esp(2500)
    debe(!(await app.evaluar("Boolean(document.querySelector('[data-exp-ganada]')) || /Resumen del día/.test(document.body.innerText)")), 'fila', 'ni cartel «+EXP» aparte ni resumen del día tras la ronda')
    // Mientras está la subida de nivel llega un momento nuevo (como la respuesta tardía de una foto): espera, no se pisa.
    await app.evaluar("window.__momentos.lanzar('emblema:panteon')")
    await app.esp(2500)
    debe(!(await app.evaluar("Boolean(document.querySelector('[role=dialog][aria-label^=\"Emblema:\"]'))")), 'fila', 'el emblema que llegó mientras tanto ESPERA: no sale encima de la subida de nivel')
    await app.captura(`${CAPTURAS}/fila_2_nivel.jpg`)
    await app.hasta("Boolean(document.querySelector('[data-exp-seguir]')) && getComputedStyle(document.querySelector('[data-exp-seguir]')).opacity === '1'", { segundos: 12 })
    const x = await app.evaluar("(() => { const b = document.querySelector('[data-exp-seguir]'); if (!b) return false; b.click(); return true })()")
    debe(x, 'cerrar', 'la pantalla de EXP y nivel se cierra con [Seguir]')
    const emblema = await visto("Boolean(document.querySelector('[role=dialog][aria-label^=\"Emblema:\"]'))", 40)
    debe(emblema, 'fila', 'al cerrar la subida de nivel sale el siguiente que esperaba (el emblema)')
    await app.evaluar("document.querySelector('[role=dialog][aria-label^=\"Emblema:\"]')?.click()")
    await app.esp(2500)
    const res = await app.evaluar("({ max: window.__v3.max, muestras: window.__v3.muestras.length, firmas: window.__v3.firmas.map((f) => f.firma + (f.n > 1 ? ' (' + f.n + ' a la vez)' : '')) })")
    console.log('   (lo que se vio, en orden: ' + res.firmas.filter((f) => f).join('  →  ') + ')')
    debe(res.max <= 1 && res.muestras === 0, 'pisarse', `en ningún momento hay dos pantallas a la vez (máximo ${res.max}; muestras con 2 o más: ${res.muestras})`)
    const firmas = (await app.evaluar('window.__v3.firmas.map((f) => ({ firma: f.firma, botones: [...f.botones] }))')).filter((f) => f.firma)
    const i = (re) => firmas.findIndex((f) => re.test(f.firma))
    debe(i(/pedazo/i) === 0 && i(/EXP/) === 1 && !firmas.some((f) => /Resumen/.test(f.firma)), 'fila', `(V6) lo que se vio: ${firmas.slice(0, 2).map((f) => f.firma).join(' → ')} (los pedazos y, al final, la EXP con el nivel; nada más antes del emblema que esperaba)`)
    debe(firmas.filter((f) => /EXP/.test(f.firma)).length === 1, 'fila', '(V6) la EXP con la subida de nivel sale una sola vez')
    const sinSalida = firmas.filter((f) => f.firma !== 'suspense' && ![...f.botones].some((b) => /Seguir|Cerrar/.test(b)))
    debe(sinSalida.length === 0, 'cerrar', `todas las pantallas se cierran con su ✕ o su [Seguir] (sin salida: ${sinSalida.map((f) => f.firma).join(', ') || 'ninguna'})`)
    await cerrarTodo(app)

    // 3d. Una foto sola (un pedazo y nada más): UNA pantalla, y el resumen del día NO sale tras ella.
    await app.evaluar("window.__momentos.lanzar('suma')")
    debe(await visto("/pedazo/i.test(document.body.innerText) && Array.from(document.querySelectorAll('button')).some((b) => /^Seguir$/.test((b.textContent || '').trim()))", 40), 'fila', 'una foto: sale su pantalla de pedazo')
    await app.evaluar(seguir)
    await app.esp(3000)
    debe(!(await app.evaluar("document.body.innerText.includes('Resumen del día') || Boolean(document.querySelector('[data-exp-ganada]'))")), 'resumen', 'tras una sola foto no sale el resumen del día (ni otra pantalla)')
    await cerrarTodo(app)

    // 3e. El resumen del día, UNA vez al final del día: al SALTAR la última parada (y no antes).
    await app.evaluar("import('/src/store/useRouteStore.ts').then((m) => { const st = m.useRouteStore.getState(); const ini = st.route.answers.dateRange.start; Object.keys(localStorage).filter((k) => k.startsWith('trazo:logros:resumendia:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:primerdia', 'si'); m.useRouteStore.setState({ dev_simulated_today_iso: ini }); return import('/src/store/useSyncStore.ts').then((y) => { y.useSyncStore.setState({ activeTripId: 'prueba-v3' }); return true }) })")
    const marcar = (hasta) => `import('/src/store/useRouteStore.ts').then(async (m) => { const { resolveRealStops } = await import('/src/lib/todayMode.ts'); const { isNumberedStop } = await import('/src/lib/stopKind.ts'); const st = m.useRouteStore.getState(); const ruta = structuredClone(st.route); const dia = ruta.days[0]; const paradas = resolveRealStops(dia).filter(isNumberedStop); const ids = new Set(paradas.slice(0, ${hasta === 'todas' ? 'paradas.length' : 'paradas.length - 1'}).map((p) => p.id)); dia.stops = resolveRealStops(dia).map((p) => (ids.has(p.id) ? { ...p, saltada: true } : p)); m.useRouteStore.setState({ route: ruta }); return paradas.length })`
    const nParadas = await app.evaluar(marcar('menos1'))
    debe(nParadas >= 2, 'resumen', `el día de prueba tiene ${nParadas} paradas numeradas`)
    await app.esp(2500)
    debe(!(await app.evaluar("document.body.innerText.includes('Resumen del día')")), 'resumen', 'con paradas sin marcar, el resumen del día NO sale')
    await app.evaluar(marcar('todas'))
    debe(await visto("document.body.innerText.includes('Resumen del día') || document.body.innerText.includes('Aún no has ganado nada hoy')", 20), 'resumen', 'al SALTAR la última parada sale el resumen del día')
    if (!(await app.evaluar("document.body.innerText.includes('Aún no has ganado nada hoy') || document.body.innerText.includes('Resumen del día')"))) console.log('   (DEBUG)', await app.evaluar("import('/src/components/logros/momentos/useMomentosUI.ts').then((u) => JSON.stringify({ f: u.useMomentosUI.getState().fila, r: u.useMomentosUI.getState().resumenDia, c: u.useMomentosUI.getState().compartir !== null }) + ' ' + Object.keys(localStorage).filter((k) => k.includes('resumendia')).join())"))
    await app.captura(`${CAPTURAS}/resumen_del_dia_al_saltar.jpg`)
    await app.evaluar(seguir)
    await app.esp(1500)
    await app.evaluar(marcar('todas'))
    await app.esp(2500)
    debe(!(await app.evaluar("document.body.innerText.includes('Resumen del día')")), 'resumen', 'el resumen del día sale una sola vez ese día')
    await cerrarTodo(app)
  } finally {
    app.cerrar()
  }
}

fs.rmSync(carpeta, { recursive: true, force: true })
console.log(`\nLa prueba V3: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
