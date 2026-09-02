interface FloatingCombinedMapButtonProps {
  onClick: () => void
}

/**
 * Botón flotante — mismo estilo (circular, fondo blanco/tarjeta, borde verde, icono centrado) y
 * mismo tamaño que el de presupuesto (FloatingBudget), apilado justo encima, para que se perciban
 * como una pareja consistente. Abre la vista de mapa combinado de todos los días
 * (CombinedDaysMapView.tsx). Visible en toda la app (cualquier pestaña: Hoy/Ruta/Días/Explorar/
 * Reservas), no solo en DIAS — el mapa "solo del día activo" de DIAS sigue siendo el comportamiento
 * por defecto ahí, esto es un atajo aparte siempre a mano.
 */
export function FloatingCombinedMapButton({ onClick }: FloatingCombinedMapButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Ver mapa de todos los días"
      className="fixed bottom-20 right-5 z-20 flex h-12 w-12 items-center justify-center rounded-full border-2 border-accent bg-bg-card text-xl shadow-md"
    >
      🗺️
    </button>
  )
}
