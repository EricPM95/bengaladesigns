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
import { cortar, estudioActual, finSonoroDe, fijarInicioDeLaAnimacion, iniciarPartitura, ponerEstudio, precargar, programarPropios, FUNDIDO_AL_SALTAR_MS } from './sonidos/motor'
import { animacionDe, SONIDOS_EFIMEROS } from './sonidos/animacionDe'
import { DURACION as DURACION_APERTURA } from '../../shared/marca/aperturaJutrip.js'
import { cargarEstudioDeEric, esperaDe, prepararEstudioDeEric } from './sonidos/estudioDeEric'

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
export function prepararSonido(momento: string, extra: OpcionesDePartitura & { animacion?: string } = {}): void {
  const ctx = contextoDeAudio()
  if (!ctx || !sonidoActivado()) return
  const { animacion, ...o } = extra
  const anim = animacion ?? animacionDe(momento)
  // (V40) Lo de Eric para esa animación (sus archivos), listo antes de que suene.
  if (anim && !enElVisor()) void prepararEstudioDeEric(ctx, anim).catch(() => undefined)
  void precargar(ctx, momento, { reducido: movimientoReducido(), ...o }).catch(() => undefined)
}

/** (V40) Dentro del visor del estudio de sonidos, el estudio manda: la app no pone lo de Eric por su cuenta. */
const enElVisor = (): boolean => Boolean((window as unknown as { __estudioVisor?: unknown }).__estudioVisor)

interface ListaDeSonidos {
  maximo_segundos?: number
  sonidos: Record<string, string>
}

/** Los momentos por importancia: cuando se ganan varias cosas de golpe suena la más importante. */
export const IMPORTANCIA_DE_MOMENTOS = ['maravilla', 'emblema', 'maravilla_nueva', 'sello', 'coleccion', 'patrimonio', 'pais', 'viajero', 'pedazo', 'visto']
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
  maravilla_nueva: 'maravilla_nueva',
  patrimonio: 'patrimonio',
  viajero: 'viajero',
}

