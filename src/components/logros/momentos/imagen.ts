import { createElement, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { Emblema, Sello, type GradoDeSello } from '../dibujos'
import type { EstadoLogros } from './api'
import { llamar, type Momento } from '../../../lib/logros'
import { pedirViajero } from './api'
import { lineaDeSecretos } from './textosResumen'

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
export async function imagenDeLogro(m: Momento, fecha = new Date(), pie: DatosDelPie | null = null): Promise<Blob | null> {
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
  texto(ctx, `${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`, ANCHO / 2, 1590, "500 34px 'Geist Mono',monospace", 'rgba(255,253,248,.75)')
  await pintarPie(ctx, pie)
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
export async function imagenDeViaje(e: EstadoLogros, pie: DatosDelPie | null = null): Promise<Blob | null> {
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
  const secretos = lineaDeSecretos(e.ciudad, e.secretos.total, e.secretos.encontrados)
  if (e.secretos.encontrados > 0 && secretos) texto(ctx, secretos, ANCHO / 2, 1440, "500 38px 'Geist',sans-serif", 'rgba(255,253,248,.8)')
  texto(ctx, lineaDelViaje(e.ciudad, e.viaje.inicio, e.viaje.fin), ANCHO / 2, 1570, "500 40px 'Geist Mono',monospace", 'rgba(255,253,248,.85)')
  await pintarPie(ctx, pie)
  return new Promise((ok) => c.toBlob((b) => ok(b), 'image/png'))
}

/* ------------------------------------------------------------------ */
/* El pie de la imagen (C1 y C2 de Design): el marco de rango del viajero, su título y el hueco del logo                */
/* ------------------------------------------------------------------ */

/** El logo de la app. Aún no está decidido (ni el nombre ni el logo, ver data/marca.json): `null` deja el hueco vacío y preparado. Cuando haya logo, aquí va su dirección (una imagen de la propia app). */
export const LOGO_DE_LA_APP: string | null = null

export interface DatosDelPie {
  rango_ix: number
  estrellas: number
  titulo: string | null
}

/** Lo del pie que sale del servidor: el rango y las estrellas (de la EXP) y el título elegido (entre sus logros de viajero). Sin cuenta o sin respuesta, null y la imagen sale sin pie. */
export async function datosDelPie(): Promise<DatosDelPie | null> {
  const exp = await llamar<{ ok?: boolean; rango_ix: number; estrellas: number }>('/api/logros/exp')
  if (!exp || typeof exp.rango_ix !== 'number') return null
  let titulo: string | null = null
  const [vitrina, viajero] = await Promise.all([llamar<{ titulo?: string | null }>('/api/logros/vitrina'), pedirViajero()])
  const clave = vitrina?.titulo
  if (clave && viajero) {
    const [, logro, escalon] = clave.split('|')
    const def = viajero.logros.find((l) => `viajero:${l.id}` === logro)
    titulo = def ? (def.escalones.find((e) => String(e.n) === escalon)?.nombre ?? def.nombre) : null
  }
  return { rango_ix: exp.rango_ix, estrellas: exp.estrellas, titulo }
}

const cargarImagen = (src: string) =>
  new Promise<HTMLImageElement | null>((ok) => {
    const i = new Image()
    i.onload = () => ok(i)
    i.onerror = () => ok(null)
    i.src = src
  })

/** Pinta el pie: una raya, el marco con la inicial dentro, el título y, a la derecha, el hueco del logo (vacío mientras no haya logo). No lleva ningún nombre puesto a mano. */
export async function pintarPie(ctx: CanvasRenderingContext2D, pie: DatosDelPie | null, inicial = 'V', y = 1676): Promise<void> {
  ctx.fillStyle = 'rgba(255,253,248,.14)'
  ctx.fillRect(56, y, ANCHO - 112, 2)
  const base = y + 28
  if (pie) {
    const marco = await cargarImagen(`/marcos/marco-${Math.max(0, Math.min(9, pie.rango_ix)) + 1}.webp`)
    const w = 120
    const x = 56
    // La inicial en la ventana del marco (el círculo de 55 sobre 240 del diseño), y el marco encima.
    ctx.save()
    ctx.beginPath()
    ctx.arc(x + w / 2, base + w * 0.5, w * 0.23, 0, Math.PI * 2)
    ctx.clip()
    ctx.fillStyle = '#1C2230'
    ctx.fillRect(x, base, w, w)
    ctx.restore()
    texto(ctx, inicial, x + w / 2, base + w * 0.5 + 14, "400 38px 'Instrument Serif',serif", '#FFFDF8', 100)
    if (marco) ctx.drawImage(marco, x, base, w, w)
    for (let i = 0; i < 5; i++) {
      const on = i < pie.estrellas
      ctx.fillStyle = on ? '#FFF1B8' : '#1C2230'
      ctx.strokeStyle = on ? '#B5821C' : 'rgba(255,255,255,.5)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(x + w / 2 + (i - 2) * 20, base + w * 1.0 + 6, on ? 7 : 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
    if (pie.titulo) {
      ctx.textAlign = 'left'
      ctx.font = "italic 400 46px 'Instrument Serif',serif"
      ctx.fillStyle = '#F3D59A'
      ctx.fillText(pie.titulo, x + w + 28, base + w * 0.56)
    }
  }
  // El hueco del logo: una caja de rayas, vacía. Con `LOGO_DE_LA_APP` puesto, el logo dentro.
  const lw = 180
  const lh = 78
  const lx = ANCHO - 56 - lw
  const ly = base + 20
  if (LOGO_DE_LA_APP) {
    const logo = await cargarImagen(LOGO_DE_LA_APP)
    if (logo) ctx.drawImage(logo, lx, ly, lw, lh)
  } else {
    ctx.save()
    ctx.setLineDash([10, 8])
    ctx.strokeStyle = 'rgba(255,253,248,.4)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(lx, ly, lw, lh, 20)
    ctx.stroke()
    ctx.restore()
  }
}
