/**
 * LEER UN BILLETE (10S5, M). PDF, foto o captura de una tarjeta de embarque o de un billete de tren, autobús o barco → los datos que se encuentren y el código
 * (QR, Aztec o PDF417) para volver a dibujarlo. Todo lo que no se sepa, `null`: la app nunca inventa.
 *
 * CÓMO LEE (tres fuentes que se juntan; la app funciona con cualquiera de ellas):
 *  1. EL PROPIO CÓDIGO. Se busca el código en el archivo (PDF → se dibujan sus páginas con pdf.js; foto o captura → tal cual) con `BarcodeDetector` del navegador si lo hay y, si no, con
 *     zxing-wasm. Las tarjetas de embarque llevan el código en formato IATA BCBP («M1…»): ahí vienen el nº de vuelo, la compañía, el localizador, los dos aeropuertos y el asiento SIN servidor.
 *  2. EL SERVIDOR (`POST /api/read-ticket`, server/billete/lectura.js: Claude lee el texto y la imagen; la clave nunca sale del servidor; no guarda nada ni registra el contenido). Pone el resto:
 *     horas, terminal, puerta, coche, ciudades, y la caja donde está el código si no se pudo leer.
 *  3. LOS AEROPUERTOS (`aeropuertosCiudad.ts`) completan la ciudad y la zona horaria de cada código IATA, y con eso `duracionDelTrayecto` calcula la duración.
 * Las bibliotecas (pdf.js, zxing-wasm) se cargan SOLO al leer un billete (import dinámico): no pesan en la descarga de la app.
 *
 * ESTE ARCHIVO ES EL CONTRATO PARA LA UI (L): `leerBillete(archivo)` y los tipos de abajo.
 */
import { aeropuertoPorIata } from './aeropuertosCiudad'
import { duracionDelTrayecto } from './duracionViaje'

export type ModoBillete = 'avion' | 'tren' | 'bus' | 'ferry'

/** Un lado del trayecto (salida o llegada). */
export interface PuntoBillete {
  /** «Barcelona», «Roma». */
  ciudad: string | null
  /** El código del aeropuerto (IATA: «BCN», «FCO») o de la estación si lo trae. */
  codigo: string | null
  /** El nombre tal cual del billete: «Barcelona-El Prat», «Roma Termini». */
  nombre: string | null
  terminal: string | null
  /** Puerta de embarque (solo avión). */
  puerta: string | null
}

/**
 * El código que escanean. `texto` (lo decodificado) permite volver a dibujarlo; `dibujo` es ese redibujo ya hecho (data URL de un SVG: nítido a cualquier tamaño y se ve SIN CONEXIÓN, no hace falta
 * ninguna biblioteca para enseñarlo); `imagen` es el recorte de la foto o del PDF (data URL png, ≤ ~90 KB) por si no se pudo leer. Para pintarlo: `dibujo ?? imagen`.
 */
export interface CodigoBillete {
  formato: 'qr' | 'aztec' | 'pdf417' | 'otro'
  /** Lo que dice el código, decodificado. Es privado: nunca va a un registro ni a otro sitio que el propio guardado del viajero. */
  texto: string | null
  /** El código vuelto a dibujar grande y nítido (data URL `image/svg+xml`), solo si se pudo leer. */
  dibujo: string | null
  /** El recorte del código tal como estaba en el billete (data URL png). */
  imagen: string | null
}

/**
 * (No se llama `DatosBillete` porque ya existe uno en `billete.ts`, el de la tarjeta de DÍAS.) Lo que sale de leer un billete.
 */
