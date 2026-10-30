// Tanda 10S2 (el fallo grave «Algo ha ido mal» con las cuentas) · lo comprobable SIN Chrome ni red:
//   1. los ganchos de React (oxlint, `rules-of-hooks`): ningún error en toda la app y, en concreto, `useEnlaceDeTraslados` de ArrivalReturnSheet va ANTES del `return null`;
//   2. el aviso de error de pantalla: el ErrorBoundary avisa, el cliente arma el aviso sin datos privados, el servidor lo limpia/recorta/frena y siempre contesta 202;
//   3. la migración 0068 (PGlite): se aplica y se repite, RLS encendido y sin políticas.
// La prueba de verdad con el Supabase real (registrarse y crear un viaje) es `pruebaTanda10S2_real.mjs` (va sola, al final de la batería).
import fs from 'node:fs'
import http from 'node:http'
import { execSync } from 'node:child_process'
import express from 'express'
import { PGlite } from '@electric-sql/pglite'
import { limpiarTexto, normalizarError, crearFreno, registrarRutaErrores } from '../../server/errores.js'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n')

console.log('1. Los ganchos de React')
{
  let salida = ''
  try {
    salida = execSync('npx oxlint src', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (e) {
    salida = `${e.stdout ?? ''}\n${e.stderr ?? ''}`
  }
  const reglas = salida.split('\n').filter((l) => /rules-of-hooks/.test(l) && /\berror\b/.test(l))
  debe(reglas.length === 0, 'ganchos', `oxlint no da ningún error de rules-of-hooks en src (${reglas.length}: ${reglas.slice(0, 2).join(' · ').slice(0, 220)})`)
  debe(/Found \d+ warnings? and 0 errors?/.test(salida) || !/\berror react-hooks/.test(salida), 'ganchos', 'oxlint termina con 0 errores de react-hooks')
  const hoja = leer('src/components/route/dayDetail/ArrivalReturnSheet.tsx')
  const iHook = hoja.indexOf('useEnlaceDeTraslados(route.destination)')
  const iRetorno = hoja.indexOf('if (!medio) return null')
  debe(iHook > 0 && iRetorno > 0 && iHook < iRetorno, 'ganchos', 'ArrivalReturnSheet: `useEnlaceDeTraslados` se llama ANTES de `if (!medio) return null`')
  debe((hoja.match(/useEnlaceDeTraslados\(/g) ?? []).length === 1, 'ganchos', 'y solo una vez')
}

console.log('2. El aviso de error de pantalla')
{
  const boundary = leer('src/components/ErrorBoundary.tsx')
  debe(/avisarDeError\(error, info\.componentStack\)/.test(boundary), 'aviso', 'el ErrorBoundary avisa al servidor con el error y la pila de componentes')
  const cliente = leer('src/lib/errorDePantalla.ts')
  debe(/\/api\/error-pantalla/.test(cliente) && /sendBeacon/.test(cliente) && /catch/.test(cliente), 'aviso', 'el cliente manda a /api/error-pantalla (con sendBeacon) y nunca lanza')
  debe(!/\b(auth|user|email|session|trip_id|getUser|accessToken)\b/i.test(cliente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/useRouteStore\.getState\(\)/g, '')), 'privado', 'el cliente no lee la cuenta, el correo, la sesión ni el viaje')
  debe(/registrarRutaErrores\(app/.test(leer('server/index.js')), 'aviso', 'el servidor registra la ruta')

  // Pura: limpiar texto
  const sucio = 'Fallo para eric@example.com con eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdefghijk y sb_secret_ABCDEFGH12345 y 123e4567-e89b-12d3-a456-426614174000 en /?code=SECRETO123&x=1'
  const limpio = limpiarTexto(sucio, 500)
  debe(!/example\.com|eyJhbGci|sb_secret_ABC|123e4567|SECRETO123/.test(limpio), 'privado', `se tachan correos, tokens, claves, ids y códigos de la dirección (${limpio.slice(0, 160)})`)
  const vueltaDeGoogle = 'Error en https://app.vercel.app/#access_token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.firmaFirmaFirma&expires_in=3600&provider_token=ya29.ABCDEFG&refresh_token=rt_ABCDEFGHIJ&token_type=bearer en Perfil'
  const sinLlaves = limpiarTexto(vueltaDeGoogle, 500)
  debe(!/eyJhbGci|ya29|rt_ABCDEF|access_token=|refresh_token=|firmaFirma/.test(sinLlaves) && /Perfil/.test(sinLlaves), 'privado', `la dirección con la vuelta de Google (#access_token=…) se tacha entera: nunca se guarda con llaves (${sinLlaves.slice(0, 120)})`)
  const clienteFuente = leer('src/lib/errorDePantalla.ts')
  debe(/tacharLlaves\(mensaje\)/.test(clienteFuente) && /tacharLlaves\(pila\)/.test(clienteFuente) && /tacharLlaves\(componentes \?\? ''\)/.test(clienteFuente), 'privado', 'y el navegador ya la tacha ANTES de mandarla (mensaje, pila y componentes)')
  debe(limpiarTexto('x'.repeat(5000), 100).length === 100 && limpiarTexto(null) === '' && limpiarTexto(undefined) === '', 'limpiar', 'se recorta al máximo y lo vacío no falla')
  const reg = normalizarError({ pantalla: 'route / days', mensaje: 'Rendered more hooks', pila: 'at X', componentes: 'at Y', ruta: '/ruta?token=ABC#z', version: 'production', extra: 'no', id: 'u1', email: 'a@b.es' }, 'Mozilla/5.0')
  debe(reg.ruta === '/ruta' && !('extra' in reg) && !('id' in reg) && !('email' in reg), 'normalizar', 'la dirección sin parámetros y solo los campos conocidos (nada de id ni correo)')
  debe(normalizarError(null).pantalla === 'desconocida' && normalizarError('x').mensaje === '(sin mensaje)', 'normalizar', 'con un cuerpo roto sale un registro válido')

  // El freno: 5 iguales por minuto y 30 en total.
  let ahora = 1000
  const frena = crearFreno(() => ahora)
  const iguales = Array.from({ length: 8 }, () => frena('a|b'))
  debe(iguales.filter(Boolean).length === 5, 'freno', `solo 5 avisos iguales por minuto (${iguales.filter(Boolean).length})`)
  ahora += 61000
  debe(frena('a|b') === true, 'freno', 'pasado el minuto vuelve a dejar pasar')
  const total = Array.from({ length: 50 }, (_, i) => frena(`p${i}|m`)).filter(Boolean).length
  debe(total <= 30, 'freno', `y no más de 30 en total por minuto (${total})`)

  // La ruta de verdad (Express), con un «servicio» falso.
  const guardados = []
  const lineas = []
  const app = express()
  app.use(express.json({ limit: '6mb' }))
  let falla = false
  registrarRutaErrores(app, {
    servicio: { from: () => ({ insert: async (fila) => (falla ? { error: { message: 'tabla rota' } } : (guardados.push(fila), { error: null })) }) },
    consola: { error: (...a) => lineas.push(a.join(' ')) },
  })
  const servidor = await new Promise((ok) => {
    const s = http.createServer(app).listen(0, '127.0.0.1', () => ok(s))
  })
  const base = `http://127.0.0.1:${servidor.address().port}`
  const mandar = (cuerpo, cabeceras = {}) => fetch(`${base}/api/error-pantalla`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...cabeceras }, body: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo) })
  const r1 = await mandar({ pantalla: 'route / days', mensaje: 'Rendered more hooks than during the previous render', pila: 'at A (https://x/a.js:1:2)', componentes: 'at ArrivalReturnSheet', ruta: '/', version: 'production' }, { 'User-Agent': 'Mozilla/5.0 prueba' })
  const j1 = await r1.json()
  debe(r1.status === 202 && j1.ok === true && j1.guardado === true && guardados.length === 1, 'ruta', 'un aviso normal: 202 y se guarda')
  debe(guardados[0].pantalla === 'route / days' && guardados[0].navegador === 'Mozilla/5.0 prueba' && Object.keys(guardados[0]).sort().join() === 'componentes,mensaje,navegador,pantalla,pila,ruta,version', 'ruta', 'lo guardado son solo los campos esperados, sin id, correo ni IP')
  debe(lineas.some((l) => /\[error-pantalla\].*Rendered more hooks/.test(l)), 'ruta', 'y queda una línea [error-pantalla] en el registro del servidor')
  const r2 = await mandar('esto no es json {{{')
  debe(r2.status === 202 || r2.status === 400, 'ruta', `un cuerpo roto no revienta el servidor (${r2.status})`)
  falla = true
  const r3 = await mandar({ pantalla: 'otra', mensaje: 'otro error' })
  const j3 = await r3.json()
  debe(r3.status === 202 && j3.guardado === false && lineas.some((l) => /no se pudo guardar en la tabla: tabla rota/.test(l)), 'ruta', 'si la tabla falla, igual contesta 202 y lo dice en el registro')
  for (let i = 0; i < 8; i++) await mandar({ pantalla: 'repetida', mensaje: 'siempre igual' })
  debe(guardados.filter((g) => g.pantalla === 'repetida').length === 0 && lineas.filter((l) => /siempre igual/.test(l)).length <= 5, 'ruta', 'y el mismo aviso repetido se frena (a lo sumo 5 por minuto)')
  await new Promise((ok) => servidor.close(ok))
  // Sin servicio (sin clave de Supabase): solo registro.
  const app2 = express()
  app2.use(express.json())
  const lineas2 = []
  registrarRutaErrores(app2, { servicio: null, consola: { error: (...a) => lineas2.push(a.join(' ')) } })
  const s2 = await new Promise((ok) => {
    const s = http.createServer(app2).listen(0, '127.0.0.1', () => ok(s))
  })
  const r4 = await fetch(`http://127.0.0.1:${s2.address().port}/api/error-pantalla`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pantalla: 'p', mensaje: 'm' }) })
  debe(r4.status === 202 && lineas2.length === 1, 'ruta', 'sin la clave de servicio de Supabase: 202 y solo la línea del registro')
  await new Promise((ok) => s2.close(ok))
}

