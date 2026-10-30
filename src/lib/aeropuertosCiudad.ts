/**
 * QUÉ AEROPUERTOS TIENE CADA CIUDAD (10S5, M). Para «Sales de» / «Llegas a» (con la ciudad de salida del viaje: «Barcelona (El Prat)» si tiene uno solo; solo «Londres» si tiene varios)
 * y para poner ciudad, zona horaria y nombre corto a un código de aeropuerto leído de un billete.
 *
 * FUENTE DE LOS DATOS: OurAirports (https://ourairports.com/data/, airports.csv), DOMINIO PÚBLICO (Public Domain, sin obligación de citar). Guardada en `src/data/aeropuertos.json`
 * (4.010 aeropuertos con vuelos regulares y código IATA, ≈280 KB, ≈80 KB comprimida) por `scripts/destino/_construirAeropuertos.mjs`. Se CARGA BAJO DEMANDA (import dinámico): no pesa
 * en la descarga de la app. La zona horaria de cada aeropuerto sale de su país y, en los países con varias, de su región o su longitud (la hora de cada país se calcula con `Intl`, con su cambio de hora).
 *
 * Dos capas, para no esperar a la red en lo corriente:
 *  - la TABLA CORTA de aquí (≈90 ciudades que se piden de verdad, con sus aeropuertos revisados a mano, nombres en español): respuesta al momento, síncrona;
 *  - el JSON completo (bajo demanda) para el resto: ciudad = municipio del aeropuerto (con los apellidos «, Essex» o «(VA)» quitados).
 * Lo que no esté en ninguna de las dos → solo la ciudad, sin paréntesis (el viajero añade el suyo): nunca se inventa un aeropuerto.
 */

export interface AeropuertoInfo {
  iata: string
  /** El nombre oficial, en inglés o como esté en la fuente. */
  nombre: string
  /** El nombre corto que se pone entre paréntesis: «El Prat», «Fiumicino». */
  corto: string
  ciudad: string
  /** ISO de 2 letras. */
  pais: string
  /** Zona IANA («Europe/Madrid»); `null` si no se sabe. */
  zona: string | null
}

