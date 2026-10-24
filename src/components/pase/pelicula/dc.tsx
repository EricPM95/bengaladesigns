import * as React from 'react'
import { MAPAS } from './mapas'
import { PIEZAS } from './gen/indice'

/**
 * EL MOTOR DE LAS PIEZAS DE DESIGN (Tanda 10I). Design hace sus piezas como «.dc.html»: una plantilla (con `<sc-if>`, `<sc-for>` y `{{ ... }}`) y una clase pequeña que le da los valores.
 * `scripts/destino/generarPelicula.mjs` las trocea (con el mismo analizador de HTML que usa el runtime de Design) y deja en `gen/` la plantilla, el CSS y el código de cada pieza;
 * esto es lo único que hace falta para pintarlas: el mismo modo de resolver las llaves, de repetir y de condicionar que `docs/diseno/proyecto/support.js`, sin tocar los textos.
 */

/* ───────────── las llaves {{ ... }} (la misma lógica que el runtime de Design) ───────────── */
const IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*/
const NUMBER_RE = /^-?\d+(\.\d+)?$/

function parensWrapWhole(expr: string): boolean {
  let depth = 0
  for (let i = 0; i < expr.length - 1; i++) {
    if (expr[i] === '(') depth++
    else if (expr[i] === ')') {
      depth--
      if (depth === 0) return false
    }
  }
  return true
}
function findTopLevelEquality(expr: string): { index: number; op: string } | null {
  let depth = 0
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i]
    if (c === '[' || c === '(') depth++
    else if (c === ']' || c === ')') depth--
    else if (depth === 0 && (c === '=' || c === '!') && expr[i + 1] === '=') {
      if (i > 0 && (expr[i - 1] === '=' || expr[i - 1] === '!')) continue
      if (!expr.slice(0, i).trim()) continue
      return { index: i, op: expr[i + 2] === '=' ? c + '==' : c + '=' }
    }
  }
  return null
}
function resolvePath(vals: any, expr: string): any {
  const head = expr.match(IDENT_RE)
  if (!head) return undefined
  let cur = vals == null ? undefined : vals[head[0]]
  let i = head[0].length
  while (i < expr.length) {
    if (expr[i] === '.') {
      const m = expr.slice(i + 1).match(IDENT_RE) || expr.slice(i + 1).match(/^\d+/)
      if (!m) return undefined
      cur = cur == null ? undefined : cur[m[0]]
      i += 1 + m[0].length
    } else if (expr[i] === '[') {
      let depth = 1
      let j = i + 1
      while (j < expr.length && depth > 0) {
        if (expr[j] === '[') depth++
        else if (expr[j] === ']') {
          depth--
          if (depth === 0) break
        }
        j++
      }
      if (depth !== 0) return undefined
      const key = resolve(vals, expr.slice(i + 1, j))
      cur = cur == null ? undefined : cur[key]
      i = j + 1
    } else return undefined
  }
  return cur
}
function resolve(vals: any, src: string): any {
  const expr = String(src).trim()
  if (!expr) return undefined
  if (expr[0] === '(' && expr[expr.length - 1] === ')' && parensWrapWhole(expr)) return resolve(vals, expr.slice(1, -1))
  const eq = findTopLevelEquality(expr)
  if (eq) {
    const lv = resolve(vals, expr.slice(0, eq.index))
    const rv = resolve(vals, expr.slice(eq.index + eq.op.length))
    switch (eq.op) {
      case '===':
        return lv === rv
      case '!==':
        return lv !== rv
      case '==':
        // eslint-disable-next-line eqeqeq
        return lv == rv
      default:
        // eslint-disable-next-line eqeqeq
        return lv != rv
    }
  }
  if (expr[0] === '!') return !resolve(vals, expr.slice(1))
  if (expr === 'true') return true
  if (expr === 'false') return false
  if (expr === 'null') return null
  if (expr === 'undefined') return undefined
  if (NUMBER_RE.test(expr)) return Number(expr)
  if (expr.length >= 2 && (expr[0] === '"' || expr[0] === "'") && expr[expr.length - 1] === expr[0]) return expr.slice(1, -1)
  return resolvePath(vals, expr)
}