export interface DatosBilleteLeido {
  modo: ModoBillete | null
  /** «VY 6102» (avión, con la compañía y un espacio) o «03180» (tren). Solo el número, sin la palabra «Vuelo» ni «Tren». */
  numero: string | null
  /** «Vueling», «Trenitalia». */
  compania: string | null
  localizador: string | null
  /** Día de salida, `YYYY-MM-DD`. */
  fecha: string | null
  /** Día de llegada si no es el mismo (vuelos de noche), `YYYY-MM-DD`. */
  fechaLlegada: string | null
  /** Horas locales de cada lado, `HH:MM` 24 h. */
  horaSalida: string | null
  horaLlegada: string | null
  origen: PuntoBillete
  destino: PuntoBillete
  /** «14C» (avión y tren). */
  asiento: string | null
  /** Solo tren: «003». */
  coche: string | null
  /** Minutos del trayecto, calculados con `duracionDelTrayecto` (hora de cada país). `null` si no se sabe. */
  duracionMin: number | null
  codigo: CodigoBillete | null
  /** De dónde han salido los datos: `codigo` (el propio código BCBP), `servidor` (lectura con IA). */
  fuentes: Array<'codigo' | 'servidor'>
}

export function billeteVacio(): DatosBilleteLeido {
  const punto = (): PuntoBillete => ({ ciudad: null, codigo: null, nombre: null, terminal: null, puerta: null })
  return {
    modo: null, numero: null, compania: null, localizador: null, fecha: null, fechaLlegada: null, horaSalida: null, horaLlegada: null,
    origen: punto(), destino: punto(), asiento: null, coche: null, duracionMin: null, codigo: null, fuentes: [],
  }
}

export interface OpcionesLeerBillete {
  /** Para los billetes sin año. */
  anioPorDefecto?: number
  /** Si ya se sabe (la ida de avión), ayuda a leer. */
  modo?: ModoBillete
  /** Cuánto esperar al servidor antes de rendirse y devolver solo lo del código (por defecto 40 s). */
  esperaServidorMs?: number
}

// ── 1. El código BCBP de las tarjetas de embarque (IATA Resolution 792) ──────────────────────────────────────────────────────────────────
const COMPANIAS: Record<string, string> = {
  VY: 'Vueling', IB: 'Iberia', I2: 'Iberia Express', UX: 'Air Europa', FR: 'Ryanair', U2: 'easyJet', BA: 'British Airways', AF: 'Air France', KL: 'KLM', LH: 'Lufthansa', AZ: 'ITA Airways',
  TP: 'TAP Air Portugal', W6: 'Wizz Air', LX: 'Swiss', OS: 'Austrian', SN: 'Brussels Airlines', TK: 'Turkish Airlines', EK: 'Emirates', QR: 'Qatar Airways', DL: 'Delta', UA: 'United',
  AA: 'American Airlines', V7: 'Volotea', EW: 'Eurowings', DY: 'Norwegian', SK: 'SAS', AY: 'Finnair', LO: 'LOT', EI: 'Aer Lingus', TO: 'Transavia', HV: 'Transavia', AV: 'Avianca', LA: 'LATAM',
  AR: 'Aerolíneas Argentinas', AM: 'Aeroméxico', IT: 'Tigerair', KM: 'Air Malta', A3: 'Aegean', JU: 'Air Serbia', RO: 'Tarom', OU: 'Croatia Airlines', FI: 'Icelandair', BT: 'airBaltic',
}

/** Lo que dice un código BCBP, sin el nombre del pasajero (no se usa para nada). */
export interface LecturaBCBP {
  localizador: string | null
  origen: string
  destino: string
  /** «VY» */
  companiaCodigo: string
  /** «6102» */
  vuelo: string
  /** Día del año (1-366) de la salida. */
  diaJuliano: number | null
  /** «14C» */
  asiento: string | null
}

/** Lee el primer tramo de un BCBP («M1PRUEBA/ANA EABC123 BCNFCOVY 6102 303Y014C0045 100»). `null` si no lo es. */
export function leerBCBP(texto: string | null | undefined): LecturaBCBP | null {
  const t = (texto ?? '').replace(/\r?\n/g, '')
  if (t.length < 58 || t[0] !== 'M' || !/^[1-9]$/.test(t[1])) return null
  const origen = t.slice(30, 33), destino = t.slice(33, 36)
  const compania = t.slice(36, 39).trim(), vuelo = t.slice(39, 44).trim().replace(/^0+(?=\d)/, '')
  if (!/^[A-Z]{3}$/.test(origen) || !/^[A-Z]{3}$/.test(destino) || !/^[A-Z0-9]{2}$/.test(compania) || !/^\d{1,4}[A-Z]?$/.test(vuelo)) return null
  const juliano = Number(t.slice(44, 47))
  const asientoCrudo = t.slice(48, 52).trim()
  const asiento = /^\d{1,3}[A-Z]$/.test(asientoCrudo) ? asientoCrudo.replace(/^0+/, '') : null
  const pnr = t.slice(23, 30).trim()
  return {
    localizador: /^[A-Z0-9]{5,7}$/.test(pnr) ? pnr : null,
    origen, destino, companiaCodigo: compania, vuelo,
    diaJuliano: juliano >= 1 && juliano <= 366 ? juliano : null,
    asiento,
  }
}

