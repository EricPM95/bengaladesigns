import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { conDe, sitioConArticulo } from '../../../../shared/avisos/textos.js'
import type { Excursion, Route } from '../../../lib/types'
import { repartirEnFilas } from '../../../lib/repartirEnFilas'
import { dateOfDay, dayLineOf, dayOfReservation, dayOnDate, fechaDeLista, isDayPinned, shortDateEs, type Reservation } from '../../../lib/bookings'
import { alDia, ElDia, elDia } from '../../../lib/nombreDeDia'
import { reservasParaMotor } from '../../../lib/engineReservas'
import { excursionTargetDays } from '../../../lib/excursionOffer'
import { useRouteStore } from '../../../store/useRouteStore'
import { removeReservationWithUndo } from '../../../store/useAddFlowStore'
import { useNoticesStore } from '../../../store/useNoticesStore'
import { DateField } from '../../ui/DateField'
import { TimeField } from '../../ui/TimeField'
import { TimeListWheel } from '../../ui/TimeListWheel'
import { PersonasCuadradas, ESTILO_PREGUNTA } from '../../ui/PersonasCuadradas'
import { usePermisosDelViaje } from '../../../hooks/usePermisosDelViaje'
import { usePrecioEditable } from '../../../lib/useMoneda'
import { Icono } from '../../ui/Icono'
import { isManualRoute } from '../../../lib/manualPlan'
import { useDestinationPool } from '../../../lib/useDestinationPool'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import { AVISO_DISPONIBILIDAD, AVISO_DISPONIBILIDAD_RESERVAR, horasDeLaRueda, useHorarioDeEntrada } from '../../../lib/horarioDeEntrada'
import { FREE_TOUR_RUEDA } from '../../../lib/freeTourHoras'
import { avisoDeLaHora, civitatisActiva, ruedaConHorasLibres, useHorasLibres } from '../../../lib/civitatis'
import { llegadaVueltaDe } from '../../../lib/llegadaVuelta'
import { useEntradasDelGrupo } from '../../../hooks/useEntradasDelGrupo'
import { useMisReservas } from '../../../store/useMisReservas'
import { openTicketShop } from './EntradaCard'
import { buildActivitySearchUrl } from '../../../lib/affiliateLinks'
import { diaDeLaReservaEnPalabras, horaCorta } from '../../../lib/reservasGrupo'
import { nombreDe } from '../../../store/useViajeCompartido'
import { cuentaDelViaje, esFamilia } from '../../../lib/cuentaDelViaje'
import { BloqueDinero, textoDelBoton, preguntaParaQuien } from '../presupuesto/BloqueDinero'
import { anadirComoPrimeraParada, esReservaLibre, type SugerenciaDeEntrada } from '../../../lib/otraReserva'
import { llevarALaParada } from '../../../lib/cambiarParada'
import type { DatosEntradaLeida } from '../../../lib/billeteLeer'
import { useBilleteStore, entradaConCodigo, type CodigoDelBillete } from '../../../store/useBilleteStore'
import { useBilletesDeEntradas } from '../../../hooks/useBilleteEntrada'
import { BotonAnadirEntrada } from './EntradaConBillete'
import { ImagenDelCodigo } from './TarjetaBillete'

/** (10N8, N6) El nombre de la entrada con su artículo: «el Coliseo, Foro y Palatino» (la tabla de artículos solo conoce «Coliseo»: si el nombre entero no está, se usa el artículo del primer sitio que cubre). */
function sitioDeLaEntrada(target: { name: string; placeNames: string[] }): string {
  const con = sitioConArticulo(target.name)
  if (con !== target.name) return con
  for (const sitio of target.placeNames) {
    const s = sitioConArticulo(sitio)
    if (s !== sitio) return `${s.slice(0, s.length - sitio.length)}${target.name}`
  }
  return target.name
}

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
  /**
   * Tanda 10N §8: la entrada que el dueño ya tiene para este sitio, vista por quien quiere ir con él. 'comprar' ([Reservar la mía a la misma hora]): el día y la hora ya vienen elegidos y el botón abre la compra;
   * 'tengo' ([Ya la tengo]): la hoja de siempre para apuntar la que ya le han comprado, partiendo del día y la hora del dueño.
   */
  igualQue?: { reserva: Reservation; quien: string; modo: 'comprar' | 'tengo' } | null
  /** Cómo se abre el selector de hora. 'tengo' (por defecto: «¿Ya la tienes? Añádela», «Cambiar»): cualquier hora, sin filtros ni avisos. 'reservar': solo las horas libres del calendario, con sus plazas (solo con la API de consulta encendida). */
  modo?: 'tengo' | 'reservar'
  /** (10S4) [Añadir otra reserva] con lo escrito tal cual (sin sitio nuestro): solo vive en RESERVAS (refId «otra:…»). */
  libre?: boolean
  /** (10S4) [Añadir otra reserva] con una sugerencia: al guardar, el sitio entra también en la ruta, en el día elegido, como primera parada. */
  sugerencia?: SugerenciaDeEntrada | null
  /** (10S7 §3) Lo que se ha leído de una entrada (PDF, foto o captura) con [Añadir tu entrada]: la hoja sale con el día, la hora, las personas, el localizador y el código ya puestos. */
  lectura?: DatosEntradaLeida | null
}

