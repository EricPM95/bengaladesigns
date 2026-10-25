// La prueba de las cuentas, parte 3 (docs/dias/INFORME_CUENTAS_3.md). No toca el motor de rutas.
//   node scripts/destino/pruebaCuentas3.mjs
//
// Lo del navegador se empaqueta con esbuild y se prueba en Node; lo de la base de datos corre las migraciones DE VERDAD sobre un Postgres de prueba (PGlite) con las
// reglas de seguridad activas; el cobro se prueba con un Stripe de mentira (la firma del aviso se comprueba de verdad). Lo que PGlite no es (Supabase, Google, Stripe de
// verdad, el móvil) se prueba con `scripts/cuentas/comprobarSupabase.mjs` cuando Eric ponga las claves.
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'
import { createRequire } from 'node:module'
import { build } from 'esbuild'
import { crearBaseDePrueba } from './_baseDeDatosPrueba.mjs'

export const fallos = []
export let comprobaciones = 0
export const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
export const lanza = async (fn) => {
  try {
    await fn()
    return null
  } catch (error) {
    return String(error?.message ?? error)
  }
}

/* ─────────────────────────── Lo del navegador, empaquetado ─────────────────────────── */
const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-cuentas3-'))
const realReactDom = path.resolve('node_modules/react-dom/index.js')
export async function empaquetar(nombre, entorno = {}, entrada = 'scripts/destino/_cuentas3_entrada.tsx') {
  const salida = path.join(carpeta, `${nombre}.cjs`)
  await build({
    entryPoints: [entrada],
    outfile: salida,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    jsx: 'automatic',
    logLevel: 'error',
    loader: { '.svg': 'dataurl', '.png': 'dataurl', '.jpg': 'dataurl', '.jpeg': 'dataurl', '.webp': 'dataurl', '.css': 'empty', '.woff2': 'dataurl' },
    define: { 'import.meta.env': JSON.stringify({ DEV: false, MODE: 'test', ...entorno }) },
    plugins: [
      {
        name: 'portales-en-su-sitio',
        setup(b) {
          b.onResolve({ filter: /^react-dom$/ }, () => ({ path: 'react-dom', namespace: 'portales' }))
          b.onLoad({ filter: /.*/, namespace: 'portales' }, () => ({ contents: `const real = require(${JSON.stringify(realReactDom)}); module.exports = { ...real, createPortal: (children) => children }`, loader: 'js', resolveDir: process.cwd() }))
        },
      },
    ],
  })
  return createRequire(import.meta.url)(salida).M
}

const almacen = () => {
  const mapa = new Map()
  return { getItem: (k) => mapa.get(k) ?? null, setItem: (k, v) => mapa.set(k, String(v)), removeItem: (k) => mapa.delete(k), key: (i) => [...mapa.keys()][i] ?? null, get length() { return mapa.size } }
}
globalThis.window = { location: { search: '', hash: '', pathname: '/', origin: 'http://localhost', href: 'http://localhost/' }, sessionStorage: almacen(), localStorage: almacen(), addEventListener() {}, removeEventListener() {}, setInterval, clearInterval }
globalThis.document = { body: {}, createElement: () => ({}), documentElement: { style: {}, classList: { toggle() {}, add() {}, remove() {} } }, addEventListener() {}, removeEventListener() {} }
globalThis.localStorage = globalThis.window.localStorage
globalThis.sessionStorage = globalThis.window.sessionStorage

const apagado = await empaquetar('apagado', {})
const encendido = await empaquetar('encendido', { VITE_CUENTAS_ACTIVAS: 'true' })

/* ═══════════════ PARTE 1 · Entrar en la cuenta ═══════════════ */
console.log('1. Entrar en la cuenta (A1 a A4, I1, I2, P7b)')
{
  const M = encendido
  const entrar = M.pintaEntrar()
  debe(entrar.includes(M.marca.nombre), 'marca', 'el nombre de la pantalla de entrar sale de data/marca.json')
  debe(/Continuar con Google/.test(entrar) && /Entrar con mi email/.test(entrar), 'A1', 'A1 ofrece [Continuar con Google] y [Entrar con mi email]')
  debe(/Privacidad y condiciones/.test(entrar), 'A1', 'A1 lleva «Privacidad y condiciones»')
  // (Tanda 10: arriba solo la palabra JUTRIP, sin estrella ni recuadro: ya no hay hueco del logo.)
  debe(/data-nombre-app/.test(entrar) && /data-palabra-jutrip/.test(entrar) && !/data-logo-hueco/.test(entrar) && (entrar.match(/<svg/g) ?? []).length <= 1, 'A1', 'arriba solo la palabra JUTRIP (Tanda 10E: con la estrella sobre la I, una sola): sin recuadro')
  debe(!/Seguir sin cuenta|solo para pruebas|Pantalla provisional/i.test(entrar), 'A1', 'la cuenta se pide al empezar: no hay «seguir sin cuenta»')
  debe(!/Apple/.test(entrar), 'A1', 'Apple no sale (más adelante, con las tiendas)')
  const a2 = M.pintaEntrar({ pasoInicial: 'email' })
  debe(/Entra con tu email/.test(a2) && /Enviarme el enlace/.test(a2) && /tu@email\.com/.test(a2), 'A2', 'A2 pide el email y tiene [Enviarme el enlace]')
  const a3 = M.pintaEntrar({ pasoInicial: 'enviado', emailInicial: 'elena@correo.es' })
  debe(/Te hemos enviado un enlace a elena@…/.test(a3.replace(/&#x27;/g, "'")) || /Te hemos enviado un enlace a elena@/.test(a3), 'A3', 'A3 dice a qué email se ha mandado el enlace')
  debe(/Abrir mi correo/.test(a3) && /¿No te llega\? Enviar otra vez/.test(a3), 'A3', 'A3 tiene [Abrir mi correo] y «¿No te llega? Enviar otra vez»')
  debe(/Ábrelo desde este móvil para entrar/.test(a3), 'A3', 'A3 explica dónde abrirlo')
  debe(/<button[^>]*disabled=""[^>]*data-enlace-hoja="reenviar"/.test(a3) && /Puedes pedir otro en \d+ s/.test(a3), 'A3', 'recién enviado, «Enviar otra vez» no deja pedir otro hasta pasado un rato')

  // El reenvío: no se puede pedir otro hasta pasado un minuto.
  const t0 = 1_000_000
  debe(M.esperaRestante(null, t0) === 0, 'reenvio', 'si nunca se ha mandado, se puede mandar ya')
  debe(M.esperaRestante(t0, t0 + 10_000) === M.ESPERA_REENVIO_MS - 10_000, 'reenvio', 'a los 10 s faltan 50 s')
  debe(M.esperaRestante(t0, t0 + M.ESPERA_REENVIO_MS) === 0, 'reenvio', 'pasado el minuto, se puede pedir otro')
  debe(M.textoDeEspera(45_000) === 'Puedes pedir otro en 45 s' && M.textoDeEspera(100) === 'Puedes pedir otro en 1 s', 'reenvio', 'el texto de la espera redondea hacia arriba')
  debe(M.enlaceDeCorreo('a@gmail.com').startsWith('https://mail.google.com') && M.enlaceDeCorreo('a@hotmail.com').includes('outlook') && M.enlaceDeCorreo('a@empresa.es') === 'mailto:', 'correo', '[Abrir mi correo] abre la bandeja de los servicios conocidos y, si no, el correo del móvil')
  debe(M.emailResumido('elena@correo.es') === 'elena@…', 'correo', 'el email se enseña como «elena@…»')

  // La puerta: apagada no pinta nada; encendida y cargando, tampoco (no tapa la app sin saber quién eres).
  debe(apagado.pintaPuerta() === '' && encendido.pintaPuerta() === '', 'puerta', 'la puerta no pinta nada apagada ni cargando')

  // P7b: lo que ve quien recibe el enlace.
  const vista = { valida: true, destino: 'Roma', invitador: 'Laura', inicio: '2026-10-16', fin: '2026-10-19', con_pase: true }
  const p7b = M.pintaInvitacion(vista)
  debe(/Laura te invita a su /.test(p7b) && /Pase de Roma/.test(p7b), 'P7b', '«Laura te invita a su Pase de Roma»')
  debe(/Sin pagar nada/.test(p7b) && />Unirme</.test(p7b), 'P7b', 'P7b dice «Sin pagar nada» y tiene [Unirme]')
  debe(/Roma · 16 – 19 oct 2026/.test(p7b), 'P7b', 'P7b lleva el destino y las fechas («Roma · 16 – 19 oct 2026»)')
  debe(/>L</.test(p7b), 'P7b', 'P7b lleva la inicial de quien invita')
  debe(!/Sin pagar nada/.test(M.pintaInvitacion({ ...vista, con_pase: false })) && /te invita a su viaje a Roma/.test(M.pintaInvitacion({ ...vista, con_pase: false })), 'P7b', 'sin pase no dice «Sin pagar nada» y habla del viaje')
  debe(/Alguien te invita/.test(M.titularDeInvitacion({ valida: true, destino: 'Roma', invitador: null, con_pase: true })), 'P7b', 'sin nombre puesto, «Alguien te invita…»')
  debe(/se ha anulado/.test(M.pintaInvitacion({ valida: false, motivo: 'anulada' })) && />Seguir</.test(M.pintaInvitacion({ valida: false, motivo: 'anulada' })), 'P7b', 'una invitación anulada lo dice y deja seguir')
  debe(/<em[^>]*data-pase-resaltado/.test(M.pintaTextoPase('Con el Pase de Florencia, tu primer día')), 'P7b', 'el «Pase de …» se resalta con cualquier destino')

  // La invitación solo se canjea si se acepta con [Unirme].
  M.olvidarInvitacionPendiente()
  M.guardarInvitacionPendiente('abcd2345')
  debe(M.invitacionPendiente() === 'ABCD2345' && M.invitacionAceptada() === false, 'P7b', 'abrir el enlace guarda el código sin aceptarlo: no mete a nadie en un viaje')
  M.aceptarInvitacionPendiente()
  debe(M.invitacionAceptada() === true, 'P7b', '[Unirme] la deja aceptada')
  M.guardarInvitacionPendiente('ZZZZ9999')
  debe(M.invitacionAceptada() === false, 'P7b', 'un enlace nuevo no hereda la aceptación del anterior')
  M.olvidarInvitacionPendiente()
  debe(M.invitacionPendiente() === null && M.invitacionAceptada() === false, 'P7b', 'al terminar se olvida todo')

  // Privacidad y condiciones.
  const priv = M.pintaPrivacidad()
  const ids = M.APARTADOS_DE_PRIVACIDAD.map((a) => a.id)
  debe(ids.includes('condiciones'), 'privacidad', 'hay un apartado de condiciones de uso y de compra')
  debe((priv.match(/Texto pendiente/g) ?? []).length === ids.length, 'privacidad', 'cada apartado dice «Texto pendiente» (también el nuevo)')
  debe(M.SERVICIOS_DE_FUERA.some((s) => s.nombre === 'Stripe'), 'privacidad', 'el servicio de pago está en la lista de servicios')
  debe(/Privacidad y condiciones/.test(priv), 'privacidad', 'la página se llama «Privacidad y condiciones»')

  // La marca viene de data/marca.json; el HTML de arranque (título y pantalla al abrir) la recibe del mismo sitio.
  const marcaJson = JSON.parse(fs.readFileSync('data/marca.json', 'utf8'))
  debe(M.marca.nombre === marcaJson.nombre && marcaJson.logo === '/marca/logo-jutrip.svg', 'marca', 'la marca sale de data/marca.json, con el logo de JUTRIP (Tanda 10)')
  const html = fs.readFileSync('index.html', 'utf8')
  debe(html.includes('%MARCA_NOMBRE%') && !html.includes(marcaJson.nombre) && html.includes('id="apertura"'), 'I2', 'index.html no lleva el nombre escrito: lo pone data/marca.json; la pantalla al abrir está')
  const vite = fs.readFileSync('vite.config.ts', 'utf8')
  debe(/marca\.json/.test(vite) && /MARCA_NOMBRE/.test(vite), 'I2', 'vite.config.ts pone la marca en el título y en la pantalla al abrir')
  const servidor = fs.readFileSync('server/index.js', 'utf8')
  debe(/background_color: marca\.color_apertura/.test(servidor), 'I2', 'el manifiesto usa el fondo de la pantalla al abrir de data/marca.json')
  // Ningún texto de pantalla de las cuentas lleva el nombre de la app escrito a mano.
  const archivos = ['EntrarCuenta.tsx', 'InvitacionRecibida.tsx', 'PuertaDeCuenta.tsx'].map((f) => fs.readFileSync(`src/components/cuenta/${f}`, 'utf8')).join('\n')
  debe(!new RegExp(`\\b(${marcaJson.nombre}|Trazo)\\b`).test(archivos.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/trazo:/g, '')), 'marca', 'las pantallas de entrar no llevan el nombre de la app escrito a mano')
}

/* ═══════════════ La base de datos (PGlite con las migraciones de verdad) ═══════════════ */
console.log('0. Las migraciones se aplican (hasta la 0027)')
const bd = await crearBaseDePrueba({ alFallar: (m) => debe(false, 'migracion', m) })
const { q, como, servidor, nuevoUsuario } = bd
debe(bd.aplicadas.includes('0026_cuentas_3.sql'), 'migracion', 'la migración 0026 existe y se aplica sobre las anteriores')
debe(bd.aplicadas.includes('0027_cuentas_3b.sql'), 'migracion', 'la migración 0027 existe y se aplica sobre la 0026')
const rutaDe = (destino = 'Roma', inicio = '2026-10-16', fin = '2026-10-19') => JSON.stringify({ id: 'r-' + destino, destination: destino, answers: { dateRange: { start: inicio, end: fin } }, days: [] })

console.log('1b. Lo que se ve de una invitación antes de entrar (P7b)')
const laura = await nuevoUsuario('laura@correo.es', false, 'Laura García')
const elena = await nuevoUsuario('elena@correo.es', false, 'Elena')
const viajeLaura = await como(laura, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [laura, rutaDe()]))[0].id)
{
  const inv = await como(laura, async () => (await q('select public.crear_invitacion($1, null, 1) as r', [viajeLaura]))[0].r)
  const vista = await como(elena, async () => (await q('select public.ver_invitacion($1) as v', [inv.codigo]))[0].v, { anonimo: true })
  debe(vista.valida === true && vista.destino === 'Roma' && vista.inicio === '2026-10-16' && vista.fin === '2026-10-19', 'P7b', 'la invitación dice el destino y las fechas')
  debe(vista.invitador === 'Laura', 'P7b', 'dice el nombre de pila de quien invita («Laura», no «Laura García»)')
  debe(vista.con_pase === false, 'P7b', 'sin pase, no va con pase')
  debe(Object.keys(vista).every((k) => ['valida', 'destino', 'invitador', 'inicio', 'fin', 'con_pase', 'motivo'].includes(k)), 'P7b', 'no cuenta nada más del viaje ni de las personas')
  const sinNombre = await nuevoUsuario('sin@correo.es', false, null)
  const viajeSin = await como(sinNombre, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [sinNombre, rutaDe('Lisboa')]))[0].id)
  const inv2 = await como(sinNombre, async () => (await q('select public.crear_invitacion($1, null, 1) as r', [viajeSin]))[0].r)
  const v2 = await como(elena, async () => (await q('select public.ver_invitacion($1) as v', [inv2.codigo]))[0].v)
  debe(v2.invitador === null && v2.destino === 'Lisboa', 'P7b', 'sin nombre puesto, el nombre sale vacío (la app dice «Alguien»)')
  await como(laura, () => q('select public.anular_invitacion($1)', [inv.id]))
  const anulada = await como(elena, async () => (await q('select public.ver_invitacion($1) as v', [inv.codigo]))[0].v)
  debe(anulada.valida === false && anulada.motivo === 'anulada' && anulada.destino === 'Roma', 'P7b', 'una invitación anulada lo dice y sigue enseñando el destino')
  const noExiste = await como(elena, async () => (await q("select public.ver_invitacion('NOEXISTE') as v"))[0].v)
  debe(noExiste.valida === false && noExiste.motivo === 'no_existe', 'P7b', 'un código que no existe no vale')
}

/* ═══════════════ PARTE 2 · El Pase y el cobro ═══════════════ */
console.log('2. El cobro del Pase (Stripe de mentira, firma comprobada de verdad)')
const { crearAdminDePrueba } = await import('./_baseDeDatosPrueba.mjs')
const pagos = await import('../../server/pagos.js')
const { borrarCuenta } = await import('../../server/cuentas.js')
const express = (await import('express')).default
const fichas = new Map()
const admin = crearAdminDePrueba(bd, fichas)
const preciosPase = JSON.parse(fs.readFileSync('data/pase/precios.json', 'utf8'))
{
  // Los interruptores: sin las claves, todo abierto.
  debe(pagos.cobroListo({ PASES_COBRO_ACTIVO: 'true' }) === false, 'cobro', 'con el interruptor pero SIN claves de Stripe, el cobro no está listo: todo abierto')
  debe(pagos.cobroListo({ STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: 'whsec_x' }) === false, 'cobro', 'con las claves pero con el interruptor apagado, todo abierto')
  debe(pagos.cobroListo({ PASES_COBRO_ACTIVO: 'true', STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: 'whsec_x' }) === true, 'cobro', 'interruptor y claves: el cobro está listo')
  debe(pagos.cobroListo({ PASES_COBRO_ACTIVO: 'true', STRIPE_SECRET_KEY: 'sk_test_x' }) === false, 'cobro', 'sin el secreto del aviso tampoco (no se podría confirmar ningún pago)')
  debe(pagos.modoDePago({ PAGO_DE_MENTIRA: 'true' }) === 'mentira' && pagos.modoDePago({ PAGO_DE_MENTIRA: 'true', VERCEL: '1' }) === null && pagos.modoDePago({ PAGO_DE_MENTIRA: 'true', NODE_ENV: 'production' }) === null, 'cobro', 'el pago de mentira no existe en producción ni en Vercel')
  const abierto = await import('../../server/logros/pase.js')
  debe(abierto.puedeGanarLogros({ cobro: false, destino: 'Roma', tripId: 't', fecha: '2026-10-16' }).puede === true, 'cobro', 'con el cobro apagado, siempre se puede ganar logros (todo abierto)')

  // La firma del aviso.
  const cuerpo = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed' })
  const ahoraS = 1_800_000_000
  const buena = pagos.firmarAvisoStripe(cuerpo, 'whsec_x', ahoraS)
  debe(pagos.verificarAvisoStripe(cuerpo, buena, 'whsec_x', { ahoraS }).id === 'evt_1', 'firma', 'una firma buena se acepta')
  const cae = (fn) => {
    try {
      fn()
      return false
    } catch {
      return true
    }
  }
  debe(cae(() => pagos.verificarAvisoStripe(cuerpo, buena, 'whsec_otro', { ahoraS })), 'firma', 'con otro secreto, se rechaza')
  debe(cae(() => pagos.verificarAvisoStripe(cuerpo + ' ', buena, 'whsec_x', { ahoraS })), 'firma', 'con el cuerpo cambiado (un espacio), se rechaza: se comprueba tal cual')
  debe(cae(() => pagos.verificarAvisoStripe(cuerpo, buena, 'whsec_x', { ahoraS: ahoraS + 600 })), 'firma', 'una firma de hace 10 minutos se rechaza')
  debe(cae(() => pagos.verificarAvisoStripe(cuerpo, '', 'whsec_x', { ahoraS })) && cae(() => pagos.verificarAvisoStripe(cuerpo, 't=abc,v1=00', 'whsec_x', { ahoraS })), 'firma', 'sin firma o con una firma rota, se rechaza')
  debe(cae(() => pagos.verificarAvisoStripe(undefined, buena, 'whsec_x', { ahoraS })), 'firma', 'sin cuerpo, se rechaza')
  debe(pagos.verificarAvisoStripe(Buffer.from(cuerpo), buena, 'whsec_x', { ahoraS }).type === 'checkout.session.completed', 'firma', 'el cuerpo como bytes (lo que guarda el servidor) también vale')
  const f = pagos.aFormularioStripe({ a: 1, b: { c: 'x y' }, l: [{ q: 2 }], n: undefined }).toString()
  debe(f === 'a=1&b%5Bc%5D=x+y&l%5B0%5D%5Bq%5D=2', 'firma', `el formulario de Stripe se aplana bien: ${f}`)
}

