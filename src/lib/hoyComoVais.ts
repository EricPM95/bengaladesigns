import { hasRealCoordinates } from './distanceMock'
import type { DestinationPlace } from './destinationPlacesApi'
import { displayStopName } from './format'
import { aHora, aplicarOpADia, colocarEnDia, conMeal, diaAdmite, itemsDe, mantieneDe, minDe, nombre, unir, viajeMin, type Contexto, type Item, type Op, type Propuesta } from './hoyCambiarPlan'
import { horarioDeComer } from './hoyComer'
import { conArticuloDe } from './hoyQueHago'
import { numberedStopsOf } from './stopKind'
import type { Coordinates, DayPlan, Route, Stop } from './types'

/**
 * (HOY2b, E, apartado 2; Eric, 5-nov) «¿CÓMO VAIS?» (pantalla 16) Y «CANSADOS» (16b). Todo puro (sin React ni almacén).
 *  · Cuándo sale: UNA vez al día, después de comer, si quedan 2 paradas o más: [Con fuerzas] / [Cansados]. Se apaga con «Sugerencias del compañero».
 *  · Cansados NUNCA se queda sin respuesta: sale la primera que se pueda, por este orden:
 *      (4) solo queda lo opcional → «¿Y si por hoy lo dejáis aquí?…» [Terminar el día] (pasa a «Si te sobra tiempo») / [Seguimos];
 *      (1) hay algo flexible u opcional que quitar → «Vamos con calma»: quitarlo (la propuesta de siempre, con vista previa y Deshacer) y una pausa cerca, abierta ahora (un bar o café de «Cerca de ti › Comer»,
 *          o un mirador o una playa de nuestros datos); sin pausa, solo lo de quitar;
 *      (3) una reserva cerca y algo después → «Aguantad un poco: a las 15:00 tenéis la Cueva de los Verdes. Lo que queda después, ¿lo dejamos para otro día?» [Pasar a otro día];
 *      (2) nada que quitar → «Tomaos un respiro» con +15 / +30 (que no mueven la ruta: `hoyMasTiempo.ts`).
 * Reservas y turnos, nunca se tocan; lo imprescindible tampoco (solo se quita lo opcional y lo flexible, o lo que queda DESPUÉS de una reserva y no es imprescindible).
 */

export type CasoCansados = 'opcional' | 'calma' | 'reserva' | 'respiro'

export interface Pausa {
  nombre: string
  tipo: 'cafe' | 'bar' | 'mirador' | 'playa'
  coordinates: Coordinates
  minutos: number
  modo: 'coche' | 'pie'
}

export interface RespuestaCansados {
  caso: CasoCansados
  /** La propuesta (calma, reserva y opcional); `respiro` no lleva: son los +15 / +30. */
  propuesta: Propuesta | null
  pausa: Pausa | null
  /** La frase de arriba de cada caso. */
  texto: string
  /** El nombre de lo que se queda para otro día o para «Si te sobra tiempo» (para la prueba y la nota). */
  quita: string[]
}

/* ---------- cuándo sale «¿Cómo vais?» ---------- */

/** Después de comer: pasada la hora de la comida y su sobremesa (o dada por hecha), y antes de las 18:30. */
export const COMO_VAIS_DESPUES_DE_COMER_MIN = 60
export const COMO_VAIS_HASTA_MIN = 18 * 60 + 30

export function tocaComoVais(p: { day: DayPlan; ahoraMin: number; comidaHecha?: boolean; /** La tarjeta «Hora de comer» sigue a la vista (aún no se ha dado por comido): todavía no es «después de comer». */ comidaPendiente?: boolean }): boolean {
  if (p.comidaPendiente) return false
  const vigentes = numberedStopsOf(p.day).filter((s) => !s.saltada && !s.checkedInAt)
  if (vigentes.length < 2) return false
  if (p.ahoraMin > COMO_VAIS_HASTA_MIN) return false
  const comida = p.day.meals.find((m) => m.mealTime === 'lunch')
  const t = minDe(comida?.time)
  if (t == null) return false
  return Boolean(p.comidaHecha) || p.ahoraMin >= t + COMO_VAIS_DESPUES_DE_COMER_MIN
}

