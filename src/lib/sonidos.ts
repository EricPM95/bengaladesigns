/**
 * LOS SONIDOS Y LA VIBRACIÓN DE LOS MOMENTOS (Tanda 8A: preparados; los sonidos de verdad los pondrá Eric después, sin tocar el código).
 *
 * Una sola función para hacer sonar cada momento: `sonar('emblema')`. Qué archivo suena en cada uno sale de `public/sonidos/sonidos.json` (provisionales, ligeros, de 1 a 3
 * segundos); para poner los de verdad se cambian los archivos o esa lista.
 *
 * Reglas:
 *   - suena al tocar [Visto], que es cuando el móvil deja sonar (el primer toque «desbloquea» el audio);
 *   - un ajuste para quitar el sonido siempre (se usa en iglesias y museos): `ponerSonido(false)`;
 *   - respeta el modo silencio donde el navegador lo permite: se usa Web Audio con la sesión de audio en «ambiente» (`navigator.audioSession`, Safari 16.4 o más).
 *     iPhone: el interruptor de silencio lo respeta el audio de Web Audio; Android: el navegador no puede saber si el móvil está en silencio (solo manda el volumen
 *     multimedia). Es lo que dice la teoría: Eric tiene que comprobarlo en su iPhone y en un Android.
 *   - la vibración es pequeña y solo sale donde el móvil la permite (Android con Chrome; el iPhone no deja a las webs vibrar).
 * Con los logros apagados nadie llama a esto.
 */

import { partituraDe, type OpcionesDePartitura } from './sonidos/partituras'
import { cortar, finSonoroDe, iniciarPartitura, precargar, FUNDIDO_AL_SALTAR_MS } from './sonidos/motor'

const CLAVE_SONIDO = 'trazo:sonido'

/** (V29) «Reducir movimiento» del móvil: las animaciones son más cortas y el sonido las sigue. */
const movimientoReducido = (): boolean => {
  try {
    return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  } catch {
    return false
  }
}

/** (V29) El viajero salta la animación: lo que suena se corta con un fundido corto (nunca de golpe ni dejándolo sonar debajo de la siguiente). */
/** (V29) El contexto de audio de la app (para la página de sonidos del administrador). */
export function contextoDeAudioDeLaApp(): AudioContext | null {
  return contextoDeAudio()
}

export function cortarSonidos(fundidoMs = FUNDIDO_AL_SALTAR_MS): void {
  if (contexto) cortar(contexto, fundidoMs)
}

/** (V30) Corta (con fundido) solo la partitura `id` (la escena que se cierra no corta lo que ya suena de la pantalla siguiente). */
export function cortarSonidoDe(id: string, fundidoMs = FUNDIDO_AL_SALTAR_MS): void {
  if (contexto) cortar(contexto, fundidoMs, { id })
}

/** (V38B) Cuándo acaba de sonar de verdad el pedazo (segundos desde que se pide), con lo que hay ahora en el estudio: los pedazos de una pantalla empiezan uno detrás de otro con este número. */
export const finSonoroDelPedazo = (): number => finSonoroDe('pedazo', { reducido: movimientoReducido() })

/** (V29) Tener listos los archivos de premio de la siguiente animación (si hace falta), sin que suene nada. */
export function prepararSonido(momento: string, extra: OpcionesDePartitura = {}): void {
  const ctx = contextoDeAudio()
  if (!ctx || !sonidoActivado()) return
  void precargar(ctx, momento, { reducido: movimientoReducido(), ...extra }).catch(() => undefined)
}

interface ListaDeSonidos {
  maximo_segundos?: number
  sonidos: Record<string, string>
}

/** Los momentos por importancia: cuando se ganan varias cosas de golpe suena la más importante. */
export const IMPORTANCIA_DE_MOMENTOS = ['maravilla', 'emblema', 'sello', 'coleccion', 'patrimonio', 'pais', 'viajero', 'pedazo', 'visto']
const DE_TIPO_A_SONIDO: Record<string, string> = {
  emblema: 'emblema',
  suma: 'pedazo',
  suma_sello: 'pedazo',
  coleccion: 'coleccion',
  sello: 'sello',
  pais: 'pais',
  destino_nuevo: 'pais',
  continente: 'pais',
  maravilla: 'maravilla',
  patrimonio: 'patrimonio',
  viajero: 'viajero',
}

