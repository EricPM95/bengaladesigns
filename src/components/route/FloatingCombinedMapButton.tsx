interface FloatingCombinedMapButtonProps {
  onClick: () => void
}

/**
 * Botón flotante — mismo estilo (circular, fondo blanco/tarjeta, borde verde, icono centrado) y
 * mismo tamaño que el de presupuesto (FloatingBudget), apilado justo encima, para que se perciban
 * como una pareja consistente. Navega a la pestaña RUTA (ver RouteView.tsx: `onClick={() =>
 * setMode('route')}`) — ahí el mapa muestra el combinado por días coloreado (destino único) o el de
 * destinos grandes numerados (multi-destino), ver buildCombinedDaysMarkers/RouteOverviewMap. Ya no
 * abre una pantalla de mapa a pantalla completa aparte (esa vista se eliminó). Visible en toda la
 * app (cualquier pestaña: Hoy/Ruta/Días/Explorar/Reservas).
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
