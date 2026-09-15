import type { ExperienceId } from '../../lib/types'
import { EXPERIENCE_BANK, FREE_TOUR_EXPERIENCE } from '../../lib/experienceBank'
import { Spinner } from '../ui/Spinner'
import { Button } from '../ui/Button'
import { ChoiceButton } from './ChoiceButton'

interface ExperienceSelectorProps {
  destinationName: string
  suggested: ExperienceId[]
  loading: boolean
  failed: boolean
  selected: ExperienceId[]
  onChange: (selected: ExperienceId[]) => void
  onRetry: () => void
  onConfirm: () => void
}

const MAX_EXPERIENCES = 6

/**
 * Selector de experiencias — banco de 18, filtrado a 4-8 por Claude según el destino
 * (`suggested`, resuelto en segundo plano al elegir destino, ver `suggestExperiencesInBackground`).
 * El usuario elige libremente hasta un máximo de 6.
 */
export function ExperienceSelector({
  destinationName,
  suggested,
  loading,
  failed,
  selected,
  onChange,
  onRetry,
  onConfirm,
}: ExperienceSelectorProps) {
  if (loading) {
    return (
      <p className="flex items-center gap-2 text-small italic text-text-soft">
        <Spinner className="text-accent" />
        Viendo qué experiencias encajan con {destinationName}...
      </p>
    )
  }

  if (failed) {
    return (
      <div className="space-y-2">
        <p className="text-small text-text-soft">No hemos podido sugerir experiencias para {destinationName} ahora mismo.</p>
        <Button onClick={onRetry}>Reintentar</Button>
      </div>
    )
  }

  const atCap = selected.length >= MAX_EXPERIENCES

  const toggle = (id: ExperienceId) => {
    if (selected.includes(id)) {
      onChange(selected.filter((value) => value !== id))
      return
    }
    if (atCap) return
    onChange([...selected, id])
  }

  const suggestedEntries = suggested.map((id) => EXPERIENCE_BANK.find((entry) => entry.id === id)).filter((entry): entry is (typeof EXPERIENCE_BANK)[number] => Boolean(entry))

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {suggestedEntries.map((entry) => (
          <ChoiceButton
            key={entry.id}
            icon={entry.icon}
            label={entry.title}
            selected={selected.includes(entry.id)}
            disabled={atCap && !selected.includes(entry.id)}
            onClick={() => toggle(entry.id)}
          />
        ))}
        {/* Free Tour siempre disponible, fuera del filtrado por destino de Claude — ver FREE_TOUR_EXPERIENCE en experienceBank.ts */}
        <ChoiceButton
          key={FREE_TOUR_EXPERIENCE.id}
          icon={FREE_TOUR_EXPERIENCE.icon}
          label={FREE_TOUR_EXPERIENCE.title}
          selected={selected.includes(FREE_TOUR_EXPERIENCE.id)}
          disabled={atCap && !selected.includes(FREE_TOUR_EXPERIENCE.id)}
          onClick={() => toggle(FREE_TOUR_EXPERIENCE.id)}
        />
      </div>
      <p className="text-caption text-text-muted">
        Elegidas: {selected.length}/{MAX_EXPERIENCES}
      </p>

      {/* Siempre visible mientras esta pantalla esté activa (BUG 1, feedback de calidad) — antes se
          ocultaba en cuanto `placesStepStarted` pasaba a true (pensado para el diseño antiguo de
          scroll largo, donde "Elige lugares" ya se veía más abajo en la misma página); en el
          diseño de una pantalla por pregunta eso dejaba SIN botón — y por tanto sin forma de
          avanzar — a quien volvía atrás a cambiar su selección. */}
      <Button onClick={onConfirm} disabled={selected.length === 0} className="w-full">
        Continuar →
      </Button>
    </div>
  )
}
