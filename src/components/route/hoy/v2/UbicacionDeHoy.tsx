import { useState } from 'react'
import { Icono } from '../../../ui/Icono'
import { HojaActivaUbicacion } from './HojaActivaUbicacion'

/**
 * V43 §8: la línea de la ubicación en todo HOY (donde la tarjeta de la parada no la lleva ya): [Usar mi ubicación], o [Actualizar] si ya la hay.
 * Si el viajero dijo que no, [Usar mi ubicación] abre la hoja «Activa tu ubicación» con los pasos de su navegador.
 */
export function UbicacionDeHoy({ hay, estado, pedir }: { hay: boolean; estado: 'libre' | 'pidiendo' | 'no'; pedir: () => void }) {
  const [hoja, setHoja] = useState(false)
  return (
    <>
      <div data-hoy-ubicacion-linea data-hoy-ubicacion-estado={hay ? 'si' : 'no'} className="flex flex-none items-center gap-2.5 px-1 text-[12.5px] font-medium" style={{ color: 'rgba(28,34,48,.62)' }}>
        <Icono nombre="localizar" size={15} grosor={1.8} />
        <span className="flex-1">{hay ? 'Tu ubicación está activa' : 'Sin tu ubicación no sabemos cuándo llegas'}</span>
        <button type="button" onClick={() => (!hay && estado === 'no' ? setHoja(true) : pedir())} disabled={estado === 'pidiendo'} data-hoy-ubicacion-boton className="flex min-h-11 items-center px-1 text-[12.5px] font-bold underline underline-offset-[3px]" style={{ color: '#8E6820' }}>
          {estado === 'pidiendo' ? 'Buscando…' : hay ? 'Actualizar' : 'Usar mi ubicación'}
        </button>
      </div>
      {hoja && <HojaActivaUbicacion onCerrar={() => setHoja(false)} onReintentar={() => { setHoja(false); pedir() }} />}
    </>
  )
}
