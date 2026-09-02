import { TRANSPORT_MODE_LABEL, type TransportMode, type TransportModeOption } from '../../../lib/mockDayDetail'
import { Modal } from '../../ui/Modal'
import { TransportModeIcon } from './TransportModeIcons'

interface TransportModeSheetProps {
  open: boolean
  onClose: () => void
  options: TransportModeOption[]
  selectedMode: TransportMode
  onSelectMode: (mode: TransportMode) => void
  onHide: () => void
  onSetDefaultForDay: (mode: TransportMode) => void
}

/**
 * Panel inferior "Modo de transporte" — una opción por modo con icono+tiempo+distancia, más
 * "Ocultar rutas" (oculta este conector concreto) y "Cambiar predeterminado en todos los lugares"
 * (aplica el modo elegido a todos los conectores del día, no solo este).
 */
export function TransportModeSheet({ open, onClose, options, selectedMode, onSelectMode, onHide, onSetDefaultForDay }: TransportModeSheetProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-4">
        <h2 className="font-display text-h2 font-semibold text-text">Modo de transporte</h2>

        <div className="space-y-2">
          {options.map((option) => (
            <button
              key={option.mode}
              type="button"
              onClick={() => {
                onSelectMode(option.mode)
                onClose()
              }}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                option.mode === selectedMode ? 'border-accent bg-accent-soft/40' : 'border-border hover:bg-bg-hover'
              }`}
            >
              <TransportModeIcon mode={option.mode} className="h-5 w-5 shrink-0 text-text-muted" />
              <span className="min-w-0 flex-1 text-small font-medium text-text">{TRANSPORT_MODE_LABEL[option.mode]}</span>
              <span className="shrink-0 text-caption font-medium text-text-soft">
                {option.durationLabel} · {option.distanceLabel}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            onHide()
            onClose()
          }}
          className="w-full text-left text-small font-medium text-text-muted hover:text-text-soft"
        >
          Ocultar rutas
        </button>

        <button
          type="button"
          onClick={() => {
            onSetDefaultForDay(selectedMode)
            onClose()
          }}
          className="w-full text-left text-small font-medium text-accent-hover underline underline-offset-2"
        >
          Cambiar predeterminado en todos los lugares
        </button>
      </div>
    </Modal>
  )
}
