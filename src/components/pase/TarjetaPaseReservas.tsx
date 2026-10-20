import { pedirPago } from '../../lib/pago'
import { usePaseEstado } from '../../lib/paseEstado'
import { useSyncStore } from '../../store/useSyncStore'
import { TextoConPase } from '../cuenta/TextoConPase'

/**
 * P1 (cuentas parte 3, «Pase y cuenta»): en RESERVAS, al guardar el vuelo sin pase, justo DEBAJO del vuelo (no encima de la ruta): «Tu vuelo llega a las 14:20. Con el Pase de Roma, tu primer
 * día se ajusta solo.» con [Ver el pase], que abre la hoja de compra. Solo con el cobro encendido y sin el pase de ese destino; con el cobro apagado no sale nada (todo abierto).
 * `forzar` solo lo usan las capturas y la prueba.
 */
export function TarjetaPaseReservas({ hora, destino, noun = 'vuelo', forzar = false }: { hora: string; destino: string; noun?: string; forzar?: boolean }) {
  const tripId = useSyncStore((s) => s.activeTripId)
  const pase = usePaseEstado(tripId)
  if (!forzar && (!pase.cobro || pase.conPase)) return null
  return (
    <div data-reservas-p1="1" className="mt-2.5 flex flex-col gap-3 rounded-[22px] bg-[#FFFDF8] p-[16px]" style={{ border: '1px solid rgba(28,34,48,.07)' }}>
      <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgb(var(--accent-hover))' }}>Llegada</span>
      <span style={{ font: "400 22px/1.15 'Instrument Serif',serif", textWrap: 'balance' as never }}>
        <TextoConPase texto={`Tu ${noun} llega a las ${hora}. Con el Pase de ${destino}, tu primer día se ajusta solo.`} />
      </span>
      <button type="button" onClick={pedirPago} className="h-[54px] rounded-full text-[15px] font-bold text-[#17120a]" style={{ background: 'linear-gradient(110deg,#E4C58A,#F7E6BE 50%,#E4C58A)' }}>
        Ver el pase
      </button>
    </div>
  )
}
