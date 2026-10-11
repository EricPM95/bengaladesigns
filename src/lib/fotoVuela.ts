/**
 * El efecto «la foto vuela al Perfil» (Tanda 6y4, punto 15), hermano de «el precio vuela a la cartera» (`precioVuela.ts`): al añadir una foto desde cualquier sitio, una miniatura de esa foto sale de donde
 * se pulsó, vuela hasta el botón del Perfil de la cabecera (≈ 0,8 s, encogiéndose y desvaneciéndose) y el botón da un saltito. Con «reducir movimiento», solo el saltito. Si el botón del Perfil está tapado por
 * una hoja (el propio Perfil, una ficha…), el vuelo ESPERA a que se cierre. Un solo sitio: aquí el cálculo y el dibujo; `FotoVuela.tsx` solo lo conecta al aviso de `fotosViaje.ts` (`alAnadirFoto`) y a los clics.
 *
 * Lo mínimo del navegador que usa el dibujo viaja en `Entorno`, así se prueba con piezas falsas.
 */

import { estaTapado as estaTapadoElemento } from './precioVuela'

export const DURACION_VUELO_MS = 800
export const DESFASE_MS = 120
export const DURACION_SALTO_MS = 380
/** Un clic más viejo que esto ya no es «donde se ha añadido la foto». */
export const EDAD_MAXIMA_CLIC_MS = 10000
/** Cada cuánto se mira si ya se ha cerrado la hoja que tapaba el botón. */
export const SONDEO_TAPADO_MS = 250
/** Cuánto se espera como máximo a que se cierre la hoja; pasado esto, la foto ya no vuela (la miniatura se suelta). */
export const ESPERA_MAXIMA_MS = 5 * 60 * 1000
/** Con muchas fotos a la vez (se eligen 30 de la galería) solo vuelan las primeras; el botón da su saltito igual. */
export const MAXIMO_VUELOS_A_LA_VEZ = 6
/** El atributo con el que se marca el botón del Perfil de la cabecera (`Header.tsx`). */
export const ATRIBUTO_BOTON_PERFIL = 'data-boton-perfil'

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

/** Guarda la caja del último elemento pulsado (o con el foco al pulsar Intro/Espacio): es «de donde sale la foto». */
export function cajaDelObjetivo(objetivo: EventTarget | null): Caja | null {
  const el = objetivo as Element | null
  if (!el || typeof el.getBoundingClientRect !== 'function') return null
  const pulsable = (typeof el.closest === 'function' ? el.closest('button, a, [role="button"], input, select, textarea, label') : null) ?? el
  const caja = pulsable.getBoundingClientRect()
  return caja.width > 0 || caja.height > 0 ? { left: caja.left, top: caja.top, width: caja.width, height: caja.height } : null
}

/** Dónde nace la miniatura: el centro del último elemento pulsado; sin clic reciente, el centro de la pantalla. Siempre dentro de la pantalla. */
export function puntoDeSalida(clic: UltimoClic | null, ahora: number, ancho: number, alto: number): { x: number; y: number } {
  if (!clic || ahora - clic.momento > EDAD_MAXIMA_CLIC_MS) return { x: ancho / 2, y: alto / 2 }
  const { caja } = clic
  return { x: Math.min(Math.max(caja.left + caja.width / 2, 30), Math.max(ancho - 30, 30)), y: Math.min(Math.max(caja.top + caja.height / 2, 30), Math.max(alto - 30, 30)) }
}

export interface Entorno {
  document: Document
  ancho: number
  alto: number
  reducirMovimiento: boolean
  ultimoClic: UltimoClic | null
  ahora: () => number
  esperar: (fn: () => void, ms: number) => unknown
}

