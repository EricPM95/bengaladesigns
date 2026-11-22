// Lector de sonidos_jutrip.zip (el que baja el estudio /admin/sonidos).
// Uso:  node scripts/sonidos/aplicarEstudio.mjs <zip> [--escribir] [--destino <carpeta raiz>]
// Por defecto es EN SECO: valida todo y enseña, animacion por animacion, EXACTAMENTE lo que suena.
// Si algo no vale, sale con codigo 1 y dice que (nunca arregla ni interpreta nada).
// Con --escribir copia los archivos de Eric a <destino>/public/sonidos/estudio/ y escribe
// <destino>/data/sonidos/estudio.json (el mismo json ya validado, con las claves ordenadas). Nada mas.
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
export const RAIZ_REPO = path.resolve(AQUI, '..', '..')

export const LIMITE_BYTES = 200 * 1024 * 1024
export const LIMITE_ENTRADAS = 500
export const SINTETICOS = ['toque', 'clic', 'redoble', 'brillo', 'vuelo', 'tic', 'campanita']
export const EXTENSIONES = ['.mp3', '.m4a', '.wav', '.ogg']
const EMPIEZA_CODE = ['sitio', 'principio', 'golpe']
const EMPIEZA_CAPA = ['principio', 'golpe']

// ---------------------------------------------------------------- zip
const TABLA_CRC = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
export function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = TABLA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** Un nombre de entrada del zip: solo un nombre suelto, sin rutas ni cosas raras. Devuelve el motivo o null. */
export function motivoNombreMalo(n) {
  if (typeof n !== 'string' || n.length === 0) return 'esta vacio'
  if (n.length > 120) return 'es demasiado largo'
  if (n.includes('..')) return 'lleva «..»'
  if (/[\\/]/.test(n)) return 'lleva barras'
  if (n.startsWith('.')) return 'empieza por punto'
  if (/[\0-\x1f:*?"<>|]/.test(n)) return 'lleva caracteres raros'
  if (n !== n.trim() || n.endsWith('.')) return 'acaba en espacio o punto'
  return null
}

/** Lee un zip entero en memoria. Devuelve [{ nombre, datos: Buffer }]. Lanza Error si algo no vale. */
export function leerZip(buf) {
  if (!Buffer.isBuffer(buf)) throw new Error('El zip no es un buffer')
  if (buf.length < 22) throw new Error('El zip esta truncado o vacio (menos de 22 bytes)')
  let eocd = -1
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) throw new Error('El zip esta truncado: no se encuentra el final del indice')
  const disco = buf.readUInt16LE(eocd + 4), discoIni = buf.readUInt16LE(eocd + 6)
  const nDisco = buf.readUInt16LE(eocd + 8), n = buf.readUInt16LE(eocd + 10)
  const tamCd = buf.readUInt32LE(eocd + 12), offCd = buf.readUInt32LE(eocd + 16)
  if (disco !== 0 || discoIni !== 0 || nDisco !== n) throw new Error('Zip en varios discos: no vale')
  if (n === 0xffff || tamCd === 0xffffffff || offCd === 0xffffffff) throw new Error('Zip64: no vale')
  if (eocd >= 20 && buf.readUInt32LE(eocd - 20) === 0x07064b50) throw new Error('Zip64: no vale')
  if (n > LIMITE_ENTRADAS) throw new Error(`El zip tiene ${n} entradas (maximo ${LIMITE_ENTRADAS})`)
  if (offCd + tamCd > eocd) throw new Error('El zip esta truncado o roto: el indice se sale del archivo')
  const salida = []
  const vistos = new Set()
  let total = 0
  let p = offCd
  for (let k = 0; k < n; k++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) throw new Error(`Entrada ${k + 1}: indice roto`)
    const flags = buf.readUInt16LE(p + 8), metodo = buf.readUInt16LE(p + 10)
    const crc = buf.readUInt32LE(p + 16), csize = buf.readUInt32LE(p + 20), usize = buf.readUInt32LE(p + 24)
    const nlen = buf.readUInt16LE(p + 28), elen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32)
    const off = buf.readUInt32LE(p + 42)
    if (p + 46 + nlen + elen + clen > buf.length) throw new Error(`Entrada ${k + 1}: indice truncado`)
    const nombre = buf.toString('utf8', p + 46, p + 46 + nlen)
    p += 46 + nlen + elen + clen
    const mal = motivoNombreMalo(nombre)
    if (mal) throw new Error(`Entrada «${nombre}»: nombre no valido (${mal})`)
    if (vistos.has(nombre)) throw new Error(`Entrada repetida: «${nombre}»`)
    vistos.add(nombre)
    if (flags & 1 || flags & 0x40) throw new Error(`«${nombre}»: esta cifrado`)
    if (csize === 0xffffffff || usize === 0xffffffff || off === 0xffffffff) throw new Error(`«${nombre}»: zip64, no vale`)
    if (metodo !== 0 && metodo !== 8) throw new Error(`«${nombre}»: metodo de compresion ${metodo} no admitido (solo stored y deflate)`)
    total += usize
    if (total > LIMITE_BYTES) throw new Error('El zip descomprimido pasa de 200 MB')
    if (off + 30 > buf.length || buf.readUInt32LE(off) !== 0x04034b50) throw new Error(`«${nombre}»: cabecera local rota`)
    const lnlen = buf.readUInt16LE(off + 26), lelen = buf.readUInt16LE(off + 28)
    if (buf.toString('utf8', off + 30, off + 30 + lnlen) !== nombre) throw new Error(`«${nombre}»: el nombre no coincide con su cabecera local`)
    const ini = off + 30 + lnlen + lelen
    if (ini + csize > buf.length || ini + csize > offCd) throw new Error(`«${nombre}»: datos truncados`)
    const crudo = buf.subarray(ini, ini + csize)
    let datos
    if (metodo === 0) {
      if (csize !== usize) throw new Error(`«${nombre}»: tamanos distintos en una entrada sin comprimir`)
      datos = Buffer.from(crudo)
    } else {
      try { datos = zlib.inflateRawSync(crudo, { maxOutputLength: usize + 1 }) } catch (e) { throw new Error(`«${nombre}»: no se puede descomprimir (${e.code || e.message})`) }
      if (datos.length !== usize) throw new Error(`«${nombre}»: el tamano descomprimido no coincide`)
    }
    if (crc32(datos) !== crc) throw new Error(`«${nombre}»: CRC malo (el archivo esta danado)`)
    salida.push({ nombre, datos })
  }
  return salida
}

