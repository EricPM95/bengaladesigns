// La prueba de la Tanda 10N9 (arreglos cortos de lo que quedó de la 10N8): junta las partes y suma sus resultados.
//   · _cuentas: lo «Solo para mí» del administrador apartado solo en la cuenta conjunta (migración 0064) y el cambio de modo que lo devuelve.
//   · _vuelo:   «Guardar el vuelo» del administrador (un solo aviso) y la hoja del vuelo como Design.
//   · _pantallas: Mis viajes con chips, película sin textos pisados en 390x664 y 375x667, Abierto 24 h (Trevi sí, Teatro de Marcelo no).
// No toca el motor de rutas.
import { spawnSync } from 'node:child_process'

const patron = /(\d+)\s+comprobaciones\s*[·,]\s*(\d+)\s+fallos/
const partes = ['pruebaTanda10N9_cuentas.mjs', 'pruebaTanda10N9_vuelo.mjs', 'pruebaTanda10N9_pantallas.mjs']
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
console.log(`\nPrueba de la Tanda 10N9: ${comprobaciones} comprobaciones · ${fallos} fallos`)
process.exit(fallos ? 1 : 0)
