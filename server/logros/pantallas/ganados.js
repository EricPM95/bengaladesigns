/**
 * LO QUE PIDEN «MI VITRINA» Y «TODOS MIS LOGROS» (Tanda 8C2). Rutas de solo lectura salvo la de la vitrina.
 *
 *   GET /api/logros/ganados                     todo lo ganado (y lo que falta de los logros de viajero), listo para pintar
 *   PUT /api/logros/ganados/vitrina { balda, huecos:[claves] }   guarda una balda entera (hasta 4); `huecos: []` la deja vacía de verdad
 *
 * Todo sale de las funciones puras que ya había (`estadoDestino`, `pasaporte`, `logrosVisibles`, `armarMomentos`, `hechosQueCuentan`): ningún número está escrito aquí.
 * Solo existe lo que está encendido en la Versión 1 (`aItems` ya quita lo apagado y `logrosVisibles` solo da lo encendido). Los emblemas ocultos que NO se han
 * encontrado no aparecen en ningún sitio: aquí solo entran los encontrados.
 */

import { GLOBAL, clave, hechosQueCuentan, parteLocal } from '../motor.js'
import { armarMomentos } from '../momentos.js'
import { datosDeSitio } from '../sitios.js'
import { estadoDestino, logrosVisibles, pasaporte } from '../vistas.js'

/** Los grupos de logros de viajero, en el orden del diseño (`viajero.json › logros[].grupo`). */
export const GRUPOS_VIAJERO = [
  { id: 'mundo', nombre: 'El mundo' },
  { id: 'tiempo', nombre: 'El tiempo' },
  { id: 'como_viajas', nombre: 'Cómo viajas' },
  { id: 'coleccionista', nombre: 'Coleccionista' },
]
const EXCLUSIVOS = new Set(['fundador', 'pionero', 'edicion_anio', 'probador'])

/** El nombre de cada familia de logros (la fila del grupo) y la unidad de su cuenta, en singular y en plural. Son los del Dashboard de Design. */
export const FAMILIAS = {
  paises: ['Países', 'país visitado', 'países visitados'],
  destinos: ['Destinos', 'destino', 'destinos'],
  capitales: ['Capitales', 'capital', 'capitales'],
  patrimonios: ['Patrimonios', 'Patrimonio visitado', 'Patrimonios visitados'],
  viajes: ['Viajes', 'viaje', 'viajes'],
  con_quien_solo: ['A mi aire', 'viaje a tu aire', 'viajes a tu aire'],
  con_quien_pareja: ['En pareja', 'viaje en pareja', 'viajes en pareja'],
  con_quien_amigos: ['Con amigos', 'viaje con amigos', 'viajes con amigos'],
  con_quien_familia: ['En familia', 'viaje en familia', 'viajes en familia'],
  conocedor: ['Conocedor', 'sitio visto', 'sitios vistos'],
  cazador_emblemas: ['Cazador de emblemas', 'emblema encontrado', 'emblemas encontrados'],
  coleccionista: ['Coleccionista', 'colección completada', 'colecciones completadas'],
}

const MAYUS = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1)

/** El código de país (ISO, en minúsculas) a partir de su nombre en español («Italia» → «it»), para la bandera. null si no se conoce. */
let codigos = null
export function codigoDePais(nombre) {
  if (!codigos) {
    codigos = new Map()
    try {
      const nombres = new Intl.DisplayNames(['es'], { type: 'region' })
      const A = 65
      for (let i = 0; i < 26; i++) for (let j = 0; j < 26; j++) {
        const cod = String.fromCharCode(A + i, A + j)
        const n = nombres.of(cod)
        if (n && n !== cod) codigos.set(n.toLowerCase(), cod.toLowerCase())
      }
    } catch {
      /* sin datos de idioma: sin bandera */
    }
  }
  return codigos.get(String(nombre ?? '').toLowerCase()) ?? null
}

/** A qué balda de la vitrina va una cosa ganada (null: no se puede llevar a la vitrina: el pedestal, los exclusivos y lo que no es un logro). */
export function baldaDe(it) {
  if (it.logro === 'sello') return 'sellos'
  if (it.logro === 'coleccion') return 'colecciones'
  if (it.logro === 'emblema') return 'emblemas'
  if (it.logro.startsWith('viajero:')) {
    const id = it.logro.slice('viajero:'.length)
    return EXCLUSIVOS.has(id) || id === 'maravillas' ? null : 'viajero'
  }
  return null
}

