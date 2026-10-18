import type { ReactNode } from 'react'
import { Chapa, Emblema, Insignia, Sello, type GradoDeSello } from '../../dibujos'
import type { PiezaReciente } from './api'

/** Un logro ganado dibujado con su dibujo de siempre (sello, emblema encontrado, colección completa, chapa de viajero). Solo se llama con cosas ya ganadas: un emblema oculto sin encontrar nunca llega aquí. */
export function PiezaDeVitrina({ pieza, tam }: { pieza: PiezaReciente; tam: number }): ReactNode {
  if (pieza.logro === 'sello') {
    const [id, grado] = pieza.escalon.split(':')
    return <Sello id={id} grado={grado as GradoDeSello} tam={tam} animado={false} />
  }
  if (pieza.logro === 'emblema') return <Emblema id={pieza.escalon} tam={tam} />
  if (pieza.logro === 'coleccion') return <Insignia coleccion={pieza.escalon} completa tam={tam} />
  if (pieza.logro.startsWith('viajero:')) return <Chapa logro={pieza.logro.slice('viajero:'.length)} escalon={pieza.escalon === '' ? undefined : pieza.escalon} tam={tam} />
  return null
}
