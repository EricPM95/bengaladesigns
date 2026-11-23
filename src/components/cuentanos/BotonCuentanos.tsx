import { useEffect, useState, type ReactNode } from 'react'
import { ESTILO_FLOTANTE, useFlotantes, bottomDeLaFila } from '../flotantes/flotantes'
import { abrirCuentanos, useCuentanosStore } from '../../store/useCuentanosStore'

/**
 * (V20, Design «Botones Flotantes» B1) EL TERCER BOTÓN FLOTANTE, «Cuéntanos»: igual que la cámara y el trofeo (crema con aro dorado), con el icono de aviso, ENCIMA de los demás (de la cámara,
 * del trofeo, del lápiz y de «Reorganizar»). (V28b: SOLO dentro del viaje, donde salen la cámara y el trofeo; ya no al abrir la app, ni en el inicio, Mis viajes, el Perfil o el login.) Se coloca midiendo dónde están los otros botones flotantes (los que llevan `data-flotante`),
 * así nunca los tapa aunque haya uno más o uno menos.
 */
const AVISO = 'M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9.5v4.5M12 17.2h.01'

export function BotonCuentanos(): ReactNode {
  const { debajo, alto } = useFlotantes()
  const abierto = useCuentanosStore((s) => s.abierto)
  // (V28b) Se esconde con la página del destino abierta (sale solo en las pantallas del viaje, no en esa).
  const [enPaginaDeDestino, setEnPaginaDeDestino] = useState(false)
  useEffect(() => {
    // (V42 §6) Avisos va en su sitio FIJO (fila 3 de la columna de la derecha: encima de Logros y de la Cámara): no se mide ni se mueve al cambiar de pestaña.
    const medir = () => setEnPaginaDeDestino(Boolean(document.querySelector('[data-pagina-destino]')))
    medir()
    const reloj = window.setInterval(medir, 400)
    window.addEventListener('resize', medir)
    return () => {
      window.clearInterval(reloj)
      window.removeEventListener('resize', medir)
    }
  }, [])
  if (abierto || enPaginaDeDestino) return null
  return (
    <button
      type="button"
      data-boton-cuentanos="1"
      data-cuentanos="boton"
      aria-label="Cuéntanos"
      onClick={() => abrirCuentanos()}
      className="zona-toque"
      style={{ ...ESTILO_FLOTANTE, position: 'fixed', right: 21, bottom: bottomDeLaFila(2, alto), zIndex: debajo ? 30 : 99, cursor: 'pointer' }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A5A1E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={AVISO} />
      </svg>
    </button>
  )
}
