import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import type { ExpDeRespuesta } from '../../../lib/logros'
import { useLogrosStore } from '../../../store/useLogrosStore'
import { pasoTrasLaExp, type Paso } from './pasoTrasLaExp'
import { useMomentosUI } from './useMomentosUI'

/**
 * LA EXP A LA VISTA (Tanda 8C2, «Logros · Momentos» y la pieza «Experiencia», E1 a E4). Lo que decidió Eric:
 *   - Durante las sorpresas y las películas (Emblema Oculto, maravilla, «El final de las 7 maravillas») no sale nada de EXP, y tampoco en el resumen del día.
 *   - Cuando se acaban y vuelve a verse la app, sale UNA sola animación con toda la EXP sumada («+405 EXP»), flotando abajo, con el nivel, el rango y la barra (E1, E2).
 *   - Si con eso se sube de nivel, sale justo después (E3). Si cambia de rango, el cambio de rango con su marco nuevo (E4). Se pasa tocando.
 *   - Si un dibujo vuela al botón flotante, primero el vuelo (y su latido) y luego el «+EXP».
 * Aquí solo está CUÁNDO sale; cómo se ve es de `pantallas/perfil/` (`ExpGanada`, `SubeDeNivel`, `CambioDeRango`), que se baja solo al hacer falta. La EXP la cuenta siempre el servidor
 * (viene en `exp` de la respuesta de cada Visto y foto; `useLogrosStore` la va sumando): el móvil no calcula nada.
 */
const ExpGanada = lazy(() => import('../pantallas/perfil').then((m) => ({ default: m.ExpGanada })))
const SubeDeNivel = lazy(() => import('../pantallas/perfil').then((m) => ({ default: m.SubeDeNivel })))
const CambioDeRango = lazy(() => import('../pantallas/perfil').then((m) => ({ default: m.CambioDeRango })))

/** Lo que tarda el dibujo en volar al botón flotante y que éste dé su latido (vuelo.ts: 800 ms + 420 ms), con un respiro. */
export const ESPERA_TRAS_EL_VUELO_MS = 1400


export function ExpHost(): ReactNode {
  const exp = useLogrosStore((s) => s.exp)
  const hojaAbierta = useLogrosStore((s) => s.hojaAbierta)
  const hayMomentos = useLogrosStore((s) => s.momentos.length > 0)
  const ronda = useMomentosUI((s) => s.ronda)
  const resumenDia = useMomentosUI((s) => s.resumenDia)
  const resumenViaje = useMomentosUI((s) => s.resumenViaje)
  const hojaLogros = useMomentosUI((s) => s.hojaLogros)
  const compartir = useMomentosUI((s) => s.compartir)
  const [info, setInfo] = useState<ExpDeRespuesta | null>(null)
  const [paso, setPaso] = useState<Paso | null>(null)
  const [visible, setVisible] = useState(typeof document === 'undefined' || document.visibilityState === 'visible')
  const finDeRonda = useRef(0)
  const habiaRonda = useRef(false)

  // Cuándo acabó la última ronda de sorpresas (para dejar que el dibujo llegue al botón antes del «+EXP»).
  useEffect(() => {
    if (habiaRonda.current && !ronda) finDeRonda.current = Date.now()
    habiaRonda.current = Boolean(ronda)
  }, [ronda])

  useEffect(() => {
    const alCambiar = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', alCambiar)
    return () => document.removeEventListener('visibilitychange', alCambiar)
  }, [])

  const libre = !ronda && !resumenDia && !resumenViaje && !hojaAbierta && !hayMomentos && !hojaLogros && !compartir && !paso
  useEffect(() => {
    if (!exp || !libre || !visible) return undefined
    const espera = Math.max(0, ESPERA_TRAS_EL_VUELO_MS - (Date.now() - finDeRonda.current))
    const h = window.setTimeout(() => {
      const e = useLogrosStore.getState().tomarExp()
      if (!e) return
      setInfo(e)
      setPaso('exp')
    }, Math.max(espera, 250))
    return () => window.clearTimeout(h)
  }, [exp, libre, visible])

  if (!info || !paso) return null
  const seguir = () => {
    if (paso === 'exp') setPaso(pasoTrasLaExp(info))
    else setPaso(null)
  }
  return (
    <Suspense fallback={null}>
      {paso === 'exp' && <ExpGanada key="exp" ganada={info.ganada} antes={info.antes} despues={info.despues} onFin={seguir} />}
      {paso === 'nivel' && <SubeDeNivel key="nivel" antes={info.antes} despues={info.despues} onFin={seguir} />}
      {paso === 'rango' && <CambioDeRango key="rango" antes={info.antes} despues={info.despues} onFin={seguir} />}
    </Suspense>
  )
}
