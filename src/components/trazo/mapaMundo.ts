/**
 * El mapa del mundo de la primera pantalla (Tanda 10, `Piezas/Primera Pantalla` de Design): proyección de Mercator en un cuadrado de 2400 unidades y la silueta de la tierra de
 * `tierra110.json` (world-atlas 110 m, que ya va DENTRO de la app: para dibujar el mapa no se pide nada a internet). Funciones puras, sin React: se prueban con una prueba normal.
 */
export const LADO = 2400

/** De longitud y latitud (grados) al cuadrado del mapa, en Mercator. */
export const proyectar = (lng: number, lat: number): [number, number] => [((lng + 180) / 360) * LADO, ((1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2) * LADO]

/** `tierra110.json`: por país (o isla), una lista de anillos; cada anillo, [lng, lat, lng, lat, …] en décimas de grado. */
export type TierraCruda = Record<string, number[][]>

const LAT_MIN = -75
const LAT_MAX = 80

/**
 * El trazado SVG de toda la tierra. Se salta la Antártida (todo por debajo de 58° sur), recorta la latitud donde Mercator se dispara y, donde un anillo cruza el antimeridiano
 * (un salto de más de media vuelta), lo corta en dos para que no cruce el mapa de lado a lado.
 */
export function trazadoDeLaTierra(tierra: TierraCruda): string {
  let d = ''
  for (const anillos of Object.values(tierra)) {
    for (const a of anillos) {
      const n = Math.floor(a.length / 2)
      if (n < 3) continue
      let hayAlgoAlNorte = false
      for (let i = 0; i < n; i++) if (a[2 * i + 1] / 10 >= -58) hayAlgoAlNorte = true
      if (!hayAlgoAlNorte) continue
      const piezas: [number, number][][] = [[]]
      let anterior: [number, number] | null = null
      for (let i = 0; i < n; i++) {
        const p = proyectar(a[2 * i] / 10, Math.max(LAT_MIN, Math.min(LAT_MAX, a[2 * i + 1] / 10)))
        if (anterior && Math.abs(p[0] - anterior[0]) > LADO / 2) piezas.push([])
        piezas[piezas.length - 1].push(p)
        anterior = p
      }
      if (piezas.length > 1) {
        const ultima = piezas.pop()!
        piezas[0] = ultima.concat(piezas[0])
      }
      for (const z of piezas) if (z.length > 2) d += 'M' + z.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L') + 'Z'
    }
  }
  return d
}

let tierraListo: Promise<string> | null = null

/** La silueta de la tierra, ya trazada. Va en su propio trozo (84 KB aparte): solo se baja al abrir la primera pantalla. */
export function cargarTierraDelMapa(): Promise<string> {
  tierraListo ??= import('../logros/pantallas/mundo/tierra110.json').then((m) => trazadoDeLaTierra(m.default as unknown as TierraCruda))
  return tierraListo
}

export interface Camara {
  cx: number
  cy: number
  /** Cuántas unidades del mapa caben a lo ancho. Menos = más cerca. */
  span: number
}

/** Cómo encuadrar dos puntos del mapa (origen y destino) a la vez. `alto`/`ancho` son los de la pantalla. */
export function encuadrar(o: [number, number], d: [number, number], ancho: number, alto: number): Camara {
  const dx = Math.abs(o[0] - d[0])
  const dy = Math.abs(o[1] - d[1])
  return { cx: (o[0] + d[0]) / 2, cy: (o[1] + d[1]) / 2, span: Math.max(130, dx * 1.9, (dy * 1.9 * ancho) / (alto * 0.66)) }
}

/** Un punto (x, y) del mapa en la pantalla, para una cámara. */
export const aPantalla = (p: [number, number], c: Camara, ancho: number, anclaY: number): [number, number] => {
  const k = ancho / c.span
  return [(p[0] - c.cx) * k + ancho / 2, (p[1] - c.cy) * k + anclaY]
}

/** La curva entre origen y destino (curvada hacia arriba), con el punto de control. */
export function curvaEntre(o: [number, number], d: [number, number]): { c: [number, number] } {
  const mx = (o[0] + d[0]) / 2
  const my = (o[1] + d[1]) / 2
  const L = Math.hypot(d[0] - o[0], d[1] - o[1]) || 1
  let nx = -(d[1] - o[1]) / L
  let ny = (d[0] - o[0]) / L
  if (ny > 0) {
    nx = -nx
    ny = -ny
  }
  return { c: [mx + nx * L * 0.28, my + ny * L * 0.28] }
}
