import type { ReactNode } from 'react'
import { COLECCIONES_POR_PARTES } from '../../dibujos/partes'
import { geometriaDeColeccion, poligonoDelTrozo } from '../../dibujos/piezas/InsigniaPorPartes'
import { ICONOS_DE_PIEZA } from '../../dibujos/piezas/InsigniaPieza'
import { Insignia } from '../../dibujos'

/**
 * (V28c) LA BALDOSA DE UN SITIO EN SU CÍRCULO: SOLO la baldosa de color de ese sitio, tal cual sale en la insignia, desde el borde del centro (la medalla o el octógono de la estrella) hacia fuera, SIN nada del centro crema
 * ni de las baldosas vecinas; girada para que su lado de fuera quede arriba (las 8 se ven iguales, como un escudito); el icono, siempre derecho; y grande: llena el círculo con un margen pequeño.
 * La geometría es pura (se prueba sin pantalla): `geometriaDeBaldosa` da el polígono visible y el giro; `encajeDeBaldosa` lo pone en un círculo.
 */
export type FamiliaDeInsignia = 'partes' | 'impr' | 'joyas' | 'burbujas' | 'una'

export interface GeometriaDeBaldosa {
  familia: FamiliaDeInsignia
  /** El polígono visible de la baldosa, de 0 a 1 dentro del cuadrado de la insignia SIN girar (nada del centro). */
  puntos: [number, number][]
  /** El centro de la insignia (de 0 a 1): el giro se hace alrededor de él. */
  centro: [number, number]
  /** Grados (en el sentido de las agujas) para dejar el lado de fuera de la baldosa arriba. */
  giro: number
  /** Los mismos puntos ya girados. */
  girados: [number, number][]
}

/** El radio, de 0 a 200, hasta donde llega la medalla del centro (27 de radio + la mitad de su borde de 4,5). La baldosa empieza fuera de él. */
const RADIO_MEDALLA = 30
const RAD = Math.PI / 180

const girar = (pts: [number, number][], c: [number, number], grados: number): [number, number][] =>
  pts.map(([x, y]) => {
    const dx = x - c[0]
    const dy = y - c[1]
    return [c[0] + dx * Math.cos(grados * RAD) - dy * Math.sin(grados * RAD), c[1] + dx * Math.sin(grados * RAD) + dy * Math.cos(grados * RAD)] as [number, number]
  })

function pieza150(a: number, r: number): [number, number] {
  return [75 + r * Math.cos(a * RAD), 75 + r * Math.sin(a * RAD)]
}

export function geometriaDeBaldosa(coleccion: string, total: number, k: number): GeometriaDeBaldosa | null {
  const info = COLECCIONES_POR_PARTES[coleccion]
  if (!info) return null
  const col = info.col
  let familia: FamiliaDeInsignia = 'partes'
  let puntos: [number, number][] = []
  let centro: [number, number] = [0.5, 0.5]
  let giro = 0
  if (total <= 1) {
    familia = 'una'
    puntos = Array.from({ length: 36 }, (_, i) => [0.5 + Math.cos((i * 2 * Math.PI) / 36) * 0.17, 0.5 + Math.sin((i * 2 * Math.PI) / 36) * 0.17] as [number, number])
  } else if (col === 'r1') {
    // Los imprescindibles: 8 baldosas en un octógono, de la anilla de 30 al borde de 72 (en 150).
    familia = 'impr'
    const a0 = -112.5 + k * 45
    const a1 = a0 + 45
    puntos = [pieza150(a0, 72), pieza150(a1, 72), pieza150(a1, 30), pieza150(a0, 30)].map(([x, y]) => [x / 150, y / 150] as [number, number])
    giro = -90 - (a0 + 22.5)
  } else if (col === 'r3') {
    // Las 4 joyas: cuatro cuadrados de 92 en una cuadrícula de 150, sin centro que quitar.
    familia = 'joyas'
    const x = (k % 2) * 58
    const y = Math.floor(k / 2) * 58
    puntos = [[x, y], [x + 92, y], [x + 92, y + 92], [x, y + 92]].map(([px, py]) => [px / 150, py / 150] as [number, number])
  } else if (geometriaDeColeccion(col)?.burbujas) {
    familia = 'burbujas'
    const BP = [[62, 64, 34], [118, 46, 22], [152, 86, 28], [108, 106, 24], [54, 128, 26], [100, 156, 28], [152, 148, 22]]
    const b = BP[k]
    if (!b) return null
    puntos = Array.from({ length: 28 }, (_, i) => [(b[0] + Math.cos((i * 2 * Math.PI) / 28) * b[2] * 0.9) / 200, (b[1] + Math.sin((i * 2 * Math.PI) / 28) * b[2] * 0.9) / 200] as [number, number])
  } else {
    // Insignias por partes: el polígono de la baldosa, sin lo que cae dentro de la medalla del centro.
    const g = geometriaDeColeccion(col)
    const poli = poligonoDelTrozo(col, k)
    if (!g || !poli) return null
    const [cx, cy] = [g.cx, g.cy]
    const angulo = (p: [number, number]) => Math.atan2(p[1] - cy, p[0] - cx)
    const fuera: [number, number][] = poli.map((p) => {
      const r = Math.hypot(p[0] - cx, p[1] - cy)
      return r >= RADIO_MEDALLA ? p : ([cx + Math.cos(angulo(p)) * RADIO_MEDALLA, cy + Math.sin(angulo(p)) * RADIO_MEDALLA] as [number, number])
    })
    // Entre dos puntos seguidos que quedan en el borde de la medalla se pone el arco (no la cuerda, que cortaría dentro de ella).
    const lista: [number, number][] = []
    for (let i = 0; i < fuera.length; i++) {
      const a = fuera[i]!
      const b = fuera[(i + 1) % fuera.length]!
      lista.push(a)
      const enBorde = (p: [number, number]) => Math.abs(Math.hypot(p[0] - cx, p[1] - cy) - RADIO_MEDALLA) < 0.01
      if (enBorde(a) && enBorde(b)) {
        let da = angulo(b) - angulo(a)
        while (da > Math.PI) da -= 2 * Math.PI
        while (da < -Math.PI) da += 2 * Math.PI
        for (let s = 1; s < 8; s++) {
          const t = angulo(a) + (da * s) / 8
          lista.push([cx + Math.cos(t) * RADIO_MEDALLA, cy + Math.sin(t) * RADIO_MEDALLA])
        }
      }
    }
    puntos = lista.map(([x, y]) => [x / 200, y / 200] as [number, number])
    centro = [cx / 200, cy / 200]
    const am = -90 + ((k + 0.5) * 360) / g.n
    giro = -90 - am
  }
  return { familia, puntos, centro, giro, girados: girar(puntos, centro, giro) }
}

