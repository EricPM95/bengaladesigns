import { plantilla as plantillaDeDesign } from './gen/Pase_Pelicula'
import { FILAS_OCULTAS, LISTA_DEL_PASE, TEXTOS_DE_LINEA, partesDeLinea } from '../../../lib/listaAjustada'
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
  // (en el diseño de ahora [Saltar] es un span dentro de la barra de arriba, junto a [Ver])
  recorre(movil, (n) => {
    if (n.i !== '{{ !s7 }}' && n.c?.some((h) => esNodo(h) && h.a?.onClick === '{{ skip }}')) n.c = n.c.map((h) => (esNodo(h) && h.a?.onClick === '{{ skip }}' ? { i: '{{ !s7 }}', c: [h] } : h))
  })
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

  ajustarAlMovil(ast)
  ajustarLaLista(ast)

  cache.set(destino, ast)
  return ast
}

/** Los bloques de «Todo lo que incluye»: los grupos de la lista del final, con el nombre y la línea de cada fila. */
export const bloquesDeLaLista = () => LISTA_DEL_PASE.map((g) => ({ t: g.titulo, items: g.items.map((i) => ({ titulo: i.titulo, linea: i.linea, partes: partesDeLinea(i.linea).map((p) => ({ t: p.t, dm: p.marca ? '1' : undefined, estilo: p.marca ? 'color:#6F4E37;font-weight:600' : '' })) })) }))

/**
 * A TODO EL ANCHO DEL MÓVIL (Tanda 10P, 1.2). Design hace la película en 390 x 844 fijos. Aquí el escenario tiene el ancho y el alto REALES del móvil (`W` x `H`, ya divididos por la escala): las escenas 0-6 siguen siendo de 390 centradas
 * (`--dx`) sobre el mismo fondo oscuro, sin marcos negros, y el final (escena 7) se estira a todo el escenario: la lista llena el alto y la parte fija de abajo va pegada al borde de abajo.
 */
function ajustarAlMovil(ast: Nodo[]) {
  const caja = ast[0]
  caja.a = { ...caja.a, style: caja.a!.style.replace('width:390px', 'width:{{ W }}px') }
  const movil = caja.c![0] as Nodo
  movil.a = { ...movil.a, style: movil.a!.style.replace('width:390px;height:844px;border-radius:44px', 'width:{{ W }}px;height:{{ H }}px;--dx:{{ dx }}px;border-radius:0') }
  // Las escenas 0-6: 390 de ancho, centradas.
  for (const h of movil.c!) {
    if (!esNodo(h) || !h.i || !/^{{ s[0-6] }}$/.test(h.i)) continue
    const dentro = h.c![0] as Nodo
    if (dentro.a?.style?.startsWith('position:absolute;inset:0')) dentro.a = { ...dentro.a, style: dentro.a.style.replace('position:absolute;inset:0', 'position:absolute;top:0;bottom:0;left:var(--dx,0px);width:390px') }
  }
  ajustarTextosYEscena0(movil)
  // [Ver] / [Saltar] y el ✕ del final: la barra de arriba deja sitio al ✕ (si no, [Ver] se pone encima).
  recorre(movil, (n) => {
    if (n.a?.style?.startsWith('position:absolute;left:18px;right:18px;top:66px;display:flex;justify-content:flex-end')) n.a = { ...n.a, style: n.a.style.replace('right:18px', 'right:{{ barR }}px'), 'data-barra-superior': '1' }
    if (n.a?.['data-pelicula-cerrar']) n.a = { ...n.a, style: n.a.style.replace('top:60px', 'top:63px') }
    if (n.a?.onClick === '{{ again }}') n.a = { ...n.a, 'data-pelicula-ver': '1', role: 'button' }
    if (n.a?.onClick === '{{ skip }}') n.a = { ...n.a, 'data-pelicula-saltar': '1', role: 'button' }
  })
  // Las zonas de toque (atrás / adelante) tapan el final: en el final no hay nada que pasar y la lista tiene que dejarse tocar y mover.
}

/**
 * LA APERTURA MÁS GRANDE Y CON LOS TEXTOS MÁS ARRIBA (Tanda 10N3, 3b.1). Design pone los textos de abajo en `top:650px` (de 844) y el mapa y las tarjetas de la escena 0 en 342 de ancho: en un móvil de 390 x 664 (con la barra de Safari)
 * los textos quedaban cortados por abajo y el mapa y las tarjetas con mucho hueco a los lados. Aquí:
 *   · los textos de abajo (escenas 0, 1, 3, 4, 5, 6) salen de `tTop` (lo calcula PeliculaPase según el alto que hay: pegados a la última tarjeta, con una separación clara, y sin bajar del borde de abajo) en vez de `650px`;
 *   · la escena 0 ocupa todo el ancho del escenario: el mapa, las filas de llegada/salida y las tarjetas de las paradas se ensanchan a `wm` (ancho - 28, un margen de 14 a cada lado); lo que no se puede estirar sin deformarse
 *     (la ruta con sus pines, el desgarro y las tiras de colores) se queda de su tamaño, centrado en el mapa. El 342 de ancho no se toca en ninguna otra escena.
 */
