import { useEffect, useState } from 'react'
import { alCambiarFotos, urlParaMostrar, type FotoViaje } from '../lib/fotosViaje'
import { enlaceDeGaleria, fotoDePortadaPorRegla, fotosParaPortada, miniaturaEnTexto, portadaPropiaDe } from '../lib/portadaViaje'
import type { Route } from '../lib/types'
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
/**
 * (V15) La portada que se vio la última vez, guardada en el móvil: así la tarjeta sale YA con la buena al abrir el Perfil, sin pasar por la del destino y cambiar un momento después. Lo que se guarda es la foto
 * (una miniatura en texto, porque las direcciones firmadas caducan) o la dirección del destino; se renueva cuando la regla da otra.
 */
const CLAVE_PORTADA = 'jutrip.portadas_vistas'
type Vista = { url: string; origen: PortadaResuelta['origen']; credito: string | null }
function leerPortadaVista(tripId: string): Vista | null {
  try {
    const m = JSON.parse(localStorage.getItem(CLAVE_PORTADA) ?? '{}') as Record<string, Vista>
    const v = m[tripId]
    return v && typeof v.url === 'string' ? v : null
  } catch {
    return null
  }
}
function guardarPortadaVista(tripId: string, v: Vista): void {
  try {
    const m = JSON.parse(localStorage.getItem(CLAVE_PORTADA) ?? '{}') as Record<string, Vista>
    m[tripId] = v
    const ids = Object.keys(m)
    for (const id of ids.slice(0, Math.max(0, ids.length - 16))) delete m[id]
    localStorage.setItem(CLAVE_PORTADA, JSON.stringify(m))
  } catch {
    /* sin almacenamiento o sin sitio: se verá la de siempre */
  }
}

export function usePortadaDeViaje(tripId: string, destino: string, hecho: boolean, ruta?: Route | null, sitios: { nombre: string; visto: boolean }[] = []): PortadaResuelta {
  const base = usePortadaCalculada(tripId, destino, hecho, ruta, sitios)
  const [vista] = useState<Vista | null>(() => leerPortadaVista(tripId))
  const [lista, setLista] = useState(false)
  // Hasta que lo de ahora esté resuelto (las fotos del viaje tardan un poco), se enseña lo último que se vio de este viaje.
  useEffect(() => {
    setLista(false)
    const t = window.setTimeout(() => setLista(true), 2500)
    return () => window.clearTimeout(t)
  }, [tripId])
  const resuelta = base.resuelta || lista
  useEffect(() => {
    if (!base.resuelta || !base.portada.url) return
    const { url, origen, credito } = base.portada
    if (origen === 'destino' || url.startsWith('data:') || url.startsWith('/')) {
      guardarPortadaVista(tripId, { url, origen, credito })
      return
    }
    let vivo = true
    void miniaturaEnTexto(url).then((mini) => vivo && mini && guardarPortadaVista(tripId, { url: mini, origen, credito }))
    return () => {
      vivo = false
    }
  }, [tripId, base.resuelta, base.portada.url, base.portada.origen, base.portada.credito])
  if (!resuelta && vista) return { url: vista.url, origen: vista.origen, credito: vista.credito }
  return base.portada
}

function usePortadaCalculada(tripId: string, destino: string, hecho: boolean, ruta: Route | null | undefined, sitios: { nombre: string; visto: boolean }[]): { portada: PortadaResuelta; resuelta: boolean } {
  const elegida = usePortadas((s) => s.porViaje[tripId])
  const necesitaFotos = elegida?.f === 'viaje' || (elegida === undefined && hecho)
  const [fotos, setFotos] = useState<FotoViaje[] | null>(null)
  const [auto, setAuto] = useState<{ para: string; foto: FotoViaje | null } | null>(null)
  const clavesSitios = sitios.map((x) => `${x.nombre}:${x.visto ? 1 : 0}`).join('|')
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

  // (V15) Sin elegir nada y con el viaje hecho: la regla de la portada (una foto hecha en el destino, mejor de un sitio con logro).
  useEffect(() => {
    if (!(elegida === undefined && hecho) || !fotos || !ruta) return undefined
    let vivo = true
    void fotoDePortadaPorRegla(tripId, ruta, sitios, fotos).then((f) => vivo && setAuto({ para: tripId, foto: f }))
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, elegida, hecho, fotos, ruta, clavesSitios])

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

  const sinFotosAun = necesitaFotos && fotos === null
  const reglaPendiente = elegida === undefined && hecho && Boolean(ruta) && (fotos === null || auto?.para !== tripId)
  const destinoListo = delDestino.url !== null
  if (elegida?.f === 'viaje') {
    const f = fotos?.find((x) => x.id === elegida.id)
    return { portada: f ? { url: f.url || urlParaMostrar(f), origen: 'viaje', credito: null } : delDestino, resuelta: Boolean(f) || (fotos !== null && destinoListo) }
  }
  if (elegida?.f === 'galeria') {
    const u = elegida.data ?? galeria
    return { portada: u ? { url: u, origen: 'galeria', credito: null } : delDestino, resuelta: Boolean(u) || destinoListo }
  }
  if (elegida === undefined && hecho) {
    if (ruta) {
      const f = auto?.para === tripId ? auto.foto : null
      if (f) return { portada: { url: f.url || urlParaMostrar(f), origen: 'auto', credito: null }, resuelta: true }
      return { portada: delDestino, resuelta: !reglaPendiente && destinoListo }
    }
    return { portada: delDestino, resuelta: !sinFotosAun && destinoListo }
  }
  return { portada: delDestino, resuelta: destinoListo }
}