// «Nombre en español|otros nombres separados por coma|IATA separados por coma|corto (solo con un aeropuerto)|país». Con varios IATA no hay corto: solo se pone la ciudad.
const CIUDADES = `
Barcelona|Barcelona|BCN|El Prat|ES
Madrid|Madrid|MAD|Barajas|ES
Sevilla|Seville|SVQ|San Pablo|ES
Valencia|Valencia|VLC|Manises|ES
Málaga|Malaga|AGP|Costa del Sol|ES
Bilbao|Bilbo|BIO|Loiu|ES
Alicante|Alacant|ALC|El Altet|ES
Palma de Mallorca|Palma,Palma Mallorca,Mallorca|PMI|Son Sant Joan|ES
Ibiza|Eivissa|IBZ|Ibiza|ES
Menorca|Mahón,Mahon,Maó|MAH|Menorca|ES
Santiago de Compostela|Santiago|SCQ|Rosalía de Castro|ES
Granada|Granada|GRX|Federico García Lorca|ES
Zaragoza|Zaragoza|ZAZ|Zaragoza|ES
Asturias|Oviedo,Gijón,Gijon|OVD|Asturias|ES
Santander|Santander|SDR|Seve Ballesteros|ES
Vigo|Vigo|VGO|Peinador|ES
A Coruña|La Coruña,Coruña,A Coruna|LCG|Alvedro|ES
Gran Canaria|Las Palmas,Las Palmas de Gran Canaria|LPA|Gran Canaria|ES
Tenerife|Santa Cruz de Tenerife|TFN,TFS||ES
Lanzarote|Arrecife|ACE|Lanzarote|ES
Fuerteventura|Fuerteventura|FUE|Fuerteventura|ES
Girona|Gerona|GRO|Girona-Costa Brava|ES
Lisboa|Lisbon,Lisboa|LIS|Humberto Delgado|PT
Oporto|Porto|OPO|Francisco Sá Carneiro|PT
Faro|Faro|FAO|Faro|PT
Roma|Rome,Roma|FCO,CIA||IT
Milán|Milan,Milano|MXP,LIN,BGY||IT
Venecia|Venice,Venezia|VCE,TSF||IT
Florencia|Florence,Firenze|FLR|Peretola|IT
Nápoles|Naples,Napoli|NAP|Capodichino|IT
Bolonia|Bologna|BLQ|Marconi|IT
Turín|Turin,Torino|TRN|Caselle|IT
Palermo|Palermo|PMO|Falcone-Borsellino|IT
Catania|Catania|CTA|Fontanarossa|IT
Cagliari|Cagliari|CAG|Elmas|IT
Génova|Genoa,Genova|GOA|Cristoforo Colombo|IT
Verona|Verona|VRN|Villafranca|IT
Pisa|Pisa|PSA|Galileo Galilei|IT
Bari|Bari|BRI|Karol Wojtyła|IT
París|Paris|CDG,ORY||FR
Niza|Nice|NCE|Costa Azul|FR
Marsella|Marseille|MRS|Provenza|FR
Lyon|Lyon|LYS|Saint-Exupéry|FR
Toulouse|Toulouse|TLS|Blagnac|FR
Burdeos|Bordeaux|BOD|Mérignac|FR
Nantes|Nantes|NTE|Atlantique|FR
Estrasburgo|Strasbourg|SXB|Entzheim|FR
Londres|London|LHR,LGW,STN,LTN,LCY,SEN||GB
Manchester|Manchester|MAN|Manchester|GB
Edimburgo|Edinburgh|EDI|Edimburgo|GB
Birmingham|Birmingham|BHX|Birmingham|GB
Liverpool|Liverpool|LPL|John Lennon|GB
Glasgow|Glasgow|GLA,PIK||GB
Bristol|Bristol|BRS|Bristol|GB
Dublín|Dublin|DUB|Dublín|IE
Ámsterdam|Amsterdam|AMS|Schiphol|NL
Róterdam|Rotterdam|RTM|Róterdam-La Haya|NL
Bruselas|Brussels,Bruxelles|BRU,CRL||BE
Berlín|Berlin|BER|Brandeburgo|DE
Múnich|Munich,München|MUC|Franz Josef Strauss|DE
Fráncfort|Frankfurt|FRA|Fráncfort|DE
Hamburgo|Hamburg|HAM|Fuhlsbüttel|DE
Düsseldorf|Dusseldorf,Düsseldorf|DUS|Düsseldorf|DE
Colonia|Cologne,Köln|CGN|Colonia-Bonn|DE
Stuttgart|Stuttgart|STR|Echterdingen|DE
Viena|Vienna,Wien|VIE|Schwechat|AT
Zúrich|Zurich,Zürich|ZRH|Kloten|CH
Ginebra|Geneva,Genève|GVA|Cointrin|CH
Praga|Prague,Praha|PRG|Václav Havel|CZ
Budapest|Budapest|BUD|Liszt Ferenc|HU
Varsovia|Warsaw,Warszawa|WAW,WMI||PL
Cracovia|Krakow,Kraków|KRK|Juan Pablo II|PL
Atenas|Athens,Atenas|ATH|Venizelos|GR
Copenhague|Copenhagen,København|CPH|Kastrup|DK
Estocolmo|Stockholm|ARN,BMA,NYO||SE
Oslo|Oslo|OSL,TRF,RYG||NO
Helsinki|Helsinki|HEL|Vantaa|FI
Reikiavik|Reykjavik,Reykjavík|KEF,RKV||IS
Estambul|Istanbul,İstanbul|IST,SAW||TR
Moscú|Moscow,Moskva|SVO,DME,VKO||RU
Nueva York|New York,New York City|JFK,EWR,LGA||US
Los Ángeles|Los Angeles|LAX,BUR,SNA,LGB,ONT||US
Chicago|Chicago|ORD,MDW||US
Miami|Miami|MIA,FLL||US
San Francisco|San Francisco|SFO,OAK,SJC||US
Washington|Washington,Washington DC|IAD,DCA,BWI||US
Boston|Boston|BOS|Logan|US
Las Vegas|Las Vegas|LAS|Harry Reid|US
Ciudad de México|Mexico City,Ciudad de Mexico,México DF|MEX,NLU||MX
Cancún|Cancun|CUN|Cancún|MX
Buenos Aires|Buenos Aires|EZE,AEP||AR
Santiago de Chile|Santiago de Chile|SCL|Arturo Merino Benítez|CL
Lima|Lima|LIM|Jorge Chávez|PE
Bogotá|Bogota|BOG|El Dorado|CO
São Paulo|Sao Paulo,São Paulo|GRU,CGH,VCP||BR
Río de Janeiro|Rio de Janeiro|GIG,SDU||BR
Tokio|Tokyo|HND,NRT||JP
Osaka|Osaka|KIX,ITM||JP
Seúl|Seoul|ICN,GMP||KR
Pekín|Beijing,Peking|PEK,PKX||CN
Shanghái|Shanghai|PVG,SHA||CN
Bangkok|Bangkok|BKK,DMK||TH
Singapur|Singapore|SIN|Changi|SG
Dubái|Dubai|DXB,DWC||AE
Doha|Doha|DOH|Hamad|QA
El Cairo|Cairo|CAI|El Cairo|EG
Marrakech|Marrakesh,Marrakech|RAK|Menara|MA
Casablanca|Casablanca|CMN|Mohammed V|MA
Lagos|Lagos|LOS|Murtala Muhammed|NG
Johannesburgo|Johannesburg|JNB|O. R. Tambo|ZA
Ciudad del Cabo|Cape Town|CPT|Ciudad del Cabo|ZA
Sídney|Sydney|SYD|Kingsford Smith|AU
Melbourne|Melbourne|MEL,AVV||AU
Auckland|Auckland|AKL|Auckland|NZ
Toronto|Toronto|YYZ,YTZ||CA
Montreal|Montreal,Montréal|YUL|Trudeau|CA
`

