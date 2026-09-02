import type { TransportOption } from '../../lib/types'
import { SelectedOptionCard } from './SelectedOptionCard'

interface TransportBannerProps {
  option: TransportOption
  /** Prefijo opcional antes del icono, ej. "Para llegar:". */
  prefix?: string
  /** true solo cuando hubo una elección real entre 2+ vías — si el sistema asumió la única opción posible, no hay nada que deshacer. */
  canChange: boolean
  onChange: () => void
}

/** Confirma la opción de transporte de llegada elegida — mecánica de UI genérica, reutilizable por cualquier arquetipo. */
export function TransportBanner({ option, prefix, canChange, onChange }: TransportBannerProps) {
  return <SelectedOptionCard icon={option.icon} label={option.title} prefix={prefix} canChange={canChange} onChange={onChange} />
}
