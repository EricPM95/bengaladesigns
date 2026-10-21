/**
 * EL SERVICIO DE LOGROS (Tanda 8A): une el cerebro (motor.js, puro) con la base de datos. Todo lo decide el servidor, nunca el móvil.
 *
 * El móvil manda HECHOS: el Visto con su hora y la ubicación de ese momento, y los datos de la foto leídos en el móvil. Aquí se decide qué valen, se guardan
 * (solo la decisión, nunca las coordenadas) y se concede lo que toque, comparando lo ganado ANTES y DESPUÉS del hecho. Como de los hechos se puede volver a
 * calcular todo (`recalcular`), si cambian los datos nada se descuadra; y como cada cosa ganada tiene una clave única, nunca se da dos veces lo mismo.
 *
 * Habla con la base de datos a través de un `repo` (server/logros/repo.js para Supabase; la prueba usa uno de PGlite), así la lógica se prueba entera.
 * No toca el motor de rutas.
 */

import { libreDeLlegada } from '../../shared/routeEngine/llegadaDia1.js'
import { datosDeVuelta } from '../../shared/routeEngine/vueltaDia.js'
import { GLOBAL, avanceViajero, calcular, clave, diferencia, diasEntre, logroActivo, parteLocal, sumarDias } from './motor.js'
import { calcularExp, entraEnElSorteo, expDeMomento, expFinal, resumenDeExp, viajesAcabados } from './exp.js'
import { coordenadasDeSitio, nombreDeSitio } from './datos.js'
import { dondeEstoy, evaluarFoto, evaluarVisto } from './fotos.js'
import { armarMomentos } from './momentos.js'
import { diaSiguienteDePrueba, estadoDePrueba, puedeGanarLogros, precioDelPase, tocaPreguntar } from './pase.js'
import { clavesSuperadas, vitrinaDeGanados } from './pantallas/ganados.js'
import { coleccionesDeSitio, estadoDestino, logrosVisibles, pasaporte, pendientes, resumen, sitiosDeLaRuta } from './vistas.js'

const CON_QUIEN = { solo: 'solo', couple: 'pareja', group: 'amigos', family: 'familia' }

/** Una parada de la ruta cuenta para los logros si es una visita de verdad (no una pausa, un rato libre, un paseo ni una parada cerrada ese día). */
function cuentaComoParada(stop) {
  return !(stop.isBreak || stop.isFreeTime || stop.isFreeWalk || stop.isZoneWalk || stop.passThrough || stop.closedThisDay)
}

/** El sitio (id del catálogo) de una parada de la ruta, por su nombre. «Coliseo (noche)» es el Coliseo. */
export function sitioDeParada(stop, catalogo) {
  const nombre = String(stop.name ?? '').replace(/\s*\((noche|por fuera)\)\s*$/i, '').trim()
  return (catalogo.places ?? []).find((p) => p.name === nombre)?.id ?? null
}

const esHora = (h) => /^\d{1,2}:\d{2}$/.test(String(h ?? ''))

/**
 * La hora a la que queda libre el viajero el día de llegada y la hora a la que tiene que salir el último día, según el motor (solo se LEEN sus funciones, no se toca el motor):
 *   - llegada: `libreDeLlegada` = hora de llegada + traslado del punto (Fiumicino 60 min, Ciampino 50, Termini 15…) + 30 de maleta;
 *   - vuelta: `datosDeVuelta` = hora del billete − lo que hay que salir antes (Fiumicino 3 h, Ciampino 2 h 50, tren 45 min…).
 * Devuelve { llegada, vuelta, libre_llegada_min, libre_origen, salir_min, salir_origen }; el origen es 'motor' o 'respaldo' (el motor no da la hora: sin plan de llegada, en coche, sin datos…).
 */
export function horasDelViaje(route, destino, catalogo) {
  const a = route?.answers ?? {}
  const entradaDelPlan = a.planLlegada?.entrada
  const llegada = esHora(entradaDelPlan?.hora) ? entradaDelPlan.hora : esHora(a.arrivalFlightTime) ? a.arrivalFlightTime : null
  const vuelta = esHora(a.planVuelta?.hora) ? a.planVuelta.hora : esHora(a.departureFlightTime) ? a.departureFlightTime : null
  const info = { llegadaInfo: destino.llegadaInfo ?? null }
  let libre = null
  if (llegada) libre = libreDeLlegada(catalogo, info, { hora: llegada, medio: entradaDelPlan?.medio ?? 'avion', puntoId: entradaDelPlan?.punto_id ?? a.arrivalPointId ?? null })
  let salir = null
  if (vuelta && destino.llegadaInfo) {
    const d = datosDeVuelta({ modo: a.planVuelta?.medio ?? a.returnTransportOptionId ?? 'avion', hora: vuelta, puntoId: a.departurePointId ?? null }, destino.llegadaInfo)
    if (d && Number.isFinite(d.horaMin) && Number.isFinite(d.margen)) salir = d.horaMin - d.margen
  }
  return { llegada, vuelta, libre_llegada_min: libre, libre_origen: llegada ? (libre != null ? 'motor' : 'respaldo') : null, salir_min: salir, salir_origen: vuelta ? (salir != null ? 'motor' : 'respaldo') : null }
}

/**
 * El viaje tal como lo necesita el cerebro: destino, fechas, con quién, y las paradas de cada día (sin «Si te sobra tiempo» ni «Cerrado este día»).
 * Devuelve null si el viaje no tiene fechas o su destino no tiene logros: ahí no se gana nada («Solo en las fechas del viaje»).
 */
