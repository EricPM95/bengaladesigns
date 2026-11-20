/**
 * LOS NÚMEROS DE «LOGROS Y SONIDOS» DEL PANEL (V35A). Funciones PURAS (sin leer archivos ni la base de datos): reciben los datos ya cargados y devuelven lo que enseña la pantalla.
 * Las usa el servidor (server/panel/logrosPanel.js, que lee los archivos y la tabla `achievements`) y el servidor de mentira de la demo (src/lib/logrosDemo_a_logrosPanel.ts, con los MISMOS archivos).
 * Así lo que se ve en la prueba es lo mismo que sale de verdad, y ningún número está escrito a mano.
 *
 *   filasDeDestinos(fuentes)      → la tabla «Qué tiene cada destino» (los 11 del lanzamiento + los 3 de «Próximamente»)
 *   paginaDeDestino(fuentes, k)   → la página de un destino («Roma por dentro»)
 *   resumenDeLogros(...)          → la pestaña «Logros» (solo números: cuánta gente tiene cada cosa, nunca quién ni sus fotos)
 *
 * `fuentes` = {
 *   lanzamiento: { salida: [{clave, nombre, iso}], proximamente: [...] }   data/primera_vez/destinos.json
 *   logros:      { roma: <data/logros/roma.json>, ... }
 *   nombres:     { roma: { id_de_sitio: 'Nombre' } }                          del catálogo de sitios (data/pipeline_v2/<clave>.json)
 *   dias:        { roma: ['D0', 'D1', ...] }                                  las claves de data/dias/<clave>/listas.json › dias
 *   fotos:       { roma: { sin: ['Terraza del Altar de la Patria'] } }       los lugares que van sin foto (`sin_foto` de data/dias/<clave>/_fotos.json)
 *   portadas:    { roma: '/fotos/roma/...jpg' }                              data/dias/<clave>/_mapa.json
 *   publicos:    ['roma']      destinos abiertos a todo el mundo en la app (server/destinosCurados.js, sin administrador)
 *   ocultos:     ['lanzarote'] destinos que solo ven los administradores (los curados con administrador menos los públicos)
 *   avisos:      [{ nivel, donde, texto }]   lo que dice `validarDatos` (server/logros/datos.js)
 *   ajustes:     <data/logros/ajustes.json>
 * }
 */

export const GRADOS = ['bronce', 'plata', 'oro', 'diamante']
export const NOMBRE_GRADO = { bronce: 'Bronce', plata: 'Plata', oro: 'Oro', diamante: 'Diamante' }

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/** La clave de los números de un destino: cuántos sitios, medallas (un sello = un grado de cada uno), colecciones, emblemas, maravillas y días de ruta. `null` si el destino no tiene datos (sale «—»). */
export function numerosDeDestino(d, diasRuta) {
  if (!d) return { sitios: null, medallas: null, colecciones: null, emblemas: null, maravillas: null, dias_ruta: null }
  return {
    sitios: Object.keys(d.sitios ?? {}).length,
    // La columna «Medallas» cuenta lo mismo que se ve dentro: TODOS los grados (bronce, plata, oro, diamante) de cada sello.
    medallas: (d.sellos ?? []).reduce((s, x) => s + (x.grados?.length ?? 0), 0),
    colecciones: (d.colecciones ?? []).length,
    emblemas: (d.emblemas ?? []).length,
    // Una maravilla es un sitio que lleva la marca `maravilla` en los datos de logros (Roma: el Coliseo).
    maravillas: Object.values(d.sitios ?? {}).filter((s) => s && s.maravilla).length,
    // Los días de ruta: las rutas escritas de 1, 2, 3… días (D1, D2…): no cuentan las variantes (D1-corto, DT-medio…).
    dias_ruta: diasRuta ? diasRuta.filter((k) => /^D\d+$/.test(k) && k !== 'D0').length : null,
  }
}

/** El estado de un destino: 'publicado' (abierto en la app), 'oculto' (solo administradores), 'preparacion' (del lanzamiento, aún sin datos) o 'proximamente'. */
export function estadoDeDestino(clave, f, esProximamente) {
  if (esProximamente) return 'proximamente'
  if ((f.publicos ?? []).includes(clave)) return 'publicado'
  if ((f.ocultos ?? []).includes(clave)) return 'oculto'
  return 'preparacion'
}

