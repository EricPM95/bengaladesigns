// La prueba de la Tanda 10N5, agente H3 (el pase): 0.2 los candados sin pintar hasta saber si hay pase (y repintados solos), 0.3 los tres colores de las entradas (RESERVAS, Free Tour, excursiones, DÍAS), 5 la película
// del pase (todas las escenas de lado a lado, el título pequeño en la línea de [Saltar], ningún texto pisado ni cortado en 390 x 664 y 375 x 667, las rayitas que se tocan, la escena del pasaporte sin el rato parado),
// 6 [Guardar] solo «Guardar» y 6b la caja pequeña del pase (`Piezas/Pase Estilo` 01) en todos los sitios que piden el pase, lo pequeño bloqueado en azul oscuro con el candado dorado y los textos verdad.
//   APP_URL=http://localhost:5183 API_URL=http://localhost:8853 node scripts/destino/pruebaTanda10N5_pase.mjs
// Acaba imprimiendo «N comprobaciones, M fallos» y sale con código 1 si falla alguna. Capturas en docs/dias/capturas_jutrip/10n5_*.jpg.
import fs from 'node:fs'
import { conViaje, abrirPase, esp, cuando, clicEn, foto, leer, modulo } from './_10n5_comun.mjs'
import { capturarDesign } from './capturaDesign.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
const SOLO = process.env.SOLO ?? '' // «codigo», «cajas», «pendiente», «pelicula» (para repetir una parte)
const paso = (...x) => console.log(new Date().toISOString().slice(11, 19), ...x)
const toca = (parte) => !SOLO || SOLO.split(',').includes(parte)

