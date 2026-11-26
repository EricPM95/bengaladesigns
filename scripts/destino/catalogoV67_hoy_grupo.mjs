// CATALOGO V67 (HOY, Roma): el aviso de arriba «Hoy ya no llegas a 3 sitios» (tres sitios del mismo tipo, juntos en una frase), SIN la hoja «Hoy ya no da tiempo» encima (se da por dicha). Solo captura; no toca la app.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/catalogoV67_hoy_grupo.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrir, montarHoy, R } from './catalogo_comun.mjs'

const CAP = path.resolve('docs/dias/_catalogoV67_hoy_tmp')
fs.mkdirSync(CAP, { recursive: true })
const c = await abrir()
const { a, ev } = c
try {
  // Tres sitios con hora de tarde que ya han cerrado (19:45), en la copia del viaje de prueba.
  const mut = `const d0 = r.days.find((d) => !d.isReturnLeg); const S = d0.stops; ['Museos Capitolinos', 'Museos Vaticanos y Capilla Sixtina', 'Galería Borghese'].forEach((n, i) => { const q = S[i]; q.name = n; q.fullName = n; q.reservationTime = undefined; q.reservedId = undefined; q.hoursData = null; q.time = ['19:00', '19:20', '19:40'][i]; q.durationMinutes = 40 })`
  await montarHoy(c, 19 * 60 + 45, { mut, fecha: '2026-10-17' })
  // Se da por dicha la hoja «Hoy ya no da tiempo» y se vuelve a montar HOY, para ver solo el aviso de arriba.
  await ev(`(async () => { const r = ${R}.getState().route; (await import('/src/lib/avisosUnaVez.ts')).marcarDicho(r.id, '2026-10-17', 'ya-no-da-tiempo'); return true })()`)
  await ev(`${R}.getState().setMode('explore')`)
  await a.esp(600)
  await ev(`${R}.getState().setMode('today')`)
  await a.esp(3500)
  for (let i = 0; i < 3; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Dejarlo como está|Continuar|Entendido)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(800)
  }
  await a.evaluar('window.scrollTo(0, 0); true')
  await a.esp(700)
  console.log('avisos', await a.evaluar("JSON.stringify(Array.from(document.querySelectorAll('[data-hoy-aviso-fila]')).map((e) => e.innerText.replace(/\\s+/g, ' ')))"))
  await a.captura(path.join(CAP, 'grupo.jpg'))
} finally {
  a.cerrar()
}
process.exit(0)
