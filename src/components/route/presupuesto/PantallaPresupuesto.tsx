import { useState } from 'react'
import { useLoSuyoDelViaje } from '../../../hooks/useLoSuyoDelViaje'
import { useHuecoAlFinal } from '../../propuesta/BotonDePropuesta'
import { createPortal } from 'react-dom'
import { useRouteStore } from '../../../store/useRouteStore'
import { usePresupuestoUi } from '../../../store/usePresupuestoUi'
import { useAlojamientoUi } from '../../../store/useAlojamientoUi'
import { usePresupuesto } from '../../../lib/usePresupuesto'
import { importeDeTexto, formatoImporte, leerImporte, monedaConNombre, nombreDeMoneda, precioGuardado, convertir, sumar, type Importe } from '../../../lib/dinero'
import type { AbrirLinea, BloqueId, BloquePresupuesto, LineaPresupuesto } from '../../../lib/presupuesto'
import { monedaDelViajero, useMonedas } from '../../../lib/useMoneda'
import type { NombreIcono } from '../../../lib/iconos'
import { Icono } from '../../ui/Icono'
import type { Route } from '../../../lib/types'
import { AddReservationSheet, type ReservationTarget } from '../reservas/AddReservationSheet'
import { HojaPrecio } from '../reservas/HojaPrecio'
import { HojaAbajo, ojoStyle } from '../reservas/HojaAbajo'
import { useGastosDelViaje } from '../../../hooks/useGastosDelViaje'
import { useCuentasDelGrupo } from '../../../hooks/useCuentasDelGrupo'
import { ExtrasCompartidos } from './ExtrasCompartidos'
import { HojaAnadirGasto } from './HojaAnadirGasto'
import { HojaMonedaViajero } from '../../moneda/HojaMonedaViajero'
import { MONEDA_BASE, useMonedaViajero } from '../../../lib/moneda'
import { PantallaCuentas, TarjetaCuentas } from './PantallaCuentas'
import type { CuentaComun } from './BloqueDinero'
import { cuentaDelViaje, esFamilia, nombreDeLaCuentaComun } from '../../../lib/cuentaDelViaje'
import { bloquesDeLoMio, partesDeUnaPersona, type ParteDeUnGasto } from '../../../lib/miCuenta'
import { useGastosCompartidos } from '../../../store/useGastosCompartidos'
import type { GastoCompartido } from '../../../lib/gastosCompartidos'