/* ───────────────────────── 1. El código ───────────────────────── */
if (toca('codigo')) {
  console.log('1. El código')
  const pago = leer('src/lib/pago.ts')
  debe(/export function pagoPendiente/.test(pago) && /export function usePagoActivo/.test(pago) && /export function usePasePintable/.test(pago) && /export const fijarPaseDesconocido/.test(pago), 'candados', 'pago.ts avisa cuando cambia el pase (pagoPendiente, usePagoActivo, usePasePintable, fijarPaseDesconocido)')
  debe(/if \(pedida === null && !paseSabido\) return false/.test(pago), 'candados', 'mientras no se sabe si hay pase, pagoActivo() no dice «abierto»')
  const estado = leer('src/lib/paseEstado.ts')
  debe((estado.match(/fijarServidorDiceSinPase\([^)]*tripId\)/g) ?? []).length >= 3, 'candados', 'paseEstado avisa SIEMPRE al llegar la respuesta (con pase, sin pase y sin servidor): los candados nunca se quedan esperando')
  debe(/useSyncStore\.subscribe/.test(estado) && /fijarPaseDesconocido/.test(estado), 'candados', 'al abrir un viaje el pase pasa a «pendiente» al instante, sin esperar a que se pinte una pantalla')
  debe(/usePaseEstado\(useSyncStore/.test(leer('src/components/pase/PeliculaHost.tsx')), 'candados', 'un guardián siempre montado pregunta lo del pase (también sin RUTA ni HOY a la vista)')
  const candado = sinComentarios(leer('src/components/pase/Candado.tsx'))
  debe(/estado !== 'sin'\) return null/.test(candado), 'candados', 'la caja del pase no se pinta ni con pase ni mientras no se sabe')
  debe(/data-caja-pase/.test(candado) && /#1C2230/.test(candado) && /#F3E2B0/.test(candado) && /Instrument Serif/.test(candado), 'caja', 'la caja es la de Pase Estilo 01: azul oscuro, título en la letra de titulares y botón dorado')
  // Todos los sitios donde algo pide el pase (menos HOY) usan la caja con título y la frase con «{pase}».
  const usos = []
  const recorre = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = `${d}/${e.name}`
      if (e.isDirectory()) recorre(p)
      else if (/\.tsx$/.test(e.name) && !/pase\/Candado\.tsx$/.test(p)) for (const m of sinComentarios(leer(p)).matchAll(/<Candado\b[^>]*\/?>/g)) usos.push([p, m[0]])
    }
  }
  recorre('src')
  debe(usos.length >= 6, 'caja', `la caja del pase está en ${usos.length} sitios`)
  for (const [p, u] of usos) debe(/titulo=/.test(u) && /\{pase\}/.test(u), 'caja', `${p}: la caja lleva título y la frase con «Pase {destino}»`)
  debe(usos.every(([, u]) => !/cerca de donde duermes|empieza cerca/.test(u)), 'textos', 'ninguna caja dice que cada día empieza cerca del alojamiento')
  // Los textos verdad.
  const buscar = (d, re, malos) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = `${d}/${e.name}`
      if (e.isDirectory()) buscar(p, re, malos)
      else if (/\.(tsx?|json)$/.test(e.name) && !/\/gen\/|mapas\.ts/.test(p) && re.test(sinComentarios(leer(p)))) malos.push(p)
    }
  }
  const malos = []
  for (const d of ['src', 'data/pase']) buscar(d, /cada día empieza cerca|Cada día empieza cerca|cerca de donde duermes|Cada día sale desde tu zona/, malos)
  debe(malos.length === 0, 'textos', `ningún texto de la app promete que cada día empieza cerca del alojamiento (${malos.join(', ') || 'ninguno'})`)
  const gen = leer('src/components/pase/pelicula/gen/Pase_Pelicula.ts')
  debe(!/Cada día empieza cerca/.test(gen) && /Tu ruta se adapta a tu alojamiento/.test(gen), 'textos', 'la película (Design) ya dice «Tu ruta se adapta a tu alojamiento»')
  debe(!/Cada día sale desde tu zona/.test(leer('src/lib/listaDelPase.ts')) && /Adaptamos tu ruta a tu alojamiento/.test(leer('src/lib/listaDelPase.ts')), 'textos', 'la lista de lo que incluye dice «Adaptamos tu ruta a tu alojamiento»')
  // [Guardar].
  const hoja = sinComentarios(leer('src/components/route/reservas/AddReservationSheet.tsx'))
  debe(!/Guardar · /.test(hoja) && /: 'Guardar'\}/.test(hoja), 'guardar', 'el botón de añadir una reserva dice solo «Guardar»')
  debe(!/Guardar · /.test(sinComentarios(leer('src/components/route/reservas/LlegadaYVuelta.tsx'))), 'guardar', 'y el de la hora del vuelo también')
  // Lo pequeño bloqueado.
  debe(/data-bloqueado-pase/.test(leer('src/components/route/ExplorePanel.tsx')) && /AZUL_PASE/.test(leer('src/components/route/ExplorePanel.tsx')), 'bloqueado', 'Baños y Fuentes bloqueadas, en azul oscuro con el candado dorado')
  debe(/bloqueada/.test(leer('src/components/ui/Elegir.tsx')) && /bloqueada: estadoPase === 'sin'/.test(leer('src/components/route/placeExplorer/PlaceExplorerScreen.tsx')), 'bloqueado', '«Cerca de ti» bloqueada, igual')
  debe(/usePasePintable/.test(leer('src/components/route/ExplorePanel.tsx')) && /usePasePintable/.test(leer('src/components/route/placeExplorer/PlaceExplorerScreen.tsx')), 'candados', 'Baños, Fuentes y «Cerca de ti» no se pintan hasta saber si hay pase')
  // Los tres colores.
  debe(/grupo:/.test(leer('src/components/route/reservas/EntradaEdgeTab.tsx')) && /delGrupo/.test(leer('src/components/route/reservas/EntradaCard.tsx')), 'colores', 'el botón de DÍAS y la tarjeta de RESERVAS tienen el tercer color (azul oscuro con dorado)')
  debe(/delGrupo/.test(leer('src/components/route/reservas/EntradasYFreeTour.tsx')) && /delGrupo/.test(leer('src/components/route/reservas/ExcursionesReservas.tsx')), 'colores', 'el Free Tour y las excursiones también')
  // La película.
  const adaptar = leer('src/components/pase/pelicula/adaptar.ts')
  debe(/data-pelicula-titulo/.test(adaptar) && /data-raya/.test(adaptar) && /top:66px;height:32px/.test(adaptar), 'pelicula', 'el título pequeño va en la línea de [Saltar] y las rayitas son tocables')
  debe(/irALaEscena/.test(leer('src/components/pase/PeliculaPase.tsx')), 'pelicula', 'tocar una rayita lleva a esa escena y la reinicia')
}

