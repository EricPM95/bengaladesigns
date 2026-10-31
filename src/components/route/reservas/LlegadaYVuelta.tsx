import { useEffect, useRef, useState } from 'react'
import type { Route } from '../../../lib/types'
import type { CambioDeVuelo, EnCambioDeVuelo } from '../../../lib/cambioDeVuelo'
import { puntoCorto, type ArrivalInfo } from '../../../lib/arrivalReturn'
import { legLine, legOf, legWord, legsTag, type LegKind, type LegState } from '../../../lib/reservasLegs'
import { useRouteStore } from '../../../store/useRouteStore'
import { useLoSuyo } from '../../../store/useLoSuyo'
import { nombreDe } from '../../../store/useViajeCompartido'
import { entreEfectivo, idsConLoSuyo } from '../../../lib/loSuyo'
import { BloqueShell, CambiarBoton, EstadoBloque, FlechaBloque, IconoBloque, iconoDeMedio, tituloBloqueStyle, INK } from './BloqueReservas'
import { leerImporte } from '../../../lib/dinero'
import { precioEnVista, useMonedaViajero } from '../../../lib/moneda'
import { fechaLarga } from '../../../lib/fechaLarga'
import { HojaDelVuelo, type LadoDeHoja } from './HojaDelVuelo'
import { useDineroDeReserva } from './DineroDeReserva'
import { useEntradasDelGrupo } from '../../../hooks/useEntradasDelGrupo'
import { EnEsteChips } from './EnEsteChips'
import { Icono } from '../../ui/Icono'
import { quitarConDeshacer } from '../../../store/useAddFlowStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { useViajeCompartido } from '../../../store/useViajeCompartido'
import { useBilleteStore } from '../../../store/useBilleteStore'
import { useBillete } from '../../../hooks/useBillete'
import { useDuracionBillete } from '../../../hooks/useDuracionBillete'
import { ciudadDeSalida, diaEntero, trayectoDeLaMitad } from '../../../lib/billete'
import { leerBillete, type DatosBilleteLeido } from '../../../lib/billeteLeer'
import { ladoDesdeBillete } from '../../../lib/billeteAplicar'
import { etiquetaDeCiudadConEstacion, etiquetaDeCiudadConPunto, ejemploDeCiudadConAeropuerto, ejemploDeCiudadConEstacionEjemplo } from '../../../lib/aeropuertosCiudad'
import { HojaDatosDelBillete } from './HojaDatosDelBillete'
import { CodigoPantallaCompleta, TarjetaBillete, filasDelBillete } from './TarjetaBillete'

const ETIQUETA_PUNTO: Record<string, string> = { avion: 'Aeropuerto', tren: 'Estación', bus: 'Estación', ferry: 'Puerto', coche: 'Punto' }
const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

/**
 * LA HOJA DEL VUELO DEL ADMINISTRADOR (Tanda 10N10 §7b; `Piezas/Vuelo Reservas` 02-05b): las pestañas Ida | Vuelta con sus datos (día fijo, los dos lados —Sales de / Llegas a, con su hora— con el medio en medio, referencia y aerolínea)
 * y, debajo, para TODO el vuelo, el bloque del dinero (¿para quién?, ¿cuánto ha costado en total?, ¿quién lo ha pagado?, la línea de a dónde va). La rueda de la hora no tiene [Guardar]: un solo botón «Guardar el vuelo» y un solo aviso
 * (`guardarVueloDelAdmin` apunta UN cambio con la ida y la vuelta juntas). El precio, el para quién y quién pagó se guardan en el viaje (`setLegPrecio`, `setCuentasEntre`, `setPagadoPorDe`).
 */
