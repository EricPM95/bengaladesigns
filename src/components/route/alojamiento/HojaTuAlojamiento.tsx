import { useState } from 'react'
import { HojaAbajo, ojoStyle } from '../reservas/HojaAbajo'
import { EliminarTexto } from '../reservas/BloqueReservas'
import { nochesTexto, precioDeAlojamiento, precioDeTexto, type TuAlojamiento } from '../../../lib/tuAlojamiento'

/**
 * La hoja «Tu alojamiento» (Tanda 6z): dos campos, el nombre (texto libre) y el precio total (opcional, en euros). Sin dirección, sin búsqueda ni mapa; las noches son las del viaje y no se preguntan.
 * Con uno ya puesto salen sus datos y [Eliminar]. Lo escrito no sale a ninguna web.
 */
export function HojaTuAlojamiento({ ciudad, noches, actual, onGuardar, onEliminar, onClose }: { ciudad: string; noches: number; actual: TuAlojamiento | null; onGuardar: (hotel: TuAlojamiento) => void; onEliminar: () => void; onClose: () => void }) {
  const [nombre, setNombre] = useState(actual?.name ?? '')
  const [precio, setPrecio] = useState(() => {
    const price = precioDeAlojamiento(actual)
    return price !== null ? String(price).replace('.', ',') : ''
  })
  const nombreLimpio = nombre.trim()
  const campo = 'h-12 w-full rounded-[14px] border border-text/15 bg-white px-3.5 text-[15px] text-text outline-none focus:border-text/50'
  return (
    <HojaAbajo titleId="hoja-tu-alojamiento" onClose={onClose} capa={110}>
      <p className="max-w-[calc(100%-2.5rem)] text-text/50" style={ojoStyle}>
        {ciudad} · {nochesTexto(noches)}
      </p>
      <h2 id="hoja-tu-alojamiento" className="mt-1 max-w-[calc(100%-3rem)] font-display text-[26px] leading-none text-text">
        Tu alojamiento
      </h2>
      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (nombreLimpio) onGuardar({ name: nombreLimpio, totalPrice: precioDeTexto(precio) })
        }}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-text">Nombre</span>
          <input value={nombre} onChange={(event) => setNombre(event.target.value)} maxLength={80} placeholder="Hotel Artemide" autoComplete="off" className={campo} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-text">
            Precio total <span className="font-normal text-text/55">(opcional)</span>
          </span>
          <span className="relative block">
            <input value={precio} onChange={(event) => setPrecio(event.target.value)} inputMode="decimal" placeholder="420" autoComplete="off" className={`${campo} pr-9`} />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[15px] text-text/55">€</span>
          </span>
        </label>
        <button type="submit" disabled={!nombreLimpio} className="mt-1 h-12 w-full rounded-full bg-[#1C2230] text-[15px] font-semibold text-[#FFFDF8] transition-transform active:scale-[.98] disabled:opacity-40">
          Guardar
        </button>
        {actual && <EliminarTexto texto="Eliminar" onClick={onEliminar} />}
      </form>
    </HojaAbajo>
  )
}
