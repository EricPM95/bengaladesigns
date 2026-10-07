// Página de simulación del motor de listas (Tanda 6): un viaje de cada duración (1, 1,5, 2, 2,5, 3, 3,5, 4, 5 y 6 días) en invierno y en verano, uno con reserva y otro con lluvia.
//   node scripts/destino/viajesListas.mjs [salida=docs/dias/VIAJES_LISTAS.html]
// Cada día sale como lo ve el viajero (el formato del servidor): las paradas con su hora orientativa, el trayecto, «Llegada a…», «Si te sobra tiempo», la línea «Si llueve» y lo que el motor ha hecho.
import fs from 'node:fs'
import { conCabecera } from './cabeceraHtml.mjs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const salida = args.salida ?? 'docs/dias/VIAJES_LISTAS.html'
const D = findPipelineV2Data('Roma')
const MUSEOS = 'Museos Vaticanos y Capilla Sixtina'
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const IVNO = '2027-01-12'
const VERANO = '2027-07-13'
const FORMAS = [
  { clave: '1 día', dias: 1 },
  { clave: '1,5 días (medio día de tarde y día entero)', dias: 2, medio: { franja: 'tarde' } },
  { clave: '2 días', dias: 2 },
  { clave: '2,5 días (medio día de tarde)', dias: 3, medio: { franja: 'tarde' } },
  { clave: '3 días', dias: 3 },
  { clave: '3,5 días (medio día de vuelta)', dias: 4, medio: { franja: 'manana', salida: '15:00' } },
  { clave: '4 días', dias: 4 },
  { clave: '5 días', dias: 5 },
  { clave: '6 días', dias: 6 },
]
const viajes = []
for (const forma of FORMAS) {
  viajes.push({ ...forma, id: `${forma.dias}${forma.medio ? 'm' : ''}-invierno`, estacion: 'invierno', inicio: IVNO })
  viajes.push({ ...forma, id: `${forma.dias}${forma.medio ? 'm' : ''}-verano`, estacion: 'verano', inicio: VERANO })
}
viajes.push({ clave: '3 días con la entrada del Coliseo reservada a las 12:00', dias: 3, id: 'reserva', estacion: 'verano', inicio: addDays(VERANO, 1), entradas: { Coliseo: '12:00' }, extra: 'Con la entrada del Coliseo reservada a las 12:00 y los Museos Vaticanos reservados a las 14:00 en el día del Vaticano.', entradas2: { [MUSEOS]: '14:00' } })
// Las reservas a otra hora, un viaje por cada hora (Tanda 6d): el D2 con los Museos y el D1 con el Coliseo.
for (const hora of ['09:00', '10:00', '11:00', '14:00', '16:00']) viajes.push({ clave: `3 días con los Museos Vaticanos reservados a las ${hora}`, dias: 3, id: `museos-${hora.replace(':', '')}`, estacion: 'verano', inicio: addDays(VERANO, 2), entradas: { [MUSEOS]: hora }, extra: `El D2 con los Museos a las ${hora}.` })
for (const hora of ['09:00', '10:30', '11:00', '12:00', '14:00', '16:00']) viajes.push({ clave: `3 días con el Coliseo reservado a las ${hora}`, dias: 3, id: `coliseo-${hora.replace(':', '')}`, estacion: 'verano', inicio: addDays(VERANO, 1), entradas: { Coliseo: hora }, extra: `El D1 con el Coliseo a las ${hora}.` })
// Tanda 6e: Roma en un día con el Coliseo a las 13:00 y a las 15:00, y la Galería Borghese a las 9:00 y a las 15:00 (en el D4).
for (const hora of ['13:00', '15:00']) viajes.push({ clave: `1 día con el Coliseo reservado a las ${hora}`, dias: 1, id: `d0-coliseo-${hora.replace(':', '')}`, estacion: 'verano', inicio: addDays(VERANO, 1), entradas: { Coliseo: hora }, extra: `El D0 con el Coliseo a las ${hora}.` })
for (const hora of ['09:00', '15:00']) viajes.push({ clave: `3 días con la Galería Borghese reservada a las ${hora}`, dias: 3, id: `galeria-${hora.replace(':', '')}`, estacion: 'verano', inicio: addDays(VERANO, 1), entradas: { 'Galería Borghese': hora }, extra: `El D4 con la Galería a las ${hora}.` })
viajes.push({ clave: '3 días con un ejemplo de HOY («Vas bien de tiempo»: al acabar la tarde del primer día con tiempo de sobra)', dias: 3, id: 'hoy', estacion: 'verano', inicio: addDays(VERANO, 0), ejemploHoy: { dia: 1, restoMin: 100 } })
viajes.push({ clave: '2 días con lluvia (la alternativa de cada día aplicada)', dias: 2, id: 'lluvia', estacion: 'invierno', inicio: addDays(IVNO, 7), lluvia: true })

