import { precioEnVista, useMonedaViajero } from '../../../lib/moneda'
import { useEffect, useState } from 'react'
import type { Route } from '../../../lib/types'
import type { DestinationExcursions } from '../../../lib/destinationExcursions'
import { useRouteStore } from '../../../store/useRouteStore'
import { quitarConDeshacer } from '../../../store/useAddFlowStore'
import { useAlojamientoUi } from '../../../store/useAlojamientoUi'
import { estanciasDelViaje, precioDeAlojamiento, zonaDeAlojamientoElegida } from '../../../lib/tuAlojamiento'
import { CabeceraBloque, ICONOS } from './BloqueReservas'
import { BloqueClaro, CajaDia, CajaNoches, FilaIcono, ParaQuienDesign, SeccionDatos, TarjetaCrema } from './PiezasDesignReservas'
import { LapizDeReserva, PapeleraRoja } from './BotonesDeReserva'
import { fechaCorta } from '../../../lib/nombreDeDia'
import { Icono } from '../../ui/Icono'
import { LineaDelPase } from '../../pase/Candado'
import { useLoSuyo } from '../../../store/useLoSuyo'
import { useEntradasDelGrupo } from '../../../hooks/useEntradasDelGrupo'
import { nombreDe } from '../../../store/useViajeCompartido'
import { entreEfectivo, idsConLoSuyo } from '../../../lib/loSuyo'
import { HojaAbajo, ojoStyle } from './HojaAbajo'
import { TimeListWheel } from '../../ui/TimeListWheel'
import type { EnCambioDeVuelo } from '../../../lib/cambioDeVuelo'
import { BotonComoLlegarAlojamiento } from '../alojamiento/BotonComoLlegarAlojamiento'
import { ReservaDelAlojamiento } from './ReservaDelAlojamiento'
import { reservaConDatos, textoHorasReserva } from '../../../lib/reservaAlojamiento'

/** La hoja de la zona (Tanda 6v): las zonas del destino en una rueda, como la de la hora, y [Guardar]. */
export function HojaZona({ zonas, actual, onGuardar, onClose }: { zonas: DestinationExcursions['zonasAlojamiento']; actual: string | null; onGuardar: (id: string) => void; onClose: () => void }) {
  const [id, setId] = useState(() => (zonas.some((zona) => zona.id === actual) ? (actual as string) : (zonas[0]?.id ?? '')))
  const elegida = zonas.find((zona) => zona.id === id) ?? zonas[0]
  return (
    <HojaAbajo titleId="hoja-zona" onClose={onClose}>
      <p className="max-w-[calc(100%-2.5rem)] text-text/50" style={ojoStyle}>
        Alojamiento
      </p>
      <h2 id="hoja-zona" className="mt-1 max-w-[calc(100%-3rem)] font-display text-[26px] leading-none text-text">
        ¿En qué zona te alojas?
      </h2>
      <div className="mt-4">
        <TimeListWheel
          tipo="lista"
          label="Zona del alojamiento"
          items={zonas.map((zona) => zona.nombre)}
          value={elegida?.nombre ?? ''}
          onChange={(nombre) => setId(zonas.find((zona) => zona.nombre === nombre)?.id ?? id)}
        />
        <p className="mt-2 min-h-[18px] text-center text-[12px] text-text/55">{elegida?.sub ?? ''}</p>
      </div>
      <button type="button" onClick={() => elegida && onGuardar(elegida.id)} className="mt-3 h-12 w-full rounded-full btn-champan text-[15px] font-semibold transition-transform active:scale-[.98]">
        Guardar
      </button>
    </HojaAbajo>
  )
}

/**
 * El bloque «Alojamiento» de RESERVAS (Tanda 6s, 6v y 6z). Cerrado, como «Llegada y vuelta» y «Entradas y Free Tour»: el icono, el título y una línea que dice cómo va («Falta», «✓ Hotel Artemide», de pago
 * «✓ Hotel Artemide · Monti» o «✓ Hotel Artemide · Falta la zona») con su flecha.
 *
 * Abierto, sin alojamiento: «¿Ya tienes alojamiento?» con [Añadir mi alojamiento] (la hoja «Tu alojamiento») y «¿Aún no?» con [Buscar alojamiento] (el mapa a pantalla completa). Con alojamiento: su nombre, las
 * noches del viaje, el precio si lo dijo, [Cambiar] y [Eliminar]. De pago, además, «¿En qué zona te alojas?» con su campo y su rueda (siempre a la vista; «Aún no lo sé» sigue contando «Falta»).
 * Poner el alojamiento es gratis en las dos versiones; la zona, solo de pago. El alojamiento solo informa: la zona (de pago) es lo que orienta la ruta. Se guarda con el viaje, uno por destino.
 */
