/**
 * (V35B) LOS «PRÓXIMAMENTE» DEL MAPA, desde la base de datos. El mapa de «¿A dónde te apetece ir?» enseña en gris los destinos en Próximamente. Hasta la V35 salían de data/primera_vez/destinos.json; ahora los puede cambiar Eric
 * desde el panel (tabla `destinos_proximamente`, migración 0091) y la app los pide a `GET /api/destinos-proximamente`. Si la tabla no existe todavía (0091 sin aplicar), o el servidor no contesta, la app sigue con el JSON como siempre.
 */
export interface FilaProximamente {
  clave: string
  nombre: string
  pais: string
  iso: string
  continente: string
  lat: number
  lng: number
}

let delServidor: FilaProximamente[] | null = null
let pedida: Promise<void> | null = null

const valida = (d: unknown): d is FilaProximamente => {
  const x = d as Partial<FilaProximamente> | null
  return Boolean(x) && typeof x!.clave === 'string' && typeof x!.nombre === 'string' && typeof x!.lat === 'number' && typeof x!.lng === 'number'
}

/** Solo en desarrollo: `window.__proximamente = [...]` pone una lista de prueba. */
const deLaPrueba = (): FilaProximamente[] | null => {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null
  const w = (window as unknown as { __proximamente?: unknown }).__proximamente
  return Array.isArray(w) ? w.filter(valida) : null
}

/** La lista del servidor, si ya llegó (null = todavía no, o no hay base: se usa el JSON). */
export const proximamenteDelServidor = (): FilaProximamente[] | null => deLaPrueba() ?? delServidor

/** Pide la lista una sola vez por carga. Nunca falla: ante cualquier problema se queda con el JSON. */
export function cargarProximamente(): Promise<void> {
  if (deLaPrueba()) return Promise.resolve()
  pedida ??= fetch('/api/destinos-proximamente')
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { origen?: string; destinos?: unknown[] } | null) => {
      if (j?.origen === 'base' && Array.isArray(j.destinos)) delServidor = j.destinos.filter(valida)
    })
    .catch(() => undefined)
  return pedida
}

/** Para las pruebas: olvida lo guardado. */
export const olvidarProximamente = (): void => {
  delServidor = null
  pedida = null
}
