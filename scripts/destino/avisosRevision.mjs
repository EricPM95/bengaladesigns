// La página para revisar TODOS LOS AVISOS que pueden salir en la ruta al crear un viaje (Tanda 10L, parte 3): una captura de cada uno tal como sale en la app, su texto,
// cuándo sale (fechas y condición) y dónde (arriba de la ruta o en qué día de DÍAS).
//
// Los textos NO están copiados: el script recorre el motor de Roma (server/engine, solo lectura) con viajes de 2, 3 y 5 días que empiezan cada día de 2027, recoge cada aviso distinto que sale
// (tarjeta de Navidad, avisos de fechas especiales, cierres y cambios de ruta, banner de contexto, avisos de las paradas), elige para cada uno el viaje más corto que lo saca y, con
// ese viaje de prueba (solo para la captura), abre la app real (Chrome sin ventana, 390 px) y fotografía la pantalla. Cuando cambies un texto del motor, vuelve a lanzarlo y sale el nuevo.
//
// Hace falta `npm run server` y `npm run dev`. Escribe docs/dias/AVISOS_REVISION.html (con las capturas dentro, para abrirlo en el móvil sin nada más) y docs/dias/capturas_jutrip/avisos_*.jpg.
//   node scripts/destino/avisosRevision.mjs                 todo
//   node scripts/destino/avisosRevision.mjs --solo=nochebuena   solo los avisos cuyo id o título contiene ese texto
//   node scripts/destino/avisosRevision.mjs --sin-capturas  solo la página con los textos (sin abrir la app; las capturas ya hechas se reutilizan si existen)
// Variables: APP_URL (por defecto http://localhost:5173).
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { abrirApp } from './_enLaApp.mjs'

const RAIZ = path.resolve('.')
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const opciones = Object.fromEntries(process.argv.slice(2).map((x) => x.replace(/^--/, '').split(/=(.*)/s).slice(0, 2)))
const SOLO = opciones.solo ?? null
const SIN_CAPTURAS = 'sin-capturas' in opciones
fs.mkdirSync(SALIDA, { recursive: true })

const { buildDayBlockV3 } = await import(pathToFileURL(path.join(RAIZ, 'server/engine/index.js')).href)
const { findPipelineV2Data } = await import(pathToFileURL(path.join(RAIZ, 'server/routeAlgorithm.js')).href)
const D = findPipelineV2Data('Roma')

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const sumar = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const dia = (iso) => `${Number(iso.slice(8, 10))} de ${MESES[Number(iso.slice(5, 7)) - 1]}`
const diaCorto = (iso) => `${Number(iso.slice(8, 10))} ${MESES[Number(iso.slice(5, 7)) - 1].slice(0, 3)}`
const sem = (iso) => SEMANA[new Date(`${iso}T12:00:00Z`).getUTCDay()]
const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const norm = (t) => String(t).replace(/\d+(:\d+)?/g, '#')

// ───────────────────────────── 1. Recorrer el motor y recoger cada aviso distinto ─────────────────────────────
const AÑO = 2027
const LARGOS = [2, 3, 5]
const catalogo = new Map() // clave → { grupo, clave, titulo, textos, tipo, noticeId, ref, escenario, fechas:Set, inicios:Set }
const estacionesQueAunSalen = new Set()

function subtipoAuto(texto, tag) {
  const semanal = /^(Los|Las) (domingos|lunes|martes|miércoles|jueves|viernes|sábados)\b/.test(texto) || /por cierre semanal|el (domingo|lunes|martes|miércoles|jueves|viernes|sábado) por cierre/.test(texto)
  if (/Lo ves por fuera, sin perder tiempo/.test(texto)) return { id: 'fuera', semanal }
  if (/«No te dio tiempo»/.test(texto)) return { id: 'todo_el_viaje', semanal }
  if (/horario especial/.test(texto)) return { id: 'horario', semanal: false }
  if (/^El último/.test(texto)) return { id: 'ultimo_domingo', semanal: false }
  if (/Hemos puesto tu visita/.test(texto)) return { id: 'movido', semanal }
  return { id: 'variante', semanal: false }
}

function anotar(clave, base, escenario, fechaIso) {
  let entrada = catalogo.get(clave)
  if (!entrada) {
    entrada = { clave, ...base, escenario, fechas: new Set(), inicios: new Set(), variantes: 0 }
    catalogo.set(clave, entrada)
  }
  if (fechaIso) entrada.fechas.add(fechaIso)
  entrada.inicios.add(`${escenario.inicio}|${escenario.T}`)
  return entrada
}

