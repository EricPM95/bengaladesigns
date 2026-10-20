import type { ReactNode } from 'react'
import { CapaComun, Chispas, D, G, GF, GH, toC, type ConfigEscena, type FantasmaD, type PuntoD, type TrazoD } from './cine'

/** Castillo de Sant'Angelo · tumba de emperador («Emblema Cine», E13): una calle de farolas y el Puente de Sant'Angelo llevan hasta el castillo; la cámara avanza mientras se dibujan sus muros, el cilindro, las almenas y, arriba, el ángel con la espada. Las farolas se encienden y su luz sube hasta el centro. */
function construir() {
  const VX = 195
  const VY = 430
  const hw = (y: number) => 12 + (y - VY) * 0.565
  const ys = [446, 462, 482, 508, 540, 580, 630, 690, 760, 840]
  const draw: TrazoD[] = [
    D('M183 430L-60 860M207 430L450 860', 0.2, 1.6, 2.6),
    D('M183 428L-60 770M207 428L450 770', 0.5, 1.6, 1.8),
    ...ys.map((y, k) => D(`M${(VX - hw(y)).toFixed(0)} ${y}H${(VX + hw(y)).toFixed(0)}`, 0.4 + k * 0.34, 0.5, k % 3 === 0 ? 2.2 : 1.2, k % 3 === 0 ? G : GF)),
    // Los pretiles del puente: a cada lado, un tramo por peldaño.
    ...ys.slice(0, 9).flatMap((y, k) => {
      const h = (y - VY) * 0.52 + 6
      const xl = VX - hw(y)
      const xr = VX + hw(y)
      return [D(`M${xl.toFixed(0)} ${y}V${(y - h).toFixed(0)}`, 0.6 + k * 0.34, 0.4, 2), D(`M${xr.toFixed(0)} ${y}V${(y - h).toFixed(0)}`, 0.6 + k * 0.34, 0.4, 2)]
    }),
    D('M195 430V840', 1.5, 2.2, 1.2, GF),
    D('M85 430V345H305V430', 3.2, 1.4, 3),
    D('M85 345v-9h14v9M117 345v-9h14v9M149 345v-9h14v9M181 345v-9h14v9M213 345v-9h14v9M245 345v-9h14v9M277 345v-9h14v9', 4.3, 0.8, 2.2),
    D('M175 430V404a20 20 0 0 1 40 0V430M105 392v14M285 392v14', 4.6, 0.8, 2, GF),
    D('M120 345V215H270V345M120 280Q195 298 270 280', 5, 1.4, 3),
    D('M120 215Q195 232 270 215M150 215v-9h12v9M175 215v-9h12v9M200 215v-9h12v9M225 215v-9h12v9', 5.8, 0.9, 2.2),
    D('M140 250v18M195 254v18M250 250v18', 6, 0.6, 2, GF),
    D('M150 206V150H240V206M150 160Q195 174 240 160', 6.4, 1, 2.6),
    D('M156 150Q195 100 234 150', 7, 0.8, 2.6),
    D('M195 118V96M195 96l-26-30Q184 62 195 76M195 96l26-30Q206 62 195 76M212 74V40', 7.5, 1.1, 2.4),
  ]
  const farolas: [number, number][] = []
  ys.slice(0, 9).forEach((y) => {
    const h = (y - VY) * 0.52 + 6
    farolas.push([VX - hw(y), y - h - 4], [VX + hw(y), y - h - 4])
  })
  const ghost: FantasmaD[] = [GH('M60 360Q195 300 330 360M20 300Q195 240 370 300', 1.2, '3 8', 1)]
  const dots: PuntoD[] = farolas.map(([x, y], k) => ({ x: Math.round(x), y: Math.round(y), r: 2 + (k % 4) * 0.5, d: 1.2 + k * 0.32, d2: 1.4 + (k % 5) * 0.3, l: 2.2 + (k % 4) * 0.5 }))
  const spk = toC(farolas.map(([x, y]) => [Math.round(x), Math.round(y)] as [number, number]), 5.6, 0.08)
  return { draw, ghost, dots, spk }
}
const DATOS = construir()

function Arte(): ReactNode {
  return (
    <>
      {/* La cámara avanza hacia el castillo mientras se dibuja (el diseño: `ecCam`, de 1 a 1,3 desde el punto de fuga). */}
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '195px 300px', animation: 'ecCam 8s cubic-bezier(.4,0,.3,1) both' }}>
        <CapaComun ghost={DATOS.ghost} draw={DATOS.draw} dots={DATOS.dots} />
      </div>
      <Chispas pts={DATOS.spk} />
    </>
  )
}
const config: ConfigEscena = {
  fondo: 'linear-gradient(180deg,#1A1B3A 0%,#4A3050 26%,#C0683C 46%,#3A2230 62%,#1A1218 100%)',
  frases: [{ t: 'Cruzas el puente…', d: 1, l: 3 }, { t: '…y el castillo se alza ante ti.', d: 4.4, l: 3 }],
  y: 740,
  orbe: { x: 0, y: 150 },
  orbeD: 6.4,
  orbeL: 1.2,
  Arte,
}
export default config
