// Prueba de la Tanda 10R, agente C (lo de la 10S8, apartado 0b):
//   1. El candado de los documentos depende SOLO de tener el pase (no del cobro): `estadoDelPaseParaDocumentos` / `usePaseParaDocumentos`; el resto de la app (`pagoActivo`) sigue igual con el cobro apagado.
//   2. «Y N sitios más…» cuenta TODAS las paradas del día que no caben (imprescindibles o no), no solo los imprescindibles.
//   node scripts/destino/pruebaTanda10R_C.mjs                                   (código y funciones: sin navegador)
//   APP_URL=http://localhost:5173 CON_NAVEGADOR=1 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10R_C.mjs   (con la pantalla; Vite reiniciado con el código nuevo)
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { build } from 'esbuild'
import { pathToFileURL } from 'node:url'

let n = 0
let fallos = 0
const debe = (ok, id, texto) => { n++; if (!ok) { fallos++; console.log(`  FALLO ${id}: ${texto}`) } else console.log(`  ok    ${id}: ${texto}`) }
const leer = (f) => fs.readFileSync(f, 'utf8')

// Los módulos de la app (TypeScript, con imports sin extensión) se empaquetan con esbuild a una carpeta temporal.
const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'p10rc-'))
const entrada = path.join(temporal, 'entrada.ts')
const abs = (f) => JSON.stringify(path.resolve(f).split(path.sep).join('/'))
fs.writeFileSync(entrada, `export * as pago from ${abs('src/lib/pago.ts')}
export * as av from ${abs('src/lib/adaptarVuelos.ts')}
export * as lib from ${abs('src/lib/imprescindiblesGrandes.ts')}
`)
await build({ entryPoints: [entrada], outfile: path.join(temporal, 'salida.mjs'), bundle: true, format: 'esm', platform: 'node', logLevel: 'silent', define: { 'import.meta.env.DEV': 'false', 'import.meta.env': '{}' } })
const { pago, av, lib } = await import(pathToFileURL(path.join(temporal, 'salida.mjs')).href)
process.on('exit', () => { try { fs.rmSync(temporal, { recursive: true, force: true }) } catch { /* nada */ } })

console.log('1. El candado de los documentos: solo el pase')
// Cobro apagado, el servidor dice que NO hay pase: lo de siempre (pagoActivo) abierto; los documentos, cerrados.
pago.fijarServidorDiceSinPase(false, 'viaje-1')
pago.fijarSinPaseParaDocumentos(true)
debe(pago.pagoActivo() === true, '1a', 'con el cobro apagado y sin pase, `pagoActivo()` sigue abierto (RUTA y HOY no cambian)')
debe(pago.estadoDelPaseParaPintar() === 'con', '1b', 'el estado general sigue «con» (los demás candados no cambian)')
debe(pago.estadoDelPaseParaDocumentos() === 'sin', '1c', 'los documentos, sin pase: «sin» (candado y aviso pequeño)')
pago.fijarSinPaseParaDocumentos(false)
debe(pago.estadoDelPaseParaDocumentos() === 'con', '1d', 'con pase: «con» (sin candado)')
// Cobro encendido y sin pase: los dos cerrados.
pago.fijarServidorDiceSinPase(true, 'viaje-1')
pago.fijarSinPaseParaDocumentos(true)
debe(pago.estadoDelPaseParaPintar() === 'sin' && pago.estadoDelPaseParaDocumentos() === 'sin', '1e', 'cobro encendido y sin pase: los dos, cerrados')
// Mientras no se sabe: ni candado ni aviso.
pago.fijarPaseDesconocido('viaje-2')
debe(pago.estadoDelPaseParaDocumentos() === 'pendiente', '1f', 'mientras no se sabe si hay pase: «pendiente» (ni candado ni aviso)')
pago.fijarServidorDiceSinPase(false, 'viaje-2')
pago.fijarSinPaseParaDocumentos(true)
debe(pago.avisoDelPaseSeEnsena('documento_entrada') === true && pago.avisoDelPaseSeEnsena('documento_excursion') === true, '1f2', 'con el cobro apagado y sin pase, el aviso pequeño de un documento SÍ se enseña (antes, nunca con el cobro apagado)')
debe(pago.avisoDelPaseSeEnsena('segunda_foto') === false, '1f3', '…y el de lo demás, no (como estaba)')
pago.fijarSinPaseParaDocumentos(false)
debe(pago.avisoDelPaseSeEnsena('documento_entrada') === false, '1f4', 'con pase, ningún aviso de documentos')

