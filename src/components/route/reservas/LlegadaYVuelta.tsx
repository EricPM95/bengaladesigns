import { precioEnVista } from '../../../lib/moneda'
import { useEffect, useState } from 'react'
import type { Route } from '../../../lib/types'
import type { DestinationExcursions } from '../../../lib/destinationExcursions'
import type { EnCambioDeVuelo } from '../../../lib/cambioDeVuelo'
import { HojaZona } from './AlojamientoReservas'
import { puntoCorto, type ArrivalInfo } from '../../../lib/arrivalReturn'
import { legLine, legOf, legsTag, legWord, type LegKind, type LegState } from '../../../lib/reservasLegs'
import { shortDateEs } from '../../../lib/bookings'
import { useRouteStore } from '../../../store/useRouteStore'
import { quitarConDeshacer } from '../../../store/useAddFlowStore'
import { TimeListWheel } from '../../ui/TimeListWheel'
import { BloqueShell, CambiarBoton, EliminarTexto, FlechaBloque, EstadoBloque, GR, INK, IconoBloque, VERDE_LINEA, VERDE_SUAVE, iconoDeMedio, tituloBloqueStyle } from './BloqueReservas'
import { HojaAbajo, ojoStyle } from './HojaAbajo'
import { HojaPrecio } from './HojaPrecio'
import { leerImporte, type Importe } from '../../../lib/dinero'
import { Icono } from '../../ui/Icono'
import { Candado } from '../../pase/Candado'
import { usePagoActivo } from '../../../lib/pago'

// (Tanda 7: las 24 horas, de 5 en 5. Una llegada a las 0:30 o un vuelo a las 2:00 son horas de verdad —el motor las trata como «la noche de antes»—; la rueda ya no empieza a las 6:00.)
const HORAS = Array.from({ length: (24 * 60) / 5 }, (_, i) => {
  const m = i * 5
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
})
const HORA_POR_DEFECTO: Record<LegKind, string> = { arrival: '11:15', departure: '18:05' }
/** Donde arranca la rueda de la hora del otro lado (opcional): la ida sale antes de llegar; la vuelta llega después de salir. */
const HORA_OTRO_LADO: Record<LegKind, string> = { arrival: '09:00', departure: '20:30' }

/** El enlace de buscar billete: el que ya usaban las filas de transporte. */
const BUSCAR_BILLETE = 'https://www.skyscanner.net'

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

/**
 * La hoja de la hora de una mitad: la rueda de la 6k, de 5 en 5 minutos. El precio, la referencia y la compañía se rellenan en las casillas del tramo abierto (Tanda 6y5).
 * Tanda 7: para guardar la hora de Roma el PUNTO de Roma es obligatorio (aeropuerto, estación o puerto): si el medio tiene varios, salen sus botones y [Guardar] espera a que se elija uno;
 * con un solo punto (el puerto), ya viene elegido. Con `otra`, es la hora opcional del otro lado (la de salida de la ida / la de llegada de la vuelta): sin punto, y con [Quitar la hora].
 */
