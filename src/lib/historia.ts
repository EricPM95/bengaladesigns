import { useEffect, useState } from 'react'
import { pagoActivo } from './pago'
import { fetchPlaceDetail, fichaEnMemoria, type PlaceDetail } from './placeDetailApi'
import { textoParaEscuchar } from './useEscuchar'
import { accesoDePrueba, useHistoriaDePrueba } from './historiaDePrueba'

/**
 * «Escuchar historia» (Tanda 6y5): la historia de un sitio vive en NUESTROS datos (campo `historia` de su ficha, data/pipeline_v2/detalle/<destino>/*.json), no en el código.
 * Aquí está la única regla de quién la oye: un sitio sin historia no lleva ni barra ni botón; con historia, es de pago, salvo la que la ficha marca `historia_gratis`
 * (la muestra gratis para todos). La gratis ve la barra con el candado en las demás.
 */
export type AccesoHistoria = 'ninguno' | 'libre' | 'candado' | 'prueba'

type FichaConHistoria = Pick<PlaceDetail, 'historia' | 'historia_gratis'> | null | undefined

/** El texto de la historia listo para leer en voz alta (vacío si el sitio no tiene). */
export function textoHistoria(ficha: FichaConHistoria): string {
  return typeof ficha?.historia === 'string' ? textoParaEscuchar([ficha.historia]) : ''
}

/** Quién puede oír la historia de esta ficha: nadie (no hay), todos los que pueden (libre) o solo con la versión completa (candado, para la gratis). */
export function accesoHistoria(ficha: FichaConHistoria, pago: boolean = pagoActivo(), sitio?: { destino: string; nombre: string }): AccesoHistoria {
  if (textoHistoria(ficha).length === 0) return 'ninguno'
  if (pago) return 'libre'
  // Tanda 10P: con el sitio, manda la historia de prueba de la cuenta (la que el viajero elija, una por destino): abierta con «0/1» hasta gastarla; la gastada, suya siempre; las demás, con candado.
  if (sitio) {
    const prueba = accesoDePrueba(useHistoriaDePrueba.getState().mapa, sitio.destino, sitio.nombre)
    return prueba === 'abierta' ? 'prueba' : prueba === 'suya' ? 'libre' : 'candado'
  }
  return ficha?.historia_gratis === true ? 'libre' : 'candado'
}

/** La ficha de un sitio (la misma que pide la ficha de la parada, con su caché): para saber si tiene historia sin abrir la ficha, como en HOY. */
export function useFichaDeSitio(destino: string, nombre: string): PlaceDetail | null {
  const [ficha, setFicha] = useState<PlaceDetail | null>(() => fichaEnMemoria(destino, nombre))
  useEffect(() => {
    let cancelado = false
    setFicha(fichaEnMemoria(destino, nombre))
    fetchPlaceDetail(destino, nombre).then((detalle) => {
      if (!cancelado) setFicha(detalle)
    })
    return () => {
      cancelado = true
    }
  }, [destino, nombre])
  return ficha
}
