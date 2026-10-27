// Entrada que empaqueta la prueba de la 10N6 (K4): lo puro del presupuesto, las cuentas, lo personal y las entradas para varios.
import { construirPresupuesto } from '../../src/lib/presupuesto'
import { aportacionesDelViaje, calcularCuentas, porPersonaDelPresupuesto } from '../../src/lib/cuentasGrupo'
import { esSoloDe, reservaEsPersonal, entreDeLoDelAdmin } from '../../src/lib/loSuyo'
import { todasLasEntradas, textoLaTienen, frase, meCubre, porCuando } from '../../src/lib/entradasDelGrupo'

export { construirPresupuesto, aportacionesDelViaje, calcularCuentas, porPersonaDelPresupuesto, esSoloDe, reservaEsPersonal, entreDeLoDelAdmin, todasLasEntradas, textoLaTienen, frase, meCubre, porCuando }
