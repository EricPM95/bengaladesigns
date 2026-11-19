// Medida del tráfico con Supabase (V26b), SIN tocar producción: un Supabase de mentira cuenta los bytes que sube y baja el código REAL de la app
// (tripPersistence, viajeEnDirecto, urlsFirmadas). Realtime se modela: cada cambio en la fila manda la fila ENTERA a cada móvil suscrito.
//   node scripts/destino/medidaV26.mjs
import { createRequire } from 'node:module'
import os from 'node:os'
import { build } from 'esbuild'
const require = createRequire(import.meta.url)
const falsos = {
  name: 'falsos',
  setup(b) {
    b.onResolve({ filter: /supabaseClient$/ }, () => ({ path: 'sb', namespace: 'falso' }))
    b.onLoad({ filter: /^sb$/, namespace: 'falso' }, () => ({ contents: 'export const supabase = new Proxy({}, { get: (_, k) => globalThis.__sb[k] })', loader: 'js' }))
  },
}
const fuera = os.tmpdir() + '/_med_out.cjs'
await build({ entryPoints: ['scripts/destino/_med_entrada.ts'], outfile: fuera, bundle: true, platform: 'node', format: 'cjs', logLevel: 'error', plugins: [falsos], define: { 'import.meta.env': '{"DEV":false,"PROD":true,"VITE_CUENTAS_ACTIVAS":"true"}' } })
globalThis.localStorage = { _: {}, getItem(k) { return this._[k] ?? null }, setItem(k, v) { this._[k] = String(v) }, removeItem(k) { delete this._[k] } }
globalThis.window = globalThis
globalThis.addEventListener = () => {}
globalThis.dispatchEvent = () => {}
globalThis.CustomEvent = class { constructor(t, o) { this.type = t; this.detail = o?.detail } }
const M = require(fuera)
const KB = (b) => (b / 1024).toFixed(b < 10240 ? 1 : 0) + ' KB'
const MB = (b) => (b / 1048576).toFixed(2) + ' MB'
const bytes = (x) => Buffer.byteLength(JSON.stringify(x ?? null))

/* ---- una ruta del tamaño de una de verdad (79 KB: 4 días, 48 paradas) ---- */
const parada = (i) => ({ id: 'p' + i, name: 'Parada ' + i, coordinates: { lat: 41.9, lng: 12.49 }, time: '10:00', durationMinutes: 60, category: 'monumento', tags: ['a', 'b'], description: 'x'.repeat(1400) })
const ruta = { id: 'r1', destination: 'Lanzarote', country: 'España', origin: 'Madrid', answers: { days: 4 }, intensity: 3, createdAt: '2026-09-01T10:00:00Z', days: [1, 2, 3, 4].map((n) => ({ id: 'd' + n, dayNumber: n, city: 'Arrecife', title: 'Día ' + n, meals: [], stops: Array.from({ length: 12 }, (_, i) => parada(n * 100 + i)) })) }
const BYTES_RUTA = bytes(ruta)

let subida = 0
let bajada = 0
let fila = { id: 't1', traveler_id: 'u1', guardado_en: null, updated_at: '2026-11-19T10:00:00Z', route: ruta, bookings: {}, wishlist: [], ui_state: { mode: 'route', activeDayId: null }, generation_state: null }
const cuenta = (sube, baja) => {
  subida += sube
  bajada += baja
}
const columnas = (cols, f) => (cols === '*' ? f : Object.fromEntries(cols.split(',').map((c) => c.trim()).map((c) => [c, f[c]])))
globalThis.__sb = {
  auth: { getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }) },
  from: () => {
    let op = 'select'
    let cols = '*'
    let cambio = null
    const q = {
      select(c) { cols = c ?? '*'; return q },
      update(v) { op = 'update'; cambio = v; return q },
      eq() { return q },
      async maybeSingle() { const d = columnas(cols, fila); cuenta(0, bytes(d)); return { data: d, error: null } },
      then(res, rej) {
        let r
        if (op === 'update') {
          fila = { ...fila, ...cambio }
          const d = [columnas(cols, fila)]
          cuenta(bytes(cambio), bytes(d))
          r = { data: d, error: null }
        } else r = { data: [columnas(cols, fila)], error: null }
        return Promise.resolve(r).then(res, rej)
      },
    }
    return q
  },
}
const { TP, refrescarViajeActivo, useSyncStore } = M
useSyncStore.setState({ travelerId: 'u1', activeTripId: 't1' })

const resultados = []
async function escenario(nombre, fn) {
  subida = 0
  bajada = 0
  await fn()
  resultados.push({ nombre, subida, bajada })
  return { subida, bajada }
}
const MOVILES = 2 // dos móviles con el viaje compartido abierto
const echoRealtime = () => bytes(fila) * MOVILES // cada cambio en la fila: la fila ENTERA a cada móvil

