/**
 * EL DÍA DE LLEGADA CON HORAS (Tanda 7, agente F; PARA_CODE_TANDA7_v3.md, puntos 5, 6, 7, 8, 10, 11 y 12).
 *
 * Solo para la versión de pago y solo si el viaje trae la llegada (hora, medio y, si lo sabe, el punto y la zona). Sin ella, el motor no entra aquí y los días salen como siempre.
 *
 * La idea de fondo (la del documento): NO se calcula al minuto. La hora de llegada, más el traslado del punto y 30 min para la maleta («libre»), solo ELIGE LA FILA de una tabla
 * que escribe el destino (`listas.json › llegadas.dia1`), y cada fila es una lista ESCRITA. Aquí no hay nada de Roma: la ciudad, la hora y el punto entran; el destino pone las
 * tablas (listas.json), los datos de los puntos (_llegada.json), los sitios grandes y sus bloques (`sitios_grandes`) y lo que no cabe en una tabla (`destination_config.llegada`).
 *
 * Este módulo es PURO (sin Node, sin React). `decidirLlegada` devuelve una decisión que `listasTrip.js` aplica en tres sitios y nada más:
 *   1. `ordenarDias`: los días elegidos (`chosen`), cuál va fijo el primer día (`fijoPrimero`) y qué día escrito se cae (`diaCaido`);
 *   2. `preparar`: lo que cambia dentro de los días tocados (`extraDays[id].llegada_ops`, ver `aplicarOpsLlegada`);
 *   3. el resultado del plan: `plan.llegada` (= `decision.publico`: todo lo que las pantallas y el agente de la vuelta necesitan).
 */
import { FREE_TOUR_HORAS, franjaDelFreeTour } from './freeTourHoras.js'
import { horarioDeLaFecha } from './horarioDeLaFecha.js'
import { COMIDA_HASTA_MIN } from './comida.js'

