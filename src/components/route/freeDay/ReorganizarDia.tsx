import { useState } from 'react'
import { Icono } from '../../ui/Icono'
import { puedeReorganizar, reorganizarElDia } from '../../../lib/reorganizarDia'
import type { DayPlan } from '../../../lib/types'

/**
 * «Reorganizar este día» (Tanda 6y, punto 3): junto a «Añadir parada», en cada día con dos paradas o más (la ruta a mano y los días de la nuestra que el viajero ha cambiado a mano).
 * Pone las mismas paradas en el orden de nuestros días escritos (solo ordena: no añade, no quita, no mueve de día). Sale «Día reorganizado» con «Deshacer»; si ya estaba bien,
 * «Tu día ya está en buen orden» y no cambia nada. La regla vive en el servidor, en un solo sitio (shared/routeEngine/reorganizarDia.js); aquí solo el botón.
 */
export function ReorganizarDia({ day }: { day: DayPlan }) {
  const [trabajando, setTrabajando] = useState(false)
  if (!puedeReorganizar(day)) return null

  const reorganizar = async () => {
    if (trabajando) return
    setTrabajando(true)
    await reorganizarElDia(day.id)
    setTrabajando(false)
  }

  return (
    <button
      type="button"
      onClick={reorganizar}
      disabled={trabajando}
      className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-medium text-text/70 transition-colors hover:bg-bg-hover disabled:opacity-60"
    >
      <Icono nombre="reorg" size={16} />
      Reorganizar este día
    </button>
  )
}
