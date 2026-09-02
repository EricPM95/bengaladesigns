import { useState } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { ConfirmDeleteButton } from '../../ui/ConfirmDeleteButton'
import { ReservasItemRow } from './ReservasItemRow'

/** Tarjeta N26 — sin formulario de datos personales, solo enlace de referido; se marca como añadida al hacer click en el CTA. */
export function N26Row() {
  const n26Added = useRouteStore((state) => state.n26Added)
  const setN26Added = useRouteStore((state) => state.setN26Added)
  const [open, setOpen] = useState(false)

  return (
    <>
      <ReservasItemRow
        kind="n26"
        label="Tarjeta N26"
        resolved={n26Added}
        onClick={() => setOpen(true)}
        bookAction={{ label: 'Reservar', href: 'https://n26.com', onGet: () => setN26Added(true) }}
      />

      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <h2 className="font-display text-h2 font-semibold text-text">Tarjeta N26</h2>
          <p className="text-small text-text-soft">
            Sin comisiones por pagos ni retiradas en el extranjero — la tarjeta que más usan los viajeros para no depender de cambiar
            efectivo en cada destino.
          </p>
          <a href="https://n26.com" target="_blank" rel="noopener noreferrer" onClick={() => setN26Added(true)}>
            <Button className="w-full font-bold shadow-sm">Pedir tarjeta N26 →</Button>
          </a>
          {n26Added && <p className="text-center text-caption font-medium text-accent-hover">✓ Añadida</p>}
          {n26Added && (
            <ConfirmDeleteButton
              itemLabel="la tarjeta N26"
              onConfirm={() => {
                setN26Added(false)
                setOpen(false)
              }}
            />
          )}
        </div>
      </Modal>
    </>
  )
}
