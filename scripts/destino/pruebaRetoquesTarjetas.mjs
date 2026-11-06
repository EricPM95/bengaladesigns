// RETOQUES_TARJETAS (6-nov), apartados 1 a 5 de las tarjetas de DÍAS (los de RESERVAS y EXPLORAR tienen su propia prueba: pruebaRetoquesReservas, pruebaRetoquesExplorar).
//   1. La línea del trayecto: vehículo · minutos · km · [Rutas] · [+ Añadir parada], sin «Llegas hacia…» ni notas debajo.
//   2. El horario de la tarjeta: solo «10:00–18:00».
//   3. La foto de la ficha, en grande.
//   4. Los nombres cortos (solo lo que se ve) y las etiquetas del Faro.
//   5. Después de la cena, nada; el aeropuerto solo el día de vuelta; [Ver restaurantes] sin restaurante.
// Necesita el Vite estable (5173) y la API (8787) con DESTINOS_OCULTOS='-' para la parte del navegador (un solo Chrome, por la cola).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaRetoquesTarjetas.mjs
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const fallos = []
let n = 0
const debe = (cond, regla, texto) => {
  n++
  if (!cond) fallos.push({ regla, texto })
}
const json = (r) => JSON.parse(fs.readFileSync(r, 'utf8'))
const leer = (r) => fs.readFileSync(r, 'utf8')

// ── El código de verdad (TypeScript) empaquetado a un archivo temporal ──
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'retoques-'))
const entrada = path.join(tmp, 'entrada.tsx')
fs.writeFileSync(
  entrada,
  `export { createElement } from 'react'
export { renderToStaticMarkup } from 'react-dom/server'
export { displayStopName } from '${path.resolve('src/lib/format.ts').replace(/\\/g, '/')}'
export { horarioDeLaTarjeta, etiquetaDeHorario } from '${path.resolve('src/lib/etiquetaHorario.ts').replace(/\\/g, '/')}'
export { visibleTags } from '${path.resolve('src/lib/tagColors.ts').replace(/\\/g, '/')}'
export { etiquetasDeParada } from '${path.resolve('src/lib/etiquetasDeParada.ts').replace(/\\/g, '/')}'
export { FilaCoche, trayectoDeVuelta } from '${path.resolve('src/components/route/dayDetail/CocheDelDia.tsx').replace(/\\/g, '/')}'
`,
)
const salida = path.join(tmp, 'codigo.cjs')
await build({ entryPoints: [entrada], bundle: true, platform: 'node', format: 'cjs', outfile: salida, logLevel: 'silent', jsx: 'automatic', loader: { '.svg': 'dataurl' }, nodePaths: [path.resolve('node_modules')] })
const { createElement, renderToStaticMarkup, displayStopName, horarioDeLaTarjeta, etiquetaDeHorario, etiquetasDeParada, visibleTags, FilaCoche, trayectoDeVuelta } = await import(pathToFileURL(salida).href)

