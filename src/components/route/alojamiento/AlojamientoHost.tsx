import { useEffect } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { quitarConDeshacer } from '../../../store/useAddFlowStore'
import { useAlojamientoUi } from '../../../store/useAlojamientoUi'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import { estanciasDelViaje } from '../../../lib/tuAlojamiento'
import { PantallaAlojamiento } from './PantallaAlojamiento'
import { HojaTuAlojamiento } from './HojaTuAlojamiento'
import { useAddFlowStore } from '../../../store/useAddFlowStore'
import { usePermisosDelViaje } from '../../../hooks/usePermisosDelViaje'
import { rehacerPorCambioDeVuelo } from '../../../lib/cambioDeVuelo'

/**
 * Lo que abren todos los botones de alojamiento de la app (Tanda 6z): la pantalla del mapa y la hoja «Tu alojamiento». Se monta una sola vez con la ruta; quien quiere abrirlas lo pide
 * a `useAlojamientoUi` (RESERVAS, el «Hoteles» de EXPLORAR, el primer día de cada destino…). Al guardar o eliminar, las dos se cierran.
 */
export function AlojamientoHost() {
  const route = useRouteStore((state) => state.route)
  const selections = useRouteStore((state) => state.accommodationSelections)
  const setHotel = useRouteStore((state) => state.setAccommodationHotel)
  const setZona = useRouteStore((state) => state.setAccommodationZone)
  const setCuentasEntre = useRouteStore((state) => state.setCuentasEntre)
  const setPagadoPorDe = useRouteStore((state) => state.setPagadoPorDe)
  const mapa = useAlojamientoUi((state) => state.mapa)
  const hoja = useAlojamientoUi((state) => state.hoja)
  const cerrarMapa = useAlojamientoUi((state) => state.cerrarMapa)
  const cerrarHoja = useAlojamientoUi((state) => state.cerrarHoja)
  const abrirTuAlojamiento = useAlojamientoUi((state) => state.abrirTuAlojamiento)
  const info = useDestinationExcursions(route?.destination)
  const { esAdmin, nombreAdmin } = usePermisosDelViaje()
  // Tanda 10N3 §2.7: guardar el alojamiento es solo del administrador. Quien mira (puede editar o solo recomienda) busca en el mapa y ya: no hay «mandarle la idea». Si algún botón le abre la hoja, se cierra con la línea de siempre.
  useEffect(() => {
    if (esAdmin || !hoja) return
    cerrarHoja()
    useAddFlowStore.setState({ toast: { message: `Esto lo cambia ${nombreAdmin || 'el dueño del viaje'}`, previous: null, id: Date.now() } })
  }, [esAdmin, hoja, cerrarHoja, nombreAdmin])
  if (!route || (!mapa && !hoja)) return null

  const estancias = estanciasDelViaje(route)
  const estanciaDe = (segmentDayId: string | null) => estancias.find((estancia) => estancia.segmentDayId === segmentDayId) ?? estancias[0] ?? null
  const ciudadMapa = estanciaDe(mapa?.segmentDayId ?? null)?.city ?? route.days[0]?.city ?? route.destination
  const estanciaHoja = hoja ? estanciaDe(hoja.segmentDayId) : null

  return (
    <>
      {mapa && <PantallaAlojamiento route={route} ciudad={ciudadMapa} mapa={info.mapaAlojamiento} onTengo={esAdmin ? () => abrirTuAlojamiento(mapa.segmentDayId) : undefined} onClose={cerrarMapa} />}
      {hoja && estanciaHoja && (
        <HojaTuAlojamiento
          ciudad={estanciaHoja.city}
          noches={estanciaHoja.noches}
          actual={selections[estanciaHoja.segmentDayId] ?? null}
          zonas={info.zonasAlojamiento}
          zonaActual={route.accommodationZone ?? null}
          para={route.cuentasEntre?.[`aloj-${estanciaHoja.segmentDayId}`] ?? null}
          pagado={route.pagadoPorDe?.[`aloj-${estanciaHoja.segmentDayId}`] ?? null}
          textoGuardar="Guardar el alojamiento"
          onGuardar={(hotelPuesto, d) => {
            const seg = estanciaHoja.segmentDayId
            // (10N10) Sin nombre pero con precio: el alojamiento lleva el nombre de la zona, para no perder el precio.
            const nombreDeZona = info.zonasAlojamiento.find((z) => z.id === d.zona)?.nombre
            const hotel = hotelPuesto ?? (d.precio && nombreDeZona ? { name: nombreDeZona, precio: d.precio } : null)
            setHotel(seg, hotel)
            if (d.zona !== (route.accommodationZone ?? null) && d.zona) {
              setZona(d.zona)
              void rehacerPorCambioDeVuelo({ que: 'zona', mitad: null })
            }
            if (!d.solo) {
              const lista = d.para.length === d.todos.length ? null : d.para
              setCuentasEntre(`aloj-${seg}`, lista)
              setPagadoPorDe(`aloj-${seg}`, d.pagado)
            }
            cerrarHoja()
            cerrarMapa()
          }}
          onEliminar={() => {
            if (!esAdmin) {
              cerrarHoja()
              return
            }
            quitarConDeshacer('Alojamiento quitado del viaje', () => setHotel(estanciaHoja.segmentDayId, null))
            cerrarHoja()
          }}
          onClose={cerrarHoja}
        />
      )}
    </>
  )
}
