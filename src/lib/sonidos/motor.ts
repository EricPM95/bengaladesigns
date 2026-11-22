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
  // (V35B2) El estudio puede fijar la letra de cada sonido para UNA animación (lo que guardó Eric); si no, la de siempre.
  const v = estudio.letras[id] ?? leerElegidos()[id]
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
/** (V35A2) El volumen de CADA sonido, de 0 a 200 %. Los grabados se guardan por su nombre (`redoble`); los hechos por código, con `s:` delante (`s:tic`). */
export const volumenDe = (id: string): number => Math.min(2, Math.max(0, leerJson<Record<string, number>>(CLAVE_VOLUMEN_DE, {})[id] ?? 1))
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
 * (V35A2) EL ESTUDIO (solo la página de sonidos del administrador, a través del visor): los sonidos de Eric se SUMAN a los de Code (ya no sustituyen a ninguno) y cualquier sonido de Code se puede silenciar.
 *   · `propios`: cada archivo de Eric (ya descodificado en el navegador, nunca sale de él) con su volumen y su momento: `ms` desde el primer fotograma de la animación (`empieza: 'principio'`) o desde el golpe (`'golpe'`).
 *   · `silenciados`: los sonidos de Code que no se programan (`archivo:redoble`, `sint:tic`).
 *   · `golpe`: segundos desde el principio en que cae el golpe (o acaba la animación), la referencia de «En el golpe».
 * Un sonido que cae ANTES del primer fotograma no se recorta: se retrasa la animación (`esperaDeLaAnimacion`) y el sonido se oye entero. Por defecto todo está vacío: la app no cambia en nada.
 */
export type Empieza = 'principio' | 'golpe'
export interface SonidoPropio {
  id: string
  nombre: string
  buffer: AudioBuffer
  ms: number
  vol: number
  empieza: Empieza
}
/** (V35B2) Dónde cuenta el 0 ms de un sonido de Code movido: «sitio» = donde suena de siempre; «principio» = el primer fotograma; «golpe» = el golpe. */
export type EmpiezaCode = 'sitio' | 'principio' | 'golpe'
export interface AjusteDeCode {
  ms: number
  empieza: EmpiezaCode
}
export interface EstudioDelMotor {
  propios: SonidoPropio[]
  silenciados: string[]
  golpe: number
  /** (V35B2) Sonidos de Code movidos (por clave `archivo:redoble`). */
  ajustes: Record<string, AjusteDeCode>
  /** (V35B2) La letra de cada sonido grabado en ESTA animación y el volumen de cada sonido (si no se dicen, valen los de siempre). */
  letras: Record<string, Letra>
  volumenes: Record<string, number>
  /** (V36B) Sonidos de Code retocados en el estudio (por `archivo_letra`): el sonido ya hecho y dónde cae ahora su golpe y cuánto dura. */
  editados: Record<string, { buffer: AudioBuffer; golpe: number; dura: number }>
  /** (V38E) En qué segundo de la animación ENTERA empieza cada partitura (la escena de un emblema de Roma, a los 3,6 s): «desde el principio» y «desde el golpe» cuentan desde el principio de la animación. */
  inicios: Record<string, number>
  /** (V38E) «▶ desde aquí»: se empieza a oír desde este segundo de la animación entera. */
  desde?: number
}
const VACIO: EstudioDelMotor = { propios: [], silenciados: [], golpe: 0, ajustes: {}, letras: {}, volumenes: {}, editados: {}, inicios: {} }
const inicioDe = (id: string, o: { inicio?: number } = {}): number => o.inicio ?? estudio.inicios[id] ?? 0
let estudio: EstudioDelMotor = VACIO
export const ponerEstudio = (e: Partial<EstudioDelMotor> | null) => {
  estudio = e ? { ...VACIO, ...e } : VACIO
}
export const claveDeSilencio = (tipo: 'archivo' | 'sint', id: string) => `${tipo}:${id}`
/** (V35B2) El volumen de un sonido en el estudio: el de esta animación si lo hay, y si no el de siempre. */
const volumenEn = (clave: string): number => Math.min(2, Math.max(0, estudio.volumenes[clave] ?? volumenDe(clave)))

