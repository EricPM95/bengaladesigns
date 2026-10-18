import type { ReactNode } from 'react'
import type { Momento } from '../../../../lib/logros'
import { PantallaDeMomento } from '../../momentos/pantallas'
import { planificar } from '../../momentos/plan'

/**
 * [Volver a ver]: pone otra vez la pantalla de lo ganado (la misma que salió al ganarlo) sin sorpresas nuevas, sin el resumen del día y sin marcar nada. Se cierra tocando la pantalla.
 * Va en su propio archivo: solo se baja al tocar [Volver a ver].
 */
export default function Repetir({ momento, alCerrar }: { momento: Momento; alCerrar: () => void }): ReactNode {
  const pantalla = planificar([momento])[0]
  if (!pantalla) return null
  return <PantallaDeMomento pantalla={pantalla} estado={null} onSeguir={alCerrar} onSaltarTodo={null} paso={null} />
}
