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
const esAncla = (row) => row.tipo === 'tour' || row.hora_tipo === 'turno' || row.hora_tipo === 'reserva' || row.tipo === 'cena' || row.modo === 'atardecer' || row.fija === true
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
  const nuevoOrdenQuitar = () => {
    // 1) el colchón (el último primero), 2) el orden del día, 3) lo de camino y los paseos del final de la tarde.
    const candidatos = lista.map((row, i) => ({ row, i })).filter(({ row }) => !protegidas(row) && !esAncla(row) && row.tipo !== 'comida' && row.tipo !== 'noche' && row.tipo !== 'traslado')
    for (const clave of orden) {
      const hit = candidatos.find(({ row }) => row.lugar === clave || row.id === clave)
      if (hit) return hit
    }
    const colchon = candidatos.filter(({ row }) => row.colchon).at(-1)
    if (colchon) return colchon
    return null
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
    for (let j = fallo.i - 1; j >= 0 && falta > 0; j--) {
      const row = lista[j]
      if (!row.colchon) continue
      const libre = row.min - MARGENES.COLCHON_MINIMO
      if (libre <= 0) continue
      const quita = Math.min(libre, up5(falta))
      row.min -= quita
      falta -= quita
    }
    if (falta <= 0) continue
    // Quitar por el orden del día.
    const hit = nuevoOrdenQuitar()
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
  const indice = (clave) => lista.findIndex((row) => row.lugar === clave || row.id === clave || row.titulo === clave)
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
