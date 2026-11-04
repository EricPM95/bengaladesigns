/**
 * Los 11 emblemas de Lanzarote (Tanda LZ3), tal cual el Dashboard de Design con Lanzarote elegido: 9 de sitio y 2 de momento, cada uno con su movimiento.
 * Piezas de Design: `Piezas/Emblema Lanza` (kinds 2 a 11) y el «gl» de `Piezas/Emblema Secreto` (el de Timanfaya, un dibujo que se traza).
 * `animado`: la animación en bucle; sin ella, el dibujo queda quieto. `silueta`: la misma forma, apagada y con «?» (los que faltan).
 * Los ids van con el prefijo «lz_» para no chocar con los de Roma (Roma también tiene «madrugador»); ver `KIND_DE_EMBLEMA_LANZA`.
 */
import { useId } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import './dibujos.css'
import './EmblemaLanza.css'

/** id del emblema → clase de dibujo. «gl» = Timanfaya (hexágono con el volcán trazado); 2 a 11 = los demás. */
export const KIND_DE_EMBLEMA_LANZA: Record<string, string> = {
  lz_timanfaya: 'gl',
  lz_jameos_del_agua: '2',
  lz_cueva_de_los_verdes: '3',
  lz_mirador_del_rio: '4',
  lz_fundacion_cesar_manrique: '5',
  lz_el_golfo: '6',
  lz_la_geria: '7',
  lz_la_graciosa: '8',
  lz_papagayo: '9',
  lz_madrugador: '10',
  lz_atardecer_atlantico: '11',
}
/** Los ids de `data/logros/lanzarote.json › emblemas` (sin prefijo, salvo «madrugador», que Roma también tiene: en Lanzarote es `lz_madrugador`) apuntan al mismo dibujo. */
const ALIAS: Record<string, string> = {
  timanfaya: 'lz_timanfaya', jameos: 'lz_jameos_del_agua', cueva_de_los_verdes: 'lz_cueva_de_los_verdes', mirador_del_rio: 'lz_mirador_del_rio', fundacion_manrique: 'lz_fundacion_cesar_manrique',
  el_golfo: 'lz_el_golfo', la_geria: 'lz_la_geria', la_graciosa: 'lz_la_graciosa', papagayo: 'lz_papagayo', atardecer_atlantico: 'lz_atardecer_atlantico',
}
export const IDS_EMBLEMAS_LANZA = Object.keys(KIND_DE_EMBLEMA_LANZA)
/** «madrugador» es también el id de Roma: solo es el de Lanzarote si el viaje abierto es a Lanzarote (o si se pide `lz_madrugador`). */
const AMBIGUOS: Record<string, string> = { madrugador: 'lz_madrugador' }
export const destinoActivoEsLanzarote = (): boolean => /lanzarote/i.test(useRouteStore.getState().destination ?? '')
function canonico(id: string): string {
  if (AMBIGUOS[id]) return destinoActivoEsLanzarote() ? AMBIGUOS[id] : id
  return ALIAS[id] ?? id
}
export function esEmblemaDeLanzarote(id: string): boolean {
  return canonico(id) in KIND_DE_EMBLEMA_LANZA
}

const OCT = 'polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)'
const SHIELD = 'polygon(0 0,100% 0,100% 60%,50% 100%,0 60%)'
const HEX = 'polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)'
const STAR = 'polygon(' + Array.from({ length: 16 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 8, r = i % 2 ? 37 : 50; return (50 + r * Math.cos(a)).toFixed(1) + '% ' + (50 + r * Math.sin(a)).toFixed(1) + '%' }).join(',') + ')'
const GOLD = 'linear-gradient(135deg,#F6E7BD,#B9944F 45%,#F0DCA6 70%,#A88541)'
const GLIFO_TIMANFAYA = ['M5 41L19 16l5 5 5-7 14 27zM24 21l-2 8 4 4-2 8', 'M16 10q2-3 0-6M24 8q2-3 0-6M32 10q2-3 0-6']

