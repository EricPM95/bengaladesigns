import { useRouteStore } from '../../store/useRouteStore'

const labels: Record<number, { name: string; description: string }> = {
  1: { name: 'Modo zen', description: 'Tranquilo y espacioso — solo lo esencial' },
  2: { name: 'Relajado', description: 'Un ritmo suave con margen para respirar' },
  3: { name: 'Equilibrado', description: 'Completo pero sin agobios' },
  4: { name: 'Activo', description: 'Días llenos, pero disfrutables' },
  5: { name: 'Modo explorador', description: 'De sol a sol — verlo todo' },
}

export function IntensitySlider() {
  const intensity = useRouteStore((state) => state.intensity)
  const setIntensity = useRouteStore((state) => state.setIntensity)
  const label = labels[intensity] ?? labels[3]

  return (
    <div className="px-4 py-4">
      <p className="text-body font-medium text-text">Intensidad del viaje</p>
      <input
        type="range"
        min={1}
        max={5}
        value={intensity}
        onChange={(event) => setIntensity(Number(event.target.value))}
        className="mt-2 w-full accent-accent"
      />
      <div className="flex justify-between text-caption text-text-muted">
        <span>Modo zen</span>
        <span>Modo explorador</span>
      </div>
      <p className="mt-1 text-small italic text-text-soft">
        "{label.name} — {label.description}"
      </p>
    </div>
  )
}
