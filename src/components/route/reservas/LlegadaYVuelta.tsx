import { useEffect, useState } from 'react'
import type { Route } from '../../../lib/types'
import type { CambioDeVuelo, EnCambioDeVuelo } from '../../../lib/cambioDeVuelo'
import { puntoCorto, type ArrivalInfo } from '../../../lib/arrivalReturn'
import { legLine, legOf, legWord, legsTag, type LegKind, type LegState } from '../../../lib/reservasLegs'
import { useRouteStore } from '../../../store/useRouteStore'
import { useLoSuyo } from '../../../store/useLoSuyo'
import { nombreDe } from '../../../store/useViajeCompartido'
import { entreEfectivo, idsConLoSuyo } from '../../../lib/loSuyo'
import { BloqueShell, CabeceraBloque, CambiarBoton, iconoDeMedio, INK } from './BloqueReservas'
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
import type { DatosBilleteLeido } from '../../../lib/billeteLeer'
import { ladoDesdeBillete } from '../../../lib/billeteAplicar'
import { etiquetaDeCiudadConEstacion, etiquetaDeCiudadConPunto, ejemploDeCiudadConAeropuerto, ejemploDeCiudadConEstacionEjemplo } from '../../../lib/aeropuertosCiudad'
import { HojaDatosDelBillete } from './HojaDatosDelBillete'
import { CabeceraDeMitad, CodigoPantallaCompleta, TarjetaBillete, filasDelBillete } from './TarjetaBillete'
import { LapizDeReserva } from './BotonesDeReserva'
import { useFlujoDelBillete } from './FlujoDelBillete'
import { CajaDeDato } from './PiezasDesignReservas'
import { BuscarVuelos } from './BuscarVuelos'
import { HojaPrecio } from './HojaPrecio'
import { quitarAvisoDeDocumento, useAvisoDeDocumento } from '../../../lib/avisoDeDocumento'
import { escalasDe, etiquetaDeTramo, etiquetaDeUnion, unidasA, type SitioDeLlegada } from '../../../lib/escalasYUnion'
import type { Reservation } from '../../../lib/bookings'
import type { ReservaExtra } from '../../../lib/reservasExtra'
import { useReservasParaMi } from '../../../hooks/useEntradasDelGrupo'
import { TarjetaDeEscala } from './TarjetasDeEscala'
import { TarjetaDeReservaExtra } from './OtrasReservas'

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
  const setEscalas = useRouteStore((s) => s.setEscalas)
  // (V76, R8) Las escalas se editan en la hoja y se guardan con el vuelo (un solo botón).
  const [escalas, setEscalasHoja] = useState(() => ({ ida: escalasDe(route, 'arrival'), vuelta: escalasDe(route, 'departure') }))
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
      escalas={escalas}
      onEscalas={(l, lista) => setEscalasHoja((previo) => ({ ...previo, [l]: lista }))}
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
        // (V76) Las escalas de cada lado puesto (con la hora de su tramo de siempre guardada).
        for (const [leg, lista] of [[ida, escalas.ida], [vuelta, escalas.vuelta]] as const) {
          if (leg.mode !== 'coche') setEscalas(leg.kind, lista)
        }
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

/** Hoy en «yyyy-mm-dd» (la fecha del móvil): la Ida ya pasada se pliega en una línea (B2c). */
function hoyIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Una mitad hecha (vuelo, tren, autobús o barco) con SU billete (10S5 §4; 10S8 §3; `Piezas/Billete Reservas` B1b-B4): las horas grandes, el trayecto con paréntesis («Barcelona → Roma (Fiumicino)»), los datos que haya en su fila,
 * el código en pequeño con «Toca para ampliar» (a pantalla completa en blanco) o, si aún no hay, [Añadir tarjeta de embarque] / [Añadir tu billete]. B2c: con la Ida ya pasada, se queda en una línea con la llegada
 * («Jueves 26 · 11:25 · Fiumicino») y al tocarla se abre.
 */
