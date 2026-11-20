// (V30) PREPARA LOS CANDIDATOS DE LOS SONIDOS DE VERDAD (estilo juego) a partir del GDC Game Audio Bundle de Sonniss.
//   · Baja SOLO los archivos que se usan (cada uno, por rango, del zip de Sonniss: ver sonniss.mjs). Nunca los paquetes enteros; lo bajado vive en la carpeta temporal, no en el repositorio.
//   · Mira la forma de onda de cada uno SIN oírlo: descarta los que se cortan arriba (clipping), los de silencio largo delante, los muy cortos o muy largos y los de ruido de fondo.
//   · Compone cada candidato (A a E) con capas alineadas por su PICO (el golpe), recorta el silencio de delante, pone un fundido corto al final, normaliza a la misma sonoridad y lo codifica a m4a/AAC de 44,1 kHz.
//   · Mide el golpe (el pico) en el archivo FINAL y lo apunta en public/sonidos/v30/manifiesto.json: la partitura lo hace caer en el milisegundo en que acaba la animación.
//   node scripts/destino/sonidos/prepararCandidatos.mjs
// Licencia (sonniss.com/gdc-bundle-license, v2.0, comprobada el 20-nov-2026): uso comercial en una app que se vende, sin citar al autor; prohíbe repartir los sonidos como sonidos sueltos y usarlos para entrenar IA.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { bajarArchivo, indiceCompleto } from './sonniss.mjs'

const FFMPEG = process.env.FFMPEG ?? 'C:/Users/ERIC/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.1-full_build/bin/ffmpeg.exe'
const SR = 44100
const TEMP = path.join(os.tmpdir(), 'sonidos_v30')
const SALIDA = 'public/sonidos/v30'
fs.mkdirSync(TEMP, { recursive: true })
fs.mkdirSync(SALIDA, { recursive: true })

/** Las fuentes: nombre corto → un trozo único del nombre del archivo en el índice de Sonniss. */
const FUENTES = {
  snap: 'Interface Percussion Snap', pop: 'Interface Pop High Short', glassy: 'Interface Accept Glassy Snap', dclick: 'UI Button Analog Vintage Double Click', coinflip: 'Foley Coin Flip Single Fast', coins: 'Ting Coins',
  wooshInfo: 'Woosh Sweep Slide Infographics Basic', pullSwoosh: 'Cartoon Pull Swoosh Readout', wooshDebris: 'Woosh Debris', glassWhoosh: 'Whoosh Glass Crystal', spin: 'Vibrato Impact Snap Spin Transition',
  readout: 'Readout Thin Long', arpReveal: 'Interface Arp Reveal Down Long', twinkle: 'Button Arp Twinkle', plucks: 'Interface Plucks Happy', kalimba: 'Kalimba 3 Up', xylo: 'Xylophone Ringtone 2',
  magicCreation: 'Magic Creation 23', bells: 'Magic Christmas Bells 2', powerUp: 'Power Up Bright Positive', magicLight: 'Magic Light Spell Enchantment', collect: 'Collect Scifi Futuristic', arcPower: 'ArcPowerUpDesign04',
  gameEntry: 'Game Entry Happy Short', confetti: 'Cofetti Whoosh Pluck Spill', chord: 'Impact Hit Rapid Chord Reverb', braamSlow: 'Transition Braam Slow Dark', horn32: 'Cinematic Horn Braam, Epic, Cinematic, Dark, Instrument, Huge-32',
  horn67: 'Cinematic Horn Braam, Epic, Cinematic, Dark, Instrument, Huge-67', astonish: 'astonishment-001', musicBox: 'Music Box C Wind Up', cutSweep: 'Impact Cut Sweep', bassDown: 'Cartoon Transition Bass Down',
}

const ffmpeg = (args, opciones = {}) => execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', ...args], { maxBuffer: 1024 * 1024 * 512, ...opciones })