export function AlojamientoReservas({
  route,
  info,
  pago,
  abierto,
}: {
  route: Route
  info: DestinationExcursions
  pago: boolean
  abierto: boolean
  onToggle: () => void
  /** (Se conserva por el panel: la zona se elige en la hoja y el rehacer lo lanza `AlojamientoHost`.) */
  onCambioDeVuelo?: EnCambioDeVuelo
}) {
  useMonedaViajero() // (10N7) se repinta al cambiar la moneda
  const zona = useRouteStore((state) => state.route?.accommodationZone ?? null)
  const direccion = useRouteStore((state) => state.route?.accommodationAddress ?? null)
  const setHotel = useRouteStore((state) => state.setAccommodationHotel)
  const abrirMapa = useAlojamientoUi((state) => state.abrirMapa)
  const abrirTuAlojamiento = useAlojamientoUi((state) => state.abrirTuAlojamiento)
  const grupoLoSuyo = useLoSuyo((s) => s.grupo)
  const g = useEntradasDelGrupo()
  const cuentasEntre = useRouteStore((state) => state.route?.cuentasEntre)
  const estancia = estanciasDelViaje(route)[0] ?? null
  const segmentDayId = estancia?.segmentDayId ?? route.days[0]?.id ?? ''
  const noches = estancia?.noches ?? 0
  const hotel = useRouteStore((state) => state.accommodationSelections[segmentDayId]) ?? null
  const zonas = info.zonasAlojamiento
  const elegida = zonas.find((candidate) => candidate.id === zona) ?? null
  const zonaHecha = alojamientoHecho(elegida?.id)
  const precio = precioDeAlojamiento(hotel)

  // Con el hotel puesto pero sin la zona (de pago) la línea sigue en rosa: lo que falta es la zona.
  const resumenVerde = pago ? zonaHecha : true
  const hayAlgo = Boolean(hotel) || zonaHecha
  /** (10S9 §1) Falta algo = no hay alojamiento puesto o falta la zona (de pago). */
  const faltaAlgo = !hayAlgo || !resumenVerde
  /** (10S9 §1) Al entrar: abierto si falta algo, cerrado si está «Listo». El viajero lo puede cerrar SIEMPRE (y abrir) con la cabecera; su gesto manda hasta que cambie lo que falta o el panel pida abrirlo. */
  const [desplegadoUsuario, setDesplegadoUsuario] = useState<boolean | null>(null)
  useEffect(() => setDesplegadoUsuario(null), [faltaAlgo, abierto])
  const desplegado = desplegadoUsuario ?? (faltaAlgo || abierto)
  const alternarBloque = () => setDesplegadoUsuario(!desplegado)
  const nombreHotel = hotel?.name && !(pago && elegida && hotel.name === elegida.nombre) ? hotel.name : null
  const rango = route.answers.dateRange

  // (10S7 §5) Con la reserva del hotel (A2) las filas ya dicen la dirección, las fechas y las noches: no se repiten las de la ruta.
  const conReserva = reservaConDatos(hotel?.reserva)
  // «En este alojamiento · Tú y Viajes»: a quién cubre (solo el administrador, en un viaje con más gente).
  const adminId = g.gente.find((p) => p.esAdmin)?.id ?? null
  const todos = g.gente.map((p) => p.id)
  const efectivo = entreEfectivo(cuentasEntre?.[`aloj-${segmentDayId}`] ?? null, todos, idsConLoSuyo(grupoLoSuyo, 'alojamiento'), adminId)
  const quienes = g.gente.filter((p) => efectivo.includes(p.id))
  const nombresQuienes = (() => {
    const n = quienes.map((p) => (p.esYo ? 'Tú' : nombreDe(p) || 'Alguien'))
    return n.length <= 1 ? (n[0] ?? '') : `${n.slice(0, -1).join(', ')} y ${n[n.length - 1]}`
  })()

  // (10S8 §5) Las fechas de la caja de Design: «JUEVES 26 → DOMINGO 29» y «26 – 29 de noviembre». Las de la reserva si las trae; si no, las del viaje.
  const entradaIso = conReserva ? (hotel?.reserva?.entrada ?? rango?.start ?? null) : (rango?.start ?? null)
  const salidaIso = conReserva ? (hotel?.reserva?.salida ?? rango?.end ?? null) : (rango?.end ?? null)
  const nochesCaja = (conReserva ? hotel?.reserva?.noches : null) ?? noches
  const lineaFechas = entradaIso && salidaIso ? { rotulo: `${fechaCorta(entradaIso)} → ${fechaCorta(salidaIso)}`, grande: rangoDeFechas(entradaIso, salidaIso) } : null
  // La zona nuestra de verdad, sin lo que va entre paréntesis («Centro (Panteón, Trevi, Navona)» → «Zona Centro»).
  const zonaCorta = elegida ? elegida.nombre.replace(/\s*\(.*\)\s*$/, '').trim() : ''
  const zonaTexto = pago && elegida && zonaCorta ? (/^zona\b/i.test(zonaCorta) ? zonaCorta : `Zona ${zonaCorta}`) : null
  const gestionaAdmin = g.gente.length >= 2

  return (
    <>
      <BloqueClaro bloque="aloj">
        {hayAlgo ? (
          <>
            {/* (10S8 §5, A1/A2) La cabecera clara: icono, título y «Listo» (en cuanto el hotel está puesto; el documento es un extra y del pase) o «Falta», SIN línea de texto debajo. Con todo listo se pliega y se abre al tocarla; mientras falta algo, abierto. */}
            <div data-aloj-cabecera>
              <CabeceraBloque icono={ICONOS.hotel} titulo="Alojamiento" datos="alojamiento" onClick={alternarBloque} estado={resumenVerde ? 'Listo' : 'Falta la zona'} hecho={resumenVerde} abierto={desplegado} className="px-0.5" />
            </div>
            {/* La línea del pase (sin pase): con el bloque cerrado, debajo de la cabecera; abierto, dentro y debajo (al final). */}
            {!pago && !desplegado && <LineaDelPase clave="alojamiento" datos="alojamiento-tarjeta" texto="Con el {pase}, adaptamos tus días a donde duermes y llegas a tu alojamiento en un toque, estés donde estés." />}
            {desplegado && (
              <>
                <ReservaDelAlojamiento hotel={hotel ?? { name: '', precio: null }} segmentDayId={segmentDayId} nombreMostrado={nombreHotel} conPase={pago} direccionDelViaje={direccion} año={rango?.start ? Number(rango.start.slice(0, 4)) : undefined}>
                  {({ reserva, localizador, esAdmin, abrirDatos, botonAnadir }) => {
                    const dirTexto = reserva?.direccion ?? direccion
                    const filaDireccion = [zonaTexto, dirTexto].filter(Boolean).join(' · ')
                    const horas = reserva ? textoHorasReserva(reserva) : null
                    const hayFilas = (gestionaAdmin && quienes.length > 0) || precio !== null || Boolean(filaDireccion) || Boolean(horas) || Boolean(reserva?.telefono) || Boolean(localizador)
                    return (
                      <TarjetaCrema datos="aloj">
                        <div className="flex flex-col gap-3" data-alojamiento-caja data-tu-zona={pago && elegida ? '' : undefined} data-hotel-puesto={hotel ? '' : undefined}>
                          <div className="flex items-start gap-2.5">
                            <span className="min-w-0 flex-1 [overflow-wrap:anywhere]" style={{ font: "400 28px/1.05 'Instrument Serif',serif" }} data-alojamiento-nombre>
                              {nombreHotel ?? elegida?.nombre ?? 'Tu alojamiento'}
                            </span>
                            <LapizDeReserva onClick={() => abrirTuAlojamiento(segmentDayId)} etiqueta="Cambiar el alojamiento" datos="aloj-arriba" />
                          </div>
                          {(lineaFechas || nochesCaja > 0) && (
                            <div className="flex items-stretch gap-2.5">
                              {lineaFechas && (
                                <span className="flex min-w-0 flex-1" data-alojamiento-fechas>
                                  <CajaDia rotulo={lineaFechas.rotulo} grande={lineaFechas.grande} pequeno />
                                </span>
                              )}
                              {nochesCaja > 0 && (
                                <span className="flex" data-alojamiento-noches>
                                  <CajaNoches noches={nochesCaja} />
                                </span>
                              )}
                            </div>
                          )}
                          <SeccionDatos datos="aloj" onLapiz={esAdmin && hotel && (reserva || localizador) ? abrirDatos : undefined} etiquetaLapiz="Cambiar los datos de la reserva" sinLineaAbajo={!hayFilas}>
                            {gestionaAdmin && quienes.length > 0 && (
                              <span data-en-este-alojamiento>
                                <ParaQuienDesign gente={quienes} />
                                <span hidden data-en-este-alojamiento-nombres>
                                  {nombresQuienes}
                                </span>
                              </span>
                            )}
                            {precio !== null && (
                              <FilaIcono icono="euro" datos="precio">
                                <span data-alojamiento-precio>{precioEnVista(precio)}</span>
                              </FilaIcono>
                            )}
                            {filaDireccion && (
                              <FilaIcono icono="direccion" datos="direccion">
                                <span data-direccion-tarjeta>{filaDireccion}</span>
                              </FilaIcono>
                            )}
                            {horas && (
                              <FilaIcono icono="horas" datos="horas">
                                {horas}
                              </FilaIcono>
                            )}
                            {reserva?.telefono && (
                              <FilaIcono icono="telefono" datos="telefono">
                                {reserva.telefono}
                              </FilaIcono>
                            )}
                            {localizador && (
                              <FilaIcono icono="entrada" datos="localizador">
                                Localizador {localizador}
                              </FilaIcono>
                            )}
                            {!hayFilas && <span className="text-[13px] text-text/55">Para quién es y cuánto ha costado.</span>}
                          </SeccionDatos>
                          {pago && (elegida || direccion) && <BotonComoLlegarAlojamiento direccion={direccion} variante="design" />}
                          {hotel && botonAnadir}
                          {hotel && <PapeleraRoja etiqueta="Quitar el alojamiento" datos="alojamiento" onClick={() => quitarConDeshacer('Alojamiento quitado del viaje', () => setHotel(segmentDayId, null))} />}
                        </div>
                      </TarjetaCrema>
                    )
                  }}
                </ReservaDelAlojamiento>
                {!pago && <LineaDelPase clave="alojamiento" datos="alojamiento-tarjeta" texto="Con el {pase}, adaptamos tus días a donde duermes y llegas a tu alojamiento en un toque, estés donde estés." />}
              </>
            )}
          </>
        ) : (
          <>
            <CabeceraBloque icono={ICONOS.hotel} titulo="Alojamiento" datos="alojamiento" onClick={alternarBloque} estado="Falta" hecho={false} abierto={desplegado} className="px-0.5" />
            {desplegado && (
              <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-2.5">
                  <span className="text-[14px] font-medium">¿Ya tienes alojamiento?</span>
                  <button
                    type="button"
                    onClick={() => abrirTuAlojamiento(segmentDayId)}
                    data-anadir-alojamiento
                    className="flex h-12 w-full items-center justify-center rounded-full border border-text/20 bg-white text-[14.5px] font-semibold text-text transition-transform active:scale-[.98]"
                  >
                    Añadir mi alojamiento
                  </button>
                  <span className="mt-1 text-[14px] font-medium">¿Aún no?</span>
                  <button
                    type="button"
                    onClick={() => abrirMapa(segmentDayId)}
                    data-activo-invitado
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full btn-champan text-[14.5px] font-semibold transition-transform active:scale-[.98]"
                  >
                    <Icono nombre={ICONOS.lupa} size={15} />
                    Buscar alojamiento
                  </button>
                </div>
                {!pago && <LineaDelPase clave="alojamiento" datos="alojamiento-tarjeta" texto="Con el {pase}, adaptamos tus días a donde duermes y llegas a tu alojamiento en un toque, estés donde estés." />}
              </div>
            )}
          </>
        )}
      </BloqueClaro>
    </>
  )
}

/** (10S8 §5) «26 – 29 de noviembre» (mismo mes) o «28 de octubre – 2 de noviembre». */
export function rangoDeFechas(desde: string, hasta: string): string {
  const a = new Date(`${desde}T12:00:00`)
  const b = new Date(`${hasta}T12:00:00`)
  const mes = (f: Date) => new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(f)
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear() ? `${a.getDate()} – ${b.getDate()} de ${mes(b)}` : `${a.getDate()} de ${mes(a)} – ${b.getDate()} de ${mes(b)}`
}

/** ¿Está hecha la zona del alojamiento? Con una zona elegida («Aún no lo sé» no cuenta). */
export const alojamientoHecho = zonaDeAlojamientoElegida
