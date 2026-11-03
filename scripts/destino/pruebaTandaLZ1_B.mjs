// LZ1 (agente B), apartado 2: LOS DATOS DE LANZAROTE. Sin navegador ni servidor.
//   node scripts/destino/pruebaTandaLZ1_B.mjs
// Comprueba: los archivos existen y se leen; zona horaria Atlantic/Canary; cada sitio de LANZAROTE_SITIOS.md con sus datos completos o con su `verificar`
// (nombre, zona, coordenadas, horario con FUENTE y FECHA, precio, reserva, duración, «por dentro/por fuera», carrito, nivel); Timanfaya y la Cueva solo online con día y hora;
// Jameos y la Cueva sin carrito; aviso de pistas de tierra; los días solo nombran sitios que existen; atardeceres y cortes de luz; «Cerca de mí» con gasolineras y aparcamientos
// (y no baños ni fuentes); y ningún texto con «Roma».
import fs from 'node:fs'
import { verPorDeLugar } from '../../shared/verPor.js'
import { sunsetMinutesOn } from '../../shared/routeEngine/sunset.js'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (ruta) => JSON.parse(fs.readFileSync(ruta, 'utf8'))
const crudo = (ruta) => fs.readFileSync(ruta, 'utf8')

// ── 1. Los archivos ─────────────────────────────────────────────────────────────────────────────────────
const RUTAS = ['data/pipeline_v2/lanzarote.json', 'data/dias/lanzarote/listas.json', 'data/dias/lanzarote/_destino.json', 'data/dias/lanzarote/_mapa.json', 'data/dias/lanzarote/_entradas.json', 'data/pipeline_v2/gasolineras/lanzarote.json', 'data/pipeline_v2/aparcamientos/lanzarote.json']
for (const ruta of RUTAS) debe(fs.existsSync(ruta), '1a', `existe ${ruta}`)
const D = leer('data/pipeline_v2/lanzarote.json')
const L = leer('data/dias/lanzarote/listas.json')
const paradas = fs.existsSync('data/dias/lanzarote/_paradas.json') ? leer('data/dias/lanzarote/_paradas.json') : { paradas: [] }

// ── 2. El destino ───────────────────────────────────────────────────────────────────────────────────────
debe(D.destination === 'Lanzarote' && D.country === 'España', '2a', 'destino Lanzarote, España')
debe(D.timezone === 'Atlantic/Canary', '2b', 'zona horaria Atlantic/Canary (una hora menos que la península)')
debe(D.destination_config?.medio === 'coche' && D.destination_config?.tope_coche_dia_min === 180, '2c', 'medio coche con tope de 3 h al día')
debe(D.destination_config?.sin_paseo_nocturno === true && Array.isArray(D.night_experiences) && D.night_experiences.length === 0, '2d', 'sin paseo nocturno (ajuste del destino)')
debe((D.excursions?.options ?? []).map((o) => o.id).join() === 'la_graciosa,fuerteventura,isla_de_lobos', '2e', 'excursiones: La Graciosa, Fuerteventura e Isla de Lobos')
debe((D.destination_config?.zonas_alojamiento ?? []).map((z) => z.id).join() === 'puerto_del_carmen,playa_blanca,costa_teguise,arrecife,el_norte,el_interior,nose', '2f', 'las 6 zonas de alojamiento y «Aún no lo sé»')
debe(Array.isArray(D.restaurants) && D.restaurants.length === 0 && !('por_que_lugares' in D) && !('fechas_especiales' in D), '2g', 'NO lleva restaurantes, textos «por qué», ni fechas especiales (son de la LZ2)')

