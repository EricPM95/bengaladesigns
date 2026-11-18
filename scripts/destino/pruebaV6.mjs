// La prueba de la Tanda V6: ver lo que has ganado, con sus animaciones agrupadas.
//   APP_URL=http://localhost:5199 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV6.mjs
//
// 1. El reparto en pantallas (plan.ts, la función real): 5 fotos que dan pedazos en 3 colecciones sin completar, 1 colección completa y 1 emblema → una pantalla con las 3 insignias, la colección completa,
//    el emblema, el sello; un Visto con 2 pedazos de 2 colecciones → 1 pantalla.
// 2. En pantalla (demo): la fila en su orden (insignias juntas → colección completa → emblema → sello → EXP y nivel en UNA pantalla → hoja de logros), [Saltar todo] y la EXP sin subir de nivel.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { build } from 'esbuild'
import { abrirApp } from './_enLaApp.mjs'

const require = createRequire(import.meta.url)
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

/* ───────── 1. El reparto en pantallas ───────── */
console.log('1. El reparto en pantallas')
const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-v6-'))
await build({ entryPoints: ['src/components/logros/momentos/plan.ts'], outfile: path.join(carpeta, 'plan.cjs'), bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent', loader: { '.json': 'json' } })
const P = require(path.join(carpeta, 'plan.cjs'))
const suma = (coleccion, n, total, sitios) => ({ tipo: 'suma', cat: 'pedazo', coleccion, destino: 'roma', nombre: `Col ${coleccion}`, n, total, sitios, linea: `${n} de ${total}`, primera_vez: true })
const colCompleta = (id) => ({ tipo: 'coleccion', cat: 'coleccion', clave: `roma|coleccion|${id}`, id, destino: 'roma', nombre: `Col ${id}`, linea: 'Completa', primera_vez: true })
const emblema = (id) => ({ tipo: 'emblema', cat: 'emblema', clave: `roma|emblema|${id}`, id, destino: 'roma', nombre: `Emblema ${id}`, linea: 'x', primera_vez: true })
const sello = { tipo: 'sello', cat: 'sello', clave: 'roma|sello|roma:bronce', sello: 'roma', destino: 'roma', grado: 'bronce', nombre: 'Primeros pasos', linea: 'x', primera_vez: true }
const exp = { tipo: 'viajero', cat: 'viajero', clave: 'roma|viajero:paso', nombre: 'Un logro de viajero', primera_vez: true }
{
  // 5 fotos: pedazos en 3 colecciones (A, B, C) sin completar, la colección D se completa (con su último pedazo) y un emblema; más el sello y un logro de viajero.
  const llegan = [suma('A', 2, 7, ['s1']), suma('B', 1, 4, ['s1']), suma('D', 3, 3, ['s2']), colCompleta('D'), suma('C', 4, 6, ['s3']), emblema('panteon'), sello, exp]
  const pan = P.planificar(P.ordenarComoElServidor(llegan))
  debe(pan.map((p) => p.tipo).join() === 'pedazos,coleccion,emblema,sello,viajero', 'orden', `el orden: insignias juntas → colección completa → emblema → sello → lo del viajero (${pan.map((p) => p.tipo)})`)
  debe(pan[0].momentos.length === 3 && new Set(pan[0].momentos.map((m) => m.coleccion)).size === 3 && !pan[0].momentos.some((m) => m.coleccion === 'D'), 'pedazos', 'UNA sola pantalla con las 3 colecciones que avanzan (A, B y C), sin la que se completa')
  debe(pan[1].momentos[0].id === 'D' && pan[1].momentos.some((m) => m.tipo === 'suma'), 'coleccion', 'la colección D tiene su pantalla (con su último pedazo dentro, para marcarlo como visto)')
  const claves = P.clavesDe(pan[1])
  debe(claves.some((c) => c.logro === 'pedazo' && c.escalon === 'D:s2'), 'coleccion', 'el pedazo que completó D se marca como visto con la pantalla de la colección')
  // Dos colecciones completas y dos emblemas: cada uno, su pantalla, en su orden.
  const dos = P.planificar([colCompleta('X'), emblema('trevi'), colCompleta('Y'), emblema('foro'), suma('A', 1, 3, ['q'])])
  debe(dos.map((p) => p.tipo).join() === 'pedazos,coleccion,coleccion,emblema,emblema', 'orden', `varias completas y varios emblemas: una pantalla cada uno (${dos.map((p) => p.tipo)})`)
  // Un Visto con 2 pedazos de 2 colecciones distintas: 1 pantalla, no 2.
  const visto = P.planificar([suma('A', 1, 8, ['coliseo']), suma('B', 1, 4, ['coliseo'])])
  debe(visto.length === 1 && visto[0].tipo === 'pedazos' && visto[0].momentos.length === 2, 'visto', 'un Visto que da 2 pedazos de 2 colecciones distintas sale en UNA pantalla (no en 2)')
  // Sin pedazos nuevos no hay pantalla de pedazos; el avance del sello sin pantalla.
  const solo = P.planificar([emblema('panteon'), { tipo: 'suma_sello', cat: 'pedazo', nombre: 'x' }])
  debe(solo.length === 1 && solo[0].tipo === 'emblema', 'orden', 'sin pedazos nuevos, no hay pantalla de pedazos (y el avance del sello no tiene pantalla)')
}

/* ───────── El código ───────── */
console.log('2. El código')
{
  const exp = leer('src/components/logros/momentos/ExpHost.tsx')
  const mh = leer('src/components/logros/momentos/MomentosHost.tsx')
  const rep = leer('src/components/logros/momentos/Reproductor.tsx')
  const rec = leer('src/lib/reclamar.ts')
  const sal = leer('src/components/logros/reclamar/Reclamar.tsx')
  debe(/Ver lo que has ganado/.test(sal) && !/Ver todo en Logros/.test(sal) && !/TOPE_DE_ANIMACIONES/.test(rec), 'resumen', 'el botón dorado del resumen es [Ver lo que has ganado] y ya no hay tope de «más de 6 → Ver todo en Logros»')
  debe(/pedirHojaAlFinal\(\)/.test(rec), 'resumen', 'al acabar de reclamar, lo ganado va a la fila y al final se abre la hoja de logros')
  debe(!/data-exp-linea/.test(rep), 'exp', 'la EXP ya no va como línea dentro de la primera pantalla')
  debe(/final: true/.test(mh) && /e\.final \? 'final'/.test(exp) && /<ExpYNivel/.test(exp), 'exp', 'la EXP de una ronda va al final, en una sola pantalla con la subida de nivel')
  debe(/saltarTodoYAbrirLogros\(\)/.test(rep) && /saltarTodoYAbrirLogros\(\)/.test(exp), 'saltar', '[Saltar todo] (en las sorpresas y en la EXP) cierra la fila y lleva a la hoja de logros')
  const ex = leer('src/components/logros/pantallas/perfil/ExpYNivel.tsx')
  debe(/¡Subes a nivel \{despues\.nivel\} · \{despues\.rango\}!/.test(ex) && /Te faltan \{miles\(faltan\)\} EXP para el nivel \{despues\.nivel \+ 1\}/.test(ex), 'exp', 'la pantalla dice «¡Subes a nivel N · Rango!» o «Te faltan N EXP para el nivel N+1»')
  debe(/if \(e && e\.ganada > 0\)/.test(mh) && /e\.sinCartel \? pasoTrasLaExp\(e\) : 'exp'/.test(exp), 'exp', 'una EXP suelta (un Visto sin nada más) sigue con su cartel pequeño')
  debe(/despues\.rango_ix > info\.antes\.rango_ix \? 'rango'/.test(exp), 'exp', 'si además cambia el rango, el marco nuevo sale después en su pantalla')
}

/* ───────── 3. En pantalla ───────── */
const BASE = process.env.APP_URL
if (BASE) {
  console.log('3. En pantalla')
  const CAPTURAS = 'docs/dias/V6_capturas'
  fs.mkdirSync(CAPTURAS, { recursive: true })
  const nueva = async () => {
    const app = await abrirApp(BASE, { ruta: '/?cuentas=on&logros=on&logrosDemo=1&apertura=0&version=completa&hoy2=on', ancho: 390, alto: 844 })
    for (let i = 0; i < 360 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await app.esp(500)
    await app.evaluar('Promise.resolve(window.__rutaPrueba()).then(() => true)')
    await app.esp(3000)
    for (let i = 0; i < 6; i++) { const c = await app.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Ahora no)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()"); if (!c) break; await app.esp(700) }
    return app
  }
  const exp = (ganada, antes, despues) => ({ ganada, antes: { exp: 700, nivel: 2, rango: 'Explorador', rango_ix: 1, estrellas: 2, leyenda_estrellas: 0, exp_en_nivel: antes, exp_para_siguiente: 500, falta: 500 - antes }, despues: { exp: 820, nivel: despues.nivel, rango: 'Explorador', rango_ix: 1, estrellas: despues.nivel, leyenda_estrellas: 0, exp_en_nivel: despues.dentro, exp_para_siguiente: 500, falta: 500 - despues.dentro }, sube_de_nivel: despues.nivel > 2 })
  const meter = (app, nuevos, e) => app.evaluar(`(async () => { const L = await import('/src/store/useLogrosStore.ts'); L.useLogrosStore.getState().recibir(${JSON.stringify({ ok: true, nuevos, exp: e })}); return true })()`)
  const seguir = (app) => app.evaluar("(() => { const b = document.querySelector('[data-momento-seguir], [data-mo-seguir]') || Array.from(document.querySelectorAll('button')).find((x) => /^(Seguir|Continuar|Toca para seguir)$/.test((x.textContent || '').trim())); if (b) { b.click(); return true } const f = document.querySelector('[data-pantalla-momento]'); if (f) { f.click(); return true } return false })()")
  // Avanza una pantalla de los momentos: un botón [Seguir]/[Continuar]/[Descubrir…] si lo hay, y si no, un toque en la pantalla.
  const avanzar = async (app) => {
    const hecho = await app.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Seguir|Continuar|Descubrir|Toca para seguir)/.test((x.textContent || '').trim())); if (b) { b.click(); return true } return false })()")
    if (!hecho) {
      await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: 195, y: 520, button: 'left', clickCount: 1 })
      await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 195, y: 520, button: 'left', clickCount: 1 })
    }
  }
  const hastaPantalla = async (app, re, seg = 60) => {
    for (let i = 0; i < seg; i++) {
      const t = await app.evaluar("(document.querySelector('[role=dialog]')?.innerText || document.body.innerText || '').slice(0, 600)")
      if (re.test(t)) return t
      if (i % 2 === 1) await avanzar(app)
      await app.esp(1000)
    }
    return ''
  }
  const textoPantalla = (app) => app.evaluar("(document.querySelector('[role=dialog]')?.innerText || document.body.innerText || '').slice(0, 400)")
  const esperarTexto = async (app, re, seg = 25) => {
    for (let i = 0; i < seg * 4; i++) {
      const t = await textoPantalla(app)
      if (re.test(t)) return t
      await app.esp(250)
    }
    return await textoPantalla(app)
  }
  const nuevos = [suma('imprescindibles', 2, 8, ['coliseo']), suma('cuatro_joyas', 1, 4, ['coliseo']), suma('miradores', 1, 3, ['janiculo']), suma('alma_trastevere', 4, 4, ['trastevere']), colCompleta('alma_trastevere'), emblema('panteon'), sello]
  const app = await nueva()
  try {
    await meter(app, nuevos, exp(120, 380, { nivel: 3, dentro: 20 }))
    // 1) UNA pantalla con las 3 insignias que avanzan.
    const p1 = await esperarTexto(app, /pedazos nuevos/i)
    debe(/pedazos nuevos/i.test(p1), 'fila', `primero, UNA pantalla «Pedazos nuevos» (${p1.slice(0, 50).replace(/\n/g, ' ')})`)
    await app.esp(3000)
    const completo = await app.evaluar("(document.querySelector('[role=dialog]')?.innerText || document.body.innerText || '')")
    const filas = (completo.match(/\d+ DE \d+/g) ?? []).length
    debe(filas === 3, 'fila', `con las 3 insignias a la vez, cada una con su «N de M» (${filas})`)
    debe(await app.evaluar("Boolean(Array.from(document.querySelectorAll('button')).find((b) => /Saltar todo/i.test(b.textContent || '')))"), 'saltar', 'arriba lleva [Saltar todo]')
    await app.esp(2500)
    await app.captura(`${CAPTURAS}/1_pedazos_varias.jpg`)
    await avanzar(app)
    // 2) La colección completa, sola.
    const p2 = await esperarTexto(app, /colecci[oó]n completa/i, 15)
    debe(/colecci[oó]n completa/i.test(p2), 'fila', `luego, la colección completa sola (${p2.slice(0, 50).replace(/\n/g, ' ')})`)
    await app.esp(3500)
    await app.captura(`${CAPTURAS}/2_coleccion_completa.jpg`)
    await avanzar(app)
    // 3) El emblema oculto.
    const p3 = await esperarTexto(app, /emblema|oculto|panteón|panteon/i, 20)
    debe(/emblema|oculto|panteón|panteon/i.test(p3), 'fila', `luego, el emblema (${p3.slice(0, 50).replace(/\n/g, ' ')})`)
    await app.esp(5000)
    await app.captura(`${CAPTURAS}/3_emblema.jpg`)
    // 4) El sello (las escenas del emblema piden más de un toque: se avanza hasta que sale).
    const p4 = await hastaPantalla(app, /primeros pasos|tu sello/i, 70)
    debe(/sello|primeros pasos/i.test(p4), 'fila', `luego, el sello (${p4.slice(0, 50).replace(/\n/g, ' ')})`)
    await app.esp(3000)
    await app.captura(`${CAPTURAS}/4_sello.jpg`)
    for (let i = 0; i < 30 && !(await app.evaluar("Boolean(document.querySelector('[data-exp-y-nivel]'))")); i++) { await avanzar(app); await app.esp(1500) }
    // 5) La EXP y la subida de nivel, juntas en UNA pantalla.
    await app.hasta("Boolean(document.querySelector('[data-exp-y-nivel]'))", { segundos: 30 }).catch(() => undefined)
    const ex = await app.evaluar("document.querySelector('[data-exp-y-nivel]')?.innerText ?? ''")
    debe(/\+120 EXP/.test(ex), 'exp', `la EXP al final: «+120 EXP» (${ex.slice(0, 40).replace(/\n/g, ' ')})`)
    await app.esp(4000)
    const ex2 = await app.evaluar("document.querySelector('[data-exp-y-nivel]')?.innerText ?? ''")
    debe(/Subes a nivel 3/.test(ex2), 'exp', `y en la MISMA pantalla «¡Subes a nivel 3 · Explorador!» (${ex2.slice(0, 80).replace(/\n/g, ' ')})`)
    debe(!(await app.evaluar("Boolean(document.querySelector('[data-exp-ganada]'))")), 'exp', 'sin el cartel «+EXP» aparte')
    await app.captura(`${CAPTURAS}/5_exp_y_nivel.jpg`)
    await app.evaluar("document.querySelector('[data-exp-seguir]')?.click(); true")
    // 6) Al final, la hoja de logros (solo si se pidió: aquí la ronda no la pide).
    await app.esp(3500)
    debe(!(await app.evaluar("Boolean(document.querySelector('[data-exp-y-nivel]'))")), 'exp', 'tras [Seguir], la pantalla de EXP se cierra')
  } finally {
    await app.cerrar()
  }
  // Sin subir de nivel: «Te faltan N EXP para el nivel 3».
  const b = await nueva()
  try {
    await meter(b, [suma('miradores', 1, 3, ['janiculo'])], exp(40, 100, { nivel: 2, dentro: 140 }))
    await esperarTexto(b, /pedazo/i)
    await b.esp(2500)
    await avanzar(b)
    await b.hasta("Boolean(document.querySelector('[data-exp-y-nivel]'))", { segundos: 30 }).catch(() => undefined)
    await b.esp(3000)
    const t = await b.evaluar("document.querySelector('[data-exp-y-nivel]')?.innerText ?? ''")
    debe(/Te faltan 360 EXP para el nivel 3/.test(t), 'exp', `sin llegar al nivel: «Te faltan 360 EXP para el nivel 3» (${t.slice(0, 90).replace(/\n/g, ' ')})`)
  } finally {
    await b.cerrar()
  }
  // [Saltar todo] en la primera: directo a la hoja de logros.
  const c = await nueva()
  try {
    await meter(c, nuevos, exp(120, 380, { nivel: 3, dentro: 20 }))
    await esperarTexto(c, /pedazos nuevos/i)
    await c.esp(1500)
    await c.evaluar("(() => { const x = Array.from(document.querySelectorAll('button')).find((y) => /Saltar todo/i.test(y.textContent || '')); if (x) x.click(); return true })()")
    await c.hasta("Boolean(document.querySelector('[data-hoja-logros]'))", { segundos: 25 }).catch(() => undefined)
    debe(await c.evaluar("Boolean(document.querySelector('[data-hoja-logros]'))"), 'saltar', '[Saltar todo] en la primera: directo a la hoja «Tus logros»')
    debe(!(await c.evaluar("Boolean(document.querySelector('[data-exp-y-nivel]'))")), 'saltar', 'y sin pasar por la EXP')
    await c.esp(800)
    await c.captura(`${CAPTURAS}/6_hoja_logros_al_final.jpg`)
  } finally {
    await c.cerrar()
  }
} else console.log('3. En pantalla: se salta (sin APP_URL)')
try { fs.rmSync(carpeta, { recursive: true, force: true }) } catch { /* nada */ }

console.log(`\nLa prueba V6: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
if (fallos.length) {
  for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
  process.exit(1)
}
