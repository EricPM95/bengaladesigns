import { demoActivo } from './logros'
import { supabase } from './supabaseClient'

/**
 * Llamadas al servidor con la cuenta (cuentas parte 3): lo mismo que `llamar` de los logros, pero devolviendo también el ESTADO y el cuerpo cuando algo sale mal (un 409
 * «ya tienes el pase», un 503 «el cobro no está listo»…), que la pantalla necesita para decirlo en palabras sencillas. En el modo demo de desarrollo (`?logrosDemo=1`) contesta el servidor
 * de mentira (src/lib/logrosDemo*.ts), sin red.
 */
export interface RespuestaDelServidor<T> {
  estado: number
  datos: T | null
}

export async function tokenDeLaCuenta(): Promise<string | null> {
  try {
    return (await supabase?.auth.getSession())?.data.session?.access_token ?? null
  } catch {
    return null
  }
}

export async function llamarServidor<T = Record<string, unknown>>(ruta: string, opciones: { metodo?: string; cuerpo?: unknown; sinCuenta?: boolean } = {}): Promise<RespuestaDelServidor<T>> {
  if (import.meta.env.DEV && demoActivo()) {
    const demo = await import('./logrosDemo')
    const datos = (await demo.responder(ruta, { metodo: opciones.metodo, cuerpo: opciones.cuerpo })) as (T & { ok?: boolean; estado?: number }) | null
    return { estado: datos == null ? 503 : (datos.estado ?? (datos.ok === false ? 400 : 200)), datos }
  }
  try {
    const cab: Record<string, string> = { 'Content-Type': 'application/json' }
    if (!opciones.sinCuenta) {
      const token = await tokenDeLaCuenta()
      if (!token) return { estado: 401, datos: null }
      cab.Authorization = `Bearer ${token}`
    }
    const r = await fetch(ruta, { method: opciones.metodo ?? (opciones.cuerpo ? 'POST' : 'GET'), headers: cab, body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined })
    return { estado: r.status, datos: (await r.json().catch(() => null)) as T | null }
  } catch {
    return { estado: 0, datos: null }
  }
}

/**
 * Abre una dirección de fuera en esta pestaña (la página de pago, el recibo). Un enlace de verdad, no `location`: así pasa igual que cualquier otro enlace de la app
 * (`target="_blank"` para el recibo; la página de pago se abre en la misma pestaña y vuelve a la app al terminar).
 */
export function abrirEnlace(url: string, { nuevaPestana = false }: { nuevaPestana?: boolean } = {}): void {
  try {
    const a = document.createElement('a')
    a.href = url
    a.rel = 'noopener noreferrer'
    if (nuevaPestana) a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    a.remove()
  } catch {
    /* sin ventana (pruebas en el servidor): nada que abrir */
  }
}
