// Entrada que empaqueta pruebaTanda10S4_F.mjs (presupuesto y «Reorganizar este día»).
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PantallaPresupuesto } from '../../src/components/route/presupuesto/PantallaPresupuesto'
import { ReorganizarDia } from '../../src/components/route/freeDay/ReorganizarDia'
import { useRouteStore } from '../../src/store/useRouteStore'
import { usePresupuestoUi } from '../../src/store/usePresupuestoUi'
import { construirPresupuesto } from '../../src/lib/presupuesto'

export { createElement, renderToStaticMarkup, PantallaPresupuesto, ReorganizarDia, useRouteStore, usePresupuestoUi, construirPresupuesto }