type Getter = (vals: any) => any
const cacheAttr = new Map<string, Getter>()
function compileAttr(raw: string): Getter {
  const hit = cacheAttr.get(raw)
  if (hit) return hit
  let g: Getter
  const whole = raw.match(/^\s*\{\{([\s\S]+?)\}\}\s*$/)
  if (whole) {
    const path = whole[1]
    g = (vals) => resolve(vals, path)
  } else if (raw.includes('{{')) {
    const parts = raw.split(/\{\{([\s\S]+?)\}\}/g)
    g = (vals) => parts.map((s, i) => (i & 1 ? resolve(vals, s) ?? '' : s)).join('')
  } else g = () => raw
  cacheAttr.set(raw, g)
  return g
}

const kebabToCamel = (s: string) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
const cacheEstilo = new Map<string, Record<string, string>>()
function cssToObj(css: string): Record<string, string> {
  const hit = cacheEstilo.get(css)
  if (hit) return hit
  const o: Record<string, string> = {}
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':')
    if (i < 0) continue
    const prop = decl.slice(0, i).trim()
    o[prop.startsWith('--') ? prop : kebabToCamel(prop)] = decl.slice(i + 1).trim()
  }
  if (css.length < 4000) cacheEstilo.set(css, o)
  return o
}

/* ───────────── la plantilla ───────────── */
interface Nodo {
  t?: string
  a?: Record<string, string>
  c?: (Nodo | string)[]
  i?: string
  f?: string
  as?: string
  imp?: string
  s?: string | null
}
type Contexto = { host: DCPieza }

const HOST_STYLE_PROPS = new Set(['position', 'left', 'right', 'top', 'bottom', 'inset', 'width', 'height', 'z-index', 'transform'])
function hostPositionStyle(style: unknown): Record<string, string> | undefined {
  const all = typeof style === 'string' ? cssToObj(style) : style != null && typeof style === 'object' ? (style as Record<string, string>) : null
  if (!all) return undefined
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(all)) {
    const kebab = k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())
    if (HOST_STYLE_PROPS.has(kebab)) out[k] = v
  }
  return Object.keys(out).length ? out : undefined
}

function pinta(n: Nodo | string, vals: any, ctx: Contexto, key: string | number): React.ReactNode {
  if (typeof n === 'string') {
    if (!n.includes('{{')) return n
    const parts = n.split(/\{\{([\s\S]+?)\}\}/g)
    return React.createElement(
      React.Fragment,
      { key },
      ...parts.map((p, i) => {
        if (!(i & 1)) return p
        const v = resolve(vals, p)
        if (v === undefined || v === null || typeof v === 'boolean') return null
        if (React.isValidElement(v) || Array.isArray(v)) return React.createElement(React.Fragment, { key: i }, v as React.ReactNode)
        return String(v)
      }),
    )
  }
  if (n.f !== undefined) {
    const lista = compileAttr(n.f)(vals)
    const asName = n.as || 'item'
    const items = Array.isArray(lista) ? lista : []
    return React.createElement(
      React.Fragment,
      { key },
      items.map((item, i) => {
        const sub = { ...vals, [asName]: item, $index: i }
        // (una palabra nueva en el mismo sitio vuelve a empezar su animación: la clave lleva la palabra)
        const k = item && typeof item === 'object' && typeof item.w === 'string' ? `${i}|${item.w}` : i
        return React.createElement(React.Fragment, { key: k }, (n.c ?? []).map((h, j) => pinta(h, sub, ctx, j)))
      }),
    )
  }
  if (n.i !== undefined) {
    const v = compileAttr(n.i)(vals)
    return v ? React.createElement(React.Fragment, { key }, (n.c ?? []).map((h, j) => pinta(h, vals, ctx, j))) : null
  }
  if (n.imp !== undefined) {
    const props: Record<string, unknown> = { key, __nombre: n.imp }
    if (n.s != null) props.__hostStyle = hostPositionStyle(compileAttr(n.s)(vals))
    for (const [k, v] of Object.entries(n.a ?? {})) props[k] = compileAttr(v)(vals)
    return React.createElement(DCPieza as any, props)
  }
  const props: Record<string, unknown> = { key }
  for (const [k, raw] of Object.entries(n.a ?? {})) {
    let v = compileAttr(raw)(vals)
    if (k === 'style' && typeof v === 'string') v = cssToObj(v)
    if ((k === 'value' || k === 'checked') && v === undefined) v = k === 'checked' ? false : ''
    props[k] = v
  }
  const hijos = (n.c ?? []).map((h, j) => pinta(h, vals, ctx, j))
  return React.createElement(n.t as string, props, ...hijos)
}

