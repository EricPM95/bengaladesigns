// Ayudante de las pruebas de la Tanda 10N6 (agente K3: EXPLORAR, Cambiar parada, Tus recuerdos). Reutiliza el de la 10N5.
export { conViaje, modulo, esp, cuando, clicEn, leer, abrirPase } from './_10n5_comun.mjs'
import path from 'node:path'
import fs from 'node:fs'
import { modulo } from './_10n5_comun.mjs'
export const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
export const foto = (n) => path.join(SALIDA, `10n6_${n}.jpg`)
export const store = modulo('/src/store/useRouteStore.ts')
/** Pone la pantalla (route | days | bookings | explore | today) y el día activo (índice o null). */
export async function modo(a, m, dia = null) {
  await a.evaluar(`${store}.then((s) => { const e = s.useRouteStore.getState(); e.setActiveDayId(${dia === null ? 'null' : 'e.route.days[' + dia + '].id'}); e.setMode('${m}'); return true })`)
  await a.esp(2500)
  for (let i = 0; i < 6; i++) {
    const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Siguiente|Genial|Ya lo sé)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await a.esp(500)
  }
}
export function preparar() {
  const fallos = []
  let comprobaciones = 0
  const debe = (cond, regla, texto) => {
    comprobaciones++
    if (!cond) fallos.push({ regla, texto })
  }
  const fin = (titulo) => {
    console.log(`${titulo}: ${comprobaciones} comprobaciones, ${fallos.length} fallos`)
    for (const f of fallos) console.log(`  MAL [${f.regla}] ${f.texto}`)
    process.exit(fallos.length ? 1 : 0)
  }
  return { debe, fin }
}
