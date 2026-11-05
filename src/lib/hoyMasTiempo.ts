import { itemsDe, minDe, simularBase, aHora, type Contexto } from './hoyCambiarPlan'
import type { Peligro } from './hoyPeligro'
import type { VentanaDeHorario } from './hoyHorarios'
import { numberedStopsOf } from './stopKind'
import type { DayPlan } from './types'

/**
 * (HOY2b, E, apartado 3; Eric, 5-nov) «+15 / +30 MIN» NO MUEVE LA RUTA. Vale para [Necesito más tiempo] de la HOY1 y para el «Tomaos un respiro» de Cansados.
 * La ruta no cambia: la app solo mira si, con ese tiempo de más, llegas a algo CERRADO o TARDE a una reserva o un turno. Todo puro (sin React ni almacén).
 *  · Algo cerrado: solo un aviso, sin botones («Tómate 30 min más sin prisa, pero llegarías a la Iglesia de San Miguel ya cerrada: podrás verla por fuera»). «Podrás verla por fuera» solo en lo que se ve desde fuera
 *    (iglesias, castillos…: `ver_por` = dentro_y_fuera en los datos); en lo demás, «…llegarías a la Cueva de los Verdes ya cerrada». Nunca «lo pasamos a otro día».
 *  · Una reserva o un turno en peligro: esa opción no se ofrece. Sale «Con 30 min más no llegas a tu entrada de las 15:00» y [Ver solución] (la solución de «Tu entrada corre peligro» de la HOY2 C).
 *  · Reorganizar de verdad es «Voy con retraso» (Cambiar plan).
 */

export interface ResultadoMasTiempo {
  tipo: 'libre' | 'cerrado' | 'peligro'
  texto: string
  /** La parada que se cierra (solo en `cerrado`). */
  cierra?: { id: string; nombre: string; seVeFuera: boolean }
  /** La reserva o el turno en peligro (solo en `peligro`): lo que enseña [Ver solución]. */
  peligro?: Peligro
}

type Genero = { f: boolean; plural: boolean }
/** El género y el número de un nombre con su artículo («la Cueva de los Verdes» → f, singular; «los Museos Vaticanos» → m, plural). */
export function generoDe(nombreConArticulo: string, plural = false): Genero {
  const m = /^(la|las|el|los)\s/i.exec(nombreConArticulo.trim())
  const art = m ? m[1].toLowerCase() : ''
  return { f: art === 'la' || art === 'las', plural: plural || art === 'las' || art === 'los' }
}
const cerradoDe = (g: Genero) => `cerrad${g.f ? 'a' : 'o'}${g.plural ? 's' : ''}`
const verlo = (g: Genero, futuro: 'tu' | 'vuestro') => `${futuro === 'tu' ? 'podrás' : 'podréis'} ver${g.plural ? (g.f ? 'las' : 'los') : g.f ? 'la' : 'lo'} por fuera`

/** ¿Llegando a las `min` (minutos del día) se encuentra cerrado? Solo cuenta lo que ya cerró (después del último cierre o de la última entrada): antes de abrir o en la pausa de mediodía, se espera. */
export function cerradoAl(v: VentanaDeHorario, min: number): boolean {
  const ultimo = v.tramos[v.tramos.length - 1]
  if (!ultimo) return false
  if (min > ultimo.cierra) return true
  if (min >= ultimo.abre && v.ultimaEntrada != null && v.ultimaEntrada <= ultimo.cierra && min > v.ultimaEntrada) return true
  return false
}

export function evaluarMasTiempo(p: {
  day: DayPlan
  /** La parada donde estás (la que se alarga). */
  paradaId: string
  minutos: 15 | 30
  ctx: Contexto
  ahoraMin: number
  enCoche: boolean
  ventanas: VentanaDeHorario[]
  /** Cansados habla en plural («Tomaos…», «no llegáis»). */
  plural?: boolean
}): ResultadoMasTiempo {
  const { day, ctx, minutos } = p
  const pl = Boolean(p.plural)
  const orden = numberedStopsOf(day).filter((s) => !s.saltada)
  const i = orden.findIndex((s) => s.id === p.paradaId)
  const actual = i >= 0 ? orden[i] : null
  const restantes = (i >= 0 ? orden.slice(i + 1) : orden).filter((s) => !s.checkedInAt)
  const items = itemsDe(restantes, ctx.fijasDe(day), ctx.datos)
  const t0 = actual ? minDe(actual.time) : null
  const finPrevisto = (t0 ?? p.ahoraMin) + (actual?.durationMinutes || 0)
  const desde = Math.max(finPrevisto, p.ahoraMin)
  const base = simularBase(items, desde, actual, p.enCoche)
  const con = simularBase(items, desde + minutos, actual, p.enCoche)

  // 1 · Una reserva o un turno al que ya no llegarías (y antes sí): esa opción no se ofrece.
  for (const it of items) {
    if (!it.fija || !con.corrimiento.has(`!${it.stop.id}`) || base.corrimiento.has(`!${it.stop.id}`)) continue
    const hora = ctx.horaFijaMin?.(it.stop) ?? it.t
    if (hora == null) continue
    const turno = Boolean(it.stop.isFreeTour)
    const texto = pl ? `Con ${minutos} min más no llegáis a ${turno ? 'vuestro turno' : 'vuestra entrada'} de las ${aHora(hora, false)}.` : `Con ${minutos} min más no llegas a tu ${turno ? 'turno' : 'entrada'} de las ${aHora(hora, false)}.`
    const tarde = (con.corrimiento.get(`!${it.stop.id}`) ?? 0) - (base.corrimiento.get(`!${it.stop.id}`) ?? 0)
    return { tipo: 'peligro', texto, peligro: { stop: it.stop, horaMin: hora, tardeMin: Math.max(1, tarde) } }
  }

  // 2 · Algo que se visita por dentro y llegarías ya cerrado (y antes no): solo un aviso, sin botones.
  for (const it of items) {
    const v = p.ventanas.find((x) => x.stop.id === it.stop.id)
    if (!v || it.t == null) continue
    const llegadaCon = con.nuevas.get(it.stop.id) ?? it.t
    const llegadaBase = base.nuevas.get(it.stop.id) ?? it.t
    if (!cerradoAl(v, llegadaCon) || cerradoAl(v, llegadaBase)) continue
    const g = generoDe(v.nombre, v.plural)
    const cierre = pl ? `llegaríais a ${v.nombre} ya ${cerradoDe(g)}` : `llegarías a ${v.nombre} ya ${cerradoDe(g)}`
    const fuera = v.seVeFuera ? `: ${verlo(g, pl ? 'vuestro' : 'tu')}` : ''
    return { tipo: 'cerrado', texto: `${pl ? 'Tomaos' : 'Tómate'} ${minutos} min más sin prisa, pero ${cierre}${fuera}.`, cierra: { id: it.stop.id, nombre: v.nombre, seVeFuera: v.seVeFuera } }
  }

  // 3 · Nada que avisar: la ruta sigue igual.
  return { tipo: 'libre', texto: pl ? `Tomaos ${minutos} min más sin prisa: vuestra ruta sigue igual.` : `Tómate ${minutos} min más sin prisa: tu ruta sigue igual.` }
}

