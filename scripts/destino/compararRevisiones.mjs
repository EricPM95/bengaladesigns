/**
 * Qué cambia entre dos revisiones con los mismos viajes (revisionLib.mjs): los días de cada viaje (bloques o días
 * curados), la tabla resumen y lo raro.
 *
 *   node scripts/destino/compararRevisiones.mjs antes.md despues.md salida.md "título"
 */

import { readFileSync, writeFileSync } from 'node:fs'

const [, , antesPath, despuesPath, salida, titulo = 'Qué cambia entre las dos revisiones'] = process.argv
const antes = readFileSync(antesPath, 'utf8').replace(/\r\n/g, '\n')
const despues = readFileSync(despuesPath, 'utf8').replace(/\r\n/g, '\n')

/** Los viajes: título, días (lo que lleva cada día) y la fila del resumen. */
function viajes(text) {
  const out = new Map()
  const partes = text.split(/\n(?=## Viaje \d+ — )/).slice(1)
  for (const parte of partes) {
    const numero = Number(/^## Viaje (\d+)/.exec(parte)[1])
    const titulo = /^## Viaje \d+ — (.*)$/m.exec(parte)[1]
    const dias = parte.split(/\n(?=### Día \d+)/).slice(1).map((dia) => {
      const curado = /- \*\*Día curado\*\*: (\S+)[^\n]*?(?: · variantes: ([^\n·]+))?(?:\n|$)/.exec(dia)
      if (curado) return `${curado[1]}${curado[2] ? ` (${curado[2].trim()})` : ''}`
      const manana = /- \*\*Mañana\*\*: [^\n]*?`([^`]+)`/.exec(dia)?.[1] ?? (/Mañana\*\*: \*\*medio día sin tipo/.test(dia) ? 'sin tipo' : null)
      const tarde = /- \*\*Tarde\*\*: [^\n]*?`([^`]+)`/.exec(dia)?.[1] ?? (/Tarde\*\*: \*\*medio día sin tipo/.test(dia) ? 'sin tipo' : null)
      if (/Excursión de día completo/.test(dia)) return 'excursión'
      return [manana, tarde].filter(Boolean).join(' + ') || '—'
    })
    const faltan = /- \*\*Imprescindibles que no salen\*\*: ([^\n]*)/.exec(parte)?.[1] ?? ''
    out.set(numero, { titulo, dias, faltan })
  }
  const resumen = new Map()
  for (const line of text.split('\n')) {
    const m = /^\| \[(\d+)\]\(#viaje-\d+\) \| (.*) \|$/.exec(line)
    if (m) resumen.set(Number(m[1]), m[2].split(' | '))
  }
  const raros = (text.split('### Caso a caso')[1] ?? '').split('\n').filter((line) => line.startsWith('- **Viaje'))
  return { out, resumen, raros }
}

const A = viajes(antes)
const B = viajes(despues)
const cols = ['Tipo', 'Paradas por día', 'Madrugones', 'Comidas cortas', 'Huecos sin nombre', 'Más de 2 veces', 'Día y noche', 'Pool', 'Imprescindibles que faltan']
const lines = [`# ${titulo}`, '', `Antes: \`${antesPath}\`. Después: \`${despuesPath}\`. Mismos ${B.out.size} viajes.`, '', '## Por viaje', '', '| Viaje | Días antes (mañana + tarde) | Días ahora | Qué más cambia |', '|---|---|---|---|']
for (const [numero, viaje] of B.out) {
  const previo = A.out.get(numero)
  const ra = A.resumen.get(numero) ?? []
  const rb = B.resumen.get(numero) ?? []
  const cambios = cols.slice(1).map((col, i) => (ra[i + 1] !== rb[i + 1] ? `${col}: ${ra[i + 1] ?? '—'} → ${rb[i + 1] ?? '—'}` : null)).filter(Boolean)
  lines.push(`| ${numero} · ${viaje.titulo.split(' · ').slice(0, 3).join(' · ')} | ${(previo?.dias ?? []).map((d, i) => `día ${i + 1}: ${d}`).join('<br>')} | ${viaje.dias.map((d, i) => `día ${i + 1}: ${d}`).join('<br>')} | ${cambios.length ? cambios.join('<br>') : 'nada más'} |`)
}
const suma = (R, i) => [...R.resumen.values()].reduce((sum, row) => sum + (Number(row[i]) || 0), 0)
const cuenta = (R, i) => [...R.resumen.values()].filter((row) => row[i] && row[i] !== '—' && row[i] !== 'ok').length
lines.push('', '## En total', '', '| | Antes | Ahora |', '|---|---|---|')
lines.push(`| Madrugones | ${suma(A, 2)} | ${suma(B, 2)} |`)
lines.push(`| Comidas acortadas | ${suma(A, 3)} | ${suma(B, 3)} |`)
lines.push(`| Huecos de más de 30 min sin nombre | ${suma(A, 4)} | ${suma(B, 4)} |`)
lines.push(`| Viajes con algo más de 2 veces | ${cuenta(A, 5)} | ${cuenta(B, 5)} |`)
lines.push(`| Viajes con día y noche el mismo día | ${cuenta(A, 6)} | ${cuenta(B, 6)} |`)
lines.push(`| Viajes con el pool mal (falta o solo de paso) | ${cuenta(A, 7)} | ${cuenta(B, 7)} |`)
lines.push(`| Viajes con imprescindibles que faltan | ${cuenta(A, 8)} | ${cuenta(B, 8)} |`)
lines.push(`| Cosas raras (caso a caso) | ${A.raros.length} | ${B.raros.length} |`)
lines.push('', '## Lo raro que desaparece', '', ...(A.raros.filter((r) => !B.raros.includes(r)).length ? A.raros.filter((r) => !B.raros.includes(r)) : ['- Nada.']))
lines.push('', '## Lo raro nuevo', '', ...(B.raros.filter((r) => !A.raros.includes(r)).length ? B.raros.filter((r) => !A.raros.includes(r)) : ['- Nada.']), '')
writeFileSync(salida, lines.join('\n'))
console.log(`→ ${salida}`)
