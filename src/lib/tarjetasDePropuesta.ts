import { addDaysToIso } from './dateRange'
import { aHora, minDe, type Op, type Propuesta } from './hoyCambiarPlan'
import type { CambioDeUnDia } from './reorganizarDia'
import { elSitio, lugarCon } from './articulos'
import { tituloSimpleDelDia } from './tituloDelDia'
import { diaProsa } from './nombreDeDia'
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

/** (V69) «Hoy a las 17:30» SOLO para una reserva (su hora es la de su entrada). Lo demás no enseña horas: «Hoy, un poco más tarde» / «un poco antes» / «a otra hora». */
const hoyALas = (time: string | undefined): string => {
  const m = minDe(time)
  return m == null ? 'Hoy' : `Hoy a las ${aHora(m, false)}`
}
const esReserva = (s: Stop | null | undefined): boolean => Boolean(s && (s.reservedId || s.isFreeTour))
const hoyCuando = (parada: Stop | null, antes: string | undefined, despues: string | undefined): string => {
  if (esReserva(parada)) return hoyALas(despues)
  const a = minDe(antes)
  const d = minDe(despues)
  return a != null && d != null && a !== d ? (d > a ? 'Hoy, un poco más tarde' : 'Hoy, un poco antes') : 'Hoy, a otra hora'
}
const nombreDe = (s: Stop): string => s.name.replace(/\s*\([^)]*\)\s*$/, '')
/** (V69) Un sitio de verdad que se visita: ni la llegada, ni un descanso, ni un «de camino» (una calle, un paseo libre: la Fuente de las Tortugas, el Elefantino). */
const esVisita = (s: Stop): boolean => !s.isArrival && !s.isBreak && !s.passThrough && !s.isFreeWalk
/** (V69) La clave de «el mismo sitio»: sin paréntesis ni «de noche» («Piazza Navona» y «Piazza Navona de noche» son UNA tarjeta). */
const claveDeSitio = (nombre: string): string =>
  nombre
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+(de noche|por la noche|al atardecer|de día)\s*$/i, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
/** (V69) «Timanfaya, los Jameos del Agua y 2 más» (los dos primeros y cuántos más). */
const nombresConMas = (nombres: string[], cuantos = 2): string => {
  const vistos = nombres.slice(0, cuantos).map((n) => elSitio(n))
  const mas = nombres.length - vistos.length
  const lista = vistos.length === 1 ? vistos[0] : `${vistos.slice(0, -1).join(', ')} y ${vistos[vistos.length - 1]}`
  return mas > 0 ? `${vistos.join(', ')} y ${mas} más` : lista
}

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
  const deHoy = (parada: Stop | null, nombre: string, antes: string | undefined, time: string | undefined, ciudad: string, texto?: string): TarjetaDePropuesta => ({ ...base(parada, nombre, ciudad), cuando: texto ?? hoyCuando(parada, antes, time), ...hoyCuadrado })
  const deComida = (nombre: string, mealTime: string | undefined, antes: string | undefined, time: string | undefined, ciudad: string): TarjetaDePropuesta => ({ ...deHoy(null, nombre, antes, time, ciudad, 'Hoy, a otra hora'), comida: mealTime === 'dinner' ? 'cenar' : 'comer' })
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
          principales.push(deHoy(op.stop, nombreDe(op.stop), op.stop.time, entra.stop.time, ciudad))
        } else if (entra) {
          const destino = dias.get(entra.dia)
          if (!destino) break
          const pos = entra.indice >= Math.max(1, Math.ceil(destino.stops.length / 2)) ? 'por la tarde' : 'por la mañana'
          principales.push({ ...base(op.stop, nombreDe(op.stop), ciudad), cuando: `Al ${nombreDelDia(route, destino)}, ${pos}`, destino: nombreDelDia(route, destino), ...cuadradoDelDia(route, destino) })
        } else if (sobra) {
          principales.push(aPendientes(op.stop, 'A «Lugares pendientes»', ciudad))
        } else {
          principales.push({ ...base(op.stop, nombreDe(op.stop), ciudad), cuando: 'Se quita de tu viaje', quitar: true })
        }
        break
      }
      case 'meter': {
        if (sacadas.has(op.stop.id)) break
        if (op.dia === hoy.id) principales.push(deHoy(op.stop, nombreDe(op.stop), undefined, op.stop.time, ciudad))
        else {
          const destino = dias.get(op.dia)
          if (destino) principales.push({ ...base(op.stop, nombreDe(op.stop), ciudad), cuando: `Entra el ${nombreDelDia(route, destino)}`, destino: nombreDelDia(route, destino), ...cuadradoDelDia(route, destino) })
        }
        break
      }
      case 'sobra_meter':
        if (!sacadas.has(op.stop.id)) principales.push(aPendientes(op.stop, 'A «Lugares pendientes»', ciudad))
        break
      case 'campo': {
        const s = paradaDe(op)
        if (!s) break
        if (op.despues.saltada && !op.antes.saltada) principales.push(aPendientes(s, 'A Lugares pendientes', ciudad))
        else if (!op.despues.saltada && op.antes.saltada) principales.push(deHoy(s, nombreDe(s), undefined, op.despues.time, ciudad, esReserva(s) ? undefined : 'Vuelve a tu día'))
        else if (op.despues.time !== op.antes.time) corridas.push(deHoy(s, nombreDe(s), op.antes.time, op.despues.time, ciudad))
        break
      }
      case 'comida': {
        const m = dias.get(op.dia)?.meals.find((x) => x.id === op.id)
        if (!m) break
        const nombre = m.chosenRestaurant?.name ?? (m.mealTime === 'dinner' ? 'Cena' : m.mealTime === 'lunch' ? 'Comida' : 'Desayuno')
        corridas.push(deComida(nombre, m.mealTime, op.antes, op.despues, ciudad))
        break
      }
      case 'comida_sitio': {
        const m = dias.get(op.dia)?.meals.find((x) => x.id === op.id)
        const nombre = op.despues.sitio?.name ?? m?.chosenRestaurant?.name ?? (m?.mealTime === 'dinner' ? 'Cena' : 'Comida')
        principales.push(deComida(nombre, m?.mealTime, op.antes.time, op.despues.time, ciudad))
        break
      }
      case 'paradas': {
        const antes = new Map(op.antes.stops.map((s) => [s.id, s]))
        const despues = new Map(op.despues.stops.map((s) => [s.id, s]))
        // (V69) El que sale dice lo mismo que su cuadrado («A Lugares pendientes»); el que entra, «Hoy, en lugar de X» (sin hora: solo las reservas llevan hora).
        const salen = op.antes.stops.filter((s) => !despues.has(s.id) && !s.checkedInAt && esVisita(s))
        for (const s of salen) principales.push(aPendientes(s, 'A Lugares pendientes', ciudad))
        let k = 0
        for (const s of op.despues.stops) {
          const antesS = antes.get(s.id)
          if (!antesS && esVisita(s)) {
            const sustituye = salen[k++]
            principales.push(deHoy(s, nombreDe(s), undefined, s.time, ciudad, esReserva(s) ? undefined : sustituye ? `Hoy, en lugar ${lugarCon("de", nombreDe(sustituye))}` : 'Entra en tu día de hoy'))
          } else if (antesS && antesS.time !== s.time && !s.checkedInAt && esVisita(s)) corridas.push(deHoy(s, nombreDe(s), antesS.time, s.time, ciudad))
        }
        break
      }
      default:
        break
    }
  }
  // (V69) Un mismo sitio, UNA sola tarjeta (Piazza Navona de día y de noche): gana la primera (la principal).
  const vistos = new Set<string>()
  const todas = [...principales, ...corridas].filter((t) => {
    if (t.comida) return true
    const k = claveDeSitio(t.nombre)
    if (vistos.has(k)) return false
    vistos.add(k)
    return true
  })
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
export function franjaDePropuesta(p: Propuesta, route?: Route | null): string | null {
  if (p.franja) return p.franja
  // (V69) La franja nombra lo que de verdad sigue igual («Sigue igual: Timanfaya, los Jameos del Agua y 2 más») y solo si queda algo: las paradas del día que ninguna operación toca.
  const dia = route?.days.find((d) => d.id === p.ops[0]?.dia)
  if (!dia) return `Sigue igual: ${p.mantiene.titulo}`
  const tocadas = new Set<string>()
  for (const op of p.ops) {
    if (op.t === 'sacar' || op.t === 'meter' || op.t === 'sobra_meter') tocadas.add(op.stop.id)
    else if (op.t === 'campo' && op.dia === dia.id) tocadas.add(op.id)
    else if (op.t === 'paradas' && op.dia === dia.id) {
      const antes = new Map(op.antes.stops.map((s) => [s.id, s]))
      const despues = new Map(op.despues.stops.map((s) => [s.id, s]))
      for (const s of op.antes.stops) if (!despues.has(s.id) || despues.get(s.id)?.time !== s.time) tocadas.add(s.id)
      for (const s of op.despues.stops) if (!antes.has(s.id)) tocadas.add(s.id)
    }
  }
  const quedan = dia.stops.filter((s) => esVisita(s) && !s.saltada && !s.checkedInAt && !tocadas.has(s.id)).map(nombreDe)
  return quedan.length > 0 ? `Sigue igual: ${nombresConMas(quedan)}` : null
}

