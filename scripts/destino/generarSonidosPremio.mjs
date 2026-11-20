// (V29) LOS SONIDOS DE PREMIO, HECHOS POR CÓDIGO EN EL PC (decisión de Eric: no se compra nada). Síntesis por capas, sin ninguna muestra de nadie:
//   · campanas (parciales no armónicos que se apagan solos), un arpegio de celesta o arpa que SUBE hasta el golpe, un brillo por encima, un golpe grave suave y una reverberación.
//   · el GOLPE FINAL cae en un instante conocido del archivo (`golpe`, en `manifiesto.json`): el motor arranca el archivo antes para que ese golpe caiga en el milisegundo en que acaba la animación.
//   · cada nivel suena a más: bronce < plata < oro < diamante (más notas, más campanas en el acorde, más brillo, golpe más hondo, cola más larga).
//   · el mismo volumen en todos (se normaliza a la misma sonoridad) y tres versiones de cada uno: A (campanas y celesta), B (arpa cálida), C (cristal).
// Formato: WAV mono de 16 bits a 11.025 Hz (menos de 40 KB cada uno; no hay codificador m4a/mp3 sin instalar paquetes). Se descargan solo al hacer falta, desde Vercel con caché larga, nunca desde Supabase.
//   node scripts/destino/generarSonidosPremio.mjs
import fs from 'node:fs'

const SR = 11025
const SALIDA = 'public/sonidos/premio'
fs.mkdirSync(SALIDA, { recursive: true })

// azar con semilla (siempre salen los mismos archivos)
let semilla = 20261120
const azar = () => {
  semilla = (semilla * 1664525 + 1013904223) >>> 0
  return semilla / 4294967296
}

const mezclar = (buf, t0, muestras, ganancia = 1) => {
  const i0 = Math.max(0, Math.round(t0 * SR))
  for (let i = 0; i < muestras.length; i++) {
    if (i0 + i >= buf.length) break
    buf[i0 + i] += muestras[i] * ganancia
  }
}
const generar = (dur, fn) => {
  const n = Math.max(1, Math.round(dur * SR))
  const s = new Float32Array(n)
  for (let i = 0; i < n; i++) s[i] = fn(i / SR, i)
  return s
}

