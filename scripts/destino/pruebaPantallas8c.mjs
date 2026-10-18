// La prueba de las pantallas de la Tanda 8C2 (botón y hoja de logros, vitrina, destinos, colecciones, «¿Dónde has estado ya?», Perfil y marcos, pasaporte, EXP a la vista, Compartir).
//   node scripts/destino/pruebaPantallas8c.mjs
// No toca el motor de rutas. Cada parte de las pantallas tiene su archivo en `scripts/destino/pruebas8c/*.mjs`, que exporta `titulo` y una función por defecto `({ debe, leer, archivos, sinComentarios })`;
// aquí se cargan todos en orden y se cuentan juntos. `debe(condicion, regla, texto)` apunta un fallo si la condición no se cumple.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
const archivos = (dir, ext = /\.(ts|tsx)$/) => (fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? archivos(path.join(dir, e.name), ext) : ext.test(e.name) ? [path.join(dir, e.name)] : [])) : [])

const carpeta = 'scripts/destino/pruebas8c'
const modulos = fs.existsSync(carpeta) ? fs.readdirSync(carpeta).filter((f) => f.endsWith('.mjs')).sort() : []
for (const f of modulos) {
  const m = await import(pathToFileURL(path.resolve(carpeta, f)).href)
  console.log(m.titulo ?? f)
  const antes = fallos.length
  try {
    await m.default({ debe, leer, archivos, sinComentarios })
  } catch (e) {
    fallos.push({ regla: f, texto: `la prueba se ha roto: ${e.stack ?? e.message}` })
  }
  console.log(`   ${fallos.length === antes ? 'sin fallos' : `${fallos.length - antes} fallo(s)`}`)
}

console.log('Capturas: ninguna repetida, byte a byte')
{
  const dir = 'docs/dias/capturas_8c'
  const vistas = new Map()
  const repetidas = []
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir).filter((x) => /\.(jpg|png|webp)$/i.test(x))) {
      const h = crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, f))).digest('hex')
      if (vistas.has(h)) repetidas.push(`${vistas.get(h)} = ${f}`)
      else vistas.set(h, f)
    }
  }
  debe(repetidas.length === 0, 'capturas', `ninguna captura repetida (dos nombres, mismo archivo): ${repetidas.join(' | ')}`)
  console.log(`   ${vistas.size} capturas`)
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