/** (V35B2) El arranque natural (segundos desde el primer fotograma) de una nota: el de un sonido hecho por código, o el del principio de un archivo (su golpe menos el golpe dentro del archivo). */
export function arranqueNatural(n: Nota, golpeEnElArchivo: number): number {
  return n.tipo === 'sint' ? n.en : n.golpe - golpeEnElArchivo
}
/** (V35B2) Cuántos segundos hay que mover TODAS las notas de un sonido de Code para cumplir su ajuste (la primera nota manda). Sin ajuste, 0. Pura. */
export function desplazamientoDeCode(primeraNota: number, ajuste: AjusteDeCode | undefined, golpe: number): number {
  if (!ajuste) return 0
  if (ajuste.empieza === 'sitio') return ajuste.ms / 1000
  return (ajuste.empieza === 'golpe' ? golpe : 0) + ajuste.ms / 1000 - primeraNota
}
const golpeDentro = (n: Nota): number => (n.tipo === 'archivo' ? (estudio.editados[`${n.archivo}_${versionDe(n.archivo)}`]?.golpe ?? manifiestoEnMemoria?.[n.archivo]?.[versionDe(n.archivo)]?.golpe ?? 0) : 0)
const claveDeNota = (n: Nota): string => claveDeSilencio(n.tipo, n.tipo === 'sint' ? n.sonido : n.archivo)
/** Para cada sonido de una partitura, el arranque natural de su primera nota. */
function primerasNotas(notas: Nota[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const n of notas) {
    const k = claveDeNota(n)
    const a = arranqueNatural(n, golpeDentro(n))
    if (!m.has(k) || a < (m.get(k) as number)) m.set(k, a)
  }
  return m
}
/** (V35B2) Lo que hay que esperar antes del primer fotograma para que ningún sonido de Code movido caiga antes de «ahora» (como con los de Eric: no se recorta, se retrasa la animación). */
export function esperaPorCodeMovido(partituras: string[], o: OpcionesDePartitura = {}): number {
  let minimo = 0
  for (const id of partituras) {
    const notas = partituraDe(id, o)?.notas ?? []
    const primeras = primerasNotas(notas)
    for (const n of notas) {
      const k = claveDeNota(n)
      if (estudio.silenciados.includes(k) || !estudio.ajustes[k]) continue
      const nuevo = arranqueNatural(n, golpeDentro(n)) + desplazamientoDeCode((primeras.get(k) as number) + inicioDe(id, o), estudio.ajustes[k], estudio.golpe)
      if (nuevo < minimo) minimo = nuevo
    }
  }
  return -minimo
}
/**
 * (V38B) CUÁNDO ACABA DE SONAR de verdad la partitura `id` (segundos desde que se pide): el final del último sonido, con lo que hay ahora en el estudio (sonidos de Code silenciados o movidos, retocados, y los de Eric que se suman).
 * Sin el manifiesto cargado, un archivo cuenta 1 s y uno hecho por código lo que dura el suyo. Pura aparte de leer el estudio. La usan los pedazos para empezar la siguiente insignia cuando la anterior ha acabado del todo.
 */
export function finSonoroDe(id: string, o: OpcionesDePartitura = {}): number {
  const p = partituraDe(id, o)
  if (!p) return 0
  const primeras = primerasNotas(p.notas)
  let fin = 0
  for (const n of p.notas) {
    const k = claveDeNota(n)
    if (estudio.silenciados.includes(k)) continue
    const delta = desplazamientoDeCode((primeras.get(k) as number) + inicioDe(id, o), estudio.ajustes[k], estudio.golpe)
    if (n.tipo === 'sint') fin = Math.max(fin, n.en + delta + (n.dura ?? 0.3))
    else {
      const v = versionDe(n.archivo)
      const retocado = estudio.editados[`${n.archivo}_${v}`]
      const base = manifiestoEnMemoria?.[n.archivo]?.[v]
      const dura = retocado?.dura ?? base?.dura ?? 1
      const golpe = retocado?.golpe ?? base?.golpe ?? 0
      fin = Math.max(fin, n.golpe - golpe + delta + dura)
    }
  }
  for (const s of estudio.propios) fin = Math.max(fin, arranqueDelPropio(s, estudio.golpe) + s.buffer.duration)
  return fin
}