/** El color y el icono de cada bloque (la barra de la tarjeta oscura, el cuadradito de cada bloque y los puntos de debajo). */
const ESTILO: Record<BloqueId, { color: string; fondo: string; tinta: string; icono: NombreIcono }> = {
  transporte: { color: 'oklch(0.72 0.12 75)', fondo: 'oklch(0.72 0.12 75 / .16)', tinta: 'oklch(0.5 0.11 70)', icono: 'avion' },
  ruta: { color: 'rgb(var(--accent))', fondo: 'rgb(var(--accent) / .12)', tinta: 'rgb(var(--accent-hover))', icono: 'ruta' },
  util: { color: 'oklch(0.66 0.1 160)', fondo: 'oklch(0.6 0.1 160 / .14)', tinta: 'oklch(0.42 0.1 160)', icono: 'maleta' },
  extras: { color: 'oklch(0.65 0.1 220)', fondo: 'oklch(0.55 0.1 220 / .14)', tinta: 'oklch(0.45 0.1 220)', icono: 'presupuesto' },
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
        <span style={{ font: "600 13px 'Geist Mono',monospace" }}>{linea.enMonedaViajero && linea.precio.currency !== moneda ? `≈ ${formatoImporte(linea.enMonedaViajero)}` : formatoImporte(linea.precio)}</span>
        {otraMoneda && (
          <span className="text-[11px] text-text/55" style={{ font: "500 11px 'Geist Mono',monospace" }}>
            {linea.enMonedaViajero ? formatoImporte(linea.precio) : 'Sin cambio a tu moneda'}
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
  // (Tanda 10N8 §0b-5; `Cuentas Modo` 01) Viajando solo: el bloque termina en «Añadir gasto» (punteado), que abre el formulario.
  const [formAbierto, setFormAbierto] = useState(false)
  return (
    <div className="flex flex-none flex-col gap-2.5 rounded-[22px] bg-[#FFFDF8] p-3.5" style={caja} data-blk="extras">
      <CabeceraBloque id="extras" titulo="Extras" suma={bloque ? formatoImporte(bloque.suma) : null} />
      {lineas.map((linea) => {
        const extra = (route.gastosExtras ?? []).find((candidato) => `extra-${candidato.id}` === linea.id)
        return (
          <div key={linea.id} className="flex min-h-[44px] items-center gap-2.5 rounded-[14px] bg-[#F8F3EA] py-1 pl-3 pr-1">
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{linea.nombre}</span>
            <span className="flex flex-none flex-col items-end gap-px">
              <span style={{ font: "600 13px 'Geist Mono',monospace" }}>{linea.enMonedaViajero && linea.precio.currency !== moneda ? `≈ ${formatoImporte(linea.enMonedaViajero)}` : formatoImporte(linea.precio)}</span>
              {linea.precio.currency !== moneda && (
                <span style={{ font: "500 11px 'Geist Mono',monospace" }} className="text-text/55">
                  {linea.enMonedaViajero ? formatoImporte(linea.precio) : 'Sin cambio a tu moneda'}
                </span>
              )}
            </span>
            <button type="button" aria-label={`Quitar ${linea.nombre}`} onClick={() => extra && removeGastoExtra(extra.id)} className="zona-toque flex h-9 w-9 flex-none items-center justify-center rounded-full text-text/50 hover:bg-[#EDE4D3]">
              <Icono nombre="cerrar" size={14} />
            </button>
          </div>
        )
      })}
      {!formAbierto && (
        <button type="button" onClick={() => setFormAbierto(true)} data-anadir-gasto className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] text-[14px] font-semibold" style={{ border: '1.5px dashed rgba(181,138,46,.55)', color: '#8A6420', background: 'transparent' }}>
          <Icono nombre="anadir" size={16} />
          Añadir gasto
        </button>
      )}
      {formAbierto && <><div className="grid gap-1.5" style={{ gridTemplateColumns: 'minmax(0,1fr) 84px auto' }}>
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
            setFormAbierto(false)
          }}
          className="btn-champan h-11 whitespace-nowrap rounded-xl px-3.5 text-[13px] font-semibold transition-opacity"
          style={{ opacity: listo ? 1 : 0.45 }}
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
      </label></>}
    </div>
  )
}

/** Las dos pestañas de la tarjeta oscura (Tanda 10N10 §5b; `Piezas/Presupuesto Compartido` 01 y 03): «Mi cuenta» siempre a la izquierda. */
function InterruptorDeCuenta({ valor, onCambio, nombreComun }: { valor: 'mia' | 'comun'; onCambio: (v: 'mia' | 'comun') => void; nombreComun: string }) {
  const boton = (id: 'mia' | 'comun', texto: string) => (
    <button
      key={id}
      type="button"
      role="tab"
      aria-selected={valor === id}
      data-pestana-cuenta={id}
      onClick={() => onCambio(id)}
      className="zona-toque flex h-[30px] flex-1 items-center justify-center rounded-full"
      style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', background: valor === id ? '#FFFDF8' : 'transparent', color: valor === id ? '#1C2230' : 'rgba(255,253,248,.7)' }}
    >
      {texto}
    </button>
  )
  return (
    <div role="tablist" aria-label="Cuenta" data-interruptor-cuenta className="relative flex gap-1 rounded-full p-[3px]" style={{ background: 'rgba(255,253,248,.1)' }}>
      {boton('mia', 'Mi cuenta')}
      {boton('comun', nombreComun)}
    </div>
  )
}

