import { useEffect, useState } from 'react'
import { alCambiarFotos, urlParaMostrar, type FotoViaje } from '../lib/fotosViaje'
import { enlaceDeGaleria, fotosParaPortada, portadaPropiaDe, primeraFoto } from '../lib/portadaViaje'
import { fetchPlacePhotoDetail } from '../lib/placePhoto'
import { usePortadas } from '../store/usePortadas'

export interface PortadaResuelta {
  /** La foto que se pinta; null = el degradado de siempre. */
  url: string | null
  /** «destino»: la del destino (la de siempre); «viaje»: una foto de sus paradas; «galeria»: de su galería; «auto»: la primera foto suya al acabar el viaje (sin haber elegido). */
  origen: 'destino' | 'viaje' | 'galeria' | 'auto'
  /** La línea de crédito (solo las del destino). */
  credito: string | null
}

/**
 * La portada de la tarjeta de un viaje (Tanda 10N3, §3b.6), por este orden: lo que eligió la persona; si no eligió nada y el viaje YA ha acabado, la primera foto suya; y si no, la foto del destino.
 * Las fotos del viaje solo se piden cuando hacen falta (se eligió una de ellas, o el viaje está hecho y no se eligió nada).
 */
export function usePortadaDeViaje(tripId: string, destino: string, hecho: boolean): PortadaResuelta {
  const elegida = usePortadas((s) => s.porViaje[tripId])
  const necesitaFotos = elegida?.f === 'viaje' || (elegida === undefined && hecho)
  const [fotos, setFotos] = useState<FotoViaje[] | null>(null)
  const [galeria, setGaleria] = useState<string | null>(null)
  const [deFuera, setDeFuera] = useState<{ destino: string; url: string; credito: string | null } | null>(null)

  useEffect(() => {
    if (!necesitaFotos) {
      setFotos(null)
      return undefined
    }
    let vivo = true
    const cargar = () => void fotosParaPortada(tripId).then((l) => vivo && setFotos(l))
    cargar()
    const quitar = alCambiarFotos(cargar)
    return () => {
      vivo = false
      quitar()
    }
  }, [tripId, necesitaFotos, elegida?.f])

  const rutaGaleria = elegida?.f === 'galeria' ? (elegida.ruta ?? null) : null
  useEffect(() => {
    if (!rutaGaleria) {
      setGaleria(null)
      return undefined
    }
    let vivo = true
    void enlaceDeGaleria(rutaGaleria).then((u) => vivo && setGaleria(u))
    return () => {
      vivo = false
    }
  }, [rutaGaleria])

  // Un destino sin foto propia pide la suya al servidor de fotos (con su crédito); si no hay, el degradado.
  const propia = portadaPropiaDe(destino)
  useEffect(() => {
    if (propia) return undefined
    let vivo = true
    void fetchPlacePhotoDetail(destino, destino).then((f) => {
      if (vivo && f) setDeFuera({ destino, url: f.regular || f.small, credito: f.attribution ? `Foto: ${f.attribution.photographer} · ${f.attribution.site ?? 'Unsplash'}` : null })
    })
    return () => {
      vivo = false
    }
  }, [destino, propia])

  const delDestino: PortadaResuelta = propia ? { url: propia.url, origen: 'destino', credito: propia.credito } : deFuera && deFuera.destino === destino ? { url: deFuera.url, origen: 'destino', credito: deFuera.credito } : { url: null, origen: 'destino', credito: null }

  if (elegida?.f === 'viaje') {
    const f = fotos?.find((x) => x.id === elegida.id)
    return f ? { url: f.url || urlParaMostrar(f), origen: 'viaje', credito: null } : delDestino
  }
  if (elegida?.f === 'galeria') {
    const u = elegida.data ?? galeria
    return u ? { url: u, origen: 'galeria', credito: null } : delDestino
  }
  if (elegida === undefined && hecho) {
    const primera = fotos ? primeraFoto(fotos) : null
    if (primera) return { url: primera.url || urlParaMostrar(primera), origen: 'auto', credito: null }
  }
  return delDestino
}
