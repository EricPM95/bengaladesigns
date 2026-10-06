import { create } from 'zustand'
import { dayCountryCode } from '../lib/flagColors'
import type { MockHotelResult } from '../lib/mockAffiliateData'
import type { EsimStatus, GeneralBooking, TransportBooking } from '../lib/readiness'
import { dayOfReservation, isDayPinned, newCampaignCode, placeReservedEntrance, reapplyReservations, unpinReservedStops, type Reservation, type SaleMatch } from '../lib/bookings'
import type {
  ChosenRestaurant,
  AccommodationMode,
  AppScreen,
  DayType,
  Budget,
  BudgetItem,
  DateRange,
  DayPlan,
  DidntMakeCutItem,
  DestinationArchetype,
  Excursion,
  ExperienceId,
  Place,
  PlaceCandidate,
  QuestionnaireAnswers,
  Route,
  RouteMode,
  Stop,
  TransportOption,
  TransportSegmentAlternative,
  TravelMode,
  VehicleOwnership,
  VehicleType,
  WishlistItem,
} from '../lib/types'
import type { TripPayload } from '../lib/tripPersistence'
import { triggerBudgetFly } from '../lib/budgetFlyBus'
import { minutesToTime, parseTimeToMinutes, roundToNearestQuarterHour, roundUpToQuarterHour } from '../lib/time'
import { optimizeDayWithRealTransport as computeOptimizedDay, overflowToDidntMakeCut } from '../lib/stopScheduling'
import { fitMealsToStops } from '../lib/arrivalReturn'
import { spareInsertIndex } from '../lib/spareStops'
import { buildDestinationSegments } from '../lib/destinationSegments'
import { getTodayTripContext } from '../lib/todayMode'
import { daysBetweenInclusive } from '../lib/dateRange'
import { seasonOfMonth } from '../lib/season'
import { addDaysToIso } from '../lib/dateRange'
import {
  addFreeDay as addFreeDayTo,
  placeExcursionIn,
  isFreeDay,
  moveDay,
  removeFreeDay as removeFreeDayFrom,
  removeAnyDay,
  withDayColors,
  originalRouteOf,
  renameDay as renameDayIn,
  suggestedTimeFor,
  timeForStopAfter,
  userAddedDays,
  withMealRestaurant,
  withStopAt,
  withUserDaysBack,
} from '../lib/freeDays'

/** hotel salvo que el vehículo elegido sea camper/autocaravana, que bloquea hoteles por completo. */
function deriveAccommodationMode(vehicleType: VehicleType | null): AccommodationMode {
  return vehicleType === 'camper' ? 'camping' : 'hotel'
}

const recalculateBudgetTotal = (budget: Budget): Budget => ({
  ...budget,
  total: budget.items.reduce((sum, item) => sum + item.amount, 0),
})

/** Añade/reemplaza (por `id`) o quita (item null) un ítem de presupuesto ligado a una reserva de RESERVAS — mismo `id` en ambas llamadas para poder sustituirlo/borrarlo. */
function linkBudgetItem(budget: Budget, id: string, item: Omit<BudgetItem, 'id'> | null): Budget {
  const withoutPrevious = budget.items.filter((existing) => existing.id !== id)
  return recalculateBudgetTotal({ ...budget, items: item ? [...withoutPrevious, { ...item, id }] : withoutPrevious })
}

/**
 * LA REGLA (decisión de producto, no un detalle de implementación): la ruta que entregamos está
 * planificada al detalle — horarios de apertura, orden geográfico para no perder tiempo, trayecto
 * real entre cada dos paradas. En cuanto el viajero la modifica a mano, dejamos de planificar: es su
 * ruta. NO reordenamos, NO recolocamos y NO recalculamos la hora de ninguna parada que él no haya
 * tocado. Lo único que seguimos poniendo es **el tiempo que se tarda de un lugar al siguiente**,
 * recalculado para el par que acaba de quedar contiguo (ver `refinedConnectors` en
 * DayDetailPanel.tsx, que lo pide a Mapbox en cuanto cambia la lista de paradas).
 *
 * Por eso aquí ya no hay ningún "retimeStops" global. Quitar una parada no adelanta el resto del
 * día (bug real: al borrar "Paseo por Trastevere" —2h— la tarde entera se iba hacia atrás, Bocca
 * della Verità de 16:35 a 14:00, y la experiencia nocturna se colaba delante de la cena). Añadir una
 * tampoco empuja a las de después: lo único que calculamos es la hora de la parada NUEVA, que no
 * tenía ninguna.
 */

/**
 * Ninguna hora se pisa (revisión del 2026-09-24): si una parada empieza antes de que acabe la
 * anterior (más su paseo, si se conoce), se EMPUJA hacia delante al cuarto de hora siguiente; nunca
 * se adelanta nada. Añadir o mover una parada solo ponía hora a la que cambiaba, y la de detrás se
 * quedaba donde estaba: un Ara Pacis de 45 min a las 15:00 con Via Condotti a las 15:15. Empujar
 * hacia delante no reabre el bug antiguo (quitar una parada adelantaba la tarde entera): aquí nada
 * vuelve hacia atrás. Las experiencias nocturnas no empujan ni se empujan: van después de cenar.
 */
function pushOverlapsForward(stops: Stop[]): Stop[] {
  const result: Stop[] = []
  for (const stop of stops) {
    const previous = [...result].reverse().find((candidate) => !candidate.isNightExperience)
    if (!previous || stop.isNightExperience) {
      result.push(stop)
      continue
    }
    const previousStart = parseTimeToMinutes(previous.time)
    const start = parseTimeToMinutes(stop.time)
    if (Number.isNaN(previousStart) || Number.isNaN(start)) {
      result.push(stop)
      continue
    }
    const earliest = previousStart + previous.durationMinutes + (previous.walkingTimeToNextMinutes ?? 0)
    result.push(start >= earliest ? stop : { ...stop, time: minutesToTime(roundUpToQuarterHour(earliest)) })
  }
  return result
}

/**
 * Quitar una parada (bug del 2026-09-26): la de antes y la de después quedan juntas y el tramo entre
 * ellas es otro. Se quita la parada y se marca ese tramo como pendiente (`nextLegPending`); nada más
 * cambia de hora. El tramo nuevo lo pide DayDetailPanel a Mapbox y lo guarda con `setLegToNext`.
 */
function withoutStop(stops: Stop[], stopId: string): Stop[] {
  const index = stops.findIndex((stop) => stop.id === stopId)
  if (index < 0) return stops
  const rest = stops.filter((stop) => stop.id !== stopId)
  if (index === 0) return rest
  const previous = rest[index - 1]
  const hasNext = index < rest.length
  rest[index - 1] = { ...previous, walkingTimeToNextMinutes: undefined, nextStopNote: undefined, nextLegPending: hasNext || undefined }
  return rest
}

/**
 * El tramo recalculado mueve la siguiente parada si ya no se llega a su hora (y detrás de ella, solo
 * las que entonces se pisen). Si se llega antes, las horas se quedan (ver LA REGLA), salvo un hueco de
 * más de 45 min: entonces se adelanta la siguiente, y solo ella.
 */
function withLegToNext(stops: Stop[], stopId: string, minutes: number): Stop[] {
  // Retocar la ruta (decisión del usuario, 2026-09-28): solo se recalcula el paseo; ninguna otra hora se mueve. Si algo
  // se pisa, se ve, y el viajero cambia la hora él mismo.
  const index = stops.findIndex((stop) => stop.id === stopId)
  if (index < 0) return stops
  const updated = [...stops]
  updated[index] = { ...stops[index], walkingTimeToNextMinutes: minutes, nextLegPending: undefined }
  return updated
}

/**
 * Reordenar ("Mover antes"/"Mover después") es el único caso en que las horas cambian de dueño: las
 * horas del día son sus huecos, y lo que el viajero mueve es QUÉ visita en cada hueco. Así el día
 * sigue leyéndose en orden en vez de quedar con las horas desordenadas. Tampoco aquí se planifica
 * nada nuevo: son exactamente las mismas horas que ya tenía el día, solo que reasignadas.
 */
function reassignTimesByPosition(previousOrder: Stop[], nextOrder: Stop[]): Stop[] {
  return nextOrder.map((stop, index) => (previousOrder[index] ? { ...stop, time: previousOrder[index].time } : stop))
}

/**
 * Planificación completa desde cero — SOLO para "Regenerar este día", que no es una edición del
 * viajero sino una ruta nueva nuestra, así que ahí sí volvemos a decidir las horas. La primera
 * parada conserva la suya; de la segunda en adelante, acumulado + colchón, redondeado al cuarto de
 * hora MÁS CERCANO como el resto del horario de la app (ver roundToNearestQuarterHour en time.ts /
 * stopScheduling.ts) — nunca "10:27". El redondeo se propaga desde la hora YA redondeada, así que no
 * acumula error de arrastre.
 */
function retimeStops(stops: Stop[]): Stop[] {
  if (stops.length === 0) return stops
  let cursor = parseTimeToMinutes(stops[0].time)
  return stops.map((stop, index) => {
    const startMinutes = index === 0 ? cursor : roundToNearestQuarterHour(cursor)
    cursor = startMinutes + stop.durationMinutes + (stop.walkingTimeToNextMinutes ?? 15)
    return { ...stop, time: minutesToTime(startMinutes) }
  })
}

interface RouteStoreState {
  screen: AppScreen
  destination: string | null
  destinationPlace: Place | null
  /**
   * Arquetipo del destino clasificado por Claude — null mientras se resuelve, si la
   * clasificación falló, O mientras se espera la respuesta del usuario a la pregunta de
   * desambiguación (ver `archetype_ambiguous`).
   */
  archetype: DestinationArchetype | null
  /** true si el destino es una región/isla/zona geográfica, false si es una ciudad o pueblo concreto. */
  is_region: boolean | null
  /**
   * true cuando Claude no pudo decidir con seguridad entre roadtrip_exclusivo y
   * base_y_excursiones — la app debe preguntarle al usuario en vez de usar el archetype
   * devuelto (que en ese caso es solo la mejor estimación de Claude, se ignora).
   */
  archetype_ambiguous: boolean
  /**
   * true cuando la llamada de clasificación de destino falló (red, servidor, IA sin crédito,
   * etc.) — distingue "todavía cargando" (spinner) de "falló de verdad" (mensaje + reintentar),
   * que antes eran indistinguibles porque ambos dejaban `archetype: null`.
   */
  archetype_classification_failed: boolean
  /**
   * Solo relevante cuando archetype es urbano_clasico: true si el transporte público de la
   * ciudad es insuficiente o poco práctico para un visitante (ej. Los Ángeles, Phoenix). Activa
   * la pregunta de alquiler de coche en su Fase 2. false en cualquier otro caso.
   */
  requiere_coche: boolean
  /**
   * Solo relevante cuando archetype es multidestino_tren_o_vuelo: nombre del pase de transporte
   * dominante del destino (ej. "JR Pass"), o null si no hay ninguno lo bastante dominante como
   * para asumirlo por defecto (ej. Corea del Sur, Taiwán, EE.UU.).
   */
  pase_dominante: string | null
  /**
   * Solo relevante cuando archetype es base_y_excursiones: true si el transporte público/
   * organizado entre puntos de interés es limitado y un vehículo propio mejora sustancialmente la
   * experiencia (ej. Tenerife, Azores) — decide el color ámbar/gris de "Vehículo de alquiler" en
   * RESERVAS (ver readiness.ts). false en cualquier otro caso.
   */
  vehiculo_altamente_recomendado: boolean
  /**
   * Respuesta del viajero a "¿Vas a viajar con {pase_dominante}?" — null mientras no se ha
   * preguntado (o no aplica, porque pase_dominante es null). true/false una vez respondida, para
   * todo el viaje (no se vuelve a preguntar tramo a tramo).
   */
  travel_pass_confirmed: boolean | null

