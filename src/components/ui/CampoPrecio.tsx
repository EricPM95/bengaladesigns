import type { OpcionMoneda } from '../../lib/useMoneda'

/**
 * El campo «Precio (opcional)» de todo lo que se añade al viaje (Tanda 6z2): el total de todas las personas, en la moneda del viajero, y al lado la moneda, que se cambia con un toque a la
 * del destino o a otra (por si se pagó allí). Nunca lo rellena la app. `estado` es lo que devuelve `usePrecioEditable`.
 */
export function CampoPrecio({
  estado,
  etiqueta = 'Precio (opcional)',
  ayuda,
}: {
  estado: { texto: string; setTexto: (texto: string) => void; moneda: string; setMoneda: (moneda: string) => void; opciones: OpcionMoneda[] }
  etiqueta?: string
  ayuda?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-text">{etiqueta}</span>
      {ayuda && <span className="-mt-1 text-[12px] text-text/55">{ayuda}</span>}
      <div className="flex gap-2">
        <input
          value={estado.texto}
          onChange={(event) => estado.setTexto(event.target.value)}
          inputMode="decimal"
          placeholder="0"
          autoComplete="off"
          aria-label={etiqueta}
          className="h-12 min-w-0 flex-1 rounded-[14px] border border-text/15 bg-white px-3.5 text-[15px] text-text outline-none focus:border-text/50"
        />
        <select
          value={estado.moneda}
          onChange={(event) => estado.setMoneda(event.target.value)}
          aria-label="Moneda"
          className="h-12 w-[132px] shrink-0 rounded-[14px] border border-text/15 bg-[#F5EFE4] px-2.5 text-[13.5px] font-semibold text-text outline-none"
        >
          {estado.opciones.map((opcion) => (
            <option key={opcion.codigo} value={opcion.codigo}>
              {opcion.etiqueta}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
