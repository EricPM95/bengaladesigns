// La prueba de la Tanda V40: los sonidos definitivos de Eric (SONIDO_dEFINITIVO.zip) puestos en la app, EXACTOS, menos Lanzarote.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV40.mjs [--zip=C:/Users/ERIC/Downloads/SONIDO_dEFINITIVO.zip]
// Parte 1 (sin navegador): los datos, los archivos (mismas muestras que los .wav del zip, y cuánto cambian), el peso, las licencias y los créditos.
// Parte 2 (Chrome de usar y tirar, sin tocar nada de nadie): por cada animación, lo que programa la APP (`sonar`) es lo mismo que programa el ESTUDIO con el estado que sale del zip (`estadoDesdeJson`):
//   mismos sonidos de Code (lo silenciado, no), mismos sonidos de Eric, momentos (±20 ms) y volúmenes. Lanzarote sigue como antes.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { leerZip } from '../sonidos/aplicarEstudio.mjs'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const zipRuta = (process.argv.find((a) => a.startsWith('--zip=')) ?? '--zip=C:/Users/ERIC/Downloads/SONIDO_dEFINITIVO.zip').slice(6)
const DE_LANZAROTE = ['emblema_lanzarote']

const json = JSON.parse(leer('data/sonidos/estudio.json'))
const ids = Object.keys(json.animaciones)
const zip = fs.existsSync(zipRuta) ? leerZip(fs.readFileSync(zipRuta)) : null
const delZip = (n) => zip?.find((e) => e.nombre === n)?.datos

