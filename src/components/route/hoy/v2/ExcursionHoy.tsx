import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import type { DayPlan, Coordinates, Route, Stop } from '../../../../lib/types'
import { useRouteStore } from '../../../../store/useRouteStore'
import { useSyncStore } from '../../../../store/useSyncStore'
import { useReservasFocusStore, type BloqueReservasId } from '../../../../store/useReservasFocusStore'
import { excursionReservationOf, viewedExcursion } from '../../../../lib/dayInterruptor'
import { excursionDeUnDia, type Reservation } from '../../../../lib/bookings'
import { nombreDeLaExcursion, unidasAUnaExcursion, filasDeBilletes, horaSinCero } from '../../../../lib/reservasUnidas'
import type { ReservaExtra } from '../../../../lib/reservasExtra'
import { useExcursionesCompletas } from '../../../../lib/excursionesDatos'
import { excursionConCodigo } from '../../../../store/useBilleteStore'
import { useBilletesDeExcursiones } from '../../../../hooks/useBilleteExcursion'
import { formatWeekdayAbbrEs } from '../../../../lib/dateRange'
import { enlaceComoLlegarAlojamiento } from '../../../../lib/direccionAlojamiento'
import { haversineMeters } from '../../../../lib/distanceMock'
import { marcarDicho, yaDicho } from '../../../../lib/avisosUnaVez'
import { logrosActivos } from '../../../../lib/logros'
import { useFichaDeSitio } from '../../../../lib/historia'
import { abrirAvisoPase } from '../../../../lib/avisoPase'
import { usePaseEstado } from '../../../../lib/paseEstado'
import { segunGrupo } from '../../../../lib/viajaEnGrupo'
import {
  ESTADO_VACIO,
  avisoDelUltimo,
  cajasOrganizada,
  cajasPorTuCuenta,
  gpsEnElDestino,
  leerDatosHoyDeExcursion,
  leerDiaEscritoDeExcursion,
  modoDeLaExcursion,
  pasosDeLaExcursion,
  trasladosDelDia,
  type CajaDeExcursion,
  type DatosHoyDeExcursion,
  type DiaEscritoDeExcursion,
  type EstadoDeExcursion,
  type MedioDeExcursion,
  type PasoDeExcursion,
} from '../../../../lib/excursionHoy'
import { Icono } from '../../../ui/Icono'
import { ImagenConFundido } from '../../../ui/ImagenConFundido'
import { BOTON_ORO } from '../../../ui/botonesOro'
import { HojaDeHora } from '../../../ui/HojaDeHora'
import { fotoDeParada } from '../../../logros/visto/VistoFlujo'
import { BOTON_VERDE } from '../piezas'
import { BarraDeHistoria, BloqueDePedazos, BotonIcono, CajaDeParada, TARJETA_PARADA } from './ParadaHoy'
import { CabeceraDeTrayecto, FilaDeBilleteHoy, columnas } from './TarjetaDeTransporteHoy'
import { BloqueDeConsejos, useConsejos } from './ConsejosDelDia'
import { AvisoDeHoy, D_AVISO, FilaDeAviso, ZonaDeAvisos } from './AvisosHoy'
import { emblemaDeParada, piezaDeParada, usePedazosDeParada } from './usePedazosDeParada'
import { useHistoriaDeParada } from './useHistoriaDeParada'
import { FichaCompletaDeHoy } from './BloquesHoy'
import { IdeasYPendientesHoy } from './IdeasYPendientesHoy'

/**
 * (V80, apartados 1 a 3; Design «Día de excursión en HOY», EX1 a EX6) EL DÍA DE EXCURSIÓN EN HOY, PASO A PASO.
 *  · Por tu cuenta (ferry, tren, bus o coche): la tarjeta de la excursión como la de la llegada (foto, «EXCURSIÓN · VIE 27», las cajas SALIDA / FERRY (TREN) / VUELTA), los consejos (con X) y los PASOS, cada uno su tarjeta,
 *    sacados de los datos del día (`partes`) y de los billetes: coche hasta la salida · transporte de ida · «Tu tiempo en…» (ideas, no órdenes, sin [He terminado]) · transporte de vuelta · «Vuelta a tu alojamiento».
 *    El paso de ahora lleva su botón ([Cómo llegar] / [Ya he llegado]; en un ferry o tren, [He embarcado]). El aviso rojo del último barco o tren, desde 1 h 30 antes (`FilaDeAviso`).
 *  · Organizada (una empresa): la tarjeta con las cajas RECOGIDA, DURACIÓN y TRANSPORTE (de la ficha del operador o de la reserva; si no se sabe, la caja no sale), la reserva con su QR, los consejos, «Aquí ganas X pedazos» (la pieza
 *    de la parada), qué ver / escuchar / cámara (solo con contenido) y [He terminado] de punta a punta. Sin [Necesito más tiempo] ni «Saltar parada».
 * HOY y RESERVAS, los mismos datos: la hora, el puerto y el billete salen de la reserva guardada; aquí solo se guarda (en el móvil) lo que se ha hecho hoy: [Ya he llegado], [He embarcado], la hora que se cambió y [He terminado].
 * Consultas a Supabase: ninguna (archivos del destino y el móvil). `/api/place-detail` y `/api/logros/cerca` los pregunta la tarjeta de la parada igual: una vez por sitio y viaje.
 */

