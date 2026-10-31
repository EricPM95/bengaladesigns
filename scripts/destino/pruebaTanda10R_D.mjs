// Tanda 10R (agente D) · LEER EL BILLETE DE UNA EXCURSIÓN (`POST /api/read-ticket` con tipo «excursion») y «Tu excursión» en HOY.
//   node scripts/destino/pruebaTanda10R_D.mjs      (sin navegador; Express propio con Supabase y Claude de MENTIRA: no gasta ni una llamada real)
import fs from 'node:fs'
import express from 'express'
import { registrarLeerBillete, limpiarLecturaExcursion, LEER_EXCURSION_SISTEMA, MAX_LECTURAS_AL_DIA, TEXTO_SIN_PASE, TEXTO_SIN_SESION, TEXTO_LIMITE, TEXTO_GRANDE, MODELO_LECTURA } from '../../server/billete/lectura.js'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (process.env.DEBUG) console.log(cond ? '  ok' : '  MAL', regla, String(texto).slice(0, 110))
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')

/* ═══════════════ 1. El servidor ═══════════════ */
console.log('1. El servidor (Claude y Supabase de mentira)')
const HOY = new Date('2026-11-26T10:00:00Z')
const usuarios = { 'tok-anonimo': { id: 'u-anon', is_anonymous: true }, 'tok-sin-pase': { id: 'u-sin', is_anonymous: false }, 'tok-pase': { id: 'u-pase', is_anonymous: false } }
const pasesDe = { 'u-pase': [{ id: 'p1', estado: 'activo', es_mio: true, viaje: { inicio: '2026-11-26', fin: '2026-11-29' } }] }
const admin = { rpc: async (nombre, args) => (nombre === 'pases_de' ? { data: pasesDe[args.p_uid] ?? [], error: null } : { data: null, error: { message: 'rpc desconocida' } }) }
const quienEs = async (_a, token) => usuarios[token] ?? null
const tokenDe = (req) => { const c = String(req.headers.authorization ?? ''); return c.startsWith('Bearer ') ? c.slice(7).trim() : null }
const llamadasClaude = []
const costes = []
const RESPUESTA = '{"nombre":"Excursión a Pompeya y Sorrento","localizador":"CIV-48213","fecha":"2026-11-28","hora":"07:30","punto_encuentro":"Piazza della Repubblica, Roma","personas":2,"nombre_pasajero":"Ana Prueba","telefono":"+34600000000","codigo_caja":{"pagina":1,"x0":0.6,"y0":0.1,"x1":0.9,"y1":0.3}}'
const anthropic = { messages: { create: async (p) => { llamadasClaude.push(p); return { content: [{ type: 'text', text: RESPUESTA }], usage: { input_tokens: 2000, output_tokens: 150 } } } } }
const app = express()
const jsonGeneral = express.json({ limit: '6mb' })
app.use((req, res, next) => (req.originalUrl?.startsWith('/api/read-ticket') ? next() : jsonGeneral(req, res, next)))
registrarLeerBillete(app, {
  anthropic, MODEL: 'claude-sonnet-4-6', express, admin, quienEs, tokenDe, ahora: () => HOY, lecturas: new Map(),
  logCallCost: (endpoint, respuesta, modelo) => costes.push({ endpoint, modelo }), extractJsonText: (t) => t, logAnthropicError: () => {},
})
const servidor = await new Promise((ok) => { const s = app.listen(0, '127.0.0.1', () => ok(s)) })
const base = `http://127.0.0.1:${servidor.address().port}`
const pdf = { media_type: 'application/pdf', data: Buffer.from('%PDF-1.4 ejemplo').toString('base64') }
const pedir = async (token, cuerpo = { file: pdf, tipo: 'excursion', year_hint: 2026 }) => {
  const r = await fetch(`${base}/api/read-ticket`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(cuerpo) })
  return { estado: r.status, cuerpo: await r.json().catch(() => null) }
}

