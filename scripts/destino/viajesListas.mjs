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
    dias.push({ d, iso, day })
  }
  trips.push({ viaje, dias })
}

const cuerpo = trips.map(({ viaje, dias }) => {
  const cab = `<h2 id="${viaje.id}">${esc(viaje.clave)} · ${viaje.estacion}</h2><p class="fechas">Del ${DIAS[new Date(`${viaje.inicio}T12:00:00Z`).getUTCDay()]} ${viaje.inicio} al ${addDays(viaje.inicio, viaje.dias - 1)}${viaje.extra ? `. ${esc(viaje.extra)}` : ''}</p>`
  const dd = dias.map(({ d, iso, day }) => {
    if (!day) return `<h3>Día ${d} · ${iso}</h3><p>Sin día.</p>`
    if (day.excursion_options) return `<h3>Día ${d} · ${iso} ${DIAS[new Date(`${iso}T12:00:00Z`).getUTCDay()]} · día de excursión</h3><p class="m">El viajero elige entre las excursiones.</p>`
    const paradas = [...(day.stops ?? []).map((s) => ({ h: s.suggested_time, html: fila(s) })), ...(day.meals ?? []).map((m) => ({ h: m.suggested_time, html: comida(m) }))].sort((a, b) => String(a.h).localeCompare(String(b.h)))
    const sobra = (day.spare_stops ?? []).length ? `<details><summary>Si te sobra tiempo (${day.spare_stops.length})</summary><ul>${day.spare_stops.map((s) => `<li>${esc(s.display_title ?? s.name)} <span class="m">(${s.duration_minutes} min · ${esc(s.spare_reason)})</span> <button>Añadir</button></li>`).join('')}</ul></details>` : ''
    const llu = day.rain_plan ? `<p class="lluvia">🌧 <b>Si llueve:</b> ${esc(day.rain_plan.text)}${day.rain_plan.remove?.length ? ` <span class="m">Sale: ${esc(day.rain_plan.remove.join(', '))}.</span>` : ''}${day.rain_plan.add?.length ? ` <span class="m">Entra: ${esc(day.rain_plan.add.map((s) => `${s.display_title ?? s.name}`).join(', '))}.</span>` : ''}</p>` : ''
    const registro = (day.engine_log ?? []).filter((l) => ['quitada', 'modo', 'modo+min', 'titulo', 'restaurante', 'noche', 'hora', 'sobra', 'nueva', 'aviso'].includes(l.que) && l.causa).map((l) => `<li><b>${esc(l.que)}</b> ${esc(l.lugar ?? '')}: ${esc(l.causa)}</li>`).join('')
    const noInc = (day.not_included ?? []).length ? `<p class="m">No incluido: ${esc(day.not_included.map((n) => `${n.name}${n.reason ? ` (${n.reason})` : ''}`).join('; '))}</p>` : ''
    return `<h3>Día ${d} · ${iso} ${DIAS[new Date(`${iso}T12:00:00Z`).getUTCDay()]} · ${esc(day.curated_day?.id ?? '')} ${esc(day.curated_day?.name ?? '')}</h3>${day.sunset_text ? `<p class="sol">${esc(day.sunset_text)}</p>` : ''}${day.day_notice ? `<p>${esc(day.day_notice)}</p>` : ''}<table>${paradas.map((p) => p.html).join('')}</table>${sobra}${llu}${noInc}${registro ? `<details><summary>Lo que ha hecho el motor</summary><ul class="reg">${registro}</ul></details>` : ''}`
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
.m{color:#6b7a82;font-size:13px}.fechas,.sol{color:#47606b;margin:2px 0}.tr{color:#0f6b66}.lluvia{background:#eaf3fb;padding:6px 8px;border-radius:6px}
em{color:#a1470f;font-style:normal;font-size:13px}details{margin:6px 0}summary{cursor:pointer;color:#0f6b66}.reg{font-size:13px;color:#47606b}
nav{font-size:13px;line-height:1.9}
</style>
<h1>Viajes por listas: lo que saca el motor</h1>
<p>Un viaje de cada duración, en invierno y en verano, uno con reservas y otro con lluvia. Las horas son orientativas («hacia las»): la suma de lo que dura cada parada y el trayecto, desde que empieza el día. Una reserva, un turno o el Free Tour van a su hora (en negrita), con su «Llegada a…» delante. Lo que no cabe está en «Si te sobra tiempo». Para volver a generarla: <code>node scripts/destino/viajesListas.mjs</code>.</p>
<nav>${indice}</nav>
${cuerpo}`
fs.writeFileSync(salida, conCabecera(html))
console.log(JSON.stringify({ salida, viajes: trips.length }))
