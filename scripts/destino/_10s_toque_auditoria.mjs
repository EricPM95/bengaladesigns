// Auditoría en tiempo de ejecución de las zonas de toque (Tanda 10S) + capturas antes/después de Ajustes y de la cama (lo visible no cambia).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/_10s_toque_auditoria.mjs
import fs from 'node:fs'
import path from 'node:path'
import { conViaje, esp, modulo, cuando } from './_10n5_comun.mjs'
import { medirZonaToque, auditoriaToque } from './_zonaToque.mjs'

const SALIDA = path.resolve('docs/dias/capturas_jutrip')
const store = modulo('/src/store/useRouteStore.ts')
const poner = (a, js) => a.evaluar(`${store}.then((s) => { const e = s.useRouteStore.getState(); ${js}; return true })`)
const todos = []
const mirar = async (a, pantalla) => {
  const l = await a.evaluar(auditoriaToque())
  for (const x of l) todos.push({ pantalla, ...x })
  console.log(`   ${pantalla}: ${l.length} por debajo de 44`)
}
const igual = (a, b) => fs.existsSync(a) && fs.existsSync(b) && fs.readFileSync(a).equals(fs.readFileSync(b))

const a = await conViaje({ ancho: 390, alto: 844, version: 'pago', ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
try {
  for (const modo of ['route', 'days', 'explore', 'bookings']) {
    await poner(a, `e.setMode(${JSON.stringify(modo)})`)
    await esp(2500)
    await mirar(a, modo)
  }
  // HOY durante el viaje, con la cama.
  await poner(a, `const n = e.route.days.length; const d = (k) => { const f = new Date('2026-12-01T12:00:00Z'); f.setUTCDate(f.getUTCDate() + k); return f.toISOString().slice(0, 10) }; e.setRouteDateRange({ start: '2026-12-01', end: d(n - 1) }); e.setDevSimulatedTodayIso(d(1)); e.setMode('today')`)
  await esp(3000)
  await mirar(a, 'hoy')
  const cama = await a.evaluar(medirZonaToque('[data-boton-cama-hoy]'))
  console.log('   cama:', JSON.stringify(cama))
  if (cama) {
    const f1 = path.join(SALIDA, '10s_toque_cama_antes.jpg'), f2 = path.join(SALIDA, '10s_toque_cama_despues.jpg')
    await a.evaluar("document.querySelector('[data-boton-cama-hoy]').classList.remove('zona-toque'); true")
    await esp(300)
    await a.captura(f1)
    await a.evaluar("document.querySelector('[data-boton-cama-hoy]').classList.add('zona-toque'); true")
    await esp(300)
    await a.captura(f2)
    console.log('   cama: antes y después idénticas byte a byte:', igual(f1, f2))
  }
  // Perfil y Ajustes.
  await poner(a, "e.setMode('route')")
  await a.evaluar(`${modulo('/src/store/usePerfilUi.ts')}.then((m) => { m.usePerfilUi.getState().abrir(); return true })`)
  await cuando(a, "Boolean(document.querySelector('[data-ajustes]'))", 60)
  await esp(1500)
  await mirar(a, 'perfil')
  const aj = await a.evaluar(medirZonaToque('[data-ajustes]'))
  console.log('   ajustes:', JSON.stringify(aj))
  const g1 = path.join(SALIDA, '10s_toque_ajustes_antes.jpg'), g2 = path.join(SALIDA, '10s_toque_ajustes_despues.jpg')
  await a.evaluar("document.querySelector('[data-ajustes]').classList.remove('zona-toque'); true")
  await esp(300)
  await a.captura(g1)
  await a.evaluar("document.querySelector('[data-ajustes]').classList.add('zona-toque'); true")
  await esp(300)
  await a.captura(g2)
  console.log('   ajustes: antes y después idénticas byte a byte:', igual(g1, g2))
  await a.evaluar("document.querySelector('[data-ajustes]').click(); true")
  await esp(1800)
  await mirar(a, 'ajustes')
} finally {
  a.cerrar()
}
const resumen = {}
for (const x of todos) {
  const k = `${x.tag} «${x.t}» ${x.d} ${x.w}x${x.h} (visible ${x.vw}x${x.vh})`
  ;(resumen[k] ??= []).push(x.pantalla)
}
console.log('\nPOR DEBAJO DE 44 (zona de toque contando el ::after):')
for (const [k, v] of Object.entries(resumen)) console.log(' -', k, '·', [...new Set(v)].join(', '))
fs.writeFileSync('docs/dias/_10s_toque_auditoria.json', JSON.stringify(todos, null, 1))