/** Decodifica un audio a mono de 44,1 kHz en coma flotante. */
function decodificar(ruta) {
  const b = ffmpeg(['-i', ruta, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'])
  return new Float32Array(b.buffer, b.byteOffset, Math.floor(b.length / 4)).slice()
}

/** Mira una fuente: duración, pico, clipping, silencio de delante, ruido de fondo, el instante del pico (el golpe). */
function analizar(s) {
  const n = s.length
  let pico = 0
  let clip = 0
  for (let i = 0; i < n; i++) {
    const a = Math.abs(s[i])
    if (a > pico) pico = a
    if (a >= 0.985) clip++
  }
  const v = Math.floor(SR * 0.01)
  const env = []
  for (let i = 0; i + v <= n; i += v) {
    let e = 0
    for (let k = 0; k < v; k++) e += s[i + k] * s[i + k]
    env.push(Math.sqrt(e / v))
  }
  const max = Math.max(...env, 1e-9)
  const umbral = max * 0.01 // -40 dB
  const ini = Math.max(0, env.findIndex((x) => x > umbral))
  const iPico = env.indexOf(max)
  const cola = env.slice(-Math.max(3, Math.floor(env.length * 0.05)))
  const ruido = cola.reduce((a, b) => a + b, 0) / cola.length / max
  return { dura: n / SR, pico, clipping: clip / n, silencioDelante: ini * 0.01, tPico: iPico * 0.01, ruido, ini: ini * 0.01 }
}

const recortar = (s, desde, hasta) => s.slice(Math.max(0, Math.floor(desde * SR)), Math.min(s.length, Math.floor(hasta * SR)))
const fundidoFinal = (s, seg = 0.06) => {
  const n = Math.min(s.length, Math.floor(seg * SR))
  for (let i = 0; i < n; i++) s[s.length - 1 - i] *= i / n
  return s
}

/**
 * Compone un candidato a partir de capas. Cada capa: { f: fuente, g: ganancia, d: desfase en s respecto al golpe (el pico de la capa cae en G + d), max: duración máxima de la capa tras su pico, antes: segundos que se
 * conservan ANTES del pico }. El golpe del conjunto cae en `G` segundos desde el principio. Devuelve el audio y el instante del pico.
 */
function componer(capas, fuentes, G = 0.35, tope = 2.6) {
  const total = Math.ceil((G + tope) * SR)
  const mezcla = new Float32Array(total)
  for (const c of capas) {
    const fu = fuentes[c.f]
    const a = fu.analisis
    const antes = Math.min(c.antes ?? 0.3, a.tPico)
    const desdeSrc = a.tPico - antes
    const hastaSrc = a.tPico + (c.max ?? 1.6)
    const trozo = fundidoFinal(recortar(fu.pcm, desdeSrc, hastaSrc), 0.08)
    const inicio = Math.round((G + (c.d ?? 0) - antes) * SR)
    for (let i = 0; i < trozo.length; i++) {
      const j = inicio + i
      if (j >= 0 && j < total) mezcla[j] += trozo[i] * (c.g ?? 1)
    }
  }
  // fuera el silencio de delante
  const an = analizar(mezcla)
  const desde = Math.max(0, an.ini - 0.004)
  let out = recortar(mezcla, desde, mezcla.length / SR)
  // se quita la cola de silencio
  let fin = out.length
  while (fin > 0 && Math.abs(out[fin - 1]) < 0.002) fin--
  out = out.slice(0, Math.min(fin, Math.floor((tope + 0.2) * SR)))
  return fundidoFinal(out, 0.07)
}

/** El mismo volumen en todos: la sonoridad (RMS) alrededor del golpe a un nivel fijo y un limitador suave. */
function normalizar(s, objetivo = 0.17) {
  const a = analizar(s)
  const i0 = Math.max(0, Math.floor((a.tPico - 0.25) * SR))
  const i1 = Math.min(s.length, Math.floor((a.tPico + 0.5) * SR))
  let e = 0
  for (let i = i0; i < i1; i++) e += s[i] * s[i]
  const rms = Math.sqrt(e / Math.max(1, i1 - i0))
  const g = objetivo / Math.max(rms, 1e-6)
  const out = new Float32Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = Math.tanh(s[i] * g * 1.05) * 0.93
  return out
}

function aWav(s) {
  const b = Buffer.alloc(44 + s.length * 2)
  b.write('RIFF', 0)
  b.writeUInt32LE(36 + s.length * 2, 4)
  b.write('WAVEfmt ', 8)
  b.writeUInt32LE(16, 16)
  b.writeUInt16LE(1, 20)
  b.writeUInt16LE(1, 22)
  b.writeUInt32LE(SR, 24)
  b.writeUInt32LE(SR * 2, 28)
  b.writeUInt16LE(2, 32)
  b.writeUInt16LE(16, 34)
  b.write('data', 36)
  b.writeUInt32LE(s.length * 2, 40)
  for (let i = 0; i < s.length; i++) b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(s[i] * 32767))), 44 + i * 2)
  return b
}

