import { useEffect, useState } from 'react'
import { alAnadirFoto } from '../../lib/fotosViaje'
import { cajaDelObjetivo, crearCola, lanzarFoto, type UltimoClic } from '../../lib/fotoVuela'

/**
 * «La foto vuela al Perfil» (Tanda 6y4): se monta UNA vez en la app (junto a `PrecioVuela`) y no pinta nada propio salvo el aviso oculto para lectores de pantalla.
 * Escucha `alAnadirFoto` (una vez por foto subida de verdad, desde cualquier sitio; ni al cargar ni al borrar) y lanza el efecto (el cálculo y el dibujo están en `lib/fotoVuela.ts`).
 */
export function FotoVuela() {
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

    const cola = crearCola()
    let avisoTimer: ReturnType<typeof setTimeout> | undefined
    const cancelaciones = new Set<() => void>()
    const dejar = alAnadirFoto(({ miniatura }) => {
      setAviso('Foto añadida a tu Perfil')
      clearTimeout(avisoTimer)
      avisoTimer = setTimeout(() => setAviso(''), 4000)
      const retraso = cola.pedir()
      if (retraso === null) return
      const url = URL.createObjectURL(miniatura)
      let suelta = false
      let cancelar: () => void = () => undefined
      const soltar = () => {
        if (suelta) return
        suelta = true
        URL.revokeObjectURL(url)
        cola.liberar()
        cancelaciones.delete(cancelar)
      }
      cancelar = lanzarFoto(
        url,
        {
          document,
          ancho: window.innerWidth,
          alto: window.innerHeight,
          reducirMovimiento: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
          ultimoClic,
          ahora: Date.now,
          esperar: (fn, ms) => setTimeout(fn, ms),
        },
        soltar,
        retraso,
      )
      if (!suelta) cancelaciones.add(cancelar)
    })
    return () => {
      dejar()
      clearTimeout(avisoTimer)
      cancelaciones.forEach((cancelar) => cancelar())
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