export function contextoDeViaje({ id, route }, datos, catalogos, { esDuo = false } = {}) {
  const rango = route?.answers?.dateRange
  const destino = Object.values(datos.destinos).find((d) => d.destino.toLowerCase() === String(route?.destination ?? '').trim().toLowerCase())
  if (!rango?.start || !rango?.end || !destino) return null
  const catalogo = catalogos[destino.clave]
  const dias = (route.days ?? []).map((dia) => ({
    numero: dia.dayNumber,
    fecha: sumarDias(rango.start, dia.dayNumber - 1),
    paradas: (dia.stops ?? []).filter(cuentaComoParada).map((s) => ({ stop_id: s.id, sitio: sitioDeParada(s, catalogo), nombre: s.name })),
  }))
  return {
    id,
    destino: destino.clave,
    inicio: rango.start,
    fin: rango.end,
    // Con el Pase Dúo, el viaje es «en pareja» para los dos.
    con_quien: esDuo ? 'pareja' : (CON_QUIEN[route?.answers?.companion] ?? null),
    // Las horas del billete (si las puso) y, de ellas, cuándo queda libre el día de llegada y cuándo hay que salir el último día: las MISMAS que calcula el motor para la ruta (según
    // el aeropuerto, la estación y el medio). De ahí sale el día de prueba de HOY. Si el motor no da la hora, se usan los respaldos de data/pase/ajustes.json (`libre_origen`).
    ...horasDelViaje(route, destino, catalogo),
    origen_pais: null,
    dias,
  }
}

