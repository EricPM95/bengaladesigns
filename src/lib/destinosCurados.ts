import { useEffect, useState } from 'react'
import type { Place } from './types'

/**
 * Los destinos curados de verdad (Tanda 10, la primera pantalla): los que salen como pines en el mapa y los únicos que se pueden elegir de DESTINO. Salen de los datos del
 * servidor (`GET /api/destinos-curados`: días escritos, datos del destino, logros con pase y su pin), no de una lista del móvil. Hoy, solo Roma; cuando haya otro, sale solo.
 */
export interface DestinoCurado {
  clave: string
  nombre: string
  pais: string
  /** El país en minúsculas (para la bandera), o null. */
  iso: string | null
  lat: number
  lng: number
}

let lista: Promise<DestinoCurado[]> | null = null

const valido = (d: unknown): d is DestinoCurado => {
  const x = d as Partial<DestinoCurado> | null
  return Boolean(x) && typeof x!.clave === 'string' && typeof x!.nombre === 'string' && typeof x!.lat === 'number' && typeof x!.lng === 'number'
}

/** Solo en desarrollo: `window.__destinosCurados = [...]` pone una lista de prueba (para las capturas y las pruebas, con un destino curado «de mentira»). */
const deLaPrueba = (): DestinoCurado[] | null => {
  if (!import.meta.env.DEV) return null
  const w = (window as unknown as { __destinosCurados?: unknown }).__destinosCurados
  return Array.isArray(w) ? w.filter(valido) : null
}

/** La lista de destinos curados (una sola petición por carga). Si el servidor no contesta, lista vacía: el mapa sale sin pines y no se rompe nada. */
export function cargarDestinosCurados(): Promise<DestinoCurado[]> {
  const prueba = deLaPrueba()
  if (prueba) return Promise.resolve(prueba)
  lista ??= fetch('/api/destinos-curados')
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { destinos?: unknown[] } | null) => (Array.isArray(j?.destinos) ? j!.destinos.filter(valido) : []))
    .catch(() => [])
  return lista
}

/** Para las pruebas: olvida la lista guardada. */
export const olvidarDestinosCurados = (): void => {
  lista = null
}

export function useDestinosCurados(): DestinoCurado[] | null {
  const [destinos, setDestinos] = useState<DestinoCurado[] | null>(null)
  useEffect(() => {
    let vivo = true
    void cargarDestinosCurados().then((d) => vivo && setDestinos(d))
    return () => {
      vivo = false
    }
  }, [])
  return destinos
}

/** El lugar que usa el formulario para un destino curado (como lo daría el buscador). */
export const lugarDeDestino = (d: DestinoCurado): Place => ({
  name: d.nombre,
  fullName: d.pais ? `${d.nombre}, ${d.pais}` : d.nombre,
  coordinates: { lat: d.lat, lng: d.lng },
  countryCode: d.iso,
})

/** ¿Es este lugar uno de nuestros destinos? (Mismo nombre y casi la misma posición.) */
export const esDestinoCurado = (lugar: Place | null | undefined, destinos: DestinoCurado[] | null): DestinoCurado | null => {
  if (!lugar || !destinos) return null
  return destinos.find((d) => d.nombre === lugar.name && Math.abs(d.lat - lugar.coordinates.lat) < 0.5 && Math.abs(d.lng - lugar.coordinates.lng) < 0.5) ?? null
}

/** Sin mayúsculas ni tildes (para buscar «Tókio» escribiendo «tokio»). */
export const sinTildes = (t: string): string =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

/* ------------------------------------------------------------------ */
/* El aviso «avísame cuando llegue» de un destino que aún no tenemos    */
/* ------------------------------------------------------------------ */

export const TEXTO_NO_GUARDADO = 'No hemos podido guardarlo. Inténtalo más tarde.'

// (El cliente de Supabase se pide solo cuando hace falta —al escribir el email o al pedir el aviso—, para que no entre en lo que pesa la app al abrir.)
const clienteSupabase = async () => (await import('./supabaseClient')).supabase

/** El email de la cuenta (si la tiene), para que el campo ya venga puesto. Las sesiones anónimas no tienen. */
export async function emailDeMiCuenta(): Promise<string> {
  try {
    const sesion = (await (await clienteSupabase())?.auth.getSession())?.data.session
    return sesion?.user?.is_anonymous ? '' : (sesion?.user?.email ?? '')
  } catch {
    return ''
  }
}

/** Pide que le avisemos de ese destino. Devuelve `null` si se guardó (o ya estaba guardado), o el texto que hay que enseñar si no se pudo. Nunca lanza. */
export async function pedirAvisoDeDestino(destino: string, email: string): Promise<string | null> {
  try {
    const sesion = (await (await clienteSupabase())?.auth.getSession())?.data.session
    const idioma = (typeof navigator !== 'undefined' ? navigator.language : 'es').slice(0, 2).toLowerCase()
    const r = await fetch('/api/avisos-destino', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(sesion?.access_token ? { Authorization: `Bearer ${sesion.access_token}` } : {}) },
      body: JSON.stringify({ destino, email, idioma }),
    })
    if (r.ok) return null
    const j = (await r.json().catch(() => null)) as { error?: string } | null
    // Un error de lo que se ha escrito (el email) se dice tal cual; todo lo demás, el texto de siempre.
    return r.status === 400 && j?.error ? j.error : TEXTO_NO_GUARDADO
  } catch {
    return TEXTO_NO_GUARDADO
  }
}