/* ---------- la pausa ---------- */

const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const MAX_PAUSA_PIE = 12
const MAX_PAUSA_COCHE = 15

/** Una pausa cerca y abierta ahora: primero un café o un bar de «Cerca de ti › Comer»; si no hay, un mirador o una playa de nuestros datos. Sin nada abierto cerca, null. */
export function buscarPausa(p: { lugares: DestinationPlace[]; origen: Coordinates | null; dateIso: string; ahoraMin: number; enCoche: boolean; excluir?: Set<string> }): Pausa | null {
  const { origen } = p
  if (!origen || !hasRealCoordinates(origen)) return null
  const tope = p.enCoche ? MAX_PAUSA_COCHE : MAX_PAUSA_PIE
  const modo = p.enCoche ? 'coche' : 'pie'
  const excluir = p.excluir ?? new Set<string>()
  const cercanos = <T extends DestinationPlace>(lista: T[]) =>
    lista
      .filter((l) => hasRealCoordinates(l.coordinates) && !excluir.has(norm(l.name)))
      .map((l) => ({ l, min: viajeMin({ coordinates: origen }, { coordinates: l.coordinates }, p.enCoche) }))
      .filter((x) => x.min <= tope)
      .sort((a, b) => a.min - b.min || a.l.name.localeCompare(b.l.name))
  const abierto = (l: DestinationPlace) => (l.schedule || l.hours_data ? horarioDeComer(l, p.dateIso, p.ahoraMin, 20).abierto !== false : true)
  const cafes = cercanos(p.lugares.filter((l) => l.kind === 'restaurant' && (l.sub_category === 'cafe' || l.sub_category === 'aperitivo') && horarioDeComer(l, p.dateIso, p.ahoraMin, 20).abierto === true))[0]
  if (cafes) return { nombre: cafes.l.name, tipo: cafes.l.sub_category === 'cafe' ? 'cafe' : 'bar', coordinates: cafes.l.coordinates, minutos: cafes.min, modo }
  const esMirador = (l: DestinationPlace) => l.tags?.some((t) => t === 'mirador') || /^mirador\b/i.test(l.name)
  const esPlaya = (l: DestinationPlace) => l.tags?.some((t) => t === 'playa') || /^playas?\b/i.test(l.name)
  const sitio = cercanos(p.lugares.filter((l) => l.kind === 'place' && (esMirador(l) || esPlaya(l)) && abierto(l)))[0]
  if (sitio) return { nombre: sitio.l.name, tipo: esMirador(sitio.l) ? 'mirador' : 'playa', coordinates: sitio.l.coordinates, minutos: sitio.min, modo }
  return null
}

/** «Una pausa con café en Barnum Cafe, a 4 min a pie.» */
export function fraseDePausa(pa: Pausa): string {
  const lugar = conArticuloDe(pa.nombre)
  const cuanto = `${pa.minutos} min ${pa.modo === 'coche' ? 'en coche' : 'a pie'}`
  switch (pa.tipo) {
    case 'cafe':
      return `Y una pausa con café en ${displayStopName(pa.nombre)}, a ${cuanto}.`
    case 'bar':
      return `Y una pausa en ${displayStopName(pa.nombre)}, a ${cuanto}.`
    case 'mirador':
      return `Y una pausa tranquila en ${lugar}, a ${cuanto}.`
    default:
      return `Y un rato de descanso en ${lugar}, a ${cuanto}.`
  }
}

/* ---------- quitar lo que sobra ---------- */

type Quitado = { ops: Op[]; quitadas: Propuesta['quitadas']; aDia: string }

