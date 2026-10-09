import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { Excursion, Route } from '../../../lib/types'
import { BIG_RESERVATION_PLACES, dateOfDay, dayLineOf, dayOfReservation, dayOnDate, isDayPinned, shortDateEs, type Reservation } from '../../../lib/bookings'
import { reservasParaMotor } from '../../../lib/engineReservas'
import { excursionTargetDays } from '../../../lib/excursionOffer'
import { useRouteStore } from '../../../store/useRouteStore'
import { useNoticesStore } from '../../../store/useNoticesStore'
import { DateField } from '../../ui/DateField'
import { TimeField } from '../../ui/TimeField'
import { TimeListWheel } from '../../ui/TimeListWheel'

/** Lo que se está reservando: una entrada (con las paradas de la ruta que cubre) o una excursión. */
export interface ReservationTarget {
  kind: 'entrada' | 'excursion'
  refId: string
  name: string
  placeNames: string[]
  excursion?: Excursion | null
  /** El día en que está ahora en la ruta (para decir «la pasamos a tu Día 3» solo si cambia). */
  currentDayId?: string | null
  /** «Cambiar»: la reserva que ya hay (la hoja sale con su día y su hora, y con «Eliminar reserva»). */
  existing?: Reservation | null
  /** «Añadir una excursión · 2 de 2»: viene de elegir la excursión en la hoja de «¿Qué excursión tienes?». */
  paso2?: boolean
}

/** La regla 17 (Tanda 6k): la lista escrita del día que llevará el sitio, a la hora de la reserva. */
interface ReservationAdvice {
  estado: 'bien' | 'sin_lista' | 'no_cabe' | 'sin_definir'
  mejores: string[]
}

/** Qué se mueve al meter una reserva grande (/api/reservation-plan). */
interface ReservationPlan {
  cambia: boolean
  mensaje: string | null
  motivos: string[]
  sinMover: { motivo: string } | null
  cambios: { dayNumber: number; de: string | null; a: string | null }[]
  consejo: ReservationAdvice | null
}

