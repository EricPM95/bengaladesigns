/**
 * El servidor de mentira de las preguntas de la primera vez (V31; SOLO desarrollo, `?logrosDemo=1`). Guarda lo mismo que el servidor de verdad (solo frecuencia, con quién y año; el ritmo y los gustos se descartan).
 * `window.__demoPrimeraVez` enseña lo guardado y deja ponerlo a mano (para las pruebas).
 */
import { franjaDeAnio, franjaValida } from '../../server/franjaEdad.js'

const FRECUENCIAS = ['una_vez_al_anio', 'dos_o_tres', 'cuatro_o_mas']
const COMPANIAS = ['a_mi_aire', 'pareja', 'familia', 'amigos']

const yaHecha = (): boolean => {
  try {
    return window.localStorage.getItem('trazo:demo:primera_vez_hecha') === 'si'
  } catch {
    return false
  }
}
const nueva = (): boolean => {
  try {
    return window.localStorage.getItem('trazo:demo:primera_vez_nueva') === 'si'
  } catch {
    return false
  }
}

/** Por defecto el viajero de la demo ya las contestó (así las demás pruebas no las ven); para ver las preguntas: `localStorage['trazo:demo:primera_vez_nueva'] = 'si'` antes de abrir. */
export const demoPrimeraVez: { hecho: boolean; frecuencia: string | null; compania: string | null; franja_edad: string | null; pais_vive: string | null; sueno: { tipo: string; nombre: string; iso: string } | null; suenos_disponibles: boolean; suenos: unknown[]; guardados: number; ultimo: Record<string, unknown> | null; avisos: { destino: string; email: string }[]; usos: Record<string, unknown>[]; paises: unknown[] } = {
  hecho: typeof window === 'undefined' ? true : !nueva() || yaHecha(),
  frecuencia: null,
  compania: null,
  franja_edad: null,
  pais_vive: null,
  // (V39) El viaje de sus sueños (pregunta 3 y Ajustes). `suenos_disponibles` false = como un servidor sin la migración 0093 (la pregunta no sale): `localStorage['trazo:demo:sin_suenos'] = 'si'`.
  sueno: null,
  suenos_disponibles: typeof window === 'undefined' ? true : (() => { try { return window.localStorage.getItem('trazo:demo:sin_suenos') !== 'si' } catch { return true } })(),
  suenos: [],
  guardados: 0,
  ultimo: null,
  avisos: [],
  // (V35B) Lo que ha mandado la app a /api/uso (una vez al día) y los cambios de país de Ajustes.
  usos: [],
  paises: [],
}
if (typeof window !== 'undefined') (window as unknown as { __demoPrimeraVez: typeof demoPrimeraVez }).__demoPrimeraVez = demoPrimeraVez

/** Como el servidor: un sueño válido ({ tipo, nombre, iso }) o nada. */
const suenoValido = (v: unknown): { tipo: string; nombre: string; iso: string } | null => {
  const s = v as { tipo?: string; nombre?: string; iso?: string } | null
  const nombre = String(s?.nombre ?? '').replace(/\s+/g, ' ').trim()
  const iso = String(s?.iso ?? '').toLowerCase()
  return s && (s.tipo === 'pais' || s.tipo === 'destino') && nombre.length >= 2 && nombre.length <= 80 && /^[a-z]{2}$/.test(iso) ? { tipo: s.tipo, nombre, iso } : null
}

export function responder(ruta: string, _url: URL, c: Record<string, unknown>, opciones: { metodo?: string; cuerpo?: unknown }): unknown {
  // Sin la marca de «cuenta nueva», el servidor de la demo no tiene nada que decir (como un servidor sin la migración): así las demás pruebas no ven ni las preguntas ni el Perfil con el mapa.
  if (ruta === '/api/primera-vez' && (opciones.metodo ?? 'GET') === 'GET' && !nueva()) return { ok: false }
  if (ruta === '/api/primera-vez' && (opciones.metodo ?? 'GET') === 'GET') return { ok: true, hecho: demoPrimeraVez.hecho, frecuencia: demoPrimeraVez.frecuencia, compania: demoPrimeraVez.compania, franja_edad: demoPrimeraVez.franja_edad, pais_vive: demoPrimeraVez.pais_vive, suenos_disponibles: demoPrimeraVez.suenos_disponibles, sueno: demoPrimeraVez.sueno }
  if (ruta === '/api/uso') {
    demoPrimeraVez.usos.push({ ...c })
    return { ok: true, guardado: true }
  }
  // (V35B) El país de Ajustes: GET lo lee y PUT lo cambia (solo el país).
  if (ruta === '/api/primera-vez/pais') {
    if ((opciones.metodo ?? 'GET') === 'GET') return { ok: true, pais_vive: demoPrimeraVez.pais_vive }
    demoPrimeraVez.paises.push(c.pais_vive ?? null)
    demoPrimeraVez.pais_vive = /^[A-Za-z]{2}$/.test(String(c.pais_vive ?? '')) ? String(c.pais_vive).toUpperCase() : null
    return { ok: true, guardado: true }
  }
  // (V39) El viaje de sus sueños de Ajustes: GET lo lee y PUT lo cambia (solo eso).
  if (ruta === '/api/primera-vez/sueno') {
    if ((opciones.metodo ?? 'GET') === 'GET') return { ok: true, sueno: demoPrimeraVez.sueno, disponible: demoPrimeraVez.suenos_disponibles }
    demoPrimeraVez.suenos.push(c.sueno ?? null)
    if (!demoPrimeraVez.suenos_disponibles) return { ok: true, guardado: false }
    demoPrimeraVez.sueno = suenoValido(c.sueno)
    return { ok: true, guardado: true }
  }
  if (ruta === '/api/primera-vez') {
    demoPrimeraVez.hecho = true
    demoPrimeraVez.ultimo = { ...c }
    try {
      window.localStorage.setItem('trazo:demo:primera_vez_hecha', 'si')
    } catch {
      /* sin almacenamiento */
    }
    demoPrimeraVez.guardados += 1
    demoPrimeraVez.frecuencia = FRECUENCIAS.includes(String(c.frecuencia)) ? String(c.frecuencia) : null
    demoPrimeraVez.compania = COMPANIAS.includes(String(c.compania)) ? String(c.compania) : null
    // (V41) Como el servidor: una de las seis franjas (o la que sale de un año de nacimiento de una app vieja).
    demoPrimeraVez.franja_edad = franjaValida(c.franja_edad) ?? franjaDeAnio(c.anio_nacimiento)
    demoPrimeraVez.pais_vive = /^[A-Za-z]{2}$/.test(String(c.pais_vive ?? '')) ? String(c.pais_vive).toUpperCase() : null
    if (demoPrimeraVez.suenos_disponibles) demoPrimeraVez.sueno = suenoValido(c.sueno)
    return { ok: true }
  }
  if (ruta === '/api/avisos-destino') {
    demoPrimeraVez.avisos.push({ destino: String(c.destino ?? ''), email: String(c.email ?? '') })
    return { ok: true }
  }
  return undefined
}
