import { useState } from 'react'
import type { Route } from '../../../lib/types'
import { puntoCorto, type ArrivalInfo } from '../../../lib/arrivalReturn'
import { legLine, legOf, legsTag, legWord, type LegKind, type LegState } from '../../../lib/reservasLegs'
import { shortDateEs } from '../../../lib/bookings'
import { useRouteStore } from '../../../store/useRouteStore'
import { TimeListWheel } from '../../ui/TimeListWheel'
import { BloqueShell, CambiarBoton, EliminarTexto, FlechaBloque, GR, INK, Icono, IconoBloque, PastillaEstado, VERDE_LINEA, VERDE_SUAVE, iconoDeMedio, tituloBloqueStyle } from './BloqueReservas'
import { HojaAbajo, ojoStyle } from './HojaAbajo'
import { CampoPrecio } from '../../ui/CampoPrecio'
import { usePrecioEditable } from '../../../lib/useMoneda'
import { leerImporte, type Importe } from '../../../lib/dinero'

const HORAS = Array.from({ length: (24 * 60 - 360) / 5 }, (_, i) => {
  const m = 360 + i * 5
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
})
const HORA_POR_DEFECTO: Record<LegKind, string> = { arrival: '11:15', departure: '18:05' }

/** El enlace de buscar billete: el que ya usaban las filas de transporte. */
const BUSCAR_BILLETE = 'https://www.skyscanner.net'

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

/** La hoja de la hora de una mitad: la rueda de la 6k, de 5 en 5 minutos. */
function HojaHoraLlegada({ leg, ciudad, precioInicial, onSave, onClose }: { leg: LegState; ciudad: string; precioInicial: Importe | null; onSave: (time: string, precio: Importe | null) => void; onClose: () => void }) {
  // (Tanda 6z2) El precio del billete, total de todas las personas. Si la ida y la vuelta son un mismo billete, se pone en la ida y la vuelta se queda vacía.
  const precio = usePrecioEditable(precioInicial)
  const [hora, setHora] = useState(leg.time && HORAS.includes(leg.time) ? leg.time : HORA_POR_DEFECTO[leg.kind])
  const lugar = leg.point ? puntoCorto(leg.point) : ciudad
  const fecha = leg.dateIso ? capitalizar(shortDateEs(leg.dateIso)) : `Día ${leg.dayNumber}`
  return (
    <HojaAbajo titleId="hoja-hora-leg" onClose={onClose}>
      <p className="max-w-[calc(100%-2.5rem)] text-text/50" style={ojoStyle}>
        {leg.kind === 'arrival' ? 'Hora de llegada' : 'Hora de salida'}
      </p>
      <h2 id="hoja-hora-leg" className="mt-1.5 font-display text-[24px] leading-[1.05] text-text">
        {leg.kind === 'arrival' ? `Llegas a ${lugar}` : `Sales de ${lugar}`}
      </h2>
      <p className="mt-1 text-[12px] text-text/60">{fecha}</p>
      <div className="mt-3.5">
        <TimeListWheel items={HORAS} value={hora} onChange={setHora} label={leg.kind === 'arrival' ? 'Hora de llegada' : 'Hora de salida'} />
      </div>
      <div className="mt-4">
        <CampoPrecio estado={precio} ayuda={leg.kind === 'arrival' ? 'Si la ida y la vuelta son un mismo billete, ponlo aquí y deja la vuelta vacía.' : 'Déjalo vacío si ya lo pusiste en la ida.'} />
      </div>
      <button type="button" onClick={() => onSave(hora, precio.importe)} className="mt-4 h-[54px] w-full rounded-full bg-text text-[15px] font-semibold text-bg transition-transform active:scale-[.98]">
        Guardar · {hora}
      </button>
    </HojaAbajo>
  )
}

/** Una mitad abierta, como media tarjeta de embarque: de dónde a dónde, los botones del punto, la hora y «¿Llegas o te vas otro día?». */
function MitadAbierta({
  leg,
  origen,
  ciudad,
  onPoint,
  onTime,
  onFechas,
  onEliminar,
}: {
  leg: LegState
  origen: string
  ciudad: string
  onPoint: (pointId: string) => void
  onTime: () => void
  onFechas: () => void
  onEliminar: () => void
}) {
  const [seguro, setSeguro] = useState(false)
  const esIda = leg.kind === 'arrival'
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
            <Icono d={iconoDeMedio(leg.mode)} size={12} stroke={2} />
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
        <button
          type="button"
          onClick={onTime}
          className="flex h-12 items-center gap-2.5 rounded-[14px] px-3.5 text-left transition-colors"
          style={{ border: `1.5px solid ${leg.time ? 'oklch(0.55 0.11 150 / .35)' : 'transparent'}`, background: leg.time ? VERDE_SUAVE : '#F5EFE4', color: INK }}
        >
          <span className="text-text/55" style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.12em', textTransform: 'uppercase' }}>
            {esIda ? 'Llega' : 'Sale'}
          </span>
          <span className="flex-1 text-left" style={{ font: leg.time ? "400 22px/1 'Instrument Serif',serif" : "500 14px 'Geist'", color: leg.time ? INK : 'rgba(28,34,48,.55)' }}>
            {leg.time ?? 'Elige la hora'}
          </span>
          <Icono d="M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" size={16} stroke={1.8} />
        </button>
        <span className="text-[11px] leading-[1.35] text-text/60">
          ¿Llegas o te vas otro día?{' '}
          <button type="button" onClick={onFechas} className="underline underline-offset-2" style={{ color: INK }}>
            Cambia las fechas del viaje
          </button>
        </span>
      </div>
      {leg.done && leg.mode !== 'coche' && (
        seguro ? (
          <div className="flex flex-col gap-2.5 border-t border-text/10 pt-3 text-center">
            <p className="text-[14px] leading-snug text-text">¿Seguro que quieres eliminar este {legWord(leg.mode).noun}?</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSeguro(false)} className="h-11 flex-1 rounded-full border border-text/15 text-[14.5px] font-medium text-text hover:bg-bg-hover">
                Cancelar
              </button>
              <button type="button" onClick={onEliminar} className="h-11 flex-1 rounded-full bg-accent-red text-[14.5px] font-semibold text-white active:scale-[.98]">
                Eliminar
              </button>
            </div>
          </div>
        ) : (
          <EliminarTexto onClick={() => setSeguro(true)} texto={`Eliminar ${legWord(leg.mode).noun}`} />
        )
      )}
    </div>
  )
}

