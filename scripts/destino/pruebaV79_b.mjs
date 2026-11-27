// V79 §3 (las medallas «la que toca»): la función del nivel, el resumen del día con un 4.º país y con varios en un día, la bandera redonda y la cuenta del servidor.
//   APP_URL=http://localhost:5173 node scripts/destino/pruebaV79_b.mjs      (con Vite en 5173; el servidor de la prueba es el de mentira de la demo: no toca Supabase)
// Un solo Chrome, cerrado al acabar.
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'
import { cargarDatos } from '../../server/logros/datos.js'
import { resumen } from '../../server/logros/vistas.js'

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

/* 1. El código: una sola cuenta, sin el orden del día ni el emoji */
console.log('1. El código')
{
  const dia = leer('src/components/logros/momentos/ResumenDia.tsx')
  debe(!/escalon=\{i \+ 1\}/.test(dia), 'resumen-orden', 'el resumen del día ya no pinta la medalla por el orden del día (`escalon={i + 1}`)')
  debe(/totalDe\(g, 'pais'/.test(dia) && /totalDe\(g, 'destino_nuevo'/.test(dia), 'resumen-total', 'país y destino se pintan por el total (`totalDe`)')
  debe(!/🇮🇹|BANDERAS/.test(dia), 'sin-emoji', 'ya no hay banderas emoji en el resumen del día')
  debe(/BanderaRedonda/.test(dia), 'bandera', 'el resumen del día usa la bandera redonda')
  const chapa = leer('src/components/logros/dibujos/Chapa.tsx')
  debe(/gradoDeLaMedalla\(logro, n \?\? 0\)/.test(chapa), 'una-cuenta', 'Chapa.tsx saca el grado de nivelDelLogro.ts (una sola cuenta)')
  const lib = leer('src/lib/nivelDelLogro.ts')
  debe(/export function nivelDelLogro\(logro: string, total/.test(lib), 'firma', 'la firma nivelDelLogro(logro, total) existe')
}

/* 2. El servidor manda el TOTAL (`n`) de cada país/destino en el resumen */
console.log('2. El resumen del servidor')
{
  const datos = cargarDatos()
  const items = new Map()
  const dias = ['2026-10-17T10:00:00Z', '2026-10-18T10:00:00Z', '2026-10-19T10:00:00Z', '2026-10-20T10:00:00Z']
  ;['Italia', 'Ciudad del Vaticano', 'España', 'Francia'].forEach((p, i) => items.set(`*|pais|${p}`, { clave: `*|pais|${p}`, logro: 'pais', escalon: p, destino: '*', en: dias[i] }))
  items.set('*|destino_nuevo|roma', { clave: '*|destino_nuevo|roma', logro: 'destino_nuevo', escalon: 'roma', destino: '*', en: dias[0] })
  let r = null
  try {
    r = resumen({ datos, destino: 'roma', items, viaje: { id: 'v', destino: 'roma', inicio: '2026-10-17', fin: '2026-10-20' }, desde: '2026-10-17', hasta: '2026-10-20', hoy: '2026-10-21' })
  } catch (e) {
    debe(false, 'servidor', `el resumen del servidor falla: ${e.message}`)
  }
  if (r) {
    const paises = r.ganado.filter((g) => g.logro === 'pais').sort((a, b) => a.en.localeCompare(b.en))
    debe(paises.map((g) => g.n).join(',') === '1,2,3,4', 'n-paises', `los países llevan su total al ganarlos (1,2,3,4): ${paises.map((g) => g.n)}`)
    debe(r.ganado.find((g) => g.logro === 'destino_nuevo')?.n === 1, 'n-destino', 'el destino nuevo lleva n=1')
  }
}

/* 3. La función y las pantallas, en la app */
console.log('3. En la app (un Chrome)')
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago', ancho: 390, alto: 844 })
const J = async (js) => {
  const r = await a.evaluar(js)
  return typeof r === 'string' ? JSON.parse(r) : r
}
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__momentos === 'object'").catch(() => false)); i++) await a.esp(500)
  const f = await J("import('/src/lib/nivelDelLogro.ts').then((m) => JSON.stringify({ p: [1,2,3,4,5,8,10].map((n) => [m.nivelDelLogro('paises', n), m.gradoDeLaMedalla('paises', n)]), d: [1,2,3,4,5,8,10].map((n) => [m.nivelDelLogro('destinos', n), m.gradoDeLaMedalla('destinos', n)]), c: [0,4,5,12].map((n) => m.nivelDelLogro('capitales', n)), g: [m.gradoDeLaMedalla('capitales', 0), m.gradoDeLaMedalla('conocedor', 25), m.gradoDeLaMedalla('conocedor', 60)], otro: m.nivelDelLogro('no_existe', 5), num: m.nivelDelLogro('paises', '3') }))")
  debe(JSON.stringify(f.p.map((x) => x[0])) === '[1,1,2,2,3,4,5]', 'niv-paises', `países 1,2,3,4,5,8,10 → niveles 1,1,2,2,3,4,5: ${JSON.stringify(f.p.map((x) => x[0]))}`)
  debe(JSON.stringify(f.p.map((x) => x[1])) === '[1,1,2,2,3,4,5]', 'grado-paises', 'los grados de la medalla de países son los mismos')
  debe(JSON.stringify(f.d.map((x) => x[0])) === '[1,1,2,2,3,3,4]', 'niv-destinos', `destinos 1,2,3,4,5,8,10 → niveles 1,1,2,2,3,3,4: ${JSON.stringify(f.d.map((x) => x[0]))}`)
  debe(JSON.stringify(f.c) === '[0,0,1,2]', 'niv-capitales', `capitales 0,4,5,12 → 0,0,1,2: ${JSON.stringify(f.c)}`)
  debe(f.g.join() === '1,5,10', 'grado-conocedor', `la medalla nunca se pinta sin nivel (1) y «conocedor» usa los grados 5 y 10: ${f.g}`)
  debe(f.otro === 0 && f.num === 2, 'raros', 'un logro que no cuenta da 0 y un número en texto vale')

  // El resumen del día con un 4.º país: la medalla del nivel que toca por el total (4 países → Trotamundos, nivel 2), con su bandera redonda
  await a.evaluar("window.__estudioVisor = {}; window.__momentos.resumenDiaPaises([['Italia', 4]]); true")
  await a.esp(3500)
  const d4 = await J("JSON.stringify({ medallas: [...document.querySelectorAll('[data-fila-resumen=\"pais\"] [data-chapa-logro]')].map((e) => [e.dataset.chapaLogro, e.dataset.chapaGrado]), banderas: [...document.querySelectorAll('[data-fila-resumen=\"pais\"] [data-bandera-redonda]')].map((e) => e.dataset.banderaRedonda), pie: [...document.querySelectorAll('[data-fila-resumen=\"pais\"] [data-miniatura]')].map((e) => e.innerText.trim()), tieneSvg: Boolean(document.querySelector('[data-bandera-redonda] .fi')) })")
  debe(JSON.stringify(d4.medallas) === '[["paises","2"]]', 'dia-4', `el 4.º país se pinta con la medalla de nivel 2 (Trotamundos): ${JSON.stringify(d4.medallas)}`)
  debe(JSON.stringify(d4.banderas) === '["it"]', 'dia-4-bandera', `con su bandera redonda (it): ${JSON.stringify(d4.banderas)}`)
  debe(d4.pie.join('') === 'Italia', 'dia-4-pie', `el nombre va sin emoji: «${d4.pie.join('')}»`)
  debe(d4.tieneSvg, 'bandera-css', 'la bandera es la de flag-icons (no un emoji)')
  await a.captura('docs/dias/V79_capturas/v79_dia4.jpg')
  await a.evaluar("(() => { document.querySelector('[data-resumen-del-dia]')?.querySelector('button[aria-label]')?.click(); return true })()")

  // 3 países en un día con totales 1, 2 y 3: el 1.º y el 2.º, la misma medalla de nivel 1; el 3.º sube
  await a.evaluar("window.__momentos.resumenDiaPaises([['Italia', 1], ['Ciudad del Vaticano', 2], ['España', 3]]); true")
  await a.esp(3500)
  const d3 = await J("JSON.stringify({ medallas: [...document.querySelectorAll('[data-fila-resumen=\"pais\"] [data-chapa-logro]')].map((e) => e.dataset.chapaGrado), banderas: [...document.querySelectorAll('[data-fila-resumen=\"pais\"] [data-bandera-redonda]')].map((e) => e.dataset.banderaRedonda) })")
  debe(d3.medallas.join() === '1,1,2', 'dia-3', `1.º y 2.º, la misma medalla de nivel 1; el 3.º, la de nivel 2: ${d3.medallas}`)
  debe(d3.banderas.join() === 'it,va,es', 'dia-3-banderas', `cada país con su bandera: ${d3.banderas}`)
  await a.evaluar("(() => { document.querySelector('[data-resumen-del-dia]')?.querySelector('button[aria-label]')?.click(); return true })()")
  await a.esp(800)
  // Dos países el mismo día cuando ya llevaba 2: el nuevo no baja de nivel
  await a.evaluar("window.__momentos.resumenDiaPaises([['Francia', 1], ['Alemania', 2]]); true")
  await a.esp(3000)
  const d2 = await J("JSON.stringify([...document.querySelectorAll('[data-fila-resumen=\"pais\"] [data-chapa-logro]')].map((e) => e.dataset.chapaGrado))")
  debe(d2.join() === '1,1', 'dia-2', `con 2 países el mismo día (totales 1 y 2), los dos con el nivel 1: ${d2}`)
} finally {
  a.cerrar()
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const x of fallos) console.log(` - [${x.regla}] ${x.texto}`)
process.exit(fallos.length ? 1 : 0)
