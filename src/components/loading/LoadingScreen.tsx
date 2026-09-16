import { useEffect } from 'react'
import { motion } from 'framer-motion'
import type { GenerationPhase, SkeletonDay } from '../../lib/routeGenerationOrchestrator'
import { addDaysToIso, formatShortDateEs } from '../../lib/dateRange'

interface LoadingScreenProps {
  origin: string
  destination: string
  status: 'loading' | 'done' | 'error'
  /** Fase real del pipeline (esqueleto → lugares → bloques de días → done), ver GenerationResumeState en routeGenerationOrchestrator.ts. El paso 1 ("Creando tu viaje") ya está resuelto antes de llegar a esta pantalla (arquetipo/transporte), así que siempre se muestra completo desde el primer render. */
  phase: GenerationPhase
  /** Nº total de bloques de días que va a procesar el pipeline — 0 mientras no se conoce todavía (antes de que resuelva el esqueleto). */
  totalBlocks: number
  /** Días del esqueleto (con day_number real) — para poder generar un sub-paso por bloque cuando hay más de BLOCK_STEP_THRESHOLD. */
  skeletonDays: Pick<SkeletonDay, 'day_number'>[]
  /** day_number de los bloques que YA han terminado de verdad (ver generated.days en el checkpoint) — cada uno marca su propio check, independiente de los demás, porque los bloques se lanzan todos en paralelo. */
  completedDayNumbers: number[]
  /** Fecha de inicio del viaje si el usuario la fijó — para mostrar la fecha real de cada bloque en vez de solo "día N". */
  tripStartIso?: string
  errorMessage?: string
  onFinish: () => void
  onRetry: () => void
}

type StepIconProps = { className?: string }

function SuitcaseIcon({ className }: StepIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  )
}

function CompassIcon({ className }: StepIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.5 13 13l-3.5 1.5L11 11l3.5-1.5z" />
    </svg>
  )
}

function SlidersIcon({ className }: StepIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h14M22 18h0" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  )
}

function ClockIcon({ className }: StepIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  )
}

function PinListIcon({ className }: StepIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 21s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.3" />
    </svg>
  )
}

function RouteIcon({ className }: StepIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="5" cy="6" r="2.2" />
      <circle cx="19" cy="18" r="2.2" />
      <path d="M6.8 7.6 12 12l-1 4 3-1.5 1.2 3.5" />
    </svg>
  )
}

