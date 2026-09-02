interface TipBoxProps {
  children: string
}

/** Fondo ámbar claro, icono de bombilla, "TIP:" en negrita al inicio — formato fijo para cualquier consejo práctico en la pestaña DIAS. */
export function TipBox({ children }: TipBoxProps) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-accent-gold/10 px-3 py-2.5 text-small text-text">
      <span aria-hidden="true" className="mt-0.5 shrink-0">
        💡
      </span>
      <p>
        <span className="font-bold">TIP:</span> {children}
      </p>
    </div>
  )
}
