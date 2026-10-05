// Los huecos de las fotos propias de Roma (Tanda 3, docs/dias/FOTOS_PENDIENTES.md): una carpeta (public/fotos/roma/) y un nombre de archivo FIJO por sitio, de día y, si lo lleva, de noche.
// El usuario solo tiene que soltar la foto con ese nombre en esa carpeta y sale sola (el servidor mira si el archivo existe: server/engine/writtenDays.js, `photosFor`).
// Hasta que llegue, el sitio sigue con la foto de ahora; si no tiene, un recuadro neutro con su nombre (nunca una foto que no sea del sitio).
//   node scripts/destino/fotosHuecos.mjs   → escribe `huecos` en data/dias/roma/_fotos.json y docs/dias/FOTOS_HUECOS.md
import fs from 'node:fs'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'

const D = findPipelineV2Data('Roma')
const CARPETA = 'public/fotos/roma'

// grupo, sitio (como lo dice el usuario), estrella (★: sale en una lista o es de las grandes), lugares (los nombres con los que la app pide la foto), archivo (fijo).
const H = (grupo, sitio, archivo, lugares, extra = {}) => ({ grupo, sitio, archivo, lugares, cuando: archivo.startsWith('noche_') ? 'noche' : 'dia', ...extra })
export const HUECOS = [
  // Roma desde arriba (D6, 5 y 6 días)
  H('Día «Roma desde arriba» (5 y 6 días)', 'Terraza del Altar de la Patria (la del ascensor panorámico)', 'dia_terraza_altar_patria.jpg', ['Terraza del Altar de la Patria'], { estrella: true, sin_foto_hasta_llegar: true, nota: 'La del Altar que ya hay es la del edificio.' }),
  H('Día «Roma desde arriba» (5 y 6 días)', "Castillo de Sant'Angelo por dentro (la terraza del ángel)", 'dia_castillo_sant_angelo_dentro.jpg', ["Castillo de Sant'Angelo"], { estrella: true }),
  H('Día «Roma desde arriba» (5 y 6 días)', 'Museos Capitolinos (el Marco Aurelio o la Loba)', 'dia_museos_capitolinos.jpg', ['Museos Capitolinos'], { estrella: true }),
  H('Día «Roma desde arriba» (5 y 6 días)', 'Plaza del Campidoglio, de día', 'dia_plaza_campidoglio.jpg', ['Plaza del Campidoglio'], { estrella: true }),
  H('Día «Roma desde arriba» (5 y 6 días)', 'Piazza Venezia, de día', 'dia_piazza_venezia.jpg', ['Plaza Venecia']),
  H('Día «Roma desde arriba» (5 y 6 días)', 'Santa Maria in Aracoeli y su escalinata', 'dia_santa_maria_aracoeli.jpg', ['Santo Bambino de Aracoeli', 'Santa Maria in Aracoeli']),
  H('Día «Roma desde arriba» (5 y 6 días)', 'Foros de Trajano (la Columna y los Mercados)', 'dia_foros_de_trajano.jpg', ['Columna de Trajano', 'Mercados de Trajano', 'Foros de Trajano']),
  // D5
  H('Día de las basílicas y el Aventino (4 días)', 'Santa Maria Maggiore', 'dia_santa_maria_maggiore.jpg', ['Basílica de Santa María la Mayor'], { estrella: true }),
  H('Día de las basílicas y el Aventino (4 días)', 'San Pietro in Vincoli (el Moisés)', 'dia_san_pietro_in_vincoli.jpg', ['Iglesia de San Pietro in Vincoli'], { estrella: true }),
  H('Día de las basílicas y el Aventino (4 días)', 'San Juan de Letrán', 'dia_san_juan_de_letran.jpg', ['Basílica de San Juan de Letrán'], { estrella: true }),
  H('Día de las basílicas y el Aventino (4 días)', 'Escalera Santa', 'dia_escalera_santa.jpg', ['Escalera Santa']),
  H('Día de las basílicas y el Aventino (4 días)', 'San Clemente (si es posible, las excavaciones de abajo)', 'dia_san_clemente.jpg', ['Basílica de San Clemente']),
  H('Día de las basílicas y el Aventino (4 días)', 'Monti (la Piazza Madonna dei Monti o Via Panisperna)', 'dia_monti.jpg', ['Monti']),
  H('Día de las basílicas y el Aventino (4 días)', 'Termas de Caracalla', 'dia_termas_de_caracalla.jpg', ['Termas de Caracalla'], { estrella: true }),
  H('Día de las basílicas y el Aventino (4 días)', 'Circo Máximo', 'dia_circo_maximo.jpg', ['Circo Máximo'], { estrella: true }),
  H('Día de las basílicas y el Aventino (4 días)', 'Boca de la Verdad', 'dia_boca_de_la_verdad.jpg', ['Boca de la Verdad'], { estrella: true }),
  H('Día de las basílicas y el Aventino (4 días)', 'Ojo de la Cerradura del Aventino (la cúpula dentro de la cerradura)', 'dia_ojo_cerradura_aventino.jpg', ['Ojo de la Cerradura del Aventino'], { estrella: true }),
  H('Día de las basílicas y el Aventino (4 días)', 'Paseo por el Aventino (Santa Sabina, el Parque Savello; la Rosaleda en mayo y junio)', 'dia_paseo_aventino.jpg', ['Paseo por el Aventino'], { nota: 'La Rosaleda solo en mayo y junio: si es otra foto, se dice.' }),
  H('Día de las basílicas y el Aventino (4 días)', 'Paseo por Testaccio (la Piazza Testaccio, el Monte dei Cocci y el antiguo matadero)', 'dia_paseo_testaccio.jpg', ['Paseo por Testaccio']),
  // DA-medio
  H('Medio día del Aventino y Testaccio (3,5 días)', 'Mercado de Testaccio', 'dia_mercado_de_testaccio.jpg', ['Mercado de Testaccio']),
  H('Medio día del Aventino y Testaccio (3,5 días)', 'Pirámide Cestia', 'dia_piramide_cestia.jpg', ['Pirámide Cestia']),
  H('Medio día del Aventino y Testaccio (3,5 días)', 'Cementerio Protestante (la tumba de Keats)', 'dia_cementerio_protestante.jpg', ['Cementerio Protestante'], { ya_existe: true }),
  // D4
  H('Día de Villa Borghese, el Popolo y la Plaza de España (3 días)', 'Fontana de Trevi de día, sin gente', 'dia_fontana_de_trevi.jpg', ['Fontana de Trevi'], { estrella: true, nota: 'Ahora solo hay la de noche (noche_fontana_trevi.jpg), que no se toca.' }),
  H('Día de Villa Borghese, el Popolo y la Plaza de España (3 días)', 'Plaza de España de día', 'dia_plaza_de_espana.jpg', ['Plaza de España'], { estrella: true, nota: 'Ahora solo hay la de noche.' }),
  H('Día de Villa Borghese, el Popolo y la Plaza de España (3 días)', 'Galería Borghese', 'dia_galeria_borghese.jpg', ['Galería Borghese'], { estrella: true }),
  H('Día de Villa Borghese, el Popolo y la Plaza de España (3 días)', 'Piazza del Popolo de día', 'dia_piazza_del_popolo.jpg', ['Piazza del Popolo'], { estrella: true }),
  H('Día de Villa Borghese, el Popolo y la Plaza de España (3 días)', 'Santa Maria del Popolo (los Caravaggio)', 'dia_santa_maria_del_popolo.jpg', ['Santa Maria del Popolo']),
  H('Día de Villa Borghese, el Popolo y la Plaza de España (3 días)', 'Ara Pacis', 'dia_ara_pacis.jpg', ['Ara Pacis']),
  H('Día de Villa Borghese, el Popolo y la Plaza de España (3 días)', 'Via Condotti', 'dia_via_condotti.jpg', ['Via Condotti']),
  H('Día de Villa Borghese, el Popolo y la Plaza de España (3 días)', 'Fuente del Tritón', 'dia_fuente_del_triton.jpg', ['Fuente del Tritón']),
  H('Día de Villa Borghese, el Popolo y la Plaza de España (3 días)', 'Via Veneto', 'dia_via_veneto.jpg', ['Via Veneto']),
  H('Día de Villa Borghese, el Popolo y la Plaza de España (3 días)', 'Porta Pinciana', 'dia_porta_pinciana.jpg', ['Porta Pinciana']),
  H('Día de Villa Borghese, el Popolo y la Plaza de España (3 días)', 'Cripta de los Capuchinos (Via Veneto; la entrada, sin fotos dentro)', 'dia_cripta_capuchinos.jpg', ['Cripta de los Capuchinos'], { estrella: true, nota: 'Sitio nuevo de la Tanda 4 (el lunes con la Galería cerrada).' }),
  H('Día de Villa Borghese, el Popolo y la Plaza de España (3 días)', 'El reloj de agua del Pincio', 'dia_reloj_de_agua_pincio.jpg', ['Reloj de agua del Pincio']),
  // D7
  H('La Vía Appia y Trastevere tranquilo (6 días en Roma)', 'Villa Farnesina (los frescos de Rafael)', 'dia_villa_farnesina.jpg', ['Villa Farnesina'], { estrella: true }),
  H('La Vía Appia y Trastevere tranquilo (6 días en Roma)', 'Catacumbas de San Calixto', 'dia_catacumbas_san_calixto.jpg', ['Catacumbas de San Calixto'], { estrella: true }),
  H('La Vía Appia y Trastevere tranquilo (6 días en Roma)', 'Vía Appia Antica (los pinos y las tumbas)', 'dia_via_appia_antica.jpg', ['Via Appia Antica'], { estrella: true }),
  H('La Vía Appia y Trastevere tranquilo (6 días en Roma)', 'Trastevere tranquilo (la Piazza in Piscinula)', 'dia_trastevere_tranquilo.jpg', ['Trastevere tranquilo']),
  // Medios días de 2,5 días
  H('Medios días de 2,5 días', 'Plaza del Quirinal, con la vista de San Pedro', 'dia_plaza_del_quirinal.jpg', ['Plaza del Quirinal']),
  // Para más adelante
  H('Para más adelante', "El Puente y el Castillo de Sant'Angelo iluminados (otra distinta de la del Puente)", 'noche_puente_castillo_sant_angelo.jpg', ["El Puente y el Castillo de Sant'Angelo (noche)"], { nota: 'Solo si quieres una distinta de la del Puente.' }),
]

