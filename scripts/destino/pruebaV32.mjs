// La prueba de la Tanda V32: LA APP EN SU DOMINIO (jutrip.app), con el código funcionando en las dos direcciones.
//   node scripts/destino/pruebaV32.mjs      (no necesita Vite ni navegador: lee el código y ejecuta la redirección de index.html con una «dirección» de mentira)
// Ninguna parte toca producción.
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { origenSeguro } from '../../server/pagos.js'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const archivos = (dir, re, salida = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist', '__tests__'].includes(e.name)) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) archivos(p, re, salida)
    else if (re.test(e.name)) salida.push(p)
  }
  return salida
}

console.log('1. Ninguna dirección de bengaladesigns.vercel.app escrita a mano en el código')
{
  const codigo = ['src', 'server', 'api', 'public', 'shared'].filter((d) => fs.existsSync(d)).flatMap((d) => archivos(d, /\.(ts|tsx|js|mjs|json|html|css|webmanifest)$/))
  for (const f of ['index.html', 'vite.config.ts', 'vercel.json', 'package.json']) if (fs.existsSync(f)) codigo.push(f)
  // La única mención permitida es la de la redirección (index.html) y su lista de direcciones viejas.
  const menciones = codigo.filter((f) => /bengaladesigns/i.test(leer(f)))
  debe(menciones.length === 1 && menciones[0] === 'index.html', 'direcciones', `la única mención está en la redirección de index.html (${menciones.join(', ') || 'ninguna'})`)
  const vercelApp = codigo.filter((f) => /https?:\/\/[a-z0-9-]+\.vercel\.app/i.test(leer(f)))
  debe(vercelApp.length === 0, 'direcciones', `ninguna dirección .vercel.app escrita a mano en el código (${vercelApp.join(', ') || 'ninguna'})`)
  const prod = codigo.filter((f) => /^(src|server|api|public|shared)/.test(f)).filter((f) => !/\/dev\/|escaparates|__tests__/.test(f.replace(/\\/g, '/')))
  const localhost = prod.filter((f) => /https?:\/\/localhost/.test(leer(f)))
  debe(localhost.every((f) => /server[\\/](pagos|index)\.js|compararMotores|fetchConCuenta/.test(f)), 'direcciones', `las direcciones de localhost que quedan solo son los valores por defecto de desarrollo del servidor (${localhost.join(', ') || 'ninguna'})`)
}