function ajustarTextosYEscena0(movil: Nodo) {
  recorre(movil, (n) => {
    const st = n.a?.style
    if (!st) return
    if (st.includes('top:650px;height:190px;display:flex;flex-direction:column;align-items:center;justify-content:center;')) {
      n.a = { ...n.a, 'data-texto-abajo': '1', style: st.replace('top:650px;height:190px;', 'top:{{ tTop }}px;height:auto;').replace('justify-content:center;', 'justify-content:flex-start;') }
    }
    // El hueco de las frases que van cambiando (84): tres líneas caben en 66.
    if (st === 'position:relative;width:100%;height:84px') n.a = { ...n.a, style: 'position:relative;width:100%;height:66px' }
  })
  // La escena 3 (el emblema secreto): centrada como las demás (antes se quedaba pegada a la izquierda), el emblema 32 más arriba para que su borde de abajo no toque el texto, y el aviso de abajo pegado al texto.
  const eff = movil.c!.find((h) => esNodo(h) && h.i === '{{ effS }}') as Nodo | undefined
  if (eff) {
    const d = eff.c![0] as Nodo
    d.a = { ...d.a, style: d.a!.style.replace('position:absolute;inset:0', 'position:absolute;top:0;bottom:0;left:var(--dx,0px);width:390px') }
    recorre(d, (n) => {
      const st = n.a?.style
      if (!st) return
      if (st === 'position:absolute;left:0;right:0;top:100px') n.a = { ...n.a, style: 'position:absolute;left:0;right:0;top:68px' }
      else if (st.startsWith('position:absolute;left:173px;top:452px;')) n.a = { ...n.a, style: st.replace('top:452px;', 'top:420px;') }
      else if (st.startsWith('position:absolute;left:36px;right:36px;top:762px;')) n.a = { ...n.a, style: st.replace('top:762px;', 'top:{{ tToast }}px;') }
    })
  }
  // Las escenas 1 (HOY) y 5 (el pasaporte) llegan hasta y = 630 (el texto empieza en 608): se recogen un 7 % y 16 hacia arriba, todo junto, sin deformar nada.
  for (const id of ['{{ s1 }}', '{{ s5 }}']) {
    const esc = movil.c!.find((h) => esNodo(h) && h.i === id) as Nodo | undefined
    const d = esc?.c?.[0] as Nodo | undefined
    if (!d?.c) continue
    const texto = (h: Nodo | string) => esNodo(h) && h.a?.['data-texto-abajo'] === '1'
    d.c = [{ t: 'div', a: { 'data-visual-recogido': '1', style: 'position:absolute;inset:0;transform-origin:50% 0;transform:translateY(-16px) scale(0.93)' }, c: d.c.filter((h) => !texto(h)) }, ...d.c.filter(texto)]
  }
  const s0 = movil.c!.find((h) => esNodo(h) && h.i === '{{ s0 }}') as Nodo | undefined
  if (!s0) return
  const dentro = s0.c![0] as Nodo
  dentro.a = { ...dentro.a, style: dentro.a!.style.replace(/position:absolute;top:0;bottom:0;left:var\(--dx,0px\);width:390px/, 'position:absolute;top:0;bottom:0;left:0;width:{{ W }}px') }
  const mapa = (n: Nodo) => n.t === 'div' && Boolean(n.a?.style?.startsWith('position:absolute;left:24px;top:108px;width:342px;height:190px;overflow:hidden'))
  recorre(dentro, (n) => {
    const st = n.a?.style
    if (!st) return
    if (n.t === 'div' && /^position:absolute;left:24px;top:\d+px;width:342px;/.test(st)) {
      n.a = { ...n.a, style: st.replace('left:24px;', 'left:14px;').replace('width:342px;', 'width:{{ wm }}px;') }
      if (mapa(n)) {
        // El mapa: el fondo se estira; la ruta y sus pines (342 x 190) quedan centrados, y los botones [+ Vuelo] y [+ Alojamiento] siguen pegados a la derecha.
        const fondo: (Nodo | string)[] = []
        const dentroDelMapa: (Nodo | string)[] = []
        const botones: (Nodo | string)[] = []
        for (const h of n.c ?? []) {
          const hs = esNodo(h) ? (h.a?.style ?? '') : ''
          if (esNodo(h) && h.t === 'span' && /^position:absolute;inset:0;background:/.test(hs)) fondo.push(h)
          else if (esNodo(h) && /^position:absolute;right:(12|96)px;top:12px;height:30px;/.test(hs)) botones.push(h)
          else dentroDelMapa.push(h)
        }
        n.c = [...fondo, { t: 'div', a: { style: 'position:absolute;left:{{ mi }}px;top:0;width:342px;height:190px' }, c: dentroDelMapa }, ...botones]
      }
      return
    }
    // El desgarro (svg de 342 x 42) y las tiras de colores: de su tamaño, centrados en el ancho de ahora.
    if ((n.t === 'svg' || n.t === 'span') && /^position:absolute;left:(-?[\d.]+)px;top:\d+px;/.test(st) && (n.t === 'svg' || st.includes('clip-path'))) {
      const m = /^position:absolute;left:(-?[\d.]+)px;/.exec(st)!
      const desde = Number(m[1])
      if (desde >= 24 && desde <= 340) n.a = { ...n.a, style: st.replace(`left:${m[1]}px;`, `left:calc({{ xc }}px + ${(desde - 24).toFixed(1)}px);`) }
    }
  })
}

