import { LETRAS, type AjusteDeCode, type Empieza, type Letra } from './motor'
import { crearZip, nombreSeguro, type EntradaDeZip } from './zip'
import { limitar, type Retoques } from './editar'

/**
 * (V35B2) LO QUE EL ESTUDIO DE SONIDOS GUARDA (solo la página del administrador): todo lo de UNA animación (qué sonidos de Code están silenciados, su letra, su volumen, sus movimientos, las capas añadidas y los archivos de Eric ENTEROS)
 * en IndexedDB de ESTE navegador (nunca en un servidor), y el zip `sonidos_jutrip.zip` con `LO_ELEGIDO.txt`, los archivos de Eric y un `estudio.json` con los datos exactos (lo lee `scripts/sonidos/aplicarEstudio.mjs`).
 * Aquí solo hay datos y funciones puras (más el acceso a IndexedDB): sin pantalla.
 */
export type EmpiezaCapa = Empieza

/** Una capa guardada: un archivo de Eric (con sus bytes) o un sonido de Code de otra animación (por su nombre y su letra). */
export interface CapaGuardada {
  id: string
  origen: 'archivo' | 'code'
  nombre: string
  ms: number
  vol: number
  empieza: EmpiezaCapa
  /** Solo origen «archivo»: el archivo entero, tal cual lo subió Eric. */
  archivo?: { nombre: string; tipo: string; bytes: ArrayBuffer }
  /** Solo origen «code»: el sonido grabado y su letra. */
  sonido?: string
  letra?: Letra
  /** (V36B) Los retoques de esta capa (el original se guarda aparte, intacto). */
  retoques?: Retoques
}
export interface EstadoDeAnimacion {
  silenciados: string[]
  ajustes: Record<string, AjusteDeCode>
  letras: Record<string, Letra>
  volumenes: Record<string, number>
  capas: CapaGuardada[]
  /** (V36B) Retoques de los sonidos de Code de esta animación (por `archivo_letra`). */
  ediciones?: Record<string, Retoques>
}
export interface Guardado extends EstadoDeAnimacion {
  animacion: string
  guardado_en: string
  /** (V39B) 2 = la línea de tiempo del Coliseo ya lleva el suspense delante de la película (ver `migrarColiseoV39B`). Sin él (guardado de antes), 1. */
  version_linea?: number
}

/**
 * (V39B) EL COLISEO AHORA EMPIEZA CON SU SUSPENSE (3,6 s: la frase, los latidos y el estallido) y la película entra DESPUÉS. Todo lo guardado antes en esa tarjeta contaba «desde el principio» de la animación, que era el de la película:
 * para que cada sonido siga cayendo en el MISMO fotograma de la película, se mueve lo mismo que se movió ella (+3,6 s):
 *   · los sonidos de Code de la película (redoble, golpe del emblema, clic, brillo) movidos «desde el principio» o «desde el golpe»: +3.600 ms (los «donde suena de siempre» van con la película solos);
 *   · los de la espera (el toque de los latidos y el estallido) se quedan: la espera sigue donde estaba;
 *   · los sonidos de Eric y los añadidos (capas), «desde el principio» o «desde el golpe»: +3.600 ms.
 * (La referencia del «golpe» es el estallido, a los 3,6 s, y no se mueve: por eso lo «desde el golpe» de la película también suma.) Pura; no toca el original.
 */
export const SEGUNDOS_DE_SUSPENSE_DEL_COLISEO = 3.6
const CLAVES_DE_LA_ESPERA = ['archivo:estallido', 'sint:toque']
export function migrarColiseoV39B<T extends EstadoDeAnimacion>(e: T): T {
  const ms = Math.round(SEGUNDOS_DE_SUSPENSE_DEL_COLISEO * 1000)
  const ajustes: EstadoDeAnimacion['ajustes'] = {}
  for (const [k, a] of Object.entries(e.ajustes)) ajustes[k] = a.empieza === 'sitio' || CLAVES_DE_LA_ESPERA.includes(k) ? a : { ...a, ms: a.ms + ms }
  const capas = e.capas.map((c) => (c.empieza === 'principio' || c.empieza === 'golpe' ? { ...c, ms: c.ms + ms } : c))
  return { ...e, ajustes, capas }
}
/** La copia de seguridad de lo guardado del Coliseo (antes de moverlo) vive bajo este id (no es una tarjeta: la página no la enseña ni la borra). */
export const ID_DE_LA_COPIA_DEL_COLISEO = 'copia_antes_de_v39b:emblema_maravilla'
export const ESTADO_VACIO = (): EstadoDeAnimacion => ({ silenciados: [], ajustes: {}, letras: {}, volumenes: {}, capas: [], ediciones: {} })

