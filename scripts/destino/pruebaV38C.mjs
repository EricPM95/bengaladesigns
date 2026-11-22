// La prueba de la Tanda V38C (22-nov): SOLO SUENA LO QUE SE ESTÁ ANIMANDO.
//   1. Cada `sonar(...)` de la app está en la tabla (tablaSonidosV38C.mjs) con su animación; ninguna pantalla quieta (ficha, vitrina, lista, hoja de logros) suena.
//   2. Los resúmenes (viaje y día) suenan solo la primera vez y solo si los números suben de verdad; abiertos otra vez, en silencio.
//   3. La ficha de un logro de viajero ya conseguido nunca dice «0» ni «te falta» para sí mismo (la cuenta y la regla salen de lo mismo).
// La parte de código y de datos no necesita servidores; la pantalla necesita Vite (5173).
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV38C.mjs
// Ninguna parte toca el Supabase de producción (_enLaApp.mjs bloquea *.supabase.co; la app usa la demo de logros).
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'
import { TABLA } from './tablaSonidosV38C.mjs'
import { cargarDatos } from '../../server/logros/datos.js'
import { calcular, clave, GLOBAL, hechosQueCuentan } from '../../server/logros/motor.js'
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
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '')
const APP = process.env.APP_URL ?? 'http://localhost:5173'

