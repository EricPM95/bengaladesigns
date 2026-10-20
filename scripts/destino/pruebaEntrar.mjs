// La prueba del arreglo de entrar (docs/dias/INFORME_ARREGLO_ENTRAR.md): la página que no paraba de recargar al entrar con Google.
//   node scripts/destino/pruebaEntrar.mjs
// Empaqueta `src/lib/cuentas.ts` con esbuild y lo prueba en Node con un Supabase y un navegador de mentira (dirección, almacenamientos, recargas y `fetch`).
// Cada caso se prueba con el código de ahora Y la versión de antes del arreglo (guardada en scripts/destino/_cuentasAntesDelArreglo.txt), que TIENE que reproducir el bucle.
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
  // Antes del arreglo: la copia guardada del código de entonces (scripts/destino/_cuentasAntesDelArreglo.txt). Se pone un momento en src/lib para que sus importaciones funcionen, y se borra.
  const rutaAntes = path.resolve('src/lib/_cuentasAntes.ts')
  fs.writeFileSync(rutaAntes, fs.readFileSync('scripts/destino/_cuentasAntesDelArreglo.txt', 'utf8'))
  const hayAntes = true
  const ahoraCjs = await empaquetar('ahora', path.resolve('src/lib/cuentas.ts'))
  const antesCjs = hayAntes ? await empaquetar('antes', rutaAntes) : null

  console.log('1. Google ya está unido a otra cuenta (lo de siempre de Eric)')
  {
    const m = montar(ahoraCjs, { sesion: anonima() })
    m.C.vigilarSesion(() => undefined)
    await esperar()
    await m.C.entrarConGoogle()
    debe(m.sb.llamadas.link === 1 && m.sb.llamadas.signInOAuth === 0, 'google', 'con sesión anónima, la primera vez se vincula (mismo uid)')
    volverConError(m)
    m.C.reiniciarVueltaDeEnlace?.()
    const salio = await m.C.alVolverDelEnlace()
    debe(salio === true && m.sb.llamadas.signInOAuth === 1 && m.sb.llamadas.link === 1, 'google', 'al volver con identity_already_exists, entra DIRECTAMENTE en esa cuenta (signInWithOAuth) y NO vuelve a vincular')
    debe(m.loc.hash === '' && m.loc.search === '', 'google', 'la dirección queda limpia (sin el error)')
    const guardada = JSON.parse(m.local.getItem('trazo:cuenta:anonima') ?? 'null')
    debe(guardada?.uid === 'anon1', 'google', 'la sesión anónima de ese navegador queda guardada para pasar lo suyo a la cuenta')
    await entrarCon(m, real())
    const reclamo = m.nav.peticiones.find((p) => p.url.endsWith('/api/cuenta/reclamar'))
    debe(reclamo && reclamo.metodo === 'POST' && /Bearer tok-eric/.test(reclamo.autorizacion ?? '') && /token-nuevo-de-la-anonima/.test(reclamo.cuerpo ?? ''), 'google', 'al entrar, lo de la sesión anónima pasa a la cuenta (/api/cuenta/reclamar, con el token renovado de la anónima)')
    debe(m.nav.recargas === 1, 'google', `la página recarga UNA sola vez (recargó ${m.nav.recargas})`)
    debe(m.local.getItem('trazo:cuenta:anonima') === null, 'google', 'tras pasarlo, la sesión anónima se olvida')
    await entrarCon(m, real())
    debe(m.nav.recargas === 1, 'google', 'otro aviso de sesión no vuelve a recargar')
  }

  console.log('2. El mismo caso por email')
  {
    const m = montar(ahoraCjs, { sesion: anonima('anon2'), emailYaExiste: true })
    m.C.vigilarSesion(() => undefined)
    await esperar()
    const r = await m.C.entrarConEmail('eric@correo.es')
    debe(r.error === null && m.sb.llamadas.updateUser === 1 && m.sb.llamadas.otp === 1, 'email', 'un email que ya tiene cuenta: se manda el enlace de entrar, un solo intento de cada')
    debe(JSON.parse(m.local.getItem('trazo:cuenta:anonima') ?? 'null')?.uid === 'anon2', 'email', 'la sesión anónima queda guardada')
    await entrarCon(m, real('eric2'))
    debe(m.nav.peticiones.some((p) => p.url.endsWith('/api/cuenta/reclamar')) && m.nav.recargas === 1, 'email', 'al abrir el enlace, lo de la anónima pasa a la cuenta y recarga una sola vez')
  }

  console.log('3. Si el segundo intento también falla, se para (nada de recargar otra vez)')
  {
    const m = montar(ahoraCjs, { sesion: anonima('anon3') })
    m.C.vigilarSesion(() => undefined)
    await esperar()
    await m.C.entrarConGoogle()
    volverConError(m)
    m.C.reiniciarVueltaDeEnlace?.()
    await m.C.alVolverDelEnlace()
    const oauth1 = m.sb.llamadas.signInOAuth
    volverConError(m)
    m.C.reiniciarVueltaDeEnlace?.()
    const otraVez = await m.C.alVolverDelEnlace()
    debe(otraVez === false && m.sb.llamadas.signInOAuth === oauth1 && m.sb.llamadas.link === 1, 'tope', 'si vuelve el mismo error, no se intenta nada más (ni vincular ni entrar)')
    debe(m.C.errorDeEntradaPendiente() === 'No hemos podido entrar. Inténtalo de nuevo.', 'tope', 'sale «No hemos podido entrar. Inténtalo de nuevo.»')
    debe(m.C.errorDeEntradaPendiente() === null, 'tope', 'el aviso se enseña una sola vez')
    debe(m.nav.recargas === 0, 'tope', 'y la página no se recarga')
    // Un error que no es «ya existe» tampoco reintenta.
    const m2 = montar(ahoraCjs, { sesion: anonima('anon3b') })
    volverConError(m2, 'access_denied')
    await m2.C.alVolverDelEnlace()
    debe(m2.sb.llamadas.signInOAuth === 0 && m2.sb.llamadas.link === 0 && m2.C.errorDeEntradaPendiente() !== null, 'tope', 'cancelar en Google (u otro error) no reintenta: avisa y para')
    // Si entrar con Google falla al lanzarlo, también se para.
    const m3 = montar(ahoraCjs, { sesion: anonima('anon3c'), oauthFalla: true })
    volverConError(m3)
    const f = await m3.C.alVolverDelEnlace()
    debe(f === false && m3.C.errorDeEntradaPendiente() !== null && m3.nav.recargas === 0, 'tope', 'si el intento de entrar falla, se para con el aviso')
    // Y pasados 5 minutos, otro intento ya vale.
    const m4 = montar(ahoraCjs, { sesion: anonima('anon3d') })
    m4.sesionStorage.setItem('trazo:cuenta:google-reintento', String(Date.now() - 6 * 60 * 1000))
    volverConError(m4)
    debe((await m4.C.alVolverDelEnlace()) === true && m4.sb.llamadas.signInOAuth === 1, 'tope', 'pasados 5 minutos, vuelve a valer un intento')
  }

  console.log('4. Una cuenta nueva (Google sin cuenta antes): mismo uid y sin recargar de más')
  {
    const m = montar(ahoraCjs, { sesion: anonima('anon4') })
    m.C.vigilarSesion(() => undefined)
    await esperar()
    await m.C.entrarConGoogle()
    debe((await m.C.alVolverDelEnlace()) === false, 'nueva', 'si no hay error al volver, no se hace nada más')
    await entrarCon(m, { ...real('anon4') })
    debe(!m.nav.peticiones.some((p) => p.url.endsWith('/api/cuenta/reclamar')) && m.nav.recargas === 0, 'nueva', 'el uid es el mismo: no hay nada que pasar y no se recarga')
    debe(m.local.getItem('trazo:cuenta:anonima') === null, 'nueva', 'y la sesión guardada se olvida')
  }

  console.log('5. Si pasar lo del móvil falla, no se pierde')
  {
    const m = montar(ahoraCjs, { sesion: anonima('anon5'), reclamarFalla: true })
    m.C.vigilarSesion(() => undefined)
    await esperar()
    await m.C.entrarConGoogle()
    volverConError(m)
    m.C.reiniciarVueltaDeEnlace?.()
    await m.C.alVolverDelEnlace()
    await entrarCon(m, real())
    debe(m.nav.recargas === 0 && JSON.parse(m.local.getItem('trazo:cuenta:anonima') ?? 'null')?.uid === 'anon5', 'fallo', 'si el servidor falla, la sesión anónima NO se olvida (se reintenta otra vez) y no se recarga en bucle')
  }

  console.log('6. El token de la sesión anónima se mantiene al día')
  {
    const m = montar(ahoraCjs, { sesion: anonima('anon6', 'r1') })
    m.C.vigilarSesion(() => undefined)
    await esperar()
    m.estado.sesion = anonima('anon6', 'r2-renovado')
    for (const cb of m.sb.escuchas) cb('TOKEN_REFRESHED', m.estado.sesion)
    await esperar()
    debe(JSON.parse(m.local.getItem('trazo:cuenta:anonima') ?? 'null')?.refreshToken === 'r2-renovado', 'token', 'cuando Supabase renueva la sesión anónima, el token guardado se actualiza')
  }

  console.log('7. Con el código de ANTES del arreglo, la prueba tiene que reproducir el bucle')
  if (!antesCjs) {
    console.log('   (no se pudo sacar el código anterior de git: se salta)')
  } else {
    const m = montar(antesCjs, { sesion: anonima('anon7') })
    m.C.vigilarSesion(() => undefined)
    await esperar()
    await m.C.entrarConGoogle()
    for (let vuelta = 0; vuelta < 6; vuelta++) {
      volverConError(m)
      await m.C.alVolverDelEnlace()
    }
    debe(m.sb.llamadas.link >= 6 && m.sb.llamadas.signInOAuth === 0, 'bucle', `el código de antes vuelve a vincular en cada vuelta y nunca entra en la cuenta (vinculaciones: ${m.sb.llamadas.link}) = el bucle`)
    const n = montar(ahoraCjs, { sesion: anonima('anon7') })
    n.C.vigilarSesion(() => undefined)
    await esperar()
    await n.C.entrarConGoogle()
    // (Solo se vuelve de Google si la página salió hacia Google: en cuanto el código se para, no hay más vueltas.)
    let vueltas = 0
    for (; vueltas < 6; vueltas++) {
      volverConError(n)
      n.C.reiniciarVueltaDeEnlace?.()
      if (!(await n.C.alVolverDelEnlace())) {
        vueltas++
        break
      }
    }
    debe(n.sb.llamadas.link === 1 && n.sb.llamadas.signInOAuth === 1, 'bucle', `con el arreglo, el mismo ir y venir se corta en ${vueltas} vueltas: 1 vinculación y 1 entrada (vinculaciones: ${n.sb.llamadas.link}, entradas: ${n.sb.llamadas.signInOAuth})`)
    debe(vueltas === 2, 'bucle', 'se corta a la segunda vuelta')
  }

  console.log('8. Archivos')
  {
    const gi = fs.readFileSync('.gitignore', 'utf8')
    debe(/^\.env$/m.test(gi), 'gitignore', '.env está en .gitignore (además de *.local)')
    const entrar = fs.readFileSync('src/components/cuenta/EntrarCuenta.tsx', 'utf8')
    debe(/errorDeEntradaPendiente/.test(entrar), 'pantalla', 'la pantalla de entrar enseña el aviso de «No hemos podido entrar»')
  }

  if (hayAntes) fs.rmSync(rutaAntes, { force: true })
}

try {
  await main()
} finally {
  fs.rmSync(carpeta, { recursive: true, force: true })
  fs.rmSync(path.resolve('src/lib/_cuentasAntes.ts'), { force: true })
}
console.log(`\nPrueba de entrar: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
