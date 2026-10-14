import { paraTuZona } from '../../shared/arrival/paraTuZona.js'
import type { ArrivalInfo, ArrivalMedio, ArrivalMode, ArrivalPoint } from './arrivalReturn'

/**
 * LA FICHA DE LLEGADA Y VUELTA (Tanda 7, punto 13; de pago y con la hora puesta). Aquí está TODO lo que dice el resumen, de arriba abajo, como datos: la pantalla (`ArrivalReturnSheet`) solo lo pinta y la
 * prueba (`pruebaTanda7_ficha.mjs`) lo compara palabra por palabra con el documento. Sale de `_llegada.json` (`tramos` + `para_tu_zona`, función `paraTuZona`) y de lo que puso el viajero; ninguna hora la
 * calcula la app (la de salir de su zona, para mirar si el tren funciona, se usa por dentro y no se enseña) y nunca se suma un tiempo total: cada tramo lleva el suyo.
 *
 * El taxi no existe aquí (los datos lo traen marcado `no_enseñar` y el servidor lo quita). Los textos con «centro» son solo los datos reales («32 km al centro»).
 */

export interface TramoDato {
  id?: string
  medio?: string
  nombre: string
  de?: string
  a?: string
  precio?: string
  tiempo?: string
  frecuencia?: string
  detalle?: string
  nota?: string
  nota_parada?: string
}

export interface FichaPaso {
  /** «Leonardo Express a Roma Termini». */
  nombre: string
  precio: string | null
  /** El tiempo de ESTE tramo y sus notas; nunca un total. */
  detalle: string | null
  medio: string
}

export interface FichaOpcion {
  /** Todos los tramos en una frase: «Leonardo Express a Roma Termini y bus 40 o 64 a Largo di Torre Argentina». */
  titulo: string
  pasos: FichaPaso[]
}

export type FichaMejor = { tipo: 'opcion'; opcion: FichaOpcion } | { tipo: 'traslado_privado'; texto: string }

export interface FichaModelo {
  kind: 'llegada' | 'vuelta'
  /** La primera frase («Aterrizas en Fiumicino a las 13:00.») y las partes que se resaltan (el punto y la hora). */
  intro: string
  resaltar: string[]
  /** Debajo del intro: el dato real («32 km al centro de Roma.») o, a la vuelta, null. */
  dato: string | null
  /** Con «Aún no lo sé», arriba: «Cuando sepas dónde duermes…». */
  avisoSinZona: string | null
  /** De noche o a primera hora: «A esta hora ya no hay tren: …». */
  avisoNoche: string | null
  modo: 'normal' | 'noche'
  sinZona: boolean
  /** «Tu mejor opción». Null con «Aún no lo sé» (no hay mejor opción: se enseñan las de hasta Termini en `otras`). */
  mejor: FichaMejor | null
  /** «Casi todo el transporte público llega a Termini…», solo si su mejor opción acaba en Termini. */
  termini: string | null
  /** Su mejor opción pasa por Termini (a la ida o a la vuelta): el mapa pequeño pone Termini entre el punto y su zona. */
  pasaPorTermini: boolean
  /** El título de la lista de las demás: «Otras opciones», «Otras opciones · solo lo que sigue funcionando» o, sin zona, «Cómo llegar a Termini». Null si no hay ninguna. */
  otrasTitulo: string | null
  otras: FichaOpcion[]
  /** El traslado privado (solo donde llegas lejos de la ciudad). Sin precio y sin decir que es más barato. */
  traslado: { texto: string; etiqueta: string } | null
  /** La comida al llegar (solo si la fila del día 1 la lleva). */
  comida: { texto: string; boton: string } | null
  /** «Tu ruta empieza en {primera parada}.» */
  rutaEmpieza: string | null
  /** A la vuelta: la maleta y la despedida. */
  maleta: { titulo: string; texto: string; consigna: string | null } | null
  despedida: string | null
}

