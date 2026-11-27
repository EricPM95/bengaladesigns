// V77 (agente B) · nombres cortos, consejos de las excursiones, la escala. PRUEBA PURA (sin navegador, sin servidor, sin Supabase).
//   node scripts/destino/pruebaV77_b.mjs
// 1. `nombre_corto` en los datos de Lanzarote (los cuatro de Eric) y «Lo mejor:» (`fraseDeCierre`) los usa y pone primero a los imprescindibles.
// 2. Los consejos (`data/dias/<destino>/_consejos.json`): 2 o 3 por grupo, icono válido, frase corta con su fuente, sin «protector» y «sombrero» a la vez, sin «abrigo» ni «documento» fijos; `consejosDe` los encuentra por id o por título.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const fallos = []
let n = 0
const debe = (cond, regla, texto) => {
  n++
  console.log(cond ? '  ok' : '  MAL', regla, String(texto).slice(0, 200))
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => JSON.parse(fs.readFileSync(f, 'utf8'))

// ═══ 1. Nombres cortos ═══
const lz = leer('data/pipeline_v2/lanzarote.json')
const corto = (id) => lz.places.find((p) => p.id === id)?.nombre_corto
debe(corto('montanas_del_fuego') === 'Timanfaya' && corto('la_geria_y_sus_bodegas') === 'La Geria' && corto('las_grietas_montana_blanca') === 'Las Grietas' && corto('jameos_del_agua') === 'los Jameos', 'lanzarote-cortos', 'Timanfaya, La Geria, Las Grietas y los Jameos')
const roma = leer('data/pipeline_v2/roma.json')
debe(roma.places.every((p) => !('nombre_corto' in p)), 'roma-sin-cortos', 'Roma NO lleva nombres cortos hasta que Eric los apruebe (DECISIONES_V77)')

// «Lo mejor:» (`fraseDeCierre`, BloquesHoy.tsx, arrastra media app: no se carga en Node): se comprueba su código y se ve en la captura de Lanzarote (capturasV77_b1.mjs).
const bloques = fs.readFileSync('src/components/route/hoy/v2/BloquesHoy.tsx', 'utf8')
debe(bloques.includes('nombreCorto?.(s.name) ?? elSitio(') && bloques.includes('imprescindibles = pesoDe ? visitas.filter'), 'lo-mejor-codigo', '«Lo mejor:» usa el nombre corto y pone primero a los imprescindibles')
debe(fs.readFileSync('server/index.js', 'utf8').includes('nombres_cortos_lista') && fs.readFileSync('src/components/route/hoy/v2/HoyDuranteV2.tsx', 'utf8').includes('info.nombresCortosLista[nombre]'), 'lo-mejor-cableado', 'el servidor da los nombres cortos y HOY se los pasa')

// ═══ 2. Consejos ═══
fs.mkdirSync('node_modules/.v77b', { recursive: true })
const salida2 = path.resolve('node_modules/.v77b/c.mjs')
const r2 = await build({ stdin: { contents: "export * from './src/lib/consejosDelDia.ts'", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'error', define: { 'import.meta.env': '{}' } })
fs.writeFileSync(salida2, r2.outputFiles[0].text)
const c = await import(pathToFileURL(salida2).href)
const ICONOS = ['agua', 'calzado', 'banador', 'protector', 'sombrero', 'abrigo', 'efectivo', 'documento', 'ropa', 'coche']
for (const destino of ['roma', 'lanzarote']) {
  const f = `data/dias/${destino}/_consejos.json`
  debe(fs.existsSync(f), `${destino}-archivo`, f)
  const d = leer(f)
  for (const g of d.grupos) {
    const t = `${destino}/${g.id}`
    debe(g.consejos.length >= 1 && g.consejos.length <= 3, `${t}-cuantos`, `${g.consejos.length} consejos (máximo 3)`)
    debe(g.consejos.every((c) => ICONOS.includes(c.icono) && c.palabra && c.frase && c.fuente && c.frase.length <= 60), `${t}-forma`, 'icono válido, palabra, frase corta y fuente')
    debe(!(g.consejos.some((c) => c.icono === 'protector') && g.consejos.some((c) => c.icono === 'sombrero')) || g.id === 'x', `${t}-sin-repetir`, 'protector y sombrero no van los dos (uno solo: gorra y protector)')
    debe(g.consejos.every((c) => c.icono !== 'abrigo' && c.icono !== 'documento'), `${t}-sin-abrigo-ni-documento`, 'abrigo solo con pronóstico de frío y documento solo si la web oficial lo pide: no van fijos')
    debe(g.consejos.every((c) => !c.frase.includes(': ')), `${t}-sin-dos-puntos`, 'la frase no lleva otros dos puntos')
    debe(new Set(g.consejos.map((c) => c.icono)).size === g.consejos.length, `${t}-sin-iconos-repetidos`, 'cada icono una vez')
  }
}
if (c.consejosDe) {
  const roma_ = leer('data/dias/roma/_consejos.json')
  const lz_ = leer('data/dias/lanzarote/_consejos.json')
  debe(c.consejosDe(roma_, ['pompeya_sorrento'], []).length === 3 && c.consejosDe(roma_, [], ['Excursión a Pompeya y Sorrento']).length === 3, 'pompeya', 'por id y por título')
  debe(c.consejosDe(roma_, ['napoles_pompeya_tren'], []).length === 3, 'napoles', 'Nápoles y Pompeya en tren: los de Pompeya')
  debe(c.consejosDe(roma_, ['florencia_pisa'], []).length >= 1 && c.consejosDe(roma_, ['tivoli'], []).length === 2, 'florencia-tivoli', 'Florencia y Tívoli')
  debe(c.consejosDe(lz_, ['DG'], []).length === 3 && c.consejosDe(lz_, ['D4'], ['Papagayo y Playa Blanca']).length === 3, 'lanzarote', 'La Graciosa (DG) y Papagayo (D4)')
  debe(c.consejosDe(lz_, ['D2'], ['El norte de Manrique']).length === 0 && c.consejosDe(roma_, ['D1'], ['Centro histórico']).length === 0 && c.consejosDe(null, ['DG'], []).length === 0, 'sin-consejos', 'un día normal o sin archivo: nada (la línea no sale)')
}
console.log(`\n${n} comprobaciones, ${fallos.length} fallos.`)
process.exit(fallos.length ? 1 : 0)
