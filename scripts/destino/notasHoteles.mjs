// (V21) Vuelve a mirar en Booking la nota y las opiniones de cada hotel de data/dias/<destino>/_hoteles.json y las deja al día (con la fecha de hoy). Correrlo ANTES de cada tanda de destino.
//   node scripts/destino/notasHoteles.mjs [roma|lanzarote|todos]
// Abre cada ficha con un Chrome sin ventana (UNO a la vez, y se cierra solo) y lee la nota y el número de opiniones que Booking da en la propia página (`aggregateRating`). Si Booking pide comprobar que eres una
// persona o no se puede leer, esa nota se queda como estaba y lo dice. Si un hotel baja de 9, lo dice al final («AVISO»). No se inventa nada.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((f) => fs.existsSync(f))
if (!CHROME) throw new Error('No encuentro Chrome.')
const destinos = process.argv[2] && process.argv[2] !== 'todos' ? [process.argv[2]] : ['roma', 'lanzarote']
const hoy = new Date().toISOString().slice(0, 10)
const avisos = []

/** Pura: de la página de un hotel saca { nota, opiniones } (la escala de Booking es de 10), o null. */
export function notaDeLaPagina(html) {
  const i = html.indexOf('aggregateRating')
  if (i < 0) return null
  const bloque = html.slice(i, i + 400)
  const nota = Number(/"ratingValue"\s*:\s*([\d.]+)/.exec(bloque)?.[1])
  const opiniones = Number(/"reviewCount"\s*:\s*(\d+)/.exec(bloque)?.[1])
  return Number.isFinite(nota) && Number.isFinite(opiniones) ? { nota, opiniones } : null
}

function leerHotel(url) {
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'hoteles-'))
  try {
    const r = spawnSync(CHROME, ['--headless=new', '--disable-gpu', `--user-data-dir=${perfil}`, '--virtual-time-budget=15000', '--dump-dom', url], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 90_000 })
    return notaDeLaPagina(r.stdout ?? '')
  } finally {
    fs.rmSync(perfil, { recursive: true, force: true })
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('notasHoteles.mjs')) {
  for (const destino of destinos) {
    const archivo = `data/dias/${destino}/_hoteles.json`
    if (!fs.existsSync(archivo)) continue
    const datos = JSON.parse(fs.readFileSync(archivo, 'utf8'))
    for (const h of datos.hoteles) {
      if (!h.booking || h.pendiente) continue
      const r = leerHotel(h.booking)
      if (!r) {
        console.log(`  ${h.nombre}: no se pudo leer la nota (¿Booking pide comprobar?) — se queda ${h.nota} · ${h.opiniones}`)
        continue
      }
      console.log(`  ${h.nombre}: ${h.nota} · ${h.opiniones} → ${r.nota} · ${r.opiniones}`)
      h.nota = r.nota
      h.opiniones = r.opiniones
      h.nota_de = hoy
      if (r.nota < 9) avisos.push(`${destino} · ${h.nombre} baja de 9: ${r.nota}`)
    }
    fs.writeFileSync(archivo, JSON.stringify(datos, null, 2) + '\n')
  }
  for (const a of avisos) console.log('AVISO', a)
  if (avisos.length === 0) console.log('Todos los hoteles siguen en 9 o más.')
}