/** (10N10 §5b) «Tu parte de la cuenta conjunta: 130 €»: el detalle de los gastos comunes que forman mi parte; desde ahí se toca cada gasto para corregirlo. */
function HojaTuParte({ cuentaTxt, partes, total, texto, onAbrir, onClose }: { cuentaTxt: string; partes: ParteDeUnGasto[]; total: string; texto: (c: number) => string; onAbrir: (p: ParteDeUnGasto) => void; onClose: () => void }) {
  return (
    <HojaAbajo titleId="hoja-tu-parte" onClose={onClose} capa={100}>
      <h2 id="hoja-tu-parte" data-titulo-tu-parte className="max-w-[calc(100%-3rem)] font-display text-[26px] leading-[1.05] text-text">
        Tu parte de {cuentaTxt}
      </h2>
      <span data-tu-parte-total className="mt-1 block text-[14px] font-semibold" style={{ color: '#6F4E37' }}>
        {total}
      </span>
      <div className="mt-4 flex flex-col gap-2">
        {partes.map((p) => (
          <button key={p.aportacion.id} type="button" data-tu-parte-fila={p.aportacion.nombre} onClick={() => onAbrir(p)} className="flex min-h-[48px] w-full items-center gap-2.5 rounded-[14px] bg-[#F8F3EA] px-3 py-1.5 text-left text-text">
            <span className="flex min-w-0 flex-1 flex-col gap-px">
              <span className="truncate text-[13.5px] font-medium">{p.aportacion.nombre}</span>
              <span className="text-[11px] text-text/55">Te toca de {texto(p.aportacion.centimos)}</span>
            </span>
            <span style={{ font: "600 13px 'Geist Mono',monospace" }}>{texto(p.centimos)}</span>
            <span className="flex-none text-text/45">
              <Icono nombre="adelante" size={13} />
            </span>
          </button>
        ))}
        {partes.length === 0 && <span className="text-[14px] text-text/60">Aún no hay nada común que te toque.</span>}
      </div>
    </HojaAbajo>
  )
}

/**
 * La pantalla del presupuesto (Tanda 6z2; Tanda 10N10 §5 `Piezas/Presupuesto Compartido`): la tarjeta oscura con el importe y la barra de colores (la leyenda, siempre con importes), los bloques (Transporte y alojamiento, Ruta,
 * Útil para el viaje y Extras) y el total otra vez. Solo suma lo que el viajero puso con su precio: nunca un número inventado.
 *   · una persona: «Total del viaje», sin interruptor;
 *   · dos personas o una familia: «Mi cuenta | Cuenta conjunta»; tres o más: «Mi cuenta | Cuenta del grupo»;
 *   · «Mi cuenta»: lo mío (reservas solo para mí + Extras míos) y la línea amarilla «Tu parte de la cuenta conjunta», que se toca; el importe es lo que le cuesta el viaje a quien mira;
 *   · cuenta común: lo que es para varios, y la tarjeta «¿Quién debe a quién?»; el importe es todo lo común.
 */
