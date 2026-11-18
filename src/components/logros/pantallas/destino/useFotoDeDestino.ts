import { useEffect, useState } from 'react'
import { fetchPlacePhoto } from '../../../../lib/placePhoto'
import { portadaPropiaDe } from '../../../../lib/portadaViaje'

/** (V10) La foto del destino (la propia de la app; si no hay, la del servidor de fotos); mientras llega, null (el degradado de siempre). La usan la tarjeta de «Todos mis logros» y la cabecera de la página del destino. */
export function useFotoDeDestino(destino: string, ciudad: string): string | null {
  const propia = portadaPropiaDe(destino)?.url ?? null
  const [url, setUrl] = useState<string | null>(propia)
  useEffect(() => {
    if (propia) {
      setUrl(propia)
      return
    }
    let vivo = true
    void fetchPlacePhoto(ciudad, ciudad, null, 'regular').then((u) => vivo && setUrl(u))
    return () => {
      vivo = false
    }
  }, [propia, ciudad])
  return url
}
