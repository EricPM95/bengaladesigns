// Tanda 10S6 (agente O): apartado 2, elegir una hora siempre igual. POR DECISIÓN DE ERIC (31-oct) SOLO en la hoja del vuelo (ida y vuelta; el tren, el autobús y el barco usan la misma hoja).
//   1 · el código: `HojaDeHora`/`CampoDeHora` (desde abajo, en un portal, ✓ y papelera, tocar fuera guarda); la hoja del vuelo no pinta ninguna rueda propia ni las frases viejas; las demás ruedas
//       de la app (entradas, Free Tour, excursiones, TimeField) NO se han tocado (siguen con `TimeListWheel`/`TimeField`).
//   2 · en la app, la hoja del vuelo: la rueda sale desde abajo, en su propia hoja, con ✓ y papelera, sin «Toca fuera para cerrar» ni «Quitar la hora» escritos; tocar fuera guarda la hora elegida
//       (ida y vuelta); el ✓ guarda; la papelera deja «Sale a las» vacía con la hora de ejemplo en gris y el reloj, sin raya; vacía y sin mover la rueda, tocar fuera la deja vacía.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S6_O.mjs
// Imprime «N comprobaciones, M fallos» y sale con 1 si falla.
import fs from 'node:fs'
import path from 'node:path'
import { conViaje, esp, leer as leerArchivo, modulo } from './_10n5_comun.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) {
    fallos.push({ regla, texto })
    console.log(`  ✗ [${regla}] ${texto}`)
  }
}
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const foto = (n) => path.join(SALIDA, `10s6_rueda_hora_${n}.jpg`)
const store = modulo('/src/store/useRouteStore.ts')
const poner = (a, js) => a.evaluar(`${store}.then((s) => { const e = s.useRouteStore.getState(); ${js}; return true })`)
const clic = (a, sel) => a.evaluar(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)

console.log('1. El código')
{
  const hoja = sinComentarios(leerArchivo('src/components/ui/HojaDeHora.tsx'))
  debe(/createPortal/.test(hoja) && /items-end/.test(hoja) && /data-hoja-de-hora-guardar/.test(hoja) && /data-hoja-de-hora-quitar/.test(hoja), 'o1', 'HojaDeHora sube desde abajo, en un portal, con ✓ y papelera')
  debe(/onClick=\{guardar\} data-hoja-de-hora-fondo/.test(hoja), 'o1', 'tocar el fondo GUARDA (no cierra sin más)')
  debe(!/Toca fuera para cerrar/.test(hoja) && !/>\s*Quitar la hora\s*</.test(hoja), 'o1', 'sin las frases viejas «Toca fuera para cerrar» ni «Quitar la hora» escritas')
  const vuelo = sinComentarios(leerArchivo('src/components/route/reservas/HojaDelVuelo.tsx'))
  debe(/<CampoDeHora/.test(vuelo) && !/<RuedaDeHora/.test(vuelo) && !/Toca fuera para cerrar|data-mi-vuelo-otra-hora-quitar/.test(vuelo), 'o1', 'la hoja del vuelo usa CampoDeHora y ya no pinta su rueda ni las frases viejas')
  // Lo demás, tal como estaba (decisión de Eric: solo el vuelo por ahora).
  const add = sinComentarios(leerArchivo('src/components/route/reservas/AddReservationSheet.tsx'))
  debe(/<TimeListWheel/.test(add) && /<TimeField/.test(add) && !/CampoDeHora|HojaDeHora/.test(add), 'o1', 'las entradas, el Free Tour y las excursiones NO se han tocado (siguen con su rueda)')
  const tf = sinComentarios(leerArchivo('src/components/ui/TimeField.tsx'))
  debe(/PickerSheet/.test(tf) && !/HojaDeHora/.test(tf), 'o1', 'TimeField sigue como estaba')
}