await TP.loadOneTrip('u1', 't1')
const baseFila = bytes(fila)

const sondeo13 = await escenario('Sondeo de respaldo: 13 preguntas (10 min a 45 s) sin cambios', async () => {
  for (let i = 0; i < 13; i++) await refrescarViajeActivo({ sondeo: true })
})
const guardado = await escenario('UN guardado real propio (+ su eco se reconoce por el sello)', async () => {
  await TP.saveTrip('u1', 't1', { route: ruta, bookings: {}, wishlist: [], uiState: { mode: 'route', activeDayId: 'd1' } })
  await refrescarViajeActivo({ sondeo: true })
})
fila = { ...fila, updated_at: '2026-11-19T10:05:00Z' }
const ajeno = await escenario('Llega un cambio de la OTRA persona (este móvil baja el viaje)', async () => {
  await refrescarViajeActivo({ sondeo: true })
})

console.log('\nPeso de la ruta de pruebas:', KB(BYTES_RUTA), '· fila entera del viaje:', KB(baseFila))
for (const r of resultados) console.log(`${r.nombre}: sube ${KB(r.subida)} · baja ${KB(r.bajada)}`)
console.log('Realtime, por cada cambio de la fila, a 2 móviles:', KB(echoRealtime()))

// Un día de viaje, 10 h, con dos móviles: 60 toques de pestaña o de día + 15 cambios reales.
const porSondeo = sondeo13.bajada / 13
const unCambio = guardado.subida + guardado.bajada + echoRealtime() + ajeno.bajada
const antes = { sondeos_30s: ((10 * 3600) / 30) * porSondeo * MOVILES, pestanas_y_dias: 60 * unCambio, cambios_reales: 15 * unCambio }
const ahora = { sondeos_45s: ((10 * 3600) / 45) * porSondeo * MOVILES, pestanas_y_dias: 0, cambios_reales: 15 * unCambio }
const suma = (o) => Object.values(o).reduce((a, b) => a + b, 0)
console.log('\nUn día de viaje (10 h, 2 móviles, 60 toques de pestaña/día, 15 cambios reales), SOLO el viaje compartido:')
for (const [k, v] of Object.entries(antes)) console.log('  antes', k, MB(v))
console.log('  ANTES total', MB(suma(antes)))
for (const [k, v] of Object.entries(ahora)) console.log('  ahora', k, MB(v))
console.log('  AHORA total', MB(suma(ahora)))

/* ---- FOTOS (modelo con supuestos escritos; no se mide red real) ----
   Foto grande de fotos-viaje: 83 KB de media medida en el almacén real el 19-nov (con la compresión nueva de las cuentas, hasta ~300 KB). Miniatura de 400 px: ~20 KB (supuesto). */
const GRANDE = 83 * 1024
const MINI = 20 * 1024
const aperturasDeLogros = 20 // veces al día que se abre una colección, el Visto, el pasaporte, el resumen…
const fotosPorApertura = 15
const listadosDeFotos = 40 // RUTA, DIAS, HOY, resumen, Perfil... listando las fotos del viaje en el día
const fotosDelViaje = 40
const logrosLlamadas = { antes: 130 * 1048576, ahora: 1.4 * 1048576 } // medido antes con repo.viajesDe (ver REPASO_V26)
const fotos = {
  logros_antes: aperturasDeLogros * fotosPorApertura * GRANDE,
  logros_ahora: fotosPorApertura * MINI,
  viaje_antes: listadosDeFotos * fotosDelViaje * MINI,
  viaje_ahora: fotosDelViaje * MINI,
}
const unaPersonaAntes = suma(antes) + logrosLlamadas.antes + fotos.logros_antes + fotos.viaje_antes
const unaPersonaAhora = suma(ahora) + logrosLlamadas.ahora + fotos.logros_ahora + fotos.viaje_ahora
console.log('\nFotos de logros: antes', MB(fotos.logros_antes), '-> ahora', MB(fotos.logros_ahora))
console.log('Fotos del viaje (listados): antes', MB(fotos.viaje_antes), '-> ahora', MB(fotos.viaje_ahora))
console.log('\nUNA PERSONA, UN DIA DE VIAJE (viaje compartido de 2): antes', MB(unaPersonaAntes), '-> ahora', MB(unaPersonaAhora))
console.log('1.000 personas, viaje de 5 dias al mes: antes', (unaPersonaAntes * 5 * 1000 / 1073741824).toFixed(0), 'GB -> ahora', (unaPersonaAhora * 5 * 1000 / 1073741824).toFixed(0), 'GB')
