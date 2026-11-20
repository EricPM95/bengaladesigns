// (V28 y 20-nov) Pone en data/dias/roma/_entradas.json el enlace de cada entrada, con la regla de Eric:
//   · la página EXACTA de Civitatis si la hay (las de confianza «alta» de data/dias/roma/_enlaces_civitatis.json) y, por decisión de Eric (20-nov), las TRES combinadas que sí incluyen la entrada a ese sitio:
//     Coliseo/Foro (entrada conjunta con audioguía), Altar de la Patria (terrazas) y Cripta de los Capuchinos (visita guiada con la cripta);
//   · si Civitatis no la tiene: `sin_civitatis: true` (nunca el buscador) y, si el sitio tiene web oficial de entradas, `oficial` (de data/dias/roma/_webs_oficiales_entradas.json, sin aid);
//   · sin web oficial segura: ningún botón.
//   node scripts/destino/aplicarEnlacesCivitatis.mjs
import fs from 'node:fs'
const ent = JSON.parse(fs.readFileSync('data/dias/roma/_entradas.json', 'utf8'))
const enl = JSON.parse(fs.readFileSync('data/dias/roma/_enlaces_civitatis.json', 'utf8'))
const webs = fs.existsSync('data/dias/roma/_webs_oficiales_entradas.json') ? JSON.parse(fs.readFileSync('data/dias/roma/_webs_oficiales_entradas.json', 'utf8')).sitios : {}
const DECIDIDAS = new Set(['Coliseo', 'Foro Romano y Palatino', 'Altar de la Patria', 'Cripta de los Capuchinos'])
let civitatis = 0
let oficiales = 0
let sinBoton = 0
for (const e of enl.entradas) {
  if (e.lugar === 'Free Tour') continue
  const variante = (ent.lugares[e.lugar] ?? []).find((v) => v.nombre === e.variante)
  if (!variante) {
    console.log('SIN VARIANTE', e.lugar, e.variante)
    continue
  }
  if (e.url && (e.confianza === 'alta' || DECIDIDAS.has(e.lugar))) {
    variante.url = e.url
    delete variante.sin_civitatis
    delete variante.oficial
    civitatis++
    continue
  }
  variante.url = null
  variante.sin_civitatis = true
  const web = webs[e.lugar]?.url ?? null
  if (web) {
    variante.oficial = web
    oficiales++
  } else {
    delete variante.oficial
    sinBoton++
  }
}
fs.writeFileSync('data/dias/roma/_entradas.json', JSON.stringify(ent, null, 2) + '\n')
console.log(`Civitatis con su página: ${civitatis} · web oficial: ${oficiales} · sin botón: ${sinBoton}`)
