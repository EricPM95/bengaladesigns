import { useEffect, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Coordinates } from '../../../lib/types'
import type { MockStopDetail } from '../../../lib/mockDayDetail'
import { fetchPlacePhotoDetail, photoNameOf, type PlacePhoto } from '../../../lib/placePhoto'
import { displayStopName, formatDuration } from '../../../lib/format'
import { formatShortDateEs } from '../../../lib/dateRange'
import { computeStopHoursTag } from '../../../lib/stopHoursTag'
import { describeStop, type StopDescription } from '../../../lib/describeStopApi'
import { fetchAnchorTips, type StopTip } from '../../../lib/anchorTipsApi'
import { fetchPlaceDetail, fichaEnMemoria, toNearbyTransit, toStopDescription, toStopTips, type PlaceDetail } from '../../../lib/placeDetailApi'
import { fetchNearbyTransit, type NearbyTransit } from '../../../lib/nearbyTransitApi'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import { catalogoEnMemoria, fetchDestinationPlaces, porQueRecomendamosDe } from '../../../lib/destinationPlacesApi'
import { StopsMapView, type StopsMapMarker } from '../../map/StopsMapView'
import { HowToGetThereSheet } from '../today/HowToGetThereSheet'
import { Spinner } from '../../ui/Spinner'
import { FreeTourIcon, MoonIcon } from '../../ui/TimeIcons'
import { withoutLeadingEmoji } from '../../../lib/stopKind'
import { DateNoticeSmallIcon } from '../DateNoticeIcons'
import { StopEntradasTab } from '../reservas/StopReservation'
import { useStopEntradas } from '../reservas/useStopEntradas'
import { ActividadesDelSitio } from '../reservas/ActividadesDelSitio'
import { useActividadesCerca } from '../../../lib/civitatis'
import { Icono } from '../../ui/Icono'
import { MeGusta } from '../../ui/MeGusta'
import { useHorarioDeParadas } from '../../../lib/horarioDeParada'
import { etiquetaDeHorario } from '../../../lib/etiquetaHorario'
import { FotoCredito } from '../../ui/FotoCredito'
import { BotonFotoParada } from '../fotos/BotonFotoParada'
import { Escuchar } from '../hoy/Escuchar'
import { accesoHistoria, textoHistoria } from '../../../lib/historia'
import { FichaComoLlegar, FichaHorario, FichaPestanas, FichaPorElCamino, FichaQueVeras, FichaTip, type FilaHorario } from './FichaPiezas'

// Mismos límites que el tirador de RouteView.tsx (mapa arriba + panel abajo) — ninguno de los dos
// lados puede llegar a desaparecer del todo.
const MAP_MIN_VH = 15
const MAP_MAX_VH = 75
const DEFAULT_MAP_VH = 32

const MUTED_MARKER_BG = '#E5E7EB'
const MUTED_MARKER_TEXT = '#6B7280'
const ACTIVE_MARKER_BG = 'rgb(var(--accent))'
const ACTIVE_MARKER_TEXT = '#ffffff'

export interface DayStopRef {
  id: string
  name: string
  coordinates: Coordinates
  photoUrl?: string
}

type Tab = 'resumen' | 'tickets' | 'tips'

interface StopDetailSheetProps {
  /** null = cerrado. */
  stop: MockStopDetail | null
  /** La pestaña con la que se abre (la pestañita naranja de la tarjeta abre «Entradas»). */
  initialTab?: 'tickets' | null
  /** Hora de la visita ("HH:MM") si la ficha se abre desde una parada de la ruta: el "abierto /
      cerrado" se calcula a esa hora, no a la del móvil. */
  visitTime?: string | null
  city: string
  /** null = la ficha no se abre desde un día de la ruta (EXPLORAR) — se oculta la píldora "Día X". */
  dayNumber: number | null
  /** Fecha ISO de este día si el viajero fijó fechas exactas — null = "Día X" sin fecha (ver formatShortDateEs). */
  dateIso: string | null
  /** Todas las paradas REALES del día (con coordenadas), en orden — la actual se resalta, el resto se muestra en gris de contexto. */
  dayStops: DayStopRef[]
  /** true si este lugar es una ancla (Paso 1 del pipeline, ver Route.anchorNames) — decide si los tips vienen del caché con búsqueda web (tips_anclas) o del `localTip` simple de describeStopApi.ts. */
  isAnchor: boolean
  onClose: () => void
  /**
   * Cuando se da (incluso `{ description: null, loading: true }`), sustituye por completo la
   * llamada interna a describeStop()/describeStopApi.ts — usado por AddStopScreen.tsx para mostrar
   * la ficha de un POI de Mapbox aún no añadido a la ruta, cuyo contenido viene de la caché
   * PERMANENTE place_content_cache (poiContentApi.ts) en vez del caché solo-en-memoria de
   * describeStopApi.ts. `undefined` (valor por defecto) = comportamiento de siempre, sin cambios.
   */
  externalContent?: { description: StopDescription | null; loading: boolean }
  /** Barra inferior fija con un único CTA — usado por AddStopScreen.tsx para "Añadir a Día {N} →". Ausente (por defecto) en el uso normal de una parada ya en la ruta, que no necesita ningún CTA aquí. */
  footerAction?: { label: string; onClick: () => void }
  /** "Quiero entrar" (decisión del usuario, 2026-09-28): arriba del todo en Resumen, debajo del motivo, solo si la
      parada va por fuera por tiempo (`outsideKind: 'no_cabe'`). */
  onWantInside?: () => void
}

