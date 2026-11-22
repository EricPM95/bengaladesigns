// La prueba de la Tanda V39C: la pantalla de entrada nueva (Design «Pase y cuenta» › 02 · Entrar en la cuenta: A1, A2, A3) con su mosaico de destinos.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV39C.mjs
// No toca el Supabase de producción (el Chrome de prueba lo tiene bloqueado) ni nada guardado de nadie.
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

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
const APP = process.env.APP_URL ?? 'http://localhost:5173'

// ───────── Fotos y datos (sin navegador) ─────────
const mosaico = leer('src/components/cuenta/MosaicoDeDestinos.tsx')
const fotos = JSON.parse(leer('data/entrada/fotos.json'))
const claves = [...mosaico.matchAll(/T\('([a-z_]+)'/g)].map((m) => m[1])
const NUESTROS = ['roma', 'paris', 'londres', 'madrid', 'barcelona', 'lisboa', 'amsterdam', 'praga', 'nueva_york', 'cancun', 'lanzarote', 'florencia', 'berlin', 'cartagena_de_indias']
debe(claves.length >= 11, 'mosaico', `el mosaico tiene ${claves.length} destinos (al menos los 11 de salida)`)
debe(claves.every((c) => NUESTROS.includes(c)), 'mosaico', 'todos los destinos del mosaico son nuestros (11 de salida + 3 de Próximamente)')
debe(!/tokio|tokyo/i.test(mosaico) && !/tokio|tokyo/i.test(JSON.stringify(fotos)), 'mosaico', 'ningún Tokio (era de ejemplo de Design)')
for (const d of ['roma', 'paris', 'londres', 'madrid', 'barcelona', 'lisboa', 'amsterdam', 'praga', 'nueva_york', 'cancun', 'lanzarote']) debe(claves.includes(d), 'mosaico', `sale ${d}`)
let peso = 0
const propias = { roma: '/fotos/entrada/roma.webp', lanzarote: '/fotos/entrada/lanzarote.webp' }
for (const c of [...new Set(claves)]) {
  const archivo = (fotos[c]?.archivo ?? propias[c]) || ''
  const ruta = 'public' + archivo
  const existe = archivo && fs.existsSync(ruta)
  debe(existe, 'fotos', `${c}: su foto existe (${archivo})`)
  if (existe) {
    const b = fs.statSync(ruta).size
    peso += b
    debe(archivo.endsWith('.webp') && b < 40 * 1024, 'fotos', `${c}: WebP y ligera (${(b / 1024).toFixed(1)} KB)`)
    const cab = fs.readFileSync(ruta).subarray(0, 12).toString('latin1')
    debe(cab.startsWith('RIFF') && cab.endsWith('WEBP') || cab.includes('WEBP'), 'fotos', `${c}: es un WebP de verdad`)
  }
  if (fotos[c]) debe(Boolean(fotos[c].nombre && fotos[c].pais), 'fotos', `${c}: lleva nombre y país`)
}
console.log(`  Peso total de las fotos del mosaico: ${(peso / 1024).toFixed(1)} KB (${[...new Set(claves)].length} fotos)`)
debe(peso < 450 * 1024, 'fotos', `las fotos pesan poco en total (${(peso / 1024).toFixed(0)} KB < 450 KB)`)
const docs = fs.existsSync('docs/dias/FOTOS_ENTRADA.md') ? leer('docs/dias/FOTOS_ENTRADA.md') : ''
debe(docs.length > 200 && [...new Set(claves)].filter((c) => !['roma', 'lanzarote'].includes(c)).every((c) => new RegExp(c.replace(/_/g, '[ _]'), 'i').test(docs)), 'fotos', 'docs/dias/FOTOS_ENTRADA.md apunta de dónde sale cada foto y su licencia')
debe(/Cr[eé]ditos/.test(leer('src/components/perfil/Creditos.tsx')) || fs.existsSync('src/components/perfil/Creditos.tsx'), 'fotos', 'existe la pantalla de Créditos')
debe(/loading="lazy"/.test(mosaico) && /decoding="async"/.test(mosaico) && /prefers-reduced-motion:reduce/.test(mosaico), 'mosaico', 'fotos con carga perezosa y regla de «Reducir movimiento» en el propio CSS')

const entrar = leer('src/components/cuenta/EntrarCuenta.tsx')
debe(/Guarda tus viajes, tus fotos y tus logros\./.test(entrar) && /Continuar con Google/.test(entrar) && /Entrar con mi email/.test(entrar) && /Privacidad y condiciones/.test(entrar), 'A1', 'los textos de la pantalla de entrada de Design')
debe(/entrarConCodigo\(email, codigo\)/.test(entrar) && /Si no lo ves en unos segundos, mira en Spam o Promociones\./.test(entrar) && /¿No te llega\? Enviar otra vez/.test(entrar), 'A3', 'el código, el aviso de Spam y «Enviar otra vez» siguen')
debe(/entrarConGoogle\(\)/.test(entrar), 'google', 'Google sigue igual (entrarConGoogle)')
debe(!/Tokio/.test(entrar), 'A1', 'nada de Tokio')

// ───────── En el navegador (iPhone) ─────────
const J = async (a, js) => {
  const r = await a.evaluar(js)
  return typeof r === 'string' ? JSON.parse(r) : r
}
const abrir = async (a, id) => {
  await a.evaluar(`import('/src/dev/escaparate.ts').then(() => window.__escaparate.abrir('${id}'))`)
  await a.esp(1500)
}
const app = await abrirApp(APP, { ruta: '/?cuentas=off' })
try {
  await abrir(app, 'c3-A1')
  const a1 = await J(app, `JSON.stringify((() => {
    const r = document.querySelector('[data-entrar]')
    const q = (s) => r.querySelector(s)
    const tarjetas = [...r.querySelectorAll('[data-tarjeta-mosaico]:not([data-copia])')]
    const cols = [...r.querySelectorAll('[data-columna-mosaico]')]
    const boton = (s) => { const b = q(s); if (!b) return null; const c = getComputedStyle(b); return { fondo: c.backgroundImage + c.backgroundColor, alto: b.getBoundingClientRect().height } }
    return {
      texto: r.innerText,
      logo: Boolean(q('[data-nombre-app] svg')),
      fondo: getComputedStyle(r).backgroundImage,
      mosaico: Boolean(q('[data-mosaico-entrada]')),
      cols: cols.length,
      anims: cols.map((c) => getComputedStyle(c).animationName),
      durs: cols.map((c) => getComputedStyle(c).animationDuration),
      tarjetas: tarjetas.map((t) => ({ k: t.getAttribute('data-tarjeta-mosaico'), img: Boolean(t.querySelector('img')), src: t.querySelector('img')?.getAttribute('src'), nombre: t.innerText.trim() })),
      google: boton('[data-entrar-google]'), email: boton('[data-entrar-email]'),
      privacidad: [...r.querySelectorAll('button')].some((b) => /Privacidad y condiciones/.test(b.textContent)),
      mosaicoRect: q('[data-mosaico-entrada]').getBoundingClientRect().height,
      alto: window.innerHeight,
      ocupa: q('[data-entrar-email]').getBoundingClientRect().bottom <= window.innerHeight,
    }
  })())`)
  debe(/Guarda tus viajes, tus fotos y tus logros\./.test(a1.texto) && /Continuar con Google/.test(a1.texto) && /Entrar con mi email/.test(a1.texto) && /Privacidad y condiciones/.test(a1.texto), 'A1', 'la pantalla de entrada lleva el subtítulo, [Continuar con Google], [Entrar con mi email] y «Privacidad y condiciones»')
  debe(a1.logo && a1.fondo.includes('radial-gradient'), 'A1', 'logo JUTRIP y el fondo crema del diseño')
  debe(a1.mosaico && a1.cols === 3, 'mosaico', `el mosaico está arriba con 3 columnas (${a1.cols})`)
  debe(a1.anims.every((n) => /enMosaico/.test(n)) && a1.durs.every((d) => parseFloat(d) >= 40), 'mosaico', `las columnas se mueven despacio (${a1.durs.join(' / ')})`)
  debe(a1.tarjetas.length >= 11 && a1.tarjetas.every((t) => t.img && t.src && NUESTROS.includes(t.k)), 'mosaico', `cada tarjeta (${a1.tarjetas.length}) tiene su foto y es un destino nuestro`)
  debe(a1.tarjetas.every((t) => t.nombre.length > 2) && !/Tokio/i.test(a1.texto), 'mosaico', 'cada tarjeta lleva nombre y país; ningún Tokio')
  debe(a1.google && a1.google.fondo.includes('rgb(255, 255, 255)') && a1.email && a1.email.fondo.includes('linear-gradient'), 'A1', 'botón de Google blanco y el de email dorado, como en el dibujo')
  debe(a1.privacidad && a1.ocupa, 'A1', '«Privacidad y condiciones» sigue y los botones caben en la pantalla')

  // Se mueve: la posición de una columna cambia con el tiempo
  const pos = async () => J(app, `JSON.stringify([...document.querySelectorAll('[data-columna-mosaico]')].map((c) => getComputedStyle(c).transform))`)
  const p1 = await pos()
  await app.esp(2500)
  const p2 = await pos()
  debe(p1.some((v, i) => v !== p2[i]), 'movimiento', 'el mosaico se mueve (las columnas cambian de sitio con el tiempo)')

  // Las fotos que se ven han cargado
  const cargadas = await J(app, `JSON.stringify([...document.querySelectorAll('[data-tarjeta-mosaico]:not([data-copia]) img')].filter((i) => { const r = i.getBoundingClientRect(); const m = document.querySelector('[data-mosaico-entrada]').getBoundingClientRect(); return r.bottom > m.top + 20 && r.top < m.bottom * 0.6 && r.height > 20 }).map((i) => i.complete && i.naturalWidth > 0))`)
  debe(cargadas.length >= 3 && cargadas.every(Boolean), 'fotos', `las fotos a la vista cargan (${cargadas.filter(Boolean).length}/${cargadas.length})`)

  // «Reducir movimiento»: quieto
  await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await app.esp(500)
  const q1 = await pos()
  await app.esp(2000)
  const q2 = await pos()
  const an = await J(app, `JSON.stringify([...document.querySelectorAll('[data-columna-mosaico]')].map((c) => getComputedStyle(c).animationName))`)
  debe(an.every((n) => n === 'none') && q1.every((v, i) => v === q2[i]), 'movimiento', 'con «Reducir movimiento» el mosaico se queda quieto')
  await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })

  // Pantalla bajita: los botones siguen cabiendo
  await app.cdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 600, deviceScaleFactor: 1, mobile: true })
  await app.esp(600)
  const bajo = await J(app, `JSON.stringify({ ok: document.querySelector('[data-entrar-email]').getBoundingClientRect().bottom <= innerHeight, mosaico: document.querySelector('[data-mosaico-entrada]').getBoundingClientRect().height })`)
  debe(bajo.ok && bajo.mosaico >= 100, 'A1', `en 375 × 600 los botones caben y el mosaico sigue (${Math.round(bajo.mosaico)} px)`)
  await app.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })

  // A2
  await app.evaluar(`window.__escaparate.cerrar?.('c3-A1')`)
  await abrir(app, 'c3-A2')
  const a2 = await J(app, `JSON.stringify({ hoja: Boolean(document.querySelector('[data-hoja="A2"]')), texto: document.querySelector('[data-hoja="A2"]')?.innerText ?? '', placeholder: document.querySelector('[data-hoja="A2"] input')?.getAttribute('placeholder'), fondo: getComputedStyle(document.querySelector('[data-boton-hoja="enviar-enlace"]')).backgroundImage })`)
  debe(a2.hoja && /Entra con tu email/.test(a2.texto) && a2.placeholder === 'tu@email.com' && /Enviarme el enlace/.test(a2.texto), 'A2', 'la hoja con el email: título, casilla y [Enviarme el enlace]')
  debe(a2.fondo.includes('linear-gradient') && a2.fondo.includes('166, 124, 82'), 'A2', 'el botón de la hoja es el dorado del diseño')

  // A3
  await abrir(app, 'c3-A3')
  const a3 = await J(app, `JSON.stringify((() => { const h = document.querySelector('[data-hoja="A3"]'); return { hoja: Boolean(h), texto: h?.innerText ?? '', abrir: Boolean(h?.querySelector('[data-abrir-correo]')), spam: Boolean(h?.querySelector('[data-aviso-spam]')), codigo: Boolean(h?.querySelector('[data-codigo-email] input')), entrar: [...(h?.querySelectorAll('[data-codigo-email] button') ?? [])].map((b) => b.textContent), reenviar: Boolean(h?.querySelector('[data-enlace-hoja="reenviar"]')), enlace: h?.querySelector('[data-abrir-correo]')?.getAttribute('href') } })())`)
  debe(a3.hoja && /Te hemos enviado un enlace a/.test(a3.texto) && /Ábrelo desde este móvil para entrar\./.test(a3.texto), 'A3', 'la hoja del enlace enviado, con su título y «Ábrelo desde este móvil para entrar.»')
  debe(a3.abrir && a3.enlace, 'A3', '[Abrir mi correo] con su enlace')
  debe(a3.spam && /Si no lo ves en unos segundos, mira en Spam o Promociones\./.test(a3.texto), 'A3', 'el aviso de Spam o Promociones')
  debe(a3.codigo && a3.entrar.includes('Entrar') && /código de números del email/.test(a3.texto), 'A3', 'la casilla del código con su [Entrar]')
  debe(a3.reenviar && /¿No te llega\? Enviar otra vez/.test(a3.texto), 'A3', '«¿No te llega? Enviar otra vez»')
  // El código: con 6 números el [Entrar] se activa y al pulsarlo intenta entrar (el Supabase está bloqueado: sale su aviso, no se queda mudo)
  await app.evaluar(`(() => { const i = document.querySelector('[data-hoja="A3"] [data-codigo-email] input'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, '123456'); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
  await app.esp(300)
  const act = await app.evaluar(`!document.querySelector('[data-hoja="A3"] [data-codigo-email] button').disabled`)
  debe(act === true, 'A3', 'con el código escrito, [Entrar] se activa')
  await app.evaluar(`document.querySelector('[data-hoja="A3"] [data-codigo-email] button').click()`)
  await app.esp(2500)
  const intento = await app.evaluar(`Boolean(document.querySelector('[data-hoja="A3"] [data-mensaje-entrar]')) || document.querySelector('[data-hoja="A3"] [data-codigo-email] button').disabled`)
  debe(intento === true, 'A3', '[Entrar] intenta entrar con el código (entrarConCodigo)')
} finally {
  app.cerrar()
}

console.log(`\nPrueba V39C: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