export function HojaHoraLlegada({
  leg,
  ciudad,
  otra = false,
  onSave,
  onBorrar,
  onClose,
}: {
  leg: LegState
  ciudad: string
  otra?: boolean
  onSave: (time: string, pointId?: string) => void
  onBorrar?: () => void
  onClose: () => void
}) {
  const inicial = otra ? leg.otraHora : leg.time
  // (La rueda arranca en una hora de salida o de llegada razonable; no es ninguna hora que calcule la app: solo cuenta lo que el viajero guarda. La del otro lado, a otra altura que la de Roma.)
  const [hora, setHora] = useState(inicial && HORAS.includes(inicial) ? inicial : otra ? HORA_OTRO_LADO[leg.kind] : HORA_POR_DEFECTO[leg.kind])
  const [puntoId, setPuntoId] = useState<string | null>(leg.point?.id ?? null)
  const punto = leg.points.find((candidate) => candidate.id === puntoId) ?? null
  const pideEl = !otra && leg.hasButtons
  const falta = pideEl && !punto
  const lugar = otra ? (leg.otroPunto ?? 'tu punto de origen') : punto ? puntoCorto(punto) : ciudad
  const fecha = leg.dateIso ? capitalizar(shortDateEs(leg.dateIso)) : `Día ${leg.dayNumber}`
  // (La ida llega a Roma y sale del otro lado; la vuelta sale de Roma y llega al otro lado.)
  const llega = otra ? leg.kind === 'departure' : leg.kind === 'arrival'
  const etiqueta = llega ? 'Hora de llegada' : 'Hora de salida'
  return (
    <HojaAbajo titleId="hoja-hora-leg" onClose={onClose}>
      <p className="max-w-[calc(100%-2.5rem)] text-text/50" style={ojoStyle}>
        {etiqueta}
        {otra ? ' · opcional' : ''}
      </p>
      <h2 id="hoja-hora-leg" className="mt-1.5 font-display text-[24px] leading-[1.05] text-text">
        {llega ? `Llegas a ${lugar}` : `Sales de ${lugar}`}
      </h2>
      <p className="mt-1 text-[12px] text-text/60">{fecha}</p>
      {pideEl && (
        <div className="mt-3.5" data-punto-obligatorio>
          <p className="mb-1.5 text-[12.5px] text-text/65">{leg.kind === 'arrival' ? '¿Dónde llegas?' : '¿De dónde sales?'}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {leg.points.map((candidate) => {
              const activo = candidate.id === puntoId
              return (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => setPuntoId(candidate.id)}
                  aria-pressed={activo}
                  className="h-10 rounded-xl text-[13.5px] font-semibold transition-colors"
                  style={{ border: `1.5px solid ${activo ? INK : 'transparent'}`, background: activo ? INK : '#F5EFE4', color: activo ? '#FFFDF8' : INK }}
                >
                  {puntoCorto(candidate)}
                </button>
              )
            })}
          </div>
        </div>
      )}
      <div className="mt-3.5">
        <TimeListWheel items={HORAS} value={hora} onChange={setHora} label={etiqueta} />
      </div>
      <button
        type="button"
        disabled={falta}
        onClick={() => onSave(hora, punto?.id)}
        className="mt-4 h-[54px] w-full rounded-full btn-champan text-[15px] font-semibold transition-transform active:scale-[.98] disabled:opacity-40"
      >
        {falta ? 'Elige primero el punto' : 'Guardar'}
      </button>
      {otra && inicial && onBorrar && (
        <button type="button" onClick={onBorrar} className="mt-2 w-full py-2 text-center text-[13px] font-semibold text-text/60 underline underline-offset-2">
          Quitar la hora
        </button>
      )}
    </HojaAbajo>
  )
}

const etiquetaCasilla = { font: "600 10px 'Geist Mono',monospace", letterSpacing: '.12em', textTransform: 'uppercase' as const }

/** Una casilla del tramo abierto que se toca y abre una hoja («Llega», «Precio»): la etiqueta pequeña arriba y debajo lo que hay o lo que falta. */
function CasillaToque({ etiqueta, dato, valor, vacio, icono, onClick }: { etiqueta: string; dato?: string; valor: string | null; vacio: string; icono: 'reloj' | 'anadir'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-casilla={dato ?? etiqueta}
      className="flex h-[58px] min-w-0 items-center gap-1.5 rounded-[14px] px-3 text-left transition-colors"
      style={{ border: `1.5px solid ${valor ? 'oklch(0.55 0.11 150 / .35)' : 'transparent'}`, background: valor ? VERDE_SUAVE : '#F5EFE4', color: INK }}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-text/55" style={etiquetaCasilla}>
          {etiqueta}
        </span>
        <span className="truncate" style={{ font: valor ? "400 20px/1.1 'Instrument Serif',serif" : "500 13.5px 'Geist'", color: valor ? INK : 'rgba(28,34,48,.55)' }}>
          {valor ?? vacio}
        </span>
      </span>
      <Icono nombre={icono} size={15} style={{ color: 'rgba(28,34,48,.5)' }} />
    </button>
  )
}