// Estaciones de tren principales que no ofrecen duda (la ciudad tiene UNA estación principal). Solo estas: en Madrid, Barcelona o Roma hay varias y el viajero elige.
const ESTACIONES: Record<string, string> = {
  sevilla: 'Santa Justa', zaragoza: 'Delicias', malaga: 'María Zambrano', cordoba: 'Central', florencia: 'Santa Maria Novella', napoles: 'Centrale', bolonia: 'Centrale', turin: 'Porta Nuova',
}

// Nombres cortos de los aeropuertos de ciudades con varios (los que van entre paréntesis en el trayecto: «Roma (Fiumicino)»).
const CORTOS_VARIOS: Record<string, string> = {
  FCO: 'Fiumicino', CIA: 'Ciampino', LHR: 'Heathrow', LGW: 'Gatwick', STN: 'Stansted', LTN: 'Luton', LCY: 'London City', SEN: 'Southend', CDG: 'Charles de Gaulle', ORY: 'Orly',
  MXP: 'Malpensa', LIN: 'Linate', BGY: 'Orio al Serio', JFK: 'JFK', EWR: 'Newark', LGA: 'LaGuardia', VCE: 'Marco Polo', TSF: 'Treviso', BRU: 'Zaventem', CRL: 'Charleroi',
  ARN: 'Arlanda', BMA: 'Bromma', IST: 'Estambul', SAW: 'Sabiha Gökçen', HND: 'Haneda', NRT: 'Narita', TFN: 'Tenerife Norte', TFS: 'Tenerife Sur', WAW: 'Chopin', WMI: 'Modlin',
  KEF: 'Keflavík', OSL: 'Gardermoen', SVO: 'Sheremétievo', DME: 'Domodédovo', VKO: 'Vnúkovo', LAX: 'LAX', EZE: 'Ezeiza', AEP: 'Aeroparque', GIG: 'Galeão', SDU: 'Santos Dumont',
}

interface CiudadCorta { nombre: string; alias: string[]; iatas: string[]; corto: string | null; pais: string }

