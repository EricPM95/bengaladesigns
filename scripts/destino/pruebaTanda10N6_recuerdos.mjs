// Tanda 10N6 (agente K3), apartado 1f: «Tus recuerdos» en la ficha de un sitio (propuesta A de `Piezas/Recuerdos Ficha`), sin la cámara encima de la foto.
//   SERVER_PORT=8873 node server/index.js   y   API_TARGET=http://localhost:8873 npx vite --config scripts/destino/_vite_estable.config.mjs --port 5203 --strictPort
//   APP_URL=http://localhost:5203 API_URL=http://localhost:8873 node scripts/destino/pruebaTanda10N6_recuerdos.mjs
// (10S) USA EL SUPABASE REAL (cada Chrome nuevo hace un alta anonima y sube fotos de verdad): correr SOLA, nunca con otra prueba de Supabase a la vez. Si falla con «No se ha podido subir la foto» no es la pantalla: es el Supabase (limite de altas anonimas «Request rate limit reached», o sin red); esperar unos minutos y repetirla sola. Pasa igual con el Vite estable y con el de desarrollo normal (comprobado en la 10S).
// Las fotos se suben de verdad (a la tabla y al bucket de pruebas de siempre) y se BORRAN al acabar. Imprime «N comprobaciones, M fallos» y sale con 1 si falla.
import fs from 'node:fs'
import { conViaje as conViajeSuelto, modo, esp, cuando, foto, leer, preparar, store, modulo } from './_10n6_k3_comun.mjs'
import { createClient } from '@supabase/supabase-js'

