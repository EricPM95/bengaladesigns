import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { contextoDeAudioDeLaApp } from '../../lib/sonidos'
import {
  arranqueDelPropio,
  arranqueNatural,
  cargarPremio,
  claveDeSilencio,
  desplazamientoDeCode,
  elegirVersion,
  esperaDeLaAnimacion,
  manifiesto,
  ponerVolumenDe,
  ponerVolumenGeneral,
  versionDe,
  volumenDe,
  volumenGeneral,
  LETRAS,
  type AjusteDeCode,
  type Empieza,
  type EmpiezaCode,
  type Letra,
  type Manifiesto,
  type SonidoPropio,
} from '../../lib/sonidos/motor'
import { ANIMACIONES, animacionDe, archivosDeLaAnimacion, AVISO_DE_LOS_SONIDOS_PROPIOS, duracionDe, golpeDe, lineaDeTiempo, lineaElegida, sintesDeLaAnimacion, type Animacion, type Marca } from '../../lib/sonidos/estudio'
import { partituraDe, type Nota } from '../../lib/sonidos/partituras'
import { aplicarRetoques, codificarWav, descripcionDe, golpeTras, limitar, picoDe, SIN_RETOQUES, sinCambios, type Retoques } from '../../lib/sonidos/editar'
import { EditorDeSonido } from './sonidos/EditorDeSonido'
import {
  AVISO_SIN_ALMACEN,
  borrarGuardado,
  construirZip,
  estadoDesdeJson,
  ESTADO_VACIO,
  guardarEnElNavegador,
  HUELLA_VACIA,
  huellaDe,
  leerEstudioJson,
  type FinalDeSonido,
  leerGuardados,
  type CapaGuardada,
  type EstadoDeAnimacion,
  type Guardado,
  ID_DE_LA_COPIA_DEL_COLISEO,
  migrarColiseoV39B,
} from '../../lib/sonidos/estudioGuardado'
import { leerZip } from '../../lib/sonidos/zip'
import type { VisorApi } from './sonidos/VisorDeAnimacion'
import { useEsAdministrador } from './sonidos/useEsAdministrador'

/**
 * (V29, rehecha en la V34C con el diseño «Panel Jutrip › Logros y sonidos › Sonidos», otra vez en la V35A2 y en la V35B2) EL ESTUDIO DE SONIDOS: /admin/sonidos (o /?admin=sonidos), solo para administradores (la cuenta sale de LOGROS_ADMIN_EMAILS; el servidor lo comprueba).
 *   1. Cada animación se ve DENTRO DE UN MARCO DE IPHONE (393 x 852) tal cual sale en la app, con su partitura de verdad.
 *   2. Cada sonido de Code en su fila: candidatos A a E, [Silenciar], su volumen de 0 a 200 % y (V35B2) MOVERLO: barra de ms, «Empieza…» y [Volver a su sitio]. Arriba, [Silenciar todos los de Code].
 *   3. Los sonidos de Eric y los sonidos de Code de OTRAS animaciones ([+ Añadir un sonido de Code]) son capas que se SUMAN: nombre, volumen, barra de ms, «Empieza…» y [Quitar]. Si algo cae antes del primer fotograma NO se recorta: la animación espera.
 *   4. Una línea de tiempo con una fila por sonido; cada trozo se puede ARRASTRAR con el dedo o el ratón.
 *   5. «Lo elegido»: una línea por animación con todo lo que suena y dónde.
 *   6. (V35B2) [Guardar] por animación (IndexedDB de ESTE navegador, con los archivos de Eric enteros; nunca en un servidor), «Sin guardar», [Eliminar lo guardado], [Descargar todo lo guardado] (zip con LO_ELEGIDO.txt, los archivos y estudio.json) y [Cargar un zip].
 *   Esta página no cambia ningún sonido de la app por sí sola.
 */
const SERIE = "'Instrument Serif',serif"
const ANCHO = 393
const ALTO = 852
const OSCURO = '#1C2230'
const ORO = '#C99A44'
const FONDO_BARRA = '#F1EADC'

const NOMBRE_DE_SONIDO: Record<string, string> = {
  clic: 'clic', vuelo: 'vuelo (vuuush)', brillo: 'brillo', redoble: 'redoble', emblema: 'golpe del emblema', estallido: 'estallido del suspense', brillo_titulo: 'brillo del título', maravilla: 'golpe de las 7 maravillas', coleccion: 'golpe de la colección', pais: 'golpe de país', apertura: 'firma de la apertura',
  medalla_bronce: 'golpe de la medalla de bronce', medalla_plata: 'golpe de la medalla de plata', medalla_oro: 'golpe de la medalla de oro', medalla_diamante: 'golpe de la medalla de diamante',
  toque: 'toque (latidos)', campanita: 'campanita', tic: 'tic',
}
const nombreDe = (id: string) => NOMBRE_DE_SONIDO[id] ?? id
const coma = (x: number, d = 2) => x.toFixed(d).replace('.', ',')
const conSigno = (ms: number) => `${ms >= 0 ? '+' : '−'}${Math.abs(ms)} ms`
const hhmm = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch {
    return ''
  }
}

/** Una capa: un archivo de Eric o un sonido de Code de otra animación. Lleva lo de un sonido propio del motor y lo que hace falta para guardarla. */
type Capa = SonidoPropio & { origen: 'archivo' | 'code'; bytes?: ArrayBuffer; tipoMime?: string; sonido?: string; letra?: Letra; /** (V36B) El sonido SIN retocar (el `buffer` es el ya retocado) y los retoques. */ original?: AudioBuffer; retoques?: Retoques }
/** Todo lo que se toca en UNA animación. */
interface EstadoRT {
  silenciados: string[]
  ajustes: Record<string, AjusteDeCode>
  letras: Record<string, Letra>
  volumenes: Record<string, number>
  capas: Capa[]
  /** (V36B) Retoques de los sonidos de Code (por `archivo_letra`). */
  ediciones: Record<string, Retoques>
}
const VACIO_RT: EstadoRT = { silenciados: [], ajustes: {}, letras: {}, volumenes: {}, capas: [], ediciones: {} }
const claveEd = (id: string, letra: string) => `${id}_${letra}`
interface Procesado {
  buffer: AudioBuffer
  golpe: number
  dura: number
}
const capaAGuardada = (c: Capa): CapaGuardada =>
  c.origen === 'code'
    ? { id: c.id, origen: 'code', nombre: c.nombre, ms: c.ms, vol: c.vol, empieza: c.empieza, sonido: c.sonido, letra: c.letra, retoques: c.retoques && !sinCambios(c.retoques) ? c.retoques : undefined }
    : { id: c.id, origen: 'archivo', nombre: c.nombre, ms: c.ms, vol: c.vol, empieza: c.empieza, archivo: { nombre: c.nombre, tipo: c.tipoMime ?? '', bytes: c.bytes ?? new ArrayBuffer(0) }, retoques: c.retoques && !sinCambios(c.retoques) ? c.retoques : undefined }
const aGuardable = (e: EstadoRT): EstadoDeAnimacion => ({ silenciados: e.silenciados, ajustes: e.ajustes, letras: e.letras, volumenes: e.volumenes, capas: e.capas.map(capaAGuardada), ediciones: e.ediciones })
const huellaRT = (e: EstadoRT) => huellaDe(aGuardable(e))

/** Un sonido de Code de una animación: su clave de silencio y el sitio donde guarda su volumen. */
interface DeCode {
  tipo: 'archivo' | 'sint'
  id: string
  clave: string
  /** Dónde se guarda su volumen (los grabados, por su nombre; los hechos por código, con `s:` delante). */
  claveVolumen: string
}
const deCodeDe = (a: Animacion): DeCode[] => [
  ...archivosDeLaAnimacion(a).map((id) => ({ tipo: 'archivo' as const, id, clave: claveDeSilencio('archivo', id), claveVolumen: id })),
  ...sintesDeLaAnimacion(a).map((id) => ({ tipo: 'sint' as const, id, clave: claveDeSilencio('sint', id), claveVolumen: `s:${id}` })),
]

const boton = { minHeight: 44, minWidth: 44, padding: '0 16px', borderRadius: 12, border: '1.5px solid rgba(28,34,48,.2)', background: '#FFFFFF', font: "700 13.5px 'Geist'", cursor: 'pointer', color: OSCURO } as const
const botonOscuro = { ...boton, background: OSCURO, color: '#F3D88F', border: `1.5px solid ${OSCURO}` } as const
const botonPeq = { ...boton, minHeight: 36, padding: '0 12px' } as const
const etiqueta = { font: "600 10px 'Geist Mono',monospace", letterSpacing: '.12em', color: 'rgba(28,34,48,.5)' } as const

function Triangulo({ t = 11 }: { t?: number }): ReactNode {
  return (
    <svg width={t} height={t} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 4l13 8-13 8z" />
    </svg>
  )
}

/** La onda de un sonido (solo la forma: las rayas van en la línea de tiempo). */
function Onda({ buffer }: { buffer: AudioBuffer }): ReactNode {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const g = c.getContext('2d')
    if (!g) return
    const W = c.width
    const H = c.height
    g.clearRect(0, 0, W, H)
    const datos = buffer.getChannelData(0)
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
  }, [buffer])
  return <canvas ref={ref} data-onda width={300} height={28} style={{ width: '100%', height: '100%', display: 'block' }} aria-label="Onda de tu sonido" />
}

/** (V35B2) Lo que hay que tocar para colocar un sonido: «Empieza…», la barra de ms (de −duración a +duración, de 10 en 10), −100 / −10 / 0 / +10 / +100 y, si se pide, [Volver a su sitio]. El mismo para los de Eric, los de Code y los añadidos. */
function ControlDeMomento({ pre = '', ms, empieza, opciones, limite, significado, alCambiarMs, alCambiarEmpieza, alSoltar, volver }: {
  pre?: string
  ms: number
  empieza: string
  opciones: [string, string][]
  limite: number
  significado: string
  alCambiarMs: (v: number) => void
  alCambiarEmpieza: (e: string) => void
  alSoltar: () => void
  volver?: () => void
}): ReactNode {
  const d = (n: string) => ({ [`data-${pre}${n}`]: '' }) as Record<string, string>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ font: "600 12.5px 'Geist'" }}>Empieza…</span>
        {opciones.map(([e, texto]) => (
          <button key={e} type="button" {...{ [`data-${pre}empieza`]: e }} aria-pressed={empieza === e} onClick={() => alCambiarEmpieza(e)} style={{ ...botonPeq, background: empieza === e ? OSCURO : '#FFFFFF', color: empieza === e ? '#F3D88F' : OSCURO }}>
            {texto}
          </button>
        ))}
        {volver && (
          <button type="button" {...d('volver-a-su-sitio')} onClick={volver} style={botonPeq}>
            Volver a su sitio
          </button>
        )}
      </div>
      <span {...d('significado')} style={{ font: "400 11.5px/1.4 'Geist'", color: 'rgba(28,34,48,.6)' }}>{significado}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ display: 'flex', justifyContent: 'space-between', font: "600 12.5px 'Geist'" }}>
          <span>Adelantar ‹</span>
          <span {...d('ms-valor')} style={{ color: '#8A6A2C' }}>{conSigno(ms)}</span>
          <span>› Atrasar</span>
        </span>
        <input type="range" {...d('ms')} min={-limite} max={limite} step={10} value={ms} aria-label="Adelantar o atrasar el sonido, en milisegundos" style={{ width: '100%', minHeight: 44, accentColor: ORO }} onChange={(e) => alCambiarMs(Number(e.target.value))} onPointerUp={alSoltar} onKeyUp={alSoltar} />
        <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {([['menos100', -100, '−100'], ['menos', -10, '−10'], ['cero', 0, '0'], ['mas', 10, '+10'], ['mas100', 100, '+100']] as [string, number, string][]).map(([n, paso, texto]) => (
            <button key={n} type="button" {...d(`ms-${n}`)} style={botonPeq} onClick={() => alCambiarMs(paso === 0 ? 0 : Math.max(-limite, Math.min(limite, ms + paso)))}>
              {texto}
            </button>
          ))}
        </span>
      </div>
    </div>
  )
}

