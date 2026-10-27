import fs from 'node:fs'
const s = fs.readFileSync('src/components/pase/pelicula/gen/Pase_Pelicula.ts', 'utf8')
const m = /export const plantilla = (\[.*?\])\nexport const css/s.exec(s)
const ast = JSON.parse(m[1])
const movil = ast[0].c[0]
const tx = (n) => (typeof n === 'string' ? n : (n.c ?? []).map(tx).join(''))
const que = process.argv[2]
for (const h of movil.c) {
  if (typeof h === 'string' || !h.i) continue
  if (que && !h.i.includes(que)) continue
  console.log('=== ', h.i)
  const d = h.c?.[0]
  const rec = (n, nivel) => {
    if (typeof n === 'string' || nivel > (Number(process.argv[3]) || 3)) return
    const st = n.a?.style ?? ''
    const pos = /(?:^|;)(left|right|top|bottom|width|height|inset)\s*:[^;]*/g
    const pp = (st.match(pos) ?? []).map((x) => x.replace(/^;/, '')).join(' ')
    console.log('  '.repeat(nivel) + (n.t ?? (n.i ? 'IF ' + n.i : n.f ? 'FOR' : n.imp ? 'IMP ' + n.imp : '?')) + ' ' + pp.slice(0, 110) + ' | ' + tx(n).replace(/\s+/g, ' ').slice(0, 50))
    for (const c of n.c ?? []) rec(c, nivel + 1)
  }
  rec(d, 0)
}
