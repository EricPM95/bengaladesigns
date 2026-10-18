// Pasa una pieza de Claude Design (docs/diseno/proyecto/Piezas/<Nombre>.dc.html) a un componente de React (src/components/logros/dibujos/piezas/<Nombre>.tsx + .css).
//   node scripts/destino/dc2tsx.mjs "Medalla Grado" MedallaGrado [MedallaGrado ...]    (nombre del archivo de Design, nombre del componente)
// Solo entiende lo que usan las piezas de dibujos: <sc-if>, <sc-for>, {{ ruta }} (sin cuentas), style en texto y eventos onX={{ f }}. Si una pieza usa <dc-import> o algo más, avisa.
// Manda lo que se ve en el diseño: el JS de la pieza (clase Component) se copia tal cual, solo cambia el nombre de la clase y se le ponen sus valores por defecto.
import fs from 'node:fs'
import path from 'node:path'

const [archivoDiseno, nombre] = process.argv.slice(2)
if (!archivoDiseno || !nombre) throw new Error('uso: dc2tsx.mjs "<Nombre en Design>" <NombreComponente>')
const origen = path.resolve('docs/diseno/proyecto/Piezas', `${archivoDiseno}.dc.html`)
const src = fs.readFileSync(origen, 'utf8')

const entre = (texto, abre, cierra) => {
  const i = texto.indexOf(abre)
  if (i < 0) return null
  const j = texto.indexOf(cierra, i + abre.length)
  return j < 0 ? null : texto.slice(i + abre.length, j)
}
const dc = src.slice(src.indexOf('<x-dc>') + 6, src.lastIndexOf('</x-dc>'))
const helmet = entre(dc, '<helmet>', '</helmet>') ?? ''
const css = [...helmet.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1].trim()).join('\n')
const plantilla = dc.replace(/<helmet>[\s\S]*?<\/helmet>/, '').trim()
const cabecera = /<script type="text\/x-dc"([^>]*)>/.exec(src)
const js = entre(src, cabecera[0], '</script>') ?? ''
const propsAttr = /data-props="([^"]*)"/.exec(cabecera[1])
const props = propsAttr ? JSON.parse(propsAttr[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')) : {}
const defectos = Object.fromEntries(Object.entries(props).filter(([k, v]) => !k.startsWith('$') && v && 'default' in v).map(([k, v]) => [k, v.default]))

// ── La plantilla → JSX ──
const tokens = []
{
  const re = /<!--[\s\S]*?-->|<\/([A-Za-z0-9:-]+)\s*>|<([A-Za-z][A-Za-z0-9:-]*)((?:\s+[^\s=\/>"']+(?:="[^"]*")?)*)\s*(\/?)>|([^<]+)/g
  let m
  while ((m = re.exec(plantilla))) {
    if (m[0].startsWith('<!--')) continue
    if (m[1]) tokens.push({ t: 'cierra', n: m[1] })
    else if (m[2]) tokens.push({ t: 'abre', n: m[2], a: m[3], auto: m[4] === '/' })
    else if (m[5] !== undefined) tokens.push({ t: 'texto', s: m[5] })
  }
}
const atributos = (cadena) => [...cadena.matchAll(/([^\s=\/>"']+)(?:="([^"]*)")?/g)].map((m) => [m[1], m[2] ?? ''])
const VOID = new Set(['meta', 'br', 'img', 'input', 'link', 'hr'])

const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
const nombreAttr = (n) => {
  if (n === 'class') return 'className'
  if (n === 'for') return 'htmlFor'
  if (n === 'xlink:href') return 'xlinkHref'
  if (n.startsWith('data-') || n.startsWith('aria-')) return n
  if (/^on[A-Z]/.test(n)) return n
  if (n.includes(':')) return camel(n.replace(':', '-'))
  return camel(n)
}
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')

const ambito = []
const expr = (e) => {
  e = e.trim()
  if (/^(true|false|null|undefined|-?\d+(\.\d+)?)$/.test(e)) return e
  const raiz = e.split('.')[0]
  return ambito.includes(raiz) ? e : `v.${e}`
}
/** Un valor con {{ }}: devuelve { tipo: 'expr'|'lit'|'plantilla', codigo } */
const valor = (s) => {
  const partes = s.split(/(\{\{[^}]*\}\})/).filter((x) => x !== '')
  if (partes.length === 1 && partes[0].startsWith('{{')) return { tipo: 'expr', codigo: expr(partes[0].slice(2, -2)) }
  if (!partes.some((p) => p.startsWith('{{'))) return { tipo: 'lit', codigo: JSON.stringify(s) }
  return { tipo: 'plantilla', codigo: '`' + partes.map((p) => (p.startsWith('{{') ? '${' + expr(p.slice(2, -2)) + '}' : esc(p))).join('') + '`' }
}
const estilo = (texto) => {
  const decl = []
  let actual = ''
  let prof = 0
  for (const ch of texto) {
    if (ch === '(') prof++
    if (ch === ')') prof--
    if (ch === ';' && prof === 0) {
      decl.push(actual)
      actual = ''
    } else actual += ch
  }
  if (actual.trim()) decl.push(actual)
  const salida = []
  for (const d of decl) {
    const i = d.indexOf(':')
    if (i < 0) continue
    let k = d.slice(0, i).trim()
    const val = d.slice(i + 1).trim()
    if (!k) continue
    if (!k.startsWith('--')) k = k.startsWith('-webkit-') ? 'Webkit' + camel(k.slice(8)).replace(/^./, (c) => c.toUpperCase()) : k.startsWith('-moz-') ? 'Moz' + camel(k.slice(5)).replace(/^./, (c) => c.toUpperCase()) : camel(k)
    salida.push(`${JSON.stringify(k)}: ${valor(val).codigo}`)
  }
  return `{{ ${salida.join(', ')} } as React.CSSProperties}`
}
const textoJsx = (s) => {
  if (!s.trim()) return ''
  return s
    .split(/(\{\{[^}]*\}\})/)
    .filter((x) => x !== '')
    .map((p) => (p.startsWith('{{') ? `{${expr(p.slice(2, -2))}}` : p.replace(/\{/g, '{"{"}').replace(/\}/g, '{"}"}').replace(/\s+/g, ' ')))
    .join('')
}

let pos = 0
let raiz = true
const nodo = () => {
  const tk = tokens[pos]
  if (tk.t === 'texto') {
    pos++
    return textoJsx(tk.s)
  }
  if (tk.t === 'cierra') throw new Error('cierre inesperado ' + tk.n)
  pos++
  const hijos = () => {
    let h = ''
    if (!tk.auto && !VOID.has(tk.n)) {
      while (!(tokens[pos].t === 'cierra' && tokens[pos].n === tk.n)) h += nodo()
      pos++
    }
    return h
  }
  const at = atributos(tk.a)
  if (tk.n === 'sc-if') {
    const cond = valor(at.find(([k]) => k === 'value')[1]).codigo
    return `{(${cond}) ? (<>${hijos()}</>) : null}`
  }
  if (tk.n === 'sc-for') {
    const lista = valor(at.find(([k]) => k === 'list')[1]).codigo
    const como = at.find(([k]) => k === 'as')[1]
    ambito.push(como)
    const cuerpo = hijos()
    ambito.pop()
    return `{(${lista} || []).map((${como}, __k) => (<React.Fragment key={__k}>${cuerpo}</React.Fragment>))}`
  }
  if (tk.n.startsWith('sc-') || tk.n === 'dc-import') throw new Error(`${archivoDiseno}: la etiqueta ${tk.n} no está soportada`)
  const esRaiz = raiz
  raiz = false
  const attrs = []
  for (const [k, val] of at) {
    if (k.startsWith('hint-')) continue
    if (k === 'style') {
      attrs.push(`style=${estilo(val)}`)
      continue
    }
    const n = nombreAttr(k)
    const x = valor(val)
    attrs.push(x.tipo === 'lit' ? `${n}=${x.codigo}` : `${n}={${x.codigo}}`)
  }
  if (esRaiz) attrs.push('className="dib"')
  const ch = hijos()
  return `<${tk.n}${attrs.length ? ' ' + attrs.join(' ') : ''}>${ch}</${tk.n}>`
}
let jsx = ''
while (pos < tokens.length) jsx += nodo()

// ── El JS de la pieza ──
let cuerpo = js.replace(/class Component extends DCLogic/, `class ${nombre} extends DCLogic`)
if (!cuerpo.includes(`class ${nombre} extends DCLogic`)) throw new Error('no encuentro «class Component extends DCLogic»')
const defaultProps = Object.keys(defectos).length ? `\n${nombre}.defaultProps = ${JSON.stringify(defectos)}\n` : ''
const tsx = `// @ts-nocheck
// Pieza portada del diseño de Claude Design (Piezas/${archivoDiseno}.dc.html). Generado con dc2tsx; manda lo que se ve en el diseño.
import React from 'react'
import './${nombre}.css'

const DCLogic: any = React.Component
const T = (v) => (<>${jsx}</>)

${cuerpo.trim()}
${defaultProps}
${nombre}.prototype.render = function () { return T(this.renderVals()) }
export default ${nombre} as unknown as React.ComponentType<any>
`
const destino = path.resolve('src/components/logros/dibujos/piezas')
fs.writeFileSync(path.join(destino, `${nombre}.tsx`), tsx)
fs.writeFileSync(path.join(destino, `${nombre}.css`), css + '\n@media (prefers-reduced-motion: reduce){.dib *,.dib *::before,.dib *::after{animation-duration:.001s!important;animation-delay:0s!important;animation-iteration-count:1!important}}\n')
// «Medalla Destino» dibuja la tierra del globo pidiendo d3-geo y world-atlas a internet: aquí va precalculada (piezas/tierraPath.ts) y no se pide nada.
if (nombre === 'MedallaDestino') {
  const f = path.join(destino, `${nombre}.tsx`)
  let x = fs.readFileSync(f, 'utf8')
  const a = x.indexOf('let GEOP=null;')
  const b = x.indexOf('class MedallaDestino')
  if (a < 0 || b < 0) throw new Error('MedallaDestino: no encuentro landPath')
  x = x.slice(0, a) + "const landPath=()=>import('./tierraPath').then((m)=>m.TIERRA)\n" + x.slice(b)
  fs.writeFileSync(f, x)
}
console.log(`ok ${archivoDiseno} → ${nombre}.tsx (${(tsx.length / 1024).toFixed(1)} KB)`)
