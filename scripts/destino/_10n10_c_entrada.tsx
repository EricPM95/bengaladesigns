// Entrada que empaqueta la prueba de la 10N10 (C): la cuenta según las personas, mi parte de lo común, el reparto al céntimo y los textos de las hojas de dinero.
import { construirPresupuesto } from '../../src/lib/presupuesto'
import { aportacionesDelViaje, calcularCuentas } from '../../src/lib/cuentasGrupo'
import { cuentaDelViaje, entreSinDecir, esFamilia, nombreDeLaCuentaComun } from '../../src/lib/cuentaDelViaje'
import { partesDeUnaPersona, miParteDeLoComun, bloquesDeLoMio } from '../../src/lib/miCuenta'
import { resolverModo } from '../../src/lib/modoCuentas'
import { lineasDeDestino, textoDelBoton, preguntaParaQuien, tituloAnadirGasto } from '../../src/components/route/presupuesto/BloqueDinero'
import { preguntaDeReserva } from '../../src/components/route/presupuesto/ParaQuien'

export { construirPresupuesto, aportacionesDelViaje, calcularCuentas, cuentaDelViaje, entreSinDecir, esFamilia, nombreDeLaCuentaComun, partesDeUnaPersona, miParteDeLoComun, bloquesDeLoMio, resolverModo, lineasDeDestino, textoDelBoton, preguntaParaQuien, tituloAnadirGasto, preguntaDeReserva }