const botones = leer('src/components/route/reservas/BotonesDeReserva.tsx')
debe(/usePaseParaDocumentos\(\)/.test(botones) && !/usePasePintable/.test(botones), '1g', 'BotonAnadirDocumento usa el hook de los documentos')
const llegada = leer('src/components/route/reservas/LlegadaYVuelta.tsx')
debe(/estadoDelPaseParaDocumentos\(\) === 'sin'/.test(llegada) && !/estadoDelPaseParaPintar/.test(llegada), '1h', '«Cambiar el archivo» del vuelo mira lo mismo')
const estado = leer('src/lib/paseEstado.ts')
debe((estado.match(/fijarSinPaseParaDocumentos\(/g) ?? []).length >= 5 && /fijarSinPaseParaDocumentos\(r\.pases\.length === 0\)/.test(estado), '1i', 'el estado del pase del servidor alimenta el candado de los documentos (respuesta, caché, sin respuesta, forzado)')
const general = leer('src/lib/pago.ts')
debe(/export function pagoActivo\(\)[\s\S]*?PAGO_ACTIVO && !servidorDiceSinPase/.test(general), '1j', '`pagoActivo()` no se ha tocado (el resto de la app, igual)')

console.log('2. «Y N sitios más…» cuenta todas las paradas que no caben')
const stop = (id, name) => ({ id, name, time: '10:00', durationMinutes: 60, coordinates: { lat: 41.9, lng: 12.5 } })
const day = { id: 'd1', dayNumber: 1, title: 'Día 1', stops: [], spareStops: [], meals: [] }
day.stops =[stop('a', 'Coliseo'), stop('b', 'Panteón'), stop('c', 'Altar de la Patria'), stop('d', 'Piazza Navona'), stop('e', 'Fuente de Trevi'), { ...stop('f', 'Llegada a Roma'), isArrival: true }]
const respuesta = {
  changed: true,
  weekday: 'jueves',
  order: [],
  spare: [
    { id: 'a', name: 'Coliseo', reason: 'x', imprescindible: true },
    { id: 'b', name: 'Panteón', reason: 'x', imprescindible: true },
    { id: 'c', name: 'Altar de la Patria', reason: 'x', imprescindible: false },
    { id: 'd', name: 'Piazza Navona', reason: 'x', imprescindible: false },
    { id: 'e', name: 'Fuente de Trevi', reason: 'x', imprescindible: false },
    { id: 'f', name: 'Llegada a Roma', reason: 'x', imprescindible: false, esLlegada: true },
  ],
  imprescindiblesFuera: [{ id: 'a', name: 'Coliseo', weekday: 'jueves', reason: 'x' }, { id: 'b', name: 'Panteón', weekday: 'jueves', reason: 'x' }],
}
const r = av.aplicarAdaptacionDelMotor(day, respuesta, [])
debe(Boolean(r) && r.noCaben.length === 5, '2a', `salen las 5 paradas que no caben (2 imprescindibles + 3 más), no la llegada (${r?.noCaben.length})`)
debe(r.noCaben.filter((x) => x.imprescindible === false).map((x) => x.stopId).sort().join() === 'c,d,e', '2b', 'las que no son imprescindibles van marcadas (imprescindible: false)')
debe(r.next.spareStops.length === 6 || r.next.spareStops.length === 5, '2c', `todas están en «Si te sobra tiempo» (${r.next.spareStops.length})`)
const reparto = lib.repartirNoCaben(r.noCaben, 'Roma')
debe(reparto.grandes.map((x) => x.nombre).join() === 'Coliseo', '2d', `línea propia solo para el grande (${reparto.grandes.map((x) => x.nombre)})`)
debe(reparto.resto.length === 4, '2e', `la línea «Y N…» cuenta 4: Panteón (imprescindible no grande) + 3 que no son imprescindibles (${reparto.resto.length})`)
debe(lib.textoYMasSitios(reparto.resto.length) === 'Y 4 sitios más pasan a “Si te sobra tiempo”.', '2f', 'el texto: «Y 4 sitios más pasan a “Si te sobra tiempo”.»')
// Un destino sin lista de grandes: los imprescindibles, uno a uno; los que no lo son, siempre en la línea.
const lisboa = lib.repartirNoCaben(r.noCaben, 'Lisboa')
debe(lisboa.grandes.length === 2 && lisboa.resto.length === 3, '2g', 'sin lista de grandes: 2 imprescindibles con línea y 3 en «Y 3 sitios más…»')
// Lo viejo sigue igual: sin el campo, todo cuenta como imprescindible.
debe(lib.repartirNoCaben([{ nombre: 'Coliseo' }, { nombre: 'Altar de la Patria' }], 'Roma').resto.length === 1, '2h', 'sin el campo `imprescindible` el reparto de siempre')
// Ninguna parada se pierde: las que no caben están ya en «Si te sobra tiempo».
const dicho = new Set(r.noCaben.map((x) => x.stopId))
debe(r.next.spareStops.filter((s) => !s.isArrival).every((s) => dicho.has(s.id)), '2i', 'nada pasa a «Si te sobra tiempo» sin que se diga')
const aviso = leer('src/components/reorganizar/AvisoNoCabe.tsx')
debe(aviso.includes('repartirNoCaben') && aviso.includes('textoYMasSitios'), '2j', 'AvisoNoCabe usa el reparto')
const engine = leer('shared/routeEngine/adaptarDiaVuelo.js')
debe(/spare: spareOut/.test(engine), '2k', 'el motor no se ha tocado: ya devolvía `spare` con todas')

if (process.env.CON_NAVEGADOR !== '1') {
  console.log(`\n${n} comprobaciones, ${fallos} fallos`)
  process.exit(fallos ? 1 : 0)
}

/* ───────────────────────── La pantalla ───────────────────────── */
const { abrirApp } = await import('./_enLaApp.mjs')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
console.log('\n3. La pantalla, con el cobro apagado y sin pase (390 px)')
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0', antes: "try{sessionStorage.removeItem('trazo:version')}catch(x){}", ancho: 390, alto: 844 })
try {
  const ev = (js) => a.evaluar(js)
  for (let intento = 0; intento < 3; intento++) {
    for (let i = 0; i < 360 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
    try {
      await ev('window.__rutaPrueba().then(() => true)')
      break
    } catch (e) {
      if (intento === 2) throw e
      await ev('location.reload()').catch(() => undefined)
      await a.esp(5000)
    }
  }
  for (let i = 0; i < 90 && !(await ev('window.__ruta?.getState().route != null').catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 6; i++) {
    const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  const R = (js) => ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const B = await import('/src/lib/bookings.ts'); const P = await import('/src/lib/pago.ts'); const st = () => R.useRouteStore.getState(); const route = () => st().route; ${js} })()`)
  const base = await R(`const r = route(); const d = r.days.filter((x) => !x.isReturnLeg && B.dateOfDay(r, x))[1] ?? r.days[0]; const s = d.stops.find((p) => !p.isFreeTour && !p.isNightExperience && !p.passThrough && !p.isBreak && p.name); return { dateIso: B.dateOfDay(r, d), nombre: s.name }`)
  await R(`st().addReservation({ id: 'res-10r-c', kind: 'entrada', refId: ${JSON.stringify(base.nombre)}, name: ${JSON.stringify(base.nombre)}, placeNames: [${JSON.stringify(base.nombre)}], dateIso: ${JSON.stringify(base.dateIso)}, dayNumber: null, time: '09:15' }, null, null); return true`)
  // El servidor, con el cobro apagado y sin pase en la cuenta.
  await R('P.fijarServidorDiceSinPase(false, null); P.fijarSinPaseParaDocumentos(true); return true')
  await R("st().setMode('bookings'); return true")
  await a.esp(1800)
  await ev("(() => { const b = document.querySelector('[data-blk=\"entradas\"]'); if (b && b.querySelectorAll('[data-tarjeta-crema]').length === 0) b.querySelector('[data-cabecera-clara]')?.click(); return true })()")
  await a.esp(1200)
  const boton = () => ev("(() => { const b = document.querySelector('[data-blk=\"entradas\"] [data-anadir-doc]'); return b ? JSON.stringify({ candado: b.getAttribute('data-con-candado'), texto: b.textContent.trim() }) : null })()").then((x) => (x ? JSON.parse(x) : null))
  const sinPase = await boton()
  debe(sinPase && sinPase.candado === '1', '3a', `cobro apagado y sin pase: [Añadir tu entrada] con el candado (${JSON.stringify(sinPase)})`)
  await ev("document.querySelector('[data-blk=\"entradas\"] [data-anadir-doc]')?.click(); true")
  await a.esp(900)
  const avisoTexto = await ev("(document.querySelector('[data-aviso-pase]')?.innerText ?? '').replace(/\\s+/g, ' ')")
  debe(/Pase Roma/.test(avisoTexto) && /entrada/i.test(avisoTexto), '3b', `y al tocarlo sale el aviso pequeño del pase, no el selector de archivos (${avisoTexto.slice(0, 120)})`)
  await a.captura(path.join(SALIDA, '10r_candado_documentos_1.jpg')).catch(() => {})
  await ev("(() => { const d = document.querySelector('[data-aviso-pase]')?.closest('[role=dialog]'); d?.querySelector('button[aria-label=Cerrar]')?.click(); return true })()")
  await a.esp(500)
  const general = await R('return { activo: P.pagoActivo(), estado: P.estadoDelPaseParaPintar() }')
  debe(general.activo === true && general.estado === 'con', '3c', `el resto de la app sigue como estaba con el cobro apagado (${JSON.stringify(general)})`)
  // Con pase.
  await R('P.fijarSinPaseParaDocumentos(false); return true')
  await a.esp(700)
  const conPase = await boton()
  debe(conPase && conPase.candado === '0', '3d', `con pase: sin candado (${JSON.stringify(conPase)})`)
  await a.captura(path.join(SALIDA, '10r_candado_documentos_2.jpg')).catch(() => {})
} finally {
  a.cerrar()
}
console.log(`\n${n} comprobaciones, ${fallos} fallos`)
process.exit(fallos ? 1 : 0)