/** Un trozo de la línea de tiempo: un sonido (de Code, de Eric o añadido) colocado donde suena. */
interface Trozo {
  de: number
  a: number
}
interface FilaDeTiempo {
  clave: string
  nombre: string
  propio: boolean
  trozos: Trozo[]
  buffer?: AudioBuffer
}

/**
 * (V38E) LA LÍNEA DE TIEMPO DE LA ANIMACIÓN ENTERA: de 0 a [Seguir] (no a lo que dura una partitura), con una regla de segundos, las marcas de los momentos clave con su rótulo, una fila por sonido, las rayas verde (empieza) y roja (golpe / final)
 * y una raya azul (el punto elegido para [▶ desde aquí]). Zoom (+ / −) para afinar en un trozo; se desliza de lado cuando está ampliada. Cada trozo se ARRASTRA (de 10 en 10 ms) en toda su longitud, y debajo de cada sonido hay un campo para
 * escribir el segundo exacto («empieza en 12,40 s»), contado desde el principio de la animación. Tocar la franja elige el punto de [▶ desde aquí].
 */
const ZOOMS = [1, 2, 4, 8]
const PASOS_DE_REGLA = [0.5, 1, 2, 5, 10, 20]
function LineaDeTiempo({ filas, dura, golpe, marcas, desde, alArrastrar, alPonerSegundo, alElegirPunto, alReproducirDesde }: { filas: FilaDeTiempo[]; dura: number; golpe: number; marcas: Marca[]; desde: number | null; alArrastrar: (clave: string, deltaMs: number) => void; alPonerSegundo: (clave: string, segundos: number) => void; alElegirPunto: (t: number) => void; alReproducirDesde: () => void }): ReactNode {
  const [zoom, setZoom] = useState(1)
  const todos = filas.flatMap((f) => f.trozos)
  const lo = Math.min(0, ...todos.map((t) => t.de))
  const hi = Math.max(dura, golpe, ...todos.map((t) => t.a), ...marcas.map((m) => m.t))
  const largo = Math.max(0.001, hi - lo)
  const pos = (t: number) => `${(((t - lo) / largo) * 100).toFixed(3)}%`
  const ancho = (t: Trozo) => `${(((t.a - t.de) / largo) * 100).toFixed(3)}%`
  const franja = useRef<HTMLDivElement>(null)
  const arrastre = useRef<{ clave: string; x0: number; aplicado: number } | null>(null)
  /** Soltar un trozo tras arrastrarlo no cuenta como tocar la línea (no elige el punto de «desde aquí»). */
  const acabaDeArrastrar = useRef(false)
  const alBajar = (e: React.PointerEvent, clave: string) => {
    e.stopPropagation()
    arrastre.current = { clave, x0: e.clientX, aplicado: 0 }
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      /* sin captura */
    }
  }
  const alMover = (e: React.PointerEvent) => {
    const a = arrastre.current
    const ancha = franja.current?.getBoundingClientRect().width ?? 0
    if (!a || ancha <= 0) return
    const total = Math.round(((e.clientX - a.x0) / ancha) * largo * 100) * 10 // ms, de 10 en 10
    if (total !== a.aplicado) {
      alArrastrar(a.clave, total - a.aplicado)
      a.aplicado = total
      acabaDeArrastrar.current = true
    }
  }
  const alSoltar = () => {
    arrastre.current = null
    if (acabaDeArrastrar.current) window.setTimeout(() => (acabaDeArrastrar.current = false), 250)
  }
  // La regla: marcas cada `paso` segundos, el paso más pequeño que no apelmaza (unas 8 por pantalla).
  const visibles = largo / zoom
  const paso = PASOS_DE_REGLA.find((p) => visibles / p <= 9) ?? 20
  const ticks: number[] = []
  for (let t = Math.ceil(lo / paso) * paso; t <= hi + 1e-9; t += paso) ticks.push(Math.round(t * 100) / 100)
  const primeraDe = (f: FilaDeTiempo): number => Math.min(...f.trozos.map((t) => t.de))
  const alTocarFranja = (e: React.MouseEvent) => {
    if (acabaDeArrastrar.current) return
    const r = franja.current?.getBoundingClientRect()
    if (!r || r.width <= 0) return
    alElegirPunto(Math.max(lo, Math.min(hi, lo + ((e.clientX - r.left) / r.width) * largo)))
  }
  return (
    <div data-linea-de-tiempo data-lo={lo.toFixed(3)} data-hi={hi.toFixed(3)} data-dura={dura.toFixed(3)} data-zoom={zoom} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <span style={etiqueta}>LÍNEA DE TIEMPO · {coma(dura, 1)} s · arrastra un sonido, o escribe su segundo</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button type="button" data-zoom-menos aria-label="Alejar la línea de tiempo" disabled={zoom <= ZOOMS[0]} onClick={() => setZoom((z) => ZOOMS[Math.max(0, ZOOMS.indexOf(z) - 1)])} style={{ ...botonPeq, minWidth: 44, opacity: zoom <= ZOOMS[0] ? 0.4 : 1 }}>−</button>
          <span data-zoom-valor style={{ font: "600 12px 'Geist Mono',monospace", minWidth: 28, textAlign: 'center' }}>×{zoom}</span>
          <button type="button" data-zoom-mas aria-label="Acercar la línea de tiempo" disabled={zoom >= ZOOMS[ZOOMS.length - 1]} onClick={() => setZoom((z) => ZOOMS[Math.min(ZOOMS.length - 1, ZOOMS.indexOf(z) + 1)])} style={{ ...botonPeq, minWidth: 44, opacity: zoom >= ZOOMS[ZOOMS.length - 1] ? 0.4 : 1 }}>+</button>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" data-desde-aqui disabled={desde === null} onClick={alReproducirDesde} style={{ ...botonOscuro, display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 16px', opacity: desde === null ? 0.5 : 1 }}>
          <Triangulo t={12} /> desde aquí{desde === null ? '' : ` · ${coma(desde, 2)} s`}
        </button>
        <span style={{ font: "400 11.5px/1.4 'Geist'", color: 'rgba(28,34,48,.6)' }}>{desde === null ? 'Toca la línea de tiempo para elegir el punto.' : 'Reproduce la animación y los sonidos desde la raya azul.'}</span>
      </div>
      <div data-scroll-de-la-linea style={{ overflowX: zoom > 1 ? 'auto' : 'hidden', paddingBottom: 4 }}>
        <div style={{ width: `${zoom * 100}%`, minWidth: '100%', position: 'relative' }}>
          {/* La regla de segundos */}
          <div data-regla style={{ position: 'relative', height: 18, borderBottom: '1px solid rgba(28,34,48,.25)' }}>
            {ticks.map((t) => (
              <span key={t} data-tick={t} style={{ position: 'absolute', left: pos(t), bottom: 0, height: 6, borderLeft: '1px solid rgba(28,34,48,.4)', font: "500 9.5px 'Geist Mono',monospace", color: 'rgba(28,34,48,.6)', paddingLeft: 3, whiteSpace: 'nowrap', lineHeight: '12px', transform: 'translateY(-6px)' }}>
                {Number.isInteger(t) ? t : coma(t, 1)} s
              </span>
            ))}
          </div>
          {/* Los momentos clave, con su rótulo (en tres alturas para que no se pisen) */}
          <div data-marcas style={{ position: 'relative', height: 14 * 3 + 6 }}>
            {marcas.map((m, i) => {
              // (Las del final de la línea llevan el rótulo a la izquierda de su raya, para que no se salga.)
              const alFinal = (m.t - lo) / largo > 0.78
              return (
                <span key={`${m.t}:${m.rotulo}`} data-marca={m.rotulo} data-marca-t={m.t.toFixed(2)} style={{ position: 'absolute', left: pos(m.t), top: (i % 3) * 14, transform: alFinal ? 'translateX(-100%)' : undefined, [alFinal ? 'borderRight' : 'borderLeft']: '1px dashed rgba(28,34,48,.45)', [alFinal ? 'paddingRight' : 'paddingLeft']: 3, font: "600 9.5px 'Geist'", color: 'rgba(28,34,48,.75)', whiteSpace: 'nowrap', height: 14 * 3 + 6 - (i % 3) * 14, lineHeight: '13px', textAlign: alFinal ? 'right' : 'left' }}>
                  {m.rotulo} · {coma(m.t, 1)} s
                </span>
              )
            })}
          </div>
          <div style={{ position: 'relative', paddingTop: 2 }}>
            <div ref={franja} data-franja onClick={alTocarFranja} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 0', background: '#F7F1E4', borderRadius: 10, minHeight: 40, cursor: 'crosshair' }}>
              {filas.map((f) => (
                <div key={f.clave} data-fila-de-tiempo={f.clave} style={{ position: 'relative', height: 28 }}>
                  {f.trozos.map((t, i) => (
                    <div
                      key={i}
                      data-trozo
                      data-arrastrable
                      data-de={t.de.toFixed(3)}
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => alBajar(e, f.clave)}
                      onPointerMove={alMover}
                      onPointerUp={(e) => {
                        alMover(e) // el último punto del dedo o del ratón cuenta (el movimiento final puede llegar junto con el soltar)
                        alSoltar()
                      }}
                      onPointerCancel={alSoltar}
                      style={{ position: 'absolute', left: pos(t.de), width: ancho(t), minWidth: 6, top: 0, bottom: 0, borderRadius: 6, background: f.propio ? 'rgba(201,154,68,.28)' : 'rgba(28,34,48,.16)', border: f.propio ? `1px solid ${ORO}` : '1px solid rgba(28,34,48,.3)', overflow: 'hidden', cursor: 'grab', touchAction: 'none' }}
                    >
                      {f.buffer && <Onda buffer={f.buffer} />}
                    </div>
                  ))}
                  <span style={{ position: 'absolute', left: 6, top: 6, font: "600 10px 'Geist'", color: OSCURO, pointerEvents: 'none', textShadow: '0 0 3px #F7F1E4,0 0 3px #F7F1E4' }}>{f.nombre}</span>
                </div>
              ))}
              <div data-raya-verde style={{ position: 'absolute', top: 0, bottom: 0, left: pos(0), width: 2, background: '#2F9E5B', pointerEvents: 'none' }} />
              <div data-raya-roja style={{ position: 'absolute', top: 0, bottom: 0, left: pos(golpe), width: 2, background: '#D21E45', pointerEvents: 'none' }} />
              {desde !== null && <div data-raya-azul style={{ position: 'absolute', top: 0, bottom: 0, left: pos(desde), width: 2, background: '#2B6CB0', pointerEvents: 'none' }} />}
            </div>
          </div>
        </div>
      </div>
      <span style={{ display: 'flex', gap: 14, flexWrap: 'wrap', font: "500 10.5px 'Geist'", color: 'rgba(28,34,48,.6)' }}>
        <span><b style={{ color: '#2F9E5B' }}>▌</b> empieza la animación</span>
        <span><b style={{ color: '#D21E45' }}>▌</b> golpe / final</span>
        <span><b style={{ color: '#2B6CB0' }}>▌</b> punto de «desde aquí»</span>
      </span>
      {/* El segundo exacto de cada sonido, desde el principio de la animación */}
      <div data-segundos-exactos style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filas.map((f) => (
          <label key={f.clave} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', font: "500 12px 'Geist'" }}>
            <span style={{ minWidth: 150, flex: '1 1 150px' }}>{f.nombre}</span>
            <span>empieza en</span>
            <CampoDeSegundo valor={primeraDe(f)} maximo={Math.max(dura, hi)} alCambiar={(s) => alPonerSegundo(f.clave, s)} clave={f.clave} />
            <span>s</span>
          </label>
        ))}
      </div>
    </div>
  )
}

