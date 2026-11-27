import { useLayoutEffect, useRef, useState } from 'react'
import { GR, INK } from './BloqueReservas'
import type { BloqueReservasId } from '../../../store/useReservasFocusStore'

export interface FichaResumen {
  /** Clave propia cuando dos fichas llevan al mismo bloque (una por excursión); sin ella, el bloque. */
  id?: string
  bloque: BloqueReservasId
  nombre: string
  hecho: boolean
  /** (V22) La tarjeta de «Útil para el viaje» a la que baja (el seguro, la eSIM de un país). */
  tarjeta?: string
  /** (V58 §2) Cuántas reservas cuenta esta ficha cuando son varias (las entradas: una por entrada). Sin él, la ficha cuenta una. */
  cuenta?: { hechas: number; total: number }
}

/**
 * LO QUE FALTA, EN UN SOLO SITIO (Tanda 6z6b, decidido por Eric el 10-oct-2026): la tarjeta CLARA de RESERVAS, aparte y debajo de la oscura de la cuenta atrás. «1 de 3 listo» (sin título delante: la tarjeta oscura de encima ya dice «Tu viaje a Roma…»; Tanda 6z6f), la barra y una ficha
 * redonda por bloque. De pago: Llegada y vuelta · Alojamiento · Entradas 1/8 («x de 3»); gratis: Alojamiento · Entradas («x de 2»; la llegada y la vuelta son de pago). Una ficha hecha va en verde con ✓. Al tocar
 * una, la pantalla baja a su bloque y lo abre (`pedir(bloque)`). Es la ÚNICA tarjeta que dice lo que falta: ni la oscura ni ninguna otra línea repite «Te faltan…» o «Lo tienes todo listo».
 */
const GAP_FICHAS = 6

export function ResumenViaje({ fichas, onFicha }: { fichas: FichaResumen[]; onFicha: (bloque: BloqueReservasId, ficha: FichaResumen) => void }) {
  // (V58 §2) «3 de 8 reservas listas»: cada cosa que se reserva cuenta una (llegada y vuelta, alojamiento, coche, CADA entrada, cada excursión, seguro, eSIM): el total es lo que enseñan las fichas y los bloques de debajo.
  const listas = fichas.reduce((n, ficha) => n + (ficha.cuenta ? ficha.cuenta.hechas : ficha.hecho ? 1 : 0), 0)
  const total = fichas.reduce((n, ficha) => n + (ficha.cuenta ? ficha.cuenta.total : 1), 0)
  const todas = listas === total
  // (V81, 1) Las fichas, en COLUMNAS IGUALES: 3 si el nombre más largo cabe entero en una línea con 3 columnas; si no, 2. Una rejilla que se adapta al ancho (se mide la ficha más ancha y el ancho de la tarjeta; nunca se corta ni se parte un nombre).
  const rejilla = useRef<HTMLDivElement>(null)
  const [columnas, setColumnas] = useState(3)
  useLayoutEffect(() => {
    const el = rejilla.current
    if (!el) return
    const medir = () => {
      const ancho = el.clientWidth
      const natural = Math.max(0, ...Array.from(el.querySelectorAll<HTMLElement>('[data-ficha-contenido]')).map((c) => c.offsetWidth + 22))
      if (ancho > 0 && natural > 0) setColumnas(natural * 3 + GAP_FICHAS * 2 <= ancho ? 3 : 2)
    }
    medir()
    const o = new ResizeObserver(medir)
    o.observe(el)
    return () => o.disconnect()
  }, [fichas])
  return (
    <div className="flex flex-col gap-2.5 rounded-[20px] bg-[#FFFDF8] px-3.5 pb-[13px] pt-3.5" style={{ border: '1px solid rgba(28,34,48,.07)' }} data-blk="resumen">
      <span style={{ font: "400 20px/1.1 'Instrument Serif',serif" }}>
        <em style={{ color: todas ? GR : 'rgb(var(--accent))' }}>
          {listas} de {total} {total === 1 ? 'reserva lista' : 'reservas listas'}
        </em>
      </span>
      <div className="flex gap-1" aria-hidden="true">
        {fichas.map((ficha) => (
          <span key={ficha.id ?? ficha.bloque} className="h-1 flex-1 rounded transition-colors" style={{ background: ficha.hecho ? GR : 'rgba(28,34,48,.1)' }} />
        ))}
      </div>
      <div ref={rejilla} data-fichas-rejilla data-fichas-columnas={columnas} className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` }}>
        {fichas.map((ficha) => (
          <button
            key={ficha.id ?? ficha.bloque}
            type="button"
            onClick={() => onFicha(ficha.bloque, ficha)}
            data-ficha={ficha.bloque}
            data-clave-resumen={ficha.id ?? ficha.bloque}
            className="zona-toque flex h-8 min-w-0 items-center rounded-full pl-2 pr-3 text-[12.5px] font-medium transition-colors"
            style={{
              border: `1px solid ${ficha.hecho ? 'oklch(0.55 0.11 150 / .35)' : 'rgba(28,34,48,.12)'}`,
              background: ficha.hecho ? 'oklch(0.96 0.035 150)' : '#FFFFFF',
              color: ficha.hecho ? 'oklch(0.38 0.1 150)' : INK,
            }}
          >
            <span data-ficha-contenido className="inline-flex flex-none items-center gap-1.5 whitespace-nowrap">
            <span
              className="h-4 w-4 flex-none rounded-full text-center text-[9px] font-bold leading-[13px] text-white"
              style={{ background: ficha.hecho ? GR : 'transparent', border: `1.5px solid ${ficha.hecho ? GR : 'rgb(var(--oro))'}` }}
              aria-hidden="true"
            >
              {ficha.hecho ? '✓' : ''}
            </span>
            {ficha.nombre}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
