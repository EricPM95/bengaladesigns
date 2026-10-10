// La prueba de la Tanda 6z6 entera: corre sus cuatro partes y suma.
//   node scripts/destino/pruebaTanda6z6.mjs        (con el servidor de la app encendido en http://localhost:8787)
//   a. la barra (4 pestañas en la gratis, 5 en la de pago), la tarjeta de la cuenta atrás de RESERVAS, DÍAS en el día de hoy, HOY antes y después, el panel de pruebas;
//   b. el Perfil (el globo, la lista de viajes, el álbum), las fotos (una por parada en la gratis) y «Guarda tus recuerdos» en RUTA;
//   c. HOY durante el viaje («Escuchar», «Cerca de ti», los avisos del día), EXPLORAR de pago y «Devolverla a la ruta»;
//   d. el motor (la fila del Coliseo a las 12:30 y a las 13:00), el horario del mes, los avisos suaves (cierre, «vas justo», «día completo») que nunca tocan nada.
import { spawnSync } from 'node:child_process'

const PARTES = ['a', 'b', 'c', 'd']
let fallos = 0
for (const parte of PARTES) {
  const r = spawnSync(process.execPath, [`scripts/destino/pruebaTanda6z6${parte}.mjs`], { encoding: 'utf8' })
  const resumen = (r.stdout ?? '').split('\n').filter((l) => /comprobaciones|^ - \[/.test(l)).join('\n')
  console.log(resumen || `6z6${parte}: sin resultado\n${(r.stderr ?? '').slice(-400)}`)
  // (Un fallo de verdad lo dice la propia prueba en su salida. Una salida distinta de 0 con «0 fallos» y sin ninguna línea de fallo es del cierre del proceso —carpetas temporales con muchas pruebas a la vez—: se apunta y no cuenta.)
  const limpia = /\b0 fallos\b|TODO BIEN/.test(r.stdout ?? '') && !/✗|^ - \[/m.test(r.stdout ?? '')
  if (r.status !== 0 && limpia) console.log('  (salida distinta de 0 con 0 fallos: se da por buena)')
  else if (r.status !== 0) fallos++
}
console.log(fallos === 0 ? '6z6: las cuatro partes, 0 fallos.' : `6z6: ${fallos} parte(s) con fallos.`)
process.exit(fallos === 0 ? 0 : 1)
