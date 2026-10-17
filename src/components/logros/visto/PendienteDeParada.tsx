import { logrosActivos } from '../../../lib/logros'
import { useRouteStore } from '../../../store/useRouteStore'
import { textoDelPlazo } from './fechas'
import { Trazo, TRAZO } from './trazos'
import { fotoDeParada } from './VistoFlujo'
import { TEXTO_DE_FALTA, tiraDeParada } from './decidir'
import { deSitio, enSitio } from '../../../lib/articulos'
import { useVistoStore } from './vistoStore'

/**
 * V6: LA PARADA CON LO QUE LE FALTA (diseño «La parada con lo que le falta»). Una tira bajo la parada ya vista, con su botón de cámara:
 *   - «Te espera una sorpresa: sube tu foto» (oscura, con la cámara dorada) cuando guarda un Emblema Oculto;
 *   - «Haz una foto y gana tu pedazo» cuando el pedazo espera la foto;
 *   - «Guarda un recuerdo» (clara) cuando no hay nada que ganar.
 * Durante el viaje no hay cuenta atrás; pasado el último día sale «Te quedan 10 días para reclamar tu premio».
 * Sale en HOY y en DÍAS: se monta con UNA línea bajo la fila de la parada: `<PendienteDeParada dayId={day.id} stopId={stop.id} visto={Boolean(stop.checkedInAt)} />`.
 * Con los logros apagados (o sin nada que reclamar) no pinta nada.
 */
const TEXTO = TEXTO_DE_FALTA

export function PendienteDeParada({ dayId, stopId, visto }: { dayId: string; stopId: string; visto: boolean }) {
  if (!logrosActivos()) return null
  return <Tira dayId={dayId} stopId={stopId} visto={visto} />
}

function Tira({ dayId, stopId, visto }: { dayId: string; stopId: string; visto: boolean }) {
  const route = useRouteStore((s) => s.route)
  const local = useVistoStore((s) => s.pendientes[stopId])
  const servidor = useVistoStore((s) => s.servidor[stopId])
  const dia = route?.days.find((d) => d.id === dayId)
  const parada = dia?.stops.find((x) => x.id === stopId)
  const pendiente = visto ? tiraDeParada(local, servidor) : undefined
  if (!route || !dia || !parada || !pendiente) return null
  const falta = pendiente.falta
  const sorpresa = falta === 'sorpresa'
  const recuerdo = falta === 'recuerdo'
  const plazo = falta === 'recuerdo' ? null : textoDelPlazo(route)
  return (
    <div data-visto="pendiente" data-falta={falta} className="flex items-center gap-2.5 rounded-xl py-2 pl-3 pr-2" style={{ background: sorpresa ? 'linear-gradient(120deg,#2A3146,#1C2230)' : recuerdo ? '#F5EFE4' : 'oklch(0.55 0.17 5 / .07)', color: sorpresa ? '#FFFDF8' : '#1C2230' }}>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span style={{ font: "500 12.5px/1.3 'Geist'" }}>{TEXTO[falta]}</span>
        {plazo && <span style={{ font: "600 10.5px 'Geist Mono',monospace", color: sorpresa ? 'oklch(0.86 0.12 85)' : 'oklch(0.5 0.17 5)' }}>{plazo}</span>}
      </span>
      <button
        type="button"
        onClick={() => fotoDeParada({ tripId: route.id, dayId, dayNumber: dia.dayNumber, stopId, nombre: parada.name }, falta, pendiente.fotoDentro)}
        aria-label={sorpresa ? `Subir la foto ${deSitio(parada.name)}` : `Hacer una foto ${enSitio(parada.name)}`}
        className="flex h-11 w-11 flex-none items-center justify-center rounded-full border-0"
        style={{ background: sorpresa ? 'linear-gradient(110deg,#E4C58A,#F7E6BE)' : recuerdo ? '#FFFFFF' : '#1C2230', color: sorpresa ? '#2A1D10' : recuerdo ? '#1C2230' : '#FFFDF8', boxShadow: recuerdo ? 'inset 0 0 0 1px rgba(28,34,48,.12)' : undefined }}
      >
        <Trazo d={TRAZO.cam} tam={17} />
      </button>
    </div>
  )
}
