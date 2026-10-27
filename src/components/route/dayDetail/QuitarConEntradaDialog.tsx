import type { Reservation } from '../../../lib/bookings'
import type { Route, Stop } from '../../../lib/types'
import { cuandoEsLaEntrada, type ModoQuitar } from '../../../lib/quitarConEntrada'
import { elSitio } from '../../../lib/articulos'
import { Hoja } from '../../ui/Hoja'

/**
 * (Tanda 10N6, 1c) La pregunta al quitar una parada que tiene su entrada (o el Free Tour reservado): «¿Quitamos el Coliseo de tu ruta?» · «Tienes su entrada para el jueves 26 a las 8:00.»
 * y tres botones: [Quitar solo de la ruta] (la entrada se queda en RESERVAS), [Quitar también la entrada] (en rojo) y [Cancelar]. Por defecto nunca se borra la entrada sin que lo elija.
 */
export function QuitarConEntradaDialog({ route, stop, reserva, onElegir, onCancelar }: { route: Route; stop: Stop; reserva: Reservation; onElegir: (modo: ModoQuitar) => void; onCancelar: () => void }) {
  const sitio = stop.isFreeTour ? 'el Free Tour' : elSitio(stop.name)
  const cuando = cuandoEsLaEntrada(route, reserva)
  const cosa = stop.isFreeTour ? 'su reserva' : 'su entrada'
  return (
    <span onClick={(event) => event.stopPropagation()} data-confirmar="entrada">
      <Hoja baja etiqueta={stop.name} titulo={`¿Quitamos ${sitio} de tu ruta?`} onCerrar={onCancelar} z={100} datos="quitar-con-entrada">
        <p style={{ margin: 0, font: "400 14.5px/1.4 'Geist'", color: 'rgba(28,34,48,.7)' }}>{cuando ? `Tienes ${cosa} para ${cuando}.` : `Tienes ${cosa}.`}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          <button type="button" data-quitar-solo="1" onClick={() => onElegir('solo')} className="h-12 w-full rounded-full btn-champan text-[15px] font-medium transition-transform active:scale-[.98]">
            Quitar solo de la ruta
          </button>
          <p style={{ margin: '-2px 0 2px', textAlign: 'center', font: "400 12.5px/1.3 'Geist'", color: 'rgba(28,34,48,.55)' }}>{stop.isFreeTour ? 'La reserva se queda en RESERVAS.' : 'La entrada se queda en RESERVAS.'}</p>
          <button type="button" data-quitar-tambien="1" onClick={() => onElegir('tambien')} className="h-12 w-full rounded-full bg-accent-red text-[15px] font-medium text-white transition-transform active:scale-[.98]">
            Quitar también la entrada
          </button>
          <button type="button" data-quitar-cancelar="1" onClick={onCancelar} className="h-12 w-full rounded-full border border-text/15 text-[15px] font-medium text-text transition-colors hover:bg-bg-hover">
            Cancelar
          </button>
        </div>
      </Hoja>
    </span>
  )
}
