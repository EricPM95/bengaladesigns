// La prueba de la Tanda V38D (22-nov): EL GOLPE DEL EMBLEMA, SOLO DONDE TOCA.
// El mismo archivo `emblema` sonaba dos veces en la tarjeta «Emblema de Roma»: al estallar la luz del suspense y al aparecer el emblema. Ahora el estallido es otro sonido (`estallido`, suave y corto, con su fila y sus candidatos)
// y el golpe del premio suena solo cuando aparece el emblema. Y ninguna animación repite un mismo archivo en dos momentos sin fila propia.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV38D.mjs
// La parte de datos no necesita servidores; la del estudio necesita Vite. Ninguna parte toca el Supabase de producción ni lo guardado de nadie (el navegador de pruebas es de usar y tirar).
import fs from 'node:fs'
import { build } from 'esbuild'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const cargar = async (entrada) => {
  const b = await build({ entryPoints: [entrada], bundle: true, format: 'esm', platform: 'node', write: false, define: { 'import.meta.env': '{}' } })
  return import('data:text/javascript;base64,' + Buffer.from(b.outputFiles[0].text).toString('base64'))
}
const J = async (a, js) => {
  const r = await a.evaluar(js)
  return typeof r === 'string' ? JSON.parse(r) : r
}
const esperar = async (a, js, n = 80) => {
  for (let i = 0; i < n; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(250)
  }
  return false
}
const toque = async (a, sel) => {
  const r = JSON.parse(await a.evaluar(`(() => { const e = document.querySelector('${sel}'); e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return JSON.stringify({ x: b.left + b.width / 2, y: b.top + b.height / 2 }) })()`))
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await a.cdp('Input.dispatchMouseEvent', { type, x: r.x, y: r.y, button: 'left', clickCount: 1 })
}

/* ───────── 1. Las partituras y los archivos ───────── */
console.log('1. Las partituras: el estallido y el golpe, dos sonidos')
const P = await cargar('src/lib/sonidos/partituras.ts')
const E = await cargar('src/lib/sonidos/estudio.ts')
const manifiesto = JSON.parse(leer('public/sonidos/v30/manifiesto.json'))
const archivosDe = (id, o) => (P.partituraDe(id, o)?.notas ?? []).filter((n) => n.tipo === 'archivo')
{
  const susp = archivosDe('emblema')
  debe(susp.length === 1 && susp[0].archivo === 'estallido' && Math.abs(susp[0].golpe - 3.6) < 1e-9, 'estallido', `el suspense (partitura «emblema») tiene UN archivo, el estallido, a los 3,6 s (${susp.map((n) => `${n.archivo}@${n.golpe}`).join(',')})`)
  debe(!susp.some((n) => n.archivo === 'emblema'), 'estallido', 'y ya NO suena el golpe del emblema al acabar el suspense')
  const escena = archivosDe('escena')
  const golpes = escena.filter((n) => n.archivo === 'emblema')
  debe(golpes.length === 1 && golpes[0].golpe === 8, 'golpe', `el golpe del emblema se programa UNA vez, cuando aparece el emblema (a los fl = 8 s): ${golpes.map((n) => n.golpe).join(',')}`)
  const lz = archivosDe('escena', { escena: { fl: 9.9, dim: 9.5, x: [10.7, 11.6, 12.5, 13.4] } }).filter((n) => n.archivo === 'emblema')
  debe(lz.length === 1 && lz[0].golpe === 9.9, 'golpe', `y en Lanzarote (fl 9,9 s) igual: una vez, a los 9,9 s (${lz.map((n) => n.golpe).join(',')})`)
  const reducido = archivosDe('emblema', { reducido: true })
  debe(reducido.length === 1 && reducido[0].archivo === 'estallido', 'estallido', 'con «Reducir movimiento» tampoco suena el golpe en el suspense')
  debe(P.ARCHIVOS_DE_PREMIO.includes('estallido') && P.ARCHIVOS_DE_PREMIO.includes('brillo_titulo'), 'archivos', 'los dos sonidos nuevos están en la lista de archivos')
}
for (const [id, letras] of [['estallido', 'ABCDE'], ['brillo_titulo', 'ABCDE']]) {
  debe(letras.split('').every((l) => manifiesto[id]?.[l] && fs.existsSync(`public/sonidos/v30/${id}_${l}.m4a`)), 'archivos', `«${id}»: candidatos ${letras} con su archivo y su fila en el manifiesto`)
}
{
  const a = manifiesto.estallido.A
  debe(a.dura <= 0.7 && a.golpe < 0.2, 'estallido', `el estallido por defecto es suave y corto (${a.dura} s; no el golpe del premio de ${manifiesto.emblema.B.dura} s)`)
  debe(manifiesto.emblema.B.dura > a.dura, 'estallido', 'más corto que el golpe del emblema')
}

