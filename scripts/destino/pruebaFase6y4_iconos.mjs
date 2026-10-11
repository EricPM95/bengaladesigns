// La prueba de la Tanda 6y4, punto 17: los iconos de transporte son los del diseño «Varias Ciudades».
//   node scripts/destino/pruebaFase6y4_iconos.mjs
// Da fallo si:
//   1. avión, tren, autobús o coche de src/lib/iconos.ts no son, trazo a trazo, los del diseño docs/diseno/multidestino/Varias Ciudades.dc.html;
//   2. faltan barco, a pie (andando) o autocaravana, o no son de la misma familia (un trazo válido, en la caja de 24, sin rellenos);
//   3. algún icono de transporte de la familia se declara dos veces (el viejo y el nuevo);
//   4. algún sitio de src pinta un icono de transporte viejo: un trazo de los antiguos, un `<svg>` suelto con un avión/tren/bus/coche, o un emoji de transporte;
//   5. el pintado (Icono) sigue siendo de línea: grosor 1,7, puntas y esquinas redondeadas, sin relleno, y todo con `currentColor`;
//   6. la autocaravana no se usa donde se elige camper, ni el barco donde hay ferry.
import fs from 'node:fs'
import path from 'node:path'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (p) => fs.readFileSync(p, 'utf8')

const diseno = leer('docs/diseno/multidestino/Varias Ciudades.dc.html')
const iconos = leer('src/lib/iconos.ts')

const delDiseno = (nombre) => new RegExp(`^${nombre}:'([^']+)'`, 'm').exec(diseno)?.[1]
const deLaApp = (nombre) => new RegExp(`^\\s{2}${nombre}: '([^']+)'`, 'm').exec(iconos)?.[1]
const cuenta = (nombre) => [...iconos.matchAll(new RegExp(`^\\s{2}${nombre}: '`, 'gm'))].length

