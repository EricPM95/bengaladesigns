// La prueba de la página de revisión de los viajes LARGOS (docs/dias/RUTAS_REVISION_LARGOS.html): lo que sale en la página es lo mismo que enseña la app. Para 2 rutas (5 días con el día 4 en Roma, A, empezando el lunes 9, y
// 6 días con el día 4 de excursión, D, empezando el sábado 14 de noviembre de 2026) crea el viaje DENTRO de la app (npm run dev, en un Chrome sin ventana: la misma generación, las mismas pantallas), abre cada día en
// DÍAS y compara con los datos de la página (títulos, paradas y orden, minutos, «de camino», trayectos, restaurantes y «Cerrado»). Hace falta el servidor de la app (npm run server) y `npm run dev`.
//   API_URL=http://localhost:8787 node scripts/destino/pruebaRevisionLargos.mjs
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

const html = fs.readFileSync('docs/dias/RUTAS_REVISION_LARGOS.html', 'utf8')
let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}

const CASOS = [
  { n: 5, dia4: 'roma', combo: 'A', inicio: '2026-11-09', que: '5 días (día 4 en Roma) A, lunes' },
  { n: 6, dia4: 'excursion', combo: 'D', inicio: '2026-11-14', que: '6 días (día 4 de excursión) D, sábado' },
]
const POS = { A: ['arte_museos', 'barrios_sabores'], D: ['free_tour', 'arte_museos'] }
const suma = (iso, k) => new Date(Date.parse(`${iso}T12:00:00Z`) + k * 86400000).toISOString().slice(0, 10)
const aTexto = (min) => (min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}min` : ''}` : `${min}min`)

