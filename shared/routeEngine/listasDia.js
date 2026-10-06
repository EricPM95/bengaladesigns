/**
 * Motor de listas (Tanda 6): lo que cambia en un día escrito como lista de paradas por franjas (data/dias/<destino>/listas.json).
 *
 * Este módulo es puro y solo mueve LISTAS: parte la lista de un día en su forma de trabajo, le aplica las variantes del documento (un día de la semana, un
 * cierre, el Free Tour, una reserva a otra hora), el pool y las experiencias, siempre en el sitio que dice el documento. No mira relojes ni distancias.
 *
 * Forma de trabajo de un día: { manana: [Stop], comida: Mesa|null, tarde: [Stop], cena: Mesa|null, noche: Noche|null, empieza: 'HH:MM'|null }.
 */

export const norm = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
const clone = (value) => (value == null ? value : JSON.parse(JSON.stringify(value)))
export const toMin = (hhmm) => Number(String(hhmm).slice(0, 2)) * 60 + Number(String(hhmm).slice(3, 5))
export const toHHMM = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(Math.round(minutes % 60)).padStart(2, '0')}`

/** Una copia de la parte del día (la lista de verdad) lista para tocar. */
export function copiarParte(parte) {
  // (Qué franjas tiene esta parte del día: un medio día de tarde no tiene mañana, y lo que el documento cambia en la mañana no se aplica.)
  const franjas = { manana: (parte.manana ?? []).length > 0 || parte.comida != null, tarde: (parte.tarde ?? []).length > 0 || parte.cena != null }
  return { franjas, manana: clone(parte.manana ?? []), comida: clone(parte.comida ?? null), tarde: clone(parte.tarde ?? []), cena: clone(parte.cena ?? null), noche: clone(parte.noche ?? null), empieza: parte.empieza ?? null }
}

const coincide = (stop, nombre) => {
  if (stop.tipo === 'traslado') return false
  const [lugar, modo] = String(nombre).split('::')
  return (stop.lugar === lugar || stop.titulo === lugar) && (!modo || (stop.modo ?? 'parada') === modo)
}
/** El sitio de una parada en la lista; `nombre` puede ser una lista de nombres (el primero que esté). */
const buscar = (lista, nombre) => {
  for (const candidato of [].concat(nombre)) {
    const at = lista.findIndex((stop) => coincide(stop, candidato))
    if (at >= 0) return at
  }
  return -1
}

/**
 * Una operación sobre la lista de una franja (`manana` o `tarde`):
 *   paradas   → la franja entera es esta lista
 *   quitar    → [nombre] (lugar, título o «lugar::modo»)
 *   cambiar   → { nombre: Stop }
 *   mover     → { nombre: 'despues_de:otro' | 'antes_de:otro' }
 *   insertar  → [{ despues_de | antes_de | al_principio | al_final, parada: Stop | [Stop] }]
 *   ajustar   → { nombre: { campo: valor } }
 * El orden en que se aplican es ese. Nunca reordena por su cuenta: solo hace lo que dice.
 */
export function aplicarOp(lista, op) {
  let out = op.paradas ? clone(op.paradas) : lista
  for (const nombre of op.quitar ?? []) {
    const at = buscar(out, nombre)
    if (at >= 0) out = [...out.slice(0, at), ...out.slice(at + 1)]
  }
  for (const [nombre, stop] of Object.entries(op.cambiar ?? {})) {
    const at = buscar(out, nombre)
    if (at >= 0) out = [...out.slice(0, at), clone(stop), ...out.slice(at + 1)]
  }
  for (const [nombre, donde] of Object.entries(op.mover ?? {})) {
    const at = buscar(out, nombre)
    if (at < 0) continue
    const stop = out[at]
    const resto = [...out.slice(0, at), ...out.slice(at + 1)]
    const [tipo, ancla] = String(donde).split(':')
    const to = buscar(resto, ancla)
    if (to < 0) continue
    out = tipo === 'antes_de' ? [...resto.slice(0, to), stop, ...resto.slice(to)] : [...resto.slice(0, to + 1), stop, ...resto.slice(to + 1)]
  }
  for (const insert of op.insertar ?? []) {
    const paradas = Array.isArray(insert.parada) ? clone(insert.parada) : [clone(insert.parada)]
    // Un sitio no sale dos veces seguido en la misma lista (el mismo lugar con el mismo título y modo).
    const nuevas = paradas.filter((p) => !out.some((other) => other.lugar === p.lugar && (other.titulo ?? null) === (p.titulo ?? null) && (other.modo ?? null) === (p.modo ?? null)))
    if (nuevas.length === 0) continue
    const ancla = insert.despues_de ?? insert.antes_de ?? null
    const at = ancla ? buscar(out, ancla) : -1
    if (at < 0) out = insert.al_principio ? [...nuevas, ...out] : [...out, ...nuevas]
    else out = insert.antes_de ? [...out.slice(0, at), ...nuevas, ...out.slice(at)] : [...out.slice(0, at + 1), ...nuevas, ...out.slice(at + 1)]
  }
  for (const [nombre, patch] of Object.entries(op.ajustar ?? {})) {
    const at = buscar(out, nombre)
    if (at >= 0) out = [...out.slice(0, at), { ...out[at], ...clone(patch) }, ...out.slice(at + 1)]
  }
  return out
}

/** Las operaciones de un día entero: `manana` y `tarde` (listas), `comida`, `cena` y `noche` (se fusionan) y `empieza`. */
export function aplicarOps(trabajo, ops) {
  if (!ops) return trabajo
  const out = { ...trabajo }
  const tiene = (franja) => trabajo.franjas?.[franja] !== false
  if (ops.manana && tiene('manana')) out.manana = aplicarOp(out.manana, ops.manana)
  if (ops.tarde && tiene('tarde')) out.tarde = aplicarOp(out.tarde, ops.tarde)
  if (ops.comida === null) out.comida = null
  else if (ops.comida && tiene('manana')) out.comida = { ...(out.comida ?? {}), ...clone(ops.comida) }
  if (ops.cena === null) out.cena = null
  else if (ops.cena && tiene('tarde')) out.cena = { ...(out.cena ?? {}), ...clone(ops.cena) }
  if (ops.noche === null) out.noche = null
  else if (ops.noche) out.noche = { ...(out.noche ?? {}), ...clone(ops.noche) }
  if (ops.empieza) out.empieza = ops.empieza
  // Lo que el documento deja para «Si te sobra tiempo» en esta versión del día.
  if (ops.sobra) out.sobra = [...(out.sobra ?? []), ...clone(ops.sobra)]
  if (ops.quitar_cubierto_por_tour) out.quitar_cubierto_por_tour = true
  return out
}

/**
 * ¿Se cumple esta condición (`cuando`) en este día? Todas las claves a la vez. Claves:
 *   dia_semana [..]       el día de la semana (sin tildes)
 *   cerrado "Lugar"       ese lugar cierra ese día
 *   free_tour true|false  el viaje lleva o no el Free Tour de mañana
 *   free_tour_despues "manana"|"tarde"|"noche"   el Free Tour que el viajero añade para esa franja
 *   reserva { lugar, desde, hasta }   el viajero reservó ese lugar a una hora entre desde y hasta
 *   pool "Lugar" | [..]   marcado en el pool (todos)        sin_pool "Lugar" | [..]   ninguno marcado
 *   fechas "MM-DD..MM-DD"  el día cae en esas fechas
 *   viaje_lleva [ids]      el viaje lleva alguno de esos días     viaje_sin [ids]   no lleva ninguno
 *   experiencia "id"       el viajero eligió esa experiencia
 *   parte "manana"|"tarde"  la parte del día (medios días)
 *   mes [1..12]
 */
export function cumple(cuando, ctx) {
  if (!cuando) return true
  // Una lista de condiciones: vale si se cumple alguna.
  if (Array.isArray(cuando)) return cuando.some((alguna) => cumple(alguna, ctx))
  for (const [clave, valor] of Object.entries(cuando)) {
    if (clave === 'dia_semana') {
      if (!ctx.weekday || !valor.map(norm).includes(norm(ctx.weekday))) return false
    } else if (clave === 'cerrado') {
      if (!ctx.cerrado(valor)) return false
    } else if (clave === 'free_tour') {
      if (Boolean(valor) !== Boolean(ctx.hasFreeTour)) return false
    } else if (clave === 'free_tour_despues') {
      if (ctx.freeTourFranja !== valor) return false
    } else if (clave === 'reserva') {
      const hora = ctx.entradas?.[valor.lugar]
      if (hora == null) return false
      const m = toMin(hora)
      if (valor.desde && m < toMin(valor.desde)) return false
      if (valor.hasta && m > toMin(valor.hasta)) return false
    } else if (clave === 'pool') {
      if (![].concat(valor).every((name) => ctx.poolNames.includes(name))) return false
    } else if (clave === 'sin_pool') {
      if ([].concat(valor).some((name) => ctx.poolNames.includes(name))) return false
    } else if (clave === 'fechas') {
      if (!ctx.dateIso || !ctx.enFechas(valor, ctx.dateIso)) return false
    } else if (clave === 'viaje_lleva') {
      if (!valor.some((id) => ctx.orden.includes(id))) return false
    } else if (clave === 'viaje_sin') {
      if (valor.some((id) => ctx.orden.includes(id))) return false
    } else if (clave === 'experiencia') {
      if (!ctx.experiencias.includes(valor)) return false
    } else if (clave === 'parte') {
      if (ctx.parte !== valor) return false
    } else if (clave === 'mes') {
      if (!ctx.month || !valor.includes(ctx.month)) return false
    }
  }
  return true
}

/** Las variantes del día, en el orden del documento, las que valen hoy. Cada una trae `ops` y se anota en `aplicadas` por su `id`. */
export function aplicarVariantes(trabajo, dia, ctx, aplicadas) {
  let out = trabajo
  for (const variante of dia.variantes ?? []) {
    if (!cumple(variante.cuando, ctx)) continue
    out = aplicarOps(out, variante.ops)
    aplicadas.push(variante.id)
  }
  return out
}

/** Las experiencias elegidas, cada una con lo que el documento dice para este día (si lo dice y vale hoy). */
export function aplicarExperiencias(trabajo, dia, ctx, aplicadas) {
  let out = trabajo
  for (const id of ctx.experiencias) {
    const def = dia.experiencias?.[id]
    if (!def || !cumple(def.cuando, ctx)) continue
    out = aplicarOps(out, def.ops)
    aplicadas.push(`experiencia:${id}`)
  }
  return out
}
