import { partituraDe, type Nota, type OpcionesDePartitura } from './partituras'
import { tocarSintetico, type Version } from './sintesis'

/** (V30) Los sonidos grabados tienen hasta cinco candidatos por momento (A a E). */
export type Letra = 'A' | 'B' | 'C' | 'D' | 'E'
export const LETRAS: Letra[] = ['A', 'B', 'C', 'D', 'E']

/**
 * (V29) EL MOTOR DE LAS PARTITURAS: toma la partitura de una animación (`partituras.ts`) y programa CADA sonido en su instante exacto con el reloj de audio (no con temporizadores: no se retrasa si el móvil va justo).
 *   · el golpe de un archivo de premio cae en el instante que dice la partitura: el motor arranca el archivo antes, restando el momento del golpe dentro del archivo (`manifiesto.json`);
 *   · cada partitura cuelga de su propio volumen (`master`): para saltar la animación se baja a cero con un fundido corto y se suelta (nunca de golpe, nunca dejando sonar debajo de la siguiente);
 *   · los premios no se solapan: un premio nuevo corta (con fundido) al anterior, así nunca suenan dos golpes finales a la vez;
 *   · versiones A, B y C de cada sonido y volumen general y por sonido: salen de lo que Eric elige en la página de sonidos (se guarda en el móvil).
 * Todo recibe el contexto de audio de `sonidos.ts` (que ya respeta el modo silencio y el primer toque). Aquí no hay ni una pregunta a Supabase: los archivos son de Vercel, con caché larga.
 */
const CLAVE_ELEGIDOS = 'jutrip.sonidos.elegidos'
const CLAVE_VOLUMEN = 'jutrip.sonidos.volumen'
const CLAVE_VOLUMEN_DE = 'jutrip.sonidos.volumen_de'
/** Margen entre «ahora» y el primer instante programado: lo que tarda el móvil en arrancar el audio sin cortar el principio. */
const ADELANTO = 0.04
export const FUNDIDO_AL_SALTAR_MS = 140

export interface DatosDeArchivo {
  nombre?: string
  fuentes?: string[]
  licencia?: string
  /** El instante, en segundos desde el principio del archivo, en que cae el golpe final. */
  golpe: number
  dura: number
  bytes: number
}
export type Manifiesto = Record<string, Partial<Record<Letra, DatosDeArchivo>>>

const leerJson = <T,>(clave: string, por: T): T => {
  try {
    const t = window.localStorage.getItem(clave)
    return t ? (JSON.parse(t) as T) : por
  } catch {
    return por
  }
}
const guardarJson = (clave: string, valor: unknown) => {
  try {
    window.localStorage.setItem(clave, JSON.stringify(valor))
  } catch {
    /* sin almacenamiento */
  }
}

let manifiestoEnMemoria: Manifiesto | null = null
/** La versión (A, B o C) elegida de cada sonido; sin elegir, la A. */
export const leerElegidos = (): Record<string, Letra> => leerJson<Record<string, Letra>>(CLAVE_ELEGIDOS, {})
/** La letra elegida de un sonido; sin elegir (o si esa letra no existe porque se descartó), la primera que haya. */
export const versionDe = (id: string): Letra => {
  const v = leerElegidos()[id]
  const hay = manifiestoEnMemoria?.[id]
  if (v && LETRAS.includes(v) && (!hay || hay[v])) return v
  if (hay) return LETRAS.find((l) => hay[l]) ?? 'A'
  return 'A'
}
/** (V30) Los sonidos que se quedan hechos por código (el toque y el brillo pequeño de [Visto], la campanita y el tic) están FIJOS en la versión A que eligió Eric: ya no se cambian. */
export const versionSint = (_id: string): Version => 'A'
export const elegirVersion = (id: string, v: Letra) => guardarJson(CLAVE_ELEGIDOS, { ...leerElegidos(), [id]: v })
export const volumenGeneral = (): number => Math.min(1, Math.max(0, leerJson<number>(CLAVE_VOLUMEN, 0.8)))
export const ponerVolumenGeneral = (v: number) => guardarJson(CLAVE_VOLUMEN, Math.min(1, Math.max(0, v)))
export const volumenDe = (id: string): number => Math.min(2, Math.max(0.2, leerJson<Record<string, number>>(CLAVE_VOLUMEN_DE, {})[id] ?? 1))
export const ponerVolumenDe = (id: string, v: number) => guardarJson(CLAVE_VOLUMEN_DE, { ...leerJson<Record<string, number>>(CLAVE_VOLUMEN_DE, {}), [id]: v })

