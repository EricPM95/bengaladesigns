import type { BloqueReservasId } from '../../../store/useReservasFocusStore'

export interface FichaResumen {
  bloque: BloqueReservasId
  nombre: string
  hecho: boolean
}

const VERDE_CLARO = 'oklch(0.82 0.1 150)'
const VERDE = 'oklch(0.55 0.11 150)'

/**
 * El resumen del viaje, DENTRO de la tarjeta oscura de arriba de RESERVAS (Tanda 6z6, corrección de Eric del 10-oct-2026): «2 de 3 listo», la barra y una ficha por bloque. Es el mismo resumen en la gratis y en la
 * de pago; solo cambian las fichas: de pago, Llegada y vuelta · Alojamiento · Entradas 1/4; gratis, Alojamiento · Entradas 1/4 (la llegada y la vuelta son de pago). Una ficha hecha va en verde con ✓. Al tocar una, la
 * pantalla baja a su bloque y lo abre.
 */
export function ResumenDelViaje({ fichas, onFicha }: { fichas: FichaResumen[]; onFicha: (bloque: BloqueReservasId) => void }) {
  const listas = fichas.filter((ficha) => ficha.hecho).length
  const todas = listas === fichas.length
  return (
    <div className="relative mt-3 flex flex-col gap-2.5" data-blk="resumen">
      <span style={{ font: "400 20px/1.1 'Instrument Serif',serif" }}>
        <em style={{ color: todas ? VERDE_CLARO : 'oklch(0.78 0.11 15)' }}>
          {listas} de {fichas.length} listo
        </em>
      </span>
      <div className="flex gap-1" aria-hidden="true">
        {fichas.map((ficha) => (
          <span key={ficha.bloque} className="h-1 flex-1 rounded transition-colors" style={{ background: ficha.hecho ? VERDE_CLARO : 'rgba(255,253,248,.2)' }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {fichas.map((ficha) => (
          <button
            key={ficha.bloque}
            type="button"
            onClick={() => onFicha(ficha.bloque)}
            className="flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full pl-2 pr-3 text-[12.5px] font-medium transition-colors"
            style={{
              border: `1px solid ${ficha.hecho ? 'oklch(0.82 0.1 150 / .5)' : 'rgba(255,253,248,.28)'}`,
              background: ficha.hecho ? 'oklch(0.55 0.11 150 / .22)' : 'rgba(255,253,248,.06)',
              color: ficha.hecho ? VERDE_CLARO : 'rgba(255,253,248,.92)',
            }}
          >
            <span
              className="h-4 w-4 rounded-full text-center text-[9px] font-bold leading-[13px] text-white"
              style={{ background: ficha.hecho ? VERDE : 'transparent', border: `1.5px solid ${ficha.hecho ? VERDE : 'oklch(0.78 0.11 15)'}` }}
              aria-hidden="true"
            >
              {ficha.hecho ? '✓' : ''}
            </span>
            {ficha.nombre}
          </button>
        ))}
      </div>
    </div>
  )
}
