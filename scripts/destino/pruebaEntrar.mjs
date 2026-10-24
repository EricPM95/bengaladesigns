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

  console.log('1. Google ya tiene cuenta (lo de siempre de Eric): UN solo viaje a Google, Tanda 10K')
  {
    const m = montar(ahoraCjs, { sesion: anonima() })
    m.C.vigilarSesion(() => undefined)
    await esperar()
    await m.C.entrarConGoogle()
    debe(m.sb.llamadas.signInOAuth === 1 && m.sb.llamadas.link === 0, 'google', 'con sesión anónima va DIRECTO a Google (signInWithOAuth), sin vincular antes: un solo viaje')
    const guardada = JSON.parse(m.local.getItem('trazo:cuenta:anonima') ?? 'null')
    debe(guardada?.uid === 'anon1', 'google', 'la sesión anónima de ese navegador queda guardada para pasar lo suyo a la cuenta')
    // Vuelve de Google ya con la cuenta (sin error en la dirección): no se sale otra vez a Google.
    m.C.reiniciarVueltaDeEnlace?.()
    debe((await m.C.alVolverDelEnlace()) === false && m.sb.llamadas.signInOAuth === 1, 'google', 'al volver no se vuelve a salir a Google')
    await entrarCon(m, real())
    const reclamo = m.nav.peticiones.find((p) => p.url.endsWith('/api/cuenta/reclamar'))
    debe(reclamo && reclamo.metodo === 'POST' && /Bearer tok-eric/.test(reclamo.autorizacion ?? '') && /token-nuevo-de-la-anonima/.test(reclamo.cuerpo ?? ''), 'google', 'al entrar, lo de la sesión anónima pasa a su cuenta (con su token al día)')
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

  console.log('3. Si Google devuelve un error: el aviso, sin bucle y sin segundo viaje')
  {
    const m = montar(ahoraCjs, { sesion: anonima('anon3') })
    m.C.vigilarSesion(() => undefined)
    await esperar()
    await m.C.entrarConGoogle()
    volverConError(m, 'access_denied')
    m.C.reiniciarVueltaDeEnlace?.()
    const salio = await m.C.alVolverDelEnlace()
    debe(salio === false && m.sb.llamadas.signInOAuth === 1 && m.sb.llamadas.link === 0, 'tope', 'un error al volver NO manda a Google otra vez (ni vincular ni entrar)')
    debe(m.loc.hash === '' && m.loc.search === '', 'tope', 'la dirección queda limpia (sin el error)')
    debe(m.C.errorDeEntradaPendiente() === 'No hemos podido entrar. Inténtalo de nuevo.', 'tope', 'sale «No hemos podido entrar. Inténtalo de nuevo.»')
    debe(m.C.errorDeEntradaPendiente() === null, 'tope', 'el aviso se enseña una sola vez')
    debe(m.nav.recargas === 0, 'tope', 'y la página no se recarga')
    // Un error «ya existe» heredado de una versión vieja tampoco reintenta.
    const m2 = montar(ahoraCjs, { sesion: anonima('anon3b') })
    volverConError(m2)
    await m2.C.alVolverDelEnlace()
    debe(m2.sb.llamadas.signInOAuth === 0 && m2.sb.llamadas.link === 0 && m2.C.errorDeEntradaPendiente() !== null, 'tope', 'ni siquiera identity_already_exists reintenta: avisa y para')
    // Si lanzar Google falla, se dice al momento y no se sale.
    const m3 = montar(ahoraCjs, { sesion: anonima('anon3c'), oauthFalla: true })
    const f = await m3.C.entrarConGoogle()
    debe(f.error === 'No hemos podido entrar. Inténtalo de nuevo.' && m3.nav.recargas === 0, 'tope', 'si no se puede lanzar Google, el aviso sale al momento')
    // Dos toques seguidos (menos de 5 minutos): los dos van a Google, sin freno ni aviso viejo.
    const m4 = montar(ahoraCjs, { sesion: anonima('anon3d') })
    m4.sesionStorage.setItem('trazo:cuenta:google-reintento', String(Date.now()))
    m4.sesionStorage.setItem('trazo:cuenta:error-entrar', 'No hemos podido entrar. Inténtalo de nuevo.')
    await m4.C.entrarConGoogle()
    await m4.C.entrarConGoogle()
    debe(m4.sb.llamadas.signInOAuth === 2 && m4.C.errorDeEntradaPendiente() === null && m4.sesionStorage.getItem('trazo:cuenta:google-reintento') === null, 'tope', 'cada toque en el botón borra el freno y el aviso de antes: dos toques seguidos, dos viajes que valen')
  }

  console.log('4. Una cuenta de Google nueva: un solo viaje y lo de la anónima pasa a su cuenta')
  {
    const m = montar(ahoraCjs, { sesion: anonima('anon4') })
    m.C.vigilarSesion(() => undefined)
    await esperar()
    await m.C.entrarConGoogle()
    debe(m.sb.llamadas.signInOAuth === 1 && m.sb.llamadas.link === 0, 'nueva', 'un solo viaje a Google, sin vincular')
    debe((await m.C.alVolverDelEnlace()) === false, 'nueva', 'si no hay error al volver, no se hace nada más')
    await entrarCon(m, { ...real('google-nueva') })
    debe(m.nav.peticiones.some((p) => p.url.endsWith('/api/cuenta/reclamar')) && m.nav.recargas === 1, 'nueva', 'lo de la anónima pasa a la cuenta nueva y se recarga una sola vez')
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
    let salidas = 0
    for (let vuelta = 0; vuelta < 6; vuelta++) {
      volverConError(n)
      n.C.reiniciarVueltaDeEnlace?.()
      if (await n.C.alVolverDelEnlace()) salidas++
    }
    debe(n.sb.llamadas.link === 0 && n.sb.llamadas.signInOAuth === 1 && salidas === 0, 'bucle', 'con el código de ahora, el mismo ir y venir no sale a Google ni una vez más: 1 viaje y se acabó')
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