/* ── Lo guardado hoy, en el móvil (por viaje y día) ── */
type Guardado = EstadoDeExcursion & { terminada: boolean }
const VACIO: Guardado = { ...ESTADO_VACIO, terminada: false }
const claveDe = (rutaId: string, dateIso: string) => `jutrip:excursion-hoy:${rutaId}:${dateIso}`
const MEMORIA = new Map<string, Guardado>()
function leer(rutaId: string, dateIso: string): Guardado {
  const k = claveDe(rutaId, dateIso)
  try {
    const t = window.localStorage.getItem(k)
    return t ? { ...VACIO, ...(JSON.parse(t) as Partial<Guardado>) } : VACIO
  } catch {
    /* sin almacenamiento: vale la memoria de esta sesión */
  }
  return MEMORIA.get(k) ?? VACIO
}
function useGuardado(rutaId: string, dateIso: string): [Guardado, (p: Partial<Guardado>) => void] {
  const [g, setG] = useState<Guardado>(() => leer(rutaId, dateIso))
  useEffect(() => setG(leer(rutaId, dateIso)), [rutaId, dateIso])
  const poner = (p: Partial<Guardado>) =>
    setG((antes) => {
      const nuevo = { ...antes, ...p }
      MEMORIA.set(claveDe(rutaId, dateIso), nuevo)
      try {
        window.localStorage.setItem(claveDe(rutaId, dateIso), JSON.stringify(nuevo))
      } catch {
        /* solo la memoria */
      }
      return nuevo
    })
  return [g, poner]
}

/** Los datos de HOY de la excursión y su día escrito (archivos del destino, en un trozo aparte). `cargado` false mientras llegan. */
export function useDatosDeExcursion(destino: string, excursionId: string | null, diaEscritoId: string | null | undefined): { cargado: boolean; hoy: DatosHoyDeExcursion | null; dia: DiaEscritoDeExcursion | null } {
  const [d, setD] = useState<{ cargado: boolean; hoy: DatosHoyDeExcursion | null; dia: DiaEscritoDeExcursion | null; clave: string }>({ cargado: false, hoy: null, dia: null, clave: '' })
  const clave = `${destino}|${excursionId}|${diaEscritoId}`
  useEffect(() => {
    let vivo = true
    void (async () => {
      const hoy = await leerDatosHoyDeExcursion(destino, excursionId)
      const dia = await leerDiaEscritoDeExcursion(destino, hoy?.dia_escrito ?? diaEscritoId)
      if (vivo) setD({ cargado: true, hoy, dia, clave })
    })()
    return () => {
      vivo = false
    }
  }, [clave]) // eslint-disable-line react-hooks/exhaustive-deps
  return d.clave === clave ? d : { cargado: false, hoy: null, dia: null }
}

const TINTA = '#1C2230'
const ORO_TEXTO = '#8E6820'
const TARJETA_DE_PASO: CSSProperties = { background: '#FFFDF8', border: '1px solid rgba(28,34,48,.07)', boxShadow: '0 12px 22px -18px rgba(28,34,48,.4)' }
const OJO_MONO: CSSProperties = { font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }

const ICONO_DE_PASO: Record<PasoDeExcursion['tipo'], Parameters<typeof Icono>[0]['nombre']> = { salida: 'coche', ida: 'barco', tiempo: 'arena', vuelta: 'barco', casa: 'casa' }

/** Un paso: su círculo (✓ verde si ya está hecho), «PASO 1 · AHORA», el título y lo que lleva dentro. El de ahora, con borde dorado; el hecho, apagado. */
function TarjetaDePaso({ paso, medio, children }: { paso: PasoDeExcursion; medio: MedioDeExcursion; children?: ReactNode }) {
  const icono = paso.tipo === 'ida' || paso.tipo === 'vuelta' ? (medio === 'tren' ? 'tren' : medio === 'autobus' ? 'bus' : 'barco') : ICONO_DE_PASO[paso.tipo]
  const estilo: CSSProperties = paso.ahora ? { ...TARJETA_DE_PASO, border: '1.5px solid rgba(181,138,46,.75)', boxShadow: '0 16px 26px -20px rgba(110,80,24,.7)' } : paso.hecho ? { background: '#F6F0E2', border: '1px solid rgba(28,34,48,.05)' } : TARJETA_DE_PASO
  return (
    <div data-hoy-paso={paso.tipo} data-hoy-paso-numero={paso.numero} data-hoy-paso-estado={paso.hecho ? 'hecho' : paso.ahora ? 'ahora' : 'luego'} className="flex flex-none flex-col gap-3 rounded-[22px] p-3.5" style={estilo}>
      <div className="flex items-center gap-3">
        <span aria-hidden="true" data-hoy-paso-icono className="flex h-10 w-10 flex-none items-center justify-center rounded-full" style={paso.hecho ? { background: '#4E9A66', color: '#fff' } : { background: TINTA, color: '#F3D88F' }}>
          <Icono nombre={paso.hecho ? 'hecho' : icono} size={19} grosor={paso.hecho ? 2.4 : 1.8} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span data-hoy-paso-etiqueta style={{ ...OJO_MONO, color: paso.ahora ? '#8E6820' : 'rgba(28,34,48,.4)' }}>
            PASO {paso.numero}
            {paso.ahora ? ' · AHORA' : ''}
          </span>
          <span data-hoy-paso-titulo className="[overflow-wrap:anywhere] text-[17px] font-bold leading-[1.2]" style={{ color: paso.hecho ? 'rgba(28,34,48,.55)' : TINTA }}>
            {paso.titulo}
          </span>
        </span>
      </div>
      {paso.sub && (
        <span data-hoy-paso-sub className="text-[13.5px] leading-[1.35]" style={{ color: paso.hecho ? 'rgba(28,34,48,.45)' : 'rgba(28,34,48,.65)' }}>
          {paso.sub}
        </span>
      )}
      {children}
    </div>
  )
}

