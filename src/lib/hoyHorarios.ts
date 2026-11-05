import { datosDelSitio } from './avisoDeHorario'
import { hasRealCoordinates, haversineMeters } from './distanceMock'
import { horarioDeParada, type HorarioDeParada } from './horarioDeParada'
import { aHora, aplicarOpADia, itemsDe, mantieneDe, minDe, nombre as nombreCorto, simularBase, unir, type Contexto, type Propuesta } from './hoyCambiarPlan'
import { proponerSolucion, type Peligro } from './hoyPeligro'
import { numberedStopsOf } from './stopKind'
import type { Coordinates, DayPlan, Stop } from './types'

/**
 * (HOY2b 8b, Eric 5-nov) LOS AVISOS DE HORARIO, EN HOY (y no en DÍAS). Todo puro (sin React):
 *  · la mañana: «Para hoy: la Cueva de los Verdes cierra a las 18:00. Vamos con margen; si os retrasáis, os avisamos a tiempo.» si alguna parada de hoy va justa (llegada prevista a menos de 30 min del cierre o de la última entrada, o antes de abrir);
 *  · en directo, con la hora real: «A este ritmo llegarías a la Cueva de los Verdes cuando ya ha cerrado» si a tu ritmo llegarías cerrado a algo que se visita por dentro (o a menos de 20 min de la última entrada), con [Ver solución]
 *    (adelantarla quitando antes algo flexible, la propuesta de siempre con su vista previa). Si se ve por fuera, no avisa.
 * «Se visita por dentro» y «se ve por fuera» lo dicen los datos del sitio (`ver_por`, que el servidor manda dentro de `hours_data`; shared/verPor.js). Nunca «a esta hora»: siempre la hora de cierre o de apertura a la vista.
 */

/** La mañana avisa si la llegada prevista queda a menos de esto del cierre (o de la última entrada). */
export const JUSTO_MANANA_MIN = 30
/** En directo, aviso si a tu ritmo llegarías a menos de esto de la última entrada (o ya cerrado). */
export const JUSTO_EN_DIRECTO_MIN = 20
/** En directo solo cuenta si a tu ritmo llegas al menos esto más tarde de lo previsto (con el día en hora, ya lo dijo la mañana). */
export const RETRASO_MINIMO_MIN = 5
/** Como mucho, tantos sitios en la tarjeta de la mañana. */
export const MAX_SITIOS_MANANA = 2

export interface VentanaDeHorario {
  stop: Stop
  /** «la Cueva de los Verdes», «los Museos Vaticanos»: con su artículo. */
  nombre: string
  plural: boolean
  horario: HorarioDeParada
  /** Los tramos del día, en minutos. */
  tramos: { abre: number; cierra: number }[]
  /** La última entrada del último tramo (minutos), si los datos la traen. */
  ultimaEntrada: number | null
  /** Se ve desde fuera aunque esté cerrado (dentro y fuera). */
  seVeFuera: boolean
  /** El mirador de al lado (`si_cerrado`), si el sitio lo tiene. */
  mirador: string | null
}

const aMin = (hora: string | null | undefined): number | null => minDe(hora)
const horaCorta = (min: number) => aHora(min, false)

