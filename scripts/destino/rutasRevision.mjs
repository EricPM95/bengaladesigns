// LAS RUTAS DE ROMA TAL CUAL SALEN EN LA APP (docs/dias/PROMPT_REVISION_RUTAS.md): 126 rutas (2, 3 y 4 días × 6 combinaciones de experiencias × 7 días de inicio, del 9 al 15 de nov de 2026)
// sacadas con la MISMA generación que hace la app al crear el viaje (`runGeneration`: /api/generate-skeleton, /api/generate-day-places y /api/generate-day-block, y el mismo paso a `Route`) contra el
// servidor de este PC, y ABIERTAS EN DÍAS dentro de la propia app (Chrome sin ventana): lo que enseña la pantalla —el nombre de cada parada, sus minutos, los trayectos («3 min · 227 m»), las paradas «de camino»,
// las comidas y cenas con su restaurante y los avisos de cada parada— se lee de ahí, no se recalcula. De los datos del motor salen el «por qué» de cada parada, el título del día escrito y los cierres.
// Solo saca y enseña: no toca el motor ni ningún dato.
//   API_URL=http://localhost:8787 node scripts/destino/rutasRevision.mjs [--solo=3:A:2026-11-09] [--procesos=4]
// Hace falta el servidor de la app (npm run server) y `npm run dev`. Escribe docs/dias/RUTAS_REVISION.json (una fila por parada) y docs/dias/RUTAS_REVISION.html (la página, con los datos dentro).
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { prepararSSR } from './_ssr.mjs'
import { abrirApp } from './_enLaApp.mjs'
import { escribirPagina } from './rutasRevisionPagina.mjs'

const args = process.argv.slice(2)
const opcion = (n) => args.find((a) => a.startsWith(`--${n}=`))?.split('=')[1] ?? null
const solo = opcion('solo') // «3:A:2026-11-09»
const parte = opcion('parte') // «1/4» (lo usan los procesos hijos)
const PROCESOS = Number(opcion('procesos') ?? 4)

/* ───────────── Lo que se pide ───────────── */
const COMBOS = {
  A: { nombre: 'Arte y Museos + Barrios y Sabores', pos: ['arte_museos', 'barrios_sabores'] },
  B: { nombre: 'Naturaleza y Vistas + Barrios y Sabores', pos: ['naturaleza_vistas', 'barrios_sabores'] },
  C: { nombre: 'Arte y Museos + Naturaleza y Vistas', pos: ['arte_museos', 'naturaleza_vistas'] },
  D: { nombre: 'Free Tour + Arte y Museos', pos: ['free_tour', 'arte_museos'] },
  E: { nombre: 'Free Tour + Barrios y Sabores', pos: ['free_tour', 'barrios_sabores'] },
  F: { nombre: 'Free Tour + Naturaleza y Vistas', pos: ['free_tour', 'naturaleza_vistas'] },
}
const DIAS = [2, 3, 4]
const INICIOS = ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15']
const NOMBRE_DIA_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const diaSemana = (iso) => NOMBRE_DIA_SEMANA[new Date(`${iso}T12:00:00Z`).getUTCDay()]
const suma = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
// Sin vuelos, sin alojamiento y sin monumentos a mano: el contexto de transporte vacío y ningún lugar elegido.
const CONTEXTO = { archetype: null, is_region: null, transport_option: null, vehicle_type: null, vehicle_ownership: null, accommodation_mode: null, travel_mode: null, pase_dominante: null, vehiculo_altamente_recomendado: false, travel_pass_confirmed: null }
const respuestasDe = (n, combo, inicio) => {
  const pos = ['imprescindibles', ...COMBOS[combo].pos]
  return { pos, answers: { origin: 'Madrid', days: n + 1, dateRange: { start: inicio, end: suma(inicio, n) }, companion: 'couple', experiencesPositive: pos, experiencesNegative: [], experiences: null, chronotype: 'normal', budgetLevel: 'comfortable', ...(n === 4 ? { diaCuatro: 'roma' } : {}) } }
}

const lista = []
for (const n of DIAS) for (const combo of Object.keys(COMBOS)) for (const inicio of INICIOS) lista.push({ n, combo, inicio })