// ───────── Parte 1: datos y archivos ─────────
debe(json.version === 1 && ids.length >= 27, 'datos', `estudio.json de la app: ${ids.length} animaciones`)
debe(!ids.some((i) => DE_LANZAROTE.includes(i)), 'lanzarote', 'Lanzarote NO está en lo aplicado (sigue con lo que tiene hoy)')
const dir = 'public/sonidos/estudio'
let pesoNuevo = 0
for (const n of fs.readdirSync(dir)) pesoNuevo += fs.statSync(path.join(dir, n)).size
debe(!fs.existsSync(path.join(dir, 'originales')) && !fs.readdirSync(dir).some((n) => n.endsWith('.wav')), 'peso', 'la app solo lleva lo que suena (sin originales ni .wav)')
let pesoAntes = 0
const recorre = (d) => { for (const n of fs.readdirSync(d)) { const r = path.join(d, n); if (fs.statSync(r).isDirectory()) { if (n !== 'estudio') recorre(r) } else pesoAntes += fs.statSync(r).size } }
recorre('public/sonidos')
console.log(`  Peso de los sonidos de la app: antes ${(pesoAntes / 1048576).toFixed(2)} MB (v30 y demás) · lo nuevo de Eric ${(pesoNuevo / 1048576).toFixed(2)} MB (${fs.readdirSync(dir).length} archivos, solo se bajan los de la animación que suena) · después ${((pesoAntes + pesoNuevo) / 1048576).toFixed(2)} MB`)
debe(pesoNuevo < 6 * 1048576, 'peso', `lo nuevo pesa ${(pesoNuevo / 1048576).toFixed(2)} MB (< 6 MB) y se carga por animación, no al abrir la app`)

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'v40-'))
const muestras = (f) => {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', f, '-f', 'f32le', '-ac', '1', '-'], { maxBuffer: 1 << 28 })
  return new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + r.stdout.byteLength - (r.stdout.byteLength % 4)))
}
const tasaDe = (f) => Number(spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=sample_rate', '-of', 'default=nw=1:nk=1', f], { encoding: 'utf8' }).stdout.trim())
const resumen = []
let capas = 0
for (const [id, a] of Object.entries(json.animaciones)) {
  for (const c of a.capas) {
    if (c.origen !== 'archivo') continue
    capas++
    const ruta = path.join(dir, c.archivo.replace(/\.wav$/i, '.m4a'))
    if (!fs.existsSync(ruta)) { debe(false, 'archivos', `${id}: falta ${ruta}`); continue }
    const dz = delZip(c.archivo)
    if (!dz) { debe(false, 'archivos', `${id}: ${c.archivo} no está en el zip`); continue }
    if (/\.wav$/i.test(c.archivo)) {
      // El .wav del zip frente al .m4a de la app.
      const w = path.join(tmp, c.archivo)
      fs.writeFileSync(w, dz)
      const a1 = muestras(w)
      const a2 = muestras(ruta)
      const n = Math.min(a1.length, a2.length)
      let e2 = 0, s2 = 0, r2 = 0, pico = 0, maxd = 0
      for (let k = 0; k < n; k++) { const d = a1[k] - a2[k]; e2 += d * d; s2 += a1[k] * a1[k]; r2 += a2[k] * a2[k]; pico = Math.max(pico, Math.abs(a1[k])); maxd = Math.max(maxd, Math.abs(d)) }
      const dRms = 10 * Math.log10(Math.max(r2, 1e-20) / Math.max(s2, 1e-20))
      const snr = s2 > 0 ? 10 * Math.log10(s2 / Math.max(e2, 1e-20)) : 99
      const dd = Math.abs(a1.length - a2.length) / tasaDe(w) * 1000
      resumen.push({ id, archivo: c.archivo, snr, dd, maxd, pico, dRms })
      debe(tasaDe(ruta) === tasaDe(w) && dd < 25 && snr > 12 && Math.abs(dRms) < 0.5, 'archivos', `${c.archivo}: mismo sonido tras convertir a m4a (misma tasa y duración ±${dd.toFixed(1)} ms, volumen ${dRms >= 0 ? '+' : ''}${dRms.toFixed(2)} dB, señal/ruido ${snr.toFixed(1)} dB)`)
    } else {
      // Un mp3/m4a/ogg del zip: va TAL CUAL (los mismos bytes).
      const ok = Buffer.compare(fs.readFileSync(ruta), Buffer.from(dz)) === 0
      debe(ok, 'archivos', `${c.archivo}: va tal cual (mismos bytes que en el zip)`)
    }
  }
}
if (resumen.length) {
  const peor = resumen.reduce((x, y) => (y.snr < x.snr ? y : x))
  console.log(`  Conversión a m4a (AAC 192 kbps, misma tasa): ${resumen.length} .wav · señal/ruido de ${peor.snr.toFixed(1)} dB (${peor.archivo}) a ${Math.max(...resumen.map((r) => r.snr)).toFixed(1)} dB · cambio de volumen como mucho ${Math.max(...resumen.map((r) => Math.abs(r.dRms))).toFixed(2)} dB · diferencia de duración como mucho ${Math.max(...resumen.map((r) => r.dd)).toFixed(1)} ms · la mayor diferencia de una muestra ${Math.max(...resumen.map((r) => r.maxd)).toFixed(3)}`)
}
debe(capas >= 30, 'archivos', `${capas} sonidos de Eric comprobados`)
fs.rmSync(tmp, { recursive: true, force: true })
// Lo que no sabe hacer la app todavía: un sonido de Code retocado en el estudio (ninguno en este zip). Si llega uno, hay que ampliar la app antes de seguir.
debe(!Object.values(json.animaciones).some((a) => a.sonidos_de_code.some((s) => s.retoques)), 'alcance', 'ningún sonido de Code retocado (la app aún no los sabe poner: si llega uno en otro zip, hay que hacerlo)')

const lic = fs.existsSync('docs/sonidos/LICENCIAS_SONIDOS.md') ? leer('docs/sonidos/LICENCIAS_SONIDOS.md') : ''
const originales = new Set(Object.values(json.animaciones).flatMap((a) => a.capas.filter((c) => c.origen === 'archivo').map((c) => c.nombre)))
debe(lic.length > 500 && [...originales].every((o) => lic.includes(o)), 'licencias', `LICENCIAS_SONIDOS.md lista los ${originales.size} archivos de Eric por su nombre`)
const cred = leer('src/lib/creditos.ts')
debe(/sonid/i.test(cred) && /Pixabay|Mixkit|Freesound/i.test(cred), 'licencias', 'Créditos nombra a quien lo pide (Pixabay, Mixkit, Freesound…)')

// ───────── Parte 2: la app frente al estudio ─────────
const dentro = `(async () => {
  const M = await import('/src/lib/sonidos/motor.ts')
  const S = await import('/src/lib/sonidos.ts')
  const G = await import('/src/lib/sonidos/estudioGuardado.ts')
  const E = await import('/src/lib/sonidos/estudioDeEric.ts')
  const j = await E.cargarEstudioDeEric()
  const ctx = S.contextoDeAudioDeLaApp()
  await Promise.race([ctx.resume(), new Promise((r) => setTimeout(r, 1500))])
  if (ctx.state !== 'running') throw new Error('El audio del Chrome de prueba no arranca (hace falta un toque): ' + ctx.state)
  const decod = async (u) => ctx.decodeAudioData(await (await fetch(u)).arrayBuffer())
  const norm = () => (window.__sonidosAgendados ?? []).map((x) => ({ k: x.partitura + '|' + x.tipo + '|' + x.id, p: x.programado, v: x.vol ?? null })).sort((a, b) => (a.k < b.k ? -1 : a.k > b.k ? 1 : a.p - b.p))
  const limpiar = () => { M.cortar(ctx, 0); window.__sonidosAgendados = []; M.ponerEstudio(null) }
  const salida = {}
  for (const id of ${JSON.stringify(ids)}) {
    const a = j.animaciones[id]
    const tramos = a.tramos ?? []
    // El ESTUDIO: el estado que sale del zip (el cargador del propio estudio) puesto en el motor como lo hace el visor.
    limpiar()
    const archivos = new Map(); archivos.get = () => new Uint8Array(4)
    const est = G.estadoDesdeJson({ sonidos_de_code: a.sonidos_de_code, capas: a.capas, tramos }, archivos, () => 'audio/wav')
    const propios = []
    for (let i = 0; i < est.capas.length; i++) {
      const c = est.capas[i], cj = a.capas[i]
      const buffer = c.origen === 'archivo' ? await decod(E.urlDeCapa(cj.archivo)) : await M.cargarPremio(ctx, c.sonido, c.letra)
      propios.push({ id: c.id, nombre: c.nombre, buffer, ms: c.ms, vol: c.vol, empieza: c.empieza })
    }
    const inicios = {}; for (const t of tramos) inicios[t.partitura] = t.empieza
    M.ponerEstudio({ propios, silenciados: est.silenciados, golpe: a.golpe, ajustes: est.ajustes, letras: est.letras, volumenes: est.volumenes, editados: {}, inicios })
    for (const t of tramos) await M.precargar(ctx, t.partitura)
    const t0 = ctx.currentTime + 0.5
    M.programarPropios(ctx, id, t0)
    for (const t of tramos) M.iniciarPartitura(ctx, t.partitura, { en: t0 + t.empieza })
    const delEstudio = norm()
    // La APP: sonar() con la animación, tal cual lo hace la pantalla.
    limpiar()
    await S.sonar(tramos[0].partitura, { animacion: id })
    for (const t of tramos.slice(1)) await S.sonar(t.partitura)
    const dela = norm()
    salida[id] = { delEstudio, dela }
  }
  // Lanzarote: sigue con lo de siempre (nada de Eric, el mismo plan que sin estudio).
  limpiar()
  await M.precargar(ctx, 'emblema'); await M.precargar(ctx, 'escena')
  M.iniciarPartitura(ctx, 'emblema', { en: ctx.currentTime + 0.5 }); M.iniciarPartitura(ctx, 'escena', { en: ctx.currentTime + 0.5 })
  const antes = norm()
  limpiar()
  await S.sonar('emblema', { animacion: 'emblema_lanzarote' }); await S.sonar('escena')
  const despues = norm()
  limpiar()
  return JSON.stringify({ salida, lanzarote: { antes, despues } })
})()`

const app = await abrirApp(APP, { ruta: '/?cuentas=off' })
let r
try {
  // Un toque de verdad (como el dedo en el móvil): sin él el navegador no deja sonar.
  await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: 100, y: 100, button: 'left', clickCount: 1 })
  await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 100, y: 100, button: 'left', clickCount: 1 })
  r = JSON.parse(await app.evaluar(dentro))
} finally {
  app.cerrar()
}
let totalSonidos = 0
for (const id of ids) {
  const { delEstudio, dela } = r.salida[id]
  const a = json.animaciones[id]
  if (id === 'apertura') {
    // La apertura va en SILENCIO en la web (V35B): la app no la pide nunca; lo de Eric queda guardado para la app de las tiendas y suena en el estudio.
    debe(dela.length === 0 && delEstudio.length === json.animaciones.apertura.capas.length, 'apertura', `apertura: en la app en silencio (${dela.length} sonidos) y en el estudio suena lo de Eric (${delEstudio.length})`)
    continue
  }
  totalSonidos += dela.length
  const igual = delEstudio.length === dela.length && delEstudio.every((x, i) => x.k === dela[i].k && Math.abs(x.p - dela[i].p) <= 0.02 && Math.abs((x.v ?? 0) - (dela[i].v ?? 0)) <= 0.001)
  debe(igual, 'app=estudio', `${id}: la app programa lo mismo que el estudio (${dela.length} sonidos; mismos archivos, momentos ±20 ms y volúmenes)`)
  if (!igual) console.log('    estudio:', JSON.stringify(delEstudio), '\n    app:    ', JSON.stringify(dela))
  // Lo de Eric: cada capa suena en su momento y con su volumen (lo dice el json, no el motor).
  a.capas.forEach((c, i) => {
    const quiere = (c.empieza === 'golpe' ? a.golpe : 0) + c.ms / 1000
    const hay = dela.filter((x) => x.k === `${id}|archivo|propio:z${i + 1}`)
    debe(hay.length === 1 && Math.abs(hay[0].p - quiere) <= 0.02 && Math.abs(hay[0].v - c.volumen) <= 0.001, 'eric', `${id}: ${c.nombre} suena en ${quiere.toFixed(2)} s al ${Math.round(c.volumen * 100)} %`)
  })
  // Lo silenciado no suena.
  for (const s of a.sonidos_de_code.filter((x) => x.silenciado)) {
    const suena = dela.some((x) => x.k.split('|')[1] === s.tipo && x.k.split('|')[2] === s.sonido)
    debe(!suena, 'silencio', `${id}: «${s.sonido}» silenciado no suena`)
  }
}
console.log(`  ${ids.length} animaciones, ${totalSonidos} sonidos programados comparados`)
const { antes, despues } = r.lanzarote
debe(JSON.stringify(antes) === JSON.stringify(despues) && !despues.some((x) => x.k.includes('propio:')), 'lanzarote', `Lanzarote suena como antes (${despues.length} sonidos de Code, ninguno de Eric)`)

console.log(`\nPrueba V40: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
