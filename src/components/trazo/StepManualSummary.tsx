import type { Place } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'
import { cityCode } from './cityCode'
import { COMPANION, datesLabel, transportModeLabel } from './StepSummary'
import { textoDeDuracion } from '../../lib/duracionViaje'
import { ACCENT, ACCENT_GRANDE, Cta, INK, MONO, SEASON_FX, SERIF, Title } from './trazoUi'

interface StepManualSummaryProps {
  origin: Place | null
  destination: Place | null
  onStart: () => void
}

/**
 * El resumen corto de la ruta a mano (Tanda 6y): destino, fechas, quién viaja y transporte, sin experiencias ni sitios. «Empezar mi ruta» abre la ruta con los días
 * vacíos. Aquí no se monta ninguna ruta por detrás (ni Claude, ni el motor, ni la caché de rutas).
 */
export function StepManualSummary({ origin, destination, onStart }: StepManualSummaryProps) {
  const answers = useRouteStore((state) => state.answers)
  const transportOption = useRouteStore((state) => state.transport_option)
  const vehicleType = useRouteStore((state) => state.vehicle_type)
  const vehicleOwnership = useRouteStore((state) => state.vehicle_ownership)

  const days = answers.days ?? 0
  const summary = [
    { k: 'Transporte', v: transportModeLabel(transportOption, vehicleType, vehicleOwnership) },
    { k: 'Fechas', v: datesLabel(answers.dateRange, answers.month) },
    { k: 'Estación', v: answers.season ? SEASON_FX[answers.season].name : '—' },
    { k: 'Compañía', v: answers.companion ? COMPANION[answers.companion] : '—' },
    { k: 'Duración', v: textoDeDuracion(days) },
  ]

  return (
    <>
      <div style={{ font: `500 11px/1 ${MONO}`, letterSpacing: '.14em', color: ACCENT, textTransform: 'uppercase' }}>Tu viaje</div>
      <Title>Tu viaje, a tu manera.</Title>
      <div style={{ flex: 1, minHeight: 12 }} />
      <div style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(28,34,48,.1)', borderRadius: 26, overflow: 'hidden', color: INK }}>
        <div style={{ padding: '20px 20px 18px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 14 }}>
          <div>
            <div style={{ font: `400 50px/1 ${SERIF}` }}>{cityCode(origin)}</div>
            <div style={{ marginTop: 4, font: "400 12px 'Geist'", color: 'rgba(28,34,48,.62)' }}>{origin?.name}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ font: `500 10px ${MONO}`, letterSpacing: '.12em', textTransform: 'uppercase', color: ACCENT }}>{transportOption?.title ?? ''}</span>
            <div style={{ width: '100%', borderTop: '1px dashed rgba(28,34,48,.35)' }} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ font: `400 50px/1 ${SERIF}`, color: ACCENT_GRANDE }}>{cityCode(destination)}</div>
            <div style={{ marginTop: 4, font: "400 12px 'Geist'", color: 'rgba(28,34,48,.62)' }}>{destination?.name}</div>
          </div>
        </div>
        <div style={{ borderTop: '1px dashed rgba(28,34,48,.16)', padding: '16px 20px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
          {summary.map((field) => (
            <div key={field.k} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              <span style={{ font: `500 10px ${MONO}`, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(28,34,48,.5)' }}>{field.k}</span>
              <span style={{ font: "400 15px 'Geist'" }}>{field.v}</span>
            </div>
          ))}
        </div>
      </div>
      <Cta onClick={onStart} style={{ marginTop: 12, letterSpacing: '.08em' }}>
        Empezar mi ruta
      </Cta>
    </>
  )
}