function aM4a(s, destino, kbps = 80) {
  const tmp = path.join(TEMP, 'tmp.wav')
  fs.writeFileSync(tmp, aWav(s))
  ffmpeg(['-y', '-i', tmp, '-c:a', 'aac', '-b:a', `${kbps}k`, '-ar', String(SR), '-ac', '1', '-movflags', '+faststart', destino])
}

/**
 * (V30) El último paso de cada candidato: (1) fuera el silencio de delante, hasta que el sonido pasa del 5 % de su pico (lo mismo que mira pruebaV30), con 2 ms de entrada para que no haga «clic»; (2) se codifica a m4a, se
 * DESCODIFICA tal como lo oirá el móvil y se mide el pico de verdad (el AAC puede pasarse un poco del nivel: si el pico sale por encima de 0,94 se baja y se repite). Devuelve el audio descodificado: de ahí salen la duración
 * y el instante del golpe que se apuntan en el manifiesto (el pico real del archivo, no el de antes de codificar).
 */
function terminar(s, destino, kbps = 80) {
  let pico = 0
  for (let i = 0; i < s.length; i++) pico = Math.max(pico, Math.abs(s[i]))
  let ini = 0
  while (ini < s.length && Math.abs(s[ini]) < 0.05 * pico) ini++
  ini = Math.max(0, ini - Math.floor(0.002 * SR))
  s = s.slice(ini)
  const entrada = Math.floor(0.002 * SR)
  for (let i = 0; i < entrada; i++) s[i] *= i / entrada
  let g = 1
  let dec = s
  for (let intento = 0; intento < 6; intento++) {
    aM4a(s.map((x) => x * g), destino, kbps)
    dec = decodificar(destino)
    let p = 0
    for (let i = 0; i < dec.length; i++) p = Math.max(p, Math.abs(dec[i]))
    // y se comprueba también el silencio de delante ya descodificado (el códec puede añadir un poco): si pasa de 20 ms, se recorta y se vuelve a codificar
    let d0 = 0
    while (d0 < dec.length && Math.abs(dec[d0]) < 0.05 * p) d0++
    if (d0 / SR > 0.02) {
      s = s.slice(Math.max(0, d0 - Math.floor(0.002 * SR)))
      continue
    }
    if (p <= 0.94) break
    g *= 0.9 / p
  }
  return dec
}

