import { useEffect, useState } from 'react'
import { logrosActivos } from '../../../../lib/logros'
import type { Coordinates, DayPlan, Route, Stop } from '../../../../lib/types'
import { useRouteStore } from '../../../../store/useRouteStore'
import { useDestinationExcursions } from '../../../../lib/destinationExcursions'
import { dayOfReservation } from '../../../../lib/bookings'
import { addDaysToIso, formatWeekdayAbbrEs } from '../../../../lib/dateRange'
import { esDiaDeLlegada, nombreDelDia, tituloSinHorasSiYaNoEsVerdad, viajeDelDia } from '../../../../lib/tituloDelDia'
import { numberedStopsOf } from '../../../../lib/stopKind'
import { displayStopName } from '../../../../lib/format'
import { hasRealCoordinates } from '../../../../lib/distanceMock'
import { parseTimeToMinutes } from '../../../../lib/time'
import { pagoActivo } from '../../../../lib/pago'
import { buildGoogleMapsUrlToPlaceTransit } from '../../../../lib/mapsLinks'
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
import { useHistoriaDePrueba } from '../../../../lib/historiaDePrueba'
import { atardecerDelDestino, fraseDeAtardecer, tocaLoDeManana } from '../../../../lib/puestaDeSolYManana'
import { useGastarHistoriaAl3s } from '../../../../lib/useGastarHistoria'
import { useExploreAperturaStore } from '../../../../store/useExploreAperturaStore'
import type { EstadoPase } from '../../../../lib/paseEstado'
import { Icono } from '../../../ui/Icono'
import { BotonFoto } from '../../fotos/BotonFoto'
import { TusFotosDeHoy } from '../../fotos/TusFotosDeHoy'
import { RainAlert } from '../../today/RainAlert'
import { TodayExcursion } from '../../today/TodayExcursion'
import { BilleteDeVuelo } from '../../dayDetail/BilleteDeVuelo'
import { TarjetaLlegadaDias } from '../../dayDetail/TarjetaLlegadaDias'
import { BotonAlojamientoHoy, useFichasDeHoy, type MitadDeHoy } from '../llegadaVuelta'
import { anadirMasVisita, useMasVisitas } from '../masVisitas'
import type { MasVisita } from '../../../../lib/masVisitas'
import { AZUL, VERDE } from '../piezas'
import { CabeceraHoy } from './HoyAntesV2'
import { HojaMasParaTuDia, HojaSobreEsteLugar } from './HojasV2'
import { TarjetaDiaDePrueba, TarjetaP3 } from './TarjetasPase'
import { AvisoSaltada, CabeceraParada, LineaDelLogro, TarjetaParada, TarjetaPorLaManana, TuDia, ojoDeParada, useAhoraMin, useUltimaSuma } from './ParadaHoy'
import { HoyVuelvesH14 } from './VueltaH14'
import { useUbicacionHoy } from './useUbicacionHoy'
import { cuentaDelDia, mananaH13, minutosDe, salidaDeCasa, urlComoLlegar } from '../../../../lib/hoyParada'
import { esDestinoDeCoche } from '../../../../lib/experienceCategoryBank'
import { abrirAvisoPase } from '../../../../lib/avisoPase'
import { nombreDelPase } from '../../../../lib/nombrePase'
import { Marca } from '../../../pase/Marca'
import { CandadoRedondo } from '../../../pase/Candado'
import { filaDeHoySinPase } from '../../../../lib/diaDePrueba'
import { useSyncStore } from '../../../../store/useSyncStore'
import { FranjaDiaDePrueba, TarjetaDeLaPrueba } from '../TarjetaDeLaPrueba'
import { AvisosDeCerca } from '../AvisosDeCerca'
import { AvisosDelTiempo } from '../AvisosDelTiempo'
import { SinConexionHoy } from '../SinConexionHoy'
import { CercaDeTiFila } from '../CercaDeTiFila'

const OJO = { font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' as const, color: 'rgb(var(--text) / .55)' }

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
    <span className="text-[12px] leading-[1.3]" style={{ color: horario.cerrado ? '#FFC2BA' : 'rgba(251,243,226,.7)' }}>
      {horario.texto}
    </span>
  )
}

