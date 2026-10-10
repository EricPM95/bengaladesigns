import { construirPresupuesto, type EntradaPresupuesto } from './presupuesto'
import { conMiles, simboloDe, type Importe } from './dinero'

/**
 * El efecto «el precio vuela a la cartera» (Tanda 6z6b): cuando el viajero GUARDA un precio fuera de la pantalla del presupuesto, una pastilla con el importe («+103,13 €») sale de donde lo guardó,
 * vuela a la cartera de arriba y la cartera da un saltito. UN solo sitio: aquí el cálculo (puro) y el dibujo; `PrecioVuela.tsx` solo lo conecta al almacén y a los clics.
 *  - De dónde sale cada precio: de `construirPresupuesto`, el mismo cálculo del presupuesto (alojamiento, llegada y vuelta, trasporte, coche, entradas y excursiones, seguro, eSIM y extras). No hay una segunda lista.
 *  - Cada importe va en la moneda en que lo puso el viajero y con el formato de siempre (`conMiles` y `simboloDe`); monedas distintas nunca se suman.
 */

/** Un cambio de precio: lo que se añade (importe > 0) o se quita (importe < 0), en la moneda del precio. */
export interface DiferenciaPrecio {
  clave: string
  importe: Importe
}

export const MENOS = '−'
export const DURACION_VUELO_MS = 800
export const DESFASE_MS = 120
export const DURACION_SALTO_MS = 380
/** Un clic más viejo que esto ya no es «donde lo ha guardado». */
export const EDAD_MAXIMA_CLIC_MS = 10000

/** Todos los precios que suman al presupuesto, por clave (la de cada línea del presupuesto), tal como los puso el viajero. */
export function preciosDeEntrada(entrada: EntradaPresupuesto): Map<string, Importe> {
  const mapa = new Map<string, Importe>()
  for (const bloque of construirPresupuesto({ ...entrada, cambio: null }).bloques) for (const linea of bloque.lineas) mapa.set(linea.id, linea.precio)
  return mapa
}

const aCentimos = (valor: number) => Math.round(valor * 100) / 100

/** Qué ha cambiado entre dos fotos de los precios: nuevo (+), distinto (+/− la diferencia), quitado (−). Sin cambio, nada. Si cambia la moneda, se quita el viejo y se añade el nuevo (nunca se restan monedas distintas). */
export function diferenciasDePrecios(antes: Map<string, Importe>, despues: Map<string, Importe>): DiferenciaPrecio[] {
  const difs: DiferenciaPrecio[] = []
  for (const [clave, nuevo] of despues) {
    const viejo = antes.get(clave)
    if (!viejo) difs.push({ clave, importe: nuevo })
    else if (viejo.currency !== nuevo.currency) {
      difs.push({ clave, importe: { amount: -viejo.amount, currency: viejo.currency } })
      difs.push({ clave, importe: nuevo })
    } else {
      const resta = aCentimos(nuevo.amount - viejo.amount)
      if (resta !== 0) difs.push({ clave, importe: { amount: resta, currency: nuevo.currency } })
    }
  }
  for (const [clave, viejo] of antes) if (!despues.has(clave)) difs.push({ clave, importe: { amount: -viejo.amount, currency: viejo.currency } })
  return difs
}

/** El importe de la pastilla: el formato de siempre (punto de millar, coma decimal, símbolo de su moneda) pero siempre con los dos decimales, para que «+20,00» y «+103,13» se lean igual. */
export function importeConDecimales(importe: Importe): string {
  const [entera, decimales] = Math.abs(importe.amount).toFixed(2).split('.')
  return `${conMiles(Number(entera))},${decimales} ${simboloDe(importe.currency)}`
}

/** «+103,13 €» / «−20,00 €»: en la moneda del precio y con el signo menos tipográfico. */
export function textoDeDiferencia(dif: DiferenciaPrecio): string {
  return `${dif.importe.amount < 0 ? MENOS : '+'}${importeConDecimales(dif.importe)}`
}

