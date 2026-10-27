// Entrada que empaqueta la prueba de la 10N5 (scripts/destino/pruebaTanda10N5_*.mjs): lo puro de las cuentas, lo de cada uno y los nombres.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { aportacionesDelViaje, calcularCuentas, porPersonaDelPresupuesto, posiblesDuplicados } from '../../src/lib/cuentasGrupo'
import { entreEfectivo, idsConLoSuyo, leerLoSuyo, lineasDeMiVuelo, paraQuienDelVuelo, claveDelAlojamiento } from '../../src/lib/loSuyo'
import { nombreVisible } from '../../src/lib/nombrePersona'
import { nombreDe } from '../../src/store/useViajeCompartido'
import { nombreDeLaPersona } from '../../src/lib/reservasGrupo'
import { nombreParaMostrar } from '../../src/lib/miPerfil'
import { HojaAnadirGasto } from '../../src/components/route/presupuesto/HojaAnadirGasto'
import { useViajeCompartido } from '../../src/store/useViajeCompartido'
import { useGastosDelViaje } from '../../src/hooks/useGastosDelViaje'
import { useSyncStore } from '../../src/store/useSyncStore'
import { useGastosCompartidos } from '../../src/store/useGastosCompartidos'
import { useRouteStore } from '../../src/store/useRouteStore'
import { PantallaCuentas } from '../../src/components/route/presupuesto/PantallaCuentas'

export { createElement, renderToStaticMarkup, aportacionesDelViaje, calcularCuentas, porPersonaDelPresupuesto, posiblesDuplicados, entreEfectivo, idsConLoSuyo, leerLoSuyo, lineasDeMiVuelo, paraQuienDelVuelo, claveDelAlojamiento, nombreVisible, nombreDe, nombreDeLaPersona, nombreParaMostrar, HojaAnadirGasto, useViajeCompartido, useGastosDelViaje, useSyncStore, useGastosCompartidos, useRouteStore, PantallaCuentas }
