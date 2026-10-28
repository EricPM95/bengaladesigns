import type { Reservation } from '../../../lib/bookings'
import type { Route, Stop } from '../../../lib/types'
import { cuandoEsLaEntrada, type ModoQuitar } from '../../../lib/quitarConEntrada'
import { elSitio } from '../../../lib/articulos'
import { Hoja } from '../../ui/Hoja'

/**
 * (Tanda 10N8, 8b-a) La pregunta al quitar una parada que tiene su entrada (o el Free Tour reservado): «¿Quitamos el Panteón de tu ruta?» · «Tienes su entrada para el miércoles 11 a las 9:00.»
 * y dos botones con el estilo de la confirmación de «Eliminar día»: [Quitar parada] (la entrada se queda en RESERVAS, con «Ya no está en tu ruta») y [Quitar también la entrada] (en rojo).
 * Sin la línea «La entrada se queda en RESERVAS.» y SIN [Cancelar]: la ✕ de arriba ya cierra. Por defecto nunca se borra la entrada sin que lo elija.
 */
export function QuitarConEntradaDialog({ route, stop, reserva, onElegir, onCancelar }: { route: Route; stop: Stop; reserva: Reservation; onElegir: (modo: ModoQuitar) => void; onCancelar: () => void }) {
  const sitio = stop.isFreeTour ? 'el Free Tour' : elSitio(stop.name)
  const cuando = cuandoEsLaEntrada(route, reserva)
  const cosa = stop.isFreeTour ? 'su reserva' : 'su entrada'
  return (
    <span onClick={(event) => event.stopPropagation()} data-confirmar="entrada">
      <Hoja baja etiqueta={stop.name} titulo={`¿Quitamos ${sitio} de tu ruta?`} onCerrar={onCancelar} z={100} datos="quitar-con-entrada">
        <p style={{ margin: 0, font: "400 14.5px/1.4 'Geist'", color: 'rgba(28,34,48,.7)' }}>{cuando ? `Tienes ${cosa} para ${cuando}.` : `Tienes ${cosa}.`}</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button type="button" data-quitar-solo="1" onClick={() => onElegir('solo')} className="min-h-12 flex-1 rounded-full border border-text/15 px-3 py-2 text-[15px] font-medium leading-tight text-text transition-colors hover:bg-bg-hover">
            Quitar parada
          </button>
          <button type="button" data-quitar-tambien="1" onClick={() => onElegir('tambien')} className="min-h-12 flex-1 rounded-full bg-accent-red px-3 py-2 text-[15px] font-medium leading-tight text-white transition-transform active:scale-[.98]">
            Quitar también la entrada
          </button>
        </div>
      </Hoja>
    </span>
  )
}
