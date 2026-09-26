import { useEffect, useMemo, useRef, useState } from 'react'
import type { Place } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'
import { useTransportFeasibility } from '../../hooks/useTransportFeasibility'
import { isTransportFullyResolved } from '../../lib/transportFlow'
import { buildCarAccommodationMessage } from '../../lib/accommodationCopy'
import { classifyInBackground } from '../../lib/classifyInBackground'
import { buildTransportRows, type TransportRow } from './transportRows'
import { followUp, type VehiclePatch } from './vehicleFlow'
import { kmBetween } from './cityCode'
import { AMBER, ConfirmedCard, Cta, Em, INK, MONO, RadioRow, Title, panelStyle } from './trazoUi'

interface StepTransportProps {
  active: boolean
  origin: Place | null
  destination: Place | null
  destinationName: string
  onProgress: (progress: number) => void
  onNext: () => void
}

/** Lo mínimo que dura la animación "Conectando X con Y" aunque la respuesta llegue al instante. */
const MIN_ANIMATION_MS = 1400

/**
 * 02 — Transporte. Siempre las cinco filas (Avión, Tren, Autobús, Ferry, En tu coche): activas solo las
 * aptas (Paso A + filtro por tipo de destino, ver transportRows.ts), el resto en gris con "Sin ruta".
 * Tiempos con "≈", distancia en km calculada con las coordenadas y nunca precios. Si solo hay una apta,
 * se marca sola. Después, las preguntas de vehículo de cada tipo de destino (vehicleFlow.ts).
 */
