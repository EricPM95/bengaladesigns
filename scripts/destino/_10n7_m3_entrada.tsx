// Entrada que empaqueta la prueba de la 10N7 (M3): la moneda del viajero y las cuentas en monedas distintas.
import { formatearPrecio, formatearCentimosBase, hayCambioPara } from '../../src/lib/monedaFormato'
import { aportacionesSinCambio } from '../../src/lib/cuentasMoneda'
import { aportacionesDelViaje, calcularCuentas } from '../../src/lib/cuentasGrupo'

export { formatearPrecio, formatearCentimosBase, hayCambioPara, aportacionesSinCambio, aportacionesDelViaje, calcularCuentas }