// ---------------------------------------------------------------- validacion
const esNum = (x) => typeof x === 'number' && Number.isFinite(x)
const tiene = (o, k) => Object.prototype.hasOwnProperty.call(o, k)
const esObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x)

function sinClavesExtra(o, permitidas, donde, errs) {
  for (const k of Object.keys(o)) if (!permitidas.includes(k)) errs.push(`${donde}: clave desconocida «${k}»`)
}

// ---- retoques y wav final (V36B): el estudio ya deja cada sonido editado HECHO; aqui solo se comprueba.
export const CLAVES_RETOQUES = ['ini', 'fin', 'entrada_ms', 'salida_ms', 'semitonos', 'sin_graves', 'brillo_db', 'eco_pct', 'igualar']
const CAMPOS_EDIT = ['retoques', 'archivo', 'muestras', 'tasa', 'pico']

/** Lista de errores de un objeto `retoques` (vacia = vale). */
export function erroresRetoques(r) {
  if (!esObj(r)) return ['retoques tiene que ser un objeto']
  const e = []
  for (const k of Object.keys(r)) if (!CLAVES_RETOQUES.includes(k)) e.push(`retoques: clave desconocida «${k}»`)
  for (const k of CLAVES_RETOQUES) if (!tiene(r, k)) e.push(`retoques: falta «${k}»`)
  const rango = (k, min, max) => {
    if (tiene(r, k) && (!esNum(r[k]) || r[k] < min || r[k] > max)) e.push(`retoques: ${k} tiene que ser un numero de ${min} a ${max}`)
  }
  if (tiene(r, 'ini') && (!esNum(r.ini) || r.ini < 0)) e.push('retoques: ini tiene que ser un numero de segundos mayor o igual que 0')
  if (tiene(r, 'fin') && r.fin !== null && (!esNum(r.fin) || (esNum(r.ini) && r.fin <= r.ini))) e.push('retoques: fin tiene que ser null o un numero mayor que ini')
  rango('entrada_ms', 0, 2000); rango('salida_ms', 0, 2000)
  rango('semitonos', -6, 6); rango('brillo_db', -6, 6); rango('eco_pct', 0, 30)
  for (const k of ['sin_graves', 'igualar']) if (tiene(r, k) && typeof r[k] !== 'boolean') e.push(`retoques: ${k} tiene que ser true o false`)
  return e
}

