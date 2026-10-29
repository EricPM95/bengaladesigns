// La prueba de la Tanda 10N12, agente C (apartado 4): el botón redondo de la cama, siempre en HOY con el pase.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10N12_c.mjs
// Acaba imprimiendo «N comprobaciones · M fallos». Capturas en docs/dias/capturas_jutrip/10n12_cama_hoy_*.jpg
import { conViaje, esp, foto as foto5, leer, modulo } from './_10n5_comun.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const foto = (n) => foto5(n).replace('10n5_', '10n12_')
const store = modulo('/src/store/useRouteStore.ts')
const DIR = 'Via Cola di Rienzo 45, Roma'
const INICIO = '2026-12-01'

const poner = (a, js) => a.evaluar(`${store}.then((s) => { const e = s.useRouteStore.getState(); ${js}; return true })`)

/** HOY en el día `i` del viaje (0 = llegada). */
const hoyEnDia = async (a, i) => {
  await poner(a, `const n = e.route.days.length; const d = (k) => { const f = new Date('${INICIO}T12:00:00Z'); f.setUTCDate(f.getUTCDate() + k); return f.toISOString().slice(0, 10) }; e.setRouteDateRange({ start: '${INICIO}', end: d(n - 1) }); e.setDevSimulatedTodayIso(d(${i} < 0 ? n - 1 : ${i})); e.setMode('today')`)
  await esp(2500)
}
const cama = (a) => a.evaluar(`(() => { const e = document.querySelector('[data-boton-cama-hoy]'); if (!e) return null; const r = e.getBoundingClientRect(); return { tipo: e.getAttribute('data-boton-cama-hoy'), href: e.getAttribute('href'), x: r.x, y: r.y, w: r.width, h: r.height, redondo: getComputedStyle(e).borderRadius, ancho: innerWidth, hoy: document.querySelector('[data-hoy]')?.getAttribute('data-hoy') ?? null } })()`)

/* ───────── 1. El código ───────── */
console.log('1. El código')
{
  const c = leer('src/components/route/hoy/BotonCamaHoy.tsx')
  debe(/enlaceComoLlegarAlojamiento/.test(c) && /abrirTuAlojamiento/.test(c) && /pagoActivo\(\)/.test(c), 'codigo', 'la cama usa el enlace compartido, abre «Tu alojamiento» y solo sale con pase')
  debe(/BotonCamaHoy/.test(leer('src/components/route/hoy/HoyView.tsx')), 'codigo', 'HoyView pinta el botón de la cama')
}

/* ───────── 2. Con el pase ───────── */
console.log('2. Con el pase')
for (const [ancho, alto] of [[390, 844], [375, 667]]) {
  const a = await conViaje({ version: 'pago', ancho, alto })
  try {
    const n = await a.evaluar(`${store}.then((s) => s.useRouteStore.getState().route.days.length)`)
    console.log(`   viaje de ${n} días, ${ancho}x${alto}`)
    const dias = [0, Math.max(1, Math.floor(n / 2)), -1]
    for (const [k, i] of dias.entries()) {
      const nombre = ['llegada', 'medio', 'vuelta'][k]
      // sin dirección: abre la hoja «Tu alojamiento»
      await poner(a, `e.setAccommodationAddress('')`)
      await hoyEnDia(a, i)
      let b = await cama(a)
      debe(b && b.hoy === 'during' && b.tipo === 'hoja', `sin dirección ${nombre}`, `HOY ${nombre} con pase y sin dirección: botón que abre la hoja (${JSON.stringify(b)})`)
      if (b) {
        debe(Math.abs(b.w - b.h) < 1 && b.w <= 44 && b.x + b.w <= b.ancho && b.y >= 0, `forma ${nombre}`, `redondo, pequeño y dentro de la pantalla (${JSON.stringify(b)})`)
        debe(b.x > b.ancho / 2 && b.y < 80, `sitio ${nombre}`, `arriba a la derecha (${JSON.stringify(b)})`)
      }
      if (ancho === 390 && k === 1) await a.captura(foto('cama_hoy_1'))
      if (ancho === 375) await a.captura(foto(`cama_hoy_375_${nombre}`))
      if (k === 0 && ancho === 390) {
        await a.evaluar("document.querySelector('[data-boton-cama-hoy]').click(); true")
        await esp(1200)
        const hoja = await a.evaluar("Boolean(document.querySelector('[data-guardar-alojamiento]')) && /Tu alojamiento/.test(document.body.innerText)")
        debe(hoja, 'hoja', 'sin dirección, al tocar la cama se abre la hoja «Tu alojamiento»')
        await a.captura(foto('cama_hoy_hoja'))
        await a.evaluar(`${modulo('/src/store/useAlojamientoUi.ts')}.then((m) => { m.useAlojamientoUi.getState().cerrarHoja(); return true })`)
        await esp(500)
      }
      // con dirección: el camino
      await poner(a, `e.setAccommodationAddress(${JSON.stringify(DIR)})`)
      await esp(1200)
      b = await cama(a)
      debe(b && b.tipo === 'camino' && /maps\/dir\/\?api=1&destination=Via\+Cola\+di\+Rienzo/.test(b.href ?? ''), `con dirección ${nombre}`, `HOY ${nombre} con dirección: enlace de Google Maps (${JSON.stringify(b)})`)
      if (ancho === 390 && k === 2) await a.captura(foto('cama_hoy_2'))
    }
    // el día de vuelta, al empezar, no sale la tarjeta [Cómo llegar a tu alojamiento] (solo el botón)
    const tarjetasVuelta = await a.evaluar("document.querySelectorAll('[data-alojamiento-hoy]').length")
    console.log('   tarjetas de alojamiento el día de vuelta:', tarjetasVuelta)
  } finally {
    a.cerrar()
  }
}

/* ───────── 3. Sin el pase ───────── */
console.log('3. Sin el pase')
{
  const a = await conViaje({ version: 'gratis', ancho: 390, alto: 844 })
  try {
    await poner(a, `e.setAccommodationAddress(${JSON.stringify(DIR)})`)
    await hoyEnDia(a, 0)
    const b = await cama(a)
    debe(b === null, 'sin pase', `HOY sin pase no enseña la cama (${JSON.stringify(b)})`)
  } finally {
    a.cerrar()
  }
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