export interface EncajeDeBaldosa {
  /** El lado, en px, al que dibujar la insignia entera. */
  lado: number
  /** Cuánto mover la insignia (ya con el giro hecho alrededor de su centro) para que la baldosa quede centrada. */
  dx: number
  dy: number
  giro: number
  origen: string
  clip: string
  /** Ancho y alto de la baldosa ya puesta, en px (para saber cuánto del círculo ocupa). */
  ancho: number
  alto: number
}

/** Pura: pone la baldosa en un círculo de `diametro` px, centrada y a escala para que el punto más lejano quede a `margen` del radio (0,9 = un 10 % libre por lado). */
export function encajeDeBaldosa(g: GeometriaDeBaldosa, diametro: number, margen = g.familia === 'joyas' ? 1 : 0.96): EncajeDeBaldosa {
  const xs = g.girados.map((p) => p[0])
  const ys = g.girados.map((p) => p[1])
  const bx = (Math.min(...xs) + Math.max(...xs)) / 2
  const by = (Math.min(...ys) + Math.max(...ys)) / 2
  const radio = Math.max(...g.girados.map(([x, y]) => Math.hypot(x - bx, y - by)), 0.0001)
  const lado = (diametro / 2) * margen / radio
  return {
    lado,
    dx: diametro / 2 - bx * lado,
    dy: diametro / 2 - by * lado,
    giro: g.giro,
    origen: `${(g.centro[0] * lado).toFixed(1)}px ${(g.centro[1] * lado).toFixed(1)}px`,
    clip: `polygon(${g.puntos.map(([x, y]) => `${(x * lado).toFixed(1)}px ${(y * lado).toFixed(1)}px`).join(',')})`,
    ancho: (Math.max(...xs) - Math.min(...xs)) * lado,
    alto: (Math.max(...ys) - Math.min(...ys)) * lado,
  }
}

const joyaMargen = (g: GeometriaDeBaldosa): number => (g.familia === 'joyas' ? 1 : 0.96)
const HUES = [5, 35, 70, 140, 185, 230, 280, 330]
const ICONOS_IMPR = ['arco', 'foro', 'fuente', 'panteon', 'obelisco', 'escalinata', 'castillo', 'farola']
const ICONOS_JOYAS = ['arco', 'fuente', 'panteon', 'caracol']
const GEMAS = [['#D21E45', '#6A0A1E'], ['#16A06A', '#06482E'], ['#2A5BC8', '#0E2560'], ['#EAA22A', '#7A4A08']]

