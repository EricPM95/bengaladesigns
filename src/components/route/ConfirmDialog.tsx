import { Hoja } from '../ui/Hoja'
import { elDia } from '../../lib/nombreDeDia'
import type { Route } from '../../lib/types'

/**
 * Una pregunta antes de algo que no se deshace (retocar la ruta, decisión del usuario 2026-09-28): volver a la ruta
 * original, regenerar un día con cambios. El mismo panel que "Quiero entrar" y las fechas (diseño Trazo), en el body.
 */
export function ConfirmDialog({ eyebrow, text, detail, confirmLabel, cancelLabel = 'Mejor no', alto = false, peligro = false, onConfirm, onCancel }: { eyebrow: string; text: string; detail?: string; confirmLabel: string; cancelLabel?: string; /** Por encima de otra hoja abierta (Tanda 6y10: «Cambiar un día por la excursión» pregunta desde dentro de una hoja). */ alto?: boolean; /** (10N6, 1b) El botón de confirmar en rojo: la confirmación es de algo que se quita o se pierde. */ peligro?: boolean; onConfirm: () => void; onCancel: () => void }) {
  // (Tanda 10N §6c) Todas las preguntas salen desde abajo con la pieza `Hoja` (tirador, ✕, se cierra deslizando o tocando fuera), BAJA: el nombre de lo que se toca arriba y los dos botones.
  return (
    <span onClick={(event) => event.stopPropagation()} data-confirmar="1">
      <Hoja baja etiqueta={eyebrow} titulo={text} onCerrar={onCancel} z={alto ? 100 : 80} datos="confirmar">
        {detail && <p style={{ margin: 0, font: "400 14.5px/1.4 'Geist'", color: 'rgba(28,34,48,.7)' }}>{detail}</p>}
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button type="button" onClick={onCancel} className="h-12 flex-1 rounded-full border border-text/15 text-[15px] font-medium text-text transition-colors hover:bg-bg-hover">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} data-confirmar-si="1" data-peligro={peligro ? '1' : undefined} className={`h-12 flex-1 rounded-full text-[15px] font-medium transition-transform active:scale-[.98] ${peligro ? 'bg-accent-red text-white' : 'btn-champan'}`}>
            {confirmLabel}
          </button>
        </div>
      </Hoja>
    </span>
  )
}

/** "el martes 14 y el miércoles 15" (sin fechas, "el día 2 y el día 3"): los días con cambios del viajero. */
export function changedDaysText(route: Route, dayNumbers: number[]): string {
  const parts = dayNumbers.map((n) => elDia(route, n))
  return parts.length <= 1 ? (parts[0] ?? '') : `${parts.slice(0, -1).join(', ')} y ${parts.at(-1)}`
}