// El servicio, con el pago de mentira y la base de verdad.
const comprador = await nuevoUsuario('carla@correo.es', false, 'Carla Ruiz')
const viajeCarla = await como(comprador, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [comprador, rutaDe('Roma', '2026-10-16', '2026-10-19')]))[0].id)
fichas.set('tok-carla', comprador)
const anonimo = await nuevoUsuario(null, true)
fichas.set('tok-anonimo', anonimo)
const pasarela = pagos.pasarelaDeMentira({ origen: 'http://localhost:5173' })
const servicio = pagos.crearServicioPagos({ admin, precios: preciosPase, destinos: ['Roma'], pasarela, log: { error() {} } })
const usuarioCarla = { id: comprador, email: 'carla@correo.es', is_anonymous: false }
{
  debe(servicio.config().cobro === true && servicio.config().modo === 'mentira', 'config', 'la configuración dice que se cobra y cómo')
  const sinPasarela = pagos.crearServicioPagos({ admin, precios: preciosPase, destinos: ['Roma'], pasarela: null })
  debe(sinPasarela.config().cobro === false && (await sinPasarela.crearPago(usuarioCarla, { destino: 'Roma', plan: 'uno' }, 'http://x')).estado === 503, 'config', 'sin pasarela (sin claves) no se cobra ni se abre la compra')
  debe((await servicio.crearPago({ id: anonimo, is_anonymous: true }, { destino: 'Roma', plan: 'uno' }, 'http://x')).estado === 403, 'crear', 'una sesión anónima no puede pagar: primero la cuenta')
  debe((await servicio.crearPago(usuarioCarla, { destino: 'Narnia', plan: 'uno' }, 'http://x')).estado === 400, 'crear', 'un destino sin pase no se vende')
  debe((await servicio.crearPago(usuarioCarla, { destino: 'Roma', plan: 'gratis' }, 'http://x')).estado === 400, 'crear', 'un plan inventado no vale')
  debe((await servicio.crearPago(usuarioCarla, { destino: 'Roma', plan: 'grupo', personas: 2 }, 'http://x')).estado === 400 && (await servicio.crearPago(usuarioCarla, { destino: 'Roma', plan: 'grupo', personas: 51 }, 'http://x')).estado === 400, 'crear', 'el Grupo es de 3 a 50 personas (el máximo sale de data/pase/precios.json)')
  debe((await servicio.crearPago(usuarioCarla, { destino: 'Roma', plan: 'uno' }, null)).estado === 500, 'crear', 'sin dirección de vuelta (APP_URL) no se crea el cobro')
  // El precio lo pone el servidor.
  const uno = await servicio.crearPago(usuarioCarla, { destino: 'roma', plan: 'uno', precio: 0.01, importe: 1, total: 1, trip_id: viajeCarla }, 'http://localhost:5173')
  const s1 = pasarela.sesiones.get(uno.cuerpo.sesion)
  debe(uno.estado === 200 && s1.importe_cent === 699 && uno.cuerpo.precio.total === 6.99, 'precio', 'el precio lo pone el servidor (6,99 €) aunque el móvil mande otro')
  debe(s1.metadata.pase === '1' && s1.metadata.uid === comprador && s1.metadata.destino === 'Roma' && s1.metadata.trip_id === viajeCarla, 'crear', 'el cobro lleva quién compra, el destino (como lo escribe el servidor) y el viaje')
  const duo = await servicio.crearPago(usuarioCarla, { destino: 'Roma', plan: 'duo', trip_id: viajeCarla }, 'http://localhost:5173')
  debe(pasarela.sesiones.get(duo.cuerpo.sesion).importe_cent === 1099 && duo.cuerpo.precio.por_persona === 5.5, 'precio', 'el Pase Dúo cuesta 10,99 € (5,50 € cada uno)')
  const grupo = await servicio.crearPago(usuarioCarla, { destino: 'Roma', plan: 'grupo', personas: 4 }, 'http://localhost:5173')
  debe(pasarela.sesiones.get(grupo.cuerpo.sesion).importe_cent === 1996, 'precio', 'el Pase Grupo de 4 cuesta 4 × 4,99 € = 19,96 €')
  debe(/^http:\/\/localhost:5173\/\?pago=mentira&sesion=mock_cs_/.test(uno.cuerpo.url), 'crear', 'el pago de mentira lleva a su propia página de pruebas')

  // Pago rechazado: no hay pase.
  const rech = pasarela.eventoDe(uno.cuerpo.sesion, 'rechazado')
  debe(rech === null, 'rechazado', 'un pago rechazado no genera ningún aviso (no se pagó nada)')
  debe((await q('select 1 from public.passes')).length === 0 && (await servicio.estadoDeSesion(usuarioCarla, uno.cuerpo.sesion)).rechazado === true, 'rechazado', 'rechazado: ningún pase y la app puede decirlo')

  // Pago bueno: el pase lo crea el servidor.
  const evBueno = pasarela.eventoDe(duo.cuerpo.sesion, 'bueno')
  const r1 = await servicio.procesarEvento(evBueno)
  debe(r1.accion === 'pase_creado' && r1.pase_id, 'bueno', 'el pago bueno crea el pase')
  const pase = (await q('select * from public.passes where id = $1', [r1.pase_id]))[0]
  debe(pase.tipo === 'duo' && pase.usos_max === 2 && pase.usos_usados === 1 && pase.comprador_id === comprador && pase.destino === 'Roma' && pase.estado === 'activo' && pase.trip_id === viajeCarla, 'bueno', 'un Dúo: 2 plazas, la primera ocupada por quien compra, y el viaje para el que se compró')
  debe((await q('select user_id from public.pass_members where pass_id = $1', [pase.id])).map((x) => x.user_id).join() === comprador, 'bueno', 'quien compra está dentro de su pase')
  const reg = (await q('select * from public.pagos_registro'))[0]
  debe(reg.importe_cent === 1099 && reg.estado === 'pagado' && reg.proveedor === 'mentira' && reg.plan === 'duo' && reg.personas === 2 && reg.moneda === 'eur', 'bueno', 'el cobro queda registrado con su importe')
  // El mismo aviso otra vez: un solo pase.
  const r2 = await servicio.procesarEvento(evBueno)
  debe(r2.accion === 'repetido' && r2.pase_id === pase.id, 'repetido', 'el mismo aviso otra vez no crea otro pase')
  debe((await q('select 1 from public.passes')).length === 1 && (await q('select 1 from public.pagos_registro')).length === 1, 'repetido', 'un solo pase y un solo registro tras repetir el aviso')
  await servicio.procesarEvento(evBueno)
  await servicio.procesarEvento({ ...evBueno, id: 'evt_otro_id_mismo_pago' })
  debe((await q('select 1 from public.passes')).length === 1, 'repetido', 'ni con el aviso repetido varias veces (ni con otro id de aviso para el mismo pago)')
  // Pagos con datos raros.
  debe((await servicio.procesarEvento({ type: 'checkout.session.completed', data: { object: { id: 'cs_x', payment_status: 'unpaid', metadata: { pase: '1' } } } })).accion === 'esperando_el_pago', 'bueno', 'un pago que aún no se ha cobrado (unpaid) no crea pase')
  debe((await servicio.procesarEvento({ type: 'checkout.session.completed', data: { object: { id: 'cs_y', payment_status: 'paid', metadata: { cosa: 'otra' } } } })).accion === 'no_es_un_pase', 'bueno', 'un cobro que no es de un pase se ignora')
  debe((await servicio.procesarEvento({ type: 'checkout.session.completed', data: { object: { id: 'cs_z', payment_status: 'paid', metadata: { pase: '1', uid: comprador, destino: 'Roma', plan: 'grupo', personas: '1' } } } })).accion === 'datos_no_validos', 'bueno', 'datos de pase que no valen no crean nada')
  debe((await q('select 1 from public.passes')).length === 1, 'bueno', 'ninguno de los avisos raros creó un pase')
  debe((await servicio.procesarEvento({ type: 'payment_intent.created', data: { object: {} } })).accion === 'ignorado', 'bueno', 'los avisos de otros tipos se ignoran')

  // Ya tiene el pase de Roma: no se cobra dos veces.
  const otra = await servicio.crearPago(usuarioCarla, { destino: 'Roma', plan: 'uno' }, 'http://localhost:5173')
  debe(otra.estado === 409 && otra.cuerpo.ya_tienes === true, 'ya_tienes', 'con el Pase de Roma ya comprado no se vuelve a cobrar: el pase es del destino, para siempre')

  // Paga todo el que compra: el invitado entra con su plaza sin pagar.
  const dani = await nuevoUsuario('dani@correo.es', false, 'Dani')
  const inv = await como(comprador, async () => (await q('select public.crear_invitacion($1, $2, 1) as r', [viajeCarla, pase.id]))[0].r)
  debe(inv.usos_max === 1, 'plazas', 'la invitación del Dúo deja una plaza (la otra es de quien compra)')
  const entra = await como(dani, async () => (await q('select public.canjear_invitacion($1) as r', [inv.codigo]))[0].r)
  debe(entra.con_pase === true && entra.ya_estaba === false, 'plazas', 'quien entra con el enlace entra con su plaza del pase')
  debe((await q('select usos_usados from public.passes where id = $1', [pase.id]))[0].usos_usados === 2 && (await q('select 1 from public.pagos_registro')).length === 1, 'plazas', 'el Dúo queda completo (2 de 2) y el invitado no paga nada (un solo cobro)')
  const eve = await nuevoUsuario('eve@correo.es', false, 'Eve')
  const sinSitio = await como(eve, () => lanza(() => q('select public.canjear_invitacion($1)', [inv.codigo])))
  debe(sinSitio !== null && /Ya no quedan/.test(sinSitio), 'plazas', 'con el Dúo completo, un tercero no entra')
  const delInvitado = await servicio.pasesDe({ id: dani })
  debe(delInvitado.pases.length === 1 && delInvitado.pases[0].es_mio === false && delInvitado.pases[0].importe_cent == null && delInvitado.pases[0].invitacion == null && !('pago_ref' in delInvitado.pases[0]), 'mis_pases', 'el invitado ve su pase, sin precio, sin código ni datos del cobro')
  // El Grupo: 4 plazas, 3 invitados.
  const ana2 = await nuevoUsuario('ana2@correo.es', false, 'Ana')
  const viajeAna2 = await como(ana2, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [ana2, rutaDe()]))[0].id)
  const g = pasarela.eventoDe((await servicio.crearPago({ id: ana2, email: 'ana2@correo.es' }, { destino: 'Roma', plan: 'grupo', personas: 4, trip_id: viajeAna2 }, 'http://localhost:5173')).cuerpo.sesion, 'bueno')
  const rg = await servicio.procesarEvento(g)
  const pg = (await q('select * from public.passes where id = $1', [rg.pase_id]))[0]
  debe(pg.tipo === 'grupo' && pg.usos_max === 4 && pg.usos_usados === 1 && pg.trip_id === viajeAna2, 'grupo', 'un Grupo de 4: 4 plazas, 1 ocupada por quien compra, y el viaje para el que se compró')
  const invG = await como(ana2, async () => (await q('select public.crear_invitacion($1, $2, 1) as r', [viajeAna2, pg.id]))[0].r)
  debe(invG.usos_max === 3, 'grupo', 'la invitación del Grupo de 4 deja 3 plazas')
  for (const n of ['g1', 'g2', 'g3']) await como(await nuevoUsuario(`${n}@correo.es`, false, n), () => q('select public.canjear_invitacion($1)', [invG.codigo]))
  const cuarto = await como(await nuevoUsuario('g4@correo.es', false, 'g4'), () => lanza(() => q('select public.canjear_invitacion($1)', [invG.codigo])))
  debe(/Ya no quedan/.test(cuarto ?? ''), 'grupo', 'con el Grupo completo, el quinto no entra')
  const reparto = (await import('../../server/logros/pase.js')).repartoDelPago(preciosPase, { plan: 'grupo', personas: 4, comprador: ana2, invitados: ['g1', 'g2', 'g3'] })
  debe(reparto[0].paga === 19.96 && reparto.slice(1).every((x) => x.paga === 0), 'paga', 'paga todo el que compra: 19,96 € de quien compra y 0 de los invitados')

  // Mis pases y el recibo.
  const mios = await servicio.pasesDe(usuarioCarla)
  const p0 = mios.pases[0]
  debe(mios.pases.length === 1 && p0.tipo === 'duo' && p0.destino === 'Roma' && p0.estado === 'activo' && p0.importe_cent === 1099 && p0.es_mio === true && p0.tiene_recibo === true && p0.usos_usados === 2, 'mis_pases', 'Mis pases: tipo, destino, estado, precio, plazas y recibo')
  debe(p0.miembros.length === 2 && p0.miembros[0].es_comprador === true && p0.miembros[0].nombre === 'Carla' && p0.miembros[1].nombre === 'Dani', 'mis_pases', 'con quién lo comparte: los nombres de pila')
  debe(p0.invitacion?.codigo === inv.codigo && /^[A-Z2-9]{8}$/.test(p0.invitacion.codigo) && !/[OILol01]/.test(p0.invitacion.codigo), 'mis_pases', 'el código para invitar, en el formato de siempre (8 caracteres sin 0, O, 1, I, L)')
  debe(p0.viaje?.id === viajeCarla && p0.viaje.inicio === '2026-10-16' && p0.viaje.fin === '2026-10-19', 'mis_pases', 'el viaje para el que se compró, con sus fechas')
  const rc = await servicio.recibo(usuarioCarla, p0.id)
  debe(rc.estado === 200 && /^https:\/\/recibo\.invalid\//.test(rc.cuerpo.url), 'recibo', '[Ver recibo] da el recibo del servicio de pago')
  debe((await servicio.recibo({ id: dani }, p0.id)).estado === 404, 'recibo', 'el recibo solo lo ve quien pagó')
  debe((await q('select recibo_url from public.pagos_registro where pago_ref = $1', [duo.cuerpo.sesion]))[0].recibo_url === rc.cuerpo.url, 'recibo', 'el recibo se guarda la primera vez')

  // Devolución: el pase se anula y lo ganado se queda.
  await servidor(() => q("insert into public.achievements (user_id, destino, logro, escalon) values ($1, 'roma', 'sello', '1')", [comprador]))
  const parcial = await servicio.procesarEvento({ type: 'charge.refunded', data: { object: { payment_intent: pasarela.sesiones.get(duo.cuerpo.sesion).intencion, refunded: false, amount: 1099, amount_refunded: 500 } } })
  debe(parcial.accion === 'devolucion_parcial' && (await q('select estado from public.passes where id = $1', [pase.id]))[0].estado === 'activo', 'devuelto', 'una devolución parcial no anula el pase')
  const desconocida = await servicio.procesarEvento({ type: 'charge.refunded', data: { object: { payment_intent: 'pi_de_otro', refunded: true, amount: 1, amount_refunded: 1 } } })
  const aunNo = await servicio.procesarEvento({ type: 'charge.refunded', data: { object: { payment_intent: 'pi_aun_no', refunded: true, amount: 1, amount_refunded: 1, metadata: { pase: '1' } } } })
  debe(desconocida.accion === 'no_es_nuestro' && desconocida.ok === true && aunNo.ok === false && aunNo.reintentar === true, 'devuelto', 'una devolución de otro cobro se ignora; la de un cobro nuestro aún no registrado pide que Stripe la repita')
  const evDev = pasarela.eventoDe(duo.cuerpo.sesion, 'devuelto')
  const rd = await servicio.procesarEvento(evDev)
  debe(rd.accion === 'pase_anulado' && rd.pases_anulados === 1, 'devuelto', 'devuelto el pago, el pase se anula')
  debe((await q('select estado, anulado_en from public.passes where id = $1', [pase.id]))[0].estado === 'anulado' && (await q('select estado from public.pagos_registro where pago_ref = $1', [duo.cuerpo.sesion]))[0].estado === 'devuelto', 'devuelto', 'el pase y el registro quedan como devueltos')
  debe((await q('select anulada_en from public.trip_invitations where id = $1', [inv.id]))[0].anulada_en !== null, 'devuelto', 'las invitaciones de ese pase dejan de valer')
  debe((await q('select 1 from public.achievements where user_id = $1', [comprador])).length === 1, 'devuelto', 'lo ganado no se pierde nunca: el logro sigue')
  const rd2 = await servicio.procesarEvento(evDev)
  debe(rd2.ok === true && (await q("select 1 from public.passes where estado = 'anulado'")).length === 1, 'devuelto', 'la devolución repetida no hace nada más')
  const tras = await servicio.pasesDe(usuarioCarla)
  debe(tras.pases[0].estado === 'anulado', 'devuelto', 'Mis pases lo enseña como anulado')
  debe(/eq\('estado', 'activo'\)/.test(fs.readFileSync('server/logros/repo.js', 'utf8')), 'devuelto', 'los logros solo cuentan los pases activos')
  const estadoSesion = await servicio.estadoDeSesion(usuarioCarla, duo.cuerpo.sesion)
  debe(estadoSesion.listo === false && estadoSesion.devuelto === true, 'devuelto', 'la app puede saber que ese pago se devolvió')
  // Se puede volver a comprar tras una devolución.
  debe((await servicio.crearPago(usuarioCarla, { destino: 'Roma', plan: 'uno' }, 'http://localhost:5173')).estado === 200, 'devuelto', 'tras una devolución se puede volver a comprar el pase')
}

// El aviso de Stripe de verdad, por HTTP, con la firma.
{
  const llamadas = []
  const fetchFalso = async (url, op) => {
    llamadas.push({ url, op })
    if (/checkout\/sessions$/.test(url)) return { ok: true, status: 200, json: async () => ({ id: 'cs_test_123', url: 'https://checkout.stripe.test/c/pay/cs_test_123' }) }
    return { ok: true, status: 200, json: async () => ({ latest_charge: { receipt_url: 'https://pay.stripe.test/receipts/abc' } }) }
  }
  const stripe = pagos.pasarelaStripe({ clave: 'sk_test_clave', secretoAviso: 'whsec_prueba', fetchFn: fetchFalso })
  const servicioS = pagos.crearServicioPagos({ admin, precios: preciosPase, destinos: ['Roma'], pasarela: stripe, log: { error() {} } })
  const lola = await nuevoUsuario('lola@correo.es', false, 'Lola')
  fichas.set('tok-lola', lola)
  const app = express()
  app.use(express.json({ limit: '6mb', verify: (req, _res, buf) => { if (req.originalUrl?.startsWith('/api/pago/webhook')) req.rawBody = buf } }))
  pagos.registrarRutasPagos(app, { admin, servicio: servicioS, env: { APP_URL: 'https://app.ejemplo.es' } })
  const servidorHttp = await new Promise((ok) => {
    const s = app.listen(0, () => ok(s))
  })
  const base = `http://127.0.0.1:${servidorHttp.address().port}`
  const llama = async (ruta, { metodo = 'GET', token, cuerpo, cabeceras = {}, crudo } = {}) => {
    const r = await fetch(base + ruta, { method: metodo, headers: { ...(cuerpo ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...cabeceras }, body: crudo ?? (cuerpo ? JSON.stringify(cuerpo) : undefined) })
    return { estado: r.status, json: await r.json().catch(() => null) }
  }
  const cfg = await llama('/api/pase/config')
  debe(cfg.json.cobro === true && cfg.json.modo === 'stripe' && cfg.json.precios.planes.length === 3, 'http', 'GET /api/pase/config dice que se cobra y trae los precios')
  debe((await llama('/api/pago/crear', { metodo: 'POST', cuerpo: { destino: 'Roma', plan: 'uno' } })).estado === 401, 'http', 'sin sesión, no se puede crear un cobro')
  const crear = await llama('/api/pago/crear', { metodo: 'POST', token: 'tok-lola', cuerpo: { destino: 'Roma', plan: 'duo', precio: 1 } })
  debe(crear.estado === 200 && crear.json.url === 'https://checkout.stripe.test/c/pay/cs_test_123' && crear.json.sesion === 'cs_test_123', 'http', 'POST /api/pago/crear devuelve la página de pago de Stripe')
  const formulario = new URLSearchParams(String(llamadas[0].op.body))
  debe(formulario.get('line_items[0][price_data][unit_amount]') === '1099' && formulario.get('line_items[0][price_data][currency]') === 'eur' && formulario.get('mode') === 'payment' && formulario.get('customer_email') === 'lola@correo.es' && formulario.get('locale') === 'es', 'http', 'a Stripe se le manda el importe del servidor (1099 céntimos), en euros, en español y con el email del recibo')
  debe(formulario.get('success_url') === 'https://app.ejemplo.es/?pago=ok&sesion={CHECKOUT_SESSION_ID}' && formulario.get('cancel_url') === 'https://app.ejemplo.es/?pago=cancelado', 'http', 'vuelve a la app por la dirección del servidor (APP_URL), no por la que mande el móvil')
  debe(llamadas[0].op.headers.Authorization === 'Bearer sk_test_clave' && !/sk_test_clave/.test(JSON.stringify(crear.json)), 'http', 'la clave de Stripe solo va del servidor a Stripe; el móvil no la ve')
  debe(formulario.get('metadata[uid]') === lola && formulario.get('metadata[pase]') === '1' && formulario.get('payment_intent_data[metadata][plan]') === 'duo', 'http', 'el cobro lleva sus datos (quién, qué) también en el pago, para la devolución')

  const evento = { id: 'evt_real_1', type: 'checkout.session.completed', data: { object: { id: 'cs_test_123', payment_status: 'paid', amount_total: 1099, currency: 'eur', payment_intent: 'pi_test_123', metadata: { pase: '1', uid: lola, destino: 'Roma', plan: 'duo', personas: '2', trip_id: '' } } } }
  const crudo = JSON.stringify(evento)
  const ts = Math.floor(Date.now() / 1000)
  const firmado = (c, secreto = 'whsec_prueba') => ({ 'Content-Type': 'application/json', 'Stripe-Signature': pagos.firmarAvisoStripe(c, secreto, ts) })
  const sinFirma = await llama('/api/pago/webhook', { metodo: 'POST', crudo, cabeceras: { 'Content-Type': 'application/json' } })
  const malFirmado = await llama('/api/pago/webhook', { metodo: 'POST', crudo, cabeceras: firmado(crudo, 'whsec_falso') })
  debe(sinFirma.estado === 400 && malFirmado.estado === 400 && (await q('select 1 from public.passes where comprador_id = $1', [lola])).length === 0, 'webhook', 'un aviso sin firma, o con la firma mala, se rechaza y no crea ningún pase')
  const bien = await llama('/api/pago/webhook', { metodo: 'POST', crudo, cabeceras: firmado(crudo) })
  debe(bien.estado === 200 && bien.json.accion === 'pase_creado', 'webhook', 'el aviso bien firmado crea el pase')
  const otraVez = await llama('/api/pago/webhook', { metodo: 'POST', crudo, cabeceras: firmado(crudo) })
  debe(otraVez.estado === 200 && otraVez.json.accion === 'repetido' && (await q('select 1 from public.passes where comprador_id = $1', [lola])).length === 1, 'webhook', 'el mismo aviso otra vez: un solo pase')
  const alterado = crudo.replace('1099', '1')
  debe((await llama('/api/pago/webhook', { metodo: 'POST', crudo: alterado, cabeceras: firmado(crudo) })).estado === 400, 'webhook', 'un aviso cambiado después de firmarlo se rechaza')
  const est = await llama('/api/pago/estado?sesion=cs_test_123', { token: 'tok-lola' })
  debe(est.json.listo === true && est.json.pase.tipo === 'duo' && !('pago_ref' in est.json.pase), 'http', 'al volver del pago, la app ve que el pase ya está')
  const mios = await llama('/api/pases/mios', { token: 'tok-lola' })
  debe(mios.json.pases.length === 1 && mios.json.pases[0].tiene_recibo === true, 'http', 'GET /api/pases/mios lista el pase')
  const rec = await llama(`/api/pases/recibo?pase=${mios.json.pases[0].id}`, { token: 'tok-lola' })
  debe(rec.json.url === 'https://pay.stripe.test/receipts/abc' && /payment_intents\/pi_test_123/.test(llamadas.at(-1).url), 'http', '[Ver recibo] pide a Stripe el recibo de ese pago')
  const devolucion = { id: 'evt_real_2', type: 'charge.refunded', data: { object: { id: 'ch_1', payment_intent: 'pi_test_123', refunded: true, amount: 1099, amount_refunded: 1099 } } }
  const cd = JSON.stringify(devolucion)
  const rr = await llama('/api/pago/webhook', { metodo: 'POST', crudo: cd, cabeceras: firmado(cd) })
  debe(rr.json.accion === 'pase_anulado' && (await q('select estado from public.passes where comprador_id = $1', [lola]))[0].estado === 'anulado', 'webhook', 'el aviso de devolución anula el pase')
  debe((await llama('/api/pago/mentira/resolver', { metodo: 'POST', cuerpo: { sesion: 'x', resultado: 'bueno' } })).estado === 404, 'http', 'con Stripe de verdad, el pago de mentira no existe')
  servidorHttp.close()
  // El pago de mentira por HTTP: el mismo camino que Stripe, sin firma, solo fuera de producción.
  const mentira = pagos.pasarelaDeMentira()
  const servicioM = pagos.crearServicioPagos({ admin, precios: preciosPase, destinos: ['Roma'], pasarela: mentira, log: { error() {} } })
  const app2 = express()
  app2.use(express.json())
  pagos.registrarRutasPagos(app2, { admin, servicio: servicioM, env: { PAGO_DE_MENTIRA: 'true' } })
  const s2 = await new Promise((ok) => {
    const s = app2.listen(0, () => ok(s))
  })
  const base2 = `http://127.0.0.1:${s2.address().port}`
  const nina = await nuevoUsuario('nina@correo.es', false, 'Nina')
  fichas.set('tok-nina', nina)
  const c2 = await (await fetch(base2 + '/api/pago/crear', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok-nina', Origin: 'http://localhost:5173' }, body: JSON.stringify({ destino: 'Roma', plan: 'uno' }) })).json()
  const resolver = (resultado) => fetch(base2 + '/api/pago/mentira/resolver', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sesion: c2.sesion, resultado }) }).then((r) => r.json())
  debe((await resolver('rechazado')).accion === 'sin_aviso' && (await q('select 1 from public.passes where comprador_id = $1', [nina])).length === 0, 'mentira', 'pago de mentira rechazado: sin pase')
  debe((await resolver('bueno')).accion === 'pase_creado' && (await q('select 1 from public.passes where comprador_id = $1', [nina])).length === 1, 'mentira', 'pago de mentira bueno: pase')
  debe((await resolver('devuelto')).accion === 'pase_anulado', 'mentira', 'pago de mentira devuelto: pase anulado')
  s2.close()

  // Los registros de los cobros no se borran con la cuenta y no llevan a la persona.
  const columnas = (await q("select column_name from information_schema.columns where table_schema = 'public' and table_name = 'pagos_registro'")).map((c) => c.column_name)
  debe(!columnas.some((c) => /user|uid|email|comprador|traveler|persona_id|nombre/.test(c)), 'registro', `el registro de cobros no lleva a la persona (columnas: ${columnas.join(', ')})`)
  const fks = await q("select count(*)::int as n from information_schema.table_constraints tc where tc.table_name = 'pagos_registro' and tc.constraint_type = 'FOREIGN KEY'")
  debe(fks[0].n === 0, 'registro', 'el registro de cobros no cuelga de ninguna tabla: nada lo borra en cascada')
  const antes = (await q('select count(*)::int as n from public.pagos_registro'))[0].n
  const borrado = await borrarCuenta(admin, 'tok-lola')
  debe(borrado.estado === 200 && (await q('select count(*)::int as n from public.pagos_registro'))[0].n === antes, 'registro', 'al borrar la cuenta de quien compró, los registros de cobro se quedan')
  debe((await q('select 1 from auth.users where id = $1', [lola])).length === 0, 'registro', 'y la cuenta sí se borra')
  const rls = (await q("select relrowsecurity from pg_class where relname = 'pagos_registro'"))[0].relrowsecurity
  debe(rls === true && (await como(comprador, () => q('select 1 from public.pagos_registro'))).length === 0, 'registro', 'el registro de cobros no lo lee nadie desde el móvil')
  debe((await como(comprador, async () => lanza(() => q('select public.registrar_pago($1, null, $2, $3, $4, $5, 1, 699, $6, null)', ['x', 'stripe', comprador, 'Roma', 'uno', 'eur'])))) !== null, 'registro', 'nadie puede crearse un pase desde el móvil: la función es solo del servidor')
}
const indice = fs.readFileSync('server/index.js', 'utf8')
debe(/req\.originalUrl\?\.startsWith\('\/api\/pago\/webhook'\)\) req\.rawBody = buf/.test(indice) && /cobro: cobroListo\(\)/.test(indice) && /registrarRutasPagos\(app/.test(indice), 'index', 'index.js guarda el cuerpo tal cual para la firma, monta las rutas del cobro y solo cobra con cobroListo()')
const pagosFuente = fs.readFileSync('server/pagos.js', 'utf8')
debe(!/from 'stripe'|require\('stripe'\)/.test(pagosFuente) && !/"stripe"/i.test(fs.readFileSync('package.json', 'utf8')), 'peso', 'el servidor no usa el paquete de Stripe y el móvil no carga nada de Stripe: no pesa al abrir la app')

