// Candidatas de foto de Wikimedia Commons (3-oct-2026): docs/FOTOS_ROMA_CANDIDATAS.html. SOLO BUSCA Y ENSEÑA: no cambia ninguna foto.
//   node scripts/destino/candidatasCommons.mjs
// Para cada lugar de la lista de abajo busca en Commons (solo fotos, licencia libre), descarta lo que no sirve (mapas, logos, dibujos,
// blanco y negro, texto, muy pequeñas, de noche si la foto es de día y al revés) y se queda con 3, cada una con su autor y su licencia
// (lo que hace falta para el crédito). Una foto de Commons con CC BY o CC BY-SA pide crédito; CC0 y dominio público, no.
import { writeFileSync } from 'node:fs'

const UA = { 'user-agent': 'route-planner-candidatas/1.0 (contacto: bengala.ingresos@gmail.com)' }
const API = 'https://commons.wikimedia.org/w/api.php'

/** modo: dia | noche | navidad (de día con algo de Navidad) | navidad_noche. `mas`: palabras que la foto (nombre o descripción) debería tener. */
const PLACES = [
  { n: 'Basílica de Santa Cecilia in Trastevere', modo: 'dia', q: ['Basilica di Santa Cecilia in Trastevere facade', 'Santa Cecilia in Trastevere church Rome', 'Santa Cecilia in Trastevere courtyard'], mas: ['cecilia'], no: /statue|sculpt|martyr|maderno|altar|fresco|mosaic|crypt|interior|tomb|organ|ciborium|apse|cavallini|judgment|vault|nave|painting/i, mejor: /facade|façade|courtyard|campanile|exterior|cortile/gi },
  { n: 'Cementerio Protestante', modo: 'dia', q: ['Cimitero acattolico Rome', 'Protestant Cemetery Rome graves', 'Non-Catholic Cemetery Rome cypress', "Non-Catholic Cemetery Rome", "Protestant Cemetery Rome Pyramid of Cestius", "Cimitero acattolico Roma cipressi", "Cimitero acattolico di Roma panorama"], mas: ['cemetery', 'cimitero', 'acattolico'], no: /pyramid|piramide|pirámide|cestius|cross|croce|grave of|tomb of|keats|shelley|gramsci|portrait|selfie|me at|plaque|inscription|monument of/i, mejor: /cypress|overview|general|view|pyramid|cemetery/gi },
  { n: 'Mercado de Testaccio', modo: 'dia', q: ['Mercato di Testaccio', 'Testaccio market Rome stalls', 'Nuovo Mercato di Testaccio'], mas: ['testaccio', 'mercato', 'market'] },
  { n: '100 Presepi in Vaticano', modo: 'navidad', q: ["Presepi Vaticano Colonnato Natale","nativity scene St Peter's Square","Vatican Christmas crib","presepe piazza San Pietro","Saint Peter's Square Christmas tree","Vatican Christmas"], mas: ["presepe","nativity","crib","christmas","natale","crèche","tree"], no: /aerial|drone|from the dome|from above|panoram|view from|cupola/i, mejor: /presepe|nativity|crib|christmas tree|natale/gi },
  { n: 'Pasear por la Roma Antigua', modo: 'dia', q: ["Via Sacra Rome","Roman Forum Rome","Arch of Titus Rome","Via dei Fori Imperiali","Palatine Hill Rome"], mas: ["forum","foro","sacra","palatine","palatino","fori imperiali","titus"], no: /relief|detail|inscription|statue|bust|capital|frieze|arch of titus|sculpt|column base/i, mejor: /via sacra|walk|path|view|fori|forum/gi },
  { n: 'Domus Aurea', modo: 'dia', q: ['Domus Aurea interior', 'Domus Aurea Rome', 'Domus Aurea Octagonal Room', 'Domus Aurea Oppian Hill'], mas: ['domus aurea'], no: /floor|pavement|detail|plan|mosaic|fresco detail|inscription/i, mejor: /octagon|room|vault|corridor|hall|interior/gi },
  { n: 'Ostia Antica (excursión)', modo: 'dia', q: ['Ostia Antica Decumanus Maximus', 'Ostia Antica theatre', 'Ostia Antica ruins', 'Ostia Antica Capitolium'], mas: ['ostia'] },
  { n: 'Pasear por el Esquilino', modo: 'dia', q: ['Piazza Vittorio Emanuele II Rome', 'Esquilino Rome street', 'Santa Maria Maggiore Esquilino piazza', 'Porta Magica Piazza Vittorio'], mas: ['esquilino', 'vittorio', 'maggiore'], no: /ruins|wall|statue|relief/i, mejor: /piazza vittorio|street|via /gi },
  { n: 'Free Tour por Roma', modo: 'dia', q: ["Rome tourists street","Campo de Fiori Rome","Via Condotti Rome","Piazza di Spagna tourists","Rome walking tour"], mas: ["tourist","tour","campo","condotti","spagna","street"], no: /group of|guide|tourists? (looking|pointing)|woman|man |girl|boy|portrait|selfie/i, mejor: /street|via |campo|piazza/gi },
  { n: 'Galería Nacional de Arte Moderno', modo: 'dia', q: ['Galleria Nazionale d\'Arte Moderna Rome facade', 'Galleria Nazionale d\'Arte Moderna Valle Giulia', 'GNAM Rome building', 'National Gallery of Modern Art Rome'], mas: ['moderna', 'gnam', 'modern art'], no: /sculpture detail|statue|detail|fountain|gate|frieze|relief/i, mejor: /facade|façade|exterior|building|valle giulia/gi },
  { n: 'Luces de Navidad del Tridente', modo: 'navidad_noche', q: ["Via del Corso Natale","Rome Christmas lights","Roma luminarie Natale","Piazza del Popolo Christmas","Via Condotti Christmas","Rome Christmas tree", "Natale Roma Via Condotti luminarie", "Christmas lights Via del Corso Rome night", "Piazza Venezia Christmas tree", "Piazza del Popolo Natale luci", "Rome Christmas decorations street"], mas: ["christmas","natale","luminarie","lights","luci","tree"], no: /black and white|b&w|flag|tricolor|tricolore/i, mejor: /corso|condotti|babuino|christmas|natale|luminarie/gi },
  { n: 'Nápoles (Naples Italy)', modo: 'dia', q: ['Naples bay Vesuvius view', 'Napoli panorama Vesuvio', 'Castel dell\'Ovo Naples', 'Naples Italy Lungomare'], mas: ['naples', 'napoli', 'napoles', 'vesuvi'] },
  { n: 'Altar de la Patria (noche)', modo: 'noche', q: ['Altare della Patria night', 'Vittoriano by night Rome', 'Altare della Patria illuminated night Piazza Venezia', 'Vittoriano notte'], mas: ['vittoriano', 'altare della patria', 'altar of the fatherland', 'piazza venezia'] },
  { n: 'Mirador del Janículo (noche)', modo: 'noche', q: ["Rome night panorama","Roma di notte panorama","Janiculum view of Rome","Gianicolo Roma","Rome skyline night St Peter dome", "Rome skyline at night from Gianicolo", "Roma notte Gianicolo", "Roma vista dal Gianicolo", "Rome night view dome Saint Peter", "Rome by night skyline"], mas: ["rome","roma","gianicolo","janiculum","vatican","peter"], no: /colosse|colosseo|castel|pantheon|trevi|navona/i, mejor: /janicul|gianicolo|panoram|skyline|dome|cupola|st.? peter/gi },
  { n: 'Terraza del Pincio (noche)', modo: 'noche', q: ["Piazza del Popolo night","Piazza del Popolo notte","Pincio Rome sunset","Pincio terrace Rome","Piazza del Popolo Rome evening", "Piazza del Popolo Rome night", "Piazza del Popolo by night", "Piazza del Popolo dusk", "Pincio view Rome dusk", "Rome from the Pincio at night"], mas: ["pincio","popolo"], no: /castle|rocca|torre|tower|pesaro|cattedrale|duomo|cesena/i, mejor: /popolo|pincio/gi },
  { n: 'Barrio Judío', modo: 'dia', q: ['Portico d\'Ottavia Rome', 'Roman Ghetto Rome Via del Portico d\'Ottavia', 'Jewish quarter Rome street', 'Fontana delle Tartarughe Rome ghetto', 'Great Synagogue of Rome'], mas: ['ottavia', 'ghetto', 'jewish', 'ebraic', 'sinagoga', 'synagogue'] },
  { n: 'Pasear por Trastevere (calle con color)', modo: 'dia', q: ['Trastevere street ivy', 'Vicolo Trastevere Rome colourful', 'Trastevere Rome alley', 'Trastevere Via della Scala', 'Trastevere narrow street'], mas: ['trastevere'], no: /church|chiesa|basilica|façade|facade|santa maria|san crisogono|piazza santa/i, mejor: /street|via |vicolo|alley|ivy|colourful|colorful/gi },
  { n: 'Palazzo Doria Pamphilj (fachada)', modo: 'dia', q: ['Palazzo Doria Pamphilj facade Via del Corso', 'Palazzo Doria Pamphilj Rome', 'Palazzo Doria Pamphili Piazza del Collegio Romano'], mas: ['doria'], no: /ceiling|soffitto|interior|gallery|galleria|hall|sala|room|painting|portrait|courtyard|cortile|chapel/i, mejor: /facade|façade|via del corso|fachada|exterior|collegio romano/gi },
  { n: 'Parque de Villa Borghese: el lago y el Templo de Esculapio', modo: 'dia', q: ['Giardino del Lago Villa Borghese Temple of Aesculapius', 'Tempio di Esculapio Villa Borghese lake', 'Villa Borghese lake boats', 'Villa Borghese Giardino del Lago'], mas: ['lago', 'lake', 'esculapio', 'aesculapius'] },
]