/** [Escuchar historia]: el botón largo con las ondas (solo en los sitios con historia; la historia es de pago salvo la que la ficha marca gratis). */
export function EscucharHistoria({ destino, parada, variante = 'boton' }: { destino: string; parada: Stop; /** HOY1: «boton» (el largo de siempre), «linea» (H1: «¿Te cuento la historia mientras llegas? [Escuchar]») o «pastilla» (H3). */ variante?: 'boton' | 'linea' | 'pastilla' }) {
  const ficha = useFichaDeSitio(destino, parada.name)
  const audio = useAudioDeHistoria({ destino, nombre: parada.name })
  const texto = textoHistoria(ficha)
  const { hayVoz, estado, escuchar, pausar, seguir, parar } = useEscuchar(texto, `${parada.id}:historia`, audio)
  const pidioPase = false // (Tanda 10N6 §1g) el aviso del pase ya lo explica; la línea cambiante «Incluido con…» ya no se usa.
  // Tanda 10P: la historia de prueba del destino es la que el viajero elija (una por destino, guardada en la cuenta); el día de prueba de HOY no la gasta (allí `pagoActivo()` es verdadero).
  useHistoriaDePrueba((s) => s.mapa)
  const acceso = accesoHistoria(ficha, pagoActivo(), { destino, nombre: parada.name })
  useGastarHistoriaAl3s(destino, parada.name, estado, acceso === 'prueba')
  if (acceso === 'ninguno' || texto.trim().length === 0) return null
  if (variante !== 'boton') return <EscucharCompacta variante={variante} candado={acceso === 'candado'} destino={destino} estado={estado} hayVoz={hayVoz} escuchar={escuchar} pausar={pausar} seguir={seguir} parar={parar} />
  // (Tanda 10H: sin el pase, el MISMO botón, con el candado dorado en el extremo derecho, dentro, sobre marfil; al tocarlo, «Incluido con el Pase Roma» y se abre el pase.)
  if (acceso === 'candado') {
    return (
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => abrirAvisoPase('escuchar_historia', { destino })} data-escuchar="candado" className="flex h-[50px] min-w-0 flex-1 items-center justify-center gap-3 rounded-full pl-2 pr-2" style={{ background: 'rgba(166,124,82,.1)' }}>
          <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full" style={{ background: 'rgb(var(--accent))' }}>
            <Icono nombre="seguir" size={13} relleno grosor={1.6} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
            <span className="whitespace-nowrap text-[13.5px] font-semibold">Escuchar historia</span>
            {pidioPase ? (
              <span data-escuchar-incluido className="text-[11px] font-medium">
                Incluido con el <Marca>{nombreDelPase(destino)}</Marca>
              </span>
            ) : (
              <span data-escuchar-todas className="text-[11px] font-medium text-[#1C2230]/65">
                Todas las historias, con el <Marca>{nombreDelPase(destino)}</Marca>
              </span>
            )}
          </span>
          <span data-candado-dentro className="flex flex-none">
            <CandadoRedondo diametro={30} datos="escuchar" />
          </span>
        </button>
      </div>
    )
  }
  if (!hayVoz) return null
  const alPulsar = estado === 'parado' ? escuchar : estado === 'hablando' ? pausar : seguir
  const onda = ['8px', '14px', '10px', '16px', '7px', '12px', '15px', '9px', '13px', '6px']
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={alPulsar} data-escuchar={estado} className="flex h-[50px] min-w-0 flex-1 items-center justify-center gap-3 rounded-full pl-2 pr-3.5" style={{ background: 'rgba(166,124,82,.1)'}}>
        <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full" style={{ background: 'rgb(var(--accent))' }}>
          <Icono nombre={estado === 'hablando' ? 'pausa' : 'seguir'} size={13} relleno grosor={1.6} />
        </span>
        {acceso === 'prueba' && estado === 'parado' ? (
          <span className="flex flex-col items-start gap-0.5 text-left">
            <span className="whitespace-nowrap text-[13.5px] font-semibold">Escuchar historia</span>
            <span data-escuchar-prueba className="whitespace-nowrap text-[11px] font-medium text-[#1C2230]/65">
              <Marca>Gratis</Marca>, tu historia de prueba · 0/1
            </span>
          </span>
        ) : (
          <span className="whitespace-nowrap text-[13.5px] font-semibold">{estado === 'parado' ? 'Escuchar historia' : estado === 'hablando' ? 'Pausar' : 'Seguir escuchando'}</span>
        )}
        <span className="flex h-6 items-center gap-[3px]" style={{ opacity: estado === 'hablando' ? 1 : 0.6 }} aria-hidden="true">
          {[...onda, ...onda].map((h, i) => (
            <span key={i} style={{ width: 2.5, height: h, borderRadius: 2, background: 'linear-gradient(180deg,#D8B98E,#6F4E37)', opacity: i >= 10 ? 0.7 : 1 }} />
          ))}
        </span>
      </button>
      {estado !== 'parado' && (
        <button type="button" onClick={parar} aria-label="Parar" className="flex h-[50px] w-[50px] flex-none items-center justify-center rounded-full" style={{ background: 'rgba(166,124,82,.1)'}}>
          <Icono nombre="cerrar" size={14} />
        </button>
      )}
    </div>
  )
}