/** La ventana de horario de una parada (o null si no se visita por dentro con horario de verdad, o ya va por fuera / de paso / con reserva). */
export function ventanaDeHorario(p: { stop: Stop; datos: Map<string, Record<string, unknown>>; dateIso: string | null; mes?: number | null }): VentanaDeHorario | null {
  const { stop } = p
  if (stop.isBreak || stop.isArrival || stop.isZoneWalk || stop.isFreeWalk || stop.passThrough || stop.closedThisDay || stop.isNightExperience || stop.isNightView || stop.isFreeTour || stop.isSunset) return null
  if (stop.visitMode === 'fuera' || stop.saltada || stop.checkedInAt) return null
  // Una entrada reservada ya tiene su hora (y su aviso de «corre peligro»): no se mira aquí.
  if (stop.reservedId || stop.reservationTime) return null
  const sitio = datosDelSitio({ name: stop.name, fullName: (stop as { fullName?: string }).fullName }, p.datos) ?? (stop.hoursData as Record<string, unknown> | undefined)
  const verPor = sitio?.ver_por === 'dentro_y_fuera' || sitio?.ver_por === 'solo_dentro' ? (sitio.ver_por as 'dentro_y_fuera' | 'solo_dentro') : null
  if (!verPor) return null
  const horario = horarioDeParada({ hoursData: (stop.hoursData as Record<string, unknown> | null | undefined) ?? sitio ?? null, scheduleText: stop.scheduleText, hours: stop.hours }, p.dateIso, p.mes ?? null)
  if (!horario || horario.cerrado || horario.tramos.length === 0) return null
  if (/al anochecer/.test(horario.texto)) return null
  const tramos = horario.tramos.map((t) => ({ abre: aMin(t.abre) ?? 0, cierra: aMin(t.cierra) ?? 24 * 60 }))
  const frase = typeof sitio?.aviso_nombre === 'string' ? (sitio.aviso_nombre as string) : nombreCorto(stop)
  const si = sitio?.si_cerrado as { cambiar_titulo?: string } | undefined
  return {
    stop,
    nombre: frase,
    plural: sitio?.aviso_plural === true,
    horario,
    tramos,
    ultimaEntrada: aMin(horario.ultimaEntrada),
    seVeFuera: verPor === 'dentro_y_fuera',
    mirador: si?.cambiar_titulo ?? null,
  }
}

/** El último momento para ENTRAR en el tramo en el que cae `min`: la última entrada (en el último tramo) o el cierre. null si cae entre tramos o antes de abrir. */
export function limiteDeEntrada(v: VentanaDeHorario, min: number): number | null {
  const k = v.tramos.findIndex((t) => min >= t.abre && min <= t.cierra)
  if (k < 0) return null
  return k === v.tramos.length - 1 && v.ultimaEntrada != null && v.ultimaEntrada <= v.tramos[k].cierra ? v.ultimaEntrada : v.tramos[k].cierra
}

/* ------------------------------------------------------------------ */
/* La mañana                                                            */
/* ------------------------------------------------------------------ */

export interface SitioJusto {
  v: VentanaDeHorario
  /** La llegada prevista (minutos). */
  llegada: number
  tipo: 'cierre' | 'apertura'
  /** Cuánto falta para el cierre o la última entrada (cierre) o para abrir (apertura). */
  margen: number
}

/** Las paradas de hoy que van justas de horario, las más justas primero, como mucho 2. */
export function paradasJustasDeHoy(ventanas: VentanaDeHorario[]): SitioJusto[] {
  const lista: SitioJusto[] = []
  for (const v of ventanas) {
    const t = minDe(v.stop.time)
    if (t == null) continue
    const limite = limiteDeEntrada(v, t)
    if (limite != null) {
      if (limite - t < JUSTO_MANANA_MIN) lista.push({ v, llegada: t, tipo: 'cierre', margen: limite - t })
      continue
    }
    // Entre tramos o antes de abrir: la llegada prevista es antes de que abra.
    const siguiente = v.tramos.find((tr) => tr.abre > t)
    if (siguiente) lista.push({ v, llegada: t, tipo: 'apertura', margen: siguiente.abre - t })
  }
  return lista.sort((a, b) => a.margen - b.margen || (minDe(a.v.stop.time) ?? 0) - (minDe(b.v.stop.time) ?? 0)).slice(0, MAX_SITIOS_MANANA)
}

/** La hora de cierre que se dice del tramo en el que cae la llegada. */
const cierreDicho = (j: SitioJusto): number => j.v.tramos.find((t) => j.llegada >= t.abre && j.llegada <= t.cierra)?.cierra ?? j.v.tramos[j.v.tramos.length - 1].cierra

