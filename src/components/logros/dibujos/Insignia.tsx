/**
 * Las 11 insignias de colección de «Logros · Modelos» (sección 2). Cada insignia se parte en tantos pedazos como sitios tiene la colección,
 * y cada pedazo es siempre su sitio (el orden de `sitios` de data/logros/roma.json › colecciones). Pedazo ganado = color; pedazo que falta = gris.
 *
 * Formas (como en el diseño): imprescindibles = octógono de 8 teselas con gemas · país más pequeño = las llaves y la tiara (pieza «Insignia Principal»)
 * · 4 joyas = rombo de 4 piezas · alma de Trastevere y plazas = chapa · Miguel Ángel y Roma secreta = escudo · Bernini y miradores = hexágono
 * · Caravaggio = cinta · Roma antigua = arco.
 * Los sitios de cada colección están copiados aquí (para no cargar el JSON entero); si cambian en roma.json, hay que cambiarlos también aquí.
 */
import { useId } from 'react'
import type { CSSProperties } from 'react'
import { IC, ICONO_SITIO } from './iconos'
import InsigniaPrincipal from './piezas/InsigniaPrincipal'
import './dibujos.css'

const HEX = 'polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)'
const SHIELD = 'polygon(0 0,100% 0,100% 60%,50% 100%,0 60%)'
const GOLD = 'linear-gradient(135deg,#F6E7BD,#B9944F 45%,#F0DCA6 70%,#A88541)'
const FORMAS = {
  hexa: { w: 104, h: 118, clip: HEX, rad: '0', pb: 0 },
  escudo: { w: 104, h: 120, clip: SHIELD, rad: '0', pb: 18 },
  arco: { w: 98, h: 120, clip: 'none', rad: '49px 49px 14px 14px', pb: 0 },
  chapa: { w: 112, h: 112, clip: 'none', rad: '32px', pb: 0 },
} as const
type Forma = keyof typeof FORMAS

interface ColSolida {
  tipo: 'solida'
  forma: Forma
  icono: string
  fondo: string
  tinta?: string
  linea?: string
  borde?: string
  sitios: string[]
}
type Col =
  | { tipo: 'octogono'; sitios: string[] }
  | { tipo: 'vati'; sitios: string[] }
  | { tipo: 'joyas'; sitios: string[] }
  | { tipo: 'cinta'; icono: string; fondo: string; texto: string; sitios: string[] }
  | ColSolida

