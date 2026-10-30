import { useProponerSitioStore } from '../../store/useProponerSitioStore'
import { useRouteStore } from '../../store/useRouteStore'
import { HojaProponerSitio } from './HojaProponerSitio'

/** (10S5) Pinta la hoja «Propón un sitio» cuando alguien llama a `abrirProponerSitio` (desde cualquier pantalla). Va una sola vez, en App. El destino que se manda es el del viaje que está abierto (si hay). */
export function ProponerSitioHost() {
  const abierta = useProponerSitioStore((s) => s.abierta)
  const nombre = useProponerSitioStore((s) => s.nombre)
  const origen = useProponerSitioStore((s) => s.origen)
  const cerrar = useProponerSitioStore((s) => s.cerrar)
  const destino = useRouteStore((s) => s.route?.destination ?? '')
  if (!abierta) return null
  return <HojaProponerSitio nombreInicial={nombre} destino={destino} origen={origen} onClose={cerrar} />
}