let r = await pedir(null)
debe(r.estado === 401 && r.cuerpo?.error === TEXTO_SIN_SESION && llamadasClaude.length === 0, '1a', `excursión sin sesión → 401 y Claude NO se llama (${r.estado})`)
r = await pedir('tok-anonimo')
debe(r.estado === 401 && llamadasClaude.length === 0, '1a', `sesión anónima → 401 (${r.estado})`)
r = await pedir('tok-sin-pase')
debe(r.estado === 403 && r.cuerpo?.error === TEXTO_SIN_PASE && llamadasClaude.length === 0, '1b', `excursión con sesión y sin pase → 403, Claude NO se llama (${r.estado})`)
r = await pedir('tok-pase', { file: { media_type: 'image/jpeg', data: Buffer.alloc(11 * 1024 * 1024, 7).toString('base64') }, tipo: 'excursion' })
debe(r.estado === 413 && r.cuerpo?.error === TEXTO_GRANDE && llamadasClaude.length === 0, '1c', `excursión de 11 MB → 413 con su texto, sin Claude (${r.estado})`)
r = await pedir('tok-pase')
const p = llamadasClaude[0]
debe(r.estado === 200 && llamadasClaude.length === 1, '1d', `excursión con pase → se lee (una llamada) (${r.estado})`)
debe(p?.system === LEER_EXCURSION_SISTEMA && p?.model === MODELO_LECTURA, '1d', `usa el prompt de EXCURSIÓN y el modelo de lectura (${p?.model})`)
debe(/punto_encuentro/.test(LEER_EXCURSION_SISTEMA) && /localizador/.test(LEER_EXCURSION_SISTEMA) && /"nombre"/.test(LEER_EXCURSION_SISTEMA) && /"fecha"/.test(LEER_EXCURSION_SISTEMA) && /"hora"/.test(LEER_EXCURSION_SISTEMA) && /"personas"/.test(LEER_EXCURSION_SISTEMA) && /codigo_caja/.test(LEER_EXCURSION_SISTEMA), '1e', 'el prompt pide: localizador, nombre, fecha, hora, punto de encuentro, personas y código')
debe(/No devuelvas el nombre de ninguna persona/.test(LEER_EXCURSION_SISTEMA), '1e', 'el prompt prohíbe nombres de personas')
const c = r.cuerpo ?? {}
debe(c.nombre === 'Excursión a Pompeya y Sorrento' && c.localizador === 'CIV-48213' && c.fecha === '2026-11-28' && c.hora === '07:30' && c.punto_encuentro === 'Piazza della Repubblica, Roma' && c.personas === 2, '1f', `la lectura limpia trae los seis datos (${JSON.stringify(c).slice(0, 150)})`)
debe(c.codigo_caja?.pagina === 1 && c.codigo_caja?.x1 === 0.9, '1f', 'y la caja del código')
debe(!('nombre_pasajero' in c) && !('telefono' in c) && !JSON.stringify(c).includes('Ana Prueba') && !JSON.stringify(c).includes('+3460'), '1g', 'NO devuelve el nombre del pasajero ni el teléfono aunque la IA los hubiera puesto')
debe(costes.length === 1 && costes[0].endpoint === 'read-excursion-ticket' && costes[0].modelo === MODELO_LECTURA, '1h', `el coste sale en el registro como «read-excursion-ticket» (${JSON.stringify(costes[0])})`)
// El mismo contador del día que las demás lecturas (10 al día).
for (let i = 0; i < MAX_LECTURAS_AL_DIA; i++) await pedir('tok-pase')
r = await pedir('tok-pase')
debe(r.estado === 429 && r.cuerpo?.error === TEXTO_LIMITE, '1i', `pasadas las 10 lecturas del día, también la excursión → 429 (${r.estado})`)
// Limpieza
const l = limpiarLecturaExcursion({ nombre: '  Tour  ', fecha: '28/11/2026', hora: '7:30', personas: 'dos', localizador: 'X', punto_encuentro: 'a'.repeat(400), codigo_caja: { x0: 0.5, y0: 0.5, x1: 0.2, y1: 0.9 } })
debe(l.fecha === null && l.hora === '07:30' && l.personas === null && l.nombre === 'Tour' && l.punto_encuentro.length === 160 && l.codigo_caja === null, '1j', `la limpieza: fecha mal escrita → null, hora con cero, personas no numéricas → null, textos con tope, caja absurda → null (${JSON.stringify(l).slice(0, 120)})`)
const vacio = limpiarLecturaExcursion(null)
debe(Object.values(vacio).every((v) => v === null), '1j', 'sin nada que leer, todo null')
// Los otros tipos siguen igual
const antes = llamadasClaude.length
r = await pedir('tok-pase', { file: pdf, tipo: 'entrada' }).catch(() => ({ estado: 0 }))
debe(r.estado === 429 || r.estado === 200, '1k', 'los otros tipos siguen pasando por la misma puerta')
servidor.close()

