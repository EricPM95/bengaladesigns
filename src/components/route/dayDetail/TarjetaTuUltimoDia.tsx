import { botonOro, clasesBotonBorde } from '../hoy/piezas'
import type { TextosDelDiaDeVuelta } from '../../../lib/diaDeVuelta'
import { CandadoDeDesign, LineaConPase } from '../../pase/Candado'

/**
 * LA TARJETA «HOY VUELVES A CASA» DEL DÍA DE VUELTA (10S11 §4, Eric 1-nov; antes «El último día, a la medida de tu vuelo» y la franja oscura «Tu día de vuelta · Con el Pase Roma…»). Con y sin pase, con la hora
 * del vuelo (tren, autobús, barco) o sin ella. Los textos salen de `src/lib/diaDeVuelta.ts`.
 * De arriba abajo: el título, el texto (hasta qué hora es suyo el día, o «Aún no sabemos…» con [Añadir tu vuelo]), la invitación con [+ Añadir lugares] y [Explorar] y la línea del pase
 * (sin pase, con su candado y tocándola se abre el pase; con pase, sin candado).
 * Conserva `data-tarjeta-ultimo-dia` (con-pase / sin-pase), el mismo gancho de siempre.
 */
export function TarjetaTuUltimoDia({ textos, conPase, destino, onAnadirVuelo, onAnadirLugares, onExplorar, onVerPase }: { textos: TextosDelDiaDeVuelta; conPase: boolean; destino: string; onAnadirVuelo: () => void; onAnadirLugares: () => void; onExplorar: () => void; onVerPase: () => void }) {
  return (
    <div data-tarjeta-ultimo-dia={conPase ? 'con-pase' : 'sin-pase'} className="mt-2 flex flex-col gap-3 rounded-2xl border border-[rgba(166,124,82,.22)] bg-[#FFFDF8] p-4 text-[#1C2230]">
      <h3 data-ultimo-dia-titulo className="font-display text-[24px] leading-[1.1]">{textos.titulo}</h3>
      <p data-ultimo-dia-texto className="text-[14.5px] leading-[1.45] text-[#1C2230]">{textos.texto}</p>
      {textos.botonAnadirVuelo && (
        <button type="button" onClick={onAnadirVuelo} data-ultimo-dia="anadir-vuelo" className="zona-toque flex h-12 w-full items-center justify-center gap-2 rounded-full text-[14.5px] font-semibold transition-transform active:scale-[.98]" style={botonOro()}>
          {textos.botonAnadirVuelo}
        </button>
      )}
      {textos.invitacion && (
        <p data-ultimo-dia-invitacion className="text-[14.5px] leading-[1.45] text-[#1C2230]">{textos.invitacion}</p>
      )}
      {textos.conLugares && (
        <div className="flex gap-2">
          <button type="button" onClick={onAnadirLugares} data-ultimo-dia="lugares" className={`zona-toque flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-[14.5px] font-semibold transition-colors ${clasesBotonBorde()}`}>
            + Añadir lugares
          </button>
          <button type="button" onClick={onExplorar} data-ultimo-dia="explorar" className={`zona-toque flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-[14.5px] font-semibold transition-colors ${clasesBotonBorde()}`}>
            Explorar
          </button>
        </div>
      )}
      {textos.lineaPase &&
        (conPase ? (
          <p data-ultimo-dia-pase="con-pase" className="text-[13px] leading-[1.4] text-[#1C2230]/70">{textos.lineaPase}</p>
        ) : (
          <button type="button" onClick={onVerPase} data-ultimo-dia-pase="sin-pase" className="flex items-start gap-2 text-left text-[13px] leading-[1.4] text-[#1C2230]/70">
            <span className="mt-[2px] flex-none"><CandadoDeDesign size={14} color="#8E6820" /></span>
            <span><LineaConPase texto={textos.lineaPase} destino={destino} sobre="claro" /></span>
          </button>
        ))}
    </div>
  )
}
