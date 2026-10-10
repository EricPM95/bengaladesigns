import type { Route } from '../../../lib/types'
import { buildDestinationSegments } from '../../../lib/destinationSegments'
import { countryDisplayName } from '../../../lib/readiness'
import { buildCamperRentalLink, buildCarRentalLink } from '../../../lib/vehicleRentalLinks'
import { useRouteStore } from '../../../store/useRouteStore'
import { ENLACE_ESIM, ENLACE_SEGURO, ENLACE_TARJETA } from '../../../lib/enlacesUtil'
import { GR, ICONOS } from './BloqueReservas'
import { HojaPrecio } from './HojaPrecio'
import { formatoImporte, leerImporte, precioGuardado, type Importe } from '../../../lib/dinero'
import { useState } from 'react'
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
  color: string
  enlace: string
  /** «Buscar vuelos» (gratis) solo busca: no se compra ni se añade. */
  soloBuscar?: boolean
  articulo: 'lo' | 'la'
  anadida: boolean
  precio: Importe | null
  conPrecio: boolean
  guardar: (precio: Importe | null) => void
  quitar: () => void
}

/**
 * «Útil para el viaje» (Tanda 6s, 6z3 y 6z6b): SOLO una fila de tarjetas que se desliza de lado (seguro de viaje, eSIM del país, tarjeta sin comisiones y, si hay, el vehículo de alquiler; en la versión gratis, al final,
 * «Buscar vuelos»), con `scroll-snap` y tan anchas que a 375 px se ve una entera y media. Cada una: su icono, la etiqueta «5 % dto.» si la tiene, el nombre, para qué sirve y dos botones. [Comprar] abre la tienda
 * con nuestro enlace y nada más (**comprar no marca nada como añadido**). [Añadir] es para quien ya lo tiene: abre la hoja de precio opcional (`HojaPrecio`), que suma al presupuesto. Ya añadida, la tarjeta dice
 * «✓ Lo tienes» (con su precio) en vez de los botones; al tocarla se cambia o se elimina. Igual en la gratis y en la de pago. Nunca el nombre de un proveedor en los textos.
 */