const COLS: Record<string, Col> = {
  imprescindibles: { tipo: 'octogono', sitios: ['coliseo', 'foro_romano_y_palatino', 'fontana_de_trevi', 'panteon', 'piazza_navona', 'plaza_de_espana', 'castillo_de_santangelo', 'trastevere'] },
  pais_mas_pequeno: { tipo: 'vati', sitios: ['museos_vaticanos_y_capilla_sixtina', 'basilica_de_san_pedro', 'plaza_de_san_pedro'] },
  cuatro_joyas: { tipo: 'joyas', sitios: ['coliseo', 'fontana_de_trevi', 'panteon', 'museos_vaticanos_y_capilla_sixtina'] },
  alma_trastevere: { tipo: 'solida', forma: 'chapa', icono: 'ropa', fondo: 'oklch(0.5 0.08 300)', sitios: ['isla_tiberina', 'iglesia_de_santa_maria_in_trastevere', 'san_pietro_in_montorio_y_tempietto_de_bramante', 'trastevere'] },
  miguel_angel: {
    tipo: 'solida', forma: 'escudo', icono: 'cincel', tinta: '#3C4048', linea: 'rgba(60,64,72,.28)', borde: 'linear-gradient(135deg,#FAFAF8,#C6C9CE 45%,#F1F2F1 70%,#AEB2B8)',
    fondo: 'linear-gradient(115deg,transparent 0 30%,rgba(120,126,136,.28) 31%,transparent 33% 58%,rgba(120,126,136,.2) 59.5%,transparent 61%),linear-gradient(35deg,transparent 0 44%,rgba(140,146,156,.22) 45%,transparent 47%),linear-gradient(160deg,#FFFFFF,#ECEDEB 55%,#D9DBDD)',
    sitios: ['museos_vaticanos_y_capilla_sixtina', 'basilica_de_san_pedro', 'plaza_del_campidoglio', 'iglesia_de_santa_maria_sopra_minerva'],
  },
  bernini: { tipo: 'solida', forma: 'hexa', icono: 'baldaquino', fondo: 'oklch(0.44 0.07 52)', sitios: ['piazza_navona', 'elefantino_de_bernini', 'plaza_de_san_pedro', 'basilica_de_san_pedro', 'puente_santangelo'] },
  caravaggio: { tipo: 'cinta', icono: 'cuadro', fondo: 'radial-gradient(circle at 34% 28%,#7A5430,#1E140C 70%)', texto: 'Tras los pasos de Caravaggio', sitios: ['iglesia_de_san_luigi_dei_francesi', 'santa_maria_del_popolo', 'galeria_borghese'] },
  roma_antigua: { tipo: 'solida', forma: 'arco', icono: 'loba', fondo: 'oklch(0.76 0.05 75)', tinta: '#3A2A0E', linea: 'rgba(58,42,14,.3)', sitios: ['coliseo', 'foro_romano_y_palatino', 'largo_di_torre_argentina', 'castillo_de_santangelo', 'circo_maximo', 'termas_de_caracalla'] },
  miradores: { tipo: 'solida', forma: 'hexa', icono: 'prism', fondo: 'linear-gradient(180deg,oklch(0.78 0.09 55),oklch(0.64 0.1 10) 55%,oklch(0.5 0.1 320))', sitios: ['mirador_del_janiculo', 'terraza_del_pincio', 'jardin_de_los_naranjos'] },
  plazas_y_fuentes: { tipo: 'solida', forma: 'chapa', icono: 'barcaccia', fondo: 'linear-gradient(160deg,oklch(0.74 0.09 188),oklch(0.5 0.09 212))', sitios: ['piazza_navona', 'piazza_del_popolo', 'plaza_de_espana', 'plaza_venecia', 'fontana_de_trevi', 'fontana_dellacqua_paola', 'fuente_del_triton'] },
  roma_secreta: { tipo: 'solida', forma: 'escudo', icono: 'secreta', fondo: 'radial-gradient(circle at 40% 28%,oklch(0.44 0.07 150),oklch(0.28 0.05 150) 75%)', sitios: ['ojo_de_la_cerradura_del_aventino', 'piramide_cestia', 'basilica_de_san_clemente', 'san_pietro_in_montorio_y_tempietto_de_bramante', 'fuente_de_las_tortugas'] },
}

export function sitiosDeColeccion(coleccion: string): string[] {
  return COLS[coleccion]?.sitios ?? []
}

/** La insignia de una colección con sus pedazos. */
export function InsigniaDibujo({ coleccion, ganados = [], completa = false, tam = 120, animada = false }: { coleccion: string; ganados?: string[]; completa?: boolean; tam?: number; animada?: boolean }) {
  const c = COLS[coleccion]
  if (!c) return <span style={{ width: tam, height: tam, display: 'inline-block' }} />
  const on = c.sitios.map((s) => completa || ganados.includes(s))
  let cuerpo
  if (c.tipo === 'octogono') cuerpo = <Octogono on={on} sitios={c.sitios} completa={on.every(Boolean)} tam={tam} />
  else if (c.tipo === 'vati')
    cuerpo = (
      <span style={{ display: 'inline-block', width: tam, height: tam }}>
        <InsigniaPrincipal design="vati" size={tam} set={on.map((x, i) => (x ? i : -1)).filter((i) => i >= 0).join(',') || '9'} />
      </span>
    )
  else if (c.tipo === 'joyas') cuerpo = <Joyas on={on} tam={tam} />
  else cuerpo = <Solida c={c} on={on} tam={tam} />
  return (
    <span className={animada ? 'dib-mov' : 'dib-quieto'} style={{ display: 'inline-block', width: tam, height: tam, flex: 'none' }}>
      {cuerpo}
    </span>
  )
}