/* ───────── Las recetas: para cada momento, cinco candidatos de estilos distintos ───────── */
const C = (f, g = 1, extra = {}) => ({ f, g, ...extra })
// Una medalla por nivel (1 bronce, 2 plata, 3 oro, 4 diamante): capas que se suman (la misma familia, cada nivel más grande).
const MEDALLAS = {
  A: { estilo: 'monedas', niveles: [[C('coinflip'), C('bells', 0.25, { max: 1.3, antes: 0.1 })], [C('coins'), C('bells', 0.25, { max: 1.4, antes: 0.1 })], [C('coins'), C('twinkle', 0.8, { d: 0.05 })], [C('coins'), C('twinkle', 0.8, { d: 0.05 }), C('magicLight', 0.7, { d: 0.1 }), C('horn67', 0.35)]] },
  B: { estilo: 'mágico', niveles: [[C('kalimba'), C('bells', 0.3, { max: 1.3, antes: 0.1 })], [C('xylo', 1, { max: 1.5 })], [C('xylo'), C('magicCreation', 0.8)], [C('xylo'), C('magicCreation', 0.8), C('magicLight', 0.8), C('bells', 0.5, { max: 2.2 })]] },
  C: { estilo: 'orquestal', niveles: [[C('chord', 0.5, { max: 1.4 })], [C('chord', 0.8, { max: 1.7 })], [C('chord'), C('horn32', 0.4)], [C('chord'), C('horn32', 0.5), C('horn67', 0.5), C('magicLight', 0.6, { d: 0.15 })]] },
  D: { estilo: 'juego alegre', niveles: [[C('pop'), C('bells', 0.3, { max: 1.2, antes: 0.1 })], [C('plucks'), C('bells', 0.3, { max: 1.4, antes: 0.1 })], [C('plucks'), C('confetti', 0.8)], [C('gameEntry'), C('plucks', 0.8), C('confetti', 0.8), C('twinkle', 0.7, { d: 0.1 })]] },
  E: { estilo: 'poder', niveles: [[C('glassy'), C('bells', 0.3, { max: 1.2, antes: 0.1 })], [C('powerUp', 0.9)], [C('powerUp'), C('arcPower', 0.6, { max: 1.5 })], [C('powerUp'), C('arcPower', 0.7, { max: 1.8 }), C('collect', 0.6), C('chord', 0.6)]] },
}
const RECETAS = {
  clic: { dura: [0.03, 0.3], tope: 0.3, G: 0.01, candidatos: { A: [C('snap')], B: [C('pop')], C: [C('glassy')], D: [C('dclick')], E: [C('coinflip', 1, { max: 0.25 })] } },
  vuelo: { dura: [0.4, 0.8], tope: 0.8, G: 0.2, candidatos: { A: [C('wooshInfo', 1, { antes: 0.4, max: 0.5 })], B: [C('pullSwoosh', 1, { antes: 0.4, max: 0.5 })], C: [C('wooshDebris', 1, { antes: 0.4, max: 0.5 })], D: [C('glassWhoosh', 1, { antes: 0.4, max: 0.5 })], E: [C('spin', 1, { antes: 0.4, max: 0.5 })] } },
  brillo: { dura: [0.5, 1.4], tope: 1.2, G: 0.1, candidatos: { A: [C('twinkle', 1, { max: 1 })], B: [C('plucks', 1, { max: 1 })], C: [C('kalimba', 1, { max: 1 }), C('bells', 0.3, { max: 1, antes: 0.1 })], D: [C('xylo', 1, { max: 1 })], E: [C('magicCreation', 1, { max: 1 })] } },
  // El redoble: sube mientras gira y tiene que durar lo que dura el giro (se usa por el FINAL, alineado con el golpe, y se corta por delante: nunca estirado).
  redoble: { dura: [0.9, 3.0], tope: 3.0, G: 2.6, candidatos: { A: [C('glassWhoosh', 1, { antes: 1.5, max: 0.25 })], B: [C('pullSwoosh', 1, { antes: 1.1, max: 0.3 })], C: [C('braamSlow', 1, { antes: 2.6, max: 0.3 })], D: [C('cutSweep', 1, { antes: 1.5, max: 0.3 })], E: [C('bassDown', 1, { antes: 1.5, max: 0.3 })] } },
  coleccion: { dura: [1, 2.5], tope: 2.3, G: 0.35, candidatos: { A: [C('coins'), C('twinkle', 0.8, { d: 0.05 }), C('plucks', 0.7, { d: 0.1 })], B: [C('magicLight'), C('bells', 0.5, { max: 2 })], C: [C('chord'), C('horn32', 0.4)], D: [C('gameEntry'), C('confetti', 0.8), C('plucks', 0.7)], E: [C('powerUp'), C('arcPower', 0.6, { max: 1.5 })] } },
  emblema: { dura: [1, 2.5], tope: 2.4, G: 0.4, candidatos: { A: [C('astonish', 1, { max: 2 }), C('magicCreation', 0.8)], B: [C('magicLight'), C('kalimba', 0.8)], C: [C('braamSlow', 0.8, { max: 2 }), C('chord', 0.8)], D: [C('musicBox', 0.9, { max: 2 }), C('twinkle', 0.8)], E: [C('arpReveal', 0.9, { max: 2 }), C('magicLight', 0.8)] } },
  maravilla: { dura: [1.5, 2.5], tope: 2.5, G: 0.45, candidatos: { A: [C('horn67', 0.8), C('chord'), C('magicLight', 0.7, { d: 0.1 }), C('bells', 0.5, { max: 2.2 })], B: [C('horn32', 0.8), C('powerUp'), C('twinkle', 0.7, { d: 0.1 })], C: [C('chord'), C('horn32', 0.6), C('horn67', 0.6)], D: [C('gameEntry'), C('confetti', 0.8), C('horn67', 0.5)], E: [C('powerUp'), C('arcPower', 0.7, { max: 1.8 }), C('chord', 0.8), C('bells', 0.5, { max: 2 })] } },
  pais: { dura: [1, 2.2], tope: 2, G: 0.3, candidatos: { A: [C('gameEntry'), C('twinkle', 0.8, { d: 0.1, max: 1.5 })], B: [C('plucks'), C('twinkle', 0.8, { d: 0.05 })], C: [C('pop'), C('kalimba', 0.8), C('xylo', 0.7, { d: 0.12 })], D: [C('coins'), C('plucks', 0.8), C('bells', 0.35, { max: 1.5, antes: 0.1 })], E: [C('confetti', 0.9), C('pop', 0.8)] } },
  apertura: { dura: [1.5, 2.5], tope: 2.4, G: 0.8, candidatos: { A: [C('gameEntry'), C('twinkle', 0.8, { d: 0.1, max: 1.7 }), C('bells', 0.3, { max: 2, antes: 0.1 })], B: [C('confetti'), C('plucks', 0.8, { d: 0.15 }), C('bells', 0.5, { max: 2 })], C: [C('musicBox', 0.8, { max: 2 }), C('kalimba', 0.8, { d: 0.1 }), C('twinkle', 0.7, { d: 0.25 })], D: [C('powerUp', 0.9), C('plucks', 0.8, { d: 0.1 }), C('chord', 0.4, { max: 1.8 })], E: [C('xylo'), C('twinkle', 0.8, { d: 0.12 }), C('gameEntry', 0.8, { d: 0.2 })] } },
}

