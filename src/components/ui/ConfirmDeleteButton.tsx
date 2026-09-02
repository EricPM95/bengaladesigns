import { useState } from 'react'

interface ConfirmDeleteButtonProps {
  /** Ej. "el alojamiento en Roma" — completa "¿Seguro que quieres eliminar {itemLabel}?". */
  itemLabel: string
  onConfirm: () => void
}

/**
 * Botón "Eliminar" discreto (texto/enlace rojo, no compite con el CTA principal de guardar) para el
 * final de una ficha de reserva. Al pulsarlo, sustituye el propio enlace por una confirmación en
 * línea "¿Seguro que quieres eliminar X?" con Cancelar / Sí, eliminar — mismo patrón visual de
 * confirmación ya usado en la app (ver StopMenu.tsx), reutilizado aquí como componente compartido
 * para no repetir esta lógica en cada ficha (Seguro, Alquiler, Transporte, Vuelos, Alojamiento,
 * eSIM, N26).
 */
export function ConfirmDeleteButton({ itemLabel, onConfirm }: ConfirmDeleteButtonProps) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="space-y-2 rounded-xl border border-accent-red/30 bg-accent-red/5 p-3">
        <p className="text-small text-text">¿Seguro que quieres eliminar {itemLabel}?</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="flex-1 rounded-lg bg-bg-hover py-1.5 text-small font-medium text-text hover:bg-border"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-accent-red py-1.5 text-small font-semibold text-white hover:opacity-90"
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="w-full text-center text-small font-medium text-accent-red hover:underline"
    >
      Eliminar
    </button>
  )
}
