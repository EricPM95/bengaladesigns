import { useEffect, useState } from 'react'
import { useRouteStore } from '../store/useRouteStore'
import { useDestinationExcursions } from './destinationExcursions'
import { importeDeTexto, monedaDePais, textoDeImporte, type Cambio, type Importe } from './dinero'
import type { Route } from './types'

/** La moneda del viajero: la que eligió, y si no, la del país de su ciudad de origen del formulario; «EUR» si no se sabe ninguna. */
export function monedaDelViajero(route: Route | null | undefined): string {
  return route?.monedaViajero ?? monedaDePais(route?.answers.originPlace?.countryCode) ?? 'EUR'
}

/** Cuántas personas viajan (de «¿Con quién viajas?»); null si el formulario no lo dice. */
export function personasDelViaje(route: Route): number | null {
  if (route.personas && route.personas > 0) return route.personas
  const answers = route.answers
  switch (answers.companion) {
    case 'solo':
      return 1
    case 'couple':
      return 2
    case 'family': {
      const total = (answers.companionAdults ?? 0) + (answers.companionChildrenAges?.length ?? 0)
      return total > 0 ? total : null
    }
    case 'group':
      return answers.companionGroupSize && answers.companionGroupSize > 0 ? answers.companionGroupSize : null
    default:
      return null
  }
}

let cambioGuardado: Cambio | null = null
let cambioPedido: Promise<Cambio | null> | null = null

/** El cambio que ya se pidió en esta sesión, si hay (para quien no puede esperar, como el PDF). */
export const cambioActual = (): Cambio | null => cambioGuardado

/** El cambio del día que guarda nuestro servidor (del Banco Central Europeo): se pide una vez por sesión; la app nunca llama a la fuente. */
export function pedirCambio(): Promise<Cambio | null> {
  if (cambioGuardado) return Promise.resolve(cambioGuardado)
  cambioPedido ??= fetch('/api/cambio')
    .then((respuesta) => (respuesta.ok ? respuesta.json() : null))
    .then((datos: Cambio | null) => {
      if (datos && datos.tasas && Object.keys(datos.tasas).length > 0) cambioGuardado = datos
      else cambioPedido = null
      return cambioGuardado
    })
    .catch(() => {
      cambioPedido = null
      return null
    })
  return cambioPedido
}

/** El cambio del día, cuando llega (null mientras tanto o si no hay). */
export function useCambio(): Cambio | null {
  const [cambio, setCambio] = useState<Cambio | null>(cambioGuardado)
  useEffect(() => {
    let vivo = true
    void pedirCambio().then((datos) => vivo && setCambio(datos))
    return () => {
      vivo = false
    }
  }, [])
  return cambio
}

export interface OpcionMoneda {
  codigo: string
  etiqueta: string
}

/** Las monedas que se ofrecen en un campo de precio: la del viajero, la del destino y, detrás, las que tienen cambio. */
export function useMonedas() {
  const route = useRouteStore((state) => state.route)
  const info = useDestinationExcursions(route?.destination)
  const cambio = useCambio()
  const viajero = monedaDelViajero(route)
  const destino = info.moneda
  const opciones: OpcionMoneda[] = [{ codigo: viajero, etiqueta: `${viajero} · tuya` }]
  if (destino && destino !== viajero) opciones.push({ codigo: destino, etiqueta: `${destino} · destino` })
  for (const codigo of ['EUR', ...Object.keys(cambio?.tasas ?? {}).sort()]) if (!opciones.some((opcion) => opcion.codigo === codigo)) opciones.push({ codigo, etiqueta: codigo })
  return { viajero, destino, cambio, opciones }
}

/** El estado de un campo de precio: el texto, la moneda (la del viajero salvo que ya hubiera un precio en otra) y el importe que sale de los dos. */
export function usePrecioEditable(inicial: Importe | null | undefined) {
  const { viajero, opciones, destino } = useMonedas()
  const [texto, setTexto] = useState(() => textoDeImporte(inicial))
  const [monedaElegida, setMoneda] = useState<string | null>(inicial?.currency ?? null)
  const moneda = monedaElegida ?? viajero
  return { texto, setTexto, moneda, setMoneda, opciones, destino, importe: importeDeTexto(texto, moneda) }
}