/** Las operaciones para quitar `items` de hoy: lo opcional va a «Si te sobra tiempo»; lo demás, al primer día que admita paradas (a «Si te sobra tiempo» de ese día si no cabe). */
function quitar(route: Route, day: DayPlan, ctx: Contexto, items: Item[]): Quitado {
  const despues = route.days.slice(route.days.findIndex((d) => d.id === day.id) + 1)
  const manana = despues.find((d) => diaAdmite(d))
  const aDia = manana && despues[0] && manana.id === despues[0].id ? 'a mañana' : manana ? `al ${ctx.etiquetaDia(manana)}` : 'a mañana'
  let hoy = day
  let otro = manana
  const ops: Op[] = []
  const quitadas: Propuesta['quitadas'] = []
  for (const it of items) {
    let destino: 'sobra' | 'manana' | 'manana_sobra' = 'sobra'
    let delItem: Op[]
    if (it.clase !== 'opcional' && manana && diaAdmite(otro)) {
      const c = colocarEnDia(otro as DayPlan, it.stop, ctx, { permitirB: false })[0]
      const iy = hoy.stops.findIndex((s) => s.id === it.stop.id)
      delItem = [{ t: 'sacar', dia: day.id, stop: it.stop, indice: iy, ...conMeal(hoy, iy, false) }, ...c.ops]
      destino = c.caso === 'a' ? 'manana' : 'manana_sobra'
      for (const op of delItem) {
        if (op.dia === day.id) hoy = aplicarOpADia(hoy, op, 'adelante')
        else if (otro && op.dia === otro.id) otro = aplicarOpADia(otro, op, 'adelante')
      }
    } else {
      delItem = [{ t: 'campo', dia: day.id, id: it.stop.id, antes: { time: it.stop.time, saltada: Boolean(it.stop.saltada) }, despues: { time: it.stop.time, saltada: true } }]
    }
    ops.push(...delItem)
    quitadas.push({ id: it.stop.id, nombre: nombre(it.stop), clase: it.clase, destino })
  }
  return { ops, quitadas, aDia }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
/** «La Fundación pasa a mañana» / «El Jardín se queda en «Si te sobra tiempo»». */
function frasePasa(q: Quitado): string {
  const a = q.quitadas.filter((x) => x.destino === 'manana').map((x) => x.nombre)
  const b = q.quitadas.filter((x) => x.destino === 'manana_sobra').map((x) => x.nombre)
  const c = q.quitadas.filter((x) => x.destino === 'sobra').map((x) => x.nombre)
  const partes: string[] = []
  if (a.length) partes.push(`${unir(a)} pasa${a.length > 1 ? 'n' : ''} ${q.aDia}`)
  if (b.length) partes.push(`${unir(b)} pasa${b.length > 1 ? 'n' : ''} a «Si te sobra tiempo» ${q.aDia.replace('a mañana', 'de mañana').replace(/^al /, 'del ')}`)
  if (c.length) partes.push(`${unir(c)} pasa${c.length > 1 ? 'n' : ''} a «Si te sobra tiempo»`)
  return cap(partes.join(' y '))
}

/* ---------- la respuesta ---------- */

export function responderCansados(p: { route: Route; day: DayPlan; ctx: Contexto; ahoraMin: number; ubicacion: Coordinates | null; enCoche: boolean; dateIso: string; lugares: DestinationPlace[] }): RespuestaCansados {
  const { route, day, ctx } = p
  const vigentes = numberedStopsOf(day).filter((s) => !s.saltada)
  const k = vigentes.findIndex((s) => !s.checkedInAt)
  const restantes: Stop[] = k < 0 ? [] : vigentes.slice(k).filter((s) => !s.checkedInAt)
  const items = itemsDe(restantes, ctx.fijasDe(day), ctx.datos)
  const sinNada = (): RespuestaCansados => ({ caso: 'respiro', propuesta: null, pausa: null, texto: 'Tomaos un respiro.', quita: [] })
  if (items.length === 0) return sinNada()

  // Desde dónde se busca una pausa: donde estás; sin ubicación, tu siguiente parada.
  const origen = p.ubicacion ?? (restantes[0] && hasRealCoordinates(restantes[0].coordinates) ? restantes[0].coordinates : null)

  // (4) Solo queda lo opcional.
  if (items.every((it) => it.clase === 'opcional')) {
    const q = quitar(route, day, ctx, items)
    const nombres = q.quitadas.map((x) => x.nombre)
    const propuesta: Propuesta = {
      id: `cansados-opcional-${items.map((i) => i.stop.id).join('+')}`,
      tipo: 'cansados',
      intro: '¿Y si por hoy lo dejáis aquí? Lo que queda no es imprescindible.',
      cambia: { titulo: `${unir(nombres)} ${nombres.length > 1 ? 'pasan' : 'pasa'} a «Si te sobra tiempo»`, detalle: 'Lo podéis recuperar cuando queráis.' },
      mantiene: { titulo: 'todo lo que ya habéis visto', detalle: 'Nada se pierde.' },
      ops: q.ops,
      caso: undefined,
      quitadas: q.quitadas,
      corridas: 0,
      intactas: [],
    }
    return { caso: 'opcional', propuesta, pausa: null, texto: propuesta.intro, quita: nombres }
  }

  // (1) Algo flexible u opcional que quitar: lo más pequeño (una sola parada, la más prescindible; a igual, la que primero llega).
  const quitables = items.filter((it) => !it.fija && (it.clase === 'opcional' || it.clase === 'flexible'))
  if (quitables.length > 0) {
    const elegido = quitables.slice().sort((a, b) => (a.clase === 'opcional' ? 0 : 1) - (b.clase === 'opcional' ? 0 : 1))[0]
    const q = quitar(route, day, ctx, [elegido])
    const excluir = new Set(restantes.map((s) => norm(s.name)))
    const pausa = buscarPausa({ lugares: p.lugares, origen, dateIso: p.dateIso, ahoraMin: p.ahoraMin, enCoche: p.enCoche, excluir })
    const propuesta: Propuesta = {
      id: `cansados-calma-${elegido.stop.id}`,
      tipo: 'cansados',
      intro: 'Os proponemos aflojar un poco el día.',
      cambia: { titulo: frasePasa(q), detalle: pausa ? fraseDePausa(pausa) : 'Así el resto del día va más tranquilo.' },
      mantiene: mantieneDe(items, ctx),
      ops: q.ops,
      quitadas: q.quitadas,
      corridas: 0,
      intactas: items.filter((it) => it.fija).map((it) => it.stop.id),
    }
    return { caso: 'calma', propuesta, pausa, texto: 'Vamos con calma', quita: q.quitadas.map((x) => x.nombre) }
  }

  // (3) Una reserva cerca (en las próximas 2 horas y media) y algo después que se pueda dejar: «Aguantad un poco…».
  const iFija = items.findIndex((it) => it.fija && (ctx.horaFijaMin?.(it.stop) ?? it.t) != null && ((ctx.horaFijaMin?.(it.stop) ?? it.t) as number) - p.ahoraMin <= 150)
  if (iFija >= 0) {
    const fija = items[iFija]
    const despues = items.slice(iFija + 1).filter((it) => !it.fija && it.clase !== 'imprescindible')
    if (despues.length > 0) {
      const q = quitar(route, day, ctx, despues)
      const hora = aHora((ctx.horaFijaMin?.(fija.stop) ?? fija.t) as number, false)
      const sitio = conArticuloDe(fija.stop.name)
      const turno = Boolean(fija.stop.isFreeTour)
      const texto = `Aguantad un poco: a las ${hora} tenéis ${sitio}. Lo que queda después, ¿lo dejamos para otro día?`
      const propuesta: Propuesta = {
        id: `cansados-reserva-${fija.stop.id}`,
        tipo: 'cansados',
        intro: texto,
        cambia: { titulo: frasePasa(q), detalle: 'Así os queda un día más ligero.' },
        mantiene: { titulo: `${turno ? 'vuestro turno' : 'vuestra entrada'} de las ${hora}`, detalle: 'Las reservas no se tocan.' },
        ops: q.ops,
        quitadas: q.quitadas,
        corridas: 0,
        intactas: items.filter((it) => it.fija).map((it) => it.stop.id),
      }
      return { caso: 'reserva', propuesta, pausa: null, texto, quita: q.quitadas.map((x) => x.nombre) }
    }
  }

  // (2) Nada que quitar: un respiro.
  return sinNada()
}
