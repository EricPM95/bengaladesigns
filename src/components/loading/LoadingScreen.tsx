import { useEffect } from 'react'
import { motion } from 'framer-motion'

interface LoadingScreenProps {
  destination: string
  status: 'loading' | 'done' | 'error'
  /** Paso activo real (2-5) — cada uno corresponde a una llamada encadenada que de verdad ha terminado (anclas → esqueleto → bloques de días), ver computeLoadingStep en routeGenerationOrchestrator.ts. El paso 1 ("Creando tu viaje") ya está resuelto antes de llegar a esta pantalla (arquetipo/transporte), así que siempre se muestra completo desde el primer render. */
  step: number
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

function buildSteps(destination: string): StepDef[] {
  return [
    { icon: SuitcaseIcon, circleClass: 'bg-orange-400', title: 'Creando tu viaje', subtitle: 'Preparando todo' },
    {
      icon: CompassIcon,
      circleClass: 'bg-rose-400',
      title: `Buscando lo mejor de ${destination}`,
      subtitle: 'Encontrando anclas y experiencias para ti',
    },
    { icon: SlidersIcon, circleClass: 'bg-fuchsia-400', title: 'Aplicando tus preferencias', subtitle: 'Ajustando según tu vehículo y compañía' },
    { icon: ClockIcon, circleClass: 'bg-sky-400', title: 'Ajustando tu ritmo', subtitle: 'Organizando el mejor viaje de tu vida' },
    { icon: RouteIcon, circleClass: 'bg-emerald-400', title: 'Optimizando tu ruta', subtitle: 'Reduciendo tiempo entre paradas' },
  ]
}

type RowState = 'done' | 'active' | 'pending'

function StepRow({ step, state }: { step: StepDef; state: RowState }) {
  const Icon = step.icon
  return (
    <motion.div
      layout
      className={`flex items-center gap-3 rounded-2xl bg-white/70 p-3 shadow-sm backdrop-blur-sm transition-opacity ${state === 'pending' ? 'opacity-50' : 'opacity-100'}`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white ${step.circleClass}`}>
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-small font-semibold text-neutral-900">{step.title}</p>
        <p className="truncate text-caption text-neutral-600">{step.subtitle}</p>
      </div>

      <span className="flex h-6 w-6 shrink-0 items-center justify-center">
        {state === 'done' && (
          <motion.span initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-accent">
            <CheckIcon className="h-5 w-5" />
          </motion.span>
        )}
        {state === 'active' && (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
            className="block h-4 w-4 rounded-full border-2 border-neutral-300 border-t-accent"
          />
        )}
        {state === 'pending' && <span className="block h-3.5 w-3.5 rounded-full border-2 border-neutral-300" />}
      </span>
    </motion.div>
  )
}

/**
 * Pantalla de generación de ruta — lista de pasos con progreso real (no una animación con tiempos
 * fijos): `step` llega tras cada llamada encadenada que de verdad termina (anclas → esqueleto →
 * bloques de días — ver runGeneration/computeLoadingStep en routeGenerationOrchestrator.ts). Solo un
 * paso está "en curso" a la vez; si algún bloque tarda más de lo normal, su spinner simplemente
 * sigue girando hasta que complete de verdad — no hay timeout ni error prematuro aquí. Fondo
 * degradado cálido como excepción puntual al resto de la app (transmite "algo especial está
 * pasando"); tipografía Plus Jakarta Sans heredada del body, sin cambios.
 */
export function LoadingScreen({ destination, status, step, errorMessage, onFinish, onRetry }: LoadingScreenProps) {
  useEffect(() => {
    if (status !== 'done') return
    const timeout = setTimeout(onFinish, 900)
    return () => clearTimeout(timeout)
  }, [status, onFinish])

  const steps = buildSteps(destination)
  const effectiveStep = status === 'done' ? steps.length + 1 : step

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-br from-orange-200 via-rose-200 to-sky-100 px-6 py-12 text-center">
      {status === 'error' ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-body text-neutral-800">⚠️ {errorMessage ?? 'No se pudo generar la ruta.'}</p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl bg-accent px-5 py-2.5 text-body font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-1">
            <h1 className="font-display text-h2 font-bold text-neutral-900">Creando tu ruta</h1>
            <p className="text-small text-neutral-700">Esto puede tardar un minuto — no cierres la app.</p>
          </div>

          <div className="w-full max-w-sm space-y-2.5">
            {steps.map((stepDef, index) => {
              const stepNumber = index + 1
              const state: RowState = stepNumber < effectiveStep ? 'done' : stepNumber === effectiveStep ? 'active' : 'pending'
              return <StepRow key={stepDef.title} step={stepDef} state={state} />
            })}
          </div>
        </>
      )}
    </div>
  )
}
