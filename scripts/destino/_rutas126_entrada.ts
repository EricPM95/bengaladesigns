// Entrada que empaqueta lo que usa la app para crear un viaje y para pintar sus paradas (revisión de rutas, docs/dias/INFORME_REVISION_RUTAS.md): la misma generación
// (`runGeneration`, las mismas peticiones al servidor), el mismo paso a `Route`, el nombre que enseña DÍAS, el horario de cada parada ese día («Cerrado hoy») y el trayecto («8 min andando»).
import { runGeneration } from '../../src/lib/routeGenerationOrchestrator'
import { mapGeneratedRouteToRoute } from '../../src/lib/mapGeneratedRoute'
import { deriveLegacyExperienceIds } from '../../src/lib/experienceCategoryBank'
import { displayStopName } from '../../src/lib/format'
import { horarioDeParada, cargaDatosDeHorario, datosDeHorarioEnMemoria, normalizaNombre } from '../../src/lib/horarioDeParada'
import { formatTransitLeg } from '../../src/lib/legLabel'
import { nombreDelDia } from '../../src/lib/tituloDelDia'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { avisoPagoEntrada } from '../../shared/routeEngine/pagoEntrada.js'

export const M = { runGeneration, mapGeneratedRouteToRoute, deriveLegacyExperienceIds, displayStopName, horarioDeParada, cargaDatosDeHorario, datosDeHorarioEnMemoria, normalizaNombre, formatTransitLeg, avisoPagoEntrada, nombreDelDia, fetchDestinationExcursions }
