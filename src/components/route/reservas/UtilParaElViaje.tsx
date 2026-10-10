import type { Route } from '../../../lib/types'
import { buildDestinationSegments } from '../../../lib/destinationSegments'
import { countryDisplayName } from '../../../lib/readiness'
import { buildCamperRentalLink, buildCarRentalLink } from '../../../lib/vehicleRentalLinks'
import { useRouteStore } from '../../../store/useRouteStore'
import { ENLACE_ESIM, ENLACE_SEGURO, ENLACE_TARJETA } from '../../../lib/enlacesUtil'
import { CambiarBoton, ICONOS, Icono } from './BloqueReservas'
import { HojaPrecio } from './HojaPrecio'
import { formatoImporte, leerImporte, precioGuardado, type Importe } from '../../../lib/dinero'
import { useState } from 'react'

interface Tarjeta {
  id: string
  nombre: string
  etiqueta?: string
  icono: string
  color: string
  enlace: string
  hecho: boolean
}

/** Algo de «Útil para el viaje» que el viajero ya tiene: «Añádelo» lo marca (con su precio, opcional) y «Quitar» lo desmarca. La tarjeta sin comisiones no lleva precio. */
interface Compra {
  id: string
  nombre: string
  articulo: 'lo' | 'la'
  anadida: boolean
  precio: Importe | null
  conPrecio: boolean
  guardar: (precio: Importe | null) => void
  quitar: () => void
}

/**
 * «Útil para el viaje» (Tanda 6s y 6z3): una fila de tarjetas pequeñas que se desliza de lado (seguro de viaje, eSIM del país, tarjeta sin comisiones y, si hay, el vehículo de alquiler; en la versión gratis, al final,
 * «Buscar vuelos»). **Pulsar una tarjeta abre la tienda y nada más: pulsar no es comprar.** Debajo, cada una lleva su «¿Ya lo tienes? Añádelo», que abre la hoja con su precio; solo entonces queda como añadida (verde,
 * con su precio y «Cambiar»). Nunca el nombre de un proveedor.
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
    { id: 'seguro', nombre: 'Seguro de viaje', etiqueta: '5 % dto.', icono: ICONOS.shield, color: 'oklch(0.58 0.17 25)', enlace: ENLACE_SEGURO, hecho: Boolean(insurance) },
    ...(countryCode ? [{ id: 'esim', nombre: `eSIM ${countryDisplayName(countryCode)}`, etiqueta: '5 % dto.', icono: ICONOS.sim, color: 'oklch(0.55 0.1 220)', enlace: ENLACE_ESIM, hecho: Boolean(esim[countryCode]) }] : []),
    { id: 'tarjeta', nombre: 'Tarjeta sin comisiones', icono: ICONOS.card, color: 'oklch(0.42 0.03 250)', enlace: ENLACE_TARJETA, hecho: n26 },
    ...(hasRentalVehicle ? [{ id: 'alquiler', nombre: nombreAlquiler, icono: ICONOS.coche, color: 'oklch(0.5 0.08 160)', enlace: alquiler.url, hecho: Boolean(rental) }] : []),
    ...(!pago ? [{ id: 'vuelos', nombre: 'Buscar vuelos', icono: ICONOS.avion, color: 'oklch(0.62 0.14 60)', enlace: 'https://www.skyscanner.net', hecho: false }] : []),
  ]

  const compras: Compra[] = [
    {
      id: 'seguro',
      nombre: 'Seguro de viaje',
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
    { id: 'tarjeta', nombre: 'Tarjeta sin comisiones', articulo: 'la', anadida: n26, precio: null, conPrecio: false, guardar: () => setN26Added(true), quitar: () => setN26Added(false) },
    ...(hasRentalVehicle
      ? [
          {
            id: 'alquiler',
            nombre: nombreAlquiler,
            articulo: 'lo' as const,
            anadida: Boolean(rental),
            precio: precioGuardado(rental),
            conPrecio: true,
            guardar: (precio: Importe | null) => setRentalVehicleBooking({ provider: nombreAlquiler, startDate: rental?.startDate ?? '', endDate: rental?.endDate ?? '', precio }),
            quitar: () => setRentalVehicleBooking(null),
          },
        ]
      : []),
  ]
  const compraAbierta = compras.find((compra) => compra.id === hojaPrecio) ?? null

  return (
    <div className="flex min-w-0 flex-col gap-2.5 pt-4" data-blk="util">
      <span className="text-text/50" style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }}>
        Útil para el viaje
      </span>
      <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tarjetas.map((tarjeta) => (
          <a
            key={tarjeta.id}
            href={tarjeta.enlace}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[88px] w-[136px] flex-none flex-col justify-between rounded-2xl border border-text/[.08] bg-white px-[11px] py-2.5 text-left text-text no-underline"
          >
            <span className="flex items-center justify-between gap-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-[9px] text-white" style={{ background: tarjeta.color }}>
                <Icono d={tarjeta.icono} size={15} />
              </span>
              {tarjeta.hecho ? (
                <span className="h-[19px] rounded-full bg-[#E4F1E8] px-[7px] font-mono text-[10px] font-semibold leading-[19px] text-[oklch(0.4_0.1_150)]">✓</span>
              ) : (
                tarjeta.etiqueta && <span className="h-[19px] rounded-full bg-[#F5EFE4] px-[7px] font-mono text-[10px] font-semibold leading-[19px] text-text/70">{tarjeta.etiqueta}</span>
              )}
            </span>
            <span className="text-[12.5px] font-medium leading-[1.2]">{tarjeta.nombre}</span>
          </a>
        ))}
      </div>
      <div className="flex flex-col gap-1 pt-1">
        {compras.map((compra) => (
          <div key={compra.id} className="flex min-h-[40px] items-center gap-2 rounded-[12px] py-1 pl-3 pr-1.5" style={{ background: compra.anadida ? 'oklch(0.96 0.035 150)' : '#F7F1E6' }}>
            <span className="min-w-0 flex-1 truncate text-[13px] text-text">
              {compra.anadida ? '✓ ' : ''}
              {compra.nombre}
              {compra.anadida && compra.precio ? <span className="text-text/60"> · {formatoImporte(compra.precio)}</span> : null}
              {!compra.anadida ? <span className="text-text/55"> · ¿Ya {compra.articulo === 'lo' ? 'lo' : 'la'} tienes?</span> : null}
            </span>
            <CambiarBoton
              onClick={() => (compra.conPrecio ? setHojaPrecio(compra.id) : compra.anadida ? compra.quitar() : compra.guardar(null))}
              texto={compra.anadida ? (compra.conPrecio ? 'Cambiar' : 'Quitar') : compra.articulo === 'lo' ? 'Añádelo' : 'Añádela'}
            />
          </div>
        ))}
      </div>
      {compraAbierta && (
        <HojaPrecio
          titulo={compraAbierta.nombre}
          eyebrow={compraAbierta.anadida ? 'Precio' : 'Añádelo a tu viaje'}
          cta={compraAbierta.anadida ? 'Guardar' : 'Añadir'}
          inicial={compraAbierta.precio}
          onGuardar={compraAbierta.guardar}
          onQuitar={compraAbierta.anadida ? compraAbierta.quitar : undefined}
          onClose={() => setHojaPrecio(null)}
        />
      )}
    </div>
  )
}
