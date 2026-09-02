import { useState } from 'react'
import type { TransportBooking } from '../../../lib/readiness'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { ConfirmDeleteButton } from '../../ui/ConfirmDeleteButton'

interface TransportBookingModalProps {
  open: boolean
  label: string
  /** Ej. "el transporte a Roma" — para la confirmación "¿Seguro que quieres eliminar {itemLabel}?". */
  itemLabel: string
  initial: TransportBooking | null
  onSave: (booking: TransportBooking) => void
  onRemove: () => void
  onClose: () => void
}

const inputClasses = 'w-full rounded-xl border border-border bg-bg px-3 py-2 text-body text-text focus:border-accent focus:outline-none'

/** Ficha de reserva de transporte (vuelo/tren) — aerolínea/operador, fecha/hora, precio, localizador. */
export function TransportBookingModal({ open, label, itemLabel, initial, onSave, onRemove, onClose }: TransportBookingModalProps) {
  const [operator, setOperator] = useState(initial?.operator ?? '')
  const [dateTime, setDateTime] = useState(initial?.dateTime ?? '')
  const [price, setPrice] = useState(initial ? String(initial.price) : '')
  const [locator, setLocator] = useState(initial?.locator ?? '')

  const handleSave = () => {
    if (!operator.trim()) return
    onSave({ operator: operator.trim(), dateTime, price: Number(price) || 0, locator: locator.trim() })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-4">
        <h2 className="font-display text-h2 font-semibold text-text">Transporte: {label}</h2>

        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-small font-medium text-text">Aerolínea / operador</span>
            <input value={operator} onChange={(event) => setOperator(event.target.value)} placeholder="Iberia, Renfe…" className={inputClasses} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-small font-medium text-text">Fecha y hora</span>
            <input type="datetime-local" value={dateTime} onChange={(event) => setDateTime(event.target.value)} className={inputClasses} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-small font-medium text-text">Precio</span>
              <input type="number" min={0} value={price} onChange={(event) => setPrice(event.target.value)} placeholder="€" className={inputClasses} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-small font-medium text-text">Localizador</span>
              <input value={locator} onChange={(event) => setLocator(event.target.value)} placeholder="ABC123" className={inputClasses} />
            </label>
          </div>
        </div>

        <Button onClick={handleSave} disabled={!operator.trim()} className="w-full font-bold shadow-sm">
          {initial ? 'Guardar cambios' : 'Guardar reserva'}
        </Button>

        {initial && (
          <ConfirmDeleteButton
            itemLabel={itemLabel}
            onConfirm={() => {
              onRemove()
              onClose()
            }}
          />
        )}
      </div>
    </Modal>
  )
}
