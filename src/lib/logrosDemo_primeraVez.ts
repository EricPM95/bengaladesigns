/**
 * El servidor de mentira de las preguntas de la primera vez (V31; SOLO desarrollo, `?logrosDemo=1`). Guarda lo mismo que el servidor de verdad (solo frecuencia, con quién y año; el ritmo y los gustos se descartan).
 * `window.__demoPrimeraVez` enseña lo guardado y deja ponerlo a mano (para las pruebas).
 */
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
export const demoPrimeraVez: { hecho: boolean; frecuencia: string | null; compania: string | null; anio_nacimiento: number | null; pais_vive: string | null; guardados: number; ultimo: Record<string, unknown> | null; avisos: { destino: string; email: string }[]; usos: Record<string, unknown>[]; paises: unknown[] } = {
  hecho: typeof window === 'undefined' ? true : !nueva() || yaHecha(),
  frecuencia: null,
  compania: null,
  anio_nacimiento: null,
  pais_vive: null,
  guardados: 0,
  ultimo: null,
  avisos: [],
  // (V35B) Lo que ha mandado la app a /api/uso (una vez al día) y los cambios de país de Ajustes.
  usos: [],
  paises: [],
}
if (typeof window !== 'undefined') (window as unknown as { __demoPrimeraVez: typeof demoPrimeraVez }).__demoPrimeraVez = demoPrimeraVez

export function responder(ruta: string, _url: URL, c: Record<string, unknown>, opciones: { metodo?: string; cuerpo?: unknown }): unknown {
  // Sin la marca de «cuenta nueva», el servidor de la demo no tiene nada que decir (como un servidor sin la migración): así las demás pruebas no ven ni las preguntas ni el Perfil con el mapa.
  if (ruta === '/api/primera-vez' && (opciones.metodo ?? 'GET') === 'GET' && !nueva()) return { ok: false }
  if (ruta === '/api/primera-vez' && (opciones.metodo ?? 'GET') === 'GET') return { ok: true, hecho: demoPrimeraVez.hecho, frecuencia: demoPrimeraVez.frecuencia, compania: demoPrimeraVez.compania, anio_nacimiento: demoPrimeraVez.anio_nacimiento, pais_vive: demoPrimeraVez.pais_vive }
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
  if (ruta === '/api/primera-vez') {
    const anio = Number(c.anio_nacimiento)
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
    demoPrimeraVez.anio_nacimiento = Number.isInteger(anio) && anio >= 1920 && anio <= new Date().getFullYear() ? anio : null
    demoPrimeraVez.pais_vive = /^[A-Za-z]{2}$/.test(String(c.pais_vive ?? '')) ? String(c.pais_vive).toUpperCase() : null
    return { ok: true }
  }
  if (ruta === '/api/avisos-destino') {
    demoPrimeraVez.avisos.push({ destino: String(c.destino ?? ''), email: String(c.email ?? '') })
    return { ok: true }
  }
  return undefined
}
