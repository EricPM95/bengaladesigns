// Guarda en local las candidatas de docs/FOTOS_ROMA_CANDIDATAS.html (3-oct-2026): docs/fotos_candidatas/<lugar> - <número>.jpg, de unos 600 px de ancho.
//   node scripts/destino/descargarCandidatas.mjs
// Solo para revisarlas: no cambia ninguna foto de la app. Lee docs/_candidatas_commons.json (lo escribe candidatasCommons.mjs).
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const OUT = 'docs/fotos_candidatas'
mkdirSync(OUT, { recursive: true })
const results = JSON.parse(readFileSync('docs/_candidatas_commons.json', 'utf8'))
// El nombre del archivo: el lugar tal como sale en la página (sin los caracteres que Windows no admite) y el número de la candidata.
const safe = (name) => name.replace(/:\s*/g, ', ').replace(/[\\/*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim()
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let saved = 0
const missing = []
for (const { place, picked } of results) {
  for (let i = 0; i < picked.length; i++) {
    const target = `${OUT}/${safe(place.n)} - ${i + 1}.jpg`
    if (existsSync(target)) {
      saved++
      continue
    }
    const tmp = `${OUT}/_tmp.jpg`
    let ok = false
    for (let attempt = 0; attempt < 5 && !ok; attempt++) {
      const response = await fetch(picked[i].thumb, { headers: { 'user-agent': 'route-planner-candidatas/1.0 (contacto: bengala.ingresos@gmail.com)' } })
      if (response.ok) {
        writeFileSync(tmp, Buffer.from(await response.arrayBuffer()))
        ok = true
      } else await sleep(2000 * (attempt + 1))
    }
    if (!ok) {
      missing.push(target)
      continue
    }
    try {
      execFileSync('powershell', ['-NoProfile', '-File', 'scripts/destino/redimensionar.ps1', tmp, target, '600'], { stdio: 'ignore' })
    } catch {
      missing.push(target)
    }
    saved++
    await sleep(400)
  }
}
if (existsSync(`${OUT}/_tmp.jpg`)) unlinkSync(`${OUT}/_tmp.jpg`)
console.log(`${saved} guardadas, ${missing.length} sin descargar`, missing)
