/**
 * AUDITORÍA DE FOTOS (Tanda 8B2, solo lectura). Calcula qué foto pide la app para cada sitio de un destino con la MISMA lógica que el servidor
 * (server/index.js › /api/place-photo): 1) foto propia de data/dias/<destino>/_fotos.json (con su ventana de fechas), 2) «sin foto» (restaurantes, sin_foto,
 * fotos_rechazadas), 3) la que traiga Unsplash / Wikipedia (caché compartida) y 4) la foto de otro sitio de su misma zona (zonePhotoFor).
 *
 *   node scripts/destino/auditoriaFotos.mjs [roma] [--fecha 2026-10-18] [--servidor http://localhost:8787] [--json]
 *
 * Sin `--servidor` no llama a nada: los sitios que dependen de Unsplash / Wikipedia salen como «externa (no calculable sin servidor)».
 * Con `--servidor` pregunta a /api/place-photo con la fecha dada (OJO: eso es lo que hace la app; el servidor puede guardar en su caché lo que busque por primera vez).
 * No escribe, no borra y no cambia ninguna foto.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fotoOculta, ownPhotoFile, photosFor } from '../../server/engine/writtenDays.js'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const args = process.argv.slice(2)
const valor = (nombre) => {
  const i = args.indexOf(nombre)
  return i >= 0 ? args[i + 1] : null
}
const destino = args.find((a) => !a.startsWith('--') && a !== valor('--fecha') && a !== valor('--servidor')) ?? 'roma'
const fecha = valor('--fecha') ?? '2026-10-18'
const servidor = valor('--servidor')
const salidaJson = args.includes('--json')

const datos = JSON.parse(readFileSync(join(RAIZ, 'data', 'pipeline_v2', `${destino}.json`), 'utf8'))
const tabla = photosFor(destino)
const nombresRestaurantes = new Set((datos.restaurants ?? []).map((r) => r.name))
const lugares = datos.places ?? []

/** Igual que zonePhotoFor del servidor: una foto propia de DÍA de otro sitio de su zona (primero uno de nivel 1). */
function fotoDeZona(lugar) {
  if (!lugar.zone || !tabla) return null
  const candidatas = (tabla.fotos ?? [])
    .filter((foto) => foto.cuando !== 'noche' && !foto.verificar && !foto.fechas)
    .map((foto) => ({ foto, otro: (foto.lugares ?? []).map((n) => lugares.find((c) => c.name === n)).find((c) => c && c.zone === lugar.zone && c.name !== lugar.name) }))
    .filter((x) => x.otro)
    .sort((a, b) => (a.otro.level ?? 3) - (b.otro.level ?? 3) || a.foto.archivo.localeCompare(b.foto.archivo))
  const elegida = candidatas[0]
  if (!elegida) return null
  const propia = ownPhotoFile(tabla, elegida.otro.name, fecha)
  return propia ? { archivo: propia.archivo, deSitio: elegida.otro.name } : null
}

async function pedirAlServidor(nombre) {
  try {
    const r = await fetch(`${servidor}/api/place-photo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: nombre, city: datos.destination, date: fecha }) })
    return r.ok ? await r.json() : null
  } catch {
    return null
  }
}

const filas = []
for (const lugar of lugares) {
  const nombre = lugar.name
  const fila = { sitio: nombre, zona: lugar.zone ?? null, nivel: lugar.level ?? null, origen: '', foto: null, nota: '' }
  const propia = ownPhotoFile(tabla, nombre, fecha)
  const ventanaSola = (tabla?.fotos ?? []).filter((f) => (f.lugares ?? []).includes(nombre))
  if (propia) {
    fila.origen = 'propia'
    fila.foto = propia.archivo
  } else if (fotoOculta(destino, nombre) || nombresRestaurantes.has(nombre)) {
    fila.origen = 'sin foto'
  } else {
    fila.origen = servidor ? 'externa' : 'externa (no calculable sin servidor)'
    if (ventanaSola.length > 0) fila.nota = `Su foto propia (${ventanaSola.map((f) => f.archivo + (f.fechas ? ` solo ${f.fechas.desde} a ${f.fechas.hasta}` : f.verificar ? ' (verificar)' : '')).join(', ')}) no vale en ${fecha}.`
    if (servidor) {
      const r = await pedirAlServidor(nombre)
      if (r?.photo_source === 'unsplash' || r?.photo_source === 'wikipedia') {
        fila.origen = r.photo_source
        fila.foto = r.photo_url
      } else if (r?.photo_source === 'propia') {
        fila.origen = r.photo_zone ? 'foto de la zona' : 'propia'
        fila.foto = r.photo_url
      } else {
        fila.origen = 'sin foto'
      }
    } else {
      const zona = fotoDeZona(lugar)
      if (zona) fila.nota += ` Si no hay otra, cogería la de ${zona.deSitio} (${zona.archivo}).`
    }
  }
  filas.push(fila)
}

// Repetidas: la misma foto (el mismo archivo o la misma dirección, sin parámetros) en sitios distintos.
const clave = (foto) => (foto ? foto.replace(/\?.*$/, '').replace(/_p\.jpg$/, '.jpg') : null)
const porFoto = new Map()
for (const fila of filas) {
  const k = clave(fila.foto)
  if (!k) continue
  if (!porFoto.has(k)) porFoto.set(k, [])
  porFoto.get(k).push(fila.sitio)
}
const repetidas = [...porFoto.entries()].filter(([, sitios]) => sitios.length > 1).map(([foto, sitios]) => ({ foto, sitios }))

// Sospechosas: una foto propia de otra época o noche puesta como foto de día, ventana de fechas sin cubrir, etc.
const sospechosas = []
for (const f of tabla?.fotos ?? []) {
  if (f.cuando === 'dia' && /noche|navidad/i.test(f.archivo) && f.lugares?.some((l) => !/\(noche\)$/.test(l))) sospechosas.push({ foto: f.archivo, motivo: 'foto de noche o de Navidad como foto de día', lugares: f.lugares, fechas: f.fechas ?? null })
}
for (const fila of filas) if (fila.nota.includes('no vale')) sospechosas.push({ sitio: fila.sitio, motivo: fila.nota })

const resumen = filas.reduce((acc, f) => ((acc[f.origen] = (acc[f.origen] ?? 0) + 1), acc), {})
if (salidaJson) {
  console.log(JSON.stringify({ destino, fecha, servidor: servidor ?? null, resumen, repetidas, sospechosas, filas }, null, 2))
} else {
  console.log(`Auditoría de fotos · ${destino} · fecha ${fecha} · ${servidor ? 'con servidor ' + servidor : 'sin servidor'}`)
  console.log(`${filas.length} sitios:`, resumen)
  console.log(`\nFotos repetidas en sitios distintos: ${repetidas.length}`)
  for (const r of repetidas) console.log(`  ${r.foto}\n    → ${r.sitios.join(' | ')}`)
  console.log(`\nSospechosas: ${sospechosas.length}`)
  for (const s of sospechosas) console.log('  ' + JSON.stringify(s))
  console.log('\nDetalle:')
  for (const f of filas) console.log(`  ${f.sitio.padEnd(48)} ${f.origen.padEnd(14)} ${f.foto ?? ''}${f.nota ? '  · ' + f.nota : ''}`)
}