const PESO_MAXIMO = { clic: 20, vuelo: 30, brillo: 40, redoble: 70, medalla: 80, coleccion: 80, emblema: 80, maravilla: 80, pais: 80, apertura: 80 }

const indice = await indiceCompleto()
const fuentes = {}
const usadas = new Set()
const recetas = [
  ...Object.values(RECETAS).flatMap((r) => Object.values(r.candidatos).flat()),
  ...Object.values(MEDALLAS).flatMap((m) => m.niveles.flat()),
]
for (const c of recetas) usadas.add(c.f)
console.log('Bajando', usadas.size, 'archivos de Sonniss (solo esos)…')
for (const clave of usadas) {
  const e = indice.find((x) => /\.wav$/i.test(x.nombre) && x.nombre.includes(FUENTES[clave]))
  if (!e) throw new Error('no está en el índice: ' + FUENTES[clave])
  const dest = path.join(TEMP, `${clave}.wav`)
  if (!fs.existsSync(dest)) await bajarArchivo(e, dest)
  const pcm = decodificar(dest)
  const analisis = analizar(pcm)
  const biblioteca = e.nombre.split('/')[0]
  fuentes[clave] = { pcm, analisis, nombre: e.nombre.split('/').pop(), biblioteca }
  const mala = []
  if (analisis.clipping > 0.002) mala.push(`clipping ${(analisis.clipping * 100).toFixed(2)} %`)
  if (analisis.silencioDelante > 0.6) mala.push(`silencio delante ${analisis.silencioDelante.toFixed(2)} s`)
  if (analisis.ruido > 0.2) mala.push(`ruido de fondo ${analisis.ruido.toFixed(2)}`)
  fuentes[clave].mala = mala
  console.log(`  ${clave.padEnd(14)} ${analisis.dura.toFixed(2)} s · pico en ${analisis.tPico.toFixed(2)} s · delante ${analisis.silencioDelante.toFixed(2)} s${mala.length ? ' · DESCARTABLE: ' + mala.join(', ') : ''}`)
}

