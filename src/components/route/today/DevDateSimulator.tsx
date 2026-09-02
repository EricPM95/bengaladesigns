interface DevDateSimulatorProps {
  value: string | null
  onChange: (iso: string | null) => void
}

/** Solo desarrollo — simula qué día "es hoy" en Modo Hoy sin tocar el reloj del sistema, para poder probar el antes/durante/después del viaje y cualquier día concreto. */
export function DevDateSimulator({ value, onChange }: DevDateSimulatorProps) {
  return (
    <div className="mx-4 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-accent/40 bg-accent-soft/40 px-3 py-2 text-caption text-text-soft">
      <span>🧪 Simular fecha:</span>
      <input
        type="date"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
        className="rounded border border-border bg-bg px-1.5 py-0.5 text-caption text-text"
      />
      {value && (
        <button type="button" onClick={() => onChange(null)} className="font-medium text-accent hover:text-accent-hover">
          Usar fecha real
        </button>
      )}
    </div>
  )
}
