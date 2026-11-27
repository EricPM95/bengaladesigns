import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { conDe, sitioConArticulo } from '../../../../shared/avisos/textos.js'
import type { Excursion, Route, Stop } from '../../../lib/types'
import { repartirEnFilas } from '../../../lib/repartirEnFilas'
import type { DayPlan } from '../../../lib/types'
import { dateOfDay, dayLineOf, dayOnDate, fechaDeLista, isDayPinned, shortDateEs, type Reservation } from '../../../lib/bookings'
import { alDia, ElDia, elDia } from '../../../lib/nombreDeDia'
import { reservasParaMotor } from '../../../lib/engineReservas'
import { excursionTargetDays } from '../../../lib/excursionOffer'
import { useRouteStore } from '../../../store/useRouteStore'
import { removeReservationWithUndo, withUndo } from '../../../store/useAddFlowStore'
import { fechaCorta, movimientoDeExcursion, type FilaDeCambio } from '../../../lib/excursionMove'
import { tituloSimpleDelDia } from '../../../lib/tituloDelDia'
import { useNoticesStore } from '../../../store/useNoticesStore'
import { DateField } from '../../ui/DateField'
import { TimeField } from '../../ui/TimeField'
import { CampoDeHora } from '../../ui/HojaDeHora'
import { PersonasCuadradas, ESTILO_PREGUNTA } from '../../ui/PersonasCuadradas'
import { usePermisosDelViaje } from '../../../hooks/usePermisosDelViaje'
import { usePrecioEditable } from '../../../lib/useMoneda'
import { isManualRoute } from '../../../lib/manualPlan'
import { useDestinationPool } from '../../../lib/useDestinationPool'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import { AVISO_DISPONIBILIDAD, AVISO_DISPONIBILIDAD_RESERVAR, horasDeLaRueda, useHorarioDeEntrada } from '../../../lib/horarioDeEntrada'
import { FREE_TOUR_RUEDA } from '../../../lib/freeTourHoras'
import { avisoDeLaHora, civitatisActiva, recomendarHora, ruedaConHorasLibres, useHorasEnRango, useHorasLibres } from '../../../lib/civitatis'
import { HojaMoverDias, tarjetasDeLosDias } from './HojaMoverDias'
import { HojaRevisaLasHoras } from './HojaRevisaLasHoras'
import { revisarLasHoras, type RevisionDeHoras } from '../../../lib/revisarLasHoras'
import { HorasDeInicio } from './HorasDeInicio'
import { horasDeInicio, sePuedeElegir } from '../../../lib/horasDeInicio'
import { useLlegadaUtil } from '../../../lib/horaUtilDeLlegada'
import { lugarCon } from '../../../lib/articulos'
import { ponerAvisoDeDocumento } from '../../../lib/avisoDeDocumento'
import { useSyncStore } from '../../../store/useSyncStore'
import { useReservasFocusStore } from '../../../store/useReservasFocusStore'
import { llegadaVueltaDe } from '../../../lib/llegadaVuelta'
import { useEntradasDelGrupo } from '../../../hooks/useEntradasDelGrupo'
import { useMisReservas } from '../../../store/useMisReservas'
import { openTicketShop } from './EntradaCard'
import { buildActivitySearchUrl } from '../../../lib/affiliateLinks'
import { enlaceDeCompraDeEntrada } from '../../../lib/entradaEnlace'
import { diaDeLaReservaEnPalabras, horaCorta } from '../../../lib/reservasGrupo'
import { nombreDe } from '../../../store/useViajeCompartido'
import { cuentaDelViaje, esFamilia } from '../../../lib/cuentaDelViaje'
import { BloqueDinero, textoDelBoton, preguntaParaQuien } from '../presupuesto/BloqueDinero'
import { anadirComoPrimeraParada, esReservaLibre, type SugerenciaDeEntrada } from '../../../lib/otraReserva'
import { llevarALaParada } from '../../../lib/cambiarParada'
import { FREE_TOUR_REF } from '../../../lib/freeTourManual'
import type { DatosEntradaLeida } from '../../../lib/billeteLeer'
import { useBilleteStore, entradaConCodigo, type CodigoDelBillete } from '../../../store/useBilleteStore'
import { useDocumentosDeEntrada } from '../../../store/useDocumentosDeEntrada'
import { useBilletesDeEntradas } from '../../../hooks/useBilleteEntrada'
import { ImagenDelCodigo } from './TarjetaBillete'
import { CruzDeHoja } from '../../ui/CruzDeHoja'
import { BOTON_ORO } from '../../ui/botonesOro'
import { TiradorDeHoja } from '../../ui/TiradorDeHoja'
import { FONDO_DE_HOJA } from '../../ui/fondoDeHoja'

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
  /** (10S8 §4, E5) El lápiz del bloque de datos: la hoja «Datos de la entrada» (para quién, precio y, con documento, los datos leídos), sin el día ni la hora. */
  soloDatos?: boolean
}

