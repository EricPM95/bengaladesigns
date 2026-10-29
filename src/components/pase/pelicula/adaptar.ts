import { plantilla as plantillaDeDesign } from './gen/Pase_Pelicula'
import { FILAS_OCULTAS, LISTA_DEL_PASE, TEXTOS_DE_LINEA, TITULOS_NUEVOS, partesDeLinea } from '../../../lib/listaAjustada'
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
  const movil = palcoDe(ast)
  // ([Saltar] es un span dentro de la barra de arriba, junto a [Ver])
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

  // (Tanda 10N9, §4) Los textos de abajo de cada escena (los que entran con `fsSub`: la frase grande y la línea pequeña) llevan una marca, solo para las pruebas (`data-texto-abajo`): así se mide que no se pisan
  // con lo de arriba ni entre sí en 390 x 664 y 375 x 667. No cambia nada de lo que se ve.
  recorre(ast[0], (n) => {
    if (n.a?.style?.includes('animation:fsSub') && !n.a['data-texto-abajo']) n.a = { ...n.a, 'data-texto-abajo': '1' }
  })

  ajustarAlMovil(ast)
  ajustarLaCabecera(ast, destino)
  ajustarLaLista(ast)

  cache.set(destino, ast)
  return ast
}

/**
 * (Tanda 10N8, apartado 5) El escenario de Design: desde `Pase Pelicula Movil` la pieza se hace a pantalla completa (`pantalla="si"`): el fondo llena la pantalla entera y las escenas (390 x 844) van dentro de un
 * palco centrado y escalado a lo que cabe, SIN recuadros ni marcos. Aquí ya no se estira nada a mano: se deja tal cual lo dibuja Design y solo se cambia lo que tiene que ser de la app. El palco es el hijo del fondo.
 */
function palcoDe(ast: Nodo[]): Nodo {
  const fondo = ast[0].c![0] as Nodo
  const palco = (fondo.c ?? []).find((h) => esNodo(h) && h.a?.style === '{{ stBox }}') as Nodo | undefined
  if (!palco) throw new Error('Design ha cambiado el palco de la película ({{ stBox }}): revisa adaptar.ts')
  return palco
}

/** Los bloques de «Todo lo que incluye»: los grupos de la lista del final, con el nombre y la línea de cada fila. */
export const bloquesDeLaLista = () => LISTA_DEL_PASE.map((g) => ({ t: g.titulo, items: g.items.map((i) => ({ titulo: i.titulo, linea: i.linea, partes: partesDeLinea(i.linea).map((p) => ({ t: p.t, dm: p.marca ? '1' : undefined, estilo: p.marca ? 'color:#6F4E37;font-weight:600' : '' })) })) }))

/**
 * LA CABECERA DE TODAS LAS ESCENAS (Tanda 10N5, apartado 5; Tanda 10N9, apartado 3).
 *   · El título pequeño de Design («Todo lo que incluye tu Pase Roma», encima de las rayitas) va en la MISMA línea que [Saltar], centrado en medio (Eric, 26-oct), con el destino del pase; en el final no sale (allí van [Ver] y ✕).
 *     (10N9: en su sitio de Design, top 16, se pisa con el contenido de la escena «hoy» y rompe «ningún texto se pisa»; se queda en la línea de [Saltar]. Se marca con `data-pelicula-titulo`.)
 *   · Las rayitas de arriba (una por escena) se pueden tocar: llevan a esa escena y la vuelven a poner desde el principio, como las historias de Instagram. La zona de toque es más alta que la rayita (22 px) y la rayita se ve igual (3 px, a la misma altura).
 */
function ajustarLaCabecera(ast: Nodo[], destino: string) {
  const movil = palcoDe(ast)
  movil.c = movil.c!.map((h) => {
    if (!esNodo(h) || h.t !== 'div' || !h.a?.style?.startsWith('position:absolute;left:0;right:0;top:16px;text-align:center')) return h
    const titulo: Nodo = {
      ...h,
      a: { ...h.a, 'data-pelicula-titulo': '1', style: h.a.style.replace('top:16px;', 'top:66px;height:32px;display:flex;align-items:center;justify-content:center;white-space:nowrap;box-sizing:border-box;padding-right:{{ tPadR }}px;') },
      // (dentro de un span: en un contenedor flex el espacio de «tu » se perdería)
      c: [{ t: 'span', c: (h.c ?? []).map((x) => (esNodo(x) && x.t === 'em' ? { ...x, c: [`Pase ${destino}`] } : x)) }],
    }
    return { i: '{{ !s7 }}', c: [titulo] }
  })
  recorre(movil, (n) => {
    if (!n.a?.style?.startsWith('position:absolute;left:14px;right:14px;top:50px;display:flex;gap:4px')) return
    n.a = { ...n.a, 'data-rayitas': '1', style: n.a.style.replace('top:50px;', 'top:41px;') }
    const para = (n.c ?? [])[0] as Nodo
    const barra = (para.c ?? [])[0] as Nodo
    para.c = [
      {
        t: 'span',
        a: { onClick: '{{ g.ir }}', role: 'button', 'data-raya': '{{ g.k }}', 'aria-label': 'Ir a esta escena', style: 'flex:1;height:22px;display:flex;align-items:center;cursor:pointer;-webkit-tap-highlight-color:transparent' },
        c: [{ ...barra, a: { ...barra.a, style: barra.a!.style.replace('flex:1;', 'flex:1;width:100%;') } }],
      },
    ]
  })
}