  /** Opción de transporte de llegada elegida (o asumida) — construida en el frontend, no por Claude. */
  transport_option: TransportOption | null
  /** Vehículo en destino. Para roadtrip_exclusivo es siempre obligatorio (nunca queda en null una vez resuelto). */
  vehicle_type: VehicleType | null
  /** Propio o de alquiler. */
  vehicle_ownership: VehicleOwnership | null
  /** Derivado automáticamente de vehicle_type: camper bloquea hoteles, todo lo demás los permite. */
  accommodation_mode: AccommodationMode | null
  /**
   * true cuando la pregunta del vehículo (Fase 2) llegó a un estado terminal — con vehículo
   * (vehicle_type no nulo) o explícitamente sin él. Necesario porque "sin vehículo" también deja
   * vehicle_type/vehicle_ownership en null, indistinguible de "todavía sin responder" si no
   * fuera por este flag. Solo lo usa base_y_excursiones (en roadtrip_exclusivo el vehículo
   * siempre es obligatorio, así que vehicle_type no nulo ya basta).
   */
  vehicle_resolved: boolean
  /** Solo aplica a base_y_excursiones. */
  travel_mode: TravelMode | null
  /**
   * Aptitud para camper/autocaravana ya conocida de antemano (ej. lista curada de rutas
   * panorámicas — ver RouteSearch/curatedRoutes.ts), que sustituye a la pregunta que
   * normalmente le haría Claude en /api/transport-feasibility. null = desconocido, se pregunta
   * con normalidad como cualquier otro destino.
   */
  known_camper_access: boolean | null
  /**
   * Solo relevante para AVENTURA EN TRIBU/CON MI CREW con un vehículo Coche ya elegido y grupo de
   * más de 5 personas (ver companionFlow.ts): true una vez el usuario elige explícitamente
   * "Varios coches" en el aviso de capacidad bloqueante. Los avisos de camper (5-8 y 9+) son solo
   * informativos y nunca necesitan este flag. Se reinicia a false en cualquier cambio de vehículo,
   * para que un vehículo nuevo siempre vuelva a comprobar la capacidad desde cero.
   */
  companion_capacity_acknowledged: boolean

  /** Experiencias (banco de 18) que Claude filtró como relevantes para este destino — ver /api/suggest-experiences. Vacío mientras no se ha resuelto. */
  suggested_experiences: ExperienceId[]
  /** true mientras se espera la respuesta de /api/suggest-experiences — distingue "cargando" de "falló", mismo patrón que archetype_classification_failed. */
  suggested_experiences_loading: boolean
  suggested_experiences_failed: boolean

  /** true una vez el usuario pulsa "Ver lugares" en el selector de experiencias — dispara /api/suggest-places y revela el paso "Elige lugares". Distinto de las experiencias en sí: este paso necesita una llamada real a Claude, así que no se dispara solo con marcar checkboxes. */
  places_step_started: boolean
  /** true una vez el usuario confirma "fechas" (pantalla "days") — punto en el que se dispara la precarga en segundo plano del pool de lugares (ver suggestPlacesInBackground.ts), no antes. Guarda contra la carrera con la sugerencia de experiencias de Claude: si esta llega DESPUÉS de confirmar fechas, dispara la precarga ella misma al resolver (ver suggestExperiencesInBackground.ts). */
  dates_confirmed: boolean
  /** Lugares concretos sugeridos por Claude para el destino — ver /api/suggest-places. Vacío mientras no se ha resuelto. */
  suggested_places: PlaceCandidate[]
  suggested_places_loading: boolean
  suggested_places_failed: boolean
  /** Con qué conjunto de experiencias se pidió el `suggested_places` actual — permite precargar en cuanto se conoce el destino (ver suggestPlacesInBackground.ts) y detectar en "Ver lugares" si ese resultado ya sirve o si el viajero cambió su selección y hace falta pedirlo de nuevo. */
  suggested_places_source_ids: ExperienceId[]
  /** ids de `suggested_places` que el viajero marcó — entran en la generación como anclas de alta prioridad (ver must_include_places). */
  selected_place_ids: string[]
  /** Nombres marcados a mano en el "Pool de lugares" del último paso del cuestionario, SOLO para destinos curados (ver CuratedPlacesPool.tsx) — el pool no tiene ids sintéticos como PlaceCandidate, usa el propio nombre como clave. Misma función que selected_place_ids pero para ese otro camino (curado vs Claude-driven), ambos se unen en must_include_places al generar (ver App.tsx). */
  selected_curated_place_names: string[]

  answers: Partial<QuestionnaireAnswers>
  route: Route | null
  activeDayId: string | null
  mode: RouteMode
  darkMode: boolean
  intensity: number
  panelSplit: number
  /** Alojamiento mock elegido por estancia (pestaña DIAS/RESERVAS) — clave: id del primer día de la estancia (ver buildDestinationSegments). */
  accommodationSelections: Record<string, MockHotelResult>
  /** RESERVAS — clave: id del día de traslado (ver computeDayTravelInfo), vale tanto para tramos de llegada como el de vuelta. */
  transportBookings: Record<string, TransportBooking>
  insuranceBooking: GeneralBooking | null
  n26Added: boolean
  rentalVehicleBooking: GeneralBooking | null
  /** RESERVAS — clave: código de país en minúsculas, compartida entre todos los destinos de ese país. */
  esimSelections: Record<string, EsimStatus>
  /** Entradas y excursiones reservadas: fijadas, con fecha y hora (PARA_CODE_RESERVAS). Lo reservado no se mueve: se quita y se vuelve a crear. */
  reservations: Reservation[]
  /** El código de campaña de este viaje, al azar (`app-8F3K2`): va en todos los enlaces de «Reservar» y así se sabe que alguien ha reservado, sin datos del viajero. */
  campaignCode: string
  /** Las ventas del afiliado unidas a este viaje: la tarjeta «¿La ponemos?» y el aviso de cancelación. */
  sales: SaleMatch[]
  /** Wishlist — lugares que el viajero guardó por su cuenta desde el buscador (panel Pool/Wishlist/Buscar), independiente del Pool. Vive por viaje, no por día. */
  wishlist: WishlistItem[]
  /** Solo desarrollo — fecha ISO simulada para probar Modo Hoy en cualquier día del viaje sin cambiar el reloj del sistema (ver DevDateSimulator.tsx). null = usar la fecha real. */
  dev_simulated_today_iso: string | null

  setScreen: (screen: AppScreen) => void
  setDestination: (destination: string, place?: Place | null) => void
  setArchetype: (
    archetype: DestinationArchetype | null,
    isRegion: boolean | null,
    requiereCoche?: boolean,
    paseDominante?: string | null,
    vehiculoAltamenteRecomendado?: boolean,
  ) => void
  /** Clasificación ambigua: fija is_region, deja archetype en null y marca archetype_ambiguous — la app debe preguntarle al usuario. */
  setArchetypeAmbiguous: (isRegion: boolean | null) => void
  /** La llamada de clasificación de destino falló — distingue "cargando" de "falló de verdad" en la UI. */
  setArchetypeClassificationFailed: (failed: boolean) => void
  /** El usuario respondió la pregunta de desambiguación (roadtrip_exclusivo vs base_y_excursiones). */
  resolveArchetypeChoice: (archetype: DestinationArchetype) => void
  setTransportOption: (option: TransportOption | null) => void
  setVehicleOwnership: (ownership: VehicleOwnership | null) => void
  setVehicleType: (vehicleType: VehicleType | null) => void
  setVehicleResolved: (resolved: boolean) => void
  setTravelMode: (mode: TravelMode | null) => void
  setTravelPassConfirmed: (confirmed: boolean | null) => void
  setKnownCamperAccess: (camperAccess: boolean | null) => void
  setCompanionCapacityAcknowledged: (acknowledged: boolean) => void
  setSuggestedExperiences: (ids: ExperienceId[]) => void
  setSuggestedExperiencesLoading: (loading: boolean) => void
  setSuggestedExperiencesFailed: (failed: boolean) => void
  setPlacesStepStarted: (started: boolean) => void
  setDatesConfirmed: (confirmed: boolean) => void
  setSuggestedPlaces: (places: PlaceCandidate[], sourceIds: ExperienceId[]) => void
  /** Añade UN lugar según va llegando del streaming NDJSON de /api/suggest-places — a diferencia de setSuggestedPlaces (reemplazo completo), no toca loading/failed, deja eso a quien orquesta el stream. */
  appendSuggestedPlace: (place: PlaceCandidate, sourceIds: ExperienceId[]) => void
  setSuggestedPlacesLoading: (loading: boolean) => void
  setSuggestedPlacesFailed: (failed: boolean) => void
  toggleSelectedPlace: (placeId: string) => void
  /** "Selecciona todo" — si ya están todos marcados, los desmarca todos; si no, los marca todos. */
  toggleSelectAllPlaces: () => void
  toggleCuratedPlaceSelection: (name: string) => void
  /** Ronda 10: recorta la selección del pool al tope de la duración actual del viaje (ver poolSelectionLimit) — hace falta porque el viajero puede volver atrás y acortar el viaje DESPUÉS de haber marcado más lugares de los que ahora caben. */
  trimCuratedPlaceSelection: (max: number) => void
  updateAnswers: (partial: Partial<QuestionnaireAnswers>) => void
  resetQuestionnaire: () => void