const manifiesto = {}
const registro = (id, letra, nombre, capas, s, bytes, extra = {}) => {
  const a = analizar(s)
  let iMax = 0
  for (let i = 0; i < s.length; i++) if (Math.abs(s[i]) > Math.abs(s[iMax])) iMax = i
  manifiesto[id] ??= {}
  manifiesto[id][letra] = {
    nombre,
    fuentes: [...new Set(capas.map((c) => `${fuentes[c.f].biblioteca} · ${fuentes[c.f].nombre.replace(/\.wav$/i, '')}`))],
    licencia: 'Sonniss GDC Game Audio Bundle 2026: uso comercial, sin citar al autor',
    dura: Math.round(a.dura * 1000) / 1000,
    golpe: Math.round((iMax / SR) * 1000) / 1000,
    bytes,
    ...extra,
  }
}

let total = 0
const descartados = []
for (const [momento, r] of Object.entries(RECETAS)) {
  for (const [letra, capas] of Object.entries(r.candidatos)) {
    const malas = capas.flatMap((c) => fuentes[c.f].mala.map((m) => `${c.f}: ${m}`))
    let s = normalizar(componer(capas, fuentes, r.G, r.tope))
    if (momento === 'clic' || momento === 'vuelo') s = fundidoFinal(s, 0.03)
    const a = analizar(s)
    if (a.dura < r.dura[0] || a.dura > r.dura[1] + 0.05) malas.push(`dura ${a.dura.toFixed(2)} s (fuera de ${r.dura.join(' a ')})`)
    if (malas.length) {
      descartados.push(`${momento}_${letra}: ${malas.join('; ')}`)
      continue
    }
    const destino = path.join(SALIDA, `${momento}_${letra}.m4a`)
    const dec = terminar(s, destino, momento === 'clic' ? 64 : 80)
    const bytes = fs.statSync(destino).size
    if (bytes > PESO_MAXIMO[momento] * 1024) {
      descartados.push(`${momento}_${letra}: pesa ${(bytes / 1024).toFixed(0)} KB (más de ${PESO_MAXIMO[momento]} KB)`)
      fs.rmSync(destino)
      continue
    }
    total += bytes
    registro(momento, letra, momento, capas, dec, bytes)
  }
}
for (const [letra, m] of Object.entries(MEDALLAS)) {
  for (let nivel = 0; nivel < 4; nivel++) {
    const id = `medalla_${['bronce', 'plata', 'oro', 'diamante'][nivel]}`
    const capas = m.niveles[nivel]
    const malas = capas.flatMap((c) => fuentes[c.f].mala.map((x) => `${c.f}: ${x}`))
    // Cada nivel suena a un poco más que el anterior (bronce < plata < oro < diamante): el nivel sube también el volumen del golpe, además de las capas.
    const s = normalizar(componer(capas, fuentes, 0.4, 2.5), 0.17 * [0.9, 0.96, 1.02, 1.1][nivel])
    const a = analizar(s)
    if (a.dura < 0.9 || a.dura > 2.6) malas.push(`dura ${a.dura.toFixed(2)} s`)
    if (malas.length) {
      descartados.push(`${id}_${letra}: ${malas.join('; ')}`)
      continue
    }
    const destino = path.join(SALIDA, `${id}_${letra}.m4a`)
    const dec = terminar(s, destino)
    const bytes = fs.statSync(destino).size
    if (bytes > PESO_MAXIMO.medalla * 1024) {
      descartados.push(`${id}_${letra}: pesa ${(bytes / 1024).toFixed(0)} KB`)
      fs.rmSync(destino)
      continue
    }
    total += bytes
    registro(id, letra, m.estilo, capas, dec, bytes, { estilo: m.estilo })
  }
}
fs.writeFileSync(`${SALIDA}/manifiesto.json`, JSON.stringify(manifiesto, null, 1) + '\n')
console.log(`\n${Object.values(manifiesto).reduce((n, v) => n + Object.keys(v).length, 0)} candidatos · ${(total / 1024).toFixed(0)} KB en total`)
if (descartados.length) console.log('Descartados sin oírlos (forma de onda / duración / peso):\n  ' + descartados.join('\n  '))
