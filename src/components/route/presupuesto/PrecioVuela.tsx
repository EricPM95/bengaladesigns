import { useEffect, useState } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { usePresupuestoUi } from '../../../store/usePresupuestoUi'
import { pagoActivo } from '../../../lib/pago'
import { monedaDelViajero } from '../../../lib/useMoneda'
import type { EntradaPresupuesto } from '../../../lib/presupuesto'
import { cajaDelObjetivo, crearSeguidor, lanzarEfectos, textoParaLector, type UltimoClic } from '../../../lib/precioVuela'

type EstadoRuta = ReturnType<typeof useRouteStore.getState>

function entradaDeEstado(state: EstadoRuta): EntradaPresupuesto | null {
  if (!state.route) return null
  return {
    route: state.route,
    reservations: state.reservations,
    accommodationSelections: state.accommodationSelections,
    transportBookings: state.transportBookings,
    insuranceBooking: state.insuranceBooking,
    rentalVehicleBooking: state.rentalVehicleBooking,
    esimPrecios: state.esimPrecios,
    moneda: monedaDelViajero(state.route),
    cambio: null,
    pago: pagoActivo(),
  }
}

/**
 * «El precio vuela a la cartera» (Tanda 6z6b): se monta UNA vez en la app y no pinta nada propio salvo el aviso oculto para lectores de pantalla.
 * Mira el almacén; cuando el viajero guarda, cambia o quita un precio fuera de la pantalla del presupuesto, lanza el efecto (todo el cálculo y el dibujo están en `lib/precioVuela.ts`).
 */
export function PrecioVuela() {
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    let ultimoClic: UltimoClic | null = null
    const recordar = (evento: Event) => {
      const caja = cajaDelObjetivo(evento.target)
      if (caja) ultimoClic = { caja, momento: Date.now() }
    }
    const recordarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Enter' || evento.key === ' ') recordar(evento)
    }
    document.addEventListener('pointerdown', recordar, true)
    document.addEventListener('click', recordar, true)
    document.addEventListener('keydown', recordarTecla, true)

    const seguidor = crearSeguidor()
    seguidor.procesar(entradaDeEstado(useRouteStore.getState()), true)
    let avisoTimer: ReturnType<typeof setTimeout> | undefined
    const dejar = useRouteStore.subscribe((state, previo) => {
      if (
        state.route === previo.route &&
        state.reservations === previo.reservations &&
        state.accommodationSelections === previo.accommodationSelections &&
        state.transportBookings === previo.transportBookings &&
        state.insuranceBooking === previo.insuranceBooking &&
        state.rentalVehicleBooking === previo.rentalVehicleBooking &&
        state.esimPrecios === previo.esimPrecios
      )
        return
      const difs = seguidor.procesar(entradaDeEstado(state), usePresupuestoUi.getState().abierto)
      if (difs.length === 0) return
      lanzarEfectos(difs, {
        document,
        ancho: window.innerWidth,
        alto: window.innerHeight,
        reducirMovimiento: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
        ultimoClic,
        ahora: Date.now,
        esperar: (fn, ms) => setTimeout(fn, ms),
      })
      setAviso(textoParaLector(difs))
      clearTimeout(avisoTimer)
      avisoTimer = setTimeout(() => setAviso(''), 4000)
    })
    return () => {
      dejar()
      clearTimeout(avisoTimer)
      document.removeEventListener('pointerdown', recordar, true)
      document.removeEventListener('click', recordar, true)
      document.removeEventListener('keydown', recordarTecla, true)
    }
  }, [])

  return (
    <div aria-live="polite" className="sr-only">
      {aviso}
    </div>
  )
}
