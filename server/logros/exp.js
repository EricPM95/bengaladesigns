/**
 * LA EXPERIENCIA (EXP) Y LOS NIVELES (Tanda 8C1, docs/dias/EXP_Y_NIVELES.md). Funciones puras: nada de base de datos. Todo lo que se puede afinar está en data/logros/exp.json.
 *
 *   - La EXP sale de SUMAR lo que cada viajero ya ha conseguido (sus hechos y lo que le han dado los logros), con la tabla de exp.json.
 *   - Solo cuenta lo comprobado (con ubicación o con foto). Los viajes de antes de la app («¿Dónde has estado ya?») dan 0: no son hechos. Lo apagado (Versión 1) da 0.
 *   - Cada EXP lleva su fecha (para saber cuánta se ganó cada año: sorteo y tienda).
 *   - Nunca baja: `expFinal` se queda con el mayor entre lo calculado ahora y lo que ya tenía guardado (`exp_max`).
 *   - No toca el motor de rutas.
 */

import { diasEntre, hechosQueCuentan, logroActivo, parteLocal, sumarDias } from './motor.js'

/** Una fecha o instante (texto o Date) como texto ISO: la base de datos devuelve Date. */
const iso = (v) => (v instanceof Date ? v.toISOString() : String(v))
const entero = (n) => (Number.isFinite(Number(n)) ? Math.round(Number(n)) : 0)

/** El orden en que los amigos dan EXP: por el día en que completaron su viaje y, si es el mismo día, por quién fue invitado antes (y por su id, para que el orden nunca cambie). */
const ordenDeAmigos = (a, b) => new Date(a.viaje_acabado_en) - new Date(b.viaje_acabado_en) || (a.creado_en ? iso(a.creado_en) : '').localeCompare(b.creado_en ? iso(b.creado_en) : '') || String(a.invitado).localeCompare(String(b.invitado))


/** La EXP que da una cosa ganada (un pedazo, un sello, un logro de viajero…). 0 si no da o está apagada. `datos`: { destinos, viajero, exp }. */
export function expDeItem(datos, item) {
  const T = datos.exp
  const logro = item.logro
  if (!logroActivo(datos, logro)) return 0
  if (logro === 'pedazo') return T.pedazo
  if (logro === 'emblema') return T.emblema
  if (logro === 'maravilla') return T.maravilla
  if (logro === 'pais') return T.pais
  if (logro === 'destino_nuevo') return T.destino_nuevo
  if (logro === 'continente') return T.continente
  if (logro === 'patrimonio') return T.patrimonio
  if (logro === 'coleccion') {
    const col = datos.destinos[item.destino]?.colecciones?.find((c) => c.id === item.escalon)
    return col ? T.coleccion_por_pedazo * col.sitios.length : 0
  }
  if (logro === 'sello') {
    const [id, grado] = String(item.escalon).split(':')
    return T.sello[id]?.[grado] ?? T.sello.por_defecto[grado] ?? 0
  }
  if (logro.startsWith('viajero:')) {
    const valor = T.viajero[logro.slice('viajero:'.length)]
    if (valor == null) return 0
    if (typeof valor === 'object') return valor[String(item.escalon)] ?? 0
    return valor
  }
  return 0
}

/** La EXP de un momento (lo que sale en pantalla tras un Visto o una foto). Los pedazos se cuentan por sitio; las líneas de «suma» no dan nada por sí solas. */
export function expDeMomento(datos, m) {
  const T = datos.exp
  switch (m.tipo) {
    case 'suma':
      return T.pedazo * (Array.isArray(m.sitios) ? m.sitios.length : 1)
    case 'suma_sello':
      return 0
    case 'coleccion':
      return expDeItem(datos, { logro: 'coleccion', destino: m.destino, escalon: m.id })
    case 'emblema':
      return T.emblema
    case 'sello':
      return expDeItem(datos, { logro: 'sello', escalon: `${m.sello}:${m.grado}` })
    case 'pais':
      return T.pais
    case 'destino_nuevo':
      return T.destino_nuevo
    case 'continente':
      return expDeItem(datos, { logro: 'continente', escalon: m.continente })
    case 'maravilla':
      return T.maravilla
    case 'patrimonio':
      return T.patrimonio
    case 'viajero':
      return expDeItem(datos, { logro: `viajero:${m.logro}`, escalon: String(m.escalon ?? '') })
    default:
      return 0
  }
}

