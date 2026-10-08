import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Excursion, Route } from '../../../lib/types'
import { BIG_RESERVATION_PLACES, dayLineOf, dayOnDate, shortDateEs, type Reservation } from '../../../lib/bookings'
import { reservasParaMotor } from '../../../lib/engineReservas'
import { useRouteStore } from '../../../store/useRouteStore'

/** Lo que se está reservando: una entrada (con las paradas de la ruta que cubre) o una excursión. */
export interface ReservationTarget {
  kind: 'entrada' | 'excursion'
  refId: string
  name: string
  placeNames: string[]
  excursion?: Excursion | null
  /** El día en que está ahora en la ruta (para decir «la pasamos a tu Día 3» solo si cambia). */
  currentDayId?: string | null
}

/** El consejo del servidor para una reserva grande: solo se enseñan las mejores horas del día (Tanda 6j: la app ya no avisa de una hora sin lista; la acepta y adapta el día). */
interface ReservationAdvice {
  textoMejores: string | null
}

/** Qué se mueve al meter una reserva grande (/api/reservation-plan, Tanda 6j, punto 9). */
interface ReservationPlan {
  cambia: boolean
  mensaje: string | null
  motivos: string[]
  sinMover: { motivo: string } | null
}

type Tab = 'email' | 'file' | 'manual'

interface Fields {
  dateIso: string
  dayNumber: string
  time: string
  returnTime: string
  meetingPoint: string
  locator: string
}

const EMPTY: Fields = { dateIso: '', dayNumber: '', time: '', returnTime: '', meetingPoint: '', locator: '' }
const MAX_FILE_BYTES = 3_500_000

const inputClass = 'mt-1 h-11 w-full rounded-xl border border-text/15 bg-bg px-3 text-[15px] text-text placeholder:text-text-muted'

