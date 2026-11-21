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

/** Escritor de WAV PCM (por defecto 16 bits mono, un seno corto). Devuelve { buf, muestras, tasa, pico }. */
export function wavDeEjemplo({ tasa = 8000, muestras = 800, amp = 0.5, canales = 1, bits = 16, conLista = false, frecuencia = 440 } = {}) {
  const bytes = bits / 8
  const datos = Buffer.alloc(muestras * canales * bytes)
  let max = 0
  for (let i = 0; i < muestras; i++) {
    const v = Math.sin((2 * Math.PI * frecuencia * i) / tasa) * amp
    for (let c = 0; c < canales; c++) {
      const o = (i * canales + c) * bytes
      if (bits === 16) {
        const q = Math.max(-32768, Math.min(32767, Math.round(v * 32768)))
        datos.writeInt16LE(q, o)
        if (Math.abs(q) > max) max = Math.abs(q)
      } else datos.writeUInt8(Math.max(0, Math.min(255, Math.round(v * 127 + 128))), o)
    }
  }
  const fmt = Buffer.alloc(24)
  fmt.write('fmt ', 0, 'latin1'); fmt.writeUInt32LE(16, 4); fmt.writeUInt16LE(1, 8); fmt.writeUInt16LE(canales, 10)
  fmt.writeUInt32LE(tasa, 12); fmt.writeUInt32LE(tasa * canales * bytes, 16); fmt.writeUInt16LE(canales * bytes, 20); fmt.writeUInt16LE(bits, 22)
  const lista = Buffer.alloc(8 + 6)
  lista.write('LIST', 0, 'latin1'); lista.writeUInt32LE(6, 4); lista.write('INFOxx', 8, 'latin1')
  const cab = Buffer.alloc(8)
  cab.write('data', 0, 'latin1'); cab.writeUInt32LE(datos.length, 4)
  const cuerpo = Buffer.concat([Buffer.from('WAVE', 'latin1'), fmt, ...(conLista ? [lista] : []), cab, datos])
  const riff = Buffer.alloc(8)
  riff.write('RIFF', 0, 'latin1'); riff.writeUInt32LE(cuerpo.length, 4)
  return { buf: Buffer.concat([riff, cuerpo]), muestras, tasa, pico: max / 32768 }
}

const RET_VACIOS = { ini: 0, fin: null, entrada_ms: 0, salida_ms: 0, semitonos: 0, sin_graves: false, brillo_db: 0, eco_pct: 0, igualar: false }
export const RETOQUES_ERIC = { ini: 0.12, fin: 2.4, entrada_ms: 50, salida_ms: 300, semitonos: 3, sin_graves: true, brillo_db: 2, eco_pct: 15, igualar: true }
export const RETOQUES_CODE = { ...RET_VACIOS, salida_ms: 200, semitonos: -2, brillo_db: -1.5 }

/**
 * Estudio con TRES sonidos editados (una capa de Eric, una capa de Code, un sonido_de_code) y los archivos que lleva el zip.
 * Devuelve { estudio, archivos: { nombre: Buffer }, wavs: { nombre: {muestras,tasa,pico} } }.
 */
export function ejemploEditado() {
  const estudio = estudioDeEjemplo()
  const w1 = wavDeEjemplo({ tasa: 44100, muestras: 4410, amp: 0.89 })
  const w2 = wavDeEjemplo({ tasa: 8000, muestras: 800, amp: 0.4, conLista: true })
  const w3 = wavDeEjemplo({ tasa: 16000, muestras: 1600, amp: 0.7, canales: 2 })
  const m = estudio.animaciones.medalla_bronce
  m.capas[1] = { ...m.capas[1], archivo: 'medalla_bronce_1.wav', original: 'medalla_bronce_1_original.mp3', retoques: { ...RETOQUES_ERIC }, muestras: w1.muestras, tasa: w1.tasa, pico: Math.round(w1.pico * 100) / 100 }
  m.capas[0] = { ...m.capas[0], archivo: 'medalla_bronce_emblema_C.wav', retoques: { ...RETOQUES_CODE }, muestras: w2.muestras, tasa: w2.tasa, pico: w2.pico }
  m.sonidos_de_code[0] = { ...m.sonidos_de_code[0], archivo: 'medalla_bronce_golpe_B.wav', retoques: { ...RET_VACIOS }, muestras: w3.muestras, tasa: w3.tasa, pico: w3.pico }
  const archivos = {
    'medalla_bronce_1.wav': w1.buf,
    'medalla_bronce_1_original.mp3': Buffer.from('ID3-original-uno'),
    'medalla_bronce_emblema_C.wav': w2.buf,
    'medalla_bronce_golpe_B.wav': w3.buf,
    'medalla_bronce_2.wav': Buffer.from('RIFF-falso-dos'),
  }
  return { estudio, archivos, wavs: { 'medalla_bronce_1.wav': w1, 'medalla_bronce_emblema_C.wav': w2, 'medalla_bronce_golpe_B.wav': w3 } }
}

/** Zip con estudio.json y los archivos de un `ejemploEditado()` (o una variante). */
export function zipDeEditado({ estudio, archivos }, quitar = []) {
  return escribirZip([
    { nombre: 'LO_ELEGIDO.txt', datos: Buffer.from('Lo elegido (texto para leer)\n') },
    ...Object.entries(archivos).filter(([n]) => !quitar.includes(n)).map(([nombre, datos]) => ({ nombre, datos })),
    { nombre: 'estudio.json', datos: Buffer.from(JSON.stringify(estudio, null, 1)) },
  ])
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
