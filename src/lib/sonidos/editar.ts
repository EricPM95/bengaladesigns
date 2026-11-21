/**
 * (V36B) EDITAR UN SONIDO (solo el estudio de sonidos del administrador): recortar, fundido de entrada y de salida, tono (en realidad VELOCIDAD, ver abajo), quitar graves, brillo, eco suave e igualar volumen.
 *   · El original NUNCA se toca: los retoques se aplican encima (`aplicarRetoques(original, retoques)` da un sonido nuevo) y se pueden quitar o deshacer.
 *   · Todo se hace con `OfflineAudioContext` en el navegador y es DETERMINISTA (el eco usa una «sala» generada con una semilla fija): el mismo original con los mismos retoques da siempre las mismas muestras. Lo que se oye en el estudio
 *     es el mismo sonido que va, ya hecho, en el `.wav` del zip.
 *   · TONO: no se puede cambiar el tono sin cambiar la duración con un proceso sencillo y limpio (haría falta un vocoder de fase, que suena «a robot» en sonidos cortos). Se hace como VELOCIDAD: +12 semitonos = el doble de rápido y una
 *     octava más agudo (la duración se divide por 2^(n/12)). Por eso el rango es de −6 a +6 semitonos.
 *   · IGUALAR VOLUMEN: pone el pico a −1 dB (normalización de pico). Se eligió porque es exacta y repetible en el navegador sin medir sonoridad (LUFS necesita un filtro de ponderación y una ventana de 400 ms que un «pop» de 1 s no llena).
 * Aquí solo hay datos y procesos de audio: sin pantalla.
 */
export interface Retoques {
  /** Segundos desde el principio del archivo donde empieza lo que suena (0 = sin recortar). */
  ini: number
  /** Segundos donde acaba; null = hasta el final. */
  fin: number | null
  entrada_ms: number
  salida_ms: number
  /** De −6 a +6. Es velocidad: cambia también la duración. */
  semitonos: number
  /** Filtro que quita lo que está por debajo de 150 Hz. */
  sin_graves: boolean
  /** Agudos (estante a 4 kHz) de −6 a +6 dB. */
  brillo_db: number
  /** Sala pequeña, de 0 a 30 %. */
  eco_pct: number
  /** Pico a −1 dB. */
  igualar: boolean
}
export const SIN_RETOQUES: Retoques = { ini: 0, fin: null, entrada_ms: 0, salida_ms: 0, semitonos: 0, sin_graves: false, brillo_db: 0, eco_pct: 0, igualar: false }
export const PICO_IGUALADO = 10 ** (-1 / 20)
export const COLA_DEL_ECO_S = 0.45

const entre = (x: number, a: number, b: number): number => Math.min(b, Math.max(a, Number.isFinite(x) ? x : a))
/** Los retoques dentro de sus límites (el recorte, dentro del archivo). Pura. */
export function limitar(r: Partial<Retoques>, duracion: number): Retoques {
  const base = { ...SIN_RETOQUES, ...r }
  const ini = entre(base.ini, 0, Math.max(0, duracion - 0.01))
  const fin = base.fin === null || base.fin === undefined || base.fin >= duracion - 1e-6 ? null : entre(base.fin, ini + 0.01, duracion)
  return {
    ini: Math.round(ini * 1000) / 1000,
    fin: fin === null ? null : Math.round(fin * 1000) / 1000,
    entrada_ms: Math.round(entre(base.entrada_ms, 0, 2000)),
    salida_ms: Math.round(entre(base.salida_ms, 0, 2000)),
    semitonos: Math.round(entre(base.semitonos, -6, 6) * 2) / 2,
    sin_graves: Boolean(base.sin_graves),
    brillo_db: Math.round(entre(base.brillo_db, -6, 6) * 2) / 2,
    eco_pct: Math.round(entre(base.eco_pct, 0, 30)),
    igualar: Boolean(base.igualar),
  }
}
export const sinCambios = (r: Retoques): boolean => JSON.stringify(r) === JSON.stringify(SIN_RETOQUES)

