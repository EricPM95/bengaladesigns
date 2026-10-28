// La prueba de la Tanda 10N5, apartado 3: UNIRSE A UN VIAJE ESCRIBIENDO EL CÓDIGO y abrirlo.
//   APP_URL=http://localhost:5182 API_URL=http://localhost:8852 node scripts/destino/pruebaTanda10N5_union.mjs
// 1. El código (migración 0047, la hoja, los dos sitios, la puerta de la cuenta, el límite de intentos).
// 2. La lógica pura del límite de intentos y de los textos de la franja (en la app de verdad, importada con el servidor de desarrollo).
// 3. La pantalla (móvil de 390 px): la primera pantalla con «¿Te han invitado? Únete con un código», la hoja con los 8 huecos, el código que no vale (rojo, [Unirme] apagado), el límite de 6 intentos,
//    sin cuenta (queda la invitación aceptada y la puerta pide la cuenta), con cuenta (se abre ESE viaje, el de antes sigue en «Mis viajes», sale la franja «Te has unido al viaje a Roma de Eric») y «ya dentro».
//    El servidor de Supabase se sustituye por uno de mentira dentro de la página (solo `rpc` y `getSession`): no se crea ninguna cuenta ni se toca ningún dato real.
// Capturas en docs/dias/capturas_jutrip/10n5_union_*.jpg, cada una con la de Design al lado (10n5_union_*_design.jpg).
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarPantallaDeDesign } from './_10n5_capturasDesign.mjs'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
const CAPTURAS = 'docs/dias/capturas_jutrip'
const conDesign = process.env.SIN_DESIGN !== '1'