/** LOS BOTONES DE ARRIBA ([Ver], [Saltar], el ✕ del final y el silencio de la música): se marcan para las pruebas y la barra deja sitio al ✕. La medida de la pantalla la lleva Design (`pantalla="si"`). */
function ajustarAlMovil(ast: Nodo[]) {
  const movil = palcoDe(ast)
  // [Ver] / [Saltar] y el ✕ del final: la barra de arriba deja sitio al ✕ (si no, [Ver] se pone encima).
  recorre(movil, (n) => {
    if (n.a?.style?.startsWith('position:absolute;left:18px;right:18px;top:66px;display:flex;justify-content:flex-end')) n.a = { ...n.a, style: n.a.style.replace('right:18px', 'right:{{ barR }}px'), 'data-barra-superior': '1' }
    if (n.a?.['data-pelicula-cerrar']) n.a = { ...n.a, style: n.a.style.replace('top:60px', 'top:63px') }
    if (n.a?.onClick === '{{ again }}') n.a = { ...n.a, 'data-pelicula-ver': '1', role: 'button' }
    if (n.a?.onClick === '{{ skip }}') n.a = { ...n.a, 'data-pelicula-saltar': '1', role: 'button' }
  })
  // (Tanda 10N6 §1i) El botón de silencio de la música, pequeño, en la misma línea que el título y [Saltar] (a su izquierda): solo si hay música. Altavoz fino y gris, sin relleno.
  recorre(movil, (n) => {
    if (!n.a?.['data-barra-superior'] || !n.c) return
    const icono = (c: Nodo[]): Nodo => ({ t: 'svg', a: { width: '17', height: '17', viewBox: '0 0 24 24', fill: 'none', stroke: 'rgba(251,243,226,.8)', strokeWidth: '1.7', strokeLinecap: 'round', strokeLinejoin: 'round', style: 'flex:none' }, c })
    const ruta = (d: string): Nodo => ({ t: 'path', a: { d }, c: [] })
    const altavoz = 'M11 5L6 9H3v6h3l5 4V5z'
    n.c.unshift({
      i: '{{ !s7 }}',
      c: [
        {
          i: '{{ hayMusica }}',
          c: [
            {
              t: 'span',
              a: { onClick: '{{ silenciar }}', role: 'button', 'aria-label': '{{ silTxt }}', 'data-pelicula-musica': '1', style: 'width:34px;height:34px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:rgba(20,22,28,.5);border:1px solid rgba(251,243,226,.3);cursor:pointer' },
              c: [
                { i: '{{ musicaOn }}', c: [icono([ruta(altavoz), ruta('M15.5 8.5a5 5 0 0 1 0 7'), ruta('M18.5 5.5a9 9 0 0 1 0 13')])] },
                { i: '{{ musicaOff }}', c: [icono([ruta(altavoz), ruta('M16 9l5 6M21 9l-5 6')])] },
              ],
            },
          ],
        },
      ],
    })
  })
  // Las zonas de toque (atrás / adelante) tapan el final: en el final no hay nada que pasar y la lista tiene que dejarse tocar y mover.
}

/**
 * LA LISTA DEL FINAL (Tanda 10P, 1.2 y 1.4). Con scroll de verdad en el móvil (se mueve con el dedo, sin que lo tape la parte fija de abajo) y SIN las filas que aún no existen (data/pase/lista_ajustes.json). La línea de
 * «Invita a un amigo» y la «Todo lo que incluye» llevan «HOY» en oro.
 */
function ajustarLaLista(ast: Nodo[]) {
  const movil = palcoDe(ast)
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
        const tituloNuevo = par && TITULOS_NUEVOS[textoDe(par.c![0])]
        const nuevo = par && TEXTOS_DE_LINEA[textoDe(par.c![0])]
        if (par && tituloNuevo) par.c![0] = { t: 'span', a: (par.c![0] as Nodo).a, c: [tituloNuevo] }
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