/**
 * (V61; Design «Reorganizar Hoja» RO1, RO2 y RO3) LAS TARJETAS DE «REORGANIZAR»: UNA por cada sitio que cambia de verdad (de día, a «Lugares pendientes», quitado, o de hora más de 15 min), nunca con número de parada.
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
  /** La franja verde, concreta: «Sigue igual: tu cena en Armando al Pantheon y tus reservas». (V69) Null si no queda nada igual. */
  franja: string | null
  /** (V69) Si lo que cambia es el orden del mismo día, la frase de arriba que dice por qué. */
  frase: string | null
}

const MARGEN_MIN = 15
const clave = (s: Stop): string => s.name.trim().toLowerCase()
const esSitio = (s: Stop): boolean => esVisita(s)
const mayuscula = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1)
const franjaDelDia = (m: number | null): string => (m == null ? 'ese día' : m < 14 * 60 ? 'por la mañana' : m < 20 * 60 ? 'por la tarde' : 'por la noche')
/**
 * (V69) La franja verde de «Reorganizar»: SOLO si de verdad queda algo igual. Lo que se nombra: la comida o la cena elegida que no se corre, las reservas que no cambian de hora y, si no hay nada de eso,
 * los sitios del día que se quedan donde estaban («Sigue igual: Timanfaya, los Jameos del Agua y 2 más»). Nada igual: sin franja (null).
 */