/** (V38E) El campo para escribir el segundo exacto en que empieza un sonido («12,40»). Se aplica al salir del campo o con Intro; admite coma o punto. */
function CampoDeSegundo({ valor, maximo, alCambiar, clave }: { valor: number; maximo: number; alCambiar: (s: number) => void; clave: string }): ReactNode {
  const [texto, setTexto] = useState<string | null>(null)
  const mostrado = texto ?? valor.toFixed(2).replace('.', ',')
  const aplicar = () => {
    if (texto === null) return
    const n = Number(texto.replace(',', '.'))
    setTexto(null)
    if (Number.isFinite(n)) alCambiar(Math.max(0, Math.min(maximo, n)))
  }
  return (
    <input
      type="text"
      inputMode="decimal"
      data-empieza-en={clave}
      aria-label="Segundo en que empieza el sonido, desde el principio de la animación"
      value={mostrado}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={aplicar}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
      style={{ width: 84, height: 44, padding: '0 10px', borderRadius: 10, border: '1.5px solid rgba(28,34,48,.2)', font: "600 14px 'Geist Mono',monospace", textAlign: 'right', background: '#fff' }}
    />
  )
}

/** Todos los candidatos de todas las animaciones (sin repetir) para [+ Añadir un sonido de Code]. */
interface Candidato {
  archivo: string
  letra: Letra
  rotulo: string
}
const candidatosDe = (mf: Manifiesto | null): Candidato[] => {
  const vistos = new Set<string>()
  const salida: Candidato[] = []
  for (const a of ANIMACIONES)
    for (const id of archivosDeLaAnimacion(a))
      for (const l of LETRAS) {
        const k = `${id}:${l}`
        if (!mf?.[id]?.[l] || vistos.has(k)) continue
        vistos.add(k)
        salida.push({ archivo: id, letra: l, rotulo: `${a.nombre} · ${nombreDe(id)} · ${l}` })
      }
  return salida
}

