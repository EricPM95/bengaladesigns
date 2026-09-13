interface LocalSecretBoxProps {
  children: string
}

/** Fondo lila, icono de ojo, "SECRETO LOCAL:" en negrita al inicio — mismo patrón que TipBox.tsx
    (bombilla/ámbar, tip práctico) pero con su propia identidad visual para el tip "efecto WOW": algo
    que no sale en las guías, pensado para sorprender, no solo para ser útil. */
export function LocalSecretBox({ children }: LocalSecretBoxProps) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-accent-lilac px-3 py-2.5 text-small text-text">
      <span aria-hidden="true" className="mt-0.5 shrink-0">
        👁️
      </span>
      <p>
        <span className="font-bold">SECRETO LOCAL:</span> {children}
      </p>
    </div>
  )
}
