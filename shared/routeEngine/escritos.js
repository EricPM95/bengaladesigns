/**
 * Los días escritos (docs/dias/DIAS_ESCRITOS_ROMA.md): el documento manda. Cada día es una lista de filas con su hora, sus minutos y su
 * «cómo»; el motor solo ajusta lo que el documento dice en «Lo que hará el motor» y lo hace con la regla de márgenes.
 *
 * Este fichero es puro (sin Node): elige la tabla del día, aplica el pool y las experiencias escritos, cierra lo que cierra
 * (adelantar) y corre las horas con los márgenes. Convertir las filas en paradas, comidas y nocturnas lo hace writtenTrip.js.
 */

export const toMin = (hhmm) => Number(String(hhmm).slice(0, 2)) * 60 + Number(String(hhmm).slice(3, 5))
export const toHHMM = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
const up5 = (minutes) => Math.ceil(minutes / 5) * 5
const near5 = (minutes) => Math.round(minutes / 5) * 5

/** Los márgenes del documento (valen solo para los días escritos). */
export const MARGENES = {
  ANDAR_MAS: 10,
  ANDAR_MAS_LARGO: 15,
  MINIMO: 10,
  TURNO_ANTES: 15,
  RESERVA_ANTES: 30,
  BUS_ANTES: 15,
  TAXI_TRAS_CENA: 10,
  TRAS_TRASLADO: 15,
  COLCHON_MINIMO: 10,
}

export const finDe = (row) => toMin(row.hora) + row.min
const esAncla = (row) => row.tipo === 'tour' || row.hora_tipo === 'turno' || row.hora_tipo === 'reserva' || (row.tipo === 'cena' && !row.flujo) || row.fija === true
const llevaMargenLargo = (row) => row.guia === true || row.tipo === 'tour'

/** Cuánto antes de su hora hay que llegar a una fila anclada. */
export function antesDeLlegar(row) {
  if (row.hora_tipo === 'reserva') return MARGENES.RESERVA_ANTES
  if (row.hora_tipo === 'turno' || row.tipo === 'tour') return MARGENES.TURNO_ANTES
  return 0
}

/**
 * El tiempo entre el final de una fila y el principio de la siguiente, por la regla de márgenes.
 * @param {(a: object, b: object) => number} walk  minutos andando entre dos filas
 * @param {(a: object, b: object) => number} taxi  minutos de un taxi entre dos filas
 */
export function hueco(prev, next, walk) {
  if (next.tipo === 'traslado') return prev.tipo === 'cena' ? MARGENES.TAXI_TRAS_CENA : MARGENES.BUS_ANTES
  if (prev.tipo === 'traslado') return MARGENES.TRAS_TRASLADO
  const andar = walk(prev, next)
  // «De camino»: solo lo que se anda.
  if (next.modo === 'camino') return near5(andar)
  const mas = llevaMargenLargo(prev) ? MARGENES.ANDAR_MAS_LARGO : MARGENES.ANDAR_MAS
  return Math.max(MARGENES.MINIMO, up5(andar + mas))
}

/**
 * Corre las horas de `rows` desde la fila `desde` con los márgenes. Las filas ancladas (turno, reserva, Free Tour, cena, atardecer)
 * conservan su hora; si no se llega a una, primero se acorta el colchón de antes (hasta COLCHON_MINIMO), luego se quita por el orden
 * del día (`orden`, de lo primero que se quita a lo último) y, si aun así no cabe, se avisa en `problemas`.
 * @returns {{ rows: object[], quitadas: object[], problemas: string[] }}
 */
