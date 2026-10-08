// Prueba de la Tanda 6o: el código de afiliado de Civitatis (aid=5206) va en TODOS los enlaces de Civitatis de la app, y las entradas de los datos están bien puestas.
//   node scripts/destino/pruebaTanda6o.mjs [out=docs/dias/PRUEBA_TANDA6O.md]
// Recorre: (1) la regla sola, con los casos raros; (2) todos los enlaces de Civitatis que hay escritos en datos, servidor y cliente: cada uno, sellado, lleva
// aid=5206 una sola vez; (3) todo lo que abre un enlace en el cliente pasa por el sellado; (4) _entradas.json: cada sitio existe, cada enlace de Civitatis es válido y el Free Tour está.
// Los enlaces que no son de Civitatis se apuntan aparte (quedan sin código de afiliado de Civitatis).
import fs from 'node:fs'
import path from 'node:path'
import { CIVITATIS_AID, civitatisSearchUrl, isCivitatisUrl, stampCivitatis } from '../../shared/affiliate/civitatis.js'
import { entradasDe } from '../../server/engine/writtenDays.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const out = args.out ?? 'docs/dias/PRUEBA_TANDA6O.md'
const fallos = []
const fail = (regla, detalle) => fallos.push({ regla, detalle })

// 1. La regla sola.
const casos = [
  ['https://www.civitatis.com/es/roma/free-tour-roma/', {}],
  ['https://www.civitatis.com/es/roma/free-tour-roma/?aid=5206&cmp=Routy', {}],
  ['https://www.civitatis.com/es/roma/free-tour-roma/?aid=9999', {}],
  ['https://www.civitatis.com/es/buscar?q=pompeya%20desde%20roma', {}],
  ['https://civitatis.com/es/roma/', {}],
  ['https://www.civitatis.com/es/roma/?aid=1&aid=2', {}],
  ['https://www.civitatis.com/es/roma/?cmp=otro', { campaignCode: 'app-8F3K2' }],
]
for (const [url, options] of casos) {
  const sellado = new URL(stampCivitatis(url, options))
  if (sellado.searchParams.getAll('aid').join() !== CIVITATIS_AID) fail('aid_unico', `${url} → ${sellado}`)
  if (options.campaignCode && sellado.searchParams.get('cmp') !== options.campaignCode) fail('campana', `${url} → ${sellado}`)
  if (stampCivitatis(sellado.toString(), options) !== sellado.toString()) fail('idempotente', url)
}
for (const url of ['https://www.booking.com/searchresults.html?ss=Roma', 'https://notcivitatis.com/x', 'https://civitatis.com.evil.example/x', '#', '', 'no es un enlace']) {
  if (stampCivitatis(url) !== url) fail('no_toca_lo_ajeno', url)
}
if (CIVITATIS_AID !== '5206') fail('aid_5206', CIVITATIS_AID)