/** El botón del Perfil que se ve: el de más área dentro de la pantalla (null si no hay ninguno). */
export function botonDelPerfil(documento: Document, ancho: number, alto: number): { elemento: HTMLElement; caja: Caja } | null {
  let mejor: { elemento: HTMLElement; caja: Caja } | null = null
  let mejorArea = 0
  for (const elemento of Array.from(documento.querySelectorAll<HTMLElement>(`[${ATRIBUTO_BOTON_PERFIL}]`))) {
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

/** ¿Está el botón tapado por una hoja? La regla es la de `precioVuela.ts` (`estaTapado`), la misma que usa la pastilla del precio con la cartera. */
export function estaTapado(documento: Document, boton: { elemento: HTMLElement; caja: Caja }): boolean {
  return estaTapadoElemento(documento, boton.elemento, boton.caja)
}

/** El saltito del botón del Perfil. */
export function saltito(boton: HTMLElement): void {
  boton.setAttribute('data-perfil-salto', '')
  const animacion = boton.animate?.(
    [
      { transform: 'translateY(0) scale(1)', offset: 0 },
      { transform: 'translateY(-5px) scale(1.2)', offset: 0.4 },
      { transform: 'translateY(0) scale(0.96)', offset: 0.7 },
      { transform: 'translateY(0) scale(1)', offset: 1 },
    ],
    { duration: DURACION_SALTO_MS, easing: 'ease-out' },
  )
  const fin = () => boton.removeAttribute('data-perfil-salto')
  if (animacion) animacion.onfinish = fin
  else fin()
}

function miniatura(documento: Document, url: string): HTMLElement {
  const el = documento.createElement('img')
  el.src = url
  el.alt = ''
  el.setAttribute('aria-hidden', 'true')
  el.setAttribute('data-foto-vuela', '')
  el.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483000;pointer-events:none;width:56px;height:56px;object-fit:cover;border-radius:14px;border:2px solid #FFFDF8;box-shadow:0 4px 14px rgba(0,0,0,0.3);will-change:transform,opacity'
  return el
}

/**
 * Lanza el vuelo de UNA foto con el botón ya a la vista y destapado: la miniatura sale del último clic, vuela al botón del Perfil (≈ 0,8 s, encogiéndose y desvaneciéndose) y el botón da su saltito al llegar.
 * Con «reducir movimiento»: ni miniatura ni vuelo, solo el saltito.
 */
export function volar(url: string, boton: { elemento: HTMLElement; caja: Caja }, entorno: Entorno): void {
  if (entorno.reducirMovimiento) {
    saltito(boton.elemento)
    return
  }
  const { document: documento, ancho, alto } = entorno
  const salida = puntoDeSalida(entorno.ultimoClic, entorno.ahora(), ancho, alto)
  const destino = { x: boton.caja.left + boton.caja.width / 2, y: boton.caja.top + boton.caja.height / 2 }
  const el = miniatura(documento, url)
  documento.body.appendChild(el)
  const en = (p: { x: number; y: number }, escala: number) => `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) scale(${escala})`
  const animacion = el.animate(
    [
      { transform: en(salida, 0.6), opacity: 0, offset: 0 },
      { transform: en(salida, 1), opacity: 1, offset: 0.15 },
      { transform: en(salida, 1), opacity: 1, offset: 0.3 },
      { transform: en(destino, 0.15), opacity: 0, offset: 1 },
    ],
    { duration: DURACION_VUELO_MS, easing: 'ease-in-out', fill: 'forwards' },
  )
  animacion.onfinish = () => {
    el.remove()
    saltito(boton.elemento)
  }
}

/**
 * Una foto añadida. Si el botón del Perfil se ve y está libre, vuela ya. Si está tapado por una hoja, espera (mirando cada 250 ms) a que se cierre y entonces vuela. Si no hay botón en pantalla, tampoco
 * hay a dónde volar: espera igual (puede que la cabecera aún no esté). Pasados 5 minutos, se rinde. `soltar` se llama siempre al terminar (para liberar la URL local de la miniatura).
 * Devuelve una función que cancela la espera.
 */
export function lanzarFoto(url: string, entorno: Entorno, soltar: () => void, retraso = 0): () => void {
  let cancelado = false
  let esperado = 0
  let escalonada = false
  const intentar = () => {
    if (cancelado) return
    const boton = botonDelPerfil(entorno.document, entorno.ancho, entorno.alto)
    if (boton && !estaTapado(entorno.document, boton)) {
      // El desfase entre fotos seguidas se aplica cuando el botón ya está libre (si no, todas saldrían a la vez al cerrarse la hoja).
      if (!escalonada) {
        escalonada = true
        if (retraso > 0) {
          entorno.esperar(intentar, retraso)
          return
        }
      }
      volar(url, boton, entorno)
      // La URL local se suelta cuando la miniatura ya no se necesita (acabado el vuelo).
      entorno.esperar(soltar, DURACION_VUELO_MS + 200)
      return
    }
    esperado += SONDEO_TAPADO_MS
    if (esperado >= ESPERA_MAXIMA_MS) {
      soltar()
      return
    }
    entorno.esperar(intentar, SONDEO_TAPADO_MS)
  }
  intentar()
  return () => {
    cancelado = true
    soltar()
  }
}

/** Cuántas fotos hay ahora mismo esperando o volando; con más del máximo, las demás no vuelan. */
export function crearCola(maximo = MAXIMO_VUELOS_A_LA_VEZ) {
  let enCurso = 0
  return {
    /** Pide un hueco: devuelve cuánto retraso lleva (desfase escalonado) o null si ya no caben. */
    pedir(): number | null {
      if (enCurso >= maximo) return null
      const retraso = enCurso * DESFASE_MS
      enCurso++
      return retraso
    },
    liberar() {
      enCurso = Math.max(0, enCurso - 1)
    },
    get enCurso() {
      return enCurso
    },
  }
}
