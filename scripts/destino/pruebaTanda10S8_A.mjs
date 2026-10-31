// Tanda 10S8 (agente A) · LEER DOCUMENTOS SIN ABUSOS: `POST /api/read-ticket` solo con sesión, con el pase, con límite al día y con tope de tamaño; el código primero; el coste.
//   node scripts/destino/pruebaTanda10S8_A.mjs          (sin navegador; levanta un Express propio en un puerto libre con Supabase y Claude de MENTIRA: no gasta ni una llamada real)
//   API_URL=http://localhost:8787 lo repite, además, contra la API de verdad solo para «sin sesión → error» (sin Claude y sin Supabase de pruebas).
import fs from 'node:fs'
import express from 'express'
import { registrarLeerBillete, MAX_LECTURAS_AL_DIA, TEXTO_GRANDE, TEXTO_LIMITE, TEXTO_SIN_PASE, TEXTO_SIN_SESION, MODELO_LECTURA } from '../../server/billete/lectura.js'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (process.env.DEBUG) console.log(cond ? '  ok' : '  MAL', regla, String(texto).slice(0, 100))
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')

/* ═══════════════ 1. El servidor, con todo de mentira ═══════════════ */
console.log('1. El servidor (Claude y Supabase de mentira)')
const HOY = new Date('2026-11-26T10:00:00Z')
let reloj = HOY
const usuarios = {
  'tok-anonimo': { id: 'u-anon', is_anonymous: true },
  'tok-sin-pase': { id: 'u-sin', is_anonymous: false },
  'tok-pase': { id: 'u-pase', is_anonymous: false },
  'tok-grupo': { id: 'u-grupo', is_anonymous: false },
  'tok-terminado': { id: 'u-fin', is_anonymous: false },
  'tok-anulado': { id: 'u-anulado', is_anonymous: false },
  'tok-otro': { id: 'u-otro', is_anonymous: false },
}
const pasesDe = {
  'u-pase': [{ id: 'p1', estado: 'activo', es_mio: true, viaje: { inicio: '2026-11-26', fin: '2026-11-29' } }],
  'u-grupo': [{ id: 'p2', estado: 'activo', es_mio: false, viaje: { inicio: '2026-11-26', fin: '2026-11-29' } }], // el pase de grupo de un viaje del que es invitado
  'u-fin': [{ id: 'p3', estado: 'activo', es_mio: true, viaje: { inicio: '2026-10-01', fin: '2026-10-05' } }], // ya terminado
  'u-anulado': [{ id: 'p4', estado: 'anulado', es_mio: true, viaje: null }],
  'u-otro': [{ id: 'p5', estado: 'activo', es_mio: true, viaje: null }],
}
const admin = { rpc: async (nombre, args) => (nombre === 'pases_de' ? { data: pasesDe[args.p_uid] ?? [], error: null } : { data: null, error: { message: 'rpc desconocida' } }) }
const quienEs = async (_admin, token) => usuarios[token] ?? null
const tokenDe = (req) => { const c = String(req.headers.authorization ?? ''); return c.startsWith('Bearer ') ? c.slice(7).trim() : null }

