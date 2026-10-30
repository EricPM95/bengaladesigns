import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icono } from '../../ui/Icono'
import { useDestinationPool } from '../../../lib/useDestinationPool'
import { getPoolPhoto, prefetchPoolPhotos } from '../../../lib/placePhoto'
import { candidatosDeEntrada, PREFIJO_OTRA_RESERVA, sugerenciasPara, type SugerenciaDeEntrada } from '../../../lib/otraReserva'
import { normalizarTexto } from '../../../lib/busqueda'
import { FREE_TOUR_REF } from '../../../lib/freeTourManual'
import type { Route } from '../../../lib/types'
import type { BloqueEntrada } from '../../../lib/bookings'
import type { ReservationTarget } from './AddReservationSheet'

/**
 * (Tanda 10S4, apartado 4) [Añadir otra reserva]: una casilla donde se escribe lo que sea. Mientras se escribe, si lo escrito se parece a un sitio nuestro con entrada, sale debajo como sugerencia (foto pequeña y nombre);
 * si se toca, es ese sitio; si no, se queda lo escrito, tal cual ([Seguir]). Después, la hoja de siempre (`AddReservationSheet`): día, hora, ¿para quién?, precio y [Guardar la entrada].
 * El buscador es el de toda la app (`busqueda.ts`): sin acentos ni mayúsculas, palabras a medias, una letra equivocada y el nombre en italiano.
 */
export function OtraReservaBuscador({ route, sitiosConEntrada, enRuta, onElegir, onClose }: { route: Route; sitiosConEntrada: string[]; enRuta: BloqueEntrada[]; onElegir: (target: ReservationTarget) => void; onClose: () => void }) {
  const [texto, setTexto] = useState('')
  const entrada = useRef<HTMLInputElement>(null)
  const { places, freeTourEntry } = useDestinationPool(route.destination, true)
  const candidatos = useMemo(() => candidatosDeEntrada(sitiosConEntrada, places, freeTourEntry), [sitiosConEntrada, places, freeTourEntry])
  const sugerencias = useMemo(() => sugerenciasPara(texto, candidatos), [texto, candidatos])
  const [, repintar] = useState(0)
  useEffect(() => {
    entrada.current?.focus()
  }, [])
  // Las fotos pequeñas de las sugerencias, de una vez (las que ya estén guardadas salen al momento).
  useEffect(() => {
    if (candidatos.length === 0) return
    let cancelado = false
    void prefetchPoolPhotos(route.destination, candidatos.map((c) => c.fotoNombre)).then(() => {
      if (!cancelado) repintar((n) => n + 1)
    })
    return () => {
      cancelado = true
    }
  }, [candidatos, route.destination])

  const limpio = texto.trim()
  const elegirSugerencia = (s: SugerenciaDeEntrada) => {
    // El día en que el sitio está ahora en la ruta (si está), para partir de él; el viajero puede elegir otro.
    const enLaRuta = route.days.flatMap((day) => day.stops.filter((stop) => !stop.passThrough).map((stop) => ({ day, stop }))).find(({ stop }) => (s.isFreeTour ? stop.isFreeTour : !stop.isFreeTour && stop.name === s.nombre && stop.visitMode !== 'fuera'))
    const fila = enRuta.find((item) => (s.isFreeTour ? item.isFreeTour : item.placeNames.includes(s.nombre)))
    onElegir({
      kind: 'entrada',
      refId: s.isFreeTour ? FREE_TOUR_REF : s.nombre,
      name: s.nombre,
      placeNames: [s.nombre],
      currentDayId: fila?.day?.id ?? enLaRuta?.day.id ?? null,
      // (El Free Tour es uno solo: si ya va en la ruta, se reserva el que hay; no se pone otro.)
      sugerencia: s.isFreeTour && route.days.some((day) => day.stops.some((stop) => stop.isFreeTour)) ? null : s,
    })
  }
  const seguirConLoEscrito = () => {
    if (limpio.length < 2) return
    onElegir({ kind: 'entrada', refId: `${PREFIJO_OTRA_RESERVA}${normalizarTexto(limpio) || Date.now()}`, name: limpio, placeNames: [limpio], currentDayId: null, libre: true })
  }

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="otra-reserva-titulo" data-otra-reserva>
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={onClose} />
      <div className="trazo-notice-panel relative flex max-h-[92dvh] w-full flex-col rounded-t-[28px] bg-bg-card shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[440px] md:rounded-[28px]">
        <div className="flex shrink-0 justify-center pt-2.5" aria-hidden="true">
          <span className="h-1 w-[42px] rounded-full bg-text/20" />
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="zona-toque absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-text-soft hover:bg-bg-hover">
          <Icono nombre="cerrar" className="h-5 w-5" />
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
          <p className="max-w-[calc(100%-2.5rem)] text-text/50" style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }}>
            Reserva · ¿de qué es?
          </p>
          <h2 id="otra-reserva-titulo" className="mt-1.5 font-display text-[24px] leading-[1.05] text-text">
            Añadir otra reserva
          </h2>
          <label className="mt-5 block">
            <span className="sr-only">Escribe de qué es la reserva</span>
            <input
              ref={entrada}
              type="text"
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  if (sugerencias.length === 1) elegirSugerencia(sugerencias[0])
                  else seguirConLoEscrito()
                }
              }}
              placeholder="Ej.: Cúpula de San Pedro"
              autoComplete="off"
              autoCapitalize="sentences"
              data-otra-reserva-texto
              className="h-12 w-full rounded-xl border border-text/15 bg-bg px-3.5 text-[16px] text-text placeholder:text-text-muted"
            />
          </label>
          {sugerencias.length > 0 && (
            <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0" data-sugerencias-otra>
              {sugerencias.map((s) => {
                const foto = getPoolPhoto(route.destination, s.fotoNombre)
                return (
                  <li key={s.nombre}>
                    <button type="button" onClick={() => elegirSugerencia(s)} data-sugerencia-otra={s.nombre} className="flex min-h-[56px] w-full items-center gap-3 rounded-2xl border border-text/10 bg-[#FFFDF8] p-2 text-left transition-colors hover:bg-bg-hover">
                      <span className="h-10 w-10 flex-none overflow-hidden rounded-xl bg-bg-hover" aria-hidden="true">
                        {foto ? <img src={foto} alt="" loading="lazy" className="h-full w-full object-cover" /> : null}
                      </span>
                      <span className="min-w-0 flex-1 text-[14.5px] font-semibold leading-snug text-text">{s.nombre}</span>
                      <Icono nombre="adelante" size={16} className="flex-none text-text/40" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          {limpio.length >= 2 && (
            <p className="mt-3 text-[12.5px] leading-snug text-text-soft" data-aviso-escrito>
              {sugerencias.length > 0 ? 'Si no es ninguno de estos, seguimos con lo que has escrito.' : 'No tenemos ese sitio en la lista: seguimos con lo que has escrito (solo en Reservas).'}
            </p>
          )}
          <button type="button" disabled={limpio.length < 2} onClick={seguirConLoEscrito} data-otra-reserva-seguir className="mt-5 h-[54px] w-full rounded-full btn-champan text-[15px] font-semibold transition-transform active:scale-[.98] disabled:opacity-40">
            Seguir
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