/** [ancho, alto, radio, recorte] por clase. */
const FORMA: Record<string, [number, number, string, string]> = {
  gl: [106, 120, '0', HEX],
  '2': [104, 120, '50px 50px 14px 14px', 'none'],
  '3': [104, 120, '0', SHIELD],
  '4': [128, 96, '16px', 'none'],
  '5': [112, 112, '50%', 'none'],
  '6': [100, 120, '50% 50% 50% 50% / 58% 58% 42% 42%', 'none'],
  '7': [112, 112, '0', OCT],
  '8': [122, 122, '0', STAR],
  '9': [132, 100, '50%', 'none'], // (LZ3b) Design cambió el de Papagayo: de hexágono 120×106 a elipse 132×100
  '10': [90, 90, '24px', 'none'],
  '11': [90, 90, '24px', 'none'],
}

export function EmblemaLanzaDibujo({ id, animado = false, silueta = false, tam = 120 }: { id: string; animado?: boolean; silueta?: boolean; tam?: number }) {
  const u = useId().replace(/:/g, '')
  const K = KIND_DE_EMBLEMA_LANZA[canonico(id)]
  if (!K) return <span style={{ display: 'inline-block', width: tam, height: tam }} />
  const [w, h, rad, clip] = FORMA[K]
  const rot = K === '10' || K === '11'
  const found = !silueta
  const rim = !found ? 'linear-gradient(135deg,#6A6F84,#3E4256)' : K === '10' ? '#F3D2A6' : K === '11' ? '#F4A07A' : GOLD
  const ink = !found ? '#8D92A6' : K === '10' ? '#F3D2A6' : K === '11' ? '#F4A07A' : 'oklch(0.88 0.08 85)'
  const halo = !found ? 'rgba(140,145,170,.12)' : K === '10' ? 'rgba(255,215,170,.45)' : K === '11' ? 'rgba(255,160,130,.45)' : 'oklch(0.86 0.09 85 / .35)'
  const forma: CSSProperties = { clipPath: clip, borderRadius: rad }
  const caja = 150
  return (
    <span className={(animado ? 'dib-mov' : 'dib-quieto') + ' lq'} data-emblema-lanza={K} data-silueta={silueta ? '1' : undefined} style={{ display: 'inline-block', width: tam, height: tam, flex: 'none' }}>
      <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: caja, height: caja, transform: `scale(${(tam / caja).toFixed(3)})`, transformOrigin: '0 0' }}>
        <span style={{ position: 'absolute', inset: 14 }}>
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle,${halo},transparent 70%)`, animation: animado ? 'lqGlowH 3.6s ease-in-out infinite' : 'none', opacity: found ? 1 : 0.5 }} />
        </span>
        <div style={{ animation: animado ? 'lqIn .9s ease both' : 'none' }}>
          <div style={{ position: 'relative', width: w, height: h, transform: rot ? 'rotate(45deg)' : 'none' }}>
            <span style={{ position: 'absolute', inset: 0, ...forma, background: rim }} />
            <span style={{ position: 'absolute', inset: 0, ...forma, transform: 'scale(.9)', background: 'linear-gradient(140deg,#2D3450,#141826)', overflow: 'hidden' }}>
              {animado && found && <span style={{ position: 'absolute', top: '-20%', bottom: '-20%', left: 0, width: '26%', background: 'linear-gradient(90deg,transparent,rgba(255,240,200,.28),transparent)', animation: 'lqShine 4.6s 1.9s ease-in-out infinite' }} />}
            </span>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ink }}>
              {!found ? <span style={{ font: "400 54px/1 'Instrument Serif',serif", opacity: 0.7, transform: rot ? 'rotate(-45deg)' : 'none' }}>?</span> : <Dibujo K={K} u={u} animado={animado} />}
            </span>
          </div>
        </div>
      </span>
    </span>
  )
}

function Dibujo({ K, u, animado }: { K: string; u: string; animado: boolean }): ReactNode {
  const an = (s: string) => (animado ? s : 'none')
  switch (K) {
    case 'gl':
      return (
        <svg width="88" height="88" viewBox="0 0 48 48" fill="none" stroke="#F3D88F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ overflow: 'visible', filter: 'drop-shadow(0 0 5px rgba(243,216,143,.55))', animation: an('lzGlow 3.2s ease-in-out infinite') }}>
          {GLIFO_TIMANFAYA.map((d, i) => <path key={i} d={d} pathLength="1" strokeDasharray="1" style={{ animation: an(`lzDraw 1s ${(1.2 + i * 0.4).toFixed(2)}s ease-out both`) }} />)}
        </svg>
      )
    case '2':
      return (
        <svg width="84" height="84" viewBox="0 0 60 60" fill="none" style={{ overflow: 'visible' }}>
          <defs><linearGradient id={u + 'b'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF3C0" stopOpacity=".9" /><stop offset="1" stopColor="#FFF3C0" stopOpacity="0" /></linearGradient></defs>
          <path d="M12 54V32a18 18 0 0 1 36 0v22z" fill="#0A1426" />
          <path d="M30 8L19 44H41z" fill={`url(#${u}b)`} style={{ animation: an('lqBeam 4.8s ease-in-out infinite') }} />
          <path d="M12 44q4.5-3 9 0t9 0 9 0 9 0v10H12z" fill="#17396A" />
          <ellipse cx="30" cy="48" rx="7" ry="2.2" stroke="#9FDBFF" strokeWidth="1.2" style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: an('lqRip 2.4s ease-out infinite') }} />
          <ellipse cx="30" cy="48" rx="7" ry="2.2" stroke="#9FDBFF" strokeWidth="1.2" style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: an('lqRip 2.4s 1.2s ease-out infinite') }} />
          <g style={{ animation: an('lqCrab 4.8s ease-in-out infinite') }}><ellipse cx="30" cy="45.5" rx="3.4" ry="2.4" fill="#FFFFFF" /><circle cx="26" cy="43.2" r="1.3" fill="#FFFFFF" /><circle cx="34" cy="43.2" r="1.3" fill="#FFFFFF" /></g>
          <path d="M8 54V30a22 22 0 0 1 44 0v24" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      )
    case '3': {
      const l = (cx: number, cy: number, r: number, d: string) => <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={r} fill="#FFC76B" style={{ animation: an(`lqLamp 5s ${d} ease-in-out infinite`) }} />
      return (
        <svg width="84" height="84" viewBox="0 0 60 60" fill="none" style={{ overflow: 'visible' }}>
          <circle cx="30" cy="38" r="9" fill="#FFD58A" opacity=".3" />
          <path d="M8 56V30a22 22 0 0 1 44 0v26" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M17 56V33a13 13 0 0 1 26 0v23" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" opacity=".8" />
          <path d="M24 56V36a6 6 0 0 1 12 0v20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity=".6" />
          {l(12.5, 48, 2, '0s')}{l(47.5, 48, 2, '0s')}{l(20, 45, 1.7, '.55s')}{l(40, 45, 1.7, '.55s')}{l(26, 42, 1.4, '1.1s')}{l(34, 42, 1.4, '1.1s')}
          <path d="M30 31l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#FFF3C0" style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: an('lqFlash 5s 1.5s ease-out infinite') }} />
        </svg>
      )
    }
    case '4': {
      const ola = 'M-8 30q3-2 6 0t6 0 6 0 6 0 6 0 6 0 6 0 6 0 6 0 6 0 6 0 6 0 6 0 6 0'
      return (
        <svg width="110" height="70" viewBox="0 0 72 46" fill="none" style={{ overflow: 'visible' }}>
          <defs><clipPath id={u + 'w'}><rect x="4" y="5" width="64" height="36" rx="5" /></clipPath></defs>
          <rect x="4" y="5" width="64" height="36" rx="5" fill="#0F2A47" />
          <g clipPath={`url(#${u}w)`}>
            <rect x="4" y="5" width="64" height="18" fill="#2A5A8A" opacity=".55" />
            <path d="M36 25q5-9 11-9t9 9z" fill="#C9A15A" />
            <rect x="4" y="25" width="64" height="16" fill="#0F3A66" />
            <g style={{ animation: an('lqWaveX 2.6s linear infinite') }}><path d={ola} stroke="#9FDBFF" strokeWidth="1.2" opacity=".7" /><path d={ola.replace('M-8 30', 'M-8 36')} stroke="#9FDBFF" strokeWidth="1.2" opacity=".5" /></g>
            <g style={{ animation: an('lqBoat 8s linear infinite') }}><path d="M-4 31V23l6 8z" fill="#FFFFFF" /><path d="M-6 32h12l-2.4 3.2h-7.2z" fill="#FFFFFF" /></g>
          </g>
          <path d="M26 5V41M48 5V41" stroke="currentColor" strokeWidth="2" />
          <rect x="4" y="5" width="64" height="36" rx="5" stroke="currentColor" strokeWidth="2.6" />
        </svg>
      )
    }
    case '5': {
      const b: [number, number, number, string][] = [[17, 38, 9, '0s'], [30, 42, 9.5, '.7s'], [23, 25, 8, '1.4s'], [39, 27, 7.5, '2.1s'], [45, 43, 6.5, '2.8s']]
      return (
        <svg width="84" height="84" viewBox="0 0 60 60" fill="none" style={{ overflow: 'visible' }}>
          {b.map(([x, y, r, d]) => <circle key={`l${x}`} cx={x} cy={y} r={r} fill="#FF8A3D" style={{ animation: an(`lqLava 5.6s ${d} ease-in-out infinite`) }} />)}
          {b.map(([x, y, r]) => <circle key={`s${x}`} cx={x} cy={y} r={r} stroke="currentColor" strokeWidth="2.3" />)}
        </svg>
      )
    }
    case '6':
      return (
        <svg width="84" height="84" viewBox="0 0 60 60" fill="none" style={{ overflow: 'visible' }}>
          <defs><radialGradient id={u + 'g'}><stop offset="0" stopColor="#7DF5A8" /><stop offset="1" stopColor="#1FAE62" /></radialGradient></defs>
          <path d="M6 44A24 24 0 0 1 54 44z" fill="#2A1D18" />
          <ellipse cx="30" cy="35" rx="12" ry="8.5" fill={`url(#${u}g)`} opacity=".5" />
          <ellipse cx="30" cy="35" rx="12" ry="8.5" fill={`url(#${u}g)`} style={{ animation: an('lqGreen 3.2s ease-in-out infinite') }} />
          <path d="M6 44H54V50H6z" fill="#0E0E10" />
          <path d="M6 50H54V58H6z" fill="#1E5E8E" />
          <g style={{ animation: an('lqSea 3s ease-in-out infinite') }}><path d="M10 53q3-2 6 0t6 0M30 55q3-2 6 0t6 0M18 57q3-2 6 0" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" /></g>
          <path d="M6 44A24 24 0 0 1 54 44" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      )
    case '7': {
      const v = (d: string, dl: string) => <path key={d} d={d} stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" pathLength="100" strokeDasharray="22 120" style={{ animation: an(`lqWind 3.4s ${dl} linear infinite`) }} />
      return (
        <svg width="84" height="84" viewBox="0 0 60 60" fill="none" style={{ overflow: 'visible' }}>
          <ellipse cx="31" cy="38" rx="19" ry="15" fill="#1A1614" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 42A19 15 0 0 1 31 23" stroke="#E4D3A8" strokeWidth="5.4" strokeLinecap="round" strokeDasharray="5.4 1.6" />
          <path d="M31 48V38" stroke="#7DD38A" strokeWidth="2.2" strokeLinecap="round" />
          <ellipse cx="26.5" cy="37" rx="4.4" ry="2.4" fill="#7DD38A" transform="rotate(-28 26.5 37)" /><ellipse cx="35.5" cy="37" rx="4.4" ry="2.4" fill="#7DD38A" transform="rotate(28 35.5 37)" />
          <circle cx="29.5" cy="32.5" r="1.8" fill="#B07BD6" /><circle cx="33" cy="32.5" r="1.8" fill="#B07BD6" /><circle cx="31.2" cy="35" r="1.8" fill="#B07BD6" />
          {v('M2 30q14-8 28-2t28-2', '0s')}{v('M2 38q14-8 28-2t28-2', '1.1s')}{v('M2 22q14-8 28-2t28-2', '2.2s')}
        </svg>
      )
    }
    case '8': {
      const pts: [number, number][] = [[7, 40], [14, 31.5], [22, 26], [30, 24], [38, 26], [46, 31.5], [53, 40]]
      return (
        <svg width="84" height="84" viewBox="0 0 60 60" fill="none" style={{ overflow: 'visible' }}>
          <path d="M6 40Q30 14 54 40" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1 3.4" opacity=".5" />
          {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.6" fill="#DCEBFF" style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: an(`lqDot 6s ${(i * 0.45).toFixed(2)}s ease-out infinite`) }} />)}
          <circle cx="30" cy="47" r="9" fill="#FFD36B" opacity=".3" style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: an('lqGold 6s ease-out infinite') }} />
          <circle cx="30" cy="47" r="5.4" fill="#FFD36B" stroke="#FFF3C0" strokeWidth="1.2" style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: an('lqGold 6s ease-out infinite') }} />
        </svg>
      )
    }
    case '9':
      return (
        <svg width="84" height="84" viewBox="0 0 60 60" fill="none" style={{ overflow: 'visible' }}>
          <defs><linearGradient id={u + 't'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7EF0E4" /><stop offset="1" stopColor="#1C9BC0" /></linearGradient></defs>
          <path d="M23 20H37L41 48H19z" fill={`url(#${u}t)`} />
          <path d="M4 12L22 18 24 44 4 54z" fill="#7A4B2A" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M56 10L38 18 36 44 56 54z" fill="#8A5530" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M22 41q8-4 16 0" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" style={{ animation: an('lqSurf 3s ease-in-out infinite') }} />
          <path d="M21 45q9-4 18 0" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" style={{ animation: an('lqSurf 3s 1.5s ease-in-out infinite') }} />
          <path d="M19 48Q30 40 41 48V56H19z" fill="#F0D28A" />
          <path d="M30 24l1.5 3.8 3.8 1.5-3.8 1.5L30 34.6l-1.5-3.8-3.8-1.5 3.8-1.5z" fill="#FFFFFF" style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: an('lqTw 2.6s ease-in-out infinite') }} />
          <circle cx="30" cy="11" r="4.2" fill="#FFD36B" />
        </svg>
      )
    case '10':
      return (
        <svg width="86" height="86" viewBox="0 0 60 60" fill="none" style={{ overflow: 'visible', transform: 'rotate(-45deg)' }}>
          <defs><clipPath id={u + 'h'}><rect x="0" y="0" width="60" height="49" /></clipPath></defs>
          <g clipPath={`url(#${u}h)`}>
            <g style={{ animation: an('lqRays 6s ease-in-out infinite') }} stroke="#FFD58A" strokeWidth="1.8" strokeLinecap="round"><path d="M30 18V13M17 24l-3-3M43 24l3-3M12 36H7M48 36h5" /></g>
            <circle cx="30" cy="38" r="10" fill="#FFB347" style={{ animation: an('lqSunUp 6s ease-in-out infinite') }} />
            <circle cx="30" cy="38" r="10" fill="#FFE08A" opacity=".5" style={{ animation: an('lqSunUp 6s ease-in-out infinite') }} />
          </g>
          <path d="M6 50L21 28h18L54 50z" fill="#241A16" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M22 28q8 4 16 0" stroke="currentColor" strokeWidth="1.8" />
          <path d="M2 50H58" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )
    case '11':
      return (
        <svg width="86" height="86" viewBox="0 0 60 60" fill="none" style={{ overflow: 'visible', transform: 'rotate(-45deg)' }}>
          <defs><clipPath id={u + 's'}><rect x="4" y="6" width="52" height="30" /></clipPath></defs>
          <rect x="4" y="6" width="52" height="30" fill="#F7B05F" style={{ animation: an('lqSky 6s ease-in-out infinite') }} />
          <g clipPath={`url(#${u}s)`}><circle cx="30" cy="26" r="10" fill="#FFE9A6" style={{ animation: an('lqSunDown 6s ease-in-out infinite') }} /></g>
          <rect x="4" y="36" width="52" height="16" fill="#123A66" />
          <g style={{ animation: an('lqRefl 6s ease-in-out infinite') }} stroke="#FFD58A" strokeWidth="2" strokeLinecap="round"><path d="M22 40H38M25 44H35M27 48H33" /></g>
          <rect x="4" y="6" width="52" height="46" rx="3" stroke="currentColor" strokeWidth="2.4" />
          <path d="M4 36H56" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    default:
      return null
  }
}