export function crearServicioLogros({ repo, datos, catalogos, ahora = () => new Date(), cobro = false, azar = Math.random }) {
  const sitioInfo = (destino, sitio) => {
    const d = datos.destinos[destino]
    const dato = d.sitios[sitio] ?? null
    const coords = coordenadasDeSitio(catalogos, destino, sitio)
    return { coords, radio_m: dato?.radio_m ?? 150, dato, nombre: nombreDeSitio(catalogos, destino, sitio) }
  }
  const hoyEn = (destino) => parteLocal(ahora(), datos.destinos[destino].timezone).fecha

  /** Todo lo de una persona que hace falta para calcular. */
  async function cargar(userId) {
    const [hechos, filas, logros, cuenta, pionero, probador] = await Promise.all([repo.hechosDe(userId), repo.viajesDe(userId), repo.logrosDe(userId), repo.cuentaDe(userId), repo.ordenPionero(userId), repo.probadorDe(userId)])
    const viajes = {}
    for (const fila of filas) {
      const ctx = contextoDeViaje(fila, datos, catalogos, { esDuo: fila.es_duo === true })
      if (ctx) viajes[fila.id] = ctx
    }
    // (8C1) La EXP que ya tenía (nunca baja) y los amigos que ha invitado.
    const [perfil, referidos] = await Promise.all([repo.perfilDe(userId), repo.referidosDe ? repo.referidosDe(userId) : []])
    return { hechos, viajes, logros, cuenta, pionero, probador, perfil, referidos }
  }
  const calcularCon = (c, hechos = c.hechos, pionero = c.pionero) => calcular({ datos, hechos, viajes: c.viajes, cuenta: c.cuenta, ahora: ahora(), pionero, probador: aIso(c.probador) })
  const aMapa = (filas) => new Map(filas.map((f) => [clave(f.destino, f.logro, f.escalon), f]))
  const aIso = (v) => (v instanceof Date ? v.toISOString() : v)
  /** Lo ganado (filas de la base) como el cerebro lo entiende: clave → { logro, escalon, destino, trip_id, en }. */
  const aItems = (logros) => new Map(logros.filter((f) => logroActivo(datos, f.logro)).map((f) => [clave(f.destino, f.logro, f.escalon), { clave: clave(f.destino, f.logro, f.escalon), logro: f.logro, escalon: String(f.escalon), destino: f.destino, trip_id: f.trip_id ?? null, en: aIso(f.ganado_en), animacion_vista: f.animacion_vista }]))

  /** Concede lo nuevo (ya calculado) guardándolo; devuelve solo lo que de verdad se ha insertado (nunca da dos veces lo mismo). */
  async function conceder(userId, nuevos, extra = {}) {
    if (nuevos.length === 0) return []
    const filas = nuevos.map((it) => ({ logro: it.logro, escalon: it.escalon, destino: it.destino, trip_id: it.trip_id, ganado_en: it.en, ...(extra[it.clave] ?? {}) }))
    const insertadas = await repo.insertarLogros(userId, filas)
    const claves = new Set(insertadas.map((f) => clave(f.destino, f.logro, f.escalon)))
    return nuevos.filter((it) => claves.has(it.clave))
  }

  /** Lo que hay que enseñar tras un hecho: lo nuevo, con su frase de suspense (solo la primera vez). */
  async function respuestaDeNuevos(userId, antes, despues, c, hechosDespues = c.hechos) {
    const nuevos = diferencia(antes, despues, datos.ajustes)
    const ultima = await repo.ultimaFrase(userId)
    const momentos = armarMomentos({ datos, nuevos, despues, antes, ultimaFrase: ultima, azar })
    const frases = Object.fromEntries(momentos.filter((m) => m.tipo === 'emblema').map((m) => [m.clave, { frase: m.frase }]))
    const concedidos = await conceder(userId, nuevos, frases)
    const claves = new Set(concedidos.map((it) => it.clave))
    // Lo que ya estaba guardado (por ejemplo, ganado antes de que cambiaran los datos) no se enseña otra vez.
    const mostrados = momentos.filter((m) => !m.clave || claves.has(m.clave))
    // (8C1) La EXP de cada momento y si con ella se sube de nivel (la pantalla de subir de nivel llegará con Design). La EXP de las paradas vistas y de los viajes acabados,
    // que no son momentos, va delante. Nunca baja: se cuenta contra lo mayor entre lo calculado y lo que ya estaba guardado.
    const guardada = c.perfil?.exp_max ?? 0
    const total0 = expFinal(expCalculada(c, antes, c.hechos).total, guardada)
    const total1 = expFinal(expCalculada(c, despues, hechosDespues).total, guardada)
    if (total1 > guardada) await guardarMaximo(userId, total1)
    const salida = mostrados.map(({ cat: _cat, ...m }) => ({ ...m, exp: expDeMomento(datos, m) }))
    const deMomentos = salida.reduce((s, m) => s + m.exp, 0)
    let acumulado = total0 + Math.max(0, total1 - total0 - deMomentos)
    let nivelPrevio = resumenDeExp(total0, datos.exp).nivel
    let sube = resumenDeExp(acumulado, datos.exp).nivel > nivelPrevio
    nivelPrevio = resumenDeExp(acumulado, datos.exp).nivel
    for (const m of salida) {
      acumulado += m.exp
      const n = resumenDeExp(acumulado, datos.exp).nivel
      m.sube_de_nivel = n > nivelPrevio
      sube ||= m.sube_de_nivel
      nivelPrevio = n
    }
    const exp = { ganada: Math.max(0, total1 - total0), antes: resumenDeExp(total0, datos.exp), despues: resumenDeExp(total1, datos.exp), sube_de_nivel: resumenDeExp(total1, datos.exp).nivel > resumenDeExp(total0, datos.exp).nivel }
    return { nuevos: salida, exp }
  }

  /** Guarda la mayor EXP (0025). Sin la migración aplicada no se puede guardar: no es grave, la EXP se calcula igual desde los hechos. */
  async function guardarMaximo(userId, total) {
    try {
      await repo.guardarPerfil(userId, { exp_max: total })
    } catch (error) {
      console.warn('[logros] no se ha podido guardar la EXP máxima (¿falta la migración 0025?):', error.message)
    }
  }

  /** Apunta que `invitadorId` invitó a `invitadoId` (solo el primero, nunca uno mismo). Todavía no hay enlace de invitación que llame a esto: ver el informe de la 8C1. */
  async function registrarInvitacion(invitadorId, invitadoId) {
    if (!repo.apuntarInvitacion) return { ok: false, motivo: 'sin_migracion' }
    const hecho = await repo.apuntarInvitacion(invitadorId, invitadoId)
    return { ok: hecho }
  }

  /**
   * Si esta persona fue invitada y ya ha acabado su primer viaje con la app, lo apunta (en ese momento el que la invitó gana sus 100 EXP, con el tope anual).
   * Crear la cuenta NO cuenta; solo acabar el primer viaje (el mismo «viaje acabado» de la EXP: 5 paradas vistas o más y el último día ya pasado).
   */
  async function resolverInvitacion(invitadoId, c) {
    if (!repo.invitadorDe) return { ok: true, cumplida: false }
    const fila = await repo.invitadorDe(invitadoId)
    if (!fila || fila.viaje_acabado_en) return { ok: true, cumplida: Boolean(fila?.viaje_acabado_en) }
    const acabados = viajesAcabados({ datos, hechos: c.hechos, viajes: c.viajes, ahora: ahora() }).sort((a, b) => a.fin.localeCompare(b.fin))
    if (acabados.length === 0) return { ok: true, cumplida: false }
    await repo.marcarInvitacionCumplida(invitadoId, `${acabados[0].fin}T23:59:59Z`)
    return { ok: true, cumplida: true }
  }

  /** Lo calculado ahora (de los hechos y lo ganado): total, por año y cada EXP con su fecha. */
  const expCalculada = (c, items, hechos) => calcularExp({ datos, items, hechos, viajes: c.viajes, ahora: ahora(), referidos: c.referidos ?? [] })

  /** La EXP de una cuenta: lo calculado, sin bajar nunca de lo que ya tenía guardado. */
  async function expDe(userId) {
    const c = await cargar(userId)
    const calculado = expCalculada(c, calcularCon(c), c.hechos)
    const guardada = c.perfil?.exp_max ?? 0
    const total = expFinal(calculado.total, guardada)
    if (total > guardada) await guardarMaximo(userId, total)
    await resolverInvitacion(userId, c)
    return { ok: true, ...resumenDeExp(total, datos.exp), por_anio: calculado.por_anio, calculada: calculado.total, guardada_antes: guardada }
  }

  /** El sorteo de un año (solo la regla): quién entra, entre las cuentas dadas. Sin nombres ni correos: solo el id de cada cuenta. */
  async function sorteoDe(anio, userIds) {
    const lista = []
    for (const id of userIds) {
      const c = await cargar(id)
      const items = calcularCon(c)
      const total = expFinal(expCalculada(c, items, c.hechos).total, c.perfil?.exp_max ?? 0)
      const acabados = viajesAcabados({ datos, hechos: c.hechos, viajes: c.viajes, ahora: ahora() }).filter((v) => v.fin.slice(0, 4) === String(anio)).length
      const entra = entraEnElSorteo({ exp: total, viajesAcabadosDelAnio: acabados, tabla: datos.exp })
      lista.push({ user_id: id, exp: total, nivel: resumenDeExp(total, datos.exp).nivel, viajes_acabados: acabados, entra })
    }
    return { ok: true, anio: Number(anio), cuentas: lista.length, entran: lista.filter((x) => x.entra).length, lista: lista.filter((x) => x.entra) }
  }

  /** Lo que tiene un sitio por ganar (sin decir qué emblema): para que la tarjeta del Visto sepa cuál enseñar. Solo se LEE; no cambia nada. */
  function queHayEn(c, viaje, sitio) {
    if (!sitio) return { sitio_nombre: null, hay_pedazo: false, hay_emblema: false, foto_dentro: null }
    const d = datos.destinos[viaje.destino]
    const items = aItems(c.logros)
    return {
      sitio_nombre: nombreDeSitio(catalogos, viaje.destino, sitio),
      hay_pedazo: d.colecciones.some((x) => x.sitios.includes(sitio) && !items.get(clave(viaje.destino, 'pedazo', x.id + ':' + sitio))),
      hay_emblema: d.emblemas.some((e) => e.sitio === sitio && !items.get(clave(viaje.destino, 'emblema', e.id))),
      foto_dentro: d.sitios[sitio]?.foto_dentro ?? null,
    }
  }

  /** La hora local de un instante (o de ahora) en el destino. */
  const horaLocalDe = (destino, instante = ahora()) => parteLocal(instante, datos.destinos[destino].timezone)

  /** En qué punto está la prueba de HOY de esta cuenta: UNA por cuenta, para siempre. */
  async function pruebaDeLaCuenta(userId, c) {
    const fila = await repo.pruebaDe(userId)
    const viajes = Object.values(c.viajes)
    const hoy = viajes.length > 0 ? horaLocalDe(viajes[0].destino).fecha : ahora().toISOString().slice(0, 10)
    return { fila, prueba: estadoDePrueba({ fila, viajes, hoy, ajustes: datos.pase.ajustes }), hoy }
  }

  const gastarPrueba = (userId, viaje, fecha, prueba) =>
    repo.guardarPrueba(userId, { trip_id: viaje.id, fecha, gastada_en: ahora().toISOString(), pospuesta: false, pregunta_hecha: prueba.pregunta_hecha })

  /**
   * ¿Puede esta cuenta ganar logros ese día en ese viaje? Con `usar` (un Visto o «Cómo llegar»: usar HOY de verdad) la prueba se GASTA aquí, salvo que toque la pregunta de las 12:00.
   * `usar.minutosLocales`: la hora local del USO (la del Visto, no la de llegada); `usar.enLinea`: false si el Visto llega cuando ya ha pasado ese día: entonces no se pregunta, se gasta.
   */
  /** «Verme como viajero sin pase» (Tanda 10B, solo pruebas del administrador): la cuenta se trata como la de alguien que no ha comprado el pase. Sin la tabla o sin la función del repo, apagado. */
  const sinPaseDe = async (userId) => (typeof repo.sinPaseDe === 'function' ? Boolean(await repo.sinPaseDe(userId)) : false)

  async function puedeGanar(userId, c, viaje, fecha, usar = null) {
    if (await sinPaseDe(userId)) return { puede: false, motivo: 'sin_pase_prueba' }
    if (!cobro) return { puede: true, motivo: 'cobro_apagado' }
    const pases = await repo.pasesDe(userId)
    const { prueba } = await pruebaDeLaCuenta(userId, c)
    const r = puedeGanarLogros({ cobro, destino: viaje.destino, tripId: viaje.id, fecha, pases, prueba })
    if (!r.puede || !usar || r.motivo !== 'dia_de_prueba' || r.gastada) return r
    const hayManana = diaSiguienteDePrueba(viaje, fecha) != null
    if (usar.enLinea !== false && hayManana && tocaPreguntar({ prueba, hoy: fecha, minutosLocales: usar.minutosLocales, ajustes: datos.pase.ajustes })) {
      return { puede: false, motivo: 'pregunta_medio_dia', pregunta: datos.pase.ajustes.pregunta }
    }
    await gastarPrueba(userId, viaje, fecha, prueba)
    return { puede: true, motivo: 'dia_de_prueba', gastada: true, recien_gastada: true }
  }

  /* ── Un Visto ── */
  async function visto(userId, { trip_id, sitio = null, nombre = null, stop_id = null, instante, ubicacion = null, recibido_en = null }) {
    const c = await cargar(userId)
    const viaje = c.viajes[trip_id]
    if (!viaje) return { ok: false, motivo: 'viaje_sin_fechas', mensaje: 'Este viaje no tiene fechas: los logros se ganan en las fechas del viaje.', nuevos: [] }
    // El móvil puede mandar el nombre de la parada en vez del id del catálogo: el servidor lo busca.
    if (!sitio && nombre) sitio = sitioDeParada({ name: nombre }, catalogos[viaje.destino])
    if (!sitio && !stop_id) return { ok: false, motivo: 'faltan_datos', nuevos: [] }
    const recibido = recibido_en ?? ahora().toISOString()
    const hay = queHayEn(c, viaje, sitio)
    const info = sitio ? sitioInfo(viaje.destino, sitio) : { coords: null, radio_m: 150, nombre: stop_id }
    const e = evaluarVisto({ instante, recibidoEn: recibido, ubicacion, sitio: info, viaje, destino: datos.destinos[viaje.destino], nombreSitio: info.nombre, ajustes: datos.ajustes })
    if (!e.cuenta) return { ok: true, cuenta: false, motivo: e.motivo, mensaje: e.mensaje, ubic: e.ubic, ...hay, nuevos: [] }
    const fecha = parteLocal(instante, datos.destinos[viaje.destino].timezone).fecha
    const ya = c.hechos.find((h) => h.tipo === 'visto' && !h.deshecho_en && h.trip_id === trip_id && (stop_id ? h.stop_id === stop_id : h.sitio === sitio))
    if (ya) return { ok: true, cuenta: true, repetido: true, ubic: ya.ubic, ...hay, nuevos: [] }
    // Usar HOY de verdad (tocar [Visto]) es lo que gasta el día de prueba.
    // Cuenta la hora del Visto, no la de llegada (sin cobertura, llega más tarde). Si esa hora es de las 12:00 en adelante y es la primera vez, se hace la pregunta cuando llegue,
    // siempre que llegue el MISMO día (todavía puede contestar). Si ya ha pasado ese día, se gasta la prueba directamente.
    const loc = horaLocalDe(viaje.destino, instante)
    const enLinea = horaLocalDe(viaje.destino, recibido).fecha === fecha
    const pase = await puedeGanar(userId, c, viaje, fecha, { minutosLocales: loc.minutos, enLinea })
    if (pase.motivo === 'pregunta_medio_dia') return { ok: true, cuenta: false, motivo: 'pregunta_medio_dia', pregunta: pase.pregunta, ubic: e.ubic, ...hay, nuevos: [] }
    if (!pase.puede) return { ok: true, cuenta: false, motivo: pase.motivo, mensaje: null, ubic: e.ubic, ...hay, nuevos: [] }
    const antes = calcularCon(c)
    const fila = await repo.insertarHecho({ user_id: userId, trip_id, destino: viaje.destino, tipo: 'visto', sitio, stop_id, instante, recibido_en: recibido, ubic: e.ubic, valido: true, motivo: e.motivo, inicio: viaje.inicio, fin: viaje.fin })
    const despues = calcularCon(c, [...c.hechos, fila], await repo.ordenPionero(userId))
    const { nuevos, exp } = await respuestaDeNuevos(userId, antes, despues, c, [...c.hechos, fila])
    return { ok: true, cuenta: true, ubic: e.ubic, aviso: e.mensaje, sitio, ...queHayEn(c, viaje, sitio), hay_pedazo: hay.hay_pedazo && !nuevos.some((m) => m.tipo === 'suma'), nuevos, exp, id: fila.id }
  }

  /* ── Una foto ── */
  async function foto(userId, { trip_id, sitio = null, nombre = null, stop_id = null, origen, tomada_en = null, con_camara = false, ubicacion = null, de_amigo = false, foto_id = null, recibido_en = null }) {
    const c = await cargar(userId)
    const viaje = c.viajes[trip_id]
    if (!viaje) return { ok: false, motivo: 'viaje_sin_fechas', mensaje: 'Este viaje no tiene fechas: los logros se ganan en las fechas del viaje.', nuevos: [] }
    if (!sitio && nombre) sitio = sitioDeParada({ name: nombre }, catalogos[viaje.destino])
    if (!sitio) return { ok: false, motivo: 'faltan_datos', nuevos: [] }
    const recibido = recibido_en ?? ahora().toISOString()
    const info = sitioInfo(viaje.destino, sitio)
    const e = evaluarFoto({ origen, tomadaEn: tomada_en, conCamara: origen === 'app' ? true : Boolean(con_camara), ubicacion, sitio: info, viaje, destino: datos.destinos[viaje.destino], nombreSitio: info.nombre, recibidoEn: recibido, ajustes: datos.ajustes })
    void de_amigo // (la foto de un amigo del grupo vale igual: no se mira quién la hizo)
    if (!e.valida) return { ok: true, valida: false, motivo: e.motivo, mensaje: e.mensaje, nuevos: [] }
    // Una foto de la galería se sube cuando se tiene acceso (el día de prueba o con el pase): la fecha que cuenta es la del día en que se sube («Lo de ayer también cuenta»).
    const fecha = origen === 'galeria' ? horaLocalDe(viaje.destino, recibido).fecha : parteLocal(e.instante, datos.destinos[viaje.destino].timezone).fecha
    const pase = await puedeGanar(userId, c, viaje, fecha)
    if (!pase.puede) return { ok: true, valida: true, cuenta: false, motivo: pase.motivo, nuevos: [] }
    const antes = calcularCon(c)
    const fila = await repo.insertarHecho({ user_id: userId, trip_id, destino: viaje.destino, tipo: 'foto', sitio, stop_id, instante: e.instante, recibido_en: recibido, ubic: e.ubic, valido: true, origen, foto_id, inicio: viaje.inicio, fin: viaje.fin })
    const despues = calcularCon(c, [...c.hechos, fila], await repo.ordenPionero(userId))
    const { nuevos, exp } = await respuestaDeNuevos(userId, antes, despues, c, [...c.hechos, fila])
    return { ok: true, valida: true, cuenta: true, nuevos, exp, id: fila.id }
  }

  /* ── El pase y la prueba de HOY ── */

  /** Lo que necesita HOY para saber qué enseñar: si puede usarse, y si no, la tarjeta del pase (la pantalla 12 de Design, sin alertas). */
  async function estadoDelPase(userId, tripId = null) {
    // Con «Verme como viajero sin pase» encendido: cobro puesto, sin pase y con la prueba ya gastada (lo de pago, cerrado; la tarjeta del pase, abierta).
    if (await sinPaseDe(userId)) {
      return {
        ok: true,
        cobro: true,
        sin_pase_prueba: true,
        pases: [],
        prueba: { estado: 'gastada', trip_id: null, fecha: null, motivo: 'sin_pase_prueba', ya_usada: true },
        hoy: { puede: false, motivo: 'sin_pase_prueba', tarjeta: 'pase' },
        precios: datos.pase.precios,
      }
    }
    const c = await cargar(userId)
    const viaje = tripId ? c.viajes[tripId] : null
    const pases = await repo.pasesDe(userId)
    const { prueba } = await pruebaDeLaCuenta(userId, c)
    const hoy = viaje ? horaLocalDe(viaje.destino).fecha : null
    const acceso = viaje ? puedeGanarLogros({ cobro, destino: viaje.destino, tripId: viaje.id, fecha: hoy, pases, prueba }) : { puede: !cobro, motivo: cobro ? 'sin_viaje' : 'cobro_apagado' }
    return {
      ok: true,
      cobro,
      pases: pases.map((p) => ({ id: p.id, destino: p.destino, tipo: p.tipo })),
      prueba: { estado: prueba.estado, trip_id: prueba.trip_id ?? null, fecha: prueba.fecha ?? null, motivo: prueba.motivo ?? null, ya_usada: prueba.estado === 'gastada' },
      hoy: { puede: acceso.puede, motivo: acceso.motivo, tarjeta: acceso.puede ? null : 'pase' },
      precios: datos.pase.precios,
    }
  }

  /** Usar HOY de verdad sin tocar [Visto]: «Cómo llegar». Gasta la prueba (o pregunta lo de las 12:00). */
  async function usarHoy(userId, { trip_id, motivo = 'como_llegar' }) {
    const c = await cargar(userId)
    const viaje = c.viajes[trip_id]
    if (!viaje) return { ok: false, motivo: 'viaje_sin_fechas' }
    const loc = horaLocalDe(viaje.destino)
    const r = await puedeGanar(userId, c, viaje, loc.fecha, { minutosLocales: loc.minutos })
    if (r.motivo === 'pregunta_medio_dia') return { ok: true, acceso: false, motivo: r.motivo, pregunta: r.pregunta }
    return { ok: true, acceso: r.puede, motivo: r.motivo, uso: motivo, tarjeta: r.puede ? null : 'pase' }
  }

  /** La respuesta a «Te queda medio día…»: [Hoy] gasta la prueba hoy; [Mañana] la pasa al día siguiente (si queda alguno). Se pregunta una sola vez. */
  async function responderPrueba(userId, { trip_id, respuesta }) {
    const c = await cargar(userId)
    const viaje = c.viajes[trip_id]
    if (!viaje) return { ok: false, motivo: 'viaje_sin_fechas' }
    const { prueba } = await pruebaDeLaCuenta(userId, c)
    const hoy = horaLocalDe(viaje.destino).fecha
    if (prueba.estado !== 'pendiente' || prueba.trip_id !== trip_id || prueba.fecha !== hoy) return { ok: false, motivo: 'no_hay_pregunta' }
    if (prueba.pregunta_hecha) return { ok: false, motivo: 'ya_respondida' }
    if (respuesta === 'hoy') {
      await repo.guardarPrueba(userId, { trip_id, fecha: hoy, gastada_en: ahora().toISOString(), pospuesta: false, pregunta_hecha: true })
      return { ok: true, respuesta, prueba: { estado: 'gastada', fecha: hoy }, reenviar_vistos: true }
    }
    if (respuesta === 'manana') {
      const siguiente = diaSiguienteDePrueba(viaje, hoy)
      if (!siguiente) return { ok: false, motivo: 'no_hay_manana' }
      await repo.guardarPrueba(userId, { trip_id, fecha: siguiente, gastada_en: null, pospuesta: true, pregunta_hecha: true })
      return { ok: true, respuesta, prueba: { estado: 'pendiente', fecha: siguiente }, lo_de_hoy: 'Lo de hoy se gana mañana con «Lo de ayer también cuenta», con las fotos de la galería.' }
    }
    return { ok: false, motivo: 'respuesta_rara' }
  }

  /** El precio de un pase y quién lo paga (todo el que compra). */
  function precioDe(plan, personas) {
    const p = precioDelPase(datos.pase.precios, plan, personas)
    return p ? { ok: true, ...p, paga: 'el_que_compra' } : { ok: false, motivo: 'plan_raro' }
  }

  /* ── Deshacer ── */
  async function deshacer(userId, { trip_id, sitio = null, stop_id = null }) {
    const c = await cargar(userId)
    const h = c.hechos.find((x) => x.tipo === 'visto' && !x.deshecho_en && x.trip_id === trip_id && (stop_id ? x.stop_id === stop_id : x.sitio === sitio))
    if (!h) return { ok: true, nada: true, quitados: [] }
    // Con una foto ya no se quita nunca: lo ganado con una foto se queda.
    const hayFoto = c.hechos.some((x) => x.tipo === 'foto' && !x.deshecho_en && x.trip_id === trip_id && x.sitio && x.sitio === h.sitio)
    if (hayFoto) return { ok: false, motivo: 'con_foto', mensaje: 'Esta parada ya tiene una foto: lo ganado con ella se queda.', quitados: [] }
    const antes = calcularCon(c)
    await repo.deshacerHecho(h.id, ahora().toISOString())
    const despues = calcularCon(c, c.hechos.filter((x) => x.id !== h.id))
    const quitados = [...antes.values()].filter((it) => !despues.has(it.clave))
    await repo.borrarLogros(userId, quitados.map((it) => ({ destino: it.destino, logro: it.logro, escalon: it.escalon })))
    return { ok: true, quitados: quitados.map((it) => ({ clave: it.clave, logro: it.logro, escalon: it.escalon, destino: it.destino })) }
  }

  /* ── Volver a calcular todo desde los hechos ── */
  async function recalcular(userId, { aplicar = true } = {}) {
    const c = await cargar(userId)
    const calculado = calcularCon(c)
    const guardado = aMapa(c.logros)
    const faltan = [...calculado.values()].filter((it) => !guardado.has(it.clave))
    const sobran = [...guardado.values()].filter((f) => !calculado.has(clave(f.destino, f.logro, f.escalon)) && f.logro !== 'viajero:probador')
    // Solo se añade lo que falta; lo que sobra se enseña (por ejemplo, si cambian los datos) pero no se quita solo.
    const puestos = aplicar ? await conceder(userId, faltan) : []
    return { faltan: faltan.map((it) => it.clave), puestos: puestos.map((it) => it.clave), sobran: sobran.map((f) => clave(f.destino, f.logro, f.escalon)) }
  }

  /* ── Lo que enseñan las pantallas ── */
  async function estado(userId, tripId) {
    const c = await cargar(userId)
    const viaje = c.viajes[tripId]
    if (!viaje) return { ok: false, motivo: 'viaje_sin_fechas' }
    const itemsMapa = aItems(c.logros)
    const hoy = hoyEn(viaje.destino)
    const est = estadoDestino({ datos, destino: viaje.destino, items: itemsMapa, viaje, hoy })
    // (8C2) Cada sitio de cada colección, con su nombre y si está en la ruta del viaje y dónde (para «Cómo llegar» y «Añadir a mi ruta» de la hoja de logros).
    const enRuta = sitiosDeLaRuta(viaje)
    const colecciones = est.colecciones.map((c) => ({
      ...c,
      sitios: c.sitios.map((s) => ({ ...s, nombre: nombreDeSitio(catalogos, viaje.destino, s.sitio), en_ruta: enRuta.has(s.sitio), ...(coordenadasDeSitio(catalogos, viaje.destino, s.sitio) ?? {}) })),
    }))
    return {
      ok: true,
      ...est,
      colecciones,
      exp: resumenDeExp(expFinal(expCalculada(c, calcularCon(c), c.hechos).total, c.perfil?.exp_max ?? 0), datos.exp),
      pendiente: pendientes({ datos, destino: viaje.destino, viaje, items: itemsMapa, hoy }),
      // El puntito del botón: algo ganado cuya animación no se vio (se saltó).
      puntito: c.logros.some((f) => f.animacion_vista === false && (f.destino === viaje.destino || f.destino === GLOBAL)),
      viaje: { id: viaje.id, inicio: viaje.inicio, fin: viaje.fin, hoy },
    }
  }

  async function ficha(userId, tripId, sitio) {
    const c = await cargar(userId)
    const viaje = c.viajes[tripId]
    if (!viaje) return { ok: false, motivo: 'viaje_sin_fechas' }
    const items = aItems(c.logros)
    return { ok: true, colecciones: coleccionesDeSitio({ datos, destino: viaje.destino, sitio, items, nombreDe: (s) => nombreDeSitio(catalogos, viaje.destino, s) }) }
  }

  async function loDeAyer(userId, tripId) {
    const c = await cargar(userId)
    const viaje = c.viajes[tripId]
    if (!viaje) return { ok: false, motivo: 'viaje_sin_fechas' }
    const items = aItems(c.logros)
    return { ok: true, ...pendientes({ datos, destino: viaje.destino, viaje, items, hoy: hoyEn(viaje.destino) }) }
  }

  async function resumenDe(userId, tripId, { dia = null } = {}) {
    const c = await cargar(userId)
    const viaje = c.viajes[tripId]
    if (!viaje) return { ok: false, motivo: 'viaje_sin_fechas' }
    const items = aItems(c.logros)
    return { ok: true, ...resumen({ datos, destino: viaje.destino, items, viaje, desde: dia ?? viaje.inicio, hasta: dia ?? viaje.fin, hoy: hoyEn(viaje.destino) }) }
  }

  async function pasaporteDe(userId) {
    const c = await cargar(userId)
    const perfil = await repo.perfilDe(userId)
    const items = aItems(c.logros)
    const dias = new Set(calcularConDias(c))
    return { ok: true, ...pasaporte({ datos, items, previos: perfil.previos, ahora: ahora(), salida: c.cuenta?.salida ?? null, diasConLaApp: dias.size }) }
  }
  const calcularConDias = (c) => c.hechos.filter((h) => !h.deshecho_en && h.valido).map((h) => `${h.destino}|${parteLocal(h.instante, datos.destinos[h.destino]?.timezone ?? 'UTC')?.fecha}`)

  async function vitrinaDe(userId) {
    const c = await cargar(userId)
    const perfil = await repo.perfilDe(userId)
    const items = aItems(c.logros)
    // La misma vitrina que ve la persona en «Todos mis logros»: una balda vaciada a propósito se queda vacía, y el bronce de un sello que ya es oro no entra.
    return { ok: true, ...vitrinaDeGanados({ items, guardada: perfil.vitrina, superadas: clavesSuperadas(datos, items) }) }
  }

  async function logrosDeViajero(userId) {
    const c = await cargar(userId)
    const ganados = new Map(c.logros.map((f) => [clave(f.destino, f.logro, f.escalon), f]))
    const visibles = logrosVisibles(datos, ahora())
    const avance = avanceViajero({ datos, hechos: c.hechos, viajes: c.viajes })
    return {
      ok: true,
      logros: visibles.map((def) => ({
        id: def.id,
        // (8C1) Lo que se ve poco a poco: «Las cuatro estaciones» (1 de 4…) y «Los 12 meses» (cada mes, un pedazo).
        avance: avance[def.id] ?? undefined,
        como: def.como ?? null,
        grupo: def.grupo,
        nombre: def.nombre ?? null,
        linea: def.linea ?? null,
        escalones: (def.escalones ?? []).map((e) => ({ n: e.n, nombre: e.nombre, nuevo: e.nuevo, ganado: [...ganados.values()].some((g) => g.logro === `viajero:${def.id}` && String(g.escalon) === String(e.n)) })),
        nuevo: def.nuevo ?? false,
        ganado: def.escalones ? undefined : [...ganados.values()].some((g) => g.logro === `viajero:${def.id}`),
      })),
    }
  }

  /* ── Los avisos (la lógica; el envío se enciende más adelante) ── */
  async function prepararAvisos(userId) {
    const c = await cargar(userId)
    const items = aItems(c.logros)
    const puestos = []
    for (const viaje of Object.values(c.viajes)) {
      if (!c.hechos.some((h) => h.trip_id === viaje.id && !h.deshecho_en)) continue
      const tz = datos.destinos[viaje.destino].timezone
      const aviso = datos.ajustes.avisos
      const d = datos.destinos[viaje.destino]
      const finDate = viaje.fin
      // El resumen del viaje, al día siguiente del último día (a las 10:00 de la hora del destino).
      puestos.push({ user_id: userId, trip_id: viaje.id, tipo: 'resumen_viaje', enviar_en: instanteLocal(sumarDias(finDate, aviso.resumen_viaje_dias_despues), '10:00', tz), payload: { destino: viaje.destino } })
      // «Te quedan 3 días…», 3 días antes de que acabe el plazo, solo si queda algo por reclamar.
      const pend = pendientes({ datos, destino: viaje.destino, viaje, items, hoy: sumarDias(finDate, datos.ajustes.plazo_reclamar_dias - aviso.quedan_dias_antes) })
      if (pend.sorpresas + pend.pedazos > 0) {
        puestos.push({ user_id: userId, trip_id: viaje.id, tipo: 'quedan_dias', enviar_en: instanteLocal(sumarDias(finDate, datos.ajustes.plazo_reclamar_dias - aviso.quedan_dias_antes), '10:00', tz), payload: { destino: viaje.destino, dias: aviso.quedan_dias_antes, sorpresas: pend.sorpresas, ciudad: d.ciudad, texto: `Te quedan ${aviso.quedan_dias_antes} días para reclamar tus ${pend.sorpresas || pend.pedazos} sorpresas de ${d.ciudad}` } })
      }
    }
    return repo.encolarAvisos(puestos)
  }

  return { aItems, cargar, expDe, sorteoDe, registrarInvitacion, resolverInvitacion, visto, foto, deshacer, recalcular, estado, ficha, loDeAyer, resumenDe, pasaporteDe, vitrinaDe, logrosDeViajero, prepararAvisos, calcularCon, puedeGanar, estadoDelPase, usarHoy, responderPrueba, precioDe, datos, catalogos }
}

