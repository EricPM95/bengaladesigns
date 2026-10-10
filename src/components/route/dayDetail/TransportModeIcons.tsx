import type { TransportMode } from '../../../lib/mockDayDetail'
import { Icono } from '../../ui/Icono'

interface ModeIconProps {
  className?: string
}

/**
 * Iconos de modo de transporte — de la familia única (`src/lib/iconos.ts`): trazo fino, sin relleno, apoyo visual secundario, nunca protagonista.
 * A pie, autobús, coche/taxi, metro y tranvía. (La excursión lleva la mochila; el autobús aquí es el del trayecto urbano.)
 */
function WalkIcon({ className }: ModeIconProps) {
  return <Icono nombre="andando" className={className} />
}

function TransitIcon({ className }: ModeIconProps) {
  return <Icono nombre="bus" className={className} />
}

function DrivingIcon({ className }: ModeIconProps) {
  return <Icono nombre="coche" className={className} />
}

function MetroIcon({ className }: ModeIconProps) {
  return <Icono nombre="metro" className={className} />
}

function TramIcon({ className }: ModeIconProps) {
  return <Icono nombre="tranvia" className={className} />
}

/** Un tramo en transporte escrito («Bus 115», «Metro A», «Tranvía 8», «Un taxi»): su icono lineal, uno solo. */
export type TransitKind = 'bus' | 'metro' | 'tram' | 'taxi'
export function TransitKindIcon({ kind, className = 'h-4 w-4' }: { kind: TransitKind; className?: string }) {
  if (kind === 'metro') return <MetroIcon className={className} />
  if (kind === 'tram') return <TramIcon className={className} />
  if (kind === 'taxi') return <DrivingIcon className={className} />
  return <TransitIcon className={className} />
}

export function TransportModeIcon({ mode, className = 'h-4 w-4' }: { mode: TransportMode; className?: string }) {
  if (mode === 'walking') return <WalkIcon className={className} />
  if (mode === 'transit') return <TransitIcon className={className} />
  return <DrivingIcon className={className} />
}