console.log('2. Los enlaces salen de UN sitio (la dirección de la app) y no de un texto fijo')
{
  const cuentas = leer('src/lib/cuentas.ts')
  debe(cuentas.includes("const volverA = () => `${window.location.origin}/`") && (cuentas.match(/emailRedirectTo: volverA\(\)/g) ?? []).length === 2 && cuentas.includes("redirectTo: volverA()"), 'regresos', 'los regresos de entrar con el código y con Google salen de la dirección en la que está la app (window.location.origin)')
  debe(leer('src/lib/invitaciones.ts').includes('origen.replace(') && /enlaceDeInvitacion\(\s*window\.location\.origin/.test(archivos('src', /\.(ts|tsx)$/).map(leer).join('\n')), 'invitaciones', 'el enlace de invitación se monta con la dirección de la app (nunca un texto fijo)')
  debe(origenSeguro({ APP_URL: 'https://jutrip.app' }, { headers: { origin: 'https://otro.com' } }) === 'https://jutrip.app', 'stripe', 'el regreso de Stripe usa APP_URL (y no una dirección que mande el móvil)')
  debe(origenSeguro({}, { headers: { origin: 'https://otro.com' } }) === null && origenSeguro({}, { headers: { origin: 'http://localhost:5173' } }) === 'http://localhost:5173', 'stripe', 'sin APP_URL solo vale localhost (desarrollo); nunca una dirección de fuera')
  const pagos = leer('server/pagos.js')
  debe(/success_url: exito/.test(pagos) && /origenSeguro\(env, req\)/.test(pagos), 'stripe', 'el éxito y el cancelar de Stripe se montan con esa dirección')
  const man = leer('server/index.js').match(/app\.get\('\/api\/manifest\.webmanifest'[\s\S]{0,700}/)[0]
  debe(/start_url: '\/'/.test(man) && /scope: '\/'/.test(man), 'manifest', 'el manifest de la app (start_url y scope) son relativos: valen en cualquier dirección')
  debe(!fs.existsSync('public/robots.txt') && !fs.existsSync('public/sitemap.xml') && !/og:(url|image)/.test(leer('index.html')), 'compartir', 'no hay sitemap, robots ni etiquetas og:url / og:image con direcciones escritas a mano')
}

console.log('3. La redirección de la dirección vieja a jutrip.app (solo cuando Eric la enciende)')
{
  const html = leer('index.html')
  const script = html.match(/<script>\s*;\(function \(\) \{[\s\S]*?\}\)\(\)\s*<\/script>/)?.[0].replace(/<\/?script>/g, '')
  debe(Boolean(script), 'redireccion', 'index.html lleva el script de redirección')
  const correr = (nueva, url) => {
    const u = new URL(url)
    const llamadas = []
    const location = { hostname: u.hostname, pathname: u.pathname, search: u.search, hash: u.hash, replace: (a) => llamadas.push(a) }
    vm.runInNewContext((script ?? '').replace('%VITE_APP_URL_NUEVA%', nueva), { location })
    return llamadas
  }
  const SIN = '%VITE_APP_URL_NUEVA%'
  debe(correr(SIN, 'https://bengaladesigns.vercel.app/ruta').length === 0, 'redireccion', 'sin la variable puesta NO hace nada: la app sirve igual en las dos direcciones (el código se sube antes de que Eric toque los paneles)')
  debe(correr('', 'https://bengaladesigns.vercel.app/ruta').length === 0, 'redireccion', 'con la variable vacía tampoco hace nada')
  const NUEVA = 'https://jutrip.app'
  const a = correr(NUEVA, 'https://bengaladesigns.vercel.app/?invitacion=ABCD2345')
  debe(a.length === 1 && a[0] === 'https://jutrip.app/?invitacion=ABCD2345', 'redireccion', `la dirección vieja va a la nueva conservando la ruta y los datos (${a[0]})`)
  const b = correr(NUEVA, 'https://bengaladesigns.vercel.app/admin/sonidos?x=1#access_token=abc')
  debe(b[0] === 'https://jutrip.app/admin/sonidos?x=1#access_token=abc', 'redireccion', `conserva la ruta, lo de después del ? y lo de después del # (el regreso de entrar con Google): ${b[0]}`)
  const w = correr(NUEVA, 'https://www.jutrip.app/viaje?a=1')
  debe(w.length === 1 && w[0] === 'https://jutrip.app/viaje?a=1', 'redireccion', `www.jutrip.app va a jutrip.app (${w[0]})`)
  debe(correr(NUEVA, 'https://jutrip.app/ruta').length === 0 && correr(NUEVA, 'http://localhost:5173/').length === 0, 'redireccion', 'jutrip.app y localhost no se redirigen (nada de bucles)')
  debe(correr('https://jutrip.app/', 'https://bengaladesigns.vercel.app/x')[0] === 'https://jutrip.app/x', 'redireccion', 'con una barra al final tampoco duplica la barra')
  const v = JSON.parse(leer('vercel.json'))
  debe(!v.redirects && v.rewrites.some((r) => r.source === '/api/:path*' && r.destination === '/api'), 'webhook', 'las llamadas al servidor (/api/*, el webhook de Stripe) NO se redirigen: siguen yendo al servidor, en las dos direcciones')
  debe(!/bengaladesigns|redirect/i.test(leer('api/index.js')), 'webhook', 'el servidor no redirige nada por su cuenta')
  debe(/app\.post\('\/api\/pago\/webhook'/.test(leer('server/pagos.js')), 'webhook', 'el webhook de Stripe sigue en /api/pago/webhook')
  const idx = html.indexOf('<script>')
  debe(idx > 0 && idx < html.indexOf('rel="icon"'), 'redireccion', 'el script va el primero: la persona no llega a ver la página vieja')
}

console.log('4. El correo de la marca')
{
  const c = leer('src/lib/contacto.ts')
  debe(c.includes("CORREO_SOPORTE = 'soporte@jutrip.app'") && c.includes("CORREO_PRIVACIDAD = 'privacidad@jutrip.app'"), 'correos', 'el contacto es soporte@jutrip.app y el de privacidad, privacidad@jutrip.app (en un solo archivo)')
  debe(leer('src/components/ajustes/AjustesScreen.tsx').includes('titulo="Contactar" sub={CORREO_SOPORTE}'), 'correos', 'Ajustes tiene «Contactar» con soporte@jutrip.app')
  const pr = leer('src/lib/privacidad.ts')
  debe(pr.includes('${CORREO_PRIVACIDAD}') && pr.includes('${CORREO_SOPORTE}'), 'correos', 'la página de privacidad da privacidad@jutrip.app (dudas de privacidad) y soporte@jutrip.app (contacto)')
  debe(leer('src/components/ajustes/MisPases.tsx').includes('CORREO_SOPORTE'), 'correos', 'los pases y pagos dicen a quién escribir: soporte@jutrip.app')
  const otros = archivos('src', /\.(ts|tsx)$/).filter((f) => !/contacto\.ts$|escaparates|[\\/]dev[\\/]/.test(f)).flatMap((f) => (leer(f).match(/[A-Za-z0-9._-]+@(?!types)[A-Za-z0-9-]+\.[a-z]{2,}/g) ?? []).map((m) => `${f}:${m}`)).filter((x) => !/@jutrip\.app|tu@email.com|@demo|@local|@example|@1\.0|@vitejs/.test(x))
  debe(otros.length === 0, 'correos', `ningún otro correo de contacto escrito a mano en la app (${otros.slice(0, 3).join(', ') || 'ninguno'})`)
  const pl = leer('docs/jutrip_app/PLANTILLAS_CORREOS_SUPABASE.md')
  debe(['Magic Link', 'Confirm signup', 'Change Email Address'].every((n) => pl.includes(`## `) && pl.includes(n)) && (pl.match(/\{\{ \.Token \}\}/g) ?? []).length >= 4 && pl.includes('{{ .ConfirmationURL }}') && pl.includes('{{ .NewEmail }}'), 'plantillas', 'las plantillas de los correos de Supabase están en docs/jutrip_app (el código de entrada bien grande, la primera vez y el cambio de correo)')
  debe(!/\{\{ \.(Password|OldEmail|Data)/.test(pl), 'plantillas', 'las plantillas solo usan variables que existen para lo que la app hace')
}

console.log(`\nPrueba de la Tanda V32: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
