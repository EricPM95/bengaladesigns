import { useState } from 'react'
import type { ConnectorInfo, TransportMode } from '../../../lib/mockDayDetail'
import { TransportModeIcon } from './TransportModeIcons'
import { TransportModeSheet } from './TransportModeSheet'
import { OpenInMapsSheet } from './OpenInMapsSheet'

interface StopConnectorProps {
  /** Desplazamiento a mostrar en este hueco, o `null` si aquí no hay ninguno que mostrar: el hueco
      anterior a la primera parada del día, un cambio de franja (la cabecera "TARDE · …" ya separa),
      el hueco junto a un bloque de comida/cena, o un conector que el viajero ha ocultado. El hueco
      se pinta igual en todos esos casos — lo único que desaparece es la información de transporte. */
  connector: ConnectorInfo | null
  fromName: string
  toName: string
  mode: TransportMode
  onSelectMode: (mode: TransportMode) => void
  onHide: () => void
  onSetDefaultForDay: (mode: TransportMode) => void
  /** "+ Añadir parada" — en línea con el resto de la fila, pegado al extremo derecho. */
  onAddStop: () => void
}

/** Cómo se lee el modo en la fila cuando NO se va andando — el sitio de la distancia lo ocupa el
    modo, que es la información que de verdad falta ahí (la distancia es la misma vaya como vaya). */
const MODE_LABEL: Record<TransportMode, string> = {
  walking: 'a pie',
  transit: 'transporte público',
  driving: 'en coche',
}

/** El botón de la derecha de cada hueco. Ver `StopConnector`: el hueco se pinta siempre, así que este botón está en TODOS los huecos del día, con o sin información de desplazamiento al lado. */
export function AddStopButton({ onAddStop }: { onAddStop: () => void }) {
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
 * El HUECO entre dos elementos del timeline de un día: línea punteada vertical, la información de
 * desplazamiento cuando la hay, y "+ Añadir parada" cerrando la fila por la derecha (`ml-auto`), en
 * vez de ser su propia fila aparte.
 *
 * Este componente SIEMPRE pinta la fila, incluso sin `connector` — de eso depende que la cadena
 * "+ Añadir parada / parada / + Añadir parada / parada / + Añadir parada" no se rompa nunca. Antes,
 * todo el hueco (botón incluido) desaparecía cuando no había desplazamiento que mostrar: al borrar
 * una parada, ocultar un conector o al empezar una franja nueva, el hueco correspondiente se
 * quedaba sin su botón y no había forma de insertar nada justo ahí. Lo que se muestra dentro del
 * hueco es opcional; el hueco no.
 */
export function StopConnector({ connector, fromName, toName, mode, onSelectMode, onHide, onSetDefaultForDay, onAddStop }: StopConnectorProps) {
  const [modeSheetOpen, setModeSheetOpen] = useState(false)
  const [mapsSheetOpen, setMapsSheetOpen] = useState(false)

  const selectedOption = connector?.modeOptions?.find((option) => option.mode === mode) ?? connector?.modeOptions?.[0] ?? null
  // Solo cuando lo que se enseña NO es ir andando: entonces el tiempo a pie es la alternativa, y va
  // debajo en pequeño. Si ya se enseña andando, repetirlo no aporta nada.
  const walkingAlternative =
    selectedOption && selectedOption.mode !== 'walking' ? (connector?.modeOptions?.find((option) => option.mode === 'walking') ?? null) : null

  return (
    <div className="flex items-center gap-2 py-1 pl-4">
      <span className="h-6 w-px shrink-0 border-l border-dashed border-text-muted" />

      {connector && !selectedOption && <span className="text-caption text-text-muted">{connector.label}</span>}

      {connector && selectedOption && (
        <>
          <button
            type="button"
            onClick={() => setModeSheetOpen(true)}
            className="flex flex-col items-start gap-0.5 text-caption text-text-muted hover:text-text-soft"
          >
            <span className="flex items-center gap-1.5">
              <TransportModeIcon mode={selectedOption.mode} className="h-3.5 w-3.5 shrink-0" />
              <span>
                {selectedOption.durationLabel} · {selectedOption.mode === 'walking' ? selectedOption.distanceLabel : MODE_LABEL[selectedOption.mode]}
              </span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 shrink-0">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
            {/* Tramo largo: lo que se enseña es el transporte, pero ir andando sigue siendo una
                opción real y el viajero tiene que poder verla sin abrir el selector. */}
            {walkingAlternative && <span className="pl-5 opacity-70">(o {walkingAlternative.durationLabel} a pie)</span>}
          </button>
          <button
            type="button"
            onClick={() => setMapsSheetOpen(true)}
            className="text-caption font-medium text-accent-hover underline underline-offset-2 hover:text-accent"
          >
            Rutas
          </button>
        </>
      )}

      <AddStopButton onAddStop={onAddStop} />

      {connector?.modeOptions && selectedOption && (
        <>
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
        </>
      )}
    </div>
  )
}
