import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouteStore } from '../../../store/useRouteStore'
import { usePresupuestoUi } from '../../../store/usePresupuestoUi'
import { useAlojamientoUi } from '../../../store/useAlojamientoUi'
import { usePresupuesto } from '../../../lib/usePresupuesto'
import { importeDeTexto, formatoImporte, leerImporte, precioGuardado } from '../../../lib/dinero'
import type { AbrirLinea, BloqueId, BloquePresupuesto, LineaPresupuesto } from '../../../lib/presupuesto'
import { monedaDelViajero, personasDelViaje, useMonedas } from '../../../lib/useMoneda'
import type { NombreIcono } from '../../../lib/iconos'
import { Icono } from '../../ui/Icono'
import type { Route } from '../../../lib/types'
import { rangoDelViaje } from '../ReservasPanel'
import { AddReservationSheet, type ReservationTarget } from '../reservas/AddReservationSheet'
import { HojaPrecio } from '../reservas/HojaPrecio'
import { HojaAbajo, ojoStyle } from '../reservas/HojaAbajo'

/** El color y el icono de cada bloque (la barra de la tarjeta oscura, el cuadradito de cada bloque y los puntos de debajo). */
const ESTILO: Record<BloqueId, { color: string; fondo: string; tinta: string; icono: NombreIcono }> = {
  transporte: { color: 'oklch(0.72 0.12 75)', fondo: 'oklch(0.72 0.12 75 / .16)', tinta: 'oklch(0.5 0.11 70)', icono: 'avion' },
  ruta: { color: 'rgb(var(--accent))', fondo: 'rgb(var(--accent) / .12)', tinta: 'rgb(var(--accent-hover))', icono: 'ruta' },
  util: { color: 'oklch(0.66 0.1 160)', fondo: 'oklch(0.6 0.1 160 / .14)', tinta: 'oklch(0.42 0.1 160)', icono: 'maleta' },
  extras: { color: 'oklch(0.65 0.1 220)', fondo: 'oklch(0.55 0.1 220 / .14)', tinta: 'oklch(0.45 0.1 220)', icono: 'extras' },
}
/** El icono de cada línea según lo que es (el billete, el hotel, la entrada…). */
function iconoDeLinea(abrir: AbrirLinea, bloque: BloqueId): NombreIcono {
  switch (abrir.tipo) {
    case 'llegada':
    case 'vuelta':
    case 'transporte':
      return 'avion'
    case 'alojamiento':
      return 'cama'
    case 'coche':
      return 'coche'
    case 'reserva':
      return 'reservas'
    case 'seguro':
      return 'seguro'
    case 'esim':
      return 'esim'
    default:
      return ESTILO[bloque].icono
  }
}
const caja = { border: '1px solid rgba(28,34,48,.07)', boxShadow: '0 1px 2px rgba(28,34,48,.05),0 12px 30px -22px rgba(28,34,48,.35)' }

/** Una línea de un bloque: nombre, lo de debajo y el importe; en otra moneda, «800 MXN» con «≈ 41 €» debajo (o «Sin cambio para MXN»). */
function Linea({ linea, bloque, moneda, onClick }: { linea: LineaPresupuesto; bloque: BloqueId; moneda: string; onClick?: () => void }) {
  const otraMoneda = linea.precio.currency !== moneda
  const contenido = (
    <>
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-white text-text/70">
        <Icono nombre={iconoDeLinea(linea.abrir, bloque)} size={15} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="text-[13px] font-medium leading-[1.25]">{linea.nombre}</span>
        {linea.sub && <span className="text-[11px] text-text/55">{linea.sub}</span>}
      </span>
      <span className="flex flex-none flex-col items-end gap-px">
        <span style={{ font: "600 13px 'Geist Mono',monospace" }}>{formatoImporte(linea.precio)}</span>
        {otraMoneda && (
          <span className="text-[11px] text-text/55" style={{ font: "500 11px 'Geist Mono',monospace" }}>
            {linea.enMonedaViajero ? `≈ ${formatoImporte(linea.enMonedaViajero)}` : `Sin cambio para ${linea.precio.currency}`}
          </span>
        )}
      </span>
    </>
  )
  const clase = 'flex min-h-[44px] w-full items-center gap-2.5 rounded-[14px] bg-[#F8F3EA] py-1.5 pl-1.5 pr-2.5 text-left text-text'
  return onClick ? (
    <button type="button" onClick={onClick} className={clase}>
      {contenido}
    </button>
  ) : (
    <div className={clase}>{contenido}</div>
  )
}

