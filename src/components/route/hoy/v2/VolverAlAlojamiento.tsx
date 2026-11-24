import type { Coordinates, Route } from '../../../../lib/types'
import { direccionDelAlojamiento, enlaceComoLlegarAlojamiento, puntoDelAlojamiento } from '../../../../lib/direccionAlojamiento'
import { hasRealCoordinates } from '../../../../lib/distanceMock'
import { viajeMin } from '../../../../lib/hoyCambiarPlan'
import { pagoActivo } from '../../../../lib/pago'
import { useAlojamientoUi } from '../../../../store/useAlojamientoUi'
import { Icono } from '../../../ui/Icono'
import { useAlojamientoDelViaje } from '../../alojamiento/useAlojamientoDelViaje'
import { BOTON_ORO } from '../../../ui/botonesOro'

/**
 * LA FILA «VOLVER AL ALOJAMIENTO» (V2, H4 y H4b). Sustituye al botón de la cama de arriba de HOY (fuera):
 *  · con dirección: el nombre, «25 min en coche» (o a pie) y [Cómo llegar];
 *  · sin dirección: «Pon tu alojamiento para volver con un toque» y [Añadir], que abre la hoja «Tu alojamiento».
 * Solo con el pase (sin él no hay dirección y llevaría a un candado).
 */
export function VolverAlAlojamiento({ route, desde, casa, enCoche }: { route: Route; /** Dónde está el viajero (o la última parada). */ desde: Coordinates | null; /** El centro de la zona del alojamiento (para los minutos). */ casa: Coordinates | null; enCoche: boolean }) {
  const viaje = useAlojamientoDelViaje()
  const abrirTuAlojamiento = useAlojamientoUi((s) => s.abrirTuAlojamiento)
  if (!pagoActivo()) return null
  const direccion = direccionDelAlojamiento(route)
  const enlace = enlaceComoLlegarAlojamiento(direccion, route.destination, puntoDelAlojamiento(route))
  const minutos = direccion && desde && casa && hasRealCoordinates(desde) && hasRealCoordinates(casa) ? viajeMin({ coordinates: desde }, { coordinates: casa }, enCoche) : null
  const caja = { background: '#FFFDF8', border: '1px solid rgba(181,138,46,.4)' }
  const cama = (
    <span aria-hidden="true" className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[13px]" style={{ background: '#F6F0E2', color: '#6E5018' }}>
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18V8M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-8v5" />
      </svg>
    </span>
  )
  if (direccion && enlace) {
    return (
      <div data-alojamiento-hoy="fila" className="flex flex-none items-center gap-3 rounded-[20px] p-3" style={caja}>
        {cama}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#6F4E37' }}>VOLVER AL ALOJAMIENTO</span>
          <span className="truncate text-[14.5px] font-semibold">{viaje.nombre ?? direccion}</span>
          {minutos != null && <span className="text-[12.5px] text-[#1C2230]/60">{minutos} min {enCoche ? 'en coche' : 'a pie'}</span>}
        </span>
        <a href={enlace} target="_blank" rel="noopener noreferrer" aria-label="Cómo llegar a tu alojamiento" data-alojamiento-hoy-como-llegar className="flex h-11 flex-none items-center gap-1.5 rounded-full px-4 text-[13px] font-bold no-underline" style={BOTON_ORO}>
          <Icono nombre="localizar" size={15} grosor={1.9} />
          Cómo llegar
        </a>
      </div>
    )
  }
  return (
    <div data-alojamiento-hoy="sin-direccion" className="flex flex-none items-center gap-3 rounded-[20px] p-3" style={{ ...caja, border: '1px dashed rgba(181,138,46,.6)' }}>
      {cama}
      <span className="min-w-0 flex-1 text-[13.5px] font-medium leading-[1.3]">Pon tu alojamiento para volver con un toque</span>
      <button type="button" onClick={() => viaje.primeraEstanciaId && abrirTuAlojamiento(viaje.primeraEstanciaId)} data-alojamiento-hoy-anadir className="flex h-11 flex-none items-center gap-1.5 rounded-full px-4 text-[13px] font-bold" style={{ background: '#1C2230', color: '#FBF3E2' }}>
        <Icono nombre="anadir" size={13} grosor={2.4} />
        Añadir
      </button>
    </div>
  )
}
