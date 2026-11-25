import { addDaysToIso } from './dateRange'
import { aHora, minDe, type Op, type Propuesta } from './hoyCambiarPlan'
import type { CambioDeUnDia } from './reorganizarDia'
import { numberedStopsOf } from './stopKind'
import type { DayPlan, Route, Stop } from './types'

/**
 * (V55; Design «TODO IGUAL», decidido por Eric 25-nov) LAS TARJETAS DE UNA PROPUESTA: la regla de TODAS las hojas que proponen un cambio. Una tarjeta por cada sitio que cambia, con su foto real, el nombre,
 * a dónde va (en gris) y, a la derecha, su cuadrado: la fecha (otro día, o hoy a otra hora), el pin con reloj (a pendientes) o la papelera (quitar del viaje).
 * Todo sale de las OPERACIONES de la propuesta (`ops`), que ya existen en todas: así la regla vale igual para Roma, Lanzarote y cualquier destino nuevo, y una hoja nueva no puede salir sin tarjetas.
 * Pura (sin React ni almacén): la usa `HojaPropuesta` (CambiarPlan.tsx) y, con las mismas piezas, la alerta de «Reorganizar».
 */
export type TarjetaDePropuesta = NonNullable<Propuesta['tarjetaDia']>

const SEMANA_CORTA = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
const semanaLarga = (iso: string): string => new Date(`${iso}T12:00:00Z`).toLocaleDateString('es-ES', { weekday: 'long', timeZone: 'UTC' })

/** La fecha ISO de un día del viaje (sin fechas, null). */
export const fechaDelDia = (route: Route, day: DayPlan): string | null => {
  const inicio = route.answers.dateRange?.start ?? null
  return inicio ? addDaysToIso(inicio, day.dayNumber - 1) : null
}
/** El cuadrado de la fecha de un día: «JUE» «26»; sin fechas, «DÍA» y su número. */
export const cuadradoDelDia = (route: Route, day: DayPlan): { semanaCorta: string; numero: string } => {
  const iso = fechaDelDia(route, day)
  return iso ? { semanaCorta: SEMANA_CORTA[new Date(`${iso}T12:00:00Z`).getUTCDay()], numero: String(Number(iso.slice(8, 10))) } : { semanaCorta: 'DÍA', numero: String(day.dayNumber) }
}
/** «jueves 26» (o «día 3» sin fechas). */
export const nombreDelDia = (route: Route, day: DayPlan): string => {
  const iso = fechaDelDia(route, day)
  return iso ? `${semanaLarga(iso)} ${Number(iso.slice(8, 10))}` : `día ${day.dayNumber}`
}
/** «jueves» (o «día 3»): para «el resto de tu jueves». */
export const semanaDelDia = (route: Route, day: DayPlan): string => {
  const iso = fechaDelDia(route, day)
  return iso ? semanaLarga(iso) : `día ${day.dayNumber}`
}

/** «Hoy a las 17:30»; si la hora no es una hora (una franja suelta), solo «Hoy». */
const hoyALas = (time: string | undefined): string => {
  const m = minDe(time)
  return m == null ? 'Hoy' : `Hoy a las ${aHora(m, false)}`
}
const nombreDe = (s: Stop): string => s.name.replace(/\s*\([^)]*\)\s*$/, '')