const BotonLink = ({ href, children, datos, flex = 1, conIcono = true }: { href: string; children: ReactNode; datos?: string; flex?: number; conIcono?: boolean }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" {...(datos ? { [datos]: '' } : {})} className="flex h-[52px] min-w-0 items-center justify-center gap-1.5 rounded-2xl px-2 text-center text-[13.5px] font-bold leading-[1.15] no-underline" style={{ ...BOTON_ORO, flex }}>
    {conIcono && <Icono nombre="localizar" size={16} grosor={2} />}
    {children}
  </a>
)

/** Los botones de contenido del sitio (Qué ver, Escuchar, Hacer foto), SOLO los que tienen algo detrás (nunca un botón que no hace nada, V69); en la organizada, antes, «Aquí ganas X pedazos». */
function ContenidoDelSitio({ route, day, dateIso, nombre, coords, id, conPedazos }: { route: Route; day: DayPlan; dateIso: string; nombre: string; coords: Coordinates | null; id: string; conPedazos: boolean }) {
  const parada = useMemo(() => ({ id: `excursion:${id}`, name: nombre, coordinates: coords ?? { lat: 0, lng: 0 } }) as unknown as Stop, [id, nombre, coords?.lat, coords?.lng]) // eslint-disable-line react-hooks/exhaustive-deps
  const tripId = useSyncStore((s) => s.activeTripId) ?? route.id
  const ficha = useFichaDeSitio(route.destination, nombre)
  const historia = useHistoriaDeParada(route.destination, parada)
  const pedazos = usePedazosDeParada(tripId, parada, true)
  const pieza = piezaDeParada(tripId, parada.id)
  const [fichaAbierta, setFichaAbierta] = useState(false)
  const queVer = (ficha?.what_to_see?.length ?? 0) > 0
  const camara = logrosActivos() && (pedazos.length > 0 || Boolean(emblemaDeParada(tripId, parada)))
  const alEscuchar = () => {
    if (historia.candado) abrirAvisoPase('escuchar_historia', { destino: route.destination })
    else if (historia.estado === 'parado') historia.escuchar()
    else if (historia.estado === 'hablando') historia.pausar()
    else historia.seguir()
  }
  const hacerFoto = () => fotoDeParada({ tripId: route.id, dayId: day.id, dayNumber: day.dayNumber, stopId: parada.id, nombre }, 'pedazo')
  const hayBotones = queVer || historia.hay || camara
  return (
    <>
      {conPedazos && pedazos.length > 0 && <BloqueDePedazos pedazos={pedazos} pieza={pieza} />}
      {historia.hay && !historia.candado && historia.estado !== 'parado' && <BarraDeHistoria h={historia} />}
      {hayBotones && (
        <div data-hoy-excursion-botones className="flex gap-[9px]">
          {queVer && <BotonIcono icono="ojo" etiqueta={`Qué ver en ${nombre}`} dato="que-vas-a-ver" texto="Qué ver" onClick={() => setFichaAbierta(true)} />}
          {historia.hay && <BotonIcono icono={historia.estado === 'hablando' ? 'pausa' : 'altavoz'} etiqueta={historia.estado === 'parado' ? 'Escuchar historia' : historia.estado === 'hablando' ? 'Pausar la historia' : 'Seguir con la historia'} dato="escuchar" texto={historia.estado === 'hablando' ? 'Pausar historia' : 'Escuchar historia'} candado={historia.candado} onClick={alEscuchar} />}
          {camara && <BotonIcono icono="camara" etiqueta="Haz tu foto" dato="haz-tu-foto" texto="Hacer foto" oro onClick={hacerFoto} />}
        </div>
      )}
      {fichaAbierta && <FichaCompletaDeHoy route={route} day={day} dateIso={dateIso} parada={parada} onCerrar={() => setFichaAbierta(false)} />}
    </>
  )
}

