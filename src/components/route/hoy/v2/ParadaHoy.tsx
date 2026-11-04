import { useEffect, useState, type ReactNode } from 'react'
import type { Coordinates, DayPlan, Route, Stop } from '../../../../lib/types'
import type { Reservation } from '../../../../lib/bookings'
import { displayStopName, formatDuration } from '../../../../lib/format'
import { hasRealCoordinates } from '../../../../lib/distanceMock'
import { formatWeekdayAbbrEs } from '../../../../lib/dateRange'
import { logrosActivos } from '../../../../lib/logros'
import {
  aplicarCambio,
  avisoDeSalida,
  cuentaDelDia,
  estaAqui,
  filasDelDia,
  fijasDelDia,
  horaCorta,
  horaFijaDe,
  proponerCorrerElDia,
  textoDeSalida,
  tituloDeComida,
  trayectoHasta,
  urlComoLlegar,
  type CambioDelDia,
  type TrayectoDeParada,
} from '../../../../lib/hoyParada'
import { useLogrosStore } from '../../../../store/useLogrosStore'
import { useRouteStore } from '../../../../store/useRouteStore'
import { Icono } from '../../../ui/Icono'
import { BotonFoto } from '../../fotos/BotonFoto'
import { fotoDeParada } from '../../../logros/visto/VistoFlujo'
import { TuEntradaEnHoy } from '../TuEntradaEnHoy'
import { HojaV2 } from './HojasV2'
import { ParadaFotoDeParada } from './ParadaFoto'
import { useFotoDeParada } from './useFotoDeParada'
import { ExtraDeParada } from './ExtraDeParada'