/** Día del año → `YYYY-MM-DD`. Sin año se elige el más cercano a hoy (desde hace 60 días hacia delante): una tarjeta de embarque es de un vuelo próximo. */
export function fechaDeDiaJuliano(dia: number, anio?: number): string {
  const ref = new Date()
  const calcula = (y: number) => new Date(Date.UTC(y, 0, dia)).toISOString().slice(0, 10)
  if (anio) return calcula(anio)
  const y = ref.getUTCFullYear()
  const limite = Date.UTC(y, ref.getUTCMonth(), ref.getUTCDate()) - 60 * 86400_000
  const candidato = calcula(y)
  return Date.parse(candidato) < limite ? calcula(y + 1) : candidato
}

// ── 2. Imágenes y código ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const MAX_LADO = 2000
const MAX_PAGINAS = 4

function lienzo(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w))
  c.height = Math.max(1, Math.round(h))
  return c
}

async function paginasDe(archivo: File): Promise<HTMLCanvasElement[]> {
  if (archivo.type === 'application/pdf' || /\.pdf$/i.test(archivo.name)) {
    const [pdfjs, worker] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')])
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default
    const tarea = pdfjs.getDocument({ data: new Uint8Array(await archivo.arrayBuffer()) })
    const doc = await tarea.promise
    const salida: HTMLCanvasElement[] = []
    try {
      for (let n = 1; n <= Math.min(doc.numPages, MAX_PAGINAS); n++) {
        const pagina = await doc.getPage(n)
        const base = pagina.getViewport({ scale: 1 })
        const escala = Math.min(3, MAX_LADO / Math.max(base.width, base.height))
        const vista = pagina.getViewport({ scale: Math.max(1.5, escala) })
        const c = lienzo(vista.width, vista.height)
        const ctx = c.getContext('2d')
        if (!ctx) continue
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, c.width, c.height)
        await pagina.render({ canvasContext: ctx, viewport: vista, canvas: c }).promise
        salida.push(c)
      }
    } finally {
      void tarea.destroy()
    }
    return salida
  }
  const bitmap = await createImageBitmap(archivo)
  const e = Math.min(1, MAX_LADO / Math.max(bitmap.width, bitmap.height))
  const c = lienzo(bitmap.width * e, bitmap.height * e)
  const ctx = c.getContext('2d')
  if (!ctx) return []
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(bitmap, 0, 0, c.width, c.height)
  bitmap.close?.()
  return [c]
}

interface Hallazgo {
  texto: string
  formato: CodigoBillete['formato']
  pagina: number
  /** Rectángulo en fracciones 0..1 de la página. */
  caja: { x0: number; y0: number; x1: number; y1: number }
}

const FORMATO_ZXING: Record<string, CodigoBillete['formato']> = { QRCode: 'qr', MicroQRCode: 'qr', RMQRCode: 'qr', Aztec: 'aztec', PDF417: 'pdf417' }
const FORMATO_DETECTOR: Record<string, CodigoBillete['formato']> = { qr_code: 'qr', aztec: 'aztec', pdf417: 'pdf417' }

