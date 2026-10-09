// Para las pruebas que pintan pantallas de la app en el servidor (pruebaTanda6s, pruebaTanda6t): empaqueta con esbuild un archivo de entrada de la app y lo deja listo
// para `react-dom/server`, con lo mínimo del navegador que mira el código (la dirección, el almacén de la pestaña, `document`).
//   const { M, ponerVersion } = await prepararSSR('scripts/destino/_6s_entrada.tsx')
//   ponerVersion('gratis')  // ?version=gratis (o 'completa'); también borra lo guardado de la pestaña
// Hace falta el servidor de la app encendido (http://localhost:8787): de él salen los datos del destino que usa la app, igual que en la app de verdad.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { build } from 'esbuild'

export async function prepararSSR(entrada, { piezasFalsas = [] } = {}) {
  const API = process.env.API_URL ?? 'http://localhost:8787'
  const memoria = new Map()
  let search = ''
  const ubicacion = { get search() { return search }, href: 'http://localhost/', origin: 'http://localhost', pathname: '/' }
  globalThis.SVGElement = class SVGElement {}
  globalThis.HTMLElement = class HTMLElement {}
  Object.defineProperty(globalThis, 'sessionStorage', { value: { getItem: (k) => memoria.get(k) ?? null, setItem: (k, v) => memoria.set(k, String(v)), removeItem: (k) => memoria.delete(k) }, configurable: true })
  globalThis.window = { location: ubicacion, sessionStorage: globalThis.sessionStorage, addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) }
  Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => null, setItem: () => {}, removeItem: () => {} }, configurable: true })
  globalThis.document = { body: {}, documentElement: { style: {} }, addEventListener() {}, removeEventListener() {}, getElementById: () => null, querySelector: () => null }
  const fetchReal = globalThis.fetch
  globalThis.fetch = (url, opts) => fetchReal(typeof url === 'string' && url.startsWith('/') ? `${API}${url}` : url, opts)
  try {
    const ping = await fetchReal(`${API}/api/destination-excursions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma' }) })
    if (!ping.ok) throw new Error(String(ping.status))
  } catch (error) {
    console.error(`No llego al servidor de la app (${API}): enciéndelo y vuelve a probar. (${error.message})`)
    process.exit(2)
  }

  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-ssr-'))
  const bundle = path.join(carpeta, 'panel.cjs')
  const real = path.resolve('node_modules/react-dom/index.js')
  await build({
    entryPoints: [entrada],
    outfile: bundle,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    jsx: 'automatic',
    logLevel: 'error',
    plugins: [
      // El servidor de React no pinta portales: en la prueba, un portal se pinta donde está (así se ve también lo que cuelga de las ventanas).
      {
        name: 'portales-en-su-sitio',
        setup(b) {
          b.onResolve({ filter: /^react-dom$/ }, () => ({ path: 'react-dom', namespace: 'portales' }))
          b.onLoad({ filter: /.*/, namespace: 'portales' }, () => ({ contents: `const real = require(${JSON.stringify(real)}); module.exports = { ...real, createPortal: (children) => children }`, loader: 'js', resolveDir: process.cwd() }))
        },
      },
      // zustand, al pintar en el servidor, lee el estado de partida y no el de ahora: aquí se le dice que lea el de ahora.
      { name: 'zustand-estado-vivo', setup(b) { b.onLoad({ filter: /zustand[\\/].*\.m?js$/ }, (args) => ({ contents: fs.readFileSync(args.path, 'utf8').replace(/api\.getServerState\s*\|\|\s*api\.getInitialState/g, 'api.getState'), loader: 'js' })) } },
      // Piezas que necesitan un navegador de verdad (un mapa): se cambian por un hueco. `piezasFalsas`: [{ filtro: /StopsMapView$/, exporta: 'StopsMapView' }].
      ...piezasFalsas.map(({ filtro, exporta }) => ({
        name: `hueco-${exporta}`,
        setup(b) {
          b.onResolve({ filter: filtro }, () => ({ path: exporta, namespace: 'huecos' }))
          b.onLoad({ filter: /.*/, namespace: 'huecos' }, (args) => (args.path === exporta ? { contents: `exports.${exporta} = () => null`, loader: 'js' } : null))
        },
      })),
    ],
    loader: { '.svg': 'dataurl', '.png': 'dataurl', '.jpg': 'dataurl', '.jpeg': 'dataurl', '.webp': 'dataurl', '.css': 'empty', '.woff2': 'dataurl' },
    define: { 'import.meta.env.DEV': 'false', 'import.meta.env.PROD': 'true', 'import.meta.env.MODE': '"test"', 'import.meta.env.VITE_MAPBOX_TOKEN': '""', 'import.meta.env.VITE_SUPABASE_URL': '"http://localhost"', 'import.meta.env.VITE_SUPABASE_ANON_KEY': '"x"', 'import.meta.env': '{}' },
  })
  const M = createRequire(import.meta.url)(bundle)
  const ponerVersion = (version) => {
    search = `?version=${version}`
    memoria.clear()
  }
  const limpiar = () => fs.rmSync(carpeta, { recursive: true, force: true })
  return { M, ponerVersion, limpiar }
}