/* ═════════════════════════ El proceso principal: reparte el trabajo y lo junta ═════════════════════════ */
if (!parte) {
  const aHacer = solo ? lista.filter((v) => `${v.n}:${v.combo}:${v.inicio}` === solo) : lista
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'rutasRevision-'))
  const hijos = Array.from({ length: Math.min(PROCESOS, aHacer.length) }, (_, i) => i)
  console.log(`Sacando ${aHacer.length} rutas con la generación de la app y abriéndolas en DÍAS (${hijos.length} procesos)…`)
  const t0 = Date.now()
  await Promise.all(
    hijos.map(
      (i) =>
        new Promise((ok, no) => {
          const h = spawn(process.execPath, ['scripts/destino/rutasRevision.mjs', `--parte=${i}/${hijos.length}`, `--salida=${carpeta}`, ...(solo ? [`--solo=${solo}`] : [])], { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
          h.stdout.on('data', (d) => process.stdout.write(`[${i}] ${d}`))
          h.stderr.on('data', (d) => process.stderr.write(`[${i}!] ${d}`))
          h.on('close', (c) => (c === 0 ? ok() : no(new Error(`el proceso ${i} acabó con ${c}`))))
        }),
    ),
  )
  console.log(`Hecho en ${Math.round((Date.now() - t0) / 1000)} s.`)
  const viajes = hijos.flatMap((i) => JSON.parse(fs.readFileSync(path.join(carpeta, `parte_${i}.json`), 'utf8'))).sort((a, b) => lista.findIndex((x) => x.n === a.n && x.combo === a.combo && x.inicio === a.inicio) - lista.findIndex((x) => x.n === b.n && x.combo === b.combo && x.inicio === b.inicio))
  fs.rmSync(carpeta, { recursive: true, force: true })

  /* ───────────── Lo que cambia respecto a la base (A, mismos días y mismo inicio) y las marcas de viaje ───────────── */
  const esParada = (p) => p.tipo === 'parada' || p.tipo === 'noche' || p.tipo === 'free_tour'
  const nombresDe = (v) => v.dias.flatMap((d) => d.paradas.filter(esParada).map((p) => p.nombre_app))
  for (const v of viajes) {
    const base = viajes.find((b) => b.n === v.n && b.combo === 'A' && b.inicio === v.inicio) ?? null
    const baseNombres = new Set(base ? nombresDe(base) : [])
    const nombres = new Set(nombresDe(v))
    v.sale = base && v !== base ? [...baseNombres].filter((x) => !nombres.has(x)) : []
    // (Repetida = el mismo sitio dos veces en el mismo viaje, ambas de día o ambas de noche: Coliseo de día y «Coliseo (noche)» son dos cosas distintas en la app.)
    const llave = (p) => `${p.tipo === 'noche' ? 'noche' : 'dia'}|${p.nombre_base ?? p.nombre_app}`
    const conteo = new Map()
    for (const p of v.dias.flatMap((d) => d.paradas.filter(esParada))) conteo.set(llave(p), (conteo.get(llave(p)) ?? 0) + 1)
    for (const d of v.dias) {
      for (const p of d.paradas) {
        p.entra = Boolean(base && v !== base && esParada(p) && !baseNombres.has(p.nombre_app))
        if (esParada(p) && (conteo.get(llave(p)) ?? 0) > 1) p.marcas.push('repetida')
      }
      d.marcas = d.acaba_tarde ? ['tarde'] : []
    }
  }
  const MARCAS = ['titulo', 'repetida', 'cerrada', 'andando', 'tarde']
  const resumen = Object.fromEntries(MARCAS.map((m) => [m, { total: 0, rutas: 0 }]))
  for (const v of viajes) {
    const en = new Set()
    for (const d of v.dias) {
      if (d.acaba_tarde) {
        resumen.tarde.total++
        en.add('tarde')
      }
      for (const p of d.paradas) for (const m of p.marcas ?? []) {
        resumen[m].total++
        en.add(m)
      }
    }
    for (const m of en) resumen[m].rutas++
  }
  const filas = []
  for (const v of viajes) for (const d of v.dias) d.paradas.forEach((p, i) => filas.push({ dias_del_viaje: v.n, combinacion: v.combo, experiencias: v.nombre_combo, inicio: v.inicio, dia_semana_inicio: v.dia_semana_inicio, dia: d.numero, fecha: d.fecha, nombre_del_dia: d.nombre, orden: i + 1, ...p, marcas_dia: d.marcas }))
  const generado = new Date().toISOString().slice(0, 10)
  if (!solo) {
    fs.writeFileSync('docs/dias/RUTAS_REVISION.json', JSON.stringify({ generado, fuente: 'generación de la app (runGeneration) abierta en DÍAS dentro de la app; sin vuelos, sin alojamiento, sin monumentos a mano', umbrales: { andando_min: 20, dia_acaba_tarde: '22:45' }, resumen, rutas: viajes.length, filas }))
    fs.writeFileSync('scripts/destino/_rutasRevisionViajes.json', JSON.stringify({ resumen, viajes, generado }))
    console.log(`RUTAS_REVISION.html: ${Math.round(escribirPagina({ resumen, viajes, generado }) / 1024)} KB`)
    console.log(`RUTAS_REVISION.json: ${filas.length} filas · ${viajes.length} rutas`)
    console.log('Marcas:', Object.entries(resumen).map(([m, r]) => `${m} ${r.total} (en ${r.rutas} rutas)`).join(' · '))
    const conAlertas = viajes.filter((v) => v.alertas?.length)
    if (conAlertas.length) console.log(`Rutas donde la pantalla y el motor no cuadran: ${conAlertas.length}`)
  } else console.log(JSON.stringify(viajes[0], null, 1).slice(0, 7000))
  process.exit(0)
}

/* ═════════════════════════ Un proceso hijo: sus rutas (motor + pantalla de DÍAS) ═════════════════════════ */
const [miParte, totalPartes] = parte.split('/').map(Number)
const salida = opcion('salida')
const mias = (solo ? lista.filter((v) => `${v.n}:${v.combo}:${v.inicio}` === solo) : lista).filter((_, i) => i % totalPartes === miParte)

const { M: B, limpiar } = await prepararSSR('scripts/destino/_rutas126_entrada.ts')
const App = B.M
await App.cargaDatosDeHorario('Roma')
const destinoRoma = await App.fetchDestinationExcursions('Roma')
void destinoRoma
const horarios = App.datosDeHorarioEnMemoria('Roma')
const norm = (t) => App.normalizaNombre(String(t ?? '')).replace(/\s+/g, ' ')
const romaJson = JSON.parse(fs.readFileSync('data/pipeline_v2/roma.json', 'utf8'))
const pagoDe = new Map((romaJson.places ?? []).filter((p) => p.entrada_de_pago).map((p) => [norm(p.name), p.entrada_de_pago]))
const haversine = (a, b) => {
  const R = 6371000
  const rad = (g) => (g * Math.PI) / 180
  const x = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}
const reales = (c) => c && Number.isFinite(c.lat) && Number.isFinite(c.lng) && !(c.lat === 0 && c.lng === 0)
const aMin = (hhmm) => (hhmm && /^\d{1,2}:\d{2}$/.test(hhmm) ? Number(hhmm.split(':')[0]) * 60 + Number(hhmm.split(':')[1]) : null)

const app = await abrirApp()

/** Lo que el motor da de una ruta: la misma generación que hace la app. */
async function sacarRuta(n, combo, inicio) {
  const { answers } = respuestasDe(n, combo, inicio)
  answers.experiences = App.deriveLegacyExperienceIds(answers.experiencesPositive)
  let ultimo = null
  const route = await App.runGeneration({ destination: 'Roma', answers, transportContext: CONTEXTO, mustIncludePlaces: [] }, null, async (c) => {
    ultimo = c
  })
  return { route, crudo: ultimo.generated }
}

/** La pantalla de DÍAS: crea el mismo viaje DENTRO de la app, abre cada día y lee lo que enseña (el orden de la pantalla, con sus trayectos, comidas y avisos). */
async function leerDeLaApp(n, combo, inicio) {
  const { answers } = respuestasDe(n, combo, inicio)
  return app.evaluar(`(async () => {
    const orq = await import('/src/lib/routeGenerationOrchestrator.ts')
    const { useRouteStore } = await import('/src/store/useRouteStore.ts')
    const { deriveLegacyExperienceIds } = await import('/src/lib/experienceCategoryBank.ts')
    const answers = ${JSON.stringify(answers)}
    answers.experiences = deriveLegacyExperienceIds(answers.experiencesPositive)
    const ctx = ${JSON.stringify(CONTEXTO)}
    const route = await orq.runGeneration({ destination: 'Roma', answers, transportContext: ctx, mustIncludePlaces: [] }, null, async () => {})
    const s = useRouteStore.getState()
    s.setRoute(route); s.setScreen('route'); s.setMode('days')
    await new Promise((r) => setTimeout(r, 1500))
    const NL = String.fromCharCode(10)
    const titulos = Array.from(document.querySelectorAll('[data-titulo-del-dia]')).map((e) => e.innerText)
    const dias = []
    for (const dia of route.days.filter((d) => !d.isReturnLeg)) {
      s.setActiveDayId(dia.id)
      // Se espera a que los trayectos (que pide la propia app a Mapbox) dejen de cambiar.
      let antes = -1, estable = 0
      for (let i = 0; i < 40 && estable < 3; i++) {
        await new Promise((r) => setTimeout(r, 400))
        const hay = document.querySelectorAll('[data-stop-id]').length
        const trayectos = document.body.innerText.split(NL).filter((l) => /min · /.test(l)).length
        const marca = hay * 1000 + trayectos
        if (hay > 0 && marca === antes) estable++
        else { estable = 0; antes = marca }
      }
      const L = document.body.innerText.split(NL)
      let cursor = 0
      const items = []
      for (const el of document.querySelectorAll('[data-stop-id]')) {
        const bl = el.innerText.split(NL)
        let idx = -1
        for (let i = cursor; i < L.length; i++) if (L[i] === bl[0] && L[i + 1] === bl[1]) { idx = i; break }
        if (idx < 0) { items.push({ entre: [], bloque: bl, perdido: true }); continue }
        items.push({ entre: L.slice(cursor, idx), bloque: bl })
        cursor = idx + bl.length
      }
      const fin = L.indexOf('Fin del día.', cursor)
      dias.push({ numero: dia.dayNumber, items, cola: L.slice(cursor, fin < 0 ? cursor + 12 : fin + 1) })
    }
    return { titulos, dias }
  })()`)
}

/* ───────────── Leer lo que enseña la pantalla ───────────── */
const REG_DURACION = /^(\d+h)?\s?(\d+min)?$/
const REG_HORARIO = /^Abre /
const REG_AVISO = /cerrad|abre a las|abierto|reserva|agotad|espera|por fuera|hoy cierra|no abre|aún no/i
const durMin = (t) => {
  const h = /(\d+)h/.exec(t)
  const m = /(\d+)min/.exec(t)
  return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0)
}
/** Un bloque de parada de la pantalla: nombre, minutos, horario de ese día y avisos. */
function leerBloque(bl) {
  const [nombre, ...resto] = bl
  let minutos = null
  let horario = null
  const avisos = []
  const etiquetas = []
  for (const l of resto) {
    if (!l || l === '···' || /^[0-9]+$/.test(l)) continue
    if (REG_HORARIO.test(l)) horario = l
    else if (REG_DURACION.test(l) && l.trim()) minutos = durMin(l)
    else if (REG_AVISO.test(l)) avisos.push(l)
    else etiquetas.push(l)
  }
  return { nombre, minutos, horario, avisos, etiquetas }
}
/** Lo que hay ENTRE dos paradas en la pantalla: trayectos, «de camino», comidas y cenas. */
function leerEntre(lineas) {
  const tramos = []
  const comidas = []
  let i = 0
  while (i < lineas.length) {
    const l = lineas[i]
    const m = /^(\d+) min · ([\d.,]+ ?(?:m|km))$/.exec(l)
    if (m) tramos.push({ min: Number(m[1]), texto: `${m[1]} min · ${m[2]}` })
    else if (/^DE CAMINO A /i.test(l)) tramos.push({ min: null, texto: l.charAt(0) + l.slice(1).toLowerCase() })
    else if (/^(COMIDA|CENA|DESAYUNO)$/.test(l)) {
      const resto = []
      let j = i + 1
      while (j < lineas.length && lineas[j] !== 'Cambiar') resto.push(lineas[j++])
      comidas.push({ tipo: l === 'CENA' ? 'cena' : l === 'DESAYUNO' ? 'desayuno' : 'comida', restaurante: resto[0] ?? null, trayecto: resto[1] ?? null })
      i = j
    } else if (/(Bus|Metro|Tranv|Taxi)/i.test(l) && /min/.test(l) && !/andando desde/.test(l)) tramos.push({ min: null, texto: l })
    i++
  }
  return { tramos, comidas }
}

