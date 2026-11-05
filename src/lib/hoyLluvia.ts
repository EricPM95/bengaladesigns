import { aplicarCambio, listaDeNombres, volverAlPlan, type AvisoTiempo } from './avisosDelTiempo'
import { displayStopName } from './format'
import { itemsDe, mantieneDe, type Contexto, type Op, type Propuesta } from './hoyCambiarPlan'
import { spareInsertIndex } from './spareStops'
import { numberedStopsOf } from './stopKind'
import type { DayPlan, Stop } from './types'

/**
 * HOY2 (agente C, apartado 5: pantallas 31, 32 y 32b). Los avisos del tiempo (lluvia, nubes, viento) enseñan su alternativa con el FORMATO COMÚN de las propuestas (Cambia… / Se mantiene… / [Aplicar] / [Ver otra opción] /
 * «Volver a mi ruta original»), y al parar de llover, «¿Volvemos al plan?» es otra propuesta (la contraria). Lo que cambia el día lo hace una operación reversible (`paradas`): [Deshacer] y «Volver a mi ruta original»
 * lo dejan como estaba, sin perder lo que el viajero haya visto después. Las reservas no se tocan (`aplicarCambio` ya las respeta).
 */

const n = (s: Stop | { nombre: string }): string => displayStopName('name' in s ? s.name : s.nombre)
const cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1)
const con = (nombres: string[]) => nombres.map((x) => displayStopName(x))

const opParadas = (antes: DayPlan, despues: DayPlan): Op => ({
  t: 'paradas',
  dia: antes.id,
  antes: { stops: antes.stops, rainBackup: antes.rainBackup ?? null },
  despues: { stops: despues.stops, rainBackup: despues.rainBackup ?? null },
})

const mantieneReservas = (day: DayPlan, ctx: Contexto) => mantieneDe(itemsDe(numberedStopsOf(day).filter((s) => !s.saltada && !s.checkedInAt), ctx.fijasDe(day), ctx.datos), ctx)

const intactas = (day: DayPlan, ctx: Contexto): string[] => numberedStopsOf(day).filter((s) => ctx.fijasDe(day).has(s.id)).map((s) => s.id)

/** Las propuestas de un aviso del tiempo de Lanzarote: el cambio por lo de cubierto (o por otro mirador) y, en la lluvia, «Hoy toca descansar». */
export function proponerAlternativaDelTiempo(p: { day: DayPlan; aviso: AvisoTiempo; ctx: Contexto }): Propuesta[] {
  const { day, aviso, ctx } = p
  const salida: Propuesta[] = []
  const salen = con(aviso.salen.map((s) => s.nombre))
  const mantiene = mantieneReservas(day, ctx)
  if (aviso.entra.length > 0) {
    const despues = aplicarCambio(day, aviso, false)
    const entran = con(aviso.entra.map((e) => e.nombre))
    const reserva = aviso.entra.some((e) => e.reserva)
    salida.push({
      id: `tiempo-${aviso.tipo}`,
      tipo: 'lluvia',
      intro: aviso.tipo === 'lluvia' ? `Va a llover ${aviso.cuando}. Te proponemos un plan a cubierto.` : aviso.texto,
      cambia: {
        titulo: `${cap(listaDeNombres(salen))} ${salen.length > 1 ? 'salen' : 'sale'}; ${entran.length > 1 ? 'entran' : 'entra'} ${listaDeNombres(entran)}`,
        detalle: aviso.tipo === 'lluvia' ? (reserva ? 'Es una visita a cubierto y pide reserva: mírala antes de ir.' : 'Es una visita a cubierto.') : aviso.tipo === 'nubes' ? 'Con mejor cielo que el mirador de antes.' : 'Es un sitio a resguardo del viento.',
      },
      mantiene: { titulo: mantiene.titulo, detalle: 'Las reservas no se tocan.' },
      ops: [opParadas(day, despues)],
      quitadas: aviso.salen.map((s) => ({ id: s.id, nombre: displayStopName(s.nombre), clase: 'principal' as const, destino: 'otro' as const })),
      corridas: 0,
      intactas: intactas(day, ctx),
    })
  }
  if (aviso.tipo === 'lluvia') {
    const todas = con((aviso.salenTodas ?? aviso.salen).map((s) => s.nombre))
    const despues = aplicarCambio(day, { ...aviso, entra: [] }, true)
    salida.push({
      id: 'tiempo-descansar',
      tipo: 'lluvia',
      intro: `Va a llover ${aviso.cuando}. Si prefieres no mojarte, hoy toca descansar.`,
      cambia: { titulo: `${cap(listaDeNombres(todas))} ${todas.length > 1 ? 'salen' : 'sale'} de tu día`, detalle: 'Hoy toca descansar: quitamos lo que queda al aire libre.' },
      mantiene: { titulo: mantiene.titulo, detalle: 'Las reservas no se tocan.' },
      ops: [opParadas(day, despues)],
      quitadas: (aviso.salenTodas ?? aviso.salen).map((s) => ({ id: s.id, nombre: displayStopName(s.nombre), clase: 'principal' as const, destino: 'otro' as const })),
      corridas: 0,
      intactas: intactas(day, ctx),
    })
  }
  return salida
}