export interface EntradaFicha {
  kind: 'llegada' | 'vuelta'
  mode: ArrivalMode
  info: ArrivalInfo
  medio: ArrivalMedio
  point: ArrivalPoint
  /** La hora del viajero, «HH:MM» o «H:MM». */
  hora: string
  dateIso: string | null
  /** Sin fechas, el mes del viaje (0-11): se mira el día 15. */
  mes: number | null
  /** La zona del alojamiento (el id: 'centro'…) o 'nose' / null = «Aún no lo sé». */
  zonaId: string | null
  /** Las zonas del destino con su nombre («Centro (Panteón, Trevi, Navona)»). */
  zonas: { id: string; nombre: string }[]
  /** La fila del día 1 lleva la comida al llegar (la marca del motor: `meals[].no_restaurant`). */
  comidaAlLlegar: boolean
  /** El nombre de la primera parada del día 1 (o null si ese día no lleva paradas). */
  primeraParada: string | null
}

const aMin = (hhmm: string | null | undefined): number | null => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm ?? ''))
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}
const dos = (n: number) => String(n).padStart(2, '0')
/** La hora como la escribe el viajero: «9:05», «17:00». */
export const horaCorta = (hhmm: string | null | undefined): string => {
  const min = aMin(hhmm)
  return min == null ? '' : `${Math.floor(min / 60)}:${dos(min % 60)}`
}

/** El nombre de una zona sin lo de entre paréntesis: «Centro (Panteón, Trevi, Navona)» → «Centro». */
export const nombreDeZona = (nombre: string | null | undefined): string => String(nombre ?? '').replace(/\s*\(.*\)\s*$/, '').trim()

const GENERICOS = /^(Bus|Metro|Tren|Tranvía|Autobús)\b/
/** «Bus 40 o 64» → «bus 40 o 64» (los nombres propios —Leonardo Express, Airlink— se quedan como están). */
const enMinuscula = (nombre: string): string => (GENERICOS.test(nombre) ? nombre.charAt(0).toLowerCase() + nombre.slice(1) : nombre)

function pasoDe(tramo: TramoDato): FichaPaso {
  if (tramo.medio === 'andando' && tramo.nota === 'Ya estás.') return { nombre: `Ya estás en ${tramo.a ?? 'tu zona'}`, precio: null, detalle: null, medio: 'andando' }
  const detalle = [tramo.tiempo, tramo.frecuencia, tramo.detalle, tramo.nota, tramo.nota_parada].filter(Boolean).join(' · ')
  return {
    nombre: tramo.medio === 'andando' ? `Andando${tramo.a ? ` a ${tramo.a}` : ''}` : `${tramo.nombre}${tramo.a ? ` a ${tramo.a}` : ''}`,
    precio: tramo.precio ?? null,
    detalle: detalle || null,
    medio: tramo.medio ?? 'otro',
  }
}

function opcionDe(tramos: TramoDato[]): FichaOpcion {
  const pasos = tramos.map(pasoDe)
  const titulo = pasos.map((paso, indice) => (indice === 0 ? paso.nombre : enMinuscula(paso.nombre))).join(' y ')
  return { titulo, pasos }
}

/** Lo que hay que coger DESPUÉS de Termini, en una frase: «el bus 40 o 64 hasta Largo di Torre Argentina y el tranvía 8 hasta Trastevere». */
function loDeSuZona(tramos: TramoDato[], desde: number): string {
  return tramos
    .slice(desde)
    .map((tramo) => (tramo.medio === 'andando' ? `andando${tramo.a ? ` hasta ${tramo.a}` : ''}` : `el ${enMinuscula(tramo.nombre)}${tramo.a ? ` hasta ${tramo.a}` : ''}`))
    .join(' y ')
}

/** Cuánto antes de la hora del billete hay que dejar la ciudad (el mismo margen de `arrivalRules.leaveMinutesOf`, sin redondear: aquí solo se mira si el servicio funciona). */
function margenDeSalida(mode: ArrivalMode, medio: ArrivalMedio, point: ArrivalPoint): number {
  if (mode === 'ferry') return (medio.salir_antes_min ?? 120) + (medio.trayecto_min ?? 110)
  return point.salir_antes_min ?? medio.salir_antes_min ?? (mode === 'avion' ? 180 : 45)
}

/** Cómo se nombra el punto en la primera frase: el aeropuerto y el puerto, por su nombre corto («Fiumicino», «Civitavecchia»); la estación, por el suyo («Roma Termini»). */
function puntoEnFrase(mode: ArrivalMode, point: ArrivalPoint): string {
  return mode === 'avion' || mode === 'ferry' ? point.corto ?? point.nombre : point.nombre
}