  setRoute: (route: Route) => void
  /** Cierra el banner de contexto del viaje (ContextBanner.tsx): no vuelve a salir en este viaje. */
  dismissContextBanner: () => void
  /** Cierra la nota de temporada (SeasonNote.tsx): no vuelve a salir en este viaje. */
  dismissSeasonNote: () => void
  /** La ventana de fechas especiales ya se vio con estos avisos (DateNoticesModal.tsx): se guarda con la ruta. */
  markDateNoticesSeen: (key: string) => void
  /** "Quiero entrar" (WantInsideDialog.tsx): el día rehecho por el motor y la parada que ahora va por dentro. */
  replaceDayWithInside: (dayId: string, day: DayPlan, insideName: string) => void
  /** El día rehecho por el motor con las reservas del viajero (misma ruta original, sin nombre «por dentro»). */
  replaceDayRebuilt: (dayId: string, day: DayPlan) => void
  /** «Prefiero quedarme en Roma» → «Organízame este día»: el día de excursión pasa a ser el día de ciudad que trae el servidor, y el viaje se acuerda de que ya no lleva excursión. */
  replaceExcursionWithCityDay: (dayId: string, day: DayPlan) => void
  /** El día de excursión pasa a ser el día de ciudad con una excursión de MEDIO día (de 8:00 a 14:00) y su tarde desde las 16:00. */
  replaceExcursionWithHalfDay: (dayId: string, day: DayPlan, excursionId: string, dia: number | null) => void
  /** "Volver a la ruta original": el día exactamente como lo dio el motor (su copia), sin regenerar. */
  restoreOriginalDay: (dayId: string) => void
  /** "Volver a mi ruta original" (la varita del mapa): el viaje entero como se creó, su copia guardada, sin recalcular. */
  restoreOriginalRoute: () => void
  /** "Eliminar día": cualquier día, también el de llegada y el de vuelta. */
  deleteDay: (dayId: string) => void
  /** Día libre sin horas ("Sin hora"). */
  setDayUntimed: (dayId: string, untimed: boolean) => void
  /** "+ Añadir día": un día libre detrás del último día de ruta. Devuelve su id (null si ya hay 14). */
  addFreeDay: (name: string) => string | null
  removeFreeDay: (dayId: string) => void
  renameDay: (dayId: string, name: string) => void
  moveFreeDay: (dayId: string, direction: -1 | 1) => void
  /** Un lugar desde la pantalla de añadir, a la hora elegida (null = la sugerida). */
  addPlaceToDay: (dayId: string, stop: Stop, time: string | null) => void
  /** Un restaurante como comida o cena del día (null = volver a la zona). */
  setMealRestaurant: (dayId: string, mealTime: 'lunch' | 'dinner', restaurant: ChosenRestaurant | null) => void
  /**
   * Guarda una reserva (entrada o excursión) y la FIJA en la ruta: el día lo pone su fecha (la pasa a ese día si estaba en otro) y la entrada
   * se coloca a su hora. Con una del mismo sitio, la sustituye. `excursion`: los datos de la excursión, para ponerla en su día.
   */
  addReservation: (reservation: Reservation, excursion?: Excursion | null) => void
  /** Quita la reserva del viaje (no cancela nada fuera: la ventana lo avisa): la entrada o excursión vuelve a ser una más. */
  removeReservation: (id: string) => void
  /** Una venta del afiliado con el código de este viaje (o su cancelación). */
  receiveSale: (sale: SaleMatch) => void
  /** Lo que el viajero decide con la tarjeta de una venta: «Sí, ponla» (acepta), «Ahora no» (descarta) o «Quitar del viaje» (una cancelada). */
  resolveSale: (id: string, action: 'accept' | 'dismiss' | 'remove', excursion?: Excursion | null) => void
  /** Una excursión desde la pantalla de añadir, en un día vacío. */
  addExcursionToDay: (dayId: string, excursion: Excursion) => void
  /**
   * «¿Dónde la ponemos?» (PARA_CODE_EXCURSIONES, 3): una excursión sustituye un día del viaje (el día pasa a ser la excursión y se llama
   * como ella; sus paradas se quitan y el resto no cambia; con la varita del día vuelve tal como estaba) o va a un día nuevo al final. Una
   * de medio día solo ocupa la mañana: la tarde sigue en el destino. Devuelve el día, que queda abierto en Días.
   */
  placeExcursion: (excursion: Excursion, target: { dayId: string } | { newDay: true }) => string | null
  /** El aviso que se reabre al tocar la etiqueta de un día (null = cerrado). No se guarda. */
  openDateNoticeId: string | null
  setOpenDateNoticeId: (id: string | null) => void
  /** Restaura un viaje ya guardado (TripSync.tsx, al abrir la app) — a diferencia de `setRoute`, no resetea reservas/wishlist ni recalcula el modo inicial: repone exactamente lo que había. */
  hydrateTrip: (payload: TripPayload) => void
  /** Ronda 9 (Mejora 2): añade/cambia las fechas exactas del viaje YA generado desde la cabecera del
      mapa — actualiza `route.answers.dateRange`, la misma fuente que ya lee toda la app (DayList.tsx
      para la fecha real de cada día, destinationSegments.ts para el rango de cada tramo). `undefined`
      quita las fechas (vuelve a "Añadir fechas"). No recalcula `days` — el número de días del viaje
      ya generado no cambia por poner/quitar fechas después. */
  setRouteDateRange: (dateRange: DateRange | undefined) => void
  /** Fechas puestas desde el mapa (PROMPT_PENDIENTE G): rehace la ruta como el formulario (pantalla de carga) con esas
      fechas, sin tocar reservas ni wishlist. `undefined` = quitar fechas (días normales del mismo mes). */
  regenerateRouteForDates: (dateRange: DateRange | undefined) => void
  /** "Mejor no" (decisión del usuario, 2026-09-28): se guardan las fechas y la ruta se queda exactamente igual, sin
      ventana ni avisos. Solo el dato de cada parada: las que cierran ese día llevan "Hoy cierra" en rojo. */
  setRouteDatesKeepingRoute: (dateRange: DateRange | undefined, closures: { dayNumber: number; name: string }[]) => void
  /** La siguiente `setRoute` es la misma ruta rehecha: no resetea reservas ni wishlist. */
  keepBookingsOnNextRoute: boolean
  setActiveDayId: (dayId: string | null) => void
  setMode: (mode: RouteMode) => void
  toggleDarkMode: () => void
  setIntensity: (intensity: number) => void
  setPanelSplit: (split: number) => void

  /**
   * Prompt 4 — "el algoritmo propone, el viajero dispone": cualquier día puede convertirse en
   * cualquier tipo. Nunca regenera ni llama a la IA: al salir de una ruta se guarda una foto de sus
   * paradas (stopsBeforeConversion) y al volver se restaura, así que ir y venir es gratis y no
   * cuesta contenido curado.
   */
  convertDayType: (dayId: string, dayType: DayType) => void
  /** Elegir (o deseleccionar, con null) la excursión de un día de excursión. */
  selectDayExcursion: (dayId: string, excursionId: string | null) => void
  /**
   * "Prefiero quedarme en la ciudad" en la excursión de medio día: se quita de la mañana y no se
   * vuelve a proponer en ese día. Las paradas de la tarde no se tocan — el día sigue montado, lo
   * que queda libre es la mañana, que en un día de revisitas es suya.
   */
  declineHalfDayExcursion: (dayId: string) => void
  /**
   * El viajero añade a mano una excursión a un día EN BLANCO (por encima de `max_auto_days`).
   *
   * Lo que pasa después lo decide la DURACIÓN de la excursión, no el viajero: una de jornada
   * completa se queda el día entero y no deja hueco que ofrecer; una de medio día ocupa la mañana
   * y deja la tarde libre, así que el día vuelve a ser un día suyo con la mañana ya resuelta.
   */
  addBlankDayExcursion: (dayId: string, excursion: Excursion) => void
  removeStop: (dayId: string, stopId: string) => void
  /** Guarda el tramo recalculado tras quitar una parada (ver withLegToNext). */
  setLegToNext: (dayId: string, stopId: string, minutes: number) => void
  reorderStops: (dayId: string, orderedStopIds: string[]) => void
  /**
   * Mueve la comida o la cena a otro sitio del día (PROMPT_UI_REPASO_3, 3): detrás de la parada `toAfter` (-1 = antes de la
   * primera). Las horas se reparten por posición, igual que al mover una parada: la que pasa a ocupar un hueco se lleva su
   * hora, y lo que se pisa se empuja. La comida o la cena no es una parada: solo cambia su hora y el orden en que se ve.
   */
  moveMeal: (dayId: string, mealTime: 'lunch' | 'dinner', fromAfter: number, toAfter: number) => void
  /**
   * Cambia de sitio un día entero dentro del viaje (arrastrar en la lista de días, DayList.tsx).
   *
   * El día se lleva su contenido tal cual: las horas de sus paradas NO se tocan, porque lo que se
   * mueve es el día, no el plan del día. Lo único que cambia es `dayNumber`, que se reparte por
   * posición — y con él la fecha, que se calcula siempre como inicio del viaje + dayNumber - 1.
   */
  reorderDays: (orderedDayIds: string[]) => void
  moveStopToDay: (stopId: string, fromDayId: string, toDayId: string) => void
  updateStopTime: (dayId: string, stopId: string, newTime: string) => void
  addStop: (dayId: string, stop: Stop) => void
  replaceStop: (dayId: string, stopId: string, updates: Partial<Stop>) => void
  /** Inserta `stop` en la posición `index` exacta de `day.stops` (a diferencia de `addStop`, que siempre añade al final) — para el "+" entre paradas de DIAS. */
  insertStopAt: (dayId: string, index: number, stop: Stop) => void
  /** "Cristaliza" el pool de plantilla mock de un día en `Stop[]` reales, solo si el día aún no tiene ninguna parada real — ver seedStopsFromTemplate en mockDayDetail.ts. No hace nada si el día ya tiene paradas (nunca pisa ediciones existentes). */
  seedDayStops: (dayId: string, seedStops: Stop[]) => void
  /** "Regenerar este día" (DayMenu.tsx) — SUSTITUYE `day.stops` entero por `orderedStops` (ya ordenadas geográficamente por el llamador, ver geographicStopOrder.ts) y reconstruye sus horas desde la primera, igual que reorderStops. A diferencia de seedDayStops (solo si el día está vacío) esto SIEMPRE pisa lo que hubiera antes — es justo lo que "regenerar" pide. */
  regenerateDayStops: (dayId: string, orderedStops: Stop[]) => void

  /** Modo Hoy — marca el check-in real de una parada ("Ya he estado aquí" / "Ya terminé, seguir"). */
  checkInStop: (dayId: string, stopId: string) => void
  /** Modo Hoy — "Sí, dame más tiempo" en el aviso "¿Sigues aquí?": solo anota el retraso, no hace check-in. */
  noteStopDelay: (dayId: string, stopId: string) => void
  /**
   * Modo Hoy — "Comprimir tiempos" tras un check-in con retraso significativo: retimea las paradas
   * de `day.stops` posteriores a `afterStopId` empezando en `nowMin` (minutos desde medianoche) en
   * vez de en su hora original, y reduce duración/margen para recuperar parte del retraso. Acción
   * explícita del viajero, nunca automática.
   */
  compressStopsFrom: (dayId: string, afterStopId: string, nowMin: number) => void

  confirmTransport: (dayId: string) => void
  confirmHotel: (dayId: string) => void
  /** El viajero elige una de las alternativas de un tramo entre ciudades (multidestino_tren_o_vuelo) — la fija como resuelta. */
  chooseTransportSegment: (dayId: string, alternative: TransportSegmentAlternative) => void
  /** Deshacer la elección de un tramo — solo tiene efecto cuando hubo alternativas reales entre las que elegir. */
  resetTransportSegment: (dayId: string) => void