const hhmm = (t) => t ?? ''
const fila = (s, extra = '') => {
  const t = s.reservation_time ? `<b>${esc(s.reservation_time)}</b>` : s.orientative_time ? `<small>hacia las ${esc(s.suggested_time)}</small>` : esc(s.suggested_time)
  const nombre = s.display_title ?? s.night_view_title ?? s.name
  const etiquetas = [s.is_arrival ? '↦ llegada' : null, s.visit_mode === 'fuera' ? 'por fuera' : s.visit_mode === 'dentro' ? 'por dentro' : null, s.pass_through ? 'de camino' : null, s.is_night_experience ? 'noche' : null, s.free_access === false ? 'entrada' : null].filter(Boolean)
  return `<tr class="${s.is_arrival ? 'llegada' : s.pass_through ? 'camino' : s.is_night_experience ? 'noche' : ''}"><td class="h">${t}</td><td>${s.transit ? `<span class="tr">${esc(s.transit.icon)} ${esc(s.transit.label)}</span> ` : ''}${esc(nombre)} <span class="m">(${s.duration_minutes ?? 0} min${etiquetas.length ? `, ${etiquetas.join(', ')}` : ''})</span>${s.notice ? ` <em>${esc(s.notice)}</em>` : ''}${s.hours_warning ? ` <em>${esc(s.hours_warning)}</em>` : ''}${extra}</td></tr>`
}
const comida = (m) => `<tr class="mesa"><td class="h"><small>hacia las ${esc(m.suggested_time)}</small></td><td>${m.time === 'dinner' ? 'Cena' : 'Comida'}: <b>${esc(m.restaurant ?? '')}</b> <span class="m">${esc(m.zone_display ?? '')}</span>${m.reservation_note ? ` <em>${esc(m.reservation_note)}</em>` : ''}</td></tr>`

