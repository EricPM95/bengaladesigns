import { useEffect, useState } from 'react'
import { formatoImporte, leerImporte, type Importe } from '../../../lib/dinero'
import type { Route } from '../../../lib/types'
import type { DestinationExcursions } from '../../../lib/destinationExcursions'
import { buildEntradasBloque, type BloqueEntrada } from '../../../lib/bookings'
import { elDia } from '../../../lib/nombreDeDia'
import { isManualRoute } from '../../../lib/manualPlan'
import { aplicarAvisoFueraDeDia, reservasFueraDeSuDia, type ReservaFueraDeDia } from '../../../lib/reservaFueraDeDia'
import { BloqueShell, EstadoBloque, FlechaBloque, GR, ICONOS, IconoBloque, LineaReservada, tituloBloqueStyle } from './BloqueReservas'
import { EntradaCard } from './EntradaCard'
import { FichaEntrada } from './FichaEntrada'
import { AddReservationSheet, type ReservationTarget } from './AddReservationSheet'
import { Icono } from '../../ui/Icono'
import { useEntradasDelGrupo, useReservasParaMi, reservaDelDuenoDe } from '../../../hooks/useEntradasDelGrupo'
import { useReservasGrupoUi } from '../../../store/useReservasGrupoUi'
import { entradasQueNoCuadran, idsIncluidos, textoQuienVa } from '../../../lib/reservasGrupo'
import { nombreDe } from '../../../store/useViajeCompartido'
import type { Reservation } from '../../../lib/bookings'

const MES = new Intl.DateTimeFormat('es-ES', { month: 'short' })

/** «11 oct · 10:00» (con fechas) o «Día 2 · 10:00» (sin ellas): lo que lleva una reservada en su línea verde. */
export function metaReserva(route: Route, reservation: { dateIso: string | null; dayNumber: number | null; time: string; precio?: Importe | null }, prefijoHora = ''): string {
  const fecha = reservation.dateIso && route.answers.dateRange ? `${Number(reservation.dateIso.slice(8, 10))} ${MES.format(new Date(`${reservation.dateIso}T12:00:00`)).replace('.', '')}` : `Día ${reservation.dayNumber ?? ''}`.trim()
  // (Tanda 6z2) El precio, al final, si el viajero lo puso: «11 ago · 10:00 · 54 €». Sin precio, como siempre.
  const precio = leerImporte(reservation.precio)
  return `${fecha} · ${prefijoHora}${reservation.time}${precio ? ` · ${formatoImporte(precio)}` : ''}`
}

/** El aviso de una reserva fuera de su día, bajo su línea verde: el texto y el botón que lo arregla (Tanda 6y2). */
function AvisoFueraDeDiaTarjeta({ aviso }: { aviso: ReservaFueraDeDia }) {
  const [hecho, setHecho] = useState(false)
  return (
    <div className="flex flex-col items-start gap-2 rounded-[14px] px-3.5 py-3" style={{ background: 'color-mix(in srgb, rgb(var(--accent-gold)) 14%, transparent)' }} role="status">
      <span className="text-[12.5px] leading-snug text-text">{aviso.text}</span>
      <button
        type="button"
        disabled={hecho}
        onClick={() => {
          setHecho(true)
          void aplicarAvisoFueraDeDia(aviso).finally(() => setHecho(false))
        }}
        className="h-8 whitespace-nowrap rounded-full border border-accent px-3.5 text-[12.5px] font-semibold text-accent transition-colors hover:bg-accent-soft disabled:opacity-50"
      >
        {aviso.actionLabel}
      </button>
    </div>
  )
}

/** «En tu ruta el miércoles 11» (con fechas) o «En tu ruta el día 2». */
export function enTuRuta(route: Route, day: { dayNumber: number; id: string } | null): string {
  if (!day) return ''
  const full = route.days.find((candidate) => candidate.id === day.id)
  return `En tu ruta ${elDia(route, full?.dayNumber ?? day.dayNumber)}`
}

/**
 * El bloque «Entradas y Free Tour» de RESERVAS (Tanda 6s y 6v): cerrado de entrada, con «1 de 4 reservadas» y la barra; abierto, dos partes. «EN TU RUTA»: las entradas de las paradas que el viajero visita por dentro
 * (y el Free Tour, si va en la ruta), en el orden de los datos del destino; son las que cuentan. Debajo, «Ver n más»: las demás de la lista del destino, que no cuentan y no llevan «Añádela» (para meter una en el viaje
 * está «+ Añadir parada» de DÍAS); si no hay más, la línea no sale. [Reservar entrada] y [Reservar Free Tour] abren la ficha del sitio en su pestaña «Entradas», no la tienda; «¿Ya la tienes? Añádela» abre la hoja de la hora.
 * Una reservada, una línea verde con «Cambiar».
 */