/** Las horas a las que se puede entrar ese día (de la apertura a la última entrada). */
interface EntryHours {
  cerrado: boolean
  ventanas: { desde: string; hasta: string }[]
  /** Los sitios con turnos propios (la Galería): solo esas horas. */
  turnos?: string[] | null
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
/** Las horas del Free Tour: pocas, así que van como botones y no como rueda. */
const FREE_TOUR_HOURS = ['10:00', '12:00', '15:00', '17:00', '21:00']

const inputClass = 'mt-1 h-11 w-full rounded-xl border border-text/15 bg-bg px-3 text-[15px] text-text placeholder:text-text-muted'

/** «Viernes 16 oct». Con una fecha que no sirve, vacío (nunca rompe la pantalla). */
function longWeekday(dateIso: string): string {
  const date = new Date(`${dateIso}T00:00:00`)
  if (!dateIso || Number.isNaN(date.getTime())) return ''
  const text = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(date)
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

/** El nombre del día de un sitio grande, como se dice en la hoja y en el aviso. */
const DEL: Record<string, string> = { Coliseo: 'del Coliseo', 'Museos Vaticanos y Capilla Sixtina': 'del Vaticano', 'Galería Borghese': 'de la Galería Borghese' }
const EL: Record<string, string> = { Coliseo: 'el Coliseo', 'Museos Vaticanos y Capilla Sixtina': 'el Vaticano', 'Galería Borghese': 'la Galería Borghese' }

/**
 * Red de seguridad de esta ventana (Tanda 6k, punto 1): si algo falla al dibujarla, la ventana se cierra, sale un aviso en la campana y la app sigue funcionando;
 * nunca la pantalla de «Algo ha ido mal» por una reserva.
 */
class SheetBoundary extends Component<{ children: ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error) {
    console.error('[AddReservationSheet]', error)
    useNoticesStore.getState().push({ id: `reserva-ventana-${Date.now()}`, kind: 'info', title: 'No se pudo abrir la reserva', text: 'No hemos podido mostrar la ventana de la reserva. Tu ruta no ha cambiado; prueba otra vez desde Reservas.' })
    this.props.onFail()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/**
 * «Añade tu reserva» (PARA_CODE_RESERVAS, 4): una sola ventana, igual para todo. Pegar el email o subir la captura o el PDF se lee con IA y
 * enseña «Lo hemos leído así» para corregirlo; «A mano» pide solo lo necesario (día y hora; el resto es opcional). El día lo pone la fecha de la
 * reserva, nunca la app: si cae en otro día del viaje, la pasa a él y lo dice; si está fuera del viaje, no se guarda hasta que cuadre; sin fechas
 * en el viaje se elige el día. Lo que se lee del email se queda solo en el viaje, para el viajero.
 */
export function AddReservationSheet({ route, target, onClose }: { route: Route; target: ReservationTarget; onClose: () => void }) {
  return (
    <SheetBoundary onFail={onClose}>
      <AddReservationSheetInner route={route} target={target} onClose={onClose} />
    </SheetBoundary>
  )
}

function AddReservationSheetInner({ route, target, onClose }: { route: Route; target: ReservationTarget; onClose: () => void }) {
  const addReservation = useRouteStore((state) => state.addReservation)
  const removeReservation = useRouteStore((state) => state.removeReservation)
  const reservations = useRouteStore((state) => state.reservations)
  const [confirming, setConfirming] = useState(false)
  const [rule17, setRule17] = useState(false)
  const [rule17Kept, setRule17Kept] = useState(false)
  const [tab, setTab] = useState<Tab>('email')
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const [readError, setReadError] = useState<string | null>(null)
  const [read, setRead] = useState(false)
  const hasDates = Boolean(route.answers.dateRange)
  const days = useMemo(() => route.days.filter((day) => !day.isReturnLeg), [route.days])
  const isExcursion = target.kind === 'excursion'
  // El día donde está ahora ese sitio: sale ya elegido (Tanda 6k, punto 4), con «· aquí está ahora»; así se sabe que se pone en el día bueno y no se mueve nada.
  const currentDay = useMemo(() => days.find((day) => day.id === target.currentDayId) ?? null, [days, target.currentDayId])
  // Una excursión sin día en la ruta parte del primer día donde puede ir (nunca el de llegada ni el de vuelta).
  const startDay = currentDay ?? (isExcursion ? (excursionTargetDays(route)[0] ?? null) : null)
  const existing = target.existing ?? null
  const [fields, setFields] = useState<Fields>(() => ({
    ...EMPTY,
    dateIso: existing?.dateIso ?? (hasDates && startDay ? (dateOfDay(route, startDay) ?? '') : ''),
    dayNumber: existing?.dayNumber != null ? String(existing.dayNumber) : !hasDates && startDay ? String(startDay.dayNumber) : '',
    time: existing?.time ?? '',
    returnTime: existing?.returnTime ?? '',
    meetingPoint: existing?.meetingPoint ?? '',
    locator: existing?.locator ?? '',
  }))
  // La hoja de la hora (Tanda 6m) es lo primero para una entrada; el formulario de siempre (email, captura, a mano) sigue detrás de «Rellenar desde el email o el PDF» y para las excursiones.
  const [view, setView] = useState<'hora' | 'form'>('hora')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (patch: Partial<Fields>) => setFields((previous) => ({ ...previous, ...patch }))

  // El día de la reserva: el de su fecha; sin fechas en el viaje, el que se elige.
  const resolvedDay = hasDates ? (fields.dateIso ? dayOnDate(route, fields.dateIso) : null) : (days.find((day) => String(day.dayNumber) === fields.dayNumber) ?? null)
  const outside = hasDates && Boolean(fields.dateIso) && !resolvedDay
  const moved = Boolean(resolvedDay && target.currentDayId && resolvedDay.id !== target.currentDayId)
  const validTime = /^\d{1,2}:\d{2}$/.test(fields.time)
  const ready = Boolean(resolvedDay && validTime)
  const bigPlace = target.placeNames.find((name) => BIG_RESERVATION_PLACES.includes(name)) ?? null
  const isFreeTour = target.refId === 'Free Tour'
  // El sitio cuyas horas de entrada se piden al servidor: el grande, o el primero que cubre la entrada (el Free Tour no tiene: sus cinco horas son fijas).
  const hoursPlace = isExcursion || isFreeTour ? null : (bigPlace ?? target.placeNames[0] ?? null)
  const tripDates = hasDates && days.length > 0 ? { min: dateOfDay(route, days[0]) ?? undefined, max: dateOfDay(route, days[days.length - 1]) ?? undefined } : null

  const dayLabel = (day: (typeof days)[number]) => `${dayLineOf(route, day)}${day.id === target.currentDayId ? ' · aquí está ahora' : ''}`
  /** La ficha de cada día (Tanda 6s): «Mar 10» con fechas, «Día 1» sin ellas. */
  const chipText = (day: (typeof days)[number]) => {
    const iso = hasDates ? dateOfDay(route, day) : null
    if (!iso) return `Día ${day.dayNumber}`
    const date = new Date(`${iso}T12:00:00`)
    const weekday = new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(date).replace('.', '')
    return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${date.getDate()}`
  }
  // Los días en que ese sitio está cerrado (con los horarios de los datos): la ficha sale apagada con «Cerrado». Sin fechas no se sabe qué día de la semana es: ninguno.
  const [closedIsos, setClosedIsos] = useState<Set<string>>(() => new Set())
  const tripIsos = useMemo(() => (hasDates ? days.map((day) => dateOfDay(route, day)).filter((iso): iso is string => Boolean(iso)) : []), [days, hasDates, route])
  const chipDays = isExcursion ? excursionTargetDays(route).filter((day) => !isDayPinned(route, reservations, day) || existing?.id === reservations.find((item) => item.kind === 'excursion' && dayOfReservation(route, item)?.id === day.id)?.id) : days
  const closedKey = hoursPlace && tripIsos.length > 0 ? `${hoursPlace}|${tripIsos.join(',')}` : null
  useEffect(() => {
    if (!closedKey || !hoursPlace) {
      setClosedIsos(new Set())
      return
    }
    let cancelled = false
    fetch('/api/reservation-hours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination: route.destination, place: hoursPlace, month: route.answers.month ?? null, season: route.answers.season ?? null, dates: tripIsos }),
    })
      .then((response) => (response.ok ? (response.json() as Promise<{ cerrados?: string[] }>) : null))
      .then((body) => {
        if (!cancelled) setClosedIsos(new Set(body?.cerrados ?? []))
      })
      .catch(() => {
        if (!cancelled) setClosedIsos(new Set())
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closedKey])
  const isClosedDay = (day: (typeof days)[number]) => {
    const iso = hasDates ? dateOfDay(route, day) : null
    return Boolean(iso) && closedIsos.has(iso as string)
  }
  const pickDay = (day: (typeof days)[number]) => {
    if (isClosedDay(day)) return
    if (hasDates) set({ dateIso: dateOfDay(route, day) ?? '' })
    else set({ dayNumber: String(day.dayNumber) })
  }
  // Si el día de partida está cerrado, se parte del primero que abre.
  useEffect(() => {
    if (closedIsos.size === 0 || !resolvedDay || !isClosedDay(resolvedDay)) return
    const open = days.find((day) => !isClosedDay(day))
    if (open) pickDay(open)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closedIsos])

  // Las horas a las que se puede entrar ese día (Coliseo, Museos, Galería y el resto de entradas): la rueda solo enseña esas.
  const [entryHours, setEntryHours] = useState<EntryHours | null>(null)
  const hoursKey = hoursPlace && resolvedDay ? `${hoursPlace}|${fields.dateIso}|${resolvedDay.id}` : null
  useEffect(() => {
    if (!hoursKey || !hoursPlace) {
      setEntryHours(null)
      return
    }
    let cancelled = false
    fetch('/api/reservation-hours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination: route.destination, place: hoursPlace, date_iso: hasDates ? fields.dateIso : null, month: route.answers.month ?? null, season: route.answers.season ?? null }),
    })
      .then((response) => (response.ok ? (response.json() as Promise<EntryHours>) : null))
      .then((body) => {
        if (!cancelled) setEntryHours(body)
      })
      .catch(() => {
        if (!cancelled) setEntryHours(null)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoursKey])
  const window0 = entryHours && !entryHours.cerrado && entryHours.ventanas.length > 0 ? { min: entryHours.ventanas[0].desde, max: entryHours.ventanas[entryHours.ventanas.length - 1].hasta } : null
  /** Las horas de la rueda: los turnos del sitio (la Galería) o, de la apertura a la última entrada, de 15 en 15 (sin datos, de 8:00 a 19:45). */
  const wheelItems = useMemo(() => {
    const two = (n: number) => String(n).padStart(2, '0')
    const asMin = (hhmm: string) => Number(hhmm.split(':')[0]) * 60 + Number(hhmm.split(':')[1])
    // (La hora de la reserva que ya hay siempre está en la rueda, aunque no caiga en una de las horas de siempre.)
    const propia = existing && /^\d{1,2}:\d{2}$/.test(existing.time) ? (existing.time.length === 4 ? `0${existing.time}` : existing.time) : null
    const conPropia = (list: string[]) => (propia && !list.includes(propia) ? [...list, propia].sort((x, y) => asMin(x) - asMin(y)) : list)
    if (entryHours?.turnos && entryHours.turnos.length > 0) return conPropia(entryHours.turnos)
    const windows = entryHours && !entryHours.cerrado && entryHours.ventanas.length > 0 ? entryHours.ventanas : [{ desde: '08:00', hasta: '19:45' }]
    const out: string[] = []
    for (const window of windows) for (let m = Math.ceil(asMin(window.desde) / 15) * 15; m <= asMin(window.hasta); m += 15) out.push(`${two(Math.floor(m / 60))}:${two(m % 60)}`)
    return conPropia(out.length > 0 ? out : ['09:00'])
  }, [entryHours])
  const pickupItems = useMemo(() => {
    const out: string[] = []
    for (let m = 300; m <= 660; m += 5) out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)
    return out
  }, [])
  const rueda = isExcursion ? pickupItems : wheelItems
  // Una excursión parte de su hora de salida (la primera de su línea) o, si no la hay, de las 07:00.
  useEffect(() => {
    if (!isExcursion || view !== 'hora' || validTime) return
    const first = target.excursion?.page?.stops?.[0]?.time
    set({ time: first && pickupItems.includes(first) ? first : '07:00' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])
  // La hora de partida de la rueda: la de la reserva que ya hay, o la más cercana a las 10:00; si esa hora no está entre las del sitio, la más cercana.
  useEffect(() => {
    if (isFreeTour || isExcursion || view !== 'hora') return
    const asMin = (hhmm: string) => Number(hhmm.split(':')[0]) * 60 + Number(hhmm.split(':')[1])
    const wanted = validTime ? asMin(fields.time) : 10 * 60
    const nearest = wheelItems.reduce((best, item) => (Math.abs(asMin(item) - wanted) < Math.abs(asMin(best) - wanted) ? item : best), wheelItems[0])
    const current = validTime ? (fields.time.length === 4 ? `0${fields.time}` : fields.time) : ''
    if (nearest !== current) set({ time: nearest })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wheelItems, view])

  const [plan, setPlan] = useState<ReservationPlan | null>(null)
  // La respuesta del servidor para esta hora y este día aún no ha llegado: no se guarda hasta entonces (la hoja de «mover el día» y la regla 17 salen con ella).
  const [planDoneKey, setPlanDoneKey] = useState<string | null>(null)
  const planKey = resolvedDay && bigPlace && !isExcursion && validTime ? `${resolvedDay.id}|${fields.dateIso}|${bigPlace}|${fields.time}` : null
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
    setRule17Kept(false)
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
        // (Cambiar una reserva que ya hay: el «antes» es el viaje como está ahora, con ella; así «mover el día» solo sale si la nueva hora o el nuevo día cambian algo.)
        reservas_antes: reservasParaMotor(existing && existing.refId === draft.refId ? [...others, existing] : others),
      }),
    })
      .then((response) => (response.ok ? (response.json() as Promise<ReservationPlan>) : null))
      .then((body) => {
        if (!cancelled) {
          setPlan(body)
          setPlanDoneKey(planKey)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPlan(null)
          setPlanDoneKey(planKey)
        }
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey])
  const planPending = Boolean(planKey) && planDoneKey !== planKey

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

  /** Los días que cambiarían de sitio y que no se pueden mover sin perder algo (un día que el viajero cambió, una excursión reservada, un día suyo): entonces no se mueve nada. */
  const blockedDay = (): number | null => {
    for (const change of plan?.cambios ?? []) {
      const day = route.days.find((candidate) => candidate.dayNumber === change.dayNumber)
      if (day && (day.originalSnapshot || day.userAdded || day.ownDay || day.dayType === 'excursion' || isDayPinned(route, reservations, day))) return change.dayNumber
    }
    return null
  }

  /** Guardar: la regla 17 si la hora no tiene lista escrita; después, la hoja que explica qué día se mueve; si no se puede mover, la reserva se guarda en su día con un aviso (y en la campana). */
  const save = (stage: 'inicio' | 'regla17' | 'mover' = 'inicio') => {
    if (!resolvedDay || !ready) return
    if (stage === 'inicio' && plan?.consejo && (plan.consejo.estado === 'sin_lista' || plan.consejo.estado === 'no_cabe') && !rule17Kept && plan.consejo.mejores.length > 0) {
      setRule17(true)
      return
    }
    const blocked = plan?.cambia ? blockedDay() : null
    if (plan?.cambia && blocked == null && stage !== 'mover') {
      setConfirming(true)
      return
    }
    const reservation = draftReservation()
    if (!reservation) return
    let aviso: string | null = null
    const sitio = bigPlace ? EL[bigPlace] : 'el sitio'
    if (plan?.sinMover?.motivo === 'excursion') {
      const excursion = resolvedDay.excursions?.find((option) => option.id === resolvedDay.selectedExcursionId)?.title ?? 'la excursión'
      aviso = `El día ${resolvedDay.dayNumber}${fields.dateIso ? ` (${shortDateEs(fields.dateIso)})` : ''} tienes la excursión a ${excursion.replace(/^Excursión (a la|a los|a las|al|a)\s+/i, '')}: no da tiempo a visitar también ${sitio}.`
    } else if (blocked != null) {
      aviso = `Tienes cambios tuyos en el día ${blocked}: no se puede mover el día ${bigPlace ? DEL[bigPlace] : ''} al día ${resolvedDay.dayNumber} sin perderlos. La reserva queda guardada en Reservas y tu ruta no cambia.`
    }
    if (aviso) {
      reservation.noMueve = true
      reservation.aviso = aviso
      // El aviso se queda en la campana.
      useNoticesStore.getState().push({ id: `reserva-aviso-${reservation.id}`, kind: 'info', title: 'Tu reserva está guardada', text: aviso })
    }
    try {
      addReservation(reservation, target.excursion ?? null)
    } catch (error) {
      // Si algo falla al moverla, la reserva se guarda en su día, sale un aviso y la app sigue.
      console.error('[AddReservationSheet] no se pudo mover', error)
      useNoticesStore.getState().push({ id: `reserva-error-${reservation.id}`, kind: 'info', title: 'Tu reserva está guardada', text: 'No hemos podido mover el día a la fecha de tu reserva. La reserva está guardada en Reservas y tu ruta se queda como estaba.' })
      try {
        useRouteStore.setState((state) => ({ reservations: state.reservations.some((other) => other.id === reservation.id) ? state.reservations : [...state.reservations, { ...reservation, noMueve: true }] }))
      } catch {
        // (Sin más que hacer: la reserva ya está en la lista o no se pudo guardar; la pantalla no se rompe.)
      }
    }
    onClose()
  }

  // Las dos horas que propone la regla 17: las mejores más cercanas a la elegida.
  const proposals = useMemo(() => {
    const options = plan?.consejo?.mejores ?? []
    if (!validTime || options.length === 0) return []
    const asMinutes = (hhmm: string) => Number(hhmm.split(':')[0]) * 60 + Number(hhmm.split(':')[1])
    const chosen = asMinutes(fields.time)
    return [...options].sort((a, b) => Math.abs(asMinutes(a) - chosen) - Math.abs(asMinutes(b) - chosen)).slice(0, 2).sort((a, b) => asMinutes(a) - asMinutes(b))
  }, [plan, fields.time, validTime])

  const showForm = tab === 'manual' || read
  /** «Eliminar reserva» (solo dentro de «Cambiar»): la tarjeta vuelve a sin reservar, el día se queda donde está y la parada vuelve a su lista normal. */
  const deleteReservation = () => {
    if (!existing) return
    try {
      removeReservation(existing.id)
    } catch (error) {
      console.error('[AddReservationSheet] no se pudo eliminar', error)
    }
    onClose()
  }
  const shownTime = validTime ? (fields.time.length === 4 ? `0${fields.time}` : fields.time) : ''
  const dateLabel = (iso: string) => {
    const day = dayOnDate(route, iso)
    return day ? dayLabel(day) : shortDateEs(iso)
  }


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

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
          {view === 'hora' ? (
            <div>
              <p className="max-w-[calc(100%-2.5rem)] text-text/50" style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }}>
                {isExcursion ? (target.paso2 ? 'Añadir una excursión · 2 de 2' : 'Excursión · elige día y hora') : isFreeTour ? 'Free Tour · elige día y hora' : 'Entrada · elige día y hora'}
              </p>
              <h2 id="add-reservation-heading" className="mt-1.5 font-display text-[24px] leading-[1.05] text-text">
                {target.name}
              </h2>

              {/* Los días del viaje, en fichas que se deslizan de lado: el día que tiene en la ruta ya va marcado («En tu ruta»); un sitio cerrado ese día sale apagado. */}
              <div className="-mx-6 mt-3.5 flex gap-1.5 overflow-x-auto px-6 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Día de tu reserva">
                {chipDays.map((day) => {
                  const selected = resolvedDay?.id === day.id
                  const closed = isClosedDay(day)
                  const inRoute = day.id === target.currentDayId
                  return (
                    <button
                      key={day.id}
                      type="button"
                      disabled={closed}
                      aria-pressed={selected}
                      onClick={() => pickDay(day)}
                      className="flex h-11 flex-none items-center gap-[7px] rounded-full px-3.5 transition-colors"
                      style={{
                        border: `1.5px solid ${selected ? '#1C2230' : 'rgba(28,34,48,.12)'}`,
                        background: selected ? '#1C2230' : closed ? '#F1EADC' : '#FFFFFF',
                        color: selected ? '#FFFDF8' : '#1C2230',
                        opacity: closed ? 0.5 : 1,
                        cursor: closed ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <span className="text-[13.5px] font-semibold" style={{ textDecoration: closed ? 'line-through' : 'none' }}>
                        {chipText(day)}
                      </span>
                      {(closed || inRoute) && <span className="text-[10.5px] font-medium opacity-70">{closed ? 'Cerrado' : 'En tu ruta'}</span>}
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-center text-text/50" style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }}>
                {isExcursion ? 'Hora de recogida' : isFreeTour ? 'Hora de inicio' : 'Hora de entrada'}
              </p>

              <div className="mt-3.5">
                {isFreeTour ? (
                  <div className="grid grid-cols-3 gap-2">
                    {FREE_TOUR_HOURS.map((hour) => (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => set({ time: hour })}
                        className={`h-12 rounded-2xl border text-[16px] font-medium ${fields.time === hour ? 'border-text bg-text text-bg' : 'border-text/15 bg-bg text-text hover:bg-bg-hover'}`}
                      >
                        {hour}
                      </button>
                    ))}
                  </div>
                ) : (
                  <TimeListWheel items={rueda} value={validTime ? (fields.time.length === 4 ? `0${fields.time}` : fields.time) : rueda[0]} onChange={(hhmm) => set({ time: hhmm })} label={isExcursion ? 'Hora de recogida' : 'Hora de la entrada'} />
                )}
              </div>

              {outside && (
                <p className="mt-2 text-[13px] leading-snug text-accent-red">
                  Tu reserva es del {shortDateEs(fields.dateIso)}, fuera de las fechas de tu viaje. Revisa la fecha.
                </p>
              )}
              {plan?.sinMover?.motivo === 'excursion' && !outside && resolvedDay && (
                <p className="mt-2 text-[13px] leading-snug text-text">
                  El día {resolvedDay.dayNumber} tienes la excursión: la reserva se guarda en Reservas con el aviso y tu ruta no cambia.
                </p>
              )}
              {moved && hasDates && resolvedDay && !outside && longWeekday(fields.dateIso) && (
                <p className="mt-2 text-[13px] leading-snug text-text">
                  Tu reserva es del {longWeekday(fields.dateIso).toLowerCase()} {Number(fields.dateIso.slice(8, 10))}: la pasamos a tu Día {resolvedDay.dayNumber}.
                </p>
              )}

              <p className="mt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setView('form')
                    setTab('email')
                  }}
                  className="inline-flex items-center gap-1.5 px-2 py-1 text-[12px] font-medium text-text/65"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 6h16v12H4zM4 7l8 6 8-6" />
                  </svg>
                  <span className="underline underline-offset-2">Rellenar desde el email o el PDF</span>
                </button>
              </p>

              <button type="button" disabled={!ready || planPending} onClick={() => save()} className="mt-4 h-[54px] w-full rounded-full bg-text text-[15px] font-semibold text-bg transition-transform active:scale-[.98] disabled:opacity-40">
                {validTime ? `Guardar · ${fields.time.length === 4 ? `0${fields.time}` : fields.time}` : 'Guardar'}
              </button>


              {target.existing && (
                <div className="mt-5 border-t border-text/10 pt-4 text-center">
                  {confirmDelete ? (
                    <div>
                      <p className="text-[14.5px] leading-snug text-text">¿Estás seguro de que quieres eliminar tu reserva?</p>
                      <div className="mt-3 flex gap-2">
                        <button type="button" onClick={() => setConfirmDelete(false)} className="h-11 flex-1 rounded-full border border-text/15 text-[14.5px] font-medium text-text hover:bg-bg-hover">
                          Cancelar
                        </button>
                        <button type="button" onClick={deleteReservation} className="h-11 flex-1 rounded-full bg-accent-red text-[14.5px] font-semibold text-white active:scale-[.98]">
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setConfirmDelete(true)} className="text-[13.5px] font-medium text-accent-red underline underline-offset-2">
                      Eliminar reserva
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
          <>
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
                <div className="mt-2 block">
                  <span className="text-[12px] font-medium text-text-soft">Día</span>
                  <DateField value={fields.dateIso} onChange={(iso) => set({ dateIso: iso })} title="Día de tu reserva" min={tripDates?.min} max={tripDates?.max} format={dateLabel} />
                </div>
              ) : (
                <label className="mt-2 block">
                  <span className="text-[12px] font-medium text-text-soft">Día del viaje</span>
                  <select value={fields.dayNumber} onChange={(event) => set({ dayNumber: event.target.value })} className={inputClass}>
                    {!currentDay && <option value="">Elige el día</option>}
                    {days.map((day) => (
                      <option key={day.id} value={day.dayNumber}>
                        {dayLabel(day)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {outside && (
                <p className="mt-1.5 text-[13px] leading-snug text-accent-red">
                  Tu reserva es del {shortDateEs(fields.dateIso)}, fuera de las fechas de tu viaje. Revisa la fecha.
                </p>
              )}
              {plan?.sinMover?.motivo === 'excursion' && !outside && resolvedDay && (
                <p className="mt-1.5 text-[13px] leading-snug text-text">
                  El día {resolvedDay.dayNumber} tienes la excursión: la reserva se guarda en Reservas con el aviso y tu ruta no cambia.
                </p>
              )}
              {moved && hasDates && resolvedDay && !outside && longWeekday(fields.dateIso) && (
                <p className="mt-1.5 text-[13px] leading-snug text-text">
                  Tu reserva es del {longWeekday(fields.dateIso).toLowerCase()} {Number(fields.dateIso.slice(8, 10))}: la pasamos a tu Día {resolvedDay.dayNumber}.
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <div className="flex-1">
                  <span className="text-[12px] font-medium text-text-soft">{isExcursion ? 'Hora de recogida' : 'Hora de entrada'}</span>
                  <TimeField
                    value={fields.time}
                    onChange={(hhmm) => set({ time: hhmm })}
                    title={isExcursion ? 'Hora de recogida' : 'Hora de entrada'}
                    options={isFreeTour ? FREE_TOUR_HOURS : undefined}
                    min={window0?.min}
                    max={window0?.max}
                  />
                </div>
                {isExcursion && (
                  <div className="flex-1">
                    <span className="text-[12px] font-medium text-text-soft">Hora de vuelta (opcional)</span>
                    <TimeField value={fields.returnTime} onChange={(hhmm) => set({ returnTime: hhmm })} title="Hora de vuelta" placeholder="Sin hora" />
                  </div>
                )}
              </div>
              {isExcursion && (
                <label className="mt-3 block">
                  <span className="text-[12px] font-medium text-text-soft">Punto de encuentro (opcional)</span>
                  <input value={fields.meetingPoint} onChange={(event) => set({ meetingPoint: event.target.value })} className={inputClass} />
                </label>
              )}
              <label className="mt-3 block">
                <span className="text-[12px] font-medium text-text-soft">N.º de reserva (opcional)</span>
                <input value={fields.locator} onChange={(event) => set({ locator: event.target.value })} className={inputClass} />
              </label>
            </div>
          )}
          </>
          )}
        </div>

        {view === 'form' && (
          <div className="px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
            <button type="button" disabled={!ready || planPending} onClick={() => save()} className="h-12 w-full rounded-full bg-text text-[15px] font-medium text-bg transition-transform active:scale-[.98] disabled:opacity-40">
              {resolvedDay ? `Guardar y ponerla en el Día ${resolvedDay.dayNumber}` : 'Guardar y ponerla en su día'}
            </button>
          </div>
        )}
      </div>
      {rule17 && plan?.consejo && proposals.length > 0 && (
        <div className="absolute inset-0 z-[5] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="rule17-heading">
          <div className="absolute inset-0 bg-text/25" onClick={() => setRule17(false)} />
          <div className="trazo-notice-panel relative w-full rounded-t-[28px] bg-bg-card px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[440px] md:rounded-[28px]">
            <h2 id="rule17-heading" className="font-display text-[22px] leading-[1.2] text-text">
              A las {shownTime} la visita no encaja bien en el día. Te proponemos las {proposals.join(' o las ')}.
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {proposals.map((hour) => (
                <button
                  key={hour}
                  type="button"
                  onClick={() => {
                    set({ time: hour.length === 4 ? `0${hour}` : hour })
                    setRule17(false)
                  }}
                  className="h-12 flex-1 rounded-full bg-text text-[15px] font-medium text-bg transition-transform active:scale-[.98]"
                >
                  {hour}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setRule17Kept(true)
                setRule17(false)
                // (Regla 4: la deja a esa hora y el día se adapta en silencio.)
                window.setTimeout(() => save('regla17'), 0)
              }}
              className="mt-2 h-12 w-full rounded-full border border-text/15 text-[15px] font-medium text-text hover:bg-bg-hover"
            >
              Dejar las {shownTime}
            </button>
          </div>
        </div>
      )}
      {confirming && plan?.cambia && (
        <div className="absolute inset-0 z-[5] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="move-day-heading">
          <div className="absolute inset-0 bg-text/25" onClick={() => setConfirming(false)} />
          <div className="trazo-notice-panel relative w-full rounded-t-[28px] bg-bg-card px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[440px] md:rounded-[28px]">
            <h2 id="move-day-heading" className="font-display text-[22px] leading-[1.2] text-text">
              {plan.mensaje}
            </h2>
            {plan.motivos.length > 0 && <p className="mt-3 text-[14.5px] leading-snug text-text-soft">{plan.motivos.join(' ')}</p>}
            <button type="button" onClick={() => save('mover')} className="mt-5 h-12 w-full rounded-full bg-text text-[15px] font-medium text-bg transition-transform active:scale-[.98]">
              De acuerdo
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}
