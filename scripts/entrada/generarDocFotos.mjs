// (V40C) docs/dias/FOTOS_ENTRADA.md desde data/entrada/fotos.json y el peso real de cada archivo.  node scripts/entrada/generarDocFotos.mjs
import fs from 'node:fs'
const j = JSON.parse(fs.readFileSync('data/entrada/fotos.json', 'utf8'))
const kb = (f) => (fs.statSync(`public${f}`).size / 1024).toFixed(1)
const filas = [`| Roma | La portada que ya tiene el destino en la app (Coliseo) | propia | — | — | ${kb('/fotos/entrada/roma.webp')} |`]
let total = fs.statSync('public/fotos/entrada/roma.webp').size
for (const [k, f] of Object.entries(j)) {
  total += fs.statSync(`public${f.archivo}`).size
  const fuente = f.tipo === 'unsplash' ? 'Unsplash (licencia Unsplash), elegida por Eric' : `[ficha](${f.url_fuente})`
  filas.push(`| ${f.nombre}${f.pais && f.pais !== f.nombre ? ` · ${f.pais}` : ''} | \`${k}\` | ${f.autor} | ${f.licencia} | ${fuente} | ${kb(f.archivo)} |`)
}
const md = `# Fotos del mosaico de la pantalla de entrada (V39C, V40C)

WebP de 240 x 300 px en \`public/fotos/entrada/<clave>.webp\`; datos en \`data/entrada/fotos.json\`. Desde la V40C, Londres, Madrid, Lisboa, Nueva York, Shanghái, Islandia, Japón, Maldivas, Estambul y Capadocia son fotos de Eric, bajadas de Unsplash (licencia de Unsplash: uso libre, también comercial, sin obligación de citar). París, Barcelona y Ámsterdam siguen siendo de Wikimedia Commons (CC0).
Recortadas a 4:5 mirando lo importante (el Big Ben y el autobús; la Perla de Oriente; el Fuji y la pagoda; la aurora; la barca y el agua; el Chrysler; la bandera y las torres; los minaretes y la cúpula; el globo grande con su llama) y sin ninguna cara reconocible en grande. Script: \`scripts/entrada/prepararFotosV40C.mjs\`.

| Destino | Clave | Autor | Licencia | Fuente | KB |
|---|---|---|---|---|---|
${filas.join('\n')}

Peso total del mosaico: ${(total / 1024).toFixed(1)} KB (${filas.length} fotos).
`
fs.writeFileSync('docs/dias/FOTOS_ENTRADA.md', md)
console.log(`${filas.length} fotos, ${(total / 1024).toFixed(1)} KB`)
