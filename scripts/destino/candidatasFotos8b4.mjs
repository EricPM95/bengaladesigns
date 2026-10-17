// Candidatas de Unsplash para los sitios de Roma que se han quedado sin foto (Tanda 8B4). No pone NINGUNA foto en la app: solo busca, guarda autor/enlace/licencia
// y deja un JSON con todas las que cumplen lo básico. Después se miran una a una y se eligen 3 por sitio (docs/dias/FOTOS_CANDIDATAS_8B4.html).
//   node scripts/destino/candidatasFotos8b4.mjs salida.json
// La clave de Unsplash se lee de .env.local y no se imprime. Cada búsqueda pide fotos apaisadas (`orientation=landscape`) y de contenido seguro (`content_filter=high`).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

if (!process.env.UNSPLASH_ACCESS_KEY && existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = /^\s*UNSPLASH_ACCESS_KEY\s*=\s*(.+?)\s*$/.exec(line)
    if (m) process.env.UNSPLASH_ACCESS_KEY = m[1].replace(/^['"]|['"]$/g, '')
  }
}
const key = process.env.UNSPLASH_ACCESS_KEY
if (!key) throw new Error('Falta UNSPLASH_ACCESS_KEY en el entorno del servidor.')

/** El sitio, lo que se busca y lo que tiene que decir la descripción/etiquetas de la foto para fiarse (si no lo dice, se anota). */
export const SITIOS = [
  { id: 'foro_romano_y_palatino', nombre: 'Foro Romano y Palatino', busquedas: ['Roman Forum Rome', 'Foro Romano Roma', 'Palatine Hill Rome ruins', 'Roman Forum Temple of Saturn'], pide: /forum|foro|palatin|romano/i },
  { id: 'arco_de_constantino', nombre: 'Arco de Constantino', busquedas: ['Arch of Constantine Rome', 'Arco di Costantino Roma', 'Arch of Constantine Colosseum'], pide: /constantin|costantin/i },
  { id: 'panteon', nombre: 'Panteón', busquedas: ['Pantheon Rome', 'Pantheon Rome facade columns', 'Pantheon Rome piazza della rotonda', 'Panteon Roma'], pide: /pantheon|panteon|rotonda/i },
  { id: 'piazza_navona', nombre: 'Piazza Navona (de día)', busquedas: ['Piazza Navona Rome', 'Piazza Navona fountain of the four rivers', 'Piazza Navona daytime', 'Piazza Navona Roma'], pide: /navona|four rivers|quattro fiumi/i },
  { id: 'museos_vaticanos_y_capilla_sixtina', nombre: 'Museos Vaticanos (fachada o patios)', busquedas: ['Vatican Museums entrance', 'Vatican Museums courtyard', 'Musei Vaticani Cortile della Pigna', 'Vatican Museums facade', 'Pinecone courtyard Vatican'], pide: /vatican|musei|pigna|pinecone|museums/i },
  { id: 'columna_de_trajano', nombre: 'Columna de Trajano', busquedas: ["Trajan's Column Rome", 'Colonna Traiana Roma', 'Trajan column Forum'], pide: /traian|trajan|trajano/i },
  { id: 'via_del_babuino', nombre: 'Via del Babuino', busquedas: ['Via del Babuino Rome', 'Via del Babuino', 'Babuino street Rome'], pide: /babuino/i },
  { id: 'terraza_de_largo_gaetana_agnesi', nombre: 'Terraza de Largo Gaetana Agnesi', busquedas: ['Largo Gaetana Agnesi Rome', 'Gaetana Agnesi terrace Rome', 'Vittoriano terrace view Trajan Forum Rome'], pide: /agnesi/i },
  { id: 'colle_oppio', nombre: 'Colle Oppio', busquedas: ['Colle Oppio Rome', 'Oppian Hill park Rome', 'Parco del Colle Oppio Roma', 'Colle Oppio Domus Aurea park'], pide: /oppio|oppian/i },
  { id: 'mirador_de_san_pietro_in_montorio', nombre: 'Mirador de San Pietro in Montorio', busquedas: ['San Pietro in Montorio Rome', 'San Pietro in Montorio view Rome', 'Gianicolo terrace view Rome', 'Janiculum Hill view Rome panorama'], pide: /montorio|pietro in montorio/i },
]

const salida = process.argv[2]
const resultado = {}
for (const sitio of SITIOS) {
  const vistas = new Map()
  for (const q of sitio.busquedas) {
    const r = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=30&orientation=landscape&content_filter=high`, { headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' } })
    if (!r.ok) {
      console.log(`«${q}»: Unsplash devolvió ${r.status}`)
      continue
    }
    const data = await r.json()
    let n = 0
    for (const p of data.results ?? []) {
      if (vistas.has(p.id)) continue
      const texto = [p.description ?? '', p.alt_description ?? '', ...(p.tags ?? []).map((t) => t?.title ?? '')].join(' · ')
      // Lo básico: apaisada de verdad, con resolución suficiente para recortar en horizontal.
      if (p.width < 1800 || p.width / p.height < 1.25) continue
      vistas.set(p.id, {
        id: p.id,
        busqueda: q,
        descripcion: p.description ?? null,
        alt: p.alt_description ?? null,
        dice_el_sitio: sitio.pide.test(texto),
        ancho: p.width,
        alto: p.height,
        creada: p.created_at,
        autor: p.user?.name ?? null,
        autor_enlace: p.user?.links?.html ?? null,
        enlace: p.links?.html ?? null,
        licencia: 'Licencia de Unsplash (uso libre, también en una app de pago; se apunta siempre el autor)',
        small: p.urls?.small ?? null,
        regular: p.urls?.regular ?? null,
        raw: p.urls?.raw ?? null,
      })
      n++
    }
    console.log(`${sitio.nombre} · «${q}»: ${data.total} resultados, ${n} nuevas buenas`)
  }
  // Primero las que dicen el sitio; el resto, detrás.
  resultado[sitio.id] = { nombre: sitio.nombre, candidatas: [...vistas.values()].sort((a, b) => Number(b.dice_el_sitio) - Number(a.dice_el_sitio)) }
}
writeFileSync(salida, JSON.stringify(resultado, null, 1))
console.log('guardado en', salida)
