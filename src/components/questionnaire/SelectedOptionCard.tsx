interface SelectedOptionCardProps {
  icon: string
  label: string
  /** Prefijo opcional antes del icono, ej. "Para llegar:" / "Para moverte:". */
  prefix?: string
  /** true solo cuando hubo una elección real entre 2+ opciones — si el sistema la asumió/forzó sin preguntar, no hay nada que deshacer. */
  canChange: boolean
  onChange: () => void
}

/**
 * Tarjeta destacada con check para confirmar la opción elegida en CUALQUIER selector de opción
 * única de la app (transporte de llegada, vehículo, propiedad del vehículo, etc.) — comportamiento
 * estándar, no específico de una pantalla. "Cambiar" no lleva icono, solo texto en cursiva.
 */
export function SelectedOptionCard({ icon, label, prefix, canChange, onChange }: SelectedOptionCardProps) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-accent bg-accent-soft px-4 py-3">
      <span className="flex items-center gap-2 text-body font-medium text-accent-hover">
        {prefix && <span className="font-normal text-text-soft">{prefix}</span>}
        <span className="text-lg leading-none">{icon}</span>
        <span>{label}</span>
        <span aria-hidden="true">✓</span>
      </span>
      {canChange && (
        <button type="button" onClick={onChange} className="shrink-0 text-small font-medium italic text-accent hover:text-accent-hover">
          Cambiar
        </button>
      )}
    </div>
  )
}
