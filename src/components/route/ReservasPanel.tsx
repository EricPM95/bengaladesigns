import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Route } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'
import { useReservasFocusStore, type BloqueReservasId } from '../../store/useReservasFocusStore'
import { useDatesCalendarStore } from '../../store/useDatesCalendarStore'
import { rehacerPorCambioDeVuelo, type EnCambioDeVuelo } from '../../lib/cambioDeVuelo'
import { buildDestinationSegments } from '../../lib/destinationSegments'
import { buildEntradasBloque, hasEnoughDaysForExcursions } from '../../lib/bookings'
import { useDestinationExcursions } from '../../lib/destinationExcursions'
import { useArrivalInfo } from '../../lib/arrivalReturn'
import { legsOf, type LegKind } from '../../lib/reservasLegs'
import { pagoActivo } from '../../lib/pago'
import { getTodayTripStatus } from '../../lib/todayMode'
import { DestinationReservasAccordion } from './reservas/DestinationReservasAccordion'
import { LlegadaYVuelta } from './reservas/LlegadaYVuelta'
import { AlojamientoReservas } from './reservas/AlojamientoReservas'
import { alojamientoCubierto } from '../../lib/tuAlojamiento'
import { TarjetaCuentaAtras } from './reservas/TarjetaCuentaAtras'
import { ResumenViaje } from './reservas/ResumenViaje'
import { EntradasYFreeTour } from './reservas/EntradasYFreeTour'
import { ExcursionesReservas } from './reservas/ExcursionesReservas'
import { UtilParaElViaje } from './reservas/UtilParaElViaje'
import { Icono } from '../ui/Icono'
import { diasDelViaje, textoDeDuracion } from '../../lib/duracionViaje'
import { useEntradasDelGrupo, useReservasParaMi } from '../../hooks/useEntradasDelGrupo'
import { ZonaGris } from './reservas/ZonaGris'

interface ReservasPanelProps {
  route: Route
  onClose: () => void
  /** Tanda 7: el enganche de los cambios de vuelo (ver `src/lib/cambioDeVuelo.ts`). Sin él, se usa `rehacerPorCambioDeVuelo` (el rehacer de siempre en segundo plano). */
  onCambioDeVuelo?: EnCambioDeVuelo
}

const MES = new Intl.DateTimeFormat('es-ES', { month: 'short' })

/** «10 – 14 ago 2027», «30 sep – 3 oct 2027» o, sin fechas, «5 días · 4 noches». */
export function rangoDelViaje(route: Route): string {
  const range = route.answers.dateRange
  if (!range?.start || !range?.end) return textoDeDuracion(diasDelViaje(route))
  const start = new Date(`${range.start}T12:00:00`)
  const end = new Date(`${range.end}T12:00:00`)
  const mes = (date: Date) => MES.format(date).replace('.', '')
  return start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
    ? `${start.getDate()} – ${end.getDate()} ${mes(end)} ${end.getFullYear()}`
    : `${start.getDate()} ${mes(start)} – ${end.getDate()} ${mes(end)} ${end.getFullYear()}`
}

/**
 * Pestaña RESERVAS (Tanda 6s, diseño «Reservas v4») — pantalla completa (mismo ✕ que RUTA/EXPLORAR), sin mapa. De arriba abajo: la tarjeta oscura de la cuenta atrás (Tanda 6z6), la tarjeta clara «Tu viaje a Roma · x de 3 listo» con lo que falta (gratis «x de 2»; Tanda 6z6b), Llegada y vuelta (solo de pago), Alojamiento,
 * Entradas y Free Tour, Excursiones y Útil para el viaje. El presupuesto NO se abre desde aquí abajo: solo desde la cartera de la cabecera (la de esta pantalla, `BotonCartera`). Todo lo de pago va detrás del mismo interruptor (`pagoActivo`, src/lib/pago.ts). En el ordenador, en dos columnas. Los viajes de varios
 * destinos conservan además el acordeón de cada destino. El % de «viaje listo» (useTripReadiness.ts) ya no sale en esta cabecera; solo queda el «!» de Reservas en la barra de abajo.
 */
