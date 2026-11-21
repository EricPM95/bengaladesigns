import { useEffect, useRef, type ReactNode } from 'react'
import { duracionTras, limitar, SIN_RETOQUES, sinCambios, type Retoques } from '../../../lib/sonidos/editar'

/**
 * (V36B) EL EDITOR DE UN SONIDO (debajo de una capa o de un sonido de Code, con [Editar]): recortar con dos asas sobre la onda, fundidos, tono (velocidad), quitar graves, brillo, eco, igualar volumen, [Deshacer] y [Volver al original].
 * Solo dibuja y pide cambios (`alCambiar`): el que procesa el sonido (sin tocar nunca el original) es `aplicarRetoques` en `lib/sonidos/editar.ts`.
 */
const ORO = '#C99A44'
const OSCURO = '#1C2230'
const coma = (x: number, d = 2) => x.toFixed(d).replace('.', ',')
const boton = { minHeight: 36, padding: '0 12px', borderRadius: 12, border: '1.5px solid rgba(28,34,48,.2)', background: '#FFFFFF', font: "700 13px 'Geist'", cursor: 'pointer', color: OSCURO } as const

/** Dónde empieza y acaba lo que suena de verdad (quita el silencio de los lados), con 10 ms de margen. */
export function sinSilencio(b: AudioBuffer, umbral = 0.01): { ini: number; fin: number | null } {
  let a = b.length
  let z = 0
  for (let c = 0; c < b.numberOfChannels; c++) {
    const d = b.getChannelData(c)
    for (let i = 0; i < d.length; i++)
      if (Math.abs(d[i]) > umbral) {
        if (i < a) a = i
        break
      }
    for (let i = d.length - 1; i >= 0; i--)
      if (Math.abs(d[i]) > umbral) {
        if (i > z) z = i
        break
      }
  }
  if (a >= z) return { ini: 0, fin: null }
  const margen = Math.round(b.sampleRate * 0.01)
  return { ini: Math.max(0, a - margen) / b.sampleRate, fin: Math.min(b.length, z + margen) / b.sampleRate }
}

function OndaConAsas({ original, r, alCambiar }: { original: AudioBuffer; r: Retoques; alCambiar: (r: Retoques) => void }): ReactNode {
  const lienzo = useRef<HTMLCanvasElement>(null)
  const caja = useRef<HTMLDivElement>(null)
  const dur = original.duration
  const fin = r.fin ?? dur
  useEffect(() => {
    const c = lienzo.current
    const g = c?.getContext('2d')
    if (!c || !g) return
    const W = c.width
    const H = c.height
    g.clearRect(0, 0, W, H)
    const datos = original.getChannelData(0)
    const paso = Math.max(1, Math.floor(datos.length / W))
    g.fillStyle = '#8A6A2C'
    for (let x = 0; x < W; x++) {
      let mn = 1
      let mx = -1
      for (let i = 0; i < paso; i++) {
        const v = datos[x * paso + i] ?? 0
        if (v < mn) mn = v
        if (v > mx) mx = v
      }
      g.fillRect(x, ((1 - mx) / 2) * H, 1, Math.max(1, ((mx - mn) / 2) * H))
    }
    // Lo recortado, apagado.
    g.fillStyle = 'rgba(247,241,228,.8)'
    g.fillRect(0, 0, (r.ini / dur) * W, H)
    g.fillRect((fin / dur) * W, 0, W - (fin / dur) * W, H)
    // La curva de los fundidos sobre la onda (en el tiempo del original: la velocidad los estira o encoge).
    const v = 2 ** (r.semitonos / 12)
    const ent = Math.min(fin - r.ini, (r.entrada_ms / 1000) * v)
    const sal = Math.min(fin - r.ini, (r.salida_ms / 1000) * v)
    g.strokeStyle = '#2A4A94'
    g.lineWidth = 2
    g.beginPath()
    g.moveTo((r.ini / dur) * W, ent > 0 ? H - 2 : 2)
    if (ent > 0) g.lineTo(((r.ini + ent) / dur) * W, 2)
    g.lineTo(((fin - sal) / dur) * W, 2)
    if (sal > 0) g.lineTo((fin / dur) * W, H - 2)
    else g.lineTo((fin / dur) * W, 2)
    g.stroke()
  }, [original, r, dur, fin])

  const arrastrar = (cual: 'ini' | 'fin') => (e: React.PointerEvent) => {
    e.preventDefault()
    const el = e.currentTarget as HTMLElement
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      /* sin captura */
    }
    const mover = (ev: PointerEvent) => {
      const b = caja.current?.getBoundingClientRect()
      if (!b || b.width <= 0) return
      const t = Math.max(0, Math.min(dur, ((ev.clientX - b.left) / b.width) * dur))
      alCambiar(limitar(cual === 'ini' ? { ...r, ini: Math.min(t, fin - 0.02) } : { ...r, fin: Math.max(t, r.ini + 0.02) }, dur))
    }
    const soltar = () => {
      el.removeEventListener('pointermove', mover)
      el.removeEventListener('pointerup', soltar)
      el.removeEventListener('pointercancel', soltar)
    }
    el.addEventListener('pointermove', mover)
    el.addEventListener('pointerup', soltar)
    el.addEventListener('pointercancel', soltar)
  }
  const asa = (cual: 'ini' | 'fin', t: number) => (
    <div
      data-editor-asa={cual}
      role="slider"
      aria-label={cual === 'ini' ? 'Dónde empieza el sonido' : 'Dónde acaba el sonido'}
      aria-valuenow={Math.round(t * 1000) / 1000}
      onPointerDown={arrastrar(cual)}
      style={{ position: 'absolute', top: -4, bottom: -4, left: `calc(${(t / dur) * 100}% - 11px)`, width: 22, cursor: 'ew-resize', touchAction: 'none', display: 'flex', justifyContent: 'center' }}
    >
      <span style={{ width: 4, height: '100%', background: ORO, borderRadius: 2, boxShadow: '0 0 0 1px #fff' }} />
    </div>
  )
  return (
    <div ref={caja} style={{ position: 'relative', height: 64, background: '#F7F1E4', borderRadius: 10 }}>
      <canvas ref={lienzo} data-editor-onda width={600} height={64} style={{ width: '100%', height: 64, borderRadius: 10, display: 'block' }} aria-label="Onda del sonido original con el recorte y los fundidos" />
      {asa('ini', r.ini)}
      {asa('fin', fin)}
    </div>
  )
}

