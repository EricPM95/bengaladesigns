/**
 * (V36) EL CONTADOR DE PETICIONES A SUPABASE DEL SERVIDOR (solo en desarrollo). Supabase cobra por lo que SALE de su base (egress): este envoltorio del `fetch` del cliente cuenta, por tabla o por función (rpc),
 * cuántas peticiones se hacen y cuántos KB bajan, y cada minuto escribe en la consola «Supabase (servidor): X peticiones, Y KB» con las 3 que más bajan. Si pasa de un límite, lo escribe en rojo.
 *
 * Solo funciona si NODE_ENV no es `production` y no se está en Vercel (`VERCEL`): en producción `medirSupabase()` devuelve `undefined` y el cliente se crea exactamente igual que antes (cero coste).
 * Límites (en KB por minuto y en peticiones por minuto) con SUPABASE_MEDIDOR_KB_MIN (por defecto 2048 = 2 MB/min) y SUPABASE_MEDIDOR_PETICIONES_MIN (por defecto 120). SUPABASE_MEDIDOR=0 lo apaga.
 *
 * Uso: `createClient(url, clave, { ...medirSupabase('admin') })` → `{ global: { fetch } }` o nada.
 */
const ROJO = '\x1b[31m'
const SIN_COLOR = '\x1b[0m'
const MINUTO_MS = 60000

/** ¿Es desarrollo? (Nunca en Vercel ni con NODE_ENV=production.) */
export const esDesarrollo = (env = process.env) => env.NODE_ENV !== 'production' && !env.VERCEL && env.SUPABASE_MEDIDOR !== '0'

/** Qué tabla o función toca una dirección de Supabase: `rpc:nombre`, `tabla:nombre`, `auth`, `storage`… */
export function destinoDe(url) {
  const ruta = new URL(String(url)).pathname
  const rest = /\/rest\/v1\/(rpc\/)?([^/?]+)/.exec(ruta)
  if (rest) return `${rest[1] ? 'rpc' : 'tabla'}:${rest[2]}`
  if (/\/auth\/v1\//.test(ruta)) return 'auth'
  if (/\/storage\/v1\//.test(ruta)) return 'storage'
  return ruta.split('/').slice(0, 3).join('/') || 'otro'
}

/**
 * Crea el contador. `fetchBase` es el fetch de verdad (en pruebas, uno de mentira); `escribir` recibe cada línea de aviso. Devuelve `{ fetch, foto, vaciar, informar, parar }`.
 */
export function crearMedidor({ fetchBase = globalThis.fetch, escribir = (linea) => console.log(linea), limiteKb = 2048, limitePeticiones = 120, ahora = () => Date.now(), cadaMs = MINUTO_MS, temporizador = true } = {}) {
  let tabla = new Map() // destino → { peticiones, bytes }
  let desde = ahora()
  const sumar = (destino, bytes) => {
    const x = tabla.get(destino) ?? { peticiones: 0, bytes: 0 }
    x.peticiones++
    x.bytes += bytes
    tabla.set(destino, x)
  }
  const foto = () => {
    let peticiones = 0
    let bytes = 0
    for (const x of tabla.values()) {
      peticiones += x.peticiones
      bytes += x.bytes
    }
    return { peticiones, bytes, kb: Math.round((bytes / 1024) * 10) / 10, porDestino: [...tabla.entries()].map(([destino, x]) => ({ destino, ...x })).sort((a, b) => b.bytes - a.bytes) }
  }
  const informar = () => {
    const f = foto()
    const minutos = Math.max((ahora() - desde) / MINUTO_MS, 1 / 60)
    const pasa = f.kb / minutos > limiteKb || f.peticiones / minutos > limitePeticiones
    if (f.peticiones > 0 || pasa) {
      const tops = f.porDestino.slice(0, 3).map((x) => `${x.destino} ${x.peticiones}× ${(x.bytes / 1024).toFixed(1)} KB`).join(' · ')
      const linea = `Supabase (servidor): ${f.peticiones} peticiones, ${f.kb} KB${tops ? ` (${tops})` : ''}`
      escribir(pasa ? `${ROJO}${linea} — DEMASIADO: más de ${limiteKb} KB o ${limitePeticiones} peticiones por minuto${SIN_COLOR}` : linea)
    }
    tabla = new Map()
    desde = ahora()
    return f
  }
  const medido = async (entrada, opciones) => {
    const respuesta = await fetchBase(entrada, opciones)
    try {
      const url = typeof entrada === 'string' ? entrada : (entrada?.url ?? String(entrada))
      const dicho = Number(respuesta.headers?.get?.('content-length'))
      let bytes = Number.isFinite(dicho) && dicho > 0 ? dicho : 0
      // Sin Content-Length (respuesta comprimida o por trozos) se mide una copia: solo en desarrollo.
      if (!bytes && typeof respuesta.clone === 'function') bytes = (await respuesta.clone().arrayBuffer()).byteLength
      sumar(destinoDe(url), bytes)
    } catch {
      /* medir nunca rompe la petición */
    }
    return respuesta
  }
  let reloj = null
  if (temporizador) {
    reloj = setInterval(informar, cadaMs)
    reloj.unref?.()
  }
  return { fetch: medido, foto, informar, vaciar: () => ((tabla = new Map()), (desde = ahora())), parar: () => reloj && clearInterval(reloj) }
}

const medidores = new Map()
/**
 * Lo que se le pasa a `createClient(…, opciones)`: `{ global: { fetch } }` en desarrollo y `{}` en producción. Un contador por nombre de cliente (así `admin` y `ventas` salen por separado).
 * Un solo temporizador por cliente, sin mantener vivo el proceso.
 */
export function medirSupabase(nombre = 'servidor', env = process.env) {
  if (!esDesarrollo(env)) return {}
  if (!medidores.has(nombre)) {
    const m = crearMedidor({
      escribir: (linea) => console.log(nombre === 'servidor' ? linea : linea.replace('(servidor)', `(servidor · ${nombre})`)),
      limiteKb: Number(env.SUPABASE_MEDIDOR_KB_MIN) || 2048,
      limitePeticiones: Number(env.SUPABASE_MEDIDOR_PETICIONES_MIN) || 120,
    })
    medidores.set(nombre, m)
  }
  return { global: { fetch: medidores.get(nombre).fetch } }
}
