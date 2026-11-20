// La prueba de la Tanda V28b: el botón flotante «Cuéntanos» SOLO donde salen la cámara y el trofeo (dentro del viaje).
//   APP_URL=http://localhost:5173 node scripts/destino/pruebaV28b.mjs       (con Vite en 5173 y la API en 8787)
// Ninguna parte toca el Supabase de producción.
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const CAP = 'docs/dias/V28b_capturas'
fs.mkdirSync(CAP, { recursive: true })

console.log('1. El código: montado junto a la cámara y el trofeo, no en toda la app')
{
  const app = leer('src/App.tsx')
  const ruta = leer('src/components/route/RouteScreen.tsx')
  debe(!app.includes('<BotonCuentanos />') && app.includes('<CuentanosHost />'), 'montaje', 'App ya no monta el botón flotante (sí la hoja «¿Qué quieres contarnos?»)')
  debe(/<CamaraDeViajeGlobal \/>[\s\S]*<BotonCuentanos \/>/.test(ruta) && /<BotonFlotanteLogros \/>[\s\S]*<CamaraDeViajeGlobal \/>/.test(ruta), 'montaje', 'RouteScreen lo monta justo después de la cámara y del trofeo')
  const boton = leer('src/components/cuentanos/BotonCuentanos.tsx')
  debe(/setInterval\(medir, 400\)/.test(boton) && /clearInterval/.test(boton), 'reloj', 'el reloj de 400 ms vive dentro del botón: solo corre mientras el botón está montado (dentro del viaje) y se para al irse')
}

console.log('2. En la app (iPhone 390 px)')
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=completa', ancho: 390, alto: 844 })
const ev = (js) => a.evaluar(js)
// El botón se «ve» si existe y es lo que hay encima en su centro (no una hoja, no escondido).
const VISIBLE = `(() => { const b = document.querySelector('[data-boton-cuentanos]'); if (!b) return false; const r = b.getBoundingClientRect(); if (r.width === 0) return false; const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return Boolean(e && (e === b || b.contains(e))) })()`
try {
  for (let i = 0; i < 120 && !(await ev("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
  await a.esp(2500)
  debe(!(await ev(VISIBLE)), 'inicio', 'al abrir la app, en el inicio y sin viaje: no sale «Cuéntanos»')
  await a.captura(`${CAP}/inicio_sin_boton.jpg`)
  await ev("import('/src/store/usePerfilUi.ts').then((m) => { m.usePerfilUi.getState().abrir(); return true })")
  await a.esp(1800)
  debe(!(await ev(VISIBLE)), 'perfil', 'en el Perfil / Mis viajes (sin viaje): no sale')
  await ev("import('/src/store/usePerfilUi.ts').then((m) => { m.usePerfilUi.getState().cerrar(); return true })")
  await a.esp(600)
  debe(!(await ev("Boolean(document.querySelector('[data-boton-cuentanos]'))")), 'login', 'ni en la puerta de entrada ni en «Crear viaje» (no está ni montado)')

  for (let i = 0; i < 60 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await ev('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 60 && !(await ev("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
  await a.esp(4500)
  for (let i = 0; i < 4; i++) {
    const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  await ev("import('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.setState({ dev_simulated_today_iso: '2026-12-01' }); return true })")
  await a.esp(1500)
  for (let i = 0; i < 6; i++) {
    const h = await ev("(() => { const b = document.querySelector('[role=dialog] button[aria-label=Cerrar], [data-hoja] button[aria-label=Cerrar]'); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  const POS = `(() => { const c = document.querySelector('[data-boton-cuentanos]'); if (!c) return null; const rc = c.getBoundingClientRect(); const otros = Array.from(document.querySelectorAll('[data-flotante]')).map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && r.top < window.innerHeight); return { n: otros.length, encima: otros.length > 0 && otros.every((r) => rc.bottom <= r.top + 1), w: Math.round(rc.width) } })()`
  for (const modo of ['route', 'days', 'explore', 'bookings', 'today']) {
    await ev(`import('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.getState().setActiveDayId(null); m.useRouteStore.getState().setMode('${modo}'); return true })`)
    await a.esp(2500)
    const p = await ev(POS)
    const dentro = await ev(VISIBLE)
    if (!dentro) console.log('   DBG', modo, await ev("(() => { const b = document.querySelector('[data-boton-cuentanos]'); if (!b) return 'no montado'; const r = b.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return JSON.stringify({ r: [r.left, r.top, r.width, r.height].map(Math.round), z: getComputedStyle(b).zIndex, encima: e ? e.tagName + ' ' + (e.getAttribute('data-flotante') ?? '') + ' ' + String(e.className).slice(0, 60) : null }) })()"))
    debe(dentro, 'viaje', `${modo.toUpperCase()}: dentro del viaje sale «Cuéntanos»`)
    debe(p && p.n >= 2 && p.encima, 'viaje', `${modo.toUpperCase()}: encima de la cámara y del trofeo (${p?.n} flotantes debajo)`)
    if (modo === 'route') await a.captura(`${CAP}/ruta_con_tres_botones.jpg`)
  }
  // Fuera de las pantallas del viaje abiertas encima: el Perfil, la página del destino y el pasaporte lo tapan o lo quitan.
  await ev("import('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.getState().setMode('route'); return true })")
  await a.esp(1500)
  await ev("import('/src/store/usePerfilUi.ts').then((m) => { m.usePerfilUi.getState().abrir(); return true })")
  await a.esp(1800)
  debe(!(await ev(VISIBLE)), 'perfil', 'con el Perfil abierto (Mis viajes): no se ve')
  await ev("import('/src/store/usePerfilUi.ts').then((m) => { m.usePerfilUi.getState().cerrar(); return true })")
  await a.esp(800)
  await ev("(() => { const b = document.querySelector('[data-duracion-del-viaje]')?.closest('button'); if (b) b.click(); return !!b })()")
  for (let i = 0; i < 30 && !(await ev("Boolean(document.querySelector('[data-pagina-destino]'))")); i++) await a.esp(300)
  await a.esp(1200)
  debe(!(await ev(VISIBLE)), 'destino', 'en la página del destino: no se ve')
  await ev("(() => { const b = document.querySelector('[data-pagina-destino] button[aria-label=Cerrar]'); if (b) b.click(); return !!b })()")
  await a.esp(900)
  await ev("import('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().abrir({ t: 'pasaporte' }); return true })")
  await a.esp(2500)
  debe(!(await ev(VISIBLE)), 'pasaporte', 'en el pasaporte: no se ve')
  await ev("import('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().cerrar?.(); return true })")
  await a.esp(800)
  // «¿Algún dato mal?» sigue abriendo la hoja
  await ev("import('/src/store/useCuentanosStore.ts').then((m) => { m.abrirCuentanos({ tipo: 'dato_mal', sitio: { nombre: 'Coliseo' } }); return true })")
  await a.esp(900)
  debe((await ev("document.querySelector('[data-titulo-cuentanos]')?.innerText ?? ''")).length > 0, 'hoja', '«¿Algún dato mal?» (y «Proponer un sitio») siguen abriendo la hoja de «Cuéntanos» desde donde ya se abre')
} finally {
  a.cerrar()
}

console.log(`\nPrueba de la Tanda V28b: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
