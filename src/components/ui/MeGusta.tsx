import { Icono } from './Icono'
import { conMiles, textoRecomendacion } from '../../lib/recomendaciones'
import { useMeGusta } from '../../lib/useMeGusta'

/**
 * EL CORAZÓN DE «ME GUSTA» (Tanda 6y10): UNA sola pieza para toda la app. Lee y escribe la cuenta única del sitio (`useMeGustaStore`), así que el de la ficha y el de EXPLORAR enseñan el mismo número
 * y el mismo estado: si se da en uno, sale marcado y sumado en el otro.
 *   - `ficha`: el botón de debajo de las etiquetas («154 lo recomiendan», diseño «Ficha Lugar»). Solo sale en los sitios del catálogo del destino.
 *   - `cabecera` (Tanda 10N4, `Piezas/Ficha Cabecera`): la ficha de un lugar lleva el corazón a la derecha del nombre, grande, con solo el número («93»). Al tocarlo se llena en frambuesa y sube a 94 (lo recomiendas tú); al volver a tocarlo se quita.
 *   - `tarjeta`: el corazón pequeño de las tarjetas de EXPLORAR (« ♡ 154 »), solo el número.
 * Al marcarlo el corazón se rellena y crece con un pequeño rebote; con «reducir movimiento» cambia sin animar.
 */
export function MeGusta({ destino, nombre, variante, className = '' }: { destino: string | null | undefined; nombre: string; variante: 'ficha' | 'tarjeta' | 'cabecera'; className?: string }) {
  const { enCatalogo, total, mostrado, marcado, alternar } = useMeGusta(destino, nombre)
  if (variante === 'cabecera') {
    if (!enCatalogo) return null
    return (
      <button
        type="button"
        onClick={alternar}
        aria-pressed={marcado}
        aria-label={marcado ? `Quitar me gusta de ${nombre}` : `Me gusta ${nombre}`}
        data-megusta="cabecera"
        className={`megusta-cabecera flex w-14 flex-none flex-col items-center gap-[3px] rounded-[20px] pb-2 pt-[9px] transition-[background-color,border-color,color] duration-300 motion-reduce:transition-none ${className}`}
      >
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill={marcado ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`transition-transform duration-[350ms] ease-[cubic-bezier(.3,1.6,.5,1)] motion-reduce:transition-none ${marcado ? 'scale-[1.12]' : 'scale-100'}`}
        >
          <path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z" />
        </svg>
        {mostrado !== null && (
          <b data-megusta-numero className={`text-[15px] font-bold leading-none tabular-nums ${marcado ? 'text-white' : 'text-text'}`}>
            {conMiles(mostrado)}
          </b>
        )}
      </button>
    )
  }
  const corazon = (
    <Icono
      nombre="gusta"
      size={variante === 'ficha' ? 15 : 17}
      grosor={variante === 'ficha' ? 2 : undefined}
      relleno={marcado}
      className={`flex-none text-frambuesa transition-transform duration-[350ms] ease-[cubic-bezier(.3,1.6,.5,1)] motion-reduce:transition-none ${marcado ? 'scale-[1.15]' : 'scale-100'}`}
    />
  )
  const etiqueta = marcado ? `Quitar me gusta de ${nombre}` : `Me gusta ${nombre}`
  if (variante === 'tarjeta') {
    return (
      <button
        type="button"
        onClick={alternar}
        aria-pressed={marcado}
        aria-label={etiqueta}
        data-megusta="tarjeta"
        className={`flex items-center justify-end gap-[3px] text-[12px] font-medium transition-colors ${marcado ? 'text-frambuesa' : 'text-text/55'} ${className}`}
      >
        {corazon}
        {mostrado !== null && <span className="tabular-nums">{conMiles(mostrado)}</span>}
      </button>
    )
  }
  if (!enCatalogo) return null
  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={marcado}
      aria-label={etiqueta}
      data-megusta="ficha"
      className={`flex h-7 items-center gap-1.5 self-start rounded-full border pl-[7px] pr-2.5 transition-[background-color,border-color] duration-300 motion-reduce:transition-none ${marcado ? 'border-frambuesa/40 bg-frambuesa/[.08]' : 'border-text/[.14] bg-transparent'} ${className}`}
    >
      {corazon}
      <span className="whitespace-nowrap text-[11.5px] font-medium text-text">
        {mostrado !== null ? (
          <>
            <strong className="font-bold">{conMiles(mostrado)}</strong> lo recomiendan
          </>
        ) : (
          textoRecomendacion(total)
        )}
      </span>
    </button>
  )
}