  addBudgetItem: (item: BudgetItem) => void
  removeBudgetItem: (itemId: string) => void

  markDidntMakeCutAdded: (dayId: string, itemId: string) => void

  /** Tanda 6 — «Si te sobra tiempo» → «Añadir»: la parada pasa al día (al final de su franja, por su hora orientativa) y sale de la lista. */
  addSpareStop: (dayId: string, stopId: string) => void
  /** Tanda 6 — HOY: sustituye el día por el que devuelve /api/adjust-day (retraso / cansado). */
  applyAdjustedDay: (dayId: string, day: DayPlan) => void
  /** Tanda 6 — «Usar esta alternativa» (lluvia): quita lo que sale, mete lo que entra y guarda lo de antes para volver. */
  applyRainPlan: (dayId: string) => void
  /** Tanda 6 — vuelve al plan original del día tras usar la alternativa de lluvia. */
  revertRainPlan: (dayId: string) => void

  /** Wishlist — añade un lugar guardado desde el buscador (panel Pool/Wishlist/Buscar). */
  addToWishlist: (item: WishlistItem) => void
  /** Wishlist — quita un lugar guardado (no afecta a si ya se añadió como Stop a algún día). */
  removeFromWishlist: (itemId: string) => void
  /** Solo desarrollo — fija/borra la fecha simulada de Modo Hoy. */
  setDevSimulatedTodayIso: (iso: string | null) => void

  /** Alojamiento mock de una estancia (DIAS/RESERVAS) — hotel null para borrar la selección. Clave: id del primer día de esa estancia. */
  setAccommodationHotel: (segmentDayId: string, hotel: MockHotelResult | null) => void

  /** RESERVAS — ficha de reserva de un tramo de transporte (llegada o vuelta), null para borrarla. Clave: id del día de traslado. */
  setTransportBooking: (dayId: string, booking: TransportBooking | null) => void
  setInsuranceBooking: (booking: GeneralBooking | null) => void
  setN26Added: (added: boolean) => void
  setRentalVehicleBooking: (booking: GeneralBooking | null) => void
  /** null borra la selección (vuelve a "Necesito internet" sin resolver) para ese país. */
  setEsimSelection: (countryCode: string, status: EsimStatus | null) => void

  /** Reservas — hora "HH:MM" del vuelo de llegada/salida, o null para borrarla. */
  setArrivalFlightTime: (time: string | null) => void
  setDepartureFlightTime: (time: string | null) => void
  /** El punto de llegada o de salida elegido en la ficha (Fiumicino o Ciampino…): lo enseña la barra. */
  setArrivalPointId: (kind: 'arrival' | 'departure', pointId: string) => void
  setFlightAdjust: (choice: 'auto' | 'manual' | null) => void
  /** "Optimizar ruta" en RESERVAS — recalcula el horario REAL de un único día (llegada o vuelta) a partir de la hora de vuelo introducida, ver stopScheduling.ts. No toca el resto de días. */
  optimizeDayWithRealTransport: (dayId: string, kind: 'arrival' | 'departure', flightTime: string) => Promise<void>
  /** «Ajustar este día a tu llegada / vuelta»: la llegada reprograma desde la hora en el centro; la vuelta quita lo que acaba después de la hora de salir. Las comidas siguen a las paradas. */
  fitDayToTrip: (dayId: string, kind: 'arrival' | 'departure', keyMinutes: number) => Promise<void>
}

const updateDay = (route: Route, dayId: string, updater: (day: DayPlan) => DayPlan): Route => ({
  ...route,
  days: route.days.map((day) => (day.id === dayId ? updater(day) : day)),
})

const DARK_MODE_KEY = 'route-planner-dark-mode'

const getInitialDarkMode = (): boolean => {
  try {
    return localStorage.getItem(DARK_MODE_KEY) === 'true'
  } catch {
    return false
  }
}

