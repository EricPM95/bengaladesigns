// (V40) docs/sonidos/LICENCIAS_SONIDOS.md: cada archivo de Eric (nombre original) y en qué animación va, con su fuente según el nombre.  node scripts/sonidos/generarLicencias.mjs
import fs from 'node:fs'
const json = JSON.parse(fs.readFileSync('data/sonidos/estudio.json', 'utf8'))
const estudio = fs.readFileSync('src/lib/sonidos/estudio.ts', 'utf8')
const nombreDe = (id) => (estudio.match(new RegExp(`\{ id: '${id}', nombre: '([^']+)'`)) ?? [])[1] ?? id
const PIXABAY = /^(universfield|dragon-studio|floraphonic|djartmusic|fxprosound|aberrantrealities|stereogenicstudio|freesound_community)-/i
const fuente = (n) => {
  if (/^mixkit-/i.test(n)) return { fuente: 'Mixkit', licencia: 'Mixkit Sound Effects Free License (uso libre, también en una app de pago; no hay que citarlo; no se puede vender el sonido solo)', cita: 'No pide' }
  if (PIXABAY.test(n)) return { fuente: 'Pixabay (por el nombre: «autor-título-número»)', licencia: 'Pixabay Content License (uso libre, también comercial; no hay que citarlo; no se puede vender el sonido solo)', cita: 'No pide' }
  return { fuente: '¿?', licencia: '¿?', cita: '¿?' }
}
const usos = new Map()
for (const [id, a] of Object.entries(json.animaciones)) for (const c of a.capas) if (c.origen === 'archivo') (usos.get(c.nombre) ?? usos.set(c.nombre, []).get(c.nombre)).push(id)
const filas = [...usos.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([n, v]) => { const f = fuente(n); return `| \`${n}\` | ${v.map((i) => `${nombreDe(i)} (\`${i}\`)`).join(', ')} | ${f.fuente} | ${f.licencia} | ${f.cita} |` })
const md = `# Licencias de los sonidos de Eric (V40)

Los sonidos que Eric eligió en el estudio y que ahora suenan en la app (todo menos Lanzarote, que llegará en otro zip). La fuente sale del nombre del archivo; donde no se ve claro está en «¿?» para que Eric lo rellene.
Las licencias de Pixabay y Mixkit permiten el uso comercial sin citar al autor. Los créditos de la app los nombran igualmente, por cortesía. Fuente de los datos: \`data/sonidos/estudio.json\` (el zip \`SONIDO_dEFINITIVO.zip\`).

| Archivo original | Animación | Fuente | Licencia | ¿Pide citarlo? |
|---|---|---|---|---|
${filas.join('\n')}

Sonidos «¿?»: los pone Eric (no se ve de dónde vienen por el nombre; pueden ser suyos o de otra fuente).
`
fs.writeFileSync('docs/sonidos/LICENCIAS_SONIDOS.md', md)
console.log(`${usos.size} archivos`)
