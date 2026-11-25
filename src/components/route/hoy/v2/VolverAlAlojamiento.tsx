import type { Coordinates, Route } from '../../../../lib/types'
import { direccionDelAlojamiento, enlaceComoLlegarAlojamiento, puntoDelAlojamiento } from '../../../../lib/direccionAlojamiento'
import { hasRealCoordinates } from '../../../../lib/distanceMock'
import { viajeMin } from '../../../../lib/hoyCambiarPlan'
import { pagoActivo } from '../../../../lib/pago'
import { useAlojamientoUi } from '../../../../store/useAlojamientoUi'
import { Icono } from '../../../ui/Icono'
import { useAlojamientoDelViaje } from '../../alojamiento/useAlojamientoDelViaje'
import { useRouteStore } from '../../../../store/useRouteStore'
import { alojamientoCubierto } from '../../../../lib/tuAlojamiento'
import { BOTON_ORO } from '../../../ui/botonesOro'
import { BOTON_AZUL, RecuadroDePuntos } from '../piezas'

/**
 * LA FILA «VOLVER AL ALOJAMIENTO» (V2, H4 y H4b). Sustituye al botón de la cama de arriba de HOY (fuera):
 *  · con dirección: el nombre, «25 min en coche» (o a pie) y [Cómo llegar];
 *  · sin dirección: «Pon tu alojamiento para volver con un toque» y [Añadir], que abre la hoja «Tu alojamiento».
 * Solo con el pase (sin él no hay dirección y llevaría a un candado).
 */
export function VolverAlAlojamiento({ route, desde, casa, enCoche }: { route: Route; /** Dónde está el viajero (o la última parada). */ desde: Coordinates | null; /** El centro de la zona del alojamiento (para los minutos). */ casa: Coordinates | null; enCoche: boolean }) {
  const viaje = useAlojamientoDelViaje()
  const abrirTuAlojamiento = useAlojamientoUi((s) => s.abrirTuAlojamiento)
  const selections = useRouteStore((s) => s.accommodationSelections)
  if (!pagoActivo()) return null
  // (V58 §1) La misma respuesta que RESERVAS y DÍAS: con el hotel puesto (aunque sin dirección) HOY no lo pide; solo falta la dirección para [Cómo llegar].
  const tieneAloj = alojamientoCubierto({ selections, segmentDayId: viaje.primeraEstanciaId })
  const direccion = direccionDelAlojamiento(route)
  const enlace = enlaceComoLlegarAlojamiento(direccion, route.destination, puntoDelAlojamiento(route))
  const minutos = (direccion || tieneAloj) && desde && casa && hasRealCoordinates(desde) && hasRealCoordinates(casa) ? viajeMin({ coordinates: desde }, { coordinates: casa }, enCoche) : null
  const caja = { background: '#FFFDF8', border: '1px solid rgba(181,138,46,.35)' }
  const cama = (
    <span aria-hidden="true" className="flex h-11 w-11 flex-none items-center justify-center rounded-[14px]" style={{ background: '#F1EADC', color: '#6E5018' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18V8M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-8v5" />
      </svg>
    </span>
  )
  if (tieneAloj || (direccion && enlace)) {
    return (
      <div data-alojamiento-hoy="fila" className="flex flex-none items-center gap-3 rounded-[22px] p-3.5" style={caja}>
        {cama}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#6F4E37' }}>VOLVER AL ALOJAMIENTO</span>
          <span className="truncate text-[16px] font-bold">{viaje.nombre ?? direccion}</span>
          {minutos != null && <span className="text-[12.5px]" style={{ color: 'rgba(28,34,48,.55)' }}>{minutos} min {enCoche ? 'en coche' : 'a pie'}</span>}
        </span>
        {enlace && <a href={enlace} target="_blank" rel="noopener noreferrer" aria-label="Cómo llegar a tu alojamiento" data-alojamiento-hoy-como-llegar className="flex h-11 flex-none items-center gap-1.5 rounded-2xl px-3.5 text-[13px] font-bold no-underline" style={BOTON_ORO}>
          <Icono nombre="localizar" size={15} grosor={1.9} />
          Cómo llegar
        </a>}
      </div>
    )
  }
  return (
    <RecuadroDePuntos data-alojamiento-hoy="sin-direccion" className="items-center gap-3">
      {cama}
      <span className="min-w-0 flex-1 text-[13.5px] font-medium leading-[1.3]">Pon tu alojamiento para volver con un toque</span>
      <button type="button" onClick={() => viaje.primeraEstanciaId && abrirTuAlojamiento(viaje.primeraEstanciaId)} data-alojamiento-hoy-anadir className="flex h-11 flex-none items-center gap-1.5 rounded-2xl px-3.5 text-[13px] font-bold" style={BOTON_AZUL}>
        <Icono nombre="anadir" size={13} grosor={2.4} />
        Añadir
      </button>
    </RecuadroDePuntos>
  )
}