/**
 * Los viajes acabados con la app: los que tienen al menos `paradas_minimas` paradas vistas (con ubicación o foto) y cuyo último día ya pasó.
 * @returns {Array<{ trip_id, fin }>} (la `fin` es el último día del viaje, AAAA-MM-DD)
 */
export function viajesAcabados({ datos, hechos, viajes, ahora }) {
  const T = datos.exp.viaje_acabado
  const cuentan = hechosQueCuentan(hechos ?? [], viajes ?? {}, datos)
  const porViaje = new Map()
  for (const h of cuentan) {
    if (!h.evPieza) continue
    if (!porViaje.has(h.trip_id)) porViaje.set(h.trip_id, new Set())
    porViaje.get(h.trip_id).add(h.stop_id ?? h.sitio)
  }
  const salida = []
  for (const [trip, paradas] of porViaje) {
    const v = viajes?.[trip]
    if (!v || paradas.size < T.paradas_minimas) continue
    const tz = datos.destinos[v.destino]?.timezone ?? 'UTC'
    const hoy = parteLocal(ahora, tz)?.fecha
    if (hoy && hoy > v.fin) salida.push({ trip_id: trip, fin: v.fin })
  }
  return salida
}

/**
 * Todas las EXP ganadas, cada una con su fecha: [{ fecha, exp, tipo, clave }].
 * @param {object} e
 * @param {object} e.datos
 * @param {Map}    e.items      lo ganado (motor.calcular)
 * @param {Array}  e.hechos     los hechos de la persona
 * @param {object} e.viajes
 * @param {Date|string} e.ahora
 * @param {Array}  [e.referidos]  amigos invitados: [{ viaje_acabado_en: ISO|null }]
 */
export function entradasDeExp({ datos, items, hechos, viajes, ahora, referidos = [] }) {
  const T = datos.exp
  const entradas = []
  for (const it of items.values()) {
    const exp = expDeItem(datos, it)
    if (exp > 0) entradas.push({ fecha: iso(it.en).slice(0, 10), exp, tipo: it.logro, clave: it.clave })
  }
  // Paradas vistas: 5 cada una (una sola vez por parada), como mucho 50 al día.
  const cuentan = hechosQueCuentan(hechos ?? [], viajes ?? {}, datos)
  const vistas = new Set()
  const porDia = new Map()
  for (const h of cuentan) {
    if (!h.evPieza) continue
    const k = `${h.trip_id}|${h.stop_id ?? h.sitio}`
    if (vistas.has(k)) continue
    vistas.add(k)
    const dia = h.loc.fecha
    const ya = porDia.get(dia) ?? 0
    if (ya + T.paradas.por_parada > T.paradas.maximo_al_dia) continue
    porDia.set(dia, ya + T.paradas.por_parada)
    entradas.push({ fecha: dia, exp: T.paradas.por_parada, tipo: 'parada', clave: k })
  }
  // Viajes acabados.
  for (const v of viajesAcabados({ datos, hechos, viajes, ahora })) entradas.push({ fecha: v.fin, exp: T.viaje_acabado.exp, tipo: 'viaje_acabado', clave: v.trip_id })
  // Amigos invitados que acabaron su primer viaje (máximo `maximo_al_anio` por año).
  const porAnio = new Map()
  for (const r of [...referidos].filter((x) => x.viaje_acabado_en).sort(ordenDeAmigos)) {
    const anio = iso(r.viaje_acabado_en).slice(0, 4)
    const n = porAnio.get(anio) ?? 0
    if (n >= T.invitacion.maximo_al_anio) continue
    porAnio.set(anio, n + 1)
    entradas.push({ fecha: iso(r.viaje_acabado_en).slice(0, 10), exp: T.invitacion.exp, tipo: 'invitacion', clave: `invitacion|${r.invitado ?? n}` })
  }
  return entradas.sort((a, b) => a.fecha.localeCompare(b.fecha))
}

/** El total y cuánto se ganó cada año. */
export function calcularExp(e) {
  const entradas = entradasDeExp(e)
  const porAnio = {}
  let total = 0
  for (const x of entradas) {
    total += x.exp
    const anio = x.fecha.slice(0, 4)
    porAnio[anio] = (porAnio[anio] ?? 0) + x.exp
  }
  return { total, por_anio: porAnio, entradas }
}

/** Nunca baja: lo mayor entre lo calculado ahora y lo que ya tenía guardado. */
export const expFinal = (calculada, guardada) => Math.max(entero(calculada), entero(guardada))

