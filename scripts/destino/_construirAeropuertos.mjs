// Construye src/data/aeropuertos.json a partir de OurAirports (dominio público): solo aeropuertos con vuelos regulares y código IATA.
// Uso: node scripts/destino/_construirAeropuertos.mjs <airports.csv>
//   Fuente: https://davidmegginson.github.io/ourairports-data/airports.csv  (OurAirports, https://ourairports.com/data/, Public Domain)
// Salida: { fuente, licencia, zonas: [IANA...], a: [[iata, nombre, municipio, pais, indiceDeZona, lat, lon], ...] }
import fs from 'node:fs'

const entrada = process.argv[2]
if (!entrada) throw new Error('Falta el airports.csv')

function filas(texto) {
  const out = []
  let fila = [], campo = '', comillas = false
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (comillas) {
      if (c === '"') { if (texto[i + 1] === '"') { campo += '"'; i++ } else comillas = false } else campo += c
    } else if (c === '"') comillas = true
    else if (c === ',') { fila.push(campo); campo = '' }
    else if (c === '\n') { fila.push(campo.replace(/\r$/, '')); out.push(fila); fila = []; campo = '' }
    else campo += c
  }
  if (campo || fila.length) { fila.push(campo); out.push(fila) }
  return out
}

// Zona horaria por país (la principal). Los países con varias se afinan abajo por región o longitud.
const PAIS = {
  ES: 'Europe/Madrid', PT: 'Europe/Lisbon', FR: 'Europe/Paris', IT: 'Europe/Rome', DE: 'Europe/Berlin', GB: 'Europe/London', IE: 'Europe/Dublin', NL: 'Europe/Amsterdam',
  BE: 'Europe/Brussels', LU: 'Europe/Luxembourg', CH: 'Europe/Zurich', AT: 'Europe/Vienna', CZ: 'Europe/Prague', SK: 'Europe/Bratislava', PL: 'Europe/Warsaw', HU: 'Europe/Budapest',
  SI: 'Europe/Ljubljana', HR: 'Europe/Zagreb', BA: 'Europe/Sarajevo', RS: 'Europe/Belgrade', ME: 'Europe/Podgorica', MK: 'Europe/Skopje', AL: 'Europe/Tirane', XK: 'Europe/Belgrade',
  GR: 'Europe/Athens', BG: 'Europe/Sofia', RO: 'Europe/Bucharest', MD: 'Europe/Chisinau', UA: 'Europe/Kyiv', BY: 'Europe/Minsk', LT: 'Europe/Vilnius', LV: 'Europe/Riga', EE: 'Europe/Tallinn',
  FI: 'Europe/Helsinki', SE: 'Europe/Stockholm', NO: 'Europe/Oslo', DK: 'Europe/Copenhagen', IS: 'Atlantic/Reykjavik', MT: 'Europe/Malta', CY: 'Asia/Nicosia', AD: 'Europe/Andorra',
  MC: 'Europe/Monaco', SM: 'Europe/San_Marino', VA: 'Europe/Vatican', LI: 'Europe/Vaduz', GI: 'Europe/Gibraltar', TR: 'Europe/Istanbul', FO: 'Atlantic/Faroe', GL: 'America/Nuuk',
  MA: 'Africa/Casablanca', DZ: 'Africa/Algiers', TN: 'Africa/Tunis', LY: 'Africa/Tripoli', EG: 'Africa/Cairo', SN: 'Africa/Dakar', CI: 'Africa/Abidjan', GH: 'Africa/Accra', NG: 'Africa/Lagos',
  CM: 'Africa/Douala', ET: 'Africa/Addis_Ababa', KE: 'Africa/Nairobi', TZ: 'Africa/Dar_es_Salaam', UG: 'Africa/Kampala', RW: 'Africa/Kigali', ZA: 'Africa/Johannesburg', NA: 'Africa/Windhoek',
  BW: 'Africa/Gaborone', ZW: 'Africa/Harare', ZM: 'Africa/Lusaka', MZ: 'Africa/Maputo', AO: 'Africa/Luanda', MG: 'Indian/Antananarivo', MU: 'Indian/Mauritius', SC: 'Indian/Mahe', RE: 'Indian/Reunion',
  CV: 'Atlantic/Cape_Verde', ML: 'Africa/Bamako', BF: 'Africa/Ouagadougou', NE: 'Africa/Niamey', TD: 'Africa/Ndjamena', SD: 'Africa/Khartoum', MR: 'Africa/Nouakchott', GN: 'Africa/Conakry',
  GM: 'Africa/Banjul', SL: 'Africa/Freetown', LR: 'Africa/Monrovia', TG: 'Africa/Lome', BJ: 'Africa/Porto-Novo', GA: 'Africa/Libreville', CG: 'Africa/Brazzaville', CD: 'Africa/Kinshasa',
  IL: 'Asia/Jerusalem', JO: 'Asia/Amman', LB: 'Asia/Beirut', SY: 'Asia/Damascus', IQ: 'Asia/Baghdad', IR: 'Asia/Tehran', SA: 'Asia/Riyadh', AE: 'Asia/Dubai', QA: 'Asia/Qatar', BH: 'Asia/Bahrain',
  KW: 'Asia/Kuwait', OM: 'Asia/Muscat', YE: 'Asia/Aden', AM: 'Asia/Yerevan', AZ: 'Asia/Baku', GE: 'Asia/Tbilisi', UZ: 'Asia/Tashkent', TJ: 'Asia/Dushanbe', KG: 'Asia/Bishkek',
  TM: 'Asia/Ashgabat', AF: 'Asia/Kabul', PK: 'Asia/Karachi', IN: 'Asia/Kolkata', LK: 'Asia/Colombo', NP: 'Asia/Kathmandu', BD: 'Asia/Dhaka', BT: 'Asia/Thimphu', MV: 'Indian/Maldives',
  MM: 'Asia/Yangon', TH: 'Asia/Bangkok', LA: 'Asia/Vientiane', KH: 'Asia/Phnom_Penh', VN: 'Asia/Ho_Chi_Minh', MY: 'Asia/Kuala_Lumpur', SG: 'Asia/Singapore', BN: 'Asia/Brunei',
  PH: 'Asia/Manila', CN: 'Asia/Shanghai', HK: 'Asia/Hong_Kong', MO: 'Asia/Macau', TW: 'Asia/Taipei', KR: 'Asia/Seoul', KP: 'Asia/Pyongyang', JP: 'Asia/Tokyo', MN: 'Asia/Ulaanbaatar',
  NZ: 'Pacific/Auckland', FJ: 'Pacific/Fiji', PG: 'Pacific/Port_Moresby', NC: 'Pacific/Noumea', PF: 'Pacific/Tahiti', WS: 'Pacific/Apia', TO: 'Pacific/Tongatapu', VU: 'Pacific/Efate',
  CU: 'America/Havana', DO: 'America/Santo_Domingo', HT: 'America/Port-au-Prince', JM: 'America/Jamaica', BS: 'America/Nassau', PR: 'America/Puerto_Rico', BB: 'America/Barbados',
  TT: 'America/Port_of_Spain', CR: 'America/Costa_Rica', PA: 'America/Panama', NI: 'America/Managua', HN: 'America/Tegucigalpa', SV: 'America/El_Salvador', GT: 'America/Guatemala', BZ: 'America/Belize',
  CO: 'America/Bogota', VE: 'America/Caracas', EC: 'America/Guayaquil', PE: 'America/Lima', BO: 'America/La_Paz', PY: 'America/Asuncion', UY: 'America/Montevideo', AR: 'America/Argentina/Buenos_Aires',
  CL: 'America/Santiago', GY: 'America/Guyana', SR: 'America/Paramaribo', AW: 'America/Aruba', CW: 'America/Curacao', KY: 'America/Cayman', BM: 'Atlantic/Bermuda', GP: 'America/Guadeloupe', MQ: 'America/Martinique',
  US: 'America/New_York', CA: 'America/Toronto', MX: 'America/Mexico_City', BR: 'America/Sao_Paulo', AU: 'Australia/Sydney', RU: 'Europe/Moscow', KZ: 'Asia/Almaty', ID: 'Asia/Jakarta',
}
const ESTADOS_US = {
  'US-CA': 'America/Los_Angeles', 'US-WA': 'America/Los_Angeles', 'US-OR': 'America/Los_Angeles', 'US-NV': 'America/Los_Angeles',
  'US-AZ': 'America/Phoenix', 'US-UT': 'America/Denver', 'US-CO': 'America/Denver', 'US-NM': 'America/Denver', 'US-WY': 'America/Denver', 'US-MT': 'America/Denver', 'US-ID': 'America/Boise',
  'US-TX': 'America/Chicago', 'US-OK': 'America/Chicago', 'US-KS': 'America/Chicago', 'US-NE': 'America/Chicago', 'US-SD': 'America/Chicago', 'US-ND': 'America/Chicago', 'US-MN': 'America/Chicago',
  'US-IA': 'America/Chicago', 'US-MO': 'America/Chicago', 'US-AR': 'America/Chicago', 'US-LA': 'America/Chicago', 'US-MS': 'America/Chicago', 'US-AL': 'America/Chicago', 'US-WI': 'America/Chicago',
  'US-IL': 'America/Chicago', 'US-TN': 'America/Chicago', 'US-AK': 'America/Anchorage', 'US-HI': 'Pacific/Honolulu', 'US-GU': 'Pacific/Guam',
}
const CANADA = { 'CA-BC': 'America/Vancouver', 'CA-AB': 'America/Edmonton', 'CA-SK': 'America/Regina', 'CA-MB': 'America/Winnipeg', 'CA-NS': 'America/Halifax', 'CA-NB': 'America/Moncton', 'CA-NL': 'America/St_Johns', 'CA-PE': 'America/Halifax', 'CA-YT': 'America/Whitehorse', 'CA-NT': 'America/Yellowknife', 'CA-NU': 'America/Iqaluit' }
const AUS = { 'AU-WA': 'Australia/Perth', 'AU-NT': 'Australia/Darwin', 'AU-SA': 'Australia/Adelaide', 'AU-QLD': 'Australia/Brisbane', 'AU-QL': 'Australia/Brisbane', 'AU-VIC': 'Australia/Melbourne', 'AU-TAS': 'Australia/Hobart' }
const MEX = { 'MX-BCN': 'America/Tijuana', 'MX-BCS': 'America/Mazatlan', 'MX-SON': 'America/Hermosillo', 'MX-SIN': 'America/Mazatlan', 'MX-CHH': 'America/Chihuahua', 'MX-NAY': 'America/Mazatlan', 'MX-ROO': 'America/Cancun' }
const BRA = { 'BR-AM': 'America/Manaus', 'BR-MT': 'America/Cuiaba', 'BR-MS': 'America/Campo_Grande', 'BR-AC': 'America/Rio_Branco', 'BR-RO': 'America/Porto_Velho', 'BR-RR': 'America/Boa_Vista', 'BR-FN': 'America/Noronha' }

