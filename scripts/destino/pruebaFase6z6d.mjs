// La prueba de la Tanda 6z6d: la caché de Vercel del tiempo, la «lluvia de prueba» del panel y la página «Créditos».
//   node scripts/destino/pruebaFase6z6d.mjs        (con el servidor de la app encendido en http://localhost:8787)
// Da fallo si:
//   1. la respuesta buena del tiempo de nuestro servidor no lleva su Cache-Control (s-maxage de 3 horas y stale-while-revalidate), o una respuesta mala (400/502) se puede guardar;
//   2. «Lluvia de prueba» existe en producción (ni la clave de la sesión la enciende allí, ni el panel se pinta);
//   3. con «Lluvia de prueba: no» (o sin tocarla) la app enseña lluvia inventada, o con «sí» en pruebas no la enseña;
//   4. la página «Créditos» no lleva Open-Meteo (con su licencia CC BY 4.0) y los mapas, no está al final del Perfil, o sale en otra pantalla.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { build } from 'esbuild'

const require = createRequire(import.meta.url)
let fallos = 0
let comprobaciones = 0
const ok = (cond, texto) => {
  comprobaciones++
  if (!cond) {
    fallos++
    console.log(`  ✗ ${texto}`)
  }
}
const leer = (p) => fs.readFileSync(p, 'utf8')
const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-6z6d-'))

// ── 1. El Cache-Control ──
console.log('Cache-Control')
{
  const base = process.env.API_BASE ?? 'http://localhost:8787'
  const pide = async (ruta) => {
    try {
      const r = await fetch(base + ruta)
      return { status: r.status, cc: r.headers.get('cache-control') }
    } catch {
      return null
    }
  }
  const fecha = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
  const buena = await pide(`/api/tiempo/horas?lat=41.9&lng=12.5&fecha=${fecha}`)
  if (buena && buena.status === 200) {
    ok(/s-maxage=10800/.test(buena.cc ?? '') && /stale-while-revalidate=10800/.test(buena.cc ?? '') && /public/.test(buena.cc ?? ''), `1a la respuesta buena no lleva s-maxage de 3 h: ${buena.cc}`)
    const dias = await pide(`/api/tiempo/dias?lat=41.9&lng=12.5&desde=${fecha}&hasta=${fecha}`)
    ok(dias && dias.status === 200 && /s-maxage=10800/.test(dias.cc ?? ''), `1b la respuesta de días no lleva s-maxage de 3 h: ${dias?.status} ${dias?.cc}`)
  } else {
    // Sin red o con el proveedor caído: no hay respuesta buena que mirar; se mira en el código que sale en las dos rutas.
    const t = leer('server/tiempo.js')
    ok((t.match(/TIEMPO_CACHE_CONTROL\)/g) ?? []).length === 2, '1a el código no pone el Cache-Control en las dos rutas')
  }
  const mala = await pide('/api/tiempo/horas?lat=99&lng=12&fecha=2026-10-10')
  ok(mala && mala.status === 400 && /no-store/.test(mala.cc ?? ''), `1c una respuesta mala se podría guardar: ${mala?.status} ${mala?.cc}`)
  const t = leer('server/tiempo.js')
  ok(/status\(502\)\.set\('Cache-Control', 'no-store'\)/.test(t), '1d un 502 del proveedor no lleva no-store')
}

