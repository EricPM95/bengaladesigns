/**
 * Motor en coche (LZ2a, agente A): los días de un destino que se recorre en coche (Lanzarote: `destination_config.medio === 'coche'`).
 * Lee los días escritos (`data/dias/<destino>/listas.json`) y los mide con la tabla de coche de Mapbox (`data/pipeline_v2/travel/<destino>_coche.json`)
 * y el rato de aparcar de `_paradas.json`. Es una función pura (los datos se los pasa `server/engine/cocheData.js`). El contrato con la app,
 * en docs/dias/_estado_lz2a_contrato.md.
 *
 * Reglas (Eric, 2-3 nov): dentro de una parada se va a pie; entre paradas, en coche (+ aparcar); la ida desde el alojamiento y la vuelta a casa
 * cuentan; tope de 3 h de coche al día; los opcionales salen solo si caben (se quita primero el menos importante); sin paseo nocturno; cena cerca
 * del alojamiento. Roma no pasa por aquí.
 */
import { sunsetFor } from './sunset.js'

const hm = (s) => { const [h, m] = String(s).split(':').map(Number); return h * 60 + m }
const fh = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.round(m) % 60).padStart(2, '0')}`
const MARGEN_TURNO_DEFECTO = 15
export const ZONAS_COCHE = ['puerto_del_carmen', 'playa_blanca', 'costa_teguise', 'arrecife', 'el_norte', 'el_interior']
const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

/** Dónde se come (texto de la zona de la comida del día) → parada donde se aparca. */
const COMIDA_A_PARADA = [
  [/La Geria/i, 'bodega_la_geria'], [/El Golfo/i, 'el_golfo_y_el_charco_de_los_clicos'], [/Har[ií]a/i, 'haria_y_la_casa_museo_cesar_manrique'], [/Teguise/i, 'teguise'],
  [/Marina Rubic[oó]n|Playa Blanca/i, 'marina_rubicon'], [/Famara/i, 'caleta_de_famara_y_playa_de_famara'], [/Arrecife/i, 'arrecife_charco_de_san_gines_y_el_paseo'],
]

/* ───────────────────────────── el coche ───────────────────────────── */

export function crearCoche({ matriz, paradas }) {
  const idx = new Map(matriz.points.map((p, i) => [p.refs[0].id, i]))
  const SEC = matriz.modes.driving.seconds
  const MET = matriz.modes.driving.meters
  const park = new Map(paradas.paradas.map((p) => [p.id, p]))
  const zonas = new Map((paradas.zonas_alojamiento ?? []).map((z) => [z.id, z]))
  const tiene = (id) => idx.has(id)
  const min = (a, b) => (a === b || !tiene(a) || !tiene(b) ? 0 : Math.round(SEC[idx.get(a)][idx.get(b)] / 60))
  const km = (a, b) => (a === b || !tiene(a) || !tiene(b) ? 0 : Math.round(MET[idx.get(a)][idx.get(b)] / 100) / 10)
  const aparcar = (id, domingo) => { const p = park.get(id); return p ? (domingo && p.aparcar_min_domingo != null ? p.aparcar_min_domingo : p.aparcar_min ?? 0) : 0 }
  const punto = (id) => {
    const p = park.get(id) ?? zonas.get(id)
    return p ? { nombre: p.nombre, lat: p.coordinates[1], lng: p.coordinates[0] } : null
  }
  return { min, km, aparcar, punto, tiene, park, zonas }
}

const mapsUrl = (p) => (p ? `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving` : null)

/* ───────────────────────────── qué día va cada día ───────────────────────────── */

/**
 * Los ids de los días de un viaje (DIAS_CURADOS_LANZAROTE.md, apartado 3 + prioridades de `reparto`): D1 el primero; el domingo, el D3 (si no es el día 1);
 * el sábado, el D2 (si no es el primero ni el último; el D2 nunca el último); la romería de Los Dolores (el sábado antes del 15-sep): ese sábado ni D1 ni D5.
 * Más allá de 7 días, `BLANCO` (día en blanco con sugerencias de playa).
 */
export function diasDelViaje(a) { return repartoLL(a).ids }

/**
 * LL (Eric, 4-nov): con la hora de llegada (solo con pase) el día 1 es el de llegada, `LL`, y el primer día ENTERO es el D1 (Timanfaya), salvo tras una llegada
 * de noche (filas E y F): el día 2 es entonces el D2 y el D1 pasa al 3. El día que ya hace la llegada (D3, o D4 en Playa Blanca, en las filas A y B) sale de la lista;
 * si el vuelo sale a las 17:00 o más tarde y el D3 sigue en el viaje, su versión corta va el día de vuelta (`d3Vuelta`) y entra el siguiente día de la tabla.
 * Devuelve { ids, d3Vuelta }.
 */
export function repartoLL({ reparto, contentDays, startIso = null, experiences = [], ll = null, vuelta = null }) {
  const n = Math.max(1, Math.floor(contentDays || 1))
  const tabla = reparto?.por_dias ?? {}
  let base = n === 1 ? ['D1'] : [...(tabla[String(Math.min(n, 7))] ?? tabla['7'] ?? ['D1'])]
  const exp = reparto?.experiencias ?? {}
  for (const id of experiences) { const alt = exp[id]?.[String(n)]; if (alt) { base = [...alt]; break } }
  let d3Vuelta = false
  let ids
  if (ll) {
    let resto = base.filter((id) => id !== ll.absorbe)
    if (vuelta?.d3Corto && resto.includes('D3')) { d3Vuelta = true; resto = resto.filter((id) => id !== 'D3') }
    if (ll.nocheLlegada && resto[0] === 'D1' && resto[1] === 'D2') [resto[0], resto[1]] = [resto[1], resto[0]]
    const todos = ['LL', ...resto]
    ids = Array.from({ length: n }, (_, i) => todos[i] ?? 'BLANCO')
  } else ids = Array.from({ length: n }, (_, i) => base[i] ?? 'BLANCO')
  if (!startIso) return { ids, d3Vuelta }
  const fecha = (i) => new Date(Date.parse(`${startIso}T12:00:00Z`) + i * 86400000)
  const semana = (i) => fecha(i).getUTCDay()
  const desde = ll ? 2 : 1
  const bloqueado = new Set(ll ? [0, 1] : [0])
  const mover = (id, i) => {
    const j = ids.indexOf(id)
    if (j < 0 || j === i || bloqueado.has(j)) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    bloqueado.add(i)
  }
  for (let i = desde; i < n; i++) if (semana(i) === 0) mover('D3', i)
  for (let i = desde; i < n - 1; i++) if (semana(i) === 6 && !bloqueado.has(i)) mover('D2', i)
  // El D2 nunca el último día (si queda el último, se cambia con el anterior que no esté fijado).
  if (n >= 3 && ids[n - 1] === 'D2') {
    for (let j = n - 2; j >= desde - (ll ? 1 : 0); j--) { if (!bloqueado.has(j) || n === 3) { [ids[j], ids[n - 1]] = [ids[n - 1], ids[j]]; break } }
  }
  return { ids, d3Vuelta }
}

/* ───────────────────────────── los pasos de un día ───────────────────────────── */

const claveDe = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Variantes que SÍ lee el motor: domingo, sábado, viernes (Noches de Jameos, a petición), 1 de enero, 2 días, arte, volcanes, al revés. */
function variantesDelDia(dayId, ctx) {
  const v = []
  const { semana, mmdd, contentDays, experiences, opciones = {} } = ctx
  if (dayId === 'D1' && semana === 0) v.push('domingo')
  if (dayId === 'D1' && experiences.includes('volcanes')) v.push('volcanes')
  if (dayId === 'D1' && experiences.includes('vino')) v.push('vino')
  if (dayId === 'D2' && semana === 6) v.push('sabado')
  if (dayId === 'D2' && semana === 5 && opciones.nochesJameos) v.push('viernes_noches_de_jameos')
  if (dayId === 'D2' && mmdd === '01-01') v.push('1_enero')
  if (dayId === 'D2' && contentDays === 2) v.push('dos_dias')
  if (dayId === 'D2' && opciones.cuevaPrimero) v.push('al_reves')
  if (dayId === 'D3' && semana === 0) v.push('domingo')
  if (dayId === 'D3' && mmdd === '01-01') v.push('1_enero')
  if (dayId === 'D3' && experiences.includes('arte')) v.push('arte')
  if (dayId === 'D5' && experiences.includes('volcanes')) v.push('volcanes')
  if (dayId === 'D2' && ctx.verano && !v.includes('1_enero')) v.push('verano')
  if (dayId === 'D4' && ctx.verano) v.push('verano')
  if (dayId === 'D4' && ctx.invierno) v.push('invierno')
  if (dayId === 'D4' && opciones.kayak) v.push('kayak_snorkel')
  return v
}

/**
 * De las filas de listas.json (manana / comida / tarde / cena) a los pasos del recorrido. Un paso: { lugar, p (parada), m (min), opc, fijo (turno 'HH:MM'),
 * abre, ult, sol (hasta el atardecer), comida, cena, desde, nota, doc, modo, row }.
 */
function pasosDelDia({ dia, variantes, ctx, datos, coche, placeByName, placeById }) {
  const un = dia.partes?.unica ?? Object.values(dia.partes ?? {})[0] ?? {}
  const pasos = []
  const esVar = (id) => variantes.includes(id)
  const deParada = (row) => {
    const place = placeByName.get(row.lugar) ?? null
    // LZ2b-1: una fila puede llevar su propia parada (`parada`: el Faro de Pechiguera tiene su aparcamiento) y su nombre (`titulo`: dos filas del mismo sitio ya no salen con el mismo nombre).
    const p = row.parada ?? place?.id ?? null
    const ventana = place?.windows?.length ? place.windows : typeof place?.schedule === 'string' ? [place.schedule] : []
    const abre = ventana.length ? ventana.map((w) => hm(String(w).split('-')[0])).filter(Number.isFinite).sort((a, b) => a - b)[0] : null
    const cierre = ventana.length ? ventana.map((w) => hm(String(w).split('-')[1])).filter(Number.isFinite).sort((a, b) => b - a)[0] : null
    const m = row.min ?? place?.duration_minutes ?? 30
    const ult = place?.last_entry ? hm(place.last_entry) : cierre != null && place?.ver_por === 'solo_dentro' ? cierre - m : null
    return {
      lugar: row.lugar, titulo: row.titulo ?? null, aPie: row.a_pie_min ?? null, p, place, m, opc: Boolean(row.opcional), modo: row.modo ?? null, doc: row.doc ?? '', notas: row.notas ?? [],
      fijo: row.hora_tipo === 'turno' && row.hora ? hm(row.hora) : null, abre, ult,
      sol: Boolean(row.hasta_atardecer), llegadaAntes: row.llegada_antes_min ?? null, row,
      llegar: row.llegar_sol_menos != null && ctx.solMin != null ? ctx.solMin - row.llegar_sol_menos : null,
    }
  }
  const delRow = (row) => (row.tipo === 'parada' ? deParada(row) : null)
  let manana = (un.manana ?? []).map(delRow).filter(Boolean)
  let tarde = (un.tarde ?? []).map(delRow).filter(Boolean)
  const comidaRow = un.comida
  const nombreDe = (n) => { const pl = placeByName.get(n); return pl ? deParada({ tipo: 'parada', lugar: n, min: pl.duration_minutes }) : null }
  const quita = (arr, texto) => arr.filter((s) => !claveDe(s.lugar).includes(claveDe(texto)))
  let comidaHora = comidaRow?.hora_aprox ? hm(comidaRow.hora_aprox) : 13 * 60 + 30
  let comidaP = null
  for (const [re, id] of COMIDA_A_PARADA) if (re.test(comidaRow?.zona ?? '')) { comidaP = id; break }

  // ── variantes (lo que dice DIAS_CURADOS_LANZAROTE.md; los tiempos, los de las filas) ──
  if (dia.id === 'D1' && esVar('volcanes')) {
    const cuervo = nombreDe('Volcán del Cuervo')
    if (cuervo) { cuervo.m = 90; manana = [manana[0], cuervo, ...manana.slice(1).map((s) => (claveDe(s.lugar).includes('geria') ? { ...s, m: 30 } : s))] }
  }
  if (dia.id === 'D2' && esVar('sabado')) {
    // Jameos 10:00 → Cueva 11:30 → Haría hacia las 12:35 (mercado y comida) → Casa-Museo → Mirador del Río.
    const jameos = manana.find((s) => /Jameos/.test(s.lugar)); const cueva = manana.find((s) => /Cueva/.test(s.lugar)); const rio = manana.find((s) => /Mirador del R/.test(s.lugar))
    const haria = tarde.find((s) => /Har[ií]a y la Casa/.test(s.lugar))
    manana = [jameos, cueva].filter(Boolean)
    tarde = [haria ? { ...haria, m: 60 } : null, rio].filter(Boolean)
    comidaHora = hm('12:35')
  }
  if (dia.id === 'D2' && esVar('al_reves')) {
    const cueva = manana.find((s) => /Cueva/.test(s.lugar)); const jameos = manana.find((s) => /Jameos/.test(s.lugar))
    if (cueva && jameos) { cueva.fijo = hm('09:30'); manana = [cueva, jameos, ...manana.filter((s) => s !== cueva && s !== jameos)] }
  }
  if (dia.id === 'D2' && esVar('1_enero')) tarde = tarde.filter((s, i) => !(/Casa-Museo/.test(s.lugar) && i === 1)) // la Casa-Museo cierra: queda el pueblo y los Helechos
  if (dia.id === 'D2' && esVar('dos_dias')) {
    const fundacion = nombreDe(esVar('1_enero') ? 'LagOmar' : 'Fundación César Manrique') // (el 1 de enero la Fundación cierra: LagOmar en su lugar)
    if (fundacion) { fundacion.m = 90; tarde = [fundacion] ; manana = manana.filter((s) => !/Helechos/.test(s.lugar)) }
  }
  if (dia.id === 'D2' && esVar('viernes_noches_de_jameos')) {
    manana = [...manana.filter((s) => /Cueva/.test(s.lugar)).map((s) => ({ ...s, fijo: hm('09:30') })), ...manana.filter((s) => /Mirador del R/.test(s.lugar))]
    const jameos = nombreDe('Jameos del Agua'); if (jameos) { jameos.m = 285; jameos.fijo = hm('18:30'); jameos.nocheDeJameos = true; tarde = [...tarde.filter((s) => !/Helechos/.test(s.lugar)), jameos] }
  }
  if (dia.id === 'D3' && esVar('domingo')) {
    const teg = nombreDe('Teguise (villa)'); const cactus = nombreDe('Jardín de Cactus'); const fund = nombreDe('Fundación César Manrique')
    if (teg && cactus && fund) { teg.m = 120; teg.llegar = hm('10:00'); manana = [teg]; tarde = [cactus, fund, ...tarde.filter((s) => /Arrecife/.test(s.lugar))]; comidaHora = hm('12:30'); comidaP = 'teguise' }
  }
  if (dia.id === 'D3' && (esVar('arte') || esVar('1_enero'))) {
    const lag = nombreDe('LagOmar')
    if (esVar('1_enero')) manana = quita(manana, 'Fundación')
    if (esVar('arte')) tarde = quita(tarde, 'Castillo de Santa')
    if (lag) {
      const iCampesino = tarde.findIndex((s) => /Campesino/.test(s.lugar))
      tarde = [...tarde.slice(0, iCampesino < 0 ? tarde.length : iCampesino), lag, ...tarde.slice(iCampesino < 0 ? tarde.length : iCampesino)]
    }
  }
  if (dia.id === 'D5' && esVar('volcanes')) {
    const caldera = nombreDe('Caldera Blanca')
    if (caldera && manana.length) { caldera.m = 180; manana = [caldera, ...manana.slice(1).filter((s) => !/Ermita/.test(s.lugar) || false)] }
  }
  // D2 verano: tras la Casa-Museo, a Arrieta (La Garita), sin los Helechos; la cena, cerca del alojamiento (regla de Eric del 3-nov).
  if (dia.id === 'D2' && esVar('verano')) {
    const garita = nombreDe('Playa de La Garita')
    if (garita) { garita.m = 60; garita.opc = true; // (opcional: sale solo si el día cabe)
      tarde = [...tarde.filter((s) => !/Helechos/.test(s.lugar)), garita] }
  }
  // D4 verano: después de comer, un segundo rato de playa en Playa Blanca (+60 min) antes del paseo y el faro.
  if (dia.id === 'D4' && esVar('verano') && tarde.length) tarde = [{ ...tarde[0], m: tarde[0].m + 60 }, ...tarde.slice(1)]
  // D4 en invierno (LL, Eric 4-nov): en noviembre a marzo se llega a Papagayo hacia las 10:00, no a las 9:00 (con el sol bajo no hace falta madrugar).
  if (dia.id === 'D4' && esVar('invierno') && !esVar('kayak_snorkel') && manana.length) manana = [{ ...manana[0], llegar: 10 * 60 }, ...manana.slice(1)]
  // D4 con kayak y snorkel (Civitatis, 9:45-14:00, sale de Playa Blanca) en lugar de la playa por libre.
  if (dia.id === 'D4' && esVar('kayak_snorkel') && manana.length) {
    const pb = placeByName.get('Playa Blanca y el Faro de Pechiguera')
    manana = [{ lugar: 'Kayak y snorkel en Papagayo (Civitatis)', p: pb?.id ?? null, place: null, m: 255, opc: false, modo: 'dentro', doc: 'Kayak y snorkel en Papagayo con Civitatis (9:45-14:00): sale de Playa Blanca, sin recogida.', notas: [], fijo: hm('09:45'), abre: null, ult: null, sol: false, llegadaAntes: 0, row: {} }]
  }
  // sin_ruta de una parada (Caleta de Famara, Haría: dos filas seguidas en el mismo sitio) se queda como está: el motor las ve en el mismo sitio y las va a pie.
  for (const s of manana) pasos.push({ ...s, franja: 'manana' })
  // LL: la comida con `cerca` es «Comida cerca de tu alojamiento» (va la primera, desde la hora útil). Una comida con `adelantable` (D1) no espera a su hora: va desde las 12:30 y, si aun así sobra hueco, se alarga la parada anterior.
  if (comidaRow?.cerca) pasos.unshift({ lugar: 'Comida', comida: true, alLlegar: true, p: null, m: 75, desde: 0, row: comidaRow })
  else if (comidaRow || comidaP) pasos.push({ lugar: 'Comida', comida: true, p: comidaP ?? pasos.at(-1)?.p ?? null, m: 75, desde: comidaHora, row: comidaRow, adelantable: dia.id === 'D1' || dia.id === 'V' })
  for (const s of tarde) pasos.push({ ...s, franja: 'tarde' })
  return pasos
}

/* ───────────────────────────── el cálculo de un día desde una zona ───────────────────────────── */

/**
 * Mide un día de pasos desde una zona. `domingo`: rato de aparcar de los domingos. Devuelve horas de cada paso, tramos, ida, vuelta y los problemas.
 */
function medirDia({ pasos: pasosIn, zona, coche, domingo, sol, margenTurno, salidaMinima = 6 * 60, llegadaMin = null, origenLlegada = null, desdeMin = null, destinoFinal = null, limiteFin = null }) {
  const pasos = pasosIn.map((s) => ({ ...s }))
  const primero = pasos.find((s) => !s.comida)
  if (!primero) {
    // Un día sin paradas (la llegada de noche, o la vuelta con un vuelo temprano): solo el traslado.
    const fin = desdeMin ?? 0, v = destinoFinal ? coche.min(zona, destinoFinal) : 0
    return { pasosMedidos: [], comidaInicial: false, desdeAeropuerto: false, salir: fin, ida: 0, kmIda: 0, ap0: 0, vuelta: v, kmVuelta: destinoFinal ? coche.km(zona, destinoFinal) : 0, regreso: fin + v, finDia: fin, ultimaParada: null, coche_min: v, con_aparcar_min: v, lineas: [], problemas: [], primeraParada: null }
  }
  const meta = primero.fijo != null ? primero.fijo - (primero.llegadaAntes ?? margenTurno) : primero.llegar != null ? primero.llegar : primero.abre != null ? primero.abre : 9 * 60
  // Con la llegada en avión (día 1): se sale del aeropuerto cuando ya has recogido el coche (`llegadaMin`), no de casa; un turno online que ya no llega se pasa al siguiente (de 15 en 15 min).
  const origen = llegadaMin != null && origenLlegada ? origenLlegada : zona
  const ida = coche.min(origen, primero.p), kmIda = coche.km(origen, primero.p), ap0 = coche.aparcar(primero.p, domingo)
  if (llegadaMin != null && primero.fijo != null) {
    const antes = primero.llegadaAntes ?? margenTurno
    if (llegadaMin + ida + ap0 > primero.fijo - antes) { primero.fijo = Math.ceil((llegadaMin + ida + ap0 + antes) / 15) * 15; primero.turnoMovido = true }
  }
  const meta2 = primero.fijo != null ? primero.fijo - (primero.llegadaAntes ?? margenTurno) : meta
  // LL: no se sale de la zona antes de `desdeMin` (la hora útil de la llegada, o las 9:00 de la vuelta); con «comida cerca de tu alojamiento» primero, tampoco antes de que acabe.
  const comidaInicial = pasos[0]?.comida && pasos[0].alLlegar ? (() => { const e = Math.max(desdeMin ?? 0, 12 * 60 + 30); return { entra: e, fin: e + pasos[0].m } })() : null
  const minSalir = comidaInicial ? comidaInicial.fin : desdeMin
  const salir = llegadaMin != null ? Math.max(meta2 - ida - ap0, llegadaMin) : minSalir != null ? Math.max(meta2 - ida - ap0, minSalir) : meta2 - ida - ap0
  let t = salir + ida + ap0
  let prev = primero.p
  let cocheMin = ida, conAparcar = ida + ap0
  const lineas = [], problemas = []
  let primeroHecho = false
  for (const st of pasos) {
    if (comidaInicial && st === pasos[0]) { lineas.push({ paso: st, tramo: null, llegada: comidaInicial.entra, entra: comidaInicial.entra, fin: comidaInicial.fin, dur: st.m }); continue }
    let llegada = t
    let tramo = null
    const mismoSitio = st.p == null || st.p === prev
    // LZ2b-1: dos filas seguidas en el mismo aparcamiento (Haría y su Casa-Museo, Caleta de Famara y su atardecer): se va a pie, sin coche.
    if (primeroHecho && mismoSitio && st.p != null && st.aPie) { llegada = t + st.aPie; tramo = { modo: 'walk', minutos: st.aPie, de: prev, a: st.p } }
    if (primeroHecho && !mismoSitio) {
      const d = coche.min(prev, st.p), ap = coche.aparcar(st.p, domingo)
      llegada = t + d + ap; cocheMin += d; conAparcar += d + ap
      tramo = { minutos: d, km: coche.km(prev, st.p), aparcar_min: ap, de: prev, a: st.p }
    }
    let entra = llegada
    if (st.fijo != null) {
      const antes = st.llegadaAntes ?? margenTurno
      if (llegada > st.fijo - antes) problemas.push({ tipo: 'turno', paso: st, texto: `llegas a las ${fh(llegada)} y hay que estar a las ${fh(st.fijo - antes)}` })
      entra = Math.max(st.fijo, llegada)
    }
    if (st.abre != null && !st.comida) entra = Math.max(entra, st.abre)
    if (st.llegar != null && primeroHecho) entra = Math.max(entra, st.llegar)
    if (st.comida && st.adelantable) {
      // La comida del D1 no espera a su hora: desde las 12:30. Si aun así sobra hueco (más de 30 min), se alarga la parada de antes (hasta 45 min) en vez de dejar una hora muerta.
      const hueco = Math.max(0, 12 * 60 + 30 - llegada)
      if (hueco > 30 && lineas.length) { const alarga = Math.min(hueco, 45); const prevL = lineas[lineas.length - 1]; prevL.fin += alarga; prevL.dur += alarga; prevL.alargada_min = alarga; t += alarga; llegada += alarga; entra = llegada }
      entra = Math.max(entra, 12 * 60 + 30)
    } else if (st.comida) { if (st.desde > entra) entra = st.desde }
    if (st.ult != null && entra > st.ult && !st.comida) problemas.push({ tipo: 'ult', paso: st, texto: `entrarías a las ${fh(entra)} y la última entrada es a las ${fh(st.ult)}` })
    if (st.opc && !st.comida && sol != null && entra > sol - 15) problemas.push({ tipo: 'oscuro', paso: st, texto: `entrarías a las ${fh(entra)}, con el sol casi puesto (${fh(sol)})` })
    let fin = entra + st.m
    if (st.sol && sol != null) { if (llegada > sol) problemas.push({ tipo: 'sol', paso: st, texto: `llegarías a las ${fh(llegada)}, después del atardecer (${fh(sol)})` }); fin = Math.max(fin, sol + 5) }
    if (st.comida && entra + 0 > 15 * 60) problemas.push({ tipo: 'comida', paso: st, texto: `la comida empezaría a las ${fh(entra)}, pasadas las 15:00` })
    lineas.push({ paso: st, tramo, llegada, entra, fin, dur: fin - entra })
    if (st.p) prev = st.p
    primeroHecho = true
    t = fin
  }
  // La vuelta del día: a casa, o (día de vuelta del viaje) al aeropuerto, donde hay que estar con el coche devuelto antes de `limiteFin`.
  const destinoVuelta = destinoFinal ?? zona
  const vuelta = coche.min(prev, destinoVuelta), kmVuelta = coche.km(prev, destinoVuelta)
  cocheMin += vuelta; conAparcar += vuelta
  if (limiteFin != null && t + vuelta > limiteFin) problemas.push({ tipo: 'vuelo', texto: `llegarías al aeropuerto a las ${fh(t + vuelta)} y el límite es a las ${fh(limiteFin)}` })
  if (salir < salidaMinima) problemas.push({ tipo: 'salida', texto: `habría que salir a las ${fh(salir)}` })
  return { pasosMedidos: pasos, comidaInicial: Boolean(comidaInicial), desdeAeropuerto: llegadaMin != null, salir, ida, kmIda, ap0, vuelta, kmVuelta, regreso: t + vuelta, finDia: t, ultimaParada: prev, coche_min: cocheMin, con_aparcar_min: conAparcar, lineas, problemas, primeraParada: primero.p }
}

/** El orden en que se quitan los opcionales: lo que dice el documento por día, y si no, el de nivel más bajo (número alto) y el último del día primero. */
const QUITAR_PRIMERO = {
  D3: ['ciudad_estratificada_rofera_de_teseguite', 'las_grietas_montana_blanca', 'castillo_de_santa_barbara'],
  D1: ['playa_de_montana_bermeja'],
  D5: ['ermita_de_las_nieves'],
  // LL: en el día de llegada lo primero que sale es el Cactus (Eric/informe LL), luego lo que queda más lejos del alojamiento; en el de vuelta, lo menos importante.
  LL: ['jardin_de_cactus', 'las_grietas_montana_blanca', 'casa_museo_del_campesino', 'castillo_de_san_jose', 'playa_del_reducto', 'playa_de_la_garita'],
  V: ['las_grietas_montana_blanca', 'lagomar', 'castillo_de_san_jose', 'casa_museo_del_campesino', 'teguise', 'jardin_de_cactus', 'fundacion_cesar_manrique'],
}

/* ───────────────────────────── un día completo ───────────────────────────── */

/**
 * @param {object} a
 *  destData, datos ({ listas, paradas, matriz, restaurantes, civitatis, destino }), dayId, dayNumber, contentDays, dateIso, season,
 *  experiences, zona (id o null), pase (bool), cocheModo ('alquiler'|'propio'|'no'), opciones ({ nochesJameos, cuevaPrimero })
 * @returns {object|null} { dia, stops, meals, coche, cena_cerca, opcionales_quitados, variante, avisos, sin_coche, title }
 */
export function planCocheDia({ destData, datos, dayId, dayNumber, contentDays, dateIso, season = null, experiences = [], zona = null, pase = false, cocheModo = 'alquiler', opciones = {}, llegadaMin = null, recogerMin = 0, ll = null, vl = null, d3Vuelta = false, vistosLL = new Set() }) {
  const esLL = dayId === 'LL', esV = dayId === 'V'
  const fechaD = dateIso ? new Date(`${dateIso}T12:00:00Z`) : null
  let dia = esLL ? diaDeLlegada({ datos, ll, semana: fechaD ? fechaD.getUTCDay() : null, verano: temporadaDe(destData, dateIso) === 'verano' }) : esV ? diaDeVuelta({ datos, vl, d3Vuelta, vistos: vistosLL }) : datos.listas?.dias?.[dayId]
  if (!dia) return null
  const coche = datos._coche ?? (datos._coche = crearCoche({ matriz: datos.matriz, paradas: datos.paradas }))
  const cfg = destData.destination_config ?? {}
  const tope = cfg.tope_coche_dia_min ?? 180
  const placeByName = new Map((destData.places ?? []).map((p) => [p.name, p]))
  const placeById = new Map((destData.places ?? []).map((p) => [p.id, p]))
  const fecha = dateIso ? new Date(`${dateIso}T12:00:00Z`) : null
  const semana = fecha ? fecha.getUTCDay() : null
  const mmdd = dateIso ? String(dateIso).slice(5, 10) : null
  const domingo = semana === 0
  const sol = sunsetFor(destData, { dateIso, season }) ?? hm('18:20')
  const margenTurno = datos.destino?.llegadas?.turno?.min ?? MARGEN_TURNO_DEFECTO
  // LZ2b-1 (Eric, 4-nov): en un destino en coche se da por hecho que hay coche; la ruta es siempre la misma. `cocheModo` solo cambia el rato de recoger el coche el día 1 (alquiler / propio). 'no' ya no existe (se trata como 'alquiler').
  const sinCoche = false
  const ctx = { semana, mmdd, contentDays, experiences, opciones, verano: temporadaDe(destData, dateIso) === 'verano', invierno: temporadaDe(destData, dateIso) === 'invierno', solMin: sol }
  const variantes = variantesDelDia(dayId, ctx)
  const variante = variantes[0] ?? null
  // LL: si con la comida en su sitio (Teguise, Marina Rubicón…) acabaría pasadas las 15:00, se come primero cerca del alojamiento.
  if (esLL && !ll.cercaForzada && dia?.partes?.unica?.comida && !dia.partes.unica.comida.cerca) {
    const pr = pasosDelDia({ dia, variantes, ctx, datos, coche, placeByName, placeById }).filter((s) => s.comida || s.p)
    if (pr.some((s) => !s.comida) && medirDia({ pasos: pr, zona: ll.zona, coche, domingo, sol, margenTurno, desdeMin: ll.horaUtil }).problemas.some((p) => p.tipo === 'comida')) {
      ll = { ...ll, cercaForzada: true }
      dia = diaDeLlegada({ datos, ll, semana, verano: ctx.verano })
    }
  }

  const base = { dia_id: dayId, variante, variantes, title: dia.nombre, timezone: destData.timezone ?? 'Atlantic/Canary' }
  const sin_coche = null // LZ2b-1: fuera el «¿Sin coche?» de cada día (las excursiones de Civitatis siguen en EXPLORAR › Excursiones)

  // Días de excursión (La Graciosa, Fuerteventura): sin paradas de ciudad. La ida es hasta el puerto.
  if (dia.tipo_dia === 'excursion') return excursionDia({ base, dia, coche, zona, pase, sinCoche, sin_coche, datos, destData, semana })

  const pasosTodos = pasosDelDia({ dia, variantes, ctx, datos, coche, placeByName, placeById })
  const reales = pasosTodos.filter((s) => s.comida || s.p)
  if (!reales.some((s) => !s.comida) && !(esLL || esV)) return null

  // La zona de salida: con pase, la del viajero; sin pase (o «no sé»), la que más coche suma ese día (la ruta es igual para todos).
  const ZONAS = ZONAS_COCHE.filter((z) => coche.tiene(z))
  const desdeMin = esLL ? ll.horaUtil : esV ? 9 * 60 : null
  const medir = (pasos, z) => medirDia({ pasos, zona: z, coche, domingo, sol, margenTurno, llegadaMin, origenLlegada: llegadaMin != null && coche.tiene('aeropuerto_ace') ? 'aeropuerto_ace' : null, desdeMin, destinoFinal: esV ? 'aeropuerto_ace' : null, limiteFin: esV ? vl.limiteT1 : null })
  const zonaMasLejana = (pasos) => ZONAS.map((z) => [z, medir(pasos, z).coche_min]).sort((a, b) => b[1] - a[1])[0][0]
  const zonaConocida = pase && zona && coche.tiene(zona)
  const zonaLL = esLL ? ll.zona : esV ? vl.zona : null

  // Los opcionales salen solos si no caben.
  let pasos = reales
  const quitados = []
  const zonaDe = (ps) => (zonaLL ?? (zonaConocida ? zona : zonaMasLejana(ps)))
  const malo = (r) => r.problemas.filter((p) => p.tipo !== 'salida').length > 0 || r.coche_min > tope
  let zonaUsada = zonaDe(pasos)
  let r = medir(pasos, zonaUsada)
  if (!sinCoche) {
    for (let guard = 0; guard < 8 && malo(r); guard++) {
      const opcs = pasos.filter((s) => s.opc)
      if (opcs.length === 0) break
      const orden = QUITAR_PRIMERO[dayId] ?? []
      opcs.sort((a, b) => {
        const ia = orden.indexOf(a.p), ib = orden.indexOf(b.p)
        if (ia >= 0 || ib >= 0) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
        return (b.place?.level ?? 3) - (a.place?.level ?? 3) || pasos.indexOf(b) - pasos.indexOf(a)
      })
      const fuera = opcs[0]
      const antes = r
      pasos = pasos.filter((s) => s !== fuera)
      zonaUsada = zonaDe(pasos)
      r = medir(pasos, zonaUsada)
      const era = antes.problemas.find((p) => p.tipo === 'ult' || p.tipo === 'turno' || p.tipo === 'sol' || p.tipo === 'oscuro')
      const motivo = antes.coche_min > tope && !era ? 'tope_3h' : 'llega_tarde'
      quitados.push({
        name: fuera.lugar, motivo, duracion_minutos: fuera.m,
        texto: motivo === 'tope_3h'
          ? `Lo quitamos para que el día no pase de las 3 h de coche (${Math.floor(antes.coche_min / 60)} h ${antes.coche_min % 60} min con él).`
          : era?.tipo === 'oscuro'
            ? `Lo quitamos porque con él llegarías a ${era.paso.lugar} con el sol casi puesto (${era.texto}).`
            : `Lo quitamos porque con él llegarías tarde a lo siguiente${era?.paso ? ` (${era.paso.lugar}: ${era.texto})` : ''}.`,
      })
    }
  }

  // ── Sin coche: la misma ruta, sin trayectos ni tope ──
  const lineas = r.lineas
  const stops = []
  const p0 = coche.punto(r.primeraParada)
  for (const l of lineas) {
    const st = l.paso
    if (st.comida) continue
    const place = st.place
    const parking = coche.punto(st.p)
    const trayecto = l.tramo?.modo === 'walk'
      ? { modo: 'walk', minutos: l.tramo.minutos, km: null, aparcar_min: 0, minutos_total: l.tramo.minutos, texto: `A pie · ${l.tramo.minutos} min`, desde: null, destino: parking, maps_url: null }
      : !sinCoche && l.tramo && l.tramo.minutos + l.tramo.aparcar_min >= 0 && l.tramo.de !== l.tramo.a
      ? {
        modo: 'car', minutos: l.tramo.minutos, km: l.tramo.km, aparcar_min: l.tramo.aparcar_min, minutos_total: l.tramo.minutos + l.tramo.aparcar_min,
        texto: `En coche · ${l.tramo.minutos} min · ${Math.round(l.tramo.km)} km`,
        desde: coche.punto(l.tramo.de), destino: parking, maps_url: mapsUrl(parking),
      }
      : null
    const online = Boolean(place?.reserva_solo_online || st.llegadaAntes)
    const llegadaTxt = datos.destino?.llegadas?.por_lugar?.[st.lugar] ?? datos.destino?.llegadas?.por_lugar?.[place?.name] ?? null
    stops.push({
      name: st.titulo ?? st.lugar,
      place_name: st.lugar,
      suggested_time: fh(l.entra),
      duration_minutes: Math.round(l.dur ?? st.m),
      latitude: place?.coordinates?.[0] ?? parking?.lat ?? null,
      longitude: place?.coordinates?.[1] ?? parking?.lng ?? null,
      parking: parking ? { lat: parking.lat, lng: parking.lng, nombre: parking.nombre } : null,
      tip: (st.notas ?? []).join(' ') || '',
      description: st.doc ?? '',
      why: st.doc ?? '',
      hours: place?.schedule ?? null,
      schedule: place?.schedule ?? null,
      hours_card: place?.horario_nota ?? null,
      reservation: place?.reservation ?? null,
      tags: place?.tags ?? [],
      visit_mode: st.modo === 'dentro' ? 'dentro' : st.modo === 'fuera' ? 'fuera' : undefined,
      franja: l.entra < 14 * 60 ? 'manana' : 'tarde',
      site_id: place?.id ?? null,
      muestra: place?.id ? [place.id] : undefined,
      orientative_time: !st.fijo,
      optional: st.opc || undefined,
      trayecto_previo: trayecto,
      ...(online ? { entrada_solo_online: true, llegada_antes_min: st.llegadaAntes ?? margenTurno, llegada_texto: llegadaTxt ?? datos.destino?.llegadas?.turno?.texto ?? null } : {}),
      ...(st.nocheDeJameos ? { noche_de_jameos: true } : {}),
    })
  }

  // ── la comida del día (LL: solo restaurantes que abren ese día de la semana; si no se sabe de ninguno abierto, sin nombre) ──
  const abre = (x) => !x.dias_sin_confirmar && (semana == null || !(x.cierra_dias ?? []).includes(semana))
  const comidaLinea = lineas.find((l) => l.paso.comida)
  const meals = []
  if (comidaLinea) {
    const cerca = Boolean(comidaLinea.paso.alLlegar)
    const claveLista = comidaLinea.paso.row?.lista === undefined ? `${dayId}_comida` : comidaLinea.paso.row.lista
    const lista = cerca || !claveLista ? [] : (datos.restaurantes?.comidas?.[claveLista] ?? []).filter(abre)
    let principal = lista.find((x) => x.rol === 'restaurante') ?? lista[0]
    let alternativa = lista.find((x) => x.rol === 'alternativa' && x !== principal) ?? lista.find((x) => x !== principal)
    if (dayId === 'D1' && domingo && alternativa) [principal, alternativa] = [alternativa, principal] // el domingo, Bodegas Rubicón (La Cepa cierra a las 14:00)
    const extra = dayId === 'D2' && variantes.includes('sabado') ? lista.find((x) => x.rol === 'otra') : null
    const zonaTexto = comidaLinea.paso.row?.zona ?? ''
    meals.push({
      time: 'lunch', suggested_time: fh(comidaLinea.entra), window_end: '15:00', zone: zonaTexto.replace(/^en /, ''), zone_display: zonaTexto || null,
      restaurant: principal?.nombre ?? null, latitude: principal?.lat ?? null, longitude: principal?.lng ?? null,
      options: [principal, alternativa, extra].filter(Boolean).map(limpiarRestaurante),
      alternative: alternativa ? limpiarRestaurante(alternativa) : null,
      ...(cerca ? { cerca_del_alojamiento: true } : {}),
    })
  }

  // ── la cena cerca del alojamiento ──
  const horaVuelta = r.finDia
  const llegasZona = horaVuelta + (esV ? 0 : r.vuelta)
  const horaCena = Math.max(llegasZona + 15, 19 * 60 + 30)
  const zonaInfo = coche.zonas.get(zonaUsada)
  const zonaNombre = String(zonaInfo?.nombre ?? zonaUsada).replace(/\s*\(.*\)\s*$/, '')
  const restZona = (datos.restaurantes?.cenas_por_zona?.[zonaUsada] ?? []).filter((x) => !x.especial).filter(abre).slice(0, 3)
  let cena_cerca = null
  if (cfg.cena_cerca_del_alojamiento && dia.partes?.unica?.cena !== null) {
    cena_cerca = zonaConocida
      ? { con_pase: true, zona: { id: zonaUsada, nombre: zonaNombre }, titulo: 'Cena cerca de tu alojamiento', texto: `Tras el atardecer vuelves y cenas cerca de tu zona (${zonaNombre}).`, hora: fh(horaCena), restaurantes: restZona.map(limpiarRestaurante) }
      : { con_pase: false, zona: null, titulo: 'Cena cerca de tu alojamiento', texto: 'Tras el atardecer vuelves y cenas cerca de tu alojamiento.', hora: fh(horaCena), restaurantes: [] }
    meals.push({ time: 'dinner', suggested_time: fh(horaCena), zone: zonaConocida ? zonaNombre : 'tu alojamiento', zone_display: zonaConocida ? `cerca de tu alojamiento (${zonaNombre})` : 'cerca de tu alojamiento', restaurant: zonaConocida ? restZona[0]?.nombre ?? null : null, latitude: zonaConocida ? restZona[0]?.lat ?? null : null, longitude: zonaConocida ? restZona[0]?.lng ?? null : null, options: cena_cerca.restaurantes })
  }

  // ── el coche del día ──
  const zonaPunto = coche.punto(zonaUsada)
  const vueltaA = esV ? 'aeropuerto_ace' : zonaUsada
  const vueltaPunto = coche.punto(vueltaA)
  const cocheDia = sinCoche
    ? { activo: false, modo: null, pase: Boolean(pase), desde: null, zona: null, ida: null, vuelta: null, coche_min: 0, coche_con_aparcar_min: 0, tope_min: tope, aviso_tope: null }
    : {
      activo: true, modo: 'car', pase: Boolean(pase), desde: zonaConocida || zonaLL ? 'zona' : 'zona_mas_lejana', zona: { id: zonaUsada, nombre: zonaNombre },
      ida: { minutos: r.ida, km: r.kmIda, aparcar_min: r.ap0, salir: fh(r.salir), desde_aeropuerto: r.desdeAeropuerto, destino: p0, maps_url: mapsUrl(p0) },
      vuelta: { minutos: r.vuelta, km: r.kmVuelta, sale: fh(r.finDia), llegas: fh(r.finDia + r.vuelta), origen: vueltaPunto, maps_url: mapsUrl(vueltaPunto), ...(esV ? { al_aeropuerto: true, limite_t1: fh(vl.limiteT1) } : {}) },
      coche_min: r.coche_min, coche_con_aparcar_min: r.con_aparcar_min, tope_min: tope,
      aviso_tope: r.coche_min > tope ? { minutos_de_mas: r.coche_min - tope, texto: `Hoy conduces unas ${Math.floor(r.coche_min / 60)} h ${String(r.coche_min % 60).padStart(2, '0')} min: pasa ${r.coche_min - tope} min de las 3 h.` } : null,
      salir_texto: r.desdeAeropuerto ? `Sales del aeropuerto a las ${fh(r.salir)}` : `Sal de casa a las ${fh(r.salir)}`,
    }
  const coche_zonas = Object.fromEntries(ZONAS.map((z) => { const m = medir(pasos, z); return [z, { salir: fh(m.salir), coche_min: m.coche_min, llegas: fh(m.regreso) }] }))

  const recoger = cocheModo === 'propio' ? 0 : (datos.ll?.constantes?.recoger_coche_min ?? 60)
  const aeropuerto = coche.tiene('aeropuerto_ace') ? {
    recoger_coche_min: recoger, punto: coche.punto('aeropuerto_ace'),
    zona_a_aeropuerto: { minutos: coche.min(zonaUsada, 'aeropuerto_ace'), km: coche.km(zonaUsada, 'aeropuerto_ace'), maps_url: mapsUrl(coche.punto('aeropuerto_ace')) },
    aeropuerto_a_zona: { minutos: coche.min('aeropuerto_ace', zonaUsada), km: coche.km('aeropuerto_ace', zonaUsada), maps_url: mapsUrl(zonaPunto) },
  } : null
  const avisos = r.problemas.filter((p) => p.tipo !== 'salida' && p.tipo !== 'comida').map((p) => ({ tipo: p.tipo, lugar: p.paso?.lugar ?? null, texto: p.texto }))

  // LL: el plan de la llegada (qué fila, la hora útil, qué día de la tabla cuenta como hecho) y, el último día, el de la vuelta con su hora límite.
  const llegada_ll = esLL ? {
    aterriza: fh(ll.aterrizaMin), hora_util: fh(ll.horaUtil), fila: ll.fila, zona: ll.zona, absorbe: ll.absorbe ?? null, de_noche: ll.nocheLlegada,
    salir_aeropuerto_min: datos.ll?.constantes?.salir_aeropuerto_min ?? 45, recoger_coche_min: recoger, instalarse_min: datos.ll?.constantes?.instalarse_min ?? 60,
    aeropuerto_a_zona_min: coche.min('aeropuerto_ace', ll.zona), comida_cerca: r.comidaInicial, sin_ruta: stops.length === 0,
  } : null
  const salirZona = esV && !stops.length ? vl.salirMin : r.finDia
  const return_day = esV ? {
    activo: true, medio: 'avion', hora: fh(vl.vueloMin), lleva: stops.length ? 'manana' : 'solo_traslado', madrugada: false, fila: vl.fila,
    contenido: stops.length ? 'paradas_cerca' : null, fecha: { dayNumber, dateIso: dateIso ?? null }, ultimoDiaDeRuta: { dayNumber: dayNumber - 1, dateIso: null },
    limite_t1: fh(vl.limiteT1), salir_de_la_zona: stops.length ? fh(r.finDia) : fh(salirZona), llegas_t1: fh(r.finDia + r.vuelta), margen_min: vl.limiteT1 - (r.finDia + r.vuelta),
    d3_corto: Boolean(d3Vuelta), avisos: avisos.map((a) => ({ id: `vuelo_${a.tipo}`, texto: a.texto })),
    tarjeta: stops.length ? null : {
      titulo: 'Hoy vuelves a casa',
      texto: `Tu vuelo sale a las ${fh(vl.vueloMin)}. Sal de tu alojamiento a las ${fh(vl.salirMin)} y ten el coche en la T1 antes de las ${fh(vl.limiteT1 + (datos.ll?.constantes?.devolver_coche_min ?? 30))}.`,
      desde_tu_zona: { texto: `Desde ${zonaNombre}: ${coche.min(zonaUsada, 'aeropuerto_ace')} min en coche hasta el aeropuerto, más 30 min para repostar y devolver el coche y 2 h de margen.`, zona: zonaUsada, zona_nombre: zonaNombre, sin_zona: !zonaConocida },
      ver_como_ir: { texto: 'Cómo llegar al aeropuerto', abre: 'ficha_de_vuelta' },
      explorar: { texto: 'Si te sobra tiempo antes de salir', boton: 'Ver qué hay cerca', abre: 'explorar_monumentos', cerca_de_mi: true },
      despedida: datos.llegadaInfo?.despedida ?? 'Hasta pronto, Lanzarote.', madrugada: false,
    },
  } : null
  const titulo = esLL ? 'Tu llegada a Lanzarote' : esV ? 'Vuelta desde Lanzarote' : null
  return {
    ...base, ...(titulo ? { title: titulo } : {}), stops, meals, coche: cocheDia, coche_zonas, cena_cerca, opcionales_quitados: quitados, avisos, sin_coche, aeropuerto,
    llegada_aeropuerto: llegadaMin != null ? { aterriza: fh(llegadaMin - recogerMin), recoger_coche_min: recogerMin, coche_listo: fh(llegadaMin), primer_turno_movido: r.pasosMedidos.some((x) => x.turnoMovido) } : null,
    ...(llegada_ll ? { llegada_ll } : {}), ...(return_day ? { return_day, is_return_leg: true } : {}),
    temporada: temporadaDe(destData, dateIso), sunset_min: sol,
  }
}

/** El día de llegada (LL) como un día de las listas: sale de `_ll.json` por fila y zona; con A o B en domingo, el del mercadillo; en verano, un rato de playa antes del final. */
/** Los lugares que lleva el día de llegada (para que la vuelta no los repita). */
export function lugaresDeLlegada({ datos, ll, startIso, destData }) {
  const semana = startIso ? new Date(`${startIso}T12:00:00Z`).getUTCDay() : null
  const d = diaDeLlegada({ datos, ll, semana, verano: temporadaDe(destData, startIso) === 'verano' })
  const u = d?.partes?.unica ?? {}
  return new Set([...(u.manana ?? []), ...(u.tarde ?? [])].map((x) => x.lugar))
}

function diaDeLlegada({ datos, ll, semana, verano }) {
  const tabla = datos.ll?.llegada?.[ll?.zona]
  if (!tabla) return null
  const domingoLargo = ll.fila === 'A' || (ll.fila === 'B' && ll.horaUtil < 12 * 60)
  let f = (semana === 0 && (ll.fila === 'A' || ll.fila === 'B') && tabla[domingoLargo ? 'domingoA' : 'domingoB']) || tabla[ll.fila]
  if (!f) return null
  let tarde = [...f.tarde]
  const extra = verano ? datos.ll?.verano?.[ll.zona]?.[ll.fila] : null
  if (extra?.length) tarde = [...tarde.slice(0, -1), ...extra, ...tarde.slice(-1)]
  // La comida: con la hora útil tarde (B, desde las 13:30) o temprana (C, antes de las 14:45) se come primero, cerca del alojamiento.
  let comida = f.comida
  const cerca = ll.cercaForzada || (ll.fila === 'B' && ll.horaUtil >= 13 * 60 + 30) || (ll.fila === 'C' && ll.horaUtil < 14 * 60 + 45)
  if (cerca && ll.fila === 'B') comida = { cerca: true, zona: 'cerca de tu alojamiento', lista: null }
  else if (cerca) comida = { cerca: true, zona: 'cerca de tu alojamiento', lista: null }
  return { id: 'LL', nombre: 'Tu llegada a Lanzarote', partes: { unica: { manana: f.manana, comida, tarde, ...(ll.fila === 'F' ? { cena: null } : {}) } } }
}

/** El día de vuelta (V): de `_ll.json` por fila y zona; con el vuelo a las 17:00 o más tarde y el D3 aún en el viaje, la mañana es el D3 corto. Nunca lleva cena. */
function diaDeVuelta({ datos, vl, d3Vuelta, vistos = new Set() }) {
  const tabla = datos.ll?.vuelta?.[vl?.zona] ?? datos.ll?.vuelta?.nose
  const f = d3Vuelta ? { ...datos.ll.d3_corto, tarde: [...datos.ll.d3_corto.tarde, ...(tabla?.[vl.fila]?.tarde ?? []).filter((s) => vl.fila === 'V4' || vl.fila === 'V5')] } : tabla?.[vl?.fila]
  if (!f) return null
  const sinVistos = (arr) => (arr ?? []).filter((x) => !vistos.has(x.lugar))
  return { id: 'V', nombre: 'Vuelta desde Lanzarote', partes: { unica: { manana: sinVistos(f.manana), comida: f.comida, tarde: sinVistos(f.tarde), cena: null } } }
}


function limpiarRestaurante(x) {
  return { name: x.nombre, direccion: x.direccion ?? null, cocina: x.cocina ?? null, horario: x.horario ?? null, reserva: x.reserva ?? null, latitude: x.lat ?? null, longitude: x.lng ?? null, nota: x.nota ?? null }
}

/** La excursión de Civitatis de cada día «¿Sin coche?» (id de `_civitatis.json`). */
const CIVITATIS_DEL_DIA = { D1: 'sur_lanzarote', D2: 'lanzarote_completo', D3: 'cesar_manrique', D4: 'velero_papagayo', DG: 'graciosa_velero', DF: 'fuerteventura' }

function civitatisDe(civ, nombre, dayId) {
  if (!civ || !nombre) return null
  const lista = [...(civ.excursiones ?? []), ...(civ.free_tours ?? [])]
  const porId = lista.find((e) => e.id === CIVITATIS_DEL_DIA[dayId])
  if (porId) return { id: porId.id, url: porId.url ?? null, titulo: porId.name ?? null, precio: porId.price_from_eur ?? null, ciudad: porId.civitatis_ciudad ?? null }
  const limpio = (t) => claveDe(t).replace(/\(civitatis\)/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
  const clave = limpio(nombre)
  const hit = lista.find((e) => { const t = limpio(e.name ?? ''); return t && (clave.includes(t) || t.includes(clave)) })
    ?? lista.find((e) => { const pal = clave.split(' ').filter((w) => w.length > 4); const t = limpio(e.name ?? ''); return pal.length >= 2 && pal.filter((w) => t.includes(w)).length >= Math.min(3, pal.length) })
  return hit ? { id: hit.id ?? null, url: hit.url ?? null, titulo: hit.name ?? null, precio: hit.price_from_eur ?? null, ciudad: hit.civitatis_ciudad ?? null } : null
}

function excursionDia({ base, dia, coche, zona, pase, sinCoche, sin_coche, datos, destData, semana = null }) {
  const destinoId = dia.id === 'DG' ? 'orzola_puerto_de_la_graciosa' : 'puerto_de_playa_blanca'
  const z = pase && zona && coche.tiene(zona) ? zona : 'costa_teguise'
  const un = dia.partes?.unica ?? {}
  const p = coche.punto(destinoId)
  const ida = coche.min(z, destinoId), vuelta = ida
  const cocheDia = sinCoche
    ? { activo: false, modo: null, pase: Boolean(pase), ida: null, vuelta: null, coche_min: 0, coche_con_aparcar_min: 0, tope_min: destData.destination_config?.tope_coche_dia_min ?? 180, aviso_tope: null }
    : {
      activo: true, modo: 'car', pase: Boolean(pase), desde: pase && zona ? 'zona' : 'zona_mas_lejana', zona: { id: z, nombre: coche.zonas.get(z)?.nombre ?? z },
      ida: { minutos: ida, km: coche.km(z, destinoId), aparcar_min: coche.aparcar(destinoId, false), salir: dia.id === 'DG' ? fh(hm('10:00') - 30 - ida - coche.aparcar(destinoId, false)) : null, destino: p, maps_url: mapsUrl(p) },
      vuelta: { minutos: vuelta, km: coche.km(destinoId, z), sale: dia.id === 'DG' ? '17:30' : null, llegas: dia.id === 'DG' ? fh(hm('17:30') + vuelta) : null, origen: coche.punto(z), maps_url: mapsUrl(coche.punto(z)) },
      coche_min: ida + vuelta, coche_con_aparcar_min: ida + vuelta + coche.aparcar(destinoId, false), tope_min: destData.destination_config?.tope_coche_dia_min ?? 180, aviso_tope: null,
    }
  // LL (Eric, 4-nov): la comida de La Graciosa (Casa Enriqueta o El Veril según el día) y la cena cerca del alojamiento, solo con restaurantes que abren ese día.
  const abre = (x) => !x.dias_sin_confirmar && (semana == null || !(x.cierra_dias ?? []).includes(semana))
  const meals = []
  const comidas = dia.id === 'DG' ? (datos.restaurantes?.comidas?.DG_comida ?? []).filter(abre) : []
  if (dia.id === 'DG') {
    const [principal, alternativa] = [comidas[0], comidas[1]]
    meals.push({ time: 'lunch', suggested_time: '13:30', window_end: '15:00', zone: 'Caleta de Sebo', zone_display: 'en Caleta de Sebo (La Graciosa)', restaurant: principal?.nombre ?? null, latitude: principal?.lat ?? null, longitude: principal?.lng ?? null, options: comidas.slice(0, 3).map(limpiarRestaurante), alternative: alternativa ? limpiarRestaurante(alternativa) : null })
  }
  let cena_cerca = null
  if (destData.destination_config?.cena_cerca_del_alojamiento && dia.id === 'DG') {
    const zonaNombre = String(coche.zonas.get(z)?.nombre ?? z).replace(/\s*\(.*\)\s*$/, '')
    const conZona = Boolean(pase && zona && coche.tiene(zona))
    const rest = conZona ? (datos.restaurantes?.cenas_por_zona?.[z] ?? []).filter((x) => !x.especial).filter(abre).slice(0, 3) : []
    cena_cerca = { con_pase: conZona, zona: conZona ? { id: z, nombre: zonaNombre } : null, titulo: 'Cena cerca de tu alojamiento', texto: conZona ? `Vuelves y cenas cerca de tu zona (${zonaNombre}).` : 'Vuelves y cenas cerca de tu alojamiento.', hora: '19:30', restaurantes: rest.map(limpiarRestaurante) }
    meals.push({ time: 'dinner', suggested_time: '19:30', zone: conZona ? zonaNombre : 'tu alojamiento', zone_display: conZona ? `cerca de tu alojamiento (${zonaNombre})` : 'cerca de tu alojamiento', restaurant: rest[0]?.nombre ?? null, latitude: rest[0]?.lat ?? null, longitude: rest[0]?.lng ?? null, options: cena_cerca.restaurantes })
  }
  return {
    ...base, type: 'excursion', tipo_dia: 'excursion', stops: [], meals, coche: cocheDia, cena_cerca, opcionales_quitados: [], avisos: [], sin_coche,
    excursion: { nombre: dia.nombre, traslados: (un.manana ?? []).filter((r) => r.tipo === 'traslado'), tarde: (un.tarde ?? []).map((r) => ({ lugar: r.lugar ?? null, doc: r.doc ?? null })), en_la_isla: dia.en_la_isla ?? null, vuelta: dia.vuelta ?? null, doc: dia.doc ?? null },
  }
}

function temporadaDe(destData, dateIso) {
  const mes = dateIso ? Number(String(dateIso).slice(5, 7)) : null
  if (!mes) return null
  return (destData.destination_config?.meses_invierno ?? []).includes(mes) ? 'invierno' : 'verano'
}
