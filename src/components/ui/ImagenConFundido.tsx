import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ImgHTMLAttributes } from 'react'

/**
 * (V67, P3) LA FOTO QUE LLEGA CON UN FUNDIDO. UNA sola pieza para toda tarjeta con foto que pueda tardar (el viaje del Perfil, la lista de viajes, la portada de un destino, el mosaico de destinos):
 *  · mientras la foto carga, el contenedor enseña solo un hueco del color que le pone quien la usa (`fondo`: el color de fondo de la tarjeta), sin degradado y SIN lo que va con la foto (el texto del autor: quien la usa lo pinta solo cuando `alEstado` dice 'lista', con `CREDITO_DE_FOTO_ENTRA`);
 *  · cuando llega, la foto entra con un fundido suave (0,45 s) y el autor entra con ella;
 *  · si la foto falla, se queda el hueco (nunca un icono roto ni el autor de una foto que no se ve).
 * Se pone DENTRO de un contenedor con `position: relative` y `overflow: hidden`; el hueco y la foto lo llenan (`position: absolute; inset: 0`). No suena (no se mueve nada que el viajero deba oír: es un fundido de carga).
 * Sin consultas a Supabase: solo la imagen que ya se pedía.
 */
type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'style' | 'children'> & {
  src: string
  /** El color del hueco mientras carga (el fondo de la tarjeta). */
  fondo?: string
  /** Estilo extra de la foto (por defecto llena el contenedor y recorta: `object-fit: cover`). */
  style?: CSSProperties
  /** Avisa de cómo va la foto ('cargando', 'lista' o 'fallo'): lo que va con la foto (el autor) se pinta solo con 'lista'. */
  alEstado?: (estado: 'cargando' | 'lista' | 'fallo') => void
  /** Duración del fundido en milisegundos. */
  duracion?: number
}

/** El estilo con el que entra lo que va con la foto (el autor): el mismo fundido que la foto. */
export const CREDITO_DE_FOTO_ENTRA: CSSProperties = { animation: 'imagenConFundidoEntra 450ms ease-out' }

export function ImagenConFundido({ src, fondo = '#EADFC8', style, alEstado, duracion = 450, onLoad, onError, ...resto }: Props) {
  const [estado, setEstado] = useState<'cargando' | 'lista' | 'fallo'>('cargando')
  const ref = useRef<HTMLImageElement>(null)
  // Una foto que ya está en la caché del móvil sale a la vez que la tarjeta (sin esperar al evento de carga).
  useLayoutEffect(() => {
    setEstado('cargando')
    const img = ref.current
    if (img && img.complete) setEstado(img.naturalWidth > 0 ? 'lista' : 'fallo')
  }, [src])
  useEffect(() => {
    alEstado?.(estado)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado])
  const lista = estado === 'lista'
  const fundido = `opacity ${duracion}ms ease-out`
  return (
    <>
      <span aria-hidden="true" data-imagen-hueco={lista ? 'lista' : estado} style={{ position: 'absolute', inset: 0, background: fondo }} />
      {estado !== 'fallo' && (
        <img
          ref={ref}
          src={src}
          alt=""
          aria-hidden="true"
          draggable={false}
          onLoad={(e) => {
            setEstado('lista')
            onLoad?.(e)
          }}
          onError={(e) => {
            setEstado('fallo')
            onError?.(e)
          }}
          {...resto}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: lista ? 1 : 0, transition: fundido, ...style }}
        />
      )}
    </>
  )
}
