import { useEffect, useSyncExternalStore } from 'react'
import { useRouteStore } from '../../store/useRouteStore'

/**
 * LOS BOTONES FLOTANTES (Tanda 10N4 §0b): el lápiz de la propuesta y el botón de los logros se ven en TODAS las pantallas del viaje (RUTA, DÍAS, EXPLORAR también
 * a pantalla completa, las fichas, RESERVAS, el presupuesto, HOY…). Un solo sitio decide dos cosas:
 *
 *  1. SI SE VEN O SE QUEDAN DEBAJO. Solo se quedan debajo (`debajo`) mientras haya una HOJA o una ventana abierta que los taparía mal: cualquier `role="dialog"`
 *     que no sea una pantalla entera marcada con `data-flotantes` (EXPLORAR a pantalla completa, el presupuesto, las cuentas, el alojamiento…), los `alertdialog`,
 *     `[data-hoja]` y el `Modal`. En cuanto se cierra, vuelven.
 *  2. CUÁNTO SUBEN para no tapar los botones de abajo de la pantalla en la que están (`alto`): HOY ya marcaba los suyos; cualquier pantalla marca los suyos con
 *     `data-evitar-flotantes` (el botón, o el contenedor de los botones, que no se tape).
 *
 * Una pantalla entera nueva que deba llevar los botones encima solo tiene que llevar `data-flotantes`. Las que no lo llevan los esconden (Perfil, Ajustes, películas…).
 */
const HOJAS = '[role="dialog"]:not([data-flotantes]), [role="alertdialog"], [data-hoja], .map-cover-overlay.items-end'
const BOTONES_A_ESQUIVAR = '[data-hoy-siguiente] button, [data-hoy-siguiente] a, [data-hoy-llegada-tarde] button, [data-hoy-todo-visto] button, [data-hoy-llegada] button, [data-escuchar-barra], [data-evitar-flotantes]'
/** Lo que sube el lápiz sobre el botón de los logros (58 px de botón + 12 de aire). */
export const SOBRE_LOS_LOGROS = 70
const LADO = 58
/** (10S5) Lo que mide el lápiz y el aire que se deja entre el último contenido y los botones flotantes. */
export const LADO_DEL_LAPIZ = 56
export const AIRE_BAJO_LOS_BOTONES = 16

interface Estado {
  debajo: boolean
  /** `bottom` en px del botón de los logros cuando hay que subirlo para no tapar nada; null = su sitio de siempre. */
  alto: number | null
  /** (10S5) El `bottom` en px del botón de los logros AHORA (con la barra de abajo del móvil y lo que haya subido por los botones de la pantalla): de ahí sale el hueco que cada pantalla deja al final. */
  suelo: number
}
let estado: Estado = { debajo: false, alto: null, suelo: 88 }
let hayLapiz = false
const oyentes = new Set<() => void>()
const avisar = () => oyentes.forEach((f) => f())
const poner = (e: Estado) => {
  if (e.debajo === estado.debajo && e.alto === estado.alto && Math.abs(e.suelo - estado.suelo) < 1) return
  estado = e
  avisar()
}

function visible(e: Element): boolean {
  const el = e as HTMLElement
  if (el.getClientRects().length === 0) return false
  // (Tanda 10N10 §2a) Una hoja que sigue en el árbol pero no se ve (invisible, transparente o fuera de la pantalla) NO esconde los botones flotantes: antes bastaba con que existiera.
  const r = el.getBoundingClientRect()
  if (r.width === 0 || r.height === 0 || r.bottom <= 0 || r.top >= window.innerHeight || r.right <= 0 || r.left >= window.innerWidth) return false
  const c = getComputedStyle(el)
  return c.visibility !== 'hidden' && c.display !== 'none' && Number(c.opacity) > 0.02
}

function medir(): void {
  if (typeof document === 'undefined') return
  const debajo = Array.from(document.querySelectorAll(HOJAS)).some(visible)
  const modo = useRouteStore.getState().mode
  const base = modo === 'today' ? 120 : 88
  const vh = window.innerHeight
  const sonda = document.createElement('div')
  sonda.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom,0px)'
  document.body.appendChild(sonda)
  const safe = parseFloat(getComputedStyle(sonda).paddingBottom) || 0
  sonda.remove()
  // Solo se esquivan los botones de la pantalla que está a la vista (no los que quedan tapados debajo de una pantalla entera).
  const botones = Array.from(document.querySelectorAll(BOTONES_A_ESQUIVAR))
    .filter(visible)
    .map((e) => e.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.height > 0)
  const lado = LADO + (hayLapiz ? SOBRE_LOS_LOGROS : 0)
  let bottom = base + safe
  const inicio = bottom
  for (let i = 0; i < 3; i++) {
    const arriba = vh - bottom - lado
    const abajo = vh - bottom
    const pisan = botones.filter((r) => r.bottom > arriba - 6 && r.top < abajo + 6 && r.right > window.innerWidth - 15 - LADO - 6)
    if (pisan.length === 0) break
    bottom = vh - Math.min(...pisan.map((r) => r.top)) + 10
  }
  const nuevo = bottom === inicio ? null : bottom
  poner({ debajo, alto: estado.alto !== null && nuevo !== null && Math.abs(estado.alto - nuevo) < 1 ? estado.alto : nuevo, suelo: Math.round(bottom) })
}

let cuadro = 0
const pedir = () => {
  if (!cuadro) cuadro = window.requestAnimationFrame(() => {
    cuadro = 0
    medir()
  })
}
let observador: MutationObserver | null = null
let reloj = 0
function encender() {
  if (observador || typeof document === 'undefined') return
  observador = new MutationObserver(pedir)
  observador.observe(document.body, { childList: true, subtree: true })
  reloj = window.setInterval(pedir, 500)
  window.addEventListener('scroll', pedir, true)
  window.addEventListener('resize', pedir)
  medir()
}
function apagar() {
  if (!observador) return
  observador.disconnect()
  observador = null
  window.clearInterval(reloj)
  window.removeEventListener('scroll', pedir, true)
  window.removeEventListener('resize', pedir)
}

function suscribir(f: () => void): () => void {
  oyentes.add(f)
  encender()
  return () => {
    oyentes.delete(f)
    if (oyentes.size === 0) apagar()
  }
}

/** Estado de los botones flotantes: si se quedan debajo de una hoja y cuánto suben. Lo leen el lápiz y el botón de los logros. */
export function useFlotantes(): Estado {
  return useSyncExternalStore(suscribir, () => estado, () => estado)
}

/** El lápiz avisa de si está a la vista (para esquivar también su sitio). */
export function useLapizALaVista(visibleAhora: boolean): void {
  useEffect(() => {
    if (hayLapiz === visibleAhora) return undefined
    hayLapiz = visibleAhora
    pedir()
    return () => {
      hayLapiz = false
      pedir()
    }
  }, [visibleAhora])
}
