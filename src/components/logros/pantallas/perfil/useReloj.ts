import { useEffect, useState } from 'react'

/**
 * Un reloj para las animaciones de la EXP: devuelve los milisegundos que lleva el componente puesto (60 veces por segundo) y se para al llegar a `duracion`.
 * Con `quieto` (reducir movimiento) devuelve `duracion` desde el principio: todo sale ya puesto, sin moverse.
 */
export function useReloj(duracion: number, quieto = false): number {
  const [t, setT] = useState(quieto ? duracion : 0)
  useEffect(() => {
    if (quieto) {
      setT(duracion)
      return
    }
    const t0 = performance.now()
    let id = 0
    const paso = () => {
      const ahora = Math.min(duracion, performance.now() - t0)
      setT(ahora)
      if (ahora < duracion) id = requestAnimationFrame(paso)
    }
    id = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(id)
  }, [duracion, quieto])
  return t
}
