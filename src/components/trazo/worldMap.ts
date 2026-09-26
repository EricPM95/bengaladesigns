/**
 * El mapa del mundo del formulario Trazo (prototipo "Trazo App" de Claude Design): proyección
 * equirectangular 4 px por grado y la silueta de la tierra de world-atlas (topojson), cargada una vez.
 */
export const P = (lat: number, lng: number): [number, number] => [(lng + 180) * 4, (90 - lat) * 4]

interface Topology {
  transform: { scale: [number, number]; translate: [number, number] }
  arcs: [number, number][][]
  objects: { land: { geometries: { type: string; arcs: number[][] | number[][][] }[] } }
}

function landPath(t: Topology): string {
  const [sx, sy] = t.transform.scale
  const [tx, ty] = t.transform.translate
  const arcs = t.arcs.map((arc) => {
    let x = 0
    let y = 0
    return arc.map(([dx, dy]) => {
      x += dx
      y += dy
      return P(y * sy + ty, x * sx + tx)
    })
  })
  const ring = (indexes: number[]) => {
    let pts: [number, number][] = []
    indexes.forEach((i, k) => {
      const a = i < 0 ? arcs[~i].slice().reverse() : arcs[i]
      pts = pts.concat(k ? a.slice(1) : a)
    })
    // Corta donde el anillo cruza el antimeridiano (salto de más de media vuelta).
    const pieces: [number, number][][] = [[]]
    pts.forEach((p, i) => {
      if (i && Math.abs(p[0] - pts[i - 1][0]) > 720) pieces.push([])
      pieces[pieces.length - 1].push(p)
    })
    if (pieces.length > 1) {
      const last = pieces.pop()!
      pieces[0] = last.concat(pieces[0])
    }
    return pieces
      .filter((q) => q.length > 2)
      .map((q) => 'M' + q.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L') + 'Z')
      .join('')
  }
  let d = ''
  for (const g of t.objects.land.geometries) {
    const polys = (g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : []) as number[][][]
    polys.forEach((poly) => poly.forEach((r) => (d += ring(r as unknown as number[]))))
  }
  return d
}

let landCache: string | null = null
let landPromise: Promise<string> | null = null

/** La silueta de la tierra (una sola descarga; si falla, el mapa queda solo con luces). */
export function loadLand(): Promise<string> {
  if (landCache) return Promise.resolve(landCache)
  if (!landPromise) {
    landPromise = fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json')
      .then((response) => response.json())
      .then((topology: Topology) => {
        landCache = landPath(topology)
        return landCache
      })
      .catch(() => '')
  }
  return landPromise
}

/** Arco entre dos puntos (curvado hacia arriba), completo y hasta la fracción t, con el punto en t. */
export function arcBetween(a: [number, number], b: [number, number], t: number) {
  const vx = b[0] - a[0]
  const vy = b[1] - a[1]
  const len = Math.hypot(vx, vy) || 1
  let nx = -vy / len
  let ny = vx / len
  if (ny > 0) {
    nx = -nx
    ny = -ny
  }
  const c: [number, number] = [(a[0] + b[0]) / 2 + nx * len * 0.3, (a[1] + b[1]) / 2 + ny * len * 0.3]
  const q = [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t]
  const u = 1 - t
  const pt: [number, number] = [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]
  return {
    full: `M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`,
    part: t > 0 ? `M${a[0]} ${a[1]} Q${q[0]} ${q[1]} ${pt[0]} ${pt[1]}` : '',
    pt,
  }
}

/** Luces de ciudades del mundo (decorado del mapa). */
export const LIGHTS: [number, number][] = [
  [48.2, 16.4], [50.1, 14.4], [47.5, 19.0], [52.2, 21.0], [59.3, 18.1], [59.9, 10.7], [55.7, 12.6], [60.2, 24.9], [53.3, -6.3], [55.9, -3.2],
  [45.5, 9.2], [45.4, 12.3], [40.9, 14.3], [43.3, 5.4], [45.8, 4.8], [50.8, 4.4], [48.1, 11.6], [50.1, 8.7], [53.6, 10.0], [37.98, 23.7],
  [41.0, 28.9], [44.4, 26.1], [42.7, 23.3], [43.3, -2.9], [36.7, -4.4], [39.6, 2.6], [28.1, -15.4], [42.9, -8.5], [41.6, -0.9], [37.2, -3.6],
  [30.0, 31.2], [33.6, -7.6], [36.8, 10.2], [36.7, 3.1], [6.5, 3.4], [-1.3, 36.8], [-33.9, 18.4], [25.2, 55.3], [31.8, 35.2], [42.4, -71.1],
  [38.9, -77.0], [41.9, -87.6], [34.0, -118.2], [37.8, -122.4], [25.8, -80.2], [45.5, -73.6], [43.7, -79.4], [-23.5, -46.6], [-22.9, -43.2],
  [-12.0, -77.0], [-33.4, -70.6], [10.5, -66.9], [28.6, 77.2], [19.1, 72.9], [39.9, 116.4], [31.2, 121.5], [37.6, 127.0], [22.3, 114.2],
  [1.35, 103.8], [-6.2, 106.8], [14.6, 121.0], [34.7, 135.5], [-33.9, 151.2], [-37.8, 145.0], [55.8, 37.6], [59.9, 30.3], [50.4, 30.5],
  [40.42, -3.7], [41.39, 2.17], [41.9, 12.5], [48.86, 2.35], [51.51, -0.13], [38.72, -9.14], [40.71, -74.0], [19.43, -99.13], [-34.6, -58.38],
]

/** Rutas decorativas con aviones (solo ambiente, como el prototipo). */
const ROUTE_PAIRS: [[number, number], [number, number]][] = [
  [[40.42, -3.7], [40.71, -74.0]],
  [[38.72, -9.14], [4.71, -74.07]],
  [[51.51, -0.13], [64.15, -21.94]],
  [[31.63, -8.0], [41.9, 12.5]],
  [[41.39, 2.17], [52.52, 13.4]],
  [[19.43, -99.13], [-34.6, -58.38]],
  [[48.86, 2.35], [13.75, 100.5]],
  [[52.37, 4.9], [35.68, 139.69]],
  [[40.71, -74.0], [19.43, -99.13]],
  [[37.39, -5.98], [38.72, -9.14]],
]
export const DECOR_ROUTES = ROUTE_PAIRS.map(([a, b]) => arcBetween(P(a[0], a[1]), P(b[0], b[1]), 1).full)