export function correrHoras(rows, { desde = 1, walk, orden = [], protegidas = () => false }) {
  let lista = rows.map((row) => ({ ...row }))
  const quitadas = []
  const problemas = []
  const nuevoOrdenQuitar = (hasta = Infinity) => {
    // 1) el colchón (el último primero), 2) el orden del día, 3) lo de camino y los paseos del final de la tarde.
    const candidatos = lista.map((row, i) => ({ row, i })).filter(({ row, i }) => i >= desde && i < hasta && !protegidas(row) && !esAncla(row) && row.tipo !== 'comida' && row.tipo !== 'noche' && row.tipo !== 'traslado')
    for (const clave of orden) {
      const hit = candidatos.find(({ row }) => row.lugar === clave || row.id === clave)
      if (hit) return hit
    }
    // Sin orden escrito: primero el colchón, luego lo de camino, los paseos y lo que va por fuera; siempre lo último del día primero. Nunca lo que va por dentro.
    const rango = (row) => (row.colchon ? 0 : row.modo === 'camino' ? 1 : row.tipo === 'paseo' || row.tipo === 'desayuno' ? 2 : row.modo === 'fuera' ? 3 : row.modo === 'dentro' ? 9 : 4)
    const elegidos = candidatos.filter(({ row }) => rango(row) < 9).sort((x, y) => rango(x.row) - rango(y.row) || y.i - x.i)
    return elegidos[0] ?? null
  }
  for (let guard = 0; guard < 40; guard++) {
    let fallo = null
    for (let i = Math.max(1, desde); i < lista.length; i++) {
      const prev = lista[i - 1]
      const row = lista[i]
      const llegada = finDe(prev) + hueco(prev, row, walk)
      if (esAncla(row) && row.tipo !== 'traslado') {
        const limite = toMin(row.hora) - antesDeLlegar(row)
        if (llegada > limite) {
          fallo = { i, deficit: llegada - limite }
          break
        }
        continue
      }
      row.hora = toHHMM(llegada)
    }
    if (!fallo) return { rows: lista, quitadas, problemas }
    // Acortar el colchón de antes (el más cercano primero).
    let falta = fallo.deficit
    const desdeAtras = Math.max(0, desde - 1)
    for (let j = fallo.i - 1; j >= desdeAtras && falta > 0; j--) {
      const row = lista[j]
      if (!row.colchon) continue
      const libre = row.min - MARGENES.COLCHON_MINIMO
      if (libre <= 0) continue
      const quita = Math.min(libre, up5(falta))
      row.min -= quita
      falta -= quita
    }
    // La comida de antes, más corta (hasta 45 min), antes que perder una visita.
    for (let j = fallo.i - 1; j >= desdeAtras && falta > 0; j--) {
      const row = lista[j]
      if (row.tipo !== 'comida' || row.rapida || row.min <= 45) continue
      const quita = Math.min(row.min - 45, up5(falta))
      row.min -= quita
      falta -= quita
    }
    if (falta <= 0) continue
    // Quitar por el orden del día.
    const hit = nuevoOrdenQuitar(fallo.i)
    if (!hit || hit.i >= fallo.i) {
      problemas.push(`no_cabe:${lista[fallo.i].lugar ?? lista[fallo.i].id}`)
      // Se deja la hora escrita de la fila anclada: llegará tarde y la prueba lo marca.
      return { rows: lista, quitadas, problemas }
    }
    quitadas.push(hit.row)
    lista = lista.filter((_, k) => k !== hit.i)
  }
  problemas.push('no_converge')
  return { rows: lista, quitadas, problemas }
}

/** Letra de la tarde → clave de la tabla del día (A y B pueden compartir tabla, C y D también). */
export function claveLetra(tablas, letra) {
  if (tablas[letra]) return letra
  const compuesta = Object.keys(tablas).find((key) => key.length > 1 && key.includes(letra) && /^[A-D]+$/.test(key))
  if (compuesta) return compuesta
  return tablas.unica ? 'unica' : Object.keys(tablas)[0]
}

/**
 * Qué tabla del día toca.
 * @param {object} day  el fichero del día (formato escrito)
 * @param {object} ctx  { letra, weekday, reservas: { lugar: 'HH:MM' }, freeTourHora, franja, llegada, mediaJornada }
 * @returns {{ version: string, clave: string, rows: object[], etiquetas: string[], notas: string[] }}
 */
