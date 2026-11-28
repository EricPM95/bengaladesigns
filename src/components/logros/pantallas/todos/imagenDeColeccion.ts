import { clonarConEstilos } from '../../momentos/imagen'

/**
 * (V82 §5) La tarjeta para presumir pasada a imagen (PNG), en el navegador y sin librerías: se copia el nodo con sus estilos calculados, se mete en un SVG (foreignObject) y se pinta en un lienzo.
 * Las imágenes sueltas (las monedas de la medalla de las 7 maravillas son WebP de `public/medalla/`) se pasan antes a datos, porque una imagen dentro de un SVG no puede bajar nada de fuera.
 * Devuelve null si algo falla (el botón entonces dice que no se ha podido).
 */
async function aDatos(url: string): Promise<string | null> {
  try {
    const r = await fetch(url)
    const b = await r.blob()
    return await new Promise((ok) => {
      const f = new FileReader()
      f.onload = () => ok(typeof f.result === 'string' ? f.result : null)
      f.onerror = () => ok(null)
      f.readAsDataURL(b)
    })
  } catch {
    return null
  }
}

export async function elementoAImagen(el: HTMLElement, escala = 2): Promise<Blob | null> {
  try {
    await document.fonts?.ready
    const caja = el.getBoundingClientRect()
    const ancho = Math.ceil(caja.width)
    const alto = Math.ceil(caja.height)
    const copia = clonarConEstilos(el) as HTMLElement
    for (const img of Array.from(copia.querySelectorAll('img'))) {
      const src = img.getAttribute('src')
      if (src && !src.startsWith('data:')) {
        const d = await aDatos(src)
        if (d) img.setAttribute('src', d)
      }
    }
    copia.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml')
    const xml = new XMLSerializer().serializeToString(copia)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}"><foreignObject width="100%" height="100%">${xml}</foreignObject></svg>`
    const imagen = await new Promise<HTMLImageElement | null>((ok) => {
      const i = new Image()
      i.onload = () => ok(i)
      i.onerror = () => ok(null)
      i.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    })
    if (!imagen) return null
    const lienzo = document.createElement('canvas')
    lienzo.width = ancho * escala
    lienzo.height = alto * escala
    const ctx = lienzo.getContext('2d')
    if (!ctx) return null
    ctx.scale(escala, escala)
    ctx.drawImage(imagen, 0, 0, ancho, alto)
    return await new Promise((ok) => lienzo.toBlob((b) => ok(b), 'image/png'))
  } catch {
    return null
  }
}
