// La página para revisar TODOS LOS AVISOS que pueden salir en la ruta al crear un viaje (Tanda 10L, parte 3; rehecha en la 10M para el comportamiento nuevo): una captura de cada uno
// tal como sale en la app, su texto, cuándo sale (fechas y condición) y dónde (arriba de la ruta, en la ventana al abrirla, en la campana o en DÍAS).
//
// Los textos NO están copiados: el script recorre el motor de Roma (server/engine, solo lectura) con viajes de 2, 3 y 5 días que empiezan cada día de 2027, recoge cada aviso distinto que sale,
// elige para cada uno el viaje más corto y, con ese viaje de prueba (solo para la captura), abre la app real (Chrome sin ventana, 390 px) y fotografía la pantalla. Cuando cambies un texto
// del motor, vuelve a lanzarlo y sale el nuevo. Qué enseña (Tanda 10M):
//   · las tarjetas especiales (Navidad, Semana Santa, el cumpleaños de Roma): una sola por viaje, un solo texto;
//   · UN ejemplo por fecha (fechas_especiales y festivos), los cierres de cada semana (domingo+Vaticanos, lunes+Borghese…), la excepción («se quedan en su día y decides tú») y «te lo enseñamos por fuera»;
//   · la ventana con varios avisos (3 avisos y 5 avisos: flechas, «1 de 3», la tercera «y N más»);
//   · la campana con avisos nuevos y leídos, y la tarjeta que abre; DÍAS sin pastillas ni «Hoy el sol se pone»;
//   · los avisos de las paradas y del día (tarjeta y ficha).
// El script FALLA (sin escribir la página) si algún texto mostrado contiene «anochece», «{» o «hora_atardecer».
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
const GENERICA = /Hemos preparado tu ruta para que disfrutes/
const EXCEPCION = /En tu viaje no hay otro día/
const FUERA = /te lo enseñamos por fuera/

// ───────────────────────────── 1. Recorrer el motor y recoger cada aviso distinto ─────────────────────────────
const AÑO = 2027
const LARGOS = [2, 3, 5]
const catalogo = new Map() // clave → entrada
const fechasPorClave = new Map() // clave de grupo → Set de fechas (de TODOS los avisos del grupo, para «cuándo»)
const viajesConAvisos = new Map() // cantidad de avisos → { inicio, T, notices }
const estacionesQueAunSalen = new Set()
const topes = { excepcion: 0, fuera: 0, banner: 0 }

function anotar(clave, base, escenario) {
  if (catalogo.has(clave)) return null
  const entrada = { clave, ...base, escenario, fechas: new Set() }
  catalogo.set(clave, entrada)
  return entrada
}
const recordarFecha = (grupo, iso) => {
  if (!iso) return
  if (!fechasPorClave.has(grupo)) fechasPorClave.set(grupo, new Set())
  fechasPorClave.get(grupo).add(iso)
}
/** El id de una fecha sin el día delante: «2027-12-25:navidad» → «navidad». */
const sufijoId = (id) => id.split(':').slice(1).join(':')
/** Los avisos de varios sitios («Castillo, Galería Borghese y 3 lugares más cerrados») no son un ejemplo de nada: se enseñan los de un solo sitio. */
const unSoloSitio = (tag) => !/,| y /.test(tag)