/**
 * LA LISTA DEL FINAL (Tanda 10P, 1.2 y 1.4). Con scroll de verdad en el móvil (se mueve con el dedo, sin que lo tape la parte fija de abajo) y SIN las filas que aún no existen (data/pase/lista_ajustes.json). La línea de
 * «Invita a un amigo» y la «Todo lo que incluye» llevan «HOY» en oro.
 */
function ajustarLaLista(ast: Nodo[]) {
  const movil = ast[0].c![0] as Nodo
  const final = movil.c!.find((h) => esNodo(h) && h.i === '{{ s7 }}') as Nodo
  const fondo = final.c![0] as Nodo
  fondo.c!.forEach((h, k) => {
    if (!esNodo(h) || !h.a?.style) return
    const st = h.a.style
    if (h.a.ref === '{{ listRef }}') {
      // El alto es el que quede: de 196 px hasta abajo. Debajo, sitio de sobra para que la última fila suba por encima de la parte fija.
      h.a = { ...h.a, 'data-lista-pase': '1', style: st.replace('top:196px;height:496px', 'top:196px;bottom:0').replace('padding:6px 6px 40px', 'padding:6px 6px 270px') + ';touch-action:pan-y;overscroll-behavior:contain;-webkit-overflow-scrolling:touch' }
      h.c = (h.c ?? []).filter((fila) => {
        if (!esNodo(fila)) return true
        const par = buscaPar(fila)
        return !(par && FILAS_OCULTAS.includes(textoDe(par.c![0])))
      })
      for (const fila of h.c) {
        if (!esNodo(fila)) continue
        const par = buscaPar(fila)
        const nuevo = par && TEXTOS_DE_LINEA[textoDe(par.c![0])]
        if (par && nuevo) {
          const molde = (par.c![1] as Nodo).a!
          par.c![1] = { t: 'span', a: molde, c: partesDeLinea(nuevo).map((p) => (p.marca ? { t: 'span', a: { 'data-marca': '1', style: 'color:#F3D88F;font-weight:700' }, c: [p.t] } : p.t)) }
        }
      }
    }
    // El degradado de abajo no se come los toques; la parte fija de abajo sí los recibe (los botones) pero se queda por encima de la lista.
    if (st.startsWith('position:absolute;left:0;right:0;bottom:0;height:290px')) h.a = { ...h.a, style: st + ';pointer-events:none' }
    void k
  })
  // «Todo lo que incluye»: la línea con «HOY» en oro (la hoja es clara: el oro profundo).
  recorre(ast[0], (n) => {
    if (n.t === 'span' && n.c?.length === 1 && n.c[0] === '{{ k.linea }}') {
      n.c = [{ f: '{{ k.partes }}', as: 'pt', c: [{ t: 'span', a: { 'data-marca': '{{ pt.dm }}', style: '{{ pt.estilo }}' }, c: ['{{ pt.t }}'] }] }]
    }
  })
}
/** El par «título + línea» de una fila de la lista del final (dos spans seguidos), o null (los títulos de grupo no lo tienen). */
function buscaPar(fila: Nodo): Nodo | null {
  let res: Nodo | null = null
  recorre(fila, (n) => {
    if (!res && n.t === 'span' && (n.c ?? []).length === 2 && (n.c ?? []).every((x) => esNodo(x) && x.t === 'span')) res = n
  })
  return res
}