/** La primera frase de la ficha. Llegada: «Aterrizas en…», «Llegas a…», «Desembarcas en…». Vuelta: «Tu vuelo sale de…», «Tu tren sale de…», «Tu autobús sale de…», «Tu barco sale de…». */
export function introDeFicha(kind: 'llegada' | 'vuelta', mode: ArrivalMode, point: ArrivalPoint, hora: string): { intro: string; resaltar: string[] } {
  const punto = puntoEnFrase(mode, point)
  const h = horaCorta(hora)
  if (kind === 'llegada') {
    const intro = mode === 'avion' ? `Aterrizas en ${punto} a las ${h}.` : mode === 'ferry' ? `Desembarcas en ${punto} a las ${h}.` : `Llegas a ${punto} a las ${h}.`
    return { intro, resaltar: [punto, h] }
  }
  if (mode === 'avion') return { intro: `Tu vuelo sale de ${punto} a las ${h}. Te recomendamos estar en el aeropuerto 2 horas antes.`, resaltar: [punto, h] }
  if (mode === 'ferry') return { intro: `Tu barco sale de ${punto} a las ${h}. Mira en tu reserva a qué hora cierra el embarque.`, resaltar: [punto, h] }
  return { intro: `Tu ${mode === 'bus' ? 'autobús' : 'tren'} sale de ${punto} a las ${h}.`, resaltar: [punto, h] }
}

/** El dato real de debajo de la primera frase: «32 km al centro de Roma.» Solo en la llegada y solo donde el dato existe. */
export function datoDeFicha(info: ArrivalInfo, point: ArrivalPoint): string | null {
  if (!point.distancia) return null
  return /centro$/i.test(point.distancia) ? `${point.distancia} de ${info.ciudad}.` : `${point.distancia}.`
}

interface TrasladoDato {
  tarjeta_llegada?: string
  tarjeta_vuelta?: string
  tarjeta_vuelta_barco?: string
  etiqueta?: string
}

interface ParaTuZonaDevuelto {
  zona: string
  sinZona: boolean
  quitarDelResumen: number[]
  avisoSinZona: string | null
  modo: 'normal' | 'noche'
  aviso: string | null
  mejor: { tipo: 'opcion'; tramos: TramoDato[]; pasaPorTermini: boolean; otroBilleteDesde: number | null; notaOtroBillete: string | null } | { tipo: 'traslado_privado' }
  otras: { tramos: TramoDato[] }[]
}