/** El párrafo de un sitio justo (frases completas; la hora de cierre o de apertura siempre a la vista). `primero`: «Para hoy: …»; el segundo, «Y también: …». */
export function parrafoDeHoy(j: SitioJusto, primero: boolean): string {
  const apertura = primero ? 'Para hoy: ' : 'Y también: '
  if (j.tipo === 'apertura') {
    const abre = j.v.tramos.find((t) => t.abre > j.llegada)!.abre
    const verbo = j.v.plural ? 'abren' : 'abre'
    return `${apertura}${j.v.nombre} ${verbo} a las ${horaCorta(abre)} y lo tenéis previsto un poco antes. Si llegáis antes de esa hora, os tocará esperar un poco.${j.v.seVeFuera ? ' Mientras, se ve igual por fuera.' : ''}`
  }
  const cierra = cierreDicho(j)
  const ult = j.v.ultimaEntrada != null && j.v.ultimaEntrada < cierra && limiteDeEntrada(j.v, j.llegada) === j.v.ultimaEntrada ? `, y la última entrada es a las ${horaCorta(j.v.ultimaEntrada)}` : ''
  const verbo = j.v.plural ? 'cierran' : 'cierra'
  const cola = j.v.seVeFuera ? ' Y si llegáis tarde, se ve igual por fuera.' : j.v.mirador ? ' Y si llegáis tarde, desde el mirador de al lado se ve igual de bonito.' : ''
  return `${apertura}${j.v.nombre} ${verbo} a las ${horaCorta(cierra)}${ult}. Vamos con margen; si os retrasáis, os avisamos a tiempo.${cola}`
}

/* ------------------------------------------------------------------ */
/* En directo                                                           */
/* ------------------------------------------------------------------ */

export interface LlegadaTarde {
  v: VentanaDeHorario
  /** Cuándo llegarías a tu ritmo (minutos). */
  llegada: number
  /** La hora prevista de la parada. */
  prevista: number
  /** El último momento para entrar (la última entrada o el cierre). */
  limite: number
  /** La hora de cierre que se dice. */
  cierra: number
  /** 'cerrado': llegarías cuando ya no se puede entrar; 'justo': llegarías a menos de 20 min de la última entrada. */
  tipo: 'cerrado' | 'justo'
}

/** ¿A qué visita por dentro llegarías tarde a tu ritmo (desde donde estás y a la hora de ahora)? La primera por orden; null si a todas llegas bien o se ven por fuera. */
export function quienLlegaTarde(p: { day: DayPlan; ctx: Contexto; ahoraMin: number; ubicacion: Coordinates | null; enCoche: boolean; ventanas: VentanaDeHorario[]; /** Para comprobar una propuesta ya hecha: no se pide ir más tarde de lo previsto (la propuesta ya cambia las horas previstas). */ sinRetrasoMinimo?: boolean }): LlegadaTarde | null {
  const { day, ctx } = p
  const vigentes = numberedStopsOf(day).filter((s) => !s.saltada)
  const k = vigentes.findIndex((s) => !s.checkedInAt)
  if (k < 0) return null
  const restantes = vigentes.slice(k).filter((s) => !s.checkedInAt)
  const items = itemsDe(restantes, ctx.fijasDe(day), ctx.datos)
  const anterior = k > 0 ? vigentes[k - 1] : null
  const desde = p.ubicacion && hasRealCoordinates(p.ubicacion) ? ({ coordinates: p.ubicacion } as Stop) : anterior
  const sim = simularBase(items, p.ahoraMin, desde, p.enCoche)
  for (const it of items) {
    const v = p.ventanas.find((x) => x.stop.id === it.stop.id)
    if (!v || v.seVeFuera || it.t == null) continue
    const llegada = sim.nuevas.get(it.stop.id) ?? it.t
    if (!p.sinRetrasoMinimo && llegada - it.t < RETRASO_MINIMO_MIN) continue
    // Si ya estás encima del sitio, no hay nada que avisar.
    if (p.ubicacion && hasRealCoordinates(it.stop.coordinates) && haversineMeters(p.ubicacion, it.stop.coordinates) < 150) continue
    const ultimoTramo = v.tramos[v.tramos.length - 1]
    const limiteFinal = v.ultimaEntrada != null && v.ultimaEntrada <= ultimoTramo.cierra ? v.ultimaEntrada : ultimoTramo.cierra
    const k2 = v.tramos.findIndex((t) => llegada >= t.abre && llegada <= t.cierra)
    if (k2 < 0) {
      // Después del último cierre: llegarías con todo cerrado. Antes de un tramo (la pausa de mediodía): esperarías, sin más.
      if (llegada > ultimoTramo.cierra) return { v, llegada, prevista: it.t, limite: limiteFinal, cierra: ultimoTramo.cierra, tipo: 'cerrado' }
      continue
    }
    const limite = limiteDeEntrada(v, llegada)!
    const cierra = v.tramos[k2].cierra
    if (k2 === v.tramos.length - 1 && v.ultimaEntrada != null && llegada > v.ultimaEntrada) return { v, llegada, prevista: it.t, limite: v.ultimaEntrada, cierra, tipo: 'cerrado' }
    if (limite - llegada < JUSTO_EN_DIRECTO_MIN) return { v, llegada, prevista: it.t, limite, cierra, tipo: 'justo' }
  }
  return null
}

