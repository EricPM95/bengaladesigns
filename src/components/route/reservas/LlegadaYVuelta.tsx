import { useEffect, useRef, useState } from 'react'
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
import { leerBillete, type DatosBilleteLeido } from '../../../lib/billeteLeer'
import { ladoDesdeBillete } from '../../../lib/billeteAplicar'
import { etiquetaDeCiudadConEstacion, etiquetaDeCiudadConPunto, ejemploDeCiudadConAeropuerto, ejemploDeCiudadConEstacionEjemplo } from '../../../lib/aeropuertosCiudad'
import { HojaDatosDelBillete } from './HojaDatosDelBillete'
import { CabeceraDeMitad, CodigoPantallaCompleta, TarjetaBillete, filasDelBillete } from './TarjetaBillete'
import { LapizDeReserva, claveDocumentoDeMedio } from './BotonesDeReserva'
import { HojaPrecio } from './HojaPrecio'
import { fechaEnProsa } from '../../../lib/nombreDeDia'
import { abrirAvisoPase } from '../../../lib/avisoPase'
import { estadoDelPaseParaDocumentos } from '../../../lib/pago'

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
function MitadConBillete({ route, leg, ciudad, onCambiar, onQuitar, onAnadirTarjeta, onCambioDeVuelo }: { route: Route; leg: LegState; ciudad: string; onCambiar: () => void; onQuitar: () => void; onAnadirTarjeta: (kind: LegKind) => void; onCambioDeVuelo: EnCambioDeVuelo }) {
  const esIda = leg.kind === 'arrival'
  const { billete } = useBillete(leg.kind, leg.time)
  const [ampliado, setAmpliado] = useState(false)
  const [datosAbiertos, setDatosAbiertos] = useState(false)
  const [plegadaAbierta, setPlegadaAbierta] = useState(false)
  const ciudadFuera = ciudadDeSalida(route)
  const trayecto = trayectoDeLaMitad({ kind: esIda ? 'llegada' : 'vuelta', ciudadFuera, otroPunto: leg.otroPunto, ciudadRoma: ciudad, puntoRoma: leg.point })
  const horaFuera = leg.otraHora
  const duracion = useDuracionBillete({ llega: esIda, horaRoma: leg.time, horaFuera, fecha: leg.dateIso, avion: leg.mode === 'avion', ciudadFuera, iataFuera: billete?.codigoFuera ?? null })
  const fecha = leg.dateIso ? capitalizar(fechaLarga(leg.dateIso)) : `Día ${leg.dayNumber}`
  const filas = filasDelBillete(leg, billete, duracion)
  const salida = esIda ? horaFuera : leg.time
  const pie = [filas.find((f) => f.clave === 'asiento')?.texto, filas.find((f) => f.clave === 'numero')?.texto].filter(Boolean).join(' · ')
  // (B2c) La Ida de un día que ya pasó: una línea con la llegada, que siempre está (la salida es opcional y no sale).
  const pasada = esIda && Boolean(leg.dateIso && leg.dateIso < hoyIso())
  const plegada = pasada && !plegadaAbierta
  return (
    <>
      {plegada ? (
        <div data-mitad={leg.kind} data-mitad-hecha="1" data-mitad-plegada="1" className="mx-3.5 mb-3 px-4">
          <CabeceraDeMitad leg={leg} fecha={diaEntero(leg.dateIso) || fecha} resto={[leg.time, leg.point ? puntoCorto(leg.point) : ''].filter(Boolean).join(' · ')} onCambiar={onCambiar} onToggle={() => setPlegadaAbierta(true)} pasada />
        </div>
      ) : (
        <TarjetaBillete leg={leg} trayecto={trayecto} fecha={fecha} billete={billete} duracion={duracion} horaFuera={horaFuera} onCambiar={onCambiar} onQuitar={onQuitar} onAnadirTarjeta={() => onAnadirTarjeta(leg.kind)} onAmpliar={() => setAmpliado(true)} onDatos={() => setDatosAbiertos(true)} onToggle={pasada ? () => setPlegadaAbierta(false) : undefined} />
      )}
      {datosAbiertos && <HojaDatosDelBillete leg={leg} billete={billete} onClose={() => setDatosAbiertos(false)} onCambioDeVuelo={onCambioDeVuelo} />}
      {ampliado && billete?.codigo && (
        <CodigoPantallaCompleta codigo={billete.codigo} titulo={esIda ? `${ciudadFuera} → ${ciudad}` : `${ciudad} → ${ciudadFuera}`} cuando={[diaEntero(leg.dateIso), salida].filter(Boolean).join(' · ')} pie={pie} onClose={() => setAmpliado(false)} />
      )}
    </>
  )
}

