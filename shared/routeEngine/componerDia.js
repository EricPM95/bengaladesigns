/**
 * Las horas de un día escrito se calculan UNA SOLA VEZ, al final (Tanda 4).
 *
 * Antes cada ajuste (el Free Tour, el atardecer, los cierres, el pool, las distancias, la comida…) movía horas por su cuenta y el último no recalculaba lo que dependía de él:
 * salían huecos de horas, una parada fuera de su luz, un registro que decía una hora y la pantalla otra. Ahora los ajustes deciden QUÉ paradas van y QUÉ horas son fijas
 * (una reserva, un turno, el atardecer, la cena); este módulo, después de todos ellos, saca las horas de todo el día desde esa lista:
 *
 *   · el margen antes de una reserva o un turno es una parada propia: «Llegada a {sitio}», con su motivo;
 *   · el día se parte en tramos entre dos horas fijas (una reserva, un turno, el atardecer, la cena); cada tramo se resuelve entero, una sola vez:
 *       – si sobra tiempo (más de 15 min), se llena con nombre: la comida de justo antes (hasta 75 min), el colchón de esa zona (hasta 2 horas) o un colchón nuevo de esa zona;
 *       – si falta, se acorta el colchón (sin bajar de 30 min), la comida (hasta 45) y, si no basta, se quita por la pirámide;
 *       – lo que no tiene hora fija, tras un hueco, se corre hacia antes;
 *   · el atardecer llega con el sol (sol − 25 min): lo que va antes se ajusta; si el sol tarda más de 2 horas de colchón, el turno movible (la Galería) se retrasa de 30 en 30 min;
 *   · la cena sigue al mirador (se mueve lo mismo que él) y, si ya no es la hora del documento, va a en punto o a y media.
 *
 * Es puro (sin Node): recibe las filas y un entorno con lo que depende del destino (andar, la luz, las aperturas, los colchones de cada zona).
 */
import { toMin, toHHMM, hueco, finDe, correrHoras, CENA_MAXIMA, MARGENES, antesDeLlegar } from './escritos.js'

const up5 = (m) => Math.ceil(m / 5) * 5
const down5 = (m) => Math.floor(m / 5) * 5
const near5 = (m) => Math.round(m / 5) * 5
/** Un hueco de más de esto, sin nombre, es un fallo. */
export const HUECO_MAXIMO = 15
export const COLCHON_MAXIMO = 120
export const COMIDA_MAXIMA = 75
export const COMIDA_MINIMA = 45
/** Lo que se tolera que llegue tarde el mirador del atardecer (el sol menos 25 min): pasado esto se quita por la pirámide lo que no cabe. */
const TARDE_SOLAR = 10
const LUNCH_EARLIEST = 12 * 60 + 30

/** Lo menos que puede durar un colchón: no baja de 30 min; si ya dura menos, no se toca (decisión del usuario, Tanda 4). */
export const colchonMinimo = (row) => row.colchon_minimo ?? Math.min(row.min, 30)

export const esFija = (row) => row.hora_tipo === 'reserva' || row.hora_tipo === 'turno' || row.tipo === 'tour' || row.fija === true
const esSolar = (row) => row.tipo === 'parada' && (row.modo === 'atardecer' || row.atardecer === true)
const idDe = (texto) => String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
const nombreDe = (row) => row.titulo ?? row.lugar ?? row.restaurante ?? row.noche ?? row.id

/**
 * @param {object[]} rows  las filas del día, con la hora del documento (o la que le dejó un ajuste) como hora preferida
 * @param {object} env
 *   walk(a, b) minutos andando; sunset (min) o null; lead (min antes del sol, 25); cenaDesde (min); mesaDesde(row) mínimo de hora de una comida o cena según el restaurante;
 *   abierta(row, inicio, min) ¿está abierto?; colchonZona(row) → una fila de colchón de la zona de esa fila (o null); llegada(row) → { min, titulo, texto } o null;
 *   orden (lo que se quita primero); turnoMovible(row) ¿se puede retrasar su turno?; nocheValida(row) ¿cabe esa nocturna en la hora límite de la noche?
 * @returns {{ rows: object[], causas: Map<string, string[]>, nuevas: string[], quitadas: object[], avisos: string[], problemas: string[] }}
 */