const t0 = Date.now()
const variantesPorCurado = new Map()
for (const T of LARGOS) {
  for (let i = 0; i < 365; i++) {
    const inicio = sumar(`${AÑO}-01-01`, i)
    for (let n = 1; n <= T - 1; n++) {
      let dayBlock
      try {
        dayBlock = await buildDayBlockV3(D, T, false, n, null, inicio, [], [], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4' })
      } catch {
        continue
      }
      if (!dayBlock) continue
      const escenario = { inicio, T }
      // La tarjeta de arriba (solo la de Navidad: las de las estaciones se quitan).
      const season = dayBlock.season_note
      if (season) {
        if (season.season === 'navidad') anotar(`navidad:${norm(season.text)}`, { grupo: 'navidad', titulo: season.title ?? 'Navidad', textos: [season.text], tipo: 'temporada' }, escenario, inicio)
        else estacionesQueAunSalen.add(season.season)
      }
      if (dayBlock.context_banner) anotar(`banner:${norm(dayBlock.context_banner)}`, { grupo: 'banner', titulo: 'Banner de contexto', textos: [dayBlock.context_banner], tipo: 'banner' }, escenario, inicio)
      for (const notice of dayBlock.date_notices ?? []) {
        const resto = notice.id.split(':').slice(1).join(':')
        if (notice.kind === 'curado') {
          const clave = `curado:${resto}:${norm(notice.texts.join('|'))}`
          const veces = variantesPorCurado.get(resto) ?? new Set()
          if (!catalogo.has(clave)) {
            if (veces.size >= 3) continue
            veces.add(clave)
            variantesPorCurado.set(resto, veces)
          }
          anotar(clave, { grupo: 'curado', curadoId: resto, titulo: notice.title, tag: notice.tag, textos: notice.texts, tipo: 'aviso', noticeId: notice.id, diaNumero: notice.day_number }, escenario, notice.date_iso)
        } else {
          const sub = subtipoAuto(notice.texts.join(' '), notice.tag)
          anotar(`auto:${sub.id}:${sub.semanal ? 'semanal' : 'otro'}:${notice.tag}`, { grupo: 'auto', subtipo: sub.id, semanal: sub.semanal, titulo: notice.title, tag: notice.tag, textos: notice.texts, tipo: 'aviso', noticeId: notice.id, diaNumero: notice.day_number }, escenario, notice.date_iso)
        }
      }
      // Avisos de las paradas y del día.
      if (dayBlock.day_notice) anotar(`dia:${norm(dayBlock.day_notice)}`, { grupo: 'parada', titulo: 'Aviso del día', textos: [dayBlock.day_notice], tipo: 'dia', campo: 'dayNotice', diaNumero: n }, { ...escenario, n }, null)
      for (const s of dayBlock.stops ?? []) {
        const base = { grupo: 'parada', parada: s.name, tipo: 'parada', diaNumero: n }
        if (s.outside_reason) anotar(`parada:fuera:${s.outside_kind}:${norm(s.outside_reason)}`, { ...base, titulo: `En la parada «${s.name}»: por fuera (${s.outside_kind ?? '—'})`, textos: [s.outside_reason], campo: 'outsideReason' }, { ...escenario, n }, null)
        if (s.hours_warning) anotar(`parada:horas:${norm(s.hours_warning)}`, { ...base, titulo: `En la parada «${s.name}»: aviso de horario`, textos: [s.hours_warning], campo: 'hoursWarning' }, { ...escenario, n }, null)
        if (s.season_notice) anotar(`parada:temporada:${norm(s.season_notice)}`, { ...base, titulo: `En la parada «${s.name}»: aviso de temporada`, textos: [s.season_notice], campo: 'seasonNotice' }, { ...escenario, n }, null)
        if (s.closed_this_day) anotar('parada:cerrado_este_dia', { ...base, titulo: `En la parada «${s.name}»: se queda en su día, cerrada`, textos: ['Cerrado este día'], campo: 'closedThisDay' }, { ...escenario, n }, null)
        const aviso = s.closed_notice ?? s.notice
        if (aviso) anotar(`parada:nota:${norm(aviso)}`, { ...base, titulo: `En la ficha de «${s.name}»: nota del horario`, textos: [aviso], campo: 'closedNotice', ficha: true }, { ...escenario, n }, null)
      }
      if (dayBlock.transfer_notice) anotar(`dia:traslado:${norm(dayBlock.transfer_notice)}`, { grupo: 'parada', titulo: 'Aviso de traslado del día', textos: [dayBlock.transfer_notice], tipo: 'dia', campo: 'transferNotice', diaNumero: n }, { ...escenario, n }, null)
    }
  }
}
// Las plantillas de Navidad que ningún viaje de prueba saca (leídas EN VIVO del JSON): se enseñan solo con su texto.
{
  const plantillas = D.destination_config?.nota_temporada ?? {}
  const vistas = new Set([...catalogo.values()].filter((x) => x.grupo === 'navidad').map((x) => x.textos[0]))
  for (const [llave, plantilla] of Object.entries(plantillas)) {
    if (llave.startsWith('_')) continue
    const texto = String(plantilla).replaceAll('{destino}', 'Roma')
    if (vistas.has(texto)) continue
    catalogo.set(`navidad_plantilla:${llave}`, { clave: `navidad_plantilla:${llave}`, grupo: 'navidad', titulo: 'Navidad en Roma', textos: [texto], tipo: 'sin_captura', escenario: { inicio: `${AÑO}-12-10`, T: 3 }, fechas: new Set(), inicios: new Set(), motivo: 'Ningún viaje de prueba (2, 3 y 5 días, empezando cada día de 2027) llega a esta variante: el motor siempre pone alguna noche en el viaje. Se enseña el texto de la plantilla.' })
  }
}
// El mejor viaje para cada aviso: el más corto y, a igualdad, el de fecha más temprana (ya es el primero que lo vio, porque se recorre por largo y por fecha).
console.log(`Motor recorrido en ${((Date.now() - t0) / 1000).toFixed(0)} s: ${catalogo.size} avisos distintos.`)
if (estacionesQueAunSalen.size) console.log(`(Aún salen tarjetas de estación: ${[...estacionesQueAunSalen].join(', ')}; se ignoran.)`)

// ───────────────────────────── 2. «Cuándo» y «dónde» de cada uno ─────────────────────────────
const especiales = new Map((D.fechas_especiales?.fechas ?? []).map((e) => [e.id, e]))

/** Un resumen corto de los días del año en que sale: «todos los domingos» o «24, 25 dic» ... */
function resumenFechas(fechas, { semanalSiempre = false } = {}) {
  const lista = [...fechas].sort()
  if (lista.length === 0) return null
  const porSemana = new Map()
  for (const iso of lista) porSemana.set(sem(iso), (porSemana.get(sem(iso)) ?? 0) + 1)
  const [dominante, cuantos] = [...porSemana.entries()].sort((a, b) => b[1] - a[1])[0]
  if (lista.length >= 20 && cuantos / lista.length >= 0.8) {
    const sueltos = lista.filter((iso) => sem(iso) !== dominante)
    return `todos los ${dominante === 'miércoles' ? 'miércoles' : dominante.endsWith('s') ? dominante : `${dominante}s`}${sueltos.length ? `, y además ${sueltos.map((iso) => diaCorto(iso)).join(', ')}` : ''}`
  }
  void semanalSiempre
  // Rachas de días seguidos.
  const rachas = []
  for (const iso of lista) {
    const ultima = rachas.at(-1)
    if (ultima && sumar(ultima.fin, 1) === iso) ultima.fin = iso
    else rachas.push({ ini: iso, fin: iso })
  }
  const trozos = rachas.map((r) => (r.ini === r.fin ? diaCorto(r.ini) : `${diaCorto(r.ini)} al ${diaCorto(r.fin)}`))
  return trozos.length > 10 ? `${trozos.slice(0, 8).join(', ')} y ${trozos.length - 8} fechas más` : trozos.join(', ')
}

function reglaFecha(entry) {
  const f = String(entry.fecha ?? '')
  const mmdd = (s) => `${Number(s.slice(3, 5))} de ${MESES[Number(s.slice(0, 2)) - 1]}`
  let cuando
  if (/^\d\d-\d\d$/.test(f)) cuando = entry.hasta ? `del ${mmdd(f)} al ${mmdd(entry.hasta)}` : `el ${mmdd(f)}`
  else if (f === 'easter') cuando = 'el Domingo de Pascua (fecha móvil: cada año es una)'
  else if (f === 'easter-2') cuando = 'el Viernes Santo (dos días antes de Pascua, fecha móvil)'
  else if (f === 'easter-3') cuando = 'el Jueves Santo (tres días antes de Pascua, fecha móvil)'
  else if (f === 'easter+1') cuando = 'el Lunes de Pascua (Pasquetta, el día después de Pascua, fecha móvil)'
  else if (f === 'primer_domingo') cuando = 'el primer domingo de cada mes'
  else if (f === 'ultimo_domingo') cuando = `el último domingo de cada mes${entry.excepto ? ` (salvo ${entry.excepto.map((x) => (x === 'easter' ? 'el Domingo de Pascua' : mmdd(x))).join(', ')})` : ''}`
  else cuando = `fecha «${f}»`
  const extra = []
  if (entry.requiere_lugares) extra.push(`solo si ese día la ruta pasa por ${entry.requiere_lugares.join(' o ')}`)
  extra.push('sale en el primer día del viaje que cae en esa fecha (cualquier día del viaje, no solo el primero)')
  return `${cuando[0].toUpperCase()}${cuando.slice(1)}${/^el |^del |^Fecha/.test(cuando) ? '' : ''}. Condición: ${extra.join('; ')}.`
}

const SUBTIPO = {
  fuera: 'Un imprescindible (o joya) cierra ese día y el viaje no tiene otro día al que cambiarlo, o el día no cabe: la ruta lo pasa a verlo por fuera.',
  todo_el_viaje: 'Un imprescindible cierra TODOS los días de ese viaje (fecha de festivo o cierre semanal en viajes cortos): no se puede ver por dentro y se deja en «No te dio tiempo».',
  movido: 'Un imprescindible cierra uno de los días del viaje y el motor lo ha cambiado a otro día donde sí está abierto.',
  horario: 'Un imprescindible abre ese día con un horario especial confirmado en los datos: el motor pone la visita dentro de ese horario.',
  ultimo_domingo: 'El último domingo de mes un imprescindible abre solo por la mañana y con mucha gente: el motor lo cambia de día.',
  variante: 'La variante del día de la semana de un día escrito de Roma trae su propio aviso (audiencia del Papa del miércoles, Panteón del sábado…).',
}

function describir(e) {
  if (e.grupo === 'navidad') {
    const c = D.destination_config?.temporada_navidad ?? {}
    const plantillas = D.destination_config?.nota_temporada ?? {}
    const llave = Object.keys(plantillas).filter((k) => !k.startsWith('_')).find((k) => {
      const patron = new RegExp(`^${String(plantillas[k]).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{[a-z_]+\\\}/g, '.+')}$`)
      return patron.test(e.textos[0])
    })
    e.llave = llave ?? '(plantilla no reconocida)'
    const sinNoche = /_sin_noche$/.test(llave ?? '')
    const base = String(llave ?? '').replace(/_sin_noche$/, '')
    const hasta = c.hasta ? dia(`2000-${c.hasta}`) : '6 de enero'
    const cond = {
      navidad_mercadillo: `el mercadillo de Navona está abierto en alguno de los días del viaje (del ${c.mercadillo ? dia(`2000-${c.mercadillo.desde}`) : '1 de diciembre'} al ${c.mercadillo ? dia(`2000-${c.mercadillo.hasta}`) : '5 de enero'}) y la ruta pasa ese día por Piazza Navona (o su paseo nocturno)`,
      navidad: `hay árboles (desde el ${c.arboles_desde ? dia(`2000-${c.arboles_desde}`) : '8 de diciembre'}) pero la ruta no pasa por el mercadillo de Navona`,
      navidad_luces: `es antes de que se enciendan los árboles (${c.arboles_desde ? `antes del ${dia(`2000-${c.arboles_desde}`)}` : 'antes de diciembre'}): solo hay luces`,
    }[base]
    e.cuando = `El primer día de ciudad del viaje cae entre el ${c.desde ? dia(`2000-${c.desde}`) : '26 de noviembre'} y el ${hasta} (la «temporada de Navidad» del destino) y ${cond ?? 'se cumple la condición de la plantilla'}${sinNoche ? '; y ninguna noche del viaje lleva paseo o experiencia nocturna (variante «sin noche»)' : '; y alguna noche lleva paseo o experiencia nocturna'}. Clave de la plantilla: «${e.llave}».`
    e.donde = 'Arriba de la ruta (pestaña RUTA), como tarjeta que se cierra; sale una vez por viaje, antes de la ventana de avisos.'
    const veces = [...e.fechas]
    e.observado = e.fechas.size ? `En 2027 sale si el viaje empieza: ${resumenFechas(e.fechas)}.` : null
    void veces
  } else if (e.grupo === 'curado') {
    const entry = especiales.get(e.curadoId)
    e.cuando = entry ? reglaFecha(entry) : `Fecha especial «${e.curadoId}».`
    if (entry?.verificar) e.cuando += ' (Texto marcado «verificar»: cuenta con prudencia, «es posible que…».)'
    e.donde = `Ventana «Hemos preparado tu viaje para estas fechas» al abrir la ruta por primera vez (una tarjeta por aviso, las del día 1 de DÍAS no; ver captura) y, siempre, la etiqueta «${e.tag}» en la cabecera del día${e.diaNumero ? ` (en el viaje de la captura, el día ${e.diaNumero})` : ''} en DÍAS: al tocarla vuelve a salir esta tarjeta.`
  } else if (e.grupo === 'auto') {
    e.cuando = `${SUBTIPO[e.subtipo]} ${e.semanal ? 'Aquí es un cierre de cada semana (no un festivo).' : ''}`.trim()
    e.donde = `Ventana «Hemos preparado tu viaje para estas fechas» al abrir la ruta (tarjeta «${e.title ?? e.titulo}») y etiqueta «${e.tag}» en la cabecera del día${e.diaNumero ? ` (día ${e.diaNumero} del viaje de la captura)` : ''} en DÍAS.`
  } else if (e.grupo === 'banner') {
    e.cuando = /invierno/i.test(e.textos[0]) ? 'Viajes de invierno (meses de invierno del destino) con 1 o 2 días, o más largos; el texto cambia con los días y si algún día hay que madrugar. Sin fechas, según el mes elegido.' : 'Viajes cortos (1 o 2 días) fuera del invierno.'
    e.donde = 'En la campana de Avisos (arriba a la derecha), como aviso del viaje; ya no sale como banner en la ruta.'
  } else if (e.grupo === 'parada') {
    if (e.tipo === 'no_incluido') {
      e.cuando = 'Un imprescindible cierra todos los días del viaje y el motor lo deja fuera; el aviso va con la sugerencia de cambiar las fechas.'
      e.donde = `En DÍAS, día ${e.diaNumero}: lista «No te dio tiempo» al final del día.`
    } else if (e.tipo === 'dia') {
      e.cuando = 'El día empieza antes de la hora habitual para no perder un imprescindible.'
      e.donde = `En DÍAS, día ${e.diaNumero}, bajo el plan del día.`
    } else {
      e.cuando = { outsideReason: 'La parada se enseña por fuera (cerrada ese día, ya cerrada a esa hora, aún sin abrir, o no cabe en el día).', hoursWarning: 'Sin fechas, la parada tiene días de cierre; o aviso de horario de la parada.', seasonNotice: 'La parada no está abierta en esa temporada.', closedThisDay: 'La parada cierra ese día y no hay otro día del viaje al que cambiarla: se queda en su día, sin tiempo asignado.', closedNotice: 'Nota del horario de la parada (cierres, última entrada, cuotas…).' }[e.campo] ?? 'Aviso de la parada.'
      e.donde = e.ficha ? `En la ficha de la parada (se abre al tocarla en DÍAS, día ${e.diaNumero}), en su apartado de horarios.` : `En DÍAS, día ${e.diaNumero}, en la tarjeta de la parada «${e.parada ?? ''}» (línea roja bajo su nombre).`
    }
  }
  if (e.grupo !== 'navidad') {
    const obs = resumenFechas(e.fechas)
    e.observado = obs ? `Fechas de 2027 en que sale: ${obs}.` : null
  }
}
for (const e of catalogo.values()) describir(e)

// ───────────────────────────── 3. Capturas en la app ─────────────────────────────
const idArchivo = (e) => e.clave.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60)
const png = (id, sufijo = '') => path.join(SALIDA, `avisos_${id}${sufijo}.jpg`)
const ORDEN = { navidad: 0, curado: 1, auto: 2, banner: 3, parada: 4 }
let lista = [...catalogo.values()].sort((a, b) => (ORDEN[a.grupo] - ORDEN[b.grupo]) || a.clave.localeCompare(b.clave))
lista.forEach((e, i) => {
  e.id = `${String(i + 1).padStart(2, '0')}_${idArchivo(e)}`
})
if (SOLO) lista = lista.filter((e) => `${e.id} ${e.titulo} ${e.tag ?? ''}`.toLowerCase().includes(SOLO.toLowerCase()))

