import { precioEnVista, useMonedaViajero } from '../../../lib/moneda'
import { esDestinoDeCoche } from '../../../lib/experienceCategoryBank'
import type { Route } from '../../../lib/types'
import { buildDestinationSegments } from '../../../lib/destinationSegments'
import { countryDisplayName } from '../../../lib/readiness'
import { buildCamperRentalLink, buildCarRentalLink } from '../../../lib/vehicleRentalLinks'
import { useRouteStore } from '../../../store/useRouteStore'
import { quitarConDeshacer } from '../../../store/useAddFlowStore'
import { ENLACE_ESIM, ENLACE_SEGURO, ENLACE_TARJETA } from '../../../lib/enlacesUtil'
import { GR, ICONOS } from './BloqueReservas'
import { HojaPrecio } from './HojaPrecio'
import { leerImporte, precioGuardado, type Importe } from '../../../lib/dinero'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useReservasFocusStore } from '../../../store/useReservasFocusStore'
import { esimNecesaria, idDeTarjetaEsim, paisDeSalida } from '../../../lib/esim'
import { Icono } from '../../ui/Icono'
import type { NombreIcono } from '../../../lib/iconos'

/** Una tarjeta de «Útil para el viaje»: lo que es, a dónde lleva [Comprar] y, si el viajero ya lo tiene, cómo se añade (con su precio, opcional) y se quita. La tarjeta sin comisiones no lleva precio. */
interface Tarjeta {
  id: string
  nombre: string
  /** Una línea corta de para qué sirve. */
  sirve: string
  etiqueta?: string
  icono: NombreIcono
  enlace: string
  articulo: 'lo' | 'la'
  anadida: boolean
  precio: Importe | null
  conPrecio: boolean
  /** Tanda 6y4: la clave de «¿Dónde lo has comprado?» (seguro, tarjeta, eSIM de cada país); sin ella (coche, buscar vuelos), la hoja no lo pregunta. */
  claveDonde?: string
  /** (V22) «Ya tengo seguro» / «Ya la tengo»: para quien ya lo tiene (con el banco, con otro seguro…); pregunta solo «¿Cuál?», opcional, sin precio. */
  yaLoTengo?: { texto: string; guardar: (cual: string) => void }
  /** (V22) La eSIM que no hace falta (mismo país o roaming como en casa): sin botones, solo el aviso pequeño. */
  noHaceFalta?: string
  guardar: (precio: Importe | null, donde: string) => void
  quitar: () => void
}

/**
 * «Útil para el viaje» (Tanda 6s, 6z3 y 6z6b): SOLO una fila de tarjetas que se desliza de lado (seguro de viaje, eSIM del país, tarjeta sin comisiones y, si hay, el vehículo de alquiler; en la versión gratis, al final,
 * «Buscar vuelos»), con `scroll-snap` y tan anchas que a 375 px se ve una entera y media. Cada una: su icono, la etiqueta «5 % dto.» si la tiene, el nombre, para qué sirve y dos botones. [Comprar] abre la tienda
 * con nuestro enlace y nada más (**comprar no marca nada como añadido**). [Añadir] es para quien ya lo tiene: abre la hoja de precio opcional (`HojaPrecio`), que suma al presupuesto. Ya añadida, la tarjeta dice
 * «✓ Lo tienes» (con su precio) en vez de los botones; al tocarla se cambia o se elimina. Igual en la gratis y en la de pago. Nunca el nombre de un proveedor en los textos.
 */
