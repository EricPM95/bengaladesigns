import { useState } from 'react'
import type { Companion, QuestionnaireAnswers } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'
import { getCapacityWarning, isCompanionFullyResolved, totalCompanionPeople } from '../../lib/companionFlow'
import { ACCENT, AMBER, Cta, Em, Figures, INK, MONO, RadioRow, SERIF, Sheet, Stepper, Title } from './trazoUi'

const GROUPS: { k: Companion; n: string; d: string; f: number[]; gap: number }[] = [
  { k: 'solo', n: 'Solo', d: 'Tu ritmo, tus reglas', f: [74], gap: 0 },
  { k: 'couple', n: 'En pareja', d: 'Planes para dos', f: [70, 64], gap: 3 },
  { k: 'group', n: 'Con amigos', d: 'Planes compartidos', f: [60, 70, 56], gap: 7 },
  { k: 'family', n: 'En familia', d: 'Todos a bordo', f: [72, 66, 42, 34], gap: 4 },
]

interface StepCompanionProps {
  answers: Partial<QuestionnaireAnswers>
  onChange: (partial: Partial<QuestionnaireAnswers>) => void
  /** "Cambiar a Camper": vuelve al paso de transporte para elegir otro vehículo. */
  onChangeVehicle: () => void
  onNext: () => void
}

/**
 * 04 — Compañía, conectado a lo de siempre: solo y en pareja se resuelven al tocar; en familia (adultos +
 * edad de cada niño) y con amigos (cuántos sois) abren una hoja. Si el vehículo ya elegido se queda
 * pequeño, el mismo aviso de capacidad que antes (companionFlow.ts).
 */