const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

/** Roma: «Si llueve» (la línea del día) como propuesta: lo que sale, lo que entra y el [Aplicar]. Sin cambio que hacer (nada sale ni entra): vacío. */
export function proponerSiLlueveRoma(p: { day: DayPlan; ctx: Contexto }): Propuesta[] {
  const { day, ctx } = p
  const plan = day.rainPlan
  if (!plan || day.rainBackup || (plan.remove.length === 0 && plan.add.length === 0)) return []
  const fuera = plan.remove.map(norm)
  let stops = day.stops.filter((s) => s.reservedId || !fuera.some((x) => x && (norm(s.name) === x || norm(s.name).includes(x))))
  for (const e of plan.add) {
    if (stops.some((s) => s.id === e.id)) continue
    stops = [...stops]
    stops.splice(spareInsertIndex(stops, e), 0, { ...e, nextLegPending: true })
  }
  const salen = day.stops.filter((s) => !stops.some((o) => o.id === s.id)).map(n)
  const entran = plan.add.filter((e) => stops.some((o) => o.id === e.id) && !day.stops.some((o) => o.id === e.id)).map((e) => displayStopName(e.name))
  const partes = [salen.length ? `${cap(listaDeNombres(salen))} ${salen.length > 1 ? 'salen' : 'sale'}` : '', entran.length ? `${entran.length > 1 ? 'entran' : 'entra'} ${listaDeNombres(entran)}` : ''].filter(Boolean)
  const mantiene = mantieneReservas(day, ctx)
  const despues: DayPlan = { ...day, stops, rainBackup: { stops: day.stops } }
  return [
    {
      id: 'tiempo-si-llueve',
      tipo: 'lluvia',
      intro: plan.text || 'Va a llover. Te proponemos un plan a cubierto.',
      cambia: { titulo: partes.join('; ') || 'Tu día se ajusta a la lluvia', detalle: entran.length ? 'Es una visita a cubierto.' : 'Lo que queda al aire libre se acorta.' },
      mantiene: { titulo: mantiene.titulo, detalle: 'Las reservas no se tocan.' },
      ops: [opParadas(day, despues)],
      quitadas: salen.map((nombre, i) => ({ id: `s${i}`, nombre, clase: 'principal' as const, destino: 'otro' as const })),
      corridas: 0,
      intactas: intactas(day, ctx),
    },
  ]
}

/** «¿Volvemos al plan?»: la propuesta contraria, cuando ha parado de llover. Lo de la lluvia se va y vuelve lo de antes; lo que entró se queda para otro día. */
export function proponerVolverAlPlan(p: { day: DayPlan; ctx: Contexto }): Propuesta[] {
  const { day, ctx } = p
  if (!day.rainBackup) return []
  const despues = volverAlPlan(day)
  const vuelven = despues.stops.filter((s) => !day.stops.some((o) => o.id === s.id)).map(n)
  const seQuedan = day.stops.filter((s) => !despues.stops.some((o) => o.id === s.id) && !s.checkedInAt).map(n)
  const mantiene = mantieneReservas(day, ctx)
  return [
    {
      id: 'tiempo-volver',
      tipo: 'vuelta_lluvia',
      intro: 'Ha parado de llover.',
      cambia: {
        titulo: vuelven.length ? `${cap(listaDeNombres(vuelven))} ${vuelven.length > 1 ? 'vuelven' : 'vuelve'} a tu ruta` : 'Tu ruta vuelve a ser la de antes',
        detalle: seQuedan.length ? `Y ${listaDeNombres(seQuedan)} se ${seQuedan.length > 1 ? 'quedan' : 'queda'} para otro día.` : 'Lo que cambió por la lluvia vuelve a su sitio.',
      },
      mantiene: { titulo: mantiene.titulo, detalle: 'Las reservas no se tocan.' },
      ops: [opParadas(day, despues)],
      quitadas: [],
      corridas: 0,
      intactas: intactas(day, ctx),
    },
  ]
}