export function UtilParaElViaje({ route, pago }: { route: Route; pago: boolean }) {
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
  const [hojaPrecio, setHojaPrecio] = useState<string | null>(null)
  const countryCode = buildDestinationSegments(route.days)[0]?.countryCode ?? null
  const isCamper = route.transportContext.vehicle_type === 'camper'
  const hasRentalVehicle = route.transportContext.vehicle_ownership === 'rental'
  const alquiler = isCamper ? buildCamperRentalLink(route.days[0]?.countryCode ?? null) : buildCarRentalLink()
  const nombreAlquiler = isCamper ? 'Camper de alquiler' : 'Vehículo de alquiler'

  const tarjetas: Tarjeta[] = [
    {
      id: 'seguro',
      nombre: 'Seguro de viaje',
      sirve: 'Te cubre si te pones malo o se cancela el viaje.',
      etiqueta: '5 % dto.',
      icono: ICONOS.shield,
      color: 'rgb(var(--accent))',
      enlace: ENLACE_SEGURO,
      articulo: 'lo',
      anadida: Boolean(insurance),
      precio: precioGuardado(insurance),
      conPrecio: true,
      guardar: (precio) => setInsuranceBooking({ provider: 'Seguro de viaje', startDate: dateRange?.start ?? '', endDate: dateRange?.end ?? '', precio }),
      quitar: () => setInsuranceBooking(null),
    },
    ...(countryCode
      ? [
          {
            id: 'esim',
            nombre: `eSIM ${countryDisplayName(countryCode)}`,
            sirve: 'Internet en el móvil nada más llegar.',
            etiqueta: '5 % dto.',
            icono: ICONOS.sim,
            color: 'oklch(0.55 0.1 220)',
            enlace: ENLACE_ESIM,
            articulo: 'la' as const,
            anadida: Boolean(esim[countryCode]),
            precio: leerImporte(esimPrecios[countryCode]),
            conPrecio: true,
            guardar: (precio: Importe | null) => {
              setEsimSelection(countryCode, 'booked')
              setEsimPrecio(countryCode, precio)
            },
            quitar: () => {
              setEsimSelection(countryCode, null)
              setEsimPrecio(countryCode, null)
            },
          },
        ]
      : []),
    {
      id: 'tarjeta',
      nombre: 'Tarjeta sin comisiones',
      sirve: 'Paga y saca dinero fuera sin comisiones.',
      icono: ICONOS.card,
      color: 'oklch(0.42 0.03 250)',
      enlace: ENLACE_TARJETA,
      articulo: 'la',
      anadida: n26,
      precio: null,
      conPrecio: false,
      guardar: () => setN26Added(true),
      quitar: () => setN26Added(false),
    },
    ...(hasRentalVehicle
      ? [
          {
            id: 'alquiler',
            nombre: nombreAlquiler,
            sirve: isCamper ? 'Tu camper esperándote al llegar.' : 'Tu coche esperándote al llegar.',
            icono: ICONOS.coche,
            color: 'oklch(0.5 0.08 160)',
            enlace: alquiler.url,
            articulo: 'lo' as const,
            anadida: Boolean(rental),
            precio: precioGuardado(rental),
            conPrecio: true,
            guardar: (precio: Importe | null) => setRentalVehicleBooking({ provider: nombreAlquiler, startDate: rental?.startDate ?? '', endDate: rental?.endDate ?? '', precio }),
            quitar: () => setRentalVehicleBooking(null),
          },
        ]
      : []),
    ...(!pago
      ? [
          {
            id: 'vuelos',
            nombre: 'Buscar vuelos',
            sirve: 'Compara precios y fechas de vuelos.',
            icono: ICONOS.avion,
            color: 'rgb(var(--accent))',
            enlace: 'https://www.skyscanner.net',
            soloBuscar: true,
            articulo: 'lo' as const,
            anadida: false,
            precio: null,
            conPrecio: false,
            guardar: () => undefined,
            quitar: () => undefined,
          },
        ]
      : []),
  ]
  const abierta = tarjetas.find((tarjeta) => tarjeta.id === hojaPrecio && !tarjeta.soloBuscar) ?? null
  /** [Añadir] o tocar la tarjeta ya añadida: con precio, la hoja; sin precio (la tarjeta sin comisiones), se marca o se quita directamente. */
  const gestionar = (tarjeta: Tarjeta) => (tarjeta.conPrecio ? setHojaPrecio(tarjeta.id) : tarjeta.anadida ? tarjeta.quitar() : tarjeta.guardar(null))

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
              <span className="flex h-9 w-9 items-center justify-center rounded-[11px] text-white" style={{ background: tarjeta.color }}>
                <Icono nombre={tarjeta.icono} size={18} />
              </span>
              {tarjeta.etiqueta && <span className="h-[20px] rounded-full bg-[#F5EFE4] px-2 font-mono text-[10.5px] font-semibold leading-[20px] text-text/70">{tarjeta.etiqueta}</span>}
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <span style={{ font: "400 19px/1.1 'Instrument Serif',serif" }}>{tarjeta.nombre}</span>
              <span className="text-[12.5px] leading-[1.35] text-text/65">{tarjeta.sirve}</span>
            </span>
            {tarjeta.anadida ? (
              <button
                type="button"
                onClick={() => gestionar(tarjeta)}
                data-util-lo-tienes="1"
                className="mt-auto flex h-10 w-full items-center gap-2 rounded-full px-3 text-left text-[13.5px] font-semibold"
                style={{ background: 'oklch(0.96 0.035 150)', color: 'oklch(0.38 0.1 150)', border: `1px solid ${'oklch(0.55 0.11 150 / .35)'}` }}
              >
                <span className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full text-[10px] font-bold leading-none text-white" style={{ background: GR }} aria-hidden="true">
                  ✓
                </span>
                <span className="min-w-0 flex-1 truncate">
                  Lo tienes{tarjeta.precio ? <span className="font-medium"> · {formatoImporte(tarjeta.precio)}</span> : null}
                </span>
                <span className="flex-none text-[12px] font-medium underline underline-offset-2">{tarjeta.conPrecio ? 'Cambiar' : 'Quitar'}</span>
              </button>
            ) : tarjeta.soloBuscar ? (
              <a href={tarjeta.enlace} target="_blank" rel="noopener noreferrer" className="mt-auto flex h-10 w-full items-center justify-center rounded-full bg-[#1C2230] text-[13.5px] font-semibold text-[#FFFDF8] no-underline">
                Buscar
              </a>
            ) : (
              <span className="mt-auto flex gap-2">
                <a href={tarjeta.enlace} target="_blank" rel="noopener noreferrer" className="flex h-10 flex-1 items-center justify-center rounded-full bg-[#1C2230] text-[13.5px] font-semibold text-[#FFFDF8] no-underline">
                  Comprar
                </a>
                <button type="button" onClick={() => gestionar(tarjeta)} className="flex h-10 flex-1 items-center justify-center rounded-full border border-text/20 bg-white text-[13.5px] font-semibold text-text">
                  Añadir
                </button>
              </span>
            )}
          </div>
        ))}
      </div>
      {abierta && (
        <HojaPrecio
          titulo={abierta.nombre}
          eyebrow={abierta.anadida ? 'Precio' : 'Añádelo a tu viaje'}
          cta={abierta.anadida ? 'Guardar' : 'Añadir'}
          inicial={abierta.precio}
          onGuardar={abierta.guardar}
          onQuitar={abierta.anadida ? abierta.quitar : undefined}
          onClose={() => setHojaPrecio(null)}
        />
      )}
    </div>
  )
}
