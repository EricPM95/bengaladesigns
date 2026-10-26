/**
 * [PROPONER EL CAMBIO] / [MOVERLO AL VIERNES 27] (Tanda 10N3 §2, duda 8). Del aviso «Tu entrada del Coliseo es el viernes 27, y en la ruta está el jueves 26»: la entrada que compró quien mira el viaje
 * no cae en el día en que la ruta tiene ese sitio. Lo que se hace es mover esa parada al día de su entrada.
 *   · Quien SOLO RECOMIENDA (antes del viaje): es un cambio más de su propuesta (la ruta de su móvil es su propuesta; el lápiz cuenta el cambio). Nada llega al dueño hasta que pulsa [Enviar].
 *   · Quien PUEDE EDITAR (o el administrador): [Moverlo al viernes 27], directo en la ruta, con [Deshacer].
 * El aviso lanza `trazo:proponer-cambio-reserva` (`proponerCambioDeReserva`, `reservasGrupo.ts`); `PropuestaHost` lo escucha y llama aquí.
 */
import { dayOfReservation, dayOnDate } from './bookings'
import { moverParadaAOtroDia } from './cambiarParada'
import { esDeLaReserva, type CambioDeReservaPropuesto } from './reservasGrupo'
import { miPermisoAhora } from '../hooks/useModoInvitado'
import { useAddFlowStore } from '../store/useAddFlowStore'
import { useMisReservas } from '../store/useMisReservas'
import { usePropuestaStore } from '../store/usePropuestaStore'
import { useRouteStore } from '../store/useRouteStore'

/** El texto del botón del aviso: [Proponer el cambio] para quien solo recomienda; [Moverlo al viernes 27] para quien puede editar. */
export function etiquetaDelCambio(permiso: 'admin' | 'editar' | 'recomendar', diaDeLaReserva: string): string {
  return permiso === 'recomendar' ? 'Proponer el cambio' : `Moverlo al ${diaDeLaReserva}`
}

export interface ResultadoDelCambio {
  ok: boolean
  /** Lo que se le dice a la persona si no se pudo (palabras sencillas). */
  mensaje: string | null
  /** 'propuesta' (va a su propuesta) o 'directo' (la ruta ya cambió). */
  como?: 'propuesta' | 'directo'
}

/** Mueve la parada de esa reserva al día de la reserva. Sin ruta, sin parada o sin día: dice por qué. */
export function aplicarCambioDeReserva(cambio: CambioDeReservaPropuesto): ResultadoDelCambio {
  const route = useRouteStore.getState().route
  if (!route) return { ok: false, mensaje: 'No encontramos el viaje.' }
  const reserva = useMisReservas.getState().lista.find((r) => r.id === cambio.reservaId) ?? null
  const dia = reserva ? dayOfReservation(route, reserva) : cambio.dateIso ? dayOnDate(route, cambio.dateIso) : null
  if (!dia) return { ok: false, mensaje: `El ${cambio.diaDeLaReserva} no está en las fechas del viaje.` }
  let origen: { dayId: string; stopId: string } | null = null
  if (reserva) {
    for (const d of route.days) {
      const parada = d.stops.find((s) => esDeLaReserva(s, reserva) && s.visitMode !== 'fuera')
      if (parada) {
        origen = { dayId: d.id, stopId: parada.id }
        break
      }
    }
  }
  if (!origen) return { ok: false, mensaje: 'Esa parada ya no está en la ruta.' }
  if (origen.dayId === dia.id) return { ok: false, mensaje: 'Esa parada ya está en ese día.' }
  const permiso = miPermisoAhora()
  // Quien solo recomienda y ya está de viaje no propone nada: su propuesta ya no está encendida.
  if (permiso === 'recomendar' && !usePropuestaStore.getState().activa) return { ok: false, mensaje: 'Ya ha empezado el viaje: ahora ya no se proponen cambios.' }
  if (!moverParadaAOtroDia(origen.stopId, origen.dayId, dia.id)) return { ok: false, mensaje: 'No se ha podido mover.' }
  return { ok: true, mensaje: null, como: permiso === 'recomendar' ? 'propuesta' : 'directo' }
}

/** Lo mismo, diciéndolo en un aviso corto de abajo si no se pudo. */
export function aplicarCambioDeReservaConAviso(cambio: CambioDeReservaPropuesto): boolean {
  const r = aplicarCambioDeReserva(cambio)
  if (!r.ok && r.mensaje) useAddFlowStore.setState({ toast: { message: r.mensaje, previous: null, id: Date.now() } })
  return r.ok
}
