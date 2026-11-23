import { useEffect, useSyncExternalStore } from 'react'

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
 *  3. (10S9b, Eric 1-nov) SIEMPRE VISIBLES: no se esconden al bajar ni al subir el scroll (lo de la 10S9 se quitó): están quietos y, si tapan algo mientras se desplaza la pantalla, no importa. Lo que sí vale es la regla de la 10S5: al final de cada pantalla hay hueco debajo (`suelo`) para que el último contenido no quede bajo ellos.
 *
 * Una pantalla entera nueva que deba llevar los botones encima solo tiene que llevar `data-flotantes`. Las que no lo llevan los esconden (Perfil, Ajustes, películas…).
 */
const HOJAS = '[role="dialog"]:not([data-flotantes]), [role="alertdialog"], [data-hoja], .map-cover-overlay.items-end'
// (V2) HOY ya no esquiva: los flotantes se quedan quietos y HOY deja espacio libre al final para que con el scroll nada quede tapado.
const BOTONES_A_ESQUIVAR = '[data-evitar-flotantes]'
/** (V18, Design «Botones Flotantes» B1) Los botones flotantes (la cámara y el trofeo) son IGUALES: crema con aro dorado, 44 px; lo que sube el de encima es 44 de botón + 12 de aire. */
export const LADO_DE_LOS_FLOTANTES = 44
export const SOBRE_LOS_LOGROS = 56
const LADO = 44
export const ESTILO_FLOTANTE = {
  width: 44,
  height: 44,
  padding: 0,
  borderRadius: '50%',
  background: 'radial-gradient(circle at 32% 26%,#FFFFFF 0%,#FBF1DA 55%,#F0DEB0 100%)',
  border: '1.5px solid #C9A45A',
  boxShadow: '0 12px 22px -10px rgba(90,64,16,.55),0 2px 4px rgba(90,64,16,.18),inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 0 3px rgba(255,253,246,.9),inset 0 0 0 4px rgba(201,164,90,.35)',
  boxSizing: 'border-box',
  color: '#7A5A1E',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
} as const

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
/** (10S7) El botón «Reorganizar» del pase va en el mismo sitio que el lápiz (encima del de los logros): nunca están los dos (el lápiz es de quien solo recomienda; Reorganizar, de quien edita). */
let hayReorganizar = false
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
  const base = 88 // (V42) la misma altura en todas las pestañas (HOY ya no sube la columna)
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
  const lado = LADO // (V42 §6) los botones de la columna izquierda ya no apilan encima: la columna de la derecha no crece por ellos
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

/** (10S7) El botón «Reorganizar» avisa de si está a la vista (para esquivar también su sitio). */
export function useReorganizarALaVista(visibleAhora: boolean): void {
  useEffect(() => {
    if (hayReorganizar === visibleAhora) return undefined
    hayReorganizar = visibleAhora
    pedir()
    return () => {
      hayReorganizar = false
      pedir()
    }
  }, [visibleAhora])
}

// ── (V42 §6, Eric 23-nov) LA COLUMNA DE LA IZQUIERDA DE LOS BOTONES FLOTANTES ──────────────────────────────────────────────────────────────────────────────────────────────────
// REGLA PARA TODA LA APP (también en CLAUDE.md): la columna de la derecha es FIJA (Avisos, Cámara y Logros). Cualquier otro botón flotante (Reorganizar, el lápiz de la propuesta y los que vengan) va DEL MISMO TAMAÑO (44 px), EN UNA COLUMNA A SU IZQUIERDA:
// el primero a la izquierda de Logros, el segundo a la de la Cámara, el tercero a la de Avisos. Nunca uno encima de otro. El color no cambia (azul oscuro con dorado). Cada botón nuevo se apunta aquí en `ORDEN_IZQUIERDA` y usa `useColumnaIzquierda`.
/** El orden de los botones de la columna izquierda (el primero que esté a la vista ocupa el sitio de la izquierda de Logros). */
const ORDEN_IZQUIERDA = ['reorganizar', 'propuesta']
const izquierda = new Set<string>()
let versionIzquierda = 0
/** Lo que se aparta a la izquierda de la columna de la derecha: 44 de botón + 12 de aire entre columnas. */
export const DERECHA_DE_LA_COLUMNA_IZQUIERDA = 21 + LADO + 12

/**
 * Un botón flotante de la columna izquierda: dice si está a la vista y recibe su FILA (0 = a la izquierda de Logros, 1 = de la Cámara, 2 = de Avisos). Con `modo` y `alto` (de `useFlotantes`) sale el `bottom` (`bottomDeLaFila`).
 */
export function useColumnaIzquierda(clave: string, visibleAhora: boolean): number {
  useEffect(() => {
    if (!visibleAhora) return undefined
    izquierda.add(clave)
    versionIzquierda++
    avisar()
    return () => {
      izquierda.delete(clave)
      versionIzquierda++
      avisar()
    }
  }, [clave, visibleAhora])
  useSyncExternalStore(suscribir, () => versionIzquierda, () => versionIzquierda)
  const fila = ORDEN_IZQUIERDA.filter((c) => izquierda.has(c) || (c === clave && visibleAhora)).indexOf(clave)
  return Math.max(0, fila)
}

/** El `bottom` (CSS) de la fila `fila` de la columna: la misma altura que su vecino de la derecha (Logros en la fila 0, la Cámara en la 1, Avisos en la 2). */
export function bottomDeLaFila(fila: number, alto: number | null, _modo?: string): string {
  return alto !== null ? `${alto + fila * SOBRE_LOS_LOGROS}px` : `calc(env(safe-area-inset-bottom,0px) + ${88 + fila * SOBRE_LOS_LOGROS}px)`
}
