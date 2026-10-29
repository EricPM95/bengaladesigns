// Saca de la pieza de Design `Piezas/Pase Lista.dc.html` (1 = la lista del pase por puntos; 2 y 2b = HOY sin pase) los DIBUJOS y los TEXTOS de cada punto, y los deja en
// src/components/pase/lista/disenoLista.ts. Los dibujos (svg) y los textos salen tal cual; la forma (colores, tamaños) está en ListaDelPase.tsx / HoySinPaseDiseno.tsx, copiada de la pieza.
//   node scripts/destino/generarPaseLista.mjs
import fs from 'node:fs'

const FUENTE = 'docs/diseno/proyecto/Piezas/Pase Lista.dc.html'
const SALIDA = 'src/components/pase/lista/disenoLista.ts'
const html = fs.readFileSync(FUENTE, 'utf8')

const iLista = html.indexOf('1 · El Pase Roma (lista por puntos)')
const iHoy = html.indexOf('2 · HOY sin pase')
const iHoy2 = html.indexOf('2b · HOY sin pase')
if (iLista < 0 || iHoy < 0 || iHoy2 < 0) throw new Error('Design ha cambiado los títulos de la pieza: revisa generarPaseLista.mjs')
const lista = html.slice(iLista, iHoy)
const hoy = html.slice(iHoy, iHoy2)

const limpia = (t) => t.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')

// 1 · La lista: cabeceras de sección (I · ANTES DEL VIAJE…) y filas (dibujo + título + línea), en orden.
const eventos = []
for (const m of lista.matchAll(/letter-spacing:\.2em;color:#E9C77A;white-space:nowrap">([^<]*)</g)) eventos.push({ i: m.index, seccion: limpia(m[1]) })
const fila = /<div style="display:flex;gap:16px;align-items:center;padding:15px 0;border-top:1px solid rgba\(233,199,122,\.14\)">(<svg[\s\S]*?<\/svg>)<\/span>[\s\S]*?font:400 22px\/1\.08 'Instrument Serif',serif;color:#FBF3E2">([^<]*)<\/span><span style="font:400 13\.5px\/1\.4 'Geist';color:rgba\(251,243,226,\.66\)">([^<]*)</g
// Las filas empiezan con el primer <svg> del círculo; se busca el svg DESPUÉS del span del círculo.
const filas = []
for (const m of lista.matchAll(/<div style="display:flex;gap:16px;align-items:center;padding:15px 0;border-top:1px solid rgba\(233,199,122,\.14\)"><span[^>]*>(<svg[\s\S]*?<\/svg>)<\/span><span[^>]*><span[^>]*>([^<]*)<\/span><span[^>]*>([^<]*)<\/span>/g)) {
  eventos.push({ i: m.index, fila: { icono: m[1], titulo: limpia(m[2]), linea: limpia(m[3]) } })
}
void fila
eventos.sort((a, b) => a.i - b.i)
const secciones = []
for (const e of eventos) {
  if (e.seccion) secciones.push({ titulo: e.seccion, filas: [] })
  else secciones[secciones.length - 1].filas.push(e.fila)
}

// 2 / 2b · HOY: las tarjetas (dibujo + título + línea), iguales en las dos; la cabecera y las dos cajas.
const tarjetas = []
for (const m of hoy.matchAll(/<span style="width:62px;height:62px;border-radius:18px[^>]*>(<svg[\s\S]*?<\/svg>)<\/span><span[^>]*><span[^>]*>([^<]*)<\/span><span[^>]*>([^<]*)<\/span>/g)) tarjetas.push({ icono: m[1], titulo: limpia(m[2]), linea: limpia(m[3]) })

const hoy2 = html.slice(iHoy2)
const texto = (zona, ini) => {
  const i = zona.indexOf(ini)
  return i < 0 ? null : i
}
void texto
const caja = (zona, tituloCaja) => {
  const m = zona.match(new RegExp(`color:#F7E8BC">(${tituloCaja})</span><span[^>]*>([^<]*)</span>`))
  if (!m) throw new Error(`No encuentro la caja «${tituloCaja}»`)
  return { titulo: limpia(m[1]), linea: limpia(m[2]) }
}
const sinUsar = caja(hoy, 'Tienes un día de prueba con HOY completo, gratis\\.')
const usado = caja(hoy2, 'Ya has usado tu día de prueba\\.')
const cab = hoy.match(/<span style="color:#E9C77A">HOY<\/span>, tu guía del día<\/span><span[^>]*>([^<]*)</)
if (!cab) throw new Error('No encuentro la cabecera de HOY')

if (secciones.length !== 6) throw new Error(`Esperaba 6 secciones y hay ${secciones.length}`)
if (tarjetas.length !== 8) throw new Error(`Esperaba 8 tarjetas de HOY y hay ${tarjetas.length}`)
const cuenta = secciones.reduce((s, x) => s + x.filas.length, 0)

const salida = `// GENERADO por scripts/destino/generarPaseLista.mjs desde docs/diseno/proyecto/Piezas/Pase Lista.dc.html — no editar a mano.
// Los dibujos y los textos son los de Design, tal cual (donde dice «Roma» / «Pase Roma» se pone el destino al pintar).
export interface PuntoDeLista { icono: string; titulo: string; linea: string }
export interface SeccionDeLista { titulo: string; filas: PuntoDeLista[] }
export const SECCIONES_DE_LA_LISTA: SeccionDeLista[] = ${JSON.stringify(secciones, null, 1)}
export const TARJETAS_DE_HOY: PuntoDeLista[] = ${JSON.stringify(tarjetas, null, 1)}
export const CABECERA_DE_HOY = ${JSON.stringify(limpia(cab[1]))}
export const CAJA_PRUEBA_SIN_USAR = ${JSON.stringify(sinUsar)}
export const CAJA_PRUEBA_USADA = ${JSON.stringify(usado)}
`
fs.mkdirSync('src/components/pase/lista', { recursive: true })
fs.writeFileSync(SALIDA, salida)
console.log(`OK ${SALIDA}: ${secciones.length} secciones, ${cuenta} filas, ${tarjetas.length} tarjetas de HOY`)
