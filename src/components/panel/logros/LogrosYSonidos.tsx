import { lazy, Suspense, useState, type ReactNode } from 'react'
import { Pestanas } from './comun'
import { Logros } from './Logros'
import { QueTieneCadaDestino } from './QueTieneCadaDestino'
import { Herramientas } from './Herramientas'

/**
 * (V35A, Design P7) «LOGROS Y SONIDOS»: cuatro pestañas, como Design: Logros · Qué tiene cada destino · Sonidos · Herramientas.
 *   Logros                      cuánta gente tiene cada medalla, colección, emblema y logro de viajero, y el sorteo del año            → Logros.tsx
 *   Qué tiene cada destino      la tabla de los 14 destinos y la página de cada uno («Roma por dentro»)                                → QueTieneCadaDestino.tsx
 *   Sonidos                     el estudio de sonidos de la V34C, tal cual (se monta dentro, sin tocarlo)                              → logros/AdminSonidos
 *   Herramientas                Dar Probador, Mis pruebas (sin pase, empezar de cero, reiniciar) y «Para Code» (plegado)                → Herramientas.tsx
 * «Elegir fotos», que Design lista como quinta pestaña, no existe en la app (la elección de fotos de viajeros está en «Fotos de viajeros» del menú), así que no hay pestaña.
 * Se puede abrir una pestaña con `?pestana=logros|destinos|sonidos|herramientas` (y un destino con `?destino=roma`); /admin/sonidos abre Sonidos.
 */
const AdminSonidos = lazy(() => import('../../logros/AdminSonidos').then((m) => ({ default: m.AdminSonidos })))

const PESTANAS = [
  { id: 'logros', nombre: 'Logros' },
  { id: 'destinos', nombre: 'Qué tiene cada destino' },
  { id: 'sonidos', nombre: 'Sonidos' },
  { id: 'herramientas', nombre: 'Herramientas' },
] as const
type Id = (typeof PESTANAS)[number]['id']

export default function LogrosYSonidos({ movil, pestana }: { movil: boolean; pestana?: string }): ReactNode {
  const [actual, setActual] = useState<Id>(() => (PESTANAS.find((p) => p.id === pestana)?.id ?? 'logros') as Id)
  const abrirDestino = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('destino')
  return (
    <>
      <Pestanas ids={[...PESTANAS]} activa={actual} alElegir={(id) => setActual(id as Id)} />
      <div data-logros-pestana={actual} style={{ display: 'flex', flexDirection: 'column', gap: movil ? 12 : 14, minWidth: 0 }}>
        {actual === 'logros' && <Logros movil={movil} />}
        {actual === 'destinos' && <QueTieneCadaDestino movil={movil} abrir={abrirDestino} />}
        {actual === 'sonidos' && <Suspense fallback={<p>Cargando…</p>}><AdminSonidos embebido /></Suspense>}
        {actual === 'herramientas' && <Herramientas movil={movil} />}
      </div>
    </>
  )
}
