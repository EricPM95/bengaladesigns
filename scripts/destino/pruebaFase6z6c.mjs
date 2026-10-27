// La prueba de la Tanda 6z6c: los tips en la tarjeta de cada destino, la pastilla sin decimales, RESERVAS sin nombres de empresas, el tiempo desde nuestro servidor y la tarjeta de recuerdos.
//   node scripts/destino/pruebaFase6z6c.mjs        (con el servidor de la app encendido en http://localhost:8787)
// Da fallo si:
//   1. hay una bombilla en el mapa de RUTA, falta una por destino en su tarjeta (RouteOverview), o «Tips del viaje» sale en el Perfil o en la cabecera;
//   2. la pastilla con un importe redondo lleva decimales («+100 €»), o con uno no redondo no lleva dos («+103,13 €»);
//   3. un texto visible de RESERVAS nombra una empresa;
//   4. la app llama al proveedor del tiempo (cualquier `open-meteo` en src), o nuestro servidor no responde bien al tiempo (parámetros malos → 400; la segunda petición igual sale de caché);
//   5. «Guarda tus recuerdos» no tiene tres cuadros, la línea del mapa, [Subir mis fotos] y, con fotos, [Ver mis recuerdos]; o HOY después no usa esa misma tarjeta;
//   6. quedan los restos borrados (TripReadinessQuickPanel, N26Row, EsimRow) o el globo no sigue el ancho de la caja.
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
const leer = (p) => fs.readFileSync(p, 'utf8')
const ficheros = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) ficheros(p, acc)
    else if (/\.(tsx?|js)$/.test(e.name)) acc.push(p)
  }
  return acc
}

// ── 1. Los tips ──
console.log('Tips')
{
  const vista = leer('src/components/route/RouteView.tsx')
  ok(!/TripTipsSheet|Tips del viaje|nombre="tips"/.test(vista), '1a RouteView todavía lleva la bombilla o la hoja de tips')
  const resumen = leer('src/components/route/RouteOverview.tsx')
  ok(/TipsButton/.test(resumen) && /useDestinationTips/.test(resumen) && /<TripTipsSheet/.test(resumen), '1b RouteOverview no monta la bombilla por destino con su hoja')
  ok(resumen.indexOf('<TipsButton') > -1 && resumen.indexOf('<TipsButton') < resumen.indexOf('aria-label="Recuperar mi ruta"'), '1c la bombilla no va a la izquierda de la varita')
  const cabecera = leer('src/components/layout/Header.tsx')
  ok(!/TripTipsSheet|Tips del viaje/.test(cabecera), '1d la cabecera lleva tips')
  const perfil = ficheros('src/components/perfil').filter((p) => /Tips del viaje|TripTipsSheet/.test(leer(p)))
  ok(perfil.length === 0, `1e el Perfil lleva tips: ${perfil.join(', ')}`)
  const usos = ficheros('src').filter((p) => /<TripTipsSheet/.test(leer(p)))
  ok(usos.length === 1 && usos[0].endsWith('RouteOverview.tsx'), `1f la hoja de tips solo se monta en RouteOverview: ${usos.join(', ')}`)
}

