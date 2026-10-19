import { useState, type ReactNode } from 'react'
import type { Route } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'
import { buildEntradasBloque, type BloqueEntrada } from '../../lib/bookings'
import { useDestinationExcursions } from '../../lib/destinationExcursions'
import { useArrivalInfo } from '../../lib/arrivalReturn'
import { legLine, legsOf } from '../../lib/reservasLegs'
import { estanciasDelViaje, nochesTexto, zonaDeAlojamientoElegida } from '../../lib/tuAlojamiento'
import { Icono } from '../ui/Icono'
import { FichaEntrada } from './reservas/FichaEntrada'
import { metaReserva, enTuRuta } from './reservas/EntradasYFreeTour'
import { rangoDelViaje } from './ReservasPanel'

/**
 * RESERVAS DE QUIEN MIRA EL VIAJE DE OTRA PERSONA (cuentas parte 3B, punto 3). Solo para mirar: lo que ha reservado la otra persona (la ida y la vuelta, el alojamiento y las entradas) sin
 * un solo botón de añadir, cambiar o quitar. Lo único que se puede tocar es [Reservar entrada], que abre la ficha del sitio en su pestaña de entradas, para comprar la suya.
 */
export function ReservasSoloVer({ route, nombreAdmin, onClose }: { route: Route; nombreAdmin: string; onClose: () => void }) {
  const reservations = useRouteStore((s) => s.reservations)
  const accommodationSelections = useRouteStore((s) => s.accommodationSelections)
  const info = useDestinationExcursions(route.destination)
  const arrivalInfo = useArrivalInfo(route.destination, route.days[0]?.city ?? route.destination, route.origin)
  const [ficha, setFicha] = useState<BloqueEntrada | null>(null)
  const legs = legsOf(route, arrivalInfo)
  const { enRuta } = buildEntradasBloque(route, info.entradasOrden, info.entradas, reservations)
  const estancia = estanciasDelViaje(route)[0] ?? null
  const hotel = accommodationSelections[estancia?.segmentDayId ?? route.days[0]?.id ?? ''] ?? null
  const zona = info.zonasAlojamiento.find((z) => z.id === route.accommodationZone) ?? null

  return (
    <div className="flex h-full flex-col bg-bg text-text" data-reservas-solo-ver>
      <div className="flex shrink-0 items-center gap-3 px-4 pb-2 pt-4 md:px-8">
        <button type="button" onClick={onClose} aria-label="Cerrar" title="Cerrar" className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full bg-bg-card text-accent" style={{ border: '1.5px solid rgb(var(--accent))' }}>
          <Icono nombre="cerrar" size={18} />
        </button>
        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="font-display" style={{ fontSize: 30, lineHeight: 1 }}>
            Reservas
          </span>
          <span className="text-text/55" style={{ font: "500 11px/1.35 'Geist Mono',monospace", letterSpacing: '.04em' }}>
            {route.origin} → {route.destination} · {rangoDelViaje(route)}
          </span>
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-10 pt-2 md:px-8">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-3.5">
          <p className="text-[13px] leading-snug text-text/60">{nombreAdmin ? `Esto es lo que ha reservado ${nombreAdmin}.` : 'Esto es lo que se ha reservado en este viaje.'} Aquí solo se mira.</p>

          <Bloque titulo="Llegada y vuelta">
            <Linea texto={legLine(legs.arrival)} hecho={legs.arrival.done} />
            <Linea texto={legLine(legs.departure)} hecho={legs.departure.done} />
          </Bloque>

          <Bloque titulo="Alojamiento">
            {hotel ? (
              <Linea texto={`${hotel.name}${estancia ? ` · ${nochesTexto(estancia.noches)}` : ''}`} hecho />
            ) : zonaDeAlojamientoElegida(route.accommodationZone) && zona ? (
              <Linea texto={zona.nombre} hecho />
            ) : (
              <Linea texto="Sin alojamiento puesto" hecho={false} />
            )}
          </Bloque>

          {enRuta.length > 0 && (
            <Bloque titulo="Entradas">
              {enRuta.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <Linea texto={item.name} hecho={Boolean(item.reservation)} />
                    <span className="block pl-[22px] text-[12px] text-text/55">{item.reservation ? metaReserva(route, item.reservation) : enTuRuta(route, item.day) || 'Sin reservar'}</span>
                  </div>
                  {!item.reservation && (
                    <button type="button" onClick={() => setFicha(item)} className="h-8 shrink-0 whitespace-nowrap rounded-full px-3.5 text-[12.5px] font-semibold text-white" style={{ background: 'rgb(var(--accent))' }}>
                      {item.isFreeTour ? 'Reservar Free Tour' : 'Reservar entrada'}
                    </button>
                  )}
                </div>
              ))}
            </Bloque>
          )}
        </div>
      </div>
      {ficha && <FichaEntrada route={route} item={ficha} onClose={() => setFicha(null)} />}
    </div>
  )
}

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5 rounded-[18px] bg-white p-3.5" style={{ border: '1px solid rgba(28,34,48,.08)' }}>
      <span className="text-text/50" style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }}>
        {titulo}
      </span>
      {children}
    </section>
  )
}

function Linea({ texto, hecho }: { texto: string; hecho: boolean }) {
  return (
    <span className="flex items-start gap-2 text-[14px] leading-snug" style={{ color: hecho ? 'oklch(0.36 0.09 150)' : undefined }}>
      <span aria-hidden="true" className="w-[14px] flex-none">
        {hecho ? '✓' : '·'}
      </span>
      <span className="min-w-0 [overflow-wrap:anywhere]">{texto}</span>
    </span>
  )
}