/* ---------- octógono (8 teselas) ---------- */
const P = (a: number, r: number): [number, number] => [75 + r * Math.cos(a), 75 + r * Math.sin(a)]
const f1 = (n: number) => n.toFixed(1)
const DG = Math.PI / 180
const HUES = [5, 35, 70, 140, 185, 230, 280, 330]
const octTeselas = Array.from({ length: 8 }, (_, k) => {
  const R = 72, r = 30
  const a0 = (-90 - 22.5 + k * 45) * DG, a1 = a0 + 45 * DG, am = (a0 + a1) / 2
  const pts = [P(a0, R), P(a1, R), P(a1, r), P(a0, r)].map((p) => p.map(f1).join(' '))
  const ins = [P(a0 + 3 * DG, R - 5), P(a1 - 3 * DG, R - 5), P(a1 - 6 * DG, r + 5), P(a0 + 6 * DG, r + 5)].map((p) => p.map(f1).join(' '))
  const [ix, iy] = P(am, 48)
  const [gx, gy] = P(am, 63)
  return { tile: 'M' + pts.join('L') + 'Z', inner: 'M' + ins.join('L') + 'Z', it: `translate(${(ix - 8.4).toFixed(1)} ${(iy - 8.4).toFixed(1)}) scale(.7)`, gx: gx.toFixed(1), gy: gy.toFixed(1) }
})
const poli = (n: number, r: number, ang0: number) => 'M' + Array.from({ length: n }, (_, k) => { const a = (ang0 + (360 / n) * k) * DG; return f1(75 + r * Math.cos(a)) + ' ' + f1(75 + r * Math.sin(a)) }).join('L') + 'Z'
const oct = (r: number, ang0: number) => poli(8, r, ang0)