export function elegirTabla(day, ctx) {
  const v = day.versiones
  const notas = []
  const pick = (grupo, etiqueta) => {
    const tablas = v[grupo]
    const clave = claveLetra(tablas, ctx.letra ?? 'A')
    return { version: grupo, clave, rows: tablas[clave].map((row) => ({ ...row })), etiquetas: [etiqueta ?? grupo, clave], notas }
  }
  const weekday = String(ctx.weekday ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const reserva = (lugar) => (ctx.reservas?.[lugar] ? toMin(ctx.reservas[lugar]) : null)
  switch (day.id) {
    case 'D0': {
      const coliseo = reserva('Coliseo')
      if (coliseo != null && coliseo < 13 * 60) return pick('reves', 'ruta_del_reves')
      if (coliseo != null || reserva('Museos Vaticanos y Capilla Sixtina') != null) notas.push('reserva_por_la_tarde_sin_tabla')
      return pick('normal', 'ruta_normal')
    }
    case 'D0-medio': {
      if (ctx.franja === 'tarde') {
        const llegada = ctx.llegada ? toMin(ctx.llegada) : 12 * 60
        if (weekday === 'domingo' || llegada >= 13 * 60) return pick('tarde_sin_museos')
        return pick('tarde_con_museos')
      }
      if (weekday === 'miercoles') return pick('miercoles_manana')
      if (weekday === 'domingo') return pick('domingo_manana')
      return pick('manana')
    }
    case 'D1': {
      if (ctx.freeTourHora != null) return pick(toMin(ctx.freeTourHora) >= 18 * 60 ? 'free_tour_noche' : 'free_tour_tarde')
      return pick('normal')
    }
    case 'D2': {
      const museos = reserva('Museos Vaticanos y Capilla Sixtina')
      if (museos != null) {
        if (museos >= 14 * 60) return pick('reserva_14_16')
        if (museos >= 13 * 60) return pick('reserva_13')
        if (museos >= 10 * 60 + 30) return pick('reserva_10_12')
        notas.push('reserva_de_manana_corre_el_dia')
      }
      if (weekday === 'miercoles') return pick('miercoles')
      if (weekday === 'domingo') return pick('domingo')
      return pick('normal')
    }
    case 'D3':
      return pick(weekday === 'domingo' ? 'domingo' : 'normal')
    case 'D1-FT':
      return pick('normal')
    default:
      return pick(Object.keys(v)[0])
  }
}

/** Una fila nueva (de una acción del pool o de una experiencia) con sus campos mínimos. */
export const nuevaFila = (campos) => ({ id: campos.id ?? `${campos.tipo ?? 'parada'}_${campos.lugar ?? campos.titulo ?? 'x'}`, hora: '00:00', min: 15, tipo: 'parada', modo: null, ...campos })

/**
 * Aplica una lista de acciones del documento a las filas. Acciones:
 *   { op: 'cambiar', fila, min?, modo?, titulo? }          cambia una fila (por lugar o id)
 *   { op: 'quitar', fila }                                  quita una fila
 *   { op: 'insertar', despues|antes, fila: {...} }           mete una fila nueva
 *   { op: 'fuera_si_tarde', fila, desde }                    pasa a «por fuera» si empieza a partir de esa hora
 * Devuelve las filas y la posición de la primera fila tocada (desde ahí se corren las horas).
 */
export function aplicarAcciones(rows, acciones, { walk, taxiMin } = {}) {
  let lista = rows.map((row) => ({ ...row }))
  let primera = lista.length
  const indice = (clave) => (String(clave).startsWith('tipo:') ? lista.findIndex((row) => row.tipo === String(clave).slice(5)) : lista.findIndex((row) => row.lugar === clave || row.id === clave || row.titulo === clave))
  for (const accion of acciones) {
    if (accion.op === 'cambiar') {
      const i = indice(accion.fila)
      if (i < 0) continue
      const { op, fila, ...cambios } = accion
      lista[i] = { ...lista[i], ...cambios }
      primera = Math.min(primera, i)
    } else if (accion.op === 'quitar') {
      const claves = Array.isArray(accion.fila) ? accion.fila : [accion.fila]
      for (const clave of claves) {
        const i = indice(clave)
        if (i < 0) continue
        lista.splice(i, 1)
        primera = Math.min(primera, i)
      }
    } else if (accion.op === 'reemplazar_tarde') {
      // Todo lo que va después de la comida se sustituye por estas filas.
      const iComida = lista.findIndex((row) => row.tipo === 'comida')
      if (iComida < 0) continue
      lista.splice(iComida + 1, lista.length, ...accion.filas.map((fila) => nuevaFila(fila)))
      primera = Math.min(primera, iComida + 1)
    } else if (accion.op === 'insertar') {
      const filas = (Array.isArray(accion.fila) ? accion.fila : [accion.fila]).map((fila) => nuevaFila(fila))
      let i = accion.despues != null ? indice(accion.despues) + 1 : accion.antes != null ? indice(accion.antes) : lista.length
      if (i < 0) i = lista.length
      lista.splice(i, 0, ...filas)
      primera = Math.min(primera, i)
    }
  }
  return { rows: lista, primera: Math.max(1, primera) }
}

/**
 * Adelantar (regla de cierres): una fila por dentro que cae cerrada a su hora se mueve hacia delante en el día, de una en una, hasta el primer
 * sitio donde está abierta. Solo cruza filas que no son anclas ni comidas. Devuelve las filas (con las horas corridas) o null si no se puede.
 */
export function adelantar(rows, i, { walk, abierta, orden = [] }) {
  const fila = rows[i]
  for (let destino = i - 1; destino >= 1; destino--) {
    const cruzada = rows[destino]
    if (esAncla(cruzada) || cruzada.tipo === 'comida' || cruzada.tipo === 'traslado' || cruzada.tipo === 'noche') break
    const prueba = rows.filter((_, k) => k !== i)
    prueba.splice(destino, 0, { ...fila })
    const { rows: corridas } = correrHoras(prueba, { desde: destino, walk, orden })
    const movida = corridas.find((r) => r.id === fila.id)
    if (movida && abierta(movida, toMin(movida.hora))) return corridas
  }
  return null
}

/** Los taxis escritos «auto» tardan lo que dice el motor entre la fila de antes y la de después (andando / 2,5 + 5, nunca menos de 10). */
export function resolverTaxis(rows, walk) {
  return rows.map((row, i) => {
    if (row.tipo !== 'traslado' || row.traslado?.min !== 'auto') return row
    const antes = rows.slice(0, i).reverse().find((other) => other.tipo !== 'traslado')
    const despues = rows.slice(i + 1).find((other) => other.tipo !== 'traslado')
    const andar = antes && despues ? walk(antes, despues) : 20
    const min = Math.max(10, Math.round(andar / 2.5) + 5)
    return { ...row, min, traslado: { ...row.traslado, min } }
  })
}

/**
 * El mirador «al atardecer»: el motor lo ajusta, y el colchón de antes, para llegar con el sol, sin esperar nunca más de 30 min.
 * Llegar antes: si el sol tarda 30 min o menos, espera; si tarda más, va cuando llega. Llegar tarde: se acorta el colchón de antes.
 */
export function ajustarAtardecer(rows, { sunset, walk, lead = 25, maxEspera = 30 }) {
  if (sunset == null) return rows
  const k = rows.findIndex((row) => row.modo === 'atardecer' && row.tipo === 'parada')
  if (k < 1) return rows
  const target = sunset - lead
  const llegada = toMin(rows[k].hora)
  const lista = rows.map((row) => ({ ...row }))
  if (llegada < target) {
    if (target - llegada > maxEspera) return rows
    lista[k].hora = toHHMM(target)
    return correrHoras(lista, { desde: k + 1, walk }).rows
  }
  if (llegada > target + 5) {
    let falta = llegada - target
    let primera = k
    const iComida = lista.findIndex((row) => row.tipo === 'comida')
    for (let j = k - 1; j > Math.max(0, iComida) && falta > 0; j--) {
      if (!lista[j].colchon) continue
      const libre = lista[j].min - MARGENES.COLCHON_MINIMO
      if (libre <= 0) continue
      const quita = Math.min(libre, falta)
      lista[j].min -= quita
      falta -= quita
      primera = Math.min(primera, j + 1)
    }
    const movido = llegada - target - falta
    if (movido <= 0) return rows
    lista[k].hora = toHHMM(llegada - movido)
    return correrHoras(lista, { desde: primera, walk }).rows
  }
  return rows
}

/** Cuándo vale un pool o una experiencia: los días del viaje y las fechas. */
export function vale(def, { ids = [], dateIso = null } = {}) {
  if (def.cuando?.sin_dias?.some((id) => ids.includes(id))) return false
  if (def.fechas && dateIso) {
    const md = dateIso.slice(5)
    const { desde, hasta } = def.fechas
    const dentro = desde <= hasta ? md >= desde && md <= hasta : md >= desde || md <= hasta
    if (!dentro) return false
  }
  if (def.fechas && !dateIso) return false
  return true
}

/**
 * Aplica un extra del pool o una experiencia a las filas del día. Devuelve { rows, quitadas } o null si no cabe (entonces el extra va a «No incluido»).
 */
export function aplicarExtra(rows, def, { walk, abierta }) {
  const aplicadas = aplicarAcciones(rows, def.acciones ?? [], { walk })
  let lista = resolverTaxis(aplicadas.rows, walk)
  const corrida = correrHoras(lista, { desde: aplicadas.primera, walk, protegidas: (row) => row.hora_tipo === 'reserva' })
  if (corrida.problemas.length > 0) return null
  lista = corrida.rows
  // Acciones que se hacen cuando ya están las horas.
  let desdeDespues = null
  for (const accion of def.despues ?? []) {
    if (accion.op === 'fuera_si_tarde') {
      const i = lista.findIndex((row) => row.lugar === accion.fila)
      if (i >= 0 && toMin(lista[i].hora) >= toMin(accion.desde)) {
        lista[i] = { ...lista[i], modo: 'fuera' }
        desdeDespues = Math.min(desdeDespues ?? i, i)
      }
    }
  }
  if (desdeDespues != null) lista = correrHoras(lista, { desde: desdeDespues + 1, walk }).rows
  return { rows: lista, quitadas: corrida.quitadas }
}

/** Medio día de mañana: acaba a la hora de salida (por defecto las 15:00); lo que no quepa se quita del final. */
export function recortarSalida(rows, salida = '15:00') {
  const limite = toMin(salida)
  const lista = rows.map((row) => ({ ...row }))
  while (lista.length > 1 && finDe(lista.at(-1)) > limite) lista.pop()
  return lista
}
