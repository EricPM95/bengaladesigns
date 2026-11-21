// Prueba del lector de sonidos_jutrip.zip (scripts/sonidos/aplicarEstudio.mjs). Node puro: sin Chrome, sin red.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { leerZip, leerWav, validarEstudio, describir, jsonOrdenado, leerAnimacionesYManifiesto } from '../sonidos/aplicarEstudio.mjs'
import { escribirZip, estudioDeEjemplo, zipDeEjemplo, ejemploEditado, zipDeEditado, wavDeEjemplo, RETOQUES_CODE } from '../sonidos/_zipDeEjemplo.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const SCRIPT = path.resolve(AQUI, '..', 'sonidos', 'aplicarEstudio.mjs')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jutrip-zip-'))
let ok = 0, fallos = 0
const t = (nombre, cond, extra = '') => {
  if (cond) ok++
  else { fallos++; console.log(`FALLA: ${nombre}${extra ? ' · ' + extra : ''}`) }
}
let n = 0
const cli = (buf, ...args) => {
  const z = path.join(tmp, `z${++n}.zip`)
  fs.writeFileSync(z, buf)
  const r = spawnSync(process.execPath, [SCRIPT, z, ...args], { encoding: 'utf8', env: { ...process.env, JUTRIP_SIN_FFMPEG: '1' } })
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }
}
const lista = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { recursive: true }) : [])
const vacio = (d) => lista(d).length === 0
const modif = (f) => { const e = estudioDeEjemplo(); f(e); return e }
const conJson = (e) => zipDeEjemplo(e)