export function EditorDeSonido({ original, retoques, alCambiar, alDeshacer, puedeDeshacer, alVolverAlOriginal, repetirAlCambiar, alMarcarRepetir }: {
  original: AudioBuffer
  retoques: Retoques
  alCambiar: (r: Retoques) => void
  alDeshacer: () => void
  puedeDeshacer: boolean
  alVolverAlOriginal: () => void
  repetirAlCambiar: boolean
  alMarcarRepetir: (v: boolean) => void
}): ReactNode {
  const r = retoques
  const dur = original.duration
  const fin = r.fin ?? dur
  const cambia = (c: Partial<Retoques>) => alCambiar(limitar({ ...r, ...c }, dur))
  const fila = (texto: string, valor: string, control: ReactNode) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', font: "600 12.5px 'Geist'" }}>
      <span style={{ width: 118 }}>{texto}</span>
      <span style={{ flex: 1, minWidth: 150, display: 'flex' }}>{control}</span>
      <b style={{ width: 70, textAlign: 'right', color: '#8A6A2C' }}>{valor}</b>
    </label>
  )
  const barra = (dato: string, min: number, max: number, paso: number, valor: number, alMover: (v: number) => void) => (
    <input type="range" {...{ [`data-editor-${dato}`]: '' }} min={min} max={max} step={paso} value={valor} style={{ width: '100%', minHeight: 36, accentColor: ORO }} onChange={(e) => alMover(Number(e.target.value))} />
  )
  const atajo = (id: string, texto: string, ayuda: string, cambio: () => Partial<Retoques>) => (
    <button key={id} type="button" data-atajo={id} title={ayuda} onClick={() => cambia(cambio())} style={{ ...boton, background: '#FFFFFF', border: '1.5px solid #2A4A94', color: '#2A4A94' }}>
      {texto}
    </button>
  )
  const titulo = (t: string) => <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.12em', color: 'rgba(28,34,48,.5)' }}>{t}</span>
  return (
    <div data-editor-de-sonido style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12, borderRadius: 14, border: '1.5px solid #2A4A94', background: '#F6F8FD' }}>
      {titulo('1 · ATAJOS (UN TOQUE)')}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {atajo('silencio', 'Quitar el silencio', 'Recorta el silencio del principio y del final', () => sinSilencio(original))}
        {atajo('suave', 'Suavizar el final', 'Fundido de salida de 300 ms para que no acabe de golpe', () => ({ salida_ms: 300, entrada_ms: Math.max(r.entrada_ms, 10) }))}
        {atajo('movil', 'Para el altavoz del móvil', 'Quita los graves y iguala el volumen', () => ({ sin_graves: true, igualar: true }))}
        {atajo('premio', 'Más «premio»', 'Un poco de eco y de brillo', () => ({ eco_pct: 12, brillo_db: 2 }))}
      </div>
      {titulo('2 · RECORTAR (ARRASTRA LAS ASAS DORADAS)')}
      <OndaConAsas original={original} r={r} alCambiar={alCambiar} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', font: "600 12.5px 'Geist'" }}>
        <span data-editor-tiempos style={{ color: '#2A4A94' }}>{coma(r.ini)} s – {coma(fin)} s</span>
        <span data-editor-duracion style={{ color: 'rgba(28,34,48,.6)' }}>dura {coma(duracionTras(dur, r))} s (el original, {coma(dur)} s)</span>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', font: "600 12.5px 'Geist'" }}>
        <label>Empieza en <input type="number" data-editor-ini min={0} max={Math.max(0, dur - 0.01)} step={0.01} value={r.ini} onChange={(e) => cambia({ ini: Number(e.target.value) })} style={{ width: 80, minHeight: 36, borderRadius: 8, border: '1.5px solid rgba(28,34,48,.2)', padding: '0 6px' }} /> s</label>
        <label>Acaba en <input type="number" data-editor-fin min={0} max={dur} step={0.01} value={fin} onChange={(e) => cambia({ fin: Number(e.target.value) })} style={{ width: 80, minHeight: 36, borderRadius: 8, border: '1.5px solid rgba(28,34,48,.2)', padding: '0 6px' }} /> s</label>
      </div>
      {titulo('3 · SUAVIZAR Y RETOCAR')}
      {fila('Fundido de entrada', `${r.entrada_ms} ms`, barra('entrada', 0, 2000, 10, r.entrada_ms, (v) => cambia({ entrada_ms: v })))}
      {fila('Fundido de salida', `${r.salida_ms} ms`, barra('salida', 0, 2000, 10, r.salida_ms, (v) => cambia({ salida_ms: v })))}
      {fila('Tono (velocidad)', `${r.semitonos > 0 ? '+' : ''}${r.semitonos} st`, barra('tono', -6, 6, 0.5, r.semitonos, (v) => cambia({ semitonos: v })))}
      <span data-editor-aviso-tono style={{ font: "400 11.5px/1.4 'Geist'", color: 'rgba(28,34,48,.6)' }}>Cambiar el tono sin cambiar la duración no se puede hacer limpio en el navegador: aquí es «velocidad» (más agudo = más rápido y más corto).</span>
      {fila('Brillo (agudos)', `${r.brillo_db > 0 ? '+' : ''}${r.brillo_db} dB`, barra('brillo', -6, 6, 0.5, r.brillo_db, (v) => cambia({ brillo_db: v })))}
      {fila('Eco suave', `${r.eco_pct} %`, barra('eco', 0, 30, 1, r.eco_pct, (v) => cambia({ eco_pct: v })))}
      {titulo('4 · PARA EL MÓVIL')}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, font: "600 12.5px 'Geist'", minHeight: 36 }}>
          <input type="checkbox" role="switch" data-editor-sin-graves checked={r.sin_graves} onChange={(e) => cambia({ sin_graves: e.target.checked })} style={{ width: 20, height: 20, accentColor: ORO }} />
          Quitar graves (por debajo de 150 Hz)
        </label>
        <button type="button" data-editor-igualar aria-pressed={r.igualar} onClick={() => cambia({ igualar: !r.igualar })} style={{ ...boton, background: r.igualar ? OSCURO : '#FFFFFF', color: r.igualar ? '#F3D88F' : OSCURO }}>
          Igualar volumen (pico a −1 dB){r.igualar ? ' ✓' : ''}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" data-editor-deshacer disabled={!puedeDeshacer} onClick={alDeshacer} style={{ ...boton, opacity: puedeDeshacer ? 1 : 0.45 }}>Deshacer</button>
        <button type="button" data-editor-original disabled={sinCambios(r) || JSON.stringify(r) === JSON.stringify(SIN_RETOQUES)} onClick={alVolverAlOriginal} style={{ ...boton, opacity: sinCambios(r) ? 0.45 : 1 }}>Volver al original</button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, font: "600 12.5px 'Geist'", minHeight: 36 }}>
          <input type="checkbox" data-editor-repetir checked={repetirAlCambiar} onChange={(e) => alMarcarRepetir(e.target.checked)} style={{ width: 20, height: 20, accentColor: ORO }} />
          Repetir al cambiar
        </label>
      </div>
      <span style={{ font: "400 11.5px/1.4 'Geist'", color: 'rgba(28,34,48,.55)' }}>El original no se toca: los retoques se aplican encima y se pueden quitar.</span>
    </div>
  )
}