const t0 = Date.now()
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
      // La tarjeta especial de arriba: solo tres (navidad, semana_santa, cumpleanos_ciudad).
      const season = dayBlock.season_note
      if (season) {
        if (['navidad', 'semana_santa', 'cumpleanos_ciudad'].includes(season.season)) {
          recordarFecha(`tarjeta:${season.season}`, inicio)
          anotar(`tarjeta:${season.season}`, { grupo: 'tarjeta', tipo: 'tarjeta', ref: season.season, titulo: season.title ?? season.season, textos: [season.text], icono: season.icon }, escenario)
        } else estacionesQueAunSalen.add(season.season)
      }
      if (dayBlock.context_banner && topes.banner < 2) {
        if (anotar(`banner:${norm(dayBlock.context_banner)}`, { grupo: 'banner', titulo: 'Aviso «Sobre tu ruta»', textos: [dayBlock.context_banner], tipo: 'banner' }, escenario)) topes.banner++
      }
      const notices = dayBlock.date_notices ?? []
      if (notices.length && !viajesConAvisos.has(notices.length)) viajesConAvisos.set(notices.length, { inicio, T, notices })
      for (const notice of notices) {
        const suf = sufijoId(notice.id)
        const hecho = notice.hecho ?? ''
        const base = { tipo: 'aviso', noticeId: notice.id, titulo: notice.title, tag: notice.tag, textos: notice.texts, campana: notice.campana, diaNumero: notice.day_number, dateIso: notice.date_iso, kind: notice.kind, sufijo: suf, cierran: notice.cierran ?? [] }
        // (un cierre de cada semana dice «Los domingos cierran…» / «Los lunes cierra…»; los festivos del calendario, no)
        const semanal = notice.kind !== 'curado' && unSoloSitio(notice.tag) && /^(Los|Las) (domingos|lunes|martes|miércoles|jueves|viernes|sábados)\b/.test(notice.texts[0] ?? '')
        const unico = notice.kind === 'curado' ? `fecha:${suf}` : semanal ? `semanal:${notice.tag}` : `fecha:festivo:${notice.tag}`
        base.claveFechas = unico
        if (EXCEPCION.test(hecho)) {
          recordarFecha(`excepcion:${suf}`, notice.date_iso)
          if (topes.excepcion < 3 && anotar(`excepcion:${suf}`, { ...base, grupo: 'excepcion' }, escenario)) topes.excepcion++
        } else if (FUERA.test(hecho)) {
          recordarFecha(`fuera:${suf}`, notice.date_iso)
          if (topes.fuera < 3 && anotar(`fuera:${suf}`, { ...base, grupo: 'fuera' }, escenario)) topes.fuera++
        } else if (notice.kind === 'curado') {
          recordarFecha(unico, notice.date_iso)
          anotar(unico, { ...base, grupo: 'fecha', curadoId: suf }, escenario)
        } else if (unSoloSitio(notice.tag)) {
          recordarFecha(unico, notice.date_iso)
          anotar(unico, { ...base, grupo: semanal ? 'semanal' : 'fecha', curadoId: suf }, escenario)
        } else {
          // (un aviso de varios sitios; su texto es del mismo tipo que los otros: no se enseña aparte)
        }
      }
      // Avisos de las paradas y del día.
      if (dayBlock.day_notice) anotar(`dia:${norm(dayBlock.day_notice)}`, { grupo: 'parada', titulo: 'Aviso del día', textos: [dayBlock.day_notice], tipo: 'dia', campo: 'dayNotice', diaNumero: n }, { ...escenario, n })
      if (dayBlock.transfer_notice) anotar(`dia:traslado:${norm(dayBlock.transfer_notice)}`, { grupo: 'parada', titulo: 'Aviso de traslado del día', textos: [dayBlock.transfer_notice], tipo: 'dia', campo: 'transferNotice', diaNumero: n }, { ...escenario, n })
      for (const s of dayBlock.stops ?? []) {
        const base = { grupo: 'parada', parada: s.name, tipo: 'parada', diaNumero: n }
        if (s.outside_reason) anotar(`parada:fuera:${s.outside_kind}:${norm(s.outside_reason)}`, { ...base, titulo: `En la parada «${s.name}»: por fuera (${s.outside_kind ?? '—'})`, textos: [s.outside_reason], campo: 'outsideReason' }, { ...escenario, n })
        if (s.hours_warning) anotar(`parada:horas:${norm(s.hours_warning)}`, { ...base, titulo: `En la parada «${s.name}»: aviso de horario`, textos: [s.hours_warning], campo: 'hoursWarning' }, { ...escenario, n })
        if (s.season_notice) anotar(`parada:temporada:${norm(s.season_notice)}`, { ...base, titulo: `En la parada «${s.name}»: aviso de temporada`, textos: [s.season_notice], campo: 'seasonNotice' }, { ...escenario, n })
        if (s.closed_this_day) anotar('parada:cerrado_este_dia', { ...base, titulo: `En la parada «${s.name}»: se queda en su día, cerrada`, textos: ['Cerrado este día'], campo: 'closedThisDay' }, { ...escenario, n })
        const aviso = s.closed_notice ?? s.notice
        if (aviso) anotar(`parada:nota:${norm(aviso)}`, { ...base, titulo: `En la ficha de «${s.name}»: nota del horario`, textos: [aviso], campo: 'closedNotice', ficha: true }, { ...escenario, n })
      }
    }
  }
}
console.log(`Motor recorrido en ${((Date.now() - t0) / 1000).toFixed(0)} s: ${catalogo.size} avisos distintos.`)
if (estacionesQueAunSalen.size) console.log(`(Aún salen tarjetas que no son de las tres especiales: ${[...estacionesQueAunSalen].join(', ')}; se ignoran.)`)