console.log('3. La migración 0068')
{
  const bd = { db: new PGlite() }
  const sql = leer('supabase/migrations/0068_errores_de_pantalla.sql')
  try {
    await bd.db.exec(sql)
    await bd.db.exec(sql)
    debe(true, 'migracion', 'la 0068 se aplica y se puede pegar dos veces')
  } catch (e) {
    debe(false, 'migracion', `la 0068 falla: ${String(e.message).slice(0, 200)}`)
  }
  const rls = await bd.db.query("select relrowsecurity as rls from pg_class where oid = 'public.errores_pantalla'::regclass")
  debe(rls.rows[0]?.rls === true, 'migracion', 'la tabla tiene RLS encendido')
  const pol = await bd.db.query("select count(*)::int as n from pg_policies where tablename = 'errores_pantalla'")
  debe(pol.rows[0]?.n === 0, 'migracion', 'y ninguna política (solo escribe el servidor con la clave de servicio)')
  await bd.db.exec("insert into public.errores_pantalla (pantalla, mensaje) values ('route / days', 'prueba')")
  const filas = await bd.db.query('select pantalla, mensaje, pila, ruta from public.errores_pantalla')
  debe(filas.rows.length === 1 && filas.rows[0].pila === '' && filas.rows[0].ruta === '', 'migracion', 'se puede insertar con solo pantalla y mensaje (lo demás, vacío por defecto)')
  const cols = await bd.db.query("select column_name from information_schema.columns where table_name = 'errores_pantalla'")
  debe(!cols.rows.some((c) => /user|email|ip|cuenta/i.test(c.column_name)), 'privado', 'ninguna columna guarda quién es (ni usuario, ni correo, ni IP, ni cuenta)')
}