function MitadConBillete({ route, leg, ciudad, onCambiar, onQuitar, onAnadirTarjeta, onCambioDeVuelo, rotulo }: { rotulo?: string; route: Route; leg: LegState; ciudad: string; onCambiar: () => void; onQuitar: () => void; onAnadirTarjeta: (kind: LegKind) => void; onCambioDeVuelo: EnCambioDeVuelo }) {
  const esIda = leg.kind === 'arrival'
  const { billete } = useBillete(leg.kind, leg.time)
  const [ampliado, setAmpliado] = useState(false)
  const [datosAbiertos, setDatosAbiertos] = useState(false)
  const [plegadaAbierta, setPlegadaAbierta] = useState(false)
  const tripIdAviso = useSyncStore((s) => s.activeTripId)
  const avisoDeFecha = useAvisoDeDocumento(tripIdAviso, leg.kind)
  const ciudadFuera = ciudadDeSalida(route)
  const trayecto = trayectoDeLaMitad({ kind: esIda ? 'llegada' : 'vuelta', ciudadFuera, otroPunto: leg.otroPunto, ciudadRoma: ciudad, puntoRoma: leg.point })
  const horaFuera = leg.otraHora
  const duracion = useDuracionBillete({ llega: esIda, horaRoma: leg.time, horaFuera, fecha: leg.dateIso, avion: leg.mode === 'avion', ciudadFuera, iataFuera: billete?.codigoFuera ?? null, destino: route.destination })
  const fecha = leg.dateIso ? capitalizar(fechaLarga(leg.dateIso)) : `Día ${leg.dayNumber}`
  const filas = filasDelBillete(leg, billete, duracion)
  const salida = esIda ? horaFuera : leg.time
  const pie = [filas.find((f) => f.clave === 'asiento')?.texto, filas.find((f) => f.clave === 'numero')?.texto].filter(Boolean).join(' · ')
  // (B2c) La Ida de un día que ya pasó: una línea con la llegada, que siempre está (la salida es opcional y no sale).
  // (V45 §2) Cada vuelo guardado se ve ABIERTO (las horas grandes, el trayecto, el lápiz, el QR y, sin tarjeta, [+ Añade tu tarjeta de embarque]): la Ida ya pasada ya no se pliega en una línea.
  const pasada = false && esIda && Boolean(leg.dateIso && leg.dateIso < hoyIso())
  const plegada = pasada && !plegadaAbierta
  return (
    <>
      {plegada ? (
        <div data-mitad={leg.kind} data-mitad-hecha="1" data-mitad-plegada="1" className="mx-3.5 mb-3 px-4">
          <CabeceraDeMitad leg={leg} fecha={diaEntero(leg.dateIso) || fecha} resto={[leg.time, leg.point ? puntoCorto(leg.point) : ''].filter(Boolean).join(' · ')} onCambiar={onCambiar} onToggle={() => setPlegadaAbierta(true)} pasada />
        </div>
      ) : (
        <TarjetaBillete avisoDeFecha={avisoDeFecha ? { texto: avisoDeFecha, onCorrecta: () => quitarAvisoDeDocumento(tripIdAviso, leg.kind) } : null} leg={leg} trayecto={trayecto} fecha={fecha} billete={billete} duracion={duracion} horaFuera={horaFuera} rotulo={rotulo} onCambiar={onCambiar} onQuitar={onQuitar} onAnadirTarjeta={() => onAnadirTarjeta(leg.kind)} onAmpliar={() => setAmpliado(true)} onDatos={() => setDatosAbiertos(true)} onToggle={pasada ? () => setPlegadaAbierta(false) : undefined} />
      )}
      {datosAbiertos && <HojaDatosDelBillete leg={leg} billete={billete} onClose={() => setDatosAbiertos(false)} onCambioDeVuelo={onCambioDeVuelo} />}
      {ampliado && billete?.codigo && (
        <CodigoPantallaCompleta codigo={billete.codigo} titulo={esIda ? `${ciudadFuera} → ${ciudad}` : `${ciudad} → ${ciudadFuera}`} cuando={[diaEntero(leg.dateIso), salida].filter(Boolean).join(' · ')} pie={pie} onClose={() => setAmpliado(false)} />
      )}
    </>
  )
}