/** Pura: de los tipos de momento que se acaban de ganar, el sonido que toca (el más importante), o null si ninguno suena. */
export function sonidoDeMomentos(tipos: string[], momentos: { tipo?: string; n?: unknown }[] = []): string | null {
  // (V39B) La 1.ª a la 6.ª maravilla tienen su pantalla «Una maravilla nueva» (su propio sonido); solo la 7.ª suena al final de las 7.
  const sonidos = tipos.map((t) => (t === 'maravilla' && momentos.some((m) => m.tipo === 'maravilla' && Number(m.n ?? 0) < 7) && !momentos.some((m) => m.tipo === 'maravilla' && Number(m.n ?? 0) >= 7) ? 'maravilla_nueva' : t)).map((t) => DE_TIPO_A_SONIDO[t]).filter(Boolean)
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
    // (V40B) El audio que ya se creó y desbloqueó con un toque durante la apertura (antes de que cargara la app) es el de la app.
    const deLaApertura = (window as unknown as { __ap?: { ctx: AudioContext | null } }).__ap?.ctx
    if (deLaApertura) {
      contexto = deLaApertura
      return contexto
    }
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

/**
 * (V40B) LA APERTURA CON SONIDO. La animación lleva su cuenta (index.html anota cuándo empezó, `window.__ap.t0`); el sonido entra SIEMPRE en el punto en que va:
 *   · si el navegador deja sonar al abrir (Android con la app instalada, ordenador), suena desde el principio, cuadrado con la animación;
 *   · si no (el iPhone, hasta el primer toque), en cuanto se toca la pantalla durante la apertura el audio se desbloquea y el sonido entra por su segundo «X» (lo que ya pasó, no suena; lo que está sonando entra a mitad);
 *   · con la apertura ya acabada no suena nada (nunca un sonido con la pantalla quieta, V38C); con «Reducir movimiento» o el sonido apagado, tampoco.
 * El sonido es lo que Eric eligió en el estudio para la apertura (`data/sonidos/estudio.json`) y, si no hay nada suyo, el candidato A. La apertura no espera al toque ni la corta el toque.
 */
export async function sonarApertura(): Promise<void> {
  const ap = (window as unknown as { __ap?: { t0: number; fin: boolean; ctx: AudioContext | null; cb: (() => void) | null } }).__ap
  if (!ap || !sonidoActivado() || movimientoReducido()) return
  const quedaApertura = (): boolean => !ap.fin && (performance.now() - ap.t0) / 1000 < DURACION_APERTURA
  let programada = false
  let intentando = false
  const intentar = (): void => {
    if (programada || intentando || !quedaApertura()) return
    const ctx = contextoDeAudio()
    if (!ctx) return
    // El resume va AQUÍ, sin esperar nada antes: si esto viene de un toque, cuenta como del toque.
    const reanudando = ctx.state !== 'running' ? ctx.resume().catch(() => undefined) : null
    intentando = true
    void (async () => {
      try {
        if (reanudando) await Promise.race([reanudando, new Promise((r) => setTimeout(r, 300))])
        if (ctx.state !== 'running' || !quedaApertura()) return
        // Lo de Eric (sus archivos) y los candidatos de Code, descargados ANTES de contar el punto en que va (la descarga no cuenta como tiempo de apertura).
        const est = await Promise.race([prepararEstudioDeEric(ctx, 'apertura').catch(() => null), new Promise<null>((r) => setTimeout(() => r(null), 2500))])
        const previo = estudioActual()
        ponerEstudio(est)
        const o = { reducido: false }
        await Promise.race([precargar(ctx, 'apertura', o).catch(() => undefined), new Promise((r) => setTimeout(r, 1500))])
        if (ctx.state !== 'running' || !quedaApertura()) {
          ponerEstudio(previo)
          return
        }
        programada = true
        // El primer fotograma de la animación, en el reloj del audio: lo ya pasado no suena y lo que está sonando entra a mitad.
        const t0 = ctx.currentTime - (performance.now() - ap.t0) / 1000
        ponerEstudio(est)
        fijarInicioDeLaAnimacion(ctx, t0)
        if (est) programarPropios(ctx, 'apertura', t0)
        iniciarPartitura(ctx, 'apertura', o)
        ;((window as unknown as { __sonidosPedidos?: string[] }).__sonidosPedidos ??= []).push('apertura')
      } finally {
        intentando = false
      }
    })()
  }
  // Cada toque durante la apertura vuelve a intentarlo (desbloquea el audio dentro del toque); si ya se pudo, no hace nada.
  ap.cb = intentar
  intentar() // si el navegador deja sonar al abrir
}

/** Hace sonar un momento. Llamarla dentro del toque del dedo (el primer toque desbloquea el audio). Nunca lanza. */
export async function sonar(momento: string, extra: OpcionesDePartitura & { animacion?: string } = {}): Promise<void> {
  if (!sonidoActivado()) return
  // (V40B) La apertura ya no va en silencio: la pide `sonarApertura` (con su cuenta del tiempo); nadie más la pide por esta vía.
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
      const { animacion, ...resto } = extra
      const o = { reducido: movimientoReducido(), ...resto }
      // (V40) Los sonidos definitivos de Eric: se aplican UNA vez al empezar la animación (la escena, las repeticiones de un pedazo y lo que ya está en el visor del estudio siguen con lo que hay).
      const anim = animacion ?? animacionDe(momento)
      const aplicar = !enElVisor() && momento !== 'escena' && !o.repeticion
      const efimero = SONIDOS_EFIMEROS.includes(momento)
      const est = aplicar && anim ? await Promise.race([prepararEstudioDeEric(ctx, anim).catch(() => null), new Promise<null>((r) => setTimeout(() => r(null), 4000))]) : null
      const previo = estudioActual()
      // Lo que se descarga depende de qué candidato suena (cada animación puede llevar el suyo): se pide con el estudio de esta animación puesto (la parte que mira el estudio es síncrona).
      if (aplicar) ponerEstudio(est)
      const cargando = precargar(ctx, momento, o).catch(() => undefined)
      if (aplicar && efimero) ponerEstudio(previo)
      await Promise.race([cargando, new Promise((r) => setTimeout(r, 300))])
      if (ctx.state !== 'running') {
        pendiente = { momento, en: Date.now() }
        return
      }
      const aTiempo = ctx.currentTime - inicio < 1.5
      if (aplicar) {
        const antes = estudioActual()
        ponerEstudio(est)
        // Como el estudio: un sonido de Eric que cae antes del primer fotograma no se recorta; el primer fotograma cuenta desde ahí.
        const espera = est && anim ? esperaDe(anim) : 0
        const t = (aTiempo ? inicio : ctx.currentTime) + 0.04 + espera
        fijarInicioDeLaAnimacion(ctx, t)
        if (est) programarPropios(ctx, anim as string, t)
        iniciarPartitura(ctx, momento, o)
        if (efimero) ponerEstudio(antes)
        return
      }
      iniciarPartitura(ctx, momento, aTiempo ? { ...o, en: inicio } : o)
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

const PATRONES: Record<string, number[]> = { visto: [18], pedazo: [20, 40, 20], coleccion: [30, 50, 30], sello: [40, 60, 40], emblema: [30, 40, 30, 40, 60], pais: [25, 40, 25], maravilla: [50, 60, 50, 60, 80], maravilla_nueva: [30, 40, 30] }
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
export function reproducirMomentos(tipos: string[], momentos: { tipo?: string; grado?: unknown; id?: unknown; destino?: unknown; n?: unknown; coleccion?: unknown }[] = []) {
  let s = sonidoDeMomentos(tipos, momentos)
  if (!s) return
  // (V29) Un sello que sube de grado suena a la medalla de ese grado (bronce < plata < oro < diamante).
  if (s === 'sello') {
    const g = String(momentos.find((m) => m.tipo === 'sello')?.grado ?? '')
    if (['bronce', 'plata', 'oro', 'diamante'].includes(g)) s = `medalla_${g}`
  }
  void sonar(s, { animacion: animacionDe(s, momentos) ?? undefined })
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
      // (V40) Lo de Eric (un trocito aparte): ya en la mano cuando llegue el primer sonido.
      void cargarEstudioDeEric()
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
