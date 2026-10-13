// Prueba de la Tanda 6z (ajustada en la 6y10: los números de «me gusta» de prueba ya no existen; queda «lo recomiendan» solo desde 20 y el entorno de prueba), ningún enlace de hoteles a otra web ni datos de ejemplo,
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
  // (Tanda 6y10) Ya no hay números de prueba inventados: la cuenta de cada sitio es la de partida (datos de Roma) más los viajeros (src/store/useMeGustaStore.ts); aquí solo lo que decide QUÉ se enseña de esa cuenta
  // y quién es «entorno de prueba» (el panel de pruebas y la lluvia de prueba). El detalle de los «me gusta» lo prueba pruebaFase6y10_ficha.mjs.
  for (const host of ['trazo.example.com', 'miapp.vercel.app', 'www.trazo.app']) {
    ponerPagina(host, '?prueba=1')
    const R = recargar()
    ok(R.esEntornoDePrueba() === false, `${host}: no es un entorno de prueba`)
  }
  for (const host of ['localhost', '127.0.0.1', 'trazo-git-rama-equipo.vercel.app', 'trazo-abc123xyz-equipo.vercel.app']) {
    ponerPagina(host, '')
    ok(recargar().esEntornoDePrueba() === true, `${host}: sí es un entorno de prueba`)
  }
  const rutaProd = await cargar('src/lib/recomendaciones.ts', 'rec-prod', 'production')
  ponerPagina('localhost', '')
  ok(require(rutaProd).esEntornoDePrueba() === false, 'VITE_VERCEL_ENV=production: nunca, ni en localhost')
  // Sin números de prueba: ni la función ni el panel.
  ok(!('pruebaActiva' in recargar()) && !('fijarPrueba' in recargar()) && !('recomendacionesDePrueba' in recargar()), 'quedan los números de prueba de «me gusta»')
  // El número solo sale desde 20 («me gusta» de partida + viajeros); nunca se inventa.
  const R = recargar()
  for (const lugar of lugares) {
    ok(R.numeroDeRecomendaciones(0) === null, `${lugar.name}: con 0 no lleva número`)
    ok(R.numeroDeRecomendaciones(19) === null, `${lugar.name}: con 19 no lleva número`)
    ok(R.numeroDeRecomendaciones(20) === 20, `${lugar.name}: con 20 enseña 20`)
    ok(R.numeroDeRecomendaciones(137) === 137, `${lugar.name}: con 137 enseña 137`)
  }
  ok(R.conMiles(1240) === '1.240' && R.conMiles(800) === '800' && R.conMiles(2500) === '2.500', 'el millar con punto')
  ok(R.textoRecomendacion(1240) === '1.240 lo recomiendan', 'texto de la ficha con número (sin «viajeros»)')
  ok(!/\d/.test(R.textoRecomendacion(5)) && !/\d/.test(R.textoRecomendacion(0)), 'texto de la ficha sin número cuando no se enseña ninguno')
}

console.log('Alojamiento (cuentas)')
{
  const A = require(rutaAloj)
  ok(A.lineaAlojamiento({ name: 'X', precio: { amount: 420, currency: 'EUR' } }, 4) === '4 noches · 420 €', 'fila del día 1 con precio')
  ok(A.lineaAlojamiento({ name: 'X', precio: null }, 1) === '1 noche', 'fila del día 1 sin precio')
  ok(A.lineaAlojamiento({ name: 'Viejo', pricePerNight: 99 }, 2) === '2 noches', 'un alojamiento guardado de antes no enseña el precio de ejemplo')
  ok(A.precioDeAlojamiento({ name: 'De la 6z', totalPrice: 300 })?.amount === 300, 'un alojamiento guardado en la 6z (totalPrice) se sigue leyendo')
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
