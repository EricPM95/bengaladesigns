// La prueba del agente B de la Tanda 10N12 (apartados 2 y 3): la lista del pase SIN precios y con [Elegir mi pase] FIJO abajo, y HOY sin pase completo.
//   · la lista: ningún precio, un solo [Elegir mi pase] fijo y sin precio, a la vista arriba, en medio y al final, sin tapar el último punto, sobre la barra del iPhone; con pase, sin botón;
//   · «¿Cuántos sois?» (al tocar [Elegir mi pase]) con sus precios;
//   · HOY sin pase: sin ✕, con «Pon tus fechas» (sin fechas), la cuenta atrás (antes), «Tu viaje ha terminado» (después) y los avisos del día de prueba.
// Hace falta el servidor y Vite (siempre por la cola):
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10N12_b.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const BASE = process.env.APP_URL || 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const leer = (f) => fs.readFileSync(f, 'utf8')
const foto = (n) => path.join(SALIDA, `10n12_${n}.jpg`)

/* ───────────────────────── 1. El código ───────────────────────── */
{
  const lista = leer('src/components/pase/ListaDelPase.tsx').replace(/^\s*(\/\/|\*|\/\*).*$/gm, '')
  debe(!/precio_total|precio_por_persona|precio_tachado/.test(lista.slice(0, lista.indexOf('data-hoja-cuantos-sois'))), 'codigo', 'la lista no pinta precios fuera de «¿Cuántos sois?»')
  debe((lista.match(/data-elegir-pase=/g) ?? []).length === 1, 'codigo', 'un solo [Elegir mi pase] en el código')
  debe(/data-elegir-pase-fijo[\s\S]{0,400}safe-area-inset-bottom/.test(lista), 'codigo', 'el botón fijo respeta la barra de abajo del iPhone (safe-area-inset-bottom)')
  const hoy = leer('src/components/route/hoy/HoySinPase.tsx')
  debe(!/data-hoy-sin-pase-cerrar/.test(hoy), 'codigo', 'HOY sin pase ya no lleva la ✕')
  const todo = ['src/components/pase/ListaDelPase.tsx', 'src/components/route/hoy/HoySinPase.tsx', 'src/lib/nombrePase.ts', 'src/lib/diaDePrueba.ts'].map(leer).join('\n')
  debe(!/Pase de (Roma|\{|\$)/.test(todo.replace(/^\s*(\/\/|\*|\/\*).*$/gm, '')), 'nombre', 'ningún «Pase de Roma» en lo de la lista y HOY sin pase')
}

/* ───────────────────────── 2. La app ───────────────────────── */
async function cerrarAvisos(a) {
  for (let i = 0; i < 4; i++) {
    const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Siguiente|Genial|Ya lo sé)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await a.esp(600)
  }
}
const texto = (a, sel) => a.evaluar(`(document.querySelector(${JSON.stringify(sel)})?.innerText ?? '').replace(/\\s+/g, ' ')`)
const store = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState())"

