import { create } from 'zustand'
import type { MockHotelResult } from '../lib/mockAffiliateData'
import type { EsimStatus, GeneralBooking, TransportBooking } from '../lib/readiness'
import type {
  AccommodationMode,
  AppScreen,
  Budget,
  BudgetItem,
  DayPlan,
  DestinationArchetype,
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
import { minutesToTime, parseTimeToMinutes } from '../lib/time'
import { buildDestinationSegments } from '../lib/destinationSegments'
import { getTodayTripContext } from '../lib/todayMode'

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

function retimeStops(stops: Stop[]): Stop[] {
  if (stops.length === 0) return stops
  let cursor = parseTimeToMinutes(stops[0].time)
  return stops.map((stop) => {
    const time = minutesToTime(cursor)
    cursor += stop.durationMinutes + (stop.walkingTimeToNextMinutes ?? 15)
    return { ...stop, time }
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
  /** Lugares concretos sugeridos por Claude para el destino — ver /api/suggest-places. Vacío mientras no se ha resuelto. */
  suggested_places: PlaceCandidate[]
  suggested_places_loading: boolean
  suggested_places_failed: boolean
  /** Con qué conjunto de experiencias se pidió el `suggested_places` actual — permite precargar en cuanto se conoce el destino (ver suggestPlacesInBackground.ts) y detectar en "Ver lugares" si ese resultado ya sirve o si el viajero cambió su selección y hace falta pedirlo de nuevo. */
  suggested_places_source_ids: ExperienceId[]
  /** ids de `suggested_places` que el viajero marcó — entran en la generación como anclas de alta prioridad (ver must_include_places). */
  selected_place_ids: string[]

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
  setSuggestedPlaces: (places: PlaceCandidate[], sourceIds: ExperienceId[]) => void
  setSuggestedPlacesLoading: (loading: boolean) => void
  setSuggestedPlacesFailed: (failed: boolean) => void
  toggleSelectedPlace: (placeId: string) => void
  /** "Selecciona todo" — si ya están todos marcados, los desmarca todos; si no, los marca todos. */
  toggleSelectAllPlaces: () => void
  updateAnswers: (partial: Partial<QuestionnaireAnswers>) => void
  resetQuestionnaire: () => void

  setRoute: (route: Route) => void
  /** Restaura un viaje ya guardado (TripSync.tsx, al abrir la app) — a diferencia de `setRoute`, no resetea reservas/wishlist ni recalcula el modo inicial: repone exactamente lo que había. */
  hydrateTrip: (payload: TripPayload) => void
  setActiveDayId: (dayId: string | null) => void
  setMode: (mode: RouteMode) => void
  toggleDarkMode: () => void
  setIntensity: (intensity: number) => void
  setPanelSplit: (split: number) => void

  removeStop: (dayId: string, stopId: string) => void
  reorderStops: (dayId: string, orderedStopIds: string[]) => void
  moveStopToDay: (stopId: string, fromDayId: string, toDayId: string) => void
  updateStopTime: (dayId: string, stopId: string, newTime: string) => void
  addStop: (dayId: string, stop: Stop) => void
  replaceStop: (dayId: string, stopId: string, updates: Partial<Stop>) => void
  /** Inserta `stop` en la posición `index` exacta de `day.stops` (a diferencia de `addStop`, que siempre añade al final) — para el "+" entre paradas de DIAS. */
  insertStopAt: (dayId: string, index: number, stop: Stop) => void
  /** "Cristaliza" el pool de plantilla mock de un día en `Stop[]` reales, solo si el día aún no tiene ninguna parada real — ver seedStopsFromTemplate en mockDayDetail.ts. No hace nada si el día ya tiene paradas (nunca pisa ediciones existentes). */
  seedDayStops: (dayId: string, seedStops: Stop[]) => void

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

export const useRouteStore = create<RouteStoreState>((set) => ({
  screen: 'destination',
  destination: null,
  destinationPlace: null,
  archetype: null,
  is_region: null,
  archetype_ambiguous: false,
  archetype_classification_failed: false,
  requiere_coche: false,
  pase_dominante: null,
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
  suggested_places: [],
  suggested_places_source_ids: [],
  suggested_places_loading: false,
  suggested_places_failed: false,
  selected_place_ids: [],
  answers: {},
  route: null,
  activeDayId: null,
  mode: 'route',
  accommodationSelections: {},
  transportBookings: {},
  insuranceBooking: null,
  n26Added: false,
  rentalVehicleBooking: null,
  esimSelections: {},
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
      suggested_places: [],
      suggested_places_source_ids: [],
      suggested_places_loading: false,
      suggested_places_failed: false,
      selected_place_ids: [],
    }),
  setArchetype: (archetype, isRegion, requiereCoche = false, paseDominante = null) =>
    set({
      archetype,
      is_region: isRegion,
      archetype_ambiguous: false,
      archetype_classification_failed: false,
      requiere_coche: requiereCoche,
      pase_dominante: paseDominante,
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
      travel_pass_confirmed: null,
    }),
  setArchetypeClassificationFailed: (failed) => set({ archetype_classification_failed: failed }),
  resolveArchetypeChoice: (archetype) =>
    set({ archetype, archetype_ambiguous: false, requiere_coche: false, pase_dominante: null, travel_pass_confirmed: null }),
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
  setSuggestedPlaces: (places, sourceIds) =>
    set({ suggested_places: places, suggested_places_source_ids: sourceIds, suggested_places_loading: false, suggested_places_failed: false }),
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
  updateAnswers: (partial) => set((state) => ({ answers: { ...state.answers, ...partial } })),
  resetQuestionnaire: () =>
    set({
      answers: {},
      destination: null,
      destinationPlace: null,
      archetype: null,
      is_region: null,
      archetype_ambiguous: false,
      archetype_classification_failed: false,
      requiere_coche: false,
      pase_dominante: null,
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
      suggested_places: [],
      suggested_places_source_ids: [],
      suggested_places_loading: false,
      suggested_places_failed: false,
      selected_place_ids: [],
    }),

  setRoute: (route) =>
    set({
      route,
      // null (no route.days[0] fallback) para que la pestaña DIAS arranque con todos los
      // acordeones cerrados — RouteView.tsx sigue resolviendo route.days[0] como fallback para el
      // mapa y otros usos que sí necesitan un día "activo" siempre.
      activeDayId: null,
      // Si la fecha real de hoy cae dentro del viaje, la app abre directamente en Modo Hoy en vez
      // de en la pestaña RUTA — ver getTodayTripContext.
      mode: getTodayTripContext(route) ? 'today' : 'route',
      intensity: route.intensity,
      accommodationSelections: {},
      transportBookings: {},
      insuranceBooking: null,
      n26Added: false,
      rentalVehicleBooking: null,
      esimSelections: {},
      wishlist: [],
      dev_simulated_today_iso: null,
    }),

  hydrateTrip: (payload) =>
    set({
      screen: 'route',
      route: payload.route,
      accommodationSelections: payload.bookings.accommodationSelections,
      transportBookings: payload.bookings.transportBookings,
      insuranceBooking: payload.bookings.insuranceBooking,
      n26Added: payload.bookings.n26Added,
      rentalVehicleBooking: payload.bookings.rentalVehicleBooking,
      esimSelections: payload.bookings.esimSelections,
      wishlist: payload.wishlist,
      mode: payload.uiState.mode,
      activeDayId: payload.uiState.activeDayId,
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

  removeStop: (dayId, stopId) =>
    set((state) => {
      if (!state.route) return state
      return {
        route: updateDay(state.route, dayId, (day) => ({
          ...day,
          stops: day.stops.filter((stop) => stop.id !== stopId),
        })),
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
          return { ...day, stops: retimeStops(reordered) }
        }),
      }
    }),

  moveStopToDay: (stopId, fromDayId, toDayId) =>
    set((state) => {
      if (!state.route || fromDayId === toDayId) return state
      const fromDay = state.route.days.find((day) => day.id === fromDayId)
      const stop = fromDay?.stops.find((s) => s.id === stopId)
      if (!stop) return state
      return {
        route: {
          ...state.route,
          days: state.route.days.map((day) => {
            if (day.id === fromDayId) return { ...day, stops: day.stops.filter((s) => s.id !== stopId) }
            if (day.id === toDayId) return { ...day, stops: [...day.stops, stop] }
            return day
          }),
        },
      }
    }),

  updateStopTime: (dayId, stopId, newTime) =>
    set((state) => {
      if (!state.route) return state
      return {
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
        route: updateDay(state.route, dayId, (day) => ({ ...day, stops: [...day.stops, stop] })),
      }
    }),

  replaceStop: (dayId, stopId, updates) =>
    set((state) => {
      if (!state.route) return state
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
          const stops = [...day.stops]
          stops.splice(index, 0, stop)
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
}))
