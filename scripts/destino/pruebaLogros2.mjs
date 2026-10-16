// La prueba de la parte de la app de los logros (Tanda 8A): el interruptor, instalar la web, los sonidos y lo que no puede romper. No toca el motor de rutas.
//   node scripts/destino/pruebaLogros2.mjs
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
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

console.log('1. El interruptor, instalar la web y los sonidos')
{
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-logros2-'))
  const salida = path.join(carpeta, 'app.cjs')
  const abs = (f) => path.resolve(f).split(path.sep).join('/')
  fs.writeFileSync(
    path.join(carpeta, 'entrada.ts'),
    `export { calcularLogrosActivos } from '${abs('src/lib/logros.ts')}'\n` +
      `export { plataformaDe, debeEnseñarAvisoDeInstalar, pasosParaInstalar } from '${abs('src/lib/instalar.ts')}'\n` +
      `export { sonidoDeMomentos } from '${abs('src/lib/sonidos.ts')}'\n`,
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