/** Las cosas ganadas que ya tienen otra más alta de lo mismo (el bronce de un sello que ya está en oro, el escalón 3 de uno que ya llegó al 5): están ganadas, pero no se enseñan ni se llevan a la vitrina. */
export function clavesSuperadas(datos, items) {
  const todos = [...items.values()]
  const altoSello = new Map()
  for (const it of todos.filter((x) => x.logro === 'sello')) {
    const [sid, grado] = it.escalon.split(':')
    const s = datos.destinos[it.destino]?.sellos.find((x) => x.id === sid)
    const ix = s ? s.grados.findIndex((g) => g.grado === grado) : -1
    const k = `${it.destino}|${sid}`
    if (!altoSello.has(k) || ix > altoSello.get(k).ix) altoSello.set(k, { ix, clave: it.clave })
  }
  const altoEscalon = new Map()
  for (const it of todos.filter((x) => x.logro.startsWith('viajero:') && x.escalon !== '')) {
    const k = `${it.destino}|${it.logro}`
    if (!altoEscalon.has(k) || Number(it.escalon) > altoEscalon.get(k).n) altoEscalon.set(k, { n: Number(it.escalon), clave: it.clave })
  }
  const salida = new Set()
  for (const it of todos) {
    if (it.logro === 'sello' && altoSello.get(`${it.destino}|${it.escalon.split(':')[0]}`)?.clave !== it.clave) salida.add(it.clave)
    if (it.logro.startsWith('viajero:') && it.escalon !== '' && altoEscalon.get(`${it.destino}|${it.logro}`)?.clave !== it.clave) salida.add(it.clave)
  }
  return salida
}

/** La vitrina tal como la ve la persona. Como `construirVitrina`, pero una balda que el viajero ha dejado vacía a propósito (lista vacía guardada) se queda vacía en vez de rellenarse sola, y lo superado (el bronce de un sello que ya es oro) no se pone solo. */
export function vitrinaDeGanados({ items, guardada = { baldas: {}, titulo: null }, superadas = new Set() }) {
  const lista = [...items.values()].filter((it) => !superadas.has(it.clave)).sort((a, b) => new Date(b.en) - new Date(a.en))
  const de = (f) => lista.filter(f)
  const baldas = { viajero: de((it) => baldaDe(it) === 'viajero'), sellos: de((it) => it.logro === 'sello'), colecciones: de((it) => it.logro === 'coleccion'), emblemas: de((it) => it.logro === 'emblema') }
  const salida = {}
  for (const [nombre, todos] of Object.entries(baldas)) {
    const guardadas = guardada.baldas?.[nombre]
    const elegida = Array.isArray(guardadas)
    const huecos = elegida ? guardadas.map((k) => items.get(k)).filter(Boolean).slice(0, 4) : todos.slice(0, 4)
    salida[nombre] = { huecos: huecos.map((it) => it.clave), elegida, hay_mas: todos.length > huecos.length }
  }
  return {
    pedestal: de((it) => it.logro === 'maravilla').map((it) => it.clave),
    exclusivos: de((it) => it.logro.startsWith('viajero:') && EXCLUSIVOS.has(it.logro.slice(8))).map((it) => it.clave),
    baldas: salida,
    titulo: guardada.titulo && items.get(guardada.titulo) ? guardada.titulo : null,
  }
}

/** Pura: pone una balda entera. Devuelve { ok, guardada } o { ok:false, motivo }. Solo vale lo ganado, de esa balda, sin repetir y con 4 como mucho. */
export function ponerBalda({ items, guardada, balda, huecos, superadas = new Set() }) {
  if (!['viajero', 'sellos', 'colecciones', 'emblemas'].includes(balda)) return { ok: false, motivo: 'balda_desconocida' }
  if (!Array.isArray(huecos) || huecos.length > 4) return { ok: false, motivo: 'demasiados' }
  const unicos = [...new Set(huecos.map(String))]
  if (unicos.length !== huecos.length) return { ok: false, motivo: 'repetidos' }
  for (const k of unicos) {
    const it = items.get(k)
    if (!it) return { ok: false, motivo: 'no_ganado' }
    if (baldaDe(it) !== balda || superadas.has(k)) return { ok: false, motivo: 'otra_balda' }
  }
  return { ok: true, guardada: { ...guardada, baldas: { ...(guardada.baldas ?? {}), [balda]: unicos } } }
}

/* ------------------------------------------------------------------ */
/* Lo ganado, listo para pintar                                        */
/* ------------------------------------------------------------------ */

