// La prueba de la Tanda V34: ARREGLOS DE LA PRIMERA VEZ, DEL PERFIL Y DE LA PÁGINA DEL DESTINO.
//   APP_URL=http://localhost:5173 node scripts/destino/pruebaV34.mjs      (con Vite en 5173)
// Ninguna parte toca el Supabase de producción: la app usa el servidor de mentira de la demo (?logrosDemo=1).
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
const CAP = 'docs/dias/V34_capturas'
fs.mkdirSync(CAP, { recursive: true })

const RUTA = '/?cuentas=on&logros=on&logrosDemo=1&apertura=0'
const NUEVA = "try{localStorage.setItem('trazo:demo:primera_vez_nueva','si');localStorage.removeItem('trazo:demo:primera_vez_hecha');localStorage.removeItem('trazo:primera_vez:avisados')}catch(e){}"
const CURADOS = "window.__destinosCurados = [{ clave: 'roma', nombre: 'Roma', pais: 'Italia', iso: 'it', lat: 41.9028, lng: 12.4964, linea: 'La ciudad eterna', portada: '/fotos/roma/dia_coliseo.jpg', portada_pequena: '/fotos/roma/dia_coliseo_p.jpg' }];"
// Vigila cada fotograma: ¿se ve la pantalla de ORIGEN/DESTINO (la primera pantalla) SIN ninguna cortina, bienvenida, pregunta o Perfil encima?
const VIGILA = `window.__fuga = 0; window.__fotogramas = 0; (function f(){ window.__fotogramas++; if (document.querySelector('[data-primera-pantalla]') && !document.querySelector('[data-cortina-primera-vez],[data-bienvenida-primera-vez],[data-preguntas-primera-vez],[role="dialog"][aria-label="Perfil"]')) window.__fuga++; requestAnimationFrame(f) })();`
const esperar = async (a, js, n = 60) => {
  for (let i = 0; i < n; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(500)
  }
  return false
}
// `evaluar` devuelve el valor ya listo; si el guion lo devolvió como texto JSON, se lee.
const J = async (a, js) => {
  const r = await a.evaluar(js)
  return typeof r === 'string' ? JSON.parse(r) : r
}
const clic = (a, sel) => a.evaluar(`(() => { const e = document.querySelector('${sel}'); if (!e) return false; e.click(); return true })()`)

