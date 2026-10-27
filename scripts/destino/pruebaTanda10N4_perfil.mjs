// La prueba de la Tanda 10N4, parte G5: UN solo perfil (el nuevo, con o sin logros), fuera el viejo y su «Abierto», y «Tu parte · 31 €» en el presupuesto.
//   APP_URL=http://localhost:5186 API_URL=http://localhost:8856 node scripts/destino/pruebaTanda10N4_perfil.mjs
// 1. El código: sin Perfil viejo (ni ficheros, ni ramas, ni «Abierto»).
// 2. La pastilla del presupuesto (pintada con el código de verdad): «Tu parte · 31 €» y «31 € por persona».
// 3. La pantalla (móvil de 390 px): con los logros apagados, el perfil nuevo sin EXP, vitrina ni billete, sin pedir nada de logros al servidor; con ellos encendidos, como antes.
// Capturas en docs/dias/capturas_jutrip/10n4_perfil_*.jpg.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { prepararSSR } from './_ssr.mjs'
import { abrirConPerfil } from './_10p_sorteo_app.mjs'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
const CAPTURAS = 'docs/dias/capturas_jutrip'

/* ─────────────────────────── 1. El código ─────────────────────────── */
console.log('1. El código')
{
  const sheet = sinComentarios(leer('src/components/layout/PerfilSheet.tsx'))
  debe(!/cuerpoDeSiempre|CabeceraDeSiempre|FilaDeViaje|MapaMisViajes|logrosActivos/.test(sheet), 'viejo', 'PerfilSheet ya no lleva el cuerpo de siempre ni decide entre dos perfiles')
  debe(/<CuerpoConLogros /.test(sheet) && /<PerfilEsqueleto/.test(sheet), 'viejo', 'PerfilSheet pinta el cuerpo único (con el esqueleto mientras baja)')
  for (const f of ['CabeceraDeSiempre', 'FilaDeViaje', 'MapaMisViajes', 'CifrasDelMapa']) debe(!fs.existsSync(`src/components/perfil/${f}.tsx`), 'viejo', `${f}.tsx ya no existe`)
  // Nada de «Abierto» como pastilla de un viaje, ni del Perfil viejo, en ningún sitio de src.
  const quedan = []
  const recorre = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) recorre(p)
      else if (/\.(ts|tsx)$/.test(e.name) && /\b(FilaDeViaje|CabeceraDeSiempre|MapaMisViajes|CifrasDelMapa|chinchetasDeViajes|PROYECCION_MAPA_VIAJES|zoomGloboEntero)\b/.test(sinComentarios(leer(p)))) quedan.push(p)
    }
  }
  recorre('src')
  const propios = quedan.filter((p) => !/tripPersistence\.ts$/.test(p)) // (tripPersistence.ts tiene su propio tipo local «FilaDeViaje», una fila de la base de datos)
  quedan.length = 0
  quedan.push(...propios)
  debe(quedan.length === 0, 'viejo', `quedan restos del perfil viejo en: ${quedan.join(', ')}`)
  const tarjeta = sinComentarios(leer('src/components/logros/pantallas/perfil/TarjetaDeViaje.tsx'))
  debe(!/['"`]Abierto['"`]|>\s*Abierto\s*</.test(tarjeta), 'abierto', 'la tarjeta del viaje no escribe «Abierto»')
  const cuerpo = sinComentarios(leer('src/components/logros/pantallas/perfil/CuerpoConLogros.tsx'))
  debe(/if \(!conLogros \|\| perfilInicial \|\| pantallas > 0\) return/.test(cuerpo), 'servidor', 'sin logros, el cuerpo no pide /api/logros/perfil')
  debe(/if \(!conLogros\) \{/.test(cuerpo) && /data-cabecera-sin-logros/.test(cuerpo) && /<TarjetaPasaporte pasaporte=\{pasaporteLocal\} \/>/.test(cuerpo), 'sin logros', 'sin logros hay cabecera propia, pasaporte de este móvil y Mis viajes')
  debe(/lazy\(\(\) => import\('\.\.\/logros\/pantallas\/perfil\/CuerpoConLogros'\)\)/.test(sheet), 'lazy', 'el cuerpo único se baja con import()')
  // §0a punto 1: las fechas del viaje, bloqueadas también para quien solo recomienda (ya estaba así; solo se comprueba).
  debe(/miPermisoAhora\(\) !== 'admin'\) return/.test(sinComentarios(leer('src/store/useDatesCalendarStore.ts'))), 'fechas', 'las fechas del viaje solo las abre el administrador (quien edita o solo recomienda no puede)')
  const presu = sinComentarios(leer('src/components/route/presupuesto/PantallaPresupuesto.tsx'))
  debe(/<EtiquetaPorPersona tuParte=\{Boolean\(parte\?\.tuParte\)\}/.test(presu), 'tu parte', 'el presupuesto pinta la pastilla con EtiquetaPorPersona')
  debe(!/Tu parte · [0-9]/.test(presu) && !/[0-9] €/.test(presu.replace(/\/\/.*$/gm, '')), 'tu parte', 'el € no está escrito a mano en el presupuesto')
}

/* ─────────────────────────── 2. «Tu parte · 31 €» ─────────────────────────── */
console.log('2. La pastilla del presupuesto')
{
  const { M, limpiar } = await prepararSSR('scripts/destino/_10n4_perfil_entrada.tsx')
  const { createElement, renderToStaticMarkup, EtiquetaPorPersona, formatoImporte } = M
  const aTexto = (html) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/ /g, ' ').replace(/\s+/g, ' ').trim()
  const treintayuno = formatoImporte({ amount: 31, currency: 'EUR' })
  const parte = aTexto(renderToStaticMarkup(createElement(EtiquetaPorPersona, { tuParte: true, importe: treintayuno, simbolo: '€' })))
  const todos = aTexto(renderToStaticMarkup(createElement(EtiquetaPorPersona, { tuParte: false, importe: treintayuno, simbolo: '€' })))
  const norm = (s) => s.replace(/\s+/g, ' ')
  debe(norm(parte) === norm(`Tu parte · ${treintayuno}`), 'tu parte', `una reserva para 2 de 4 dice «Tu parte · ${treintayuno}» y sale «${parte}»`)
  debe(/^Tu parte · 31/.test(parte) && /€$/.test(parte), 'tu parte', `mayúscula, punto medio y el € detrás: «${parte}»`)
  debe(norm(todos) === norm(`${treintayuno} por persona`) && !/Tu parte|tu parte/.test(todos), 'tu parte', `para todo el grupo sigue «${treintayuno} por persona» y sale «${todos}»`)
  const escondida = aTexto(renderToStaticMarkup(createElement(EtiquetaPorPersona, { tuParte: true, importe: null, simbolo: '€' })))
  debe(/^Tu parte · € •••$/.test(escondida), 'tu parte', `con el ojo cerrado: «Tu parte · € •••» y sale «${escondida}»`)
  limpiar?.()
}

