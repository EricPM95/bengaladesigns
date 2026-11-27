import { useEffect, useMemo, useState } from 'react'
import type { Coordinates, DayPlan, Route, Stop } from '../../../../lib/types'
import { useRouteStore } from '../../../../store/useRouteStore'
import { useBilleteStore } from '../../../../store/useBilleteStore'
import { useBillete } from '../../../../hooks/useBillete'
import { ciudadDeSalida, diaEntero, ladoDeFuera } from '../../../../lib/billete'
import { puntoCorto, type ArrivalInfo, type ArrivalPoint } from '../../../../lib/arrivalReturn'
import { esDestinoDeCoche } from '../../../../lib/experienceCategoryBank'
import { displayStopName } from '../../../../lib/format'
import { segunGrupo } from '../../../../lib/viajaEnGrupo'
import { alCambiarElVuelo } from '../../../../lib/adaptarVuelos'
import { catalogoEnMemoria } from '../../../../lib/destinationPlacesApi'
import { hasRealCoordinates, haversineMeters, minutosEnCocheDeMetros } from '../../../../lib/distanceMock'
import { candidatosParaAnadir, proponerAnadir, stopDeCandidato, type Candidato, type Propuesta } from '../../../../lib/hoyCambiarPlan'
import { aplicarPropuesta } from '../../../../lib/hoyCambiarPlanAplicar'
import { horaCorta, minutosDe } from '../../../../lib/hoyParada'
import { Icono, IconoRuta } from '../../../ui/Icono'
import { ImagenDeLlegada } from '../../../ui/ImagenDeLlegada'
import { HojaDeHora } from '../../../ui/HojaDeHora'
import { BOTON_CLARO, BOTON_ORO } from '../../../ui/botonesOro'
import { Etiqueta } from '../piezas'
import { IconoDeDocumento } from '../../reservas/BotonesDeReserva'
import { AnadirDocumentoDeHoy } from '../../reservas/FlujoDelBillete'
import { CodigoPantallaCompleta } from '../../reservas/TarjetaBillete'
import type { MitadDeHoy } from '../llegadaVuelta'
import { CajaDeParada, NOMBRE_SOBRE_FOTO, PILDORA_FOTO, TARJETA_PARADA } from './ParadaHoy'
import { ParadaFotoDeParada } from './ParadaFoto'
import { HojaV2 } from './HojasV2'
import { HojaPropuesta, Titulo, useContexto } from './CambiarPlan'
import { LineaUbicacion } from './LineaUbicacion'
import { datosDeLaSalida } from './VueltaH14'
import { FilaDeUnion } from './FilaDeUnion'
import { useTrenUnido } from '../../../../hooks/useTrenUnido'
import { useBilletesDeExcursiones } from '../../../../hooks/useBilleteExcursion'
import { excursionConCodigo } from '../../../../store/useBilleteStore'
import { useReservasFocusStore } from '../../../../store/useReservasFocusStore'
import { tramoQueToca, tramosDeLaMitad } from '../../../../lib/escalasYUnion'

/**
 * (V70; Design «El día de la vuelta en HOY», VL1 a VL5) LA TARJETA DE LA VUELTA: la tarjeta de la llegada (V62, `TarjetaDeLlegada`) en versión vuelta. Sustituye a la tarjeta oscura «Hoy vuelves a casa» de la V57
 * y a su bloque «SAL HACIA EL AEROPUERTO» (la hora va en la caja SALIR). Su cuenta es la misma de siempre (`datosDeLaSalida`: UNA sola para la tarjeta, el aviso de «hoy no te da tiempo» y el «Buen viaje»).
 *  · Imagen fija, etiqueta «VUELTA», «Hoy vuelves a casa» y el QR (52 px: dorado con la tarjeta de embarque guardada, gris con «+» si falta; la MISMA pieza que la llegada).
 *  · La línea del billete (VUELO VY6105 · Viernes 27 · 19:30 FCO ✈ 21:45 BCN; con retraso, la hora vieja tachada), la fila del vuelo (TERMINAL / ASIENTO / REF, solo con dato) y la de abajo:
 *    SALIR («16:30 · Hacia el aeropuerto») · AEROPUERTO («35 min · Leonardo Express»; en Lanzarote, la devolución del coche) · ANTES («2 paradas · Trastevere primero» o «TU DÍA · Sin paradas · Hoy toca volver»).
 *  · [Salgo hacia el aeropuerto] y [Vuelo retrasado] (tren, autobús, barco: [Salgo hacia la estación…] y [Tren retrasado]…), y «Cómo llegar al aeropuerto».
 *  · Tras [Salgo…]: «● DE CAMINO AL AEROPUERTO», las dos filas se quedan y [Cómo llegar al aeropuerto] dorado de punta a punta. Ya en el aeropuerto (GPS, o pasado el trayecto desde que salió): «● YA EN EL AEROPUERTO»,
 *    solo la fila del vuelo y [Ver mi tarjeta de embarque] con el icono del QR.
 *  · [Vuelo retrasado]: «¿A qué hora sale ahora?» (la rueda empieza en la hora del vuelo); al guardar, la hora nueva sustituye a la vieja EN LA RESERVA de RESERVAS (`retrasarSalida`), SALIR se recalcula y sale la hoja de la V61.
 *  · Debajo, con 1 h 30 o más libres antes de salir (VL1c): «Tienes hasta las 16:30 antes de salir hacia el aeropuerto» (con paradas, «Aún te queda tiempo antes de las 16:30»), [Añadir algo cerca] y «Ver en Explorar». Vuelo temprano (VL2): sin ella.
 * REGLA «HOY y RESERVAS, los mismos datos» (CLAUDE.md): aquí no se guarda NADA aparte de «ya he salido» (un recuerdo de este móvil, por viaje y día). Todo lo demás sale de la ruta y del billete guardado (`useBillete('departure')`).
 * Consultas a Supabase: ninguna (todo sale de la ruta, del billete en el móvil y del catálogo del destino que ya está en memoria).
 */