function zonaDe(pais, region, lon) {
  if (pais === 'ES' && region === 'ES-CN') return 'Atlantic/Canary'
  if (pais === 'PT' && /PT-(20|30)/.test(region)) return 'Atlantic/Azores'
  if (pais === 'US') return ESTADOS_US[region] ?? 'America/New_York'
  if (pais === 'CA') return CANADA[region] ?? (lon < -102 ? 'America/Edmonton' : lon < -87 ? 'America/Winnipeg' : 'America/Toronto')
  if (pais === 'AU') return AUS[region] ?? 'Australia/Sydney'
  if (pais === 'MX') return MEX[region] ?? 'America/Mexico_City'
  if (pais === 'BR') return BRA[region] ?? 'America/Sao_Paulo'
  if (pais === 'RU') return lon < 47 ? 'Europe/Moscow' : lon < 60 ? 'Europe/Samara' : lon < 73 ? 'Asia/Yekaterinburg' : lon < 85 ? 'Asia/Omsk' : lon < 100 ? 'Asia/Krasnoyarsk' : lon < 115 ? 'Asia/Irkutsk' : lon < 130 ? 'Asia/Yakutsk' : lon < 142 ? 'Asia/Vladivostok' : lon < 160 ? 'Asia/Magadan' : 'Asia/Kamchatka'
  if (pais === 'ID') return lon < 109 ? 'Asia/Jakarta' : lon < 128 ? 'Asia/Makassar' : 'Asia/Jayapura'
  if (pais === 'KZ') return lon > 62 ? 'Asia/Almaty' : 'Asia/Aqtobe'
  return PAIS[pais] ?? null
}

