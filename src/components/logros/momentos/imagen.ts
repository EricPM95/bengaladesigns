import { createElement, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { Emblema, Sello, type GradoDeSello } from '../dibujos'
import type { EstadoLogros } from './api'
import type { Momento } from '../../../lib/logros'

/**
 * LA IMAGEN PARA COMPARTIR (Tanda 8B, «Compartir un logro» y «Compartir el viaje»). Se dibuja en el navegador con un lienzo (canvas) de 1080 × 1920 (formato
 * de historia), sin librerías: los textos con el propio canvas y los dibujos (emblema, sello) pasando su SVG a imagen. Si un dibujo todavía no es un SVG
 * (los marcadores provisionales), se pinta un círculo con su nombre.
 */
export const ANCHO = 1080
export const ALTO = 1920
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** Copia un nodo con todos sus estilos calculados, para pintarlo aislado (sin las hojas de estilo de la página). */
function clonarConEstilos(origen: Element): Element {
  const copia = origen.cloneNode(false) as Element
  const calculado = getComputedStyle(origen)
  let css = ''
  for (let i = 0; i < calculado.length; i++) css += `${calculado[i]}:${calculado.getPropertyValue(calculado[i])};`
  copia.setAttribute('style', css)
  for (const hijo of Array.from(origen.childNodes)) copia.appendChild(hijo.nodeType === 1 ? clonarConEstilos(hijo as Element) : hijo.cloneNode(true))
  return copia
}

/** Pinta un dibujo de React en una imagen (SVG o HTML: se pasa por un foreignObject con los estilos puestos). Devuelve null si no se puede. */
export async function dibujoAImagen(nodo: ReactNode, tam: number): Promise<HTMLImageElement | null> {
  const caja = document.createElement('div')
  caja.style.cssText = `position:fixed;left:-9999px;top:0;width:${tam}px;height:${tam}px;pointer-events:none`
  document.body.appendChild(caja)
  const raiz = createRoot(caja)
  try {
    flushSync(() => raiz.render(createElement('div', { style: { width: tam, height: tam } }, nodo)))
    const dentro = caja.firstElementChild
    if (!dentro) return null
    const copia = clonarConEstilos(dentro)
    copia.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml')
    const xml = new XMLSerializer().serializeToString(copia)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tam}" height="${tam}"><foreignObject width="100%" height="100%">${xml}</foreignObject></svg>`
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    return await new Promise((ok) => {
      const img = new Image()
      img.onload = () => ok(img)
      img.onerror = () => ok(null)
      img.src = url
    })
  } catch {
    return null
  } finally {
    raiz.unmount()
    caja.remove()
  }
}

function texto(ctx: CanvasRenderingContext2D, t: string, x: number, y: number, fuente: string, color: string, ancho = 900, interlineado = 1.15, centro = true): number {
  ctx.font = fuente
  ctx.fillStyle = color
  ctx.textAlign = centro ? 'center' : 'left'
  const palabras = t.split(' ')
  let linea = ''
  const px = Number(/(\d+)px/.exec(fuente)?.[1] ?? 40)
  let yy = y
  for (const p of palabras) {
    const prueba = linea ? `${linea} ${p}` : p
    if (ctx.measureText(prueba).width > ancho && linea) {
      ctx.fillText(linea, x, yy)
      linea = p
      yy += px * interlineado
    } else linea = prueba
  }
  ctx.fillText(linea, x, yy)
  return yy + px * interlineado
}