export async function manifiesto(): Promise<Manifiesto | null> {
  if (manifiestoEnMemoria) return manifiestoEnMemoria
  try {
    const r = await fetch('/sonidos/v30/manifiesto.json')
    if (!r.ok) return null
    manifiestoEnMemoria = (await r.json()) as Manifiesto
    return manifiestoEnMemoria
  } catch {
    return null
  }
}

const buffers = new Map<string, AudioBuffer>()
/** Baja y descodifica un archivo de premio (solo cuando hace falta; con caché larga de Vercel la segunda vez no baja nada). */
export async function cargarPremio(ctx: BaseAudioContext, id: string, v: Letra): Promise<AudioBuffer | null> {
  const clave = `${id}_${v}`
  const ya = buffers.get(clave)
  if (ya) return ya
  try {
    const r = await fetch(`/sonidos/v30/${clave}.m4a`)
    if (!r.ok) return null
    const b = await ctx.decodeAudioData(await r.arrayBuffer())
    buffers.set(clave, b)
    return b
  } catch {
    return null
  }
}

/** Los archivos que necesita una partitura (para tenerlos listos antes de que la animación empiece). */
export const archivosDe = (id: string, o: OpcionesDePartitura = {}): string[] => (partituraDe(id, o)?.notas ?? []).filter((n): n is Extract<Nota, { tipo: 'archivo' }> => n.tipo === 'archivo').map((n) => n.archivo)
export async function precargar(ctx: BaseAudioContext, id: string, o: OpcionesDePartitura = {}): Promise<void> {
  await manifiesto()
  await Promise.all(archivosDe(id, o).map((a) => cargarPremio(ctx, a, versionDe(a))))
}

/**
 * (V34C) «PROBAR CON MI SONIDO» (solo la página de sonidos del administrador): un archivo del propio Eric, ya descodificado en el navegador (nunca sale de él), que sustituye a UN sonido de la partitura. `ms` lo adelanta (negativo)
 * o lo atrasa (positivo) respecto al sitio donde caería el sonido que sustituye. Por defecto es null: la app no cambia en nada.
 */
export interface SonidoPropio {
  objetivo: { tipo: 'archivo' | 'sint'; id: string }
  buffer: AudioBuffer
  ms: number
  vol: number
}
let propio: SonidoPropio | null = null
export const ponerSonidoPropio = (p: SonidoPropio | null) => {
  propio = p
}

interface Activa {
  id: string
  master: GainNode
  premio: boolean
  /** Cuándo acaba (segundos del reloj de audio). */
  fin: number
  fuentes: AudioScheduledSourceNode[]
}
let activas: Activa[] = []

/** Lo que se ha programado de verdad, para las pruebas: cada sonido con su instante dentro de la animación y el del reloj de audio. */
export interface Agendado {
  partitura: string
  tipo: 'sint' | 'archivo'
  id: string
  /** Segundos desde el principio de la animación en que tiene que sonar (o caer su golpe). */
  en: number
  /** Segundos desde el principio de la animación en que se ha programado de verdad (el golpe, para un archivo). */
  programado: number
}
const registrar = (a: Agendado) => {
  try {
    ;((window as unknown as { __sonidosAgendados?: Agendado[] }).__sonidosAgendados ??= []).push(a)
  } catch {
    /* sin ventana */
  }
}

/** Baja el volumen de una partitura a cero con un fundido corto y la suelta. */
function apagar(ctx: BaseAudioContext, a: Activa, fundidoMs: number) {
  const ahora = ctx.currentTime
  try {
    a.master.gain.cancelScheduledValues(ahora)
    a.master.gain.setValueAtTime(a.master.gain.value, ahora)
    a.master.gain.linearRampToValueAtTime(0, ahora + fundidoMs / 1000)
  } catch {
    /* ya parado */
  }
  const f = fundidoMs / 1000 + 0.03
  for (const s of a.fuentes) {
    try {
      s.stop(ahora + f)
    } catch {
      /* ya parada */
    }
  }
  window.setTimeout(() => {
    try {
      a.master.disconnect()
    } catch {
      /* suelto */
    }
  }, fundidoMs + 80)
  activas = activas.filter((x) => x !== a)
}

/** Para todo lo que suena (el viajero salta la animación): con un fundido corto, nunca de golpe. Si se pasa `solo`, solo los premios o solo una partitura. */
export function cortar(ctx: BaseAudioContext, fundidoMs = FUNDIDO_AL_SALTAR_MS, solo?: { premios?: boolean; id?: string }): number {
  const que = activas.filter((a) => (!solo?.premios || a.premio) && (!solo?.id || a.id === solo.id))
  for (const a of que) apagar(ctx, a, fundidoMs)
  return que.length
}