/** Una mitad en la tarjeta guardada: con billete (avión, tren, autobús, barco), o la línea de coche, o «Falta la ida». */
export function MitadGuardada({ route, leg, ciudad, onCambiar, onQuitar, onAnadirTarjeta, onCambioDeVuelo, rotulo }: { /** (V76) «IDA · 2 DE 2» cuando el vuelo tiene escalas. */ rotulo?: string; route: Route; leg: LegState; ciudad: string; onCambiar: () => void; onQuitar: () => void; onAnadirTarjeta: (kind: LegKind) => void; onCambioDeVuelo: EnCambioDeVuelo }) {
  const esIda = leg.kind === 'arrival'
  const fecha = leg.dateIso ? capitalizar(fechaLarga(leg.dateIso)) : `Día ${leg.dayNumber}`
  const coche = leg.mode === 'coche'
  if (leg.done && !coche) return <MitadConBillete rotulo={rotulo} route={route} leg={leg} ciudad={ciudad} onCambiar={onCambiar} onQuitar={onQuitar} onAnadirTarjeta={onAnadirTarjeta} onCambioDeVuelo={onCambioDeVuelo} />
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
        {/* (V64 §4) Fuera el «Añadir» de la derecha: hace lo mismo que «+ Falta añadir…». */}
      </div>
      {coche ? (
        <span className="text-[14px] text-text/70">{legLine(leg)}</span>
      ) : (
        // (V45 §2) El vuelo sin poner: una línea con «+» y el enlace «Falta añadir la vuelta», que abre la hoja del vuelo en «Vuelta». Sin QR.
        // (V64 §4) Como el dibujo de Design: «+ Falta añadir la vuelta» (el + dorado y el texto en cursiva subrayado), todo es el botón.
        <button type="button" onClick={onCambiar} data-falta-anadir={leg.kind} className="zona-toque flex items-center gap-2 border-none bg-transparent p-0 text-left" style={{ font: "italic 400 17px 'Instrument Serif',serif", color: '#8E6820' }}>
          <svg className="flex-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E6820" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="underline underline-offset-[3px]">{esIda ? 'Falta añadir la ida' : 'Falta añadir la vuelta'}</span>
        </button>
      )}
    </div>
  )
}

