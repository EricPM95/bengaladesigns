/**
 * EL CONTADOR DE PETICIONES A SUPABASE (V36, solo desarrollo). Cuenta, por ruta, cuántas peticiones hace la app a Supabase (la base de datos, la sesión, las fotos) y cuántos KB baja,
 * y también las llamadas de la app a su propio servidor (`/api/...`, que el servidor resuelve con Supabase). Cada minuto escribe en la consola «Supabase: X peticiones, Y KB» con las 5 rutas
 * que más gastan, y si pasa de un límite (más de 60 peticiones o más de 500 KB en un minuto) avisa en rojo (`console.error`).
 * `window.__supabaseContador` deja leer (`leer()`), poner a cero (`reiniciar()`) y contar el minuto ya (`minuto()`), para las pruebas.
 * En producción NO existe: solo se instala si `import.meta.env.DEV` (lo comprueba quien lo llama) y este archivo no tiene efectos al importarlo (se queda fuera del paquete).
 */
export interface FilaDelContador {
  peticiones: number
  bytes: number
}
export interface LecturaDelContador {
  total: FilaDelContador
  rutas: Record<string, FilaDelContador>
  /** Lo contado desde el último aviso de un minuto. */
  ultimoMinuto: FilaDelContador
}

export const LIMITE_PETICIONES_POR_MINUTO = 60
export const LIMITE_BYTES_POR_MINUTO = 500 * 1024

const rutas = new Map<string, FilaDelContador>()
let total: FilaDelContador = { peticiones: 0, bytes: 0 }
let minutoActual: FilaDelContador = { peticiones: 0, bytes: 0 }
let ultimoMinuto: FilaDelContador = { peticiones: 0, bytes: 0 }
let reloj: number | undefined

/** `/rest/v1/trips?select=id,route&id=eq.x` → `rest/trips`; `/rpc/viajes_lista` → `rpc/viajes_lista`; `/api/logros/cerca` → `api/logros/cerca`. */
export function etiquetaDeLaRuta(url: string): string {
  try {
    const u = new URL(url, 'http://localhost')
    const p = u.pathname
    const rest = /\/rest\/v1\/rpc\/([^/]+)/.exec(p)
    if (rest) return `rpc/${rest[1]}`
    const tabla = /\/rest\/v1\/([^/]+)/.exec(p)
    if (tabla) return `rest/${tabla[1]}`
    const almacen = /\/storage\/v1\/(?:object|sign)\/([^/]+)(?:\/([^/]+))?/.exec(p)
    if (almacen) return `storage/${almacen[1]}${almacen[2] ? `/${almacen[2]}` : ''}`
    const auth = /\/auth\/v1\/([^/]+)/.exec(p)
    if (auth) return `auth/${auth[1]}`
    if (p.startsWith('/realtime')) return 'realtime'
    return p.replace(/^\//, '')
  } catch {
    return url.slice(0, 60)
  }
}

function contar(etiqueta: string, bytes: number): void {
  const fila = rutas.get(etiqueta) ?? { peticiones: 0, bytes: 0 }
  fila.peticiones++
  fila.bytes += bytes
  rutas.set(etiqueta, fila)
  total.peticiones++
  total.bytes += bytes
  minutoActual.peticiones++
  minutoActual.bytes += bytes
}

const kb = (b: number): string => (b / 1024).toFixed(b < 10240 ? 1 : 0)

/** Lo de cada minuto: una línea en la consola (y el desglose de las 5 rutas que más) y, si pasa del límite, un aviso en rojo. */
export function cerrarMinuto(): void {
  const m = minutoActual
  minutoActual = { peticiones: 0, bytes: 0 }
  ultimoMinuto = m
  if (m.peticiones === 0) return
  const arriba = [...rutas.entries()].sort((a, b) => b[1].bytes - a[1].bytes).slice(0, 5)
  const desglose = arriba.map(([r, f]) => `${r} ${f.peticiones}x ${kb(f.bytes)} KB`).join(' · ')
  const linea = `Supabase: ${m.peticiones} peticiones, ${kb(m.bytes)} KB en el último minuto (desde que abriste: ${total.peticiones} peticiones, ${kb(total.bytes)} KB) — ${desglose}`
  if (m.peticiones > LIMITE_PETICIONES_POR_MINUTO || m.bytes > LIMITE_BYTES_POR_MINUTO) {
    console.error(`${linea} — ¡DEMASIADO! (límite ${LIMITE_PETICIONES_POR_MINUTO} peticiones o ${kb(LIMITE_BYTES_POR_MINUTO)} KB por minuto)`)
  } else console.info(linea)
}

function encender(): void {
  if (typeof window === 'undefined' || reloj !== undefined) return
  reloj = window.setInterval(cerrarMinuto, 60_000)
  ;(window as unknown as { __supabaseContador: unknown }).__supabaseContador = {
    leer: (): LecturaDelContador => ({ total: { ...total }, rutas: Object.fromEntries([...rutas.entries()].map(([k, v]) => [k, { ...v }])), ultimoMinuto: { ...ultimoMinuto } }),
    reiniciar: (): void => {
      rutas.clear()
      total = { peticiones: 0, bytes: 0 }
      minutoActual = { peticiones: 0, bytes: 0 }
      ultimoMinuto = { peticiones: 0, bytes: 0 }
    },
    minuto: cerrarMinuto,
  }
}

/** Cuenta cuánto pesa la respuesta sin quitársela a quien la pidió (lee una copia). */
function contarRespuesta(etiqueta: string, respuesta: Response): void {
  const largo = Number(respuesta.headers.get('content-length'))
  if (Number.isFinite(largo) && largo > 0) return contar(etiqueta, largo)
  try {
    void respuesta
      .clone()
      .arrayBuffer()
      .then((b) => contar(etiqueta, b.byteLength))
      .catch(() => contar(etiqueta, 0))
  } catch {
    contar(etiqueta, 0)
  }
}

/** El `fetch` del cliente de Supabase, con la cuenta. */
export function crearFetchContado(base: typeof fetch = (...a) => fetch(...a)): typeof fetch {
  encender()
  return async (entrada, init) => {
    const url = typeof entrada === 'string' ? entrada : entrada instanceof URL ? entrada.href : entrada.url
    const respuesta = await base(entrada, init)
    contarRespuesta(etiquetaDeLaRuta(url), respuesta)
    return respuesta
  }
}

/** Las llamadas de la app a su propio servidor (`/api/...`), que el servidor resuelve con Supabase: se cuentan aparte (con el prefijo `api/`). */
export function contarLlamadasAlServidor(): void {
  if (typeof window === 'undefined') return
  const w = window as unknown as { __contadorApi?: boolean }
  if (w.__contadorApi) return
  w.__contadorApi = true
  encender()
  const original = window.fetch.bind(window)
  window.fetch = async (entrada, init) => {
    const url = typeof entrada === 'string' ? entrada : entrada instanceof URL ? entrada.href : entrada.url
    const respuesta = await original(entrada, init)
    try {
      const u = new URL(url, window.location.origin)
      if (u.origin === window.location.origin && u.pathname.startsWith('/api/')) contarRespuesta(etiquetaDeLaRuta(u.pathname), respuesta)
    } catch {
      /* dirección rara: no se cuenta */
    }
    return respuesta
  }
}