/* ═══════════════ PARTE 2 · Las pantallas del pase ═══════════════ */
console.log('2b. Las pantallas del pase (P1, P6, P7, P8b, P9)')
{
  const M = encendido
  const planes = preciosPase.planes
  // P6: los precios salen del servidor (data/pase/precios.json), nunca del móvil.
  const filas = M.filasDeCompra(planes, 4)
  debe(filas.length === 3 && filas[0].precio === '6,99 €' && filas[1].precio === '10,99 €' && filas[1].tachado === '13,98 €' && filas[1].sub === '5,50 € cada uno' && filas[2].sub === '4,99 € cada uno' && filas[2].precio === '19,96 €', 'P6', 'P6: 1 persona 6,99 €; Dúo 10,99 € con 13,98 € tachado y «5,50 € cada uno»; Grupo 4,99 € cada uno (4 personas = 19,96 €)')
  debe(filas[1].nombre === 'Pase Dúo · 2 personas' && filas[2].nombre === 'Pase Grupo · 3 o más' && filas[0].nombre === '1 persona', 'P6', 'los nombres de las tres filas')
  debe(M.limitesDelGrupo(planes).desde === 3 && M.limitesDelGrupo(planes).hasta === 50, 'P6', 'el máximo del Grupo sale de un dato (data/pase/precios.json: 50)')
  debe(M.totalDe(planes, 'grupo', 2) === null && M.totalDe(planes, 'grupo', 51) === null && M.totalDe(planes, 'grupo', 3) === 14.97 && M.totalDe(planes, 'duo', 2) === 10.99, 'P6', 'el total del Grupo solo vale de 3 a 50 personas')
  debe(M.eur(10.99) === '10,99 €' && M.eur(5.5) === '5,50 €', 'P6', 'los euros se escriben con coma')
  // (Tanda 10I: la hoja «¿Cuántos sois?» es la de la película del pase (src/components/pase/PeliculaPase.tsx); sus precios y textos salen de precioPelicula.ts.)
  const cuantos = M.hojaCuantosSois(planes, 4)
  const peli = fs.readFileSync('src/components/pase/PeliculaPase.tsx', 'utf8')
  const adaptado = fs.readFileSync('src/components/pase/pelicula/adaptar.ts', 'utf8')
  debe(cuantos.comprarTxt === 'Comprar · 19,96 €' && cuantos.personasTxt === '4 personas' && cuantos.filas.length === 3 && cuantos.hasta === 50, 'P6', 'P6 trae [Comprar · total] y las personas del Grupo (con [−] y [+] de la película)')
  debe(/lineaLegal: textos\.linea_legal_compra/.test(peli) && /data-linea-legal/.test(adaptado) && adaptado.indexOf('data-linea-legal') < adaptado.indexOf("onClick: '{{ comprar }}'"), 'P6', 'antes de [Comprar] hay un hueco para la línea legal del gestor (data/pase/textos.json, «Texto pendiente»)')
  debe(!/stripe/i.test(peli) && !new RegExp(M.marca.nombre, 'i').test(peli), 'P6', 'la hoja de compra no nombra al servicio de pago ni a la app')
  debe(M.hojaCuantosSois([], 4).comprarTxt === 'Comprar' && M.hojaCuantosSois([], 4).filas.length === 0, 'P6', 'sin precios del servidor no se puede comprar nada')
  // La hoja de compra no sale sin cobro: el anfitrión no pinta nada y la compra solo se abre si el servidor dice que se cobra.
  debe(apagado.pintaPuerta === undefined || M.pintaPagoHost() === '', 'cobro', 'sin hoja abierta, el anfitrión del pase no pinta nada')
  const fuentePago = fs.readFileSync('src/components/pase/PagoHost.tsx', 'utf8')
  // (Tanda 10I: pedirPago/abrirPase ya no los escucha PagoHost sino PeliculaHost, que abre la película con la hoja «¿Cuántos sois?» dentro; PagoHost sigue guardando con `config.cobro` lo del aviso P9,
  // y los botones que llaman a abrirPase solo salen con `pase.cobro`; sin precios del servidor la hoja no deja comprar nada.)
  const fuentePelicula = fs.readFileSync('src/components/pase/PeliculaHost.tsx', 'utf8')
  debe(/EVENTO_PAGAR/.test(fuentePelicula) && !/EVENTO_PAGAR/.test(fuentePago) && /if \(!config\.cobro \|\| !vivo\) return/.test(fuentePago), 'cobro', '[Ver el pase] y [Seguir con HOY] (pedirPago) los escucha la película (PeliculaHost), no PagoHost; el aviso P9 de PagoHost solo va si el servidor dice que se cobra')
  debe(/abrirPase/.test(fs.readFileSync('src/components/route/hoy/v2/TarjetasPase.tsx', 'utf8')) && /EVENTO_PAGAR = 'trazo:pagar'/.test(fs.readFileSync('src/lib/pago.ts', 'utf8')), 'cobro', 'P3 y la pantalla 12 siguen lanzando el evento, que ahora SÍ escucha PagoHost')
  const pagoUrl = M.pagoDeLaDireccion
  debe(pagoUrl('?pago=ok&sesion=cs_1')?.sesion === 'cs_1' && pagoUrl('?pago=cancelado')?.resultado === 'cancelado' && pagoUrl('?pago=mentira&sesion=x')?.resultado === 'mentira' && pagoUrl('?otra=1') === null && pagoUrl('?pago=raro') === null, 'cobro', 'al volver del pago, la dirección dice cómo terminó')

  // P7 y RS2: la misma hoja del enlace y el código.
  const duo = { id: 'p', destino: 'Roma', tipo: 'duo', estado: 'activo', usos_max: 2, usos_usados: 1, es_mio: true, invitacion: null, viaje: null, miembros: [] }
  const p7 = M.pintaInvitar({ modo: 'pase', destino: 'Roma', tripId: 'v1', pase: duo, codigoInicial: 'K7MQ4XWH' })
  debe(/Pase Dúo/.test(p7) && /Únete a mi /.test(p7) && /Pase de Roma/.test(p7) && /K7MQ4XWH/.test(p7) && /1 de 2 usados/.test(p7) && /Compartir el enlace/.test(p7), 'P7', 'P7: «Pase Dúo», «Únete a mi Pase de Roma», su código y «1 de 2 usados» con [Compartir el enlace]')
  const rs2 = M.pintaInvitar({ modo: 'viaje', destino: 'Roma', tripId: 'v1', pase: duo, codigoInicial: 'K7MQ4XWH' })
  debe(/Compartir viaje/.test(rs2) && /Invita a tu viaje a Roma/.test(rs2) && /1 de 2 plazas del pase usadas/.test(rs2), 'RS2', 'RS2 con un Dúo: la misma hoja, «Invita a tu viaje a Roma» y «1 de 2 plazas del pase usadas»')
  debe(/^[A-Z2-9]{8}$/.test('K7MQ4XWH'), 'codigo', 'el código es de 8 caracteres sin 0, O, 1, I ni L (el de siempre)')
  debe(!/\bK7MQ4XWH\b/.test(M.pintaInvitar({ modo: 'viaje', destino: 'Roma', tripId: 'v1', pase: null })) && /········/.test(M.pintaInvitar({ modo: 'viaje', destino: 'Roma', tripId: 'v1', pase: null })), 'RS2', 'sin código todavía, la hoja espera (puntos) y [Compartir el enlace] no se puede pulsar')
  debe(M.textoDeCompartirPase('Roma') === 'Únete a mi Pase de Roma' && M.nombreDelTipo('grupo') === 'Pase Grupo', 'P7', 'los textos de compartir')

  // P8b y P9: solo con dos viajes a Roma que se pisan.
  const vA = { id: 'a', route: { destination: 'Roma', answers: { dateRange: { start: '2026-10-16', end: '2026-10-19' } } }, guardadoEn: null }
  const vB = { id: 'b', route: { destination: 'Roma', answers: { dateRange: { start: '2026-10-16', end: '2026-10-20' } } }, guardadoEn: null }
  const vC = { id: 'c', route: { destination: 'Roma', answers: { dateRange: { start: '2027-05-01', end: '2027-05-04' } } }, guardadoEn: null }
  debe(M.parejasQueSePisan([vA, vB]).length === 1 && M.parejasQueSePisan([vA, vC]).length === 0, 'P9', 'solo se pregunta con dos viajes a Roma que se pisan')
  debe(M.parejasQueSePisan([vA, { ...vB, guardadoEn: '2026-10-01' }]).length === 0 && M.parejasQueSePisan([vA, { ...vB, esInvitado: true }]).length === 0, 'P9', 'los guardados aparte y los de otra persona no cuentan')
  debe(M.parejasQueSePisan([vA, { ...vB, route: { ...vB.route, destination: 'Lisboa' } }]).length === 0, 'P9', 'dos destinos distintos no se pisan')
  debe(M.rangoEnPalabras('2026-10-16', '2026-10-19') === '16 al 19 de octubre' && M.rangoEnPalabras('2026-10-28', '2026-11-02') === '28 de octubre al 2 de noviembre', 'P9', 'las fechas, como se dicen')
  const a = { id: 'a', destino: 'Roma', inicio: '2026-10-16', fin: '2026-10-19' }
  const b = { id: 'b', destino: 'Roma', inicio: '2026-10-16', fin: '2026-10-20' }
  const p8b = M.pintaDosViajes({ modo: 'p8b', destino: 'Roma', actual: a, otro: b })
  debe(/En 10 días empieza tu viaje a Roma\. Tu /.test(p8b) && /Pase de Roma/.test(p8b) && /está activo para el viaje del 16 al 19 de octubre\. Si quieres cambiarlo, ahora es el momento\./.test(p8b), 'P8b', 'P8b: el texto del aviso de los 10 días')
  debe(/Es este/.test(p8b) && /Cambiar al del 16 al 20/.test(p8b), 'P8b', 'P8b: [Es este] y [Cambiar al del 16 al 20]')
  const p9 = M.pintaDosViajes({ modo: 'p9', destino: 'Roma', actual: a, otro: b, etiquetaDia: 'Hoy · mié 16' })
  debe(/Tienes dos viajes a Roma\. ¿Cuál haces\?/.test(p9) && /El otro pasa a «Viajes guardados», sin borrarse\./.test(p9) && /Del 16 al 19 de octubre/.test(p9) && /Del 16 al 20 de octubre/.test(p9) && /Hoy · mié 16/.test(p9), 'P9', 'P9: la pregunta, el aviso de que el otro no se borra y un botón por viaje')

  // P1: debajo del vuelo, sin pase.
  const p1 = M.pintaP1({ hora: '14:20', destino: 'Roma', forzar: true })
  debe(/Llegada/.test(p1) && /Tu vuelo llega a las 14:20\. Con el /.test(p1) && /Pase de Roma/.test(p1) && /tu primer día se ajusta solo/.test(p1) && /Ver el pase/.test(p1), 'P1', 'P1: «Tu vuelo llega a las 14:20. Con el Pase de Roma, tu primer día se ajusta solo.» y [Ver el pase]')
  debe(M.pintaP1({ hora: '14:20', destino: 'Roma' }) === '', 'P1', 'con el cobro apagado (todo abierto), P1 no sale')
  const reservas = fs.readFileSync('src/components/route/reservas/LlegadaYVuelta.tsx', 'utf8')
  // (Tanda 10G: la tarjeta P1 la sustituye en RESERVAS la pieza del candado de toda la app —«Con el pase, ajustamos tu primer y tu último día a tu vuelo»—, justo después del bloque del vuelo y solo con un vuelo guardado.)
  debe(reservas.indexOf('</BloqueShell>') < reservas.indexOf('datos="llegada-ajuste"') && /\(ida\.done \|\| vuelta\.done\)/.test(reservas) && /Con el pase, ajustamos tu primer y tu último día a tu vuelo/.test(reservas), 'P1', 'el candado del ajuste está en RESERVAS, justo después del bloque del vuelo (no encima de la ruta) y solo con el vuelo guardado')
}


console.log('2c. La prueba de HOY va con la cuenta: una por cuenta, para siempre')
{
  const ula = await nuevoUsuario('ula@correo.es', false, 'Ula')
  const otraSesion = await nuevoUsuario(null, true)
  const intento = await como(ula, () => lanza(() => q("insert into public.hoy_prueba (user_id, fecha, gastada_en) values ($1, '2026-10-16', now())", [ula])))
  debe(intento !== null, 'prueba', 'el móvil no puede gastarse ni apuntarse la prueba: solo la escribe el servidor')
  await servidor(() => q("insert into public.hoy_prueba (user_id, fecha, gastada_en) values ($1, '2026-10-16', now())", [ula]))
  const doble = await servidor(() => lanza(() => q("insert into public.hoy_prueba (user_id, fecha, gastada_en) values ($1, '2026-10-17', now())", [ula])))
  debe(doble !== null, 'prueba', 'la prueba es una fila por cuenta: no se puede tener otra')
  const suya = await como(ula, () => q('select fecha::text as fecha, gastada_en is not null as gastada from public.hoy_prueba'))
  debe(suya.length === 1 && suya[0].gastada === true, 'prueba', 'entrando otra vez (otro móvil, la app borrada y vuelta a instalar) con la misma cuenta, la prueba sigue gastada')
  const deOtraSesion = await como(otraSesion, () => q('select 1 from public.hoy_prueba'), { anonimo: true })
  debe(deOtraSesion.length === 0, 'prueba', 'una sesión anónima nueva no ve la prueba de nadie ni tiene una propia')
  const rutasFuente = fs.readFileSync('server/logros/rutas.js', 'utf8')
  debe(/usuario\.is_anonymous === true\) return res\.status\(403\)/.test(rutasFuente) && /\/api\/pase\/prueba\/usar', conUsuario/.test(rutasFuente), 'prueba', 'las rutas de la prueba rechazan la sesión anónima (403): hace falta la cuenta, así borrar la app o entrar con otra sesión anónima no da otra prueba')
  const cuentaMia = pagos.cobroListo({ PASES_COBRO_ACTIVO: 'true', STRIPE_SECRET_KEY: 'a', STRIPE_WEBHOOK_SECRET: 'b' })
  debe(cuentaMia === true, 'prueba', 'con el cobro listo, la prueba es la regla del servidor (una por cuenta); sin cobro, todo abierto')
}


