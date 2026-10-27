import { modoDeFoto } from '../../../lib/fotosViaje'
import { useFotosViaje } from '../../../lib/useFotosViaje'
import { useRouteStore } from '../../../store/useRouteStore'
import { Icono } from '../../ui/Icono'
import { BotonFoto } from './BotonFoto'

/** El botón redondo de la cámara en la ESQUINA de la foto de la ficha (diseño «Ficha Lugar», Tanda 6y4): solo el icono; el nombre («Añadir foto» o «Cambiar foto») va en su etiqueta para el lector de pantalla. */
const CLASE_ESQUINA =
  'relative inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-bg-card text-text shadow-[0_0_0_1px_rgba(28,34,48,.1),0_6px_12px_-6px_rgba(28,34,48,.5)] transition-transform before:absolute before:-inset-2 before:content-[""] active:scale-95 disabled:opacity-60'

/**
 * «Añadir foto» en la ficha de cada parada (Tanda 6z6; gratis y de pago). La foto va a esa parada de ese día del viaje abierto. En la gratis (una foto por parada), si la parada ya tiene la suya
 * el botón pasa a «Cambiar foto» y la nueva sustituye a la vieja (la regla vive en `fotosViaje.ts`). Se monta con UNA línea en la ficha: `<BotonFotoParada stopName={…} dayNumber={…} esquina />`.
 * `esquina` (Tanda 6y4): el botón redondo de la esquina de la foto de la ficha, como en el diseño; sube con el mismo `BotonFoto` (la misma subida que siempre).
 */
export function BotonFotoParada({ stopName, dayNumber, esquina = false, grande = false }: { stopName: string; dayNumber: number; esquina?: boolean; grande?: boolean }) {
  const dia = useRouteStore((state) => state.route?.days.find((d) => d.dayNumber === dayNumber) ?? null)
  const { fotos } = useFotosViaje()
  if (!dia) return null
  const etiqueta = modoDeFoto(fotos, dayNumber, stopName) === 'cambiar' ? 'Cambiar foto' : 'Añadir foto'
  // Tanda 10N4 (`Piezas/Ficha Cabecera`): la cámara de la cabecera de la ficha, de 40 px, con el icono de Design.
  if (esquina && grande) {
    return (
      <BotonFoto
        dayId={dia.id}
        dayNumber={dayNumber}
        stopName={stopName}
        etiqueta={etiqueta}
        className={'relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#FFFDF8] text-text shadow-[0_4px_10px_rgba(0,0,0,.25)] transition-transform before:absolute before:-inset-1 before:content-[""] active:scale-95 disabled:opacity-60'}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C2230" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
          <path d="M4 8h3l2-3h6l2 3h3v11H4zM12 11a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />
        </svg>
      </BotonFoto>
    )
  }
  if (esquina) {
    return (
      <BotonFoto dayId={dia.id} dayNumber={dayNumber} stopName={stopName} etiqueta={etiqueta} className={CLASE_ESQUINA}>
        <Icono nombre="camara" size={15} />
      </BotonFoto>
    )
  }
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
