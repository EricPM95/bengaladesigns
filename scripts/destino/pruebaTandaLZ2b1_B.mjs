// LZ2b1 (agente B): LA APP de Lanzarote. Sin navegador. Con la API en 8787 (solo si enseña Lanzarote: DESTINOS_OCULTOS='-') comprueba también por HTTP.
//   node scripts/destino/pruebaTandaLZ2b1_B.mjs
// Comprueba: «Dónde aparcar» en la ficha (y nunca transporte), «Cerca de ti» con gasolineras y aparcamientos, EXPLORAR con las 7 categorías, sin la pregunta del coche en el formulario,
// el interruptor «Coche de alquiler | Mi coche» de RESERVAS (misma ruta y mismos trayectos con los dos) y que ningún texto de Roma sale en un viaje a Lanzarote.
import fs from 'node:fs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const crudo = (ruta) => fs.readFileSync(ruta, 'utf8')
const leer = (ruta) => JSON.parse(crudo(ruta))
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const D = leer('data/pipeline_v2/lanzarote.json')

// ── 1. La ficha: «Dónde aparcar» en lugar de «Cómo llegar» ───────
const piezas = crudo('src/components/route/dayDetail/FichaPiezas.tsx')
const aparcarFn = piezas.slice(piezas.indexOf('export function FichaDondeAparcar'), piezas.indexOf('export function FichaSinEntrada'))
debe(aparcarFn.includes('Dónde aparcar') && aparcarFn.includes('Abrir en Maps') && aparcarFn.includes('travelmode=driving'), '1a', '«Dónde aparcar» con [Abrir en Maps] (en coche) a la coordenada de la parada')
debe(!/metro|bus|tranvia|transporte|Cómo llegar/.test(aparcarFn.replace(/\/\*[\s\S]*?\*\//g, '')), '1b', 'la tarjeta «Dónde aparcar» no lleva líneas de transporte')
const hoja = crudo('src/components/route/dayDetail/StopDetailSheet.tsx')
debe(/aparcarTexto \? \(\s*<FichaDondeAparcar[\s\S]{0,300}<FichaComoLlegar/.test(hoja), '1c', 'la ficha pinta «Dónde aparcar» y, solo si el sitio no lo tiene (Roma), «Cómo llegar»')
debe(/lat=\{coordenadasDelSitio\?\.lat/.test(hoja), '1d', '[Abrir en Maps] lleva a la coordenada de la parada (su aparcamiento)')
const servidor = crudo('server/index.js')
debe(/aparcar: typeof place\.aparcar === 'string'/.test(servidor), '1e', 'el catálogo del destino lleva el texto «aparcar»')
debe(!/aparcar_verificar/.test(servidor.slice(servidor.indexOf("app.post('/api/destination-places'"), servidor.indexOf("app.post('/api/destination-places'") + 9000)), '1f', '`aparcar_verificar` no sale nunca al viajero')
debe(!/aparcar_verificar/.test(sinComentarios(piezas)) && !/aparcar_verificar/.test(sinComentarios(hoja)), '1g', 'la ficha no enseña `aparcar_verificar`')
const sitios = D.places ?? []
debe(sitios.length === 34, '1h', `34 sitios en lanzarote.json (hay ${sitios.length})`)
for (const p of sitios) {
  debe(typeof p.por_que_recomendamos === 'string' && p.por_que_recomendamos.length > 20, '1i', `«${p.name}» con por_que_recomendamos`)
  debe(typeof p.description === 'string' && p.description.length > 20, '1j', `«${p.name}» con description`)
  debe(typeof p.aparcar === 'string' && p.aparcar.length > 5, '1k', `«${p.name}» con texto de aparcar`)
}

// ── 3. «Cerca de ti» ─────────────────────────────────────────────
const cerca = crudo('src/components/route/hoy/CercaDeTi.tsx')
debe(cerca.includes("etiqueta: 'Gasolineras'") && cerca.includes("etiqueta: 'Aparcar'") && cerca.includes("etiqueta: 'Comer'"), '3a', '«Cerca de ti» en Lanzarote: gasolineras, aparcamientos y dónde comer')
debe(cerca.includes('esDestinoDeCoche(destino)') && cerca.includes("etiqueta: 'Baños'"), '3b', 'Baños y Fuentes solo en los demás destinos (Roma igual que antes)')
debe(cerca.includes('Pocas gasolineras en el norte (Haría y Arrieta): llena el depósito antes de subir.'), '3c', 'el aviso de las gasolineras del norte')
debe(/app\.post\('\/api\/cerca-de-ti-coche'/.test(servidor), '3d', 'el servidor da las gasolineras y los aparcamientos más cercanos')
debe((leer('data/pipeline_v2/gasolineras/lanzarote.json').gasolineras ?? []).length > 10 && (leer('data/pipeline_v2/aparcamientos/lanzarote.json').aparcamientos ?? []).length > 50, '3e', 'datos de gasolineras y aparcamientos de la LZ1')

// ── 4. EXPLORAR ─────────────────────────────────────────────────
const exp = crudo('src/lib/exploreLanzarote.ts')
const ids = [...exp.matchAll(/id: '([a-z_]+)',\s+label: '([^']+)'/g)].map((m) => `${m[1]}:${m[2]}`)
debe(ids.join() === 'volcanes:Volcanes,cesar_manrique:César Manrique,playas_y_charcos:Playas y charcos,miradores:Miradores,pueblos:Pueblos,bodegas:Bodegas,excursiones:Excursiones', '4a', 'las 7 categorías: Volcanes, César Manrique, Playas y charcos, Miradores, Pueblos, Bodegas y Excursiones')
const nombresCatalogo = new Set([...(D.places ?? []), ...(D.lugares_solo_lista ?? [])].map((p) => p.name))
const nombresDeCategorias = [...exp.matchAll(/'([^']+)'/g)].map((m) => m[1]).filter((n) => /^[A-ZÁÉÍÓÚ]/.test(n) && !/^(Volcanes|César Manrique|Playas y charcos|Miradores|Pueblos|Bodegas|Excursiones|atracciones|entradas|excursiones|restaurantes|hoteles|miradores)$/.test(n))
debe(nombresDeCategorias.length > 30 && nombresDeCategorias.every((n) => nombresCatalogo.has(n)), '4c', `cada sitio de las categorías existe en el catálogo (${nombresDeCategorias.filter((n) => !nombresCatalogo.has(n)).join('; ') || 'todos'})`)
const panelExp = crudo('src/components/route/ExplorePanel.tsx')
debe(panelExp.includes('CATEGORIAS_EXPLORAR_LANZAROTE') && panelExp.includes('lugaresDeCategoriaLanzarote(categoriaLz, curatedPool)'), '4d', 'EXPLORAR de Lanzarote pinta sus categorías y abre cada una con sus sitios')
debe(/\['Mirador del Río'|'Mirador del Río'/.test(exp) && (exp.match(/'Mirador del Río'/g) ?? []).length === 2, '4e', 'un sitio puede estar en dos categorías (el Mirador del Río, en Manrique y en Miradores)')
debe((D.lugares_solo_lista ?? []).some((p) => p.id === 'charco_del_palo' && p.nudista === true) && /place\.nudista === true \? 'Zona nudista'/.test(servidor), '4f', 'el Charco del Palo solo en EXPLORAR, con «Zona nudista»')
debe(!(D.places ?? []).some((p) => p.id === 'charco_del_palo' || p.id === 'museo_atlantico'), '4g', 'el Charco del Palo y el Museo Atlántico no son paradas de la ruta')

// ── 5. El formulario y el coche en RESERVAS ──────────────────────
const comp = sinComentarios(crudo('src/components/trazo/StepCompanion.tsx'))
debe(!/¿Vas a moverte en coche\?|data-pregunta-coche|Sí, de alquiler|Sí, el mío/.test(comp), '5a', 'el formulario ya no pregunta «¿Vas a moverte en coche?»')
debe(/onChange\(\{ coche: 'alquiler' \}\)/.test(comp), '5b', 'por defecto, «Coche de alquiler»')
const cocheDia = sinComentarios(crudo('src/components/route/dayDetail/CocheDelDia.tsx'))
debe(!/¿Sin coche\?|data-sin-coche|sinCoche/.test(cocheDia), '5c', 'fuera el aviso «sin coche» y la línea «¿Sin coche?» de cada día')
const bloque = crudo('src/components/route/reservas/CocheDeViaje.tsx')
debe(bloque.includes("'Coche de alquiler'") && bloque.includes("'Mi coche'") && bloque.includes('role="radiogroup"'), '5d', 'RESERVAS: el interruptor «Coche de alquiler | Mi coche»')
debe(bloque.includes("answers.coche === 'propio' ? 'propio' : 'alquiler'"), '5e', 'por defecto, «Coche de alquiler»')
debe(/coche === 'propio' \? \([\s\S]{0,400}data-coche-listo/.test(bloque) && bloque.includes('Listo') && bloque.includes('Falta') && bloque.includes('Vas con tu coche por la isla.'), '5f', '«Mi coche» (06b): «Listo», sin nada que rellenar; «Coche de alquiler» (06a): «Falta» hasta poner el alquiler')
debe(bloque.includes('Recogida y devolución') && bloque.includes('RECOGIDA') && bloque.includes('DEVOLUCIÓN') && bloque.includes('¿Para quién es?') && bloque.includes('Reservar coche') && bloque.includes('data-coche-reservar'), '5f2', 'Design 06a: filas «Recogida y devolución» con sus fechas, «¿Para quién es?» y botón «Reservar coche»')
debe(bloque.includes('linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)') && bloque.includes('rgba(190,60,95,.12)') && bloque.includes('#EAF4EC') && !bloque.includes('RentalVehicleRow'), '5f3', 'colores de Design (botón de oro, «Falta» frambuesa, «Listo» verde) y sin la tarjeta morada de «Vehículo de alquiler»')
debe(/buildCarRentalLink/.test(bloque), '5g', 'el botón de reservar usa nuestro enlace de alquiler (vehicleRentalLinks.ts)')
debe(bloque.includes('¿No vas a conducir?') && bloque.includes('Mira las excursiones con recogida en tu hotel') && bloque.includes("categoria: 'excursiones'"), '5h', 'la línea «¿No vas a conducir?» abre EXPLORAR › Excursiones')
debe(bloque.includes('adaptarDiasDeCoche({ cambioDeCoche: true })') && crudo('src/lib/adaptarVuelos.ts').includes('cambioDeCoche'), '5i', 'al cambiar de coche se rehace el día 1 (el rato de recoger: alquiler 30-45, propio 20)')
debe(crudo('src/components/route/ReservasPanel.tsx').includes('<CocheDeViaje />') && /hasRentalVehicle = [^\n]*!esDestinoDeCoche/.test(crudo('src/components/route/reservas/UtilParaElViaje.tsx')), '5j', 'el bloque del coche está en RESERVAS y no se repite en «Útil para el viaje»')
debe(/setCocheDeViaje: \(coche\) =>/.test(crudo('src/store/useRouteStore.ts')), '5k', 'el interruptor guarda `answers.coche` y la propiedad del vehículo')

// ── 6. Ningún texto de Roma en un viaje a Lanzarote ──────────────
const menu = crudo('src/components/route/dayDetail/DayMenu.tsx')
debe(/deCoche \? 'La Graciosa, Fuerteventura…' : 'Pompeya, Florencia/.test(menu) && /deCoche \? 'Volcanes, playas, miradores…'/.test(menu), '6a', 'el menú del día (DayMenu) sin Pompeya ni Florencia en Lanzarote')
const vuelo = crudo('src/components/route/reservas/HojaDelVuelo.tsx')
debe(/esDestinoDeCoche\(nombreDelDestino\) \? "Aeropuerto de Lanzarote" : "Ciampino"/.test(vuelo), '6b', 'el ejemplo en gris de los campos sin «Ciampino» en Lanzarote')
const lista = crudo('src/components/pase/lista/listaDeCoche.ts')
for (const t of ['o el ferry', 'los minutos en coche', 'Gasolineras, aparcamientos y dónde comer', 'los 12 sitios', 'Vuelve a Lanzarote cuando quieras', 'Los avisos del día', 'LOGROS']) debe(lista.includes(t), '6c', `la lista del pase de Lanzarote lleva «${t}»`)
debe(crudo('src/components/pase/ListaDelPase.tsx').includes('listaParaDestino(SECCIONES_DE_LA_LISTA, destino)') && crudo('src/components/route/hoy/HoySinPase.tsx').includes('tarjetasDeHoyParaDestino(TARJETAS_DE_HOY, destino)'), '6d', 'la lista del pase y HoySinPase usan la de Lanzarote')
const textosLz = [lista, crudo('src/lib/exploreLanzarote.ts'), bloque, aparcarFn, cerca.slice(cerca.indexOf('deCoche ?'))].join('\n')
debe(!/Pompeya|Florencia|Ciampino|Vaticano|Fiumicino|Coliseo/.test(sinComentarios(textosLz.replace(/'Los sellos de Roma[^']*'/g, ''))), '6e', 'los textos nuevos de Lanzarote no nombran nada de Roma')

// ── Por HTTP (solo si la API enseña Lanzarote) ───────────────────
const B = 'http://localhost:8787'
const post = async (ruta, cuerpo) => {
  const r = await fetch(B + ruta, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo), signal: AbortSignal.timeout(60000) })
  return { s: r.status, j: await r.json().catch(() => null) }
}
try {
  const cat = await post('/api/destination-places', { destination: 'Lanzarote' })
  if (cat.j?.found) {
    const lugares = cat.j.places.filter((p) => p.kind === 'place')
    debe(lugares.filter((p) => p.aparcar).length >= 34, 'H1', `el catálogo trae «aparcar» en los 34 sitios (${lugares.filter((p) => p.aparcar).length})`)
    debe(!JSON.stringify(cat.j).includes('aparcar_verificar'), 'H2', 'ni rastro de aparcar_verificar en lo que recibe el viajero')
    const palo = lugares.find((p) => p.name === 'Charco del Palo')
    debe(palo?.booking_note === 'Zona nudista', 'H3', 'el Charco del Palo sale con «Zona nudista»')
    const cc = await post('/api/cerca-de-ti-coche', { destination: 'Lanzarote', lat: 29.0, lng: -13.5 })
    debe(cc.j?.gasolineras?.length > 0 && cc.j?.aparcamientos?.length > 0 && cc.j.gasolineras[0].km <= cc.j.gasolineras[cc.j.gasolineras.length - 1].km, 'H4', '«Cerca de ti»: gasolineras y aparcamientos ordenados por cercanía')
    const romaCerca = await post('/api/cerca-de-ti-coche', { destination: 'Roma', lat: 41.9, lng: 12.5 })
    debe((romaCerca.j?.gasolineras ?? []).length === 0, 'H5', 'Roma no tiene gasolineras en «Cerca de ti»')
    // La misma ruta y los mismos trayectos con «Coche de alquiler» y con «Mi coche».
    const resp = (extra) => ({ origin: 'Madrid', days: 6, companion: 'pareja', experiences: ['imprescindibles'], experiencesPositive: ['imprescindibles'], chronotype: 'normal', budgetLevel: 'medio', dateRange: { start: '2026-11-09', end: '2026-11-14' }, month: 10, season: 'otoño', ...extra })
    const todos = [1, 2, 3, 4, 5].map((n) => ({ day_number: n, type: 'city' }))
    const firma = (day) => JSON.stringify((day?.stops ?? []).map((s) => [s.name, s.suggested_time, s.trayecto_previo?.texto ?? null]))
    for (const dia of [2, 3]) {
      const a = await post('/api/rebuild-day', { destination: 'Lanzarote', answers: resp({ coche: 'alquiler' }), all_days: todos, day_number: dia, pase: false })
      const p = await post('/api/rebuild-day', { destination: 'Lanzarote', answers: resp({ coche: 'propio' }), all_days: todos, day_number: dia, pase: false })
      debe(a.j?.day && firma(a.j.day) === firma(p.j?.day), 'H6', `día ${dia}: la misma ruta y los mismos trayectos con «Coche de alquiler» y con «Mi coche»`)
      debe(a.j?.day?.sin_coche == null, 'H7', `día ${dia}: sin «¿Sin coche?»`)
      const paradas = a.j?.day?.stops ?? []
      const nombres = paradas.map((s) => `${s.name}`)
      debe(nombres.length === new Set(paradas.map((s) => `${s.name}|${s.suggested_time}`)).size, 'H8', `día ${dia}: ninguna parada repetida con el mismo nombre y la misma hora`)
    }
    const dia1a = await post('/api/rebuild-day', { destination: 'Lanzarote', answers: resp({ coche: 'alquiler' }), all_days: todos, day_number: 1, pase: false, llegada: { hora: '14:30', medio: 'avion' } })
    const dia1p = await post('/api/rebuild-day', { destination: 'Lanzarote', answers: resp({ coche: 'propio' }), all_days: todos, day_number: 1, pase: false, llegada: { hora: '14:30', medio: 'avion' } })
    const ra = dia1a.j?.day?.llegada_aeropuerto?.recoger_coche_min
    const rp = dia1p.j?.day?.llegada_aeropuerto?.recoger_coche_min
    debe(ra >= 30 && ra <= 45 && rp === 20, 'H9', `el día 1: recoger el coche ${ra} min (alquiler, de 30 a 45) y ${rp} min (propio, 20)`)
  } else {
    console.log('(la API no enseña Lanzarote —está oculto—: se salta la parte por HTTP; arráncala con DESTINOS_OCULTOS=- para pasarla)')
  }
} catch {
  console.log('(la API no responde: se salta la parte por HTTP)')
}

console.log(`pruebaTandaLZ2b1_B: ${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO ${f.regla}: ${f.texto}`)
process.exitCode = fallos.length ? 1 : 0
