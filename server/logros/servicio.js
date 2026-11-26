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
import { GLOBAL, avanceViajero, calcular, clave, diferencia, diasEntre, hechosQueCuentan, logroActivo, nombreDePaisIso, parteLocal, sumarDias } from './motor.js'
import { calcularExp, edicionDeAnio, entradaEnEdicion, estadoDelSorteo, expDeMomento, expFinal, invitacionDaExp, resumenDeExp, viajesConHoy } from './exp.js'
import { coordenadasDeSitio, datosVisiblesPara, nombreDeSitio } from './datos.js'
import { dondeEstoy, evaluarFoto, evaluarVisto, metros } from './fotos.js'
import { sitiosDeId, sitiosDeLaParada } from './sitios.js'
import { sorteoVisible } from './sorteoVisible.js'
import { armarMomentos } from './momentos.js'
import { elegirRetos, queEnsenar, retoDelDia, retosDelDia, sitioDeFotoLibre, sitiosCerca, sitiosConLogro, sitiosDeFotoLibre } from './cerca.js'
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
 *   - llegada: `libreDeLlegada` = la HORA ÚTIL (tanda LL, Eric 4-nov): aterrizas + 45 min para salir del aeropuerto + trayecto a la zona del alojamiento + 60 de instalarse;
 *   - vuelta: `datosDeVuelta` = la HORA DE IRSE: billete − 2 h de aeropuerto − trayecto desde la zona − 30 de maleta. Las dos cuentas son las del motor y la tarjeta (shared/arrival/horaUtil.js).
 * Devuelve { llegada, vuelta, libre_llegada_min, libre_origen, salir_min, salir_origen }; el origen es 'motor' o 'respaldo' (el motor no da la hora: sin plan de llegada, en coche, sin datos…).
 */
export function horasDelViaje(route, destino, catalogo) {
  const a = route?.answers ?? {}
  const entradaDelPlan = a.planLlegada?.entrada
  const llegada = esHora(entradaDelPlan?.hora) ? entradaDelPlan.hora : esHora(a.arrivalFlightTime) ? a.arrivalFlightTime : null
  const vuelta = esHora(a.planVuelta?.hora) ? a.planVuelta.hora : esHora(a.departureFlightTime) ? a.departureFlightTime : null
  const info = { llegadaInfo: destino.llegadaInfo ?? null }
  const zona = entradaDelPlan?.zona ?? route?.accommodationZone ?? a.accommodationZone ?? a.zona ?? null
  let libre = null
  if (llegada) libre = libreDeLlegada(catalogo, info, { hora: llegada, medio: entradaDelPlan?.medio ?? 'avion', puntoId: entradaDelPlan?.punto_id ?? a.arrivalPointId ?? null, zona })
  let salir = null
  if (vuelta && destino.llegadaInfo) {
    const d = datosDeVuelta({ modo: a.planVuelta?.medio ?? a.returnTransportOptionId ?? 'avion', hora: vuelta, puntoId: a.departurePointId ?? null, zona }, destino.llegadaInfo)
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
    paradas: (dia.stops ?? []).filter(cuentaComoParada).map((s) => {
      const sitio = sitioDeParada(s, catalogo)
      // (V4) Una parada que lleva a varios sitios de logro (Caleta y Playa de Famara…) los lleva en `sitios`; `sitio` sigue siendo el id de la parada.
      const sitios = sitio ? sitiosDeId(destino, sitio) : []
      return { stop_id: s.id, sitio, ...(sitios.length > 1 ? { sitios } : {}), nombre: s.name }
    }),
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
    // (V39) El país de ORIGEN del viaje (el de la ciudad de la que sale, que ya se guarda con el viaje): sirve para «Tu país» de quien no contestó en qué país vive.
    origen_pais: nombreDePaisIso(route?.answers?.originPlace?.countryCode),
    origen_iso: /^[A-Za-z]{2}$/.test(String(route?.answers?.originPlace?.countryCode ?? '')) ? String(route.answers.originPlace.countryCode).toUpperCase() : null,
    dias,
  }
}

/** (V36) Lo que cambia datos: al llamarlo se olvida la lectura ligera guardada (ver `cargarLigero`). */
const MUTADORES_DEL_REPO = new Set(['insertarHecho', 'deshacerHecho', 'unirFoto', 'insertarLogros', 'borrarLogros', 'guardarPrueba', 'guardarPerfil', 'marcarAnimacion', 'apuntarInvitacion', 'marcarInvitacionCumplida', 'ponerSinPase', 'guardarSuscripcion'])
/** (V36) Cuánto vale la lectura ligera de «cerca de aquí» (HOY la pide cada 75 s: así casi nunca llega a la base). */
const VIDA_LECTURA_LIGERA_MS = 30000

