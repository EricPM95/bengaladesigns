// Entrada que empaqueta la prueba de la 10N2 (scripts/destino/pruebaTanda10N2.mjs): la cuenta pura, las pantallas de las cuentas y la hoja de añadir gasto, con los almacenes de verdad.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PantallaPresupuesto } from '../../src/components/route/presupuesto/PantallaPresupuesto'
import { PantallaCuentas, TarjetaCuentas } from '../../src/components/route/presupuesto/PantallaCuentas'
import { HojaAnadirGasto } from '../../src/components/route/presupuesto/HojaAnadirGasto'
import { ListaDeAvisos } from '../../src/components/avisos/ListaDeAvisos'
import { useGastosDelViaje } from '../../src/hooks/useGastosDelViaje'
import { useRouteStore } from '../../src/store/useRouteStore'
import { usePresupuestoUi } from '../../src/store/usePresupuestoUi'
import { useGastosCompartidos } from '../../src/store/useGastosCompartidos'
import { useViajeCompartido } from '../../src/store/useViajeCompartido'
import { useSyncStore } from '../../src/store/useSyncStore'
import { aCentimos, aportacionesDelViaje, cadaUno, calcularCuentas, deCentimos, pagosParaQuedarEnPaz, repartir } from '../../src/lib/cuentasGrupo'

export { createElement, renderToStaticMarkup, PantallaPresupuesto, PantallaCuentas, TarjetaCuentas, HojaAnadirGasto, ListaDeAvisos, useGastosDelViaje, useRouteStore, usePresupuestoUi, useGastosCompartidos, useViajeCompartido, useSyncStore, aCentimos, aportacionesDelViaje, cadaUno, calcularCuentas, deCentimos, pagosParaQuedarEnPaz, repartir }