console.log('4. Un viaje guardado con las reservas vacías no tumba la app (la causa de «Algo ha ido mal» de Eric)')
{
  const { reservasConDefectos, uiConDefectos } = await import('../../src/lib/reservasPorDefecto.ts')
  for (const [nombre, valor] of [['{}', {}], ['null', null], ['undefined', undefined], ['texto', 'x'], ['una lista', []]]) {
    const r = reservasConDefectos(valor)
    debe(Object.keys(r.transportBookings).length === 0 && Object.keys(r.accommodationSelections).length === 0 && Object.keys(r.esimSelections).length === 0 && r.insuranceBooking === null && r.rentalVehicleBooking === null && r.n26Added === false, 'reservas', `reservasConDefectos(${nombre}) deja todo en su valor de siempre (diccionarios vacíos, null, false)`)
  }
  const mezcla = reservasConDefectos({ transportBookings: 'raro', esimSelections: [], accommodationSelections: { a: { name: 'x' } }, n26Added: true })
  debe(typeof mezcla.transportBookings === 'object' && !Array.isArray(mezcla.transportBookings) && Array.isArray(mezcla.esimSelections) === false && mezcla.accommodationSelections.a?.name === 'x' && mezcla.n26Added === true, 'reservas', 'un dato con el tipo cambiado se arregla y lo bueno se conserva')
  debe(JSON.stringify(uiConDefectos({})) === '{"mode":"route","activeDayId":null}' && uiConDefectos(null).mode === 'route' && uiConDefectos({ mode: 'days', activeDayId: 'd1' }).activeDayId === 'd1', 'ui', 'uiConDefectos: vacío = RUTA sin día; lo guardado se respeta')
  const persistencia = leer('src/lib/tripPersistence.ts')
  debe(/reservasConDefectos\(row\.bookings/.test(persistencia) && /uiConDefectos\(row\.ui_state/.test(persistencia), 'nube', 'todo viaje que baja de la nube pasa por reservasConDefectos / uiConDefectos (filaAViaje)')
  const almacen = leer('src/store/useRouteStore.ts')
  debe(/hydrateTrip: \(payload\) => \{\n\s+const reservas = reservasConDefectos\(payload\.bookings\)\n\s+const ui = uiConDefectos\(payload\.uiState\)/.test(almacen) && !/payload\.bookings\.(accommodationSelections|transportBookings|insuranceBooking|esimSelections)/.test(almacen), 'hidratar', 'hydrateTrip rellena los valores por defecto y ya no lee los campos de `payload.bookings` sin protegerlos')
  // Un dato raro no tumba toda la app: las piezas de arriba (los «hosts») y las filas de Mis viajes van cada una en su PiezaSegura (si una falla, solo ella se queda sin pintar y se avisa al servidor).
  const piezaSegura = leer('src/components/PiezaSegura.tsx')
  debe(/getDerivedStateFromError/.test(piezaSegura) && /avisarDeError\(error, info\.componentStack \?\? undefined, this\.props\.nombre\)/.test(piezaSegura) && /alternativa \?\? null/.test(piezaSegura), 'pieza', 'PiezaSegura: si se rompe, esa pieza no se pinta (o su alternativa) y se avisa al servidor con su nombre')
  const app = leer('src/App.tsx')
  const hosts = ['TripSync', 'PuertaDeCuenta', 'CompartidoHost', 'PagoHost', 'PrecioVuela', 'FotoVuela', 'MomentosHost', 'AvisosHost', 'GastosCompartidosHost', 'HojaResumenVuelo']
  debe(hosts.every((h) => new RegExp(`<PiezaSegura nombre="${h}">\\s*<${h} />\\s*</PiezaSegura>`).test(app)), 'pieza', 'App.tsx: cada «host» (TripSync, PuertaDeCuenta, PrecioVuela, MomentosHost…) va en su PiezaSegura')
  debe(/<PiezaSegura key=\{v\.id\} nombre="fila de Mis viajes">/.test(leer('src/components/logros/pantallas/perfil/ListaDeViajes.tsx')), 'pieza', 'cada fila de Mis viajes va en su PiezaSegura')
  const presupuesto = leer('src/lib/presupuesto.ts')
  debe(/Object\.entries\(entrada\.transportBookings \?\? \{\}\)/.test(presupuesto) && /Object\.entries\(entrada\.esimPrecios \?\? \{\}\)/.test(presupuesto), 'presupuesto', 'el presupuesto tampoco revienta con las reservas sin rellenar')
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