/** HOY1 (H1 y H3): las dos formas pequeñas de [Escuchar historia] sobre la tarjeta oscura. Mismo estado y mismas reglas que el botón largo. */
function EscucharCompacta({ variante, candado, destino, estado, hayVoz, escuchar, pausar, seguir, parar }: { variante: 'linea' | 'pastilla'; candado: boolean; destino: string; estado: string; hayVoz: boolean; escuchar: () => void; pausar: () => void; seguir: () => void; parar: () => void }) {
  if (!candado && !hayVoz) return null
  const alPulsar = candado ? () => abrirAvisoPase('escuchar_historia', { destino }) : estado === 'parado' ? escuchar : estado === 'hablando' ? pausar : seguir
  const etiqueta = estado === 'parado' ? 'Escuchar historia' : estado === 'hablando' ? 'Pausar' : 'Seguir'
  if (variante === 'linea') {
    return (
      <div data-hoy-escuchar-linea data-escuchar={candado ? 'candado' : estado} className="flex items-center gap-2 text-[13px] leading-[1.3]" style={{ color: 'rgba(251,243,226,.85)' }}>
        <span className="flex-1">¿Te cuento la historia mientras llegas?</span>
        <button type="button" onClick={alPulsar} className="flex h-11 flex-none items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold" style={{ background: 'rgba(243,216,143,.16)', border: '1px solid rgba(243,216,143,.4)', color: '#F3D88F' }}>
          <Icono nombre={estado === 'hablando' ? 'pausa' : candado ? 'candado' : 'seguir'} size={13} grosor={1.8} />
          {etiqueta}
        </button>
        {estado !== 'parado' && !candado && (
          <button type="button" onClick={parar} aria-label="Parar" className="flex h-11 w-11 flex-none items-center justify-center rounded-full" style={{ color: '#F3D88F' }}>
            <Icono nombre="cerrar" size={14} />
          </button>
        )}
      </div>
    )
  }
  return (
    <button type="button" onClick={alPulsar} data-hoy-pastilla="escuchar" data-escuchar={candado ? 'candado' : estado} className="flex min-h-[50px] items-center gap-[9px] rounded-2xl px-2.5 py-2 text-left" style={{ background: 'rgba(251,243,226,.08)', border: '1px solid rgba(243,216,143,.38)', color: '#FBF3E2', font: "600 12.5px/1.2 'Geist'" }}>
      <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)', color: '#4A3510' }}>
        <Icono nombre={estado === 'hablando' ? 'pausa' : candado ? 'candado' : 'altavoz'} size={16} grosor={1.9} />
      </span>
      {estado === 'parado' ? 'Escuchar historia' : estado === 'hablando' ? 'Pausar' : 'Seguir escuchando'}
    </button>
  )
}


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
  const [hojaMas, setHojaMas] = useState<MasVisita[] | null>(null)
  const [anadidas, setAnadidas] = useState<Set<string>>(new Set())
  const [hojaSobre, setHojaSobre] = useState<Stop | null>(null)
  const { ubicacion, estado: ubicacionEstado, pedir: pedirUbicacion } = useUbicacionHoy()
  const enCoche = esDestinoDeCoche(route.destination)
  const [avisoSaltada, setAvisoSaltada] = useState<{ stopId: string } | null>(null)
  const [ultimoVisto, setUltimoVisto] = useState<Stop | null>(null)
  const sumaDelVisto = useUltimaSuma(ultimoVisto?.id ?? null)
  const ahoraMinHoy = useAhoraMin()
  const [ofrecerFoto, setOfrecerFoto] = useState<Stop | null>(null)

  useEffect(() => {
    if (!avisoSaltada) return
    const id = window.setTimeout(() => setAvisoSaltada(null), 10000)
    return () => window.clearTimeout(id)
  }, [avisoSaltada])

  const explorar = (categoria: 'banos' | 'fuentes' | 'restaurantes' | 'atracciones', origen: Coordinates | null, cerca = false) => {
    pedirExplorar({ categoria, origen, cerca })
    setMode('explore')
  }

  const tituloDeHoy = nombreDelDia(route, day, info.gruposDia)
  const paradas = numberedStopsOf(day)
  const vigentes = paradas.filter((s) => !s.saltada)
  const vistas = vigentes.filter((s) => s.checkedInAt).length
  const siguiente = vigentes.find((s) => !s.checkedInAt) ?? null
  // (HOY1) La parada de antes es la última que no se ha saltado: de una saltada no se sale.
  const anterior = siguiente ? paradas.slice(0, paradas.indexOf(siguiente)).reverse().find((s) => !s.saltada) : undefined
  const entradasDeHoy = reservations.filter((r) => dayOfReservation(route, r)?.id === day.id && r.kind === 'entrada' && !r.fueraDeRuta)
  const reservaDe = (stop: Stop) => reservations.find((r) => r.id === stop.reservedId) ?? entradasDeHoy.find((r) => r.placeNames.includes(stop.name)) ?? null
  const esLlegada = esDiaDeLlegada(route, day)
  const esVuelta = Boolean(day.isReturnLeg)
  const sinParadasDeVuelta = esVuelta && paradas.length === 0
  const tarjetaVuelve = tarjetaHoyVuelvesDelDia(route, day)
  const diaCompleto = esDiaCompleto(route, day, reservations)
  const [cerrados, setCerrados] = useState<string[]>(() => leerCerrados(route.id, day.id))
  const cierres = avisosDeCierre(vigentes.filter((s) => !s.closedThisDay), horarioDe, (s) => displayStopName(s.name)).filter((a) => !cerrados.includes(a.id))
  const cerrarAviso = (id: string) => setCerrados((antes) => { const ahora = [...antes, id]; guardarCerrados(route.id, day.id, ahora); return ahora })

  const origenCerca = ubicacion ?? (siguiente && hasRealCoordinates(siguiente.coordinates) ? siguiente.coordinates : null)

  // Tanda 10P (1.3): la puesta de sol y lo de mañana (con el pase y en el día de prueba; sin pase, como antes).
  const conPaseOPrueba = pagoActivo()
  const zonaCoordsAtardecer = (route.accommodationZone ? info.zonasAlojamiento.find((z) => z.id === route.accommodationZone)?.coordinates : null) ?? null
  // (LG1) Lanzarote: la hora del sol sale de la fecha y la parada del atardecer es El Golfo, Famara…; ver `atardecerDelDestino`.
  const solDelDestino = atardecerDelDestino(route.destination, dateIso)
  const fraseAtardecer = conPaseOPrueba
    ? fraseDeAtardecer({
        day,
        pendientes: vigentes.filter((s) => !s.checkedInAt),
        desde: ubicacion ?? (anterior && hasRealCoordinates(anterior.coordinates) ? anterior.coordinates : null) ?? (siguiente && hasRealCoordinates(siguiente.coordinates) ? siguiente.coordinates : null) ?? zonaCoordsAtardecer,
        ahoraMin: new Date().getHours() * 60 + new Date().getMinutes(),
        delDestino: solDelDestino,
        enCoche,
      })
    : null
  const horaDeCena = day.meals.find((m) => m.mealTime === 'dinner')?.time
  const ahoraLocal = new Date()
  const zonaCoords = (route.accommodationZone ? info.zonasAlojamiento.find((z) => z.id === route.accommodationZone)?.coordinates : null) ?? null
  const manana =
    conPaseOPrueba && !day.isReturnLeg && tocaLoDeManana({ paradasDeHoy: paradas.length, quedanPendientes: Boolean(siguiente), cenaMin: horaDeCena ? parseTimeToMinutes(horaDeCena) : null, ahoraMin: ahoraLocal.getHours() * 60 + ahoraLocal.getMinutes() })
      ? mananaH13({ route, day, reservations, nombreDelDia: (d) => nombreDelDia(route, d, info.gruposDia).titulo, nombreCorto: (r) => info.nombresCortos[r.refId] ?? null, zona: zonaCoords, enCoche })
      : null
  const reservaSiguiente = siguiente ? reservaDe(siguiente) : null
  const cuenta = cuentaDelDia(paradas)
  // H6 (por la mañana): con el pase y la zona (o el coche), antes de la hora de salir y sin nada hecho aún.
  const salidaManana = conPaseOPrueba && siguiente && vistas === 0 && !esLlegada && !esVuelta ? salidaDeCasa({ day, primera: siguiente, zona: zonaCoords, enCoche }) : null
  const minSalida = salidaManana ? minutosDe(salidaManana.hora) : null
  const esPorLaManana = Boolean(salidaManana && minSalida != null && ahoraMinHoy < minSalida)
  const vuelveH14 = (conPase: boolean) => (tarjetaVuelve || fichas.vuelta.hora || route.planVuelta?.hora ? <HoyVuelvesH14 route={route} day={day} tarjeta={tarjetaVuelve} mitad={fichas.vuelta} info={infoLlegada} conPase={conPase} onVerComoIr={() => fichas.abrir('vuelta')} /> : null)
  const saltar = (stop: Stop) => {
    setStopSaltada(day.id, stop.id, true)
    setAvisoSaltada({ stopId: stop.id })
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

  // ── La cabecera: «jue 23» y el título del día (si es día de viaje, su trayecto al lado) ──
  const ojo = `${formatWeekdayAbbrEs(dateIso)} ${Number(dateIso.slice(8, 10))}`
  const tituloLimpio = tituloDeHoy.titulo.includes('→') ? tituloSinHorasSiYaNoEsVerdad(day.curatedTitle ?? day.city, day, null) : tituloDeHoy.titulo
  // (HOY1, H14) El día de vuelta sin paradas lleva la tarjeta «Hoy vuelves a casa»: la cabecera no repite el título.
  const tituloCabecera = sinParadasDeVuelta && tarjetaVuelve ? `Último día en ${route.destination}` : tituloLimpio
  const cabecera = info.cargado || esVuelta ? <CabeceraHoy ojo={ojo} titulo={tituloCabecera} sub={tituloDeHoy.viaje ?? viajeDelDia(route, day)} /> : <CabeceraHoy ojo={ojo} titulo=" " />

  // ── El pase: con cobro y sin pase, el día de llegada es la tarjeta P3 y, si la prueba ya se gastó, solo la tarjeta de la 12 ──
  const sinPase = pase.cobro && !pase.conPase
  // (Tanda 10H) Lo que toca decir de la prueba hoy (la tabla de src/lib/diaDePrueba.ts): el destino, el día y el pase salen de los datos.
  const fila = sinPase ? filaDeHoySinPase({ fase: 'during', hoyIso: dateIso, inicioIso: route.answers.dateRange?.start ?? null, prueba: pase.prueba ?? { estado: pase.pruebaGastada ? 'gastada' : 'pendiente' }, tripId: useSyncStore.getState().activeTripId, destino: route.destination }) : null
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
  if (sinPase && esLlegada && !pase.puede) {
    return (
      <>
        {cabecera}
        {fila?.tipo === 'manana_es_prueba' && <TarjetaDeLaPrueba fila={fila} destino={route.destination} />}
        <TarjetaP3 etiqueta={`Hoy · ${ojo}`} destino={route.destination} />
      </>
    )
  }
  if (sinPase && !pase.puede) {
    return (
      <>
        {cabecera}
        {esVuelta && vuelveH14(false)}
        <TarjetaDiaDePrueba dias={diasRestantes} fila={fila} destino={route.destination} />
        {fichas.hoja}
      </>
    )
  }

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
      {/* El día de prueba (Tanda 10H): la franja de arriba. */}
      {sinPase && pase.puede && fila?.tipo === 'hoy_es_prueba' && <FranjaDiaDePrueba fila={fila} />}
      {cierres.map((a) => (
        <div key={a.id} className="flex min-h-14 flex-none items-center gap-3 rounded-[18px] py-[9px] pl-3 pr-2.5" style={{ background: 'rgb(var(--accent-red) / .07)', border: '1px solid rgb(var(--accent-red) / .25)' }} data-avisos-de-cierre>
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] text-white" style={{ background: 'rgb(var(--accent-red))' }}>
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
      <AvisosDeCerca route={route} day={day} dateIso={dateIso} />
    </>
  )

  return (
    <>
      {paradas.length > 0 && !sinParadasDeVuelta ? <CabeceraParada ojo={ojoDeParada(dateIso, tituloLimpio)} ahora={cuenta.ahora} total={cuenta.total} hechas={cuenta.hechas} /> : cabecera}
      <SinConexionHoy route={route} day={day} dateIso={dateIso} />
      {/* HOY1, H12: los avisos del tiempo van arriba, entre «Parada X de Y» y la tarjeta (como en Design) */}
      <AvisosDelTiempo route={route} day={day} dateIso={dateIso} />
      {diaCompleto && <p className="flex-none px-1 text-[12.5px] leading-[1.35] text-text/60">{TEXTO_DIA_COMPLETO}</p>}

      {/* 5: el día de vuelta sin paradas, «Hoy vuelves a casa» */}
      {sinParadasDeVuelta && tarjetaVuelve && vuelveH14(true)}

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

      {/* Al EMPEZAR el día (Tanda 10N11): [Cómo llegar a tu alojamiento]. El día de llegada con billete ya lo lleva en su bloque. */}
      {!esVuelta && !hayBilleteLlegada && <BotonAlojamientoHoy route={route} />}

      {/* 3, 3b, 3c: el día de llegada */}
      {hayBilleteLlegada && (
        <div data-hoy-llegada="1" className="flex flex-none flex-col gap-2.5">
          <div className="flex flex-col">
            <TarjetaLlegadaDias billete={llegadaMitad.billete!} point={llegadaMitad.point} origen={llegadaMitad.origen} destino={llegadaMitad.destino} onOpen={() => fichas.abrir('llegada')} />
            {!comidaAlLlegar && !llegadaTarde && (
              <button type="button" onClick={() => explorar('restaurantes', null, true)} className="mx-3.5 mb-1 mt-0 flex min-h-11 items-center gap-1.5 border-t border-dashed border-text/15 text-left text-[12.5px] font-semibold text-[#1C2230] underline underline-offset-[3px]">
                Restaurantes cerca de tu alojamiento
                <Icono nombre="adelante" size={13} grosor={2.4} />
              </button>
            )}
          </div>
          <BotonAlojamientoHoy route={route} dentro />
        </div>
      )}
      {llegadaTarde && (
        <div className="flex flex-none flex-col gap-3 rounded-[22px] bg-[#1C2230] p-[18px] text-[#FFFDF8]" data-hoy-llegada-tarde>
          <Icono nombre="noche" size={26} style={{ color: '#F3D59A' }} />
          <span style={{ font: "400 22px/1.2 'Instrument Serif',serif", textWrap: 'pretty' as never }}>Llegas tarde: hoy no te hemos puesto paradas, descansa. Si tienes hambre, aquí tienes los restaurantes de {route.destination}.</span>
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
                    Tu alojamiento está en la zona de <strong className="font-semibold text-[#1C2230]">{nombreDeZona(zona.nombre)}</strong>. Te recomendamos comer algo antes de ponerte en marcha: aquí tienes los mejores restaurantes de {route.destination}.
                  </>
                ) : (
                  `Te recomendamos comer algo antes de ponerte en marcha: aquí tienes los mejores restaurantes de ${route.destination}.`
                )}
              </span>
            </span>
            <button type="button" onClick={() => explorar('restaurantes', null, true)} className="ml-[46px] h-11 self-start rounded-full border border-[rgba(28,34,48,.18)] bg-white px-4 text-[13.5px] font-semibold">
              Explorar restaurantes
            </button>
          </div>
        </>
      )}

      {/* HOY1 (H13) + LG1: el atardecer (Roma y Lanzarote), desde 2 horas antes de la puesta de sol */}
      {fraseAtardecer && (
        <div data-hoy-atardecer={fraseAtardecer.tipo} className="flex flex-none flex-col gap-3 rounded-3xl p-4 text-white" style={{ background: 'linear-gradient(160deg,#F9C98A,#E58A5E 55%,#7A3E78)' }}>
          <div className="flex items-center gap-3.5">
            <span className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,.22)' }}>
              <Icono nombre="hoy" size={26} grosor={1.8} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <b data-hoy-atardecer-titulo style={{ font: "400 22px/1.15 'Instrument Serif',serif" }}>{fraseAtardecer.texto}</b>
              {fraseAtardecer.extra && <span data-hoy-atardecer-mar className="text-[13.5px] font-medium opacity-90">{fraseAtardecer.extra}</span>}
            </span>
            {fraseAtardecer.tipo === 'parada' && fraseAtardecer.parada && hasRealCoordinates(fraseAtardecer.parada.coordinates) && (
              <a href={urlComoLlegar(fraseAtardecer.parada.coordinates, ubicacion, enCoche)} target="_blank" rel="noopener noreferrer" data-hoy-atardecer-como-llegar className="flex h-11 flex-none items-center rounded-xl px-3.5 text-[12.5px] font-bold no-underline" style={{ background: '#FBF3E2', color: '#4A3510' }}>
                Cómo llegar
              </a>
            )}
          </div>
          {fraseAtardecer.tipo === 'cerca' && (
            <div className="flex flex-col gap-2">
              {fraseAtardecer.cerca.map((c) => (
                <div key={c.nombre} data-hoy-atardecer-sitio className="flex items-center gap-3 rounded-2xl px-3 py-2" style={{ background: 'rgba(255,255,255,.16)' }}>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <b className="truncate text-[14.5px]">{displayStopName(c.nombre)}</b>
                    <span className="text-[12.5px] opacity-90">{c.modo === 'coche' ? `a ${c.minutos} min en coche` : `a ${c.minutos} min a pie`}</span>
                  </span>
                  <a href={urlComoLlegar(c.coordinates, ubicacion, c.modo === 'coche')} target="_blank" rel="noopener noreferrer" data-hoy-atardecer-como-llegar className="flex h-11 flex-none items-center rounded-xl px-3.5 text-[12.5px] font-bold no-underline" style={{ background: '#FBF3E2', color: '#4A3510' }}>
                    Cómo llegar
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HOY1 (H4): la línea dorada del logro que acaba de ganar */}
      {ultimoVisto && siguiente && sumaDelVisto && <LineaDelLogro texto={`+1 en ${sumaDelVisto}`} />}

      {/* HOY1 (H1 a H6): la siguiente parada, por llegar o ya aquí; por la mañana, «Sal de casa a las…» */}
      {!sinParadasDeVuelta && siguiente && esPorLaManana && salidaManana && (
        <TarjetaPorLaManana route={route} day={day} dateIso={dateIso} primera={siguiente} hora={salidaManana.hora} trayecto={salidaManana.trayecto} comoLlegar={hasRealCoordinates(siguiente.coordinates) ? urlComoLlegar(siguiente.coordinates, zonaCoords, enCoche) : null} />
      )}
      {!sinParadasDeVuelta && siguiente && !esPorLaManana && (
        <TarjetaParada
          route={route}
          day={day}
          dateIso={dateIso}
          siguiente={siguiente}
          anterior={anterior}
          reservaSiguiente={reservaSiguiente}
          ubicacion={ubicacion}
          ubicacionEstado={ubicacionEstado}
          pedirUbicacion={pedirUbicacion}
          enCoche={enCoche}
          onTerminado={marcarVisto}
          onSaltar={() => saltar(siguiente)}
          recienTerminada={Boolean(ultimoVisto)}
          conPase={conPaseOPrueba}
          escuchar={(variante) => <EscucharHistoria destino={route.destination} parada={siguiente} variante={variante} />}
          onQueVasAVer={() => setHojaSobre(siguiente)}
          casa={zonaCoords}
          lineaHorario={<LineaDeHorario horario={horarioDe(siguiente)} cerradoEsteDia={Boolean(siguiente.closedThisDay)} />}
        />
      )}
      {!sinParadasDeVuelta && siguiente && masVisitas.length > 0 && (
        <div className="flex flex-none justify-center">
          <button type="button" onClick={() => setHojaMas(masVisitas)} data-mas-visitas className="flex h-11 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold" style={{ border: '1.5px dashed rgba(166,124,82,.6)' }}>
            <Icono nombre="anadir" size={13} grosor={2.4} />
            Más visitas
          </button>
        </div>
      )}

      {/* HOY1: los avisos (cierres, entradas, lluvia) van DEBAJO de la tarjeta: la tarjeta es lo primero que se ve, como en Design */}
      {alertas}
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

      {/* Tanda 10P: lo de mañana (después de la última parada o a la hora de la cena; el último día, nada) */}
      {/* HOY1 (H13): lo de mañana (después de la última parada o a la hora de la cena; el último día, nada) */}
      {manana && (
        <div data-hoy-manana className="flex flex-none flex-col gap-2 rounded-[20px] px-4 py-3.5" style={{ background: '#FFFDF8', border: '1px solid rgba(181,138,46,.4)' }}>
          <span style={{ ...OJO, color: '#6F4E37' }}>Mañana</span>
          <b data-hoy-manana-titulo style={{ font: "400 24px/1.15 'Instrument Serif',serif" }}>{manana.titulo}</b>
          <span className="flex flex-wrap gap-x-3.5 gap-y-1 text-[13px] font-medium text-[#1C2230]/70">
            {manana.sales && (
              <span data-hoy-manana-sales className="flex items-center gap-[5px]">
                <Icono nombre="reloj" size={14} grosor={1.8} />
                {manana.sales}
              </span>
            )}
            {manana.turno && (
              <span data-hoy-manana-reserva className="flex items-center gap-[5px]">
                <Icono nombre="reservas" size={14} grosor={1.8} />
                {manana.turno}
              </span>
            )}
            {manana.consejo && (
              <span data-hoy-manana-consejo className="flex items-center gap-[5px]">
                <Icono nombre="info" size={14} grosor={1.8} />
                {manana.consejo}
              </span>
            )}
          </span>
        </div>
      )}

      {ofrecerFoto && !logrosActivos() && (
        <div className="flex flex-none items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5" style={{ border: '1px solid rgba(28,34,48,.08)' }}>
          <span className="min-w-0 flex-1 truncate text-[13px] text-text/70">Visto: {displayStopName(ofrecerFoto.name)}</span>
          <BotonFoto dayId={day.id} dayNumber={day.dayNumber} stopName={ofrecerFoto.name} etiqueta="Añadir foto" onSubida={() => setOfrecerFoto(null)} className="flex h-11 flex-none items-center gap-1.5 rounded-full btn-champan px-3.5 text-[13px] font-semibold ">
            <Icono nombre="camara" size={16} />
            Añadir foto
          </BotonFoto>
          <button type="button" onClick={() => setOfrecerFoto(null)} aria-label="Ahora no" className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-text/50">
            <Icono nombre="cerrar" size={16} />
          </button>
        </div>
      )}

      {mostrarPrueba && <TarjetaDiaDePrueba dias={diasRestantes} fila={fila} destino={route.destination} />}

      {/* Cerca de ti */}
      {!sinParadasDeVuelta && !esVuelta && paradas.length > 0 && <CercaDeTiFila route={route} origen={origenCerca} conPase={pagoActivo()} />}

      {/* HOY1 (H1, H4, H4b): «Tu día», la lista completa que se cierra y se abre */}
      {!sinParadasDeVuelta && paradas.length > 0 && <TuDia route={route} day={day} dateIso={dateIso} paradas={paradas} siguienteId={siguiente?.id ?? null} reservaDe={reservaDe} onRecuperar={(s2) => setStopSaltada(day.id, s2.id, false)} />}

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
          {/* HOY1 (H14): UNA sola tarjeta de «Hoy vuelves a casa» (con y sin pase); el billete de vuelta, debajo */}
          {vuelveH14(true) ?? <TarjetaVueltaV2 route={route} mitad={fichas.vuelta} onVerComoIr={() => fichas.abrir('vuelta')} />}
          {vuelveH14(true) && pagoActivo() && fichas.vuelta.billete && <BilleteDeVuelo billete={fichas.vuelta.billete} onOpen={() => fichas.abrir('vuelta')} />}
        </>
      )}

      {tarjetaVuelve && !esVuelta && vuelveH14(true)}
      {!esVuelta && <BotonAlojamientoHoy route={route} />}
      <TusFotosDeHoy day={day} />

      {fichas.hoja}
      {avisoSaltada && <AvisoSaltada onDeshacer={() => { setStopSaltada(day.id, avisoSaltada.stopId, false); setAvisoSaltada(null) }} />}
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

export { textoResumenDeParada }