/* ═══════════════ 2. El cliente (src/lib/billeteLeer.ts) ═══════════════ */
console.log('2. El cliente')
const cli = leer('src/lib/billeteLeer.ts')
debe(/export async function leerExcursion\(/.test(cli) && /export function excursionVacia\(/.test(cli) && /export interface DatosExcursionLeida/.test(cli), '2a', '`leerExcursion`, `excursionVacia` y `DatosExcursionLeida` existen y se exportan')
debe(/'excursion'\)\.catch/.test(cli) || /, 'excursion'\)/.test(cli), '2b', 'llama al servidor con tipo «excursion»')
debe(/tipo\?: 'entrada' \| 'alojamiento' \| 'excursion'/.test(cli), '2b', '`leerEnServidor` acepta el tipo nuevo')
const cuerpoLeerExc = cli.slice(cli.indexOf('export async function leerExcursion'), cli.indexOf('// ── El alojamiento'))
debe(/aviso = r\.aviso/.test(cuerpoLeerExc) && /nunca lanza/i.test(cuerpoLeerExc), '2c', 'recoge el aviso (sin sesión, sin pase, límite, tamaño) y nunca lanza')
debe(/puntoEncuentro/.test(cuerpoLeerExc) && /localizador/.test(cuerpoLeerExc) && /personas/.test(cuerpoLeerExc) && /hora/.test(cuerpoLeerExc) && /fecha/.test(cuerpoLeerExc) && /nombre/.test(cuerpoLeerExc), '2d', 'devuelve nombre, día, hora, punto de encuentro, personas y localizador')
debe(/buscarCodigos\(paginas\)/.test(cuerpoLeerExc) && /aSvgDataUrl/.test(cuerpoLeerExc), '2e', 'busca el código en el archivo y lo redibuja (se ve sin internet)')

/* ═══════════════ 3. HOY ═══════════════ */
console.log('3. HOY: «Tu excursión»')
const hoy = leer('src/components/route/today/TodayExcursion.tsx')
debe(/TuExcursionEnHoy/.test(hoy), '3a', '`TodayExcursion` (el día de la excursión, en HOY y HOY v2) pone «Tu excursión»')
const tu = fs.existsSync('src/components/route/hoy/TuExcursionEnHoy.tsx') ? leer('src/components/route/hoy/TuExcursionEnHoy.tsx') : ''
debe(/Tu excursión/.test(tu) && /Toca para ampliar/.test(tu) && /data-hoy-tu-excursion/.test(tu), '3b', 'la fila «Tu excursión» con «Toca para ampliar»')
debe(/usePaseEstado/.test(tu) && /conPase/.test(tu), '3c', 'solo con el pase')
debe(/Cómo llegar al punto de encuentro/.test(tu) || /Cómo llegar al punto de encuentro/.test(leer('src/components/route/hoy/BotonPuntoDeEncuentro.tsx')), '3d', '[Cómo llegar al punto de encuentro]')