// La ventana con varios avisos, la campana y DÍAS: viajes con 3 y con 5 avisos (si el motor no saca uno exacto, el más cercano por arriba).
const viajeCon = (cuantos) => viajesConAvisos.get(cuantos) ?? [...viajesConAvisos.entries()].filter(([k]) => k > cuantos).sort((a, b) => a[0] - b[0])[0]?.[1] ?? null
const resumenAvisos = (notices) => notices.map((x) => `${x.title}: ${x.texts.join(' ')}`)
{
  const v3 = viajeCon(3)
  const v5 = viajeCon(5)
  const nuevo = (clave, grupo, tipo, titulo, v, extra = {}) => {
    if (!v) return
    catalogo.set(clave, { clave, grupo, tipo, titulo, textos: resumenAvisos(v.notices), campanas: v.notices.map((x) => x.campana).filter(Boolean), escenario: { inicio: v.inicio, T: v.T }, fechas: new Set(), avisos: v.notices.length, ...extra })
  }
  nuevo('ventana:3', 'ventana', 'ventana', `La ventana con ${viajeCon(3)?.notices.length} avisos`, v3)
  nuevo('ventana:5', 'ventana', 'ventana', `La ventana con ${viajeCon(5)?.notices.length} avisos`, v5)
  nuevo('campana:nuevos', 'campana', 'campana', 'La campana con avisos nuevos', v3, { estado: 'nuevos' })
  nuevo('campana:mezcla', 'campana', 'campana', 'La campana con avisos nuevos y leídos', v3, { estado: 'mezcla' })
  nuevo('campana:leidos', 'campana', 'campana', 'La campana con todo leído, y la tarjeta que abre al tocar uno', v3, { estado: 'leidos' })
  nuevo('dias:limpio', 'dias', 'dias', 'DÍAS: un día con aviso, sin pastillas y sin «Hoy el sol se pone»', v3)
}

// ───────────────────────────── 2. «Cuándo» y «dónde» de cada uno ─────────────────────────────
const especiales = new Map((D.fechas_especiales?.fechas ?? []).map((e) => [e.id, e]))

/** Un resumen corto de los días del año en que sale: «todos los domingos» o «24, 25 dic» ... */
function resumenFechas(fechas) {
  const lista = [...fechas].sort()
  if (lista.length === 0) return null
  const porSemana = new Map()
  for (const iso of lista) porSemana.set(sem(iso), (porSemana.get(sem(iso)) ?? 0) + 1)
  const [dominante, cuantos] = [...porSemana.entries()].sort((a, b) => b[1] - a[1])[0]
  if (lista.length >= 20 && cuantos / lista.length >= 0.8) {
    const sueltos = lista.filter((iso) => sem(iso) !== dominante)
    return `todos los ${dominante.endsWith('s') ? dominante : `${dominante}s`}${sueltos.length ? `, y además ${sueltos.slice(0, 8).map((iso) => diaCorto(iso)).join(', ')}${sueltos.length > 8 ? ` y ${sueltos.length - 8} más` : ''}` : ''}`
  }
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
  if (/^\d\d-\d\d$/.test(f)) cuando = entry.hasta ? `Del ${mmdd(f)} al ${mmdd(entry.hasta)}` : `El ${mmdd(f)}`
  else if (f === 'easter') cuando = 'El Domingo de Pascua (fecha móvil: cada año es una)'
  else if (f === 'easter-2') cuando = 'El Viernes Santo (dos días antes de Pascua, fecha móvil)'
  else if (f === 'easter-3') cuando = 'El Jueves Santo (tres días antes de Pascua, fecha móvil)'
  else if (f === 'easter+1') cuando = 'El Lunes de Pascua (Pasquetta, el día después de Pascua, fecha móvil)'
  else if (f === 'primer_domingo') cuando = 'El primer domingo de cada mes'
  else if (f === 'ultimo_domingo') cuando = `El último domingo de cada mes${entry.excepto ? ` (salvo ${entry.excepto.map((x) => (x === 'easter' ? 'el Domingo de Pascua' : mmdd(x))).join(', ')})` : ''}`
  else cuando = `Fecha «${f}»`
  const extra = []
  if (entry.requiere_lugares) extra.push(`solo si ese día la ruta pasa por ${entry.requiere_lugares.join(' o ')}`)
  else extra.push('sale si la fecha cae dentro del viaje, aunque nada de la ruta cierre ese día')
  return `${cuando}. Condición: ${extra.join('; ')}.`
}

