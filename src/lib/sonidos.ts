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

const CLAVE_SONIDO = 'trazo:sonido'

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
let lista: ListaDeSonidos | null = null
const buffers = new Map<string, AudioBuffer>()

function contextoDeAudio(): AudioContext | null {
  if (contexto) return contexto
  try {
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
export async function sonar(momento: string): Promise<void> {
  if (!sonidoActivado()) return
  // (Tanda 10N4) Para las pruebas: cada vez que de verdad se pide un sonido, queda apuntado.
  try {
    ;((window as unknown as { __sonidosPedidos?: string[] }).__sonidosPedidos ??= []).push(momento)
  } catch {
    /* nada */
  }
  const ctx = contextoDeAudio()
  if (!ctx) return
  try {
    if (ctx.state === 'suspended') await ctx.resume()
    const buffer = await cargar(momento)
    if (!buffer) return
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
export function reproducirMomentos(tipos: string[]) {
  const s = sonidoDeMomentos(tipos)
  if (!s) return
  void sonar(s)
  vibrar(s)
}

let escuchandoElToque = false
/**
 * (Tanda 10N4 §4b) En el iPhone la web solo puede sonar si la persona ya ha tocado la pantalla alguna vez desde que abrió la app: en el primer toque se prepara el audio (se crea y se reanuda),
 * para que el aviso que llegue después pueda sonar. Si el navegador no deja, no pasa nada. Se llama una vez al montar el anfitrión de avisos.
 */
export function prepararAudioAlPrimerToque() {
  if (escuchandoElToque || typeof window === 'undefined') return
  escuchandoElToque = true
  const alToque = () => {
    window.removeEventListener('pointerdown', alToque, true)
    window.removeEventListener('touchend', alToque, true)
    try {
      const ctx = contextoDeAudio()
      if (ctx && ctx.state === 'suspended') void ctx.resume().catch(() => undefined)
    } catch {
      /* sin audio */
    }
  }
  window.addEventListener('pointerdown', alToque, true)
  window.addEventListener('touchend', alToque, true)
}
