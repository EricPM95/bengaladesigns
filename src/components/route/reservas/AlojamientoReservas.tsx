import { precioEnVista, useMonedaViajero } from '../../../lib/moneda'
import { useEffect, useState } from 'react'
import type { Route } from '../../../lib/types'
import type { DestinationExcursions } from '../../../lib/destinationExcursions'
import { useRouteStore } from '../../../store/useRouteStore'
import { quitarConDeshacer } from '../../../store/useAddFlowStore'
import { useAlojamientoUi } from '../../../store/useAlojamientoUi'
import { estanciasDelViaje, precioDeAlojamiento, zonaDeAlojamientoElegida } from '../../../lib/tuAlojamiento'
import { CabeceraBloque, ICONOS } from './BloqueReservas'
import { BloqueClaro, CajaDeDato, CajaDia, CajaNoches, FilaIcono, ParaQuienDesign, RejillaDeDatos, TarjetaCrema } from './PiezasDesignReservas'
import { IconoDeDocumento, LapizDeReserva, PapeleraRoja } from './BotonesDeReserva'
import { queEliminarAlojamiento } from '../../../lib/queEliminar'
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
import { revisarLaZonaDelAlojamiento } from '../../../lib/zonaDelAlojamiento'
import { AvisoDeDocumentoDeReserva } from './BotonesDeReserva'
import { MapaDelAlojamiento, MapaPequenoDelAlojamiento } from './MapaDelAlojamiento'
import { nochesEntre, reservaConDatos } from '../../../lib/reservaAlojamiento'

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
  // (V45, M3) El punto del alojamiento puesto en el mapa: sale el mapa pequeño con la dirección y [Cambiar].
  const punto = useRouteStore((state) => state.route?.accommodationPoint ?? null)
  const setPunto = useRouteStore((state) => state.setAccommodationPoint)
  const setDireccionRuta = useRouteStore((state) => state.setAccommodationAddress)
  const [cambiandoPunto, setCambiandoPunto] = useState(false)
  const abrirMapa = useAlojamientoUi((state) => state.abrirMapa)
  const abrirTuAlojamiento = useAlojamientoUi((state) => state.abrirTuAlojamiento)
  const grupoLoSuyo = useLoSuyo((s) => s.grupo)
  const g = useEntradasDelGrupo()
  const cuentasEntre = useRouteStore((state) => state.route?.cuentasEntre)
  const estancia = estanciasDelViaje(route)[0] ?? null
  const segmentDayId = estancia?.segmentDayId ?? route.days[0]?.id ?? ''
  const hotel = useRouteStore((state) => state.accommodationSelections[segmentDayId]) ?? null
  const zonas = info.zonasAlojamiento
  const elegida = zonas.find((candidate) => candidate.id === zona) ?? null
  const zonaHecha = alojamientoHecho(elegida?.id)
  const precio = precioDeAlojamiento(hotel)

  const hayAlgo = Boolean(hotel) || zonaHecha
  /** (10S9 §1) Al entrar: abierto si falta algo, cerrado si está «Listo». El viajero lo puede cerrar SIEMPRE (y abrir) con la cabecera; su gesto manda hasta que cambie lo que falta o el panel pida abrirlo. */
  const [desplegadoUsuario, setDesplegadoUsuario] = useState<boolean | null>(null)
  useEffect(() => setDesplegadoUsuario(null), [abierto])
  const desplegado = desplegadoUsuario ?? abierto // (10S10 §5) cerrado al entrar siempre
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
  // (V64 §5) Las noches SIEMPRE de las fechas (del 24 al 27 son 3), nunca de un número escrito aparte ni de la estancia.
  const nochesCaja = nochesEntre(entradaIso, salidaIso) ?? 0
  const lineaFechas = entradaIso && salidaIso ? { rotulo: `${fechaCorta(entradaIso)} → ${fechaCorta(salidaIso)}`, grande: rangoDeFechas(entradaIso, salidaIso) } : null
  // (V45 §3) «Listo» con el hotel y las fechas, haya documento (la reserva) o no; «Falta» solo si falta el hotel o las fechas. La zona y la reserva ya no lo encienden ni lo apagan.
  const resumenVerde = Boolean(hotel) && Boolean(lineaFechas)
  // La zona nuestra de verdad, sin lo que va entre paréntesis («Centro (Panteón, Trevi, Navona)» → «Zona Centro»).
  const zonaCorta = elegida ? elegida.nombre.replace(/\s*\(.*\)\s*$/, '').trim() : ''
  const gestionaAdmin = g.gente.length >= 2

  return (
    <>
      <BloqueClaro bloque="aloj">
        {hayAlgo ? (
          <>
            {/* (10S8 §5, A1/A2) La cabecera clara: icono, título y «Listo» (en cuanto el hotel está puesto; el documento es un extra y del pase) o «Falta», SIN línea de texto debajo. Con todo listo se pliega y se abre al tocarla; mientras falta algo, abierto. */}
            <div data-aloj-cabecera>
              <CabeceraBloque icono={ICONOS.hotel} titulo="Alojamiento" datos="alojamiento" onClick={alternarBloque} estado={resumenVerde ? 'Listo' : 'Falta'} hecho={resumenVerde} abierto={desplegado} className="px-0.5" />
            </div>
            {/* La línea del pase (sin pase): con el bloque cerrado, debajo de la cabecera; abierto, dentro y debajo (al final). */}
            {!pago && !desplegado && <LineaDelPase clave="alojamiento" datos="alojamiento-tarjeta" texto="Con el {pase}, adaptamos tus días a donde duermes y llegas a tu alojamiento en un toque, estés donde estés." />}
            {desplegado && (
              <>
                <ReservaDelAlojamiento hotel={hotel ?? { name: '', precio: null }} segmentDayId={segmentDayId} nombreMostrado={nombreHotel} conPase={pago} direccionDelViaje={direccion} año={rango?.start ? Number(rango.start.slice(0, 4)) : undefined}>
                  {({ reserva, localizador, esAdmin, abrirDatos, botonAnadir, subirOtra }) => {
                    const dirTexto = reserva?.direccion ?? direccion
                    const zonaCajaTexto = pago && elegida && zonaCorta ? zonaCorta : null
                    const hayCajas = precio !== null || Boolean(zonaCajaTexto) || Boolean(reserva?.horaEntrada) || Boolean(reserva?.horaSalida) || Boolean(reserva?.telefono) || Boolean(localizador)
                    return (
                      <TarjetaCrema datos="aloj">
                        <div className="flex flex-col gap-3" data-alojamiento-caja data-tu-zona={pago && elegida ? '' : undefined} data-hotel-puesto={hotel ? '' : undefined}>
                          <div className="flex items-start gap-2.5">
                            <span className="min-w-0 flex-1 [overflow-wrap:anywhere]" style={{ font: "400 28px/1.05 'Instrument Serif',serif" }} data-alojamiento-nombre>
                              {nombreHotel ?? elegida?.nombre ?? 'Tu alojamiento'}
                            </span>
                            {/* (V45 §1 y §3) El icono de la reserva junto al lápiz: gris con «+» si falta, dorado si está (al tocarlo, sus datos). */}
                            <span className="flex flex-none items-center">
                              {esAdmin && hotel && <IconoDeDocumento hay={Boolean(reserva)} tipo="reserva" onAbrir={abrirDatos} datos="aloj" />}
                              <LapizDeReserva onClick={() => abrirTuAlojamiento(segmentDayId)} etiqueta="Cambiar el alojamiento" datos="aloj-arriba" />
                              {hotel && <PapeleraRoja etiqueta="Quitar el alojamiento" que={queEliminarAlojamiento()} datos="alojamiento" onClick={() => quitarConDeshacer('Alojamiento quitado del viaje', () => setHotel(segmentDayId, null))} />}
                            </span>
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
                          {/* (V64 §5) «DATOS DEL ALOJAMIENTO» del dibujo D5a: cajas en filas de dos (PRECIO / ZONA, ENTRADA / SALIDA, TELÉFONO / LOCALIZADOR); la que no tiene dato no sale y las demás se recolocan. «¿Para quién es?» se queda (V46). */}
                          {gestionaAdmin && quienes.length > 0 && (
                            <span data-en-este-alojamiento>
                              <ParaQuienDesign gente={quienes} />
                              <span hidden data-en-este-alojamiento-nombres>
                                {nombresQuienes}
                              </span>
                            </span>
                          )}
                          {hayCajas ? (
                            <RejillaDeDatos rotulo="DATOS DEL ALOJAMIENTO" datos="aloj">
                              {precio !== null && (
                                <CajaDeDato rotulo="PRECIO" icono={{ eur: true }} datos="precio">
                                  <span data-alojamiento-precio>{precioEnVista(precio)}</span>
                                </CajaDeDato>
                              )}
                              {zonaCajaTexto && (
                                <CajaDeDato rotulo="ZONA" icono={{ d: D_ZONA }} datos="zona">
                                  <span data-zona-tarjeta>{zonaCajaTexto}</span>
                                </CajaDeDato>
                              )}
                              {reserva?.horaEntrada && (
                                <CajaDeDato rotulo="ENTRADA" icono={{ d: D_ENTRADA }} datos="hora-entrada">
                                  Desde las {reserva.horaEntrada}
                                </CajaDeDato>
                              )}
                              {reserva?.horaSalida && (
                                <CajaDeDato rotulo="SALIDA" icono={{ d: D_SALIDA }} datos="hora-salida">
                                  Hasta las {reserva.horaSalida}
                                </CajaDeDato>
                              )}
                              {reserva?.telefono && (
                                <CajaDeDato rotulo="TELÉFONO" icono={{ d: D_TELEFONO }} datos="telefono" onClick={() => llamar(reserva.telefono as string)}>
                                  {reserva.telefono}
                                </CajaDeDato>
                              )}
                              {localizador && (
                                <CajaDeDato rotulo="LOCALIZADOR" icono={{ d: D_LOCALIZADOR }} datos="localizador">
                                  {localizador}
                                </CajaDeDato>
                              )}
                            </RejillaDeDatos>
                          ) : (
                            !punto && !dirTexto && <span className="text-[13px] text-text/55">Para quién es y cuánto ha costado.</span>
                          )}
                          {punto && pago && (
                            <div data-alojamiento-mapa-tarjeta>
                              <MapaPequenoDelAlojamiento punto={punto} puedeCambiar={esAdmin} onCambiar={() => setCambiandoPunto(true)} />
                            </div>
                          )}
                          {dirTexto && !(punto && pago) && (
                            <FilaIcono icono="direccion" datos="direccion">
                              <span data-direccion-tarjeta>{dirTexto}</span>
                            </FilaIcono>
                          )}
                          <AvisoDeDocumentoDeReserva clave={`aloj:${segmentDayId}`} documento="documento_alojamiento" onSubir={subirOtra} onEscribir={abrirDatos} />
                          {pago && (elegida || direccion) && <BotonComoLlegarAlojamiento direccion={direccion} variante="design" />}
                          {hotel && botonAnadir}
                        </div>
                      </TarjetaCrema>
                    )
                  }}
                </ReservaDelAlojamiento>
                {!pago && <LineaDelPase clave="alojamiento" datos="alojamiento-tarjeta" texto="Con el {pase}, adaptamos tus días a donde duermes y llegas a tu alojamiento en un toque, estés donde estés." />}
                {cambiandoPunto && (
                  <MapaDelAlojamiento
                    inicial={punto}
                    onVolver={() => setCambiandoPunto(false)}
                    onElegido={(p) => {
                      setPunto(p)
                      setDireccionRuta(p.direccion)
                      // (V64 §6) ¿Cae en otra zona que la elegida?
                      void revisarLaZonaDelAlojamiento({ direccion: p.direccion, punto: p })
                      setCambiandoPunto(false)
                    }}
                  />
                )}
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

// (V64) Los trazos de las cajas de dato (los de Design D5a).
const D_ZONA = 'M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10zM12 8.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z'
const D_ENTRADA = 'M15 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h10'
const D_SALIDA = 'M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M14 8l4 4-4 4M18 12H8'
const D_TELEFONO = 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2'
const D_LOCALIZADOR = 'M3 9a2 2 0 0 0 0 6v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a2 2 0 0 1 0-6V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1zM14 5v14'
/** Tocar el teléfono llama (el móvil abre su marcador). */
const llamar = (telefono: string) => {
  window.location.href = `tel:${telefono.replace(/[^\d+]/g, '')}`
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
