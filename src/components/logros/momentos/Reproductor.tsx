import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Momento } from '../../../lib/logros'
import { sonar, vibrar } from '../../../lib/sonidos'
import { useLogrosStore } from '../../../store/useLogrosStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { marcarAnimacionVista, pedirEstado, type EstadoLogros } from './api'
import { PantallaDeMomento } from './pantallas'
import { clavesDe, destinoDelVuelo, planificar, sonidoDePantalla } from './plan'
import { ResumenDia } from './ResumenDia'
import { volar, type DestinoVuelo } from './vuelo'

/**
 * EL REPRODUCTOR DE SORPRESAS (Tanda 8B). Enseña lo ganado una pantalla tras otra (el orden está en `plan.ts`):
 *   - tocar la pantalla (o [Seguir]) pasa a la siguiente, y el dibujo vuela a donde se guarda (lo del destino, al botón flotante; lo de viajero, al Perfil);
 *   - [Saltar todo] va directo al final;
 *   - al final SIEMPRE el resumen del día.
 * Lo que se ha visto entero se marca como visto en el servidor (el botón late y no hay puntito); lo que se salta deja el puntito.
 */
export default function Reproductor({ momentos, onTerminar }: { momentos: Momento[]; onTerminar: () => void }): ReactNode {
  const pantallas = useMemo(() => planificar(momentos), [momentos])
  const tripId = useSyncStore((s) => s.activeTripId)
  const [i, setI] = useState(0)
  const [enResumen, setEnResumen] = useState(pantallas.length === 0)
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
    if (i + 1 >= pantallas.length) setEnResumen(true)
    else setI(i + 1)
  }, [i, pantallas])

  const saltarTodo = useCallback(() => {
    saltadas.current = true
    setEnResumen(true)
  }, [])

  if (enResumen) return <ResumenDia ganado={momentos} estado={estado} alCerrar={cerrar} />
  const p = pantallas[i]
  if (!p) return null
  return (
    <div ref={contenedor}>
      <PantallaDeMomento key={`${p.id}${i}`} pantalla={p} estado={estado} onSeguir={avanzar} onSaltarTodo={saltarTodo} paso={{ actual: i, total: pantallas.length }} />
    </div>
  )
}