const CUANDO = { manana: 'por la mañana', tarde: 'por la tarde', noche: 'de noche' }
/** «Por qué va ahí»: solo lo que el motor ya sabe, sin inventar. */
function porQue({ s, c, fila, log, previa, diaEscrito, esNoche }) {
  const razones = []
  const propios = log.filter((l) => l.id === fila?.id || (c && l.lugar === c.name && !/noche/.test(l.que)) || (esNoche && l.que === 'noche' && c && l.id === `noche_${norm(c.name).replace(/[^a-z0-9]+/g, '_').replace(/_noche$/, '')}_noche`))
  for (const l of propios) razones.push(l.causa)
  if (c?.is_free_tour || s.isFreeTour) razones.push('la añade el Free Tour')
  else if (c?.in_free_tour || s.inFreeTour) razones.push('se ve dentro del Free Tour')
  if (c?.outside_reason) razones.push(c.outside_reason)
  if (c?.why_condition) razones.push(c.why_condition)
  if (c?.hora_tipo === 'reserva') razones.push('va a la hora de su reserva')
  if (c?.wait_hint) razones.push(c.wait_hint)
  if (c?.por_el_camino) razones.push('de camino a la siguiente')
  if (fila?.texto_documento) razones.push(`el día escrito dice: «${fila.texto_documento}»`)
  if (previa && reales(previa.coordinates) && reales(s.coordinates)) {
    const m = Math.round(haversine(previa.coordinates, s.coordinates))
    if (m <= 300) razones.push(`está al lado de la anterior (a ${m} m)`)
  }
  // (Todo lo que no tiene una razón guardada «lo pide el día escrito».)
  razones.push(esNoche ? 'lo pide el día escrito (la parte de noche)' : `lo pide el día escrito${diaEscrito ? ` «${diaEscrito}»` : ''}${CUANDO[s.franja] ? `, ${CUANDO[s.franja]}` : ''}`)
  return [...new Set(razones)]
}