// ── 3. Cada sitio de LANZAROTE_SITIOS.md ────────────────────────────────────────────────────────────────
const SITIOS = [
  ['montanas_del_fuego', 1], ['jameos_del_agua', 1], ['cueva_de_los_verdes', 1], ['mirador_del_rio', 1], ['fundacion_cesar_manrique', 1], ['el_golfo_y_el_charco_de_los_clicos', 1], ['la_geria_y_sus_bodegas', 1],
  ['playas_de_papagayo', 2], ['caleton_blanco', 2], ['jardin_de_cactus', 2], ['los_hervideros', 2], ['salinas_de_janubio', 2], ['teguise', 2], ['haria_y_la_casa_museo_cesar_manrique', 2], ['casa_museo_del_campesino', 2],
  ['caleta_de_famara_y_playa_de_famara', 2], ['arrecife_charco_de_san_gines_y_el_paseo', 2], ['castillo_de_san_jose', 2],
  ['lagomar', 3], ['ermita_de_las_nieves', 3], ['mirador_de_guinate', 3], ['ciudad_estratificada_rofera_de_teseguite', 3], ['playa_de_montana_bermeja', 3], ['las_grietas_montana_blanca', 3], ['mirador_del_bosquecillo', 3],
  ['mirador_de_haria', 3], ['castillo_de_santa_barbara', 3], ['punta_mujeres_y_arrieta', 3], ['playa_blanca_y_el_faro_de_pechiguera', 3], ['puerto_del_carmen_puerto_viejo', 3], ['volcan_del_cuervo', 3], ['caldera_blanca', 3],
]
const porId = new Map(D.places.map((p) => [p.id, p]))
const idsRepetidos = D.places.length !== porId.size
debe(!idsRepetidos, '3a', 'ningún id de sitio repetido')
const hayHorario = (p) => p.windows != null || p.schedule != null || p.is_free_access === true || p.abierto_24h === true
const hayPrecio = (p) => p.precio != null && typeof p.precio === 'object'
const dentroDeLaIsla = ([la, lo]) => la > 28.8 && la < 29.3 && lo > -13.95 && lo < -13.35
for (const [id, nivel] of SITIOS) {
  const p = porId.get(id)
  debe(Boolean(p), '3b', `${id}: existe en lanzarote.json`)
  if (!p) continue
  debe(typeof p.name === 'string' && p.name.length > 2 && typeof p.zone === 'string' && D.zones[p.zone], '3c', `${id}: nombre y zona (${p.zone})`)
  debe(p.level === nivel, '3d', `${id}: nivel de la pirámide ${nivel} (hay ${p.level})`)
  debe(Array.isArray(p.coordinates) ? dentroDeLaIsla(p.coordinates) : /Coordenadas del aparcamiento pendientes/.test(p.verificar ?? ''), '3e', `${id}: coordenadas [lat,lng] dentro de la isla (o marcadas con verificar)`)
  debe((hayHorario(p) || /Horario/.test(p.verificar ?? '')) && p.hours_audit?.fuente && /^\d{4}-\d{2}-\d{2}$/.test(p.hours_audit?.fecha ?? ''), '3f', `${id}: horario con FUENTE y FECHA`)
  debe(hayPrecio(p) || p.is_free_access === true || p.extra?.precio, '3g', `${id}: precio (o es de acceso libre)`)
  debe(Number.isFinite(p.duration_minutes) && p.duration_minutes > 0, '3h', `${id}: duración`)
  debe(p.type === 'interior' || p.type === 'exterior', '3i', `${id}: tipo interior/exterior`)
  debe(p.reservation == null || ['obligatoria', 'recomendada', 'no'].includes(p.reservation), '3j', `${id}: reserva válida`)
  debe(Number.isFinite(p.aparcar_min) || /pendientes/.test(p.verificar ?? ''), '3k', `${id}: rato de aparcar (aparcar_min) de la parada de C`)
  debe(p.comprobado && /^\d{4}-\d{2}-\d{2}$/.test(p.comprobado), '3l', `${id}: «comprobado: <fecha>»`)
}
// «por dentro / por fuera» con la tabla de la 10S10 (shared/verPor.js)
const VER_POR = {
  montanas_del_fuego: 'solo_dentro', jameos_del_agua: 'solo_dentro', cueva_de_los_verdes: 'solo_dentro', mirador_del_rio: 'solo_dentro', fundacion_cesar_manrique: 'solo_dentro', la_geria_y_sus_bodegas: 'dentro_y_fuera',
  jardin_de_cactus: 'solo_dentro', haria_y_la_casa_museo_cesar_manrique: 'dentro_y_fuera', casa_museo_del_campesino: 'dentro_y_fuera', castillo_de_san_jose: 'dentro_y_fuera', lagomar: 'solo_dentro',
  el_golfo_y_el_charco_de_los_clicos: null, playas_de_papagayo: null, caleton_blanco: null, los_hervideros: null, salinas_de_janubio: null, teguise: null, caleta_de_famara_y_playa_de_famara: null,
  arrecife_charco_de_san_gines_y_el_paseo: null, castillo_de_santa_barbara: null,
}
for (const [id, esperado] of Object.entries(VER_POR)) debe(porId.has(id) && verPorDeLugar(porId.get(id)) === esperado, '3m', `${id}: por dentro/por fuera = ${esperado} (shared/verPor.js lo lee igual)`)

