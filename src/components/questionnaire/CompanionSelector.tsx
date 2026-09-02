import { useState } from 'react'
import type { Companion, DestinationArchetype, QuestionnaireAnswers, VehicleType } from '../../lib/types'
import { getCapacityWarning, totalCompanionPeople } from '../../lib/companionFlow'
import { ChoiceButton } from './ChoiceButton'
import { SelectedOptionCard } from './SelectedOptionCard'
import { Button } from '../ui/Button'

interface CompanionSelectorProps {
  companion: Companion | undefined
  companionAdults: number | undefined
  companionChildrenAges: number[] | undefined
  companionGroupSize: number | undefined
  archetype: DestinationArchetype | null
  vehicleType: VehicleType | null
  capacityAcknowledged: boolean
  onChange: (
    partial: Partial<Pick<QuestionnaireAnswers, 'companion' | 'companionAdults' | 'companionChildrenAges' | 'companionGroupSize'>>,
  ) => void
  onCapacityAcknowledgedChange: (acknowledged: boolean) => void
  /** "Cambiar a Camper o Autocaravana" — resetea el vehículo ya elegido para volver a preguntarlo. */
  onResetVehicle: () => void
}

const COMPANION_META: { value: Companion; icon: string; title: string; description: string }[] = [
  { value: 'solo', icon: '🎒', title: 'A MI AIRE', description: 'Viajo solo y a mi ritmo.' },
  { value: 'couple', icon: '💞', title: 'EN COMPAÑÍA', description: 'Una escapada para dos.' },
  { value: 'family', icon: '👨‍👩‍👧', title: 'AVENTURA EN TRIBU', description: 'Viaje en familia' },
  { value: 'group', icon: '🎉', title: 'CON MI CREW', description: 'La ruta perfecta con amigos o cuadrilla.' },
]

function formatFamilySummary(adults: number, ages: number[]): string {
  const adultsPart = `${adults} adulto${adults === 1 ? '' : 's'}`
  if (ages.length === 0) return adultsPart
  const childrenPart = `${ages.length} niño${ages.length === 1 ? '' : 's'} (${ages.join(', ')} años)`
  return `${adultsPart} + ${childrenPart}`
}

/**
 * "Elige tus acompañantes" — A MI AIRE/EN COMPAÑÍA se resuelven con un solo clic (habitación
 * individual/doble, sin datos extra). AVENTURA EN TRIBU/CON MI CREW despliegan un formulario
 * numérico (adultos+edad de cada niño / total del grupo) antes de quedar resueltos — y, solo si
 * ya se conoce el vehículo de un paso anterior (ver companionFlow.ts), comparan el tamaño del
 * grupo contra su capacidad.
 */