/** Cuánto lleva la persona de cada familia con escalones (pura): de lo ganado y de los hechos que cuentan. */
export function cuentasDeFamilias({ datos, items, cuentan, viajes }) {
  const n = (logro) => [...items.values()].filter((it) => it.logro === logro).length
  const viajesHechos = new Map()
  for (const h of cuentan) if (!viajesHechos.has(h.trip_id)) viajesHechos.set(h.trip_id, viajes[h.trip_id]?.con_quien ?? null)
  const capitales = new Set()
  const sitiosPorCiudad = new Map()
  for (const h of cuentan) {
    const d = datos.destinos[h.destino]
    const s = datosDeSitio(d, h.sitio)
    if (s?.capital) capitales.add(`${s.pais}|${d.ciudad}`)
    if (h.sitio && (d.sitios_catalogo ?? Object.keys(d.sitios)).includes(h.sitio)) {
      if (!sitiosPorCiudad.has(h.destino)) sitiosPorCiudad.set(h.destino, new Set())
      sitiosPorCiudad.get(h.destino).add(h.sitio)
    }
  }
  const conQuien = (valor) => [...viajesHechos.values()].filter((v) => v === valor).length
  return {
    paises: n('pais'),
    destinos: n('destino_nuevo'),
    capitales: capitales.size,
    patrimonios: n('patrimonio'),
    viajes: viajesHechos.size,
    con_quien_solo: conQuien('solo'),
    con_quien_pareja: conQuien('pareja'),
    con_quien_amigos: conQuien('amigos'),
    con_quien_familia: conQuien('familia'),
    conocedor: Math.max(0, ...[...sitiosPorCiudad.values()].map((s) => s.size)),
    cazador_emblemas: n('emblema'),
    coleccionista: n('coleccion'),
  }
}