/** Cuánto dura el sonido tras los retoques (sin la cola del eco). Pura. */
export function duracionTras(duracionOriginal: number, r: Retoques): number {
  const largo = (r.fin ?? duracionOriginal) - r.ini
  return largo / 2 ** (r.semitonos / 12)
}
/** Dónde cae ahora el golpe de un sonido (segundos dentro del archivo) tras recortar y cambiar la velocidad. Pura. */
export function golpeTras(golpe: number, r: Retoques): number {
  return Math.max(0, golpe - r.ini) / 2 ** (r.semitonos / 12)
}

/** Un trozo del sonido (de `ini` a `fin` segundos). */
export function recortar(b: AudioBuffer, ini: number, fin: number | null): AudioBuffer {
  const a = Math.max(0, Math.round(ini * b.sampleRate))
  const z = Math.min(b.length, fin === null ? b.length : Math.round(fin * b.sampleRate))
  const largo = Math.max(1, z - a)
  const salida = new AudioBuffer({ numberOfChannels: b.numberOfChannels, length: largo, sampleRate: b.sampleRate })
  for (let c = 0; c < b.numberOfChannels; c++) salida.copyToChannel(b.getChannelData(c).subarray(a, a + largo), c)
  return salida
}

export function picoDe(b: AudioBuffer): number {
  let p = 0
  for (let c = 0; c < b.numberOfChannels; c++) {
    const d = b.getChannelData(c)
    for (let i = 0; i < d.length; i++) {
      const v = Math.abs(d[i])
      if (v > p) p = v
    }
  }
  return p
}

/** La «sala pequeña» del eco: ruido que se apaga solo, con una semilla fija (siempre igual). */
function salaPequena(ctx: BaseAudioContext, canales: number): AudioBuffer {
  const largo = Math.round(ctx.sampleRate * 0.4)
  const sala = ctx.createBuffer(canales, largo, ctx.sampleRate)
  for (let c = 0; c < canales; c++) {
    const d = sala.getChannelData(c)
    let s = 12345 + c * 777
    for (let i = 0; i < largo; i++) {
      s = (s * 1664525 + 1013904223) >>> 0
      d[i] = ((s / 4294967296) * 2 - 1) * Math.exp((-i / ctx.sampleRate) / 0.07)
    }
  }
  return sala
}

/** El sonido con los retoques aplicados (un sonido nuevo; el original no cambia). Sin retoques, el mismo original. */
export async function aplicarRetoques(original: AudioBuffer, retoques: Partial<Retoques>): Promise<AudioBuffer> {
  const r = limitar(retoques, original.duration)
  if (sinCambios(r)) return original
  const sr = original.sampleRate
  const canales = Math.min(2, original.numberOfChannels)
  const base = r.ini > 0 || r.fin !== null ? recortar(original, r.ini, r.fin) : original
  const velocidad = 2 ** (r.semitonos / 12)
  const cola = r.eco_pct > 0 ? COLA_DEL_ECO_S : 0
  const largo = Math.max(2, Math.ceil((base.duration / velocidad + cola) * sr))
  const ctx = new OfflineAudioContext(canales, largo, sr)
  const fuente = ctx.createBufferSource()
  fuente.buffer = base
  fuente.playbackRate.value = velocidad
  let nodo: AudioNode = fuente
  if (r.sin_graves) {
    const f = ctx.createBiquadFilter()
    f.type = 'highpass'
    f.frequency.value = 150
    f.Q.value = 0.707
    nodo.connect(f)
    nodo = f
  }
  if (r.brillo_db !== 0) {
    const f = ctx.createBiquadFilter()
    f.type = 'highshelf'
    f.frequency.value = 4000
    f.gain.value = r.brillo_db
    nodo.connect(f)
    nodo = f
  }
  const final = ctx.createGain()
  const total = largo / sr
  final.gain.setValueAtTime(r.entrada_ms > 0 ? 0 : 1, 0)
  if (r.entrada_ms > 0) final.gain.linearRampToValueAtTime(1, Math.min(total, r.entrada_ms / 1000))
  if (r.salida_ms > 0) {
    const inicio = Math.max(r.entrada_ms / 1000, total - r.salida_ms / 1000)
    final.gain.setValueAtTime(1, inicio)
    final.gain.linearRampToValueAtTime(0, total)
  }
  nodo.connect(final)
  if (r.eco_pct > 0) {
    const sala = ctx.createConvolver()
    sala.normalize = true
    sala.buffer = salaPequena(ctx, canales)
    const mojado = ctx.createGain()
    mojado.gain.value = (r.eco_pct / 100) * 1.6
    nodo.connect(sala)
    sala.connect(mojado)
    mojado.connect(final)
  }
  final.connect(ctx.destination)
  fuente.start(0)
  const hecho = await ctx.startRendering()
  // El fundido de salida acaba en silencio exacto; igualar = pico a −1 dB.
  for (let c = 0; c < hecho.numberOfChannels; c++) {
    const d = hecho.getChannelData(c)
    if (r.salida_ms > 0) d[d.length - 1] = 0
  }
  if (r.igualar) {
    const p = picoDe(hecho)
    if (p > 1e-6) {
      const k = PICO_IGUALADO / p
      for (let c = 0; c < hecho.numberOfChannels; c++) {
        const d = hecho.getChannelData(c)
        for (let i = 0; i < d.length; i++) d[i] *= k
      }
    }
  }
  return hecho
}

