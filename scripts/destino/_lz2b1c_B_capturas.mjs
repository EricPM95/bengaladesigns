// Capturas 390x844 del cierre LZ2b1 (agente B): la ficha de Teguise (Resumen con «Qué vas a ver») y el coche en RESERVAS (los dos modos). Un Chrome por la cola; la API con DESTINOS_OCULTOS='-'.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/_lz2b1c_B_capturas.mjs
import fs from 'node:fs'
import path from 'node:path'
const { abrirApp } = await import('./_enLaApp.mjs')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=off&apertura=0&version=completa', ancho: 390, alto: 844 })
const informe = {}
try {
  const ev = (js) => a.evaluar(js)
  const R = (js) => ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const st = () => R.useRouteStore.getState(); const route = () => st().route; ${js} })()`)
  for (let i = 0; i < 360 && !(await ev("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
  await ev("window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler' }).then(() => true)")
  await a.esp(3000)
  for (let i = 0; i < 6; i++) {
    const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  const cap = async (nombre) => a.captura(path.join(SALIDA, `lz2b1c_${nombre}.jpg`))

  // 6. La ficha de Teguise: «Qué vas a ver» en Resumen
  const teguise = await R("const r = route(); for (const d of r.days) { const s = d.stops.find((p) => /Teguise/.test(p.name)); if (s) return { dia: d.id, id: s.id, nombre: s.name } } return null")
  informe.teguise = teguise
  if (teguise) {
    await R(`st().setMode('days'); st().setActiveDayId(${JSON.stringify(teguise.dia)}); return true`)
    await a.esp(2500)
    await ev(`(() => { const e = document.querySelector('[data-stop-id="${teguise.id}"]'); e?.scrollIntoView({ block: 'center' }); const b = e?.querySelector('button, [role=button], a'); (b ?? e)?.click(); return true })()`)
    await a.esp(3500)
    informe.fichaTexto = await ev("(() => { const t = document.body.innerText; const i = t.toLowerCase().indexOf('qué vas a ver'); return i < 0 ? 'SIN «Qué vas a ver»' : t.slice(i, i + 400) })()")
    await ev("(() => { const e = Array.from(document.querySelectorAll('*')).find((x) => x.children.length === 0 && (x.textContent || '').trim().toLowerCase() === 'qué vas a ver'); e?.scrollIntoView({ block: 'center' }); return Boolean(e) })()")
    await a.esp(800)
    await cap('teguise_que_vas_a_ver_1')
    await ev("(() => { const b = document.querySelector('button[aria-label=Cerrar]'); b?.click(); return true })()")
    await a.esp(800)
  }

  // 3. RESERVAS: el coche, los dos modos
  await R("st().setMode('bookings'); return true")
  await a.esp(2500)
  await ev("document.querySelector('[data-bloque-coche]')?.scrollIntoView({ block: 'center' }); true")
  await a.esp(800)
  informe.cocheAlquiler = await ev("document.querySelector('[data-bloque-coche]')?.innerText ?? 'SIN BLOQUE'")
  await cap('coche_reservas_alquiler_1')
  await ev("document.querySelector('[data-coche-opcion=\"propio\"]')?.click(); true")
  await a.esp(3500)
  await ev("document.querySelector('[data-bloque-coche]')?.scrollIntoView({ block: 'center' }); true")
  await a.esp(600)
  informe.cochePropio = await ev("document.querySelector('[data-bloque-coche]')?.innerText ?? 'SIN BLOQUE'")
  await cap('coche_reservas_propio_1')
  await ev("document.querySelector('[data-coche-opcion=\"alquiler\"]')?.click(); true")
  await a.esp(1500)
  fs.writeFileSync(path.resolve('docs/dias/_lz2b1c_B_capturas_informe.json'), JSON.stringify(informe, null, 1))
} finally {
  await a.cerrar()
}
console.log(JSON.stringify(informe, null, 1))
