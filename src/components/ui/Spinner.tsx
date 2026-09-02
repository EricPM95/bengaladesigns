interface SpinnerProps {
  className?: string
}

export function Spinner({ className = '' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={`inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  )
}
