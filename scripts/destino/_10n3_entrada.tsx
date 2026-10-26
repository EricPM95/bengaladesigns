// Entrada que empaqueta la prueba de la 10N3 (scripts/destino/pruebaTanda10N3_cuentas.mjs).
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PantallaPresupuesto } from '../../src/components/route/presupuesto/PantallaPresupuesto'
import { PantallaCuentas } from '../../src/components/route/presupuesto/PantallaCuentas'
import { HojaAnadirGasto } from '../../src/components/route/presupuesto/HojaAnadirGasto'
import { useGastosDelViaje } from '../../src/hooks/useGastosDelViaje'
import { useRouteStore } from '../../src/store/useRouteStore'
import { usePresupuestoUi } from '../../src/store/usePresupuestoUi'
import { useGastosCompartidos } from '../../src/store/useGastosCompartidos'
import { useViajeCompartido } from '../../src/store/useViajeCompartido'
import { useSyncStore } from '../../src/store/useSyncStore'
import { aportacionesDelViaje, calcularCuentas, parteDeUnaPersona, porPersonaDelPresupuesto, posiblesDuplicados } from '../../src/lib/cuentasGrupo'
import { construirPresupuesto } from '../../src/lib/presupuesto'

export { createElement, renderToStaticMarkup, PantallaPresupuesto, PantallaCuentas, HojaAnadirGasto, useGastosDelViaje, useRouteStore, usePresupuestoUi, useGastosCompartidos, useViajeCompartido, useSyncStore, aportacionesDelViaje, calcularCuentas, parteDeUnaPersona, porPersonaDelPresupuesto, posiblesDuplicados, construirPresupuesto }
