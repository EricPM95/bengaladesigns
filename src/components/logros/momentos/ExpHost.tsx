import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { lazyReintentable } from '../../../lib/cargaSegura'
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
 * DE UNO EN UNO (V3): la «+EXP», la subida de nivel y el cambio de rango piden su turno en la fila (`fila.ts`) como cualquier otra pantalla de los momentos; si llegan sorpresas nuevas
 * mientras esperan, las sorpresas van primero, y nunca salen encima de otra cosa. Las tres van pegadas (un solo turno: «+EXP», después el nivel o el rango).
 */
const ExpGanada = lazyReintentable(() => import('../pantallas/perfil').then((m) => ({ default: m.ExpGanada })))
const SubeDeNivel = lazyReintentable(() => import('../pantallas/perfil').then((m) => ({ default: m.SubeDeNivel })))
const CambioDeRango = lazyReintentable(() => import('../pantallas/perfil').then((m) => ({ default: m.CambioDeRango })))
const ExpYNivel = lazyReintentable(() => import('../pantallas/perfil').then((m) => ({ default: m.ExpYNivel })))

/** Lo que tarda el dibujo en volar al botón flotante y que éste dé su latido (vuelo.ts: 800 ms + 420 ms), con un respiro. */
export const ESPERA_TRAS_EL_VUELO_MS = 1400


export function ExpHost(): ReactNode {
  const exp = useLogrosStore((s) => s.exp)
  const hayMomentos = useLogrosStore((s) => s.momentos.length > 0)
  const ronda = useMomentosUI((s) => s.ronda)
  const mostrando = useMomentosUI((s) => s.fila.mostrando)
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

  // Con EXP por enseñar (y la app a la vista, y sin sorpresas por delante), pide su turno; tras el vuelo del dibujo al botón.
  const quiere = Boolean(exp) && visible && !hayMomentos && !ronda
  useEffect(() => {
    if (!quiere || paso) return undefined
    const espera = Math.max(0, ESPERA_TRAS_EL_VUELO_MS - (Date.now() - finDeRonda.current))
    const h = window.setTimeout(() => {
      if (useLogrosStore.getState().momentos.length === 0) useMomentosUI.getState().pedir('exp')
    }, Math.max(espera, 250))
    return () => window.clearTimeout(h)
  }, [quiere, paso])
  // Cuando le toca, coge la EXP y la enseña. Si por el camino llegaron sorpresas (o ya no hay EXP), suelta el turno: las sorpresas van primero.
  useEffect(() => {
    if (mostrando !== 'exp' || paso) return
    const e = useLogrosStore.getState().momentos.length === 0 ? useLogrosStore.getState().tomarExp() : null
    if (!e) {
      useMomentosUI.getState().soltar('exp')
      return
    }
    // (V3) Si la «+EXP» ya se vio como línea dentro de las sorpresas, solo queda el nivel o el rango (si suben).
    // (V6) La EXP de una ronda de sorpresas sale al final, en UNA pantalla con la subida de nivel; la EXP suelta (un Visto sin nada más) sigue con su cartel pequeño.
    const primero: Paso | null = e.final ? 'final' : e.sinCartel ? pasoTrasLaExp(e) : 'exp'
    if (!primero) {
      useMomentosUI.getState().soltar('exp')
      return
    }
    setInfo(e)
    setPaso(primero)
  }, [mostrando, paso])
  // Al acabar el último paso (`+EXP`, nivel o rango), suelta el turno y sale lo que esperaba.
  useEffect(() => {
    if (paso === null && info) useMomentosUI.getState().soltar('exp')
  }, [paso, info])

  if (!info || !paso) return null
  const saltarTodo = () => {
    useMomentosUI.getState().saltarTodoYAbrirLogros()
    setPaso(null)
  }
  const seguir = () => {
    if (paso === 'final') setPaso(info.despues.rango_ix > info.antes.rango_ix ? 'rango' : null)
    else if (paso === 'exp') setPaso(pasoTrasLaExp(info))
    else setPaso(null)
  }
  return (
    <Suspense fallback={null}>
      {paso === 'final' && <ExpYNivel key="final" ganada={info.ganada} antes={info.antes} despues={info.despues} onSeguir={seguir} onSaltarTodo={saltarTodo} />}
      {paso === 'exp' && <ExpGanada key="exp" ganada={info.ganada} antes={info.antes} despues={info.despues} onFin={seguir} />}
      {paso === 'nivel' && <SubeDeNivel key="nivel" antes={info.antes} despues={info.despues} onFin={seguir} />}
      {paso === 'rango' && <CambioDeRango key="rango" antes={info.antes} despues={info.despues} onFin={seguir} />}
    </Suspense>
  )
}