/** Lee un WAV PCM de 16 bits (1 o 2 canales). Ignora chunks extra (LIST...). Lanza Error si no vale. */
export function leerWav(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12 || buf.toString('latin1', 0, 4) !== 'RIFF' || buf.toString('latin1', 8, 12) !== 'WAVE') throw new Error('no es un WAV (falta RIFF/WAVE)')
  let p = 12, fmt = null, data = null
  while (p + 8 <= buf.length) {
    const id = buf.toString('latin1', p, p + 4), len = buf.readUInt32LE(p + 4), ini = p + 8
    if (id === 'fmt ') {
      if (len < 16 || ini + 16 > buf.length) throw new Error('la cabecera «fmt » esta rota')
      fmt = { formato: buf.readUInt16LE(ini), canales: buf.readUInt16LE(ini + 2), tasa: buf.readUInt32LE(ini + 4), bits: buf.readUInt16LE(ini + 14) }
    } else if (id === 'data') {
      if (ini + len > buf.length) throw new Error('el WAV esta truncado (faltan datos)')
      data = { ini, len }
    }
    p = ini + len + (len & 1)
  }
  if (!fmt) throw new Error('falta la cabecera «fmt »')
  if (!data) throw new Error('falta el bloque «data»')
  if (fmt.formato !== 1) throw new Error(`no es PCM (formato ${fmt.formato})`)
  if (fmt.bits !== 16) throw new Error(`tiene que ser de 16 bits y es de ${fmt.bits}`)
  if (fmt.canales !== 1 && fmt.canales !== 2) throw new Error(`tiene que tener 1 o 2 canales y tiene ${fmt.canales}`)
  const marco = 2 * fmt.canales
  if (data.len % marco !== 0) throw new Error('el bloque «data» no es un numero entero de muestras')
  let max = 0
  for (let i = data.ini; i < data.ini + data.len; i += 2) { const v = Math.abs(buf.readInt16LE(i)); if (v > max) max = v }
  return { canales: fmt.canales, tasa: fmt.tasa, muestras: data.len / marco, pico: max / 32768 }
}

/** Valida los campos de un sonido editado (retoques, wav final, original). */
function validarEditado(x, dd, conOriginal, { errs, enZip, datosDe }) {
  const claves = conOriginal ? [...CAMPOS_EDIT, 'original'] : CAMPOS_EDIT
  const faltan = claves.filter((k) => !tiene(x, k))
  if (faltan.length) { errs.push(`${dd}: sonido editado a medias, faltan ${faltan.map((k) => `«${k}»`).join(', ')}`); return }
  for (const m of erroresRetoques(x.retoques)) errs.push(`${dd}: ${m}`)
  let wavOk = false
  const mal = motivoNombreMalo(x.archivo)
  if (mal) errs.push(`${dd}: nombre del archivo final no valido (${mal})`)
  else if (path.extname(x.archivo).toLowerCase() !== '.wav') errs.push(`${dd}: el archivo final «${x.archivo}» tiene que ser .wav`)
  else if (!enZip.has(x.archivo)) errs.push(`${dd}: el archivo final «${x.archivo}» no esta en el zip`)
  else wavOk = true
  if (conOriginal) {
    const m2 = motivoNombreMalo(x.original)
    if (m2) errs.push(`${dd}: nombre del original no valido (${m2})`)
    else {
      if (!EXTENSIONES.includes(path.extname(x.original).toLowerCase())) errs.push(`${dd}: el original «${x.original}» no es mp3, m4a, wav ni ogg`)
      if (x.original === x.archivo) errs.push(`${dd}: el original y el final no pueden ser el mismo archivo`)
      if (!enZip.has(x.original)) errs.push(`${dd}: el original «${x.original}» no esta en el zip`)
    }
  }
  if (!Number.isInteger(x.muestras) || x.muestras < 1) errs.push(`${dd}: muestras tiene que ser un entero mayor que 0`)
  if (!Number.isInteger(x.tasa) || x.tasa < 1) errs.push(`${dd}: tasa tiene que ser un entero (Hz) mayor que 0`)
  if (!esNum(x.pico) || x.pico < 0 || x.pico > 1) errs.push(`${dd}: pico tiene que ser un numero de 0 a 1`)
  const datos = wavOk ? datosDe(x.archivo) : null
  if (datos) {
    let w
    try { w = leerWav(datos) } catch (e) { errs.push(`${dd}: el wav final «${x.archivo}» no vale (${e.message})`); return }
    if (Number.isInteger(x.muestras) && w.muestras !== x.muestras) errs.push(`${dd}: muestras no coincide (el estudio dice ${x.muestras} y el wav tiene ${w.muestras})`)
    if (Number.isInteger(x.tasa) && w.tasa !== x.tasa) errs.push(`${dd}: tasa no coincide (el estudio dice ${x.tasa} Hz y el wav tiene ${w.tasa} Hz)`)
    if (esNum(x.pico) && Math.abs(w.pico - x.pico) > 0.01) errs.push(`${dd}: pico no coincide (el estudio dice ${x.pico} y el wav tiene ${w.pico.toFixed(3)})`)
  }
}

