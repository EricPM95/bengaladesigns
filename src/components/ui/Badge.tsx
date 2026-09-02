import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'accent' | 'warm'
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-bg-hover text-text-soft',
  accent: 'bg-accent-soft text-accent-hover',
  warm: 'bg-accent-warm/15 text-accent-warm',
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-caption font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  )
}
