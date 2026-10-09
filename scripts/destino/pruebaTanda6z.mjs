// Prueba de la Tanda 6z: «viajeros lo recomiendan» (nunca un número que no sea real, `?prueba=1` solo en local y en versiones de prueba), ningún enlace de hoteles a otra web ni datos de ejemplo,
// el Free Tour primero en «Entradas» para cada destino con datos, y las cuentas del alojamiento («Tu alojamiento»).
//   node scripts/destino/pruebaTanda6z.mjs        (con el servidor de la app encendido en http://localhost:8787)
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { build } from 'esbuild'

const API = process.env.API_URL ?? 'http://localhost:8787'
let fallos = 0
const ok = (cond, texto) => {
  if (!cond) {
    fallos++
    console.log(`  ✗ ${texto}`)
  }
}

// ── 1. recomendaciones.ts y tuAlojamiento.ts, empaquetados ──
const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-6z-'))
async function cargar(entrada, nombre, vercelEnv) {
  const salida = path.join(carpeta, `${nombre}.cjs`)
  await build({ entryPoints: [entrada], outfile: salida, bundle: true, platform: 'node', format: 'cjs', define: { 'import.meta.env.VITE_VERCEL_ENV': JSON.stringify(vercelEnv ?? ''), 'import.meta.env.DEV': 'false' }, logLevel: 'silent' })
  return salida
}
function ponerPagina(host, search) {
  const memoria = new Map()
  Object.defineProperty(globalThis, 'window', { value: { location: { hostname: host, search }, sessionStorage: { getItem: (k) => memoria.get(k) ?? null, setItem: (k, v) => memoria.set(k, String(v)) } }, configurable: true })
}
const { createRequire } = await import('node:module')
const require = createRequire(import.meta.url)
const rutaRec = await cargar('src/lib/recomendaciones.ts', 'rec')
const rutaAloj = await cargar('src/lib/tuAlojamiento.ts', 'aloj')

const lugares = [
  { name: 'Coliseo', level: 1, kind: 'place' },
  { name: 'Panteón', level: 1, kind: 'place' },
  { name: 'Ara Pacis', level: 2, kind: 'place' },
  { name: 'Villa Torlonia', level: 3, kind: 'place' },
  { name: 'Da Enzo', level: null, kind: 'restaurant' },
]
const recargar = () => {
  delete require.cache[rutaRec]
  return require(rutaRec)
}

console.log('Recomendaciones')
{
  // Producción (un dominio de verdad, con y sin ?prueba=1): ningún número inventado, solo los reales desde 20.
  for (const host of ['trazo.example.com', 'miapp.vercel.app', 'www.trazo.app']) {
    ponerPagina(host, '?prueba=1')
    const R = recargar()
    ok(R.pruebaActiva() === false, `${host}: ?prueba=1 no hace nada`)
    for (const lugar of lugares) {
      ok(R.numeroDeRecomendaciones(lugar, 0) === null, `${host}: ${lugar.name} sin likes no lleva número`)
      ok(R.numeroDeRecomendaciones(lugar, 19) === null, `${host}: ${lugar.name} con 19 likes no lleva número`)
      ok(R.numeroDeRecomendaciones(lugar, 20) === 20, `${host}: ${lugar.name} con 20 likes enseña 20`)
      ok(R.numeroDeRecomendaciones(lugar, 137) === 137, `${host}: ${lugar.name} con 137 likes enseña 137 (nunca sumado a uno inventado)`)
    }
  }
  // Local sin ?prueba=1: lo mismo.
  ponerPagina('localhost', '')
  {
    const R = recargar()
    ok(R.pruebaActiva() === false, 'local sin ?prueba=1: apagado')
    for (const lugar of lugares) ok(R.numeroDeRecomendaciones(lugar, 3) === null, `local sin prueba: ${lugar.name} sin número`)
  }
  // Local con ?prueba=1: números fijos por nivel, y ?prueba=0 lo apaga.
  ponerPagina('localhost', '?prueba=1')
  {
    const R = recargar()
    ok(R.pruebaActiva() === true, 'local con ?prueba=1: encendido')
    for (const lugar of lugares.slice(0, 2)) {
      const n = R.numeroDeRecomendaciones(lugar, 0)
      ok(n !== null && n >= 800 && n <= 2500, `${lugar.name} (nivel 1): ${n} entre 800 y 2.500`)
      ok(n === R.numeroDeRecomendaciones(lugar, 0), `${lugar.name}: el número es siempre el mismo`)
      ok(R.numeroDeRecomendaciones(lugar, 7) === n, `${lugar.name}: no se suma con los reales`)
    }
    const n2 = R.numeroDeRecomendaciones(lugares[2], 0)
    ok(n2 !== null && n2 >= 80 && n2 <= 600, `Ara Pacis (nivel 2): ${n2} entre 80 y 600`)
    ok(R.numeroDeRecomendaciones(lugares[3], 0) === null, 'nivel 3: ninguno')
    ok(R.numeroDeRecomendaciones(lugares[4], 0) === null, 'restaurante (sin nivel): ninguno')
    ok(R.conMiles(1240) === '1.240' && R.conMiles(800) === '800' && R.conMiles(2500) === '2.500', 'el millar con punto')
    ok(R.textoRecomendacion(1240, 0) === '1.240 viajeros lo recomiendan', 'texto de la ficha con número')
    ok(!/\d/.test(R.textoRecomendacion(null, 5)) && !/\d/.test(R.textoRecomendacion(null, 0)), 'texto de la ficha sin número cuando no se enseña ninguno')
    // Todos los lugares de Roma: rangos por nivel
    const roma = JSON.parse(fs.readFileSync('data/pipeline_v2/roma.json', 'utf8'))
    for (const lugar of roma.places) {
      const n = R.numeroDeRecomendaciones({ name: lugar.name, level: lugar.level ?? null, kind: 'place' }, 0)
      if (lugar.level === 1) ok(n >= 800 && n <= 2500, `${lugar.name}: nivel 1 con ${n}`)
      else if (lugar.level === 2) ok(n >= 80 && n <= 600, `${lugar.name}: nivel 2 con ${n}`)
      else ok(n === null, `${lugar.name}: sin número de prueba`)
    }
  }
  ponerPagina('localhost', '?prueba=0')
  ok(recargar().pruebaActiva() === false, '?prueba=0 apaga el modo de prueba')
  // Versiones de prueba de Vercel: sí; la de producción con VITE_VERCEL_ENV=production: nunca.
  ponerPagina('trazo-git-rama-equipo.vercel.app', '?prueba=1')
  ok(recargar().pruebaActiva() === true, 'versión de prueba de Vercel (git): encendido')
  ponerPagina('trazo-abc123xyz-equipo.vercel.app', '?prueba=1')
  ok(recargar().pruebaActiva() === true, 'versión de prueba de Vercel (hash): encendido')
  const rutaProd = await cargar('src/lib/recomendaciones.ts', 'rec-prod', 'production')
  ponerPagina('localhost', '?prueba=1')
  ok(require(rutaProd).pruebaActiva() === false, 'VITE_VERCEL_ENV=production: nunca, ni en localhost')
}

