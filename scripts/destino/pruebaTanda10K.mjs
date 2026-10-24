// La prueba de la Tanda 10K: entrar con Google a la primera (un solo viaje a Google, lo de la anónima pasa a la cuenta y la vuelta no pone la pantalla de inicio).
//   node scripts/destino/pruebaTanda10K.mjs
// Empaqueta `src/lib/cuentas.ts` con esbuild y lo prueba en Node con un Supabase y un navegador de mentira (el «Google de mentira» de las pruebas: scripts/destino/pruebaEntrar.mjs).
import vm from 'node:vm'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { build } from 'esbuild'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}

const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-entrar-'))
const require = createRequire(import.meta.url)

/** El Supabase de mentira: lo que hace falta para entrar. Todo lo que se llama queda apuntado en `llamadas`. */
function nuevoSupabase(estado) {
  const llamadas = { link: 0, signInOAuth: 0, updateUser: 0, otp: 0 }
  const cadena = () =>
    new Proxy(() => cadena(), {
      get: (_t, prop) => (prop === 'then' ? (ok) => Promise.resolve({ data: [], error: null }).then(ok) : cadena()),
      apply: () => cadena(),
    })
  const escuchas = []
  const sb = {
    llamadas,
    escuchas,
    auth: {
      getSession: async () => ({ data: { session: estado.sesion }, error: null }),
      linkIdentity: async () => {
        llamadas.link++
        return { error: estado.linkFalla ? { message: 'x' } : null }
      },
      signInWithOAuth: async () => {
        llamadas.signInOAuth++
        return { error: estado.oauthFalla ? { message: 'x' } : null }
      },
      updateUser: async () => {
        llamadas.updateUser++
        return { error: estado.emailYaExiste ? { message: 'A user with this email address has already been registered', code: 'email_exists' } : null }
      },
      signInWithOtp: async () => {
        llamadas.otp++
        return { error: null }
      },
      onAuthStateChange: (cb) => {
        escuchas.push(cb)
        return { data: { subscription: { unsubscribe() {} } } }
      },
    },
    rpc: async () => ({ data: null, error: null }),
    from: () => cadena(),
  }
  return sb
}

const almacen = () => {
  const mapa = new Map()
  return { getItem: (k) => mapa.get(k) ?? null, setItem: (k, v) => mapa.set(k, String(v)), removeItem: (k) => mapa.delete(k), get _mapa() { return mapa } }
}

async function empaquetar(nombre, entrada) {
  const salida = path.join(carpeta, `${nombre}.cjs`)
  await build({
    entryPoints: [entrada],
    outfile: salida,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    logLevel: 'error',
    define: { 'import.meta.env': JSON.stringify({ DEV: false, MODE: 'test', VITE_SUPABASE_URL: 'https://falso.supabase.test', VITE_SUPABASE_ANON_KEY: 'clave-falsa', VITE_CUENTAS_ACTIVAS: 'true' }) },
    plugins: [
      {
        name: 'supabase-de-mentira',
        setup(b) {
          b.onResolve({ filter: /supabaseClient$/ }, () => ({ path: 'supabase-falso', namespace: 'falso' }))
          b.onLoad({ filter: /.*/, namespace: 'falso' }, () => ({ contents: 'module.exports = { get supabase() { return globalThis.__sb } }', loader: 'js' }))
        },
      },
    ],
  })
  return salida
}