/* ═══════════════ 4. HOY en la app (Chrome) ═══════════════ */
if (process.env.APP_URL) {
  console.log('4. HOY en la app: el día de la excursión, con y sin pase')
  const path = (await import('node:path')).default
  const { abrirApp } = await import('./_enLaApp.mjs')
  const SALIDA = path.resolve('docs/dias/capturas_jutrip')
  fs.mkdirSync(SALIDA, { recursive: true })
  for (const modo of ['con', 'sin']) {
    const a = await abrirApp(process.env.APP_URL, { ruta: `/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0&pase=${modo}&hoy2=on`, ancho: 390, alto: 844 })
    try {
      const ev = (js) => a.evaluar(js)
      for (let intento = 0; intento < 3; intento++) {
        try { await ev('window.__rutaPrueba().then(() => true)'); break } catch (e) { if (intento === 2) throw e; await ev('location.reload()').catch(() => undefined); await a.esp(5000) }
      }
      for (let i = 0; i < 90 && !(await ev('window.__ruta?.getState().route != null').catch(() => false)); i++) await a.esp(1000)
      await ev("Promise.all([import('/src/store/useRouteStore.ts'), import('/src/store/useBilleteStore.ts'), import('/src/lib/bookings.ts'), import('/src/store/useSyncStore.ts')]).then(() => true)")
      await a.esp(2500)
      for (let i = 0; i < 6; i++) {
        const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
        if (!h) break
        await a.esp(600)
      }
      const R = (js) => ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const B = await import('/src/lib/bookings.ts'); const BS = await import('/src/store/useBilleteStore.ts'); const SY = await import('/src/store/useSyncStore.ts'); const st = () => R.useRouteStore.getState(); ${js} })()`)
      // El día de la excursión: el que lleva el interruptor (o el primero con fecha), puesto en «Excursión» y con su reserva.
      const base = await R(`
        const r = st().route
        const dias = r.days.filter((x) => !x.isReturnLeg && B.dateOfDay(r, x))
        const d = dias.find((x) => x.interruptor) ?? dias[1] ?? dias[0]
        const exc = (d.excursions ?? [])[0] ?? null
        if (!exc) return { sinExcursion: true, dias: dias.length }
        const dia = { ...d, dayType: 'excursion', selectedExcursionId: exc.id, interruptor: { ...(d.interruptor ?? { other: null }), mode: 'excursion', excursionId: exc.id } }
        R.useRouteStore.setState({ route: { ...r, days: r.days.map((x) => (x.id === d.id ? dia : x)) } })
        const iso = B.dateOfDay(r, d)
        st().addReservation({ id: 'res-10r-d', kind: 'excursion', refId: exc.id, name: exc.title, placeNames: [], dateIso: iso, dayNumber: null, time: '07:30', meetingPoint: 'Piazza della Repubblica, Roma', locator: null, excursionId: exc.id, excursionData: exc }, exc)
        return { iso, id: exc.id, titulo: exc.title }`)
      debe(!base.sinExcursion, '4a', `hay un día con excursión para probar (${JSON.stringify(base)})`)
      if (base.sinExcursion) continue
      const svg = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21"><rect width="21" height="21" fill="#fff"/><path d="M1 1h7v7H1zM13 1h7v7h-7zM1 13h7v7H1zM10 10h3v3h-3zM15 14h5v5h-5z" fill="#000"/></svg>').toString('base64')
      const poner = (codigo) => R(`BS.useBilleteStore.getState().ponerExcursion(SY.useSyncStore.getState().activeTripId, ${JSON.stringify(base.id)}, { personas: 2, localizador: 'CIV48213', codigo: ${JSON.stringify(codigo)}, dueno: null }); return true`)
      await poner({ formato: 'qr', texto: 'X', dibujo: svg, imagen: null })
      await R(`R.useRouteStore.setState({ dev_simulated_today_iso: ${JSON.stringify(base.iso)} }); st().setActiveDayId(null); st().setMode('today'); return true`)
      await a.esp(3500)
      for (let i = 0; i < 4; i++) { await ev(`Array.from(document.querySelectorAll('[role="dialog"] button')).filter((b) => /^(cerrar|×|✕)$/i.test((b.getAttribute('aria-label') ?? b.textContent).trim())).forEach((b) => b.click()); true`); await a.esp(300) }
      const hoy = () => ev(`(() => { const t = document.querySelector('[data-hoy-tu-excursion]'); const p = document.querySelector('[data-hoy-punto-de-encuentro]'); return { tu: Boolean(t), texto: (t?.innerText ?? '').replace(/\\s+/g, ' '), img: Boolean(t?.querySelector('img')), punto: Boolean(p), href: p?.getAttribute('href') ?? null, textoPunto: (p?.textContent ?? '').trim(), dia: /excursión del día/i.test(document.body.innerText) } })()`)
      const h = await hoy()
      if (modo === 'con') debe(h.dia, '4b', 'con pase: HOY enseña la excursión del día')
      if (modo === 'con') {
        debe(h.tu && /Tu excursión/.test(h.texto) && /Toca para ampliar/.test(h.texto) && h.img, '4c', `con pase, HOY enseña «Tu excursión» con el código pequeño (${JSON.stringify(h)})`)
        debe(h.punto && h.textoPunto === 'Cómo llegar al punto de encuentro' && /destination=Piazza\+della\+Repubblica/.test(h.href ?? ''), '4d', `con pase, [Cómo llegar al punto de encuentro] abre el mapa con ese punto (${h.href})`)
        await ev(`document.querySelector('[data-hoy-tu-excursion]')?.scrollIntoView({ block: 'center' }); true`)
        await a.esp(400)
        await a.captura(path.join(SALIDA, '10r_hoy_tu_excursion_1.jpg')).catch(() => {})
        await ev(`document.querySelector('[data-hoy-tu-excursion]')?.click(); true`)
        await a.esp(700)
        const grande = await ev(`(() => { const i = Array.from(document.querySelectorAll('img')).map((x) => x.getBoundingClientRect()).sort((p, q) => q.width - p.width)[0]; return { w: Math.round(i?.width ?? 0), pie: /Localizador CIV48213/.test(document.body.innerText) } })()`)
        debe(grande.w >= 250 && grande.pie, '4e', `al tocarlo, el código a pantalla completa con «Localizador CIV48213» (${JSON.stringify(grande)})`)
        await a.captura(path.join(SALIDA, '10r_hoy_tu_excursion_2.jpg')).catch(() => {})
        await ev(`document.querySelector('[data-billete-cerrar]')?.click(); true`)
        // Sin billete (se quita): sin «Tu excursión», pero el botón del punto de encuentro sigue.
        await R(`BS.useBilleteStore.getState().quitarExcursion(SY.useSyncStore.getState().activeTripId, ${JSON.stringify(base.id)}); return true`)
        await a.esp(700)
        const sin = await hoy()
        debe(!sin.tu && sin.punto, '4f', `sin billete no sale «Tu excursión» pero sí el punto de encuentro (${JSON.stringify(sin)})`)
        // Privado: el billete de otra persona no se ve.
        await poner({ formato: 'qr', texto: 'X', dibujo: svg, imagen: null })
        await R(`const s = BS.useBilleteStore.getState(); BS.useBilleteStore.setState({ datos: { ...s.datos, excursiones: { ...s.datos.excursiones, [${JSON.stringify(base.id)}]: { ...s.datos.excursiones[${JSON.stringify(base.id)}], dueno: 'otra-persona' } } } }); return true`)
        await a.esp(500)
        const ajeno = await ev(`Boolean(document.querySelector('[data-hoy-tu-excursion]'))`)
        debe(ajeno === true || ajeno === false, '4g', 'privado: (sin gente cargada el dueño no se compara; lo cubre la prueba de B)')
      } else {
        debe(!h.tu && !h.punto, '4h', `sin pase, HOY no enseña «Tu excursión» ni el punto de encuentro (${JSON.stringify(h)})`)
        await a.captura(path.join(SALIDA, '10r_hoy_tu_excursion_sin_pase.jpg')).catch(() => {})
      }
    } finally {
      await a.cerrar?.()
    }
  }
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log('  FALLO', f.regla, f.texto)
process.exit(fallos.length ? 1 : 0)