/** Una campana: parciales no armónicos que se apagan cada uno a su ritmo. */
const campana = (hz, dur, brillo = 1, ataque = 0.004) => {
  const parciales = [[1, 1, 1], [2.0, 0.42, 0.75], [2.76, 0.3 * brillo, 0.55], [4.07, 0.16 * brillo, 0.38], [5.4, 0.1 * brillo, 0.3], [8.9, 0.05 * brillo, 0.2]]
  return generar(dur, (t) => {
    let v = 0
    for (const [r, a, d] of parciales) v += Math.sin(2 * Math.PI * hz * r * t) * a * Math.exp((-t * 7.5) / (dur * d + 0.2))
    return v * Math.min(1, t / ataque)
  })
}
/** Una celesta: seno con su segunda armónica y un golpecito al principio. */
const celesta = (hz, dur) => generar(dur, (t) => (Math.sin(2 * Math.PI * hz * t) + 0.35 * Math.sin(2 * Math.PI * hz * 2 * t) * Math.exp(-t * 14)) * Math.exp(-t * 5.2) * Math.min(1, t / 0.003))
/** Un arpa: pulso de cuerda pulsada (varios armónicos que se apagan más rápido cuanto más agudos). */
const arpa = (hz, dur) => generar(dur, (t) => {
  let v = 0
  for (let h = 1; h <= 6; h++) v += (Math.sin(2 * Math.PI * hz * h * t) / h) * Math.exp(-t * (3.2 + h * 2.4))
  return v * Math.min(1, t / 0.002)
})
/** Cristal: modulación de frecuencia suave (sonido de vaso). */
const cristal = (hz, dur) => generar(dur, (t) => {
  const mod = Math.sin(2 * Math.PI * hz * 3.5 * t) * 1.6 * Math.exp(-t * 6)
  return Math.sin(2 * Math.PI * hz * t + mod) * Math.exp(-t * 4.2) * Math.min(1, t / 0.004)
})
/** El golpe grave y suave: un seno que baja de tono y se apaga. */
const golpeGrave = (dur, hz0, hz1) => {
  let fase = 0
  return generar(dur, (t) => {
    const hz = hz1 + (hz0 - hz1) * Math.exp(-t * 16)
    fase += (2 * Math.PI * hz) / SR
    return Math.sin(fase) * Math.exp(-t * 7.5) * Math.min(1, t / 0.004)
  })
}
/** Un puñado de chispas agudas, cortas y desordenadas por encima. */
const chispas = (buf, t0, n, dur, nivel) => {
  for (let k = 0; k < n; k++) {
    const hz = 3000 + azar() * 1800
    const t = t0 + (k / n) * dur + azar() * 0.04
    mezclar(buf, t, generar(0.09, (u) => Math.sin(2 * Math.PI * hz * u) * Math.exp(-u * 45)), nivel * (0.5 + azar() * 0.5))
  }
}
/** Reverberación suave (peines + pasa-todo), con poco volumen de mezcla. */
const reverb = (entrada, mezcla = 0.28, cola = 1) => {
  const peines = [[1051, 0.78], [1223, 0.76], [1399, 0.74], [1559, 0.72]].map(([d, g]) => [Math.round((d * SR) / 22050), g * (0.9 + 0.1 * cola)])
  const salida = new Float32Array(entrada.length)
  for (const [d, g] of peines) {
    const linea = new Float32Array(d)
    let p = 0
    for (let i = 0; i < entrada.length; i++) {
      const y = entrada[i] + linea[p] * g
      linea[p] = y
      p = (p + 1) % d
      salida[i] += y * 0.25
    }
  }
  // pasa-todo
  for (const d0 of [225, 556]) {
    const d = Math.round((d0 * SR) / 22050)
    const linea = new Float32Array(d)
    let p = 0
    for (let i = 0; i < salida.length; i++) {
      const x = salida[i]
      const y = linea[p]
      linea[p] = x + y * 0.5
      salida[i] = y - x * 0.5
      p = (p + 1) % d
    }
  }
  const sec = new Float32Array(entrada.length)
  for (let i = 0; i < entrada.length; i++) sec[i] = entrada[i] * (1 - mezcla * 0.4) + salida[i] * mezcla
  return sec
}

// Las notas (Hz) de la escala pentatónica mayor, de 3 en 3 octavas, desde la base de cada versión.
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21]
const hzDe = (base, semitonos) => base * Math.pow(2, semitonos / 12)

/**
 * Una pieza de premio. `nivel` 1 a 5 (cuánto suena a más); `golpe` el instante del golpe final; `dur` lo que dura el archivo; `version` A, B o C; `misterio` (emblema) baja una nota para un color más misterioso.
 */
function premio({ nivel, golpe, dur, version, base, notas, misterio = false, aire = false }) {
  const buf = new Float32Array(Math.round(dur * SR))
  const instr = version === 'A' ? celesta : version === 'B' ? arpa : cristal
  const b = hzDe(base, version === 'B' ? -5 : version === 'C' ? 2 : 0)
  // 1. el arpegio que sube hasta el golpe (`notas` notas, la última justo antes)
  const paso = Math.min(0.11, (golpe - 0.04) / notas)
  for (let k = 0; k < notas; k++) {
    const t = golpe - 0.03 - (notas - k) * paso
    const semi = PENTA[Math.min(k, PENTA.length - 1)] - (misterio && k % 2 ? 1 : 0)
    mezclar(buf, Math.max(0, t), instr(hzDe(b, semi), 0.55), 0.22 + 0.16 * (k / notas))
  }
  // 2. el golpe: acorde de campanas (más campanas cuanto más nivel) + golpe grave
  const acorde = [0, 7, 12, 16, 19, 24].slice(0, 1 + nivel)
  acorde.forEach((s, i) => mezclar(buf, golpe + i * 0.004, campana(hzDe(b, s), dur - golpe, 0.7 + 0.18 * nivel), (aire ? 0.8 : 1.1) / (1 + i * 0.3)))
  mezclar(buf, golpe, golpeGrave(0.5, 150 - 6 * nivel, 52 + 3 * nivel), 0.7 + 0.12 * nivel)
  // 3. el brillo por encima, que dura más en los niveles altos
  chispas(buf, golpe + 0.12, 4 + nivel * 6, 0.3 + nivel * 0.16, 0.1 + 0.05 * nivel)
  // 4. la reverberación
  return reverb(buf, 0.22 + 0.04 * nivel, 0.7 + 0.1 * nivel)
}

