import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Momento } from '../../../lib/logros'
import { sonar, vibrar } from '../../../lib/sonidos'
import { useLogrosStore } from '../../../store/useLogrosStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { marcarAnimacionVista, pedirEstado, type EstadoLogros } from './api'
import { PantallaDeMomento } from './pantallas'
import { clavesDe, destinoDelVuelo, ordenarComoElServidor, planificar, sonidoDePantalla } from './plan'
import { volar, type DestinoVuelo } from './vuelo'

/**
 * EL REPRODUCTOR DE SORPRESAS (Tanda 8B). Enseña lo ganado una pantalla tras otra (el orden está en `plan.ts`):
 *   - tocar la pantalla (o [Seguir]) pasa a la siguiente, y el dibujo vuela a donde se guarda (lo del destino, al botón flotante; lo de viajero, al Perfil);
 *   - [Saltar todo] va directo al final;
 *   - (V3) al acabar la última, se cierra la ronda. El resumen del día YA NO sale tras cada ronda: sale una vez al final del día (ver `resumenDelDia.ts`).
 *   - la EXP ganada va como una línea pequeña («+40 EXP») dentro de la primera pantalla.
 * Lo que se ha visto entero se marca como visto en el servidor (el botón late y no hay puntito); lo que se salta deja el puntito.
 */
export default function Reproductor({ momentos, exp = null, onTerminar }: { momentos: Momento[]; exp?: { ganada: number } | null; onTerminar: () => void }): ReactNode {
  const pantallas = useMemo(() => planificar(ordenarComoElServidor(momentos)), [momentos])
  const tripId = useSyncStore((s) => s.activeTripId)
  const [i, setI] = useState(0)
  const [estado, setEstado] = useState<EstadoLogros | null>(null)
  const vistas = useRef<{ destino: string; logro: string; escalon: string }[]>([])
  const saltadas = useRef(false)
  const contenedor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let vivo = true
    void pedirEstado(tripId ?? null).then((e) => vivo && setEstado(e))
    return () => {
      vivo = false
    }
  }, [tripId])

  // Suena la pantalla que llega (la primera ya sonó al ganarla, en LogrosPorVisto).
  useEffect(() => {
    const p = pantallas[i]
    if (!p || i === 0) return
    const so = sonidoDePantalla(p.tipo)
    void sonar(so)
    vibrar(so)
  }, [i, pantallas])

  const cerrar = useCallback(() => {
    const todo = !saltadas.current
    void marcarAnimacionVista(vistas.current, true)
    useLogrosStore.getState().ponerPuntito(!todo)
    onTerminar()
  }, [onTerminar])

  const avanzar = useCallback(() => {
    const p = pantallas[i]
    if (!p) return
    vistas.current.push(...clavesDe(p))
    // Cada cosa vuela a su sitio: lo del destino al botón de logros, lo de viajero al Perfil (el diseño puede marcar el suyo con data-vuelo).
    for (const el of Array.from(contenedor.current?.querySelectorAll<HTMLElement>('[data-vuelo]') ?? [])) {
      const marca = el.getAttribute('data-vuelo')
      const destino: DestinoVuelo = marca === 'perfil' || marca === 'logros' ? marca : destinoDelVuelo(p.tipo)
      volar(el, destino)
    }
    if (i + 1 >= pantallas.length) cerrar()
    else setI(i + 1)
  }, [i, pantallas, cerrar])

  const saltarTodo = useCallback(() => {
    saltadas.current = true
    cerrar()
  }, [cerrar])

  // Sin pantallas que enseñar (no debería pasar): se cierra sola.
  useEffect(() => {
    if (pantallas.length === 0) cerrar()
  }, [pantallas.length, cerrar])
  const p = pantallas[i]
  if (!p) return null
  return (
    <div ref={contenedor}>
      <PantallaDeMomento key={`${p.id}${i}`} pantalla={p} estado={estado} onSeguir={avanzar} onSaltarTodo={saltarTodo} paso={{ actual: i, total: pantallas.length }} />
      {i === 0 && exp && exp.ganada > 0 && (
        <span data-exp-linea="" style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(env(safe-area-inset-bottom,0px) + 112px)', zIndex: 9001, textAlign: 'center', pointerEvents: 'none', font: "700 13px 'Geist Mono',monospace", letterSpacing: '.12em', color: '#F3D59A', opacity: 0, animation: 'moUp .6s 1.6s ease both' }}>+{exp.ganada.toLocaleString('es-ES')} EXP</span>
      )}
    </div>
  )
}
