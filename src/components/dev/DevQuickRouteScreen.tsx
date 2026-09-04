import { useState } from 'react'
import type { DayPlan, Route, Stop } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'
import { searchPlaces } from '../../lib/mapboxGeocoding'
import { addDaysToIso, todayIso } from '../../lib/dateRange'
import { appendReturnLegDay } from '../../lib/tripDays'
import { capitalizePlaceName } from '../../lib/placeName'
import { categoryLabel } from '../../lib/explorePool'
import { EXPERIENCE_BANK } from '../../lib/experienceBank'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

const inputClasses = 'w-full rounded-xl border border-border bg-bg px-3 py-2 text-body text-text focus:border-accent focus:outline-none'

type Phase = 'setup' | 'stops'

interface StopDraft {
  city: string
  /** Código ISO de país en minúsculas, override manual — vacío = se infiere del geocoding al enviar. */
  countryCode: string
  nights: string
}

function emptyStop(): StopDraft {
  return { city: '', countryCode: '', nights: '2' }
}

interface ManualStopDraft {
  name: string
  startTime: string
  endTime: string
  /** Vacío = sin categoría (campo opcional del banco de 18, igual que las paradas del Pool/EXPLORAR). */
  categoryId: string
  photoUrl: string
}

function emptyManualStop(): ManualStopDraft {
  return { name: '', startTime: '', endTime: '', categoryId: '', photoUrl: '' }
}

interface DayDraft {
  dayNumber: number
  city: string
  manualStops: ManualStopDraft[]
}

/** Minutos entre dos "HH:MM" — si falta la hora de fin o es anterior a la de inicio, usa 60min por defecto. */
function minutesBetween(start: string, end: string): number {
  const [startH, startM] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)
  if (![startH, startM, endH, endM].every(Number.isFinite)) return 60
  const diff = endH * 60 + endM - (startH * 60 + startM)
  return diff > 0 ? diff : 60
}

/**
 * Pequeño desplazamiento determinista alrededor del centro de la ciudad para que las paradas
 * manuales de un mismo día no queden apiladas exactamente en el mismo punto del mapa — no hay
 * dirección real, es solo separación visual para probar el mapa/las distancias en Modo Hoy.
 */
function jitterCoordinates(base: { lat: number; lng: number }, index: number) {
  const angle = index * 2.4
  const radius = 0.002 * (index + 1)
  return { lat: base.lat + Math.cos(angle) * radius, lng: base.lng + Math.sin(angle) * radius }
}

/**
 * Pantalla de acceso rápido SOLO para desarrollo — construye una Route directamente en el store
 * (geocoding real vía Mapbox para coordenadas/bandera, pero SIN clasificación de arquetipo,
 * transporte, acompañantes, experiencias ni llamada a Claude) para poder iterar sobre el diseño de
 * la pestaña RUTA sin esperar ni gastar tokens. DIAS/RESERVAS muestran un estado vacío para estas
 * rutas — ver `route.isDevQuickRoute` en RouteView.tsx.
 *
 * Segundo paso opcional ("stops"): una vez definidos destinos/noches, permite añadir paradas
 * manuales por día (nombre, horas, categoría opcional, foto opcional) con el mismo esquema de
 * `Stop` que ya consumen DIAS y Modo Hoy — para simular un día completo (2-3 paradas reales) y
 * probar Modo Hoy de principio a fin sin depender del pipeline de IA.
 */
