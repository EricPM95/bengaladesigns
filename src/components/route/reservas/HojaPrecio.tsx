import { useState } from 'react'
import { HojaAbajo, ojoStyle } from './HojaAbajo'
import { CampoPrecio } from '../../ui/CampoPrecio'
import { usePrecioEditable } from '../../../lib/useMoneda'
import type { Importe } from '../../../lib/dinero'

/**
 * La hoja pequeña de «Precio (opcional)» (Tanda 6z2) para lo que ya está añadido y solo falta ponerle su precio o cambiárselo: el seguro, la eSIM, el coche de alquiler, un billete…
 * Total de todas las personas, en la moneda del viajero (o la que se elija). Sin precio escrito, [Guardar] lo deja vacío: nunca lo rellena la app.
 * Tanda 6y4: con `conDonde`, un campo opcional «¿Dónde lo has comprado?» (texto libre que escribe el viajero; nosotros nunca ponemos un nombre) y, con `sinPrecio`, la hoja es solo ese campo (la tarjeta sin comisiones no lleva precio).
 */
export function HojaPrecio({
  titulo,
  eyebrow = 'Precio',
  cta = 'Guardar',
  inicial,
  onGuardar,
  onQuitar,
  onClose,
  conDonde = false,
  sinPrecio = false,
  dondeInicial = '',
  ayuda = 'Lo que pagaste en total, todas las personas.',
}: {
  titulo: string
  eyebrow?: string
  cta?: string
  inicial: Importe | null
  onGuardar: (precio: Importe | null, donde: string) => void
  onQuitar?: () => void
  onClose: () => void
  conDonde?: boolean
  sinPrecio?: boolean
  dondeInicial?: string
  /** La frase de ayuda bajo «Precio» (por defecto, que es el total de todas las personas). */
  ayuda?: string
}) {
  const precio = usePrecioEditable(inicial)
  const [donde, setDonde] = useState(dondeInicial)
  return (
    <HojaAbajo titleId="hoja-precio" onClose={onClose} capa={100}>
      <p className="max-w-[calc(100%-2.5rem)] text-text/50" style={ojoStyle}>
        {eyebrow}
      </p>
      <h2 id="hoja-precio" className="mt-1.5 max-w-[calc(100%-3rem)] font-display text-[24px] leading-[1.05] text-text">
        {titulo}
      </h2>
      {!sinPrecio && (
        <div className="mt-4">
          <CampoPrecio estado={precio} ayuda={ayuda} />
        </div>
      )}
      {conDonde && (
        <label className="mt-4 block">
          <span className="text-[13px] font-medium text-text">¿Dónde lo has comprado? (opcional)</span>
          <input
            value={donde}
            onChange={(event) => setDonde(event.target.value)}
            maxLength={60}
            aria-label="¿Dónde lo has comprado?"
            data-donde-comprado
            className="mt-1.5 h-12 w-full rounded-[14px] border border-text/15 bg-white px-3.5 text-[15px] outline-none focus:border-text/50"
          />
        </label>
      )}
      <button
        type="button"
        onClick={() => {
          onGuardar(sinPrecio ? null : precio.importe, donde.trim())
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
          Eliminar
        </button>
      )}
    </HojaAbajo>
  )
}
