// La página para revisar la VERSIÓN GRATIS (Tanda 10G): una captura de cada pantalla sin pase —RUTA con la pastilla del pase, DÍAS con el vuelo guardado y el ajuste cerrado, HOY antes, durante y después del viaje,
// EXPLORAR con «Cerca de mí», la ficha de un sitio, RESERVAS con «Llegada y vuelta» abierto y «0 de 3 listo», Logros y el Perfil— y, al final, RUTA y RESERVAS con el pase para comparar.
// Escribe docs/dias/GRATIS_REVISION.html (con las capturas dentro, para que se abra en el móvil sin nada más) y las capturas en docs/dias/capturas_jutrip/gratis_*.jpg.
// Hace falta `npm run server` y `npm run dev`.
//   API_URL=http://localhost:8787 node scripts/destino/capturasGratis.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const SALIDA = path.resolve('docs/dias/capturas_jutrip')
const png = (n) => path.join(SALIDA, `gratis_${n}.jpg`)
fs.mkdirSync(SALIDA, { recursive: true })
const store = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState())"

async function conViaje(version) {
  const a = await abrirApp('http://localhost:5173', { ruta: `/?cuentas=off&logros=on&logrosDemo=1&version=${version}` })
  for (let i = 0; i < 120 && !(await a.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
  for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 60 && !(await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
  await a.esp(5000)
  await cerrarAvisos(a)
  return a
}
async function cerrarAvisos(a) {
  for (let i = 0; i < 4; i++) {
    const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await a.esp(700)
  }
}
const modo = async (a, m, dia = null) => {
  await a.evaluar(`${store}.then((s) => { s.setActiveDayId(${dia === null ? 'null' : 's.route.days[' + dia + '].id'}); s.setMode('${m}'); return true })`)
  await a.esp(3000)
  await cerrarAvisos(a)
}
const hoySimulado = async (a, iso) => {
  await a.evaluar(`${store}.then((s) => { s.setDevSimulatedTodayIso(${iso ? `'${iso}'` : 'null'}); return true })`)
  await a.esp(1500)
}

const hojas = []
const sacar = async (a, id, titulo, texto) => {
  await a.captura(png(id))
  hojas.push({ id, titulo, texto })
}

const g = await conViaje('gratis')
// RUTA con la pastilla del pase.
await modo(g, 'route')
await sacar(g, '01_ruta', 'RUTA', 'En la tarjeta de cada destino, la pastilla «Pase Roma» con el candado, sobre marfil. Al tocarla se abre el pase (la hoja de compra).')
// El vuelo guardado (gratis) y el ajuste cerrado.
await g.evaluar(`${store}.then((s) => { s.setArrivalFlightTime('15:40'); s.setDepartureFlightTime('18:20'); return true })`)
await modo(g, 'days', 0)
await sacar(g, '02_dias_primer_dia', 'DÍAS, el primer día', 'El vuelo está guardado (la barra de llegada con su ✓ y el billete). El día NO se ajusta: sale el candado «Con el pase, tu día se ajusta a la hora de tu vuelo», y debajo, el del alojamiento.')
await g.evaluar("(() => { const e = document.querySelector('[data-candado=\"dia-ajuste-llegada\"]'); if (e) e.scrollIntoView({ block: 'center' }); return true })()")
await g.esp(800)
await sacar(g, '03_dias_candado', 'DÍAS, el candado del ajuste', 'Más de cerca: el vuelo guardado y, debajo, el ajuste del día cerrado.')
// HOY antes, durante y después.
await modo(g, 'today')
await hoySimulado(g, '2026-10-10')
await sacar(g, '04_hoy_antes', 'HOY, antes del viaje', 'Sin pase: la cuenta atrás, lo que HOY te dará y un solo [Ver el Pase Roma] (el del panel); la tarjeta del día de prueba ya no lo repite.')
await hoySimulado(g, '2026-10-18')
await sacar(g, '05_hoy_durante', 'HOY, durante el viaje', 'Sin pase: HOY es del pase; se ve lo que tendrías y el día de prueba.')
await hoySimulado(g, '2026-10-25')
await sacar(g, '06_hoy_despues', 'HOY, después del viaje', 'Sin pase: el viaje ha terminado; lo de HOY es del pase.')
await hoySimulado(g, null)
// EXPLORAR con «Cerca de mí».
await modo(g, 'explore')
await g.esp(2500)
await sacar(g, '07_explorar', 'EXPLORAR', 'Baños y Fuentes, en gris con su candado (antes no salían). Los restaurantes y los lugares, gratis.')
// La ficha de un sitio.
await modo(g, 'days', 0)
await g.evaluar("(() => { const p = document.querySelector('[data-stop-id]'); if (!p) return false; (p.querySelector('button') || p).click(); return true })()")
await g.esp(3500)
await sacar(g, '08_ficha', 'La ficha de un sitio', 'Gratis: el resumen, «Por qué te lo recomendamos», los tips, los horarios y los cierres.')
await g.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^Cerrar$/.test((x.getAttribute('aria-label') || x.textContent || '').trim())); if (b) b.click(); return true })()")
await g.esp(800)
// RESERVAS con «Llegada y vuelta» abierto.
await modo(g, 'bookings')
await sacar(g, '09_reservas', 'RESERVAS', 'El resumen dice «0 de 3 listo» con «Llegada y vuelta» contando: guardar el vuelo, el alojamiento y las entradas es gratis.')
await g.evaluar("(() => { const b = document.querySelector('[data-blk=\"llegada\"] div'); if (b) b.click(); return true })()")
await g.esp(1500)
await g.evaluar("(() => { const e = document.querySelector('[data-blk=\"llegada\"]'); if (e) e.scrollIntoView({ block: 'start' }); return true })()")
await g.esp(800)
await sacar(g, '10_reservas_llegada', 'RESERVAS, «Llegada y vuelta» abierto', 'Abierto y gratis, para apuntar el vuelo o el tren (la hora, la referencia, la compañía). Debajo del vuelo guardado, el candado «Con el pase, ajustamos tu primer y tu último día a tu vuelo».')
await g.evaluar("(() => { const b = document.querySelector('[data-blk=\"aloj\"] div'); if (b) b.click(); return true })()")
await g.esp(1500)
await g.evaluar("(() => { const e = document.querySelector('[data-blk=\"aloj\"]'); if (e) e.scrollIntoView({ block: 'start' }); return true })()")
await g.esp(800)
await sacar(g, '11_reservas_alojamiento', 'RESERVAS, el alojamiento', 'Guardar el alojamiento es gratis; la zona («cada día empieza cerca de donde duermes») sale cerrada, con su candado.')
// Logros.
await modo(g, 'route')
await g.evaluar('window.__momentos.hoja()')
await g.esp(3500)
await sacar(g, '12_logros', 'Logros', 'La vitrina y las colecciones se ven, cerradas (en gris), con «Con el Pase Roma, cada sitio que ves suma». [Visto] no suma sin pase, salvo el día de prueba.')
await g.evaluar("import('/src/components/logros/momentos/useMomentosUI.ts').then((m) => { m.useMomentosUI.getState().cerrarHojaLogros(); return true })")
await g.esp(800)
// El Perfil.
await g.evaluar("(() => { const b = document.querySelector('[data-boton-perfil]'); if (b) b.click(); return true })()")
await g.esp(2500)
await sacar(g, '13_perfil', 'El Perfil', 'Gratis: el Perfil y «¿Dónde has estado ya?» (los países de antes).')
g.cerrar()

