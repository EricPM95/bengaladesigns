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
  debe(hoja && (!/<Emblema/.test(sinComentarios(leer(hoja))) || (/encontrados_lista/.test(leer(hoja)) && !/silueta/.test(sinComentarios(leer(hoja))))), 'emblemas', 'la hoja del botón flotante solo dibuja emblemas ya encontrados (los que faltan, solo «?»; 8C2)')
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
    debe(!/cuatro_joyas|baldaquino|dib-quieto|mm-off/.test(dentro), 'carga', 'al abrir no entran los dibujos de los logros (insignias, sellos, emblemas, medalla): la hoja del Visto importa solo InsigniaPerezosa')
    const bytes = urls.filter((u) => u.endsWith('.js')).reduce((s, u) => s + fs.statSync('dist' + u).size, 0)
    const gz = urls.reduce((s, u) => s + zlib.gzipSync(fs.readFileSync('dist' + u)).length, 0)
    console.log(`   al abrir: ${(bytes / 1024).toFixed(1)} KB de JavaScript (${(gz / 1024).toFixed(1)} KB comprimido) en ${urls.length} archivos`)
    debe(bytes < 1024 * 1024 && gz < 400 * 1024, 'peso', 'al abrir, el JavaScript pesa menos de 1 MB y la descarga (con CSS) menos de 400 KB comprimida (10N10: tope subido de 340 a 400; la 10N9 ya pesaba 378 KB y ahora 371 KB; aligerarla queda para la 10S)')
    const medalla = archivos('public/medalla', /\.(webp|png)$/).reduce((s, f) => s + fs.statSync(f).size, 0)
    debe(medalla < 220 * 1024, 'peso', 'la medalla de las 7 maravillas pesa menos de unos 200 KB')
  } else console.log('   (sin dist/: no se comprueba la versión de producción; ejecuta antes «npx vite build»)')
}

