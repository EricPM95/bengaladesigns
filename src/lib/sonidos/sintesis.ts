/**
 * (V29) LOS SONIDOS PEQUEÑOS, GENERADOS EN EL MÓVIL con Web Audio (nada que descargar): el toque, el «clic» de cada pieza, el redoble que dura lo que dura el giro, el brillo, el «vuuush» del vuelo, el tic de los
 * números que suben y la campanita del aviso. Cálidos y de app cuidada (notas suaves, campanitas, madera, con un eco corto), nunca a maquinita de 8 bits. Cada uno tiene tres versiones (A, B y C) para que Eric elija
 * escuchándolas (página de sonidos del administrador). Todos reciben el momento exacto (`t0`, segundos del reloj de audio) en que tienen que sonar: lo decide la partitura, no el sonido.
 */
export type Version = 'A' | 'B' | 'C'
export type SonidoSintetico = 'toque' | 'clic' | 'redoble' | 'brillo' | 'vuelo' | 'tic' | 'campanita'
export const SONIDOS_SINTETICOS: SonidoSintetico[] = ['toque', 'clic', 'redoble', 'brillo', 'vuelo', 'tic', 'campanita']
export const VERSIONES: Version[] = ['A', 'B', 'C']

const eco = new WeakMap<BaseAudioContext, ConvolverNode>()
/** Un eco corto y suave (la «sala» pequeña): una respuesta de ruido que se apaga rápido. Una sola por contexto. */
function salaPequena(ctx: BaseAudioContext): ConvolverNode {
  const hecha = eco.get(ctx)
  if (hecha) return hecha
  const largo = Math.floor(ctx.sampleRate * 0.55)
  const imp = ctx.createBuffer(2, largo, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = imp.getChannelData(c)
    for (let i = 0; i < largo; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / largo, 2.6)
  }
  const sala = ctx.createConvolver()
  sala.buffer = imp
  eco.set(ctx, sala)
  return sala
}

/** El destino de un sonido: el volumen directo y un poco de eco. */
function salida(ctx: BaseAudioContext, destino: AudioNode, vol: number, eco_ = 0.22): AudioNode {
  const g = ctx.createGain()
  g.gain.value = vol
  g.connect(destino)
  if (eco_ > 0) {
    const s = ctx.createGain()
    s.gain.value = eco_
    g.connect(s)
    s.connect(salaPequena(ctx))
    salaPequena(ctx).connect(destino)
  }
  return g
}

/** Una nota suave con su forma de volumen (sube enseguida y se apaga como una campanita). */
function nota(ctx: BaseAudioContext, out: AudioNode, hz: number, t0: number, dura: number, tipo: OscillatorType, pico: number, hz2?: number) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = tipo
  o.frequency.setValueAtTime(hz, t0)
  if (hz2) o.frequency.exponentialRampToValueAtTime(hz2, t0 + dura)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(Math.max(pico, 0.0002), t0 + 0.006)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dura)
  o.connect(g)
  g.connect(out)
  o.start(t0)
  o.stop(t0 + dura + 0.03)
}

/** Un soplo de ruido filtrado (para el clic, el vuelo y el redoble). */
function soplo(ctx: BaseAudioContext, out: AudioNode, t0: number, dura: number, f0: number, f1: number, q: number, pico: number, subida = 0.02) {
  const n = Math.max(1, Math.floor(ctx.sampleRate * (dura + 0.05)))
  const b = ctx.createBuffer(1, n, ctx.sampleRate)
  const d = b.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
  const s = ctx.createBufferSource()
  s.buffer = b
  const f = ctx.createBiquadFilter()
  f.type = 'bandpass'
  f.Q.value = q
  f.frequency.setValueAtTime(f0, t0)
  f.frequency.exponentialRampToValueAtTime(f1, t0 + dura)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(Math.max(pico, 0.0002), t0 + Math.min(subida, dura * 0.5))
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dura)
  s.connect(f)
  f.connect(g)
  g.connect(out)
  s.start(t0)
  s.stop(t0 + dura + 0.05)
}

/**
 * Hace sonar un sonido pequeño en el instante `t0` del reloj de audio. `dura` solo cuenta en los que duran lo que dura la animación (el redoble y el vuelo). `vol` de 0 a 1.
 * Devuelve cuánto dura de verdad (segundos), para que el motor sepa cuándo ha acabado.
 */