/** (V64 §4) El precio (de la ida y la vuelta juntas) con el formato de la caja PRECIO de las tarjetas (`CajaDeDato`: el «€», «PRECIO» pequeño y el importe), a lo ancho y con su lápiz a la derecha. */
function FilaPrecio({ texto, onCambiar }: { texto: string; onCambiar: () => void }) {
  return (
    <div className="mx-3.5 mb-3.5" data-precio-vuelo>
      <CajaDeDato rotulo="PRECIO" icono={{ eur: true }} datos="precio-vuelo" lapiz={<LapizDeReserva onClick={onCambiar} etiqueta="Cambiar el precio" datos="precio-vuelo" />}>
        <span data-precio-vuelo-texto>{texto}</span>
      </CajaDeDato>
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
  verBloque = 0,
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
  /** (10S10 §6) Cambia cada vez que DÍAS pide solo ver el bloque: se despliega, sin hoja. */
  verBloque?: number
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
  // (V64 §1) Añadir el billete: la hoja pequeña (subir o escribir), la lectura del archivo y «Revisa los datos» viven en `useFlujoDelBillete` (los mismos de HOY).
  // La hoja pequeña del precio.
  const [precioAbierto, setPrecioAbierto] = useState(false)
  const setLegPrecio = useRouteStore((state) => state.setLegPrecio)
  const ida = legOf(route, info, 'arrival')
  const vuelta = legOf(route, info, 'departure')
  const flujo = useFlujoDelBillete({ route, info, onCambioDeVuelo })
  const reservasDeMiViaje = useReservasParaMi()
  const setEscalas = useRouteStore((state) => state.setEscalas)
  const pedirArchivo = flujo.pedirArchivo
  const ciudad = route.days[0]?.city ?? route.destination
  const hecho = ida.done && vuelta.done
  const algoHecho = ida.done || vuelta.done
  // (6-nov) [Buscar vuelos]: mientras falte una mitad que se hace en avión, el botón del buscador (origen, destino y fechas del viaje).
  const faltaAvion = [ida, vuelta].some((l) => !l.done && l.mode === 'avion')
  // (10S4 §2) Listo = plegado (se abre al tocar la cabecera); mientras falta algo, abierto. Al quedar listo se vuelve a plegar solo.
  const [desplegadoUsuario, setDesplegadoUsuario] = useState<boolean | null>(null)
  // (10S10 §5, decisión de Eric, 1-nov) Cerrado al entrar SIEMPRE, falte lo que falte; solo se abre si el viajero toca la cabecera o el panel lo pide.
  const desplegado = desplegadoUsuario ?? false
  useEffect(() => {
    if (verBloque) setDesplegadoUsuario(true)
  }, [verBloque])
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
    setVueloAbierto(mitad)
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
  // (V76, R8b) Cada tramo de un vuelo con escala es su tarjeta («IDA · 1 DE 2», «IDA · 2 DE 2»); la de siempre es el tramo que toca el destino (el último de la ida, el primero de la vuelta). Sin escalas, nada cambia.
  const mitadConEscalas = (leg: LegState) => {
    const escalas = leg.done && leg.mode !== 'coche' ? escalasDe(route, leg.kind) : []
    const total = escalas.length + 1
    const esIda = leg.kind === 'arrival'
    const principal = <MitadGuardada key="principal" rotulo={escalas.length > 0 ? etiquetaDeTramo(leg.kind, esIda ? total : 1, total) : undefined} route={route} leg={leg} ciudad={ciudad} onCambiar={() => abrirHoja(leg.kind)} onQuitar={() => quitar(leg)} onAnadirTarjeta={pedirArchivo} onCambioDeVuelo={onCambioDeVuelo} />
    const tarjetas = escalas.map((e, i) => (
      <TarjetaDeEscala key={`escala-${i}`} route={route} leg={leg} indice={i} total={total} n={esIda ? i + 1 : i + 2} tramo={e} onCambiar={() => abrirHoja(leg.kind)} onQuitar={() => setEscalas(leg.kind, escalas.filter((_, j) => j !== i))} />
    ))
    return esIda ? [...tarjetas, principal] : [principal, ...tarjetas]
  }
  // (V76, R11c) Un tren o autobús unido a la llegada o a la vuelta, debajo de su vuelo: la tarjeta de billete con «TREN AL CENTRO» / «TREN AL AEROPUERTO» y sus tres iconos.
  const sitioDeLaMitad = (m: LegState): SitioDeLlegada => (m.mode === 'ferry' ? 'puerto' : m.mode === 'avion' ? 'aeropuerto' : 'estación')
  const unida = (r: Reservation, kind: LegKind) => (
    <div key={r.id} className="mx-3.5 mb-3" data-unida-a={kind}>
      <TarjetaDeReservaExtra route={route} reserva={r as ReservaExtra} rotulo={etiquetaDeUnion(r.kind === 'bus' ? 'bus' : 'tren', kind, sitioDeLaMitad(kind === 'arrival' ? ida : vuelta))} />
    </div>
  )
  const quitar = (leg: LegState) => {
    const teniaHora = Boolean(leg.time)
    quitarConDeshacer(`${leg.kind === 'arrival' ? 'Ida' : 'Vuelta'} quitada del viaje`, () => removeLeg(leg.kind))
    if (teniaHora) onCambioDeVuelo({ que: 'quitar', mitad: leg.kind })
  }

  return (
    <>
      <BloqueShell bloque="llegada">
        {!algoHecho ? (
          <>
            {/* (V50) Sin vuelos, como «Alojamiento»: plegado, solo la cabecera; abierto, «¿Ya tienes vuelo?» con [Añadir mi vuelo] (la hoja «Tu vuelo» de siempre) y «¿Aún no?» con [Buscar vuelos]. */}
            <CabeceraBloque icono={iconoDeMedio(ida.mode)} titulo="Llegada y vuelta" estado={etiqueta} hecho={false} abierto={desplegado} onClick={() => setDesplegadoUsuario(!desplegado)} atributos={{ 'data-llegada-vacia': '' }} className="px-4 py-4" />
            {desplegado && (
              <div data-llegada-vacia-abierta className="flex flex-col gap-2.5 px-4 pb-4">
                <span className="text-[14px] font-medium">{ida.mode === 'avion' ? '¿Ya tienes vuelo?' : '¿Ya tienes tu billete?'}</span>
                <button
                  type="button"
                  onClick={() => abrirHoja(primeraLibre)}
                  data-anadir-mi-vuelo
                  className="flex h-12 w-full items-center justify-center rounded-full border border-text/20 bg-white text-[14.5px] font-semibold text-text transition-transform active:scale-[.98]"
                >
                  {ida.mode === 'avion' ? 'Añadir mi vuelo' : 'Añadir mi billete'}
                </button>
                {faltaAvion && (
                  <>
                    <span className="mt-1 text-[14px] font-medium">¿Aún no?</span>
                    <BuscarVuelos route={route} />
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* (10S9 §1) La cabecera compartida, y SIEMPRE se puede cerrar, falte lo que falte (antes, con un vuelo sin poner no se cerraba). */}
            <CabeceraBloque icono={iconoDeMedio(ida.mode)} titulo="Llegada y vuelta" estado={hecho ? 'Listo' : etiqueta} hecho={hecho} abierto={desplegado} onClick={() => setDesplegadoUsuario(!desplegado)} atributos={{ 'data-llegada-cabecera': '' }} className="px-4 pb-3 pt-4" />
            {desplegado && (
              <>
            {mitadConEscalas(ida)}
            {unidasA(reservasDeMiViaje, 'arrival').map((r) => unida(r, 'arrival'))}
            {mitadConEscalas(vuelta)}
            {unidasA(reservasDeMiViaje, 'departure').map((r) => unida(r, 'departure'))}
            {hayVuelo && g.gente.length >= 2 && g.esAdmin && (
              <div className="flex flex-col gap-2.5 px-4 pb-3 pt-1" data-en-este-vuelo>
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
            {/* (V64 §4) El orden: los vuelos, el precio y [Buscar vuelos] abajo del todo. */}
            {hayVuelo && <FilaPrecio texto={precioTotal ? precioEnVista(precioTotal) : 'Sin poner'} onCambiar={() => setPrecioAbierto(true)} />}
            {faltaAvion && <BuscarVuelos route={route} className="mx-4 mb-4 w-[calc(100%-2rem)]" />}
              </>
            )}
          </>
        )}
      </BloqueShell>
      {flujo.nodos}
      {precioAbierto && (
        <HojaPrecio
          titulo={`Precio del ${legWord((ida.mode !== 'coche' ? ida : vuelta).mode).noun}`}
          etiqueta="¿Cuánto ha costado en total?"
          ayuda="Si compraste la ida y la vuelta por separado, pon la suma."
          inicial={precioTotal}
          onGuardar={(importe) => {
            const principal = ida.mode !== 'coche' ? ida : vuelta
            setLegPrecio(principal.kind, importe)
            if (ida.mode !== 'coche' && vuelta.mode !== 'coche') setLegPrecio(principal.kind === 'arrival' ? 'departure' : 'arrival', null)
          }}
          onClose={() => setPrecioAbierto(false)}
        />
      )}
      {vueloAbierto && (
        <HojaVueloDelAdmin
          route={route}
          ida={ida}
          vuelta={vuelta}
          ladoInicial={vueloAbierto}
          onCambiarArchivo={flujo.abrirHoja}
          onClose={() => {
            setVueloAbierto(null)
          }}
          onGuardar={(cambios, cambiosDeVuelo) => {
            guardarVueloDelAdmin(cambios)
            setVueloAbierto(null)
            onMitad(undefined)
            for (const cambio of cambiosDeVuelo) onCambioDeVuelo(cambio)
          }}
        />
      )}
    </>
  )
}