console.log('Alojamiento (cuentas)')
{
  const A = require(rutaAloj)
  ok(A.precioDeTexto('420') === 420 && A.precioDeTexto('420,50') === 420.5 && A.precioDeTexto('') === null && A.precioDeTexto('abc') === null && A.precioDeTexto('0') === null, 'el precio se guarda como número (o ninguno)')
  ok(A.lineaAlojamiento({ name: 'X', totalPrice: 420 }, 4) === '4 noches · 420 €', 'fila del día 1 con precio')
  ok(A.lineaAlojamiento({ name: 'X', totalPrice: null }, 1) === '1 noche', 'fila del día 1 sin precio')
  ok(A.lineaAlojamiento({ name: 'Viejo', pricePerNight: 99 }, 2) === '2 noches', 'un alojamiento guardado de antes no enseña el precio de ejemplo')
}

console.log('Nada de ejemplo ni hoteles a otra web')
{
  const recorrer = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? recorrer(path.join(dir, e.name)) : [path.join(dir, e.name)]))
  const archivos = recorrer('src').filter((f) => /\.(ts|tsx)$/.test(f))
  for (const archivo of archivos) {
    const texto = fs.readFileSync(archivo, 'utf8')
    ok(!/mockHotels|mockActivities|mockAffiliateData|MockHotelResult|buildHotelSearchUrl/.test(texto), `${archivo}: sin datos de ejemplo de hoteles/actividades`)
    ok(!/booking\.com|stay22\.com\/(?!embed)/.test(texto), `${archivo}: sin enlace de hoteles a otra web`)
  }
  const banner = fs.readFileSync('src/components/route/DayList.tsx', 'utf8')
  ok(banner.includes('MissingAccommodationBanner'), 'la pieza del aviso lila sigue en el código (solo se deja de pintar)')
  const pieza = fs.readFileSync('src/components/route/MissingAccommodationBanner.tsx', 'utf8')
  ok(!/¿Necesitas alojamiento\?/.test(pieza.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')), 'el aviso lila «¿Necesitas alojamiento?» ya no se pinta')
}

console.log('El Free Tour, primero en «Entradas»')
{
  let destinos = []
  try {
    for (const nombre of ['Roma']) {
      const res = await fetch(`${API}/api/destination-places`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: nombre }) })
      destinos.push([nombre, await res.json()])
    }
  } catch (error) {
    console.log(`No llego al servidor de la app (${API}): enciéndelo y vuelve a probar. (${error.message})`)
    process.exit(2)
  }
  for (const [nombre, datos] of destinos) {
    const e = datos.free_tour_entry
    ok(Boolean(e), `${nombre}: el Free Tour viaja con el catálogo`)
    ok(e?.solo_entradas === true && e?.requires_ticket === true && e?.name === 'Free Tour por Roma', `${nombre}: marcado «solo entradas» y con su nombre`)
    ok(!datos.places.some((p) => p.solo_entradas || p.name === e?.name), `${nombre}: no está dentro de los lugares (solo sale en Entradas)`)
    ok(Boolean(e?.photo_name) && Boolean(e?.hours_card), `${nombre}: con foto y con ficha`)
  }
}

console.log(fallos === 0 ? '\nTodo en orden: 0 fallos' : `\n${fallos} fallos`)
process.exit(fallos === 0 ? 0 : 1)