/** Las filas del día escrito, para saber el título que el documento da a cada parada. */
function emparejarTitulos(crudoDia, paradasCrudas) {
  const filas = (crudoDia.escrito_rows ?? []).filter((f) => !f.llegada && f.tipo !== 'traslado' && f.lugar)
  let puntero = 0
  return paradasCrudas.map((c) => {
    if (!c) return null
    const busca = norm(c.display_title ?? c.name)
    for (let i = puntero; i < filas.length; i++) {
      const f = filas[i]
      if (norm(f.lugar) === norm(c.name) || norm(f.titulo ?? f.lugar) === busca || norm(f.lugar) === norm(c.place_name ?? '')) {
        puntero = i + 1
        return f
      }
    }
    return null
  })
}
const UMBRAL_ANDANDO = 20
const UMBRAL_TARDE = 22 * 60 + 45 // un día que acaba a las 22:45 o más tarde (alrededor del 8 % de los días)
const GENERICAS = new Set(['iglesia', 'basilica', 'plaza', 'piazza', 'palacio', 'museo', 'museos', 'fuente', 'fontana', 'parque', 'calle', 'santa', 'maria', 'paseo', 'terraza', 'mirador', 'puente', 'barrio', 'tiempo', 'libre', 'noche', 'desde', 'junto', 'para', 'sobre', 'entre', 'hasta', 'dentro'])
const significativas = (t) => new Set(norm(t).split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !GENERICAS.has(w)))
/** El título del día escrito no tiene NADA en común con el nombre del sitio (p. ej. «Reloj de agua del Pincio» frente a «Parque de Villa Borghese»). */
const tituloAjeno = (base, titulo) => {
  const a = significativas(base)
  const b = significativas(titulo)
  return ![...a].some((w) => b.has(w))
}

