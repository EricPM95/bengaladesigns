// LZ2a, agente A: el motor en coche de Lanzarote. Corre el motor de verdad (buildDayBlockV3 con Lanzarote) sobre una muestra de fechas (domingo, sábado, viernes, 1 de enero,
// invierno y verano), de 2 a 7 días, desde las 6 zonas, con y sin pase, con y sin coche, y comprueba:
//   ningún día pasa de 3 h de coche · ningún sitio se pasa de su última entrada / turno · comida antes de las 15:00 · los opcionales se quitan cuando no caben ·
//   cena cerca con pase · nunca «taxi» ni «Roma» · nunca paseo nocturno · variantes (domingo, sábado, 1 de enero, 2 días, arte, volcanes) · el contrato de la app ·
//   Lanzarote oculto para quien no es administrador.
//   node scripts/destino/pruebaTandaLZ2a_A.mjs
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { diasCoche } from '../../server/engine/cocheDay.js'
import { nombraUnOculto } from '../../server/destinoOculto.js'

const D = findPipelineV2Data('Lanzarote')
let ok = 0
const fallos = []
const eq = (cond, msg) => { if (cond) ok++; else fallos.push(msg) }
const hm = (s) => { const [h, m] = String(s).split(':').map(Number); return h * 60 + m }

const ZONAS = ['puerto_del_carmen', 'playa_blanca', 'costa_teguise', 'arrecife', 'el_norte', 'el_interior']
// domingo, sábado, viernes, 1 de enero, invierno y verano
const FECHAS = { domingo: '2026-11-08', sabado: '2026-11-14', viernes: '2026-11-13', uno_enero: '2027-01-01', invierno: '2026-12-15', verano: '2027-07-10' }
const dias = async (fecha, total, extra = {}, exp = ['imprescindibles']) => {
  const out = []
  for (let n = 1; n <= total; n++) out.push(await buildDayBlockV3(D, total + 1, false, n, null, fecha, [], exp, { city: 'Lanzarote', scheduler: 'v3', ...extra }))
  return out
}
const placeByName = new Map(D.places.map((p) => [p.name, p]))
const textoSinPermitidos = (d) => {
  const copia = JSON.parse(JSON.stringify(d))
  if (copia.excursion) { delete copia.excursion.en_la_isla; delete copia.excursion.traslados } // «Bici o taxi 4x4» en La Graciosa y «rome2rio» son del dato escrito
  return JSON.stringify(copia).replace(/rome2rio/gi, '').replace(/Romero/g, '')
}