/* ───────── 2. Cada sonido con su fila en el estudio ───────── */
console.log('2. Las tarjetas de emblema: el estallido y el golpe, cada uno con su fila')
for (const id of ['emblema', 'emblema_lanzarote', 'emblema_maravilla']) {
  const a = E.animacionDe(id)
  const filas = E.archivosDeLaAnimacion(a)
  debe(filas.includes('emblema') && filas.includes('estallido') && filas.indexOf('emblema') !== filas.indexOf('estallido'), 'filas', `${id}: tiene su fila para el golpe del emblema Y su fila para el estallido del suspense (${filas.join(', ')})`)
  debe(filas.filter((f) => f === 'estallido').length === 1 && filas.filter((f) => f === 'emblema').length === 1, 'filas', `${id}: cada una una sola vez`)
}
{
  const a = E.animacionDe('primer_dia')
  const filas = E.archivosDeLaAnimacion(a)
  debe(filas.includes('brillo') && filas.includes('brillo_titulo'), 'filas', `«Tu primer día»: el brillo del título y el del final tienen cada uno su fila (${filas.join(', ')})`)
}

/* ───────── 3. Ninguna animación repite un mismo archivo en dos momentos sin fila propia ───────── */
console.log('3. Ningún archivo suena en dos momentos distintos de una misma animación sin fila propia')
{
  // Lo que es el MISMO suceso repetido (no dos momentos): un clic por cada fila que aparece, los dos brillos que caen detrás de los fuegos. Se dice aquí, a la vista.
  const MISMO_SUCESO = { primer_dia: ['clic'], fuegos: ['brillo'] }
  const repetidos = []
  let animaciones = 0
  for (const a of E.ANIMACIONES) {
    animaciones++
    const partituras = [...new Set([...a.suena, ...a.partituras])]
    const dueno = new Map()
    for (const id of partituras) {
      const notas = archivosDe(id)
      const porArchivo = new Map()
      for (const n of notas) porArchivo.set(n.archivo, (porArchivo.get(n.archivo) ?? 0) + 1)
      for (const [arch, n] of porArchivo) {
        if (n > 1 && !(MISMO_SUCESO[id] ?? []).includes(arch)) repetidos.push(`${a.id}: «${arch}» ${n} veces en «${id}»`)
        if (dueno.has(arch) && dueno.get(arch) !== id) repetidos.push(`${a.id}: «${arch}» en «${dueno.get(arch)}» y en «${id}»`)
        dueno.set(arch, id)
      }
    }
  }
  debe(animaciones === 27, 'repetidos', `se revisan las 27 tarjetas (${animaciones})`)
  debe(repetidos.length === 0, 'repetidos', `ningún archivo repetido en dos momentos de una misma animación (${repetidos.join(' | ') || 'ninguno'})`)
}