// Lo marcado ⚠️ en los documentos lleva `verificar`
const CON_VERIFICAR = ['montanas_del_fuego', 'jameos_del_agua', 'cueva_de_los_verdes', 'mirador_del_rio', 'fundacion_cesar_manrique', 'el_golfo_y_el_charco_de_los_clicos', 'la_geria_y_sus_bodegas', 'playas_de_papagayo', 'caleton_blanco', 'los_hervideros',
  'salinas_de_janubio', 'teguise', 'haria_y_la_casa_museo_cesar_manrique', 'casa_museo_del_campesino', 'lagomar', 'castillo_de_santa_barbara', 'las_grietas_montana_blanca', 'volcan_del_cuervo']
for (const id of CON_VERIFICAR) debe(typeof porId.get(id)?.verificar === 'string' && porId.get(id).verificar.length > 5, '3n', `${id}: lleva su «verificar» (⚠️ del documento)`)

// Reservas, carrito y pistas de tierra
for (const id of ['montanas_del_fuego', 'cueva_de_los_verdes']) {
  const p = porId.get(id)
  debe(p?.reservation === 'obligatoria' && p.reserva_solo_online === true && p.reserva_con_dia_y_hora === true && p.reserva_paso === 15, '3o', `${id}: reserva obligatoria, SOLO online, con día y hora, llegada 15 min antes`)
}
debe(porId.get('montanas_del_fuego')?.precio?.adulto === 30 && porId.get('cueva_de_los_verdes')?.precio?.adulto === 17, '3p', 'Timanfaya 30 € y Cueva 17 €')
debe(porId.get('jameos_del_agua')?.carrito === 'no' && porId.get('cueva_de_los_verdes')?.carrito === 'no', '3q', 'Jameos y la Cueva no dejan pasar el carrito')
debe(porId.get('montanas_del_fuego')?.carrito === 'dificil' && porId.get('mirador_del_rio')?.carrito === 'dificil', '3r', 'Timanfaya y el Mirador del Río: carrito difícil')
for (const id of ['playas_de_papagayo', 'las_grietas_montana_blanca', 'mirador_del_bosquecillo']) {
  debe((porId.get(id)?.avisos ?? []).some((a) => a.tipo === 'pista_de_tierra' && /seguro cubre las pistas de tierra/.test(a.texto)), '3s', `${id}: aviso «Revisa si tu seguro cubre las pistas de tierra»`)
}
debe(porId.get('playas_de_papagayo')?.precio?.por_coche === 3, '3t', 'Papagayo: 3 € por coche')
debe(porId.get('jameos_del_agua')?.noche_de_jameos?.dia === 'viernes' && porId.get('jameos_del_agua').noche_de_jameos.precio_menu.adulto === 98, '3u', 'Jameos: Noches de Jameos los viernes, menú 98 €')
debe(porId.get('teguise')?.mercadillo?.dia === 'domingo' && porId.get('haria_y_la_casa_museo_cesar_manrique')?.mercado?.dia === 'sábado', '3v', 'Teguise mercadillo de domingo; Haría mercado de sábado')
debe(porId.get('fundacion_cesar_manrique')?.closed_dates?.includes('01-01') && porId.get('haria_y_la_casa_museo_cesar_manrique')?.closed_dates?.includes('01-01'), '3w', 'La Fundación y la Casa-Museo cierran el 1 de enero')
debe(porId.get('la_geria_y_sus_bodegas')?.bodegas?.find((b) => b.id === 'bodega_el_grifo')?.cerrada?.includes('domingo'), '3x', 'El Grifo cerrado en fin de semana')
debe(D.lugares_solo_lista.some((l) => l.id === 'charco_del_palo' && l.nudista) && D.lugares_solo_lista.some((l) => l.id === 'museo_atlantico'), '3y', 'Charco del Palo (nudista) y Museo Atlántico solo en la lista de EXPLORAR')
debe(!porId.has('charco_del_palo') && !porId.has('museo_atlantico'), '3z', 'Charco del Palo y Museo Atlántico NO están en la ruta')
// Las coordenadas de C
for (const par of paradas.paradas) {
  const p = porId.get(par.id)
  if (!p || !Array.isArray(p.coordinates)) continue
  const [lng, lat] = Math.abs(par.coordinates[0]) < Math.abs(par.coordinates[1]) ? par.coordinates : [par.coordinates[1], par.coordinates[0]]
  debe(Math.abs(p.coordinates[0] - lat) < 1e-6 && Math.abs(p.coordinates[1] - lng) < 1e-6, '3A', `${par.id}: coordenadas = las del aparcamiento de _paradas.json`)
}