function fondo(ctx: CanvasRenderingContext2D) {
  const g = ctx.createRadialGradient(ANCHO / 2, 0, 100, ANCHO / 2, 500, 1700)
  g.addColorStop(0, '#2E3550')
  g.addColorStop(0.7, '#141826')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, ANCHO, ALTO)
  ctx.save()
  ctx.translate(ANCHO / 2, 640)
  ctx.fillStyle = 'rgba(243,213,154,.10)'
  for (let i = 0; i < 18; i++) {
    ctx.rotate((Math.PI * 2) / 18)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(-90, -900)
    ctx.lineTo(90, -900)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

function pintarDibujo(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, cx: number, cy: number, tam: number, etiqueta: string) {
  if (img) {
    ctx.drawImage(img, cx - tam / 2, cy - tam / 2, tam, tam)
    return
  }
  ctx.beginPath()
  ctx.arc(cx, cy, tam / 2, 0, Math.PI * 2)
  ctx.fillStyle = '#E8DFCB'
  ctx.fill()
  texto(ctx, etiqueta, cx, cy + 12, "600 36px 'Geist Mono',monospace", '#1C2230', tam * 0.8)
}

const QUE_ES: Record<string, string> = { emblema: 'Emblema oculto', coleccion: 'Colección completada', sello: 'Sello', pais: 'País nuevo', destino_nuevo: 'Destino nuevo', continente: 'Nuevo continente', maravilla: 'Maravilla del mundo', patrimonio: 'Patrimonio de la Humanidad', viajero: 'Logro de viajero' }

/** C1 · Compartir un logro. */
export async function imagenDeLogro(m: Momento, fecha = new Date()): Promise<Blob | null> {
  await document.fonts?.ready
  const c = document.createElement('canvas')
  c.width = ANCHO
  c.height = ALTO
  const ctx = c.getContext('2d')
  if (!ctx) return null
  fondo(ctx)
  const id = String(m.id ?? '')
  let dibujo: HTMLImageElement | null = null
  let etiqueta = String(m.nombre)
  if (m.tipo === 'emblema') {
    dibujo = await dibujoAImagen(createElement(Emblema, { id, tam: 560 }), 560)
    etiqueta = id
  } else if (m.tipo === 'sello') {
    dibujo = await dibujoAImagen(createElement(Sello, { id: String(m.sello), grado: String(m.grado) as GradoDeSello, tam: 560 }), 560)
    etiqueta = String(m.sello)
  }
  pintarDibujo(ctx, dibujo, ANCHO / 2, 640, 560, etiqueta)
  texto(ctx, (QUE_ES[m.tipo] ?? 'Logro').toUpperCase(), ANCHO / 2, 1100, "600 34px 'Geist Mono',monospace", '#F3D59A')
  const y = texto(ctx, String(m.nombre), ANCHO / 2, 1200, "400 104px 'Instrument Serif',serif", '#FFFDF8', 900, 1.05)
  if (m.linea) texto(ctx, String(m.linea), ANCHO / 2, y + 30, "italic 400 48px 'Instrument Serif',serif", 'rgba(255,253,248,.8)', 840, 1.25)
  texto(ctx, `${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`, ANCHO / 2, 1760, "500 34px 'Geist Mono',monospace", 'rgba(255,253,248,.75)')
  return new Promise((ok) => c.toBlob((b) => ok(b), 'image/png'))
}

/** Pura: «5 días en Roma · octubre de 2026». */
export function lineaDelViaje(ciudad: string, inicio: string, fin: string): string {
  const a = new Date(`${inicio}T12:00:00`)
  const b = new Date(`${fin}T12:00:00`)
  const dias = Math.round((b.getTime() - a.getTime()) / 86400000) + 1
  return `${dias} ${dias === 1 ? 'día' : 'días'} en ${ciudad} · ${MESES[a.getMonth()]} de ${a.getFullYear()}`
}

/** C2 · Compartir el viaje. */
export async function imagenDeViaje(e: EstadoLogros): Promise<Blob | null> {
  await document.fonts?.ready
  const c = document.createElement('canvas')
  c.width = ANCHO
  c.height = ALTO
  const ctx = c.getContext('2d')
  if (!ctx) return null
  fondo(ctx)
  texto(ctx, 'MI VIAJE', ANCHO / 2, 250, "600 34px 'Geist Mono',monospace", '#F3D59A')
  texto(ctx, e.ciudad, ANCHO / 2, 380, "400 150px 'Instrument Serif',serif", '#FFFDF8')
  const sello = e.sellos[0]
  if (sello?.grado) {
    const img = await dibujoAImagen(createElement(Sello, { id: sello.id, grado: sello.grado as GradoDeSello, tam: 520 }), 520)
    pintarDibujo(ctx, img, ANCHO / 2, 800, 520, sello.id)
  }
  const lista = e.secretos.encontrados_lista.slice(0, 5)
  const tam = 170
  const ini = ANCHO / 2 - ((lista.length - 1) * (tam + 24)) / 2
  for (let i = 0; i < lista.length; i++) {
    const img = await dibujoAImagen(createElement(Emblema, { id: lista[i].id, tam }), tam)
    pintarDibujo(ctx, img, ini + i * (tam + 24), 1260, tam, lista[i].id)
  }
  if (e.secretos.encontrados > 0) texto(ctx, e.secretos.texto, ANCHO / 2, 1440, "500 38px 'Geist',sans-serif", 'rgba(255,253,248,.8)')
  texto(ctx, lineaDelViaje(e.ciudad, e.viaje.inicio, e.viaje.fin), ANCHO / 2, 1700, "500 40px 'Geist Mono',monospace", 'rgba(255,253,248,.85)')
  return new Promise((ok) => c.toBlob((b) => ok(b), 'image/png'))
}