function revisaDia(d, etiqueta, { pase, cocheModo, zona }) {
  eq(d && d.day_number, `${etiqueta}: sin día`)
  if (!d) return
  const sin = cocheModo === 'no'
  // 1. Tope de 3 h
  if (!sin && d.coche) eq(d.coche.coche_min <= 180 || d.coche.aviso_tope, `${etiqueta}: ${d.dia_id} suma ${d.coche.coche_min} min de coche sin aviso`)
  if (!sin && d.coche?.activo) eq(d.coche.coche_min <= 180, `${etiqueta}: ${d.dia_id} pasa de 3 h de coche (${d.coche.coche_min} min desde ${d.coche.zona?.id})`)
  // 2. Última entrada / turno
  for (const s of d.stops ?? []) {
    const pl = placeByName.get(s.name)
    if (pl?.last_entry && !d.variantes?.includes('viernes_noches_de_jameos')) eq(hm(s.suggested_time) <= hm(pl.last_entry), `${etiqueta}: ${d.dia_id} ${s.name} a las ${s.suggested_time}, última entrada ${pl.last_entry}`)
    if (s.entrada_solo_online) eq(s.llegada_antes_min === 15 && s.llegada_texto, `${etiqueta}: ${s.name} sin «llegada 15 min antes»`)
  }
  // 3. Comida antes de las 15:00
  for (const m of d.meals ?? []) if (m.time === 'lunch') eq(hm(m.suggested_time) < 15 * 60, `${etiqueta}: ${d.dia_id} comida a las ${m.suggested_time}`)
  // 4. Horas crecientes
  let prev = -1
  for (const s of d.stops ?? []) { eq(hm(s.suggested_time) >= prev, `${etiqueta}: ${d.dia_id} horas que van hacia atrás en ${s.name}`); prev = hm(s.suggested_time) }
  // 5. Cena cerca
  if (d.type !== 'excursion') {
    eq(d.cena_cerca && d.cena_cerca.titulo === 'Cena cerca de tu alojamiento', `${etiqueta}: ${d.dia_id} sin cena cerca`)
    if (pase && zona && zona !== 'nose' && d.cena_cerca) {
      eq(d.cena_cerca.con_pase === true && d.cena_cerca.zona?.id === zona, `${etiqueta}: ${d.dia_id} cena con pase no es de la zona ${zona}`)
      eq(d.cena_cerca.restaurantes.length >= 2 && d.cena_cerca.restaurantes.length <= 3, `${etiqueta}: ${d.dia_id} con pase deben ser 2-3 restaurantes (hay ${d.cena_cerca.restaurantes.length})`)
    } else if (d.cena_cerca) eq(d.cena_cerca.con_pase === false && d.cena_cerca.restaurantes.length === 0, `${etiqueta}: ${d.dia_id} sin pase la cena no lleva restaurante`)
  }
  // 6. Nunca taxi ni Roma; 7. nunca paseo nocturno
  const t = textoSinPermitidos(d)
  eq(!/taxi/i.test(t), `${etiqueta}: ${d.dia_id} sale «taxi»`)
  eq(!/\bRoma\b|\bRome\b/.test(t), `${etiqueta}: ${d.dia_id} sale «Roma»`)
  eq(!(d.stops ?? []).some((s) => s.is_night_experience || /\(noche\)/i.test(s.name) || s.night_walk) && !d.night_walk && !d.night_dropped, `${etiqueta}: ${d.dia_id} lleva paseo nocturno`)
  // 8. Sin coche / con coche
  if (sin) {
    eq(d.coche?.activo === false && (d.stops ?? []).every((s) => !s.trayecto_previo), `${etiqueta}: ${d.dia_id} sin coche pero con trayectos`)
  } else if (d.type !== 'excursion') {
    const conTramo = (d.stops ?? []).filter((s) => s.trayecto_previo)
    for (const s of conTramo) {
      const tr = s.trayecto_previo
      eq(tr.modo === 'car' && /^En coche · \d+ min · \d+ km$/.test(tr.texto) && /destination=-?\d/.test(tr.maps_url ?? '') && tr.destino?.lat != null, `${etiqueta}: ${d.dia_id} trayecto mal formado en ${s.name}`)
    }
    eq(d.coche.ida?.salir && d.coche.vuelta?.llegas && d.coche.ida.maps_url && d.coche.vuelta.maps_url, `${etiqueta}: ${d.dia_id} sin ida o vuelta`)
    eq(d.coche.desde === (pase && zona && zona !== 'nose' ? 'zona' : 'zona_mas_lejana'), `${etiqueta}: ${d.dia_id} «desde» mal`)
  }
  eq(d.sin_coche === null || typeof d.sin_coche.excursion === 'string' || (d.sin_coche.excursion === null && typeof d.sin_coche.deja_fuera === 'string'), `${etiqueta}: ${d.dia_id} sin_coche mal formado`)
  eq(d.timezone === 'Atlantic/Canary', `${etiqueta}: ${d.dia_id} sin hora de Canarias`)
}

