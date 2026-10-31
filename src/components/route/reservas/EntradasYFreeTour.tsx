import { useEffect, useState } from 'react'
import { leerImporte, type Importe } from '../../../lib/dinero'
import type { Route, Stop } from '../../../lib/types'
import type { DestinationExcursions } from '../../../lib/destinationExcursions'
import { buildEntradasBloque, type BloqueEntrada } from '../../../lib/bookings'
import { elDia, fechaCorta, diaTitulo } from '../../../lib/nombreDeDia'
import { aplicarAvisoFueraDeDia, reservasFueraDeSuDia, type ReservaFueraDeDia } from '../../../lib/reservaFueraDeDia'
import { ICONOS } from './BloqueReservas'
import { TarjetaPorReservar, TarjetaReservada, ROTULO } from './TarjetasEntradas'
import { FueraDeRutaFila } from './FueraDeRutaFila'
import { FichaEntrada } from './FichaEntrada'
import { TarjetaEntradaBillete, CodigoDeEntradaPantallaCompleta } from './EntradaConBillete'
import { useBilletesDeEntradas } from '../../../hooks/useBilleteEntrada'
import { useBilleteStore, entradaConCodigo, type BilleteDeEntrada } from '../../../store/useBilleteStore'
import { OtraReservaBuscador } from './OtraReservaBuscador'
import { esReservaLibre } from '../../../lib/otraReserva'
import { AddReservationSheet, type ReservationTarget } from './AddReservationSheet'
import { Icono } from '../../ui/Icono'
import { useEntradasDelGrupo, useReservasParaMi, reservaDelDuenoDe } from '../../../hooks/useEntradasDelGrupo'
import { useReservasGrupoUi } from '../../../store/useReservasGrupoUi'
import { entradasQueNoCuadran, idsIncluidos } from '../../../lib/reservasGrupo'
import { precioEnVista, useMonedaViajero } from '../../../lib/moneda'
import { frase, textoLaTienen } from '../../../lib/entradasDelGrupo'
import { nombreDe } from '../../../store/useViajeCompartido'
import type { Reservation } from '../../../lib/bookings'

const MES = new Intl.DateTimeFormat('es-ES', { month: 'short' })

/** «11 oct · 10:00» (con fechas) o «Día 2 · 10:00» (sin ellas): lo que lleva una reservada en su línea verde. */
export function metaReserva(route: Route, reservation: { dateIso: string | null; dayNumber: number | null; time: string; precio?: Importe | null }, prefijoHora = ''): string {
  const fecha = reservation.dateIso && route.answers.dateRange ? `${Number(reservation.dateIso.slice(8, 10))} ${MES.format(new Date(`${reservation.dateIso}T12:00:00`)).replace('.', '')}` : `Día ${reservation.dayNumber ?? ''}`.trim()
  // (Tanda 6z2) El precio, al final, si el viajero lo puso: «11 ago · 10:00 · 54 €». Sin precio, como siempre.
  const precio = leerImporte(reservation.precio)
  return `${fecha} · ${prefijoHora}${reservation.time}${precio ? ` · ${precioEnVista(precio)}` : ''}`
}

/** (10S6) «Jueves 26 · 09:15 · 50 €»: el día ENTERO (como Design L2), la hora y el precio si lo hay. Sin fechas, «Día 2 · 09:15». */
export function metaReservaEntera(route: Route, reservation: { dateIso: string | null; dayNumber: number | null; time: string; precio?: Importe | null }): string {
  const fecha = reservation.dateIso && route.answers.dateRange ? fechaCorta(reservation.dateIso) : `Día ${reservation.dayNumber ?? ''}`.trim()
  const precio = leerImporte(reservation.precio)
  return `${fecha} · ${reservation.time}${precio ? ` · ${precioEnVista(precio)}` : ''}`
}

/** (10S7) «Viernes 27 · 09:00»: el día entero y la hora, sin el precio (lo que lleva el código a pantalla completa). */
export function cuandoDeLaReserva(route: Route, reservation: { dateIso: string | null; dayNumber: number | null; time: string }): string {
  const fecha = reservation.dateIso && route.answers.dateRange ? fechaCorta(reservation.dateIso) : `Día ${reservation.dayNumber ?? ''}`.trim()
  return `${fecha} · ${reservation.time}`
}

