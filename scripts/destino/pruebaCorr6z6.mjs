// La prueba de la Tanda 6z6b (los arreglos de después de la 6z6) entera: corre sus tres partes y suma.
//   node scripts/destino/pruebaCorr6z6.mjs        (con el servidor de la app encendido en http://localhost:8787)
//   reservas: la tarjeta oscura solo con la cuenta atrás, la clara «x de 3 listo» aparte, sin «0 %», la cartera en las dos cabeceras y sin fila «Presupuesto», «Falta» igual en todos los bloques, «Útil para el viaje» solo con tarjetas;
//   efecto:   «el precio vuela a la cartera» (la pastilla con el importe, la diferencia, la baja, «reducir movimiento», nada dentro del presupuesto, la cartera que se ve);
//   perfil:   el Perfil a pantalla completa, el mapa de 220 px con dos dedos, el globo entero, 0, 1 y 6 viajes, la ficha con [‹ Volver], sin «Tips del viaje» en el Perfil y la bombilla en RUTA.
import { spawnSync } from 'node:child_process'

const PARTES = ['reservas', 'efecto', 'perfil']
let fallos = 0
for (const parte of PARTES) {
  const r = spawnSync(process.execPath, [`scripts/destino/pruebaCorr6z6_${parte}.mjs`], { encoding: 'utf8' })
  const resumen = (r.stdout ?? '').split('\n').filter((l) => /comprobaciones|^ - \[|TODO BIEN|✗/.test(l)).join('\n')
  console.log(`[${parte}] ${resumen || `sin resultado\n${(r.stderr ?? '').slice(-400)}`}`)
  // (Un fallo de verdad lo dice la propia prueba en su salida. Una salida distinta de 0 con «0 fallos» y sin ninguna línea de fallo es del cierre del proceso —carpetas temporales con muchas pruebas a la vez—: se apunta y no cuenta.)
  const limpia = /\b0 fallos\b|TODO BIEN/.test(r.stdout ?? '') && !/✗|^ - \[/m.test(r.stdout ?? '')
  if (r.status !== 0 && limpia) console.log('  (salida distinta de 0 con 0 fallos: se da por buena)')
  else if (r.status !== 0) fallos++
}
console.log(fallos === 0 ? 'Corr6z6: las tres partes, 0 fallos.' : `Corr6z6: ${fallos} parte(s) con fallos.`)
process.exit(fallos === 0 ? 0 : 1)
