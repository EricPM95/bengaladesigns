import { useState } from 'react'
import type { Route } from '../../../lib/types'
import type { DestinationExcursions } from '../../../lib/destinationExcursions'
import { buildEntradasBloque, dateOfDay, type BloqueEntrada } from '../../../lib/bookings'
import { buildActivitySearchUrl } from '../../../lib/affiliateLinks'
import { legDayText } from '../../../lib/reservasLegs'
import { useRouteStore } from '../../../store/useRouteStore'
import { BloqueShell, FlechaBloque, GR, ICONOS, IconoBloque, LineaReservada, tituloBloqueStyle } from './BloqueReservas'
import { EntradaCard } from './EntradaCard'
import { AddReservationSheet, type ReservationTarget } from './AddReservationSheet'

const MES = new Intl.DateTimeFormat('es-ES', { month: 'short' })

/** «11 oct · 10:00» (con fechas) o «Día 2 · 10:00» (sin ellas): lo que lleva una reservada en su línea verde. */
export function metaReserva(route: Route, reservation: { dateIso: string | null; dayNumber: number | null; time: string }, prefijoHora = ''): string {
  const fecha = reservation.dateIso && route.answers.dateRange ? `${Number(reservation.dateIso.slice(8, 10))} ${MES.format(new Date(`${reservation.dateIso}T12:00:00`)).replace('.', '')}` : `Día ${reservation.dayNumber ?? ''}`.trim()
  return `${fecha} · ${prefijoHora}${reservation.time}`
}

/** «En tu ruta el mié 11» (con fechas) o «En tu ruta el día 2». */
export function enTuRuta(route: Route, day: { dayNumber: number; id: string } | null): string {
  if (!day) return ''
  const full = route.days.find((candidate) => candidate.id === day.id)
  const iso = full && route.answers.dateRange ? dateOfDay(route, full) : null
  return iso ? `En tu ruta el ${legDayText({ dateIso: iso, dayNumber: day.dayNumber })}` : `En tu ruta el día ${day.dayNumber}`
}

/**
 * El bloque «Entradas y Free Tour» de RESERVAS (Tanda 6s): cerrado de entrada, con «1 de 8 reservadas» y la barra; abierto, las entradas de la ruta del viajero en el orden de los datos del
 * destino, todas juntas y sin títulos de día. Sin reservar, la tarjeta de la 6m; reservada, una línea verde con «Cambiar».
 */
export function EntradasYFreeTour({ route, info, abierto, onToggle }: { route: Route; info: DestinationExcursions; abierto: boolean; onToggle: () => void }) {
  const reservations = useRouteStore((state) => state.reservations)
  const [verMas, setVerMas] = useState(false)
  const [target, setTarget] = useState<ReservationTarget | null>(null)
  const { arriba, mas } = buildEntradasBloque(route, info.entradasOrden, info.entradas, reservations)
  const todas = [...arriba, ...mas]
  if (todas.length === 0) return null
  const reservadas = todas.filter((item) => item.reservation).length
  const hecho = reservadas === todas.length
  const visibles = verMas ? todas : arriba

  const targetOf = (item: BloqueEntrada): ReservationTarget => ({
    kind: 'entrada',
    refId: item.isFreeTour ? 'Free Tour' : item.name,
    name: item.name,
    placeNames: item.placeNames,
    currentDayId: item.day?.id ?? null,
  })
  const enlace = (item: BloqueEntrada) => info.entradasPorSitio[item.isFreeTour ? 'Free Tour' : item.placeNames[0]]?.[0]?.url ?? buildActivitySearchUrl(`${item.name} ${route.destination}`)

  return (
    <>
      <BloqueShell bloque="entradas">
        <div onClick={onToggle} className="flex cursor-pointer flex-col gap-3 p-3.5">
          <div className="flex items-center gap-3">
            <IconoBloque d={ICONOS.ticket} hecho={hecho} />
            <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span style={tituloBloqueStyle}>Entradas y Free Tour</span>
              <span style={{ font: "600 11px 'Geist Mono',monospace", color: hecho ? GR : 'oklch(0.5 0.17 5)' }}>
                {reservadas} de {todas.length} reservadas
              </span>
            </span>
            <FlechaBloque abierto={abierto} />
          </div>
          <div className="flex gap-[3px]" aria-hidden="true">
            {todas.map((item) => (
              <span key={item.name} className="h-1 flex-1 rounded transition-colors" style={{ background: item.reservation ? GR : 'rgba(28,34,48,.1)' }} />
            ))}
          </div>
        </div>
        {abierto && (
          <div className="flex flex-col gap-3 px-3.5 pb-3.5">
            <span className="flex items-center gap-1.5 text-[12px] text-text/65">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="oklch(0.55 0.17 5)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={ICONOS.reloj} />
              </svg>
              Las más buscadas se agotan: resérvalas pronto
            </span>
            {visibles.map((item) =>
              item.reservation ? (
                <LineaReservada key={item.name} nombre={item.name} meta={metaReserva(route, item.reservation)} onChange={() => setTarget({ ...targetOf(item), existing: item.reservation })} />
              ) : (
                <EntradaCard
                  key={item.name}
                  eyebrow={item.isFreeTour ? 'Free Tour' : 'Entrada'}
                  when={enTuRuta(route, item.day)}
                  name={item.name}
                  buyLabel={item.isFreeTour ? 'Reservar Free Tour' : 'Reservar entrada'}
                  buyHref={enlace(item)}
                  reservedTime={null}
                  onAdd={() => setTarget(targetOf(item))}
                  onChange={() => setTarget(targetOf(item))}
                />
              ),
            )}
            {mas.length > 0 && (
              <button type="button" onClick={() => setVerMas((value) => !value)} className="h-11 rounded-[14px] border border-dashed border-text/20 bg-transparent text-[13px] font-semibold text-text">
                {verMas ? 'Ver menos' : `Ver ${mas.length} más`}
              </button>
            )}
          </div>
        )}
      </BloqueShell>
      {target && <AddReservationSheet route={route} target={target} onClose={() => setTarget(null)} />}
    </>
  )
}