/* ═══════════════ PARTE 3 · Compartir el viaje y recomendar cambios ═══════════════ */
console.log('3. Recomendar cambios: la propuesta, la pareja, R2 y el modo recomendación')
{
  const M = encendido
  const st = (id, name, time = '09:00') => ({ id, name, time, description: '', durationMinutes: 60, coordinates: { lat: 41.9, lng: 12.5 }, photoUrl: '' })
  const dia = (id, n, stops, extra = {}) => ({ id, dayNumber: n, city: 'Roma', title: `Día ${n}`, stops, meals: [], ...extra })
  const rutaDe3 = () => ({
    id: 'r', destination: 'Roma', answers: { dateRange: { start: '2026-10-16', end: '2026-10-19' } },
    days: [
      dia('d1', 1, [st('a1', 'Piazza Navona'), st('a2', 'Panteón'), st('a3', 'Fontana de Trevi')]),
      dia('d2', 2, [st('v1', 'Museos Vaticanos'), st('v2', 'Plaza de San Pedro'), st('v3', 'Basílica de San Pedro'), st('v4', 'Castillo de Sant’Angelo')]),
      dia('d3', 3, [st('r1', 'Coliseo'), st('r2', 'Foro Romano'), st('r3', 'Termas de Caracalla')]),
      dia('d4', 4, [st('t1', 'Trastevere')]),
    ],
  })
  const conStops = (ruta, dayId, f) => ({ ...ruta, days: ruta.days.map((d) => (d.id === dayId ? { ...d, stops: f(d.stops) } : d)) })

  // La comparación de listas y la pareja.
  const nom = (x) => x
  const L = M.lineasDeCambio
  const swap = L(['A', 'B', 'C', 'D'], ['A', 'B', 'C', 'E'], nom)
  debe(swap.map((l) => l.tipo).join() === 'igual,igual,igual,pareja' && swap[3].a === 'D' && swap[3].b === 'E', 'pareja', 'cambiar una parada por otra sale como UNA pareja (lo que sale y lo que entra en el mismo hueco)')
  debe(L(['A', 'B', 'C'], ['A', 'C'], nom).map((l) => l.tipo).join() === 'igual,sale,igual', 'pareja', 'quitar una parada: sale')
  debe(L(['A', 'C'], ['A', 'B', 'C'], nom).map((l) => l.tipo).join() === 'igual,entra,igual', 'pareja', 'añadir una parada: entra')
  const mov = L(['A', 'B', 'C'], ['B', 'C', 'A'], nom)
  debe(mov.some((l) => l.tipo === 'mueve' && l.b === 'A') && !mov.some((l) => l.tipo === 'sale' || l.tipo === 'pareja'), 'pareja', 'mover una parada: «mueve», sin sacarla ni emparejarla')
  const dos = L(['A', 'B', 'C', 'D'], ['A', 'X', 'Y', 'D'], nom)
  debe(dos.filter((l) => l.tipo === 'pareja').length === 2, 'pareja', 'dos cambios seguidos son dos parejas, en orden')
  debe(L(['A', 'B'], ['A', 'B'], nom).every((l) => l.tipo === 'igual') && L([], [], nom).length === 0, 'pareja', 'sin cambios, todo igual')
  debe(L(['A', 'B', 'C'], ['A', 'X', 'Y', 'C'], nom).filter((l) => l.tipo === 'pareja').length === 1 && L(['A', 'B', 'C'], ['A', 'X', 'Y', 'C'], nom).filter((l) => l.tipo === 'entra').length === 1, 'pareja', 'una sale y dos entran: una pareja y una entra')

  // Los cambios de la copia respecto de la ruta del administrador.
  const base = rutaDe3()
  debe(M.cambiosDeLaPropuesta(base, base).length === 0 && M.construirRecomendacion(base, base) === null, 'propuesta', 'sin cambios no hay propuesta')
  const unaPareja = conStops(base, 'd2', (s) => s.map((p) => (p.id === 'v4' ? st('n1', 'Trastevere', '15:00') : p)))
  const c1 = M.cambiosDeLaPropuesta(base, unaPareja)
  debe(c1.length === 1 && c1[0].tipo === 'cambiar' && c1[0].antes.name === 'Castillo de Sant’Angelo' && c1[0].despues.name === 'Trastevere' && c1[0].dayId === 'd2', 'propuesta', 'cambiar una parada por otra cuenta como UN cambio, con su pareja')
  const r1 = M.construirRecomendacion(base, unaPareja)
  debe(r1.tipo === 'cambio' && r1.payload.accion === 'cambiar' && r1.payload.stopId === 'v4' && r1.payload.stop.name === 'Trastevere' && r1.payload.dayId === 'd2', 'propuesta', 'un solo cambio de una parada se manda como «cambio» (R2a), y la pareja va junta: la de antes y la de después')
  const quitar = conStops(base, 'd3', (s) => s.filter((p) => p.id !== 'r3'))
  debe(M.construirRecomendacion(base, quitar).payload.accion === 'quitar' && M.construirRecomendacion(base, quitar).payload.stopId === 'r3', 'propuesta', 'quitar una parada: «cambio» quitar')
  const anadir = conStops(base, 'd1', (s) => [...s.slice(0, 1), st('n2', 'Villa Borghese'), ...s.slice(1)])
  const ra = M.construirRecomendacion(base, anadir)
  debe(ra.tipo === 'cambio' && ra.payload.accion === 'anadir' && ra.payload.despuesDe === 'a1' && ra.payload.stop.name === 'Villa Borghese', 'propuesta', 'añadir una parada: «cambio» añadir, detrás de la que la precede')
  const mover = conStops(base, 'd1', (s) => [s[2], s[0], s[1]])
  const rm = M.construirRecomendacion(base, mover)
  debe(rm.tipo === 'cambio' && rm.payload.accion === 'mover' && rm.payload.stopId === 'a3' && rm.payload.haciaIndice === 0, 'propuesta', 'mover una parada: «cambio» mover, con su posición final')
  const dosEnUnDia = conStops(conStops(base, 'd3', (s) => s.map((p) => (p.id === 'r2' ? st('n3', 'Boca de la Verdad') : p))), 'd3', (s) => s.map((p) => (p.id === 'r3' ? st('n4', 'Jardín de los Naranjos') : p)))
  const rd = M.construirRecomendacion(base, dosEnUnDia)
  debe(M.cambiosDeLaPropuesta(base, dosEnUnDia).length === 2 && rd.tipo === 'dia' && rd.payload.accion === 'sustituir' && rd.payload.dayId === 'd3' && rd.payload.day.stops.length === 3, 'propuesta', 'dos cambios en un día se mandan como «día» (R2b): el día entero sustituye')
  const variosDias = conStops(conStops(base, 'd1', (s) => s.map((p) => (p.id === 'a3' ? st('n5', 'Villa Borghese') : p))), 'd4', (s) => [...s, st('n6', 'Castillo de Sant’Angelo')])
  const rr = M.construirRecomendacion(base, variosDias)
  debe(rr.tipo === 'ruta' && rr.payload.days.length === 4 && M.cambiosDeLaPropuesta(base, variosDias).length === 2, 'propuesta', 'cambios en varios días se mandan como «ruta» (R2c)')
  debe(!JSON.stringify(rr.payload).includes('originalSnapshot'), 'propuesta', 'el paquete no lleva la copia de antes del administrador')
  const conDiaNuevo = { ...base, days: [...base.days, dia('d5', 5, [st('z1', 'Trastevere')], { userAdded: true })] }
  debe(M.cambiosDeLaPropuesta(base, conDiaNuevo)[0].tipo === 'dia_nuevo' && M.construirRecomendacion(base, conDiaNuevo).tipo === 'ruta', 'propuesta', 'un día nuevo es un cambio y se manda con la ruta')
  debe(M.textoDeCuantos(1) === '1 cambio' && M.textoDeCuantos(2) === '2 cambios', 'propuesta', '«1 cambio», «2 cambios»')
  debe(M.etiquetaDeDia(base, 2) === 'Día 2 · vie 17' || M.etiquetaDeDia(base, 2) === 'Día 2 · sáb 17', 'propuesta', 'la cabecera de cada día: «Día 2 · fecha»')
  debe(M.etiquetaDeDia({ answers: {} }, 3) === 'Día 3', 'propuesta', 'sin fechas, solo «Día 3»')

  // El [Deshacer] de cada cambio.
  const mezcla = conStops(conStops(conStops(unaPareja, 'd3', (s) => s.filter((p) => p.id !== 'r3')), 'd1', (s) => [...s.slice(0, 1), st('n2', 'Villa Borghese'), ...s.slice(1)]), 'd4', (s) => s)
  const cs = M.cambiosDeLaPropuesta(base, mezcla)
  debe(cs.length === 3 && cs.map((c) => c.tipo).join() === 'anadir,cambiar,quitar', 'deshacer', 'tres cambios en tres días, en el orden del viaje')
  let actual = mezcla
  actual = M.deshacerCambio(actual, base, cs.find((c) => c.tipo === 'cambiar'))
  debe(actual.days[1].stops.map((s) => s.name).join() === base.days[1].stops.map((s) => s.name).join(), 'deshacer', 'deshacer la pareja devuelve la parada de antes en su sitio')
  actual = M.deshacerCambio(actual, base, cs.find((c) => c.tipo === 'quitar'))
  debe(actual.days[2].stops.map((s) => s.id).join() === 'r1,r2,r3', 'deshacer', 'deshacer un «quitar» la devuelve a su sitio')
  actual = M.deshacerCambio(actual, base, cs.find((c) => c.tipo === 'anadir'))
  debe(JSON.stringify(actual.days.map((d) => d.stops.map((s) => s.id))) === JSON.stringify(base.days.map((d) => d.stops.map((s) => s.id))) && M.cambiosDeLaPropuesta(base, actual).length === 0, 'deshacer', 'deshechos los tres, la copia es otra vez la ruta del administrador')
  const movido = conStops(base, 'd1', (s) => [s[2], s[0], s[1]])
  debe(M.deshacerCambio(movido, base, M.cambiosDeLaPropuesta(base, movido)[0]).days[0].stops.map((s) => s.id).join() === 'a1,a2,a3', 'deshacer', 'deshacer un «mover» devuelve el orden')
  debe(M.deshacerCambio(conDiaNuevo, base, M.cambiosDeLaPropuesta(base, conDiaNuevo)[0]).days.length === 4, 'deshacer', 'deshacer un día nuevo lo quita')

  // El modo recomendación (el almacén): nada cambia hasta enviar; cancelar devuelve la ruta del administrador.
  const E = M.usePropuestaStore
  M.useRouteStore.setState({ route: structuredClone(base) })
  E.getState().empezar('parada')
  debe(E.getState().activa === true && E.getState().base?.days.length === 4, 'RM', 'al entrar en el modo recomendación se guarda una copia de la ruta del administrador')
  M.useRouteStore.setState({ route: structuredClone(unaPareja) })
  E.getState().cancelar()
  debe(E.getState().activa === false && M.useRouteStore.getState().route.days[1].stops[3].name === 'Castillo de Sant’Angelo', 'RM', 'cancelar descarta los cambios: la persona vuelve a ver la ruta del administrador')
  E.getState().empezar('ruta')
  M.useRouteStore.setState({ route: structuredClone(unaPareja) })
  E.getState().deshacer(M.cambiosDeLaPropuesta(base, unaPareja)[0])
  debe(M.cambiosDeLaPropuesta(E.getState().base, M.useRouteStore.getState().route).length === 0, 'RM', '[Deshacer] de la lista deshace solo ese cambio')
  E.getState().cancelar()
  const vacio = await E.getState().enviar()
  debe(vacio === false, 'RM', 'sin modo recomendación no se envía nada')

  // R2: el administrador, con su ruta de ahora (aunque haya cambiado desde que se mandó).
  const rec = (tipo, payload) => ({ id: 'rec', tripId: 't', authorId: 'laura', tipo, payload, estado: 'pendiente', creadaEn: '2026-10-10' })
  const recA = rec(r1.tipo, r1.payload)
  const prev = M.vistaPrevia(base, M.resolverRecomendacion(base, recA).accion)
  debe(prev.length === 1 && prev[0].dayId === 'd2', 'R2a', 'R2: solo el día que cambia')
  const lin = M.lineasDelDia(prev[0].antes, prev[0].despues)
  debe(lin.map((l) => l.tipo).join() === 'igual,igual,igual,pareja', 'R2a', 'R2a: lo que no cambia, en gris; la pareja, en su recuadro')
  const adminCambio = conStops(base, 'd2', (s) => s.filter((p) => p.id !== 'v2'))
  const prev2 = M.vistaPrevia(adminCambio, M.resolverRecomendacion(adminCambio, recA).accion)
  debe(prev2.length === 1 && prev2[0].antes.join() === 'Museos Vaticanos,Basílica de San Pedro,Castillo de Sant’Angelo', 'R2', 'el «antes» es la ruta de AHORA del administrador, no la de cuando se mandó')
  const pideDia = M.resolverRecomendacion(base, rec('dia', { accion: 'sustituir', dayId: 'dX', day: dia('dX', 4, [st('q1', 'Trastevere')]) }))
  debe(pideDia.ok === false && pideDia.necesitaDia === true && pideDia.diasPosibles.length === 4, 'R2d', 'R2d: si el día ya no existe, pide elegir en qué día lo pone (los días de ruta)')
  const conDiaElegido = M.resolverRecomendacion(base, rec('dia', { accion: 'sustituir', dayId: 'dX', day: dia('dX', 4, [st('q1', 'Trastevere')]) }), 'd1')
  debe(conDiaElegido.ok === true && conDiaElegido.accion.dayId === 'd1', 'R2d', 'con el día elegido, lo propuesto sustituye a ese día')

  // Las hojas.
  M.useViajeCompartido.getState().poner({ gente: [{ id: 'elena', nombre: 'Elena', foto: null, esAdmin: true }, { id: 'laura', nombre: 'Laura', foto: null, esAdmin: false }] })
  const h2a = M.pintaR2({ nombreDelAutor: "Laura", rec: recA, route: base })
  debe(/Recomendación de Laura/.test(h2a) && /Laura te recomienda un cambio</.test(h2a) && /Día 2 · /.test(h2a) && /data-linea="igual"/.test(h2a) && /data-cambio-parada="pequena"/.test(h2a) && />Aceptar</.test(h2a) && />No, gracias</.test(h2a), 'R2a', 'R2a: «Laura te recomienda un cambio», el día, la pareja, [Aceptar] y [No, gracias]')
  debe(!/Día 1 · /.test(h2a) && !/Día 3 · /.test(h2a), 'R2a', 'R2a no enseña los días que no cambian')
  const h2b = M.pintaR2({ nombreDelAutor: "Laura", rec: rec(rd.tipo, rd.payload), route: base })
  debe(/Laura te recomienda cambios en (el día 3|el \p{L}+ \d+)/u.test(h2b) && (h2b.match(/data-cambio-parada/g) ?? []).length === 2, 'R2b', 'R2b: «cambios en el día 3» con dos parejas')
  const h2c = M.pintaR2({ nombreDelAutor: "Laura", rec: rec(rr.tipo, rr.payload), route: base })
  debe(/Laura te recomienda otra ruta/.test(h2c) && (h2c.match(/data-dia-que-cambia/g) ?? []).length === 2 && /data-linea="entra"/.test(h2c), 'R2c', 'R2c: «otra ruta», solo los dos días que cambian, con lo que entra en verde')
  const h2d = M.pintaR2({ nombreDelAutor: "Laura", rec: rec('dia', { accion: 'sustituir', dayId: 'dX', day: dia('dX', 4, [st('q1', 'Trastevere'), st('q2', 'Castillo')]) }), route: base })
  debe(/¿En qué día lo pones\?/.test(h2d) && /data-elegir-dia="d1"/.test(h2d) && /Lo que propone/.test(h2d) && /disabled/.test(h2d.slice(h2d.indexOf('data-boton-hoja="aceptar"') - 200, h2d.indexOf('data-boton-hoja="aceptar"') + 50)), 'R2d', 'R2d: «¿En qué día lo pones?», los días a elegir, lo que propone y [Aceptar] apagado hasta elegir')
  const hQuitar = M.pintaR2({ nombreDelAutor: "Laura", rec: rec('cambio', { dayId: 'd9', accion: 'quitar', stopId: 'zzz' }), route: base })
  debe(/Puedes aceptarla igualmente/.test(hQuitar), 'R2', 'lo que ya está hecho se acepta sin cambiar nada y lo dice')

  // RM, RV, RSent, AV7 y los menús.
  const fila = M.pintaFilaDeCambio({ etiqueta: 'Día 2 · jue 17', cambio: c1[0], onDeshacer: () => undefined })
  debe(/Día 2 · jue 17 · cambiar/.test(fila) && /Propuesta: cambiar/.test(fila) && /Deshacer/.test(fila), 'RV', 'RV: cada cambio con su día, su pareja y [Deshacer]')
  const filaQuitar = M.pintaFilaDeCambio({ etiqueta: 'Día 3 · vie 18', cambio: cs.find((c) => c.tipo === 'quitar') })
  debe(/Termas de Caracalla/.test(filaQuitar) && /line-through/.test(filaQuitar), 'RV', 'RV: lo que se quita, tachado en rojo')
  const av7 = M.pintaVerPropuesta({ nombreDelAdmin: 'Elena', cambiosEnviados: [{ etiqueta: 'Día 2 · jue 17', cambio: c1[0] }, { etiqueta: 'Día 3 · vie 18', cambio: cs.find((c) => c.tipo === 'quitar') }] })
  debe(/2 cambios/.test(av7) && /Enviada · esperando a Elena/.test(av7) && !/Deshacer/.test(av7), 'AV7', 'AV7: «2 cambios», «Enviada · esperando a Elena» y sin [Deshacer]')
  const mostrados = M.cambiosDeUnaRecomendacion(base, prev)
  debe(mostrados.length === 1 && mostrados[0].cambio.tipo === 'cambiar' && mostrados[0].cambio.antes.name === 'Castillo de Sant’Angelo' && mostrados[0].cambio.despues.name === 'Trastevere' && /^Día 2/.test(mostrados[0].etiqueta), 'AV7', 'lo ya mandado se enseña por días y solo lo que cambia, con su pareja')
  const barra = fs.readFileSync('src/components/propuesta/BarraDePropuesta.tsx', 'utf8')
  debe(/Enviada · esperando a/.test(barra) && /data-barra-enviada/.test(barra) && /cambiosEnviados={cambios}/.test(barra), 'AV7', 'mientras el administrador no conteste, quien mandó la propuesta ve «Enviada · esperando a Elena» con [Ver]')
  const sent = M.pintaEnviada('Elena')
  debe(/Se lo hemos mandado a Elena/.test(sent) && /Volver al viaje/.test(sent), 'RSent', 'RSent: «Se lo hemos mandado a Elena» y [Volver al viaje]')
  const cp = M.pintaCambioParada({ a: 'Castillo de Sant’Angelo', b: 'Trastevere', detalleA: '15:00 · 1 h', detalleB: '15:00 · 1 h 30' })
  debe(/Propuesta: cambiar/.test(cp) && /Castillo de Sant’Angelo/.test(cp) && /Trastevere/.test(cp) && /line-through/.test(cp) && /15:00 · 1 h 30/.test(cp), 'RM', 'la pareja «Propuesta: cambiar»: lo que sale tachado en rojo, lo que entra en verde, con sus horas')
  debe(/Ver la ficha/.test(M.pintaMenuParada()) === false, 'RW1', 'el menú está cerrado hasta que se toca «···»')
  const fuenteMenus = fs.readFileSync('src/components/propuesta/MenusDelInvitado.tsx', 'utf8')
  debe(/Ver la ficha/.test(fuenteMenus) && /Cómo llegar/.test(fuenteMenus) && /Recomendar un cambio/.test(fuenteMenus) && /Ver el día en el mapa/.test(fuenteMenus) && /Recomendar cambios en este día/.test(fuenteMenus), 'RW1', 'RW1 y RW2: los menús de quien mira el viaje de otra persona')
  const fuenteBotones = fs.readFileSync('src/components/propuesta/BotonesDeViaje.tsx', 'utf8')
  debe(/Compartir viaje/.test(fuenteBotones) && /Recomendar otra ruta/.test(fuenteBotones) && /cuentasActivas\(\)/.test(fuenteBotones), 'RS1', 'RS1 y RW3: [Compartir viaje] y [Recomendar otra ruta] en RUTA, solo con las cuentas encendidas')
  debe(/RouteOverview/.test('RouteOverview') && /<BotonesDeViaje \/>/.test(fs.readFileSync('src/components/route/RouteOverview.tsx', 'utf8')), 'RS1', 'los botones están en la pestaña RUTA')
  const fuenteStop = fs.readFileSync('src/components/route/dayDetail/StopMenu.tsx', 'utf8')
  debe(/soloVer\) return <MenuInvitadoParada/.test(fuenteStop) && /function StopMenuCompleto/.test(fuenteStop), 'RW1', 'el menú de la parada cambia por el de RW1 solo para quien mira (y fuera del modo recomendación)')
  const fuenteDias = fs.readFileSync('src/components/route/DayList.tsx', 'utf8')
  debe(/soloVer \? \(/.test(fuenteDias) && /<EtiquetaRecomendacion dayId=\{day\.id\}/.test(fuenteDias), 'RW2', 'la cabecera del día: su menú de RW2 para quien mira y la etiqueta «1 recomendación» para el administrador')
  const fuenteDetalle = fs.readFileSync('src/components/route/dayDetail/DayDetailPanel.tsx', 'utf8')
  debe(/parejasDePropuesta\.has\(realStop\.id\)/.test(fuenteDetalle) && /<CambioParada/.test(fuenteDetalle), 'RM', 'en el día, la parada cambiada por otra se pinta como pareja')
  const etiqueta = fs.readFileSync('src/components/propuesta/EtiquetaRecomendacion.tsx', 'utf8')
  debe(/1 recomendación/.test(etiqueta) && /abrir\(delDia\[0\]\)/.test(etiqueta), 'AV8', 'la etiqueta «1 recomendación» abre R2 al tocarla')
  const mapaDias = M.diasConRecomendacion(base, [recA, { ...rec(rd.tipo, rd.payload), id: 'r2' }, { ...recA, id: 'r3', estado: 'aceptada' }])
  debe(mapaDias.get('d2')?.length === 1 && mapaDias.get('d3')?.length === 1 && !mapaDias.has('d1'), 'AV8', 'la etiqueta sale en los días que cambiarían, mientras no conteste (las contestadas no cuentan)')
  const solo = fs.readFileSync('src/index.css', 'utf8')
  debe(/html\[data-solo-ver\] \[data-edit-tool\]/.test(solo) && /data-edit-tool/.test(fs.readFileSync('src/components/route/dayDetail/StopConnector.tsx', 'utf8')) && /data-edit-tool/.test(fs.readFileSync('src/components/route/SortableDay.tsx', 'utf8')), 'R1', 'quien mira el viaje de otra persona no ve las herramientas de editar (asas, «+ Añadir parada», «+ Añadir día», la varita)')
  debe(!fs.existsSync('src/components/cuenta/InvitarProvisional.tsx') && !fs.existsSync('src/components/cuenta/CuentaEnPerfil.tsx') && !/Invitar y recomendaciones/.test(fs.readFileSync('src/components/layout/PerfilSheet.tsx', 'utf8')), 'perfil', 'el bloque provisional «Invitar y recomendaciones» ya no está en el Perfil')
  const header = fs.readFileSync('src/components/layout/Header.tsx', 'utf8')
  debe(/Viaje de \$\{nombreAdmin\}/.test(header), 'R1', 'R1: la cabecera dice «Viaje de Elena»')
}

console.log('3b. Compartir y recomendar con la base de datos de verdad (reglas de seguridad)')
{
  const lau = await nuevoUsuario('laura3@correo.es', false, 'Laura Gómez')
  const ele = await nuevoUsuario('elena3@correo.es', false, 'Elena Rey')
  const otra = await nuevoUsuario('otra3@correo.es', false, 'Otra')
  const viaje = await como(ele, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [ele, rutaDe('Roma', '2026-10-16', '2026-10-19')]))[0].id)
  const inv = await como(ele, async () => (await q('select public.crear_invitacion($1, null, 2) as r', [viaje]))[0].r)
  debe(/^[A-Z2-9]{8}$/.test(inv.codigo) && !/[OILol01]/.test(inv.codigo), 'codigo', 'un solo formato de código: el de la invitación (8 caracteres, sin 0, O, 1, I, L)')
  const codPase = (await q("select public.generar_codigo('x') as c"))[0].c
  debe(/^[A-Z2-9]{8}$/.test(codPase) && !/[OILol01]/.test(codPase), 'codigo', 'el código de los pases y el del enlace personal salen de la misma función: el mismo formato')
  await como(lau, () => q('select public.canjear_invitacion($1)', [inv.codigo]))

  // Quién está en el viaje.
  const gente = await como(lau, async () => (await q('select public.gente_del_viaje($1) as g', [viaje]))[0].g)
  debe(gente.length === 2 && gente[0].es_admin === true && gente[0].nombre === 'Elena' && gente[1].nombre === 'Laura' && gente.every((p) => Object.keys(p).sort().join() === 'es_admin,foto,id,inicial,nombre'), 'gente', 'quien está en el viaje: el administrador y la invitada, con su nombre de pila y la inicial de su email (sin apellido, sin el email entero)')
  debe((await como(otra, async () => (await q('select public.gente_del_viaje($1) as g', [viaje]))[0].g)).length === 0, 'gente', 'quien no está en el viaje no ve a nadie')
  debe((await como(ele, async () => (await q('select public.gente_del_viaje($1) as g', [viaje]))[0].g)).length === 2, 'gente', 'el administrador ve a los suyos')

  // Laura recomienda; el administrador decide; ella solo ve la suya.
  const prop = { dayId: 'd2', accion: 'cambiar', stopId: 'v4', stop: { id: 'n1', name: 'Trastevere' } }
  await como(lau, () => q("insert into public.trip_recommendations (trip_id, tipo, payload) values ($1, 'cambio', $2::jsonb)", [viaje, JSON.stringify(prop)]))
  const delAdmin = await como(ele, () => q('select id, estado, author_id from public.trip_recommendations'))
  debe(delAdmin.length === 1 && delAdmin[0].estado === 'pendiente' && delAdmin[0].author_id === lau, 'recomendar', 'el administrador ve la recomendación pendiente de Laura')
  const intruso = await como(otra, () => lanza(() => q("insert into public.trip_recommendations (trip_id, tipo, payload) values ($1, 'cambio', '{}'::jsonb)", [viaje])))
  debe(intruso !== null, 'recomendar', 'quien no está invitada no puede recomendar')
  const propia = await como(lau, () => lanza(() => q("update public.trip_recommendations set estado = 'aceptada'")))
  const sigue = await q("select estado from public.trip_recommendations")
  debe(sigue[0].estado === 'pendiente', 'recomendar', 'Laura no puede aceptar su propia recomendación')
  void propia
  const cambiaPayload = await como(ele, () => lanza(() => q("update public.trip_recommendations set payload = '{}'::jsonb")))
  debe(cambiaPayload !== null && /no se puede cambiar/.test(cambiaPayload), 'recomendar', 'el administrador solo decide: no puede reescribir lo que Laura recomendó')
  await como(ele, () => q("update public.trip_recommendations set estado = 'aceptada'"))
  const verLaura = await como(lau, () => q('select estado, decidida_por from public.trip_recommendations'))
  debe(verLaura[0].estado === 'aceptada' && verLaura[0].decidida_por === ele, 'recomendar', 'Laura ve que Elena ha aceptado (y quién decidió)')
  debe((await como(otra, () => q('select 1 from public.trip_recommendations'))).length === 0, 'recomendar', 'una tercera persona no ve las recomendaciones')
}

