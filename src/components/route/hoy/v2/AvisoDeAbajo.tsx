import { useEffect } from 'react'
import { IconoPendientes } from './IconoPendientes'
import { createPortal } from 'react-dom'
import { useAvisoDeAbajo } from '../../../../store/useAvisoDeAbajo'
import { AvisoSobreLaBarra } from '../../../ui/AvisoSobreLaBarra'
import { AvisoArriba } from '../../../ui/AvisoArriba'

const ORO_CLARO = '#F3D88F'

/**
 * Los avisos de HOY (V43 §6, regla en CLAUDE.md). Los pone cualquiera con `avisarAbajo(...)`; los pinta este host, montado una sola vez en HOY.
 *  · CON [Deshacer]: exactamente como el resto de la app, TAPANDO el menú de abajo y todos en el mismo sitio (`AvisoSobreLaBarra`). 12 s.
 *  · SIN [Deshacer]: arriba, bajo la cabecera. Se van solos a los 5 s, o deslizándolos. Nunca más de uno a la vez (V54): el siguiente espera su turno.
 * El texto dice qué ha pasado («Piazza Navona, añadida a tu día»).
 */
export function AvisoDeAbajoHost() {
  const actual = useAvisoDeAbajo((s) => s.actual)
  const siguiente = useAvisoDeAbajo((s) => s.siguiente)
  useEffect(() => {
    if (!actual) return undefined
    const id = window.setTimeout(siguiente, actual.ms ?? (actual.accion ? 12000 : 5000))
    return () => window.clearTimeout(id)
  }, [actual, siguiente])
  // Al salir de HOY no quedan avisos esperando para la próxima vez.
  useEffect(() => () => useAvisoDeAbajo.getState().vaciar(), [])
  if (!actual) return null
  if (actual.accion) {
    const accion = actual.accion
    return createPortal(
      <AvisoSobreLaBarra z={95} datos={{ 'data-aviso-de-abajo': actual.id }} linea={{ total: actual.ms ?? 12000, clave: actual.id }}>
        {/pendientes/i.test(actual.texto) && <IconoPendientes size={22} color="#F3D88F" grosor={1.7} fondo="#1C2230" />}
        <span className="flex-1 text-[13.5px] font-medium leading-[1.35]">{actual.texto}</span>
        <button
          type="button"
          data-aviso-de-abajo-accion
          onClick={() => {
            accion.alTocar()
            siguiente()
          }}
          className="flex h-11 items-center pl-3 text-[14px] font-bold"
          style={{ color: ORO_CLARO }}
        >
          {accion.etiqueta}
        </button>
      </AvisoSobreLaBarra>,
      document.body,
    )
  }
  // (Noche 24-25 nov; Design «Avisos Arriba» A1) El aviso de arriba SOLO informa: la MISMA pieza que el resto de la app (`AvisoArriba`), con la tarjeta clara de filo dorado y su icono en un círculo (el reloj si habla de un cierre; si no, «i»).
  return createPortal(
    <AvisoArriba
      z={80}
      datos={{ 'data-aviso-de-abajo': actual.id }}
      onIrse={siguiente}
    >
      <span aria-hidden="true" className="flex h-8 w-8 flex-none items-center justify-center rounded-full" style={{ background: '#F3E6C4' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6E5018" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={/cerrad|cierr|hora/i.test(actual.texto) ? 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2' : 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01'} />
        </svg>
      </span>
      <span className="flex-1">{actual.texto}</span>
    </AvisoArriba>,
    document.body,
  )
}