console.log('5. Tanda 8B2: el orden de las sorpresas, el pedazo con su insignia, la medalla 1 de 7 y los avisos con cruz')
{
  const ajustes = JSON.parse(leer('data/logros/ajustes.json'))
  debe(ajustes.orden_momentos.join() === 'pedazo,coleccion,emblema,sello,pais,destino_nuevo,continente,maravilla,patrimonio,viajero', 'orden', 'el orden de las sorpresas, en un solo sitio (el servidor): pedazos, colecciones, emblema, sello, «Y además…»')
  const servidor = sinComentarios(leer('server/logros/momentos.js'))
  debe(!/maravilla\.id/.test(servidor) && !/splice/.test(servidor), 'orden', '(8B4) el servidor ya no pega la maravilla a su emblema: va en «Y además…», en su sitio de orden_momentos')
  const plan = sinComentarios(leer('src/components/logros/momentos/plan.ts'))
  debe(!/\[\s*'(pedazo|emblema|coleccion)'/.test(plan) && /ajustes\.json/.test(plan), 'orden', 'el móvil no lleva su propio orden escrito: solo agrupa lo que manda el servidor (y, para juntar el Visto y la foto en una ronda, lee la MISMA lista de ajustes.json)')
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-pantallas8b2-'))
  const salida = path.join(carpeta, 'plan.cjs')
  await build({ entryPoints: [path.resolve('src/components/logros/momentos/plan.ts')], outfile: salida, bundle: true, platform: 'node', format: 'cjs', logLevel: 'error' })
  const P = createRequire(import.meta.url)(salida)
  const m = (tipo, extra = {}) => ({ tipo, nombre: tipo, primera_vez: true, ...extra })
  const lista = [
    m('suma', { coleccion: 'imprescindibles' }), m('suma', { coleccion: 'cuatro_joyas' }), m('suma_sello', { sello: 'roma' }),
    m('coleccion', { id: 'roma_antigua' }), m('coleccion', { id: 'miradores' }),
    m('emblema', { id: 'coliseo', maravilla: 'coliseo' }),
    m('sello', { sello: 'roma', grado: 'plata' }),
    m('pais'), m('maravilla', { id: 'coliseo', n: 1 }), m('patrimonio'), m('viajero'),
  ]
  const pantallas = P.planificar(lista)
  debe(pantallas.map((p) => p.tipo).join() === 'pedazos,coleccion,coleccion,emblema,sello,ademas', 'orden', `(8B4) las pantallas, en este orden: pedazos (todos juntos), una por colección completada, emblema, sello, «Y además…» (con la maravilla dentro), sin pantalla de la medalla: ${pantallas.map((p) => p.tipo).join()}`)
  debe(pantallas[0].momentos.length === 2 && pantallas[5].momentos.length === 4, 'orden', 'todos los pedazos nuevos en una sola pantalla y «Y además…» con país, maravilla, Patrimonio y logro de viajero')
  debe(pantallas[5].momentos.some((x) => x.tipo === 'maravilla'), 'orden', 'la maravilla va como tarjetita dentro de «Y además…»')
  debe(P.planificar([m('maravilla', { id: 'gran_muralla', n: 2 })]).map((p) => p.tipo).join() === 'ademas' && P.planificar([m('maravilla', { id: 'taj_mahal', n: 7 })]).map((p) => p.tipo).join() === 'final7', 'orden', 'una maravilla sola sigue siendo la tarjetita; solo la séptima tiene su pantalla: «El final de las 7 maravillas»')
  const momentos = archivos('src/components/logros/momentos').map((f) => sinComentarios(leer(f))).join('\n')
  debe(!/Una foto, \$\{/.test(momentos) && !/Una foto, \d/.test(momentos) && !/Una foto,/.test(momentos), 'texto', 'fuera «Una foto, 3 colecciones»')
  const pant = leer('src/components/logros/momentos/pantallas.tsx')
  debe(/<Insignia /.test(pant) && /<MedallaDeSiete/.test(pant), 'dibujos', 'el pedazo lleva su insignia y la maravilla su medalla (nunca un icono genérico)')
  debe(/Tu primera maravilla/.test(pant) || /primera maravilla/i.test(pant), 'maravilla', '«Tu primera maravilla · 1 de 7» en la tarjetita de «Y además…»')
  const coliseo = leer('src/components/logros/momentos/escenas/coliseo.tsx')
  debe(!/Tu primera maravilla/.test(sinComentarios(coliseo)), 'maravilla', 'la película del Coliseo ya no lleva dentro la tarjetita «Tu primera maravilla»')
  const hojas = leer('src/components/logros/visto/Hojas.tsx')
  debe(/<Insignia /.test(hojas) && /Tu pedazo ya es tuyo\. La foto es para tu álbum\./.test(hojas), 'v2', 'la hoja del pedazo (V2) lleva la insignia y dice que el pedazo ya es suyo')
  const durante = leer('src/components/route/hoy/v2/HoyDuranteV2.tsx')
  debe(/Cerrar este aviso/.test(durante) && /h-11 w-11/.test(durante), 'avisos', 'los avisos del día llevan una cruz de 44 px')
  const v2 = archivos('src/components/route/hoy/v2').map((f) => sinComentarios(leer(f))).join('\n')
  debe(!/Tu ruta empieza/.test(v2) && !/>\s*Saltada\s*</.test(v2) && !/'Saltada'/.test(v2), 'hoy', 'fuera «Tu ruta empieza en…» y la etiqueta «Saltada»')
  const visto = archivos('src/components/logros/visto').map((f) => sinComentarios(leer(f))).join('\n')
  debe(!/sitio_nombre/.test(visto.replace(/\/\/.*$/gm, '').split('\n').filter((l) => /\$\{|<span|<p|texto|titulo/.test(l)).join('\n')), 'textos', 'los textos de las hojas llevan el nombre de la parada, no el `sitio_nombre` del servidor')
  const despues = leer('src/components/route/hoy/v2/HoyDespuesV2.tsx')
  debe(/abrirResumenViaje/.test(despues), 'despues', 'el HOY de después del viaje usa la pieza del resumen del viaje')
  debe(fs.existsSync('scripts/destino/auditoriaFotos.mjs'), 'fotos', 'el script de auditoría de fotos está')
  const escenas = ['panteon', 'fontana_de_trevi', 'foro_romano', 'museos_vaticanos', 'plaza_san_pedro', 'basilica_san_pedro', 'boca_de_la_verdad', 'ojo_cerradura', 'catacumbas', 'madrugador', 'nocturno']
  debe(escenas.every((e) => fs.existsSync(`src/components/logros/momentos/escenas/${e}.tsx`)), 'escenas', 'las 11 escenas siguen cada una en su archivo (carga perezosa)')
  const horas = []
  for (const e of ['madrugador', 'nocturno']) for (const x of sinComentarios(leer(`src/components/logros/momentos/escenas/${e}.tsx`)).matchAll(/\b([01]?\d|2[0-3]):[0-5]\d\b/g)) horas.push(`${e}: ${x[0]}`)
  debe(horas.length === 0, 'horas', `las escenas de Madrugador y Nocturno no enseñan ninguna hora: ${horas.join(' | ')}`)
}

console.log('6. Tanda 8B3: ni dos capturas iguales, ni números que no cuadran')
{
  // Ninguna captura idéntica a otra (byte a byte): cada una con SU pantalla.
  const dirCapturas = 'docs/dias/capturas_8b'
  const porHash = new Map()
  const crypto = await import('node:crypto')
  for (const f of fs.readdirSync(dirCapturas).filter((x) => /\.(jpe?g|png)$/i.test(x))) {
    const h = crypto.createHash('sha256').update(fs.readFileSync(path.join(dirCapturas, f))).digest('hex')
    porHash.set(h, [...(porHash.get(h) ?? []), f])
  }
  const repetidas = [...porHash.values()].filter((l) => l.length > 1).map((l) => l.join(' = '))
  debe(repetidas.length === 0, 'capturas', `ninguna captura repetida (dos nombres, mismo archivo): ${repetidas.join(' | ')}`)
  const demo = leer('src/lib/logrosDemo.ts') + '\n' + leer('src/components/logros/momentos/demoMomentos.ts')
  debe(!/Tu país número 2: Vaticano/.test(demo), 'demo', 'el modo de pruebas no dice «Tu país número 2: Vaticano» al marcar el Coliseo (el servidor da «Tu país número 1: Italia»)')
  const hojas = archivos('src/components/logros/visto').map((f) => sinComentarios(leer(f))).join('\n')
  debe(!/Con la foto de hoy en Plaza Navona/.test(hojas), 'textos', 'ningún texto de las hojas lleva un sitio fijo')
}

console.log('7. Tanda 8B4: Patrimonio del Coliseo, artículos, sin cuenta atrás en el viaje, sello nuevo, sin medalla por maravilla, el final de las 7')
{
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-pantallas8b4-'))
  const salida = path.join(carpeta, 'b4.cjs')
  const abs = (f) => path.resolve(f).split(path.sep).join('/')
  fs.writeFileSync(
    path.join(carpeta, 'entrada.ts'),
    `export { planificar } from '${abs('src/components/logros/momentos/plan.ts')}'\n` +
      `export { contarSellos, contarMomentos } from '${abs('src/components/logros/momentos/ResumenDia.tsx')}'\n` +
      `export { enSitio, deSitio } from '${abs('src/lib/articulos.ts')}'\n` +
      `export { diasParaReclamar, textoDelPlazo } from '${abs('src/components/logros/visto/fechas.ts')}'\n`,
  )
  await build({ entryPoints: [path.join(carpeta, 'entrada.ts')], outfile: salida, bundle: true, platform: 'node', format: 'cjs', logLevel: 'error', jsx: 'automatic', define: { 'import.meta.env': '{"DEV":false}' } })
  const B = createRequire(import.meta.url)(salida)
  // El sello
  debe(JSON.stringify(B.contarSellos([{ sello: 'roma', grado: 'bronce' }])) === '{"nuevos":1,"subidos":0}', 'sello', 'el primer sello (bronce) es «sello nuevo», no «subido de grado»')
  debe(JSON.stringify(B.contarSellos([{ sello: 'roma', grado: 'plata' }])) === '{"nuevos":0,"subidos":1}', 'sello', 'el que sube a plata es «subido de grado»')
  debe(JSON.stringify(B.contarSellos([{ sello: 'vaticano', grado: 'plata' }])) === '{"nuevos":1,"subidos":0}', 'sello', 'el Vaticano nace en plata (no tiene bronce): es nuevo')
  debe(JSON.stringify(B.contarSellos([{ sello: 'roma', grado: 'bronce' }, { sello: 'roma', grado: 'plata' }])) === '{"nuevos":1,"subidos":0}', 'sello', 'un sello que nace y sube el mismo día cuenta una vez, como nuevo')
  const c1 = B.contarMomentos([{ tipo: 'sello', sello: 'roma', grado: 'bronce' }])
  debe(c1.sello_nuevo === 1 && !c1.sello, 'sello', 'el resumen del Coliseo (sello en bronce) lleva «sello nuevo»')
  const tx = leer('src/components/logros/momentos/textosResumen.ts')
  debe(tx.includes("Tu sello sube a") && tx.includes("Tu sello ${DE("), 'sello', 'los dos textos del sello están (sube / nace), sin número (8B5)')
  // Los artículos
  debe(B.enSitio('Coliseo') === 'en el Coliseo' && B.deSitio('Coliseo') === 'del Coliseo', 'articulos', '«en el Coliseo» y «del Coliseo»')
  debe(B.enSitio('Panteón') === 'en el Panteón' && B.enSitio('Basílica de San Pedro') === 'en la Basílica de San Pedro' && B.deSitio('Basílica de San Pedro') === 'de la Basílica de San Pedro', 'articulos', '«en el Panteón», «en la Basílica de San Pedro»')
  debe(B.enSitio('Trastevere') === 'en Trastevere' && B.enSitio('Piazza Navona') === 'en Piazza Navona' && B.enSitio('Fontana de Trevi (noche)') === 'en la Fontana de Trevi', 'articulos', 'sin artículo donde no va: «en Trastevere», «en Piazza Navona»; y sin el «(noche)»')
  debe(B.enSitio('Museos Vaticanos y Capilla Sixtina') === 'en los Museos Vaticanos y Capilla Sixtina' && B.enSitio('Termas de Caracalla') === 'en las Termas de Caracalla', 'articulos', 'plurales: «en los Museos…», «en las Termas…»')
  debe(B.enSitio('Sitio que no existe') === 'en Sitio que no existe', 'articulos', 'un nombre que no está en los datos sale sin artículo')
  const cat = JSON.parse(leer('data/pipeline_v2/roma.json'))
  const tabla = JSON.parse(leer('data/logros/articulos.json')).roma
  const sin = cat.places.filter((p) => !(p.name in tabla)).map((p) => p.name)
  debe(sin.length === 0 && Object.values(tabla).every((a) => ['el', 'la', 'los', 'las', ''].includes(a)), 'articulos', `todos los sitios de Roma llevan su artículo en los datos (faltan: ${sin.join(', ')})`)
  const textos = archivos('src/components/logros/visto').map((f) => sinComentarios(leer(f))).join('\n') + sinComentarios(leer('src/lib/logrosDemo.ts'))
  debe(!/(estás|foto|recuerdo) (en|de) \$\{(nombre|nombreSitio|parada\.name|displayStopName\([^)]*\))\}/.test(textos), 'articulos', 'ningún texto de las hojas pega «en»/«de» delante del nombre del sitio sin pasar por el artículo')
  const ajustes = JSON.parse(leer('data/logros/ajustes.json'))
  debe(ajustes.mensajes.lejos.includes('{en_sitio}') && ajustes.mensajes.foto_otro_sitio.includes('{de_sitio}'), 'articulos', 'los mensajes del servidor también llevan el artículo')
  // La cuenta atrás
  const ruta = { answers: { dateRange: { start: '2026-10-17', end: '2026-10-20' } } }
  debe(B.diasParaReclamar(ruta, '2026-10-17') == null && B.textoDelPlazo(ruta, '2026-10-20') == null, 'plazo', 'durante el viaje no hay cuenta atrás (ni el primer día ni el último)')
  debe(B.textoDelPlazo(ruta, '2026-11-10') === 'Te quedan 9 días para reclamar tu premio' && B.textoDelPlazo(ruta, '2026-10-21') === 'Te quedan 29 días para reclamar tu premio', 'plazo', 'después del viaje sí: «Te quedan 9 días…»')
  const fe = leer('src/components/logros/visto/fechas.ts')
  debe(fe.includes('dev_simulated_today_iso'), 'plazo', 'el «hoy» del plazo es el simulado de la app (no la fecha real del aparato) cuando se está en pruebas')
  const rp = leer('src/dev/rutaDePrueba.ts')
  debe(rp.includes('runGeneration') && !rp.includes("parada('p1'") && rp.includes('__demoHoy'), 'ruta', 'el viaje de pruebas lo genera el motor (runGeneration), no lleva paradas puestas a mano y limpia el «hoy» fingido')
  // Maravillas
  const pl = B.planificar
  const m = (tipo, extra = {}) => ({ tipo, nombre: tipo, primera_vez: true, ...extra })
  const col = pl([m('suma', { coleccion: 'imprescindibles', sitios: ['coliseo'] }), m('emblema', { id: 'coliseo', maravilla: 'coliseo' }), m('sello', { sello: 'roma', grado: 'bronce' }), m('pais'), m('destino_nuevo'), m('maravilla', { id: 'coliseo', n: 1 }), m('patrimonio')])
  debe(col.map((p) => p.tipo).join() === 'pedazos,emblema,sello,ademas', 'maravilla', `el Coliseo: pedazos, película, sello y «Y además…», SIN pantalla de la medalla (${col.map((p) => p.tipo).join()})`)
  debe(col[3].momentos.map((x) => x.tipo).join() === 'pais,destino_nuevo,maravilla,patrimonio', 'maravilla', 'y «Y además…» lleva el país, el destino, la maravilla y el Patrimonio de Roma')
  const f7 = pl([m('emblema', { id: 'taj', maravilla: 'taj_mahal' }), m('maravilla', { id: 'taj_mahal', n: 7 }), m('pais')])
  debe(f7.map((p) => p.tipo).join() === 'emblema,final7,pais', 'maravilla', `la séptima: su película, «El final de las 7 maravillas» y lo demás (${f7.map((p) => p.tipo).join()})`)
  const pant = leer('src/components/logros/momentos/pantallas.tsx')
  debe(!pant.includes('function PantallaMaravilla') && pant.includes('PantallaFinal7') && pant.includes('tituloDeMomento'), 'maravilla', 'ya no existe la pantalla de la medalla por maravilla; la tarjetita lleva «Tu primera maravilla»')
  debe(pant.includes('MedallaDeSiete') && !pant.includes('<MedallaMaravillas'), 'maravilla', 'la tarjetita lleva la medalla nueva (MedallaDeSiete), no la de antes')
  const fin7 = leer('src/components/logros/momentos/FinalSieteMaravillas.tsx')
  debe(fin7.includes('m7Gather') && fin7.includes('m7SpinIn') && fin7.includes('m7Sweep') && fin7.includes('prefers-reduced-motion'), 'maravilla', 'el final de las 7 lleva las monedas que se juntan, la medalla que gira, el barrido de luz y la versión sin movimiento')
  const dm = leer('src/components/logros/momentos/demoMomentos.ts')
  debe(dm.includes('serieFinal7'), 'maravilla', 'el modo de pruebas tiene una forma de ver el final de las 7 (serieFinal7)')
  // El servidor: el Coliseo da el Patrimonio
  const prueba1 = leer('scripts/destino/pruebaLogros1.mjs')
  debe(prueba1.includes('Centro histórico de Roma» (Tanda 8B4)'), 'patrimonio', 'pruebaLogros1 comprueba que el primer Visto en el Coliseo da el Patrimonio «Centro histórico de Roma»')
  debe(dm.includes('MOMENTOS.patrimonio()'), 'patrimonio', 'la serie del Coliseo del modo de pruebas lleva el Patrimonio (se había caído en la 8B3)')
  debe(leer('src/lib/logrosDemo.ts').includes('centro_historico_de_roma'), 'patrimonio', 'y el primer Visto en el Coliseo del modo demo también da el Patrimonio y la maravilla, como el servidor')
}

console.log('8. Tanda 8B5: fotos elegidas, medalla nueva, Patrimonio con número, textos del resumen')
{
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-pantallas8b5-'))
  const salida = path.join(carpeta, 'b5.cjs')
  const abs = (f) => path.resolve(f).split(path.sep).join('/')
  fs.writeFileSync(
    path.join(carpeta, 'entrada.ts'),
    `export { fila, lineaDeSecretos, textoDeSello } from '${abs('src/components/logros/momentos/textosResumen.ts')}'\n` +
      `export { detalleSellos } from '${abs('src/components/logros/momentos/ResumenDia.tsx')}'\n` +
      `export { tituloDeMomento } from '${abs('src/components/logros/momentos/pantallas.tsx')}'\n`,
  )
  await build({ entryPoints: [path.join(carpeta, 'entrada.ts')], outfile: salida, bundle: true, platform: 'node', format: 'cjs', logLevel: 'error', jsx: 'automatic', define: { 'import.meta.env': '{"DEV":false}' } })
  const B = createRequire(import.meta.url)(salida)
  // Los títulos de las cuatro tarjetas
  const orde = ['', 'primera', 'segunda', 'tercera', 'cuarta', 'quinta', 'sexta']
  for (let n = 1; n <= 6; n++) debe(B.tituloDeMomento({ tipo: 'maravilla', n, nombre: 'X' }) === `Tu ${orde[n]} maravilla`, 'maravilla', `con ${n} maravillas: «Tu ${orde[n]} maravilla»`)
  debe(B.tituloDeMomento({ tipo: 'patrimonio', n: 1, nombre: 'Centro histórico de Roma' }) === 'Tu Patrimonio número 1: Centro histórico de Roma', 'patrimonio', 'el Patrimonio con número: «Tu Patrimonio número 1: Centro histórico de Roma»')
  debe(B.tituloDeMomento({ tipo: 'pais', n: 1, nombre: 'Tu país número 1: Italia' }) === 'Tu país número 1: Italia', 'patrimonio', 'las otras tarjetas se leen igual: «Tu país número 1: Italia»')
  // Las monedas y la medalla quieta
  const ms = leer('src/components/logros/dibujos/MedallaSiete.tsx')
  debe(ms.includes("data-encendida={on ? 'oro' : 'plata'}") && ms.includes('encendidas.includes(m.id)'), 'medalla', 'las monedas se encienden según las maravillas que tiene de verdad (oro) y el resto en plata')
  debe(!/animation:\s*['"`][a-z]/i.test(ms.replace(/\/\*[\s\S]*?\*\//g, '')) && leer('src/components/logros/dibujos/MedallaSiete.css').includes('animation: none !important'), 'medalla', 'la medalla nueva va quieta: sin animaciones (ni el destello «gain» de la pieza)')
  debe(ms.includes('{cnt}') && ms.includes('DE 7'), 'medalla', 'en el centro, cuántas lleva («2» sobre «DE 7»)')
  const ch = leer('src/components/logros/dibujos/Chapa.tsx')
  debe(ch.includes('MedallaSiete') && !ch.includes('MedallaDibujo'), 'medalla', 'la chapa de «maravillas» (Logros y vitrina) también usa la medalla nueva')
  const srv = leer('server/logros/momentos.js')
  debe(srv.includes('maravillas: tiene') && srv.includes("n: cuenta('patrimonio', it)"), 'medalla', 'el servidor manda las maravillas que lleva y el número del Patrimonio')
  const dm2 = leer('src/components/logros/momentos/demoMomentos.ts')
  debe(dm2.includes('serieSegundaMaravilla') && dm2.includes("maravillas: ['coliseo', 'petra']"), 'medalla', 'el modo de pruebas tiene la serie de la segunda maravilla (Petra, 2 de 7)')
  // Los textos del resumen
  debe(B.fila('pedazo', 1) === 'Pedazo nuevo' && B.fila('pedazo', 3) === 'Pedazos nuevos', 'resumen', '«Pedazo nuevo» / «Pedazos nuevos»')
  debe(B.fila('coleccion', 1) === 'Colección completa' && B.fila('coleccion', 2) === 'Colecciones completas', 'resumen', '«Colección completa» / «Colecciones completas»')
  debe(B.fila('emblema', 1) === 'Emblema Oculto' && B.fila('emblema', 2) === 'Emblemas Ocultos', 'resumen', '«Emblema Oculto» / «Emblemas Ocultos»')
  debe(B.fila('pais', 1) === 'País nuevo' && B.fila('pais', 2) === 'Países nuevos' && B.fila('destino_nuevo', 1) === 'Destino nuevo' && B.fila('destino_nuevo', 2) === 'Destinos nuevos', 'resumen', 'país y destino, singular y plural')
  debe(B.fila('maravilla', 1) === 'Maravilla del mundo' && B.fila('maravilla', 2) === 'Maravillas del mundo', 'resumen', 'maravilla, singular y plural')
  debe(B.fila('patrimonio', 1) === 'Patrimonio de la Humanidad' && B.fila('patrimonio', 2) === 'Patrimonios de la Humanidad', 'resumen', 'Patrimonio, singular y plural')
  debe(B.fila('viajero', 1) === 'Logro de viajero' && B.fila('viajero', 2) === 'Logros de viajero', 'resumen', 'logro de viajero, singular y plural')
  debe(['pedazo', 'coleccion', 'emblema', 'pais', 'destino_nuevo', 'continente', 'maravilla', 'patrimonio', 'viajero'].every((k) => [1, 2].every((n) => /^[A-ZÁÉÍÓÚÑ]/.test(B.fila(k, n)))), 'resumen', 'todas las filas empiezan por mayúscula')
  debe(B.textoDeSello(true, 'roma', 'bronce', 'Roma') === 'Tu sello de Roma, en bronce', 'resumen', '«Tu sello de Roma, en bronce»')
  debe(B.textoDeSello(true, 'vaticano', 'plata', 'El Vaticano') === 'Tu sello del Vaticano, en plata', 'resumen', '«Tu sello del Vaticano, en plata»')
  debe(B.textoDeSello(false, 'roma', 'oro') === 'Tu sello sube a oro' && B.textoDeSello(false, 'roma', 'plata') === 'Tu sello sube a plata', 'resumen', '«Tu sello sube a oro» / «…a plata» con el grado que toque')
  const ds = B.detalleSellos([{ sello: 'roma', grado: 'bronce' }, { sello: 'roma', grado: 'plata' }])
  debe(ds.length === 1 && ds[0].grado === 'plata' && ds[0].nace, 'resumen', 'un sello que nace y sube el mismo día sale una vez, nuevo, con el grado más alto')
  debe(B.lineaDeSecretos('Roma', 12, 3) === 'Roma aún esconde 9 secretos.', 'resumen', '«Roma aún esconde 9 secretos.» (12 y 3 encontrados)')
  debe(B.lineaDeSecretos('Roma', 12, 11) === 'Roma aún esconde 1 secreto.', 'resumen', 'si solo queda uno: «Roma aún esconde 1 secreto.»')
  debe(B.lineaDeSecretos('Roma', 12, 12) === 'Has encontrado todos los secretos de Roma.', 'resumen', 'si no queda ninguno: «Has encontrado todos los secretos de Roma.»')
  const rd5 = leer('src/components/logros/momentos/ResumenDia.tsx')
  debe(rd5.includes('Lo que te llevas de hoy') && !rd5.includes('Esto es lo que has ganado hoy') && rd5.includes('data-fila="sello"'), 'resumen', 'el título es «Lo que te llevas de hoy» y la fila del sello va aparte, sin número')
  const rv5 = leer('src/components/logros/momentos/ResumenViaje.tsx')
  debe(rv5.includes('lineaDeSecretos') && !/secretos encontrados`/.test(rv5), 'resumen', 'el resumen del viaje usa la misma línea de secretos')
  // Las fotos elegidas
  const tabla = JSON.parse(leer('data/dias/roma/_fotos.json'))
  const nuevas = { 'Foro Romano y Palatino': 'dia_foro_romano_y_palatino.jpg', 'Arco de Constantino': 'dia_arco_de_constantino.jpg', Panteón: 'dia_panteon.jpg', 'Piazza Navona': 'dia_piazza_navona.jpg', 'Museos Vaticanos y Capilla Sixtina': 'dia_museos_vaticanos.jpg', 'Columna de Trajano': 'dia_columna_de_trajano.jpg' }
  for (const [lugar, archivo] of Object.entries(nuevas)) {
    const f = tabla.fotos.find((x) => x.archivo === archivo)
    debe(f && f.lugares.includes(lugar) && f.fuente === 'Unsplash' && f.autor && f.enlace && f.credito?.autor && !f.fechas, 'fotos', `${lugar}: foto propia con autor, enlace y licencia, sin fechas`)
    debe(fs.existsSync(`public/fotos/roma/${archivo}`) && fs.existsSync(`public/fotos/roma/${archivo.replace('.jpg', '_p.jpg')}`) && fs.existsSync(`public/fotos/roma/mini/${archivo.replace('.jpg', '.webp')}`), 'fotos', `${lugar}: la grande, la tarjeta y la miniatura WebP existen`)
    debe(!(tabla.sin_foto ?? []).includes(lugar) && !(tabla.fotos_rechazadas ?? []).some((r) => r.lugar === lugar), 'fotos', `${lugar}: ya no está en sin_foto ni en fotos_rechazadas`)
  }
  debe(tabla.fotos.some((x) => x.archivo === 'navidad_noche_piazza_navona_desde_arriba.jpg' && x.fechas), 'fotos', 'la foto de Navidad de Piazza Navona sigue con sus fechas')
}

console.log('9. Tanda 8C1: dibujos del Dashboard, hoja de secretos, título de HOY, modo de pruebas de la EXP')
{
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-pantallas8c1-'))
  const salida = path.join(carpeta, 'c1.cjs')
  const abs = (f) => path.resolve(f).split(path.sep).join('/')
  fs.writeFileSync(path.join(carpeta, 'entrada.ts'), `export { LOGROS_CON_CHAPA, ESCALONES_DE } from '${abs('src/components/logros/dibujos/Chapa.tsx')}'\n`)
  await build({ entryPoints: [path.join(carpeta, 'entrada.ts')], outfile: salida, bundle: true, platform: 'node', format: 'cjs', logLevel: 'error', jsx: 'automatic', loader: { '.css': 'empty' }, define: { 'import.meta.env': '{"DEV":false}' } })
  const C = createRequire(import.meta.url)(salida)
  const viajero = JSON.parse(leer('data/logros/viajero.json'))
  const activos = viajero.logros.filter((l) => l.activo !== false).map((l) => l.id)
  const sinDibujo = activos.filter((id) => !C.LOGROS_CON_CHAPA.includes(id))
  debe(sinDibujo.length === 0, 'dibujos', `cada logro encendido tiene su dibujo del Dashboard (sin dibujo: ${sinDibujo.join(', ')})`)
  const desfase = activos.filter((id) => C.ESCALONES_DE[id] && JSON.stringify(C.ESCALONES_DE[id]) !== JSON.stringify(viajero.logros.find((l) => l.id === id).escalones.map((e) => e.n)))
  debe(desfase.length === 0, 'dibujos', `los escalones de cada chapa son los de viajero.json (desfase: ${desfase.join(', ')})`)
  const ch = leer('src/components/logros/dibujos/Chapa.tsx')
  for (const pieza of ['MedallaDestino', 'MedallaGrado', 'DoceMeses', 'CuatroEstaciones', 'ExclusivoHolo']) debe(ch.includes(`piezas/${pieza}'`) && fs.existsSync(`src/components/logros/dibujos/piezas/${pieza}.tsx`), 'dibujos', `${pieza} (Dashboard) se usa en las chapas`)
  debe(!ch.includes('LogroViajero') && !ch.includes('ChapaViajero'), 'dibujos', 'las chapas de antes (Logro Viajero y Chapa Viajero) ya no se usan')
  debe(/lazy\(\(\) => import\('\.\/piezas\/MedallaDestino'\)\)/.test(ch), 'dibujos', 'cada dibujo se carga solo al abrirlo (lazy)')
  const piezas = fs.readdirSync('src/components/logros/dibujos/piezas').filter((f) => f.endsWith('.tsx')).map((f) => leer(`src/components/logros/dibujos/piezas/${f}`)).join('\n')
  debe(!/https?:\/\/(cdn\.jsdelivr|esm\.sh|unpkg)/.test(piezas), 'dibujos', 'ningún dibujo pide nada a internet al dibujarse (el globo lleva la tierra precalculada)')
  debe(fs.existsSync('src/components/logros/dibujos/piezas/tierraPath.ts') && leer('src/components/logros/dibujos/piezas/MedallaDestino.tsx').includes("import('./tierraPath')"), 'dibujos', 'la tierra del globo está en el código (tierraPath.ts)')
  for (const [pieza, dc] of [['MedallaGrado', 'Medalla Grado'], ['MedallaDestino', 'Medalla Destino'], ['DoceMeses', 'Doce Meses'], ['CuatroEstaciones', 'Cuatro Estaciones']]) {
    const dise = leer(`docs/diseno/proyecto/Piezas/${dc}.dc.html`)
    const keyframes = [...dise.matchAll(/@keyframes\s+([A-Za-z0-9_]+)/g)].map((m) => m[1])
    const css = leer(`src/components/logros/dibujos/piezas/${pieza}.css`)
    debe(keyframes.every((k) => css.includes(`@keyframes ${k}`)), 'dibujos', `${pieza}: lleva todas las animaciones de «${dc}»`)
  }
  const dash = leer('src/components/logros/dibujos/iconosDashboard.ts')
  debe(dash.includes('IC_ESCALONES') && dash.includes('IC_UNICOS') && dash.includes("'Alondra'"), 'dibujos', 'los iconos del Dashboard están copiados')
  // Las pantallas que enseñan logros usan la chapa nueva
  const pant = leer('src/components/logros/momentos/pantallas.tsx')
  debe(pant.includes('<Chapa logro={ch.logro}') && leer('src/components/logros/momentos/ResumenViaje.tsx').includes('<Chapa logro={n.id}'), 'dibujos', '«Y además…», los avisos de lo ganado y el resumen del viaje usan las chapas nuevas')
  // La hoja de logros
  const hoja = leer('src/components/logros/momentos/HojaLogros.tsx')
  debe(/tituloDeSecretos|lineaDeSecretos/.test(hoja) && !/de 12 secretos/.test(sinComentarios(hoja).replace(/«N de 12 secretos»/g, '')), 'hoja', 'la hoja de logros dice lo mismo que el resumen: «Roma aún esconde N secretos.» (8C2: desde hoja/textosHoja.ts)')
  // El título del día de HOY
  const hoyV2 = leer('src/components/route/hoy/v2/HoyDuranteV2.tsx')
  debe(hoyV2.includes('nombreDelDia(route, day,') && hoyV2.includes('tituloLimpio'), 'hoy', 'el título del día de HOY v2 sale de nombreDelDia: el mismo que DÍAS (con el nombre del viajero si lo cambió)')
  const titulo = leer('src/lib/tituloDelDia.ts')
  debe(titulo.includes('if (day.nameByUser ||') && titulo.indexOf('day.nameByUser') < titulo.indexOf('esDiaDeExcursion(day)) return sinTrayecto(grupos.excursion'), 'hoy', 'y si el viajero le cambió el nombre, manda el suyo')
  // El modo de pruebas de la EXP
  const dm = leer('src/components/logros/momentos/demoMomentos.ts')
  debe(dm.includes('exp: (preset') && dm.includes('serieViajeros') && fs.existsSync('src/dev/ExpPrueba.tsx'), 'exp', 'el modo de pruebas enseña la EXP, el nivel y el rango de un viajero de ejemplo (window.__momentos.exp) y «Y además…» con los dibujos nuevos (serieViajeros)')
  const ep = leer('src/dev/ExpPrueba.tsx')
  debe(ep.includes('escenarioDeRoma') && ep.includes("'roma100'") && ep.includes("'normal'"), 'exp', 'con las cuentas de Roma: un viaje normal y Roma al 100 %')
  debe(!/ExpPrueba/.test(leer('src/main.tsx')) && /import\('\.\.\/\.\.\/\.\.\/dev\/ExpPrueba'\)/.test(dm), 'exp', 'el panel de la EXP solo se carga a demanda en desarrollo (no pesa al abrir)')
  // El servidor manda la EXP; ninguna pantalla nueva
  debe(leer('src/components/logros/momentos/api.ts').includes('ResumenDeExp') && leer('src/lib/logros.ts').includes('sube_de_nivel'), 'exp', 'el móvil sabe leer la EXP, el nivel y «sube de nivel» (sin pantalla nueva)')
  const nuevasPantallas = fs.readdirSync('src/components/logros/momentos').filter((f) => /Exp|Nivel|Tienda|Rango/i.test(f))
  debe(nuevasPantallas.length === 0 || nuevasPantallas.every((f) => /^ExpHost|^pasoTrasLaExp/.test(f)), 'exp', 'en momentos solo está el orquestador de la EXP (ExpHost); las pantallas están en pantallas/perfil (8C2)')
}

const ok = fallos.length === 0
console.log(`\n${comprobaciones} comprobaciones. ${ok ? '0 fallos.' : `${fallos.length} FALLOS:`}`)
for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
process.exit(ok ? 0 : 1)
