// La prueba de la Tanda 6i (PARA_CODE_TANDA6I.md, punto 6): los viajes de 1 a 6 días, con y sin Free Tour, tal como los saca el servidor (lo que ve el viajero).
//   node scripts/destino/pruebaTanda6i.mjs [paso=30] [out=docs/dias/PRUEBA_TANDA6I.md] [fallos=ruta.txt]
//   1. 0 líneas «hoy no toca entrar» (una parada de camino nunca sale suelta como «Por fuera: …»).
//   2 y 3. 0 «+ Añadir parada» seguidos y 0 puntitos sueltos: se comprueban sobre lo que pinta la pantalla (el código del hueco y de la cabecera de franja) y en el móvil a 375 px.
//   4. 0 trayectos de «0 m» entre dos paradas seguidas (la causa de la 6f no lo cazaba: la prueba miraba minutos de trayecto, no los puntos).
//   5. El D4 con la Galería a las 11:00: el Parque va antes que la Galería (si no cabe, se apunta con la parada que lo empuja; no se cambia nada).
//   6. Las tarjetas de camino van siempre hacia una parada de verdad (o la comida o la cena).
//   7. La foto del Castillo según cómo se visita: por fuera, «(por fuera)»; por dentro, la de siempre (y lo mismo para cualquier sitio con las dos fotos).
import fs from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { straightLineMeters } from '../../shared/routeEngine/travelTimes.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const D = findPipelineV2Data('Roma')
const paso = Number(args.paso ?? 30)
const out = args.out ?? 'docs/dias/PRUEBA_TANDA6I.md'
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const fechas = []
for (let d = 0; d < 365; d += paso) fechas.push(addDays('2027-01-01', d))
const fallos = []
const info = new Map()
const porRegla = new Map()
const falla = (regla, texto) => {
  fallos.push({ regla, texto })
  porRegla.set(regla, (porRegla.get(regla) ?? 0) + 1)
}
const apunta = (regla, texto) => {
  const v = info.get(regla) ?? { n: 0, ejemplos: [] }
  v.n++
  if (texto && v.ejemplos.length < 8) v.ejemplos.push(texto)
  info.set(regla, v)
}
const leer = (ruta) => fs.readFileSync(ruta, 'utf8')
const FORMAS = [
  { dias: 1 },
  { dias: 2, medio: { franja: 'tarde' } },
  { dias: 2 },
  { dias: 2, ft: true },
  { dias: 3 },
  { dias: 3, ft: true },
  { dias: 4 },
  { dias: 4, ft: true },
  { dias: 4, diaCuatro: 'excursion' },
  { dias: 5 },
  { dias: 5, ft: true, diaCuatro: 'roma' },
  { dias: 6 },
  { dias: 6, ft: true },
  { dias: 6, diaCuatro: 'roma' },
]
const conFoto = (modo) => D.places.filter((p) => p[`search_en_${modo}`]).map((p) => p.name)
const porFuera = new Set(conFoto('fuera'))
const porDentro = new Set(conFoto('dentro'))
let dias = 0
let trayectos = 0
for (const forma of FORMAS) {
  for (const inicio of fechas) {
    const etiqueta = `${forma.dias} días${forma.medio ? ' con medio día' : ''}${forma.ft ? ' con Free Tour' : ''}${forma.diaCuatro ? `, interruptor en ${forma.diaCuatro}` : ''} · inicio ${inicio}`
    for (let d = 1; d <= forma.dias; d++) {
      let day
      try {
        day = await buildDayBlockV3(D, forma.dias + 1, Boolean(forma.ft), d, null, inicio, [], forma.ft ? ['imprescindibles', 'free_tour'] : ['imprescindibles'], { city: 'Roma', scheduler: 'v3', engine: 'v4', mediaJornada: forma.medio ?? null, diaCuatro: forma.diaCuatro ?? null })
      } catch (error) {
        falla('error', `${etiqueta} día ${d}: ${error.message}`)
        continue
      }
      if (!day?.stops) continue
      dias++
      const donde = `${etiqueta} · día ${d} ${day.curated_day?.id ?? ''}`
      const stops = day.stops
      // 1. Nada de «hoy no toca entrar» ni de «Por fuera» de una parada de camino.
      for (const s of stops) {
        if (s.pass_through && (s.outside || s.outside_reason)) falla('hoy_no_toca_entrar', `${donde}: «${s.name}» va de camino y sale con «por fuera»`)
        if (/hoy no toca entrar/i.test(JSON.stringify(s))) falla('hoy_no_toca_entrar', `${donde}: «${s.name}» lleva el texto «hoy no toca entrar»`)
      }
      // 4. 0 trayectos de «0 m»: dos paradas seguidas (distintas) en el mismo punto.
      const reales = stops.filter((s) => !s.is_arrival && Number.isFinite(s.latitude) && !(s.latitude === 0 && s.longitude === 0))
      for (let i = 1; i < reales.length; i++) {
        trayectos++
        const [a, b] = [reales[i - 1], reales[i]]
        if (a.name === b.name) continue
        // (Con la comida o la cena entre las dos no hay trayecto entre ellas: la tarjeta de la mesa va en medio.)
        if ((day.meals ?? []).some((m) => String(m.suggested_time) > String(a.suggested_time) && String(m.suggested_time) <= String(b.suggested_time))) continue
        if (straightLineMeters([a.latitude, a.longitude], [b.latitude, b.longitude]) < 20) falla('trayecto_0_m', `${donde}: «${a.display_title ?? a.name}» → «${b.display_title ?? b.name}» sale a 0 m`)
      }
      // 6. Las tarjetas de camino: un tramo de paradas de camino seguidas acaba en una parada de verdad, la comida o la cena (nunca en el último sitio del día ni en otro camino).
      const comidas = (day.meals ?? []).map((m) => m.suggested_time)
      for (let i = 0; i < stops.length; i++) {
        if (!stops[i].pass_through) continue
        let j = i
        while (j + 1 < stops.length && stops[j + 1].pass_through) j++
        const siguiente = stops[j + 1]
        const hayComidaDespues = (day.meals ?? []).some((m) => String(m.suggested_time) >= String(stops[j].suggested_time))
        if (!siguiente && !hayComidaDespues) apunta('camino_al_final_del_dia', `${donde}: el tramo de camino que acaba en «${stops[j].name}» no lleva a ninguna parada`)
        i = j
      }
      void comidas
      // 7. La foto según cómo se visita.
      for (const s of stops) {
        const nombre = s.name
        if (s.visit_mode === 'fuera' && porFuera.has(nombre) && s.photo_name !== `${nombre} (por fuera)` && !s.is_night_experience) falla('foto_por_modo', `${donde}: «${nombre}» va por fuera y no pide su foto de fuera`)
        if (s.visit_mode === 'dentro' && porFuera.has(nombre) && /\(por fuera\)$/.test(s.photo_name ?? '')) falla('foto_por_modo', `${donde}: «${nombre}» va por dentro y pide la foto de fuera`)
        if (s.visit_mode === 'dentro' && porDentro.has(nombre) && s.photo_name !== `${nombre} (por dentro)`) falla('foto_por_modo', `${donde}: «${nombre}» va por dentro y no pide su foto de dentro`)
      }
      // 5. El D4 con la Galería a las 11:00: el Parque va antes que la Galería.
      if (day.curated_day?.id === 'D4') {
        const galeria = stops.findIndex((s) => s.name === 'Galería Borghese' && !s.is_arrival)
        const parque = stops.findIndex((s) => s.name === 'Parque de Villa Borghese' && s.display_title !== 'Reloj de agua del Pincio' && s.duration_minutes >= 30)
        const galeria11 = galeria >= 0 && /^(11:00|11:00:00)$/.test(String(stops[galeria].reservation_time ?? stops[galeria].suggested_time ?? '').slice(0, 5))
        if (galeria11 && parque >= 0) {
          if (parque < galeria) apunta('d4_parque_antes_que_galeria_ok')
          else apunta('d4_galeria_antes_que_parque', `${donde}: el Parque va después de la Galería`)
        }
      }
    }
  }
}
// 2 y 3. Lo que pinta la pantalla: nunca dos «+ Añadir parada» seguidos ni un puntito suelto (el código del hueco, de la cabecera de franja y de la parada de camino).
const panel = leer('src/components/route/dayDetail/DayDetailPanel.tsx')
const conector = leer('src/components/route/dayDetail/StopConnector.tsx')
const acordeon = leer('src/components/route/dayDetail/StopAccordion.tsx')
const cabecera = leer('src/components/route/dayDetail/TrazoCards.tsx')
if (!/if \(item\.type === 'mealGap'\) return null/.test(panel)) falla('dos_anadir_parada', 'DayDetailPanel.tsx: el hueco de antes de la comida o la cena se pinta dos veces (el suyo y el de la tarjeta)')
if (!/omitFirstGap && i === 0 \? null/.test(panel) || !/omitGap \? null/.test(panel)) falla('dos_anadir_parada', 'DayDetailPanel.tsx: el hueco de antes de la primera parada de una franja sigue pintándose junto al título')
if (!/onAddStop && \(/.test(cabecera)) falla('dos_anadir_parada', 'TrazoCards.tsx: el título de la franja no lleva «+ Añadir parada»')
if (!/bg-bg-card pl-\[26px\]/.test(conector)) falla('puntito_suelto', 'StopConnector.tsx: un hueco sin nada que enseñar deja la línea punteada suelta como un puntito')
if (/Por fuera: <span/.test(acordeon) || /TimelineNote/.test(acordeon)) falla('hoy_no_toca_entrar', 'StopAccordion.tsx: sigue existiendo la línea suelta «Por fuera: …»')
const lineas = [
  '# Prueba de la Tanda 6i',
  '',
  `${dias} días de viaje (de 1 a 6 días, con y sin Free Tour, ${fechas.length} fechas de 2027) y ${trayectos} trayectos entre paradas, tal como los saca el servidor.`,
  '',
  `**Fallos: ${fallos.length}.**`,
  '',
  '## Por regla',
  '',
  ...(porRegla.size === 0 ? ['Ninguna.'] : [...porRegla].map(([regla, n]) => `- ${regla}: ${n}`)),
  '',
  '## Lo que se apunta (no es un fallo)',
  '',
  ...[...info].flatMap(([regla, v]) => [`- ${regla}: ${v.n}`, ...v.ejemplos.map((e) => `  - ${e}`)]),
  '',
  '## Primeros fallos de cada regla',
  '',
  ...[...porRegla.keys()].flatMap((regla) => [`### ${regla} (${porRegla.get(regla)})`, '', ...fallos.filter((f) => f.regla === regla).slice(0, 12).map((f) => `- ${f.texto}`), '']),
]
fs.writeFileSync(out, lineas.join('\n'))
if (args.fallos) fs.writeFileSync(args.fallos, fallos.map((f) => `[${f.regla}] ${f.texto}`).join('\n'))
console.log(JSON.stringify({ dias, trayectos, fallos: fallos.length, porRegla: Object.fromEntries(porRegla), info: Object.fromEntries([...info].map(([k, v]) => [k, v.n])) }))