/** El sonido como un .wav de 16 bits (hasta 2 canales). Lo que va en el zip. */
export function codificarWav(b: AudioBuffer): Uint8Array {
  const canales = Math.min(2, b.numberOfChannels)
  const datos = canales * b.length * 2
  const salida = new Uint8Array(44 + datos)
  const v = new DataView(salida.buffer)
  const t = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i))
  }
  t(0, 'RIFF')
  v.setUint32(4, 36 + datos, true)
  t(8, 'WAVE')
  t(12, 'fmt ')
  v.setUint32(16, 16, true)
  v.setUint16(20, 1, true)
  v.setUint16(22, canales, true)
  v.setUint32(24, b.sampleRate, true)
  v.setUint32(28, b.sampleRate * canales * 2, true)
  v.setUint16(32, canales * 2, true)
  v.setUint16(34, 16, true)
  t(36, 'data')
  v.setUint32(40, datos, true)
  const canal = Array.from({ length: canales }, (_, c) => b.getChannelData(c))
  let p = 44
  for (let i = 0; i < b.length; i++)
    for (let c = 0; c < canales; c++) {
      const x = Math.max(-1, Math.min(1, canal[c][i]))
      v.setInt16(p, Math.round(x < 0 ? x * 32768 : x * 32767), true)
      p += 2
    }
  return salida
}

const coma = (x: number, d = 2) => x.toFixed(d).replace('.', ',')
/** Lo que se ha retocado, en palabras (para «Lo elegido»). Vacío si no hay retoques. */
export function descripcionDe(r: Retoques): string {
  const p: string[] = []
  if (r.ini > 0 || r.fin !== null) p.push(`recortado ${coma(r.ini)} s – ${r.fin === null ? 'final' : `${coma(r.fin)} s`}`)
  if (r.entrada_ms > 0) p.push(`fundido de entrada ${r.entrada_ms} ms`)
  if (r.salida_ms > 0) p.push(`fundido de salida ${r.salida_ms} ms`)
  if (r.semitonos !== 0) p.push(`${r.semitonos > 0 ? '+' : '−'}${Math.abs(r.semitonos)} semitonos (velocidad)`)
  if (r.sin_graves) p.push('sin graves')
  if (r.brillo_db !== 0) p.push(`brillo ${r.brillo_db > 0 ? '+' : '−'}${Math.abs(r.brillo_db)} dB`)
  if (r.eco_pct > 0) p.push(`eco ${r.eco_pct} %`)
  if (r.igualar) p.push('igualado a −1 dB de pico')
  return p.join(' · ')
}