export function EntradasYFreeTour({ route, info, abierto, onToggle }: { route: Route; info: DestinationExcursions; abierto: boolean; onToggle: () => void }) {
  // Tanda 10N §8: quien mira el viaje de otra persona ve las entradas como su propia lista: las que ha comprado él, las que el dueño compró también para él, y de las demás, el día y la hora del dueño.
  const grupo = useEntradasDelGrupo()
  const reservations = useReservasParaMi()
  const [verMas, setVerMas] = useState(false)
  const [target, setTarget] = useState<ReservationTarget | null>(null)
  const [ficha, setFicha] = useState<BloqueEntrada | null>(null)
  const { enRuta, masEntradas } = buildEntradasBloque(route, info.entradasOrden, info.entradas, reservations)
  const pedido = useReservasGrupoUi((state) => state.pedido)
  const limpiarPedido = useReservasGrupoUi((state) => state.limpiar)
  const delDuenoDe = (item: BloqueEntrada) => (grupo.esInvitado && !item.reservation ? reservaDelDuenoDe(grupo.reservasDelDueno, item) : null)
  // Los botones de la campana («Reservar la mía a la misma hora», «Ya la tengo») piden abrir la entrada de la reserva del dueño.
  useEffect(() => {
    if (!pedido) return
    const reserva = grupo.reservasDelDueno.find((r) => r.id === pedido.reservaId)
    const item = reserva ? [...enRuta, ...masEntradas].find((candidato) => reservaDelDuenoDe([reserva], candidato)) : null
    limpiarPedido()
    if (!reserva || !item) return
    setTarget({ kind: 'entrada', refId: item.isFreeTour ? 'Free Tour' : item.name, name: item.name, placeNames: item.placeNames, currentDayId: item.day?.id ?? null, igualQue: { reserva, quien: grupo.nombreAdmin, modo: pedido.accion === 'misma-hora' ? 'comprar' : 'tengo' } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido])
  if (enRuta.length === 0 && masEntradas.length === 0) return null
  const noCuadran = grupo.esInvitado ? entradasQueNoCuadran(route, grupo.mias, info.nombresCortos) : []
  /** «Para Eric, Ana»: a quién cubre la entrada del dueño (solo si es para más de una persona). */
  const paraQuienTexto = (r: Reservation) => {
    const nombres = idsIncluidos(r, grupo.gente).map((id) => nombreDe(grupo.gente.find((p) => p.id === id))).filter(Boolean)
    return nombres.length > 1 ? `Para ${nombres.join(', ')}` : undefined
  }
  const reservadas = enRuta.filter((item) => item.reservation).length
  const hecho = enRuta.length > 0 && reservadas === enRuta.length

  const targetOf = (item: BloqueEntrada): ReservationTarget => ({
    kind: 'entrada',
    refId: item.isFreeTour ? 'Free Tour' : item.name,
    name: item.name,
    placeNames: item.placeNames,
    currentDayId: item.day?.id ?? null,
  })
  // Ruta a mano (Tanda 6y2): una reserva cuyo sitio no está en el día de su fecha lleva su aviso con su botón en su propia tarjeta (y el mismo en la campana).
  const fuera = grupo.esInvitado ? [] : reservasFueraDeSuDia(route, reservations, info.nombresCortos)
  const avisoDe = (reservationId: string) => fuera.find((aviso) => aviso.reservation.id === reservationId) ?? null
  const etiquetaDe = (item: BloqueEntrada) => (item.isFreeTour ? 'Free Tour' : 'Entrada')
  const botonDe = (item: BloqueEntrada) => (item.isFreeTour ? 'Reservar Free Tour' : 'Reservar entrada')

  return (
    <>
      <BloqueShell bloque="entradas">
        <div onClick={onToggle} className="flex cursor-pointer flex-col gap-3 p-3.5">
          <div className="flex items-center gap-3">
            <IconoBloque nombre={ICONOS.ticket} hecho={hecho} />
            <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span style={tituloBloqueStyle}>Entradas y Free Tour</span>
              <EstadoBloque texto={enRuta.length > 0 ? `${reservadas} de ${enRuta.length} reservadas` : 'Ninguna en tu ruta'} hecho={hecho} />
            </span>
            <FlechaBloque abierto={abierto} />
          </div>
          {enRuta.length > 0 && (
            <div className="flex gap-[3px]" aria-hidden="true">
              {enRuta.map((item) => (
                <span key={item.name} className="h-1 flex-1 rounded transition-colors" style={{ background: item.reservation ? GR : 'rgba(28,34,48,.1)' }} />
              ))}
            </div>
          )}
        </div>
        {abierto && (
          <div className="flex flex-col gap-3 px-3.5 pb-3.5">
            {enRuta.length > 0 && (
              <>
                <span className="flex items-center gap-1.5 text-text/50" style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }}>
                  En tu ruta
                </span>
                <span className="-mt-1.5 flex items-center gap-1.5 text-[12px] text-text/65">
                  <Icono nombre="reloj" size={13} style={{ color: 'rgb(var(--accent))' }} />
                  Las más buscadas se agotan: resérvalas pronto
                </span>
                {enRuta.map((item) =>
                  item.reservation ? (
                    <div key={item.name} className="flex flex-col gap-2" data-entrada-fila={item.name}>
                      {/* (La del dueño que le cubre a quien mira: no es suya para cambiarla, sin «Cambiar».) */}
                      {grupo.esInvitado && !grupo.mias.some((m) => m.id === item.reservation!.id) ? (
                        <LineaReservada nombre={item.name} meta={metaReserva(route, item.reservation)} nota={`${grupo.nombreAdmin || 'El dueño'} la ha reservado para ti`} />
                      ) : (
                        <LineaReservada nombre={item.name} meta={metaReserva(route, item.reservation)} nota={grupo.compartido && !grupo.esInvitado ? paraQuienTexto(item.reservation) : undefined} onChange={() => setTarget({ ...targetOf(item), existing: item.reservation })} />
                      )}
                      {avisoDe(item.reservation.id) && <AvisoFueraDeDiaTarjeta aviso={avisoDe(item.reservation.id)!} />}
                      {noCuadran.filter((aviso) => aviso.cambio.reservaId === item.reservation!.id).map((aviso) => (
                        <p key={aviso.id} data-entrada-no-cuadra className="rounded-[14px] px-3.5 py-2.5 text-[12.5px] leading-snug text-text" style={{ background: 'color-mix(in srgb, rgb(var(--accent-gold)) 14%, transparent)' }}>
                          {aviso.texto}
                        </p>
                      ))}
                    </div>
                  ) : delDuenoDe(item) ? (
                    <EntradaCard
                      key={item.name}
                      eyebrow={etiquetaDe(item)}
                      when={enTuRuta(route, item.day)}
                      name={item.name}
                      delGrupo
                      buyLabel="Reservar la mía a la misma hora"
                      onBuy={() => setTarget({ ...targetOf(item), igualQue: { reserva: delDuenoDe(item)!, quien: grupo.nombreAdmin, modo: 'comprar' } })}
                      reservedTime={null}
                      notes={[{ text: textoQuienVa(grupo.nombreAdmin, route, delDuenoDe(item)!) }]}
                      onAdd={() => setTarget({ ...targetOf(item), igualQue: { reserva: delDuenoDe(item)!, quien: grupo.nombreAdmin, modo: 'tengo' } })}
                      onChange={() => setTarget(targetOf(item))}
                    />
                  ) : (
                    <EntradaCard
                      key={item.name}
                      eyebrow={etiquetaDe(item)}
                      when={enTuRuta(route, item.day)}
                      name={item.name}
                      buyLabel={botonDe(item)}
                      onBuy={() => setFicha(item)}
                      reservedTime={null}
                      onAdd={() => setTarget(targetOf(item))}
                      onChange={() => setTarget(targetOf(item))}
                    />
                  ),
                )}
              </>
            )}
            {masEntradas.length > 0 && (
              <>
                <button type="button" onClick={() => setVerMas((value) => !value)} className="h-11 rounded-[14px] border border-dashed border-text/20 bg-transparent text-[13px] font-semibold text-text">
                  {verMas ? 'Ver menos' : `Ver ${masEntradas.length} más`}
                </button>
                {verMas &&
                  masEntradas.map((item) => (
                    <EntradaCard
                      key={item.name}
                      eyebrow={etiquetaDe(item)}
                      name={item.name}
                      buyLabel={botonDe(item)}
                      onBuy={() => setFicha(item)}
                      reservedTime={null}
                      // (Ruta a mano, Tanda 6y2: el Free Tour se añade como cualquier reserva —«¿Ya la tienes? Añádela», con su hora—; va al día de su fecha. Las demás entradas, desde «+ Añadir parada».)
                      onAdd={isManualRoute(route) && item.isFreeTour ? () => setTarget(targetOf(item)) : undefined}
                    />
                  ))}
              </>
            )}
          </div>
        )}
      </BloqueShell>
      {target && <AddReservationSheet route={route} target={target} onClose={() => setTarget(null)} />}
      {ficha && <FichaEntrada route={route} item={ficha} onClose={() => setFicha(null)} />}
    </>
  )
}