/** Una idea de «Tu tiempo en…»: foto pequeña (si hay; si no, el color de la tarjeta), nombre, una línea y [Cómo llegar]. */
function FilaDeIdea({ idea, foto }: { idea: { nombre: string; sub?: string; buscar: string }; foto?: string | null }) {
  const enlace = enlaceComoLlegarAlojamiento(idea.buscar)
  return (
    <div data-hoy-idea-excursion className="flex items-center gap-3 rounded-[16px] py-2 pl-2 pr-2" style={{ background: '#FBF3E2', border: '1px solid rgba(181,138,46,.4)' }}>
      <span aria-hidden="true" className="relative h-11 w-11 flex-none overflow-hidden rounded-[12px]" style={{ background: 'linear-gradient(160deg,#BFE0D8,#5E9FB0)' }}>
        {foto && <ImagenConFundido src={foto} fondo="#5E9FB0" loading="lazy" alt="" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span data-hoy-idea-nombre className="text-[14.5px] font-bold leading-[1.2]" style={{ color: TINTA }}>{idea.nombre}</span>
        {idea.sub && <span className="text-[12px]" style={{ color: 'rgba(28,34,48,.6)' }}>{idea.sub}</span>}
      </span>
      {enlace && (
        <a href={enlace} target="_blank" rel="noopener noreferrer" data-hoy-idea-como-llegar className="flex h-9 flex-none items-center whitespace-nowrap rounded-xl px-3 text-[12.5px] font-bold no-underline" style={BOTON_ORO}>
          Cómo llegar
        </a>
      )}
    </div>
  )
}

const dateIsoDe = (route: Route, day: DayPlan, dateIso: string): string => dateIso || route.answers.dateRange?.start || String(day.id)

export interface PropsExcursionHoy {
  route: Route
  day: DayPlan
  dateIso: string
  /** El GPS en crudo (la excursión lo mira para saber si ya estás en la isla, en la ciudad…). */
  ubicacion: Coordinates | null
  ahoraMin: number
  enCoche: boolean
  /** Desde dónde se cuentan los minutos de «al volver»: el GPS útil o el alojamiento. */
  desde: Coordinates | null
  /** (V80, apartado 4) El enlace «¿Se ha cancelado la excursión?», al final de la tarjeta. */
  pieDeTarjeta?: ReactNode
  datos: { hoy: DatosHoyDeExcursion | null; dia: DiaEscritoDeExcursion | null }
}

export function ExcursionHoy({ route, day, dateIso: dateIsoIn, ubicacion, ahoraMin, enCoche, desde, pieDeTarjeta, datos }: PropsExcursionHoy) {
  const dateIso = dateIsoDe(route, day, dateIsoIn)
  const reservations = useRouteStore((s) => s.reservations)
  const base = viewedExcursion(day) ?? excursionDeUnDia(day)
  const [excursion] = useExcursionesCompletas(base ? [base] : [])
  const reservation = excursionReservationOf(route, reservations, day)
  const unidas = excursion ? unidasAUnaExcursion(reservations, excursion.id) : []
  const { hoy, dia } = datos
  const traslados = trasladosDelDia(dia)
  const modo = modoDeLaExcursion({ reserva: reservation, unidas, habitual: hoy?.modo_habitual ?? null, diaConTraslados: Boolean(traslados.coche || traslados.barco) })
  const nombre = hoy?.nombre ?? (excursion ? nombreDeLaExcursion(excursion) : null) ?? day.curatedTitle?.replace(/\s*\(.*$/, '') ?? `Excursión desde ${day.city}`
  const foto = excursion?.photoUrlBig ?? excursion?.photoUrl ?? null
  const ojo = `${formatWeekdayAbbrEs(dateIso).toUpperCase()} ${Number(dateIso.slice(8, 10))}`
  const [guardado, poner] = useGuardado(route.id, dateIso)
  const consejos = useConsejos(route.destination, [day.diaEscritoId, excursion?.id], [day.curatedTitle, excursion?.title])
  const [consejosCerrados, setConsejosCerrados] = useState(() => yaDicho(route.id, dateIso, 'consejos-excursion'))
  const cerrarConsejos = () => {
    marcarDicho(route.id, dateIso, 'consejos-excursion')
    setConsejosCerrados(true)
  }
  const bloqueConsejos = consejos.length > 0 && !consejosCerrados ? <BloqueDeConsejos consejos={consejos} cuando="la excursión" tono="claro" onCerrar={cerrarConsejos} /> : null

  if (modo === 'organizada') {
    return <ExcursionOrganizada {...{ route, day, dateIso, ojo, nombre, foto, excursion, reservation, bloqueConsejos, guardado, poner, pieDeTarjeta, desde, enCoche, ahoraMin }} />
  }
  return <ExcursionPorTuCuenta {...{ route, day, dateIso, ojo, nombre, foto, excursion, unidas, hoy, dia, bloqueConsejos, guardado, poner, pieDeTarjeta, desde, enCoche, ahoraMin, ubicacion }} />
}

/* ═══════════════════════════ POR TU CUENTA ═══════════════════════════ */
type ExcursionDelDia = ReturnType<typeof viewedExcursion>
function ExcursionPorTuCuenta({ route, day, dateIso, ojo, nombre, foto, excursion, unidas, hoy, dia, bloqueConsejos, guardado, poner, pieDeTarjeta, desde, enCoche, ahoraMin, ubicacion }: { route: Route; day: DayPlan; dateIso: string; ojo: string; nombre: string; foto: string | null; excursion: ExcursionDelDia; unidas: ReservaExtra[]; hoy: DatosHoyDeExcursion | null; dia: DiaEscritoDeExcursion | null; bloqueConsejos: ReactNode; guardado: Guardado; poner: (p: Partial<Guardado>) => void; pieDeTarjeta?: ReactNode; desde: Coordinates | null; enCoche: boolean; ahoraMin: number; ubicacion: Coordinates | null }) {
  const medio: MedioDeExcursion = hoy?.medio ?? (unidas[0]?.kind === 'tren' ? 'tren' : unidas[0]?.kind === 'bus' ? 'autobus' : 'barco')
  const gps = gpsEnElDestino(ubicacion, hoy?.destino)
  const salidaPunto = hoy?.puerto ?? (day.coche?.ida?.destino ? { nombre: day.coche.ida.destino.nombre, lat: day.coche.ida.destino.lat, lng: day.coche.ida.destino.lng } : null)
  const gpsEnSalida = Boolean(ubicacion && salidaPunto && haversineMeters(ubicacion, salidaPunto) <= 1500)
  useEffect(() => {
    if (gps === 'destino' && !guardado.estuvo) poner({ estuvo: true })
  }, [gps]) // eslint-disable-line react-hooks/exhaustive-deps
  const entrada = { nombre, medio, dia, coche: day.coche ?? null, unidas, dateIso, ahoraMin, gps, gpsEnSalida, estado: guardado as EstadoDeExcursion }
  const r = pasosDeLaExcursion(entrada)
  const cajas = cajasPorTuCuenta(entrada, r)
  const aviso = avisoDelUltimo({ ultimaMin: r.ultimaMin, ahoraMin, idaHecha: r.idaHecha, vueltaHecha: r.vueltaHecha })
  const [horaAbierta, setHoraAbierta] = useState(false)
  const [abierto, setAbierto] = useState(false)
  const nombreMedio = medio === 'barco' ? 'barco' : medio === 'tren' ? 'tren' : 'autobús'
  const billetes = useBilletesDeExcursiones()
  const filas = filasDeBilletes(unidas, (x) => Boolean(excursionConCodigo(billetes.de(x.id))) && Boolean(billetes.de(x.id)?.codigo))
  // La línea de debajo de cada billete: «Falta tu billete» si no hay código; con él, la compañía.
  const subDe = (i: number): string => (filas[i]?.sub === 'Falta tu billete' ? 'Falta tu billete' : (unidas[i]?.compania ?? filas[i]?.sub ?? ''))
  const virtual = (esVuelta: boolean): ReservaExtra =>
    ({ id: `virtual:${excursion?.id ?? day.id}:${esVuelta ? 'vuelta' : 'ida'}`, kind: medio === 'tren' ? 'tren' : medio === 'autobus' ? 'bus' : 'ferry', refId: 'virtual', name: nombre, placeNames: [], dateIso, dayNumber: null, time: (esVuelta ? r.ultima : r.horaIda) ?? '', unidaA: excursion?.id ?? day.id, origen: null }) as unknown as ReservaExtra
  const aReservas = () => {
    useRouteStore.getState().setMode('bookings')
    useReservasFocusStore.getState().pedir((unidas.length > 0 || excursion ? 'excursiones' : `extra-${medio === 'tren' ? 'tren' : medio === 'autobus' ? 'bus' : 'ferry'}`) as BloqueReservasId)
  }
  const cambiarHora = (h: string | null) => {
    if (!h) return
    const ida = unidas[0]
    if (ida) useRouteStore.setState((s) => ({ reservations: s.reservations.map((x: Reservation) => (x.id === ida.id ? { ...x, time: h } : x)) }))
    else poner({ horaIda: h, embarcado: false })
    setHoraAbierta(false)
  }
  const enlacePuerto = salidaPunto ? `https://www.google.com/maps/dir/?${new URLSearchParams({ api: '1', destination: `${salidaPunto.lat},${salidaPunto.lng}`, travelmode: enCoche ? 'driving' : 'transit', ...(ubicacion ? { origin: `${ubicacion.lat},${ubicacion.lng}` } : {}) }).toString()}` : null
  const buscarVuelta = hoy?.puerto_de_vuelta?.buscar ?? (unidas[1]?.origen ? `${medio === 'tren' ? 'Estación ' : ''}${unidas[1].origen}` : unidas[0]?.destinoDeViaje ? `${medio === 'tren' ? 'Estación ' : ''}${unidas[0].destinoDeViaje}` : null)
  const enlaceSalida = unidas[0]?.origen ? enlaceComoLlegarAlojamiento([unidas[0].origen, route.destination].join(', ')) : null
  const enlaceVuelta = buscarVuelta ? enlaceComoLlegarAlojamiento(buscarVuelta) : null
  const puntoDeVuelta = medio === 'barco' ? 'al puerto' : medio === 'tren' ? 'a la estación' : 'a la parada'
  const faltaDelMedio = medio === 'barco' ? 'ferry' : medio === 'tren' ? 'tren' : 'autobús'
  const hechos = r.pasos.filter((p) => p.hecho).length
  const centro = hoy?.destino ? { lat: hoy.destino.lat, lng: hoy.destino.lng } : null

  return (
    <div data-hoy-excursion="por-tu-cuenta" className="flex flex-col gap-3">
      <ZonaDeAvisos>
        {aviso && (
          <AvisoDeHoy id="ultimo-transporte" prio={1}>
            <FilaDeAviso
              tono="rojo"
              icono={D_AVISO.reloj}
              titulo={r.ultimaEsBillete ? `${segunGrupo('Vuestro', 'Tu')} ${nombreMedio} de vuelta sale a las ${horaSinCero(r.ultima ?? '')}` : `El último ${nombreMedio} sale a las ${horaSinCero(r.ultima ?? '')}`}
              sub={aviso.quedan > 0 ? `${segunGrupo('Os quedan', 'Te quedan')} ${aviso.quedan} min` : 'Ya es la hora'}
              boton={enlaceVuelta ? { texto: `Cómo llegar ${puntoDeVuelta}`, onClick: () => window.open(enlaceVuelta, '_blank', 'noopener'), datos: { 'data-hoy-ultimo-como-llegar': '1' } } : undefined}
              datos={{ 'data-hoy-aviso-ultimo': '1' }}
            />
          </AvisoDeHoy>
        )}
      </ZonaDeAvisos>
      <div data-hoy-excursion-transporte={excursion?.id ?? day.id} data-tarjeta="clara" className="flex-none overflow-hidden rounded-[28px]" style={TARJETA_PARADA}>
        <CabeceraDeTrayecto etiqueta={`EXCURSIÓN · ${ojo}`} titulo={nombre} foto={foto} />
        <div className="flex flex-col gap-3 px-3.5 pb-4 pt-3.5">
          {cajas.length > 0 && (
            <div data-hoy-cajas className="grid gap-2" style={columnas(cajas.length)}>
              {cajas.map((c: CajaDeExcursion) => (
                <CajaDeParada key={c.dato} dato={c.dato} icono={c.dato === 'salida' ? (day.coche?.activo ? 'coche' : 'tren') : c.dato === 'transporte' ? (medio === 'tren' ? 'tren' : medio === 'autobus' ? 'bus' : 'barco') : 'reloj'} etiqueta={c.etiqueta} grande={c.grande} sub={c.sub} />
              ))}
            </div>
          )}
          {bloqueConsejos}
          {pieDeTarjeta}
        </div>
      </div>

      {r.pasos.map((p) => (
        <TarjetaDePaso key={p.tipo} paso={p} medio={medio}>
          {p.tipo === 'salida' && p.ahora && (
            <div className="flex gap-[9px]">
              {enlacePuerto ? <BotonLink href={enlacePuerto} datos="data-hoy-excursion-como-llegar">Cómo llegar</BotonLink> : null}
              <button type="button" onClick={() => poner({ llegado: true })} data-hoy-ya-he-llegado-salida className="flex h-[52px] flex-1 items-center justify-center whitespace-nowrap rounded-2xl text-[14.5px] font-bold" style={{ background: '#FFFDF8', border: '1px solid rgba(28,34,48,.18)', color: TINTA }}>
                Ya he llegado
              </button>
            </div>
          )}
          {p.tipo === 'ida' && (
            <>
              {unidas[0] ? (
                <FilaDeBilleteHoy reserva={unidas[0]} titulo={filas[0].titulo} sub={subDe(0)} />
              ) : p.ahora ? (
                <div data-hoy-sin-billete className="flex flex-col gap-2.5 rounded-[18px] p-3" style={{ border: '1.5px dashed rgba(181,138,46,.6)', background: '#FFFDF8' }}>
                  <span className="text-[14px] font-bold" style={{ color: TINTA }}>{segunGrupo('Aún no tenéis', 'Aún no tienes')} el billete del {faltaDelMedio}</span>
                  <button type="button" onClick={aReservas} data-hoy-anadir-billete className="flex h-[46px] items-center justify-center gap-2 rounded-2xl text-[14.5px] font-bold" style={BOTON_ORO}>
                    <Icono nombre="anadir" size={16} grosor={2.2} />
                    Añadir tu reserva
                  </button>
                </div>
              ) : !p.hecho ? (
                <span data-hoy-sin-billete className="text-[13px]" style={{ color: 'rgba(28,34,48,.55)' }}>{segunGrupo('Aún no tenéis', 'Aún no tienes')} el billete del {faltaDelMedio}</span>
              ) : null}
              {p.ahora && (
                <div className="flex gap-[9px]">
                  {/* Sin paso de «coche hasta…» antes: el camino hasta el punto de salida (el puerto, la estación) del billete, como la tarjeta de la V76. */}
                  {r.pasos[0].tipo === 'ida' && enlaceSalida && <BotonLink href={enlaceSalida} datos="data-hoy-excursion-como-llegar">Cómo llegar</BotonLink>}
                  <button type="button" onClick={() => poner({ embarcado: true })} data-hoy-he-embarcado className="flex h-[50px] min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl text-[14.5px] font-bold" style={BOTON_VERDE}>
                    <Icono nombre="hecho" size={17} grosor={2.4} />
                    He embarcado
                  </button>
                </div>
              )}
              {p.hecho && r.idaPorLaHora && (
                <span data-hoy-no-lo-cogiste className="text-[13px]" style={{ color: 'rgba(28,34,48,.6)' }}>
                  {segunGrupo('¿No habéis cogido', '¿No has cogido')} este {nombreMedio}?{' '}
                  <button type="button" onClick={() => setHoraAbierta(true)} data-hoy-cambiar-hora className="inline-flex min-h-11 items-center font-bold underline underline-offset-[3px]" style={{ color: ORO_TEXTO }}>
                    Cambiar la hora
                  </button>
                </span>
              )}
            </>
          )}
          {p.tipo === 'tiempo' && !p.hecho && (
            <>
              {(hoy?.ideas ?? []).length > 0 && (
                <div className="flex flex-col gap-2">
                  {(hoy?.ideas ?? []).slice(0, 3).map((i) => (
                    <FilaDeIdea key={i.nombre} idea={i} />
                  ))}
                </div>
              )}
              {hoy?.comer && <span data-hoy-comer className="text-[13.5px] leading-[1.35]" style={{ color: 'rgba(28,34,48,.7)' }}>{hoy.comer}</span>}
              {dia?.en_la_isla && (
                <span data-hoy-nota-isla className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium" style={{ background: '#F1EAD8', color: 'rgba(28,34,48,.75)' }}>
                  <Icono nombre="alerta" size={15} grosor={1.8} style={{ flex: "none" }} />
                  {dia.en_la_isla}
                </span>
              )}
              <ContenidoDelSitio route={route} day={day} dateIso={dateIso} nombre={nombre} coords={centro} id={excursion?.id ?? day.id} conPedazos={false} />
            </>
          )}
          {p.tipo === 'vuelta' && !p.hecho && !unidas[1] && !r.ultima && (
            <span data-hoy-sin-billete-vuelta className="text-[13px]" style={{ color: 'rgba(28,34,48,.55)' }}>{segunGrupo('Aún no tenéis', 'Aún no tienes')} el billete de vuelta</span>
          )}
          {p.tipo === 'vuelta' && (p.ahora || (r.ultima && !p.hecho)) && (
            <>
              <FilaDeBilleteHoy reserva={unidas[1] ?? virtual(true)} titulo={unidas[1] ? filas[1]?.titulo ?? p.titulo : `${medio === 'barco' ? 'Ferry' : medio === 'tren' ? 'Tren' : 'Autobús'} de vuelta · ${horaSinCero(r.ultima ?? '')}`} sub={unidas[1] ? subDe(1) : 'Falta tu billete'} />
              {p.ahora && (
                <div className="flex gap-[9px]">
                  {enlaceVuelta && <BotonLink href={enlaceVuelta} datos="data-hoy-vuelta-como-llegar" flex={1.3} conIcono={false}>Cómo llegar {puntoDeVuelta}</BotonLink>}
                  <button type="button" onClick={() => poner({ vuelto: true })} data-hoy-he-embarcado-vuelta className="flex h-[52px] min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl px-2 text-[14px] font-bold" style={BOTON_VERDE}>
                    <Icono nombre="hecho" size={17} grosor={2.4} />
                    He embarcado
                  </button>
                </div>
              )}
            </>
          )}
        </TarjetaDePaso>
      ))}

      {r.vueltaHecha && <IdeasYPendientesHoy route={route} day={day} dateIso={dateIso} desde={desde} enCoche={enCoche} ahoraMin={ahoraMin} />}

      <div data-hoy-excursion-resumen className="flex-none rounded-[18px] px-3.5 py-3" style={TARJETA_DE_PASO}>
        <button type="button" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto} className="flex min-h-11 w-full items-center justify-between text-left text-[14px] font-semibold" style={{ color: TINTA }}>
          <span data-hoy-excursion-cuenta>
            Tu día · {hechos} de {r.pasos.length}
          </span>
          <span className="flex items-center gap-1 text-[13.5px] font-bold" style={{ color: ORO_TEXTO }}>
            {abierto ? 'ocultar' : 'ver todo'}
            <Icono nombre={abierto ? 'arriba' : 'abajo'} size={14} grosor={2} />
          </span>
        </button>
        {abierto && (
          <ul className="mt-1 flex flex-col gap-1.5 pb-1">
            {r.pasos.map((p) => (
              <li key={p.tipo} className="flex items-baseline gap-2 text-[13.5px]" style={{ color: p.hecho ? 'rgba(28,34,48,.5)' : TINTA }}>
                <span className="w-4 flex-none">{p.hecho ? '✓' : ''}</span>
                {p.titulo}
              </li>
            ))}
          </ul>
        )}
      </div>
      {horaAbierta && <HojaDeHora titulo={`¿A qué hora sale tu ${nombreMedio}?`} valor={r.horaIda} quitable={false} onElegir={cambiarHora} onCerrar={() => setHoraAbierta(false)} />}
    </div>
  )
}

/* ═══════════════════════════ ORGANIZADA ═══════════════════════════ */
function ExcursionOrganizada({ route, day, dateIso, ojo, nombre, foto, excursion, reservation, bloqueConsejos, guardado, poner, pieDeTarjeta, desde, enCoche, ahoraMin }: { route: Route; day: DayPlan; dateIso: string; ojo: string; nombre: string; foto: string | null; excursion: ExcursionDelDia; reservation: Reservation | null; bloqueConsejos: ReactNode; guardado: Guardado; poner: (p: Partial<Guardado>) => void; pieDeTarjeta?: ReactNode; desde: Coordinates | null; enCoche: boolean; ahoraMin: number }) {
  const duracion = excursion?.durationText ?? (excursion?.durationHours ? `${excursion.durationHours} h` : null)
  const cajas = cajasOrganizada({
    recogida: excursion?.recogida,
    meetingPoint: reservation?.meetingPoint ?? excursion?.meetingPoint,
    horaDeRecogida: reservation?.time ?? null,
    duracion,
    incluye: excursion?.incluye,
    descripcion: excursion?.description,
    conGuia: /con gu[ií]a|gu[ií]a/i.test(`${excursion?.incluye ?? ''} ${excursion?.description ?? ''}`),
  })
  const coords = excursion?.destinationCoords ?? null
  const nombreDelSitio = excursion?.page?.nameDestination ?? nombre
  const titulo = excursion?.page?.nameDestination ?? nombre
  const iconoDe = { recogida: 'ubicacion', duracion: 'reloj', transporte: 'bus' } as const
  const tripId = useSyncStore((s) => s.activeTripId)
  const pase = usePaseEstado(tripId)
  // Sin el pase, el código no se enseña (como «Tu excursión» de siempre). El billete de una excursión se guarda con la clave de la excursión (refId).
  const reservaComoFila = reservation && (!pase.cobro || pase.conPase) ? ({ ...reservation, id: reservation.refId, kind: 'otra', unidaA: reservation.refId }) as unknown as ReservaExtra : null
  return (
    <div data-hoy-excursion="organizada" className="flex flex-col gap-3">
      <div data-hoy-excursion-organizada={excursion?.id ?? day.id} data-tarjeta="clara" className="flex-none overflow-hidden rounded-[28px]" style={TARJETA_PARADA}>
        <CabeceraDeTrayecto etiqueta={`EXCURSIÓN · ${ojo}`} titulo={titulo} foto={foto} />
        <div className="flex flex-col gap-3 px-3.5 pb-4 pt-3.5">
          {cajas.length > 0 && (
            <div data-hoy-cajas className="grid gap-2" style={columnas(cajas.length)}>
              {cajas.map((c) => (
                <CajaDeParada key={c.dato} dato={c.dato} icono={iconoDe[c.dato]} etiqueta={c.etiqueta} grande={c.grande} sub={c.sub} />
              ))}
            </div>
          )}
          {reservaComoFila && reservation && <FilaDeBilleteHoy reserva={reservaComoFila} titulo={reservation.name} sub={reservation.locator ? `Reserva ${reservation.locator}` : ''} />}
          {bloqueConsejos}
          <ContenidoDelSitio route={route} day={day} dateIso={dateIso} nombre={nombreDelSitio} coords={coords} id={excursion?.id ?? day.id} conPedazos />
          {guardado.terminada ? (
            <span data-hoy-excursion-hecha className="flex h-[50px] items-center justify-center gap-2 rounded-2xl text-[14.5px] font-bold" style={{ background: '#E6F1E7', color: '#1F5A33' }}>
              <Icono nombre="hecho" size={17} grosor={2.4} />
              Excursión hecha
            </span>
          ) : (
            <button type="button" onClick={() => poner({ terminada: true })} data-boton-visto data-hoy-he-terminado className="flex h-[50px] items-center justify-center gap-2 rounded-2xl text-[14.5px] font-bold" style={BOTON_VERDE}>
              <Icono nombre="hecho" size={17} grosor={2.4} />
              He terminado
            </button>
          )}
          {pieDeTarjeta}
        </div>
      </div>
      {guardado.terminada && <IdeasYPendientesHoy route={route} day={day} dateIso={dateIso} desde={desde} enCoche={enCoche} ahoraMin={ahoraMin} />}
    </div>
  )
}
