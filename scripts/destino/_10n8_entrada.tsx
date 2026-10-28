// Entrada que empaqueta las pruebas de la 10N8 (N4): lo puro del presupuesto con «Lo tuyo», las cuentas con el cambio de cada gasto, «Lo ha puesto…» y la foto del cambio.
import { construirPresupuesto } from '../../src/lib/presupuesto'
import { aportacionesDelViaje, calcularCuentas, porPersonaDelPresupuesto } from '../../src/lib/cuentasGrupo'
import { leerLoSuyo, textoLoHaPuesto, lineasDeMiVuelo } from '../../src/lib/loSuyo'
import { fotoDelCambio, deFila } from '../../src/lib/gastosCompartidosRed'

export { construirPresupuesto, aportacionesDelViaje, calcularCuentas, porPersonaDelPresupuesto, leerLoSuyo, textoLoHaPuesto, lineasDeMiVuelo, fotoDelCambio, deFila }
