/**
 * Los 12 emblemas ocultos de «Logros · Modelos» (sección 3): cada uno con su dibujo y su forma, sobre fondo oscuro.
 * `animado`: la animación en bucle de «encontrado» (CSS, sin vídeo). Sin ella, el dibujo queda quieto (un icono de línea en su forma).
 * `silueta`: la misma forma, apagada y con un «?» (los que faltan).
 * El del Coliseo es la moneda de oro en relieve («Emblema Oro»), que se carga solo cuando se usa.
 */
import { lazy, Suspense, useId } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { IC } from './iconos'
import './dibujos.css'
import './Emblema.css'

const HEX = 'polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)'
const OCT = 'polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)'
const SHIELD = 'polygon(0 0,100% 0,100% 60%,50% 100%,0 60%)'
const CROSS = 'polygon(32% 0,68% 0,68% 32%,100% 32%,100% 68%,68% 68%,68% 100%,32% 100%,32% 68%,0 68%,0 32%,32% 32%)'
const STAR = 'polygon(' + Array.from({ length: 16 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 8, r = i % 2 ? 37 : 50; return (50 + r * Math.cos(a)).toFixed(1) + '% ' + (50 + r * Math.sin(a)).toFixed(1) + '%' }).join(',') + ')'
const KEY = 'path("M52 4a32 32 0 0 1 21 56l14 56H17l14-56A32 32 0 0 1 52 4z")'
const GOLD = 'linear-gradient(135deg,#FFF6DC,#D9B86A 40%,#FFF1C6 62%,#B48F45)'
const ORO = 'linear-gradient(135deg,#F6E7BD,#B9944F 45%,#F0DCA6 70%,#A88541)'

interface Cfg { k: number; icono: string; w: number; h: number; clip?: string; rad?: string; tf?: string; itf?: string; it?: string; rim?: string; halo?: string; ia?: string; esp?: string }
const EMB: Record<string, Cfg> = {
  coliseo: { k: 0, icono: 'arco', w: 98, h: 116, rad: '49px 49px 14px 14px', rim: GOLD, esp: 'coliseo' },
  foro_romano: { k: 1, icono: 'foro', w: 106, h: 120, clip: HEX, esp: 'foro' },
  museos_vaticanos: { k: 2, icono: 'techo', w: 128, h: 96, rad: '16px', esp: 'cre' },
  plaza_san_pedro: { k: 3, icono: 'frontera', w: 104, h: 120, clip: SHIELD, it: '-10px', esp: 'plaza' },
  basilica_san_pedro: { k: 4, icono: 'tumba', w: 112, h: 112, clip: CROSS, ia: 'glow' },
  panteon: { k: 5, icono: 'cupula', w: 112, h: 112, rad: '50%', esp: 'ocu' },
  fontana_de_trevi: { k: 6, icono: 'moneda', w: 100, h: 120, rad: '50% 50% 50% 50% / 58% 58% 42% 42%', esp: 'mon' },
  boca_de_la_verdad: { k: 7, icono: 'boca', w: 122, h: 122, clip: STAR, esp: 'boca' },
  ojo_cerradura: { k: 8, icono: 'ojo', w: 104, h: 120, clip: KEY, it: '0', esp: 'key' },
  catacumbas: { k: 9, icono: 'cata', w: 112, h: 112, clip: OCT, esp: 'lamp' },
  madrugador: { k: 10, icono: 'alba', w: 90, h: 90, rad: '24px', tf: 'rotate(45deg)', itf: 'rotate(-45deg)', rim: '#F3D2A6', halo: 'rgba(255,215,170,.45)', esp: 'alba' },
  nocturno: { k: 11, icono: 'noche', w: 90, h: 90, rad: '24px', tf: 'rotate(45deg)', itf: 'rotate(-45deg)', rim: '#C9D2F2', halo: 'rgba(190,200,240,.45)', esp: 'noche' },
}