function franjaVerde(route: Route, cambiados: Set<string>, cambios: DiaDespues[], ordenCambiado: Set<string>): string | null {
  const partes: string[] = []
  const dias = new Map(route.days.map((d) => [d.id, d]))
  for (const c of cambios) {
    const antes = dias.get(c.dayId)
    for (const m of c.despues.meals) {
      const nombre = m.chosenRestaurant?.name
      if (!nombre || (m.mealTime !== 'dinner' && m.mealTime !== 'lunch')) continue
      const a = minDe(antes?.meals.find((x) => x.mealTime === m.mealTime)?.time)
      const b = minDe(m.time)
      if (a != null && b != null && Math.abs(a - b) > MARGEN_MIN) continue
      partes.push(`tu ${m.mealTime === 'dinner' ? 'cena' : 'comida'} ${lugarCon('en', nombre)}`)
    }
  }
  const hayReservas = cambios.some((c) => (c.despues.stops ?? []).some((s) => (s.reservedId || s.isFreeTour) && !cambiados.has(`sitio:${clave(s)}`)))
  if (hayReservas) partes.push('tus reservas')
  if (partes.length > 0) return `Sigue igual: ${partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`}`
  const quedan: string[] = []
  for (const c of cambios) {
    if (ordenCambiado.has(c.dayId)) continue
    for (const s of c.despues.stops) if (esSitio(s) && !s.checkedInAt && !cambiados.has(`sitio:${clave(s)}`)) quedan.push(nombreDe(s))
  }
  return quedan.length > 0 ? `Sigue igual: ${nombresConMas(quedan)}` : null
}

export function cambiosDeReorganizar(cambios: DiaDespues[], route: Route): CambiosDeReorganizar {
  const dias = new Map(route.days.map((d) => [d.id, d]))
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
  const conGrupo: { orden: number; destinoDia: DayPlan; tarjeta: TarjetaDePropuesta; principal: boolean; sitio: string }[] = []
  const cambiados = new Set<string>()
  const ordenCambiado = new Set<string>()
  const frases: string[] = []
  const ponerTarjeta = (dia: DayPlan, t: TarjetaDePropuesta, principal: boolean, sitio = '') => conGrupo.push({ orden: dia.dayNumber, destinoDia: dia, tarjeta: t, principal, sitio: sitio || claveDeSitio(t.nombre) })
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
  /** (V69) La tarjeta de una reserva con su hora: «A las 16:30, tu entrada» / «A las 10:00, tu Free Tour». */
  const deReserva = (s: Stop, dia: DayPlan): TarjetaDePropuesta => {
    const m = minDe(s.time)
    return { ...base(s, nombreDe(s), dia, dia.city), cuando: `${m == null ? 'A su hora' : `A las ${aHora(m, false)}`}, ${s.isFreeTour ? 'tu Free Tour' : 'tu entrada'}`, ...cuadradoDelDia(route, dia) }
  }

  // Los sitios de cada día que cambian de día, para ver si se mueve un DÍA ENTERO (una sola tarjeta por día).
  const PENDIENTES = '__pendientes__'
  const porOrigenYDestino = new Map<string, Map<string, Stop[]>>()
  const sitiosDelOrigen = new Map<string, number>()
  for (const c of cambios) {
    const antes = dias.get(c.dayId)
    if (!antes) continue
    const lista = antes.stops.filter((s) => esSitio(s) && !s.checkedInAt)
    sitiosDelOrigen.set(antes.id, lista.length)
    for (const s of lista) {
      const hoy = destino.get(clave(s))
      if (!hoy || hoy.dia.id !== antes.id) {
        // A otro día, o (sin día) a «Lugares pendientes».
        const aDonde = hoy ? hoy.dia.id : PENDIENTES
        const m = porOrigenYDestino.get(antes.id) ?? new Map<string, Stop[]>()
        m.set(aDonde, [...(m.get(aDonde) ?? []), s])
        porOrigenYDestino.set(antes.id, m)
      }
    }
  }
  /** (V69) Un día NO entero, pero con 4 o más sitios que van al mismo sitio (a «Lugares pendientes» o a otro día): UNA tarjeta («11 sitios de tu martes»), nunca 11. */
  const grupoDeVarios = new Map<string, string>()
  /** Días enteros: TODO lo que había en ese día (2 o más sitios) se va al mismo día o, todo, a «Lugares pendientes». */
  const diaEntero = new Map<string, string>()
  for (const [origen, m] of porOrigenYDestino) {
    for (const [dest, sitios] of m) {
      if (sitios.length >= 2 && sitios.length === sitiosDelOrigen.get(origen)) diaEntero.set(origen, dest)
      else if (sitios.length >= 4) grupoDeVarios.set(`${origen}>${dest}`, dest)
    }
  }

  for (const c of cambios) {
    const antes = dias.get(c.dayId)
    if (!antes) continue
    const nuevos = c.despues
    const sitiosAntes = antes.stops.filter(esSitio)
    const enteroA = diaEntero.get(antes.id)
    if (enteroA) {
      const aPendientesTodo = enteroA === PENDIENTES
      const destDia = aPendientesTodo ? antes : (cambios.find((x) => x.despues.id === enteroA)?.despues ?? dias.get(enteroA))
      const sitios = (porOrigenYDestino.get(antes.id)?.get(enteroA) ?? []).filter((s) => !s.checkedInAt)
      if (destDia && sitios.length > 0) {
        // La foto es la del sitio principal del día (el que más dura); el nombre, el del día.
        const principal = [...sitios].sort((a, b) => (b.durationMinutes || 0) - (a.durationMinutes || 0))[0]
        let nombre = `Día ${antes.dayNumber}`
        try {
          nombre = tituloSimpleDelDia(route, antes) || nombre
        } catch {
          /* sin título: «Día N» */
        }
        for (const s of sitios) cambiados.add(`sitio:${clave(s)}`)
        ponerTarjeta(destDia, { ...base(principal, nombre, destDia, antes.city), diaEntero: true, ...(aPendientesTodo ? { cuando: 'Pasa a Lugares pendientes', aPendientes: true } : { cuando: `Pasa al ${nombreDelDia(route, destDia)}`, ...cuadradoDelDia(route, destDia) }) }, true, `dia:${antes.id}`)
      }
    }
    for (const [clave2, dest] of grupoDeVarios) {
      if (!clave2.startsWith(`${antes.id}>`)) continue
      const sitios = (porOrigenYDestino.get(antes.id)?.get(dest) ?? []).filter((s) => !s.checkedInAt && !cambiados.has(`sitio:${clave(s)}`))
      if (sitios.length < 4) continue
      const aPend = dest === PENDIENTES
      const destDia = aPend ? antes : (cambios.find((x) => x.despues.id === dest)?.despues ?? dias.get(dest))
      if (!destDia) continue
      const principal = [...sitios].sort((x, y) => (y.durationMinutes || 0) - (x.durationMinutes || 0))[0]
      for (const s of sitios) cambiados.add(`sitio:${clave(s)}`)
      ponerTarjeta(destDia, { ...base(principal, `${sitios.length} sitios de tu ${semanaDelDia(route, antes)}`, destDia, antes.city), diaEntero: true, ...(aPend ? { cuando: 'A Lugares pendientes', aPendientes: true } : { cuando: `Pasan al ${nombreDelDia(route, destDia)}`, ...cuadradoDelDia(route, destDia) }) }, true, `grupo:${antes.id}>${dest}`)
    }
    for (const s of sitiosAntes) {
      if (s.checkedInAt) continue
      const k = clave(s)
      if (cambiados.has(`sitio:${k}`)) continue
      const hoy = destino.get(k)
      const nombre = nombreDe(s)
      if (hoy && hoy.dia.id !== antes.id) {
        // Cambia de día: sale en el día al que va.
        cambiados.add(`sitio:${k}`)
        const cu = cuandoEs(hoy.stop, hoy.dia)
        const texto = varios ? `Llega del ${semanaDelDia(route, antes)}, ${cu.texto}` : `Al ${nombreDelDia(route, hoy.dia)}${cu.conHora ? ' ' : ', '}${cu.texto}`
        ponerTarjeta(hoy.dia, { ...base(s, nombre, hoy.dia, hoy.dia.city), cuando: texto, ...cuadradoDelDia(route, hoy.dia) }, true)
      } else if (hoy) {
        // (V69) Mismo día: NO se lista (ni «Después de…» ni minutos). Solo con hora de verdad (una reserva, el Free Tour, de noche o tras cenar) y si esa hora cambia.
        const antesMin = minDe(s.time)
        const despuesMin = minDe(hoy.stop.time)
        const cu = cuandoEs(hoy.stop, nuevos)
        if (cu.conHora && antesMin != null && despuesMin != null && Math.abs(despuesMin - antesMin) > MARGEN_MIN) {
          cambiados.add(`sitio:${k}`)
          ponerTarjeta(nuevos, esReserva(hoy.stop) ? deReserva(hoy.stop, nuevos) : { ...base(s, nombre, nuevos, nuevos.city), cuando: mayuscula(cu.texto), ...cuadradoDelDia(route, nuevos) }, false)
        }
      } else {
        // Va a «Lugares pendientes» (Reorganizar NUNCA quita nada del viaje: V68).
        cambiados.add(`sitio:${k}`)
        ponerTarjeta(antes, { ...base(s, nombre, antes, antes.city), cuando: 'A Lugares pendientes', aPendientes: true }, true)
      }
    }
    // (V69) Si lo que cambia es el ORDEN del mismo día: una frase arriba que dice por qué (nunca 11 tarjetas «Después de X»).
    const quedan = sitiosAntes.filter((s) => !s.checkedInAt && destino.get(clave(s))?.dia.id === antes.id)
    const ordenAntes = quedan.map(clave)
    const despuesEnElDia = nuevos.stops.filter((s) => esSitio(s) && !s.checkedInAt && ordenAntes.includes(clave(s)))
    const ordenDespues = despuesEnElDia.map(clave)
    if (ordenAntes.length >= 2 && ordenAntes.join('|') !== ordenDespues.join('|')) {
      ordenCambiado.add(c.dayId)
      const reserva = despuesEnElDia.find((s) => esReserva(s) && minDe(s.time) != null)
      const alReves = ordenDespues.join('|') === [...ordenAntes].reverse().join('|')
      const razon = reserva
        ? ` para llegar a ${reserva.isFreeTour ? 'tu Free Tour' : `tu entrada ${lugarCon('de', nombreDe(reserva))}`} de las ${aHora(minDe(reserva.time) as number, false)}`
        : ' para que cada sitio esté abierto cuando llegues'
      const primero = despuesEnElDia[0]
      const ultimo = despuesEnElDia[despuesEnElDia.length - 1]
      frases.push(`${alReves ? 'Damos la vuelta a' : 'Cambiamos el orden de'} tu ${semanaDelDia(route, antes)}${razon}: empiezas ${lugarCon('en', nombreDe(primero))} y acabas ${lugarCon('en', nombreDe(ultimo))}.`)
      // Con una reserva de por medio, su tarjeta («Coliseo · A las 16:30, tu entrada») ancla la explicación.
      if (reserva && !cambiados.has(`sitio:${clave(reserva)}`)) {
        cambiados.add(`sitio:${clave(reserva)}`)
        ponerTarjeta(nuevos, deReserva(reserva, nuevos), false)
      }
    }
    // Sitios nuevos en este día que no estaban en ninguno de los días que cambian (venían de «Lugares pendientes»): entran.
    for (const s of nuevos.stops.filter(esSitio)) {
      const k = clave(s)
      if (antesDe.has(k)) continue
      cambiados.add(`sitio:${k}`)
      const cu = cuandoEs(s, nuevos)
      ponerTarjeta(nuevos, { ...base(s, nombreDe(s), nuevos, nuevos.city), cuando: `Entra ${cu.texto}`, ...cuadradoDelDia(route, nuevos) }, true)
    }
    // (V68, V69) La comida o la cena no sale como tarjeta: no es un sitio, sigue en su día y los minutos no se cuentan. Si ya no entra (aterrizas a las 17:30), lo dice el texto de arriba.
  }
  // (V69) Un mismo sitio, UNA sola tarjeta (Piazza Navona de día y de noche): gana la principal.
  const visto = new Set<string>()
  const unicas = [...conGrupo]
    .sort((a, b) => a.orden - b.orden || Number(b.principal) - Number(a.principal))
    .filter((x) => {
      if (visto.has(x.sitio)) return false
      visto.add(x.sitio)
      return true
    })
  const porDia = new Map<string, { dia: DayPlan; tarjetas: { t: TarjetaDePropuesta; principal: boolean }[] }>()
  for (const x of unicas) {
    const g = porDia.get(x.destinoDia.id) ?? { dia: x.destinoDia, tarjetas: [] }
    g.tarjetas.push({ t: x.tarjeta, principal: x.principal })
    porDia.set(x.destinoDia.id, g)
  }
  const grupos: GrupoDeTarjetas[] = [...porDia.values()].map((g) => ({
    cabecera: varios ? nombreDelDia(route, g.dia).toUpperCase() : null,
    tarjetas: [...g.tarjetas.filter((x) => x.principal), ...g.tarjetas.filter((x) => !x.principal)].map((x) => x.t),
  }))
  return { grupos, total: unicas.length, franja: franjaVerde(route, cambiados, cambios, ordenCambiado), frase: frases.length > 0 ? frases.slice(0, 2).join(' ') : null }
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

/** (V70) «tu sábado» (solo el día de la semana) / «tu día 2» sin fechas, para el día `dayId` de la ruta; null si no se encuentra. */
export function cualDeTusDias(route: Route, dayId: string | undefined): string | null {
  const dia = route.days.find((d) => d.id === dayId)
  if (!dia) return null
  return `tu ${diaProsa(route, dia.dayNumber).replace(/^(\S+) \d+$/, (todo, nombre: string) => (nombre === 'día' ? todo : nombre))}`
}

const HORA = (t: string | undefined | null): string | null => {
  const m = minDe(t)
  return m == null ? null : aHora(m, false)
}

/**
 * El texto de arriba de la hoja, concreto. Con vuelo de llegada («Aterrizas a las 17:00 y quedas libre hacia las 19:50. Esto es lo que cambia:»), con vuelo de vuelta («Tu vuelo sale a las 10:30. …»); sin vuelo, lo que hace.
 * `libreMin` (los minutos desde las 0:00 a los que el viajero queda libre) sale del plan de la llegada del motor; si no se sabe, solo se dice la hora de llegada.
 */
export function textoDeReorganizar(opciones: { llegada?: string | null; libreMin?: number | null; salida?: string | null; vuelo: boolean; dias: number; /** (V70) «tu sábado» (de `cualDeTusDias`) para el texto genérico de un solo día. */ cual?: string | null; /** (V69) false = no hay tarjetas que enseñar (solo cambia el orden de un día): se quita «Esto es lo que cambia:». */ conTarjetas?: boolean }): string {
  const partes: string[] = []
  const lleg = HORA(opciones.llegada)
  const sal = HORA(opciones.salida)
  if (opciones.vuelo && lleg) partes.push(`Aterrizas a las ${lleg}${opciones.libreMin != null ? ` y quedas libre hacia las ${aHora(opciones.libreMin, false)}` : ''}.`)
  if (opciones.vuelo && sal) partes.push(`Tu vuelo de vuelta sale a las ${sal}.`)
  // (V70, V61-10) Sin vuelo, texto GENÉRICO que no depende de saber qué se añadió: «Has cambiado tu sábado.» (un día) o «Has cambiado tus días.» (varios).
  if (partes.length === 0) partes.push(opciones.dias > 1 ? 'Has cambiado tus días.' : opciones.cual ? `Has cambiado ${opciones.cual}.` : 'Has cambiado tu día.')
  return opciones.conTarjetas === false ? partes.join(' ') : `${partes.join(' ')} Esto es lo que cambia:`
}