// ── 1. Los cuatro del diseño, tal cual ──
for (const n of ['avion', 'tren', 'bus', 'coche']) {
  const d = delDiseno(n)
  debe(Boolean(d), '1 diseño', `el diseño ya no trae el trazo «${n}»`)
  debe(d && deLaApp(n) === d, '1 diseño', `«${n}» de iconos.ts no es el trazo del diseño`)
}
// El diseño los pinta en caja 24, grosor 1,7, puntas y esquinas redondeadas.
debe(/<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1\.7" stroke-linecap="round" stroke-linejoin="round"><path d="\{\{ t\.icon \}\}">/.test(diseno), '1 diseño', 'el diseño ya no pinta el transporte con viewBox 24 / grosor 1,7 / puntas redondeadas')
debe(/GROSOR_ICONO = 1\.7/.test(iconos), '5 pintado', 'el grosor de la familia ya no es 1,7')

// ── 2. Los que el diseño no dibuja ──
const FORMA = /^(?:[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+|[\s,])+$/
for (const n of ['barco', 'andando', 'autocaravana', 'taxi', 'metro', 'tranvia']) {
  const d = deLaApp(n)
  debe(Boolean(d), '2 familia', `falta el icono «${n}» en iconos.ts`)
  debe(d && FORMA.test(d) && /^M/.test(d), '2 familia', `«${n}» no es un trazo válido`)
}
// Todo trazo de la familia cabe en la caja de 24 (los números sueltos de una coordenada absoluta, entre 0 y 24).
for (const n of ['avion', 'tren', 'bus', 'coche', 'barco', 'andando', 'autocaravana', 'taxi']) {
  const d = deLaApp(n) || ''
  const absolutos = [...d.matchAll(/([MLHVCSQTZ])([^A-Za-z]*)/g)].flatMap((m) => (m[2].match(/-?\d*\.?\d+/g) || []).map(Number))
  debe(absolutos.every((x) => x >= -1 && x <= 25), '2 familia', `«${n}» se sale de la caja de 24`)
}

// ── 3. Sin duplicados ──
for (const n of ['avion', 'tren', 'bus', 'coche', 'barco', 'taxi', 'autocaravana', 'andando']) {
  debe(cuenta(n) === 1, '3 duplicado', `«${n}» está ${cuenta(n)} veces en iconos.ts (debe ser 1)`)
}
debe(/INICIO Transporte/.test(iconos) && /FIN Transporte/.test(iconos), '3 bloque', 'el bloque propio «Transporte» de iconos.ts no está delimitado')

// ── 4. Nada viejo en src ──
const VIEJOS = [
  'M10.5 20.5L12 16l-4-4-5 1.5-1-1 5-3.5L6 4l1.5-1 4 4.5L18 2a2 2 0 0 1 3 3l-5.5 6.5 4.5 4-1 1.5-5-1-3.5 5z', // avión
  'M7 3h10a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2zM5 11h14M9 15h.01M15 15h.01M8 18l-2 3M16 18l2 3', // tren
  'M6 3.5h12a2 2 0 0 1 2 2V17H4V5.5a2 2 0 0 1 2-2zM4 11h16M7.5 20.5V17M16.5 20.5V17M8 14h.01M16 14h.01M9 7h6', // bus
  'M3 17l2 4h14l2-4-9-3zM6 14V8h12v6M12 3v5', // barco
  'M5 16v-5l2-5h10l2 5v5M5 16h14v3H5zM7.5 13h.01M16.5 13h.01', // coche
  'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2.5 1.5V22l3.5-1 3.5 1v-1.5L12 19v-5.5z', // el avión relleno de la pantalla de carga
]
const EMOJI_TRANSPORTE = /[✈🚆🚌🚗⛴🚶🚕🚐🚢🚂🚉🛫🛬🚖🚇🚊🚋🚃🛳🚤]/u
const archivos = []
const recorrer = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) recorrer(p)
    else if (/\.(ts|tsx)$/.test(e.name)) archivos.push(p)
  }
}
recorrer('src')
for (const archivo of archivos) {
  const texto = leer(archivo)
  const nombre = archivo.replace(/\\/g, '/')
  for (const viejo of VIEJOS) debe(!texto.includes(viejo), '4 viejo', `${nombre}: aún lleva un trazo de transporte antiguo`)
  debe(!EMOJI_TRANSPORTE.test(texto), '4 emoji', `${nombre}: lleva un emoji de transporte`)
  // Un <svg> suelto (fuera de iconos.ts y de Icono.tsx) con un avión/tren/bus/coche: nombre de componente o de variable.
  if (!/lib\/iconos\.ts$|ui\/Icono\.tsx$/.test(nombre)) {
    const sueltos = [...texto.matchAll(/<svg[\s\S]{0,400}?<\/svg>/g)].map((m) => m[0])
    for (const s of sueltos) {
      debe(!/(plane|avion|avión|train|tren|bus|car\b|coche|ferry|barco)/i.test(s), '4 svg suelto', `${nombre}: un <svg> suelto parece de transporte`)
    }
    debe(!/function (Plane|Train|Bus|Car|Ferry|Ship)Icon\b[^{]*\{\s*return \(\s*<svg/.test(texto), '4 svg suelto', `${nombre}: un componente de transporte pinta un <svg> propio`)
  }
}

// ── 5. El pintado ──
const icono = leer('src/components/ui/Icono.tsx')
debe(/fill=\{relleno \? 'currentColor' : 'none'\} stroke="currentColor" strokeWidth=\{grosor\} strokeLinecap="round" strokeLinejoin="round"/.test(icono), '5 pintado', 'Icono.tsx ya no pinta de línea, con currentColor y puntas redondeadas')
debe(/stroke="currentColor" stroke-width="\$\{grosor\}" stroke-linecap="round" stroke-linejoin="round"/.test(iconos), '5 pintado', 'iconoSvg ya no pinta de línea, con currentColor y puntas redondeadas')
const carga = leer('src/components/loading/LoadingScreen.tsx')
debe(/<Icono nombre="avion"/.test(carga), '5 pintado', 'la pantalla de carga no pinta el avión con la familia de iconos')

// ── 6. Dónde se usan los nuevos ──
const usos = (p, re, texto) => debe(re.test(leer(p)), '6 uso', texto)
usos('src/lib/cityTransitionTransport.ts', /campervan: 'autocaravana'/, 'el tramo en camper no usa la autocaravana')
usos('src/lib/cityTransitionTransport.ts', /ferry: 'barco'/, 'el ferry no usa el barco')
usos('src/lib/arrivalIcon.ts', /ferry: 'barco'/, 'la llegada en ferry no usa el barco')
usos('src/components/route/dayDetail/ArrivalReturnBar.tsx', /ferry: 'barco'/, 'la barra de llegada y vuelta en ferry no usa el barco')
usos('src/components/route/reservas/BloqueReservas.tsx', /ferry: 'barco'/, 'RESERVAS en ferry no usa el barco')
usos('src/lib/transportFeasibility.ts', /icon: 'barco'/, 'la opción de ferry no usa el barco')
for (const p of ['BaseYExcursionesTransportFlow', 'RoadtripTransportFlow', 'UrbanoTransportFlow']) {
  usos(`src/components/questionnaire/${p}.tsx`, /camper: 'autocaravana'/, `${p}: el camper no usa la autocaravana`)
}
usos('src/components/route/dayDetail/VehicleBlock.tsx', /camper: \{ icon: 'autocaravana'/, 'VehicleBlock: el camper no usa la autocaravana')
usos('src/components/route/dayDetail/TransportModeIcons.tsx', /nombre="andando"/, 'los tramos a pie no usan «andando»')

console.log(`${comprobaciones} comprobaciones`)
if (fallos.length) {
  for (const f of fallos) console.log(`FALLO [${f.regla}] ${f.texto}`)
  console.log(`${fallos.length} fallos`)
  process.exit(1)
}
console.log('0 fallos')
