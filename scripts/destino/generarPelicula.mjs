// Convierte la película del pase de Design (docs/diseno/proyecto/Piezas/Pase Pelicula.dc.html y las piezas que importa) en módulos de la app:
// src/components/pase/pelicula/gen/<Pieza>.ts, con la plantilla ya troceada (el mismo troceado que hace el runtime de Design: el analizador de HTML del navegador),
// el CSS de las animaciones y el código de la pieza. Los textos NO se tocan: salen tal cual del archivo de Design.
//   node scripts/destino/generarPelicula.mjs        (hace falta `npm run dev`: abre un Chrome sin ventana para trocear con el mismo analizador que Design)
// Lo único que se cambia del código de Design: de dónde salen los mapas (en vez de bajarlos de jsdelivr, van dentro de la app).
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const BASE = 'docs/diseno/proyecto'
// Las imágenes que piden las piezas de Design («assets/...») van dentro de la app, en public/pelicula/assets (no se bajan de ningún otro sitio). Solo se llevan las que la película usa de verdad
// (las comprobó la prueba mirando qué pide al verse entera); si Design empezara a usar otra, el generador avisa.
const IMAGENES = ['marco-nivel1', 'marco-nivel2', 'marco-nivel3', 'hueco-1', 'hueco-2', 'hueco-3']
const RUTA_IMAGENES = '/pelicula/assets/'
const sinFuera = (t) => t.replace(/(["'(])assets\//g, `$1${RUTA_IMAGENES}`)
const SALIDA = 'src/components/pase/pelicula/gen'
fs.mkdirSync(SALIDA, { recursive: true })

const TROCEAR = `(src) => {
  const CAMEL = 'sc-camel-'
  const EVENTOS = { onclick: 'onClick', onpointerdown: 'onPointerDown', onpointerup: 'onPointerUp', onpointerleave: 'onPointerLeave', onpointermove: 'onPointerMove', onpointercancel: 'onPointerCancel' }
  const abre = /<x-dc(?:\\s[^>]*)?>/.exec(src)
  const cierre = src.lastIndexOf('</x-dc>')
  let html = src.slice(abre.index + abre[0].length, cierre)
  const doc = new DOMParser().parseFromString(src, 'text/html')
  const sc = doc.querySelector('script[data-dc-script]')
  let props = {}
  try { props = JSON.parse(sc?.getAttribute('data-props') || '{}') } catch (e) {}
  const defaults = {}
  for (const k of Object.keys(props)) if (k[0] !== '$' && props[k] && props[k].default !== undefined) defaults[k] = props[k].default
  const ATTRS = '(?:[^>"\\']|"[^"]*"|\\'[^\\']*\\')*'
  html = html.replace(new RegExp('<(x-import|dc-import)(' + ATTRS + ')/>', 'gi'), (_, t, a) => '<' + t + a + '></' + t + '>')
  html = html.replace(/<helmet(\\s|>)/gi, '<sc-helmet$1').replace(/<\\/helmet\\s*>/gi, '</sc-helmet>')
  html = html.replace(/(\\s)([a-z]+[A-Z][A-Za-z0-9]*)(\\s*=)/g, (_, sp, n, eq) => sp + CAMEL + n.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()) + eq)
  const tpl = document.createElement('template')
  tpl.innerHTML = html
  const css = []
  const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  const atributos = (el, tipo) => {
    const a = {}
    let style = null
    for (const { name, value } of [...el.attributes]) {
      let k = name
      if (k === 'name' && tipo === 'imp') continue
      if (k === 'hint-size') continue
      if (k.startsWith(CAMEL)) k = camel(k.slice(CAMEL.length))
      if (tipo === 'dom') {
        if (k === 'class') k = 'className'
        else if (k === 'for') k = 'htmlFor'
        else if (k.startsWith('on')) k = EVENTOS[k] || 'on' + k[2].toUpperCase() + k.slice(3)
        else if (k.includes('-') && !k.startsWith('data-') && !k.startsWith('aria-')) k = camel(k)
      } else if (k.includes('-')) k = camel(k)
      a[k] = value
    }
    return a
  }
  const trocea = (n) => {
    if (n.nodeType === 3) {
      const t = n.nodeValue ?? ''
      if (!t.includes('{{') && !t.trim() && !t.includes(' ')) return null
      return t
    }
    if (n.nodeType !== 1) return null
    const tag = n.localName
    const hijos = () => [...n.childNodes].map(trocea).filter((x) => x != null)
    if (tag === 'sc-helmet') { for (const s of n.querySelectorAll('style')) css.push(s.textContent); return null }
    if (tag === 'sc-for') return { f: n.getAttribute('list') || '', as: n.getAttribute('as') || 'item', c: hijos() }
    if (tag === 'sc-if') return { i: n.getAttribute('value') || '', c: hijos() }
    if (tag === 'dc-import') {
      const nombre = n.getAttribute('name') || n.getAttribute('component') || ''
      const estilo = n.getAttribute('style')
      const a = atributos(n, 'imp')
      delete a.style
      delete a.component
      return { imp: nombre, a, s: estilo, c: hijos() }
    }
    const a = atributos(n, 'dom')
    return { t: tag, a, c: hijos() }
  }
  const ast = [...tpl.content.childNodes].map(trocea).filter((x) => x != null)
  const imports = []
  const busca = (x) => { if (x && typeof x === 'object') { if (x.imp) imports.push(x.imp); (x.c || []).forEach(busca) } }
  ast.forEach(busca)
  return { ast, css: css.join('\\n'), js: sc ? sc.textContent : '', defaults, imports }
}`

const app = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&apertura=0' })
const hechas = new Map()
const cola = ['Piezas/Pase Pelicula']
const slug = (n) => n.replace(/^Piezas\//, '').replace(/[^A-Za-z0-9]+/g, '_')

while (cola.length) {
  const nombre = cola.shift()
  if (hechas.has(nombre)) continue
  const fichero = path.join(BASE, `${nombre}.dc.html`)
  const src = fs.readFileSync(fichero, 'utf8')
  const r = await app.evaluar(`(${TROCEAR})(${JSON.stringify(src)})`)
  hechas.set(nombre, r)
  for (const i of r.imports) cola.push(i)

  let js = r.js
  // Los mapas van dentro de la app, no se bajan de jsdelivr (la película tiene que salir entera con mala conexión).
  js = js.replace(/const U='https:\/\/cdn\.jsdelivr\.net\/npm\/world-atlas@2\/';const get=n=>fetch\(U\+n\)\.then\(r=>r\.json\(\)\);get\('land-50m\.json'\)\.catch\(\(\)=>get\('land-110m\.json'\)\)\.then\(t=>\{LANDP=landProj\(t,'land'\);this\.setState\(\{landD:LANDP\}\);\}\)\.catch\(\(\)=>\{\}\);get\('countries-50m\.json'\)\.catch\(\(\)=>get\('countries-110m\.json'\)\)\.then\(t=>\{CTRP=landProj\(t,'countries'\);this\.setState\(\{cD:CTRP\}\);\}\)\.catch\(\(\)=>\{\}\);/,
    "LANDP=MAPAS.land;CTRP=MAPAS.countries;this.setState({landD:LANDP,cD:CTRP});")
  js = js.replace(/fetch\('https:\/\/cdn\.jsdelivr\.net\/npm\/world-atlas@2\/countries-110m\.json'\)/g, 'Promise.resolve({json:()=>Promise.resolve(MAPAS.countries110)})')
  if (nombre === 'Piezas/Pase Pelicula') {
    // Rendimiento en un Android normal: Design repinta TODA la película 16 veces por segundo solo para mover la barra de arriba (que va de 1 % en 1 %). Aquí solo se repinta cuando la barra cambia de verdad (el mismo dibujo, unas 2 veces por segundo).
    const a = 'const p=s.p+60/DURS[s.i];if(p>=1)this.go(s.i+1);else this.setState({p});'
    const b = 'const p=(this._pi===s.i&&this._pp!=null?this._pp:s.p)+60/DURS[s.i];this._pp=p;this._pi=s.i;if(p>=1){this._pp=null;this.go(s.i+1);}else if(Math.round(p*100)!==Math.round(s.p*100))this.setState({p});'
    if (!js.includes(a)) throw new Error('Design ha cambiado el reloj de la película: revisa el cambio de rendimiento en generarPelicula.mjs')
    js = js.replace(a, b)
    if (!js.includes('go(i){if(i===2)')) throw new Error('Design ha cambiado go(i) de la película')
    // Tanda 10N5 (apartado 5): la escena del pasaporte (la quinta de las siete: DURS[5]) dura 43,8 s, pero la vuelta al mundo (Pase Globo: T0 15,3 + 24 tramos de 1,0 + 1,3) acaba en el segundo 40,6 y después no se mueve nada.
    // Eric: «la escena se queda unos 7 segundos parada; que siga en cuanto acaba la vuelta». Se corta a 0,7 s después de llegar al último país.
    const durs = 'const DURS=[17000,47900,6000,29100,23100,43800,8700,0];'
    if (!js.includes(durs)) throw new Error('Design ha cambiado las duraciones de las escenas (DURS): revisa el corte de la escena del pasaporte en generarPelicula.mjs')
    js = js.replace(durs, 'const DURS=[17000,47900,6000,29100,23100,41300,8700,0];')
    js = js.replace('go(i){if(i===2)', 'go(i){this._pp=null;if(i===2)')
  }
  if (/https?:\/\//.test(js.replace(/\/\/.*$/gm, '')) && /jsdelivr|unpkg|googleapis/.test(js)) throw new Error(`${nombre}: todavía carga algo de fuera`)

  const usadas = new Set([...JSON.stringify(r.ast).matchAll(/assets\/([A-Za-z0-9_-]+)\.png/g), ...r.css.matchAll(/assets\/([A-Za-z0-9_-]+)\.png/g), ...js.matchAll(/assets\/([A-Za-z0-9_-]+)\.png/g)].map((m) => m[1]))
  for (const u of usadas) if (!IMAGENES.includes(u)) console.log(`  (aviso) ${nombre} pide la imagen ${u}.png, que no va en la app: si se llega a ver, saldrá rota`)
  const modulo = `// @ts-nocheck
// GENERADO por scripts/destino/generarPelicula.mjs desde ${fichero.replace(/\\/g, '/')} — no editar a mano (se vuelve a generar).
export const plantilla = ${sinFuera(JSON.stringify(r.ast))}
export const css = ${sinFuera(JSON.stringify(r.css))}
export const porDefecto = ${JSON.stringify(r.defaults)}
export const imports = ${JSON.stringify(r.imports)}
export function crearLogica(DCLogic, React, MAPAS) {
${sinFuera(js)}
return typeof Component !== 'undefined' ? Component : undefined
}
`
  fs.writeFileSync(path.join(SALIDA, `${slug(nombre)}.ts`), modulo)
  console.log(`${nombre}: plantilla ${(JSON.stringify(r.ast).length / 1024).toFixed(0)} KB, css ${(r.css.length / 1024).toFixed(0)} KB, js ${(r.js.length / 1024).toFixed(1)} KB, importa ${r.imports.join(', ') || '—'}`)
}

// Las imágenes de la película.
fs.mkdirSync('public/pelicula/assets', { recursive: true })
for (const i of IMAGENES) fs.copyFileSync(`${BASE}/assets/${i}.png`, `public/pelicula/assets/${i}.png`)

// LA LISTA DEL PASE (la de «lo que incluye»): sale TAL CUAL de la lista del final de la película (escena 7), para que el final, la hoja «Todo lo que incluye» y «Con el pase tendrás» de HOY
// sean siempre la misma (src/lib/listaDelPase.ts): los mismos nombres, las mismas líneas, los mismos iconos y el mismo orden.
{
  const ast = hechas.get('Piezas/Pase Pelicula').ast
  const busca = (n, p) => {
    if (typeof n === 'string') return null
    if (p(n)) return n
    for (const c of n.c ?? []) {
      const r = busca(c, p)
      if (r) return r
    }
    return null
  }
  const texto = (n) => (typeof n === 'string' ? n : (n.c ?? []).map(texto).join(''))
  const fin = busca({ c: ast }, (n) => n.i === '{{ s7 }}')
  const lista = busca(fin, (n) => n.a?.ref === '{{ listRef }}')
  const grupos = []
  for (const c of lista.c) {
    if (typeof c === 'string') continue
    const svg = busca(c, (n) => n.t === 'svg')
    if (!svg) {
      const t = texto(c).trim()
      if (!t) continue
      // «¡Y mucho más!» va dentro del grupo de arriba (sin línea ni icono); lo demás son los títulos de grupo.
      if (/^¡/.test(t)) grupos[grupos.length - 1].items.push({ titulo: t, linea: '', icono: null })
      else grupos.push({ titulo: t, items: [] })
      continue
    }
    const textos = busca(c, (n) => n.t === 'span' && (n.c ?? []).length === 2 && (n.c ?? []).every((x) => typeof x !== 'string' && x.t === 'span'))
    if (!textos) throw new Error('No encuentro el título y la línea de una fila de la lista del final')
    grupos[grupos.length - 1].items.push({ titulo: texto(textos.c[0]), linea: texto(textos.c[1]), icono: svg })
  }
  const total = grupos.reduce((s, g) => s + g.items.length, 0)
  if (grupos.length !== 6 || total < 24) throw new Error(`La lista del final no sale como se esperaba (${grupos.length} grupos, ${total} filas)`)
  fs.writeFileSync(
    'src/lib/listaDelPase.ts',
    `// GENERADO por scripts/destino/generarPelicula.mjs desde la lista del final de «Pase Pelicula» (Design) — no editar a mano.
// UNA sola lista para el final de la película, «Todo lo que incluye» y «Con el pase tendrás» de HOY: los mismos nombres, las mismas líneas, los mismos iconos y el mismo orden.
export interface NodoIcono {
  t: string
  a?: Record<string, string>
  c?: (NodoIcono | string)[]
}
export interface ItemDeLista {
  titulo: string
  linea: string
  /** El dibujo (un svg de Design); null si la fila no lleva icono. */
  icono: NodoIcono | null
}
export interface GrupoDeLista {
  titulo: string
  items: ItemDeLista[]
}
export const LISTA_DEL_PASE: GrupoDeLista[] = ${JSON.stringify(grupos, null, 1)}
`,
  )
  console.log(`Lista del pase: ${grupos.length} grupos, ${total} filas`)
}

// El índice: nombre de Design → módulo.
const nombres = [...hechas.keys()]
fs.writeFileSync(
  path.join(SALIDA, 'indice.ts'),
  `// GENERADO por scripts/destino/generarPelicula.mjs — no editar a mano.
${nombres.map((n) => `import * as ${slug(n)} from './${slug(n)}'`).join('\n')}
export const PIEZAS: Record<string, any> = {
${nombres.map((n) => `  ${JSON.stringify(n)}: ${slug(n)},`).join('\n')}
}
`,
)
app.cerrar()
console.log('Piezas:', nombres.join(', '))
