import { useState } from 'react'
import type { DayPlan, Route, Stop } from '../../../../lib/types'
import { useRouteStore } from '../../../../store/useRouteStore'
import { useBilleteStore } from '../../../../store/useBilleteStore'
import { useBillete } from '../../../../hooks/useBillete'
import { ciudadDeSalida, diaEntero, ladoDeFuera } from '../../../../lib/billete'
import { puntoCorto, type ArrivalPoint } from '../../../../lib/arrivalReturn'
import { esDestinoDeCoche } from '../../../../lib/experienceCategoryBank'
import { displayStopName } from '../../../../lib/format'
import { segunGrupo } from '../../../../lib/viajaEnGrupo'
import { pagoActivo } from '../../../../lib/pago'
import { direccionDelAlojamiento, enlaceComoLlegarAlojamiento } from '../../../../lib/direccionAlojamiento'
import { alCambiarElVuelo } from '../../../../lib/adaptarVuelos'
import { Icono, IconoRuta } from '../../../ui/Icono'
import { ImagenDeLlegada, type TipoDeLlegada } from '../../../ui/ImagenDeLlegada'
import { HojaDeHora } from '../../../ui/HojaDeHora'
import { BOTON_CLARO, BOTON_ORO } from '../../../ui/botonesOro'
import { IconoDeDocumento } from '../../reservas/BotonesDeReserva'
import { AnadirDocumentoDeHoy } from '../../reservas/FlujoDelBillete'
import { CodigoPantallaCompleta } from '../../reservas/TarjetaBillete'
import { FilaDeUnion } from './FilaDeUnion'
import { useTrenUnido } from '../../../../hooks/useTrenUnido'
import { useBilletesDeExcursiones } from '../../../../hooks/useBilleteExcursion'
import { excursionConCodigo } from '../../../../store/useBilleteStore'
import { useReservasFocusStore } from '../../../../store/useReservasFocusStore'
import { tramoQueToca, tramosDeLaMitad } from '../../../../lib/escalasYUnion'
import { useAlojamientoDelViaje } from '../../alojamiento/useAlojamientoDelViaje'
import type { MitadDeHoy } from '../llegadaVuelta'
import { CajaDeParada, NOMBRE_SOBRE_FOTO, PILDORA_FOTO, TARJETA_PARADA, useAhoraMin } from './ParadaHoy'

/**
 * (V62; Design «La llegada en HOY», L1 a L7) LA TARJETA DE LA LLEGADA: UNA sola tarjeta, con el formato de la tarjeta de la parada, que sustituye al billete y a la tarjeta de bienvenida del día de llegada.
 *  · Imagen fija (`ImagenDeLlegada`: avión, tren o coche), etiqueta «LLEGADA», «Llegas a Roma» y, arriba a la derecha, el QR (dorado si la tarjeta de embarque está guardada, gris con «+» si falta).
 *  · La línea del billete (salida y llegada con su línea de puntos), la fila del vuelo (TERMINAL / ASIENTO / REF; en tren ESTACIÓN / ASIENTO / REF; solo las cajas que tienen dato) y la fila de abajo (AL CENTRO / HOTEL / TU DÍA;
 *    con coche de alquiler, COCHE en lugar de AL CENTRO).
 *  · Botones: [He aterrizado] y [Vuelo retrasado] (tren, autobús, barco: [He llegado] y [Tren / Autobús / Ferry retrasado]; coche propio: [He llegado] y [He salido tarde]) y «Cómo llegar al centro».
 *  · Tras [He aterrizado] (o con el GPS en el destino): «● AQUÍ · YA HAS LLEGADO», ✓ verde junto a la hora, las cajas se quedan, fuera los dos botones y [Cómo llegar a tu alojamiento] (con coche de alquiler, la franja
 *    «Primero, recoge tu coche» y el camino en coche).
 *  · [Vuelo retrasado]: la hoja de la hora de siempre; al guardar, la hora nueva sustituye a la vieja (tachada) EN LA RESERVA de RESERVAS y sale la pregunta de adaptar los días a tu vuelo.
 * REGLA «HOY y RESERVAS, los mismos datos» (CLAUDE.md): aquí no se guarda NADA aparte. Compañía, número de vuelo, horas y puntos salen de la ruta (`arrivalCompania`, `arrivalCodigo`, `arrivalFlightTime`…); terminal, asiento, coche, localizador
 * y código (QR) salen del billete guardado en RESERVAS (`useBillete`); el coche de alquiler, de `rentalVehicleBooking`. Lo único propio de HOY es «ya he aterrizado» (un recuerdo de este móvil, por viaje y día).
 * Consultas a Supabase: ninguna (todo sale de la ruta y del móvil).
 */