function listaDe(x) {
  if (x instanceof Set) return x
  if (x instanceof Map) return new Set(x.keys())
  if (Array.isArray(x)) return new Set(x)
  return new Set(Object.keys(x ?? {}))
}

/** Devuelve la lista de errores (vacia = todo bien). No arregla nada. */
export function validarEstudio(json, { animaciones, manifiesto, archivos }) {
  const errs = []
  const ids = listaDe(animaciones)
  const enZip = listaDe(archivos)
  const datosDe = (n) => (archivos instanceof Map ? archivos.get(n) ?? null : null)
  const ctx = { errs, enZip, datosDe }
  if (!esObj(json)) return ['estudio.json no es un objeto']
  if (json.version !== 1) errs.push(`version: tiene que ser 1 y es ${JSON.stringify(json.version)}`)
  sinClavesExtra(json, ['version', 'generado', 'volumen_general', 'animaciones'], 'estudio', errs)
  if (typeof json.generado !== 'string' || Number.isNaN(Date.parse(json.generado))) errs.push('generado: tiene que ser una fecha')
  if (!esNum(json.volumen_general) || json.volumen_general < 0 || json.volumen_general > 2) errs.push('volumen_general: tiene que ser un numero de 0 a 2')
  if (!esObj(json.animaciones)) { errs.push('animaciones: tiene que ser un objeto'); return errs }

  for (const id of Object.keys(json.animaciones)) {
    const a = json.animaciones[id]
    const d = `animacion «${id}»`
    if (!ids.has(id)) { errs.push(`${d}: no existe en el estudio de la app`); continue }
    if (!esObj(a)) { errs.push(`${d}: no es un objeto`); continue }
    sinClavesExtra(a, ['nombre', 'duracion', 'golpe', 'tramos', 'sonidos_de_code', 'capas'], d, errs)
    // (V38E) `tramos`: en qué segundo de la animacion ENTERA empieza cada partitura (opcional; un zip de antes no lo trae).
    // (V39B) El Coliseo empieza con su suspense (3,6 s) y la película entra después: un zip de antes (sin partes, o con la película a los 0 s) tiene sus sonidos contados desde el principio de la película. Se baja otra vez del estudio.
    if (id === 'emblema_maravilla' && !(Array.isArray(a.tramos) && a.tramos.some((x) => esObj(x) && x.partitura === 'escena' && esNum(x.empieza) && x.empieza >= 3))) errs.push(`${d}: este zip es de antes de que el Coliseo empezara con su suspense (los sonidos van contados desde el principio de la pelicula): vuelve a bajarlo del estudio`)
    if (a.tramos !== undefined) {
      if (!Array.isArray(a.tramos)) errs.push(`${d}: tramos tiene que ser una lista`)
      else for (const x of a.tramos) if (!esObj(x) || typeof x.partitura !== 'string' || !esNum(x.empieza) || x.empieza < 0 || (esNum(a.duracion) && x.empieza > a.duracion)) errs.push(`${d}: un tramo no vale (partitura y segundo de 0 a la duracion)`)
    }
    if (typeof a.nombre !== 'string' || !a.nombre) errs.push(`${d}: falta el nombre`)
    if (!esNum(a.duracion) || a.duracion <= 0 || a.duracion > 600) errs.push(`${d}: duracion no valida`)
    if (!esNum(a.golpe) || a.golpe < 0 || (esNum(a.duracion) && a.golpe > a.duracion)) errs.push(`${d}: golpe no valido (de 0 a la duracion)`)
    const tope = esNum(a.duracion) ? Math.round((a.duracion + 2) * 1000) : 0

    const comunes = (x, donde, permitidos) => {
      if (!esNum(x.volumen) || x.volumen < 0 || x.volumen > 2) errs.push(`${donde}: volumen tiene que estar entre 0 y 2`)
      if (!Number.isInteger(x.ms) || Math.abs(x.ms) > tope) errs.push(`${donde}: ms tiene que ser un entero entre -${tope} y ${tope}`)
      if (!permitidos.includes(x.empieza)) errs.push(`${donde}: empieza tiene que ser ${permitidos.join(' / ')}`)
    }
    const sonidoCode = (x, donde) => {
      const s = x.sonido
      if (typeof s !== 'string') { errs.push(`${donde}: falta el sonido`); return }
      if (tiene(manifiesto, s)) {
        if (typeof x.version !== 'string' || !tiene(manifiesto[s], x.version)) errs.push(`${donde}: la version ${JSON.stringify(x.version)} de «${s}» no existe (hay ${Object.keys(manifiesto[s]).join(', ')})`)
      } else if (SINTETICOS.includes(s)) {
        if (x.version !== null && x.version !== undefined) errs.push(`${donde}: un sonido hecho por codigo («${s}») no lleva version`)
      } else errs.push(`${donde}: sonido de Code desconocido «${s}»`)
    }

    if (!Array.isArray(a.sonidos_de_code)) errs.push(`${d}: sonidos_de_code tiene que ser una lista`)
    else {
      const claves = new Set()
      a.sonidos_de_code.forEach((s, i) => {
        const dd = `${d}, sonido de Code ${i + 1}`
        if (!esObj(s)) { errs.push(`${dd}: no es un objeto`); return }
        sinClavesExtra(s, ['clave', 'tipo', 'sonido', 'version', 'silenciado', 'volumen', 'ms', 'empieza', ...CAMPOS_EDIT], dd, errs)
        if (CAMPOS_EDIT.some((k) => tiene(s, k))) {
          if (s.tipo !== 'archivo') errs.push(`${dd}: solo los sonidos grabados (tipo archivo) pueden ir editados`)
          else validarEditado(s, dd, false, ctx)
        }
        if (s.tipo !== 'archivo' && s.tipo !== 'sint') errs.push(`${dd}: tipo tiene que ser archivo o sint`)
        else {
          if (s.clave !== `${s.tipo}:${s.sonido}`) errs.push(`${dd}: la clave ${JSON.stringify(s.clave)} no es «${s.tipo}:${s.sonido}»`)
          if (s.tipo === 'archivo' && !tiene(manifiesto, String(s.sonido))) errs.push(`${dd}: «${s.sonido}» no es un sonido grabado`)
          if (s.tipo === 'sint' && !SINTETICOS.includes(s.sonido)) errs.push(`${dd}: «${s.sonido}» no es un sonido hecho por codigo`)
        }
        if (claves.has(s.clave)) errs.push(`${dd}: clave repetida «${s.clave}»`)
        claves.add(s.clave)
        sonidoCode(s, dd)
        if (typeof s.silenciado !== 'boolean') errs.push(`${dd}: silenciado tiene que ser true o false`)
        comunes(s, dd, EMPIEZA_CODE)
      })
    }

    if (!Array.isArray(a.capas)) errs.push(`${d}: capas tiene que ser una lista`)
    else a.capas.forEach((c, i) => {
      const dd = `${d}, capa ${i + 1}`
      if (!esObj(c)) { errs.push(`${dd}: no es un objeto`); return }
      if (c.origen === 'code') {
        sinClavesExtra(c, ['origen', 'sonido', 'version', 'volumen', 'ms', 'empieza', ...CAMPOS_EDIT], dd, errs)
        sonidoCode(c, dd)
        if (CAMPOS_EDIT.some((k) => tiene(c, k))) {
          if (!tiene(manifiesto, String(c.sonido))) errs.push(`${dd}: solo los sonidos grabados pueden ir editados`)
          else validarEditado(c, dd, false, ctx)
        }
      } else if (c.origen === 'archivo') {
        sinClavesExtra(c, ['origen', 'archivo', 'nombre', 'volumen', 'ms', 'empieza', 'original', 'retoques', 'muestras', 'tasa', 'pico'], dd, errs)
        const editada = ['original', 'retoques', 'muestras', 'tasa', 'pico'].some((k) => tiene(c, k))
        const mal = motivoNombreMalo(c.archivo)
        if (editada) validarEditado(c, dd, true, ctx)
        else if (mal) errs.push(`${dd}: nombre de archivo no valido (${mal})`)
        else {
          if (!EXTENSIONES.includes(path.extname(c.archivo).toLowerCase())) errs.push(`${dd}: «${c.archivo}» no es mp3, m4a, wav ni ogg`)
          if (!enZip.has(c.archivo)) errs.push(`${dd}: el archivo «${c.archivo}» no esta en el zip`)
        }
        if (typeof c.nombre !== 'string') errs.push(`${dd}: falta el nombre original`)
      } else errs.push(`${dd}: origen tiene que ser code o archivo`)
      comunes(c, dd, EMPIEZA_CAPA)
    })
  }
  return errs
}