const EmblemaOro = lazy(() => import('./piezas/EmblemaOro'))

const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
/** «17 de octubre|de 2026»: la fecha en que se encontró (la de hoy si no se dice), en las dos líneas de la moneda de oro. */
function fechaDeLaMoneda(fecha?: string | null): string {
  const d = fecha && /^d{4}-d{2}-d{2}/.test(fecha) ? new Date(`${fecha.slice(0, 10)}T12:00:00`) : new Date()
  return `${d.getDate()} de ${MESES_LARGOS[d.getMonth()]}|de ${d.getFullYear()}`
}

export function EmblemaDibujo({ id, animado = false, silueta = false, tam = 120, fecha = null }: { id: string; animado?: boolean; silueta?: boolean; tam?: number; fecha?: string | null }) {
  const c = EMB[id]
  const u = useId().replace(/:/g, '')
  if (!c) return <span style={{ display: 'inline-block', width: tam, height: tam }} />
  const k = c.k
  const s = { s1: `${(1.4 + k * 0.25).toFixed(2)}s`, s2: `${(3.1 + k * 0.25).toFixed(2)}s`, s3: `${(1.65 + k * 0.25).toFixed(2)}s`, s4: `${(1.9 + k * 0.25).toFixed(2)}s`, s5: `${(4.9 + k * 0.25).toFixed(2)}s` }
  const ink = c.rim && c.rim !== GOLD ? c.rim : 'oklch(0.88 0.08 85)'
  const halo = c.halo ?? 'oklch(0.86 0.09 85 / .35)'
  const caja = 150

  let cuerpo: ReactNode
  if (id === 'coliseo' && !silueta) {
    cuerpo = (
      <Suspense fallback={null}>
        <div style={{ position: 'relative', zIndex: 1, marginTop: -6 }}>
          <EmblemaOro won size={124} interactive={false} tilt={false} flippable={false} date={fechaDeLaMoneda(fecha)} />
        </div>
      </Suspense>
    )
  } else {
    const forma: CSSProperties = { clipPath: c.clip ?? 'none', borderRadius: c.rad ?? '0' }
    cuerpo = (
      <div style={{ position: 'relative', width: c.w, height: c.h, transform: c.tf ?? 'none' }}>
        <span style={{ position: 'absolute', inset: 0, ...forma, background: silueta ? 'rgba(255,253,248,.16)' : c.rim ?? ORO }} />
        <span style={{ position: 'absolute', inset: 0, ...forma, transform: 'scale(.9)', background: 'linear-gradient(140deg,#2D3450,#141826)', overflow: 'hidden' }}>
          {animado && !silueta && <span style={{ position: 'absolute', top: '-20%', bottom: '-20%', left: 0, width: '26%', background: 'linear-gradient(90deg,transparent,rgba(255,240,200,.28),transparent)', animation: `dibShine 4.4s ${s.s2} ease-in-out infinite` }} />}
        </span>
        {silueta ? (
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', font: "400 44px/1 'Instrument Serif',serif", color: 'rgba(243,213,154,.6)', transform: c.itf ?? 'none' }}>?</span>
        ) : (
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: c.it ?? 0, color: ink, animation: animado && c.ia === 'glow' ? `e_emGlow 2.8s ${s.s2} ease-in-out infinite` : 'none' }}>
            {animado && c.esp ? <Especial esp={c.esp} s={s} u={u} /> : <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: c.itf ?? 'none' }}><path d={IC[c.icono]} /></svg>}
          </span>
        )}
      </div>
    )
  }
  return (
    <span className={animado ? 'dib-mov' : 'dib-quieto'} style={{ display: 'inline-block', width: tam, height: tam, flex: 'none' }}>
      <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: caja, height: caja, transform: `scale(${(tam / caja).toFixed(3)})`, transformOrigin: '0 0' }}>
        <span style={{ position: 'absolute', inset: 14, borderRadius: '50%', background: `radial-gradient(circle,${halo},transparent 70%)`, animation: animado ? `dibGlow 3.6s ${s.s2} ease-in-out infinite` : 'none', opacity: silueta ? 0.3 : animado ? undefined : 0.6 }} />
        {cuerpo}
      </span>
    </span>
  )
}

