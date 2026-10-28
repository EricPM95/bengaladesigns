import type { AvisoDeCuenta } from '../../lib/avisos'
import { useLogrosPantallas } from '../logros/pantallas/useLogrosPantallas'
import { useAvisosStore } from '../../store/useAvisosStore'
import { usePagoStore } from '../../store/usePagoStore'
import { usePresupuestoUi } from '../../store/usePresupuestoUi'
import { useModoCuentasUi } from '../../store/useModoCuentasUi'
import { useR2Store } from '../../store/useR2Store'
import { usePropuestaStore } from '../../store/usePropuestaStore'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import { useViajeCompartido } from '../../store/useViajeCompartido'
import { normaDeParada, useCambiosMarcados } from '../../store/useCambiosMarcados'
import { marcasDelAviso } from '../../../shared/avisos/cambioViaje.js'

/**
 * Lo que pasa al tocar un aviso de la campanita (cuentas parte 3):
 *   · una recomendación sin contestar abre R2 (la hoja de aceptar o no), abriendo antes ese viaje si no era el que estaba abierto;
 *   · el aviso de los 10 días, con dos viajes que se pisan, abre P8b («¿Es este?» / «Cambiar al del…»);
 *   · los demás solo se dan por leídos.
 * Devuelve un aviso en palabras sencillas si no se pudo abrir, o null.
 */
export async function abrirAviso(aviso: AvisoDeCuenta): Promise<string | null> {
  const avisos = useAvisosStore.getState()
  const p = aviso.payload as Record<string, unknown>
  if (aviso.tipo === 'recomendacion' && !aviso.etiqueta) {
    const tripId = String(p.trip_id ?? '')
    const sync = useSyncStore.getState()
    if (sync.activeTripId !== tripId) {
      const viaje = sync.savedTrips?.find((v) => v.id === tripId)
      if (!viaje) return 'No encontramos ese viaje.'
      sync.setActiveTripId(tripId)
      useRouteStore.getState().hydrateTrip(viaje)
    }
    await useViajeCompartido.getState().cargar(tripId)
    const rec = useViajeCompartido.getState().recomendaciones.find((r) => r.id === p.rec_id)
    if (!rec) return 'Esa recomendación ya está contestada.'
    avisos.cerrar()
    useR2Store.getState().abrir(rec)
    void avisos.marcarLeidos([aviso.id])
    return null
  }
  // (Tanda 10N, apartado 6) «Eric ha aceptado 3 de tus 5 cambios»: al tocarlo, su propuesta con cuáles sí y cuáles no.
  if ((aviso.tipo === 'aceptada' || aviso.tipo === 'rechazada') && p.rec_id) {
    const tripId = String(p.trip_id ?? '')
    await useViajeCompartido.getState().cargar(tripId)
    void avisos.marcarLeidos([aviso.id])
    avisos.cerrar()
    usePropuestaStore.getState().abrirHoja({ modo: 'enviada', recId: String(p.rec_id) })
    return null
  }
  // (Tanda 10N) «Tienes 2 cambios sin enviar»: abre la propuesta.
  if (String(aviso.tipo) === 'sin_enviar') {
    void avisos.marcarLeidos([aviso.id])
    avisos.cerrar()
    usePropuestaStore.getState().abrirHoja({ modo: 'mia' })
    return null
  }
  // (Tanda 10P) El aviso dorado del sorteo abre la página del sorteo.
  if (aviso.tipo === 'sorteo') {
    void avisos.marcarLeidos([aviso.id])
    avisos.cerrar()
    useLogrosPantallas.getState().abrir({ t: 'sorteo' })
    return null
  }
  // (Tanda 10N, apartado 9) «Eric ha aceptado tu gasto»: al tocarlo se abre el presupuesto (el gasto ya suma, o se queda solo para ti).
  if (aviso.tipo === 'gasto_resuelto' || aviso.tipo === 'pago_marcado') {
    void avisos.marcarLeidos([aviso.id])
    avisos.cerrar()
    usePresupuestoUi.getState().abrir()
    return null
  }
  // (Tanda 10N §10) «Eric ha cambiado el viaje»: al tocarlo, a la ruta ya cambiada. «Ya no formas parte…» y el cambio de permiso solo se dan por leídos.
  if (aviso.tipo === 'viaje_cambiado') {
    void avisos.marcarLeidos([aviso.id])
    avisos.cerrar()
    const tripId = String(p.trip_id ?? '')
    const sync = useSyncStore.getState()
    if (sync.activeTripId !== tripId) {
      const { abrirViajeGuardado } = await import('../../lib/abrirViaje')
      if (!abrirViajeGuardado(tripId)) return 'No encontramos ese viaje.'
    }
    const { refrescarViajeActivo } = await import('../../lib/viajeEnDirecto')
    await refrescarViajeActivo()
    // (10N5) A los días que han cambiado, con lo nuevo marcado («Movida», «Nueva»): se abre DÍAS en el primero de ellos.
    const { marcas, dias } = marcasDelAviso(p)
    const ruta = useRouteStore.getState().route
    if (ruta && dias.length > 0) {
      const dia = ruta.days.find((d) => !d.isReturnLeg && d.dayNumber === dias[0])
      const marcasFinales: Record<string, 'nueva' | 'movida'> = { ...marcas }
      const ft = ruta.days.flatMap((d) => d.stops).find((s) => s.isFreeTour)
      if (ft && marcas[normaDeParada('Free Tour')]) marcasFinales[normaDeParada(ft.name)] = 'nueva'
      useCambiosMarcados.getState().poner(tripId, marcasFinales, dias)
      useRouteStore.getState().setMode('days')
      if (dia) useRouteStore.getState().setActiveDayId(dia.id)
      return null
    }
    useRouteStore.getState().setMode('route')
    return null
  }
  // (Tanda 10N7) «Ana se ha unido a tu viaje. ¿Cómo lleváis las cuentas?»: abre esa misma hoja. «Eric ha cambiado las cuentas…»: al presupuesto, ya cambiado.
  if (aviso.tipo === 'unido' && p.pregunta_cuentas === true) {
    void avisos.marcarLeidos([aviso.id])
    avisos.cerrar()
    const tripId = String(p.trip_id ?? '')
    if (tripId && useSyncStore.getState().activeTripId !== tripId) {
      const { abrirViajeGuardado } = await import('../../lib/abrirViaje')
      if (!abrirViajeGuardado(tripId)) return 'No encontramos ese viaje.'
    }
    usePresupuestoUi.getState().abrir()
    useModoCuentasUi.getState().abrirEleccion()
    return null
  }
  if (aviso.tipo === 'cuentas_modo') {
    void avisos.marcarLeidos([aviso.id])
    avisos.cerrar()
    usePresupuestoUi.getState().abrir()
    return null
  }
  if (aviso.tipo === 'd10') {
    const otro = p.otro as { id: string; inicio: string; fin: string } | null
    void avisos.marcarLeidos([aviso.id])
    if (otro && p.con_pase) {
      avisos.cerrar()
      const destino = String(p.destino ?? '')
      usePagoStore.getState().abrir({
        tipo: 'dosViajes',
        modo: 'p8b',
        destino,
        actual: { id: String(p.trip_id), destino, inicio: String(p.inicio), fin: String(p.fin) },
        otro: { id: otro.id, destino, inicio: otro.inicio, fin: otro.fin },
      })
    }
    return null
  }
  void avisos.marcarLeidos([aviso.id])
  return null
}