const trips = []
for (const viaje of viajes) {
  const dias = []
  for (let d = 1; d <= viaje.dias; d++) {
    const day = await buildDayBlockV3(D, viaje.dias + 1, false, d, null, viaje.inicio, [], [], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4', entradas: { ...(viaje.entradas ?? {}), ...(viaje.entradas2 ?? {}) }, mediaJornada: viaje.medio ?? null })
    const iso = addDays(viaje.inicio, d - 1)
    let hoy = null
    if (viaje.ejemploHoy && viaje.ejemploHoy.dia === d && day?.stops) {
      // El viajero ha marcado «Visto» en todo lo de la mañana y la tarde, y le sobran restoMin minutos antes de cenar.
      const cena = (day.meals ?? []).find((m) => m.time === 'dinner')
      const [h, m] = String(cena?.suggested_time ?? '20:00').split(':').map(Number)
      const ahora = h * 60 + m - viaje.ejemploHoy.restoMin
      const hechas = day.stops.flatMap((s) => [s.name, s.display_title].filter(Boolean))
      const conChequeo = await buildDayBlockV3(D, viaje.dias + 1, false, d, null, viaje.inicio, [], [], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4', entradas: {}, mediaJornada: null, chequeo: { dayNumber: d, doneNames: hechas, nowMinutes: ahora } })
      hoy = { ahora, tc: conChequeo?.time_check ?? null }
    }
    dias.push({ d, iso, day, hoy, lluvia: Boolean(viaje.lluvia) })
  }
  trips.push({ viaje, dias })
}

const cuerpo = trips.map(({ viaje, dias }) => {
  const cab = `<h2 id="${viaje.id}">${esc(viaje.clave)} · ${viaje.estacion}</h2><p class="fechas">Del ${DIAS[new Date(`${viaje.inicio}T12:00:00Z`).getUTCDay()]} ${viaje.inicio} al ${addDays(viaje.inicio, viaje.dias - 1)}${viaje.extra ? `. ${esc(viaje.extra)}` : ''}</p>`
  const dd = dias.map(({ d, iso, day, hoy, lluvia: conLluvia }) => {
    if (!day) return `<h3>Día ${d} · ${iso}</h3><p>Sin día.</p>`
    if (day.excursion_options) return `<h3>Día ${d} · ${iso} ${DIAS[new Date(`${iso}T12:00:00Z`).getUTCDay()]} · día de excursión</h3><p class="m">El viajero elige entre las excursiones.</p>`
    // Con lluvia: lo que sale se va y lo que entra va al final de su franja (la alternativa aplicada).
    const sale = new Set(conLluvia ? day.rain_plan?.remove ?? [] : [])
    const entran = conLluvia ? (day.rain_plan?.add ?? []) : []
    const paradas = [...(day.stops ?? []).filter((s) => !sale.has(s.display_title ?? s.name) && !sale.has(s.name)).map((s) => ({ h: s.suggested_time, html: fila(s) })), ...entran.map((s) => ({ h: '99:98', html: fila({ ...s, suggested_time: '☔', orientative_time: false }) })), ...(day.meals ?? []).map((m) => ({ h: m.suggested_time, html: comida(m) }))].sort((a, b) => String(a.h).localeCompare(String(b.h)))
    const sobra = (day.spare_stops ?? []).length ? `<details><summary>Si te sobra tiempo (${day.spare_stops.length})</summary><ul>${day.spare_stops.map((s) => `<li>${esc(s.display_title ?? s.name)} <span class="m">(${s.duration_minutes} min · ${esc(s.spare_reason)})</span> <button>Añadir</button></li>`).join('')}</ul></details>` : ''
    const llu = day.rain_plan ? `<p class="lluvia">🌧 <b>Si llueve:</b> ${esc(day.rain_plan.text)}${day.rain_plan.remove?.length ? ` <span class="m">Sale: ${esc(day.rain_plan.remove.join(', '))}.</span>` : ''}${day.rain_plan.add?.length ? ` <span class="m">Entra: ${esc(day.rain_plan.add.map((s) => `${s.display_title ?? s.name}`).join(', '))}.</span>` : ''}</p>` : ''
    const registro = (day.engine_log ?? []).filter((l) => ['quitada', 'modo', 'modo+min', 'titulo', 'restaurante', 'noche', 'hora', 'sobra', 'nueva', 'aviso'].includes(l.que) && l.causa).map((l) => `<li><b>${esc(l.que)}</b> ${esc(l.lugar ?? '')}: ${esc(l.causa)}</li>`).join('')
    const noInc = (day.not_included ?? []).length ? `<p class="m">No incluido: ${esc(day.not_included.map((n) => `${n.name}${n.reason ? ` (${n.reason})` : ''}`).join('; '))}</p>` : ''
    return `<h3>Día ${d} · ${iso} ${DIAS[new Date(`${iso}T12:00:00Z`).getUTCDay()]} · ${esc(day.curated_day?.id ?? '')} ${esc(day.curated_day?.name ?? '')}</h3>${day.sunset_text ? `<p class="sol">${esc(day.sunset_text)}</p>` : ''}${day.day_notice ? `<p>${esc(day.day_notice)}</p>` : ''}<table>${paradas.map((p) => p.html).join('')}</table>${conLluvia && sale.size ? `<p class="lluvia">☔ <b>Con lluvia aplicada:</b> salen ${esc([...sale].join(', '))}${entran.length ? `; entran ${esc(entran.map((s) => s.display_title ?? s.name).join(', '))}` : ''}.</p>` : ''}${hoy?.tc ? `<div class="hoy"><b>HOY · a las ${Math.floor(hoy.ahora / 60)}:${String(hoy.ahora % 60).padStart(2, '0')} marcas «Visto» en la última parada</b><br>${hoy.tc.status === 'bien' ? 'Vas bien de tiempo' : hoy.tc.status === 'justo' ? 'Vas justo' : 'Vas bien'} (te sobran ${hoy.tc.spare_minutes} min).${hoy.tc.before_meal ? ' ¿Vas ya al restaurante o quieres ver algo más?' : ''}<ul>${(hoy.tc.suggestions ?? []).map((x) => `<li>${esc(x.display_title ?? x.name)} <span class="m">(${x.duration_minutes} min${x.add_note ? ` · ${esc(x.add_note)}` : ''})</span></li>`).join('') || '<li class="m">Sin sugerencias.</li>'}</ul></div>` : ''}${sobra}${llu}${noInc}${registro ? `<details><summary>Lo que ha hecho el motor</summary><ul class="reg">${registro}</ul></details>` : ''}`
  }).join('')
  return `<section>${cab}${dd}</section>`
}).join('\n')

const indice = viajes.map((v) => `<a href="#${v.id}">${esc(v.clave)} · ${v.estacion}</a>`).join(' · ')
const html = `<title>Viajes por listas: el motor</title>
<style>
body{font:15px/1.5 system-ui,sans-serif;max-width:900px;margin:0 auto;padding:16px;color:#1d2b33;background:#fafaf7}
h1{font-size:22px}h2{font-size:19px;margin-top:36px;border-top:2px solid #0f6b66;padding-top:12px}h3{font-size:16px;margin:20px 0 4px}
table{border-collapse:collapse;width:100%}td{padding:3px 6px;vertical-align:top;border-bottom:1px solid #e7e7e1}td.h{width:96px;color:#47606b;white-space:nowrap}
tr.camino td{color:#6b7a82}tr.llegada td{background:#eef6f5}tr.mesa td{background:#fff6e0}tr.noche td{background:#eceef8}
.m{color:#6b7a82;font-size:13px}.fechas,.sol{color:#47606b;margin:2px 0}.tr{color:#0f6b66}.lluvia{background:#eaf3fb;padding:6px 8px;border-radius:6px}.descanso{background:#f3efe4;padding:8px 10px;border-radius:8px;margin:8px 0;border-left:3px solid #b08a2e}.hoy{background:#e9f4ea;padding:8px 10px;border-radius:8px;margin:8px 0;border-left:3px solid #2e8b57}
em{color:#a1470f;font-style:normal;font-size:13px}details{margin:6px 0}summary{cursor:pointer;color:#0f6b66}.reg{font-size:13px;color:#47606b}
nav{font-size:13px;line-height:1.9}
</style>
<h1>Viajes por listas: lo que saca el motor</h1>
<p>Un viaje de cada duración, en invierno y en verano, uno con reservas y otro con lluvia. Las horas son orientativas («hacia las»): la suma de lo que dura cada parada y el trayecto, desde que empieza el día. Una reserva, un turno o el Free Tour van a su hora (en negrita), con su «Llegada a…» delante. Lo que no cabe está en «Si te sobra tiempo». Para volver a generarla: <code>node scripts/destino/viajesListas.mjs</code>.</p>
<nav>${indice}</nav>
${cuerpo}`
fs.writeFileSync(salida, conCabecera(html))
console.log(JSON.stringify({ salida, viajes: trips.length }))
