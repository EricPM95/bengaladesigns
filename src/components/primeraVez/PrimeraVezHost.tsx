import { useMemo, type ReactNode } from 'react'
import { useDestinosCurados } from '../../lib/destinosCurados'
import { destinosDelMapa, usePrimeraVezUi } from '../../lib/primeraVez'
import { empezarViajeNuevo } from '../../lib/nuevoViaje'
import { usePerfilUi } from '../../store/usePerfilUi'
import { DestinationDetailModal } from '../route/DestinationDetailModal'
import { TarjetaDeDestino } from './TarjetaDeDestino'

/** Lo de la primera vez que se pinta encima del Perfil: la tarjeta de un destino y su página sin viaje ([Ver destino]). Sin nada abierto, no pinta nada. */
export function PrimeraVezHost(): ReactNode {
  const pagina = usePrimeraVezUi((s) => s.pagina)
  const abrirPagina = usePrimeraVezUi((s) => s.abrirPagina)
  const curados = useDestinosCurados()
  const destino = useMemo(() => destinosDelMapa(curados).find((d) => d.clave === pagina) ?? null, [curados, pagina])
  const curado = (curados ?? []).find((c) => c.clave === pagina) ?? null
  return (
    <>
      <TarjetaDeDestino />
      {destino && (
        <DestinationDetailModal
          city={destino.nombre}
          days={[]}
          nightsLabel={null}
          isCamper={false}
          onClose={() => abrirPagina(null)}
          sinViaje={{
            clave: destino.clave,
            pais: destino.pais,
            linea: destino.linea,
            iso: destino.iso,
            portada: curado?.portada ?? destino.portada,
            alCrear: () => {
              abrirPagina(null)
              usePerfilUi.getState().cerrar()
              empezarViajeNuevo(curado)
            },
          }}
        />
      )}
    </>
  )
}
