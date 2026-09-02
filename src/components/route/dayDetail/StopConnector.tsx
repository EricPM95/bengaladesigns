import { useState } from 'react'
import type { ConnectorInfo, TransportMode } from '../../../lib/mockDayDetail'
import { TransportModeIcon } from './TransportModeIcons'
import { TransportModeSheet } from './TransportModeSheet'
import { OpenInMapsSheet } from './OpenInMapsSheet'

interface StopConnectorProps {
  connector: ConnectorInfo
  fromName: string
  toName: string
  mode: TransportMode
  onSelectMode: (mode: TransportMode) => void
  onHide: () => void
  onSetDefaultForDay: (mode: TransportMode) => void
  /** "+ Añadir parada" — en línea con el resto de la fila, pegado al extremo derecho. */
  onAddStop: () => void
}

function AddStopButton({ onAddStop }: { onAddStop: () => void }) {
  return (
    <button
      type="button"
      onClick={onAddStop}
      className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-caption text-text-muted opacity-60 transition-opacity hover:bg-bg-hover hover:opacity-100"
    >
      + Añadir parada
    </button>
  )
}

/**
 * Línea punteada vertical entre dos acordeones. Sin desplazamiento real (ej. justo tras la
 * llegada) → solo texto, sin icono ni enlace. Con desplazamiento real → icono del modo actual +
 * tiempo + distancia + chevron (abre el selector de modo) + enlace "Rutas" (abre Apple/Google
 * Maps) — mismo patrón que la referencia. En ambos casos, "+ Añadir parada" cierra la fila por la
 * derecha (`ml-auto`), en vez de ser su propia fila aparte.
 */
export function StopConnector({ connector, fromName, toName, mode, onSelectMode, onHide, onSetDefaultForDay, onAddStop }: StopConnectorProps) {
  const [modeSheetOpen, setModeSheetOpen] = useState(false)
  const [mapsSheetOpen, setMapsSheetOpen] = useState(false)

  if (!connector.hasRealDisplacement || !connector.modeOptions) {
    return (
      <div className="flex items-center gap-2 py-1 pl-4">
        <span className="h-6 w-px shrink-0 border-l border-dashed border-text-muted" />
        <span className="text-caption text-text-muted">{connector.label}</span>
        <AddStopButton onAddStop={onAddStop} />
      </div>
    )
  }

  const selectedOption = connector.modeOptions.find((option) => option.mode === mode) ?? connector.modeOptions[0]

  return (
    <div className="flex items-center gap-2 py-1 pl-4">
      <span className="h-6 w-px shrink-0 border-l border-dashed border-text-muted" />
      <button type="button" onClick={() => setModeSheetOpen(true)} className="flex items-center gap-1.5 text-caption text-text-muted hover:text-text-soft">
        <TransportModeIcon mode={selectedOption.mode} className="h-3.5 w-3.5 shrink-0" />
        <span>
          {selectedOption.durationLabel} · {selectedOption.distanceLabel}
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 shrink-0">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => setMapsSheetOpen(true)}
        className="text-caption font-medium text-accent-hover underline underline-offset-2 hover:text-accent"
      >
        Rutas
      </button>
      <AddStopButton onAddStop={onAddStop} />

      <TransportModeSheet
        open={modeSheetOpen}
        onClose={() => setModeSheetOpen(false)}
        options={connector.modeOptions}
        selectedMode={selectedOption.mode}
        onSelectMode={onSelectMode}
        onHide={onHide}
        onSetDefaultForDay={onSetDefaultForDay}
      />
      <OpenInMapsSheet open={mapsSheetOpen} onClose={() => setMapsSheetOpen(false)} origin={fromName} destination={toName} mode={selectedOption.mode} />
    </div>
  )
}
