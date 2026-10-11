import { useEffect, useState } from 'react'
import { alCambiarFotos, contarFotos } from './fotosViaje'

/**
 * Cuántas fotos tiene cada viaje («155 fotos» de «Mis viajes», Tanda 6y4). null mientras carga (la lista no enseña un «Sin fotos» falso); se vuelve a contar cuando se añade o se borra una foto en cualquier
 * parte de la app. Sin Supabase o sin la migración: 0 en todos.
 */
export function useNumeroFotos(tripIds: string[]): Map<string, number> | null {
  const [cuentas, setCuentas] = useState<Map<string, number> | null>(null)
  const clave = tripIds.join('|')

  useEffect(() => {
    let vivo = true
    const contar = async () => {
      const mapa = await contarFotos(clave ? clave.split('|') : [])
      if (vivo) setCuentas(mapa)
    }
    void contar()
    const quitar = alCambiarFotos(() => void contar())
    return () => {
      vivo = false
      quitar()
    }
  }, [clave])

  return cuentas
}