/** Para los lectores de pantalla: «Añadidos 103,13 € al presupuesto» / «Quitados 20 € del presupuesto». */
export function textoParaLector(difs: DiferenciaPrecio[]): string {
  const suman = difs.filter((d) => d.importe.amount > 0).map((d) => importeConDecimales(d.importe))
  const restan = difs.filter((d) => d.importe.amount < 0).map((d) => importeConDecimales(d.importe))
  return [suman.length ? `Añadidos ${suman.join(' y ')} al presupuesto` : '', restan.length ? `Quitados ${restan.join(' y ')} del presupuesto` : ''].filter(Boolean).join('. ')
}

/** Lo que cambia en el presupuesto desde la última vez. La primera lectura de un viaje (abrirlo, restaurarlo, generar otro) y los cambios con el presupuesto abierto no dan efecto. */
export function crearSeguidor() {
  let base: Map<string, Importe> | null = null
  let rutaId: string | null = null
  let pago: boolean | null = null
  return {
    procesar(entrada: EntradaPresupuesto | null, presupuestoAbierto: boolean): DiferenciaPrecio[] {
      if (!entrada) {
        base = null
        rutaId = null
        return []
      }
      const ahora = preciosDeEntrada(entrada)
      const esCarga = base === null || rutaId !== entrada.route.id || pago !== entrada.pago
      const antes = base
      base = ahora
      rutaId = entrada.route.id
      pago = entrada.pago
      if (esCarga || !antes || presupuestoAbierto) return []
      return diferenciasDePrecios(antes, ahora)
    },
  }
}

// ── El dibujo ──

export interface Caja {
  left: number
  top: number
  width: number
  height: number
}

export interface UltimoClic {
  caja: Caja
  momento: number
}

/** La cartera que se ve: la de más área dentro de la pantalla (hay una en la cabecera y otra en la de RESERVAS; la que no se ve tiene tamaño 0 o está fuera). */
export function elegirCartera<T extends { getBoundingClientRect(): Caja }>(carteras: T[], ancho: number, alto: number): { elemento: T; caja: Caja } | null {
  let mejor: { elemento: T; caja: Caja } | null = null
  let mejorArea = 0
  for (const elemento of carteras) {
    const caja = elemento.getBoundingClientRect()
    const visibleAncho = Math.min(caja.left + caja.width, ancho) - Math.max(caja.left, 0)
    const visibleAlto = Math.min(caja.top + caja.height, alto) - Math.max(caja.top, 0)
    const area = visibleAncho > 0 && visibleAlto > 0 ? visibleAncho * visibleAlto : 0
    if (area > mejorArea) {
      mejorArea = area
      mejor = { elemento, caja }
    }
  }
  return mejor
}

/** Dónde nace la pastilla: encima del último elemento pulsado (debajo si no hay sitio arriba); sin clic reciente, el centro de la pantalla. Siempre dentro de la pantalla. */
export function puntoDeSalida(clic: UltimoClic | null, ahora: number, ancho: number, alto: number): { x: number; y: number } {
  if (!clic || ahora - clic.momento > EDAD_MAXIMA_CLIC_MS) return { x: ancho / 2, y: alto / 2 }
  const { caja } = clic
  const x = caja.left + caja.width / 2
  const arriba = caja.top - 22
  const y = arriba >= 40 ? arriba : caja.top + caja.height + 22
  return { x: Math.min(Math.max(x, 40), Math.max(ancho - 40, 40)), y: Math.min(Math.max(y, 24), Math.max(alto - 24, 24)) }
}

/** Lo mínimo del navegador que usa el dibujo: así se prueba con piezas falsas. */
export interface Entorno {
  document: Document
  ancho: number
  alto: number
  reducirMovimiento: boolean
  ultimoClic: UltimoClic | null
  ahora: () => number
  esperar: (fn: () => void, ms: number) => unknown
}