/* ───────────────────────── 2. Las cajas del pase y lo bloqueado, en la app ───────────────────────── */
const store = modulo('/src/store/useRouteStore.ts')
const modo = async (a, m, dia = null) => {
  await a.evaluar(`${store}.then((s) => { const e = s.useRouteStore.getState(); e.setActiveDayId(${dia === null ? 'null' : 'e.route.days[' + dia + '].id'}); e.setMode('${m}'); return true })`)
  await a.esp(2500)
  for (let i = 0; i < 6; i++) {
    const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Siguiente|Genial|Ya lo sé)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await a.esp(500)
  }
}
const MIDE_CAJA = (sel) => `(() => {
  const e = document.querySelector(${JSON.stringify(sel)})
  if (!e) return null
  const r = e.getBoundingClientRect()
  const cs = getComputedStyle(e)
  const ver = e.querySelector('[data-caja-pase-ver]')
  return { texto: e.innerText.split(String.fromCharCode(10)).join(' | '), fondo: cs.backgroundImage, sombra: cs.boxShadow, alto: r.height, ancho: r.width, izq: r.left, der: r.right, ver: ver ? { texto: ver.innerText, fondo: getComputedStyle(ver).backgroundImage, h: ver.getBoundingClientRect().height, svg: Boolean(ver.querySelector('svg')) } : null }
})()`
const esCaja = (c, titulo, linea) => {
  return c && /linear-gradient/.test(c.fondo) && /28, 34, 48/.test(c.fondo) && c.texto.includes(titulo) && c.texto.includes(linea) && c.ver && c.ver.texto.trim() === 'Ver' && c.ver.svg && /243, 226, 176/.test(c.ver.fondo) && c.alto < 100 && c.alto > 50
}

