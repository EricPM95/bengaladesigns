import { GR, INK } from './BloqueReservas'
import type { BloqueReservasId } from '../../../store/useReservasFocusStore'

export interface FichaResumen {
  bloque: BloqueReservasId
  nombre: string
  hecho: boolean
}

/**
 * LO QUE FALTA, EN UN SOLO SITIO (Tanda 6z6b, decidido por Eric el 10-oct-2026): la tarjeta CLARA de RESERVAS, aparte y debajo de la oscura de la cuenta atrás. «Tu viaje a Roma · 1 de 3 listo», la barra y una ficha
 * redonda por bloque. De pago: Llegada y vuelta · Alojamiento · Entradas 1/8 («x de 3»); gratis: Alojamiento · Entradas («x de 2»; la llegada y la vuelta son de pago). Una ficha hecha va en verde con ✓. Al tocar
 * una, la pantalla baja a su bloque y lo abre (`pedir(bloque)`). Es la ÚNICA tarjeta que dice lo que falta: ni la oscura ni ninguna otra línea repite «Te faltan…» o «Lo tienes todo listo».
 */
export function ResumenViaje({ ciudad, fichas, onFicha }: { ciudad: string; fichas: FichaResumen[]; onFicha: (bloque: BloqueReservasId) => void }) {
  const listas = fichas.filter((ficha) => ficha.hecho).length
  const todas = listas === fichas.length
  return (
    <div className="flex flex-col gap-2.5 rounded-[20px] bg-[#FFFDF8] px-3.5 pb-[13px] pt-3.5" style={{ border: '1px solid rgba(28,34,48,.07)' }} data-blk="resumen">
      <span style={{ font: "400 20px/1.1 'Instrument Serif',serif" }}>
        Tu viaje a {ciudad} ·{' '}
        <em style={{ color: todas ? GR : 'oklch(0.5 0.17 5)' }}>
          {listas} de {fichas.length} listo
        </em>
      </span>
      <div className="flex gap-1" aria-hidden="true">
        {fichas.map((ficha) => (
          <span key={ficha.bloque} className="h-1 flex-1 rounded transition-colors" style={{ background: ficha.hecho ? GR : 'rgba(28,34,48,.1)' }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {fichas.map((ficha) => (
          <button
            key={ficha.bloque}
            type="button"
            onClick={() => onFicha(ficha.bloque)}
            data-ficha={ficha.bloque}
            className="flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full pl-2 pr-3 text-[12.5px] font-medium transition-colors"
            style={{
              border: `1px solid ${ficha.hecho ? 'oklch(0.55 0.11 150 / .35)' : 'rgba(28,34,48,.12)'}`,
              background: ficha.hecho ? 'oklch(0.96 0.035 150)' : '#FFFFFF',
              color: ficha.hecho ? 'oklch(0.38 0.1 150)' : INK,
            }}
          >
            <span
              className="h-4 w-4 rounded-full text-center text-[9px] font-bold leading-[13px] text-white"
              style={{ background: ficha.hecho ? GR : 'transparent', border: `1.5px solid ${ficha.hecho ? GR : 'oklch(0.55 0.17 5)'}` }}
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
