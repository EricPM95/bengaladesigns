/**
 * (HOY2b 7, Eric 5-nov) [GUARDAR EN MI GALERÍA]. Hoy las fotos de la cámara de viaje solo van al álbum de la app; con este botón, además, a la galería del móvil.
 *  · iPhone / iPad: abre la hoja de compartir con «Guardar imagen» (Web Share con el archivo).
 *  · Android y el resto: descarga la foto.
 * La foto, a su calidad original: se guarda el mismo archivo (el de la cámara o la copia grande del álbum), sin reducirlo ni volver a comprimirlo. Sin React.
 */

export type ResultadoDeGuardar = 'compartida' | 'descargada' | 'cancelada' | 'error'

/** ¿Es un iPhone o un iPad (también el iPad que se presenta como Mac)? */
export function esIPhone(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints ?? 0) > 1)
}

const extensionDe = (tipo: string) => (/png/i.test(tipo) ? 'png' : /webp/i.test(tipo) ? 'webp' : /heic/i.test(tipo) ? 'heic' : 'jpg')

/** El nombre del archivo: «jutrip-2027-03-10-1530.jpg». */
export function nombreDeArchivo(tipo: string, ahora = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `jutrip-${ahora.getFullYear()}-${p(ahora.getMonth() + 1)}-${p(ahora.getDate())}-${p(ahora.getHours())}${p(ahora.getMinutes())}.${extensionDe(tipo)}`
}

/** Guarda la foto (el archivo mismo o la dirección desde la que se baja) en la galería del móvil. */
export async function guardarEnGaleria(foto: Blob | string): Promise<ResultadoDeGuardar> {
  try {
    const blob = typeof foto === 'string' ? await (await fetch(foto)).blob() : foto
    const tipo = blob.type || 'image/jpeg'
    const archivo = new File([blob], nombreDeArchivo(tipo), { type: tipo })
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
    if (esIPhone() && typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare({ files: [archivo] })) {
      try {
        await nav.share({ files: [archivo] })
        return 'compartida'
      } catch (e) {
        // El viajero cierra la hoja sin guardar: no es un fallo.
        if ((e as { name?: string })?.name === 'AbortError') return 'cancelada'
        throw e
      }
    }
    const url = URL.createObjectURL(archivo)
    const a = document.createElement('a')
    a.href = url
    a.download = archivo.name
    a.rel = 'noopener'
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
    return 'descargada'
  } catch {
    return 'error'
  }
}
