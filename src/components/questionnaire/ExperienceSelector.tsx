import type { ExperienceId } from '../../lib/types'
import { EXPERIENCE_BUCKETS, isBucketVisible, resolveBucketExperiences, type ExperienceBucket } from '../../lib/experienceBuckets'
import { Spinner } from '../ui/Spinner'
import { Button } from '../ui/Button'

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

function isBucketSelected(resolved: ExperienceId[], selected: ExperienceId[]): boolean {
  return resolved.length > 0 && resolved.every((id) => selected.includes(id))
}

/**
 * Selector de experiencias rediseñado — 5 "buckets" de cara al usuario en vez del banco de 18
 * categorías (ver experienceBuckets.ts para el mapeo, confirmado por el usuario: solo cambia la
 * cara visible, el pipeline de generación sigue recibiendo los mismos ExperienceId reales de
 * siempre en `answers.experiences`). Selección múltiple con check circular; un bucket "cuenta"
 * como seleccionado cuando TODOS sus ids reales resueltos están en `selected` — así no hace falta
 * un estado de selección de buckets aparte, `answers.experiences` sigue siendo la única fuente de
 * verdad.
 */
export function ExperienceSelector({ destinationName, suggested, loading, failed, selected, onChange, onRetry, onConfirm }: ExperienceSelectorProps) {
  if (loading) {
    return (
      <p className="flex items-center gap-2 text-small italic text-onb-text-soft">
        <Spinner className="text-onb-accent" />
        Viendo qué experiencias encajan con {destinationName}...
      </p>
    )
  }

  if (failed) {
    return (
      <div className="space-y-2">
        <p className="text-small text-onb-text-soft">No hemos podido sugerir experiencias para {destinationName} ahora mismo.</p>
        <Button onClick={onRetry}>Reintentar</Button>
      </div>
    )
  }

  const visibleBuckets = EXPERIENCE_BUCKETS.filter((bucket) => isBucketVisible(bucket, suggested))

  const toggleBucket = (bucket: ExperienceBucket) => {
    const resolved = resolveBucketExperiences(bucket, suggested)
    if (isBucketSelected(resolved, selected)) {
      onChange(selected.filter((id) => !resolved.includes(id)))
      return
    }
    onChange([...new Set([...selected, ...resolved])])
  }

  const selectedCount = visibleBuckets.filter((bucket) => isBucketSelected(resolveBucketExperiences(bucket, suggested), selected)).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5">
        {visibleBuckets.map((bucket) => {
          const resolved = resolveBucketExperiences(bucket, suggested)
          const active = isBucketSelected(resolved, selected)
          return (
            <button
              key={bucket.id}
              type="button"
              onClick={() => toggleBucket(bucket)}
              className={`relative flex flex-col items-start gap-2 rounded-onb-md border p-4 text-left transition-colors ${
                active ? 'border-onb-accent bg-onb-accent-light' : 'border-onb-border bg-onb-card hover:border-onb-accent/50'
              }`}
            >
              <span
                className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                  active ? 'border-onb-accent bg-onb-accent text-white' : 'border-onb-border bg-onb-card'
                }`}
                aria-hidden="true"
              >
                {active && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              <span className="text-2xl leading-none">{bucket.icon}</span>
              <span className={`font-dmsans text-body font-semibold ${active ? 'text-onb-accent-hover' : 'text-onb-text'}`}>{bucket.title}</span>
            </button>
          )
        })}
      </div>

      <p className="text-center font-dmsans text-caption text-onb-text-muted">
        {selectedCount} de {visibleBuckets.length} seleccionadas
      </p>

      {/* Siempre visible mientras esta pantalla esté activa (BUG 1, feedback de calidad) — ver el
          comentario histórico en Questionnaire.tsx sobre por qué esto NUNCA debe depender de
          placesStepStarted. */}
      <button
        type="button"
        onClick={onConfirm}
        disabled={selected.length === 0}
        className="w-full rounded-onb-full bg-onb-accent py-3.5 font-dmsans text-body font-semibold text-white transition-colors hover:bg-onb-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continuar →
      </button>
    </div>
  )
}