export function DevQuickRouteScreen() {
  const setRoute = useRouteStore((state) => state.setRoute)
  const setScreen = useRouteStore((state) => state.setScreen)

  const [phase, setPhase] = useState<Phase>('setup')
  const [origin, setOrigin] = useState('')
  const [stops, setStops] = useState<StopDraft[]>([emptyStop()])
  const [dayDrafts, setDayDrafts] = useState<DayDraft[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateStop = (index: number, patch: Partial<StopDraft>) => {
    setStops((prev) => prev.map((stop, i) => (i === index ? { ...stop, ...patch } : stop)))
  }

  const addStop = () => setStops((prev) => [...prev, emptyStop()])
  const removeStop = (index: number) => setStops((prev) => prev.filter((_, i) => i !== index))

  const cleanStops = () =>
    stops
      .map((stop) => ({ city: capitalizePlaceName(stop.city), countryCode: stop.countryCode.trim().toLowerCase(), nights: Number(stop.nights) }))
      .filter((stop) => stop.city.length > 0)

  const handleContinue = () => {
    const cleanedStops = cleanStops()
    if (!origin.trim() || cleanedStops.length === 0 || cleanedStops.some((stop) => !Number.isFinite(stop.nights) || stop.nights < 1)) {
      setError('Rellena origen, y al menos una parada con ciudad y noches ≥ 1.')
      return
    }
    setError(null)

    const drafts: DayDraft[] = []
    let dayNumber = 1
    cleanedStops.forEach((stopDraft) => {
      for (let i = 0; i < stopDraft.nights; i++) {
        drafts.push({ dayNumber, city: stopDraft.city, manualStops: [] })
        dayNumber += 1
      }
    })
    setDayDrafts(drafts)
    setPhase('stops')
  }

  const updateManualStop = (dayIndex: number, stopIndex: number, patch: Partial<ManualStopDraft>) => {
    setDayDrafts((prev) =>
      prev.map((day, di) =>
        di === dayIndex ? { ...day, manualStops: day.manualStops.map((stop, si) => (si === stopIndex ? { ...stop, ...patch } : stop)) } : day,
      ),
    )
  }

  const addManualStop = (dayIndex: number) => {
    setDayDrafts((prev) => prev.map((day, di) => (di === dayIndex ? { ...day, manualStops: [...day.manualStops, emptyManualStop()] } : day)))
  }

  const removeManualStop = (dayIndex: number, stopIndex: number) => {
    setDayDrafts((prev) =>
      prev.map((day, di) => (di === dayIndex ? { ...day, manualStops: day.manualStops.filter((_, si) => si !== stopIndex) } : day)),
    )
  }

  const handleSubmit = async () => {
    const cleanedStops = cleanStops()
    const originName = capitalizePlaceName(origin)

    setLoading(true)
    setError(null)

    try {
      const resolvedPlaces = await Promise.all(cleanedStops.map((stop) => searchPlaces(stop.city)))

      const routeDays: DayPlan[] = []
      let dayNumber = 1
      cleanedStops.forEach((stopDraft, stopIndex) => {
        const place = resolvedPlaces[stopIndex][0] ?? null
        const countryCode = stopDraft.countryCode || place?.countryCode || null

        for (let i = 0; i < stopDraft.nights; i++) {
          const dayDraft = dayDrafts.find((draft) => draft.dayNumber === dayNumber)
          const cleanedManualStops = (dayDraft?.manualStops ?? []).filter((stop) => stop.name.trim().length > 0)

          const dayStops: Stop[] =
            i === 0 && place
              ? [
                  {
                    id: `dev-stop-${dayNumber}`,
                    time: '09:00',
                    name: stopDraft.city,
                    description: '',
                    durationMinutes: 0,
                    coordinates: place.coordinates,
                    photoUrl: '',
                  },
                ]
              : []

          cleanedManualStops.forEach((manualStop, manualIndex) => {
            const id = `dev-manual-stop-${dayNumber}-${manualIndex}`
            dayStops.push({
              id,
              time: manualStop.startTime || '09:00',
              name: manualStop.name.trim(),
              description: '',
              durationMinutes: minutesBetween(manualStop.startTime, manualStop.endTime),
              coordinates: place ? jitterCoordinates(place.coordinates, manualIndex) : { lat: 0, lng: 0 },
              photoUrl: manualStop.photoUrl.trim() || `https://picsum.photos/seed/${encodeURIComponent(id)}/400/300`,
              categoryLabel: manualStop.categoryId ? categoryLabel(manualStop.categoryId as Parameters<typeof categoryLabel>[0]) : undefined,
            })
          })

          routeDays.push({
            id: `dev-day-${dayNumber}`,
            dayNumber,
            city: stopDraft.city,
            title: `Día ${dayNumber} en ${stopDraft.city}`,
            stops: dayStops,
            meals: [],
            countryCode,
          })
          dayNumber += 1
        }
      })

      const nightsTotal = routeDays.length
      const finalDays = appendReturnLegDay(routeDays)
      const startIso = todayIso()
      const endIso = addDaysToIso(startIso, finalDays.length - 1)

      const route: Route = {
        id: `dev-route-${Date.now()}`,
        destination: cleanedStops.map((stop) => stop.city).join(' → '),
        country: '',
        origin: originName,
        days: finalDays,
        answers: {
          origin: originName,
          days: nightsTotal,
          dateRange: { start: startIso, end: endIso },
          companion: 'solo',
          experiences: [],
          pace: 'balanced',
          chronotype: 'normal',
          budgetLevel: 'comfortable',
        },
        transportContext: {
          archetype: null,
          is_region: null,
          transport_option: null,
          vehicle_type: null,
          vehicle_ownership: null,
          accommodation_mode: null,
          travel_mode: null,
          pase_dominante: null,
          vehiculo_altamente_recomendado: false,
          travel_pass_confirmed: null,
        },
        budget: { items: [], total: 0 },
        intensity: 3,
        createdAt: new Date().toISOString(),
        isDevQuickRoute: true,
      }

      // setRoute ya decide el modo inicial (Hoy si la fecha de hoy cae en el viaje, Ruta si no — ver getTodayTripContext).
      setRoute(route)
      setScreen('route')
    } catch {
      setError('No se pudo crear la ruta de prueba.')
    } finally {
      setLoading(false)
    }
  }

  if (phase === 'stops') {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-bg px-6 py-12">
        <Card className="w-full max-w-lg space-y-5 p-6">
          <div>
            <p className="text-caption font-semibold uppercase tracking-wide text-accent">🧪 Solo desarrollo</p>
            <h1 className="font-display text-h2 font-semibold text-text">Paradas manuales por día</h1>
            <p className="mt-1 text-small text-text-soft">
              Opcional — añade 1 o varias paradas reales (nombre + horas) a los días que quieras, para probar Modo Hoy de
              principio a fin sin esperar al pipeline con IA.
            </p>
          </div>

          <div className="max-h-[50vh] space-y-3 overflow-y-auto">
            {dayDrafts.map((day, dayIndex) => (
              <div key={day.dayNumber} className="space-y-2 rounded-xl border border-border p-3">
                <p className="text-small font-semibold text-text">
                  Día {day.dayNumber} · {day.city}
                </p>

                {day.manualStops.map((stop, stopIndex) => (
                  <div key={stopIndex} className="space-y-2 rounded-lg bg-bg-hover p-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={stop.name}
                        onChange={(event) => updateManualStop(dayIndex, stopIndex, { name: event.target.value })}
                        placeholder="Nombre del lugar"
                        className={`${inputClasses} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => removeManualStop(dayIndex, stopIndex)}
                        aria-label="Quitar parada"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-text-soft transition-colors hover:border-border-accent hover:text-text"
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <label className="flex items-center gap-1.5 text-caption text-text-muted">
                        Inicio
                        <input
                          type="time"
                          value={stop.startTime}
                          onChange={(event) => updateManualStop(dayIndex, stopIndex, { startTime: event.target.value })}
                          className={inputClasses}
                        />
                      </label>
                      <label className="flex items-center gap-1.5 text-caption text-text-muted">
                        Fin
                        <input
                          type="time"
                          value={stop.endTime}
                          onChange={(event) => updateManualStop(dayIndex, stopIndex, { endTime: event.target.value })}
                          className={inputClasses}
                        />
                      </label>
                      <label className="flex flex-1 items-center gap-1.5 text-caption text-text-muted">
                        Categoría
                        <select
                          value={stop.categoryId}
                          onChange={(event) => updateManualStop(dayIndex, stopIndex, { categoryId: event.target.value })}
                          className={inputClasses}
                        >
                          <option value="">Sin categoría</option>
                          {EXPERIENCE_BANK.map((entry) => (
                            <option key={entry.id} value={entry.id}>
                              {entry.icon} {entry.title}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={stop.photoUrl}
                      onChange={(event) => updateManualStop(dayIndex, stopIndex, { photoUrl: event.target.value })}
                      placeholder="URL de foto (opcional, si se deja vacío se usa una genérica)"
                      className={inputClasses}
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addManualStop(dayIndex)}
                  className="text-caption font-medium text-accent hover:text-accent-hover"
                >
                  + Añadir parada
                </button>
              </div>
            ))}
          </div>

          {error && <p className="text-small text-red-500">{error}</p>}

          <div className="flex gap-2">
            <Button onClick={() => setPhase('setup')} variant="secondary" className="flex-1">
              ← Atrás
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? 'Creando ruta...' : 'Crear ruta y ver RUTA'}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-bg px-6 py-12">
      <Card className="w-full max-w-lg space-y-5 p-6">
        <div>
          <p className="text-caption font-semibold uppercase tracking-wide text-accent">🧪 Solo desarrollo</p>
          <h1 className="font-display text-h2 font-semibold text-text">Ruta rápida de prueba</h1>
          <p className="mt-1 text-small text-text-soft">
            Crea una ruta directamente en el store, sin clasificación, transporte, cuestionario ni llamadas a Claude — solo para
            ajustar visualmente la pestaña RUTA.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-small font-medium text-text">Origen</label>
          <input type="text" value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder="Madrid" className={inputClasses} />
        </div>

        <div className="space-y-1.5">
          <label className="text-small font-medium text-text">Paradas</label>
          <div className="space-y-2">
            {stops.map((stop, index) => (
              <div key={index} className="space-y-2 rounded-xl border border-border p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={stop.city}
                    onChange={(event) => updateStop(index, { city: event.target.value })}
                    placeholder={`Parada ${index + 1} (ciudad/pueblo)`}
                    className={`${inputClasses} flex-1`}
                  />
                  {stops.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStop(index)}
                      aria-label={`Quitar parada ${index + 1}`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-text-soft transition-colors hover:border-border-accent hover:text-text"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <label className="flex flex-1 items-center gap-2 text-caption text-text-muted">
                    País
                    <input
                      type="text"
                      value={stop.countryCode}
                      onChange={(event) => updateStop(index, { countryCode: event.target.value })}
                      placeholder="auto"
                      title="Código ISO de país (ej. es) — opcional, se infiere automáticamente si se deja vacío"
                      maxLength={2}
                      className={`${inputClasses} uppercase`}
                    />
                  </label>
                  <label className="flex flex-1 items-center gap-2 text-caption text-text-muted">
                    Noches
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={stop.nights}
                      onChange={(event) => updateStop(index, { nights: event.target.value })}
                      className={inputClasses}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addStop} className="text-caption font-medium text-accent hover:text-accent-hover">
            + Añadir parada
          </button>
          <p className="text-caption text-text-muted">
            País es opcional (código ISO de 2 letras, ej. "es") — si se deja vacío se infiere del geocoding de la ciudad.
          </p>
        </div>

        {error && <p className="text-small text-red-500">{error}</p>}

        <Button onClick={handleContinue} className="w-full">
          Continuar →
        </Button>
      </Card>
    </div>
  )
}