/** Los Imprescindibles y las 4 joyas llevan un icono por sitio: se dibujan aparte para que el icono quede DERECHO (la baldosa gira, el icono no). */
function BaldosaConIcono({ g, ganado, k, diametro }: { g: GeometriaDeBaldosa; ganado: boolean; k: number; diametro: number }): ReactNode {
  const unidad = 150
  const pts = g.girados.map(([x, y]) => [x * unidad, y * unidad] as [number, number])
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const bx = (Math.min(...xs) + Math.max(...xs)) / 2
  const by = (Math.min(...ys) + Math.max(...ys)) / 2
  const r = Math.max(...pts.map(([x, y]) => Math.hypot(x - bx, y - by)))
  const h = r / (joyaMargen(g))
  const d = `M${pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join('L')}Z`
  const icono = (g.familia === 'impr' ? ICONOS_DE_PIEZA[ICONOS_IMPR[k] ?? ''] : ICONOS_DE_PIEZA[ICONOS_JOYAS[k] ?? '']) ?? ''
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length
  const id = `bal-${g.familia}-${k}`
  const joya = g.familia === 'joyas'
  const hue = HUES[k % 8]!
  const [g1, g2] = GEMAS[k % 4]!
  // Un tercio del lado de la baldosa para el icono (el icono es de 24 × 24).
  const lado = Math.max(...xs) - Math.min(...xs)
  const e = (lado * (joya ? 0.5 : 0.62)) / 24
  return (
    <svg data-baldosa={g.familia} data-baldosa-icono={icono ? '1' : '0'} width={diametro} height={diametro} viewBox={`${bx - h} ${by - h} ${2 * h} ${2 * h}`} style={{ display: 'block' }} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="1" y2="1">
          {ganado ? (joya ? <><stop offset="0" stopColor="#FFFCF2" /><stop offset=".55" stopColor="#FFF3D8" /><stop offset="1" stopColor="#EBDAB0" /></> : <><stop offset="0" stopColor={`oklch(0.84 0.14 ${hue})`} /><stop offset="1" stopColor={`oklch(0.52 0.17 ${hue})`} /></>) : <><stop offset="0" stopColor="#D8CFBB" /><stop offset="1" stopColor="#C4B9A1" /></>}
        </linearGradient>
        <radialGradient id={`${id}-g`} cx=".35" cy=".3" r=".85">
          <stop offset="0" stopColor={g1} />
          <stop offset="1" stopColor={g2} />
        </radialGradient>
      </defs>
      <path d={d} fill={`url(#${id}-f)`} stroke={ganado ? (joya ? '#C9A65E' : '#FFFFFF') : '#B9AE98'} strokeOpacity={ganado ? 0.9 : 1} strokeWidth={joya ? 2.4 : 2} strokeLinejoin="round" />
      {ganado && !joya && <path d={d} fill="#FFFFFF" fillOpacity=".12" transform={`translate(${cx} ${cy}) scale(.72) translate(${-cx} ${-cy})`} stroke="#FFFFFF" strokeOpacity=".5" strokeWidth="1.4" strokeLinejoin="round" />}
      {icono && (
        <g transform={`translate(${cx - 12 * e} ${cy - 12 * e}) scale(${e})`}>
          <path d={icono} fill="none" stroke={ganado ? (joya ? '#8A6A2C' : '#FFF7F0') : 'rgba(28,34,48,.3)'} strokeWidth={joya ? 2 : 2.2} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {ganado && joya && <path d={`M${cx + lado * 0.3} ${cy - lado * 0.38}m0 -4l4 4l-4 4l-4 -4Z`} fill={`url(#${id}-g)`} stroke="#FFFFFF" strokeOpacity=".9" strokeWidth=".8" />}
    </svg>
  )
}

/** El círculo de un sitio de la colección: SOLO su baldosa (de color si está ganado, gris si no). */
export function BaldosaEnCirculo({ coleccion, total, k, sitio, ganado, diametro = 46 }: { coleccion: string; total: number; k: number; sitio: string; ganado: boolean; diametro?: number }): ReactNode {
  const g = geometriaDeBaldosa(coleccion, total, k)
  if (!g) return null
  if (g.familia === 'impr' || g.familia === 'joyas') return <BaldosaConIcono g={g} ganado={ganado} k={k} diametro={diametro} />
  const e = encajeDeBaldosa(g, diametro)
  return (
    <span data-baldosa={g.familia} style={{ position: 'absolute', left: 0, top: 0, width: e.lado, height: e.lado, transformOrigin: e.origen, transform: `translate(${e.dx.toFixed(1)}px,${e.dy.toFixed(1)}px) rotate(${e.giro.toFixed(2)}deg)`, clipPath: e.clip }}>
      <Insignia coleccion={coleccion} ganados={ganado ? [sitio] : []} tam={e.lado} />
    </span>
  )
}
