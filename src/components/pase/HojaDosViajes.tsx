import { useState } from 'react'
import { rangoEnPalabras, type ViajeDeLaPareja } from '../../lib/viajesQueSePisan'
import { TextoConPase } from '../cuenta/TextoConPase'
import { BotonHoja, Hoja } from '../ui/Hoja'

/**
 * DOS VIAJES AL MISMO DESTINO QUE SE PISAN (cuentas parte 3, diseño «Pase y cuenta» P8b y P9; la lógica de qué viajes se pisan es de la 8A2).
 *   P8b, el aviso de los 10 días, ya dentro de la app: «En 10 días empieza tu viaje a Roma. Tu Pase de Roma está activo para el viaje del 16 al 19 de octubre. Si quieres cambiarlo,
 *       ahora es el momento.» con [Es este] y [Cambiar al del 16 al 20].
 *   P9, el primer día si no contestó: «Tienes dos viajes a Roma. ¿Cuál haces?» con un botón por viaje y «El otro pasa a «Viajes guardados», sin borrarse.»
 * `elegir(id)` deja ese viaje y pasa el otro a «Viajes guardados». La hoja se puede cerrar: la app avisa, nunca prohíbe (P9 volverá a preguntar otro día).
 */
export function HojaDosViajes({
  modo,
  destino,
  actual,
  otro,
  etiquetaDia,
  elegir,
  onCerrar,
}: {
  modo: 'p8b' | 'p9'
  destino: string
  actual: ViajeDeLaPareja
  otro: ViajeDeLaPareja
  /** «Hoy · mié 16» (solo P9). */
  etiquetaDia?: string
  elegir: (dejarId: string, guardarId: string) => Promise<string | null>
  onCerrar: () => void
}) {
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const decidir = async (dejar: ViajeDeLaPareja, guardar: ViajeDeLaPareja) => {
    setOcupado(true)
    setError(null)
    const e = await elegir(dejar.id, guardar.id)
    setOcupado(false)
    if (e) setError(e)
    else onCerrar()
  }
  const rActual = rangoEnPalabras(actual.inicio, actual.fin)
  const rOtro = rangoEnPalabras(otro.inicio, otro.fin)
  const cortoOtro = rangoCorto(otro.inicio, otro.fin)

  return (
    <Hoja
      onCerrar={onCerrar}
      etiqueta={modo === 'p9' ? (etiquetaDia ?? 'Hoy') : undefined}
      titulo={
        modo === 'p9' ? (
          `Tienes dos viajes a ${destino}. ¿Cuál haces?`
        ) : (
          <TextoConPase texto={`En 10 días empieza tu viaje a ${destino}. Tu Pase de ${destino} está activo para el viaje del ${rActual}. Si quieres cambiarlo, ahora es el momento.`} />
        )
      }
      datos={modo === 'p9' ? 'P9' : 'P8b'}
      z={92}
    >
      {modo === 'p9' && <span style={{ font: "400 13.5px/1.5 'Geist'", opacity: 0.75 }}>El otro pasa a «Viajes guardados», sin borrarse.</span>}
      {error && (
        <p role="alert" style={{ margin: 0, font: "500 13px/1.4 'Geist'", color: 'oklch(0.5 0.17 5)' }}>
          {error}
        </p>
      )}
      {modo === 'p8b' ? (
        <>
          <BotonHoja tipo="oscuro" disabled={ocupado} onClick={() => void decidir(actual, otro)} datos="es-este">
            Es este
          </BotonHoja>
          <BotonHoja tipo="secundario" disabled={ocupado} onClick={() => void decidir(otro, actual)} datos="cambiar-al-otro">
            Cambiar al del {cortoOtro}
          </BotonHoja>
        </>
      ) : (
        <>
          <BotonHoja tipo="oscuro" disabled={ocupado} onClick={() => void decidir(actual, otro)} datos="viaje-a">
            Del {rActual}
          </BotonHoja>
          <BotonHoja tipo="secundario" disabled={ocupado} onClick={() => void decidir(otro, actual)} datos="viaje-b">
            Del {rOtro}
          </BotonHoja>
        </>
      )}
    </Hoja>
  )
}

/** «16 al 20» (los dos en el mismo mes) o «28 oct al 2 nov»: el botón corto de P8b. */
function rangoCorto(inicio: string, fin: string): string {
  const [, mi, di] = inicio.split('-').map(Number)
  const [, mf, df] = fin.split('-').map(Number)
  const m = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return mi === mf ? `${di} al ${df}` : `${di} ${m[mi - 1]} al ${df} ${m[mf - 1]}`
}
