// La prueba de la Tanda 10S (agente C): los tres retoques de la 10N12 y el peso de la descarga.
//   · el texto del aviso de Logros;
//   · el botón de la cama en HOY: con pase sale, en el día de prueba sin sale NO;
//   · la ✕ de la lista del pase no pisa ningún texto al bajar (por geometría), a 390x844 y 375x667;
//   · la descarga al abrir, por debajo de 340 KB comprimidos (con un dist recién construido: se construye en una carpeta temporal;
//     con PESO_DIST=<carpeta> se mide esa en vez de construir).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S.mjs
// Acaba imprimiendo «N comprobaciones · M fallos». Capturas en docs/dias/capturas_jutrip/10s_*.jpg
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { conViaje as conViajeComun, modulo, cuando as cuandoComun, esp as espComun } from './_10n5_comun.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const BASE = process.env.APP_URL || 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const leer = (f) => fs.readFileSync(f, 'utf8')
const foto = (n) => path.join(SALIDA, `10s_${n}.jpg`)
const TOPE_KB = 340

const store = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState())"

async function cerrarAvisos(a) {
  for (let i = 0; i < 4; i++) {
    const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Siguiente|Genial|Ya lo sé)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await a.esp(600)
  }
}

async function conViaje(pase, ancho = 390, alto = 844, ruta = '/?cuentas=off&logros=on&logrosDemo=1&version=gratis&apertura=0') {
  const antes = `try{localStorage.setItem('trazo:moneda-pase','EUR')}catch(x){}; window.__pruebaDelPase = ${JSON.stringify(pase)}`
  const a = await abrirApp(BASE, { ruta, antes, ancho, alto })
  for (let i = 0; i < 120 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 60 && !(await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
  await a.esp(3500)
  await cerrarAvisos(a)
  return a
}

const SIN = { cobro: true, conPase: false, puede: true, pruebaGastada: false }
const CON = { cobro: true, conPase: true, puede: true, pruebaGastada: false }
const camaEn = (a) => a.evaluar("(() => { const e = document.querySelector('[data-boton-cama-hoy]'); return e ? e.getAttribute('data-boton-cama-hoy') : null })()")
const hoyEn = async (a, pase, iso, rango) => {
  await a.evaluar(`window.__pruebaDelPase = ${JSON.stringify(pase)}; true`)
  await a.evaluar(`${store}.then((s) => { ${rango ? `s.setRouteDateRange(${JSON.stringify(rango)});` : ''} s.setDevSimulatedTodayIso(${JSON.stringify(iso)}); s.setMode('today'); return true })`)
  await a.esp(2500)
  await cerrarAvisos(a)
}

/* ───────── 1. El aviso de Logros ───────── */
console.log('1. El aviso de Logros')
{
  const t = leer('src/lib/avisoPaseTextos.ts')
  const m = t.match(/logros:\s*\{[^}]*linea2:\s*'([^']*)'/)
  const linea = (m?.[1] ?? '').replace('{pase}', 'Pase Roma')
  debe(linea === 'Con el Pase Roma, consigues el sello de cada sitio que visitas, las colecciones y los emblemas secretos.', 'aviso', `el aviso de Logros dice lo pedido (${linea})`)
  debe(!/suma a tus logros del viaje/.test(t), 'aviso', 'el texto viejo de Logros ya no está')
}

/* ───────── 2. La cama en HOY ───────── */
console.log('2. La cama en HOY')
{
  const c = leer('src/components/route/hoy/HoyView.tsx')
  debe(/conCama\s*=\s*estado\?\.phase === 'during' && !diaDePrueba/.test(c), 'codigo', 'HoyView no pinta la cama en el día de prueba')
  const a = await conViaje(CON, 390, 844, '/?cuentas=off&logros=on&logrosDemo=1&version=completa&apertura=0')
  try {
    await hoyEn(a, CON, '2026-10-18', { start: '2026-10-17', end: '2026-10-20' })
    debe((await camaEn(a)) !== null, 'con pase', 'con pase, en un día del viaje, la cama sale')
  } finally {
    a.cerrar()
  }
  const b = await conViaje({ ...SIN, prueba: { estado: 'pendiente', fecha: '2026-10-18', tripId: null } })
  try {
    // Día 17: durante el viaje y SIN ser el día de prueba (es el 18): HOY sin pase completo, sin cama.
    await hoyEn(b, { ...SIN, prueba: { estado: 'pendiente', fecha: '2026-10-18', tripId: null } }, '2026-10-18', { start: '2026-10-17', end: '2026-10-20' })
    const diaPrueba = await b.evaluar("Boolean(document.querySelector('[data-hoy-con-cama], [data-hoy]:not([data-hoy=\"sin-pase\"])'))")
    debe(diaPrueba, 'dia de prueba', 'el día de prueba HOY sale entero (no el HOY sin pase)')
    debe((await camaEn(b)) === null, 'dia de prueba', 'en el día de prueba sin pase la cama NO sale')
    await b.captura(foto('cama_dia_de_prueba'))
    await hoyEn(b, { ...SIN, prueba: { estado: 'pendiente', fecha: '2026-10-18', tripId: null } }, '2026-10-10')
    debe((await camaEn(b)) === null, 'sin pase', 'sin pase y fuera del día de prueba la cama tampoco sale')
  } finally {
    b.cerrar()
  }
}

/* ───────── 3. La ✕ de la lista del pase ───────── */
console.log('3. La ✕ de la lista del pase no pisa nada')
const medirX = (a) =>
  a.evaluar(`(() => {
    const cont = document.querySelector('[data-lista-pase]')
    const x = document.querySelector('[data-lista-del-pase] [data-pelicula-cerrar]')
    if (!cont || !x) return null
    const rx = x.getBoundingClientRect()
    const rc = cont.getBoundingClientRect()
    let pisados = 0
    let ejemplo = ''
    const w = document.createTreeWalker(cont, NodeFilter.SHOW_TEXT)
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (!n.textContent.trim()) continue
      const r = document.createRange()
      r.selectNodeContents(n)
      for (const q of r.getClientRects()) {
        // lo que se ve de ese texto: recortado a la zona de scroll
        const t = Math.max(q.top, rc.top), b = Math.min(q.bottom, rc.bottom)
        if (b - t <= 0.5) continue
        const ix = Math.min(q.right, rx.right) - Math.max(q.left, rx.left)
        const iy = Math.min(b, rx.bottom) - Math.max(t, rx.top)
        if (ix > 0.5 && iy > 0.5) { pisados++; ejemplo = n.textContent.trim().slice(0, 40) }
      }
    }
    const centro = document.elementFromPoint(rx.left + rx.width / 2, rx.top + rx.height / 2)
    return { pisados, ejemplo, xb: rx.bottom, ct: rc.top, xEncima: Boolean(centro && (centro === x || x.contains(centro))), max: cont.scrollHeight - cont.clientHeight }
  })()`)
for (const [w, h] of [[390, 844], [375, 667]]) {
  const a = await conViaje(SIN, w, h)
  try {
    await a.evaluar("window.dispatchEvent(new CustomEvent('trazo:pagar')); true")
    for (let i = 0; i < 30 && !(await a.evaluar("Boolean(document.querySelector('[data-lista-del-pase] [data-lista-pase]')) && /Todo lo que incluye/.test(document.querySelector('[data-lista-del-pase]').innerText)")); i++) await a.esp(500)
    await a.esp(600)
    for (const frac of [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1]) {
      await a.evaluar(`(() => { const l = document.querySelector('[data-lista-pase]'); l.scrollTop = ${frac} * (l.scrollHeight - l.clientHeight); return true })()`)
      await a.esp(200)
      const m = await medirX(a)
      debe(m !== null, 'x', `${w}x${h} (${frac}): la ✕ y la lista existen`)
      if (!m) continue
      debe(m.pisados === 0, 'x', `${w}x${h} al bajar ${Math.round(frac * 100)} %: ningún texto de la lista queda bajo la ✕ (pisados ${m.pisados} ${m.ejemplo})`)
      debe(m.xEncima, 'x', `${w}x${h} al bajar ${Math.round(frac * 100)} %: la ✕ sigue encima y se puede tocar`)
      debe(m.ct >= m.xb - 0.5, 'x', `${w}x${h}: la zona que se desplaza empieza debajo de la ✕ (${Math.round(m.ct)} frente a ${Math.round(m.xb)})`)
      if (w === 390 && (frac === 0.55 || frac === 1)) await a.captura(foto(frac === 1 ? 'lista_x_final' : 'lista_x_medio'))
      if (w === 375 && frac === 1) await a.captura(foto('lista_x_375_final'))
    }
    // El botón fijo y su degradado se quedan.
    const fijo = await a.evaluar("(() => { const f = document.querySelector('[data-elegir-pase-fijo]'); return f ? { pos: getComputedStyle(f).position, fondo: getComputedStyle(f).backgroundImage } : null })()")
    debe(fijo && fijo.pos === 'absolute' && /linear-gradient/.test(fijo.fondo), 'boton', `${w}x${h}: [Elegir mi pase] fijo con su degradado`)
  } finally {
    a.cerrar()
  }
}

/* ───────── 4. La línea de fechas de la tarjeta de Mis viajes ───────── */
console.log('4. La línea de fechas de la tarjeta de Mis viajes, sin «N días»')
{
  const t = leer('src/components/logros/pantallas/perfil/TarjetaDeViaje.tsx')
  debe(!/fechasYDias/.test(t), 'codigo', 'la tarjeta ya no compone «fechas · N días»')
  const b = await conViajeComun({ ancho: 390, alto: 844, version: 'pago', ruta: '/?cuentas=off&logros=off&version=pago&apertura=0' })
  try {
    await b.evaluar(`${modulo('/src/store/usePerfilUi.ts')}.then((m) => { m.usePerfilUi.getState().abrir(); return true })`)
    await cuandoComun(b, "Boolean(document.querySelector('[data-fila-de-viajes]'))", 60)
    await espComun(1200)
    const r = await b.evaluar("Array.from(document.querySelectorAll('[data-tarjeta-de-viaje]')).map((c) => ({ fechas: c.querySelector('[data-fechas-del-viaje]')?.innerText.trim(), chips: Array.from(c.querySelectorAll('[data-chip-del-viaje]')).map((x) => x.innerText.trim()), etiqueta: c.querySelector('[data-etiqueta-texto]')?.innerText.trim() }))")
    debe(r.length >= 1, 'tarjeta', 'hay una tarjeta en Mis viajes')
    for (const c of r) {
      debe(Boolean(c.fechas) && !/\d+ días?/.test(c.fechas), 'tarjeta', `la línea de fechas de la tarjeta lleva solo las fechas, sin «N días» (${c.fechas})`)
      if (!/Hecho/.test(c.etiqueta ?? '')) debe(c.chips.some((x) => /^\d+ días?$/.test(x)), 'tarjeta', 'los chips de debajo siguen diciendo «N días»')
    }
    await b.captura(foto('mis_viajes_fechas'))
  } finally {
    b.cerrar()
  }
}

/* ───────── 4b. Zonas de toque de 44 × 44 (Ajustes y la cama de HOY) ───────── */
console.log('4b. Zona de toque de 44 × 44 sin cambiar lo que se ve (Ajustes y la cama de HOY)')
{
  const { medirZonaToque } = await import('./_zonaToque.mjs')
  const b = await conViajeComun({ ancho: 390, alto: 844, version: 'pago', ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
  const juzga = (m, nombre) => {
    debe(m !== null, 'toque', `${nombre}: existe`)
    if (!m) return
    debe(Math.abs(m.w - 40) < 0.6 && Math.abs(m.h - 40) < 0.6, 'toque', `${nombre}: a la vista sigue de 40 × 40 (${m.w} × ${m.h})`)
    debe(m.zona44, 'toque', `${nombre}: las 4 esquinas y el centro del cuadrado de 44 × 44 son el botón (${JSON.stringify(m.esquinas)} centro ${m.centro})`)
    debe(m.fuera.every(Boolean), 'toque', `${nombre}: 1 px fuera de la zona de 44 × 44 ya no es el botón (${JSON.stringify(m.fuera)})`)
  }
  try {
    await b.evaluar(`${modulo('/src/store/useRouteStore.ts')}.then((m) => { const e = m.useRouteStore.getState(); const n = e.route.days.length; const d = (k) => { const f = new Date('2026-12-01T12:00:00Z'); f.setUTCDate(f.getUTCDate() + k); return f.toISOString().slice(0, 10) }; e.setRouteDateRange({ start: '2026-12-01', end: d(n - 1) }); e.setDevSimulatedTodayIso(d(1)); e.setMode('today'); return true })`)
    await espComun(3000)
    juzga(await b.evaluar(medirZonaToque('[data-boton-cama-hoy]')), 'la cama de HOY')
    await b.evaluar(`${modulo('/src/store/useRouteStore.ts')}.then((m) => { m.useRouteStore.getState().setMode('route'); return true })`)
    await b.evaluar(`${modulo('/src/store/usePerfilUi.ts')}.then((m) => { m.usePerfilUi.getState().abrir(); return true })`)
    await cuandoComun(b, "Boolean(document.querySelector('[data-ajustes]'))", 60)
    await espComun(1200)
    juzga(await b.evaluar(medirZonaToque('[data-ajustes]')), 'Ajustes del Perfil')
  } finally {
    b.cerrar()
  }
}

/* ───────── 5. El peso de la descarga ───────── */
console.log('5. El peso de la descarga')
{
  try {
    const { distFresco } = await import('./_distFresco.mjs')
    const { pesoAlAbrir } = await import('./_pesoAlAbrir.mjs')
    const dir = process.env.PESO_DIST || distFresco()
    const p = pesoAlAbrir(dir)
    const kb = p.gz / 1024
    console.log(`   al abrir: ${kb.toFixed(1)} KB comprimidos en ${p.filas.length} archivos (tope ${TOPE_KB} KB)`)
    debe(kb < TOPE_KB, 'peso', `la descarga al abrir pesa ${kb.toFixed(1)} KB, menos de ${TOPE_KB} KB`)
  } catch (e) {
    debe(false, 'peso', `no se ha podido medir el peso (${e.message})`)
  }
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