export function AdminSonidos({ embebido = false }: { embebido?: boolean }): ReactNode {
  const admin = useEsAdministrador()
  const [vol, setVol] = useState(() => volumenGeneral())
  const [cambios, repintar] = useState(0)
  const [mf, setMf] = useState<Manifiesto | null>(null)
  const [abierta, setAbierta] = useState<string>(ANIMACIONES[0].id)
  const [estados, setEstados] = useState<Record<string, EstadoRT>>({})
  const [guardados, setGuardados] = useState<Record<string, { huella: string; en: string }>>({})
  const [almacen, setAlmacen] = useState<boolean | null>(null)
  const [aviso, setAviso] = useState('')
  const [borrando, setBorrando] = useState(false)
  const [selector, setSelector] = useState(false)
  const [buscar, setBuscar] = useState('')
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null)
  // (V36B) Editar: qué se está editando, los sonidos de Code ya retocados, los originales y si se repite sola la animación al cambiar.
  const [editando, setEditando] = useState<string | null>(null)
  const [procesados, setProcesados] = useState<Record<string, Procesado>>({})
  const [originalesCode, setOriginalesCode] = useState<Record<string, AudioBuffer>>({})
  const [repetirAlCambiar, setRepetirAlCambiar] = useState(() => {
    try {
      return window.localStorage.getItem('jutrip.estudio.repetir_al_cambiar') === '1'
    } catch {
      return false
    }
  })
  const procesadosRef = useRef(procesados)
  procesadosRef.current = procesados
  const historial = useRef<Record<string, Retoques[]>>({})
  const secuencia = useRef(0)
  const [visorListo, setVisorListo] = useState(false)
  const [haSonado, setHaSonado] = useState(false)
  const [ancho, setAncho] = useState(() => (typeof window === 'undefined' ? 1200 : window.innerWidth))
  const [copiado, setCopiado] = useState(false)
  const iframe = useRef<HTMLIFrameElement>(null)
  const entrada = useRef<HTMLInputElement>(null)
  const entradaZip = useRef<HTMLInputElement>(null)
  const contador = useRef(0)
  // Lo último que hay en pantalla, para que `ver` (que se crea una vez) no vea datos viejos.
  const vivo = useRef({ estados })
  vivo.current = { estados }

  const est = (id: string): EstadoRT => estados[id] ?? VACIO_RT
  const actualizar = (id: string, f: (e: EstadoRT) => EstadoRT) => {
    vivo.current = { estados: { ...vivo.current.estados, [id]: f(vivo.current.estados[id] ?? VACIO_RT) } }
    setEstados(vivo.current.estados)
  }

  useEffect(() => {
    void manifiesto().then(setMf)
    const f = () => setAncho(window.innerWidth)
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])

  const movil = ancho < 820
  const escala = movil ? Math.min(0.62, (Math.min(ancho, 520) - 64) / ANCHO) : 0.62
  const anim = ANIMACIONES.find((a) => a.id === abierta) ?? ANIMACIONES[0]
  const e = est(anim.id)
  const susCapas = e.capas
  const capasDeEric = susCapas.filter((c) => c.origen === 'archivo')
  const capasAnadidas = susCapas.filter((c) => c.origen === 'code')
  const susSilencios = e.silenciados
  const dura = duracionDe(anim)
  const golpe = golpeDe(anim)
  const linea = useMemo(() => lineaDeTiempo(anim), [anim])
  // (V38E) El punto elegido en la línea de tiempo para «▶ desde aquí» (segundos de la animación entera), por tarjeta.
  const [desdeAqui, setDesdeAqui] = useState<Record<string, number>>({})
  const puntoDesde = desdeAqui[anim.id] ?? null

  // El visor (la app dentro del marco): la marca de «sin pantalla de apertura» se deja antes de cargarlo y se espera a que tenga su API.
  const srcDelVisor = useMemo(() => {
    try {
      window.sessionStorage.setItem('jutrip:sin-apertura', '1')
    } catch {
      /* sin almacenamiento */
    }
    return '/?visor-sonidos=1'
  }, [])
  useEffect(() => {
    if (!admin) return undefined
    let activo = true
    const t = window.setInterval(() => {
      const w = iframe.current?.contentWindow as (Window & { __estudioVisor?: VisorApi }) | null | undefined
      if (activo && w?.__estudioVisor?.listo) {
        setVisorListo(true)
        window.clearInterval(t)
      }
    }, 120)
    return () => {
      activo = false
      window.clearInterval(t)
    }
  }, [admin])

  /** (V38B) La otra escena que se está viendo dentro de la tarjeta de un destino (por tarjeta). */
  const escenaVista = useRef<Record<string, string>>({})
  const [escenaMostrada, setEscenaMostrada] = useState<Record<string, string>>({})
  const visor = (): VisorApi | null => ((iframe.current?.contentWindow as (Window & { __estudioVisor?: VisorApi }) | null | undefined)?.__estudioVisor ?? null)
  /** El audio es de ESTA página (se desbloquea con el toque de quien lo pulsa) y el marco lo usa. */
  const audio = (): AudioContext | null => {
    const c = contextoDeAudioDeLaApp()
    if (!c) return null
    ;(window as unknown as { __estudioContexto?: AudioContext }).__estudioContexto = c
    if (c.state !== 'running') void c.resume().catch(() => undefined)
    return c
  }
  /** Reproduce la animación con lo que haya (o con lo que se pase, cuando el estado de React aún no se ha puesto al día). */
  const ver = useCallback(async (id: string, sobre?: Partial<EstadoRT>, extra?: { desde?: number }) => {
    const v = visor()
    if (!v || !audio()) return
    setHaSonado(true)
    const x = { ...(vivo.current.estados[id] ?? VACIO_RT), ...sobre }
    const editados: Record<string, Procesado> = {}
    for (const k of Object.keys(x.ediciones ?? {})) {
      const p = procesadosRef.current[`${id}|${k}`]
      if (p) editados[k] = p
    }
    await v.ver({ animacion: id, escena: escenaVista.current[id], desde: extra?.desde, propios: x.capas, silenciados: x.silenciados, ajustes: x.ajustes, letras: x.letras, volumenes: x.volumenes, editados })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const abrirY = (id: string) => {
    setAbierta(id)
    setBorrando(false)
    setSelector(false)
    window.setTimeout(() => void ver(id), 0)
  }

  /* ───────── Lo guardado en este navegador ───────── */
  const hidratar = useCallback(async (g: Guardado): Promise<EstadoRT> => {
    const c = audio()
    const capas: Capa[] = []
    for (const k of g.capas) {
      if (!c) break
      try {
        if (k.origen === 'archivo' && k.archivo) {
          const original = await c.decodeAudioData(k.archivo.bytes.slice(0))
          const buffer = k.retoques ? await aplicarRetoques(original, k.retoques) : original
          capas.push({ id: k.id, origen: 'archivo', nombre: k.nombre, buffer, original, retoques: k.retoques, ms: k.ms, vol: k.vol, empieza: k.empieza, bytes: k.archivo.bytes, tipoMime: k.archivo.tipo })
        } else if (k.origen === 'code' && k.sonido && k.letra) {
          const original = await cargarPremio(c, k.sonido, k.letra)
          if (original) capas.push({ id: k.id, origen: 'code', nombre: k.nombre, buffer: k.retoques ? await aplicarRetoques(original, k.retoques) : original, original, retoques: k.retoques, ms: k.ms, vol: k.vol, empieza: k.empieza, sonido: k.sonido, letra: k.letra })
        }
      } catch {
        /* una capa que no se puede abrir se salta */
      }
    }
    return { silenciados: g.silenciados, ajustes: g.ajustes, letras: g.letras, volumenes: g.volumenes, capas, ediciones: g.ediciones ?? {} }
  }, [])
  /** (V36B) Rehace los sonidos de Code retocados de una animación (los retoques están guardados; el sonido ya hecho se calcula al abrir). */
  const rehacer = useCallback(async (animId: string, ediciones: Record<string, Retoques>) => {
    const c = audio()
    if (!c) return
    const m = await manifiesto()
    const nuevos: Record<string, Procesado> = {}
    for (const [k, r] of Object.entries(ediciones)) {
      if (sinCambios(r)) continue
      const corte = k.lastIndexOf('_')
      const id = k.slice(0, corte)
      const letra = k.slice(corte + 1) as Letra
      const original = await cargarPremio(c, id, letra)
      if (!original) continue
      const buffer = await aplicarRetoques(original, r)
      nuevos[`${animId}|${k}`] = { buffer, golpe: golpeTras(m?.[id]?.[letra]?.golpe ?? 0, r), dura: buffer.duration }
    }
    procesadosRef.current = { ...procesadosRef.current, ...nuevos }
    setProcesados(procesadosRef.current)
  }, [])
  useEffect(() => {
    if (!admin) return
    let vigente = true
    void (async () => {
      try {
        const lista = await leerGuardados()
        if (!vigente) return
        setAlmacen(true)
        await manifiesto()
        const nuevos: Record<string, EstadoRT> = {}
        const marcas: Record<string, { huella: string; en: string }> = {}
        // (V38B) Las tarjetas sueltas «Escena de Roma / Lanzarote» pasaron a ser UNA por destino: lo que se guardó en ellas se enseña en la tarjeta del destino (solo si esa no tiene guardado propio). El guardado viejo NO se borra.
        const PASAN_A: Record<string, string> = { escena_roma: 'emblema', escena_lanzarote: 'emblema_lanzarote' }
        for (const g0 of lista) {
          const destino = PASAN_A[g0.animacion]
          let g = destino && !lista.some((o) => o.animacion === destino) ? { ...g0, animacion: destino } : g0
          // (V39B) El Coliseo ahora empieza con su suspense: lo guardado antes se mueve lo mismo que la película (+3,6 s) para que cada sonido siga en el mismo fotograma. ANTES se guarda una copia de lo de antes, intacta. Una sola vez (`version_linea`).
          if (g.animacion === 'emblema_maravilla' && (g.version_linea ?? 1) < 2) {
            await guardarEnElNavegador({ ...g, animacion: ID_DE_LA_COPIA_DEL_COLISEO })
            g = { ...g, ...migrarColiseoV39B(g), version_linea: 2 }
            await guardarEnElNavegador(g)
          }
          if (!animacionDe(g.animacion)) continue
          const x = await hidratar(g)
          nuevos[g.animacion] = x
          await rehacer(g.animacion, x.ediciones)
          marcas[g.animacion] = { huella: huellaRT(x), en: g.guardado_en }
        }
        if (!vigente) return
        vivo.current = { estados: { ...vivo.current.estados, ...nuevos } }
        setEstados(vivo.current.estados)
        setGuardados(marcas)
      } catch {
        if (vigente) setAlmacen(false)
      }
    })()
    return () => {
      vigente = false
    }
  }, [admin, hidratar])

  const sinGuardar = (id: string): boolean => {
    const h = huellaRT(est(id))
    const g = guardados[id]
    return g ? h !== g.huella : h !== HUELLA_VACIA
  }
  const hayCambios = ANIMACIONES.some((a) => sinGuardar(a.id))
  useEffect(() => {
    if (!hayCambios) return undefined
    const f = (ev: BeforeUnloadEvent) => {
      ev.preventDefault()
      ev.returnValue = ''
    }
    window.addEventListener('beforeunload', f)
    return () => window.removeEventListener('beforeunload', f)
  }, [hayCambios])

  /** El estado con la letra y el volumen EFECTIVOS de cada sonido de Code de la animación (así lo guardado es exacto aunque no se tocara nada). */
  const llenado = (id: string): EstadoRT => {
    const a = animacionDe(id) ?? anim
    const x = est(id)
    const letras = { ...x.letras }
    const volumenes = { ...x.volumenes }
    for (const c of deCodeDe(a)) {
      if (c.tipo === 'archivo') letras[c.id] = x.letras[c.id] ?? versionDe(c.id)
      volumenes[c.claveVolumen] = x.volumenes[c.claveVolumen] ?? volumenDe(c.claveVolumen)
    }
    return { ...x, letras, volumenes }
  }
  const guardar = async () => {
    const lleno = llenado(anim.id)
    const g: Guardado = { animacion: anim.id, guardado_en: new Date().toISOString(), version_linea: 2, ...aGuardable(lleno) }
    try {
      await guardarEnElNavegador(g)
      actualizar(anim.id, () => lleno)
      setGuardados((m) => ({ ...m, [anim.id]: { huella: huellaRT(lleno), en: g.guardado_en } }))
      setAlmacen(true)
      setAviso('')
    } catch {
      setAlmacen(false)
    }
  }
  const eliminarGuardado = async () => {
    setBorrando(false)
    try {
      await borrarGuardado(anim.id)
    } catch {
      setAlmacen(false)
      return
    }
    actualizar(anim.id, () => VACIO_RT)
    setGuardados((m) => {
      const n = { ...m }
      delete n[anim.id]
      return n
    })
    void ver(anim.id, VACIO_RT)
  }

  /** La línea de «Lo elegido» de una animación (con lo que haya en pantalla). */
  const lineaDe = (a: Animacion, x: EstadoDeAnimacion): string => {
    const codigo = deCodeDe(a).map((c) => ({
      nombre: nombreDe(c.id),
      silenciado: x.silenciados.includes(c.clave),
      letra: c.tipo === 'archivo' ? (x.letras[c.id] ?? versionDe(c.id)) : undefined,
      volumen: x.volumenes[c.claveVolumen] ?? volumenDe(c.claveVolumen),
      movido: x.ajustes[c.clave],
      retocado: c.tipo === 'archivo' && x.ediciones?.[claveEd(c.id, x.letras[c.id] ?? versionDe(c.id))] ? descripcionDe(x.ediciones[claveEd(c.id, x.letras[c.id] ?? versionDe(c.id))]) : undefined,
    }))
    const propios = x.capas.filter((c) => c.origen === 'archivo').map((c) => ({ nombre: c.nombre, empieza: c.empieza, ms: c.ms, volumen: c.vol, retocado: c.retoques ? descripcionDe(c.retoques) : undefined }))
    const anadidos = x.capas.filter((c) => c.origen === 'code').map((c) => ({ nombre: c.nombre, empieza: c.empieza, ms: c.ms, volumen: c.vol, retocado: c.retoques ? descripcionDe(c.retoques) : undefined }))
    return lineaElegida(a, { codigo, propios, anadidos })
  }

  const descargarTodo = async () => {
    try {
      const lista = await leerGuardados()
      if (lista.length === 0) return setAviso('Todavía no hay nada guardado: toca [Guardar] en alguna animación.')
      const datos = lista
        .filter((g) => animacionDe(g.animacion))
        .map((g) => {
          const a = animacionDe(g.animacion) as Animacion
          return {
            animacion: g.animacion,
            nombre: a.nombre,
            duracion: duracionDe(a),
            golpe: golpeDe(a),
            tramos: lineaDeTiempo(a).tramos.map((x) => ({ partitura: x.partitura, empieza: x.empieza })),
            codigo: deCodeDe(a).map((c) => ({
              clave: c.clave,
              tipo: c.tipo,
              sonido: c.id,
              version: c.tipo === 'archivo' ? (g.letras[c.id] ?? versionDe(c.id)) : null,
              silenciado: g.silenciados.includes(c.clave),
              volumen: g.volumenes[c.claveVolumen] ?? volumenDe(c.claveVolumen),
              ms: g.ajustes[c.clave]?.ms ?? 0,
              empieza: (g.ajustes[c.clave]?.empieza ?? 'sitio') as EmpiezaCode,
            })),
            capas: g.capas,
            lineaElegida: lineaDe(a, g),
            animacionDatos: a,
            guardado: g,
          }
        })
      const ctx = audio()
      const hacerFinal = async (original: AudioBuffer, r: Retoques): Promise<FinalDeSonido> => {
        const limpios = limitar(r, original.duration)
        const b = await aplicarRetoques(original, limpios)
        return { wav: codificarWav(b), muestras: b.length, tasa: b.sampleRate, pico: picoDe(b), retoques: limpios }
      }
      const conFinales = []
      for (const d of datos) {
        const g = d.guardado
        const finales: { capas: Record<string, FinalDeSonido>; codigo: Record<string, FinalDeSonido> } = { capas: {}, codigo: {} }
        if (ctx) {
          for (const k of g.capas) {
            if (!k.retoques || sinCambios(k.retoques)) continue
            const original = k.origen === 'archivo' && k.archivo ? await ctx.decodeAudioData(k.archivo.bytes.slice(0)) : k.sonido && k.letra ? await cargarPremio(ctx, k.sonido, k.letra) : null
            if (original) finales.capas[k.id] = await hacerFinal(original, k.retoques)
          }
          for (const c of deCodeDe(d.animacionDatos)) {
            if (c.tipo !== 'archivo') continue
            const r = g.ediciones?.[claveEd(c.id, g.letras[c.id] ?? versionDe(c.id))]
            if (!r || sinCambios(r)) continue
            const original = await cargarPremio(ctx, c.id, g.letras[c.id] ?? versionDe(c.id))
            if (original) finales.codigo[c.clave] = await hacerFinal(original, r)
          }
        }
        conFinales.push({ ...d, finales })
      }
      const zip = construirZip(conFinales, volumenGeneral())
      if (import.meta.env.DEV) (window as unknown as { __estudioZip?: Uint8Array }).__estudioZip = zip
      const url = URL.createObjectURL(new Blob([zip as BlobPart], { type: 'application/zip' }))
      const enlace = document.createElement('a')
      enlace.href = url
      enlace.download = 'sonidos_jutrip.zip'
      document.body.appendChild(enlace)
      enlace.click()
      enlace.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 4000)
      setAviso(`Zip hecho con ${datos.length} ${datos.length === 1 ? 'animación' : 'animaciones'}: sonidos_jutrip.zip.`)
    } catch {
      setAlmacen(false)
    }
  }
  const cargarZip = async (f: File | undefined) => {
    if (!f) return
    try {
      const entradas = await leerZip(new Uint8Array(await f.arrayBuffer()))
      const json = entradas.find((x) => x.nombre === 'estudio.json')
      if (!json) throw new Error('Ese zip no trae estudio.json: no es de este estudio.')
      const animaciones = leerEstudioJson(new TextDecoder().decode(json.datos))
      const archivos = new Map(entradas.map((x) => [x.nombre, x.datos]))
      const mime = (n: string) => (/\.wav$/i.test(n) ? 'audio/wav' : /\.ogg$/i.test(n) ? 'audio/ogg' : /\.m4a$/i.test(n) ? 'audio/mp4' : 'audio/mpeg')
      let cuantas = 0
      for (const [id, a] of Object.entries(animaciones)) {
        const animacion = animacionDe(id)
        if (!animacion) continue
        // (V39B) Un zip de antes de la V39B no trae el suspense del Coliseo delante: sus sonidos se mueven lo mismo que la película.
        const estadoZip = estadoDesdeJson(a, archivos, mime)
        const g: Guardado = { animacion: id, guardado_en: new Date().toISOString(), version_linea: 2, ...(id === 'emblema_maravilla' && !a.tramos?.some((x) => x.partitura === 'escena' && x.empieza > 0) ? migrarColiseoV39B(estadoZip) : estadoZip) }
        try {
          await guardarEnElNavegador(g)
        } catch {
          setAlmacen(false)
        }
        const x = await hidratar(g)
        await rehacer(id, x.ediciones)
        // Los nombres de las capas de Code, con el de su animación.
        x.capas = x.capas.map((c) => (c.origen === 'code' && c.sonido ? { ...c, nombre: `${nombreDe(c.sonido)} · ${c.letra}` } : c))
        vivo.current = { estados: { ...vivo.current.estados, [id]: x } }
        setEstados(vivo.current.estados)
        setGuardados((m) => ({ ...m, [id]: { huella: huellaRT(x), en: g.guardado_en } }))
        cuantas++
      }
      setAviso(`Cargado: ${cuantas} ${cuantas === 1 ? 'animación' : 'animaciones'} del zip.`)
      void ver(abierta)
    } catch (err) {
      setAviso(err instanceof Error ? err.message : 'No he podido abrir ese zip.')
    }
    if (entradaZip.current) entradaZip.current.value = ''
  }

  /* ───────── Cambios en la animación abierta ───────── */
  const elegirCandidato = (archivo: string, letra: Letra) => {
    elegirVersion(archivo, letra)
    actualizar(anim.id, (x) => ({ ...x, letras: { ...x.letras, [archivo]: letra } }))
    repintar((n) => n + 1)
    void ver(anim.id, { letras: { ...est(anim.id).letras, [archivo]: letra } })
  }
  const ponerVolumen = (clave: string, v: number) => {
    ponerVolumenDe(clave, v)
    actualizar(anim.id, (x) => ({ ...x, volumenes: { ...x.volumenes, [clave]: v } }))
    repintar((n) => n + 1)
  }
  const alternarSilencio = (clave: string) => {
    const ya = susSilencios.includes(clave)
    const nuevo = ya ? susSilencios.filter((c) => c !== clave) : [...susSilencios, clave]
    actualizar(anim.id, (x) => ({ ...x, silenciados: nuevo }))
    void ver(anim.id, { silenciados: nuevo })
  }
  const deCode = deCodeDe(anim)
  const todosSilenciados = deCode.length > 0 && deCode.every((c) => susSilencios.includes(c.clave))
  const silenciarTodos = () => {
    const nuevo = todosSilenciados ? [] : deCode.map((c) => c.clave)
    actualizar(anim.id, (x) => ({ ...x, silenciados: nuevo }))
    void ver(anim.id, { silenciados: nuevo })
  }
  const ajusteDe = (clave: string): AjusteDeCode => e.ajustes[clave] ?? { ms: 0, empieza: 'sitio' }
  const ponerAjuste = (clave: string, cambio: Partial<AjusteDeCode>) =>
    actualizar(anim.id, (x) => {
      const nuevo = { ...(x.ajustes[clave] ?? { ms: 0, empieza: 'sitio' as EmpiezaCode }), ...cambio }
      const ajustes = { ...x.ajustes }
      if (nuevo.ms === 0 && nuevo.empieza === 'sitio') delete ajustes[clave]
      else ajustes[clave] = nuevo
      return { ...x, ajustes }
    })
  const volverASuSitio = (clave: string) => {
    const ajustes = { ...e.ajustes }
    delete ajustes[clave]
    actualizar(anim.id, (x) => ({ ...x, ajustes }))
    void ver(anim.id, { ajustes })
  }
  const ponerCapa = (id: string, cambio: Partial<Capa>) => actualizar(anim.id, (x) => ({ ...x, capas: x.capas.map((c) => (c.id === id ? { ...c, ...cambio } : c)) }))
  const quitarCapa = (id: string) => {
    const nuevas = susCapas.filter((c) => c.id !== id)
    actualizar(anim.id, (x) => ({ ...x, capas: nuevas }))
    void ver(anim.id, { capas: nuevas })
  }

  const alElegirArchivo = async (f: File | undefined) => {
    if (!f) return
    setErrorArchivo(null)
    const c = audio()
    if (!c) return setErrorArchivo('Este navegador no deja reproducir audio.')
    try {
      // Se lee y se descodifica AQUÍ, en el navegador: el archivo no se envía a ningún sitio.
      const bytes = await f.arrayBuffer()
      const buffer = await c.decodeAudioData(bytes.slice(0))
      const nueva: Capa = { id: `m${++contador.current}`, origen: 'archivo', nombre: f.name, buffer, original: buffer, bytes, tipoMime: f.type, ms: 0, vol: 0.7, empieza: 'principio' }
      const nuevas = [...(vivo.current.estados[anim.id]?.capas ?? []), nueva]
      actualizar(anim.id, (x) => ({ ...x, capas: nuevas }))
      void ver(anim.id, { capas: nuevas })
    } catch {
      setErrorArchivo('No he podido abrir ese archivo. Prueba con un mp3, m4a, wav u ogg.')
    }
    if (entrada.current) entrada.current.value = ''
  }
  const anadirDeCode = async (c: Candidato) => {
    const ctx = audio()
    if (!ctx) return setErrorArchivo('Este navegador no deja reproducir audio.')
    const buffer = await cargarPremio(ctx, c.archivo, c.letra)
    if (!buffer) return setErrorArchivo('No he podido abrir ese sonido de Code.')
    const nueva: Capa = { id: `c${++contador.current}`, origen: 'code', nombre: c.rotulo, buffer, original: buffer, ms: 0, vol: 1, empieza: 'principio', sonido: c.archivo, letra: c.letra }
    const nuevas = [...(vivo.current.estados[anim.id]?.capas ?? []), nueva]
    actualizar(anim.id, (x) => ({ ...x, capas: nuevas }))
    setSelector(false)
    void ver(anim.id, { capas: nuevas })
  }
  const probarCandidato = async (c: Candidato) => {
    const ctx = audio()
    if (!ctx) return
    const buffer = await cargarPremio(ctx, c.archivo, c.letra)
    if (!buffer) return
    const f = ctx.createBufferSource()
    f.buffer = buffer
    const g = ctx.createGain()
    g.gain.value = 0.8
    f.connect(g)
    g.connect(ctx.destination)
    f.start()
  }
  const candidatos = useMemo(() => candidatosDe(mf), [mf])
  const visibles = candidatos.filter((c) => c.rotulo.toLowerCase().includes(buscar.trim().toLowerCase()))

  /* ───────── (V36B) Editar un sonido ───────── */
  const apuntarHistorial = (clave: string, r: Retoques) => {
    ;(historial.current[clave] ??= []).push(r)
    if (historial.current[clave].length > 30) historial.current[clave].shift()
  }
  const marcarRepetir = (v: boolean) => {
    setRepetirAlCambiar(v)
    try {
      window.localStorage.setItem('jutrip.estudio.repetir_al_cambiar', v ? '1' : '0')
    } catch {
      /* sin almacenamiento */
    }
  }
  /** Cambia los retoques de una capa (de Eric o añadida): el sonido nuevo se calcula encima del original, que no se toca. */
  const retocarCapa = async (id: string, nuevos: Retoques, conHistorial = true) => {
    const capa = vivo.current.estados[anim.id]?.capas.find((c) => c.id === id)
    if (!capa?.original) return
    const r = limitar(nuevos, capa.original.duration)
    if (conHistorial) apuntarHistorial(`capa:${id}`, capa.retoques ?? SIN_RETOQUES)
    ponerCapa(id, { retoques: sinCambios(r) ? undefined : r })
    const mia = ++secuencia.current
    const buffer = await aplicarRetoques(capa.original, r)
    if (mia !== secuencia.current) return
    actualizar(anim.id, (x) => ({ ...x, capas: x.capas.map((c) => (c.id === id ? { ...c, buffer } : c)) }))
    repintar((n) => n + 1)
    if (repetirAlCambiar) window.setTimeout(() => void ver(anim.id), 0)
  }
  /** Lo mismo para un sonido de Code de la animación (por su archivo y su letra). */
  const retocarCode = async (id: string, letra: Letra, nuevos: Retoques, conHistorial = true) => {
    const key = claveEd(id, letra)
    const ctx = audio()
    const original = originalesCode[key] ?? (ctx ? await cargarPremio(ctx, id, letra) : null)
    if (!original) return
    const r = limitar(nuevos, original.duration)
    if (conHistorial) apuntarHistorial(`code:${key}`, vivo.current.estados[anim.id]?.ediciones?.[key] ?? SIN_RETOQUES)
    actualizar(anim.id, (x) => {
      const ediciones = { ...x.ediciones }
      if (sinCambios(r)) delete ediciones[key]
      else ediciones[key] = r
      return { ...x, ediciones }
    })
    const mia = ++secuencia.current
    const buffer = await aplicarRetoques(original, r)
    if (mia !== secuencia.current) return
    const guardado = `${anim.id}|${key}`
    const nuevosProcesados = { ...procesadosRef.current }
    if (sinCambios(r)) delete nuevosProcesados[guardado]
    else nuevosProcesados[guardado] = { buffer, golpe: golpeTras(mf?.[id]?.[letra]?.golpe ?? 0, r), dura: buffer.duration }
    procesadosRef.current = nuevosProcesados
    setProcesados(nuevosProcesados)
    repintar((n) => n + 1)
    if (repetirAlCambiar) window.setTimeout(() => void ver(anim.id), 0)
  }
  const abrirEditorDeCode = async (id: string, letra: Letra) => {
    const key = claveEd(id, letra)
    if (editando === `code:${key}`) return setEditando(null)
    const ctx = audio()
    if (ctx && !originalesCode[key]) {
      const o = await cargarPremio(ctx, id, letra)
      if (o) setOriginalesCode((m) => ({ ...m, [key]: o }))
    }
    setEditando(`code:${key}`)
  }
  const deshacerDe = (clave: string, aplicar: (r: Retoques) => void) => {
    const antes = historial.current[clave]?.pop()
    repintar((n) => n + 1)
    if (antes) aplicar(antes)
  }

  const limite = Math.max(500, Math.ceil((dura * 1000) / 10) * 10)
  const espera = esperaDeLaAnimacion(susCapas, golpe)

  // La línea de tiempo: los sonidos de Code que suenan (movidos si se han movido; los silenciados no salen), los de Eric y los añadidos, cada uno donde suena.
  const filas: FilaDeTiempo[] = useMemo(() => {
    void cambios
    const salida: FilaDeTiempo[] = []
    const porClave = new Map<string, FilaDeTiempo>()
    for (const tramo of linea.tramos) {
      const s = tramo.partitura
      const empieza = tramo.empieza
      const notas: Nota[] = partituraDe(s, tramo.opciones)?.notas ?? []
      const golpeDe1 = (n: Nota): number => (n.tipo === 'archivo' ? (procesados[`${anim.id}|${claveEd(n.archivo, versionDeEn(e, n.archivo))}`]?.golpe ?? mf?.[n.archivo]?.[versionDeEn(e, n.archivo)]?.golpe ?? 0.3) : 0)
      const primera = new Map<string, number>()
      for (const n of notas) {
        const k = claveDeSilencio(n.tipo, n.tipo === 'sint' ? n.sonido : n.archivo)
        const a = arranqueNatural(n, golpeDe1(n))
        if (!primera.has(k) || a < (primera.get(k) as number)) primera.set(k, a)
      }
      for (const n of notas) {
        const id = n.tipo === 'sint' ? n.sonido : n.archivo
        const clave = claveDeSilencio(n.tipo, id)
        if (susSilencios.includes(clave)) continue
        const delta = desplazamientoDeCode((primera.get(clave) as number) + empieza, e.ajustes[clave], golpe)
        let de: number
        let largo: number
        if (n.tipo === 'sint') {
          de = n.en + delta
          largo = n.dura ?? 0.25
        } else {
          const datos = mf?.[n.archivo]?.[versionDeEn(e, n.archivo)]
          const retocado = procesados[`${anim.id}|${claveEd(n.archivo, versionDeEn(e, n.archivo))}`]
          de = n.golpe - (retocado?.golpe ?? datos?.golpe ?? 0.3) + delta
          largo = retocado?.dura ?? datos?.dura ?? 0.6
        }
        let fila = porClave.get(clave)
        if (!fila) {
          fila = { clave, nombre: nombreDe(id), propio: false, trozos: [] }
          porClave.set(clave, fila)
          salida.push(fila)
        }
        fila.trozos.push({ de: de + empieza, a: de + empieza + largo })
      }
    }
    for (const c of susCapas) {
      const de = arranqueDelPropio(c, golpe)
      salida.push({ clave: c.origen === 'code' ? `anadido:${c.id}` : `propio:${c.id}`, nombre: c.origen === 'code' ? `AÑADIDO: ${c.nombre}` : `MÍO: ${c.nombre}`, propio: true, trozos: [{ de, a: de + c.buffer.duration }], buffer: c.buffer })
    }
    return salida
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anim.id, linea, susCapas, susSilencios, e.ajustes, e.letras, mf, cambios, golpe, procesados])

  /** Arrastrar un trozo: mueve el sonido tantos ms (los de Code, su ajuste; las capas, su ms). */
  const arrastrar = (clave: string, deltaMs: number) => {
    if (clave.startsWith('propio:') || clave.startsWith('anadido:')) {
      const id = clave.slice(clave.indexOf(':') + 1)
      actualizar(anim.id, (x) => ({ ...x, capas: x.capas.map((c) => (c.id === id ? { ...c, ms: Math.max(-limite, Math.min(limite, c.ms + deltaMs)) } : c)) }))
      return
    }
    // (V38E) Sobre lo ÚLTIMO (no sobre lo pintado): varios movimientos seguidos del dedo, antes de repintar, se suman todos.
    actualizar(anim.id, (x) => {
      const actual = x.ajustes[clave] ?? { ms: 0, empieza: 'sitio' as EmpiezaCode }
      const nuevo = { ...actual, ms: Math.max(-limite, Math.min(limite, actual.ms + deltaMs)) }
      const ajustes = { ...x.ajustes }
      if (nuevo.ms === 0 && nuevo.empieza === 'sitio') delete ajustes[clave]
      else ajustes[clave] = nuevo
      return { ...x, ajustes }
    })
  }

  /** (V38E) Escribir el segundo exacto: el sonido empieza a los `segundos` s desde el principio de la animación (los de Code, «desde el principio»; las capas, también). */
  const ponerSegundo = (clave: string, segundos: number) => {
    const ms = Math.round(segundos * 1000)
    if (clave.startsWith('propio:') || clave.startsWith('anadido:')) {
      const id = clave.slice(clave.indexOf(':') + 1)
      actualizar(anim.id, (x) => ({ ...x, capas: x.capas.map((c) => (c.id === id ? { ...c, empieza: 'principio' as Empieza, ms } : c)) }))
    } else ponerAjuste(clave, { empieza: 'principio', ms })
    window.setTimeout(() => void ver(anim.id), 0)
  }

  const elegido = useMemo(() => {
    void cambios
    return ANIMACIONES.map((a) => lineaDe(a, aGuardable(estados[a.id] ?? VACIO_RT))).join('\n') + `\nvolumen general: ${coma(vol)}`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estados, cambios, vol, mf])

  if (admin === null) return <div style={{ padding: 24, font: "400 15px 'Geist'" }}>Comprobando…</div>
  if (!admin) return <div data-solo-administradores style={{ padding: 24, font: "400 17px/1.4 'Geist'" }}>Esta página es solo para administradores.</div>

  const solo = (a: Animacion): string | null => {
    const arch = archivosDeLaAnimacion(a)
    if (arch.length === 0) return 'Solo un sonido (hecho por código, fijo)'
    const conVarios = arch.filter((id) => LETRAS.filter((l) => mf?.[id]?.[l]).length > 1)
    return conVarios.length === 0 ? 'Solo un sonido grabado' : null
  }

  const marco = (
    <div data-marco-iphone style={{ flex: 'none', width: ANCHO * escala + 14, height: ALTO * escala + 14, borderRadius: 34, background: OSCURO, padding: 7, boxShadow: '0 18px 30px -14px rgba(28,34,48,.7)', boxSizing: 'border-box' }}>
      <div style={{ position: 'relative', width: ANCHO * escala, height: ALTO * escala, borderRadius: 28, overflow: 'hidden', background: '#0B0E1C' }}>
        <iframe ref={iframe} data-visor-iframe src={srcDelVisor} title="La animación, en un iPhone" style={{ width: ANCHO, height: ALTO, border: 0, transform: `scale(${escala})`, transformOrigin: '0 0', background: '#12172A' }} allow="autoplay" />
        {!visorListo && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,253,248,.6)', font: "500 12px 'Geist'" }}>Preparando…</span>}
      </div>
    </div>
  )
  const g = guardados[anim.id]
  const pendiente = sinGuardar(anim.id)

  return (
    <div data-admin-sonidos data-estudio-sonidos style={{ color: OSCURO, padding: embebido ? 0 : '16px 16px 80px', maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18, fontFamily: "'Geist',system-ui,sans-serif" }}>
      {!embebido && <h1 style={{ margin: 0, font: `400 34px/1.05 ${SERIE}` }}>Sonidos</h1>}
      <p style={{ margin: 0, font: "400 13.5px/1.5 'Geist'", color: 'rgba(28,34,48,.65)' }}>
        Cada animación se ve dentro de un iPhone, tal cual sale en la app y con su sonido cuadrado. Toca [▶ Ver con sonido]; elige un candidato, silencia o mueve los de Code, o suma sonidos tuyos y de otras animaciones. Esta página no cambia ningún sonido de la app.
      </p>

      {/* Lo guardado: todo queda en ESTE navegador (nunca en un servidor). */}
      <div data-barra-guardado style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" data-descargar-todo onClick={() => void descargarTodo()} style={botonOscuro}>Descargar todo lo guardado</button>
        <input ref={entradaZip} type="file" data-cargar-zip accept=".zip,application/zip" hidden onChange={(ev) => void cargarZip(ev.target.files?.[0])} />
        <button type="button" data-cargar-zip-boton onClick={() => entradaZip.current?.click()} style={boton}>Cargar un zip</button>
        {aviso && <span data-aviso-guardado role="status" style={{ font: "500 12.5px 'Geist'", color: 'rgba(28,34,48,.7)' }}>{aviso}</span>}
      </div>
      {almacen === false && <p data-aviso-sin-almacen role="alert" style={{ margin: 0, padding: '10px 14px', borderRadius: 12, background: '#FBEAE6', border: '1.5px solid #A33A2A', font: "500 13px/1.45 'Geist'", color: '#7A2A1D' }}>{AVISO_SIN_ALMACEN}</p>}

      {/* La tarjeta abierta (marco de iPhone, sonidos de Code, mis sonidos, línea de tiempo). */}
      <div data-tarjeta-abierta={anim.id} style={{ borderRadius: 24, background: '#FFFFFF', border: `1.5px solid ${ORO}`, boxShadow: '0 18px 34px -22px rgba(28,34,48,.5)', padding: movil ? 16 : 22, display: 'flex', flexDirection: movil ? 'column' : 'row', alignItems: movil ? 'center' : 'flex-start', gap: movil ? 18 : 26 }}>
        {marco}
        <div style={{ flex: 1, minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={etiqueta}>{anim.grupo.toUpperCase()}</span>
            <span data-nombre-abierta style={{ font: `400 30px/1.05 ${SERIE}` }}>{anim.nombre}</span>
            <span data-dura style={{ font: "500 12px 'Geist Mono',monospace", color: 'rgba(28,34,48,.55)' }}>dura {coma(dura, 1)} s{linea.seguir !== null ? ' (hasta [Seguir])' : ''} con su sonido</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" data-ver-con-sonido onClick={() => void ver(anim.id)} disabled={!visorListo} style={{ ...botonOscuro, display: 'flex', alignItems: 'center', gap: 9, height: 48, padding: '0 20px', opacity: visorListo ? 1 : 0.5 }}>
              <Triangulo /> Ver con sonido
            </button>
            <button type="button" data-repetir onClick={() => void ver(anim.id)} disabled={!visorListo || !haSonado} style={{ ...boton, height: 48, opacity: visorListo && haSonado ? 1 : 0.5 }}>
              Repetir
            </button>
          </div>
          {/* Guardar / Eliminar lo guardado de ESTA animación. */}
          <div data-guardado-de-la-animacion style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" data-guardar onClick={() => void guardar()} style={botonOscuro}>Guardar</button>
            {g && !pendiente && <span data-estado-guardado style={{ font: "600 12.5px 'Geist'", color: '#2F6B43' }}>Guardado ✓ · {hhmm(g.en)}</span>}
            {pendiente && <span data-sin-guardar style={{ padding: '3px 10px', borderRadius: 999, background: '#FFF1D6', border: '1px solid #D8BE84', font: "700 11.5px 'Geist'", color: '#8E6820' }}>Sin guardar</span>}
            {!borrando && (
              <button type="button" data-eliminar-guardado disabled={!g} onClick={() => setBorrando(true)} style={{ ...boton, opacity: g ? 1 : 0.45 }}>
                Eliminar lo guardado
              </button>
            )}
            {borrando && (
              <span data-confirmar-borrar style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', font: "600 13px 'Geist'" }}>
                ¿Borrar lo guardado de {anim.nombre}?
                <button type="button" data-borrar-si onClick={() => void eliminarGuardado()} style={{ ...botonPeq, background: '#A33A2A', color: '#fff', border: '1.5px solid #A33A2A' }}>Sí, borrar</button>
                <button type="button" data-borrar-no onClick={() => setBorrando(false)} style={botonPeq}>No</button>
              </span>
            )}
          </div>
          {anim.otrasEscenas && (
            <div data-otras-escenas={anim.destinoDeEscenas} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={etiqueta}>VER OTRA ESCENA (el sonido guardado vale para todas)</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {anim.otrasEscenas.map((e) => {
                  const activa = (escenaMostrada[anim.id] ?? anim.otrasEscenas?.[0]?.id) === e.id
                  return (
                    <button
                      key={e.id}
                      type="button"
                      data-ver-escena={e.id}
                      aria-pressed={activa}
                      disabled={!visorListo}
                      onClick={() => {
                        escenaVista.current[anim.id] = e.id
                        setEscenaMostrada((x) => ({ ...x, [anim.id]: e.id }))
                        void ver(anim.id)
                      }}
                      style={{ ...botonPeq, background: activa ? OSCURO : '#FFFFFF', color: activa ? '#FFFFFF' : OSCURO, border: `1.5px solid ${activa ? OSCURO : 'rgba(28,34,48,.2)'}`, opacity: visorListo ? 1 : 0.5 }}
                    >
                      {e.nombre}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          {anim.nota && <span data-nota-de-la-animacion style={{ font: "400 12.5px/1.45 'Geist'", color: '#8E6820' }}>{anim.nota}</span>}

          {/* Los sonidos de Code, cada uno en su fila. */}
          <div data-sonidos-de-code style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <span style={etiqueta}>SONIDOS DE CODE</span>
              <button type="button" data-silenciar-todos aria-pressed={todosSilenciados} onClick={silenciarTodos} disabled={!visorListo} style={{ ...botonPeq, background: todosSilenciados ? '#A33A2A' : '#FFFFFF', color: todosSilenciados ? '#FFFFFF' : OSCURO, border: `1.5px solid ${todosSilenciados ? '#A33A2A' : 'rgba(28,34,48,.2)'}` }}>
                {todosSilenciados ? 'Activar todos los de Code' : 'Silenciar todos los de Code'}
              </button>
            </div>
            {deCode.length === 0 && <span style={{ font: "400 13px/1.4 'Geist'", color: 'rgba(28,34,48,.6)' }}>Esta animación no tiene sonidos de Code.</span>}
            {deCode.map((c, k) => {
              const letras = c.tipo === 'archivo' ? LETRAS.filter((l) => mf?.[c.id]?.[l]) : []
              const apagado = susSilencios.includes(c.clave)
              const v = e.volumenes[c.claveVolumen] ?? volumenDe(c.claveVolumen)
              const laLetra = e.letras[c.id] ?? versionDe(c.id)
              const aj = ajusteDe(c.clave)
              const movido = aj.ms !== 0 || aj.empieza !== 'sitio'
              return (
                <div key={c.clave} data-sonido={c.id} data-sonido-clave={c.clave} data-silenciado={apagado ? '1' : '0'} data-movido={movido ? '1' : '0'} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', borderRadius: 14, border: `1px solid ${apagado ? 'rgba(163,58,42,.4)' : 'rgba(28,34,48,.1)'}`, background: apagado ? 'rgba(163,58,42,.05)' : '#FFFFFF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ font: `${k === 0 ? 700 : 600} 13px 'Geist'`, textDecoration: apagado ? 'line-through' : 'none', opacity: apagado ? 0.6 : 1 }}>
                      {nombreDe(c.id)}
                      {c.tipo === 'sint' ? ' · hecho por código' : ''}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {apagado && <b data-estado-silenciado style={{ font: "700 11px 'Geist Mono',monospace", color: '#A33A2A', letterSpacing: '.08em' }}>SILENCIADO</b>}
                      <button type="button" data-silenciar={c.clave} aria-pressed={apagado} onClick={() => alternarSilencio(c.clave)} disabled={!visorListo} style={{ ...botonPeq, background: apagado ? '#A33A2A' : '#FFFFFF', color: apagado ? '#FFFFFF' : OSCURO, border: `1.5px solid ${apagado ? '#A33A2A' : 'rgba(28,34,48,.2)'}` }}>
                        {apagado ? 'Activar' : 'Silenciar'}
                      </button>
                    </span>
                  </div>
                  {letras.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', opacity: apagado ? 0.45 : 1 }}>
                      {letras.map((l) => {
                        const on = !apagado && laLetra === l
                        return (
                          <button key={l} type="button" data-candidato={`${c.id}:${l}`} aria-pressed={on} onClick={() => elegirCandidato(c.id, l)} disabled={!visorListo} style={{ flex: '1 1 100px', minWidth: 100, height: 54, borderRadius: 14, background: on ? OSCURO : '#FFFFFF', color: on ? '#FFFDF8' : OSCURO, border: `1.5px solid ${on ? OSCURO : 'rgba(28,34,48,.18)'}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', font: "700 13.5px 'Geist'", whiteSpace: 'nowrap', cursor: 'pointer' }}>
                            <span style={{ width: 28, height: 28, borderRadius: '50%', background: on ? '#F3D88F' : OSCURO, color: on ? OSCURO : '#F3D88F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Triangulo t={11} />
                            </span>
                            Sonido {l}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ font: "600 12.5px 'Geist'", width: 62 }}>Volumen</span>
                    <input type="range" data-volumen-candidato={c.claveVolumen} min={0} max={2} step={0.05} value={v} aria-label={`Volumen de ${nombreDe(c.id)}`} style={{ flex: 1, minHeight: 44, accentColor: ORO }} onChange={(ev) => ponerVolumen(c.claveVolumen, Number(ev.target.value))} onPointerUp={() => void ver(anim.id)} onKeyUp={() => void ver(anim.id)} />
                    <b data-volumen-candidato-valor={c.claveVolumen} style={{ font: "700 12.5px 'Geist'", width: 52, textAlign: 'right' }}>{Math.round(v * 100)} %</b>
                  </div>
                  {!apagado && (
                    <ControlDeMomento
                      pre="code-"
                      ms={aj.ms}
                      empieza={aj.empieza}
                      opciones={[['sitio', 'Donde está ahora'], ['principio', 'Al empezar la animación'], ['golpe', 'En el golpe']]}
                      limite={limite}
                      significado={aj.empieza === 'sitio' ? '0 ms es su sitio de siempre.' : aj.empieza === 'principio' ? '0 ms es el primer fotograma de la animación.' : `0 ms es el golpe (a los ${coma(golpe, 1)} s).`}
                      alCambiarMs={(n) => ponerAjuste(c.clave, { ms: n })}
                      alCambiarEmpieza={(x) => {
                        ponerAjuste(c.clave, { empieza: x as EmpiezaCode })
                        void ver(anim.id, { ajustes: { ...e.ajustes, [c.clave]: { ...aj, empieza: x as EmpiezaCode } } })
                      }}
                      alSoltar={() => void ver(anim.id)}
                      volver={movido ? () => volverASuSitio(c.clave) : undefined}
                    />
                  )}
                  {c.tipo === 'archivo' && !apagado && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <button type="button" data-editar-code={c.id} aria-pressed={editando === `code:${claveEd(c.id, laLetra)}`} onClick={() => void abrirEditorDeCode(c.id, laLetra)} disabled={!visorListo} style={{ ...botonPeq, background: editando === `code:${claveEd(c.id, laLetra)}` ? '#2A4A94' : '#FFFFFF', color: editando === `code:${claveEd(c.id, laLetra)}` ? '#FFFFFF' : '#2A4A94', border: '1.5px solid #2A4A94' }}>
                          Editar
                        </button>
                        {e.ediciones[claveEd(c.id, laLetra)] && <span data-retocado style={{ font: "600 11.5px 'Geist'", color: '#2A4A94' }}>Retocado: {descripcionDe(e.ediciones[claveEd(c.id, laLetra)])}</span>}
                      </div>
                      {editando === `code:${claveEd(c.id, laLetra)}` && originalesCode[claveEd(c.id, laLetra)] && (
                        <EditorDeSonido
                          original={originalesCode[claveEd(c.id, laLetra)]}
                          retoques={e.ediciones[claveEd(c.id, laLetra)] ?? SIN_RETOQUES}
                          alCambiar={(x) => void retocarCode(c.id, laLetra, x)}
                          puedeDeshacer={(historial.current[`code:${claveEd(c.id, laLetra)}`]?.length ?? 0) > 0}
                          alDeshacer={() => deshacerDe(`code:${claveEd(c.id, laLetra)}`, (x) => void retocarCode(c.id, laLetra, x, false))}
                          alVolverAlOriginal={() => void retocarCode(c.id, laLetra, SIN_RETOQUES)}
                          repetirAlCambiar={repetirAlCambiar}
                          alMarcarRepetir={marcarRepetir}
                        />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Los sonidos de Eric y los añadidos de Code: capas que se suman. */}
          <div data-probar-propio style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4, borderTop: '1px solid rgba(28,34,48,.08)' }}>
            <input ref={entrada} type="file" data-archivo-propio accept="audio/*,.mp3,.m4a,.wav,.ogg" hidden onChange={(ev) => void alElegirArchivo(ev.target.files?.[0])} />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', paddingTop: 12 }}>
              <span style={etiqueta}>MIS SONIDOS (se suman a los de Code)</span>
            </div>
            {capasDeEric.map((c, k) => (
              <div key={c.id} data-propio-activo data-capa={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 14px', borderRadius: 14, border: `1.5px solid ${ORO}`, background: '#FFFBF0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span data-nombre-propio style={{ font: "600 13px 'Geist'", overflowWrap: 'anywhere' }}>Tu sonido {k + 1}: {c.nombre}</span>
                  <span style={{ display: 'flex', gap: 8 }}>
                    <button type="button" data-editar-capa={c.id} aria-pressed={editando === `capa:${c.id}`} onClick={() => setEditando(editando === `capa:${c.id}` ? null : `capa:${c.id}`)} style={{ ...botonPeq, background: editando === `capa:${c.id}` ? '#2A4A94' : '#FFFFFF', color: editando === `capa:${c.id}` ? '#FFFFFF' : '#2A4A94', border: '1.5px solid #2A4A94' }}>Editar</button>
                    <button type="button" data-quitar-propio onClick={() => quitarCapa(c.id)} style={botonPeq}>Quitar</button>
                  </span>
                </div>
                {c.retoques && !sinCambios(c.retoques) && <span data-retocado style={{ font: "600 11.5px 'Geist'", color: '#2A4A94' }}>Retocado: {descripcionDe(c.retoques)}</span>}
                {editando === `capa:${c.id}` && c.original && (
                  <EditorDeSonido original={c.original} retoques={c.retoques ?? SIN_RETOQUES} alCambiar={(x) => void retocarCapa(c.id, x)} puedeDeshacer={(historial.current[`capa:${c.id}`]?.length ?? 0) > 0} alDeshacer={() => deshacerDe(`capa:${c.id}`, (x) => void retocarCapa(c.id, x, false))} alVolverAlOriginal={() => void retocarCapa(c.id, SIN_RETOQUES)} repetirAlCambiar={repetirAlCambiar} alMarcarRepetir={marcarRepetir} />
                )}
                <ControlDeMomento
                  ms={c.ms}
                  empieza={c.empieza}
                  opciones={[['principio', 'Al empezar la animación'], ['golpe', 'En el golpe']]}
                  limite={limite}
                  significado={`${c.empieza === 'principio' ? '0 ms es el primer fotograma de la animación.' : `0 ms es el golpe (a los ${coma(golpe, 1)} s).`} Tu sonido arranca a los ${coma(arranqueDelPropio(c, golpe), 2)} s y dura ${coma(c.buffer.duration)} s.`}
                  alCambiarMs={(n) => ponerCapa(c.id, { ms: n })}
                  alCambiarEmpieza={(x) => {
                    ponerCapa(c.id, { empieza: x as Empieza })
                    void ver(anim.id, { capas: susCapas.map((y) => (y.id === c.id ? { ...y, empieza: x as Empieza } : y)) })
                  }}
                  alSoltar={() => void ver(anim.id)}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ font: "600 12.5px 'Geist'", width: 62 }}>Volumen</span>
                  <input type="range" data-vol-propio min={0} max={2} step={0.05} value={c.vol} aria-label="Volumen de tu sonido" style={{ flex: 1, minHeight: 44, accentColor: ORO }} onChange={(ev) => ponerCapa(c.id, { vol: Number(ev.target.value) })} onPointerUp={() => void ver(anim.id)} onKeyUp={() => void ver(anim.id)} />
                  <b data-vol-propio-valor style={{ font: "700 12.5px 'Geist'", width: 52, textAlign: 'right' }}>{Math.round(c.vol * 100)} %</b>
                </div>
              </div>
            ))}
            {capasAnadidas.map((c) => (
              <div key={c.id} data-capa-anadida data-capa={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 14px', borderRadius: 14, border: '1.5px solid rgba(28,34,48,.25)', background: '#F7F1E4' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span data-nombre-anadida style={{ font: "600 13px 'Geist'", overflowWrap: 'anywhere' }}>Añadido de Code: {c.nombre}</span>
                  <span style={{ display: 'flex', gap: 8 }}>
                    <button type="button" data-editar-capa={c.id} aria-pressed={editando === `capa:${c.id}`} onClick={() => setEditando(editando === `capa:${c.id}` ? null : `capa:${c.id}`)} style={{ ...botonPeq, background: editando === `capa:${c.id}` ? '#2A4A94' : '#FFFFFF', color: editando === `capa:${c.id}` ? '#FFFFFF' : '#2A4A94', border: '1.5px solid #2A4A94' }}>Editar</button>
                    <button type="button" data-quitar-anadida onClick={() => quitarCapa(c.id)} style={botonPeq}>Quitar</button>
                  </span>
                </div>
                {c.retoques && !sinCambios(c.retoques) && <span data-retocado style={{ font: "600 11.5px 'Geist'", color: '#2A4A94' }}>Retocado: {descripcionDe(c.retoques)}</span>}
                {editando === `capa:${c.id}` && c.original && (
                  <EditorDeSonido original={c.original} retoques={c.retoques ?? SIN_RETOQUES} alCambiar={(x) => void retocarCapa(c.id, x)} puedeDeshacer={(historial.current[`capa:${c.id}`]?.length ?? 0) > 0} alDeshacer={() => deshacerDe(`capa:${c.id}`, (x) => void retocarCapa(c.id, x, false))} alVolverAlOriginal={() => void retocarCapa(c.id, SIN_RETOQUES)} repetirAlCambiar={repetirAlCambiar} alMarcarRepetir={marcarRepetir} />
                )}
                <ControlDeMomento
                  pre="anadida-"
                  ms={c.ms}
                  empieza={c.empieza}
                  opciones={[['principio', 'Al empezar la animación'], ['golpe', 'En el golpe']]}
                  limite={limite}
                  significado={`${c.empieza === 'principio' ? '0 ms es el primer fotograma de la animación.' : `0 ms es el golpe (a los ${coma(golpe, 1)} s).`} Arranca a los ${coma(arranqueDelPropio(c, golpe), 2)} s y dura ${coma(c.buffer.duration)} s.`}
                  alCambiarMs={(n) => ponerCapa(c.id, { ms: n })}
                  alCambiarEmpieza={(x) => {
                    ponerCapa(c.id, { empieza: x as Empieza })
                    void ver(anim.id, { capas: susCapas.map((y) => (y.id === c.id ? { ...y, empieza: x as Empieza } : y)) })
                  }}
                  alSoltar={() => void ver(anim.id)}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ font: "600 12.5px 'Geist'", width: 62 }}>Volumen</span>
                  <input type="range" data-anadida-vol min={0} max={2} step={0.05} value={c.vol} aria-label="Volumen del sonido añadido" style={{ flex: 1, minHeight: 44, accentColor: ORO }} onChange={(ev) => ponerCapa(c.id, { vol: Number(ev.target.value) })} onPointerUp={() => void ver(anim.id)} onKeyUp={() => void ver(anim.id)} />
                  <b data-anadida-vol-valor style={{ font: "700 12.5px 'Geist'", width: 52, textAlign: 'right' }}>{Math.round(c.vol * 100)} %</b>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {capasDeEric.length === 0 ? (
                <button type="button" data-boton-probar-propio onClick={() => entrada.current?.click()} disabled={!visorListo} style={{ ...boton, alignSelf: 'flex-start', height: 44, display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 15V4M8 8l4-4 4 4M5 20h14" /></svg>
                  Probar con mi sonido
                </button>
              ) : (
                <button type="button" data-anadir-otro onClick={() => entrada.current?.click()} disabled={!visorListo} style={{ ...boton, alignSelf: 'flex-start', height: 44, padding: '0 20px' }}>
                  + Añadir otro sonido mío
                </button>
              )}
              <button type="button" data-anadir-de-code onClick={() => setSelector((s) => !s)} disabled={!visorListo} style={{ ...boton, alignSelf: 'flex-start', height: 44, padding: '0 20px' }}>
                + Añadir un sonido de Code
              </button>
            </div>
            {selector && (
              <div data-selector-de-code style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 14, border: '1.5px solid rgba(28,34,48,.2)', background: '#FFFFFF' }}>
                <input data-buscar-candidato value={buscar} onChange={(ev) => setBuscar(ev.target.value)} placeholder="Buscar (por ejemplo: emblema, redoble, C)" aria-label="Buscar un sonido de Code" style={{ minHeight: 44, borderRadius: 12, border: '1.5px solid rgba(28,34,48,.2)', padding: '0 12px', font: "500 14px 'Geist'" }} />
                <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {visibles.length === 0 && <span style={{ font: "400 13px 'Geist'", color: 'rgba(28,34,48,.55)' }}>No hay ningún sonido con ese nombre.</span>}
                  {visibles.map((c) => (
                    <div key={`${c.archivo}:${c.letra}`} data-candidato-de-code={`${c.archivo}:${c.letra}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                      <button type="button" data-probar-candidato={`${c.archivo}:${c.letra}`} aria-label={`Oír ${c.rotulo}`} onClick={() => void probarCandidato(c)} style={{ ...botonPeq, width: 44, padding: 0, borderRadius: '50%', background: OSCURO, color: '#F3D88F' }}>
                        <Triangulo t={13} />
                      </button>
                      <span style={{ flex: 1, font: "500 13px 'Geist'" }}>{c.rotulo}</span>
                      <button type="button" data-anadir-candidato={`${c.archivo}:${c.letra}`} onClick={() => void anadirDeCode(c)} style={botonPeq}>Añadir</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <span style={{ font: "400 11.5px/1.4 'Geist'", color: 'rgba(28,34,48,.55)' }}>El archivo no se sube a ningún sitio: se queda en este navegador (lo guardado, también).</span>
            {errorArchivo && <span role="alert" data-error-archivo style={{ font: "500 13px 'Geist'", color: '#A33A2A' }}>{errorArchivo}</span>}
            {espera > 0 && (
              <span data-aviso-espera style={{ font: "500 12px/1.4 'Geist'", color: '#8E6820' }}>
                Tu sonido empieza antes que la animación: la animación espera {Math.round(espera * 1000)} ms para que se oiga entero (no se recorta nada).
              </span>
            )}
          </div>

          <LineaDeTiempo
            filas={filas}
            dura={dura}
            golpe={golpe}
            marcas={linea.marcas}
            desde={puntoDesde}
            alArrastrar={arrastrar}
            alPonerSegundo={ponerSegundo}
            alElegirPunto={(tt) => setDesdeAqui((x) => ({ ...x, [anim.id]: Math.round(tt * 100) / 100 }))}
            alReproducirDesde={() => void ver(anim.id, undefined, { desde: puntoDesde ?? 0 })}
          />
        </div>
      </div>

      {/* Las tarjetas cerradas, por grupos. */}
      {(['Medallas', 'Logros', 'Escenas', 'Resúmenes', 'Apertura', 'Sonidos cortos'] as const).map((gr) => (
        <div key={gr} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={etiqueta}>{gr.toUpperCase()}</span>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${movil ? 2 : 4},minmax(0,1fr))`, gap: 14 }}>
            {ANIMACIONES.filter((a) => a.grupo === gr).map((a) => {
              const d = duracionDe(a)
              const aviso1 = solo(a)
              return (
                <button key={a.id} type="button" data-animacion-tarjeta={a.id} aria-pressed={a.id === anim.id} onClick={() => abrirY(a.id)} style={{ textAlign: 'left', padding: 14, borderRadius: 18, background: '#FFFFFF', border: a.id === anim.id ? `1.5px solid ${ORO}` : '1px solid rgba(28,34,48,.08)', display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer' }}>
                  <span style={{ font: "600 13.5px/1.25 'Geist'" }}>{a.nombre}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 34, height: 34, borderRadius: '50%', background: OSCURO, color: '#F3D88F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Triangulo t={13} /></span>
                    <span style={{ flex: 1, height: 6, borderRadius: 6, background: FONDO_BARRA }} />
                    <span style={{ font: "500 11.5px 'Geist'", color: 'rgba(28,34,48,.5)' }}>{coma(d, 1)} s</span>
                  </span>
                  {aviso1 && <span data-solo-uno style={{ font: "500 11px/1.3 'Geist'", color: '#8E6820' }}>{aviso1}</span>}
                  {sinGuardar(a.id) ? <span data-tarjeta-sin-guardar style={{ alignSelf: 'flex-start', padding: '2px 8px', borderRadius: 999, background: '#FFF1D6', border: '1px solid #D8BE84', font: "700 10.5px 'Geist'", color: '#8E6820' }}>Sin guardar</span> : guardados[a.id] ? <span data-tarjeta-guardada style={{ font: "600 11px 'Geist'", color: '#2F6B43' }}>Guardado ✓</span> : null}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <section style={{ padding: 16, borderRadius: 18, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.08)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ font: "600 14px 'Geist'" }}>Volumen general</span>
        <input type="range" data-volumen-general min={0} max={1} step={0.05} value={vol} aria-label="Volumen general" style={{ width: '100%', minHeight: 44, accentColor: ORO }} onChange={(ev) => { setVol(Number(ev.target.value)); ponerVolumenGeneral(Number(ev.target.value)) }} />
      </section>

      <section style={{ padding: 16, borderRadius: 18, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.08)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 style={{ margin: 0, font: `400 24px ${SERIE}` }}>Lo elegido</h2>
        <pre data-lo-elegido data-resumen-elegido style={{ margin: 0, whiteSpace: 'pre-wrap', font: "500 13px/1.6 'Geist Mono',monospace" }}>{elegido}</pre>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" data-copiar-elegido style={{ ...botonOscuro, alignSelf: 'flex-start' }} onClick={() => { void navigator.clipboard?.writeText(elegido).then(() => setCopiado(true)).catch(() => undefined) }}>{copiado ? 'Copiado' : 'Copiar'}</button>
        </div>
        <p data-aviso-propios style={{ margin: 0, padding: '12px 14px', borderRadius: 14, background: '#FFFBF0', border: '1.5px solid #D8BE84', font: "500 13px/1.5 'Geist'" }}>{AVISO_DE_LOS_SONIDOS_PROPIOS}.</p>
      </section>
    </div>
  )
}

/** La letra con la que suena un sonido grabado en el estado de una animación (la suya, o la de siempre). */
function versionDeEn(e: EstadoRT, id: string): Letra {
  return e.letras[id] ?? versionDe(id)
}

// (Para que las otras piezas del estudio tengan un estado vacío con la misma forma.)
export const estadoVacioDelEstudio = ESTADO_VACIO
