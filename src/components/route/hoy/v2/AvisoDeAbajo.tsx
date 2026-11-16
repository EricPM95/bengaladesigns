import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAvisoDeAbajo } from '../../../../store/useAvisoDeAbajo'

const TINTA = '#1C2230'
const MARFIL = '#FBF3E2'
const ORO_CLARO = '#F3D88F'

/** El aviso de abajo de HOY (H5): uno solo, encima de las pestañas, a todo lo ancho; se va solo. Lo montan `HoyDuranteV2` y nadie más. */
export function AvisoDeAbajoHost() {
  const actual = useAvisoDeAbajo((s) => s.actual)
  const siguiente = useAvisoDeAbajo((s) => s.siguiente)
  useEffect(() => {
    if (!actual) return undefined
    const id = window.setTimeout(siguiente, actual.ms ?? (actual.accion ? 12000 : 6000))
    return () => window.clearTimeout(id)
  }, [actual, siguiente])
  // Al salir de HOY no quedan avisos esperando para la próxima vez.
  useEffect(() => () => useAvisoDeAbajo.getState().vaciar(), [])
  if (!actual) return null
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] px-[14px]">
      <div data-aviso-de-abajo={actual.id} role="status" className="pointer-events-auto flex min-h-12 w-full items-center rounded-[15px] px-3.5 py-2.5 text-[13px] font-medium leading-[1.35]" style={{ background: TINTA, color: MARFIL, boxShadow: '0 14px 22px -10px rgba(28,34,48,.7)' }}>
        <span className="flex-1">{actual.texto}</span>
        {actual.accion && (
          <button
            type="button"
            data-aviso-de-abajo-accion
            onClick={() => {
              actual.accion?.alTocar()
              siguiente()
            }}
            className="flex h-11 items-center pl-3 font-bold"
            style={{ color: ORO_CLARO }}
          >
            {actual.accion.etiqueta}
          </button>
        )}
      </div>
    </div>,
    document.body,
  )
}