const clone = (value) => (value == null ? value : JSON.parse(JSON.stringify(value)))
export const aMin = (hora) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hora ?? ''))
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}
export const aHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(Math.round(min % 60)).padStart(2, '0')}`
/** La hora como la dice el viajero en un texto: 9:30, no 09:30. */
export const horaEnTexto = (hora) => {
  const min = aMin(hora)
  return min == null ? String(hora ?? '') : `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`
}
const sumarDias = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)

/** Los medios que llevan hora (en coche no se pide: el viaje sale con días enteros). */
export const MEDIOS_CON_HORA = ['avion', 'tren', 'bus', 'ferry']

/**
 * El punto de llegada. Con el id del viajero, ese; sin él (un viaje viejo con hora y sin punto), el del traslado MÁS LARGO de ese medio
 * (avión: Fiumicino; tren: Tiburtina; autobús: la estación de autobuses de Tiburtina; barco: Civitavecchia). Sale de los datos del destino.
 */
export function puntoDeLlegada(info, medio, puntoId = null) {
  const medios = info?.medios ?? {}
  if (puntoId) {
    const encontrado = Object.values(medios).flatMap((m) => m?.puntos ?? []).find((p) => p.id === puntoId)
    if (encontrado) return encontrado
  }
  const delMedio = medios[medio]?.puntos ?? []
  if (delMedio.length === 0) return null
  return delMedio.reduce((a, b) => ((b.al_centro_min ?? 0) > (a.al_centro_min ?? 0) ? b : a))
}

/** «Libre» (minutos desde las 0:00; puede pasar de 1440): la hora de llegada + el traslado del punto + lo de la maleta. Nunca se enseña. */
export const minutosLibre = (llegadaMin, punto, extra = 30) => llegadaMin + (punto?.al_centro_min ?? 0) + extra

/**
 * ¿Es «invierno» para la llegada? Los días en que el sitio de referencia del destino (`destination_config.llegada.invierno`: en Roma, el Coliseo) cierra a la hora marcada
 * (16:30) según el horario de SU FECHA (`horarioDeLaFecha`); nunca fechas escritas a mano. Sin fechas, el día 15 del mes. Un día en que ese sitio cierra entero (25 de diciembre,
 * 1 de enero) se mira por el día de al lado.
 */
export function esInvierno(destData, { dateIso = null, month = null } = {}) {
  const cfg = destData?.destination_config?.llegada?.invierno
  if (!cfg) return false
  const place = (destData.places ?? []).find((p) => p.name === cfg.lugar)
  if (!place) return false
  if (!dateIso && !Number.isInteger(month)) return false
  const cierraEn = (iso, mes) => {
    const h = horarioDeLaFecha(place, iso, mes)
    return h.cerrado ? undefined : h.cierra
  }
  let cierra = cierraEn(dateIso, dateIso ? null : month)
  if (cierra === undefined && dateIso) {
    for (const d of [1, -1, 2, -2, 3, -3]) {
      cierra = cierraEn(sumarDias(dateIso, d), null)
      if (cierra !== undefined) break
    }
  }
  return cierra === cfg.cierra
}

/**
 * La fila de la tabla. La primera fila (`por: 'llegada'`, la madrugada) se mira con la HORA DE LLEGADA; las demás, con «libre». Cada fila empieza en su hora (libre a las 14:00 en
 * punto ya es la fila de las 14:00; nada se redondea). Si «libre» pasa de la medianoche sigue siendo el mismo día: la última fila.
 */
export function filaDeLlegada(tabla, llegadaMin, libreMin) {
  const filas = tabla ?? []
  const porLlegada = filas.findIndex((f) => f.por === 'llegada')
  if (porLlegada >= 0 && llegadaMin >= aMin(filas[porLlegada].desde) && llegadaMin <= aMin(filas[porLlegada].hasta)) return { fila: filas[porLlegada], indice: porLlegada }
  const libre = Math.min(libreMin, 24 * 60 - 1)
  const indice = filas.findIndex((f) => f.por !== 'llegada' && libre >= aMin(f.desde) && (f.hasta == null || libre <= aMin(f.hasta)))
  return indice >= 0 ? { fila: filas[indice], indice } : null
}

/** El verbo de la llegada según el medio: avión «Aterrizas», tren o autobús «Llegas a {punto}», barco «Desembarcas». */
export function verboDeLlegada(medio, punto) {
  if (medio === 'avion') return 'Aterrizas'
  if (medio === 'ferry') return 'Desembarcas'
  return `Llegas a ${punto?.nombre ?? 'la estación'}`
}

/** Rellena {Llegada}, {hora}, {punto} y {zona} de un texto escrito en el documento. {hora} es la que puso el viajero. */
export function llenarTexto(plantilla, { medio, punto, hora, zona = null }) {
  return String(plantilla ?? '')
    .replaceAll('{Llegada}', verboDeLlegada(medio, punto))
    .replaceAll('{hora}', horaEnTexto(hora))
    .replaceAll('{punto}', punto?.nombre ?? '')
    .replaceAll('{zona}', zona ?? '')
}

/**
 * El nombre de un día escrito dicho en una frase: «Día de la Roma antigua» → «la Roma antigua»; «Día del Vaticano y Trastevere» → «el Vaticano y Trastevere»;
 * «Día de Villa Borghese, el Popolo y la Plaza de España» → «Villa Borghese» (solo lo primero).
 */
export function fraseDeDia(nombre, id = '') {
  const texto = String(nombre ?? '').trim()
  if (!texto) return id
  const sinDia = texto.replace(/^D[ií]a del /i, 'el ').replace(/^D[ií]a de (la|los|las) /i, '$1 ').replace(/^D[ií]a de /i, '')
  return sinDia.split(',')[0].replace(/ · .*$/, '').trim()
}

/** «Tu entrada al Coliseo», «Tu entrada a los Museos». */
const aSitio = (texto) => (/^el /i.test(texto) ? `al ${texto.slice(3)}` : `a ${texto}`)
const verboMinusculas = (medio) => (medio === 'avion' ? 'aterrizas' : medio === 'ferry' ? 'desembarcas' : 'llegas')

/** Quita de una lista de paradas las que son de esos lugares (y el traslado que iba justo delante). */
export function quitarParadas(lista, nombres) {
  const fuera = new Set(nombres)
  const sale = new Set()
  lista.forEach((stop, i) => {
    if (stop.tipo !== 'traslado' && fuera.has(stop.lugar)) {
      sale.add(i)
      if (lista[i - 1]?.tipo === 'traslado') sale.add(i - 1)
    }
  })
  return lista.filter((_, i) => !sale.has(i))
}

/** Un traslado no puede ir el primero de su lista, ni el último, ni detrás de otro traslado. */
export function limpiarTraslados(lista) {
  const out = []
  for (const stop of lista) {
    if (stop.tipo === 'traslado' && (out.length === 0 || out.at(-1).tipo === 'traslado')) continue
    out.push(stop)
  }
  while (out.length > 0 && out.at(-1).tipo === 'traslado') out.pop()
  return out
}

/**
 * Lo que `listasTrip.js › preparar` hace con un día tocado por la llegada (`dia.llegada_ops`), ya con sus variantes puestas. Todo son LISTAS: nada se cuenta en minutos.
 *   quitar            → los lugares que se ven en otro día (la «versión sin esa visita» de una reserva grande, o la parte del Vaticano de una llegada con Free Tour)
 *   cena_y_noche_de   → la cena y la noche de otro día escrito (la parte del Free Tour sin el Vaticano cena donde acaba el tour)
 *   comida_al_llegar  → la parada «Comida, cerca de tu alojamiento», sin restaurante nuestro, antes de la primera parada: { min, titulo }
 *   sin_comida        → el día no lleva comida (el viajero llega cuando ya pasó la hora de comer)
 *   sobra_extra       → lo que el día deja para «Si te sobra tiempo»
 *   empieza           → el día empieza más tarde (nunca antes de lo que ya decía)
 * @param {object} trabajo  { manana, comida, tarde, cena, noche, empieza, sobra, franjas }
 * @param {object} ops
 * @param {Record<string, object>} dias  los días escritos del destino (para `cena_y_noche_de`)
 */
export function aplicarOpsLlegada(trabajo, ops, dias = {}) {
  if (!ops) return trabajo
  const out = { ...trabajo, franjas: { ...(trabajo.franjas ?? {}) } }
  if (ops.quitar?.length) {
    out.manana = quitarParadas(out.manana ?? [], ops.quitar)
    out.tarde = quitarParadas(out.tarde ?? [], ops.quitar)
  }
  if (ops.cena_y_noche_de) {
    const origen = dias[ops.cena_y_noche_de]?.partes?.unica
    if (origen) {
      out.cena = clone(origen.cena ?? null)
      out.noche = clone(origen.noche ?? null)
      out.franjas.tarde = true
    }
  }
  if (ops.sin_comida) { out.comida = null }
  if (ops.comida_al_llegar) {
    out.comida = { restaurante: null, alternativa: null, tercera: null, zona: null, sin_restaurante: true, titulo: ops.comida_al_llegar.titulo ?? 'Comida, cerca de tu alojamiento', min: ops.comida_al_llegar.min ?? 60, doc: 'comida al llegar' }
    out.franjas.manana = true
  }
  if (ops.sobra_extra?.length) out.sobra = [...(out.sobra ?? []), ...clone(ops.sobra_extra)]
  if (ops.empieza) {
    const actual = out.empieza ? aMin(out.empieza) : null
    out.empieza = actual != null && actual > aMin(ops.empieza) ? out.empieza : ops.empieza
  }
  out.manana = limpiarTraslados(out.manana ?? [])
  out.tarde = limpiarTraslados(out.tarde ?? [])
  return out
}

/** Une dos `llegada_ops` del mismo día (dos cosas que le tocan a la vez). */
const unirOps = (a = {}, b = {}) => ({
  ...a, ...b,
  quitar: [...new Set([...(a.quitar ?? []), ...(b.quitar ?? [])])],
  forzar: [...new Set([...(a.forzar ?? []), ...(b.forzar ?? [])])],
  bloques: [...(a.bloques ?? []), ...(b.bloques ?? [])],
  sobra_extra: [...(a.sobra_extra ?? []), ...(b.sobra_extra ?? [])],
})

/** Pone `llegada_ops` en un día escrito SIN cambiar el original (una copia por viaje). */
function conOps(dias, extraDays, id, ops, cambios = {}) {
  const base = extraDays[id] ?? dias[id]
  if (!base) return
  extraDays[id] = { ...base, ...cambios, llegada_ops: unirOps(base.llegada_ops, ops) }
}

/** La hora de empezar el día: «libre» redondeada hacia arriba de 5 en 5 (se usa por dentro y no se enseña). */
const empiezaDesde = (libreMin) => aHHMM(Math.min(Math.ceil(libreMin / 5) * 5, 23 * 60 + 55))

/** «Libre» (minutos) de una llegada, o null si no se puede saber (sin datos del destino, en coche…). Es lo único que el motor necesita antes de repartir los días. */
export function libreDeLlegada(destData, written, entrada) {
  const info = written?.llegadaInfo
  if (!entrada || !info) return null
  const medio = entrada.medio ?? 'avion'
  const llegadaMin = aMin(entrada.hora)
  if (!MEDIOS_CON_HORA.includes(medio) || llegadaMin == null) return null
  const punto = puntoDeLlegada(info, medio, entrada.puntoId)
  if (!punto) return null
  const extra = destData?.destination_config?.llegada?.libre_extra_min
  return minutosLibre(llegadaMin, punto, Number.isFinite(extra) ? extra : 30)
}

/**
 * Una excursión que el viajero ha reservado (`{ dateIso | dayNumber, salida?, vuelta?, nombre? }`) y el día 1:
 *   'lleva_el_dia'  sale cuando ya está libre (o sin hora): ese día lleva la excursión;
 *   'no_llega'      sale antes de estar libre: el aviso de reservas contra el vuelo (la excursión se queda donde está);
 *   null            no es del día 1.
 */
export function excursionEnDia1(excursion, { fecha1 = null, libre = null } = {}) {
  if (!excursion) return null
  const esDia1 = fecha1 && excursion.dateIso ? excursion.dateIso === fecha1 : Number(excursion.dayNumber) === 1
  if (!esDia1) return null
  const salida = aMin(excursion.salida)
  return salida != null && libre != null && salida < libre ? 'no_llega' : 'lleva_el_dia'
}

/** La variante de `diaRef` que dice lo mismo que la variante `id` de `dia` (la del Coliseo por la tarde del D1 y la de su día con Free Tour): misma condición. */
function varianteEquivalente(dia, id, diaRef) {
  const origen = (dia?.variantes ?? []).find((v) => v.id === id)
  if (!origen) return null
  const firma = JSON.stringify(origen.cuando)
  return (diaRef?.variantes ?? []).find((v) => JSON.stringify(v.cuando) === firma)?.id ?? (diaRef?.variantes ?? []).find((v) => v.id === id)?.id ?? null
}

/**
 * ═══ LA DECISIÓN ═══
 * @param {object} c
 *   destData, written ({ days, llegadas, llegadaInfo }), entrada { hora, puntoId?, medio?, zona? }, chosen (los días de la tabla del viaje), n (días de ruta),
 *   hasFreeTour, ftHora (la hora del Free Tour: la reservada o la de las entradas, o null), ftReserva ({ dateIso, dayNumber, time } o null), tourName,
 *   fecha1 (la fecha del día 1 o null), mes (0-11, sin fechas), dia(k) → { dayNumber, dateIso, weekday, noTour } del k-ésimo día de ciudad,
 *   reservasGrandes, nivelDe(lugar), excursion (reservada) o null.
 * @returns {{ aplica: boolean, motivo?: string, chosen?, fijoPrimero?, extraDays?, entradasApp?: Record<number, Record<string, string>> (por posición del día: la hora del Free Tour que ha elegido la app, solo para elegir la versión de ese día; no es una reserva), publico?: object, noReorganiza?: boolean }}
 */
export function decidirLlegada(c) {
  const { destData, written, entrada } = c
  const NO = (motivo) => ({ aplica: false, motivo })
  const cfg = destData?.destination_config?.llegada ?? {}
  const tablas = written?.llegadas?.dia1
  const info = written?.llegadaInfo
  if (!entrada || !tablas || !info) return NO('sin_datos')
  const medio = entrada.medio ?? 'avion'
  if (!MEDIOS_CON_HORA.includes(medio)) return NO('medio_sin_hora')
  const llegadaMin = aMin(entrada.hora)
  if (llegadaMin == null) return NO('sin_hora')
  const punto = puntoDeLlegada(info, medio, entrada.puntoId)
  if (!punto) return NO('sin_punto')
  const libre = minutosLibre(llegadaMin, punto, Number.isFinite(cfg.libre_extra_min) ? cfg.libre_extra_min : 30)
  const invierno = esInvierno(destData, { dateIso: c.fecha1 ?? null, month: c.mes ?? null })
  const tablaId = invierno ? 'invierno' : 'marzo_octubre'
  const encontrada = filaDeLlegada(tablas[tablaId], llegadaMin, libre)
  if (!encontrada) return NO('sin_fila')
  const { fila } = encontrada
  const dias = written.days
  const zona = entrada.zona ?? 'nose'
  const x = {
    ...c, cfg, fila, libre, llegadaMin, punto, medio, invierno, tablaId, dias, zona,
    esMadrugada: fila.por === 'llegada', pasa: fila.pasa_al_dia_2 === true,
    inicioZona: written.llegadas?.inicio_por_zona?.[zona] ?? written.llegadas?.inicio_por_zona?.nose ?? 'navona',
    sitios: c.sitiosGrandes ?? [],
    extraDays: {}, avisos: [], resumen: [], dejado: [],
  }
  x.publico = {
    version: 1,
    entrada: { hora: entrada.hora, medio, punto_id: punto.id, punto: punto.nombre, zona, invierno },
    tabla: tablaId,
    fila: { indice: encontrada.indice, desde: fila.desde, hasta: fila.hasta ?? null, doc: fila.doc ?? null },
    caso: null, dia1: null, pasa_al_dia_2: false, dia_caido: null, orden: null, free_tour: null, bloques: [],
    dejado_fuera: x.dejado, avisos: x.avisos, resumen: x.resumen,
    hooks: { vuelta: { dia_caido: null, pendientes: [], vuelve_como_dia_mas: null } },
  }
  x.sitioDe = (nombre) => x.sitios.find((s) => s.nombre === nombre) ?? null
  x.nombreCorto = (nombre) => {
    const entradaDe = (destData.entradas_reservas ?? []).find((e) => (e.lugares ?? []).includes(nombre))
    return destData.entradas_nombres_cortos?.[entradaDe?.nombre ?? nombre] ?? destData.entradas_nombres_cortos?.[nombre] ?? x.sitioDe(nombre)?.el ?? nombre
  }
  const esDia1 = (r) => Boolean(r) && (c.fecha1 && r.dateIso ? r.dateIso === c.fecha1 : Number(r.dayNumber) === 1)
  x.esDia1 = esDia1
  x.reservasDia1 = (c.reservasGrandes ?? []).filter((r) => r && r.name !== c.tourName && r.time && esDia1(r))
  x.reservasPequenasDia1 = (c.reservasViaje ?? []).filter((r) => r && r.name && r.time && esDia1(r))
  x.reservasOtrosDias = (c.reservasGrandes ?? []).filter((r) => r && r.name !== c.tourName && (r.dateIso || Number.isInteger(Number(r.dayNumber))) && !esDia1(r))
  // ¿Está el Free Tour reservado en OTRO día? Entonces el día 1 no es el suyo.
  x.ftEnDia1 = !c.ftReserva || esDia1(c.ftReserva)

  // Dos reservas grandes del día 1 que se cruzan (la segunda empieza antes de que acabe la primera, con lo que dura cada una en los datos): el aviso «coinciden» de siempre.
  {
    const duracion = (nombre) => destData.places?.find((q) => q.name === nombre)?.duration_minutes ?? 60
    const ordenadas = [...x.reservasDia1].sort((p, q) => aMin(p.time) - aMin(q.time))
    for (let i = 1; i < ordenadas.length; i++) {
      const antes = ordenadas[i - 1]
      const despues = ordenadas[i]
      if (aMin(despues.time) < aMin(antes.time) + duracion(antes.name)) {
        x.avisos.push({ tipo: 'reservas_coinciden', sitios: [antes.name, despues.name], campana: true, botones: ['ver_mis_reservas'], texto: `Tu entrada ${aSitio(x.nombreCorto(antes.name))} y tu entrada ${aSitio(x.nombreCorto(despues.name))} coinciden. Revisa una de las dos reservas.` })
      }
    }
  }

  // Una excursión reservada: el día 1 la lleva (el motor ya ha quitado ese día de los de ciudad) o el aviso de que sale antes de estar libre.
  const exc = excursionEnDia1(c.excursion, { fecha1: c.fecha1, libre })
  if (exc === 'no_llega') {
    x.avisos.push({ tipo: 'excursion_antes_de_llegar', sitio: c.excursion.nombre ?? null, hora_reserva: horaEnTexto(c.excursion.salida), hora_llegada: horaEnTexto(entrada.hora), campana: true, botones: ['ver_reserva'], texto: `${verboDeLlegada(medio, punto).replace(/^Llegas a .*/, 'Llegas')} a las ${horaEnTexto(entrada.hora)} y tu excursión${c.excursion.nombre ? ` a ${c.excursion.nombre}` : ''} sale a las ${horaEnTexto(c.excursion.salida)}: no llegas. Revisa tu reserva.` })
  }
  if (c.excursionDia1 === true) {
    x.publico.caso = 'excursion_el_dia_1'
    x.publico.orden = [...c.chosen]
    return finalizar({ ...x, chosen: [...c.chosen], fijoPrimero: null, diaCaido: null })
  }

  const ft = cfg.free_tour
  const conTour = Boolean(c.hasFreeTour && ft && x.cfg && c.chosen[0] === ft.dia && c.n >= 2)
  if (conTour && x.ftEnDia1) return decidirConFreeTour(x)
  // El día que la fila sustituye: el D1 (con el Free Tour reservado en otro día, el D1 de los viajes con Free Tour; con 1 noche, el D0).
  x.refId = conTour ? ft.dia_roma_antigua_con_tour ?? c.chosen[1] : c.chosen[0]
  return decidirNormal(x)
}

/** ═══ SIN FREE TOUR DE MAÑANA EN EL DÍA 1 ═══ */
function decidirNormal(x) {
  const { cfg, dias, publico, esMadrugada, reservasDia1, sitioDe, refId, dejado, medio, punto, entrada, libre } = x
  const chosen0 = [...x.chosen]
  const tablaLen = chosen0.length
  const extraDays = x.extraDays
  const listaDe = (f) => {
    const listas = f.listas ?? []
    return f.segun_zona ? listas.find((l) => dias[l.lista]?.inicio === x.inicioZona) ?? listas[0] : listas[0]
  }
  let fila = x.fila
  let pasa = x.pasa
  let lista = listaDe(fila)
  // El día que la fila sustituye está reservado para OTRO día (el Coliseo reservado el día 3, con una llegada que lo gastaría el día 1): el día 1 no puede gastarlo. Con una llegada de versión
  // rápida o de tarde, el día 1 pasa a ser la ruta del centro (con su comida al llegar) y el D1 baja a su día; con la tranquila, el D1 de siempre y que lo reparta la reserva.
  const choqueConElDia = !pasa && !esMadrugada && lista?.lista !== cfg.dia_roma_antigua && x.reservasOtrosDias.some((r) => (sitioDe(r.name)?.dias ?? []).includes(refId))
  if (choqueConElDia) {
    const tabla = x.written.llegadas?.dia1?.[x.tablaId] ?? []
    const centro = tabla.filter((f) => f.pasa_al_dia_2 && f.segun_zona)
    const filaCentro = centro.filter((f) => f.comida_al_llegar).at(-1) ?? centro[0]
    if (filaCentro && listaDe(filaCentro) && dias[listaDe(filaCentro).lista]) {
      fila = filaCentro
      pasa = true
      lista = listaDe(filaCentro)
      publico.fila = { ...publico.fila, desviada_por_reserva: true }
    }
  }
  if (!lista || !dias[lista.lista]) return { aplica: false, motivo: 'lista_sin_escribir' }
  const esElDiaDeSiempre = lista.lista === cfg.dia_roma_antigua // «antes de las 10:00»: el D1 de siempre (en marzo-octubre, su versión tranquila)
  const chosen = [...chosen0]
  const slotRef = Math.max(0, chosen0.indexOf(refId))
  let fijoPrimero = null
  let diaCaido = null
  let forzar = []
  let versionId = refId
  let diaDelDueno = null
  const choqueTranquilo = x.reservasOtrosDias.some((r) => (sitioDe(r.name)?.dias ?? []).includes(refId))

  if (!pasa && reservasDia1.length > 0 && !esMadrugada) {
    // 2.0 Una reserva grande el día 1 ANTES de las 14:00 (en invierno, de las 13:00): ese día es el día escrito de ese sitio. El Coliseo: el D1 de siempre con la tabla de SU hora
    //     (manda la hora del Coliseo, no la fila). Los Museos o la Galería: lo hace el orden de los días (la reserva grande mueve su día entero) y el D1 va al día que tenía.
    publico.caso = 'reserva_grande_dia_completo'
    //     Con DOS reservas grandes el día 1 (el Coliseo y los Museos, por ejemplo), el día 1 es el del sitio de la más temprana que abre ese día y la otra va como su BLOQUE dentro de él, a su hora (nada desaparece).
    const porHora = [...reservasDia1].sort((p, q) => aMin(p.time) - aMin(q.time))
    const carrierDe = (r) => (sitioDe(r.name)?.dias ?? []).find((id) => chosen0.includes(id) && dias[id]) ?? null
    const dueno = porHora.find((r) => carrierDe(r) && !x.cerrado?.(r.name, 0)) ?? null
    diaDelDueno = dueno ? carrierDe(dueno) : refId
    if (dueno && carrierDe(dueno) === refId) fijoPrimero = refId
    for (const r of porHora.filter((q) => q !== dueno)) {
      const sitio = sitioDe(r.name)
      if (!sitio?.bloque?.paradas?.length) continue
      const fuente = (sitio.dias ?? []).find((id) => dias[id]) ?? null
      // (Si el día escrito de ese sitio es el que se queda de día 1 por otra reserva, ya lo lleva: la reserva del dueño.)
      publico.bloques.push({ sitio: r.name, hora: aHHMM(aMin(r.time)), lugares: sitio.bloque.paradas, fuente })
    }
    avisarReservasAntesDeLlegar(x)
  } else if (esElDiaDeSiempre) {
    publico.caso = esMadrugada ? 'madrugada' : lista.variante ? 'tranquilo' : 'd1_de_siempre'
    if (lista.variante && tablaLen >= 2 && !choqueTranquilo) {
      // (La variante del D1 o, si el día que se sustituye es el de los viajes con Free Tour, su equivalente en ese día.)
      const idVariante = refId === cfg.dia_roma_antigua ? lista.variante : varianteEquivalente(dias[cfg.dia_roma_antigua], lista.variante, dias[refId])
      if (idVariante) forzar = [idVariante]
    }
    // El día 1 es el D1 (el documento: «El día 1 es el D1 en una versión según la hora»): va fijo el día 1, los demás días se reparten como sin vuelos. Solo si una reserva grande de otro día lo reclama no se fija.
    if (!choqueTranquilo) fijoPrimero = refId
    avisarReservasAntesDeLlegar(x)
  } else if (!pasa) {
    publico.caso = lista.lista.includes('rapido') ? 'rapido' : 'de_tarde'
    versionId = lista.lista
    chosen[slotRef] = versionId
    fijoPrimero = versionId
    avisarReservasAntesDeLlegar(x)
  } else {
    publico.caso = lista.lista.includes('entera') ? 'ruta_del_centro_entera' : lista.lista.includes('centro') ? 'ruta_del_centro' : lista.lista.includes('anochecer') ? 'anochecer' : lista.lista === 'D1-noche' ? 'noche_con_cena' : lista.lista === 'D1-noche-sin-cena' ? 'noche_sin_cena' : 'sin_ruta'
    versionId = lista.lista
    publico.pasa_al_dia_2 = true
    // El D1 pasa entero al día 2: todo se corre un día y se cae el ÚLTIMO día de ruta (el de menos importancia). Con 2 noches, el día 2 es el «D1+Vaticano»; con 1, no hay día 2.
    if (tablaLen === 1) {
      chosen.splice(0, 1, versionId)
      publico.dia_sustituido = { id: chosen0[0], motivo: 'una_noche_con_llegada_tarde' }
    } else if (tablaLen === 2 && cfg.dos_noches_tarde && dias[cfg.dos_noches_tarde]) {
      chosen.splice(0, 2, versionId, cfg.dos_noches_tarde)
      publico.dia_sustituido = { id: chosen0[1], motivo: 'dos_noches_con_llegada_tarde' }
      x.diaCorrido = chosen0[0]
    } else {
      chosen.splice(0, chosen.length, versionId, ...chosen0.slice(0, -1))
      diaCaido = { id: chosen0.at(-1), motivo: 'el_dia_1_pasa_al_dia_2' }
      x.diaCorrido = chosen0[0]
    }
    fijoPrimero = versionId
    avisarReservasAntesDeLlegar(x)
    // Los bloques de las reservas grandes del día 1: el bloque entero a su hora, dentro de la ruta de la fila; el resto de su día, sin esa visita.
    for (const r of reservasDia1) {
      const sitio = sitioDe(r.name)
      if (!sitio?.bloque?.paradas?.length) continue
      const fuente = (sitio.dias ?? []).find((id) => dias[id]) ?? null
      publico.bloques.push({ sitio: r.name, hora: aHHMM(aMin(r.time)), lugares: sitio.bloque.paradas, fuente })
      publico.caso = `${publico.caso}+reserva_grande`
    }
    // Un día que la llegada tarde dejó fuera y una reserva grande reclama vuelve solo («si reservas la Galería, te ponemos su día»): sale el último día que no lleva otra reserva.
    const antes = [...chosen]
    diaCaido = reponerDiasDeReservas(x, chosen, chosen0, diaCaido)
    // Con 2 noches, el día 2 es el «D1+Vaticano»; si el Free Tour reservado lo reclama, el día 2 es el del Free Tour y la Roma antigua se queda sin día (a «Si te sobra tiempo» y, si cabe, a la mañana de la vuelta).
    if (tablaLen === 2 && chosen[1] !== antes[1]) {
      publico.dia_sustituido = { id: antes[1], motivo: 'una_reserva_reclama_el_dia' }
      diaCaido = null
      x.diaCorrido = null
      dejarFuera(x, [cfg.dia_roma_antigua], chosen, { dia: 1 })
      for (const d of dejado) publico.hooks.vuelta.pendientes.push({ lugar: d.lugar, motivo: d.motivo, de_dia: d.de_dia })
    }
  }

  // La versión hereda del día que sustituye lo que el viajero ha pedido (pool, experiencias, sugerencias) y el Free Tour de la noche, que va «en la noche del D1».
  const diaRef = dias[refId]
  if (!pasa && versionId !== refId && diaRef) {
    const delTour = (diaRef.variantes ?? []).filter((v) => [].concat(v.cuando ?? []).some((cu) => cu?.free_tour_despues))
    extraDays[versionId] = { ...dias[versionId], pool: diaRef.pool, experiencias: diaRef.experiencias, sugerencias: diaRef.sugerencias, variantes: [...(dias[versionId].variantes ?? []), ...delTour] }
  }

  // Lo que cambia dentro del día 1 (se aplica en `preparar`, con las variantes ya puestas). Solo las listas escritas para la llegada no se recortan por minutos.
  const opsDia1 = { dia_llegada: true }
  // Una lista escrita PARA la llegada (rápida, de tarde, la ruta del centro…) no se recorta por minutos y empieza cuando el viajero está libre; la versión tranquila es el D1 de siempre, con
  // sus reglas de siempre (la comida antes de las 15:00…), y empieza a su hora.
  const esVersion = pasa || versionId !== refId || forzar.length > 0
  const listaDeLlegada = pasa || versionId !== refId
  if (listaDeLlegada) {
    opsDia1.sin_ajustes = true
    opsDia1.empieza = empiezaDesde(libre)
  }
  if (forzar.length) opsDia1.forzar = forzar
  if (fila.comida_al_llegar && pasa) opsDia1.comida_al_llegar = { min: fila.comida_corta_min ?? 60, titulo: 'Comida, cerca de tu alojamiento' }
  else if (fila.comida_al_llegar && versionId !== refId) opsDia1.comida_al_llegar = { min: fila.comida_corta_min ?? 60, titulo: 'Comida, cerca de tu alojamiento' }
  if (publico.bloques.length > 0) opsDia1.bloques = publico.bloques.map((b) => ({ sitio: b.sitio, hora: b.hora, fuente: b.fuente, lugares: b.lugares }))
  const dia1Id = chosen[0]
  // (El día 1 de una reserva grande de antes de las 14:00 puede acabar siendo otro día: ese caso lo marca el orden de los días, no una lista nuestra.)
  if (dias[dia1Id] && publico.caso !== 'reserva_grande_dia_completo') conOps(dias, extraDays, dia1Id, opsDia1)
  // Con una reserva grande de antes de las 14:00, el día 1 lo pone el orden de los días; las otras reservas grandes de ese día van como bloque en el día de la más temprana.
  if (publico.caso === 'reserva_grande_dia_completo' && publico.bloques.length > 0 && dias[diaDelDueno]) {
    conOps(dias, extraDays, diaDelDueno, { dia_llegada: true, bloques: publico.bloques.map((b) => ({ sitio: b.sitio, hora: b.hora, fuente: b.fuente, lugares: b.lugares })) })
  }

  // La «versión sin esa visita» de los días donde estaba la reserva: nada se pierde y nada se repite.
  for (const b of publico.bloques) {
    for (const [id, regla] of Object.entries(sitioDe(b.sitio)?.sin_la_visita ?? {})) {
      if (!chosen.includes(id) || !dias[id] || id === dia1Id || id === diaDelDueno) continue
      const ops = {}
      if (regla.quitar) ops.quitar = regla.quitar
      if (regla.variante) ops.forzar = [regla.variante]
      conOps(dias, extraDays, id, ops)
    }
  }

  // Lo que se queda sin día: con 1 noche y la llegada tarde, el D1 (la Roma antigua) no cabe en ningún día: sus imprescindibles con entrada van a «Si te sobra tiempo» del día 1.
  if (tablaLen === 1 && pasa && cfg.dia_roma_antigua && dias[cfg.dia_roma_antigua]) {
    dejarFuera(x, [cfg.dia_roma_antigua], chosen, { dia: 1 })
  }

  const diaTexto = dias[versionId]
  const texto = diaTexto?.textos?.texto ? llenarTexto(diaTexto.textos.texto, { medio, punto, hora: entrada.hora }) : null
  const sinParadas = !(diaTexto?.partes?.unica?.manana?.length || diaTexto?.partes?.unica?.tarde?.length) && esVersion
  publico.dia1 = {
    lista: dia1Id, nombre: dias[dia1Id]?.nombre ?? null, variante: lista.variante ?? null, comida_al_llegar: Boolean(opsDia1.comida_al_llegar), comida_corta_min: fila.comida_corta_min ?? null,
    inicio_ruta: dias[dia1Id]?.inicio ?? null, sin_paradas: sinParadas, texto, de_noche: esVersion && aMin(fila.desde) >= 20 * 60 + 30,
  }
  publico.orden = chosen
  // Si el día 1 es de noche (desde las 20:30), lo que se queda fuera va al «Si te sobra tiempo» del día 2.
  if (publico.dia1.de_noche && dejado.length > 0 && chosen.length > 1) for (const d of dejado) d.dia = 2
  return finalizar({ ...x, chosen, fijoPrimero, diaCaido, fila, pasa })
}

/**
 * Los días que la llegada tarde dejó fuera pero que una reserva grande (de cualquier día) necesita vuelven solos: cada uno sustituye al último día del viaje que no es el 1 ni lleva
 * otra reserva (el de menos importancia). «Si el viajero reserva la Galería, su día vuelve solo.» Solo vale para un día que SÍ estaba en la tabla del viaje y la llegada dejó fuera.
 */
function reponerDiasDeReservas(x, chosen, chosen0, diaCaido) {
  const { dias } = x
  const lleva = (id, lugar) => {
    const d = dias[id]
    const paradas = [...Object.values(d?.partes ?? {}).flatMap((p) => [...(p.manana ?? []), ...(p.tarde ?? [])]), ...(d?.hereda_manana_de && dias[d.hereda_manana_de] ? dias[d.hereda_manana_de].partes?.unica?.manana ?? [] : [])]
    return paradas.some((s) => s.lugar === lugar && s.tipo !== 'traslado' && s.modo !== 'camino')
  }
  const tourReservado = x.ftReserva && !x.ftEnDia1 ? [{ ...x.ftReserva, name: x.tourName }] : []
  const reservas = [...x.reservasDia1, ...x.reservasOtrosDias, ...tourReservado]
  const protegidos = new Set()
  for (const r of reservas) for (const id of chosen) if (lleva(id, r.name)) protegidos.add(id)
  let caido = diaCaido
  for (const r of [...x.reservasOtrosDias, ...tourReservado]) {
    if (chosen.some((id) => lleva(id, r.name))) continue
    const vuelve = chosen0.find((id) => lleva(id, r.name))
    if (!vuelve) continue
    const i = chosen.map((id, k) => k).filter((k) => k > 0 && !protegidos.has(chosen[k])).at(-1)
    if (i == null) continue
    caido = { id: chosen[i], motivo: 'vuelve_el_dia_de_una_reserva', vuelve }
    chosen[i] = vuelve
    protegidos.add(vuelve)
    x.publico.dias_que_vuelven = [...(x.publico.dias_que_vuelven ?? []), { id: vuelve, por: r.name, sale: caido.id }]
  }
  return caido
}

/** El aviso de una reserva grande ANTES de estar libre (se compara con «libre», sin margen): se queda en su sitio y sale el aviso (campana). */
function avisarReservasAntesDeLlegar(x) {
  if (x.esMadrugada) return
  for (const r of [...x.reservasDia1, ...x.reservasPequenasDia1]) {
    if (aMin(r.time) >= x.libre) continue
    x.avisos.push({
      tipo: 'reserva_antes_de_llegar', sitio: r.name, hora_reserva: horaEnTexto(r.time), hora_llegada: horaEnTexto(x.entrada.hora), campana: true, botones: ['ver_reserva'],
      texto: `Tu entrada ${aSitio(x.nombreCorto(r.name))} es a las ${horaEnTexto(r.time)} y ${verboMinusculas(x.medio)} a las ${horaEnTexto(x.entrada.hora)}: no llegas a tiempo. Revisa tu reserva.`,
    })
  }
}

/** Los imprescindibles con entrada de los días de referencia que ningún día del viaje lleva: a «Si te sobra tiempo» (con su aviso). Nunca restaurantes ni nocturnas. */
function dejarFuera(x, referencias, chosen, { dia = 1, motivo = 'no_cabe_con_la_llegada' } = {}) {
  const { dias, extraDays, dejado } = x
  const delViaje = new Set()
  for (const id of chosen) {
    const d = extraDays[id] ?? dias[id]
    for (const parte of Object.values(d?.partes ?? {})) for (const s of [...(parte.manana ?? []), ...(parte.tarde ?? [])]) if (s.lugar && s.modo !== 'camino' && s.tipo !== 'traslado') delViaje.add(s.lugar)
    if (d?.hereda_manana_de && dias[d.hereda_manana_de]) for (const s of dias[d.hereda_manana_de].partes?.unica?.manana ?? []) if (s.lugar && s.modo !== 'camino' && s.tipo !== 'traslado') delViaje.add(s.lugar)
  }
  for (const id of referencias) {
    for (const parte of Object.values(dias[id]?.partes ?? {})) {
      for (const s of [...(parte.manana ?? []), ...(parte.tarde ?? [])]) {
        if (!s.lugar || s.tipo === 'traslado' || s.modo !== 'dentro' || delViaje.has(s.lugar) || dejado.some((d) => d.lugar === s.lugar)) continue
        if ((x.nivelDe?.(s.lugar) ?? 3) > 1) continue
        dejado.push({ lugar: s.lugar, dia, parada: { tipo: 'parada', lugar: s.lugar, min: s.min, modo: s.modo ?? null, ...(s.titulo ? { titulo: s.titulo } : {}) }, motivo, de_dia: id })
      }
    }
  }
}

/**
 * ═══ CON EL FREE TOUR DE MAÑANA EN EL DÍA 1 (punto 7) ═══
 * El día 1 es el D3 con sus dos partes (la del Free Tour y la del Vaticano):
 *   · el D3 ENTERO si está libre antes del límite de su hora (`free_tour.entero_si_libre_antes`);
 *   · si no, pero libre al menos 30 min antes del tour: solo la PARTE DEL FREE TOUR; el día 2 es el del Vaticano y el día 3 el de la Roma antigua; todo se corre y se cae el último;
 *   · si el tour ya ha empezado: nada se reorganiza y sale el aviso de reservas contra el vuelo;
 *   · sin hora (el viajero solo lo marcó): la app elige la primera hora que le pille libre; si ya no hay ninguna ese día, el tour va el día siguiente a las 10:00.
 */
function decidirConFreeTour(x) {
  const { cfg, libre, entrada, medio, punto, publico, dias, extraDays, avisos, esMadrugada, dejado } = x
  const ft = cfg.free_tour
  const chosen0 = [...x.chosen]
  const tablaLen = chosen0.length
  const margen = ft.margen_min ?? 30
  const disponibilidad = x.destData.default_free_tour?.disponibilidad ?? {}
  const horasDelDia = (k) => {
    const dia = x.dia(k)
    if (!dia || dia.noTour) return []
    const mmdd = dia.dateIso ? String(dia.dateIso).slice(5) : null
    const especial = mmdd ? (disponibilidad.horas_especiales ?? []).find((r) => (r.fechas ?? []).includes(mmdd)) : null
    if (especial) return [...especial.horas]
    return FREE_TOUR_HORAS.filter((h) => h.franja !== 'noche').map((h) => h.hora)
  }
  const sinHora = !x.ftHora
  let hora = x.ftHora
  const cabe = (h) => libre < aMin(h) - margen // «libre antes de las 9:30» para el tour de las 10:00
  const entero = (h) => libre < aMin(ft.entero_si_libre_antes?.[h] ?? aHHMM(aMin(h) - margen))
  if (sinHora) hora = esMadrugada ? (horasDelDia(0).includes(x.destData.default_free_tour?.default_time) ? x.destData.default_free_tour.default_time : horasDelDia(0)[0] ?? null) : horasDelDia(0).find(cabe) ?? null
  const base = x.ftHora ? 'free_tour_con_hora' : 'free_tour_sin_hora'

  if (!hora) {
    // Ya no cabe ningún tour ese día: al día siguiente a las 10:00. El día 1 es la fila de la tabla para su hora (sin el D1 detrás), el día 2 el D3 entero y el día 3 el D1-FT.
    // Solo si ni el día 2 ni el día 3 tienen una reserva grande; si no, el tour no se pone y la hoja del resumen lo dice.
    const reservasEn = (k) => {
      const d = x.dia(k)
      if (!d) return false
      return (x.reservasGrandes ?? []).some((r) => r && r.name !== x.tourName && (d.dateIso && r.dateIso ? r.dateIso === d.dateIso : Number(r.dayNumber) === d.dayNumber))
    }
    const horasDia2 = horasDelDia(1)
    const diaOK = horasDia2.length > 0 && !reservasEn(1) && !(tablaLen >= 3 && reservasEn(2))
    if (!diaOK) {
      publico.caso = 'free_tour_no_se_pone'
      avisos.push({ tipo: 'free_tour_no_se_pone', campana: false, botones: ['de_acuerdo'], texto: 'Con tus vuelos, el Free Tour no cabe sin quitarte el Coliseo o el Vaticano. Si aun así lo quieres, añádelo desde «+ Añadir parada».' })
      // El viaje va con sus días de «Sin Free Tour» y la fila de la tabla: el motor lo vuelve a calcular sin el tour.
      return { aplica: true, reiniciarSinFreeTour: true, publico }
    }
    const fila = x.fila
    const listas = fila.listas ?? []
    const lista = fila.segun_zona ? listas.find((l) => dias[l.lista]?.inicio === x.inicioZona) ?? listas[0] : listas[0]
    if (!lista || !dias[lista.lista]) return { aplica: false, motivo: 'lista_sin_escribir' }
    const ops = { sin_ajustes: true, dia_llegada: true, empieza: empiezaDesde(libre) }
    if (fila.comida_al_llegar) ops.comida_al_llegar = { min: fila.comida_corta_min ?? 60, titulo: 'Comida, cerca de tu alojamiento' }
    conOps(dias, extraDays, lista.lista, ops)
    const chosen = [lista.lista, ...chosen0].slice(0, tablaLen)
    const diaCaido = { id: [lista.lista, ...chosen0].at(tablaLen), motivo: 'free_tour_el_dia_siguiente' }
    publico.caso = 'free_tour_dia_siguiente'
    publico.pasa_al_dia_2 = true
    const horaDia2 = horasDia2.includes(ft.sin_hora_dia_siguiente) ? ft.sin_hora_dia_siguiente : horasDia2[0]
    publico.free_tour = { hora: horaDia2, sin_hora: true, dia: 2 }
    avisos.push({ tipo: 'free_tour_puesto_al_llegar', dayNumber: 2, campana: false, botones: ['ver_disponibilidad'], texto: 'Hemos puesto el Free Tour el {dia:2}, nada más llegar. Al reservarlo, elige la hora que te encaje.' })
    publico.dia1 = { lista: lista.lista, nombre: dias[lista.lista]?.nombre ?? null, variante: null, comida_al_llegar: Boolean(ops.comida_al_llegar), sin_paradas: false, texto: null, inicio_ruta: dias[lista.lista]?.inicio ?? null, de_noche: aMin(fila.desde) >= 20 * 60 + 30 }
    publico.orden = chosen
    // (En un día de horas especiales —Nochebuena, Navidad…— el tour del día 2 es el de esas horas: la lista del D3 de esa hora.)
    return finalizar({ ...x, chosen, fijoPrimero: lista.lista, diaCaido, entradasApp: horaDia2 !== x.destData.default_free_tour?.default_time ? { 1: { [x.tourName]: horaDia2 } } : null })
  }

  publico.free_tour = { hora, sin_hora: sinHora, dia: 1 }
  const aviso = (tipo, texto, extra = {}) => avisos.push({ tipo, campana: true, botones: ['ver_reserva'], texto, ...extra })
  const dia3 = ft.dia
  if (esMadrugada || entero(hora)) {
    // El D3 entero, como sin vuelos.
    publico.caso = `${base}_entero`
    const entradasApp = sinHora && hora !== x.destData.default_free_tour?.default_time ? { 0: { [x.tourName]: hora } } : null
    if (sinHora) avisos.push({ tipo: 'free_tour_puesto_al_llegar', dayNumber: 1, campana: false, botones: ['ver_disponibilidad'], texto: 'Hemos puesto el Free Tour el {dia:1}, nada más llegar. Al reservarlo, elige la hora que te encaje.' })
    if (dias[dia3]) conOps(dias, extraDays, dia3, { dia_llegada: true })
    publico.dia1 = { lista: dia3, nombre: dias[dia3]?.nombre ?? null, variante: null, comida_al_llegar: false, sin_paradas: false, texto: null, inicio_ruta: null, de_noche: false }
    publico.orden = chosen0
    return finalizar({ ...x, chosen: chosen0, fijoPrimero: null, diaCaido: null, entradasApp })
  }
  // Con una reserva grande de otro sitio (los Museos, la Galería, el Coliseo) en cualquier día, el reparto de los días ya lo manda esa reserva: la llegada solo avisa y no cambia nada.
  // (También cuenta una reserva grande que llega solo en `entradas`, sin fecha: la petición de un solo día.)
  const otrasGrandes = (x.reservasGrandes ?? []).some((r) => r && r.name !== x.tourName && (r.dateIso || Number.isInteger(Number(r.dayNumber)))) || Object.keys(x.entradas ?? {}).some((nombre) => nombre !== x.tourName && x.sitioDe(nombre))
  if (libre <= aMin(hora) - margen && otrasGrandes) {
    publico.caso = `${base}_con_otras_reservas`
    publico.dia1 = { lista: dia3, nombre: dias[dia3]?.nombre ?? null, variante: null, comida_al_llegar: false, sin_paradas: false, texto: null, inicio_ruta: null, de_noche: false, sin_cambios: true }
    publico.orden = chosen0
    return finalizar({ ...x, chosen: chosen0, fijoPrimero: null, diaCaido: null, entradasApp: null })
  }
  if (libre <= aMin(hora) - margen) {
    // Solo la parte del Free Tour; el día 2 el del Vaticano y el día 3 el de la Roma antigua.
    publico.caso = `${base}_solo_la_parte_del_tour`
    const diaV = ft.dia_vaticano
    const diaR = ft.dia_roma_antigua
    if (!dias[diaV] || !dias[diaR]) return { aplica: false, motivo: 'faltan_dias_del_free_tour' }
    const nueva = [dia3, diaV, diaR, ...chosen0.slice(2)]
    const chosen = nueva.slice(0, tablaLen)
    const caidos = nueva.slice(tablaLen)
    const diaCaido = caidos.length ? { id: caidos.at(-1), motivo: 'el_dia_1_pasa_al_dia_2' } : { id: chosen0[1], motivo: 'dos_noches_free_tour' }
    const opsTour = { dia_llegada: true, sin_ajustes: true, quitar: ft.quitar_en_la_parte_del_tour ?? [], cena_y_noche_de: ft.cena_y_noche_de ?? null, empieza: empiezaDesde(libre) }
    // La comida al llegar si el tour es por la tarde (la comida va ANTES del tour); por la mañana o a mediodía, la del día, después.
    // (Pero la comida nunca empieza después de las 15:00: si el viajero llega más tarde, el día no lleva comida.)
    if (franjaDelFreeTour(hora) !== 'manana') {
      if (libre <= COMIDA_HASTA_MIN) opsTour.comida_al_llegar = { min: 60, titulo: 'Comida, cerca de tu alojamiento' }
      else opsTour.sin_comida = true
    }
    conOps(dias, extraDays, dia3, opsTour)
    publico.pasa_al_dia_2 = true
    x.diaCorrido = diaV
    if (sinHora) avisos.push({ tipo: 'free_tour_puesto_al_llegar', dayNumber: 1, campana: false, botones: ['ver_disponibilidad'], texto: 'Hemos puesto el Free Tour el {dia:1}, nada más llegar. Al reservarlo, elige la hora que te encaje.' })
    publico.dia1 = { lista: dia3, nombre: dias[dia3]?.nombre ?? null, variante: null, comida_al_llegar: Boolean(opsTour.comida_al_llegar), sin_paradas: false, texto: null, inicio_ruta: null, de_noche: false, solo_la_parte_del_tour: true }
    // Lo que se queda sin día (con 2 noches, la Roma antigua): a la mañana de la vuelta (gancho para el agente de la vuelta) y, mientras tanto, a «Si te sobra tiempo».
    if (chosen.length === 2) {
      dejarFuera(x, [diaR], chosen, { dia: 1 })
      for (const d of dejado) publico.hooks.vuelta.pendientes.push({ lugar: d.lugar, motivo: d.motivo, de_dia: d.de_dia })
    }
    publico.orden = chosen
    return finalizar({ ...x, chosen, fijoPrimero: dia3, diaCaido, entradasApp: sinHora ? { 0: { [x.tourName]: hora } } : null })
  }
  // El tour ya ha empezado cuando está libre: no se reorganiza nada. El Free Tour con su hora es una reserva del viajero: no se mueve y sale el aviso (campana).
  publico.caso = `${base}_ya_empezado`
  aviso('free_tour_antes_de_llegar', `Tu Free Tour es a las ${horaEnTexto(hora)} y ${verboMinusculas(medio)} a las ${horaEnTexto(entrada.hora)}: no te da tiempo. Revisa tu reserva.`, { sitio: x.tourName, hora_reserva: horaEnTexto(hora), hora_llegada: horaEnTexto(entrada.hora) })
  publico.dia1 = { lista: dia3, nombre: dias[dia3]?.nombre ?? null, variante: null, comida_al_llegar: false, sin_paradas: false, texto: null, inicio_ruta: null, de_noche: false, sin_cambios: true }
  publico.orden = chosen0
  return finalizar({ ...x, chosen: chosen0, fijoPrimero: null, diaCaido: null, entradasApp: null, noReorganiza: true, punto })
}

/** Lo último de cualquier decisión: el día que se cae, el resumen para la hoja y el gancho para el agente de la vuelta. */
function finalizar(x) {
  const { publico, avisos, resumen, dejado, chosen, diaCaido, entrada, medio, punto, esMadrugada, dias } = x
  if (diaCaido?.id) {
    publico.dia_caido = { id: diaCaido.id, nombre: dias[diaCaido.id]?.nombre ?? null, motivo: diaCaido.motivo }
    publico.hooks.vuelta.dia_caido = publico.dia_caido
    publico.hooks.vuelta.vuelve_como_dia_mas = diaCaido.id
  }
  publico.dejado_fuera = dejado
  // Para la hoja del resumen (punto 14): textos con {dia:N} (el número de día del viaje; las pantallas lo escriben con su fecha, «el mar 10»).
  resumen.push({ tipo: 'llegada', dayNumber: 1, texto: `El {dia:1} es tu llegada a ${x.destData.destination ?? 'tu destino'}.` })
  if (esMadrugada) resumen.push({ tipo: 'madrugada', dayNumber: 1, botones: ['cambiar_fechas', 'de_acuerdo'], texto: `${verboDeLlegada(medio, punto)} a las ${horaEnTexto(entrada.hora)} del {dia:1}: ese día lo tienes entero, y esa noche ya necesitas alojamiento. Si ${verboMinusculas(medio)} la noche del {dia:1}, cambia las fechas del viaje.` })
  if (publico.pasa_al_dia_2 && x.diaCorrido && chosen.length > 1) {
    resumen.push({ tipo: 'dia_corrido', dayNumber: 2, dia_id: x.diaCorrido, texto: `Como llegas ${aMin(x.fila.desde) >= 20 * 60 + 30 ? 'de noche' : 'por la tarde'}, ${fraseDeDia(dias[x.diaCorrido]?.nombre, x.diaCorrido)} pasa al {dia:2}.` })
  }
  if (diaCaido?.id) {
    // (Si el día que se cae lleva un sitio grande, la hoja dice que su reserva lo vuelve a poner: «si reservas la Galería, te ponemos su día».)
    const sitio = x.sitios.find((s) => (s.dias ?? []).includes(diaCaido.id) && s.nombre !== x.tourName)
    const final = sitio ? `si reservas ${x.nombreCorto(sitio.nombre)}, te ponemos su día.` : 'si lo quieres, puedes añadirlo desde «+ Añadir parada».'
    const frase = fraseDeDia(dias[diaCaido.id]?.nombre, diaCaido.id)
    const mayuscula = `${frase.charAt(0).toUpperCase()}${frase.slice(1)}`
    resumen.push({ tipo: 'dia_caido', dia_id: diaCaido.id, texto: `${mayuscula} ${/ y /.test(frase) ? 'no caben' : 'no cabe'} en tu viaje: ${final}` })
  }
  // El aviso de lo que se queda en «Si te sobra tiempo»: uno por entrada que se compra (el Coliseo y el Foro van juntos), nunca por cada parada.
  const entradasAvisadas = new Set()
  for (const d of dejado) {
    const entradaDe = (x.destData.entradas_reservas ?? []).find((e) => (e.lugares ?? []).includes(d.lugar))
    if (!entradaDe || entradasAvisadas.has(entradaDe.nombre)) continue
    entradasAvisadas.add(entradaDe.nombre)
    const corto = x.nombreCorto(entradaDe.nombre)
    avisos.push({ tipo: 'sitio_en_si_te_sobra', lugar: entradaDe.nombre, dayNumber: d.dia ?? 1, campana: false, botones: ['de_acuerdo'], texto: `${corto.charAt(0).toUpperCase()}${corto.slice(1)} lo tienes en «Si te sobra tiempo» del {dia:${d.dia ?? 1}}: si reservas la entrada, te lo ponemos en el día.` })
  }
  // Lo que se deja fuera viaja con el día que lo recibe: `sobra_extra` (nunca restaurantes ni nocturnas: solo paradas).
  if (dejado.length > 0) {
    for (const dia of [1, 2]) {
      const delDia = dejado.filter((d) => (d.dia ?? 1) === dia)
      if (delDia.length === 0) continue
      const id = chosen[Math.min(dia - 1, chosen.length - 1)]
      conOps(dias, x.extraDays, id, { sobra_extra: delDia.map((d) => ({ ...d.parada, por_llegada: true })) })
    }
  }
  return {
    aplica: true, chosen, fijoPrimero: x.fijoPrimero ?? null, extraDays: x.extraDays, entradasApp: x.entradasApp ?? null, publico,
    noReorganiza: x.noReorganiza === true,
  }
}
