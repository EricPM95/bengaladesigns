import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Momento } from '../../../lib/logros'
import { cortarSonidos, prepararSonido, sonar, vibrar } from '../../../lib/sonidos'
import { useLogrosStore } from '../../../store/useLogrosStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { marcarAnimacionVista, pedirEstado, type EstadoLogros } from './api'
import { PantallaDeMomento } from './pantallas'
import { clavesDe, destinoDelVuelo, ordenarComoElServidor, planificar, sonidoDePantalla } from './plan'
import { volar, type DestinoVuelo } from './vuelo'
import { useMomentosUI } from './useMomentosUI'

/**
 * EL REPRODUCTOR DE SORPRESAS (Tanda 8B). Enseña lo ganado una pantalla tras otra (el orden está en `plan.ts`):
 *   - tocar la pantalla (o [Seguir]) pasa a la siguiente, y el dibujo vuela a donde se guarda (lo del destino, al botón flotante; lo de viajero, al Perfil);
 *   - [Saltar todo] va directo al final;
 *   - (V3) al acabar la última, se cierra la ronda. El resumen del día YA NO sale tras cada ronda: sale una vez al final del día (ver `resumenDelDia.ts`).
 *   - la EXP ganada va como una línea pequeña («+40 EXP») dentro de la primera pantalla.
 * Lo que se ha visto entero se marca como visto en el servidor (el botón late y no hay puntito); lo que se salta deja el puntito.
 */
/** El sonido de una pantalla: el de siempre por tipo, y para un sello que sube de grado, la medalla de ese grado (bronce < plata < oro < diamante). */
function sonidoDeLaPantalla(p: { tipo: Parameters<typeof sonidoDePantalla>[0]; momentos: Momento[] }): string {
  if (p.tipo === 'sello') {
    const g = String(p.momentos[0]?.grado ?? '')
    if (['bronce', 'plata', 'oro', 'diamante'].includes(g)) return `medalla_${g}`
  }
  return sonidoDePantalla(p.tipo)
}

export default function Reproductor({ momentos, exp: _exp = null, onTerminar }: { momentos: Momento[]; exp?: { ganada: number } | null; onTerminar: () => void }): ReactNode {
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
    const so = sonidoDeLaPantalla(p)
    void sonar(so)
    vibrar(so)
    // (V29) Los archivos de la pantalla siguiente, listos antes de que llegue.
    const sig = pantallas[i + 1]
    if (sig) prepararSonido(sonidoDeLaPantalla(sig))
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
    // (V29) Saltar la animación: el sonido se corta con un fundido corto (la siguiente trae el suyo).
    cortarSonidos()
    vistas.current.push(...clavesDe(p))
    let vuela = false
    // Cada cosa vuela a su sitio: lo del destino al botón de logros, lo de viajero al Perfil (el diseño puede marcar el suyo con data-vuelo).
    for (const el of Array.from(contenedor.current?.querySelectorAll<HTMLElement>('[data-vuelo]') ?? [])) {
      const marca = el.getAttribute('data-vuelo')
      const destino: DestinoVuelo = marca === 'perfil' || marca === 'logros' ? marca : destinoDelVuelo(p.tipo)
      if (volar(el, destino) > 0) vuela = true
    }
    // (V35B) Lo ganado que vuela al botón o al Perfil suena (un solo «vuuush», aunque vuelen varias cosas a la vez), salvo dentro del visor de /admin/sonidos, que ya lo hace sonar él.
    if (vuela && !(window as unknown as { __estudioVisor?: unknown }).__estudioVisor) void sonar('vuelo')
    if (i + 1 >= pantallas.length) cerrar()
    else setI(i + 1)
  }, [i, pantallas, cerrar])

  const saltarTodo = useCallback(() => {
    saltadas.current = true
    cortarSonidos()
    // (V6) [Saltar todo] cierra la fila entera (también la EXP del final) y lleva a la hoja de logros.
    useMomentosUI.getState().saltarTodoYAbrirLogros()
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
    </div>
  )
}