/** Segundos desde el primer fotograma en que arranca el sonido propio (puede ser negativo). */
export const arranqueDelPropio = (p: Pick<SonidoPropio, 'empieza' | 'ms'>, golpe: number): number => (p.empieza === 'golpe' ? golpe : 0) + p.ms / 1000
/** Lo que hay que esperar antes del primer fotograma para que ningún sonido propio caiga antes de «ahora» (así no se recorta). */
export const esperaDeLaAnimacion = (propios: Pick<SonidoPropio, 'empieza' | 'ms'>[], golpe: number): number => Math.max(0, ...propios.map((p) => -arranqueDelPropio(p, golpe)))

/** Si la página del estudio fija el primer fotograma en el reloj de audio (para poder adelantar sonidos de verdad), la siguiente partitura arranca ahí. */
let inicioFijado: { t: number; hasta: number } | null = null
export const fijarInicioDeLaAnimacion = (ctx: BaseAudioContext, t: number) => {
  inicioFijado = { t, hasta: ctx.currentTime + 4 }
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
  /** (V35A2) Solo los sonidos de Eric: el primer fotograma y el arranque en el reloj de audio, y los segundos que se han recortado del principio (0 = entero). */
  t0?: number
  t?: number
  recorte?: number
  /** (V38B) Semitonos más agudo con que suena (pedazos repetidos). */
  semitonos?: number
  /** (V40) El volumen con que suena (para comparar la app con el estudio). */
  vol?: number
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

/** (V35A2) Programa cada sonido de Eric, entero (nunca recortado), en su instante respecto al primer fotograma `t0`. */
export function programarPropios(ctx: BaseAudioContext, partitura: string, t0: number, desde = 0) {
  if (estudio.propios.length === 0) return
  // Se programan YA (antes de que la animación se monte): así uno que tiene que sonar antes del primer fotograma se oye entero.
  const master = ctx.createGain()
  master.gain.value = volumenGeneral()
  master.connect(ctx.destination)
  const activa: Activa = { id: `propios:${partitura}`, master, premio: false, fin: t0 + 30, fuentes: [] }
  activas.push(activa)
  for (const p of estudio.propios) {
    const rel = arranqueDelPropio(p, estudio.golpe)
    const f = ctx.createBufferSource()
    f.buffer = p.buffer
    const g = ctx.createGain()
    g.gain.value = p.vol
    f.connect(g)
    g.connect(master)
    // (V38E) «▶ desde aquí»: un sonido de Eric que acaba antes del punto elegido no suena; el que está sonando en ese punto entra a mitad.
    if (desde > 0 && rel + p.buffer.duration < desde) continue
    const cuando = t0 + rel
    // Nunca se recorta a propósito: si llegara tarde (el móvil va justo), se dice cuánto (`recorte`) para que la página lo avise.
    const recorte = Math.max(0, ctx.currentTime - cuando)
    f.start(Math.max(cuando, ctx.currentTime), recorte)
    activa.fuentes.push(f)
    registrar({ partitura, tipo: 'archivo', id: `propio:${p.id}`, en: rel, programado: rel, t0, t: cuando, recorte, vol: p.vol })
  }
}

/**
 * Programa la partitura `id` a partir de ahora. Devuelve lo que dura, o null si no hay partitura o el audio no está listo. Si es un premio, corta antes (con fundido) el premio que estuviera sonando: nunca dos golpes finales a la vez.
 * `en` solo lo usan las pruebas (empezar en otro instante del reloj de audio).
 */
export function iniciarPartitura(ctx: BaseAudioContext, id: string, o: OpcionesDePartitura & { en?: number } = {}): { dura: number; cortar: (ms?: number) => void } | null {
  const p = partituraDe(id, o)
  if (!p) return null
  if (p.premio) cortar(ctx, FUNDIDO_AL_SALTAR_MS, { premios: true })
  // (V35A2) Si el estudio ha fijado el primer fotograma en el reloj de audio, la partitura arranca justo ahí (una sola vez).
  const fijado = inicioFijado && inicioFijado.hasta >= ctx.currentTime ? inicioFijado.t : null
  inicioFijado = null
  // (V38E) «▶ desde aquí»: el reloj de esta partitura ya va `desdeLocal` s adelantado (lo que pasó antes del punto elegido no suena; lo que está sonando entra a mitad).
  const inicio = inicioDe(id, o)
  const desde = o.desde ?? estudio.desde ?? 0
  const desdeLocal = Math.max(0, desde - inicio)
  const t0 = (fijado ?? o.en ?? ctx.currentTime) + (fijado === null ? ADELANTO : 0) - desdeLocal
  const master = ctx.createGain()
  master.gain.value = volumenGeneral()
  master.connect(ctx.destination)
  const activa: Activa = { id, master, premio: p.premio, fin: t0 + p.dura + 0.6, fuentes: [] }
  activas.push(activa)
  const primeras = primerasNotas(p.notas)
  const semitonos = o.semitonos ?? 0
  // (V38B) Una repetición del mismo sonido en la misma pantalla (el 2.º pedazo…): los sonidos de Eric del estudio suenan otra vez, tal cual, con la misma cuenta que la primera.
  if (o.repeticion) programarPropios(ctx, id, t0)
  for (const n of p.notas) {
    // (V35A2) Un sonido de Code silenciado no se programa.
    const clave = claveDeNota(n)
    if (estudio.silenciados.includes(clave)) continue
    // (V35B2) Un sonido de Code movido: todas sus notas se mueven lo mismo.
    const delta = desplazamientoDeCode((primeras.get(clave) as number) + inicio, estudio.ajustes[clave], estudio.golpe)
    if (n.tipo === 'sint') {
      if (desdeLocal > 0 && n.en + delta < desdeLocal - 0.02) continue
      tocarSintetico(ctx, master, n.sonido, versionSint(n.sonido), t0 + n.en + delta, (n.vol ?? 1) * volumenEn(`s:${n.sonido}`), n.dura)
      registrar({ partitura: id, tipo: 'sint', id: n.sonido, en: n.en, programado: n.en + delta, vol: (n.vol ?? 1) * volumenEn(`s:${n.sonido}`) })
    } else {
      const v = versionDe(n.archivo)
      // (V36B) Un sonido de Code retocado en el estudio suena con su versión ya hecha y con su golpe donde cae ahora.
      const retocado = estudio.editados[`${n.archivo}_${v}`]
      const buffer = retocado?.buffer ?? buffers.get(`${n.archivo}_${v}`)
      const datosBase = manifiestoEnMemoria?.[n.archivo]?.[v]
      const datos = retocado && datosBase ? { ...datosBase, golpe: retocado.golpe, dura: retocado.dura } : datosBase
      if (!buffer || !datos) continue // el archivo aún no ha llegado: la partitura suena sin él (los sonidos pequeños siguen en su sitio)
      const fuente = ctx.createBufferSource()
      fuente.buffer = buffer
      // (V38B) Un pedazo repetido suena unos semitonos más agudo (más rápido: el golpe dentro del archivo cae antes, y se cuenta).
      const velocidad = semitonos === 0 ? 1 : Math.pow(2, semitonos / 12)
      if (velocidad !== 1) fuente.playbackRate.value = velocidad
      const g = ctx.createGain()
      g.gain.value = (n.vol ?? 1) * volumenEn(n.archivo)
      fuente.connect(g)
      g.connect(master)
      // El golpe cae en `n.golpe`: el archivo arranca `datos.golpe` segundos antes (o a mitad, si ya vamos tarde).
      const arranque = t0 + n.golpe - datos.golpe / velocidad + delta
      if (desdeLocal > 0 && n.golpe - datos.golpe / velocidad + delta + datos.dura / velocidad < desdeLocal) continue
      const tarde = Math.max(0, ctx.currentTime - arranque) * velocidad
      fuente.start(Math.max(arranque, ctx.currentTime), tarde)
      activa.fuentes.push(fuente)
      registrar({ partitura: id, tipo: 'archivo', id: n.archivo, en: n.golpe, programado: arranque + datos.golpe / velocidad - t0, vol: (n.vol ?? 1) * volumenEn(n.archivo), ...(semitonos ? { semitonos } : {}) })
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
/** (V40) Lo que tiene puesto el motor ahora (para devolverlo tras un sonido suelto, como [Visto] o el vuelo). */
export const estudioActual = (): EstudioDelMotor => estudio
