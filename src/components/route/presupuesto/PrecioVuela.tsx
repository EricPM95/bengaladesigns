import { useEffect, useState } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { usePresupuestoUi } from '../../../store/usePresupuestoUi'
import { pagoActivo } from '../../../lib/pago'
import { monedaDelViajero } from '../../../lib/useMoneda'
import { cajaDelObjetivo, crearSeguidor, cuandoLaCarteraSeVe, entradaDeEstado, lanzarEfectos, preciosCambiaron, textoParaLector, type UltimoClic } from '../../../lib/precioVuela'

/**
 * «El precio vuela a la cartera» (Tanda 6z6b): se monta UNA vez en la app y no pinta nada propio salvo el aviso oculto para lectores de pantalla.
 * Mira el almacén; cuando el viajero guarda, cambia o quita un precio fuera de la pantalla del presupuesto, lanza el efecto (todo el cálculo y el dibujo están en `lib/precioVuela.ts`).
 * Tanda 6y4: si una hoja o una pantalla completa tapa la cartera en ese momento, el efecto ESPERA a que se cierre y vuela entonces (`cuandoLaCarteraSeVe`).
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
    const estadoInicial = useRouteStore.getState()
    seguidor.procesar(entradaDeEstado(estadoInicial, pagoActivo(), monedaDelViajero(estadoInicial.route)), true)
    let avisoTimer: ReturnType<typeof setTimeout> | undefined
    const dejar = useRouteStore.subscribe((state, previo) => {
      if (!preciosCambiaron(state, previo)) return
      const difs = seguidor.procesar(entradaDeEstado(state, pagoActivo(), monedaDelViajero(state.route)), usePresupuestoUi.getState().abierto)
      if (difs.length === 0) return
      // El clic se recuerda ahora (es «donde lo ha guardado»); el vuelo puede esperar a que se cierre la hoja.
      const clicDeAhora = ultimoClic
      const reducirMovimiento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
      cuandoLaCarteraSeVe(
        () =>
          lanzarEfectos(difs, {
            document,
            ancho: window.innerWidth,
            alto: window.innerHeight,
            reducirMovimiento,
            ultimoClic: clicDeAhora,
            ahora: Date.now,
            esperar: (fn, ms) => setTimeout(fn, ms),
          }),
        { document, ancho: window.innerWidth, alto: window.innerHeight },
      )
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