function CheckIcon({ className }: StepIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

interface StepDef {
  icon: (props: StepIconProps) => JSX.Element
  circleClass: string
  title: string
  subtitle: string
}

type RowState = 'done' | 'active' | 'pending'

interface StepRowDef extends StepDef {
  key: string
  state: RowState
}

/** Por encima de esto, "Ajustando tu ritmo" se desdobla en un sub-paso por bloque de día en vez de un único paso — por debajo, un viaje corto sigue viéndose como un solo paso, igual que antes. */
const BLOCK_STEP_THRESHOLD = 5

function formatBlockDayLabel(dayNumber: number, tripStartIso: string | undefined): string {
  if (!tripStartIso) return `día ${dayNumber}`
  return formatShortDateEs(addDaysToIso(tripStartIso, dayNumber - 1))
}

/**
 * El paso "Ajustando tu ritmo" es el único dinámico — representa los bloques de días del pipeline
 * (ver generate-day-block en server/index.js), que se lanzan TODOS en paralelo (ver
 * routeGenerationOrchestrator.ts), no uno detrás de otro. Por eso, en cuanto se conoce el nº de
 * bloques (fase 'blocks' o posterior), cada bloque que supere BLOCK_STEP_THRESHOLD se muestra como
 * su propio sub-paso, con su check marcándose de forma independiente según su llamada responda —
 * varios pueden estar "activos" (girando) a la vez, reflejando que de verdad están en marcha
 * simultáneamente. Viajes de hasta ese umbral de bloques siguen viéndose como el único paso de
 * siempre, sin desdoblar nada.
 */
function buildBlockSteps(
  phase: GenerationPhase,
  totalBlocks: number,
  skeletonDays: Pick<SkeletonDay, 'day_number'>[],
  completedDayNumbers: number[],
  tripStartIso: string | undefined,
): StepRowDef[] {
  const reachedBlocks = phase === 'blocks' || phase === 'done'
  const singleStep: StepRowDef = {
    key: 'blocks-single',
    icon: ClockIcon,
    circleClass: 'bg-sky-400',
    title: 'Ajustando tu ritmo',
    subtitle: 'Organizando el mejor viaje de tu vida',
    state: reachedBlocks && (phase === 'done' || completedDayNumbers.length >= totalBlocks) ? 'done' : reachedBlocks ? 'active' : 'pending',
  }

  if (!reachedBlocks || totalBlocks <= BLOCK_STEP_THRESHOLD) return [singleStep]

  const completed = new Set(completedDayNumbers)
  return skeletonDays.map(
    (day): StepRowDef => ({
      key: `block-day-${day.day_number}`,
      icon: ClockIcon,
      circleClass: 'bg-sky-400',
      title: `Organizando tu ${formatBlockDayLabel(day.day_number, tripStartIso)}`,
      subtitle: 'Paradas, comidas y consejos de ese día',
      state: completed.has(day.day_number) ? 'done' : 'active',
    }),
  )
}

function buildSteps(
  destination: string,
  phase: GenerationPhase,
  totalBlocks: number,
  skeletonDays: Pick<SkeletonDay, 'day_number'>[],
  completedDayNumbers: number[],
  tripStartIso: string | undefined,
  allDone: boolean,
): StepRowDef[] {
  const reachedSkeleton = phase === 'places' || phase === 'blocks' || phase === 'done'
  const reachedPlaces = phase === 'blocks' || phase === 'done'
  const reachedBlocks = phase === 'blocks' || phase === 'done'

  return [
    { key: 'step-1', icon: SuitcaseIcon, circleClass: 'bg-orange-400', title: 'Creando tu viaje', subtitle: 'Preparando todo', state: 'done' },
    {
      key: 'step-2',
      icon: CompassIcon,
      circleClass: 'bg-rose-400',
      title: `Diseñando tu viaje a ${destination}`,
      subtitle: 'Definiendo la forma de cada día',
      state: reachedSkeleton ? 'done' : 'active',
    },
    {
      key: 'step-2b',
      icon: PinListIcon,
      circleClass: 'bg-amber-400',
      title: 'Eligiendo los imprescindibles',
      subtitle: 'Ni un solo lugar top se queda fuera',
      state: reachedPlaces ? 'done' : reachedSkeleton ? 'active' : 'pending',
    },
    {
      key: 'step-3',
      icon: SlidersIcon,
      circleClass: 'bg-fuchsia-400',
      title: 'Aplicando tus preferencias',
      subtitle: 'Ajustando según tu vehículo y compañía',
      state: reachedBlocks ? 'done' : reachedPlaces ? 'active' : 'pending',
    },
    ...buildBlockSteps(phase, totalBlocks, skeletonDays, completedDayNumbers, tripStartIso),
    {
      key: 'step-5',
      icon: RouteIcon,
      circleClass: 'bg-emerald-400',
      title: 'Optimizando tu ruta',
      subtitle: 'Reduciendo tiempo entre paradas',
      state: allDone ? 'done' : phase === 'done' ? 'active' : 'pending',
    },
  ]
}

function StepRow({ step }: { step: StepRowDef }) {
  const { state } = step
  const Icon = step.icon
  return (
    <motion.div
      layout
      className={`flex items-center gap-3 rounded-onb-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm transition-opacity ${state === 'pending' ? 'opacity-40' : 'opacity-100'}`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white ${step.circleClass}`}>
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1 text-left">
        <p className="truncate font-dmsans text-small font-semibold text-white">{step.title}</p>
        <p className="truncate font-dmsans text-caption text-white/60">{step.subtitle}</p>
      </div>

      <span className="flex h-6 w-6 shrink-0 items-center justify-center">
        {state === 'done' && (
          <motion.span initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-onb-accent">
            <CheckIcon className="h-5 w-5" />
          </motion.span>
        )}
        {state === 'active' && (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
            className="block h-4 w-4 rounded-full border-2 border-white/20 border-t-onb-accent"
          />
        )}
        {state === 'pending' && <span className="block h-3.5 w-3.5 rounded-full border-2 border-white/20" />}
      </span>
    </motion.div>
  )
}

/** Código decorativo de 3 letras derivado del nombre (no es un código IATA real) — para la línea
    de progreso origen→destino del avión, ver PlaneProgress más abajo. */
function threeLetterCode(name: string): string {
  const cleaned = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z]/g, '')
  return (cleaned.slice(0, 3) || '···').toUpperCase()
}

function PlaneIcon({ className }: StepIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2.5 1.5V22l3.5-1 3.5 1v-1.5L12 19v-5.5z" />
    </svg>
  )
}

/** Línea de progreso con avión viajando origen→destino — el porcentaje viene de los mismos pasos
    con progreso real de arriba (proporción de `done` sobre el total), nunca de un timer fijo: si
    un bloque tarda más de lo normal, el avión simplemente se queda quieto más tiempo en ese punto,
    reflejando la generación real en vez de una animación de mentira con tiempos inventados. */
function PlaneProgress({ origin, destination, steps }: { origin: string; destination: string; steps: StepRowDef[] }) {
  const doneCount = steps.filter((step) => step.state === 'done').length
  const progressPct = steps.length > 0 ? Math.min(100, Math.max(4, (doneCount / steps.length) * 100)) : 4

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center justify-between font-dmsans text-caption font-semibold tracking-wide text-white/70">
        <span>{threeLetterCode(origin)}</span>
        <span>{threeLetterCode(destination)}</span>
      </div>
      <div className="relative mt-2 h-px w-full bg-white/20">
        <motion.div
          className="absolute -top-2.5 flex h-5 w-5 -translate-x-1/2 items-center justify-center text-onb-accent"
          animate={{ left: `${progressPct}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <PlaneIcon className="h-4 w-4 rotate-90" />
        </motion.div>
      </div>
    </div>
  )
}

/**
 * Pantalla de generación de ruta — lista de pasos con progreso real (no una animación con tiempos
 * fijos): `phase`/`completedDayNumbers` llegan tras cada llamada del pipeline que de verdad termina
 * (anclas → esqueleto → bloques de días, lanzados EN PARALELO — ver runGeneration en
 * routeGenerationOrchestrator.ts). El paso "Ajustando tu ritmo" se desdobla en un sub-paso por
 * bloque cuando hay más de BLOCK_STEP_THRESHOLD (ver buildBlockSteps) — varios pueden verse "en
 * curso" a la vez, reflejando que de verdad están en marcha simultáneamente, no uno detrás de otro.
 * Si algún bloque tarda más de lo normal, su spinner simplemente sigue girando hasta que complete de
 * verdad — no hay timeout ni error prematuro aquí. Fondo degradado cálido como excepción puntual al
 * resto de la app (transmite "algo especial está pasando"); tipografía Plus Jakarta Sans heredada
 * del body, sin cambios.
 */
export function LoadingScreen({
  origin,
  destination,
  status,
  phase,
  totalBlocks,
  skeletonDays,
  completedDayNumbers,
  tripStartIso,
  errorMessage,
  onFinish,
  onRetry,
}: LoadingScreenProps) {
  useEffect(() => {
    if (status !== 'done') return
    const timeout = setTimeout(onFinish, 900)
    return () => clearTimeout(timeout)
  }, [status, onFinish])

  const steps = buildSteps(destination, phase, totalBlocks, skeletonDays, completedDayNumbers, tripStartIso, status === 'done')

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-onb-dark px-6 py-12 text-center">
      {status === 'error' ? (
        <div className="flex flex-col items-center gap-4">
          <p className="font-dmsans text-body text-white">⚠️ {errorMessage ?? 'No se pudo generar la ruta.'}</p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-onb-full bg-onb-accent px-5 py-2.5 font-dmsans text-body font-medium text-white transition-colors hover:bg-onb-accent-hover"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-1">
            <h1 className="font-playfair text-h2 font-bold text-white">Creando tu ruta</h1>
            <p className="font-dmsans text-small text-white/60">Esto puede tardar un minuto — no cierres la app.</p>
          </div>

          <PlaneProgress origin={origin} destination={destination} steps={steps} />

          <div className="w-full max-w-sm space-y-2.5">
            {steps.map((stepDef) => (
              <StepRow key={stepDef.key} step={stepDef} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