export function CompanionSelector({
  companion,
  companionAdults,
  companionChildrenAges,
  companionGroupSize,
  archetype,
  vehicleType,
  capacityAcknowledged,
  onChange,
  onCapacityAcknowledgedChange,
  onResetVehicle,
}: CompanionSelectorProps) {
  const [adultsDraft, setAdultsDraft] = useState('')
  const [childrenCountDraft, setChildrenCountDraft] = useState('')
  const [childAgesDraft, setChildAgesDraft] = useState<string[]>([])
  const [groupSizeDraft, setGroupSizeDraft] = useState('')

  const resetToTypeSelection = () => {
    onChange({ companion: undefined, companionAdults: undefined, companionChildrenAges: undefined, companionGroupSize: undefined })
    onCapacityAcknowledgedChange(false)
  }

  // ── Paso 1 — sin tipo elegido todavía ────────────────────────────────
  if (!companion) {
    return (
      <div className="space-y-2">
        {COMPANION_META.map((option) => (
          <ChoiceButton
            key={option.value}
            icon={option.icon}
            label={option.title}
            description={option.description}
            selected={false}
            onClick={() => onChange({ companion: option.value })}
          />
        ))}
      </div>
    )
  }

  const meta = COMPANION_META.find((option) => option.value === companion)!

  // ── A MI AIRE / EN COMPAÑÍA — resuelto al elegir, sin datos extra ────
  if (companion === 'solo' || companion === 'couple') {
    return <SelectedOptionCard icon={meta.icon} label={meta.title} canChange onChange={resetToTypeSelection} />
  }

  // ── AVENTURA EN TRIBU — formulario de adultos + edad de cada niño ────
  if (companion === 'family') {
    if (companionAdults === undefined || companionChildrenAges === undefined) {
      const childrenCountNum = childrenCountDraft ? Number(childrenCountDraft) : 0
      const adultsNum = Number(adultsDraft)
      const agesValid =
        childAgesDraft.length === childrenCountNum && childAgesDraft.every((age) => age !== '' && Number(age) >= 0 && Number(age) <= 17)
      const formValid = adultsDraft !== '' && adultsNum >= 1 && agesValid

      const handleChildrenCountChange = (raw: string) => {
        const digits = raw.replace(/\D/g, '').slice(0, 2)
        setChildrenCountDraft(digits)
        const count = digits ? Number(digits) : 0
        setChildAgesDraft((prev) => {
          const next = prev.slice(0, count)
          while (next.length < count) next.push('')
          return next
        })
      }

      const handleAgeChange = (index: number, raw: string) => {
        const digits = raw.replace(/\D/g, '').slice(0, 2)
        setChildAgesDraft((prev) => prev.map((value, i) => (i === index ? digits : value)))
      }

      return (
        <div className="space-y-3">
          <button type="button" onClick={resetToTypeSelection} className="text-caption font-medium text-accent hover:text-accent-hover">
            ← Elegir otro tipo de grupo
          </button>
          <div className="flex items-center gap-2">
            <span className="text-small text-text-soft">¿Cuántos adultos viajáis?</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={adultsDraft}
              onChange={(event) => setAdultsDraft(event.target.value.replace(/\D/g, '').slice(0, 2))}
              placeholder="2"
              className="w-16 rounded-xl border border-border bg-bg px-3 py-2 text-body text-text focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-small text-text-soft">¿Cuántos niños?</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={childrenCountDraft}
              onChange={(event) => handleChildrenCountChange(event.target.value)}
              placeholder="0"
              className="w-16 rounded-xl border border-border bg-bg px-3 py-2 text-body text-text focus:border-accent focus:outline-none"
            />
          </div>
          {childAgesDraft.length > 0 && (
            <div className="space-y-2 rounded-xl border border-border bg-bg-card p-3">
              {childAgesDraft.map((age, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-small text-text-soft">Edad del niño {index + 1}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={17}
                    value={age}
                    onChange={(event) => handleAgeChange(index, event.target.value)}
                    placeholder="8"
                    className="w-16 rounded-xl border border-border bg-bg px-3 py-2 text-body text-text focus:border-accent focus:outline-none"
                  />
                </div>
              ))}
            </div>
          )}
          <Button
            disabled={!formValid}
            onClick={() => {
              onChange({ companionAdults: adultsNum, companionChildrenAges: childAgesDraft.map(Number) })
              onCapacityAcknowledgedChange(false)
            }}
          >
            Confirmar
          </Button>
        </div>
      )
    }

    return (
      <CapacityGate
        icon={meta.icon}
        title={meta.title}
        summary={formatFamilySummary(companionAdults, companionChildrenAges)}
        total={totalCompanionPeople(companion, companionAdults, companionChildrenAges, undefined)}
        archetype={archetype}
        vehicleType={vehicleType}
        capacityAcknowledged={capacityAcknowledged}
        onCapacityAcknowledgedChange={onCapacityAcknowledgedChange}
        onResetVehicle={onResetVehicle}
        onAdjustAnswer={() => {
          onChange({ companionAdults: undefined, companionChildrenAges: undefined })
          onCapacityAcknowledgedChange(false)
        }}
        onChangeType={resetToTypeSelection}
      />
    )
  }

  // ── CON MI CREW — total del grupo, sin desglose ──────────────────────
  if (companionGroupSize === undefined) {
    const groupNum = Number(groupSizeDraft)
    const formValid = groupSizeDraft !== '' && groupNum >= 1

    return (
      <div className="space-y-3">
        <button type="button" onClick={resetToTypeSelection} className="text-caption font-medium text-accent hover:text-accent-hover">
          ← Elegir otro tipo de grupo
        </button>
        <div className="flex items-center gap-2">
          <span className="text-small text-text-soft">¿Cuántos sois en total?</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={groupSizeDraft}
            onChange={(event) => setGroupSizeDraft(event.target.value.replace(/\D/g, '').slice(0, 2))}
            placeholder="6"
            className="w-16 rounded-xl border border-border bg-bg px-3 py-2 text-body text-text focus:border-accent focus:outline-none"
          />
        </div>
        <Button
          disabled={!formValid}
          onClick={() => {
            onChange({ companionGroupSize: groupNum })
            onCapacityAcknowledgedChange(false)
          }}
        >
          Confirmar
        </Button>
      </div>
    )
  }

  return (
    <CapacityGate
      icon={meta.icon}
      title={meta.title}
      summary={`${companionGroupSize} personas`}
      total={totalCompanionPeople(companion, undefined, undefined, companionGroupSize)}
      archetype={archetype}
      vehicleType={vehicleType}
      capacityAcknowledged={capacityAcknowledged}
      onCapacityAcknowledgedChange={onCapacityAcknowledgedChange}
      onResetVehicle={onResetVehicle}
      onAdjustAnswer={() => {
        onChange({ companionGroupSize: undefined })
        onCapacityAcknowledgedChange(false)
      }}
      onChangeType={resetToTypeSelection}
    />
  )
}