export function normalizarCiudad(texto: string): string {
  return texto
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    // «Barcelona, España» / «Barcelona (BCN)» / «Barcelona-El Prat»: la ciudad es lo primero.
    .replace(/\s*[,(].*$/, '')
    .replace(/\s*-\s*.*$/, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const TABLA: CiudadCorta[] = CIUDADES.trim().split('\n').map((linea) => {
  const [nombre, alias, iatas, corto, pais] = linea.split('|')
  return { nombre, alias: alias.split(','), iatas: iatas.split(','), corto: corto || null, pais }
})
const POR_NOMBRE = new Map<string, CiudadCorta>()
for (const c of TABLA) for (const n of [c.nombre, ...c.alias]) POR_NOMBRE.set(normalizarCiudad(n), c)

/** La ciudad de la tabla corta, o `null`. */
function ciudadCorta(ciudad: string): CiudadCorta | null {
  return POR_NOMBRE.get(normalizarCiudad(ciudad)) ?? null
}

/** Con un solo aeropuerto → «Barcelona (El Prat)»; con varios o sin datos → «Londres» (la ciudad como la escribió el viajero, con su nombre en español si la conocemos). Síncrona: solo la tabla corta. */
export function etiquetaDeCiudadConPunto(ciudad: string | null | undefined): string {
  const limpia = (ciudad ?? '').replace(/\s+/g, ' ').trim()
  if (!limpia) return ''
  const c = ciudadCorta(limpia)
  if (!c) return limpia
  return c.iatas.length === 1 && c.corto ? `${c.nombre} (${c.corto})` : c.nombre
}

/** Como la anterior, pero para el tren: la estación principal solo si no hay duda. */
export function etiquetaDeCiudadConEstacion(ciudad: string | null | undefined): string {
  const limpia = (ciudad ?? '').replace(/\s+/g, ' ').trim()
  if (!limpia) return ''
  const est = ESTACIONES[normalizarCiudad(limpia)]
  const c = ciudadCorta(limpia)
  return est ? `${c?.nombre ?? limpia} (${est})` : c?.nombre ?? limpia
}

/** Los códigos IATA de los aeropuertos de la ciudad según la tabla corta (vacío si no está). Síncrona. */
export function iatasDeCiudad(ciudad: string | null | undefined): string[] {
  const c = ciudad ? ciudadCorta(ciudad) : null
  return c ? [...c.iatas] : []
}

// ── El JSON completo, bajo demanda ──────────────────────────────────────────────────────────────────────
interface DatosAeropuertos { fuente: string; licencia: string; zonas: string[]; a: Array<[string, string, string, string, number, number, number]> }
let cargando: Promise<DatosAeropuertos> | null = null
let ya: DatosAeropuertos | null = null
let indice: Map<string, AeropuertoInfo> | null = null

/** Carga el JSON de aeropuertos (una sola vez; trozo aparte de la descarga). */
export function cargarAeropuertos(): Promise<DatosAeropuertos> {
  if (!cargando) cargando = import('../data/aeropuertos.json').then((m) => { ya = (m.default ?? m) as unknown as DatosAeropuertos; return ya })
  return cargando
}

/** El municipio como ciudad: sin «, Essex», sin «(VA)», sin «Island». */
function ciudadDeMunicipio(m: string): string {
  return m.replace(/\s*\(.*\)\s*$/, '').replace(/,.*$/, '').trim()
}

function nombreCorto(nombre: string, ciudad: string): string {
  // «Bergen Airport, Flesland» → «Flesland»: lo que va tras la coma es el nombre propio.
  if (nombre.includes(',')) nombre = nombre.slice(nombre.lastIndexOf(',') + 1)
  const sinPalabras = nombre
    .replace(/\b(International|Intl|Airport|Airfield|Aeropuerto|Aeroporto|Aéroport|Flughafen|de|di|Internacional|Regional)\b/gi, ' ')
    .replace(/\s+/g, ' ').replace(/^[\s\-–]+|[\s\-–]+$/g, '').trim()
  return sinPalabras || ciudad
}

function construirIndice(d: DatosAeropuertos): Map<string, AeropuertoInfo> {
  if (indice) return indice
  indice = new Map()
  for (const [iata, nombre, municipio, pais, z] of d.a) {
    const ciudad = ciudadDeMunicipio(municipio)
    indice.set(iata, { iata, nombre, corto: CORTOS_VARIOS[iata] ?? nombreCorto(nombre, ciudad), ciudad, pais, zona: z >= 0 ? d.zonas[z] : null })
  }
  // Los nombres cortos y las ciudades de la tabla revisada mandan sobre lo derivado.
  for (const c of TABLA) for (const iata of c.iatas) {
    const a = indice.get(iata)
    if (a) indice.set(iata, { ...a, ciudad: c.nombre, corto: c.iatas.length === 1 && c.corto ? c.corto : CORTOS_VARIOS[iata] ?? a.corto })
  }
  return indice
}

/** Los datos de un aeropuerto por su código IATA, o `null`. */
export async function aeropuertoPorIata(iata: string | null | undefined): Promise<AeropuertoInfo | null> {
  const codigo = (iata ?? '').trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(codigo)) return null
  return construirIndice(await cargarAeropuertos()).get(codigo) ?? null
}

/** Los aeropuertos de una ciudad: la tabla corta si está; si no, los del JSON cuyo municipio es esa ciudad. */
export async function aeropuertosDeCiudad(ciudad: string | null | undefined): Promise<AeropuertoInfo[]> {
  if (!ciudad?.trim()) return []
  const idx = construirIndice(await cargarAeropuertos())
  const c = ciudadCorta(ciudad)
  if (c) return c.iatas.map((i) => idx.get(i)).filter((a): a is AeropuertoInfo => Boolean(a))
  const clave = normalizarCiudad(ciudad)
  return [...idx.values()].filter((a) => normalizarCiudad(a.ciudad) === clave)
}

/** La etiqueta completa, con el JSON para las ciudades que no están en la tabla corta: un solo aeropuerto → «Cuenca (Nombre)»; varios o ninguno → la ciudad. */
export async function etiquetaDeCiudadCompleta(ciudad: string | null | undefined): Promise<string> {
  const limpia = (ciudad ?? '').replace(/\s+/g, ' ').trim()
  if (!limpia) return ''
  if (ciudadCorta(limpia)) return etiquetaDeCiudadConPunto(limpia)
  const lista = await aeropuertosDeCiudad(limpia)
  // Con un solo aeropuerto, entre paréntesis su nombre propio; si el nombre es la propia ciudad («Salzburg Airport»), no se repite.
  return lista.length === 1 && normalizarCiudad(lista[0].corto) !== normalizarCiudad(limpia) ? `${limpia} (${lista[0].corto})` : limpia
}
