// Candidatas de Unsplash para los 4 sitios que seguían sin foto (tanda 9): Via del Babuino, Terraza de Largo Gaetana Agnesi, Colle Oppio y Mirador de San Pietro in Montorio.
//   node scripts/destino/candidatasFotosT9.mjs
// No pone NINGUNA foto en la app: guarda hasta 3 candidatas por sitio en docs/dias/notas_9/candidatas_t9.json y hace la página docs/dias/FOTOS_CANDIDATAS_TANDA9.html para que Eric elija.
// Cada candidata dice si la foto NOMBRA el sitio (descripción o etiquetas) o si solo es del lugar de al lado (en ese caso lo dice claro: no se puede asegurar que sea el sitio).
// La clave de Unsplash se lee de .env.local y no se imprime.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

if (!process.env.UNSPLASH_ACCESS_KEY && existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = /^\s*UNSPLASH_ACCESS_KEY\s*=\s*(.+?)\s*$/.exec(line)
    if (m) process.env.UNSPLASH_ACCESS_KEY = m[1].replace(/^['"]|['"]$/g, '')
  }
}
const key = process.env.UNSPLASH_ACCESS_KEY
if (!key) throw new Error('Falta UNSPLASH_ACCESS_KEY.')

const SITIOS = [
  { id: 'via_del_babuino', nombre: 'Via del Babuino', pide: /babuino/i, cerca: /via margutta|piazza del popolo|spanish steps|trinit|condotti|via del corso|rome street|roman street|roma street/i, busquedas: ['Via del Babuino', 'Via del Babuino Roma', 'Babuino Rome street', 'Via Margutta Rome', 'Rome street Piazza del Popolo Spanish Steps'] },
  { id: 'terraza_de_largo_gaetana_agnesi', nombre: 'Terraza de Largo Gaetana Agnesi', pide: /agnesi/i, cerca: /trajan|traian|vittoriano|altare della patria|foro di traiano|santa maria di loreto|santissimo nome|imperial forum/i, busquedas: ['Largo Gaetana Agnesi', 'Foro di Traiano terrazza Roma', 'Trajan Forum view Rome dome Santa Maria di Loreto', 'Via dei Fori Imperiali terrace view', 'Vittoriano terrace Rome view'] },
  { id: 'colle_oppio', nombre: 'Colle Oppio', pide: /oppio|oppian/i, cerca: /domus aurea|trajan baths|terme di traiano|colosseum park|rome park|parco/i, busquedas: ['Colle Oppio', 'Colle Oppio park Rome', 'Parco Colle Oppio Roma', 'Domus Aurea Rome park', 'Rome park pine trees Colosseum'] },
  { id: 'mirador_de_san_pietro_in_montorio', nombre: 'Mirador de San Pietro in Montorio', pide: /montorio|tempietto/i, cerca: /janiculum|gianicolo|trastevere view|rome view sunset|rome skyline|rome panorama|fontana dell.acqua paola/i, busquedas: ['San Pietro in Montorio', 'San Pietro in Montorio Roma', 'Tempietto Bramante Rome', 'Gianicolo Roma panorama', 'Janiculum Hill Rome view'] },
]

const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const resultado = []
for (const sitio of SITIOS) {
  const vistas = new Map()
  for (const q of sitio.busquedas) {
    const r = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=30&orientation=landscape&content_filter=high`, { headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' } })
    if (!r.ok) {
      console.log(`«${q}»: Unsplash devolvió ${r.status}`)
      continue
    }
    const data = await r.json()
    for (const p of data.results ?? []) {
      if (vistas.has(p.id) || p.width < 1800 || p.width / p.height < 1.25) continue
      const texto = [p.description ?? '', p.alt_description ?? '', ...(p.tags ?? []).map((t) => t?.title ?? '')].join(' · ')
      const nombra = sitio.pide.test(texto)
      const delEntorno = sitio.cerca.test(texto)
      // (Una foto que ni nombra el sitio ni su entorno solo entra si salió de una de las 3 primeras búsquedas, que son del sitio; y se dice claro.)
      if (!nombra && !delEntorno && !sitio.busquedas.slice(0, 3).includes(q)) continue
      vistas.set(p.id, { id: p.id, nombra, entorno: delEntorno, descripcion: p.description ?? p.alt_description ?? '', autor: p.user?.name ?? '', autor_enlace: `${p.user?.links?.html ?? ''}?utm_source=viajes_bengala&utm_medium=referral`, enlace: `${p.links?.html ?? ''}?utm_source=viajes_bengala&utm_medium=referral`, ancho: p.width, alto: p.height, likes: p.likes ?? 0, grande: p.urls?.regular, pequena: p.urls?.small, busqueda: q })
    }
  }
  const elegidas = [...vistas.values()].sort((a, b) => Number(b.nombra) - Number(a.nombra) || Number(b.entorno) - Number(a.entorno) || b.likes - a.likes).slice(0, 3).map((c, i) => ({ opcion: i + 1, ...c }))
  console.log(`${sitio.nombre}: ${vistas.size} posibles, ${elegidas.length} candidatas (${elegidas.filter((c) => c.nombra).length} lo nombran)`)
  resultado.push({ id: sitio.id, nombre: sitio.nombre, candidatas: elegidas })
}
mkdirSync('docs/dias/notas_9', { recursive: true })
writeFileSync('docs/dias/notas_9/candidatas_t9.json', JSON.stringify({ fecha: new Date().toISOString().slice(0, 10), fuente: 'Unsplash (licencia de Unsplash; se apunta siempre el autor)', sitios: resultado }, null, 1))

const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fotos candidatas · tanda 9</title>
<style>body{font:16px/1.4 system-ui,sans-serif;background:#f5efe4;color:#1c2230;margin:0;padding:16px;max-width:900px;margin:auto}h1{font-size:24px}h2{margin-top:36px;border-top:1px solid #0002;padding-top:16px}figure{margin:0 0 24px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 1px 6px #0002}img.g{width:100%;display:block}figcaption{padding:12px 14px;font-size:14px}.si{color:#17703a;font-weight:600}.no{color:#a05a00;font-weight:600}.vistas{display:flex;gap:12px;align-items:center;margin-top:8px}.hoy{width:220px;aspect-ratio:2.2/1;background-size:cover;background-position:center;border-radius:10px}.mini{width:48px;height:48px;background-size:cover;background-position:center;border-radius:8px}code{background:#0001;padding:1px 5px;border-radius:5px}</style>
<h1>Las 4 fotos que faltan: candidatas</h1>
<p>Dime, por cada sitio, qué opción quieres (por ejemplo «<code>colle_oppio · 2</code>») o «ninguna». No he puesto ninguna en la app. <b>Ojo:</b> donde dice «No nombra el sitio» o «Sin confirmar», no se puede asegurar que sea exactamente ese sitio: mírala tú.</p>
${resultado
  .map(
    (s) => `<h2>${esc(s.nombre)}</h2>${s.candidatas.length === 0 ? '<p><b>Ninguna candidata</b>: Unsplash no tiene fotos de este sitio que cumplan lo básico (apaisada, buena resolución y del sitio o de al lado).</p>' : ''}${s.candidatas
      .map(
        (c) => `<figure><a href="${esc(c.enlace)}" target="_blank" rel="noopener noreferrer"><img class="g" loading="lazy" src="${esc(c.grande)}" alt="${esc(c.descripcion)}"></a><figcaption><b>Opción ${c.opcion}</b> <code>${esc(s.id)} · ${c.opcion}</code><br>${c.nombra ? '<span class="si">La foto nombra el sitio.</span>' : c.entorno ? '<span class="no">No nombra el sitio: habla de un lugar de al lado.</span>' : '<span class="no">Sin confirmar: salió al buscar el sitio, pero la foto no dice dónde es.</span>'} ${esc(c.descripcion)}<div class="vistas"><div class="hoy" style="background-image:url('${esc(c.grande)}')"></div><div class="mini" style="background-image:url('${esc(c.pequena)}')"></div><span>En HOY v2 · miniatura</span></div><br>Foto de <a href="${esc(c.autor_enlace)}" target="_blank" rel="noopener noreferrer">${esc(c.autor)}</a> en <a href="https://unsplash.com/?utm_source=viajes_bengala&amp;utm_medium=referral" target="_blank" rel="noopener noreferrer">Unsplash</a> · licencia de Unsplash.</figcaption></figure>`,
      )
      .join('')}`,
  )
  .join('')}</html>`
writeFileSync('docs/dias/FOTOS_CANDIDATAS_TANDA9.html', html)
console.log('Página: docs/dias/FOTOS_CANDIDATAS_TANDA9.html')
