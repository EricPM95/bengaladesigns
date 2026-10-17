import { useState } from 'react'
import { logrosActivos } from '../../../../lib/logros'
import type { Coordinates, DayPlan, MealSlot, Route, Stop } from '../../../../lib/types'
import { useRouteStore } from '../../../../store/useRouteStore'
import { moverParadaAOtroDia } from '../../../../lib/cambiarParada'
import { useDestinationExcursions } from '../../../../lib/destinationExcursions'
import { dayOfReservation } from '../../../../lib/bookings'
import { addDaysToIso, formatWeekdayAbbrEs } from '../../../../lib/dateRange'
import { esDiaDeLlegada, nombreDelDia, viajeDelDia } from '../../../../lib/tituloDelDia'
import { numberedStopsOf } from '../../../../lib/stopKind'
import { displayStopName, formatDuration } from '../../../../lib/format'
import { hasRealCoordinates, haversineMeters } from '../../../../lib/distanceMock'
import { buildGoogleMapsUrl, buildGoogleMapsUrlFromHere, buildGoogleMapsUrlToPlaceTransit } from '../../../../lib/mapsLinks'
import { parseTimeToMinutes } from '../../../../lib/time'
import { pagoActivo } from '../../../../lib/pago'
import { useArrivalInfo } from '../../../../lib/arrivalReturn'
import { nombreDeZona } from '../../../../lib/fichaLlegada'
import { destinoDelPunto, tituloDeVuelta } from '../../../../lib/llegadaVueltaHoy'
import { avisosDeCierre } from '../../../../lib/avisosDeHoy'
import { esDiaCompleto, TEXTO_DIA_COMPLETO } from '../../../../lib/diaCompleto'
import { CERRADO_ESTE_DIA } from '../../../../lib/placeHoursOnDate'
import { tarjetaHoyVuelvesDelDia } from '../../../../lib/planLlegadaVuelta'
import { useHorarioDeParadas, type HorarioDeParada } from '../../../../lib/horarioDeParada'
import { textoResumenDeParada, useEscuchar } from '../../../../lib/useEscuchar'
import { useAudioDeHistoria } from '../../../../lib/escucharAudio'
import { accesoHistoria, textoHistoria, useFichaDeSitio } from '../../../../lib/historia'
import { useExploreAperturaStore } from '../../../../store/useExploreAperturaStore'
import type { EstadoPase } from '../../../../lib/paseEstado'
import { Icono } from '../../../ui/Icono'
import { EtiquetaBarrioDeSitio } from '../../../ui/EtiquetaBarrio'
import { BotonFoto } from '../../fotos/BotonFoto'
import { TusFotosDeHoy } from '../../fotos/TusFotosDeHoy'
import { RainAlert } from '../../today/RainAlert'
import { TodayExcursion } from '../../today/TodayExcursion'
import { BilleteDeVuelo } from '../../dayDetail/BilleteDeVuelo'
import { BotonAlojamientoHoy, useFichasDeHoy, type MitadDeHoy } from '../llegadaVuelta'
import { anadirMasVisita, useMasVisitas } from '../masVisitas'
import type { MasVisita } from '../../../../lib/masVisitas'
import { AZUL, FRAMBUESA, VERDE, TINTA } from '../piezas'
import { CabeceraHoy } from './HoyAntesV2'
import { ExtraDeParada } from './ExtraDeParada'
import { ParadaFotoDeParada } from './ParadaFoto'
import { useFotoDeParada } from './useFotoDeParada'
import { HojaMasParaTuDia, HojaQueHacemos, HojaSobreEsteLugar } from './HojasV2'
import { TarjetaDiaDePrueba, TarjetaP3 } from './TarjetasPase'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
const METROS_POR_MINUTO = 80
const lonLat = (p: Coordinates) => `${p.lng.toFixed(5)},${p.lat.toFixed(5)}`
const OJO = { font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' as const, color: 'rgba(28,34,48,.55)' }

/** Los avisos cerrados con la cruz: por viaje y día, en el móvil; no vuelven a salir ESE día. */
const claveCerrados = (rutaId: string, diaId: string) => `trazo:hoy:avisos-cerrados:${rutaId}:${diaId}`
function leerCerrados(rutaId: string, diaId: string): string[] {
  try {
    const lista = JSON.parse(window.localStorage.getItem(claveCerrados(rutaId, diaId)) ?? '[]')
    return Array.isArray(lista) ? lista.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}
function guardarCerrados(rutaId: string, diaId: string, ids: string[]) {
  try {
    window.localStorage.setItem(claveCerrados(rutaId, diaId), JSON.stringify(ids))
  } catch {
    /* sin almacenamiento: vale hasta cerrar la pantalla */
  }
}

function LineaDeHorario({ horario, cerradoEsteDia }: { horario: HorarioDeParada | null; cerradoEsteDia: boolean }) {
  if (cerradoEsteDia && !horario?.cerrado) horario = { abre: null, cierra: null, ultimaEntrada: null, cerrado: true, tramos: [], texto: CERRADO_ESTE_DIA }
  if (!horario) return null
  return (
    <span className="text-[12px] leading-[1.3]" style={{ color: horario.cerrado ? 'oklch(0.78 0.11 15)' : 'rgba(255,253,248,.7)' }}>
      {horario.texto}
    </span>
  )
}

/** La foto de arriba de la tarjeta: la foto del sitio con el mapa pequeño en la esquina (una imagen estática de Mapbox, no un mapa vivo). */
function FotoYMapa({ parada, desde, ciudad, dateIso }: { parada: Stop; desde: Coordinates | null; ciudad: string; dateIso: string }) {
  const foto = useFotoDeParada(parada, ciudad, dateIso)
  const [falloMapa, setFalloMapa] = useState(false)
  const [falloFoto, setFalloFoto] = useState(false)
  const [verCredito, setVerCredito] = useState(false)
  const real = hasRealCoordinates(parada.coordinates)
  let mapa: string | null = null
  if (TOKEN && real && !falloMapa) {
    // Más lejos (zoom 13): se ven nombres, plazas y el río. El aviso va aparte, pequeño, con su «i» (`attribution=false`: el texto sigue disponible al tocarla).
    const pines = desde ? `pin-s+8E96A8(${lonLat(desde)}),pin-l+B8325F(${lonLat(parada.coordinates)})` : `pin-l+B8325F(${lonLat(parada.coordinates)})`
    mapa = `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${pines}/${lonLat(parada.coordinates)},13/192x128@2x?attribution=false&access_token=${TOKEN}`
  }
  return (
    <div className="relative h-[150px] flex-none overflow-hidden rounded-[21px]" style={{ background: 'repeating-linear-gradient(135deg,#2A3141 0 12px,#252C3B 12px 24px)' }}>
      {foto && !falloFoto && <img src={foto} alt="" className="h-full w-full object-cover" onError={() => setFalloFoto(true)} />}
      {mapa && (
        <div className="absolute bottom-2.5 right-2.5 h-16 w-24 overflow-hidden rounded-[14px]" style={{ border: '2px solid rgba(255,253,248,.9)' }}>
          <img src={mapa} alt="Mapa hasta la siguiente parada" className="h-full w-full object-cover" loading="lazy" onError={() => setFalloMapa(true)} />
          <button type="button" onClick={() => setVerCredito((v) => !v)} aria-label="Datos del mapa" aria-expanded={verCredito} className="absolute bottom-0 right-0 flex h-11 w-11 items-end justify-end">
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-tl-md bg-white/85 text-[10px] font-bold italic leading-none text-[#1C2230]/70">i</span>
          </button>
          {verCredito && (
            <span className="absolute inset-x-0 bottom-0 bg-white/90 px-1 py-px text-[7px] leading-tight text-[#1C2230]/80">© Mapbox © OpenStreetMap</span>
          )}
        </div>
      )}
    </div>
  )
}

/** [Escuchar historia]: el botón largo con las ondas (solo en los sitios con historia; la historia es de pago salvo la que la ficha marca gratis). */
function EscucharHistoria({ destino, parada }: { destino: string; parada: Stop }) {
  const ficha = useFichaDeSitio(destino, parada.name)
  const audio = useAudioDeHistoria({ destino, nombre: parada.name })
  const texto = textoHistoria(ficha)
  const { hayVoz, estado, escuchar, pausar, seguir, parar } = useEscuchar(texto, `${parada.id}:historia`, audio)
  if (accesoHistoria(ficha) === 'ninguno' || !hayVoz || texto.trim().length === 0) return null
  const alPulsar = estado === 'parado' ? escuchar : estado === 'hablando' ? pausar : seguir
  const onda = ['8px', '14px', '10px', '16px', '7px', '12px', '15px', '9px', '13px', '6px']
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={alPulsar} data-escuchar={estado} className="flex h-[50px] min-w-0 flex-1 items-center justify-center gap-3 rounded-full pl-2 pr-3.5" style={{ background: 'rgba(255,253,248,.1)' }}>
        <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full" style={{ background: FRAMBUESA }}>
          <Icono nombre={estado === 'hablando' ? 'pausa' : 'seguir'} size={13} relleno grosor={1.6} />
        </span>
        <span className="whitespace-nowrap text-[13.5px] font-semibold">{estado === 'parado' ? 'Escuchar historia' : estado === 'hablando' ? 'Pausar' : 'Seguir escuchando'}</span>
        <span className="flex h-6 items-center gap-[3px]" style={{ opacity: estado === 'hablando' ? 1 : 0.6 }} aria-hidden="true">
          {[...onda, ...onda].map((h, i) => (
            <span key={i} style={{ width: 2.5, height: h, borderRadius: 2, background: 'linear-gradient(180deg,#F3D59A,#FFFDF8)', opacity: i >= 10 ? 0.7 : 1 }} />
          ))}
        </span>
      </button>
      {estado !== 'parado' && (
        <button type="button" onClick={parar} aria-label="Parar" className="flex h-[50px] w-[50px] flex-none items-center justify-center rounded-full" style={{ background: 'rgba(255,253,248,.1)' }}>
          <Icono nombre="cerrar" size={14} />
        </button>
      )}
    </div>
  )
}

type Fila = { tipo: 'parada'; stop: Stop } | { tipo: 'comida'; meal: MealSlot } | { tipo: 'noche' }

/** La lista del día: las paradas numeradas, la comida y la cena donde caen (donde el viajero las dejó, o por su hora) y la cabecera «Noche». */
function filasDelDia(day: DayPlan, paradas: Stop[]): Fila[] {
  const posiciones: { meal: MealSlot; despuesDe: number }[] = []
  for (const meal of day.meals) {
    if (meal.mealTime !== 'lunch' && meal.mealTime !== 'dinner') continue
    const movida = day.mealAfter?.[meal.mealTime]
    let despuesDe = movida != null && movida >= -1 && movida < paradas.length ? movida : -2
    if (despuesDe === -2) {
      const t = parseTimeToMinutes(meal.time)
      despuesDe = paradas.filter((s) => s.time && !Number.isNaN(t) && parseTimeToMinutes(s.time) < t).length - 1
    }
    posiciones.push({ meal, despuesDe })
  }
  const filas: Fila[] = []
  let nocheDicha = false
  const metaComidas = (despuesDe: number) => posiciones.filter((p) => p.despuesDe === despuesDe).forEach((p) => filas.push({ tipo: 'comida', meal: p.meal }))
  metaComidas(-1)
  paradas.forEach((stop, i) => {
    if (!nocheDicha && (stop.isNightExperience || stop.isNightView)) {
      filas.push({ tipo: 'noche' })
      nocheDicha = true
    }
    filas.push({ tipo: 'parada', stop })
    metaComidas(i)
  })
  return filas
}

const tituloDeComida = (meal: MealSlot): string => {
  const base = meal.mealTime === 'dinner' ? 'Cena' : 'Comida'
  const sitio = meal.chosenRestaurant?.name ?? meal.recommendedRestaurant?.name
  if (sitio) return `${base} · ${sitio}`
  return meal.noRestaurant ? 'Comida, cerca de tu alojamiento' : meal.mealTime === 'dinner' ? 'Hora de cenar' : 'Hora de comer'
}

const ETIQUETA_VUELTA: Record<string, string> = { avion: 'Vuelo de vuelta', tren: 'Tren de vuelta', bus: 'Autobús de vuelta', barco: 'Barco de vuelta' }

function TarjetaAzul({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-none flex-col gap-2.5 rounded-[22px] p-3.5" style={{ background: 'oklch(0.95 0.025 230)', border: '1px solid oklch(0.56 0.1 230 / .2)' }}>
      {children}
    </div>
  )
}

/** HOY durante el viaje, versión 2 (Tanda 8B, pantallas 2 a 12 de «HOY v2»). La lógica es la de HoyDurante; cambia lo que se ve. */
export function HoyDuranteV2({ route, day, dateIso, pase }: { route: Route; day: DayPlan; dateIso: string; pase: EstadoPase }) {
  const reservations = useRouteStore((s) => s.reservations)
  const setStopVisto = useRouteStore((s) => s.setStopVisto)
  const setStopSaltada = useRouteStore((s) => s.setStopSaltada)
  const setMode = useRouteStore((s) => s.setMode)
  const pedirExplorar = useExploreAperturaStore((s) => s.pedir)
  const info = useDestinationExcursions(route.destination)
  const infoLlegada = useArrivalInfo(route.destination, day.city, route.origin)
  const horarioDe = useHorarioDeParadas(day.city, dateIso)
  const fichas = useFichasDeHoy(route, day, dateIso)
  const masVisitas = useMasVisitas(route, day)
  const [hojaSaltar, setHojaSaltar] = useState(false)
  const [hojaMas, setHojaMas] = useState<MasVisita[] | null>(null)
  const [anadidas, setAnadidas] = useState<Set<string>>(new Set())
  const [hojaSobre, setHojaSobre] = useState<Stop | null>(null)
  const [ubicacion, setUbicacion] = useState<Coordinates | null>(null)
  const [ubicacionEstado, setUbicacionEstado] = useState<'libre' | 'pidiendo' | 'no'>('libre')
  const [ultimoVisto, setUltimoVisto] = useState<Stop | null>(null)
  const [ofrecerFoto, setOfrecerFoto] = useState<Stop | null>(null)

  const explorar = (categoria: 'banos' | 'fuentes' | 'restaurantes' | 'atracciones', origen: Coordinates | null, cerca = false) => {
    pedirExplorar({ categoria, origen, cerca })
    setMode('explore')
  }

  const tituloDeHoy = nombreDelDia(route, day, info.gruposDia)
  const paradas = numberedStopsOf(day)
  const vigentes = paradas.filter((s) => !s.saltada)
  const vistas = vigentes.filter((s) => s.checkedInAt).length
  const siguiente = vigentes.find((s) => !s.checkedInAt) ?? null
  const anterior = siguiente ? paradas[paradas.indexOf(siguiente) - 1] : undefined
  const entradasDeHoy = reservations.filter((r) => dayOfReservation(route, r)?.id === day.id && r.kind === 'entrada')
  const reservaDe = (stop: Stop) => reservations.find((r) => r.id === stop.reservedId) ?? entradasDeHoy.find((r) => r.placeNames.includes(stop.name)) ?? null
  const esLlegada = esDiaDeLlegada(route, day)
  const esVuelta = Boolean(day.isReturnLeg)
  const sinParadasDeVuelta = esVuelta && paradas.length === 0
  const tarjetaVuelve = tarjetaHoyVuelvesDelDia(route, day)
  const diaCompleto = esDiaCompleto(route, day, reservations)
  const [cerrados, setCerrados] = useState<string[]>(() => leerCerrados(route.id, day.id))
  const cierres = avisosDeCierre(vigentes.filter((s) => !s.closedThisDay), horarioDe, (s) => displayStopName(s.name)).filter((a) => !cerrados.includes(a.id))
  const cerrarAviso = (id: string) => setCerrados((antes) => { const ahora = [...antes, id]; guardarCerrados(route.id, day.id, ahora); return ahora })

  const pedirUbicacion = () => {
    if (!('geolocation' in navigator)) return setUbicacionEstado('no')
    setUbicacionEstado('pidiendo')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setUbicacion({ lat: p.coords.latitude, lng: p.coords.longitude })
        setUbicacionEstado('libre')
      },
      () => setUbicacionEstado('no'),
      { enableHighAccuracy: false, timeout: 8000 },
    )
  }
  const desdeAnterior = !ubicacion && anterior && hasRealCoordinates(anterior.coordinates) ? anterior.coordinates : null
  const origen = ubicacion ?? desdeAnterior
  const minutos = siguiente && ubicacion && hasRealCoordinates(siguiente.coordinates) ? Math.max(1, Math.round(haversineMeters(ubicacion, siguiente.coordinates) / METROS_POR_MINUTO)) : null
  const comoLlegar =
    siguiente && hasRealCoordinates(siguiente.coordinates)
      ? ubicacion || !desdeAnterior
        ? buildGoogleMapsUrlFromHere(`${siguiente.coordinates.lat},${siguiente.coordinates.lng}`)
        : buildGoogleMapsUrl(`${desdeAnterior.lat},${desdeAnterior.lng}`, `${siguiente.coordinates.lat},${siguiente.coordinates.lng}`, 'walking')
      : null
  const origenCerca = ubicacion ?? (siguiente && hasRealCoordinates(siguiente.coordinates) ? siguiente.coordinates : null)

  const reservaSiguiente = siguiente ? reservaDe(siguiente) : null
  const horaReservada = reservaSiguiente?.time ?? siguiente?.reservationTime ?? null
  const saltar = (stop: Stop) => {
    setStopSaltada(day.id, stop.id, true)
    setHojaSaltar(false)
    setUltimoVisto(null)
    setOfrecerFoto(null)
  }
  const marcarVisto = () => {
    if (!siguiente) return
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
  const otrosDias = route.days.filter((c) => !c.isReturnLeg && c.id !== day.id).map((c) => ({ id: c.id, dayNumber: c.dayNumber, city: c.city }))

  // ── La cabecera: «jue 23» y el título del día (si es día de viaje, su trayecto al lado) ──
  const ojo = `${formatWeekdayAbbrEs(dateIso)} ${Number(dateIso.slice(8, 10))}`
  const tituloLimpio = tituloDeHoy.titulo.includes('→') ? (day.curatedTitle ?? day.city) : tituloDeHoy.titulo
  const cabecera = info.cargado || esVuelta ? <CabeceraHoy ojo={ojo} titulo={tituloLimpio} sub={tituloDeHoy.viaje ?? viajeDelDia(route, day)} /> : <CabeceraHoy ojo={ojo} titulo=" " />

  // ── El pase: con cobro y sin pase, el día de llegada es la tarjeta P3 y, si la prueba ya se gastó, solo la tarjeta de la 12 ──
  const sinPase = pase.cobro && !pase.conPase
  const diasRestantes = route.days
    .filter((c) => !c.isReturnLeg && c.dayNumber > day.dayNumber)
    .map((c) => {
      const iso = addDaysToIso(dateIso, c.dayNumber - day.dayNumber)
      return { w: formatWeekdayAbbrEs(iso).toUpperCase(), n: Number(iso.slice(8, 10)) }
    })
  if (day.interruptor?.mode === 'excursion' && !(sinPase && (esLlegada || !pase.puede))) {
    return (
      <>
        {cabecera}
        <TodayExcursion route={route} day={day} />
        <BotonAlojamientoHoy route={route} />
      </>
    )
  }
  if (sinPase && esLlegada) {
    return (
      <>
        {cabecera}
        <TarjetaP3 etiqueta={`Hoy · ${ojo}`} />
      </>
    )
  }
  if (sinPase && !pase.puede) {
    return (
      <>
        {cabecera}
        <TarjetaDiaDePrueba dias={diasRestantes} />
      </>
    )
  }

  const filas = filasDelDia(day, paradas)
  const arrivalDay = day.arrivalDay
  const comidaAlLlegar = esLlegada && (Boolean(day.meals.some((m) => m.noRestaurant)) || Boolean(arrivalDay?.comida_al_llegar))
  const llegadaTarde = esLlegada && Boolean(arrivalDay?.sin_paradas) && Boolean(arrivalDay?.de_noche)
  const zona = route.accommodationZone ? info.zonasAlojamiento.find((z) => z.id === route.accommodationZone) : undefined
  const llegadaMitad: MitadDeHoy = fichas.llegada
  const hayBilleteLlegada = pagoActivo() && esLlegada && llegadaMitad.billete && llegadaMitad.point
  const todoVisto = !siguiente
  const mostrarPrueba = sinPase && pase.puede && todoVisto && vigentes.length > 0

  const alertas = (
    <>
      {cierres.map((a) => (
        <div key={a.id} className="flex min-h-14 flex-none items-center gap-3 rounded-[18px] py-[9px] pl-3 pr-2.5" style={{ background: 'oklch(0.55 0.17 5 / .07)', border: '1px solid oklch(0.55 0.17 5 / .25)' }} data-avisos-de-cierre>
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] text-white" style={{ background: FRAMBUESA }}>
            <Icono nombre="reloj" size={16} />
          </span>
          <span className="min-w-0 flex-1 text-[13px] font-medium leading-[1.35]">{a.texto}</span>
          <button type="button" onClick={() => cerrarAviso(a.id)} aria-label="Cerrar este aviso" className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-[#1C2230]/55">
            <Icono nombre="cerrar" size={14} grosor={2} />
          </button>
        </div>
      ))}
      {entradasDeHoy.map((entrada) => (
        <div key={entrada.id} className="flex min-h-14 flex-none items-center gap-3 rounded-[18px] py-[9px] pl-3 pr-2.5" style={{ background: 'oklch(0.96 0.035 150)', border: '1px solid oklch(0.55 0.11 150 / .3)' }}>
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] text-white" style={{ background: VERDE }}>
            <Icono nombre="reservas" size={16} />
          </span>
          <span className="min-w-0 flex-1 text-[13px] font-medium leading-[1.35]" style={{ color: 'oklch(0.3 0.08 150)' }}>
            Tu entrada a {info.nombresCortos[entrada.refId] ?? displayStopName(entrada.placeNames[0] ?? entrada.name)} · {entrada.time} ✓
          </span>
        </div>
      ))}
      <RainAlert day={day} dateIso={dateIso} when="hoy" />
    </>
  )

  return (
    <>
      {cabecera}
      {diaCompleto && <p className="flex-none px-1 text-[12.5px] leading-[1.35] text-text/60">{TEXTO_DIA_COMPLETO}</p>}

      {/* 5: el día de vuelta sin paradas, «Hoy vuelves a casa» */}
      {sinParadasDeVuelta && tarjetaVuelve && <HoyVuelvesV2 tarjeta={tarjetaVuelve} mitad={fichas.vuelta} onVerComoIr={() => fichas.abrir('vuelta')} onExplorar={() => explorar('atracciones', null, tarjetaVuelve.explorar.cerca_de_mi)} />}

      {/* 4: la maleta del último día */}
      {esVuelta && !sinParadasDeVuelta && pagoActivo() && infoLlegada.maleta?.texto && (
        <div className="flex flex-none items-start gap-3 rounded-[18px] px-3.5 py-3" style={{ background: 'oklch(0.95 0.025 230)', border: '1px solid oklch(0.56 0.1 230 / .2)' }}>
          <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[11px] text-white" style={{ background: AZUL }}>
            <Icono nombre="maleta" size={17} />
          </span>
          <span className="flex-1 text-[13px] leading-[1.5]" style={{ color: 'oklch(0.3 0.06 240)', textWrap: 'pretty' as never }}>
            <strong className="font-semibold">La maleta.</strong> {infoLlegada.maleta.texto}
          </span>
        </div>
      )}

      {/* 3, 3b, 3c: el día de llegada */}
      {hayBilleteLlegada && (
        <div data-hoy-llegada="1" className="flex flex-none flex-col gap-2.5">
          <div className="flex flex-col rounded-[18px] bg-white" style={{ border: '1px solid oklch(0.55 0.12 240 / .28)', boxShadow: '0 12px 24px -16px oklch(0.45 0.1 240 / .6)' }}>
            <BilleteDeVuelo billete={llegadaMitad.billete!} onOpen={() => fichas.abrir('llegada')} />
            {!comidaAlLlegar && !llegadaTarde && (
              <button type="button" onClick={() => explorar('restaurantes', null, true)} className="mx-3.5 mb-1 mt-0 flex min-h-11 items-center gap-1.5 border-t border-dashed border-text/15 text-left text-[12.5px] font-semibold text-[#1C2230] underline underline-offset-[3px]">
                Restaurantes cerca de tu alojamiento
                <Icono nombre="adelante" size={13} grosor={2.4} />
              </button>
            )}
          </div>
          <BotonAlojamientoHoy route={route} />
        </div>
      )}
      {llegadaTarde && (
        <div className="flex flex-none flex-col gap-3 rounded-[22px] bg-[#1C2230] p-[18px] text-[#FFFDF8]" data-hoy-llegada-tarde>
          <Icono nombre="noche" size={26} style={{ color: '#F3D59A' }} />
          <span style={{ font: "400 22px/1.2 'Instrument Serif',serif", textWrap: 'pretty' as never }}>Llegas tarde: hoy no te hemos puesto paradas, descansa. Si tienes hambre, aquí tienes los restaurantes de Roma.</span>
          <button type="button" onClick={() => explorar('restaurantes', null, true)} className="h-11 self-start rounded-full px-4 text-[13.5px] font-bold text-[#17120a]" style={{ background: 'oklch(0.8 0.14 70)' }}>
            Explorar restaurantes
          </button>
        </div>
      )}
      {comidaAlLlegar && !llegadaTarde && (
        <>
          <div className="flex flex-none flex-col gap-2.5 rounded-[20px] bg-[#FFFDF8] p-3.5" style={{ border: '1px solid rgba(28,34,48,.07)' }}>
            <span className="flex items-start gap-3">
              <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[11px] bg-[#F1EADC]">
                <Icono nombre="comida" size={17} />
              </span>
              <span className="flex-1 text-[13.5px] leading-[1.5] text-[#1C2230]/80" style={{ textWrap: 'pretty' as never }}>
                {zona ? (
                  <>
                    Tu alojamiento está en la zona de <strong className="font-semibold text-[#1C2230]">{nombreDeZona(zona.nombre)}</strong>. Te recomendamos comer algo antes de ponerte en marcha: aquí tienes los mejores restaurantes de Roma.
                  </>
                ) : (
                  'Te recomendamos comer algo antes de ponerte en marcha: aquí tienes los mejores restaurantes de Roma.'
                )}
              </span>
            </span>
            <button type="button" onClick={() => explorar('restaurantes', null, true)} className="ml-[46px] h-11 self-start rounded-full border border-[rgba(28,34,48,.18)] bg-white px-4 text-[13.5px] font-semibold">
              Explorar restaurantes
            </button>
          </div>
        </>
      )}

      {alertas}

      {/* 2: la siguiente parada, en grande */}
      {!sinParadasDeVuelta && siguiente && (
        <div className="flex flex-none flex-col gap-3 rounded-[28px] bg-[#1C2230] px-2 pb-3 pt-2 text-[#FFFDF8]" style={{ boxShadow: '0 18px 30px -18px rgba(28,34,48,.7)' }} data-hoy-siguiente>
          <FotoYMapa parada={siguiente} desde={origen} ciudad={day.city} dateIso={dateIso} />
          <div className="flex flex-col gap-2 px-2">
            <span style={{ font: "400 32px/1 'Instrument Serif',serif", textWrap: 'balance' as never }}>{displayStopName(siguiente.name)}</span>
            <LineaDeHorario horario={horarioDe(siguiente)} cerradoEsteDia={Boolean(siguiente.closedThisDay)} />
            <EtiquetaBarrioDeSitio destination={route.destination} name={siguiente.name} oscuro className="self-start" />
            <span className="flex flex-wrap items-center gap-1.5">
              {siguiente.durationMinutes > 0 && (
                <span className="flex h-[30px] items-center gap-1.5 rounded-full pl-2 pr-2.5 text-[12px] font-medium" style={{ background: 'rgba(255,253,248,.1)' }}>
                  <Icono nombre="arena" size={13} grosor={2} />
                  {formatDuration(siguiente.durationMinutes)}
              </span>
              )}
              <button type="button" onClick={pedirUbicacion} disabled={ubicacionEstado === 'pidiendo'} className="flex h-[30px] items-center gap-1.5 rounded-full border border-[#FFFDF8]/25 pl-2 pr-2.5 text-[12px] font-medium disabled:opacity-60">
                <Icono nombre="ubicacion" size={13} grosor={1.9} />
                {ubicacionEstado === 'pidiendo' ? 'Buscando…' : minutos !== null ? `${minutos} min andando` : ubicacionEstado === 'no' ? 'Sin ubicación' : 'Ubicación'}
              </button>
            </span>
          </div>
          <div className="flex flex-col gap-2 px-1">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={marcarVisto} className="flex h-[46px] items-center justify-center gap-1.5 rounded-full text-[13.5px] font-semibold text-white" style={{ background: VERDE }}>
                <Icono nombre="hecho" size={14} grosor={2.6} />
                Visto
              </button>
              <button type="button" onClick={() => setHojaSaltar(true)} className="h-[46px] whitespace-nowrap rounded-full border-[1.5px] border-[#FFFDF8]/30 px-2.5 text-[13px] font-semibold">
                No me da tiempo
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {comoLlegar ? (
                <a href={comoLlegar} target="_blank" rel="noopener noreferrer" className="flex h-[46px] items-center justify-center gap-2 rounded-full bg-[#FFFDF8] text-[14px] font-semibold text-[#1C2230] no-underline">
                  <Icono nombre="explorar" size={16} grosor={1.8} />
                  Cómo llegar
                </a>
              ) : (
                <span className="flex h-[46px] items-center justify-center rounded-full bg-[#FFFDF8]/30 text-[14px] font-semibold text-[#1C2230]/60">Cómo llegar</span>
              )}
              <button type="button" onClick={() => setHojaSobre(siguiente)} className="flex h-[46px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] border-[#FFFDF8]/30 px-2.5 text-[12.5px] font-semibold">
                <Icono nombre="portapapeles" size={14} grosor={1.8} />
                Sobre este lugar
              </button>
            </div>
            <EscucharHistoria destino={route.destination} parada={siguiente} />
            <ExtraDeParada parada={siguiente} dayId={day.id} vista={false} contexto="tarjeta" />
            {masVisitas.length > 0 && (
              <div className="flex justify-center">
                <button type="button" onClick={() => setHojaMas(masVisitas)} data-mas-visitas className="flex h-11 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold" style={{ border: '1.5px dashed oklch(0.78 0.11 15 / .7)' }}>
                  <Icono nombre="anadir" size={13} grosor={2.4} />
                  Más visitas
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {!sinParadasDeVuelta && !siguiente && paradas.length > 0 && !mostrarPrueba && (
        <div className="flex flex-none flex-col gap-2.5 rounded-[24px] bg-[#1C2230] p-[18px] text-[#FFFDF8]" data-hoy-todo-visto>
          <span className="flex items-center gap-3">
            <span className="flex-1" style={{ font: "400 30px/1 'Instrument Serif',serif" }}>
              {paradas.some((s) => s.saltada) ? 'Es todo' : 'Todo visto'} <em style={{ color: 'oklch(0.78 0.11 150)' }}>por hoy</em>
            </span>
            {ultimoVisto && (
              <button type="button" onClick={deshacer} className="flex h-11 items-center gap-1.5 rounded-full border-[1.5px] border-[#FFFDF8]/40 px-3.5 text-[13px] font-semibold">
                <Icono nombre="recuperar" size={15} grosor={1.8} />
                Deshacer
              </button>
            )}
          </span>
          {masVisitas.length > 0 && (
            <button type="button" onClick={() => setHojaMas(masVisitas)} data-mas-visitas className="flex h-11 items-center justify-center gap-1.5 rounded-full border-[1.5px] border-[#FFFDF8]/25 text-[14px] font-semibold">
              <Icono nombre="anadir" size={15} grosor={1.8} />
              Más visitas
            </button>
          )}
        </div>
      )}

      {ofrecerFoto && !logrosActivos() && (
        <div className="flex flex-none items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5" style={{ border: '1px solid rgba(28,34,48,.08)' }}>
          <span className="min-w-0 flex-1 truncate text-[13px] text-text/70">Visto: {displayStopName(ofrecerFoto.name)}</span>
          <BotonFoto dayId={day.id} dayNumber={day.dayNumber} stopName={ofrecerFoto.name} etiqueta="Añadir foto" onSubida={() => setOfrecerFoto(null)} className="flex h-11 flex-none items-center gap-1.5 rounded-full bg-accent px-3.5 text-[13px] font-semibold text-white">
            <Icono nombre="camara" size={16} />
            Añadir foto
          </BotonFoto>
          <button type="button" onClick={() => setOfrecerFoto(null)} aria-label="Ahora no" className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-text/50">
            <Icono nombre="cerrar" size={16} />
          </button>
        </div>
      )}

      {mostrarPrueba && <TarjetaDiaDePrueba dias={diasRestantes} />}

      {/* La lista del día, con «Parada con foto» */}
      {!sinParadasDeVuelta && paradas.length > 0 && (
        <div className="flex flex-none flex-col gap-2 pt-1.5">
          <span className="flex justify-between px-1" style={OJO}>
            <span>{esVuelta ? 'Esta mañana' : `Hoy · ${formatWeekdayAbbrEs(dateIso)} ${Number(dateIso.slice(8, 10))}`}</span>
            <span>
              {vistas} de {vigentes.length} visto
            </span>
          </span>
          <div className="rounded-[22px] bg-[#FFFDF8] py-1 pl-3.5 pr-1.5" style={{ border: '1px solid rgba(28,34,48,.07)' }} data-hoy-lista>
            {filas.map((fila, i) => {
              const borde = i < filas.length - 1 ? '1px solid rgba(28,34,48,.07)' : 'none'
              if (fila.tipo === 'noche')
                return (
                  <span key="noche" className="flex items-center gap-2 pb-1 pt-3" style={{ ...OJO, color: 'oklch(0.4 0.1 285)' }}>
                    <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full" style={{ background: 'oklch(0.92 0.04 285)' }}>
                      <Icono nombre="noche" size={12} grosor={2} />
                    </span>
                    Noche
                  </span>
                )
              if (fila.tipo === 'comida')
                return (
                  <div key={`m-${fila.meal.id}`} className="flex min-h-[52px] items-center gap-[11px]" style={{ borderBottom: borde }}>
                    <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full" style={{ border: '1.5px solid rgba(28,34,48,.25)' }}>
                      <Icono nombre="comida" size={13} grosor={1.9} />
                    </span>
                    <span className="min-w-0 flex-1 py-1.5 text-[14px] leading-[1.3]">{tituloDeComida(fila.meal)}</span>
                  </div>
                )
              const stop = fila.stop
              const saltada = Boolean(stop.saltada)
              const vista = Boolean(stop.checkedInAt) && !saltada
              const ahora = siguiente?.id === stop.id
              const reserva = reservaDe(stop)
              return (
                <div key={stop.id} data-saltada={saltada ? 'true' : undefined} className="flex min-h-[52px] items-center gap-[11px]" style={{ borderBottom: borde }}>
                  <ParadaFotoDeParada parada={stop} ciudad={day.city} dateIso={dateIso} vista={vista} size={40} />
                  <span className="flex min-w-0 flex-1 flex-col gap-[3px] py-1.5">
                    <span className={saltada ? 'line-through' : undefined} style={{ font: ahora ? "400 18px/1.15 'Instrument Serif',serif" : "400 14px/1.3 'Geist'", color: saltada ? 'rgba(28,34,48,.42)' : vista ? 'oklch(0.42 0.09 150)' : TINTA, textWrap: 'balance' as never }}>
                      {displayStopName(stop.name)}
                    </span>
                    {!saltada && <EtiquetaBarrioDeSitio destination={route.destination} name={stop.name} className="self-start" />}
                    <span className="flex flex-wrap gap-1">
                      {stop.addedByUser && <span className="h-5 rounded-full px-[7px] text-[10px] font-semibold leading-[18px]" style={{ border: '1px dashed oklch(0.55 0.17 5 / .5)', color: 'oklch(0.5 0.17 5)' }}>Añadida</span>}
                    </span>
                    <ExtraDeParada parada={stop} dayId={day.id} vista={vista} contexto="fila" />
                  </span>
                  {reserva?.time && (
                    <span className="flex h-6 flex-none items-center rounded-full px-2" style={{ background: 'oklch(0.96 0.035 150)', border: '1px solid oklch(0.55 0.11 150 / .3)', color: 'oklch(0.38 0.1 150)', font: "600 11.5px 'Geist Mono',monospace" }}>
                      ✓ {reserva.time}
                    </span>
                  )}
                  {ahora && <span className="h-[22px] flex-none rounded-full px-2 text-[10.5px] font-semibold leading-[22px]" style={{ background: 'oklch(0.55 0.17 5 / .1)', color: 'oklch(0.5 0.17 5)' }}>Ahora</span>}
                  {saltada && (
                    <button type="button" onClick={() => setStopSaltada(day.id, stop.id, false)} className="flex h-11 flex-none items-center gap-1 rounded-full px-1.5 text-[10.5px] font-semibold text-text/75">
                      <span className="flex h-[26px] items-center gap-1 rounded-full border border-[rgba(28,34,48,.16)] bg-white pl-1.5 pr-2">
                        <Icono nombre="recuperar" size={11} grosor={2} />
                        Recuperar
                      </span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 4: la tarde del día de vuelta */}
      {esVuelta && !sinParadasDeVuelta && (
        <>
          <div className="flex flex-none items-center gap-3 rounded-[20px] py-3.5 pl-[18px] pr-3.5" style={{ border: '1px dashed rgba(28,34,48,.25)' }}>
            <span className="flex-1" style={{ font: "400 20px/1.1 'Instrument Serif',serif", textWrap: 'balance' as never }}>La tarde es tuya hasta que te vayas</span>
            <button type="button" onClick={() => explorar('atracciones', null, true)} className="flex h-11 flex-none items-center gap-1.5 rounded-full bg-[#1C2230] pl-[11px] pr-3.5 text-[13px] font-semibold text-[#FFFDF8]">
              <Icono nombre="anadir" size={13} grosor={2.4} />
              Añadir lugares
            </button>
          </div>
          <TarjetaVueltaV2 route={route} mitad={fichas.vuelta} onVerComoIr={() => fichas.abrir('vuelta')} />
        </>
      )}

      {/* Cerca de ti */}
      {!sinParadasDeVuelta && !esVuelta && paradas.length > 0 && (
        <div className="flex flex-none flex-col gap-2 pt-1.5">
          <span className="px-1" style={OJO}>Cerca de ti</span>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { c: 'banos', n: 'Baños', i: 'banos' },
                { c: 'fuentes', n: 'Fuentes', i: 'fuente' },
                { c: 'restaurantes', n: 'Comer', i: 'comida' },
              ] as const
            ).map((b) => (
              <button key={b.c} type="button" onClick={() => explorar(b.c, origenCerca)} className="flex h-[76px] flex-col items-center justify-center gap-[7px] rounded-[18px] bg-white" style={{ border: '1px solid rgba(28,34,48,.08)' }}>
                <Icono nombre={b.i} size={21} />
                <span className="text-[12.5px] font-semibold">{b.n}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {tarjetaVuelve && !esVuelta && <HoyVuelvesV2 tarjeta={tarjetaVuelve} mitad={fichas.vuelta} onVerComoIr={() => fichas.abrir('vuelta')} onExplorar={() => explorar('atracciones', null, tarjetaVuelve.explorar.cerca_de_mi)} />}
      {!esVuelta && <BotonAlojamientoHoy route={route} />}
      <TusFotosDeHoy day={day} />

      {fichas.hoja}
      {hojaSaltar && siguiente && (
        <HojaQueHacemos
          nombre={displayStopName(siguiente.name)}
          horaReservada={siguiente.reservedId || reservaSiguiente ? horaReservada : null}
          dias={otrosDias}
          ahora={day.dayNumber}
          onSaltar={() => saltar(siguiente)}
          onMover={(otro) => {
            moverParadaAOtroDia(siguiente.id, day.id, otro)
            setHojaSaltar(false)
          }}
          onCerrar={() => setHojaSaltar(false)}
        />
      )}
      {hojaMas && (
        <HojaMasParaTuDia
          visitas={hojaMas}
          anadidas={anadidas}
          onAnadir={(v) => {
            anadirMasVisita(route, day, v)
            setAnadidas((a) => new Set(a).add(v.stop.id))
          }}
          onCerrar={() => {
            setHojaMas(null)
            setAnadidas(new Set())
          }}
        />
      )}
      {hojaSobre && <HojaSobreEsteLugar route={route} parada={hojaSobre} onCerrar={() => setHojaSobre(null)} />}
    </>
  )
}

/** Pantalla 4: «Llegada al aeropuerto de Fiumicino» con [Cómo llegar] y el billete de vuelta. */
function TarjetaVueltaV2({ route, mitad, onVerComoIr }: { route: Route; mitad: MitadDeHoy; onVerComoIr: () => void }) {
  if (!pagoActivo() || !mitad.point || !mitad.hora) return null
  const titulo = tituloDeVuelta(mitad.mode, mitad.point)
  if (!titulo) return null
  const enlace = buildGoogleMapsUrlToPlaceTransit(destinoDelPunto(mitad.mode, mitad.point, route.destination))
  return (
    <TarjetaAzul>
      <span data-hoy-vuelta="1" className="flex items-center gap-2.5">
        <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[11px] text-white" style={{ background: AZUL }}>
          <Icono nombre="avion" size={17} />
        </span>
        <span className="flex-1" style={{ font: "400 19px/1.1 'Instrument Serif',serif", color: 'oklch(0.3 0.06 240)' }}>
          {titulo}
        </span>
      </span>
      <a href={enlace} target="_blank" rel="noopener noreferrer" data-hoy-vuelta-como-llegar className="flex h-11 items-center gap-[7px] self-start rounded-full pl-3 pr-4 text-[13px] font-semibold text-white no-underline" style={{ background: 'oklch(0.5 0.12 245)' }}>
        <Icono nombre="explorar" size={14} grosor={1.8} />
        Cómo llegar
      </a>
      {mitad.billete && <BilleteDeVuelo billete={mitad.billete} onOpen={onVerComoIr} />}
    </TarjetaAzul>
  )
}

/** Pantalla 5: «Hoy vuelves a casa», con la cabecera azul y los textos que da el motor. */
function HoyVuelvesV2({ tarjeta, mitad, onVerComoIr, onExplorar }: { tarjeta: NonNullable<ReturnType<typeof tarjetaHoyVuelvesDelDia>>; mitad: MitadDeHoy; onVerComoIr: () => void; onExplorar: () => void }) {
  const etiqueta = `${ETIQUETA_VUELTA[mitad.mode] ?? 'Vuelta'}${mitad.hora ? ` · ${mitad.hora}` : ''}`
  return (
    <div data-tarjeta-hoy-vuelves={tarjeta.madrugada ? 'madrugada' : 'dia'} className="relative flex-none overflow-hidden rounded-[28px] bg-[#FFFDF8]" style={{ border: '1px solid rgba(28,34,48,.07)', boxShadow: '0 18px 34px -24px rgba(28,34,48,.5)' }}>
      <div className="relative flex h-[120px] flex-col justify-end gap-1 px-5 py-[18px] text-white" style={{ background: 'linear-gradient(160deg,oklch(0.6 0.11 235),oklch(0.42 0.1 250))' }}>
        <Icono nombre="avion" size={26} grosor={1.6} className="absolute right-5 top-[18px] opacity-85" />
        <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', opacity: 0.75 }}>{etiqueta}</span>
        <span data-hoy-vuelves-titulo style={{ font: "400 32px/1 'Instrument Serif',serif" }}>{tarjeta.titulo}</span>
      </div>
      <div className="flex flex-col gap-3 px-[18px] pb-[18px] pt-4">
        <p data-hoy-vuelves-texto className="m-0 text-[14px] leading-[1.55] text-[#1C2230]/80" style={{ textWrap: 'pretty' as never }}>
          {tarjeta.texto}
        </p>
        {tarjeta.desde_tu_zona && (
          <div data-hoy-vuelves-zona className="flex items-start gap-2.5 rounded-2xl p-3" style={{ background: 'oklch(0.95 0.025 230)' }}>
            <Icono nombre="tren" size={17} className="mt-px flex-none" style={{ color: 'oklch(0.4 0.09 240)' }} />
            <span className="text-[13px] leading-[1.5]" style={{ color: 'oklch(0.3 0.06 240)', textWrap: 'pretty' as never }}>
              {tarjeta.desde_tu_zona.texto}
              {tarjeta.desde_tu_zona.aviso ? ` ${tarjeta.desde_tu_zona.aviso}` : ''}
            </span>
          </div>
        )}
        <button type="button" onClick={onVerComoIr} data-hoy-vuelves="ver-como-ir" className="flex h-12 items-center justify-center gap-2 rounded-full text-[14px] font-semibold text-white" style={{ background: 'oklch(0.5 0.12 245)' }}>
          {tarjeta.ver_como_ir.texto}
          <Icono nombre="flecha" size={15} grosor={2} />
        </button>
        <div className="h-px bg-[rgba(28,34,48,.08)]" />
        <span data-hoy-vuelves-explorar className="text-[13.5px] leading-[1.5] text-[#1C2230]/75">
          {tarjeta.explorar.texto}
        </span>
        <button type="button" onClick={onExplorar} data-hoy-vuelves="explorar-monumentos" className="flex h-11 items-center gap-[7px] self-start rounded-full border border-[rgba(28,34,48,.18)] bg-white pl-3 pr-4 text-[13.5px] font-semibold">
          <Icono nombre="explorar" size={15} grosor={1.8} />
          {tarjeta.explorar.boton}
        </button>
        <span data-hoy-vuelves-despedida className="pt-1.5" style={{ font: "italic 400 20px/1.25 'Instrument Serif',serif", color: 'oklch(0.5 0.17 5)', textWrap: 'balance' as never }}>
          {tarjeta.despedida}
        </span>
      </div>
    </div>
  )
}

export { textoResumenDeParada }