interface CapacityGateProps {
  icon: string
  title: string
  summary: string
  total: number
  archetype: DestinationArchetype | null
  vehicleType: VehicleType | null
  capacityAcknowledged: boolean
  onCapacityAcknowledgedChange: (acknowledged: boolean) => void
  onResetVehicle: () => void
  onAdjustAnswer: () => void
  onChangeType: () => void
}

/**
 * Compara el grupo ya introducido contra la capacidad del vehículo (si ya se conoce en este
 * arquetipo — ver companionFlow.ts). Coche por encima de su capacidad bloquea con 3 salidas
 * explícitas; los avisos de camper son solo informativos y nunca bloquean.
 */
function CapacityGate({
  icon,
  title,
  summary,
  total,
  archetype,
  vehicleType,
  capacityAcknowledged,
  onCapacityAcknowledgedChange,
  onResetVehicle,
  onAdjustAnswer,
  onChangeType,
}: CapacityGateProps) {
  const warning = getCapacityWarning(archetype, vehicleType, total)

  if (warning?.level === 'car_over' && !capacityAcknowledged) {
    return (
      <div className="space-y-3 rounded-xl border border-accent-warm/40 bg-accent-warm/10 p-4">
        <p className="text-small text-text">
          Sois {total} — un coche de alquiler estándar llega hasta 5 personas. ¿Alquilamos más de un coche, o prefieres cambiar de vehículo?
        </p>
        <div className="space-y-2">
          <ChoiceButton label="Varios coches" selected={false} onClick={() => onCapacityAcknowledgedChange(true)} />
          <ChoiceButton label="Cambiar a Camper o Autocaravana" selected={false} onClick={onResetVehicle} />
          <ChoiceButton label="Ajustar mi respuesta anterior" selected={false} onClick={onAdjustAnswer} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <SelectedOptionCard icon={icon} label={`${title} — ${summary}`} canChange onChange={onChangeType} />
      {warning?.level === 'camper_recommend' && (
        <p className="text-small text-text-soft">
          Sois {total} — os recomendamos {warning.unitsRecommended} autocaravanas para ir cómodos.
        </p>
      )}
      {warning?.level === 'camper_over' && (
        <p className="text-small text-text-soft">
          Sois {total} — es un grupo grande para este tipo de vehículo. Te recomendamos revisar tu elección de vehículo manualmente.{' '}
          <button type="button" onClick={onResetVehicle} className="font-medium italic text-accent hover:text-accent-hover">
            Cambiar vehículo
          </button>
        </p>
      )}
      {warning?.level === 'car_over' && (
        <p className="text-small text-text-soft">Vais a alquilar más de un coche para el grupo.</p>
      )}
    </div>
  )
}
