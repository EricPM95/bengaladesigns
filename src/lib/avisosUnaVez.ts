/**
 * V43 §6: cada aviso de HOY sale UNA vez por viaje, día y sitio, aunque se cambie de pestaña (HOY → DÍAS → HOY) o se cierre la app.
 * Antes `anunciadas` era un `useRef` y se borraba al desmontar HOY: «Panteón ya ha cerrado…» se repetía cada vez.
 * Se guarda en el móvil (localStorage): 0 KB de red. Una clave por viaje+día, con la lista de ids ya dichos (unos pocos bytes).
 */
const clave = (rutaId: string, dateIso: string) => `jutrip:avisos-dichos:${rutaId}:${dateIso}`

export function leerDichos(rutaId: string, dateIso: string): Set<string> {
  try {
    const t = window.localStorage.getItem(clave(rutaId, dateIso))
    return new Set(t ? (JSON.parse(t) as string[]) : [])
  } catch {
    return new Set()
  }
}

/** ¿Ya salió este aviso hoy? */
export const yaDicho = (rutaId: string, dateIso: string, id: string): boolean => leerDichos(rutaId, dateIso).has(id) || memoria.has(`${rutaId}|${dateIso}|${id}`)

/** Lo apunta como dicho (se llama cuando el aviso ya se ha visto, no antes: si HOY se vuelve a montar antes de pintarlo, no se pierde). */
export const marcarDicho = (rutaId: string, dateIso: string, id: string): void => void primeraVez(rutaId, dateIso, id)

/** Devuelve `true` la PRIMERA vez que se pide ese aviso (y lo apunta); `false` si ya salió hoy. */
export function primeraVez(rutaId: string, dateIso: string, id: string): boolean {
  const dichos = leerDichos(rutaId, dateIso)
  if (dichos.has(id)) return false
  dichos.add(id)
  try {
    window.localStorage.setItem(clave(rutaId, dateIso), JSON.stringify([...dichos].slice(-80)))
  } catch {
    /* sin almacenamiento: al menos no se repite dentro de esta sesión */
    memoria.add(`${rutaId}|${dateIso}|${id}`)
  }
  return true
}
const memoria = new Set<string>()