export const useRouteStore = create<RouteStoreState>((set, get) => ({
  screen: 'destination',
  destination: null,
  destinationPlace: null,
  archetype: null,
  is_region: null,
  archetype_ambiguous: false,
  archetype_classification_failed: false,
  requiere_coche: false,
  pase_dominante: null,
  vehiculo_altamente_recomendado: false,
  travel_pass_confirmed: null,
  transport_option: null,
  vehicle_type: null,
  vehicle_ownership: null,
  accommodation_mode: null,
  vehicle_resolved: false,
  travel_mode: null,
  known_camper_access: null,
  companion_capacity_acknowledged: false,
  suggested_experiences: [],
  suggested_experiences_loading: false,
  suggested_experiences_failed: false,
  places_step_started: false,
  dates_confirmed: false,
  suggested_places: [],
  suggested_places_source_ids: [],
  suggested_places_loading: false,
  suggested_places_failed: false,
  selected_place_ids: [],
  selected_curated_place_names: [],
  // chronotype/budgetLevel vienen con valor por defecto desde el arranque — el formulario
  // rediseñado ya no los pregunta (el viajero puede ajustar horarios más tarde a mano desde DIAS/
  // Modo Hoy), así que necesitan un valor razonable aquí para que hasRequiredAnswers (server/
  // index.js) nunca los eche en falta.
  answers: { chronotype: 'normal', budgetLevel: 'comfortable' },
  route: null,
  activeDayId: null,
  mode: 'route',
  accommodationSelections: {},
  transportBookings: {},
  insuranceBooking: null,
  n26Added: false,
  rentalVehicleBooking: null,
  esimSelections: {},
  reservations: [],
  campaignCode: newCampaignCode(),
  sales: [],
  wishlist: [],
  dev_simulated_today_iso: null,
  darkMode: getInitialDarkMode(),
  intensity: 3,
  panelSplit: 45,

  setScreen: (screen) => set({ screen }),
  setDestination: (destination, place = null) =>
    set({
      destination,
      destinationPlace: place,
      archetype: null,
      is_region: null,
      archetype_ambiguous: false,
      archetype_classification_failed: false,
      requiere_coche: false,
      pase_dominante: null,
      vehiculo_altamente_recomendado: false,
      travel_pass_confirmed: null,
      transport_option: null,
      vehicle_type: null,
      vehicle_ownership: null,
      accommodation_mode: null,
      vehicle_resolved: false,
      travel_mode: null,
      known_camper_access: null,
      companion_capacity_acknowledged: false,
      suggested_experiences: [],
      suggested_experiences_loading: false,
      suggested_experiences_failed: false,
      places_step_started: false,
      dates_confirmed: false,
      suggested_places: [],
      suggested_places_source_ids: [],
      suggested_places_loading: false,
      suggested_places_failed: false,
      selected_place_ids: [],
      selected_curated_place_names: [],
    }),
  setArchetype: (archetype, isRegion, requiereCoche = false, paseDominante = null, vehiculoAltamenteRecomendado = false) =>
    set({
      archetype,
      is_region: isRegion,
      archetype_ambiguous: false,
      archetype_classification_failed: false,
      requiere_coche: requiereCoche,
      pase_dominante: paseDominante,
      vehiculo_altamente_recomendado: vehiculoAltamenteRecomendado,
      travel_pass_confirmed: null,
    }),
  setArchetypeAmbiguous: (isRegion) =>
    set({
      archetype: null,
      is_region: isRegion,
      archetype_ambiguous: true,
      archetype_classification_failed: false,
      requiere_coche: false,
      pase_dominante: null,
      vehiculo_altamente_recomendado: false,
      travel_pass_confirmed: null,
    }),
  setArchetypeClassificationFailed: (failed) => set({ archetype_classification_failed: failed }),
  resolveArchetypeChoice: (archetype) =>
    set({
      archetype,
      archetype_ambiguous: false,
      requiere_coche: false,
      pase_dominante: null,
      vehiculo_altamente_recomendado: false,
      travel_pass_confirmed: null,
    }),
  setTransportOption: (option) =>
    set({
      transport_option: option,
      vehicle_type: option?.vehicle_type ?? null,
      // Cada nueva opción de llegada invalida la respuesta de ownership anterior — se vuelve a
      // resolver desde cero según la rama que corresponda (ver RoadtripTransportFlow).
      vehicle_ownership: null,
      accommodation_mode: option ? deriveAccommodationMode(option.vehicle_type) : null,
      vehicle_resolved: false,
      companion_capacity_acknowledged: false,
    }),
  setVehicleOwnership: (ownership) => set({ vehicle_ownership: ownership }),
  setVehicleType: (vehicleType) =>
    set({ vehicle_type: vehicleType, accommodation_mode: deriveAccommodationMode(vehicleType), companion_capacity_acknowledged: false }),
  setVehicleResolved: (resolved) => set({ vehicle_resolved: resolved }),
  setTravelMode: (mode) => set({ travel_mode: mode }),
  setTravelPassConfirmed: (confirmed) => set({ travel_pass_confirmed: confirmed }),
  setKnownCamperAccess: (camperAccess) => set({ known_camper_access: camperAccess }),
  setCompanionCapacityAcknowledged: (acknowledged) => set({ companion_capacity_acknowledged: acknowledged }),
  setSuggestedExperiences: (ids) => set({ suggested_experiences: ids, suggested_experiences_loading: false, suggested_experiences_failed: false }),
  setSuggestedExperiencesLoading: (loading) => set({ suggested_experiences_loading: loading }),
  setSuggestedExperiencesFailed: (failed) => set({ suggested_experiences_failed: failed, suggested_experiences_loading: false }),
  setPlacesStepStarted: (started) => set({ places_step_started: started }),
  setDatesConfirmed: (confirmed) => set({ dates_confirmed: confirmed }),
  setSuggestedPlaces: (places, sourceIds) => set({ suggested_places: places, suggested_places_source_ids: sourceIds }),
  appendSuggestedPlace: (place, sourceIds) =>
    set((state) =>
      state.suggested_places.some((existing) => existing.id === place.id)
        ? state
        : { suggested_places: [...state.suggested_places, place], suggested_places_source_ids: sourceIds },
    ),
  setSuggestedPlacesLoading: (loading) => set({ suggested_places_loading: loading }),
  setSuggestedPlacesFailed: (failed) => set({ suggested_places_failed: failed, suggested_places_loading: false }),
  toggleSelectedPlace: (placeId) =>
    set((state) => ({
      selected_place_ids: state.selected_place_ids.includes(placeId)
        ? state.selected_place_ids.filter((id) => id !== placeId)
        : [...state.selected_place_ids, placeId],
    })),
  toggleSelectAllPlaces: () =>
    set((state) => ({
      selected_place_ids: state.selected_place_ids.length === state.suggested_places.length ? [] : state.suggested_places.map((place) => place.id),
    })),
  toggleCuratedPlaceSelection: (name) =>
    set((state) => ({
      selected_curated_place_names: state.selected_curated_place_names.includes(name)
        ? state.selected_curated_place_names.filter((existing) => existing !== name)
        : [...state.selected_curated_place_names, name],
    })),
  trimCuratedPlaceSelection: (max) =>
    set((state) =>
      state.selected_curated_place_names.length <= max ? state : { selected_curated_place_names: state.selected_curated_place_names.slice(0, max) },
    ),
  updateAnswers: (partial) => set((state) => ({ answers: { ...state.answers, ...partial } })),
  resetQuestionnaire: () =>
    set({
      answers: { chronotype: 'normal', budgetLevel: 'comfortable' },
      destination: null,
      destinationPlace: null,
      archetype: null,
      is_region: null,
      archetype_ambiguous: false,
      archetype_classification_failed: false,
      requiere_coche: false,
      pase_dominante: null,
      vehiculo_altamente_recomendado: false,
      travel_pass_confirmed: null,
      transport_option: null,
      vehicle_type: null,
      vehicle_ownership: null,
      accommodation_mode: null,
      vehicle_resolved: false,
      travel_mode: null,
      known_camper_access: null,
      companion_capacity_acknowledged: false,
      suggested_experiences: [],
      suggested_experiences_loading: false,
      suggested_experiences_failed: false,
      places_step_started: false,
      dates_confirmed: false,
      suggested_places: [],
      suggested_places_source_ids: [],
      suggested_places_loading: false,
      suggested_places_failed: false,
      selected_place_ids: [],
      selected_curated_place_names: [],
    }),

  dismissContextBanner: () =>
    set((state) => (state.route ? { route: { ...state.route, contextBannerDismissed: true } } : state)),
  dismissSeasonNote: () => set((state) => (state.route ? { route: { ...state.route, seasonNoteDismissed: true } } : state)),

  markDateNoticesSeen: (key) => set((state) => (state.route ? { route: { ...state.route, dateNoticesSeenKey: key } } : state)),

  // Rehecho por el motor: lo nuevo pasa a ser la ruta original de ese día (sin copia de antes).
  replaceDayWithInside: (dayId, day, insideName) =>
    set((state) =>
      state.route
        ? { route: { ...state.route, days: state.route.days.map((other) => (other.id === dayId ? { ...day, originalSnapshot: null } : other)), insideNames: [...new Set([...(state.route.insideNames ?? []), insideName])] } }
        : state,
    ),
  replaceDayRebuilt: (dayId, day) =>
    set((state) => (state.route ? { route: reapplyReservations({ ...state.route, days: state.route.days.map((other) => (other.id === dayId ? { ...day, originalSnapshot: null } : other)) }, state.reservations) } : state)),
  replaceExcursionWithCityDay: (dayId, day) =>
    set((state) => (state.route ? { route: reapplyReservations({ ...state.route, answers: { ...state.route.answers, sinExcursion: true }, days: state.route.days.map((other) => (other.id === dayId ? { ...day, originalSnapshot: null, selectedExcursionId: null, excursionDeclined: true } : other)) }, state.reservations) } : state)),
  replaceExcursionWithHalfDay: (dayId, day, excursionId, dia) =>
    set((state) => (state.route ? { route: reapplyReservations({ ...state.route, answers: { ...state.route.answers, mediaExcursion: { id: excursionId, dia } }, days: state.route.days.map((other) => (other.id === dayId ? { ...day, originalSnapshot: null, selectedExcursionId: null, excursionDeclined: true } : other)) }, state.reservations) } : state)),
  restoreOriginalDay: (dayId) =>
    set((state) => {
      if (!state.route) return state
      // Una excursión reservada es el día entero: no hay nada que recuperar (lo reservado se queda).
      const target = state.route.days.find((day) => day.id === dayId)
      if (target && isDayPinned(state.route, state.reservations, target)) return state
      // (Con su número y su color de ahora: si el día se movió, se queda donde está.)
      const days = state.route.days.map((day) => (day.id === dayId && day.originalSnapshot ? { ...day.originalSnapshot, id: day.id, dayNumber: day.dayNumber, colorIndex: day.colorIndex, originalSnapshot: null } : day))
      // (Lo reservado se queda en su sitio y a su hora aunque se recupere el día.)
      return { route: reapplyReservations({ ...state.route, days, editedManually: days.some((day) => Boolean(day.originalSnapshot)) }, state.reservations) }
    }),
  setDayUntimed: (dayId, untimed) =>
    set((state) =>
      state.route
        ? {
            route: updateDay(state.route, dayId, (day) => ({ ...day, untimed })),
          }
        : state,
    ),
  addFreeDay: (name) => {
    const route = get().route
    const added = route ? addFreeDayTo(route, name) : null
    if (!added) return null
    set({ route: withDayColors(added.route) })
    return added.dayId
  },
  removeFreeDay: (dayId) => set((state) => (state.route ? { route: removeFreeDayFrom(state.route, dayId) } : state)),
  deleteDay: (dayId) =>
    set((state) => {
      const day = state.route?.days.find((candidate) => candidate.id === dayId)
      // Un día fijado por una reserva no se elimina: primero se quita la reserva de su excursión.
      if (!state.route || (day && isDayPinned(state.route, state.reservations, day))) return state
      return { route: removeAnyDay(state.route, dayId) }
    }),
  restoreOriginalRoute: () =>
    set((state) => {
      const original = state.route?.originalRoute
      if (!state.route || !original) return state
      const copy = JSON.parse(JSON.stringify(original)) as NonNullable<Route['originalRoute']>
      return { route: reapplyReservations({ ...state.route, days: copy.days, answers: copy.answers, editedManually: false }, state.reservations), activeDayId: null }
    }),
  renameDay: (dayId, name) => set((state) => (state.route ? { route: renameDayIn(state.route, dayId, name) } : state)),
  moveFreeDay: (dayId, direction) =>
    set((state) => {
      if (!state.route) return state
      const moving = state.route.days.find((day) => day.id === dayId)
      const neighbour = moving ? state.route.days[state.route.days.indexOf(moving) + direction] : undefined
      if ((moving && isDayPinned(state.route, state.reservations, moving)) || (neighbour && isDayPinned(state.route, state.reservations, neighbour))) return state
      return { route: reapplyReservations(moveDay(state.route, dayId, direction), state.reservations) }
    }),
  addPlaceToDay: (dayId, stop, time) =>
    set((state) => (state.route ? { route: updateDay(state.route, dayId, (day) => withStopAt(day, stop, time)) } : state)),
  setMealRestaurant: (dayId, mealTime, restaurant) =>
    set((state) => (state.route ? { route: updateDay(state.route, dayId, (day) => withMealRestaurant(day, mealTime, restaurant)) } : state)),
  addExcursionToDay: (dayId, excursion) => {
    // La excursión puede venir del catálogo del destino y no de las del día: se apunta en el día para que la encuentre.
    set((state) =>
      state.route
        ? { route: updateDay(state.route, dayId, (day) => ({ ...day, excursions: (day.excursions ?? []).some((other) => other.id === excursion.id) ? day.excursions : [...(day.excursions ?? []), excursion] })) }
        : state,
    )
    get().addBlankDayExcursion(dayId, excursion)
  },
  addReservation: (reservation, excursion) => {
    set((state) => ({ reservations: [...state.reservations.filter((other) => !(other.kind === reservation.kind && other.refId === reservation.refId)), reservation] }))
    const route = get().route
    if (!route) return
    if (reservation.kind === 'entrada') {
      const previous = get().reservations.find((other) => other.kind === 'entrada' && other.refId === reservation.refId && other.id !== reservation.id)
      set({ route: placeReservedEntrance(previous ? unpinReservedStops(route, previous.id) : route, reservation) })
      // El motor rehace ese día corriendo las horas alrededor de la hora de la reserva.
      const reservedDay = dayOfReservation(route, reservation)
      if (reservedDay) void import('../lib/rebuildDay').then((module) => module.rehacerDiaConReservas(reservedDay.id))
      return
    }
    const day = dayOfReservation(route, reservation)
    if (day && excursion) get().placeExcursion(excursion, { dayId: day.id })
  },
  removeReservation: (id) => {
    const removed = get().reservations.find((reservation) => reservation.id === id)
    const removedDay = removed && removed.kind === 'entrada' && get().route ? dayOfReservation(get().route!, removed) : null
    set((state) => ({
      reservations: state.reservations.filter((reservation) => reservation.id !== id),
      route: state.route ? unpinReservedStops(state.route, id) : state.route,
    }))
    if (removedDay) void import('../lib/rebuildDay').then((module) => module.rehacerDiaConReservas(removedDay.id))
  },
  receiveSale: (sale) =>
    set((state) => {
      const already = state.sales.find((other) => other.id === sale.id)
      if (already && already.status !== 'nueva') return state
      // Una venta que ya es una reserva del viaje no se pregunta otra vez.
      if (sale.status === 'nueva' && state.reservations.some((reservation) => reservation.refId === sale.refId && reservation.locator && reservation.locator === sale.locator)) return state
      return { sales: [...state.sales.filter((other) => other.id !== sale.id), sale] }
    }),
  resolveSale: (id, action, excursion) => {
    const sale = get().sales.find((candidate) => candidate.id === id)
    if (!sale) return
    if (action === 'accept') {
      get().addReservation(
        { id: `res-${sale.id}`, kind: sale.kind, refId: sale.refId, name: sale.name, placeNames: sale.placeNames, dateIso: sale.dateIso, dayNumber: null, time: sale.time, locator: sale.locator ?? null, excursionId: sale.excursionId ?? null, excursionData: excursion ?? null },
        excursion,
      )
      set((state) => ({ sales: state.sales.map((other) => (other.id === id ? { ...other, status: 'aceptada' as const } : other)) }))
      return
    }
    if (action === 'remove') {
      const linked = get().reservations.find((reservation) => reservation.refId === sale.refId && (!sale.locator || reservation.locator === sale.locator))
      if (linked) get().removeReservation(linked.id)
    }
    set((state) => ({ sales: state.sales.map((other) => (other.id === id ? { ...other, status: 'descartada' as const } : other)) }))
  },
  placeExcursion: (excursion, target) => {
    const route = get().route
    if (!route) return null
    const placed = placeExcursionIn(route, excursion, target)
    if (!placed) return null
    set({ route: placed.route, activeDayId: placed.dayId, mode: 'days' })
    return placed.dayId
  },

  openDateNoticeId: null,
  setOpenDateNoticeId: (id) => set({ openDateNoticeId: id }),

  setRoute: (incoming) =>
    set((state) => {
      // Rehacer el viaje (fechas desde el mapa): los días libres del viajero ("lo organizo yo") no los toca el motor
      // nunca (decisión del usuario, 2026-09-28): se quedan en su número de día.
      const freeDays = state.keepBookingsOnNextRoute ? new Map((state.route?.days ?? []).filter((day) => (day.dayType ?? 'normal') === 'manual' && !day.userAdded).map((day) => [day.dayNumber, day])) : new Map<number, DayPlan>()
      const replanned = freeDays.size > 0 ? { ...incoming, days: incoming.days.map((day) => (freeDays.has(day.dayNumber) ? { ...freeDays.get(day.dayNumber)!, id: day.id } : day)) } : incoming
      // Los días añadidos ("+ Añadir día") no pasan por el motor: vuelven tal cual, con su número de día.
      const rebuilt = state.keepBookingsOnNextRoute ? withUserDaysBack(replanned, userAddedDays(state.route)) : replanned
      // Cada día con su color, y la copia de la ruta tal como se crea ("Volver a mi ruta original").
      const colored = withDayColors(rebuilt)
      const route = { ...colored, editedManually: false, originalRoute: originalRouteOf(colored) }
      return {
      // Rutas guardadas antes de que los días llevaran su país (Roma salía como "Destino"): se rellena aquí.
      route: route.days.some((day) => !day.countryCode && dayCountryCode(null, day.city))
        ? { ...route, days: route.days.map((day) => (day.countryCode ? day : { ...day, countryCode: dayCountryCode(null, day.city) })) }
        : route,
      // null (no route.days[0] fallback) para que la pestaña DIAS arranque con todos los
      // acordeones cerrados — RouteView.tsx sigue resolviendo route.days[0] como fallback para el
      // mapa y otros usos que sí necesitan un día "activo" siempre.
      activeDayId: null,
      // Si la fecha real de hoy cae dentro del viaje, la app abre directamente en Modo Hoy en vez
      // de en la pestaña RUTA — ver getTodayTripContext.
      mode: getTodayTripContext(route) ? 'today' : 'route',
      intensity: route.intensity,
      ...(state.keepBookingsOnNextRoute
        ? {}
        : { accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, reservations: [], campaignCode: newCampaignCode(), sales: [], wishlist: [] }),
      keepBookingsOnNextRoute: false,
      dev_simulated_today_iso: null,
      }
    }),

  hydrateTrip: (payload) =>
    set({
      screen: 'route',
      // (Viajes guardados antes de los colores fijos y de la copia original: se completan al abrirlos.)
      route: (() => {
        const colored = withDayColors(payload.route)
        return colored.originalRoute || colored.editedManually ? colored : { ...colored, originalRoute: originalRouteOf(colored) }
      })(),
      accommodationSelections: payload.bookings.accommodationSelections,
      transportBookings: payload.bookings.transportBookings,
      insuranceBooking: payload.bookings.insuranceBooking,
      n26Added: payload.bookings.n26Added,
      rentalVehicleBooking: payload.bookings.rentalVehicleBooking,
      esimSelections: payload.bookings.esimSelections,
      reservations: payload.bookings.reservations ?? [],
      campaignCode: payload.bookings.campaignCode ?? newCampaignCode(),
      sales: payload.bookings.sales ?? [],
      wishlist: payload.wishlist,
      mode: payload.uiState.mode,
      activeDayId: payload.uiState.activeDayId,
    }),

  setRouteDateRange: (dateRange) =>
    set((state) => {
      if (!state.route) return state
      return { route: { ...state.route, answers: { ...state.route.answers, dateRange } } }
    }),
  keepBookingsOnNextRoute: false,
  regenerateRouteForDates: (dateRange) =>
    set((state) => {
      if (!state.route) return state
      const route = state.route
      // Los días añadidos por el viajero no los planifica el motor: se quitan del final y vuelven en setRoute.
      const userDays = userAddedDays(route).length
      const fullSpan = dateRange ? daysBetweenInclusive(dateRange.start, dateRange.end) : null
      const span = fullSpan != null ? fullSpan - userDays : null
      const plannedRange = dateRange && userDays > 0 ? { ...dateRange, end: addDaysToIso(dateRange.end, -userDays) } : dateRange
      const startMonth = dateRange ? Number(dateRange.start.slice(5, 7)) - 1 : null
      // Sin fechas, el mismo mes de antes (el de las fechas que se quitan, o el que ya tenía).
      const month = startMonth ?? (route.answers.dateRange ? Number(route.answers.dateRange.start.slice(5, 7)) - 1 : route.answers.month)
      return {
        destination: route.destination,
        answers: {
          ...route.answers,
          dateRange: plannedRange,
          days: span ?? (route.answers.days != null ? route.answers.days - userDays : route.answers.days),
          month,
          season: month != null ? seasonOfMonth(month) : route.answers.season,
        },
        ...route.transportContext,
        selected_curated_place_names: route.mustIncludePlaces ?? state.selected_curated_place_names,
        keepBookingsOnNextRoute: true,
        screen: 'loading',
      }
    }),
  setRouteDatesKeepingRoute: (dateRange, closures) =>
    set((state) => {
      if (!state.route) return state
      const closed = new Set(closures.map((closure) => `${closure.dayNumber}|${closure.name}`))
      return {
        route: {
          ...state.route,
          answers: { ...state.route.answers, dateRange },
          // Los avisos eran de las fechas de antes (o de solo el mes): con "Mejor no" no sale ninguno.
          dateNotices: [],
          days: state.route.days.map((day) => ({
            ...day,
            // "Hoy cierra" en su línea de horario; el aviso de sin fechas ("cerrado los lunes a esta hora") ya no vale.
            stops: day.stops.map((stop) => ({ ...stop, hoursWarning: closed.has(`${day.dayNumber}|${stop.name}`) ? 'Hoy cierra' : null })),
          })),
        },
      }
    }),
  setActiveDayId: (dayId) => set({ activeDayId: dayId }),
  setMode: (mode) => set({ mode }),
  toggleDarkMode: () =>
    set((state) => {
      const darkMode = !state.darkMode
      try {
        localStorage.setItem(DARK_MODE_KEY, String(darkMode))
      } catch {
        // localStorage unavailable — dark mode just won't persist across reloads
      }
      return { darkMode }
    }),
  setIntensity: (intensity) => set({ intensity }),
  setPanelSplit: (split) => set({ panelSplit: split }),

  convertDayType: (dayId, dayType) =>
    set((state) => {
      if (!state.route) return state
      return {
        route: updateDay(state.route, dayId, (day) => {
          if (day.dayType === dayType) return day
          const keepsStops = dayType === 'normal' || dayType === 'smart_route'
          // La foto se toma UNA vez, la primera que el día deja de ser una ruta: si se tomara en
          // cada conversión, pasar por "día libre" (que vacía las paradas) borraría la ruta buena.
          const snapshot = day.stopsBeforeConversion ?? (day.stops.length > 0 ? day.stops : undefined)
          return {
            ...day,
            dayType,
            stops: keepsStops ? (day.stops.length > 0 ? day.stops : (snapshot ?? [])) : [],
            stopsBeforeConversion: snapshot,
            // Al dejar de ser excursión, la elección deja de tener sentido.
            selectedExcursionId: dayType === 'excursion' ? (day.selectedExcursionId ?? null) : null,
            // Salir de un día de excursión hacia una ruta de ciudad es RECHAZARLA: se anota para no
            // volver a proponérsela sola, pero dejando un acceso sutil por si cambia de opinión. Al
            // volver a convertirlo en excursión la marca se levanta.
            excursionDeclined: dayType === 'excursion' ? false : (day.dayType === 'excursion' ? true : day.excursionDeclined),
            // La oferta de volver a la ruta NO se borra al cambiar de tipo: si este día tenía una
            // ruta, la sigue teniendo guardada, y pasar por "día libre" no puede hacer que la
            // pierda. Cuando no venía del servidor se compone desde la propia foto de las paradas,
            // que es exactamente la ruta a la que se volvería.
            curatedAlternative:
              day.curatedAlternative ??
              (snapshot && snapshot.length > 0 ? { title: day.title, places: snapshot.slice(0, 3).map((stop) => stop.name) } : null),
          }
        }),
      }
    }),

  selectDayExcursion: (dayId, excursionId) =>
    set((state) => {
      if (!state.route) return state
      return { route: updateDay(state.route, dayId, (day) => ({ ...day, selectedExcursionId: excursionId })) }
    }),

  removeStop: (dayId, stopId) =>
    set((state) => {
      if (!state.route) return state
      // Una parada reservada solo se quita con «Quitar del viaje» (que quita antes la reserva).
      if (state.route.days.find((day) => day.id === dayId)?.stops.some((stop) => stop.id === stopId && stop.reservedId)) return state
      return {
        // Quitar una parada no toca la hora de ninguna otra — ver LA REGLA arriba y withoutStop.
        route: updateDay(state.route, dayId, (day) => ({
          ...day,
          stops: withoutStop(day.stops, stopId),
        })),
      }
    }),

  setLegToNext: (dayId, stopId, minutes) =>
    set((state) => {
      if (!state.route) return state
      return { route: updateDay(state.route, dayId, (day) => ({ ...day, stops: withLegToNext(day.stops, stopId, minutes) })) }
    }),

  moveMeal: (dayId, mealTime, fromAfter, toAfter) =>
    set((state) => {
      if (!state.route) return state
      return {
        route: updateDay(state.route, dayId, (day) => {
          const meal = day.meals.find((candidate) => candidate.mealTime === mealTime)
          if (!meal || fromAfter === toAfter) return day
          const mealStart = parseTimeToMinutes(meal.time)
          const mealEnd = meal.windowEnd ? parseTimeToMinutes(meal.windowEnd) : NaN
          const mealMinutes = Number.isNaN(mealEnd) || Number.isNaN(mealStart) ? (mealTime === 'dinner' ? 90 : 75) : mealEnd - mealStart
          type Item = { kind: 'stop'; stop: Stop } | { kind: 'meal' }
          const before: Item[] = day.stops.map((stop) => ({ kind: 'stop', stop }))
          before.splice(fromAfter + 1, 0, { kind: 'meal' })
          const after: Item[] = day.stops.map((stop) => ({ kind: 'stop', stop }))
          after.splice(toAfter + 1, 0, { kind: 'meal' })
          const timeOf = (item: Item) => (item.kind === 'meal' ? meal.time : item.stop.time)
          const durationOf = (item: Item) => (item.kind === 'meal' ? mealMinutes : item.stop.durationMinutes + (item.stop.walkingTimeToNextMinutes ?? 0))
          // Por posición, como las paradas; y lo que se pisa, hacia delante (redondeado al cuarto de hora).
          let cursor = -Infinity
          const timed = after.map((item, index) => {
            let start = parseTimeToMinutes(timeOf(before[index]))
            if (Number.isNaN(start)) start = cursor
            if (start < cursor) start = roundUpToQuarterHour(cursor)
            cursor = start + durationOf(item)
            return { item, time: minutesToTime(start) }
          })
          const stopTimes = new Map(timed.filter((entry) => entry.item.kind === 'stop').map((entry) => [(entry.item as { stop: Stop }).stop.id, entry.time]))
          const newMealTime = timed.find((entry) => entry.item.kind === 'meal')!.time
          const newMealStart = parseTimeToMinutes(newMealTime)
          return {
            ...day,
            stops: day.stops.map((stop) => ({ ...stop, time: stopTimes.get(stop.id) ?? stop.time })),
            meals: day.meals.map((candidate) =>
              candidate === meal ? { ...candidate, time: newMealTime, ...(candidate.windowEnd ? { windowEnd: minutesToTime(newMealStart + mealMinutes) } : {}) } : candidate,
            ),
            mealAfter: { ...(day.mealAfter ?? {}), [mealTime]: toAfter },
          }
        }),
      }
    }),

  reorderStops: (dayId, orderedStopIds) =>
    set((state) => {
      if (!state.route) return state
      return {
        route: updateDay(state.route, dayId, (day) => {
          const stopsById = new Map(day.stops.map((stop) => [stop.id, stop]))
          const reordered = orderedStopIds
            .map((id) => stopsById.get(id))
            .filter((stop): stop is Stop => Boolean(stop))
          // Día libre: solo el orden (las horas las pone el viajero y no se mueven).
          if (isFreeDay(day)) return { ...day, stops: reordered }
          return { ...day, stops: pushOverlapsForward(reassignTimesByPosition(day.stops, reordered)) }
        }),
      }
    }),

  declineHalfDayExcursion: (dayId) =>
    set((state) => {
      if (!state.route) return state
      return { route: updateDay(state.route, dayId, (day) => ({ ...day, halfDayExcursionDeclined: true })) }
    }),

  addBlankDayExcursion: (dayId, excursion) =>
    set((state) => {
      if (!state.route) return state
      const mediaJornada = excursion.length === 'half-day'
      return {
        route: updateDay(state.route, dayId, (day) => ({
          ...day,
          selectedExcursionId: excursion.id,
          // Media jornada: el día sigue siendo SUYO (tipo 'manual'), solo que con la mañana ya
          // resuelta. Así la tarde se comporta como cualquier día montado a mano — añadir paradas,
          // arrastrarlas, horarios — en vez de tener que reinventar todo eso para este caso.
          dayType: mediaJornada ? 'manual' : 'excursion',
          halfDayExcursion: mediaJornada
            ? { id: excursion.id, startsAt: '08:00', endsAt: '14:00', routeStartsAt: '14:00' }
            : null,
          // Se limpia el "no, gracias" anterior: si vuelve a elegir una, es que la quiere.
          halfDayExcursionDeclined: false,
        })),
      }
    }),

  reorderDays: (orderedDayIds) =>
    set((state) => {
      if (!state.route) return state
      const daysById = new Map(state.route.days.map((day) => [day.id, day]))
      const reordenados = orderedDayIds.map((id) => daysById.get(id)).filter((day): day is DayPlan => Boolean(day))
      // Si falta alguno no se toca nada: reordenar medio viaje es peor que no reordenarlo.
      if (reordenados.length !== state.route.days.length) return state
      // Un día fijado por una excursión reservada no se mueve: la reserva es de esa fecha.
      if (reordenados.some((day, index) => day.dayNumber !== index + 1 && isDayPinned(state.route!, state.reservations, day))) return state
      // (Las entradas reservadas siguen a su fecha: pasan al día que ahora cae en ella.)
      return {
        route: reapplyReservations(
          {
            ...state.route,
            days: reordenados.map((day, index) => ({ ...day, dayNumber: index + 1 })),
          },
          state.reservations,
        ),
      }
    }),

  moveStopToDay: (stopId, fromDayId, toDayId) =>
    set((state) => {
      if (!state.route || fromDayId === toDayId) return state
      if (state.route.days.find((day) => day.id === fromDayId)?.stops.some((stop) => stop.id === stopId && stop.reservedId)) return state
      const fromDay = state.route.days.find((day) => day.id === fromDayId)
      const stop = fromDay?.stops.find((s) => s.id === stopId)
      if (!stop) return state
      return {
        route: {
          ...state.route,
          days: state.route.days.map((day) => {
            // El día de ORIGEN solo pierde una parada (como removeStop: nadie más cambia de hora).
            // En el de DESTINO la parada llega al final, y ahí sí hay que ponerle una hora porque la
            // que traía era la de otro día — pero sin tocar las que ya estaban.
            if (day.id === fromDayId) return { ...day, stops: withoutStop(day.stops, stopId) }
            if (day.id === toDayId) {
              return { ...day, stops: pushOverlapsForward([...day.stops, { ...stop, time: suggestedTimeFor(day, stop) }]) }
            }
            return day
          }),
        },
      }
    }),

  updateStopTime: (dayId, stopId, newTime) =>
    set((state) => {
      if (!state.route) return state
      // La hora de lo reservado no se cambia.
      if (state.route.days.find((day) => day.id === dayId)?.stops.some((stop) => stop.id === stopId && stop.reservedId)) return state
      return {
        // Solo cambia esa (decisión del usuario, 2026-09-28): las demás se quedan; si algo se pisa, se ve.
        route: updateDay(state.route, dayId, (day) => ({
          ...day,
          stops: day.stops.map((stop) => (stop.id === stopId ? { ...stop, time: newTime } : stop)),
        })),
      }
    }),

  addStop: (dayId, stop) =>
    set((state) => {
      if (!state.route) return state
      return {
        // La parada NUEVA es la única a la que le ponemos hora (no tenía); las que ya estaban no se tocan.
        route: updateDay(state.route, dayId, (day) => {
          const previous = day.stops[day.stops.length - 1]
          const fallback = stop.time
          const stops = day.stops.map((other, at) => (at === day.stops.length - 1 ? { ...other, nextLegPending: true } : other))
          // Día libre: sin hora (la pone el viajero si quiere).
          if (isFreeDay(day)) return { ...day, stops: [...stops, { ...stop, time: '' }] }
          return { ...day, stops: [...stops, { ...stop, time: stop.isNightExperience ? stop.time : timeForStopAfter(previous, fallback, stop) }] }
        }),
      }
    }),

  replaceStop: (dayId, stopId, updates) =>
    set((state) => {
      if (!state.route) return state
      if (state.route.days.find((day) => day.id === dayId)?.stops.some((stop) => stop.id === stopId && stop.reservedId)) return state
      return {
        route: updateDay(state.route, dayId, (day) => ({
          ...day,
          stops: day.stops.map((stop) => (stop.id === stopId ? { ...stop, ...updates } : stop)),
        })),
      }
    }),

  insertStopAt: (dayId, index, stop) =>
    set((state) => {
      if (!state.route) return state
      return {
        route: updateDay(state.route, dayId, (day) => {
          // Igual que addStop pero en una posición concreta: hora para la que entra, calculada desde la
          // parada que le queda justo delante; las de detrás solo se mueven si se pisan (hacia delante).
          const stops = day.stops.map((other, at) => (at === index - 1 ? { ...other, nextLegPending: true } : other))
          const fallback = stop.time
          if (isFreeDay(day)) {
            stops.splice(index, 0, { ...stop, time: '', nextLegPending: index < day.stops.length || undefined })
            return { ...day, stops }
          }
          // Una experiencia nocturna trae su hora (después de cenar): no se encadena a la última parada. Las de detrás no
          // se mueven (decisión del usuario, 2026-09-28): solo se recalculan los paseos con la anterior y la siguiente.
          stops.splice(index, 0, stop.isNightExperience ? stop : { ...stop, time: timeForStopAfter(day.stops[index - 1], fallback, stop), nextLegPending: index < day.stops.length || undefined })
          return { ...day, stops }
        }),
      }
    }),

  seedDayStops: (dayId, seedStops) =>
    set((state) => {
      if (!state.route) return state
      const day = state.route.days.find((d) => d.id === dayId)
      if (!day || day.stops.length > 0) return state
      return { route: updateDay(state.route, dayId, (d) => ({ ...d, stops: seedStops })) }
    }),

  regenerateDayStops: (dayId, orderedStops) =>
    set((state) => {
      if (!state.route) return state
      // Regenerar el día: lo nuevo pasa a ser la ruta original (se avisa antes si tenía cambios).
      return { route: updateDay(state.route, dayId, (day) => ({ ...day, stops: retimeStops(orderedStops), originalSnapshot: null })) }
    }),

  checkInStop: (dayId, stopId) =>
    set((state) => {
      if (!state.route) return state
      const now = new Date().toISOString()
      return {
        route: updateDay(state.route, dayId, (day) => ({
          ...day,
          stops: day.stops.map((stop) => (stop.id === stopId ? { ...stop, checkedInAt: now, delayNotedAt: null } : stop)),
        })),
      }
    }),

  noteStopDelay: (dayId, stopId) =>
    set((state) => {
      if (!state.route) return state
      const now = new Date().toISOString()
      return {
        route: updateDay(state.route, dayId, (day) => ({
          ...day,
          stops: day.stops.map((stop) => (stop.id === stopId ? { ...stop, delayNotedAt: now } : stop)),
        })),
      }
    }),

  compressStopsFrom: (dayId, afterStopId, nowMin) =>
    set((state) => {
      if (!state.route) return state
      return {
        route: updateDay(state.route, dayId, (day) => {
          const index = day.stops.findIndex((stop) => stop.id === afterStopId)
          if (index === -1) return day
          const before = day.stops.slice(0, index + 1)
          const after = day.stops.slice(index + 1)
          let cursor = nowMin
          const compressedAfter = after.map((stop) => {
            const durationMinutes = Math.max(20, Math.round(stop.durationMinutes * 0.8))
            const time = minutesToTime(cursor)
            cursor += durationMinutes + Math.min(10, stop.walkingTimeToNextMinutes ?? 10)
            return { ...stop, time, durationMinutes }
          })
          return { ...day, stops: [...before, ...compressedAfter] }
        }),
      }
    }),

  confirmTransport: (dayId) =>
    set((state) => {
      if (!state.route) return state
      return {
        route: updateDay(state.route, dayId, (day) =>
          day.transport ? { ...day, transport: { ...day.transport, confirmed: true } } : day,
        ),
      }
    }),

  confirmHotel: (dayId) =>
    set((state) => {
      if (!state.route) return state
      return {
        route: updateDay(state.route, dayId, (day) =>
          day.hotel ? { ...day, hotel: { ...day.hotel, confirmed: true } } : day,
        ),
      }
    }),

  chooseTransportSegment: (dayId, alternative) =>
    set((state) => {
      if (!state.route) return state
      return {
        route: updateDay(state.route, dayId, (day) =>
          day.transport
            ? {
                ...day,
                transport: {
                  ...day.transport,
                  mode: alternative.mode,
                  durationLabel: alternative.durationLabel,
                  priceLabel: alternative.priceLabel,
                  searchUrl: alternative.searchUrl,
                  rentalPickupCity: alternative.rentalPickupCity,
                  rentalReturnCity: alternative.rentalReturnCity,
                  confirmed: true,
                },
              }
            : day,
        ),
      }
    }),

  resetTransportSegment: (dayId) =>
    set((state) => {
      if (!state.route) return state
      return {
        route: updateDay(state.route, dayId, (day) =>
          day.transport && day.transport.alternatives.length > 0 ? { ...day, transport: { ...day.transport, confirmed: false } } : day,
        ),
      }
    }),

  addBudgetItem: (item) =>
    set((state) => {
      if (!state.route) return state
      triggerBudgetFly(item.amount)
      return {
        route: { ...state.route, budget: recalculateBudgetTotal({ ...state.route.budget, items: [...state.route.budget.items, item] }) },
      }
    }),

  removeBudgetItem: (itemId) =>
    set((state) => {
      if (!state.route) return state
      return {
        route: {
          ...state.route,
          budget: recalculateBudgetTotal({
            ...state.route.budget,
            items: state.route.budget.items.filter((item) => item.id !== itemId),
          }),
        },
      }
    }),

  markDidntMakeCutAdded: (dayId, itemId) =>
    set((state) => {
      if (!state.route) return state
      return {
        route: updateDay(state.route, dayId, (day) => ({
          ...day,
          didntMakeCut: day.didntMakeCut?.map((item) => (item.id === itemId ? { ...item, added: true } : item)),
        })),
      }
    }),

  addSpareStop: (dayId, stopId) => {
    const day = get().route?.days.find((other) => other.id === dayId)
    const spare = day?.spareStops?.find((stop) => stop.id === stopId)
    if (!day || !spare) return
    const { spareReason: _reason, ...stop } = spare
    void _reason
    get().insertStopAt(dayId, spareInsertIndex(day.stops, stop), { ...stop, addedByUser: true })
    set((state) => (state.route ? { route: updateDay(state.route, dayId, (current) => ({ ...current, spareStops: (current.spareStops ?? []).filter((other) => other.id !== stopId) })) } : state))
  },
  applyAdjustedDay: (dayId, day) =>
    set((state) =>
      state.route
        ? {
            route: reapplyReservations(
              { ...state.route, days: state.route.days.map((other) => (other.id === dayId ? { ...day, id: other.id, dayNumber: other.dayNumber, colorIndex: other.colorIndex, originalSnapshot: other.originalSnapshot ?? null } : other)) },
              state.reservations,
            ),
          }
        : state,
    ),
  applyRainPlan: (dayId) =>
    set((state) => {
      const day = state.route?.days.find((other) => other.id === dayId)
      if (!state.route || !day?.rainPlan || day.rainBackup) return state
      const plan = day.rainPlan
      const norm = (text: string) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
      const out = plan.remove.map(norm)
      let stops = day.stops.filter((stop) => stop.reservedId || !out.some((name) => name && (norm(stop.name) === name || norm(stop.name).includes(name))))
      for (const entering of plan.add) {
        if (stops.some((stop) => stop.id === entering.id)) continue
        stops = [...stops]
        stops.splice(spareInsertIndex(stops, entering), 0, { ...entering, nextLegPending: true })
      }
      return { route: updateDay(state.route, dayId, (current) => ({ ...current, stops, rainBackup: { stops: current.stops } })) }
    }),
  revertRainPlan: (dayId) =>
    set((state) => (state.route ? { route: updateDay(state.route, dayId, (current) => (current.rainBackup ? { ...current, stops: current.rainBackup.stops, rainBackup: null } : current)) } : state)),

  addToWishlist: (item) => set((state) => ({ wishlist: [...state.wishlist, item] })),
  removeFromWishlist: (itemId) => set((state) => ({ wishlist: state.wishlist.filter((item) => item.id !== itemId) })),
  setDevSimulatedTodayIso: (iso) => set({ dev_simulated_today_iso: iso }),

  setAccommodationHotel: (segmentDayId, hotel) =>
    set((state) => {
      const next = { ...state.accommodationSelections }
      if (hotel) next[segmentDayId] = hotel
      else delete next[segmentDayId]

      if (!state.route) return { accommodationSelections: next }
      const segment = buildDestinationSegments(state.route.days).find((candidate) => candidate.dayIds[0] === segmentDayId)
      const budgetId = `budget-accommodation-${segmentDayId}`
      const budget = linkBudgetItem(
        state.route.budget,
        budgetId,
        hotel && segment
          ? { icon: '🏨', label: `${hotel.name} (${segment.city})`, amount: hotel.pricePerNight * segment.nights, category: 'route', sourceType: 'hotel', refId: segmentDayId }
          : null,
      )
      if (hotel && segment) triggerBudgetFly(hotel.pricePerNight * segment.nights)
      return { accommodationSelections: next, route: { ...state.route, budget } }
    }),

  setTransportBooking: (dayId, booking) =>
    set((state) => {
      const next = { ...state.transportBookings }
      if (booking) next[dayId] = booking
      else delete next[dayId]

      if (!state.route) return { transportBookings: next }
      const budgetId = `budget-transport-${dayId}`
      const budget = linkBudgetItem(
        state.route.budget,
        budgetId,
        booking ? { icon: '✈️', label: booking.operator, amount: booking.price, category: 'route', sourceType: 'flight', refId: dayId } : null,
      )
      if (booking) triggerBudgetFly(booking.price)
      return { transportBookings: next, route: { ...state.route, budget } }
    }),

  setInsuranceBooking: (booking) =>
    set((state) => {
      if (!state.route) return { insuranceBooking: booking }
      const budget = linkBudgetItem(
        state.route.budget,
        'budget-insurance',
        booking ? { icon: '🛡', label: `Seguro — ${booking.provider}`, amount: booking.price, category: 'route', sourceType: 'other', refId: 'general-insurance' } : null,
      )
      if (booking) triggerBudgetFly(booking.price)
      return { insuranceBooking: booking, route: { ...state.route, budget } }
    }),

  setN26Added: (added) => set({ n26Added: added }),

  setRentalVehicleBooking: (booking) =>
    set((state) => {
      if (!state.route) return { rentalVehicleBooking: booking }
      const budget = linkBudgetItem(
        state.route.budget,
        'budget-rental-vehicle',
        booking
          ? { icon: '🚗', label: `Vehículo de alquiler — ${booking.provider}`, amount: booking.price, category: 'route', sourceType: 'other', refId: 'general-rental-vehicle' }
          : null,
      )
      if (booking) triggerBudgetFly(booking.price)
      return { rentalVehicleBooking: booking, route: { ...state.route, budget } }
    }),

  setEsimSelection: (countryCode, status) =>
    set((state) => {
      const next = { ...state.esimSelections }
      if (status) next[countryCode] = status
      else delete next[countryCode]
      return { esimSelections: next }
    }),

  setArrivalFlightTime: (time) =>
    set((state) => (state.route ? { route: { ...state.route, arrivalFlightTime: time } } : state)),
  setDepartureFlightTime: (time) =>
    set((state) => (state.route ? { route: { ...state.route, departureFlightTime: time } } : state)),
  setFlightAdjust: (choice) => set((state) => (state.route ? { route: { ...state.route, flightAdjust: choice } } : state)),
  setArrivalPointId: (kind, pointId) =>
    set((state) => (state.route ? { route: { ...state.route, [kind === 'arrival' ? 'arrivalPointId' : 'departurePointId']: pointId } } : state)),

  optimizeDayWithRealTransport: async (dayId, kind, flightTime) => {
    const state = get()
    if (!state.route) return
    const day = state.route.days.find((candidate) => candidate.id === dayId)
    if (!day || day.stops.length === 0) return
    const flightTimeMinutes = parseTimeToMinutes(flightTime)
    if (Number.isNaN(flightTimeMinutes)) return
    const optimized = await computeOptimizedDay(day, kind, flightTimeMinutes)
    set((current) => (current.route ? { route: updateDay(current.route, dayId, (d) => ({ ...d, ...optimized })) } : current))
  },

  fitDayToTrip: async (dayId, kind, keyMinutes) => {
    const state = get()
    if (!state.route) return
    const day = state.route.days.find((candidate) => candidate.id === dayId)
    if (!day || day.stops.length === 0) return
    let optimized: { stops: Stop[]; didntMakeCut?: DidntMakeCutItem[] }
    if (kind === 'departure') {
      // La vuelta no rehace el día: las horas del motor se quedan y sale lo que acaba después de la hora de salir.
      const fits = (stop: Stop) => {
        const start = parseTimeToMinutes(stop.time ?? '')
        return Number.isNaN(start) || start + stop.durationMinutes <= keyMinutes
      }
      const overflow = day.stops.filter((stop) => !fits(stop))
      optimized = { stops: day.stops.filter(fits), didntMakeCut: [...(day.didntMakeCut ?? []), ...overflowToDidntMakeCut(overflow)] }
    } else {
      // La llegada sí: el día empieza a la hora en el centro (optimizeDayWithRealTransport suma 60 min de traslado).
      optimized = await computeOptimizedDay(day, 'arrival', keyMinutes - 60)
    }
    // Las comidas siguen a las paradas (la de las 13:30 no puede pisar el Coliseo que ahora empieza a las 12:30).
    const meals = fitMealsToStops(day.meals, optimized.stops, kind === 'arrival' ? { from: keyMinutes } : { until: keyMinutes })
    // Es un cambio del viajero: el día guarda su copia («Volver al día original») y la varita sale.
    set((current) => {
      if (!current.route) return current
      const updated = updateDay(current.route, dayId, (d) => {
        const { originalSnapshot, ...plain } = d
        return { ...d, ...optimized, meals, originalSnapshot: originalSnapshot ?? (JSON.parse(JSON.stringify(plain)) as DayPlan) }
      })
      return { route: { ...updated, editedManually: true } }
    })
  },
}))

