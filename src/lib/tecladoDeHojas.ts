/**
 * (V81, §3) El teclado del iPhone y las hojas con un campo de texto: UNA sola pieza para todas (`Hoja`, `HojaOpciones`, `HojaAbajo`, `HojaV2`, `HojaDeHora`, `Cuentanos`…: toda hoja es un `[role=dialog][aria-modal=true]`).
 * Safari de iOS no encoge la pantalla al sacar el teclado: solo encoge la «vista visible» (`window.visualViewport`), y una hoja pegada abajo (`position: fixed; bottom: 0`) queda DETRÁS del teclado.
 * Mientras un campo de texto tiene el foco y la vista visible es bastante más baja que la ventana (teclado abierto):
 *   · `<html data-teclado>` + `--vv-top` / `--vv-bottom`: la regla de `src/index.css` coloca la hoja justo en la vista visible (encima del teclado);
 *   · el panel de la hoja se queda con el alto que tenía al ponerse el foco (alto mínimo estable): filtrar una lista no lo encoge (la lista se desliza dentro) y, si no cabe, se limita al 92 % de lo que se ve;
 *   · el campo con el foco se desliza hasta verse.
 * Sin `visualViewport` (escritorio antiguo) o sin teclado, no hace nada. Sin consultas a Supabase: solo eventos del navegador (cada cambio de la vista visible; sin bucles).
 */
let instalado = false

const SIN_TECLADO = new Set(['checkbox', 'radio', 'button', 'submit', 'range', 'file', 'color', 'image', 'reset'])

function campoDeTexto(a: Element | null): a is HTMLElement {
  if (!a) return false
  if (a.tagName === 'TEXTAREA') return true
  if (a.tagName === 'INPUT') return !SIN_TECLADO.has((a as HTMLInputElement).type)
  return (a as HTMLElement).isContentEditable === true
}

export function instalarTecladoDeHojas(): void {
  if (instalado || typeof window === 'undefined') return
  const vv = window.visualViewport
  if (!vv) return
  instalado = true
  const raiz = document.documentElement
  /** El alto que tenía cada panel antes de sacar el teclado. */
  const altos = new Map<HTMLElement, number>()
  let abierto = false

  /** El panel de la hoja de ENCIMA (la última abierta): las de debajo no se tocan. */
  const paneles = (): HTMLElement[] => {
    const d = Array.from(document.querySelectorAll<HTMLElement>("[role='dialog'][aria-modal='true']"))
    const p = d.length ? (d[d.length - 1].lastElementChild as HTMLElement | null) : null
    return p ? [p] : []
  }

  const recordar = () => {
    for (const p of paneles()) if (!altos.has(p)) altos.set(p, p.offsetHeight)
  }

  const cerrar = () => {
    if (!abierto) return
    abierto = false
    raiz.removeAttribute('data-teclado')
    raiz.style.removeProperty('--vv-top')
    raiz.style.removeProperty('--vv-bottom')
    for (const p of altos.keys()) {
      p.style.removeProperty('min-height')
      p.style.removeProperty('max-height')
    }
    altos.clear()
  }

  const medir = () => {
    const tapado = window.innerHeight - vv.height
    const hayTeclado = tapado > 120 && vv.scale < 1.05 && campoDeTexto(document.activeElement)
    if (!hayTeclado) {
      cerrar()
      return
    }
    const arriba = Math.max(0, Math.round(vv.offsetTop))
    const abajo = Math.max(0, Math.round(window.innerHeight - vv.offsetTop - vv.height))
    if (!abierto) recordar() // por si la hoja salió con el teclado ya abierto (el alto que tiene ahora)
    abierto = true
    raiz.setAttribute('data-teclado', '1')
    raiz.style.setProperty('--vv-top', `${arriba}px`)
    raiz.style.setProperty('--vv-bottom', `${abajo}px`)
    const tope = Math.floor(vv.height * 0.92)
    for (const p of paneles()) {
      if (!altos.has(p)) altos.set(p, p.offsetHeight)
      p.style.setProperty('max-height', `${tope}px`, 'important')
      p.style.setProperty('min-height', `${Math.min(altos.get(p) ?? 0, tope)}px`, 'important')
    }
    const a = document.activeElement
    if (a && typeof (a as HTMLElement).scrollIntoView === 'function') window.requestAnimationFrame(() => (a as HTMLElement).scrollIntoView({ block: 'nearest' }))
  }

  document.addEventListener('focusin', () => {
    if (!abierto) recordar()
    medir()
  })
  document.addEventListener('focusout', () => window.setTimeout(medir, 60))
  vv.addEventListener('resize', medir)
  vv.addEventListener('scroll', medir)
}