/** Fotos que ya se miraron a ojo y no valen (personas en primer plano, blanco y negro, otro sitio, de noche cuando es de día…). */
const EXCLUDE = new Set([
  "File:Arthur Benni's grave-board in the Non-Catholic Cemetery in Rome.jpg",
  'File:Cimitero acattolico Rome 144.jpg',
  'File:VatikanBor2024 (7).jpg',
  'File:Sidewalk of Via dei Fori Imperiali, Roma, Italy.jpg',
  'File:Two Japanese tourists visiting in Piazza Spagna Rome - 2404.jpg',
  'File:Luminarie augurali su Piazza del Popolo.jpg',
  'File:Christmas lights in Rome 11.JPG',
  'File:Il Vittoriano di notte.... - panoramio.jpg',
  'File:St peters square night - Panorama (Andreas Mischok via Poly Haven).jpg',
  'File:Piazza del popolo di notte - Ascoli Piceno.jpg',
  'File:Palazzo Doria Pamphilj in Rome (2).jpg',
  'File:Piazza del Popolo by night.jpg',
  'File:Oberhausen - Gasometer - Der schöne Schein - Vesuvius in Eruption, with a View over the Islands in the Bay of Naples (Wright of Derby) 01 ies.jpg',
])
const BAD_WORDS = /\b(map|mapa|plan|plattegrond|logo|diagram|coat of arms|flag|poster|stamp|drawing|painting|engraving|etching|lithograph|print|sketch|illustration|icon|plaque|panel|sign|brochure|screenshot|scan|document|postcard|vintage|1[5-9]\d\d)\b|\.svg|\.png|\.gif|\.tif|\.pdf|\.webp/i
const BW_WORDS = /black and white|b&w|bw\b|monochrome|sepia|bianco e nero/i
const NIGHT_WORDS = /\b(night|notte|nocturn|bei nacht|by night|evening|dusk|sunset|blue hour|illuminat|illumin|lights?|luci|luminarie|crepuscolo)\b/i
const FREE_LICENSE = /^(cc0|public domain|pd[- ]|cc[- ]by(-sa)?[- ]|attribution|gfdl.*cc)/i
const NONFREE = /(-nc|-nd|non-?commercial|no derivatives|fair use)/i

