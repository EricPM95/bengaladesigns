import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import { logrosActivos } from '../../../lib/logros'
import { CapaOculta } from './Capa'
import { useLogrosPantallas, type Pantalla } from './useLogrosPantallas'

/**
 * EL ANFITRIÓN DE LAS PANTALLAS DE LOS LOGROS (8C2). Pinta la de arriba de la pila (`useLogrosPantallas`); cada pantalla va en su propio archivo y se baja al abrirla, así que al abrir la app no pesan.
 * Con los logros apagados no monta nada.
 */
type Cargador<T extends Pantalla['t']> = () => Promise<{ default: ComponentType<{ pantalla: Extract<Pantalla, { t: T }> }> }>
const cargadores: { [T in Pantalla['t']]: Cargador<T> } = {
  todos: () => import('./TodosMisLogros'),
  ficha: () => import('./FichaDeLogro'),
  mi_coleccion: () => import('./MiColeccion'),
  destino: () => import('./PaginaDeDestino'),
  coleccion: () => import('./ColeccionPorDentro'),
  viaje: () => import('./ViajeGuardado'),
  previos: () => import('./DondeHasEstado'),
  pasaporte: () => import('./PasaporteScreen'),
}
const perezosas = Object.fromEntries(Object.entries(cargadores).map(([t, c]) => [t, lazy(c as () => Promise<{ default: ComponentType<{ pantalla: Pantalla }> }>)])) as unknown as Record<Pantalla['t'], ComponentType<{ pantalla: Pantalla }>>

export function PantallasHost(): ReactNode {
  if (!logrosActivos()) return null
  return <Encendido />
}

function Encendido(): ReactNode {
  const pila = useLogrosPantallas((s) => s.pila)
  return (
    <Suspense fallback={null}>
      {pila.map((p, i) => {
        const Pantalla = perezosas[p.t]
        // Solo la de arriba está a la vista; las de debajo se quedan montadas (guardan su sitio en la lista) pero ocultas.
        return (
          <CapaOculta.Provider key={`${i}-${p.t}`} value={i !== pila.length - 1}>
            <Pantalla pantalla={p} />
          </CapaOculta.Provider>
        )
      })}
    </Suspense>
  )
}
