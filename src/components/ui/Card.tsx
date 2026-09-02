import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-2xl border border-border bg-bg-card shadow-sm ${className}`}>
      {children}
    </div>
  )
}
