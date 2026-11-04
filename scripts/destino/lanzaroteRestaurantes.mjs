/**
 * LZ2a (agente A): saca de docs/destinos/lanzarote/RESTAURANTES_LANZAROTE.md los restaurantes de las comidas de los días
 * y las cenas cerca del alojamiento por zona, y los escribe en data/dias/lanzarote/_restaurantes.json (para el motor).
 *   node scripts/destino/lanzaroteRestaurantes.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const lines = readFileSync(join(ROOT, 'docs/destinos/lanzarote/RESTAURANTES_LANZAROTE.md'), 'utf8').split(/\r?\n/)

const ZONAS = [
  [/^Puerto del Carmen/, 'puerto_del_carmen'],
  [/^Playa Blanca/, 'playa_blanca'],
  [/^Costa Teguise/, 'costa_teguise'],
  [/^Arrecife/, 'arrecife'],
  [/^El norte/, 'el_norte'],
  [/^El interior/, 'el_interior'],
]
const limpia = (t) => t.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*/g, '').trim()
const coords = (t) => {
  const m = /(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,2}\.\d{3,})/.exec(t)
  return m ? { lat: Number(m[1]), lng: Number(m[2]) } : null
}

const comidas = {} // 'D1_comida' -> [ { rol, nombre, ... } ]
const cenasZona = {} // zonaId -> [ ... ]
let seccion = null
let zona = null
let item = null

function cierraItem() {
  item = null
}

for (const raw of lines) {
  const h = /^## (.+)$/.exec(raw)
  if (h) {
    cierraItem()
    zona = null
    const t = h[1]
    if (/^Cenas cerca del alojamiento/.test(t)) seccion = { tipo: 'zonas' }
    else if (/^D(\d) · (Comida|Cena)/.test(t)) {
      const m = /^D(\d) · (Comida|Cena)/.exec(t)
      seccion = { tipo: 'dia', clave: `D${m[1]}_${m[2] === 'Comida' ? 'comida' : 'cena'}`, titulo: t }
    } else if (/^D1 · Ritmo tranquilo/.test(t)) seccion = { tipo: 'dia', clave: 'D1_comida_tranquilo', titulo: t }
    else if (/^La Graciosa · Comida/.test(t)) seccion = { tipo: 'dia', clave: 'DG_comida', titulo: t }
    else if (/^Órzola/.test(t)) seccion = { tipo: 'dia', clave: 'DG_orzola', titulo: t }
    else seccion = null
    if (seccion?.tipo === 'dia') comidas[seccion.clave] = comidas[seccion.clave] ?? []
    continue
  }
  if (!seccion) continue
  if (seccion.tipo === 'zonas') {
    const z = /^\*\*([^*]+)\*\*\s*$/.exec(raw)
    if (z) {
      cierraItem()
      const hit = ZONAS.find(([re]) => re.test(z[1]))
      zona = hit ? hit[1] : null
      if (zona) cenasZona[zona] = cenasZona[zona] ?? []
      continue
    }
    const b = /^- \*\*([^*]+)\*\*(.*)$/.exec(raw)
    if (b && zona) {
      const nombre = limpia(b[1])
      const resto = limpia(b[2])
      item = { nombre, especial: /Cena especial/.test(raw) || undefined, nota: resto || undefined }
      cenasZona[zona].push(item)
      continue
    }
    const s = /^\s{2,}- (Dirección|Cocina y precio|Horario|Reserva): (.+)$/.exec(raw)
    if (s && item) {
      const campo = { Dirección: 'direccion', 'Cocina y precio': 'cocina', Horario: 'horario', Reserva: 'reserva' }[s[1]]
      item[campo] = limpia(s[2])
      const c = coords(s[2])
      if (c && !item.lat) Object.assign(item, c)
    }
    continue
  }
  // sección de un día
  const b = /^- \*\*((Restaurante|Alternativa|Tercera opción|Sábado, otra opción|Cena especial)[^*]*?)\*\*(.*)$/.exec(raw)
  if (b) {
    const partes = /^([^:]+):\s*(.+)$/.exec(b[1])
    const rol = partes ? partes[1] : b[1]
    const nombre = limpia(partes ? partes[2] : b[1])
    item = { rol: /^Restaurante$/.test(rol) ? 'restaurante' : /^Alternativa$/.test(rol) ? 'alternativa' : /^Tercera/.test(rol) ? 'tercera' : 'otra', nombre }
    const resto = limpia(b[3] ?? '')
    if (resto) item.nota = resto
    comidas[seccion.clave].push(item)
    continue
  }
  const s = /^\s{2,}- (Dirección|Cocina y precio|Horario|Reserva): (.+)$/.exec(raw)
  if (s && item) {
    const campo = { Dirección: 'direccion', 'Cocina y precio': 'cocina', Horario: 'horario', Reserva: 'reserva' }[s[1]]
    item[campo] = limpia(s[2])
    const c = coords(s[2])
    if (c && !item.lat) Object.assign(item, c)
  }
}

// Coordenadas de Mapbox (cierre de la LZ2b-1): solo para los que el documento no trae.
const extra = JSON.parse(readFileSync(join(ROOT, 'data/dias/lanzarote/_restaurantes_coords.json'), 'utf8')).restaurantes
const poner = (it) => { const e = extra[it.nombre]; if (e && !it.lat) { it.lat = e.lat; it.lng = e.lng; it.coord_fuente = 'Mapbox Search Box: ' + e.mapbox } }
Object.values(comidas).flat().forEach(poner)
Object.values(cenasZona).flat().forEach(poner)

const salida = {
  formato: 'restaurantes/1',
  fuente: 'docs/destinos/lanzarote/RESTAURANTES_LANZAROTE.md (3-nov-2026)',
  _nota: 'Generado por scripts/destino/lanzaroteRestaurantes.mjs. comidas: restaurante + alternativa de cada comida/cena de los días. cenas_por_zona: 2-3 restaurantes por zona de alojamiento (cena cerca, con pase). Sin coordenadas = sin confirmar en el documento.',
  comidas,
  cenas_por_zona: cenasZona,
}
writeFileSync(join(ROOT, 'data/dias/lanzarote/_restaurantes.json'), JSON.stringify(salida, null, 1) + '\n')
console.log('comidas:', Object.entries(comidas).map(([k, v]) => `${k}=${v.length}`).join(' '))
console.log('cenas por zona:', Object.entries(cenasZona).map(([k, v]) => `${k}=${v.length}`).join(' '))