/** Normaliza a la misma sonoridad (RMS) y limita suave, para que todos suenen igual de fuerte. */
function normalizar(s, golpe) {
  const i0 = Math.max(0, Math.floor((golpe - 0.4) * SR))
  const i1 = Math.min(s.length, Math.floor((golpe + 0.6) * SR))
  let suma = 0
  for (let i = i0; i < i1; i++) suma += s[i] * s[i]
  const rms = Math.sqrt(suma / Math.max(1, i1 - i0))
  const g = 0.16 / Math.max(rms, 1e-6)
  const fundido = Math.round(0.05 * SR)
  for (let i = 0; i < s.length; i++) {
    let v = Math.tanh(s[i] * g * 1.1) * 0.92
    if (i > s.length - fundido) v *= (s.length - i) / fundido
    s[i] = v
  }
  return s
}

function aWav(s) {
  const n = s.length
  const buf = Buffer.alloc(44 + n * 2)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + n * 2, 4)
  buf.write('WAVEfmt ', 8)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(SR, 24)
  buf.writeUInt32LE(SR * 2, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(n * 2, 40)
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(s[i] * 32767))), 44 + i * 2)
  return buf
}

// id → cómo es. `golpe` es el instante del golpe final dentro del archivo (el arpegio lo prepara).
const PREMIOS = {
  medalla_bronce: { nivel: 1, golpe: 0.5, dur: 1.45, base: 523.25, notas: 3 },
  medalla_plata: { nivel: 2, golpe: 0.6, dur: 1.55, base: 523.25, notas: 4 },
  medalla_oro: { nivel: 3, golpe: 0.7, dur: 1.7, base: 523.25, notas: 5 },
  medalla_diamante: { nivel: 5, golpe: 0.8, dur: 1.8, base: 523.25, notas: 6 },
  coleccion: { nivel: 3, golpe: 0.7, dur: 1.65, base: 587.33, notas: 5 },
  emblema: { nivel: 4, golpe: 0.75, dur: 1.75, base: 466.16, notas: 5, misterio: true },
  maravilla: { nivel: 5, golpe: 0.85, dur: 1.8, base: 440, notas: 6 },
  pais: { nivel: 2, golpe: 0.55, dur: 1.4, base: 659.25, notas: 3, aire: true },
  apertura: { nivel: 2, golpe: 0.9, dur: 1.8, base: 587.33, notas: 3, aire: true },
}

const manifiesto = {}
let total = 0
for (const [id, p] of Object.entries(PREMIOS)) {
  manifiesto[id] = {}
  for (const version of ['A', 'B', 'C']) {
    semilla = 20261120 + id.length * 31 + version.charCodeAt(0)
    const s = normalizar(premio({ ...p, version }), p.golpe)
    // El golpe del manifiesto es el instante REAL del pico del golpe (la partitura lo hace caer en el milisegundo en que acaba la animación).
    let pico = 0
    let tPico = p.golpe
    for (let i = Math.floor(p.golpe * SR); i < Math.min(s.length, Math.floor((p.golpe + 0.3) * SR)); i++) if (Math.abs(s[i]) > pico) { pico = Math.abs(s[i]); tPico = i / SR }
    const wav = aWav(s)
    fs.writeFileSync(`${SALIDA}/${id}_${version}.wav`, wav)
    manifiesto[id][version] = { golpe: Math.round(tPico * 1000) / 1000, dura: p.dur, bytes: wav.length }
    total += wav.length
  }
}
fs.writeFileSync(`${SALIDA}/manifiesto.json`, JSON.stringify(manifiesto, null, 1) + '\n')
const mayor = Math.max(...Object.values(manifiesto).flatMap((v) => Object.values(v).map((x) => x.bytes)))
console.log(`${Object.keys(PREMIOS).length * 3} archivos · el mayor ${(mayor / 1024).toFixed(1)} KB · los 27 juntos ${(total / 1024).toFixed(0)} KB · los 9 elegidos (uno por sonido) ~${((total / 3) / 1024).toFixed(0)} KB`)