try {
  const { animaciones, manifiesto } = leerAnimacionesYManifiesto()
  t('hay animaciones y manifiesto', animaciones.length >= 20 && Object.keys(manifiesto).length >= 10)

  // --- lectura
  const entradas = leerZip(zipDeEjemplo())
  t('lee las 4 entradas', entradas.length === 4)
  t('stored leido', entradas.find((e) => e.nombre === 'medalla_bronce_1.mp3')?.datos.toString() === 'ID3-falso-uno')
  t('deflate leido', entradas.find((e) => e.nombre === 'medalla_bronce_2.wav')?.datos.toString() === 'RIFF-falso-dos')
  const ej = JSON.parse(entradas.find((e) => e.nombre === 'estudio.json').datos.toString())
  t('estudio.json leido', JSON.stringify(ej) === JSON.stringify(estudioDeEjemplo()))
  const nombres = entradas.map((e) => e.nombre)
  t('validar: el ejemplo vale', validarEstudio(ej, { animaciones, manifiesto, archivos: nombres }).length === 0)

  // --- descripcion exacta
  const d = describir(ej).join('\n')
  const quiero = [
    'Estudio version 1 · generado 2026-11-21T10:00:00.000Z · volumen general 80 %',
    'Medalla de bronce (medalla_bronce) · dura 5.31 s · golpe a los 4.4 s',
    '  Code · grabado «medalla_bronce» version B · suena · volumen 100 % · -300 ms (antes) desde donde suena de siempre',
    '  Code · por codigo «tic» · SILENCIADO',
    '  Capa · Code «emblema» version C · volumen 75 % · +1200 ms (despues) desde el primer fotograma de la animacion',
    '  Capa · archivo de Eric medalla_bronce_1.mp3 (original: mi sonido.mp3) · volumen 150 % · +120 ms (despues) desde el golpe',
    '  Capa · archivo de Eric medalla_bronce_2.wav (original: otro.wav) · volumen 100 % · -50 ms (antes) desde el primer fotograma de la animacion',
    'Tic de los numeros que suben (tic) · dura 2 s · golpe a los 2 s',
    '  Code · por codigo «tic» · suena · volumen 100 % · sin moverlo, desde el primer fotograma de la animacion',
  ]
  for (const l of quiero) t(`describe: ${l.slice(0, 60)}`, d.includes(l), l)
  t('describe: orden de animaciones por id', d.indexOf('medalla_bronce') < d.indexOf('(tic)'))

  // --- CLI en seco
  const dest = path.join(tmp, 'destino')
  fs.mkdirSync(dest)
  let r = cli(zipDeEjemplo(), '--destino', dest)
  t('seco: codigo 0', r.code === 0, r.out)
  t('seco: describe', r.out.includes('Medalla de bronce (medalla_bronce)') && r.out.includes('EN SECO'))
  t('seco: no escribe nada', vacio(dest))
  r = cli(zipDeEjemplo(), '--escribir', '--destino', dest)
  t('escribir: codigo 0', r.code === 0, r.out)
  const dm = path.join(dest, 'public', 'sonidos', 'estudio')
  t('escribir: copia mp3', fs.readFileSync(path.join(dm, 'medalla_bronce_1.mp3'), 'utf8') === 'ID3-falso-uno')
  t('escribir: copia wav (de deflate)', fs.readFileSync(path.join(dm, 'medalla_bronce_2.wav'), 'utf8') === 'RIFF-falso-dos')
  const jf = path.join(dest, 'data', 'sonidos', 'estudio.json')
  t('escribir: estudio.json identico', fs.readFileSync(jf, 'utf8') === jsonOrdenado(estudioDeEjemplo()) && JSON.stringify(JSON.parse(fs.readFileSync(jf, 'utf8'))) === JSON.stringify(JSON.parse(jsonOrdenado(estudioDeEjemplo()))))
  t('escribir: claves ordenadas', Object.keys(JSON.parse(fs.readFileSync(jf, 'utf8')))[0] === 'animaciones')
  t('escribir: solo lo previsto', lista(dest).filter((x) => fs.statSync(path.join(dest, x)).isFile()).length === 3)
  t('escribir: LO_ELEGIDO no se copia', !lista(dest).some((x) => String(x).includes('LO_ELEGIDO')))

  // --- rechazos (codigo 1 y sin escribir)
  const rechaza = (nombre, buf, trozo) => {
    const dd = path.join(tmp, `d${++n}`)
    fs.mkdirSync(dd)
    const x = cli(buf, '--escribir', '--destino', dd)
    t(`rechaza: ${nombre} (codigo 1)`, x.code === 1, x.out)
    t(`rechaza: ${nombre} (sin escribir)`, vacio(dd))
    if (trozo) t(`rechaza: ${nombre} (dice que)`, x.out.includes(trozo), x.out)
  }
  rechaza('version rara', conJson(modif((e) => { e.animaciones.medalla_bronce.sonidos_de_code[0].version = 'Z' })), 'version')
  rechaza('version A-E que no existe en ese sonido', conJson(modif((e) => { e.animaciones.medalla_bronce.capas[0].version = 'A' })), 'no existe')
  rechaza('animacion desconocida', conJson(modif((e) => { e.animaciones.inventada = e.animaciones.tic })), 'no existe en el estudio')
  rechaza('sonido de Code desconocido', conJson(modif((e) => { e.animaciones.medalla_bronce.capas[0].sonido = 'nada' })), 'desconocido')
  rechaza('archivo citado que no esta en el zip', conJson(modif((e) => { e.animaciones.medalla_bronce.capas[1].archivo = 'falta.mp3' })), 'no esta en el zip')
  rechaza('ruta con ..', conJson(modif((e) => { e.animaciones.medalla_bronce.capas[1].archivo = '../fuera.mp3' })), '..')
  rechaza('ruta con barra', conJson(modif((e) => { e.animaciones.medalla_bronce.capas[1].archivo = 'a/b.mp3' })), 'barras')
  rechaza('extension rara', conJson(modif((e) => { e.animaciones.medalla_bronce.capas[1].archivo = 'medalla_bronce_1.exe' })), 'mp3')
  rechaza('entrada del zip con ..', zipDeEjemplo(undefined, { entradas: [{ nombre: '../mala.mp3', datos: Buffer.from('x') }] }), '..')
  rechaza('CRC malo', escribirZip([
    { nombre: 'medalla_bronce_1.mp3', datos: Buffer.from('ID3-falso-uno'), crcMalo: true },
    { nombre: 'estudio.json', datos: Buffer.from(JSON.stringify(estudioDeEjemplo())) },
  ]), 'CRC')
  rechaza('ms enorme', conJson(modif((e) => { e.animaciones.medalla_bronce.capas[1].ms = 99999 })), 'ms')
  rechaza('ms con decimales', conJson(modif((e) => { e.animaciones.medalla_bronce.capas[1].ms = 1.5 })), 'ms')
  rechaza('volumen 3', conJson(modif((e) => { e.animaciones.medalla_bronce.capas[1].volumen = 3 })), 'volumen')
  rechaza('volumen NaN (null)', conJson(modif((e) => { e.animaciones.medalla_bronce.capas[1].volumen = null })), 'volumen')
  rechaza('empieza raro', conJson(modif((e) => { e.animaciones.medalla_bronce.capas[0].empieza = 'sitio' })), 'empieza')
  rechaza('clave extra', conJson(modif((e) => { e.animaciones.medalla_bronce.capas[0].truco = 1 })), 'desconocida')
  rechaza('entrada repetida', zipDeEjemplo(undefined, { entradas: [{ nombre: 'medalla_bronce_1.mp3', datos: Buffer.from('otro') }] }), 'repetida')
  rechaza('json que no es version 1', conJson(modif((e) => { e.version = 2 })), 'version')
  rechaza('json roto', escribirZip([{ nombre: 'estudio.json', datos: Buffer.from('{no es json') }]), 'json')
  rechaza('sin estudio.json', escribirZip([{ nombre: 'LO_ELEGIDO.txt', datos: Buffer.from('hola') }]), 'estudio.json')
  const bueno = zipDeEjemplo()
  rechaza('zip truncado', bueno.subarray(0, bueno.length - 40), 'truncado')
  rechaza('zip casi vacio', Buffer.from('PK'), 'truncado')
  rechaza('no es un zip', Buffer.from('esto no es un zip, para nada, de verdad que no lo es'), 'truncado')

  // --- sonidos editados (V36B): el wav final ya viene hecho; solo se comprueba y se copia
  const ed = ejemploEditado()
  const nomEd = Object.keys(ed.archivos)
  const eEd = JSON.parse(JSON.stringify(ed.estudio))
  const mapa = new Map(Object.entries(ed.archivos))
  t('editado: el ejemplo vale', validarEstudio(eEd, { animaciones, manifiesto, archivos: mapa }).length === 0, validarEstudio(eEd, { animaciones, manifiesto, archivos: mapa }).join(' | '))
  t('editado: el zip viejo sin editados sigue valiendo', validarEstudio(estudioDeEjemplo(), { animaciones, manifiesto, archivos: new Map(nombres.map((x) => [x, Buffer.alloc(0)])) }).length === 0)
  const de = describir(eEd).join('\n')
  const quieroEd = [
    '    Editado · recortado 0,12 s – 2,40 s · fundido entrada 50 ms · salida 300 ms · +3 semitonos (velocidad) · sin graves · brillo +2 dB · eco 15 % · igualado a −1 dB de pico · 44100 Hz · 4410 muestras · pico 0,89',
    '    Editado · fundido salida 200 ms · −2 semitonos (velocidad) · brillo −1,5 dB · 8000 Hz · 800 muestras · pico 0,40',
    '    Editado · sin retoques activos · 16000 Hz · 1600 muestras · pico 0,70',
  ]
  for (const l of quieroEd) t(`describe editado: ${l.slice(0, 70)}`, de.includes(l), l)
  t('describe editado: tres lineas Editado', de.split('\n').filter((l) => l.startsWith('    Editado')).length === 3)
  t('describe: la capa de Eric editada nombra el wav final', de.includes('archivo de Eric medalla_bronce_1.wav (original: mi sonido.mp3)'))

  const destE = path.join(tmp, 'destinoE')
  fs.mkdirSync(destE)
  r = cli(zipDeEditado(ed), '--destino', destE)
  t('editado seco: codigo 0', r.code === 0, r.out)
  t('editado seco: dice los retoques', r.out.includes('recortado 0,12 s – 2,40 s') && r.out.includes('EN SECO'))
  t('editado seco: no escribe nada', vacio(destE))
  r = cli(zipDeEditado(ed), '--escribir', '--destino', destE)
  t('editado escribir: codigo 0', r.code === 0, r.out)
  t('editado escribir: dice sin ffmpeg (forzado)', r.out.includes('sin ffmpeg: se deja el .wav; conviértelo después'))
  const dE = path.join(destE, 'public', 'sonidos', 'estudio')
  for (const nm of ['medalla_bronce_1.wav', 'medalla_bronce_emblema_C.wav', 'medalla_bronce_golpe_B.wav']) t(`editado escribir: copia el final ${nm} identico`, fs.existsSync(path.join(dE, nm)) && fs.readFileSync(path.join(dE, nm)).equals(ed.archivos[nm]))
  t('editado escribir: copia el original en originales/', fs.readFileSync(path.join(dE, 'originales', 'medalla_bronce_1_original.mp3'), 'utf8') === 'ID3-original-uno')
  t('editado escribir: el wav sin editar tambien se copia', fs.readFileSync(path.join(dE, 'medalla_bronce_2.wav'), 'utf8') === 'RIFF-falso-dos')
  t('editado escribir: estudio.json identico', fs.readFileSync(path.join(destE, 'data', 'sonidos', 'estudio.json'), 'utf8') === jsonOrdenado(eEd))
  t('editado escribir: 6 archivos y nada de m4a', lista(destE).filter((x) => fs.statSync(path.join(destE, x)).isFile()).length === 6 && !lista(destE).some((x) => String(x).endsWith('.m4a')))
  t('editado escribir: no reaplica retoques (el wav copiado tiene las mismas muestras)', fs.readFileSync(path.join(dE, 'medalla_bronce_1.wav')).length === ed.archivos['medalla_bronce_1.wav'].length)

  // con ffmpeg de verdad (si esta): convierte a m4a y comprueba la duracion
  const hayFf = !spawnSync('ffmpeg', ['-version']).error && !spawnSync('ffprobe', ['-version']).error
  if (hayFf) {
    const destF = path.join(tmp, 'destinoF')
    fs.mkdirSync(destF)
    const z = path.join(tmp, 'zF.zip')
    fs.writeFileSync(z, zipDeEditado(ed))
    const rf = spawnSync(process.execPath, [SCRIPT, z, '--escribir', '--destino', destF], { encoding: 'utf8' })
    t('ffmpeg: codigo 0', rf.status === 0, rf.stdout + rf.stderr)
    const dF = path.join(destF, 'public', 'sonidos', 'estudio')
    for (const nm of ['medalla_bronce_1', 'medalla_bronce_emblema_C', 'medalla_bronce_golpe_B']) t(`ffmpeg: ${nm}.m4a creado`, fs.existsSync(path.join(dF, nm + '.m4a')) && fs.statSync(path.join(dF, nm + '.m4a')).size > 100)
    t('ffmpeg: dice que dura igual', (rf.stdout || '').includes('dura igual que el wav'))
  }

  // rechazos de editados
  const variante = (f, quitar = []) => { const c = ejemploEditado(); f(c); return zipDeEditado(c, quitar) }
  const cap = (c) => c.estudio.animaciones.medalla_bronce.capas[1]
  const capCode = (c) => c.estudio.animaciones.medalla_bronce.capas[0]
  rechaza('retoques: semitonos 7', variante((c) => { cap(c).retoques.semitonos = 7 }), 'semitonos')
  rechaza('retoques: entrada_ms 3000', variante((c) => { cap(c).retoques.entrada_ms = 3000 }), 'entrada_ms')
  rechaza('retoques: eco 40', variante((c) => { cap(c).retoques.eco_pct = 40 }), 'eco_pct')
  rechaza('retoques: brillo 9', variante((c) => { capCode(c).retoques.brillo_db = 9 }), 'brillo_db')
  rechaza('retoques: fin menor que ini', variante((c) => { cap(c).retoques.fin = 0.05 }), 'fin')
  rechaza('retoques: ini negativo', variante((c) => { cap(c).retoques.ini = -1 }), 'ini')
  rechaza('retoques: igualar no booleano', variante((c) => { cap(c).retoques.igualar = 1 }), 'igualar')
  rechaza('retoques: clave desconocida dentro', variante((c) => { cap(c).retoques.truco = 1 }), 'truco')
  rechaza('retoques: falta una clave', variante((c) => { delete cap(c).retoques.eco_pct }), 'eco_pct')
  rechaza('campos a medias: solo retoques en capa de Eric', variante((c) => { for (const k of ['muestras', 'tasa', 'pico', 'original']) delete cap(c)[k] }), 'a medias')
  rechaza('campos a medias: falta el original', variante((c) => { delete cap(c).original }), 'original')
  rechaza('campos a medias: falta pico en capa de Code', variante((c) => { delete capCode(c).pico }), 'pico')
  rechaza('campos a medias: solo muestras en un sonido de Code', variante((c) => { const s = c.estudio.animaciones.medalla_bronce.sonidos_de_code[0]; delete s.archivo; delete s.retoques; delete s.tasa; delete s.pico }), 'a medias')
  rechaza('original en una capa de Code (clave desconocida)', variante((c) => { capCode(c).original = 'x.mp3' }), 'desconocida')
  rechaza('editado en un sonido por codigo (sint)', variante((c) => { const s = c.estudio.animaciones.medalla_bronce.sonidos_de_code[1]; Object.assign(s, { archivo: 'medalla_bronce_golpe_B.wav', retoques: { ...RETOQUES_CODE }, muestras: 1600, tasa: 16000, pico: 0.7 }) }), 'tipo archivo')
  rechaza('final que no es WAV', variante((c) => { c.archivos['medalla_bronce_1.wav'] = Buffer.from('esto no es un wav, para nada') }), 'WAV')
  rechaza('muestras que no coincide', variante((c) => { cap(c).muestras += 1 }), 'muestras')
  rechaza('tasa que no coincide', variante((c) => { cap(c).tasa = 48000 }), 'tasa')
  rechaza('pico que no coincide', variante((c) => { cap(c).pico = 0.5 }), 'pico')
  rechaza('wav de 8 bits', variante((c) => { c.archivos['medalla_bronce_emblema_C.wav'] = wavDeEjemplo({ tasa: 8000, muestras: 800, bits: 8 }).buf }), '16 bits')
  rechaza('wav de 3 canales', variante((c) => { c.archivos['medalla_bronce_emblema_C.wav'] = wavDeEjemplo({ tasa: 8000, muestras: 800, canales: 3 }).buf }), 'canales')
  rechaza('falta el original en el zip', variante(() => {}, ['medalla_bronce_1_original.mp3']), 'original')
  rechaza('falta el wav final en el zip', variante(() => {}, ['medalla_bronce_golpe_B.wav']), 'no esta en el zip')
  rechaza('final con extension .mp3', variante((c) => { cap(c).archivo = 'medalla_bronce_1_original.mp3' }), '.wav')
  rechaza('original con extension rara', variante((c) => { cap(c).original = 'medalla_bronce_1.exe'; c.archivos['medalla_bronce_1.exe'] = Buffer.from('x') }), 'mp3')
  rechaza('final con ruta (..)', variante((c) => { cap(c).archivo = '../fuera.wav' }), '..')
  rechaza('original igual que el final', variante((c) => { cap(c).original = cap(c).archivo }), 'mismo')
  // wav con trozo extra (LIST) entre fmt y data y pico justo en el borde de la tolerancia
  t('wav con LIST se lee bien', leerWav(ed.archivos['medalla_bronce_emblema_C.wav']).muestras === 800)
  const ok2 = ejemploEditado(); cap(ok2).pico = Math.round((ok2.wavs['medalla_bronce_1.wav'].pico + 0.009) * 1000) / 1000
  t('pico dentro de la tolerancia (0,009) vale', validarEstudio(ok2.estudio, { animaciones, manifiesto, archivos: new Map(Object.entries(ok2.archivos)) }).length === 0)

  // --- limites y argumentos
  let lanzo = false
  try { leerZip(escribirZip(Array.from({ length: 501 }, (_, i) => ({ nombre: `a${i}.mp3`, datos: Buffer.from('x') })))) } catch (e) { lanzo = /501 entradas/.test(e.message) }
  t('rechaza mas de 500 entradas', lanzo)
  const err = validarEstudio(modif((e) => { e.animaciones.tic.capas.push({ origen: 'archivo', archivo: 'x.mp3', nombre: 'x', volumen: 1, ms: 0, empieza: 'golpe' }) }), { animaciones, manifiesto, archivos: [] })
  t('validar solo (funcion pura): detecta el archivo que falta', err.length === 3 && err.some((x) => x.includes('x.mp3')))
  const sin = spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8' })
  t('sin zip: codigo 1', sin.status === 1)
  const rara = spawnSync(process.execPath, [SCRIPT, 'a.zip', '--loquesea'], { encoding: 'utf8' })
  t('opcion desconocida: codigo 1', rara.status === 1)
} finally {
  fs.rmSync(tmp, { recursive: true, force: true })
}
t('carpeta temporal borrada', !fs.existsSync(tmp))
console.log(`${ok + fallos} comprobaciones · ${fallos} fallos`)
process.exitCode = fallos ? 1 : 0
