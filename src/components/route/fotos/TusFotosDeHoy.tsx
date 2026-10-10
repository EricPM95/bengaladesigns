import { useState } from 'react'
import type { DayPlan } from '../../../lib/types'
import { pagoActivo } from '../../../lib/pago'
import { urlParaMostrar, type FotoViaje } from '../../../lib/fotosViaje'
import { useFotosViaje } from '../../../lib/useFotosViaje'
import { Icono } from '../../ui/Icono'
import { BotonFoto } from './BotonFoto'
import { FotoEnGrande } from './FotoEnGrande'

/**
 * «Tus fotos de hoy» (Tanda 6z6, decidido por Eric el 10-oct-2026): al final de HOY de pago, durante el viaje, un bloque pequeño con el estilo de «Guarda tus recuerdos» pero en pequeño: las miniaturas de las fotos de ese día
 * (las de las paradas y las sueltas) y [+ Foto], para añadir fotos sueltas del día, sin parada (la cena, una calle). Sin fotos todavía, solo el título y [+ Foto]. Las sueltas van al álbum del viaje, en su día, sin parada.
 * El bloque grande «Guarda tus recuerdos» sale solo después del viaje. En la gratis, nada de esto: allí las fotos se añaden desde la ficha de cada parada (una por parada).
 */
export function TusFotosDeHoy({ day }: { day: DayPlan }) {
  const { fotos } = useFotosViaje()
  const [grande, setGrande] = useState<FotoViaje | null>(null)
  if (!pagoActivo()) return null
  const deHoy = fotos.filter((foto) => foto.dayNumber === day.dayNumber)
  return (
    <section aria-label="Tus fotos de hoy" data-fotos-de-hoy className="flex flex-none flex-col gap-2.5 rounded-[18px] bg-[#FFFDF8] px-3.5 py-3" style={{ border: '1px solid rgba(28,34,48,.07)' }}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full" style={{ background: 'oklch(0.55 0.17 5 / .1)', color: 'oklch(0.5 0.17 5)' }}>
          <Icono nombre="camara" size={15} />
        </span>
        <span className="min-w-0 flex-1" style={{ font: "400 17px/1.15 'Instrument Serif',serif" }}>
          Tus fotos de hoy
        </span>
        <BotonFoto
          dayId={day.id}
          dayNumber={day.dayNumber}
          etiqueta="Añadir una foto suelta de hoy"
          multiple
          className="flex h-9 flex-none items-center gap-1.5 rounded-full bg-[#1C2230] px-3.5 text-[13px] font-semibold text-[#FFFDF8] transition-transform active:scale-[.98]"
        >
          <Icono nombre="anadir" size={14} grosor={2.2} />
          Foto
        </BotonFoto>
      </div>
      {deHoy.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" data-miniaturas>
          {deHoy.map((foto) => (
            <button key={foto.id} type="button" onClick={() => setGrande(foto)} aria-label={foto.stopName ? `Foto de ${foto.stopName}` : 'Foto suelta de hoy'} className="h-14 w-14 flex-none overflow-hidden rounded-xl bg-text/10">
              {urlParaMostrar(foto) ? <img src={urlParaMostrar(foto)} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
            </button>
          ))}
        </div>
      )}
      <FotoEnGrande foto={grande} onCerrar={() => setGrande(null)} />
    </section>
  )
}
