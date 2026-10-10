import { useState } from 'react'
import type { Route } from '../../../lib/types'
import type { DestinationExcursions } from '../../../lib/destinationExcursions'
import { useRouteStore } from '../../../store/useRouteStore'
import { useAlojamientoUi } from '../../../store/useAlojamientoUi'
import { estanciasDelViaje, nochesTexto, precioDeAlojamiento } from '../../../lib/tuAlojamiento'
import { formatoImporte } from '../../../lib/dinero'
import { BloqueShell, CambiarBoton, EliminarTexto, EstadoBloque, FlechaBloque, ICONOS, INK, IconoBloque, tituloBloqueStyle } from './BloqueReservas'
import { Icono } from '../../ui/Icono'
import { HojaAbajo, ojoStyle } from './HojaAbajo'
import { TimeListWheel } from '../../ui/TimeListWheel'

/** La hoja de la zona (Tanda 6v): las zonas del destino en una rueda, como la de la hora, y [Guardar]. */
function HojaZona({ zonas, actual, onGuardar, onClose }: { zonas: DestinationExcursions['zonasAlojamiento']; actual: string | null; onGuardar: (id: string) => void; onClose: () => void }) {
  const [id, setId] = useState(() => (zonas.some((zona) => zona.id === actual) ? (actual as string) : (zonas[0]?.id ?? '')))
  const elegida = zonas.find((zona) => zona.id === id) ?? zonas[0]
  return (
    <HojaAbajo titleId="hoja-zona" onClose={onClose}>
      <p className="max-w-[calc(100%-2.5rem)] text-text/50" style={ojoStyle}>
        Alojamiento
      </p>
      <h2 id="hoja-zona" className="mt-1 max-w-[calc(100%-3rem)] font-display text-[26px] leading-none text-text">
        ¿En qué zona te alojas?
      </h2>
      <div className="mt-4">
        <TimeListWheel
          tipo="lista"
          label="Zona del alojamiento"
          items={zonas.map((zona) => zona.nombre)}
          value={elegida?.nombre ?? ''}
          onChange={(nombre) => setId(zonas.find((zona) => zona.nombre === nombre)?.id ?? id)}
        />
        <p className="mt-2 min-h-[18px] text-center text-[12px] text-text/55">{elegida?.sub ?? ''}</p>
      </div>
      <button type="button" onClick={() => elegida && onGuardar(elegida.id)} className="mt-3 h-12 w-full rounded-full bg-[#1C2230] text-[15px] font-semibold text-[#FFFDF8] transition-transform active:scale-[.98]">
        Guardar
      </button>
    </HojaAbajo>
  )
}

/**
 * El bloque «Alojamiento» de RESERVAS (Tanda 6s, 6v y 6z). Cerrado, como «Llegada y vuelta» y «Entradas y Free Tour»: el icono, el título y una línea que dice cómo va («Falta», «✓ Hotel Artemide», de pago
 * «✓ Hotel Artemide · Monti» o «✓ Hotel Artemide · Falta la zona») con su flecha.
 *
 * Abierto, sin alojamiento: «¿Ya tienes alojamiento?» con [Añadir mi alojamiento] (la hoja «Tu alojamiento») y «¿Aún no?» con [Buscar alojamiento] (el mapa a pantalla completa). Con alojamiento: su nombre, las
 * noches del viaje, el precio si lo dijo, [Cambiar] y [Eliminar]. De pago, además, «¿En qué zona te alojas?» con su campo y su rueda (siempre a la vista; «Aún no lo sé» sigue contando «Falta»).
 * Poner el alojamiento es gratis en las dos versiones; la zona, solo de pago. El alojamiento solo informa: la zona (de pago) es lo que orienta la ruta. Se guarda con el viaje, uno por destino.
 */
