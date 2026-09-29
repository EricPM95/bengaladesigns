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
  /** El tramo lo hace el día en bus o metro ("🚌 Bus 118, unos 25 min"): se enseña eso, no el paseo. */
  transitLabel?: string | null
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
      className="ml-auto shrink-0 py-2 text-[12.5px] font-medium text-text/50 transition-colors hover:text-text"
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
/**
 * «Bus 115 o el 870, unos 20 min» → { line: 'Bus 115', minutes: 20, mode: 'transit' }; «Un taxi, unos 20 min» → taxi en coche.
 * La primera opción es la que se enseña; las demás (y el taxi) siguen en la ficha.
 */
function parseTransitLabel(label: string): { line: string; minutes: number | null; mode: TransportMode } {
  const minutes = /(\d+)\s*min/.exec(label)
  const head = label.split(',')[0].split(/\s+o\s+/)[0].trim().replace(/^(un|una|el|la)\s+/i, '')
  const line = head.charAt(0).toUpperCase() + head.slice(1)
  return { line, minutes: minutes ? Number(minutes[1]) : null, mode: /taxi/i.test(head) ? 'driving' : 'transit' }
}

export function StopConnector({ connector, fromName, toName, mode, onSelectMode, onHide, onSetDefaultForDay, onAddStop, transitLabel }: StopConnectorProps) {
  const [modeSheetOpen, setModeSheetOpen] = useState(false)
  const [mapsSheetOpen, setMapsSheetOpen] = useState(false)
  const transitRow = transitLabel ? parseTransitLabel(transitLabel) : null

  // Si el modo pedido no está (el transporte que no ahorra tiempo no se ofrece), a pie.
  const selectedOption =
    connector?.modeOptions?.find((option) => option.mode === mode) ?? connector?.modeOptions?.find((option) => option.mode === 'walking') ?? connector?.modeOptions?.[0] ?? null
  // Solo cuando lo que se enseña NO es ir andando: entonces el tiempo a pie es la alternativa, y va
  // debajo en pequeño. Si ya se enseña andando, repetirlo no aporta nada.
  const walkingAlternative =
    selectedOption && selectedOption.mode !== 'walking' ? (connector?.modeOptions?.find((option) => option.mode === 'walking') ?? null) : null

  return (
    // Diseño "Trazo Itinerario": la línea punteada del día la pinta el contenedor; aquí solo la fila.
    <div className="flex min-h-[44px] items-center gap-1.5 text-[12.5px] text-text/60">
      {/* El bus o el metro escrito, como la fila de andar (PROMPT_UI_REPASO 12): su icono, «Bus 115 · 20 min», «Rutas»
          (Maps en transporte público, hasta la parada) y «+ Añadir parada». */}
      {transitLabel && transitRow && (
        <>
          <span className="flex items-center gap-1.5 text-text/60">
            <TransportModeIcon mode={transitRow.mode} className="h-[15px] w-[15px] shrink-0" />
            <span className="font-mono text-[12px] font-medium">
              {transitRow.line}
              {transitRow.minutes ? ` · ${transitRow.minutes} min` : ''}
            </span>
          </span>
          <button
            type="button"
            onClick={() => setMapsSheetOpen(true)}
            className="ml-1 text-[12.5px] font-medium text-accent underline underline-offset-[3px] hover:text-accent-hover"
          >
            Rutas
          </button>
        </>
      )}

      {!transitLabel && connector && !selectedOption && <span className="text-[12.5px] text-text/55">{connector.label}</span>}

      {!transitLabel && connector && selectedOption && (
        <>
          <button
            type="button"
            onClick={() => setModeSheetOpen(true)}
            className="flex flex-col items-start gap-0.5 text-text/60 hover:text-text"
          >
            <span className="flex items-center gap-1.5">
              <TransportModeIcon mode={selectedOption.mode} className="h-[15px] w-[15px] shrink-0" />
              <span className="font-mono text-[12px] font-medium">
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
            className="ml-1 text-[12.5px] font-medium text-accent underline underline-offset-[3px] hover:text-accent-hover"
          >
            Rutas
          </button>
        </>
      )}

      <AddStopButton onAddStop={onAddStop} />

      {transitLabel && transitRow && !(connector?.modeOptions && selectedOption) && (
        <OpenInMapsSheet open={mapsSheetOpen} onClose={() => setMapsSheetOpen(false)} origin={fromName} destination={toName} mode={transitRow.mode} />
      )}
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
