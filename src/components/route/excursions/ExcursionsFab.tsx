import { BusLineIcon } from '../../ui/LineIcons'

/**
 * El botón flotante de las excursiones (PARA_CODE_EXCURSIONES, 1): redondo, 58 × 58, fondo crema, borde e icono terracota, abajo a la
 * derecha justo encima de la barra oscura. Quieto, sin animación. Lo pinta RouteView solo en Días y solo si el destino tiene excursiones
 * y el viaje tiene los días que marca (`excursiones_desde_dias`).
 */
export function ExcursionsFab({ destination, onClick }: { destination: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Excursiones desde ${destination}`}
      title={`Excursiones desde ${destination}`}
      className="absolute bottom-[104px] right-6 z-[35] flex h-[58px] w-[58px] items-center justify-center rounded-full border-[1.5px] border-accent bg-bg-card text-accent shadow-[0_10px_26px_-10px_rgba(28,34,48,.45)]"
    >
      <BusLineIcon className="h-7 w-7" />
    </button>
  )
}
