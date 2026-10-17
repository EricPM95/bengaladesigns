/**
 * AUDITORÍA DE FOTOS (Tanda 8B2 y 8B3, solo lectura). Calcula qué foto pide la app para cada sitio de un destino con las MISMAS reglas que el servidor (server/index.js › /api/place-photo):
 *   1) foto propia de data/dias/<destino>/_fotos.json (con su ventana de fechas);
 *   2) «sin foto»: restaurantes, `sin_foto`, `fotos_rechazadas` y los sitios cuyas fotos propias son todas de unas fechas (Navidad) fuera de ellas;
 *   3) la de Unsplash / Wikipedia (caché compartida; los sitios IMPORTANTES, los de nivel 1, nunca la de Wikipedia).
 * Ya no existe la foto «de otro sitio de su zona» (8B3: sin foto antes que una equivocada).
 *
 *   node scripts/destino/auditoriaFotos.mjs [roma] [--fecha 2026-10-18] [--servidor http://localhost:8787] [--json]
 *
 * SALE CON CÓDIGO 1 (para la prueba) si falla alguna de estas reglas:
 *   - un sitio importante con foto de Wikipedia o con la de otro sitio (solo se ve con --servidor);
 *   - la misma foto en sitios distintos;
 *   - una foto de Navidad / de unas fechas puesta fuera de sus fechas (se prueba con 6 fechas, sin servidor);
 *   - un sitio con la foto de otro sitio de su zona (solo con --servidor).
 * Sin `--servidor` no llama a nada. Con él, pregunta a /api/place-photo (lo que hace la app; el servidor puede guardar en su caché lo que busque por primera vez). No cambia ninguna foto.
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
const importante = (lugar) => lugar.level === 1

/** Igual que `soloFotoDeFechas` del servidor: todas las fotos propias del sitio son de unas fechas. */
const soloDeFechas = (nombre) => {
  const suyas = (tabla?.fotos ?? []).filter((f) => (f.lugares ?? []).includes(nombre))
  return suyas.length > 0 && suyas.every((f) => f.fechas)
}