/** «a el Mirador del Río» → «al Mirador del Río» (y «de el» → «del»). */
export const conA = (nombre: string): string => nombre.replace(/^el /, 'al ').replace(/^(?!al )/, 'a ')

/** El aviso de arriba (con la hora de cierre a la vista; nunca «a esta hora»). */
export function textoDelAviso(t: LlegadaTarde): { titulo: string; hora: string } {
  const ya = t.v.plural ? 'han' : 'ha'
  const titulo = t.tipo === 'cerrado' ? `A este ritmo llegarías ${conA(t.v.nombre)} cuando ya ${ya} cerrado` : `A este ritmo llegarías ${conA(t.v.nombre)} justo antes de que ${t.v.plural ? 'cierren' : 'cierre'}`
  const hora = t.v.ultimaEntrada != null && t.limite === t.v.ultimaEntrada && t.v.ultimaEntrada < t.cierra ? `${t.v.plural ? 'Cierran' : 'Cierra'} a las ${horaCorta(t.cierra)} y la última entrada es a las ${horaCorta(t.v.ultimaEntrada)}.` : `${t.v.plural ? 'Cierran' : 'Cierra'} a las ${horaCorta(t.cierra)}.`
  return { titulo, hora }
}

/**
 * «Una solución»: adelantar esa visita para llegar a tiempo, quitando ANTES algo (lo opcional, luego lo flexible, luego lo principal; lo imprescindible, solo preguntando; reservas y turnos nunca). Se reutiliza el motor de «tu entrada corre peligro»
 * tratando la visita como si tuviera hora fija en su último momento para entrar (menos 5 min de margen). Nada se mueve solo: es una propuesta con su vista previa y su Deshacer.
 */