function describir(e) {
  const obs = (clave) => {
    const r = resumenFechas(fechasPorClave.get(clave ?? e.clave) ?? [])
    return r ? `Fechas de 2027 en que sale (el día del aviso): ${r}.` : null
  }
  if (e.grupo === 'tarjeta') {
    const config = D.destination_config ?? {}
    const nombres = { navidad: 'Navidad', semana_santa: 'Semana Santa y Pascua', cumpleanos_ciudad: 'El cumpleaños de la ciudad' }
    const c = config.temporada_navidad ?? {}
    e.cuando = {
      navidad: `Algún día del viaje cae del ${c.desde ? dia(`2000-${c.desde}`) : '26 de noviembre'} al ${c.hasta ? dia(`2000-${c.hasta}`) : '6 de enero'} (la «temporada de Navidad» del destino).`,
      semana_santa: 'Algún día del viaje cae entre el Domingo de Ramos y el Lunes de Pascua (fechas móviles, calculadas cada año).',
      cumpleanos_ciudad: `El viaje incluye el ${config.nota_temporada?.cumpleanos_ciudad?.fecha ? dia(`2000-${config.nota_temporada.cumpleanos_ciudad.fecha}`) : '21 de abril'}.`,
    }[e.ref]
    e.cuando += ` Una sola tarjeta por viaje y un solo texto (si el viaje cae en dos, solo la de Semana Santa). Tarjeta: «${nombres[e.ref] ?? e.ref}».`
    e.donde = 'Arriba de la ruta (pestaña RUTA), la primera vez que se abre: tarjeta centrada con su dibujo; al cerrarla salen los avisos de fechas.'
    e.observado = fechasPorClave.get(e.clave)?.size ? `En 2027 sale si el viaje (de 2, 3 o 5 días) empieza: ${resumenFechas(fechasPorClave.get(e.clave))}.` : null
  } else if (e.grupo === 'fecha') {
    const entry = especiales.get(e.curadoId)
    e.cuando = entry
      ? reglaFecha(entry)
      : e.sufijo === 'festivo'
        ? `Festivo del calendario del destino (closed_notices.festivos): «${e.tag}». Sale si la fecha cae dentro del viaje, aunque nada de la ruta cierre.`
        : `Fecha especial «${e.sufijo}».`
    if (entry?.verificar) e.cuando += ' (Texto marcado «verificar»: cuenta con prudencia, «es posible que…».)'
    e.donde = 'Ventana de avisos al abrir la ruta (con las demás fechas del viaje, centrada, con su icono); después, en la campana (arriba a la derecha), donde al tocarla vuelve a abrir esta tarjeta. DÍAS no lleva pastilla.'
    e.observado = obs(e.claveFechas)
  } else if (e.grupo === 'semanal') {
    e.cuando = `Un cierre de cada semana ({tag}) cae dentro de las fechas del viaje y el sitio está en su ruta: «${e.tag}». Sale cada semana en su día (el cierre semanal del sitio) y nombra el sitio.`.replace('{tag}', e.tag)
    e.donde = 'Ventana de avisos al abrir la ruta y, después, en la campana (arriba a la derecha). DÍAS no lleva pastilla.'
    e.observado = obs(e.claveFechas)
  } else if (e.grupo === 'excepcion') {
    e.cuando = 'La EXCEPCIÓN: un sitio de `sitios_que_no_se_quitan` (los Museos Vaticanos en domingo y festivo…) cierra un día del viaje y no se ha podido mover porque el viaje no tiene otro día: se queda en su día y la frase genérica de «hemos preparado tu ruta» sería mentira, así que el aviso lo dice.'
    e.donde = 'Ventana de avisos al abrir la ruta y, después, en la campana. El sitio se queda en su día con «Cerrado este día» en DÍAS.'
    e.observado = obs(`excepcion:${e.sufijo}`)
  } else if (e.grupo === 'fuera') {
    e.cuando = 'Un imprescindible o joya cierra ese día (festivo o cierre semanal), no hay forma de cambiarlo a otro día y se lo enseñamos por fuera («te lo enseñamos por fuera, merece la pena igual»).'
    e.donde = 'Ventana de avisos al abrir la ruta y, después, en la campana. En DÍAS, la parada lleva «Por fuera» (ver los avisos de las paradas, más abajo).'
    e.observado = obs(`fuera:${e.sufijo}`)
  } else if (e.grupo === 'ventana') {
    e.cuando = `El viaje tiene ${e.avisos} avisos de fechas. La ventana enseña como mucho 3 tarjetas: con más, la tercera dice «y N más» y los lista. Flechas ‹ ›, puntitos y «1 de 3»; el botón dice «Siguiente» hasta la última y «Entendido» en la última.`
    e.donde = 'Al abrir la ruta por primera vez, en el centro de la pantalla, después de la tarjeta especial si la hay.'
  } else if (e.grupo === 'campana') {
    e.cuando = 'Cada fecha con avisos entra en la campana con una frase corta. Lo que ya se vio en la ventana entra como leído; al abrirlo deja de contar en el numerito, pero se queda siempre en la lista; los nuevos van arriba.'
    e.donde = 'Campana de arriba a la derecha («Avisos»); al tocar una fecha se abre su tarjeta.'
  } else if (e.grupo === 'dias') {
    e.cuando = 'Cualquier día de un viaje con avisos de fechas: la cabecera del día ya no lleva pastillas de avisos («Panteón cerrado», «Año Nuevo»…) ni «Hoy el sol se pone a las…» (eso va solo en HOY).'
    e.donde = 'DÍAS, cabecera del día.'
  } else if (e.grupo === 'banner') {
    e.cuando = 'Viajes de invierno o cortos (1 o 2 días); el texto cambia con los días y si algún día hay que madrugar. Sin fechas, según el mes elegido.'
    e.donde = 'En la campana de Avisos (arriba a la derecha), como aviso del viaje («Sobre tu ruta»); no sale como banner en la ruta.'
  } else if (e.grupo === 'parada') {
    if (e.tipo === 'dia') {
      e.cuando = e.campo === 'transferNotice' ? 'El día incluye un traslado largo (tren, avión…).' : 'El día empieza antes de la hora habitual para no perder un imprescindible.'
      e.donde = `En DÍAS, día ${e.diaNumero}, bajo el plan del día.`
    } else {
      e.cuando = { outsideReason: 'La parada se enseña por fuera (cerrada ese día, ya cerrada a esa hora, aún sin abrir, o no cabe en el día).', hoursWarning: 'Sin fechas, la parada tiene días de cierre; o aviso de horario de la parada.', seasonNotice: 'La parada no está abierta en esa temporada.', closedThisDay: 'La parada cierra ese día y no hay otro día del viaje al que cambiarla: se queda en su día, sin tiempo asignado.', closedNotice: 'Nota del horario de la parada (cierres, última entrada, cuotas…).' }[e.campo] ?? 'Aviso de la parada.'
      e.donde = e.ficha ? `En la ficha de la parada (se abre al tocarla en DÍAS, día ${e.diaNumero}), en su apartado de horarios.` : `En DÍAS, día ${e.diaNumero}, en la tarjeta de la parada «${e.parada ?? ''}» (línea roja bajo su nombre) o en su ficha.`
    }
  }
  if (!('observado' in e)) e.observado = null
}
for (const e of catalogo.values()) describir(e)

