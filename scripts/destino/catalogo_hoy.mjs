// CATALOGO · HOY: «Hoy ya no da tiempo a todo», «Hoy ya no puedes entrar», Navidad (tarjeta de temporada y avisos de fechas), la lluvia, «Guarda tus recuerdos», «Estás lejos», «Activa tu ubicación»
// y los avisos de arriba y de abajo. Por la cola (UN Chrome):
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/catalogo_hoy.mjs [seccion ...]
// Secciones: yano entrar navidad lluvia recuerdos lejos ubicacion avisos
import fs from 'node:fs'
import { abrir, anotar, clicTexto, cuerpo, foto, montarHoy, nada, R, textoDe } from './catalogo_comun.mjs'

const quiero = new Set(process.argv.slice(2))
const va = (s) => quiero.size === 0 || quiero.has(s)
const c = await abrir()
const { a, ev } = c
const seccion = async (nombre, fn) => {
  if (!va(nombre)) return
  console.log('· sección', nombre)
  try {
    await fn()
  } catch (e) {
    console.log('FALLO en', nombre, e.message)
    anotar(`hoy_${nombre}_error`, { ok: false, motivo: e.message })
  }
}
const MUSEOS = "const d0 = r.days.find((d) => !d.isReturnLeg); const i = d0.stops.findIndex((s) => /Museos Vaticanos/.test(s.name)); if (i >= 0) { const [m] = d0.stops.splice(i, 1); d0.stops.splice(1, 0, m); m.hoursData = { schedule: 'Lun-Dom 8:00-20:00', last_entry: '18:00' }; delete m.hours; delete m.scheduleText; const p0 = d0.stops[0]; p0.hoursData = { schedule: 'Lun-Dom 0:00-23:59' }; delete p0.hours; delete p0.scheduleText }"

