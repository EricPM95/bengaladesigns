import { useState } from 'react'
import type { GeneralBooking } from '../../../lib/readiness'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { ConfirmDeleteButton } from '../../ui/ConfirmDeleteButton'

interface GeneralBookingModalProps {
  open: boolean
  title: string
  /** Ej. "el seguro de viaje" — para la confirmación "¿Seguro que quieres eliminar {itemLabel}?". */
  itemLabel: string
  providerLabel: string
  providerPlaceholder: string
  initial: GeneralBooking | null
  onSave: (booking: GeneralBooking) => void
  onRemove: () => void
  onClose: () => void
}

const inputClasses = 'w-full rounded-xl border border-border bg-bg px-3 py-2 text-body text-text focus:border-accent focus:outline-none'

/** Ficha genérica de reserva por rango de fechas — reutilizada para Seguro de viaje y Vehículo de alquiler (mismos campos, distinto label). */
export function GeneralBookingModal({ open, title, itemLabel, providerLabel, providerPlaceholder, initial, onSave, onRemove, onClose }: GeneralBookingModalProps) {
  const [provider, setProvider] = useState(initial?.provider ?? '')
  const [startDate, setStartDate] = useState(initial?.startDate ?? '')
  const [endDate, setEndDate] = useState(initial?.endDate ?? '')
  const [price, setPrice] = useState(initial ? String(initial.price) : '')

  const handleSave = () => {
    if (!provider.trim()) return
    onSave({ provider: provider.trim(), startDate, endDate, price: Number(price) || 0 })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-4">
        <h2 className="font-display text-h2 font-semibold text-text">{title}</h2>

        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-small font-medium text-text">{providerLabel}</span>
            <input value={provider} onChange={(event) => setProvider(event.target.value)} placeholder={providerPlaceholder} className={inputClasses} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-small font-medium text-text">Desde</span>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={inputClasses} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-small font-medium text-text">Hasta</span>
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={inputClasses} />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="text-small font-medium text-text">Precio</span>
            <input type="number" min={0} value={price} onChange={(event) => setPrice(event.target.value)} placeholder="€" className={inputClasses} />
          </label>
        </div>

        <Button onClick={handleSave} disabled={!provider.trim()} className="w-full font-bold shadow-sm">
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