/** Los colores del diseño «Hoy Estados» (apartado 04): tinta, marfil, oro. */
const TINTA = '#1C2230'
const MARFIL = '#FBF3E2'
const ORO_CLARO = '#F3D88F'
const ORO = '#B58A2E'
const ORO_TEXTO = '#8E6820'
const OJO_MONO = { font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#6F4E37', textTransform: 'uppercase' as const }
const BOTON_ORO = { background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)', color: '#4A3510', boxShadow: '0 10px 20px -14px rgba(110,80,24,.7),inset 0 1px 0 rgba(255,255,255,.55)' }
const BOTON_MARFIL = { background: MARFIL, border: '1px solid rgba(181,138,46,.55)', color: '#4A3510' }
const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
const lonLat = (p: Coordinates) => `${p.lng.toFixed(5)},${p.lat.toFixed(5)}`

/** La hora de ahora en minutos, al día (se refresca cada 30 s). */
export function useAhoraMin(): number {
  const dame = () => {
    const d = new Date()
    return d.getHours() * 60 + d.getMinutes()
  }
  const [min, setMin] = useState(dame)
  useEffect(() => {
    const id = window.setInterval(() => setMin(dame()), 30000)
    return () => window.clearInterval(id)
  }, [])
  return min
}

/* ------------------------------------------------------------------ */
/* La cabecera: «JUE 26 · CENTRO HISTÓRICO», «Parada 2 de 4» y la barra */
/* ------------------------------------------------------------------ */

export function CabeceraParada({ ojo, ahora, total, hechas, derecha }: { ojo: string; ahora: number; total: number; hechas: number; derecha?: ReactNode }) {
  return (
    <>
      <div data-hoy-parada-cabecera className="flex flex-none items-end justify-between gap-3 px-1 pt-1">
        <div className="flex min-w-0 flex-col gap-[5px]">
          <span className="truncate" style={OJO_MONO}>{ojo}</span>
          <span data-hoy-parada-n style={{ font: "400 33px/1 'Instrument Serif',serif" }}>
            {ahora > 0 ? (
              <>
                Parada <em style={{ color: ORO_TEXTO }}>{ahora} de {total}</em>
              </>
            ) : (
              <>
                Todo <em style={{ color: ORO_TEXTO }}>visto</em>
              </>
            )}
          </span>
        </div>
        {/* HOY1-B: aquí van la cámara de viaje y la campana (los pone el agente B con UNA línea). */}
        {derecha}
      </div>
      <div data-hoy-progreso className="flex flex-none gap-[5px] px-1 pb-0.5 pt-0.5" aria-hidden="true">
        {Array.from({ length: Math.max(total, 1) }, (_, i) => (
          <span key={i} className="h-1 flex-1 rounded-sm" style={{ background: i < hechas ? ORO : 'rgba(28,34,48,.14)' }} />
        ))}
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* H4: la línea dorada del logro                                        */
/* ------------------------------------------------------------------ */

/** Lo último que ha sumado un Visto («Los imprescindibles de Roma»): se apunta de lo que cae en el almacén de los logros mientras HOY está abierto. */
export function useUltimaSuma(clave: string | null): string | null {
  const [suma, setSuma] = useState<{ clave: string; nombre: string } | null>(null)
  useEffect(() => {
    if (!clave) return
    return useLogrosStore.subscribe((s, antes) => {
      if (s.momentos === antes.momentos) return
      const nuevos = s.momentos.filter((m) => !antes.momentos.includes(m))
      const m = [...nuevos].reverse().find((x) => x.tipo === 'suma' || x.tipo === 'suma_sello')
      if (m && typeof m.nombre === 'string') setSuma({ clave, nombre: m.nombre })
    })
  }, [clave])
  return suma && suma.clave === clave ? suma.nombre : null
}

export function LineaDelLogro({ texto }: { texto: string }) {
  return (
    <div data-hoy-linea-logro className="flex h-9 flex-none items-center gap-2 rounded-xl px-3" style={{ background: 'linear-gradient(135deg,#FBF1D2,#F0DCA0)', border: '1px solid #C9A24E', color: '#6E5018', font: "700 13px 'Geist'" }}>
      <Icono nombre="estrella" size={15} grosor={1.9} />
      {texto}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* La tarjeta oscura de la siguiente parada                             */
/* ------------------------------------------------------------------ */

function Insignia({ texto }: { texto: string }) {
  return (
    <span data-hoy-insignia className="absolute left-3.5 top-3 flex h-6 items-center rounded-full px-2.5" style={{ background: 'rgba(28,34,48,.72)', border: '1px solid rgba(243,216,143,.5)', color: ORO_CLARO, font: "700 10.5px 'Geist Mono',monospace", letterSpacing: '.14em' }}>
      {texto}
    </span>
  )
}

/** El mapa pequeño de arriba (una imagen estática de Mapbox con los dos puntos) y, sin él, un fondo de líneas. */
function MapaDeLlegada({ parada, desde }: { parada: Stop; desde: Coordinates | null }) {
  const [fallo, setFallo] = useState(false)
  const real = hasRealCoordinates(parada.coordinates)
  let url: string | null = null
  if (TOKEN && real && !fallo) {
    const pines = desde ? `pin-s+F3D88F(${lonLat(desde)}),pin-l+B58A2E(${lonLat(parada.coordinates)})` : `pin-l+B58A2E(${lonLat(parada.coordinates)})`
    url = desde ? `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${pines}/auto/340x84@2x?padding=18&attribution=false&access_token=${TOKEN}` : `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${pines}/${lonLat(parada.coordinates)},14/340x84@2x?attribution=false&access_token=${TOKEN}`
  }
  return (
    <div className="relative h-[84px] overflow-hidden" style={{ background: '#E4EAD6' }} data-hoy-mapa-llegada>
      <span className="absolute inset-0" style={{ background: 'repeating-linear-gradient(40deg,rgba(255,255,255,.6) 0 3px,transparent 3px 40px)' }} />
      {url && <img src={url} alt="Mapa hasta la siguiente parada" className="absolute inset-0 h-full w-full object-cover" loading="lazy" onError={() => setFallo(true)} />}
    </div>
  )
}

function FotoDeLaParada({ parada, ciudad, dateIso }: { parada: Stop; ciudad: string; dateIso: string }) {
  const foto = useFotoDeParada(parada, ciudad, dateIso)
  const [fallo, setFallo] = useState(false)
  return (
    <div className="relative h-[76px] overflow-hidden" style={{ background: 'linear-gradient(150deg,#6B5A44,#2A3141)' }}>
      {foto && !fallo && <img src={foto} alt="" className="h-full w-full object-cover" onError={() => setFallo(true)} />}
      <span className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(28,34,48,.1),rgba(28,34,48,.75))' }} />
    </div>
  )
}

function PastillaAqui({ icono, texto, onClick, dato }: { icono: Parameters<typeof Icono>[0]['nombre']; texto: string; onClick: () => void; dato: string }) {
  return (
    <button type="button" onClick={onClick} data-hoy-pastilla={dato} className="flex min-h-[50px] items-center gap-[9px] rounded-2xl px-2.5 py-2 text-left" style={{ background: 'rgba(251,243,226,.08)', border: '1px solid rgba(243,216,143,.38)', color: MARFIL, font: "600 12.5px/1.2 'Geist'" }}>
      <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)', color: '#4A3510' }}>
        <Icono nombre={icono} size={16} grosor={1.9} />
      </span>
      {texto}
    </button>
  )
}

/** «Dónde has aparcado» (solo en coche): guarda dónde se dejó el coche y, al volver, abre el camino a pie hasta él. */
function DondeAparcado({ rutaId, onCerrar }: { rutaId: string; onCerrar: () => void }) {
  const clave = `trazo:hoy:aparcado:${rutaId}`
  const leer = (): { lat: number; lng: number; hora: string } | null => {
    try {
      const x = JSON.parse(window.localStorage.getItem(clave) ?? 'null')
      return x && Number.isFinite(x.lat) && Number.isFinite(x.lng) ? x : null
    } catch {
      return null
    }
  }
  const [guardado, setGuardado] = useState(leer)
  const [pidiendo, setPidiendo] = useState(false)
  const [error, setError] = useState(false)
  const guardar = () => {
    setPidiendo(true)
    setError(false)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const d = new Date()
        const dato = { lat: p.coords.latitude, lng: p.coords.longitude, hora: `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}` }
        try {
          window.localStorage.setItem(clave, JSON.stringify(dato))
        } catch {
          /* sin almacenamiento: vale hasta cerrar */
        }
        setGuardado(dato)
        setPidiendo(false)
      },
      () => {
        setPidiendo(false)
        setError(true)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }
  return (
    <HojaV2 onCerrar={onCerrar} etiqueta="Dónde has aparcado" fondo={MARFIL}>
      <div className="flex items-start gap-3" data-hoy-donde-aparcado>
        <span className="flex-1" style={{ font: "400 30px/1 'Instrument Serif',serif" }}>Dónde has aparcado</span>
        <button type="button" onClick={onCerrar} aria-label="Cerrar" className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#1C2230]/8">
          <Icono nombre="cerrar" size={15} grosor={2} />
        </button>
      </div>
      {guardado ? (
        <>
          <p className="m-0 text-[14px] leading-[1.45] text-[#1C2230]/80">Aparcaste hacia las {guardado.hora}. Así vuelves al coche cuando termines.</p>
          <a href={urlComoLlegar({ lat: guardado.lat, lng: guardado.lng }, null, false)} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-2xl text-[14px] font-bold no-underline" style={BOTON_ORO}>
            <Icono nombre="coche" size={17} grosor={1.9} />
            Volver al coche
          </a>
          <button type="button" onClick={guardar} disabled={pidiendo} className="h-11 rounded-2xl text-[13px] font-semibold" style={BOTON_MARFIL}>
            {pidiendo ? 'Buscando…' : 'He aparcado en otro sitio: guardar aquí'}
          </button>
        </>
      ) : (
        <>
          <p className="m-0 text-[14px] leading-[1.45] text-[#1C2230]/80">Guarda el sitio donde has dejado el coche y luego te llevamos hasta él.</p>
          <button type="button" onClick={guardar} disabled={pidiendo} data-hoy-guardar-aparcamiento className="flex h-12 items-center justify-center gap-2 rounded-2xl text-[14px] font-bold" style={BOTON_ORO}>
            <Icono nombre="ubicacion" size={17} grosor={1.9} />
            {pidiendo ? 'Buscando…' : 'Guardar dónde he aparcado'}
          </button>
        </>
      )}
      {error && <p className="m-0 text-[12.5px] text-[#B23B2E]">No hemos podido saber dónde estás. Activa la ubicación y vuelve a probar.</p>}
    </HojaV2>
  )
}

/** H3b: la hoja «Más tiempo aquí» con +15 y +30. */
function HojaMasTiempo({ onElegir, onCerrar }: { onElegir: (min: 15 | 30) => void; onCerrar: () => void }) {
  return (
    <HojaV2 onCerrar={onCerrar} etiqueta="Más tiempo aquí" fondo={MARFIL}>
      <div className="flex items-center justify-between" data-hoy-mas-tiempo>
        <span style={{ font: "400 30px/1 'Instrument Serif',serif" }}>Más tiempo aquí</span>
        <button type="button" onClick={onCerrar} aria-label="Cerrar" className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#1C2230]/8">
          <Icono nombre="cerrar" size={15} grosor={2} />
        </button>
      </div>
      {([
        [15, '+15 min', 'Seguimos aquí un poco más'],
        [30, '+30 min', 'Movemos el resto de tu día'],
      ] as const).map(([min, titulo, sub]) => (
        <button key={min} type="button" onClick={() => onElegir(min)} data-hoy-mas-tiempo-opcion={min} className="flex items-center gap-3.5 rounded-[22px] py-3 pl-3 pr-3.5 text-left" style={{ background: '#FFFDF8', border: '1px solid rgba(28,34,48,.12)' }}>
          <span className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-2xl" style={{ background: '#F3E3B2', color: '#4A3510' }}>
            <Icono nombre="reloj" size={24} grosor={1.8} />
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            <span style={{ font: "400 22px/1.1 'Instrument Serif',serif" }}>{titulo}</span>
            <span className="text-[13.5px] leading-[1.3] text-[#1C2230]/60">{sub}</span>
          </span>
          <Icono nombre="adelante" size={16} grosor={2} />
        </button>
      ))}
    </HojaV2>
  )
}

export interface PropsParada {
  route: Route
  day: DayPlan
  dateIso: string
  siguiente: Stop
  anterior?: Stop
  reservaSiguiente: Reservation | null
  ubicacion: Coordinates | null
  ubicacionEstado: 'libre' | 'pidiendo' | 'no'
  pedirUbicacion: () => void
  enCoche: boolean
  /** Al tocar [He terminado] (= el Visto de siempre). */
  onTerminado: () => void
  onSaltar: () => void
  /** Acaba de marcarse una parada como vista: esta es «SIGUIENTE» (H4). */
  recienTerminada: boolean
  /** El pase (o el día de prueba) está abierto. */
  conPase: boolean
  /** El botón [Escuchar] en sus dos formas (la línea de «mientras llegas» y la pastilla). Null si el sitio no tiene historia. */
  escuchar: (variante: 'linea' | 'pastilla') => ReactNode
  onQueVasAVer: () => void
  /** La línea del horario del sitio («Abre de 9:00 a 19:00», «Cerrado este día»). */
  lineaHorario?: ReactNode
  /** La zona del alojamiento: de dónde sale la primera parada del día. */
  casa?: Coordinates | null
}

/** H1, H1b, H2 (por llegar), H3, H3b (ya estás aquí) y H4 (completada: «SIGUIENTE» con la línea dorada). */
export function TarjetaParada(p: PropsParada) {
  const { route, day, dateIso, siguiente, anterior, reservaSiguiente, ubicacion, enCoche } = p
  const [forzada, setForzada] = useState<string | null>(null)
  const [hojaTiempo, setHojaTiempo] = useState(false)
  const [hojaAparcado, setHojaAparcado] = useState(false)
  const [verEntrada, setVerEntrada] = useState(false)
  const [aviso, setAviso] = useState<{ cambio: CambioDelDia | null; texto: string } | null>(null)
  const ahoraMin = useAhoraMin()
  const reservations = useRouteStore((s) => s.reservations)
  const aqui = forzada === siguiente.id || estaAqui(ubicacion, siguiente)
  const trayecto: TrayectoDeParada | null = trayectoHasta({ siguiente, ubicacion, anterior, enCoche, casa: p.casa, ida: day.coche?.activo ? day.coche.ida : null })
  const fija = horaFijaDe(siguiente, reservaSiguiente)
  const salida = aqui ? null : avisoDeSalida(ahoraMin, fija, trayecto?.totalMin ?? null)
  const desde = ubicacion ?? (anterior && hasRealCoordinates(anterior.coordinates) ? anterior.coordinates : null) ?? p.casa ?? null
  const comoLlegar = hasRealCoordinates(siguiente.coordinates) ? urlComoLlegar(siguiente.coordinates, ubicacion ? null : desde, enCoche) : null

  // El aviso de «Más tiempo» (y su [Deshacer]) se va solo a los 12 s.
  useEffect(() => {
    if (!aviso) return
    const id = window.setTimeout(() => setAviso(null), 12000)
    return () => window.clearTimeout(id)
  }, [aviso])

  const elegirTiempo = (min: 15 | 30) => {
    setHojaTiempo(false)
    if (!p.conPase) {
      // Sin el pase solo se apunta: el día no se toca.
      useRouteStore.getState().noteStopDelay(day.id, siguiente.id)
      setAviso({ cambio: null, texto: `Anotado: +${min} min aquí. Con el pase te corremos el resto del día.` })
      return
    }
    const cambio = proponerCorrerElDia(day, siguiente.id, min, fijasDelDia(route, day, reservations))
    if (!cambio) {
      setAviso({ cambio: null, texto: `Seguimos aquí +${min} min. No hay nada más que correr hoy.` })
      return
    }
    aplicarCambio(cambio, 'despues')
    const nombres = cambio.quitadas.map((id) => day.stops.find((s) => s.id === id)?.name).filter(Boolean).map((n) => displayStopName(n as string))
    const quitado = nombres.length ? ` Hemos quitado ${nombres.join(' y ')}, que era opcional.` : ''
    const mal = cambio.noCabe ? ' Aun así, el final del día se queda justo.' : ''
    setAviso({ cambio, texto: `Hemos corrido ${min} min el resto de tu día.${quitado}${mal}` })
  }
  const deshacer = () => {
    if (aviso?.cambio) aplicarCambio(aviso.cambio, 'antes')
    setAviso(null)
  }

  const hacerFoto = () => {
    if (logrosActivos()) fotoDeParada({ tripId: route.id, dayId: day.id, dayNumber: day.dayNumber, stopId: siguiente.id, nombre: siguiente.name }, 'pedazo')
  }

  const insignia = aqui ? 'YA ESTÁS AQUÍ' : p.recienTerminada ? 'SIGUIENTE' : 'POR LLEGAR'
  const duracion = siguiente.durationMinutes > 0 ? formatDuration(siguiente.durationMinutes) : null
  return (
    <>
      <div data-hoy-siguiente data-hoy-estado={aqui ? 'aqui' : 'llegar'} data-tarjeta="oscura" className="flex-none overflow-hidden rounded-[26px]" style={{ background: TINTA, color: MARFIL, boxShadow: '0 18px 30px -18px rgba(28,34,48,.7)' }}>
        <div className="relative">
          {aqui ? <FotoDeLaParada parada={siguiente} ciudad={day.city} dateIso={dateIso} /> : <MapaDeLlegada parada={siguiente} desde={desde} />}
          <Insignia texto={insignia} />
        </div>
        <div className="flex flex-col gap-[9px] px-4 pb-4 pt-3">
          <button type="button" onClick={() => setForzada(siguiente.id)} aria-label={`Ya he llegado a ${displayStopName(siguiente.name)}`} data-hoy-ya-he-llegado className="text-left" style={{ font: "400 30px/1 'Instrument Serif',serif", textWrap: 'balance' as never }}>
            {displayStopName(siguiente.name)}
          </button>
          {duracion && !aqui && <span className="-mt-1 text-[12px]" style={{ color: 'rgba(251,243,226,.65)' }}>{duracion} de visita</span>}
          {!aqui && p.lineaHorario}
          {aqui ? (
            <>
              <span className="text-[14.5px] leading-[1.3]" style={{ color: ORO_CLARO }}>Ya estás aquí. ¿Empezamos?</span>
              <div className="grid grid-cols-2 gap-2">
                {reservaSiguiente && <PastillaAqui icono="reservas" texto="Tu entrada" dato="entrada" onClick={() => setVerEntrada((v) => !v)} />}
                <PastillaAqui icono="ojo" texto="Qué vas a ver" dato="que-vas-a-ver" onClick={p.onQueVasAVer} />
                {p.escuchar('pastilla')}
                {enCoche && <PastillaAqui icono="coche" texto="Dónde has aparcado" dato="aparcado" onClick={() => setHojaAparcado(true)} />}
              </div>
              {verEntrada && reservaSiguiente && <TuEntradaEnHoy route={route} reserva={reservaSiguiente} />}
              <div className="grid grid-cols-2 gap-2">
                {logrosActivos() ? (
                  <button type="button" onClick={hacerFoto} data-hoy-haz-tu-foto className="flex h-[52px] items-center justify-center gap-1.5 rounded-2xl px-2.5 text-[14px] font-bold" style={BOTON_ORO}>
                    <Icono nombre="camara" size={17} grosor={1.9} />
                    Haz tu foto
                  </button>
                ) : (
                  <BotonFoto dayId={day.id} dayNumber={day.dayNumber} stopName={siguiente.name} etiqueta="Haz tu foto" className="flex h-[52px] w-full items-center justify-center gap-1.5 rounded-2xl px-2.5 text-[14px] font-bold" style={BOTON_ORO} claseContenedor="block w-full">
                    <Icono nombre="camara" size={17} grosor={1.9} />
                    Haz tu foto
                  </BotonFoto>
                )}
                <button type="button" onClick={() => setHojaTiempo(true)} data-hoy-necesito-mas-tiempo className="min-h-[52px] rounded-2xl px-2.5 text-center text-[13px] font-bold leading-[1.15]" style={BOTON_MARFIL}>
                  Necesito más tiempo
                </button>
              </div>
              <button type="button" onClick={p.onTerminado} data-boton-visto data-hoy-he-terminado className="flex h-[50px] items-center justify-center gap-1.5 rounded-2xl text-[13.5px] font-bold text-white" style={{ background: '#2B7F45', boxShadow: '0 10px 20px -14px rgba(31,98,54,.7),inset 0 1px 0 rgba(255,255,255,.25)' }}>
                <Icono nombre="hecho" size={16} grosor={2.4} />
                He terminado
              </button>
            </>
          ) : (
            <>
              {trayecto && (
                <div className="flex items-center gap-2.5" data-hoy-trayecto={trayecto.modo}>
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full" style={{ background: 'rgba(251,243,226,.1)', color: ORO_CLARO }}>
                    <Icono nombre={trayecto.modo === 'coche' ? 'coche' : 'andando'} size={17} grosor={1.8} />
                  </span>
                  <span className="flex min-w-0 flex-col gap-px">
                    <b style={{ font: "700 14.5px 'Geist'" }}>{trayecto.titulo}</b>
                    <span className="text-[12px]" style={{ color: 'rgba(251,243,226,.65)' }}>
                      {trayecto.detalle}
                      {!ubicacion && p.ubicacionEstado !== 'no' && (
                        <>
                          {trayecto.detalle ? ' · ' : ''}
                          <button type="button" onClick={p.pedirUbicacion} disabled={p.ubicacionEstado === 'pidiendo'} data-hoy-usar-ubicacion className="inline-flex min-h-6 items-center underline underline-offset-2" style={{ color: ORO_CLARO }}>
                            {p.ubicacionEstado === 'pidiendo' ? 'Buscando…' : 'usar mi ubicación'}
                          </button>
                        </>
                      )}
                    </span>
                  </span>
                </div>
              )}
              {salida && fija != null && (
                <div data-hoy-salida={salida} className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold leading-[1.3]" style={salida === 'tarde' ? { background: 'rgba(214,70,60,.22)', border: '1px solid #E5766B', color: '#FFC2BA' } : { background: 'rgba(243,216,143,.14)', border: '1px solid rgba(243,216,143,.35)', color: ORO_CLARO }}>
                  <Icono nombre="reloj" size={15} grosor={2} />
                  {textoDeSalida(salida, fija)}
                </div>
              )}
              {p.escuchar('linea')}
              <div className="grid grid-cols-2 gap-2">
                {comoLlegar ? (
                  <a href={comoLlegar} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-1.5 rounded-2xl px-2.5 text-[13.5px] font-bold no-underline" style={BOTON_ORO}>
                    <Icono nombre="localizar" size={17} grosor={1.9} />
                    Cómo llegar
                  </a>
                ) : (
                  <span className="flex h-12 items-center justify-center rounded-2xl text-[13.5px] font-bold opacity-50" style={BOTON_ORO}>Cómo llegar</span>
                )}
                <button type="button" onClick={p.onSaltar} data-hoy-no-me-da-tiempo className="flex h-12 items-center justify-center gap-1.5 rounded-2xl px-2.5 text-[13.5px] font-bold" style={BOTON_MARFIL}>
                  No me da tiempo
                </button>
              </div>
              <ExtraDeParada parada={siguiente} dayId={day.id} vista={false} contexto="tarjeta" route={route} reserva={reservaSiguiente} />
            </>
          )}
        </div>
      </div>
      {aviso && (
        <div data-hoy-aviso-tiempo className="sticky bottom-24 z-10 flex min-h-[46px] flex-none items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-[13px] font-medium" style={{ background: TINTA, color: MARFIL }}>
          <span className="flex-1 leading-[1.35]">{aviso.texto}</span>
          {aviso.cambio && (
            <button type="button" onClick={deshacer} data-hoy-deshacer-tiempo className="flex h-11 flex-none items-center font-bold" style={{ color: ORO_CLARO }}>
              Deshacer
            </button>
          )}
        </div>
      )}
      {hojaTiempo && <HojaMasTiempo onElegir={elegirTiempo} onCerrar={() => setHojaTiempo(false)} />}
      {hojaAparcado && <DondeAparcado rutaId={route.id} onCerrar={() => setHojaAparcado(false)} />}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* H6: por la mañana                                                    */
/* ------------------------------------------------------------------ */

export function TarjetaPorLaManana({ route, day, dateIso, primera, hora, trayecto, comoLlegar }: { route: Route; day: DayPlan; dateIso: string; primera: Stop; hora: string; trayecto: TrayectoDeParada; comoLlegar: string | null }) {
  void route
  return (
    <div data-hoy-por-la-manana className="flex flex-none flex-col gap-3.5 rounded-[26px] p-[18px]" style={{ background: '#FFFDF8', border: '1px solid rgba(181,138,46,.4)' }}>
      <span style={OJO_MONO}>Primera parada</span>
      <span data-hoy-sal-de-casa style={{ font: "400 36px/1.05 'Instrument Serif',serif" }}>
        Sal de casa a las <em style={{ color: ORO_TEXTO }}>{hora}</em>
      </span>
      <div className="flex items-center gap-3 rounded-[18px] p-2.5" style={{ background: '#F5EFE4' }}>
        <ParadaFotoDeParada parada={primera} ciudad={day.city} dateIso={dateIso} vista marca={false} size={56} />
        <span className="flex flex-1 flex-col gap-[3px]">
          <b style={{ font: "600 16px 'Geist'" }}>{displayStopName(primera.name)}</b>
          <span className="flex items-center gap-1.5 text-[13px] text-[#1C2230]/60">
            <Icono nombre={trayecto.modo === 'coche' ? 'coche' : 'andando'} size={14} grosor={1.8} />
            {trayecto.titulo}
            {trayecto.detalle ? ` · ${trayecto.detalle}` : ''}
          </span>
        </span>
      </div>
      {comoLlegar && (
        <a href={comoLlegar} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-1.5 rounded-2xl text-[13.5px] font-bold no-underline" style={BOTON_ORO}>
          <Icono nombre="localizar" size={17} grosor={1.9} />
          Cómo llegar
        </a>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* «Tu día»: la lista que se cierra y se abre                           */
/* ------------------------------------------------------------------ */

export function TuDia({ route, day, dateIso, paradas, siguienteId, reservaDe, onRecuperar }: { route: Route; day: DayPlan; dateIso: string; paradas: Stop[]; siguienteId: string | null; reservaDe: (s: Stop) => Reservation | null; onRecuperar: (s: Stop) => void }) {
  const [abierta, setAbierta] = useState(true)
  const { total, hechas } = cuentaDelDia(paradas)
  const filas = filasDelDia(day, paradas)
  void route
  return (
    <div data-hoy-tu-dia={abierta ? 'abierta' : 'cerrada'} className="flex flex-none flex-col gap-[7px] pt-1">
      <button type="button" onClick={() => setAbierta((v) => !v)} aria-expanded={abierta} data-hoy-tu-dia-cabecera className="flex min-h-12 items-center gap-2.5 rounded-2xl px-3.5" style={abierta ? { background: 'transparent' } : { background: '#FFFDF8', border: '1px solid rgba(181,138,46,.45)' }}>
        <span style={OJO_MONO}>Tu día</span>
        <span className="flex-1 text-left text-[13.5px] font-semibold" data-hoy-tu-dia-cuenta>{hechas} de {total}</span>
        <span className="text-[13px] font-semibold" style={{ color: ORO_TEXTO }}>{abierta ? 'ocultar' : 'ver todo'}</span>
        <Icono nombre={abierta ? 'arriba' : 'abajo'} size={15} grosor={2} style={{ color: ORO_TEXTO }} />
      </button>
      {abierta && (
        <div className="flex flex-col gap-[7px]" data-hoy-lista>
          {filas.map((fila, i) => {
            if (fila.tipo === 'noche')
              return (
                <span key="noche" className="flex items-center gap-2 px-1 pt-2" style={{ ...OJO_MONO, color: 'oklch(0.4 0.1 285)' }}>
                  <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full" style={{ background: 'oklch(0.92 0.04 285)' }}>
                    <Icono nombre="noche" size={12} grosor={2} />
                  </span>
                  Noche
                </span>
              )
            if (fila.tipo === 'comida')
              return (
                <div key={`m-${fila.meal.id}-${i}`} data-hoy-fila="comida" className="flex min-h-[44px] items-center gap-2.5 px-1">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full" style={{ background: '#FFFDF8', border: `1.5px solid ${ORO}`, color: ORO_TEXTO }}>
                    <Icono nombre="comida" size={12} grosor={1.9} />
                  </span>
                  <span className="flex h-[30px] w-[30px] flex-none rounded-[9px]" style={{ background: '#F3E3B2' }} />
                  <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{tituloDeComida(fila.meal)}</span>
                  <span className="text-[12px] font-semibold text-[#1C2230]/55" style={{ fontFamily: "'Geist Mono',monospace" }}>{horaCorta(fila.meal.time)}</span>
                </div>
              )
            const s = fila.stop
            const saltada = Boolean(s.saltada)
            const hecha = Boolean(s.checkedInAt) && !saltada
            const ahora = siguienteId === s.id
            const n = paradas.filter((x) => !x.saltada).findIndex((x) => x.id === s.id) + 1
            const reserva = reservaDe(s)
            return (
              <div key={s.id} data-hoy-fila="parada" data-hoy-fila-estado={saltada ? 'saltada' : hecha ? 'hecha' : ahora ? 'ahora' : 'viene'} data-saltada={saltada ? 'true' : undefined} className="flex min-h-[44px] items-center gap-2.5 py-[3px] pl-1 pr-2" style={ahora ? { borderRadius: 14, background: '#FFFDF8', border: '1px solid rgba(181,138,46,.5)' } : undefined}>
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11.5px] font-bold" style={hecha ? { background: ORO, color: '#fff' } : ahora ? { background: TINTA, color: ORO_CLARO } : saltada ? { background: 'rgba(28,34,48,.1)', color: 'rgba(28,34,48,.5)' } : { background: '#FFFDF8', border: `1.5px solid ${ORO}`, color: ORO_TEXTO }}>
                  {hecha ? <Icono nombre="hecho" size={12} grosor={3} /> : saltada ? '–' : n}
                </span>
                <span style={{ opacity: hecha || saltada ? 0.5 : 1 }}>
                  <ParadaFotoDeParada parada={s} ciudad={day.city} dateIso={dateIso} vista={false} size={30} />
                </span>
                <span className={`min-w-0 flex-1 truncate ${saltada ? 'line-through' : ''}`} style={{ font: ahora ? "700 14px 'Geist'" : "600 14px 'Geist'", color: hecha || saltada ? 'rgba(28,34,48,.55)' : TINTA }}>
                  {displayStopName(s.name)}
                </span>
                {reserva?.time && !saltada && <span className="flex h-6 flex-none items-center rounded-full px-2 text-[11px] font-semibold" style={{ background: 'oklch(0.96 0.035 150)', border: '1px solid oklch(0.55 0.11 150 / .3)', color: 'oklch(0.38 0.1 150)', fontFamily: "'Geist Mono',monospace" }}>✓ {horaCorta(reserva.time)}</span>}
                {saltada ? (
                  <button type="button" onClick={() => onRecuperar(s)} data-hoy-recuperar className="flex h-11 flex-none items-center gap-1 rounded-full text-[10.5px] font-semibold text-[#1C2230]/75">
                    <span className="flex h-[26px] items-center gap-1 rounded-full border border-[rgba(28,34,48,.16)] bg-white pl-1.5 pr-2">
                      <Icono nombre="recuperar" size={11} grosor={2} />
                      Recuperar
                    </span>
                  </button>
                ) : ahora ? (
                  <span className="h-[22px] flex-none rounded-full px-[9px] text-[10.5px] font-bold leading-[22px]" style={{ background: ORO, color: '#fff' }}>Ahora</span>
                ) : (
                  <span className="text-[12px] font-semibold text-[#1C2230]/55" style={{ fontFamily: "'Geist Mono',monospace" }}>{horaCorta(s.time)}</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** El aviso de abajo de H5: «Parada saltada · Deshacer». */
export function AvisoSaltada({ onDeshacer }: { onDeshacer: () => void }) {
  return (
    <div data-hoy-aviso-saltada className="sticky bottom-24 z-10 flex min-h-[46px] flex-none items-center rounded-[14px] px-3.5 text-[13px] font-medium" style={{ background: TINTA, color: MARFIL }}>
      <span className="flex-1">Parada saltada</span>
      <button type="button" onClick={onDeshacer} data-hoy-deshacer-saltada className="flex h-11 items-center font-bold" style={{ color: ORO_CLARO }}>
        Deshacer
      </button>
    </div>
  )
}

export const ojoDeParada = (dateIso: string, titulo: string): string => `${formatWeekdayAbbrEs(dateIso)} ${Number(dateIso.slice(8, 10))} · ${titulo}`
