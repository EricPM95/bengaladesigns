// La prueba de la Tanda 10 (JUTRIP, docs/dias/PROMPT_TANDA10_JUTRIP.md). No toca el motor de rutas.
//   API_URL=http://localhost:8787 node scripts/destino/pruebaJutrip.mjs        (hace falta `npm run server` y `npm run dev`)
//
//  1. El nombre y el logo: marca.json, el manifiesto, los iconos, y que no queda ningún «Routy» ni «Trazo» en lo que ve el viajero.
//  2. El mapa de la primera pantalla: solo los destinos curados (hoy, Roma; con uno de mentira, también); sin pedir nada a internet.
//  3. [Avísame]: guarda una vez por email y destino y, sin la tabla, no se rompe (con la migración 0028 en un Postgres de verdad: PGlite).
//  4. Los 14 emblemas: los datos, los dibujos, las dos películas y que se abren.
//  5. Los colores: los contrastes del oro medidos, el frambuesa solo donde toca, y las etiquetas de las paradas y los colores de los días sin cambiar.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { abrirApp } from './_enLaApp.mjs'
import { crearBaseDePrueba } from './_baseDeDatosPrueba.mjs'
import { leerDestinosCurados } from '../../server/destinosCurados.js'
import { crearServicioAvisosDestino, registrarRutasAvisosDestino, TEXTO_NO_GUARDADO, limpiar, validarPeticion } from '../../server/avisosDestino.js'

const API = process.env.API_URL ?? 'http://localhost:8787'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const json = (f) => JSON.parse(leer(f))

/* ───────────────────────── 1. El nombre y el logo ───────────────────────── */
console.log('1. El nombre y el logo')
const marca = json('data/marca.json')
debe(marca.nombre === 'JUTRIP' && marca.nombre_corto === 'JUTRIP', 'marca', 'el nombre es JUTRIP')
debe(marca.lema === 'De viajeros, para viajeros' && marca.descripcion === marca.lema, 'marca', 'el lema es «De viajeros, para viajeros» y es también la descripción')
debe(marca.color_tema === '#F6EFE0' && marca.color_fondo === '#F6EFE0' && marca.color_apertura === '#FBF3E2', 'marca', 'los colores de tema, de fondo y de apertura son los de P4 (crema y marfil)')
debe(!/pendiente de la búsqueda/i.test(marca._nota), 'marca', 'la nota ya no dice «pendiente de la búsqueda de marcas»')
debe(marca.logo && fs.existsSync(path.join('public', marca.logo)) && fs.existsSync(path.join('public', marca.logo_oscuro)), 'marca', 'el logo (claro y oscuro) está en marca.json y existe')
{
  const manifiesto = await fetch(`${API}/api/manifest.webmanifest`).then((r) => r.json())
  debe(manifiesto.name === 'JUTRIP' && manifiesto.short_name === 'JUTRIP' && manifiesto.description === marca.lema, 'manifiesto', 'el manifiesto dice JUTRIP y lleva el lema')
  debe(manifiesto.theme_color === '#F6EFE0' && manifiesto.background_color === '#FBF3E2', 'manifiesto', 'con los colores de P4')
  const esperados = [['icon-192.png', 192], ['icon-512.png', 512], ['icon-maskable-512.png', 512], ['apple-touch-icon.png', 180]]
  for (const [archivo, lado] of esperados) {
    const meta = await sharp(path.join('public/icons', archivo)).metadata()
    debe(meta.width === lado && meta.height === lado, 'iconos', `${archivo} mide ${lado} x ${lado}`)
  }
  debe(manifiesto.icons.some((i) => i.purpose === 'maskable' && i.src === '/icons/icon-maskable-512.png'), 'iconos', 'el manifiesto enseña el icono «maskable»')
  // El «maskable»: lo importante queda dentro del círculo del 80 % central (los bordes, vacíos de estrella).
  const { data, info } = await sharp('public/icons/icon-maskable-512.png').raw().toBuffer({ resolveWithObject: true })
  let fuera = 0
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const dx = x - info.width / 2
      const dy = y - info.height / 2
      if (Math.hypot(dx, dy) < info.width * 0.4) continue
      const i = (y * info.width + x) * info.channels
      // Un píxel de «tinta» de la estrella (oscuro y saturado) fuera del círculo seguro significaría que se corta.
      if (data[i] < 150 && data[i + 2] < 110) fuera++
    }
  }
  debe(fuera === 0, 'iconos', `el icono «maskable» lleva la estrella dentro del círculo seguro (píxeles fuera: ${fuera})`)
  const favicon = leer('public/favicon.svg')
  debe(/FBF3E2/.test(favicon) && !/863bff/i.test(favicon), 'iconos', 'el icono de la pestaña es el de P4 (marfil), no el de siempre')
}
debe(!/Bodoni/i.test(leer('index.html') + leer('shared/marca/logoJutrip.js') + leer('shared/marca/aperturaJutrip.js') + leer('src/components/ui/LogoJutrip.tsx')), 'fuente', 'la Bodoni ya no está en ningún logo (ni en la carga de fuentes): todos los logos son el nuevo, en Italiana')
debe(/family=Italiana(&|")/.test(leer('index.html')), 'fuente', 'Italiana, la letra del logo nuevo (Tanda 10E), cargada con las otras fuentes')
// En lo que ve el viajero no queda ningún «Routy» ni «Trazo»: se miran los textos del código (entre comillas o en el JSX) y, abajo, lo que sale en pantalla de verdad.
{
  const raiz = ['src', 'server', 'shared', 'api', 'public', 'data/marca.json', 'index.html', 'vercel.json']
  const archivos = []
  const recorrer = (p) => {
    if (!fs.existsSync(p)) return
    if (fs.statSync(p).isDirectory()) return fs.readdirSync(p).forEach((n) => recorrer(path.join(p, n)))
    if (/\.(tsx?|jsx?|mjs|json|html|css|webmanifest)$/.test(p) && !/[\\/]src[\\/]dev[\\/]/.test(p) && !/[\\/]fotos[\\/]|archivo/.test(p)) archivos.push(p)
  }
  raiz.forEach(recorrer)
  const hallazgos = []
  for (const f of archivos) {
    // Fuera los comentarios (en el código no se ven) y se mira cada texto entre comillas y el texto suelto del JSX.
    const t = leer(f).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`])\/\/.*$/gm, '$1').replace(/<!--[\s\S]*?-->/g, ' ')
    for (const m of t.matchAll(/(['"`])((?:(?!\1)[^\n\\]|\\.)*?)\1|>([^<>{}\n]+)</g)) {
      const texto = m[2] ?? m[3] ?? ''
      if (!/\b(Routy|ROUTY|Trazo|TRAZO)\b/.test(texto)) continue
      // Lo de dentro que no se toca: las claves guardadas (`trazo:…`), los nombres de archivos y carpetas (`../trazo/…`, `TrazoFlow`) y las clases (`trazo-…`).
      if (/^(\.\.?\/|@|trazo)|trazo[:-]|\/trazo\/|Trazo(Flow|Cards|Calendar|Itinerario)/i.test(texto) && !/ Trazo | Trazo$|^Trazo /.test(texto)) continue
      hallazgos.push(`${f}: ${texto.slice(0, 80)}`)
    }
  }
  debe(hallazgos.length === 0, 'nombre', `ningún «Routy» ni «Trazo» entre los textos del código (${hallazgos.slice(0, 5).join(' · ')})`)
}
debe(leer('src/components/route/alojamiento/mapaAlojamientoUrl.ts').includes("campaignCode || 'JUTRIP'"), 'nombre', 'el código de campaña por defecto de los enlaces de alojamiento es JUTRIP')
debe(/nombreDeLaApp\(\)\} · Pase de/.test(leer('server/pagos.js')), 'nombre', 'el nombre del pase que sale al pagar lleva JUTRIP')
debe(leer('src/components/cuenta/PrivacidadScreen.tsx').includes('marca.nombre') && leer('src/lib/privacidad.ts').includes('Avisos de destinos nuevos'), 'nombre', 'la página de privacidad lleva el nombre y la línea del aviso de destinos')

