import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ExperienceCategoryId, Place } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'
import { classifyInBackground } from '../../lib/classifyInBackground'
import { suggestExperiencesInBackground } from '../../lib/suggestExperiencesInBackground'
import { suggestPlacesOnDemand } from '../../lib/suggestPlacesOnDemand'
import { deriveLegacyExperienceIds } from '../../lib/experienceCategoryBank'
import { fetchPoolLevel, type PoolPlace } from '../../lib/placePoolCache'
import { prefetchPoolPhotos } from '../../lib/placePhoto'
import { seasonOfMonth } from '../../lib/season'
import { useRouteGeneration } from '../../lib/useRouteGeneration'
import { useSyncStore } from '../../store/useSyncStore'
import { poolSelectionLimit } from '../questionnaire/CuratedPlacesPool'
import { cityCode } from './cityCode'
import { DECOR_ROUTES, LIGHTS, P, arcBetween, loadLand } from './worldMap'
import { ACCENT, AMBER, INK, ORO_CLARO, SEASON_FX, SeasonFx, SERIF, MONO, THEME } from './trazoUi'
import { PrimeraPantalla } from './PrimeraPantalla'
import { StepTransport } from './StepTransport'
import { StepDates } from './StepDates'
import { StepCompanion } from './StepCompanion'
import { StepExperiences } from './StepExperiences'
import { StepPool } from './StepPool'
import { StepSummary } from './StepSummary'
import { StepElegir } from './StepElegir'
import { StepManualSummary } from './StepManualSummary'
import { STEP, backStepFrom, isSummaryStep, shouldGenerateRoute, shouldSuggestExperiences, stepAfterChoice, stepCounterLabel, visibleStepNamesFor, usesExperiences, usesPool, type PlanChoice } from './planChoice'
import { buildManualRoute, transportContextOf } from '../../lib/manualRoute'
import './trazo.css'
import { textoDeDuracion } from '../../lib/duracionViaje'
import { Icono } from '../ui/Icono'
import { LogoPequeno } from '../ui/LogoJutrip'
import { marca } from '../../lib/marca'

/** Lo que tarda el aviso corto de la pantalla de elegir antes de pasar a la pantalla siguiente. */
const MS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
/** Posiciones y ritmos al azar de las partículas de estación (una vez por carga). */
const PARTS = Array.from({ length: 26 }, () => [Math.random(), Math.random(), Math.random(), Math.random()])
const COMPANION: Record<string, string> = { solo: 'Solo', couple: 'En pareja', group: 'Con amigos', family: 'En familia' }
const samePlace = (a: Place | null | undefined, b: Place | null | undefined) =>
  Boolean(a && b && a.name === b.name && Math.abs(a.coordinates.lat - b.coordinates.lat) < 1e-4 && Math.abs(a.coordinates.lng - b.coordinates.lng) < 1e-4)