/** (V22) «Ya tengo seguro» / «Ya la tengo»: solo pregunta «¿Cuál?» (opcional, sin precio) y deja la ficha en verde. */
function HojaYaLoTengo({ tarjeta, onClose }: { tarjeta: Tarjeta | null; onClose: () => void }) {
  const [cual, setCual] = useState('')
  if (!tarjeta?.yaLoTengo) return null
  const guardar = () => {
    tarjeta.yaLoTengo?.guardar(cual.trim())
    onClose()
  }
  return createPortal(
    <div data-hoja-ya-lo-tengo className="fixed inset-0 z-[95]" role="dialog" aria-modal="true" aria-label={tarjeta.yaLoTengo.texto}>
      <div onClick={onClose} className="absolute inset-0 bg-text/40" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3.5 rounded-t-[30px] bg-[#FFFDF8] px-[18px] pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-2.5">
        <span className="h-[5px] w-[42px] self-center rounded bg-text/20" />
        <span className="text-[26px] leading-[1.05]" style={{ fontFamily: "'Instrument Serif',serif" }}>{tarjeta.yaLoTengo.texto}</span>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">¿Cuál? <span className="font-normal text-text/45">· opcional</span></span>
          <input data-campo-cual value={cual} onChange={(e) => setCual(e.target.value)} placeholder="Ej.: el de mi tarjeta" maxLength={80} className="h-[46px] rounded-[14px] border border-text/15 bg-white px-3.5 text-[14px]" />
        </label>
        <button type="button" data-guardar-ya-lo-tengo onClick={guardar} className="zona-toque h-[52px] rounded-2xl btn-champan text-[15.5px] font-bold">Guardar</button>
      </div>
    </div>,
    document.body,
  )
}

export function UtilParaElViaje({ route }: { route: Route; /** (Ya no se usa: «Buscar vuelos» salió de aquí.) */ pago?: boolean }) {
  useMonedaViajero() // (10N7) se repinta al cambiar la moneda
  const dateRange = route.answers.dateRange
  const insurance = useRouteStore((state) => state.insuranceBooking)
  const setInsuranceBooking = useRouteStore((state) => state.setInsuranceBooking)
  const n26 = useRouteStore((state) => state.n26Added)
  const setN26Added = useRouteStore((state) => state.setN26Added)
  const esim = useRouteStore((state) => state.esimSelections)
  const setEsimSelection = useRouteStore((state) => state.setEsimSelection)
  const rental = useRouteStore((state) => state.rentalVehicleBooking)
  const setRentalVehicleBooking = useRouteStore((state) => state.setRentalVehicleBooking)
  const esimPrecios = useRouteStore((state) => state.esimPrecios)
  const setEsimPrecio = useRouteStore((state) => state.setEsimPrecio)
  const dondeComprado = useRouteStore((state) => state.dondeComprado)
  const setDondeComprado = useRouteStore((state) => state.setDondeComprado)
  const [hojaPrecio, setHojaPrecio] = useState<string | null>(null)
  const [hojaYa, setHojaYa] = useState<string | null>(null)
  const utilPedida = useReservasFocusStore((s) => s.utilPedida)
  const limpiarUtil = useReservasFocusStore((s) => s.limpiarUtil)
  const origenPais = paisDeSalida(route.answers)
  /** Los países del viaje, sin repetir y en orden: una eSIM por país (el estado se guarda por país, así que va igual que antes en el acordeón de cada destino). */
  const paises = [...new Set(buildDestinationSegments(route.days).flatMap((segment) => (segment.countryCode ? [segment.countryCode] : [])))]
  const isCamper = route.transportContext.vehicle_type === 'camper'
  // (LZ2b1) En Lanzarote el coche de alquiler va en su bloque «Coche» (con el interruptor), no aquí.
  const hasRentalVehicle = route.transportContext.vehicle_ownership === 'rental' && !esDestinoDeCoche(route.destination)
  const alquiler = isCamper ? buildCamperRentalLink(route.days[0]?.countryCode ?? null) : buildCarRentalLink()
  const nombreAlquiler = isCamper ? 'Camper de alquiler' : 'Vehículo de alquiler'

  const tarjetas: Tarjeta[] = [
    {
      id: 'seguro',
      nombre: 'Seguro de viaje',
      sirve: 'Te cubre si te pones malo o se cancela el viaje.',
      etiqueta: '5 % dto.',
      icono: ICONOS.shield,
      enlace: ENLACE_SEGURO,
      articulo: 'lo',
      anadida: Boolean(insurance),
      precio: precioGuardado(insurance),
      conPrecio: true,
      claveDonde: 'seguro',
      yaLoTengo: {
        texto: 'Ya tengo seguro',
        guardar: (cual) => {
          setInsuranceBooking({ provider: 'Ya tengo seguro', startDate: dateRange?.start ?? '', endDate: dateRange?.end ?? '', precio: null })
          setDondeComprado('seguro', cual)
        },
      },
      guardar: (precio, donde) => {
        setInsuranceBooking({ provider: 'Seguro de viaje', startDate: dateRange?.start ?? '', endDate: dateRange?.end ?? '', precio })
        setDondeComprado('seguro', donde)
      },
      quitar: () => {
        setInsuranceBooking(null)
        setDondeComprado('seguro', null)
      },
    },
    ...paises.map((countryCode, indice) => ({
      id: idDeTarjetaEsim(indice, countryCode),
      noHaceFalta: esimNecesaria(origenPais, countryCode) === 'no' ? `No la necesitas: tu tarifa vale en ${countryDisplayName(countryCode)}` : undefined,
      yaLoTengo: {
        texto: 'Ya la tengo',
        guardar: (cual: string) => {
          setEsimSelection(countryCode, 'booked')
          setEsimPrecio(countryCode, null)
          setDondeComprado(`esim-${countryCode}`, cual)
        },
      },
      nombre: 'eSIM de datos',
      sirve: paises.length > 1 ? `Internet en el móvil en ${countryDisplayName(countryCode)}.` : 'Internet en el móvil nada más llegar.',
      etiqueta: '5 % dto.',
      icono: ICONOS.sim,
      enlace: ENLACE_ESIM,
      articulo: 'la' as const,
      anadida: Boolean(esim[countryCode]),
      precio: leerImporte(esimPrecios[countryCode]),
      conPrecio: true,
      claveDonde: `esim-${countryCode}`,
      guardar: (precio: Importe | null, donde: string) => {
        setEsimSelection(countryCode, 'booked')
        setEsimPrecio(countryCode, precio)
        setDondeComprado(`esim-${countryCode}`, donde)
      },
      quitar: () => {
        setEsimSelection(countryCode, null)
        setEsimPrecio(countryCode, null)
        setDondeComprado(`esim-${countryCode}`, null)
      },
    })),
    {
      id: 'tarjeta',
      nombre: 'Tarjeta sin comisiones',
      sirve: 'Paga y saca dinero fuera sin comisiones.',
      icono: ICONOS.card,
      enlace: ENLACE_TARJETA,
      articulo: 'la',
      anadida: n26,
      precio: null,
      conPrecio: false,
      claveDonde: 'tarjeta',
      guardar: (_precio: Importe | null, donde: string) => {
        setN26Added(true)
        setDondeComprado('tarjeta', donde)
      },
      quitar: () => {
        setN26Added(false)
        setDondeComprado('tarjeta', null)
      },
    },
    ...(hasRentalVehicle
      ? [
          {
            id: 'alquiler',
            nombre: nombreAlquiler,
            sirve: isCamper ? 'Tu camper esperándote al llegar.' : 'Tu coche esperándote al llegar.',
            icono: ICONOS.coche,
            enlace: alquiler.url,
            articulo: 'lo' as const,
            anadida: Boolean(rental),
            precio: precioGuardado(rental),
            conPrecio: true,
            guardar: (precio: Importe | null, _donde: string) => setRentalVehicleBooking({ provider: nombreAlquiler, startDate: rental?.startDate ?? '', endDate: rental?.endDate ?? '', precio }),
            quitar: () => setRentalVehicleBooking(null),
          },
        ]
      : []),
    // (6-nov, Eric) Fuera la tarjeta «Buscar vuelos»: el vuelo ya tiene su bloque con [Buscar vuelos] (LlegadaYVuelta). En los destinos con el bloque del coche (Lanzarote) tampoco sale la del alquiler: está repetida.
  ]
  const abierta = tarjetas.find((tarjeta) => tarjeta.id === hojaPrecio) ?? null
  // (V22) Una ficha del resumen de arriba («Seguro de viaje», «eSIM») pide su tarjeta: se baja a ella en el carril y se abre (si no la necesitas o ya la tienes, solo se baja).
  useEffect(() => {
    if (!utilPedida) return
    const tarjeta = tarjetas.find((t) => t.id === utilPedida)
    limpiarUtil()
    window.setTimeout(() => {
      document.querySelector(`[data-util-tarjeta="${utilPedida}"]`)?.scrollIntoView({ block: 'nearest', inline: 'start', behavior: 'smooth' })
      if (tarjeta && !tarjeta.anadida && !tarjeta.noHaceFalta) setHojaPrecio(tarjeta.id)
    }, 450)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [utilPedida])
  /** [Añadir] o tocar la tarjeta ya añadida: con precio, la hoja; sin precio (la tarjeta sin comisiones), se marca o se quita directamente. */
  // (Tanda 6y4: también la tarjeta sin comisiones abre su hoja, que es solo el campo «¿Dónde lo has comprado?».)
  const gestionar = (tarjeta: Tarjeta) => setHojaPrecio(tarjeta.id)
  const dondeDe = (tarjeta: Tarjeta) => (tarjeta.claveDonde ? dondeComprado[tarjeta.claveDonde] ?? '' : '')
  /** Quitar una tarjeta (seguro, eSIM, tarjeta, coche): con el mensaje corto de abajo con «Deshacer» (Tanda 6y4, una sola función: `quitarConDeshacer`). */
  const quitarTarjeta = (tarjeta: Tarjeta) => quitarConDeshacer(`${tarjeta.nombre} quitad${tarjeta.articulo === 'la' ? 'a' : 'o'} del viaje`, tarjeta.quitar)

  return (
    <div className="flex min-w-0 flex-col gap-2.5 pt-4" data-blk="util">
      <span className="text-text/50" style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }}>
        Útil para el viaje
      </span>
      <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-util-carril="1">
        {tarjetas.map((tarjeta) => (
          <div
            key={tarjeta.id}
            data-util-tarjeta={tarjeta.id}
            className="flex min-h-[176px] w-[220px] flex-none snap-start flex-col gap-2.5 rounded-[20px] border border-text/[.08] bg-white p-3.5 text-left text-text"
            style={{ borderColor: tarjeta.anadida ? 'oklch(0.55 0.11 150 / .35)' : undefined, background: tarjeta.anadida ? 'oklch(0.97 0.025 150)' : undefined }}
          >
            <span className="flex items-center justify-between gap-1.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[11px]" style={{ background: 'rgb(var(--accent-soft))', color: 'rgb(var(--accent))' }}>
                <Icono nombre={tarjeta.icono} size={18} />
              </span>
              {tarjeta.etiqueta && !tarjeta.noHaceFalta && <span className="h-[20px] rounded-full bg-[#F5EFE4] px-2 font-mono text-[10.5px] font-semibold leading-[20px] text-text/70">{tarjeta.etiqueta}</span>}
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <span style={{ font: "400 19px/1.1 'Instrument Serif',serif" }}>{tarjeta.nombre}</span>
              {!tarjeta.noHaceFalta && <span className="text-[12.5px] leading-[1.35] text-text/65">{tarjeta.sirve}</span>}
            </span>
            {tarjeta.anadida ? (
              <button
                type="button"
                onClick={() => gestionar(tarjeta)}
                data-util-lo-tienes="1"
                className="zona-toque mt-auto flex h-10 w-full items-center gap-2 rounded-full px-3 text-left text-[13.5px] font-semibold"
                style={{ background: 'oklch(0.96 0.035 150)', color: 'oklch(0.38 0.1 150)', border: `1px solid ${'oklch(0.55 0.11 150 / .35)'}` }}
              >
                <span className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full text-[10px] font-bold leading-none text-white" style={{ background: GR }} aria-hidden="true">
                  ✓
                </span>
                <span className="min-w-0 flex-1 truncate">
                  Lo tienes
                  {dondeDe(tarjeta) && <span className="font-medium"> · {dondeDe(tarjeta)}</span>}
                  {tarjeta.precio && <span className="font-medium"> · {precioEnVista(tarjeta.precio)}</span>}
                </span>
                {/* Con el lugar y el precio juntos («Lo tienes · Mi banco · 30 €») no cabe la palabra «Cambiar» en 220 px: la tarjeta entera sigue siendo el botón. */}
                {!(dondeDe(tarjeta) && tarjeta.precio) && <span className="flex-none text-[12px] font-medium underline underline-offset-2">Cambiar</span>}
              </button>
            ) : tarjeta.noHaceFalta ? (
              <span data-esim-no-hace-falta className="mt-auto text-[12.5px] leading-[1.35] text-text/60">
                {tarjeta.noHaceFalta}
              </span>
            ) : (
              <span className="mt-auto flex flex-col gap-1.5">
                <span className="flex gap-2">
                <a href={tarjeta.enlace} target="_blank" rel="noopener noreferrer" className="zona-toque flex h-10 flex-1 items-center justify-center rounded-full btn-champan text-[13.5px] font-semibold no-underline">
                  Comprar
                </a>
                <button type="button" onClick={() => gestionar(tarjeta)} className="zona-toque flex h-10 flex-1 items-center justify-center rounded-full border border-text/20 bg-white text-[13.5px] font-semibold text-text">
                  Añadir
                </button>
                </span>
                {tarjeta.yaLoTengo && (
                  <button type="button" data-ya-lo-tengo={tarjeta.id} onClick={() => setHojaYa(tarjeta.id)} className="zona-toque min-h-[36px] text-center text-[12.5px] font-medium text-text/60 underline underline-offset-2">
                    {tarjeta.yaLoTengo.texto}
                  </button>
                )}
              </span>
            )}
          </div>
        ))}
      </div>
      {hojaYa && <HojaYaLoTengo tarjeta={tarjetas.find((t) => t.id === hojaYa) ?? null} onClose={() => setHojaYa(null)} />}
      {abierta && (
        <HojaPrecio
          titulo={abierta.nombre}
          eyebrow={abierta.anadida ? 'Precio' : 'Añádelo a tu viaje'}
          cta={abierta.anadida ? 'Guardar' : 'Añadir'}
          inicial={abierta.precio}
          conDonde={Boolean(abierta.claveDonde)}
          sinPrecio={!abierta.conPrecio}
          dondeInicial={dondeDe(abierta)}
          onGuardar={abierta.guardar}
          onQuitar={abierta.anadida ? () => quitarTarjeta(abierta) : undefined}
          onClose={() => setHojaPrecio(null)}
        />
      )}
    </div>
  )
}
