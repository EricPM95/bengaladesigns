import { useEffect, useState } from 'react'
import { CADUCA_FOTO_S, firmarFotosDePerfil } from '../lib/miPerfil'

/**
 * Los enlaces de las fotos de perfil (cuentas parte 3B: el almacén `perfiles` es privado). Recibe las rutas guardadas (`travelers.foto_path`) y devuelve ruta → enlace que caduca; antes de
 * que caduque, pide otro. Una ruta sin enlace (sin permiso, borrada, sin conexión) no sale: quien lo usa pone la inicial.
 */
export function useFotosDePerfil(rutas: (string | null | undefined)[]): Record<string, string> {
  const clave = [...new Set(rutas.filter((r): r is string => Boolean(r)))].sort().join('|')
  const [enlaces, setEnlaces] = useState<Record<string, string>>({})
  useEffect(() => {
    const lista = clave ? clave.split('|') : []
    if (lista.length === 0) {
      setEnlaces({})
      return undefined
    }
    let vivo = true
    let reloj: number | undefined
    const pedir = () => {
      void firmarFotosDePerfil(lista).then((r) => {
        if (vivo) setEnlaces(r)
      })
      // Se renueva un poco antes de que caduque (a los 55 minutos).
      reloj = window.setTimeout(pedir, (CADUCA_FOTO_S - 300) * 1000)
    }
    pedir()
    return () => {
      vivo = false
      if (reloj) window.clearTimeout(reloj)
    }
  }, [clave])
  return enlaces
}

/** El enlace de una sola foto (o null). */
export function useFotoDePerfil(ruta: string | null | undefined): string | null {
  const enlaces = useFotosDePerfil([ruta])
  return ruta ? (enlaces[ruta] ?? null) : null
}
