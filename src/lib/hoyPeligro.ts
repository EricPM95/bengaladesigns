import { hasRealCoordinates, haversineMeters } from './distanceMock'
import { numberedStopsOf } from './stopKind'
import { displayStopName } from './format'
import { articuloDeLosDatos, lugarCon } from './articulos'
import { puntualidadDe } from './puntualidadEntradas'
import {
  aHora,
  ancho,
  aplicarOpADia,
  cabe,
  claseDe,
  colocarEnDia,
  delDia,
  etiquetaConNumero,
  limiteDelDia,
  mejorDiaPara,
  type Colocacion,
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
import type { Coordinates, DayPlan, Route, Stop } from './types'

/**
 * HOY2 (agente C, apartado 5: pantallas 29 y 29b). «Tu entrada… corre peligro»: si a TU ritmo (desde donde estás y a la hora de ahora, con el trayecto de verdad) no llegas a una reserva o a un turno, sale el aviso de arriba
 * con [Ver solución]; la solución es una propuesta con el formato común (Cambia… / Se mantiene…). Una reserva o un turno NUNCA se mueve: lo que se quita o se pasa a la tarde es lo de antes, por la prioridad de siempre
 * (lo opcional, lo flexible, lo principal; lo imprescindible, solo preguntando).
 */

/** (V54 §2) Pasada la hora fija, la entrada ya se ha perdido: no hay «peligro» ni se protege (pasa a un aviso amarillo, «ya ha pasado»). */
export const PELIGRO_DESPUES_MIN = 0

export interface Peligro {
  stop: Stop
  /** La hora fija (minutos del día). */
  horaMin: number
  /** Cuánto se llegaría tarde (por dentro; nunca se enseña). */
  tardeMin: number
}

/** (V54 §2) Una entrada de hora LIBRE o con margen a la que llegarías tarde: nunca «peligro». `cabe`: el retraso aún cabe en el día. */
export interface EntradaConMargen {
  stop: Stop
  horaMin: number
  cabe: boolean
}
/** (V54 §2) Una entrada estricta cuya hora ya ha pasado. */
export interface EntradaPasada {
  stop: Stop
  horaMin: number
}
export interface RevisionDeEntradas {
  peligros: Peligro[]
  conMargen: EntradaConMargen[]
  pasadas: EntradaPasada[]
}

/** «el Foro Romano» a partir de «Foro Romano y Palatino» (solo el primer sitio; con su artículo por la terminación). */
export const conArticulo = (s: Stop): string => {
  const n = displayStopName(s.name).split(' y ')[0].trim()
  if (/^(el|la|los|las)\s/i.test(n)) return n.charAt(0).toLowerCase() + n.slice(1)
  // (V58 §5) Primero lo que dicen los datos del destino (con artículo o sin él: «Montserrat»); solo si el sitio no está, se adivina por la terminación.
  const delDato = articuloDeLosDatos(n)
  if (delDato !== null) return delDato ? `${delDato} ${n}` : n
  const p = n.split(' ')[0].toLowerCase()
  if (/as$/.test(p)) return `las ${n}`
  if (/os$/.test(p)) return `los ${n}`
  if (/(a|ión|dad)$/.test(p)) return `la ${n}`
  return `el ${n}`
}
const SIN_BASE: Simulacion = { ok: true, nuevas: new Map(), corrimiento: new Map() }

/**
 * (V54 §2) Mira TODAS las entradas con hora que quedan hoy y las reparte según su puntualidad (`puntualidadEntradas.ts`):
 *  · estrictas que no llegas → `peligros` (rojo); estrictas cuya hora ya pasó → `pasadas` (amarillo);
 *  · libres o con margen a las que llegas tarde → `conMargen` (verde si el retraso cabe en el día, amarillo si ya no cabe todo).
 */
export function revisarEntradas(p: { day: DayPlan; ctx: Contexto; ahoraMin: number; ubicacion: Coordinates | null; enCoche: boolean }): RevisionDeEntradas {
  const { day, ctx } = p
  const salida: RevisionDeEntradas = { peligros: [], conMargen: [], pasadas: [] }
  const vigentes = numberedStopsOf(day).filter((s) => !s.saltada)
  const k = vigentes.findIndex((s) => !s.checkedInAt)
  if (k < 0) return salida
  const restantes = vigentes.slice(k).filter((s) => !s.checkedInAt)
  const items = itemsDe(restantes, ctx.fijasDe(day), ctx.datos)
  const anterior = k > 0 ? vigentes[k - 1] : null
  const desde = p.ubicacion && hasRealCoordinates(p.ubicacion) ? ({ coordinates: p.ubicacion } as Stop) : anterior
  const sim = simularBase(items, p.ahoraMin, desde, p.enCoche)
  // ¿Cabe todo lo que queda en las horas del día con ese retraso?
  const ultimo = items[items.length - 1]
  const finDelDia = ultimo ? (sim.nuevas.get(ultimo.stop.id) ?? ultimo.t ?? p.ahoraMin) + (ultimo.dur ?? 0) : 0
  const cabeElDia = finDelDia <= limiteDelDia(day)
  for (const it of items) {
    if (!it.fija) continue
    const hora = ctx.horaFijaMin?.(it.stop) ?? it.t
    if (hora == null) continue
    // Si ya estás encima del sitio, no hay nada que avisar.
    if (p.ubicacion && hasRealCoordinates(it.stop.coordinates) && haversineMeters(p.ubicacion, it.stop.coordinates) < 150) continue
    const pun = puntualidadDe(it.stop.name)
    const estricta = pun.tipo === 'estricta' || Boolean(it.stop.isFreeTour)
    if (estricta && p.ahoraMin > hora + PELIGRO_DESPUES_MIN) {
      salida.pasadas.push({ stop: it.stop, horaMin: hora })
      continue
    }
    const tarde = sim.corrimiento.get(`!${it.stop.id}`)
    if (!tarde) continue
    if (estricta) salida.peligros.push({ stop: it.stop, horaMin: hora, tardeMin: tarde })
    else if (tarde > pun.margenMin) salida.conMargen.push({ stop: it.stop, horaMin: hora, cabe: cabeElDia })
  }
  return salida
}

/** ¿Qué reserva o turno ESTRICTO de lo que queda corre peligro? (el primero; null si todo llega a tiempo). */
export function quienCorrePeligro(p: { day: DayPlan; ctx: Contexto; ahoraMin: number; ubicacion: Coordinates | null; enCoche: boolean }): Peligro | null {
  return revisarEntradas(p).peligros[0] ?? null
}

export function textoDelPeligro(peligro: Peligro, esTurno: boolean): string {
  const h = aHora(peligro.horaMin, false)
  return `Tu ${esTurno ? 'turno' : 'entrada'} de las ${h} ${lugarCon('en', conArticulo(peligro.stop))} corre peligro.`
}

/**
 * (V54 §3) LA SOLUCIÓN de una entrada que no llegas, con la pieza A2 de la V50 («Pasar a otro día»): lo mínimo que hay que sacar de lo de ANTES para llegar a tiempo. Cada sitio que sale se pasa PRIMERO
 * al mejor día donde quepa (`mejorDiaPara`; quitarlo es la segunda opción: si no cabe en ningún día, a «Lugares pendientes»). La hoja enseña una tarjeta por sitio con su foto real. Vacío si no hay un cambio pequeño.
 * Una reserva o un turno NUNCA se mueve. `route` es necesario para pasar a otros días (sin él, todo va a pendientes).
 */
export function proponerSolucion(p: {
  day: DayPlan
  peligro: Peligro
  ctx: Contexto
  ahoraMin: number
  ubicacion: Coordinates | null
  route?: Route
  /** (HOY2b D) La hora fija de una parada que NO es su hora del día (id → minutos): el último momento para entrar en un sitio que cierra. El orden del día no cambia. */
  horaDe?: Record<string, number>
  /** «Para llegar a …» (por defecto: a tu entrada de las 9:15 en el Coliseo). */
  paraLlegar?: string
  /** La franja verde («Llegas a tu entrada de las 9:15»). */
  franja?: string
  /** «Elegir otro día»: el día que el viajero ha elegido para un sitio (id de la parada → id del día). */
  diaDe?: Record<string, string>
}): Propuesta[] {
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
  const esTurno = Boolean(peligro.stop.isFreeTour)
  const paraLlegar = p.paraLlegar ?? `llegar a tu ${esTurno ? 'turno' : 'entrada'} de las ${hora} en ${conArticulo(peligro.stop)}`
  const franja = p.franja ?? `Llegas a tu ${esTurno ? 'turno' : 'entrada'} de las ${hora}`
  const semanaCorta = (iso: string | null) => (iso ? ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'][new Date(`${iso}T12:00:00Z`).getUTCDay()] : 'DÍA')
  return variantes.map((v, i): Propuesta => {
    const sim = cabe(items, p.ahoraMin, desde, v.quitados, ctx.enCoche, SIN_BASE).sim
    const ops: Op[] = []
    const quitadas: Propuesta['quitadas'] = []
    const tarjetas: NonNullable<Propuesta['tarjetasDia']> = []
    let trabajo = day
    let dias: DayPlan[] = p.route?.days ?? []
    for (const id of [...v.quitados]) {
      const it = items.find((x) => x.stop.id === id)
      if (!it) continue
      const i0 = trabajo.stops.findIndex((s) => s.id === it.stop.id)
      const sacar: Op = { t: 'sacar', dia: day.id, stop: it.stop, indice: i0, ...conMeal(trabajo, i0, false) }
      // Primero, al mejor día donde quepa (o al que ha elegido el viajero); si no cabe en ninguno, a «Lugares pendientes».
      let col: Colocacion | null = null
      let destino: DayPlan | null = null
      if (p.route) {
        const forzado = p.diaDe?.[id] ? dias.find((d) => d.id === p.diaDe?.[id]) : undefined
        if (forzado) {
          col = colocarEnDia(forzado, it.stop, ctx)[0] ?? null
          destino = col ? forzado : null
        } else {
          const m = mejorDiaPara({ route: p.route, day, stop: it.stop, ctx, dias })
          col = m?.col ?? null
          destino = m?.dia ?? null
        }
      }
      const fotoUrl = it.stop.photoUrl || it.stop.fixedPhotoUrl || ''
      if (col && destino) {
        const o: Op[] = [sacar, ...col.ops]
        for (const op of o) {
          if (op.dia === day.id) trabajo = aplicarOpADia(trabajo, op, 'adelante')
          else dias = dias.map((d) => (d.id === op.dia ? aplicarOpADia(d, op, 'adelante') : d))
        }
        ops.push(...o)
        const etiqueta = etiquetaConNumero(ctx, destino)
        const iso = ctx.fechaDe?.(destino) ?? null
        const iDespues = col.despuesDe ? delDia(destino).findIndex((s) => s.id === col?.despuesDe?.id) : -1
        const mitad = Math.max(1, Math.ceil(delDia(destino).length / 2))
        const cuando = col.caso === 'c' ? `Al final del ${etiqueta.replace(/ \d+$/, '')} · «Lugares pendientes»` : iDespues >= mitad ? 'Por la tarde' : 'Por la mañana'
        quitadas.push({ id, nombre: nombre(it.stop), clase: it.clase, destino: 'manana', aDia: etiqueta })
        tarjetas.push({ nombre: nombre(it.stop), fotoUrl, cuando, semanaCorta: semanaCorta(iso), numero: iso ? String(Number(iso.slice(8, 10))) : String(destino.dayNumber), destino: etiqueta, diaDeHoy: ctx.etiquetaDia(day), parada: it.stop, ciudad: day.city })
      } else {
        ops.push({ t: 'campo', dia: day.id, id, antes: { time: it.stop.time, saltada: Boolean(it.stop.saltada) }, despues: { time: it.stop.time, saltada: true } })
        quitadas.push({ id, nombre: nombre(it.stop), clase: it.clase, destino: 'sobra' })
        tarjetas.push({ nombre: nombre(it.stop), fotoUrl, cuando: 'A Lugares pendientes', semanaCorta: '', numero: '', destino: '', diaDeHoy: ctx.etiquetaDia(day), aPendientes: true, parada: it.stop, ciudad: day.city })
      }
    }
    for (const [id, min] of sim.nuevas) {
      const s = day.stops.find((x) => x.id === id)
      if (!s || v.quitados.has(id)) continue
      ops.push({ t: 'campo', dia: day.id, id, antes: { time: s.time, saltada: Boolean(s.saltada) }, despues: { time: aHora(min, ancho(s)), saltada: Boolean(s.saltada) } })
    }
    const movidas = quitadas.filter((q) => q.destino === 'manana')
    const sinDia = quitadas.filter((q) => q.destino === 'sobra')
    const porDia = new Map<string, string[]>()
    for (const q of movidas) porDia.set(q.aDia as string, [...(porDia.get(q.aDia as string) ?? []), q.nombre])
    const partes = [...porDia.entries()].map(([d, ns]) => `${unir(ns)} al ${d}`)
    if (sinDia.length) partes.push(`${unir(sinDia.map((q) => q.nombre))} a Lugares pendientes`)
    const plural = quitadas.length > 1
    const sufijoPregunta = v.pregunta ? ' Es de los lugares más importantes de tu viaje: solo lo hacemos si tú quieres.' : ''
    const intro = movidas.length === 0 ? `Para ${paraLlegar}, hoy no te da tiempo de ver ${unir(sinDia.map((q) => q.nombre))}. ${plural ? 'Los guardamos' : 'Lo guardamos'} en Lugares pendientes y luego decides.${sufijoPregunta}` : `Para ${paraLlegar}, te pasamos ${unir(partes)}.${sufijoPregunta}`
    const unSoloDia = porDia.size === 1 && sinDia.length === 0
    const semana = movidas[0]?.aDia?.replace(/ \d+$/, '') ?? ''
    const boton = movidas.length === 0 ? (plural ? 'Guardarlos en pendientes' : 'Guardarlo en pendientes') : unSoloDia ? `Pasar${plural ? 'los' : 'lo'} al ${semana}` : 'Pasarlos a otro día'
    return {
      id: `peligro-${peligro.stop.id}-${i}`,
      tipo: 'peligro',
      intro,
      cambia: { titulo: partes.join(' y '), detalle: franja },
      mantiene: mantieneDe(items, ctx),
      ops,
      pregunta: v.pregunta || undefined,
      boton,
      tarjetasDia: tarjetas,
      franja,
      quitadas,
      corridas: sim.nuevas.size,
      intactas: items.filter((it) => it.fija).map((it) => it.stop.id),
    }
  })
}

/** La clase de una parada, por si la pantalla quiere decirla (solo para la prueba). */
export const claseDeParada = claseDe
void minDe