export const haySonando = (): boolean => activas.length > 0

/**
 * Programa la partitura `id` a partir de ahora. Devuelve lo que dura, o null si no hay partitura o el audio no está listo. Si es un premio, corta antes (con fundido) el premio que estuviera sonando: nunca dos golpes finales a la vez.
 * `en` solo lo usan las pruebas (empezar en otro instante del reloj de audio).
 */
export function iniciarPartitura(ctx: BaseAudioContext, id: string, o: OpcionesDePartitura & { en?: number } = {}): { dura: number; cortar: (ms?: number) => void } | null {
  const p = partituraDe(id, o)
  if (!p) return null
  if (p.premio) cortar(ctx, FUNDIDO_AL_SALTAR_MS, { premios: true })
  const t0 = (o.en ?? ctx.currentTime) + ADELANTO
  const master = ctx.createGain()
  master.gain.value = volumenGeneral() * volumenDe(id)
  master.connect(ctx.destination)
  const activa: Activa = { id, master, premio: p.premio, fin: t0 + p.dura + 0.6, fuentes: [] }
  activas.push(activa)
  for (const n of p.notas) {
    // (V34C) Su sonido, en el sitio del que sustituye (si lo hay).
    if (propio && propio.objetivo.tipo === n.tipo && propio.objetivo.id === (n.tipo === 'sint' ? n.sonido : n.archivo)) {
      const datosDelQueSustituye = n.tipo === 'archivo' ? manifiestoEnMemoria?.[n.archivo]?.[versionDe(n.archivo)] : undefined
      const base = n.tipo === 'sint' ? t0 + n.en : t0 + n.golpe - (datosDelQueSustituye?.golpe ?? 0)
      const f = ctx.createBufferSource()
      f.buffer = propio.buffer
      const gp = ctx.createGain()
      gp.gain.value = propio.vol * (n.vol ?? 1)
      f.connect(gp)
      gp.connect(master)
      const arranquePropio = base + propio.ms / 1000
      f.start(Math.max(arranquePropio, ctx.currentTime), Math.max(0, ctx.currentTime - arranquePropio))
      activa.fuentes.push(f)
      registrar({ partitura: id, tipo: n.tipo, id: `propio:${n.tipo === 'sint' ? n.sonido : n.archivo}`, en: n.tipo === 'sint' ? n.en : n.golpe, programado: arranquePropio - t0 + (datosDelQueSustituye?.golpe ?? 0) })
      continue
    }
    if (n.tipo === 'sint') {
      tocarSintetico(ctx, master, n.sonido, versionSint(n.sonido), t0 + n.en, n.vol ?? 1, n.dura)
      registrar({ partitura: id, tipo: 'sint', id: n.sonido, en: n.en, programado: n.en })
    } else {
      const v = versionDe(n.archivo)
      const buffer = buffers.get(`${n.archivo}_${v}`)
      const datos = manifiestoEnMemoria?.[n.archivo]?.[v]
      if (!buffer || !datos) continue // el archivo aún no ha llegado: la partitura suena sin él (los sonidos pequeños siguen en su sitio)
      const fuente = ctx.createBufferSource()
      fuente.buffer = buffer
      const g = ctx.createGain()
      g.gain.value = (n.vol ?? 1) * volumenDe(n.archivo)
      fuente.connect(g)
      g.connect(master)
      // El golpe cae en `n.golpe`: el archivo arranca `datos.golpe` segundos antes (o a mitad, si ya vamos tarde).
      const arranque = t0 + n.golpe - datos.golpe
      const tarde = Math.max(0, ctx.currentTime - arranque)
      fuente.start(Math.max(arranque, ctx.currentTime), tarde)
      activa.fuentes.push(fuente)
      registrar({ partitura: id, tipo: 'archivo', id: n.archivo, en: n.golpe, programado: arranque + datos.golpe - t0 })
    }
  }
  return { dura: p.dura, cortar: (ms = FUNDIDO_AL_SALTAR_MS) => apagar(ctx, activa, ms) }
}

/** Para las pruebas: olvida todo lo programado. */
export function reiniciarMotor() {
  activas = []
}

/** Para las pruebas: cuántas partituras suenan ahora (y cuántas de ellas son premios). */
export const cuantasSuenan = (): { todas: number; premios: number } => ({ todas: activas.length, premios: activas.filter((a) => a.premio).length })