/** Qué se mueve al meter una reserva grande (/api/reservation-plan). */
interface ReservationPlan {
  cambia: boolean
  mensaje: string | null
  motivos: string[]
  sinMover: { motivo: string } | null
  cambios: { dayNumber: number; de: string | null; a: string | null }[]
  /** (V49) El orden de los días antes y después, y el sitio que manda (el servidor ya los manda): con ellos se escribe el aviso de los días que cambian. */
  antes?: { dayNumber: number; curatedId?: string | null; name?: string | null }[]
  despues?: { dayNumber: number; curatedId?: string | null; name?: string | null }[]
  principal?: { sitio: string; dayNumber: number; dateIso: string | null } | null
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
  // (V69, apartado 3) «Revisa las horas»: lo que no cuadra al guardar (null = nada).
  const [revision, setRevision] = useState<RevisionDeHoras | null>(null)
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
  const soloDatos = Boolean(target.soloDatos && existing)
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
  const [view] = useState<'hora' | 'form'>('hora')
  // (V45 §4) En grupo la hoja va en DOS pasos: 1) los días y la hora [Siguiente]; 2) «Casi lista» (¿A qué cuenta?, ¿Quién la ha pagado?, el precio y [Guardar…]).
  const [pasoGrupo, setPasoGrupo] = useState<1 | 2>(1)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (patch: Partial<Fields>) => setFields((previous) => ({ ...previous, ...patch }))

