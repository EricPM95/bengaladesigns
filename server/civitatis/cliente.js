/**
 * EL CLIENTE DE LA API DE CIVITATIS (parte 1, sandbox). Solo desde nuestro servidor: el usuario, la contraseña y el token NUNCA llegan al móvil ni se escriben en ningún registro.
 *
 *   · Entra con `POST /auth` ({ username, password }) → { token, expiresIn }, guarda el token y lo renueva antes de que caduque (`expiresIn`).
 *     OJO: la documentación dice que el token va en una cabecera `Authentication`, pero el sandbox lo rechaza («JWT Token not found»); el que funciona es `Authorization: Bearer <token>`
 *     (comprobado el 16-oct-2026). Está en un solo sitio, abajo.
 *   · Entorno: `CIVITATIS_API_ENV=sandbox|production` (sandbox por defecto). El sandbox solo funciona de 7:00 a 2:00, hora de España; fuera de esas horas la API responde mal y aquí
 *     eso es un fallo normal («no disponible»), nunca una excepción que rompa la app.
 *   · Límite de 20 peticiones por segundo: nos quedamos muy por debajo (`PETICIONES_POR_SEGUNDO`) y, si llega un 429, se espera y se reintenta (con tope).
 *   · Si algo falla, el cliente devuelve `{ ok: false, motivo }`: quien lo usa hace lo de hoy (nuestros datos y nuestros enlaces). La app avisa, no prohíbe.
 *
 * Todo lo del tiempo y la red se puede cambiar desde fuera (`fetch`, `ahora`, `esperar`) para probarlo con respuestas guardadas, sin red ni dependencia de la hora.
 */

export const URL_BASE = {
  sandbox: 'https://sandbox-api.civitatis.com/v2',
  production: 'https://api.civitatis.com/v2',
}

/** Muy por debajo del límite de Civitatis (20 por segundo). */
export const PETICIONES_POR_SEGUNDO = 8
/** La ventana en la que se cuentan las peticiones (un segundo; solo las pruebas la acortan). */
export const VENTANA_MS = 1000
/** Cuánto antes de que caduque el token se pide uno nuevo. */
export const MARGEN_DEL_TOKEN_MS = 60_000
export const MAX_REINTENTOS_429 = 3
const ESPERA_429_MS = 1_200

/** El entorno elegido: `production` solo si se pide expresamente; cualquier otra cosa es sandbox. */
export function entornoDeCivitatis(valor = process.env.CIVITATIS_API_ENV) {
  return String(valor ?? '').trim().toLowerCase() === 'production' ? 'production' : 'sandbox'
}

/** ¿Está encendida la API en la app? Apagada salvo `CIVITATIS_API_ACTIVA=true` (es el interruptor del servidor; el de la app es `VITE_CIVITATIS_ACTIVA`). */
export function civitatisActiva(valor = process.env.CIVITATIS_API_ACTIVA) {
  return String(valor ?? '').trim().toLowerCase() === 'true'
}

/**
 * Quién puede usar la API en la app: `CIVITATIS_API_ACTIVA=true` → 'todos'; `=admin` → 'admin' (solo los emails de LOGROS_ADMIN_EMAILS, lo decide el servidor por petición);
 * cualquier otra cosa (vacío, false…) → 'nadie'.
 */
export function modoDeCivitatis(valor = process.env.CIVITATIS_API_ACTIVA) {
  const v = String(valor ?? '').trim().toLowerCase()
  return v === 'true' ? 'todos' : v === 'admin' ? 'admin' : 'nadie'
}

const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * @param {{ usuario?: string, clave?: string, entorno?: 'sandbox'|'production', fetch?: typeof fetch, ahora?: () => number, esperar?: (ms:number)=>Promise<void>, peticionesPorSegundo?: number }} [opciones]
 */
