// La prueba de la parte de la app de los logros (Tanda 8A): el interruptor, instalar la web, los sonidos y lo que no puede romper. No toca el motor de rutas.
//   node scripts/destino/pruebaLogros2.mjs
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { build } from 'esbuild'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

console.log('1. El interruptor, instalar la web y los sonidos')
{
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-logros2-'))
  const salida = path.join(carpeta, 'app.cjs')
  const abs = (f) => path.resolve(f).split(path.sep).join('/')
  fs.writeFileSync(
    path.join(carpeta, 'entrada.ts'),
    `export { calcularLogrosActivos } from '${abs('src/lib/logros.ts')}'\n` +
      `export { plataformaDe, debeEnseñarAvisoDeInstalar, pasosParaInstalar } from '${abs('src/lib/instalar.ts')}'\n` +
      `export { sonidoDeMomentos } from '${abs('src/lib/sonidos.ts')}'\n` +
      `export { viajesQueSePisan, separarViajes, estaGuardadoAparte } from '${abs('src/lib/viajesQueSePisan.ts')}'\n` +
      `export { urlMiniatura } from '${abs('src/lib/miniatura.ts')}'\n`,
  )
  await build({ entryPoints: [path.join(carpeta, 'entrada.ts')], outfile: salida, bundle: true, platform: 'node', format: 'cjs', logLevel: 'error', define: { 'import.meta.env': '{"DEV":false}' } })
  const A = createRequire(import.meta.url)(salida)
  const c = A.calcularLogrosActivos
  debe(c({ desarrollo: false, entorno: undefined, cuentas: true }) === false && c({ desarrollo: false, entorno: 'true', cuentas: true }) === true, 'app', 'los logros: apagados salvo VITE_LOGROS_ACTIVOS=true')
  debe(c({ desarrollo: false, entorno: 'true', cuentas: false }) === false && c({ desarrollo: true, parametro: 'on', cuentas: false }) === false, 'app', 'sin las cuentas encendidas, los logros no se encienden nunca')
  debe(c({ desarrollo: true, parametro: 'on', cuentas: true }) === true && c({ desarrollo: true, entorno: 'true', parametro: 'off', cuentas: true }) === false && c({ desarrollo: false, parametro: 'on', cuentas: true }) === false, 'app', 'en desarrollo vale ?logros=on y off; en producción la dirección no enciende nada')
  debe(A.plataformaDe('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)') === 'ios' && A.plataformaDe('Mozilla/5.0 (Linux; Android 14; Pixel 8)') === 'android' && A.plataformaDe('Mozilla/5.0 (Windows NT 10.0)') === 'otra' && A.plataformaDe('Mozilla/5.0 (Macintosh; Intel Mac OS X)', 5) === 'ios', 'instalar', 'iPhone, iPad nuevo, Android y ordenador')
  debe(A.debeEnseñarAvisoDeInstalar({ instalada: false, yaMostrado: false, plataforma: 'ios' }) === true && A.debeEnseñarAvisoDeInstalar({ instalada: true, yaMostrado: false, plataforma: 'ios' }) === false && A.debeEnseñarAvisoDeInstalar({ instalada: false, yaMostrado: true, plataforma: 'android' }) === false && A.debeEnseñarAvisoDeInstalar({ instalada: false, yaMostrado: false, plataforma: 'otra' }) === false, 'instalar', 'el aviso sale una vez, no si ya está instalada y solo en un móvil')
  debe(A.pasosParaInstalar('ios', 'Routy', false).length === 3 && A.pasosParaInstalar('android', 'Routy', true).length === 1 && A.pasosParaInstalar('android', 'Routy', false).length === 3 && A.pasosParaInstalar('ios', 'Routy', false)[0].includes('Compartir'), 'instalar', 'cómo hacerlo en iPhone y en Android (con el aviso del navegador, un paso)')
  debe(A.sonidoDeMomentos(['suma', 'emblema', 'pais']) === 'emblema' && A.sonidoDeMomentos(['suma']) === 'pedazo' && A.sonidoDeMomentos([]) === null && A.sonidoDeMomentos(['maravilla', 'emblema']) === 'maravilla', 'sonidos', 'cuando se gana mucho de golpe suena lo más importante')

  const marca = JSON.parse(leer('data/marca.json'))
  debe(marca.nombre && marca.nombre_corto && marca.color_tema && marca.iconos.length >= 3 && marca.iconos.every((i) => fs.existsSync('public' + i.src)) && fs.existsSync('public' + marca.icono_apple), 'instalar', 'el nombre y los colores salen de data/marca.json, y sus iconos existen')
  const codigo = sinComentarios(['src/components/logros/AvisoInstalar.tsx', 'src/lib/instalar.ts', 'server/index.js'].map(leer).join('\n'))
  debe(!/['"]Routy['"]/.test(codigo), 'instalar', 'el nombre de la app no está escrito en el código: solo en data/marca.json')
  debe(/api\/manifest\.webmanifest/.test(leer('server/index.js')) && /manifest/.test(leer('src/lib/instalar.ts')), 'instalar', 'el manifiesto lo da el servidor, con lo de data/marca.json')
  const sw = sinComentarios(leer('public/sw.js'))
  debe(!/caches\.|cache\.put|respondWith|addAll/.test(sw) && /skipWaiting/.test(sw) && /addEventListener\('fetch'/.test(sw), 'instalar', 'el service worker es mínimo: no guarda ninguna respuesta del servidor (sin modo sin conexión)')

  const lista = JSON.parse(leer('public/sonidos/sonidos.json'))
  const momentos = ['visto', 'pedazo', 'coleccion', 'emblema', 'sello', 'pais', 'maravilla', 'patrimonio', 'viajero', 'dia_completo']
  debe(momentos.every((m) => lista.sonidos[m] && fs.existsSync('public' + lista.sonidos[m])), 'sonidos', 'hay un sonido para cada momento')
  let peso = 0
  let duracionesBien = true
  for (const m of momentos) {
    const w = fs.readFileSync('public' + lista.sonidos[m])
    peso += w.length
    const segundos = w.readUInt32LE(40) / w.readUInt32LE(28)
    if (segundos < 0.95 || segundos > 3) duracionesBien = false
  }
  debe(duracionesBien && lista.maximo_segundos === 3, 'sonidos', 'todos duran de 1 a 3 segundos')
  debe(peso < 200 * 1024, 'sonidos', `los sonidos provisionales son ligeros (${Math.round(peso / 1024)} KB en total) y se cargan al hacer falta`)
  const sonidos = leer('src/lib/sonidos.ts')
  debe(/ponerSonido/.test(sonidos) && /audioSession/.test(sonidos) && /navigator\.vibrate/.test(sonidos), 'sonidos', 'hay un ajuste para quitar el sonido, respeta el modo silencio donde se puede y vibra donde el móvil lo deja')
  debe(!/import .*sonidos|new Audio\(/.test(leer('src/main.tsx')) && /fetch\(url\)/.test(sonidos), 'peso', 'los sonidos no se cargan al abrir la app, sino al hacer falta')
}

console.log('1b. «Sustituir el anterior» no borra')
{
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-logros2b-'))
  const abs = (f) => path.resolve(f).split(path.sep).join('/')
  fs.writeFileSync(path.join(carpeta, 'entrada.ts'), `export { viajesQueSePisan, separarViajes, estaGuardadoAparte } from '${abs('src/lib/viajesQueSePisan.ts')}'\nexport { urlMiniatura } from '${abs('src/lib/miniatura.ts')}'\n`)
  const salida = path.join(carpeta, 'b.cjs')
  await build({ entryPoints: [path.join(carpeta, 'entrada.ts')], outfile: salida, bundle: true, platform: 'node', format: 'cjs', logLevel: 'error', define: { 'import.meta.env': '{"DEV":false}' } })
  const B = createRequire(import.meta.url)(salida)
  const viaje = (id, destination, start, end, extra = {}) => ({ id, route: { destination, answers: { dateRange: { start, end } } }, ...extra })
  const existentes = [
    viaje('a', 'Roma', '2026-10-10', '2026-10-14'),
    viaje('b', 'Roma', '2026-12-01', '2026-12-03'),
    viaje('c', 'Florencia', '2026-10-12', '2026-10-13'),
    viaje('d', 'roma', '2026-10-14', '2026-10-16', { guardadoEn: '2026-10-01T00:00:00Z' }),
    viaje('e', 'Roma', '2026-10-11', '2026-10-12', { esInvitado: true }),
  ]
  const pisan = B.viajesQueSePisan({ destino: 'Roma', inicio: '2026-10-14', fin: '2026-10-18' }, existentes).map((v) => v.id)
  debe(pisan.join() === 'a', 'sustituir', `se pisan los del mismo destino con fechas que se tocan (también el último día): ${pisan.join()}`)
  debe(B.viajesQueSePisan({ destino: 'Roma', inicio: '2026-11-01', fin: '2026-11-05' }, existentes).length === 0, 'sustituir', 'fechas que no se tocan: no se pisan')
  debe(!pisan.includes('c') && !pisan.includes('d') && !pisan.includes('e'), 'sustituir', 'otro destino, uno ya guardado aparte y uno de otra persona no cuentan')
  const sep = B.separarViajes([viaje('a', 'Roma', '2026-10-10', '2026-10-14'), viaje('d', 'Roma', '2026-10-14', '2026-10-16', { guardadoEn: '2026-10-01T00:00:00Z' })])
  debe(sep.activos.map((v) => v.id).join() === 'a' && sep.guardados.map((v) => v.id).join() === 'd', 'sustituir', '«Mis viajes» y «Viajes guardados» se separan por la fecha de guardado')
  const persistencia = fs.readFileSync('src/lib/tripPersistence.ts', 'utf8')
  debe(/guardarViajeAparte/.test(persistencia) && /update\(\{ guardado_en:/.test(persistencia) && !/guardarViajeAparte[\s\S]{0,400}\.delete\(\)/.test(persistencia), 'sustituir', '«Sustituir el anterior» guarda aparte (fecha de guardado): el viaje de antes no se borra')
  debe(/guardado_en/.test(persistencia) && /conInvitados \? 'id, traveler_id, guardado_en/.test(persistencia), 'sustituir', 'la lista de viajes lee la fecha de guardado solo con las cuentas encendidas (apagadas, la consulta es la de siempre)')
  debe(/alter table public\.trips add column if not exists guardado_en/.test(fs.readFileSync('supabase/migrations/0024_prueba_pase_y_guardados.sql', 'utf8')), 'sustituir', 'el dato nuevo va en la migración 0024')

  // Las miniaturas
  debe(B.urlMiniatura('/fotos/roma/dia_ara_pacis.jpg') === '/fotos/roma/mini/dia_ara_pacis.webp' && B.urlMiniatura('/fotos/roma/dia_ara_pacis_p.jpg?v=abc') === '/fotos/roma/mini/dia_ara_pacis.webp?v=abc' && B.urlMiniatura('https://images.unsplash.com/x.jpg') === null && B.urlMiniatura(null) === null, 'miniaturas', 'la dirección de la miniatura sale de la de la foto grande o pequeña')
  const grandes = fs.readdirSync('public/fotos/roma').filter((f) => f.endsWith('.jpg') && !f.endsWith('_p.jpg'))
  const minis = fs.readdirSync('public/fotos/roma/mini').filter((f) => f.endsWith('.webp'))
  debe(minis.length === grandes.length && grandes.every((f) => minis.includes(f.replace(/\.jpg$/, '.webp'))), 'miniaturas', `cada foto propia tiene su miniatura (${minis.length} de ${grandes.length})`)
  const pesos = minis.map((f) => fs.statSync('public/fotos/roma/mini/' + f).size)
  debe(Math.max(...pesos) < 12 * 1024 && pesos.reduce((a, b) => a + b, 0) / pesos.length < 6 * 1024, 'miniaturas', `pesan pocos KB (media ${(pesos.reduce((a, b) => a + b, 0) / pesos.length / 1024).toFixed(1)} KB, la mayor ${(Math.max(...pesos) / 1024).toFixed(1)} KB)`)
  const cab = fs.readFileSync('public/fotos/roma/mini/' + minis[0]).subarray(0, 12).toString('latin1')
  debe(cab.startsWith('RIFF') && cab.endsWith('WEBP') || cab.slice(8, 12) === 'WEBP', 'miniaturas', 'son WebP de verdad')
  debe(/photo_mini/.test(fs.readFileSync('server/index.js', 'utf8')) && fs.existsSync('scripts/generarMiniaturas.mjs'), 'miniaturas', 'el servidor manda la miniatura y el script que las genera está en el repositorio')
  fs.rmSync(carpeta, { recursive: true, force: true })
}

console.log('1c. Vercel y los avisos al móvil')
{
  const vercel = JSON.parse(leer('vercel.json'))
  debe(vercel.rewrites.some((r) => r.source === '/admin/logros' && r.destination === '/index.html') && vercel.rewrites.some((r) => r.source === '/api/:path*'), 'vercel', '/admin/logros funciona en Vercel (regla de reescritura en vercel.json, que es un archivo del repositorio)')
  const paquete = JSON.parse(leer('package.json'))
  debe(Boolean(paquete.dependencies['web-push']), 'push', 'el paquete web-push está añadido')
  debe(/import\('web-push'\)/.test(leer('server/logros/avisos.js')) && /pushActivo\(env\)\) return/.test(leer('server/logros/avisos.js')), 'push', 'el paquete solo se carga cuando el envío está encendido (PUSH_ACTIVO)')
  // El script de las claves VAPID: las escribe en .env.local y no las enseña
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-vapid-'))
  const script = path.resolve('scripts/generarClavesVapid.mjs')
  const correr = (...args) => spawnSync(process.execPath, [script, ...args], { cwd: tmp, encoding: 'utf8' })
  fs.writeFileSync(path.join(tmp, '.env.local'), 'ALGO=1\n')
  const r1 = correr('--contacto=mailto:prueba@ejemplo.es')
  const env1 = fs.readFileSync(path.join(tmp, '.env.local'), 'utf8')
  const valor = (nombre, t = env1) => new RegExp('^' + nombre + '=(.+)$', 'm').exec(t)?.[1] ?? ''
  const pub = valor('VAPID_PUBLIC_KEY')
  const priv = valor('VAPID_PRIVATE_KEY')
  debe(r1.status === 0 && pub.length > 40 && priv.length > 30 && valor('VAPID_CONTACTO') === 'mailto:prueba@ejemplo.es' && /^ALGO=1$/m.test(env1), 'push', 'el script crea las claves y las escribe en .env.local sin tocar lo que había')
  debe(!(r1.stdout + r1.stderr).includes(pub) && !(r1.stdout + r1.stderr).includes(priv), 'push', 'no enseña las claves en la consola')
  const r2 = correr()
  debe(valor('VAPID_PRIVATE_KEY', fs.readFileSync(path.join(tmp, '.env.local'), 'utf8')) === priv && /no se ha cambiado nada/.test(r2.stdout), 'push', 'si ya hay claves, no las pisa')
  const r3 = correr('--forzar')
  const priv3 = valor('VAPID_PRIVATE_KEY', fs.readFileSync(path.join(tmp, '.env.local'), 'utf8'))
  debe(priv3 !== priv && !(r3.stdout + r3.stderr).includes(priv3), 'push', 'con --forzar las cambia, y tampoco las enseña')
  fs.rmSync(tmp, { recursive: true, force: true })
  // Ni .env.local ni las claves van a git
  const ignorado = spawnSync('git', ['check-ignore', '.env.local'], { encoding: 'utf8' })
  debe(ignorado.status === 0, 'push', '.env.local está ignorado por git')
  const real = fs.existsSync('.env.local') ? leer('.env.local') : ''
  const claveReal = /^VAPID_PRIVATE_KEY=(.+)$/m.exec(real)?.[1]
  if (claveReal) {
    const enGit = spawnSync('git', ['grep', '-F', '-q', '--', claveReal], { encoding: 'utf8' })
    debe(enGit.status === 1, 'push', 'la clave privada de verdad no está en ningún archivo del repositorio')
  } else debe(true, 'push', '(sin clave de verdad en este equipo)')
  debe(!/BEGIN (EC )?PRIVATE KEY/.test(leer('server/logros/avisos.js')) && !/VAPID_PRIVATE_KEY=\w{20,}/.test(leer('docs/dias/INFORME_TANDA8A.md')), 'push', 'ninguna clave en el código ni en los informes')
}

console.log('1d. El código partido: al abrir solo carga la primera pantalla')
{
  const app = leer('src/App.tsx')
  for (const pantalla of ['RouteScreen', 'MyTripsScreen', 'PreparandoViaje', 'DevQuickRouteScreen']) {
    debe(new RegExp(`const ${pantalla} = lazy\\(`).test(app) && !new RegExp(`^import \\{ ${pantalla} \\}`, 'm').test(app), 'partir', `${pantalla} se carga cuando se abre (lazy), no al abrir la app`)
  }
  debe(/<Suspense[^>]*fallback=\{<Cargando \/>\}/.test(app) && /const Cargando = \(\) => <div className="h-dvh"/.test(app), 'partir', 'mientras llega una parte, un fondo del mismo tamaño (sin pantallas en blanco que salten)')
  debe(/RouteView/.test(leer('src/components/route/RouteScreen.tsx')) && !/RouteView/.test(app.replace(/RouteScreen/g, '')), 'partir', 'RouteView (RUTA, DÍAS, EXPLORAR, RESERVAS, HOY, mapas, fichas, Perfil) está en el archivo de la ruta')
  const vite = leer('vite.config.ts')
  debe(/vendor-mapbox/.test(vite) && /vendor-pdf/.test(vite) && /vendor-react/.test(vite) && /commonjsHelpers/.test(vite), 'partir', 'las librerías grandes (mapa, PDF) van en su propio archivo y React en el suyo')
  // Lo que carga al abrir: nada de mapa, PDF, ni lo de arrastrar
  const dist = 'dist'
  if (fs.existsSync(path.join(dist, 'index.html'))) {
    const html = leer(path.join(dist, 'index.html'))
    const alAbrir = [...html.matchAll(/(?:src|href)="\/assets\/([^"]+\.js)"/g)].map((m) => m[1])
    debe(alAbrir.length >= 2 && !alAbrir.some((f) => /mapbox|pdf|dnd|RouteScreen|fechas/.test(f)), 'partir', `al abrir solo se cargan: ${alAbrir.join(', ')}`)
    const peso = alAbrir.reduce((n, f) => n + fs.statSync(path.join(dist, 'assets', f)).size, 0)
    debe(peso < 1024 * 1024, 'partir', `y pesan menos de 1 MB sin comprimir (${Math.round(peso / 1024)} KB; antes, 3.393 KB)`)
  } else debe(true, 'partir', '(sin `dist`: se mira después de `vite build`)')
}

console.log('2. Que apagado no cambia nada')
{
  const app = leer('src/App.tsx')
  const montados = leer('src/components/logros/LogrosPorVisto.tsx') + leer('src/components/logros/AvisoInstalar.tsx')
  debe(/<LogrosPorVisto \/>/.test(app) && /<AvisoInstalar \/>/.test(app) && (montados.match(/if \(!logrosActivos\(\)\) return null/g) ?? []).length === 2, 'interruptor', 'apagado, ni los hechos de los logros ni el aviso de instalar montan nada')
  const main = leer('src/main.tsx')
  debe(/logrosActivos\(\) \?/.test(main) && /parametros\.get\('admin'\) === 'logros'/.test(main) && /parametros\.get\('pruebaFotos'\)/.test(main), 'interruptor', 'el panel y la prueba de las fotos solo existen con los logros encendidos')
  const html = leer('index.html')
  debe(!/manifest|serviceWorker/.test(html), 'interruptor', 'index.html no lleva el manifiesto: se añade solo con los logros encendidos')
  const exif = leer('src/lib/logros.ts')
  debe(/logrosActivos/.test(exif) && /cuentasActivas/.test(exif), 'interruptor', 'los logros dependen de las cuentas')
  const fichas = ['src/components/logros/PruebaFotos.tsx', 'src/components/logros/AdminLogros.tsx'].map(leer).join('\n')
  debe(!/createSignedUrl|fotos-viaje|trip_photos/.test(fichas), 'admin', 'el panel y la prueba de las fotos no tocan las fotos de nadie')
  debe(/No se sube nada|NO SUBE NADA/.test(leer('src/components/logros/PruebaFotos.tsx')) && !/fetch\(|llamar\(|mandarHecho|supabase/.test(sinComentarios(leer('src/components/logros/PruebaFotos.tsx'))), 'fotos', 'la prueba de las fotos no sube nada (no llama a ningún servidor)')
  const motor = sinComentarios(['src/lib/logros.ts', 'src/lib/instalar.ts', 'src/lib/sonidos.ts', 'src/store/useLogrosStore.ts'].map(leer).join('\n'))
  debe(!/routeEngine|server\/engine/.test(motor), 'motor', 'nada de aquí toca el motor de rutas')
}

console.log(`\nLa prueba de los logros en la app: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