/** Una píldora de las etiquetas pequeñas de debajo del nombre (diseño «Ficha Lugar»): `oscura` (la duración), `verde` (acceso libre / abierto), `roja` (requiere reserva / cerrado) o de contorno (el tipo). */
function Pildora({ tono = 'contorno', datos, children }: { tono?: 'oscura' | 'roja' | 'contorno'; datos: 'horario' | 'tiempo'; children: ReactNode }) {
  const estilo = tono === 'oscura' ? 'bg-text text-bg' : tono === 'roja' ? 'border border-accent-red/30 bg-accent-red/10 text-accent-red' : 'border border-text/[.14] text-text/75'
  return (
    <span data-etiqueta-ficha={datos} className={`flex h-[26px] items-center gap-[5px] rounded-full px-[9px] text-[11.5px] ${tono === 'contorno' ? 'font-medium' : 'font-semibold'} ${estilo}`}>
      {children}
    </span>
  )
}

/** Las líneas de un texto de horario largo (una por renglón), sin las vacías. */
function lineasDe(texto: string | null | undefined): string[] {
  return (texto ?? '')
    .split('\n')
    .map((linea) => linea.trim())
    .filter(Boolean)
}

/**
 * Ficha de una parada — pantalla completa con el mismo patrón mapa arriba + panel deslizable abajo
 * (tirador gris) ya usado en DIAS (ver RouteView.tsx), sustituye al acordeón inline que expandía
 * contenido bajo la tarjeta en la lista. El mapa muestra TODAS las paradas del día (contexto, en
 * gris) con la actual resaltada (color sólido + escala 1.2 vía activeStopId, ver StopsMapView.tsx).
 * "Resumen" es contenido real de Claude bajo demanda (describeStopApi.ts, con cache);
 * "Entradas" son las de los datos del destino (_entradas.json), ver StopEntradasTab.
 * Tanda 6y4: el DISEÑO NUEVO («Ficha Lugar.dc.html»): foto con la cámara en su esquina, nombre en serif, etiquetas pequeñas, pestañas con bolita, y en Resumen el texto, «Qué vas a ver», «Por el camino»,
 * «Horario» y «Cómo llegar»; abajo, la barra «Escuchar historia» (solo en los sitios con historia; de pago). Cada sección sale solo si nuestros datos la traen (las piezas viven en `FichaPiezas.tsx`).
 */