// ── 2. La pastilla ──
console.log('Pastilla')
{
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-6z6c-'))
  const salida = path.join(carpeta, 'precioVuela.cjs')
  await build({ entryPoints: ['src/lib/precioVuela.ts'], outfile: salida, bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent', define: { 'import.meta.env.DEV': 'false' } })
  const V = require(salida)
  const eur = (amount) => ({ amount, currency: 'EUR' })
  const dia = (n) => ({ id: `d${n}`, dayNumber: n, city: 'Roma', countryCode: 'it', stops: [] })
  const ruta = { id: 'r1', destination: 'Roma', origin: 'Madrid', days: [dia(1), dia(2)], answers: { dateRange: { start: '2026-10-13', end: '2026-10-15' }, companion: 'couple' } }
  const entrada = (reservations) => ({ route: ruta, reservations, accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, rentalVehicleBooking: null, esimPrecios: {}, moneda: 'EUR', cambio: null, pago: true })
  const reserva = (id, precio) => ({ id, kind: 'entrada', refId: 'Panteon', name: 'Panteón', placeNames: ['Panteón'], dateIso: '2026-10-13', dayNumber: null, time: '12:00', precio })
  const texto = (a) => {
    const s = V.crearSeguidor()
    s.procesar(entrada([]), false)
    return s.procesar(entrada([reserva('a', eur(a))]), false).map((d) => V.textoDeDiferencia(d)).join()
  }
  ok(texto(100) === '+100 €', `importe redondo: ${texto(100)}`)
  ok(texto(103.13) === '+103,13 €', `importe no redondo: ${texto(103.13)}`)
  ok(!/,00/.test(texto(100)), '2c el redondo lleva ,00')
}

// ── 3. RESERVAS sin empresas ──
console.log('RESERVAS')
{
  const EMPRESAS = /\b(N26|Airalo|Holafly|Wise|Revolut|SafetyWing|Heymondo|IATI|Civitatis|Booking|Stay22|Rentalcars|Viator|GetYourGuide|Skyscanner|Trainline)\b/
  const archivos = [...ficheros('src/components/route/reservas'), 'src/components/route/ReservasPanel.tsx'].filter((p) => fs.existsSync(p))
  const malos = []
  for (const p of archivos) {
    leer(p).split(/\r?\n/).forEach((linea, i) => {
      const t = linea.trim()
      if (/^(\/\/|\*|\/\*|\{\/\*)/.test(t) || /https?:\/\/|^import |aria-label=\{?['"`]?[a-z]/.test(t) && !/>[^<]*\b(N26|Airalo)/.test(t)) return
      // Solo textos visibles: literales entre comillas o texto de JSX.
      const literales = [...t.matchAll(/(['"`])((?:(?!\1).)*)\1/g)].map((m) => m[2]).concat([...t.matchAll(/>([^<>{}]+)</g)].map((m) => m[1]))
      if (literales.some((x) => EMPRESAS.test(x) && /\s/.test(x.trim()))) malos.push(`${p}:${i + 1}`)
    })
  }
  ok(malos.length === 0, `3a nombres de empresas en textos de RESERVAS: ${malos.join(' ')}`)
  const util = leer('src/components/route/reservas/UtilParaElViaje.tsx')
  ok(/eSIM de datos/.test(util), '3b falta la eSIM genérica en las tarjetas')
  const acordeon = leer('src/components/route/reservas/DestinationReservasAccordion.tsx')
  ok(!/N26Row|EsimRow/.test(acordeon), '3c el acordeón de cada destino pinta N26Row o EsimRow')
}

// ── 4. El tiempo ──
console.log('Tiempo')
{
  const dentro = ficheros('src').filter((p) => /api\.open-meteo\.com/i.test(leer(p).split(/\r?\n/).filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n')))
  ok(dentro.length === 0, `4a la app llama al proveedor del tiempo: ${dentro.join(', ')}`)
  const lluvia = leer('src/lib/rainForecast.ts')
  ok(/\/api\/tiempo\/horas/.test(lluvia) && /\/api\/tiempo\/dias/.test(lluvia), '4b rainForecast no pide a nuestro servidor')
  const base = process.env.API_BASE ?? 'http://localhost:8787'
  const pide = async (ruta) => {
    try {
      const r = await fetch(base + ruta)
      return { status: r.status, cache: r.headers.get('x-tiempo-cache'), cuerpo: await r.json().catch(() => null) }
    } catch {
      return null
    }
  }
  const mas2 = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
  const mala = await pide('/api/tiempo/horas?lat=99&lng=12&fecha=' + mas2)
  ok(mala && mala.status === 400, `4c parámetros malos no dan 400: ${mala?.status}`)
  const fecha = await pide('/api/tiempo/horas?lat=41.9&lng=12.5&fecha=2026-13-45')
  ok(fecha && fecha.status === 400, `4d fecha mala no da 400: ${fecha?.status}`)
  const a = await pide('/api/tiempo/horas?lat=41.904&lng=12.496&fecha=' + mas2)
  const b = await pide('/api/tiempo/horas?lat=41.9&lng=12.5&fecha=' + mas2)
  if (a && a.status === 200) {
    ok(a.cuerpo?.ok === true && a.cuerpo.probability?.length === 24, '4e la respuesta de horas no trae 24 horas')
    ok(b && b.status === 200 && b.cache === 'HIT', `4f la segunda petición (mismas coordenadas redondeadas) no sale de caché: ${b?.cache}`)
  } else {
    // Sin red o con el proveedor caído, el servidor responde 502 sin romper; la app sigue sin tiempo.
    ok(a && a.status === 502 && a.cuerpo?.ok === false, `4e el servidor sin proveedor no responde 502 limpio: ${a?.status}`)
  }
}

// ── 5. «Guarda tus recuerdos» ──
console.log('Recuerdos')
{
  const t = leer('src/components/route/fotos/TarjetaRecuerdos.tsx')
  ok(/\[0, 1, 2\]/.test(t) && /dashed/.test(t) && /nombre="camara"/.test(t), '5a no hay tres cuadros con borde de rayas y cámara')
  ok(/en tu mapa de viajes, en tu perfil\./.test(t) && /nombresDeDestinos/.test(t) && /nombre="mapa"/.test(t), '5b falta la línea del mapa')
  ok(/Subir mis fotos/.test(t) && /fotos\.length > 0/.test(t) && /Ver mis recuerdos/.test(t), '5c faltan [Subir mis fotos] o [Ver mis recuerdos] con fotos')
  ok(/Una foto por parada/.test(t), '5d falta «Una foto por parada» en la gratis')
  ok(/<TarjetaRecuerdos /.test(leer('src/components/route/hoy/HoyDespues.tsx')), '5e HOY después no usa la misma tarjeta')
}

// ── 6. Restos y globo ──
console.log('Restos')
{
  for (const f of ['reservas/TripReadinessQuickPanel.tsx', 'reservas/ReadinessBreakdownRow.tsx', 'reservas/N26Row.tsx', 'reservas/EsimRow.tsx']) ok(!fs.existsSync(`src/components/route/${f}`), `6a sigue existiendo ${f}`)
  const globo = leer('src/lib/viajesPerfil.ts')
  ok(!/FRACCION_ANCHO_GLOBO|AIRE_GLOBO_PX/.test(globo), '6b (10N4) el globo del Perfil viejo ya no existe')
}

console.log(`\n6z6c: ${comprobaciones} comprobaciones, ${fallos} fallos.`)
process.exitCode = fallos === 0 ? 0 : 1