/** Los avisos de datos de un destino (la franja rosa): lo que dice `validarDatos` + «falta la foto de…» + «falta el texto de…». Cada uno es una línea corta. */
export function avisosDeDestino(f, clave) {
  const d = f.logros?.[clave]
  if (!d) return []
  const nombres = f.nombres?.[clave] ?? {}
  const salida = []
  for (const a of f.avisos ?? []) {
    if (a.donde !== clave && !String(a.donde).startsWith(`${clave}/`)) continue
    const id = String(a.donde).split('/').slice(1).join('/')
    salida.push(id ? `${nombres[id] ?? id}: ${a.texto}` : a.texto)
  }
  // Los lugares que van sin foto (`sin_foto` de data/dias/<destino>/_fotos.json: se ven con el color neutro de la app hasta que haya una buena). Los demás, si no tienen foto propia, usan la de Unsplash o Wikipedia.
  for (const n of f.fotos?.[clave]?.sin ?? []) salida.push(`Falta la foto de ${n}`)
  for (const e of d.emblemas ?? []) if (!String(e.linea ?? '').trim() || !String(e.nombre ?? '').trim()) salida.push(`Falta el texto de «${e.nombre || e.id}»`)
  return salida
}

/** La tabla «Qué tiene cada destino»: 14 filas (los 11 del lanzamiento y los 3 de «Próximamente»). Lo que no existe en los datos sale `null` (en pantalla, «—»). `flojas`: las columnas a 0 de un destino que sí tiene datos. */
export function filasDeDestinos(f) {
  const lista = [...(f.lanzamiento?.salida ?? []).map((d) => ({ ...d, prox: false })), ...(f.lanzamiento?.proximamente ?? []).map((d) => ({ ...d, prox: true }))]
  return lista.map((d) => {
    const datos = f.logros?.[d.clave] ?? null
    const n = numerosDeDestino(datos, f.dias?.[d.clave])
    // Lo que va más flojo (rosa suave en la tabla): menos de 5 emblemas, o ninguna medalla o colección. Solo en destinos que ya tienen datos.
    const flojas = datos ? [...(n.emblemas < 5 ? ['emblemas'] : []), ...(n.medallas === 0 ? ['medallas'] : []), ...(n.colecciones === 0 ? ['colecciones'] : [])] : []
    return { clave: d.clave, nombre: d.nombre, iso: d.iso ?? null, estado: estadoDeDestino(d.clave, f, d.prox), con_datos: Boolean(datos), ...n, flojas, avisos: avisosDeDestino(f, d.clave).length }
  })
}

const PALETA_DE_SITIOS = ['linear-gradient(145deg,#E2A872,#A8602F)', 'linear-gradient(145deg,#8FA6DA,#3F5A9F)', 'linear-gradient(145deg,#9CCB8E,#3F7B3A)', 'linear-gradient(145deg,#D9A184,#9A5A44)', 'linear-gradient(145deg,#B79BD6,#6B4A99)']

/** Dónde se gana un emblema, en una frase: el sitio (los de sitio) o la regla de la hora (los de momento). */
function dondeSeGana(e, d, nombres, ajustes) {
  if (e.tipo === 'sitio') return nombres[e.sitio] ?? e.sitio ?? '—'
  if (e.momento === 'madrugador') return `Foto antes de las ${ajustes?.madrugador_antes_de ?? '08:00'} · ${d.ciudad}`
  if (e.momento === 'nocturno') return `Foto desde las ${ajustes?.nocturno_desde ?? '22:00'} · ${d.ciudad}`
  if (e.momento === 'atardecer_atlantico') return `Foto en la hora del atardecer · ${d.ciudad}`
  return `Un momento especial · ${d.ciudad}`
}

