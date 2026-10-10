import { usePresupuestoUi } from '../../store/usePresupuestoUi'
import { Icono } from '../ui/Icono'

/** El botón redondo de la cartera (diseño «La cabecera»): 44 px de toque, sin fondo, la tinta de siempre. */
const BOTON = 'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text transition-colors hover:bg-text/[.06]'

/**
 * LA CARTERA (Tanda 6z6b): el ÚNICO botón que abre el presupuesto. La usan las dos cabeceras (la de arriba de la app, `Header.tsx`, y la de RESERVAS, que tapa a la primera). Todas llevan `data-cartera`
 * para que el efecto «el precio vuela a la cartera» pueda animar hacia la que se vea en ese momento.
 */
export function BotonCartera() {
  const abrir = usePresupuestoUi((state) => state.abrir)
  return (
    <button type="button" onClick={abrir} aria-label="Presupuesto" title="Presupuesto" data-cartera="1" className={BOTON}>
      <Icono nombre="presupuesto" size={23} />
    </button>
  )
}