/* ───────── 1. La primera vez: cortina, bienvenida, preguntas, Perfil ───────── */
console.log('1. Una cuenta nueva nunca ve ORIGEN/DESTINO antes de las preguntas ni antes del Perfil; sale la bienvenida')
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: `${NUEVA}${CURADOS}${VIGILA}` })
  try {
    const sale = await esperar(a, "Boolean(document.querySelector('[data-bienvenida-primera-vez]'))")
    debe(sale, 'bienvenida', 'sale la bienvenida ANTES de la primera pregunta')
    const b = (await J(a, `JSON.stringify({ texto: document.querySelector('[data-bienvenida-primera-vez]').innerText.replace(/\\s+/g, ' '), logo: Boolean(document.querySelector('[data-bienvenida-primera-vez] svg')), empezar: Boolean(document.querySelector('[data-empezar]')), saltar: Boolean(document.querySelector('[data-saltar-bienvenida]')), preguntas: Boolean(document.querySelector('[data-preguntas-primera-vez]')) })`))
    debe(/Bienvenido a JUTRIP/.test(b.texto) && /De viajeros, para viajeros/i.test(b.texto) && /Cuatro preguntas rápidas para conocerte y empezamos/.test(b.texto), 'bienvenida', `la bienvenida dice «Bienvenido a JUTRIP», el lema y «Cuatro preguntas rápidas para conocerte y empezamos» (${b.texto})`)
    debe(b.logo && b.empezar && b.saltar && !b.preguntas, 'bienvenida', 'lleva el logo con su estrella, [Empezar] y «Saltar»; todavía no hay ninguna pregunta')
    await clic(a, '[data-empezar]')
    await esperar(a, "Boolean(document.querySelector('[data-pregunta=\"1\"]'))")
    debe(/Cada cuánto viajas/.test(await a.evaluar('document.body.innerText')), 'bienvenida', 'tras [Empezar], la pregunta 1')
    for (let i = 0; i < 4; i++) {
      await clic(a, '[data-saltar]')
      await a.esp(250)
    }
    await esperar(a, "Boolean(document.querySelector('[data-mapa-primera-vez]'))")
    await a.esp(800)
    const f = (await J(a, 'JSON.stringify({ fuga: window.__fuga, fotogramas: window.__fotogramas })'))
    debe(f.fotogramas > 30 && f.fuga === 0, 'sin_origen_destino', `en ${f.fotogramas} fotogramas, desde que cargó hasta el Perfil, la pantalla de ORIGEN/DESTINO no se vio NI UN fotograma (fotogramas con fuga: ${f.fuga})`)
  } finally {
    a.cerrar()
  }
}
console.log('1b. «Saltar» en la bienvenida salta las cuatro preguntas')
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: `${NUEVA}${CURADOS}${VIGILA}` })
  try {
    await esperar(a, "Boolean(document.querySelector('[data-bienvenida-primera-vez]'))")
    await clic(a, '[data-saltar-bienvenida]')
    const llega = await esperar(a, "Boolean(document.querySelector('[data-mapa-primera-vez]'))")
    const g = (await J(a, 'JSON.stringify(window.__demoPrimeraVez)'))
    debe(llega && g.guardados === 1 && g.frecuencia === null && g.compania === null && g.anio_nacimiento === null, 'bienvenida', '«Saltar» en la bienvenida: queda «hecho» sin guardar ningún dato y va al Perfil')
    const f = (await J(a, 'JSON.stringify({ fuga: window.__fuga })'))
    debe(f.fuga === 0, 'sin_origen_destino', 'tampoco se ve ORIGEN/DESTINO al saltar')
  } finally {
    a.cerrar()
  }
}
console.log('1c. Quien ya contestó va directo al Perfil, también sin ver ORIGEN/DESTINO')
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: `try{localStorage.setItem('trazo:demo:primera_vez_nueva','si');localStorage.setItem('trazo:demo:primera_vez_hecha','si')}catch(e){}${CURADOS}${VIGILA}` })
  try {
    const llega = await esperar(a, "Boolean(document.querySelector('[data-mapa-primera-vez]'))")
    const f = (await J(a, 'JSON.stringify({ fuga: window.__fuga, bienvenida: Boolean(document.querySelector("[data-bienvenida-primera-vez]")) })'))
    debe(llega && f.fuga === 0 && !f.bienvenida, 'sin_origen_destino', `quien ya las contestó: Perfil directo, sin bienvenida y sin ver ORIGEN/DESTINO (fuga ${f.fuga})`)
  } finally {
    a.cerrar()
  }
}

/* ───────── 1d. Al entrar con una cuenta (vuelta de Google / enlace): la cortina desde el primer instante ───────── */
console.log('1d. La vuelta de Google con una sesión anónima guardada: la cortina «Entrando…» está desde el primer fotograma')
{
  const a = await abrirApp(APP, { ruta: '/?cuentas=on&logros=on&logrosDemo=1&apertura=0#access_token=prueba&token_type=bearer', ancho: 390, alto: 844, sinEsperarRuta: true, antes: "try{localStorage.setItem('trazo:cuenta:anonima', JSON.stringify({ uid: 'anon-1', refreshToken: 'r' }))}catch(e){} window.__cortinaFotogramas = 0; window.__antes = 0; window.__texto = null; (function f(){ if (document.body) { const c = document.querySelector('[data-entrando]'); if (c) { window.__cortinaFotogramas++; window.__texto = c.textContent } else if (document.querySelector('#root > *') && !window.__cortinaFotogramas) window.__antes++ } requestAnimationFrame(f) })();" })
  try {
    await a.esp(2500)
    const c = await J(a, 'JSON.stringify({ con: window.__cortinaFotogramas, sin: window.__antes, texto: window.__texto })')
    debe(c.con >= 1 && c.sin === 0, 'cortina_temprana', `con la vuelta de Google y una sesión anónima guardada, la cortina se pone antes de que la app se vea ni un fotograma (fotogramas con cortina ${c.con}; con la app a la vista antes de la cortina ${c.sin})`)
    debe(c.texto === 'Entrando…', 'cortina_temprana', 'la cortina dice «Entrando…»')
  } finally {
    a.cerrar()
  }
}
console.log('1e. Sin sesión anónima guardada (o con error de Google) no hay cortina')
{
  const a = await abrirApp(APP, { ruta: '/?cuentas=on&logros=on&logrosDemo=1&apertura=0', ancho: 390, alto: 844, sinEsperarRuta: true, antes: "try{localStorage.removeItem('trazo:cuenta:anonima')}catch(e){}" })
  try {
    await a.esp(1500)
    debe(!(await a.evaluar("Boolean(document.querySelector('[data-entrando]'))")), 'cortina_temprana', 'una apertura normal no lleva cortina')
  } finally {
    a.cerrar()
  }
}