  // El día de la reserva: el de su fecha; sin fechas en el viaje, el que se elige.
  const resolvedDay = hasDates ? (fields.dateIso ? dayOnDate(route, fields.dateIso) : null) : (days.find((day) => String(day.dayNumber) === fields.dayNumber) ?? null)
  const outside = hasDates && Boolean(fields.dateIso) && !resolvedDay
  const validTime = /^\d{1,2}:\d{2}$/.test(fields.time)
  // (V49) La hora de recogida de una excursión es opcional: sin hora, la tarjeta no la enseña (nunca se guarda una que el viajero no escribió).
  const ready = Boolean(resolvedDay && (validTime || isExcursion))
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
  // (V49) Excursión: TODOS los días completos del viaje (no el de llegada ni el de vuelta), con el de la ruta marcado «En tu ruta»; solo se quita uno que ya tiene OTRA excursión reservada.
  const chipDays = isExcursion ? excursionTargetDays(route).filter((day) => day.id === target.currentDayId || !isDayPinned(route, reservations.filter((item) => item.id !== existing?.id && item.refId !== target.refId), day)) : days
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
  // (V69, apartado 4; Design «Free Tour Hora» H1-H3) LAS HORAS EN BOTONES. Una consulta al abrir la hoja (`/api/civitatis/horas-rango`, una sola vez por apertura, solo con Civitatis encendida): las horas libres de TODOS los días del viaje de ese sitio,
  // unos 2-4 KB (≈10 días × ≈5 horas). Con ellas se marcan los días «Agotado» y se tachan las horas agotadas de cada día; sin datos, las seis horas de siempre del Free Tour. La rueda libre se queda para lo que no tiene horas fijas.
  const rangoDeHoras = useHorasEnRango(lugarDeLasHoras, tripIsos[0] ?? null, tripIsos[tripIsos.length - 1] ?? null, route.destination, view === 'hora' && hasDates && aperturas > 0 && lugarDeLasHoras && tripIsos.length > 0 ? `${lugarDeLasHoras}|${aperturas}` : null)
  const llegadaUtil = useLlegadaUtil(route)
  const usaRango = Boolean(rangoDeHoras?.conHorasFijas)
  const diaDelRango = usaRango && hasDates && fields.dateIso ? (rangoDeHoras?.dias[fields.dateIso] ?? null) : null
  // Botones: siempre en el Free Tour; en una entrada, solo si Civitatis da horas fijas para ese día y se está reservando (con «Añádela»/«Cambiar» el viajero pone la hora que ya tiene).
  const conBotones = !isExcursion && !esLibre && hasDates && (isFreeTour || (modoReservar && diaDelRango != null))
  const diaSinHoras = (iso: string | null) => {
    const dia = usaRango && iso ? rangoDeHoras?.dias[iso] : null
    return Boolean(dia && (dia.sinPlazas || dia.horas.length === 0))
  }
  const diaAgotado = conBotones && diaSinHoras(fields.dateIso)
  const esDiaDeLaLlegada = Boolean(fields.dateIso) && llegadaUtil.fechaLlegada === fields.dateIso
  const horasBotones = useMemo(() => {
    if (!conBotones || diaAgotado) return []
    const dia = diaDelRango
    const delViaje = usaRango ? [...new Set(Object.values(rangoDeHoras?.dias ?? {}).flatMap((d) => d.horas.map((h) => h.hora)))] : []
    // La recomendada de la V60 (la primera libre que cabe después de cuando puede estar allí), solo si cae en ESTE día.
    // (En otro día que el de la ruta, la hora a la que la ruta lleva a ese sitio donde está ahora.)
    const laParada = (stop: Stop) => (isFreeTour ? stop.isFreeTour : !stop.isNightExperience && target.placeNames.includes(stop.name))
    const horaRuta = (resolvedDay?.stops.find(laParada) ?? route.days.flatMap((day) => day.stops).find(laParada))?.time ?? null
    const rec = usaRango && fields.dateIso ? recomendarHora(rangoDeHoras, fields.dateIso, horaRuta, tripIsos, { fechaLlegada: llegadaUtil.fechaLlegada, horaUtilMin: llegadaUtil.utilMin, aterrizaHHMM: llegadaUtil.aterriza }) : null
    return horasDeInicio({
      libres: dia ? dia.horas : null,
      delViaje,
      recomendada: rec && rec.tipo === 'hora' && rec.dia === fields.dateIso ? rec.hora : null,
      utilMin: esDiaDeLaLlegada ? llegadaUtil.utilMin : null,
      propia: existing?.time ?? horaLeida ?? null,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conBotones, diaAgotado, diaDelRango, usaRango, rangoDeHoras, fields.dateIso, resolvedDay?.id, esDiaDeLaLlegada, llegadaUtil.utilMin, existing?.time, horaLeida])
  // Si la hora puesta ya no se puede elegir en este día (otro día, agotada, antes de llegar): se quita; la hora no se pone sola.
  useEffect(() => {
    if (!conBotones || !fields.time) return
    const hora = fields.time.length === 4 ? `0${fields.time}` : fields.time
    if (diaAgotado || (horasBotones.length > 0 && !horasBotones.some((h) => h.hora === hora && sePuedeElegir(h)))) setFields((previous) => ({ ...previous, time: '' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conBotones, diaAgotado, horasBotones])
  const listo = ready && !diaAgotado
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
  // (10S9b §3) La hora NO se pone sola: la rueda sale con un ejemplo en gris (la de partida de abajo) que no cuenta hasta que el viajero la elige. Una excursión parte de su hora de salida
  // (la primera de su línea) o, si no la hay, de las 07:00. Una entrada parte de la de la reserva que ya hay (o la del dueño); si no, la hora a la que la ruta llega a ese sitio ese día, y si no está,
  // las 9:00 (10:00 en el Free Tour); siempre la más cercana de las horas del sitio.
  const horaDePartida = useMemo(() => {
    if (isExcursion) {
      const first = target.excursion?.page?.stops?.[0]?.time
      return first && pickupItems.includes(first) ? first : '07:00'
    }
    const asMin = (hhmm: string) => Number(hhmm.split(':')[0]) * 60 + Number(hhmm.split(':')[1])
    const enLaRuta = resolvedDay?.stops.find((stop) => (isFreeTour ? stop.isFreeTour : !stop.isNightExperience && target.placeNames.includes(stop.name)))
    const llegada = enLaRuta && /^\d{1,2}:\d{2}$/.test(enLaRuta.time ?? '') ? asMin(enLaRuta.time) : NaN
    const wanted = igual?.reserva.time ? asMin(igual.reserva.time) : validTime ? asMin(fields.time) : Number.isNaN(llegada) ? (isFreeTour ? 10 : 9) * 60 : llegada
    return wheelItems.reduce((best, item) => (Math.abs(asMin(item) - wanted) < Math.abs(asMin(best) - wanted) ? item : best), wheelItems[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wheelItems, isExcursion, resolvedDay?.id, pickupItems])

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
  // (V46) Quien la añade sale marcado, pero se puede desmarcar (si la compra para otros). Siempre queda al menos una persona marcada.
  const alternarPersona = (id: string) => setMarcados((previous) => (previous.includes(id) ? (previous.length > 1 ? previous.filter((other) => other !== id) : previous) : [...previous, id]))
  // (V45) «Reservar la mía a la misma hora» (día y hora ya elegidos): una sola pantalla, como antes (quien compra decide para quién).
  const enDosPasos = paraQuienVisible && !soloDatos && igual?.modo !== 'comprar'
  const verDias = !soloDatos && (!enDosPasos || pasoGrupo === 1)
  const verDinero = !enDosPasos || pasoGrupo === 2
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
  // (V49) La excursión guardada en otro día MUEVE el día de excursión a ese día (aviso E1 con los días que cambian).
  const movExc = isExcursion && resolvedDay && !esInvitado ? movimientoDeExcursion(route, resolvedDay.id, (otro) => isDayPinned(route, reservations.filter((item) => item.id !== existing?.id && item.refId !== target.refId), otro)) : null
  const nombreDeLaExcursion = (target.excursion?.title ?? target.name).replace(/^Excursión (a la|a los|a las|al|a)\s+/i, 'excursión a ').replace(/^(?!excursión)/i, 'excursión: ')
  // (V69) `stage`: 'inicio' (el botón de guardar), 'mover' ([Cambiar los días]) o 'solo' ([Solo mover la entrada/la excursión]). `forzada`: «Guardarla igualmente» de «Revisa las horas»: se guarda sin meterla en el día.
  const save = (stage: 'inicio' | 'mover' | 'solo' = 'inicio', forzada: RevisionDeHoras | null = null) => {
    if (!resolvedDay || !listo) return
    // Tanda 10N §8: la entrada de quien está en el viaje de otra persona es SUYA: va a su lista, no toca la ruta del dueño ni sus reservas.
    if (esInvitado) {
      const propia = draftReservation()
      if (!propia) return
      useMisReservas.getState().anadir(propia)
      guardarBilleteDeEntrada()
      onClose()
      return
    }
    // (V69, apartado 3) «Revisa las horas»: una reserva imposible (antes de aterrizar, después de salir el vuelo de vuelta, a la vez que otra) avisa ANTES de meterla en la ruta.
    if (stage === 'inicio' && !forzada) {
      const borrador = draftReservation()
      const revision = borrador ? revisarLasHoras(route, borrador, reservations) : null
      if (revision) {
        setRevision(revision)
        return
      }
    }
    // (V69, apartado 2) Antes de mover días por una entrada o una excursión, la hoja con lo que cambia (E1/E2): se aplica al elegir [Cambiar los días] o [Solo mover …].
    if (!forzada && movExc && stage === 'inicio') {
      setConfirming(true)
      return
    }
    const blocked = plan?.cambia && stage !== 'solo' ? blockedDay() : null
    if (!forzada && plan?.cambia && blocked == null && stage === 'inicio') {
      setConfirming(true)
      return
    }
    const reservation = draftReservation()
    if (!reservation) return
    if (forzada) {
      // Guardada igualmente: queda en RESERVAS con su línea naranja (la misma frase) y NO entra en el día como si cupiera.
      reservation.revisarHoras = true
      ponerAvisoDeDocumento(useSyncStore.getState().activeTripId, reservation.id, forzada.texto)
    }
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
    if (target.sugerencia && !esLibre && !forzada) {
      try {
        llevarA = anadirComoPrimeraParada(resolvedDay.id, target.sugerencia, reservation)
      } catch (error) {
        console.error('[AddReservationSheet] no se pudo poner en la ruta', error)
      }
    }
    // (10S7b §7) Dónde estaba la parada antes: si la reserva la trae de otro día (o crea la del Free Tour), después se ilumina. Se lee aquí, en la pantalla, y no en el almacén de la ruta (que no puede mirar al del añadir: dependencia circular).
    const sitioDeLaParada = (stop: { name: string; isFreeTour?: boolean }) => (reservation.refId === FREE_TOUR_REF ? Boolean(stop.isFreeTour) : reservation.placeNames.includes(stop.name))
    const diaAntes = !llevarA && reservation.kind === 'entrada' && !esLibre ? (useRouteStore.getState().route?.days.find((day) => day.stops.some(sitioDeLaParada))?.id ?? null) : null
    try {
      // (V49) Con el día de excursión movido, el aviso de abajo con [Deshacer].
      if (movExc && !forzada) withUndo(`Tu ${nombreDeLaExcursion}, el ${fechaCorta(dateOfDay(route, resolvedDay), resolvedDay.dayNumber)}`, () => addReservation(reservation, target.excursion ?? null, freeTourEntry, stage === 'solo' ? { solo: true } : undefined))
      else addReservation(reservation, target.excursion ?? null, freeTourEntry, stage === 'solo' ? { solo: true } : undefined)
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
    else if (reservation.kind === 'entrada' && !esLibre) {
      // (10S7b §7) La reserva trae el Free Tour o una entrada de otro día: la parada se ilumina igual. Si no estaba (el Free Tour nuevo) o su día ha cambiado.
      const despues = useRouteStore.getState().route?.days.flatMap((day) => day.stops.filter((stop) => stop.reservedId === reservation.id).map((stop) => ({ dayId: day.id, stopId: stop.id })))[0]
      if (despues && despues.dayId !== diaAntes) llevarALaParada(despues.dayId, despues.stopId)
    }
  }

  /** (10S7 §3) Guarda el billete de la entrada (personas, localizador y código) en el móvil de esta persona. Sin nada que guardar, se quita el que hubiera. */
  const guardarBilleteDeEntrada = () => {
    if (target.kind !== 'entrada' || isExcursion) return
    const n = Number.parseInt(personas, 10)
    const datosBillete = { personas: Number.isFinite(n) && n > 0 ? n : null, localizador: localizadorDeEntrada.trim() || null, codigo: codigoDeEntrada }
    // (V65) Quién la ve: si «¿Para quién es?» cambió, los documentos ya subidos de esta entrada pasan a verla las personas nuevas (y dejan de verla las que se quitaron).
    if (paraQuienVisible && marcados.length > 0) useDocumentosDeEntrada.getState().cambiarPara(billetes.tripId, 'entrada', target.refId, marcados)
    if (datosBillete.personas || datosBillete.localizador || datosBillete.codigo) {
      if (!billeteTocado && billeteDeAntes) return
      useBilleteStore.getState().ponerEntrada(billetes.tripId, target.refId, { ...datosBillete, dueno: billeteDeAntes?.dueno ?? billetes.yoId })
      // (V65) Entrada de más de una persona: mi documento lo ven también las demás (el de cada una, con su nombre, lo sube cada una o se reparte desde «Las entradas de cada uno»).
      if (paraQuienVisible && marcados.length > 1 && billetes.yoId && datosBillete.codigo) useDocumentosDeEntrada.getState().poner(billetes.tripId, { tipo: 'entrada', refId: target.refId, clave: billetes.yoId, subidoPor: billetes.yoId, para: marcados, nombre: null, localizador: datosBillete.localizador, personas: datosBillete.personas, codigo: datosBillete.codigo })
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

  // (V45 §4) La hoja ya no pide el documento (se guarda primero y se sube después, desde la tarjeta): `aplicarLecturaDeEntrada` se conserva por si vuelve.
  void aplicarLecturaDeEntrada
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
      <div className="trazo-notice-backdrop absolute inset-0" style={{ background: FONDO_DE_HOJA }} onClick={onClose} />
      {/* (Noche 24-25 nov, Design «Excursion Nueva» X1 / «Entradas Billete») La hoja es crema (#FBF3E2), con el tirador de siempre. */}
      <div className="trazo-notice-panel relative flex max-h-[92dvh] w-full flex-col rounded-t-[32px] shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[440px] md:rounded-[28px]" style={{ background: '#FBF3E2' }}>
        <div className="flex shrink-0 justify-center pt-3" aria-hidden="true">
          <TiradorDeHoja />
        </div>
        <CruzDeHoja onCerrar={onClose} estilo={{ right: 12, top: 12 }} />

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
          {view === 'hora' ? (
            <div>
              {!soloDatos && <p className="max-w-[calc(100%-2.5rem)] text-text/50" style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }}>
                {lectura ? target.name : isExcursion ? (target.paso2 ? 'Añadir una excursión · 2 de 2' : 'Excursión · elige día y hora') : esLibre ? 'Reserva · elige día y hora' : isFreeTour ? 'Free Tour · elige día y hora' : 'Entrada · elige día y hora'}
              </p>}
              <h2 id="add-reservation-heading" className={soloDatos ? "mt-1.5 font-display text-[30px] leading-none text-text" : "mt-1.5 font-display text-[28px] leading-[1.05] text-text"} data-hoja-titulo={soloDatos ? "datos-entrada" : undefined}>
                {lectura && !soloDatos ? "Revisa los datos" : soloDatos ? "Datos de la entrada" : target.name}
              </h2>
              {/* (V64 §1) Tras subir el documento, siempre «Revisa los datos»: los campos ya rellenos con lo leído y [Guardar]. */}
              {lectura && !soloDatos && <p className="mt-2 text-[14px] font-medium leading-[1.4] text-text/75" data-reserva-leida>Hemos leído tu {isExcursion ? 'reserva' : 'entrada'}. Revisa los datos y cámbialos si hace falta</p>}
              {/* (V49) Las de día entero: solo caben en un día completo del viaje. */}
              {isExcursion && !soloDatos && target.excursion && !/medio/i.test(target.excursion.durationLabel ?? "") && (target.excursion.durationHours ?? 8) > 5 && (
                <p data-excursion-dia-entero className="mt-1.5 text-[13.5px] leading-[1.35] text-text/65">Es una excursión de día entero: solo se puede hacer un día completo del viaje.</p>
              )}
              {igual && (
                <p className="mt-2 text-[13.5px] leading-snug text-text/70" data-igual-que>
                  {igual.quien || 'El dueño'} {/ y |,/.test(igual.quien) ? 'van' : 'va'} el {diaDeLaReservaEnPalabras(route, igual.reserva)} a las {horaCorta(igual.reserva.time)}.{' '}
                  {igual.modo === 'comprar' ? 'Ya tienes elegidos ese día y esa hora.' : 'Apunta aquí la que ya tienes.'}
                </p>
              )}

              {/* (10S7 §3, E1) [Añadir tu entrada]: desde el PDF, una foto o una captura la app lee el día, la hora, las personas y el localizador y guarda el código. Todo se puede cambiar a mano. */}
              {!isExcursion && !igual && (billeteTocado || billeteDeAntes || codigoDeEntrada || soloDatos) && (
                <div className="mt-5 flex flex-col gap-3" data-entrada-billete-hoja>
                  {/* (10S9b §1) En «Datos de la entrada» (solo con pase, desde «o escribe los datos a mano») el localizador sale siempre, vacío y con su ejemplo en gris. */}
                  {(billeteTocado || billeteDeAntes || codigoDeEntrada || soloDatos) && (
                    <div className="flex flex-col gap-2.5" data-entrada-billete-datos>
                      <div className="flex gap-2">
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

              {verDias && (<>
              {/* Los días del viaje, en fichas que se deslizan de lado: el día que tiene en la ruta ya va marcado («En tu ruta»); un sitio cerrado ese día sale apagado. */}
              {/* (10S5) Los días ocupan todo el ancho, a partes iguales; si no caben en una fila (más de 4), en dos o más filas igual de llenas. */}
              <div className="mt-5 flex flex-col gap-1.5" role="group" aria-label="Día de tu reserva" data-dias-filas>
                {repartirEnFilas(chipDays).map((fila, indiceFila) => (
                  <div key={indiceFila} className="flex gap-1.5" data-dias-fila={indiceFila}>
                {fila.map((day) => {
                  const selected = resolvedDay?.id === day.id
                  const closed = isClosedDay(day)
                  const agotado = !closed && conBotones && diaSinHoras(hasDates ? dateOfDay(route, day) : null)
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
                        background: selected ? '#1C2230' : closed ? '#F1EADC' : agotado ? '#EFEAE0' : '#FFFDF8',
                        color: selected ? '#FBF3E2' : agotado ? 'rgba(28,34,48,.4)' : '#1C2230',
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
                      {agotado ? <span data-dia-agotado-marca className="text-[10.5px] font-semibold" style={{ color: selected ? '#F0B48A' : '#A04A2A' }}>Agotado</span> : (closed || inRoute) && <span className="text-[10.5px] font-medium opacity-70">{closed ? 'Cerrado' : 'En tu ruta'}</span>}
                    </button>
                  )
                })}
                  </div>
                ))}
              </div>
              <p className="mt-7 text-center text-text/50" style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }}>
                {isExcursion ? 'Hora de recogida' : isFreeTour ? 'Hora de inicio' : 'Hora de entrada'}
              </p>

              {conBotones && (
                diaAgotado ? (
                  <div data-dia-agotado className="mt-3.5 flex items-center gap-2.5 rounded-2xl p-3.5" style={{ background: '#FDF1DC', border: '1px solid rgba(200,100,30,.4)' }}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#C8641E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none" aria-hidden="true">
                      <path d="M12 9v4M12 17h.01M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                    </svg>
                    <span className="text-[14px] font-semibold leading-[1.35]" style={{ color: '#7A3E0E' }}>Este día no quedan plazas. Elige otro día.</span>
                  </div>
                ) : (
                  <div className="mt-3.5" data-hora-de-la-hoja="botones">
                    <HorasDeInicio horas={horasBotones} elegida={validTime ? (fields.time.length === 4 ? `0${fields.time}` : fields.time) : null} onElegir={(hhmm) => set({ time: hhmm })} />
                  </div>
                )
              )}
              {!conBotones && (
              <div className="mt-3.5" data-hora-de-la-hoja>
                <CampoDeHora
                  valor={validTime ? fields.time : null}
                  onChange={(hhmm) => set({ time: hhmm ?? '' })}
                  titulo={isExcursion ? 'Hora de recogida' : isFreeTour ? 'Hora del Free Tour' : 'Hora de la entrada'}
                  ejemplo={horaDePartida}
                  items={rueda}
                  quitable={false}
                  datos="anadir"
                />
              </div>
              )}

              {!conBotones && civitatisActiva() && modoReservar && !isExcursion && horasApi.estado !== 'apagado' && (
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

              {!conBotones && !isExcursion && !(civitatisActiva() && horasApi.estado === 'ok') && (
                <p className="mt-3 text-center text-[12.5px] leading-snug text-text-soft" data-aviso="disponibilidad">
                  {esLibre ? AVISO_DISPONIBILIDAD_RESERVAR : AVISO_DISPONIBILIDAD}
                </p>
              )}
              </>)}

              {/* (Tanda 10N10 §6-7; `Piezas/Entrada Nueva` 01-03) El orden de todas las hojas: la hora (arriba), ¿para quién son las entradas?, ¿cuánto ha costado en total?, ¿quién la ha pagado? (en cuadrados) y la línea de a dónde va el dinero. Sin gente en el viaje, solo el precio. */}
              {/* (V45 §4) Paso 2 en grupo: «Casi lista», con el día y la hora arriba y «¿A qué cuenta lo sumamos?» ([Mi cuenta] / [Cuenta conjunta] o [Cuenta del grupo]); «¿Quién la ha pagado?» solo con la cuenta común. */}
              {enDosPasos && pasoGrupo === 2 && (
                <div className="flex flex-col gap-5" data-casi-lista>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-display text-[26px] leading-none text-text" data-casi-lista-titulo>Casi lista</h3>
                    {resolvedDay && (
                      <span data-casi-lista-cuando className="text-[15px] font-semibold text-text/70">
                        {chipText(resolvedDay)} · {validTime ? fields.time : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2.5" data-a-que-cuenta>
                    <span style={ESTILO_PREGUNTA}>¿A qué cuenta lo sumamos?</span>
                    <div className="flex gap-2">
                      {([
                        { id: 'mia', etiqueta: 'Mi cuenta', activa: marcados.length <= 1 },
                        { id: 'comun', etiqueta: cuentaDelViaje(personasDelViaje.length, esFamilia(route)) === 'grupo' ? 'Cuenta del grupo' : 'Cuenta conjunta', activa: marcados.length > 1 },
                      ] as const).map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          aria-pressed={o.activa}
                          data-cuenta-opcion={o.id}
                          onClick={() => setMarcados(o.id === 'mia' ? (quienReservaId ? [quienReservaId] : []) : personasDelViaje.map((p) => p.id))}
                          className="flex h-[52px] min-w-0 flex-1 items-center justify-center rounded-2xl px-3 text-[14.5px] font-bold"
                          style={o.activa ? { background: '#1C2230', color: '#F3D88F', border: '1px solid #1C2230' } : { background: '#FFFDF8', color: '#1C2230', border: '1px solid rgba(28,34,48,.14)' }}
                        >
                          {o.etiqueta}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {verDinero && (<>
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
                    sinLineas
                    quienSinPrecio={enDosPasos}
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

              </>)}

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


              {(() => {
                // [Reservar la mía a la misma hora] (Tanda 10N8 §8): «Comprar a las 14:00» abre la web; «Ya la tengo · Guardarla» la guarda en RESERVAS con ese día y esa hora, sin abrir la web.
                const comprando = igual?.modo === 'comprar'
                const entradaDeCompra = entradasPorSitio?.[isFreeTour ? 'Free Tour' : (target.placeNames[0] ?? '')]?.[0]
                const urlDeCompra = entradaDeCompra ? (enlaceDeCompraDeEntrada(entradaDeCompra, route.destination)?.url ?? null) : buildActivitySearchUrl(`${target.name} ${route.destination}`)
                return (
                  <>
                    {comprando && igual && (
                      <p data-linea-comprar className="mt-7 text-center text-[13.5px] leading-snug text-text/70">
                        {igual.quien || 'El dueño'} {/ y |,/.test(igual.quien) ? 'la tienen' : 'la tiene'} {diaDeLaReservaEnPalabras(route, igual.reserva)} a las {horaCorta(igual.reserva.time)}. Recuerda elegir esa hora al reservar.
                      </p>
                    )}
                    {enDosPasos && pasoGrupo === 1 && !comprando ? (
                      <button type="button" disabled={!listo} data-siguiente-paso onClick={() => setPasoGrupo(2)} className="mt-7 h-[54px] w-full rounded-2xl text-[16px] font-bold transition-transform active:scale-[.98] disabled:opacity-40" style={{ ...BOTON_ORO, border: 'none' }}>
                        Siguiente
                      </button>
                    ) : (
                    <button
                      type="button"
                      disabled={!listo || planPending}
                      data-guardar-reserva={comprando ? 'comprar' : 'guardar'}
                      onClick={() => {
                        if (comprando) {
                          openTicketShop(urlDeCompra)
                          setCompraAbierta(true)
                        } else save()
                      }}
                      className={`${comprando ? 'mt-3' : 'mt-7'} h-[54px] w-full rounded-2xl text-[16px] font-bold transition-transform active:scale-[.98] disabled:opacity-40`}
                      style={{ ...BOTON_ORO, border: 'none' }}
                    >
                      {comprando ? 'Ir a comprar' : soloDatos ? 'Guardar los datos' : textoDelBoton({ normal: isExcursion ? 'Guardar la excursión' : isFreeTour ? 'Guardar el Free Tour' : 'Guardar la entrada', solo: !paraQuienVisible, marcados, yoId: quienReservaId, permiso: permisos.rol, nombreAdmin: grupo.nombreAdmin })}
                    </button>
                    )}
                    {comprando && (
                      <button type="button" disabled={!listo || planPending} data-ya-la-tengo-guardarla onClick={() => save()} className="mt-3 w-full py-2 text-center text-[14px] font-semibold text-text underline underline-offset-2 disabled:opacity-40">
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


              {target.existing && !soloDatos && (
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
                    <TimeField value={fields.returnTime} onChange={(hhmm) => set({ returnTime: hhmm })} title="Hora de vuelta" placeholder="Sin hora" quitable />
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
            <button type="button" disabled={!listo || planPending} onClick={() => save()} className="h-[54px] w-full rounded-2xl text-[16px] font-bold transition-transform active:scale-[.98] disabled:opacity-40" style={{ ...BOTON_ORO, border: 'none' }}>
              {resolvedDay ? `Guardar y ponerla en ${elDia(route, resolvedDay.dayNumber)}` : 'Guardar y ponerla en su día'}
            </button>
          </div>
        )}
      </div>
      {confirming && (movExc || plan?.cambia) && (() => {
        // (V69, apartado 2; Design «Entrada Mueve Dias» E1/E2) La hoja de mover días por una entrada o una excursión: sale ANTES de aplicar; una tarjeta por cada día que cambia, [Cambiar los días] (recomendado) y [Solo mover la entrada/la excursión].
        // La entrada: el servidor da los cambios por día (`cambios`: en el puesto `dayNumber` entra ahora el día `a`, que estaba en otro puesto); de ahí, una fila por cada día que cambia, con su día de la ruta (su foto y su sitio principal).
        const fechaDe = (n: number) => dateOfDay(route, { dayNumber: n } as DayPlan)
        const delPlan = (plan?.cambios ?? [])
          .filter((cambio) => cambio.a)
          .map((cambio) => {
            const dia = route.days.find((d) => d.curatedId === cambio.a) ?? null
            const principal = cambio.dayNumber === plan?.principal?.dayNumber
            const antesNumero = dia?.dayNumber ?? null
            return { dia, fila: { dayNumber: cambio.dayNumber, fechaIso: fechaDe(cambio.dayNumber), nombre: dia ? tituloSimpleDelDia(route, dia) : String(cambio.a), antesIso: principal || antesNumero == null ? null : fechaDe(antesNumero), antesNumero: principal ? null : antesNumero, principal } as FilaDeCambio }
          })
          .sort((x, y) => Number(y.fila.principal) - Number(x.fila.principal) || x.fila.dayNumber - y.fila.dayNumber)
        const filas: FilaDeCambio[] = movExc ? movExc.filas : delPlan.map((x) => x.fila)
        const principal = filas.find((fila) => fila.principal)
        const dondeCae = principal ? fechaCorta(principal.fechaIso, principal.dayNumber) : fechaCorta(dateOfDay(route, resolvedDay ?? ({ dayNumber: 1 } as DayPlan)), resolvedDay?.dayNumber ?? 1)
        const titulo = movExc ? `Tu ${nombreDeLaExcursion}, el ${dondeCae}` : `Tu entrada ${lugarCon('de', plan?.principal?.sitio ?? target.placeNames[0] ?? target.name)}, el ${dondeCae}`
        // El día de la ruta de AHORA al que corresponde cada fila (su foto y su sitio principal): el de la excursión, o el que lleva ese sitio escrito (`curatedId`), o el que está en el puesto de antes.
        const diaDe = (fila: FilaDeCambio): DayPlan | null => {
          if (movExc) return fila.principal ? (route.days.find((d) => d.id === movExc.diaDeExcursionId) ?? null) : (route.days.find((d) => !d.isReturnLeg && d.dayNumber === fila.antesNumero) ?? null)
          return delPlan.find((x) => x.fila === fila)?.dia ?? null
        }
        const ciudad = (resolvedDay?.city ?? route.destination).split(',')[0]
        return (
          <HojaMoverDias
            titulo={titulo}
            ciudad={ciudad}
            // (El día de la excursión no tiene paradas: su foto es la de la excursión.)
            tarjetas={tarjetasDeLosDias(route, filas, diaDe).map((t, i) => (movExc && filas[i]?.principal && target.excursion?.photoUrl ? { ...t, fotoUrl: target.excursion.photoUrl } : t))}
            solo={isExcursion ? 'la excursión' : 'la entrada'}
            onCambiar={() => {
              setConfirming(false)
              save('mover')
            }}
            onSolo={() => {
              setConfirming(false)
              save('solo')
            }}
            onCerrar={() => setConfirming(false)}
          />
        )
      })()}
      {revision && (
        <HojaRevisaLasHoras
          revision={revision}
          onCerrar={() => setRevision(null)}
          // El botón de «lo otro»: el vuelo (RESERVAS › Llegada y vuelta, en su mitad) o la otra reserva (RESERVAS › Entradas); esta hoja se cierra.
          onOtro={() => {
            const otro = revision.otro
            setRevision(null)
            onClose()
            useRouteStore.getState().setMode('bookings')
            if (otro.tipo === 'vuelo') useReservasFocusStore.getState().pedir('llegada', otro.mitad)
            else if (otro.tipo === 'reserva') useReservasFocusStore.getState().pedir(otro.reserva.kind === 'excursion' ? 'excursiones' : 'entradas')
          }}
          // El botón de «esta»: se vuelve a esta hoja para cambiar el día o la hora.
          onEsta={() => setRevision(null)}
          onGuardarIgualmente={() => {
            const guardar = revision
            setRevision(null)
            save('inicio', guardar)
          }}
        />
      )}
    </div>,
    document.body,
  )
}