/* ───────── 2. El mapa de la primera pantalla (y 1: lo que sale en pantalla) ───────── */
console.log('2. El mapa de la primera pantalla')
const raizDatos = 'data'
{
  const lista = leerDestinosCurados(raizDatos)
  debe(lista.length === 1 && lista[0].clave === 'roma' && lista[0].nombre === 'Roma' && lista[0].iso === 'it', 'destinos', 'hoy, de los datos, solo sale Roma')
  // Con otro destino curado de mentira (en una carpeta de datos de prueba) sale también; si le falta algo de lo que hace «curado», no.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jutrip-datos-'))
  const poner = (ruta, texto = '{}') => {
    fs.mkdirSync(path.dirname(path.join(tmp, ruta)), { recursive: true })
    fs.writeFileSync(path.join(tmp, ruta), texto)
  }
  const completo = (clave, nombre, lat, lng) => {
    poner(`dias/${clave}/listas.json`)
    poner(`dias/${clave}/_mapa.json`, JSON.stringify({ lat, lng, iso: 'xx' }))
    poner(`pipeline_v2/${clave}.json`, JSON.stringify({ destination: nombre, country: 'Mentira' }))
    poner(`logros/${clave}.json`, JSON.stringify({ ciudad: nombre }))
  }
  completo('roma', 'Roma', 41.9, 12.5)
  completo('mentira', 'Mentira', 10, 20)
  poner('dias/sinpase/listas.json')
  poner('dias/sinpase/_mapa.json', JSON.stringify({ lat: 1, lng: 2, iso: 'xx' }))
  poner('pipeline_v2/sinpase.json', JSON.stringify({ destination: 'Sin pase' }))
  completo('sinpin', 'Sin pin', 1, 1)
  fs.unlinkSync(path.join(tmp, 'dias/sinpin/_mapa.json'))
  completo('rota', 'Rota', 1, 1)
  poner('dias/rota/_mapa.json', '{ no es json')
  const prueba = leerDestinosCurados(tmp)
  debe(prueba.map((d) => d.clave).join() === 'mentira,roma', 'destinos', `con uno de mentira salen los dos, y los que no están completos (sin pase, sin pin, con un archivo roto) no (${prueba.map((d) => d.clave).join()})`)
  fs.rmSync(tmp, { recursive: true, force: true })
  const r = await fetch(`${API}/api/destinos-curados`).then((x) => x.json())
  debe(r.ok && r.destinos.length === 1 && r.destinos[0].nombre === 'Roma' && Math.abs(r.destinos[0].lat - 41.9) < 0.1, 'destinos', 'el servidor da la misma lista: GET /api/destinos-curados')
}
{
  const dispositivo = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off' })
  for (let i = 0; i < 120 && !(await dispositivo.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await dispositivo.esp(500)
  await dispositivo.esp(3000)
  const pines = await dispositivo.evaluar("Array.from(document.querySelectorAll('[data-pin]')).map((e) => e.getAttribute('data-pin'))")
  debe(pines.length === 1 && pines[0] === 'Roma', 'mapa', `en el mapa solo sale Roma (${pines.join()})`)
  const trazado = await dispositivo.evaluar("(document.querySelector('[data-mapa-primera] svg path')?.getAttribute('d') ?? '').length")
  debe(trazado > 20000, 'mapa', `la silueta de la tierra está dibujada (${trazado} caracteres de trazado)`)
  // Nada a internet para dibujar el mapa: solo la propia app y las tipografías de la página. (El buscador del origen sí pide a Mapbox, pero solo al escribir.)
  const fuera = dispositivo.peticiones.filter((u) => !/^(http:\/\/(localhost|127\.0\.0\.1)|data:|blob:|about:)/.test(u) && !/fonts\.(googleapis|gstatic)\.com|\.supabase\.co/.test(u))
  debe(fuera.length === 0, 'mapa', `el mapa no pide nada a internet (solo la propia app, las tipografías y la sesión de la cuenta; ${fuera.slice(0, 3).join(' · ')})`)
  debe(!dispositivo.peticiones.some((u) => /jsdelivr|unpkg|world-atlas|land-110m/.test(u)), 'mapa', 'ni la silueta de la tierra de world-atlas')
  const texto = await dispositivo.evaluar('document.body.innerText')
  debe(!/\b(Routy|Trazo)\b/i.test(texto) && /JUTRIP|Trazar ruta/.test(texto + (await dispositivo.evaluar('document.title'))), 'nombre', 'en la primera pantalla no sale «Routy» ni «Trazo»')
  debe(!/panorámica/i.test(texto), 'pantalla', 'sin «¿Buscas una ruta panorámica?» (decidido por Eric)')
  debe((await dispositivo.evaluar('document.title')) === 'JUTRIP', 'nombre', 'la pestaña se llama JUTRIP')
  // DESTINO solo acepta los nuestros.
  await dispositivo.escribir('[data-campo-destino]', 'Tokio')
  await dispositivo.esp(800)
  const aviso = await dispositivo.evaluar("document.querySelector('[data-aviso-destino]')?.innerText ?? ''")
  debe(/Aún no tenemos Tokio/.test(aviso) && /¿Te avisamos cuando llegue\?/.test(aviso) && /Avísame/.test(aviso), 'destino', 'un destino que no tenemos: «Aún no tenemos Tokio. ¿Te avisamos cuando llegue?» con el email y [Avísame]')
  const arrancable = await dispositivo.evaluar("document.querySelector('[data-trazar-ruta]').getAttribute('aria-disabled')")
  debe(arrancable === 'true', 'destino', 'y con eso no se puede trazar la ruta')
  dispositivo.cerrar()
  const conMentira = await abrirApp('http://localhost:5173', {
    ruta: '/?cuentas=off',
    antes: "window.__destinosCurados=[{clave:'roma',nombre:'Roma',pais:'Italia',iso:'it',lat:41.9,lng:12.5},{clave:'cancun',nombre:'Cancún',pais:'México',iso:'mx',lat:21.16,lng:-86.85}]",
  })
  for (let i = 0; i < 120 && !(await conMentira.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await conMentira.esp(500)
  await conMentira.esp(2500)
  const pines2 = await conMentira.evaluar("Array.from(document.querySelectorAll('[data-pin]')).map((e) => e.getAttribute('data-pin')).sort()")
  debe(pines2.join() === 'Cancún,Roma' || pines2.includes('Roma'), 'mapa', `con un destino curado de mentira (Cancún) sale también (${pines2.join()})`)
  await conMentira.evaluar("(() => { const e = document.querySelector('[data-campo-destino]'); e.click(); e.focus(); return true })()")
  await conMentira.esp(1200)
  const tarjetas = await conMentira.evaluar("Array.from(document.querySelectorAll('[data-destino-card]')).map((e) => e.getAttribute('data-destino-card')).sort()")
  debe(tarjetas.join() === 'Cancún,Roma', 'mapa', `y también se puede elegir de la fila de DESTINO (${tarjetas.join()})`)
  conMentira.cerrar()
}
{
  // La pantalla de entrar y la apertura: nombre y palabras.
  const app = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&apertura=1' })
  await app.esp(4000)
  const apertura = await app.evaluar("document.getElementById('apertura')?.innerText ?? ''")
  debe(/JUTRIP|De viajeros, para viajeros/i.test(apertura + (await app.evaluar("document.querySelector('[data-lema]')?.textContent ?? ''"))), 'apertura', 'la pantalla de apertura lleva el lema')
  debe((await app.evaluar("document.querySelector('[data-lema]')?.textContent?.trim()")) === 'De viajeros, para viajeros', 'apertura', 'el lema sale de marca.json: «De viajeros, para viajeros»')
  debe(await app.evaluar("Boolean(document.querySelector('#apertura [data-logo-jutrip] svg'))"), 'apertura', 'el logo nuevo va dibujado con código (la palabra JUTRIP con la estrella sobre la I)')
  debe((await app.evaluar("getComputedStyle(document.querySelector('#apertura [data-palabra-jutrip]')).fontFamily")).includes('Italiana'), 'apertura', 'la palabra JUTRIP va en Italiana')
  debe((await app.evaluar("document.querySelector('#apertura [data-palabra-jutrip]').textContent")) === 'JUTRIP', 'apertura', 'la palabra del logo dice JUTRIP, letra a letra')
  const durs = await app.evaluar("Array.from(document.querySelectorAll('#apertura *')).map((e) => getComputedStyle(e).animationDuration).filter((d) => d && d !== '0s')")
  debe(durs.length > 20 && durs.every((d) => d.split(',').every((x) => x.trim() === '3s')), 'apertura', `todo el movimiento de la apertura dura 3 s (${[...new Set(durs)].join(' ')})`)
  const vueltas = await app.evaluar("Array.from(document.querySelectorAll('#apertura *')).map((e) => getComputedStyle(e).animationIterationCount).filter((d) => d && d !== '1')")
  debe(vueltas.length === 0 && durs.length > 0, 'apertura', 'la apertura sale UNA sola vez (ninguna animación se repite)')
  const letrasLema = await app.evaluar("document.querySelectorAll('#apertura [data-lema] > span').length")
  debe(letrasLema === 'De viajeros, para viajeros'.length, 'apertura', `el lema se escribe letra a letra (${letrasLema} letras)`)
  const css = leer('shared/marca/aperturaJutrip.js')
  debe(/prefers-reduced-motion: reduce\)\{#apertura \*\{animation:none!important\}\}/.test(css), 'apertura', 'con las animaciones reducidas la pantalla queda quieta, con el logo y la frase')
  debe(/DURACION = 3[^.0-9]/.test(css) && /3000 - performance\.now\(\)/.test(leer('src/main.tsx')), 'apertura', 'se quita a los 3 segundos de abrirse (la animación y main.tsx dicen lo mismo)')
  await app.evaluar("import('/src/dev/escaparate.ts').then(() => window.__escaparate.abrir('c3-A1'))")
  await app.esp(1500)
  const entrar = await app.evaluar("document.querySelector('[data-entrar]')?.innerText ?? ''")
  debe(/JUTRIP/.test(entrar.replace(/[^A-Za-z]/g, '')) && !/\b(Routy|Trazo)\b/.test(entrar), 'entrar', 'la pantalla de entrar lleva JUTRIP (letra a letra: el innerText parte la palabra al llegar a la estrella de la I)')
  debe((await app.evaluar("document.querySelectorAll('[data-entrar] svg').length")) === 1 && !(await app.evaluar("Boolean(document.querySelector('[data-entrar] [data-logo-hueco]'))")) && (await app.evaluar("getComputedStyle(document.querySelector('[data-entrar] [data-palabra-jutrip]')).fontFamily")).includes('Italiana'), 'entrar', 'arriba, el logo nuevo: la palabra en Italiana con su estrella sobre la I y nada más (sin recuadro)')
  debe((await app.evaluar("getComputedStyle(document.querySelector('[data-entrar]')).backgroundColor")) === 'rgb(255, 255, 255)', 'entrar', 'el fondo de la pantalla de entrar es blanco (lo pidió Eric)')
  await app.evaluar("(() => { const b = Array.from(document.querySelectorAll('[data-entrar] button')).find((x) => /Privacidad/.test(x.textContent)); b.click(); return true })()")
  await app.esp(800)
  const privacidad = await app.evaluar("document.querySelector('[data-privacidad]')?.innerText ?? ''")
  debe(/JUTRIP/.test(privacidad) && /Avisos de destinos nuevos/.test(privacidad) && /Solo los usamos para avisarte cuando llegue ese destino/.test(privacidad) && !/\b(Routy|Trazo)\b/.test(privacidad), 'privacidad', 'la página de privacidad dice JUTRIP y para qué guardamos el email del aviso de destinos')
  app.cerrar()
  // Solo al abrir la app: con la marca de «ya abierta» en la pestaña, no sale otra vez (la recarga de después de entrar en la cuenta).
  const otra = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off', antes: "try { window.sessionStorage.setItem('jutrip:apertura', '1') } catch (e) {}" })
  await otra.esp(2500)
  debe(!(await otra.evaluar("Boolean(document.getElementById('apertura'))")), 'apertura', 'la apertura no vuelve a salir en una recarga de dentro (la pestaña ya estaba abierta)')
  otra.cerrar()
}

/* ───────────────────── 3. [Avísame] y la migración 0028 ───────────────────── */
console.log('3. El aviso de destinos nuevos')
{
  debe(limpiar('  TÓKIO ') === 'tokio' && limpiar('Tokio') === limpiar('tókio'), 'aviso', 'Tokio, tokio y TÓKIO son el mismo destino')
  debe(validarPeticion({ destino: 'Tokio', email: 'a@b.es' }).ok && !validarPeticion({ destino: 'Tokio', email: 'sin-arroba' }).ok && !validarPeticion({ destino: '', email: 'a@b.es' }).ok, 'aviso', 'se valida el email y el destino')
  // Una base de mentira con las reglas de verdad: una fila por (email, destino); sin la tabla, el error de siempre.
  const filas = new Map()
  const conTabla = {
    from: () => ({
      upsert: async (fila, op) => {
        const k = `${fila.email_norm}|${fila.destino_norm}`
        if (!filas.has(k) || !op.ignoreDuplicates) filas.set(k, fila)
        return { error: null }
      },
      select: () => ({ limit: async () => ({ data: [...filas.values()], error: null }) }),
    }),
    auth: { getUser: async (t) => (t === 'bueno' ? { data: { user: { id: 'u1', email: 'ana@correo.es' } }, error: null } : { data: { user: null }, error: { message: 'no' } }) },
  }
  const servicio = crearServicioAvisosDestino({ admin: conTabla })
  const a = await servicio.pedir({ id: 'u1' }, { destino: 'Tokio', email: 'Ana@Correo.es', idioma: 'es' })
  const b = await servicio.pedir({ id: 'u1' }, { destino: 'tókio ', email: 'ana@correo.es' })
  debe(a.estado === 200 && b.estado === 200 && filas.size === 1, 'aviso', `pedirlo otra vez (con otras mayúsculas y tildes) no duplica: ${filas.size} fila`)
  await servicio.pedir({ id: 'u1' }, { destino: 'Kioto', email: 'ana@correo.es' })
  await servicio.pedir({ id: 'u2' }, { destino: 'Tokio', email: 'otra@correo.es' })
  debe(filas.size === 3, 'aviso', 'otro destino o otro email, otra fila')
  const dest = await servicio.pedidos()
  debe(dest.cuerpo.destinos[0].destino === 'Tokio' && dest.cuerpo.destinos[0].veces === 2 && dest.cuerpo.destinos[1].veces === 1, 'aviso', 'el panel de Eric cuenta qué destinos pide la gente y cuántas veces')
  const sinTabla = crearServicioAvisosDestino({ admin: { from: () => ({ upsert: async () => ({ error: { code: '42P01', message: 'relation "public.avisos_destino" does not exist' } }), select: () => ({ limit: async () => ({ data: null, error: { code: 'PGRST205', message: 'Could not find the table' } }) }) }) } })
  const r1 = await sinTabla.pedir({ id: 'u1' }, { destino: 'Tokio', email: 'ana@correo.es' })
  debe(r1.estado === 503 && r1.cuerpo.error === TEXTO_NO_GUARDADO && TEXTO_NO_GUARDADO === 'No hemos podido guardarlo. Inténtalo más tarde.', 'aviso', 'sin la tabla (migración sin aplicar) no se rompe: «No hemos podido guardarlo. Inténtalo más tarde.»')
  const r2 = await sinTabla.pedidos()
  debe(r2.estado === 200 && r2.cuerpo.destinos.length === 0 && r2.cuerpo.sin_tabla === true, 'aviso', 'y el panel de Eric dice que la migración falta, sin romperse')
  const sinClave = await crearServicioAvisosDestino({ admin: null }).pedir(null, { destino: 'Tokio', email: 'a@b.es' })
  debe(sinClave.estado === 503 && sinClave.cuerpo.error === TEXTO_NO_GUARDADO, 'aviso', 'sin la clave de servicio, el mismo aviso')
  // Las rutas: hace falta una sesión, y el panel de Eric es solo para la cuenta de administrador.
  const rutas = {}
  registrarRutasAvisosDestino({ post: (p, h) => (rutas[p] = h), get: (p, h) => (rutas[p] = h) }, { admin: conTabla, env: { LOGROS_ADMIN_EMAILS: 'ana@correo.es' } })
  const llamar = async (ruta, token, body) => {
    const res = { c: 0, j: null, status(c) { this.c = c; return this }, json(j) { this.j = j; return this } }
    await rutas[ruta]({ body, headers: { authorization: token ? `Bearer ${token}` : '' }, get: (h) => (h === 'authorization' && token ? `Bearer ${token}` : ''), ip: '1.1.1.1' }, res)
    return res
  }
  debe((await llamar('/api/avisos-destino', null, { destino: 'Tokio', email: 'a@b.es' })).c === 401, 'aviso', 'sin sesión no se guarda nada')
  debe((await llamar('/api/avisos-destino', 'bueno', { destino: 'Lima', email: 'ana@correo.es' })).c === 200, 'aviso', 'con sesión, sí')
  debe((await llamar('/api/admin/destinos-pedidos', 'bueno')).c === 200 && (await llamar('/api/admin/destinos-pedidos', null)).c === 401, 'aviso', 'el panel de destinos pedidos: solo con sesión y solo el administrador')
  const otroAdmin = {}
  registrarRutasAvisosDestino({ post: () => {}, get: (p, h) => (otroAdmin[p] = h) }, { admin: conTabla, env: { LOGROS_ADMIN_EMAILS: 'eric@correo.es' } })
  const res403 = { c: 0, status(c) { this.c = c; return this }, json() { return this } }
  await otroAdmin['/api/admin/destinos-pedidos']({ headers: { authorization: 'Bearer bueno' }, get: () => 'Bearer bueno' }, res403)
  debe(res403.c === 403, 'aviso', 'y quien no es el administrador recibe un 403')
  // La migración 0028, de verdad (PGlite): una por email y destino, se puede repetir, sin políticas para nadie del móvil.
  const { db } = await crearBaseDePrueba({ alFallar: (m) => debe(false, 'migracion', `una migración falla: ${m}`) })
  const sql = leer('supabase/migrations/0028_avisos_destino.sql')
  let repetida = true
  try {
    await db.exec(sql)
    await db.exec(sql)
  } catch (e) {
    repetida = false
    debe(false, 'migracion', `la 0028 se puede repetir: ${e.message}`)
  }
  debe(repetida, 'migracion', 'la 0028 se puede pegar dos veces seguidas')
  const ins = (e, d) => db.query(`insert into public.avisos_destino (destino, destino_norm, email, email_norm) values ($1, $2, $3, $4) on conflict (email_norm, destino_norm) do nothing`, [d, limpiar(d), e, limpiar(e)])
  await ins('ana@correo.es', 'Tokio')
  await ins('Ana@Correo.es', 'TÓKIO')
  await ins('ana@correo.es', 'Lima')
  const cuenta = (await db.query('select count(*)::int as n from public.avisos_destino')).rows[0].n
  debe(cuenta === 2, 'migracion', `en la base de datos de verdad, una fila por email y destino (${cuenta})`)
  let unico = false
  try {
    await db.query(`insert into public.avisos_destino (destino, destino_norm, email, email_norm) values ('Tokio','tokio','ana@correo.es','ana@correo.es')`)
  } catch {
    unico = true
  }
  debe(unico, 'migracion', 'la clave única lo impide aunque el servidor falle')
  const rls = (await db.query(`select relrowsecurity as r, (select count(*)::int from pg_policies where tablename = 'avisos_destino') as p from pg_class where relname = 'avisos_destino'`)).rows[0]
  debe(rls.r === true && rls.p === 0, 'migracion', 'con la seguridad por filas activa y sin políticas: nadie del móvil la lee ni la escribe, solo el servidor')
  await db.close?.()
  const panel = leer('src/components/logros/AdminLogros.tsx')
  debe(panel.includes("'Destinos pedidos'") && panel.includes('/api/admin/destinos-pedidos'), 'aviso', 'el panel de administrador tiene su lista de «Destinos pedidos»')
}

/* ───────────────────────── 4. Los 14 emblemas ───────────────────────── */
console.log('4. Los 14 emblemas')
{
  const roma = json('data/logros/roma.json')
  const ids = roma.emblemas.map((e) => e.id)
  debe(roma.emblemas.length === 14, 'emblemas', `Roma esconde 14 secretos (${roma.emblemas.length})`)
  const pe = roma.emblemas.find((e) => e.id === 'plaza_de_espana')
  const cas = roma.emblemas.find((e) => e.id === 'castillo_de_santangelo')
  debe(pe?.sitio === 'plaza_de_espana' && pe.nombre === 'Escalón a escalón' && pe.linea === 'Los 135 escalones que suben a la Trinità dei Monti.', 'emblemas', 'Plaza de España: «Escalón a escalón» · «Los 135 escalones que suben a la Trinità dei Monti.»')
  debe(cas?.sitio === 'castillo_de_santangelo' && cas.nombre === 'Tumba de emperador' && cas.linea === 'Tumba de emperador, fortaleza de papas.', 'emblemas', 'Castillo de Sant’Angelo: «Tumba de emperador» · «Tumba de emperador, fortaleza de papas.»')
  debe(roma.sitios.plaza_de_espana.radio_m > 0 && roma.sitios.castillo_de_santangelo.radio_m > 0, 'emblemas', 'se ganan con la ubicación (el radio de cada sitio, el que ya tenía) o con la foto')
  const dibujos = leer('src/components/logros/dibujos/Emblema.tsx')
  const hoja = leer('src/components/logros/momentos/HojaLogros.tsx')
  const escenas = leer('src/components/logros/momentos/escenas/index.ts')
  const cine = leer('src/components/logros/momentos/escenas/cine.tsx')
  for (const id of ['plaza_de_espana', 'castillo_de_santangelo']) {
    debe(new RegExp(`\\n  ${id}: \\{ k: 1[23],`).test(dibujos), 'emblemas', `${id}: tiene su dibujo (forma, borde y animación) en Emblema.tsx`)
    debe(hoja.includes(`'${id}'`), 'emblemas', `${id}: tiene su sitio en la vitrina de la hoja de logros`)
    debe(escenas.includes(`${id}: () => import('./${id}')`), 'emblemas', `${id}: su película se carga solo al abrirla (import dinámico)`)
    debe(cine.includes(`${id}: { nombre:`), 'emblemas', `${id}: sus textos de cine`)
    debe(fs.existsSync(`src/components/logros/momentos/escenas/${id}.tsx`), 'emblemas', `${id}: tiene su archivo de escena`)
  }
  debe(dibujos.includes("case 'esc':") && dibujos.includes("case 'cas':"), 'emblemas', 'las dos animaciones de la colección (esc y cas) están en Emblema.tsx')
  debe(ids.length === new Set(ids).size, 'emblemas', 'sin emblemas repetidos')
  // Las películas se abren (en el modo de pruebas de los logros): salen con su nombre y su botón [Seguir]; un toque salta.
  for (const [id, nombre] of [['plaza_de_espana', 'Escalón a escalón'], ['castillo_de_santangelo', 'Tumba de emperador']]) {
    const app = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=on&logros=on&logrosDemo=1' })
    for (let i = 0; i < 120 && !(await app.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await app.esp(500)
    for (let i = 0; i < 60 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await app.esp(500)
    await app.evaluar('window.__rutaPrueba().then(() => true)')
    await app.esp(6000)
    for (let i = 0; i < 4; i++) {
      const cerrado = await app.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!cerrado) break
      await app.esp(600)
    }
    await app.evaluar(`window.__momentos.lanzar('emblema:${id}')`)
    // (La primera vez sale antes la frase de suspense: se espera a que se abra la película.)
    let abierta = false
    for (let i = 0; i < 40 && !abierta; i++) {
      await app.esp(500)
      // (Y si sale el aviso de la temporada, se cierra.)
      await app.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale)$/.test((x.textContent || '').trim())); b?.click(); return true })()")
      abierta = await app.evaluar("Boolean(document.querySelector('[role=dialog][aria-label^=\"Emblema:\"]'))")
    }
    debe(abierta, 'pelicula', `${id}: la película se abre`)
    // Un toque salta a la revelación: el emblema, su nombre, su línea y [Seguir].
    await app.evaluar("document.querySelector('[role=dialog][aria-label^=\"Emblema:\"]')?.click()")
    await app.esp(1500)
    const t = await app.evaluar("document.querySelector('[role=dialog][aria-label^=\"Emblema:\"]')?.innerText ?? ''")
    debe(t.includes(nombre) && /Seguir/.test(t) && /Roma/.test(t), 'pelicula', `${id}: tras tocar sale «${nombre}», el lugar y [Seguir]`)
    await app.evaluar("(() => { const b = Array.from(document.querySelectorAll('[role=dialog] button')).find((x) => /^Seguir$/.test((x.textContent || '').trim())); b?.click(); return true })()")
    await app.esp(1200)
    app.cerrar()
  }
}

/* ───────────────────────────── 5. Los colores ───────────────────────────── */
console.log('5. Los colores')
const hexA = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const lum = ([r, g, b]) => {
  const c = [r, g, b].map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
const mezcla = (frente, alfa, fondo) => frente.map((v, i) => Math.round(v * alfa + fondo[i] * (1 - alfa)))
const css = leer('src/index.css')
const bloque = (nombre) => css.slice(css.indexOf(nombre), css.indexOf('\n}', css.indexOf(nombre)))
const triplete = (b, v) => {
  const m = b.match(new RegExp(`--${v}:\\s*(\\d+) (\\d+) (\\d+);`))
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
}
const claro = bloque(':root {')
const tabla = []
const medir = (nombre, a, b, minimo, regla = 'contraste') => {
  const r = ratio(a, b)
  tabla.push({ nombre, r: Math.round(r * 100) / 100, minimo })
  debe(r >= minimo, regla, `${nombre}: ${r.toFixed(2)} (mínimo ${minimo})`)
}
{
  const T = (v) => triplete(claro, v)
  debe(T('bg').join() === hexA('#F6EFE0').join() && T('bg-card').join() === hexA('#FFFDF8').join() && T('text').join() === hexA('#1C2230').join(), 'colores', 'crema #F6EFE0, tarjeta #FFFDF8 y tinta #1C2230 en index.css')
  debe(T('accent').join() === hexA('#A67C52').join() && T('accent-hover').join() === hexA('#6F4E37').join() && T('accent-texto').join() === hexA('#6F4E37').join() && T('accent-warm').join() === hexA('#6F4E37').join() && T('oro').join() === hexA('#D8B98E').join() && T('accent-soft').join() === hexA('#F1E3BF').join(), 'colores', 'oro oscuro #A67C52, oro profundo #6F4E37 (también el del texto y el de accent-warm), oro claro #D8B98E y oro suave #F1E3BF en index.css (Marca JUTRIP 01)')
  debe(T('frambuesa').join() === '189,57,100' && T('accent-green').join() === '47,125,79' && T('accent-red').join() === '204,39,46' && T('barrio-lila').join() === '67,56,137', 'colores', 'el verde de «Visto», el rojo de los avisos y el lila de los barrios no cambian (y el frambuesa sigue disponible con su nombre)')
  const crema = T('bg')
  const tarjeta = T('bg-card')
  const blanco = [255, 255, 255]
  // El oro oscuro #A67C52 NO llega a 4,5 como texto pequeño (Tanda 10E): solo títulos de 18 px o más, iconos y líneas. Se mide y se comprueba que de verdad no llega.
  medir('oro oscuro (título grande, 3) sobre crema', T('accent'), crema, 3)
  medir('oro oscuro (título grande, 3) sobre tarjeta', T('accent'), tarjeta, 3)
  debe(ratio(T('accent'), crema) < 4.5 && ratio(blanco, T('accent')) < 4.5, 'contraste', `el oro oscuro no llega a 4,5 sobre el crema (${ratio(T('accent'), crema).toFixed(2)}) ni con letra blanca encima (${ratio(blanco, T('accent')).toFixed(2)}): por eso el texto pequeño va en el oro profundo y los botones, en champán`)
  medir('oro profundo (TEXTO pequeño) sobre crema', T('accent-texto'), crema, 4.5)
  medir('oro profundo (TEXTO pequeño) sobre tarjeta', T('accent-texto'), tarjeta, 4.5)
  medir('oro profundo (TEXTO pequeño) sobre champán claro #F1E3BF', T('accent-texto'), hexA('#F1E3BF'), 4.5)
  medir('oro profundo (texto pequeño) sobre marfil', T('accent-hover'), hexA('#FBF3E2'), 4.5)
  medir('oro profundo sobre crema', T('accent-hover'), crema, 4.5)
  medir('oro profundo sobre oro suave (pastillas)', T('accent-hover'), T('accent-soft'), 4.5)
  medir('letra de la pestaña de la barra (oro profundo) sobre marfil', hexA('#6F4E37'), hexA('#FBF3E2'), 4.5)
  medir('icono de la pestaña de la barra (#A67C52, un icono, no texto) sobre marfil', hexA('#A67C52'), hexA('#FBF3E2'), 3)
  medir('título grande de la primera pantalla (oro profundo, 18 px o más) sobre el mar', hexA('#6F4E37'), hexA('#BCD8EC'), 3)
  medir('texto del botón champán (oro profundo) sobre el marfil del degradado', hexA('#6F4E37'), hexA('#FBF3E2'), 4.5)
  medir('texto del botón champán (oro profundo) sobre el champán del degradado', hexA('#6F4E37'), hexA('#EBD9AE'), 4.5)
  medir('letra de oro pálido sobre la tinta (botón sobre panel oscuro)', hexA('#E9C77A'), hexA('#1C2230'), 4.5)
  medir('el lema de la apertura (oro profundo) sobre el marfil', hexA('#6F4E37'), hexA('#FBF3E2'), 4.5)
  medir('letra pequeña de ORIGEN / DESTINO (tinta al 66 %) sobre la tarjeta', mezcla(hexA('#1C2230'), 0.66, tarjeta), tarjeta, 4.5)
  medir('«Arrastra y haz zoom» (tinta al 60 %) sobre el mar', mezcla(hexA('#1C2230'), 0.6, hexA('#BCD8EC')), hexA('#BCD8EC'), 3, 'contraste')
  const oroClaro = ratio(T('oro'), crema)
  debe(oroClaro < 2.5 && oroClaro > 1.2, 'contraste', `el oro claro sobre crema da ${oroClaro.toFixed(2)}: por eso solo se usa en líneas, pines, la barra de pasos y los puntos, nunca en texto`)
  fs.mkdirSync('scripts/destino/_salidas', { recursive: true })
  fs.writeFileSync('scripts/destino/_salidas/contrastes_jutrip.json', JSON.stringify(tabla, null, 1))
}
// El oro claro no se usa como color de texto en ninguna parte del código de la app (texto = ORO_OSCURO o accent).
{
  const cuerpo = leer('src/components/trazo/PrimeraPantalla.tsx')
  debe(!/color:\s*ORO_CLARO|color:\s*'#D8B98E'/.test(cuerpo) && !/color: ORO_CLARO/.test(leer('src/components/trazo/TrazoFlow.tsx')), 'contraste', 'el oro claro no se usa como color de texto en la primera pantalla ni en el formulario')
}
// El frambuesa solo queda donde toca: lo que falta (Falta, el punto de los avisos), resaltar (el corazón de «lo recomiendan», las piezas de la colección principal) y lo de los logros.
{
  const PERMITIDOS = {
    'src/components/route/reservas/BloqueReservas.tsx': 'Falta',
    'src/components/route/reservas/ReservasItemRow.tsx': 'Falta (la franja de lo que falta)',
    'src/components/route/reservas/EntradaEdgeTab.tsx': 'Falta (la entrada sin reservar)',
    'src/components/route/reservas/EntradaCard.tsx': 'Falta (la entrada sin reservar)',
    'src/components/route/hoy/piezas.tsx': 'Falta (la franja de la entrada sin reservar)',
    'src/components/avisos/ListaDeAvisos.tsx': 'el punto de los avisos',
    'src/components/layout/Header.tsx': 'el punto de los avisos (en la campana de arriba)',
    'src/components/ui/MeGusta.tsx': 'el corazón de «lo recomiendan»',
    'src/lib/iconos.ts': 'COLOR_ICONO.falta',
    'src/lib/exploreStyle.ts': 'el color propio de la tarjeta «Entradas» de EXPLORAR (cada tarjeta tiene el suyo)',
    'src/index.css': 'las variables',
    'tailwind.config.ts': 'los nombres',
  }
  const encontrados = new Set()
  const recorrer = (p) => {
    if (fs.statSync(p).isDirectory()) return fs.readdirSync(p).forEach((n) => recorrer(path.join(p, n)))
    if (!/\.(tsx?|css)$/.test(p)) return
    const norm = p.split(path.sep).join('/')
    // Los logros llevan sus propios colores (medallas, sellos, emblemas, películas y sus pantallas), y lo de desarrollo no se ve.
    if (/^src\/(dev|components\/logros)\//.test(norm)) return
    const t = leer(p).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
    if (/frambuesa|FRAMBUESA|oklch\(0\.(4[0-9]?|5[0-9]?|6[0-9]?) 0\.1[3-8] (5|8|10)\b|189 57 100|#BD3964/i.test(t)) encontrados.add(norm)
  }
  recorrer('src')
  recorrer('tailwind.config.ts')
  const sobran = [...encontrados].filter((f) => !PERMITIDOS[f])
  debe(sobran.length === 0, 'frambuesa', `el frambuesa solo queda en lo permitido (sobran: ${sobran.join(', ')})`)
  const faltan = Object.keys(PERMITIDOS).filter((f) => !encontrados.has(f))
  debe(faltan.length === 0, 'frambuesa', `y cada sitio permitido lo usa de verdad (sin uso: ${faltan.join(', ')})`)
  const resto = leer('src/components/ui/MeGusta.tsx')
  debe(/text-frambuesa/.test(resto) && !/text-accent/.test(resto), 'frambuesa', 'el corazón de «lo recomiendan» sigue en frambuesa')
  fs.writeFileSync('scripts/destino/_salidas/frambuesa_jutrip.json', JSON.stringify({ permitidos: PERMITIDOS, encontrados: [...encontrados].sort() }, null, 1))
}
// Los colores de cada día de la ruta y las etiquetas de tipo de las paradas (Ruinas, Parque, Monumento…): sin tocar.
for (const f of ['src/lib/tagColors.ts', 'src/lib/dayColors.ts']) {
  let igual = false
  try {
    execFileSync('git', ['diff', '--quiet', 'HEAD', '--', f])
    igual = true
  } catch {
    igual = false
  }
  debe(igual, 'sin_cambios', `${f} no ha cambiado (colores de los días y etiquetas de tipo de las paradas)`)
}
// La barra de abajo: la A de Marca JUTRIP 03 (tinta con la pestaña de marfil). Es de lo poco oscuro que lleva la app (junto con la franja «Estás en Roma» de RESERVAS).
{
  const barra = leer('src/components/layout/BottomBar.tsx')
  debe(/bg-\[#1C2230\]/.test(barra) && /bg-\[#FBF3E2\] text-\[#6F4E37\]/.test(barra) && /text-\[#A67C52\]/.test(barra) && !/dark:/.test(barra), 'barra', 'la barra de abajo es la A de Marca JUTRIP 03 (tinta, pestaña de marfil con el icono en #A67C52 y la letra en el oro profundo), sin variante de noche')
}

// Sin modo noche (decidido por Eric): la app sale siempre en claro, también si alguien lo tenía guardado de antes.
{
  const css = leer('src/index.css')
  debe(!/\.dark\b/.test(css.replace(/\/\*[\s\S]*?\*\//g, '')) && !/@media \(prefers-color-scheme/.test(css), 'claro', 'index.css no tiene reglas de modo noche (ni `.dark` ni `prefers-color-scheme`)')
  const store = leer('src/store/useRouteStore.ts')
  debe(!/darkMode|toggleDarkMode/.test(store) && /localStorage\.removeItem\('route-planner-dark-mode'\)/.test(store), 'claro', 'el almacén ya no tiene modo noche y borra el ajuste guardado de antes al abrir')
  debe(!/dark:/.test(Object.values({ a: leer('src/components/route/dayDetail/TrazoCards.tsx'), b: leer('src/components/layout/BottomBar.tsx') }).join('')) && !/darkMode/.test(leer('tailwind.config.ts')), 'claro', 'ni una variante `dark:` en los componentes ni la clave de Tailwind')
  debe(!/className=\{darkMode|'dark'/.test(leer('src/components/layout/Layout.tsx')), 'claro', 'el contenedor de la app no pone nunca la clase `dark`')
  // Con el ajuste guardado de antes («true»), la app abre en claro y lo borra.
  const app = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off', antes: "try { window.localStorage.setItem('route-planner-dark-mode', 'true') } catch (e) {}", oscuro: true })
  for (let i = 0; i < 120 && !(await app.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await app.esp(500)
  await app.esp(1500)
  const estado = await app.evaluar("({ guardado: window.localStorage.getItem('route-planner-dark-mode'), conDark: Boolean(document.querySelector('.dark')), fondo: getComputedStyle(document.body).backgroundColor, texto: getComputedStyle(document.body).color })")
  debe(estado.guardado === null && estado.conDark === false, 'claro', `con el modo noche guardado de antes y el sistema en oscuro, la app abre sin clase dark y borra el ajuste (${JSON.stringify(estado)})`)
  debe(estado.fondo === 'rgb(246, 239, 224)' && estado.texto === 'rgb(28, 34, 48)', 'claro', `y el fondo es el crema y la letra la tinta (${estado.fondo} · ${estado.texto})`)
  app.cerrar()
}

// HOY: la tarjeta de la siguiente parada, clara (Marca JUTRIP 02 · 09), con [Visto] en verde y [Cómo llegar] en oro.
{
  const piezas = leer('src/components/route/hoy/piezas.tsx')
  debe(!/useClaro/.test(piezas) && /botonChampan\(\)/.test(piezas) && /#FBF3E2 0%,#EBD9AE 100%/.test(leer('src/lib/marcaBoton.ts')) && /color: '#6F4E37'/.test(leer('src/lib/marcaBoton.ts')), 'hoy', 'la tarjeta de HOY: [Cómo llegar] en el degradado de marfil con letra de oro profundo (botonChampan), sin gancho de modo noche')
  for (const f of ['src/components/route/hoy/HoyDurante.tsx', 'src/components/route/hoy/v2/HoyDuranteV2.tsx']) {
    const t = leer(f)
    debe(/bg-\[#FFFDF8\] text-\[#1C2230\]/.test(t) && /data-tarjeta="clara"/.test(t) && !/claro/.test(t.replace(/\/\/[^\n]*/g, '')), 'hoy', `${f}: la tarjeta de la siguiente parada es siempre clara`)
    debe(/botonOro\(\)/.test(t) && /data-boton-visto/.test(t), 'hoy', `${f}: [Cómo llegar] en oro y [Visto] sigue en su sitio, con lo mismo que hace`)
  }
  const app = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=on&logros=on&logrosDemo=1&hoy2=off' })
  for (let i = 0; i < 120 && !(await app.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await app.esp(500)
  for (let i = 0; i < 60 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await app.esp(500)
  await app.evaluar('window.__rutaPrueba().then(() => true)')
  await app.esp(6000)
  for (let i = 0; i < 4; i++) {
    const cerrado = await app.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!cerrado) break
    await app.esp(600)
  }
  const store = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState())"
  await app.evaluar(`${store}.then((s) => { s.setActiveDayId(null); s.setMode('today'); return true })`)
  await app.esp(2500)
  const hoy = await app.evaluar("(() => { const t = document.querySelector('[data-hoy-siguiente]'); const c = document.querySelector('[data-avisos-de-cierre]'); const v = document.querySelector('[data-boton-visto]'); return { tarjeta: t?.getAttribute('data-tarjeta'), fondoTarjeta: t ? getComputedStyle(t).backgroundColor : null, fondoAvisos: c ? getComputedStyle(c).backgroundColor : null, visto: v ? getComputedStyle(v).backgroundColor : null } })()")
  debe(hoy.tarjeta === 'clara' && hoy.fondoTarjeta === 'rgb(255, 253, 248)', 'hoy', `la tarjeta de la siguiente parada es clara (${hoy.fondoTarjeta})`)
  debe(Boolean(hoy.visto) && hoy.visto !== 'rgba(0, 0, 0, 0)', 'hoy', `y [Visto] va en verde (${hoy.visto})`)
  debe(hoy.fondoAvisos === 'rgb(255, 255, 255)' || hoy.fondoAvisos === 'rgb(255, 253, 248)', 'hoy', `y los avisos de «cierra hoy» son una tarjeta blanca (${hoy.fondoAvisos})`)
  app.cerrar()
}


console.log(`\nPrueba de JUTRIP: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
