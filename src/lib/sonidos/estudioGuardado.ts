import { LETRAS, type AjusteDeCode, type Empieza, type Letra } from './motor'
import { crearZip, nombreSeguro, type EntradaDeZip } from './zip'

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
}
export interface EstadoDeAnimacion {
  silenciados: string[]
  ajustes: Record<string, AjusteDeCode>
  letras: Record<string, Letra>
  volumenes: Record<string, number>
  capas: CapaGuardada[]
}
export interface Guardado extends EstadoDeAnimacion {
  animacion: string
  guardado_en: string
}
export const ESTADO_VACIO = (): EstadoDeAnimacion => ({ silenciados: [], ajustes: {}, letras: {}, volumenes: {}, capas: [] })

const ordenado = <T,>(o: Record<string, T>): Record<string, T> => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]))
/** Una «huella» del estado (sin los bytes: nombre y tamaño del archivo): dos estados iguales dan la misma. Sirve para saber si hay cambios sin guardar. */
export function huellaDe(e: EstadoDeAnimacion): string {
  return JSON.stringify({
    s: [...e.silenciados].sort(),
    a: ordenado(e.ajustes),
    l: ordenado(e.letras),
    v: ordenado(e.volumenes),
    c: e.capas.map((c) => [c.origen, c.nombre, c.ms, c.vol, c.empieza, c.sonido ?? '', c.letra ?? '', c.archivo ? `${c.archivo.nombre}:${c.archivo.bytes.byteLength}` : '']),
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
export interface DatosParaElZip {
  animacion: string
  nombre: string
  duracion: number
  golpe: number
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
    const capas = a.capas.map((c) => {
      if (c.origen === 'code') return { origen: 'code', sonido: c.sonido, version: c.letra, volumen: redondea(c.vol, 2), ms: Math.round(c.ms), empieza: c.empieza }
      n++
      const nombreEnElZip = `${a.animacion}_${n}.${extensionDe(c.archivo?.nombre ?? c.nombre, c.archivo?.tipo ?? '')}`
      entradas.push({ nombre: nombreEnElZip, datos: new Uint8Array(c.archivo?.bytes ?? new ArrayBuffer(0)) })
      return { origen: 'archivo', archivo: nombreEnElZip, nombre: c.archivo?.nombre ?? c.nombre, volumen: redondea(c.vol, 2), ms: Math.round(c.ms), empieza: c.empieza }
    })
    json.animaciones[a.animacion] = {
      nombre: a.nombre,
      duracion: redondea(a.duracion),
      golpe: redondea(a.golpe),
      sonidos_de_code: a.codigo.map((c) => ({ clave: c.clave, tipo: c.tipo, sonido: c.sonido, version: c.version, silenciado: c.silenciado, volumen: redondea(c.volumen, 2), ms: Math.round(c.ms), empieza: c.empieza })),
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
  sonidos_de_code: SonidoDeCodeDeLaAnimacion[]
  capas: ({ origen: 'code'; sonido: string; version: Letra; volumen: number; ms: number; empieza: EmpiezaCapa } | { origen: 'archivo'; archivo: string; nombre: string; volumen: number; ms: number; empieza: EmpiezaCapa })[]
}
const num = (x: unknown, por = 0): number => (typeof x === 'number' && Number.isFinite(x) ? x : por)
const EMPIEZAS: string[] = ['principio', 'golpe']
export function leerEstudioJson(texto: string): Record<string, AnimacionDelJson> {
  const j = JSON.parse(texto) as { version?: number; animaciones?: Record<string, AnimacionDelJson> }
  if (j.version !== 1 || typeof j.animaciones !== 'object' || !j.animaciones) throw new Error('Ese zip no es de este estudio (falta estudio.json versión 1).')
  const salida: Record<string, AnimacionDelJson> = {}
  for (const [id, a] of Object.entries(j.animaciones)) {
    if (!/^[a-z0-9_]{1,40}$/.test(id)) throw new Error(`Animación con un nombre raro: ${id}`)
    salida[id] = { sonidos_de_code: Array.isArray(a.sonidos_de_code) ? a.sonidos_de_code : [], capas: Array.isArray(a.capas) ? a.capas : [] }
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
    if (num(c.ms) !== 0 || c.empieza !== 'sitio') e.ajustes[c.clave] = { ms: Math.round(num(c.ms)), empieza: c.empieza === 'principio' || c.empieza === 'golpe' ? c.empieza : 'sitio' }
  }
  let k = 0
  for (const c of a.capas) {
    const empieza = (EMPIEZAS.includes(c.empieza) ? c.empieza : 'principio') as EmpiezaCapa
    if (c.origen === 'code') {
      e.capas.push({ id: `z${++k}`, origen: 'code', nombre: `${c.sonido} · ${c.version}`, ms: Math.round(num(c.ms)), vol: Math.min(2, Math.max(0, num(c.volumen, 1))), empieza, sonido: c.sonido, letra: c.version })
    } else {
      if (!nombreSeguro(c.archivo)) throw new Error(`Archivo con un nombre raro: ${c.archivo}`)
      const datos = archivos.get(c.archivo)
      if (!datos) throw new Error(`En el zip falta el archivo ${c.archivo}.`)
      const copia = new Uint8Array(datos).buffer
      e.capas.push({ id: `z${++k}`, origen: 'archivo', nombre: c.nombre, ms: Math.round(num(c.ms)), vol: Math.min(2, Math.max(0, num(c.volumen, 0.7))), empieza, archivo: { nombre: c.nombre, tipo: mime(c.archivo), bytes: copia } })
    }
  }
  return e
}