// ───────────────────────────── 3. Capturas en la app ─────────────────────────────
const idArchivo = (e) => e.clave.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60)
const png = (id, sufijo = '') => path.join(SALIDA, `avisos_${id}${sufijo}.jpg`)
const ORDEN = { tarjeta: 0, fecha: 1, semanal: 2, excepcion: 3, fuera: 4, ventana: 5, campana: 6, dias: 7, banner: 8, parada: 9 }
let lista = [...catalogo.values()].sort((a, b) => (ORDEN[a.grupo] - ORDEN[b.grupo]) || a.clave.localeCompare(b.clave))
lista.forEach((e, i) => {
  e.id = `${String(i + 1).padStart(2, '0')}_${idArchivo(e)}`
})
if (SOLO) lista = lista.filter((e) => `${e.id} ${e.titulo} ${e.tag ?? ''}`.toLowerCase().includes(SOLO.toLowerCase()))

// La comprobación de los textos: nada de «anochece», llaves sin rellenar ni «hora_atardecer» en lo que se muestra (la 10L dejó una plantilla sin rellenar en 3 tarjetas).
{
  const malos = []
  for (const e of catalogo.values()) {
    for (const texto of [...e.textos, e.campana, ...(e.campanas ?? [])].filter(Boolean)) {
      if (/anochece|\{|hora_atardecer/i.test(texto)) malos.push(`${e.clave}: «${texto.slice(0, 110)}»`)
    }
  }
  if (malos.length) {
    console.error(`FALLO: ${malos.length} texto(s) con «anochece», «{» o «hora_atardecer»:\n  ${malos.join('\n  ')}`)
    process.exit(1)
  }
}

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
  await a.esp(1500)
}
const ev = (a, js) => a.evaluar(js)
/** Cierra lo que haya abierto (hoja de la ficha, ventana de avisos, campana). */
async function limpiar(a) {
  await ev(a, `${STORE}.then((m) => { m.useRouteStore.setState({ openDateNoticeId: null }); return true })`)
  await ev(a, "(() => { for (let i = 0; i < 3; i++) { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Cerrar|Entendido)$/.test((x.getAttribute('aria-label') || x.textContent || '').trim())); if (b) b.click() } return true })()")
  await a.esp(500)
}
/** Quita la tarjeta especial y/o marca la ventana de fechas como vista (para que no tape lo que se va a fotografiar). */
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
/** Lleva a la vista el elemento de la pantalla que contiene este texto. Devuelve si lo ha encontrado. */
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
const hay = (a, selector) => ev(a, `Boolean(document.querySelector(${JSON.stringify(selector)}))`)
const clic = (a, selector) => ev(a, `(() => { const b = document.querySelector(${JSON.stringify(selector)}); if (!b) return false; b.click(); return true })()`)
/** Pone el estado de «leído» de los avisos de fecha del viaje cargado (lista de ids; [] = todos nuevos) y marca la ventana como vista. */
const fijarLeidos = (a, cuales) =>
  ev(a, `(async () => {
    const { useRouteStore } = await ${STORE}
    const { dateNoticesKey } = await window.__mod('/src/lib/dateNotices.ts')
    const r = useRouteStore.getState().route
    const ids = (r.dateNotices ?? []).map((x) => x.id)
    const leidos = ${JSON.stringify(cuales)} === 'todos' ? ids : ${JSON.stringify(cuales)} === 'primero' ? ids.slice(0, 1) : []
    useRouteStore.setState({ route: { ...r, seasonNoteDismissed: true, dateNoticesSeenKey: dateNoticesKey(r.dateNotices ?? []), dateNoticesRead: leidos } })
    return ids.length
  })()`)