function saltito(cartera: HTMLElement) {
  cartera.setAttribute('data-cartera-salto', '')
  const animacion = cartera.animate?.(
    [
      { transform: 'translateY(0) scale(1)', offset: 0 },
      { transform: 'translateY(-5px) scale(1.2)', offset: 0.4 },
      { transform: 'translateY(0) scale(0.96)', offset: 0.7 },
      { transform: 'translateY(0) scale(1)', offset: 1 },
    ],
    { duration: DURACION_SALTO_MS, easing: 'ease-out' },
  )
  const fin = () => cartera.removeAttribute('data-cartera-salto')
  if (animacion) animacion.onfinish = fin
  else fin()
}

function pastilla(documento: Document, texto: string, suma: boolean): HTMLElement {
  const el = documento.createElement('div')
  el.textContent = texto
  el.setAttribute('aria-hidden', 'true')
  el.setAttribute('data-precio-vuela', '')
  el.style.cssText = `position:fixed;left:0;top:0;z-index:2147483000;pointer-events:none;padding:4px 10px;border-radius:9999px;font:600 12px ui-monospace,SFMono-Regular,Menlo,monospace;white-space:nowrap;color:#F5F7FA;background:${suma ? '#1C2230' : '#6B7280'};box-shadow:0 2px 8px rgba(0,0,0,0.25);will-change:transform,opacity`
  return el
}

/**
 * Lanza el efecto de una diferencia: la pastilla sale del último clic, vuela a la cartera que se ve (≈ 0,8 s, encogiéndose y desvaneciéndose) y la cartera da su saltito al llegar.
 * Con «reducir movimiento» no hay pastilla ni vuelo: solo el saltito. Sin cartera a la vista no hay nada que hacer.
 */
export function lanzarEfecto(dif: DiferenciaPrecio, entorno: Entorno): void {
  const { document: documento, ancho, alto } = entorno
  const cartera = elegirCartera(Array.from(documento.querySelectorAll<HTMLElement>('[data-cartera]')), ancho, alto)
  if (!cartera) return
  if (entorno.reducirMovimiento) {
    saltito(cartera.elemento)
    return
  }
  const salida = puntoDeSalida(entorno.ultimoClic, entorno.ahora(), ancho, alto)
  const destino = { x: cartera.caja.left + cartera.caja.width / 2, y: cartera.caja.top + cartera.caja.height / 2 }
  const el = pastilla(documento, textoDeDiferencia(dif), dif.importe.amount > 0)
  documento.body.appendChild(el)
  const en = (p: { x: number; y: number }, escala: number) => `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) scale(${escala})`
  const animacion = el.animate(
    [
      { transform: en(salida, 0.7), opacity: 0, offset: 0 },
      { transform: en(salida, 1), opacity: 1, offset: 0.15 },
      { transform: en(salida, 1), opacity: 1, offset: 0.3 },
      { transform: en(destino, 0.25), opacity: 0, offset: 1 },
    ],
    { duration: DURACION_VUELO_MS, easing: 'ease-in-out', fill: 'forwards' },
  )
  animacion.onfinish = () => {
    el.remove()
    saltito(cartera.elemento)
  }
}

/** Varias diferencias a la vez: una detrás de otra, con 120 ms de desfase. */
export function lanzarEfectos(difs: DiferenciaPrecio[], entorno: Entorno): void {
  difs.forEach((dif, i) => (i === 0 ? lanzarEfecto(dif, entorno) : entorno.esperar(() => lanzarEfecto(dif, entorno), i * DESFASE_MS)))
}

/** Guarda la caja del último elemento pulsado (o con el foco al pulsar Intro/Espacio): es «donde lo ha guardado». */
export function cajaDelObjetivo(objetivo: EventTarget | null): Caja | null {
  const el = objetivo as Element | null
  if (!el || typeof el.getBoundingClientRect !== 'function') return null
  const pulsable = (typeof el.closest === 'function' ? el.closest('button, a, [role="button"], input, select, textarea, label') : null) ?? el
  const caja = pulsable.getBoundingClientRect()
  return caja.width > 0 || caja.height > 0 ? { left: caja.left, top: caja.top, width: caja.width, height: caja.height } : null
}
