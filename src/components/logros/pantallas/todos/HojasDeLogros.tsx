import type { ReactNode } from 'react'
import { useHojasDeLogros, type Ganados } from './api'
import { ElegirHueco } from './ElegirHueco'
import { FichaHoja } from './FichaHoja'

/** Las hojas que suben sobre una pantalla de los logros: la ficha de un logro, «elige un hueco» y el aviso de abajo («… vuelve a Todos mis logros»). */
export function HojasDeLogros({ g }: { g: Ganados }): ReactNode {
  const ficha = useHojasDeLogros((s) => s.ficha)
  const hueco = useHojasDeLogros((s) => s.hueco)
  const aviso = useHojasDeLogros((s) => s.aviso)
  const cerrarFicha = useHojasDeLogros((s) => s.cerrarFicha)
  const cerrarHueco = useHojasDeLogros((s) => s.cerrarHueco)
  return (
    <>
      {ficha && <FichaHoja g={g} clave={ficha} cerrar={cerrarFicha} />}
      {hueco && <ElegirHueco g={g} clave={hueco.clave} inicial={hueco.inicial} cerrar={cerrarHueco} />}
      {aviso && (
        <span role="status" style={{ position: 'absolute', left: '50%', bottom: 'calc(env(safe-area-inset-bottom,0px) + 36px)', zIndex: 80, maxWidth: 'calc(100% - 40px)', padding: '11px 16px', borderRadius: 999, background: '#1C2230', color: '#FFFDF8', font: "600 13px 'Geist'", boxShadow: '0 12px 28px -10px rgba(0,0,0,.6)', animation: 'vtToast 2.4s ease both', textAlign: 'center' }}>
          {aviso}
        </span>
      )}
    </>
  )
}