/** (10S6) «En tu ruta · Jueves 26» (con fechas) o «En tu ruta · Día 2»: la etiqueta de una por reservar, con el día entero. */
export function enTuRutaDia(route: Route, day: { dayNumber: number; id: string } | null): string {
  if (!day) return ''
  const full = route.days.find((candidate) => candidate.id === day.id)
  return `En tu ruta · ${diaTitulo(route, full?.dayNumber ?? day.dayNumber)}`
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
        className="zona-toque h-8 whitespace-nowrap rounded-full border border-accent px-3.5 text-[12.5px] font-semibold text-accent transition-colors hover:bg-accent-soft disabled:opacity-50"
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
  useMonedaViajero() // (10N7) se repinta al cambiar la moneda
  // Tanda 10N §8: quien mira el viaje de otra persona ve las entradas como su propia lista: las que ha comprado él, las que el dueño compró también para él, y de las demás, el día y la hora del dueño.
  const grupo = useEntradasDelGrupo()
  const reservations = useReservasParaMi()
  const [buscando, setBuscando] = useState(false)
  const [target, setTarget] = useState<ReservationTarget | null>(null)
  const [ficha, setFicha] = useState<BloqueEntrada | null>(null)
  // (10S7 §3 y §4) El billete de cada entrada (privado de esta persona) y el código a pantalla completa.
  const billetes = useBilletesDeEntradas()
  const [codigoAbierto, setCodigoAbierto] = useState<{ titulo: string; cuando: string; billete: BilleteDeEntrada & { codigo: NonNullable<BilleteDeEntrada['codigo']> } } | null>(null)
  const { enRuta, masEntradas } = buildEntradasBloque(route, info.entradasOrden, info.entradas, reservations, Object.keys(info.entradasPorSitio ?? {}))
  const pedido = useReservasGrupoUi((state) => state.pedido)
  const limpiarPedido = useReservasGrupoUi((state) => state.limpiar)
  // (Tanda 10N6 §1l) Las entradas de los demás —del dueño o de un invitado, da igual— se miran igual: la que me cubre sale como mía (verde), las que no me cubren, en azul con dorado y con quién las tiene.
  const deOtrosDe = (item: BloqueEntrada) => (grupo.compartido && !item.reservation ? grupo.deOtros.filter((x) => reservaDelDuenoDe([x.reserva], item)) : [])
  const delDuenoDe = (item: BloqueEntrada) => deOtrosDe(item)[0]?.reserva ?? null
  const quienesDe = (item: BloqueEntrada) => frase([...new Set(deOtrosDe(item).flatMap((x) => grupo.nombresDe(x)))])
  const textoDe = (item: BloqueEntrada) => textoLaTienen(route, deOtrosDe(item).map((x) => ({ nombres: grupo.nombresDe(x), reserva: x.reserva })))
  const esMia = (id: string) => (grupo.esInvitado ? grupo.mias.some((m) => m.id === id) : grupo.reservasDelDueno.some((m) => m.id === id))
  const compradorDe = (id: string) => nombreDe(grupo.gente.find((p) => p.id === grupo.deOtros.find((x) => x.reserva.id === id)?.compradorId)) || grupo.nombreAdmin || 'El dueño'
  // Los botones de la campana («Reservar la mía a la misma hora», «Ya la tengo») piden abrir la entrada de la reserva del dueño.
  useEffect(() => {
    if (!pedido) return
    const reserva = grupo.deOtros.find((x) => x.reserva.id === pedido.reservaId)?.reserva ?? grupo.reservasDelDueno.find((r) => r.id === pedido.reservaId)
    const item = reserva ? [...enRuta, ...masEntradas].find((candidato) => reservaDelDuenoDe([reserva], candidato)) : null
    limpiarPedido()
    if (!reserva || !item) return
    setTarget({ kind: 'entrada', refId: item.isFreeTour ? 'Free Tour' : item.name, name: item.name, placeNames: item.placeNames, currentDayId: item.day?.id ?? null, igualQue: { reserva, quien: compradorDe(reserva.id), modo: pedido.accion === 'misma-hora' ? 'comprar' : 'tengo' } })
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
    // (10S4) La escrita a mano en [Añadir otra reserva] conserva su refId «otra:…» para volver a abrirla con «Cambiar».
    refId: item.reservation && esReservaLibre(item.reservation) ? item.reservation.refId : item.isFreeTour ? 'Free Tour' : item.name,
    name: item.name,
    placeNames: item.placeNames,
    currentDayId: item.day?.id ?? null,
  })
  // Ruta a mano (Tanda 6y2): una reserva cuyo sitio no está en el día de su fecha lleva su aviso con su botón en su propia tarjeta (y el mismo en la campana).
  const fuera = grupo.esInvitado ? [] : reservasFueraDeSuDia(route, reservations, info.nombresCortos)
  const avisoDe = (reservationId: string) => fuera.find((aviso) => aviso.reservation.id === reservationId) ?? null
  const etiquetaDe = (item: BloqueEntrada) => (item.isFreeTour ? 'Free Tour' : 'Entrada')
  const botonDe = (item: BloqueEntrada) => (item.isFreeTour ? 'Reservar Free Tour' : 'Reservar entrada')

  /** (10S7) La parada de ese sitio en la ruta (la que tiene foto, si hay varias): de ella sale la foto de la miniatura, la misma de DÍAS y de su ficha. */
  const paradaDe = (item: BloqueEntrada): Stop | null => {
    const paradas = route.days.flatMap((day) => day.stops.filter((stop) => !stop.passThrough && (item.isFreeTour ? stop.isFreeTour : !stop.isFreeTour && item.placeNames.includes(stop.name))))
    return paradas.find((stop) => stop.photoUrl) ?? paradas[0] ?? null
  }
  const sinReservar = enRuta.filter((item) => !item.reservation)
  const conReserva = enRuta.filter((item) => item.reservation)

  /** Una reservada (Design «Entradas Lista» L2): borde verde, ✓ en la miniatura, «Reservada», nombre, día entero · hora · precio y «Cambiar». Sin el botón del código (llega con el billete de las entradas). */
  const filaReservada = (item: BloqueEntrada) => {
    const reserva = item.reservation!
    const mia = esMia(reserva.id)
    const nota = !mia
      ? `${compradorDe(reserva.id)} la ha reservado para ti`
      : !item.inRoute && !reserva.fueraDeRuta && !esReservaLibre(reserva)
        ? 'Ya no está en tu ruta'
        : grupo.compartido && !grupo.esInvitado
          ? paraQuienTexto(reserva)
          : undefined
    const billete = mia ? billetes.de(reserva.refId) : null
    const cuando = cuandoDeLaReserva(route, reserva)
    return (
      <div key={item.clave} className="flex flex-col gap-2" data-entrada-fila={item.name}>
        <TarjetaReservada onCodigo={entradaConCodigo(billete) ? () => setCodigoAbierto({ titulo: item.name, cuando, billete }) : undefined} etiqueta={item.isFreeTour ? 'Reservado' : 'Reservada'} name={item.name} meta={metaReservaEntera(route, reserva)} nota={nota} onChange={mia ? () => setTarget({ ...targetOf(item), existing: reserva }) : undefined} parada={paradaDe(item)} ciudad={route.destination} freeTour={item.isFreeTour} />
        {mia && reserva.kind === 'entrada' && (
          <TarjetaEntradaBillete
            billete={billete}
            nombre={item.name}
            cuando={cuando}
            año={route.answers.dateRange ? Number(route.answers.dateRange.start.slice(0, 4)) : undefined}
            onLeida={(lectura) => setTarget({ ...targetOf(item), existing: reserva, lectura })}
            onQuitar={() => useBilleteStore.getState().quitarEntrada(billetes.tripId, reserva.refId)}
          />
        )}
        {reserva.fueraDeRuta && <FueraDeRutaFila reservaId={reserva.id} esFreeTour={item.isFreeTour} />}
        {avisoDe(reserva.id) && <AvisoFueraDeDiaTarjeta aviso={avisoDe(reserva.id)!} />}
        {noCuadran.filter((aviso) => aviso.cambio.reservaId === reserva.id).map((aviso) => (
          <p key={aviso.id} data-entrada-no-cuadra className="rounded-[14px] px-3.5 py-2.5 text-[12.5px] leading-snug text-text" style={{ background: 'color-mix(in srgb, rgb(var(--accent-gold)) 14%, transparent)' }}>
            {aviso.texto}
          </p>
        ))}
      </div>
    )
  }

  /** Una por reservar (Design L1): miniatura con la entrada, «En tu ruta · Jueves 26», nombre, [Reservar entrada] y «¿Ya la tienes? Añádela». */
  const filaPorReservar = (item: BloqueEntrada) => {
    const delDueno = delDuenoDe(item)
    const cuando = enTuRutaDia(route, item.day)
    return (
      <TarjetaPorReservar
        key={item.clave}
        eyebrow={[item.isFreeTour ? 'Free Tour' : '', cuando].filter(Boolean).join(' · ') || etiquetaDe(item)}
        name={item.name}
        delGrupo={!!delDueno}
        buyLabel={delDueno ? 'Reservar la mía a la misma hora' : botonDe(item)}
        onBuy={() => (delDueno ? setTarget({ ...targetOf(item), igualQue: { reserva: delDueno, quien: quienesDe(item), modo: 'comprar' } }) : setFicha(item))}
        onAdd={() => setTarget(delDueno ? { ...targetOf(item), igualQue: { reserva: delDueno, quien: quienesDe(item), modo: 'tengo' } } : targetOf(item))}
        nota={delDueno ? textoDe(item) : undefined}
        freeTour={item.isFreeTour}
        parada={paradaDe(item)}
        ciudad={route.destination}
      />
    )
  }

  return (
    <>
      <div data-blk="entradas" className="flex flex-col gap-3">
        {/* La cabecera de Design (L1/L2): tarjeta oscura con el icono, «2 de 8» en dorado y la barra. */}
        <div onClick={onToggle} data-cabecera-entradas className="flex cursor-pointer items-center gap-3.5 rounded-[24px] px-4 py-3.5" style={{ background: '#1C2230', color: '#FBF3E2' }}>
          <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[14px]" style={{ background: 'rgba(233,199,122,.16)', border: '1px solid rgba(233,199,122,.45)', color: '#F3D88F' }}>
            <Icono nombre={ICONOS.ticket} size={23} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-[7px]">
            <span className="flex items-baseline justify-between gap-2">
              <span style={{ font: "400 23px/1 'Instrument Serif',serif" }}>Entradas y Free Tour</span>
              <span data-estado={hecho ? 'hecho' : 'falta'} style={{ font: "600 13px 'Geist'", color: '#F3D88F' }}>
                {enRuta.length > 0 ? (
                  <>
                    {`${reservadas} de ${enRuta.length}`}
                    <span className="sr-only"> reservadas</span>
                  </>
                ) : (
                  'Ninguna en tu ruta'
                )}
              </span>
            </span>
            {enRuta.length > 0 && (
              <span className="block h-1.5 overflow-hidden rounded-[3px]" style={{ background: 'rgba(251,243,226,.16)' }} aria-hidden="true">
                <span className="block h-full rounded-[3px] transition-[width]" style={{ width: `${(reservadas / enRuta.length) * 100}%`, background: 'linear-gradient(90deg,#B58A2E,#F3D88F)' }} />
              </span>
            )}
          </span>
          <Icono nombre="abajo" size={20} style={{ color: '#F3D88F', flex: 'none', transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform .35s cubic-bezier(.2,.8,.2,1)' }} />
        </div>
        {abierto && (
          <>
            {conReserva.length > 0 && (
              <>
                <span data-seccion-reservadas style={ROTULO}>
                  Reservadas · {conReserva.length}
                </span>
                {conReserva.map(filaReservada)}
              </>
            )}
            {sinReservar.length > 0 && (
              <>
                {conReserva.length === 0 && (
                  <span className="flex items-center gap-2 text-[12.5px] font-medium text-text/60">
                    <Icono nombre="reloj" size={15} style={{ color: '#B58A2E' }} />
                    Las más buscadas se agotan: resérvalas pronto
                  </span>
                )}
                <span data-seccion-por-reservar data-en-tu-ruta style={ROTULO}>
                  Por reservar · {sinReservar.length}
                </span>
                {sinReservar.map(filaPorReservar)}
              </>
            )}
            {enRuta.length === 0 && (
              <p className="px-1 text-[13px] leading-snug text-text/65" data-sin-entradas-en-ruta>
                Ninguna parada de tu ruta necesita entrada. Si añades un sitio con entrada, saldrá aquí solo.
              </p>
            )}
            {/* (10S4) Fuera «Ver n más»: en su lugar, [Añadir otra reserva] (casilla libre con sugerencias de sitios nuestros). */}
            <button type="button" onClick={() => setBuscando(true)} data-anadir-otra-reserva className="flex h-12 items-center justify-center gap-2 rounded-[15px] border-[1.5px] border-dashed bg-transparent text-[14px] font-semibold" style={{ borderColor: 'rgba(181,138,46,.6)', color: '#8E6820' }}>
              <Icono nombre="anadir" size={16} />
              Añadir otra reserva
            </button>
          </>
        )}
      </div>
      {target && <AddReservationSheet route={route} target={target} onClose={() => setTarget(null)} />}
      {buscando && (
        <OtraReservaBuscador
          route={route}
          sitiosConEntrada={Object.keys(info.entradasPorSitio ?? {})}
          enRuta={enRuta}
          onClose={() => setBuscando(false)}
          onElegir={(siguiente) => {
            setBuscando(false)
            setTarget(siguiente)
          }}
        />
      )}
      {ficha && <FichaEntrada route={route} item={ficha} onClose={() => setFicha(null)} />}
      {codigoAbierto && <CodigoDeEntradaPantallaCompleta billete={codigoAbierto.billete} titulo={codigoAbierto.titulo} cuando={codigoAbierto.cuando} onClose={() => setCodigoAbierto(null)} />}
    </>
  )
}
