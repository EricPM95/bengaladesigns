import { modoDeFoto } from '../../../lib/fotosViaje'
import { useFotosViaje } from '../../../lib/useFotosViaje'
import { useRouteStore } from '../../../store/useRouteStore'
import { Icono } from '../../ui/Icono'
import { BotonFoto } from './BotonFoto'

/**
 * «Añadir foto» en la ficha de cada parada (Tanda 6z6; gratis y de pago). La foto va a esa parada de ese día del viaje abierto. En la gratis (una foto por parada), si la parada ya tiene la suya
 * el botón pasa a «Cambiar foto» y la nueva sustituye a la vieja (la regla vive en `fotosViaje.ts`). Se monta con UNA línea en la ficha: `<BotonFotoParada stopName={…} dayNumber={…} />`.
 */
export function BotonFotoParada({ stopName, dayNumber }: { stopName: string; dayNumber: number }) {
  const dia = useRouteStore((state) => state.route?.days.find((d) => d.dayNumber === dayNumber) ?? null)
  const { fotos } = useFotosViaje()
  if (!dia) return null
  const etiqueta = modoDeFoto(fotos, dayNumber, stopName) === 'cambiar' ? 'Cambiar foto' : 'Añadir foto'
  return (
    <BotonFoto
      dayId={dia.id}
      dayNumber={dayNumber}
      stopName={stopName}
      etiqueta={etiqueta}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-text/15 px-4 text-[13.5px] font-medium text-text-soft transition-colors hover:bg-bg-hover disabled:opacity-60"
    >
      <Icono nombre="camara" size={18} />
      {etiqueta}
    </BotonFoto>
  )
}
