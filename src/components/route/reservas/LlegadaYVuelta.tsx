import { useState } from 'react'
import type { Route } from '../../../lib/types'
import { puntoCorto, type ArrivalInfo } from '../../../lib/arrivalReturn'
import { legLine, legOf, legsTag, legWord, type LegKind, type LegState } from '../../../lib/reservasLegs'
import { shortDateEs } from '../../../lib/bookings'
import { useRouteStore } from '../../../store/useRouteStore'
import { quitarConDeshacer } from '../../../store/useAddFlowStore'
import { TimeListWheel } from '../../ui/TimeListWheel'
import { BloqueShell, CambiarBoton, EliminarTexto, FlechaBloque, EstadoBloque, GR, INK, IconoBloque, VERDE_LINEA, VERDE_SUAVE, iconoDeMedio, tituloBloqueStyle } from './BloqueReservas'
import { HojaAbajo, ojoStyle } from './HojaAbajo'
import { HojaPrecio } from './HojaPrecio'
import { formatoImporte, leerImporte, type Importe } from '../../../lib/dinero'
import { Icono } from '../../ui/Icono'

const HORAS = Array.from({ length: (24 * 60 - 360) / 5 }, (_, i) => {
  const m = 360 + i * 5
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
})
const HORA_POR_DEFECTO: Record<LegKind, string> = { arrival: '11:15', departure: '18:05' }

/** El enlace de buscar billete: el que ya usaban las filas de transporte. */
const BUSCAR_BILLETE = 'https://www.skyscanner.net'

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

/** La hoja de la hora de una mitad: solo la rueda de la 6k, de 5 en 5 minutos. El precio, la referencia y la compañía se rellenan en las casillas del tramo abierto (Tanda 6y5). */
export function HojaHoraLlegada({ leg, ciudad, onSave, onClose }: { leg: LegState; ciudad: string; onSave: (time: string) => void; onClose: () => void }) {
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
      <button type="button" onClick={() => onSave(hora)} className="mt-4 h-[54px] w-full rounded-full bg-text text-[15px] font-semibold text-bg transition-transform active:scale-[.98]">
        Guardar · {hora}
      </button>
    </HojaAbajo>
  )
}

const etiquetaCasilla = { font: "600 10px 'Geist Mono',monospace", letterSpacing: '.12em', textTransform: 'uppercase' as const }

/** Una casilla del tramo abierto que se toca y abre una hoja («Llega», «Precio»): la etiqueta pequeña arriba y debajo lo que hay o lo que falta. */
function CasillaToque({ etiqueta, valor, vacio, icono, onClick }: { etiqueta: string; valor: string | null; vacio: string; icono: 'reloj' | 'anadir'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-casilla={etiqueta}
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
function CasillaTexto({ etiqueta, valor, ejemplo, mayusculas, onGuardar }: { etiqueta: string; valor: string; ejemplo: string; mayusculas?: boolean; onGuardar: (texto: string) => void }) {
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
        data-casilla={etiqueta}
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
          <CasillaToque etiqueta="Precio" valor={precio ? formatoImporte(precio) : null} vacio="Añadir" icono="anadir" onClick={onPrecio} />
          <CasillaTexto key={`ref-${leg.mode}`} etiqueta={palabras.refLabel} valor={leg.codigo ?? ''} ejemplo="AB 1234" mayusculas onGuardar={onCodigo} />
          <CasillaTexto key={`cia-${leg.mode}`} etiqueta={palabras.companiaLabel} valor={leg.compania ?? ''} ejemplo="Opcional" onGuardar={onCompania} />
        </div>
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
            <p className="text-[14px] leading-snug text-text">¿Seguro que quieres eliminar este {palabras.noun}?</p>
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
          <EliminarTexto onClick={() => setSeguro(true)} texto={`Eliminar ${palabras.noun}`} />
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
  const setLegCodigo = useRouteStore((state) => state.setLegCodigo)
  const setLegCompania = useRouteStore((state) => state.setLegCompania)
  const setPoint = useRouteStore((state) => state.setArrivalPointId)
  const removeLeg = useRouteStore((state) => state.removeFlightLeg)
  // Las dos hojas del tramo abierto: la rueda de la hora y el precio.
  const [hoja, setHoja] = useState<{ leg: LegKind; que: 'hora' | 'precio' } | null>(null)
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
                    onPoint={(pointId) => setPoint(leg.kind, pointId)}
                    onTime={() => setHoja({ leg: leg.kind, que: 'hora' })}
                    onPrecio={() => setHoja({ leg: leg.kind, que: 'precio' })}
                    onCodigo={(texto) => setLegCodigo(leg.kind, texto)}
                    onCompania={(texto) => setLegCompania(leg.kind, texto)}
                    onFechas={onFechas}
                    onEliminar={() => {
                      quitarConDeshacer(`${leg.kind === 'arrival' ? 'Ida' : 'Vuelta'} quitada del viaje`, () => removeLeg(leg.kind))
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
      {hoja?.que === 'hora' && (
        <HojaHoraLlegada
          leg={hoja.leg === 'arrival' ? ida : vuelta}
          ciudad={ciudad}
          onClose={() => setHoja(null)}
          onSave={(time) => {
            ;(hoja.leg === 'arrival' ? setArrivalFlightTime : setDepartureFlightTime)(time)
            setHoja(null)
            // (Tanda 6y6: tras guardar la hora el tramo SIGUE abierto, para rellenar la referencia, la compañía y el precio sin darle a «Cambiar»; se cierra al tocar la cabecera del bloque o al salir.)
            onMitad(hoja.leg)
            onGuardada()
          }}
        />
      )}
      {hoja?.que === 'precio' && (
        <HojaPrecio
          titulo={hoja.leg === 'arrival' ? 'Precio de la ida' : 'Precio de la vuelta'}
          eyebrow={hoja.leg === 'arrival' ? 'Ida' : 'Vuelta'}
          ayuda={hoja.leg === 'arrival' ? 'Si la ida y la vuelta son un mismo billete, ponlo aquí y deja la vuelta vacía.' : 'Déjalo vacío si ya lo pusiste en la ida.'}
          inicial={leerImporte(hoja.leg === 'arrival' ? route.arrivalPrecio : route.departurePrecio)}
          onGuardar={(precio) => setLegPrecio(hoja.leg, precio)}
          onClose={() => setHoja(null)}
        />
      )}
    </>
  )
}

