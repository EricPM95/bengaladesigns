import { useRouteStore } from '../../../store/useRouteStore'
import { useAddFlowStore } from '../../../store/useAddFlowStore'
import { useResumenVueloStore } from '../../../store/useResumenVueloStore'
import { useDatesCalendarStore } from '../../../store/useDatesCalendarStore'
import { HojaAbajo, ojoStyle } from './HojaAbajo'
import { openTicketShop } from './EntradaCard'
import { useEnlaceDelFreeTour } from './VerDisponibilidad'

/**
 * LA HOJA DEL RESUMEN de los vuelos (Tanda 7, punto 14): sube de abajo UNA vez, al acabar el rehacer que puso en marcha poner, cambiar o borrar una hora, un punto o la zona en RESERVAS, con lo que ha
 * cambiado. Las frases las escribe `construirResumen` (src/lib/resumenDeVuelo.ts) con lo que dio el motor; esta hoja solo las pinta. Termina siempre con [De acuerdo]; las frases que piden otra
 * cosa llevan su botón ([Cambiar fechas], [Ver disponibilidad]). De pago: en la gratis y en la ruta a mano no se rehace nada y no sale.
 */
export function HojaResumenVuelo() {
  const hoja = useResumenVueloStore((state) => state.hoja)
  const route = useRouteStore((state) => state.route)
  if (!hoja || !route) return null
  return <HojaResumenAbierta key={hoja.id} items={hoja.items} destination={route.destination} />
}

function HojaResumenAbierta({ items, destination }: { items: { id: string; texto: string; botones: { id: string; texto: string }[] }[]; destination: string }) {
  const cerrar = useResumenVueloStore((state) => state.cerrar)
  const pedirFechas = useDatesCalendarStore((state) => state.request)
  const enlaceFreeTour = useEnlaceDelFreeTour(destination)
  const hayDeshacer = useAddFlowStore((state) => Boolean(state.toast?.previous))

  const alPulsar = (boton: string) => {
    if (boton === 'cambiar_fechas') {
      cerrar()
      pedirFechas()
    } else if (boton === 'ver_disponibilidad') openTicketShop(enlaceFreeTour, 'Abriendo…')
  }

  return (
    <HojaAbajo titleId="resumen-vuelo-titulo" onClose={cerrar} capa={94}>
      <p className="text-accent" style={ojoStyle}>
        Tus vuelos
      </p>
      <h2 id="resumen-vuelo-titulo" className="mt-1.5 max-w-[calc(100%-2.5rem)] font-display text-[26px] leading-[1.15] text-text">
        Hemos ajustado tu ruta
      </h2>
      <div className="mt-4 flex flex-col gap-3.5" data-hoja="resumen-vuelo">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col items-start gap-2">
            <p className="text-[15px] leading-snug text-text" data-resumen={item.id.split(':')[0]}>
              {item.texto}
            </p>
            {item.botones.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {item.botones.map((boton) => (
                  <button key={boton.id} type="button" onClick={() => alPulsar(boton.id)} className="rounded-full border border-accent px-3.5 py-1.5 text-caption font-semibold text-accent transition-colors hover:bg-accent-soft">
                    {boton.texto}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={cerrar} className="mt-6 h-12 w-full rounded-full bg-text text-[15px] font-medium text-bg transition-transform active:scale-[.98]">
        De acuerdo
      </button>
      {/* (El aviso «Deshacer» de quitar el vuelo flota encima de la hoja: se le deja sitio para que no tape [De acuerdo].) */}
      {hayDeshacer && <div className="h-16" aria-hidden="true" />}
    </HojaAbajo>
  )
}