/** Una casilla del tramo abierto que se escribe (la referencia, la compañía): opcional, libre, y se guarda al salir del campo. */
function CasillaTexto({ etiqueta, dato, valor, ejemplo, mayusculas, onGuardar }: { etiqueta: string; dato?: string; valor: string; ejemplo: string; mayusculas?: boolean; onGuardar: (texto: string) => void }) {
  const [texto, setTexto] = useState(valor)
  return (
    <label className="flex h-[58px] min-w-0 flex-col justify-center gap-0.5 rounded-[14px] px-3" style={{ border: `1.5px solid ${valor ? 'oklch(0.55 0.11 150 / .35)' : 'transparent'}`, background: valor ? VERDE_SUAVE : '#F5EFE4', color: INK }}>
      <span className="text-text/55" style={etiquetaCasilla}>
        {etiqueta}
      </span>
      <input
        value={texto}
        onChange={(event) => setTexto(event.target.value)}
        onBlur={() => onGuardar(texto)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
        }}
        maxLength={mayusculas ? 20 : 40}
        autoComplete="off"
        autoCapitalize={mayusculas ? 'characters' : 'words'}
        placeholder={ejemplo}
        aria-label={etiqueta}
        data-casilla={dato ?? etiqueta}
        className={`w-full min-w-0 bg-transparent text-[14px] font-medium outline-none placeholder:font-normal placeholder:text-text/35 ${mayusculas ? 'uppercase placeholder:normal-case' : ''}`}
        style={mayusculas ? { fontFamily: "'Geist Mono',monospace" } : undefined}
      />
    </label>
  )
}