/** Una mitad en la tarjeta guardada: con billete (avión, tren, autobús, barco), o la línea de coche, o «Falta la ida». */
function MitadGuardada({ route, leg, ciudad, onCambiar, onQuitar, onAnadirTarjeta, onCambioDeVuelo }: { route: Route; leg: LegState; ciudad: string; onCambiar: () => void; onQuitar: () => void; onAnadirTarjeta: (kind: LegKind) => void; onCambioDeVuelo: EnCambioDeVuelo }) {
  const esIda = leg.kind === 'arrival'
  const fecha = leg.dateIso ? capitalizar(fechaLarga(leg.dateIso)) : `Día ${leg.dayNumber}`
  const coche = leg.mode === 'coche'
  if (leg.done && !coche) return <MitadConBillete route={route} leg={leg} ciudad={ciudad} onCambiar={onCambiar} onQuitar={onQuitar} onAnadirTarjeta={onAnadirTarjeta} onCambioDeVuelo={onCambioDeVuelo} />
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

/** (10S8 §3, B1b-B1d) El precio, en su fila abajo del todo del bloque: «€ Precio total · 180 €» con su lápiz (solo ida o solo vuelta: «Precio · 180 €»). */
function FilaPrecio({ texto, onCambiar }: { texto: string; onCambiar: () => void }) {
  return (
    <div className="mx-3.5 mb-3.5 flex items-center gap-3 rounded-[18px] py-1.5 pl-3 pr-1" style={{ background: '#FBF3E2', border: '1px solid rgba(181,138,46,.35)' }} data-precio-vuelo>
      <span aria-hidden="true" className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full" style={{ background: '#F3E3B2', color: '#6E5018', font: "600 15px 'Geist'" }}>
        €
      </span>
      <span className="min-w-0 flex-1 text-[14.5px] font-semibold" data-precio-vuelo-texto style={{ color: INK }}>
        {texto}
      </span>
      <LapizDeReserva onClick={onCambiar} etiqueta="Cambiar el precio" datos="precio-vuelo" />
    </div>
  )
}

/** (10S8 §3) Lo que dice la app tras leer una tarjeta que no cuadra con lo puesto (la hora, la fecha) o que no se ha podido leer. Pequeño, abajo, con sus botones. */
interface AvisoLeido {
  /** `hora`: ¿actualizamos? [Sí, actualizar] [No]; `fecha` y `texto`: solo se entera [Vale]. */
  tipo: 'hora' | 'fecha' | 'texto'
  texto: string
  kind: LegKind
  hora?: string
}

function AvisoDeTarjeta({ aviso, onSi, onNo }: { aviso: AvisoLeido; onSi: () => void; onNo: () => void }) {
  return (
    <div role="alertdialog" aria-live="polite" data-aviso-tarjeta={aviso.tipo} className="fixed inset-x-0 bottom-24 z-[125] mx-auto flex w-[min(92vw,380px)] flex-col gap-3 rounded-[20px] px-4 py-3.5" style={{ background: '#FFFDF8', border: '1.5px solid #B58A2E', boxShadow: '0 18px 40px -16px rgba(28,34,48,.5)', color: INK }}>
      <p className="text-[14.5px] font-medium leading-[1.35]" data-aviso-tarjeta-texto>
        {aviso.texto}
      </p>
      <div className="flex gap-2">
        {aviso.tipo === 'hora' ? (
          <>
            <button type="button" onClick={onSi} data-aviso-tarjeta-si className="h-11 flex-1 rounded-full btn-champan text-[14.5px] font-bold">
              Sí, actualizar
            </button>
            <button type="button" onClick={onNo} data-aviso-tarjeta-no className="h-11 flex-1 rounded-full text-[14.5px] font-semibold" style={{ background: '#F5EFE4', color: INK }}>
              No
            </button>
          </>
        ) : (
          <button type="button" onClick={onNo} data-aviso-tarjeta-vale className="h-11 flex-1 rounded-full text-[14.5px] font-semibold" style={{ background: '#F5EFE4', color: INK }}>
            Vale
          </button>
        )}
      </div>
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
  // (10S5) Añadir el billete: el PDF, la foto o la captura se lee y rellena la hoja del vuelo para que el viajero la revise.
  const archivoRef = useRef<HTMLInputElement>(null)
  const archivoDe = useRef<LegKind>('arrival')
  const [leyendo, setLeyendo] = useState<LegKind | null>(null)
  const [lecturas, setLecturas] = useState(0)
  const [leido, setLeido] = useState<{ kind: LegKind; datos: DatosBilleteLeido } | null>(null)
  // (10S8 §3) Lo que dice la app tras leer una tarjeta que no cuadra (la hora, la fecha) o que no se ha podido leer; y la hoja pequeña del precio.
  const [aviso, setAviso] = useState<AvisoLeido | null>(null)
  const [precioAbierto, setPrecioAbierto] = useState(false)
  const setLegCodigo = useRouteStore((state) => state.setLegCodigo)
  const setLegCompania = useRouteStore((state) => state.setLegCompania)
  const setLegOtroPunto = useRouteStore((state) => state.setLegOtroPunto)
  const setLegOtraHora = useRouteStore((state) => state.setLegOtraHora)
  const setLegPrecio = useRouteStore((state) => state.setLegPrecio)
  const guardarVueloDelAdmin2 = useRouteStore((state) => state.guardarVueloDelAdmin)
  const tripId = useSyncStore((state) => state.activeTripId)
  const yoId = useViajeCompartido((state) => state.gente.find((p) => p.esYo)?.id ?? null)
  const ponerBillete = useBilleteStore((state) => state.poner)
  const ida = legOf(route, info, 'arrival')
  const vuelta = legOf(route, info, 'departure')
  const ciudad = route.days[0]?.city ?? route.destination
  const hecho = ida.done && vuelta.done
  const algoHecho = ida.done || vuelta.done
  // (10S4 §2) Listo = plegado (se abre al tocar la cabecera); mientras falta algo, abierto. Al quedar listo se vuelve a plegar solo.
  const [desplegadoUsuario, setDesplegadoUsuario] = useState<boolean | null>(null)
  // (10S10 §5, decisión de Eric, 1-nov) Cerrado al entrar SIEMPRE, falte lo que falte; solo se abre si el viajero toca la cabecera o el panel lo pide.
  const desplegado = desplegadoUsuario ?? false
  useEffect(() => {
    if (verBloque) setDesplegadoUsuario(true)
  }, [verBloque])
  const hayVuelo = (ida.done && ida.mode !== 'coche') || (vuelta.done && vuelta.mode !== 'coche')
  // (10S8, B1d) «Precio total» con la ida y la vuelta puestas; con solo una, «Precio».
  const ambos = ida.done && ida.mode !== 'coche' && vuelta.done && vuelta.mode !== 'coche'
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
    // (10S8 §2) Añadir un documento nuevo es del pase: sin él, el aviso pequeño (el botón ya lo hace; esto cierra «Cambiar el archivo» de la hoja del vuelo).
    if (estadoDelPaseParaDocumentos() === 'sin') {
      abrirAvisoPase(claveDocumentoDeMedio((kind === 'arrival' ? ida : vuelta).mode), { destino: route.destination })
      return
    }
    archivoDe.current = kind
    if (archivoRef.current) {
      archivoRef.current.value = ''
      archivoRef.current.click()
    }
  }
  const alElegirArchivo = async (archivo: File | undefined) => {
    if (!archivo) return
    const kind = archivoDe.current
    setLeyendo(kind)
    try {
      const medio = (kind === 'arrival' ? ida : vuelta).mode
      const datos = await leerBillete(archivo, { modo: medio === 'coche' ? undefined : medio })
      setLecturas((n) => n + 1)
      aplicarLeido(kind, datos)
    } finally {
      setLeyendo(null)
    }
  }
  /**
   * (10S8 §3) La tarjeta leída se guarda sola (el documento y sus datos son del viajero; ya no se abre la hoja del vuelo para revisarla). Lo que cambiaría el vuelo NO se cambia solo:
   *  · si la fecha de la tarjeta es otra → «Tu tarjeta es del viernes 27 y tu vuelo está el jueves 26. Revisa las fechas.» (no se toca ni la hora);
   *  · si la hora es otra → «Tu tarjeta dice que llegas a las 11:25. ¿Actualizamos la hora de tu vuelo?» [Sí, actualizar] [No]; «Sí» guarda la hora y, con pase, sale la alerta de la 10S7b.
   * Si el servidor dijo algo (límite, tamaño, sin pase: `avisoLectura`), eso es lo que se enseña.
   */
  const aplicarLeido = (kind: LegKind, datos: DatosBilleteLeido) => {
    const leg = kind === 'arrival' ? ida : vuelta
    const tarjeta = leg.mode === 'avion' ? 'tarjeta' : 'billete'
    const del = legWord(leg.mode).noun
    const aviso = datos.aviso
    const hayAlgo = Boolean(datos.numero || datos.horaSalida || datos.horaLlegada || datos.localizador || datos.asiento || datos.codigo || datos.fuentes.length > 0)
    if (!hayAlgo) {
      setAviso({ tipo: 'texto', kind, texto: aviso ?? `No hemos podido leer tu ${leg.mode === 'avion' ? 'tarjeta de embarque' : 'billete'}. Prueba con una captura.` })
      return
    }
    const ciudadFuera = ciudadDeSalida(route)
    const l = ladoDesdeBillete(leg, datos, ciudadFuera)
    const previo = useBilleteStore.getState().datos[kind] ?? null
    const limpio = (t: string | null | undefined) => t?.trim() || null
    if (l.codigo) setLegCodigo(kind, l.codigo)
    if (l.compania) setLegCompania(kind, l.compania)
    if (l.otroPunto && !leg.otroPunto && l.otroPunto.trim() !== ciudadFuera) setLegOtroPunto(kind, l.otroPunto)
    if (l.otraHora && !leg.otraHora) setLegOtraHora(kind, l.otraHora)
    const codigo = datos.codigo ? { texto: datos.codigo.texto, formato: datos.codigo.formato, imagen: datos.codigo.imagen, dibujo: datos.codigo.dibujo ?? null } : (previo?.codigo ?? null)
    ponerBillete(tripId, kind, {
      horaRoma: leg.time,
      localizador: limpio(l.localizador) ?? previo?.localizador ?? null,
      terminal: limpio(l.terminal) ?? previo?.terminal ?? null,
      asiento: limpio(l.asiento) ?? previo?.asiento ?? null,
      coche: limpio(l.coche) ?? previo?.coche ?? null,
      codigo,
      codigoFuera: l.codigoFuera ?? previo?.codigoFuera ?? null,
      dueno: yoId,
    })
    // La fecha de la tarjeta frente a la del vuelo (la de llegada en la ida; la de salida en la vuelta).
    const fechaTarjeta = kind === 'arrival' ? (datos.fechaLlegada ?? datos.fecha) : datos.fecha
    if (fechaTarjeta && leg.dateIso && fechaTarjeta !== leg.dateIso) {
      setAviso({ tipo: 'fecha', kind, texto: `Tu ${tarjeta} es del ${fechaEnProsa(fechaTarjeta)} y tu ${del} está el ${fechaEnProsa(leg.dateIso)}. Revisa las fechas.` })
      return
    }
    if (l.hora && l.hora !== leg.time) {
      setAviso({ tipo: 'hora', kind, hora: l.hora, texto: `Tu ${tarjeta} dice que ${kind === 'arrival' ? 'llegas' : 'sales'} a las ${l.hora}. ¿Actualizamos la hora de tu ${del}?` })
      return
    }
    if (aviso) setAviso({ tipo: 'texto', kind, texto: aviso })
  }
  const actualizarHora = () => {
    if (!aviso || aviso.tipo !== 'hora' || !aviso.hora) return
    const kind = aviso.kind
    const hora = aviso.hora
    guardarVueloDelAdmin2({ [kind]: { time: hora }, medio: legWord((kind === 'arrival' ? ida : vuelta).mode).noun })
    const guardado = useBilleteStore.getState().datos[kind]
    if (guardado) ponerBillete(tripId, kind, { ...guardado, horaRoma: hora })
    setAviso(null)
    onCambioDeVuelo({ que: 'hora', mitad: kind })
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
          <CabeceraBloque icono={iconoDeMedio(ida.mode)} titulo="Llegada y vuelta" estado={etiqueta} hecho={false} abierto={false} onClick={() => abrirHoja(primeraLibre)} atributos={{ 'data-llegada-vacia': '' }} className="p-4" />
        ) : (
          <>
            {/* (10S9 §1) La cabecera compartida, y SIEMPRE se puede cerrar, falte lo que falte (antes, con un vuelo sin poner no se cerraba). */}
            <CabeceraBloque icono={iconoDeMedio(ida.mode)} titulo="Llegada y vuelta" estado={hecho ? 'Listo' : etiqueta} hecho={hecho} abierto={desplegado} onClick={() => setDesplegadoUsuario(!desplegado)} atributos={{ 'data-llegada-cabecera': '' }} className="px-4 pb-3 pt-4" />
            {desplegado && (
              <>
            <MitadGuardada route={route} leg={ida} ciudad={ciudad} onCambiar={() => abrirHoja('arrival')} onQuitar={() => quitar(ida)} onAnadirTarjeta={pedirArchivo} onCambioDeVuelo={onCambioDeVuelo} />
            <MitadGuardada route={route} leg={vuelta} ciudad={ciudad} onCambiar={() => abrirHoja('departure')} onQuitar={() => quitar(vuelta)} onAnadirTarjeta={pedirArchivo} onCambioDeVuelo={onCambioDeVuelo} />
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
            {hayVuelo && <FilaPrecio texto={`${ambos ? 'Precio total' : 'Precio'} · ${precioTotal ? precioEnVista(precioTotal) : 'sin poner'}`} onCambiar={() => setPrecioAbierto(true)} />}
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
      {aviso && <AvisoDeTarjeta aviso={aviso} onSi={actualizarHora} onNo={() => setAviso(null)} />}
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