// (Vite sirve los módulos editados con ?t=…: pueden existir dos copias del almacén; se usa la que tiene el viaje de la app.)
const STORE = "(window.__almacen ? window.__almacen() : import('/src/store/useRouteStore.ts'))"
const INSTALAR = `(() => {
  window.__almacen = async () => {
    const urls = performance.getEntriesByType('resource').map((r) => r.name).filter((u) => u.includes('/src/store/useRouteStore.ts'))
    for (const u of [...new Set(urls)].reverse()) { const m = await import(u); if (m.useRouteStore.getState().route) return m }
    return import('/src/store/useRouteStore.ts')
  }
  window.__mod = (nombre) => { const urls = performance.getEntriesByType('resource').map((r) => r.name).filter((u) => u.includes(nombre)); return import(urls.length ? urls[urls.length - 1] : nombre) }
  return true
})()`
async function abrir() {
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&apertura=0' })
  for (let i = 0; i < 120 && !(await a.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
  for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await a.esp(500)
  await a.evaluar(INSTALAR)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 90 && !(await a.evaluar(`${STORE}.then((m) => Boolean(m.useRouteStore.getState().route))`)); i++) await a.esp(1000)
  await a.esp(2000)
  await a.evaluar(`${STORE}.then((m) => { window.__baseRuta = structuredClone(m.useRouteStore.getState().route); return true })`)
  return a
}
/** Genera el viaje de prueba con el motor real (la misma petición del formulario) y lo pone en el almacén, sin avisos vistos. */
async function cargarViaje(a, { inicio, T }) {
  const fin = sumar(inicio, T - 1)
  await a.evaluar(`(async () => {
    const { useRouteStore } = await ${STORE}
    const { runGeneration } = await window.__mod('/src/lib/routeGenerationOrchestrator.ts')
    const { mapGeneratedRouteToRoute } = await window.__mod('/src/lib/mapGeneratedRoute.ts')
    const base = window.__baseRuta
    const respuestas = { ...base.answers, origin: 'Madrid', days: ${T}, dateRange: { start: '${inicio}', end: '${fin}' }, month: ${Number(inicio.slice(5, 7)) - 1}, companion: 'couple', experiences: [], experiencesPositive: ['imprescindibles'], experiencesNegative: [], chronotype: 'normal', budgetLevel: 'comfortable' }
    let final = null
    await runGeneration({ destination: 'Roma', answers: respuestas, transportContext: base.transportContext, mustIncludePlaces: [] }, null, async (cp) => { if (cp.phase === 'done') final = cp })
    if (!final) throw new Error('El motor no ha devuelto el viaje')
    const ruta = mapGeneratedRouteToRoute(final.generated, 'Roma', respuestas, base.transportContext)
    ruta.id = base.id; ruta.createdAt = base.createdAt
    for (const d of ruta.days) if (!d.countryCode) d.countryCode = 'it'
    useRouteStore.setState({ route: ruta, dev_simulated_today_iso: null, mode: 'route', activeDayId: null, openDateNoticeId: null })
    window.__rutaCargada = ruta
    return true
  })()`)
  await a.esp(1200)
}
const ev = (a, js) => a.evaluar(js)
/** Cierra lo que haya abierto (hoja de la ficha, ventana de avisos). */
async function limpiar(a) {
  await ev(a, `${STORE}.then((m) => { m.useRouteStore.setState({ openDateNoticeId: null }); return true })`)
  await ev(a, "(() => { for (let i = 0; i < 3; i++) { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Cerrar|Entendido)$/.test((x.getAttribute('aria-label') || x.textContent || '').trim())); if (b) b.click() } return true })()")
  await a.esp(500)
}
/** Quita la tarjeta de temporada y marca la ventana de fechas como vista (para que no tape lo que se va a fotografiar). */
const silenciar = (a, { temporada = true, ventana = true } = {}) =>
  ev(a, `(async () => {
    const { useRouteStore } = await ${STORE}
    const { dateNoticesKey } = await window.__mod('/src/lib/dateNotices.ts')
    const s = useRouteStore.getState()
    if (${temporada}) s.dismissSeasonNote()
    if (${ventana}) s.markDateNoticesSeen(dateNoticesKey(useRouteStore.getState().route.dateNotices ?? []))
    return true
  })()`)
const modo = (a, m, diaIdx = null) =>
  ev(a, `${STORE}.then((m) => { const s = m.useRouteStore.getState(); s.setActiveDayId(${diaIdx === null ? 'null' : `s.route.days[${diaIdx}].id`}); s.setMode('${m}'); return true })`)
/** Lleva a la vista el elemento de la pantalla que contiene este texto. Devuelve si lo ha encontrado (visible). */
async function verTexto(a, texto, { elemento = null } = {}) {
  const trozo = JSON.stringify(String(texto).slice(0, 45))
  const sel = JSON.stringify(elemento)
  const hallado = await ev(a, `(() => {
    const t = ${trozo}
    const raiz = ${sel} ? document.querySelector(${sel}) : document.body
    if (!raiz) return false
    const todos = Array.from(raiz.querySelectorAll('*')).filter((x) => x.children.length === 0 || /^(P|SPAN|LI|H1|H2|H3|BUTTON)$/.test(x.tagName))
    const candidatos = todos.filter((x) => (x.textContent || '').includes(t)).sort((p, q) => p.textContent.length - q.textContent.length)
    const el = candidatos[0]
    if (!el) return false
    el.scrollIntoView({ block: 'center' })
    return true
  })()`)
  await a.esp(700)
  return hallado
}
async function cargarImagenes(a) {
  await a.esp(1500)
}

const resultados = []
async function hacer(a, e) {
  const fotos = []
  const sacar = async (sufijo, etiqueta) => {
    const archivo = png(e.id, sufijo)
    await a.captura(archivo)
    fotos.push({ archivo, etiqueta })
  }
  const nota = []
  if (e.tipo === 'sin_captura') return { fotos, nota: [e.motivo] }
  await cargarViaje(a, e.escenario)
  const primera = e.textos[0]
  if (e.tipo === 'temporada') {
    await modo(a, 'route')
    await a.esp(1800)
    if (await verTexto(a, primera)) await sacar('', 'Arriba de la ruta (RUTA)')
    else nota.push('La tarjeta no apareció en pantalla.')
  } else if (e.tipo === 'banner') {
    await silenciar(a)
    await modo(a, 'route')
    await a.esp(1200)
    await ev(a, "(() => { const b = document.querySelector('button[aria-label^=\"Avisos\"]'); if (b) b.click(); return true })()")
    await a.esp(1500)
    if (await verTexto(a, primera)) await sacar('', 'En la campana de Avisos (arriba a la derecha)')
    else nota.push('El banner no apareció en la campana de Avisos.')
    await limpiar(a)
  } else if (e.tipo === 'aviso') {
    await silenciar(a, { temporada: true, ventana: true })
    await modo(a, 'route')
    await ev(a, `${STORE}.then((m) => { m.useRouteStore.getState().setOpenDateNoticeId(${JSON.stringify(e.noticeId)}); return true })`)
    await a.esp(1500)
    if (await verTexto(a, primera, { elemento: '[role="dialog"]' })) await sacar('_tarjeta', 'La tarjeta (ventana de avisos / al tocar la etiqueta)')
    else nota.push('La tarjeta no apareció (¿el aviso no sale en este viaje?).')
    await limpiar(a)
    // El día en DÍAS, con su etiqueta.
    const idx = await ev(a, `window.__rutaCargada.days.findIndex((d) => d.dayNumber === ${e.diaNumero ?? 1})`)
    await modo(a, 'days', idx < 0 ? 0 : idx)
    await a.esp(2200)
    await ev(a, `(() => { const c = document.querySelector('[data-day-id="' + (window.__rutaCargada.days[${idx < 0 ? 0 : idx}].id) + '"]'); if (c) c.scrollIntoView({ block: 'start' }); return true })()`)
    await a.esp(800)
    await sacar('_dias', `En DÍAS, día ${e.diaNumero ?? 1}: la etiqueta «${e.tag}» bajo el título del día`)
  } else if (e.tipo === 'parada' || e.tipo === 'dia') {
    await silenciar(a)
    const idx = await ev(a, `window.__rutaCargada.days.findIndex((d) => d.dayNumber === ${e.diaNumero ?? 1})`)
    await modo(a, 'days', idx < 0 ? 0 : idx)
    await a.esp(2500)
    let visto = false
    const campo = e.campo ?? 'closedNotice'
    if (!e.ficha) visto = await verTexto(a, primera)
    if (!visto && e.tipo === 'parada') {
      // Si no sale en la tarjeta, se busca en la ficha de la parada (se abre al tocarla).
      const id = await ev(a, `(() => { const dia = window.__rutaCargada.days[${idx < 0 ? 0 : idx}]; const p = dia.stops.find((s) => s[${JSON.stringify(campo)}] === ${JSON.stringify(primera)}) ?? dia.stops.find((s) => s.name === ${JSON.stringify(e.parada ?? '')}); return p ? p.id : null })()`)
      if (id) {
        await ev(a, `(() => { const p = document.querySelector('[data-stop-id="${id}"]'); if (!p) return false; (p.querySelector('button') || p).click(); return true })()`)
        await a.esp(3000)
        visto = await verTexto(a, primera)
        if (visto) e.enFicha = true
      }
    }
    if (visto) await sacar('', e.ficha || e.enFicha ? 'En la ficha de la parada (se abre al tocarla en DÍAS)' : 'En DÍAS')
    else nota.push('El texto no apareció en pantalla (¿va solo en otra vista o se muestra con otras palabras?); se enseña el texto del motor.')
    await limpiar(a)
  }
  return { fotos, nota }
}

if (!SIN_CAPTURAS) {
  // (Una pasada completa borra las capturas viejas: los números cambian cuando cambian los avisos.)
  if (!SOLO) for (const x of fs.readdirSync(SALIDA)) if (/^avisos_.*.jpg$/.test(x)) fs.rmSync(path.join(SALIDA, x))
  const app = await abrir()
  for (const e of lista) {
    let r
    try {
      r = await hacer(app, e)
    } catch (err) {
      r = { fotos: [], nota: [`Error al capturar: ${String(err.message ?? err).slice(0, 160)}`] }
    }
    resultados.push({ e, ...r })
    console.log(`${r.fotos.length ? 'OK ' : '-- '} ${e.id}  ${e.titulo}  (${e.escenario.inicio}, ${e.escenario.T} días)${r.nota.length ? '  · ' + r.nota[0] : ''}`)
  }
  app.cerrar()
} else {
  for (const e of lista) {
    const fotos = ['', '_tarjeta', '_dias'].map((s) => ({ archivo: png(e.id, s), etiqueta: s === '_dias' ? 'En DÍAS' : 'Captura' })).filter((f) => fs.existsSync(f.archivo))
    resultados.push({ e, fotos, nota: [] })
  }
}

// ───────────────────────────── 4. La página ─────────────────────────────
const img = (archivo) => `data:image/jpeg;base64,${fs.readFileSync(archivo).toString('base64')}`
const GRUPOS = [
  ['navidad', 'La tarjeta de Navidad (arriba de la ruta)', 'Una por variante. Las tarjetas de las estaciones ya no existen.'],
  ['curado', 'Fechas especiales (fechas_especiales)', 'Las fechas curadas de Roma: salen en la ventana de avisos al abrir la ruta y como etiqueta en el día de DÍAS.'],
  ['auto', 'Cierres y cambios que ha hecho el motor', 'Avisos automáticos: un cierre semanal o un festivo ha movido una visita, la pasa a verla por fuera, la deja fuera del viaje o la pone en un horario especial.'],
  ['banner', 'Banner de contexto', 'Una frase al principio de la ruta que explica por qué es como es (viaje corto, invierno).'],
  ['parada', 'Avisos de las paradas y del día (DÍAS)', 'Lo rojo o gris que sale en la tarjeta o la ficha de una parada, y los avisos de «No te dio tiempo».'],
]
const tarjetas = (grupo) =>
  resultados
    .filter((r) => r.e.grupo === grupo)
    .map((r) => {
      const { e, fotos, nota } = r
      const imagenes = fotos.map((f) => `<figure><img src="${img(f.archivo)}" alt="${esc(f.etiqueta)}" loading="lazy"><figcaption>${esc(f.etiqueta)}</figcaption></figure>`).join('')
      return `<article id="${esc(e.id)}"><h3>${esc(e.titulo)}${e.tag && e.grupo !== 'parada' ? ` <small>· etiqueta «${esc(e.tag)}»</small>` : ''}</h3>
<div class="fotos">${imagenes || '<p class="sin">Sin captura.</p>'}</div>
${nota.length ? `<p class="aviso">${esc(nota.join(' '))}</p>` : ''}
<blockquote>${e.textos.map((t) => `<p>${esc(t)}</p>`).join('')}</blockquote>
<dl><dt>Cuándo sale</dt><dd>${esc(e.cuando)}${e.observado ? `<br><span class="obs">${esc(e.observado)}</span>` : ''}</dd>
<dt>Dónde</dt><dd>${esc(e.donde)}</dd>
<dt>Viaje de la captura</dt><dd>Roma, ${e.escenario.T} días desde el ${sem(e.escenario.inicio)} ${dia(e.escenario.inicio)} de ${e.escenario.inicio.slice(0, 4)} (viaje de prueba, solo para la captura).</dd></dl></article>`
    })
    .join('\n')
const indice = GRUPOS.map(([g, titulo]) => `<li><a href="#g_${g}">${esc(titulo)}</a> (${resultados.filter((r) => r.e.grupo === g).length})</li>`).join('')
const secciones = GRUPOS.map(([g, titulo, intro]) => `<section id="g_${g}"><h2>${esc(titulo)}</h2><p class="intro">${esc(intro)}</p>${tarjetas(g) || '<p class="sin">Ninguno en este momento.</p>'}</section>`).join('\n')
const hoy = new Date().toISOString().slice(0, 10)
fs.writeFileSync(
  path.resolve('docs/dias/AVISOS_REVISION.html'),
  `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Todos los avisos de la ruta</title>
<style>
:root{--marfil:#FBF3E2;--tinta:#1C2230;--oro:#A67C52;--profundo:#6F4E37;--rojo:#B3412E}
*{box-sizing:border-box}body{margin:0;background:var(--marfil);color:var(--tinta);font:15px/1.5 system-ui,sans-serif}
header,section,nav{max-width:460px;margin:0 auto;padding:0 16px}header{padding-top:22px}
h1{font:400 30px/1.1 'Instrument Serif',Georgia,serif;margin:0 0 6px}h2{font:400 24px/1.15 'Instrument Serif',Georgia,serif;margin:34px 0 4px;border-top:1px solid rgba(166,124,82,.35);padding-top:18px}
h3{font-size:15px;margin:0 0 10px;line-height:1.3}h3 small{font-weight:400;color:rgba(28,34,48,.6)}
.intro,header p{color:rgba(28,34,48,.7);margin:0 0 14px}nav ul{padding-left:18px;margin:8px 0}
article{background:#fff;border:1px solid rgba(166,124,82,.25);border-radius:18px;padding:14px;margin:16px 0}
.fotos{display:flex;flex-direction:column;gap:10px}figure{margin:0}figure img{display:block;width:100%;height:auto;border-radius:12px;border:1px solid rgba(28,34,48,.1)}
figcaption{font:600 10.5px/1.2 ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--profundo);margin-top:5px}
blockquote{margin:12px 0;padding:8px 12px;border-left:3px solid var(--oro);background:rgba(166,124,82,.08);border-radius:0 8px 8px 0}blockquote p{margin:0 0 6px}blockquote p:last-child{margin:0}
dl{margin:8px 0 0;font-size:13.5px}dt{font:600 10.5px/1.2 ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--profundo);margin-top:8px}dd{margin:2px 0 0}
.obs{color:rgba(28,34,48,.62)}.aviso{color:var(--rojo);font-size:13px;margin:8px 0 0}.sin{color:rgba(28,34,48,.55)}
</style></head><body>
<header><h1>Todos los avisos de la ruta</h1><p>Una captura de cada aviso que puede salir al crear un viaje de Roma, tal como sale en la app, con su texto, cuándo sale y dónde. Generada el ${hoy} leyendo el motor en vivo (${resultados.length} avisos); para volver a generarla: <code>node scripts/destino/avisosRevision.mjs</code>. Los viajes son de prueba, solo para la captura.</p></header>
<nav><ul>${indice}</ul></nav>
${secciones}
</body></html>`,
)
console.log(`AVISOS_REVISION.html: ${resultados.length} avisos, ${resultados.filter((r) => r.fotos.length).length} con captura.`)
const sin = resultados.filter((r) => !r.fotos.length)
if (sin.length && !SIN_CAPTURAS) console.log('Sin captura:\n' + sin.map((r) => `  ${r.e.id}: ${r.nota.join(' ')}`).join('\n'))