// Lo que cuenta como "el viajero ha cambiado la ruta a mano" (PROMPT_PENDIENTE G): si luego pone fechas desde el mapa,
// antes de rehacerla se le pregunta. Se envuelven las acciones en vez de marcarlo en cada una.
const MANUAL_EDIT_ACTIONS = [
  'convertDayType', 'selectDayExcursion', 'declineHalfDayExcursion', 'addBlankDayExcursion', 'placeExcursion', 'addReservation', 'removeStop', 'reorderStops', 'reorderDays', 'deleteDay',
  'addFreeDay', 'removeFreeDay', 'renameDay', 'moveFreeDay',
  'moveStopToDay', 'updateStopTime', 'addStop', 'replaceStop', 'insertStopAt', 'seedDayStops',
  'markDidntMakeCutAdded', 'addPlaceToDay', 'setMealRestaurant',
] as const
for (const name of MANUAL_EDIT_ACTIONS) {
  const original = useRouteStore.getState()[name] as (...args: unknown[]) => unknown
  useRouteStore.setState({
    [name]: (...args: unknown[]) => {
      const before = useRouteStore.getState().route
      const result = original(...args)
      const after = useRouteStore.getState().route
      if (!after || after === before) return result
      // La copia del día que dio el motor, antes del primer cambio (solo en los días nuestros, no en los libres).
      const beforeDays = new Map((before?.days ?? []).map((day) => [day.id, day]))
      const days = after.days.map((day) => {
        const previous = beforeDays.get(day.id)
        if (!previous || previous === day || day.originalSnapshot || (previous.dayType ?? 'normal') === 'manual') return day
        // (Solo cambia el número porque se movió otro día: no es un cambio del día.)
        if (JSON.stringify({ ...previous, dayNumber: 0 }) === JSON.stringify({ ...day, dayNumber: 0 })) return day
        const { originalSnapshot: _ignored, ...plain } = previous
        void _ignored
        return { ...day, originalSnapshot: JSON.parse(JSON.stringify(plain)) as DayPlan }
      })
      useRouteStore.setState({ route: { ...after, days, editedManually: true } })
      return result
    },
  } as Partial<RouteStoreState>)
}
