/**
 * LA MATEMÁTICA DEL GLOBO (8C2): la proyección ortográfica de las costas de `tierra110.json` (world-atlas 110m, dentro de la app: no se pide nada a internet) sin ninguna librería.
 * Los puntos se preparan UNA vez (seno y coseno de cada longitud y latitud) y cada giro del globo solo hace multiplicaciones. Lo que queda en la cara oculta se pega al borde
 * (el truco de siempre: así el relleno de un país que cruza el horizonte sigue cerrado). Las funciones son puras: se prueban en `scripts/destino/pruebas8c/mundo.mjs`.
 */
export interface Anillo {
  cl: Float32Array
  sl: Float32Array
  cp: Float32Array
  sp: Float32Array
}
export type Tierra = Record<string, Anillo[]>

const RAD = Math.PI / 180

/** De `{ it: [[x0,y0,x1,y1,…], …] }` (décimas de grado) a los anillos preparados. */
export function prepararTierra(crudo: Record<string, number[][]>): Tierra {
  const salida: Tierra = {}
  for (const [iso, anillos] of Object.entries(crudo)) {
    salida[iso] = anillos.map((a) => {
      const n = a.length / 2
      const r: Anillo = { cl: new Float32Array(n), sl: new Float32Array(n), cp: new Float32Array(n), sp: new Float32Array(n) }
      for (let i = 0; i < n; i++) {
        const lon = (a[2 * i] / 10) * RAD
        const lat = (a[2 * i + 1] / 10) * RAD
        r.cl[i] = Math.cos(lon)
        r.sl[i] = Math.sin(lon)
        r.cp[i] = Math.cos(lat)
        r.sp[i] = Math.sin(lat)
      }
      return r
    })
  }
  return salida
}

export interface Vista {
  /** Giro [λ, φ] como en d3: el centro del globo es (−λ, −φ) en grados. */
  rot: [number, number]
  /** Radio en unidades del dibujo. */
  R: number
  cx: number
  cy: number
}

interface Centro {
  cl0: number
  sl0: number
  ca: number
  sa: number
}
const centroDe = (rot: [number, number]): Centro => {
  const lon0 = -rot[0] * RAD
  const lat0 = -rot[1] * RAD
  return { cl0: Math.cos(lon0), sl0: Math.sin(lon0), ca: Math.cos(lat0), sa: Math.sin(lat0) }
}
const f1 = (n: number) => (Math.round(n * 10) / 10).toString()

/** El trazado SVG de un país (todas sus islas). Cadena vacía si todo queda en la cara oculta. */
export function trazadoDe(anillos: Anillo[], v: Vista): string {
  const { cl0, sl0, ca, sa } = centroDe(v.rot)
  let d = ''
  for (const a of anillos) {
    const n = a.cl.length
    let alguno = false
    let tramo = ''
    for (let i = 0; i < n; i++) {
      const cosdl = a.cl[i] * cl0 + a.sl[i] * sl0
      const sindl = a.sl[i] * cl0 - a.cl[i] * sl0
      let x = a.cp[i] * sindl
      let y = ca * a.sp[i] - sa * a.cp[i] * cosdl
      const z = sa * a.sp[i] + ca * a.cp[i] * cosdl
      if (z >= 0) alguno = true
      else {
        const l = Math.hypot(x, y) || 1
        x /= l
        y /= l
      }
      tramo += `${i === 0 ? 'M' : 'L'}${f1(v.cx + v.R * x)} ${f1(v.cy - v.R * y)}`
    }
    if (alguno) d += `${tramo}Z`
  }
  return d
}

/** Un punto del mapa en el dibujo, y si está en la cara visible (con un poco de margen). */
export function puntoDe(lat: number, lng: number, v: Vista): { x: number; y: number; visible: boolean } {
  const { cl0, sl0, ca, sa } = centroDe(v.rot)
  const la = lat * RAD
  const lo = lng * RAD
  const cosdl = Math.cos(lo) * cl0 + Math.sin(lo) * sl0
  const sindl = Math.sin(lo) * cl0 - Math.cos(lo) * sl0
  const x = Math.cos(la) * sindl
  const y = ca * Math.sin(la) - sa * Math.cos(la) * cosdl
  const z = sa * Math.sin(la) + ca * Math.cos(la) * cosdl
  return { x: v.cx + v.R * x, y: v.cy - v.R * y, visible: z > 0.04 }
}

/** Los meridianos y paralelos cada `cada` grados, solo la parte que se ve. */
export function rejilla(v: Vista, cada = 30): string {
  let d = ''
  const trozo = (puntos: Array<[number, number]>) => {
    let abierto = false
    for (const [lat, lng] of puntos) {
      const p = puntoDe(lat, lng, v)
      if (p.visible) {
        d += `${abierto ? 'L' : 'M'}${f1(p.x)} ${f1(p.y)}`
        abierto = true
      } else abierto = false
    }
  }
  for (let lng = -180; lng < 180; lng += cada) {
    const pts: Array<[number, number]> = []
    for (let lat = -90; lat <= 90; lat += 3) pts.push([lat, lng])
    trozo(pts)
  }
  for (let lat = -90 + cada; lat < 90; lat += cada) {
    const pts: Array<[number, number]> = []
    for (let lng = -180; lng <= 180; lng += 3) pts.push([lat, lng])
    trozo(pts)
  }
  return d
}

/** El giro que deja un punto en el centro del globo. */
export const giroPara = (lat: number, lng: number): [number, number] => [-lng, -lat]

/** El punto medio (sobre la esfera) de varios sitios: hacia dónde girar el globo para verlos. */
export function centroDeVarios(sitios: Array<{ lat: number; lng: number }>): { lat: number; lng: number } {
  if (!sitios.length) return { lat: 30, lng: 10 }
  let x = 0
  let y = 0
  let z = 0
  for (const s of sitios) {
    x += Math.cos(s.lat * RAD) * Math.cos(s.lng * RAD)
    y += Math.cos(s.lat * RAD) * Math.sin(s.lng * RAD)
    z += Math.sin(s.lat * RAD)
  }
  const l = Math.hypot(x, y, z)
  if (l < 1e-6) return { lat: 30, lng: 10 }
  return { lat: Math.asin(z / l) / RAD, lng: Math.atan2(y, x) / RAD }
}

/** Cuánto acercar el globo a un país: los pequeños mucho (sin costa en el mapa), los grandes poco. */
export const zoomParaPais = (pequeno: boolean): number => (pequeno ? 9 : 2.1)
