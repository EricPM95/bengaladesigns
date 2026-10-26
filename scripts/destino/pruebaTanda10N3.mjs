// La prueba de la Tanda 10N3 (Ruta: los arreglos del repaso de Eric): junta las partes y suma sus resultados.
//   API_URL=http://localhost:8787 node scripts/destino/pruebaTanda10N3.mjs
//   · _cabecera:     el logo arriba en todas las pestañas, [Empezar de cero] y «sin pase», los menús de DÍAS como hojas, «Cambiar hora» fuera, el estilo de elegir.
//   · _compartir:    la hoja de invitar (mismo código), la tarjeta de RUTA, «Personas del viaje» y los tres permisos, abrir una invitación, los cambios del dueño en directo.
//   · _propuesta:    la propuesta del invitado (lápiz, lista, detalle, aceptar y rechazar), el Free Tour del invitado, los puntitos y las rayitas según el permiso.
//   · _reservas:     RESERVAS del invitado (la misma pantalla del dueño, en gris), «¿Para quién es?», «Reservada ✓» / «Comprar entrada», los avisos.
//   · _presupuesto:  el presupuesto compartido de la 01 a la 10.
// No toca el motor de rutas: no hace falta la muestra de 60 viajes.
import { spawnSync } from 'node:child_process'

const patron = /(\d+)\s+comprobaciones\s*·\s*(\d+)\s+fallos/
const partes = ['pruebaTanda10N3_editar.mjs', 'pruebaTanda10N3_avisos.mjs', 'pruebaTanda10N3_reservas.mjs', 'pruebaTanda10N3_cuentas.mjs', 'pruebaTanda10N3_apertura.mjs', 'pruebaTanda10N3_perfil.mjs', 'pruebaTanda10N3_real.mjs']
let comprobaciones = 0
let fallos = 0
for (const f of partes) {
  const r = spawnSync(process.execPath, [`scripts/destino/${f}`], { encoding: 'utf8', env: process.env, maxBuffer: 64 * 1024 * 1024 })
  const salida = `${r.stdout}\n${r.stderr}`
  const m = patron.exec(salida)
  if (!m && /SALTA|OMITIDA/i.test(salida)) {
    console.log(`- ${f}: se salta (faltan las variables de Supabase)`)
    continue
  }
  if (!m) {
    fallos++
    console.log(`✗ ${f}: no ha dado resultado\n${salida.split('\n').slice(-8).join('\n')}`)
    continue
  }
  comprobaciones += Number(m[1])
  fallos += Number(m[2])
  console.log(`${Number(m[2]) === 0 ? '✓' : '✗'} ${f}: ${m[1]} comprobaciones, ${m[2]} fallos`)
  if (Number(m[2]) > 0) console.log(salida.split('\n').filter((l) => /✗|FALLO/.test(l)).slice(0, 12).join('\n'))
}
console.log(`\nPrueba de la Tanda 10N3: ${comprobaciones} comprobaciones · ${fallos} fallos`)
process.exit(fallos ? 1 : 0)