// ── 4. Los días, solo como datos ────────────────────────────────────────────────────────────────────────
const nombres = new Set(D.places.map((p) => p.name))
debe(['D1', 'D2', 'D3', 'D4', 'D5', 'DG', 'DF'].every((id) => L.dias[id]), '4a', 'los días D1-D5, La Graciosa y Fuerteventura')
let paradasDeDias = 0
for (const [id, dia] of Object.entries(L.dias)) {
  for (const franja of ['manana', 'tarde']) for (const s of dia.partes?.unica?.[franja] ?? []) {
    if (s.tipo !== 'parada') continue
    paradasDeDias += 1
    if (id === 'DG' && s.lugar === 'La Laja o El Salado') continue
    debe(nombres.has(s.lugar), '4b', `${id}: la parada «${s.lugar}» existe en los sitios`)
  }
  for (const va of dia.variantes ?? []) {
    for (const extra of [va.sitio_extra, ...(va.sitios_extra ?? [])].filter(Boolean)) debe(porId.has(extra), '4c', `${id}/${va.id}: el sitio extra ${extra} existe`)
  }
  debe(dia.partes?.unica?.cena == null || (dia.partes.unica.cena.restaurante == null), '4d', `${id}: sin restaurante escrito (son de la LZ2)`)
  debe(dia.partes?.unica?.noche === undefined, '4e', `${id}: sin noche (sin paseo nocturno)`)
}
debe(paradasDeDias >= 25, '4f', `los días llevan paradas (${paradasDeDias})`)
debe(L.dias.D1.partes.unica.manana[0].hora_tipo === 'turno' && L.dias.D1.partes.unica.manana[0].llegada_antes_min === 15, '4g', 'D1: Timanfaya es parada fija con turno y «Llegada a…» 15 min antes')
debe(L.dias.D2.partes.unica.manana[1].lugar === 'Cueva de los Verdes' && L.dias.D2.partes.unica.manana[1].hora_tipo === 'turno', '4h', 'D2: la Cueva de los Verdes con turno')
debe(L.dias.D2.no_ultimo_dia === true && L.reparto.por_dias['5'].join() === 'D1,D2,D3,DG,D4', '4i', 'D2 nunca el último; 5 días = D1·D2·D3·La Graciosa·D4')
debe(Object.values(L.dias).every((d) => d.sin_coche && 'excursion' in d.sin_coche), '4j', 'cada día lleva su «¿Sin coche?»')