export function StepTransport({ active, origin, destination, destinationName, onProgress, onNext }: StepTransportProps) {
  const archetype = useRouteStore((state) => state.archetype)
  const archetypeAmbiguous = useRouteStore((state) => state.archetype_ambiguous)
  const classificationFailed = useRouteStore((state) => state.archetype_classification_failed)
  const requiereCoche = useRouteStore((state) => state.requiere_coche)
  const paseDominante = useRouteStore((state) => state.pase_dominante)
  const travelPassConfirmed = useRouteStore((state) => state.travel_pass_confirmed)
  const transportOption = useRouteStore((state) => state.transport_option)
  const vehicleType = useRouteStore((state) => state.vehicle_type)
  const vehicleOwnership = useRouteStore((state) => state.vehicle_ownership)
  const vehicleResolved = useRouteStore((state) => state.vehicle_resolved)
  const travelMode = useRouteStore((state) => state.travel_mode)
  const knownCamperAccess = useRouteStore((state) => state.known_camper_access)
  const setTransportOption = useRouteStore((state) => state.setTransportOption)
  const setVehicleType = useRouteStore((state) => state.setVehicleType)
  const setVehicleOwnership = useRouteStore((state) => state.setVehicleOwnership)
  const setVehicleResolved = useRouteStore((state) => state.setVehicleResolved)
  const setTravelMode = useRouteStore((state) => state.setTravelMode)
  const setTravelPassConfirmed = useRouteStore((state) => state.setTravelPassConfirmed)
  const resolveArchetypeChoice = useRouteStore((state) => state.resolveArchetypeChoice)

  const { loading, error, feasibility } = useTransportFeasibility(active || transportOption ? origin : null, active || transportOption ? destination : null)
  const dataReady = !loading && (Boolean(feasibility) || error)

  // Animación de "Conectando": avanza sola hasta el 90 % y termina en cuanto hay respuesta.
  const [prog, setProg] = useState(transportOption ? 1 : 0)
  const startRef = useRef<number | null>(null)
  useEffect(() => {
    if (!active) return
    if (transportOption) {
      setProg(1)
      return
    }
    startRef.current = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const elapsed = now - (startRef.current ?? now)
      const timeShare = Math.min(1, elapsed / MIN_ANIMATION_MS)
      const next = dataReadyRef.current ? timeShare : Math.min(0.9, timeShare * 0.9)
      setProg(next)
      if (next < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
  const dataReadyRef = useRef(dataReady)
  dataReadyRef.current = dataReady
  useEffect(() => {
    if (!active || !dataReady || prog >= 1) return
    let raf = 0
    const from = prog
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, from + (now - t0) / 500)
      setProg(p)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataReady, active])
  useEffect(() => {
    if (active) onProgress(prog)
  }, [prog, active, onProgress])

  const archetypeKnown = Boolean(archetype)
  const loadDone = prog >= 1 && dataReady && archetypeKnown
  const rows = useMemo(() => buildTransportRows(error ? null : feasibility, archetype, origin), [feasibility, error, archetype, origin])
  // Sin respuesta (error): avión como red de seguridad, como hasta ahora.
  const effectiveRows: TransportRow[] = useMemo(() => {
    if (!error) return rows
    return rows.map((row) => (row.id === 'flight' ? { ...row, apt: true, option: flightFallback() } : row))
  }, [rows, error])
  const aptRows = effectiveRows.filter((row) => row.apt)
  const recommended = aptRows.find((row) => row.recommended) ?? null
  const onlyOne = aptRows.length === 1

  const chooseRow = (row: TransportRow) => {
    if (!row.apt || !row.option) return
    if (transportOption?.id === row.option.id) return
    setTransportOption(row.option)
    if (row.id === 'own_vehicle') setVehicleOwnership('own')
  }

  // Al terminar la carga: si solo hay una apta, se marca sola; si hay varias, la recomendada queda marcada.
  useEffect(() => {
    if (!loadDone || transportOption) return
    const target = onlyOne ? aptRows[0] : recommended ?? aptRows[0]
    if (target) chooseRow(target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadDone])

  const camperOk = knownCamperAccess ?? feasibility?.camper_access.feasible ?? true
  const flow = followUp({
    archetype,
    optionId: transportOption?.id ?? null,
    destinationName,
    requiereCoche,
    paseDominante,
    camperOk,
    vehicle_type: vehicleType,
    vehicle_ownership: vehicleOwnership,
    vehicle_resolved: vehicleResolved,
    travel_mode: travelMode,
    travel_pass_confirmed: travelPassConfirmed,
  })
  const applyPatch = (patch: VehiclePatch) => {
    if ('vehicle_ownership' in patch) setVehicleOwnership(patch.vehicle_ownership ?? null)
    if ('vehicle_type' in patch) setVehicleType(patch.vehicle_type ?? null)
    if ('vehicle_resolved' in patch) setVehicleResolved(Boolean(patch.vehicle_resolved))
    if ('travel_mode' in patch) setTravelMode(patch.travel_mode ?? null)
    if ('travel_pass_confirmed' in patch) setTravelPassConfirmed(patch.travel_pass_confirmed ?? null)
  }
  // Destino no apto para camper: coche directamente, sin preguntar.
  const autoKey = flow.auto ? JSON.stringify(flow.auto) : null
  useEffect(() => {
    if (flow.auto && loadDone) applyPatch(flow.auto)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoKey, loadDone])

  const resolved = isTransportFullyResolved(archetype, transportOption, vehicleType, vehicleOwnership, vehicleResolved, travelMode, requiereCoche, paseDominante, travelPassConfirmed)
  const chosenRow = effectiveRows.find((row) => row.option && row.option.id === transportOption?.id) ?? null
  const km = kmBetween(origin, destination)
  const bestHours = Math.min(...aptRows.map((row) => row.hours ?? Infinity))
  const modeName = chosenRow ? (chosenRow.id === 'own_vehicle' && vehicleType ? (vehicleType === 'camper' ? 'camper' : 'coche') : chosenRow.en) : ''

  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = panelRef.current
    if (el) setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }), 60)
  }, [vehicleType, vehicleOwnership, vehicleResolved, travelMode, transportOption?.id])

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: `500 11px/1 ${MONO}`, letterSpacing: '.14em', color: AMBER, textTransform: 'uppercase' }}>
        {loadDone ? '02 — Ruta encontrada' : '02 — Calculando ruta…'}
      </div>
      <Title size={40}>
        {loadDone ? (
          <>
            ¿Cómo quieres llegar a <Em>{destinationName}</Em>?
          </>
        ) : (
          <>
            Conectando <Em>{origin?.name ?? ''}</Em> con <Em>{destinationName}</Em>
          </>
        )}
      </Title>
      <div style={{ flex: 1 }} />
      <div ref={panelRef} className="trazo-noscroll" style={{ ...panelStyle, padding: '18px 18px 12px', minHeight: 0, overflow: 'auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            font: `500 10px ${MONO}`,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: 'rgba(243,238,228,.55)',
            paddingBottom: 8,
            borderBottom: '1px solid rgba(243,238,228,.08)',
          }}
        >
          <span>Distancia</span>
          <span style={{ color: INK }}>{km != null ? `${Math.round(km).toLocaleString('es-ES')} km` : ''}</span>
        </div>

        {archetypeAmbiguous && !archetype && (
          <div style={{ paddingTop: 12 }}>
            <div style={{ font: "400 15px/1.4 'Geist'", color: INK, paddingBottom: 6 }}>¿Cómo te gustaría vivir {destinationName}?</div>
            <RadioRow label="Ruta panorámica en coche" description="Vas cambiando de sitio cada noche, la carretera es la experiencia" active={false} onClick={() => resolveArchetypeChoice('roadtrip_exclusivo')} />
            <RadioRow label="Explorar desde una base" description="Te quedas en una zona y sales a explorar sus pueblos y rincones" active={false} onClick={() => resolveArchetypeChoice('base_y_excursiones')} />
          </div>
        )}
        {classificationFailed && (
          <div style={{ paddingTop: 12, font: "400 14px/1.4 'Geist'", color: INK }}>
            No hemos podido saber qué tipo de destino es {destinationName} ahora mismo.{' '}
            <button type="button" onClick={() => classifyInBackground(destinationName)} style={{ border: 'none', background: 'transparent', color: AMBER, textDecoration: 'underline', cursor: 'pointer', font: "500 14px 'Geist'" }}>
              Reintentar
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 4 }}>
          {effectiveRows.map((row, i) => {
            const local = Math.max(0, Math.min(1, (prog - i * 0.16) / 0.36))
            const done = local >= 1 && dataReady
            const selected = loadDone && chosenRow?.id === row.id
            const barShare = row.apt ? Math.max(0.18, Math.min(1, row.hours && Number.isFinite(bestHours) ? bestHours / row.hours : 1)) : 0
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => loadDone && chooseRow(row)}
                disabled={!loadDone || !row.apt}
                style={{
                  width: 'calc(100% + 20px)',
                  margin: '0 -10px',
                  display: 'grid',
                  gridTemplateColumns: '112px minmax(0,1fr) auto',
                  alignItems: 'center',
                  gap: 12,
                  padding: `${flow.question ? 6 : 9}px 10px`,
                  minHeight: 44,
                  border: 'none',
                  borderRadius: 14,
                  background: selected ? 'rgba(242,181,68,.08)' : 'transparent',
                  color: INK,
                  textAlign: 'left',
                  cursor: loadDone && row.apt ? 'pointer' : 'default',
                  opacity: done && !row.apt ? 0.38 : 1,
                  transition: 'opacity .4s,background .35s',
                }}
              >
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, minWidth: 0 }}>
                  <span style={{ font: "500 15px 'Geist'", color: selected ? AMBER : INK, transition: 'color .4s', whiteSpace: 'nowrap' }}>{row.label}</span>
                  {loadDone && row.recommended && !onlyOne && (
                    <span
                      style={{
                        height: 16,
                        padding: '0 6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: 999,
                        background: AMBER,
                        color: '#17120a',
                        font: `600 9px ${MONO}`,
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Recomendado
                    </span>
                  )}
                </span>
                <div style={{ height: 4, borderRadius: 4, background: 'rgba(243,238,228,.08)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round(local * barShare * 100)}%`, background: selected ? AMBER : 'rgba(243,238,228,.55)', borderRadius: 4, transition: 'background .4s' }} />
                </div>
                <span style={{ font: `500 12px ${MONO}`, textAlign: 'right', color: selected ? AMBER : INK, transition: 'color .4s', whiteSpace: 'nowrap' }}>
                  {!done ? '···' : row.apt ? row.time || '—' : 'Sin ruta'}
                  {done && row.flightType && <span style={{ display: 'block', font: "400 10px 'Geist'", color: 'rgba(243,238,228,.62)', marginTop: 2 }}>{row.flightType}</span>}
                </span>
              </button>
            )
          })}
        </div>

        {loadDone && onlyOne && chosenRow && (
          <div style={{ padding: '12px 0 2px', font: "400 13px/1.4 'Geist'", color: 'rgba(243,238,228,.75)', textWrap: 'pretty' }}>
            Desde {origin?.name} solo tiene sentido llegar en {chosenRow.en}.
          </div>
        )}

        {loadDone && flow.cards.map((card) => <ConfirmedCard key={card.label} label={card.label} value={card.value} onChange={() => applyPatch(card.reset)} />)}

        {loadDone && flow.question && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: '1px solid rgba(243,238,228,.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              animation: 'trazo-chipIn .5s cubic-bezier(.2,.8,.2,1) both',
            }}
          >
            <div style={{ font: "400 15px/1.4 'Geist'", color: INK, paddingBottom: 6, textWrap: 'pretty' }}>{flow.question.title}</div>
            {flow.question.options.map((option) => (
              <RadioRow key={option.label} label={option.label} description={option.description} active={false} onClick={() => applyPatch(option.patch)} />
            ))}
          </div>
        )}
      </div>
      <div style={{ minHeight: 86, flex: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {loadDone && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'trazo-chipIn .6s cubic-bezier(.2,.8,.2,1) both' }}>
            {vehicleType === 'camper' && (
              <p style={{ margin: '12px 4px 0', font: "400 13px/1.45 'Geist'", color: INK, textWrap: 'pretty' }}>
                En {destinationName} tu camper se quedará aparcada en una zona periférica con buena conexión — te recomendamos moverte por el centro a pie o en transporte público.
              </p>
            )}
            {vehicleType === 'car' && !camperOk && (
              <p style={{ margin: '12px 4px 0', font: "400 13px/1.45 'Geist'", color: INK, textWrap: 'pretty' }}>{buildCarAccommodationMessage(destinationName, true)}</p>
            )}
            <Cta onClick={onNext} enabled={resolved}>
              {modeName ? `Ir en ${modeName} · Continuar` : 'Continuar'}
            </Cta>
          </div>
        )}
      </div>
    </>
  )
}

function flightFallback() {
  return {
    id: 'flight',
    icon: '✈️',
    title: 'Avión',
    description: '',
    subtitle: '',
    estimated_duration: '',
    estimated_price: '',
    recommended: false,
    includes_vehicle: false,
    vehicle_type: null,
    accommodation_type: 'hotel' as const,
  }
}