/* ---------- las animaciones en bucle de cada emblema ---------- */
function Especial({ esp, s, u }: { esp: string; s: Record<string, string>; u: string }) {
  const sw = 'none' as const
  switch (esp) {
    case 'coliseo':
      return null
    case 'cre':
      return (
        <svg width="86" height="58" viewBox="0 0 60 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ overflow: 'visible' }}>
          <g style={{ animation: `e_hL 1.7s ${s.s1} cubic-bezier(.4,0,.2,1) both` }}><path d="M-2 29h10c3 0 6-1 9-2.5L27 21M13 28c1 2.5 4 3.5 7 2.5M17 26.5l2.2 2.2" /></g>
          <g style={{ animation: `e_hR 1.7s ${s.s1} cubic-bezier(.4,0,.2,1) both` }}><path d="M62 13H52c-3 0-6 1-9 2.5L33 21M47 14c-1-2.5-4-3.5-7-2.5M43 15.5l-2.2-2.2" /></g>
          <circle cx="30" cy="21" r="2.6" fill="#FFF4D6" stroke={sw} style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: `e_spk 2.6s ${s.s2} ease-out infinite` }} />
        </svg>
      )
    case 'ocu':
      return (
        <svg width="76" height="70" viewBox="0 0 60 56" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <defs><linearGradient id={u + 'bm'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF4D6" stopOpacity=".95" /><stop offset="1" stopColor="#FFF4D6" stopOpacity="0" /></linearGradient></defs>
          <g style={{ transformOrigin: '30px 21px', animation: `e_bswing 4.4s ${s.s2} ease-in-out infinite` }}>
            <polygon points="27,21 33,21 42,49 18,49" fill={`url(#${u}bm)`} stroke={sw} style={{ transformBox: 'fill-box', transformOrigin: '50% 0', animation: `e_beam 1.5s ${s.s1} ease-out both,e_bpulse 3s ${s.s2} ease-in-out infinite` }} />
            <ellipse cx="30" cy="49" rx="12" ry="1.8" fill="#FFF4D6" stroke={sw} style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: `e_lglow 1s ${s.s4} ease-out both` }} />
          </g>
          <path d="M6 44a24 24 0 0 1 48 0M2 44h56M6 50h48M11 50v-6M49 50v-6" />
          <ellipse cx="30" cy="20.4" rx="3.6" ry="1.2" />
        </svg>
      )
    case 'alba': {
      const ed = 'M2.5 19h19M3 19v-5.2q3.6-1.8 7.2-.6V19M4.6 19v-1.6M6.6 19v-1.6M8.6 19v-1.6M11.2 19v-3.8M12.8 19v-3.8M14.4 19v-3.8M10.8 15.2h4M15.6 19v-2.6l1.6-1.1 1.6 1.1M17.4 16.4a2.3 2.3 0 0 1 4.4 0V19'
      return (
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(-45deg)', overflow: 'visible' }}>
          <defs><clipPath id={u + 'sc'}><polygon points="12,-18 42,12 12,42 -18,12" /></clipPath></defs>
          <g clipPath={`url(#${u}sc)`}>
            <g style={{ filter: 'drop-shadow(0 0 2px #FFE3B8)', animation: `e_sunIn 8s ${s.s2} linear infinite` }}><circle cx="12" cy="7.5" r="2.4" /><path d="M12 3.6v.9M8.6 5l.6.6M15.4 5l-.6.6M7.3 7.5h.9M15.8 7.5h.9" /></g>
            <g style={{ animation: `e_monLit 8s ${s.s2} ease-in-out infinite` }}><path d={ed} /></g>
          </g>
        </svg>
      )
    }
    case 'noche': {
      const ed = 'M2.5 19h19M3 19v-5.2q3.6-1.8 7.2-.6V19M4.6 19v-1.6M6.6 19v-1.6M8.6 19v-1.6M11.2 19v-3.8M12.8 19v-3.8M14.4 19v-3.8M10.8 15.2h4M15.6 19v-2.6l1.6-1.1 1.6 1.1M17.4 16.4a2.3 2.3 0 0 1 4.4 0V19'
      return (
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(-45deg)', overflow: 'visible' }}>
          <defs><clipPath id={u + 'mc'}><polygon points="12,-18 42,12 12,42 -18,12" /></clipPath></defs>
          <g clipPath={`url(#${u}mc)`}>
            <g style={{ filter: 'drop-shadow(0 0 2px #DDE3FA)', animation: `e_moonIn 8s ${s.s2} linear infinite` }}><path d="M11.4 4.6a3.2 3.2 0 1 0 3.6 4.6 2.7 2.7 0 1 1-3.6-4.6z" /></g>
            <path d="M5.5 5.5l.3.8.8.3-.8.3-.3.8-.3-.8-.8-.3.8-.3zM18.6 4.6l.3.7.7.3-.7.3-.3.7-.3-.7-.7-.3.7-.3z" fill="currentColor" stroke={sw} style={{ animation: `e_nLights 8s ${s.s2} ease-in-out infinite` }} />
            <g style={{ animation: `e_monDark 8s ${s.s2} ease-in-out infinite` }}><path d={ed} /></g>
            <path d="M5.1 15.4h.01M7.1 15.1h.01M9.1 15.2h.01M12 17.6h.01M13.6 17.6h.01M19.6 17.8h.01" stroke="#FFD98C" strokeWidth="1.6" style={{ animation: `e_nLights 8s ${s.s2} ease-in-out infinite` }} />
          </g>
        </svg>
      )
    }
    case 'plaza':
      return (
        <svg width="62" height="62" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ overflow: 'visible' }}>
          <path d="M15.2 8.4A15 11.8 0 0 0 15.2 31.6M24.8 8.4A15 11.8 0 0 1 24.8 31.6" strokeWidth="2.6" />
          <path d="M16 11.4A11.4 8.8 0 0 0 16 28.6M24 11.4A11.4 8.8 0 0 1 24 28.6" strokeWidth="1" strokeDasharray=".1 2.2" opacity=".85" />
          <circle cx="20" cy="20" r="1.7" fill="currentColor" stroke={sw} />
          <path d="M17.8 8.3V2.6M22.2 8.3V2.6" strokeWidth=".9" opacity=".7" />
          <g transform="translate(20 2.4) scale(.4) translate(-52 -47)" strokeWidth="3.2"><path d="M40 47h24M42 47v-5a10 10 0 0 1 20 0v5M52 32v-4M50 30h4M46 47v-4M58 47v-4" /></g>
          <path d="M11 33.4H29" strokeWidth="1.4" strokeDasharray="2 1.6" style={{ animation: `e_frMarch 1.4s ${s.s2} linear infinite` }} />
        </svg>
      )
    case 'foro': {
      const L = (d: string, dl: string, w?: number) => <path d={d} pathLength={100} strokeDasharray={100} strokeWidth={w} style={{ strokeDashoffset: 100, animation: `e_milDraw 3.6s ${dl} ease-out infinite` }} />
      return (
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ overflow: 'visible' }}>
          {L('M10.6 17.6L3 21.6', s.s2)}{L('M11.3 17.6L6.4 22.4', s.s2)}{L('M7.6 19.6l1.6 1.2M5.4 20.6l1.4 1.3', s.s2, 1)}
          {L('M11.4 17.6L10.4 22.6', s.s3)}{L('M12.6 17.6L13.6 22.6', s.s3)}{L('M11.1 19.4h1.8M10.8 21h2.4', s.s3, 1)}
          {L('M13.4 17.6L21 21.6', s.s4)}{L('M12.7 17.6L17.6 22.4', s.s4)}{L('M16.4 19.6l-1.6 1.2M18.6 20.6l-1.4 1.3', s.s4, 1)}
          <path d="M8.6 17.6h6.8M9.2 16.2h5.6v1.4H9.2zM10 16.2V8.4M14 16.2V8.4M11.3 15.6V9M12.7 15.6V9M9.2 8.4h5.6M8.8 7h6.4v1.4H8.8zM10.4 7V5.8h3.2V7" />
        </svg>
      )
    }
    case 'boca':
      return (
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM7.5 9.5l2.5.5M16.5 9.5L14 10M12 11v2" />
          <ellipse cx="12" cy="16" rx="2.5" ry="2" style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: `e_mouthOC 2.8s ${s.s2} ease-in-out infinite` }} />
        </svg>
      )
    case 'mon':
      return (
        <svg width="70" height="70" viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          {[s.s1, s.s3, s.s4].map((d, i) => <ellipse key={i} cx="30" cy="40" rx="6" ry="2" style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: `e_rip 4s ${d} ease-out infinite` }} />)}
          <path d="M3 40c4-2.5 8 2.5 13 0s8 2.5 13 0 8 2.5 13 0 8 2.5 13 0" /><path d="M9 48c4-2 7 2 11 0s7 2 11 0 7 2 11 0" opacity=".5" />
          <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: `e_coin 4s ${s.s1} ease-in infinite` }}><circle cx="30" cy="12" r="6" /><circle cx="30" cy="12" r="3.2" /></g>
        </svg>
      )
    case 'lamp':
      return (
        <svg width="74" height="62" viewBox="0 0 60 50" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ overflow: 'visible' }}>
          <defs><radialGradient id={u + 'lg'}><stop offset="0" stopColor="#FFD58A" stopOpacity=".75" /><stop offset="1" stopColor="#FFD58A" stopOpacity="0" /></radialGradient></defs>
          <circle cx="49" cy="24" r="22" fill={`url(#${u}lg)`} stroke={sw} style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: `e_lglow 1.6s ${s.s3} ease-out both,e_bpulse 1.8s ${s.s2} ease-in-out infinite` }} />
          <path d="M8 38c2 6 26 6 32 1l10-5H40c-6-5-26-5-32 0zM8 38c-4 0-5 4-2 6M24 32v-3" />
          <path d="M50 33c-3.2-3-3.2-7.5 0-12.5 3.2 5 3.2 9.5 0 12.5z" fill="#FFD58A" stroke={sw} style={{ transformBox: 'fill-box', transformOrigin: '50% 100%', animation: `e_flame .9s ${s.s1} ease-out both,e_flick .35s ${s.s2} ease-in-out infinite alternate` }} />
        </svg>
      )
    case 'key':
      return (
        <svg width="104" height="120" viewBox="0 0 104 120" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', inset: 0, clipPath: KEY }}>
          <g style={{ transformOrigin: '52px 44px', animation: `e_kZoom 3.6s ${s.s5} ease-in-out infinite` }}>
            <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: `e_domeIn 1.6s ${s.s2} ease-out both` }}>
              <path d="M34 118L46 52M70 118L58 52M26 118L42 56M78 118L62 56" opacity=".55" />
              <path d="M40 47h24M42 47v-5a10 10 0 0 1 20 0v5M52 32v-4M50 30h4M46 47v-4M58 47v-4" />
            </g>
            <path d="M52 4a32 32 0 0 1 21 56l14 56H17l14-56A32 32 0 0 1 52 4z" strokeWidth="3" style={{ transformBox: 'view-box', transformOrigin: '52px 44px', animation: `e_zoomK 1.9s ${s.s1} cubic-bezier(.6,0,.9,.5) both` }} />
          </g>
        </svg>
      )
    default:
      return null
  }
}