/* ═══════════════ PARTE 4 · La campanita de Avisos ═══════════════ */
console.log('4. La campanita de Avisos (los textos, la lista y el permiso)')
{
  const M = encendido
  // Los textos, tal como están en el diseño.
  const T = (tipo, payload) => M.textoDelAviso({ tipo, payload })
  debe(T('recomendacion', { autor: 'Laura', tipo_rec: 'cambio', dia: 2 }) === 'Laura te recomienda un cambio en el día 2', 'AV2', '«Laura te recomienda un cambio en el día 2»')
  debe(T('recomendacion', { autor: 'Laura', tipo_rec: 'dia', dia: 3 }) === 'Laura te recomienda cambios en el día 3', 'AV2', '«Laura te recomienda cambios en el día 3»')
  debe(T('recomendacion', { autor: 'Laura', tipo_rec: 'ruta', dia: null }) === 'Laura te recomienda otra ruta', 'AV2', '«Laura te recomienda otra ruta»')
  debe(T('aceptada', { admin: 'Elena', tipo_rec: 'cambio', dia: 2 }) === 'Elena ha aceptado tu cambio en el día 2', 'AV5', '«Elena ha aceptado tu cambio en el día 2»')
  debe(T('rechazada', { admin: 'Elena', tipo_rec: 'cambio', dia: 2 }) === 'Elena ha preferido dejar el día 2 como estaba', 'AV5', '«Elena ha preferido dejar el día 2 como estaba»')
  debe(T('unido', { nombre: 'Laura' }) === 'Laura se ha unido a tu viaje', 'AV2', '«Laura se ha unido a tu viaje»')
  debe(T('d10', { destino: 'Roma', dias: 10 }) === 'En 10 días empieza tu viaje a Roma' && T('d10', { destino: 'Roma', dias: 1 }) === 'Mañana empieza tu viaje a Roma', 'AV2', '«En 10 días empieza tu viaje a Roma»')
  debe(T('resumen', {}) === 'Tu resumen del viaje está listo', 'AV2', '«Tu resumen del viaje está listo»')
  debe(T('sorpresas', { texto: 'Te quedan 3 días para reclamar tus 2 sorpresas de Roma' }) === 'Te quedan 3 días para reclamar tus 2 sorpresas de Roma', 'AV2', '«Te quedan 3 días para reclamar tus 2 sorpresas de Roma»')
  debe(T('recomendacion', { autor: null, tipo_rec: 'cambio', dia: 2 }) === 'Te recomiendan un cambio en el día 2' && !/Viajero/.test(T('recomendacion', { autor: null, tipo_rec: 'ruta', dia: null })), 'AV2', 'sin nombre puesto no se inventa «Viajero»: «Te recomiendan un cambio en el día 2»')
  const p8 = M.textoDelPush({ tipo: 'd10', payload: { destino: 'Roma', dias: 10, con_pase: true, inicio: '2026-10-16', fin: '2026-10-19' } })
  debe(p8 === 'En 10 días empieza tu viaje a Roma. Tu Pase de Roma está activo para el viaje del 16 al 19 de octubre.', 'P8', 'P8: el aviso de los 10 días en el móvil, con lo del pase')
  debe(M.textoDelPush({ tipo: 'd10', payload: { destino: 'Roma', dias: 10, con_pase: false } }) === 'En 10 días empieza tu viaje a Roma', 'P8', 'sin pase, el aviso de los 10 días no habla del pase')
  debe(M.quienDelAviso({ tipo: 'recomendacion', payload: { autor: 'Laura' } }) === 'Laura' && M.quienDelAviso({ tipo: 'd10', payload: {} }) === null, 'AV2', 'la inicial del círculo es de quien lo hace; los avisos de fecha no llevan persona')
  debe(M.haceCuanto('2026-10-10T10:00:00Z', Date.parse('2026-10-10T10:05:00Z')) === 'hace 5 min' && M.haceCuanto('2026-10-10T10:00:00Z', Date.parse('2026-10-10T11:10:00Z')) === 'hace 1 h' && M.haceCuanto('2026-10-09T10:00:00Z', Date.parse('2026-10-10T12:00:00Z')) === 'ayer' && M.haceCuanto('2026-10-06T10:00:00Z', Date.parse('2026-10-10T12:00:00Z')) === '6 oct' && M.haceCuanto('2026-10-10T10:00:00Z', Date.parse('2026-10-10T10:00:10Z')) === 'ahora', 'AV2', 'cuánto hace de cada aviso: «hace 5 min», «hace 1 h», «ayer», «6 oct»')
  debe(M.avisoDeLaDireccion('?aviso=0f8fad5b-d9cb-469f-a165-70867728950e') === '0f8fad5b-d9cb-469f-a165-70867728950e' && M.avisoDeLaDireccion('?aviso=<script>') === null && M.avisoDeLaDireccion('') === null, 'AV6', 'el aviso del móvil lleva su identificador en la dirección (solo uno que parezca un identificador)')

  // La lista: lo no leído, destacado; lo leído, no; «Aceptada» / «No aceptada».
  const ahora = Date.parse('2026-10-10T10:10:00Z')
  const av = (id, tipo, leido, extra = {}) => ({ id, tipo, texto: M.textoDelAviso({ tipo, payload: extra.payload ?? {} }), quien: M.quienDelAviso({ tipo, payload: extra.payload ?? {} }), creado_en: '2026-10-10T10:05:00Z', leido, payload: {}, etiqueta: null, ...extra })
  const lista = M.pintaListaDeAvisos({ avisos: [av('a1', 'recomendacion', false, { payload: { autor: 'Laura', tipo_rec: 'cambio', dia: 2 } }), av('a2', 'unido', true, { payload: { nombre: 'Laura' } }), av('a3', 'recomendacion', true, { payload: { autor: 'Laura', tipo_rec: 'cambio', dia: 3 }, etiqueta: 'Aceptada' }), av('a4', 'recomendacion', true, { payload: { autor: 'Laura', tipo_rec: 'dia', dia: 4 }, etiqueta: 'No aceptada' }), av('a5', 'd10', false, { payload: { destino: 'Roma', dias: 10 } })], onTocar: () => undefined, ahora })
  debe(/data-aviso="a1"[^>]*data-sin-leer="1"/.test(lista) && !/data-aviso="a2"[^>]*data-sin-leer/.test(lista), 'AV2', 'lo no leído, destacado; lo leído, no')
  debe((lista.match(/aria-label="Sin leer"/g) ?? []).length === 2, 'AV2', 'cada aviso sin leer lleva su puntito')
  debe(/Aceptada/.test(lista) && /No aceptada/.test(lista) && /data-aviso="a3"[^>]*>/.test(lista) && !/role="button"[^>]*data-aviso="a3"/.test(lista), 'AV3', 'AV3: una recomendación ya contestada queda «Aceptada» o «No aceptada» y deja de ser tocable')
  debe(/role="button"[^>]*data-aviso="a1"/.test(lista), 'AV2', 'tocar una recomendación abre R2')
  debe(/hace 5 min/.test(lista), 'AV2', 'cada aviso dice cuánto hace')

  // El permiso del móvil: una sola vez y nunca en iPhone sin la web instalada.
  const base = { plataforma: 'android', instalada: false, disponible: true, preguntado: false, permiso: 'default', servidorListo: true }
  debe(M.tocaPedirPermiso(base) === true, 'permiso', 'toca pedir el permiso la primera vez')
  debe(M.tocaPedirPermiso({ ...base, preguntado: true }) === false, 'permiso', 'una sola vez: si ya se preguntó, no')
  debe(M.tocaPedirPermiso({ ...base, plataforma: 'ios', instalada: false }) === false, 'permiso', 'en iPhone con la web sin instalar en la pantalla de inicio, NO se pide el permiso')
  debe(M.tocaPedirPermiso({ ...base, plataforma: 'ios', instalada: true }) === true, 'permiso', 'en iPhone con la web instalada, sí')
  debe(M.tocaPedirPermiso({ ...base, permiso: 'denied' }) === false && M.tocaPedirPermiso({ ...base, permiso: 'granted' }) === false, 'permiso', 'si el permiso ya está decidido, no se vuelve a preguntar')
  debe(M.tocaPedirPermiso({ ...base, servidorListo: false }) === false && M.tocaPedirPermiso({ ...base, disponible: false }) === false, 'permiso', 'sin avisos en el servidor (PUSH_ACTIVO apagado) o sin soporte del navegador, no se pide')
  const fuentePermiso = fs.readFileSync('src/lib/permisoAvisos.ts', 'utf8')
  debe(/if \(permiso === 'default'\) return 'no_toca'/.test(fuentePermiso) && /const clave = claveEnCache/.test(fuentePermiso), 'permiso', 'si el navegador no llegó a preguntar (sin toque), no se gasta la única vez; la clave ya está lista para preguntar en el mismo toque')
  const fuenteBotones = fs.readFileSync('src/components/propuesta/BotonesDeViaje.tsx', 'utf8')
  const fuenteBarra = fs.readFileSync('src/components/propuesta/BarraDePropuesta.tsx', 'utf8')
  const fuenteHost = fs.readFileSync('src/components/avisos/AvisosHost.tsx', 'utf8')
  debe(/void pedirPermisoUnaVez\(\)/.test(fuenteBotones) && /pedirPermisoUnaVez\(\); void enviar\(\)/.test(fuenteBarra) && /hoyEnLocal\(\) <= inicio/.test(fuenteHost), 'permiso', 'la ventana del móvil sale tras [Compartir viaje], tras [Enviar a Elena] o al acabar el primer día')
  debe(!/N1|¿Te avisamos/.test(fs.readFileSync('src/components/avisos/AvisosHost.tsx', 'utf8') + fuentePermiso), 'permiso', 'fuera las tarjetas que preguntan si queremos avisos (N1)')
  const sw = fs.readFileSync('public/sw.js', 'utf8')
  debe(/datos\.titulo/.test(sw) && !/Tu viaje/.test(sw) && /ventanas\[0\]\.postMessage\(\{ tipo: 'aviso', id \}\)/.test(sw) && /openWindow\(url\)/.test(sw), 'AV6', 'el aviso del móvil lleva el título que manda el servidor (el nombre de la app, de data/marca.json) y, al tocarlo, abre la app con la campanita en ese aviso')
  const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'))
  debe(vercel.crons?.[0]?.path === '/api/cron/avisos' && /^\d+ \d+ \* \* \*$/.test(vercel.crons[0].schedule), 'cron', 'la tarea programada de Vercel: una vez al día (lo que deja el plan gratis)')
  const header = fs.readFileSync('src/components/layout/Header.tsx', 'utf8')
  debe(/useAvisosStore/.test(header) && /sinLeerLocales \+ sinLeerDeLaCuenta/.test(header), 'AV1', 'el puntito de la campanita cuenta lo no leído de la cuenta y los avisos de siempre')
  const notices = fs.readFileSync('src/components/layout/NoticesSheet.tsx', 'utf8')
  debe(/<ListaDeAvisos/.test(notices) && /itemsEnOrden\.map/.test(notices), 'AV2', 'los avisos de siempre siguen saliendo en la misma campanita, junto a los de la cuenta')
  debe(/<Header /.test(fs.readFileSync('src/components/route/RouteView.tsx', 'utf8')) && !/<Header /.test(fs.readFileSync('src/components/route/hoy/HoyView.tsx', 'utf8')), 'AV4', 'AV4: la campanita de HOY es la misma de la cabecera de RUTA y DÍAS (una sola, en el mismo sitio)')
}