export function PantallaPresupuesto() {
  const huecoAlFinal = useHuecoAlFinal(32) // (Tanda 10N4 §0b) hueco para el lápiz y los logros
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
  useMonedaViajero() // (10N7) se repinta al cambiar la moneda, también desde Ajustes
  const abrirTuAlojamiento = useAlojamientoUi((state) => state.abrirTuAlojamiento)
  const { presupuesto, cambio } = usePresupuesto()
  const [hoja, setHoja] = useState<AbrirLinea | null>(null)
  const [hojaMoneda, setHojaMoneda] = useState(false)
  const [cuentasAbiertas, setCuentasAbiertas] = useState(false)
  const pestana = usePresupuestoUi((state) => state.pestana)
  const setPestana = usePresupuestoUi((state) => state.ponerPestana)
  const [tuParteAbierta, setTuParteAbierta] = useState(false)
  const [gastoEditando, setGastoEditando] = useState<GastoCompartido | null>(null)
  const gv = useGastosDelViaje()
  const cuentas = useCuentasDelGrupo()
  const todosLosGastos = useGastosCompartidos((s) => s.gastos)
  useLoSuyoDelViaje()
  if (!abierto || !route || !presupuesto) return null

  const moneda = monedaDelViajero(route)
  // (10N10 §5a) La cuenta la decide la app según las personas: sola / conjunta / del grupo.
  const tipoCuenta = gv.compartido ? cuentaDelViaje(gv.personas.length, esFamilia(route)) : 'solo'
  const conInterruptor = tipoCuenta !== 'solo'
  const cuentaComun: CuentaComun = tipoCuenta === 'grupo' ? 'grupo' : 'conjunta'
  const nombreComun = nombreDeLaCuentaComun(tipoCuenta === 'grupo' ? 'grupo' : 'conjunta')
  const enMia = conInterruptor && pestana === 'mia'
  const extrasComunes = presupuesto.bloques.find((bloque) => bloque.id === 'extras') ?? null
  const bloquesComunes = presupuesto.bloques
  const bloquesMios = bloquesDeLoMio(presupuesto.loTuyo, moneda)
  const extrasMios = bloquesMios.find((b) => b.id === 'extras') ?? null
  // Mi parte de lo común, al céntimo (el mismo reparto que las deudas).
  const partes = partesDeUnaPersona(cuentas.aportaciones, gv.yoId)
  const miParteCentimos = partes.reduce((t, p) => t + p.centimos, 0)
  const miParte: Importe = convertir({ amount: miParteCentimos / 100, currency: MONEDA_BASE }, moneda, cambio) ?? { amount: miParteCentimos / 100, currency: MONEDA_BASE }
  const totalMio = sumar([presupuesto.sumaLoTuyo, miParte], moneda)
  const totalComun = presupuesto.total
  const importeArriba = enMia ? totalMio : totalComun
  const textoParte = formatoImporte(miParte)
  const hayComunes = cuentas.cuentas.hayGastos

  // Lo que se pinta en la barra y la leyenda: siempre con importes. En «Mi cuenta», mis bloques y «Tu parte».
  const COLOR_PARTE = '#D2B67A'
  // (10S4 §1) En la barra y la leyenda, «Transporte» y «Alojamiento» van separados (abajo el bloque sigue junto: «Transporte y alojamiento»).
  const COLOR_ALOJ = 'oklch(0.7 0.1 35)'
  const esAloj = (l: LineaPresupuesto) => l.id.startsWith('aloj-') || l.id === 'mi-aloj'
  const segmentosDe = (b: BloquePresupuesto): { id: string; titulo: string; suma: Importe; color: string }[] => {
    if (b.id !== 'transporte') return [{ id: b.id, titulo: b.titulo.split(' y ')[0], suma: b.suma, color: ESTILO[b.id].color }]
    const sumaDe = (ls: LineaPresupuesto[]) => sumar(ls.flatMap((l) => (l.enMonedaViajero ? [l.enMonedaViajero] : [])), moneda)
    const aloj = b.lineas.filter(esAloj)
    const trans = b.lineas.filter((l) => !esAloj(l))
    return [
      ...(trans.length > 0 ? [{ id: 'transporte', titulo: 'Transporte', suma: sumaDe(trans), color: ESTILO.transporte.color }] : []),
      ...(aloj.length > 0 ? [{ id: 'alojamiento', titulo: 'Alojamiento', suma: sumaDe(aloj), color: COLOR_ALOJ }] : []),
    ]
  }
  const segmentos: { id: string; titulo: string; suma: Importe; color: string }[] = enMia
    ? [...bloquesMios.flatMap(segmentosDe), ...(miParteCentimos > 0 ? [{ id: 'parte', titulo: 'Tu parte', suma: miParte, color: COLOR_PARTE }] : [])]
    : bloquesComunes.flatMap(segmentosDe)
  const hayGastos = segmentos.length > 0

  // La hoja que se abre al tocar una línea: la de siempre de cada cosa.
  const lineaDe = (id: string) => [...presupuesto.bloques, ...bloquesMios].flatMap((bloque) => bloque.lineas).find((linea) => linea.id === id)
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
  const abrirDeParte = (p: ParteDeUnGasto) => {
    const l = lineaDe(p.aportacion.clave ?? p.aportacion.id)
    const gastoId = l?.compartido?.gastoId ?? (p.aportacion.id.startsWith('gasto-') ? p.aportacion.id.slice(6) : null)
    setTuParteAbierta(false)
    const g = gastoId ? todosLosGastos.find((x) => x.id === gastoId) : null
    if (g) setGastoEditando(g)
    else if (l && !gv.esInvitado) setHoja(l.abrir)
  }
  const bloquesVisibles = (enMia ? bloquesMios : bloquesComunes).filter((b) => b.id !== 'extras')
  const extrasVisibles = enMia ? extrasMios : extrasComunes
  const totalAbajo = enMia ? totalMio : totalComun

  return createPortal(
    <div className="map-cover-overlay fixed inset-0 z-[80] flex flex-col bg-bg" role="dialog" aria-modal="true" aria-labelledby="titulo-presupuesto" data-flotantes>
      <div className="flex flex-none items-center gap-3 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))] md:px-8">
        <button type="button" onClick={cerrar} aria-label="Atrás" className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#FFFDF8] text-text shadow-[0_1px_2px_rgba(28,34,48,.08)]">
          <Icono nombre="atras" size={18} />
        </button>
        {/* (10N10 §4) El título, solo: el destino y las fechas ya se ven en el mapa. */}
        <span id="titulo-presupuesto" className="min-w-0 flex-1" style={{ font: "400 28px/1 'Instrument Serif',serif" }}>
          Presupuesto
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-1.5 md:px-8" style={{ paddingBottom: huecoAlFinal }}>
        <div className="mx-auto flex w-full max-w-lg flex-col gap-3.5">
          <div className="relative flex flex-none flex-col gap-3.5 overflow-hidden rounded-[26px] bg-[#1C2230] px-[18px] pb-4 pt-[18px] text-[#FFFDF8]">
            <span aria-hidden="true" className="absolute -right-10 -top-[50px] h-40 w-40 rounded-full" style={{ background: 'rgba(233,199,122,.3)', filter: 'blur(28px)' }} />
            {conInterruptor ? (
              <InterruptorDeCuenta valor={pestana} onCambio={setPestana} nombreComun={nombreComun} />
            ) : (
              <span className="relative text-[#FFFDF8]/60" style={ojoStyle} data-total-del-viaje>
                Total del viaje
              </span>
            )}
            {/* El total se achica si es largo (489,23 €) para no partirse en dos líneas. */}
            <span data-importe-arriba className="relative whitespace-nowrap" style={{ font: `400 ${formatoImporte(importeArriba).length <= 7 ? 54 : formatoImporte(importeArriba).length <= 9 ? 44 : 36}px/.95 'Instrument Serif',serif` }}>
              {formatoImporte(importeArriba)}
            </span>
            {hayGastos && (
              <>
                <div className="relative flex h-2 overflow-hidden rounded-lg bg-[#FFFDF8]/10">
                  {segmentos.map((s) => (
                    <span key={s.id} style={{ width: importeArriba.amount > 0 ? `${(s.suma.amount / importeArriba.amount) * 100}%` : '0%', background: s.color, transition: 'width .5s cubic-bezier(.2,.8,.2,1)' }} />
                  ))}
                </div>
                <div data-leyenda className="relative flex flex-wrap gap-x-3.5 gap-y-1.5">
                  {segmentos.map((s) => (
                    <span key={s.id} data-leyenda-item={s.id} className="flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-[#FFFDF8]/80">
                      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                      {s.titulo} · {formatoImporte(s.suma)}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* (10N10 §5b) «¿Quién debe a quién?»: solo en las pestañas comunes y cuando hay gastos comunes. */}
          {conInterruptor && !enMia && hayComunes && <TarjetaCuentas onAbrir={() => setCuentasAbiertas(true)} />}

          {/* (Tanda 10N6 §1j) Sin gastos: el MISMO bloque «Ruta» de siempre, vacío (sin importe) y con su línea. Debajo, «Extras». */}
          {segmentos.length === 0 && (
            <div className="flex flex-none flex-col gap-2.5 rounded-[22px] bg-[#FFFDF8] p-3.5" style={caja} data-blk="ruta" data-bloque-vacio>
              <CabeceraBloque id="ruta" titulo="Ruta" suma={null} />
              <span data-linea-vacia className="px-1 pb-1.5 pt-1 text-[14px] leading-[1.45] text-text/[.58]">
                Aquí se irán añadiendo todos los gastos de tu ruta.
              </span>
            </div>
          )}

          {bloquesVisibles.map((bloque) => (
            <div key={bloque.id} className="flex flex-none flex-col gap-2.5 rounded-[22px] bg-[#FFFDF8] p-3.5" style={caja} data-blk={bloque.id}>
              <CabeceraBloque id={bloque.id} titulo={bloque.titulo} suma={formatoImporte(bloque.suma)} />
              {bloque.lineas.map((linea) => (
                <Linea key={linea.id} linea={linea} bloque={bloque.id} moneda={moneda} onClick={linea.abrir.tipo === 'extra' || gv.esInvitado ? undefined : () => setHoja(linea.abrir)} />
              ))}
            </div>
          ))}

          {gv.compartido ? (
            <ExtrasCompartidos
              cabecera={<CabeceraBloque id="extras" titulo="Extras" suma={extrasVisibles ? formatoImporte(extrasVisibles.suma) : null} />}
              bloque={extrasVisibles}
              gv={gv}
              moneda={moneda}
              pestana={enMia ? 'mia' : 'comun'}
              cuenta={cuentaComun}
            />
          ) : (
            <Extras bloque={extrasComunes} moneda={moneda} route={route} />
          )}

          {/* (10N10 §5b) La línea amarilla de «Mi cuenta»: se toca y abre el detalle de mi parte. */}
          {enMia && hayComunes && (
            <button
              type="button"
              data-tu-parte-linea
              onClick={() => setTuParteAbierta(true)}
              className="flex flex-none items-center gap-2.5 rounded-[16px] px-3.5 py-3 text-left text-[13px] font-semibold"
              style={{ background: '#F1E3BF', color: '#6F4E37' }}
            >
              <span className="min-w-0 flex-1">
                Tu parte de {tipoCuenta === 'grupo' ? 'la cuenta del grupo' : 'la cuenta conjunta'}: {textoParte}
              </span>
              <span className="flex-none opacity-60">
                <Icono nombre="adelante" size={13} />
              </span>
            </button>
          )}

          <div className="flex flex-none items-baseline justify-between border-t border-text/[.12] px-1.5 pt-1.5">
            <span className="pt-3 text-text/60" style={ojoStyle}>
              Total
            </span>
            <span data-total-final className="pt-2.5" style={{ font: "400 30px/1 'Instrument Serif',serif" }}>
              {formatoImporte(totalAbajo)}
            </span>
          </div>
          <div className="flex flex-col gap-1 px-1.5 text-[11.5px] leading-[1.4] text-text/55">
            {presupuesto.hayConversion && fechaCambio && <span>Cambio aproximado del {fechaCambio}.</span>}
            {presupuesto.sinCambio.length > 0 && (
              <span>
                Sin sumar: {presupuesto.sinCambio.map((linea) => `${linea.nombre} (${formatoImporte(linea.precio)}, sin cambio para ${linea.precio.currency})`).join('; ')}.
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setHojaMoneda(true)}
            data-fila-moneda
            aria-label={`Moneda: ${nombreDeMoneda(moneda)}. Cambiar`}
            className="flex min-h-[52px] w-full flex-none items-center gap-2.5 rounded-[22px] bg-[#FFFDF8] px-4 text-left text-text"
            style={caja}
          >
            <span className="flex-1 text-[14px] font-medium">Moneda</span>
            <span className="text-[14px] font-semibold" style={{ fontFamily: "'Geist Mono',monospace" }}>
              {monedaConNombre(moneda)}
            </span>
            <span className="flex-none text-text/45">
              <Icono nombre="adelante" size={14} />
            </span>
          </button>
        </div>
      </div>

      {hojaAbierta()}
      {cuentasAbiertas && gv.compartido && <PantallaCuentas onCerrar={() => setCuentasAbiertas(false)} />}
      {tuParteAbierta && <HojaTuParte cuentaTxt={tipoCuenta === 'grupo' ? 'la cuenta del grupo' : 'la cuenta conjunta'} partes={partes} total={textoParte} texto={cuentas.texto} onAbrir={abrirDeParte} onClose={() => setTuParteAbierta(false)} />}
      {gastoEditando && <HojaAnadirGasto gv={gv} moneda={moneda} pestana={gastoEditando.ambito === 'mio' ? 'mia' : 'comun'} cuenta={cuentaComun} editar={gastoEditando} onClose={() => setGastoEditando(null)} />}
      {hojaMoneda && <HojaMonedaViajero etiqueta="Presupuesto" onCerrar={() => setHojaMoneda(false)} />}
    </div>,
    document.body,
  )
}
