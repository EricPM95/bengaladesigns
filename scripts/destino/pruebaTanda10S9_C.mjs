// Tanda 10S9 (agente C): apartado 2 (hoja del vuelo: pestañas siempre «Ida» y «Vuelta», horas de ejemplo en gris que no cuentan, el ✓ guarda la hora que se ve aunque no se mueva)
// y apartado 5 (todas las ruedas de la hora iguales: «Datos de la reserva» del alojamiento con 15:00 y 11:00 en gris, «Datos de la excursión», TimeField).
//   1 · el código (sin navegador).
//   2 · la hoja del vuelo en la app (390 px).
//   3 · «Datos de la reserva» del alojamiento (con pase).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S9_C.mjs
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
const foto = (n) => path.join(SALIDA, `10s9_horas_${n}.jpg`)
const store = modulo('/src/store/useRouteStore.ts')
const poner = (a, js) => a.evaluar(`${store}.then((s) => { const e = s.useRouteStore.getState(); ${js}; return true })`)
const clic = (a, sel) => a.evaluar(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)

console.log('1. El código')
{
  const hoja = sinComentarios(leerArchivo('src/components/ui/HojaDeHora.tsx'))
  debe(/guardar\(true\)\} aria-label="Guardar la hora"/.test(hoja) && /if \(conTick \|\| valida \|\| tocada\.current\)/.test(hoja), 'c1', 'el ✓ guarda siempre la hora que se ve, se haya movido o no')
  const vuelo = sinComentarios(leerArchivo('src/components/route/reservas/HojaDelVuelo.tsx'))
  debe(!/data-mi-vuelo-resumen/.test(vuelo) && !/resumen\(k\)/.test(vuelo) && /\{k === 'ida' \? 'Ida' : 'Vuelta'\}/.test(vuelo), 'c2', 'las pestañas del vuelo dicen siempre «Ida» y «Vuelta» (sin resumen con día y hora)')
  debe(!/\?\? HORA_DE_SERIE/.test(vuelo) && /faltaHora/.test(vuelo) && /data-vuelo-falta-hora/.test(vuelo), 'c3', 'la hora de ejemplo ya no se guarda como si fuera elegida: sin hora elegida, [Guardar] se frena')
  const aloj = sinComentarios(leerArchivo('src/components/route/reservas/ReservaDelAlojamiento.tsx'))
  debe(!/tipo: 'time'/.test(aloj) && /<CampoDeHora/.test(aloj) && /'15:00'/.test(aloj) && /'11:00'/.test(aloj), 'c4', 'alojamiento: Entrada y Salida con la rueda nueva y 15:00 / 11:00 de ejemplo (sin <input type=time>)')
  const exc = sinComentarios(leerArchivo('src/components/route/reservas/ExcursionConBillete.tsx'))
  debe(!/tipo: 'time'/.test(exc) && /<CampoDeHora/.test(exc), 'c5', 'excursión: la hora de recogida con la rueda nueva')
  const tf = sinComentarios(leerArchivo('src/components/ui/TimeField.tsx'))
  debe(/<HojaDeHora/.test(tf) && !/<PickerSheet|WheelSheet/.test(tf), 'c6', 'TimeField (la reserva a mano) abre la misma HojaDeHora')
  // Ningún <input type="time"> del sistema fuera del panel de desarrollo.
  const raiz = path.resolve('src')
  const todos = []
  const recorre = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) recorre(p)
      else if (/\.tsx?$/.test(e.name)) todos.push(p)
    }
  }
  recorre(raiz)
  const con = todos.filter((f) => !/[\\/]dev[\\/]/.test(f) && /type="time"|tipo: 'time'|type: 'time'/.test(sinComentarios(fs.readFileSync(f, 'utf8'))))
  debe(con.length === 0, 'c7', `ningún campo de hora del sistema fuera del panel de desarrollo (${con.map((f) => path.basename(f)).join(', ') || 'ninguno'})`)
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
  debe(abre, 'v0', 'se abre la hoja del vuelo desde RESERVAS')

  const campo = (clave) => a.evaluar(`(() => { const c = document.querySelector('[role=dialog] [data-campo-de-hora="${clave}"]'); if (!c) return null; const t = c.querySelector('[data-campo-de-hora-texto]'); return { vacia: c.getAttribute('data-vacia'), texto: t?.textContent.trim(), color: getComputedStyle(t).color } })()`)
  const pestana = (k) => a.evaluar(`(() => { const t = document.querySelector('[data-mi-vuelo-lado="${k}"]'); return t ? { texto: t.textContent.trim(), puesto: t.getAttribute('data-mi-vuelo-puesto'), tick: Boolean(t.querySelector('svg')) } : null })()`)
  const guardarActivo = () => a.evaluar(`(() => { const b = document.querySelector('[data-mi-vuelo-guardar]'); return b ? !b.disabled : null })()`)
  const aviso = () => a.evaluar(`(document.querySelector('[data-vuelo-falta-hora]')?.textContent ?? '').trim()`)
  const abrir = async (clave) => {
    await clic(a, `[role=dialog] [data-campo-de-hora="${clave}"]`)
    await esp(800)
  }
  const tick = async () => {
    await clic(a, '[data-hoja-de-hora-guardar]')
    await esp(700)
  }

  // Pestañas siempre «Ida» y «Vuelta»; sin hora elegida, todo en gris y sin ✓.
  let t1 = await pestana('ida')
  let t2 = await pestana('vuelta')
  debe(t1 && t2 && t1.texto === 'Ida' && t2.texto === 'Vuelta' && !t1.tick && !t2.tick, 'v1', `pestañas «Ida» y «Vuelta» sin ✓ al empezar (${JSON.stringify([t1, t2])})`)
  let roma = await campo('roma')
  debe(roma && roma.vacia === '1' && roma.texto === '11:15' && /rgba?\(28, 34, 48, 0?\.[2-4]/.test(roma.color), 'v2', `la hora de llegada de la ida (11:15) es un ejemplo en GRIS (${JSON.stringify(roma)})`)
  debe((await guardarActivo()) === false, 'v3', '[Guardar el vuelo] no está activo sin elegir nada')
  await a.captura(foto('1_vuelo_ida_ejemplos'))

  // Tocar solo el aeropuerto (si lo hay) o elegir un lado sin hora frena el botón con su aviso; el ejemplo no cuenta.
  const hayPunto = await clic(a, '[role=dialog] [data-mi-vuelo-punto-opcion]')
  await esp(500)
  if (hayPunto) {
    debe((await guardarActivo()) === false && /Elige la hora/.test(await aviso()), 'v4', `con el aeropuerto elegido pero sin hora, [Guardar] sigue sin activarse y dice qué falta (${await aviso()})`)
  } else console.log('   (esta ruta no ofrece aeropuertos que elegir: se pasa el aviso por la hora de fuera)')

  // El ✓ sin mover la rueda guarda lo que se ve: la hora de fuera de la ida es 08:30 de ejemplo.
  await abrir('otra')
  await tick()
  let otra = await campo('otra')
  debe(otra && otra.vacia === '0' && otra.texto === '08:30', 'v5', `abrir la rueda y tocar el ✓ SIN moverla guarda 08:30 (${JSON.stringify(otra)})`)
  // Y con la hora de llegada (11:15 de ejemplo).
  await abrir('roma')
  await tick()
  roma = await campo('roma')
  debe(roma && roma.vacia === '0' && roma.texto === '11:15', 'v6', `el ✓ sin mover guarda también la de Roma (${JSON.stringify(roma)})`)
  t1 = await pestana('ida')
  debe(t1 && t1.texto === 'Ida' && t1.puesto === '1' && t1.tick, 'v7', `la pestaña de la ida sigue diciendo «Ida» (sin día ni hora) y lleva ✓ (${JSON.stringify(t1)})`)
  debe((await guardarActivo()) === true, 'v8', 'con la hora elegida, [Guardar el vuelo] se activa')
  await a.captura(foto('2_vuelo_ida_puesta'))

  // La vuelta, en gris todavía; tocar fuera sin mover y vacía no inventa una hora.
  await clic(a, '[data-mi-vuelo-lado="vuelta"]')
  await esp(600)
  const vroma = await campo('roma')
  debe(vroma && vroma.vacia === '1' && vroma.texto === '18:05' && /rgba?\(28, 34, 48, 0?\.[2-4]/.test(vroma.color), 'v9', `la hora de la vuelta (18:05) es un ejemplo en gris (${JSON.stringify(vroma)})`)
  await abrir('roma')
  await clic(a, '[data-hoja-de-hora-fondo]')
  await esp(600)
  debe((await campo('roma')).vacia === '1', 'v10', 'tocar fuera de la rueda vacía y sin mover no inventa la hora')
  t2 = await pestana('vuelta')
  debe(t2 && t2.texto === 'Vuelta' && !t2.tick, 'v11', 'la pestaña de la vuelta sin ✓ mientras no se elija su hora')
  // Se guarda solo la ida y se queda en el viaje.
  await clic(a, '[data-mi-vuelo-guardar]')
  await esp(1500)
  const guardado = await a.evaluar(`${store}.then((s) => { const r = s.useRouteStore.getState().route; return { ida: r.arrivalFlightTime ?? null, vuelta: r.departureFlightTime ?? null } })`)
  debe(guardado.ida === '11:15' && !guardado.vuelta, 'v12', `se guarda la ida a las 11:15 y la vuelta (en gris) NO se inventa (${JSON.stringify(guardado)})`)
} catch (e) {
  debe(false, 'v', `la prueba de la hoja del vuelo no pudo acabar: ${e && e.message}`)
} finally {
  if (a) a.cerrar()
}

console.log('3. «Datos de la reserva» del alojamiento (con pase)')
a = null
try {
  a = await conViaje({ version: 'pago', ancho: 390, alto: 844 })
  const R = (js) => a.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const st = () => R.useRouteStore.getState(); const route = () => st().route; ${js} })()`)
  await R(`const r = route(); const id = r.days[0].id; st().setAccommodationHotel(id, { name: 'Hotel Palatino', precio: { amount: 280, currency: 'EUR' } }); st().setMode('bookings'); return true`)
  await esp(2500)
  await a.evaluar(`(() => { if (!document.querySelector('[data-blk="aloj"] [data-alojamiento-caja]')) document.querySelector('[data-blk="aloj"] [data-cabecera-clara]')?.click(); return true })()`)
  await esp(800)
  await R(`const id = route().days[0].id; const h = st().accommodationSelections[id]; st().setAccommodationHotel(id, { ...h, reserva: { direccion: 'Via Cavour 12, Roma', entrada: '2026-11-26', salida: '2026-11-29', noches: 3, horaEntrada: null, horaSalida: null, telefono: '+39 06 1234 5678', localizador: null } }); const S = await import('/src/store/useBilleteStore.ts'); S.useBilleteStore.getState().ponerAlojamiento(S.useBilleteStore.getState().tripId, id, 'HX48K2'); return true`)
  await esp(1500)
  const abre = await clic(a, '[data-blk="aloj"] [data-lapiz="aloj-datos"]')
  await esp(1500)
  debe(abre, 'a0', 'se abre «Datos de la reserva» con el lápiz del bloque de datos')
  const h = (clave) => a.evaluar(`(() => { const c = document.querySelector('[role=dialog] [data-campo-de-hora="aloj-${clave}"]'); if (!c) return null; const t = c.querySelector('[data-campo-de-hora-texto]'); return { vacia: c.getAttribute('data-vacia'), texto: t?.textContent.trim(), color: getComputedStyle(t).color, etiqueta: c.querySelector('span')?.textContent.trim() } })()`)
  const hayInputHora = await a.evaluar(`Boolean(document.querySelector('[role=dialog] input[type=time]'))`)
  debe(hayInputHora === false, 'a1', 'ya no hay un campo de hora del sistema (la rueda del iPhone) en «Datos de la reserva»')
  let e1 = await h('horaEntrada')
  let s1 = await h('horaSalida')
  debe(e1 && e1.vacia === '1' && e1.texto === '15:00' && /rgba?\(28, 34, 48, 0?\.[2-4]/.test(e1.color), 'a2', `Entrada: «15:00» en gris (${JSON.stringify(e1)})`)
  debe(s1 && s1.vacia === '1' && s1.texto === '11:00' && /rgba?\(28, 34, 48, 0?\.[2-4]/.test(s1.color), 'a3', `Salida: «11:00» en gris (${JSON.stringify(s1)})`)
  await a.captura(foto('3_alojamiento_datos'))
  // Tocar «Salida» abre la rueda desde abajo y NO se pone sola la hora de ahora.
  await clic(a, '[role=dialog] [data-campo-de-hora="aloj-horaSalida"]')
  await esp(800)
  const hoja = await a.evaluar(`(() => { const x = document.querySelector('[data-hoja-de-hora]'); if (!x) return null; const r = x.querySelector('.trazo-notice-panel').getBoundingClientRect(); return { abajo: Math.abs(r.bottom - innerHeight) < 2, guardar: Boolean(x.querySelector('[data-hoja-de-hora-guardar]')), quitar: Boolean(x.querySelector('[data-hoja-de-hora-quitar]')) } })()`)
  debe(hoja && hoja.abajo && hoja.guardar && hoja.quitar, 'a4', `la rueda sale desde abajo con ✓ y papelera (${JSON.stringify(hoja)})`)
  const ahoraEnFondo = await h('horaSalida')
  debe(ahoraEnFondo && ahoraEnFondo.vacia === '1' && ahoraEnFondo.texto === '11:00', 'a5', `al tocar «Salida» no se pone sola la hora de ahora (${JSON.stringify(ahoraEnFondo)})`)
  await a.captura(foto('4_alojamiento_rueda'))
  await clic(a, '[data-hoja-de-hora-guardar]')
  await esp(700)
  s1 = await h('horaSalida')
  debe(s1 && s1.vacia === '0' && s1.texto === '11:00', 'a6', `el ✓ sin mover guarda las 11:00 (${JSON.stringify(s1)})`)
  // Entrada: tocar fuera sin mover y vacía la deja vacía.
  await clic(a, '[role=dialog] [data-campo-de-hora="aloj-horaEntrada"]')
  await esp(800)
  await clic(a, '[data-hoja-de-hora-fondo]')
  await esp(600)
  e1 = await h('horaEntrada')
  debe(e1 && e1.vacia === '1' && e1.texto === '15:00', 'a7', `tocar fuera sin mover deja la entrada en gris (${JSON.stringify(e1)})`)
  // Guardar los datos: se guarda la salida 11:00 y la entrada sigue sin hora.
  await clic(a, '[data-reserva-aloj-guardar]')
  await esp(1200)
  const r = await R(`const id = route().days[0].id; const x = st().accommodationSelections[id]?.reserva ?? null; return JSON.stringify({ e: x?.horaEntrada ?? null, s: x?.horaSalida ?? null })`)
  const g = JSON.parse(r)
  debe(g.s === '11:00' && !g.e, 'a8', `[Guardar los datos] guarda la salida (11:00) y no inventa la entrada (${r})`)
} catch (e) {
  debe(false, 'a', `la prueba de «Datos de la reserva» no pudo acabar: ${e && e.message}`)
} finally {
  if (a) a.cerrar()
}

console.log(`${comprobaciones} comprobaciones, ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