function Octogono({ on, sitios, completa, tam }: { on: boolean[]; sitios: string[]; completa: boolean; tam: number }) {
  const u = useId().replace(/:/g, '')
  const n = on.filter(Boolean).length
  return (
    <svg width={tam} height={tam} viewBox="0 0 150 150" style={{ overflow: 'visible', filter: `drop-shadow(0 ${tam * 0.07}px ${tam * 0.09}px rgba(60,40,10,${n ? 0.3 : 0.12}))` }}>
      <defs>
        {HUES.map((h, k) => (
          <linearGradient key={k} id={`${u}m${k}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={`oklch(0.84 0.13 ${h})`} />
            <stop offset=".55" stopColor={`oklch(0.66 0.18 ${h})`} />
            <stop offset="1" stopColor={`oklch(0.46 0.15 ${h})`} />
          </linearGradient>
        ))}
        <radialGradient id={`${u}g`} cx=".32" cy=".28" r=".8"><stop offset="0" stopColor="#FFFFFF" /><stop offset=".35" stopColor="#FFF6E8" /><stop offset="1" stopColor="#C9B08A" /></radialGradient>
        <linearGradient id={`${u}c`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset=".45" stopColor="#F3E3B8" /><stop offset="1" stopColor="#B9944F" /></linearGradient>
        <linearGradient id={`${u}f`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity=".45" /><stop offset=".5" stopColor="#FFFFFF" stopOpacity=".06" /><stop offset="1" stopColor="#FFFFFF" stopOpacity=".22" /></linearGradient>
      </defs>
      {octTeselas.map((t, k) => {
        const si = on[k]
        return (
          <g key={k}>
            <path d={t.tile} fill={si ? `url(#${u}m${k})` : '#EFE9DD'} stroke={si ? '#E4C78A' : '#CDBFA6'} strokeDasharray={si ? 'none' : '3 3'} strokeWidth={1.7} strokeLinejoin="round" />
            {si && <path d={t.inner} fill={`url(#${u}f)`} stroke="rgba(255,244,236,.4)" strokeWidth={0.9} />}
            <g transform={t.it} fill="none" stroke={si ? '#FFF7F0' : 'rgba(28,34,48,.28)'} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <path d={IC[ICONO_SITIO[sitios[k]] ?? 'col']} />
            </g>
            {si && <circle cx={t.gx} cy={t.gy} r={3.4} fill={`url(#${u}g)`} stroke="#E4C78A" strokeWidth={0.8} />}
          </g>
        )
      })}
      <path d={oct(72, -112.5)} fill="none" stroke={completa ? '#F3E3B8' : '#CDBFA6'} strokeWidth={2.4} strokeLinejoin="round" />
      {completa ? (
        <g>
          <path d={oct(25, -90)} fill={`url(#${u}c)`} stroke="#E4C78A" strokeWidth={2} />
          <path d={Array.from({ length: 8 }, (_, k) => { const a = (-90 + k * 45) * DG; return `M${f1(75 + 12 * Math.cos(a))} ${f1(75 + 12 * Math.sin(a))}L${f1(75 + 25 * Math.cos(a))} ${f1(75 + 25 * Math.sin(a))}` }).join('')} fill="none" stroke="rgba(255,255,255,.7)" strokeWidth={0.8} />
          <path d={oct(12, -90)} fill="rgba(255,255,255,.6)" stroke="rgba(255,240,244,.8)" strokeWidth={0.8} />
        </g>
      ) : (
        <g>
          <circle cx={75} cy={75} r={26} fill="#F5EFE4" stroke="#CDBFA6" strokeWidth={1.4} strokeDasharray="3 3" />
          <text x={75} y={80} textAnchor="middle" fontFamily="Instrument Serif, serif" fontSize={17} fill="#1C2230">{n} de {on.length}</text>
        </g>
      )}
    </svg>
  )
}

/* ---------- las 4 joyas (rombo) ---------- */
const JP = [['0px', '0px', '14px 4px 4px 4px', '39px', '39px'], ['58px', '0px', '4px 14px 4px 4px', '6px', '39px'], ['0px', '58px', '4px 4px 4px 14px', '39px', '6px'], ['58px', '58px', '4px 4px 14px 4px', '6px', '6px']] as const
const JI = ['arco', 'fuente', 'panteon', 'techo']
const JG = [['#D21E45', '#6A0A1E'], ['#16A06A', '#06482E'], ['#2A5BC8', '#0E2560'], ['#EAA22A', '#7A4A08']]
function Joyas({ on, tam }: { on: boolean[]; tam: number }) {
  const lleno = on.every(Boolean)
  return (
    <span style={{ position: 'relative', display: 'block', width: tam, height: tam }}>
      <span style={{ position: 'absolute', left: '50%', top: '50%', width: 112, height: 112, margin: '-56px 0 0 -56px', transform: `scale(${(tam / 150).toFixed(3)}) rotate(45deg)` }}>
        {JP.map(([x, y, rad, gl, gt], j) => {
          const si = on[j]
          const est: CSSProperties = {
            position: 'absolute', left: x, top: y, width: 54, height: 54, borderRadius: rad, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: si ? 'linear-gradient(140deg,#FFFCF2 0%,#FFF9EA 30%,#EBDAB0 100%)' : '#EFE9DD', border: `1.5px ${si ? 'solid' : 'dashed'} ${si ? '#C9A65E' : '#CDBFA6'}`,
            boxShadow: si ? 'inset 0 0 0 2px rgba(255,250,232,.9),inset -5px -7px 12px rgba(150,115,50,.22),0 0 12px rgba(255,244,214,.8),0 10px 18px -8px rgba(60,40,10,.5)' : 'none',
          }
          return (
            <span key={j} style={est}>
              {si && (
                <>
                  <svg width="54" height="54" viewBox="0 0 57 57" style={{ position: 'absolute', inset: 0 }}>
                    <path d="M11 11H46V46H11Z" fill="rgba(255,255,255,.28)" stroke="rgba(255,255,255,.95)" strokeWidth="1" />
                    <path d="M0 0L11 11M57 0L46 11M57 57L46 46M0 57L11 46M11 11L46 46M46 11L11 46" stroke="rgba(201,166,94,.35)" strokeWidth=".7" />
                    <path d="M0 0H57L46 11H11Z" fill="rgba(255,255,255,.65)" /><path d="M0 0V57L11 46V11Z" fill="rgba(255,255,255,.35)" />
                    <path d="M57 0V57L46 46V11Z" fill="rgba(170,130,60,.16)" /><path d="M0 57H57L46 46H11Z" fill="rgba(150,110,45,.24)" />
                    <path d="M11 11L28.5 11L11 28.5Z" fill="rgba(255,255,255,.7)" />
                  </svg>
                  <span style={{ position: 'absolute', left: gl, top: gt, width: 11, height: 11, borderRadius: 2, background: `radial-gradient(circle at 32% 28%,#FFFFFF 0 10%,${JG[j][0]} 46%,${JG[j][1]} 100%)`, border: '1px solid #C9A65E', boxShadow: `0 0 6px ${JG[j][0]}` }} />
                </>
              )}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', stroke: si ? '#8A6A2C' : 'rgba(28,34,48,.28)', transform: 'rotate(-45deg)' }}>
                <path d={IC[JI[j]]} />
              </svg>
            </span>
          )
        })}
        <span style={{ position: 'absolute', inset: -4, borderRadius: 18, border: `2px ${lleno ? 'solid' : 'dashed'} ${lleno ? 'oklch(0.86 0.09 85)' : 'rgba(28,34,48,.15)'}`, boxShadow: lleno ? '0 0 22px oklch(0.86 0.09 85 / .5)' : 'none' }} />
      </span>
    </span>
  )
}

/* ---------- formas sólidas partidas en pedazos (chapa, escudo, hexágono, arco) y la cinta ---------- */
function cuña(j: number, n: number) {
  const a0 = -Math.PI / 2 + (j * 2 * Math.PI) / n + 0.3
  const a1 = a0 + (2 * Math.PI) / n
  const pts = ['50% 50%']
  for (let t = 0; t <= 4; t++) {
    const a = a0 + ((a1 - a0) * t) / 4
    pts.push(`${(50 + 90 * Math.cos(a)).toFixed(1)}% ${(50 + 90 * Math.sin(a)).toFixed(1)}%`)
  }
  return `polygon(${pts.join(',')})`
}

function Solida({ c, on, tam }: { c: ColSolida | Extract<Col, { tipo: 'cinta' }>; on: boolean[]; tam: number }) {
  const N = on.length
  const hay = on.some(Boolean)
  if (c.tipo === 'cinta') {
    const W = 196, H = 70
    const CIN = 'polygon(0 0,100% 0,91% 50%,100% 100%,0 100%,9% 50%)'
    return (
      <span style={{ position: 'relative', display: 'block', width: tam, height: tam }}>
        <span style={{ position: 'absolute', left: '50%', top: '50%', width: W, height: H, margin: `${-H / 2}px 0 0 ${-W / 2}px`, transform: `scale(${(tam / 200).toFixed(3)})`, filter: hay ? 'drop-shadow(0 10px 12px rgba(28,34,48,.25))' : 'none' }}>
          {on.map((si, j) => (
            <span key={j} style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${(((N - 1 - j) / N) * 100).toFixed(2)}% 0 ${((j / N) * 100).toFixed(2)}%)` }}>
              <span style={{ position: 'absolute', inset: 0, clipPath: CIN, background: si ? GOLD : '#DCD4C5' }} />
              <span style={{ position: 'absolute', inset: 0, clipPath: CIN, transform: 'scale(.94,.84)', background: si ? c.fondo : '#EFE9DD' }} />
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '0 28px', color: si ? '#F7EBCB' : 'rgba(28,34,48,.3)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><path d={IC[c.icono]} /></svg>
                <span style={{ font: "400 15px/1.05 'Instrument Serif',serif", textAlign: 'left', textWrap: 'balance' as CSSProperties['textWrap'] }}>{c.texto}</span>
              </span>
            </span>
          ))}
        </span>
      </span>
    )
  }
  const F = FORMAS[c.forma]
  const tinta = c.tinta ?? '#F7EBCB'
  const linea = c.linea ?? 'rgba(247,235,203,.35)'
  const borde = c.borde ?? GOLD
  const seams = Array.from({ length: N }, (_, j) => { const a = -Math.PI / 2 + (j * 2 * Math.PI) / N + 0.3; return `M50 52L${(50 + 60 * Math.cos(a)).toFixed(1)} ${(52 + 60 * Math.sin(a)).toFixed(1)}` })
  return (
    <span style={{ position: 'relative', display: 'block', width: tam, height: tam }}>
      <span style={{ position: 'absolute', left: '50%', top: '50%', width: F.w, height: F.h, margin: `${-F.h / 2}px 0 0 ${-F.w / 2}px`, transform: `scale(${(tam / 130).toFixed(3)})`, filter: hay ? 'drop-shadow(0 12px 14px rgba(28,34,48,.28))' : 'none' }}>
        {on.map((si, j) => (
          <span key={j} style={{ position: 'absolute', inset: 0, clipPath: cuña(j, N) }}>
            <span style={{ position: 'absolute', inset: 0, clipPath: F.clip, borderRadius: F.rad, background: si ? borde : '#DCD4C5' }} />
            <span style={{ position: 'absolute', inset: 0, clipPath: F.clip, borderRadius: F.rad, transform: 'scale(.88)', background: si ? c.fondo : '#EFE9DD', overflow: 'hidden' }} />
            {si && <span style={{ position: 'absolute', inset: 0, clipPath: F.clip, borderRadius: F.rad, transform: 'scale(.8)', boxShadow: `inset 0 0 0 1px ${linea}` }} />}
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: F.pb, color: si ? tinta : 'rgba(28,34,48,.3)' }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={IC[c.icono]} /></svg>
            </span>
          </span>
        ))}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', clipPath: F.clip, borderRadius: F.rad, transform: 'scale(.88)', pointerEvents: 'none' }}>
          {seams.map((s, k) => (
            <path key={k} d={s} fill="none" stroke={on[k] || on[(k + N - 1) % N] ? linea : 'rgba(28,34,48,.12)'} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
      </span>
    </span>
  )
}