console.log('4b. Los avisos en el servidor (disparadores, avisos con fecha, nunca de noche, un solo aviso, el móvil)')
const avisosMod = await import('../../server/avisos.js')
{
  const maria = await nuevoUsuario('maria4@correo.es', false, 'María Díaz')
  const lola4 = await nuevoUsuario('lola4@correo.es', false, 'Lola')
  const viaje4 = await como(maria, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [maria, JSON.stringify({ destination: 'Roma', answers: { dateRange: { start: '2026-10-16', end: '2026-10-19' } }, days: [{ id: 'd1', dayNumber: 1, stops: [] }, { id: 'd2', dayNumber: 2, stops: [] }] })]))[0].id)
  const invitacion4 = await como(maria, async () => (await q('select public.crear_invitacion($1, null, 2) as r', [viaje4]))[0].r)
  await como(lola4, () => q('select public.canjear_invitacion($1)', [invitacion4.codigo]))
  const avisosDe = (uid) => q('select tipo, clave, payload, leido_en, push_en from public.avisos where user_id = $1 order by creado_en, clave', [uid])
  const deMaria = await avisosDe(maria)
  debe(deMaria.length === 1 && deMaria[0].tipo === 'unido' && deMaria[0].payload.nombre === 'Lola' && deMaria[0].leido_en === null, 'avisos', 'cuando alguien entra en el viaje, el administrador recibe «Lola se ha unido a tu viaje» (sin leer)')
  const resp = JSON.stringify({ dayId: 'd2', accion: 'quitar', stopId: 'x' })
  const rec1 = await como(lola4, async () => (await q("insert into public.trip_recommendations (trip_id, tipo, payload) values ($1, 'cambio', $2::jsonb) returning id", [viaje4, resp]))[0].id)
  const aviso1 = (await avisosDe(maria)).find((a) => a.tipo === 'recomendacion')
  debe(aviso1 && aviso1.payload.autor === 'Lola' && aviso1.payload.dia === 2 && aviso1.payload.tipo_rec === 'cambio' && aviso1.payload.rec_id === rec1, 'avisos', 'una recomendación avisa al administrador, con quién, de qué tipo y el número del día')
  debe((await avisosDe(lola4)).length === 0, 'avisos', 'quien recomienda no recibe aviso de lo suyo')
  const servicioA = avisosMod.crearServicioAvisos({ admin, destinos: { roma: { destino: 'Roma', timezone: 'Europe/Rome' } }, ahora: () => new Date('2026-10-06T10:00:00Z'), log: { warn() {} } })
  let lst = await servicioA.listar(maria)
  debe(lst.avisos.some((a) => a.texto === 'Lola te recomienda un cambio en el día 2') && lst.sin_leer === 3 && lst.avisos.length === 3, 'avisos', 'GET /api/avisos: el texto ya escrito y 3 sin leer (la recomendación, la unión y el de los 10 días)')
  debe(lst.avisos.some((a) => a.tipo === 'd10' && a.texto === 'En 10 días empieza tu viaje a Roma'), 'avisos', 'el 6 de octubre a las 12:00 en Roma, «En 10 días empieza tu viaje a Roma» (el viaje empieza el 16)')
  const lst2 = await servicioA.listar(maria)
  debe(lst2.avisos.filter((a) => a.tipo === 'd10').length === 1, 'avisos', 'cada aviso con fecha sale UNA sola vez, aunque se mire cien veces')
  // La recomendación se contesta: la campanita de Lola, y el aviso de María queda leído y con su etiqueta.
  await como(maria, () => q("update public.trip_recommendations set estado = 'aceptada' where id = $1", [rec1]))
  const deLola = await servicioA.listar(lola4)
  debe(deLola.avisos.length === 1 && deLola.avisos[0].texto === 'Maria ha aceptado tu cambio en el día 2'.replace('Maria', 'María') && deLola.avisos[0].tipo === 'aceptada' && deLola.avisos[0].quien === 'María', 'avisos', 'AV5: Lola ve «María ha aceptado tu cambio en el día 2»')
  const m2 = await servicioA.listar(maria)
  const avRec = m2.avisos.find((a) => a.tipo === 'recomendacion')
  debe(avRec.leido === true && avRec.etiqueta === 'Aceptada', 'avisos', 'AV3: el aviso del administrador queda «Aceptada» y leído al contestar')
  debe(m2.sin_leer === 2, 'avisos', 'lo contestado no cuenta como sin leer (quedan la unión y el de los 10 días)')
  const rec2 = await como(lola4, async () => (await q("insert into public.trip_recommendations (trip_id, tipo, payload) values ($1, 'ruta', $2::jsonb) returning id", [viaje4, JSON.stringify({ days: [] })]))[0].id)
  await como(maria, () => q("update public.trip_recommendations set estado = 'rechazada' where id = $1", [rec2]))
  const l2 = await servicioA.listar(lola4)
  debe(l2.avisos[0].tipo === 'rechazada' && l2.avisos[0].texto === 'María ha preferido dejar tu ruta como estaba' && l2.avisos[0].tipo !== undefined, 'avisos', 'AV5: «María ha preferido dejar tu ruta como estaba» cuando la ruta entera no se acepta')
  debe((await servicioA.marcarLeidos(maria, [m2.avisos[0].id])).ok === true && (await servicioA.listar(maria)).avisos.find((a) => a.id === m2.avisos[0].id).leido === true, 'avisos', 'marcar como leído funciona y es solo de esa persona')
  debe((await como(lola4, () => q('select count(*)::int as n from public.avisos where user_id = $1', [maria])))[0].n === 0, 'avisos', 'nadie ve los avisos de otra persona')
  debe((await como(lola4, () => lanza(() => q("update public.avisos set leido_en = now() where user_id = $1", [lola4])))) !== null || (await q('select 1 from public.avisos where user_id = $1 and leido_en is not null', [lola4])).length === 0, 'avisos', 'los avisos no se escriben desde el móvil: solo los disparadores y el servidor')

  // Los avisos con fecha: nunca de noche, uno solo, sin guardados.
  const noche = avisosMod.crearServicioAvisos({ admin, destinos: { roma: { destino: 'Roma', timezone: 'Europe/Rome' } }, ahora: () => new Date('2026-10-06T22:30:00Z'), log: { warn() {} } })
  const tom = await nuevoUsuario('tom4@correo.es', false, 'Tom')
  await como(tom, () => q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb)', [tom, JSON.stringify({ destination: 'Roma', answers: { dateRange: { start: '2026-10-16', end: '2026-10-18' } }, days: [] })]))
  debe((await noche.prepararDeUsuario(tom, new Date('2026-10-06T22:30:00Z'))) === 0 && (await avisosDe(tom)).length === 0, 'noche', 'NUNCA DE NOCHE: a las 00:30 de Roma no se crea el aviso')
  debe((await noche.prepararDeUsuario(tom, new Date('2026-10-06T06:30:00Z'))) === 0, 'noche', 'ni a las 08:30 (antes de las 9:00)')
  debe((await noche.prepararDeUsuario(tom, new Date('2026-10-06T18:30:00Z'))) === 1, 'noche', 'a las 20:30 de Roma (todavía dentro de la ventana) sí se crea')
  const creadoTarde = (await avisosDe(tom)).length
  debe(creadoTarde === 1, 'noche', 'y se crea una sola vez')
  const ventana = avisosMod.dentroDeLaVentana
  debe(ventana(new Date('2026-10-06T07:00:00Z'), 'Europe/Rome') === true && ventana(new Date('2026-10-06T19:00:00Z'), 'Europe/Rome') === false && ventana(new Date('2026-10-06T07:30:00Z'), 'America/Mexico_City') === false && ventana(new Date('2026-10-06T16:00:00Z'), 'America/Mexico_City') === true, 'noche', 'la ventana es de las 9:00 a las 21:00 de la hora de cada viajero (probado con Roma y con México)')
  debe(ventana(new Date('2026-10-06T10:00:00Z'), 'zona-que-no-existe') === true, 'noche', 'con una zona rara, se usa la de siempre en vez de romper')
  const tom2 = await nuevoUsuario('tom5@correo.es', false, 'Tom')
  await como(tom2, () => q('insert into public.trips (traveler_id, route, guardado_en) values ($1, $2::jsonb, now())', [tom2, JSON.stringify({ destination: 'Roma', answers: { dateRange: { start: '2026-10-16', end: '2026-10-18' } }, days: [] })]))
  debe((await servicioA.prepararDeUsuario(tom2, new Date('2026-10-06T10:00:00Z'))) === 0, 'avisos', 'un viaje guardado aparte no avisa')
  const tom3 = await nuevoUsuario('tom6@correo.es', false, 'Tom')
  await como(tom3, () => q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb)', [tom3, JSON.stringify({ destination: 'Roma', answers: { dateRange: { start: '2026-10-30', end: '2026-11-02' } }, days: [] })]))
  debe((await servicioA.prepararDeUsuario(tom3, new Date('2026-10-06T10:00:00Z'))) === 0, 'avisos', 'a más de 10 días no se avisa todavía')
  // Con pase y con dos viajes que se pisan.
  const pepa = await nuevoUsuario('pepa4@correo.es', false, 'Pepa')
  const rutaPepa = (a, b) => JSON.stringify({ destination: 'Roma', answers: { dateRange: { start: a, end: b } }, days: [] })
  const tA = await como(pepa, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [pepa, rutaPepa('2026-10-16', '2026-10-19')]))[0].id)
  const tB = await como(pepa, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [pepa, rutaPepa('2026-10-16', '2026-10-20')]))[0].id)
  await servidor(() => q("select public.registrar_pago('cs_pepa', 'pi_pepa', 'mentira', $1, 'Roma', 'uno', 1, 699, 'eur', $2)", [pepa, tA]))
  await servicioA.prepararDeUsuario(pepa, new Date('2026-10-06T10:00:00Z'))
  const d10Pepa = (await avisosDe(pepa)).filter((a) => a.tipo === 'd10')
  debe(d10Pepa.length === 2 && d10Pepa.every((a) => a.payload.con_pase === true && a.payload.otro && a.payload.dias === 10), 'P8b', 'con el pase y dos viajes que se pisan, el aviso de los 10 días lleva el otro viaje (para P8b)')
  // Los avisos de logros (resumen y «te quedan N días») pasan a la campanita, una vez y no de noche.
  const nel = await nuevoUsuario('nel4@correo.es', false, 'Nel')
  const tN = await como(nel, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [nel, rutaPepa('2026-09-20', '2026-09-22')]))[0].id)
  await servidor(() => q("insert into public.logro_avisos (user_id, trip_id, tipo, enviar_en, payload) values ($1, $2, 'resumen_viaje', '2026-09-23T08:00:00Z', '{}'::jsonb), ($1, $2, 'quedan_dias', '2026-10-17T08:00:00Z', $3::jsonb)", [nel, tN, JSON.stringify({ destino: 'Roma', dias: 3, texto: 'Te quedan 3 días para reclamar tus 2 sorpresas de Roma' })]))
  const sNel = avisosMod.crearServicioAvisos({ admin, destinos: { roma: { destino: 'Roma', timezone: 'Europe/Rome' } }, ahora: () => new Date('2026-09-23T10:00:00Z'), log: { warn() {} } })
  const lNel = await sNel.listar(nel)
  debe(lNel.avisos.length === 1 && lNel.avisos[0].tipo === 'resumen' && lNel.avisos[0].texto === 'Tu resumen del viaje está listo', 'avisos', 'el resumen del viaje llega a la campanita al día siguiente, a su hora')
  const lNel2 = await sNel.listar(nel)
  debe(lNel2.avisos.length === 1 && (await q("select count(*)::int as n from public.logro_avisos where enviado_en is not null and user_id = $1", [nel]))[0].n === 1, 'avisos', 'una sola vez (y la cola de los logros lo da por entregado)')
  const sNel2 = avisosMod.crearServicioAvisos({ admin, destinos: { roma: { destino: 'Roma', timezone: 'Europe/Rome' } }, ahora: () => new Date('2026-10-17T10:00:00Z'), log: { warn() {} } })
  const lNel3 = await sNel2.listar(nel)
  debe(lNel3.avisos.some((a) => a.tipo === 'sorpresas' && a.texto === 'Te quedan 3 días para reclamar tus 2 sorpresas de Roma'), 'avisos', '«Te quedan 3 días para reclamar tus 2 sorpresas de Roma»')

  // El aviso en el móvil.
  await servidor(() => q("insert into public.push_suscripciones (user_id, endpoint, claves) values ($1, 'https://push.test/maria', '{\"p256dh\":\"a\",\"auth\":\"b\"}'::jsonb), ($2, 'https://push.test/caduca', '{\"p256dh\":\"a\",\"auth\":\"b\"}'::jsonb)", [maria, tom]))
  await q("update public.travelers set zona = 'Europe/Rome' where id in ($1, $2)", [maria, tom])
  const enviados = []
  const falso = { setVapidDetails() {}, sendNotification: async (sub, cuerpo) => { if (sub.endpoint.includes('caduca')) throw Object.assign(new Error('gone'), { statusCode: 410 }); enviados.push({ sub, cuerpo: JSON.parse(cuerpo) }) } }
  const entorno = { PUSH_ACTIVO: 'true', VAPID_PUBLIC_KEY: 'pub', VAPID_PRIVATE_KEY: 'priv', VAPID_CONTACTO: 'mailto:x@y.es' }
  const mk = (hora, env = entorno) => avisosMod.crearServicioAvisos({ admin, env, ahora: () => new Date(hora), cargarWebPush: async () => ({ default: falso }), log: { warn() {} } })
  debe((await mk('2026-10-06T10:00:00Z', {}).enviarPush()).motivo === 'apagado' && enviados.length === 0, 'push', 'con PUSH_ACTIVO apagado no se manda nada (la campanita funciona igual)')
  debe((await mk('2026-10-06T10:00:00Z', { PUSH_ACTIVO: 'true' }).enviarPush()).motivo === 'faltan_claves_vapid', 'push', 'sin las claves VAPID, tampoco')
  const deNoche = await mk('2026-10-06T22:30:00Z').enviarPush()
  debe(deNoche.enviados === 0 && enviados.length === 0 && (await q('select 1 from public.avisos where push_en is not null')).length === 0, 'noche', 'NUNCA DE NOCHE: a las 00:30 de Roma no sale ningún aviso al móvil, y no se marcan como enviados (saldrán de día)')
  const dia = await mk('2026-10-06T10:00:00Z').enviarPush()
  debe(dia.enviados >= 1 && enviados.every((e) => e.cuerpo.titulo === JSON.parse(fs.readFileSync('data/marca.json', 'utf8')).nombre), 'push', 'de día sale el aviso al móvil, con el nombre de la app de data/marca.json como título')
  debe(enviados.every((e) => /^\/\?aviso=[0-9a-f-]{36}$/.test(e.cuerpo.url)) && enviados.some((e) => /Lola te recomienda|Lola se ha unido|Maria|María/.test(e.cuerpo.cuerpo) || e.cuerpo.cuerpo.length > 5), 'push', 'cada aviso del móvil lleva su dirección (/?aviso=ID): al tocarlo se abre la campanita en ese aviso')
  const otraVez = await mk('2026-10-06T10:05:00Z').enviarPush()
  debe(otraVez.enviados === 0, 'push', 'cada aviso sale una sola vez')
  debe((await q("select 1 from public.push_suscripciones where endpoint like '%caduca'")).length === 0, 'push', 'una suscripción caducada (410) se borra')
  debe(!enviados.some((e) => e.sub.endpoint.includes('lola4')), 'push', 'quien no dio permiso (sin suscripción) no recibe nada en el móvil')
  const mail = avisosMod.emailDeAvisosEncendido
  debe(mail({}) === false && mail({ AVISOS_EMAIL_ACTIVO: 'true' }) === false && mail({ AVISOS_EMAIL_ACTIVO: 'true', CORREO_API_KEY: 'k' }) === true, 'email', 'el email para quien no dé permiso está preparado y APAGADO (falta el servicio de correos)')
  debe(avisosMod.pushEncendido({}) === false, 'push', 'el aviso del móvil nace apagado (PUSH_ACTIVO)')

  // La tarea programada y las rutas.
  const sCron = avisosMod.crearServicioAvisos({ admin, destinos: { roma: { destino: 'Roma', timezone: 'Europe/Rome' } }, env: entorno, ahora: () => new Date('2026-10-06T10:00:00Z'), cargarWebPush: async () => ({ default: falso }), log: { warn() {} } })
  const tarea = await sCron.tareaProgramada(new Date('2026-10-06T10:00:00Z'))
  debe(tarea.ok === true && tarea.personas >= 3, 'cron', 'la tarea programada mira a las personas con viaje próximo, avisos de logros vencidos o avisos sin mandar')
  const appA = express()
  appA.use(express.json())
  fichas.set('tok-maria4', maria)
  fichas.set('tok-anon4', anonimo)
  avisosMod.registrarRutasAvisos(appA, { admin, servicio: sCron, env: { CRON_SECRET: 'secreto-cron', ...entorno } })
  const sA = await new Promise((ok) => {
    const s = appA.listen(0, () => ok(s))
  })
  const urlA = `http://127.0.0.1:${sA.address().port}`
  const pide = async (ruta, { metodo = 'GET', token, cuerpo } = {}) => {
    const r = await fetch(urlA + ruta, { method: metodo, headers: { ...(cuerpo ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: cuerpo ? JSON.stringify(cuerpo) : undefined })
    return { estado: r.status, json: await r.json().catch(() => null) }
  }
  debe((await pide('/api/avisos')).estado === 401 && (await pide('/api/avisos', { token: 'tok-anon4' })).estado === 403, 'rutas', 'sin sesión 401; con una sesión anónima 403 (los avisos van con la cuenta)')
  const rl = await pide('/api/avisos', { token: 'tok-maria4' })
  debe(rl.estado === 200 && rl.json.ok === true && Array.isArray(rl.json.avisos) && typeof rl.json.sin_leer === 'number', 'rutas', 'GET /api/avisos devuelve la lista y cuántos hay sin leer')
  const rm = await pide('/api/avisos/leidos', { metodo: 'POST', token: 'tok-maria4', cuerpo: {} })
  debe(rm.estado === 200 && (await pide('/api/avisos', { token: 'tok-maria4' })).json.sin_leer === 0, 'rutas', 'POST /api/avisos/leidos sin lista los marca todos')
  debe((await pide('/api/avisos/push/clave')).json.clave === 'pub', 'rutas', 'la clave pública del aviso del móvil solo sale con el envío encendido')
  debe((await pide('/api/cron/avisos')).estado === 404 && (await pide('/api/cron/avisos', { token: 'otra' })).estado === 404 && (await pide('/api/cron/avisos', { token: 'secreto-cron' })).json.ok === true, 'cron', 'la tarea programada solo contesta con el secreto de Vercel; sin él, la ruta no existe')
  sA.close()
  const sinCron = express()
  avisosMod.registrarRutasAvisos(sinCron, { admin, servicio: sCron, env: {} })
  const sB = await new Promise((ok) => {
    const s = sinCron.listen(0, () => ok(s))
  })
  debe((await (await fetch(`http://127.0.0.1:${sB.address().port}/api/cron/avisos`)).status) === 404, 'cron', 'sin CRON_SECRET en el servidor, la ruta de la tarea no existe')
  sB.close()

  // Borrar la cuenta: se van sus avisos y sus permisos del móvil.
  fichas.set('tok-tom4', tom)
  const antesTom = (await q('select count(*)::int as n from public.avisos where user_id = $1', [tom]))[0].n
  const borrado = await borrarCuenta(admin, 'tok-tom4')
  debe(antesTom >= 1 && borrado.estado === 200 && (await q('select count(*)::int as n from public.avisos where user_id = $1', [tom]))[0].n === 0 && (await q('select count(*)::int as n from public.push_suscripciones where user_id = $1', [tom]))[0].n === 0, 'borrar', 'al borrar la cuenta se van sus avisos y sus permisos de avisos del móvil')
}

/* ═══════════════ PARTES 5, 6 y 7 · Ajustes, Mis pases, Borrar la cuenta, foto y nombre, invitar a un amigo ═══════════════ */
console.log('5. Ajustes (P3), Mis pases (P4) y Borrar la cuenta (P5)')
{
  const M = encendido
  const duo = { id: 'p1', destino: 'Roma', tipo: 'duo', estado: 'activo', creado_en: '2026-09-02T10:00:00Z', usos_max: 2, usos_usados: 2, es_mio: true, importe_cent: 1099, moneda: 'eur', tiene_recibo: true, viaje: { id: 'v', destino: 'Roma', inicio: '2026-10-10', fin: '2026-10-14' }, miembros: [{ nombre: 'Elena', es_yo: true, es_comprador: true }, { nombre: 'Laura', es_yo: false, es_comprador: false }], invitacion: { id: 'i', codigo: 'K7MQ4XWH', trip_id: 'v' } }
  const uno = { id: 'p2', destino: 'Lisboa', tipo: 'uno', estado: 'activo', creado_en: '2026-09-30T10:00:00Z', usos_max: 1, usos_usados: 1, es_mio: true, importe_cent: 699, moneda: 'eur', tiene_recibo: true, viaje: { id: 'w', destino: 'Lisboa', inicio: '2026-12-12', fin: '2026-12-15' }, miembros: [{ nombre: 'Elena', es_yo: true, es_comprador: true }], invitacion: null }
  debe(M.textoDeMisPases([duo, uno]) === '2 pases · Roma (Dúo) y Lisboa' && M.textoDeMisPases([uno]) === '1 pase · Lisboa' && M.textoDeMisPases([]) === 'Todavía no tienes ninguno' && M.textoDeMisPases([{ ...duo, estado: 'anulado' }]) === 'Todavía no tienes ninguno', 'P3', '«2 pases · Roma (Dúo) y Lisboa» con los pases de verdad (los anulados no cuentan)')
  debe(M.textoDeComoEntra('google') === 'Entras con Google' && M.textoDeComoEntra('email') === 'Entras con tu email' && M.textoDeComoEntra(null) === 'Entras con tu email', 'P3', '«Entras con tu email» o «Entras con Google»')
  const aj = M.pintaAjustes({ emailInicial: 'elena@correo.com', proveedorInicial: 'email', pasesIniciales: [duo, uno] })
  debe(/Ajustes/.test(aj) && />Mi cuenta</.test(aj) && /elena@correo\.com/.test(aj) && /Entras con tu email/.test(aj) && /Cerrar sesión/.test(aj), 'P3', 'P3: «Mi cuenta» con su email, cómo entra y [Cerrar sesión]')
  debe(/>Mis pases<\/span><span[^>]*>2 pases · Roma \(Dúo\) y Lisboa</.test(aj) || /2 pases · Roma \(Dúo\) y Lisboa/.test(aj), 'P3', 'P3: «Mis pases» con los suyos')
  debe(/Sonido de los momentos/.test(aj) && /Avisos en el móvil/.test(aj) && /El resumen del viaje y «en 10 días empieza tu viaje»/.test(aj) && /Ver otra vez el tutorial/.test(aj) && /Privacidad y condiciones/.test(aj), 'P3', 'P3: «La app» con el sonido, los avisos, el tutorial y la privacidad')
  debe(/role="switch"/.test(aj) && (aj.match(/role="switch"/g) ?? []).length === 2, 'P3', 'el sonido y los avisos son interruptores de verdad (role switch)')
  debe(/Invitar a un amigo/.test(aj) && /Compartir el enlace/.test(aj) && /Tengo un código de invitación/.test(aj), 'invitar', 'Ajustes: «Invitar a un amigo» con [Compartir el enlace], y el sitio donde escribir un código')
  debe(/data-borrar-cuenta[^>]*>Borrar mi cuenta</.test(aj) && !/data-borrar-dialogo/.test(aj), 'P3', 'P3 termina con «Borrar mi cuenta» (sin el diálogo hasta tocarlo)')
  const p5 = M.pintaAjustes({ emailInicial: 'elena@correo.com', pasesIniciales: [duo], borrandoInicial: true })
  debe(/¿Borrar tu cuenta\?/.test(p5) && /Se borrarán tu cuenta, tus fotos y tus logros\. No se puede deshacer\./.test(p5) && /data-confirmar-borrar[^>]*>Borrar mi cuenta</.test(p5) && />Cancelar</.test(p5), 'P5', 'P5: «¿Borrar tu cuenta?», [Borrar mi cuenta] y [Cancelar]')
  debe(!/Seguir sin cuenta|Cerrar sesión y borrar|CuentaEnPerfil/.test(fs.readFileSync('src/components/layout/PerfilSheet.tsx', 'utf8')) && !fs.existsSync('src/components/cuenta/CuentaEnPerfil.tsx'), 'perfil', 'fuera del Perfil los botones provisionales de cerrar sesión y borrar')
  const gear = fs.readFileSync('src/components/logros/pantallas/perfil/CuerpoConLogros.tsx', 'utf8')
  const cab = fs.readFileSync('src/components/perfil/CabeceraDeSiempre.tsx', 'utf8')
  debe(/data-ajustes onClick=\{\(\) => abrirAjustes\(\)\}/.test(gear) && /data-ajustes onClick=\{\(\) => abrirAjustes\(\)\}/.test(cab), 'P3', 'el botón de Ajustes del Perfil (con y sin logros) abre P3')
  const hosts = fs.readFileSync('src/App.tsx', 'utf8')
  debe(/<AjustesHosts \/>/.test(hosts), 'P3', 'Ajustes se monta una sola vez en la app')

  // P4
  debe(M.etiquetaDelPase(duo) === 'PASE DÚO · 2 PERSONAS' && M.etiquetaDelPase(uno) === 'PASE · 1 PERSONA' && M.etiquetaDelPase({ tipo: 'grupo', usos_max: 4 }) === 'PASE GRUPO · 4 PERSONAS', 'P4', 'el tipo de cada pase')
  debe(M.estadoDelPase(duo, '2026-10-11') === 'En curso' && M.estadoDelPase(uno, '2026-10-11') === 'Próximo' && M.estadoDelPase(duo, '2026-11-01') === 'Terminado' && M.estadoDelPase({ ...duo, estado: 'anulado' }, '2026-10-11') === 'Anulado' && M.estadoDelPase({ estado: 'activo', viaje: null }, '2026-10-11') === 'Sin viaje', 'P4', '«En curso» / «Próximo» según su viaje (y «Anulado» si se devolvió el pago)')
  debe(M.fechaDeCompra('2026-09-02T10:00:00Z') === '2 sep 2026' && M.rangoDelViaje(duo.viaje) === '10 – 14 oct 2026', 'P4', 'la fecha de compra y el viaje, como en el diseño')
  debe(JSON.stringify(M.filasDelPase(duo).map((f) => f.k)) === '["Comprado el","Precio","Viaje"]' && M.filasDelPase(duo)[1].v === '10,99 €', 'P4', 'Comprado el · Precio · Viaje')
  debe(!M.filasDelPase({ ...duo, es_mio: false, importe_cent: null }).some((f) => f.k === 'Precio'), 'P4', 'quien no compró el pase no ve el precio')
  const pers = M.personasDelPase(duo)
  debe(pers.length === 2 && pers[0].nombre === 'Elena · tú' && pers[0].estado === 'Quien lo compró' && pers[1].nombre === 'Laura' && pers[1].estado === '✓ Dentro', 'P4', 'con quién lo comparte: «Elena · tú · Quien lo compró» y «Laura · ✓ Dentro»')
  debe(M.personasDelPase({ ...duo, miembros: [duo.miembros[0]] }).some((p) => p.libre && p.nombre === 'Plaza libre'), 'P4', 'una plaza sin ocupar se enseña como libre')
  const mp = M.pintaMisPases({ pasesIniciales: [duo, uno], hoy: '2026-10-11' })
  debe(/Mis pases/.test(mp) && /PASE DÚO · 2 PERSONAS/.test(mp) && /Roma/.test(mp) && /En curso/.test(mp) && /Próximo/.test(mp) && /Lo compartes con/.test(mp) && /Código para invitar/.test(mp) && /K7MQ4XWH/.test(mp) && />Enlace</.test(mp) && (mp.match(/Ver recibo/g) ?? []).length === 2, 'P4', 'P4: tipo, destino, estado, compra, precio, viaje, con quién, código, enlace y [Ver recibo] (uno por pase)')
  debe(!/Lo compartes con/.test(M.pintaMisPases({ pasesIniciales: [uno], hoy: '2026-10-11' })), 'P4', 'un pase de una persona no lleva «Lo compartes con»')
  debe(/Ver recibo/.test(M.pintaMisPases({ pasesIniciales: [duo] })) && !/Ver recibo/.test(M.pintaMisPases({ pasesIniciales: [{ ...duo, es_mio: false, tiene_recibo: false, importe_cent: null, invitacion: null }] })), 'P4', '[Ver recibo] solo para quien pagó')
  debe(/Anulado/.test(M.pintaMisPases({ pasesIniciales: [{ ...duo, estado: 'anulado' }] })) && !/Código para invitar/.test(M.pintaMisPases({ pasesIniciales: [{ ...duo, estado: 'anulado' }] })), 'P4', 'un pase anulado se ve como anulado y ya no deja invitar')
  const fuenteMP = fs.readFileSync('src/components/ajustes/MisPases.tsx', 'utf8')
  debe(/verRecibo\(p\.id\)/.test(fuenteMP) && /crearInvitacion\(viaje, \{ passId: p\.id \}\)/.test(fuenteMP), 'P4', '[Ver recibo] abre el recibo y «Crear código» invita con la plaza del pase')
  const fuenteAj = fs.readFileSync('src/components/ajustes/AjustesScreen.tsx', 'utf8')
  debe(/apagarAvisosDelMovil/.test(fuenteAj) && /encenderAvisosDelMovil/.test(fuenteAj) && /ponerSonido\(!sonido\)/.test(fuenteAj) && /useMomentosUI\.getState\(\)\.ponerPrimerDia\(true\)/.test(fuenteAj), 'P3', 'los avisos del móvil y el sonido se encienden y apagan de verdad; el tutorial vuelve a salir')
  debe(/borrarMiCuenta/.test(fuenteAj) && /cerrarSesion/.test(fuenteAj), 'P5', 'Cerrar sesión y Borrar mi cuenta llaman a lo de siempre')
}

console.log('6. La foto y el nombre del perfil')
{
  const M = encendido
  debe(M.nombreDePila('Laura García') === 'Laura' && M.nombreDePila('  ') === null && M.nombreDePila(null) === null && M.nombreDePila('Ana') === 'Ana', 'nombre', 'el nombre de pila de un nombre completo')
  debe(M.nombreParaMostrar(null) === 'Viajero' && M.nombreParaMostrar('  ') === 'Viajero' && M.nombreParaMostrar('Elena') === 'Elena', 'nombre', 'con el email, «Viajero» hasta que ponga un nombre')
  debe(M.inicialDeNombre('elena') === 'E' && M.inicialDeNombre(null) === 'V', 'nombre', 'la inicial: la del nombre o «V» de Viajero')
  const g = M.estadoDeSesion({ user: { id: 'u', is_anonymous: false, email: 'a@b.es', app_metadata: { provider: 'google' }, user_metadata: { full_name: 'Laura García', avatar_url: 'https://lh3.google.test/a.jpg' } } })
  debe(g.tipo === 'cuenta' && g.proveedor === 'google' && g.deGoogle.nombre === 'Laura García' && g.deGoogle.foto === 'https://lh3.google.test/a.jpg', 'nombre', 'al entrar con Google, su nombre y su foto de Google llegan con la sesión')
  const e = M.estadoDeSesion({ user: { id: 'u', is_anonymous: false, email: 'a@b.es', app_metadata: { provider: 'email' }, user_metadata: {} } })
  debe(e.proveedor === 'email' && e.deGoogle === null, 'nombre', 'con el email no hay nombre ni foto de Google')
  M.useMiPerfil.setState({ uid: null, nombre: null, fotoPath: null, fotoGoogle: null })
  await M.useMiPerfil.getState().cargar('u1', { nombre: 'Laura García', foto: 'https://lh3.google.test/a.jpg' })
  debe(M.useMiPerfil.getState().nombre === 'Laura' && M.useMiPerfil.getState().fotoGoogle === 'https://lh3.google.test/a.jpg', 'nombre', 'la primera vez, el nombre de pila de Google y su foto de Google')
  await M.useMiPerfil.getState().cargar('u2')
  debe(M.useMiPerfil.getState().nombre === null && M.useMiPerfil.getState().fotoGoogle === null, 'nombre', 'con el email: sin nombre («Viajero») y sin foto (la inicial)')
  M.useMiPerfil.setState({ uid: null, nombre: null, fotoPath: null, fotoGoogle: null })
  // Foto: pequeña y propia.
  debe(M.OBJETIVO_BYTES_FOTO_PERFIL <= 50 * 1024 && M.PASOS_DE_FOTO_DE_PERFIL[0].lado <= 256 && M.PASOS_DE_FOTO_DE_PERFIL.every((p, i, a) => i === 0 || p.lado <= a[i - 1].lado && p.calidad <= a[i - 1].calidad), 'foto', 'la foto es pequeña (unos pocos KB, un cuadrado de 256 px o menos) y cada intento es más pequeño que el anterior')
  debe(M.rutaNuevaDeFoto('uid-1', 1700000000000) === 'uid-1/foto-1700000000000.jpg', 'foto', 'cada foto nueva tiene su nombre (nadie ve una foto vieja en la caché), dentro de la carpeta de la persona')
  debe(M.fotoParaMostrar('uid/foto.jpg', 'https://g/a.jpg') === null || String(M.fotoParaMostrar(null, 'https://g/a.jpg')) === 'https://g/a.jpg', 'foto', 'sin foto propia, la de Google')
  debe(M.fotoParaMostrar(null, null) === null, 'foto', 'sin foto, la inicial')
  const fuentePerfil = fs.readFileSync('src/lib/miPerfil.ts', 'utf8')
  debe(/quitarMetadatosJpeg/.test(fuentePerfil) && /createImageBitmap/.test(fuentePerfil) && /BUCKET_PERFILES/.test(fuentePerfil) && /remove\(\[rutaAnterior\]\)/.test(fuentePerfil), 'foto', 'la foto se vuelve a dibujar (sin datos escondidos), va al almacén de perfiles y la anterior se borra')
  const av = M.pintaAvatar({ foto: null, inicial: 'E', tam: 52 })
  debe(/data-avatar="inicial"/.test(av) && />E</.test(av) && /data-avatar="foto"/.test(M.pintaAvatar({ foto: 'https://x/y.jpg', inicial: 'E' })), 'foto', 'el círculo: foto si la hay, inicial si no')
  const cuerpo = fs.readFileSync('src/components/logros/pantallas/perfil/CuerpoConLogros.tsx', 'utf8')
  debe(/Hola, <em>\{yo\.nombre\}<\/em>/.test(cuerpo) && /foto=\{yo\.foto\}/.test(cuerpo) && /data-editar-perfil/.test(cuerpo), 'foto', 'el Perfil dice «Hola, {nombre}», lleva la foto en el marco y tocarla la cambia')
  const pie = fs.readFileSync('src/components/logros/momentos/imagen.ts', 'utf8')
  debe(/inicial: inicialDeNombre\(yo\.nombre\)/.test(pie) && /fotoUrl: fotoParaMostrar/.test(pie) && /crossOrigin = 'anonymous'/.test(pie), 'foto', 'el pie de Compartir lleva mi inicial o mi foto')
  const lista = fs.readFileSync('src/components/avisos/ListaDeAvisos.tsx', 'utf8')
  debe(/<Avatar foto=\{fotoDe\?\.\(a\) \?\? null\}/.test(lista) && /fotoDeLaPersona/.test(fs.readFileSync('src/components/layout/NoticesSheet.tsx', 'utf8')), 'foto', 'lo que ven los demás: el «E» y el «L» de la campanita llevan su foto si la tienen')
  const edit = fs.readFileSync('src/components/ajustes/EditarPerfil.tsx', 'utf8')
  debe(/Hacer una foto/.test(edit) && /Elegir de la galería/.test(edit) && /capture="user"/.test(edit) && /Quitar la foto/.test(edit) && /Tu nombre/.test(edit), 'foto', 'editar mi perfil: hacer una foto, elegirla de la galería, quitarla y cambiar el nombre')
}

console.log('7. Invitar a un amigo (la EXP de la 8C1) y borrar la cuenta con su foto')
{
  const M = encendido
  debe(M.enlaceDeAmigo('https://app.ejemplo.es/', 'k7mq-4xwh') === 'https://app.ejemplo.es/?amigo=K7MQ4XWH', 'amigo', 'el enlace personal para invitar a la app')
  debe(M.codigoDeAmigoDeLaDireccion('?amigo=k7mq4xwh') === 'K7MQ4XWH' && M.codigoDeAmigoDeLaDireccion('?amigo=1') === null && M.codigoDeAmigoDeLaDireccion('') === null, 'amigo', 'el código personal de una dirección')
  const nueva = await nuevoUsuario('nueva7@correo.es', false, 'Nueva')
  const vieja = await nuevoUsuario('vieja7@correo.es', false, 'Vieja')
  const invitadora = await nuevoUsuario('invitadora7@correo.es', false, 'Inés')
  const otra = await nuevoUsuario('otra7@correo.es', false, 'Otra')
  // Su código personal (el de siempre).
  const miCodigo = await como(invitadora, async () => (await q('select public.mi_codigo_app() as c'))[0].c)
  debe(/^[A-Z2-9]{8}$/.test(miCodigo) && !/[OILol01]/.test(miCodigo), 'amigo', 'el enlace personal usa el mismo formato de código de toda la app')
  debe((await como(invitadora, async () => (await q('select public.mi_codigo_app() as c'))[0].c)) === miCodigo, 'amigo', 'cada persona tiene un solo código personal')
  debe((await como(await nuevoUsuario(null, true), () => lanza(() => q('select public.mi_codigo_app()')), { anonimo: true })) !== null, 'amigo', 'una sesión anónima no tiene enlace personal: primero la cuenta')
  // Fechas de alta: la nueva se acaba de crear; la vieja ya existía.
  await q("update public.travelers set alta_cuenta = now() where id = $1", [nueva])
  await q("update public.travelers set alta_cuenta = now() - interval '40 days' where id = $1", [vieja])
  await q("update public.travelers set alta_cuenta = now() where id = $1", [otra])
  const reg = (codigo, uid) => servidor(async () => (await q('select public.registrar_referido($1, $2) as r', [codigo, uid]))[0].r)
  debe((await reg(miCodigo, nueva)).registrado === true, 'amigo', 'cuenta NUEVA que entra por el enlace personal: cuenta como invitación')
  debe((await reg(miCodigo, vieja)).motivo === 'cuenta_antigua' && (await q('select 1 from public.logro_referidos where invitado_id = $1', [vieja])).length === 0, 'amigo', 'una cuenta que ya existía NO cuenta')
  debe((await reg(miCodigo, invitadora)).registrado === false, 'amigo', 'nadie se invita a sí mismo')
  debe((await reg('NOEXISTE', otra)).motivo === 'no_existe', 'amigo', 'un código que no existe no cuenta')
  // Cada persona tiene un solo invitador: el primero.
  const otroInvitador = await nuevoUsuario('otroinvitador7@correo.es', false, 'Otro')
  const codigo2 = await como(otroInvitador, async () => (await q('select public.mi_codigo_app() as c'))[0].c)
  const segundo = await reg(codigo2, nueva)
  debe(segundo.registrado === false && segundo.motivo === 'ya_tenia_invitador' && (await q('select invitador_id from public.logro_referidos where invitado_id = $1', [nueva]))[0].invitador_id === invitadora, 'amigo', 'cada persona tiene un solo invitador: el primero')
  // Entrar por un código de viaje o de pase también cuenta (si crea una cuenta nueva).
  const viaje7 = await como(invitadora, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [invitadora, rutaDe()]))[0].id)
  const invViaje = await como(invitadora, async () => (await q('select public.crear_invitacion($1, null, 3) as r', [viaje7]))[0].r)
  debe((await reg(invViaje.codigo, otra)).registrado === true && (await q('select invitador_id from public.logro_referidos where invitado_id = $1', [otra]))[0].invitador_id === invitadora, 'amigo', 'entrar por el código de un viaje, con una cuenta nueva, cuenta como invitación de quien invitó')
  const pase7 = (await servidor(() => q("select public.registrar_pago('cs_inv7', 'pi_inv7', 'mentira', $1, 'Roma', 'duo', 2, 1099, 'eur', $2) as r", [invitadora, viaje7])))[0].r
  const codPase = (await q('select codigo from public.passes where id = $1', [pase7.pase_id]))[0].codigo
  const recien = await nuevoUsuario('recien7@correo.es', false, 'Recién')
  await q("update public.travelers set alta_cuenta = now() where id = $1", [recien])
  debe((await reg(codPase, recien)).registrado === true, 'amigo', 'el código de un pase también cuenta')
  // Lo demás (100 EXP al acabar el primer viaje, máximo 10 al año) ya estaba: aquí solo se rellena la tabla.
  const exp = fs.readFileSync('server/logros/exp.js', 'utf8')
  debe(/viaje_acabado_en/.test(exp), 'amigo', 'la EXP del invitador sigue pidiendo que el amigo acabe su primer viaje (ya estaba)')
  // La ruta del servidor.
  const appR = express()
  appR.use(express.json())
  fichas.set('tok-nueva7', nueva)
  fichas.set('tok-vieja7', vieja)
  const cuentas = await import('../../server/cuentas.js')
  cuentas.registrarRutasCuentas(appR, admin)
  const sR = await new Promise((ok) => {
    const s = appR.listen(0, () => ok(s))
  })
  const post = async (token, codigo) => {
    const r = await fetch(`http://127.0.0.1:${sR.address().port}/api/invitaciones/registrar`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ codigo }) })
    return { estado: r.status, json: await r.json().catch(() => null) }
  }
  const nueva2 = await nuevoUsuario('nueva72@correo.es', false, 'Nueva2')
  await q("update public.travelers set alta_cuenta = now() where id = $1", [nueva2])
  fichas.set('tok-nueva72', nueva2)
  debe((await post(null, miCodigo)).estado === 401 && (await post('tok-anon4', miCodigo)).estado === 401, 'amigo', 'POST /api/invitaciones/registrar pide una cuenta de verdad')
  debe((await post('tok-nueva72', miCodigo)).json.registrado === true && (await post('tok-vieja7', miCodigo)).json.registrado === false, 'amigo', 'por HTTP: la cuenta nueva cuenta; la vieja, no')
  sR.close()
  const cuentasFuente = fs.readFileSync('src/lib/cuentas.ts', 'utf8')
  debe(/registrarInvitado\(codigo\)/.test(cuentasFuente) && /registrarInvitado\(amigo\)/.test(cuentasFuente) && /guardarAmigoPendiente\(amigo\)/.test(cuentasFuente), 'amigo', 'al crear la cuenta se apunta la invitación (de viaje, de pase o personal)')

  // Borrar la cuenta: la foto de perfil se va (y los registros de cobro se quedan, ya probado).
  const fotoU = await nuevoUsuario('foto7@correo.es', false, 'Foto')
  await q("insert into storage.buckets (id, name, public) values ('perfiles', 'perfiles', true) on conflict do nothing")
  await q("insert into storage.objects (bucket_id, name, owner) values ('perfiles', $1, $2), ('fotos-viaje', $3, $2)", [`${fotoU}/foto-1.jpg`, fotoU, `${fotoU}/x/a.jpg`])
  await q('update public.travelers set foto_path = $1 where id = $2', [`${fotoU}/foto-1.jpg`, fotoU])
  fichas.set('tok-foto7', fotoU)
  const bor = await borrarCuenta(admin, 'tok-foto7')
  debe(bor.estado === 200 && (await q("select 1 from storage.objects where bucket_id = 'perfiles' and name like $1", [`${fotoU}/%`])).length === 0 && (await q("select 1 from storage.objects where name like $1", [`${fotoU}/%`])).length === 0, 'borrar', 'al borrar la cuenta se va también la foto de perfil (y las demás fotos)')
  // El almacén de perfiles (0027): PRIVADO; cada persona solo escribe en su carpeta.
  const bucket = (await q("select public from storage.buckets where id = 'perfiles'"))[0]
  debe(bucket?.public === false, 'foto', 'el almacén de perfiles es privado (0027): ya no lo ve cualquiera con el enlace')
  const meti = await como(nueva, () => lanza(() => q("insert into storage.objects (bucket_id, name, owner) values ('perfiles', $1, $2)", [`${otra}/foto.jpg`, nueva])))
  debe(meti !== null, 'foto', 'nadie puede subir una foto a la carpeta de otra persona')
  const mia = await como(nueva, () => lanza(() => q("insert into storage.objects (bucket_id, name, owner) values ('perfiles', $1, $2)", [`${nueva}/foto-1.jpg`, nueva])))
  debe(mia === null, 'foto', 'cada persona sí puede subir la suya a su carpeta')
}