/* ───────── 2. El Perfil: vitrina vacía y pasaporte, en varios tamaños de móvil ───────── */
console.log('2. Perfil de un viajero nuevo: la vitrina vacía y el pasaporte con sus dos sellos de ejemplo (320, 375 y 430 de ancho)')
for (const ancho of [320, 375, 430]) {
  const a = await abrirApp(APP, { ruta: RUTA, ancho, alto: 800, antes: `try{localStorage.setItem('trazo:demo:primera_vez_nueva','si');localStorage.setItem('trazo:demo:primera_vez_hecha','si')}catch(e){}${CURADOS}` })
  try {
    await esperar(a, "Boolean(document.querySelector('[data-vitrina-del-perfil]')) && Boolean(document.querySelector('[data-abrir-pasaporte] [data-sello-asomando]'))")
    await a.esp(1200)
    const v = (await J(a, `(() => {
      const v = document.querySelector('[data-vitrina-del-perfil]')
      const huecos = [...v.querySelectorAll('[data-hueco-de-vitrina]')]
      const r = (e) => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width, h: b.height } }
      const circulos = huecos.map((h) => h.querySelector('[data-circulo-vacio]')).filter(Boolean)
      const focos = huecos.map((h) => r(h.querySelector('span[aria-hidden]')))
      return {
        tipos: huecos.map((h) => h.dataset.huecoDeVitrina), mas: Boolean(v.querySelector('[data-mas-de-vitrina]')), circulos: circulos.length,
        anchos: circulos.map((c) => Math.round(r(c).w)), centros: circulos.map((c, i) => Math.round(r(c).l + r(c).w / 2 - (focos[i].l + focos[i].w / 2))),
        arriba: circulos.map((c) => Math.round(r(c).t)), cabeza: v.innerText.split('\\n').join(' | ').slice(0, 80)
      }
    })()`))
    debe(v.tipos.length === 3 && v.tipos.every((t) => t === 'vacio') && v.circulos === 3, 'vitrina', `[${ancho}] la vitrina vacía: 3 huecos iguales, cada uno con su círculo (${v.tipos.join()})`)
    debe(!v.mas, 'vitrina', `[${ancho}] fuera el «+» del hueco del medio`)
    debe(new Set(v.anchos).size === 1 && v.anchos[0] >= 80 && new Set(v.arriba).size === 1, 'vitrina', `[${ancho}] los tres círculos son del mismo tamaño y a la misma altura (${v.anchos.join('/')} px)`)
    debe(v.centros.every((c) => Math.abs(c) <= 2), 'vitrina', `[${ancho}] cada círculo, justo debajo de su foco (desvío ${v.centros.join('/')} px)`)
    const p = (await J(a, `(() => {
      const t = document.querySelector('[data-abrir-pasaporte]'); const c = t.getBoundingClientRect()
      const sellos = [...t.querySelectorAll('[data-sello-asomando]')]
      const dentro = sellos.map((s) => { const b = s.getBoundingClientRect(); return b.left >= c.left + 1 && b.right <= c.right - 1 && b.top >= c.top + 1 && b.bottom <= c.bottom - 1 })
      const sheet = t.querySelector('span[aria-hidden][class*="absolute"]'); const num = t.querySelector('[data-numeros-pasaporte]').getBoundingClientRect(); const tit = [...t.querySelectorAll('span')].find((s) => s.textContent === 'Mi pasaporte').getBoundingClientRect()
      const h = sheet.getBoundingClientRect()
      return { tipos: sellos.map((s) => s.dataset.selloAsomando), dentro, ancho: Math.round(c.width), tapa: tit.right > h.left + 18 || num.right > h.left + 18, solape: Math.round(Math.max(tit.right, num.right) - h.left) }
    })()`))
    debe(p.tipos.length === 2 && p.tipos.every((x) => x === 'ejemplo'), 'pasaporte', `[${ancho}] la tarjeta lleva SIEMPRE dos sellos; sin viajes, los dos de ejemplo (${p.tipos.join()})`)
    debe(p.dentro.every(Boolean), 'pasaporte', `[${ancho}] los dos sellos caben enteros dentro de la tarjeta (no se cortan) (${p.dentro.join()})`)
    debe(!p.tapa, 'pasaporte', `[${ancho}] la hoja de la derecha no tapa «Mi pasaporte» ni los números (solape ${p.solape} px)`)
    if (ancho === 375) {
      await a.evaluar("document.querySelector('[data-abrir-pasaporte]').scrollIntoView({ block: 'center' }); true")
      await a.esp(300)
      await a.evaluar("document.querySelector('[data-vitrina-del-perfil]').scrollIntoView({ block: 'center' }); true")
      await a.esp(300)
    }
  } finally {
    a.cerrar()
  }
}
console.log('2b. El mismo Perfil con 1, 2 y 3 logros: tres huecos iguales, sin «+»')
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: `try{localStorage.setItem('trazo:demo:primera_vez_nueva','si');localStorage.setItem('trazo:demo:primera_vez_hecha','si')}catch(e){}${CURADOS}` })
  try {
    await esperar(a, "Boolean(document.querySelector('[data-vitrina-del-perfil]'))")
    const fuente = leer('src/components/logros/pantallas/perfil/CuerpoConLogros.tsx')
    debe(!/data-mas-de-vitrina(?!-cabecera)/.test(fuente) && /return Array\.from\(\{ length: 3 \}, \(_, i\) => \(\{ p: rec\[i\] \?\? null/.test(fuente), 'vitrina', 'con 0, 1, 2 o 3 logros se usan siempre tres huecos y ya no existe el «+» del medio (lo ganado primero, el resto vacío del mismo tamaño)')
    debe(/TAM_DE_VITRINA - 8/.test(fuente), 'vitrina', 'el círculo vacío mide casi lo mismo que una pieza ganada (TAM_DE_VITRINA)')
  } finally {
    a.cerrar()
  }
}
{
  const t = leer('src/components/logros/pantallas/perfil/TarjetaPasaporte.tsx')
  debe(/SELLOS_DE_EJEMPLO/.test(t) && /\.slice\(0, 2\)/.test(t), 'pasaporte', 'los sellos de ejemplo siguen en el código, para rellenar hasta los dos de la tarjeta')
}

/* ───────── 3. La tarjeta y la página del destino ───────── */
console.log('3. La tarjeta del destino con sus números a la primera, y la página sin viaje (390 x 844, 320 x 568 y 430 x 932)')
for (const [ancho, alto] of [[390, 844], [320, 568], [430, 932]]) {
  const a = await abrirApp(APP, { ruta: RUTA, ancho, alto, antes: `try{localStorage.setItem('trazo:demo:primera_vez_nueva','si');localStorage.setItem('trazo:demo:primera_vez_hecha','si')}catch(e){}${CURADOS}` })
  try {
    await esperar(a, "document.querySelectorAll('[data-pin]').length >= 3")
    await a.esp(1500) // el mapa ya pidió los números por adelantado
    const t = (await J(a, `(async () => {
      document.querySelector('[data-destino-lista="roma"]').click()
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const n = document.querySelector('[data-llevar-numeros]')
      return { texto: n ? n.innerText.replace(/\\s+/g, ' ') : null }
    })()`))
    debe(Boolean(t.texto) && !/·/.test(t.texto) && /\d+ medalla/.test(t.texto) && /\d+ colecciones/.test(t.texto) && /\d+ emblemas secretos/.test(t.texto), 'tarjeta_rapida', `[${ancho}] la tarjeta de Roma trae sus números EN EL PRIMER PINTADO, sin puntitos (${t.texto})`)
    await esperar(a, "Boolean(document.querySelector('[data-ver-destino]'))")
    const pag = (await J(a, `(async () => {
      document.querySelector('[data-ver-destino]').click()
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))))
      const l = document.querySelector('[data-pagina-destino] [data-llevar-numeros]') ?? null
      return { numeros: Boolean(document.querySelector('[data-pagina-destino] [data-lo-que-te-puedes-llevar]')), medallas: document.querySelectorAll('[data-llevar-medallas] [data-medalla]').length }
    })()`))
    debe(pag.numeros && pag.medallas >= 1, 'tarjeta_rapida', `[${ancho}] la página sin viaje trae «Lo que te puedes llevar» en el primer pintado (${pag.medallas} medallas)`)
    await esperar(a, "Boolean(document.querySelector('[data-pagina-destino] [data-lo-que-te-puedes-llevar]'))")
    await a.esp(1000)
    // 7. emblemas con silueta
    const e = (await J(a, `(() => {
      const hs = [...document.querySelectorAll('[data-llevar-emblemas] [data-hueco-emblema]')]
      const formas = hs.slice(0, 4).map((h) => h.style.clipPath + '|' + h.style.borderRadius)
      return { n: hs.length, formas, interrogacion: hs.every((h) => h.textContent === '?'), circulos: document.querySelectorAll('[data-emblema-silueta]').length, redondosIguales: new Set(formas).size === 1 }
    })()`))
    debe(e.n >= 4 && e.interrogacion && e.n === e.circulos, 'emblemas', `[${ancho}] los emblemas secretos son siluetas con «?» (${e.n})`)
    debe(!e.redondosIguales, 'emblemas', `[${ancho}] cada emblema tiene su silueta, no todos el mismo círculo (${e.formas.length} formas distintas: ${new Set(e.formas).size})`)
    // 9. portada
    const portada = await a.evaluar("document.querySelector('[data-pagina-destino] .relative.h-\\\\[250px\\\\] > div')?.style.background ?? ''")
    debe(/dia_coliseo/.test(portada), 'portada', `[${ancho}] la página de Roma sin viaje lleva la foto de portada de Roma, no el degradado (${String(portada).slice(0, 70)})`)
    // 8. una sola cruz, siempre en el mismo sitio y con fondo
    const cruces = async () => (await J(a, `(() => { const cs = [...document.querySelectorAll('[data-pagina-destino] [aria-label="Cerrar"]')].filter((b) => { const r = b.getBoundingClientRect(); const cs = getComputedStyle(b); return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' }); const r = cs[0]?.getBoundingClientRect(); const barra = document.querySelector('[data-barra-superior]'); return { n: cs.length, x: r ? Math.round(r.left) : null, y: r ? Math.round(r.top) : null, fondo: barra ? getComputedStyle(barra).backgroundImage : '' } })()`))
    const c0 = await cruces()
    await a.evaluar("document.querySelector('[data-pagina-destino]').scrollTop = 600; true")
    await a.esp(500)
    const c1 = await cruces()
    debe(c0.n === 1 && c1.n === 1, 'una_cruz', `[${ancho}] solo hay UNA cruz de cerrar, arriba y al bajar (${c0.n} / ${c1.n})`)
    debe(c0.x === c1.x && c0.y === c1.y, 'una_cruz', `[${ancho}] la cruz está siempre en el mismo sitio (${c0.x},${c0.y} → ${c1.x},${c1.y})`)
    debe(/gradient/.test(c1.fondo), 'una_cruz', `[${ancho}] al bajar, la cruz va con su barra de fondo`)
    // 10. el botón fijo no tapa lo último
    const h = (await J(a, `(() => { const c = document.querySelector('[data-pagina-destino]'); c.scrollTop = c.scrollHeight; return new Promise((res) => setTimeout(() => {
      const barra = document.querySelector('[data-crear-mi-viaje]').getBoundingClientRect(); const ultimo = document.querySelector('[data-llevar-emblemas]').getBoundingClientRect(); const ver = document.querySelector('[data-ver-todas-actividades]')?.getBoundingClientRect()
      const cruza = (a, b) => a && a.bottom > b.top && a.top < b.bottom
      res({ libre: Math.round(barra.top - ultimo.bottom), verTapado: ver ? cruza(ver, barra) : false })
    }, 300)) })()`))
    debe(h.libre >= 8, 'hueco_boton', `[${ancho}] al llegar abajo, lo último queda por encima del botón fijo con hueco (${h.libre} px)`)
    debe(!h.verTapado, 'hueco_boton', `[${ancho}] [Crear mi viaje] no tapa [Ver todas las actividades]`)
  } finally {
    a.cerrar()
  }
}
{
  // [Ver todas las actividades] al llegar a ese punto de la página, con el botón fijo encima: nunca debajo de él.
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: `try{localStorage.setItem('trazo:demo:primera_vez_nueva','si');localStorage.setItem('trazo:demo:primera_vez_hecha','si')}catch(e){}${CURADOS}` })
  try {
    await esperar(a, "document.querySelectorAll('[data-pin]').length >= 3")
    await clic(a, '[data-destino-lista="roma"]')
    await esperar(a, "Boolean(document.querySelector('[data-ver-destino]'))")
    await clic(a, '[data-ver-destino]')
    await esperar(a, "Boolean(document.querySelector('[data-pagina-destino] [data-lo-que-te-puedes-llevar]'))")
    const ok = await a.evaluar(`(() => { const c = document.querySelector('[data-pagina-destino]'); const pad = parseFloat(getComputedStyle(c.firstElementChild).paddingBottom); const barra = document.querySelector('[data-crear-mi-viaje-barra]').getBoundingClientRect(); return pad >= barra.height })()`)
    debe(ok, 'hueco_boton', 'el hueco bajo el contenido es al menos tan alto como la barra del botón fijo')
  } finally {
    a.cerrar()
  }
}

