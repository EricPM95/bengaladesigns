// HOY3: la lista de avisos del viaje de Eric (Lanzarote, domingo 8-nov 08:25 → viernes 13-nov 19:40, Costa Teguise, coche de alquiler), día a día, con la hora y el texto EXACTOS que calcula el módulo puro con la ruta de
// docs/dias/_hoy3_ruta_eric.json. Escribe docs/dias/HOY3_AVISOS_DE_ERIC.md (para el REPASO). Lo que depende de algo que aún no se sabe (el tiempo, las reservas) va aparte, como ejemplo.
//   node scripts/destino/_hoy3_listaDeEric.mjs
import fs from 'node:fs'
import { horaCorta, planDelViaje } from '../../shared/avisos/avisosDelViaje.js'

const { route } = JSON.parse(fs.readFileSync('docs/dias/_hoy3_ruta_eric.json', 'utf8'))
const datos = { tiempo: JSON.parse(fs.readFileSync('data/hoy/avisos_tiempo.json', 'utf8')), atardecer: JSON.parse(fs.readFileSync('src/data/sitiosDeAtardecer.json', 'utf8')) }
const NOMBRE = { llegada: 'Llegada', manana: 'Mañana', turno: 'Turno', tiempo_noche: 'Tiempo (noche antes)', atardecer: 'Atardecer', vuelta_manana: 'Vuelta (mañana)', vuelta_salir: 'Vuelta (antes de salir)' }
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const dia = (iso) => `${DIAS[new Date(`${iso}T12:00:00Z`).getUTCDay()]} ${Number(iso.slice(8, 10))}`
const hh = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
const lista = (extra = {}) => planDelViaje({ route, reservations: [], zona: 'Atlantic/Canary', datos, ...extra })
const tabla = (avisos) => avisos.map((a) => `| ${hh(a.min)} | ${NOMBRE[a.tipo]} | ${a.texto} |`).join('\n')

const base = lista()
const fechas = [...new Set(base.map((a) => a.fecha))].sort()
let md = `# Los avisos del viaje de Eric (HOY3)\n\nLanzarote, domingo 8-nov (aterriza a las 8:25) → viernes 13-nov (vuela a las 19:40). Costa Teguise, coche de alquiler. Horas en la hora de Lanzarote (Atlantic/Canary; en noviembre, una hora por detrás de la Península). Hecho con \`scripts/destino/_hoy3_listaDeEric.mjs\` sobre la ruta que genera la app (\`docs/dias/_hoy3_ruta_eric.json\`).\n\n`
for (const f of fechas) {
  md += `## ${dia(f)}\n\n| Hora | Aviso | Texto |\n| --- | --- | --- |\n${tabla(base.filter((a) => a.fecha === f))}\n\n`
}
md += `## Los que salen SOLO si toca\n\n`
md += `**El tiempo, la noche antes (21:00).** Sale si mañana hay lluvia, nubes sobre un mirador del norte o viento fuerte (umbrales de data/hoy/avisos_tiempo.json). Ejemplos con una previsión inventada:\n\n`
const meteo = (o) => ({ probability: Array.from({ length: 24 }, (_, h) => (o.lluvia?.includes(h) ? 90 : 0)), precipitation: Array.from({ length: 24 }, (_, h) => (o.lluvia?.includes(h) ? 2 : 0)), cloud: Array.from({ length: 24 }, (_, h) => (o.nubes?.includes(h) ? 95 : 0)), gust: Array.from({ length: 24 }, (_, h) => (o.viento?.includes(h) ? 70 : 10)) })
const ejemplos = [
  ['nubes en el Mirador del Río el martes 10', { '2026-11-10': meteo({ nubes: [12, 13] }) }],
  ['viento fuerte en Los Hervideros el lunes 9', { '2026-11-09': meteo({ viento: [15, 16] }) }],
  ['lluvia por la mañana el jueves 12', { '2026-11-12': meteo({ lluvia: [10, 11, 12] }) }],
]
for (const [que, previsiones] of ejemplos) {
  const l = lista({ meteo: (f) => previsiones[f] ?? meteo({}) })
  const n = l.filter((a) => a.tipo === 'tiempo_noche')
  const m = l.find((a) => a.tipo === 'manana' && a.texto.includes(' Hoy ') && /Hoy (hay|va)/.test(a.texto))
  md += `- Si hay ${que}: ${n.map((a) => `${dia(a.fecha)} a las ${hh(a.min)}: «${a.texto}»`).join(' · ')}${m ? ` · y la mañana de ese día lleva el tiempo: «${m.texto}»` : ''}\n`
}
md += `\n**«Sal ahora para llegar a tu turno»:** solo si apuntas una reserva o un turno con hora. Ejemplo: si reservas la Cueva de los Verdes a las 11:30 del martes 10, a esa hora de salir llega:\n\n`
const conTurno = lista({ reservations: [{ id: 'cueva', kind: 'entrada', name: 'Cueva de los Verdes', placeNames: ['Cueva de los Verdes'], dateIso: '2026-11-10', time: '11:30' }] }).filter((a) => a.tipo === 'turno')
md += `| ${conTurno.map((a) => `${hh(a.min)} | Turno | ${a.texto}`).join('') } |\n`
md = md.replace(/\| (\d\d:\d\d) \| Turno \|/, '| Hora | Aviso | Texto |\n| --- | --- | --- |\n| $1 | Turno |')
md += `\n## Cómo se cuentan\n\n- La mañana sale 30 min antes de la hora de salir de casa, nunca antes de las 7:30 (el lunes 9 se sale a las 7:51: el aviso llega a las 7:30). El domingo 8 no lleva «mañana»: ya vas de camino y el aviso es el de la llegada.\n- La llegada: aterrizas a las ${route.arrivalFlightTime} + 10 min; «empiezas hacia las 11:25» es la hora útil del primer día (la del motor de coche).\n- El atardecer, 1 hora antes de la puesta de sol (calculada para ese día); con la parada del día si la hay (El Golfo, el Faro de Pechiguera…) o, si no, el sitio de atardecer más cercano a la zona de hoy.\n- El viernes 13: por la mañana, la hora límite del coche en la T1 (17:10); y 30 min antes de salir hacia el aeropuerto (sales a las 15:47) → 15:17.\n- Como mucho 4 al día y ninguno entre las 22:00 y las 7:30 (salvo el de llegada).\n`
fs.writeFileSync('docs/dias/HOY3_AVISOS_DE_ERIC.md', md)
console.log(md)
void horaCorta
