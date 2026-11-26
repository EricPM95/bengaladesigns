import { addDaysToIso } from './dateRange'
import { aHora, minDe, type Op, type Propuesta } from './hoyCambiarPlan'
import type { CambioDeUnDia } from './reorganizarDia'
import { lugarCon } from './articulos'
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
  const todas = [...principales, ...corridas]
  // (V66, 20) En una hoja con MUCHOS cambios (más de 3): tarjeta solo para lo que cambia de día, va a pendientes o se quita. Lo que sigue en el mismo día (hoy a otra hora, «se corre unos minutos») no se menciona:
  // no enseñamos horas, cada uno va a su ritmo. Si no quedara ninguna, se dejan todas (una hoja sin nada que enseñar). La hoja de Reorganizar (`cambiosDeReorganizar`) no se toca: ver DECISIONES_V66.
  if (todas.length > MUCHOS_CAMBIOS) {
    const losQueCuentan = todas.filter((t) => t.aPendientes || t.quitar || Boolean(t.destino))
    if (losQueCuentan.length > 0) return losQueCuentan
  }
  return todas
}
const MUCHOS_CAMBIOS = 3

/** La franja verde de lo que se queda igual: la que trae la propuesta, o «Sigue igual: …» con lo que se mantiene. */
export const franjaDePropuesta = (p: Propuesta): string => p.franja ?? `Sigue igual: ${p.mantiene.titulo}`

/**
 * (V61; Design «Reorganizar Hoja» RO1, RO2 y RO3) LAS TARJETAS DE «REORGANIZAR»: UNA por cada sitio que cambia de verdad (de día, a «Si te sobra tiempo», quitado, o de hora más de 15 min), nunca con número de parada.
 * Todo se calcula COMPARANDO el día de ahora con el día como quedaría (`despues`): sale igual de lo que devuelve el motor (`reconstruido`), del orden que da el servidor o de un día adaptado al vuelo.
 * Los sitios se emparejan por su nombre (al rehacer un día el motor cambia los ids). Con varios días, las tarjetas van agrupadas por día (cabecera «VIERNES 27»), cada una en el día al que va.
 * Pura (sin React ni almacén). Vale igual para Roma, Lanzarote y cualquier destino.
 */
export interface DiaDespues {
  dayId: string
  /** El día como quedaría tras reorganizar. */
  despues: DayPlan
  /** true = solo cambia el ORDEN de las paradas (no trae horas nuevas): se dice «Después de …». */
  soloOrden?: boolean
}
export interface GrupoDeTarjetas {
  /** «VIERNES 27» (con varios días) o null (un solo día: sin cabecera). */
  cabecera: string | null
  tarjetas: TarjetaDePropuesta[]
}
export interface CambiosDeReorganizar {
  grupos: GrupoDeTarjetas[]
  total: number
  /** La franja verde, concreta: «Sigue igual: tu cena en Armando al Pantheon y tus reservas». */
  franja: string
}

const MARGEN_MIN = 15
const clave = (s: Stop): string => s.name.trim().toLowerCase()
const esSitio = (s: Stop): boolean => !s.isArrival && !s.isBreak
const mayuscula = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1)
const franjaDelDia = (m: number | null): string => (m == null ? 'ese día' : m < 14 * 60 ? 'por la mañana' : m < 20 * 60 ? 'por la tarde' : 'por la noche')
/** El máximo de paradas que se quedan en su sitio (la subsecuencia creciente más larga): lo demás son las que se han movido. */
function movidasDeOrden(antes: string[], despues: string[]): Set<string> {
  const pos = despues.map((id) => antes.indexOf(id)).filter((i) => i >= 0)
  const mejor: number[][] = pos.map(() => [])
  let largo: number[] = []
  pos.forEach((p, i) => {
    let base: number[] = []
    for (let j = 0; j < i; j++) if (pos[j] < p && mejor[j].length > base.length) base = mejor[j]
    mejor[i] = [...base, p]
    if (mejor[i].length > largo.length) largo = mejor[i]
  })
  const quedan = new Set(largo)
  return new Set(despues.filter((id) => !quedan.has(antes.indexOf(id))))
}