const ordenado = <T,>(o: Record<string, T>): Record<string, T> => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]))
/** Una «huella» del estado (sin los bytes: nombre y tamaño del archivo): dos estados iguales dan la misma. Sirve para saber si hay cambios sin guardar. */
export function huellaDe(e: EstadoDeAnimacion): string {
  return JSON.stringify({
    s: [...e.silenciados].sort(),
    a: ordenado(e.ajustes),
    l: ordenado(e.letras),
    v: ordenado(e.volumenes),
    d: ordenado(e.ediciones ?? {}),
    c: e.capas.map((c) => [c.origen, c.nombre, c.ms, c.vol, c.empieza, c.sonido ?? '', c.letra ?? '', c.archivo ? `${c.archivo.nombre}:${c.archivo.bytes.byteLength}` : '', c.retoques ?? null]),
  })
}
export const HUELLA_VACIA = huellaDe(ESTADO_VACIO())

/* ───────── IndexedDB ───────── */
const BD = 'jutrip-estudio-sonidos'
const ALMACEN = 'animaciones'
function abrir(): Promise<IDBDatabase> {
  return new Promise((ok, no) => {
    if (typeof indexedDB === 'undefined') return no(new Error('sin_indexeddb'))
    let pet: IDBOpenDBRequest
    try {
      pet = indexedDB.open(BD, 1)
    } catch (e) {
      return no(e)
    }
    pet.onupgradeneeded = () => pet.result.createObjectStore(ALMACEN, { keyPath: 'animacion' })
    pet.onsuccess = () => ok(pet.result)
    pet.onerror = () => no(pet.error ?? new Error('sin_indexeddb'))
    pet.onblocked = () => no(new Error('sin_indexeddb'))
  })
}
const pedir = <T,>(modo: IDBTransactionMode, f: (a: IDBObjectStore) => IDBRequest<T>): Promise<T> =>
  abrir().then(
    (db) =>
      new Promise<T>((ok, no) => {
        const t = db.transaction(ALMACEN, modo)
        const r = f(t.objectStore(ALMACEN))
        t.oncomplete = () => {
          db.close()
          ok(r.result)
        }
        t.onerror = () => {
          db.close()
          no(t.error ?? new Error('sin_indexeddb'))
        }
        t.onabort = () => {
          db.close()
          no(t.error ?? new Error('sin_indexeddb'))
        }
      }),
  )
export const leerGuardados = (): Promise<Guardado[]> => pedir('readonly', (a) => a.getAll() as IDBRequest<Guardado[]>)
export const guardarEnElNavegador = (g: Guardado): Promise<IDBValidKey> => pedir('readwrite', (a) => a.put(g))
export const borrarGuardado = (animacion: string): Promise<undefined> => pedir('readwrite', (a) => a.delete(animacion) as IDBRequest<undefined>)
/** Una frase clara si el navegador no deja guardar (modo privado, almacenamiento bloqueado…). */
export const AVISO_SIN_ALMACEN = 'Este navegador no deja guardar aquí (¿modo privado o con el almacenamiento bloqueado?). Puedes seguir probando, pero al recargar se pierde: usa [Descargar todo lo guardado] para llevarte lo que hagas.'
/** Para saber de antemano si se puede guardar. */
export async function sePuedeGuardar(): Promise<boolean> {
  try {
    await leerGuardados()
    return true
  } catch {
    return false
  }
}

/* ───────── estudio.json y el zip ───────── */
export interface SonidoDeCodeDeLaAnimacion {
  clave: string
  tipo: 'archivo' | 'sint'
  sonido: string
  /** La letra con la que suena (solo grabados). */
  version: Letra | null
  silenciado: boolean
  volumen: number
  ms: number
  empieza: 'sitio' | 'principio' | 'golpe'
}
/** (V36B) Un sonido retocado ya HECHO (el wav final) con sus datos para comprobarlo. */
export interface FinalDeSonido {
  wav: Uint8Array
  muestras: number
  tasa: number
  pico: number
  retoques: Retoques
}
export interface DatosParaElZip {
  /** Los finales de las capas retocadas (por id de capa) y de los sonidos de Code retocados (por clave `archivo:id`). */
  finales?: { capas: Record<string, FinalDeSonido>; codigo: Record<string, FinalDeSonido> }
  animacion: string
  nombre: string
  /** (V38E) Lo que dura la animación ENTERA (hasta [Seguir]). */
  duracion: number
  golpe: number
  /** (V38E) Qué partituras suenan y en qué segundo de la animación entera empieza cada una (la escena de un emblema de Roma, a los 3,6 s): con esto cada «desde el principio» / «desde el golpe» cae en su segundo exacto. */
  tramos?: { partitura: string; empieza: number }[]
  codigo: SonidoDeCodeDeLaAnimacion[]
  capas: CapaGuardada[]
  lineaElegida: string
}
const extensionDe = (nombre: string, tipo: string): string => {
  const e = /\.([a-z0-9]{2,4})$/i.exec(nombre)?.[1]?.toLowerCase()
  if (e && ['mp3', 'm4a', 'wav', 'ogg'].includes(e)) return e
  if (/mp4|aac|m4a/.test(tipo)) return 'm4a'
  if (/wav/.test(tipo)) return 'wav'
  if (/ogg/.test(tipo)) return 'ogg'
  return 'mp3'
}
const redondea = (n: number, d = 3): number => Math.round(n * 10 ** d) / 10 ** d

