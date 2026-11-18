// V12: busca en los textos de los datos (data/logros/*.json, data/*.json) los huecos {nombre} y comprueba, uno por uno, que el código tiene dónde rellenarlos (rellenar / replace).
// node scripts/destino/_buscarLlaves.mjs
import fs from 'node:fs'
import path from 'node:path'
const huecos = new Map() // nombre -> [archivo:ruta]
const recorrer = (v, ruta, archivo) => {
  if (typeof v === 'string') {
    for (const m of v.matchAll(/\{([a-zA-Z_ñ]+)\}/g)) {
      if (!huecos.has(m[1])) huecos.set(m[1], [])
      const l = huecos.get(m[1])
      if (l.length < 3) l.push(`${archivo}:${ruta}`)
    }
  } else if (Array.isArray(v)) v.forEach((x, i) => recorrer(x, `${ruta}[${i}]`, archivo))
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) recorrer(x, `${ruta}.${k}`, archivo)
}
for (const dir of ['data/logros', 'data']) {
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue
    try { recorrer(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')), '', path.join(dir, f)) } catch { /* no es JSON de textos */ }
  }
}
const codigo = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? codigo(path.join(d, e.name)) : /\.(js|ts|tsx|mjs)$/.test(e.name) ? [path.join(d, e.name)] : []))
const fuentes = [...codigo('server'), ...codigo('src'), ...codigo('shared')].map((f) => fs.readFileSync(f, 'utf8')).join('\n')
let mal = 0
for (const [n, donde] of [...huecos.entries()].sort()) {
  const hay = new RegExp(`\{${n}\}|[{,]\s*${n}\s*[:,}]|['"]${n}['"]\s*:|\b${n}\b\s*[:,]`).test(fuentes)
  if (!hay) { mal++; console.log(`SIN RELLENAR: {${n}}  → ${donde.join(' | ')}`) }
}
console.log(`${huecos.size} huecos distintos en los textos; ${mal} sin sitio donde rellenarlos.`)
