// La prueba de las pantallas de la Tanda 8B (HOY v2, el Visto y las fotos, los momentos). No toca el motor de rutas.
//   node scripts/destino/pruebaPantallas8b.mjs            (comprueba el código y, si existe `dist/`, la versión de producción)
// El recorrido de un día entero en el navegador (con el modo demo `?logrosDemo=1`) se hace aparte y queda contado en docs/dias/INFORME_TANDA8B.md.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'
import { createRequire } from 'node:module'
import { build } from 'esbuild'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
const archivos = (dir, ext = /\.(ts|tsx)$/) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? archivos(path.join(dir, e.name), ext) : ext.test(e.name) ? [path.join(dir, e.name)] : []))

console.log('1. Los interruptores y la carga de pantallas')
{
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-pantallas8b-'))
  const salida = path.join(carpeta, 'app.cjs')
  const abs = (f) => path.resolve(f).split(path.sep).join('/')
  fs.writeFileSync(
    path.join(carpeta, 'entrada.ts'),
    `export { calcularHoyV2Activo } from '${abs('src/lib/hoyV2.ts')}'\n` + `export { esFalloDeCarga } from '${abs('src/components/layout/PantallaPerezosa.tsx')}'\n`,
  )
  await build({
    entryPoints: [path.join(carpeta, 'entrada.ts')],
    outfile: salida,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    logLevel: 'error',
    jsx: 'automatic',
    define: { 'import.meta.env': '{"DEV":false}' },
  })
  const A = createRequire(import.meta.url)(salida)
  const c = A.calcularHoyV2Activo
  debe(c({ desarrollo: false }) === false && c({ desarrollo: false, entorno: 'true' }) === true, 'hoy2', 'HOY v2: apagado salvo VITE_HOY_V2=true')
  debe(c({ desarrollo: true, parametro: 'on' }) === true && c({ desarrollo: true, entorno: 'true', parametro: 'off' }) === false, 'hoy2', 'en desarrollo vale ?hoy2=on y off')
  debe(c({ desarrollo: false, parametro: 'on' }) === false && c({ desarrollo: false, guardado: 'on' }) === false, 'hoy2', 'en producción la dirección no enciende nada')
  debe(c({ desarrollo: true, guardado: 'on' }) === true, 'hoy2', 'en desarrollo se recuerda lo elegido en la sesión')
  const f = A.esFalloDeCarga
  debe(f(new TypeError('Failed to fetch dynamically imported module: https://x/assets/RouteScreen.js')) === true, 'carga', 'un archivo que no baja (Chrome) es un fallo de carga')
  debe(f(new TypeError('error loading dynamically imported module')) === true && f(new TypeError('Importing a module script failed.')) === true, 'carga', 'Firefox y Safari también')
  debe(f(Object.assign(new Error('Loading chunk 7 failed'), { name: 'ChunkLoadError' })) === true, 'carga', 'ChunkLoadError')
  debe(f(new TypeError("Cannot read properties of undefined (reading 'map')")) === false, 'carga', 'un fallo de dibujado NO es de carga: sigue yendo al ErrorBoundary')
  const app = leer('src/App.tsx')
  debe(/pantallaPerezosa\(cargarRouteScreen\)/.test(app) && /pantallaPerezosa\(\(\) => import\('\.\/components\/myTrips\/MyTripsScreen'\)/.test(app) && !/\blazy\(/.test(app), 'carga', 'las cuatro pantallas partidas van con «No se ha podido cargar. [Reintentar]»')
  const pp = leer('src/components/layout/PantallaPerezosa.tsx')
  debe(pp.includes('No se ha podido cargar.') && pp.includes('Reintentar') && pp.includes('role="alert"'), 'carga', 'el mensaje del reintento está')
  debe(/destination/.test(pp) && /bg-bg/.test(pp), 'carga', 'la espera lleva el fondo y la cabecera de la app')
}

console.log('2. Apagado, la app es la de hoy')
{
  const hoy = leer('src/components/route/hoy/HoyView.tsx')
  debe(/hoyV2Activo\(\)/.test(hoy), 'apagado', 'HoyView elige entre HOY de siempre y HOY v2 con el interruptor')
  const visto = leer('src/components/logros/LogrosPorVisto.tsx')
  debe(/if \(!logrosActivos\(\)\) return null/.test(visto), 'apagado', 'con los logros apagados, LogrosPorVisto no monta nada')
  const app = leer('src/App.tsx')
  debe(/<MomentosHost \/>/.test(app), 'apagado', 'MomentosHost montado en App')
  const host = leer('src/components/logros/momentos/MomentosHost.tsx')
  debe(/logrosActivos\(\)/.test(host), 'apagado', 'MomentosHost se apaga con los logros')
  const ruta = leer('src/components/route/RouteScreen.tsx')
  debe(/BotonFlotanteLogros/.test(ruta), 'apagado', 'el botón flotante está en la pantalla de la ruta')
  const boton = archivos('src/components/logros/momentos').find((f) => /BotonFlotanteLogros/.test(f))
  debe(boton && /logrosActivos\(\)/.test(leer(boton)), 'apagado', 'el botón flotante se apaga con los logros')
}

console.log('3. Reglas que no se pueden saltar')
{
  const nuestros = [...archivos('src/components/logros'), ...archivos('src/components/route/hoy/v2'), 'src/lib/paseEstado.ts', 'src/lib/hoyV2.ts'].filter((f) => !/AdminLogros|PruebaFotos/.test(f))
  const empresas = /civitatis|booking\.com|stay22|viator|getyourguide|tiqets|airbnb|skyscanner|trivago|whatsapp|instagram|tiktok|facebook/i
  const aviso = []
  for (const f of nuestros) {
    const t = sinComentarios(leer(f))
    // Solo cuenta lo que se ve: textos entre comillas o dentro de JSX, no los nombres de funciones ni las direcciones.
    for (const m of t.matchAll(/(['"`])((?:(?!\1).)*)\1|>([^<>{}]+)</g)) {
      const txt = m[2] ?? m[3] ?? ''
      if (empresas.test(txt) && !/^https?:|\.com|\/api\//.test(txt)) aviso.push(`${f}: ${txt.slice(0, 60)}`)
    }
  }
  debe(aviso.length === 0, 'empresas', `ningún nombre de empresa en los textos de las pantallas nuevas: ${aviso.join(' | ')}`)
  const hoyV2 = archivos('src/components/route/hoy/v2').map(leer).join('\n')
  debe(!/dibujos['"]/.test(hoyV2) || !/<Emblema\b/.test(sinComentarios(hoyV2)), 'emblemas', 'HOY v2 no dibuja ningún emblema (nunca se ven antes de ganarlos)')
  const dias = leer('src/components/route/dayDetail/DayDetailPanel.tsx')
  debe(!/<Emblema\b/.test(dias), 'emblemas', 'DÍAS no dibuja ningún emblema')
  const hoja = archivos('src/components/logros/momentos').find((f) => /HojaLogros/.test(f))
  debe(hoja && !/<Emblema\b/.test(sinComentarios(leer(hoja))), 'emblemas', 'la hoja del botón flotante no enseña emblemas (los de la 8c, ya encontrados)')
  const visibles = [...archivos('src/components/logros/momentos'), ...archivos('src/components/logros/visto'), ...archivos('src/components/route/hoy/v2')]
  const horas = []
  for (const f of visibles) {
    const t = sinComentarios(leer(f))
    for (const m of t.matchAll(/(madrugador|nocturno)[^\n]{0,80}\b([01]?\d|2[0-3]):[0-5]\d/gi)) horas.push(`${f}: ${m[0].slice(0, 60)}`)
  }
  debe(horas.length === 0, 'horas', `ninguna hora de Madrugador o Nocturno a la vista: ${horas.join(' | ')}`)
  const frasesDeSuspense = leer('src/components/logros/momentos/EscenaDeEmblema.tsx')
  debe(/primeraVez/.test(frasesDeSuspense) && /frase/.test(frasesDeSuspense), 'suspense', 'la frase de suspense depende de «primera vez»')
  const coliseo = archivos('src/components/logros/momentos/escenas').find((f) => /coliseo/.test(f))
  debe(coliseo && /Casi 2\.000 años esperándote/.test(leer(coliseo)), 'coliseo', 'la película del Coliseo lleva «Casi 2.000 años esperándote…»')
  const visto = archivos('src/components/logros/visto').map(leer).join('\n')
  debe(/Te quedan \{?/.test(visto) || /Te quedan/.test(visto), 'plazo', 'el plazo «Te quedan N días para reclamar tu premio» está')
  debe(/ponerHojaAbierta/.test(visto), 'hojas', 'las hojas del Visto avisan a las sorpresas para que esperen')
  debe(/Sin conexión\. Tus sorpresas te esperan: saldrán al volver la señal\./.test(visto), 'sin_cobertura', 'la franja de sin cobertura, con su texto')
  debe(/Desmarcar visto/.test(visto) && /Deshacer/.test(visto), 'deshacer', '[Deshacer] y «¿No estás aquí? Desmarcar visto»')
  const reduc = archivos('src/components/logros/momentos').map(leer).join('\n')
  debe(/prefers-reduced-motion/.test(reduc), 'movimiento', '«Reducir movimiento» respetado en los momentos')
  debe(/sonar\(/.test(reduc) && /vibrar\(/.test(reduc), 'sonido', 'los momentos suenan y vibran con sonar() y vibrar()')
  const hojaMin = /h-\[?(4[4-9]|5\d|6\d)|min-h-\[?44|h-11|h-12|h-14|w-11|min-w-\[?44/
  debe(hojaMin.test(archivos('src/components/logros/visto').map(leer).join('\n')), 'toque', 'los botones de las hojas del Visto miden 44 px o más')
}

console.log('4. Lo que no debe llegar a producción ni pesar al abrir')
{
  const main = leer('src/main.tsx')
  debe(/import\.meta\.env\.DEV/.test(main) && /dibujos/.test(main), 'dev', 'la página de prueba de los dibujos solo existe en desarrollo')
  const logros = leer('src/lib/logros.ts')
  debe(/import\.meta\.env\.DEV/.test(logros) && /logrosDemo/.test(logros), 'dev', 'el modo demo solo se carga en desarrollo')
  if (fs.existsSync('dist/index.html')) {
    const html = leer('dist/index.html')
    const urls = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1])
    const abren = urls.filter((u) => u.endsWith('.js')).map((u) => leer('dist' + u))
    const todos = archivos('dist/assets', /\.js$/).map(leer).join('\n')
    debe(!/__demo|logrosDemo|window\.__momentos/.test(todos), 'dev', 'el build de producción NO lleva el modo demo ni los atajos de prueba')
    const nombres = archivos('dist/assets', /\.js$/).map((f) => path.basename(f))
    for (const parte of ['Reproductor', 'Compartir', 'ResumenViaje', 'ResumenDia', 'EscenaDeEmblema', 'coliseo', 'Medalla', 'HojaLogros']) {
      debe(nombres.some((n) => n.startsWith(parte)), 'carga', `la escena «${parte}» va en su propio archivo (se baja al abrirla)`)
    }
    const dentro = abren.join('\n')
    debe(!/Casi 2\.000 años esperándote/.test(dentro) && !/Tu día en /.test(dentro), 'carga', 'al abrir no entran ni la película del Coliseo ni los resúmenes')
    const bytes = urls.filter((u) => u.endsWith('.js')).reduce((s, u) => s + fs.statSync('dist' + u).size, 0)
    const gz = urls.reduce((s, u) => s + zlib.gzipSync(fs.readFileSync('dist' + u)).length, 0)
    console.log(`   al abrir: ${(bytes / 1024).toFixed(1)} KB de JavaScript (${(gz / 1024).toFixed(1)} KB comprimido) en ${urls.length} archivos`)
    debe(bytes < 1024 * 1024 && gz < 340 * 1024, 'peso', 'al abrir, el JavaScript pesa menos de 1 MB y la descarga (con CSS) menos de 340 KB comprimida')
    const medalla = archivos('public/medalla', /\.(webp|png)$/).reduce((s, f) => s + fs.statSync(f).size, 0)
    debe(medalla < 220 * 1024, 'peso', 'la medalla de las 7 maravillas pesa menos de unos 200 KB')
  } else console.log('   (sin dist/: no se comprueba la versión de producción; ejecuta antes «npx vite build»)')
}

const ok = fallos.length === 0
console.log(`\n${comprobaciones} comprobaciones. ${ok ? '0 fallos.' : `${fallos.length} FALLOS:`}`)
for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
process.exit(ok ? 0 : 1)