export function StepCompanion({ answers, onChange, onChangeVehicle, onNext }: StepCompanionProps) {
  const archetype = useRouteStore((state) => state.archetype)
  const vehicleType = useRouteStore((state) => state.vehicle_type)
  const acknowledged = useRouteStore((state) => state.companion_capacity_acknowledged)
  const setAcknowledged = useRouteStore((state) => state.setCompanionCapacityAcknowledged)

  const [sheet, setSheet] = useState<'family' | 'group' | null>(null)
  const [adults, setAdults] = useState(answers.companionAdults ?? 2)
  const [ages, setAges] = useState<number[]>(answers.companionChildrenAges ?? [])
  const [groupSize, setGroupSize] = useState(answers.companionGroupSize ?? 4)

  const pick = (k: Companion) => {
    setAcknowledged(false)
    if (k === 'solo' || k === 'couple') {
      onChange({ companion: k, companionAdults: undefined, companionChildrenAges: undefined, companionGroupSize: undefined })
      return
    }
    onChange({ companion: k, companionAdults: undefined, companionChildrenAges: undefined, companionGroupSize: undefined })
    setSheet(k)
  }

  const resolved = isCompanionFullyResolved(answers.companion, answers.companionAdults, answers.companionChildrenAges, answers.companionGroupSize, archetype, vehicleType, acknowledged)
  const total = totalCompanionPeople(answers.companion, answers.companionAdults, answers.companionChildrenAges, answers.companionGroupSize)
  const warning = getCapacityWarning(archetype, vehicleType, total)

  const summaryOf = (k: Companion) => {
    if (answers.companion !== k) return null
    if (k === 'family' && answers.companionAdults !== undefined && answers.companionChildrenAges) {
      const kids = answers.companionChildrenAges.length
      return `${answers.companionAdults} adulto${answers.companionAdults === 1 ? '' : 's'}${kids ? ` + ${kids} niño${kids === 1 ? '' : 's'}` : ''}`
    }
    if (k === 'group' && answers.companionGroupSize !== undefined) return `${answers.companionGroupSize} personas`
    return null
  }

  return (
    <>
      <div style={{ font: `500 11px/1 ${MONO}`, letterSpacing: '.14em', color: ACCENT, textTransform: 'uppercase' }}>04 — Compañía</div>
      <Title>
        ¿Con quién <Em>viajas?</Em>
      </Title>
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: 'minmax(0,1fr)', gap: 10, margin: '22px 0 12px' }}>
        {GROUPS.map((g) => {
          const active = answers.companion === g.k
          const summary = summaryOf(g.k)
          return (
            <button
              key={g.k}
              type="button"
              className="trazo-press"
              onClick={() => pick(g.k)}
              style={{
                minHeight: 0,
                borderRadius: 24,
                border: `1px solid ${active ? AMBER : 'rgba(28,34,48,.1)'}`,
                background: active ? 'rgba(255,190,30,.12)' : 'rgba(255,255,255,0.80)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                display: 'flex',
                flexDirection: 'column',
                padding: 16,
                cursor: 'pointer',
                textAlign: 'left',
                color: INK,
                transition: 'border-color .3s,background .3s,transform .2s',
              }}
            >
              <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 12 }}>
                <Figures heights={g.f} gap={g.gap} active={active} together={g.k === 'couple'} />
              </div>
              <div style={{ font: `400 26px/1 ${SERIF}` }}>{g.n}</div>
              <div style={{ marginTop: 5, font: "400 12.5px/1.3 'Geist'", color: 'rgba(28,34,48,.68)' }}>{summary ?? g.d}</div>
            </button>
          )
        })}
      </div>
      {warning?.level === 'camper_recommend' && (
        <p style={{ margin: '0 4px 10px', font: "400 13px/1.4 'Geist'", color: INK }}>Sois {total} — os recomendamos {warning.unitsRecommended} autocaravanas para ir cómodos.</p>
      )}
      {warning?.level === 'camper_over' && (
        <p style={{ margin: '0 4px 10px', font: "400 13px/1.4 'Geist'", color: INK }}>
          Sois {total} — es un grupo grande para este tipo de vehículo.{' '}
          <button type="button" onClick={onChangeVehicle} style={{ border: 'none', background: 'transparent', color: ACCENT, textDecoration: 'underline', cursor: 'pointer', font: "500 13px 'Geist'" }}>
            Cambiar vehículo
          </button>
        </p>
      )}
      {warning?.level === 'car_over' && !acknowledged && answers.companion && (answers.companionGroupSize !== undefined || answers.companionChildrenAges !== undefined) && (
        <div style={{ margin: '0 0 10px', padding: 14, borderRadius: 18, background: 'rgba(255,190,30,.1)', border: '1px solid rgba(255,190,30,.35)' }}>
          <p style={{ margin: '0 0 6px', font: "400 14px/1.4 'Geist'", color: INK }}>
            Sois {total} — un coche de alquiler estándar llega hasta 5 personas. ¿Alquilamos más de un coche, o prefieres cambiar de vehículo?
          </p>
          <RadioRow label="Varios coches" active={false} onClick={() => setAcknowledged(true)} />
          <RadioRow label="Cambiar a Camper o Autocaravana" active={false} onClick={onChangeVehicle} />
          <RadioRow label="Ajustar el número de personas" active={false} onClick={() => setSheet(answers.companion === 'family' ? 'family' : 'group')} />
        </div>
      )}
      <Cta onClick={onNext} enabled={resolved}>
        Continuar
      </Cta>

      <Sheet open={sheet !== null} onClose={() => setSheet(null)}>
        <div style={{ font: `500 11px/1 ${MONO}`, letterSpacing: '.14em', color: ACCENT, textTransform: 'uppercase' }}>{sheet === 'family' ? 'En familia' : 'Con amigos'}</div>
        <h2 style={{ margin: '10px 0 8px', font: `400 32px/1.02 ${SERIF}` }}>{sheet === 'family' ? '¿Quiénes vais?' : '¿Cuántos sois?'}</h2>
        {sheet === 'family' && (
          <>
            <Stepper label="Adultos" value={adults} min={1} max={12} onChange={setAdults} />
            <Stepper
              label="Niños"
              value={ages.length}
              min={0}
              max={8}
              onChange={(count) => setAges((prev) => (count > prev.length ? [...prev, ...Array(count - prev.length).fill(8)] : prev.slice(0, count)))}
            />
            {ages.map((age, index) => (
              <Stepper key={index} label={`Edad del niño ${index + 1}`} value={age} min={0} max={17} onChange={(value) => setAges((prev) => prev.map((a, i) => (i === index ? value : a)))} />
            ))}
          </>
        )}
        {sheet === 'group' && <Stepper label="En total" value={groupSize} min={2} max={30} onChange={setGroupSize} />}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <Cta
            style={{ flex: 1, height: 56 }}
            onClick={() => {
              if (sheet === 'family') onChange({ companion: 'family', companionAdults: adults, companionChildrenAges: ages })
              if (sheet === 'group') onChange({ companion: 'group', companionGroupSize: groupSize })
              setAcknowledged(false)
              setSheet(null)
            }}
          >
            Confirmar
          </Cta>
        </div>
      </Sheet>
    </>
  )
}
