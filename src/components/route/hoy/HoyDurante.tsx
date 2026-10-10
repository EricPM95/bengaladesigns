import { useState } from 'react'
import type { Coordinates, DayPlan, Route, Stop } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import { dayOfReservation, shortDateEs } from '../../../lib/bookings'
import { numberedStopsOf, stopNumbersOf } from '../../../lib/stopKind'
import { pagoActivo } from '../../../lib/pago'
import { displayStopName } from '../../../lib/format'
import { hasRealCoordinates, haversineMeters } from '../../../lib/distanceMock'
import { buildGoogleMapsUrl, buildGoogleMapsUrlFromHere } from '../../../lib/mapsLinks'
import { Icono } from '../../ui/Icono'
import { BotonFoto } from '../fotos/BotonFoto'
import { RainAlert } from '../today/RainAlert'
import { TodayExcursion } from '../today/TodayExcursion'
import { CajaBlanca, FRAMBUESA, ojoMono, TINTA, VERDE } from './piezas'
import { useHorarioDeParadas, type HorarioDeParada } from '../../../lib/horarioDeParada'
import { AvisoEntradaReservada, AvisoSaltada, BotonNoMeDaTiempo, HojaPasarAOtroDia } from './saltar'

/** El horario de la parada ese día, en pequeño bajo su nombre: «Abre 9:00 – 19:15 · Última entrada 18:15» o «Cerrado hoy». Nada si no tiene horario (plazas, fuentes). */
function LineaDeHorario({ horario, oscuro = false }: { horario: HorarioDeParada | null; oscuro?: boolean }) {
  if (!horario) return null
  return (
    <span className={`${oscuro ? 'text-[12px]' : 'text-[11px]'} leading-[1.3]`} style={{ color: horario.cerrado ? (oscuro ? 'oklch(0.78 0.11 15)' : 'oklch(0.5 0.17 5)') : oscuro ? 'rgba(255,253,248,.7)' : 'rgba(28,34,48,.55)' }}>
      {horario.texto}
    </span>
  )
}

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
/** Lo que se anda en un minuto, a paso normal (80 m): de ahí sale «8 min andando». Es una duración, nunca una hora del día. */
const METROS_POR_MINUTO = 80

const lonLat = (punto: Coordinates) => `${punto.lng.toFixed(5)},${punto.lat.toFixed(5)}`

/** El mapa pequeño hasta la parada (diseño «Mapa · hasta la parada»): una imagen estática de Mapbox, sin un segundo mapa vivo (cada mapa vivo es otro lienzo de GPU). */
function MapaHastaLaParada({ desde, hasta }: { desde: Coordinates | null; hasta: Coordinates }) {
  const [fallo, setFallo] = useState(false)
  const relleno = <div className="h-[118px] rounded-[21px] bg-[#2A3141]" aria-hidden="true" />
  if (!TOKEN || fallo) return relleno
  // `padding` solo vale con `auto` (con centro y zoom, Mapbox contesta 422).
  const [pines, padding] = desde
    ? [`pin-s+8E96A8(${lonLat(desde)}),pin-l+B8325F(${lonLat(hasta)})/auto`, 'padding=36&']
    : [`pin-l+B8325F(${lonLat(hasta)})/${lonLat(hasta)},15`, '']
  const url = `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${pines}/600x236@2x?${padding}access_token=${TOKEN}`
  return <img src={url} alt="Mapa hasta la siguiente parada" className="h-[118px] w-full rounded-[21px] object-cover" loading="lazy" onError={() => setFallo(true)} />
}

/** El título del día con la última palabra en frambuesa y cursiva (diseño: «Vaticano y *Trastevere*»). */
function TituloDelDia({ texto }: { texto: string }) {
  const palabras = texto.trim().split(/\s+/)
  const ultima = palabras.pop() ?? ''
  return (
    <span style={{ font: "400 34px/1.02 'Instrument Serif',serif" }}>
      {palabras.length > 0 ? `${palabras.join(' ')} ` : ''}
      <em style={{ color: FRAMBUESA }}>{ultima}</em>
    </span>
  )
}

function CabeceraDelDia({ day, dateIso }: { day: DayPlan; dateIso: string }) {
  return (
    <div className="flex flex-none flex-col gap-1 px-1 pb-0.5 pt-1">
      <span style={{ ...ojoMono, color: 'oklch(0.5 0.17 5)' }}>Hoy · {shortDateEs(dateIso)}</span>
      <TituloDelDia texto={day.curatedTitle ?? day.title ?? day.city} />
    </div>
  )
}

