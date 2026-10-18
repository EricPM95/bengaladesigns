import { useEffect, type ReactNode } from 'react'
import { Capa } from './Capa'
import { useGanados, useHojasDeLogros } from './todos/api'
import { HojasDeLogros } from './todos/HojasDeLogros'
import './todos/todos.css'
import { useLogrosPantallas, type PantallaDe } from './useLogrosPantallas'

/**
 * LA FICHA DE UN LOGRO (8C2, T4) como pantalla suelta: otra pantalla (Mi colección, una colección…) la abre con `abrir({ t: 'ficha', clave })`, donde `clave` es la de lo ganado
 * (la de `GET /api/logros/ganados`) o `pendiente:<id del logro de viajero>` para uno que aún no se tiene. Dentro de «Todos mis logros» la misma hoja sube sobre la propia pantalla.
 */
export default function FichaDeLogro({ pantalla }: { pantalla: PantallaDe<'ficha'> }): ReactNode {
  const datos = useGanados((s) => s.datos)
  const cargar = useGanados((s) => s.cargar)
  useEffect(() => {
    void cargar()
    useHojasDeLogros.getState().abrirFicha(pantalla.clave)
    // Al cerrar la hoja se vuelve a la pantalla de antes.
    const dejarDeMirar = useHojasDeLogros.subscribe((nuevo, previo) => {
      if (previo.ficha && !nuevo.ficha) useLogrosPantallas.getState().volver()
    })
    return () => {
      dejarDeMirar()
      useHojasDeLogros.getState().limpiar()
    }
  }, [cargar, pantalla.clave])
  return (
    <Capa etiqueta="FichaDeLogro" fondo="rgba(28,34,48,.45)">
      <div className="vt" style={{ position: 'relative', flex: 1, minHeight: 0 }}>{datos && <HojasDeLogros g={datos} />}</div>
    </Capa>
  )
}
