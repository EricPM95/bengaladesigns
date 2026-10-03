// Pone como foto propia de su lugar las candidatas elegidas por el usuario (3-oct-2026): baja el original de Wikimedia Commons, lo deja en dos
// tamaños (1600 px para la ficha, 640 px para la tarjeta) en public/fotos/roma/ y lo apunta en data/dias/roma/_fotos.json con su crédito (autor,
// licencia y enlace) cuando la licencia lo pide. Y el lugar sale de `sin_foto`.
//   node scripts/destino/aplicarCandidatas.mjs [parte=1..3]   (las partes son los commits: 1 = primeras 6, 2 = siguientes 6, 3 = resto)
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const part = Number((process.argv.find((a) => a.startsWith('parte=')) ?? 'parte=0').split('=')[1])
const PICKS = [
  // [lugar en candidatas, nº, nombres que lo piden en la app, cuando, archivo]
  ['100 Presepi in Vaticano', 2, ['100 Presepi in Vaticano'], 'dia', 'dia_100_presepi_vaticano.jpg'],
  ['Altar de la Patria (noche)', 3, ['Altar de la Patria (noche)'], 'noche', 'noche_altar_de_la_patria.jpg'],
  ['Barrio Judío', 2, ['Barrio Judío'], 'dia', 'dia_barrio_judio.jpg'],
  ['Basílica de Santa Cecilia in Trastevere', 1, ['Basílica de Santa Cecilia in Trastevere'], 'dia', 'dia_basilica_santa_cecilia_trastevere.jpg'],
  ['Cementerio Protestante', 1, ['Cementerio Protestante'], 'dia', 'dia_cementerio_protestante.jpg'],
  ['Domus Aurea', 2, ['Domus Aurea'], 'dia', 'dia_domus_aurea.jpg'],
  ['Galería Nacional de Arte Moderno', 3, ['Galería Nacional de Arte Moderno'], 'dia', 'dia_galeria_nacional_arte_moderno.jpg'],
  ['Luces de Navidad del Tridente', 2, ['Luces de Navidad del Tridente'], 'dia', 'navidad_luces_tridente.jpg'],
  ['Mercado de Testaccio', 2, ['Mercado de Testaccio'], 'dia', 'dia_mercado_testaccio.jpg'],
  ['Mirador del Janículo (noche)', 2, ['Mirador del Janículo (noche)'], 'noche', 'noche_mirador_janiculo.jpg'],
  ['Nápoles (Naples Italy)', 1, ['Naples Italy'], 'dia', 'dia_napoles.jpg'],
  ['Ostia Antica (excursión)', 2, ['Ostia Antica'], 'dia', 'dia_ostia_antica.jpg'],
  ['Palazzo Doria Pamphilj (fachada)', 2, ['Palazzo Doria Pamphilj'], 'dia', 'dia_palazzo_doria_pamphilj.jpg'],
  ['Parque de Villa Borghese: el lago y el Templo de Esculapio', 2, ['Parque de Villa Borghese: el lago y el Templo de Esculapio'], 'dia', 'dia_villa_borghese_lago_templo.jpg'],
  ['Pasear por el Esquilino', 2, ['Pasear por el Esquilino'], 'dia', 'dia_esquilino.jpg'],
  ['Pasear por la Roma Antigua', 3, ['Pasear por la Roma Antigua'], 'dia', 'dia_roma_antigua.jpg'],
  ['Pasear por Trastevere (calle con color)', 1, ['Pasear por Trastevere'], 'dia', 'dia_pasear_trastevere.jpg'],
  ['Terraza del Pincio (noche)', 3, ['Terraza del Pincio (noche)'], 'noche', 'noche_terraza_pincio.jpg'],
]
const slice = part === 1 ? PICKS.slice(0, 6) : part === 2 ? PICKS.slice(6, 12) : part === 3 ? PICKS.slice(12) : PICKS

const candidates = JSON.parse(readFileSync('docs/_candidatas_commons.json', 'utf8'))
const table = JSON.parse(readFileSync('data/dias/roma/_fotos.json', 'utf8'))
const DIR = 'public/fotos/roma'
mkdirSync('tmp_candidatas', { recursive: true })
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

for (const [placeName, number, names, cuando, archivo] of slice) {
  const group = candidates.find((entry) => entry.place.n === placeName)
  const pick = group?.picked[number - 1]
  if (!pick) throw new Error(`Sin candidata: ${placeName} ${number}`)
  const tmp = `tmp_candidatas/${archivo}`
  if (!existsSync(`${DIR}/${archivo}`)) {
    let ok = false
    for (let attempt = 0; attempt < 5 && !ok; attempt++) {
      const response = await fetch(pick.original, { headers: { 'user-agent': 'route-planner-candidatas/1.0 (contacto: bengala.ingresos@gmail.com)' } })
      if (response.ok) {
        writeFileSync(tmp, Buffer.from(await response.arrayBuffer()))
        ok = true
      } else await sleep(2500 * (attempt + 1))
    }
    if (!ok) throw new Error(`No se pudo bajar: ${placeName}`)
    execFileSync('powershell', ['-NoProfile', '-File', 'scripts/destino/redimensionar.ps1', tmp, `${DIR}/${archivo}`, '1600'], { stdio: 'ignore' })
    execFileSync('powershell', ['-NoProfile', '-File', 'scripts/destino/redimensionar.ps1', tmp, `${DIR}/${archivo.replace(/\.jpg$/, '_p.jpg')}`, '640'], { stdio: 'ignore' })
    unlinkSync(tmp)
    await sleep(500)
  }
  // el crédito, solo si la licencia lo pide
  const credit = pick.requiresCredit
    ? { fuente: `Wikimedia Commons · ${pick.license}`, autor: pick.artist.replace(/\s*\(autor asumido por Commons\)/, '').trim(), enlace: pick.page }
    : { fuente: '', autor: '', enlace: '' }
  // los nombres salen de cualquier otra foto propia que los llevara, y de «sin foto»
  for (const foto of table.fotos) if (foto.archivo !== archivo) foto.lugares = (foto.lugares ?? []).filter((name) => !names.includes(name))
  table.sin_foto = table.sin_foto.filter((name) => !names.includes(name))
  table.fotos = table.fotos.filter((foto) => foto.archivo !== archivo)
  table.fotos.push({
    archivo,
    lugares: names,
    cuando,
    ancho: 1600,
    ...credit,
    nota: `Elegida por el usuario el 3-oct-2026 (candidata ${number} de «${placeName}»): Wikimedia Commons, ${pick.title}, ${pick.license}${pick.requiresCredit ? ', pide crédito' : ', sin crédito obligatorio'}.`,
  })
  console.log(`${placeName} ${number} → ${archivo}${pick.requiresCredit ? ` (crédito: ${credit.autor}, ${pick.license})` : ''}`)
}
writeFileSync('data/dias/roma/_fotos.json', JSON.stringify(table, null, 2) + '\n')