/** La página de un destino («Roma por dentro»), o null si ese destino no tiene datos de logros. */
export function paginaDeDestino(f, clave) {
  const d = f.logros?.[clave]
  const fila = filasDeDestinos(f).find((x) => x.clave === clave)
  if (!d || !fila) return null
  const nombres = f.nombres?.[clave] ?? {}
  const maravillas = new Set(Object.entries(d.sitios ?? {}).filter(([, s]) => s?.maravilla).map(([id]) => id))
  return {
    ok: true,
    clave,
    nombre: fila.nombre,
    iso: fila.iso,
    estado: fila.estado,
    portada: f.portadas?.[clave] ?? null,
    numeros: { sitios: fila.sitios, medallas: fila.medallas, colecciones: fila.colecciones, emblemas: fila.emblemas, maravillas: fila.maravillas, dias_ruta: fila.dias_ruta },
    avisos: avisosDeDestino(f, clave),
    sellos: (d.sellos ?? []).map((s) => ({ id: s.id, nombre: s.nombre, grados: s.grados.map((g) => ({ grado: g.grado, desde: g.desde, nombre: g.nombre, linea: String(g.linea ?? '').replace('{n}', String(g.desde)).replace('{total}', String((d.colecciones ?? []).find((c) => c.id === s.coleccion)?.sitios.length ?? g.desde)) })) })),
    colecciones: (d.colecciones ?? []).map((c) => ({ id: c.id, nombre: c.nombre, frase: c.al_completar ?? '', sitios: c.sitios.map((id, i) => ({ id, nombre: nombres[id] ?? id, color: PALETA_DE_SITIOS[i % PALETA_DE_SITIOS.length] })) })),
    emblemas: (d.emblemas ?? []).map((e) => ({
      id: e.id,
      nombre: e.nombre,
      linea: e.linea ?? '',
      etiqueta: e.sitio && maravillas.has(e.sitio) ? 'MARAVILLA' : e.tipo === 'sitio' ? 'SECRETO' : null,
      se_gana_en: dondeSeGana(e, d, nombres, f.ajustes),
    })),
    patrimonios: Object.values(d.patrimonios ?? {}).map((p) => ({ nombre: p.nombre, sitios: (p.sitios ?? []).length, por_comprobar: (p.por_comprobar ?? []).length })),
  }
}

/* ───────────────────────── La pestaña «Logros»: números de la tabla `achievements` ───────────────────────── */

const distintos = (filas, cond) => new Set(filas.filter(cond).map((x) => x.user_id)).size
const esDePieza = (x) => x.logro === 'pedazo' || x.logro === 'viajero:probador'

/** El nombre legible de un logro ganado (para «El más ganado»). */
export function nombreDeLogro(datos, logro, escalon) {
  if (logro === 'sello') {
    const [id, grado] = String(escalon).split(':')
    for (const d of Object.values(datos.destinos ?? {})) for (const s of d.sellos ?? []) if (s.id === id) return s.grados.find((g) => g.grado === grado)?.nombre ?? `${s.nombre} · ${grado}`
  }
  if (logro === 'coleccion') for (const d of Object.values(datos.destinos ?? {})) { const c = (d.colecciones ?? []).find((x) => x.id === escalon); if (c) return c.nombre }
  if (logro === 'emblema') for (const d of Object.values(datos.destinos ?? {})) { const e = (d.emblemas ?? []).find((x) => x.id === escalon); if (e) return e.nombre }
  if (String(logro).startsWith('viajero:')) {
    const def = (datos.viajero?.logros ?? []).find((x) => x.id === String(logro).slice(8))
    if (def) return (def.escalones ?? []).find((e) => String(e.n) === String(escalon))?.nombre ?? def.nombre ?? def.id
  }
  return String(escalon ? `${logro} · ${escalon}` : logro).replace(/_/g, ' ')
}

/**
 * La pestaña «Logros». `filas`: las filas de `achievements` ({ user_id, destino, logro, escalon, ganado_en }); `desde`/`hasta`: ISO o null (todo). `cuentas`: cuántas cuentas reales hay (o null).
 * Solo salen números. Los emblemas se cuentan SIEMPRE desde el principio (los escondidos, para saber si alguien los ha encontrado alguna vez).
 */