/* ------------------------------------------------------------------ */
/* Los niveles                                                         */
/* ------------------------------------------------------------------ */

/** Lo que cuesta pasar del nivel `n` al siguiente: 500, 700, 900… hasta el nivel 11; desde ahí, fijo (2.500). */
export function costeDeNivel(n, tabla) {
  const c = tabla.niveles.coste
  return n < c.hasta_nivel ? c.primero + c.suma * (n - 1) : c.fijo
}

/** La EXP con la que se llega a un nivel (el 1 es 0). */
export function expDeNivel(nivel, tabla) {
  let suma = 0
  for (let n = 1; n < nivel; n++) suma += costeDeNivel(n, tabla)
  return suma
}

/**
 * El nivel, el rango y lo que falta, para una EXP.
 * @returns {{ exp, nivel, rango, rango_ix, estrellas_en_rango, exp_en_nivel, coste_nivel, falta, leyenda_estrellas, maximo }}
 *   - `nivel`: de 1 a 50 (se queda en 50 al llegar a Leyenda 50).
 *   - `estrellas_en_rango`: 1 a 5, la posición dentro de su rango (cada nivel añade una estrella a su marco).
 *   - `leyenda_estrellas`: desde el nivel 50, una estrella más cada 3.000 EXP, sin final (Leyenda ★1, ★2…).
 */
export function nivelDeExp(exp, tabla) {
  const N = tabla.niveles
  const total = Math.max(0, entero(exp))
  let nivel = 1
  let acumulado = 0
  while (nivel < N.maximo) {
    const coste = costeDeNivel(nivel, tabla)
    if (total < acumulado + coste) break
    acumulado += coste
    nivel++
  }
  const rango_ix = Math.floor((nivel - 1) / N.niveles_por_rango)
  const base = {
    exp: total,
    nivel,
    rango: N.rangos[Math.min(rango_ix, N.rangos.length - 1)],
    rango_ix,
    estrellas_en_rango: ((nivel - 1) % N.niveles_por_rango) + 1,
  }
  if (nivel >= N.maximo) {
    const sobre = total - acumulado
    const estrellas = Math.floor(sobre / N.estrella_cada)
    return { ...base, exp_en_nivel: sobre % N.estrella_cada, coste_nivel: N.estrella_cada, falta: N.estrella_cada - (sobre % N.estrella_cada), leyenda_estrellas: estrellas, maximo: true }
  }
  const coste = costeDeNivel(nivel, tabla)
  return { ...base, exp_en_nivel: total - acumulado, coste_nivel: coste, falta: acumulado + coste - total, leyenda_estrellas: 0, maximo: false }
}

/** Lo que se manda al móvil: EXP total, nivel, rango, EXP dentro del nivel y la que falta para el siguiente. */
export function resumenDeExp(exp, tabla) {
  const n = nivelDeExp(exp, tabla)
  return {
    exp: n.exp,
    nivel: n.nivel,
    rango: n.rango,
    rango_ix: n.rango_ix,
    estrellas: n.estrellas_en_rango,
    leyenda_estrellas: n.leyenda_estrellas,
    exp_en_nivel: n.exp_en_nivel,
    exp_para_siguiente: n.coste_nivel,
    falta: n.falta,
  }
}

/* ------------------------------------------------------------------ */
/* «Un viaje con HOY»: la regla que comparten las invitaciones y el sorteo (Tanda 10P) */
/* ------------------------------------------------------------------ */

/**
 * UNA SOLA FUNCIÓN para «este viaje cumple la mitad de los días con HOY» (la usan el amigo invitado, 1.5, y el sorteo, 1.6): se usó HOY al menos la mitad de los días del viaje,
 * redondeando hacia arriba (1 de 2, 2 de 3, 2 de 4, 3 de 5…). Usar HOY un día = al menos un Visto ese día. Un viaje de 0 días o con 0 días usados nunca cumple.
 */
export function cumpleMitadDeDias(diasDelViaje, diasConHoy) {
  const total = Math.floor(Number(diasDelViaje))
  const usados = Math.floor(Number(diasConHoy))
  if (!(total >= 1) || !(usados >= 1)) return false
  return usados >= Math.ceil(total / 2)
}

/**
 * Los viajes ACABADOS (su último día ya pasó, en la hora del destino) con los días en que se usó HOY (al menos un Visto comprobado ese día).
 * @returns {Array<{ trip_id, fin, dias, dias_con_hoy, cumple }>}  `cumple` = la mitad de los días o más (`cumpleMitadDeDias`).
 */
