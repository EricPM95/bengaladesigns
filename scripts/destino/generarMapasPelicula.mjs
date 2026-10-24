// Los mapas de la película (Tanda 10I), ya calculados: Design los bajaba de jsdelivr (world-atlas) y los proyectaba al abrir; aquí se proyectan UNA vez, con la misma función de Design,
// y quedan dentro de la app (src/components/pase/pelicula/mapas.ts). Hace falta la carpeta de world-atlas@2 (npm pack world-atlas@2 y descomprimir):
//   node scripts/destino/generarMapasPelicula.mjs <carpeta de world-atlas>/package
import fs from 'node:fs'

const dir = process.argv[2]
if (!dir) throw new Error('Falta la carpeta de world-atlas (la que lleva land-50m.json).')
const diseno = fs.readFileSync('docs/diseno/proyecto/Piezas/Pase Pelicula.dc.html', 'utf8')
const ini = diseno.indexOf('function landProj(')
const fin = diseno.indexOf('class Component extends DCLogic', ini)
const landProj = new Function(`${diseno.slice(ini, fin)}\nreturn landProj`)()
const leer = (f) => JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8'))
const land = landProj(leer('land-50m.json'), 'land')
const countries = landProj(leer('countries-50m.json'), 'countries')
const c110 = leer('countries-110m.json')
fs.writeFileSync(
  'src/components/pase/pelicula/mapas.ts',
  `// GENERADO por scripts/destino/generarMapasPelicula.mjs (world-atlas@2, ISC) — no editar a mano.
// land / countries: los trazos que dibuja la escena 4 (el mismo cálculo de Design, hecho una vez); countries110: el mapa del globo de la escena de pasaportes.
export const MAPAS = {
  land: ${JSON.stringify(land)},
  countries: ${JSON.stringify(countries)},
  countries110: ${JSON.stringify(c110)},
}
`,
)
console.log('land', (land.length / 1024).toFixed(0), 'KB; countries', (countries.length / 1024).toFixed(0), 'KB; 110m', (JSON.stringify(c110).length / 1024).toFixed(0), 'KB')