const llamadasClaude = []
const costes = []
const anthropic = {
  messages: {
    create: async (peticion) => {
      llamadasClaude.push(peticion)
      return { content: [{ type: 'text', text: '{"modo":"avion","numero":"VY 6102","localizador":"ABC123","fecha":"2026-12-05","hora_salida":"08:30","hora_llegada":"10:25","origen":{"codigo":"BCN"},"destino":{"codigo":"FCO"},"asiento":"14C"}' }], usage: { input_tokens: 2467, output_tokens: 298 } }
    },
  },
}
let cobro = true
const app = express()
// (Igual que index.js: el lector general se salta esta ruta.)
const jsonGeneral = express.json({ limit: '6mb' })
app.use((req, res, next) => (req.originalUrl?.startsWith('/api/read-ticket') ? next() : jsonGeneral(req, res, next)))
const lecturas = new Map()
registrarLeerBillete(app, {
  anthropic, MODEL: 'claude-sonnet-4-6', express, admin, quienEs, tokenDe, cobro: () => cobro, ahora: () => reloj, lecturas,
  logCallCost: (endpoint, respuesta, modelo) => costes.push({ endpoint, modelo, entrada: respuesta.usage.input_tokens }),
  extractJsonText: (t) => t, logAnthropicError: () => {},
})
const servidor = await new Promise((ok) => { const s = app.listen(0, '127.0.0.1', () => ok(s)) })
const base = `http://127.0.0.1:${servidor.address().port}`
const pdfPequeno = { media_type: 'application/pdf', data: Buffer.from('%PDF-1.4 ejemplo').toString('base64') }
const leerConToken = async (token, cuerpo = { file: pdfPequeno, mode: 'avion', year_hint: 2026 }) => {
  const r = await fetch(`${base}/api/read-ticket`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(cuerpo) })
  return { estado: r.status, cuerpo: await r.json().catch(() => null) }
}
const llamadas = () => llamadasClaude.length

// ── Sin sesión → error, sin llamar a Claude ──
let r = await leerConToken(null)
debe(r.estado === 401 && r.cuerpo?.error === TEXTO_SIN_SESION && llamadas() === 0, '1a', `sin sesión → 401 con su texto y Claude NO se llama (${r.estado}, llamadas ${llamadas()})`)
r = await leerConToken('tok-roto')
debe(r.estado === 401 && llamadas() === 0, '1a', `una sesión que no vale → 401, sin Claude (${r.estado})`)
r = await leerConToken('tok-anonimo')
debe(r.estado === 401 && llamadas() === 0, '1a', `una sesión anónima (sin cuenta) tampoco lee → 401, sin Claude (${r.estado})`)
// Un archivo de 15 MB SIN sesión: ni se lee el cuerpo (401 antes que 413).
const quinceMB = { media_type: 'image/jpeg', data: Buffer.alloc(15 * 1024 * 1024, 7).toString('base64') }
r = await leerConToken(null, { file: quinceMB })
debe(r.estado === 401 && llamadas() === 0, '1a', `15 MB sin sesión → 401 (la puerta mira antes de leer el cuerpo) (${r.estado})`)

// ── Con sesión y sin pase → error ──
r = await leerConToken('tok-sin-pase')
debe(r.estado === 403 && r.cuerpo?.error === TEXTO_SIN_PASE && r.cuerpo?.codigo === 'sin_pase' && llamadas() === 0, '1b', `con sesión y sin pase → 403 y Claude NO se llama (${r.estado}, llamadas ${llamadas()})`)
r = await leerConToken('tok-anulado')
debe(r.estado === 403 && llamadas() === 0, '1b', `un pase anulado (pago devuelto) no vale (${r.estado})`)
r = await leerConToken('tok-terminado')
debe(r.estado === 403 && llamadas() === 0, '1b', `un pase de un viaje ya terminado no vale para AÑADIR documentos (${r.estado})`)

// ── Con pase → lee ──
r = await leerConToken('tok-pase')
debe(r.estado === 200 && r.cuerpo?.numero === 'VY 6102' && r.cuerpo?.asiento === '14C' && llamadas() === 1, '1c', `con pase → lee (${r.estado}, llamadas ${llamadas()})`)
debe(llamadasClaude[0]?.model === MODELO_LECTURA && MODELO_LECTURA === 'claude-haiku-4-5', '1c', `la lectura va con ${llamadasClaude[0]?.model}`)
debe(costes.length === 1 && costes[0].endpoint === 'read-ticket' && costes[0].modelo === 'claude-haiku-4-5', '1d', 'cada lectura se registra con su coste y su modelo (logCallCost)')
r = await leerConToken('tok-grupo')
debe(r.estado === 200 && llamadas() === 2, '1c', `el pase de grupo del viaje cubre al invitado (${r.estado})`)
r = await leerConToken('tok-pase', { file: pdfPequeno, tipo: 'entrada' })
debe(r.estado === 200 && costes.at(-1)?.endpoint === 'read-entry-ticket', '1c', 'la entrada también pasa por la misma puerta, y su coste sale con su nombre')
r = await leerConToken('tok-pase', { file: pdfPequeno, tipo: 'alojamiento' })
debe(r.estado === 200 && costes.at(-1)?.endpoint === 'read-lodging-booking', '1c', 'la reserva del hotel también, con su nombre en el coste')