/* ───────── 4. El estudio de verdad: se programa lo que toca, silenciar uno no silencia el otro, lo guardado sigue ───────── */
if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('4. (SIN VITE: la parte del estudio NO SE HA VERIFICADO)')
  console.log(`\nPrueba de la Tanda V38D: ${comprobaciones} comprobaciones · ${fallos.length} fallos · ESTUDIO SIN VERIFICAR`)
  process.exit(fallos.length ? 1 : 0)
}
console.log('4. En el estudio (1280 x 1000)')
const RUTA = '/?cuentas=off&logros=on&logrosDemo=1&admin=sonidos&apertura=0'
const MOCK = "const f = window.fetch.bind(window); window.fetch = (u, i) => String(u).includes('/api/admin/avisos-viajeros') ? Promise.resolve(new Response(JSON.stringify({ ok: true, nuevos: 0, avisos: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })) : f(u, i);"
const IFR = "document.querySelector('[data-visor-iframe]')"
const CAPTURAS = 'docs/dias/V38D_capturas'
fs.mkdirSync(CAPTURAS, { recursive: true })
let a = await abrirApp(APP, { ruta: RUTA, ancho: 1280, alto: 1000, sinEsperarRoot: true, esperaFija: 5, antes: MOCK })
try {
  debe(await esperar(a, "document.querySelectorAll('[data-animacion-tarjeta]').length >= 20"), 'pagina', 'la página sale con su lista')
  debe(await esperar(a, `Boolean(${IFR}?.contentWindow?.__estudioVisor?.listo)`, 160), 'marco', 'el marco carga y queda listo')

  // Lo guardado de Eric: antes (guardado con la versión de antes) el «golpe del emblema» C, a la mitad de volumen y silenciado; el estallido no existía.
  await a.evaluar(`import('/src/lib/sonidos/estudioGuardado.ts').then((m) => m.guardarEnElNavegador({ animacion: 'emblema', guardado_en: new Date().toISOString(), silenciados: [], ajustes: {}, letras: { emblema: 'C' }, volumenes: { emblema: 0.5 }, capas: [], ediciones: {} })).then(() => true)`)
  await a.evaluar('location.reload()')
  await a.esp(4000)
  debe(await esperar(a, `Boolean(${IFR}?.contentWindow?.__estudioVisor?.listo)`, 200), 'marco', 'tras recargar, el marco queda listo')
  await toque(a, '[data-animacion-tarjeta="emblema"]')
  await a.esp(2500)
  const fila = (sel) => a.evaluar(`(() => { const e = document.querySelector('${sel}'); return e ? e.getAttribute('aria-pressed') : 'no' })()`)
  debe((await fila('[data-candidato="emblema:C"]')) === 'true', 'guardado', 'lo guardado en «golpe del emblema» sigue en el golpe: el candidato C')
  debe((await fila('[data-candidato="estallido:A"]')) === 'true', 'guardado', 'y el estallido empieza con el sonido por defecto (el candidato A)')
  debe((await a.evaluar("document.querySelector('[data-volumen-candidato=\"emblema\"]')?.value ?? ''")) === '0.5', 'guardado', 'el volumen guardado (50 %) sigue en el golpe')
  debe((await a.evaluar("document.querySelector('[data-volumen-candidato=\"estallido\"]')?.value ?? ''")) === '1', 'guardado', 'y el estallido, a su 100 % de siempre')
  debe(await a.evaluar("Boolean(document.querySelector('[data-silenciar=\"archivo:estallido\"]')) && Boolean(document.querySelector('[data-silenciar=\"archivo:emblema\"]'))"), 'filas', 'las dos filas existen, cada una con su [Silenciar]')
  await a.evaluar("document.querySelector('[data-silenciar=\"archivo:estallido\"]').scrollIntoView({ block: 'center' }); true")
  await a.captura(`${CAPTURAS}/estudio_dos_filas.jpg`)

  const programado = async (espera = 3500) => {
    await a.evaluar(`(() => { ${IFR}.contentWindow.__sonidosAgendados = []; return true })()`)
    await toque(a, '[data-ver-con-sonido]')
    await a.esp(espera)
    return J(a, `JSON.stringify((${IFR}.contentWindow.__sonidosAgendados ?? []).map((x) => ({ p: x.partitura, id: x.id, en: x.en })))`)
  }
  const cuantos = (r, p, id) => r.filter((x) => x.p === p && x.id === id).length

  let r = await programado()
  debe(cuantos(r, 'emblema', 'estallido') === 1 || cuantos(r, 'emblema', 'estallido') === 2, 'programado', `el estallido se programa en el suspense (${cuantos(r, 'emblema', 'estallido')})`)
  debe(cuantos(r, 'emblema', 'emblema') === 0, 'programado', 'y el golpe del emblema NO se programa en el suspense')
  debe(cuantos(r, 'escena', 'emblema') >= 1 && cuantos(r, 'escena', 'emblema') <= 2, 'programado', `el golpe del emblema se programa cuando aparece el emblema, en la escena (${cuantos(r, 'escena', 'emblema')})`)
  debe(r.filter((x) => x.id === 'emblema').every((x) => x.p === 'escena'), 'programado', 'y el archivo del golpe solo suena en la escena, nunca en otra partitura')
  const unicos = cuantos(r, 'escena', 'emblema')
  debe(unicos === cuantos(r, 'emblema', 'estallido'), 'programado', `cada uno una vez por reproducción (estallido ${cuantos(r, 'emblema', 'estallido')}, golpe ${unicos}; en desarrollo React lo monta dos veces seguidas y salen duplicados a la vez)`)

  // Silenciar el estallido no silencia el golpe, y al revés.
  await toque(a, '[data-silenciar="archivo:estallido"]')
  await a.esp(600)
  r = await programado()
  debe(cuantos(r, 'emblema', 'estallido') === 0 && cuantos(r, 'escena', 'emblema') >= 1, 'silencio', 'con el estallido silenciado, el golpe del emblema sigue sonando')
  await toque(a, '[data-silenciar="archivo:estallido"]')
  await toque(a, '[data-silenciar="archivo:emblema"]')
  await a.esp(600)
  r = await programado()
  debe(cuantos(r, 'escena', 'emblema') === 0 && cuantos(r, 'emblema', 'estallido') >= 1, 'silencio', 'con el golpe silenciado, el estallido sigue sonando')
  await toque(a, '[data-silenciar="archivo:emblema"]')

  // Cada candidato de uno no cambia el del otro.
  await toque(a, '[data-candidato="estallido:B"]')
  await a.esp(500)
  debe((await fila('[data-candidato="estallido:B"]')) === 'true' && (await fila('[data-candidato="emblema:C"]')) === 'true', 'candidatos', 'elegir otro candidato del estallido no cambia el del golpe')
  // Las tarjetas de Lanzarote y del Coliseo llevan lo mismo.
  for (const id of ['emblema_lanzarote', 'emblema_maravilla']) {
    await toque(a, `[data-animacion-tarjeta="${id}"]`)
    await a.esp(1800)
    debe(await a.evaluar("Boolean(document.querySelector('[data-silenciar=\"archivo:estallido\"]')) && Boolean(document.querySelector('[data-silenciar=\"archivo:emblema\"]'))"), 'filas', `${id}: las dos filas, cada una con su [Silenciar]`)
    r = await programado(id === 'emblema_maravilla' ? 6500 : 3500)
    debe(cuantos(r, 'emblema', 'emblema') === 0, 'programado', `${id}: el golpe del emblema no suena en el suspense`)
  }
} finally {
  a.cerrar()
}

console.log(`\nPrueba de la Tanda V38D: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