async function buscarCodigos(paginas: HTMLCanvasElement[]): Promise<Hallazgo[]> {
  const hallados: Hallazgo[] = []
  const BD = (globalThis as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (i: CanvasImageSource) => Promise<Array<{ rawValue: string; format: string; boundingBox: DOMRectReadOnly }>> } }).BarcodeDetector
  let detector: InstanceType<NonNullable<typeof BD>> | null = null
  if (BD) {
    try {
      detector = new BD({ formats: ['qr_code', 'aztec', 'pdf417'] })
    } catch {
      detector = null
    }
  }
  let zx: Awaited<ReturnType<typeof cargarLector>> | null = null
  for (let i = 0; i < paginas.length; i++) {
    const c = paginas[i]
    let encontrados = false
    if (detector) {
      try {
        for (const r of await detector.detect(c)) {
          if (!r.rawValue) continue
          hallados.push({ texto: r.rawValue, formato: FORMATO_DETECTOR[r.format] ?? 'otro', pagina: i + 1, caja: { x0: r.boundingBox.x / c.width, y0: r.boundingBox.y / c.height, x1: (r.boundingBox.x + r.boundingBox.width) / c.width, y1: (r.boundingBox.y + r.boundingBox.height) / c.height } })
          encontrados = true
        }
      } catch {
        /* sin detector: zxing */
      }
    }
    if (encontrados) continue
    try {
      zx ??= await cargarLector()
      const ctx = c.getContext('2d')
      if (!ctx) continue
      const datos = ctx.getImageData(0, 0, c.width, c.height)
      const lista = await zx.readBarcodes(datos, { formats: ['QRCode', 'Aztec', 'PDF417'], tryHarder: true, tryRotate: true, tryInvert: true, maxNumberOfSymbols: 4 })
      for (const r of lista) {
        if (!r.isValid || !r.text) continue
        const xs = [r.position.topLeft.x, r.position.topRight.x, r.position.bottomLeft.x, r.position.bottomRight.x]
        const ys = [r.position.topLeft.y, r.position.topRight.y, r.position.bottomLeft.y, r.position.bottomRight.y]
        hallados.push({ texto: r.text, formato: FORMATO_ZXING[r.format] ?? 'otro', pagina: i + 1, caja: { x0: Math.min(...xs) / c.width, y0: Math.min(...ys) / c.height, x1: Math.max(...xs) / c.width, y1: Math.max(...ys) / c.height } })
      }
    } catch {
      /* no se pudo leer en esta página */
    }
  }
  return hallados
}

async function cargarLector() {
  const [lector, wasm] = await Promise.all([import('zxing-wasm/reader'), import('zxing-wasm/reader/zxing_reader.wasm?url')])
  lector.prepareZXingModule({ overrides: { locateFile: (ruta: string, prefijo: string) => (ruta.endsWith('.wasm') ? wasm.default : prefijo + ruta) } })
  return lector
}

/** Recorte del código con margen, hasta ~420 px de lado, en png. */
function recortar(c: HTMLCanvasElement, caja: { x0: number; y0: number; x1: number; y1: number }): string | null {
  const w = (caja.x1 - caja.x0) * c.width, h = (caja.y1 - caja.y0) * c.height
  const margen = Math.max(w, h) * 0.12 + 6
  const x = Math.max(0, caja.x0 * c.width - margen), y = Math.max(0, caja.y0 * c.height - margen)
  const ancho = Math.min(c.width - x, w + margen * 2), alto = Math.min(c.height - y, h + margen * 2)
  if (ancho < 20 || alto < 20) return null
  const e = Math.min(1, 520 / Math.max(ancho, alto))
  const sal = lienzo(ancho * e, alto * e)
  const ctx = sal.getContext('2d')
  if (!ctx) return null
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(c, x, y, ancho, alto, 0, 0, sal.width, sal.height)
  return sal.toDataURL('image/png')
}