// (10S) UNA cuenta anónima FIJA para los tres Chrome de esta prueba: ninguna alta nueva por pasada ni por Chrome (Supabase limita las altas anónimas: «Request rate limit reached», y en la batería, con otras pruebas a la vez, la subida fallaba con «No se ha podido subir la foto»).
// Cada Chrome arranca con la sesión de esa cuenta sembrada en su localStorage (se refresca desde docs/dias/_cuentas_prueba_10n6_recuerdos.json, que solo guarda el refresh token, fuera de git y sin imprimirse) y al cerrar se guarda el token renovado.
// Si el archivo no existe o la sesión ya no vale, la app da de alta UNA (la del primer Chrome) y se guarda para las siguientes pasadas. Usa el Supabase real: va SOLA (grupo «solas al final» de la batería).
const ARCHIVO_SESION = 'docs/dias/_cuentas_prueba_10n6_recuerdos.json'
const entorno = { ...process.env }
try {
  for (const l of leer('.env.local').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(l)
    if (m && entorno[m[1]] === undefined) entorno[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  /* sin .env.local */
}
const URL_SB = entorno.VITE_SUPABASE_URL
const CLAVE_SESION = URL_SB ? `sb-${new URL(URL_SB).hostname.split('.')[0]}-auth-token` : null
async function guionDeSesion() {
  if (!URL_SB || !entorno.VITE_SUPABASE_ANON_KEY || !fs.existsSync(ARCHIVO_SESION)) return ''
  try {
    const guardada = JSON.parse(fs.readFileSync(ARCHIVO_SESION, 'utf8'))
    const c = createClient(URL_SB, entorno.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data, error } = await c.auth.refreshSession({ refresh_token: guardada.refresh_token })
    if (error || !data.session?.user?.is_anonymous) return ''
    fs.writeFileSync(ARCHIVO_SESION, JSON.stringify({ refresh_token: data.session.refresh_token }))
    return `try { if (!localStorage.getItem(${JSON.stringify(CLAVE_SESION)})) localStorage.setItem(${JSON.stringify(CLAVE_SESION)}, ${JSON.stringify(JSON.stringify(data.session))}) } catch (e) {};`
  } catch {
    return ''
  }
}
async function conViaje(opciones) {
  const app = await conViajeSuelto({ ...opciones, extraAntes: `${await guionDeSesion()} ${opciones.extraAntes ?? ''}` })
  const cerrarDeVerdad = app.cerrar.bind(app)
  app.cerrar = async (...a) => {
    // El token renovado por el navegador se guarda para el siguiente Chrome y la siguiente pasada.
    try {
      const cruda = CLAVE_SESION ? await app.evaluar(`localStorage.getItem(${JSON.stringify(CLAVE_SESION)})`) : null
      const rt = cruda ? JSON.parse(cruda).refresh_token : null
      if (rt) fs.writeFileSync(ARCHIVO_SESION, JSON.stringify({ refresh_token: rt }))
    } catch {
      /* no se pudo guardar: la próxima vez habrá una alta nueva */
    }
    return cerrarDeVerdad(...a)
  }
  return app
}

const { debe, fin } = preparar()
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const clic = (a, js) => a.evaluar(`(() => { const e = ${js}; if (!e) return false; e.click(); return true })()`)
const fotosMod = modulo('/src/lib/fotosViaje.ts')

/* ───────────────────────── 1. El código ───────────────────────── */
console.log('1. El código')
{
  const ficha = sinComentarios(leer('src/components/route/dayDetail/StopDetailSheet.tsx'))
  debe(ficha.split('\n').filter((l) => /<TusRecuerdos /.test(l)).length === 1 && !/BotonFotoParada/.test(ficha), '1f', 'la ficha monta «Tus recuerdos» con una línea y ya no monta la cámara de encima de la foto')
  const t = sinComentarios(leer('src/components/route/fotos/TusRecuerdos.tsx'))
  debe(/subirFoto\(/.test(t) && /abrirAvisoPase\('segunda_foto'/.test(t), '1f', 'sube con `subirFoto` (misma parada, mismo álbum) y la segunda foto sin pase llama a `abrirAvisoPase(\'segunda_foto\')`')
  debe(/Guarda tus fotos\. Las verás también en tu álbum\./.test(t) && /También en tu álbum/.test(t) && /Hacer una foto/.test(t) && /Con la cámara de la app/.test(t) && /Elegir de la galería/.test(t) && /Solo fotos de tu viaje/.test(t) && /Cambiar la foto/.test(t) && /Tus fotos · /.test(t), '1f', 'los textos de Eric')
  debe(!/Mis fotos/.test(t), '1f', 'la propuesta B (la barra «Mis fotos») no se usa')
}

/* ───────────────────────── 2. Sin pase ───────────────────────── */
const SUBIR = (selector, n) => `(async () => { const dt = new DataTransfer(); for (let i = 0; i < ${n}; i++) { const c = document.createElement('canvas'); c.width = 800; c.height = 600; const x = c.getContext('2d'); x.fillStyle = 'hsl(' + (i * 80 + Date.now() % 50) + ',60%,50%)'; x.fillRect(0, 0, 800, 600); x.fillStyle = '#fff'; x.fillRect(100 + i * 50, 100, 300, 200); const b = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.8)); dt.items.add(new File([b], 'p' + i + '.jpg', { type: 'image/jpeg' })) } const inp = document.querySelector(${JSON.stringify(selector)}); inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true })); return true })()`
const abrirFicha = async (a, nombre) => {
  await a.evaluar(`(() => { const tit = Array.from(document.querySelectorAll('span.font-display')).find((x) => x.textContent === ${JSON.stringify(nombre)}); tit?.scrollIntoView({ block: 'center' }); tit?.click(); return true })()`)
  return cuando(a, "Boolean(document.querySelector('[data-ficha-panel] [data-tus-recuerdos]'))", 60)
}
const BLOQUE = `(() => {
  const b = document.querySelector('[data-tus-recuerdos]'); if (!b) return null
  const p = document.querySelector('[data-ficha-panel]'); const cab = p.querySelector('[data-ficha-cabecera]'); const tabs = p.querySelector('[data-ficha-pestanas]')
  const cs = getComputedStyle(b); const btn = b.querySelector('[data-recuerdos-abrir]'); const bcs = getComputedStyle(btn); const r = b.getBoundingClientRect()
  const orden = (x, y) => Boolean(x && y && (x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING))
  return { estado: b.dataset.tusRecuerdos, texto: b.innerText.replace(/\\s+/g, ' ').trim(), boton: btn.innerText.trim(), fondoBoton: bcs.backgroundImage, borde: cs.borderTopColor, alto: Math.round(r.height), izq: Math.round(r.left), der: Math.round(r.right), entre: orden(cab, b) && orden(b, tabs), camaraVieja: document.querySelectorAll('[aria-label="Añadir foto"],[aria-label="Cambiar foto"]').length, minis: b.querySelectorAll('[data-miniatura-recuerdo]').length }
})()`
const HOJA = `(() => { const h = document.querySelector('[data-hoja-opciones="tus-recuerdos"]'); if (!h) return null; return { etiqueta: h.querySelector('[data-hoja-opciones-etiqueta]')?.innerText ?? null, titulo: h.querySelector('[data-hoja-opciones-titulo]')?.innerText ?? null, tarjetas: Array.from(h.querySelectorAll('[data-opcion-hoja]')).map((b) => [b.querySelector('[data-opcion-titulo]')?.innerText, b.querySelector('[data-opcion-linea]')?.innerText]), fotos: h.querySelectorAll('[data-foto-recuerdo]').length, rotulo: (h.innerText.match(/TUS FOTOS · \\d+/i) || [null])[0], texto: h.innerText.replace(/\\s+/g, ' ') } })()`

let tripGratis = null
console.log('2. Sin pase')
{
  const g = await conViaje({ version: 'gratis', ancho: 390, alto: 844 })
  try {
    await g.evaluar("window.__avisos = []; window.addEventListener('trazo:aviso-pase', (e) => window.__avisos.push(e.detail)); true")
    await modo(g, 'days', 0)
    const nombre = await g.evaluar(`${store}.then((s) => s.useRouteStore.getState().route.days[0].stops.find((x) => !x.isBreak && !x.isFreeTour)?.name)`)
    const visible = await g.evaluar(`(() => { const t = Array.from(document.querySelectorAll('span.font-display')).map((x) => x.textContent); return t.includes(${JSON.stringify(nombre)}) })()`)
    debe(visible, '1f', `la primera parada (${nombre}) se ve en DÍAS`)
    debe(await abrirFicha(g, nombre), '1f', 'la ficha abre con su bloque «Tus recuerdos»')
    await esp(1500)
    let b = await g.evaluar(BLOQUE)
    debe(b && b.estado === 'sin-fotos' && /^Tus recuerdos Guarda tus fotos\. Las verás también en tu álbum\.\s*Añadir$/.test(b.texto), '1f', `sin fotos: «Tus recuerdos» + «Guarda tus fotos. Las verás también en tu álbum.» + [Añadir] (${JSON.stringify(b)})`)
    debe(b && b.entre, '1f', 'el bloque va entre la cabecera de la ficha y las pestañas')
    debe(b && b.camaraVieja === 0, '1f', 'fuera la cámara de encima de la foto')
    debe(b && /243, 226, 176/.test(b.fondoBoton) && /181, 138, 46/.test(b.borde), '1f', `botón dorado y borde dorado como en Design (${b?.fondoBoton} / ${b?.borde})`)
    debe(b && b.izq >= 0 && b.der <= 390 && b.alto >= 60 && b.alto <= 80, '1f', `cabe en el móvil y mide unos 62 px (${b?.izq}-${b?.der}, ${b?.alto})`)
    await g.captura(foto('recuerdos_sin_fotos'))
    // La hoja
    await clic(g, "document.querySelector('[data-recuerdos-abrir]')")
    await esp(900)
    let h = await g.evaluar(HOJA)
    debe(h && h.titulo === 'Tus recuerdos' && h.etiqueta && h.etiqueta.length > 2, '1f', `la hoja «Tus recuerdos» con el nombre del sitio arriba (${JSON.stringify(h && [h.etiqueta, h.titulo])})`)
    debe(h && JSON.stringify(h.tarjetas) === JSON.stringify([['Hacer una foto', 'Con la cámara de la app'], ['Elegir de la galería', 'Solo fotos de tu viaje']]), '1f', `tarjetas «Hacer una foto · Con la cámara de la app» y «Elegir de la galería · Solo fotos de tu viaje» (${JSON.stringify(h?.tarjetas)})`)
    debe(h && !h.rotulo, '1f', 'sin fotos no sale «Tus fotos · N»')
    await g.captura(foto('recuerdos_hoja_sin_fotos'))
    // Una foto
    await g.evaluar(SUBIR('[data-recuerdos-entrada="camara"]', 1))
    const subida = await cuando(g, "Boolean(document.querySelector('[data-foto-recuerdo]')) || Boolean(document.querySelector('[data-recuerdos-error]'))", 120)
    await esp(1500)
    h = await g.evaluar(HOJA)
    const err = await g.evaluar("document.querySelector('[data-recuerdos-error]')?.innerText ?? null")
    if (err && /No se ha podido subir/.test(err)) console.log("  AVISO: la subida de la foto fallo: esta prueba usa el Supabase real (limite de altas anonimas o red), no es la pantalla; repetirla sola tras unos minutos.")
    debe(subida && h && h.fotos === 1 && !err, '1f', `la foto se guarda y sale en «Tus fotos · 1» (${JSON.stringify(h && { fotos: h.fotos, rotulo: h.rotulo })} error: ${err})`)
    tripGratis = await g.evaluar(`${store}.then((s) => s.useRouteStore.getState().route.id)`)
    const guardadas = await g.evaluar(`${fotosMod}.then(async (m) => (await m.listarFotos(${JSON.stringify(tripGratis)})).map((f) => ({ dia: f.dayNumber, parada: f.stopName })))`)
    debe(guardadas.length === 1 && guardadas[0].dia === 1 && guardadas[0].parada === nombre, '1f', `la foto va a esa parada de ese día y al álbum del viaje (${JSON.stringify(guardadas)})`)
    h = await g.evaluar(HOJA)
    debe(h && h.rotulo === 'TUS FOTOS · 1' || (h && /Tus fotos · 1/i.test(h.texto)), '1f', `«Tus fotos · 1» (${h?.rotulo})`)
    debe(h && h.tarjetas[0][0] === 'Cambiar la foto' && !/Hacer una foto/.test(h.texto), '1f', `sin pase y con su foto, «Cambiar la foto» en lugar de «Hacer una foto» (${JSON.stringify(h?.tarjetas)})`)
    await g.captura(foto('recuerdos_hoja_una_foto_sin_pase'))
    // Cambiar la foto: sigue siendo una
    await g.evaluar(SUBIR('[data-recuerdos-entrada="cambiar"]', 1))
    // (10S) Espera de verdad en lugar de 6 s fijos: con la CPU cargada (batería) la subida tarda más, la tarjeta «Elegir de la galería» sigue deshabilitada mientras sube y su clic no avisaba del pase. Primero empieza a subir (o ya acabó) y luego se espera a que termine.
    await cuando(g, "Boolean(document.querySelector('[data-recuerdos-subiendo]')) || document.querySelectorAll('[data-foto-recuerdo]').length > 0", 40)
    await cuando(g, "!document.querySelector('[data-recuerdos-subiendo]')", 480)
    await esp(1500)
    const trasCambio = await g.evaluar(`${fotosMod}.then(async (m) => (await m.listarFotos(${JSON.stringify(tripGratis)})).length)`)
    debe(trasCambio === 1, '1f', `«Cambiar la foto» sustituye a la vieja: sigue habiendo 1 (${trasCambio})`)
    // La segunda: el aviso del pase
    await g.evaluar("window.__avisos.length = 0; true")
    await clic(g, "Array.from(document.querySelectorAll('[data-hoja-opciones=\"tus-recuerdos\"] [data-opcion-hoja]')).find((b) => /Elegir de la galería/.test(b.innerText))")
    await cuando(g, 'window.__avisos.length > 0', 40)
    const avisos = await g.evaluar("window.__avisos")
    debe(avisos.length === 1 && avisos[0].clave === 'segunda_foto', '1f', `intentar guardar una segunda abre el aviso del pase con la clave «segunda_foto» (${JSON.stringify(avisos)})`)
    await g.captura(foto('recuerdos_aviso_pase_segunda_foto'))
    const siguen = await g.evaluar(`${fotosMod}.then(async (m) => (await m.listarFotos(${JSON.stringify(tripGratis)})).length)`)
    debe(siguen === 1, '1f', 'la segunda foto no se guarda sin pase')
    // El bloque, con su foto
    await clic(g, "document.querySelector('[data-hoja-opciones] [data-hoja-cerrar]')")
    await esp(800)
    b = await g.evaluar(BLOQUE)
    debe(b && b.estado === 'con-fotos' && /^Tus recuerdos 1 foto · También en tu álbum\s*Ver$/.test(b.texto) && b.minis === 1, '1f', `con una foto: su miniatura, «1 foto · También en tu álbum» y [Ver] (${JSON.stringify(b)})`)
    await g.captura(foto('recuerdos_una_foto_sin_pase'))
    // Limpieza
    await g.evaluar(`${fotosMod}.then(async (m) => { for (const f of await m.listarFotos(${JSON.stringify(tripGratis)})) await m.borrarFoto(f); return true })`)
  } finally {
    await g.cerrar()
  }
}

/* ───────────────────────── 3. Con pase ───────────────────────── */
console.log('3. Con pase')
{
  const k = await conViaje({ version: 'completa', ancho: 390, alto: 844 })
  let trip = null
  try {
    await k.evaluar("window.__avisos = []; window.addEventListener('trazo:aviso-pase', (e) => window.__avisos.push(e.detail)); true")
    await modo(k, 'days', 0)
    trip = await k.evaluar(`${store}.then((s) => s.useRouteStore.getState().route.id)`)
    const nombre = await k.evaluar(`${store}.then((s) => s.useRouteStore.getState().route.days[0].stops.find((x) => !x.isBreak && !x.isFreeTour)?.name)`)
    debe(await abrirFicha(k, nombre), '1f', 'con pase: la ficha abre con su bloque «Tus recuerdos»')
    await esp(1200)
    await clic(k, "document.querySelector('[data-recuerdos-abrir]')")
    await esp(800)
    await k.evaluar(SUBIR('[data-recuerdos-entrada="galeria"]', 3))
    const ok = await cuando(k, "document.querySelectorAll('[data-foto-recuerdo]').length >= 3 || Boolean(document.querySelector('[data-recuerdos-error]'))", 160)
    await esp(1500)
    const h = await k.evaluar(HOJA)
    debe(ok && h && h.fotos === 3, '1f', `con pase se guardan las 3 (${JSON.stringify(h && { fotos: h.fotos, rotulo: h.rotulo })})`)
    debe(h && h.tarjetas[0][0] === 'Hacer una foto' && h.tarjetas[1][0] === 'Elegir de la galería', '1f', `con pase siempre «Hacer una foto» y «Elegir de la galería» (${JSON.stringify(h?.tarjetas)})`)
    const lista = await k.evaluar(`${fotosMod}.then(async (m) => (await m.listarFotos(${JSON.stringify(trip)})).map((f) => ({ dia: f.dayNumber, parada: f.stopName })))`)
    debe(lista.length === 3 && lista.every((f) => f.dia === 1 && f.parada === nombre), '1f', `las 3 fotos van a la parada y al álbum del viaje (${JSON.stringify(lista)})`)
    await k.captura(foto('recuerdos_hoja_tres_fotos_con_pase'))
    await clic(k, "document.querySelector('[data-hoja-opciones] [data-hoja-cerrar]')")
    await esp(800)
    const b = await k.evaluar(BLOQUE)
    debe(b && b.estado === 'con-fotos' && /^Tus recuerdos 3 fotos · También en tu álbum\s*Ver$/.test(b.texto) && b.minis === 3, '1f', `con 3 fotos: tres miniaturas, «3 fotos · También en tu álbum» y [Ver] (${JSON.stringify(b)})`)
    await k.captura(foto('recuerdos_tres_fotos_con_pase'))
    // Otra más: sin aviso del pase
    await clic(k, "document.querySelector('[data-recuerdos-abrir]')")
    await esp(700)
    await k.evaluar(SUBIR('[data-recuerdos-entrada="camara"]', 1))
    await cuando(k, "document.querySelectorAll('[data-foto-recuerdo]').length >= 4", 120)
    const avisos = await k.evaluar('window.__avisos')
    debe(avisos.length === 0, '1f', 'con pase, ninguna foto abre el aviso del pase')
  } finally {
    if (trip) await k.evaluar(`${fotosMod}.then(async (m) => { for (const f of await m.listarFotos(${JSON.stringify(trip)})) await m.borrarFoto(f); return true })`).catch(() => undefined)
    await k.cerrar()
  }
}

/* ───────────────────────── 4. Antes del viaje / fuera de un día ───────────────────────── */
console.log('4. La ficha de EXPLORAR (sin día)')
{
  const g = await conViaje({ version: 'gratis', ancho: 390, alto: 844 })
  try {
    await modo(g, 'explore')
    await esp(2000)
    await clic(g, "Array.from(document.querySelectorAll('button')).find((b) => /Restaurantes/.test(b.innerText))")
    await cuando(g, "Boolean(document.querySelector('[data-pestanas-explorar]'))", 60)
    await esp(1500)
    // Una fila de un sitio (no un restaurante): se activa «Atracciones» y se toca la primera tarjeta.
    await clic(g, "Array.from(document.querySelectorAll('button')).find((b) => /^Atracciones/.test((b.innerText || '').trim()))")
    await esp(1200)
    await g.evaluar("(() => { const f = document.querySelector('div.relative.flex.h-\\\\[88px\\\\] button'); f?.click(); return true })()")
    const hay = await cuando(g, "Boolean(document.querySelector('[data-ficha-panel] [data-tus-recuerdos]'))", 60)
    debe(hay, '1f', 'la ficha de un sitio de EXPLORAR (sin día) también lleva «Tus recuerdos»')
    await esp(1200)
    await g.captura(foto('recuerdos_ficha_explorar'))
  } finally {
    await g.cerrar()
  }
}

fin('pruebaTanda10N6_recuerdos')