function CabeceraBloque({ id, titulo, suma }: { id: BloqueId; titulo: string; suma: string | null }) {
  const estilo = ESTILO[id]
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px]" style={{ background: estilo.fondo, color: estilo.tinta }}>
        <Icono nombre={estilo.icono} size={16} />
      </span>
      <span className="flex-1" style={{ font: "400 21px/1 'Instrument Serif',serif" }}>
        {titulo}
      </span>
      {suma && <span style={{ font: "600 13px 'Geist Mono',monospace" }}>{suma}</span>}
    </div>
  )
}

/** Los «Extras»: lo que apunta el viajero a mano (propinas, comidas, compras…): nombre, importe con su moneda y [Añadir]; cada uno con su ✕. */
function Extras({ bloque, moneda, route }: { bloque: BloquePresupuesto | null; moneda: string; route: Route }) {
  const addGastoExtra = useRouteStore((state) => state.addGastoExtra)
  const removeGastoExtra = useRouteStore((state) => state.removeGastoExtra)
  const { opciones } = useMonedas()
  const [nombre, setNombre] = useState('')
  const [importe, setImporte] = useState('')
  const [monedaElegida, setMoneda] = useState<string | null>(null)
  const monedaDelCampo = monedaElegida ?? moneda
  const precio = importeDeTexto(importe, monedaDelCampo)
  const listo = Boolean(nombre.trim()) && precio !== null
  const lineas = bloque?.lineas ?? []
  return (
    <div className="flex flex-none flex-col gap-2.5 rounded-[22px] bg-[#FFFDF8] p-3.5" style={caja} data-blk="extras">
      <CabeceraBloque id="extras" titulo="Extras" suma={bloque ? formatoImporte(bloque.suma) : null} />
      {lineas.map((linea) => {
        const extra = (route.gastosExtras ?? []).find((candidato) => `extra-${candidato.id}` === linea.id)
        return (
          <div key={linea.id} className="flex min-h-[44px] items-center gap-2.5 rounded-[14px] bg-[#F8F3EA] py-1 pl-3 pr-1">
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{linea.nombre}</span>
            <span className="flex flex-none flex-col items-end gap-px">
              <span style={{ font: "600 13px 'Geist Mono',monospace" }}>{formatoImporte(linea.precio)}</span>
              {linea.precio.currency !== moneda && (
                <span style={{ font: "500 11px 'Geist Mono',monospace" }} className="text-text/55">
                  {linea.enMonedaViajero ? `≈ ${formatoImporte(linea.enMonedaViajero)}` : `Sin cambio para ${linea.precio.currency}`}
                </span>
              )}
            </span>
            <button type="button" aria-label={`Quitar ${linea.nombre}`} onClick={() => extra && removeGastoExtra(extra.id)} className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-text/50 hover:bg-[#EDE4D3]">
              <Icono nombre="cerrar" size={14} />
            </button>
          </div>
        )
      })}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'minmax(0,1fr) 84px auto' }}>
        <input value={nombre} onChange={(event) => setNombre(event.target.value)} maxLength={60} placeholder="Cena el primer día" aria-label="Nombre del gasto" className="h-11 min-w-0 rounded-xl border border-text/[.12] bg-[#F5EFE4] px-3 text-[14px] outline-none" />
        <input value={importe} onChange={(event) => setImporte(event.target.value)} inputMode="decimal" placeholder="38" aria-label="Importe" className="h-11 min-w-0 rounded-xl border border-text/[.12] bg-[#F5EFE4] px-3 text-[14px] outline-none" style={{ fontFamily: "'Geist Mono',monospace" }} />
        <button
          type="button"
          disabled={!listo}
          onClick={() => {
            if (!precio) return
            addGastoExtra({ id: `extra-${Date.now()}`, nombre: nombre.trim(), precio })
            setNombre('')
            setImporte('')
          }}
          className="h-11 whitespace-nowrap rounded-xl px-3.5 text-[13px] font-semibold text-[#FFFDF8] transition-colors"
          style={{ background: listo ? 'oklch(0.55 0.17 5)' : 'oklch(0.55 0.17 5 / .4)' }}
        >
          Añadir
        </button>
      </div>
      <label className="flex items-center gap-2 text-[12px] text-text/60">
        Moneda
        <select value={monedaDelCampo} onChange={(event) => setMoneda(event.target.value)} aria-label="Moneda del gasto" className="h-8 rounded-lg border border-text/[.12] bg-[#F5EFE4] px-2 text-[12.5px] font-semibold text-text">
          {opciones.map((opcion) => (
            <option key={opcion.codigo} value={opcion.codigo}>
              {opcion.etiqueta}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

/** «¿Cuántas personas viajáis?»: solo para sacar el «por persona» del presupuesto. */
function HojaPersonas({ inicial, onGuardar, onClose }: { inicial: number | null; onGuardar: (personas: number | null) => void; onClose: () => void }) {
  const [texto, setTexto] = useState(inicial ? String(inicial) : '')
  const personas = Math.floor(Number(texto))
  return (
    <HojaAbajo titleId="hoja-personas" onClose={onClose} capa={100}>
      <p className="max-w-[calc(100%-2.5rem)] text-text/50" style={ojoStyle}>
        Presupuesto
      </p>
      <h2 id="hoja-personas" className="mt-1.5 font-display text-[24px] leading-[1.05] text-text">
        ¿Cuántas personas viajáis?
      </h2>
      <input value={texto} onChange={(event) => setTexto(event.target.value)} inputMode="numeric" placeholder="2" aria-label="Personas" className="mt-4 h-12 w-full rounded-[14px] border border-text/15 bg-white px-3.5 text-[15px] outline-none focus:border-text/50" />
      <button
        type="button"
        disabled={!(personas >= 1)}
        onClick={() => {
          onGuardar(personas)
          onClose()
        }}
        className="mt-4 h-[54px] w-full rounded-full bg-text text-[15px] font-semibold text-bg transition-transform active:scale-[.98] disabled:opacity-40"
      >
        Guardar
      </button>
    </HojaAbajo>
  )
}

/** La hoja de cada moneda del viajero: «Tu moneda: EUR · Cambiar». */
function HojaMoneda({ actual, onGuardar, onClose }: { actual: string; onGuardar: (moneda: string) => void; onClose: () => void }) {
  const { opciones } = useMonedas()
  const [moneda, setMoneda] = useState(actual)
  return (
    <HojaAbajo titleId="hoja-moneda" onClose={onClose} capa={100}>
      <p className="max-w-[calc(100%-2.5rem)] text-text/50" style={ojoStyle}>
        Presupuesto
      </p>
      <h2 id="hoja-moneda" className="mt-1.5 font-display text-[24px] leading-[1.05] text-text">
        Tu moneda
      </h2>
      <select value={moneda} onChange={(event) => setMoneda(event.target.value)} aria-label="Tu moneda" className="mt-4 h-12 w-full rounded-[14px] border border-text/15 bg-white px-3 text-[15px]">
        {[...new Set([actual, ...opciones.map((opcion) => opcion.codigo)])].map((codigo) => (
          <option key={codigo} value={codigo}>
            {codigo}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => {
          onGuardar(moneda)
          onClose()
        }}
        className="mt-4 h-[54px] w-full rounded-full bg-text text-[15px] font-semibold text-bg transition-transform active:scale-[.98]"
      >
        Guardar
      </button>
    </HojaAbajo>
  )
}

/**
 * La pantalla del presupuesto (Tanda 6z2, diseño `docs/diseno/presupuesto/Presupuesto.dc.html`): la tarjeta oscura con el total del viaje (y el «por persona» escondido con el ojo) y la barra de colores, los bloques
 * (Transporte y alojamiento, Ruta, Útil para el viaje y Extras) y el total otra vez. Solo suma lo que el viajero puso con su precio: nunca un número inventado. Lo que está en otra moneda se pasa a la del viajero con el
 * cambio del día (del Banco Central Europeo); sin cambio, sale aparte sin sumar. Las líneas se tocan para cambiar su precio (en el presupuesto no se reserva nada).
 */
export function PantallaPresupuesto() {
  const abierto = usePresupuestoUi((state) => state.abierto)
  const cerrar = usePresupuestoUi((state) => state.cerrar)
  const route = useRouteStore((state) => state.route)
  const reservations = useRouteStore((state) => state.reservations)
  const transportBookings = useRouteStore((state) => state.transportBookings)
  const insuranceBooking = useRouteStore((state) => state.insuranceBooking)
  const rentalVehicleBooking = useRouteStore((state) => state.rentalVehicleBooking)
  const esimPrecios = useRouteStore((state) => state.esimPrecios)
  const setLegPrecio = useRouteStore((state) => state.setLegPrecio)
  const setTransportBooking = useRouteStore((state) => state.setTransportBooking)
  const setInsuranceBooking = useRouteStore((state) => state.setInsuranceBooking)
  const setRentalVehicleBooking = useRouteStore((state) => state.setRentalVehicleBooking)
  const setEsimPrecio = useRouteStore((state) => state.setEsimPrecio)
  const setMonedaViajero = useRouteStore((state) => state.setMonedaViajero)
  const setPersonas = useRouteStore((state) => state.setPersonas)
  const abrirTuAlojamiento = useAlojamientoUi((state) => state.abrirTuAlojamiento)
  const { presupuesto, cambio } = usePresupuesto()
  const [verPorPersona, setVerPorPersona] = useState(false)
  const [hoja, setHoja] = useState<AbrirLinea | null>(null)
  const [hojaPersonas, setHojaPersonas] = useState(false)
  const [hojaMoneda, setHojaMoneda] = useState(false)
  if (!abierto || !route || !presupuesto) return null

  const moneda = monedaDelViajero(route)
  const personas = personasDelViaje(route)
  const total = presupuesto.total
  const hayGastos = presupuesto.bloques.length > 0
  const extras = presupuesto.bloques.find((bloque) => bloque.id === 'extras') ?? null
  const bloquesSinExtras = presupuesto.bloques.filter((bloque) => bloque.id !== 'extras')
  const simbolo = formatoImporte({ amount: 0, currency: moneda }).split(' ')[1]
  const porPersona = personas ? { amount: Math.round((total.amount / personas) * 100) / 100, currency: moneda } : null

  // La hoja que se abre al tocar una línea: la de siempre de cada cosa.
  const lineaDe = (id: string) => presupuesto.bloques.flatMap((bloque) => bloque.lineas).find((linea) => linea.id === id)
  const hojaAbierta = () => {
    if (!hoja) return null
    const cerrarHoja = () => setHoja(null)
    switch (hoja.tipo) {
      case 'reserva': {
        const reserva = reservations.find((candidata) => candidata.id === hoja.reservationId)
        if (!reserva) return null
        const target: ReservationTarget = { kind: reserva.kind, refId: reserva.refId, name: reserva.name, placeNames: reserva.placeNames, excursion: reserva.excursionData ?? null, existing: reserva }
        return <AddReservationSheet route={route} target={target} onClose={cerrarHoja} />
      }
      case 'llegada':
      case 'vuelta': {
        const kind = hoja.tipo === 'llegada' ? 'arrival' : 'departure'
        return <HojaPrecio titulo={hoja.tipo === 'llegada' ? 'Billete de ida' : 'Billete de vuelta'} inicial={leerImporte(kind === 'arrival' ? route.arrivalPrecio : route.departurePrecio)} onGuardar={(precio) => setLegPrecio(kind, precio)} onClose={cerrarHoja} />
      }
      case 'alojamiento':
        abrirTuAlojamiento(hoja.segmentDayId)
        setHoja(null)
        return null
      case 'transporte': {
        const reserva = transportBookings[hoja.dayId]
        return reserva ? <HojaPrecio titulo={reserva.operator} inicial={precioGuardado(reserva)} onGuardar={(precio) => setTransportBooking(hoja.dayId, { ...reserva, precio })} onClose={cerrarHoja} /> : null
      }
      case 'seguro':
        return insuranceBooking ? <HojaPrecio titulo="Seguro de viaje" inicial={precioGuardado(insuranceBooking)} onGuardar={(precio) => setInsuranceBooking({ ...insuranceBooking, precio })} onClose={cerrarHoja} /> : null
      case 'coche':
        return rentalVehicleBooking ? <HojaPrecio titulo="Coche de alquiler" inicial={precioGuardado(rentalVehicleBooking)} onGuardar={(precio) => setRentalVehicleBooking({ ...rentalVehicleBooking, precio })} onClose={cerrarHoja} /> : null
      case 'esim':
        return <HojaPrecio titulo={lineaDe(`esim-${hoja.pais}`)?.nombre ?? 'eSIM'} inicial={leerImporte(esimPrecios[hoja.pais])} onGuardar={(precio) => setEsimPrecio(hoja.pais, precio)} onClose={cerrarHoja} />
      default:
        return null
    }
  }

  const fechaCambio = cambio?.fecha ? new Date(`${cambio.fecha}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) : null

  return createPortal(
    <div className="map-cover-overlay fixed inset-0 z-[80] flex flex-col bg-bg" role="dialog" aria-modal="true" aria-labelledby="titulo-presupuesto">
      <div className="flex flex-none items-center gap-3 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))] md:px-8">
        <button type="button" onClick={cerrar} aria-label="Atrás" className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#FFFDF8] text-text shadow-[0_1px_2px_rgba(28,34,48,.08)]">
          <Icono nombre="atras" size={18} />
        </button>
        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span id="titulo-presupuesto" style={{ font: "400 28px/1 'Instrument Serif',serif" }}>
            Presupuesto
          </span>
          <span className="text-text/55" style={{ font: "500 11px/1.35 'Geist Mono',monospace", letterSpacing: '.06em' }}>
            {route.destination} · {rangoDelViaje(route)} ·{' '}
            {personas ? (
              <>
                {personas} {personas === 1 ? 'persona' : 'personas'}
              </>
            ) : (
              <button type="button" onClick={() => setHojaPersonas(true)} className="underline underline-offset-2">
                Cambiar personas
              </button>
            )}
          </span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-1.5 md:px-8">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-3.5">
          <div className="relative flex flex-none flex-col gap-3.5 overflow-hidden rounded-[26px] bg-[#1C2230] px-[18px] pb-4 pt-[18px] text-[#FFFDF8]">
            <span aria-hidden="true" className="absolute -right-10 -top-[50px] h-40 w-40 rounded-full" style={{ background: 'oklch(0.55 0.17 5 / .35)', filter: 'blur(28px)' }} />
            <div className="relative flex items-end justify-between gap-3">
              <span className="flex min-w-0 flex-col gap-1.5">
                <span className="text-[#FFFDF8]/60" style={ojoStyle}>
                  Total del viaje
                </span>
                {/* El total se achica si es largo (489,23 €) para no partirse en dos líneas junto al «por persona». */}
                <span className="whitespace-nowrap" style={{ font: `400 ${formatoImporte(total).length <= 7 ? 54 : formatoImporte(total).length <= 9 ? 44 : 36}px/.95 'Instrument Serif',serif` }}>
                  {formatoImporte(total)}
                </span>
              </span>
              {porPersona || personas === null ? (
                <button
                  type="button"
                  onClick={() => (porPersona ? setVerPorPersona((valor) => !valor) : setHojaPersonas(true))}
                  aria-label={verPorPersona ? 'Ocultar precio por persona' : 'Ver precio por persona'}
                  className="mb-1 flex h-[30px] flex-none items-center gap-[7px] rounded-full bg-[#FFFDF8]/10 px-2.5 text-[#FFFDF8] hover:bg-[#FFFDF8]/20"
                >
                  <span className="whitespace-nowrap text-[12px] font-medium">
                    <span style={{ font: "600 12px 'Geist Mono',monospace", letterSpacing: verPorPersona && porPersona ? 0 : '.08em' }}>{verPorPersona && porPersona ? formatoImporte(porPersona) : `${simbolo} •••`}</span> por persona
                  </span>
                  <span className="opacity-75">
                    <Icono nombre={verPorPersona ? 'ojo' : 'ojoCerrado'} size={14} />
                  </span>
                </button>
              ) : null}
            </div>
            {hayGastos && (
              <>
                <div className="relative flex h-2 overflow-hidden rounded-lg bg-[#FFFDF8]/10">
                  {presupuesto.bloques.map((bloque) => (
                    <span key={bloque.id} style={{ width: total.amount > 0 ? `${(bloque.suma.amount / total.amount) * 100}%` : '0%', background: ESTILO[bloque.id].color, transition: 'width .5s cubic-bezier(.2,.8,.2,1)' }} />
                  ))}
                </div>
                <div className="relative flex flex-wrap gap-x-3.5 gap-y-1.5">
                  {presupuesto.bloques.map((bloque) => (
                    <span key={bloque.id} className="flex items-center gap-1.5 text-[12px] font-medium text-[#FFFDF8]/80">
                      <span className="h-2 w-2 rounded-full" style={{ background: ESTILO[bloque.id].color }} />
                      {bloque.titulo.split(' y ')[0]} · {formatoImporte(bloque.suma)}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {!hayGastos && (
            <div className="flex flex-none flex-col gap-0.5 rounded-[14px] border border-dashed border-text/[.18] px-3.5 py-3.5">
              <span className="text-[13px] font-medium">Todavía no hay gastos</span>
              <span className="text-[12px] leading-[1.4] text-text/60">Aparecerán aquí cuando añadas tus reservas con su precio. Y puedes apuntar tus extras.</span>
            </div>
          )}

          {bloquesSinExtras.map((bloque) => (
            <div key={bloque.id} className="flex flex-none flex-col gap-2.5 rounded-[22px] bg-[#FFFDF8] p-3.5" style={caja} data-blk={bloque.id}>
              <CabeceraBloque id={bloque.id} titulo={bloque.titulo} suma={formatoImporte(bloque.suma)} />
              {bloque.lineas.map((linea) => (
                <Linea key={linea.id} linea={linea} bloque={bloque.id} moneda={moneda} onClick={linea.abrir.tipo === 'extra' ? undefined : () => setHoja(linea.abrir)} />
              ))}
            </div>
          ))}

          <Extras bloque={extras} moneda={moneda} route={route} />

          <div className="flex flex-none items-baseline justify-between border-t border-text/[.12] px-1.5 pt-1.5">
            <span className="pt-3 text-text/60" style={ojoStyle}>
              Total
            </span>
            <span className="pt-2.5" style={{ font: "400 30px/1 'Instrument Serif',serif" }}>
              {formatoImporte(total)}
            </span>
          </div>
          <div className="flex flex-col gap-1 px-1.5 text-[11.5px] leading-[1.4] text-text/55">
            {presupuesto.hayConversion && fechaCambio && <span>Cambio aproximado del {fechaCambio}.</span>}
            {presupuesto.sinCambio.length > 0 && (
              <span>
                Sin sumar: {presupuesto.sinCambio.map((linea) => `${linea.nombre} (${formatoImporte(linea.precio)}, sin cambio para ${linea.precio.currency})`).join('; ')}.
              </span>
            )}
            <span>
              Tu moneda: {moneda} ·{' '}
              <button type="button" onClick={() => setHojaMoneda(true)} className="font-semibold text-text underline underline-offset-2">
                Cambiar
              </button>
            </span>
          </div>
        </div>
      </div>

      {hojaAbierta()}
      {hojaPersonas && <HojaPersonas inicial={personas} onGuardar={setPersonas} onClose={() => setHojaPersonas(false)} />}
      {hojaMoneda && <HojaMoneda actual={moneda} onGuardar={setMonedaViajero} onClose={() => setHojaMoneda(false)} />}
    </div>,
    document.body,
  )
}
