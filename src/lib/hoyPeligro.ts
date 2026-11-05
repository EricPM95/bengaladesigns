import { hasRealCoordinates, haversineMeters } from './distanceMock'
import { numberedStopsOf } from './stopKind'
import {
  aHora,
  ancho,
  aplicarOpADia,
  cabe,
  claseDe,
  colocarEnDia,
  conMeal,
  itemsDe,
  mantieneDe,
  minDe,
  minimoAQuitar,
  nombre,
  simularBase,
  unir,
  ORDEN_DE_QUITAR,
  type Contexto,
  type Op,
  type Propuesta,
  type Simulacion,
} from './hoyCambiarPlan'
import type { Coordinates, DayPlan, Stop } from './types'

/**
 * HOY2 (agente C, apartado 5: pantallas 29 y 29b). «Tu entrada… corre peligro»: si a TU ritmo (desde donde estás y a la hora de ahora, con el trayecto de verdad) no llegas a una reserva o a un turno, sale el aviso de arriba
 * con [Ver solución]; la solución es una propuesta con el formato común (Cambia… / Se mantiene…). Una reserva o un turno NUNCA se mueve: lo que se quita o se pasa a la tarde es lo de antes, por la prioridad de siempre
 * (lo opcional, lo flexible, lo principal; lo imprescindible, solo preguntando).
 */

/** Pasada la hora fija más esto, el aviso ya no tiene sentido (ya se ha perdido). */
export const PELIGRO_DESPUES_MIN = 30

export interface Peligro {
  stop: Stop
  /** La hora fija (minutos del día). */
  horaMin: number
  /** Cuánto se llegaría tarde (por dentro; nunca se enseña). */
  tardeMin: number
}

const SIN_BASE: Simulacion = { ok: true, nuevas: new Map(), corrimiento: new Map() }

/** ¿Qué reserva o turno de lo que queda corre peligro? (el primero; null si todo llega a tiempo). */
export function quienCorrePeligro(p: { day: DayPlan; ctx: Contexto; ahoraMin: number; ubicacion: Coordinates | null; enCoche: boolean }): Peligro | null {
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
    if (!it.fija) continue
    const tarde = sim.corrimiento.get(`!${it.stop.id}`)
    if (!tarde) continue
    const hora = ctx.horaFijaMin?.(it.stop) ?? it.t
    if (hora == null || p.ahoraMin > hora + PELIGRO_DESPUES_MIN) continue
    // Si ya estás encima del sitio, no corre peligro.
    if (p.ubicacion && hasRealCoordinates(it.stop.coordinates) && haversineMeters(p.ubicacion, it.stop.coordinates) < 150) continue
    return { stop: it.stop, horaMin: hora, tardeMin: tarde }
  }
  return null
}

export function textoDelPeligro(peligro: Peligro, esTurno: boolean): string {
  const h = aHora(peligro.horaMin, false)
  return `Tu ${esTurno ? 'turno' : 'entrada'} de las ${h} en ${nombre(peligro.stop)} corre peligro.`
}

