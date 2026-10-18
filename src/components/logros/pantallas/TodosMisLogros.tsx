import { useEffect, useState, type ReactNode } from 'react'
import { Capa } from './Capa'
import { useGanados, useHojasDeLogros } from './todos/api'
import { HojasDeLogros } from './todos/HojasDeLogros'
import { TodosLista } from './todos/TodosLista'
import { Vitrina } from './todos/Vitrina'
import './todos/todos.css'
import { useLogrosPantallas, type PantallaDe } from './useLogrosPantallas'

/**
 * «MI VITRINA» Y «TODOS MIS LOGROS» (8C2, V1 a V3 y T1 a T4): una pantalla con dos pestañas. La vitrina enseña lo que el viajero elige; «Todos mis logros» guarda todo lo que tiene y lo que le falta.
 * Los números y los textos salen de `GET /api/logros/ganados`; aquí solo se pintan. Cada destino abre su página, «Ver todo» abre «Mi colección» y tocar un logro abre su ficha.
 */
const PESTANAS = [
  { id: 'vitrina', nombre: 'Mi vitrina' },
  { id: 'todos', nombre: 'Todos mis logros' },
] as const

export default function TodosMisLogros({ pantalla }: { pantalla: PantallaDe<'todos'> }): ReactNode {
  const [pestana, setPestana] = useState<'vitrina' | 'todos'>(pantalla.pestana ?? 'vitrina')
  const datos = useGanados((s) => s.datos)
  const estado = useGanados((s) => s.estado)
  const cargar = useGanados((s) => s.cargar)
  // Cada vez que se abre se vuelve a pedir (por si se ha ganado algo); mientras llega, se enseña lo último que había.
  useEffect(() => {
    void cargar(true)
    return () => useHojasDeLogros.getState().limpiar()
  }, [cargar])
  const oscura = pestana === 'vitrina'
  return (
    <Capa etiqueta="TodosMisLogros" oscura={oscura} fondo={oscura ? 'radial-gradient(circle at 50% 0%,#1E2648 0%,#0B0E1C 62%)' : '#F5EFE4'}>
      <div className="vt" style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', color: oscura ? '#FFFDF8' : '#1C2230' }}>
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px 12px 10px' }}>
          <button type="button" aria-label="Volver" onClick={() => useLogrosPantallas.getState().volver()} style={{ width: 48, height: 48, flex: 'none', border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ width: 40, height: 40, borderRadius: '50%', border: `1px solid ${oscura ? 'rgba(255,253,248,.2)' : 'rgba(28,34,48,.16)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M19 12H5M11 6l-6 6 6 6" />
              </svg>
            </span>
          </button>
          <div role="tablist" aria-label="Logros" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, padding: 4, borderRadius: 999, background: oscura ? 'rgba(255,253,248,.08)' : '#EDE4D3' }}>
            {PESTANAS.map((p) => {
              const on = pestana === p.id
              return (
                <button key={p.id} type="button" role="tab" aria-selected={on} onClick={() => setPestana(p.id)} style={{ height: 44, border: 'none', borderRadius: 999, background: on ? (oscura ? '#F3D59A' : '#1C2230') : 'transparent', color: on ? (oscura ? '#17120a' : '#FFFDF8') : oscura ? 'rgba(255,253,248,.7)' : 'rgba(28,34,48,.65)', font: "600 13px 'Geist'", cursor: 'pointer', transition: 'background .25s,color .25s' }}>
                  {p.nombre}
                </button>
              )
            })}
          </div>
        </div>
        {datos ? (
          pestana === 'vitrina' ? (
            <Vitrina g={datos} />
          ) : (
            <TodosLista g={datos} />
          )
        ) : (
          <p style={{ textAlign: 'center', font: "400 13.5px 'Geist'", color: oscura ? 'rgba(255,253,248,.6)' : 'rgba(28,34,48,.6)', margin: '40px 24px' }}>{estado === 'error' ? 'Todavía no hay logros que enseñar.' : 'Un momento…'}</p>
        )}
        {datos && <HojasDeLogros g={datos} />}
      </div>
    </Capa>
  )
}
