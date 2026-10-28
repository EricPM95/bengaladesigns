// Entrada que empaqueta la prueba de la 10N7 (M2): el presupuesto por modo de cuentas, lo «Solo para mí», las preguntas y la línea pequeña.
import { construirPresupuesto } from '../../src/lib/presupuesto'
import { aportacionesDelViaje, calcularCuentas } from '../../src/lib/cuentasGrupo'
import { esSoloDe, reservaEsPersonal, reservaEsPersonalSegunModo } from '../../src/lib/loSuyo'
import { lineaParaQuien, preguntaDeReserva } from '../../src/components/route/presupuesto/ParaQuien'
import { resolverModo } from '../../src/lib/modoCuentas'

export { construirPresupuesto, aportacionesDelViaje, calcularCuentas, esSoloDe, reservaEsPersonal, reservaEsPersonalSegunModo, lineaParaQuien, preguntaDeReserva, resolverModo }