// Con el pase, para comparar.
const c = await conViaje('completa')
await modo(c, 'route')
await sacar(c, '14_ruta_con_pase', 'RUTA con el pase', 'Con el pase, la pastilla lleva el ✓ sobre oro.')
await modo(c, 'bookings')
await c.evaluar("(() => { const b = document.querySelector('[data-blk=\"llegada\"] div'); if (b) b.click(); return true })()")
await c.esp(1500)
await sacar(c, '15_reservas_con_pase', 'RESERVAS con el pase', 'Con el pase, todo abierto como siempre: la zona del alojamiento y el ajuste del vuelo no llevan candado.')
c.cerrar()

// La página, con las capturas dentro.
const img = (id) => `data:image/jpeg;base64,${fs.readFileSync(png(id)).toString('base64')}`
const cuerpo = hojas
  .map((h) => `<figure><img src="${img(h.id)}" alt="${h.titulo}" loading="lazy"><figcaption><strong>${h.titulo}</strong><span>${h.texto}</span></figcaption></figure>`)
  .join('\n')
fs.writeFileSync(
  'docs/dias/GRATIS_REVISION.html',
  `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>La versión gratis</title>
<style>
:root{--marfil:#FBF3E2;--tinta:#1C2230;--oro:#A67C52;--profundo:#6F4E37}
*{box-sizing:border-box}body{margin:0;background:var(--marfil);color:var(--tinta);font:15px/1.5 system-ui,sans-serif}
header{padding:20px 16px 8px;max-width:1100px;margin:0 auto}h1{font:400 30px/1.1 'Instrument Serif',Georgia,serif;margin:0 0 6px}
header p{margin:0;color:rgba(28,34,48,.7)}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px;padding:16px;max-width:1100px;margin:0 auto}
figure{margin:0;background:#fff;border:1px solid rgba(166,124,82,.25);border-radius:18px;overflow:hidden;display:flex;flex-direction:column}
figure img{display:block;width:100%;height:auto}figcaption{padding:12px 14px 16px;display:flex;flex-direction:column;gap:4px}
figcaption strong{font:600 11px/1.2 ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--profundo)}figcaption span{font-size:13.5px;color:rgba(28,34,48,.78)}
@media (max-width:560px){main{grid-template-columns:1fr;gap:16px}}
</style></head><body>
<header><h1>La versión gratis</h1><p>Quien no tiene el pase ve todo lo que el pase le daría, cerrado y con su invitación: nunca escondido. Capturas sin pase (las dos últimas, con pase, para comparar). Tanda 10G.</p></header>
<main>
${cuerpo}
</main></body></html>`,
)
console.log(`GRATIS_REVISION.html: ${hojas.length} capturas`)