// ---------------------------------------------------------------- descripcion
const pct = (v) => `${Math.round(v * 100)} %`
const mov = (ms, desde) => (ms === 0 ? `sin moverlo, desde ${desde}` : `${ms > 0 ? '+' : ''}${ms} ms (${ms > 0 ? 'despues' : 'antes'}) desde ${desde}`)
const DESDE = { sitio: 'donde suena de siempre', principio: 'el primer fotograma de la animacion', golpe: 'el golpe' }
/** (V38E) El segundo EXACTO de la animacion entera en que suena (solo cuando se cuenta desde el principio o desde el golpe; «donde suena de siempre» depende del sonido). */
export const segundoExacto = (ms, desde, golpe) => (desde === 'principio' ? ms / 1000 : desde === 'golpe' ? golpe + ms / 1000 : null)
const enSegundo = (ms, desde, golpe) => {
  const s = segundoExacto(ms, desde, golpe)
  return s === null ? '' : ` · empieza en el segundo ${seg(s)} de la animacion`
}

const coma = (v, dec = 2) => Number(v.toFixed(dec)).toString().replace('.', ',')
const seg = (v) => v.toFixed(2).replace('.', ',')
const conSigno = (v) => (v < 0 ? '−' : '+') + coma(Math.abs(v), 1)

