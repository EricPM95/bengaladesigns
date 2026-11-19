// (V28) Pone en data/dias/roma/_entradas.json la página EXACTA de Civitatis de cada entrada (la que encontró la búsqueda de data/dias/roma/_enlaces_civitatis.json).
// Solo las de confianza «alta» (misma entrada, mismo contenido). Las dudosas y las que Civitatis no vende NO se tocan: quedan para Eric («PARA ERIC», con sus candidatas). Nada se adivina.
//   node scripts/destino/aplicarEnlacesCivitatis.mjs
import fs from 'node:fs'
const ent = JSON.parse(fs.readFileSync('data/dias/roma/_entradas.json', 'utf8'))
const enl = JSON.parse(fs.readFileSync('data/dias/roma/_enlaces_civitatis.json', 'utf8'))
let puestas = 0
for (const e of enl.entradas) {
  if (e.confianza !== 'alta' || !e.url || e.lugar === 'Free Tour') continue
  const variante = (ent.lugares[e.lugar] ?? []).find((v) => v.nombre === e.variante)
  if (!variante) { console.log('SIN VARIANTE', e.lugar, e.variante); continue }
  variante.url = e.url
  puestas++
}
fs.writeFileSync('data/dias/roma/_entradas.json', JSON.stringify(ent, null, 2) + '\n')
console.log('urls puestas:', puestas)