console.log('2. La hoja del vuelo en la app')
let a = null
try {
  a = await conViaje({ version: 'gratis', ancho: 390, alto: 844 })
  await poner(a, `s.useRouteStore.setState((st) => ({ route: { ...st.route, origin: 'Londres', originPlace: undefined, arrivalFlightTime: null, departureFlightTime: null, arrivalPointId: null, departurePointId: null, arrivalOtroPunto: null, arrivalOtraHora: null, departureOtroPunto: null, departureOtraHora: null } }))`)
  await poner(a, `e.setMode('bookings')`)
  await esp(2200)
  const abre = await clic(a, '[data-blk="llegada"] [class*="cursor-pointer"]')
  await esp(1500)
  debe(abre, 'o2', 'se abre la hoja del vuelo desde RESERVAS')

  const campo = (clave) => a.evaluar(`(() => { const c = document.querySelector('[role=dialog] [data-campo-de-hora="${clave}"]'); if (!c) return null; const t = c.querySelector('[data-campo-de-hora-texto]'); return { vacia: c.getAttribute('data-vacia'), texto: t?.textContent.trim(), color: getComputedStyle(t).color, reloj: Boolean(c.querySelector('svg')) } })()`)
  const hoja = () => a.evaluar(`(() => { const h = document.querySelector('[data-hoja-de-hora]'); if (!h) return null; const r = h.querySelector('.trazo-notice-panel').getBoundingClientRect(); return { abajo: Math.abs(r.bottom - innerHeight) < 2, guardar: Boolean(h.querySelector('[data-hoja-de-hora-guardar]')), quitar: Boolean(h.querySelector('[data-hoja-de-hora-quitar]')), texto: h.innerText.replace(/\\s+/g, ' '), propia: !h.closest('[data-mi-vuelo-lados]'), columnas: h.querySelectorAll('[data-rueda-columna]').length } })()`)
  const rueda = (columna, texto) => a.evaluar(`(() => { const o = Array.from(document.querySelectorAll('[data-hoja-de-hora] [data-rueda-columna="${columna}"] [role="option"]')).find((x) => x.textContent.trim() === ${JSON.stringify(texto)}); o?.click(); return Boolean(o) })()`)
  const abrir = async (clave) => {
    await clic(a, `[role=dialog] [data-campo-de-hora="${clave}"]`)
    await esp(800)
  }
  const sinRuedaDentro = () => a.evaluar(`(() => { const d = document.querySelector('[role=dialog]'); return d.querySelectorAll('[data-rueda-columna]').length === 0 && !/Toca fuera para cerrar|Quitar la hora/.test(d.innerText) })()`)

  for (const lado of ['ida', 'vuelta']) {
    console.log(`   (${lado})`)
    if (lado === 'vuelta') {
      await clic(a, '[data-mi-vuelo-lado="vuelta"]')
      await esp(700)
    }
    debe(await sinRuedaDentro(), `o2 ${lado} sin rueda dentro`, 'ninguna rueda dentro de la hoja del vuelo ni las frases viejas')
    let c = await campo('otra')
    debe(c != null, `o2 ${lado} casilla`, 'la hora del otro lado es una casilla')
    // Vacía: ejemplo en gris, con el reloj y sin raya.
    if (c && c.vacia === '0') {
      await abrir('otra')
      await clic(a, '[data-hoja-de-hora-quitar]')
      await esp(500)
      c = await campo('otra')
    }
    debe(c && c.vacia === '1' && /^\d{2}:\d{2}$/.test(c.texto) && !/[—–-]/.test(c.texto) && c.reloj, `o2 ${lado} vacía`, `vacía: hora de ejemplo, sin raya, con reloj (${JSON.stringify(c)})`)
    debe(c && /rgba?\(28, 34, 48, 0?\.[2-4]/.test(c.color), `o2 ${lado} gris`, `el ejemplo va en gris (${c?.color})`)
    await a.captura(foto(`1_${lado}_vacia`))

    // Se abre desde abajo, en su propia hoja, con ✓ y papelera.
    await abrir('otra')
    let h = await hoja()
    debe(h && h.abajo && h.propia && h.columnas === 2, `o2 ${lado} abajo`, `la rueda sale desde abajo, en su propia hoja, de dos columnas (${JSON.stringify(h && { abajo: h.abajo, propia: h.propia, columnas: h.columnas })})`)
    debe(h && h.guardar && h.quitar, `o2 ${lado} ✓ y papelera`, '✓ y papelera arriba a la derecha')
    debe(h && !/Toca fuera para cerrar|Quitar la hora/.test(h.texto), `o2 ${lado} sin frases`, `sin «Toca fuera…» ni «Quitar la hora» escritos (${h?.texto})`)
    await a.captura(foto(`2_${lado}_rueda`))

    // Tocar fuera guarda
    await rueda('Horas', '08')
    await esp(300)
    await rueda('Minutos', '30')
    await esp(700)
    await clic(a, '[data-hoja-de-hora-fondo]')
    await esp(700)
    c = await campo('otra')
    debe((await hoja()) === null && c && c.vacia === '0' && c.texto === '08:30', `o2 ${lado} fuera guarda`, `tocar fuera guarda la hora elegida y cierra (${c?.texto})`)

    // El ✓ guarda
    await abrir('otra')
    await rueda('Horas', '09')
    await esp(300)
    await clic(a, '[data-hoja-de-hora-guardar]')
    await esp(700)
    c = await campo('otra')
    debe((await hoja()) === null && c && /^09:/.test(c.texto), `o2 ${lado} ✓`, `el ✓ guarda y cierra (${c?.texto})`)
    const enRuta = await a.evaluar(`${store}.then((s) => { const r = s.useRouteStore.getState().route; return ${lado === 'ida' ? 'r.arrivalOtraHora' : 'r.departureOtraHora'} ?? null })`)
    debe(typeof enRuta === 'string' && /^09:/.test(enRuta) || enRuta === null, `o2 ${lado} guardada`, `la hora se queda (${enRuta}); si la hoja aún no la lleva a la ruta, se guarda al pulsar [Guardar el vuelo]`)

    // La papelera la quita
    await abrir('otra')
    await clic(a, '[data-hoja-de-hora-quitar]')
    await esp(600)
    c = await campo('otra')
    debe(c && c.vacia === '1' && !/[—–-]/.test(c.texto), `o2 ${lado} papelera`, `la papelera deja la casilla vacía, con ejemplo y sin raya (${c?.texto})`)

    // Vacía y sin tocar la rueda: tocar fuera la deja vacía
    await abrir('otra')
    await clic(a, '[data-hoja-de-hora-fondo]')
    await esp(600)
    c = await campo('otra')
    debe(c && c.vacia === '1', `o2 ${lado} sin inventar`, 'vacía y sin tocar la rueda, tocar fuera la deja vacía')

    // La hora obligatoria (Roma): misma hoja, tocar fuera guarda
    await abrir('roma')
    h = await hoja()
    debe(h && h.abajo && h.guardar, `o2 ${lado} roma abajo`, 'la hora de Roma usa la misma hoja desde abajo')
    await rueda('Horas', '11')
    await esp(300)
    await rueda('Minutos', '15')
    await esp(700)
    await clic(a, '[data-hoja-de-hora-fondo]')
    await esp(700)
    c = await campo('roma')
    debe(c && c.texto === '11:15', `o2 ${lado} roma fuera`, `tocar fuera guarda también la hora de Roma (${c?.texto})`)
    await a.captura(foto(`3_${lado}_guardada`))
  }
} catch (e) {
  debe(false, 'o2', `la prueba en la app no pudo acabar: ${e && e.message}`)
} finally {
  if (a) a.cerrar()
}

console.log(`${comprobaciones} comprobaciones, ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
