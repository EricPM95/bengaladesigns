// La prueba de la Tanda 10N12, agente C (apartado 4): el botón redondo de la cama, siempre en HOY con el pase.
// V2 (15-nov; antes → ahora → Design «Hoy Entero»): el botón redondo de la cama de ARRIBA (BotonCamaHoy, data-boton-cama-hoy) está BORRADO; ahora es la fila «Volver al alojamiento» de ABAJO (VolverAlAlojamiento, data-alojamiento-hoy: «fila» con dirección y [Cómo llegar], «sin-direccion» con [Añadir] que abre la hoja «Tu alojamiento»). Solo con pase; el día de vuelta no sale.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10N12_c.mjs
// Acaba imprimiendo «N comprobaciones · M fallos». Capturas en docs/dias/capturas_jutrip/10n12_cama_hoy_*.jpg
import fs from 'node:fs'
import { conViaje, esp, foto as foto5, leer, modulo } from './_10n5_comun.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const foto = (n) => foto5(n).replace('10n5_', '10n12_')
const store = modulo('/src/store/useRouteStore.ts')
// V2: la fila «Volver al alojamiento» solo existe en el HOY V2 (interruptor de desarrollo ?hoy2=on); con él apagado, HOY ya no lleva cama (BotonCamaHoy está borrado).
const RUTA_V2 = (version) => `/?cuentas=off&logros=on&logrosDemo=1&version=${version}&apertura=0&hoy2=on`
const DIR = 'Via Cola di Rienzo 45, Roma'
const INICIO = '2026-12-01'

const poner = (a, js) => a.evaluar(`${store}.then((s) => { const e = s.useRouteStore.getState(); ${js}; return true })`)

/** HOY en el día `i` del viaje (0 = llegada). */
const hoyEnDia = async (a, i) => {
  await poner(a, `const n = e.route.days.length; const d = (k) => { const f = new Date('${INICIO}T12:00:00Z'); f.setUTCDate(f.getUTCDate() + k); return f.toISOString().slice(0, 10) }; e.setRouteDateRange({ start: '${INICIO}', end: d(n - 1) }); e.setDevSimulatedTodayIso(d(${i} < 0 ? n - 1 : ${i})); e.setMode('today')`)
  await esp(2500)
}
const cama = (a) => a.evaluar(`(() => { const e = document.querySelector('[data-alojamiento-hoy]'); if (!e) return null; const r = e.getBoundingClientRect(); const v = e.getAttribute('data-alojamiento-hoy'); return { tipo: v === 'fila' ? 'camino' : 'hoja', href: e.querySelector('[data-alojamiento-hoy-como-llegar]')?.getAttribute('href') ?? null, x: r.x, y: r.y, w: r.width, h: r.height, redondo: getComputedStyle(e).borderRadius, ancho: innerWidth, hoy: document.querySelector('[data-hoy]')?.getAttribute('data-hoy') ?? null } })()`)

/* ───────── 1. El código ───────── */
console.log('1. El código')
{
  const c = leer('src/components/route/hoy/v2/VolverAlAlojamiento.tsx')
  debe(/enlaceComoLlegarAlojamiento/.test(c) && /abrirTuAlojamiento/.test(c) && /pagoActivo\(\)/.test(c), 'codigo', 'la fila «Volver al alojamiento» usa el enlace compartido, abre «Tu alojamiento» y solo sale con pase')
  debe(/<VolverAlAlojamiento/.test(leer('src/components/route/hoy/v2/HoyDuranteV2.tsx')), 'codigo', 'HoyDuranteV2 pinta la fila «Volver al alojamiento»')
  debe(!fs.existsSync('src/components/route/hoy/BotonCamaHoy.tsx') && !/BotonCamaHoy/.test(leer('src/components/route/hoy/HoyView.tsx')), 'codigo', 'el botón de la cama de arriba (BotonCamaHoy) ya no existe (V2)')
}

/* ───────── 2. Con el pase ───────── */
console.log('2. Con el pase')
for (const [ancho, alto] of [[390, 844], [375, 667]]) {
  const a = await conViaje({ version: 'pago', ancho, alto, ruta: RUTA_V2('pago') })
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
      if (nombre === 'vuelta') {
        debe(b === null, `sin dirección ${nombre}`, `el día de vuelta no sale la fila «Volver al alojamiento» (${JSON.stringify(b)})`)
        continue
      }
      debe(b && b.hoy === 'during' && b.tipo === 'hoja', `sin dirección ${nombre}`, `HOY ${nombre} con pase y sin dirección: fila «Pon tu alojamiento» con [Añadir] que abre la hoja (${JSON.stringify(b)})`)
      if (b) {
        debe(b.x >= 0 && b.x + b.w <= b.ancho + 1 && b.h >= 44 && b.y > 120, `forma ${nombre}`, `fila a todo lo ancho, dentro de la pantalla y ABAJO, no arriba como la cama de antes (${JSON.stringify(b)})`)
      }
      if (ancho === 390 && k === 1) await a.captura(foto('cama_hoy_1'))
      if (ancho === 375) await a.captura(foto(`cama_hoy_375_${nombre}`))
      if (k === 0 && ancho === 390) {
        await a.evaluar("document.querySelector('[data-alojamiento-hoy-anadir]').click(); true")
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
      if (ancho === 390 && k === 1) await a.captura(foto('cama_hoy_2'))
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
  const a = await conViaje({ version: 'gratis', ancho: 390, alto: 844, ruta: RUTA_V2('gratis') })
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
