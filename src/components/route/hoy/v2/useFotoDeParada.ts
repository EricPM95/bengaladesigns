import { useEffect, useState } from 'react'
import type { Stop } from '../../../../lib/types'
import { fetchPlacePhoto, photoNameOf } from '../../../../lib/placePhoto'

/**
 * La foto de una parada de HOY v2. Si la parada ya trae su foto (la pone `enrichRoutePhotos` al crear el viaje), esa. Si viene sin ella (un viaje de pruebas, una parada añadida a mano),
 * la pide al servidor por su nombre, igual que la app: la propia del destino, la de Unsplash que mencione el sitio o ninguna (nunca la de otro sitio).
 */
export function useFotoDeParada(parada: Stop | null, ciudad: string, dateIso: string | null): string {
  const [pedida, setPedida] = useState<{ id: string; url: string } | null>(null)
  const id = parada?.id ?? ''
  const sinFoto = Boolean(parada) && !parada!.photoUrl
  useEffect(() => {
    if (!parada || !sinFoto || parada.isBreak || parada.isArrival || parada.fixedPhotoUrl) return undefined
    let vivo = true
    void fetchPlacePhoto(photoNameOf(parada), ciudad, parada.wikipediaTitle, 'regular', dateIso, Boolean(parada.noOwnPhoto)).then((url) => {
      if (vivo && url) setPedida({ id, url })
    })
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, sinFoto, ciudad, dateIso])
  if (!parada) return ''
  return parada.photoUrl || (pedida?.id === id ? pedida.url : '')
}