const TRAZO = {
  terminal: 'M4 21V9l8-5 8 5v12M9 21v-7h6v7',
  asiento: 'M7 4h6a2 2 0 0 1 2 2v7H7zM15 13h3a2 2 0 0 1 2 2v3H9M9 18v3M18 18v3',
  ref: 'M3 7h18v10H3zM9 7v10M13 10h4M13 14h3',
  salir: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  centro: 'M5 4h14a1 1 0 0 1 1 1v11H4V5a1 1 0 0 1 1-1zM4 11h16M7 19v2M17 19v2M8 15h.01M16 15h.01',
  dia: 'M7 3v3M17 3v3M4 8h16v12H4zM8 13h3',
  coche: 'M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11M3 11h18v6H3zM6 17v2M18 17v2M7.5 14h.01M16.5 14h.01',
  avion: 'M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z',
  tren: 'M7 3h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM4 11h16M8 21l2-3M16 21l-2-3M8.5 14.5h.01M15.5 14.5h.01',
  barco: 'M3 17l2 3h14l2-3M5 17l1-6h12l1 6M12 11V4M12 4l4 3-4 1',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2z',
}

const MEDIO_DEL_BILLETE: Record<string, string> = { avion: 'vuelo', tren: 'tren', bus: 'autobús', ferry: 'barco' }
const sinAcentos = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
/** Lo que más cerca de «libre» se cuenta como tiempo libre antes de salir: 1 h 30 (Eric, V70). */
export const MINUTOS_LIBRES_PARA_LA_TARJETA = 90

const claveDeSalida = (route: Route, dateIso: string) => `trazo:hoy:salio:${route.id}:${dateIso}`
/** Los minutos del reloj a los que pulsó [Salgo hacia el aeropuerto] (un recuerdo de este móvil, por viaje y día). */
function leerSalida(route: Route, dateIso: string): number | null {
  try {
    const v = localStorage.getItem(claveDeSalida(route, dateIso))
    return v == null ? null : Number(v)
  } catch {
    return null
  }
}

/** (V74, 35) El minuto en que ya estabas EN EL AEROPUERTO (GPS, o pasado el trayecto desde [Salgo hacia…]): un recuerdo de este móvil, por viaje y día. El resumen del viaje sale 2 horas después. */
const claveEnElSitio = (route: Route, dateIso: string) => `trazo:hoy:enaeropuerto:${route.id}:${dateIso}`
export function leerEnElSitio(route: Route, dateIso: string): number | null {
  try {
    const v = localStorage.getItem(claveEnElSitio(route, dateIso))
    if (v != null) return Number(v)
    const s = leerSalida(route, dateIso)
    return s == null ? null : s + 30 // el trayecto que la tarjeta da por defecto (`salida.trayectoMin ?? 30`)
  } catch {
    return null
  }
}

function sitioDeFuera(route: Route): string {
  const t = ladoDeFuera(ciudadDeSalida(route), route.departureOtroPunto)
  const m = /\((.+)\)\s*$/.exec(t)
  return m ? m[1].trim() : ''
}