async function abrirCampana(a) {
  await modo(a, 'route')
  await a.esp(800)
  await ev(a, "(() => { const b = document.querySelector('button[aria-label^=\"Avisos\"]'); if (b) b.click(); return true })()")
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
  await cargarViaje(a, e.escenario)
  const primera = e.textos[0]
  if (e.tipo === 'tarjeta') {
    await modo(a, 'route')
    await a.esp(2000)
    if (await hay(a, '[data-tarjeta-especial]') && (await verTexto(a, primera, { elemento: '[data-tarjeta-especial]' }))) await sacar('', 'Arriba de la ruta (RUTA): la tarjeta especial')
    else nota.push('La tarjeta no apareció en pantalla.')
  } else if (e.tipo === 'banner') {
    await silenciar(a)
    await abrirCampana(a)
    if (await verTexto(a, primera)) await sacar('', 'En la campana de Avisos (arriba a la derecha)')
    else nota.push('El aviso no apareció en la campana de Avisos.')
    await limpiar(a)
  } else if (e.tipo === 'aviso') {
    await silenciar(a, { temporada: true, ventana: true })
    await modo(a, 'route')
    await ev(a, `${STORE}.then((m) => { m.useRouteStore.getState().setOpenDateNoticeId(${JSON.stringify(e.noticeId)}); return true })`)
    await a.esp(1500)
    if (await verTexto(a, primera, { elemento: '[data-ventana-avisos="uno"]' })) await sacar('', 'La tarjeta del aviso (ventana, o al tocarlo en la campana)')
    else nota.push('La tarjeta no apareció (¿el aviso no sale en este viaje?).')
    await limpiar(a)
  } else if (e.tipo === 'ventana') {
    await ev(a, `${STORE}.then((m) => { m.useRouteStore.getState().dismissSeasonNote(); return true })`)
    await modo(a, 'route')
    await a.esp(2000)
    if (!(await hay(a, '[data-ventana-avisos="todos"]'))) nota.push('La ventana no apareció.')
    else {
      await sacar('_1', 'La ventana al abrir la ruta: primera tarjeta')
      let pasos = 0
      while (pasos < 5 && (await clic(a, '[data-aviso-boton="siguiente"]'))) {
        pasos++
        await a.esp(900)
        if (pasos === 1) await sacar('_2', 'Segunda tarjeta (flechas, puntitos y «2 de 3»)')
      }
      await a.esp(600)
      await sacar('_3', e.avisos > 3 ? 'La última tarjeta: «y N más»' : 'La última tarjeta («Entendido»)')
    }
    await limpiar(a)
  } else if (e.tipo === 'campana') {
    const total = await fijarLeidos(a, e.estado === 'nuevos' ? 'ninguno' : e.estado === 'mezcla' ? 'primero' : 'todos')
    await abrirCampana(a)
    const filas = await ev(a, "document.querySelectorAll('[data-aviso-fecha]').length")
    if (!filas) nota.push('La campana no mostró filas de avisos de fecha.')
    else {
      await sacar('_campana', e.estado === 'nuevos' ? 'La campana: todos nuevos (con su punto)' : e.estado === 'mezcla' ? 'La campana: los nuevos arriba y los leídos debajo' : 'La campana: todo leído (se quedan en la lista)')
      if (e.estado === 'leidos') {
        await clic(a, '[data-aviso-fecha]')
        await a.esp(1800)
        if (await hay(a, '[data-ventana-avisos="uno"]')) await sacar('_tarjeta', 'La tarjeta que abre al tocar uno')
        else nota.push('Al tocar la fila no se abrió la tarjeta.')
      }
    }
    void total
    await limpiar(a)
  } else if (e.tipo === 'dias') {
    await silenciar(a)
    await modo(a, 'days', 0)
    await a.esp(2500)
    await ev(a, `(() => { const c = document.querySelector('[data-day-id="' + window.__rutaCargada.days[0].id + '"]'); if (c) c.scrollIntoView({ block: 'start' }); return true })()`)
    await a.esp(800)
    const sol = await ev(a, "/se pone a las/i.test(document.body.innerText)")
    const pastillas = await ev(a, "Array.from(document.querySelectorAll('[data-day-id] button')).filter((b) => /cerrad|Horario especial|Año Nuevo|Navidad|Nochebuena|Ferragosto/i.test(b.textContent || '')).length")
    await sacar('', 'DÍAS: cabecera de un día con aviso, sin pastillas')
    nota.push(`Comprobado en la pantalla: «Hoy el sol se pone» ${sol ? 'SALE (mal)' : 'no sale'}; pastillas de aviso en las cabeceras: ${pastillas}.`)
  } else if (e.tipo === 'parada' || e.tipo === 'dia') {
    await silenciar(a)
    const idx = await ev(a, `window.__rutaCargada.days.findIndex((d) => d.dayNumber === ${e.diaNumero ?? 1})`)
    await modo(a, 'days', idx < 0 ? 0 : idx)
    await a.esp(2500)
    let visto = false
    const campo = e.campo ?? 'closedNotice'
    if (!e.ficha) visto = await verTexto(a, primera)
    if (!visto && e.tipo === 'parada') {
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
  if (!SOLO) for (const x of fs.readdirSync(SALIDA)) if (/^avisos_.*\.jpg$/.test(x)) fs.rmSync(path.join(SALIDA, x))
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
    const fotos = fs.readdirSync(SALIDA).filter((x) => x.startsWith(`avisos_${e.id}`) && x.endsWith('.jpg')).sort().map((x) => ({ archivo: path.join(SALIDA, x), etiqueta: 'Captura' }))
    resultados.push({ e, fotos, nota: [] })
  }
}

// ───────────────────────────── 4. La página ─────────────────────────────
const img = (archivo) => `data:image/jpeg;base64,${fs.readFileSync(archivo).toString('base64')}`
const GRUPOS = [
  ['tarjeta', 'Las tarjetas especiales (arriba de la ruta)', 'Solo tres, una por viaje y con un solo texto: Navidad, Semana Santa y Pascua, y el cumpleaños de Roma. Si un viaje cae en dos, solo la de Semana Santa.'],
  ['fecha', 'Un aviso por fecha', 'Un ejemplo de cada fecha especial y de cada festivo. Qué pasa ese día, siempre igual, más (si la ruta cambió algo) la frase de lo que hemos hecho. Salen aunque nada de la ruta cierre.'],
  ['semanal', 'Los cierres de cada semana', 'Un sitio cierra un día fijo de la semana (los domingos los Vaticanos, los lunes la Galería Borghese y otros) y cae dentro del viaje.'],
  ['excepcion', 'La excepción: «se quedan en su día y decides tú»', 'Cuando un sitio que nunca se quita de su día cierra y el viaje no tiene otro día al que cambiarlo, la frase genérica sería mentira.'],
  ['fuera', 'Te lo enseñamos por fuera', 'Un imprescindible cierra ese día y se enseña desde fuera.'],
  ['ventana', 'La ventana con varios avisos', 'Centrada, del estilo de la tarjeta de Navidad: flechas, puntitos, «1 de 3», como mucho 3 tarjetas (la tercera con «y N más»).'],
  ['campana', 'La campana', 'Cada fecha con avisos entra con una frase corta; los nuevos arriba, los leídos se quedan en la lista; al tocar uno se abre su tarjeta.'],
  ['dias', 'DÍAS, sin pastillas', 'La cabecera del día ya no lleva avisos ni la puesta de sol.'],
  ['banner', 'El aviso «Sobre tu ruta» (campana)', 'Una frase que explica por qué es como es la ruta (viaje corto, invierno).'],
  ['parada', 'Avisos de las paradas y del día (DÍAS)', 'Lo rojo o gris que sale en la tarjeta o la ficha de una parada, y los avisos del día.'],
]
const tarjetas = (grupo) =>
  resultados
    .filter((r) => r.e.grupo === grupo)
    .map((r) => {
      const { e, fotos, nota } = r
      const imagenes = fotos.map((f) => `<figure><img src="${img(f.archivo)}" alt="${esc(f.etiqueta)}" loading="lazy"><figcaption>${esc(f.etiqueta)}</figcaption></figure>`).join('')
      const campanas = (e.campana ? [e.campana] : e.campanas ?? []).filter(Boolean)
      return `<article id="${esc(e.id)}"><h3>${esc(e.titulo)}</h3>
<div class="fotos">${imagenes || '<p class="sin">Sin captura.</p>'}</div>
${nota.length ? `<p class="aviso">${esc(nota.join(' '))}</p>` : ''}
<blockquote>${e.textos.map((t) => `<p>${esc(t)}</p>`).join('')}</blockquote>
${campanas.length ? `<p class="campana">En la campana: ${campanas.map(esc).join(' · ')}</p>` : ''}
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
h3{font-size:15px;margin:0 0 10px;line-height:1.3}
.intro,header p{color:rgba(28,34,48,.7);margin:0 0 14px}nav ul{padding-left:18px;margin:8px 0}
article{background:#fff;border:1px solid rgba(166,124,82,.25);border-radius:18px;padding:14px;margin:16px 0}
.fotos{display:flex;flex-direction:column;gap:10px}figure{margin:0}figure img{display:block;width:100%;height:auto;border-radius:12px;border:1px solid rgba(28,34,48,.1)}
figcaption{font:600 10.5px/1.2 ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--profundo);margin-top:5px}
blockquote{margin:12px 0;padding:8px 12px;border-left:3px solid var(--oro);background:rgba(166,124,82,.08);border-radius:0 8px 8px 0}blockquote p{margin:0 0 6px}blockquote p:last-child{margin:0}
.campana{margin:6px 0;font-size:13px;color:var(--profundo)}
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
