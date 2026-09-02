import type { ExperienceId } from '../../lib/types'
import { EXPERIENCE_BANK } from '../../lib/experienceBank'
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
  /** true una vez el viajero pulsó "Ver lugares" — oculta el botón (el paso "Elige lugares" ya está en marcha) pero sigue permitiendo tocar checkboxes. */
  placesStepStarted: boolean
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
  placesStepStarted,
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
      </div>
      <p className="text-caption text-text-muted">
        Elegidas: {selected.length}/{MAX_EXPERIENCES}
      </p>

      {!placesStepStarted && (
        <Button onClick={onConfirm} disabled={selected.length === 0} className="w-full">
          Ver lugares para estas experiencias →
        </Button>
      )}
    </div>
  )
}