// ── El límite: 10 al día; la 11 → el texto ──
const antes = llamadas()
const consumidas = lecturas.get(`u-pase|2026-11-26`) ?? 0
const resultados = []
for (let i = consumidas; i < MAX_LECTURAS_AL_DIA; i++) resultados.push((await leerConToken('tok-pase')).estado)
debe(resultados.every((e) => e === 200), '1e', `las ${MAX_LECTURAS_AL_DIA} primeras lecturas del día pasan (${resultados.join(',')})`)
r = await leerConToken('tok-pase')
debe(r.estado === 429 && r.cuerpo?.error === TEXTO_LIMITE && TEXTO_LIMITE === 'Has leído muchos documentos hoy. Puedes añadir los datos a mano.' && llamadas() === antes + resultados.length, '1e', `la lectura ${MAX_LECTURAS_AL_DIA + 1} del día → 429 con el texto del límite y sin Claude (${r.estado}: ${r.cuerpo?.error})`)
r = await leerConToken('tok-otro')
debe(r.estado === 200, '1e', 'el límite es por cuenta: otra cuenta sigue leyendo')
reloj = new Date('2026-11-27T08:00:00Z')
r = await leerConToken('tok-pase')
debe(r.estado === 200, '1e', 'al día siguiente el contador empieza de cero')
reloj = HOY

// ── El tamaño ──
const a = llamadas()
r = await leerConToken('tok-otro', { file: quinceMB })
debe(r.estado === 413 && r.cuerpo?.error === TEXTO_GRANDE && TEXTO_GRANDE === 'El archivo es demasiado grande. Prueba con una captura.' && llamadas() === a, '1f', `un archivo de 15 MB → 413 con el texto del tamaño y sin Claude (${r.estado}: ${r.cuerpo?.error})`)
const unos9MB = { media_type: 'image/jpeg', data: Buffer.alloc(9 * 1024 * 1024, 7).toString('base64') }
r = await leerConToken('tok-otro', { file: unos9MB })
debe(r.estado === 200, '1f', `un archivo de 9 MB (dentro del tope de 10) sí se lee (${r.estado})`)
const treintaMB = { media_type: 'image/jpeg', data: Buffer.alloc(30 * 1024 * 1024, 7).toString('base64') }
r = await leerConToken('tok-otro', { file: treintaMB })
debe(r.estado === 413 && r.cuerpo?.error === TEXTO_GRANDE, '1f', `un cuerpo de 40 MB (pasa el tope del lector) → el mismo texto del tamaño (${r.estado})`)
// Lo que no llega a Claude no gasta lectura del día.
const gastadas = () => lecturas.get('u-otro|2026-11-26') ?? 0
const g0 = gastadas()
await leerConToken('tok-otro', { file: quinceMB })
await leerConToken('tok-otro', { file: { media_type: 'text/plain', data: 'x' } })
debe(gastadas() === g0, '1g', 'un archivo rechazado (muy grande o de otro tipo) NO cuenta como lectura del día')

// ── Pase siempre (Eric, 31-oct: antes → con el cobro apagado bastaba la sesión → ahora → el pase se exige SIEMPRE, el cobro no cambia nada) ──
const antesAbierto = llamadas()
r = await leerConToken('tok-sin-pase')
debe(r.estado === 403 && llamadas() === antesAbierto, '1h', 'el pase se exige siempre: sin pase no se llama a Claude (el cobro ya no cuenta)')
r = await leerConToken(null)
debe(r.estado === 401, '1h', 'sin sesión sigue sin leer')