const TRAZO = {
  terminal: 'M4 21V9l8-5 8 5v12M9 21v-7h6v7',
  asiento: 'M7 4h6a2 2 0 0 1 2 2v7H7zM15 13h3a2 2 0 0 1 2 2v3H9M9 18v3M18 18v3',
  ref: 'M3 7h18v10H3zM9 7v10M13 10h4M13 14h3',
  centro: 'M5 4h14a1 1 0 0 1 1 1v11H4V5a1 1 0 0 1 1-1zM4 11h16M7 19v2M17 19v2M8 15h.01M16 15h.01',
  hotel: 'M4 21V8l8-5 8 5v13M9 21v-6h6v6M9 11h.01M15 11h.01',
  dia: 'M7 3v3M17 3v3M4 8h16v12H4zM8 13h3',
  coche: 'M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11M3 11h18v6H3zM6 17v2M18 17v2M7.5 14h.01M16.5 14h.01',
  avion: 'M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z',
  tren: 'M7 3h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM4 11h16M8 21l2-3M16 21l-2-3M8.5 14.5h.01M15.5 14.5h.01',
  bus: 'M5 4h14a1 1 0 0 1 1 1v11H4V5a1 1 0 0 1 1-1zM4 11h16M7 19v2M17 19v2M8 15h.01M16 15h.01',
  barco: 'M3 17l2 3h14l2-3M5 17l1-6h12l1 6M12 11V4M12 4l4 3-4 1',
}

const MEDIO_DEL_BILLETE: Record<string, string> = { avion: 'vuelo', tren: 'tren', bus: 'autobús', ferry: 'barco' }

const sinAcentos = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Lo que va entre paréntesis del lado de fuera: «Barcelona (El Prat)» → «El Prat»; «Barcelona Sants» → «Sants»; sin nada más que la ciudad, ''. */
function sitioDeFuera(route: Route): string {
  const t = ladoDeFuera(ciudadDeSalida(route), route.arrivalOtroPunto)
  const m = /\((.+)\)\s*$/.exec(t)
  return m ? m[1].trim() : ''
}

