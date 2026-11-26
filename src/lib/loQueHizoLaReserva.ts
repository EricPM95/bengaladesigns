import type { DayPlan, Route, Stop } from './types'
import { dateOfDay } from './bookings'
import { claveDeSitio } from './sinSitiosRepetidos'
import { fechaCorta } from './excursionMove'

/**
 * (V68, apartado 1) «LA HOJA DICE EXACTAMENTE LO QUE HA HECHO LA APP». Función pura: compara la ruta de antes de guardar una reserva con la de después y cuenta lo que de verdad se movió de día.
 *   · Se mueve el día ENTERO cuando todas las visitas de un día de antes están ahora en otro día: «Hemos pasado el día entero «Día de la Roma antigua» al martes 13.»
 *   · Si solo se han movido algunos sitios: «Solo se han movido el Coliseo y el Foro Romano y Palatino al martes 13.» (los sitios con su nombre, nunca un día entero que no se ha movido).
 *   · Si no se ha movido nada de día: «No se ha movido ningún sitio de día.» (la reserva está guardada y cada sitio, a su hora).
 * Cuenta solo visitas de verdad (`claveDeSitio`: sin nocturnas, comidas, pausas ni paseos). Cada movimiento sale en una sola frase.
 */
export interface SitioMovido {
  nombre: string
  deDia: number
  aDia: number
}
export interface ResumenDeLoMovido {
  movidos: SitioMovido[]
  /** Los días de antes que se han pasado ENTEROS a otro día: { título, de (día), a (día) }. */
  diasEnteros: { titulo: string; deDia: number; aDia: number }[]
  texto: string
}

const visitasPorDia = (route: Route): Map<string, number> => {
  const mapa = new Map<string, number>()
  for (const day of route.days) for (const stop of day.stops) if (claveDeSitio(stop) != null) mapa.set(claveDeSitio(stop) as string, day.dayNumber)
  return mapa
}

const lista = (nombres: string[]): string => (nombres.length <= 1 ? (nombres[0] ?? '') : nombres.length > 4 ? `${nombres.length} sitios` : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`)

export function resumenDeLoMovido(antes: Route, despues: Route, tituloDe: (day: DayPlan) => string = (day) => `día ${day.dayNumber}`): ResumenDeLoMovido {
  const diaAntes = visitasPorDia(antes)
  const diaDespues = visitasPorDia(despues)
  const nombreDe = new Map<string, string>()
  for (const day of despues.days) for (const stop of day.stops) if (claveDeSitio(stop) != null) nombreDe.set(claveDeSitio(stop) as string, stop.name)
  const movidos: SitioMovido[] = []
  for (const [clave, aDia] of diaDespues) {
    const deDia = diaAntes.get(clave)
    if (deDia != null && deDia !== aDia) movidos.push({ nombre: nombreDe.get(clave) ?? clave, deDia, aDia })
  }
  // Un día entero: todas las visitas que tenía un día de antes están ahora (juntas) en otro día.
  const diasEnteros: ResumenDeLoMovido['diasEnteros'] = []
  for (const day of antes.days) {
    const claves = day.stops.map((stop: Stop) => claveDeSitio(stop)).filter((clave): clave is string => clave != null)
    if (claves.length < 2) continue
    // (Casi todas: el motor puede quitar o añadir alguna al rehacer el día; un día es «entero» si al menos el 80 % de sus visitas están juntas en otro día.)
    const cuenta = new Map<number, number>()
    for (const clave of claves) {
      const aDia = diaDespues.get(clave)
      if (aDia != null) cuenta.set(aDia, (cuenta.get(aDia) ?? 0) + 1)
    }
    const [aDia, veces] = [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0] ?? [null, 0]
    if (aDia != null && aDia !== day.dayNumber && veces >= Math.ceil(claves.length * 0.8)) diasEnteros.push({ titulo: tituloDe(day), deDia: day.dayNumber, aDia })
  }
  const fechaDelDia = (n: number) => {
    const dia = despues.days.find((day) => day.dayNumber === n)
    return fechaCorta(dia ? dateOfDay(despues, dia) : null, n)
  }
  let texto: string
  if (movidos.length === 0) texto = 'No se ha movido ningún sitio de día.'
  else if (diasEnteros.length > 0) {
    texto = `Hemos pasado ${diasEnteros.map((d) => `el día entero «${d.titulo}» al ${fechaDelDia(d.aDia)}`).join(' y ')}.`
    const sueltos = movidos.filter((m) => !diasEnteros.some((d) => d.deDia === m.deDia && d.aDia === m.aDia))
    if (sueltos.length > 0) texto += ` Además, ${lista(sueltos.map((m) => m.nombre))} ${sueltos.length === 1 ? 'se ha movido' : 'se han movido'} de día.`
  } else {
    const aDias = [...new Set(movidos.map((m) => m.aDia))]
    texto = `Solo ${movidos.length === 1 ? 'se ha movido' : 'se han movido'} ${aDias.length === 1 ? `${lista(movidos.map((m) => m.nombre))} al ${fechaDelDia(aDias[0])}` : lista(movidos.map((m) => `${m.nombre} al ${fechaDelDia(m.aDia)}`))}.`
  }
  return { movidos, diasEnteros, texto }
}