// ── 2 y 3. La lluvia de prueba ──
console.log('Lluvia de prueba')
async function cargar(entorno, almacen) {
  const salida = path.join(carpeta, `lluvia-${entorno.nombre}.cjs`)
  await build({
    entryPoints: ['src/lib/rainForecast.ts'],
    outfile: salida,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    logLevel: 'silent',
    define: { 'import.meta.env.DEV': String(entorno.dev), 'import.meta.env.VITE_VERCEL_ENV': entorno.vercel === undefined ? 'undefined' : JSON.stringify(entorno.vercel), 'import.meta.env.VITE_MAPBOX_TOKEN': '""' },
  })
  const guardado = new Map(Object.entries(almacen))
  globalThis.window = { location: { hostname: entorno.host, search: '' }, sessionStorage: { getItem: (k) => guardado.get(k) ?? null, setItem: (k, v) => guardado.set(k, String(v)), removeItem: (k) => guardado.delete(k) } }
  // El servidor «de mentira» responde SIEMPRE seco: si sale lluvia, la inventó la app.
  globalThis.fetch = async (url) => ({
    ok: true,
    json: async () => (String(url).includes('/horas') ? { ok: true, probability: new Array(24).fill(0), precipitation: new Array(24).fill(0) } : { ok: true, dias: [{ dateIso: '2026-10-12', maxima: 20, minima: 12, lluvia: 0 }, { dateIso: '2026-10-13', maxima: 21, minima: 12, lluvia: 0 }] }),
  })
  delete require.cache[require.resolve(salida)]
  return require(salida)
}
const hayLluviaHoras = (r) => r && (r.probability.some((p) => p >= 50) || r.precipitation.some((m) => m >= 0.5))
const hayLluviaDias = (d) => d && d.some((x) => (x.lluvia ?? 0) >= 50)
const coords = { lat: 41.9, lng: 12.5 }
const CLAVE = 'trazo:lluvia-de-prueba'
{
  const produccion = { nombre: 'prod', dev: false, vercel: 'production', host: 'trazo.app' }
  const pruebas = { nombre: 'dev', dev: true, vercel: undefined, host: 'localhost' }
  // En producción, aunque la clave diga «1», nunca hay lluvia inventada.
  const P = await cargar(produccion, { [CLAVE]: '1' })
  ok(!hayLluviaHoras(await P.fetchHourlyRain(coords, '2026-10-12')), '2a en producción la clave «1» inventa lluvia por horas')
  ok(!hayLluviaDias(await P.fetchDailyWeather(coords, '2026-10-12', '2026-10-13')), '2b en producción la clave «1» inventa lluvia por días')
  // En pruebas, con «no» o sin tocarla, nada inventado.
  for (const [nombre, almacen] of [['no', { [CLAVE]: '0' }], ['sin tocar', {}]]) {
    const D = await cargar(pruebas, almacen)
    ok(!hayLluviaHoras(await D.fetchHourlyRain(coords, '2026-10-12')), `3a en pruebas con lluvia «${nombre}» sale lluvia inventada por horas`)
    ok(!hayLluviaDias(await D.fetchDailyWeather(coords, '2026-10-12', '2026-10-13')), `3b en pruebas con lluvia «${nombre}» sale lluvia inventada por días`)
  }
  // En pruebas, con «sí», llueve (y los días alternan).
  const S = await cargar(pruebas, { [CLAVE]: '1' })
  ok(hayLluviaHoras(await S.fetchHourlyRain(coords, '2026-10-12')), '3c en pruebas con «sí» no llueve por horas')
  const dias = await S.fetchDailyWeather(coords, '2026-10-12', '2026-10-15')
  ok(dias && dias.length === 4 && dias[0].lluvia >= 50 && dias[1].lluvia < 50, `3d en pruebas con «sí» los días no alternan: ${JSON.stringify(dias?.map((d) => d.lluvia))}`)
  // El código: solo se enciende desde el panel, y el panel solo existe en pruebas.
  const modulo = leer('src/lib/lluviaDePrueba.ts')
  ok(/if \(!esEntornoDePrueba\(\)\) return false/.test(modulo) && /if \(!esEntornoDePrueba\(\)\) return/.test(modulo.replace('return false', '')), '2c lluviaDePrueba.ts no se corta en producción')
  ok(/if \(!esEntornoDePrueba\(\)\) return null/.test(leer('src/components/dev/PanelDePruebas.tsx')), '2d el panel de pruebas se pinta en producción')
  const usos = fs.readdirSync('src', { recursive: true }).map(String).filter((f) => /\.tsx?$/.test(f) && !/lluviaDePrueba\.ts$/.test(f) && /lluviaDePrueba/.test(leer(path.join('src', f))))
  ok(usos.every((f) => /rainForecast\.ts$|TarjetaCuentaAtras\.tsx$|PanelDePruebas\.tsx$|useAppNotices\.ts$/.test(f)), `2e la lluvia de prueba se usa fuera de los cuatro sitios previstos (el tiempo, la tarjeta de RESERVAS, el panel y la campana): ${usos.join(', ')}`)
}

// ── 4. Créditos ──
console.log('Créditos')
{
  const salida = path.join(carpeta, 'creditos.cjs')
  await build({ entryPoints: ['src/lib/creditos.ts'], outfile: salida, bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent' })
  const { CREDITOS } = require(salida)
  const tiempo = CREDITOS.find((c) => c.clave === 'tiempo')
  ok(tiempo && /Open-Meteo/.test(tiempo.texto) && /CC BY 4\.0/.test(tiempo.texto) && tiempo.enlaces.some((e) => e.url === 'https://open-meteo.com/') && tiempo.enlaces.some((e) => /creativecommons\.org\/licenses\/by\/4\.0/.test(e.url)), '4a falta Open-Meteo con su licencia CC BY 4.0 y los dos enlaces')
  ok(CREDITOS.some((c) => c.clave === 'mapas' && /Mapbox/.test(c.texto) && /OpenStreetMap/.test(c.texto)), '4b faltan los mapas (Mapbox y OpenStreetMap)')
  ok(CREDITOS.every((c) => c.enlaces.every((e) => /^https:\/\//.test(e.url))), '4c algún enlace no es https')
  const perfil = leer('src/components/layout/PerfilSheet.tsx')
  ok(/Créditos/.test(perfil) && /<Creditos onVolver/.test(perfil) && perfil.search(/>\s*Créditos\s*<\/button>/) > perfil.indexOf('Mis viajes'), '4d el enlace «Créditos» no está al final del Perfil')
  const fuera = fs.readdirSync('src', { recursive: true }).map(String).filter((f) => /\.tsx$/.test(f) && !/(Creditos|PerfilSheet)\.tsx$/.test(f) && /Créditos|<Creditos/.test(leer(path.join('src', f))))
  ok(fuera.length === 0, `4e «Créditos» sale en otras pantallas: ${fuera.join(', ')}`)
  ok(/‹/.test(leer('src/components/perfil/Creditos.tsx')) && /Volver/.test(leer('src/components/perfil/Creditos.tsx')), '4f la página no tiene [‹ Volver]')
}

console.log(`\n6z6d: ${comprobaciones} comprobaciones, ${fallos} fallos.`)
process.exitCode = fallos === 0 ? 0 : 1