/** Pura: de los tipos de momento que se acaban de ganar, el sonido que toca (el más importante), o null si ninguno suena. */
export function sonidoDeMomentos(tipos: string[]): string | null {
  const sonidos = tipos.map((t) => DE_TIPO_A_SONIDO[t]).filter(Boolean)
  for (const s of IMPORTANCIA_DE_MOMENTOS) if (sonidos.includes(s)) return s
  return null
}

export function sonidoActivado(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_SONIDO) !== 'no'
  } catch {
    return true
  }
}
export function ponerSonido(activo: boolean) {
  try {
    window.localStorage.setItem(CLAVE_SONIDO, activo ? 'si' : 'no')
  } catch {
    /* sin almacenamiento */
  }
}

let contexto: AudioContext | null = null
/** Un sonido que no pudo salir porque el audio estaba parado: suena en el siguiente toque solo si es muy reciente (menos de 3 s: V38C, un sonido que llega con la animación ya acabada no suena). */
let pendiente: { momento: string; en: number } | null = null
let lista: ListaDeSonidos | null = null
const buffers = new Map<string, AudioBuffer>()

function contextoDeAudio(): AudioContext | null {
  if (contexto) return contexto
  try {
    // (V34C) El visor de la página de sonidos (un marco dentro de /admin/sonidos) usa el audio de la página que lo contiene: el primer toque se da allí y suena a la primera, también en el iPhone.
    if (window.parent !== window) {
      const prestado = (window.parent as unknown as { __estudioContexto?: AudioContext }).__estudioContexto
      if (prestado) {
        contexto = prestado
        return contexto
      }
    }
    const Clase = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Clase) return null
    const sesion = (navigator as unknown as { audioSession?: { type: string } }).audioSession
    if (sesion) sesion.type = 'ambient' // (respeta el interruptor de silencio del iPhone)
    contexto = new Clase()
    return contexto
  } catch {
    return null
  }
}

async function cargar(momento: string): Promise<AudioBuffer | null> {
  const ctx = contextoDeAudio()
  if (!ctx) return null
  if (buffers.has(momento)) return buffers.get(momento) ?? null
  try {
    lista ??= (await (await fetch('/sonidos/sonidos.json')).json()) as ListaDeSonidos
    const url = lista.sonidos[momento]
    if (!url) return null
    // Se carga al hacer falta, no al abrir la app.
    const buffer = await ctx.decodeAudioData(await (await fetch(url)).arrayBuffer())
    if (buffer.duration > (lista.maximo_segundos ?? 3) + 0.25) return null
    buffers.set(momento, buffer)
    return buffer
  } catch {
    return null
  }
}

/** Hace sonar un momento. Llamarla dentro del toque del dedo (el primer toque desbloquea el audio). Nunca lanza. */
export async function sonar(momento: string, extra: OpcionesDePartitura = {}): Promise<void> {
  if (!sonidoActivado()) return
  // (V35B) La apertura va en SILENCIO en la web (el navegador no deja sonar antes del primer toque): la app no la pide nunca. Solo el visor del estudio de sonidos (/admin/sonidos) puede oírla; queda lista para la app de las tiendas.
  if (momento === 'apertura' && !(window as unknown as { __estudioVisor?: unknown }).__estudioVisor) return
  // (Tanda 10N4) Para las pruebas: cada vez que de verdad se pide un sonido, queda apuntado.
  try {
    ;((window as unknown as { __sonidosPedidos?: string[] }).__sonidosPedidos ??= []).push(momento)
  } catch {
    /* nada */
  }
  const ctx = contextoDeAudio()
  if (!ctx) return
  // (V30) El instante en que la animación empezó de verdad: si el archivo tarda en llegar, la partitura sigue alineada con la animación (el sonido arranca a mitad, nunca tarde).
  const inicio = ctx.currentTime
  try {
    // (10N10) No solo 'suspended': en el iPhone, al volver de segundo plano o tras una llamada, el audio queda en 'interrupted' y el sonido se «tocaba» sin salir. Se reanuda (sin esperar para siempre: sin un toque reciente la
    // reanudación no llega) y, si sigue sin sonar, se deja apuntado para el siguiente toque (prepararAudioAlPrimerToque lo reproduce si es reciente).
    if (ctx.state !== 'running') {
      await Promise.race([ctx.resume().catch(() => undefined), new Promise((r) => setTimeout(r, 400))])
    }
    // (V29) Si la animación tiene partitura, cada sonido suena en su instante exacto (lo que dura el giro, el golpe al parar…); si no, el archivo de siempre.
    if (partituraDe(momento)) {
      const o = { reducido: movimientoReducido(), ...extra }
      await Promise.race([precargar(ctx, momento, o).catch(() => undefined), new Promise((r) => setTimeout(r, 300))])
      if (ctx.state !== 'running') {
        pendiente = { momento, en: Date.now() }
        return
      }
      iniciarPartitura(ctx, momento, ctx.state === 'running' && ctx.currentTime - inicio < 1.5 ? { ...o, en: inicio } : o)
      return
    }
    const buffer = await cargar(momento)
    if (!buffer) return
    if (ctx.state !== 'running') {
      pendiente = { momento, en: Date.now() }
      return
    }
    const fuente = ctx.createBufferSource()
    fuente.buffer = buffer
    fuente.connect(ctx.destination)
    fuente.start()
  } catch {
    /* sin audio: nada */
  }
}

