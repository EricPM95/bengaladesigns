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

/** Dónde está cada maravilla dentro de la imagen de 516 × 601: [centro x, centro y, tamaño] (de «Medalla Siete»). */
const POS: Record<string, [number, number, number]> = { coliseo: [152, 263, 141], gran_muralla: [273, 223, 192], petra: [373, 341, 168], cristo_redentor: [383, 245, 121], machu_picchu: [153, 342, 150], chichen_itza: [261, 372, 165], taj_mahal: [274, 290, 159] }

/** `destello`: el id de la maravilla que se acaba de encender (8B3): su pedazo recibe un fogonazo y un aro de luz, para que se vea CUÁL se enciende. */
export function MedallaDibujo({ encendidas = [], tam = 220, animada = true, destello = null }: { encendidas?: string[]; tam?: number; animada?: boolean; destello?: string | null }) {
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
      {/* Las apagadas, más oscuras y grises (8B3): así el pedazo encendido se distingue de golpe. */}
      {apagadas.map((id) => <img key={id} src={`/medalla/mm-off-${CAPA[id]}.webp`} alt="" style={{ ...capa, filter: 'brightness(.62) saturate(.55)' }} loading="lazy" decoding="async" />)}
      {destello && POS[destello] && (
        <>
          <span aria-hidden className="mo-con-mov" style={{ position: 'absolute', left: (POS[destello][0] - POS[destello][2]) * k, top: (POS[destello][1] - POS[destello][2]) * k, width: POS[destello][2] * 2 * k, height: POS[destello][2] * 2 * k, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,236,170,.9),rgba(255,200,110,.35) 45%,transparent 70%)', mixBlendMode: 'screen', opacity: 0, animation: 'mmFogonazo 1.6s ease-out both', pointerEvents: 'none' }} />
          <span aria-hidden className="mo-con-mov" style={{ position: 'absolute', left: (POS[destello][0] - POS[destello][2] * 0.5) * k, top: (POS[destello][1] - POS[destello][2] * 0.5) * k, width: POS[destello][2] * k, height: POS[destello][2] * k, borderRadius: '50%', border: '3px solid #FFE6A0', opacity: 0, animation: 'mmAro 1.4s .1s ease-out both', pointerEvents: 'none' }} />
        </>
      )}
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