/** Las tarjetas de una propuesta, de sus operaciones. Primero lo que cambia de sitio o de día; al final lo que solo se corre de hora. */
export function tarjetasDePropuesta(p: Propuesta, route: Route): TarjetaDePropuesta[] {
  if (p.tarjetasDia && p.tarjetasDia.length > 0) return p.tarjetasDia
  if (p.tarjetaDia) return [p.tarjetaDia]
  const dias = new Map(route.days.map((d) => [d.id, d]))
  const hoy = dias.get(p.ops[0]?.dia ?? '') ?? null
  if (!hoy) return []
  const hoyCuadrado = cuadradoDelDia(route, hoy)
  const etiquetaHoy = semanaDelDia(route, hoy)
  const base = (parada: Stop | null, nombre: string, ciudad: string): TarjetaDePropuesta => ({ nombre, fotoUrl: parada?.photoUrl || parada?.fixedPhotoUrl || '', cuando: '', semanaCorta: '', numero: '', destino: '', diaDeHoy: etiquetaHoy, ...(parada ? { parada, ciudad } : {}) })
  const deHoy = (parada: Stop | null, nombre: string, time: string | undefined, ciudad: string): TarjetaDePropuesta => ({ ...base(parada, nombre, ciudad), cuando: hoyALas(time), ...hoyCuadrado })
  const aPendientes = (parada: Stop, cuando: string, ciudad: string): TarjetaDePropuesta => ({ ...base(parada, nombreDe(parada), ciudad), cuando, aPendientes: true })
  const paradaDe = (op: { dia: string; id: string }): Stop | null => dias.get(op.dia)?.stops.find((s) => s.id === op.id) ?? null

  const meter = new Map<string, Extract<Op, { t: 'meter' }>>()
  const sacadas = new Set<string>()
  const sobraMeter = new Map<string, Extract<Op, { t: 'sobra_meter' }>>()
  for (const op of p.ops) {
    if (op.t === 'meter') meter.set(op.stop.id, op)
    else if (op.t === 'sacar') sacadas.add(op.stop.id)
    else if (op.t === 'sobra_meter') sobraMeter.set(op.stop.id, op)
  }

  const principales: TarjetaDePropuesta[] = []
  const corridas: TarjetaDePropuesta[] = []
  for (const op of p.ops) {
    const ciudad = dias.get(op.dia)?.city ?? hoy.city
    switch (op.t) {
      case 'sacar': {
        const entra = meter.get(op.stop.id)
        const sobra = sobraMeter.get(op.stop.id)
        if (entra && entra.dia === op.dia) {
          // Se mueve dentro del mismo día: hoy, a otra hora.
          principales.push(deHoy(op.stop, nombreDe(op.stop), entra.stop.time, ciudad))
        } else if (entra) {
          const destino = dias.get(entra.dia)
          if (!destino) break
          const pos = entra.indice >= Math.max(1, Math.ceil(destino.stops.length / 2)) ? 'por la tarde' : 'por la mañana'
          principales.push({ ...base(op.stop, nombreDe(op.stop), ciudad), cuando: `Al ${nombreDelDia(route, destino)}, ${pos}`, destino: nombreDelDia(route, destino), ...cuadradoDelDia(route, destino) })
        } else if (sobra) {
          principales.push(aPendientes(op.stop, 'A «Si te sobra tiempo»', ciudad))
        } else {
          principales.push({ ...base(op.stop, nombreDe(op.stop), ciudad), cuando: 'Se quita de tu viaje', quitar: true })
        }
        break
      }
      case 'meter': {
        if (sacadas.has(op.stop.id)) break
        if (op.dia === hoy.id) principales.push(deHoy(op.stop, nombreDe(op.stop), op.stop.time, ciudad))
        else {
          const destino = dias.get(op.dia)
          if (destino) principales.push({ ...base(op.stop, nombreDe(op.stop), ciudad), cuando: `Entra el ${nombreDelDia(route, destino)}`, destino: nombreDelDia(route, destino), ...cuadradoDelDia(route, destino) })
        }
        break
      }
      case 'sobra_meter':
        if (!sacadas.has(op.stop.id)) principales.push(aPendientes(op.stop, 'A «Si te sobra tiempo»', ciudad))
        break
      case 'campo': {
        const s = paradaDe(op)
        if (!s) break
        if (op.despues.saltada && !op.antes.saltada) principales.push(aPendientes(s, 'A Lugares pendientes', ciudad))
        else if (!op.despues.saltada && op.antes.saltada) principales.push(deHoy(s, nombreDe(s), op.despues.time, ciudad))
        else if (op.despues.time !== op.antes.time) corridas.push(deHoy(s, nombreDe(s), op.despues.time, ciudad))
        break
      }
      case 'comida': {
        const m = dias.get(op.dia)?.meals.find((x) => x.id === op.id)
        if (!m) break
        const nombre = m.chosenRestaurant?.name ?? (m.mealTime === 'dinner' ? 'Cena' : m.mealTime === 'lunch' ? 'Comida' : 'Desayuno')
        corridas.push(deHoy(null, nombre, op.despues, ciudad))
        break
      }
      case 'comida_sitio': {
        const m = dias.get(op.dia)?.meals.find((x) => x.id === op.id)
        const nombre = op.despues.sitio?.name ?? m?.chosenRestaurant?.name ?? (m?.mealTime === 'dinner' ? 'Cena' : 'Comida')
        principales.push(deHoy(null, nombre, op.despues.time, ciudad))
        break
      }
      case 'paradas': {
        const antes = new Map(op.antes.stops.map((s) => [s.id, s]))
        const despues = new Map(op.despues.stops.map((s) => [s.id, s]))
        for (const s of op.antes.stops) if (!despues.has(s.id) && !s.checkedInAt && !s.isArrival && !s.isBreak) principales.push(aPendientes(s, 'Sale de hoy', ciudad))
        for (const s of op.despues.stops) {
          const antesS = antes.get(s.id)
          if (!antesS && !s.isArrival && !s.isBreak) principales.push(deHoy(s, nombreDe(s), s.time, ciudad))
          else if (antesS && antesS.time !== s.time && !s.checkedInAt) corridas.push(deHoy(s, nombreDe(s), s.time, ciudad))
        }
        break
      }
      default:
        break
    }
  }
  return [...principales, ...corridas]
}

