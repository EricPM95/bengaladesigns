/**
 * (V35B2) UN ZIP PEQUEÑO PARA EL ESTUDIO DE SONIDOS, sin dependencias: escribe entradas «stored» (sin comprimir: los mp3/m4a ya van comprimidos) y lee «stored» y «deflate» (con `DecompressionStream`, que trae el navegador).
 * Nada sale del navegador: todo son bytes en memoria. Pura (salvo `leerZip`, que usa `DecompressionStream` si hay una entrada comprimida).
 */
const TABLA = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
export function crc32(datos: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < datos.length; i++) c = TABLA[(c ^ datos[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

export interface EntradaDeZip {
  nombre: string
  datos: Uint8Array
}
const texto = new TextEncoder()
const u16 = (v: DataView, o: number, n: number) => v.setUint16(o, n, true)
const u32 = (v: DataView, o: number, n: number) => v.setUint32(o, n >>> 0, true)

/** Los nombres del zip: sin barras raras, sin «..», sin repetidos. */
export const nombreSeguro = (n: string): boolean => n.length > 0 && n.length < 200 && !/[\\/]/.test(n) && n !== '.' && n !== '..' && !n.includes('..') && !/[\u0000-\u001f]/.test(n)

/** Un zip con las entradas dadas, sin comprimir. La fecha es fija (1980-01-01) para que el mismo contenido dé siempre los mismos bytes. */
export function crearZip(entradas: EntradaDeZip[]): Uint8Array {
  const vistos = new Set<string>()
  const trozos: Uint8Array[] = []
  const central: Uint8Array[] = []
  let desplazamiento = 0
  for (const e of entradas) {
    if (!nombreSeguro(e.nombre) || vistos.has(e.nombre)) throw new Error(`Nombre de archivo no válido o repetido en el zip: ${e.nombre}`)
    vistos.add(e.nombre)
    const nombre = texto.encode(e.nombre)
    const crc = crc32(e.datos)
    const local = new Uint8Array(30 + nombre.length)
    const v = new DataView(local.buffer)
    u32(v, 0, 0x04034b50)
    u16(v, 4, 20)
    u16(v, 6, 0x0800) // nombres en UTF-8
    u16(v, 8, 0) // stored
    u16(v, 10, 0)
    u16(v, 12, 0x21) // 1980-01-01
    u32(v, 14, crc)
    u32(v, 18, e.datos.length)
    u32(v, 22, e.datos.length)
    u16(v, 26, nombre.length)
    u16(v, 28, 0)
    local.set(nombre, 30)
    trozos.push(local, e.datos)
    const c = new Uint8Array(46 + nombre.length)
    const w = new DataView(c.buffer)
    u32(w, 0, 0x02014b50)
    u16(w, 4, 20)
    u16(w, 6, 20)
    u16(w, 8, 0x0800)
    u16(w, 10, 0)
    u16(w, 12, 0)
    u16(w, 14, 0x21)
    u32(w, 16, crc)
    u32(w, 20, e.datos.length)
    u32(w, 24, e.datos.length)
    u16(w, 28, nombre.length)
    u32(w, 42, desplazamiento)
    c.set(nombre, 46)
    central.push(c)
    desplazamiento += local.length + e.datos.length
  }
  const tamCentral = central.reduce((s, c) => s + c.length, 0)
  const fin = new Uint8Array(22)
  const f = new DataView(fin.buffer)
  u32(f, 0, 0x06054b50)
  u16(f, 8, entradas.length)
  u16(f, 10, entradas.length)
  u32(f, 12, tamCentral)
  u32(f, 16, desplazamiento)
  const todo = new Uint8Array(desplazamiento + tamCentral + 22)
  let p = 0
  for (const t of [...trozos, ...central, fin]) {
    todo.set(t, p)
    p += t.length
  }
  return todo
}

const LIMITE_TOTAL = 200 * 1024 * 1024
const LIMITE_ENTRADAS = 500

async function inflar(datos: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') throw new Error('Este navegador no sabe abrir zips comprimidos.')
  const flujo = new Blob([datos as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(flujo).arrayBuffer())
}

/** Lee un zip («stored» o «deflate»), comprobando el CRC y los límites. Lanza un error con una frase sencilla si no vale. */
export async function leerZip(bytes: Uint8Array): Promise<EntradaDeZip[]> {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let fin = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65535); i--) {
    if (v.getUint32(i, true) === 0x06054b50) {
      fin = i
      break
    }
  }
  if (fin < 0) throw new Error('Ese archivo no es un zip (o está cortado).')
  const cuantas = v.getUint16(fin + 10, true)
  let p = v.getUint32(fin + 16, true)
  if (cuantas > LIMITE_ENTRADAS) throw new Error('El zip trae demasiados archivos.')
  const salida: EntradaDeZip[] = []
  const vistos = new Set<string>()
  let total = 0
  for (let k = 0; k < cuantas; k++) {
    if (p + 46 > bytes.length || v.getUint32(p, true) !== 0x02014b50) throw new Error('El zip está dañado.')
    const flags = v.getUint16(p + 8, true)
    const metodo = v.getUint16(p + 10, true)
    const crc = v.getUint32(p + 16, true)
    const comprimido = v.getUint32(p + 20, true)
    const tam = v.getUint32(p + 24, true)
    const lNombre = v.getUint16(p + 28, true)
    const lExtra = v.getUint16(p + 30, true)
    const lComentario = v.getUint16(p + 32, true)
    const local = v.getUint32(p + 42, true)
    const nombre = new TextDecoder().decode(bytes.subarray(p + 46, p + 46 + lNombre))
    p += 46 + lNombre + lExtra + lComentario
    if (flags & 1) throw new Error('El zip está cifrado: no se puede abrir.')
    if (!nombreSeguro(nombre) || vistos.has(nombre)) throw new Error(`El zip trae un nombre de archivo que no vale: ${nombre}`)
    vistos.add(nombre)
    if (local + 30 > bytes.length || v.getUint32(local, true) !== 0x04034b50) throw new Error('El zip está dañado.')
    const inicio = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true)
    if (inicio + comprimido > bytes.length) throw new Error('El zip está cortado.')
    const crudo = bytes.subarray(inicio, inicio + comprimido)
    let datos: Uint8Array
    if (metodo === 0) datos = new Uint8Array(crudo)
    else if (metodo === 8) datos = await inflar(crudo)
    else throw new Error('El zip usa una compresión que no se conoce.')
    total += datos.length
    if (total > LIMITE_TOTAL || datos.length !== tam) throw new Error('El zip es demasiado grande o está dañado.')
    if (crc32(datos) !== crc) throw new Error(`El archivo ${nombre} del zip está dañado (no coincide su CRC).`)
    salida.push({ nombre, datos })
  }
  return salida
}