export function resumenDeLogros({ filas, datos, destino, desde = null, hasta = null, cuentas = null }) {
  const t0 = desde ? Date.parse(desde) : -Infinity
  const t1 = hasta ? Date.parse(hasta) : Infinity
  const enPeriodo = filas.filter((x) => { const t = Date.parse(x.ganado_en); return t >= t0 && t <= t1 })
  const logros = enPeriodo.filter((x) => !esDePieza(x))
  const porLogro = new Map()
  for (const x of logros) {
    const k = `${x.logro}|${x.escalon}`
    if (!porLogro.has(k)) porLogro.set(k, { logro: x.logro, escalon: x.escalon, usuarios: new Set() })
    porLogro.get(k).usuarios.add(x.user_id)
  }
  const masGanado = [...porLogro.values()].sort((a, b) => b.usuarios.size - a.usuarios.size)[0] ?? null
  const clave = datos.destinos?.[destino] ? destino : Object.keys(datos.destinos ?? {})[0]
  const d = datos.destinos?.[clave]
  const deDestino = (x) => x.destino === clave
  const medallas = GRADOS.map((g) => ({ grado: g, nombre: NOMBRE_GRADO[g], personas: distintos(enPeriodo, (x) => x.logro === 'sello' && deDestino(x) && String(x.escalon).split(':')[1] === g) }))
  const colecciones = (d?.colecciones ?? []).map((c) => {
    const completadas = new Set(enPeriodo.filter((x) => x.logro === 'coleccion' && deDestino(x) && x.escalon === c.id).map((x) => x.user_id))
    const conPedazo = new Set(enPeriodo.filter((x) => x.logro === 'pedazo' && deDestino(x) && String(x.escalon).startsWith(`${c.id}:`)).map((x) => x.user_id))
    return { id: c.id, nombre: c.nombre, sitios: c.sitios.length, completadas: completadas.size, en_curso: [...conPedazo].filter((u) => !completadas.has(u)).length }
  })
  const emblemas = (d?.emblemas ?? []).map((e) => ({ id: e.id, nombre: e.nombre, personas: distintos(filas, (x) => x.logro === 'emblema' && deDestino(x) && x.escalon === e.id) }))
  // Logros de viajero (de todos los destinos): un renglón por escalón, con la gente que lo tiene.
  const viajero = []
  for (const def of datos.viajero?.logros ?? []) {
    const esc = def.escalones?.length ? def.escalones.map((e) => ({ k: String(e.n), nombre: e.nombre })) : [{ k: '', nombre: def.nombre ?? def.id }]
    for (const e of esc) viajero.push({ id: `${def.id}:${e.k}`, nombre: e.nombre, personas: distintos(enPeriodo, (x) => x.logro === `viajero:${def.id}` && String(x.escalon) === e.k) })
  }
  viajero.sort((a, b) => b.personas - a.personas)
  return {
    ok: true,
    destino: clave ?? null,
    destinos: Object.values(datos.destinos ?? {}).map((x) => ({ clave: x.clave, nombre: x.ciudad ?? x.destino })),
    logros_ganados: logros.length,
    personas: new Set(logros.map((x) => x.user_id)).size,
    cuentas,
    mas_ganado: masGanado ? { nombre: nombreDeLogro(datos, masGanado.logro, masGanado.escalon), personas: masGanado.usuarios.size } : null,
    medallas,
    colecciones,
    emblemas,
    viajero,
    sorteo: sorteoDeDatos(datos),
  }
}

/** El sorteo según `data/logros/exp.json › sorteo` (nada escrito a mano): premio (o null = «sin decidir»), destino, cierre y la regla. */
export function sorteoDeDatos(datos) {
  const s = datos.exp?.sorteo ?? {}
  const e = s.edicion ?? {}
  const premio = String(e.premio ?? '').trim()
  return {
    premio: premio || null,
    destino: e.destino ?? null,
    anio: num(e.anio),
    cierre: e.cierre ?? null,
    nivel_minimo: num(s.nivel_minimo),
    viajes_con_hoy_minimos: num(s.viajes_con_hoy_minimos),
  }
}

/** Un periodo («7d», «mes», «30d», «6m», «anio», «todo») → { desde, hasta } en ISO (o null = sin límite), a partir de «ahora». */
export function rangoDePeriodo(id, ahora = new Date()) {
  const fin = new Date(ahora)
  const dias = (n) => new Date(fin.getTime() - n * 864e5).toISOString()
  switch (id) {
    case '7d': return { desde: dias(7), hasta: null }
    case '30d': return { desde: dias(30), hasta: null }
    case 'mes': return { desde: new Date(Date.UTC(fin.getUTCFullYear(), fin.getUTCMonth(), 1)).toISOString(), hasta: null }
    case '6m': return { desde: new Date(Date.UTC(fin.getUTCFullYear(), fin.getUTCMonth() - 6, fin.getUTCDate())).toISOString(), hasta: null }
    case 'anio': return { desde: new Date(Date.UTC(fin.getUTCFullYear(), 0, 1)).toISOString(), hasta: null }
    default: return { desde: null, hasta: null }
  }
}