/** «32 min» y «Leonardo Express»: lo que se enseña del traslado más cómodo del punto de llegada (los datos del destino; sin cifras inventadas). */
function alCentroDe(point: ArrivalPoint | null, esTren: boolean): { grande: string; sub: string } | null {
  if (!point) return null
  const opcion = point.al_centro.find((o) => o.mas_comodo && !o.no_enseñar) ?? point.al_centro.find((o) => !o.no_enseñar) ?? null
  if (!opcion) return null
  const m = /(\d+(?:\s?-\s?\d+)?)\s*min/i.exec(opcion.tiempo ?? '')
  const nombre = opcion.nombre.replace(/\s+a Termini.*$/i, '').replace(/\s*\(.*$/, '').trim()
  const grande = m ? `${m[1].replace(/\s/g, '')} min` : (opcion.tiempo ?? '').split(',')[0].slice(0, 12) || nombre
  const sub = esTren && !/ desde /i.test(nombre) ? `${nombre} desde ${puntoCorto(point)}` : nombre
  return { grande, sub }
}

const claveDeLlegado = (route: Route, dateIso: string) => `trazo:hoy:llegado:${route.id}:${dateIso}`
function leerLlegado(route: Route, dateIso: string): boolean {
  try {
    return localStorage.getItem(claveDeLlegado(route, dateIso)) === '1'
  } catch {
    return false
  }
}

export function TarjetaDeLlegada({ route, day, dateIso, mitad, paradas, llegadoPorGps, onAbrirFicha }: { route: Route; day: DayPlan; dateIso: string; mitad: MitadDeHoy; /** Las paradas del día que siguen en pie (no saltadas). */ paradas: Stop[]; /** El GPS dice que ya estás en el destino (`zonaDeUbicacion` = ruta o destino). */ llegadoPorGps: boolean; onAbrirFicha: () => void }) {
  const [llegadoAMano, setLlegadoAMano] = useState(() => leerLlegado(route, dateIso))
  const [hoja, setHoja] = useState(false)
  const [ampliado, setAmpliado] = useState(false)
  // (V64 §1) El QR gris abre la misma hoja de añadir un documento de RESERVAS (subir foto o archivo / escribir los datos); solo se monta al tocar.
  const [vezAnadir, setVezAnadir] = useState(0)
  const ahoraMin = useAhoraMin()
  const alojamiento = useAlojamientoDelViaje()
  const coche = useRouteStore((s) => s.rentalVehicleBooking)
  const billete = mitad.billete
  const { billete: guardado, tripId } = useBillete('arrival', billete?.horaRoma ?? null)
  const llegado = llegadoAMano || llegadoPorGps
  const modo = mitad.mode
  const propio = modo === 'coche'
  const tipo: TipoDeLlegada = modo === 'avion' ? 'avion' : propio ? 'coche' : 'tren'
  const enCoche = esDestinoDeCoche(route.destination)
  const hayCoche = !propio && enCoche && (Boolean(coche?.provider) || route.answers.coche === 'alquiler' || route.transportContext?.vehicle_ownership === 'rental')
  const ciudad = mitad.destino || route.destination
  // (V76) Con escalas, la tarjeta enseña el ÚLTIMO tramo (el de la ida: lo de siempre) y el QR es el del tramo que toca a esta hora (el primero hasta que aterriza, luego el siguiente). Con un tren o autobús unido, su fila con su QR.
  const trenUnido = useTrenUnido('arrival')
  const billetesEscala = useBilletesDeExcursiones()
  const tramos = tramosDeLaMitad(route, 'arrival', { salida: route.arrivalOtraHora ?? null, llegada: route.arrivalFlightTime ?? null, compania: route.arrivalCompania ?? '', codigo: route.arrivalCodigo ?? '', desde: '', hasta: '' })
  const tramoDeHoy = tramos.length > 1 && !llegado ? tramoQueToca(tramos, ahoraMin) : null
  const escalaDeHoy = tramoDeHoy && !tramoDeHoy.principal ? tramoDeHoy : null
  const billeteDeEscala = escalaDeHoy ? billetesEscala.de(escalaDeHoy.clave) : null
  const hayQr = escalaDeHoy ? excursionConCodigo(billeteDeEscala) : Boolean(guardado?.codigo && (guardado.codigo.dibujo || guardado.codigo.imagen))
  const codigoDeHoy = escalaDeHoy ? (billeteDeEscala?.codigo ?? null) : (guardado?.codigo ?? null)
  const irAReservas = () => {
    useRouteStore.getState().setMode('bookings')
    useReservasFocusStore.getState().pedir('llegada', 'arrival')
  }
  const retraso = route.arrivalRetraso && route.arrivalRetraso.para === route.arrivalFlightTime && route.arrivalRetraso.antes && route.arrivalRetraso.antes !== route.arrivalRetraso.para ? route.arrivalRetraso.antes : null
  // En coche propio no hay reserva: la hora de «He salido tarde» es solo un recuerdo de HOY.
  const horaEstimada = propio && route.arrivalRetraso ? route.arrivalRetraso.para : null

  const marcarLlegado = () => {
    setLlegadoAMano(true)
    try {
      localStorage.setItem(claveDeLlegado(route, dateIso), '1')
    } catch {
      /* sin almacenamiento: queda hasta cerrar */
    }
  }
  const guardarHora = (hora: string | null) => {
    if (!hora) return
    // La MISMA reserva que RESERVAS: la hora de llegada del vuelo (o del tren…) pasa a la nueva, y el billete guardado la sigue para no perder su QR.
    // (V70, V62-13) Con coche propio [He salido tarde] cuenta igual que [Vuelo retrasado]: la hora nueva pasa por la misma función (`retrasarLlegada`) y por «adaptar los días» de la V61.
    useRouteStore.getState().retrasarLlegada(hora, { medio: propio ? 'coche' : MEDIO_DEL_BILLETE[modo] })
    const previo = useBilleteStore.getState().datos.arrival
    if (previo && !propio) useBilleteStore.getState().poner(tripId, 'arrival', { ...previo, horaRoma: hora })
    // Con la hora nueva, sale la hoja «¿Adaptamos tus días a tu vuelo?» (la de la V61) si adaptar cambiaría algo.
    void alCambiarElVuelo({ que: 'hora', mitad: 'arrival' })
  }

  // ── La línea del billete ──
  const numero = route.arrivalCodigo?.replace(/\s+/g, '').toUpperCase() ?? ''
  const palabra = { avion: 'VUELO', tren: 'TREN', bus: 'AUTOBÚS', ferry: 'BARCO', coche: 'COCHE' }[modo]
  const encabezado = billete ? (numero ? `${palabra} ${numero}` : palabra) : ''
  const diaTexto = diaEntero(dateIso)

  // ── La fila del vuelo (solo las cajas con dato) ──
  const fuera = sitioDeFuera(route)
  const cajasDelVuelo: { dato: string; trazo: string; etiqueta: string; grande: string; sub: string }[] = []
  if (billete) {
    const esVuelo = modo === 'avion'
    const lugar = guardado?.terminal?.trim() || ''
    if (esVuelo ? lugar : lugar || fuera) cajasDelVuelo.push({ dato: 'terminal', trazo: TRAZO.terminal, etiqueta: esVuelo ? 'TERMINAL' : modo === 'bus' ? 'PARADA' : modo === 'ferry' ? 'PUERTO' : 'ESTACIÓN', grande: lugar || fuera, sub: lugar && !sinAcentos(fuera).includes(sinAcentos(lugar)) ? fuera : '' })
    const cocheTren = guardado?.coche?.trim() ? (/^coche/i.test(guardado.coche.trim()) ? guardado.coche.trim() : `Coche ${guardado.coche.trim()}`) : ''
    const asiento = [cocheTren, guardado?.asiento?.trim() ?? ''].filter(Boolean).join(' · ')
    if (asiento) cajasDelVuelo.push({ dato: 'asiento', trazo: TRAZO.asiento, etiqueta: 'ASIENTO', grande: asiento, sub: '' })
    const compania = route.arrivalCompania?.trim() ?? ''
    const localizador = guardado?.localizador?.trim() ?? ''
    if (compania || localizador) cajasDelVuelo.push({ dato: 'ref', trazo: TRAZO.ref, etiqueta: 'REF', grande: compania || localizador, sub: compania ? localizador : '' })
  }

  // ── La fila de abajo ──
  const alCentro = hayCoche ? null : propio ? null : alCentroDe(mitad.point, modo !== 'avion')
  const minutosEnCoche = day.aeropuerto?.aeropuerto_a_zona?.minutos ?? null
  const hotelGrande = alojamiento.nombre ?? alojamiento.zonaNombre ?? alojamiento.ciudad
  const hotelSub = enCoche && minutosEnCoche != null ? `${minutosEnCoche} min en coche` : alojamiento.nombre ? (alojamiento.zonaNombre ?? alojamiento.ciudad) : ''
  const primera = paradas[0] ?? null
  const cajasDeAbajo: { dato: string; trazo: string; etiqueta: string; grande: string; sub: string; extra?: string }[] = []
  // (V70, V62-16) Con la empresa: «Cicar» y debajo «Recógelo al llegar»; sin empresa: «COCHE · Recógelo al llegar» (lo grande es la frase, no un «Alquiler» inventado).
  if (hayCoche) {
    const empresa = coche?.provider?.trim() ?? ''
    const recoger = segunGrupo('Recogedlo al llegar', 'Recógelo al llegar')
    cajasDeAbajo.push({ dato: 'coche', trazo: TRAZO.coche, etiqueta: 'COCHE', grande: empresa || recoger, sub: [empresa ? recoger : '', coche?.lugarRecogida?.trim()].filter(Boolean).join(' · ') })
  }
  else if (alCentro) cajasDeAbajo.push({ dato: 'al-centro', trazo: TRAZO.centro, etiqueta: 'AL CENTRO', ...alCentro })
  cajasDeAbajo.push({ dato: 'hotel', trazo: TRAZO.hotel, etiqueta: 'HOTEL', grande: hotelGrande, sub: hotelSub })
  cajasDeAbajo.push({ dato: 'tu-dia', trazo: TRAZO.dia, etiqueta: 'TU DÍA', grande: paradas.length === 0 ? 'Sin paradas' : paradas.length === 1 ? '1 parada' : `${paradas.length} paradas`, sub: primera ? `Empieza en ${displayStopName(primera.name)}` : 'Día de viaje' })

  // ── Los botones ──
  const palabraRetrasado = modo === 'avion' ? 'Vuelo retrasado' : modo === 'tren' ? 'Tren retrasado' : modo === 'bus' ? 'Autobús retrasado' : modo === 'ferry' ? 'Ferry retrasado' : segunGrupo('Hemos salido tarde', 'He salido tarde')
  const textoLlegado = modo === 'avion' ? segunGrupo('Hemos aterrizado', 'He aterrizado') : segunGrupo('Hemos llegado', 'He llegado')
  const direccion = direccionDelAlojamiento(route)
  const enlaceAlojamiento = direccion ? enlaceComoLlegarAlojamiento(direccion, route.destination, route.accommodationPoint ?? null, hayCoche ? 'driving' : 'transit') : null
  const enlaceCoche = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Alquiler de coches ${mitad.point?.nombre ?? `aeropuerto de ${route.destination}`}`)}`
  const textoCoche = `${segunGrupo('Primero, recoged vuestro coche', 'Primero, recoge tu coche')}: ${[coche?.provider?.trim() || 'alquiler', coche?.codigo?.trim() ? `Ref ${coche.codigo.trim()}` : ''].filter(Boolean).join(' · ')}`
  const enlaceAbajo = (
    <button type="button" onClick={onAbrirFicha} data-hoy-llegada-como-llegar className="zona-toque -mt-0.5 flex min-h-11 items-center justify-center self-center text-[13px] font-semibold underline underline-offset-[3px]" style={{ color: '#6E5018' }}>
      Cómo llegar al centro
    </button>
  )
  const columnas = (n: number) => ({ gridTemplateColumns: `repeat(${Math.max(n, 2)}, minmax(0, 1fr))` }) as const

  return (
    <>
      <div data-hoy-llegada="1" data-hoy-llegada-tarjeta data-hoy-llegada-estado={llegado ? 'llegado' : 'antes'} data-hoy-llegada-modo={modo} data-tarjeta="clara" className="flex-none overflow-hidden rounded-[28px]" style={TARJETA_PARADA}>
        <div data-hoy-foto-parada className="relative overflow-hidden" style={{ height: 150 }}>
          <ImagenDeLlegada tipo={tipo} />
          <span className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,.14) 0%,rgba(0,0,0,0) 40%,rgba(0,0,0,.38))' }} />
          <span data-hoy-insignia className="absolute left-3.5 top-3.5 flex h-7 items-center gap-2 rounded-full px-[13px]" style={{ ...PILDORA_FOTO, font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.14em' }}>
            {llegado && <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#4CC46E', animation: 'hoyYaPulse 2s infinite' }} />}
            {llegado ? segunGrupo('AQUÍ · YA HABÉIS LLEGADO', 'AQUÍ · YA HAS LLEGADO') : 'LLEGADA'}
          </span>
          {billete && (
            <span className="absolute right-3.5 top-3">
              <IconoDeDocumento grande hay={hayQr} tipo="qr" onAbrir={() => setAmpliado(true)} onAnadir={() => (escalaDeHoy ? irAReservas() : setVezAnadir((v) => v + 1))} etiqueta={hayQr ? 'Ver el código en grande' : `Añade tu ${modo === 'avion' ? 'tarjeta de embarque' : 'billete'}`} datos="billete-llegada" />
            </span>
          )}
          <span data-hoy-llegada-titulo className="absolute inset-x-[18px] bottom-3.5 text-left" style={NOMBRE_SOBRE_FOTO}>
            {segunGrupo('Llegáis a', 'Llegas a')} {ciudad}
          </span>
        </div>
        <div className="flex flex-col gap-3 px-3.5 pb-4 pt-3.5">
          {billete && (
            <div data-hoy-llegada-billete className="flex flex-col gap-1.5 px-0.5 pb-1 pt-0.5">
              <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.12em', color: 'rgba(28,34,48,.55)', textTransform: 'uppercase' }}>{[encabezado, diaTexto].filter(Boolean).join(' · ')}</span>
              <div className="flex items-center gap-2.5">
                <span className="flex min-w-0 flex-col gap-px">
                  <span data-hoy-llegada-salida style={{ font: "400 32px/1 'Instrument Serif',serif" }}>{billete.horaOtra ?? ' '}</span>
                  <span style={{ font: "600 11.5px 'Geist Mono',monospace", letterSpacing: '.08em', color: 'rgba(28,34,48,.6)', whiteSpace: 'nowrap' }}>{billete.codigoOtro ?? ' '}</span>
                </span>
                <span className="relative flex h-6 min-w-[20px] flex-1 items-center" aria-hidden="true">
                  <span className="absolute inset-x-0 top-1/2" style={{ borderTop: '2px dotted rgba(181,138,46,.7)' }} />
                  <span className="relative mx-auto flex h-[26px] w-[26px] items-center justify-center rounded-full" style={{ background: '#FFFDF8' }}>
                    <IconoRuta d={modo === 'avion' ? TRAZO.avion : modo === 'bus' ? TRAZO.bus : modo === 'ferry' ? TRAZO.barco : TRAZO.tren} size={17} grosor={1.8} className="text-[#8A6A2C]" />
                  </span>
                </span>
                <span className="flex min-w-0 flex-col items-end gap-px">
                  <span className="flex items-center gap-[7px]">
                    {retraso && <span data-hoy-llegada-hora-vieja style={{ font: "500 15px 'Geist'", color: 'rgba(28,34,48,.4)', textDecoration: 'line-through' }}>{retraso}</span>}
                    {llegado && (
                      <span data-hoy-llegada-ok className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: '#2B7F45' }}>
                        <Icono nombre="hecho" size={11} grosor={3.4} style={{ color: '#fff' }} />
                      </span>
                    )}
                    <span data-hoy-llegada-hora style={{ font: "400 32px/1 'Instrument Serif',serif" }}>{billete.horaRoma}</span>
                  </span>
                  <span style={{ font: "600 11.5px 'Geist Mono',monospace", letterSpacing: '.08em', color: 'rgba(28,34,48,.6)', whiteSpace: 'nowrap' }}>{billete.codigoRoma}</span>
                </span>
              </div>
            </div>
          )}
          {horaEstimada && (
            <span data-hoy-llegada-estimada className="px-0.5 text-[13px] font-semibold" style={{ color: '#6E5018' }}>
              {segunGrupo('Llegáis', 'Llegas')} hacia las {horaEstimada}
            </span>
          )}
          {cajasDelVuelo.length > 0 && (
            <div data-hoy-cajas-vuelo className="grid gap-2" style={columnas(3)}>
              {cajasDelVuelo.map((c) => (
                <CajaDeParada key={c.dato} dato={c.dato} trazo={c.trazo} etiqueta={c.etiqueta} grande={c.grande} sub={c.sub} />
              ))}
            </div>
          )}
          {trenUnido && <FilaDeUnion reserva={trenUnido} mitad="arrival" />}
          <div data-hoy-cajas className="grid gap-2" style={columnas(cajasDeAbajo.length)}>
            {cajasDeAbajo.map((c) => (
              <CajaDeParada key={c.dato} dato={c.dato} trazo={c.trazo} etiqueta={c.etiqueta} grande={c.grande} sub={c.sub} />
            ))}
          </div>
          {!llegado ? (
            <>
              <div className="flex gap-2.5">
                <button type="button" onClick={marcarLlegado} data-hoy-he-aterrizado className="flex h-[50px] flex-1 items-center justify-center whitespace-nowrap rounded-2xl text-[14.5px] font-bold" style={BOTON_ORO}>
                  {textoLlegado}
                </button>
                <button type="button" onClick={() => setHoja(true)} data-hoy-vuelo-retrasado className="flex h-[50px] flex-[1.1] items-center justify-center whitespace-nowrap rounded-2xl text-[14px] font-bold" style={BOTON_CLARO}>
                  {palabraRetrasado}
                </button>
              </div>
              {enlaceAbajo}
            </>
          ) : (
            <>
              {hayCoche && (
                <a href={enlaceCoche} target="_blank" rel="noopener noreferrer" data-hoy-llegada-coche className="flex items-center gap-2.5 rounded-2xl px-3 py-[11px] no-underline" style={{ background: '#FBF3E2', border: '1px solid rgba(181,138,46,.5)' }}>
                  <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full" style={{ background: '#1C2230', color: '#F3D88F' }}>
                    <IconoRuta d={TRAZO.coche} size={18} grosor={1.8} />
                  </span>
                  <span className="text-[13.5px] font-semibold leading-[1.3]" style={{ color: '#3E2A0C' }}>{textoCoche}</span>
                </a>
              )}
              {enlaceAlojamiento && pagoActivo() ? (
                <a href={enlaceAlojamiento} target="_blank" rel="noopener noreferrer" data-hoy-llegada-alojamiento className="flex h-[54px] items-center justify-center gap-[9px] rounded-2xl text-[15px] font-bold no-underline" style={BOTON_ORO}>
                  <Icono nombre="localizar" size={18} grosor={2} />
                  {segunGrupo('Cómo llegar a vuestro alojamiento', 'Cómo llegar a tu alojamiento')}
                </a>
              ) : (
                enlaceAbajo
              )}
            </>
          )}
        </div>
      </div>
      {hoja && (
        <HojaDeHora
          titulo={segunGrupo('¿A qué hora llegáis ahora?', '¿A qué hora llegas ahora?')}
          valor={propio ? (route.arrivalRetraso?.para ?? null) : (route.arrivalFlightTime ?? null)}
          inicial={`${String(Math.floor((Math.ceil(ahoraMin / 30) * 30) / 60) % 24).padStart(2, '0')}:${String((Math.ceil(ahoraMin / 30) * 30) % 60).padStart(2, '0')}`}
          quitable={false}
          onElegir={guardarHora}
          onCerrar={() => setHoja(false)}
        />
      )}
      {vezAnadir > 0 && <AnadirDocumentoDeHoy key={vezAnadir} route={route} kind="arrival" mode={modo} />}
      {ampliado && codigoDeHoy && (
        <CodigoPantallaCompleta
          codigo={codigoDeHoy}
          titulo={`${ciudadDeSalida(route)} → ${billete?.codigoRoma ?? ciudad}`}
          cuando={[diaTexto, route.arrivalOtraHora].filter(Boolean).join(' · ')}
          pie={[guardado.asiento ? `Asiento ${guardado.asiento}` : null].filter(Boolean).join(' · ')}
          onClose={() => setAmpliado(false)}
        />
      )}
    </>
  )
}