export function crearServicioLogros({ repo: repoBruto, datos, catalogos, ahora = () => new Date(), cobro = false, cobroSoloAdmins = false, azar = Math.random, ocultos = new Set(), esAdminDeCuenta = null, vidaLecturaLigeraMs = VIDA_LECTURA_LIGERA_MS }) {
  // (V36) La lectura ligera guardada en memoria (usuario → { en, c }). Cualquier escritura del repo la vacía.
  const lecturaLigera = new Map()
  const repo = new Proxy(repoBruto, {
    get(objetivo, nombre) {
      const valor = objetivo[nombre]
      if (typeof valor !== 'function') return valor
      if (!MUTADORES_DEL_REPO.has(nombre)) return valor.bind(objetivo)
      return (...args) => {
        lecturaLigera.clear()
        const r = valor.apply(objetivo, args)
        return r && typeof r.then === 'function' ? r.finally(() => lecturaLigera.clear()) : r
      }
    },
  })
  const sitioInfo = (destino, sitio, radioSinDatos = 150) => {
    const d = datos.destinos[destino]
    const dato = d.sitios[sitio] ?? null
    const coords = coordenadasDeSitio(catalogos, destino, sitio)
    return { coords, radio_m: dato?.radio_m ?? radioSinDatos, dato, nombre: nombreDeSitio(catalogos, destino, sitio) }
  }
  /**
   * (V4) Como `sitioInfo`, pero para una parada que lleva a varios sitios (`sitios_de_parada`): con ubicación, el sitio de los que está más metido (o más cerca de su borde), y `sitioId` dice cuál;
   * sin ubicación, la parada entera (su nombre y su coordenada, con el radio mayor): vale para todos sus sitios.
   */
  const sitioInfoUbic = (destino, sitio, ubicacion, radioSinDatos = 150) => {
    const base = sitioInfo(destino, sitio, radioSinDatos)
    const todos = sitiosDeId(datos.destinos[destino], sitio)
    if (todos.length <= 1) return { ...base, sitioId: sitio }
    const infos = todos.map((s) => ({ ...sitioInfo(destino, s, radioSinDatos), sitioId: s }))
    if (!ubicacion || !Number.isFinite(ubicacion.lat) || !Number.isFinite(ubicacion.lng)) return { ...base, radio_m: Math.max(...infos.map((i) => i.radio_m)), sitioId: null }
    // El más cercano de los que tienen su radio alrededor (como la foto sin parada); si no está en ninguno, el que tiene el borde más cerca.
    const conCoords = infos.filter((i) => i.coords).map((i) => ({ ...i, m: metros(ubicacion, i.coords) }))
    const dentro = conCoords.filter((i) => i.m <= i.radio_m)
    const mejor = (dentro.length > 0 ? dentro.sort((a, b) => a.m - b.m) : conCoords.sort((a, b) => a.m - a.radio_m - (b.m - b.radio_m)))[0]
    return mejor ? { ...base, coords: mejor.coords, radio_m: mejor.radio_m, sitioId: mejor.sitioId } : { ...base, sitioId: null }
  }
  const hoyEn = (destino) => parteLocal(ahora(), datos.destinos[destino].timezone).fecha

  /** Todo lo de una persona que hace falta para calcular. */
  /**
   * (V36) Lo MÍNIMO para «cerca de aquí» (HOY lo pide cada 75 s con la app a la vista): los viajes y lo ganado. Antes cada vuelta hacía las ~14 lecturas completas de `cargar` (hechos, EXP, pioneros, perfil,
   * referidos…) que esa respuesta ni usa; ahora son 2-5 consultas pequeñas y, mientras dura la lectura guardada, ninguna (cualquier escritura de esta instancia la vacía).
   */
  async function cargarLigero(userId) {
    const guardada = lecturaLigera.get(userId)
    if (guardada && Date.now() - guardada.en < vidaLecturaLigeraMs) return guardada.c
    const c = await cargar(userId, { ligero: true })
    lecturaLigera.set(userId, { en: Date.now(), c })
    if (lecturaLigera.size > 200) lecturaLigera.delete(lecturaLigera.keys().next().value)
    return c
  }
  async function cargar(userId, { ligero = false } = {}) {
    // (V9) TODAS las lecturas a la vez, en una sola ronda (antes el perfil y los referidos esperaban a las otras seis y la invitación, a todas): cada ronda al servidor de datos son ~150-300 ms.
    const [hechos, filas, logros, cuenta, pionero, probador, perfil, referidos, invitador, paisVive] = await Promise.all(ligero ? [[], repo.viajesDe(userId), repo.logrosDe(userId), null, {}, null, null, [], undefined, null] : [
      repo.hechosDe(userId),
      repo.viajesDe(userId),
      repo.logrosDe(userId),
      repo.cuentaDe(userId),
      repo.ordenPionero(userId),
      repo.probadorDe(userId),
      repo.perfilDe(userId),
      repo.referidosDe ? repo.referidosDe(userId) : [],
      repo.invitadorDe ? repo.invitadorDe(userId).catch(() => undefined) : undefined,
      repo.paisViveDe ? repo.paisViveDe(userId).catch(() => null) : null, // (V39) el país que contestó (si lo contestó)
    ])
    const viajes = {}
    for (const fila of filas) {
      const ctx = contextoDeViaje(fila, datos, catalogos, { esDuo: fila.es_duo === true })
      if (ctx) viajes[fila.id] = ctx
    }
    // (V15) UN viaje compartido = UN viaje: si esta persona tiene su propia copia del viaje (mismo destino, fechas que se pisan) además del viaje compartido del que es miembro, las dos son el MISMO viaje.
    // Lo que ganó en la copia cuenta en el compartido (sus hechos y logros pasan a llevar su id) y las fechas son las del compartido (las del dueño). Antes cada una contaba por su lado: el sello de Alicia ponía
    // «09 NOV» y «5 días viajando» cuando el viaje de Eric era del 8 al 13, su pasaporte decía «aún no está» con el sello hecho y «llevas 0», y «Yo también estaba» no salía (los ids no coincidían).
    // La copia sigue pudiéndose pedir por su id (propiedad NO enumerable: no se cuenta dos veces en las listas).
    const alias = new Map()
    for (const fila of filas) {
      const ctx = viajes[fila.id]
      if (!ctx || !fila.traveler_id || fila.traveler_id !== userId) continue
      const compartido = filas.find((o) => o.id !== fila.id && o.traveler_id && o.traveler_id !== userId && viajes[o.id] && viajes[o.id].destino === ctx.destino && viajes[o.id].inicio <= ctx.fin && ctx.inicio <= viajes[o.id].fin)
      if (compartido) alias.set(fila.id, compartido.id)
    }
    for (const [copia, compartido] of alias) {
      delete viajes[copia]
      Object.defineProperty(viajes, copia, { value: viajes[compartido], enumerable: false, configurable: true })
    }
    const canon = (id) => alias.get(id) ?? id
    const hechosCanon = alias.size ? hechos.map((h) => (alias.has(h.trip_id) ? { ...h, trip_id: canon(h.trip_id) } : h)) : hechos
    const logrosCanon = alias.size ? logros.map((l) => (alias.has(l.trip_id) ? { ...l, trip_id: canon(l.trip_id) } : l)) : logros
    // (8C1) La EXP que ya tenía (nunca baja) y los amigos que ha invitado; (V9) y quién le invitó, ya leído.
    return { hechos: hechosCanon, viajes, logros: logrosCanon, cuenta, pionero, probador, perfil, referidos, invitador, pais_vive: paisVive ?? null }
  }
  const calcularCon = (c, hechos = c.hechos, pionero = c.pionero) => calcular({ datos, hechos, viajes: c.viajes, cuenta: c.cuenta, ahora: ahora(), pionero, probador: aIso(c.probador), pais_vive: c.pais_vive ?? null })
  const aMapa = (filas) => new Map(filas.map((f) => [clave(f.destino, f.logro, escalonDe(f)), f]))
  const aIso = (v) => (v instanceof Date ? v.toISOString() : v)
  /** Lo ganado (filas de la base) como el cerebro lo entiende: clave → { logro, escalon, destino, trip_id, en }. */
  // (V39) «Viajero nacional» era un logro sin escalones (escalón vacío) y ahora es el escalón 3 de «Tu país»: lo que alguien ya tuviera guardado se lee como el escalón 3 (no se quita ni se duplica).
  const escalonDe = (f) => (f.logro === 'viajero:viajero_nacional' && String(f.escalon) === '' ? '3' : String(f.escalon))
  const aItems = (logros) => new Map(logros.filter((f) => logroActivo(datos, f.logro)).map((f) => [clave(f.destino, f.logro, escalonDe(f)), { clave: clave(f.destino, f.logro, escalonDe(f)), logro: f.logro, escalon: escalonDe(f), destino: f.destino, trip_id: f.trip_id ?? null, en: aIso(f.ganado_en), animacion_vista: f.animacion_vista }]))

  /** Concede lo nuevo (ya calculado) guardándolo; devuelve solo lo que de verdad se ha insertado (nunca da dos veces lo mismo). */
  async function conceder(userId, nuevos, extra = {}, global = {}) {
    if (nuevos.length === 0) return []
    const filas = nuevos.map((it) => ({ logro: it.logro, escalon: it.escalon, destino: it.destino, trip_id: it.trip_id, ganado_en: it.en, ...(extra[it.clave] ?? {}), ...global }))
    const insertadas = await repo.insertarLogros(userId, filas)
    const claves = new Set(insertadas.map((f) => clave(f.destino, f.logro, f.escalon)))
    return nuevos.filter((it) => claves.has(it.clave))
  }

  /** Lo que hay que enseñar tras un hecho: lo nuevo, con su frase de suspense (solo la primera vez). */
  async function respuestaDeNuevos(userId, antes, despues, c, hechosDespues = c.hechos, global = {}) {
    const nuevos = diferencia(antes, despues, datos.ajustes)
    const ultima = await repo.ultimaFrase(userId)
    const momentos = armarMomentos({ datos, nuevos, despues, antes, ultimaFrase: ultima, azar, viajes: c.viajes })
    const frases = Object.fromEntries(momentos.filter((m) => m.tipo === 'emblema').map((m) => [m.clave, { frase: m.frase }]))
    const concedidos = await conceder(userId, nuevos, frases, global)
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
   * Si esta persona fue invitada y ya ha completado su primer viaje CON HOY (el viaje ha terminado y usó HOY la mitad de los días o más: `viajesConHoy`, la misma regla que el sorteo), lo apunta; en ese
   * momento el que la invitó gana sus 200 EXP (con el tope de `maximo_al_anio` amigos al año, `invitacionDaExp`) y le sale un aviso en la campana: «Ana ha hecho su primer viaje con HOY: +200 EXP».
   * Crear la cuenta NO cuenta. Idempotente: la fila se marca una sola vez y el aviso lleva una clave única por amigo.
   */
  async function resolverInvitacion(invitadoId, c) {
    if (!repo.invitadorDe) return { ok: true, cumplida: false }
    // (V9) Ya viene leído con el resto (`cargar`); solo se lee otra vez si quien llama no lo trae.
    const fila = c.invitador !== undefined ? c.invitador : await repo.invitadorDe(invitadoId)
    if (!fila || fila.viaje_acabado_en) return { ok: true, cumplida: Boolean(fila?.viaje_acabado_en) }
    const buenos = viajesConHoy({ datos, hechos: c.hechos, viajes: c.viajes, ahora: ahora() }).filter((v) => v.cumple)
    if (buenos.length === 0) return { ok: true, cumplida: false }
    await repo.marcarInvitacionCumplida(invitadoId, `${buenos[0].fin}T23:59:59Z`)
    await avisarInvitacion(fila.invitador_id, invitadoId)
    return { ok: true, cumplida: true }
  }

  /** El aviso de la campana de quien invita (una sola vez por amigo, y solo si ese amigo da EXP: del sexto del año en adelante no hay ni EXP ni aviso). */
  async function avisarInvitacion(invitadorId, invitadoId) {
    if (!repo.crearAvisoCampana || !repo.referidosDe) return false
    const referidos = await repo.referidosDe(invitadorId)
    if (!invitacionDaExp(referidos, invitadoId, datos.exp)) return false
    const nombre = repo.nombreDe ? await repo.nombreDe(invitadoId) : null
    return repo.crearAvisoCampana(invitadorId, 'amigo_viaje', `amigo:${invitadoId}`, { nombre, exp: datos.exp.invitacion.exp, invitado_id: invitadoId })
  }
  const resolverSinRomper = async (userId, c) => {
    try {
      await resolverInvitacion(userId, c)
    } catch (error) {
      console.warn('[logros] no se ha podido mirar la invitación:', error.message)
    }
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
    await resolverSinRomper(userId, c)
    // (10P) Quien ya cumple el sorteo recibe su aviso dorado ahora, aunque no abra la página del sorteo.
    await sorteoDeCuenta(userId, c).catch((error) => console.warn('[logros] sorteo:', error.message))
    return { ok: true, ...resumenDeExp(total, datos.exp), por_anio: calculado.por_anio, calculada: calculado.total, guardada_antes: guardada }
  }

  /** Lo que hace falta para decidir el sorteo de una cuenta ya cargada: cada EXP con su fecha, la EXP de ahora (nunca baja) y los viajes acabados con los días de HOY. */
  function datosDelSorteo(c) {
    const calculado = expCalculada(c, calcularCon(c), c.hechos)
    return { entradas: calculado.entradas, expActual: expFinal(calculado.total, c.perfil?.exp_max ?? 0), viajes: viajesConHoy({ datos, hechos: c.hechos, viajes: c.viajes, ahora: ahora() }) }
  }

  /**
   * El billete y la página del sorteo de una cuenta (1.6): la edición, el estado (sin_nivel · falta_viaje · dentro), lo que le falta y sus dos condiciones. El día que entra, su aviso dorado en la
   * campana («¡Ya estás en el sorteo de 2027!»): UNA sola vez (la clave del aviso es el año).
   */
  async function sorteoDeCuenta(userId, c = null) {
    // (V25) Escondido hasta que salga en las tiendas: ni billete, ni página, ni aviso dorado (el código y los datos siguen; ver sorteoVisible.js).
    if (!sorteoVisible()) return null
    const cuenta = c ?? (await cargar(userId))
    const estado = estadoDelSorteo({ tabla: datos.exp, ...datosDelSorteo(cuenta), ahora: ahora() })
    if (estado.estado === 'dentro' && repo.crearAvisoCampana) {
      try {
        // (Una sola vez: la base de datos no repite un aviso con la misma clave. Sin la 0034 aplicada no se puede crear: no rompe nada y se vuelve a intentar la próxima vez.)
        await repo.crearAvisoCampana(userId, 'sorteo', `sorteo:${estado.edicion.anio}`, { anio: estado.edicion.anio })
      } catch (error) {
        console.warn('[logros] no se ha podido crear el aviso del sorteo:', error.message)
      }
    }
    return estado
  }

  /** El sorteo de un año (el panel de Eric): quién entra, entre las cuentas dadas. Sin nombres ni correos: solo el id de cada cuenta. */
  async function sorteoDe(anio, userIds) {
    const hoy = ahora().toISOString().slice(0, 10)
    const edicion = edicionDeAnio(datos.exp, anio)
    const lista = []
    for (const id of userIds) {
      const r = entradaEnEdicion({ tabla: datos.exp, edicion, hoy, ...datosDelSorteo(await cargar(id)) })
      lista.push({ user_id: id, exp: r.exp, nivel: r.nivel, viajes_con_hoy: r.viajes_ok, entra: r.entra })
    }
    return { ok: true, anio: Number(anio), edicion: { anio: Number(edicion.anio), destino: edicion.destino ?? null, premio: edicion.premio, cierre: edicion.cierre }, cuentas: lista.length, entran: lista.filter((x) => x.entra).length, lista: lista.filter((x) => x.entra) }
  }

  /**
   * (HOY1) Lo que hay cerca de la ubicación del viajero (H8, H8b, C16, C17): sitios con algo por ganar, con la distancia al borde de su radio y qué enseñar.
   * `sitios_hoy` (nombres de las paradas de hoy, tal como las ve el móvil) manda sobre la ruta guardada, que puede ir por detrás. La ubicación no se guarda.
   */
  async function cerca(userId, { trip_id, ubicacion = null, sitios_hoy = null, en_coche = false, sitios_saltados = null }) {
    const c = await cargarLigero(userId)
    const viaje = c.viajes[trip_id]
    if (!viaje) return { ok: false, motivo: 'viaje_sin_fechas', cerca: [] }
    const hoy = hoyEn(viaje.destino)
    const deLaRuta = (viaje.dias ?? []).filter((d) => d.fecha === hoy).flatMap((d) => d.paradas.flatMap((p) => sitiosDeLaParada(p)))
    const delMovil = Array.isArray(sitios_hoy) ? sitios_hoy.map((n) => sitioDeParada({ name: String(n) }, catalogos[viaje.destino])).filter(Boolean).flatMap((s) => sitiosDeId(datos.destinos[viaje.destino], s)) : null
    const sitiosHoy = new Set(delMovil ?? deLaRuta)
    const items = aItems(c.logros)
    // (V70, V63-19) El emblema de una parada SALTADA hoy no se anuncia nunca (ni «brilla», ni «más cerca», ni «llegada»): el móvil manda los nombres de las saltadas (`sitios_saltados`) y aquí se les quita el emblema.
    // (Los pedazos de colección se quedan.) CADA CUÁNTO / CUÁNTO BAJA: igual que esta consulta (la pide el móvil con la pantalla visible); unos pocos nombres más en el cuerpo, nada más en la respuesta.
    const saltados = new Set(Array.isArray(sitios_saltados) ? sitios_saltados.map((n) => sitioDeParada({ name: String(n) }, catalogos[viaje.destino])).filter(Boolean).flatMap((s) => sitiosDeId(datos.destinos[viaje.destino], s)) : [])
    const lista = sitiosCerca({ datos, catalogos, destino: viaje.destino, ubicacion, items, sitiosHoy }).map((s) => (saltados.has(s.sitio) && s.hay_emblema ? { ...s, hay_emblema: false, emblema_nombre: null } : s))
    // (LG1) El radio de cada parada de hoy (por el nombre que mandó el móvil) para «Ya estás aquí»: el del sitio en los datos, o null (el móvil usa 150 m).
    const radios_hoy = {}
    if (Array.isArray(sitios_hoy)) {
      for (const n of sitios_hoy) {
        const s = sitioDeParada({ name: String(n) }, catalogos[viaje.destino])
        const radiosDe = s ? sitiosDeId(datos.destinos[viaje.destino], s).map((x) => datos.destinos[viaje.destino].sitios?.[x]?.radio_m).filter((x) => Number.isFinite(x) && x > 0) : []
        const r = radiosDe.length > 0 ? Math.max(...radiosDe) : null // (V4) una parada con varios sitios: el mayor de sus radios
        radios_hoy[String(n)] = Number.isFinite(r) && r > 0 ? r : null
      }
    }
    return { ok: true, cerca: lista, radios_hoy, ...queEnsenar(lista), reto: retoDelDia({ datos, catalogos, destino: viaje.destino, items, sitiosHoy }), retos: elegirRetos(retosDelDia({ datos, catalogos, destino: viaje.destino, items, sitiosHoy, diasRuta: viaje.dias ?? [], hoyFecha: hoy, enCoche: Boolean(en_coche) })) }
  }

  /** Lo que tiene un sitio por ganar (sin decir qué emblema): para que la tarjeta del Visto sepa cuál enseñar. Solo se LEE; no cambia nada. */
  function queHayEn(c, viaje, sitio) {
    if (!sitio) return { sitio_nombre: null, hay_pedazo: false, hay_emblema: false, es_importante: false, foto_dentro: null }
    const d = datos.destinos[viaje.destino]
    const items = aItems(c.logros)
    const sitios = sitiosDeId(d, sitio) // (V4) una parada con varios sitios: lo que falte en cualquiera
    return {
      sitio_nombre: nombreDeSitio(catalogos, viaje.destino, sitio),
      hay_pedazo: sitios.some((s) => d.colecciones.some((x) => x.sitios.includes(s) && !items.get(clave(viaje.destino, 'pedazo', x.id + ':' + s)))),
      hay_emblema: sitios.some((s) => d.emblemas.some((e) => e.sitio === s && !items.get(clave(viaje.destino, 'emblema', e.id)))),
      // (V66, 2) «Guarda un recuerdo» solo sale en los sitios de «Los imprescindibles» del destino (la colección cuyo id acaba en «imprescindibles») y en las maravillas del mundo. Se lee de los datos de logros: 0 consultas a Supabase.
      es_importante: sitios.some((s) => Boolean(d.sitios?.[s]?.maravilla) || d.colecciones.some((x) => /imprescindibles$/.test(x.id) && x.sitios.includes(s))),
      foto_dentro: sitios.map((s) => d.sitios[s]?.foto_dentro).find(Boolean) ?? null,
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

  /** (V19) ¿Se cobra a esta cuenta? Con el cobro solo para administradores (PASES_COBRO_SOLO_ADMINS), solo si es administradora; las demás, como con el cobro apagado. */
  const cobroDe = async (userId) => Boolean(cobro) && (!cobroSoloAdmins || (typeof esAdminDeCuenta === 'function' && Boolean(await esAdminDeCuenta(userId).catch(() => false))))

  async function puedeGanar(userId, c, viaje, fecha, usar = null) {
    if (await sinPaseDe(userId)) return { puede: false, motivo: 'sin_pase_prueba' }
    const cobro = await cobroDe(userId)
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
    const info = sitio ? sitioInfoUbic(viaje.destino, sitio, ubicacion) : { coords: null, radio_m: 150, nombre: stop_id }
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
  async function foto(userId, { trip_id, sitio = null, nombre = null, stop_id = null, libre = false, origen, tomada_en = null, con_camara = false, ubicacion = null, de_amigo = false, foto_id = null, recibido_en = null }) {
    const c = await cargar(userId)
    const viaje = c.viajes[trip_id]
    if (!viaje) return { ok: false, motivo: 'viaje_sin_fechas', mensaje: 'Este viaje no tiene fechas: los logros se ganan en las fechas del viaje.', nuevos: [] }
    if (!sitio && nombre) sitio = sitioDeParada({ name: nombre }, catalogos[viaje.destino])
    // (HOY1) La cámara de viaje: una foto SIN parada. Cuenta para el sitio con logro en cuyo radio está el viajero (esté o no en su ruta; también La Graciosa);
    // si no está en ninguno, o no hay ubicación, es solo un recuerdo de hoy: la foto es válida, no gana nada y no se guarda ningún hecho.
    // (V5) «Reclamar con tus fotos»: una foto de la GALERÍA sin parada ni sitio (`libre`). Pasa por `evaluarFoto` (cámara del móvil, fecha del viaje, plazo) y, con ubicación, cuenta para CADA sitio con logro
    // en cuyo radio cae (esté o no en la ruta; si cae en dos, para los dos). Sin ubicación devuelve `sin_ubicacion`: la app pregunta de qué sitio es. Varias fotos de un sitio cuentan una vez (lo decide el motor).
    if (!sitio && !stop_id && libre && origen === 'galeria') return fotoLibreDeGaleria(userId, c, viaje, { tomada_en, con_camara, ubicacion, foto_id, recibido_en })
    if (!sitio && !stop_id && libre) {
      sitio = sitioDeFotoLibre({ datos, catalogos, destino: viaje.destino, ubicacion, items: aItems(c.logros) })
      if (!sitio) return { ok: true, valida: true, cuenta: false, motivo: ubicacion ? 'sin_logro_aqui' : 'sin_ubicacion', nuevos: [] }
    }
    if (!sitio) return { ok: false, motivo: 'faltan_datos', nuevos: [] }
    const recibido = recibido_en ?? ahora().toISOString()
    // (LG1) La foto usa el radio de cada sitio; sin radio en los datos, 800 m (el Visto y «Ya estás aquí» siguen en 150).
    const info = sitioInfoUbic(viaje.destino, sitio, ubicacion, 800)
    const e = evaluarFoto({ origen, tomadaEn: tomada_en, conCamara: origen === 'app' ? true : Boolean(con_camara), ubicacion, sitio: info, viaje, destino: datos.destinos[viaje.destino], nombreSitio: info.nombre, recibidoEn: recibido, ajustes: datos.ajustes })
    void de_amigo // (la foto de un amigo del grupo vale igual: no se mira quién la hizo)
    if (!e.valida) return { ok: true, valida: false, motivo: e.motivo, mensaje: e.mensaje, nuevos: [] }
    // Una foto de la galería se sube cuando se tiene acceso (el día de prueba o con el pase): la fecha que cuenta es la del día en que se sube («Lo de ayer también cuenta»).
    const fecha = origen === 'galeria' ? horaLocalDe(viaje.destino, recibido).fecha : parteLocal(e.instante, datos.destinos[viaje.destino].timezone).fecha
    const pase = await puedeGanar(userId, c, viaje, fecha)
    if (!pase.puede) return { ok: true, valida: true, cuenta: false, motivo: pase.motivo, nuevos: [] }
    const antes = calcularCon(c)
    // (V4) Una foto con ubicación hecha en una parada que lleva a varios sitios vale para el sitio donde está (la Caleta o la Playa), no para los dos; sin ubicación, para la parada entera.
    const sitioDeLaFoto = info.sitioId ?? sitio
    const fila = await repo.insertarHecho({ user_id: userId, trip_id, destino: viaje.destino, tipo: 'foto', sitio: sitioDeLaFoto, stop_id, instante: e.instante, recibido_en: recibido, ubic: e.ubic, valido: true, origen, foto_id, inicio: viaje.inicio, fin: viaje.fin })
    const despues = calcularCon(c, [...c.hechos, fila], await repo.ordenPionero(userId))
    const { nuevos, exp } = await respuestaDeNuevos(userId, antes, despues, c, [...c.hechos, fila])
    return { ok: true, valida: true, cuenta: true, nuevos, exp, id: fila.id }
  }

  /** (V5) Ver el comentario de `foto`. `sitios`: los sitios con logro donde cayó la foto, con su nombre; `sin_ubicacion` si no trae ubicación (la app pregunta). */
  async function fotoLibreDeGaleria(userId, c, viaje, { tomada_en, con_camara, ubicacion, foto_id, recibido_en }) {
    const recibido = recibido_en ?? ahora().toISOString()
    const destinoDatos = datos.destinos[viaje.destino]
    const sinSitio = { coords: null, radio_m: 150 }
    const e = evaluarFoto({ origen: 'galeria', tomadaEn: tomada_en, conCamara: Boolean(con_camara), ubicacion, sitio: sinSitio, viaje, destino: destinoDatos, nombreSitio: '', recibidoEn: recibido, ajustes: datos.ajustes })
    if (!e.valida) return { ok: true, valida: false, motivo: e.motivo, mensaje: e.mensaje, nuevos: [] }
    const tiene = ubicacion && Number.isFinite(ubicacion.lat) && Number.isFinite(ubicacion.lng)
    if (!tiene) return { ok: true, valida: true, cuenta: false, motivo: 'sin_ubicacion', instante: e.instante, nuevos: [] }
    const ids = sitiosDeFotoLibre({ datos, catalogos, destino: viaje.destino, ubicacion, items: aItems(c.logros) })
    if (ids.length === 0) return { ok: true, valida: true, cuenta: false, motivo: 'sin_logro_aqui', instante: e.instante, nuevos: [] }
    const fecha = horaLocalDe(viaje.destino, recibido).fecha
    const pase = await puedeGanar(userId, c, viaje, fecha)
    if (!pase.puede) return { ok: true, valida: true, cuenta: false, motivo: pase.motivo, instante: e.instante, nuevos: [] }
    const antes = calcularCon(c)
    const filas = []
    for (const s of ids) filas.push(await repo.insertarHecho({ user_id: userId, trip_id: viaje.id, destino: viaje.destino, tipo: 'foto', sitio: s, stop_id: null, instante: e.instante, recibido_en: recibido, ubic: 'cerca', valido: true, origen: 'galeria', foto_id: foto_id ?? null, inicio: viaje.inicio, fin: viaje.fin }))
    const despues = calcularCon(c, [...c.hechos, ...filas], await repo.ordenPionero(userId))
    const { nuevos, exp } = await respuestaDeNuevos(userId, antes, despues, c, [...c.hechos, ...filas])
    return { ok: true, valida: true, cuenta: true, instante: e.instante, sitios: ids.map((s) => ({ sitio: s, nombre: nombreDeSitio(catalogos, viaje.destino, s) })), nuevos, exp, id: filas[0]?.id }
  }

  /* ── (V7) «Yo también estaba» ── */

  /**
   * Lo que un compañero del viaje ha ganado y esta persona aún no tiene (pedazos y emblemas ocultos de sitios), para «Yo también estaba». Reglas (Eric):
   *   · SOLO cuando el viaje ya ha terminado (y dentro del plazo de 30 días): durante el viaje, nada;
   *   · miembros del viaje compartido, entraran cuando entraran (V15, Eric 18-nov: antes se dejaba fuera a quien se unió tras el último día, y por eso no salía entre dos compañeros que se unieron al compartir el viaje ya acabado); sigue valiendo solo dentro del plazo;
   *   · solo lo ganado en ese viaje por una foto, un Visto o la galería (nunca lo que el compañero ganó a su vez con «Yo también estaba»);
   *   · solo si esta persona NO tiene ya ese sitio (ni el pedazo ni el emblema que falten).
   * Devuelve `{ ok, pendientes: [{ sitio, nombre, de, de_nombre, falta, colecciones, emblema, foto_url, instante }], sin_pase }`.
   */
  async function companeroPendientes(userId, tripId, c0 = null, traza = null) {
    // `traza`: (V15b) si es una lista, se van apuntando los pasos que da el servidor (para el panel de diagnóstico: en qué paso se queda vacío).
    const paso = (t) => { if (Array.isArray(traza)) traza.push(t) }
    const c = c0 ?? (await cargar(userId))
    const corto = (x) => String(x ?? '').slice(0, 8)
    paso(`1. viaje pedido: ${tripId || '(vacío)'}`)
    paso(`2. viajes que ve el servidor para esta cuenta: ${Object.entries(c.viajes).map(([k, v]) => `${corto(k)} ${v.destino} ${v.inicio}→${v.fin}`).join(' | ') || '(ninguno)'}${Object.getOwnPropertyNames(c.viajes).filter((k) => !(k in Object.fromEntries(Object.entries(c.viajes)))).length ? ` | copias unidas al compartido: ${Object.getOwnPropertyNames(c.viajes).filter((k) => !Object.keys(c.viajes).includes(k)).map(corto).join(',')}` : ''}`)
    const viaje = c.viajes[tripId]
    if (!viaje || typeof repo.miembrosDe !== 'function') {
      paso('3. SE QUEDA VACÍO AQUÍ: el servidor no encuentra ese viaje entre los de esta cuenta (viaje_sin_fechas): el id que manda la app no es el de ninguno de sus viajes con fechas y destino de logros')
      return { ok: false, motivo: 'viaje_sin_fechas', pendientes: [] }
    }
    paso(`3. viaje usado: ${corto(viaje.id)} (${viaje.destino}) ${viaje.inicio}→${viaje.fin}`)
    const hoy = hoyEn(viaje.destino)
    paso(`4. hoy en el destino: ${hoy}; plazo: del ${sumarDias(viaje.fin, 1)} al ${sumarDias(viaje.fin, datos.ajustes.plazo_reclamar_dias)}`)
    if (hoy <= viaje.fin || hoy > sumarDias(viaje.fin, datos.ajustes.plazo_reclamar_dias)) {
      paso('5. SE QUEDA VACÍO AQUÍ: hoy está FUERA del plazo (solo sale cuando el viaje ha terminado y dentro de los días de plazo)')
      return { ok: true, pendientes: [], fuera_de_fechas: true, sin_pase: false }
    }
    // (V15) Si piden la COPIA propia del viaje, se trabaja con el viaje compartido al que equivale (su id manda para los miembros y lo ganado).
    const tid = viaje.id ?? tripId
    const miembros = await repo.miembrosDe(tid)
    const yo = miembros.find((m) => m.user_id === userId)
    const alDia = () => true // (V15) ya no importa cuándo se unió: cuenta cualquier miembro dentro del plazo
    paso(`5. miembros de ${corto(tid)}: ${miembros.map((m) => `${corto(m.user_id)}${m.desde ? ` (desde ${String(m.desde).slice(0, 10)})` : ' (dueño)'}`).join(', ') || '(ninguno)'}; yo = ${corto(userId)}`)
    if (!yo) {
      paso('6. SE QUEDA VACÍO AQUÍ: esta cuenta no figura como miembro de ese viaje en el servidor')
      return { ok: true, pendientes: [], sin_pase: false }
    }
    const d = datos.destinos[viaje.destino]
    const mios = aItems(c.logros)
    const por = new Map()
    for (const m of miembros.filter((x) => x.user_id !== userId && alDia(x))) {
      // (V15) Lo del compañero cuenta si es de ESTE viaje o, si lo guardó con otro id del mismo viaje (su propia copia), si es del mismo destino y de los días del viaje (con un día de margen).
      const enElViaje = (cuando) => {
        const dia = String(cuando ?? '').slice(0, 10)
        return dia >= sumarDias(viaje.inicio, -1) && dia <= sumarDias(viaje.fin, 1)
      }
      const logros = (await repo.logrosDe(m.user_id)).filter((l) => (l.trip_id === tid || (l.destino === viaje.destino && enElViaje(l.ganado_en))) && l.destino === viaje.destino && l.detalle?.origen !== 'companero')
      const hechos = (await repo.hechosDe(m.user_id)).filter((h) => (h.trip_id === tid || (h.destino === viaje.destino && enElViaje(h.instante))) && h.motivo !== 'companero')
      paso(`6. compañero ${corto(m.user_id)}: ${logros.length} logros y ${hechos.length} hechos de este viaje (por id de viaje o por destino y días)`)
      const ganados = new Map()
      const de = (s) => {
        if (!ganados.has(s)) ganados.set(s, { colecciones: new Set(), emblema: false })
        return ganados.get(s)
      }
      for (const l of logros) {
        if (l.logro === 'pedazo') {
          const [col, sitio] = String(l.escalon).split(':')
          if (sitio) de(sitio).colecciones.add(col)
        } else if (l.logro === 'emblema') {
          const e = d.emblemas.find((x) => x.id === l.escalon)
          if (e?.sitio) de(e.sitio).emblema = true
        }
      }
      for (const [sitio, g] of ganados) {
        const faltan = []
        const colsFaltan = [...g.colecciones].filter((col) => !mios.has(clave(viaje.destino, 'pedazo', `${col}:${sitio}`)))
        if (colsFaltan.length > 0) faltan.push('pedazo')
        const em = d.emblemas.find((x) => x.sitio === sitio)
        if (g.emblema && em && !mios.has(clave(viaje.destino, 'emblema', em.id))) faltan.push('emblema')
        if (faltan.length === 0 || por.has(sitio)) continue
        const delSitio = hechos.filter((h) => sitiosDeId(d, h.sitio).includes(sitio))
        const hecho = delSitio.filter((h) => h.tipo === 'foto').sort((a, b) => new Date(a.instante) - new Date(b.instante))[0] ?? delSitio[0] ?? null
        // (V16, decisión de Eric) NUNCA la foto del compañero (no se guarda en tu cuenta): la app enseña la foto del sitio de nuestros datos. Ni `repo.fotoUrl` ni direcciones firmadas de fotos de otra cuenta.
        const foto_url = null
        por.set(sitio, { sitio, nombre: nombreDeSitio(catalogos, viaje.destino, sitio), de: m.user_id, de_nombre: null, falta: faltan, colecciones: colsFaltan.map((col) => d.colecciones.find((x) => x.id === col)?.nombre ?? col), emblema: faltan.includes('emblema'), foto_url, instante: hecho?.instante ?? null })
      }
    }
    const lista = [...por.values()]
    if (lista.length > 0 && typeof repo.nombresDe === 'function') {
      const nombres = await repo.nombresDe([...new Set(lista.map((p) => p.de))])
      for (const p of lista) p.de_nombre = nombres.get(p.de) ?? null
    }
    const pase = await puedeGanar(userId, c, viaje, hoy)
    paso(`7. ya tengo ${mios.size} cosas; pendientes que salen: ${lista.map((p) => p.sitio).join(', ') || 'NINGUNA'}${lista.length === 0 ? ' (SE QUEDA VACÍO AQUÍ: nada de lo del compañero me falta, o el compañero no tiene nada de este viaje)' : ''}; pase: ${pase.puede ? 'puede ganar' : `NO (${pase.motivo})`}`)
    return { ok: true, pendientes: lista, sin_pase: !pase.puede, ciudad: d.ciudad }
  }

  /** «Yo también estaba»: gana, con su propio momento, lo que el compañero consiguió (`sitios` = ids, o 'todos'). El origen queda apuntado como «compañero» (hecho con motivo 'companero' y `detalle.origen` del logro). */
  async function yoTambien(userId, { trip_id, sitios = 'todos' }) {
    const c = await cargar(userId)
    const viaje = c.viajes[trip_id]
    if (!viaje) return { ok: false, motivo: 'viaje_sin_fechas', nuevos: [] }
    const pr = await companeroPendientes(userId, trip_id, c)
    const elegidos = sitios === 'todos' ? pr.pendientes : pr.pendientes.filter((p) => (Array.isArray(sitios) ? sitios : [sitios]).includes(p.sitio))
    if (elegidos.length === 0) return { ok: true, cuenta: false, motivo: 'nada_pendiente', nuevos: [] }
    const pase = await puedeGanar(userId, c, viaje, hoyEn(viaje.destino))
    if (!pase.puede) return { ok: true, cuenta: false, motivo: pase.motivo, nuevos: [] }
    const antes = calcularCon(c)
    const filas = []
    for (const p of elegidos) {
      filas.push(await repo.insertarHecho({ user_id: userId, trip_id, destino: viaje.destino, tipo: 'foto', sitio: p.sitio, stop_id: null, instante: p.instante ?? new Date(`${viaje.inicio}T12:00:00Z`).toISOString(), recibido_en: ahora().toISOString(), ubic: 'cerca', valido: true, motivo: 'companero', origen: 'galeria', foto_id: null, inicio: viaje.inicio, fin: viaje.fin }))
    }
    const despues = calcularCon(c, [...c.hechos, ...filas], await repo.ordenPionero(userId))
    const { nuevos, exp } = await respuestaDeNuevos(userId, antes, despues, c, [...c.hechos, ...filas], { detalle: { origen: 'companero' } })
    return { ok: true, cuenta: true, sitios: elegidos.map((p) => ({ sitio: p.sitio, nombre: p.nombre })), nuevos, exp }
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
    const cobro = await cobroDe(userId)
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
    const sobran = [...guardado.values()].filter((f) => !calculado.has(clave(f.destino, f.logro, escalonDe(f))) && f.logro !== 'viajero:probador')
    // Solo se añade lo que falta; lo que sobra se enseña (por ejemplo, si cambian los datos) pero no se quita solo.
    const puestos = aplicar ? await conceder(userId, faltan) : []
    return { faltan: faltan.map((it) => it.clave), puestos: puestos.map((it) => it.clave), sobran: sobran.map((f) => clave(f.destino, f.logro, f.escalon)) }
  }

  /* ── Lo que enseñan las pantallas ── */
  async function estado(userId, tripId) {
    const c = await cargar(userId)
    const viaje = c.viajes[tripId]
    if (!viaje) return { ok: false, motivo: 'viaje_sin_fechas' }
    await resolverSinRomper(userId, c)
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
      pendiente: pendientes({ datos, destino: viaje.destino, viaje, items: itemsMapa, hoy, nombreDe: (s) => nombreDeSitio(catalogos, viaje.destino, s) }),
      // El puntito del botón: algo ganado cuya animación no se vio (se saltó).
      puntito: c.logros.some((f) => f.animacion_vista === false && (f.destino === viaje.destino || f.destino === GLOBAL)),
      viaje: { id: viaje.id, inicio: viaje.inicio, fin: viaje.fin, hoy },
    }
  }

  /**
   * (V9) La foto con la que se ganó cada sitio (la de la foto o el Visto que lo dio; sin foto suya —un Visto, «Yo también estaba»— no hay: la pantalla usa la del sitio de nuestros datos).
   * `c`: lo ya cargado de la cuenta (`cargar`). Devuelve { sitio: url }.
   */
  async function fotosDeSitios(c, sitios, userId = null) {
    const fotos = {}
    if (typeof repo.fotoUrl !== 'function') return fotos
    // (V16) Antes de buscar la foto de cada sitio, une a sus hechos las fotos que ya estén subidas (la foto llega al álbum un poco DESPUÉS del hecho).
    if (userId && c.hechos.some((x) => x.tipo === 'foto' && !x.foto_id && !x.deshecho_en)) {
      const r = await unirFotos(userId).catch(() => null)
      if (r && r.unidos > 0) c = { ...c, hechos: await repo.hechosDe(userId) }
    }
    for (const s of sitios) {
      const h = c.hechos.find((x) => !x.deshecho_en && x.foto_id && (x.sitio === s || (Array.isArray(x.sitios) && x.sitios.includes(s))))
      if (h) fotos[s] = await repo.fotoUrl(h.foto_id).catch(() => null)
    }
    return fotos
  }

  /**
   * (V16) UNE CADA HECHO CON FOTO A SU FOTO. La app manda el hecho y sube la foto al álbum por separado (y la de la cámara, desde una cola del móvil), así que el hecho se guardaba con `foto_id` vacío y no había foto
   * que enseñar. Aquí se busca, para cada hecho con foto sin unir, la foto de la MISMA persona cuya fecha y hora de cámara (`trip_photo_meta.taken_at`) coincide con la del hecho (el instante del hecho ES la hora de
   * toma de esa foto). Solo se une si hay UNA sola foto que cuadre (si hay dudas, se queda sin unir). Varios hechos de una misma foto (una foto que da dos sitios) la comparten. Devuelve cuántos unió y cuántos no.
   */
  async function unirFotos(userId) {
    if (typeof repo.hechosConFotoSinUnir !== 'function' || typeof repo.fotosConFecha !== 'function') return { ok: true, unidos: 0, sin_unir: 0 }
    const hechos = await repo.hechosConFotoSinUnir(userId)
    if (hechos.length === 0) return { ok: true, unidos: 0, sin_unir: 0 }
    const fotos = await repo.fotosConFecha(userId)
    const porFoto = new Map()
    let sinUnir = 0
    for (const h of hechos) {
      const t = Date.parse(h.instante)
      const candidatas = [...new Set(fotos.filter((f) => Number.isFinite(t) && Math.abs(Date.parse(f.taken_at) - t) < 1000).map((f) => f.photo_id))]
      if (candidatas.length === 1) porFoto.set(candidatas[0], [...(porFoto.get(candidatas[0]) ?? []), h.id])
      else sinUnir++
    }
    let unidos = 0
    for (const [fotoId, ids] of porFoto) unidos += await repo.unirFoto(userId, ids, fotoId)
    return { ok: true, unidos, sin_unir: sinUnir }
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
    return { ok: true, ...pendientes({ datos, destino: viaje.destino, viaje, items, hoy: hoyEn(viaje.destino), nombreDe: (s) => nombreDeSitio(catalogos, viaje.destino, s) }) }
  }

  /**
   * (V5) Los sitios con logro del destino de un viaje, para «¿De qué sitio es esta foto?» (una foto de la galería sin ubicación): cada uno con su nombre, los días de la ruta en que aparece
   * (`dias`: fechas) y si aún tiene algo por ganar (`pendiente`). Sin el viaje, `ok: false`.
   */
  async function sitiosParaReclamar(userId, tripId) {
    const c = await cargar(userId)
    const viaje = c.viajes[tripId]
    if (!viaje) return { ok: false, motivo: 'viaje_sin_fechas' }
    const d = datos.destinos[viaje.destino]
    const items = aItems(c.logros)
    const dias = new Map()
    for (const dia of viaje.dias ?? []) for (const p of dia.paradas ?? []) for (const s of sitiosDeLaParada(p)) { if (!dias.has(s)) dias.set(s, []); if (!dias.get(s).includes(dia.fecha)) dias.get(s).push(dia.fecha) }
    const sitios = sitiosConLogro(d).map((s) => {
      const pendiente = d.colecciones.some((x) => x.sitios.includes(s) && !items.get(clave(viaje.destino, 'pedazo', x.id + ':' + s))) || d.emblemas.some((e) => e.sitio === s && !items.get(clave(viaje.destino, 'emblema', e.id)))
      return { sitio: s, nombre: nombreDeSitio(catalogos, viaje.destino, s), dias: dias.get(s) ?? [], pendiente }
    })
    return { ok: true, destino: viaje.destino, inicio: viaje.inicio, fin: viaje.fin, sitios }
  }

  async function resumenDe(userId, tripId, { dia = null } = {}) {
    const c = await cargar(userId)
    const viaje = c.viajes[tripId]
    if (!viaje) return { ok: false, motivo: 'viaje_sin_fechas' }
    const items = aItems(c.logros)
    return { ok: true, ...resumen({ datos, destino: viaje.destino, items, viaje, desde: dia ?? viaje.inicio, hasta: dia ?? viaje.fin, hoy: hoyEn(viaje.destino), nombreDe: (s) => nombreDeSitio(catalogos, viaje.destino, s) }) }
  }

  /** (LZ3) Los datos de logros que ve esta cuenta: sin los destinos ocultos (Lanzarote) si no es administrador. Sin `esAdminDeCuenta` o sin ocultos, todo igual que antes. */
  const datosParaCuenta = async (userId) => (ocultos.size === 0 ? datos : datosVisiblesPara(datos, ocultos, esAdminDeCuenta ? await esAdminDeCuenta(userId).catch(() => false) : false))

  async function pasaporteDe(userId) {
    const datos = await datosParaCuenta(userId)
    const c = await cargar(userId)
    const perfil = await repo.perfilDe(userId)
    const items = aItems(c.logros)
    const dias = new Set(calcularConDias(c))
    return { ok: true, ...pasaporte({ datos, items, previos: perfil.previos, ahora: ahora(), salida: c.cuenta?.salida ?? null, diasConLaApp: dias.size }) }
  }
  /**
   * (V11) Los DÍAS VIAJANDO: los días de cada viaje en que se ha estado con la app (los viajes con algo que cuenta), del primero al último (o hasta hoy si aún no ha acabado). Antes contaba solo los días con algún hecho
   * («2 días viajando» en un viaje de 5). Sin repetir un día de un mismo destino.
   */
  const calcularConDias = (c) => {
    const dias = []
    const viajesConAlgo = new Set(hechosQueCuentan(c.hechos, c.viajes, datos).map((h) => h.trip_id))
    for (const id of viajesConAlgo) {
      const v = c.viajes[id]
      if (!v) continue
      const hoy = parteLocal(ahora(), datos.destinos[v.destino]?.timezone ?? 'UTC')?.fecha ?? v.fin
      const hasta = hoy < v.fin ? hoy : v.fin
      for (let d = v.inicio; d <= hasta; d = sumarDias(d, 1)) dias.push(`${v.destino}|${d}`)
    }
    return dias
  }

  async function vitrinaDe(userId) {
    const c = await cargar(userId)
    const perfil = await repo.perfilDe(userId)
    const items = aItems(c.logros)
    // La misma vitrina que ve la persona en «Todos mis logros»: una balda vaciada a propósito se queda vacía, y el bronce de un sello que ya es oro no entra.
    return { ok: true, ...vitrinaDeGanados({ items, guardada: perfil.vitrina, superadas: clavesSuperadas(datos, items) }) }
  }

  async function logrosDeViajero(userId) {
    const datos = await datosParaCuenta(userId)
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
      const pend = pendientes({ datos, destino: viaje.destino, viaje, items, hoy: sumarDias(finDate, datos.ajustes.plazo_reclamar_dias - aviso.quedan_dias_antes), nombreDe: (s) => nombreDeSitio(catalogos, viaje.destino, s) })
      if (pend.sorpresas + pend.pedazos > 0) {
        puestos.push({ user_id: userId, trip_id: viaje.id, tipo: 'quedan_dias', enviar_en: instanteLocal(sumarDias(finDate, datos.ajustes.plazo_reclamar_dias - aviso.quedan_dias_antes), '10:00', tz), payload: { destino: viaje.destino, dias: aviso.quedan_dias_antes, sorpresas: pend.sorpresas, ciudad: d.ciudad, texto: `Te quedan ${aviso.quedan_dias_antes} días para reclamar tus ${pend.sorpresas || pend.pedazos} sorpresas de ${d.ciudad}` } })
      }
    }
    return repo.encolarAvisos(puestos)
  }

  return { unirFotos, aItems, cargar, fotosDeSitios, expDe, sorteoDe, sorteoDeCuenta, registrarInvitacion, resolverInvitacion, visto, foto, cerca, deshacer, recalcular, estado, ficha, loDeAyer, sitiosParaReclamar, companeroPendientes, yoTambien, resumenDe, pasaporteDe, vitrinaDe, logrosDeViajero, prepararAvisos, calcularCon, puedeGanar, estadoDelPase, usarHoy, responderPrueba, precioDe, datos, catalogos }
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
