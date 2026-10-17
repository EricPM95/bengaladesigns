/**
 * La medalla de las 7 maravillas («Medalla Maravillas» de Logros · Modelos): una sola medalla en 7 partes. Cada maravilla vista se enciende en oro y las que faltan
 * siguen apagadas (una capa gris por maravilla, de `public/medalla/`). Las estrellas de arriba se encienden según cuántas lleva (centradas). Con las 7, la medalla entera.
 */
import './dibujos.css'
import './Medalla.css'

/** ids de `viajero.json › maravillas` → nombre del archivo de la capa */
const CAPA: Record<string, string> = { coliseo: 'coliseo', gran_muralla: 'muralla', petra: 'petra', cristo_redentor: 'cristo', machu_picchu: 'machu', chichen_itza: 'chichen', taj_mahal: 'tajmahal' }
const ORDEN = ['coliseo', 'chichen_itza', 'cristo_redentor', 'gran_muralla', 'machu_picchu', 'petra', 'taj_mahal']

const estrella = (cx: number, cy: number, r: number) => {
  let d = ''
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r
    d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1)
  }
  return d + 'Z'
}

export function MedallaDibujo({ encendidas = [], tam = 220, animada = true }: { encendidas?: string[]; tam?: number; animada?: boolean }) {
  const vistas = ORDEN.filter((k) => encendidas.includes(k))
  const cnt = vistas.length
  const k = tam / 516
  const CX = 258, CY = 282, R = 236
  const s0 = Math.floor((7 - cnt) / 2)
  const estrellas = Array.from({ length: 7 }, (_, i) => {
    const a = Math.PI + ((i + 1) / 8) * Math.PI
    const on = i >= s0 && i < s0 + cnt
    return { d: estrella(CX + R * Math.cos(a), CY + R * Math.sin(a) * 0.98, on ? 21 : 16), on, i }
  })
  const apagadas = ORDEN.filter((id) => !vistas.includes(id))
  const capa: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }
  return (
    <span className={animada ? 'dib-mov' : 'dib-quieto'} style={{ position: 'relative', display: 'inline-block', width: tam, height: 601 * k, flex: 'none', filter: 'drop-shadow(0 18px 26px rgba(0,0,0,.55))' }}>
      <img src="/medalla/medalla-7-maravillas-limpia.webp" alt="Las 7 maravillas del mundo" style={capa} loading="lazy" decoding="async" />
      {apagadas.map((id) => <img key={id} src={`/medalla/mm-off-${CAPA[id]}.webp`} alt="" style={capa} loading="lazy" decoding="async" />)}
      <span style={{ position: 'absolute', left: 46 * k, top: 70 * k, width: 424 * k, height: 424 * k, borderRadius: '50%', overflow: 'hidden', pointerEvents: 'none', mixBlendMode: 'screen' }}>
        <span style={{ position: 'absolute', top: '-20%', bottom: '-20%', left: 0, width: '22%', background: 'linear-gradient(90deg,transparent,rgba(255,240,200,.35),transparent)', animation: 'mmSheen 5s 1s ease-in-out infinite' }} />
      </span>
      <svg viewBox="0 0 516 601" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
        {estrellas.map((e) => (
          <path key={e.i} d={e.d} fill={e.on ? '#FFE6A0' : '#141A30'} stroke={e.on ? '#FFF8E0' : 'rgba(200,170,105,.6)'} strokeWidth={2.4} strokeLinejoin="round"
            style={{ transformBox: 'fill-box', transformOrigin: 'center', filter: e.on ? 'drop-shadow(0 0 8px rgba(255,214,140,.9))' : 'none', animation: e.on ? `mmStar 2.4s ${(e.i * 0.2).toFixed(1)}s ease-in-out infinite` : 'none' }} />
        ))}
      </svg>
    </span>
  )
}
