// Entrada que empaqueta la prueba del presupuesto compartido de la 10N (scripts/destino/pruebaTanda10N_presupuesto.mjs): pinta en el servidor la pantalla, la hoja de añadir gasto y la lista de avisos, con los almacenes de verdad.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PantallaPresupuesto } from '../../src/components/route/presupuesto/PantallaPresupuesto'
import { HojaAnadirGasto } from '../../src/components/route/presupuesto/HojaAnadirGasto'
import { ListaDeAvisos } from '../../src/components/avisos/ListaDeAvisos'
import { useGastosDelViaje } from '../../src/hooks/useGastosDelViaje'
import { useRouteStore } from '../../src/store/useRouteStore'
import { usePresupuestoUi } from '../../src/store/usePresupuestoUi'
import { useGastosCompartidos } from '../../src/store/useGastosCompartidos'
import { useViajeCompartido } from '../../src/store/useViajeCompartido'
import { useSyncStore } from '../../src/store/useSyncStore'
import { construirPresupuesto, lineaCuenta } from '../../src/lib/presupuesto'
import { gastosQueVeo, sumaAlGrupo, estadoInicial, vistaDeGasto, textoDeQuienPago, nombresEnFrase } from '../../src/lib/gastosCompartidos'
import { ICONOS } from '../../src/lib/iconos'
import { formatoImporte } from '../../src/lib/dinero'

export { createElement, renderToStaticMarkup, PantallaPresupuesto, HojaAnadirGasto, ListaDeAvisos, useGastosDelViaje, useRouteStore, usePresupuestoUi, useGastosCompartidos, useViajeCompartido, useSyncStore, construirPresupuesto, lineaCuenta, gastosQueVeo, sumaAlGrupo, estadoInicial, vistaDeGasto, textoDeQuienPago, nombresEnFrase, ICONOS, formatoImporte }
