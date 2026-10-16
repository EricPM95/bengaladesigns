import { useEffect, useState } from 'react'
import { civitatisActiva } from './civitatis'

/** El enlace de traslados del destino (para la ficha de llegada). Apagado o sin datos: null. */
export function useEnlaceDeTraslados(destino: string | null | undefined): string | null {
  const activo = civitatisActiva() && Boolean(destino)
  const [url, setUrl] = useState<{ destino: string; url: string | null } | null>(null)
  useEffect(() => {
    if (!activo || !destino) return undefined
    let cancelado = false
    fetch(`/api/civitatis/traslados?${new URLSearchParams({ destino }).toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((cuerpo: { ok?: boolean; datos?: { url?: string } } | null) => {
        if (!cancelado) setUrl({ destino, url: cuerpo?.ok && cuerpo.datos?.url ? cuerpo.datos.url : null })
      })
      .catch(() => {
        if (!cancelado) setUrl({ destino, url: null })
      })
    return () => {
      cancelado = true
    }
  }, [activo, destino])
  return activo && url?.destino === destino ? url.url : null
}