export function proponerAdelantar(p: { day: DayPlan; tarde: LlegadaTarde; ctx: Contexto; ahoraMin: number; ubicacion: Coordinates | null; ventanas: VentanaDeHorario[] }): Propuesta[] {
  const { day, tarde, ctx } = p
  const limiteMin = Math.max(tarde.limite - 5, p.ahoraMin)
  const objetivo = tarde.v.stop
  const ctxMod: Contexto = { ...ctx, fijasDe: (d) => new Set([...ctx.fijasDe(d), objetivo.id]), horaFijaMin: (s) => (s.id === objetivo.id ? limiteMin : ctx.horaFijaMin?.(s) ?? null) }
  const peligro: Peligro = { stop: objetivo, horaMin: limiteMin, tardeMin: Math.max(0, tarde.llegada - limiteMin) }
  // (El día queda tal cual —su orden es el de sus horas—; solo la cuenta usa el último momento para entrar como hora fija de esa visita.)
  const propuestas = proponerSolucion({ day, peligro, ctx: ctxMod, ahoraMin: p.ahoraMin, ubicacion: p.ubicacion, horaDe: { [objetivo.id]: limiteMin } })
  const el = tarde.v.nombre
  const hora = horaCorta(tarde.cierra)
  const conHorario = new Set(p.ventanas.map((v) => v.stop.id))
  // «Se mantiene»: lo fijo de verdad (reservas y turnos del día), no la visita que se adelanta.
  const mantiene = mantieneDe(itemsDe(numberedStopsOf(day).filter((s) => !s.saltada && !s.checkedInAt), ctx.fijasDe(day), ctx.datos), ctx)
  const resultado: Propuesta[] = []
  propuestas.forEach((original, i) => {
    let pr = original
    // Lo que tiene horario no se manda «a la tarde» (se podría pasar su cierre): pasa a «Si te sobra tiempo», que es lo seguro.
    const aSobra = pr.quitadas.filter((q) => q.destino === 'otro' && conHorario.has(q.id))
    if (aSobra.length > 0) {
      const ids = new Set(aSobra.map((q) => q.id))
      const ops = pr.ops.filter((op) => !((op.t === 'sacar' || op.t === 'meter') && ids.has(op.stop.id)))
      for (const q of aSobra) {
        const s0 = day.stops.find((x) => x.id === q.id)
        if (s0) ops.push({ t: 'campo', dia: day.id, id: q.id, antes: { time: s0.time, saltada: Boolean(s0.saltada) }, despues: { time: s0.time, saltada: true } })
      }
      const quitadas = pr.quitadas.map((q) => (ids.has(q.id) ? { ...q, destino: 'sobra' as const } : q))
      const aTarde = quitadas.filter((q) => q.destino === 'otro').map((q) => q.nombre)
      const aSobraN = quitadas.filter((q) => q.destino === 'sobra').map((q) => q.nombre)
      const partes: string[] = []
      if (aTarde.length) partes.push(`${unir(aTarde)} pasa${aTarde.length > 1 ? 'n' : ''} a la tarde`)
      if (aSobraN.length) partes.push(`${unir(aSobraN)} pasa${aSobraN.length > 1 ? 'n' : ''} a «Si te sobra tiempo»`)
      const titulo = partes.join(' y ')
      pr = { ...pr, ops, quitadas, cambia: { ...pr.cambia, titulo: titulo.charAt(0).toUpperCase() + titulo.slice(1) } }
    }
    // Solo vale si, con el cambio hecho, ninguna otra visita con horario llega ya cerrada (si no, no es una solución).
    const despues = pr.ops.reduce((d, op) => aplicarOpADia(d, op, 'adelante'), day)
    if (quienLlegaTarde({ day: despues, ctx, ahoraMin: p.ahoraMin, ubicacion: p.ubicacion, enCoche: ctx.enCoche, ventanas: p.ventanas, sinRetrasoMinimo: true })) return
    const quitados = pr.quitadas.map((q) => q.nombre)
    resultado.push({
      ...pr,
      id: `horario-${objetivo.id}-${i}`,
      intro: pr.pregunta ? `Para llegar ${conA(el)} antes de que cierre (a las ${hora}) tendríamos que dejar ${unir(quitados)}, que es de lo más importante. ¿Lo dejamos?` : `Para llegar ${conA(el)} antes de que cierre, a las ${hora}, hay que adelantarlo un poco. Este es el cambio más pequeño.`,
      cambia: { ...pr.cambia, detalle: pr.pregunta ? 'Es de lo más importante: solo lo hacemos si tú quieres.' : `Así llegas ${conA(el)} antes de que cierre.` },
      mantiene,
    })
  })
  return resultado
}
