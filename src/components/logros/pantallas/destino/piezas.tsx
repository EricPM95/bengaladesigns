import { useEffect, useState, type ReactNode } from 'react'
import './destino.css'
import { guardarEnCache, leerEnCache, mismaRespuesta } from '../../../../lib/logrosEnCache'

/** El botón de volver de las pantallas de un destino: círculo de 44 px (la zona de toque mínima) con una flecha fina. */
export function BotonVolver({ onClick, etiqueta = 'Volver', sobreFoto = false }: { onClick: () => void; etiqueta?: string; sobreFoto?: boolean }): ReactNode {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      onClick={onClick}
      style={{ width: 44, height: 44, flex: 'none', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: sobreFoto ? 'rgba(28,34,48,.55)' : '#EDE4D3', color: sobreFoto ? '#FFFDF8' : '#1C2230' }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
    </button>
  )
}

/**
 * Pide unos datos al abrir la pantalla (y otra vez si cambian `claves`). `null` = todavía no ha llegado; `false` = no se ha podido.
 * (V18) Con `claveEnCache`: lo último que se vio de esta pantalla (en memoria y en el móvil, como la hoja de logros de la V9) sale AL INSTANTE, sin «Un momento…»; lo nuevo llega por detrás y solo se repinta si cambia.
 * «Un momento…» solo la primera vez en un móvil. Si no se ha podido pedir y ya había algo guardado, se queda lo guardado.
 */
export function useCarga<T>(pedir: () => Promise<T | null>, claves: unknown[], claveEnCache?: string): T | null | false {
  const [datos, setDatos] = useState<T | null | false>(() => (claveEnCache ? (leerEnCache<T>(claveEnCache) ?? null) : null))
  useEffect(() => {
    let vivo = true
    const guardado = claveEnCache ? leerEnCache<T>(claveEnCache) : null
    setDatos(guardado)
    void pedir().then((r) => {
      if (!vivo) return
      if (r && claveEnCache) guardarEnCache(claveEnCache, r)
      setDatos((antes) => (r ? (antes && mismaRespuesta(antes, r) ? antes : r) : (antes || false)))
    })
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, claves)
  return datos
}

/** Lo que se ve mientras llegan los datos o si no han podido llegar. */
export function Esperando({ cargando }: { cargando: boolean }): ReactNode {
  return (
    <p style={{ margin: '40px 24px', textAlign: 'center', font: "400 13.5px 'Geist'", color: 'rgba(28,34,48,.6)' }}>{cargando ? 'Un momento…' : 'No se ha podido cargar. Vuelve a probar.'}</p>
  )
}

export const FONDO_PAPEL = '#F5EFE4'
