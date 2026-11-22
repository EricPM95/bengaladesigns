import { llamar } from './logros'

/**
 * (V39) «EL VIAJE DE TUS SUEÑOS»: un país o un destino (ciudad, isla…) que a la persona le encantaría visitar. Solo UNO, opcional. Vive en la pregunta 3 de la primera vez y en Ajustes.
 * La lista del buscador va DENTRO de la app (cero llamadas a servicios de fuera): los países de `data/logros/paises_mundo.json` y los destinos famosos de `data/primera_vez/suenos.json` (Eric los edita a mano).
 * Los dos archivos se cargan perezosamente (`cargarLista`): no entran en el peso inicial de la app.
 *
 * Lo que se guarda en la cuenta (`viajero_primera_vez`, migración 0093): { tipo: 'pais' | 'destino', nombre, iso } (el código de país en minúscula; el servidor le añade el nombre «limpio» para contar).
 * Consultas a Supabase: ninguna desde el móvil (todo va por `/api/primera-vez/sueno`, una vez al elegir y una al abrir Ajustes: una fila, unos 100 bytes; nada en bucle).
 */
export type TipoSueno = 'pais' | 'destino'
export interface Sueno {
  tipo: TipoSueno
  /** El nombre tal como se enseña: «Japón», «Tokio». */
  nombre: string
  /** El país, 2 letras en minúscula (de un país, el suyo; de un destino, el país donde está). */
  iso: string
}
/** Una opción del buscador: el sueño más lo que se escribe debajo («Destino · Japón») y las palabras con las que se encuentra. */
export interface OpcionSueno extends Sueno {
  /** El nombre del país en español («Japón»). */
  pais: string
  /** Texto sin tildes ni mayúsculas con el que se compara (el nombre y los otros nombres). */
  claves: string[]
}

/** Pura: sin tildes, sin mayúsculas y con los espacios justos («  NUEVA   york » → «nueva york»). Igual que `limpiar` del servidor. */
export const sinTildes = (t: unknown): string =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .trim()

/** El nombre del país en español (el del navegador; sin él, el código en mayúsculas). */
export function nombreDePais(iso: string): string {
  try {
    return new Intl.DisplayNames(['es'], { type: 'region' }).of(iso.toUpperCase()) ?? iso.toUpperCase()
  } catch {
    return iso.toUpperCase()
  }
}

interface ArchivoPaises {
  i: string
  n: string
}
interface ArchivoSuenos {
  sugerencias: string[]
  destinos: string[]
}

/** Pura: de las líneas del archivo («Tokio|jp|Tokyo») y la lista de países, todas las opciones. Los comentarios («# …») se ignoran; un destino que repite el nombre de un país (del mismo país) no sale dos veces. */
export function construirLista(paises: ArchivoPaises[], destinos: string[]): OpcionSueno[] {
  const lista: OpcionSueno[] = paises.map((p) => ({ tipo: 'pais', nombre: p.n, iso: p.i.toLowerCase(), pais: p.n, claves: [sinTildes(p.n)] }))
  const hay = new Set(lista.map((o) => `${o.iso}|${sinTildes(o.nombre)}`))
  for (const linea of destinos) {
    const crudo = String(linea ?? '').trim()
    if (!crudo || crudo.startsWith('#')) continue
    const [nombre, iso, otros] = crudo.split('|').map((x) => x.trim())
    if (!nombre || !/^[a-z]{2}$/.test(iso ?? '')) continue
    if (hay.has(`${iso}|${sinTildes(nombre)}`)) continue
    hay.add(`${iso}|${sinTildes(nombre)}`)
    lista.push({ tipo: 'destino', nombre, iso, pais: nombreDePais(iso), claves: [sinTildes(nombre), ...(otros ? otros.split(';').map(sinTildes).filter(Boolean) : [])] })
  }
  return lista
}