try {
  // ── 1. La línea del trayecto ──
  const fila = renderToStaticMarkup(createElement(FilaCoche, { texto: 'En coche · 3 min · 1 km', desde: 'Jameos del Agua', hasta: 'Cueva de los Verdes', ciudad: 'Lanzarote' }))
  debe(/En coche · 3 min · 1 km/.test(fila) && /Rutas/.test(fila), 'T1', 'la línea del coche lleva su texto y [Rutas]')
  debe(!/Abrir en Maps|Llegas|Llegada|aparcar|minutos antes/i.test(fila), 'T2', 'la línea del coche no lleva nada más (ni «Abrir en Maps», ni «Llegas…», ni notas)')
  debe(/A pie · 8 min/.test(renderToStaticMarkup(createElement(FilaCoche, { texto: 'A pie · 8 min', desde: 'a', hasta: 'b' }))), 'T3', '«A pie · 8 min» sale igual')
  const dia = (vuelta) => ({ coche: { activo: true, vuelta } })
  debe(trayectoDeVuelta(dia({ minutos: 66, km: 60, maps_url: 'x', llegas: '19:16' })) === null, 'T4', '«Vuelta a casa» ya no sale detrás de la cena')
  const aero = trayectoDeVuelta(dia({ minutos: 9, km: 8, maps_url: 'x', llegas: '15:56', al_aeropuerto: true, limite_t1: '17:10' }))
  debe(aero?.texto === 'Al aeropuerto · 9 min · 8 km' && !aero.llegada_texto, 'T5', 'el trayecto al aeropuerto del día de vuelta sale sin «Llegas a la T1 hacia las…»')
  const conector = leer('src/components/route/dayDetail/StopConnector.tsx')
  debe(!/llegada=|llegada_texto|Abrir en Maps/.test(conector), 'T6', 'StopConnector ya no pinta la llegada ni «Abrir en Maps»')
  const ficha = leer('src/components/route/dayDetail/StopDetailSheet.tsx')
  debe(/stop\?\.llegadaTexto/.test(ficha) && /Última entrada \$\{horario\.ultimaEntrada\}/.test(ficha), 'T7', 'la nota de llegada va a los tips de la ficha y la última entrada al horario de la ficha')

  // ── 2. El horario de la tarjeta ──
  const tr = (...tramos) => ({ abre: tramos[0][0], cierra: tramos.at(-1)[1], ultimaEntrada: '17:30', cerrado: false, tramos: tramos.map(([abre, cierra]) => ({ abre, cierra })), texto: 'Abre …' })
  debe(horarioDeLaTarjeta(tr(['10:00', '18:00'])) === '10:00–18:00', 'H1', 'un tramo: «10:00–18:00»')
  debe(horarioDeLaTarjeta(tr(['9:00', '13:00'], ['16:00', '19:00'])) === '9:00–13:00 / 16:00–19:00', 'H2', 'horario partido: «9:00–13:00 / 16:00–19:00»')
  debe(!/Abre|Última/i.test(horarioDeLaTarjeta(tr(['10:00', '18:00'])) ?? ''), 'H3', 'ni «Abre» ni «Última entrada» en la tarjeta')
  debe(horarioDeLaTarjeta({ ...tr(['10:00', '18:00']), cerrado: true, texto: 'Cerrado este día' }) === 'Cerrado este día', 'H4', 'cerrado: «Cerrado este día»')
  debe(etiquetaDeHorario(tr(['9:00', '13:00'], ['15:00', '19:00'])) === '09:00–13:00 y 15:00–19:00', 'H5', 'la etiqueta de la ficha no cambia')
  debe(/horarioDeLaTarjeta\(horario\)/.test(leer('src/components/route/dayDetail/StopAccordion.tsx')), 'H6', 'StopAccordion usa el horario corto')

  // ── 3. La foto en grande ──
  const visor = leer('src/components/route/fotos/VisorDeFotos.tsx')
  debe(/setPointerCapture/.test(visor) && /mov\.y > 110/.test(visor) && /data-visor-cerrar/.test(visor) && /Escape/.test(visor) && /Math\.hypot/.test(visor) && /fotos\.length > 1/.test(visor), 'F1', 'el visor: X, Escape, deslizar hacia abajo, pellizco y varias fotos')
  debe(/data-foto-ficha/.test(ficha) && /<VisorDeFotos/.test(ficha), 'F2', 'tocar la foto de la ficha abre el visor')

  // ── 4. Los nombres cortos ──
  const cortos = { 'El paseo marítimo de Playa Blanca': 'Playa Blanca', 'Haría y el Valle de las Mil Palmeras': 'Haría', 'Teguise (villa)': 'Teguise', 'Arrecife: Charco de San Ginés y el paseo': 'Arrecife', 'Caleta de Famara y Playa de Famara': 'Famara', 'Puerto del Carmen (Puerto Viejo)': 'Puerto del Carmen', 'Punta Mujeres y Arrieta': 'Punta Mujeres' }
  for (const [largo, corto] of Object.entries(cortos)) debe(displayStopName(largo) === corto, 'N1', `${largo} → ${corto} (sale «${displayStopName(largo)}»)`)
  for (const quedan of ['Casa-Museo César Manrique (Haría)', 'Montañas del Fuego (Timanfaya)', 'El Golfo y el Charco de los Clicos']) debe(displayStopName(quedan) === quedan, 'N2', `${quedan} se queda`)
  const roma = json('data/pipeline_v2/roma.json')
  const { nombreSinHora } = await import(pathToFileURL(path.resolve('src/lib/nombreDeParada.ts')).href).catch(() => ({}))
  const romaCambia = roma.places.map((p) => p.name).filter((nombre) => displayStopName(nombre) !== nombre.replace(/\s*\(noche\)\s*$/i, '') && !/sin gente|iluminad|de noche|al atardecer/i.test(nombre))
  debe(romaCambia.length === 0, 'N3', `los nombres de Roma no cambian: ${romaCambia.join(', ')}`)
  void nombreSinHora
  // Solo cambia lo que se ve: los datos y las fotos siguen cruzando con el nombre de dentro.
  const { photosFor, ownPhotoFile } = await import(pathToFileURL(path.resolve('server/engine/writtenDays.js')).href)
  const tabla = photosFor('lanzarote')
  for (const interno of ['El paseo marítimo de Playa Blanca', 'Haría y el Valle de las Mil Palmeras', 'Teguise (villa)', 'Arrecife: Charco de San Ginés y el paseo']) debe(Boolean(ownPhotoFile(tabla, interno, null)), 'N4', `la foto de «${interno}» sigue cruzando por su nombre de dentro`)
  const lanz = json('data/pipeline_v2/lanzarote.json')
  debe(lanz.places.some((p) => p.name === 'Arrecife: Charco de San Ginés y el paseo') && lanz.places.some((p) => p.name === 'Caleta de Famara y Playa de Famara'), 'N5', 'los nombres de dentro (datos) no se han tocado')
  // Etiquetas del Faro
  debe(JSON.stringify(visibleTags(etiquetasDeParada('Faro de Pechiguera', ['pueblo', 'paseo', 'atardecer', 'faro']))) === '["faro","atardecer"]', 'E1', 'el Faro de Pechiguera lleva Faro y Atardecer')
  debe(JSON.stringify(visibleTags(etiquetasDeParada('El paseo marítimo de Playa Blanca', ['pueblo', 'paseo', 'atardecer', 'faro']))) === '["pueblo","atardecer","faro"]', 'E2', 'el paseo de Playa Blanca sigue con las del sitio')
  debe(JSON.stringify(etiquetasDeParada('Coliseo', ['anfiteatro'])) === '["anfiteatro"]', 'E3', 'Roma no cambia')

  // ── 5. Después de la cena, nada; el aeropuerto solo el día de vuelta; [Ver restaurantes] ──
  const panel = leer('src/components/route/dayDetail/DayDetailPanel.tsx')
  debe(!/<CenaCercaBloque/.test(panel), 'C1', 'la tarjeta «Cena cerca de tu alojamiento» ya no sale')
  debe(/day\.isReturnLeg \? \(day\.aeropuerto \?\? ultimo\.aeropuerto\) : null/.test(panel) && !/day\.id === ultimo\.id\) \? ultimo\.aeropuerto/.test(panel), 'C2', 'el bloque del aeropuerto solo va el día de vuelta')
  debe(/onVerRestaurantes=\{verRestaurantesDe/.test(panel) && /categoria: 'restaurantes'/.test(panel), 'C3', '[Ver restaurantes] abre EXPLORAR › Comer')
  debe(/Ver restaurantes/.test(leer('src/components/route/dayDetail/MealTimeAccordion.tsx')), 'C4', 'la comida o cena sin restaurante lleva [Ver restaurantes]')
  const eric = json('docs/dias/_hoy3_ruta_eric.json').route
  const vuelta = eric.days.filter((d) => d.isReturnLeg)
  debe(vuelta.length === 1 && eric.days.at(-1).isReturnLeg && !eric.days.at(-1).meals.some((m) => m.mealTime === 'dinner') && !eric.days.at(-1).cenaCerca, 'C5', 'el viaje de Eric: el día de vuelta no lleva cena')
} finally {
  fs.rmSync(tmp, { recursive: true, force: true })
}

