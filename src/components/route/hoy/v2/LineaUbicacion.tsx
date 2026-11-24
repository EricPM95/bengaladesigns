import { useEffect, useState } from 'react'
import type { Coordinates, Route, Stop } from '../../../../lib/types'
import { zonaDeUbicacion } from '../../../../lib/ubicacionHoy'
import { HojaActivaUbicacion } from './HojaActivaUbicacion'
import { useUbicacionHoy } from './useUbicacionHoy'

/**
 * V44 §5: la línea de ubicación de las hojas de «Añadir un sitio cercano» (y de comer): «Cerca de ti» con ubicación en la ruta; sin ubicación, «No tienes la ubicación activada · [Usar mi ubicación]»
 * (SIN nombrar ningún sitio); con ubicación pero lejos de la ruta, «Contamos desde tu parada de ahora». `onUbicacion` avisa a la hoja cuando el viajero la activa aquí y está en la ruta.
 * Solo se monta con la hoja abierta (el aviso de posición cada 45 s dura lo que la hoja).
 */
export function LineaUbicacion({ route, referencia, enCoche, enLaRuta, onUbicacion }: { route: Route; referencia: Stop; enCoche: boolean; /** La hoja ya cuenta con tu ubicación (llegó de HOY, en la ruta). */ enLaRuta: boolean; onUbicacion: (u: Coordinates | null) => void }) {
  const gps = useUbicacionHoy()
  const [hoja, setHoja] = useState(false)
  const util = zonaDeUbicacion({ ubicacion: gps.ubicacion, route, referencia, enCoche }) === 'ruta' ? gps.ubicacion : null
  useEffect(() => {
    onUbicacion(util)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [util?.lat, util?.lng])
  if (enLaRuta || util) return <span data-anadir-ubicacion className="text-[13px] leading-[1.4] text-[#1C2230]/65">Cerca de ti</span>
  if (gps.ubicacion) return <span data-anadir-ubicacion className="text-[13px] leading-[1.4] text-[#1C2230]/65">Contamos desde tu parada de ahora</span>
  return (
    <>
      <span data-anadir-ubicacion data-anadir-sin-ubicacion className="flex flex-wrap items-center gap-x-1 text-[13px] leading-[1.4] text-[#1C2230]/65">
        No tienes la ubicación activada ·
        <button type="button" onClick={() => (gps.estado === 'no' ? setHoja(true) : gps.pedir())} data-anadir-usar-ubicacion className="inline-flex min-h-11 items-center font-bold underline underline-offset-[3px]" style={{ color: '#8E6820' }}>
          {gps.estado === 'pidiendo' ? 'Buscando…' : 'Usar mi ubicación'}
        </button>
      </span>
      {hoja && <HojaActivaUbicacion onCerrar={() => setHoja(false)} onReintentar={() => { setHoja(false); gps.pedir() }} />}
    </>
  )
}
