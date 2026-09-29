/** La varita mágica de "Volver a mi ruta original" y "Volver al día original": trazo fino, sin relleno. */
export function MagicWandIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
      <path d="m4 20 11-11" />
      <path d="m13 7 2-2 4 4-2 2z" />
      <path d="M6 4v3M4.5 5.5h3" />
      <path d="M18 14v3M16.5 15.5h3" />
      <path d="M11 2.5v2M10 3.5h2" />
    </svg>
  )
}