/** Pura: las opciones que encajan con lo escrito: el nombre igual, luego los que EMPIEZAN por ello, luego los destinos de ese país («japon» trae Japón y después Tokio, Kioto, Osaka…), luego una palabra suelta o un trozo. Un país va antes que un destino con el mismo encaje; entre iguales, el orden del archivo (que Eric ordena de más a menos famoso). Máximo `tope`. */
export function buscarSuenos(lista: OpcionSueno[], texto: string, tope = 8): OpcionSueno[] {
  const q = sinTildes(texto)
  if (q.length < 1) return []
  const puntos: { o: OpcionSueno; p: number; i: number }[] = []
  for (const [i, o] of lista.entries()) {
    let p = 99
    for (const c of o.claves) {
      if (c === q) p = Math.min(p, 0)
      else if (c.startsWith(q)) p = Math.min(p, 1)
      else if (c.split(' ').some((w) => w.startsWith(q))) p = Math.min(p, 3)
      else if (q.length >= 3 && c.includes(q)) p = Math.min(p, 4)
    }
    // Por el país donde está: «japon» también trae Tokio y Kioto, justo detrás de lo que EMPIEZA así.
    if (o.tipo === 'destino' && p > 2 && sinTildes(o.pais).startsWith(q)) p = 2
    if (p < 99) puntos.push({ o, p, i })
  }
  puntos.sort((a, b) => a.p - b.p || (a.o.tipo === b.o.tipo ? 0 : a.o.tipo === 'pais' ? -1 : 1) || a.i - b.i)
  return puntos.slice(0, tope).map((x) => x.o)
}

/** Pura: las sugerencias de antes de escribir: cada nombre del archivo, buscado entre las opciones (el país antes que un destino con el mismo nombre). */
export function sugerenciasDe(lista: OpcionSueno[], nombres: string[]): OpcionSueno[] {
  const fuera: OpcionSueno[] = []
  for (const n of nombres) {
    const k = sinTildes(n)
    const o = lista.find((x) => x.tipo === 'pais' && sinTildes(x.nombre) === k) ?? lista.find((x) => sinTildes(x.nombre) === k)
    if (o) fuera.push(o)
  }
  return fuera
}

/** Pura: lo que se escribe bajo el nombre elegido: «País» o «Destino · Japón». */
export const lineaDelSueno = (s: Pick<Sueno, 'tipo' | 'iso'>): string => (s.tipo === 'pais' ? 'País' : `Destino · ${nombreDePais(s.iso)}`)

export interface ListaCargada {
  opciones: OpcionSueno[]
  sugerencias: OpcionSueno[]
}
let enMarcha: Promise<ListaCargada> | null = null
/** Carga (una vez) la lista: los dos archivos JSON se piden al abrir el buscador, no al abrir la app. Todo local: ninguna llamada de red. */
export function cargarLista(): Promise<ListaCargada> {
  if (!enMarcha) {
    enMarcha = Promise.all([import('../../data/logros/paises_mundo.json'), import('../../data/primera_vez/suenos.json')]).then(([p, s]) => {
      const paises = (p as unknown as { default: ArchivoPaises[] }).default
      const suenos = (s as unknown as { default: ArchivoSuenos }).default
      const opciones = construirLista(paises, suenos.destinos)
      return { opciones, sugerencias: sugerenciasDe(opciones, suenos.sugerencias) }
    })
  }
  return enMarcha
}

/** Pura: ¿es un sueño válido (lo que el servidor acepta)? */
export const esSuenoValido = (s: unknown): s is Sueno => {
  const x = s as Partial<Sueno> | null
  return Boolean(x) && (x?.tipo === 'pais' || x?.tipo === 'destino') && typeof x.nombre === 'string' && x.nombre.trim().length >= 2 && x.nombre.length <= 80 && typeof x.iso === 'string' && /^[a-z]{2}$/.test(x.iso)
}

/** El sueño de esta cuenta, o null (sin sueño, sin servidor, o sin la migración 0093). `disponible` = false si el servidor no puede guardarlo (sin la 0093: Ajustes no enseña la fila). */
export async function leerSueno(): Promise<{ sueno: Sueno | null; disponible: boolean }> {
  const r = await llamar<{ ok?: boolean; sueno?: unknown; disponible?: boolean }>('/api/primera-vez/sueno')
  if (!r?.ok) return { sueno: null, disponible: false }
  return { sueno: esSuenoValido(r.sueno) ? r.sueno : null, disponible: r.disponible !== false }
}

/** Guarda (o quita, con null) el viaje de sus sueños. true = guardado. Solo viaja { tipo, nombre, iso }. */
export async function guardarSueno(s: Sueno | null): Promise<boolean> {
  const r = await llamar<{ ok?: boolean; guardado?: boolean }>('/api/primera-vez/sueno', { metodo: 'PUT', cuerpo: { sueno: s && esSuenoValido(s) ? { tipo: s.tipo, nombre: s.nombre.trim(), iso: s.iso } : null } })
  return Boolean(r?.ok) && r?.guardado !== false
}