export function viajesConHoy({ datos, hechos, viajes, ahora }) {
  const cuentan = hechosQueCuentan(hechos ?? [], viajes ?? {}, datos)
  const dias = new Map()
  for (const h of cuentan) {
    if (h.tipo !== 'visto') continue
    if (!dias.has(h.trip_id)) dias.set(h.trip_id, new Set())
    dias.get(h.trip_id).add(h.loc.fecha)
  }
  const salida = []
  for (const [trip, v] of Object.entries(viajes ?? {})) {
    if (!v?.inicio || !v?.fin) continue
    const tz = datos.destinos[v.destino]?.timezone ?? 'UTC'
    const hoy = parteLocal(ahora, tz)?.fecha
    if (!hoy || hoy <= v.fin) continue
    const total = diasEntre(v.inicio, v.fin) + 1
    const usados = dias.get(trip)?.size ?? 0
    salida.push({ trip_id: trip, fin: v.fin, dias: total, dias_con_hoy: usados, cumple: cumpleMitadDeDias(total, usados) })
  }
  return salida.sort((a, b) => a.fin.localeCompare(b.fin))
}

/* ------------------------------------------------------------------ */
/* El sorteo y las invitaciones                                        */
/* ------------------------------------------------------------------ */

const diaDe = (v) => (v instanceof Date ? v.toISOString() : String(v)).slice(0, 10)

/** La edición del sorteo de un año: la de `exp.json › sorteo.edicion` o, para cualquier otro año, la genérica (sin destino, hasta que se ponga el dato). */
export function edicionDeAnio(tabla, anio) {
  const S = tabla.sorteo
  const n = Number(anio)
  if (n === Number(S.edicion.anio)) return { ...S.edicion, bases_url: S.edicion.bases_url ?? '', generica: false }
  return { anio: n, destino: S.siguiente.destino ?? null, premio: S.siguiente.premio, fechas: null, cierre: `${n}-${S.cierre_mes_dia}`, fecha_sorteo: null, bases_url: '', generica: true }
}

const ultimoDiaDelAnio = (anio) => new Date(Date.UTC(anio + 1, 0, 0)).toISOString().slice(0, 10)

/** La edición que está en marcha en esta fecha: la primera cuyo sorteo aún no ha pasado (sin fecha de sorteo, hasta el 31 de diciembre de su año). */
export function edicionVigente(tabla, hoy) {
  let anio = Number(tabla.sorteo.edicion.anio)
  for (let i = 0; i < 99; i++, anio++) {
    const e = edicionDeAnio(tabla, anio)
    if (hoy <= (e.fecha_sorteo ?? ultimoDiaDelAnio(anio))) return e
  }
  return edicionDeAnio(tabla, anio)
}

/** Los viajes que cuentan para una edición: acabados entre el cierre anterior (la primera edición, desde siempre) y el cierre de esta. */
export function ventanaDeViajes(tabla, edicion) {
  const S = tabla.sorteo
  const desde = Number(edicion.anio) > Number(S.primer_anio) ? sumarDias(`${Number(edicion.anio) - 1}-${S.cierre_mes_dia}`, 1) : null
  return { desde, hasta: edicion.cierre }
}

/**
 * ¿Entra esta persona en esa edición? Nivel mínimo (el conseguido hasta el cierre) y al menos un viaje acabado con HOY la mitad de los días, dentro de la ventana de esa edición.
 * @param {object} e
 * @param {Array}  e.entradas   cada EXP con su fecha (`calcularExp(...).entradas`)
 * @param {number} e.expActual  la EXP de ahora (la que nunca baja); solo vale mientras la edición está abierta
 * @param {Array}  e.viajes     `viajesConHoy(...)`
 * @param {string} e.hoy        AAAA-MM-DD
 */
export function entradaEnEdicion({ tabla, edicion, entradas, expActual, viajes, hoy }) {
  const S = tabla.sorteo
  const cerrada = hoy > edicion.cierre
  // Cerrada la edición, el nivel que cuenta es el que se había conseguido hasta el cierre.
  const exp = cerrada ? entradas.filter((x) => x.fecha <= edicion.cierre).reduce((s, x) => s + x.exp, 0) : entero(expActual)
  const nivel = nivelDeExp(exp, tabla).nivel
  const { desde, hasta } = ventanaDeViajes(tabla, edicion)
  const buenos = viajes.filter((v) => v.cumple && v.fin <= hasta && (!desde || v.fin >= desde))
  const nivel_ok = nivel >= S.nivel_minimo
  const viaje_ok = buenos.length >= S.viajes_con_hoy_minimos
  return { entra: nivel_ok && viaje_ok, nivel, exp, nivel_ok, viaje_ok, viajes_ok: buenos.length, cerrada }
}

