/** La varita de «Recuperar mi ruta»: una varita con una chispa de cuatro puntas, trazo fino y sin relleno (estilo de los iconos de la app). */
export function MagicWandIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
      <path d="m3.5 20.5 9.2-9.2" />
      <path d="m11.2 7.8 5 5" />
      <path d="M17.5 2.8c.4 2.2 1.2 3 3.4 3.4-2.2.4-3 1.2-3.4 3.4-.4-2.2-1.2-3-3.4-3.4 2.2-.4 3-1.2 3.4-3.4Z" />
      <path d="M6.5 3.8v2.6M5.2 5.1h2.6" />
      <path d="M18.5 15.3v2.6M17.2 16.6h2.6" />
    </svg>
  )
}