export function HojaVueloDelAdmin({
  route,
  ida,
  vuelta,
  ladoInicial,
  onClose,
  onGuardar,
  leido = null,
  onCambiarArchivo,
}: {
  route: Route
  ida: LegState
  vuelta: LegState
  ladoInicial: LegKind
  /** (10S5) Lo que se ha leído del PDF, la foto o la captura de un billete: rellena la hoja para que el viajero lo revise; no se guarda hasta pulsar «Guardar». */
  leido?: { kind: LegKind; datos: DatosBilleteLeido } | null
  onCambiarArchivo?: (kind: LegKind) => void
  /** (10S6) Ya no se usa en la hoja («¿Llegas o te vas otro día?» fuera); se deja por quien lo pase. */
  onFechas?: () => void
  onClose: () => void
  onGuardar: (cambios: { arrival?: { time: string; pointId?: string | null }; departure?: { time: string; pointId?: string | null }; medio?: string }, cambiosDeVuelo: CambioDeVuelo[]) => void
}) {
  const setLegPrecio = useRouteStore((s) => s.setLegPrecio)
  const setLegCodigo = useRouteStore((s) => s.setLegCodigo)
  const setLegCompania = useRouteStore((s) => s.setLegCompania)
  const setLegOtroPunto = useRouteStore((s) => s.setLegOtroPunto)
  const setLegOtraHora = useRouteStore((s) => s.setLegOtraHora)
  const setCuentasEntre = useRouteStore((s) => s.setCuentasEntre)
  const setPagadoPorDe = useRouteStore((s) => s.setPagadoPorDe)
  const tripId = useSyncStore((s) => s.activeTripId)
  const yoId = useViajeCompartido((s) => s.gente.find((p) => p.esYo)?.id ?? null)
  const ponerBillete = useBilleteStore((s) => s.poner)
  const quitarBillete = useBilleteStore((s) => s.quitar)
  const bIda = useBillete('arrival', ida.time).billete
  const bVuelta = useBillete('departure', vuelta.time).billete
  const billeteDeLa = (leg: LegState) => (leg.kind === 'arrival' ? bIda : bVuelta)
  const ciudadFuera = ciudadDeSalida(route)
  const principal = ida.mode !== 'coche' ? ida : vuelta
  const noun = legWord(principal.mode).noun
  const dinero = useDineroDeReserva({
    para: route.cuentasEntre?.llegada ?? route.cuentasEntre?.vuelta ?? null,
    pagado: route.pagadoPorDe?.llegada ?? null,
    precio: leerImporte(route.arrivalPrecio) ?? leerImporte(route.departurePrecio),
  })
  const lado = (leg: LegState): LadoDeHoja => {
    const l = leido && leido.kind === leg.kind ? ladoDesdeBillete(leg, leido.datos, ciudadFuera) : null
    const b = billeteDeLa(leg)
    const otroPuntoEjemplo = leg.mode === 'avion' ? ejemploDeCiudadConAeropuerto(ciudadFuera) : leg.mode === 'tren' ? ejemploDeCiudadConEstacionEjemplo(ciudadFuera) : ''
    return {
    activo: leg.mode !== 'coche',
    tocado: Boolean(l),
    hora: l?.hora ?? leg.time,
    punto: l?.punto ?? (leg.point ? puntoCorto(leg.point) : null),
    fecha: leg.dateIso,
    hecho: leg.done && leg.mode !== 'coche',
    dias: leg.dateIso ? [{ iso: leg.dateIso, texto: fechaLarga(leg.dateIso) }] : [],
    diasFijos: true,
    puntos: leg.points.map(puntoCorto),
    etiquetaPunto: ETIQUETA_PUNTO[leg.mode] ?? 'Punto',
    puntoObligatorio: leg.hasButtons,
    llega: leg.kind === 'arrival',
    // (10S2) Con coche no hay referencia ni compañía; con tren o autobús (y barco) son «Ref. del billete» y «Compañía»; solo en avión, «Ref. vuelo» y «Aerolínea».
    extras: leg.mode === 'coche' ? undefined : {
      etiquetaCodigo: legWord(leg.mode).refLabel,
      etiquetaCompania: legWord(leg.mode).companiaLabel,
      codigo: l?.codigo ?? leg.codigo ?? '',
      compania: l?.compania ?? leg.compania ?? '',
      otroPunto: l?.otroPunto ?? leg.otroPunto ?? '',
      // (10S5) «Sales de» / «Llegas a»: de partida, la ciudad de la primera pantalla y, si solo tiene un aeropuerto (o una estación principal sin duda), entre paréntesis: «Barcelona (El Prat)».
      // (10S6) Con varios aeropuertos (o estaciones) la casilla va VACÍA con un ejemplo en gris («Londres (Heathrow)»); con uno solo, rellena como siempre.
      otroPuntoEjemplo,
      otroPuntoPorDefecto: otroPuntoEjemplo ? '' : leg.mode === 'avion' ? etiquetaDeCiudadConPunto(ciudadFuera) : leg.mode === 'tren' ? etiquetaDeCiudadConEstacion(ciudadFuera) : ciudadFuera,
      otraHora: l?.otraHora ?? leg.otraHora,
      privados: { localizador: l?.localizador ?? b?.localizador ?? '', terminal: l?.terminal ?? b?.terminal ?? '', asiento: l?.asiento ?? b?.asiento ?? '', coche: l?.coche ?? b?.coche ?? '' },
      conCoche: leg.mode === 'tren' || leg.mode === 'bus',
      icono: iconoDeMedio(leg.mode),
    },
  }
  }
  const hayCodigo = (leg: LegState) => Boolean((leido && leido.kind === leg.kind && leido.datos.codigo) || billeteDeLa(leg)?.codigo)
  const leidoAlgo = leido ? Boolean(leido.datos.numero || leido.datos.horaSalida || leido.datos.horaLlegada || leido.datos.localizador || leido.datos.asiento || leido.datos.fuentes.length > 0) : false
  return (
    <HojaDelVuelo
      titulo={`Tu ${noun}`}
      textoGuardar={`Guardar el ${noun}`}
      datos="admin"
      lados={{ ida: lado(ida), vuelta: lado(vuelta) }}
      aviso={
        leido ? (
          <p className="mt-3 rounded-[14px] px-3.5 py-2.5 text-[13px] leading-[1.35]" style={{ background: '#FBF3E2', border: '1px solid rgba(181,138,46,.35)', color: INK }} data-billete-leido={leidoAlgo ? 'si' : 'no'}>
            {leidoAlgo ? 'Hemos leído tu billete. Revisa los datos, cámbialos si hace falta y guarda.' : 'No hemos podido leer los datos de este archivo. Ponlos a mano: el código se guarda igual si lo hemos encontrado.'}
          </p>
        ) : undefined
      }
      tarjeta={
        <div className="mt-3 flex flex-col gap-1 empty:hidden" data-mi-vuelo-tarjeta>
          {([ida, vuelta] as const).filter((leg) => leg.mode !== 'coche' && hayCodigo(leg) && onCambiarArchivo).map((leg) => (
            <div key={leg.kind} data-tarjeta-de={leg.kind} className="flex items-center justify-between gap-2 text-[13px]" style={{ color: INK }}>
              <span className="font-semibold">{leg.mode === 'avion' ? 'Tu tarjeta de embarque' : 'Tu billete'} · {leg.kind === 'arrival' ? 'ida' : 'vuelta'}</span>
              <span className="flex gap-3">
                <button type="button" onClick={() => onCambiarArchivo?.(leg.kind)} data-billete-cambiar-archivo className="zona-toque underline underline-offset-2">
                  Cambiar el archivo
                </button>
                {billeteDeLa(leg)?.codigo && (
                  <button type="button" onClick={() => ponerBillete(tripId, leg.kind, { ...billeteDeLa(leg)!, codigo: null })} data-billete-quitar-codigo className="zona-toque underline underline-offset-2" style={{ color: 'oklch(0.52 0.19 25)' }}>
                    Quitar
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      }
      ladoInicial={ladoInicial === 'arrival' ? 'ida' : 'vuelta'}
      extra={dinero.bloque('vuelo')}
      onClose={onClose}
      onGuardar={(gIda, gVuelta) => {
        const cambios: Parameters<typeof onGuardar>[0] = { medio: noun }
        const avisos: CambioDeVuelo[] = []
        for (const [leg, g] of [[ida, gIda], [vuelta, gVuelta]] as const) {
          if (leg.mode === 'coche' || !g.puesto) continue
          const punto = leg.points.length === 1 ? leg.points[0] : (leg.points.find((p) => puntoCorto(p) === g.punto) ?? null)
          const entrada = { time: g.hora, ...(punto ? { pointId: punto.id } : {}) }
          if (leg.kind === 'arrival') cambios.arrival = entrada
          else cambios.departure = entrada
          // (Los motores solo se enteran de lo que de verdad ha cambiado: la hora o el punto de esa mitad.)
          if (leg.time !== g.hora) avisos.push({ que: 'hora', mitad: leg.kind })
          else if (punto && leg.point?.id !== punto.id) avisos.push({ que: 'punto', mitad: leg.kind })
        }
        onGuardar(cambios, avisos)
        // Lo de más: referencia, aerolínea, el otro punto y su hora, y el dinero (todo el vuelo a la vez).
        for (const [leg, g] of [[ida, gIda], [vuelta, gVuelta]] as const) {
          if (leg.mode === 'coche' || !g.puesto) continue
          setLegCodigo(leg.kind, g.codigo)
          setLegCompania(leg.kind, g.compania)
          // (10S5) Si lo único que hay es la ciudad de partida, no se guarda nada (sale igual en el trayecto): solo se guarda lo que el viajero ha cambiado o un aeropuerto.
          setLegOtroPunto(leg.kind, g.otroPunto.trim() === ciudadFuera ? '' : g.otroPunto)
          setLegOtraHora(leg.kind, g.otraHora)
          // (10S5) Lo privado del billete (localizador, terminal, asiento, coche y el código): solo en el móvil de esta persona.
          const nuevo = leido && leido.kind === leg.kind ? leido.datos : null
          const previo = billeteDeLa(leg)
          const codigo = nuevo?.codigo ? { texto: nuevo.codigo.texto, formato: nuevo.codigo.formato, imagen: nuevo.codigo.imagen, dibujo: nuevo.codigo.dibujo ?? null } : (previo?.codigo ?? null)
          const limpio = (t: string) => t.trim() || null
          if (limpio(g.localizador) || limpio(g.terminal) || limpio(g.asiento) || limpio(g.coche) || codigo) {
            ponerBillete(tripId, leg.kind, {
              horaRoma: g.hora,
              localizador: limpio(g.localizador),
              terminal: limpio(g.terminal),
              asiento: limpio(g.asiento),
              coche: limpio(g.coche),
              codigo,
              codigoFuera: nuevo ? ladoDesdeBillete(leg, nuevo, ciudadFuera).codigoFuera : (previo?.codigoFuera ?? null),
              dueno: yoId,
            })
          } else if (previo) quitarBillete(tripId, leg.kind)
        }
        const total = dinero.precio.importe
        setLegPrecio(principal.kind, total)
        const otra = principal.kind === 'arrival' ? 'departure' : 'arrival'
        if (ida.mode !== 'coche' && vuelta.mode !== 'coche') setLegPrecio(otra, null)
        if (!dinero.solo) {
          const todos = dinero.gente.map((p) => p.id)
          const lista = dinero.paraIds.length === todos.length ? null : dinero.paraIds
          const paga = dinero.paraIds.length > 1 && total ? dinero.pagadoIds : null
          for (const clave of ['llegada', 'vuelta']) {
            setCuentasEntre(clave, lista)
            setPagadoPorDe(clave, paga)
          }
        }
      }}
    />
  )
}

/**
 * Una mitad hecha (vuelo, tren, autobús o barco) con SU billete (10S5 §4; `Piezas/Billete Reservas` B1-B4): las horas grandes, el trayecto con paréntesis («Barcelona → Roma (Fiumicino)»), los datos que haya en su fila,
 * el código en pequeño con «Toca para ampliar» (a pantalla completa en blanco) o, si aún no hay, [Añadir tarjeta de embarque] / [Añadir tu billete].
 */
function MitadConBillete({ route, leg, ciudad, onCambiar, onQuitar, onAnadirTarjeta }: { route: Route; leg: LegState; ciudad: string; onCambiar: () => void; onQuitar: () => void; onAnadirTarjeta: (kind: LegKind) => void }) {
  const esIda = leg.kind === 'arrival'
  const { billete } = useBillete(leg.kind, leg.time)
  const [ampliado, setAmpliado] = useState(false)
  const [datosAbiertos, setDatosAbiertos] = useState(false)
  const ciudadFuera = ciudadDeSalida(route)
  const trayecto = trayectoDeLaMitad({ kind: esIda ? 'llegada' : 'vuelta', ciudadFuera, otroPunto: leg.otroPunto, ciudadRoma: ciudad, puntoRoma: leg.point })
  const horaFuera = leg.otraHora
  const duracion = useDuracionBillete({ llega: esIda, horaRoma: leg.time, horaFuera, fecha: leg.dateIso, avion: leg.mode === 'avion', ciudadFuera, iataFuera: billete?.codigoFuera ?? null })
  const fecha = leg.dateIso ? capitalizar(fechaLarga(leg.dateIso)) : `Día ${leg.dayNumber}`
  const filas = filasDelBillete(leg, billete, duracion)
  const salida = esIda ? horaFuera : leg.time
  const pie = [filas.find((f) => f.clave === 'asiento')?.texto, filas.find((f) => f.clave === 'numero')?.texto].filter(Boolean).join(' · ')
  return (
    <>
      <TarjetaBillete leg={leg} trayecto={trayecto} fecha={fecha} billete={billete} duracion={duracion} horaFuera={horaFuera} onCambiar={onCambiar} onQuitar={onQuitar} onAnadirTarjeta={() => onAnadirTarjeta(leg.kind)} onAmpliar={() => setAmpliado(true)} onDatos={() => setDatosAbiertos(true)} />
      {datosAbiertos && <HojaDatosDelBillete leg={leg} billete={billete} onClose={() => setDatosAbiertos(false)} />}
      {ampliado && billete?.codigo && (
        <CodigoPantallaCompleta codigo={billete.codigo} titulo={esIda ? `${ciudadFuera} → ${ciudad}` : `${ciudad} → ${ciudadFuera}`} cuando={[diaEntero(leg.dateIso), salida].filter(Boolean).join(' · ')} pie={pie} onClose={() => setAmpliado(false)} />
      )}
    </>
  )
}

/** Una mitad en la tarjeta guardada: con billete (avión, tren, autobús, barco), o la línea de coche, o «Falta la ida». */
function MitadGuardada({ route, leg, ciudad, onCambiar, onQuitar, onAnadirTarjeta }: { route: Route; leg: LegState; ciudad: string; onCambiar: () => void; onQuitar: () => void; onAnadirTarjeta: (kind: LegKind) => void }) {
  const esIda = leg.kind === 'arrival'
  const fecha = leg.dateIso ? capitalizar(fechaLarga(leg.dateIso)) : `Día ${leg.dayNumber}`
  const coche = leg.mode === 'coche'
  if (leg.done && !coche) return <MitadConBillete route={route} leg={leg} ciudad={ciudad} onCambiar={onCambiar} onQuitar={onQuitar} onAnadirTarjeta={onAnadirTarjeta} />
  return (
    <div data-mitad={leg.kind} data-mitad-hecha={leg.done ? '1' : '0'} className="mx-3.5 mb-3 flex flex-col gap-1 rounded-[18px] px-3.5 pb-3.5 pt-3" style={{ background: '#FBF1D8', border: '1px solid rgba(181,138,46,.3)' }}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="inline-flex h-6 items-center gap-1 rounded-full px-2.5" style={{ background: '#1C2230', color: '#F3D88F', font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }}>
            <Icono nombre={iconoDeMedio(leg.mode)} size={11} />
            {esIda ? 'Ida' : 'Vuelta'}
          </span>
          <span style={{ font: "600 13.5px 'Geist'", color: INK }}>
            {fecha}
          </span>
        </span>
        {!coche && <CambiarBoton onClick={onCambiar} texto="Añadir" />}
      </div>
      {coche ? (
        <span className="text-[14px] text-text/70">{legLine(leg)}</span>
      ) : (
        <span className="text-[13.5px] text-text/55">{esIda ? 'Falta la ida' : 'Falta la vuelta'}</span>
      )}
    </div>
  )
}

/**
 * El bloque «Llegada y vuelta» de RESERVAS (Tanda 10N10 §7; `Piezas/Vuelo Reservas` 01 y 06). Sin nada hecho, una tarjeta con «Falta» que abre la hoja del vuelo. Con algo hecho, la ida y la vuelta con su hora grande,
 * [Cambiar] en cada una (abre la misma hoja) y, dentro de la MISMA tarjeta, «En este vuelo · Tú y Viajes» (en redondo) con [Cambiar]. Fuera la caja del pase «Tu primer y tu último día» y el bloque suelto «En este vuelo».
 */
export function LlegadaYVuelta({
  route,
  info,
  abierto,
  onToggle,
  mitadAbierta,
  onMitad,
  onCambioDeVuelo,
}: {
  route: Route
  info: ArrivalInfo
  /** (Se conserva por el panel; la tarjeta ya no usa las zonas.) */
  zonas?: unknown
  abierto: boolean
  onToggle: () => void
  /** undefined = la que falta; null = ninguna. */
  mitadAbierta: LegKind | null | undefined
  onMitad: (mitad: LegKind | null | undefined) => void
  onCambioDeVuelo: EnCambioDeVuelo
  /** (10S6) Ya no se usa («Cambia las fechas del viaje» salió de la hoja del vuelo). */
  onFechas?: () => void
}) {
  useMonedaViajero() // se repinta al cambiar la moneda
  const guardarVueloDelAdmin = useRouteStore((state) => state.guardarVueloDelAdmin)
  const removeLeg = useRouteStore((state) => state.removeFlightLeg)
  const marcarVueltaVista = useRouteStore((state) => state.marcarVueltaVista)
  const grupoLoSuyo = useLoSuyo((s) => s.grupo)
  const g = useEntradasDelGrupo()
  // La hoja del vuelo: la ida y la vuelta juntas y UN solo botón «Guardar el vuelo». `vueloAbierto` es la pestaña con la que se abre.
  const [vueloAbierto, setVueloAbierto] = useState<LegKind | null>(null)
  // (10S5) Añadir el billete: el PDF, la foto o la captura se lee y rellena la hoja del vuelo para que el viajero la revise.
  const archivoRef = useRef<HTMLInputElement>(null)
  const archivoDe = useRef<LegKind>('arrival')
  const [leyendo, setLeyendo] = useState<LegKind | null>(null)
  const [lecturas, setLecturas] = useState(0)
  const [leido, setLeido] = useState<{ kind: LegKind; datos: DatosBilleteLeido } | null>(null)
  const ida = legOf(route, info, 'arrival')
  const vuelta = legOf(route, info, 'departure')
  const origen = route.origin
  const ciudad = route.days[0]?.city ?? route.destination
  const hecho = ida.done && vuelta.done
  const algoHecho = ida.done || vuelta.done
  // (10S4 §2) Listo = plegado (se abre al tocar la cabecera); mientras falta algo, abierto. Al quedar listo se vuelve a plegar solo.
  const [desplegadoUsuario, setDesplegadoUsuario] = useState<boolean | null>(null)
  useEffect(() => setDesplegadoUsuario(null), [hecho])
  const desplegado = desplegadoUsuario ?? !hecho
  const hayVuelo = (ida.done && ida.mode !== 'coche') || (vuelta.done && vuelta.mode !== 'coche')
  const etiqueta = legsTag(ida, vuelta)
  const precioTotal = leerImporte(route.arrivalPrecio) ?? leerImporte(route.departurePrecio)
  // El viajero ha abierto su vuelta: ya la ha visto con las fechas de ahora (se va el aviso de la campana de «has cambiado los días del viaje»).
  const fechaDeLaVuelta = route.answers.dateRange?.end ?? null
  useEffect(() => {
    if (vueloAbierto === 'departure') marcarVueltaVista()
  }, [vueloAbierto, fechaDeLaVuelta, marcarVueltaVista])
  // Las fichas del resumen, el «+ AÑADIR VUELO» de DÍAS y el «Editar» de la ventana de llegada piden este bloque con una mitad: se abre la hoja.
  useEffect(() => {
    if (abierto && !vueloAbierto) {
      setDesplegadoUsuario(true)
      setVueloAbierto(mitadAbierta === 'departure' ? 'departure' : mitadAbierta === 'arrival' ? 'arrival' : !ida.done ? 'arrival' : !vuelta.done ? 'departure' : 'arrival')
      onMitad(undefined)
      onToggle()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto])

  const abrirHoja = (mitad: LegKind) => {
    setLeido(null)
    setVueloAbierto(mitad)
  }
  const pedirArchivo = (kind: LegKind) => {
    archivoDe.current = kind
    if (archivoRef.current) {
      archivoRef.current.value = ''
      archivoRef.current.click()
    }
  }
  const alElegirArchivo = async (archivo: File | undefined) => {
    if (!archivo) return
    const kind = archivoDe.current
    const leg = kind === 'arrival' ? ida : vuelta
    setLeyendo(kind)
    try {
      const datos = await leerBillete(archivo, { modo: leg.mode === 'coche' ? undefined : leg.mode })
      setLeido({ kind, datos })
      setLecturas((n) => n + 1)
    } finally {
      setLeyendo(null)
    }
    setVueloAbierto(kind)
  }
  const primeraLibre: LegKind = !ida.done && ida.mode !== 'coche' ? 'arrival' : !vuelta.done && vuelta.mode !== 'coche' ? 'departure' : ida.mode !== 'coche' ? 'arrival' : 'departure'

  // «En este vuelo · Tú y Viajes»: a quién cubre (en un viaje con más gente).
  const adminId = g.gente.find((p) => p.esAdmin)?.id ?? null
  const todos = g.gente.map((p) => p.id)
  const declarado = route.cuentasEntre?.llegada ?? route.cuentasEntre?.vuelta ?? null
  const efectivo = entreEfectivo(declarado, todos, idsConLoSuyo(grupoLoSuyo, 'vuelo'), adminId)
  const quienes = g.gente.filter((p) => efectivo.includes(p.id))
  const nombresQuienes = (() => {
    const n = quienes.map((p) => (p.esYo ? 'Tú' : nombreDe(p) || 'Alguien'))
    return n.length <= 1 ? (n[0] ?? '') : `${n.slice(0, -1).join(', ')} y ${n[n.length - 1]}`
  })()
  const quitar = (leg: LegState) => {
    const teniaHora = Boolean(leg.time)
    quitarConDeshacer(`${leg.kind === 'arrival' ? 'Ida' : 'Vuelta'} quitada del viaje`, () => removeLeg(leg.kind))
    if (teniaHora) onCambioDeVuelo({ que: 'quitar', mitad: leg.kind })
  }

  return (
    <>
      <BloqueShell bloque="llegada">
        {!algoHecho ? (
          <div onClick={() => abrirHoja(primeraLibre)} className="flex cursor-pointer items-center gap-3.5 p-4" data-llegada-vacia>
            <IconoBloque nombre={iconoDeMedio(ida.mode)} />
            <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span style={tituloBloqueStyle}>Llegada y vuelta</span>
              <EstadoBloque texto={etiqueta} hecho={false} />
              <span className="text-[13px] text-text/55">
                {origen} → {ciudad}
              </span>
            </span>
            <FlechaBloque abierto={false} />
          </div>
        ) : (
          <>
            <div onClick={hecho ? () => setDesplegadoUsuario(!desplegado) : undefined} className={`flex items-center gap-3.5 px-4 pb-3 pt-4 ${hecho ? 'cursor-pointer' : ''}`} data-llegada-cabecera>
              <IconoBloque nombre={iconoDeMedio(ida.mode)} hecho={hecho} />
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span style={tituloBloqueStyle}>Llegada y vuelta</span>
                <EstadoBloque texto={hecho ? 'Listo' : etiqueta} hecho={hecho} />
              </span>
              {hecho && <FlechaBloque abierto={desplegado} />}
            </div>
            {desplegado && (
              <>
            <MitadGuardada route={route} leg={ida} ciudad={ciudad} onCambiar={() => abrirHoja('arrival')} onQuitar={() => quitar(ida)} onAnadirTarjeta={pedirArchivo} />
            <MitadGuardada route={route} leg={vuelta} ciudad={ciudad} onCambiar={() => abrirHoja('departure')} onQuitar={() => quitar(vuelta)} onAnadirTarjeta={pedirArchivo} />
            {hayVuelo && (
              <div className="mx-3.5 mb-3 flex items-center justify-between gap-2 rounded-[14px] py-1 pl-3.5 pr-1.5" style={{ background: '#FBF1D8', border: '1px solid rgba(181,138,46,.3)' }} data-precio-vuelo>
                <span className="text-[14px] font-medium" data-precio-vuelo-texto>
                  {precioTotal ? `Precio · ${precioEnVista(precioTotal)}` : 'Precio · sin poner'}
                </span>
                <CambiarBoton onClick={() => abrirHoja(primeraLibre)} />
              </div>
            )}
            {hayVuelo && g.gente.length >= 2 && g.esAdmin && (
              <div className="flex flex-col gap-2.5 px-4 pb-4 pt-1" data-en-este-vuelo>
                <span className="flex items-center justify-between text-text/55" style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }}>
                  En este vuelo
                  <CambiarBoton onClick={() => abrirHoja(primeraLibre)} />
                </span>
                <EnEsteChips gente={quienes} datos="vuelo" />
                <span hidden data-en-este-vuelo-nombres>
                  {nombresQuienes}
                </span>
              </div>
            )}
              </>
            )}
          </>
        )}
      </BloqueShell>
      <input ref={archivoRef} type="file" accept="application/pdf,image/*" hidden data-billete-archivo onChange={(e) => void alElegirArchivo(e.target.files?.[0])} />
      {leyendo && (
        <div role="status" data-billete-leyendo className="fixed inset-x-0 bottom-24 z-[120] mx-auto w-fit max-w-[88vw] rounded-full px-5 py-3 text-[14px] font-semibold" style={{ background: '#1C2230', color: '#F3D88F' }}>
          Leyendo tu {leyendo === 'arrival' ? (ida.mode === 'avion' ? 'tarjeta de embarque' : 'billete') : vuelta.mode === 'avion' ? 'tarjeta de embarque' : 'billete'}…
        </div>
      )}
      {vueloAbierto && (
        <HojaVueloDelAdmin
          key={`hoja-${lecturas}`}
          route={route}
          ida={ida}
          vuelta={vuelta}
          ladoInicial={vueloAbierto}
          leido={leido}
          onCambiarArchivo={pedirArchivo}
          onClose={() => {
            setVueloAbierto(null)
            setLeido(null)
          }}
          onGuardar={(cambios, cambiosDeVuelo) => {
            guardarVueloDelAdmin(cambios)
            setVueloAbierto(null)
            setLeido(null)
            onMitad(undefined)
            for (const cambio of cambiosDeVuelo) onCambioDeVuelo(cambio)
          }}
        />
      )}
    </>
  )
}