// La página tiene que ser la que lleva estos datos dentro.
// (Los datos que se comparan son los que lleva DENTRO la propia página: así la prueba no depende de ningún archivo intermedio.)
const dentro = JSON.parse(html.match(/<script id="datos" type="application\/json">([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, '<'))
debe(dentro.viajes.length === 210 && dentro.largos === true, 'pagina', 'la página lleva las 210 rutas dentro')
const datos = dentro

const app = await abrirApp()
for (const caso of CASOS) {
  console.log(`· ${caso.que}`)
  const v = datos.viajes.find((x) => x.n === caso.n && x.dia4 === caso.dia4 && x.combo === caso.combo && x.inicio === caso.inicio)
  const pos = ['imprescindibles', ...POS[caso.combo]]
  const respuesta = await app.evaluar(`(async () => {
    const orq = await import('/src/lib/routeGenerationOrchestrator.ts')
    const { useRouteStore } = await import('/src/store/useRouteStore.ts')
    const { deriveLegacyExperienceIds } = await import('/src/lib/experienceCategoryBank.ts')
    const pos = ${JSON.stringify(pos)}
    const answers = { origin: 'Madrid', days: ${caso.n + 1}, dateRange: { start: '${caso.inicio}', end: '${suma(caso.inicio, caso.n)}' }, companion: 'couple', diaCuatro: '${caso.dia4}', experiencesPositive: pos, experiencesNegative: [], experiences: deriveLegacyExperienceIds(pos), chronotype: 'normal', budgetLevel: 'comfortable'}
    const ctx = { archetype: null, is_region: null, transport_option: null, vehicle_type: null, vehicle_ownership: null, accommodation_mode: null, travel_mode: null, pase_dominante: null, vehiculo_altamente_recomendado: false, travel_pass_confirmed: null }
    const route = await orq.runGeneration({ destination: 'Roma', answers, transportContext: ctx, mustIncludePlaces: [] }, null, async () => {})
    const s = useRouteStore.getState()
    s.setRoute(route); s.setScreen('route'); s.setMode('days')
    await new Promise((r) => setTimeout(r, 3000))
    const titulos = Array.from(document.querySelectorAll('[data-titulo-del-dia]')).map((e) => e.innerText)
    const dias = []
    for (const dia of route.days.filter((d) => !d.isReturnLeg)) {
      s.setActiveDayId(dia.id)
      await new Promise((r) => setTimeout(r, 7000))
      const paradas = Array.from(document.querySelectorAll('[data-stop-id]')).map((e) => ({ lineas: e.innerText.split('\\n') }))
      dias.push({ numero: dia.dayNumber, texto: document.body.innerText, paradas })
    }
    return { titulos, dias }
  })()`)
  debe(respuesta.titulos.slice(0, v.dias.length).join('|') === v.dias.map((d) => d.nombre).join('|'), 'titulos', `${caso.que}: los títulos de los días (${respuesta.titulos.join(' / ')}) frente a la página (${v.dias.map((d) => d.nombre).join(' / ')})`)
  for (const dia of respuesta.dias) {
    const d = v.dias.find((x) => x.numero === dia.numero)
    const esperadas = d.paradas.filter((p) => ['parada', 'noche', 'free_tour', 'pausa'].includes(p.tipo))
    const en = dia.paradas.map((p) => p.lineas[0])
    const nombres = esperadas.map((p) => p.nombre_app)
    debe(JSON.stringify(en) === JSON.stringify(nombres), 'nombres', `${caso.que}, día ${dia.numero}: paradas y orden\n   app:    ${en.join(' | ')}\n   página: ${nombres.join(' | ')}`)
    // Los minutos de visita («1h 15min», «10min»).
    const minApp = dia.paradas.map((p) => p.lineas.find((l) => /^(\d+h)?\s?(\d+min)?$/.test(l) && l.trim() !== '') ?? null)
    const minPagina = esperadas.map((p) => (p.minutos == null ? null : aTexto(p.minutos)))
    const malos = minPagina.map((m, i) => (m !== minApp[i] ? `${nombres[i]}: app «${minApp[i]}» · página «${m}»` : null)).filter(Boolean)
    debe(malos.length === 0, 'minutos', `${caso.que}, día ${dia.numero}: minutos de visita distintos\n   ${malos.join('\n   ')}`)
    // Las paradas «de camino» (sin número): la app las enseña como «DE CAMINO A …· pasas por …» y la página las lleva dentro del trayecto, igual y en el mismo sitio.
    const caminosApp = [...dia.texto.matchAll(/^DE CAMINO A .*$/gim)].map((m) => m[0].trim().toLowerCase())
    const caminosPagina = d.paradas.flatMap((p) => (p.trayecto ?? "").split(" → ").filter((t) => /^de camino a /i.test(t))).map((t) => t.trim().toLowerCase())
    debe(JSON.stringify(caminosApp) === JSON.stringify(caminosPagina), "de_camino", `${caso.que}, día ${dia.numero}: paradas de camino
   app:    ${caminosApp.join(" | ")}
   página: ${caminosPagina.join(" | ")}`)
    // Los trayectos entre paradas: el «N min · distancia» que enseña la app, en el mismo orden y con los mismos minutos.
    const andandoApp = [...dia.texto.matchAll(/^(\d+) min · [\d.,]+ ?(?:m|km)$/gm)].map((m) => Number(m[1]))
    const andandoPagina = d.paradas.flatMap((p) => [...(p.trayecto ?? "").matchAll(/(\d+) min · /g)].map((m) => Number(m[1])))
    debe(JSON.stringify(andandoApp) === JSON.stringify(andandoPagina), "trayectos", `${caso.que}, día ${dia.numero}: minutos entre paradas
   app:    ${andandoApp.join(" ")}
   página: ${andandoPagina.join(" ")}`)
    // Los restaurantes de la comida y de la cena.
    const restaurantes = d.paradas.filter((p) => (p.tipo === 'comida' || p.tipo === 'cena') && p.restaurante).map((p) => p.restaurante)
    const sinRest = restaurantes.filter((r) => !dia.texto.includes(r))
    debe(sinRest.length === 0, 'restaurantes', `${caso.que}, día ${dia.numero}: la app no enseña los restaurantes ${sinRest.join(', ')}`)
    // Lo cerrado ese día: la app dice «Cerrado» en esa parada.
    for (const [i, p] of esperadas.entries()) {
      const marcada = (p.marcas ?? []).includes('cerrada')
      const lineas = dia.paradas[i]?.lineas ?? []
      const dice = lineas.some((l) => /Cerrado/.test(l))
      debe(marcada === dice, 'cerrada', `${caso.que}, día ${dia.numero}: «${p.nombre_app}» ${marcada ? 'la página dice cerrada y la app no' : 'la app dice cerrada y la página no'}`)
    }
  }
}
app.cerrar()
console.log(`\nPrueba de la revisión de los viajes largos: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