/**
 * Lo que ve una persona en el billete del Perfil y en la página del sorteo: la edición, en cuál de sus tres estados está («sin_nivel», «falta_viaje», «dentro»), lo que le falta de EXP y sus dos condiciones.
 * Después del cierre y hasta el sorteo, quien está dentro sigue «dentro»; los demás pasan al billete del año siguiente (`para_el_siguiente`).
 */
export function estadoDelSorteo({ tabla, entradas, expActual, viajes, ahora }) {
  const hoy = diaDe(ahora instanceof Date ? ahora : new Date(ahora))
  const S = tabla.sorteo
  let edicion = edicionVigente(tabla, hoy)
  let r = entradaEnEdicion({ tabla, edicion, entradas, expActual, viajes, hoy })
  let paraElSiguiente = false
  if (r.cerrada && !r.entra) {
    edicion = edicionDeAnio(tabla, Number(edicion.anio) + 1)
    r = entradaEnEdicion({ tabla, edicion, entradas, expActual, viajes, hoy })
    paraElSiguiente = true
  }
  const expNivel = expDeNivel(S.nivel_minimo, tabla)
  const falta = Math.max(0, expNivel - r.exp)
  return {
    ok: true,
    estado: r.entra ? 'dentro' : r.nivel_ok ? 'falta_viaje' : 'sin_nivel',
    edicion: { anio: Number(edicion.anio), destino: edicion.destino ?? null, premio: edicion.premio, fechas: edicion.fechas ?? null, cierre: edicion.cierre, bases_url: edicion.bases_url ?? '', generica: Boolean(edicion.generica) },
    cerrado: hoy > edicion.cierre,
    para_el_siguiente: paraElSiguiente,
    nivel: r.nivel,
    nivel_minimo: S.nivel_minimo,
    exp: r.exp,
    exp_nivel_minimo: expNivel,
    falta_exp: falta,
    barra: expNivel > 0 ? Math.max(0, Math.min(1, r.exp / expNivel)) : 1,
    condiciones: [
      { id: 'nivel', ok: r.nivel_ok, falta_exp: falta },
      { id: 'viaje_con_hoy', ok: r.viaje_ok },
    ],
    viajes_con_hoy: r.viajes_ok,
  }
}

/** ¿Entra en el sorteo de ese año? Solo la regla, sin pantalla (la usa el panel de Eric con una edición de un año concreto). */
export function entraEnElSorteo({ entradas, expActual, viajes, ahora, anio, tabla }) {
  const hoy = diaDe(ahora instanceof Date ? ahora : new Date(ahora))
  const r = entradaEnEdicion({ tabla, edicion: edicionDeAnio(tabla, anio), entradas, expActual, viajes, hoy })
  return r
}

/** Cuántas invitaciones darían EXP en un año (el tope es `maximo_al_anio`). */
export function invitacionesQueCuentan(referidos, anio, tabla) {
  const n = referidos.filter((r) => r.viaje_acabado_en && iso(r.viaje_acabado_en).slice(0, 4) === String(anio)).length
  return Math.min(n, tabla.invitacion.maximo_al_anio)
}

/**
 * ¿Este amigo da EXP? De los amigos que ya completaron su primer viaje con HOY, los primeros `maximo_al_anio` de cada año (por fecha) la dan; los siguientes no (ni EXP ni aviso).
 * `referidos`: [{ invitado, viaje_acabado_en }] de quien invita, con el de este amigo ya marcado.
 */
export function invitacionDaExp(referidos, invitadoId, tabla) {
  const hechos = referidos.filter((r) => r.viaje_acabado_en).sort(ordenDeAmigos)
  const mio = hechos.find((r) => r.invitado === invitadoId)
  if (!mio) return false
  const anio = iso(mio.viaje_acabado_en).slice(0, 4)
  const antes = hechos.filter((r) => iso(r.viaje_acabado_en).slice(0, 4) === anio)
  return antes.findIndex((r) => r.invitado === invitadoId) < tabla.invitacion.maximo_al_anio
}