// ¿Existe cada sitio en roma.json (o es un nombre de foto propio, `foto` de una fila)? Los nombres de foto de un paseo (Paseo por el Aventino…) se piden desde la fila (`foto`).
const NOMBRES_DE_FILA = new Set(['Terraza del Altar de la Patria', 'Paseo por el Aventino', 'Paseo por Testaccio', 'Reloj de agua del Pincio', 'Trastevere tranquilo', 'Foros de Trajano', 'Santa Maria in Aracoeli', 'Escalera Santa'])
const conocidos = new Set([...D.places.map((place) => place.name), ...(D.night_experiences ?? []).map((entry) => entry.name)])
for (const hueco of HUECOS) for (const lugar of hueco.lugares) if (!conocidos.has(lugar) && !NOMBRES_DE_FILA.has(lugar)) console.warn(`AVISO: «${lugar}» no es un lugar de roma.json ni un nombre de foto de fila (${hueco.archivo})`)

if (process.argv[1]?.endsWith('fotosHuecos.mjs')) {
  const file = 'data/dias/roma/_fotos.json'
  const table = JSON.parse(fs.readFileSync(file, 'utf8'))
  // (Un hueco cuyo archivo ya está registrado en `fotos` no hace falta: esa foto ya es propia.)
  const yaRegistradas = new Set((table.fotos ?? []).map((foto) => foto.archivo))
  for (const hueco of HUECOS.filter((item) => yaRegistradas.has(item.archivo))) console.log(`(ya registrada: ${hueco.archivo}: se quita el hueco)`)
  HUECOS.splice(0, HUECOS.length, ...HUECOS.filter((item) => !yaRegistradas.has(item.archivo)))
  table.huecos = HUECOS.map(({ grupo, sitio, archivo, lugares, cuando, estrella, nota, sin_foto_hasta_llegar }) => ({ archivo, lugares, cuando, sitio, grupo, ...(estrella ? { estrella: true } : {}), ...(nota ? { nota } : {}), ...(sin_foto_hasta_llegar ? { sin_foto_hasta_llegar: true } : {}) }))
  table._huecos = 'Huecos para las fotos propias que faltan (docs/dias/FOTOS_PENDIENTES.md): cada sitio tiene un archivo FIJO en public/fotos/roma/. Se suelta la foto (1600 px de ancho o más) con ese nombre y sale sola, sin tocar nada más (el servidor mira si el archivo existe; la versión pequeña, <archivo>_p.jpg, es opcional: sin ella se usa la grande). `sin_foto_hasta_llegar`: hasta que llegue la foto, el sitio va con un recuadro neutro con su nombre y no con una buscada (su nombre no es el de un lugar que ya tenga foto). Se genera con scripts/destino/fotosHuecos.mjs.'
  // (Los sitios que no tienen foto hasta que llegue la del hueco, en `sin_foto`: el color neutro; en cuanto el archivo existe, la foto propia va primero.)
  for (const hueco of HUECOS) if (hueco.sin_foto_hasta_llegar) for (const lugar of hueco.lugares) if (!table.sin_foto.includes(lugar)) table.sin_foto.push(lugar)
  fs.writeFileSync(file, JSON.stringify(table, null, 2) + '\n')
  const hay = (archivo) => fs.existsSync(`${CARPETA}/${archivo}`)
  const l = ['# Huecos para las fotos de Roma', '', `Cada sitio tiene un archivo fijo en la carpeta \`${CARPETA}/\`. Soltando ahí la foto con ese nombre (mejor de 1600 px de ancho o más) sale sola, sin tocar nada más: de día en todos los días en que salga el sitio; la de noche, solo en su nocturna.`, '', 'Hasta que llegue, el sitio sigue con la foto de ahora; si no tiene, un recuadro neutro con su nombre (nunca una foto que no sea del sitio). ★ = sale en una pantalla de lista («Prefiero quedarme en Roma») o es de las grandes: estas, primero.', '']
  let grupo = ''
  for (const hueco of HUECOS) {
    if (hueco.grupo !== grupo) { grupo = hueco.grupo; l.push('', `## ${grupo}`, '', '| Sitio | Archivo | ¿Hay ya? |', '|---|---|---|') }
    l.push(`| ${hueco.estrella ? '★ ' : ''}${hueco.sitio}${hueco.nota ? ` — ${hueco.nota}` : ''} | \`${CARPETA}/${hueco.archivo}\` | ${hay(hueco.archivo) ? 'sí' : 'no'} |`)
  }
  fs.writeFileSync('docs/dias/FOTOS_HUECOS.md', l.join('\n') + '\n')
  console.log(`${HUECOS.length} huecos escritos`)
}
