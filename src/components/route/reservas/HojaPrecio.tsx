import { HojaAbajo, ojoStyle } from './HojaAbajo'
import { CampoPrecio } from '../../ui/CampoPrecio'
import { usePrecioEditable } from '../../../lib/useMoneda'
import type { Importe } from '../../../lib/dinero'

/**
 * La hoja pequeña de «Precio (opcional)» (Tanda 6z2) para lo que ya está añadido y solo falta ponerle su precio o cambiárselo: el seguro, la eSIM, el coche de alquiler, un billete…
 * Total de todas las personas, en la moneda del viajero (o la que se elija). Sin precio escrito, [Guardar] lo deja vacío: nunca lo rellena la app.
 */
export function HojaPrecio({ titulo, eyebrow = 'Precio', cta = 'Guardar', inicial, onGuardar, onQuitar, onClose }: { titulo: string; eyebrow?: string; cta?: string; inicial: Importe | null; onGuardar: (precio: Importe | null) => void; onQuitar?: () => void; onClose: () => void }) {
  const precio = usePrecioEditable(inicial)
  return (
    <HojaAbajo titleId="hoja-precio" onClose={onClose} capa={100}>
      <p className="max-w-[calc(100%-2.5rem)] text-text/50" style={ojoStyle}>
        {eyebrow}
      </p>
      <h2 id="hoja-precio" className="mt-1.5 max-w-[calc(100%-3rem)] font-display text-[24px] leading-[1.05] text-text">
        {titulo}
      </h2>
      <div className="mt-4">
        <CampoPrecio estado={precio} ayuda="Lo que pagaste en total, todas las personas." />
      </div>
      <button
        type="button"
        onClick={() => {
          onGuardar(precio.importe)
          onClose()
        }}
        className="mt-4 h-[54px] w-full rounded-full bg-text text-[15px] font-semibold text-bg transition-transform active:scale-[.98]"
      >
        {cta}
      </button>
      {onQuitar && (
        <button
          type="button"
          onClick={() => {
            onQuitar()
            onClose()
          }}
          className="mt-2 h-11 w-full text-[13.5px] font-medium text-accent-red underline underline-offset-2"
        >
          Quitar
        </button>
      )}
    </HojaAbajo>
  )
}
