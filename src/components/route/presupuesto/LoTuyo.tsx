import { useState } from 'react'
import { formatoImporte } from '../../../lib/dinero'
import type { AbrirLinea, LineaPresupuesto } from '../../../lib/presupuesto'
import { useGastosCompartidos } from '../../../store/useGastosCompartidos'
import { useRouteStore } from '../../../store/useRouteStore'
import { Icono } from '../../ui/Icono'

const MONO = "'Geist Mono',monospace"
const caja = { border: '1px solid rgba(28,34,48,.07)', boxShadow: '0 1px 2px rgba(28,34,48,.05),0 12px 30px -22px rgba(28,34,48,.35)' }

/**
 * «LO TUYO · SOLO LO VES TÚ» (Tanda 10N7 §1b; `Piezas/Cuentas Modo` 02b). En una cuenta conjunta, lo «Solo para mí» (un regalo, una sorpresa) va en un bloque propio, abajo, después de «Extras», con el candado:
 * solo lo ve quien lo añadió (cada uno tiene el suyo), no cuenta en lo común y no sale en ningún aviso. El bloque solo existe cuando hay algo; si no, no se pinta.
 */
export function LoTuyo({ lineas, suma, moneda, onAbrir }: { lineas: LineaPresupuesto[]; suma: { amount: number; currency: string }; moneda: string; onAbrir?: (a: AbrirLinea) => void }) {
  const quitar = useGastosCompartidos((s) => s.quitar)
  const removeGastoExtra = useRouteStore((s) => s.removeGastoExtra)
  const [error, setError] = useState<string | null>(null)
  if (lineas.length === 0) return null
  const quitarLinea = async (l: LineaPresupuesto) => {
    setError(null)
    const id = l.compartido?.gastoId
    if (id) {
      const fallo = await quitar(id)
      if (fallo) setError(fallo)
    } else if (l.abrir.tipo === 'extra') removeGastoExtra(l.abrir.id)
  }
  return (
    <div className="flex flex-none flex-col gap-2.5 rounded-[22px] bg-[#FFFDF8] p-3.5" style={caja} data-blk="lo-tuyo" data-lo-tuyo>
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px]" style={{ background: '#F3E3AE', color: '#8A6420' }}>
          <Icono nombre="candado" size={16} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span style={{ font: "400 21px/1 'Instrument Serif',serif" }}>Lo tuyo</span>
          <span data-solo-lo-ves-tu className="text-[11px] font-semibold" style={{ color: '#8A6420' }}>
            Solo lo ves tú
          </span>
        </span>
        <span data-suma-lo-tuyo style={{ font: `600 13px ${MONO}` }}>
          {formatoImporte(suma)}
        </span>
      </div>
      {lineas.map((l) => {
        const esGasto = Boolean(l.compartido?.gastoId) || (l.abrir.tipo === 'extra' && l.id.startsWith('extra-'))
        const abrible = onAbrir && !esGasto && l.abrir.tipo !== 'extra'
        const contenido = (
          <>
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-white text-text/60">
              <Icono nombre="candado" size={15} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span className="text-[13px] font-medium leading-[1.25]">{l.nombre}</span>
              <span className="flex items-center gap-1.5 text-[11px] text-text/55">
                {l.sub}
                <span data-solo-tu className="rounded-full px-2 py-[1px] text-[10.5px] font-semibold" style={{ background: '#EBDDBA', color: '#6F4E37' }}>
                  Solo tú
                </span>
              </span>
            </span>
            <span className="flex flex-none flex-col items-end gap-px">
              <span style={{ font: `600 13px ${MONO}` }}>{formatoImporte(l.precio)}</span>
              {l.precio.currency !== moneda && (
                <span className="text-text/55" style={{ font: `500 11px ${MONO}` }}>
                  {l.enMonedaViajero ? `≈ ${formatoImporte(l.enMonedaViajero)}` : `Sin cambio para ${l.precio.currency}`}
                </span>
              )}
            </span>
          </>
        )
        const clase = 'flex min-h-[48px] w-full items-center gap-2.5 rounded-[14px] bg-[#F8F3EA] py-1.5 pl-1.5 pr-2.5 text-left text-text'
        return (
          <div key={l.id} className="flex items-center gap-1" data-lo-tuyo-fila={l.nombre}>
            {abrible ? (
              <button type="button" className={clase} onClick={() => onAbrir(l.abrir)}>
                {contenido}
              </button>
            ) : (
              <div className={clase}>{contenido}</div>
            )}
            {esGasto && (
              <button type="button" aria-label={`Quitar ${l.nombre}`} onClick={() => void quitarLinea(l)} className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-text/45 hover:bg-[#EDE4D3]">
                <Icono nombre="cerrar" size={13} />
              </button>
            )}
          </div>
        )
      })}
      {error && (
        <p role="alert" className="text-[12.5px] text-accent-red">
          {error}
        </p>
      )}
    </div>
  )
}
