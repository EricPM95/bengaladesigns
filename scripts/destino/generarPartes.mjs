// V13: saca de data/logros/roma.json y lanzarote.json el orden de los sitios de cada colección (un trozo por sitio, en ESE orden) y la clave de la pieza de Design (r1…r11 en Roma, 1…7 en Lanzarote).
//   node scripts/destino/generarPartes.mjs      → src/components/logros/dibujos/partes.ts   (pruebaV13 comprueba que sigue igual que los datos)
import fs from 'node:fs'

const leer = (f) => JSON.parse(fs.readFileSync(f, 'utf8'))
const roma = leer('data/logros/roma.json')
const lanza = leer('data/logros/lanzarote.json')
const filas = []
roma.colecciones.forEach((c, i) => filas.push({ id: c.id, destino: 'roma', col: `r${i + 1}`, sitios: c.sitios }))
lanza.colecciones.forEach((c, i) => filas.push({ id: c.id, destino: 'lanzarote', col: String(i + 1), sitios: c.sitios }))
const cuerpo = filas.map((f) => `  ${JSON.stringify(f.id)}: { destino: ${JSON.stringify(f.destino)}, col: ${JSON.stringify(f.col)}, sitios: ${JSON.stringify(f.sitios)} },`).join('\n')
const ts = `/**
 * (V13) LAS 18 INSIGNIAS, POR PARTES: para cada colección, la clave de su pieza de Design (\`Piezas/Insignia Lanza Codigo\`: r1…r11 en Roma, 1…7 en Lanzarote) y sus sitios EN EL ORDEN DE LOS DATOS (un trozo por sitio).
 * GENERADO por \`node scripts/destino/generarPartes.mjs\` desde data/logros/roma.json y lanzarote.json: no se edita a mano (si cambian los sitios, se vuelve a generar; \`pruebaV13\` lo comprueba).
 */
export interface ColeccionPorPartes {
  destino: 'roma' | 'lanzarote'
  /** La clave de la pieza de Design. */
  col: string
  /** Los sitios, en el orden de los datos: el trozo \`k\` es el sitio \`k\`. */
  sitios: string[]
}

export const COLECCIONES_POR_PARTES: Record<string, ColeccionPorPartes> = {
${cuerpo}
}
`
fs.writeFileSync('src/components/logros/dibujos/partes.ts', ts)
console.log('partes.ts:', filas.length, 'colecciones;', filas.map((f) => `${f.id}=${f.sitios.length}`).join(' '))