/** Cuenta el resumen entero de la ficha. Null si el destino no trae la tabla «Para tu zona» (entonces la pantalla enseña la información general de siempre). */
export function construirFicha(entrada: EntradaFicha): FichaModelo | null {
  const { kind, mode, info, medio, point, hora, dateIso, mes, zonaId, zonas, comidaAlLlegar, primeraParada } = entrada
  const llegada = kind === 'llegada'
  const ptz = (info.para_tu_zona ?? null) as { traslado_privado?: TrasladoDato } | null
  if (!ptz) return null
  // La hora para mirar si el servicio funciona: a la llegada, la de llegar; a la vuelta, la de SALIR de su zona (vuelo − margen). Solo por dentro.
  let horaParaServicio = hora
  if (!llegada) {
    const salir = (((aMin(hora) ?? 0) - margenDeSalida(mode, medio, point)) % 1440 + 1440) % 1440
    horaParaServicio = `${dos(Math.floor(salir / 60))}:${dos(salir % 60)}`
  }
  const resultado = paraTuZona(info, { zona: zonaId ?? 'nose', puntoId: point.id, hora: horaParaServicio, fecha: dateIso, mes, sentido: llegada ? 'llegada' : 'vuelta' }) as ParaTuZonaDevuelto | null
  if (!resultado) return null
  const { intro, resaltar } = introDeFicha(kind, mode, point, hora)
  const traslado = ptz.traslado_privado ?? {}
  const textoTraslado = llegada ? traslado.tarjeta_llegada : mode === 'ferry' ? traslado.tarjeta_vuelta_barco ?? traslado.tarjeta_vuelta : traslado.tarjeta_vuelta
  const noche = resultado.modo === 'noche'
  const sinZona = resultado.sinZona
  const nombreZona = nombreDeZona(zonas.find((zona) => zona.id === resultado.zona)?.nombre)

  let mejor: FichaMejor | null = null
  let termini: string | null = null
  const otras: FichaOpcion[] = []
  let otrasTitulo: string | null = null

  if (sinZona) {
    // «Aún no lo sé»: sin «Tu mejor opción» ni lo de Termini; las opciones hasta Termini, las de siempre.
    const todas: TramoDato[][] = []
    if (resultado.mejor.tipo === 'opcion') todas.push(resultado.mejor.tramos)
    for (const otra of resultado.otras) todas.push(otra.tramos)
    todas.forEach((tramos) => otras.push(opcionDe(tramos)))
    const desdeAqui = nombreZona || 'Termini'
    if (otras.length > 0) otrasTitulo = llegada ? `Cómo llegar a ${desdeAqui}` : `Cómo ir desde ${desdeAqui}`
  } else if (resultado.mejor.tipo === 'traslado_privado') {
    mejor = { tipo: 'traslado_privado', texto: textoTraslado ?? '' }
    resultado.otras.forEach((otra) => otras.push(opcionDe(otra.tramos)))
    if (otras.length > 0) otrasTitulo = noche ? 'Otras opciones · solo lo que sigue funcionando' : 'Otras opciones'
  } else {
    mejor = { tipo: 'opcion', opcion: opcionDe(resultado.mejor.tramos) }
    resultado.otras.forEach((otra) => otras.push(opcionDe(otra.tramos)))
    if (otras.length > 0) otrasTitulo = 'Otras opciones'
    if (llegada && resultado.mejor.pasaPorTermini && resultado.mejor.otroBilleteDesde != null) {
      const nota = String(resultado.mejor.notaOtroBillete ?? '').replace(/^Es otro billete/, 'es otro billete')
      termini = `Casi todo el transporte público llega a Termini, la estación principal. Desde allí, ${loDeSuZona(resultado.mejor.tramos, resultado.mejor.otroBilleteDesde)}: ${nota}`
    }
  }

  // El traslado privado: solo donde llegas lejos de la ciudad (aeropuerto y puerto). De noche ya es «Tu mejor opción», no se repite.
  const hayTraslado = (mode === 'avion' || mode === 'ferry') && Boolean(textoTraslado) && !(mejor && mejor.tipo === 'traslado_privado')

  let comida: FichaModelo['comida'] = null
  if (llegada && comidaAlLlegar) {
    const aqui = `Te recomendamos comer algo antes de ponerte en marcha: aquí tienes los mejores restaurantes de ${info.ciudad}.`
    comida = { texto: sinZona || !nombreZona ? aqui : `Tu alojamiento está en la zona de ${nombreZona}. ${aqui}`, boton: 'Explorar restaurantes' }
  }

  return {
    kind,
    intro,
    resaltar,
    dato: llegada ? datoDeFicha(info, point) : null,
    avisoSinZona: sinZona ? resultado.avisoSinZona : null,
    avisoNoche: noche ? resultado.aviso : null,
    modo: resultado.modo,
    sinZona,
    mejor,
    termini,
    pasaPorTermini: !sinZona && resultado.mejor.tipo === 'opcion' && resultado.mejor.pasaPorTermini,
    otrasTitulo,
    otras,
    traslado: hayTraslado ? { texto: String(textoTraslado), etiqueta: traslado.etiqueta ?? '' } : null,
    comida,
    rutaEmpieza: llegada && primeraParada ? `Tu ruta empieza en ${primeraParada}.` : null,
    maleta: !llegada && info.maleta ? { titulo: info.maleta.titulo ?? 'La maleta, el último día', texto: info.maleta.texto, consigna: consignaEnUnaFrase(info) } : null,
    despedida: !llegada ? info.despedida || null : null,
  }
}

/** «A nivel de los andenes de Termini, en el lado de Via Giolitti · todos los días de 7:00 a 21:00 · desde 6 € por maleta»: los datos de la consigna, sin el nombre de ninguna empresa. */
function consignaEnUnaFrase(info: ArrivalInfo): string | null {
  const consigna = (info.maleta as { consigna?: { sitio?: string; horario?: string; precio?: string } } | undefined)?.consigna
  if (!consigna) return null
  const partes = [consigna.sitio, consigna.horario, consigna.precio].filter(Boolean) as string[]
  if (partes.length === 0) return null
  const [primera, ...resto] = partes
  return [primera.charAt(0).toUpperCase() + primera.slice(1), ...resto].join(' · ')
}