/** El zip de lo guardado: `LO_ELEGIDO.txt` (para leer), los archivos de Eric (`<animación>_<n>.<ext>`) y `estudio.json` (datos exactos). */
export function construirZip(animaciones: DatosParaElZip[], volumenGeneral: number, ahora = new Date()): Uint8Array {
  const entradas: EntradaDeZip[] = []
  const codificar = new TextEncoder()
  const json: { version: 1; generado: string; volumen_general: number; animaciones: Record<string, unknown> } = { version: 1, generado: ahora.toISOString(), volumen_general: redondea(volumenGeneral, 2), animaciones: {} }
  for (const a of [...animaciones].sort((x, y) => x.animacion.localeCompare(y.animacion))) {
    let n = 0
    const datosFinal = (f: FinalDeSonido) => ({ retoques: f.retoques, muestras: f.muestras, tasa: f.tasa, pico: redondea(f.pico, 4) })
    let anadidas = 0
    const capas = a.capas.map((c) => {
      const fin = a.finales?.capas[c.id]
      if (c.origen === 'code') {
        if (!fin) return { origen: 'code', sonido: c.sonido, version: c.letra, volumen: redondea(c.vol, 2), ms: Math.round(c.ms), empieza: c.empieza }
        const wav = `${a.animacion}_anadido_${++anadidas}_${c.sonido}_${c.letra}.wav`
        entradas.push({ nombre: wav, datos: fin.wav })
        return { origen: 'code', sonido: c.sonido, version: c.letra, volumen: redondea(c.vol, 2), ms: Math.round(c.ms), empieza: c.empieza, archivo: wav, ...datosFinal(fin) }
      }
      n++
      const ext = extensionDe(c.archivo?.nombre ?? c.nombre, c.archivo?.tipo ?? '')
      const nombreEnElZip = fin ? `${a.animacion}_${n}.wav` : `${a.animacion}_${n}.${ext}`
      if (fin) {
        const original = `${a.animacion}_${n}_original.${ext}`
        entradas.push({ nombre: nombreEnElZip, datos: fin.wav }, { nombre: original, datos: new Uint8Array(c.archivo?.bytes ?? new ArrayBuffer(0)) })
        return { origen: 'archivo', archivo: nombreEnElZip, original, nombre: c.archivo?.nombre ?? c.nombre, volumen: redondea(c.vol, 2), ms: Math.round(c.ms), empieza: c.empieza, ...datosFinal(fin) }
      }
      entradas.push({ nombre: nombreEnElZip, datos: new Uint8Array(c.archivo?.bytes ?? new ArrayBuffer(0)) })
      return { origen: 'archivo', archivo: nombreEnElZip, nombre: c.archivo?.nombre ?? c.nombre, volumen: redondea(c.vol, 2), ms: Math.round(c.ms), empieza: c.empieza }
    })
    json.animaciones[a.animacion] = {
      nombre: a.nombre,
      duracion: redondea(a.duracion),
      golpe: redondea(a.golpe),
      ...(a.tramos ? { tramos: a.tramos.map((x) => ({ partitura: x.partitura, empieza: redondea(x.empieza) })) } : {}),
      sonidos_de_code: a.codigo.map((c) => {
        const fin = a.finales?.codigo[c.clave]
        const base = { clave: c.clave, tipo: c.tipo, sonido: c.sonido, version: c.version, silenciado: c.silenciado, volumen: redondea(c.volumen, 2), ms: Math.round(c.ms), empieza: c.empieza }
        if (!fin) return base
        const wav = `${a.animacion}_${c.sonido}_${c.version}.wav`
        entradas.push({ nombre: wav, datos: fin.wav })
        return { ...base, archivo: wav, ...datosFinal(fin) }
      }),
      capas,
    }
  }
  const lista = ['LO ELEGIDO EN EL ESTUDIO DE SONIDOS (para leer; los datos exactos están en estudio.json)', '', ...[...animaciones].sort((x, y) => x.animacion.localeCompare(y.animacion)).map((a) => a.lineaElegida), '', `volumen general: ${redondea(volumenGeneral, 2)}`, '']
  entradas.unshift({ nombre: 'estudio.json', datos: codificar.encode(JSON.stringify(json, null, 2) + '\n') })
  entradas.unshift({ nombre: 'LO_ELEGIDO.txt', datos: codificar.encode(lista.join('\n')) })
  return crearZip(entradas)
}