/* ─────────────────────────── 3. La pantalla ─────────────────────────── */
console.log('3. La pantalla: el perfil con los logros apagados y encendidos')
const lee = (app, js) => app.evaluar(js)
{
  // 3a. Logros apagados.
  const app = await abrirApp('http://localhost:5173', { ancho: 390, alto: 844, ruta: '/?cuentas=off&logros=off&version=pago&apertura=0' })
  const esp = app.esp
  try {
    for (let i = 0; i < 120 && !(await app.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await esp(500)
    for (let i = 0; i < 60 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await esp(500)
    await app.evaluar('window.__rutaPrueba().then(() => true)')
    for (let i = 0; i < 90 && !(await app.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await esp(1000)
    await esp(3000)
    for (let i = 0; i < 6; i++) {
      const h = await app.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await esp(700)
    }
    await app.evaluar("window.__miPerfil.getState().poner({ nombre: 'Eric' }); true")
    const antes = app.peticiones.length
    await app.evaluar("import('/src/store/usePerfilUi.ts').then((m) => { m.usePerfilUi.getState().abrir(); return true })")
    for (let i = 0; i < 30 && !(await app.evaluar("Boolean(document.querySelector('[data-cabecera-sin-logros]'))")); i++) await esp(500)
    await esp(800)
    const foto = await lee(app, `(() => {
      const d = document.querySelector('[role="dialog"][aria-label="Perfil"]')
      if (!d) return null
      const t = d.innerText
      return {
        texto: t.split(String.fromCharCode(10)).join(' | '),
        cabecera: Boolean(d.querySelector('[data-cabecera-sin-logros]')),
        hola: /Hola,\\s*Eric/.test(t),
        pasaporte: Boolean(d.querySelector('[data-abrir-pasaporte]')),
        pasaporteInerte: Boolean(d.querySelector('[data-abrir-pasaporte]')?.disabled),
        viajes: d.querySelectorAll('[data-tarjeta-de-viaje]').length,
        misViajes: Boolean(d.querySelector('[data-mis-viajes] h3')),
        ajustes: Boolean(d.querySelector('[data-ajustes]')),
        editarFoto: Boolean(d.querySelector('[data-editar-perfil]')),
        vitrina: Boolean(d.querySelector('[data-vitrina-del-perfil],[data-abrir-vitrina]')),
        nivel: Boolean(d.querySelector('[data-nivel-y-rango],[data-cabecera-con-marco]')),
        titulo: Boolean(d.querySelector('[data-titulo-del-perfil]')),
        previo: Boolean(d.querySelector('[data-anadir-viaje-previo],[data-viajes-de-antes]')),
        esqueleto: Boolean(d.querySelector('[data-perfil-cargando]')),
        scrollH: d.scrollWidth <= d.clientWidth + 1,
      }
    })()`)
    debe(foto !== null, 'apagado', 'el perfil se abre con los logros apagados')
    if (foto) {
      debe(foto.cabecera && foto.hola && foto.editarFoto && foto.ajustes, 'apagado', `el perfil nuevo sin logros lleva «Hola, Eric», su foto y los ajustes (${foto.texto.slice(0, 120)})`)
      debe(!foto.vitrina && !foto.nivel && !foto.titulo && !foto.previo && !/\bEXP\b|Nivel \d|vitrina|sorteo|billete|Explorador/i.test(foto.texto), 'apagado', 'sin EXP, ni nivel, ni vitrina, ni título, ni billete del sorteo')
      debe(foto.pasaporte && foto.pasaporteInerte && /Mi pasaporte/.test(foto.texto) && /(\d+|ningún) (país|países) · \d+ (ciudad|ciudades)/.test(foto.texto), 'apagado', `con su pasaporte de este móvil («${(foto.texto.match(/\d+ (?:país|países) · \d+ (?:ciudad|ciudades)/) ?? [''])[0]}»), que no abre el de los logros`)
      debe(foto.misViajes && foto.viajes >= 1 && /Mis viajes/.test(foto.texto), 'apagado', `con «Mis viajes» y su viaje (${foto.viajes})`)
      debe(!/\bAbierto\b/.test(foto.texto), 'apagado', 'ninguna tarjeta dice «Abierto»')
      debe(!foto.esqueleto, 'apagado', 'no se queda en el esqueleto de carga')
      debe(foto.scrollH, 'apagado', 'no hay scroll horizontal')
    }
    const pedidas = app.peticiones.slice(antes).filter((u) => /\/api\/logros\//.test(u))
    debe(pedidas.length === 0, 'apagado', `el perfil sin logros no pide nada de logros al servidor (${pedidas.join(', ')})`)
    await app.captura(path.join(CAPTURAS, '10n4_perfil_logros_apagados.jpg'), 82)
    await app.evaluar("document.querySelector('[data-tarjeta-de-viaje] button[data-viaje-del-perfil]')?.click(); true")
    await esp(1500)
    const album = await lee(app, `Boolean(document.querySelector('[role="dialog"][aria-label^="Viaje a"]'))`)
    debe(album === true, 'apagado', 'tocar un viaje sin logros abre su álbum (la ficha de siempre)')
    await app.captura(path.join(CAPTURAS, '10n4_perfil_logros_apagados_album.jpg'), 82)
  } finally {
    app.cerrar()
  }
}
{
  // 3b. Logros encendidos: como antes.
  const { app, texto, cerrarVentanas, abrirElPerfil } = await abrirConPerfil({ nombre: 'Eric' })
  try {
    await cerrarVentanas()
    await abrirElPerfil()
    for (let i = 0; i < 20 && !(await app.evaluar("Boolean(document.querySelector('[data-cabecera-con-marco]'))")); i++) await app.esp(500)
    const foto = await app.evaluar(`(() => {
      const d = document.querySelector('[role="dialog"][aria-label="Perfil"]')
      if (!d) return null
      return { cabecera: Boolean(d.querySelector('[data-cabecera-con-marco]')), sin: Boolean(d.querySelector('[data-cabecera-sin-logros]')), nivel: Boolean(d.querySelector('[data-nivel-y-rango]')), vitrina: Boolean(d.querySelector('[data-vitrina-del-perfil]')), pasaporte: Boolean(d.querySelector('[data-abrir-pasaporte]')), abre: !d.querySelector('[data-abrir-pasaporte]')?.disabled, viajes: d.querySelectorAll('[data-tarjeta-de-viaje]').length, previo: Boolean(d.querySelector('[data-anadir-viaje-previo]')), texto: d.innerText.split(String.fromCharCode(10)).join(' | ') }
    })()`)
    debe(foto !== null, 'encendido', 'el perfil se abre con los logros encendidos')
    if (foto) {
      debe(foto.cabecera && !foto.sin && foto.nivel && foto.vitrina, 'encendido', 'con los logros: marco de rango, nivel, vitrina…')
      debe(foto.pasaporte && foto.abre && foto.viajes >= 1 && foto.previo, 'encendido', 'su pasaporte (que se abre), sus viajes y «Añadir un viaje que ya hiciste»')
      debe(!/\bAbierto\b/.test(foto.texto), 'encendido', 'ninguna tarjeta dice «Abierto»')
    }
    await app.captura(path.join(CAPTURAS, '10n4_perfil_logros_encendidos.jpg'), 82)
  } finally {
    app.cerrar()
  }
}

console.log(`\nLa prueba del perfil único y «Tu parte» (10N4): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO [${f.regla}] ${f.texto}`)
process.exit(fallos.length === 0 ? 0 : 1)