// ── Con la tabla (migración 0073): el contador vive en la base, es atómico y vale entre instancias ──
{
  const tabla = new Map() // `${uid}|${dia}` → n (como la tabla; dos «servidores» comparten esta)
  const rpcTabla = async (nombre, args) => {
    if (nombre === 'registrar_lectura') { const k = `${args.p_uid}|d`; const n = tabla.get(k) ?? 0; if (n >= args.p_limite) return { data: false, error: null }; tabla.set(k, n + 1); return { data: true, error: null } }
    if (nombre === 'devolver_lectura') { const k = `${args.p_uid}|d`; tabla.set(k, Math.max(0, (tabla.get(k) ?? 0) - 1)); return { data: null, error: null } }
    return admin.rpc(nombre, args)
  }
  const monta = async () => {
    const ap = express()
    registrarLeerBillete(ap, { anthropic, MODEL: 'x', express, admin: { rpc: rpcTabla }, quienEs, tokenDe, cobro: () => true, ahora: () => reloj, lecturas: new Map(), logCallCost: () => {}, extractJsonText: (t) => t, logAnthropicError: () => {} })
    const s = await new Promise((ok) => { const x = ap.listen(0, '127.0.0.1', () => ok(x)) })
    return { s, url: `http://127.0.0.1:${s.address().port}/api/read-ticket` }
  }
  const [uno, dos] = [await monta(), await monta()] // dos instancias (como Vercel), memorias distintas
  const pide = (x, token = 'tok-pase', file = pdfPequeno) => fetch(x.url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ file }) }).then((rr) => rr.status)
  const n0 = llamadas()
  const estados = await Promise.all(Array.from({ length: 16 }, (_, i) => pide(i % 2 ? uno : dos)))
  debe(estados.filter((e) => e === 200).length === MAX_LECTURAS_AL_DIA && estados.filter((e) => e === 429).length === 16 - MAX_LECTURAS_AL_DIA && llamadas() === n0 + MAX_LECTURAS_AL_DIA, '1j', `con la tabla, 16 peticiones a la vez desde dos instancias: pasan exactamente ${MAX_LECTURAS_AL_DIA} (${estados.filter((e) => e === 200).length}) y las demás dan el límite`)
  debe((await pide(uno, 'tok-otro')) === 200, '1j', 'otra cuenta no se ve afectada')
  const antesRech = tabla.get('u-otro|d')
  await pide(dos, 'tok-otro', quinceMB)
  debe(tabla.get('u-otro|d') === antesRech, '1j', 'un archivo rechazado devuelve su lectura en la tabla')
  uno.s.close(); dos.s.close()
}
// ── Si la 0073 no está aplicada (la función no existe), el servidor cae al contador en memoria sin romper nada: es lo que ya hacen todos los casos de arriba (el `admin` de mentira no la tiene) ──
debe(/registrar_lectura/.test(leer('server/billete/lectura.js')) && leer('supabase/migrations/0073_lecturas_de_documentos.sql').includes('registrar_lectura') && /migracion_0073/.test(leer('docs/dias/COMPROBAR_0073.sql')), '1k', 'la migración 0073 y su COMPROBAR existen y el servidor llama a registrar_lectura')