/** Los retoques en palabras (solo los que estan activos). */
export function describirRetoques(r) {
  const p = []
  if (r.ini > 0 && r.fin !== null) p.push(`recortado ${seg(r.ini)} s – ${seg(r.fin)} s`)
  else if (r.ini > 0) p.push(`recortado desde ${seg(r.ini)} s`)
  else if (r.fin !== null) p.push(`recortado hasta ${seg(r.fin)} s`)
  if (r.entrada_ms > 0 && r.salida_ms > 0) p.push(`fundido entrada ${r.entrada_ms} ms · salida ${r.salida_ms} ms`)
  else if (r.entrada_ms > 0) p.push(`fundido entrada ${r.entrada_ms} ms`)
  else if (r.salida_ms > 0) p.push(`fundido salida ${r.salida_ms} ms`)
  if (r.semitonos !== 0) p.push(`${conSigno(r.semitonos)} semitonos (velocidad)`)
  if (r.sin_graves) p.push('sin graves')
  if (r.brillo_db !== 0) p.push(`brillo ${conSigno(r.brillo_db)} dB`)
  if (r.eco_pct > 0) p.push(`eco ${coma(r.eco_pct)} %`)
  if (r.igualar) p.push('igualado a −1 dB de pico')
  return p.length ? p.join(' · ') : 'sin retoques activos'
}
const datosWav = (x) => `${x.tasa} Hz · ${x.muestras} muestras · pico ${x.pico.toFixed(2).replace('.', ',')}`
const lineaEditado = (x) => `    Editado · ${describirRetoques(x.retoques)} · ${datosWav(x)}`

/** Una linea por sonido, animacion por animacion: exactamente lo que suena. */
export function describir(json) {
  const out = [`Estudio version ${json.version} · generado ${json.generado} · volumen general ${pct(json.volumen_general)}`]
  for (const id of Object.keys(json.animaciones).sort()) {
    const a = json.animaciones[id]
    out.push('', `${a.nombre} (${id}) · dura ${a.duracion} s · golpe a los ${a.golpe} s`)
    if (a.tramos?.length) out.push(`  Partes: ${a.tramos.map((x) => `«${x.partitura}» empieza en el segundo ${seg(x.empieza)}`).join(' · ')}`)
    for (const s of a.sonidos_de_code) {
      const que = s.tipo === 'archivo' ? `grabado «${s.sonido}» version ${s.version}` : `por codigo «${s.sonido}»`
      out.push(s.silenciado
        ? `  Code · ${que} · SILENCIADO`
        : `  Code · ${que} · suena · volumen ${pct(s.volumen)} · ${mov(s.ms, DESDE[s.empieza])}${enSegundo(s.ms, s.empieza, a.golpe)}`)
      if (s.retoques) out.push(lineaEditado(s))
    }
    for (const c of a.capas) {
      const que = c.origen === 'code'
        ? `Code «${c.sonido}»${c.version ? ` version ${c.version}` : ''}`
        : `archivo de Eric ${c.archivo} (original: ${c.nombre})`
      out.push(`  Capa · ${que} · volumen ${pct(c.volumen)} · ${mov(c.ms, DESDE[c.empieza])}${enSegundo(c.ms, c.empieza, a.golpe)}`)
      if (c.retoques) out.push(lineaEditado(c))
    }
    if (!a.sonidos_de_code.length && !a.capas.length) out.push('  (sin sonidos)')
  }
  return out
}