export function ReservasPanel({ route, onClose, onCambioDeVuelo }: ReservasPanelProps) {
  const pago = pagoActivo()
  // Tanda 10N §8: quien mira el viaje de otra persona ve ESTA MISMA pantalla; lo que comparte el grupo (llegada, vuelta, alojamiento) sale en gris y sin tocar; las entradas, cada uno las suyas.
  const grupo = useEntradasDelGrupo()
  const reservations = useReservasParaMi()
  const accommodationZone = useRouteStore((state) => state.route?.accommodationZone ?? null)
  const accommodationSelections = useRouteStore((state) => state.accommodationSelections)
  const simulada = useRouteStore((state) => state.dev_simulated_today_iso)
  /** Después del viaje ya no queda nada por reservar: ni la tarjeta oscura (se esconde sola) ni la clara salen. */
  const viajeAcabado = getTodayTripStatus(route, simulada ?? undefined)?.phase === 'after'
  const pedido = useReservasFocusStore((state) => state.pedido)
  const limpiarPedido = useReservasFocusStore((state) => state.limpiar)
  const pedir = useReservasFocusStore((state) => state.pedir)
  const [openCity, setOpenCity] = useState<string | null>(null)
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>({})
  /** La mitad de «Llegada y vuelta» abierta: undefined = la que falta; null = ninguna. */
  const [mitad, setMitad] = useState<LegKind | null | undefined>(undefined)
  const scrollRef = useRef<HTMLDivElement>(null)

  const info = useDestinationExcursions(route.destination)
  // Las excursiones solo salen en los viajes de los días que marca el destino (`excursiones_desde_dias`): si no, ni el hueco.
  const hayExcursiones = info.excursions.length > 0 && hasEnoughDaysForExcursions(route, info.fromDays)
  const arrivalInfo = useArrivalInfo(route.destination, route.days[0]?.city ?? route.destination, route.origin)
  const segments = buildDestinationSegments(route.days)
  const unDestino = segments.length <= 1

  const abrir = (bloque: string, valor = true) => setAbiertos((previous) => ({ ...previous, [bloque]: valor }))
  const alternar = (bloque: string) => setAbiertos((previous) => ({ ...previous, [bloque]: !previous[bloque] }))

  // Las fichas del resumen, el «+ AÑADIR VUELO» de DÍAS y el «Editar» de la ventana de llegada piden un bloque: se abre y se baja hasta él.
  useEffect(() => {
    if (!pedido) return
    const bloque: BloqueReservasId = pedido.bloque
    abrir(bloque)
    if (bloque === 'llegada') setMitad(pedido.mitad ?? undefined)
    limpiarPedido()
    window.setTimeout(() => {
      const destino = scrollRef.current?.querySelector(`[data-blk="${bloque}"]`) as HTMLElement | null
      destino?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }, 80)
  }, [pedido, limpiarPedido])

  /** «¿Llegas o te vas otro día? Cambia las fechas del viaje»: el cambio de fechas que ya existe (el calendario de la cabecera del mapa, en Días). */
  const abrirFechas = () => {
    if (grupo.esInvitado) return // las fechas del viaje las cambia el dueño
    useDatesCalendarStore.getState().request()
  }

  /**
   * (Tanda 7) Al poner, cambiar o borrar una hora de Roma, un punto de Roma o la zona, los días se rehacen solos en segundo plano (`rehacerPorCambioDeVuelo`, que usa el rehacer de siempre: «Actualizando tu
   * ruta…», gana el último). Sustituye a la ventana «¿Ajustamos tu ruta a tu vuelo?». Es el punto de enganche para la hoja del resumen y para la decisión de qué se rehace de verdad.
   */
  const cambioDeVuelo: EnCambioDeVuelo = (cambio) => (onCambioDeVuelo ?? ((c) => void rehacerPorCambioDeVuelo(c)))(cambio)

  // El resumen de arriba, dentro de la tarjeta (gratis y de pago): dos o tres fichas.
  const { enRuta: entradas } = buildEntradasBloque(route, info.entradasOrden, info.entradas, reservations)
  const legs = legsOf(route, arrivalInfo)
  // (Gratis: «x de 2», Alojamiento · Entradas, y el alojamiento cuenta con el que puso el viajero; de pago: «x de 3», con Llegada y vuelta, y el alojamiento cuenta con la zona elegida.)
  const primerTramo = segments.find((segment) => segment.nights > 0)
  // (Tanda 6y4: la misma regla que el aviso de DÍAS y el «!» de preparación, `alojamientoCubierto`.)
  const alojamientoListo = alojamientoCubierto({ pago, unDestino, selections: accommodationSelections, zona: accommodationZone, segmentDayId: primerTramo?.dayIds[0] })
  const fichas = [
    // (Tanda 10G: «Llegada y vuelta» es GRATIS —guardar el vuelo o el tren es del viajero—; lo del pase es lo que la app hace con él, y sale cerrado debajo.)
    { bloque: 'llegada' as const, nombre: 'Llegada y vuelta', hecho: legs.arrival.done && legs.departure.done },
    { bloque: 'aloj' as const, nombre: 'Alojamiento', hecho: alojamientoListo },
    ...(entradas.length > 0 ? [{ bloque: 'entradas' as const, nombre: `Entradas ${entradas.filter((item) => item.reservation).length}/${entradas.length}`, hecho: entradas.every((item) => item.reservation) }] : []),
  ]

  const llegada = unDestino && (
    <ZonaGris activo={grupo.esInvitado} quien={grupo.nombreAdmin}>
      <LlegadaYVuelta
        route={route}
        info={arrivalInfo}
        zonas={info.zonasAlojamiento}
        abierto={Boolean(abiertos.llegada)}
        onToggle={() => alternar('llegada')}
        onAbrir={() => abrir('llegada')}
        mitadAbierta={mitad}
        onMitad={setMitad}
        onCambioDeVuelo={cambioDeVuelo}
        onFechas={abrirFechas}
      />
    </ZonaGris>
  )

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 flex flex-col overflow-hidden overflow-x-hidden bg-bg">
        <div className="flex shrink-0 items-center gap-3 px-4 pb-2 pt-4 md:px-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            title="Cerrar"
            className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full bg-bg-card text-accent"
            style={{ border: '1.5px solid rgb(var(--accent))' }}
          >
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
          {/* (Tanda 10N §2: la cartera, la campana y el perfil están ya en la cabecera de arriba, la misma de todas las pestañas.) */}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-10 pt-2 md:px-8">
          <div className="mx-auto flex w-full max-w-lg flex-col gap-3.5 md:max-w-[1120px]">
            {/* Arriba del todo (Tanda 6z6b): la tarjeta oscura con SOLO la cuenta atrás (después del viaje no sale) y, aparte y debajo, la clara con lo que falta por reservar (solo con un destino). */}
            <TarjetaCuentaAtras route={route} onPonFechas={abrirFechas} />
            {unDestino && !viajeAcabado && <ResumenViaje fichas={fichas} onFicha={(bloque) => pedir(bloque)} />}

            <div className="grid grid-cols-1 items-start gap-3.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <div className="flex min-w-0 flex-col gap-3.5">
                {llegada}
                {unDestino ? (
                  <ZonaGris activo={grupo.esInvitado} quien={grupo.nombreAdmin}>
                    <AlojamientoReservas route={route} info={info} pago={pago} abierto={Boolean(abiertos.aloj)} onToggle={() => alternar('aloj')} onCambioDeVuelo={cambioDeVuelo} />
                  </ZonaGris>
                ) : (
                  <ZonaGris activo={grupo.esInvitado} quien={grupo.nombreAdmin} className="flex flex-col gap-2.5">
                    <span className="text-text/55" style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }}>
                      Destinos
                    </span>
                    {segments.map((segment, index) => (
                      <DestinationReservasAccordion
                        key={segment.id}
                        route={route}
                        segment={segment}
                        isFirstSegment={index === 0}
                        isLastSegment={index === segments.length - 1}
                        expanded={openCity === segment.id}
                        onToggle={() => setOpenCity((current) => (current === segment.id ? null : segment.id))}
                      />
                    ))}
                  </ZonaGris>
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-3.5">
                <EntradasYFreeTour route={route} info={info} abierto={Boolean(abiertos.entradas)} onToggle={() => alternar('entradas')} />
              </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-3.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              {hayExcursiones && (
                <div className="flex min-w-0 flex-col gap-2.5" data-blk="excursiones">
                  <ExcursionesReservas route={route} info={info} />
                </div>
              )}
              <div className={hayExcursiones ? 'contents' : 'md:col-span-2'}>
                <UtilParaElViaje route={route} pago={pago} />
              </div>
            </div>
          </div>
        </div>

      </motion.div>
    </AnimatePresence>
  )
}
