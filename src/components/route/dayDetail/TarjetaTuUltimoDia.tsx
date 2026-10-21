import { Fragment } from 'react'
import { botonOro, clasesBotonBorde } from '../hoy/piezas'
import type { TextosDelUltimoDia } from '../../../lib/ultimoDia'

/**
 * LA TARJETA DEL DÍA DE VUELTA SIN HORA (Tanda 10B; antes «Tu último día también cuenta», Tanda 7). Dentro del acordeón del día de vuelta de DÍAS, mientras el viajero no ha puesto la hora de su vuelta
 * (el día sigue sin paradas, decidido así). Los textos salen de `src/lib/ultimoDia.ts`, con el nombre del medio con el que vuelve.
 * - Sin el pase: «El último día, a la medida de tu vuelo», el texto con el Pase y el número de ventajas resaltados en oro, [Ver el Pase de Roma] y [+ Añadir mis lugares].
 * - Con el pase: «Tu último día, a la medida de tu vuelo», [+ Vuelo] (o [+ Tren]…) y [+ Añadir mis lugares].
 * Letra de tinta, legible (nada de gris claro ni cursiva pequeña); colores de Marca JUTRIP (marfil, oro).
 */
export function TarjetaTuUltimoDia({ textos, conPase, onPrincipal, onAnadirLugares }: { textos: TextosDelUltimoDia; conPase: boolean; onPrincipal: () => void; onAnadirLugares: () => void }) {
  return (
    <div data-tarjeta-ultimo-dia={conPase ? 'con-pase' : 'sin-pase'} className="mt-2 flex flex-col gap-3 rounded-2xl border border-[rgba(142,104,32,.22)] bg-[#FFFDF8] p-4 text-[#1C2230]">
      <h3 data-ultimo-dia-titulo className="font-display text-[22px] leading-[1.1]">{textos.titulo}</h3>
      <p data-ultimo-dia-texto className="text-[14.5px] leading-[1.45] text-[#1C2230]">
        {textos.partes.map((parte, i) =>
          parte.oro ? (
            <em key={i} data-pase-resaltado style={{ fontFamily: "'Instrument Serif',serif", fontStyle: 'italic', fontWeight: 400, fontSize: '1.15em', color: '#8E6820' }}>
              {parte.texto}
            </em>
          ) : (
            <Fragment key={i}>{parte.texto}</Fragment>
          ),
        )}
      </p>
      <button
        type="button"
        onClick={onPrincipal}
        data-ultimo-dia="principal"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-[14.5px] font-semibold transition-transform active:scale-[.98]"
        style={botonOro()}
      >
        {textos.botonPrincipal}
      </button>
      <button
        type="button"
        onClick={onAnadirLugares}
        data-ultimo-dia="lugares"
        className={`flex h-12 w-full items-center justify-center gap-2 rounded-full text-[14.5px] font-semibold transition-colors ${clasesBotonBorde()}`}
      >
        {textos.botonLugares}
      </button>
    </div>
  )
}