// ── El navegador: el viaje de Eric en un móvil ──
if (process.env.APP_URL) {
  const { abrirApp } = await import('./_enLaApp.mjs')
  const SALIDA = path.resolve('docs/dias/capturas_jutrip')
  const a = await abrirApp(process.env.APP_URL, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa', ancho: 390, alto: 844 })
  const ev = (js) => a.evaluar(js)
  const cierraAvisos = async () => {
    for (let i = 0; i < 5; i++) {
      const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar|Ahora no)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(500)
    }
  }
  const verDia = async (indice) => {
    await ev(`(() => { const s = window.__ruta.getState(); s.setMode('days'); s.setActiveDayId(s.route.days[${indice}].id); return true })()`)
    await a.esp(2600)
    await cierraAvisos()
  }
  const texto = () => ev('document.body.innerText')
  try {
    for (let i = 0; i < 60 && !(await ev("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
    await ev("window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08', vuelos: { llegada: '08:25', vuelta: '19:40' } }).then(() => true)")
    await cierraAvisos()
    const dias = await ev('window.__ruta.getState().route.days.length')
    debe(dias >= 6, 'B0', `el viaje de prueba tiene ${dias} días`)
    // Martes 10 (día 3): trayectos en una línea, sin cena cerca ni vuelta a casa, nombres cortos, horario sin «Abre»
    await verDia(2)
    let t = await texto()
    debe(!/Cena cerca de tu alojamiento|Vuelta a casa|Llegas hacia|De .* al aeropuerto|Abrir en Maps|minutos antes de tu hora/i.test(t), 'B1', 'el martes: sin «Cena cerca», «Vuelta a casa», «Llegas hacia» ni notas bajo el trayecto')
    debe(!/Abre \d|Última entrada/.test(t), 'B2', 'el martes: la tarjeta no dice «Abre» ni «Última entrada»')
    const filas = await ev("Array.from(document.querySelectorAll('[data-trayecto-coche]')).map((e) => e.innerText.replace(/\\s+/g, ' ').trim())")
    debe(filas.length > 0 && filas.every((f) => /^(En coche|A pie) · \d+ min( · \d+ km)? Rutas$/.test(f)), 'B3', `cada trayecto es «vehículo · minutos · km · Rutas»: ${JSON.stringify(filas)}`)
    debe(/Haría/.test(t) && !/Valle de las Mil Palmeras/.test(t.split('Qué vas a ver')[0] ?? t), 'B4', 'el martes enseña «Haría», no el título largo')
    await a.captura(path.join(SALIDA, 'retoques_dias_martes.jpg'))
    // La ficha de una parada: la foto en grande
    const abierta = await ev("(() => { const b = Array.from(document.querySelectorAll('[data-stop-card], button')).find((x) => /Jameos del Agua/.test(x.innerText || '') && x.innerText.length < 200); if (!b) return false; b.click(); return true })()")
    await a.esp(1500)
    debe(abierta, 'B5', 'se abre la ficha de Jameos del Agua')
    const foto = await ev("Boolean(document.querySelector('[data-foto-ficha]'))")
    debe(foto, 'B6', 'la foto de la ficha se puede tocar')
    await ev("document.querySelector('[data-foto-ficha]')?.click(); true")
    await a.esp(900)
    debe(await ev("Boolean(document.querySelector('[data-visor-foto] [data-visor-imagen]'))"), 'B7', 'al tocar la foto se abre en grande')
    await a.captura(path.join(SALIDA, 'retoques_foto_grande.jpg'))
    await ev("document.querySelector('[data-visor-cerrar]')?.click(); true")
    await a.esp(500)
    debe(!(await ev("Boolean(document.querySelector('[data-visor-foto]'))")), 'B8', 'la X cierra la foto grande')
    await ev("(() => { const x = Array.from(document.querySelectorAll('button')).find((b) => /^cerrar/i.test(b.getAttribute('aria-label') || '')); x?.click(); return true })()")
    await a.esp(600)
    // Jueves 12 (día 5): Playa Blanca, el Faro, y fin del día en la cena
    await verDia(4)
    t = await texto()
    debe(!/Cena cerca de tu alojamiento|Vuelta a casa|De .* al aeropuerto/i.test(t), 'B9', 'el jueves: nada detrás de la cena, ni el aeropuerto')
    debe(/Playa Blanca/.test(t) && !/El paseo marítimo de Playa Blanca/.test(t), 'B10', 'el jueves enseña «Playa Blanca»')
    await a.captura(path.join(SALIDA, 'retoques_dias_jueves.jpg'))
    // Viernes 13 (día de vuelta): el aeropuerto sí, y sin cena
    await verDia(dias - 1)
    t = await texto()
    debe(/aeropuerto/i.test(t), 'B11', 'el día de vuelta lleva lo del aeropuerto')
    debe(!/Cena cerca de tu alojamiento|Hora de cenar/i.test(t), 'B12', 'el día de vuelta no lleva cena')
    await a.captura(path.join(SALIDA, 'retoques_dias_viernes.jpg'))
  } finally {
    a.cerrar()
  }
}

console.log(`${n} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO ${f.regla}: ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
