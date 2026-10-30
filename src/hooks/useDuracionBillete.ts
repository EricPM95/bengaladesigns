import { useEffect, useState } from 'react'
import { aeropuertoPorIata, aeropuertosDeCiudad } from '../lib/aeropuertosCiudad'
import { duracionDelTrayecto, textoDeTrayecto } from '../lib/duracionViaje'

const ZONA_DE_ROMA = 'Europe/Rome'

/** La zona horaria del lado de fuera: la del aeropuerto por su código, o la que comparten los aeropuertos de la ciudad. `null` si no se sabe (nunca se inventa). */
async function zonaDeFuera(ciudad: string, iata: string | null): Promise<string | null> {
  try {
    if (iata) {
      const a = await aeropuertoPorIata(iata)
      if (a?.zona) return a.zona
    }
    const lista = await aeropuertosDeCiudad(ciudad)
    const zonas = [...new Set(lista.map((a) => a.zona).filter((z): z is string => Boolean(z)))]
    return zonas.length === 1 ? zonas[0] : null
  } catch {
    return null
  }
}

/**
 * La duración de esa mitad (10S5 §4): «1 h 55 min». La calcula la app con las dos horas y la hora de cada país (con avión, la zona de cada aeropuerto; en tren, autobús y barco, el mismo reloj si no se sabe).
 * Sin las dos horas, o sin saber la zona de fuera con un avión: `null` (sin duración, nunca inventada). Solo se calcula con las dos horas puestas.
 */
export function useDuracionBillete(entrada: { llega: boolean; horaRoma: string | null; horaFuera: string | null; fecha: string | null; avion: boolean; ciudadFuera: string; iataFuera: string | null }): string | null {
  const { llega, horaRoma, horaFuera, fecha, avion, ciudadFuera, iataFuera } = entrada
  const [texto, setTexto] = useState<string | null>(null)
  useEffect(() => {
    let vivo = true
    if (!horaRoma || !horaFuera) {
      setTexto(null)
      return
    }
    void (async () => {
      const zonaFuera = avion || ciudadFuera ? await zonaDeFuera(ciudadFuera, iataFuera) : null
      const min = duracionDelTrayecto({
        fecha,
        horaSalida: llega ? horaFuera : horaRoma,
        horaLlegada: llega ? horaRoma : horaFuera,
        zonaSalida: llega ? zonaFuera : ZONA_DE_ROMA,
        zonaLlegada: llega ? ZONA_DE_ROMA : zonaFuera,
        mismaZonaSiFalta: !avion,
      })
      if (vivo) setTexto(min ? textoDeTrayecto(min) || null : null)
    })()
    return () => {
      vivo = false
    }
  }, [llega, horaRoma, horaFuera, fecha, avion, ciudadFuera, iataFuera])
  return texto
}