/**
 * El bloque «Llegada y vuelta» de RESERVAS (de pago, Tanda 6s): la ida y la vuelta con el medio que eligió el viajero. Cerrado y vacío, una tarjeta con «Falta»; abierto, se abre la
 * mitad que falta y la hecha queda en una línea con «Cambiar»; cerrado con algo hecho, dos líneas cortas. Lo que se guarde aquí todavía no cambia la ruta (eso es de la Tanda 7).
 */
export function LlegadaYVuelta({
  route,
  info,
  abierto,
  onToggle,
  onAbrir,
  mitadAbierta,
  onMitad,
  onGuardada,
  onFechas,
}: {
  route: Route
  info: ArrivalInfo
  abierto: boolean
  onToggle: () => void
  onAbrir: () => void
  /** undefined = la que falta; null = ninguna. */
  mitadAbierta: LegKind | null | undefined
  onMitad: (mitad: LegKind | null | undefined) => void
  /** Al guardar una hora: la ventana «¿Ajustamos tu ruta a tu vuelo?» de siempre. */
  onGuardada: () => void
  onFechas: () => void
}) {
  const setArrivalFlightTime = useRouteStore((state) => state.setArrivalFlightTime)
  const setDepartureFlightTime = useRouteStore((state) => state.setDepartureFlightTime)
  const setLegPrecio = useRouteStore((state) => state.setLegPrecio)
  const setPoint = useRouteStore((state) => state.setArrivalPointId)
  const removeLeg = useRouteStore((state) => state.removeFlightLeg)
  const [hoja, setHoja] = useState<LegKind | null>(null)
  const ida = legOf(route, info, 'arrival')
  const vuelta = legOf(route, info, 'departure')
  const origen = route.origin
  const ciudad = route.days[0]?.city ?? route.destination
  const hecho = ida.done && vuelta.done
  const nadaHecho = !ida.done && !vuelta.done
  const abiertaAhora: LegKind | null = mitadAbierta === undefined ? (!ida.done ? 'arrival' : !vuelta.done ? 'departure' : null) : mitadAbierta
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
        <Icono d={iconoDeMedio(leg.mode)} size={13} stroke={1.9} />
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
            <IconoBloque d={iconoDeMedio(ida.mode)} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span style={tituloBloqueStyle}>Llegada y vuelta</span>
              <span className="text-[11.5px] text-text/55">
                {origen} → {ciudad}
              </span>
            </span>
            <PastillaEstado texto="Falta" hecho={false} />
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
                    <Icono d={iconoDeMedio(leg.mode)} size={12} stroke={1.9} />
                  </span>
                  <span className="min-w-0 flex-1 pt-[3px] text-[12.5px] leading-[1.4]" style={{ color: leg.done ? INK : 'rgba(28,34,48,.7)', textWrap: 'pretty' as never }}>
                    {legLine(leg)}
                    {!leg.done && leg.mode !== 'coche' && (
                      <>
                        {' · '}
                        <span className="font-semibold underline underline-offset-2" style={{ color: 'oklch(0.5 0.17 5)' }}>
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
            <div onClick={onToggle} className="flex cursor-pointer items-center gap-3 px-3.5 pb-2.5 pt-3.5">
              <IconoBloque d={iconoDeMedio(ida.mode)} hecho={hecho} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span style={tituloBloqueStyle}>Llegada y vuelta</span>
                <span className="text-[11.5px] text-text/55">
                  {origen} → {ciudad}
                </span>
              </span>
              <PastillaEstado texto={etiqueta} hecho={hecho} />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(28,34,48,.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 15l6-6 6 6" />
              </svg>
            </div>
            <div className="flex flex-col gap-2 px-3 pb-3.5">
              {[ida, vuelta].map((leg) =>
                abiertaAhora === leg.kind && leg.mode !== 'coche' ? (
                  <MitadAbierta
                    key={leg.kind}
                    leg={leg}
                    origen={origen}
                    ciudad={ciudad}
                    onPoint={(pointId) => setPoint(leg.kind, pointId)}
                    onTime={() => setHoja(leg.kind)}
                    onFechas={onFechas}
                    onEliminar={() => {
                      removeLeg(leg.kind)
                      onMitad(undefined)
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
      {hoja && (
        <HojaHoraLlegada
          leg={hoja === 'arrival' ? ida : vuelta}
          ciudad={ciudad}
          precioInicial={leerImporte(hoja === 'arrival' ? route.arrivalPrecio : route.departurePrecio)}
          onClose={() => setHoja(null)}
          onSave={(time, precio) => {
            ;(hoja === 'arrival' ? setArrivalFlightTime : setDepartureFlightTime)(time)
            setLegPrecio(hoja, precio)
            setHoja(null)
            onMitad(undefined)
            onGuardada()
          }}
        />
      )}
    </>
  )
}

