import type { ReadinessItemKind } from '../../../lib/readiness'

interface IconProps {
  className?: string
}

const DEFAULT_CLASS = 'h-5 w-5'

function ShieldIcon({ className = DEFAULT_CLASS }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
    </svg>
  )
}

function SimCardIcon({ className = DEFAULT_CLASS }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 3h6l4 4v12a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V4.5A1.5 1.5 0 0 1 7.5 3H8z" />
      <rect x="9" y="9" width="6" height="5" rx="1" />
      <path d="M9 16h6" />
    </svg>
  )
}

function CreditCardIcon({ className = DEFAULT_CLASS }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10.5h18" />
      <path d="M6.5 15h4" />
    </svg>
  )
}

function PlaneIcon({ className = DEFAULT_CLASS }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2.5 1.5V22L12 21l4.5 1.5V20.5L14 19v-5.5l7 2.5z" />
    </svg>
  )
}

function HouseIcon({ className = DEFAULT_CLASS }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
      <path d="M10 20v-5h4v5" />
    </svg>
  )
}

function CarIcon({ className = DEFAULT_CLASS }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 16v-3.5L6.8 8a2 2 0 0 1 1.9-1.3h6.6A2 2 0 0 1 17.2 8L19 12.5V16" />
      <path d="M5 12.5h14" />
      <circle cx="8" cy="14.3" r="1" />
      <circle cx="16" cy="14.3" r="1" />
    </svg>
  )
}

const READINESS_ICON: Record<ReadinessItemKind, (props: IconProps) => JSX.Element> = {
  insurance: ShieldIcon,
  esim: SimCardIcon,
  n26: CreditCardIcon,
  transport: PlaneIcon,
  accommodation: HouseIcon,
  'rental-vehicle': CarIcon,
}

export function ReadinessKindIcon({ kind, className }: { kind: ReadinessItemKind; className?: string }) {
  const Icon = READINESS_ICON[kind]
  return <Icon className={className} />
}

export function EssentialsHeaderIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

export function DestinationHeaderIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  )
}

export function CheckIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function PlusIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
