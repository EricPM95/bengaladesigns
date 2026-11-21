// La prueba de la Tanda V37 (parte 2): EL SELLO DEL PASAPORTE, CON SONIDO EN LA APP. Cuando el sello cae y toca la hoja (a los 2,05 s: `TIEMPOS_ESTAMPADO.golpe`), suena la partitura `sello_pasaporte`
// (la misma que la tarjeta «Sello del pasaporte» del estudio de sonidos): UNA vez al estampar; nada al ver un sello ya estampado ([Ver mi sello]); nada en el estudio (`ejemplo` / `__estudioVisor`).
//   mkdir .chrome.lock   (un solo Chrome de prueba a la vez)   →   APP_URL=http://localhost:5173 node scripts/destino/pruebaV37_sello.mjs   →   rmdir .chrome.lock
// Ninguna parte toca el Supabase de producción: la app usa el servidor de mentira de la demo (?logrosDemo=1).
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
const APP = process.env.APP_URL ?? 'http://localhost:5173'

/* ── 1. El código ── */
console.log('1. El código')
{
  const pas = leer('src/components/logros/pantallas/PasaporteScreen.tsx')
  debe(/sonar\('sello_pasaporte'\)/.test(pas) && /prepararSonido\('sello_pasaporte'\)/.test(pas), 'codigo', 'PasaporteScreen pide `sonar(\'sello_pasaporte\')` y la precarga con `prepararSonido`')
  const efecto = pas.slice(pas.indexOf('const sonoPara'), pas.indexOf('return (', pas.indexOf('const sonoPara')))
  debe(/ejemplo/.test(efecto) && /__estudioVisor/.test(efecto), 'codigo', 'no suena en `ejemplo` ni dentro del visor del estudio (`__estudioVisor`)')
  debe(/hayGolpe/.test(efecto) && /estampando/.test(pas.slice(pas.indexOf('const hayGolpe'), pas.indexOf('const hayGolpe') + 80)), 'codigo', 'solo suena si hay golpe (con «reducir movimiento» no hay golpe: no hay sonido)')
  const est = leer('src/lib/sonidos/estudio.ts')
  debe(/id: 'sello', nombre: 'Sello del pasaporte'[^\n]*suena: \['sello_pasaporte'\]/.test(est), 'codigo', 'la tarjeta del estudio usa `sello_pasaporte`')
  debe(!/todavía se estampa SIN sonido/.test(est), 'codigo', 'el estudio ya no dice que la app lo estampa sin sonido')
  const par = leer('src/lib/sonidos/partituras.ts')
  debe(/'fuegos', 'sello_pasaporte'/.test(par.match(/IDS_DE_PARTITURA[^\n]*/)[0]), 'codigo', '`sello_pasaporte` está en la lista de partituras (la prueba de partituras la recorre)')
  debe(/sello_pasaporte: '/.test(par), 'codigo', '`sello_pasaporte` tiene su frase en EN_PALABRAS')
  const ids = [...leer('src/components/logros/pantallas/PasaporteScreen.tsx').matchAll(/sonar\('([a-z_]+)'\)/g)].map((m) => m[1])
  debe(ids.length === 1 && ids[0] === 'sello_pasaporte', 'codigo', `PasaporteScreen hace sonar una sola cosa (${ids.join(', ')})`)
}

/* ── 2. En pantalla ── */
console.log('2. En pantalla (móvil de 390 px, demo de logros)')
const app = await abrirApp(APP, { ancho: 390, alto: 844, ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=completa&apertura=0' })
const ev = (js) => app.evaluar(js)
const esperar = async (js, intentos = 40, ms = 400) => {
  for (let i = 0; i < intentos; i++) {
    if (await ev(js).catch(() => false)) return true
    await app.esp(ms)
  }
  return false
}
try {
  for (let i = 0; i < 120 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await app.esp(500)
  await ev("window.__imp = (p) => { const e = performance.getEntriesByType('resource').map((r) => r.name).find((n) => n.includes(p)); return import(e ?? p) }; true")
  await ev('window.__rutaPrueba().then(() => true)')
  await esperar("__imp('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))", 90, 1000)
  await app.esp(2500)
  for (let i = 0; i < 6; i++) {
    const hecho = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar|Empezar mi día)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await app.esp(700)
  }
  const abrir = (pagina) => ev(`__imp('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().cerrarTodo(); setTimeout(() => m.useLogrosPantallas.getState().abrir({ t: 'pasaporte', pagina: ${JSON.stringify(pagina)} }), 80); return true })`)
  const cerrar = () => ev("__imp('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().cerrarTodo(); return true })")
  const limpiar = () => ev("window.__sonidosPedidos = []; window.__sonidosAgendados = []; true")
  const pedidos = async () => (await ev("(window.__sonidosPedidos ?? []).filter((x) => x === 'sello_pasaporte').length")) ?? 0
  const todosLosPedidos = () => ev("JSON.stringify(window.__sonidosPedidos ?? [])")
  await ev("localStorage.removeItem('trazo:sonido'); localStorage.removeItem('jutrip.sellos_estampados'); true")

  /* 2a. Estampar: suena UNA vez, hacia el momento del golpe. */
  await limpiar()
  await abrir('sello:demo-roma-2026')
  const hayGolpe = await esperar("Boolean(document.querySelector('[data-golpe-del-sello]'))", 40, 250)
  const t0 = Date.now()
  debe(hayGolpe, 'estampar', 'al pedir `sello:<viaje>` el sello cae (hay golpe en la hoja)')
  let alMontar = await pedidos()
  debe(alMontar === 1, 'estampar', `al montar el golpe suena \`sello_pasaporte\` (${alMontar} petición)`)
  const reloj = await ev("(() => { const e = document.querySelector('[data-golpe-del-sello] > span:last-child'); return e ? getComputedStyle(e).animationName + ' ' + getComputedStyle(e).animationDuration : '' })()")
  debe(/muSlam/.test(String(reloj)), 'estampar', `y es el golpe \`muSlam\` (${reloj})`)
  await app.esp(Math.max(0, 4200 - (Date.now() - t0)))
  const despues = await pedidos()
  debe(despues === 1, 'estampar', `y solo UNA vez en todo el estampado (${despues}; todo lo pedido: ${await todosLosPedidos()})`)
  const marcado = await ev("Object.keys(JSON.parse(localStorage.getItem('jutrip.sellos_estampados') ?? '{}')).length")
  debe(marcado === 1, 'estampar', 'el sello queda apuntado como estampado')
  // Lo programado de verdad (solo si el navegador deja sonar sin tocar: si no, la partitura queda pendiente y no se programa).
  const ag = await ev("JSON.stringify((window.__sonidosAgendados ?? []).filter((x) => x.partitura === 'sello_pasaporte').map((x) => ({ id: x.id, en: +x.en.toFixed(2) })))")
  const agendados = JSON.parse(ag ?? '[]')
  if (agendados.length) {
    const clic = agendados.find((x) => x.id === 'clic')
    debe(clic && Math.abs(clic.en - 2.05) < 0.02, 'estampar', `el clic cae a los 2,05 s, cuando el sello toca la hoja (${JSON.stringify(agendados)})`)
    debe(agendados.some((x) => x.id === 'vuelo' && Math.abs(x.en - 1.55) < 0.02) && agendados.some((x) => x.id === 'brillo'), 'estampar', 'con el vuelo 0,5 s antes y el brillo justo después')
  } else console.log('  (el navegador no dejó programar el audio sin un toque: se comprueba la petición, no el reloj)')

  /* 2b. [Repetir el golpe]: otra vez, una sola. */
  // (En un Chrome sin pantalla el audio no se desbloquea solo: el primer toque reproduce lo que quedó pendiente —el sello que no pudo sonar—, como en el iPhone; ese toque se da antes y se descuenta.)
  await ev("document.body.click(); true")
  await app.esp(500)
  const antesDeRepetir = await pedidos()
  await ev("Array.from(document.querySelectorAll('button')).find((b) => /Repetir el golpe/.test(b.innerText))?.click(); true")
  await app.esp(900)
  const repetido = (await pedidos()) - antesDeRepetir
  // (Sin audio desbloqueado, cada toque reproduce además lo pendiente: llegan 1 o 2 peticiones; con audio desbloqueado, 1.)
  debe(repetido >= 1 && repetido <= 2, 'repetir', `[Repetir el golpe] hace sonar el sello otra vez (${repetido} más)`)

  /* 2c. Con el sello ya estampado: no suena (ni [Ver mi sello] ni pedir `sello:` otra vez). */
  await cerrar()
  await app.esp(500)
  await limpiar()
  await abrir('ver-sello:demo-roma-2026')
  await esperar("Boolean(document.querySelector('[data-mundo]'))", 40, 300)
  await app.esp(3600)
  const ver = await ev("({ golpe: Boolean(document.querySelector('[data-golpe-del-sello]')), sello: Boolean(document.querySelector('svg[aria-label^=\"Sello de\"]')) })")
  debe(!ver.golpe && ver.sello, 'ver', `[Ver mi sello] enseña el sello sin golpe (${JSON.stringify(ver)})`)
  debe((await pedidos()) === 0, 'ver', `y no suena nada (${await todosLosPedidos()})`)
  await cerrar()
  await app.esp(500)
  await limpiar()
  await abrir('sello:demo-roma-2026')
  await esperar("Boolean(document.querySelector('[data-mundo]'))", 40, 300)
  await app.esp(3600)
  const otra = await ev("Boolean(document.querySelector('[data-golpe-del-sello]'))")
  debe(!otra && (await pedidos()) === 0, 'ver', 'pedir `sello:` de un viaje ya estampado tampoco lo vuelve a estampar ni a sonar')

  /* 2d. Con el sonido apagado en la app: nada. */
  await cerrar()
  await ev("localStorage.setItem('trazo:sonido', 'no'); localStorage.removeItem('jutrip.sellos_estampados'); true")
  await limpiar()
  await abrir('sello:demo-roma-2026')
  await esperar("Boolean(document.querySelector('[data-golpe-del-sello]'))", 40, 250)
  await app.esp(2500)
  debe((await pedidos()) === 0, 'apagado', 'con el sonido apagado en los ajustes no suena (y el sello sí cae)')
  await ev("localStorage.removeItem('trazo:sonido'); true")
  await cerrar()
} finally {
  await app.cerrar()
}

console.log(`\nPrueba de la Tanda V37 (sello con sonido): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