/** Un navegador de mentira nuevo + el módulo recién cargado (sin estado de antes). */
function montar(archivo, { sesion, ...estadoSb }) {
  const estado = { sesion, ...estadoSb }
  const sb = nuevoSupabase(estado)
  globalThis.__sb = sb
  const local = almacen()
  const sesionStorage = almacen()
  const nav = { recargas: 0, peticiones: [] }
  const loc = { search: '', hash: '', pathname: '/', origin: 'https://app.test', href: 'https://app.test/', reload: () => nav.recargas++ }
  globalThis.window = {
    location: loc,
    history: {
      replaceState: (_a, _b, url) => {
        const u = new URL(String(url), 'https://app.test')
        loc.search = u.search
        loc.hash = u.hash
        loc.pathname = u.pathname
      },
    },
    localStorage: local,
    sessionStorage: sesionStorage,
    addEventListener() {},
    removeEventListener() {},
  }
  globalThis.document = { body: {}, addEventListener() {}, removeEventListener() {} }
  globalThis.localStorage = local
  globalThis.sessionStorage = sesionStorage
  // El servidor de mentira: renovar el token de la anónima y «pasar lo del móvil».
  globalThis.fetch = async (url, opciones = {}) => {
    const u = String(url)
    nav.peticiones.push({ url: u, metodo: opciones.method ?? 'GET', cuerpo: opciones.body ?? null, autorizacion: opciones.headers?.Authorization ?? opciones.headers?.authorization ?? null })
    if (u.includes('/auth/v1/token')) return new Response(JSON.stringify({ access_token: 'token-nuevo-de-la-anonima', refresh_token: 'r-nuevo', expires_in: 3600, token_type: 'bearer', user: { id: estado.sesion?.user?.id ?? 'anon1', is_anonymous: true } }), { status: 200, headers: { 'content-type': 'application/json' } })
    if (u.endsWith('/api/cuenta/reclamar')) return estado.reclamarFalla ? new Response('{"error":"x"}', { status: 500 }) : new Response('{"ok":true}', { status: 200 })
    return new Response('{}', { status: 200 })
  }
  delete require.cache[archivo]
  const C = require(archivo)
  return { C, sb, nav, loc, local, sesionStorage, estado }
}

/** Vuelve de Google con un error en el hash (así lo deja Supabase). */
const volverConError = (m, codigo = 'identity_already_exists') => {
  m.loc.hash = `#error=server_error&error_code=${codigo}&error_description=Identity+is+already+linked+to+another+user`
  m.loc.search = ''
}
const anonima = (id = 'anon1', refresh = 'r1') => ({ access_token: 'a', refresh_token: refresh, user: { id, is_anonymous: true } })
const real = (id = 'eric') => ({ access_token: 'tok-eric', refresh_token: 'r-eric', user: { id, email: 'eric@correo.es', is_anonymous: false, app_metadata: { provider: 'google' }, user_metadata: {} } })
const esperar = (ms = 30) => new Promise((r) => setTimeout(r, ms))

/** Entra con la cuenta: dispara el cambio de sesión y deja correr lo de después. */
async function entrarCon(m, sesion) {
  m.estado.sesion = sesion
  for (const cb of m.sb.escuchas) cb('SIGNED_IN', sesion)
  await esperar(80)
}