/** «Una solución»: lo mínimo que hay que mover de lo de ANTES para llegar a tiempo; lo que sale pasa a la tarde (si cabe al final del día) o a «Si te sobra tiempo». Vacío si no hay un cambio pequeño que lo arregle. */
export function proponerSolucion(p: { day: DayPlan; peligro: Peligro; ctx: Contexto; ahoraMin: number; ubicacion: Coordinates | null; /** (HOY2b D) La hora fija de una parada que NO es su hora del día (id → minutos): el último momento para entrar en un sitio que cierra. El orden del día no cambia. */ horaDe?: Record<string, number> }): Propuesta[] {
  const { day, ctx, peligro } = p
  const vigentes = numberedStopsOf(day).filter((s) => !s.saltada)
  const k = vigentes.findIndex((s) => !s.checkedInAt)
  if (k < 0) return []
  const restantes = vigentes.slice(k).filter((s) => !s.checkedInAt)
  const items = itemsDe(restantes, ctx.fijasDe(day), ctx.datos).map((it) => (p.horaDe?.[it.stop.id] != null ? { ...it, t: p.horaDe[it.stop.id] } : it))
  const anterior = k > 0 ? vigentes[k - 1] : null
  const desde = p.ubicacion && hasRealCoordinates(p.ubicacion) ? ({ coordinates: p.ubicacion } as Stop) : anterior
  const variantes: { quitados: Set<string>; pregunta: boolean }[] = []
  const vistas = new Set<string>()
  const meter = (q: Set<string> | null, pregunta = false) => {
    if (!q || q.size === 0) return
    const clave = [...q].sort().join('|')
    if (vistas.has(clave)) return
    vistas.add(clave)
    variantes.push({ quitados: q, pregunta })
  }
  for (let hasta = 0; hasta < ORDEN_DE_QUITAR.length; hasta++) {
    meter(minimoAQuitar(items, p.ahoraMin, desde, ctx.enCoche, SIN_BASE, hasta, 'pronto'))
    meter(minimoAQuitar(items, p.ahoraMin, desde, ctx.enCoche, SIN_BASE, hasta, 'tarde'))
  }
  if (variantes.length === 0) meter(minimoAQuitar(items, p.ahoraMin, desde, ctx.enCoche, SIN_BASE, 3, 'pronto', [...ORDEN_DE_QUITAR, 'imprescindible']), true)
  const hora = aHora(peligro.horaMin, false)
  return variantes.map((v, i): Propuesta => {
    const sim = cabe(items, p.ahoraMin, desde, v.quitados, ctx.enCoche, SIN_BASE).sim
    const ops: Op[] = []
    const quitadas: Propuesta['quitadas'] = []
    let trabajo = day
    // De lo que sale, lo que se pueda se va al final del día (a la tarde); lo demás, a «Si te sobra tiempo».
    for (const id of [...v.quitados]) {
      const it = items.find((x) => x.stop.id === id)
      if (!it) continue
      const i0 = trabajo.stops.findIndex((s) => s.id === it.stop.id)
      const sacar: Op = { t: 'sacar', dia: day.id, stop: it.stop, indice: i0, ...conMeal(trabajo, i0, false) }
      const sin = aplicarOpADia(trabajo, sacar, 'adelante')
      const c = it.clase === 'imprescindible' ? undefined : colocarEnDia(sin, it.stop, ctx, { permitirB: false })[0]
      if (c && c.caso === 'a') {
        ops.push(sacar, ...c.ops)
        trabajo = c.ops.reduce((d, op) => aplicarOpADia(d, op, 'adelante'), sin)
        quitadas.push({ id, nombre: nombre(it.stop), clase: it.clase, destino: 'otro' })
      } else {
        ops.push({ t: 'campo', dia: day.id, id, antes: { time: it.stop.time, saltada: Boolean(it.stop.saltada) }, despues: { time: it.stop.time, saltada: true } })
        quitadas.push({ id, nombre: nombre(it.stop), clase: it.clase, destino: 'sobra' })
      }
    }
    for (const [id, min] of sim.nuevas) {
      const s = day.stops.find((x) => x.id === id)
      if (!s || v.quitados.has(id)) continue
      ops.push({ t: 'campo', dia: day.id, id, antes: { time: s.time, saltada: Boolean(s.saltada) }, despues: { time: aHora(min, ancho(s)), saltada: Boolean(s.saltada) } })
    }
    const aTarde = quitadas.filter((q) => q.destino === 'otro').map((q) => q.nombre)
    const aSobra = quitadas.filter((q) => q.destino === 'sobra').map((q) => q.nombre)
    const partes: string[] = []
    if (aTarde.length) partes.push(`${unir(aTarde)} pasa${aTarde.length > 1 ? 'n' : ''} a la tarde`)
    if (aSobra.length) partes.push(`${unir(aSobra)} pasa${aSobra.length > 1 ? 'n' : ''} a «Si te sobra tiempo»`)
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
    const esTurno = Boolean(peligro.stop.isFreeTour)
    return {
      id: `peligro-${peligro.stop.id}-${i}`,
      tipo: 'peligro',
      intro: v.pregunta ? `Para llegar a tu ${esTurno ? 'turno' : 'entrada'} de las ${hora} tendríamos que dejar ${unir(quitadas.map((q) => q.nombre))}, que es de lo más importante. ¿Lo dejamos?` : `Llegarás tarde a tu ${esTurno ? 'turno' : 'entrada'} de las ${hora}.`,
      cambia: { titulo: cap(partes.join(' y ')), detalle: v.pregunta ? 'Es de lo más importante: solo lo hacemos si tú quieres.' : `Así llegas a tu ${esTurno ? 'turno' : 'entrada'}.` },
      mantiene: mantieneDe(items, ctx),
      ops,
      pregunta: v.pregunta || undefined,
      quitadas,
      corridas: sim.nuevas.size,
      intactas: items.filter((it) => it.fija).map((it) => it.stop.id),
    }
  })
}

/** La clase de una parada, por si la pantalla quiere decirla (solo para la prueba). */
export const claseDeParada = claseDe
void minDe