export function StopDetailSheet({ stop, initialTab = null, visitTime = null, city, dayNumber, dateIso, dayStops, isAnchor, onClose, externalContent, footerAction, onWantInside }: StopDetailSheetProps) {
  const [tab, setTab] = useState<Tab>(initialTab ?? 'resumen')
  // Prompt 5: la foto real del lugar y su procedencia. Unsplash exige atribución visible allí donde
  // se muestra la foto; las de Wikipedia no la necesitan, por eso hace falta saber de cuál viene.
  const [photo, setPhoto] = useState<PlacePhoto | null>(null)
  // Tanda 6y4: lo que dicen los datos del destino de este lugar: si cobra por acercarse en vez de vender entrada, el bloque «No necesitas entrada». (La etiqueta de barrio ya no sale en la ficha: 6y10.)
  const infoDestino = useDestinationExcursions(city)
  const sinEntrada = stop ? (infoDestino.sinEntradaPorSitio[stop.name] ?? null) : null
  useEffect(() => {
    // (Un paseo libre sin zona con foto no busca por su nombre: sale el color neutro.)
    if (!stop || stop.isBreak || (stop.isFreeWalk && !stop.photoName)) { setPhoto(null); return }
    // Foto propia fija (el Free Tour, cuando la haya): tal cual, sin buscar.
    if (stop.fixedPhotoUrl) {
      setPhoto({ source: 'wikipedia', thumb: stop.fixedPhotoUrl, small: stop.fixedPhotoUrl, regular: stop.fixedPhotoUrl, blurHash: null, attribution: null })
      return
    }
    let cancelled = false
    fetchPlacePhotoDetail(photoNameOf(stop), city, null, dateIso, Boolean(stop.noOwnPhoto)).then((result) => {
      if (!cancelled) setPhoto(result)
    })
    return () => {
      cancelled = true
    }
  }, [stop?.name, stop?.photoName, stop?.fixedPhotoUrl, stop?.isBreak, city, dateIso])
  const [mapVh, setMapVh] = useState(DEFAULT_MAP_VH)
  const [internalDescription, setInternalDescription] = useState<StopDescription | null>(null)
  const [internalDescLoading, setInternalDescLoading] = useState(false)
  const [descFailed, setDescFailed] = useState(false)
  const [anchorTips, setAnchorTips] = useState<StopTip[]>([])
  const [nearbyTransit, setNearbyTransit] = useState<NearbyTransit>({ metro: [], bus: [] })
  const [directionsOpen, setDirectionsOpen] = useState(false)
  // (Si la ficha de este sitio ya está en la memoria de la sesión, se parte de ella: sale al instante.)
  const [curated, setCurated] = useState<PlaceDetail | null>(() => (stop && !stop.isFreeTour && !stop.isBreak && !stop.isFreeWalk ? fichaEnMemoria(city, stop.name) : null))
  const [curatedResolved, setCuratedResolved] = useState(() => curated !== null)

  // Orden de preferencia del contenido de la ficha: la ficha ampliada escrita a mano → lo que trae
  // quien nos abre (el `description`/`tip` corto del JSON del destino, o el contenido de POI de
  // AddStopScreen) → lo que devuelva Claude bajo demanda. La ficha ampliada va PRIMERA a propósito:
  // es el mismo lugar contado en profundidad (qué ver, horarios por temporada, transporte, secretos)
  // frente a las dos líneas que trae la parada.
  const descripcionDeBase = curated ? toStopDescription(curated) : externalContent ? externalContent.description : internalDescription
  // «Por qué te lo recomendamos»: si el sitio tiene texto NUESTRO en los datos del destino (Roma), sale ese, tal cual y sin IA; si no, el de la IA (que dice por qué vale la pena el sitio, nunca la logística de la ruta).
  const [porQueNuestro, setPorQueNuestro] = useState<string | null>(() => (stop ? porQueRecomendamosDe(catalogoEnMemoria(city), stop.name) : null))
  useEffect(() => {
    if (!stop?.name) return undefined
    let cancelado = false
    fetchDestinationPlaces(city).then((catalogo) => {
      if (!cancelado) setPorQueNuestro(porQueRecomendamosDe(catalogo, stop.name))
    })
    return () => {
      cancelado = true
    }
  }, [stop?.name, city])
  const description = descripcionDeBase && porQueNuestro ? { ...descripcionDeBase, whyRecommended: porQueNuestro } : descripcionDeBase
  const descLoading = stop?.noAiText || stop?.isFreeWalk ? false : !curatedResolved ? true : curated ? false : externalContent ? externalContent.loading : internalDescLoading
  /** Lista de puntos concretos de la ficha curada — la versión de Claude es un párrafo suelto (`whatYoullSee`). */
  const whatToSee = curated?.what_to_see ?? []
  // Extraídos por claridad: lo que las dependencias de los efectos de abajo necesitan saber es
  // "¿hay ficha curada?" y "¿hay contenido externo?", no el objeto entero.
  const hasCurated = curated !== null
  const hasExternalContent = Boolean(externalContent)

  // El Free Tour trae su propio contenido nativo del pipeline (freeTourMeetingPoint/Highlights/Tips,
  // ver FREE TOUR en DAY_BLOCK_SYSTEM_PROMPT) — nunca pide descripción bajo demanda, ni tiene
  // sentido (no es un lugar con web/dirección propia) ni cuesta una llamada extra a Claude.
  // Ficha ampliada escrita a mano (destinos curados, ver placeDetailApi.ts). Se pregunta SIEMPRE
  // primero porque, cuando existe, sustituye a las tres llamadas a Claude que llenan esta pantalla
  // (describeStop + anchorTips + nearbyTransit): mejor contenido, instantáneo y sin coste. Mientras
  // no resuelve (`curatedResolved`), las otras tres esperan — es una petición local de milisegundos
  // y lanzarlas a la vez sería pagar por algo que probablemente se va a descartar.
  useEffect(() => {
    if (!stop) return
    setCurated(null)
    setCuratedResolved(false)
    // El Free Tour es lo único que se salta esto: no es un lugar del destino, es una experiencia con
    // su propio contenido nativo (punto de encuentro, highlights, tips) y nunca va a tener ficha.
    if (stop.isFreeTour || stop.isBreak || stop.isFreeWalk) {
      setCuratedResolved(true)
      return
    }
    let cancelled = false
    fetchPlaceDetail(city, stop.name).then((detail) => {
      if (cancelled) return
      setCurated(detail)
      setCuratedResolved(true)
    })
    return () => {
      cancelled = true
    }
  }, [stop?.id, stop?.name, stop?.isFreeTour, city])

  useEffect(() => {
    if (!stop) return
    setTab(initialTab ?? 'resumen')
    setDescFailed(false)
    // externalContent presente (aunque sea null) = AddStopScreen.tsx ya gestiona su propio fetch
    // (poiContentApi.ts) — esta llamada interna a describeStop() no debe dispararse en absoluto.
    // (`noAiText`: la ficha lleva solo nuestro texto, el «por qué» de la ruta; no se pide nada a la IA.)
    if (externalContent || stop.isFreeTour || stop.isBreak || stop.noAiText || stop.isFreeWalk) {
      setInternalDescription(null)
      setInternalDescLoading(false)
      return
    }
    if (!curatedResolved) return
    if (curated) {
      setInternalDescription(null)
      setInternalDescLoading(false)
      return
    }
    setInternalDescLoading(true)
    let cancelled = false
    describeStop(stop.name, city, stop.category).then((result) => {
      if (cancelled) return
      setInternalDescLoading(false)
      if (result) setInternalDescription(result)
      else setDescFailed(true)
    })
    return () => {
      cancelled = true
    }
  }, [stop?.id, stop?.name, stop?.category, stop?.isFreeTour, city, hasExternalContent, curatedResolved, hasCurated, initialTab])

  // Tips de ancla — llamada aparte (caché en Supabase + búsqueda web, ver anchorTipsApi.ts), solo
  // para lugares obligatorios del destino. Las paradas normales no llaman aquí: su tip (si lo hay)
  // ya viene incluido en `description.localTip`, sin coste ni caché aparte.
  useEffect(() => {
    // Con ficha curada, sus `tips`/`secrets` ya son mejores que lo que devolvería la búsqueda web.
    if (!stop || !isAnchor || !curatedResolved || curated) {
      setAnchorTips([])
      return
    }
    let cancelled = false
    fetchAnchorTips(city, stop.name).then((tips) => {
      if (!cancelled) setAnchorTips(tips)
    })
    return () => {
      cancelled = true
    }
  }, [stop?.id, stop?.name, isAnchor, city, curatedResolved, hasCurated])

  // Transporte público cercano — a diferencia de los tips de ancla, esto se pide para CUALQUIER
  // parada (ver nearbyTransitApi.ts): es un hecho geográfico fijo, cacheado siempre por lugar, nunca
  // por viaje. Metro/bus vacíos = Claude no encontró nada verificable con búsqueda web — la sección
  // simplemente no se muestra, nunca se inventa una parada.
  useEffect(() => {
    if (!stop || !curatedResolved || stop.isBreak) {
      setNearbyTransit({ metro: [], bus: [] })
      return
    }
    // El Free Tour: el transporte de su punto de encuentro (el servidor da la ficha de ese lugar), sin Claude.
    if (stop.isFreeTour) {
      let cancelledTour = false
      fetchPlaceDetail(city, stop.name).then((detail) => {
        if (!cancelledTour) setNearbyTransit(detail ? toNearbyTransit(detail) : { metro: [], bus: [] })
      })
      return () => {
        cancelledTour = true
      }
    }
    // La ficha curada trae las líneas y paradas reales escritas a mano — no hace falta preguntar.
    if (curated) {
      setNearbyTransit(toNearbyTransit(curated))
      return
    }
    let cancelled = false
    fetchNearbyTransit(city, stop.name).then((result) => {
      if (!cancelled) setNearbyTransit(result)
    })
    return () => {
      cancelled = true
    }
  }, [stop?.id, stop?.name, city, curatedResolved, curated])

  const handleDragStart = (event: ReactPointerEvent) => {
    event.preventDefault()
    const startY = event.clientY
    const startVh = mapVh
    const vhUnit = window.innerHeight / 100
    const clampedVh = (clientY: number) => Math.min(MAP_MAX_VH, Math.max(MAP_MIN_VH, startVh + (clientY - startY) / vhUnit))
    const onPointerMove = (moveEvent: PointerEvent) => setMapVh(clampedVh(moveEvent.clientY))
    const onPointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      setMapVh(clampedVh(upEvent.clientY))
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  const markers: StopsMapMarker[] = dayStops.map((dayStop, index) => {
    const isActive = dayStop.id === stop?.id
    return {
      id: dayStop.id,
      name: dayStop.name,
      coordinates: dayStop.coordinates,
      number: index + 1,
      bg: isActive ? ACTIVE_MARKER_BG : MUTED_MARKER_BG,
      text: isActive ? ACTIVE_MARKER_TEXT : MUTED_MARKER_TEXT,
      photoUrl: dayStop.photoUrl,
    }
  })

  const visitMinutes = visitTime && /^\d{1,2}:\d{2}$/.test(visitTime) ? Number(visitTime.split(':')[0]) * 60 + Number(visitTime.split(':')[1]) : null
  // (Un paseo libre es la calle: ni horario ni «Acceso libre».)
  const hoursTag = stop && !stop.isFreeWalk
    ? computeStopHoursTag(stop.hours, visitMinutes ?? new Date().getHours() * 60 + new Date().getMinutes(), visitMinutes !== null)
    : null
  // (Tanda 6y10) La etiqueta del reloj de debajo del nombre: el horario de ESE día (o del mes del viaje, sin fechas) con la misma función que las tarjetas de DÍAS y HOY (horarioDeParada, que lee los datos con el módulo del motor).
  const horarioDe = useHorarioDeParadas(city, dateIso)
  const horario = stop && !stop.isFreeWalk && !stop.isBreak ? horarioDe({ name: stop.name, scheduleText: stop.scheduleText, hours: stop.hours }) : null
  const etiquetaReloj = etiquetaDeHorario(horario)
  // El horario auditado (texto largo con días, épocas y festivos) manda sobre el de la ficha curada.
  const hoursDetail = stop?.hoursCard || description?.hoursDetail || null
  // Solo los lugares con afiliación de tours (ver mockDayDetail.ts) tienen sentido con
  // Civitatis/GetYourGuide — un mercado local con solo entrada libre (afiliacion_disponible:false)
  // no debe mostrar tarjetas de tours inventadas. En real, esto será "la API de afiliación devolvió
  // 0 resultados para este lugar" — mismo efecto: sin tickets, sin pestaña (ver hasTickets abajo).
  // La entrada oficial (precio y condiciones del lugar) va siempre en Tickets, haya o no proveedores.
  const ticketInfo = stop?.ticketInfo ?? []
  const hasEntradas = useStopEntradas(stop) != null
  // La API de consulta (parte 1, con el interruptor encendido): las actividades cerca del sitio, si no tiene entradas escritas a mano ni «No necesitas entrada». Nuestros sitios no traen el número de lugar de Google: se busca por coordenadas.
  const coordenadasDelSitio = dayStops.find((dayStop) => dayStop.id === stop?.id)?.coordinates
  const actividadesCerca = useActividadesCerca(coordenadasDelSitio?.lat, coordenadasDelSitio?.lng, Boolean(stop) && !stop?.isFreeTour && !hasEntradas && sinEntrada == null)
  const hasTickets = hasEntradas || ticketInfo.length > 0 || sinEntrada != null || actividadesCerca.length > 0
  // Free Tour: 3 tips nativos del pipeline (persuasivo/propina/práctico), nunca bajo demanda.
  // Ancla: tips reales con búsqueda web (0-3, práctico/secreto), ver anchorTipsApi.ts. Parada
  // normal: 0-3 tips de describeStopApi.ts (entradas combinadas, acceso gratuito parcial, horarios
  // estratégicos, datos prácticos — ver DESCRIBE_STOP_SYSTEM_PROMPT en server/index.js).
  // Ficha curada (destinos con detalle escrito a mano): sus `tips` + `secrets` mandan sobre todo lo
  // anterior — es el mismo contenido pero verificado, y sin coste ni espera.
  const baseTips: StopTip[] = stop?.isFreeTour
    ? (stop.freeTourTips ?? []).map((texto, index) => ({ tipo: index === 0 ? 'secreto' : 'practico', texto }))
    : curated
      ? toStopTips(curated)
      : isAnchor
        ? anchorTips
        : (description?.tips ?? [])
  // El consejo del aperitivo (un spritz en una terraza) va primero, dentro de la ficha del paseo libre o de la parada que se alarga en su lugar.
  const tips: StopTip[] = stop?.aperitivoTip ? [{ tipo: 'practico', texto: stop.aperitivoTip }, ...baseTips] : baseTips
  const hasTips = tips.length > 0
  // «Escuchar historia» (Tanda 6y5): la historia del sitio, de NUESTRA ficha (campo `historia`). No se escribe en ninguna pestaña: solo se escucha. Sin historia, ni barra ni botón.
  const textoDeLaHistoria = stop && !stop.isFreeTour ? textoHistoria(curated) : ''
  const accesoDeLaHistoria = stop && !stop.isFreeTour ? accesoHistoria(curated) : 'ninguno'

  // Todas las paradas llevan las mismas pestañas, por dentro o por fuera (PROMPT_PENDIENTE E): lo que aún no hay
  // sale con su texto de "todavía no". El Free Tour sigue con las suyas.
  // «Entradas» (PARA_CODE_NAVONA 6) nunca sale en un sitio de acceso libre, salvo que esté en el recorrido de un Free
  // Tour, una visita guiada o una actividad: entonces sí, y en ella va ese tour o esa visita.
  // La pestaña «Entradas» solo sale en sitios con entradas en los datos (o en el recorrido de un Free Tour), o con su «No necesitas entrada» (la tasa de la Fontana de Trevi).
  const showTickets = hasEntradas || Boolean(stop?.inFreeTour) || sinEntrada != null || actividadesCerca.length > 0
  const visibleTabs: Tab[] = stop?.isFreeTour ? ['resumen', ...(hasTickets ? (['tickets'] as const) : []), ...(hasTips ? (['tips'] as const) : [])] : ['resumen', ...(showTickets ? (['tickets'] as const) : []), 'tips']
  // Si el tab guardado quedó en uno que ya no está visible (p.ej. se abrió otro lugar sin ese
  // contenido), cae a "resumen".
  const activeTab: Tab = visibleTabs.includes(tab) ? tab : 'resumen'
  // null = la ficha no se está viendo desde ningún día concreto (EXPLORAR abre lugares del destino
  // que todavía no están en la ruta) — entonces no hay píldora que poner: "Día 1" ahí sería
  // directamente falso.
  const dayPillLabel = dayNumber === null ? null : (dateIso ? formatShortDateEs(dateIso) : `Día ${dayNumber}`)

  // ── «Horario» (diseño nuevo): lo que dicen los datos, repartido en el aviso de ese día, las filas de días y horas, y los párrafos ──
  const filasHorario: FilaHorario[] =
    !stop?.hoursCard && curated?.schedule?.periods?.length
      ? curated.schedule.periods.filter((period) => period?.hours).map((period) => ({ d: period.dates, h: period.hours.replace(/\s*[–-]\s*/, ' – '), l: period.last_entry ? `Última entrada ${period.last_entry}` : null }))
      : []
  const parrafosHorario: string[] = [
    ...(stop?.scheduleText ? [stop.scheduleText, 'Horarios orientativos — verificar antes de visitar'] : []),
    ...(filasHorario.length > 0
      ? [...(curated?.schedule?.closed?.length ? [`Cerrado: ${curated.schedule.closed.join('; ')}`] : []), ...(curated?.schedule?.free_days?.length ? [`Entrada gratuita: ${curated.schedule.free_days.join('; ')}`] : []), ...(curated?.schedule?.notes ? [curated.schedule.notes] : [])]
      : lineasDe(hoursDetail)),
  ]
  const avisoHorario = hoursTag
    ? hoursTag.variant === 'always' && !hoursDetail
      ? { texto: 'Visitable todo el año', tono: 'ok' as const }
      : hoursTag.variant === 'always'
        ? null
        : { texto: hoursTag.label, tono: hoursTag.variant === 'closed' ? ('cierra' as const) : ('ok' as const) }
    : null
  const pieHorario = !(hoursTag?.variant === 'always' && !hoursDetail) ? `Los horarios pueden cambiar según temporada. Consulta la web oficial antes de tu visita${description?.officialWebsite ? ' (enlace más abajo).' : '.'}` : null
  const hayHorario = Boolean(stop && !stop.isFreeWalk && (hoursDetail || hoursTag || stop.hoursWarning || stop.seasonNotice || stop.closedNotice))
  // El texto de debajo del nombre y el de «Qué vas a ver» (la ficha curada trae una lista; la de Claude, un párrafo).
  const queVerasLista = whatToSee.length > 0 ? whatToSee : description?.whatYoullSee ? [description.whatYoullSee] : []
  // La barra de «Escuchar» (de pago) ocupa el pie de la ficha: se deja sitio para que no tape el final del contenido.
  const conBarraEscuchar = accesoDeLaHistoria !== 'ninguno'

  return (
    <AnimatePresence>
      {stop && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg">
          <div className="relative shrink-0" style={{ height: `${mapVh}vh` }}>
            <StopsMapView markers={markers} activeStopId={stop.id} />

            <button
              type="button"
              onClick={onClose}
              aria-label="Volver"
              title="Volver"
              className="absolute left-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-bg-card text-text shadow-[0_8px_18px_-10px_rgba(28,34,48,.5)] transition-colors hover:bg-bg-hover"
            >
              <Icono nombre="flecha" size={18} grosor={2} className="rotate-180" />
            </button>

            {dayPillLabel && (
              <span className="absolute right-4 top-4 z-10 flex h-8 items-center rounded-full bg-bg-card px-[13px] text-[12.5px] font-semibold text-text shadow-[0_8px_18px_-10px_rgba(28,34,48,.5)]">
                {dayPillLabel}
              </span>
            )}
          </div>

          {/* El panel sube sobre el mapa con las esquinas redondas (diseño «Ficha Lugar»); el tirador sigue moviéndolo. (Tanda 6y7) El fondo es del PANEL entero, tirador incluido: antes el tirador
              (20 px) subía 28 px sobre el mapa y el mapa quedaba pintado 8 px por debajo de él, entre el tirador y el título. */}
          <div className="relative z-[5] -mt-7 flex min-h-0 flex-1 flex-col rounded-t-[28px] bg-bg shadow-[0_-12px_30px_-14px_rgba(28,34,48,.4)]" data-ficha-panel>
            <div onPointerDown={handleDragStart} className="flex shrink-0 cursor-row-resize touch-none items-center justify-center pb-1 pt-3">
              <span className="h-1 w-[42px] rounded bg-text/20" />
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className={`mx-auto flex w-full max-w-lg flex-col gap-4 px-4 pt-3 ${conBarraEscuchar ? 'pb-[110px]' : 'pb-8'}`}>
                {/* Cabecera: la foto con la cámara en su esquina, el nombre y las etiquetas pequeñas. */}
                <div className="flex items-start gap-3.5 px-0.5">
                  <div className="relative h-[84px] w-[84px] flex-none">
                    <span
                      className="absolute inset-0 overflow-hidden rounded-[20px] bg-bg-hover [clip-path:polygon(0_0,100%_0,100%_calc(100%-18px),calc(100%-22px)_100%,0_100%)]"
                      style={{ backgroundImage: 'repeating-linear-gradient(135deg, rgb(var(--bg-hover)) 0 8px, rgb(var(--border) / .55) 8px 16px)' }}
                    >
                      {(photo?.small ?? stop.photoUrl) && <img src={photo?.small ?? stop.photoUrl} alt="" className="h-full w-full object-cover" />}
                    </span>
                    {/* Sin foto (la del servidor es «none» o está rechazada): el recuadro neutro, nunca una imagen rota ni vacía. */}
                    {dayNumber !== null && !footerAction && (
                      <span className="absolute -bottom-1.5 -right-1.5 z-[2] [&_[role=alert]]:absolute [&_[role=alert]]:left-[-70px] [&_[role=alert]]:top-[calc(100%+4px)] [&_[role=alert]]:z-10 [&_[role=alert]]:w-[200px] [&_[role=alert]]:rounded-lg [&_[role=alert]]:bg-bg-card [&_[role=alert]]:p-1.5 [&_[role=alert]]:shadow">
                        <BotonFotoParada stopName={stop.name} dayNumber={dayNumber} esquina />
                      </span>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-[9px] pt-0.5">
                    <h1 className="flex items-start gap-1.5 font-display text-[27px] leading-[1.04] text-text [text-wrap:balance]">
                      {stop.isFreeTour && <FreeTourIcon className="mt-1.5 text-accent" />}
                      {stop.isNightExperience && <MoonIcon className="mt-1.5 text-[#5B6BC0]" />}
                      <span>{stop.nightViewTitle ?? displayStopName(stop.name)}</span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-[5px]">
                      {/* (Tanda 6y10) Debajo del nombre, SOLO dos etiquetas: el reloj con el horario de ese día (sin texto; «Cerrado» si ese día no abre) y el reloj de arena con el tiempo que recomendamos.
                          El tipo («Monumento»), la reserva, el acceso libre y el barrio no salen aquí: viven fuera de la ficha (listas y tarjetas). */}
                      {etiquetaReloj && (
                        <Pildora tono={horario?.cerrado ? 'roja' : 'contorno'} datos="horario">
                          <Icono nombre="reloj" size={12} grosor={2} />
                          {etiquetaReloj}
                        </Pildora>
                      )}
                      <Pildora tono="oscura" datos="tiempo">
                        <Icono nombre="arena" size={12} grosor={2} />
                        {formatDuration(stop.durationMinutes)}
                      </Pildora>
                    </div>
                    {/* El corazón de «me gusta»: la misma cuenta que el de EXPLORAR (src/store/useMeGustaStore.ts). Solo en los sitios del catálogo del destino. */}
                    {!stop.isFreeTour && !stop.isBreak && !stop.isFreeWalk && <MeGusta destino={city} nombre={stop.name} variante="ficha" />}
                  </div>
                </div>
  
                {/* Prompt 5: atribución de Unsplash. Obligatoria donde se muestra la foto, con los UTM
                    que exigen sus condiciones. Las de Wikipedia llevan autor y licencia (Tanda 6z6f) solo si hay crédito completo (las de
                    dominio público, nada) y las nuestras (`propia`) no la llevan nunca (Tanda 6z6e). Una sola pieza, `FotoCredito` (Tanda 6y2),
                    la misma que usa la esquina de las fotos grandes. */}
                <FotoCredito photo={photo} className="px-1 text-caption text-text-muted" />
  
                <FichaPestanas<Tab>
                  pestanas={([{ id: 'resumen', label: 'Resumen' }, { id: 'tickets', label: 'Entradas' }, { id: 'tips', label: 'Tips' }] as const).filter((item) => visibleTabs.includes(item.id)).map((item) => ({ id: item.id as Tab, label: item.label }))}
                  activa={activeTab}
                  onPick={setTab}
                />
  
                {activeTab === 'resumen' && stop.isFreeTour && (
                  <div className="flex flex-col gap-[18px]">
                    <p className="px-1 text-[14px] leading-[1.6] text-text/70 [text-wrap:pretty]">{stop.description}</p>
                    {/* Dónde acaba el tour (PROMPT_UI_REPASO_2, 5: ya no va en la tarjeta). */}
                    {stop.freeTourEnd && (
                      <p className="flex items-center gap-2 rounded-2xl bg-bg-hover px-3 py-2.5 text-small text-text">
                        <Icono nombre="mapa" className="h-4 w-4 shrink-0" />
                        <span>{stop.freeTourEnd}</span>
                      </p>
                    )}
  
                    {stop.freeTourMeetingPoint && (
                      <div className="rounded-[22px] border border-text/[.07] bg-bg-card p-3.5">
                        <h3 className="flex items-center gap-2.5 font-display text-[21px] leading-none text-text">
                          <Icono nombre="mapa" size={18} />
                          Punto de encuentro
                        </h3>
                        <p className="mt-2 text-[14px] leading-[1.5] text-text">{stop.freeTourMeetingPoint}</p>
                      </div>
                    )}
  
                    {stop.freeTourHighlights && stop.freeTourHighlights.length > 0 && (
                      <div className="space-y-1.5">
                        <FichaQueVeras puntos={stop.freeTourHighlights} titulo="Lugares que verás durante el tour" />
                        <p className="px-1 text-caption italic text-text-muted">Volverás a visitar algunos de estos lugares con más calma en los próximos días de tu ruta.</p>
                      </div>
                    )}
  
                    <div className="rounded-[22px] border border-text/[.07] bg-bg-card p-3.5">
                      <h3 className="flex items-center gap-2.5 font-display text-[21px] leading-none text-text">
                        <Icono nombre="reloj" size={18} />
                        Horario
                      </h3>
                      <p className="mt-2 text-[13px] leading-[1.55] text-text/72">
                        Los free tours suelen tener salidas por la mañana (10:00-10:30) y por la tarde (16:00-17:00). Consulta la disponibilidad al
                        reservar.
                      </p>
                    </div>
  
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(`free tour gratis ${city} reserva`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-[46px] w-full items-center justify-center gap-2 rounded-full bg-accent text-body font-semibold text-white transition-colors hover:bg-accent-hover"
                    >
                      Reservar
                      <Icono nombre="flecha" size={15} grosor={2} />
                    </a>
                  </div>
                )}
  
                {activeTab === 'resumen' && !stop.isFreeTour && (
                  <div className="flex flex-col gap-[18px]">
                    {/* La línea de la ficha (Navidad, o el Ángelus de los domingos): arriba, destacada y con su icono. */}
                    {stop.seasonLine && (
                      <p className="flex items-start gap-2.5 rounded-2xl border border-accent/25 bg-accent-soft px-3 py-2.5 text-small leading-relaxed text-text">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg-card text-accent">
                          <DateNoticeSmallIcon icon={stop.seasonLineIcon === 'religioso' ? 'religioso' : 'navidad'} />
                        </span>
                        <span>{stop.seasonLine}</span>
                      </p>
                    )}
                    {/* El paseo nocturno al que pertenece (PROMPT_UI_REPASO_2, 5: ya no va en la tarjeta). */}
                    {stop.isNightExperience && (
                      <p className="flex items-center gap-2 rounded-2xl bg-bg-hover px-3 py-2.5 text-small text-text">
                        <span className="font-medium">{stop.nightWalkName && stop.nightWalkName !== 'Paseo nocturno' ? `Paseo nocturno: ${stop.nightWalkName}` : stop.nightWalkName ? 'Paseo nocturno' : 'Experiencia nocturna'}</span>
                      </p>
                    )}
                    {/* Por dentro: con su tiempo (PROMPT_UI_REPASO 11: ya no va en la tarjeta). */}
                    {stop.visitMode === 'dentro' && (
                      <p className="flex items-center gap-2 rounded-2xl bg-bg-hover px-3 py-2.5 text-small text-text">
                        <span className="font-medium">Por dentro</span> · {stop.durationMinutes} min
                      </p>
                    )}
                    {/* Por fuera: el motivo, en una línea (cerrado, ya cerrado o para llegar a todo lo del día). */}
                    {stop.visitMode === 'fuera' && stop.outsideReason && (
                      <div className="space-y-2">
                        <p className={`flex items-center gap-2 rounded-2xl bg-bg-hover px-3 py-2.5 text-small ${stop.outsideKind === 'cerrado' || stop.outsideKind === 'ya_cerrado' || stop.outsideKind === 'no_abre' ? 'text-accent-red' : 'text-text'}`}>
                          <Icono nombre="camara" className="h-4 w-4 shrink-0 text-text-soft" />
                          <span>
                            <span className="font-medium">Por fuera</span>
                            {/* (Lo escrito «por fuera» a propósito lleva su texto de la ficha, el mismo del «por qué» de abajo: no se repite.) */}
                            {stop.outsideKind === 'a_proposito' && withoutLeadingEmoji(stop.why ?? '') === stop.outsideReason ? null : <> · {stop.outsideReason}</>}
                          </span>
                        </p>
                        {stop.outsideKind === 'no_cabe' && onWantInside && (
                          <button
                            type="button"
                            onClick={onWantInside}
                            className="h-10 rounded-full bg-text px-5 text-[14px] font-medium text-bg transition-transform active:scale-[.98]"
                          >
                            Quiero entrar
                          </button>
                        )}
                      </div>
                    )}
                    {/* El "Por qué aquí" de la ruta, el texto grande de arriba (la tarjeta del día ya no lleva texto). */}
                    {(stop.isRevisit && stop.revisitReason) || stop.why ? (
                      <p className="px-1 font-display text-[22px] leading-[1.3] text-text [text-wrap:pretty]">{stop.isRevisit && stop.revisitReason ? stop.revisitReason : withoutLeadingEmoji(stop.why ?? '')}</p>
                    ) : null}
                    {/* Sin ficha ampliada ni texto de la IA: el texto del lugar, el nuestro, si no es ya el «por qué». */}
                    {stop.noAiText && stop.placeText && stop.placeText !== stop.why && !(stop.isRevisit && stop.revisitReason) && (
                      <p className="px-1 text-[14px] leading-[1.6] text-text/70 [text-wrap:pretty]">{stop.placeText}</p>
                    )}
                    {descLoading ? (
                      <p className="flex items-center gap-2 px-1 text-small italic text-text-soft">
                        <Spinner className="text-accent" />
                        Preparando información de {stop.name}...
                      </p>
                    ) : description ? (
                      <>
                        {description.description && <p className="px-1 text-[14px] leading-[1.6] text-text/70 [text-wrap:pretty]">{description.description}</p>}
                        {/* La ficha curada trae puntos concretos (lista); la de Claude, un párrafo. */}
                        <FichaQueVeras puntos={queVerasLista} numerar={whatToSee.length > 0} />
                        {description.whyRecommended && (
                          <div className="flex flex-col gap-1.5">
                            <span className="px-1 font-mono text-[10px] font-semibold uppercase tracking-[.16em] text-text/55">Por qué te lo recomendamos</span>
                            <p className="px-1 text-[14px] leading-[1.6] text-text/70 [text-wrap:pretty]">{description.whyRecommended}</p>
                          </div>
                        )}
                      </>
                    ) : descFailed ? (
                      <p className="px-1 text-[14px] leading-[1.6] text-text/70">{stop.description}</p>
                    ) : null}
  
                    {/* «Por el camino»: calles y recomendaciones de paso que ya no son parada (Via Margutta, Via del Babuino, Venchi). */}
                    <FichaPorElCamino textos={(stop.porElCamino ?? []).map((item) => item.texto)} />
  
                    {/* Horario con matices — solo si hay algo real que decir más allá del rango simple
                        de la cabecera (hoursTag); el disclaimer + link es SIEMPRE el mismo texto fijo,
                        nunca redactado por Claude, para garantizar que aparece siempre igual. */}
                    {hayHorario && (
                      <FichaHorario
                        aviso={avisoHorario}
                        avisosRojos={[stop.hoursWarning, stop.seasonNotice].filter((texto): texto is string => Boolean(texto))}
                        avisoGris={stop.closedNotice ?? null}
                        filas={filasHorario}
                        parrafos={parrafosHorario}
                        pie={pieHorario}
                      />
                    )}
  
                    <FichaComoLlegar direccion={description?.address ?? null} transporte={nearbyTransit} web={description?.officialWebsite ?? null} onComoLlegar={description?.address ? () => setDirectionsOpen(true) : null} />
                  </div>
                )}
  
                {activeTab === 'tickets' && (
                  <div className="space-y-3">
                    {/* El Free Tour que recorre este sitio. */}
                    {stop.inFreeTour && (
                      <div className="rounded-[20px] border border-text/[.07] bg-bg-card p-3.5">
                        <p className="font-display text-[19px] leading-[1.1] text-text">{stop.inFreeTour.name}</p>
                        <p className="mt-1.5 text-[13px] leading-[1.5] text-text/72">
                          Este sitio forma parte de su recorrido
                          {stop.inFreeTour.durationMinutes ? `, de ${formatDuration(stop.inFreeTour.durationMinutes)}` : ''}
                          {stop.inFreeTour.meetingPoint ? `. Sale de ${stop.inFreeTour.meetingPoint}` : ''}.
                        </p>
                        {stop.inFreeTour.url && (
                          <a href={stop.inFreeTour.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-small font-semibold text-accent underline">
                            Ver el Free Tour
                          </a>
                        )}
                      </div>
                    )}
                    {/* Las entradas de los datos (Tanda 6n): una debajo de otra, con [Reservar] y «¿Ya la tienes? Añádela». Un sitio con tasa en vez de entrada lleva «No necesitas entrada» (Tanda 6y4). */}
                    {(hasEntradas || sinEntrada) && <StopEntradasTab stop={stop} sinEntrada={sinEntrada} />}
                    {actividadesCerca.length > 0 && <ActividadesDelSitio lista={actividadesCerca} />}
                    {/* El Free Tour de la ruta: su ticketInfo, como hasta ahora. */}
                    {stop.isFreeTour && ticketInfo.length > 0 && (
                      <div className="rounded-[20px] border border-text/[.07] bg-bg-card p-3.5">
                        <p className="font-display text-[19px] leading-[1.1] text-text">Entrada</p>
                        <ul className="mt-1.5 space-y-0.5">
                          {ticketInfo.map((line) => (
                            <li key={line} className="text-[13px] leading-[1.5] text-text/72">
                              {line}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
  
                {activeTab === 'tips' && (
                  <div className="space-y-2">
                    {tips.length === 0 && <p className="px-1 text-small text-text-soft">{descLoading ? 'Preparando los consejos…' : 'Todavía no tenemos consejos para este lugar.'}</p>}
                    {tips.map((tip, index) => (
                      <FichaTip key={index} tipo={tip.tipo === 'practico' ? 'practico' : 'secreto'} texto={tip.texto} />
                    ))}
                  </div>
                )}
              </div>
            </div>
            </div>

          {/* «Escuchar historia» (la lectura en voz alta de la 6z6): la barra oscura fija de abajo, como en el diseño. De pago (en la gratis, con candado), salvo la historia que la ficha marca gratis. */}
          {conBarraEscuchar && <Escuchar barra libre={curated?.historia_gratis === true} abajo={Boolean(footerAction)} texto={textoDeLaHistoria} clave={stop.id} sitio={{ destino: city, nombre: stop.name }} />}

          {footerAction && (
            <div className="shrink-0 border-t border-border bg-bg-card px-4 py-3">
              <button
                type="button"
                onClick={footerAction.onClick}
                className="w-full rounded-xl bg-accent py-2.5 text-body font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                {footerAction.label}
              </button>
            </div>
          )}

          <HowToGetThereSheet open={directionsOpen} onClose={() => setDirectionsOpen(false)} destination={description?.address ?? stop.name} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