export function crearClienteCivitatis(opciones = {}) {
  const usuario = opciones.usuario ?? process.env.CIVITATIS_API_USER
  const clave = opciones.clave ?? process.env.CIVITATIS_API_PASSWORD
  const entorno = opciones.entorno ?? entornoDeCivitatis()
  const base = URL_BASE[entorno]
  const llamar = opciones.fetch ?? globalThis.fetch
  const ahora = opciones.ahora ?? (() => Date.now())
  const esperar = opciones.esperar ?? dormir
  const porSegundo = Math.max(1, opciones.peticionesPorSegundo ?? PETICIONES_POR_SEGUNDO)
  const ventana = Math.max(10, opciones.ventanaMs ?? VENTANA_MS)

  let token = null
  let caducaEn = 0
  let entrando = null
  const contador = { peticiones: 0, entradas: 0, reintentos429: 0 }

  // El ritmo: como mucho `porSegundo` peticiones por cada segundo (ventana deslizante).
  const instantes = []
  async function esperarTurno() {
    for (;;) {
      const t = ahora()
      while (instantes.length > 0 && t - instantes[0] >= ventana) instantes.shift()
      if (instantes.length < porSegundo) {
        instantes.push(t)
        return
      }
      await esperar(Math.max(5, ventana - (t - instantes[0])))
    }
  }

  const sinClaves = !usuario || !clave

  /** Entra (o devuelve el token que vale). Una sola entrada a la vez aunque lleguen varias peticiones juntas. */
  async function asegurarToken() {
    if (token && ahora() < caducaEn - MARGEN_DEL_TOKEN_MS) return { ok: true }
    if (sinClaves) return { ok: false, motivo: 'sin_claves' }
    if (!entrando) {
      entrando = (async () => {
        try {
          await esperarTurno()
          contador.entradas++
          const respuesta = await llamar(`${base}/auth`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ username: usuario, password: clave }) })
          if (!respuesta.ok) return { ok: false, motivo: respuesta.status === 401 || respuesta.status === 403 ? 'no_autorizado' : 'no_disponible', estado: respuesta.status }
          const cuerpo = await respuesta.json().catch(() => null)
          if (!cuerpo?.token) return { ok: false, motivo: 'respuesta_rara' }
          token = String(cuerpo.token)
          const caduca = Date.parse(cuerpo.expiresIn)
          caducaEn = Number.isFinite(caduca) ? caduca : ahora() + 30 * 60_000
          return { ok: true }
        } catch {
          return { ok: false, motivo: 'no_disponible' }
        } finally {
          entrando = null
        }
      })()
    }
    return entrando
  }

  /**
   * Una petición a la API. `ruta` empieza por «/». `consulta` se añade a la dirección; `cuerpo` (si hay) se manda como JSON (POST).
   * Devuelve { ok: true, estado, datos, cabeceras } o { ok: false, motivo, estado? }. Nunca lanza.
   */
  async function pedir(ruta, { metodo = 'GET', consulta = null, cuerpo = null } = {}) {
    const url = new URL(`${base}${ruta}`)
    for (const [clave2, valor] of Object.entries(consulta ?? {})) if (valor !== undefined && valor !== null) url.searchParams.set(clave2, String(valor))
    for (let intento = 0; intento <= MAX_REINTENTOS_429; intento++) {
      const entrada = await asegurarToken()
      if (!entrada.ok) return entrada
      await esperarTurno()
      contador.peticiones++
      let respuesta
      try {
        respuesta = await llamar(url.toString(), {
          method: metodo,
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(cuerpo ? { 'Content-Type': 'application/json' } : {}) },
          ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
        })
      } catch {
        return { ok: false, motivo: 'no_disponible' }
      }
      if (respuesta.status === 429) {
        if (intento === MAX_REINTENTOS_429) return { ok: false, motivo: 'demasiadas_peticiones', estado: 429 }
        contador.reintentos429++
        await esperar(ESPERA_429_MS * (intento + 1))
        continue
      }
      if (respuesta.status === 401) {
        // El token ya no vale (caducó antes de lo previsto): se pide otro y se reintenta una vez.
        token = null
        caducaEn = 0
        if (intento === MAX_REINTENTOS_429) return { ok: false, motivo: 'no_autorizado', estado: 401 }
        continue
      }
      if (respuesta.status === 204) return { ok: true, estado: 204, datos: null, cabeceras: respuesta.headers }
      if (respuesta.status === 404) return { ok: false, motivo: 'no_encontrado', estado: 404 }
      if (!respuesta.ok) return { ok: false, motivo: respuesta.status === 406 ? 'bloqueado' : 'no_disponible', estado: respuesta.status }
      const datos = await respuesta.json().catch(() => undefined)
      if (datos === undefined) return { ok: false, motivo: 'respuesta_rara', estado: respuesta.status }
      return { ok: true, estado: respuesta.status, datos, cabeceras: respuesta.headers }
    }
    return { ok: false, motivo: 'no_disponible' }
  }

  return { pedir, entorno, base, contador, tieneClaves: !sinClaves, tokenVigente: () => Boolean(token) && ahora() < caducaEn - MARGEN_DEL_TOKEN_MS }
}
