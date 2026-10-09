import type { Route } from '../../../lib/types'
import { buildDestinationSegments } from '../../../lib/destinationSegments'
import { countryDisplayName } from '../../../lib/readiness'
import { buildCamperRentalLink, buildCarRentalLink } from '../../../lib/vehicleRentalLinks'
import { useRouteStore } from '../../../store/useRouteStore'
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
  alPulsar: () => void
}

/**
 * «Útil para el viaje» (Tanda 6s): una fila de tarjetas pequeñas que se desliza de lado (seguro de viaje, eSIM del país, tarjeta sin comisiones y, si hay, el vehículo de alquiler; en la
 * versión gratis, al final, «Buscar vuelos»). Los enlaces son los de siempre. Pulsar una la abre y la marca como añadida, como hacían las filas de antes (así el % de viaje listo sigue
 * contando). Nunca el nombre de un proveedor.
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

  const tarjetas: Tarjeta[] = [
    {
      id: 'seguro',
      nombre: 'Seguro de viaje',
      etiqueta: '5 % dto.',
      icono: ICONOS.shield,
      color: 'oklch(0.58 0.17 25)',
      enlace: 'https://www.iatiseguros.com',
      hecho: Boolean(insurance),
      alPulsar: () => setInsuranceBooking({ provider: 'Seguro de viaje (5% dto.)', startDate: dateRange?.start ?? '', endDate: dateRange?.end ?? '', precio: null }),
    },
    ...(countryCode
      ? [
          {
            id: 'esim',
            nombre: `eSIM ${countryDisplayName(countryCode)}`,
            etiqueta: '5 % dto.',
            icono: ICONOS.sim,
            color: 'oklch(0.55 0.1 220)',
            enlace: 'https://esim.holafly.com',
            hecho: Boolean(esim[countryCode]),
            alPulsar: () => setEsimSelection(countryCode, 'booked'),
          },
        ]
      : []),
    { id: 'tarjeta', nombre: 'Tarjeta sin comisiones', icono: ICONOS.card, color: 'oklch(0.42 0.03 250)', enlace: 'https://n26.com', hecho: n26, alPulsar: () => setN26Added(true) },
    ...(hasRentalVehicle
      ? [
          {
            id: 'alquiler',
            nombre: isCamper ? 'Camper de alquiler' : 'Vehículo de alquiler',
            icono: ICONOS.coche,
            color: 'oklch(0.5 0.08 160)',
            enlace: alquiler.url,
            hecho: Boolean(rental),
            alPulsar: () => setRentalVehicleBooking({ provider: 'Vehículo de alquiler', startDate: '', endDate: '', precio: null }),
          },
        ]
      : []),
    ...(!pago ? [{ id: 'vuelos', nombre: 'Buscar vuelos', icono: ICONOS.avion, color: 'oklch(0.62 0.14 60)', enlace: 'https://www.skyscanner.net', hecho: false, alPulsar: () => undefined }] : []),
  ]

  // (Tanda 6z2) Lo que ya está añadido puede llevar su precio: el seguro, la eSIM y el coche. Pulsar la tarjeta lo marca como añadido sin preguntar (como siempre); el precio se pone después, aquí debajo.
  const compras: { id: string; nombre: string; precio: Importe | null; guardar: (precio: Importe | null) => void }[] = [
    ...(insurance ? [{ id: 'seguro', nombre: 'Seguro de viaje', precio: precioGuardado(insurance), guardar: (precio: Importe | null) => setInsuranceBooking({ ...insurance, precio }) }] : []),
    ...(countryCode && esim[countryCode] ? [{ id: 'esim', nombre: `eSIM ${countryDisplayName(countryCode)}`, precio: leerImporte(esimPrecios[countryCode]), guardar: (precio: Importe | null) => setEsimPrecio(countryCode, precio) }] : []),
    ...(rental && hasRentalVehicle ? [{ id: 'alquiler', nombre: isCamper ? 'Camper de alquiler' : 'Vehículo de alquiler', precio: precioGuardado(rental), guardar: (precio: Importe | null) => setRentalVehicleBooking({ ...rental, precio }) }] : []),
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
            onClick={tarjeta.alPulsar}
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
      {compras.length > 0 && (
        <div className="flex flex-col gap-1 pt-1">
          {compras.map((compra) => (
            <div key={compra.id} className="flex min-h-[40px] items-center gap-2 rounded-[12px] bg-[#F7F1E6] py-1 pl-3 pr-1.5">
              <span className="min-w-0 flex-1 truncate text-[13px] text-text">
                {compra.nombre}
                {compra.precio ? <span className="text-text/60"> · {formatoImporte(compra.precio)}</span> : null}
              </span>
              <CambiarBoton onClick={() => setHojaPrecio(compra.id)} texto={compra.precio ? 'Cambiar' : 'Añadir precio'} />
            </div>
          ))}
        </div>
      )}
      {compraAbierta && <HojaPrecio titulo={compraAbierta.nombre} inicial={compraAbierta.precio} onGuardar={compraAbierta.guardar} onClose={() => setHojaPrecio(null)} />}
    </div>
  )
}