async function conViaje(pase, ancho = 390, alto = 844, ruta = '/?cuentas=off&logros=on&logrosDemo=1&version=gratis&apertura=0') {
  const antes = `try{localStorage.setItem('trazo:moneda-pase','EUR')}catch(x){}; window.__pruebaDelPase = ${JSON.stringify(pase)}`
  const a = await abrirApp(BASE, { ruta, antes, ancho, alto })
  for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 60 && !(await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
  await a.esp(3500)
  await cerrarAvisos(a)
  return a
}
const abrirLista = async (a) => {
  await a.evaluar("window.dispatchEvent(new CustomEvent('trazo:pagar')); true")
  for (let i = 0; i < 30 && !(await a.evaluar("Boolean(document.querySelector('[data-lista-del-pase] [data-lista-pase]')) && /Todo lo que incluye/.test(document.querySelector('[data-lista-del-pase]').innerText)")); i++) await a.esp(500)
  await a.esp(600)
}
const SIN = { cobro: true, conPase: false, puede: true, pruebaGastada: false }

// 2a. La lista sin pase, a dos tamaños.
for (const [w, h] of [[390, 844], [375, 667]]) {
  const a = await conViaje(SIN, w, h)
  try {
    await abrirLista(a)
    const t = await texto(a, '[data-lista-del-pase]')
    debe(!/€|\$|£/.test(t), 'precios', `${w}x${h}: en la lista no sale ningún precio`)
    debe(!/1 persona|Pase Dúo|Pase Grupo|cada uno/.test(t), 'precios', `${w}x${h}: ni «1 persona», ni Pase Dúo, ni Pase Grupo en la lista`)
    debe(/Todo lo que incluye tu Pase Roma/.test(t) && /Se paga una vez · No caduca/.test(t), 'lista', `${w}x${h}: la cabecera de Design se queda`)
    debe((await a.evaluar("document.querySelectorAll('[data-lista-punto]').length")) === 19, 'lista', `${w}x${h}: los 19 puntos`)
    debe((await a.evaluar("document.querySelectorAll('[data-elegir-pase]').length")) === 1, 'boton', `${w}x${h}: un solo [Elegir mi pase]`)
    const medir = () =>
      a.evaluar(`(() => {
        const l = document.querySelector('[data-lista-pase]')
        const b = document.querySelector('[data-elegir-pase]').getBoundingClientRect()
        const pts = Array.from(document.querySelectorAll('[data-lista-punto]'))
        const u = pts[pts.length - 1].getBoundingClientRect()
        const f = document.querySelector('[data-elegir-pase-fijo]')
        return { top: l.scrollTop, max: l.scrollHeight - l.clientHeight, bt: b.top, bb: b.bottom, bl: b.left, br: b.right, vh: innerHeight, vw: innerWidth, ub: u.bottom, txt: document.querySelector('[data-elegir-pase]').innerText.trim(), pos: f ? getComputedStyle(f).position : null }
      })()`)
    for (const [etq, frac] of [['arriba', 0], ['en medio', 0.5], ['al final', 1]]) {
      await a.evaluar(`(() => { const l = document.querySelector('[data-lista-pase]'); l.scrollTop = ${frac} * (l.scrollHeight - l.clientHeight); return true })()`)
      await a.esp(250)
      const m = await medir()
      debe(m.pos === 'absolute' || m.pos === 'fixed', 'boton', `${w}x${h}: el botón es fijo (${m.pos})`)
      debe(m.bb <= m.vh - 8 && m.bt >= 0 && m.bl >= 0 && m.br <= m.vw, 'boton', `${w}x${h}: [Elegir mi pase] entero a la vista ${etq} (${Math.round(m.bt)}-${Math.round(m.bb)} de ${m.vh})`)
      debe(m.txt === 'Elegir mi pase', 'boton', `${w}x${h}: el botón dice solo «Elegir mi pase», sin precio (${m.txt})`)
      if (frac === 1) {
        debe(m.top > 0 && m.top >= m.max - 2, 'boton', `${w}x${h}: la lista llega hasta el final`)
        debe(m.ub <= m.bt - 4, 'boton', `${w}x${h}: el botón no tapa el último punto (acaba en ${Math.round(m.ub)}, el botón empieza en ${Math.round(m.bt)})`)
      }
      if (w === 390) await a.captura(foto(`lista_${frac === 0 ? '1_arriba' : frac === 1 ? '3_final' : '2_medio'}`))
      else if (frac === 1) await a.captura(foto('lista_375_final'))
    }
    // ¿Cuántos sois? con sus precios.
    await a.evaluar("document.querySelector('[data-elegir-pase]').click(); true")
    await a.esp(800)
    const hh = await texto(a, '[data-hoja-cuantos-sois]')
    debe(/¿Cuántos sois\?/.test(hh) && /Pase de 1 persona/.test(hh) && /Pase Dúo/.test(hh) && /Pase Grupo/.test(hh) && /€/.test(hh), 'cuantos', `${w}x${h}: «¿Cuántos sois?» con sus tres filas y sus precios`)
    debe(/Comprar · [\d,]+ €/.test(hh), 'cuantos', `${w}x${h}: [Comprar] con su precio (${hh.match(/Comprar · [\d,]+ €/)?.[0]})`)
    debe(await a.evaluar("Boolean(document.querySelector('[data-comprar]'))"), 'cuantos', `${w}x${h}: [Comprar]`)
    if (w === 390) await a.captura(foto('lista_4_cuantos'))
  } finally {
    a.cerrar()
  }
}

// 2b. La lista con pase: sin botón.
{
  const a = await conViaje({ cobro: false, conPase: true, puede: true, pruebaGastada: false })
  try {
    await abrirLista(a)
    const t = await texto(a, '[data-lista-del-pase]')
    debe(/✓ Tu Pase Roma está activo/.test(t) && !/Pase de Roma/.test(t), 'con', 'con pase: «✓ Tu Pase Roma está activo»')
    debe(!/Elegir mi pase/.test(t) && !/€/.test(t), 'con', 'con pase: sin [Elegir mi pase] y sin precios')
    debe((await a.evaluar("document.querySelectorAll('[data-elegir-pase], [data-elegir-pase-fijo]').length")) === 0, 'con', 'con pase: ni rastro del botón fijo')
    await a.evaluar("(() => { const l = document.querySelector('[data-lista-pase]'); l.scrollTop = l.scrollHeight; return true })()")
    await a.esp(300)
    await a.captura(foto('lista_5_con_pase'))
  } finally {
    a.cerrar()
  }
}

// 2c. HOY sin pase: sin ✕ y lo de antes de la 10N11 arriba.
const NADA = { estado: 'pendiente', fecha: '2099-01-02', tripId: null }
const leerHoy = (a) => a.evaluar("(() => { const e = document.querySelector('[data-hoy-sin-pase]'); const ar = document.querySelector('[data-hoy-arriba]'); return e ? { t: e.innerText.replace(/\\s+/g, ' '), arriba: ar ? ar.getAttribute('data-hoy-arriba') : null, arribaT: ar ? ar.innerText.replace(/\\s+/g, ' ') : '', cerrar: Boolean(document.querySelector('[data-hoy-sin-pase-cerrar]')) || Boolean(e.querySelector('button[aria-label=\"Cerrar\"]')), faltan: document.querySelector('[data-hoy-faltan]')?.getAttribute('data-hoy-faltan') ?? null, aviso: document.querySelector('[data-hoy-aviso-prueba]')?.getAttribute('data-hoy-aviso-prueba') ?? null, avisoT: document.querySelector('[data-hoy-aviso-prueba]')?.innerText.replace(/\\s+/g, ' ') ?? '', y: ar ? ar.getBoundingClientRect().top : null, yh: document.querySelector('[data-hoy-sin-pase] [data-hoy-sin-pase-punto]')?.getBoundingClientRect().top ?? null, titulo: Array.from(e.querySelectorAll('span')).find((x) => /tu guía del día/.test(x.textContent) && x.children.length > 0)?.getBoundingClientRect().top ?? null } : null })()")
{
  const a = await conViaje({ ...SIN, puede: false, prueba: NADA }, 390, 844)
  try {
    const poner = async (iso, prueba) => {
      await a.evaluar(`window.__pruebaDelPase = ${JSON.stringify({ ...SIN, puede: false, pruebaGastada: prueba?.estado === 'gastada', prueba: prueba ?? NADA })}; true`)
      await a.evaluar(`${store}.then((s) => { s.setDevSimulatedTodayIso(${JSON.stringify(iso)}); s.setMode('today'); return true })`)
      await a.esp(2200)
      await cerrarAvisos(a)
      return leerHoy(a)
    }
    // Antes del viaje (el viaje de pruebas empieza el 2026-10-17): la cuenta atrás.
    let r = await poner('2026-10-10', NADA)
    debe(r !== null && !r.cerrar, 'hoy', 'HOY sin pase: sin ✕ arriba')
    debe(r?.arriba === 'cuenta_atras' && r.faltan === '7' && /dentro de/.test(r.arribaT), 'hoy', `antes del viaje: la cuenta atrás (faltan ${r?.faltan}; ${r?.arriba})`)
    debe(r !== null && r.y < (r.titulo ?? 1e9), 'hoy', 'la cuenta atrás va ARRIBA de «HOY, tu guía del día»')
    debe(/HOY, tu guía del día/.test(r?.t ?? '') && /Ver el Pase Roma/.test(r?.t ?? '') && /Tienes un día de prueba con HOY completo, gratis\./.test(r?.t ?? ''), 'hoy', 'y sigue lo de Design: la guía, la caja del día de prueba y [Ver el Pase Roma]')
    debe(r?.aviso === null, 'hoy', 'a más de 5 días del viaje no hay aviso de la prueba')
    await a.captura(foto('hoy_sin_pase_1_cuenta_atras'))
    // Antes del viaje, desde 5 días antes, con la prueba puesta el 18: el aviso «Te regalamos un día…».
    r = await poner('2026-10-14', { estado: 'pendiente', fecha: '2026-10-18', tripId: null })
    debe(r?.aviso === 'prueba_otro_dia' && /Te regalamos un día con HOY/.test(r.avisoT) && r.faltan === '3', 'hoy', `antes del viaje con la prueba puesta: el aviso del regalo (${r?.aviso}; faltan ${r?.faltan})`)
    // Sin fechas.
    await a.evaluar(`${store}.then((s) => { s.setRouteDateRange(undefined); return true })`)
    await a.esp(2200)
    r = await leerHoy(a)
    debe(r?.arriba === 'sin_fechas' && /Pon tus fechas/.test(r.arribaT) && !r.cerrar, 'hoy', `sin fechas: «Pon tus fechas» (${r?.arriba})`)
    debe(r !== null && r.y < (r.titulo ?? 1e9), 'hoy', '«Pon tus fechas» va ARRIBA de «HOY, tu guía del día»')
    debe(r?.aviso === null && !/Te regalamos/.test(r?.t ?? ''), 'hoy', 'sin fechas no hay aviso de la prueba (no se sabe cuándo es)')
    await a.captura(foto('hoy_sin_pase_2_sin_fechas'))
    // Pon tus fechas abre la elección de fechas (la pestaña cambia o sale la hoja).
    const abre = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('[data-hoy-pon-fechas] button')).find((x) => /Pon tus fechas/.test(x.textContent)); if (!b) return false; b.click(); return true })()")
    debe(abre, 'hoy', '[Pon tus fechas] se puede tocar')
    await a.esp(800)
    await a.evaluar(`${store}.then((s) => { s.setMode('today'); return true })`)
    // Se devuelven las fechas del viaje de pruebas.
    await a.evaluar(`${store}.then((s) => { s.setRouteDateRange({ start: '2026-10-17', end: '2026-10-20' }); return true })`)
    await a.esp(1500)
    // Mañana es el día de prueba (durante el viaje).
    r = await poner('2026-10-17', { estado: 'pendiente', fecha: '2026-10-18', tripId: null })
    debe(r?.aviso === 'manana_es_prueba' && /Mañana es tu día de prueba/.test(r.avisoT), 'hoy', `durante el viaje, mañana es el día de prueba: su aviso (${r?.aviso})`)
    debe(r?.arriba === 'durante' && !r.cerrar, 'hoy', 'durante el viaje no hay cuenta atrás y sigue sin ✕')
    await a.captura(foto('hoy_sin_pase_3_manana_prueba'))
    // ¿Qué tal ayer?
    r = await poner('2026-10-18', { estado: 'gastada', fecha: '2026-10-17', tripId: null })
    debe(r?.aviso === 'tras_prueba' && /¿Qué tal ayer con HOY\?/.test(r.avisoT), 'hoy', `al día siguiente de la prueba: «¿Qué tal ayer?» (${r?.aviso})`)
    await a.captura(foto('hoy_sin_pase_4_que_tal_ayer'))
    // Después del viaje.
    r = await poner('2026-10-25', { estado: 'gastada', fecha: '2026-10-17', tripId: null })
    debe(r?.arriba === 'terminado' && /Tu viaje ha terminado/.test(r.arribaT) && !r.cerrar, 'hoy', `después del viaje: «Tu viaje ha terminado» (${r?.arriba})`)
    debe(r !== null && r.aviso === null && r.y < (r.titulo ?? 1e9), 'hoy', 'y va arriba de «HOY, tu guía del día», sin aviso de la prueba')
    debe(!/Pase de Roma/.test(r?.t ?? ''), 'nombre', 'ningún «Pase de Roma» en HOY sin pase')
    await a.captura(foto('hoy_sin_pase_5_terminado'))
  } finally {
    a.cerrar()
  }
}

// 2d. HOY sin pase a 375x667 (captura).
{
  const a = await conViaje({ ...SIN, puede: false, prueba: NADA }, 375, 667)
  try {
    await a.evaluar(`${store}.then((s) => { s.setDevSimulatedTodayIso('2026-10-10'); s.setMode('today'); return true })`)
    await a.esp(2200)
    await cerrarAvisos(a)
    const r = await leerHoy(a)
    debe(r?.arriba === 'cuenta_atras', 'hoy', '375x667: la cuenta atrás también')
    await a.captura(foto('hoy_sin_pase_6_375'))
  } finally {
    a.cerrar()
  }
}

console.log(`${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