// ---------------------------------------------------------------- escritura
function ordenado(x) {
  if (Array.isArray(x)) return x.map(ordenado)
  if (esObj(x)) { const o = {}; for (const k of Object.keys(x).sort()) o[k] = ordenado(x[k]); return o }
  return x
}
export const jsonOrdenado = (j) => JSON.stringify(ordenado(j), null, 2) + '\n'

function dentroDe(base, destino) {
  const r = path.relative(base, destino)
  return r !== '' && !r.startsWith('..') && !path.isAbsolute(r)
}

/** Que archivos del zip usa el estudio: sueltos de Eric (sin editar), finales (wav ya hechos) y originales. */
export function archivosDelEstudio(json) {
  const planos = [], finales = [], originales = []
  const lista = (x, esCapaEric) => {
    if (tiene(x, 'retoques')) {
      if (!finales.some((f) => f.nombre === x.archivo)) finales.push({ nombre: x.archivo, tasa: x.tasa, muestras: x.muestras })
      if (esCapaEric && !originales.includes(x.original)) originales.push(x.original)
    } else if (esCapaEric && !planos.includes(x.archivo)) planos.push(x.archivo)
  }
  for (const a of Object.values(json.animaciones)) {
    for (const s of a.sonidos_de_code) lista(s, false)
    for (const c of a.capas) lista(c, c.origen === 'archivo')
  }
  return { planos, finales, originales }
}

/** Copia los archivos (los wav finales ya hechos y los originales) y escribe estudio.json. Comprueba TODAS las rutas antes de escribir. */
export function escribirEstudio(json, entradas, destinoRaiz) {
  const raiz = path.resolve(destinoRaiz)
  const dirSonidos = path.join(raiz, 'public', 'sonidos', 'estudio')
  const dirOriginales = path.join(dirSonidos, 'originales')
  const jsonRuta = path.join(raiz, 'data', 'sonidos', 'estudio.json')
  const { planos, finales, originales } = archivosDelEstudio(json)
  const copiar = (n, dir) => {
    const e = entradas.find((x) => x.nombre === n)
    const ruta = path.join(dir, n)
    if (!e || !dentroDe(dir, ruta)) throw new Error(`Ruta no valida para «${n}»`)
    return { ruta, datos: e.datos }
  }
  const copias = [...planos, ...finales.map((f) => f.nombre)].map((n) => copiar(n, dirSonidos))
  const copiasOrig = originales.map((n) => copiar(n, dirOriginales))
  if (!dentroDe(raiz, jsonRuta)) throw new Error('Ruta no valida para estudio.json')
  fs.mkdirSync(dirSonidos, { recursive: true })
  if (copiasOrig.length) fs.mkdirSync(dirOriginales, { recursive: true })
  fs.mkdirSync(path.dirname(jsonRuta), { recursive: true })
  for (const c of [...copias, ...copiasOrig]) fs.writeFileSync(c.ruta, c.datos)
  fs.writeFileSync(jsonRuta, jsonOrdenado(json))
  return {
    archivos: [...copias, ...copiasOrig].map((c) => c.ruta),
    originales: copiasOrig.map((c) => c.ruta),
    finales: finales.map((f) => ({ ...f, ruta: path.join(dirSonidos, f.nombre) })),
    json: jsonRuta,
  }
}

const hayHerramienta = (cmd) => { const r = spawnSync(cmd, ['-version'], { encoding: 'utf8' }); return !r.error && r.status === 0 }