// ── Sin la clave de servicio no se puede comprobar nada: NO se lee (cierra, no abre) ──
{
  const app2 = express()
  registrarLeerBillete(app2, { anthropic, MODEL: 'x', express, admin: null, quienEs, tokenDe, logCallCost: () => {}, extractJsonText: (t) => t, logAnthropicError: () => {} })
  const s2 = await new Promise((ok) => { const s = app2.listen(0, '127.0.0.1', () => ok(s)) })
  const n = llamadas()
  const r2 = await fetch(`http://127.0.0.1:${s2.address().port}/api/read-ticket`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok-pase' }, body: JSON.stringify({ file: pdfPequeno }) })
  debe(r2.status === 503 && llamadas() === n, '1i', `sin clave de servicio: 503 y sin Claude (${r2.status})`)
  s2.close()
}
servidor.close()

/* ═══════════════ 2. El código (index.js y el cliente) ═══════════════ */
console.log('2. El código')
const indexJs = leer('server/index.js')
const lecturaJs = leer('server/billete/lectura.js')
const cliente = leer('src/lib/billeteLeer.ts')
const posRegistro = indexJs.indexOf('registrarLeerBillete(app, {')
const posAdmin = indexJs.indexOf('const salesAdmin =')
debe(posRegistro > posAdmin && posAdmin > 0, '2a', 'index.js registra la lectura DESPUÉS de crear `salesAdmin` (si no, no existiría al pasarlo)')
debe(/registrarLeerBillete\(app, \{[^\n]*admin: salesAdmin[^\n]*quienEs: quienEsCuenta[^\n]*tokenDe: tokenDeCuenta \}\)/.test(indexJs) && !/registrarLeerBillete\(app, \{[^\n]*cobro/.test(indexJs), '2a', 'index.js le pasa la clave de servicio, quién es y el token (sin depender del cobro)')
debe(/startsWith\('\/api\/read-ticket'\)\s*\?\s*next\(\)/.test(indexJs), '2b', 'el lector general de 6 MB se salta /api/read-ticket (el suyo va tras la puerta)')
debe(/function logCallCost\(endpoint, response, modelo = MODEL\)/.test(indexJs) && /'claude-haiku-4-5': \{ input: 1, output: 5/.test(indexJs), '2c', 'logCallCost sabe el precio de Haiku ($1 / $5) y escribe el modelo cuando no es el de siempre')
debe(!/model: MODEL, max_tokens: 700/.test(lecturaJs) && /model: modeloLectura/.test(lecturaJs), '2c', 'la lectura usa su propio modelo (Haiku), no el MODEL general')
// El cliente
debe(/Authorization: `Bearer \$\{sesion\.access_token\}`/.test(cliente) && /supabase\?\.auth\.getSession\(\)/.test(cliente), '2d', 'el cliente manda la sesión al servidor')
debe(/archivo\.size > MAX_ARCHIVO_LECTURA_BYTES/.test(cliente) && cliente.includes("'El archivo es demasiado grande. Prueba con una captura.'") && cliente.includes("'Has leído muchos documentos hoy. Puedes añadir los datos a mano.'"), '2d', 'el cliente tiene los textos del tamaño y del límite y mira el tamaño antes de enviar')
debe(/\[401, 403, 413, 429\]\.includes\(r\.status\)/.test(cliente), '2d', 'el cliente enseña el texto de 401, 403, 413 y 429')
const iBuscar = cliente.indexOf('const hallazgos = await buscarCodigos(paginas)')
const iServidor = cliente.indexOf("leerEnServidor<LecturaServidor>(archivo, paginas, opciones)")
debe(iBuscar > 0 && iServidor > iBuscar && /bastaElCodigo = Boolean\(bcbp && bcbp\.localizador && bcbp\.asiento && bcbp\.diaJuliano\)/.test(cliente) && /if \(!bastaElCodigo\)/.test(cliente), '2e', 'billeteLeer busca el código PRIMERO y no llama al servidor si trae vuelo, día, asiento y localizador')
debe(!/Promise\.all\(\[\s*buscarCodigos/.test(cliente), '2e', 'ya no se lanzan el código y el servidor a la vez (cada lectura que se ahorra es dinero)')

/* ═══════════════ 3. La API de verdad (si está encendida) ═══════════════ */
const API = process.env.API_URL
if (API) {
  console.log('3. La API de verdad (solo sin sesión: no gasta nada)')
  try {
    const rr = await fetch(`${API}/api/read-ticket`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file: pdfPequeno }) })
    const cuerpo = await rr.json().catch(() => null)
    debe(rr.status === 401 && cuerpo?.error === TEXTO_SIN_SESION, '3a', `la API de verdad, sin sesión → 401 con su texto (${rr.status}: ${cuerpo?.error})`)
    const rg = await fetch(`${API}/api/read-ticket`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file: quinceMB }) })
    debe(rg.status === 401, '3a', `la API de verdad, 15 MB sin sesión → 401 (${rg.status})`)
  } catch (e) {
    debe(false, '3a', `la API de verdad no contesta (${e.message})`)
  }
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO ${f.regla}: ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