export function componerDia(rows0, env) {
  let retrasos = new Map() // turno movible → minutos que se retrasa
  for (let intento = 0; intento < 4; intento++) {
    const r = componer(rows0, env, retrasos)
    if (!r.turnoPorMover) return r
    retrasos = new Map(retrasos)
    retrasos.set(r.turnoPorMover.id, (retrasos.get(r.turnoPorMover.id) ?? 0) + r.turnoPorMover.minutos)
  }
  return componer(rows0, env, retrasos)
}

function componer(rows0, env, retrasos) {
  const walk = env.walk
  const lead = env.lead ?? 25
  const causas = new Map()
  const nuevas = []
  const quitadas = []
  const avisos = []
  const problemas = []
  let turnoPorMover = null
  const nota = (row, causa) => {
    if (!row?.id) return
    const lista = causas.get(row.id) ?? []
    if (!lista.includes(causa)) lista.push(causa)
    causas.set(row.id, lista)
  }
  let rows = rows0.map((row) => ({ ...row, hora_doc: row.hora_doc ?? row.hora, min_doc: row.min_doc ?? row.min }))
  // El turno que se retrasó (de 30 en 30 min, para llegar al atardecer con un colchón de 2 horas como mucho).
  for (const row of rows) {
    const mas = retrasos.get(row.id)
    if (mas) {
      row.hora = toHHMM(toMin(row.hora) + mas)
      nota(row, `el turno se retrasa ${mas} min: el colchón de antes del atardecer pasaría de 2 horas`)
    }
  }

  // 0. El margen antes de una reserva o un turno es una parada: «Llegada a {sitio}».
  {
    const lista = []
    for (const row of rows) {
      const llega = esFija(row) && row.tipo === 'parada' && !row.llegada ? env.llegada?.(row) : null
      const yaTiene = lista.at(-1)?.llegada === true && lista.at(-1).lugar === row.lugar
      if (llega && !yaTiene) {
        const hora = toHHMM(toMin(row.hora) - llega.min)
        const fila = { id: `llegada_${idDe(row.lugar)}`, tipo: 'parada', lugar: row.lugar, titulo: llega.titulo, texto: llega.texto, modo: 'fuera', min_fuera: llega.min, min: llega.min, hora, llegada: true, hora_doc: hora, min_doc: llega.min, nivel: row.nivel, como_documento: '', texto_documento: llega.titulo }
        lista.push(fila)
        nuevas.push(fila.id)
        nota(fila, `margen antes de ${row.hora_tipo === 'reserva' ? 'la reserva' : 'el turno'} de ${row.lugar}: llegada con tiempo`)
      }
      lista.push(row)
    }
    rows = lista
  }

  const suelo = (row) => {
    if (row.tipo === 'comida') return Math.max(LUNCH_EARLIEST, env.mesaDesde?.(row) ?? 0)
    if (row.tipo === 'cena') return Math.max(env.cenaDesde ?? 0, env.mesaDesde?.(row) ?? 0)
    return 0
  }
  const solarIdx = env.sunset != null ? rows.findIndex(esSolar) : -1
  const solarId = solarIdx >= 0 ? rows[solarIdx].id : null
  const esPunto = (row) => esFija(row) || row.llegada === true || row.tipo === 'cena' || row.id === solarId
  const llegadaA = (prev, row) => up5(finDe(prev) + hueco(prev, row, walk))

  /** Pone las filas de un tramo una tras otra: la hora preferida si cabe y no queda un hueco de más de 15 min; si queda, hacia antes (no antes de que abra). */
  const colocar = (inner, Fa) => {
    const colocadas = []
    let prev = Fa
    for (const original of inner) {
      const row = { ...original }
      const pref = toMin(row.hora)
      const primera = !prev
      const mas_pronto = primera ? pref : llegadaA(prev, row)
      let inicio
      if (primera) inicio = pref
      else if (pref >= mas_pronto) inicio = pref - mas_pronto > HUECO_MAXIMO ? mas_pronto : pref
      else inicio = mas_pronto
      inicio = Math.max(inicio, suelo(row))
      // (Tirado hacia antes, no antes de que abra: si a ese inicio está cerrado, se vuelve a la hora preferida.)
      if (inicio < pref && env.abierta && !env.abierta(row, inicio, row.min)) inicio = Math.max(pref, mas_pronto)
      if (inicio < pref && inicio !== toMin(row.hora)) nota(row, 'se corre hacia antes: quedaba un hueco sin nada')
      else if (!primera && inicio > pref && inicio === mas_pronto) nota(row, `los márgenes: lo andado desde ${nombreDe(prev)} más 10 min`)
      else if (inicio > pref && inicio === suelo(row)) nota(row, 'la hora a la que abre ese restaurante o empieza a servirse esa comida')
      row.hora = toHHMM(inicio)
      colocadas.push(row)
      prev = row
    }
    return colocadas
  }
  /** Lo que se llena (colchones y comida) dentro de un tramo, de la fila más cercana a la fija hacia atrás. */
  const llenar = (inner, Fa, Fb, hueco0) => {
    let resto = hueco0
    const ultimo = inner.at(-1)
    if (ultimo?.tipo === 'comida' && !ultimo.rapida && ultimo.min < COMIDA_MAXIMA && resto > HUECO_MAXIMO) {
      const mas = Math.min(resto, COMIDA_MAXIMA - ultimo.min)
      ultimo.min += mas
      resto -= mas
      nota(ultimo, `la comida se alarga ${mas} min: quedaban ${hueco0} min libres antes de ${nombreDe(Fb)}`)
    }
    for (let j = inner.length - 1; j >= 0 && resto > HUECO_MAXIMO; j--) {
      const row = inner[j]
      if (!row.colchon || row.min >= COLCHON_MAXIMO) continue
      const mas = Math.min(resto, COLCHON_MAXIMO - row.min)
      row.min += mas
      resto -= mas
      nota(row, `el colchón se alarga ${mas} min: quedaban ${hueco0} min libres antes de ${nombreDe(Fb)}`)
    }
    return resto
  }
  /** Un colchón nuevo de la zona del último sitio, para lo que quede libre. Devuelve lo que queda sin llenar. */
  const meter = (inner, Fa, Fb, resto, deseado) => {
    const antes = inner.at(-1) ?? Fa
    const molde = antes ? env.colchonZona?.(antes) : null
    if (!molde || resto <= HUECO_MAXIMO) return resto
    const probe = { ...molde, tipo: 'paseo', hora: toHHMM(0), min: 10 }
    const inicio = antes ? llegadaA(antes, probe) : toMin(Fb.hora)
    const disponible = deseado - inicio - hueco({ ...probe, hora: toHHMM(inicio), min: 0 }, Fb, walk)
    const mas = Math.min(down5(disponible), COLCHON_MAXIMO)
    if (mas < MARGENES.COLCHON_MINIMO) return resto
    const nuevo = { ...molde, id: `colchon_${idDe(antes.lugar ?? antes.restaurante ?? 'zona')}_${idDe(nombreDe(Fb)).slice(0, 24)}`, tipo: 'paseo', colchon: true, min: mas, hora: toHHMM(inicio), hora_doc: toHHMM(inicio), min_doc: mas, como_documento: '', texto_documento: molde.titulo }
    inner.push(nuevo)
    nuevas.push(nuevo.id)
    nota(nuevo, `quedaban ${resto} min libres antes de ${nombreDe(Fb)}: se mete el colchón de la zona`)
    return resto - mas
  }

  const salida = []
  let pend = []
  let sunShift = 0
  const horaDoc = (row) => toMin(row.hora_doc ?? row.hora)

  /** Resuelve un tramo entre la fila fija Fa (la última de `salida`, o ninguna) y Fb a la hora `deseada`. Devuelve las filas del tramo y la hora a la que queda Fb. */
  const resolver = (inner0, Fa, Fb, deseada, flexible) => {
    let inner = inner0.map((row) => ({ ...row }))
    let colocadas = colocar(inner, Fa)
    const ultimaDe = (lista) => lista.at(-1) ?? Fa
    const minimoFb = (lista) => {
      const u = ultimaDe(lista)
      if (!u) return deseada
      const margen = Fb.llegada || (lista.length === 0 && Fa?.llegada) ? 0 : antesDeLlegar(Fb)
      return llegadaA(u, Fb) + margen
    }
    let sbMin = minimoFb(colocadas)
    let sb = deseada
    if (sb >= sbMin) {
      let libre = sb - sbMin
      if (libre > HUECO_MAXIMO) {
        let resto = llenar(colocadas, Fa, Fb, libre)
        colocadas = colocar(colocadas, Fa)
        resto = deseada - minimoFb(colocadas)
        if (resto > HUECO_MAXIMO) {
          const dentro = colocadas.map((row) => ({ ...row }))
          resto = meter(dentro, Fa, Fb, resto, deseada)
          colocadas = colocar(dentro, Fa)
          resto = deseada - minimoFb(colocadas)
        }
        if (resto > HUECO_MAXIMO) {
          // El turno movible (la Galería) que va antes se retrasa; si no, la parada fija llega cuando llega (el sol) o se avisa (la cena).
          if (flexible === 'solar' && !turnoPorMover) {
            const t = [...salida].reverse().find((row) => env.turnoMovible?.(row))
            if (t) {
              turnoPorMover = { id: t.id, minutos: Math.ceil(resto / 30) * 30 }
              return { inner: colocadas, sb }
            }
          }
          if (flexible === 'solar' && resto > 30) {
            sb = deseada - resto
            avisos.push(`el sol (${toHHMM(env.sunset)}) llega ${resto} min después de ${nombreDe(Fb)}: no hay colchón que lo alcance`)
          } else if (flexible !== 'solar') avisos.push(`queda un hueco de ${resto} min antes de ${nombreDe(Fb)} (${toHHMM(sb)}): no hay colchón de esa zona`)
          else sb = deseada - resto
        }
      }
      return { inner: colocadas, sb }
    }
    // Falta tiempo: se acorta el colchón de antes (sin bajar de 30 min) y la comida (hasta 45), el más cercano a la fila fija primero.
    let falta = sbMin - sb
    for (let j = colocadas.length - 1; j >= 0 && falta > 0; j--) {
      const row = colocadas[j]
      if (!row.colchon) continue
      const libre = row.min - colchonMinimo(row)
      if (libre <= 0) continue
      const quita = Math.min(libre, up5(falta))
      row.min -= quita
      falta -= quita
      nota(row, `el colchón se acorta ${quita} min: faltaban ${sbMin - sb} min antes de ${nombreDe(Fb)}`)
    }
    for (let j = colocadas.length - 1; j >= 0 && falta > 0; j--) {
      const row = colocadas[j]
      if (row.tipo !== 'comida' || row.rapida || row.min <= COMIDA_MINIMA) continue
      const quita = Math.min(row.min - COMIDA_MINIMA, up5(falta))
      row.min -= quita
      falta -= quita
      nota(row, `la comida se acorta ${quita} min: faltaban ${sbMin - sb} min antes de ${nombreDe(Fb)}`)
    }
    colocadas = colocar(colocadas, Fa)
    sbMin = minimoFb(colocadas)
    if (sb >= sbMin) return { inner: colocadas, sb }
    if (flexible) {
      // La cena se retrasa (hasta las 22:00); el atardecer llega cuando llega.
      // (El mirador del atardecer no quita paradas con la pirámide —el sol no es una reserva—: si aun así llega más de 10 min tarde, el colchón de antes baja de sus 30 min hasta 10 y, si no basta, se quita.)
      if (flexible === 'solar') {
        for (let j = colocadas.length - 1; j >= 0 && sbMin - sb > TARDE_SOLAR; j--) {
          const row = colocadas[j]
          if (!row.colchon) continue
          const quita = Math.min(row.min - MARGENES.COLCHON_MINIMO, up5(sbMin - sb))
          if (quita > 0) {
            row.min -= quita
            nota(row, `el colchón se acorta ${quita} min más: el sol (${toHHMM(env.sunset)}) no espera`)
          } else {
            quitadas.push({ ...row, causa: `no hay tiempo para el colchón antes de ${nombreDe(Fb)} (el sol, ${toHHMM(sb)})` })
            colocadas.splice(j, 1)
          }
          colocadas = colocar(colocadas, Fa)
          sbMin = minimoFb(colocadas)
        }
      }
      // (Con el colchón recortado puede que ahora sobre tiempo: la hora del sol manda y el hueco se llena con nombre en la pasada final.)
      if (flexible === 'solar' && sbMin <= sb) return { inner: colocadas, sb }
      if (flexible === 'solar') avisos.push(`el atardecer de ${nombreDe(Fb)} llega ${sbMin - sb} min tarde: no se puede acortar más`)
      return { inner: colocadas, sb: flexible === 'cena' ? Math.min(sbMin, Math.max(CENA_MAXIMA, sb)) : sbMin }
    }
    return quitarPorPiramide(colocadas, Fa, Fb, sb)
  }
  /** Una hora fija (reserva, turno, el sol): se quita por la pirámide lo que no cabe. */
  const quitarPorPiramide = (colocadas, Fa, Fb, sb) => {
    const prueba = [...(Fa ? [{ ...Fa }] : []), ...colocadas, { ...Fb, hora: toHHMM(sb), fija: true }]
    const r = correrHoras(prueba, { desde: 1, walk, orden: env.orden ?? [], soloEmpujar: true, protegidas: (row) => row.llegada === true })
    for (const q of r.quitadas) quitadas.push({ ...q, causa: `no cabe antes de ${nombreDe(Fb)} (${toHHMM(sb)}) con los márgenes` })
    for (const p of r.problemas) if (!problemas.includes(p)) problemas.push(p)
    const interior = r.rows.slice(Fa ? 1 : 0, r.rows.length - 1)
    for (const row of interior) {
      const antes = colocadas.find((x) => x.id === row.id)
      if (antes && (antes.hora !== row.hora || antes.min !== row.min)) nota(row, `los márgenes (lo andado más 10 min) antes de ${nombreDe(Fb)}`)
    }
    return { inner: interior, sb }
  }

  for (const row of rows) {
    if (!esPunto(row)) { pend.push(row); continue }
    const Fa = salida.at(-1) ?? null
    let deseada = toMin(row.hora)
    let flexible = null
    if (row.id === solarId) {
      flexible = 'solar'
      deseada = near5(env.sunset - (row.lead ?? lead))
    } else if (row.tipo === 'cena') {
      flexible = 'cena'
      deseada = Math.max(deseada + sunShift, suelo(row))
      deseada = Math.min(deseada, Math.max(CENA_MAXIMA, toMin(row.hora)))
    } else if (row.llegada === true || esFija(row)) {
      // (Una hora fija no se mueve; su llegada va justo antes.)
    }
    const { inner, sb } = resolver(pend, Fa, row, deseada, flexible)
    if (turnoPorMover) return { rows: rows0, causas, nuevas, quitadas, avisos, problemas, turnoPorMover }
    pend = []
    salida.push(...inner)
    const fila = { ...row, hora: toHHMM(sb) }
    if (row.id === solarId) {
      sunShift = sb - horaDoc(row)
      if (sb !== toMin(row.hora)) nota(fila, `el atardecer: llega con el sol (${toHHMM(env.sunset)} menos ${row.lead ?? lead} min)`)
    } else if (row.tipo === 'cena' && sb !== toMin(row.hora)) {
      nota(fila, sunShift ? 'la cena sigue al mirador: se mueve lo mismo que el atardecer' : 'la cena, a la hora que dejan los márgenes')
    }
    salida.push(fila)
  }
  // Lo que queda después de la última fila fija (la noche).
  if (pend.length) salida.push(...colocar(pend, salida.at(-1) ?? null))

  // La cena, a en punto o a y media (si la hora ya no es la del documento).
  {
    let tocada = false
    for (let i = 0; i < salida.length; i++) {
      const row = salida[i]
      if (row.tipo !== 'cena' || row.hora === row.hora_doc) continue
      const redonda = Math.ceil(toMin(row.hora) / 30) * 30
      if (redonda === toMin(row.hora) || redonda > CENA_MAXIMA) continue
      salida[i] = { ...row, hora: toHHMM(redonda) }
      nota(salida[i], 'la cena va a en punto o a y media')
      tocada = true
    }
    if (tocada) {
      const i = salida.findIndex((row) => row.tipo === 'cena')
      const cola = colocar(salida.slice(i + 1), salida[i])
      salida.splice(i + 1, salida.length, ...cola)
    }
  }
  // Lo que queda libre después de todo lo anterior (más de 15 min tras los márgenes) se llena con nombre, nunca se deja vacío: la comida de justo antes (hasta 75 min), el colchón de esa
  // zona (hasta 2 horas) o, si no hay, el colchón de esa zona nuevo. Solo se alarga o se mete: las demás horas no se mueven.
  {
    const margenAntes = (a, b) => (a.llegada === true && a.lugar != null && a.lugar === b.lugar ? 0 : antesDeLlegar(b))
    const libreEntre = (a, b) => toMin(b.hora) - margenAntes(a, b) - (finDe(a) + hueco(a, b, walk))
    for (let i = 1, vueltas = 0; i < salida.length && vueltas < 200; vueltas++) {
      const a = salida[i - 1]
      const b = salida[i]
      if (b.tipo === 'noche') { i++; continue }
      let g = libreEntre(a, b)
      if (g <= HUECO_MAXIMO) { i++; continue }
      const resto0 = g
      // Lo que se alarga es lo más cercano de antes que admite más tiempo (la comida hasta 75 min, un colchón o un paseo hasta 2 horas): lo que va entre esa fila y el hueco corre lo mismo
      // hacia después, mientras no haya una hora fija por medio y todo siga abierto.
      for (let j = i - 1; j >= 0 && g > HUECO_MAXIMO; j--) {
        const fila = salida[j]
        if (esFija(fila) || fila.llegada === true || fila.tipo === 'cena' || fila.tipo === 'noche' || fila.id === solarId) break
        const esComida = fila.tipo === 'comida' && !fila.rapida
        const tope = esComida ? COMIDA_MAXIMA : fila.colchon || fila.tipo === 'paseo' ? COLCHON_MAXIMO : 0
        const mas = Math.min(g, tope - fila.min)
        if (mas <= 0) continue
        const corridas = salida.slice(j + 1, i).map((row) => ({ ...row, hora: toHHMM(toMin(row.hora) + mas) }))
        if (corridas.some((row) => env.abierta && !env.abierta(row, toMin(row.hora), row.min))) continue
        fila.min += mas
        corridas.forEach((row, t) => { salida[j + 1 + t] = row })
        nota(fila, `${esComida ? 'la comida se alarga' : 'el colchón se alarga'} ${mas} min: quedaban ${resto0} min libres antes de ${nombreDe(b)}`)
        g -= mas
      }
      if (g <= HUECO_MAXIMO) { i++; continue }
      const previa = salida[i - 1]
      const molde = previa.tipo === 'traslado' ? null : env.colchonZona?.(previa) ?? env.colchonZona?.(b)
      if (molde) {
        const probe = { ...molde, tipo: 'paseo', hora: toHHMM(0), min: 10 }
        const inicio = up5(finDe(previa) + hueco(previa, probe, walk))
        const dispon = toMin(b.hora) - margenAntes(previa, b) - inicio - hueco({ ...probe, hora: toHHMM(inicio), min: 0 }, b, walk)
        const mas = Math.min(down5(dispon), COLCHON_MAXIMO)
        if (mas >= MARGENES.COLCHON_MINIMO) {
          const nuevo = { ...molde, id: `colchon_${idDe(previa.lugar ?? previa.restaurante ?? 'zona')}_${idDe(nombreDe(b)).slice(0, 24)}`, tipo: 'paseo', colchon: true, min: mas, hora: toHHMM(inicio), hora_doc: toHHMM(inicio), min_doc: mas, como_documento: '', texto_documento: molde.titulo }
          salida.splice(i, 0, nuevo)
          nuevas.push(nuevo.id)
          nota(nuevo, `quedaban ${resto0} min libres antes de ${nombreDe(b)}: se mete el colchón de la zona`)
          continue
        }
      }
      // Último recurso: un rato más en el último sitio al aire libre (un mirador, una plaza) antes de lo fijo, hasta media hora.
      {
        let j = i - 1
        while (j > 0 && (salida[j].tipo === 'traslado' || salida[j].modo === 'camino')) j--
        const fila = salida[j]
        const alAireLibre = fila.tipo === 'parada' && !fila.llegada && !esFija(fila) && fila.modo !== 'dentro' && fila.modo !== 'camino'
        const mas = alAireLibre ? Math.min(g, 30) : 0
        if (mas > 0) {
          fila.min += mas
          for (let t = j + 1; t < i; t++) salida[t] = { ...salida[t], hora: toHHMM(toMin(salida[t].hora) + mas) }
          nota(fila, `se queda más rato ${mas} min: quedaban ${resto0} min libres antes de ${nombreDe(b)} y no cabía un colchón`)
          g -= mas
          if (g <= HUECO_MAXIMO) { i++; continue }
        }
      }
      avisos.push(`queda un hueco de ${g} min antes de ${nombreDe(b)} (${b.hora}): no hay colchón de esa zona`)
      i++
    }
  }
  // La noche no pasa del límite: lo que empieza después se quita.
  if (env.nocheValida) {
    for (let i = salida.length - 1; i >= 0; i--) {
      const row = salida[i]
      if (row && row.tipo === 'noche' && !env.nocheValida(row)) {
        quitadas.push({ ...row, causa: `la noche (${row.hora}) pasa de la hora límite de la noche` })
        const previo = salida[i - 1]
        salida.splice(i, 1)
        if (previo?.tipo === 'traslado') salida.splice(i - 1, 1)
      }
    }
  }
  return { rows: salida, causas, nuevas, quitadas, avisos, problemas, turnoPorMover: null }
}