/** Lo que dice un estudio.json de una animación, ya validado a lo básico (lo estricto lo hace aplicarEstudio.mjs). */
export interface AnimacionDelJson {
  /** (V38E) Qué partituras suenan y cuándo empieza cada una dentro de la animación entera. Un zip de antes de la V39B no trae el suspense del Coliseo delante. */
  tramos?: { partitura: string; empieza: number }[]
  sonidos_de_code: (SonidoDeCodeDeLaAnimacion & { retoques?: Retoques })[]
  capas: ({ origen: 'code'; sonido: string; version: Letra; volumen: number; ms: number; empieza: EmpiezaCapa; retoques?: Retoques } | { origen: 'archivo'; archivo: string; original?: string; nombre: string; volumen: number; ms: number; empieza: EmpiezaCapa; retoques?: Retoques })[]
}
const num = (x: unknown, por = 0): number => (typeof x === 'number' && Number.isFinite(x) ? x : por)
const EMPIEZAS: string[] = ['principio', 'golpe']
export function leerEstudioJson(texto: string): Record<string, AnimacionDelJson> {
  const j = JSON.parse(texto) as { version?: number; animaciones?: Record<string, AnimacionDelJson> }
  if (j.version !== 1 || typeof j.animaciones !== 'object' || !j.animaciones) throw new Error('Ese zip no es de este estudio (falta estudio.json versión 1).')
  const salida: Record<string, AnimacionDelJson> = {}
  for (const [id, a] of Object.entries(j.animaciones)) {
    if (!/^[a-z0-9_]{1,40}$/.test(id)) throw new Error(`Animación con un nombre raro: ${id}`)
    salida[id] = { ...(Array.isArray(a.tramos) ? { tramos: a.tramos } : {}), sonidos_de_code: Array.isArray(a.sonidos_de_code) ? a.sonidos_de_code : [], capas: Array.isArray(a.capas) ? a.capas : [] }
  }
  return salida
}
/** De lo que dice el json de una animación (y los archivos del zip) al estado que guarda el estudio. */
export function estadoDesdeJson(a: AnimacionDelJson, archivos: Map<string, Uint8Array>, mime: (nombre: string) => string): EstadoDeAnimacion {
  const e = ESTADO_VACIO()
  for (const c of a.sonidos_de_code) {
    if (c.silenciado) e.silenciados.push(c.clave)
    if (c.version && (LETRAS as string[]).includes(c.version)) e.letras[c.sonido] = c.version
    e.volumenes[c.tipo === 'sint' ? `s:${c.sonido}` : c.sonido] = Math.min(2, Math.max(0, num(c.volumen, 1)))
    if (c.retoques && c.version) (e.ediciones ??= {})[`${c.sonido}_${c.version}`] = limitar(c.retoques, 1e6)
    if (num(c.ms) !== 0 || c.empieza !== 'sitio') e.ajustes[c.clave] = { ms: Math.round(num(c.ms)), empieza: c.empieza === 'principio' || c.empieza === 'golpe' ? c.empieza : 'sitio' }
  }
  let k = 0
  for (const c of a.capas) {
    const empieza = (EMPIEZAS.includes(c.empieza) ? c.empieza : 'principio') as EmpiezaCapa
    if (c.origen === 'code') {
      e.capas.push({ id: `z${++k}`, origen: 'code', nombre: `${c.sonido} · ${c.version}`, ms: Math.round(num(c.ms)), vol: Math.min(2, Math.max(0, num(c.volumen, 1))), empieza, sonido: c.sonido, letra: c.version, retoques: c.retoques ? limitar(c.retoques, 1e6) : undefined })
    } else {
      // Con retoques, el sonido de Eric de verdad es el ORIGINAL (los retoques se aplican encima al abrirlo); el .wav final solo sirve a la app.
      const quien = c.retoques && c.original ? c.original : c.archivo
      if (!nombreSeguro(quien)) throw new Error(`Archivo con un nombre raro: ${quien}`)
      const datos = archivos.get(quien)
      if (!datos) throw new Error(`En el zip falta el archivo ${quien}.`)
      const copia = new Uint8Array(datos).buffer
      e.capas.push({ id: `z${++k}`, origen: 'archivo', nombre: c.nombre, ms: Math.round(num(c.ms)), vol: Math.min(2, Math.max(0, num(c.volumen, 0.7))), empieza, archivo: { nombre: c.nombre, tipo: mime(quien), bytes: copia }, retoques: c.retoques ? limitar(c.retoques, 1e6) : undefined })
    }
  }
  return e
}