/** Qué se mueve al meter una reserva grande (/api/reservation-plan). */
interface ReservationPlan {
  cambia: boolean
  mensaje: string | null
  motivos: string[]
  sinMover: { motivo: string } | null
  cambios: { dayNumber: number; de: string | null; a: string | null }[]
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
  const reservations = useRouteStore((state) => state.reservations)
  const [confirming, setConfirming] = useState(false)
  const [tab, setTab] = useState<Tab>('email')
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const [readError, setReadError] = useState<string | null>(null)
  const [read, setRead] = useState(false)
  // Los datos del Free Tour del destino (Tanda 6y2): en una ruta a mano, la reserva del Free Tour crea su parada con ellos.
  const { sitiosGrandes: fichasSitiosGrandes, entradasPorSitio, nombresCortos } = useDestinationExcursions(route.destination)
  // Tanda 10N §8: quién mira (el dueño o quien está en su viaje) y si el viaje es de varias personas.
  const grupo = useEntradasDelGrupo()
  const esInvitado = grupo.esInvitado
  const igual = target.igualQue ?? null
  const [compraAbierta, setCompraAbierta] = useState(false)
  // (Tanda 10N8 §8) Al volver a la app tras abrir la compra: «¿Has comprado la entrada del Coliseo de las 14:00?» · [Sí, guardarla] · [Todavía no].
  const [preguntaCompra, setPreguntaCompra] = useState(false)
  useEffect(() => {
    if (!compraAbierta) return
    const alVolver = () => {
      if (document.visibilityState === 'visible') setPreguntaCompra(true)
    }
    document.addEventListener('visibilitychange', alVolver)
    window.addEventListener('focus', alVolver)
    return () => {
      document.removeEventListener('visibilitychange', alVolver)
      window.removeEventListener('focus', alVolver)
    }
  }, [compraAbierta])
  // («Reservar la mía a la misma hora»: la rueda parte de la hora del dueño; mientras la lista de horas se acomoda, los saltos de la rueda no la cambian. Los gestos de después, sí.)
  const ultimoCambioDeRueda = useRef(0)
  const sitiosGrandes = fichasSitiosGrandes.map((sitio) => sitio.nombre)
  const { freeTourEntry } = useDestinationPool(route.destination, target.refId === 'Free Tour' && isManualRoute(route))
  const hasDates = Boolean(route.answers.dateRange)
  const days = useMemo(() => route.days.filter((day) => !day.isReturnLeg), [route.days])
  const isExcursion = target.kind === 'excursion'
  // El día donde está ahora ese sitio: sale ya elegido (Tanda 6k, punto 4), con «· aquí está ahora»; así se sabe que se pone en el día bueno y no se mueve nada.
  const currentDay = useMemo(() => days.find((day) => day.id === target.currentDayId) ?? null, [days, target.currentDayId])
  // Una excursión sin día en la ruta parte del primer día donde puede ir (nunca el de llegada ni el de vuelta).
  const startDay = currentDay ?? (isExcursion ? (excursionTargetDays(route)[0] ?? null) : null)
  const existing = target.existing ?? null
  // El precio (Tanda 6z2): opcional, total de todas las personas; el Free Tour no lo lleva (es gratis).
  const precio = usePrecioEditable(existing?.precio)
  // (10S7 §3) El billete de esta entrada (privado de esta persona): cuántas personas, el localizador y el código.
  const billetes = useBilletesDeEntradas()
  const billeteDeAntes = target.kind === 'entrada' ? billetes.de(target.refId) : null
  const lectura = target.lectura ?? null
  const [personas, setPersonas] = useState<string>(() => String(lectura?.personas ?? billeteDeAntes?.personas ?? ''))
  const [codigoDeEntrada, setCodigoDeEntrada] = useState<CodigoDelBillete | null>(() => (lectura?.codigo as CodigoDelBillete | null) ?? billeteDeAntes?.codigo ?? null)
  // (El localizador del billete es PRIVADO: va aparte del de la reserva, que viaja con la ruta compartida.)
  const [localizadorDeEntrada, setLocalizadorDeEntrada] = useState<string>(() => lectura?.localizador ?? billeteDeAntes?.localizador ?? '')
  const [horaLeida, setHoraLeida] = useState<string | null>(lectura?.hora ?? null)
  const [billeteTocado, setBilleteTocado] = useState(Boolean(lectura))
  const [fields, setFields] = useState<Fields>(() => ({
    ...EMPTY,
    dateIso: existing?.dateIso ?? igual?.reserva.dateIso ?? (hasDates && startDay ? (dateOfDay(route, startDay) ?? '') : ''),
    dayNumber: existing?.dayNumber != null ? String(existing.dayNumber) : igual?.reserva.dayNumber != null ? String(igual.reserva.dayNumber) : !hasDates && startDay ? String(startDay.dayNumber) : '',
    time: existing?.time ?? igual?.reserva.time ?? '',
    returnTime: existing?.returnTime ?? '',
    meetingPoint: existing?.meetingPoint ?? '',
    locator: existing?.locator ?? '',
  }))
  // (La lectura que llega ya hecha —desde la tarjeta de una entrada reservada— pone su día y su hora.)
  useEffect(() => {
    if (!lectura) return
    setFields((previous) => ({ ...previous, dateIso: hasDates && lectura.fecha ? lectura.fecha : previous.dateIso, time: lectura.hora ?? previous.time }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // La hoja de la hora (Tanda 6m) es lo primero para una entrada; el formulario de siempre (email, captura, a mano) sigue detrás de «Rellenar desde el email o el PDF» y para las excursiones.
  const [view, setView] = useState<'hora' | 'form'>('hora')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (patch: Partial<Fields>) => setFields((previous) => ({ ...previous, ...patch }))

  // El día de la reserva: el de su fecha; sin fechas en el viaje, el que se elige.
  const resolvedDay = hasDates ? (fields.dateIso ? dayOnDate(route, fields.dateIso) : null) : (days.find((day) => String(day.dayNumber) === fields.dayNumber) ?? null)
  const outside = hasDates && Boolean(fields.dateIso) && !resolvedDay
  const validTime = /^\d{1,2}:\d{2}$/.test(fields.time)
  const ready = Boolean(resolvedDay && validTime)
  const bigPlace = target.placeNames.find((name) => sitiosGrandes.includes(name)) ?? null
  const isFreeTour = target.refId === 'Free Tour'
  // El sitio cuyas horas de entrada se piden al servidor: el grande, o el primero que cubre la entrada (el Free Tour no tiene: sus cinco horas son fijas).
  const esLibre = target.libre === true || esReservaLibre(existing)
  const hoursPlace = isExcursion || isFreeTour || esLibre ? null : (bigPlace ?? target.placeNames[0] ?? null)
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
  const hoursKey = hoursPlace && resolvedDay ? `${hoursPlace}|${fields.dateIso}|${resolvedDay.id}` : null
  const entryHours = useHorarioDeEntrada({ destination: route.destination, place: hoursPlace, dateIso: hasDates ? fields.dateIso : null, month: route.answers.month ?? null, season: route.answers.season ?? null }, hoursKey)
  const window0 = entryHours && !entryHours.cerrado && entryHours.ventanas.length > 0 ? { min: entryHours.ventanas[0].desde, max: entryHours.ventanas[entryHours.ventanas.length - 1].hasta } : null
  /** Las horas de la rueda (Tanda 6y9: de la apertura a la ÚLTIMA ENTRADA oficial de esa fecha, o los turnos reales del sitio). La hora de la reserva que ya hay siempre está. */
  // La API de consulta (parte 1, con el interruptor encendido): las horas LIBRES de ese día según el calendario, con las plazas si quedan pocas. Se pide de nuevo cada vez que se abre el selector
  // (sin la caché de una hora) para que las plazas estén al día. Sin datos o con el interruptor apagado, la rueda de siempre. Desde «Añádela»/«Cambiar» (modo por defecto): cualquier hora, sin filtros ni avisos.
  const [aperturas, setAperturas] = useState(0)
  useEffect(() => {
    if (view === 'hora') setAperturas((n) => n + 1)
  }, [view])
  const modoReservar = target.modo === 'reservar'
  const lugarDeLasHoras = isExcursion || esLibre ? null : isFreeTour ? 'Free Tour' : (bigPlace ?? target.placeNames[0] ?? null)
  const claveDeLasHoras = view === 'hora' && hasDates && fields.dateIso && resolvedDay && aperturas > 0 ? `${lugarDeLasHoras}|${fields.dateIso}|${aperturas}` : null
  const horasApi = useHorasLibres(lugarDeLasHoras, hasDates ? fields.dateIso : null, route.destination, claveDeLasHoras)
  const horasDelDia = horasApi.estado === 'ok' ? horasApi.datos : null
  const filtrando = horasDelDia != null && horasDelDia.horas.length > 0 && modoReservar
  const wheelItems = useMemo(() => {
    const horaDePartida = horaLeida ?? existing?.time ?? igual?.reserva.time ?? null
    const propia = horaDePartida && /^\d{1,2}:\d{2}$/.test(horaDePartida) ? (horaDePartida.length === 4 ? `0${horaDePartida}` : horaDePartida) : null
    // (10S3 §5) El Free Tour: la misma rueda de las entradas, sin las seis horas fijas nuestras.
    const base = isFreeTour ? (propia && !FREE_TOUR_RUEDA.includes(propia) ? [...FREE_TOUR_RUEDA, propia].sort() : FREE_TOUR_RUEDA) : horasDeLaRueda(entryHours, propia)
    return filtrando ? ruedaConHorasLibres(base, horasDelDia, propia) : base
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryHours, filtrando, horasDelDia, horaLeida])
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
  // La hora de partida de la rueda (Tanda 10O): la de la reserva que ya hay; si no, la hora a la que la ruta llega a ese sitio ese día (si el sitio ya está en la ruta), y si no está, las 9:00; la rueda
  // se queda en la hora más cercana de las del sitio (así, si abre más tarde de las 9:00, parte de la hora de apertura).
  useEffect(() => {
    if (isExcursion || view !== 'hora') return
    const asMin = (hhmm: string) => Number(hhmm.split(':')[0]) * 60 + Number(hhmm.split(':')[1])
    const enLaRuta = resolvedDay?.stops.find((stop) => (isFreeTour ? stop.isFreeTour : !stop.isNightExperience && target.placeNames.includes(stop.name)))
    const llegada = enLaRuta && /^\d{1,2}:\d{2}$/.test(enLaRuta.time ?? '') ? asMin(enLaRuta.time) : NaN
    // (Con la hora del dueño de partida —«Reservar la mía a la misma hora»— la rueda se queda en ella aunque llegue después la lista de horas.)
    ultimoCambioDeRueda.current = Date.now()
    const wanted = igual?.reserva.time ? asMin(igual.reserva.time) : validTime ? asMin(fields.time) : Number.isNaN(llegada) ? (isFreeTour ? 10 : 9) * 60 : llegada
    const nearest = wheelItems.reduce((best, item) => (Math.abs(asMin(item) - wanted) < Math.abs(asMin(best) - wanted) ? item : best), wheelItems[0])
    const current = validTime ? (fields.time.length === 4 ? `0${fields.time}` : fields.time) : ''
    if (nearest !== current) set({ time: nearest })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wheelItems, view])

  const [plan, setPlan] = useState<ReservationPlan | null>(null)
  // La respuesta del servidor para esta hora y este día aún no ha llegado: no se guarda hasta entonces (la hoja de «mover el día» y la regla 17 salen con ella).
  const [planDoneKey, setPlanDoneKey] = useState<string | null>(null)
  // (En una ruta a mano no se pregunta qué día se mueve: ninguno se mueve, la reserva se queda en el día y a la hora del viajero. Tanda 6y.)
  // (Tanda 10S3, apartado 5) El Free Tour no mueve días, y una entrada cuyo sitio YA está en el día de la fecha elegida se queda donde está con su hora (10N10 §3d): en los dos casos no se pide el plan y no sale el mensaje de «mover el día».
  const yaEnSuDia = Boolean(resolvedDay?.stops.some((parada) => (isFreeTour ? parada.isFreeTour : target.placeNames.includes(parada.name))))
  const planKey = resolvedDay && bigPlace && !isFreeTour && !yaEnSuDia && !isExcursion && !target.sugerencia && !esLibre && validTime && !isManualRoute(route) && !esInvitado ? `${resolvedDay.id}|${fields.dateIso}|${bigPlace}|${fields.time}` : null
  // «¿Para quién es?» (Tanda 10N §8): solo el dueño y solo en un viaje compartido. El dueño va siempre marcado; una reserva de antes de compartir cuenta como «solo para mí».
  // (Tanda 10N5 §6c) También quien reserva en un viaje de otra persona dice para quién es: la pagó él y, si es para varios, entra en las cuentas del grupo. Siempre va marcado quien reserva.
  const paraQuienVisible = grupo.compartido
  const personasDelViaje = useMemo(() => [...grupo.gente].sort((a, b) => Number(b.esAdmin) - Number(a.esAdmin)), [grupo.gente])
  const adminId = personasDelViaje.find((p) => p.esAdmin)?.id ?? null
  const quienReservaId = esInvitado ? grupo.yoId : adminId
  // (Tanda 10N10 §6) Marcado, solo quien la pone (más los que ya tenía la entrada); «¿Quién la ha pagado?», quien la pone.
  const [marcados, setMarcados] = useState<string[]>(() => {
    const antes = (existing?.paraQuien ?? []).filter((id) => personasDelViaje.some((p) => p.id === id))
    return [...new Set([...(quienReservaId ? [quienReservaId] : []), ...antes])]
  })
  const [pagadoPor, setPagadoPor] = useState<string[]>(() => {
    const antes = ((existing as { pagadoPor?: string[] | null } | null)?.pagadoPor ?? []).filter((id) => personasDelViaje.some((p) => p.id === id))
    return antes.length > 0 ? antes : quienReservaId ? [quienReservaId] : []
  })
  const permisos = usePermisosDelViaje()
  const alternarPersona = (id: string) => setMarcados((previous) => (previous.includes(id) ? previous.filter((other) => other !== id) : [...previous, id]))
  const alternarPagado = (id: string) => setPagadoPor((previous) => (previous.includes(id) ? previous.filter((other) => other !== id) : [...previous, id]))
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
      precio: target.refId === 'Free Tour' ? null : precio.importe,
      ...(paraQuienVisible ? { paraQuien: marcados, pagadoPor: marcados.length > 1 && precio.importe ? pagadoPor : null } : {}),
      // (El nombre corto con artículo —«el Coliseo»— viaja con la reserva: así el aviso que crea la base de datos lo dice bien.)
      shortName: nombresCortos?.[target.refId] ?? existing?.shortName ?? null,
      // (10S4) Lo escrito a mano en [Añadir otra reserva]: ni mueve ni rehace nada, solo vive en RESERVAS.
      ...(esLibre ? { noMueve: true } : {}),
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
    // (Tanda 7, de pago: la hora de llegada y de vuelta del viajero viajan con la petición, o el plan de la reserva se calcularía sin ellas.)
    llegadaVueltaDe(route, [...others, draft])
      .then((vuelo) => fetch('/api/reservation-plan', {
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
        ...vuelo,
      }),
    }))
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

  /** Guardar: la hora que elige el viajero se queda, siempre (Tanda 6v: la app nunca propone otra hora; el día usa la lista escrita de esa hora y, si no la hay, manda la reserva, sin preguntar). Antes, la hoja que explica qué día se mueve; si no se puede mover, la reserva se guarda en su día con un aviso (y en la campana). */
  const save = (stage: 'inicio' | 'mover' = 'inicio') => {
    if (!resolvedDay || !ready) return
    // Tanda 10N §8: la entrada de quien está en el viaje de otra persona es SUYA: va a su lista, no toca la ruta del dueño ni sus reservas.
    if (esInvitado) {
      const propia = draftReservation()
      if (!propia) return
      useMisReservas.getState().anadir(propia)
      guardarBilleteDeEntrada()
      onClose()
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
    const sitio = fichasSitiosGrandes.find((s) => s.nombre === bigPlace)?.el ?? 'el sitio'
    if (plan?.sinMover?.motivo === 'excursion') {
      const excursion = resolvedDay.excursions?.find((option) => option.id === resolvedDay.selectedExcursionId)?.title ?? 'la excursión'
      aviso = `${ElDia(route, resolvedDay.dayNumber)} tienes la excursión a ${excursion.replace(/^Excursión (a la|a los|a las|al|a)\s+/i, '')}: no da tiempo a visitar también ${sitio}.`
    } else if (blocked != null) {
      aviso = `Tienes cambios tuyos en ${elDia(route, blocked)}: no se puede mover el día ${fichasSitiosGrandes.find((s) => s.nombre === bigPlace)?.del ?? ''} ${alDia(route, resolvedDay.dayNumber)} sin perderlos. La reserva queda guardada en Reservas y tu ruta no cambia.`
    }
    if (aviso) {
      reservation.noMueve = true
      reservation.aviso = aviso
      // El aviso se queda en la campana.
      useNoticesStore.getState().push({ id: `reserva-aviso-${reservation.id}`, kind: 'info', title: 'Tu reserva está guardada', text: aviso })
    }
    // (10S4) [Añadir otra reserva] con una sugerencia: el sitio entra en la ruta, en el día elegido, de primera, ANTES de guardar la reserva (así la reserva lo encuentra ya en su día y no pide nada al motor: el día no cambia).
    let llevarA: { dayId: string; stopId: string } | null = null
    if (target.sugerencia && !esLibre) {
      try {
        llevarA = anadirComoPrimeraParada(resolvedDay.id, target.sugerencia, reservation)
      } catch (error) {
        console.error('[AddReservationSheet] no se pudo poner en la ruta', error)
      }
    }
    try {
      addReservation(reservation, target.excursion ?? null, freeTourEntry)
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
    guardarBilleteDeEntrada()
    onClose()
    // (10S4) La app lleva a la parada nueva y la marca un momento.
    if (llevarA) llevarALaParada(llevarA.dayId, llevarA.stopId)
  }

  /** (10S7 §3) Guarda el billete de la entrada (personas, localizador y código) en el móvil de esta persona. Sin nada que guardar, se quita el que hubiera. */
  const guardarBilleteDeEntrada = () => {
    if (target.kind !== 'entrada' || isExcursion) return
    const n = Number.parseInt(personas, 10)
    const datosBillete = { personas: Number.isFinite(n) && n > 0 ? n : null, localizador: localizadorDeEntrada.trim() || null, codigo: codigoDeEntrada }
    if (datosBillete.personas || datosBillete.localizador || datosBillete.codigo) {
      if (!billeteTocado && billeteDeAntes) return
      useBilleteStore.getState().ponerEntrada(billetes.tripId, target.refId, { ...datosBillete, dueno: billeteDeAntes?.dueno ?? billetes.yoId })
    } else if (billeteDeAntes) useBilleteStore.getState().quitarEntrada(billetes.tripId, target.refId)
  }
  /** Lo leído de la entrada rellena el día, la hora, las personas y el localizador (se puede cambiar todo a mano) y guarda el código. */
  const aplicarLecturaDeEntrada = (leida: DatosEntradaLeida) => {
    setBilleteTocado(true)
    setFields((previous) => ({ ...previous, dateIso: hasDates && leida.fecha ? leida.fecha : previous.dateIso, time: leida.hora ?? previous.time }))
    if (leida.localizador) setLocalizadorDeEntrada(leida.localizador)
    if (leida.hora) setHoraLeida(leida.hora)
    if (leida.personas) setPersonas(String(leida.personas))
    if (leida.codigo) setCodigoDeEntrada(leida.codigo as CodigoDelBillete)
  }

  const showForm = tab === 'manual' || read
  /** «Eliminar reserva» (solo dentro de «Cambiar»): la tarjeta vuelve a sin reservar, el día se queda donde está y la parada vuelve a su lista normal. */
  const deleteReservation = () => {
    if (!existing) return
    try {
      if (esInvitado) useMisReservas.getState().quitar(existing.id)
      else removeReservationWithUndo(existing.id)
      if (existing.kind === 'entrada' && billeteDeAntes) useBilleteStore.getState().quitarEntrada(billetes.tripId, existing.refId)
    } catch (error) {
      console.error('[AddReservationSheet] no se pudo eliminar', error)
    }
    onClose()
  }
  const dateLabel = (iso: string) => {
    const day = dayOnDate(route, iso)
    return day ? dayLabel(day) : fechaDeLista(iso)
  }


  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="add-reservation-heading">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={onClose} />
      <div className="trazo-notice-panel relative flex max-h-[92dvh] w-full flex-col rounded-t-[28px] bg-bg-card shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[440px] md:rounded-[28px]">
        <div className="flex shrink-0 justify-center pt-2.5" aria-hidden="true">
          <span className="h-1 w-[42px] rounded-full bg-text/20" />
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="zona-toque absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-text-soft hover:bg-bg-hover">
          <Icono nombre="cerrar" className="h-5 w-5" />
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
          {view === 'hora' ? (
            <div>
              <p className="max-w-[calc(100%-2.5rem)] text-text/50" style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }}>
                {isExcursion ? (target.paso2 ? 'Añadir una excursión · 2 de 2' : 'Excursión · elige día y hora') : esLibre ? 'Reserva · elige día y hora' : isFreeTour ? 'Free Tour · elige día y hora' : 'Entrada · elige día y hora'}
              </p>
              <h2 id="add-reservation-heading" className="mt-1.5 font-display text-[24px] leading-[1.05] text-text">
                {target.name}
              </h2>
              {igual && (
                <p className="mt-2 text-[13.5px] leading-snug text-text/70" data-igual-que>
                  {igual.quien || 'El dueño'} {/ y |,/.test(igual.quien) ? 'van' : 'va'} el {diaDeLaReservaEnPalabras(route, igual.reserva)} a las {horaCorta(igual.reserva.time)}.{' '}
                  {igual.modo === 'comprar' ? 'Ya tienes elegidos ese día y esa hora.' : 'Apunta aquí la que ya tienes.'}
                </p>
              )}

              {/* (10S7 §3, E1) [Añadir tu entrada]: desde el PDF, una foto o una captura la app lee el día, la hora, las personas y el localizador y guarda el código. Todo se puede cambiar a mano. */}
              {!isExcursion && !igual && (
                <div className="mt-5 flex flex-col gap-3" data-entrada-billete-hoja>
                  <BotonAnadirEntrada onLeida={aplicarLecturaDeEntrada} año={route.answers.dateRange ? Number(route.answers.dateRange.start.slice(0, 4)) : undefined} datos="hoja" />
                  {(billeteTocado || billeteDeAntes || codigoDeEntrada) && (
                    <div className="flex flex-col gap-2.5" data-entrada-billete-datos>
                      <div className="flex gap-2">
                        <label className="flex h-[54px] w-[110px] flex-none flex-col justify-center gap-px rounded-[15px] border bg-[#FFFDF8] px-3.5" style={{ borderColor: 'rgba(28,34,48,.12)' }}>
                          <span style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.12em', color: 'rgba(28,34,48,.5)', textTransform: 'uppercase' }}>Personas</span>
                          <input value={personas} onChange={(e) => { setBilleteTocado(true); setPersonas(e.target.value.replace(/\D/g, '').slice(0, 2)) }} inputMode="numeric" placeholder="2" autoComplete="off" data-entrada-dato="personas" className="w-full min-w-0 bg-transparent text-[15px] font-medium outline-none placeholder:font-normal placeholder:text-text/40" />
                        </label>
                        <label className="flex h-[54px] min-w-0 flex-1 flex-col justify-center gap-px rounded-[15px] border bg-[#FFFDF8] px-3.5" style={{ borderColor: 'rgba(28,34,48,.12)' }}>
                          <span style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.12em', color: 'rgba(28,34,48,.5)', textTransform: 'uppercase' }}>Localizador</span>
                          <input value={localizadorDeEntrada} onChange={(e) => { setBilleteTocado(true); setLocalizadorDeEntrada(e.target.value) }} maxLength={30} placeholder="ABC123" autoComplete="off" autoCapitalize="characters" data-entrada-dato="localizador" className="w-full min-w-0 bg-transparent text-[15px] font-medium uppercase outline-none placeholder:font-normal placeholder:normal-case placeholder:text-text/40" />
                        </label>
                      </div>
                      {codigoDeEntrada && entradaConCodigo({ personas: null, localizador: null, dueno: null, actualizado: '', codigo: codigoDeEntrada }) && (
                        <div className="flex items-center gap-3.5" data-entrada-codigo-leido>
                          <span className="rounded-xl bg-white p-1.5" style={{ border: '1px solid rgba(28,34,48,.14)' }}>
                            <ImagenDelCodigo codigo={codigoDeEntrada} tam={56} />
                          </span>
                          <span className="min-w-0 flex-1 text-[13px] font-semibold text-text/70">Tu código está guardado en tu móvil.</span>
                          <button type="button" onClick={() => { setBilleteTocado(true); setCodigoDeEntrada(null) }} data-entrada-quitar-codigo className="zona-toque text-[13px] font-medium underline" style={{ color: 'oklch(0.52 0.19 25)' }}>
                            Quitar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Los días del viaje, en fichas que se deslizan de lado: el día que tiene en la ruta ya va marcado («En tu ruta»); un sitio cerrado ese día sale apagado. */}
              {/* (10S5) Los días ocupan todo el ancho, a partes iguales; si no caben en una fila (más de 4), en dos o más filas igual de llenas. */}
              <div className="mt-5 flex flex-col gap-1.5" role="group" aria-label="Día de tu reserva" data-dias-filas>
                {repartirEnFilas(chipDays).map((fila, indiceFila) => (
                  <div key={indiceFila} className="flex gap-1.5" data-dias-fila={indiceFila}>
                {fila.map((day) => {
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
                      data-dia-cuadrado={day.id}
                      data-elegida={selected ? '1' : '0'}
                      // (10S3 §7) Todo lo que se elige va en cuadrados: el día, como las personas; el elegido, azul oscuro con ✓ dorado.
                      className="relative flex h-[62px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1.5 transition-colors"
                      style={{
                        border: `1px solid ${selected ? '#1C2230' : 'rgba(28,34,48,.14)'}`,
                        background: selected ? '#1C2230' : closed ? '#F1EADC' : '#FFFDF8',
                        color: selected ? '#FBF3E2' : '#1C2230',
                        opacity: closed ? 0.5 : 1,
                        cursor: closed ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {selected && (
                        <svg aria-hidden="true" data-dia-marca width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F3D88F" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', top: 7, right: 8 }}>
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                      )}
                      <span className="text-[14px] font-semibold" style={{ textDecoration: closed ? 'line-through' : 'none' }}>
                        {chipText(day)}
                      </span>
                      {(closed || inRoute) && <span className="text-[10.5px] font-medium opacity-70">{closed ? 'Cerrado' : 'En tu ruta'}</span>}
                    </button>
                  )
                })}
                  </div>
                ))}
              </div>
              <p className="mt-7 text-center text-text/50" style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }}>
                {isExcursion ? 'Hora de recogida' : isFreeTour ? 'Hora de inicio' : 'Hora de entrada'}
              </p>

              <div className="mt-3.5">
                <TimeListWheel items={rueda} value={validTime ? (fields.time.length === 4 ? `0${fields.time}` : fields.time) : rueda[0]} onChange={(hhmm) => {
                  if (igual && Date.now() - ultimoCambioDeRueda.current < 1500) return
                  set({ time: hhmm })
                }} label={isExcursion ? 'Hora de recogida' : isFreeTour ? 'Hora del Free Tour' : 'Hora de la entrada'} />
              </div>

              {civitatisActiva() && modoReservar && !isExcursion && horasApi.estado !== 'apagado' && (
                <div className="mt-3 space-y-1.5" data-civitatis-horas>
                  {horasApi.estado === 'cargando' && <p className="text-center text-[12.5px] text-text-soft">Mirando las horas libres…</p>}
                  {horasDelDia?.sinPlazas && (
                    <p className="text-center text-[12.5px] leading-snug text-accent-red" data-aviso="sin-plazas">
                      Ese día no quedan horas libres. Prueba otro día.
                    </p>
                  )}
                  {horasDelDia && horasDelDia.horas.some((h) => h.aviso) && (
                    <ul className="m-0 flex list-none flex-wrap justify-center gap-x-3 gap-y-0.5 p-0 text-[12.5px] text-text/75" data-aviso="plazas">
                      {horasDelDia.horas.filter((h) => h.aviso).map((h) => (
                        <li key={h.hora}>
                          {h.hora} · {h.aviso}
                        </li>
                      ))}
                    </ul>
                  )}
                  {avisoDeLaHora(horasDelDia, validTime ? fields.time : null) && (
                    <p className="text-center text-[12.5px] font-medium leading-snug text-text" data-aviso="plazas-de-esta-hora">
                      {avisoDeLaHora(horasDelDia, validTime ? fields.time : null)}
                    </p>
                  )}
                </div>
              )}

              {!isExcursion && !(civitatisActiva() && horasApi.estado === 'ok') && (
                <p className="mt-3 text-center text-[12.5px] leading-snug text-text-soft" data-aviso="disponibilidad">
                  {esLibre ? AVISO_DISPONIBILIDAD_RESERVAR : AVISO_DISPONIBILIDAD}
                </p>
              )}

              {/* (Tanda 10N10 §6-7; `Piezas/Entrada Nueva` 01-03) El orden de todas las hojas: la hora (arriba), ¿para quién son las entradas?, ¿cuánto ha costado en total?, ¿quién la ha pagado? (en cuadrados) y la línea de a dónde va el dinero. Sin gente en el viaje, solo el precio. */}
              {isFreeTour ? (
                paraQuienVisible && (
                  <div className="mt-7 flex flex-col gap-2.5" data-para-quien>
                    <span style={ESTILO_PREGUNTA}>{preguntaParaQuien('freetour')}</span>
                    <PersonasCuadradas personas={personasDelViaje.map((p) => ({ id: p.id, nombre: nombreDe(p) }))} marcados={marcados} onAlternar={alternarPersona} datos="para-quien" etiqueta="¿Para quién son las entradas?" />
                  </div>
                )
              ) : (
                <div className="mt-7" data-para-quien={paraQuienVisible ? '' : undefined}>
                  <BloqueDinero
                    tipo={isExcursion ? 'excursion' : 'entradas'}
                    solo={!paraQuienVisible}
                    personas={personasDelViaje.map((p) => ({ id: p.id, nombre: nombreDe(p) }))}
                    yoId={quienReservaId}
                    paraQuien={marcados}
                    onParaQuien={alternarPersona}
                    precio={precio}
                    pagadoPor={pagadoPor}
                    onPagadoPor={alternarPagado}
                    cuenta={cuentaDelViaje(personasDelViaje.length, esFamilia(route)) === 'grupo' ? 'grupo' : 'conjunta'}
                    permiso={permisos.rol}
                    nombreAdmin={grupo.nombreAdmin}
                  />
                </div>
              )}

              {outside && (
                <p className="mt-2 text-[13px] leading-snug text-accent-red">
                  Tu reserva es del {shortDateEs(fields.dateIso)}, fuera de las fechas de tu viaje. Revisa la fecha.
                </p>
              )}
              {plan?.sinMover?.motivo === 'excursion' && !outside && resolvedDay && (
                <p className="mt-2 text-[13px] leading-snug text-text">
                  {ElDia(route, resolvedDay.dayNumber)} tienes la excursión: la reserva se guarda en Reservas con el aviso y tu ruta no cambia.
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
                  <Icono nombre="correo" size={13} />
                  <span className="underline underline-offset-2">Rellenar desde el email o el PDF</span>
                </button>
              </p>

              {(() => {
                // [Reservar la mía a la misma hora] (Tanda 10N8 §8): «Comprar a las 14:00» abre la web; «Ya la tengo · Guardarla» la guarda en RESERVAS con ese día y esa hora, sin abrir la web.
                const comprando = igual?.modo === 'comprar'
                const urlDeCompra = entradasPorSitio?.[isFreeTour ? 'Free Tour' : (target.placeNames[0] ?? '')]?.[0]?.url ?? buildActivitySearchUrl(`${target.name} ${route.destination}`)
                return (
                  <>
                    {comprando && igual && (
                      <p data-linea-comprar className="mt-7 text-center text-[13.5px] leading-snug text-text/70">
                        {igual.quien || 'El dueño'} {/ y |,/.test(igual.quien) ? 'la tienen' : 'la tiene'} {diaDeLaReservaEnPalabras(route, igual.reserva)} a las {horaCorta(igual.reserva.time)}. Recuerda elegir esa hora al reservar.
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={!ready || planPending}
                      data-guardar-reserva={comprando ? 'comprar' : 'guardar'}
                      onClick={() => {
                        if (comprando) {
                          openTicketShop(urlDeCompra)
                          setCompraAbierta(true)
                        } else save()
                      }}
                      className={`${comprando ? 'mt-3' : 'mt-7'} h-[54px] w-full rounded-full btn-champan text-[15px] font-semibold transition-transform active:scale-[.98] disabled:opacity-40`}
                    >
                      {comprando ? 'Ir a comprar' : textoDelBoton({ normal: isExcursion ? 'Guardar la excursión' : isFreeTour ? 'Guardar el Free Tour' : 'Guardar la entrada', solo: !paraQuienVisible, marcados, yoId: quienReservaId, permiso: permisos.rol, nombreAdmin: grupo.nombreAdmin })}
                    </button>
                    {comprando && (
                      <button type="button" disabled={!ready || planPending} data-ya-la-tengo-guardarla onClick={() => save()} className="mt-3 w-full py-2 text-center text-[14px] font-semibold text-text underline underline-offset-2 disabled:opacity-40">
                        Ya la tengo · Guardarla
                      </button>
                    )}
                  </>
                )
              })()}
              {igual?.modo === 'comprar' && compraAbierta && preguntaCompra && (
                <div data-pregunta-compra className="mt-3 rounded-[18px] bg-[#F3E6C6]/70 p-3.5 text-center">
                  <p className="text-[14.5px] font-semibold leading-snug text-text">¿Has comprado la entrada {conDe(sitioDeLaEntrada(target))}?</p>
                  <p className="mt-1 text-[13px] leading-snug text-text/70">Guárdala aquí y la tendrás siempre a mano.</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" data-compra-si onClick={() => save()} className="h-11 flex-1 rounded-full btn-champan text-[14.5px] font-semibold">
                      Guardar
                    </button>
                    <button type="button" data-compra-no onClick={() => setPreguntaCompra(false)} className="h-11 flex-1 rounded-full border border-text/15 text-[14.5px] font-medium text-text">
                      Todavía no
                    </button>
                  </div>
                </div>
              )}


              {target.existing && (
                <div className="mt-5 border-t border-text/10 pt-4 text-center">
                  {confirmDelete ? (
                    <div>
                      <p className="text-[14.5px] leading-snug text-text">¿Quitamos tu reserva de {target.name}?</p>
                      <div className="mt-3 flex gap-2">
                        <button type="button" onClick={() => setConfirmDelete(false)} className="h-11 flex-1 rounded-full border border-text/15 text-[14.5px] font-medium text-text hover:bg-bg-hover">
                          Cancelar
                        </button>
                        <button type="button" onClick={deleteReservation} className="h-11 flex-1 rounded-full bg-accent-red text-[14.5px] font-semibold text-white active:scale-[.98]">
                          Sí, quitar
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
                  {ElDia(route, resolvedDay.dayNumber)} tienes la excursión: la reserva se guarda en Reservas con el aviso y tu ruta no cambia.
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <div className="flex-1">
                  <span className="text-[12px] font-medium text-text-soft">{isExcursion ? 'Hora de recogida' : 'Hora de entrada'}</span>
                  <TimeField
                    value={fields.time}
                    onChange={(hhmm) => set({ time: hhmm })}
                    title={isExcursion ? 'Hora de recogida' : 'Hora de entrada'}
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
            <button type="button" disabled={!ready || planPending} onClick={() => save()} className="h-12 w-full rounded-full btn-champan text-[15px] font-medium transition-transform active:scale-[.98] disabled:opacity-40">
              {resolvedDay ? `Guardar y ponerla en ${elDia(route, resolvedDay.dayNumber)}` : 'Guardar y ponerla en su día'}
            </button>
          </div>
        )}
      </div>
      {confirming && plan?.cambia && (
        <div className="absolute inset-0 z-[5] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="move-day-heading">
          <div className="absolute inset-0 bg-text/25" onClick={() => setConfirming(false)} />
          <div className="trazo-notice-panel relative w-full rounded-t-[28px] bg-bg-card px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[440px] md:rounded-[28px]">
            <h2 id="move-day-heading" className="font-display text-[22px] leading-[1.2] text-text">
              {plan.mensaje}
            </h2>
            {plan.motivos.length > 0 && <p className="mt-3 text-[14.5px] leading-snug text-text-soft">{plan.motivos.join(' ')}</p>}
            <button type="button" onClick={() => save('mover')} className="mt-5 h-12 w-full rounded-full btn-champan text-[15px] font-medium transition-transform active:scale-[.98]">
              De acuerdo
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}