/* ═══════════════ 8 · Las cuentas, parte 3B (docs/dias/INFORME_CUENTAS_3B.md) ═══════════════ */
console.log('8. Cuentas 3B: peso, invitado, R2 corta, sin nombre, fotos privadas, fechas de la campanita, lo de desarrollo')
{
  const M = encendido
  const leer = (f) => fs.readFileSync(f, 'utf8')
  const sin = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

  // ── 2. El peso al abrir: las hojas se bajan cuando se abren ──
  const perezosas = [
    ['src/components/ajustes/AjustesHosts.tsx', ['AjustesScreen', 'EditarPerfil', 'HojaComoTeLlamas']],
    ['src/components/pase/PagoHost.tsx', ['PeliculaPase', 'HojaDosViajes', 'HojaInvitar']],
    ['src/components/propuesta/PropuestaHost.tsx', ['HojaRecomendacion', 'HojaVerPropuesta', 'PropuestaEnviada']],
    ['src/components/propuesta/BarraDePropuesta.tsx', ['HojaVerPropuesta']],
  ]
  for (const [archivo, nombres] of perezosas) {
    const t = sin(leer(archivo))
    for (const n of nombres) {
      debe(new RegExp(`import\\(['"]\\./${n}['"]\\)`).test(t) && !new RegExp(`^import .* from ['"]\\./${n}['"]`, 'm').test(t), 'peso', `${archivo.split('/').pop()}: ${n} se carga solo al abrirla (import dinámico, no estático)`)
    }
  }
  debe(!/stripe/i.test(leer('package.json')), 'peso', 'Stripe sigue sin sumar peso')
  if (fs.existsSync('dist/index.html')) {
    const html = leer('dist/index.html')
    const urls = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1])
    const entrada = urls.filter((u) => u.endsWith('.js')).map((u) => leer('dist' + u)).join('\n')
    const gz = urls.reduce((s, u) => s + zlib.gzipSync(fs.readFileSync('dist' + u)).length, 0)
    debe(gz < 340 * 1024, 'peso', `al abrir, la descarga pesa menos de 340 KB comprimida (ahora ${(gz / 1024).toFixed(1)} KB)`)
    const nombres = fs.readdirSync('dist/assets').filter((n) => n.endsWith('.js'))
    for (const parte of ['AjustesScreen', 'PeliculaPase', 'HojaInvitar', 'HojaVerPropuesta', 'HojaRecomendacion', 'HojaComoTeLlamas']) debe(nombres.some((n) => n.startsWith(parte)), 'peso', `${parte} va en su propio archivo`)
    debe(!/Todavía no tienes ningún pase/.test(entrada) && !/¿Cómo te llamas\?/.test(entrada) && !/Un momento, estamos confirmando el pago/.test(entrada), 'peso', 'al abrir no entran ni Mis pases, ni «¿Cómo te llamas?», ni la espera del pago')
    // Lo de desarrollo no llega a producción.
    const todos = nombres.map((n) => leer('dist/assets/' + n)).join('\n')
    debe(!/Dev: ruta rápida/.test(todos), 'desarrollo', 'el botón «Dev: ruta rápida (sin IA)» no está en la versión de producción')
  } else console.log('   (sin dist/: no se comprueba el peso real; ejecuta antes «npx vite build»)')

  // ── 8. «Pruebas» y la ruta rápida: solo en local y vistas previas, nunca en producción ──
  const enHost = async (host, entorno, nombre) => {
    const m = await empaquetar(nombre, entorno, 'scripts/destino/_cuentas3_entrada.tsx')
    const antes = globalThis.window.location.hostname
    globalThis.window.location.hostname = host
    try {
      return m.esEntornoDePrueba()
    } finally {
      globalThis.window.location.hostname = antes
    }
  }
  debe((await enHost('localhost', {}, 'host-local')) === true, 'desarrollo', '«Pruebas» sale en localhost')
  debe((await enHost('app-rutas-git-main-eric.vercel.app', {}, 'host-preview')) === true, 'desarrollo', '«Pruebas» sale en una vista previa de Vercel')
  debe((await enHost('app-rutas.vercel.app', {}, 'host-prod')) === false && (await enHost('trazo.app', {}, 'host-dominio')) === false, 'desarrollo', '«Pruebas» NO sale en la dirección de producción ni en un dominio propio')
  debe((await enHost('localhost', { VITE_VERCEL_ENV: 'production' }, 'env-prod')) === false, 'desarrollo', 'con VITE_VERCEL_ENV=production, «Pruebas» no sale ni en localhost')
  // (Tanda 10, a petición de Eric: el botón «Dev: ruta rápida» ya no sale en la pantalla de inicio; la pantalla dev se abre desde `window.__rutaPrueba()`, solo en desarrollo.)
  debe(!/Dev: ruta rápida/.test(leer('src/components/trazo/PrimeraPantalla.tsx')) && /setScreen\('devQuickRoute'\)/.test(leer('src/dev/rutaDePrueba.ts')), 'desarrollo', 'sin el botón «Dev: ruta rápida» en la pantalla de inicio; la pantalla dev sigue (se abre desde rutaDePrueba, solo en desarrollo)')

  // ── 3. El invitado, sin herramientas que no guardan ──
  const vista = leer('src/components/route/RouteView.tsx')
  debe(/esInvitado \? <ReservasSoloVer/.test(vista), 'invitado', 'RESERVAS del viaje de otra persona es la pantalla de solo mirar')
  const explore = leer('src/components/route/ExplorePanel.tsx')
  debe(/if \(soloVer\) empezarRecomendacion\('ruta'\)/.test(explore) && /onQuickAdd=\{alAnadir/.test(explore) && /onQuickAddExcursion=\{alAnadir/.test(explore), 'invitado', 'EXPLORAR: «+ Añadir» de quien mira entra en el modo recomendación con el sitio ya puesto')
  debe(/if \(esInvitado\) return null/.test(leer('src/components/presupuesto/BotonCartera.tsx')), 'invitado', 'quien mira no ve la cartera (el presupuesto es de quien hizo el viaje)')
  M.useRouteStore.setState({ route: { id: 'r', destination: 'Roma', origin: 'Madrid', transportContext: { transport_option: null }, answers: { dateRange: { start: '2026-10-17', end: '2026-10-20' } }, days: [{ id: 'd1', dayNumber: 1, city: 'Roma', title: 'Roma', stops: [], isReturnLeg: false }] } })
  const solo = M.pintaReservasSoloVer({ route: M.useRouteStore.getState().route, nombreAdmin: 'Elena' })
  debe(/data-reservas-solo-ver/.test(solo) && /Esto es lo que ha reservado Elena/.test(solo) && /Aquí solo se mira/.test(solo), 'invitado', 'RESERVAS solo para mirar: dice de quién es y que solo se mira')
  debe(!/Cambiar|Añadir|Eliminar|Quitar|Editar|Cambia las fechas|Buscar vuelos|Buscar alojamiento/.test(solo.replace(/aria-label="Cerrar"/g, '')), 'invitado', 'RESERVAS solo para mirar no lleva ni un botón de añadir, cambiar o quitar')
  debe((solo.match(/<button/g) ?? []).length === 1, 'invitado', 'el único botón sin entradas por reservar es [Cerrar]')
  debe(/setFicha\(item\)/.test(sin(leer('src/components/route/ReservasSoloVer.tsx'))) && /Reservar entrada/.test(leer('src/components/route/ReservasSoloVer.tsx')) && !/AddReservationSheet|setAccommodation|setTransportBooking|setReservations|addReservation|removeReservation/.test(leer('src/components/route/ReservasSoloVer.tsx')), 'invitado', 'lo único que se puede hacer es [Reservar entrada] (abre la ficha para comprar); nada toca las reservas de otro')

  // ── 4. R2, más corta ──
  const nombres17 = Array.from({ length: 17 }, (_, i) => `Parada ${i + 1}`)
  const cambioFinal = [...nombres17.slice(0, 16), 'Parque nuevo']
  const t1 = M.plegarLineas(M.lineasDelDia(nombres17, cambioFinal))
  debe(t1.length === 3 && t1[0].tipo === 'resumen' && t1[0].lineas.length === 15 && t1[1].tipo === 'linea' && t1[1].l.tipo === 'igual' && t1[2].l.tipo === 'pareja', 'R2', 'R2 con 17 paradas y un cambio al final: «15 paradas más», la de antes en gris y la pareja')
  const medio = nombres17.map((n, i) => (i === 7 ? 'Parque nuevo' : n))
  const t2 = M.plegarLineas(M.lineasDelDia(nombres17, medio))
  debe(t2.map((t) => (t.tipo === 'resumen' ? `r${t.lineas.length}` : t.l.tipo)).join() === 'r6,igual,pareja,igual,r8', 'R2', 'R2 con el cambio en medio: recogidas las de antes (6) y las de después (8), con una en gris a cada lado de la pareja')
  const sinNada = M.plegarLineas(M.lineasDelDia(['a', 'b', 'c'], ['a', 'b', 'x']))
  debe(sinNada.every((t) => t.tipo === 'linea'), 'R2', 'si recoger no ahorra casi nada, se enseña el día tal cual')
  const rutaR2 = { id: 'r', destination: 'Roma', answers: {}, days: [{ id: 'd2', dayNumber: 2, title: 'Dia 2', stops: [], isReturnLeg: false }] }
  const bloque = M.pintaListaPlegada({ route: rutaR2, c: { dayId: 'd2', title: 'Día 2', antes: nombres17, despues: cambioFinal } })
  debe((bloque.match(/data-linea="igual"/g) ?? []).length === 1 && /data-paradas-recogidas="15"/.test(bloque) && /15 paradas más, sin cambios/.test(bloque) && /data-cambio-parada="pequena"/.test(bloque), 'R2', 'la hoja enseña UNA parada en gris, «15 paradas más, sin cambios» (que se abre al tocarla) y la pareja')
  debe(!/Parada 1</.test(bloque) && !/Parada 10</.test(bloque), 'R2', 'las paradas recogidas no salen hasta tocar la línea')
  debe(/onClick=\{\(\) => setAbiertos/.test(leer('src/components/propuesta/HojaRecomendacion.tsx')), 'R2', 'la línea recogida se abre al tocarla')

  // ── 5. Sin nombre ──
  debe(M.textoEnviarA('') === 'Enviar' && M.textoEnviarA('  ') === 'Enviar' && M.textoEnviarA('Elena') === 'Enviar a Elena', 'nombre', '«Enviar» solo, o «Enviar a Elena» si tiene nombre')
  debe(M.textoEsperandoA('') === 'esperando respuesta' && M.textoMandadoA('') === 'Se lo hemos mandado' && M.textoMandadoA('Elena') === 'Se lo hemos mandado a Elena', 'nombre', 'ni «esperando a Viajero» ni «Se lo hemos mandado a Viajero»')
  debe(M.nombreDe(null) === '' && M.nombreDe({ nombre: ' Laura ' }) === 'Laura' && M.inicialDe({ nombre: null, inicial: 'z' }) === 'Z' && M.inicialDe({ nombre: 'laura', inicial: 'z' }) === 'L', 'nombre', 'sin nombre, el círculo lleva la inicial del email; con nombre, la del nombre')
  debe(M.titularDeRecomendacion('', 'cambio', 'el día 2') === 'Te recomiendan un cambio en el día 2' && M.titularDeRecomendacion('Laura', 'ruta', null) === 'Laura te recomienda otra ruta', 'nombre', 'R2 sin nombre: «Te recomiendan…»')
  const T2 = (tipo, payload) => M.textoDelAviso({ tipo, payload })
  debe(T2('aceptada', { admin: null, tipo_rec: 'cambio', dia: 2 }) === 'Han aceptado tu cambio en el día 2' && T2('rechazada', { admin: '', tipo_rec: 'cambio', dia: 2 }) === 'Han preferido dejar el día 2 como estaba' && T2('unido', { nombre: null }) === 'Alguien se ha unido a tu viaje', 'nombre', 'los avisos de respuesta y de unión tampoco inventan «Viajero»')
  debe(M.quienDelAviso({ tipo: 'recomendacion', payload: { autor: null, inicial: 'l' } }) === 'L' && M.quienDelAviso({ tipo: 'recomendacion', payload: { autor: null } }) === null && M.quienDelAviso({ tipo: 'recomendacion', payload: { autor: 'Laura', inicial: 'Z' } }) === 'Laura', 'nombre', 'en los avisos, sin nombre, la inicial de su email')
  debe(![T2('recomendacion', { autor: null, tipo_rec: 'dia', dia: 3 }), T2('aceptada', { tipo_rec: 'ruta' }), T2('unido', {})].some((t) => /Viajero/.test(t)), 'nombre', 'ningún aviso dice «Viajero»')
  const base0 = { cuentasActivas: true, uid: 'u1', cargado: true, nombre: null, yaPreguntado: false }
  debe(M.hayQuePedirNombre(base0) === true && M.hayQuePedirNombre({ ...base0, nombre: 'Laura' }) === false && M.hayQuePedirNombre({ ...base0, yaPreguntado: true }) === false && M.hayQuePedirNombre({ ...base0, uid: null }) === false && M.hayQuePedirNombre({ ...base0, cargado: false }) === false && M.hayQuePedirNombre({ ...base0, cuentasActivas: false }) === false, 'nombre', '«¿Cómo te llamas?» solo con cuenta cargada, sin nombre y sin haberlo preguntado ya (una sola vez)')
  const hn = M.pintaComoTeLlamas()
  debe(/¿Cómo te llamas\?/.test(hn) && />Seguir</.test(hn) && />Ahora no</.test(hn) && /data-nombre-campo/.test(hn), 'nombre', '«¿Cómo te llamas?» con [Seguir] y «Ahora no»')
  const botones = sin(leer('src/components/propuesta/BotonesDeViaje.tsx'))
  debe(/usePedirNombre\.getState\(\)\.pedir\(\)/.test(botones) && /usePedirNombre\.getState\(\)\.pedir\(\)/.test(sin(leer('src/components/cuenta/PuertaDeCuenta.tsx'))) && /usePedirNombre\.getState\(\)\.pedir\(\)/.test(sin(leer('src/components/ajustes/AjustesScreen.tsx'))), 'nombre', 'se pregunta al compartir un viaje, al unirse a uno y al unirse a un pase')
  debe(/trazo:pedir-nombre-al-volver/.test(leer('src/lib/cuentas.ts')) && /CLAVE_PEDIR_AL_VOLVER/.test(leer('src/components/ajustes/AjustesHosts.tsx')), 'nombre', 'quien se une justo al crear su cuenta también lo ve (al volver a abrir la app)')
  debe(!/'Viajero'/.test(sin(leer('src/store/useViajeCompartido.ts'))) && !/Enviar a \{nombreAdmin\}/.test(leer('src/components/propuesta/BarraDePropuesta.tsx') + leer('src/components/propuesta/HojaVerPropuesta.tsx')), 'nombre', 'ninguna pantalla de recomendar dice «Viajero» ni «Enviar a {…}» a ciegas')

  // En la base de datos: la inicial del email, solo la letra.
  const sinNombre = await nuevoUsuario('zeta@correo.es', false, null)
  const conNombre = await nuevoUsuario('ana@correo.es', false, 'Ana')
  const viajeN = await como(conNombre, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [conNombre, rutaDe()]))[0].id)
  await q('insert into public.trip_members (trip_id, user_id) values ($1, $2)', [viajeN, sinNombre])
  const genteN = await como(conNombre, async () => (await q('select public.gente_del_viaje($1) as g', [viajeN]))[0].g)
  const zeta = genteN.find((p) => p.id === sinNombre)
  debe(zeta?.nombre === null && zeta?.inicial === 'Z' && genteN.find((p) => p.id === conNombre)?.inicial === 'A' && !JSON.stringify(genteN).includes('@'), 'nombre', 'gente_del_viaje: sin nombre, la inicial «Z» de su email; nunca el email entero')
  const avisoUnion = await q("select payload from public.avisos where user_id = $1 and tipo = 'unido' and clave like $2", [conNombre, `unido:${viajeN}:%`])
  debe(avisoUnion.length === 1 && avisoUnion[0].payload.nombre === null && avisoUnion[0].payload.inicial === 'Z', 'nombre', 'el aviso de «se ha unido» lleva la inicial del email de quien entró sin nombre')
  const recN = await como(sinNombre, async () => (await q("insert into public.trip_recommendations (trip_id, tipo, payload) values ($1, 'ruta', '{}'::jsonb) returning id", [viajeN]))[0].id)
  const avisoRec = await q("select payload from public.avisos where user_id = $1 and clave = $2", [conNombre, `rec:${recN}`])
  debe(avisoRec.length === 1 && avisoRec[0].payload.autor === null && avisoRec[0].payload.inicial === 'Z', 'nombre', 'el aviso de la recomendación de quien no tiene nombre lleva su inicial (y ningún «Viajero»)')

  // ── 6. Las fotos de perfil, privadas ──
  const fa = await nuevoUsuario('fa3b@correo.es', false, 'Fa')
  const fb = await nuevoUsuario('fb3b@correo.es', false, 'Fb')
  const fc = await nuevoUsuario('fc3b@correo.es', false, 'Fc')
  const fd = await nuevoUsuario('fd3b@correo.es', false, 'Fd')
  const viajeF = await como(fa, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [fa, rutaDe()]))[0].id)
  await q('insert into public.trip_members (trip_id, user_id) values ($1, $2)', [viajeF, fb])
  for (const u of [fa, fb, fc, fd]) await q("insert into storage.objects (bucket_id, name, owner) values ('perfiles', $1, $2)", [`${u}/foto-3b.jpg`, u])
  const nombreDeFoto = { [fa]: 'fa', [fb]: 'fb', [fc]: 'fc', [fd]: 'fd' }
  const ve = async (uid) => (await como(uid, () => q("select name from storage.objects where bucket_id = 'perfiles' and name like '%/foto-3b.jpg'"))).map((r) => nombreDeFoto[r.name.split('/')[0]]).sort().join()
  debe((await ve(fa)) === 'fa,fb' && (await ve(fb)) === 'fa,fb', 'foto', 'quien comparte un viaje ve la foto de la otra persona (y la suya)')
  debe((await ve(fc)) === 'fc' && (await ve(fd)) === 'fd', 'foto', 'quien no comparte nada con nadie solo ve la suya: la foto no es de cualquiera con el enlace')
  const anonVe = await q("select count(*)::int as n from storage.objects where bucket_id = 'perfiles' and name like '%/foto-3b.jpg'")
  debe(anonVe[0].n === 4, 'foto', '(control: las cuatro fotos existen)')
  const sinSesion = await (async () => {
    await bd.db.exec('reset role')
    await bd.db.query("select set_config('request.jwt.claims', '', false)")
    await bd.db.exec('set role anon')
    try {
      return await q("select count(*)::int as n from storage.objects where bucket_id = 'perfiles'")
    } catch {
      return [{ n: 0 }]
    } finally {
      await bd.db.exec('reset role')
    }
  })()
  debe(sinSesion[0].n === 0, 'foto', 'sin iniciar sesión no se ve ninguna foto de perfil')
  debe((await como(fa, () => q('select public.comparte_con($1) as c', [fb])))[0].c === true && (await como(fa, () => q('select public.comparte_con($1) as c', [fc])))[0].c === false && (await como(fa, () => q("select public.comparte_con('no-es-un-id') as c")))[0].c === false, 'foto', 'comparte_con: sí con quien comparte viaje, no con un extraño, y un nombre de carpeta raro no rompe nada')
  const fuenteFotos = leer('src/lib/miPerfil.ts')
  debe(/createSignedUrls/.test(fuenteFotos) && !/object\/public/.test(sin(fuenteFotos)) && M.CADUCA_FOTO_S === 3600, 'foto', 'las fotos se piden con enlaces que caducan (a la hora), nunca con la dirección pública')
  debe(M.renovarEnMs(1_000_000) === 1_000_000 + 3600 * 1000 - 300_000, 'foto', 'el enlace se renueva 5 minutos antes de caducar')
  debe(M.fotoParaMostrar('https://firmada', 'https://g/a.jpg') === 'https://firmada' && M.fotoParaMostrar(null, 'https://g/a.jpg') === 'https://g/a.jpg' && M.fotoParaMostrar(null, null) === null, 'foto', 'se enseña la subida, o la de Google, o la inicial')
  const lugaresDeFotos = ['src/store/useMiPerfil.ts', 'src/components/layout/NoticesSheet.tsx', 'src/components/logros/momentos/imagen.ts']
  debe(lugaresDeFotos.every((f) => /useFotoDePerfil|useFotosDePerfil|firmarFotosDePerfil/.test(leer(f))), 'foto', 'el Perfil, la campanita y la imagen de compartir piden la foto con enlace firmado')
  debe(/update storage\.buckets set public = false where id = 'perfiles'/.test(leer('supabase/migrations/0027_cuentas_3b.sql')), 'foto', 'la 0027 hace privado el almacén')

  // ── 7. Los datos de ejemplo de la campanita cuadran con el viaje ──
  const MD = await empaquetar('avisos-ejemplo', {}, 'scripts/destino/_cuentas3b_entrada.tsx')
  M.useRouteStore.setState({ route: { id: 'r', destination: 'Roma', answers: { dateRange: { start: '2026-10-17', end: '2026-10-20' } }, days: [] } })
  const dia = (iso) => iso.slice(0, 10)
  const f = MD.fechasDelViaje()
  const lad = MD.delAdmin()
  const ladLaura = MD.deLaura()
  const por = (lista, tipo) => lista.find((a) => a.tipo === tipo)
  const ms = (a) => Date.parse(a.creado_en)
  const iniMs = Date.parse(`${f.inicio}T00:00:00`)
  const finMs = Date.parse(`${f.fin}T23:59:59`)
  debe(f.inicio === '2026-10-17' && f.fin === '2026-10-20', 'fechas', 'los avisos de ejemplo leen las fechas del viaje de pruebas (17 al 20 de octubre)')
  debe(ms(por(lad, 'resumen')) > finMs && ms(por(lad, 'sorpresas')) > finMs && ms(por(ladLaura, 'resumen')) > finMs, 'fechas', '«Tu resumen del viaje está listo» y «Te quedan 3 días…» son de DESPUÉS del viaje')
  debe(ms(por(lad, 'recomendacion')) < iniMs && ms(por(lad, 'unido')) < iniMs && ms(por(ladLaura, 'aceptada')) < iniMs && ms(por(ladLaura, 'rechazada')) < iniMs, 'fechas', 'la recomendación, la unión y las respuestas son de ANTES del viaje')
  debe(dia(new Date(ms(por(lad, 'd10'))).toISOString()) === '2026-10-07' || Math.round((iniMs - ms(por(lad, 'd10'))) / 86400000) === 10, 'fechas', 'el aviso de los 10 días llega 10 días antes de empezar')
  const orden = (lista) => lista.every((a, i, l) => i === 0 || ms(l[i - 1]) >= ms(a))
  debe(orden(lad) && orden(ladLaura), 'fechas', 'la lista va con lo más nuevo arriba')
  const avisosFuente = leer('src/dev/escaparates/cuentas_avisos.ts')
  debe(!/hace\(60 \* 24/.test(avisosFuente) && /lunes, 12 de octubre/.test(avisosFuente) && /miércoles, 7 de octubre/.test(avisosFuente), 'fechas', 'los avisos del móvil de ejemplo llevan días de la semana que existen (12 de octubre de 2026 es lunes; el 7, miércoles)')
  debe(new Date('2026-10-12T12:00:00').getDay() === 1 && new Date('2026-10-07T12:00:00').getDay() === 3, 'fechas', '(control: 12 de octubre de 2026 es lunes y 7, miércoles)')

  // ── 7b. El guardado en el modo de pruebas ──
  const sync = sin(leer('src/components/sync/TripSync.tsx'))
  debe(/async function attemptSave[\s\S]{0,300}if \(demoActivo\(\)\) return/.test(sync) && /!supabase \|\| demoActivo\(\)/.test(sync), 'guardado', 'en el modo de pruebas (?logrosDemo=1, solo desarrollo) no se intenta guardar el viaje de mentira: no sale «Cambios sin guardar»')
  M.useRouteStore.setState({ route: null })

  // ── 10. Con TODAS las migraciones (de la 0001 a la 0027, en orden) y todo apagado, la app de producción sigue igual ──
  const todas = await crearBaseDePrueba({ migraciones: /^00(0[1-9]|1[0-9]|2[0-7])_/, alFallar: (m) => debe(false, 'migracion', m) })
  debe(todas.aplicadas.length >= 27 && todas.aplicadas.at(-1) === '0027_cuentas_3b.sql', 'migracion', 'todas las migraciones, de la 0001 a la 0027, se aplican en orden sin un solo error')
  const u1 = await todas.nuevoUsuario('uno@correo.es', false, 'Uno')
  const u2 = await todas.nuevoUsuario('dos@correo.es', false, 'Dos')
  const viajeU = await todas.como(u1, async () => (await todas.q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [u1, rutaDe()]))[0].id)
  await todas.q('insert into public.trip_members (trip_id, user_id) values ($1, $2)', [viajeU, u2])
  const consultaDeSiempre = (uid) => todas.como(uid, () => todas.q('select id, route, bookings, wishlist, ui_state, generation_state from public.trips where traveler_id = $1 order by updated_at desc', [uid]))
  debe((await consultaDeSiempre(u1)).length === 1 && (await consultaDeSiempre(u2)).length === 0, 'migracion', 'con todo apagado, la consulta de siempre devuelve lo mismo que hoy: cada uno sus viajes (quien es invitado en otro no lo ve ahí)')
  const consultaConCuentas = (uid) => todas.como(uid, () => todas.q('select id, traveler_id, guardado_en, route, bookings, wishlist, ui_state, generation_state from public.trips order by updated_at desc'))
  debe((await consultaConCuentas(u2)).length === 1, 'migracion', 'con las cuentas encendidas la consulta pide también guardado_en (0024) y funciona: ya no da el 400 de la 8B')
  const persistencia = leer('src/lib/tripPersistence.ts')
  debe(/conInvitados \? 'id, traveler_id, guardado_en,[^']*' : 'id, route, bookings, wishlist, ui_state, generation_state'/.test(persistencia) && /if \(!conInvitados\) consulta = consulta\.eq\('traveler_id', travelerId\)/.test(persistencia), 'migracion', 'apagadas las cuentas, la app NO pide guardado_en ni los viajes de otros: la misma consulta de hoy, con o sin migraciones')
}