const PATRONES: Record<string, number[]> = { visto: [18], pedazo: [20, 40, 20], coleccion: [30, 50, 30], sello: [40, 60, 40], emblema: [30, 40, 30, 40, 60], pais: [25, 40, 25], maravilla: [50, 60, 50, 60, 80] }
/** Una vibración pequeña, solo donde el móvil la deja. */
export function vibrar(momento: string): boolean {
  try {
    if (!sonidoActivado() || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false
    return navigator.vibrate(PATRONES[momento] ?? [20])
  } catch {
    return false
  }
}

/** Tras ganar cosas: suena y vibra lo más importante. */
export function reproducirMomentos(tipos: string[], momentos: { tipo?: string; grado?: unknown }[] = []) {
  let s = sonidoDeMomentos(tipos)
  if (!s) return
  // (V29) Un sello que sube de grado suena a la medalla de ese grado (bronce < plata < oro < diamante).
  if (s === 'sello') {
    const g = String(momentos.find((m) => m.tipo === 'sello')?.grado ?? '')
    if (['bronce', 'plata', 'oro', 'diamante'].includes(g)) s = `medalla_${g}`
  }
  void sonar(s)
  vibrar(s)
}

let escuchandoElToque = false
/**
 * (Tanda 10N4 §4b, 10N8 §2) En el iPhone la web solo puede sonar si la persona ya ha tocado la pantalla alguna vez desde que abrió la app. Lo que se vio en la 10N8: el audio se «desbloqueaba» solo en el PRIMER
 * toque y con `pointerdown`, y en Safari el desbloqueo vale con `touchend` / `click` (no con `pointerdown`); además, al volver de segundo plano iOS deja el audio en «interrupted» y solo otro toque lo reanuda.
 * Ahora cada toque (`touchend`, `click`, `pointerup`, `keydown`) comprueba que el audio esté sonando y, si no, lo reanuda y reproduce un instante de silencio (la forma de desbloquearlo en iOS), y el sonido del aviso se
 * deja ya descargado para que suene al momento cuando llegue. Se llama una vez al montar el anfitrión de avisos. Si el navegador no deja, no pasa nada.
 */
export function prepararAudioAlPrimerToque() {
  if (escuchandoElToque || typeof window === 'undefined') return
  escuchandoElToque = true
  const alToque = () => {
    try {
      const ctx = contextoDeAudio()
      if (!ctx) return
      if (ctx.state !== 'running') {
        void ctx.resume().catch(() => undefined)
        // Un instante de silencio: en iOS es lo que termina de desbloquear el audio.
        const vacio = ctx.createBuffer(1, 1, 22050)
        const fuente = ctx.createBufferSource()
        fuente.buffer = vacio
        fuente.connect(ctx.destination)
        fuente.start(0)
      }
      // El sonido del aviso, ya listo.
      if (!buffers.has('aviso')) void cargar('aviso')
      if (pendiente && Date.now() - pendiente.en < 3_000) {
        const m = pendiente.momento
        pendiente = null
        window.setTimeout(() => void sonar(m), 60)
      }
    } catch {
      /* sin audio */
    }
  }
  for (const evento of ['touchend', 'click', 'pointerup', 'keydown']) window.addEventListener(evento, alToque, { capture: true, passive: true })
}
