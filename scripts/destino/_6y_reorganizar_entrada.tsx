// Entrada que empaqueta la prueba de «Reorganizar» de la Tanda 6y (scripts/destino/pruebaFase6y_reorganizar.mjs): el botón, la acción del almacén y el aviso con «Deshacer».
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ReorganizarDia } from '../../src/components/route/freeDay/ReorganizarDia'
import { useRouteStore } from '../../src/store/useRouteStore'
import { useAddFlowStore } from '../../src/store/useAddFlowStore'
import { reorganizarElDia, puedeReorganizar } from '../../src/lib/reorganizarDia'

export { createElement, renderToStaticMarkup, ReorganizarDia, useRouteStore, useAddFlowStore, reorganizarElDia, puedeReorganizar }