/** «35 min» y «Leonardo Express»: el traslado más cómodo del punto (los datos del destino; sin cifras inventadas). */
function trasladoDe(point: ArrivalPoint | null): { grande: string; sub: string } | null {
  if (!point) return null
  const opcion = point.al_centro.find((o) => o.mas_comodo && !o.no_enseñar) ?? point.al_centro.find((o) => !o.no_enseñar) ?? null
  if (!opcion) return null
  const m = /(\d+(?:\s?-\s?\d+)?)\s*min/i.exec(opcion.tiempo ?? '')
  const nombre = opcion.nombre.replace(/\s+a Termini.*$/i, '').replace(/\s*\(.*$/, '').replace(/\s+desde\s+.*$/i, '').trim()
  return { grande: m ? `${m[1].replace(/\s/g, '')} min` : '', sub: nombre }
}

export function TarjetaDeVuelta({ route, day, dateIso, mitad, info, paradas, ubicacionReal, desde, ahoraMin, onVerComoIr, onVerExplorar }: { route: Route; day: DayPlan; dateIso: string; mitad: MitadDeHoy; info: ArrivalInfo; /** Las paradas del día que siguen en pie. */ paradas: Stop[]; /** El GPS crudo (para saber si ya estás en el aeropuerto). */ ubicacionReal: Coordinates | null; /** De dónde se cuentan los sitios de «Añadir algo cerca»: el alojamiento (o donde estás, si estás en la ruta). */ desde: Coordinates | null; ahoraMin: number; onVerComoIr: () => void; onVerExplorar: () => void }) {
  const [salioMin, setSalioMin] = useState<number | null>(() => leerSalida(route, dateIso))
  const [hoja, setHoja] = useState(false)
  const [ampliado, setAmpliado] = useState(false)
  const [vezAnadir, setVezAnadir] = useState(0)
  const [cerca, setCerca] = useState(false)
  const billete = mitad.billete
  const { billete: guardado, tripId } = useBillete('departure', billete?.horaRoma ?? null)
  const trenUnido = useTrenUnido('departure') // (V76) el tren o autobús unido a la vuelta (de RESERVAS)
  const salida = datosDeLaSalida({ route, day, mitad, info, tren: trenUnido })
  // (V76) El QR de HOY es el del tramo que toca a esta hora (vuelo con escalas: el primero hasta que sale, luego el siguiente).
  const billetesEscala = useBilletesDeExcursiones()
  const tramos = tramosDeLaMitad(route, 'departure', { salida: route.departureFlightTime ?? null, llegada: route.departureOtraHora ?? null, compania: route.departureCompania ?? '', codigo: route.departureCodigo ?? '', desde: '', hasta: '' })
  const tramoDeHoy = tramos.length > 1 ? tramoQueToca(tramos, ahoraMin) : null
  const escalaDeHoy = tramoDeHoy && !tramoDeHoy.principal ? tramoDeHoy : null
  const billeteDeEscala = escalaDeHoy ? billetesEscala.de(escalaDeHoy.clave) : null
  const modo = mitad.mode
  const propio = modo === 'coche'
  const enCoche = esDestinoDeCoche(route.destination)
  const tipo = modo === 'avion' || propio ? 'avion' : 'tren'
  const sitio = salida.sitio ?? (modo === 'avion' ? 'aeropuerto' : modo === 'ferry' ? 'puerto' : 'estación')
  const alSitio = sitio === 'aeropuerto' ? 'al aeropuerto' : sitio === 'puerto' ? 'al puerto' : 'a la estación'
  const enElSitio = sitio === 'aeropuerto' ? 'EN EL AEROPUERTO' : sitio === 'puerto' ? 'EN EL PUERTO' : 'EN LA ESTACIÓN'
  const hayQr = escalaDeHoy ? excursionConCodigo(billeteDeEscala) : Boolean(guardado?.codigo && (guardado.codigo.dibujo || guardado.codigo.imagen))
  const codigoDeHoy = escalaDeHoy ? (billeteDeEscala?.codigo ?? null) : (guardado?.codigo ?? null)
  const retraso = route.departureRetraso && route.departureRetraso.para === route.departureFlightTime && route.departureRetraso.antes && route.departureRetraso.antes !== route.departureRetraso.para ? route.departureRetraso.antes : null
  const dentroDelSitio = Boolean(ubicacionReal && mitad.point?.coordenadas && hasRealCoordinates(mitad.point.coordenadas) && haversineMeters(ubicacionReal, mitad.point.coordenadas) <= 1500)
  const trayecto = salida.trayectoMin ?? 30
  const yaEnElSitio = dentroDelSitio || (salioMin != null && ahoraMin >= salioMin + trayecto)
  const decamino = salioMin != null && !yaEnElSitio
  // (V74, 35) Se apunta UNA vez el minuto en que ya estás en el aeropuerto (para sacar el resumen del viaje 2 h después, aunque la tarjeta ya no esté en pantalla).
  useEffect(() => {
    if (!yaEnElSitio) return
    try {
      const k = claveEnElSitio(route, dateIso)
      if (localStorage.getItem(k) == null) localStorage.setItem(k, String(dentroDelSitio || salioMin == null ? ahoraMin : salioMin + trayecto))
    } catch {
      /* sin almacenamiento: queda la hora del vuelo */
    }
  }, [yaEnElSitio]) // eslint-disable-line react-hooks/exhaustive-deps

  const marcarSalida = () => {
    setSalioMin(ahoraMin)
    try {
      localStorage.setItem(claveDeSalida(route, dateIso), String(ahoraMin))
    } catch {
      /* sin almacenamiento: queda hasta cerrar */
    }
  }
  const guardarHora = (hora: string | null) => {
    if (!hora) return
    // La MISMA reserva que RESERVAS: la hora de salida pasa a la nueva, y el billete guardado la sigue para no perder su QR.
    useRouteStore.getState().retrasarSalida(hora, { medio: MEDIO_DEL_BILLETE[modo] })
    const previo = useBilleteStore.getState().datos.departure
    if (previo) useBilleteStore.getState().poner(tripId, 'departure', { ...previo, horaRoma: hora })
    // Con la hora nueva, sale la hoja «¿Adaptamos tus días a tu vuelo?» (la de la V61) si adaptar cambiaría algo.
    void alCambiarElVuelo({ que: 'hora', mitad: 'departure' })
  }

  // ── La línea del billete ──
  const numero = route.departureCodigo?.replace(/\s+/g, '').toUpperCase() ?? ''
  const palabra = { avion: 'VUELO', tren: 'TREN', bus: 'AUTOBÚS', ferry: 'BARCO', coche: 'COCHE' }[modo]
  const encabezado = billete ? (numero ? `${palabra} ${numero}` : palabra) : ''
  const diaTexto = diaEntero(dateIso)

  // ── La fila del vuelo (solo las cajas con dato) ──
  const fuera = sitioDeFuera(route)
  const cajasDelVuelo: { dato: string; trazo: string; etiqueta: string; grande: string; sub: string }[] = []
  if (billete) {
    const esVuelo = modo === 'avion'
    const lugar = guardado?.terminal?.trim() || ''
    const punto = mitad.point ? puntoCorto(mitad.point) : ''
    if (lugar) cajasDelVuelo.push({ dato: 'terminal', trazo: TRAZO.terminal, etiqueta: esVuelo ? 'TERMINAL' : modo === 'bus' ? 'PARADA' : modo === 'ferry' ? 'PUERTO' : 'ESTACIÓN', grande: lugar, sub: punto && !sinAcentos(punto).includes(sinAcentos(lugar)) ? punto : '' })
    const cocheTren = guardado?.coche?.trim() ? (/^coche/i.test(guardado.coche.trim()) ? guardado.coche.trim() : `Coche ${guardado.coche.trim()}`) : ''
    const asiento = [cocheTren, guardado?.asiento?.trim() ?? ''].filter(Boolean).join(' · ')
    if (asiento) cajasDelVuelo.push({ dato: 'asiento', trazo: TRAZO.asiento, etiqueta: 'ASIENTO', grande: asiento, sub: '' })
    const compania = route.departureCompania?.trim() ?? ''
    const localizador = guardado?.localizador?.trim() ?? ''
    if (compania || localizador) cajasDelVuelo.push({ dato: 'ref', trazo: TRAZO.ref, etiqueta: 'REF', grande: compania || localizador, sub: compania ? localizador : '' })
  }

  // ── La fila de abajo: SALIR · AEROPUERTO · ANTES ──
  const traslado = trasladoDe(mitad.point)
  const horaDeSalir = salida.hasta ? horaCorta(salida.hasta) : null
  const primera = paradas[0] ?? null
  const cajasDeAbajo: { dato: string; trazo: string; etiqueta: string; grande: string; sub: string }[] = []
  const destinoDelTrayecto = salida.viaEstacion ? (trenUnido?.kind === 'bus' ? 'Hacia la parada' : 'Hacia la estación') : sitio === 'aeropuerto' ? 'Hacia el aeropuerto' : sitio === 'puerto' ? 'Hacia el puerto' : 'Hacia la estación'
  if (horaDeSalir) cajasDeAbajo.push({ dato: 'salir', trazo: TRAZO.salir, etiqueta: 'SALIR', grande: horaDeSalir, sub: destinoDelTrayecto })
  else if (enCoche && salida.limiteT1) cajasDeAbajo.push({ dato: 'salir', trazo: TRAZO.salir, etiqueta: 'SALIR', grande: `Antes de las ${horaCorta(salida.limiteT1)}`, sub: 'Hora límite del coche' })
  if (enCoche) {
    // En Lanzarote el aeropuerto es la devolución del coche (la hora límite, del motor).
    cajasDeAbajo.push({ dato: 'aeropuerto', trazo: TRAZO.coche, etiqueta: 'AEROPUERTO', grande: 'Devuelve el coche', sub: ['en la T1', salida.limiteT1 ? `antes de las ${horaCorta(salida.limiteT1)}` : ''].filter(Boolean).join(' · ') })
  } else if (trenUnido) {
    // (V76) Con un tren o autobús unido: «17:05 · Leonardo Express» (su hora y su nombre, de la reserva de RESERVAS).
    cajasDeAbajo.push({ dato: 'aeropuerto', trazo: TRAZO.centro, etiqueta: sitio === 'aeropuerto' ? 'AEROPUERTO' : sitio === 'puerto' ? 'PUERTO' : 'ESTACIÓN', grande: horaCorta(trenUnido.time), sub: (trenUnido.compania ?? '').trim() || trenUnido.name })
  } else {
    // «35 min · Leonardo Express»: el tiempo del traslado que se nombra (dato del destino); sin él, el trayecto que cuenta SALIR.
    const minutos = traslado?.grande || (salida.trayectoMin != null ? `${salida.trayectoMin} min` : '')
    if (minutos || traslado?.sub) cajasDeAbajo.push({ dato: 'aeropuerto', trazo: TRAZO.centro, etiqueta: sitio === 'aeropuerto' ? 'AEROPUERTO' : sitio === 'puerto' ? 'PUERTO' : 'ESTACIÓN', grande: minutos || traslado?.sub || '', sub: minutos ? (traslado?.sub ?? '') : '' })
  }
  cajasDeAbajo.push(paradas.length === 0
    ? { dato: 'antes', trazo: TRAZO.dia, etiqueta: 'TU DÍA', grande: 'Sin paradas', sub: 'Hoy toca volver' }
    : { dato: 'antes', trazo: TRAZO.dia, etiqueta: 'ANTES', grande: paradas.length === 1 ? '1 parada' : `${paradas.length} paradas`, sub: primera ? `${displayStopName(primera.name)} primero` : '' })

  // ── Los botones ──
  const palabraRetrasado = modo === 'avion' ? 'Vuelo retrasado' : modo === 'tren' ? 'Tren retrasado' : modo === 'bus' ? 'Autobús retrasado' : modo === 'ferry' ? 'Ferry retrasado' : segunGrupo('Hemos salido tarde', 'He salido tarde')
  const textoSalgo = sitio === 'aeropuerto' ? segunGrupo('Salimos hacia el aeropuerto', 'Salgo hacia el aeropuerto') : sitio === 'puerto' ? segunGrupo('Salimos hacia el puerto', 'Salgo hacia el puerto') : segunGrupo('Salimos hacia la estación', 'Salgo hacia la estación')
  const textoComoLlegar = `Cómo llegar ${alSitio}`
  const columnas = (n: number) => ({ gridTemplateColumns: `repeat(${Math.max(n, 2)}, minmax(0, 1fr))` }) as const
  const etiqueta = yaEnElSitio ? `YA ${enElSitio}` : decamino ? `DE CAMINO ${alSitio.toUpperCase()}` : 'VUELTA'
  const textoVerBillete = modo === 'avion' ? segunGrupo('Ver mi tarjeta de embarque', 'Ver mi tarjeta de embarque') : 'Ver mi billete'
  const irAReservas = () => {
    useRouteStore.getState().setMode('bookings')
    useReservasFocusStore.getState().pedir('llegada', 'departure')
  }
  const abrirDocumento = () => (hayQr ? setAmpliado(true) : escalaDeHoy ? irAReservas() : setVezAnadir((v) => v + 1))

  // ── El tiempo libre (VL1c): lo que queda antes de salir, desde que acaba lo que falta por hacer ──
  const saleMin = minutosDe(salida.hasta)
  const finDeLoQueFalta = paradas.filter((s) => !s.checkedInAt).reduce((m, s) => Math.max(m, (minutosDe(s.time) ?? 0) + (s.durationMinutes || 30)), 0)
  const libreDesde = Math.max(ahoraMin, finDeLoQueFalta)
  const libreMin = saleMin != null ? saleMin - libreDesde : 0
  const conTiempoLibre = salioMin == null && libreMin >= MINUTOS_LIBRES_PARA_LA_TARJETA && horaDeSalir != null

  return (
    <>
      <div data-hoy-vuelta-tarjeta data-hoy-vuelta-estado={yaEnElSitio ? 'en-el-sitio' : decamino ? 'de-camino' : 'antes'} data-hoy-vuelta-modo={modo} data-tarjeta="clara" className="flex-none overflow-hidden rounded-[28px]" style={TARJETA_PARADA}>
        <div data-hoy-foto-parada className="relative overflow-hidden" style={{ height: conTiempoLibre ? 120 : 150 }}>
          <ImagenDeLlegada tipo={tipo} />
          <span className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,.14) 0%,rgba(0,0,0,0) 40%,rgba(0,0,0,.38))' }} />
          <span data-hoy-insignia className="absolute left-3.5 top-3.5 flex h-7 items-center gap-2 rounded-full px-[13px]" style={{ ...PILDORA_FOTO, font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.14em' }}>
            {(decamino || yaEnElSitio) && <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#4CC46E', animation: 'hoyYaPulse 2s infinite' }} />}
            {etiqueta}
          </span>
          {billete && (
            <span className="absolute right-3.5 top-3">
              <IconoDeDocumento grande hay={hayQr} tipo="qr" onAbrir={() => setAmpliado(true)} onAnadir={() => (escalaDeHoy ? irAReservas() : setVezAnadir((v) => v + 1))} etiqueta={hayQr ? 'Ver el código en grande' : `Añade tu ${modo === 'avion' ? 'tarjeta de embarque' : 'billete'}`} datos="billete-vuelta" />
            </span>
          )}
          <span data-hoy-vuelta-titulo className="absolute inset-x-[18px] bottom-3.5 text-left" style={NOMBRE_SOBRE_FOTO}>
            Hoy vuelves a casa
          </span>
        </div>
        <div className="flex flex-col gap-3 px-3.5 pb-4 pt-3.5">
          {billete && (
            <div data-hoy-vuelta-billete className="flex flex-col gap-1.5 px-0.5 pb-1 pt-0.5">
              <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.12em', color: 'rgba(28,34,48,.55)', textTransform: 'uppercase' }}>{[encabezado, diaTexto].filter(Boolean).join(' · ')}</span>
              <div className="flex items-center gap-2.5">
                <span className="flex min-w-0 flex-col gap-px">
                  <span className="flex items-baseline gap-[7px]">
                    {retraso && <span data-hoy-vuelta-hora-vieja style={{ font: "500 15px 'Geist'", color: 'rgba(28,34,48,.4)', textDecoration: 'line-through' }}>{retraso}</span>}
                    <span data-hoy-vuelta-salida style={{ font: "400 32px/1 'Instrument Serif',serif" }}>{billete.horaRoma}</span>
                  </span>
                  <span style={{ font: "600 11.5px 'Geist Mono',monospace", letterSpacing: '.08em', color: 'rgba(28,34,48,.6)', whiteSpace: 'nowrap' }}>{billete.codigoRoma}</span>
                </span>
                <span className="relative flex h-6 min-w-[20px] flex-1 items-center" aria-hidden="true">
                  <span className="absolute inset-x-0 top-1/2" style={{ borderTop: '2px dotted rgba(181,138,46,.7)' }} />
                  <span className="relative mx-auto flex h-[26px] w-[26px] items-center justify-center rounded-full" style={{ background: '#FFFDF8' }}>
                    <IconoRuta d={modo === 'avion' ? TRAZO.avion : modo === 'ferry' ? TRAZO.barco : TRAZO.tren} size={17} grosor={1.8} className="text-[#8A6A2C]" />
                  </span>
                </span>
                <span className="flex min-w-0 flex-col items-end gap-px">
                  <span data-hoy-vuelta-llegada style={{ font: "400 32px/1 'Instrument Serif',serif" }}>{billete.horaOtra ?? ' '}</span>
                  <span style={{ font: "600 11.5px 'Geist Mono',monospace", letterSpacing: '.08em', color: 'rgba(28,34,48,.6)', whiteSpace: 'nowrap' }}>{billete.codigoOtro ?? (fuera || ' ')}</span>
                </span>
              </div>
            </div>
          )}
          {cajasDelVuelo.length > 0 && (
            <div data-hoy-cajas-vuelo className="grid gap-2" style={columnas(3)}>
              {cajasDelVuelo.map((c) => (
                <CajaDeParada key={c.dato} dato={c.dato} trazo={c.trazo} etiqueta={c.etiqueta} grande={c.grande} sub={c.sub} />
              ))}
            </div>
          )}
          {trenUnido && !yaEnElSitio && <FilaDeUnion reserva={trenUnido} mitad="departure" />}
          {!yaEnElSitio && (
            <div data-hoy-cajas className="grid gap-2" style={columnas(cajasDeAbajo.length)}>
              {cajasDeAbajo.map((c) => (
                <CajaDeParada key={c.dato} dato={c.dato} trazo={c.trazo} etiqueta={c.etiqueta} grande={c.grande} sub={c.sub} />
              ))}
            </div>
          )}
          {yaEnElSitio ? (
            <button type="button" onClick={abrirDocumento} data-hoy-ver-embarque className="flex h-[54px] items-center justify-center gap-[9px] rounded-2xl text-[15px] font-bold" style={BOTON_ORO}>
              <IconoRuta d={TRAZO.qr} size={18} grosor={2} />
              {textoVerBillete}
            </button>
          ) : decamino ? (
            <button type="button" onClick={onVerComoIr} data-hoy-vuelta-como-llegar className="flex h-[54px] items-center justify-center gap-[9px] rounded-2xl text-[15px] font-bold" style={BOTON_ORO}>
              <Icono nombre="localizar" size={18} grosor={2} />
              {textoComoLlegar}
            </button>
          ) : (
            <>
              <div className="flex gap-2.5">
                <button type="button" onClick={marcarSalida} data-hoy-salgo className="flex h-[50px] flex-1 items-center justify-center whitespace-normal rounded-2xl px-2.5 text-center text-[14.5px] font-bold leading-[1.15]" style={BOTON_ORO}>
                  {textoSalgo}
                </button>
                <button type="button" onClick={() => setHoja(true)} data-hoy-vuelo-retrasado className="flex h-[50px] flex-[1.1] items-center justify-center whitespace-nowrap rounded-2xl px-2.5 text-[14px] font-bold" style={BOTON_CLARO}>
                  {palabraRetrasado}
                </button>
              </div>
              <button type="button" onClick={onVerComoIr} data-hoy-vuelta-enlace className="zona-toque -mt-0.5 flex min-h-11 items-center justify-center self-center text-[13px] font-semibold underline underline-offset-[3px]" style={{ color: '#6E5018' }}>
                {textoComoLlegar}
              </button>
            </>
          )}
        </div>
      </div>
      {conTiempoLibre && (
        <div data-hoy-tiempo-libre className="flex flex-none flex-col gap-3 rounded-[22px] p-3.5" style={{ background: '#FBF3E2', border: '1px solid rgba(181,138,46,.5)' }}>
          <span data-hoy-tiempo-libre-titulo style={{ font: "400 22px/1.15 'Instrument Serif',serif", textWrap: 'balance' as never }}>
            {paradas.length === 0 ? `Tienes hasta las ${horaDeSalir} antes de salir ${alSitio}` : `Aún te queda tiempo antes de las ${horaDeSalir}`}
          </span>
          <button type="button" onClick={() => setCerca(true)} data-hoy-anadir-cerca className="flex h-[50px] items-center justify-center gap-[9px] rounded-2xl text-[15px] font-bold" style={BOTON_ORO}>
            <Icono nombre="anadir" size={17} grosor={2.2} />
            Añadir algo cerca
          </button>
          <button type="button" onClick={onVerExplorar} data-hoy-ver-explorar className="zona-toque flex min-h-11 items-center justify-center self-center text-[13px] font-semibold underline underline-offset-[3px]" style={{ color: '#6E5018' }}>
            Ver en Explorar
          </button>
        </div>
      )}
      {hoja && (
        <HojaDeHora
          titulo="¿A qué hora sale ahora?"
          valor={route.departureFlightTime ?? null}
          inicial={route.departureFlightTime ?? '12:00'}
          quitable={false}
          onElegir={guardarHora}
          onCerrar={() => setHoja(false)}
        />
      )}
      {cerca && saleMin != null && <HojaAnadirAntesDeSalir route={route} day={day} dateIso={dateIso} desde={desde} ubicacionEnRuta={ubicacionReal} enCoche={enCoche} ahoraMin={ahoraMin} minutosLibres={libreMin} horaDeSalir={horaDeSalir as string} onVerExplorar={onVerExplorar} onCerrar={() => setCerca(false)} />}
      {vezAnadir > 0 && <AnadirDocumentoDeHoy key={vezAnadir} route={route} kind="departure" mode={modo} />}
      {ampliado && codigoDeHoy && (
        <CodigoPantallaCompleta
          codigo={codigoDeHoy}
          titulo={`${billete?.codigoRoma ?? ''} → ${ciudadDeSalida(route)}`}
          cuando={[diaTexto, billete?.horaRoma].filter(Boolean).join(' · ')}
          pie={[guardado.asiento ? `Asiento ${guardado.asiento}` : null].filter(Boolean).join(' · ')}
          onClose={() => setAmpliado(false)}
        />
      )}
    </>
  )
}

/**
 * (V70, VL1c) «Añadir un sitio cercano» desde el tiempo libre de antes de salir: la misma hoja y las mismas cuentas de «Añadir un sitio cercano» de [Cambiar plan] (`candidatosParaAnadir`, `proponerAnadir`, `HojaPropuesta`),
 * pero SOLO con lo que está ABIERTO ahora y CABE antes de la hora de salir (la visita más lo que se tarda en llegar y en volver), contado desde el alojamiento o desde donde estás.
 * Consultas a Supabase: ninguna (catálogo del destino en memoria; las fotos las pide la pieza de siempre, una vez por sitio).
 */
function HojaAnadirAntesDeSalir({ route, day, dateIso, desde, ubicacionEnRuta, enCoche, ahoraMin, minutosLibres, horaDeSalir, onVerExplorar, onCerrar }: { route: Route; day: DayPlan; dateIso: string; desde: Coordinates | null; ubicacionEnRuta: Coordinates | null; enCoche: boolean; ahoraMin: number; minutosLibres: number; horaDeSalir: string; onVerExplorar: () => void; onCerrar: () => void }) {
  const ctx = useContexto(route, enCoche)
  const lugares = catalogoEnMemoria(route.destination)?.places ?? []
  const [propuestas, setPropuestas] = useState<Propuesta[]>([])
  const [indice, setIndice] = useState(0)
  const [titulo, setTitulo] = useState('Añadir un sitio cercano')
  const [vacio, setVacio] = useState<string | undefined>(undefined)
  const [paso, setPaso] = useState<'lista' | 'propuesta'>('lista')
  const origen = desde ?? ubicacionEnRuta
  const piePorMin = enCoche ? 667 / 1.35 : 80
  const candidatos = useMemo<Candidato[]>(() => {
    const lista = candidatosParaAnadir({ route, lugares, desde: origen, logros: new Set<string>(), enCoche, ahoraMin, day, fechaIso: dateIso, mes: route.answers.month ?? null, ctx, limite: 12 })
    // Cabe antes de salir: ir + visita + volver, y si cierra pronto, solo una visita corta.
    return lista.filter((c) => !c.deOtroDia && c.duracionMin + 2 * Math.ceil(c.metros / piePorMin) <= minutosLibres && !(c.estado?.cierraPronto && c.duracionMin > 30)).slice(0, 6)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.id, day.id, ahoraMin, minutosLibres])
  const elegir = (c: Candidato) => {
    const lista = proponerAnadir({ route, day, stop: stopDeCandidato(c), ctx, ahoraMin }).map((x) => ({ ...x, avisoTexto: `${displayStopName(c.nombre)}, añadida a tu día` }))
    setTitulo('Añadir un sitio cercano')
    setPropuestas(lista)
    setIndice(0)
    setVacio(`Hoy no cabe ${displayStopName(c.nombre)} antes de salir. Mejor déjalo para otro momento.`)
    setPaso('propuesta')
  }
  const aplicar = (pr: Propuesta) => {
    aplicarPropuesta(route.id, dateIso, pr)
    onCerrar()
  }
  if (paso === 'propuesta') return <HojaPropuesta titulo={titulo} propuestas={propuestas} indice={indice} vacio={vacio} onOtra={() => setIndice((i) => (i + 1) % Math.max(propuestas.length, 1))} onAplicar={aplicar} onCerrar={onCerrar} />
  return (
    <HojaV2 onCerrar={onCerrar} etiqueta="Añadir un sitio cercano" fondo="#FBF3E2">
      <div data-vuelta-anadir-lista className="flex flex-col gap-2.5">
        <Titulo texto="Añadir un sitio cercano" onCerrar={onCerrar} />
        <LineaUbicacion route={route} referencia={null} enCoche={enCoche} enLaRuta={Boolean(ubicacionEnRuta)} onUbicacion={() => undefined} />
        <span className="text-[13px] font-medium leading-[1.35]" style={{ color: 'rgba(28,34,48,.62)' }}>Lo que está abierto y te cabe antes de las {horaDeSalir}.</span>
        {candidatos.length === 0 && (
          <div data-vuelta-anadir-vacio className="flex flex-col gap-2.5">
            <span className="text-[14.5px] font-medium leading-[1.4]">A esta hora no queda nada abierto que te dé tiempo a ver antes de salir.</span>
            <button type="button" onClick={() => { onCerrar(); onVerExplorar() }} className="flex h-11 items-center justify-center rounded-2xl text-[14px] font-bold" style={BOTON_CLARO}>
              Ver Explorar
            </button>
          </div>
        )}
        {candidatos.map((c) => (
          <div key={c.nombre} data-vuelta-anadir-candidato={c.nombre} className="flex min-h-[64px] items-center gap-2 rounded-[18px] py-2 pl-[9px] pr-2" style={{ background: '#FFFDF8', border: '1px solid rgba(28,34,48,.12)' }}>
            <ParadaFotoDeParada parada={stopDeCandidato(c)} ciudad={day.city} dateIso={dateIso} vista size={42} marca={false} carga="eager" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate" style={{ font: "700 14px/1.15 'Geist'" }}>{displayStopName(c.nombre)}</span>
              <span className="text-[12px]" style={{ color: 'rgba(28,34,48,.62)' }}>{enCoche ? `a ${minutosEnCocheDeMetros(c.metros)} min en coche` : `a ${Math.max(1, Math.round(c.metros / 80))} min a pie`}</span>
              {c.estado && (
                <span className="text-[12px] font-semibold" style={{ color: c.estado.cierraPronto ? '#C2581C' : c.estado.alAireLibre ? '#2E5F8A' : 'oklch(0.38 0.1 150)' }}>
                  {c.estado.texto}
                </span>
              )}
              {c.logro && <Etiqueta tono="oro">Contiene recompensa</Etiqueta>}
            </span>
            <button type="button" onClick={() => elegir(c)} data-vuelta-anadir-elegir className="zona-toque flex h-[34px] flex-none items-center rounded-xl px-3 text-[12.5px] font-bold" style={BOTON_ORO}>
              Elegir
            </button>
          </div>
        ))}
      </div>
    </HojaV2>
  )
}