// ───────────── la muestra grande: fechas × 2..7 días × 6 zonas × pase × coche ─────────────
let dias_construidos = 0
for (const [nombre, fecha] of Object.entries(FECHAS)) {
  for (const total of [2, 3, 4, 5, 6, 7]) {
    for (const zona of ZONAS) {
      for (const pase of [true, false]) {
        const cocheModos = zona === 'costa_teguise' || zona === 'el_norte' ? ['alquiler', 'no'] : ['alquiler']
        for (const cocheModo of cocheModos) {
          const ds = await dias(fecha, total, { zona, pase, coche: cocheModo })
          dias_construidos += ds.length
          ds.forEach((d, i) => revisaDia(d, `${nombre}/${total}d/${zona}/${pase ? 'pase' : 'sinpase'}/${cocheModo}/día${i + 1}`, { pase, cocheModo, zona }))
        }
      }
    }
  }
}

// ───────────── el orden de los días por prioridades ─────────────
{
  const ids = (fecha, total, exp = []) => diasCoche(D, 'lanzarote', { totalDays: total + 1, dateRangeStartIso: fecha, experiences: exp })
  eq(ids('2026-11-08', 5).join() === 'D1,D2,D3,DG,D4', `orden 5 días desde domingo: ${ids('2026-11-08', 5)}`)
  eq(ids('2026-11-05', 5)[0] === 'D1', 'el día 1 es siempre el D1')
  for (let total = 3; total <= 7; total++) {
    for (let k = 0; k < 7; k++) {
      const fecha = new Date(Date.parse('2026-11-02T12:00:00Z') + k * 86400000).toISOString().slice(0, 10)
      const lista = ids(fecha, total)
      eq(lista[0] === 'D1', `${fecha}/${total}: el día 1 no es D1`)
      eq(lista[lista.length - 1] !== 'D2', `${fecha}/${total}: el D2 es el último día`)
      lista.forEach((id, i) => {
        const dow = new Date(Date.parse(`${fecha}T12:00:00Z`) + i * 86400000).getUTCDay()
        if (dow === 0 && i > 0 && lista.includes('D3') && !(total === 3 && i === 1)) eq(id === 'D3', `${fecha}/${total}: el domingo (día ${i + 1}) no es el D3`)
      })
    }
  }
  eq(ids('2026-11-09', 4, ['playa_y_calma']).join() === 'D1,D2,D3,D4', 'playa_y_calma en 4 días: D1,D2,D3,D4')
  eq(ids('2026-11-09', 6, ['volcanes']).join() === 'D1,D2,D3,DG,D5,D4', 'volcanes en 6 días')
  eq(ids('2026-11-09', 9).slice(7).every((x) => x === 'BLANCO'), 'desde el día 8, en blanco')
}