/** Una mitad abierta, como media tarjeta de embarque: de dónde a dónde, los botones del punto, y cuatro casillas (hora, precio, referencia y compañía). */
function MitadAbierta({
  leg,
  origen,
  ciudad,
  precio,
  onPoint,
  onTime,
  onPrecio,
  onCodigo,
  onCompania,
  onOtraHora,
  onOtroPunto,
  zonaPendiente,
  onZona,
  onFechas,
  onEliminar,
}: {
  leg: LegState
  origen: string
  ciudad: string
  precio: Importe | null
  onPoint: (pointId: string) => void
  onTime: () => void
  onPrecio: () => void
  onCodigo: (texto: string) => void
  onCompania: (texto: string) => void
  /** Tanda 7: las dos casillas opcionales del otro lado (la otra hora y su punto). */
  onOtraHora: () => void
  onOtroPunto: (texto: string) => void
  /** Tanda 7: con hora de Roma puesta y la zona del alojamiento sin elegir, se pide la zona («Aún no lo sé» vale). */
  zonaPendiente: boolean
  onZona: () => void
  onFechas: () => void
  onEliminar: () => void
}) {
  const [seguro, setSeguro] = useState(false)
  const esIda = leg.kind === 'arrival'
  const palabras = legWord(leg.mode)
  const lugar = leg.point ? puntoCorto(leg.point) : null
  const pregunta = leg.question
  const grande = "400 22px/1.05 'Instrument Serif',serif"
  const pequeno = "italic 400 14px/1.2 'Instrument Serif',serif"
  const lado = (texto: string | null, alineado: 'left' | 'right') => (
    <span style={{ font: texto ? grande : pequeno, color: texto ? INK : 'rgba(28,34,48,.55)', maxWidth: 130, textAlign: alineado, textWrap: 'balance' as never }}>{texto ?? pregunta ?? ciudad}</span>
  )
  const unico = leg.points.length === 1 && leg.mode === 'ferry'
  const fecha = leg.dateIso ? capitalizar(shortDateEs(leg.dateIso)) : `Día ${leg.dayNumber}`
  return (
    <div className="flex flex-col gap-2.5 rounded-[18px] border border-text/10 bg-white px-3.5 pb-[13px] pt-3.5">
      <span className="text-text/55" style={ojoStyle}>
        {esIda ? 'Ida' : 'Vuelta'} · {fecha}
      </span>
      <div className="grid items-center gap-2.5" style={{ gridTemplateColumns: 'auto minmax(40px,1fr) auto' }}>
        {esIda ? lado(origen, 'left') : lado(lugar, 'left')}
        <div className="relative h-[30px]">
          <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <path d="M2 26 Q50 -4 98 26" fill="none" stroke="rgba(28,34,48,.25)" strokeWidth="1.3" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className="absolute left-1/2 top-0 -ml-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#1C2230] text-white">
            <Icono nombre={iconoDeMedio(leg.mode)} size={12} />
          </span>
        </div>
        {esIda ? lado(lugar, 'right') : lado(origen, 'right')}
      </div>
      {leg.hasButtons && (
        <div className="grid grid-cols-2 gap-1.5">
          {leg.points.map((point) => {
            const activo = leg.point?.id === point.id
            return (
              <button
                key={point.id}
                type="button"
                onClick={() => onPoint(point.id)}
                className="h-10 rounded-xl text-[13.5px] font-semibold transition-colors"
                style={{ border: `1.5px solid ${activo ? INK : 'transparent'}`, background: activo ? INK : '#F5EFE4', color: activo ? '#FFFDF8' : INK }}
              >
                {puntoCorto(point)}
              </button>
            )
          })}
        </div>
      )}
      {unico && leg.point && <span className="text-[12px] text-text/60">{leg.point.nombre} · el único de {ciudad}</span>}
      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-2 gap-1.5">
          <CasillaToque etiqueta={esIda ? 'Llega' : 'Sale'} valor={leg.time} vacio="Elige la hora" icono="reloj" onClick={onTime} />
          <CasillaToque etiqueta="Precio" valor={precio ? precioEnVista(precio) : null} vacio="Añadir" icono="anadir" onClick={onPrecio} />
          <CasillaTexto key={`ref-${leg.mode}`} etiqueta={palabras.refLabel} valor={leg.codigo ?? ''} ejemplo="AB 1234" mayusculas onGuardar={onCodigo} />
          <CasillaTexto key={`cia-${leg.mode}`} etiqueta={palabras.companiaLabel} valor={leg.compania ?? ''} ejemplo="Opcional" onGuardar={onCompania} />
        </div>
        <span className="text-[11px] leading-[1.35] text-text/60">
          ¿Llegas o te vas otro día?{' '}
          <button type="button" onClick={onFechas} className="underline underline-offset-2" style={{ color: INK }}>
            Cambia las fechas del viaje
          </button>
        </span>
        {/* Tanda 7: «así el cliente también usa la app como recordatorio». Las dos casillas del otro lado salen en el billete; para el motor no cambian nada. */}
        <div className="mt-1 flex flex-col gap-1.5" data-otro-lado>
          <span className="text-text/55" style={etiquetaCasilla}>
            {esIda ? 'De dónde sales · opcional' : 'A dónde llegas · opcional'}
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {/* (El punto, de ancho completo: «Barcelona-El Prat (BCN)» no cabe en media fila.) */}
            <div className="col-span-2">
              <CasillaTexto key={`otro-${leg.kind}-${leg.mode}`} etiqueta={esIda ? 'Sale de' : 'Llega a'} dato="otro-punto" valor={leg.otroPunto ?? ''} ejemplo={origen} onGuardar={onOtroPunto} />
            </div>
            <CasillaToque etiqueta={esIda ? 'Sale' : 'Llega'} dato="otra-hora" valor={leg.otraHora} vacio="Opcional" icono="reloj" onClick={onOtraHora} />
          </div>
        </div>
        {zonaPendiente && (
          <span className="text-[12px] leading-[1.35] text-text/70" data-pide-zona>
            ¿En qué zona te alojas?{' '}
            <button type="button" onClick={onZona} className="font-semibold underline underline-offset-2" style={{ color: INK }}>
              Elige tu zona
            </button>{' '}
            («Aún no lo sé» también vale).
          </span>
        )}
      </div>
      {leg.done && leg.mode !== 'coche' && (
        seguro ? (
          <div className="flex flex-col gap-2.5 border-t border-text/10 pt-3 text-center">
            <p className="text-[14px] leading-snug text-text">¿Quitamos este {palabras.noun}?</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSeguro(false)} className="h-11 flex-1 rounded-full border border-text/15 text-[14.5px] font-medium text-text hover:bg-bg-hover">
                Cancelar
              </button>
              <button type="button" onClick={onEliminar} className="h-11 flex-1 rounded-full bg-accent-red text-[14.5px] font-semibold text-white active:scale-[.98]">
                Sí, quitar
              </button>
            </div>
          </div>
        ) : (
          <EliminarTexto onClick={() => setSeguro(true)} texto={`Eliminar ${palabras.noun}`} />
        )
      )}
    </div>
  )
}

