interface FlagIconProps {
  /** Código ISO de país en minúsculas (ej. "es") — null/undefined no renderiza nada. */
  countryCode: string | null | undefined
  className?: string
}

/**
 * Bandera SVG vía `flag-icons` (CSS puro, sprite por país) — reemplaza el emoji de "regional
 * indicator symbols", que algunos SO/navegadores (Windows Chrome) renderizan como texto plano
 * ("ES", "IT") en vez de la bandera.
 */
export function FlagIcon({ countryCode, className = '' }: FlagIconProps) {
  if (!countryCode || countryCode.length !== 2) return null
  return <span aria-hidden="true" className={`fi fi-${countryCode.toLowerCase()} rounded-[2px] ${className}`} />
}