/* ─────────────────────────── 1. El código ─────────────────────────── */
console.log('1. El código')
{
  const sql = leer('supabase/migrations/0047_limite_intentos_codigo.sql')
  debe(/create table if not exists public\.intentos_codigo/.test(sql) && /enable row level security/.test(sql), 'migración', 'la 0047 crea la tabla de intentos con RLS')
  debe(/>= 6/.test(sql) && /interval '15 minutes'/.test(sql), 'migración', 'la 0047 bloquea a los 6 fallos en 15 minutos')
  debe(/Demasiados intentos\. Espera unos minutos y vuelve a probar\./.test(sql), 'migración', 'la 0047 dice «Demasiados intentos…»')
  debe(/'error', 'no_existe'/.test(sql) && /apuntar_fallo_de_codigo/.test(sql), 'migración', 'canjear_invitacion apunta el fallo y devuelve no_existe (sin raise, que lo desharía)')
  const hoja = sinComentarios(leer('src/components/cuenta/HojaUnirse.tsx'))
  debe(/UNIRME A UN VIAJE/.test(hoja) && /Escribe el código/.test(hoja) && /width: 34, height: 58, borderRadius: 12/.test(hoja) && /LARGO = 8/.test(hoja), 'hoja', 'la hoja: «UNIRME A UN VIAJE», «Escribe el código» y 8 huecos de 34 x 58 (radio 12)')
  debe(/border: `1\.5px solid \$\{rojo \? '#B3262E' : 'rgba\(181,138,46,\.7\)'\}`/.test(hoja), 'hoja', 'los huecos: borde dorado y, con error, rojo #B3262E (Design 01 y 02)')
  debe(/autoCapitalize="characters"/.test(hoja) && /normalizarCodigo/.test(hoja), 'hoja', 'el campo no distingue mayúsculas ni espacios (normalizarCodigo)')
  debe(/visualViewport/.test(hoja), 'hoja', 'con el teclado abierto, la hoja sube con él')
  debe(/unirseConCodigo/.test(hoja) && /abrirViajeRecienUnido/.test(hoja), 'hoja', 'al unirse se abre ese viaje directamente')
  const lib = sinComentarios(leer('src/lib/unirseConCodigo.ts'))
  debe(/Este código no existe./.test(lib), 'texto', 'el texto del código que no vale es «Este código no existe.» (10N8)')
  debe(/MAX_FALLOS = 6/.test(lib) && /VENTANA_FALLOS_MS = 15 \* 60 \* 1000/.test(lib), 'límite', 'el límite del móvil: 6 fallos en 15 minutos')
  debe(/guardarInvitacionPendiente\(codigo\)/.test(lib) && /aceptarInvitacionPendiente\(\)/.test(lib), 'sin cuenta', 'sin cuenta: se guarda el código como invitación aceptada, para unirse solo al entrar')
  const primera = sinComentarios(leer('src/components/trazo/PrimeraPantalla.tsx'))
  debe(/¿Te han invitado\?/.test(primera) && /Únete con un código/.test(primera) && /data-unirme-con-codigo/.test(primera), 'primera pantalla', 'la primera pantalla lleva «¿Te han invitado? Únete con un código»')
  const perfil = sinComentarios(leer('src/components/layout/PerfilSheet.tsx'))
  debe(/Unirme con un código/.test(perfil) && /El que te ha pasado quien organiza el viaje/.test(perfil), 'perfil', 'el [+] del perfil lleva «Unirme con un código» con su línea')
  const puerta = sinComentarios(leer('src/components/cuenta/PuertaDeCuenta.tsx'))
  debe(/addEventListener\(EVENTO_INVITACION/.test(puerta) && /paraUnirte=\{Boolean\(codigo && aceptada\)\}/.test(puerta), 'sin cuenta', 'la puerta de la cuenta se entera del código escrito y pide la cuenta')
  debe(/Entra o crea tu cuenta para unirte\./.test(sinComentarios(leer('src/components/cuenta/EntrarCuenta.tsx'))), 'sin cuenta', '«Entra o crea tu cuenta para unirte.»')
  const cuentas = sinComentarios(leer('src/lib/cuentas.ts'))
  debe(/canjearInvitacion\(codigo\)/.test(cuentas) && /invitacionAceptada\(\)/.test(cuentas), 'sin cuenta', 'al entrar con la cuenta, se une solo con el código ya escrito (sin volver a pedirlo)')
  const inv = sinComentarios(leer('src/lib/invitaciones.ts'))
  debe(/Demasiad\|No se pudo crear/.test(inv) && /error === 'no_existe'/.test(inv), 'servidor', 'el cliente entiende «Demasiados intentos» y el no_existe de la 0047')
  const ajustes = sinComentarios(leer('src/components/ajustes/AjustesScreen.tsx'))
  debe(/useUnirseUi\.getState\(\)\.abrir\(\)/.test(ajustes), 'ajustes', 'el «Tengo un código de invitación» de Ajustes abre la misma hoja (un solo sitio, un solo límite)')
}

/* ─────────────────────────── 2 y 3. La app ─────────────────────────── */
const URL_APP = '/?cuentas=off&logros=off&version=pago&apertura=0'
const app = await abrirApp('http://localhost:5173', { ancho: 390, alto: 844, ruta: URL_APP })
const esp = app.esp
const ev = (js) => app.evaluar(js)
const esperar = async (js, intentos = 40, ms = 400) => {
  for (let i = 0; i < intentos; i++) {
    if (await ev(js).catch(() => false)) return true
    await esp(ms)
  }
  return false
}
try {
  console.log('2. La lógica del límite y de la franja')
  await esperar("Boolean(document.querySelector('[data-primera-pantalla]'))", 240, 500)
  // El servidor de desarrollo sirve los módulos cambiados con «?t=…»: para llegar a LA MISMA instancia que usa la app hay que pedir la dirección con la que se cargó.
  await ev("window.__imp = (p) => { const e = performance.getEntriesByType('resource').map((r) => r.name).find((n) => n.includes(p)); return import(e ?? p) }; true")
  const logica = await ev(`__imp('/src/lib/unirseConCodigo.ts').then(async (m) => {
    const f = await __imp('/src/lib/franjaDeUnion.ts')
    const ahora = 1_000_000_000
    const seis = Array.from({ length: 6 }, (_, i) => ahora - i * 1000)
    return {
      cinco: m.demasiadosFallos(seis.slice(0, 5), ahora),
      seis: m.demasiadosFallos(seis, ahora),
      viejos: m.demasiadosFallos(seis.map((t) => t - 16 * 60 * 1000), ahora),
      vigentes: m.fallosVigentes([ahora - 16 * 60 * 1000, ahora - 1000], ahora).length,
      franja: f.textosDeLaFranja({ destino: 'Roma', invitador: 'ERIC', yaEstaba: false }),
      franjaSin: f.textosDeLaFranja({ destino: 'Roma', invitador: null, yaEstaba: false }),
      ya: f.textosDeLaFranja({ destino: 'Roma', invitador: 'eric', yaEstaba: true }),
    }
  })`)
  debe(logica.cinco === false && logica.seis === true, 'límite', 'con 5 fallos se puede seguir; con 6, no')
  debe(logica.viejos === false && logica.vigentes === 1, 'límite', 'los fallos de hace más de 15 minutos ya no cuentan')
  debe(logica.franja.titulo === 'Te has unido al viaje a Roma de Eric' && logica.franja.linea === 'Ahora lo ves igual que él' && logica.franja.inicial === 'E', 'franja', `la franja dice «${logica.franja.titulo}» / «${logica.franja.linea}» (nombre con mayúscula inicial: «ERIC» → «Eric»)`)
  debe(logica.franjaSin.titulo === 'Te has unido al viaje a Roma' && !/ de /.test(logica.franjaSin.titulo), 'franja', 'sin nombre del que invita, la franja no se inventa uno')
  debe(logica.ya.titulo === 'Ya estabas en el viaje a Roma de Eric', 'franja', 'si ya estaba dentro: «Ya estabas en el viaje…»')

  console.log('3. La pantalla')
  // 3a. La primera pantalla.
  const enlace = await ev(`(() => { const b = document.querySelector('[data-unirme-con-codigo]'); if (!b) return null; const r = b.getBoundingClientRect(); const t = document.querySelector('[data-trazar-ruta]').getBoundingClientRect(); return { texto: b.innerText, abajo: r.top > t.bottom, dentro: r.bottom <= window.innerHeight, ancho: r.width, solapa: r.top < t.bottom } })()`)
  debe(enlace !== null && /¿Te han invitado\?\s+Únete con un código/.test(enlace.texto), 'primera pantalla', `el enlace está en la primera pantalla («${enlace?.texto}»)`)
  debe(enlace !== null && enlace.abajo && enlace.dentro, 'primera pantalla', 'va DEBAJO de la caja ORIGEN/DESTINO y dentro de la pantalla')
  if (conDesign) await capturarPantallaDeDesign('Piezas/Unirse Codigo.dc.html', 3, path.join(CAPTURAS, '10n5_union_04_primera_pantalla_design.jpg'))
  await app.captura(path.join(CAPTURAS, '10n5_union_04_primera_pantalla.jpg'), 82)

  // Un Supabase de mentira, dentro de la página: solo `rpc` y `getSession`.
  await ev(`__imp('/src/lib/supabaseClient.ts').then((m) => {
    const s = m.supabase
    window.__orig = { rpc: s.rpc, getSession: s.auth.getSession }
    window.__llamadas = []
    window.__yo = { id: 'u-prueba', is_anonymous: false }
    window.__respuestas = { ver: { valida: false, motivo: 'no_existe' }, canjear: { trip_id: 'trip-flo', ya_estaba: false } }
    s.rpc = async (nombre, args) => {
      window.__llamadas.push(nombre + ':' + JSON.stringify(args))
      if (nombre === 'ver_invitacion') return { data: window.__respuestas.ver, error: null }
      if (nombre === 'canjear_invitacion') return { data: window.__respuestas.canjear, error: null }
      return { data: null, error: null }
    }
    s.auth.getSession = async () => ({ data: { session: { access_token: 'x', user: window.__yo } } })
    window.__stub = { rpc: s.rpc, getSession: s.auth.getSession }
    try { window.localStorage.removeItem('trazo:codigo:fallos') } catch {}
    return true
  })`)
  const ponerStub = () => ev(`__imp('/src/lib/supabaseClient.ts').then((m) => { const s = m.supabase; s.rpc = window.__stub.rpc; s.auth.getSession = window.__stub.getSession; return true })`)
  const quitarStub = () => ev(`__imp('/src/lib/supabaseClient.ts').then((m) => { const s = m.supabase; s.rpc = window.__orig.rpc; s.auth.getSession = window.__orig.getSession; return true })`)
  const abrirHoja = async () => {
    await ev("document.querySelector('[data-unirme-con-codigo]').click(); true")
    return esperar("Boolean(document.querySelector('[data-hoja-unirse]'))", 20, 250)
  }
  const escribirCodigo = async (t) => {
    await ev("(() => { const e = document.querySelector('[data-campo-codigo]'); e.focus(); e.select(); return true })()")
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 })
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 })
    await app.cdp('Input.insertText', { text: t })
    await esp(250)
  }
  const estadoHoja = () =>
    ev(`(() => {
      const h = document.querySelector('[data-hoja-unirse]')
      if (!h) return null
      const huecos = Array.from(h.querySelectorAll('[data-hueco-codigo]'))
      const b = h.querySelector('[data-unirme-codigo]')
      const r = huecos[0]?.getBoundingClientRect()
      return {
        n: huecos.length,
        letras: huecos.map((x) => x.textContent).join(''),
        ancho: Math.round(r?.width ?? 0), alto: Math.round(r?.height ?? 0),
        bordes: [...new Set(huecos.map((x) => getComputedStyle(x).borderTopColor))],
        error: h.querySelector('[data-error-codigo]')?.innerText ?? null,
        boton: b ? { texto: b.innerText, off: b.disabled, fondo: getComputedStyle(b).backgroundImage.slice(0, 20), alto: Math.round(b.getBoundingClientRect().height) } : null,
        titulo: h.querySelector('[data-unirse-titulo]')?.innerText,
        tope: Math.round(h.querySelector('.hoja-panel').getBoundingClientRect().top),
        abajo: Math.round(h.querySelector('.hoja-panel').getBoundingClientRect().bottom),
      }
    })()`)

  debe(await abrirHoja(), 'hoja', 'tocar el enlace abre la hoja')
  await esp(700)
  let h = await estadoHoja()
  debe(h?.n === 8 && h.ancho === 34 && h.alto === 58, 'hoja', `8 huecos de 34 x 58 (salen ${h?.n} de ${h?.ancho} x ${h?.alto})`)
  debe(h?.titulo === 'Escribe el código', 'hoja', 'el título es «Escribe el código»')
  debe(h?.boton?.off === true, 'hoja', '[Unirme] está apagado con el código a medias')
  await escribirCodigo('roma 4k7q')
  h = await estadoHoja()
  debe(h?.letras === 'ROMA4K7Q', 'hoja', `«roma 4k7q» (minúsculas y con espacio) queda «ROMA4K7Q» (sale «${h?.letras}»)`)
  debe(h?.boton?.off === false && /gradient/.test(h.boton.fondo) && h.boton.alto === 54, 'hoja', '[Unirme] se enciende dorado y mide 54 de alto')
  await escribirCodigo('ROMA-4K7Q')
  h = await estadoHoja()
  debe(h?.letras === 'ROMA4K7Q', 'hoja', 'pegar «ROMA-4K7Q» (con guion) también queda «ROMA4K7Q»')
  if (conDesign) await capturarPantallaDeDesign('Piezas/Unirse Codigo.dc.html', 0, path.join(CAPTURAS, '10n5_union_01_hoja_design.jpg'))
  await app.captura(path.join(CAPTURAS, '10n5_union_01_hoja.jpg'), 82)

  // 3b. El código que no vale.
  await escribirCodigo('ROMA4K7X')
  await ev("document.querySelector('[data-unirme-codigo]').click(); true")
  await esperar("Boolean(document.querySelector('[data-error-codigo]'))", 20, 250)
  h = await estadoHoja()
  debe(h?.error === 'Este código no existe.', 'no vale', `«${h?.error}»`)
  debe(h?.bordes.length === 1 && h.bordes[0] === 'rgb(179, 38, 46)', 'no vale', 'los 8 huecos se ponen con borde rojo')
  debe(h?.boton?.off === true, 'no vale', '[Unirme] queda apagado hasta cambiar el código')
  if (conDesign) await capturarPantallaDeDesign('Piezas/Unirse Codigo.dc.html', 1, path.join(CAPTURAS, '10n5_union_02_no_vale_design.jpg'))
  await app.captura(path.join(CAPTURAS, '10n5_union_02_no_vale.jpg'), 82)
  await escribirCodigo('ROMA4K7Y')
  h = await estadoHoja()
  debe(h?.error === null && h.bordes.every((c) => c !== 'rgb(179, 38, 46)'), 'no vale', 'al cambiar el código, el aviso y el rojo se quitan')

  // 3c. Los intentos seguidos: 6 y se acabó.
  await ev("window.localStorage.removeItem('trazo:codigo:fallos'); window.__llamadas.length = 0; true")
  const textos = []
  for (let i = 0; i < 7; i++) {
    await escribirCodigo(`ABCD123${i}`)
    await ev("document.querySelector('[data-unirme-codigo]').click(); true")
    await esperar("Boolean(document.querySelector('[data-error-codigo]'))", 20, 200)
    textos.push((await estadoHoja())?.error)
  }
  const verCuantas = await ev("window.__llamadas.filter((x) => x.startsWith('ver_invitacion')).length")
  debe(textos.slice(0, 5).every((t) => /no existe/.test(t ?? '')), 'límite', 'los 5 primeros fallos dicen que el código no es de ningún viaje')
  debe(/Demasiados intentos/.test(textos[5] ?? ''), 'límite', `el 6.º fallo dice «${textos[5]}»`)
  debe(/Demasiados intentos/.test(textos[6] ?? ''), 'límite', 'el 7.º intento ya ni se prueba: «Demasiados intentos…»')
  debe(verCuantas === 6, 'límite', `el servidor solo vio 6 intentos (vio ${verCuantas}): del 7.º no se pregunta nada`)
  await ev("window.localStorage.removeItem('trazo:codigo:fallos'); true")

  // 3d. Sin cuenta: queda la invitación aceptada (la puerta pide la cuenta; al entrar se une sola).
  await ev("window.__yo = { id: 'u-anonima', is_anonymous: true }; window.__respuestas.ver = { valida: true, destino: 'Roma', invitador: 'ERIC', ya_dentro: false, trip_id: null }; window.__llamadas.length = 0; true")
  await escribirCodigo('ROMA4K7Q')
  await ev("document.querySelector('[data-unirme-codigo]').click(); true")
  await esperar("!document.querySelector('[data-hoja-unirse]')", 20, 250)
  const sinCuenta = await ev("({ pendiente: window.localStorage.getItem('trazo:invitacion'), aceptada: window.localStorage.getItem('trazo:invitacion:aceptada'), canjeo: window.__llamadas.some((x) => x.startsWith('canjear')) })")
  debe(sinCuenta.pendiente === 'ROMA4K7Q' && sinCuenta.aceptada === '1', 'sin cuenta', 'sin cuenta: el código queda guardado y aceptado (se une solo al entrar)')
  debe(sinCuenta.canjeo === false, 'sin cuenta', 'sin cuenta no se intenta canjear (el servidor no deja a las anónimas)')
  await ev("window.localStorage.removeItem('trazo:invitacion'); window.localStorage.removeItem('trazo:invitacion:aceptada'); true")

  // 3e. Con cuenta, con un viaje abierto: se abre ESE viaje y el de antes sigue en «Mis viajes».
  await quitarStub() // (el viaje de pruebas se genera con el Supabase de siempre)
  await ev('window.__rutaPrueba().then(() => true)')
  await esperar("__imp('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))", 90, 1000)
  await esp(3000)
  for (let i = 0; i < 6; i++) {
    const hecho = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await esp(700)
  }
  await ev("window.__miPerfil.getState().poner({ nombre: 'Viajes' }); true")
  await ponerStub()
  const antes = await ev(`Promise.all([__imp('/src/store/useRouteStore.ts'), __imp('/src/store/useSyncStore.ts'), __imp('/src/components/sync/TripSync.tsx')]).then(([r, s, t]) => {
    const ruta = r.useRouteStore.getState().route
    const base = t.buildTripPayload()
    const otro = { ...base, id: 'trip-flo', route: { ...ruta, id: 'trip-flo', destination: 'Florencia' }, generationState: null }
    const lista = s.useSyncStore.getState().savedTrips ?? []
    s.useSyncStore.getState().setSavedTrips([...lista.filter((x) => x.id !== 'trip-flo'), otro])
    return { id: ruta.id, destino: ruta.destination, guardados: lista.length }
  })`)
  await ev("window.__yo = { id: 'u-prueba', is_anonymous: false }; window.__respuestas.ver = { valida: true, destino: 'Florencia', invitador: 'ERIC', ya_dentro: false, trip_id: null }; window.__respuestas.canjear = { trip_id: 'trip-flo', ya_estaba: false }; window.__llamadas.length = 0; true")
  await ev("__imp('/src/store/usePerfilUi.ts').then((m) => { m.usePerfilUi.getState().abrir(); return true })")
  await esperar("Boolean(document.querySelector('[data-anadir-viaje]'))", 40, 400)
  await esp(1200)
  await ev("document.querySelector('[data-anadir-viaje]').click(); true")
  await esperar("Boolean(document.querySelector('[data-opcion-hoja=\"unirme-con-codigo\"]'))", 20, 250)
  await esp(600)
  const tarjetas = await ev("Array.from(document.querySelectorAll('[data-hoja=\"anadir-viaje\"] [data-opcion-hoja]')).map((b) => b.innerText.split(String.fromCharCode(10)).join(' · '))")
  debe(tarjetas.some((t) => /Unirme con un código · El que te ha pasado quien organiza el viaje/.test(t)), 'perfil', `la hoja del [+] tiene «Unirme con un código» (tarjetas: ${tarjetas.join(' || ')})`)
  await ev("document.querySelector('[data-opcion-hoja=\"unirme-con-codigo\"]').click(); true")
  debe(await esperar("Boolean(document.querySelector('[data-hoja-unirse]'))", 20, 250), 'perfil', '«Unirme con un código» abre la misma hoja del código')
  await esp(500)
  await escribirCodigo('FLOR2345')
  await ev("document.querySelector('[data-unirme-codigo]').click(); true")
  const abierto = await esperar("__imp('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState().route?.id === 'trip-flo')", 30, 300)
  if (!abierto) console.log('  (diagnóstico)', JSON.stringify(await ev(`Promise.all([__imp('/src/store/useRouteStore.ts'), __imp('/src/store/useSyncStore.ts')]).then(([r, s]) => ({ ruta: r.useRouteStore.getState().route?.id, guardados: (s.useSyncStore.getState().savedTrips ?? []).map((x) => x.id), error: document.querySelector('[data-error-codigo]')?.innerText, hoja: Boolean(document.querySelector('[data-hoja-unirse]')), llamadas: window.__llamadas }))`)))
  debe(abierto, 'abrir', 'al unirse con el código se abre ESE viaje (Florencia) directamente, sin recargar')
  const despues = await ev(`__imp('/src/store/useSyncStore.ts').then((s) => ({ guardados: (s.useSyncStore.getState().savedTrips ?? []).map((x) => x.id), perfilCerrado: !document.querySelector('[role="dialog"][aria-label="Perfil"]'), hoja: Boolean(document.querySelector('[data-hoja-unirse]')) }))`)
  debe(despues.perfilCerrado && !despues.hoja, 'abrir', 'se cierran la hoja y el Perfil, y el viaje nuevo queda a la vista')
  debe(despues.guardados.includes('trip-flo'), 'abrir', 'el viaje al que se unió queda en «Mis viajes»')
  const franja = await ev("(() => { const f = document.querySelector('[data-franja-union]'); return f ? { t: f.querySelector('[data-franja-titulo]').innerText, l: f.querySelector('[data-franja-linea]').innerText } : null })()")
  debe(franja && franja.t === 'Te has unido al viaje a Florencia de Eric' && franja.l === 'Ahora lo ves igual que él', 'franja', `la franja de arriba dice «${franja?.t}» / «${franja?.l}»`)
  const llamadas = await ev('window.__llamadas')
  debe(llamadas.some((x) => x.startsWith('canjear_invitacion')) && llamadas.some((x) => x.includes('FLOR2345')), 'abrir', 'con cuenta se canjea el código escrito')
  await esp(600)
  await app.captura(path.join(CAPTURAS, '10n5_union_03_dentro.jpg'), 82)
  if (conDesign) await capturarPantallaDeDesign('Piezas/Unirse Codigo.dc.html', 2, path.join(CAPTURAS, '10n5_union_03_dentro_design.jpg'))
  // El viaje de antes sigue ahí: se vuelve a él desde «Mis viajes».
  debe(antes.id !== 'trip-flo' && despues.guardados.length >= antes.guardados + 1, 'abrir', 'el viaje que estaba abierto no se pierde (sigue en la lista, para volver cuando se quiera)')

  // 3f. Ya estaba dentro: lo abre y ya.
  await ev("Promise.all([__imp('/src/store/useRouteStore.ts'), __imp('/src/store/useSyncStore.ts')]).then(([r, s]) => { const v = s.useSyncStore.getState().savedTrips.find((x) => x.id !== 'trip-flo'); if (v) { s.useSyncStore.getState().setActiveTripId(v.id); r.useRouteStore.getState().hydrateTrip(v) } return true })")
  await ev("window.__respuestas.ver = { valida: true, destino: 'Florencia', invitador: 'ERIC', ya_dentro: true, trip_id: 'trip-flo' }; window.__llamadas.length = 0; __imp('/src/store/useUnirseUi.ts').then((m) => m.useUnirseUi.getState().abrir()); true")
  await esperar("Boolean(document.querySelector('[data-hoja-unirse]'))", 20, 250)
  await escribirCodigo('FLOR2345')
  await ev("document.querySelector('[data-unirme-codigo]').click(); true")
  const yaDentro = await esperar("__imp('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState().route?.id === 'trip-flo')", 30, 300)
  const llamadas2 = await ev('window.__llamadas')
  debe(yaDentro, 'ya dentro', 'si ya estaba en ese viaje, lo abre y ya')
  debe(!llamadas2.some((x) => x.startsWith('canjear_invitacion')), 'ya dentro', 'y no gasta ningún uso (no se canjea de nuevo)')
} finally {
  app.cerrar()
}

console.log(`\nLa prueba de unirse con el código (10N5): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO [${f.regla}] ${f.texto}`)
process.exit(fallos.length === 0 ? 0 : 1)