/**
 * El bloque «Llegada y vuelta» de RESERVAS (de pago, Tanda 6s): la ida y la vuelta con el medio que eligió el viajero. Cerrado y vacío, una tarjeta con «Falta»; abierto, se abre la
 * mitad que falta y la hecha queda en una línea con «Cambiar»; cerrado con algo hecho, dos líneas cortas.
 *
 * Tanda 7: el punto de Roma es obligatorio para guardar una hora (`HojaHoraLlegada`); cada mitad tiene dos casillas opcionales del otro lado (el punto y la otra hora) que enseña el billete de DÍAS; y poner,
 * cambiar o borrar una hora de Roma, un punto de Roma o la zona avisa con `onCambioDeVuelo` (ver `src/lib/cambioDeVuelo.ts`: ahí se enganchan los días que se rehacen solos y la hoja del resumen).
 * Abrir la mitad de la vuelta cuenta como «ver la vuelta»: se va el aviso de la campana de «has cambiado los días del viaje».
 */
export function LlegadaYVuelta({
  route,
  info,
  zonas = [],
  abierto,
  onToggle,
  onAbrir,
  mitadAbierta,
  onMitad,
  onCambioDeVuelo,
  onFechas,
}: {
  route: Route
  info: ArrivalInfo
  /** Las zonas del alojamiento del destino (para pedir la zona al poner la hora). */
  zonas: DestinationExcursions['zonasAlojamiento']
  abierto: boolean
  onToggle: () => void
  onAbrir: () => void
  /** undefined = la que falta; null = ninguna. */
  mitadAbierta: LegKind | null | undefined
  onMitad: (mitad: LegKind | null | undefined) => void
  /** El enganche de la Tanda 7: una hora o un punto de Roma (o la zona) ha cambiado, se ha puesto o se ha quitado. */
  onCambioDeVuelo: EnCambioDeVuelo
  onFechas: () => void
}) {
  const setArrivalFlightTime = useRouteStore((state) => state.setArrivalFlightTime)
  const setDepartureFlightTime = useRouteStore((state) => state.setDepartureFlightTime)
  const setLegPrecio = useRouteStore((state) => state.setLegPrecio)
  const setLegCodigo = useRouteStore((state) => state.setLegCodigo)
  const setLegCompania = useRouteStore((state) => state.setLegCompania)
  const setLegOtroPunto = useRouteStore((state) => state.setLegOtroPunto)
  const setLegOtraHora = useRouteStore((state) => state.setLegOtraHora)
  const setPoint = useRouteStore((state) => state.setArrivalPointId)
  const removeLeg = useRouteStore((state) => state.removeFlightLeg)
  const setZona = useRouteStore((state) => state.setAccommodationZone)
  const marcarVueltaVista = useRouteStore((state) => state.marcarVueltaVista)
  const zonaElegida = route.accommodationZone ?? null
  const pago = usePagoActivo()
  // Las hojas del tramo abierto: la rueda de la hora, la de la otra hora (opcional), el precio y la zona.
  const [hoja, setHoja] = useState<{ leg: LegKind; que: 'hora' | 'otraHora' | 'precio' } | 'zona' | null>(null)
  const hojaLeg = hoja && hoja !== 'zona' ? hoja : null
  const ida = legOf(route, info, 'arrival')
  const vuelta = legOf(route, info, 'departure')
  const origen = route.origin
  const ciudad = route.days[0]?.city ?? route.destination
  const hecho = ida.done && vuelta.done
  const nadaHecho = !ida.done && !vuelta.done
  const abiertaAhora: LegKind | null = mitadAbierta === undefined ? (!ida.done ? 'arrival' : !vuelta.done ? 'departure' : null) : mitadAbierta
  // El viajero ha abierto su vuelta: ya la ha visto con las fechas de ahora.
  const vueltaAbierta = abierto && abiertaAhora === 'departure'
  // (Con la fecha de la vuelta en la dependencia: si cambian las fechas con la vuelta a la vista, la ve con su día nuevo y no hace falta avisarle.)
  const fechaDeLaVuelta = route.answers.dateRange?.end ?? null
  useEffect(() => {
    if (vueltaAbierta) marcarVueltaVista()
  }, [vueltaAbierta, fechaDeLaVuelta, marcarVueltaVista])
  const etiqueta = legsTag(ida, vuelta)
  // «¿Aún no tienes vuelo? Buscar vuelos»: para el medio de la mitad que falta o de la que está abierta.
  const modos = [...new Set([ida, vuelta].filter((leg) => !leg.done || abiertaAhora === leg.kind).map((leg) => leg.mode))].filter((modo) => modo !== 'coche')

  const linea = (leg: LegState, mostrarAccion: boolean) => (
    <div
      key={leg.kind}
      onClick={() => {
        if (leg.mode === 'coche') return
        onAbrir()
        onMitad(leg.kind)
      }}
      className="flex min-h-[46px] items-center gap-2.5 rounded-[14px] py-2 pl-2.5 pr-3"
      style={{
        background: leg.done ? 'oklch(0.97 0.025 150)' : '#F7F1E6',
        border: `1px solid ${leg.done ? VERDE_LINEA : 'rgba(28,34,48,.08)'}`,
        cursor: leg.mode === 'coche' ? 'default' : 'pointer',
      }}
    >
      <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full" style={{ background: leg.done ? GR : '#FFFFFF', color: leg.done ? '#fff' : 'rgba(28,34,48,.6)' }}>
        <Icono nombre={iconoDeMedio(leg.mode)} size={13} />
      </span>
      <span className="min-w-0 flex-1 text-[13px] leading-[1.35]" style={{ color: leg.done ? INK : 'rgba(28,34,48,.7)', textWrap: 'pretty' as never }}>
        {legLine(leg)}
      </span>
      {mostrarAccion && leg.mode !== 'coche' && <span className="flex-none underline underline-offset-[3px]" style={{ font: "italic 400 15px 'Instrument Serif',serif" }}>{leg.done ? 'Cambiar' : 'Añadir'}</span>}
    </div>
  )

  return (
    <>
      <BloqueShell bloque="llegada">
        {!abierto && nadaHecho ? (
          <div onClick={onAbrir} className="flex cursor-pointer items-center gap-3 p-3.5">
            <IconoBloque nombre={iconoDeMedio(ida.mode)} />
            <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span style={tituloBloqueStyle}>Llegada y vuelta</span>
              <EstadoBloque texto={etiqueta} hecho={false} />
              <span className="text-[11.5px] text-text/55">
                {origen} → {ciudad}
              </span>
            </span>
            <FlechaBloque abierto={false} />
          </div>
        ) : !abierto ? (
          <div className="flex items-center gap-2 py-3 pl-3 pr-2">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {[ida, vuelta].map((leg) => (
                <div
                  key={leg.kind}
                  onClick={() => {
                    if (leg.mode === 'coche') return
                    onAbrir()
                    onMitad(leg.kind)
                  }}
                  className="flex items-start gap-[9px]"
                  style={{ cursor: leg.mode === 'coche' ? 'default' : 'pointer' }}
                >
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full" style={{ background: leg.done ? GR : '#F1EADC', color: leg.done ? '#fff' : 'rgba(28,34,48,.6)' }}>
                    <Icono nombre={iconoDeMedio(leg.mode)} size={12} />
                  </span>
                  <span className="min-w-0 flex-1 pt-[3px] text-[12.5px] leading-[1.4]" style={{ color: leg.done ? INK : 'rgba(28,34,48,.7)', textWrap: 'pretty' as never }}>
                    {legLine(leg)}
                    {!leg.done && leg.mode !== 'coche' && (
                      <>
                        {' · '}
                        <span className="font-semibold underline underline-offset-2" style={{ color: 'rgb(var(--accent-hover))' }}>
                          Añadir
                        </span>
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <CambiarBoton
              onClick={() => {
                onAbrir()
                onMitad(undefined)
              }}
            />
          </div>
        ) : (
          <>
            <div
              onClick={() => {
                onMitad(undefined)
                onToggle()
              }}
              className="flex cursor-pointer items-center gap-3 px-3.5 pb-2.5 pt-3.5"
            >
              <IconoBloque nombre={iconoDeMedio(ida.mode)} hecho={hecho} />
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span style={tituloBloqueStyle}>Llegada y vuelta</span>
                <EstadoBloque texto={etiqueta} hecho={hecho} />
                <span className="text-[11.5px] text-text/55">
                  {origen} → {ciudad}
                </span>
              </span>
              <Icono nombre="arriba" size={16} style={{ color: 'rgba(28,34,48,.45)' }} />
            </div>
            <div className="flex flex-col gap-2 px-3 pb-3.5">
              {[ida, vuelta].map((leg) =>
                abiertaAhora === leg.kind && leg.mode !== 'coche' ? (
                  <MitadAbierta
                    key={leg.kind}
                    leg={leg}
                    origen={origen}
                    ciudad={ciudad}
                    precio={leerImporte(leg.kind === 'arrival' ? route.arrivalPrecio : route.departurePrecio)}
                    onPoint={(pointId) => {
                      setPoint(leg.kind, pointId)
                      if (leg.time) onCambioDeVuelo({ que: 'punto', mitad: leg.kind })
                    }}
                    onTime={() => setHoja({ leg: leg.kind, que: 'hora' })}
                    onPrecio={() => setHoja({ leg: leg.kind, que: 'precio' })}
                    onCodigo={(texto) => setLegCodigo(leg.kind, texto)}
                    onCompania={(texto) => setLegCompania(leg.kind, texto)}
                    onOtraHora={() => setHoja({ leg: leg.kind, que: 'otraHora' })}
                    onOtroPunto={(texto) => setLegOtroPunto(leg.kind, texto)}
                    zonaPendiente={pago && Boolean(leg.time) && !zonaElegida && zonas.length > 0}
                    onZona={() => setHoja('zona')}
                    onFechas={onFechas}
                    onEliminar={() => {
                      const teniaHora = Boolean(leg.time)
                      quitarConDeshacer(`${leg.kind === 'arrival' ? 'Ida' : 'Vuelta'} quitada del viaje`, () => removeLeg(leg.kind))
                      onMitad(undefined)
                      if (teniaHora) onCambioDeVuelo({ que: 'quitar', mitad: leg.kind })
                    }}
                  />
                ) : (
                  linea(leg, true)
                ),
              )}
              {modos.map((modo) => (
                <span key={modo} className="px-1 pt-0.5 text-[12px] text-text/60">
                  {legWord(modo).search}{' '}
                  <a href={BUSCAR_BILLETE} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2" style={{ color: INK }}>
                    {legWord(modo).searchLabel}
                  </a>
                </span>
              ))}
            </div>
          </>
        )}
      </BloqueShell>
      {/* P1 (cuentas parte 3): con el vuelo guardado y sin el pase de este destino, debajo del vuelo: «Con el Pase de Roma, tu primer día se ajusta solo». Con el cobro apagado, nada. */}
      {/* Tanda 10G: sin el pase, debajo del vuelo guardado, la pieza del candado (la de toda la app): guardar el vuelo es gratis; ajustar el primer y el último día a él, del pase. */}
      {!pago && (ida.done || vuelta.done) && <Candado className="mt-2.5" datos="llegada-ajuste" titulo="Tu primer y tu último día" texto="Con el {pase}, ajustamos tu primer y tu último día a tu vuelo." />}
      {hojaLeg?.que === 'hora' && (
        <HojaHoraLlegada
          leg={hojaLeg.leg === 'arrival' ? ida : vuelta}
          ciudad={ciudad}
          onClose={() => setHoja(null)}
          onSave={(time, pointId) => {
            // (Tanda 7: el punto de Roma va con la hora: sin punto no se guarda una hora. Con un solo punto, ya es ese.)
            if (pointId) setPoint(hojaLeg.leg, pointId)
            ;(hojaLeg.leg === 'arrival' ? setArrivalFlightTime : setDepartureFlightTime)(time)
            setHoja(null)
            // (Tanda 6y6: tras guardar la hora el tramo SIGUE abierto, para rellenar la referencia, la compañía y el precio sin darle a «Cambiar»; se cierra al tocar la cabecera del bloque o al salir.)
            onMitad(hojaLeg.leg)
            onCambioDeVuelo({ que: 'hora', mitad: hojaLeg.leg })
          }}
        />
      )}
      {hojaLeg?.que === 'otraHora' && (
        <HojaHoraLlegada
          otra
          leg={hojaLeg.leg === 'arrival' ? ida : vuelta}
          ciudad={ciudad}
          onClose={() => setHoja(null)}
          onSave={(time) => {
            setLegOtraHora(hojaLeg.leg, time)
            setHoja(null)
          }}
          onBorrar={() => {
            setLegOtraHora(hojaLeg.leg, null)
            setHoja(null)
          }}
        />
      )}
      {hoja === 'zona' && (
        <HojaZona
          zonas={zonas}
          actual={zonaElegida}
          onGuardar={(id) => {
            setZona(id)
            setHoja(null)
            onCambioDeVuelo({ que: 'zona', mitad: null })
          }}
          onClose={() => setHoja(null)}
        />
      )}
      {hojaLeg?.que === 'precio' && (
        <HojaPrecio
          titulo={hojaLeg.leg === 'arrival' ? 'Precio de la ida' : 'Precio de la vuelta'}
          eyebrow={hojaLeg.leg === 'arrival' ? 'Ida' : 'Vuelta'}
          ayuda={hojaLeg.leg === 'arrival' ? 'Si la ida y la vuelta son un mismo billete, ponlo aquí y deja la vuelta vacía.' : 'Déjalo vacío si ya lo pusiste en la ida.'}
          inicial={leerImporte(hojaLeg.leg === 'arrival' ? route.arrivalPrecio : route.departurePrecio)}
          onGuardar={(precio) => setLegPrecio(hojaLeg.leg, precio)}
          onClose={() => setHoja(null)}
        />
      )}
    </>
  )
}

