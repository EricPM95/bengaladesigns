import type { DatosBilleteLeido } from './billeteLeer'
import type { LegState } from './reservasLegs'
import { puntoCorto } from './arrivalReturn'
import { etiquetaDeCiudadConEstacion, etiquetaDeCiudadConPunto } from './aeropuertosCiudad'
import { ladoDeFuera } from './billete'

/**
 * DE LO QUE LEE LA APP EN EL BILLETE A LO QUE ENSEÑA LA HOJA DEL VUELO (10S5 §4): el viajero lo revisa y puede cambiar cualquier dato antes de guardar. Nada se guarda aquí.
 *   Ida (fuera → Roma): la hora de Roma es la de llegada, la de fuera la de salida. Vuelta (Roma → fuera): al revés. La terminal es la del lado por donde sale.
 */
const sinAcentos = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()

export interface LadoLeido {
  hora: string | null
  punto: string | null
  otraHora: string | null
  otroPunto: string | null
  codigo: string | null
  compania: string | null
  localizador: string | null
  terminal: string | null
  asiento: string | null
  coche: string | null
  /** El código IATA del lado de fuera, si el billete lo trae. */
  codigoFuera: string | null
}

export function ladoDesdeBillete(leg: Pick<LegState, 'kind' | 'mode' | 'points'>, datos: DatosBilleteLeido, ciudadFuera: string): LadoLeido {
  const llega = leg.kind === 'arrival'
  const roma = llega ? datos.destino : datos.origen
  const fuera = llega ? datos.origen : datos.destino
  // El punto de Roma: por su código (FCO) o por su nombre («Roma Termini» ↔ Termini).
  const nombreRoma = sinAcentos(roma.nombre ?? '')
  const punto =
    leg.points.find((p) => roma.codigo && p.codigo && p.codigo.toUpperCase() === roma.codigo.toUpperCase()) ??
    (nombreRoma ? leg.points.find((p) => nombreRoma.includes(sinAcentos(puntoCorto(p)))) : undefined) ??
    null
  const ciudadDeFuera = fuera.ciudad?.trim() || ciudadFuera
  const etiquetaDeSerie = leg.mode === 'tren' ? etiquetaDeCiudadConEstacion(ciudadDeFuera) : leg.mode === 'avion' ? etiquetaDeCiudadConPunto(ciudadDeFuera) : ciudadDeFuera
  const otroPunto = fuera.nombre ? ladoDeFuera(ciudadDeFuera, fuera.nombre) : etiquetaDeSerie
  return {
    hora: (llega ? datos.horaLlegada : datos.horaSalida) ?? null,
    punto: punto ? puntoCorto(punto) : null,
    otraHora: (llega ? datos.horaSalida : datos.horaLlegada) ?? null,
    otroPunto: otroPunto || null,
    codigo: datos.numero,
    compania: datos.compania,
    localizador: datos.localizador,
    terminal: datos.origen.terminal,
    asiento: datos.asiento,
    coche: datos.coche,
    codigoFuera: fuera.codigo,
  }
}