function useViewport() {
  const read = () => ({ w: window.innerWidth, h: window.innerHeight })
  const [size, setSize] = useState(read)
  useEffect(() => {
    const onResize = () => setSize(read())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

/**
 * El formulario de creación de viaje con el diseño "Trazo App" (Claude Design): siete pasos sobre un
 * mapa del mundo y el resumen final mientras se genera la ruta. Sustituye a LandingScreen + Questionnaire
 * sin tocar el motor: guarda exactamente los mismos campos en el store y lanza la misma generación.
 */
export function TrazoFlow() {
  const store = useRouteStore
  const answers = useRouteStore((state) => state.answers)
  const destinationName = useRouteStore((state) => state.destination)
  const storeDestinationPlace = useRouteStore((state) => state.destinationPlace)
  const transportOption = useRouteStore((state) => state.transport_option)
  const vehicleType = useRouteStore((state) => state.vehicle_type)
  const updateAnswers = useRouteStore((state) => state.updateAnswers)
  const trimCuratedPlaceSelection = useRouteStore((state) => state.trimCuratedPlaceSelection)

  const resumeTrip = useSyncStore((state) => state.resumeTrip)
  /** «Volver a mi viaje»: el viaje que se tenía abierto vuelve tal cual (su copia exacta y su fila), sin haber tocado nada. */
  const backToMyTrip = () => {
    if (!resumeTrip) return
    const sync = useSyncStore.getState()
    sync.setActiveTripId(resumeTrip.tripId)
    sync.setResumeTrip(null)
    store.getState().hydrateTrip(resumeTrip.payload)
  }
  const [step, setStep] = useState(0)
  const [maxStep, setMaxStep] = useState(0)
  const [origin, setOrigin] = useState<Place | null>(answers.originPlace ?? null)
  const [dest, setDest] = useState<Place | null>(storeDestinationPlace ?? null)
  const [prog, setProg] = useState(0)
  const [previewMonth, setPreviewMonth] = useState<number | null>(null)
  const [land, setLand] = useState('')
  const [curatedPool, setCuratedPool] = useState<PoolPlace[] | null | false>(null)
  /** Tanda 6y: quién monta el itinerario. Hasta que el viajero elige en la pantalla de elegir, ninguno. */
  const [plan, setPlan] = useState<PlanChoice | null>(null)
  const { w: vw, h: vh } = useViewport()

  const go = (next: number) => {
    setStep(next)
    setMaxStep((current) => Math.max(current, next))
  }

  useEffect(() => {
    loadLand().then(setLand)
  }, [])

  // El pool curado del destino (lectura del JSON, sin Claude).
  useEffect(() => {
    if (!destinationName) return
    let alive = true
    setCuratedPool(null)
    fetchPoolLevel(destinationName, 'pool').then((result) => {
      if (!alive) return
      setCuratedPool(result.found ? result.places : false)
      // Mientras el viajero rellena los pasos de antes, se traen en una petición las fotos ligeras del pool: al llegar, salen al momento.
      if (result.found) void prefetchPoolPhotos(destinationName, result.places.map((place) => place.name))
    })
    return () => {
      alive = false
    }
  }, [destinationName])

  // Si se acorta el viaje después de marcar lugares, lo que sobra del tope sale (igual que antes).
  useEffect(() => {
    trimCuratedPlaceSelection(poolSelectionLimit(answers.days))
  }, [answers.days, trimCuratedPlaceSelection])

  // La ruta se monta por detrás solo en el resumen de «hazla por mí»: en la ruta a mano nunca arranca (planChoice.ts).
  const generation = useRouteGeneration(shouldGenerateRoute(step, plan))

  // ---- acciones de cada paso ----
  const startTrip = () => {
    if (!origin || !dest) return
    const state = store.getState()
    const destChanged = !samePlace(state.destinationPlace, dest) || state.destination !== dest.name
    if (destChanged) {
      state.setDestination(dest.name, dest)
      // La clasificación se queda aquí: el paso de Transporte la necesita (arquetipo) en los dos caminos. Las sugerencias de experiencias y de lugares ya no
      // se lanzan aquí: solo con «¡Sí, hazla por mí!» (Tanda 6y2, choosePlan).
      classifyInBackground(dest.name)
    } else if (!samePlace(state.answers.originPlace, origin)) {
      // Mismo destino, otro origen: el transporte hay que volver a decidirlo.
      state.setTransportOption(null)
    }
    updateAnswers({ origin: origin.name, originPlace: origin })
    setProg(0)
    go(1)
  }

  const confirmDates = () => {
    const state = store.getState()
    state.setDatesConfirmed(true)
    go(STEP.compania)
  }

  /** La pantalla de elegir (Tanda 6y4): al tocar una tarjeta se pasa AL MOMENTO a la pantalla siguiente (experiencias o resumen corto), sin aviso ni espera. */
  const choosePlan = (choice: PlanChoice) => {
    // Las sugerencias de experiencias (y, tras ellas, la precarga de lugares) se piden SOLO con «hazla por mí»: la ruta a mano no las usa (Tanda 6y2).
    if (shouldSuggestExperiences(choice) && destinationName) {
      const state = store.getState()
      if (!state.suggested_experiences_loading && state.suggested_experiences.length === 0) suggestExperiencesInBackground(destinationName)
    }
    setPlan(choice)
    go(stepAfterChoice(choice))
  }

  /** «Empezar mi ruta»: la ruta con los días vacíos, sin Claude, sin motor y sin la caché de rutas. */
  const startManualRoute = () => {
    if (!destinationName) return
    const state = store.getState()
    state.setRoute(buildManualRoute({ destination: destinationName, destinationPlace: state.destinationPlace, answers: state.answers, transportContext: transportContextOf(state) }))
    state.setScreen('route')
  }

  const confirmExperiences = () => {
    if (!destinationName) return
    const experiencesPositive = answers.experiencesPositive?.length ? answers.experiencesPositive : (['imprescindibles'] as ExperienceCategoryId[])
    const experiences = deriveLegacyExperienceIds(experiencesPositive)
    // Sin pregunta de «¿Cómo son tus días?» (los medios días vendrán del vuelo) ni de la hora del Free Tour (de mañana, 10:00; se cambia desde RESERVAS).
    updateAnswers({ experiencesPositive, experiencesNegative: [], experiences, mediaJornada: undefined, freeTourDespues: undefined })
    // (Tanda 6y7) Con 1 día no hay paso de lugares: de las experiencias se va directo al resumen.
    if (!withPool) {
      go(STEP.resumen)
      return
    }
    // Destino no curado: se pide la sugerencia de lugares ya; curado: el pool del JSON, sin Claude.
    if (curatedPool === false) suggestPlacesOnDemand(destinationName, experiences)
    else store.getState().setPlacesStepStarted(true)
    go(STEP.lugares)
  }

  const openRoute = () => {
    if (!generation.route) return
    const state = store.getState()
    state.setRoute(generation.route)
    state.setScreen('route')
  }

  // Atrás: la pantalla de elegir vuelve a «quién viaja»; las experiencias y el resumen corto, a la pantalla de elegir (planChoice.ts).
  const back = () => {
    const previous = backStepFrom(step)
    if (previous === null) return
    go(previous)
  }
  const noBack = backStepFrom(step) === null

  const onProgress = useCallback((value: number) => setProg(value), [])

  // ---- mapa ----
  const desk = vw >= 520
  const W = desk ? 390 : vw
  const H = desk ? 844 : vh
  const side = desk && vw >= 980
  const zoom = desk ? Math.max(0.4, Math.min(1, (vh - 40) / 844)) : 1
  const mapPlaceO = origin
  const mapPlaceD = dest
  const view = useMemo(() => {
    let cx: number
    let cy: number
    let s: number
    if (mapPlaceO && mapPlaceD) {
      const a = P(mapPlaceO.coordinates.lat, mapPlaceO.coordinates.lng)
      const b = P(mapPlaceD.coordinates.lat, mapPlaceD.coordinates.lng)
      const dx = Math.abs(a[0] - b[0]) || 1
      const dy = Math.abs(a[1] - b[1]) || 1
      const len = Math.hypot(dx, dy)
      s = Math.max(0.4, Math.min((W * 0.6) / dx, (H * 0.2) / dy, 10))
      cx = (a[0] + b[0]) / 2
      cy = (a[1] + b[1]) / 2 - len * 0.1
    } else if (mapPlaceO || mapPlaceD) {
      const c = (mapPlaceO ?? mapPlaceD)!
      ;[cx, cy] = P(c.coordinates.lat, c.coordinates.lng)
      s = 3.2
    } else {
      ;[cx, cy] = P(38, -8)
      s = 1.3
    }
    return { s, tx: W / 2 - cx * s, ty: H * 0.42 - cy * s }
  }, [mapPlaceO, mapPlaceD, W, H])
  const arcT = step === 0 ? 0 : step === 1 ? prog : 1
  const arc = mapPlaceO && mapPlaceD ? arcBetween(P(mapPlaceO.coordinates.lat, mapPlaceO.coordinates.lng), P(mapPlaceD.coordinates.lat, mapPlaceD.coordinates.lng), arcT) : null
  const ends = [mapPlaceO, mapPlaceD]
    .filter((place): place is Place => Boolean(place))
    .map((place) => {
      const [x, y] = P(place.coordinates.lat, place.coordinates.lng)
      const isD = place === mapPlaceD
      return { x, y, isD, code: cityCode(place) }
    })
  // (La primera pantalla lleva su propio mapa; el de fondo aparece al pasar a Transporte y sigue con el avión.)
  const mapO = step === 0 ? 0 : step <= 1 ? 1 : step === 2 ? 0.5 : isSummaryStep(step) ? 0.55 : 0.18

  // ---- estación ----
  const previewSeason = previewMonth !== null ? seasonOfMonth(previewMonth) : null
  const curSeason = previewSeason ?? answers.season ?? null
  const ambientOf = (k: string) => (previewSeason === k ? 1 : !previewSeason && answers.season === k && step >= 3 ? THEME.amb : 0)

  // ---- cabecera y panel ----
  const oCode = cityCode(origin)
  const dCode = cityCode(dest)
  const modeName = transportOption
    ? transportOption.id === 'own_vehicle' || transportOption.includes_vehicle
      ? vehicleType === 'camper'
        ? 'Camper'
        : 'Coche'
      : transportOption.title
    : ''
  const datesV = answers.dateRange
    ? (() => {
        const [, sm, sd] = answers.dateRange.start.split('-').map(Number)
        const [, em, ed] = answers.dateRange.end.split('-').map(Number)
        return `${sd} ${MS[sm - 1]} – ${ed} ${MS[em - 1]}`
      })()
    : answers.days && answers.month !== undefined
      ? `${textoDeDuracion(answers.days)} · ${MONTHS[answers.month]}`
      : ''
  // Con la ruta a mano no hay experiencias ni lugares: ni en la barra, ni en el panel, ni en las fichas.
  const withExperiences = usesExperiences(plan)
  const withPool = usesPool(plan, answers.days)
  const stepNames = visibleStepNamesFor(plan, step, null, answers.days)
  const nExp = withExperiences ? (answers.experiencesPositive?.length ?? 0) : 0
  const expLabel = step > STEP.experiencias && nExp ? `${nExp} ${nExp === 1 ? 'experiencia' : 'experiencias'}` : ''
  const nPlaces = useRouteStore((state) => (withExperiences ? state.selected_curated_place_names.length + state.selected_place_ids.length : 0))
  const placesLabel = nPlaces ? `${nPlaces} ${nPlaces === 1 ? 'lugar' : 'lugares'}` : ''
  const reached = (i: number) => maxStep > i
  const vals = [
    origin && dest && reached(STEP.ruta) ? `${oCode} → ${dCode}` : '',
    reached(STEP.transporte) ? modeName : '',
    reached(STEP.fechas) ? datesV : '',
    reached(STEP.compania) && answers.companion ? COMPANION[answers.companion] : '',
    plan === 'manual' ? 'La hago yo' : plan === 'auto' ? 'Me la montáis' : '',
    expLabel,
    reached(STEP.lugares) ? placesLabel : '',
  ]
  const chips = [vals[0], vals[1], vals[2], reached(STEP.fechas) && answers.season ? SEASON_FX[answers.season].name : '', vals[3], plan === 'manual' ? 'Ruta a mano' : '', vals[5], vals[6]].filter(Boolean)

  const pt = desk ? 126 : 112
  const screen = (i: number, content: ReactNode) => {
    const d = i - step
    if (i > maxStep && d !== 0) return null
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 4,
          display: 'flex',
          flexDirection: 'column',
          padding: `${pt}px 20px 24px`,
          transition: 'opacity .7s ease,transform .9s cubic-bezier(.2,.8,.2,1),filter .7s ease',
          opacity: d === 0 ? 1 : 0,
          transform: d === 0 ? 'none' : d < 0 ? 'translateY(-28px) scale(1.04)' : 'translateY(40px) scale(.97)',
          filter: d === 0 ? 'none' : 'blur(10px)',
          pointerEvents: d === 0 ? 'auto' : 'none',
          visibility: Math.abs(d) > 1 ? 'hidden' : 'visible',
          // Móviles bajos: si algo no cabe, la pantalla se desplaza en vez de cortarse.
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
        className="trazo-noscroll"
        aria-hidden={d !== 0}
      >
        {content}
      </div>
    )
  }

  return (
    <div
      className={`trazo-root${previewSeason ? ' trazo-fx' : ''}`}
      style={{
        minHeight: '100dvh',
        background: `radial-gradient(ellipse 70% 60% at 60% 40%,${THEME.page1} 0%,${THEME.page2} 70%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 88,
        padding: desk ? 20 : 0,
        fontFamily: "'Geist',system-ui,sans-serif",
        color: INK,
      }}
    >
      {side && (
        <aside style={{ width: 330, color: INK, display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <LogoPequeno tam={26} />
            <span style={{ font: `500 10px/1 ${MONO}`, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(28,34,48,.62)' }}>{marca.lema}</span>
          </div>
          <h2 style={{ margin: 0, font: `400 50px/1 ${SERIF}`, letterSpacing: '-.01em', textWrap: 'balance' }}>
            Tu viaje se construye <em style={{ color: ACCENT }}>mientras eliges.</em>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {stepNames.map((name, i) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '9px 0', borderTop: `1px solid ${THEME.track}` }}>
                <span style={{ font: `500 11px ${MONO}`, color: i === step ? ACCENT : 'rgba(28,34,48,.45)', width: 22 }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ font: "400 15px 'Geist'", color: i === step ? INK : i < step ? 'rgba(28,34,48,.8)' : 'rgba(28,34,48,.45)', flex: 1, transition: 'color .4s' }}>{name}</span>
                <span style={{ font: "400 13px 'Geist'", color: 'rgba(28,34,48,.62)', maxWidth: 150, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vals[i]}</span>
              </div>
            ))}
          </div>
        </aside>
      )}

      <div style={{ zoom, flex: 'none' }}>
        <div
          style={{
            width: W,
            height: H,
            borderRadius: desk ? 52 : 0,
            boxShadow: desk ? '0 0 0 10px #151922,0 0 0 11px #2a2f3a,0 40px 120px rgba(0,0,0,.6)' : 'none',
            position: 'relative',
            overflow: 'hidden',
            background: THEME.bg,
            isolation: 'isolate',
          }}
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid slice"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: mapO,
              transition: 'opacity 1.2s ease',
              WebkitMaskImage: 'radial-gradient(ellipse 85% 62% at 50% 42%,#000 35%,transparent 100%)',
              maskImage: 'radial-gradient(ellipse 85% 62% at 50% 42%,#000 35%,transparent 100%)',
            }}
          >
            <g style={{ transform: `translate(${view.tx}px,${view.ty}px) scale(${view.s})`, transformOrigin: '0 0', transition: 'transform 1.9s cubic-bezier(.65,0,.2,1)' }}>
              {land && <path d={land} fillRule="evenodd" strokeWidth={0.8} vectorEffect="non-scaling-stroke" style={{ fill: THEME.land, stroke: THEME.landS }} />}
              {DECOR_ROUTES.map((route) => (
                <path key={route} d={route} fill="none" strokeWidth={1.2} strokeDasharray="3 6" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ stroke: THEME.route, animation: 'trazo-dash 3s linear infinite' }} />
              ))}
              {[0, 3, 6, 9].map((ri, i) => (
                <g key={ri}>
                  <path d="M5 0L-3.5-3.6-1.8 0-3.5 3.6Z" transform={`scale(${1.5 / view.s})`} style={{ fill: ACCENT }} />
                  <animateMotion dur={`${[16, 11, 19, 9][i]}s`} begin={`${-i * 3}s`} repeatCount="indefinite" rotate="auto" path={DECOR_ROUTES[ri]} />
                </g>
              ))}
              {LIGHTS.map(([la, lo]) => {
                const [x, y] = P(la, lo)
                return <circle key={`${la},${lo}`} cx={x} cy={y} r={1.1 / view.s} fill={THEME.dot} />
              })}
              {arc && step === 0 && <path d={arc.full} fill="none" stroke="rgba(181,138,46,.4)" strokeWidth={1} strokeDasharray="2 5" vectorEffect="non-scaling-stroke" />}
              {arc && arc.part && <path d={arc.part} fill="none" strokeWidth={2} strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ stroke: ACCENT }} />}
              {ends.map((end) => (
                <g key={`${end.code}-${end.isD}`}>
                  <circle cx={end.x} cy={end.y} r={(end.isD ? 11 : 8) / view.s} fill={AMBER} opacity={0.18} />
                  <circle cx={end.x} cy={end.y} r={3.6 / view.s} fill={end.isD ? AMBER : THEME.bg} strokeWidth={1.5} vectorEffect="non-scaling-stroke" style={{ stroke: ACCENT }} />
                  <text x={end.x} y={end.y - 12 / view.s} fontSize={10 / view.s} textAnchor="middle" style={{ fill: INK }} fontFamily="Geist Mono, monospace" letterSpacing=".08em">
                    {end.code}
                  </text>
                </g>
              ))}
              {step === 1 && arc && (
                <g>
                  <circle cx={arc.pt[0]} cy={arc.pt[1]} r={10 / view.s} fill={AMBER} opacity={0.3} />
                  <circle cx={arc.pt[0]} cy={arc.pt[1]} r={3.2 / view.s} fill="#fff" />
                </g>
              )}
            </g>
          </svg>

          {(['spring', 'summer', 'autumn', 'winter'] as const).map((k) => (
            <div key={k} style={{ position: 'absolute', inset: 0, background: SEASON_FX[k].gradient, opacity: ambientOf(k), transition: 'opacity 1.3s ease', pointerEvents: 'none' }} />
          ))}
          <div style={{ position: 'absolute', inset: 0, zIndex: previewSeason ? 9 : 'auto', opacity: previewSeason ? 1 : step >= 3 ? 0.3 : 0, transition: 'opacity 1.2s', pointerEvents: 'none' }}>
            {(['spring', 'summer', 'autumn', 'winter'] as const).map((k) => (
              <SeasonFx key={k} season={k} visible={curSeason === k ? 1 : 0} parts={PARTS} />
            ))}
          </div>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(180deg,rgb(${THEME.bgrgb} / .7) 0%,rgb(${THEME.bgrgb} / 0) 26%,rgb(${THEME.bgrgb} / 0) 50%,rgb(${THEME.bgrgb} / .8) 100%)`,
              pointerEvents: 'none',
            }}
          />

          {/* Cabecera: atrás, siete segmentos, n/7 y las fichas del viaje. (La primera pantalla lleva la suya, con el logo.) */}
          {step !== 0 && (
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, zIndex: 6, padding: `${desk ? 26 : 14}px 20px 0`, display: 'flex', flexDirection: 'column', gap: 12, pointerEvents: 'none' }}>
            {resumeTrip && !isSummaryStep(step) && (
              <button
                type="button"
                onClick={backToMyTrip}
                aria-label="Volver a mi viaje"
                style={{
                  // Fuera del flujo: no mueve nada del formulario. A la derecha, bajo la barra de pasos.
                  position: 'absolute',
                  right: 20,
                  top: desk ? 72 : 60,
                  zIndex: 7,
                  pointerEvents: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  height: 36,
                  padding: '0 14px 0 10px',
                  borderRadius: 999,
                  border: '1px solid rgba(28,34,48,.14)',
                  background: 'rgba(255,255,255,0.88)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  color: INK,
                  font: '600 13px Geist, sans-serif',
                  cursor: 'pointer',
                }}
              >
                <Icono nombre="cerrar" size={16} />
                Volver a mi viaje
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'auto' }}>
              <button
                type="button"
                onClick={back}
                aria-label="Atrás"
                style={{
                  width: 36,
                  height: 36,
                  flex: 'none',
                  borderRadius: '50%',
                  border: '1px solid rgba(28,34,48,.14)',
                  background: 'rgba(255,255,255,0.80)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  color: INK,
                  fontSize: 16,
                  cursor: 'pointer',
                  opacity: noBack ? 0 : 1,
                  pointerEvents: noBack ? 'none' : 'auto',
                  transition: 'opacity .4s',
                }}
              >
                ←
              </button>
              <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                {stepNames.map((name, i) => (
                  <div key={name} style={{ flex: 1, height: 3, borderRadius: 3, background: THEME.track, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: step > i ? '100%' : step === i ? (i === 1 ? `${Math.round(prog * 100)}%` : '30%') : '0%',
                        background: ORO_CLARO,
                        borderRadius: 3,
                        transition: 'width .6s cubic-bezier(.2,.8,.2,1)',
                      }}
                    />
                  </div>
                ))}
              </div>
              <span className="trazo-headtext" style={{ font: `500 11px ${MONO}`, letterSpacing: '.08em', color: 'rgba(28,34,48,.7)', minWidth: 30, textAlign: 'right' }}>{stepCounterLabel(step, stepNames)}</span>
            </div>
            <div
              className="trazo-noscroll"
              style={{
                display: 'flex',
                gap: 6,
                overflowX: 'auto',
                height: 28,
                pointerEvents: 'auto',
                WebkitMaskImage: 'linear-gradient(90deg,#000 82%,transparent)',
                maskImage: 'linear-gradient(90deg,#000 82%,transparent)',
              }}
            >
              {chips.length === 0 && <span style={{ height: 28, display: 'inline-flex', alignItems: 'center', font: "400 12px 'Geist'", color: 'rgba(28,34,48,.5)' }}>Tu viaje irá apareciendo aquí</span>}
              {chips.map((chip) => (
                <span
                  key={chip}
                  style={{
                    flex: 'none',
                    height: 28,
                    padding: '0 11px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.90)',
                    border: '1px solid rgba(28,34,48,.12)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    font: "500 12px 'Geist'",
                    color: INK,
                    whiteSpace: 'nowrap',
                    animation: 'trazo-chipIn .55s cubic-bezier(.2,.8,.2,1) both',
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: AMBER }} />
                  {chip}
                </span>
              ))}
            </div>
          </div>
          )}

          <div
            style={{ position: 'absolute', inset: 0, zIndex: 5, transition: 'opacity .7s ease', opacity: step === 0 ? 1 : 0, pointerEvents: step === 0 ? 'auto' : 'none', visibility: step === 0 ? 'visible' : 'hidden' }}
            aria-hidden={step !== 0}
          >
            <PrimeraPantalla
              origin={origin}
              destination={dest}
              onOrigin={setOrigin}
              onDestination={setDest}
              onNext={startTrip}
              ancho={W}
              alto={H}
              totalPasos={stepNames.length}
              onVolverAMiViaje={resumeTrip && !isSummaryStep(step) ? backToMyTrip : null}
            />
          </div>
          {screen(
            1,
            <StepTransport active={step === 1} origin={origin} destination={dest} destinationName={destinationName ?? dest?.name ?? ''} onProgress={onProgress} onNext={() => go(2)} />,
          )}
          {screen(
            2,
            <StepDates
              destinationName={destinationName ?? ''}
              days={answers.days}
              dateRange={answers.dateRange}
              month={answers.month}
              onChange={updateAnswers}
              onPreviewMonth={setPreviewMonth}
              onNext={confirmDates}
            />,
          )}
          {screen(
            3,
            <StepCompanion
              answers={answers}
              onChange={updateAnswers}
              onChangeVehicle={() => {
                const state = store.getState()
                state.setVehicleType(null)
                state.setVehicleResolved(false)
                go(1)
              }}
              onNext={() => go(STEP.elegir)}
            />,
          )}
          {screen(STEP.elegir, <StepElegir destinationName={destinationName ?? dest?.name ?? ''} days={answers.days} picked={null} onPick={choosePlan} />)}
          {/* «Quiero hacerla yo» no pasa por las experiencias ni por los lugares, ni monta ninguna ruta por detrás (Tanda 6y). */}
          {withExperiences &&
            screen(
              STEP.experiencias,
              <StepExperiences
                destinationName={destinationName ?? ''}
                season={answers.season}
                month={answers.month}
                dateRange={answers.dateRange}
                selected={answers.experiencesPositive ?? ['imprescindibles']}
                days={answers.days}
                onChange={(experiencesPositive) => updateAnswers({ experiencesPositive, experiences: deriveLegacyExperienceIds(experiencesPositive) })}
                onNext={confirmExperiences}
              />,
            )}
          {withPool && screen(STEP.lugares, <StepPool destinationName={destinationName ?? ''} days={answers.days} curatedPool={curatedPool} experiences={answers.experiences ?? []} onNext={() => go(STEP.resumen)} />)}
          {withExperiences &&
            screen(
              STEP.resumen,
              <StepSummary
                origin={origin}
                destination={dest}
                status={generation.status}
                checkpoint={generation.checkpoint}
                route={generation.route}
                errorMessage={generation.errorMessage}
                onRetry={generation.retry}
                onOpen={openRoute}
              />,
            )}
          {plan === 'manual' && screen(STEP.resumenCorto, <StepManualSummary origin={origin} destination={dest} onStart={startManualRoute} />)}
        </div>
      </div>
    </div>
  )
}