/* ───────────── la lógica y la pieza ───────────── */
export class DCLogic {
  props: any
  state: any = {}
  __host: DCPieza | null = null
  constructor(props: any) {
    this.props = props || {}
  }
  setState(update: any, cb?: () => void) {
    this.__host?.__setLogicState(update, cb)
  }
  forceUpdate() {
    this.__host?.forceUpdate()
  }
  componentDidMount() {}
  componentDidUpdate(_prev?: unknown) {}
  componentWillUnmount() {}
  renderVals(): Record<string, unknown> {
    return {}
  }
}

const logicas = new Map<string, any>()
function logicaDe(nombre: string): any {
  if (!logicas.has(nombre)) {
    const p = PIEZAS[nombre]
    logicas.set(nombre, p ? p.crearLogica(DCLogic, React, MAPAS) || DCLogic : DCLogic)
  }
  return logicas.get(nombre)
}

export class DCPieza extends React.Component<any, { v: number }> {
  logic: DCLogic
  nombre: string
  constructor(props: any) {
    super(props)
    this.nombre = props.__nombre
    this.state = { v: 0 }
    const L = logicaDe(this.nombre)
    this.logic = new L(this.userProps())
    this.logic.__host = this
  }
  userProps() {
    const { __nombre, __hostStyle, __plantilla, __sobre, ...rest } = this.props
    const defaults = PIEZAS[this.nombre]?.porDefecto ?? {}
    return { ...defaults, ...rest }
  }
  __setLogicState(update: any, cb?: () => void) {
    const prev = this.logic.state
    const patch = typeof update === 'function' ? update(prev) : update
    this.logic.state = { ...prev, ...patch }
    this.setState((s) => ({ v: s.v + 1 }), cb)
  }
  componentDidMount() {
    this.logic.componentDidMount()
  }
  componentDidUpdate(prev: unknown) {
    this.logic.props = this.userProps()
    this.logic.componentDidUpdate(prev)
  }
  componentWillUnmount() {
    this.logic.componentWillUnmount()
  }
  render() {
    const pieza = PIEZAS[this.nombre]
    if (!pieza) return null
    const userProps = this.userProps()
    this.logic.props = userProps
    // `__sobre`: lo que la app pone por encima de lo que da la pieza (los precios de verdad, la lista de «lo que incluye», lo que hacen los botones).
    const vals = { ...userProps, ...(this.logic.renderVals() || {}), ...(this.props.__sobre ? this.props.__sobre(this.logic) : {}) }
    return React.createElement(
      'div',
      { className: 'sc-host', style: this.props.__hostStyle },
      (this.props.__plantilla ?? pieza.plantilla).map((n: Nodo | string, i: number) => pinta(n, vals, { host: this }, i)),
    )
  }
}

/** Todo el CSS (las animaciones) de las piezas que cuelgan de `nombre`, para ponerlo UNA vez en la página mientras se ve la película. */
export function cssDe(nombre: string, visto = new Set<string>()): string {
  if (visto.has(nombre)) return ''
  visto.add(nombre)
  const p = PIEZAS[nombre]
  if (!p) return ''
  return [p.css, ...(p.imports as string[]).map((i) => cssDe(i, visto))].join('\n')
}
