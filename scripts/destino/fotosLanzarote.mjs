// LZ1 (agente D): busca en Wikimedia Commons fotos de licencia libre de los sitios de Lanzarote.
//   node scripts/destino/fotosLanzarote.mjs buscar            -> docs/dias/notas_lz1/candidatas_lanzarote.json (hasta 6 por sitio, con autor y licencia)
//   node scripts/destino/fotosLanzarote.mjs bajar <sitio> <n> [nombre] -> baja la candidata n de ese sitio a public/fotos/lanzarote/ (1600 px y copia _p de 640 px)
// Solo licencias libres (CC0, dominio público, CC BY, CC BY-SA). Se apunta SIEMPRE autor, licencia y enlace; sin autor, no entra.
import fs from 'node:fs'
import path from 'node:path'

const UA = 'ViajesBengala/1.0 (route planner; contacto: bengala.ingresos@gmail.com) fotosLanzarote.mjs'
const SALIDA = 'docs/dias/notas_lz1/candidatas_lanzarote.json'
const pausa = (ms) => new Promise((r) => setTimeout(r, ms))

// id de sitio -> búsquedas en Commons (la primera es la buena)
const SITIOS = {
  portada_lanzarote: ['Lanzarote landscape volcano', 'Timanfaya panorama', 'Lanzarote La Geria vineyard panorama'],
  montanas_del_fuego: ['Montañas del Fuego Timanfaya', 'Timanfaya National Park landscape'],
  jameos_del_agua: ['Jameos del Agua', 'Jameos del Agua lake'],
  cueva_de_los_verdes: ['Cueva de los Verdes Lanzarote'],
  mirador_del_rio: ['Mirador del Río Lanzarote'],
  fundacion_cesar_manrique: ['Fundación César Manrique Taro de Tahíche'],
  el_golfo_y_el_charco_de_los_clicos: ['Charco de los Clicos', 'El Golfo Lanzarote green lagoon'],
  la_geria_y_sus_bodegas: ['La Geria Lanzarote vineyard', 'La Geria zocos'],
  playas_de_papagayo: ['Playa de Papagayo Lanzarote', 'Papagayo beaches Lanzarote'],
  caleton_blanco: ['Caletón Blanco Lanzarote', 'Caleton Blanco Orzola'],
  jardin_de_cactus: ['Jardín de Cactus Guatiza', 'Jardin de Cactus Lanzarote'],
  los_hervideros: ['Los Hervideros Lanzarote'],
  salinas_de_janubio: ['Salinas de Janubio'],
  teguise: ['Teguise Lanzarote', 'Teguise plaza'],
  haria_y_la_casa_museo_cesar_manrique: ['Haría Lanzarote', 'Valle de Haría'],
  casa_museo_del_campesino: ['Monumento al Campesino Lanzarote', 'Casa Museo del Campesino'],
  caleta_de_famara_y_playa_de_famara: ['Playa de Famara', 'Caleta de Famara'],
  arrecife_charco_de_san_gines: ['Charco de San Ginés Arrecife'],
  castillo_de_san_jose_miac: ['Castillo de San José Arrecife'],
  lagomar: ['Lagomar Nazaret Lanzarote'],
  ermita_de_las_nieves: ['Ermita de las Nieves Lanzarote'],
  mirador_de_guinate: ['Mirador de Guinate'],
  ciudad_estratificada: ['Rofera de Teseguite', 'Ciudad Estratificada Lanzarote'],
  playa_de_montana_bermeja: ['Playa de Montaña Bermeja'],
  las_grietas_montana_blanca: ['Montaña Blanca Lanzarote Las Grietas'],
  mirador_del_bosquecillo: ['Risco de Famara mirador Bosquecillo'],
  mirador_de_haria: ['Mirador de Haría'],
  castillo_de_santa_barbara: ['Castillo de Santa Bárbara Guanapay Teguise'],
  punta_mujeres_y_arrieta: ['Punta Mujeres Lanzarote', 'Arrieta Lanzarote'],
  playa_blanca_y_faro_de_pechiguera: ['Faro de Pechiguera', 'Playa Blanca Lanzarote'],
  puerto_del_carmen_puerto_viejo: ['Puerto del Carmen Lanzarote', 'Puerto del Carmen old town'],
  volcan_del_cuervo: ['Volcán del Cuervo Lanzarote'],
  caldera_blanca: ['Caldera Blanca Lanzarote'],
  la_graciosa: ['La Graciosa Caleta de Sebo', 'Playa de las Conchas La Graciosa'],
}