// ───────────── las variantes ─────────────
{
  const [d1] = await dias(FECHAS.domingo, 2, { zona: 'costa_teguise', pase: true })
  eq(d1.variante === 'domingo' && /Rubic/.test(d1.meals.find((m) => m.time === 'lunch')?.restaurant ?? ''), 'D1 en domingo: comida en Bodegas Rubicón')
  const g1 = await dias(FECHAS.domingo, 5, { zona: 'costa_teguise', pase: true })
  eq(g1[0].stops[0].name.startsWith('Montañas del Fuego') && g1[0].stops[0].suggested_time === '09:30', 'Timanfaya a las 09:30')
  const sab = (await dias(FECHAS.viernes, 5, { zona: 'costa_teguise', pase: true })).find((d) => d.dia_id === 'D2')
  eq(sab?.variante === 'sabado' && sab.stops[0].name === 'Jameos del Agua' && sab.stops[0].suggested_time === '10:00' && sab.stops.find((s) => /Cueva/.test(s.name))?.suggested_time === '11:30', 'D2 en sábado: Jameos 10:00, Cueva 11:30')
  const sabMeal = sab?.meals.find((m) => m.time === 'lunch')
  eq(sabMeal && hm(sabMeal.suggested_time) <= hm('12:50') && sabMeal.options.length === 3, `D2 en sábado: comida hacia las 12:35 con el mercado (${sabMeal?.suggested_time})`)
  const ene = await dias('2026-12-30', 3, { zona: 'costa_teguise', pase: true }) // el 1 de enero es el día 3
  const d3e = ene.find((d) => d.dia_id === 'D3'), d2e = (await dias('2026-12-31', 3, { zona: 'costa_teguise', pase: true })).find((d) => d.dia_id === 'D2')
  eq(d3e && !d3e.stops.some((s) => /Fundación/.test(s.name)) && d3e.stops.some((s) => /LagOmar/.test(s.name)), '1 de enero, D3: sin Fundación y con LagOmar')
  eq(d2e && d2e.stops.filter((s) => /Casa-Museo/.test(s.name)).length === 1 && d2e.stops.some((s) => /Helechos/.test(s.name)), '1 de enero, D2: solo el pueblo de Haría (la Casa-Museo cierra, no hay segunda parada) y los Helechos')
  const dos = (await dias('2026-11-10', 2, { zona: 'costa_teguise', pase: true })).find((d) => d.dia_id === 'D2')
  eq(dos?.variante === 'dos_dias' && dos.stops.some((s) => /Fundación/.test(s.name)), 'viaje de 2 días: el D2 lleva la Fundación')
  const arte = (await dias('2026-11-10', 3, { zona: 'costa_teguise', pase: true }, ['imprescindibles', 'arte'])).find((d) => d.dia_id === 'D3')
  eq(arte?.variante === 'arte' && arte.stops.some((s) => /LagOmar/.test(s.name)) && !arte.stops.some((s) => /Castillo de Santa/.test(s.name)), 'D3 con Arte: LagOmar y sin el Castillo')
  const domD3 = (await dias('2026-11-08', 3, { zona: 'costa_teguise', pase: true }, ['imprescindibles'])).find((d) => d.dia_id === 'D3')
  // (viaje desde el domingo: el domingo es el D1; el D3 de un domingo se prueba con salida el sábado)
  const dom3 = (await dias('2026-11-07', 4, { zona: 'costa_teguise', pase: true })).find((d) => d.dia_id === 'D3')
  eq(dom3?.variante === 'domingo' && dom3.stops[0].name === 'Teguise (villa)' && dom3.stops[0].suggested_time === '10:00' && !dom3.stops.some((s) => /Campesino/.test(s.name)), 'D3 en domingo: Teguise a las 10:00, sin el Campesino')
  const vol = (await dias('2026-11-10', 6, { zona: 'costa_teguise', pase: true }, ['imprescindibles', 'volcanes'])).find((d) => d.dia_id === 'D5')
  eq(vol?.variante === 'volcanes' && vol.stops[0].name === 'Caldera Blanca', 'D5 con Volcanes: Caldera Blanca')
  void domD3
}

{
  const v2 = (await dias('2027-07-12', 3, { zona: 'costa_teguise', pase: true })).find((d) => d.dia_id === 'D2')
  eq(v2?.variante === 'verano' && (v2.stops.some((s) => /Garita/.test(s.name)) || v2.opcionales_quitados.some((q) => /Garita/.test(q.name))) && !v2.stops.some((s) => /Helechos/.test(s.name)), 'D2 en verano: La Garita y sin Helechos')
  const v4 = (await dias('2027-07-12', 5, { zona: 'costa_teguise', pase: true })).find((d) => d.dia_id === 'D4')
  eq(v4?.variante === 'verano' && v4.stops.find((s) => /Playa Blanca/.test(s.name))?.duration_minutes >= 105, 'D4 en verano: segundo rato de playa')
  const k = (await dias('2026-11-10', 5, { zona: 'costa_teguise', pase: true, kayak: true })).find((d) => d.dia_id === 'D4')
  eq(k?.stops[0]?.name.startsWith('Kayak') && k.stops[0].suggested_time === '09:45' && k.coche.coche_min <= 180, 'D4 con kayak: 9:45 en Playa Blanca')
}