if (toca('cajas')) {
  console.log('2. Las cajas y lo bloqueado (sin pase)')
  const g = await conViaje({ version: 'gratis', ancho: 390, alto: 844 })
  try {
    // RESERVAS · Alojamiento
    await modo(g, 'bookings')
    await g.evaluar("(() => { const b = document.querySelector('[data-blk=\"aloj\"] div'); if (b) b.click(); return true })()")
    await g.esp(1500)
    await g.evaluar("(() => { const e = document.querySelector('[data-blk=\"aloj\"]'); if (e) e.scrollIntoView({ block: 'start' }); return true })()")
    await g.esp(600)
    let c = await g.evaluar(MIDE_CAJA('[data-candado="alojamiento-zona"]'))
    debe(esCaja(c, '¿En qué zona te alojas?', 'Con el Pase Roma, adaptamos tu ruta a tu alojamiento.'), 'caja', `RESERVAS › Alojamiento: la caja de Pase Estilo 01 con su título, su línea y [🔒 Ver] (${JSON.stringify(c)?.slice(0, 260)})`)
    debe(c && c.izq >= 0 && c.der <= 390, 'caja', 'la caja cabe en el ancho del móvil')
    await g.captura(foto('caja_reservas_alojamiento'))
    // RESERVAS · Llegada y vuelta, con el vuelo guardado
    await g.evaluar(`${store}.then((s) => { const e = s.useRouteStore.getState(); e.setArrivalFlightTime('15:40'); e.setDepartureFlightTime('18:20'); return true })`)
    await modo(g, 'bookings')
    await g.evaluar("(() => { const b = document.querySelector('[data-blk=\"llegada\"] div'); if (b) b.click(); return true })()")
    await g.esp(1500)
    await g.evaluar("(() => { const e = document.querySelector('[data-candado=\"llegada-ajuste\"]'); if (e) e.scrollIntoView({ block: 'center' }); return true })()")
    await g.esp(600)
    c = await g.evaluar(MIDE_CAJA('[data-candado="llegada-ajuste"]'))
    debe(esCaja(c, 'Tu primer y tu último día', 'Con el Pase Roma, ajustamos tu primer y tu último día a tu vuelo.'), 'caja', `RESERVAS › Llegada y vuelta: la caja del pase (${JSON.stringify(c)?.slice(0, 200)})`)
    await g.captura(foto('caja_reservas_llegada'))
    // DÍAS · primer día
    await modo(g, 'days', 0)
    await g.evaluar("(() => { const e = document.querySelector('[data-candado=\"dia-ajuste-llegada\"]'); if (e) e.scrollIntoView({ block: 'center' }); return true })()")
    await g.esp(800)
    c = await g.evaluar(MIDE_CAJA('[data-candado="dia-ajuste-llegada"]'))
    debe(esCaja(c, 'Tu día de llegada', 'Con el Pase Roma, tu día se ajusta a la hora de tu vuelo.'), 'caja', `DÍAS › primer día: la caja del ajuste (${JSON.stringify(c)?.slice(0, 200)})`)
    const zona = await g.evaluar(MIDE_CAJA('[data-candado="alojamiento-zona"]'))
    debe(!zona || esCaja(zona, '¿En qué zona te alojas?', 'Con el Pase Roma, adaptamos tu ruta a tu alojamiento.'), 'caja', 'DÍAS › primer día: la caja de la zona, si sale, es la misma')
    await g.captura(foto('caja_dias_primer_dia'))
    // EXPLORAR · Baños y Fuentes
    await modo(g, 'explore')
    await g.esp(2500)
    const bloq = await g.evaluar(`(() => ['banos', 'fuentes'].map((id) => { const e = document.querySelector('[data-candado="explorar-' + id + '"]'); if (!e) return null; const cs = getComputedStyle(e); const oro = e.querySelector('span[aria-hidden] svg'); return { nombre: e.innerText.trim(), fondo: cs.backgroundImage, sombra: cs.boxShadow, candado: Boolean(oro), marca: e.getAttribute('data-bloqueado-pase') } }))()`)
    for (const [i, id] of ['Baños', 'Fuentes'].entries()) {
      const b = bloq?.[i]
      debe(b && b.nombre === id && /28, 34, 48/.test(b.fondo) && /233, 199, 122/.test(b.sombra) && b.candado && b.marca === '1', 'bloqueado', `EXPLORAR › ${id}: en azul oscuro con el candado dorado, solo el nombre y el candado (${JSON.stringify(b)?.slice(0, 200)})`)
    }
    await g.captura(foto('bloqueado_explorar_banos_fuentes'))
    // «Cerca de ti» en el explorador de lugares (se abre con la tarjeta de restaurantes)
    const abierto = await g.evaluar("(() => { const t = Array.from(document.querySelectorAll('button')).find((b) => /Restaurantes/.test(b.innerText)); if (!t) return false; t.click(); return true })()")
    if (abierto) {
      await g.esp(2500)
      const cerca = await g.evaluar(`(() => { const p = document.querySelector('[data-pestana="nearby"]'); if (!p) return null; const cs = getComputedStyle(p); return { fondo: cs.backgroundImage, sombra: cs.boxShadow, candado: Boolean(p.querySelector('svg[data-bloqueado-pase]')), texto: p.innerText.trim() } })()`)
      debe(cerca && /Cerca de ti/.test(cerca.texto) && /28, 34, 48/.test(cerca.fondo) && /233, 199, 122/.test(cerca.sombra) && cerca.candado, 'bloqueado', `la pestaña «Cerca de ti»: en azul oscuro con el candado dorado (${JSON.stringify(cerca)?.slice(0, 200)})`)
      await g.captura(foto('bloqueado_cerca_de_ti'))
    } else debe(false, 'bloqueado', 'no encuentro la tarjeta de Restaurantes para abrir el explorador')
    // Logros
    await g.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^Cerrar$/.test((x.getAttribute('aria-label') || x.textContent || '').trim())); if (b) b.click(); return true })()`)
    await modo(g, 'route')
    await g.evaluar('window.__momentos.hoja()')
    await g.esp(3500)
    c = await g.evaluar(MIDE_CAJA('[data-candado="logros-sin-pase"]'))
    debe(esCaja(c, 'Tus logros del viaje', 'Con el Pase Roma, cada sitio que ves suma.'), 'caja', `Logros: la caja del pase (${JSON.stringify(c)?.slice(0, 200)})`)
    await g.captura(foto('caja_logros'))
  } finally {
    g.cerrar()
  }

  console.log('2b. Con el pase: ni cajas ni candados')
  const k = await conViaje({ version: 'completa', ancho: 390, alto: 844 })
  try {
    await modo(k, 'bookings')
    await k.evaluar("(() => { const b = document.querySelector('[data-blk=\"aloj\"] div'); if (b) b.click(); return true })()")
    await k.esp(1500)
    const hay = await k.evaluar("document.querySelectorAll('[data-caja-pase],[data-bloqueado-pase]').length")
    debe(hay === 0, 'candados', `con el pase, RESERVAS no lleva ninguna caja del pase (${hay})`)
    await modo(k, 'explore')
    await k.esp(2500)
    const hay2 = await k.evaluar("({ cajas: document.querySelectorAll('[data-caja-pase],[data-bloqueado-pase]').length, banos: Boolean(Array.from(document.querySelectorAll('button')).find((b) => /^Baños/.test(b.innerText.trim()))) })")
    debe(hay2.cajas === 0 && hay2.banos, 'candados', 'con el pase, EXPLORAR tiene Baños y Fuentes abiertas, sin candado')
    await k.captura(foto('con_pase_explorar'))
  } finally {
    k.cerrar()
  }
}

/* ───────────────────────── 3. Sin pintar hasta saber si hay pase, y repintado solo ───────────────────────── */
if (toca('pendiente')) {
  console.log('3. Candados sin pintar mientras no se sabe')
  for (const demo of (process.env.DEMOS ?? 'sin,con').split(',')) {
    const antes = `try{sessionStorage.setItem('trazo:demo-pase','${demo}')}catch(e){}; window.__retrasoDemo = { '/api/pase/estado?trip_id=prueba-10n5-${demo}': 7000 };`
    const a = await conViaje({ version: 'pago', ancho: 390, alto: 844, ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0', extraAntes: antes })
    try {
      paso(demo, 'viaje listo')
      await modo(a, 'bookings')
      paso(demo, 'en RESERVAS')
      await a.evaluar("(() => { const b = document.querySelector('[data-blk=\"aloj\"] div'); if (b) b.click(); return true })()")
      await a.esp(1200)
      // Se abre un viaje con cuenta (con `cuentas=off` no hay id de viaje): a partir de aquí el servidor tiene que decir si hay pase.
      await a.evaluar(`${modulo('/src/store/useSyncStore.ts')}.then((m) => { m.useSyncStore.setState({ activeTripId: 'prueba-10n5-${demo}' }); return true })`)
      paso(demo, 'id de viaje puesto')
      const pago = modulo('/src/lib/pago.ts')
      const muestras = []
      for (let i = 0; i < 40; i++) {
        const m = await a.evaluar(`${pago}.then((p) => ({ pendiente: p.pagoPendiente(), activo: p.pagoActivo(), cajas: document.querySelectorAll('[data-caja-pase]').length, bloqueados: document.querySelectorAll('[data-bloqueado-pase]').length }))`)
        muestras.push(m)
        if (i === 3) await a.captura(foto(`pendiente_${demo}_sin_pintar`))
        if (!m.pendiente && i > 3) break
        await a.esp(400)
      }
      const pend = muestras.filter((m) => m.pendiente)
      const sabido = muestras.filter((m) => !m.pendiente).slice(-1)[0]
      debe(pend.length >= 3, 'pendiente', `${demo}: mientras el servidor no contesta el pase está «pendiente» (${pend.length} muestras)`)
      debe(pend.every((m) => m.cajas === 0 && m.bloqueados === 0 && m.activo === false), 'pendiente', `${demo}: mientras no se sabe, NINGUNA caja ni candado pintado, ni cerrado ni abierto (${JSON.stringify(pend[0])})`)
      if (demo === 'sin') {
        // Al llegar la respuesta, la caja aparece sola (sin que nadie toque nada).
        let aparece = false
        for (let i = 0; i < 12 && !aparece; i++) {
          aparece = (await a.evaluar("document.querySelectorAll('[data-caja-pase]').length")) > 0
          if (!aparece) await a.esp(400)
        }
        debe(aparece, 'repinta', 'sin pase: al llegar la respuesta la caja del pase aparece sola')
        await a.captura(foto('pendiente_sin_repintado'))
      } else {
        await a.esp(1500)
        const nada = await a.evaluar("document.querySelectorAll('[data-caja-pase],[data-bloqueado-pase]').length")
        debe(nada === 0 && sabido && sabido.activo === true, 'repinta', `con pase: al llegar la respuesta no sale NUNCA un candado cerrado (cajas ${nada}, abierto ${sabido?.activo})`)
      }
    } finally {
      a.cerrar()
    }
  }
}

/* ───────────────────────── 4. La película del pase ───────────────────────── */
if (toca('pelicula')) {
  console.log('4. La película')
  const ff = `(() => { const r = document.querySelector('[data-pelicula] .pfr'); r.getAnimations({ subtree: true }).forEach((an) => { try { const e = an.effect.getComputedTiming().endTime; if (isFinite(e)) an.currentTime = e } catch (x) {} }); return true })()`
  // Cada escena a su hora «de lectura» (cuando ya están todos sus textos): { escena, segundos reales, ff }
  const ESCENAS = [
    { e: 0, s: 2, ff: true, nombre: 'tu_viaje' },
    { e: 1, s: 2, ff: true, nombre: 'hoy' },
    { e: 3, s: 19, ff: false, nombre: 'secretos' },
    { e: 4, s: 12, ff: true, nombre: 'suma' },
    { e: 5, s: 20, ff: false, nombre: 'pasaporte' },
    { e: 6, s: 9, ff: false, nombre: 'recuerdos' },
  ]
  const MIDE = `(() => {
    const P = document.querySelector('[data-pelicula]')
    const vw = window.innerWidth, vh = window.innerHeight
    const opac = (el) => { let o = 1; for (let p = el; p && p !== P.parentElement; p = p.parentElement) { const cs = getComputedStyle(p); o *= Number(cs.opacity); if (cs.visibility === 'hidden' || cs.display === 'none') return 0 } return o }
    const hojas = Array.from(P.querySelectorAll('*')).filter((e) => e.children.length === 0 && (e.textContent || '').trim() && opac(e) > 0.5)
    const rect = (e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height, t: (e.textContent || '').trim().slice(0, 40) } }
    const cab = Array.from(P.querySelectorAll('[data-pelicula-titulo],[data-pelicula-saltar]')).map(rect)
    const abajo = Array.from(P.querySelectorAll('[data-texto-abajo]')).flatMap((c) => Array.from(c.querySelectorAll('*')).filter((e) => e.children.length === 0 && (e.textContent || '').trim() && opac(e) > 0.5).map(rect))
    const tToast = Array.from(P.querySelectorAll('span')).filter((e) => e.children.length === 0 && /emblema oculto/.test(e.textContent || '') && opac(e) > 0.5).map(rect)
    const dentroAbajo = (e) => Boolean(e.closest('[data-texto-abajo]'))
    const dentroCab = (e) => Boolean(e.closest('[data-pelicula-titulo],[data-pelicula-saltar],[data-rayitas]'))
    const verdad = (e) => { const r = e.getBoundingClientRect(); const x = Math.min(vw - 1, Math.max(0, r.left + r.width / 2)), y = Math.min(vh - 1, Math.max(0, r.top + r.height / 2)); const t = document.elementFromPoint(x, y); return Boolean(t) && (e.contains(t) || t.contains(e) || Boolean(t.closest('[data-texto-abajo],[data-pelicula-titulo],[data-pelicula-saltar]'))) && t !== P }
    const visual = hojas.filter((e) => !dentroAbajo(e) && !dentroCab(e) && verdad(e)).map(rect).filter((r) => r.w > 0 && r.h > 0 && r.b > 0 && r.y < vh)
    const sol = (p, q) => Math.max(0, Math.min(p.r, q.r) - Math.max(p.x, q.x)) * Math.max(0, Math.min(p.b, q.b) - Math.max(p.y, q.y))
    const pisadas = []
    for (const c of cab) for (const v of visual) if (sol(c, v) > 6) pisadas.push(['cabecera', c.t, 'visual', v.t])
    for (const a of abajo) for (const v of visual) if (sol(a, v) > 6) pisadas.push(['texto de abajo', a.t, 'visual', v.t])
    for (let i = 0; i < abajo.length; i++) for (let j = i + 1; j < abajo.length; j++) if (sol(abajo[i], abajo[j]) > 6) pisadas.push(['texto de abajo', abajo[i].t, 'texto de abajo', abajo[j].t])
    for (const a of abajo) for (const t of tToast) if (sol(a, t) > 6) pisadas.push(['texto de abajo', a.t, 'aviso', t.t])
    const fuera = [...cab, ...abajo, ...tToast].filter((r) => r.x < -0.5 || r.r > vw + 0.5 || r.b > vh - 8 || r.y < 0).map((r) => r.t + ' ' + Math.round(r.x) + ',' + Math.round(r.y) + ',' + Math.round(r.r) + ',' + Math.round(r.b))
    const titulo = P.querySelector('[data-pelicula-titulo]'), saltar = P.querySelector('[data-pelicula-saltar]')
    const tin = titulo ? (titulo.querySelector('span') ?? titulo) : null
    const t = tin ? tin.getBoundingClientRect() : null, sa = saltar ? saltar.getBoundingClientRect() : null
    const esc = P.querySelector('[data-escenario]')
    const er = esc ? esc.getBoundingClientRect() : null
    return { vw, vh, pisadas, fuera, titulo: t ? { x: t.left, r: t.right, cy: (t.top + t.bottom) / 2, texto: titulo.innerText } : null, saltar: sa ? { x: sa.left, r: sa.right, cy: (sa.top + sa.bottom) / 2 } : null, esc: er ? { x: er.left, r: er.right } : null, abajoMax: abajo.reduce((m, r) => Math.max(m, r.b), 0), nAbajo: abajo.length }
  })()`
  for (const [w, h] of [[390, 664], [375, 667], [390, 844]]) {
    const a = await conViaje({ ancho: w, alto: h, vista: false, extraAntes: 'window.__pruebaPeliculaEscena = 0;' })
    try {
      await abrirPase(a)
      await cuando(a, "Boolean(document.querySelector('[data-pelicula] .pfr'))", 40)
      await esp(1500)
      const raya = (idx) => a.evaluar(`(() => { const r = document.querySelectorAll('[data-pelicula] [data-raya]')[${idx}]; if (!r) return null; const b = r.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2, b.height] })()`)
      const rayas = await a.evaluar("document.querySelectorAll('[data-pelicula] [data-raya]').length")
      debe(rayas === 7, 'rayitas', `${w}x${h}: hay una rayita por escena (7) (${rayas})`)
      for (const [idx, esc] of [0, 1, 3, 4, 5, 6].map((e, i) => [i, e])) {
        void esc
        void idx
      }
      for (const E of ESCENAS) {
        const idx = [0, 1, 3, 4, 5, 6, 7].indexOf(E.e)
        const c = await raya(idx)
        debe(Boolean(c) && c[2] >= 18, 'rayitas', `${w}x${h}: la rayita de la escena ${E.e} se puede tocar (zona de ${c?.[2]?.toFixed(0)} px de alto)`)
        if (c) await clicEn(a, c[0], c[1])
        await esp(E.s * 1000)
        if (E.ff) {
          await a.evaluar(ff)
          await esp(700)
        }
        const m = await a.evaluar(MIDE)
        const activa = await a.evaluar(`Array.from(document.querySelectorAll('[data-pelicula] [data-raya] > span > span')).map((s) => s.style.width)`)
        debe(activa[idx] !== '0%' && activa.slice(0, idx).every((x) => x === '100%'), 'rayitas', `${w}x${h}: al tocar la rayita ${idx + 1} la película está en esa escena (${activa.join(' ')})`)
        const etq = `${w}x${h} · escena ${E.e} (${E.nombre})`
        debe(m.pisadas.length === 0, 'pisado', `${etq}: ningún texto pisa a otro (${JSON.stringify(m.pisadas.slice(0, 3))})`)
        debe(m.fuera.length === 0, 'cortado', `${etq}: ningún texto fuera de la pantalla ni pegado al borde de abajo (${JSON.stringify(m.fuera.slice(0, 3))})`)
        debe(m.nAbajo > 0, 'texto', `${etq}: se lee el texto de abajo (${m.nAbajo} piezas)`)
        debe(m.titulo && /^Todo lo que incluye tu Pase Roma$/.test(m.titulo.texto.replace(/\s+/g, ' ').trim()), 'titulo', `${etq}: el título dice «Todo lo que incluye tu Pase Roma» (${m.titulo?.texto})`)
        debe(m.titulo && m.saltar && Math.abs(m.titulo.cy - m.saltar.cy) <= 4, 'titulo', `${etq}: el título está en la MISMA línea que [Saltar] (${m.titulo?.cy.toFixed(0)} y ${m.saltar?.cy.toFixed(0)})`)
        debe(m.titulo && m.saltar && m.titulo.r <= m.saltar.x - 4 && Math.abs((m.titulo.x + m.titulo.r) / 2 - m.vw / 2) <= 6, 'titulo', `${etq}: centrado en medio de la pantalla y sin tocar [Saltar] (${m.titulo?.x.toFixed(0)}–${m.titulo?.r.toFixed(0)} · [Saltar] desde ${m.saltar?.x.toFixed(0)})`)
        debe(m.esc && m.esc.x <= 0.5 && m.esc.r >= w - 0.5, 'ancho', `${etq}: el escenario llega de lado a lado (${m.esc?.x.toFixed(1)} → ${m.esc?.r.toFixed(1)} de ${w})`)
        // Frames: el fondo de cada escena llega a los dos bordes (sin la caja estrecha de antes)
        const bordes = await a.evaluar(`(() => { const P = document.querySelector('[data-pelicula]'); const e = Array.from(P.querySelectorAll('[data-columna-escena]')); return e.length })()`)
        void bordes
        if (w === 390 && h === 664) await a.captura(foto(`pelicula_e${E.e}_${E.nombre}_${w}x${h}`))
        else if (w === 375) await a.captura(foto(`pelicula_e${E.e}_${E.nombre}_${w}x${h}`))
      }
    } finally {
      a.cerrar()
    }
  }
  // Escena 4 («Viaja, Juega, Suma y Participa»): también mientras va cambiando (3, 7, 12 y 16 segundos).
  {
    const a = await conViaje({ ancho: 375, alto: 667, vista: false, extraAntes: 'window.__pruebaPeliculaEscena = 0;' })
    try {
      await abrirPase(a)
      await cuando(a, "Boolean(document.querySelector('[data-pelicula] .pfr'))", 40)
      await esp(1500)
      const idx = [0, 1, 3, 4, 5, 6, 7].indexOf(4)
      const c = await a.evaluar(`(() => { const r = document.querySelectorAll('[data-pelicula] [data-raya]')[${idx}]; const b = r.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2] })()`)
      await clicEn(a, c[0], c[1])
      let t0 = Date.now()
      for (const s of [3, 7, 12, 16, 19]) {
        await esp(Math.max(0, s * 1000 - (Date.now() - t0)))
        const m = await a.evaluar(MIDE)
        debe(m.pisadas.length === 0 && m.fuera.length === 0, 'pisado', `375x667 · escena 4 a los ${s} s: nada pisado ni cortado (${JSON.stringify([...m.pisadas.slice(0, 2), ...m.fuera.slice(0, 2)])})`)
        await a.captura(foto(`pelicula_e4_suma_t${String(s).padStart(2, '0')}_375x667`))
      }
    } finally {
      a.cerrar()
    }
  }
  // El pasaporte: sin el rato parado (la escena pasa a la siguiente en cuanto acaba la vuelta al mundo).
  {
    const a = await conViaje({ ancho: 390, alto: 664, vista: false })
    try {
      await abrirPase(a)
      await cuando(a, "Boolean(document.querySelector('[data-pelicula] .pfr'))", 40)
      await esp(1000)
      const c = await a.evaluar(`(() => { const r = document.querySelectorAll('[data-pelicula] [data-raya]')[4]; const b = r.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2] })()`)
      await clicEn(a, c[0], c[1])
      await a.evaluar(`(() => { window.__reg = []; window.__t0 = performance.now(); setInterval(() => { const P = document.querySelector('[data-pelicula]'); if (!P) return; const barras = Array.from(P.querySelectorAll('[data-raya] > span > span')).map((s) => s.style.width); const num = (P.querySelector('.pfr')?.innerText || '').match(/(\\d+)\\s*PAÍSES VISITADOS/i); window.__reg.push([Math.round(performance.now() - window.__t0), barras.join(','), num ? num[1] : '']) }, 200); return true })()`)
      await esp(50000)
      const reg = await a.evaluar('window.__reg')
      let escena6 = null
      for (const [t, barras] of reg) {
        const b = barras.split(',')
        if (escena6 === null && b[4] === '100%' && b[5] !== undefined && b[5] !== '0%') escena6 = t
      }
      // La vuelta al mundo (Pase Globo) acaba en T0 + 24 tramos + 1,3 s; la escena tiene que seguir 1 s después, no 3 ni 7.
      const globo = leer('src/components/pase/pelicula/gen/Pase_Globo.ts')
      const [, T0, LEG, LD] = /const T0=([\d.]+),LEG=([\d.]+),LD=([\d.]+)/.exec(globo)
      const pelicula = leer('src/components/pase/pelicula/gen/Pase_Pelicula.ts')
      const durs = JSON.parse(/const DURS=(\[[^\]]*\])/.exec(pelicula)[1])
      const finTour = Number(T0) + 24 * Number(LEG) + Number(LD)
      const sobra = durs[5] / 1000 - finTour
      debe(sobra >= 0 && sobra <= 1, 'pasaporte', `la escena del pasaporte (${durs[5] / 1000} s) sigue ${sobra.toFixed(1)} s después de que el último país llegue (la vuelta acaba en el segundo ${finTour.toFixed(1)}; antes dejaba 3,2 s y Eric veía unos 7)`)
      debe(escena6 !== null && escena6 / 1000 <= durs[5] / 1000 + 4, 'pasaporte', `en la película en marcha, el pasaporte pasa solo a la escena siguiente a los ${((escena6 ?? 0) / 1000).toFixed(1)} s`)
      fs.writeFileSync(`${process.env.TEMP}/e5_parado_10n5.json`, JSON.stringify({ finTour, durs, escena6, sobra }))
    } finally {
      a.cerrar()
    }
  }
  // La pieza de Design, al lado (la caja pequeña y la película).
  try {
    await capturarDesign('Piezas/Pase Estilo.dc.html', 'docs/dias/capturas_jutrip/10n5_design_pase_estilo_01.jpg', { ancho: 520, alto: 1000, despues: 'window.scrollTo(0, 0); true', espera: 5 })
  } catch (e) {
    console.log('(No se pudo capturar Design:', e.message, ')')
  }
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