/** El instante (ISO, UTC) en que son las `hhmm` de esa fecha en la hora del destino. */
export function instanteLocal(fecha, hhmm, tz) {
  const [h, m] = hhmm.split(':').map(Number)
  let t = Date.UTC(Number(fecha.slice(0, 4)), Number(fecha.slice(5, 7)) - 1, Number(fecha.slice(8, 10)), h, m)
  for (let i = 0; i < 3; i++) {
    const p = parteLocal(new Date(t), tz)
    const obtenido = Date.UTC(p.anio, p.mes - 1, p.dia, p.hora, p.minuto)
    const dif = Date.UTC(Number(fecha.slice(0, 4)), Number(fecha.slice(5, 7)) - 1, Number(fecha.slice(8, 10)), h, m) - obtenido
    if (dif === 0) break
    t += dif
  }
  return new Date(t).toISOString()
}

/** Un simulador para /admin/logros: de unos sitios, unas fechas y unas horas, qué se gana y en qué orden. No toca la base de datos. */
export function simular({ datos, catalogos, destino, inicio, fin, pasos, con_quien = null, salida = null, alta_cuenta = null }) {
  const d = datos.destinos[destino]
  const viajeId = 'simulado'
  const viaje = { id: viajeId, destino, inicio, fin, con_quien, dias: [] }
  const hechos = []
  const salidaPasos = []
  let antes = calcular({ datos, hechos: [], viajes: { [viajeId]: viaje }, cuenta: { alta_cuenta, salida }, ahora: new Date(`${fin}T23:00:00Z`) })
  let n = 0
  for (const paso of pasos) {
    n++
    const sitio = paso.sitio
    const info = { coords: coordenadasDeSitio(catalogos, destino, sitio), radio_m: d.sitios[sitio]?.radio_m ?? 150 }
    const instante = paso.instante ?? instanteLocal(paso.fecha, paso.hora ?? '12:00', d.timezone)
    let ubic = paso.ubic ?? 'cerca'
    if (paso.ubicacion) ubic = dondeEstoy(paso.ubicacion, info.coords, info.radio_m)
    const hecho = { id: `s${n}`, tipo: paso.tipo === 'foto' ? 'foto' : 'visto', trip_id: viajeId, destino, sitio, stop_id: paso.stop_id ?? null, instante, recibido_en: instante, ubic, valido: paso.valido !== false, inicio, fin }
    hechos.push(hecho)
    const despues = calcular({ datos, hechos, viajes: { [viajeId]: viaje }, cuenta: { alta_cuenta, salida }, ahora: new Date(`${fin}T23:00:00Z`) })
    const nuevos = diferencia(antes, despues, datos.ajustes)
    salidaPasos.push({ paso: n, sitio, tipo: hecho.tipo, nuevos: armarMomentos({ datos, nuevos, despues, antes, ultimaFrase: null, azar: () => 0 }).map(({ cat: _cat, ...m }) => m) })
    antes = despues
  }
  return salidaPasos
}

export { diasEntre }