// ───────────── los opcionales se quitan cuando no caben ─────────────
{
  let quitadosD3 = 0, conOpcional = 0
  for (const zona of ZONAS) {
    for (const fecha of ['2026-11-10', '2026-12-15', '2027-07-13']) {
      const d3 = (await dias(fecha, 3, { zona, pase: true })).find((d) => d.dia_id === 'D3')
      if (!d3) continue
      for (const q of d3.opcionales_quitados) {
        quitadosD3++
        eq(['llega_tarde', 'tope_3h', 'cierra_antes'].includes(q.motivo) && q.texto && q.duracion_minutos > 0, `quitado mal formado: ${q.name}`)
        eq(d3.not_included.some((n) => n.name === q.name), `quitado ${q.name} no sale en not_included`)
      }
      conOpcional += d3.stops.filter((s) => s.optional).length
      // En el día 3 se quita primero la Ciudad Estratificada
      if (d3.opcionales_quitados.length > 0) eq(d3.opcionales_quitados[0].name.startsWith('Ciudad Estratificada'), `${zona}/${fecha}: lo primero que se quita en el D3 no es la Ciudad Estratificada (${d3.opcionales_quitados[0].name})`)
      // y lo que se queda cabe (el Campesino, a tiempo)
      const camp = d3.stops.find((s) => /Campesino/.test(s.name))
      if (camp) eq(hm(camp.suggested_time) <= hm(placeByName.get(camp.name).last_entry ?? '17:10'), `${zona}/${fecha}: el Campesino a las ${camp.suggested_time}`)
    }
  }
  eq(quitadosD3 > 0, 'el motor nunca quita un opcional en el D3 (debería, en alguna zona)')
  eq(conOpcional > 0, 'el D3 nunca conserva un opcional')
}

// ───────────── el día 4 desde El norte baja de 3 h ─────────────
{
  const ds = await dias('2026-11-10', 6, { zona: 'el_norte', pase: true })
  const papagayo = ds.find((d) => d.dia_id === 'D4')
  eq(papagayo && papagayo.coche.coche_min < 180, `El norte, día de Papagayo: ${papagayo?.coche.coche_min} min`)
  for (const d of ds) eq(d.coche.coche_min <= 180, `El norte ${d.dia_id}: ${d.coche.coche_min} min`)
}

// ───────────── la llegada en avión (día 1) ─────────────
{
  const [a] = await dias('2026-11-08', 2, { zona: 'costa_teguise', pase: true, coche: 'alquiler', llegada: { hora: '11:00', medio: 'avion' } })
  eq(a.llegada_aeropuerto?.aterriza === '11:00' && a.llegada_aeropuerto?.coche_listo === '11:45' && a.coche.ida.desde_aeropuerto === true, 'llegada: la ida sale del aeropuerto')
  const t = a.stops[0]
  eq(a.llegada_aeropuerto.primer_turno_movido && hm(t.suggested_time) > hm('09:30') && hm(t.suggested_time) % 15 === 0, `llegada a las 11:00: Timanfaya se pasa al turno de las ${t.suggested_time}`)
  eq(a.aeropuerto && a.aeropuerto.zona_a_aeropuerto.minutos > 0, 'el día lleva el trayecto a/desde el aeropuerto')
}

// ───────────── Lanzarote oculto para quien no es administrador ─────────────
eq(nombraUnOculto(['Lanzarote'], new Set(['lanzarote'])) === true && nombraUnOculto(['Roma'], new Set(['lanzarote'])) === false, 'el guardián reconoce Lanzarote y no Roma')

console.log(`pruebaTandaLZ2a_A: ${dias_construidos} días construidos, ${ok} comprobaciones bien, ${fallos.length} fallos`)
const vistos = new Set()
for (const f of fallos) { if (!vistos.has(f)) { vistos.add(f); if (vistos.size <= 40) console.log('  FALLO:', f) } }
if (vistos.size > 40) console.log(`  … y ${vistos.size - 40} fallos distintos más`)
process.exit(fallos.length ? 1 : 0)