/** Convierte cada wav final a .m4a (AAC, misma tasa) si hay ffmpeg. NUNCA reaplica retoques. Devuelve el numero de fallos. */
export function convertirFinales(finales, log, env = process.env) {
  if (!finales.length) return 0
  if (env.JUTRIP_SIN_FFMPEG === '1' || !hayHerramienta('ffmpeg')) { log('sin ffmpeg: se deja el .wav; conviértelo después'); return 0 }
  const conProbe = hayHerramienta('ffprobe')
  let fallos = 0
  for (const f of finales) {
    const out = f.ruta.replace(/\.wav$/i, '.m4a')
    const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', f.ruta, '-c:a', 'aac', '-b:a', '192k', '-ar', String(f.tasa), out], { encoding: 'utf8' })
    if (r.error || r.status !== 0) { log(`  ERROR al convertir ${f.nombre} a m4a: ${(r.stderr || (r.error && r.error.message) || '').trim()}`); fallos++; continue }
    if (!conProbe) { log(`  Convertido ${path.basename(out)} (sin ffprobe: duracion sin comprobar)`); continue }
    const p = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', out], { encoding: 'utf8' })
    const dur = parseFloat((p.stdout || '').trim())
    const esperada = f.muestras / f.tasa
    const dif = Math.abs(dur - esperada) * 1000
    if (!Number.isFinite(dur) || dif >= 25) { log(`  ERROR: ${path.basename(out)} dura ${dur} s y el wav ${esperada.toFixed(3)} s (diferencia ${Number.isFinite(dif) ? dif.toFixed(1) : '?'} ms, maximo 25)`); fallos++ }
    else log(`  Convertido ${path.basename(out)} · dura igual que el wav (diferencia ${dif.toFixed(1)} ms)`)
  }
  return fallos
}

// ---------------------------------------------------------------- datos de la app
export function leerAnimacionesYManifiesto(raiz = RAIZ_REPO) {
  const ts = fs.readFileSync(path.join(raiz, 'src', 'lib', 'sonidos', 'estudio.ts'), 'utf8')
  const animaciones = [...ts.matchAll(/\{ id: '([a-z0-9_]+)'/g)].map((m) => m[1])
  const manifiesto = JSON.parse(fs.readFileSync(path.join(raiz, 'public', 'sonidos', 'v30', 'manifiesto.json'), 'utf8'))
  return { animaciones, manifiesto }
}

// ---------------------------------------------------------------- linea de comandos
export function ejecutar(argv, log = console.log) {
  let zip = null, escribir = false, destino = RAIZ_REPO
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--escribir') escribir = true
    else if (a === '--destino') { destino = argv[++i]; if (!destino) { log('Falta la carpeta de --destino'); return 1 } }
    else if (a.startsWith('--')) { log(`Opcion desconocida: ${a}`); return 1 }
    else if (zip === null) zip = a
    else { log(`Sobra un argumento: ${a}`); return 1 }
  }
  if (!zip) { log('Uso: node scripts/sonidos/aplicarEstudio.mjs <zip> [--escribir] [--destino <carpeta>]'); return 1 }
  try {
    const entradas = leerZip(fs.readFileSync(zip))
    const ej = entradas.find((e) => e.nombre === 'estudio.json')
    if (!ej) throw new Error('El zip no lleva estudio.json')
    let json
    try { json = JSON.parse(ej.datos.toString('utf8')) } catch { throw new Error('estudio.json no es un json valido') }
    const { animaciones, manifiesto } = leerAnimacionesYManifiesto()
    const errs = validarEstudio(json, { animaciones, manifiesto, archivos: new Map(entradas.map((e) => [e.nombre, e.datos])) })
    if (errs.length) { log('NO VALE. Errores:'); for (const e of errs) log(`  - ${e}`); log('No se ha escrito nada.'); return 1 }
    for (const l of describir(json)) log(l)
    const usados = archivosDelEstudio(json)
    const citados = new Set([...usados.planos, ...usados.finales.map((f) => f.nombre), ...usados.originales])
    const sueltos = entradas.map((e) => e.nombre).filter((n) => n !== 'estudio.json' && n !== 'LO_ELEGIDO.txt' && !citados.has(n))
    if (sueltos.length) log('', `Aviso: estos archivos del zip no los cita el estudio y no se copian: ${sueltos.join(', ')}`)
    if (!escribir) { log('', 'EN SECO: no se ha escrito nada. Con --escribir se copian los archivos y se escribe data/sonidos/estudio.json.'); return 0 }
    const r = escribirEstudio(json, entradas, destino)
    log('', `Escrito: ${r.archivos.length} archivo(s) de sonido (${r.finales.length} wav final(es) ya hecho(s), ${r.originales.length} original(es)) y ${r.json}`)
    return convertirFinales(r.finales, log) > 0 ? 1 : 0
  } catch (e) {
    log(`NO VALE: ${e.message}`)
    log('No se ha escrito nada.')
    return 1
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = ejecutar(process.argv.slice(2))
}