/** Pura: todo lo que enseñan «Mi vitrina» y «Todos mis logros». `items` ya sin lo apagado; `cuentan` = hechosQueCuentan(...); `viajes` = los viajes conocidos. */
export function construirGanados({ datos, catalogos, items, cuentan = [], viajes = {}, perfil = {}, ahora = new Date() }) {
  void catalogos
  const destinoDe = (it) => (datos.destinos[it.destino] ? it.destino : (viajes[it.trip_id]?.destino ?? Object.keys(datos.destinos)[0]))
  const fechaDe = (it) => parteLocal(it.en, datos.destinos[destinoDe(it)].timezone)?.fecha ?? String(it.en).slice(0, 10)
  const lugarDe = (it) => {
    const d = datos.destinos[destinoDe(it)]
    return d.pais_defecto ? `${d.ciudad}, ${d.pais_defecto}` : d.ciudad
  }
  const todos = [...items.values()]
  const visibles = logrosVisibles(datos, ahora)
  const momentoDe = (it) => {
    const m = armarMomentos({ datos, nuevos: [it], despues: items, antes: new Map(), ultimaFrase: null, azar: () => 0 }).find((x) => x.clave === it.clave) ?? null
    return m ? { ...m, primera_vez: false, frase: null } : null
  }

  const superadas = clavesSuperadas(datos, items)

  const salida = []
  for (const it of todos) {
    const d = datos.destinos[it.destino] ?? null
    let tipo = null
    let nombre = ''
    let linea = null
    let extra = {}
    if (it.logro === 'sello' && d) {
      const [sid, grado] = it.escalon.split(':')
      const s = d.sellos.find((x) => x.id === sid)
      const g = s?.grados.find((x) => x.grado === grado)
      if (!s || !g) continue
      tipo = 'sello'
      nombre = `Sello ${/^El /.test(s.nombre) ? `del ${s.nombre.slice(3)}` : `de ${s.nombre}`}`
      extra = { sello: sid, grado, nombre_grado: g.nombre, superado: superadas.has(it.clave) }
    } else if (it.logro === 'coleccion' && d) {
      const c = d.colecciones.find((x) => x.id === it.escalon)
      if (!c) continue
      tipo = 'coleccion'
      nombre = c.nombre
      linea = c.al_completar
      extra = { coleccion: c.id, destino_grupo: c.grupo }
    } else if (it.logro === 'emblema' && d) {
      const e = d.emblemas.find((x) => x.id === it.escalon)
      if (!e) continue
      tipo = 'emblema'
      nombre = e.nombre
      linea = e.linea
      extra = { emblema: e.id }
    } else if (it.logro === 'maravilla') {
      tipo = 'maravilla'
      nombre = datos.viajero.maravillas[it.escalon]?.nombre ?? it.escalon
      linea = datos.viajero.maravillas[it.escalon]?.linea ?? null
      extra = { maravilla: it.escalon }
    } else if (it.logro.startsWith('viajero:')) {
      const id = it.logro.slice('viajero:'.length)
      if (id === 'maravillas') continue
      const def = datos.viajero.logros.find((x) => x.id === id)
      if (!def) continue
      tipo = EXCLUSIVOS.has(id) ? 'exclusivo' : 'viajero'
      extra = { def: id, grupo: def.grupo, superado: superadas.has(it.clave) }
    } else continue
    const m = momentoDe(it)
    if (tipo === 'viajero' || tipo === 'exclusivo' || tipo === 'sello') {
      nombre = tipo === 'sello' ? nombre : (m?.nombre ?? nombre)
      linea = m?.linea ?? linea
    }
    const balda = baldaDe(it)
    salida.push({
      clave: it.clave,
      tipo,
      destino: it.destino === GLOBAL ? null : it.destino,
      logro: it.logro,
      escalon: it.escalon,
      nombre,
      linea: linea || null,
      en: it.en,
      fecha: fechaDe(it),
      lugar: lugarDe(it),
      balda,
      titulable: it.logro.startsWith('viajero:'),
      momento: m,
      ...extra,
    })
  }
  const porClave = new Map(salida.map((x) => [x.clave, x]))
  const vitrina = vitrinaDeGanados({ items, guardada: perfil.vitrina ?? { baldas: {}, titulo: null }, superadas })

  /* ── Los logros de viajero, por grupos (también los que aún no se tienen, con cómo conseguirlos) ── */
  const cuentas = cuentasDeFamilias({ datos, items, cuentan, viajes })
  const avance = avanceDeTiempo({ datos, cuentan })
  const filas = []
  for (const def of visibles) {
    if (def.id === 'maravillas' || EXCLUSIVOS.has(def.id) || !GRUPOS_VIAJERO.some((g) => g.id === def.grupo)) continue
    const ganados = salida.filter((x) => x.def === def.id && (x.tipo === 'viajero'))
    const alto = def.escalones ? ganados.filter((x) => !x.superado).sort((a, b) => Number(b.escalon) - Number(a.escalon))[0] : ganados[0]
    const fam = FAMILIAS[def.id]
    const cur = def.escalones ? (cuentas[def.id] ?? 0) : null
    const sig = def.escalones ? (def.escalones.find((e) => e.n > (cur ?? 0)) ?? null) : null
    const objetivo = def.escalones ? (sig?.n ?? def.escalones[def.escalones.length - 1].n) : (avance[def.id]?.total ?? 1)
    const actual = def.escalones ? cur : (avance[def.id]?.n ?? (alto ? 1 : 0))
    const ultimo = def.escalones ? def.escalones[def.escalones.length - 1] : null
    filas.push({
      id: def.id,
      grupo: def.grupo,
      familia: fam ? fam[0] : (def.nombre ? MAYUS(def.nombre.replace(/\{[^}]+\}/g, '').trim() || def.id) : def.id),
      con_escalones: Boolean(def.escalones),
      ganado: Boolean(alto),
      clave: alto?.clave ?? null,
      escalon: alto ? (alto.escalon === '' ? null : Number(alto.escalon)) : (def.escalones ? def.escalones[0].n : null),
      nombre: alto?.nombre ?? (def.escalones ? (fam?.[0] ?? def.id) : (def.nombre ? MAYUS(def.nombre.replace(/\{[^}]+\}/g, '').trim()) : def.id)),
      linea: alto?.linea ?? def.linea ?? null,
      como: def.como ?? null,
      fecha: alto?.fecha ?? null,
      lugar: alto?.lugar ?? null,
      cuenta: def.escalones ? { n: cur, unidad_uno: fam?.[1] ?? '', unidad_varios: fam?.[2] ?? '' } : null,
      actual,
      objetivo,
      completo: def.escalones ? (ultimo != null && (cur ?? 0) >= ultimo.n) : Boolean(alto),
      siguiente: sig ? { n: sig.n, nombre: sig.nombre, faltan: sig.n - (cur ?? 0) } : null,
      progreso: avance[def.id]?.valor ?? null,
      nuevo: def.nuevo ?? false,
    })
  }
  const viajero = GRUPOS_VIAJERO.map((g) => ({ ...g, filas: filas.filter((f) => f.grupo === g.id) })).filter((g) => g.filas.length > 0)

  /* ── Las 7 maravillas y los exclusivos ── */
  const maravillas = Object.entries(datos.viajero.maravillas).map(([id, m]) => {
    const it = items.get(clave(GLOBAL, 'maravilla', id))
    return { id, nombre: m.nombre, ganada: Boolean(it), clave: it?.clave ?? null, fecha: it ? porClave.get(it.clave)?.fecha : null }
  })
  const exclusivos = vitrina.exclusivos.map((k) => porClave.get(k)).filter(Boolean)

  /* ── Por destino (y por países) ── */
  const vistos = datos.destinos
  const porDestino = Object.values(vistos)
    .filter((d) => items.has(clave(GLOBAL, 'destino_nuevo', d.clave)) || todos.some((it) => it.destino === d.clave))
    .map((d) => {
      const est = estadoDestino({ datos, destino: d.clave, items })
      const principal = est.sellos.find((s) => s.id === d.sello_principal) ?? est.sellos[0]
      const completas = est.colecciones.filter((c) => c.completa).length
      const primero = todos.filter((it) => it.destino === d.clave).map((it) => it.en).sort()[0] ?? null
      return {
        destino: d.clave,
        ciudad: d.ciudad,
        pais: d.pais_defecto ?? null,
        codigo_pais: codigoDePais(d.pais_defecto),
        sello: { id: principal.id, nombre: principal.nombre, grado: principal.grado, nombre_grado: principal.nombre_grado, linea: principal.linea },
        sellos: est.sellos.map((s) => ({ id: s.id, nombre: s.nombre, grado: s.grado })),
        colecciones: { completas, total: est.colecciones.length },
        secretos: { encontrados: est.secretos.encontrados },
        avance: est.colecciones.length > 0 ? completas / est.colecciones.length : 0,
        desde: primero,
      }
    })
    .sort((a, b) => String(a.desde).localeCompare(String(b.desde)))
  const pas = pasaporte({ datos, items, ahora })
  const paises = pas.tus_paises.map((p) => ({
    pais: p.pais,
    codigo: codigoDePais(p.pais),
    destinos: p.destinos
      .filter((x) => x.sellos.length > 0)
      .map((x) => {
        const d = datos.destinos[x.destino]
        return { destino: x.destino, ciudad: x.ciudad, dentro_de_otro: p.pais !== d.pais_defecto, sellos: x.sellos }
      }),
  }))

  const t = vitrina.titulo ? porClave.get(vitrina.titulo) : null
  const lista = salida.filter((x) => !x.superado)
  return {
    ok: true,
    // «N logros conseguidos»: cada sello (en su grado más alto), colección, emblema, maravilla y exclusivo, y cada logro de viajero con su escalón más alto.
    total: lista.length,
    titulo: t ? { clave: t.clave, nombre: t.nombre } : null,
    items: salida,
    viajero,
    maravillas,
    exclusivos,
    por_destino: porDestino,
    paises,
    vitrina,
  }
}