/* ───────── 1. Cada sonar(...) de la app está en la tabla ───────── */
console.log('1. Cada llamada a sonar(...) de la app, en la tabla')
const archivos = []
const rec = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = `${d}/${e.name}`
    if (e.isDirectory()) rec(p)
    else if (/\.(tsx?|jsx?)$/.test(e.name)) archivos.push(p)
  }
}
rec('src')
const llamadasDe = (f) => sinComentarios(leer(f)).split('\n').filter((l) => /\b(sonar|reproducirMomentos|iniciarPartitura)\(/.test(l) && !/function (sonar|reproducirMomentos|iniciarPartitura)\(/.test(l) && !/^\s*import /.test(l)).length
const reales = new Map()
for (const f of archivos) {
  if (f === 'src/lib/sonidos/motor.ts') continue // el motor mismo (definición y uso interno)
  const n = llamadasDe(f)
  if (n > 0) reales.set(f, n)
}
for (const [f, n] of reales) {
  const fila = TABLA.find((x) => x.archivo === f)
  debe(Boolean(fila), 'tabla', `${f} (${n} llamada/s) está en la tabla`)
  if (fila) debe(fila.llamadas === n, 'tabla', `${f}: la tabla dice ${fila.llamadas} llamada/s y el código tiene ${n}`)
}
for (const fila of TABLA) {
  debe(reales.has(fila.archivo) || fila.llamadas === 0, 'tabla', `${fila.archivo}: la tabla no apunta a un archivo sin llamadas`)
  debe(fila.animacion.length > 10 && fila.donde.length > 10, 'tabla', `${fila.archivo}: dice con qué animación suena y dónde`)
}
// Las pantallas quietas no tienen ni una llamada: ficha, vitrina, lista, hoja de logros, compartir, perfil, resúmenes (solo por la puerta única).
const QUIETAS = ['src/components/logros/pantallas/todos', 'src/components/logros/momentos/HojaLogros.tsx', 'src/components/logros/momentos/Compartir.tsx', 'src/components/logros/momentos/hoja', 'src/components/logros/ficha', 'src/components/logros/pantallas/perfil']
const quietasConSonido = []
for (const f of archivos) if (QUIETAS.some((q) => f === q || f.startsWith(`${q}/`)) && reales.has(f)) quietasConSonido.push(f)
debe(quietasConSonido.length === 0, 'quietas', `ninguna ficha, vitrina, lista ni hoja de logros llama a un sonido (${quietasConSonido.join(', ') || 'ninguna'})`)
for (const f of ['src/components/logros/momentos/ResumenViaje.tsx', 'src/components/logros/momentos/ResumenDia.tsx']) {
  const src = sinComentarios(leer(f))
  debe(!/\bsonar\(/.test(src) && /sonarResumenUnaVez/.test(src), 'resumenes', `${f}: ya no llama a sonar al abrirse; solo por sonarResumenUnaVez`)
}
const cifras = sinComentarios(leer('src/components/logros/momentos/cifrasQueSuben.ts'))
debe(/if \(!conCifras \|\| movimientoReducido\(\) \|\| dentroDelEstudio\(\)\) return/.test(cifras), 'resumenes', 'el resumen solo suena con cifras que suben, sin «Reducir movimiento» y nunca dentro del estudio')
const viaje = sinComentarios(leer('src/components/logros/momentos/ResumenViaje.tsx'))
debe(/yaSeVio\(claveResumenViaje\(tripId\)\)/.test(viaje) && /marcarVisto\(claveResumenViaje\(tripId\)\)/.test(viaje), 'resumenes', 'el resumen del viaje usa la marca de «ya se vio» (una por viaje, en el móvil)')
const host = sinComentarios(leer('src/components/logros/momentos/MomentosHost.tsx'))
debe(/<ResumenDia primeraVez/.test(host) && /window\.localStorage\.setItem\(claveDelResumen/.test(host), 'resumenes', 'el resumen del día sale desde el anfitrión, que ya guarda «este día ya salió» (la marca que existía), y solo él pide el sonido')
const dia = sinComentarios(leer('src/components/logros/momentos/ResumenDia.tsx'))
debe(/primeraVez = false/.test(dia), 'resumenes', 'sin la marca «primera vez», ResumenDia no suena ni mueve nada')
debe(/Date\.now\(\) - pendiente\.en < 3_000/.test(sinComentarios(leer('src/lib/sonidos.ts'))), 'pendiente', 'un sonido que no pudo salir solo se repite si el toque llega en menos de 3 s (no con la animación ya acabada)')

/* ───────── 2. La ficha de un logro de viajero conseguido ───────── */
console.log('2. Logros de viajero conseguidos: la ficha nunca dice «0» ni «te falta» para sí mismos')
{
  const datos = cargarDatos()
  const ahora = new Date('2026-12-26T10:00:00Z')
  const catalogos = {}
  const base = () => new Map()
  const construir = (items, cuentan = [], viajes = {}) => construirGanados({ datos, catalogos, items, cuentan, viajes, perfil: { vitrina: { baldas: {}, titulo: null } }, ahora })
  const item = (logro, escalon) => ({ clave: clave(GLOBAL, logro, escalon), logro, escalon: String(escalon), destino: GLOBAL, trip_id: 't1', en: '2026-11-09T10:00:00.000Z' })
  // El caso de Eric: tiene «Todos a bordo» (el primer viaje en familia) pero la cuenta de ahora, con los viajes que hay, no encuentra ninguno en familia.
  {
    const items = base()
    const it = item('viajero:con_quien_familia', 1)
    items.set(it.clave, it)
    const r = construir(items)
    const fila = r.viajero.flatMap((g) => g.filas).find((f) => f.id === 'con_quien_familia')
    debe(Boolean(fila?.ganado), 'todos_a_bordo', '«Todos a bordo» sale como conseguido')
    debe(fila?.cuenta?.n >= 1, 'todos_a_bordo', `la ficha cuenta ${fila?.cuenta?.n} viaje(s) en familia (nunca 0)`)
    debe(!fila?.siguiente || fila.siguiente.nombre !== 'Todos a bordo', 'todos_a_bordo', `y no dice «Te falta 1 para Todos a bordo» (${fila?.siguiente ? `te faltan ${fila.siguiente.faltan} para ${fila.siguiente.nombre}` : 'sin siguiente'})`)
    debe(fila?.siguiente?.nombre === 'Maletas para todos' && fila.siguiente.faltan === 2, 'todos_a_bordo', 'habla del siguiente escalón: «Te faltan 2 para Maletas para todos»')
  }
  // Todos los logros de viajero con escalones, escalón a escalón; y los de un solo golpe: ninguno conseguido dice 0 ni «te falta» para sí mismo.
  let revisados = 0
  const malos = []
  for (const def of datos.viajero.logros) {
    if (def.id === 'maravillas') continue
    const escalones = def.escalones?.map((e) => e.n) ?? ['']
    for (const n of escalones) {
      const items = base()
      const it = item(`viajero:${def.id}`, n)
      items.set(it.clave, it)
      const r = construir(items)
      const fila = r.viajero.flatMap((g) => g.filas).find((f) => f.id === def.id)
      if (!fila) continue // apagado o de otra temporada: no sale en la ficha
      revisados++
      const etiqueta = `${def.id}${n === '' ? '' : ` (escalón ${n})`}`
      if (!fila.ganado) malos.push(`${etiqueta}: no sale conseguido`)
      if (def.escalones) {
        if ((fila.cuenta?.n ?? 0) < Number(n)) malos.push(`${etiqueta}: cuenta ${fila.cuenta?.n} y ya tiene el escalón ${n}`)
        if (fila.siguiente && fila.siguiente.n <= Number(n)) malos.push(`${etiqueta}: dice «te falta» para el escalón ${fila.siguiente.n}, que ya tiene`)
        if (fila.siguiente && fila.siguiente.faltan <= 0) malos.push(`${etiqueta}: «te faltan ${fila.siguiente.faltan}»`)
      } else if ((fila.actual ?? 0) < (fila.objetivo ?? 1)) malos.push(`${etiqueta}: avance ${fila.actual} de ${fila.objetivo} estando conseguido`)
    }
  }
  debe(revisados >= 20, 'viajero', `se revisan de verdad todos los logros de viajero (${revisados} fichas)`)
  debe(malos.length === 0, 'viajero', `ningún logro conseguido dice 0 ni «te falta» para sí mismo (${malos.slice(0, 4).join(' | ') || 'ninguno'})`)
  // Y el caso normal sigue igual: con la cuenta de verdad (un viaje en familia), la ficha dice lo mismo que la regla.
  {
    const viajes = { t1: { id: 't1', destino: 'roma', inicio: '2026-10-10', fin: '2026-10-14', con_quien: 'familia', dias: [] } }
    const roma = datos.destinos.roma
    const sitio = roma.colecciones[0].sitios[0]
    const hechos = [{ id: 'v1', tipo: 'visto', trip_id: 't1', destino: 'roma', sitio, stop_id: 's1', instante: '2026-10-11T10:00:00Z', ubic: 'cerca', valido: true, recibido_en: '2026-10-11T10:01:00Z' }]
    const items = calcular({ datos, hechos, viajes, cuenta: { alta_cuenta: '2026-01-01T00:00:00Z', salida: '2026-09-01' }, ahora: '2026-10-20T10:00:00Z', pionero: { roma: 3 }, probador: null })
    const cuentan = hechosQueCuentan(hechos, viajes, datos)
    const r = construirGanados({ datos, catalogos: {}, items, cuentan, viajes, perfil: { vitrina: { baldas: {}, titulo: null } }, ahora: new Date('2026-10-20T10:00:00Z') })
    const fila = r.viajero.flatMap((g) => g.filas).find((f) => f.id === 'con_quien_familia')
    debe(fila?.ganado && fila.cuenta.n === 1, 'cuenta_real', `con un viaje en familia de verdad, la ficha dice 1 (${fila?.cuenta?.n}) y el logro está conseguido`)
  }
}

/* ───────── 3. Pantalla ───────── */
if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('3. (SIN VITE: la parte de la pantalla NO SE HA VERIFICADO)')
  console.log(`\nPrueba de la Tanda V38C: ${comprobaciones} comprobaciones · ${fallos.length} fallos · PANTALLA SIN VERIFICAR`)
  process.exit(fallos.length ? 1 : 0)
}
console.log('3. En la app (390 x 844)')
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=completa', ancho: 390, alto: 844 })
const informe = {}
try {
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  await a.esp(3000)
  for (let i = 0; i < 6; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  const esperar = async (js, n = 60) => {
    for (let i = 0; i < n; i++) {
      if (await a.evaluar(js).catch(() => false)) return true
      await a.esp(250)
    }
    return false
  }
  debe(await esperar('Boolean(window.__momentos)', 80), 'pantalla', 'el anfitrión de momentos está listo (demo de logros)')
  // El registro de cada sonido que de verdad se pide (con su instante).
  await a.evaluar(`(() => { window.__ped = []; const l = []; const p = l.push.bind(l); l.push = (x) => { window.__ped.push([x, performance.now()]); return p(x) }; window.__sonidosPedidos = l; return true })()`)
  const pedidos = async () => JSON.parse(await a.evaluar('JSON.stringify(window.__ped.map(([n]) => n))'))
  const limpiar = () => a.evaluar("(() => { window.__ped.length = 0; window.__sonidosPedidos.length = 0; return true })()")
  const textoCifras = () => a.evaluar("document.querySelector('[data-cifras-del-viaje]')?.innerText.replace(/\\s+/g, ' ').trim() ?? ''")
  const cerrar = async () => {
    await a.evaluar('window.__momentos.cerrar(); true')
    await a.esp(600)
  }
  // Sin ninguna marca de «ya se vio».
  await a.evaluar("(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('trazo:logros:resumenviaje:')) localStorage.removeItem(k); return true })()")

  console.log('   · Resumen del viaje, la primera vez')
  await limpiar()
  await a.evaluar("window.__momentos.resumenViaje('wow'); true")
  await esperar("Boolean(document.querySelector('[data-cifras-del-viaje]'))", 80)
  const muestras = []
  for (let i = 0; i < 14; i++) {
    muestras.push(await textoCifras())
    await a.esp(130)
  }
  const final1 = await textoCifras()
  const nums = (t) => (t.match(/\d+/g) ?? []).map(Number)
  informe.cifras = { muestras, final: final1 }
  debe(nums(muestras[0]).reduce((s, n) => s + n, 0) < nums(final1).reduce((s, n) => s + n, 0), 'viaje_primera', `los números SUBEN en pantalla (de ${muestras[0]} a ${final1})`)
  debe(nums(final1).some((n) => n > 0), 'viaje_primera', `acaban en sus valores (${final1})`)
  const p1 = await pedidos()
  debe(p1.filter((x) => x === 'dia_completo').length === 1, 'viaje_primera', `la primera vez programa su sonido, una sola vez (${p1.join(',') || 'ninguno'})`)
  debe(await a.evaluar("Object.keys(localStorage).some((k) => k.startsWith('trazo:logros:resumenviaje:'))"), 'viaje_primera', 'y apunta que ya se vio (la marca por viaje)')
  await cerrar()

  console.log('   · Resumen del viaje, otra vez')
  await limpiar()
  await a.evaluar("window.__momentos.resumenViaje('wow'); true")
  await esperar("Boolean(document.querySelector('[data-cifras-del-viaje]'))", 80)
  const quieta = []
  for (let i = 0; i < 6; i++) {
    quieta.push(await textoCifras())
    await a.esp(150)
  }
  debe(quieta.every((t) => t === final1), 'viaje_otra_vez', `abierto otra vez, los números ya están puestos y quietos (${quieta[0]})`)
  await a.esp(1500)
  const p2 = await pedidos()
  debe(p2.length === 0, 'viaje_otra_vez', `abrir otra vez el resumen del viaje no programa ningún sonido (${p2.join(',') || 'ninguno'})`)
  await cerrar()

  console.log('   · Resumen del día (lo abre el anfitrión una vez al acabar el día)')
  await limpiar()
  await a.evaluar("window.__momentos.resumenDia(); true")
  await esperar("Boolean(document.querySelector('[aria-label=\"Resumen del día\"]'))", 60)
  await a.esp(2500)
  const pd = await pedidos()
  const hayNumeros = await a.evaluar("(document.querySelector('[aria-label=\"Resumen del día\"]')?.innerText ?? '').match(/\\d+/g)?.length > 0")
  debe(!hayNumeros || pd.filter((x) => x === 'dia_completo').length === 1, 'dia_primera', `el resumen del día, la primera vez y con números, programa su sonido una vez (${pd.join(',') || 'ninguno'})`)
  await cerrar()

  console.log('   · Pantallas quietas: ficha, vitrina, hoja de logros, lista')
  await limpiar()
  await a.evaluar("window.__momentos.hoja(); true")
  await esperar("Boolean(document.querySelector('[data-ver-resumen-del-viaje]')) || document.querySelectorAll('[role=dialog]').length > 0", 40)
  await a.esp(2500)
  debe((await pedidos()).length === 0, 'quietas', `abrir la hoja de logros (medallas ya ganadas) no suena (${(await pedidos()).join(',') || 'nada'})`)
  await cerrar()
  for (const pestana of ['vitrina', 'todos']) {
    await a.evaluar(`(async () => { const imp = (p) => { const e = performance.getEntriesByType('resource').map((r) => r.name).find((n) => n.includes(p)); return import(e ?? p) }; const M = await imp('/src/components/logros/pantallas/useLogrosPantallas.ts'); M.useLogrosPantallas.getState().abrir({ t: 'todos', pestana: '${pestana}' }); return true })()`)
    await a.esp(2500)
    debe((await pedidos()).length === 0, 'quietas', `abrir «${pestana}» no suena (${(await pedidos()).join(',') || 'nada'})`)
    await a.evaluar(`(async () => { const imp = (p) => { const e = performance.getEntriesByType('resource').map((r) => r.name).find((n) => n.includes(p)); return import(e ?? p) }; const M = await imp('/src/components/logros/pantallas/useLogrosPantallas.ts'); M.useLogrosPantallas.getState().cerrar?.(); return true })()`)
    await a.esp(500)
  }
  // Una ficha de logro (la misma pieza de la pestaña Logros): se abre con la ficha que tenga la cuenta de la demo.
  await a.evaluar(`(async () => { const imp = (p) => { const e = performance.getEntriesByType('resource').map((r) => r.name).find((n) => n.includes(p)); return import(e ?? p) }; const T = await imp('/src/components/logros/pantallas/todos/api.ts'); await T.useGanados.getState().cargar?.(); const g = T.useGanados.getState().datos; const k = g?.items?.[0]?.clave ?? g?.viajero?.[0]?.filas?.find((f) => f.clave)?.clave; if (k) T.useHojasDeLogros.getState().abrirFicha(k); return true })()`)
  await a.esp(2500)
  debe((await pedidos()).length === 0, 'quietas', `abrir una ficha de logro no suena (${(await pedidos()).join(',') || 'nada'})`)
} finally {
  a.cerrar()
}

fs.writeFileSync('docs/dias/V38C_informe.json', JSON.stringify(informe, null, 1))
console.log(`\nPrueba de la Tanda V38C: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