// 2. Todos los enlaces escritos.
const ROOTS = ['data', 'server', 'shared', 'src']
const IGNORAR = new Set(['node_modules', '.git', 'archivo', 'fotos', '__tests__'])
const todos = []
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORAR.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(json|js|mjs|ts|tsx)$/.test(entry.name)) todos.push(full)
  }
}
for (const root of ROOTS) if (fs.existsSync(root)) walk(root)
const enlaces = new Map()
for (const file of todos) {
  const text = fs.readFileSync(file, 'utf8')
  for (const match of text.matchAll(/https?:\/\/[^\s"'`)<>\\]+/g)) {
    const url = match[0].replace(/[.,;]+$/, '')
    if (!enlaces.has(url)) enlaces.set(url, new Set())
    enlaces.get(url).add(file.replaceAll('\\', '/'))
  }
}
let civitatis = 0
const ajenos = new Map()
for (const [url, ficheros] of enlaces) {
  if (/\$\{|\{\w/.test(url)) continue
  if (isCivitatisUrl(url)) {
    civitatis++
    let sellado
    try {
      sellado = new URL(stampCivitatis(url))
    } catch {
      fail('enlace_roto', `${url} (${[...ficheros][0]})`)
      continue
    }
    if (sellado.searchParams.getAll('aid').join() !== CIVITATIS_AID) fail('civitatis_sin_aid', `${url} (${[...ficheros][0]})`)
  } else {
    const host = (() => {
      try {
        return new URL(url).hostname
      } catch {
        return null
      }
    })()
    if (host && !/^(www\.)?(w3\.org|localhost|example\.|schema\.org|fonts\.|api\.mapbox|events\.mapbox|openstreetmap|xmlns)/.test(host)) ajenos.set(host, (ajenos.get(host) ?? 0) + 1)
  }
}

// 2b. Los enlaces que se construyen (no están escritos): la búsqueda de cada excursión y de cada entrada, de todos los destinos.
const busquedas = new Set()
const recoger = (valor) => {
  if (Array.isArray(valor)) valor.forEach(recoger)
  else if (valor && typeof valor === 'object') {
    for (const [clave, v] of Object.entries(valor)) {
      if (clave === 'civitatis_search' && typeof v === 'string') busquedas.add(v)
      else recoger(v)
    }
  }
}
for (const file of todos.filter((f) => f.endsWith('.json') && f.replaceAll('\\', '/').startsWith('data/'))) {
  try {
    recoger(JSON.parse(fs.readFileSync(file, 'utf8')))
  } catch {
    /* un JSON que no se puede leer no es un enlace */
  }
}
for (const lista of Object.values(entradasDe('roma'))) for (const entrada of lista) busquedas.add(`${entrada.nombre} Roma`)
for (const q of busquedas) {
  const url = civitatisSearchUrl(q)
  if (!isCivitatisUrl(url) || new URL(url).searchParams.getAll('aid').join() !== CIVITATIS_AID) fail('busqueda_sin_aid', q)
}
civitatis += busquedas.size

// 3. Todo lo que abre un enlace en el cliente pasa por el sellado.
const cliente = todos.filter((f) => f.replaceAll('\\', '/').startsWith('src/'))
for (const file of cliente) {
  const texto = fs.readFileSync(file, 'utf8')
  const f = file.replaceAll('\\', '/')
  if (/window\.open\(/.test(texto) && f !== 'src/components/route/reservas/EntradaCard.tsx') fail('window_open_sin_sellar', f)
  if (/location\.(assign|replace)\(|location\.href\s*=/.test(texto) && !/shareUrl/.test(f)) fail('location_sin_sellar', f)
}
const entradaCard = fs.readFileSync('src/components/route/reservas/EntradaCard.tsx', 'utf8')
if (!/window\.open\(withCampaign\(/.test(entradaCard)) fail('open_ticket_shop_sin_sellar', 'EntradaCard.tsx')
const campaignLinks = fs.readFileSync('src/components/sync/CampaignLinks.tsx', 'utf8')
if (/if \(!route\) return/.test(campaignLinks)) fail('campaign_links_exige_viaje', 'CampaignLinks.tsx: el aid va también sin viaje abierto')
if (!cliente.some((f) => /<CampaignLinks\s*\/>/.test(fs.readFileSync(f, 'utf8')) && !f.endsWith('CampaignLinks.tsx'))) fail('campaign_links_no_montado', 'ningún componente monta <CampaignLinks />')

// 4. _entradas.json.
const roma = JSON.parse(fs.readFileSync('data/pipeline_v2/roma.json', 'utf8'))
const nombres = new Set(roma.places.map((p) => p.name))
const entradas = entradasDe('roma')
for (const [sitio, lista] of Object.entries(entradas)) {
  if (sitio !== 'Free Tour' && !nombres.has(sitio)) fail('entrada_de_sitio_inexistente', sitio)
  if (!Array.isArray(lista) || lista.length === 0) fail('entradas_vacias', sitio)
  for (const entrada of lista ?? []) {
    if (!entrada.nombre) fail('entrada_sin_nombre', sitio)
    if (entrada.desde != null && !(entrada.desde >= 0)) fail('precio_raro', `${sitio}: ${entrada.desde}`)
    if (entrada.url && isCivitatisUrl(entrada.url) && new URL(stampCivitatis(entrada.url)).searchParams.get('aid') !== CIVITATIS_AID) fail('entrada_sin_aid', sitio)
  }
}
const ft = entradas['Free Tour']?.[0]
if (!ft?.url || !/civitatis\.com\/es\/roma\/free-tour-roma\//.test(ft.url)) fail('free_tour_sin_enlace', JSON.stringify(ft))

const resumen = { enlaces_civitatis: civitatis, hosts_ajenos: Object.fromEntries([...ajenos].sort((a, b) => b[1] - a[1])), sitios_con_entradas: Object.keys(entradas).length, fallos: fallos.length, porRegla: Object.fromEntries(fallos.map((x) => x.regla).map((r) => [r, fallos.filter((x) => x.regla === r).length])) }
const md = [
  '# Prueba de la Tanda 6o',
  '',
  `Enlaces de Civitatis escritos en datos, servidor y cliente: **${civitatis}**; todos, sellados, llevan \`aid=${CIVITATIS_AID}\` una sola vez.`,
  `Sitios con entradas en \`_entradas.json\` (con el Free Tour): **${Object.keys(entradas).length}**.`,
  `Fallos: **${fallos.length}**.`,
  '',
  '## Hosts que no son de Civitatis (sin su código de afiliado)',
  '',
  ...[...ajenos].sort((a, b) => b[1] - a[1]).map(([host, n]) => `- ${host} (${n})`),
  '',
  ...(fallos.length ? ['## Fallos', '', ...fallos.map((x) => `- ${x.regla}: ${x.detalle}`)] : []),
].join('\n')
fs.writeFileSync(out, md + '\n')
console.log(JSON.stringify(resumen))
if (fallos.length) {
  for (const x of fallos.slice(0, 20)) console.log(`FALLO ${x.regla}: ${x.detalle}`)
  process.exit(1)
}