// ── 5. Atardeceres y cortes de luz ──────────────────────────────────────────────────────────────────────
const centro = D.zones.centro.center
const sol = (f) => sunsetMinutesOn(f, centro, D.timezone)
const aprox = (m, h, mn, tol = 6) => m != null && Math.abs(m - (h * 60 + mn)) <= tol
debe(aprox(sol('2026-11-08'), 18, 5), '5a', `atardecer del 8-nov ~18:05 (sunset.js, ${sol('2026-11-08')})`)
debe(aprox(sol('2026-12-21'), 18, 0), '5b', 'atardecer del 21-dic ~18:00')
debe(aprox(sol('2027-06-21'), 20, 55), '5c', 'atardecer del 21-jun ~20:55')
debe(aprox(sol('2027-03-20'), 19, 5), '5d', 'atardecer del 20-mar ~19:05 (antes del cambio de hora)')
const cortes = D.destination_config.cortes_luz
const aMin = (h) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3))
debe(Array.isArray(cortes) && cortes.length === 3 && aMin(cortes[0]) < aMin(cortes[1]) && aMin(cortes[1]) < aMin(cortes[2]), '5e', `3 cortes de luz crecientes (${cortes})`)
debe(aMin(cortes[0]) > aMin('17:56') && aMin(cortes[2]) < aMin('20:57'), '5f', 'los cortes caen dentro del rango de atardeceres del año')
debe(leer('data/dias/lanzarote/_destino.json').cortes_luz.join() === cortes.join(), '5g', '_destino.json lleva los mismos cortes')
const estaciones = D.destination_config.sunset_by_season
debe(['invierno', 'primavera', 'verano', 'otono'].every((e) => /^\d\d:\d\d$/.test(estaciones[e])) && aMin(estaciones.invierno) < aMin(estaciones.otono) && aMin(estaciones.otono) < aMin(estaciones.primavera) && aMin(estaciones.primavera) < aMin(estaciones.verano), '5h', 'atardecer por estación (invierno < otoño < primavera < verano)')

// ── 6. «Cerca de mí»: gasolineras y aparcamientos ───────────────────────────────────────────────────────
const G = leer('data/pipeline_v2/gasolineras/lanzarote.json')
const A = leer('data/pipeline_v2/aparcamientos/lanzarote.json')
debe(D.cerca_de_mi?.tipos?.join() === 'gasolineras,aparcamientos', '6a', '«Cerca de mí» = gasolineras y aparcamientos (no baños ni fuentes)')
debe(!('banos' in D) && !fs.existsSync('data/pipeline_v2/banos/lanzarote.json') && !fs.existsSync('data/pipeline_v2/fuentes/lanzarote.json'), '6b', 'Lanzarote no lleva archivos de baños ni de fuentes')
debe(G.gasolineras.length >= 20 && G.gasolineras.every((g) => dentroDeLaIsla([g.lat, g.lng]) && g.id), '6c', `gasolineras (${G.gasolineras.length}), todas en la isla`)
debe(/OpenStreetMap/.test(G.fuente) && /ODbL/.test(G.licencia) && /^\d{4}-\d{2}-\d{2}$/.test(G.descargado), '6d', 'gasolineras con fuente, licencia y fecha')
const norte = G.gasolineras.filter((g) => g.lat > 29.1)
debe(norte.length >= 1 && norte.length <= 4, '6e', `pocas gasolineras en el norte (lat > 29,1): ${norte.length}`)
debe(G.gasolineras.some((g) => Math.abs(g.lat - 28.945) < 0.03 && Math.abs(g.lng + 13.6) < 0.05), '6f', 'hay gasolinera cerca del aeropuerto')
debe(A.aparcamientos.length >= 40 && A.aparcamientos.every((a) => dentroDeLaIsla([a.lat, a.lng]) && a.id), '6g', `aparcamientos (${A.aparcamientos.length}), todos en la isla`)
debe(/OpenStreetMap/.test(A.fuente) && /ODbL/.test(A.licencia) && /^\d{4}-\d{2}-\d{2}$/.test(A.descargado), '6h', 'aparcamientos con fuente, licencia y fecha')
debe(/Haría y Arrieta|Haría pueblo y Arrieta/.test(D.cerca_de_mi.pocas_en_el_norte + G.nota), '6i', 'aviso: pocas gasolineras en el norte (Haría y Arrieta)')

// ── 7. Ningún texto con «Roma» ──────────────────────────────────────────────────────────────────────────
for (const ruta of RUTAS.slice(0, 5)) {
  const t = crudo(ruta)
  debe(!/\bRoma\b|Fiumicino|Ciampino|Europe\/Rome/.test(t), '7a', `${ruta}: ningún texto con «Roma»`)
}
// ── 8. Roma no cambia ───────────────────────────────────────────────────────────────────────────────────
debe(!/lanzarote/i.test(crudo('data/pipeline_v2/roma.json').slice(0, 2000)), '8a', 'roma.json no menciona Lanzarote')

console.log(`pruebaTandaLZ1_B: ${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO ${f.regla}: ${f.texto}`)
process.exitCode = fallos.length ? 1 : 0