const [cab, ...datos] = filas(fs.readFileSync(entrada, 'utf8'))
const col = Object.fromEntries(cab.map((c, i) => [c, i]))
const zonas = []
const salida = []
let sinZona = 0
for (const f of datos) {
  const iata = f[col.iata_code]
  if (!iata || f[col.scheduled_service] !== 'yes') continue
  if (!['large_airport', 'medium_airport', 'small_airport'].includes(f[col.type])) continue
  const pais = f[col.iso_country]
  const lon = Number(f[col.longitude_deg]), lat = Number(f[col.latitude_deg])
  const zona = zonaDe(pais, f[col.iso_region], lon)
  if (!zona) sinZona++
  let z = zona ? zonas.indexOf(zona) : -1
  if (zona && z < 0) { zonas.push(zona); z = zonas.length - 1 }
  salida.push([iata, f[col.name], f[col.municipality], pais, z, Math.round(lat * 100) / 100, Math.round(lon * 100) / 100])
}
salida.sort((a, b) => a[0].localeCompare(b[0]))
fs.mkdirSync('src/data', { recursive: true })
const json = JSON.stringify({ fuente: 'OurAirports (https://ourairports.com/data/), airports.csv', licencia: 'Dominio público (Public Domain)', zonas, a: salida })
fs.writeFileSync('src/data/aeropuertos.json', json)
console.log(`aeropuertos: ${salida.length}, zonas: ${zonas.length}, sin zona: ${sinZona}, bytes: ${json.length}`)
