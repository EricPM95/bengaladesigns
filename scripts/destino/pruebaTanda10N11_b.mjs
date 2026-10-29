// La prueba de la Tanda 10N11, agente B: «Cómo llegar a tu alojamiento» en DÍAS (dentro del día 1) y en HOY, y la tarjeta del vuelo en DÍAS.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10N11_b.mjs
// Acaba imprimiendo «N comprobaciones · M fallos». Capturas en docs/dias/capturas_jutrip/10n11_alojamiento_dias_*.jpg
import { conViaje, esp, foto as foto5, leer, modulo } from './_10n5_comun.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const foto = (n) => foto5(n).replace('10n5_', '10n11_')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
const store = modulo('/src/store/useRouteStore.ts')
const DIR = 'Via Cola di Rienzo 45, Roma'

const modo = async (a, m, dia = null) => {
  await a.evaluar(`${store}.then((s) => { const e = s.useRouteStore.getState(); e.setActiveDayId(${dia === null ? 'null' : 'e.route.days[' + dia + '].id'}); e.setMode('${m}'); return true })`)
  await a.esp(2500)
}
const poner = (a, js) => a.evaluar(`${store}.then((s) => { const e = s.useRouteStore.getState(); ${js}; return true })`)
const textoDe = (a, sel) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); return e ? e.innerText.split(String.fromCharCode(10)).join(' | ') : null })()`)

/* ───────── 1. El código ───────── */
console.log('1. El código')
{
  const bloque = sinComentarios(leer('src/components/route/dayDetail/AccommodationBlock.tsx'))
  debe(/abrirAvisoPase/.test(bloque) && /CandadoRedondo/.test(bloque), 'candado', '[Ir] sin pase usa abrirPase() y el CandadoRedondo de G')
  debe(!/libre hacia/i.test(sinComentarios(leer('src/components/route/dayDetail/TarjetaLlegadaDias.tsx') + leer('src/lib/arrivalReturn.ts') + leer('shared/arrival/arrivalRules.js'))), 'vuelo', 'ningún «libre hacia» en la tarjeta del vuelo ni en sus textos')
  debe(/Aterrizas/.test(leer('src/components/route/dayDetail/TarjetaLlegadaDias.tsx')) && /Cómo llegar desde/.test(leer('src/components/route/dayDetail/TarjetaLlegadaDias.tsx')), 'vuelo', 'la tarjeta dice «Aterrizas a las…» y «Cómo llegar desde el aeropuerto»')
}

/* ───────── 2. Con el pase ───────── */
console.log('2. Con el pase')
{
  const a = await conViaje({ version: 'completa', ancho: 390, alto: 844 })
  try {
    await modo(a, 'days', 0)
    // 01: sin alojamiento
    let t = await textoDe(a, '[data-alojamiento-dia-bloque]')
    debe(t && /ALOJAMIENTO · /.test(t) && /Añade tu alojamiento/.test(t) && /Añadir/.test(t), '01', `DÍAS día 1 sin alojamiento: «Alojamiento · Roma · Añade tu alojamiento» + [+ Añadir] (${t})`)
    await a.captura(foto('alojamiento_dias_01'))
    // 02: con alojamiento, zona y dirección
    await poner(a, `const id = e.route.days[0].id; e.setAccommodationHotel(id, { name: 'Hotel Aurora', precio: null }); e.setAccommodationAddress(${JSON.stringify(DIR)})`)
    await esp(800)
    const zonaId = await a.evaluar(`${store}.then((s) => { const e = s.useRouteStore.getState(); e.setAccommodationZone('prati'); return e.route.accommodationZone })`)
    await esp(1500)
    t = await textoDe(a, '[data-alojamiento-dia-bloque]')
    debe(t && /Hotel Aurora/.test(t) && /Cola di Rienzo/.test(t) && /\bIr\b/.test(t), '02', `con pase: nombre, dirección y [Ir] (${t}) zona=${zonaId}`)
    debe(/PRATI/i.test(t ?? ''), '02', `con pase y zona elegida, «ALOJAMIENTO · PRATI» (${t})`)
    const ir = await a.evaluar(`(() => { const e = document.querySelector('[data-alojamiento-dia="ir"]'); return e ? { href: e.getAttribute('href'), candado: Boolean(e.parentElement.querySelector('[data-candado-redondo]')) } : null })()`)
    debe(ir && /maps\/dir\/\?api=1&destination=Via\+Cola\+di\+Rienzo/.test(ir.href) && !ir.candado, '02', `[Ir] con pase abre el camino a la dirección, sin candado (${JSON.stringify(ir)})`)
    await a.captura(foto('alojamiento_dias_02'))
    // 03: el vuelo
    await poner(a, `e.setArrivalFlightTime('15:40')`)
    await esp(1500)
    const v = await textoDe(a, '[data-llegada-dias]')
    debe(v && /Aterrizas a las 15:40/.test(v) && /Fiumicino · Cómo llegar desde el aeropuerto/.test(v), '03', `tarjeta del vuelo: «Aterrizas a las 15:40» y «Fiumicino · Cómo llegar desde el aeropuerto» (${v})`)
    const cuerpo = await a.evaluar('document.body.innerText')
    debe(!/libre hacia/i.test(cuerpo), '03', 'DÍAS no enseña «libre hacia…»')
    await a.captura(foto('alojamiento_dias_03'))
    // HOY al empezar y al acabar el día
    await modo(a, 'today')
    const hoy = await a.evaluar(`(() => { const t = Array.from(document.querySelectorAll('[data-alojamiento-hoy],[data-como-llegar-alojamiento]')); return { tarjetas: document.querySelectorAll('[data-alojamiento-hoy]').length, botones: document.querySelectorAll('[data-como-llegar-alojamiento]').length, hoy: document.querySelector('[data-hoy]')?.getAttribute('data-hoy') ?? null } })()`)
    console.log('   HOY (con pase):', JSON.stringify(hoy))
    if (hoy.hoy) {
      debe(hoy.botones >= 1, 'hoy', `HOY con pase lleva [Cómo llegar a tu alojamiento] (${JSON.stringify(hoy)})`)
      await a.captura(foto('alojamiento_hoy_con_pase'))
    } else console.log('   (el viaje de prueba no está en un día de HOY: la comprobación de HOY la cubre pruebaTanda7_hoy en el servidor)')
  } finally {
    a.cerrar()
  }
}

/* ───────── 3. Sin el pase ───────── */
console.log('3. Sin el pase')
{
  const a = await conViaje({ version: 'gratis', ancho: 390, alto: 844 })
  try {
    await modo(a, 'days', 0)
    await poner(a, `const id = e.route.days[0].id; e.setAccommodationHotel(id, { name: 'Hotel Aurora', precio: null }); e.setAccommodationAddress(${JSON.stringify(DIR)}); e.setAccommodationZone('prati')`)
    await esp(1500)
    const t = await textoDe(a, '[data-alojamiento-dia-bloque]')
    debe(t && /ALOJAMIENTO · ROMA/.test(t) && /Hotel Aurora/.test(t) && !/Prati|Cola di Rienzo/i.test(t) && /\bIr\b/.test(t), '02b', `sin pase: «Alojamiento · Roma», el nombre, sin zona ni dirección, y [Ir] (${t})`)
    const c = await a.evaluar(`(() => { const e = document.querySelector('[data-alojamiento-dia="ir-candado"]'); return e ? { candado: Boolean(e.parentElement.querySelector('[data-candado-redondo]')) } : null })()`)
    debe(c && c.candado, '02b', `[Ir] sin pase lleva el candado dorado sobre azul (${JSON.stringify(c)})`)
    await a.captura(foto('alojamiento_dias_02b'))
    await a.evaluar(`(() => { window.__pase = 0; window.addEventListener('trazo:pagar', () => { window.__pase++ }); document.querySelector('[data-alojamiento-dia="ir-candado"]').click(); return true })()`)
    await esp(800)
    debe(await a.evaluar("Boolean(document.querySelector('[data-aviso-pase=\"alojamiento\"]'))"), '02b', '(10N12) [Ir] sin pase abre el aviso pequeño')
    await a.evaluar("document.querySelector('[data-aviso-pase-ver]')?.click()")
    await esp(800)
    const abierto = await a.evaluar('window.__pase')
    debe(abierto >= 1, '02b', `al tocar [Ir] sin pase se abre el aviso del pase (${abierto})`)
    const hay = await a.evaluar("Boolean(document.querySelector('[data-candado=\"alojamiento-zona\"]'))")
    debe(!hay, '02b', 'DÍAS ya no lleva la caja vieja «¿En qué zona te alojas?»')
    await modo(a, 'today')
    const botones = await a.evaluar("document.querySelectorAll('[data-alojamiento-hoy],[data-como-llegar-alojamiento]').length")
    debe(botones === 0, 'hoy', `HOY sin pase no enseña [Cómo llegar a tu alojamiento] (${botones})`)
  } finally {
    a.cerrar()
  }
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