const LIBRE = /^(cc0|public domain|pd|cc[ -]by(-sa)?[ -]\d)/i
const texto = (v) => String(v ?? '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()

async function api(params) {
  const url = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } })
    if (r.ok) return r.json()
    await pausa(3000 * (i + 1))
  }
  throw new Error(`Commons no responde: ${url}`)
}

async function buscar() {
  fs.mkdirSync(path.dirname(SALIDA), { recursive: true })
  const res = {}
  for (const [sitio, busquedas] of Object.entries(SITIOS)) {
    const vistas = new Map()
    for (const q of busquedas) {
      const j = await api({ action: 'query', generator: 'search', gsrnamespace: '6', gsrsearch: `${q} filetype:bitmap`, gsrlimit: '30', prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '640' })
      for (const p of Object.values(j.query?.pages ?? {})) {
        const ii = p.imageinfo?.[0]
        if (!ii || !/jpeg/.test(ii.mime) || ii.width < 2000 || ii.width / ii.height < 1.3) continue
        const m = ii.extmetadata ?? {}
        const licencia = texto(m.LicenseShortName?.value)
        const autor = texto(m.Artist?.value)
        if (!LIBRE.test(licencia) || !autor) continue
        if (vistas.has(p.title)) continue
        vistas.set(p.title, { titulo: p.title, ancho: ii.width, alto: ii.height, autor, licencia, enlace: ii.descriptionurl, descripcion: texto(m.ImageDescription?.value).slice(0, 160), url_original: ii.url, url_640: ii.thumburl, busqueda: q })
      }
      await pausa(1200)
    }
    res[sitio] = [...vistas.values()].slice(0, 6).map((c, i) => ({ n: i + 1, ...c }))
    console.log(`${sitio}: ${res[sitio].length} candidatas`)
  }
  fs.writeFileSync(SALIDA, `${JSON.stringify({ fecha: new Date().toISOString().slice(0, 10), fuente: 'Wikimedia Commons (licencias libres)', sitios: res }, null, 1)}\n`)
}

async function bajar(sitio, n, nombre = sitio) {
  const c = JSON.parse(fs.readFileSync(SALIDA, 'utf8')).sitios[sitio]?.find((x) => x.n === Number(n))
  if (!c) throw new Error(`No hay candidata ${n} de ${sitio}`)
  const j = await api({ action: 'query', titles: c.titulo, prop: 'imageinfo', iiprop: 'url', iiurlwidth: '1600' })
  const ii = Object.values(j.query.pages)[0].imageinfo[0]
  fs.mkdirSync('public/fotos/lanzarote', { recursive: true })
  const dest = `public/fotos/lanzarote/${nombre}.jpg`
  const r = await fetch(ii.thumburl, { headers: { 'User-Agent': UA } })
  if (!r.ok) throw new Error(`No se pudo bajar: ${r.status}`)
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()))
  const r2 = await fetch(c.url_640, { headers: { 'User-Agent': UA } })
  if (r2.ok) fs.writeFileSync(`public/fotos/lanzarote/${nombre}_p.jpg`, Buffer.from(await r2.arrayBuffer()))
  console.log(`Bajada: ${dest} (${c.autor} · ${c.licencia})`)
}

const [, , cmd, a, b, d] = process.argv
if (cmd === 'buscar') await buscar()
else if (cmd === 'bajar') await bajar(a, b, d)
else console.log('Uso: buscar | bajar <sitio> <n>')
