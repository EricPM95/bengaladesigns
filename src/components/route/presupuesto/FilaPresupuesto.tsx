import { usePresupuestoUi } from '../../../store/usePresupuestoUi'
import { usePresupuesto } from '../../../lib/usePresupuesto'
import { formatoImporte } from '../../../lib/dinero'
import { ICONOS, IconoBloque, tituloBloqueStyle } from '../reservas/BloqueReservas'

/**
 * La fila «Presupuesto · 334 €» de arriba de RESERVAS (Tanda 6z2): abre la pantalla del presupuesto, la misma que la bolsa de la barra de abajo. Sin gastos todavía, solo «Presupuesto».
 * Gratis y de pago, igual.
 */
export function FilaPresupuesto() {
  const abrir = usePresupuestoUi((state) => state.abrir)
  const { presupuesto } = usePresupuesto()
  const hayGastos = Boolean(presupuesto && presupuesto.bloques.length > 0)
  return (
    <button
      type="button"
      onClick={abrir}
      data-blk="presupuesto"
      className="flex w-full items-center gap-3 rounded-[22px] bg-[#FFFDF8] p-3.5 text-left text-text"
      style={{ border: '1px solid rgba(28,34,48,.07)', boxShadow: '0 1px 2px rgba(28,34,48,.05),0 12px 30px -22px rgba(28,34,48,.35)' }}
    >
      <IconoBloque d={ICONOS.card} hecho={hayGastos} />
      <span className="flex min-w-0 flex-1 items-baseline gap-2">
        <span style={tituloBloqueStyle}>Presupuesto</span>
        {hayGastos && presupuesto && <span style={{ font: "600 13px 'Geist Mono',monospace" }}>· {formatoImporte(presupuesto.total)}</span>}
      </span>
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#F5EFE4]" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1C2230" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </span>
    </button>
  )
}