async function aSvgDataUrl(texto: string, formato: CodigoBillete['formato']): Promise<string | null> {
  const nombre = formato === 'qr' ? 'QRCode' : formato === 'aztec' ? 'Aztec' : formato === 'pdf417' ? 'PDF417' : null
  if (!nombre) return null
  try {
    const [escritor, wasm] = await Promise.all([import('zxing-wasm/writer'), import('zxing-wasm/writer/zxing_writer.wasm?url')])
    escritor.prepareZXingModule({ overrides: { locateFile: (ruta: string, prefijo: string) => (ruta.endsWith('.wasm') ? wasm.default : prefijo + ruta) } })
    const r = await escritor.writeBarcode(texto, { format: nombre, withQuietZones: true, ...(formato === 'qr' ? { ecLevel: 'M' } : {}) })
    if (r.error || !r.svg) return null
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(r.svg)))}`
  } catch {
    return null
  }
}

// ── 3. El servidor ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
interface LecturaServidor {
  modo: ModoBillete | null
  numero: string | null
  compania: string | null
  localizador: string | null
  fecha: string | null
  fecha_llegada: string | null
  hora_salida: string | null
  hora_llegada: string | null
  origen: PuntoBillete
  destino: PuntoBillete
  asiento: string | null
  coche: string | null
  codigo_caja: { pagina: number; x0: number; y0: number; x1: number; y1: number } | null
}

function aBase64(bytes: ArrayBuffer): string {
  const u8 = new Uint8Array(bytes)
  let s = ''
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000))
  return btoa(s)
}

/** Lo que se manda al servidor: el PDF tal cual (si no pasa de ~4,5 MB; si no, su primera página) o la imagen reducida a 1600 px en jpeg. */
async function paraElServidor(archivo: File, paginas: HTMLCanvasElement[]): Promise<{ media_type: string; data: string } | null> {
  const esPdf = archivo.type === 'application/pdf' || /\.pdf$/i.test(archivo.name)
  if (esPdf && archivo.size <= 4_500_000) return { media_type: 'application/pdf', data: aBase64(await archivo.arrayBuffer()) }
  const c = paginas[0]
  if (!c) return null
  const e = Math.min(1, 1600 / Math.max(c.width, c.height))
  const sal = lienzo(c.width * e, c.height * e)
  const ctx = sal.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(c, 0, 0, sal.width, sal.height)
  return { media_type: 'image/jpeg', data: sal.toDataURL('image/jpeg', 0.85).split(',')[1] }
}

async function leerEnServidor(archivo: File, paginas: HTMLCanvasElement[], opciones: OpcionesLeerBillete, tipo?: 'entrada' | 'alojamiento'): Promise<LecturaServidor | null> {
  const adjunto = await paraElServidor(archivo, paginas)
  if (!adjunto) return null
  const control = new AbortController()
  const reloj = setTimeout(() => control.abort(), opciones.esperaServidorMs ?? 40_000)
  try {
    const r = await fetch('/api/read-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: control.signal,
      body: JSON.stringify({ file: adjunto, mode: opciones.modo, year_hint: opciones.anioPorDefecto, ...(tipo ? { tipo } : {}) }),
    })
    return r.ok ? ((await r.json()) as LecturaServidor) : null
  } catch {
    return null
  } finally {
    clearTimeout(reloj)
  }
}

// ── La función de todos ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** PDF, foto o captura → datos. Nunca lanza: si no se puede leer nada, devuelve `billeteVacio()` (y `fuentes` vacío). */
export async function leerBillete(archivo: File, opciones: OpcionesLeerBillete = {}): Promise<DatosBilleteLeido> {
  const datos = billeteVacio()
  try {
    let paginas: HTMLCanvasElement[] = []
    try {
      paginas = await paginasDe(archivo)
    } catch {
      paginas = []
    }
    // El servidor y la búsqueda del código, a la vez.
    const [hallazgos, servidor] = await Promise.all([
      buscarCodigos(paginas).catch(() => [] as Hallazgo[]),
      leerEnServidor(archivo, paginas, opciones).catch(() => null),
    ])

    // El código que cuenta: el BCBP si lo hay; si no, el más grande.
    const area = (h: Hallazgo) => (h.caja.x1 - h.caja.x0) * (h.caja.y1 - h.caja.y0)
    const elegido = [...hallazgos].sort((a, b) => Number(Boolean(leerBCBP(b.texto))) - Number(Boolean(leerBCBP(a.texto))) || area(b) - area(a))[0] ?? null
    const bcbp = elegido ? leerBCBP(elegido.texto) : null

    if (servidor) {
      datos.fuentes.push('servidor')
      datos.modo = servidor.modo
      datos.numero = servidor.numero
      datos.compania = servidor.compania
      datos.localizador = servidor.localizador
      datos.fecha = servidor.fecha
      datos.fechaLlegada = servidor.fecha_llegada
      datos.horaSalida = servidor.hora_salida
      datos.horaLlegada = servidor.hora_llegada
      datos.origen = { ...servidor.origen }
      datos.destino = { ...servidor.destino }
      datos.asiento = servidor.asiento
      datos.coche = servidor.coche
    }
    if (bcbp) {
      // Lo que dice el propio código manda sobre la lectura con IA: es exacto.
      datos.fuentes.push('codigo')
      datos.modo = 'avion'
      datos.numero = `${bcbp.companiaCodigo} ${bcbp.vuelo}`
      datos.compania = COMPANIAS[bcbp.companiaCodigo] ?? datos.compania
      datos.localizador = bcbp.localizador ?? datos.localizador
      datos.origen.codigo = bcbp.origen
      datos.destino.codigo = bcbp.destino
      datos.asiento = bcbp.asiento ?? datos.asiento
      if (!datos.fecha && bcbp.diaJuliano) datos.fecha = fechaDeDiaJuliano(bcbp.diaJuliano, opciones.anioPorDefecto)
    }
    if (opciones.modo && !datos.modo) datos.modo = opciones.modo

    // Los aeropuertos: la ciudad y la zona horaria de cada código.
    let zonaSalida: string | null = null, zonaLlegada: string | null = null
    if (datos.origen.codigo || datos.destino.codigo) {
      const [o, d] = await Promise.all([aeropuertoPorIata(datos.origen.codigo).catch(() => null), aeropuertoPorIata(datos.destino.codigo).catch(() => null)])
      if (o) { zonaSalida = o.zona; datos.origen.ciudad ??= o.ciudad; datos.origen.nombre ??= o.nombre }
      if (d) { zonaLlegada = d.zona; datos.destino.ciudad ??= d.ciudad; datos.destino.nombre ??= d.nombre }
    }
    datos.duracionMin = duracionDelTrayecto({
      fecha: datos.fecha, fechaLlegada: datos.fechaLlegada, horaSalida: datos.horaSalida, horaLlegada: datos.horaLlegada,
      zonaSalida, zonaLlegada, mismaZonaSiFalta: datos.modo !== 'avion' && datos.modo != null,
    })

    // El código, redibujado y recortado.
    let recorte: string | null = null
    let caja = elegido ? { pagina: elegido.pagina, ...elegido.caja } : null
    if (!caja && servidor?.codigo_caja) caja = servidor.codigo_caja
    if (caja && paginas[caja.pagina - 1]) recorte = recortar(paginas[caja.pagina - 1], caja)
    if (elegido || recorte) {
      datos.codigo = {
        formato: elegido?.formato ?? 'otro',
        texto: elegido?.texto ?? null,
        dibujo: elegido ? await aSvgDataUrl(elegido.texto, elegido.formato) : null,
        imagen: recorte,
      }
    }
  } catch {
    /* nunca lanza */
  }
  return datos
}

// ── Las entradas (10S7 §3) ──────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Lo que sale de leer una entrada (Coliseo, Museos, Free Tour…): el día, la hora, cuántas personas, el localizador y el código. Lo que no se sepa, `null`. */
export interface DatosEntradaLeida {
  /** `YYYY-MM-DD`. */
  fecha: string | null
  /** `HH:MM` 24 h. */
  hora: string | null
  personas: number | null
  localizador: string | null
  codigo: CodigoBillete | null
  fuentes: Array<'codigo' | 'servidor'>
}

export function entradaVacia(): DatosEntradaLeida {
  return { fecha: null, hora: null, personas: null, localizador: null, codigo: null, fuentes: [] }
}

interface LecturaServidorEntrada {
  fecha: string | null
  hora: string | null
  personas: number | null
  localizador: string | null
  codigo_caja: { pagina: number; x0: number; y0: number; x1: number; y1: number } | null
}

/** PDF, foto o captura de una entrada → datos y código. Igual que `leerBillete`: nunca lanza; si no se puede leer nada, devuelve `entradaVacia()`. */
export async function leerEntrada(archivo: File, opciones: OpcionesLeerBillete = {}): Promise<DatosEntradaLeida> {
  const datos = entradaVacia()
  try {
    let paginas: HTMLCanvasElement[] = []
    try {
      paginas = await paginasDe(archivo)
    } catch {
      paginas = []
    }
    const [hallazgos, servidor] = await Promise.all([
      buscarCodigos(paginas).catch(() => [] as Hallazgo[]),
      leerEnServidor(archivo, paginas, opciones, 'entrada').catch(() => null) as Promise<LecturaServidorEntrada | null>,
    ])
    const area = (h: Hallazgo) => (h.caja.x1 - h.caja.x0) * (h.caja.y1 - h.caja.y0)
    const elegido = [...hallazgos].sort((a, b) => area(b) - area(a))[0] ?? null
    if (servidor) {
      datos.fuentes.push('servidor')
      datos.fecha = servidor.fecha ?? null
      datos.hora = servidor.hora ?? null
      datos.personas = Number.isInteger(servidor.personas) && (servidor.personas as number) > 0 ? servidor.personas : null
      datos.localizador = servidor.localizador ?? null
    }
    if (elegido) datos.fuentes.push('codigo')
    let recorte: string | null = null
    let caja = elegido ? { pagina: elegido.pagina, ...elegido.caja } : null
    if (!caja && servidor?.codigo_caja) caja = servidor.codigo_caja
    if (caja && paginas[caja.pagina - 1]) recorte = recortar(paginas[caja.pagina - 1], caja)
    if (elegido || recorte) {
      datos.codigo = {
        formato: elegido?.formato ?? 'otro',
        texto: elegido?.texto ?? null,
        dibujo: elegido ? await aSvgDataUrl(elegido.texto, elegido.formato) : null,
        imagen: recorte,
      }
    }
  } catch {
    /* nunca lanza */
  }
  return datos
}

// ── El alojamiento (10S7 §5, agente T) ────────────────────────────────────────────────────────

/** Lo que sale de leer la reserva de un alojamiento. Sin código (los hoteles no lo usan). Lo que no se sepa, `null`. */
export interface DatosReservaLeida {
  nombre: string | null
  direccion: string | null
  /** `YYYY-MM-DD`. */
  entrada: string | null
  salida: string | null
  noches: number | null
  /** `HH:MM`. */
  horaEntrada: string | null
  horaSalida: string | null
  telefono: string | null
  localizador: string | null
  /** `false` si no se pudo leer nada (sin servidor, archivo ilegible…): la hoja sale vacía para escribirla a mano. */
  leida: boolean
}

/** PDF, foto o captura de la reserva de un hotel → datos. Nunca lanza: si no se puede leer, devuelve todo `null` y `leida: false`. */
export async function leerReservaAlojamiento(archivo: File, opciones: OpcionesLeerBillete = {}): Promise<DatosReservaLeida> {
  const vacio: DatosReservaLeida = { nombre: null, direccion: null, entrada: null, salida: null, noches: null, horaEntrada: null, horaSalida: null, telefono: null, localizador: null, leida: false }
  try {
    let paginas: HTMLCanvasElement[] = []
    try {
      paginas = await paginasDe(archivo)
    } catch {
      paginas = []
    }
    const s = (await leerEnServidor(archivo, paginas, opciones, 'alojamiento').catch(() => null)) as unknown as {
      nombre: string | null; direccion: string | null; entrada: string | null; salida: string | null; noches: number | null
      hora_entrada: string | null; hora_salida: string | null; telefono: string | null; localizador: string | null
    } | null
    if (!s) return vacio
    return {
      nombre: s.nombre ?? null, direccion: s.direccion ?? null, entrada: s.entrada ?? null, salida: s.salida ?? null, noches: s.noches ?? null,
      horaEntrada: s.hora_entrada ?? null, horaSalida: s.hora_salida ?? null, telefono: s.telefono ?? null, localizador: s.localizador ?? null,
      leida: Object.values(s).some((v) => v != null),
    }
  } catch {
    return vacio
  }
}
