import { useDestinationExcursions } from '../../lib/destinationExcursions'

/**
 * La etiqueta pequeña de barrio («Trastevere», Tanda 6y4): una píldora lila suave con borde fino. El color vive en UN solo sitio (los tripletes `--barrio-lila*` de index.css, con su variante de noche) y
 * es distinto de los colores de los días (src/lib/dayColors.ts) y del frambuesa. Sin etiqueta, no pinta nada. `etiqueta` viene del dato de la zona del lugar (`etiqueta_barrio`), nunca escrita en el código.
 */
export function EtiquetaBarrio({ etiqueta, className = '', oscuro = false }: { etiqueta: string | null | undefined; className?: string; oscuro?: boolean }) {
  if (!etiqueta) return null
  // `oscuro`: sobre una tarjeta que es oscura también de día (HOY): la variante de noche, la misma que usa el modo noche.
  const color = oscuro ? 'border-[rgb(var(--barrio-lila-noche-borde))] bg-[rgb(var(--barrio-lila-noche-soft))] text-[rgb(var(--barrio-lila-noche))]' : 'border-barrio-lila-borde bg-barrio-lila-soft text-barrio-lila'
  return (
    <span
      data-etiqueta-barrio={etiqueta}
      className={`inline-flex min-h-[19px] shrink-0 items-center whitespace-nowrap rounded-full border px-2 py-[2px] text-[10.5px] font-medium ${color} ${className}`}
    >
      {etiqueta}
    </span>
  )
}

/** La etiqueta de un lugar por su nombre, para donde no se puede llamar al gancho dentro de un bucle (HOY, EXPLORAR). */
export function EtiquetaBarrioDeSitio({ destination, name, className = '', oscuro = false }: { destination: string | null | undefined; name: string | null | undefined; className?: string; oscuro?: boolean }) {
  return <EtiquetaBarrio etiqueta={useEtiquetaBarrio(destination, name)} className={className} oscuro={oscuro} />
}

/** La etiqueta de barrio de un lugar del destino (null si su zona no la lleva o aún no han llegado los datos). */
export function useEtiquetaBarrio(destination: string | null | undefined, name: string | null | undefined): string | null {
  const info = useDestinationExcursions(destination)
  return name ? (info.etiquetasPorSitio[name] ?? null) : null
}