export function tocarSintetico(ctx: BaseAudioContext, destino: AudioNode, id: SonidoSintetico, version: Version, t0: number, vol = 1, dura = 0.4): number {
  const v = version === 'A' ? 0 : version === 'B' ? 1 : 2
  switch (id) {
    case 'toque': {
      const out = salida(ctx, destino, 0.5 * vol, 0.18)
      const f = [520, 330, 660][v]!
      nota(ctx, out, f, t0, 0.18, v === 1 ? 'triangle' : 'sine', 0.9, v === 1 ? f * 0.6 : undefined)
      nota(ctx, out, f * (v === 2 ? 3 : 2), t0, 0.1, 'sine', 0.25)
      return 0.3
    }
    case 'clic': {
      const out = salida(ctx, destino, 0.55 * vol, 0.1)
      soplo(ctx, out, t0, 0.05, [2600, 1500, 3800][v]!, [1800, 900, 2600][v]!, 4, 0.9, 0.003)
      nota(ctx, out, [900, 640, 1250][v]!, t0, 0.07, v === 1 ? 'triangle' : 'sine', 0.55)
      return 0.15
    }
    case 'redoble': {
      const out = salida(ctx, destino, 0.5 * vol, 0.15)
      if (v === 0) {
        // Golpecitos suaves cada vez más seguidos y más agudos, hasta llegar al momento del golpe.
        let t = 0
        let paso = 0.17
        let k = 0
        while (t < dura - 0.04) {
          const f = 180 * Math.pow(2, (t / dura) * 1.6)
          nota(ctx, out, f, t0 + t, 0.09, 'triangle', 0.35 + 0.65 * (t / dura), f * 0.7)
          paso = Math.max(0.035, paso * 0.88)
          t += paso
          k++
          if (k > 80) break
        }
      } else if (v === 1) {
        // Una subida de aire con un tono que sube mientras dura el giro.
        soplo(ctx, out, t0, dura, 300, 3200, 1.2, 0.5 * (0.6 + 0.4), dura * 0.9)
        nota(ctx, out, 220, t0, dura, 'sine', 0.35, 880)
      } else {
        // Un colchón de campanitas que tiemblan y suben (trémolo que se acelera).
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        const lfo = ctx.createOscillator()
        const lg = ctx.createGain()
        o.type = 'sine'
        o.frequency.setValueAtTime(330, t0)
        o.frequency.exponentialRampToValueAtTime(990, t0 + dura)
        lfo.frequency.setValueAtTime(5, t0)
        lfo.frequency.exponentialRampToValueAtTime(26, t0 + dura)
        lg.gain.value = 0.35
        g.gain.setValueAtTime(0.0001, t0)
        g.gain.exponentialRampToValueAtTime(0.45, t0 + dura * 0.9)
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dura + 0.04)
        lfo.connect(lg)
        lg.connect(g.gain)
        o.connect(g)
        g.connect(out)
        o.start(t0)
        lfo.start(t0)
        o.stop(t0 + dura + 0.06)
        lfo.stop(t0 + dura + 0.06)
      }
      return dura + 0.06
    }
    case 'brillo': {
      const out = salida(ctx, destino, 0.4 * vol, 0.3)
      const acorde = [[2093, 2637, 3136], [1760, 2349, 2960], [2349, 2794, 3520]][v]!
      acorde.forEach((hz, i) => nota(ctx, out, hz, t0 + i * 0.045, 0.7 - i * 0.1, 'sine', 0.5 - i * 0.1))
      return 0.9
    }
    case 'vuelo': {
      const out = salida(ctx, destino, 0.45 * vol, 0.12)
      if (v === 0) soplo(ctx, out, t0, dura, 500, 2600, 2.2, 0.8, dura * 0.5)
      else if (v === 1) soplo(ctx, out, t0, dura, 2400, 600, 1.6, 0.8, dura * 0.35)
      else {
        soplo(ctx, out, t0, dura, 700, 2000, 4, 0.7, dura * 0.5)
        nota(ctx, out, 400, t0, dura, 'sine', 0.18, 1200)
      }
      return dura + 0.05
    }
    case 'tic': {
      const out = salida(ctx, destino, 0.35 * vol, 0.05)
      nota(ctx, out, [1800, 1300, 2300][v]!, t0, 0.025, v === 1 ? 'triangle' : 'sine', 0.6)
      return 0.06
    }
    case 'campanita': {
      const out = salida(ctx, destino, 0.45 * vol, 0.28)
      const [a, b] = [[1568, 2093], [1319, 1760], [1760, 2349]][v]!
      nota(ctx, out, a!, t0, 0.55, 'sine', 0.7)
      nota(ctx, out, b!, t0 + 0.11, 0.7, 'sine', 0.6)
      return 0.9
    }
  }
}
