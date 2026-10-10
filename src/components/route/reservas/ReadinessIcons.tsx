import type { ReadinessItemKind } from '../../../lib/readiness'
import type { NombreIcono } from '../../../lib/iconos'
import { Icono } from '../../ui/Icono'

interface IconProps {
  className?: string
}

const DEFAULT_CLASS = 'h-5 w-5'

/** El icono de cada cosa por reservar: los de la familia única (`src/lib/iconos.ts`). La excursión lleva la mochila. */
const READINESS_ICON: Record<ReadinessItemKind, NombreIcono> = {
  insurance: 'seguro',
  esim: 'esim',
  n26: 'tarjeta',
  transport: 'avion',
  accommodation: 'cama',
  'rental-vehicle': 'coche',
  entrada: 'reservas',
  excursion: 'excursion',
}

export function ReadinessKindIcon({ kind, className = DEFAULT_CLASS }: { kind: ReadinessItemKind; className?: string }) {
  return <Icono nombre={READINESS_ICON[kind]} className={className} />
}

export function EssentialsHeaderIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return <Icono nombre="hechoCirculo" className={className} />
}

export function DestinationHeaderIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return <Icono nombre="menu" className={className} />
}

export function CheckIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return <Icono nombre="hecho" className={className} grosor={2.4} />
}

export function PlusIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return <Icono nombre="anadir" className={className} grosor={2.4} />
}