export function AlojamientoReservas({ route, info, pago, abierto, onToggle }: { route: Route; info: DestinationExcursions; pago: boolean; abierto: boolean; onToggle: () => void }) {
  const zona = useRouteStore((state) => state.route?.accommodationZone ?? null)
  const setZona = useRouteStore((state) => state.setAccommodationZone)
  const setHotel = useRouteStore((state) => state.setAccommodationHotel)
  const abrirMapa = useAlojamientoUi((state) => state.abrirMapa)
  const abrirTuAlojamiento = useAlojamientoUi((state) => state.abrirTuAlojamiento)
  const [zonaAbierta, setZonaAbierta] = useState(false)
  const estancia = estanciasDelViaje(route)[0] ?? null
  const segmentDayId = estancia?.segmentDayId ?? route.days[0]?.id ?? ''
  const noches = estancia?.noches ?? 0
  const hotel = useRouteStore((state) => state.accommodationSelections[segmentDayId]) ?? null
  const zonas = info.zonasAlojamiento
  const elegida = zonas.find((candidate) => candidate.id === zona) ?? null
  const zonaHecha = alojamientoHecho(elegida?.id)
  const hecho = pago ? zonaHecha : Boolean(hotel)
  const precio = precioDeAlojamiento(hotel)

  const resumen = pago
    ? hotel
      ? `✓ ${hotel.name} · ${zonaHecha ? elegida?.nombre : 'Falta la zona'}`
      : zonaHecha
        ? `✓ ${elegida?.nombre}`
        : 'Falta'
    : hotel
      ? `✓ ${hotel.name}`
      : 'Falta'
  // Con el hotel puesto pero sin la zona (de pago) la línea sigue en rosa: lo que falta es la zona.
  const resumenVerde = pago ? zonaHecha : Boolean(hotel)

  return (
    <>
      <BloqueShell bloque="aloj">
        <div onClick={onToggle} className="flex cursor-pointer items-center gap-3 p-3.5">
          <IconoBloque nombre={ICONOS.hotel} hecho={hecho} />
          <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <span style={tituloBloqueStyle}>Alojamiento</span>
            <EstadoBloque texto={resumen} hecho={resumenVerde} />
          </span>
          <FlechaBloque abierto={abierto} />
        </div>
        {abierto && (
          <div className="flex flex-col gap-3.5 px-3.5 pb-3.5">
            {hotel ? (
              <div className="flex items-center gap-2.5 rounded-[14px] py-2.5 pl-3 pr-1.5" style={{ background: 'oklch(0.97 0.025 150)' }}>
                <span className="min-w-0 flex-1 text-[13.5px] leading-[1.4]">
                  <span className="block truncate text-[15px] font-medium">{hotel.name}</span>
                  {noches > 0 && <span className="block text-text/65">{nochesTexto(noches)}</span>}
                  {precio !== null && <span className="block text-text/65">{formatoImporte(precio)}</span>}
                </span>
                <CambiarBoton onClick={() => abrirTuAlojamiento(segmentDayId)} />
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <span className="text-[14px] font-medium">¿Ya tienes alojamiento?</span>
                <button
                  type="button"
                  onClick={() => abrirTuAlojamiento(segmentDayId)}
                  className="flex h-12 w-full items-center justify-center rounded-full border border-text/20 bg-white text-[14.5px] font-semibold text-text transition-transform active:scale-[.98]"
                >
                  Añadir mi alojamiento
                </button>
                <span className="mt-1 text-[14px] font-medium">¿Aún no?</span>
                <button
                  type="button"
                  onClick={() => abrirMapa(segmentDayId)}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1C2230] text-[14.5px] font-semibold text-[#FFFDF8] transition-transform active:scale-[.98]"
                >
                  <Icono nombre={ICONOS.lupa} size={15} />
                  Buscar alojamiento
                </button>
              </div>
            )}
            {hotel && <EliminarTexto texto="Eliminar" onClick={() => setHotel(segmentDayId, null)} />}
            {pago && (
              <div className="flex flex-col gap-2.5">
                <span className="text-[14px] font-medium">¿En qué zona te alojas?</span>
                <button
                  type="button"
                  onClick={() => setZonaAbierta(true)}
                  className="flex h-12 w-full items-center justify-between rounded-[14px] border border-text/15 bg-white px-3.5 text-left text-[14.5px]"
                  style={{ color: zonaHecha ? INK : 'rgba(28,34,48,.55)' }}
                >
                  <span className="min-w-0 truncate">{elegida ? elegida.nombre : 'Elige tu zona'}</span>
                  <FlechaBloque abierto={false} />
                </button>
              </div>
            )}
          </div>
        )}
      </BloqueShell>
      {zonaAbierta && (
        <HojaZona
          zonas={zonas}
          actual={zona}
          onGuardar={(id) => {
            setZona(id)
            setZonaAbierta(false)
          }}
          onClose={() => setZonaAbierta(false)}
        />
      )}
    </>
  )
}

/** ¿Está hecha la zona del alojamiento? Con una zona elegida («Aún no lo sé» no cuenta). */
export const alojamientoHecho = (zona: string | null | undefined): boolean => Boolean(zona) && zona !== 'nose'