/** «Viernes 16 oct». */
function longWeekday(dateIso: string): string {
  const text = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(new Date(`${dateIso}T00:00:00`))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

async function fileToBase64(file: File): Promise<{ media_type: string; data: string }> {
  const asDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  // Una captura grande se baja a 1600 px: la confirmación se lee igual y viaja ligera.
  if (file.type.startsWith('image/') && file.size > 1_200_000) {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const url = canvas.toDataURL('image/jpeg', 0.85)
    return { media_type: 'image/jpeg', data: url.split(',')[1] }
  }
  const url = await asDataUrl(file)
  return { media_type: file.type, data: url.split(',')[1] }
}

/**
 * «Añade tu reserva» (PARA_CODE_RESERVAS, 4): una sola ventana, igual para todo. Pegar el email o subir la captura o el PDF se lee con IA y
 * enseña «Lo hemos leído así» para corregirlo; «A mano» pide solo lo necesario (día y hora; el resto es opcional). El día lo pone la fecha de la
 * reserva, nunca la app: si cae en otro día del viaje, la pasa a él y lo dice; si está fuera del viaje, no se guarda hasta que cuadre; sin fechas
 * en el viaje se elige el día. Lo que se lee del email se queda solo en el viaje, para el viajero.
 */
export function AddReservationSheet({ route, target, onClose }: { route: Route; target: ReservationTarget; onClose: () => void }) {
  const addReservation = useRouteStore((state) => state.addReservation)
  const reservations = useRouteStore((state) => state.reservations)
  const [confirming, setConfirming] = useState(false)
  const [tab, setTab] = useState<Tab>('email')
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const [readError, setReadError] = useState<string | null>(null)
  const [read, setRead] = useState(false)
  const [fields, setFields] = useState<Fields>(EMPTY)
  const fileRef = useRef<HTMLInputElement>(null)
  const hasDates = Boolean(route.answers.dateRange)
  const days = useMemo(() => route.days.filter((day) => !day.isReturnLeg), [route.days])
  const isExcursion = target.kind === 'excursion'

  const set = (patch: Partial<Fields>) => setFields((previous) => ({ ...previous, ...patch }))

  // El día de la reserva: el de su fecha; sin fechas en el viaje, el que se elige.
  const resolvedDay = hasDates ? (fields.dateIso ? dayOnDate(route, fields.dateIso) : null) : (days.find((day) => String(day.dayNumber) === fields.dayNumber) ?? null)
  const outside = hasDates && Boolean(fields.dateIso) && !resolvedDay
  const moved = Boolean(resolvedDay && target.currentDayId && resolvedDay.id !== target.currentDayId)
  const ready = Boolean(resolvedDay && fields.time && /^\d{1,2}:\d{2}$/.test(fields.time))

  // Las mejores horas del día de la reserva (de las listas escritas) y qué día se mueve a la fecha de la reserva. Todo sale del servidor, sin Claude.
  // (Tanda 6j: ya no hay aviso de «a esa hora no tenemos escrito…»: si el viajero pone una hora es porque ya la ha reservado; la app la acepta y adapta el día.)
  const [advice, setAdvice] = useState<ReservationAdvice | null>(null)
  const [plan, setPlan] = useState<ReservationPlan | null>(null)
  const bigPlace = target.placeNames.find((name) => BIG_RESERVATION_PLACES.includes(name)) ?? null
  const validTime = /^\d{1,2}:\d{2}$/.test(fields.time)
  const adviceKey = resolvedDay && bigPlace && !isExcursion && validTime && resolvedDay.curatedId ? `${resolvedDay.id}|${resolvedDay.curatedId}|${bigPlace}|${fields.time}` : null
  const planKey = resolvedDay && bigPlace && !isExcursion && validTime ? `${resolvedDay.id}|${fields.dateIso}|${bigPlace}|${fields.time}` : null
  useEffect(() => {
    if (!adviceKey || !resolvedDay) {
      setAdvice(null)
      return
    }
    let cancelled = false
    fetch('/api/reservation-advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: route.destination,
        curated_day_id: resolvedDay.curatedId,
        place_names: target.placeNames,
        time: fields.time,
        has_free_tour: resolvedDay.stops.some((stop) => stop.isFreeTour),
        excursion_morning: Boolean(resolvedDay.halfDayExcursion),
      }),
    })
      .then((response) => (response.ok ? (response.json() as Promise<ReservationAdvice>) : null))
      .then((body) => {
        if (!cancelled) setAdvice(body)
      })
      .catch(() => {
        if (!cancelled) setAdvice(null)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adviceKey])
  const draftReservation = (): Reservation | null => {
    if (!resolvedDay) return null
    return {
      id: `res-${Date.now()}`,
      kind: target.kind,
      refId: target.refId,
      name: target.name,
      placeNames: target.placeNames,
      dateIso: hasDates ? fields.dateIso : null,
      dayNumber: hasDates ? null : resolvedDay.dayNumber,
      time: fields.time.length === 4 ? `0${fields.time}` : fields.time,
      returnTime: fields.returnTime || null,
      meetingPoint: fields.meetingPoint.trim() || null,
      locator: fields.locator.trim() || null,
      excursionId: target.excursion?.id ?? null,
      excursionData: target.excursion ?? null,
    }
  }
  useEffect(() => {
    const draft = planKey ? draftReservation() : null
    if (!draft) {
      setPlan(null)
      return
    }
    let cancelled = false
    const others = reservations.filter((other) => !(other.kind === draft.kind && other.refId === draft.refId))
    fetch('/api/reservation-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: route.destination,
        answers: route.answers,
        all_days: days.map((day) => ({ day_number: day.dayNumber, city: day.city })),
        must_include_places: route.mustIncludePlaces ?? [],
        inside_names: route.insideNames ?? [],
        reserva: { placeNames: draft.placeNames, dateIso: draft.dateIso, dayNumber: draft.dayNumber, time: draft.time },
        reservas: reservasParaMotor([...others, draft]),
        reservas_antes: reservasParaMotor(others),
      }),
    })
      .then((response) => (response.ok ? (response.json() as Promise<ReservationPlan>) : null))
      .then((body) => {
        if (!cancelled) setPlan(body)
      })
      .catch(() => {
        if (!cancelled) setPlan(null)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey])

  const applyRead = (data: { fecha: string | null; hora: string | null; hora_vuelta: string | null; punto_encuentro: string | null; localizador: string | null }) => {
    setFields((previous) => ({
      ...previous,
      dateIso: data.fecha ?? previous.dateIso,
      time: data.hora ?? previous.time,
      returnTime: data.hora_vuelta ?? previous.returnTime,
      meetingPoint: data.punto_encuentro ?? previous.meetingPoint,
      locator: data.localizador ?? previous.locator,
    }))
    setRead(true)
  }

  const readBooking = async (body: Record<string, unknown>) => {
    setReading(true)
    setReadError(null)
    try {
      const response = await fetch('/api/read-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: target.kind, name: target.name, year_hint: route.answers.dateRange ? Number(route.answers.dateRange.start.slice(0, 4)) : undefined, ...body }),
      })
      if (!response.ok) throw new Error('lectura')
      applyRead(await response.json())
    } catch {
      setReadError('No hemos podido leer la confirmación. Puedes añadirla a mano.')
    } finally {
      setReading(false)
    }
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_FILE_BYTES && !file.type.startsWith('image/')) {
      setReadError('El archivo es demasiado grande. Prueba con una captura o añádela a mano.')
      return
    }
    setFileName(file.name)
    try {
      await readBooking({ file: await fileToBase64(file) })
    } catch {
      setReadError('No hemos podido abrir el archivo. Puedes añadirla a mano.')
    }
  }

  /** Guardar: con un día que se mueve, antes la hoja que lo explica; si el día es una excursión, la reserva se guarda con su aviso y la ruta no cambia. */
  const save = (confirmed = false) => {
    if (!resolvedDay || !ready) return
    if (plan?.cambia && !confirmed) {
      setConfirming(true)
      return
    }
    const reservation = draftReservation()
    if (!reservation) return
    if (plan?.sinMover?.motivo === 'excursion') {
      const excursion = resolvedDay.excursions?.find((option) => option.id === resolvedDay.selectedExcursionId)?.title ?? 'la excursión'
      const sitio = bigPlace === 'Coliseo' ? 'el Coliseo' : bigPlace === 'Galería Borghese' ? 'la Galería Borghese' : 'el Vaticano'
      reservation.noMueve = true
      reservation.aviso = `El día ${resolvedDay.dayNumber}${fields.dateIso ? ` (${shortDateEs(fields.dateIso)})` : ''} tienes la excursión a ${excursion.replace(/^Excursión (a la|a los|a las|al|a)\s+/i, '')}: no da tiempo a visitar también ${sitio}.`
    }
    addReservation(reservation, target.excursion ?? null)
    onClose()
  }

  const showForm = tab === 'manual' || read
  const dayLine = resolvedDay && fields.dateIso && hasDates ? `${longWeekday(fields.dateIso)} ${shortDateEs(fields.dateIso).split(' ').slice(1).join(' ')} → tu Día ${resolvedDay.dayNumber}` : null

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="add-reservation-heading">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={onClose} />
      <div className="trazo-notice-panel relative flex max-h-[92dvh] w-full flex-col rounded-t-[28px] bg-bg-card shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[440px] md:rounded-[28px]">
        <div className="flex shrink-0 justify-center pt-2.5" aria-hidden="true">
          <span className="h-1 w-[42px] rounded-full bg-text/20" />
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-text-soft hover:bg-bg-hover">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4">
          <p className="max-w-[calc(100%-2.5rem)] font-mono text-[10.5px] font-medium uppercase tracking-[.12em] text-accent">{target.name}</p>
          <h2 id="add-reservation-heading" className="mt-1.5 font-display text-[26px] leading-[1.15] text-text">
            Añade tu reserva
          </h2>

          <div className="mt-4 flex gap-1.5 rounded-full bg-bg-hover p-1" role="tablist">
            {(
              [
                ['email', 'Pegar email'],
                ['file', 'Captura o PDF'],
                ['manual', 'A mano'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`h-9 flex-1 rounded-full text-[13px] font-medium transition-colors ${tab === id ? 'bg-bg-card text-text shadow-sm' : 'text-text-soft'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'email' && (
            <div className="mt-4">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={5}
                placeholder="Pega aquí el email de confirmación"
                className="w-full rounded-xl border border-text/15 bg-bg px-3 py-2.5 text-[14.5px] text-text placeholder:text-text-muted"
              />
              <button
                type="button"
                disabled={reading || text.trim().length < 10}
                onClick={() => void readBooking({ text })}
                className="mt-2 h-11 w-full rounded-full border border-text/15 text-[14.5px] font-medium text-text transition-colors hover:bg-bg-hover disabled:opacity-40"
              >
                {reading ? 'Leyendo…' : 'Leer mi reserva'}
              </button>
            </div>
          )}

          {tab === 'file' && (
            <div className="mt-4">
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={(event) => void onFile(event.target.files?.[0])} />
              <button
                type="button"
                disabled={reading}
                onClick={() => fileRef.current?.click()}
                className="flex h-24 w-full flex-col items-center justify-center rounded-2xl border-[1.5px] border-dashed border-text/25 text-[14.5px] text-text-soft transition-colors hover:bg-bg-hover disabled:opacity-60"
              >
                {reading ? 'Leyendo…' : fileName ? fileName : 'Sube una captura o un PDF'}
              </button>
            </div>
          )}

          {readError && <p className="mt-3 text-[13px] leading-snug text-accent-red">{readError}</p>}

          {showForm && (
            <div className="mt-5">
              {read && tab !== 'manual' && <p className="font-mono text-[10.5px] font-medium uppercase tracking-[.14em] text-text-muted">Lo hemos leído así</p>}
              {hasDates ? (
                <label className="mt-2 block">
                  <span className="text-[12px] font-medium text-text-soft">Día</span>
                  <input type="date" value={fields.dateIso} onChange={(event) => set({ dateIso: event.target.value })} className={inputClass} />
                </label>
              ) : (
                <label className="mt-2 block">
                  <span className="text-[12px] font-medium text-text-soft">Día del viaje</span>
                  <select value={fields.dayNumber} onChange={(event) => set({ dayNumber: event.target.value })} className={inputClass}>
                    <option value="">Elige el día</option>
                    {days.map((day) => (
                      <option key={day.id} value={day.dayNumber}>
                        {dayLineOf(route, day)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {dayLine && !outside && <p className="mt-1.5 text-[13px] font-medium text-text">{dayLine}</p>}
              {outside && (
                <p className="mt-1.5 text-[13px] leading-snug text-accent-red">
                  Tu reserva es del {shortDateEs(fields.dateIso)}, fuera de las fechas de tu viaje. Revisa la fecha.
                </p>
              )}
              {advice?.textoMejores && !outside && <p className="mt-1.5 text-[13px] leading-snug text-text-soft">{advice.textoMejores}</p>}
              {plan?.sinMover?.motivo === 'excursion' && !outside && resolvedDay && (
                <p className="mt-1.5 text-[13px] leading-snug text-text">
                  El día {resolvedDay.dayNumber} tienes la excursión: la reserva se guarda en Reservas con el aviso y tu ruta no cambia.
                </p>
              )}
              {moved && resolvedDay && !outside && (
                <p className="mt-1.5 text-[13px] leading-snug text-text">
                  Tu reserva es del {longWeekday(fields.dateIso).toLowerCase()} {Number(fields.dateIso.slice(8, 10))}: la pasamos a tu Día {resolvedDay.dayNumber}.
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <label className="flex-1">
                  <span className="text-[12px] font-medium text-text-soft">{isExcursion ? 'Hora de recogida' : 'Hora de entrada'}</span>
                  <input type="time" value={fields.time} onChange={(event) => set({ time: event.target.value })} className={inputClass} />
                </label>
                {isExcursion && (
                  <label className="flex-1">
                    <span className="text-[12px] font-medium text-text-soft">Hora de vuelta (opcional)</span>
                    <input type="time" value={fields.returnTime} onChange={(event) => set({ returnTime: event.target.value })} className={inputClass} />
                  </label>
                )}
              </div>
              {isExcursion && (
                <label className="mt-3 block">
                  <span className="text-[12px] font-medium text-text-soft">Punto de encuentro (opcional)</span>
                  <input value={fields.meetingPoint} onChange={(event) => set({ meetingPoint: event.target.value })} className={inputClass} />
                </label>
              )}
              <label className="mt-3 block">
                <span className="text-[12px] font-medium text-text-soft">N.º de reserva{isExcursion ? ' (opcional)' : ' (opcional)'}</span>
                <input value={fields.locator} onChange={(event) => set({ locator: event.target.value })} className={inputClass} />
              </label>
            </div>
          )}
        </div>

        <div className="px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
          <button type="button" disabled={!ready} onClick={() => save()} className="h-12 w-full rounded-full bg-text text-[15px] font-medium text-bg transition-transform active:scale-[.98] disabled:opacity-40">
            {resolvedDay ? `Guardar y ponerla en el Día ${resolvedDay.dayNumber}` : 'Guardar y ponerla en su día'}
          </button>
        </div>
      </div>
      {confirming && plan?.cambia && (
        <div className="absolute inset-0 z-[5] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="move-day-heading">
          <div className="absolute inset-0 bg-text/25" onClick={() => setConfirming(false)} />
          <div className="trazo-notice-panel relative w-full rounded-t-[28px] bg-bg-card px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[440px] md:rounded-[28px]">
            <h2 id="move-day-heading" className="font-display text-[22px] leading-[1.2] text-text">
              {plan.mensaje}
            </h2>
            {plan.motivos.length > 0 && <p className="mt-3 text-[14.5px] leading-snug text-text-soft">{plan.motivos.join(' ')}</p>}
            <button type="button" onClick={() => save(true)} className="mt-5 h-12 w-full rounded-full bg-text text-[15px] font-medium text-bg transition-transform active:scale-[.98]">
              De acuerdo
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}
