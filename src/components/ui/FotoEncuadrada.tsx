import { useState, type CSSProperties, type ReactNode } from 'react'
import { estiloDeEncuadre, esCentrado, type Encuadre } from '../../lib/encuadreFoto'

/**
 * LA FOTO DEL PERFIL DENTRO DE SU CÍRCULO (Tanda 10N3, §3b.4): el ÚNICO sitio que pinta la foto de una persona con su encuadre. Llena el contenedor (que debe ser `position: relative; overflow: hidden`
 * y cuadrado). Sin encuadre —o centrado y sin acercar— es la foto de siempre (`object-fit: cover`); con él, la parte que eligió la persona. El emblema del perfil, el avatar, la cabecera, «Personas del viaje»,
 * los avisos y la hoja de ajustar usan este componente: por eso se ve igual en todas partes.
 */
export function FotoEncuadrada({ src, encuadre = null, alRomper, style, datos }: { src: string; encuadre?: Encuadre | null; alRomper?: () => void; style?: CSSProperties; datos?: string }): ReactNode {
  const [aspecto, setAspecto] = useState<number | null>(null)
  const ajustada = !esCentrado(encuadre) && aspecto !== null
  const base: CSSProperties = ajustada && encuadre ? estiloDeEncuadre(encuadre, aspecto) : { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      data-foto-encuadrada={datos ?? ''}
      data-encuadre={encuadre ? `${encuadre.x.toFixed(3)},${encuadre.y.toFixed(3)},${encuadre.zoom.toFixed(3)}` : ''}
      onLoad={(e) => {
        const i = e.currentTarget
        if (i.naturalWidth > 0 && i.naturalHeight > 0) setAspecto(i.naturalWidth / i.naturalHeight)
      }}
      onError={alRomper}
      style={{ ...base, ...style }}
    />
  )
}
