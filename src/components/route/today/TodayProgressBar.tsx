interface TodayProgressBarProps {
  /** Parada actual en base 1 — total+1 cuando ya se ha hecho check-in en todas. */
  current: number
  total: number
}

export function TodayProgressBar({ current, total }: TodayProgressBarProps) {
  const done = Math.min(current - 1, total)
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="space-y-1.5 px-4">
      <p className="text-caption font-medium text-text-soft">
        Parada {Math.min(current, total)} de {total} hoy
      </p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-hover">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