/* ───────── 4. Las fotos de portada de todos los destinos ───────── */
console.log('4. Todos los destinos tienen su foto de portada (la tarjeta del mapa y la página)')
{
  const { leerDestinosCurados } = await import('../../server/destinosCurados.js')
  const todos = leerDestinosCurados('data', { esAdmin: true })
  debe(todos.length >= 2, 'portada', `hay destinos listos (${todos.map((d) => d.clave).join(', ')})`)
  for (const d of todos) {
    const existe = (r) => Boolean(r) && fs.existsSync(`public${String(r).split('?')[0]}`)
    debe(existe(d.portada), 'portada', `${d.clave}: su portada grande existe (${d.portada})`)
    debe(existe(d.portada_pequena), 'portada', `${d.clave}: su portada pequeña (la de la tarjeta del mapa) existe (${d.portada_pequena})`)
  }
  const modal = leer('src/components/route/DestinationDetailModal.tsx')
  const host = leer('src/components/primeraVez/PrimeraVezHost.tsx')
  debe(/portada: curado\?\.portada \?\? destino\.portada/.test(host) && /sinViaje\?\.portada/.test(modal), 'portada', 'la página sin viaje usa la portada del destino (no busca foto por nombre)')
}

/* ───────── 5. El código ───────── */
console.log('5. El código')
{
  const hoja = leer('src/components/logros/momentos/HojaLogros.tsx')
  const llevar = leer('src/components/primeraVez/LoQueTePuedesLlevar.tsx')
  debe(/SiluetaDeEmblema/.test(hoja) && /SiluetaDeEmblema/.test(llevar) && fs.existsSync('src/components/logros/dibujos/SiluetaDeEmblema.tsx'), 'emblemas', 'la hoja de logros (V25) y «Lo que te puedes llevar» usan LA MISMA pieza de silueta')
  debe(/precargarDestinos/.test(leer('src/components/primeraVez/MapaDeDestinos.tsx')) && /precargarDestinos/.test(leer('src/components/primeraVez/PreguntasPrimeraVez.tsx')), 'tarjeta_rapida', 'los números de los destinos se piden por adelantado (al abrir el mapa y mientras se contestan las preguntas)')
  const arranque = leer('src/components/primeraVez/PrimeraVezArranque.tsx')
  debe(/data-cortina-primera-vez/.test(arranque) && /fallback=\{<Cortina \/>\}/.test(arranque), 'sin_origen_destino', 'hay una cortina neutra mientras se decide adónde llevar, y mientras se baja el Perfil y las preguntas')
}

console.log(`\nPrueba de la Tanda V34: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  - [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
