// Entrada que empaqueta la prueba de la Tanda 7, parte HOY (scripts/destino/pruebaTanda7_hoy.mjs): la llegada antes de la primera parada, la vuelta después de la última, el botón del alojamiento,
// [+ Más visitas] con su hoja, y «Cerrado este día», pintados en el servidor con el código de verdad de la app.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { HoyView } from '../../src/components/route/hoy/HoyView'
import { HojaMasVisitas, anadirMasVisita } from '../../src/components/route/hoy/masVisitas'
import { useRouteStore } from '../../src/store/useRouteStore'
import { useAddFlowStore } from '../../src/store/useAddFlowStore'
import { mapSingleGeneratedDay, planesDelMotor } from '../../src/lib/mapGeneratedRoute'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { fetchDestinationPlaces, catalogoEnMemoria } from '../../src/lib/destinationPlacesApi'
import { cargaDatosDeHorario } from '../../src/lib/horarioDeParada'
import { masVisitasDe, diaRecortado, posicionDeMenosRodeo, primerHuecoLibre, casoBase } from '../../src/lib/masVisitas'
import { esDiaDeLlegada } from '../../src/lib/tituloDelDia'
import { tituloDeLlegada, tituloDeVuelta, destinoDelPunto } from '../../src/lib/llegadaVueltaHoy'
import { buildGoogleMapsUrlToPlaceTransit } from '../../src/lib/mapsLinks'
import { BotonComoLlegarAlojamiento } from '../../src/components/route/alojamiento/BotonComoLlegarAlojamiento'

export {
  createElement, renderToStaticMarkup, HoyView, HojaMasVisitas, anadirMasVisita, useRouteStore, useAddFlowStore, mapSingleGeneratedDay, planesDelMotor, fetchArrivalInfo, fetchDestinationExcursions, fetchDestinationPlaces, catalogoEnMemoria,
  cargaDatosDeHorario, masVisitasDe, diaRecortado, posicionDeMenosRodeo, primerHuecoLibre, casoBase, esDiaDeLlegada, tituloDeLlegada, tituloDeVuelta, destinoDelPunto, buildGoogleMapsUrlToPlaceTransit, BotonComoLlegarAlojamiento,
}
