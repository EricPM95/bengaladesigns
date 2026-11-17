import { useState } from 'react'
import type { DayPlan } from '../../../lib/types'
import { pagoActivo } from '../../../lib/pago'
import { urlParaMostrar, type FotoViaje } from '../../../lib/fotosViaje'
import { useFotosViaje } from '../../../lib/useFotosViaje'
import { FotoEnGrande } from './FotoEnGrande'

/**
 * «Tus fotos de hoy» (Tanda 6z6, decidido por Eric el 10-oct-2026): al final de HOY de pago, durante el viaje, un bloque pequeño con el estilo de «Guarda tus recuerdos» pero en pequeño: las miniaturas de las fotos de ese día
 * (las de las paradas y las sueltas) y [+ Foto], para añadir fotos sueltas del día, sin parada (la cena, una calle). (V2b: sin fotos de hoy, no sale: nada.) Las sueltas van al álbum del viaje, en su día, sin parada.
 * El bloque grande «Guarda tus recuerdos» sale solo después del viaje. En la gratis, nada de esto: allí las fotos se añaden desde la ficha de cada parada (una por parada).
 */
export function TusFotosDeHoy({ day }: { day: DayPlan }) {
  const { fotos } = useFotosViaje()
  const [grande, setGrande] = useState<FotoViaje | null>(null)
  if (!pagoActivo()) return null
  const deHoy = fotos.filter((foto) => foto.dayNumber === day.dayNumber)
  // (V2b) Solo sale si hay fotos de hoy (sin fotos, nada: para hacerlas ya está la cámara flotante). Como Design (H1, H4): la etiqueta y la fila de fotos.
  if (deHoy.length === 0) return null
  return (
    <section aria-label="Tus fotos de hoy" data-fotos-de-hoy className="flex flex-none flex-col gap-2.5">
      <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#6F4E37' }}>TUS FOTOS DE HOY</span>
      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-0.5" data-miniaturas>
        {deHoy.map((foto) => (
          <button key={foto.id} type="button" onClick={() => setGrande(foto)} aria-label={foto.stopName ? `Foto de ${foto.stopName}` : 'Foto suelta de hoy'} className="h-[88px] w-[88px] flex-none overflow-hidden rounded-[20px] bg-text/10">
            {urlParaMostrar(foto) ? <img src={urlParaMostrar(foto)} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
          </button>
        ))}
      </div>
      <FotoEnGrande foto={grande} onCerrar={() => setGrande(null)} />
    </section>
  )
}