/** El avance de «Las cuatro estaciones» y «Los 12 meses» (para dibujar su chapa poco a poco). */
function avanceDeTiempo({ datos, cuentan }) {
  const estaciones = new Set()
  const meses = new Set()
  for (const h of cuentan) {
    const est = Object.entries(datos.ajustes.estaciones).find(([, ms]) => ms.includes(h.loc.mes))?.[0]
    if (est) estaciones.add(est)
    meses.add(h.loc.mes)
  }
  return {
    cuatro_estaciones: { n: estaciones.size, total: Object.keys(datos.ajustes.estaciones).length, valor: estaciones.size },
    doce_meses: { n: meses.size, total: 12, valor: [...meses].sort((x, y) => x - y).join(',') },
  }
}

export function registrar(app, { conUsuario, servicio, repo, datos, catalogos, ahora }) {
  const cargarTodo = async (userId) => {
    const c = await servicio.cargar(userId)
    const perfil = await repo.perfilDe(userId)
    const items = servicio.aItems(c.logros)
    return { c, perfil, items }
  }
  app.get('/api/logros/ganados', conUsuario(async (_req, res, u) => {
    const { c, perfil, items } = await cargarTodo(u.id)
    const cuentan = hechosQueCuentan(c.hechos, c.viajes, datos)
    res.json(construirGanados({ datos, catalogos, items, cuentan, viajes: c.viajes, perfil, ahora: ahora() }))
  }))
  app.put('/api/logros/ganados/vitrina', conUsuario(async (req, res, u) => {
    const { perfil, items } = await cargarTodo(u.id)
    const superadas = clavesSuperadas(datos, items)
    const r = ponerBalda({ items, guardada: perfil.vitrina ?? { baldas: {}, titulo: null }, balda: String(req.body?.balda ?? ''), huecos: req.body?.huecos, superadas })
    if (!r.ok) return res.status(400).json({ ok: false, motivo: r.motivo })
    await repo.guardarPerfil(u.id, { vitrina: r.guardada })
    return res.json({ ok: true, vitrina: vitrinaDeGanados({ items, guardada: r.guardada, superadas }) })
  }))
}