/**
 * HOY durante el viaje (Tanda 6z3, diseño «Durante»). Gratis: el plan de hoy, el mismo que en DÍAS, con la hora solo en lo reservado (la pastilla verde «✓ 9:00»), más la cámara. De pago, además, lo de vivo: la tarjeta oscura con la siguiente
 * parada (mapa pequeño, nombre y cuánto se anda hasta ella, [Cómo llegar] y [✓ Visto] con su «Añadir foto»), el aviso de la entrada, el de lluvia y la lista con lo visto en verde. Ninguna hora calculada por la app a la vista.
 */
export function HoyDurante({ route, day, dateIso }: { route: Route; day: DayPlan; dateIso: string }) {
  const pago = pagoActivo()
  const reservations = useRouteStore((state) => state.reservations)
  const setStopVisto = useRouteStore((state) => state.setStopVisto)
  const setStopSaltada = useRouteStore((state) => state.setStopSaltada)
  const moveStopToDay = useRouteStore((state) => state.moveStopToDay)
  const info = useDestinationExcursions(route.destination)
  const horarioDe = useHorarioDeParadas(day.city, dateIso)
  // «No me da tiempo»: la parada recién saltada (para su aviso con [Deshacer]), si está preguntando por una reservada y si la hoja de días está abierta.
  const [saltadaAviso, setSaltadaAviso] = useState<Stop | null>(null)
  const [confirmarReservada, setConfirmarReservada] = useState(false)
  const [hojaOtroDia, setHojaOtroDia] = useState(false)
  const [ubicacion, setUbicacion] = useState<Coordinates | null>(null)
  const [ubicacionEstado, setUbicacionEstado] = useState<'libre' | 'pidiendo' | 'no'>('libre')
  const [ultimoVisto, setUltimoVisto] = useState<Stop | null>(null)
  const [ofrecerFoto, setOfrecerFoto] = useState<Stop | null>(null)

  // El día de excursión (el día 4 con el interruptor en Excursión): solo la excursión (Tanda 6g).
  if (day.interruptor?.mode === 'excursion') return <TodayExcursion route={route} day={day} />

  const paradas = numberedStopsOf(day)
  const numeros = stopNumbersOf(day)
  // Las saltadas («No me da tiempo») ni se ven ni cuentan: «1 de 4 visto» si de 5 hay una saltada.
  const vigentes = paradas.filter((stop) => !stop.saltada)
  const vistas = vigentes.filter((stop) => stop.checkedInAt).length
  const siguiente = vigentes.find((stop) => !stop.checkedInAt) ?? null
  const anterior = siguiente ? paradas[paradas.indexOf(siguiente) - 1] : undefined
  // (La reserva de una parada: la que la propia parada lleva ligada o, si no, la entrada de hoy que cubre ese sitio, la misma con la que sale «Tu entrada a… · 11:00» en la lista.)
  const reservaDe = (stop: Stop) => reservations.find((reserva) => reserva.id === stop.reservedId) ?? entradasDeHoy.find((reserva) => reserva.placeNames.includes(stop.name)) ?? null
  const entradasDeHoy = reservations.filter((reserva) => dayOfReservation(route, reserva)?.id === day.id && reserva.kind === 'entrada')

  const pedirUbicacion = () => {
    if (!('geolocation' in navigator)) return setUbicacionEstado('no')
    setUbicacionEstado('pidiendo')
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setUbicacion({ lat: posicion.coords.latitude, lng: posicion.coords.longitude })
        setUbicacionEstado('libre')
      },
      () => setUbicacionEstado('no'),
      { enableHighAccuracy: false, timeout: 8000 },
    )
  }

  const desdeAnterior = !ubicacion && anterior && hasRealCoordinates(anterior.coordinates) ? anterior.coordinates : null
  const origen = ubicacion ?? desdeAnterior
  const minutos = siguiente && origen && hasRealCoordinates(siguiente.coordinates) ? Math.max(1, Math.round(haversineMeters(origen, siguiente.coordinates) / METROS_POR_MINUTO)) : null
  const comoLlegar = siguiente && hasRealCoordinates(siguiente.coordinates)
    ? ubicacion || !desdeAnterior
      ? buildGoogleMapsUrlFromHere(`${siguiente.coordinates.lat},${siguiente.coordinates.lng}`)
      : buildGoogleMapsUrl(`${desdeAnterior.lat},${desdeAnterior.lng}`, `${siguiente.coordinates.lat},${siguiente.coordinates.lng}`, 'walking')
    : null

  // ── «No me da tiempo» (solo de pago): la parada queda saltada y se pasa a la siguiente; si tiene la entrada reservada, antes se pregunta ──
  const reservaSiguiente = siguiente ? reservaDe(siguiente) : null
  const reservada = Boolean(siguiente?.reservedId || reservaSiguiente)
  const horaReservada = reservaSiguiente?.time ?? siguiente?.reservationTime ?? null
  const saltar = (stop: Stop) => {
    setStopSaltada(day.id, stop.id, true)
    setSaltadaAviso(stop)
    setConfirmarReservada(false)
    setUltimoVisto(null)
    setOfrecerFoto(null)
  }
  const pulsarNoMeDaTiempo = () => {
    if (!siguiente) return
    if (reservada && horaReservada) setConfirmarReservada(true)
    else saltar(siguiente)
  }
  const deshacerSaltada = () => {
    if (!saltadaAviso) return
    setStopSaltada(day.id, saltadaAviso.id, false)
    setSaltadaAviso(null)
  }
  const pasarAOtroDia = (otroDiaId: string) => {
    if (!saltadaAviso) return
    moveStopToDay(saltadaAviso.id, day.id, otroDiaId)
    setSaltadaAviso(null)
    setHojaOtroDia(false)
  }
  const otrosDias = route.days.filter((candidato) => !candidato.isReturnLeg && candidato.id !== day.id).map((candidato) => ({ id: candidato.id, dayNumber: candidato.dayNumber, city: candidato.city }))
  const saltadaEsReservada = Boolean(saltadaAviso?.reservedId)

  const marcarVisto = () => {
    if (!siguiente) return
    setSaltadaAviso(null)
    setConfirmarReservada(false)
    setStopVisto(day.id, siguiente.id, true)
    setUltimoVisto(siguiente)
    setOfrecerFoto(siguiente)
  }
  const deshacer = () => {
    if (!ultimoVisto) return
    setStopVisto(day.id, ultimoVisto.id, false)
    setUltimoVisto(null)
    setOfrecerFoto(null)
  }

  // ── Gratis: el plan de hoy ──
  if (!pago) {
    return (
      <>
        <CabeceraDelDia day={day} dateIso={dateIso} />
        <CajaBlanca className="!gap-0 !px-3.5 !py-2">
          {paradas.map((stop, indice) => {
            const reserva = reservaDe(stop)
            return (
              <div key={stop.id} className="relative flex min-h-[60px] items-center gap-3">
                {indice < paradas.length - 1 && <span aria-hidden="true" className="absolute bottom-[-16px] left-3.5 top-11 border-l-[1.5px] border-dashed border-text/20" />}
                <span
                  className="relative flex h-[29px] w-[29px] flex-none items-center justify-center rounded-full"
                  style={{ background: reserva ? VERDE : '#FFFFFF', border: `1.5px solid ${reserva ? VERDE : 'rgba(28,34,48,.25)'}`, color: reserva ? '#fff' : TINTA, font: "400 16px/1 'Instrument Serif',serif" }}
                >
                  {numeros.get(stop.id)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span style={{ font: "400 17px/1.15 'Instrument Serif',serif", textWrap: 'balance' as never }}>{displayStopName(stop.name)}</span>
                  <LineaDeHorario horario={horarioDe(stop)} />
                </span>
                {reserva && (
                  <span className="flex h-[26px] flex-none items-center gap-1 rounded-full px-[9px]" style={{ background: 'oklch(0.96 0.035 150)', border: '1px solid oklch(0.55 0.11 150 / .3)', color: 'oklch(0.38 0.1 150)', font: "600 12px 'Geist Mono',monospace" }}>
                    <Icono nombre="hecho" size={11} grosor={2.8} />
                    {reserva.time}
                  </span>
                )}
              </div>
            )
          })}
        </CajaBlanca>
        <BotonFoto dayId={day.id} dayNumber={day.dayNumber} etiqueta="Añadir una foto de hoy" className="flex h-12 flex-none items-center justify-center gap-2 rounded-full border border-text/15 bg-white text-[14px] font-semibold text-text">
          <Icono nombre="camara" size={18} />
          Añadir una foto de hoy
        </BotonFoto>
      </>
    )
  }

  // ── De pago: lo de vivo ──
  return (
    <>
      <div className="flex flex-none flex-col gap-3 rounded-[28px] bg-[#1C2230] px-2 pb-3.5 pt-2 text-[#FFFDF8]" style={{ boxShadow: '0 18px 30px -18px rgba(28,34,48,.7)' }}>
        {siguiente && hasRealCoordinates(siguiente.coordinates) ? <MapaHastaLaParada desde={origen} hasta={siguiente.coordinates} /> : <div className="h-[118px] rounded-[21px] bg-[#2A3141]" aria-hidden="true" />}
        {siguiente ? (
          <>
            <div className="flex flex-col gap-1.5 px-2">
              <span style={{ ...ojoMono, color: 'oklch(0.78 0.11 15)' }}>Siguiente parada · {numeros.get(siguiente.id)}</span>
              <span style={{ font: "400 34px/1 'Instrument Serif',serif", textWrap: 'balance' as never }}>{displayStopName(siguiente.name)}</span>
              <LineaDeHorario horario={horarioDe(siguiente)} oscuro />
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 text-[13px] leading-[1.4] text-[#FFFDF8]/75">
                  {minutos !== null ? `${minutos} min andando${!ubicacion && anterior ? ` · desde ${displayStopName(anterior.name)}` : ''}` : ubicacionEstado === 'no' ? 'No hemos podido ver tu ubicación.' : 'Toca «Ubicación» para ver cuánto falta.'}
                </span>
                <button
                  type="button"
                  onClick={pedirUbicacion}
                  disabled={ubicacionEstado === 'pidiendo'}
                  className="flex h-8 flex-none items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold text-[#FFFDF8] disabled:opacity-60"
                  style={{ background: 'rgba(255,253,248,.12)' }}
                >
                  <Icono nombre="ubicacion" size={14} />
                  {ubicacionEstado === 'pidiendo' ? 'Buscando…' : ubicacion ? 'Actualizar' : 'Ubicación'}
                </button>
              </div>
            </div>
            {confirmarReservada && horaReservada ? (
              <AvisoEntradaReservada hora={horaReservada} onSaltarIgual={() => saltar(siguiente)} onCancelar={() => setConfirmarReservada(false)} />
            ) : (
            <div className="flex flex-col gap-2 px-1.5 pt-0.5">
            <div className="grid gap-2" style={{ gridTemplateColumns: '1.25fr 1fr' }}>
              {comoLlegar ? (
                <a href={comoLlegar} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-[7px] rounded-full bg-[#FFFDF8] text-[14px] font-semibold text-[#1C2230] no-underline">
                  <Icono nombre="explorar" size={16} grosor={1.8} />
                  Cómo llegar
                </a>
              ) : (
                <span className="flex h-12 items-center justify-center rounded-full bg-[#FFFDF8]/30 text-[14px] font-semibold text-[#1C2230]/60">Cómo llegar</span>
              )}
              <button type="button" onClick={marcarVisto} className="flex h-12 items-center justify-center gap-[7px] rounded-full border-[1.5px] border-[#FFFDF8]/40 text-[14px] font-semibold text-[#FFFDF8] hover:bg-[#FFFDF8]/10">
                <Icono nombre="hecho" size={15} grosor={2.4} />
                Visto
              </button>
            </div>
            <BotonNoMeDaTiempo onClick={pulsarNoMeDaTiempo} />
            </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-3 px-2">
            <span className="flex-1" style={{ font: "400 28px/1.05 'Instrument Serif',serif" }}>
              {paradas.some((stop) => stop.saltada) ? 'Es todo' : 'Todo visto'} <em style={{ color: 'oklch(0.78 0.11 150)' }}>por hoy</em>
            </span>
            {ultimoVisto && (
              <button type="button" onClick={deshacer} className="flex h-11 items-center gap-1.5 rounded-full border-[1.5px] border-[#FFFDF8]/40 px-3.5 text-[13px] font-semibold text-[#FFFDF8]">
                <Icono nombre="recuperar" size={15} grosor={1.8} />
                Deshacer
              </button>
            )}
          </div>
        )}
      </div>

      {saltadaAviso && <AvisoSaltada nombre={displayStopName(saltadaAviso.name)} onDeshacer={deshacerSaltada} onOtroDia={saltadaEsReservada || otrosDias.length === 0 ? null : () => setHojaOtroDia(true)} />}
      {hojaOtroDia && <HojaPasarAOtroDia dias={otrosDias} onElegir={pasarAOtroDia} onCerrar={() => setHojaOtroDia(false)} />}

      {ofrecerFoto && (
        <div className="flex flex-none items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5" style={{ border: '1px solid rgba(28,34,48,.08)' }}>
          <span className="min-w-0 flex-1 truncate text-[13px] text-text/70">Visto: {displayStopName(ofrecerFoto.name)}</span>
          <BotonFoto dayId={day.id} dayNumber={day.dayNumber} stopName={ofrecerFoto.name} etiqueta="Añadir foto" onSubida={() => setOfrecerFoto(null)} className="flex h-10 flex-none items-center gap-1.5 rounded-full bg-accent px-3.5 text-[13px] font-semibold text-white">
            <Icono nombre="camara" size={16} />
            Añadir foto
          </BotonFoto>
          <button type="button" onClick={() => setOfrecerFoto(null)} aria-label="Ahora no" className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-text/50">
            <Icono nombre="cerrar" size={16} />
          </button>
        </div>
      )}

      {entradasDeHoy.map((entrada) => (
        <div key={entrada.id} className="flex min-h-[60px] flex-none overflow-hidden rounded-[18px]" style={{ background: 'oklch(0.96 0.035 150)', border: '1px solid oklch(0.55 0.11 150 / .3)' }}>
          <span className="flex w-[50px] flex-none items-center pl-[11px] text-white" style={{ background: VERDE, clipPath: 'polygon(0 0,100% 0,calc(100% - 14px) 100%,0 100%)' }}>
            <Icono nombre="reservas" size={18} />
          </span>
          <span className="min-w-0 flex-1 self-center py-2 pl-1.5 pr-3.5 text-[13.5px] font-medium leading-[1.35]" style={{ color: 'oklch(0.3 0.08 150)' }}>
            Tu entrada a {info.nombresCortos[entrada.refId] ?? displayStopName(entrada.placeNames[0] ?? entrada.name)} · <span style={{ font: "600 13px 'Geist Mono',monospace" }}>{entrada.time} ✓</span>
          </span>
        </div>
      ))}

      <RainAlert day={day} dateIso={dateIso} when="hoy" />

      <div className="flex flex-none flex-col gap-2 pt-1.5">
        <span className="pl-1 text-text/55" style={{ ...ojoMono, letterSpacing: '.14em' }}>
          Hoy · {shortDateEs(dateIso)} · {vistas} de {vigentes.length} visto
        </span>
        <div className="rounded-[22px] bg-[#FFFDF8] px-3.5 py-1.5" style={{ border: '1px solid rgba(28,34,48,.07)' }}>
          {paradas.map((stop, indice) => {
            const saltada = Boolean(stop.saltada)
            const vista = Boolean(stop.checkedInAt) && !saltada
            const ahora = siguiente?.id === stop.id
            return (
              <div key={stop.id} data-saltada={saltada ? 'true' : undefined} className="flex min-h-[50px] items-center gap-3" style={{ borderBottom: indice < paradas.length - 1 ? '1px solid rgba(28,34,48,.07)' : 'none' }}>
                <span
                  className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full transition-colors"
                  style={{ background: vista ? VERDE : ahora ? FRAMBUESA : 'transparent', border: `1.5px solid ${vista ? VERDE : ahora ? FRAMBUESA : saltada ? 'rgba(28,34,48,.15)' : 'rgba(28,34,48,.25)'}`, color: vista || ahora ? '#fff' : saltada ? 'rgba(28,34,48,.4)' : TINTA, font: "400 15px/1 'Instrument Serif',serif" }}
                >
                  {vista ? '✓' : numeros.get(stop.id)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={saltada ? 'line-through' : undefined} style={{ font: ahora ? "400 18px/1.15 'Instrument Serif',serif" : "400 14px/1.3 'Geist'", color: saltada ? 'rgba(28,34,48,.4)' : vista ? 'oklch(0.42 0.09 150)' : TINTA, textWrap: 'balance' as never }}>
                    {displayStopName(stop.name)}
                  </span>
                  {saltada ? <span className="text-[11px] leading-[1.3] text-text/40">Saltada</span> : <LineaDeHorario horario={horarioDe(stop)} />}
                </span>
                {ahora && (
                  <span className="h-[22px] flex-none rounded-full px-2 text-[10.5px] font-semibold leading-[22px]" style={{ background: 'oklch(0.55 0.17 5 / .1)', color: 'oklch(0.5 0.17 5)' }}>
                    Ahora
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
