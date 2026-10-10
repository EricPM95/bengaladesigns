// Prueba de las fotos del viaje (Tanda 6z3, punto 6): al JPEG se le quitan TODOS los metadatos (EXIF con GPS, modelo y hora, XMP, IPTC, comentarios) y sigue siendo un JPEG válido;
// subir y borrar con un cliente de Supabase falso (el objeto del almacén y la fila se van juntos, y si falla uno se dice y no se toca el otro); y sin Supabase nada revienta.
//   node scripts/destino/pruebaFotos6z3.mjs
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { build } from 'esbuild'

const require = createRequire(import.meta.url)
let fallos = 0
let comprobaciones = 0
const ok = (cond, texto) => {
  comprobaciones++
  if (!cond) {
    fallos++
    console.log(`  ✗ ${texto}`)
  }
}

const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-fotos-'))
// supabaseClient y tripPersistence se sustituyen por piezas falsas que leen globalThis.__sb (así el cliente cambia de una prueba a otra).
const falsos = {
  name: 'falsos',
  setup(b) {
    b.onResolve({ filter: /supabaseClient$/ }, () => ({ path: 'sb', namespace: 'falso' }))
    b.onResolve({ filter: /tripPersistence$/ }, () => ({ path: 'tp', namespace: 'falso' }))
    b.onLoad({ filter: /^sb$/, namespace: 'falso' }, () => ({ contents: 'export const supabase = new Proxy({}, { get: (_, k) => globalThis.__sb[k] }); ', loader: 'js' }))
    b.onLoad({ filter: /^tp$/, namespace: 'falso' }, () => ({ contents: 'export const bootstrapTraveler = async () => "u-1"', loader: 'js' }))
  },
}
const salida = path.join(carpeta, 'fotos.cjs')
await build({ entryPoints: ['src/lib/fotosViaje.ts'], outfile: salida, bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent', plugins: [falsos] })
// Sin Supabase: el módulo `supabase` es null. Se prueba con un segundo paquete donde sb vale null.
const F = require(salida)
const sinCliente = {
  name: 'sin-cliente',
  setup(b) {
    b.onResolve({ filter: /supabaseClient$/ }, () => ({ path: 'sb', namespace: 'falso' }))
    b.onResolve({ filter: /tripPersistence$/ }, () => ({ path: 'tp', namespace: 'falso' }))
    b.onLoad({ filter: /^sb$/, namespace: 'falso' }, () => ({ contents: 'export const supabase = null', loader: 'js' }))
    b.onLoad({ filter: /^tp$/, namespace: 'falso' }, () => ({ contents: 'export const bootstrapTraveler = async () => { throw new Error("sin supabase") }', loader: 'js' }))
  },
}
const salida2 = path.join(carpeta, 'fotos_sin.cjs')
await build({ entryPoints: ['src/lib/fotosViaje.ts'], outfile: salida2, bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent', plugins: [sinCliente] })
const S = require(salida2)

const silenciar = console.warn
console.warn = () => {}

/* ---------------- (a) JPEG sintético con EXIF/GPS ---------------- */
console.log('Quitar metadatos')
const enc = (s) => Array.from(Buffer.from(s, 'latin1'))
const segmento = (marcador, datos) => [0xff, marcador, (datos.length + 2) >> 8, (datos.length + 2) & 0xff, ...datos]
const exif = [...enc('Exif\0\0'), ...enc('II*\0'), ...enc('GPSLatitude 41.9028 N GPSLongitude 12.4964 E'), ...enc('Make Apple Model iPhone 15 Pro'), ...enc('DateTimeOriginal 2026:10:13 09:30:00')]
const xmp = [...enc('http://ns.adobe.com/xap/1.0/\0'), ...enc('<x:xmpmeta GPS iPhone 15 Pro/>')]
const iptc = [...enc('Photoshop 3.0\0'), ...enc('8BIM Eric Madrid')]
const jfif = [...enc('JFIF\0'), 1, 1, 0, 0, 1, 0, 1, 0, 0]
const icc = [...enc('ICC_PROFILE\0'), 1, 1, ...enc('perfil')]
const comentario = enc('hecha en casa de Eric con iPhone 15 Pro')
const sof = [8, 0, 2, 0, 2, 1, 1, 0x11, 0]
const sos = [1, 1, 0, 0, 0x3f, 0]
// Datos de imagen con un 0xFF 0x00 (byte relleno) y un marcador RST para comprobar que no se tocan.
const imagen = [0x12, 0x34, 0xff, 0x00, 0x56, 0xff, 0xd0, 0x78, 0x9a]
const jpeg = Uint8Array.from([0xff, 0xd8, ...segmento(0xe0, jfif), ...segmento(0xe1, exif), ...segmento(0xe1, xmp), ...segmento(0xe2, icc), ...segmento(0xed, iptc), ...segmento(0xfe, comentario), ...segmento(0xc0, sof), ...segmento(0xda, sos), ...imagen, 0xff, 0xd9])
const texto = (u8) => Buffer.from(u8).toString('latin1')
ok(texto(jpeg).includes('Exif') && texto(jpeg).includes('GPS') && texto(jpeg).includes('iPhone'), 'el JPEG de partida sí lleva Exif, GPS y modelo (la prueba tiene sentido)')
const limpio = F.quitarMetadatosJpeg(jpeg)
const t = texto(limpio)
ok(limpio[0] === 0xff && limpio[1] === 0xd8, 'sigue empezando por SOI')
ok(limpio[limpio.length - 2] === 0xff && limpio[limpio.length - 1] === 0xd9, 'sigue acabando en EOI')
for (const palabra of ['Exif', 'GPS', 'iPhone', 'Apple', 'DateTimeOriginal', '2026:10:13', 'xmpmeta', 'adobe', 'Photoshop', '8BIM', 'Eric', 'casa']) ok(!t.includes(palabra), `no queda «${palabra}»`)
// Recorre los segmentos del resultado: solo quedan JFIF, ICC, SOF, SOS.
const marcadores = []
for (let i = 2; i < limpio.length; ) {
  const m = limpio[i + 1]
  marcadores.push(m)
  if (m === 0xda) break
  i += 2 + ((limpio[i + 2] << 8) | limpio[i + 3])
}
ok(marcadores.join() === [0xe0, 0xe2, 0xc0, 0xda].join(), 'quedan solo JFIF, ICC, SOF y SOS')
ok(!marcadores.includes(0xe1) && !marcadores.includes(0xed) && !marcadores.includes(0xfe), 'ni APP1, ni APP13, ni comentarios')
const cola = Array.from(limpio.slice(limpio.length - imagen.length - 2))
ok(cola.join() === [...imagen, 0xff, 0xd9].join(), 'los datos de la imagen quedan intactos, byte a byte')
// Un JPEG ya limpio no cambia.
ok(Buffer.compare(Buffer.from(F.quitarMetadatosJpeg(limpio)), Buffer.from(limpio)) === 0, 'idempotente: pasarlo dos veces da lo mismo')
// Con bytes de relleno 0xFF antes de un marcador.
const conRelleno = Uint8Array.from([0xff, 0xd8, 0xff, 0xff, 0xe1, 0, 4, 71, 80, ...segmento(0xc0, sof), ...segmento(0xda, sos), ...imagen, 0xff, 0xd9])
ok(!texto(F.quitarMetadatosJpeg(conRelleno)).includes('GP'), 'también con bytes de relleno antes del marcador')
let lanza = 0
for (const malo of [new Uint8Array([1, 2, 3, 4]), new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0xff, 0xff, 1]), new Uint8Array([])]) {
  try {
    F.quitarMetadatosJpeg(malo)
  } catch {
    lanza++
  }
}
ok(lanza === 3, 'lo que no es un JPEG (o está cortado) da error en vez de pasar')

/* ---------------- (b) cliente Supabase falso ---------------- */
console.log('Subir y borrar')
function crearFalso({ fallaSubida = false, fallaInsert = false, fallaRemove = false, fallaDelete = false } = {}) {
  const estado = { objetos: new Map(), filas: new Map(), llamadas: [] }
  const cliente = {
    storage: {
      from: (cubo) => ({
        upload: async (ruta, blob) => {
          estado.llamadas.push(`upload:${cubo}`)
          if (fallaSubida) return { error: { message: 'x' } }
          estado.objetos.set(ruta, blob)
          return { error: null }
        },
        remove: async (rutas) => {
          estado.llamadas.push('remove')
          if (fallaRemove) return { error: { message: 'x' } }
          for (const r of rutas) estado.objetos.delete(r)
          return { error: null }
        },
        createSignedUrl: async (ruta) => ({ data: { signedUrl: `https://firmada/${ruta}` } }),
        createSignedUrls: async (rutas) => ({ data: rutas.map((r) => ({ path: r, signedUrl: `https://firmada/${r}` })) }),
      }),
    },
    from: (tabla) => ({
      insert: (fila) => ({
        select: () => ({
          single: async () => {
            estado.llamadas.push(`insert:${tabla}`)
            if (fallaInsert) return { data: null, error: { message: 'x' } }
            const guardada = { id: `f${estado.filas.size + 1}`, created_at: '2026-10-13T10:00:00Z', ...fila }
            estado.filas.set(guardada.id, guardada)
            return { data: guardada, error: null }
          },
        }),
      }),
      delete: () => ({
        eq: async (_c, id) => {
          estado.llamadas.push('delete')
          if (fallaDelete) return { error: { message: 'x' } }
          estado.filas.delete(id)
          return { error: null }
        },
      }),
      select: () => {
        const q = { eq: () => q, order: () => q, then: (res) => res({ data: [...estado.filas.values()], error: null }) }
        return q
      },
    }),
  }
  return { cliente, estado }
}
const preparada = { blob: new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' }), width: 1600, height: 1200, bytes: 4 }
const args = { tripId: 'viaje-1', dayId: 'd2', dayNumber: 2, stopName: 'Coliseo' }

let f = crearFalso()
globalThis.__sb = f.cliente
let r = await F.subirFotoPreparada(args, preparada)
ok(r.foto && !r.error, 'subir: devuelve la foto')
ok(r.foto?.storagePath.startsWith('u-1/viaje-1/') && r.foto.storagePath.endsWith('.jpg'), 'ruta {uid}/{tripId}/{uuid}.jpg')
ok(f.estado.objetos.size === 1 && f.estado.filas.size === 1, 'queda el objeto y la fila')
ok(r.foto?.stopName === 'Coliseo' && r.foto.dayNumber === 2 && r.foto.url.startsWith('https://firmada/'), 'con su parada, su día y su URL firmada')
const lista = await F.listarFotos('viaje-1')
ok(lista.length === 1 && lista[0].url.startsWith('https://firmada/'), 'listar: con URL firmada')
let avisos = 0
const quitar = F.alCambiarFotos(() => avisos++)
const err1 = await F.borrarFoto(r.foto)
ok(err1 === null && f.estado.objetos.size === 0 && f.estado.filas.size === 0, 'borrar: se va el objeto del almacén Y la fila')
ok(avisos === 1, 'borrar avisa a quien muestra las fotos')
quitar()

f = crearFalso({ fallaInsert: true })
globalThis.__sb = f.cliente
r = await F.subirFotoPreparada(args, preparada)
ok(!r.foto && !!r.error && f.estado.objetos.size === 0 && f.estado.filas.size === 0, 'si falla la fila, se retira el objeto: nada a medias')

f = crearFalso({ fallaSubida: true })
globalThis.__sb = f.cliente
r = await F.subirFotoPreparada(args, preparada)
ok(!r.foto && !!r.error && f.estado.filas.size === 0, 'si falla la subida, no se guarda fila')

f = crearFalso()
globalThis.__sb = f.cliente
const buena = (await F.subirFotoPreparada(args, preparada)).foto
globalThis.__sb = crearFalsoConEstado(f.estado, { fallaRemove: true })
function crearFalsoConEstado(estado, opciones) {
  const otro = crearFalso(opciones)
  otro.estado.objetos = estado.objetos
  otro.estado.filas = estado.filas
  return otro.cliente
}
const err2 = await F.borrarFoto(buena)
ok(!!err2 && f.estado.filas.size === 1 && f.estado.objetos.size === 1, 'si falla borrar el objeto: error, y la fila NO se toca (se puede reintentar)')
globalThis.__sb = crearFalsoConEstado(f.estado, { fallaDelete: true })
const err3 = await F.borrarFoto(buena)
ok(!!err3 && f.estado.objetos.size === 0 && f.estado.filas.size === 1, 'si falla borrar la fila: error dicho (el objeto ya no está, el reintento es inocuo)')
globalThis.__sb = crearFalsoConEstado(f.estado, {})
const err4 = await F.borrarFoto(buena)
ok(err4 === null && f.estado.filas.size === 0, 'el reintento termina el borrado')

/* ---------------- (c) sin Supabase ---------------- */
console.log('Sin Supabase')
ok((await S.listarFotos('viaje-1')).length === 0, 'listar: vacío')
const sub = await S.subirFotoPreparada(args, preparada)
ok(sub.foto === null && typeof sub.error === 'string' && sub.error.length > 0, 'subir: sin foto y con un error en palabras sencillas')
const sub2 = await S.subirFoto({ ...args, file: new Blob([]) })
ok(sub2.foto === null && !!sub2.error, 'subirFoto completo: error controlado')
const bor = await S.borrarFoto({ id: 'x', storagePath: 'u/x.jpg' })
ok(typeof bor === 'string', 'borrar: error controlado')

console.warn = silenciar
console.log(fallos === 0 ? `\n${comprobaciones} comprobaciones, 0 fallos.` : `\n${fallos} fallos de ${comprobaciones}.`)
process.exit(fallos === 0 ? 0 : 1)