/** Una persona con una cena elegida en un día que se queda igual, y lo reservado: la franja verde. */
function franjaVerde(route: Route, cambiados: Set<string>, cambios: DiaDespues[]): string {
  const partes: string[] = []
  const hechas = new Map(cambios.map((c) => [c.dayId, c.despues]))
  for (const c of cambios) {
    const dia = hechas.get(c.dayId) as DayPlan
    for (const m of dia.meals) {
      const nombre = m.chosenRestaurant?.name
      if (!nombre || (m.mealTime !== 'dinner' && m.mealTime !== 'lunch')) continue
      if (cambiados.has(`comida:${c.dayId}:${m.mealTime}`)) continue
      partes.push(`tu ${m.mealTime === 'dinner' ? 'cena' : 'comida'} ${lugarCon('en', nombre)}`)
    }
  }
  const hayReservas = cambios.some((c) => (c.despues.stops ?? []).some((s) => (s.reservedId || s.isFreeTour) && !cambiados.has(`sitio:${clave(s)}`)))
  if (hayReservas) partes.push('tus reservas')
  if (partes.length === 0) return cambios.length > 1 ? 'Sigue igual: el resto de tus días' : `Sigue igual: el resto de tu ${semanaDelDia(route, route.days.find((d) => d.id === cambios[0]?.dayId) ?? route.days[0])}`
  const lista = partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`
  return `Sigue igual: ${lista}`
}

export function cambiosDeReorganizar(cambios: DiaDespues[], route: Route): CambiosDeReorganizar {
  const dias = new Map(route.days.map((d) => [d.id, d]))
  const despuesDe = new Map(cambios.map((c) => [c.dayId, c]))
  const varios = cambios.length > 1
  // Dónde acaba cada sitio de los días que cambian (por nombre).
  const destino = new Map<string, { dia: DayPlan; stop: Stop }>()
  const pendientesDe = new Map<string, DayPlan>()
  for (const c of cambios) {
    for (const s of c.despues.stops) if (esSitio(s)) destino.set(clave(s), { dia: c.despues, stop: s })
    for (const s of c.despues.spareStops ?? []) pendientesDe.set(clave(s), c.despues)
  }
  const antesDe = new Map<string, { dia: DayPlan; stop: Stop }>()
  for (const c of cambios) {
    const dia = dias.get(c.dayId)
    if (dia) for (const s of dia.stops) if (esSitio(s)) antesDe.set(clave(s), { dia, stop: s })
  }
  const conGrupo: { orden: number; destinoDia: DayPlan; tarjeta: TarjetaDePropuesta; principal: boolean }[] = []
  const cambiados = new Set<string>()
  const ponerTarjeta = (dia: DayPlan, t: TarjetaDePropuesta, principal: boolean) => conGrupo.push({ orden: dia.dayNumber, destinoDia: dia, tarjeta: t, principal })
  const base = (parada: Stop | null, nombre: string, dia: DayPlan, ciudad: string): TarjetaDePropuesta => ({ nombre, fotoUrl: parada?.photoUrl || parada?.fixedPhotoUrl || '', cuando: '', semanaCorta: '', numero: '', destino: nombreDelDia(route, dia), diaDeHoy: semanaDelDia(route, dia), ...(parada ? { parada, ciudad } : {}) })

  /** «a las 10:00» (si es una reserva, el Free Tour, una experiencia de noche o va después de cenar) o la franja del día. */
  const cuandoEs = (s: Stop, dia: DayPlan): { texto: string; conHora: boolean } => {
    const m = minDe(s.time)
    if (m == null) return { texto: 'ese día', conHora: false }
    const cena = dia.meals.find((x) => x.mealTime === 'dinner')
    const cenaMin = minDe(cena?.time)
    const despuesDeCenar = cenaMin != null && m >= cenaMin
    const conHora = Boolean(s.reservedId || s.isFreeTour || s.isNightExperience || despuesDeCenar)
    return conHora ? { texto: `a las ${aHora(m, false)}${despuesDeCenar ? ', después de cenar' : ''}`, conHora } : { texto: franjaDelDia(m), conHora }
  }

  for (const c of cambios) {
    const antes = dias.get(c.dayId)
    if (!antes) continue
    const nuevos = c.despues
    const sitiosAntes = antes.stops.filter(esSitio)
    for (const s of sitiosAntes) {
      if (s.checkedInAt) continue
      const k = clave(s)
      const hoy = destino.get(k)
      const nombre = nombreDe(s)
      if (hoy && hoy.dia.id !== antes.id) {
        // Cambia de día: sale en el día al que va.
        cambiados.add(`sitio:${k}`)
        const cu = cuandoEs(hoy.stop, hoy.dia)
        const texto = varios
          ? `Llega del ${semanaDelDia(route, antes)}, ${cu.conHora ? cu.texto : cu.texto}`
          : `Al ${nombreDelDia(route, hoy.dia)}${cu.conHora ? ' ' : ', '}${cu.texto}`
        ponerTarjeta(hoy.dia, { ...base(s, nombre, hoy.dia, hoy.dia.city), cuando: texto, ...cuadradoDelDia(route, hoy.dia) }, true)
      } else if (hoy) {
        // Mismo día: solo sale si cambia de hora más de 15 min (o, con solo el orden, si se ha movido de sitio: «Después de …»).
        const antesMin = minDe(s.time)
        const despuesMin = minDe(hoy.stop.time)
        if (c.soloOrden) continue
        if (antesMin != null && despuesMin != null && Math.abs(despuesMin - antesMin) > MARGEN_MIN) {
          cambiados.add(`sitio:${k}`)
          const cu = cuandoEs(hoy.stop, nuevos)
          ponerTarjeta(nuevos, { ...base(s, nombre, nuevos, nuevos.city), cuando: mayuscula(cu.conHora ? cu.texto : cu.texto), ...cuadradoDelDia(route, nuevos) }, false)
        }
      } else if (pendientesDe.has(k) || (nuevos.spareStops ?? []).some((x) => clave(x) === k)) {
        cambiados.add(`sitio:${k}`)
        ponerTarjeta(antes, { ...base(s, nombre, antes, antes.city), cuando: 'A Lugares pendientes', aPendientes: true }, true)
      } else {
        // (V68) Reorganizar NUNCA quita nada del viaje: un sitio que no está en ningún día va a «Lugares pendientes» (la red de seguridad de `reorganizarMinimo` ya lo deja ahí; esto es por si acaso).
        cambiados.add(`sitio:${k}`)
        ponerTarjeta(antes, { ...base(s, nombre, antes, antes.city), cuando: 'A Lugares pendientes', aPendientes: true }, true)
      }
    }
    // Solo el orden: lo que se ha movido de sitio dentro del día, «Después de …» (nunca el número de parada).
    if (c.soloOrden) {
      const idsAntes = sitiosAntes.map((s) => s.id)
      const idsDespues = nuevos.stops.filter(esSitio).map((s) => s.id)
      const movidas = movidasDeOrden(idsAntes, idsDespues)
      idsDespues.forEach((id, i) => {
        if (!movidas.has(id)) return
        const s = nuevos.stops.find((x) => x.id === id) as Stop
        if (s.checkedInAt) return
        cambiados.add(`sitio:${clave(s)}`)
        const previo = i > 0 ? nuevos.stops.find((x) => x.id === idsDespues[i - 1]) : null
        ponerTarjeta(nuevos, { ...base(s, nombreDe(s), nuevos, nuevos.city), cuando: previo ? `Después de ${nombreDe(previo)}` : 'Al empezar el día', ...cuadradoDelDia(route, nuevos) }, false)
      })
    }
    // Sitios nuevos en este día que no estaban en ninguno de los días que cambian (venían de «Si te sobra tiempo»): entran.
    for (const s of nuevos.stops.filter(esSitio)) {
      const k = clave(s)
      if (antesDe.has(k)) continue
      cambiados.add(`sitio:${k}`)
      const cu = cuandoEs(s, nuevos)
      ponerTarjeta(nuevos, { ...base(s, nombreDe(s), nuevos, nuevos.city), cuando: `Entra ${cu.conHora ? cu.texto : cu.texto}`, ...cuadradoDelDia(route, nuevos) }, true)
    }
    // (V68) La comida o la cena que ya no entra en el día (aterrizas a las 17:30: sin comida) NO sale como tarjeta de «quitar»: nada se quita del viaje, y la comida no es un sitio. Lo dice el texto de arriba.
    // La comida o la cena que se corre más de 15 min.
    for (const m of antes.meals) {
      const nueva = nuevos.meals.find((x) => x.mealTime === m.mealTime)
      const a = minDe(m.time)
      const b = minDe(nueva?.time)
      if (!nueva || a == null || b == null || Math.abs(a - b) <= MARGEN_MIN) continue
      const nombre = nueva.chosenRestaurant?.name ?? (m.mealTime === 'dinner' ? 'Cena' : m.mealTime === 'lunch' ? 'Comida' : 'Desayuno')
      ponerTarjeta(nuevos, { ...base(null, nombre, nuevos, nuevos.city), cuando: `A las ${aHora(b, false)}`, ...cuadradoDelDia(route, nuevos) }, false)
    }
  }
  void despuesDe
  const porDia = new Map<string, { dia: DayPlan; tarjetas: { t: TarjetaDePropuesta; principal: boolean }[] }>()
  for (const x of [...conGrupo].sort((a, b) => a.orden - b.orden)) {
    const g = porDia.get(x.destinoDia.id) ?? { dia: x.destinoDia, tarjetas: [] }
    g.tarjetas.push({ t: x.tarjeta, principal: x.principal })
    porDia.set(x.destinoDia.id, g)
  }
  const grupos: GrupoDeTarjetas[] = [...porDia.values()].map((g) => ({
    cabecera: varios ? nombreDelDia(route, g.dia).toUpperCase() : null,
    tarjetas: [...g.tarjetas.filter((x) => x.principal), ...g.tarjetas.filter((x) => !x.principal)].map((x) => x.t),
  }))
  return { grupos, total: conGrupo.length, franja: franjaVerde(route, cambiados, cambios) }
}

/** Los cambios que `diasQueCambian` calcula, en la forma de arriba (el día como quedaría: el reconstruido por el motor o, con solo el orden, el mismo día con las paradas en el orden nuevo). */
export function diasDespuesDeCambios(cambios: CambioDeUnDia[], route: Route): DiaDespues[] {
  const lista: DiaDespues[] = []
  for (const c of cambios) {
    const dia = route.days.find((d) => d.id === c.dayId)
    if (!dia) continue
    if (c.reconstruido) lista.push({ dayId: c.dayId, despues: c.reconstruido })
    else {
      const porId = new Map(dia.stops.map((s) => [s.id, s]))
      const stops = c.order.map((id) => porId.get(id)).filter((s): s is Stop => Boolean(s))
      lista.push({ dayId: c.dayId, despues: { ...dia, stops }, soloOrden: true })
    }
  }
  return lista
}

const HORA = (t: string | undefined | null): string | null => {
  const m = minDe(t)
  return m == null ? null : aHora(m, false)
}

/**
 * El texto de arriba de la hoja, concreto. Con vuelo de llegada («Aterrizas a las 17:00 y quedas libre hacia las 19:50. Esto es lo que cambia:»), con vuelo de vuelta («Tu vuelo sale a las 10:30. …»); sin vuelo, lo que hace.
 * `libreMin` (los minutos desde las 0:00 a los que el viajero queda libre) sale del plan de la llegada del motor; si no se sabe, solo se dice la hora de llegada.
 */
export function textoDeReorganizar(opciones: { llegada?: string | null; libreMin?: number | null; salida?: string | null; vuelo: boolean; dias: number }): string {
  const partes: string[] = []
  const lleg = HORA(opciones.llegada)
  const sal = HORA(opciones.salida)
  if (opciones.vuelo && lleg) partes.push(`Aterrizas a las ${lleg}${opciones.libreMin != null ? ` y quedas libre hacia las ${aHora(opciones.libreMin, false)}` : ''}.`)
  if (opciones.vuelo && sal) partes.push(`Tu vuelo de vuelta sale a las ${sal}.`)
  if (partes.length === 0) partes.push(opciones.dias > 1 ? 'Hemos puesto tus reservas a su hora y cada sitio cuando está abierto.' : 'Hemos puesto tus reservas a su hora y cada sitio cuando está abierto.')
  return `${partes.join(' ')} Esto es lo que cambia:`
}
