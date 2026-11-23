/**
 * (V41) LOS NOMBRES DEL GLOBO «¿A DÓNDE TE APETECE IR?» NUNCA SE PISAN. Funciones PURAS (sin pantalla, sin Mapbox): dadas las posiciones en pantalla de los destinos a un zoom, dicen qué nombres se ven y de qué lado
 * va cada uno. Si dos están tan cerca que sus nombres se pisarían, se ve uno y el otro sale al acercar (a más zoom se separan en pantalla). Se prueban sin navegador (`pruebaV41_globo`).
 *   · Prioridad (la de Design): tu viaje > listo > ya has estado > próximamente. A igual prioridad gana el que está más cerca del centro del globo.
 *   · Un nombre va a la derecha de su pin; si por ahí se sale de la pantalla o pisa a otro, a la izquierda; si tampoco cabe, no se ve (hasta que se acerque).
 *   · Un nombre tampoco tapa NINGÚN pin (ni el de otro destino ni el suyo), ni se mete debajo de la hoja de abajo.
 */
export interface PuntoDeEtiqueta {
  clave: string
  nombre: string
  /** Posición del pin en pantalla (px). */
  x: number
  y: number
  /** ¿Está en la cara visible del globo? (`enLaCara`). */
  visible: boolean
  /** 0 = la que más manda (ver `prioridadDeDestino`). */
  prioridad: number
}
export interface VistaDeEtiquetas {
  ancho: number
  alto: number
  /** Alto que tapa la hoja de abajo (px): ningún nombre se coloca ahí. */
  abajo: number
  /** Arriba, margen que no se usa (botón de cerrar, etc.). */
  arriba?: number
  /** Centro del globo en pantalla (para desempatar). Por defecto, el centro de la parte libre. */
  cx?: number
  cy?: number
}
export interface EtiquetaColocada {
  clave: string
  lado: 'der' | 'izq'
  /** Caja del nombre en pantalla: [x0, y0, x1, y1]. */
  caja: [number, number, number, number]
}
export interface OpcionesDeEtiquetas {
  /** Mide el nombre de verdad (p. ej. con un canvas); si no, una estimación por letras. */
  medir?: (nombre: string) => number
  /** Distancia del pin al nombre (px). */
  separacion?: number
  /** Alto de la caja del nombre (px). */
  altoDeLetra?: number
  /** Radio que ocupa un pin (px), con su aro. */
  radioDePin?: number
  /** Holgura mínima entre dos nombres (px). */
  holgura?: number
}

/** Prioridad de un destino: 0 tu viaje, 1 listo, 2 ya has estado, 3 próximamente. */
export function prioridadDeDestino(d: { listo: boolean; estuvo?: boolean; conViaje?: boolean }): number {
  if (!d.listo) return 3
  if (d.conViaje) return 0
  if (d.estuvo) return 2
  return 1
}

/** Ancho aproximado (px) de un nombre en Geist 600 11.5 px. */
export const anchoEstimado = (nombre: string): number => nombre.length * 6.5 + 8

const rad = (g: number) => (g * Math.PI) / 180
/** Coseno de la distancia angular entre dos puntos de la esfera (1 = el mismo punto, 0 = a 90°, negativo = al otro lado). */
export function cosDistancia(lng0: number, lat0: number, lng1: number, lat1: number): number {
  return Math.sin(rad(lat0)) * Math.sin(rad(lat1)) + Math.cos(rad(lat0)) * Math.cos(rad(lat1)) * Math.cos(rad(lng1 - lng0))
}
/** ¿Está este punto en la cara visible del globo, mirando al centro dado? (Cerca del borde se aplasta: se descarta un poco antes de los 90°.) */
export const enLaCara = (centro: { lng: number; lat: number }, lng: number, lat: number, minimo = 0.2): boolean => cosDistancia(centro.lng, centro.lat, lng, lat) > minimo

const seCruzan = (a: readonly number[], b: readonly number[], h = 0): boolean => !(a[2] + h <= b[0] || a[0] >= b[2] + h || a[3] + h <= b[1] || a[1] >= b[3] + h)

/** Qué nombres se ven y de qué lado (los demás no se pintan). Ninguna caja pisa a otra, ni a un pin, ni se sale de la pantalla. */
export function etiquetasVisibles(puntos: PuntoDeEtiqueta[], vista: VistaDeEtiquetas, o: OpcionesDeEtiquetas = {}): EtiquetaColocada[] {
  const sep = o.separacion ?? 13
  const alto = o.altoDeLetra ?? 16
  const rPin = o.radioDePin ?? 11
  const holgura = o.holgura ?? 3
  const medir = o.medir ?? anchoEstimado
  const arriba = vista.arriba ?? 0
  const limiteAbajo = vista.alto - vista.abajo
  const cx = vista.cx ?? vista.ancho / 2
  const cy = vista.cy ?? arriba + (limiteAbajo - arriba) / 2
  const enPantalla = puntos.filter((p) => p.visible && p.x >= -rPin && p.x <= vista.ancho + rPin && p.y >= arriba - rPin && p.y <= limiteAbajo + rPin)
  const pines = enPantalla.map((p) => ({ clave: p.clave, caja: [p.x - rPin, p.y - rPin, p.x + rPin, p.y + rPin] as const }))
  const orden = enPantalla.slice().sort((a, b) => a.prioridad - b.prioridad || Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy) || a.clave.localeCompare(b.clave))
  const puestas: EtiquetaColocada[] = []
  for (const p of orden) {
    const w = medir(p.nombre)
    for (const lado of ['der', 'izq'] as const) {
      const x0 = lado === 'der' ? p.x + sep : p.x - sep - w
      const caja: [number, number, number, number] = [x0, p.y - alto / 2, x0 + w, p.y + alto / 2]
      const dentro = caja[0] >= 6 && caja[2] <= vista.ancho - 6 && caja[1] >= arriba && caja[3] <= limiteAbajo - 2
      if (!dentro) continue
      if (puestas.some((q) => seCruzan(caja, q.caja, holgura))) continue
      if (pines.some((q) => q.clave !== p.clave && seCruzan(caja, q.caja))) continue
      puestas.push({ clave: p.clave, lado, caja })
      break
    }
  }
  return puestas
}

/** El destino cuyo pin está más cerca de un toque (a menos de `radio` px), o null. A igual cercanía, el de más prioridad. */
export function pinMasCercano(puntos: PuntoDeEtiqueta[], x: number, y: number, radio = 24): string | null {
  let mejor: { clave: string; d: number; prioridad: number } | null = null
  for (const p of puntos) {
    if (!p.visible) continue
    const d = Math.hypot(p.x - x, p.y - y)
    if (d > radio) continue
    if (!mejor || d < mejor.d - 2 || (Math.abs(d - mejor.d) <= 2 && p.prioridad < mejor.prioridad)) mejor = { clave: p.clave, d, prioridad: p.prioridad }
  }
  return mejor?.clave ?? null
}
