// Escritor de zip minimo (stored y deflate) y estudio de ejemplo, SOLO para la prueba del lector.
import zlib from 'node:zlib'
import { crc32 } from './aplicarEstudio.mjs'

/** entradas: [{ nombre, datos: Buffer, metodo?: 'stored'|'deflate', crcMalo?: bool }] (admite nombres repetidos). */
export function escribirZip(entradas) {
  const partes = []
  const central = []
  let off = 0
  for (const e of entradas) {
    const nombre = Buffer.from(e.nombre, 'utf8')
    const datos = Buffer.isBuffer(e.datos) ? e.datos : Buffer.from(e.datos)
    const deflate = e.metodo === 'deflate'
    const cuerpo = deflate ? zlib.deflateRawSync(datos) : datos
    const crc = (crc32(datos) ^ (e.crcMalo ? 0xdeadbeef : 0)) >>> 0
    const loc = Buffer.alloc(30)
    loc.writeUInt32LE(0x04034b50, 0); loc.writeUInt16LE(20, 4); loc.writeUInt16LE(0x0800, 6)
    loc.writeUInt16LE(deflate ? 8 : 0, 8); loc.writeUInt32LE(crc, 14)
    loc.writeUInt32LE(cuerpo.length, 18); loc.writeUInt32LE(datos.length, 22); loc.writeUInt16LE(nombre.length, 26)
    partes.push(loc, nombre, cuerpo)
    const cen = Buffer.alloc(46)
    cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6); cen.writeUInt16LE(0x0800, 8)
    cen.writeUInt16LE(deflate ? 8 : 0, 10); cen.writeUInt32LE(crc, 16)
    cen.writeUInt32LE(cuerpo.length, 20); cen.writeUInt32LE(datos.length, 24); cen.writeUInt16LE(nombre.length, 28)
    cen.writeUInt32LE(off, 42)
    central.push(cen, nombre)
    off += 30 + nombre.length + cuerpo.length
  }
  const cd = Buffer.concat(central)
  const fin = Buffer.alloc(22)
  fin.writeUInt32LE(0x06054b50, 0); fin.writeUInt16LE(entradas.length, 8); fin.writeUInt16LE(entradas.length, 10)
  fin.writeUInt32LE(cd.length, 12); fin.writeUInt32LE(off, 16)
  return Buffer.concat([...partes, cd, fin])
}

/** Un estudio.json de ejemplo valido (version 1) con dos animaciones. */
export function estudioDeEjemplo() {
  return {
    version: 1,
    generado: '2026-11-21T10:00:00.000Z',
    volumen_general: 0.8,
    animaciones: {
      medalla_bronce: {
        nombre: 'Medalla de bronce', duracion: 5.31, golpe: 4.4,
        sonidos_de_code: [
          { clave: 'archivo:medalla_bronce', tipo: 'archivo', sonido: 'medalla_bronce', version: 'B', silenciado: false, volumen: 1, ms: -300, empieza: 'sitio' },
          { clave: 'sint:tic', tipo: 'sint', sonido: 'tic', version: null, silenciado: true, volumen: 0.5, ms: 0, empieza: 'sitio' },
        ],
        capas: [
          { origen: 'code', sonido: 'emblema', version: 'C', volumen: 0.75, ms: 1200, empieza: 'principio' },
          { origen: 'archivo', archivo: 'medalla_bronce_1.mp3', nombre: 'mi sonido.mp3', volumen: 1.5, ms: 120, empieza: 'golpe' },
          { origen: 'archivo', archivo: 'medalla_bronce_2.wav', nombre: 'otro.wav', volumen: 1, ms: -50, empieza: 'principio' },
        ],
      },
      tic: {
        nombre: 'Tic de los numeros que suben', duracion: 2, golpe: 2,
        sonidos_de_code: [{ clave: 'sint:tic', tipo: 'sint', sonido: 'tic', version: null, silenciado: false, volumen: 1, ms: 0, empieza: 'principio' }],
        capas: [],
      },
    },
  }
}

export function zipDeEjemplo(estudio = estudioDeEjemplo(), extra = {}) {
  return escribirZip([
    { nombre: 'LO_ELEGIDO.txt', datos: Buffer.from('Lo elegido (texto para leer)\n') },
    { nombre: 'medalla_bronce_1.mp3', datos: Buffer.from('ID3-falso-uno') },
    { nombre: 'medalla_bronce_2.wav', datos: Buffer.from('RIFF-falso-dos'), metodo: 'deflate' },
    { nombre: 'estudio.json', datos: Buffer.from(JSON.stringify(estudio, null, 1)) },
    ...(extra.entradas ?? []),
  ])
}