const strip = (html) => String(html ?? '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim()
const json = async (params) => {
  const url = `${API}?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, { headers: UA })
    if (response.ok) return response.json()
    await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)))
  }
  throw new Error('Commons no responde')
}

async function search(query) {
  const data = await json({ action: 'query', list: 'search', srsearch: `${query} filetype:bitmap`, srnamespace: '6', srlimit: '25' })
  return (data.query?.search ?? []).map((hit, index) => ({ title: hit.title, rank: index }))
}
async function info(titles) {
  const out = new Map()
  for (let i = 0; i < titles.length; i += 40) {
    const data = await json({ action: 'query', titles: titles.slice(i, i + 40).join('|'), prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '800' })
    for (const page of Object.values(data.query?.pages ?? {})) {
      const ii = page.imageinfo?.[0]
      if (ii) out.set(page.title, { page, ii })
    }
  }
  return out
}

function evaluate(place, title, ii) {
  const meta = ii.extmetadata ?? {}
  const license = strip(meta.LicenseShortName?.value)
  const description = strip(meta.ImageDescription?.value)
  const categories = strip(meta.Categories?.value).replace(/\|/g, ' ')
  const hay = `${title} ${description} ${categories}`.toLowerCase()
  if (EXCLUDE.has(title)) return null
  if (!['image/jpeg'].includes(ii.mime)) return null
  const small = place.modo === 'dia' ? [1400, 800] : [1000, 600]
  if (ii.width < small[0] || ii.height < small[1]) return null
  if (!FREE_LICENSE.test(license) || NONFREE.test(license)) return null
  if (BAD_WORDS.test(title) || BW_WORDS.test(hay)) return null
  const ratio = ii.width / ii.height
  if (ratio < 1.15 || ratio > 2.2) return null // en horizontal: las tarjetas y las fichas son apaisadas
  const night = NIGHT_WORDS.test(`${title} ${description} ${categories}`)
  if ((place.modo === 'dia' || place.modo === 'navidad') && /\b(night|notte|by night|illuminat|dusk|blue hour|crepuscolo)\b/i.test(hay)) return null
  if (place.modo === 'noche' && !/\b(night|notte|nocturn|by night|illuminat|blue hour|dusk|crepuscolo|evening)\b/i.test(hay)) return null
  if (place.modo === 'navidad' && !/(christmas|natale|presepe|presepi|nativity|crib|cr[eè]che|navidad|belén)/i.test(hay)) return null
  if (place.modo === 'navidad_noche' && !/(christmas|natale|luminarie|navidad)/i.test(hay)) return null
  if (place.no && place.no.test(hay)) return null
  const boost = place.mejor ? (hay.match(place.mejor) ?? []).length : 0
  const must = place.mas.some((word) => hay.includes(word.toLowerCase()))
  if (!must) return null
  const artist = strip(meta.Artist?.value) || 'Autor no indicado'
  const attribution = strip(meta.Attribution?.value)
  const requiresCredit = !/^(cc0|public domain|pd)/i.test(license) || String(meta.AttributionRequired?.value).toLowerCase() === 'true'
  return {
    title,
    page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
    thumb: ii.thumburl,
    original: ii.url,
    width: ii.width,
    height: ii.height,
    license,
    licenseUrl: meta.LicenseUrl?.value ?? null,
    artist: artist.replace(/^No machine-readable author provided\.\s*/i, '').replace(/ assumed \(based on copyright claims\)\.?/i, ' (autor asumido por Commons)'),
    attribution,
    requiresCredit,
    description: description.slice(0, 180),
    date: strip(meta.DateTimeOriginal?.value || meta.DateTime?.value).slice(0, 10),
    night,
    boost,
  }
}

const results = []
for (const place of PLACES) {
  const hits = new Map()
  for (const query of place.q) {
    for (const hit of await search(query)) {
      const previous = hits.get(hit.title)
      hits.set(hit.title, previous === undefined ? hit.rank : Math.min(previous, hit.rank))
    }
  }
  const details = await info([...hits.keys()])
  const good = []
  for (const [title, rank] of hits) {
    const entry = details.get(title)
    if (!entry) continue
    const candidate = evaluate(place, title, entry.ii)
    if (candidate) good.push({ ...candidate, rank })
  }
  // Los mejores: primero los que salen más arriba en la búsqueda y los de más resolución; de autores distintos si se puede.
  good.sort((a, b) => a.rank - 8 * Math.min(a.boost, 3) - (b.rank - 8 * Math.min(b.boost, 3)) + (b.width - a.width) / 1500)
  const picked = []
  const authors = new Set()
  for (const candidate of good) {
    if (picked.length >= 3) break
    if (authors.has(candidate.artist)) continue
    picked.push(candidate)
    authors.add(candidate.artist)
  }
  for (const candidate of good) {
    if (picked.length >= 3) break
    if (!picked.includes(candidate)) picked.push(candidate)
  }
  results.push({ place, picked, found: good.length })
  console.log(`${place.n}: ${picked.length} candidatas (de ${good.length} buenas, ${hits.size} encontradas)`)
}

writeFileSync('docs/_candidatas_commons.json', JSON.stringify(results, null, 1))

const esc = (text) => String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const MODO = { dia: 'de día', noche: 'de noche', navidad: 'de día, con algo de Navidad', navidad_noche: 'con luces de Navidad' }
const sections = results
  .map(({ place, picked }) => {
    const cards = picked
      .map(
        (c, i) => `<article class="cand">
  <a href="${esc(c.page)}" target="_blank" rel="noopener"><img loading="lazy" src="${esc(c.thumb)}" alt=""></a>
  <div class="num">${i + 1}</div>
  <p class="meta"><b>${esc(c.license)}</b> · ${esc(c.artist)}</p>
  <p class="meta">${c.width}×${c.height}${c.date ? ` · ${esc(c.date)}` : ''}${c.requiresCredit ? ' · <span class="cred">pide crédito</span>' : ' · sin crédito obligatorio'}</p>
  <p class="desc">${esc(c.description || c.title.replace(/^File:/, ''))}</p>
  <p class="meta"><a href="${esc(c.page)}" target="_blank" rel="noopener">${esc(c.title.replace(/^File:/, ''))}</a></p>
</article>`,
      )
      .join('\n')
    const short = picked.length < 3 ? `<p class="aviso">Solo he encontrado ${picked.length} buena${picked.length === 1 ? '' : 's'} (con licencia libre, en color, horizontal y que se reconozca).</p>` : ''
    return `<section id="s-${esc(place.n.replace(/[^a-z0-9]+/gi, '-'))}"><h2>${esc(place.n)} <small>${MODO[place.modo]}</small></h2>${short}<div class="grid">${cards || '<p class="aviso">No he encontrado ninguna buena.</p>'}</div></section>`
  })
  .join('\n')

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Roma · candidatas de foto</title>
<style>
  :root{--ink:#1c2230;--muted:#6b7280;--line:#e5ddcc;--bg:#f5efe4}
  *{box-sizing:border-box}body{margin:0;font:14px/1.4 system-ui,sans-serif;color:var(--ink);background:var(--bg);padding:24px;max-width:1200px;margin:auto}
  h1{font:400 34px Georgia,serif;margin:0 0 6px}h2{font:400 24px Georgia,serif;margin:34px 0 10px;border-bottom:1px solid var(--line);padding-bottom:6px}h2 small{font:600 12px system-ui;color:var(--muted);margin-left:8px}
  .nota{color:var(--muted);max-width:780px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
  .cand{position:relative;background:#fff;border:1px solid var(--line);border-radius:14px;padding:10px;display:flex;flex-direction:column;gap:5px}
  .cand img{width:100%;height:210px;object-fit:cover;border-radius:10px;display:block;background:#eee}
  .num{position:absolute;left:18px;top:18px;width:34px;height:34px;border-radius:50%;background:#1c2230;color:#fff;font:700 18px/34px system-ui;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.35)}
  .meta{margin:0;font-size:12px;word-break:break-word}.desc{margin:0;font-size:12.5px;color:#374151}.cred{color:#b45309;font-weight:600}
  .aviso{color:#b45309;font-weight:600;margin:4px 0 10px}
  nav{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0}nav a{background:#fff;border:1px solid var(--line);border-radius:999px;padding:4px 10px;text-decoration:none;color:var(--ink);font-size:12px}
</style></head><body>
<h1>Roma · candidatas de foto</h1>
<p class="nota">Tres candidatas de Wikimedia Commons por lugar, con licencia libre y su autor para el crédito. Solo para elegir: no cambia ninguna foto de la app. Di el lugar y el número: «Domus Aurea, la 2». Pulsa una foto para verla grande en Commons. «Pide crédito» = licencia CC BY o CC BY-SA: la app la pondrá con el autor y el enlace; CC0 y dominio público no lo piden. Generado el ${new Date().toISOString().slice(0, 10)} con <code>node scripts/destino/candidatasCommons.mjs</code>.</p>
<nav>${results.map(({ place }) => `<a href="#s-${esc(place.n.replace(/[^a-z0-9]+/gi, '-'))}">${esc(place.n.split(' (')[0].split(':')[0])}</a>`).join('')}</nav>
${sections}
</body></html>
`
writeFileSync('docs/FOTOS_ROMA_CANDIDATAS.html', html)