function filasDeRuta(n, combo, inicio, route, crudo, delaApp) {
  const dias = []
  const alertas = []
  for (const dia of route.days.filter((d) => !d.isReturnLeg)) {
    const fecha = suma(inicio, dia.dayNumber - 1)
    const diaCrudo = crudo.days.find((x) => x.day_number === dia.dayNumber) ?? {}
    const crudas = diaCrudo.stops ?? []
    const alineadas = crudas.length === dia.stops.length
    const titulos = emparejarTitulos(diaCrudo, alineadas ? crudas : dia.stops.map(() => null))
    const log = diaCrudo.engine_log ?? []
    const diaEscrito = diaCrudo.curated_day?.name ?? null
    const pantalla = delaApp.dias.find((d) => d.numero === dia.dayNumber)
    // Las paradas con número de la pantalla, en orden, emparejadas con las del motor que no son «de paso».
    const delMotor = dia.stops.map((s, i) => ({ s, c: alineadas ? crudas[i] : null, fila: alineadas ? titulos[i] : null, previa: i > 0 ? dia.stops[i - 1] : null })).filter((x) => !x.s.passThrough)
    if (pantalla.items.length !== delMotor.length) alertas.push(`día ${dia.dayNumber}: la pantalla enseña ${pantalla.items.length} paradas y el motor ${delMotor.length}`)
    const paradas = []
    let finDia = 0
    pantalla.items.forEach((item, i) => {
      const x = delMotor[i] ?? null
      const s = x?.s ?? {}
      const bloque = leerBloque(item.bloque)
      const antes = leerEntre(item.entre)
      // Los trayectos de este hueco se pintaron justo debajo de la parada anterior: son su «trayecto hasta la siguiente».
      const previo = paradas.filter((p) => ['parada', 'noche', 'free_tour', 'pausa'].includes(p.tipo)).at(-1)
      if (previo && antes.tramos.length) {
        previo.trayecto = antes.tramos.map((t) => t.texto).join(' → ')
        if (antes.tramos.some((t) => t.min != null && t.min > UMBRAL_ANDANDO)) previo.marcas.push('andando')
      }
      for (const c of antes.comidas) paradas.push({ tipo: c.tipo, nombre_app: c.tipo === 'cena' ? 'Cena' : c.tipo === 'desayuno' ? 'Desayuno' : 'Comida', restaurante: c.restaurante, trayecto_comida: c.trayecto, entra: false, marcas: [], avisos: [] })
      const esNoche = Boolean(s.isNightExperience) || bloque.etiquetas.includes('Experiencia nocturna')
      const marcas = []
      const avisos = [...bloque.avisos]
      const cerradoHoy = avisos.some((a) => /^Cerrado (hoy|este día)/i.test(a))
      if (cerradoHoy) marcas.push('cerrada')
      const horarioMotor = x ? App.horarioDeParada({ hoursData: horarios.get(norm(s.name)) ?? (s.fullName ? horarios.get(norm(s.fullName)) : null), scheduleText: s.scheduleText, hours: s.hours }, fecha, null) : null
      if (horarioMotor?.cerrado && !cerradoHoy) {
        avisos.push(`Cerrado hoy (${diaSemana(fecha)})`)
        marcas.push('cerrada')
      }
      if (x?.c?.outside_reason) avisos.push(`Por fuera: ${x.c.outside_reason}`)
      if (s.reservation && s.reservation !== 'no') avisos.push(`Reserva: ${s.reservation}`)
      if (x?.c?.reservation_time) avisos.push(`Reserva a las ${x.c.reservation_time}`)
      if (x?.c?.notice) avisos.push(x.c.notice)
      const pago = pagoDe.get(norm(s.name))
      if (pago) {
        const aviso = App.avisoPagoEntrada(pago, aMin(s.time), diaSemana(fecha))
        if (aviso) avisos.push(aviso)
      }
      const tituloEscrito = x?.fila?.titulo ?? null
      const nombreSitio = s.name ?? bloque.nombre
      const distinto = Boolean(tituloEscrito) && norm(tituloEscrito) !== norm(nombreSitio)
      if (distinto && tituloAjeno(nombreSitio, tituloEscrito)) marcas.push('titulo')
      const fin = (aMin(s.time) ?? 0) + (s.durationMinutes ?? 0)
      if (!s.isBreak) finDia = Math.max(finDia, fin)
      paradas.push({
        tipo: esNoche ? 'noche' : s.isBreak ? 'pausa' : s.isFreeTour ? 'free_tour' : 'parada',
        nombre_app: bloque.nombre,
        nombre_base: s.name && s.name !== bloque.nombre && App.displayStopName(s.name) !== bloque.nombre ? s.name : null,
        titulo_escrito: tituloEscrito,
        titulo_leve: distinto && !tituloAjeno(nombreSitio, tituloEscrito),
        minutos: bloque.minutos,
        horario: bloque.horario,
        por_que: x ? porQue({ s, c: x.c, fila: x.fila, log, previa: x.previa, diaEscrito, esNoche }) : ['lo pide el día escrito'],
        trayecto: null,
        avisos: [...new Set(avisos)],
        marcas,
        etiquetas: bloque.etiquetas,
      })
    })
    // Lo que queda después de la última parada (la cena de la noche) y el último trayecto.
    const cola = leerEntre(pantalla.cola ?? [])
    const ultimo = paradas.filter((p) => ['parada', 'noche', 'free_tour', 'pausa'].includes(p.tipo)).at(-1)
    if (ultimo && cola.tramos.length) ultimo.trayecto = cola.tramos.map((t) => t.texto).join(' → ')
    for (const c of cola.comidas) paradas.push({ tipo: c.tipo, nombre_app: c.tipo === 'cena' ? 'Cena' : 'Comida', restaurante: c.restaurante, trayecto_comida: c.trayecto, entra: false, marcas: [], avisos: [] })
    const cenaMotor = (dia.meals ?? []).find((m) => m.mealTime === 'dinner')
    if (cenaMotor) finDia = Math.max(finDia, (aMin(cenaMotor.time) ?? 0) + 75)
    dias.push({
      numero: dia.dayNumber,
      fecha,
      dia_semana: diaSemana(fecha),
      nombre: delaApp.titulos[dia.dayNumber - 1] || (dia.curatedTitle ?? dia.title), // el título que enseña DÍAS
      nombre_escrito: dia.curatedTitle ?? null,
      dia_escrito: diaEscrito,
      eleccion: diaEscrito ? `Para «${COMBOS[combo].nombre}», el motor ha elegido el día escrito «${diaEscrito}» para este día.` : null,
      plan_lluvia: dia.rainPlan?.text ?? null,
      plan_lluvia_quita: dia.rainPlan?.remove ?? [],
      plan_lluvia_pone: (dia.rainPlan?.add ?? []).map((a) => a.name),
      deja_fuera: (dia.didntMakeCut ?? []).map((d) => (typeof d === 'string' ? d : (d.name ?? d.title ?? JSON.stringify(d)))),
      avisos_dia: [dia.dayNotice, dia.transferNotice, ...(dia.poolNotices ?? []).map((p) => (typeof p === 'string' ? p : (p.text ?? JSON.stringify(p))))].filter(Boolean),
      acaba_tarde: finDia >= UMBRAL_TARDE,
      fin_interno_min: finDia,
      paradas,
    })
  }
  return { dias, alertas }
}

const viajes = []
const t0 = Date.now()
for (const [i, v] of mias.entries()) {
  const { route, crudo } = await sacarRuta(v.n, v.combo, v.inicio)
  const delaApp = await leerDeLaApp(v.n, v.combo, v.inicio)
  const { dias, alertas } = filasDeRuta(v.n, v.combo, v.inicio, route, crudo, delaApp)
  viajes.push({ ...v, nombre_combo: COMBOS[v.combo].nombre, dia_semana_inicio: diaSemana(v.inicio), alertas, dias })
  console.log(`${i + 1}/${mias.length} ${v.n}:${v.combo}:${v.inicio} (${Math.round((Date.now() - t0) / 1000)} s)${alertas.length ? ' · ' + alertas.join(' | ') : ''}`)
}
fs.writeFileSync(path.join(salida, `parte_${miParte}.json`), JSON.stringify(viajes))
app.cerrar()
limpiar?.()
process.exit(0)
