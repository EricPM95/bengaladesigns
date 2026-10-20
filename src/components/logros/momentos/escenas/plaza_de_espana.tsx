import type { ReactNode } from 'react'
import { CapaComun, Chispas, D, G, GF, GH, toC, type ConfigEscena, type FantasmaD, type PuntoD, type TrazoD } from './cine'

/** Plaza de España · los 135 escalones («Emblema Cine», E12): en oro, la barcaccia con sus chorros de agua, la escalinata con sus peldaños que suben de uno en uno y, arriba, la Trinità dei Monti; las farolas se encienden y su luz sube hasta el centro. */
function construir() {
  const WB = '#BFE4F2'
  const hw = (y: number) => 70 + (95 * (y - 280)) / 305
  const draw: TrazoD[] = [
    D('M70 650Q195 705 320 650', 0.3, 1.4, 1.6, GF),
    D('M95 640Q100 672 150 678H240Q290 672 295 640Q250 656 195 656Q140 656 95 640Z', 0.5, 1.4, 3),
    D('M95 640L84 616M295 640L306 616M118 664Q195 676 272 664', 1.4, 0.9, 2),
    D('M195 656V612M170 612H220M178 606H212', 1.9, 0.8, 2.2),
    D('M125 280L30 585M265 280L360 585', 2.4, 2.2, 3.2),
    D('M133 280L45 585M257 280L345 585', 2.7, 2.2, 1.4, GF),
    ...[355, 458].map((y, k) => D(`M${(195 - hw(y)).toFixed(0)} ${y}Q195 ${y + 20} ${(195 + hw(y)).toFixed(0)} ${y}`, 3.4 + k * 0.5, 1.2, 3)),
    // Los 29 peldaños: cada noveno, más grueso y en oro.
    ...Array.from({ length: 29 }, (_, k) => {
      const y = 583 - k * 10.5
      const w = hw(y)
      return D(`M${(195 - w).toFixed(0)} ${y.toFixed(0)}H${(195 + w).toFixed(0)}`, 3.3 + k * 0.1, 0.5, k % 9 === 0 ? 2.2 : 1.2, k % 9 === 0 ? G : GF)
    }),
    D('M195 280V585', 3.6, 1.2, 1, GF),
    D('M150 262V188H240V262M122 262H268', 6.2, 1.2, 2.6),
    D('M146 190L195 160L244 190Z', 6.9, 0.9, 2.6),
    D('M126 262V176H148V262M242 262V176H264V262', 7, 1.2, 2.4),
    D('M124 176H150L137 150ZM240 176H266L253 150Z', 7.5, 0.7, 2.2),
    D('M137 150V140M195 160V146M189 152H201M253 150V140', 7.8, 0.6, 2),
    D('M182 262V232a13 13 0 0 1 26 0V262M195 196a9 9 0 1 0 .01 0Z', 7.7, 0.8, 2),
  ]
  // Los chorros de la barcaccia, en azul agua.
  const chorro = (d: string, dl: number): TrazoD => D(d, dl, 1.2, 2.4, WB)
  draw.push(chorro('M195 612V566', 2.4), chorro('M195 566Q178 552 160 586', 2.8), chorro('M195 566Q212 552 230 586', 2.8), chorro('M195 604Q150 580 128 632', 3.2), chorro('M195 604Q240 580 262 632', 3.2))
  const ghost: FantasmaD[] = [GH('M160 140L190 80M230 140L200 80', 6, '2 6', 1.2), GH('M18 600Q195 720 372 600', 0.6, '3 6', 1.2, WB)]
  const farolas: [number, number][] = [[100, 380], [75, 430], [50, 500], [30, 560], [290, 380], [315, 430], [340, 500], [360, 560], [140, 300], [250, 300]]
  const dots: PuntoD[] = farolas.map(([x, y], k) => ({ x, y, r: 2.6 + (k % 3) * 0.6, d: 5 + k * 0.18, d2: 5.2 + (k % 5) * 0.3, l: 2.2 + (k % 4) * 0.5 }))
  const spk = toC(farolas, 5.6, 0.08)
  return { draw, ghost, dots, spk }
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
  fondo: 'linear-gradient(180deg,#1B1426 0%,#4A2A3A 34%,#9A5A44 58%,#241420 78%,#0F0A12 100%)',
  frases: [{ t: 'Ciento treinta y cinco escalones…', d: 1, l: 3 }, { t: '…y una barca que lleva siglos sin zarpar.', d: 4.4, l: 3 }],
  y: 740,
  orbe: { x: 0, y: 150 },
  orbeD: 6.4,
  orbeL: 1.2,
  Arte,
}
export default config
