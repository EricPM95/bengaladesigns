// Entrada de la prueba 6z6d (scripts/destino/pruebaTanda6z6d.mjs): los avisos suaves y el horario del mes, para probarlos con el código de verdad de la app.
import { cargaDatosDeHorario, datosDeHorarioEnMemoria, horarioDeParada } from '../../src/lib/horarioDeParada'
import { reservasEnCierre } from '../../src/lib/reservaEnCierre'
import { reservationOverlaps } from '../../src/lib/reservationOverlaps'
import { esDiaCompleto, minutosDelDia, MINUTOS_DEL_DIA, TEXTO_DIA_COMPLETO } from '../../src/lib/diaCompleto'

export { cargaDatosDeHorario, datosDeHorarioEnMemoria, horarioDeParada, reservasEnCierre, reservationOverlaps, esDiaCompleto, minutosDelDia, MINUTOS_DEL_DIA, TEXTO_DIA_COMPLETO }