/* ═══════════════ 9 · Tanda 9: reiniciar MIS pruebas (solo el administrador, solo su cuenta) ═══════════════ */
console.log('9. Tanda 9: reiniciar mis pruebas')
{
  const leer = (f) => fs.readFileSync(f, 'utf8')
  const { reiniciarMisPruebas, TABLAS_DE_PRUEBAS } = await import('../../server/logros/reiniciar.js')
  const { esAdmin } = await import('../../server/logros/rutas.js')
  const llamadas = []
  const falso = (falla = null) => ({
    from: (tabla) => ({
      delete: () => ({
        eq: async (columna, valor) => {
          llamadas.push({ tabla, columna, valor })
          return { error: falla === tabla ? { message: 'x' } : null, count: 2 }
        },
      }),
    }),
  })
  const r = await reiniciarMisPruebas(falso(), 'uid-de-eric')
  debe(r.ok === true && llamadas.length === TABLAS_DE_PRUEBAS.length && llamadas.every((c) => c.valor === 'uid-de-eric'), 'reinicio', 'cada borrado lleva el id de la cuenta que reinicia: ninguno es general ni de otra cuenta')
  debe(['hoy_prueba', 'logro_hechos', 'achievements', 'logro_perfil', 'avisos', 'passes'].every((t) => llamadas.some((c) => c.tabla === t)), 'reinicio', 'se reinicia el día de prueba, los logros, la EXP, los pases y los avisos')
  debe(!llamadas.some((c) => ['trips', 'trip_photos', 'travelers', 'pagos_registro'].includes(c.tabla)), 'reinicio', 'no toca los viajes, las fotos, la cuenta ni los registros de cobro')
  llamadas.length = 0
  const mal = await reiniciarMisPruebas(falso('achievements'), 'uid-de-eric')
  debe(mal.ok === false && !llamadas.some((c) => c.tabla === 'logro_perfil'), 'reinicio', 'si un borrado falla, lo dice y para')
  debe((await reiniciarMisPruebas(falso(), '')).ok === false && (await reiniciarMisPruebas(null, 'x')).ok === false, 'reinicio', 'sin cuenta no hace nada')
  const rutas = leer('server/logros/rutas.js')
  debe(/reiniciar-mis-pruebas', conAdmin\(async \(req, res, usuario\)/.test(rutas) && /reiniciarMisPruebas\(admin, usuario\.id\)/.test(rutas) && /confirmar !== true/.test(rutas), 'reinicio', 'la ruta es solo de administrador, pide confirmar y usa el id de la sesión (nunca uno del cuerpo)')
  debe(!/req\.body[^\n]*user_id/.test(rutas.slice(rutas.indexOf('reiniciar-mis-pruebas'), rutas.indexOf('reiniciar-mis-pruebas') + 500)), 'reinicio', 'la ruta ignora cualquier user_id del cuerpo')
  const env = { LOGROS_ADMIN_EMAILS: 'eric@correo.es' }
  debe(esAdmin({ id: 'a', email: 'ERIC@correo.es', is_anonymous: false }, env) === true && esAdmin({ id: 'b', email: 'otra@correo.es' }, env) === false && esAdmin({ id: 'a', email: 'eric@correo.es', is_anonymous: true }, env) === false && esAdmin(null, env) === false, 'reinicio', 'solo los emails de LOGROS_ADMIN_EMAILS (y no anónimos)')
  const quien = (f) => /reiniciar-mis-pruebas|MisPruebas/.test(leer(f))
  const otros = fs.readdirSync('src', { recursive: true }).map((f) => path.join('src', f)).filter((f) => /\.(ts|tsx)$/.test(f) && !/AdminLogros\.tsx$/.test(f) && quien(f))
  debe(otros.length === 0, 'reinicio', `el botón no está en ninguna otra pantalla (${otros.join(', ') || 'solo en AdminLogros'})`)
  const admin = leer('src/components/logros/AdminLogros.tsx')
  debe(/Reiniciar mis pruebas/.test(admin) && /¿Seguro\?/.test(admin) && /confirmar: true/.test(admin), 'reinicio', 'el botón pide confirmación antes de reiniciar')
}

/* ═══════════════ Capturas: todas, con el nombre de su pantalla, y ninguna repetida ═══════════════ */
{
  const dir = 'docs/dias/capturas_cuentas3'
  const pedidas = ['A1', 'A2', 'A3', 'A4', 'I1', 'I2', 'P1', 'P6', 'P7', 'P7b', 'P8', 'P8b', 'P9', 'RS1', 'RS2', 'R1', 'RW1', 'RW2', 'RW3', 'RM', 'RV', 'RSent', 'R2a', 'R2b', 'R2c', 'R2d', 'AV1', 'AV2', 'AV3', 'AV4', 'AV5', 'AV6', 'AV7', 'L-P3', 'L-P4', 'L-P5', 'L-P6', 'Perfil-foto-nombre', 'Pasaporte', '1a-hoy', 'Invitado-explorar', 'Invitado-reservas', 'Como-te-llamas']
  const hay = fs.existsSync(dir) ? fs.readdirSync(dir) : []
  const faltan = pedidas.filter((n) => !hay.some((x) => x.replace(/.(jpg|png|webp)$/i, '') === n))
  debe(faltan.length === 0, 'capturas', `estan todas las capturas pedidas (faltan: ${faltan.join(', ') || 'ninguna'})`)
  const vistas = new Map()
  const repetidas = []
  for (const x of hay.filter((n) => /.(jpg|png|webp)$/i.test(n))) {
    const h = crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, x))).digest('hex')
    if (vistas.has(h)) repetidas.push(`${vistas.get(h)} = ${x}`)
    else vistas.set(h, x)
  }
  debe(repetidas.length === 0, 'capturas', `ninguna captura repetida (dos nombres, mismo archivo): ${repetidas.join(' | ')}`)
}

/* ═══════════════ Resumen ═══════════════ */
fs.rmSync(carpeta, { recursive: true, force: true })
console.log(`\nPrueba de las cuentas (parte 3): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