async function pedirAlServidor(nombre, dia) {
  try {
    const r = await fetch(`${servidor}/api/place-photo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: nombre, city: datos.destination, date: dia }) })
    return r.ok ? await r.json() : null
  } catch {
    return null
  }
}

const filas = []
for (const lugar of lugares) {
  const nombre = lugar.name
  const fila = { sitio: nombre, nivel: lugar.level ?? null, importante: importante(lugar), origen: '', foto: null, nota: '' }
  const propia = ownPhotoFile(tabla, nombre, fecha)
  if (propia) {
    fila.origen = 'propia'
    fila.foto = propia.archivo
  } else if (fotoOculta(destino, nombre) || nombresRestaurantes.has(nombre)) {
    fila.origen = 'sin foto'
  } else if (soloDeFechas(nombre)) {
    fila.origen = 'sin foto'
    fila.nota = 'su foto es de unas fechas (Navidad) y hoy no lo son'
  } else if (servidor) {
    const r = await pedirAlServidor(nombre, fecha)
    if (r?.photo_source === 'unsplash' || r?.photo_source === 'wikipedia') {
      fila.origen = r.photo_source
      fila.foto = r.photo_url
    } else if (r?.photo_source === 'propia') {
      fila.origen = r.photo_zone ? 'foto de la zona' : 'propia'
      fila.foto = r.photo_url
    } else fila.origen = 'sin foto'
  } else {
    fila.origen = 'externa (no calculable sin servidor)'
  }
  filas.push(fila)
}

// 1) Repetidas: la misma foto en sitios distintos.
const clave = (foto) => (foto ? foto.replace(/\?.*$/, '').replace(/_p\.jpg$/, '.jpg') : null)
const porFoto = new Map()
for (const fila of filas) {
  const k = clave(fila.foto)
  if (!k) continue
  if (!porFoto.has(k)) porFoto.set(k, [])
  porFoto.get(k).push(fila.sitio)
}
const repetidas = [...porFoto.entries()].filter(([, sitios]) => sitios.length > 1).map(([foto, sitios]) => ({ foto, sitios }))

// 2) Fotos de unas fechas fuera de sus fechas: se prueba con fechas de todo el año (sin servidor).
const FECHAS_DE_PRUEBA = ['2026-03-10', '2026-06-20', '2026-09-15', '2026-10-18', '2026-11-20', '2027-02-01']
const navidadFuera = []
for (const f of tabla?.fotos ?? []) {
  if (!f.fechas) continue
  for (const dia of FECHAS_DE_PRUEBA) {
    const md = Number(dia.slice(5, 7)) * 100 + Number(dia.slice(8, 10))
    const desde = Number(f.fechas.desde.slice(0, 2)) * 100 + Number(f.fechas.desde.slice(3))
    const hasta = Number(f.fechas.hasta.slice(0, 2)) * 100 + Number(f.fechas.hasta.slice(3))
    const dentro = desde <= hasta ? md >= desde && md <= hasta : md >= desde || md <= hasta
    if (dentro) continue
    for (const nombre of f.lugares ?? []) {
      const sirve = ownPhotoFile(tabla, nombre, dia)
      if (sirve && sirve.archivo === f.archivo) navidadFuera.push({ foto: f.archivo, sitio: nombre, fecha: dia })
    }
  }
}

// 3) Importantes con Wikipedia o con la foto de otro sitio (con servidor).
const importantesMal = filas.filter((f) => f.importante && (f.origen === 'wikipedia' || f.origen === 'foto de la zona'))
const deLaZona = filas.filter((f) => f.origen === 'foto de la zona')

// Lista para buscar fotos: importantes sin foto propia.
const importantesSinPropia = filas.filter((f) => f.importante && f.origen !== 'propia')

const sospechosas = []
for (const f of tabla?.fotos ?? []) {
  if (f.cuando === 'dia' && /noche|navidad/i.test(f.archivo) && f.lugares?.some((l) => !/\(noche\)$/.test(l))) sospechosas.push({ foto: f.archivo, motivo: 'foto de noche o de Navidad como foto de día', lugares: f.lugares, fechas: f.fechas ?? null })
}

const resumen = filas.reduce((acc, f) => ((acc[f.origen] = (acc[f.origen] ?? 0) + 1), acc), {})
const fallos = []
if (repetidas.length) fallos.push(`${repetidas.length} foto(s) repetida(s) en sitios distintos`)
if (navidadFuera.length) fallos.push(`${navidadFuera.length} foto(s) de unas fechas fuera de sus fechas`)
if (servidor && importantesMal.length) fallos.push(`${importantesMal.length} sitio(s) importante(s) con Wikipedia o foto de otro sitio`)
if (servidor && deLaZona.length) fallos.push(`${deLaZona.length} sitio(s) con la foto de otro sitio de su zona`)

if (salidaJson) {
  console.log(JSON.stringify({ destino, fecha, servidor: servidor ?? null, resumen, repetidas, navidadFuera, importantesMal, importantesSinPropia, sospechosas, fallos, filas }, null, 2))
} else {
  console.log(`Auditoría de fotos · ${destino} · fecha ${fecha} · ${servidor ? 'con servidor ' + servidor : 'sin servidor'}`)
  console.log(`${filas.length} sitios:`, resumen)
  console.log(`\nFotos repetidas en sitios distintos: ${repetidas.length}`)
  for (const r of repetidas) console.log(`  ${r.foto}\n    → ${r.sitios.join(' | ')}`)
  console.log(`Fotos de unas fechas fuera de sus fechas: ${navidadFuera.length}`)
  for (const n of navidadFuera) console.log('  ' + JSON.stringify(n))
  console.log(`Importantes con Wikipedia o foto de otro sitio: ${servidor ? importantesMal.length : '(solo con --servidor)'}`)
  for (const n of importantesMal) console.log(`  ${n.sitio} → ${n.origen} ${n.foto ?? ''}`)
  console.log(`\nImportantes (nivel 1) SIN foto propia: ${importantesSinPropia.length}`)
  for (const n of importantesSinPropia) console.log(`  ${n.sitio} → ${n.origen}`)
  console.log(`\nSospechosas (solo aviso): ${sospechosas.length}`)
  for (const s of sospechosas) console.log('  ' + JSON.stringify(s))
  console.log('\nDetalle:')
  for (const f of filas) console.log(`  ${f.sitio.padEnd(48)} ${f.origen.padEnd(14)} ${f.foto ?? ''}${f.nota ? '  · ' + f.nota : ''}`)
}
if (fallos.length) {
  console.error(`\nAUDITORÍA DE FOTOS: FALLA — ${fallos.join('; ')}`)
  process.exit(1)
}
console.error('\nAuditoría de fotos: todo en orden.')
