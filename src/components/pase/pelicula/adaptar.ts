import { plantilla as plantillaDeDesign } from './gen/Pase_Pelicula'
import { LISTA_DEL_PASE } from '../../../lib/listaDelPase'
import { nombreDelPase } from '../../../lib/nombrePase'

/**
 * LA PELÍCULA DE DESIGN, PUESTA EN LA APP (Tanda 10I). Los textos y las animaciones son los del archivo de Design, sin tocar. Aquí solo se cambia lo que tiene que ser de la app:
 *   · una sola película para todos los destinos: solo cambian dos textos y salen del dato del destino: «Pase de {Destino}» (el nombre grande del final, «✓ Tu Pase de … está activo» y la línea de la hoja)
 *     y «Tu viaje a {Destino}» (la tarjeta de la escena 6). Todo lo demás se queda de Roma, como ejemplo;
 *   · se quita lo que Design pone FUERA del móvil para verla en el escritorio («Repetir animación»);
 *   · la hoja «Todo lo que incluye» enseña la lista del final (nombre y línea de cada fila: `LISTA_DEL_PASE`);
 *   · [Comprar] hace lo de siempre (crear el pago), y un botón de cerrar (✕) en el final.
 */
type Nodo = { t?: string; a?: Record<string, string>; c?: (Nodo | string)[]; i?: string; f?: string; as?: string; imp?: string; s?: string | null }

const esNodo = (n: Nodo | string): n is Nodo => typeof n !== 'string'
function recorre(n: Nodo | string, f: (n: Nodo) => void) {
  if (!esNodo(n)) return
  f(n)
  for (const h of n.c ?? []) recorre(h, f)
}
const textoDe = (n: Nodo | string): string => (typeof n === 'string' ? n : (n.c ?? []).map(textoDe).join(''))

const cache = new Map<string, Nodo[]>()

export function plantillaDeLaPelicula(destino: string): Nodo[] {
  const hit = cache.get(destino)
  if (hit) return hit
  const ast = structuredClone(plantillaDeDesign) as Nodo[]
  const pase = nombreDelPase(destino)

  recorre(ast[0], (n) => {
    const hijos = n.c
    if (!hijos) return
    // El nombre grande del final, letra a letra («Pase de Roma»): se vuelve a escribir con el nombre del pase de este destino, con la misma entrada de cada letra.
    if (hijos.length >= 8 && hijos.every((h) => esNodo(h) && h.t === 'span' && (h.c ?? []).length === 1 && typeof h.c![0] === 'string' && (h.c![0] as string).length === 1) && hijos.map(textoDe).join('') === 'Pase de Roma') {
      const molde = (hijos[0] as Nodo).a!.style
      n.c = Array.from(pase).map((letra, k) => ({ t: 'span', a: { style: molde.replace(/(pfWord \.6s )[\d.]+s/, `$1${(3.2 + 0.06 * k).toFixed(2)}s`) }, c: [letra] }))
      return
    }
    hijos.forEach((h, k) => {
      if (typeof h !== 'string') return
      if (h === 'TU VIAJE A ROMA') hijos[k] = `TU VIAJE A ${destino.toUpperCase()}`
      else if (h === '✓ Tu Pase de Roma está activo') hijos[k] = `✓ Tu ${pase} está activo`
      else if (h === 'Pase de Roma · se paga una vez y no caduca') hijos[k] = `${pase} · se paga una vez y no caduca`
    })
  })

  // Fuera lo que Design pone fuera del móvil (el botón «Repetir animación» de debajo).
  const caja = ast[0]
  caja.c = (caja.c ?? []).slice(0, 1)

  // La línea legal de antes de [Comprar] (la escribe el gestor, data/pase/textos.json; Design no la tiene) y [Comprar · 10,99 €] (en Design es solo el dibujo del botón): hace lo de siempre.
  recorre(ast[0], (n) => {
    const k = (n.c ?? []).findIndex((h) => esNodo(h) && h.t === 'span' && (h.c ?? []).length === 1 && h.c![0] === '{{ buyTxt }}')
    if (k >= 0) {
      n.c!.splice(k, 0, {
        i: '{{ lineaLegal }}',
        c: [{ t: 'p', a: { 'data-linea-legal': '1', style: "margin:0;padding:7px 10px;border-radius:10px;background:rgba(28,34,48,.05);font:400 11.5px/1.4 'Geist';color:rgba(28,34,48,.7)" }, c: ['{{ lineaLegal }}'] }],
      })
    }
    if (n.t === 'span' && (n.c ?? []).length === 1 && n.c![0] === '{{ buyTxt }}') {
      n.a = { ...n.a, onClick: '{{ comprar }}', 'data-comprar': '1', role: 'button' }
      n.a.style = `${n.a.style};cursor:pointer`
    }
  })

  // «Todo lo que incluye»: cada fila con su nombre y su línea (la lista del final), no solo una frase.
  recorre(ast[0], (n) => {
    if (n.f === '{{ bl.items }}') {
      const fila = n.c![0] as Nodo
      const texto = fila.c![fila.c!.length - 1] as Nodo
      fila.c![fila.c!.length - 1] = {
        t: 'span',
        a: { style: 'display:flex;flex-direction:column;gap:1px;min-width:0' },
        c: [
          { t: 'span', a: { style: "font:600 14px/1.3 'Geist'" }, c: ['{{ k.titulo }}'] },
          { t: 'span', a: { style: "font:400 12.5px/1.35 'Geist';color:rgba(28,34,48,.62);display:block" }, c: ['{{ k.linea }}'] },
        ],
      }
      void texto
    }
  })

  // El ✕ del final (Design no lo tiene: era una página de escritorio). Fino y claro, sin relleno. En el final [Saltar] ya no sirve y deja su sitio al ✕.
  const movil = ast[0].c![0] as Nodo
  movil.c = movil.c!.map((h) => (esNodo(h) && h.t === 'div' && textoDe(h).trim() === 'Saltar' ? { i: '{{ !s7 }}', c: [h] } : h))
  movil.c!.push({
    i: '{{ s7 }}',
    c: [
      {
        t: 'span',
        a: {
          onClick: '{{ cerrarApp }}',
          role: 'button',
          'aria-label': 'Cerrar',
          'data-pelicula-cerrar': '1',
          style: 'position:absolute;right:16px;top:60px;z-index:20;width:36px;height:36px;border-radius:50%;background:rgba(251,243,226,.12);display:flex;align-items:center;justify-content:center;cursor:pointer',
        },
        c: [
          {
            t: 'svg',
            a: { width: '16', height: '16', viewBox: '0 0 24 24', fill: 'none', stroke: '#FBF3E2', strokeWidth: '1.6', strokeLinecap: 'round', strokeLinejoin: 'round' },
            c: [{ t: 'path', a: { d: 'M6 6l12 12M18 6L6 18' }, c: [] }],
          },
        ],
      },
    ],
  })

  cache.set(destino, ast)
  return ast
}

/** Los bloques de «Todo lo que incluye»: los grupos de la lista del final, con el nombre y la línea de cada fila. */
export const bloquesDeLaLista = () => LISTA_DEL_PASE.map((g) => ({ t: g.titulo, items: g.items.map((i) => ({ titulo: i.titulo, linea: i.linea })) }))