/** La franja verde de lo que se queda igual: la que trae la propuesta, o «Sigue igual: …» con lo que se mantiene. */
export const franjaDePropuesta = (p: Propuesta): string => p.franja ?? `Sigue igual: ${p.mantiene.titulo}`

/**
 * (V55) LAS TARJETAS DE «REORGANIZAR»: una por cada parada que cambia de sitio dentro de su día (de la parada 5 a la 2), con el cuadrado de la fecha de ese día; la que sale de la ruta (al adaptar al vuelo) va a «Si te sobra tiempo».
 * `cambios` son los días que `diasQueCambian` calcula; las paradas se leen de la ruta de ahora.
 */
export function tarjetasDeReorganizar(cambios: CambioDeUnDia[], route: Route): TarjetaDePropuesta[] {
  const tarjetas: TarjetaDePropuesta[] = []
  for (const c of cambios) {
    const dia = route.days.find((d) => d.id === c.dayId)
    if (!dia) continue
    const cuadrado = cuadradoDelDia(route, dia)
    const antes = numberedStopsOf(dia)
    const nuevas = c.reconstruido ? numberedStopsOf(c.reconstruido) : c.order.map((id) => dia.stops.find((s) => s.id === id)).filter((s): s is Stop => Boolean(s) && !s!.isArrival)
    for (const id of c.movidas) {
      const parada = antes.find((s) => s.id === id) ?? nuevas.find((s) => s.id === id)
      if (!parada) continue
      const base = { nombre: nombreDe(parada), fotoUrl: parada.photoUrl || parada.fixedPhotoUrl || '', destino: nombreDelDia(route, dia), diaDeHoy: semanaDelDia(route, dia), parada, ciudad: dia.city }
      const nueva = nuevas.findIndex((s) => s.id === id) + 1
      if (nueva === 0) tarjetas.push({ ...base, cuando: 'A «Si te sobra tiempo»', semanaCorta: '', numero: '', aPendientes: true })
      else tarjetas.push({ ...base, cuando: `De la parada ${antes.findIndex((s) => s.id === id) + 1} a la ${nueva} · ${semanaDelDia(route, dia)}`, ...cuadrado })
    }
  }
  return tarjetas
}