try {
  await seccion('yano', async () => {
    await montarHoy(c, 12 * 60)
    const hoja = await a.evaluar("Boolean(document.querySelector('[data-hoy-ya-no-da-tiempo]'))")
    if (!hoja) return nada('hoy_ya_no_da_tiempo', 'a las 12:00 con el viaje de prueba la hoja no salió (¿el día ya estaba dicho?)')
    await foto(a, 'hoy_ya_no_da_tiempo', { texto: await textoDe(a, '[data-hoy-ya-no-da-tiempo]', 300) })
  })

  await seccion('entrar', async () => {
    await montarHoy(c, 18 * 60 + 20, { mut: MUSEOS })
    await clicTexto(a, '/Dejarlo como está/')
    await a.esp(1500)
    const t = await a.evaluar("document.querySelector('[data-hoy-horario-vivo-texto]')?.textContent ?? null")
    if (!t) {
      // Variante: el primer sitio ya está visto, así que los Museos son la SIGUIENTE parada
      await foto(a, 'hoy_ya_no_puedes_entrar_estado_real', { texto: await cuerpo(a, 600) })
      await montarHoy(c, 18 * 60 + 20, { mut: MUSEOS + "; const dd = r.days.find((d) => !d.isReturnLeg); dd.stops[0].checkedInAt = new Date().toISOString(); dd.stops[0].visited = true" })
      await a.esp(1500)
      const t2 = await a.evaluar("document.querySelector('[data-hoy-horario-vivo-texto]')?.textContent ?? null")
      if (t2) { await foto(a, 'hoy_ya_no_puedes_entrar_aviso', { texto: t2 }); return }
    }
    if (!t) await foto(a, 'hoy_ya_no_puedes_entrar_variante_sin_aviso', { texto: await cuerpo(a, 600) })
    if (!t) return nada('hoy_ya_no_puedes_entrar', 'el aviso de «ya no puedes entrar» no salió a las 18:20 con los Museos Vaticanos')
    await foto(a, 'hoy_ya_no_puedes_entrar_aviso', { texto: t })
    await a.evaluar("document.querySelector('[data-horario-ver-solucion]')?.click(); true")
    await a.esp(1500)
    await foto(a, 'hoy_ya_no_puedes_entrar_hoja', { texto: await a.evaluar("(document.querySelector('[role=\"dialog\"]')?.innerText ?? '').replace(/\\s+/g, ' ').slice(0, 300)") })
  })

  await seccion('navidad', async () => {
    const roma = JSON.parse(fs.readFileSync('data/pipeline_v2/roma.json', 'utf8'))
    const cfg = roma.destination_config
    const nav = cfg.nota_temporada.navidad
    const fill = (t) => String(t).replaceAll('{destino}', 'Roma')
    const ano = (cfg.fechas_especiales ?? roma.fechas_especiales).fechas.find((f) => f.id === 'ano_nuevo')
    const nota = { season: 'navidad', title: fill(nav.titulo), text: fill(nav.texto), icon: nav.icono }
    const aviso = { id: 'ano_nuevo', dayNumber: 3, dateIso: '2026-12-26', icon: ano.icono, title: ano.titulo, tag: 'festivo', texts: [ano.texto], kind: ano.tipo }
    // La tarjeta de temporada: se pone en el viaje (como la pone el motor) y se vuelve a HOY; sin «ya dicho».
    await montarHoy(c, 9 * 60, { mut: `r.seasonNote = ${JSON.stringify(nota)}; r.seasonNoteDismissed = false; r.dateNotices = ${JSON.stringify([aviso])}; delete r.dateNoticesSeenKey`, fecha: '2026-10-17' })
    await a.esp(1500)
    const hay1 = await a.evaluar("Boolean(document.querySelector('[role=\"dialog\"]'))")
    await foto(a, 'hoy_navidad_tarjeta_temporada', { texto: await cuerpo(a, 400), hoja: hay1 })
    await cerrarYSiguiente(a)
    await a.esp(1500)
    await foto(a, 'hoy_navidad_avisos_de_fechas', { texto: await cuerpo(a, 400) })
  })

  await seccion('lluvia', async () => {
    await a.evaluar("sessionStorage.setItem('trazo:lluvia-de-prueba', '1'); true")
    await montarHoy(c, 9 * 60 + 30, { fecha: '2026-10-17' })
    await a.esp(2500)
    const sel = await a.evaluar("(() => { const e = document.querySelector('[data-aviso-lluvia], [data-rain-alert], [data-hoy-lluvia]'); return e ? (e.getAttribute('data-aviso-lluvia') !== null ? 'data-aviso-lluvia' : e.getAttribute('data-rain-alert') !== null ? 'data-rain-alert' : 'data-hoy-lluvia') : null })()")
    await foto(a, 'hoy_lluvia_aviso', { selector: sel, texto: await cuerpo(a, 500) })
    // «Plan de lluvia»: el botón del aviso
    const abre = await clicTexto(a, '/Ver alternativa|Plan de lluvia/i')
    await a.esp(1800)
    if (abre) await foto(a, 'hoy_lluvia_plan', { texto: await a.evaluar("(document.querySelector('[role=\"dialog\"]')?.innerText ?? document.body.innerText).replace(/\\s+/g, ' ').slice(0, 300)") })
    await a.evaluar("sessionStorage.removeItem('trazo:lluvia-de-prueba'); true")
  })

  await seccion('lejos', async () => {
    // Madrid: a más de 50 km de todo el viaje → «fuera»
    await montarHoy(c, 10 * 60, { pos: { lat: 40.4168, lng: -3.7038 }, perm: 'granted' })
    await a.esp(2500)
    await a.evaluar("document.querySelector('[data-hoy-parada]')?.scrollIntoView({ block: 'start' }); window.scrollBy(0, 200); true")
    const t = await cuerpo(a, 700)
    await foto(a, 'hoy_estas_lejos', { texto: t, hay: /Estás lejos/.test(t) })
  })

  await seccion('ubicacion', async () => {
    await montarHoy(c, 10 * 60, { perm: 'denied' })
    const ok = await clicTexto(a, '/Usar mi ubicación/')
    await a.esp(1500)
    if (!ok) return nada('hoy_activa_tu_ubicacion', 'no apareció el botón [Usar mi ubicación] (con permiso denegado)')
    await foto(a, 'hoy_activa_tu_ubicacion', { texto: await a.evaluar("(document.querySelector('[role=\"dialog\"]')?.innerText ?? '').replace(/\\s+/g, ' ').slice(0, 300)") })
  })

  await seccion('avisos', async () => {
    // Abajo, con [Deshacer]: «Saltar parada» (aparece al llegar: [Ya he llegado])
    await montarHoy(c, 10 * 60)
    await a.evaluar("document.querySelector('[data-hoy-ya-he-llegado]')?.click(); true")
    await a.esp(1500)
    const ok = await a.evaluar("(() => { const b = document.querySelector('[data-hoy-saltar-parada]'); if (!b) return false; b.scrollIntoView({ block: 'center' }); b.click(); return true })()")
    await a.esp(1200)
    if (ok) await foto(a, 'hoy_aviso_abajo_con_deshacer', { texto: await cuerpo(a, 500) })
    else nada('hoy_aviso_abajo_con_deshacer', 'no encontré [Saltar parada] tras [Ya he llegado]')
    // Arriba, sin [Deshacer]: «Foto guardada» (el mensaje corto que se va solo a los 5 s)
    await a.evaluar("(async () => { (await import('/src/components/logros/visto/vistoStore.ts')).useVistoStore.getState().poner({ nota: 'Foto guardada' }); return true })()")
    await a.esp(800)
    const hayArriba = await a.evaluar("Boolean(document.querySelector('[data-visto=\"nota\"]'))")
    if (hayArriba) await foto(a, 'hoy_aviso_arriba_foto_guardada', { texto: 'Foto guardada' })
    else nada('hoy_aviso_arriba_foto_guardada', 'el aviso corto «Foto guardada» no salió')
  })

  await seccion('recuerdos', async () => {
    await montarHoy(c, 20 * 60, { fecha: '2026-10-25' })
    await a.esp(2500)
    const t0 = await cuerpo(a, 600)
    await foto(a, 'hoy_fin_del_viaje_resumen', { texto: t0, hay: /Lo que te llevas/.test(t0) })
    await a.evaluar("(() => { const x = document.querySelector('[role=\"dialog\"] button[aria-label*=\"errar\"], [aria-label=\"Cerrar\"]'); x?.click(); return Boolean(x) })()")
    await a.esp(1500)
    const t = await cuerpo(a, 600)
    await foto(a, 'hoy_guarda_tus_recuerdos', { texto: t, hay: /Guarda tus recuerdos/.test(t) })
  })
} finally {
  a.cerrar()
}

async function cerrarYSiguiente(a) {
  await clicTexto(a, '/^(Entendido|Siguiente|Cerrar|Vale)$/')
}
console.log('hoy hecho')
