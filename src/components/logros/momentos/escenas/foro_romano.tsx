import type { ReactNode } from 'react'
import { CapaComun, Chispas, D, GF, GH, toC, type ConfigEscena, type PuntoD, type TrazoD } from './cine'

/** Foro Romano · donde empezó todo («Emblema Cine», E3): en fantasma, las ruinas; en oro, el Miliario de Oro, y desde su base cinco calzadas con sus losas que se llenan de lucecitas como viajeros. */
function construir() {
  const draw: TrazoD[] = [
    D('M150 472H240', 0.4, 0.8, 2),
    D('M160 472V462H230V472', 0.5, 0.6, 1.6),
    D('M170 462V448H220V462', 0.7, 0.6, 1.6),
    D('M178 448V330M212 448V330', 1, 1.2, 2.4),
    D('M186 440V338M195 440V338M204 440V338', 1.4, 1, 1, GF),
    D('M170 330H220V316H170Z', 1.9, 0.6, 2),
    D('M176 316V306H214V316', 2.1, 0.5, 1.6),
    D('M184 306V298H206V306', 2.2, 0.4, 1.4),
  ]
  const R = [-60, 70, 195, 320, 450]
  R.forEach((xb, k) => {
    const x0 = 195 + (xb - 195) * 0.04
    const lx0 = x0 - 7
    const rx0 = x0 + 7
    const lx1 = xb - 46
    const rx1 = xb + 46
    const dl = 2.8 + Math.abs(k - 2) * 0.25
    draw.push(D(`M${lx0.toFixed(1)} 474L${lx1} 844`, dl, 1.6, 1.8), D(`M${rx0.toFixed(1)} 474L${rx1} 844`, dl, 1.6, 1.8))
    ;[0.18, 0.36, 0.56, 0.78].forEach((t, j) => {
      const y = 474 + (844 - 474) * t
      const lx = lx0 + (lx1 - lx0) * t
      const rx = rx0 + (rx1 - rx0) * t
      draw.push(D(`M${lx.toFixed(1)} ${y.toFixed(1)}L${rx.toFixed(1)} ${y.toFixed(1)}`, dl + 0.35 + j * 0.25, 0.5, 1, GF))
    })
  })
  const ppl: [number, number][] = []
  R.forEach((xb) => {
    ;[0.3, 0.55, 0.8].forEach((t) => ppl.push([195 + (xb - 195) * t, 474 + (844 - 474) * t]))
  })
  const dots: PuntoD[] = ppl.map(([x, y], k) => ({ x: Math.round(x), y: Math.round(y), r: 2 + (k % 3) * 0.6, d: 4.4 + k * 0.06, d2: 4.6 + (k % 5) * 0.3, l: 2.4 + (k % 4) * 0.5 }))
  const ghost = [
    GH('M30 472V300M58 472V300M86 472V300M24 300H92L58 270Z', 1.2),
    GH('M300 472V330H372V472M300 352H372M318 472V400A18 18 0 0 1 354 400V472', 1.3),
    GH('M100 472V360M120 472V380', 1.4, '2 5'),
  ]
  const spk = toC(ppl.map(([x, y]) => [Math.round(x), Math.round(y)] as [number, number]), 6, 0.05)
  return { draw, dots, ghost, spk }
}
const DATOS = construir()

function Arte(): ReactNode {
  return (
    <>
      <CapaComun ghost={DATOS.ghost} draw={DATOS.draw} dots={DATOS.dots} />
      <Chispas pts={DATOS.spk} />
    </>
  )
}
const config: ConfigEscena = {
  fondo: 'radial-gradient(circle at 50% 46%,#2E2218 0%,#130D09 72%)',
  frases: [{ t: 'Aquí, en el corazón del Foro…', d: 1, l: 3 }, { t: 'Todos los caminos del Imperio empezaban en esta columna.', d: 4.4, l: 3 }],
  y: 200,
  orbe: { x: 0, y: 90 },
  orbeD: 6.6,
  orbeL: 1.2,
  Arte,
}
export default config