async function main() {
  const ahoraCjs = await empaquetar('ahora', path.resolve('src/lib/cuentas.ts'))
  const fuente = fs.readFileSync('src/lib/cuentas.ts', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

  console.log('1. Con sesión anónima y una cuenta de Google que YA tiene cuenta: un solo viaje y dentro, con lo de la anónima pasado')
  {
    const m = montar(ahoraCjs, { sesion: anonima('anon-existente') })
    m.C.vigilarSesion(() => undefined)
    await esperar()
    const r = await m.C.entrarConGoogle()
    debe(r.error === null && m.sb.llamadas.signInOAuth === 1 && m.sb.llamadas.link === 0, 'existente', 'un solo viaje a Google (signInWithOAuth) y ninguna vinculación previa')
    debe(JSON.parse(m.local.getItem('trazo:cuenta:anonima') ?? 'null')?.uid === 'anon-existente', 'existente', 'antes de irse guarda la sesión anónima (con lo que hubiera hecho sin cuenta)')
    // Vuelve de Google ya dentro de SU cuenta (otro uid): sin error en la dirección, sin segunda ventana de Google.
    debe((await m.C.alVolverDelEnlace()) === false && m.sb.llamadas.signInOAuth === 1, 'existente', 'al volver no hay un segundo viaje a Google')
    await entrarCon(m, real('cuenta-de-eric'))
    const reclamo = m.nav.peticiones.find((p) => p.url.endsWith('/api/cuenta/reclamar'))
    debe(reclamo && /Bearer tok-eric/.test(reclamo.autorizacion ?? '') && /token-nuevo-de-la-anonima/.test(reclamo.cuerpo ?? ''), 'existente', 'lo de la sesión anónima pasa a su cuenta (nada se pierde)')
    debe(m.nav.recargas === 1 && m.local.getItem('trazo:cuenta:anonima') === null, 'existente', 'se recarga una sola vez y la anónima se olvida')
    debe(m.C.errorDeEntradaPendiente() === null, 'existente', 'y no hay ningún aviso de error')
  }

  console.log('2. Con sesión anónima y una cuenta de Google NUEVA: un solo viaje y dentro')
  {
    const m = montar(ahoraCjs, { sesion: anonima('anon-nueva') })
    m.C.vigilarSesion(() => undefined)
    await esperar()
    await m.C.entrarConGoogle()
    debe(m.sb.llamadas.signInOAuth === 1 && m.sb.llamadas.link === 0, 'nueva', 'un solo viaje a Google')
    await entrarCon(m, real('cuenta-nueva'))
    debe(m.nav.peticiones.filter((p) => p.url.endsWith('/api/cuenta/reclamar')).length === 1 && m.nav.recargas === 1 && m.C.errorDeEntradaPendiente() === null, 'nueva', 'lo de la anónima pasa a la cuenta nueva, una recarga y sin errores')
  }

  console.log('3. Dos intentos seguidos (menos de 5 minutos): los dos entran')
  {
    const m = montar(ahoraCjs, { sesion: anonima('anon-dos') })
    m.C.vigilarSesion(() => undefined)
    await esperar()
    // Un intento anterior dejó el freno y un aviso hace un momento.
    m.sesionStorage.setItem('trazo:cuenta:google-reintento', String(Date.now() - 1000))
    m.sesionStorage.setItem('trazo:cuenta:error-entrar', 'No hemos podido entrar. Inténtalo de nuevo.')
    const a = await m.C.entrarConGoogle()
    const b = await m.C.entrarConGoogle()
    debe(a.error === null && b.error === null && m.sb.llamadas.signInOAuth === 2, 'dos', 'los dos toques van a Google: ningún freno de 5 minutos')
    debe(m.sesionStorage.getItem('trazo:cuenta:google-reintento') === null && m.C.errorDeEntradaPendiente() === null, 'dos', 'cada toque borra el freno y el aviso de antes')
    await entrarCon(m, real('cuenta-dos'))
    debe(m.nav.recargas === 1, 'dos', 'y se entra')
  }

  console.log('4. Al volver de Google no sale la pantalla de inicio')
  {
    const html = fs.readFileSync('index.html', 'utf8')
    const guion = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((x) => x[1]).find((x) => x.includes('sessionStorage'))
    debe(Boolean(guion), 'apertura', 'index.html lleva el guion de la pantalla de inicio')
    /** Corre el guion con una dirección y una pestaña falsas y dice si la pantalla de inicio sigue puesta. */
    const sale = (search, hash, almacen = {}) => {
      let puesta = true
      const documento = { getElementById: () => ({ remove: () => { puesta = false } }) }
      const ventana = { location: { search, hash }, sessionStorage: { getItem: (k) => (k in almacen ? almacen[k] : null), setItem: (k, v) => { almacen[k] = String(v) }, removeItem: (k) => { delete almacen[k] } } }
      vm.runInNewContext(guion, { window: ventana, document: documento })
      return puesta
    }
    debe(sale('', '') === true, 'apertura', 'abrir la app con normalidad: sale la pantalla de inicio (3,5 s)')
    debe(sale('?code=abc123', '') === false, 'apertura', 'volver de Google con el código en la dirección: no sale')
    debe(sale('', '#access_token=a&refresh_token=b&expires_in=3600') === false, 'apertura', 'volver de Google con la sesión en el hash: no sale')
    debe(sale('', '#error=server_error&error_code=identity_already_exists&error_description=x') === false, 'apertura', 'volver de Google con un error en el hash: no sale')
    debe(sale('?error=access_denied&error_code=access_denied', '') === false, 'apertura', 'volver de Google cancelado (error en la dirección): no sale')
    debe(sale('?viaje=1', '') === true && sale('?codigo=1', '') === true, 'apertura', 'otras direcciones (con «codigo», «viaje»…) siguen sacando la pantalla de inicio')
    const trasEntrar = { 'jutrip:sin-apertura': '1' }
    debe(sale('', '', trasEntrar) === false && !('jutrip:sin-apertura' in trasEntrar), 'apertura', 'la recarga de justo después de entrar sigue sin ponerla (la marca se gasta)')
    // La misma regla en el código de la app.
    const m = montar(ahoraCjs, { sesion: anonima('anon-regla') })
    debe(m.C.esVueltaDeGoogle('?code=x') && m.C.esVueltaDeGoogle('#access_token=x') && m.C.esVueltaDeGoogle('#error_code=x') && !m.C.esVueltaDeGoogle('?viaje=1'), 'apertura', 'esVueltaDeGoogle (la regla de index.html, en código) reconoce lo mismo')
  }

  console.log('5. Si Google devuelve otro error: el aviso, sin bucle y sin la pantalla de inicio')
  {
    for (const codigo of ['access_denied', 'server_error', 'identity_already_exists']) {
      const m = montar(ahoraCjs, { sesion: anonima('anon-error-' + codigo) })
      m.C.vigilarSesion(() => undefined)
      await esperar()
      await m.C.entrarConGoogle()
      volverConError(m, codigo)
      m.C.reiniciarVueltaDeEnlace?.()
      const salio = await m.C.alVolverDelEnlace()
      debe(salio === false && m.sb.llamadas.signInOAuth === 1 && m.sb.llamadas.link === 0 && m.nav.recargas === 0, 'error', `${codigo}: no vuelve a salir a Google ni recarga la página`)
      debe(m.C.errorDeEntradaPendiente() === 'No hemos podido entrar. Inténtalo de nuevo.' && m.C.errorDeEntradaPendiente() === null, 'error', `${codigo}: sale «No hemos podido entrar. Inténtalo de nuevo.» una sola vez`)
      debe(m.loc.hash === '' && m.loc.search === '', 'error', `${codigo}: la dirección queda limpia`)
    }
    const m = montar(ahoraCjs, { sesion: anonima('anon-sinred'), oauthFalla: true })
    const r = await m.C.entrarConGoogle()
    debe(r.error === 'No hemos podido entrar. Inténtalo de nuevo.' && m.nav.recargas === 0, 'error', 'sin conexión (no se puede ni lanzar Google): el aviso al momento')
  }

  console.log('6. El código')
  {
    debe(!/linkIdentity/.test(fuente), 'codigo', 'cuentas.ts ya no vincula la identidad antes de ir a Google (linkIdentity)')
    debe((fuente.match(/signInWithOAuth/g) ?? []).length === 1, 'codigo', 'y hay un solo sitio que manda a Google (signInWithOAuth)')
    const entrar = fs.readFileSync('src/components/cuenta/EntrarCuenta.tsx', 'utf8')
    debe(/entrarConGoogle\(\)/.test(entrar) && /errorDeEntradaPendiente/.test(entrar), 'codigo', 'el botón [Continuar con Google] llama a entrarConGoogle y la pantalla enseña el aviso de error')
  }

  console.log('7. Adónde lleva la app al abrirla con sesión (Eric, 24-oct)')
  {
    const { dondeAbrir } = await import('../../src/lib/dondeAbrir.ts')
    const HOY = '2026-10-24'
    const v = (id, inicio, fin, extra = {}) => ({ id, inicio, fin, ...extra })
    const fechas = (x) => (x.inicio ? { inicio: x.inicio, fin: x.fin } : null)
    const abrir = (viajes) => dondeAbrir(viajes, (x) => Boolean(x.inicio) && x.inicio <= HOY && HOY <= x.fin, fechas, HOY)
    // (la lista viene con el que tocó más recientemente primero)
    const a = abrir([v('reciente', '2026-12-01', '2026-12-05'), v('hoy', '2026-10-22', '2026-10-26'), v('viejo', '2026-01-01', '2026-01-05')])
    debe(a.tipo === 'hoy' && a.viaje.id === 'hoy' && a.modo === 'today', 'abre', 'hoy es un día de un viaje → HOY de ese viaje (aunque haya tocado otro después)')
    const b = abrir([v('toque-reciente', '2027-03-01', '2027-03-05'), v('mas-cercano', '2026-11-10', '2026-11-14'), v('pasado', '2026-01-01', '2026-01-05')])
    debe(b.tipo === 'ruta' && b.viaje.id === 'mas-cercano' && b.modo === 'route', 'abre', 'viaje por delante (y otro tocado después) → RUTA del más cercano en fecha')
    const c = abrir([v('p1', '2026-02-01', '2026-02-05'), v('p2', '2026-09-01', '2026-09-05')])
    debe(c.tipo === 'misViajes', 'abre', 'solo viajes pasados → «Mis viajes»')
    debe(abrir([]).tipo === 'nada', 'abre', 'sin viajes → «Crear viaje» (la pantalla de destino)')
    const d = abrir([v('sin1', null, null), v('sin2', null, null)])
    debe(d.tipo === 'ruta' && d.viaje.id === 'sin1' && d.motivo === 'sin_fechas', 'abre', 'varios viajes sin fechas → RUTA del último que tocó (el primero de la lista)')
    const e = abrir([v('sin-reciente', null, null), v('con-fecha', '2026-12-20', '2026-12-24'), v('pasado', '2026-01-01', '2026-01-05')])
    debe(e.tipo === 'ruta' && e.viaje.id === 'con-fecha' && e.motivo === 'por_delante', 'abre', 'con un viaje sin fechas y otro con fecha por delante, manda el de fecha (el sin fechas solo si no hay otro)')
    const f = abrir([v('pasado', '2026-01-01', '2026-01-05'), v('sin', null, null)])
    debe(f.tipo === 'ruta' && f.viaje.id === 'sin', 'abre', 'un viaje sin fechas cuenta como «por delante» aunque los demás hayan pasado')
    const g = abrir([v('acaba-hoy', '2026-10-20', '2026-10-24')])
    debe(g.tipo === 'hoy', 'abre', 'el último día del viaje sigue siendo HOY')
    const h = abrir([v('mismo-dia-b', '2026-11-10', '2026-11-12'), v('mismo-dia-a', '2026-11-10', '2026-11-14')])
    debe(h.tipo === 'ruta' && h.viaje.id === 'mismo-dia-b', 'abre', 'a igualdad de fecha de inicio, el que tocó más recientemente')
    const i = abrir([v('a-medias', '2026-11-10', '2026-11-12', { generationState: { x: 1 } }), v('hoy', '2026-10-22', '2026-10-26')])
    debe(i.tipo === 'reanudar' && i.viaje.id === 'a-medias', 'abre', 'un viaje con la generación a medias se retoma primero')
    const sync = fs.readFileSync('src/components/sync/TripSync.tsx', 'utf8')
    debe(/donde\.tipo === 'misViajes'/.test(sync) && /setScreen\('myTrips'\)/.test(sync) && /donde\.tipo === 'ruta'/.test(sync) && /todayIso\(\)/.test(sync), 'abre', 'TripSync usa estas reglas (RUTA del que toca, «Mis viajes» si todos pasaron)')
    const mis = fs.readFileSync('src/components/myTrips/MyTripsScreen.tsx', 'utf8')
    debe(/Mis viajes/.test(mis) && /\+ Crear viaje/.test(mis) && mis.indexOf('Crear viaje') < mis.indexOf('savedTrips.map'), 'abre', '«Mis viajes» lleva [+ Crear viaje] arriba del todo, antes de la lista')
    const apertura = fs.readFileSync('index.html', 'utf8')
    debe(/id="apertura"/.test(apertura), 'abre', 'y antes de todo, la pantalla de inicio (la recarga de justo después de entrar es la única excepción)')
  }
}

try {
  await main()
} finally {
  fs.rmSync(carpeta, { recursive: true, force: true })
}
console.log(`\nPrueba de la Tanda 10K: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
