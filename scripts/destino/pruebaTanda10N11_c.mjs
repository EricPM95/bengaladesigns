// La prueba del agente C de la Tanda 10N11 (apartado 5): la lista del pase por puntos (`Piezas/Pase Lista` 1) y HOY sin pase (2 y 2b).
//   · la lista: sus 6 secciones y 20 puntos (10S7: +1) (los de Design), los precios de la app, [Elegir mi pase] → «¿Cuántos sois?», con pase «✓ Tu Pase de … está activo»;
//   · cada punto de la lista existe de verdad en la app (data/pase/incluye.json) y no queda código de la película;
//   · HOY sin pase: «HOY, tu guía del día», las 8 tarjetas, las dos cajas (día de prueba sin usar / ya usado) y [Ver el Pase Roma] que abre la lista.
// Hace falta el servidor y Vite (siempre por la cola):
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10N11_c.mjs
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

/* ───────────────────────── 1. El código ───────────────────────── */
{
  const lista = leer('src/components/pase/ListaDelPase.tsx')
  const host = leer('src/components/pase/ListaDelPaseHost.tsx')
  const hoy = leer('src/components/route/hoy/HoySinPase.tsx')
  debe(!fs.existsSync('src/components/pase/pelicula'), 'pelicula', 'ya no queda el código de la película (src/components/pase/pelicula)')
  debe(!/pelicula\//.test(lista) && !/DCPieza|plantillaDeLaPelicula/.test(lista), 'pelicula', 'la lista del pase no usa el motor de piezas ni la película')
  debe(/lista\/disenoLista/.test(lista) && /lista\/disenoLista/.test(hoy), 'diseno', 'la lista y HOY sin pase leen los dibujos y textos de Design (lista/disenoLista.ts)')
  debe(/lazy\(\(\) => import\('\.\/ListaDelPase'\)/.test(host), 'host', 'el anfitrión sigue cargando la lista bajo demanda')
  debe(!/6[.,]99|10[.,]99|4[.,]99|13[.,]98|5[.,]50/.test(lista.replace(/^\s*(\/\/|\*|\/\*).*$/gm, '')), 'precios', 'ningún precio escrito a mano en la lista (salen de data/pase/precios.json)')

  // Los textos son los de Design.
  const diseno = leer('docs/diseno/proyecto/Piezas/Pase Lista.dc.html')
  const gen = leer('src/components/pase/lista/disenoLista.ts')
  const titulos = [...gen.matchAll(/"titulo": "([^"]*)"/g)].map((m) => m[1]).filter((t) => !/^[IVX]+ · /.test(t))
  debe(titulos.length === 20 + 8, 'diseno', `28 títulos (20 de la lista —10S7: +1— + 8 de HOY) y hay ${titulos.length}`)
  debe(titulos.every((t) => diseno.includes(t)), 'diseno', 'todos los títulos están en la pieza de Design')
  // Cada punto de la lista existe de verdad en la app.
  const incluye = JSON.parse(leer('data/pase/incluye.json')).ventajas.map((v) => v.id)
  const respaldo = {
    'Tu ruta se adapta a tu vuelo': ['vuelos_horas'],
    // 10S7: antes → ahora → decisión de Eric (31-oct): «Los días, en el mejor orden» pasa a «Adaptamos tu viaje al mejor orden» (misma ventaja) y entra «Tu día, reorganizado en un toque» (ventaja nueva).
    'Adaptamos tu viaje al mejor orden': ['orden_dias'],
    'Tu día, reorganizado en un toque': ['reorganizar_dia'],
    'Tu ruta empieza donde duermes': ['zona_alojamiento', 'como_llegar_alojamiento'],
    'Todas tus reservas, de un vistazo': ['resumen_reservas'],
    'HOY, todos los días de tu viaje': ['hoy_siguiente_parada', 'hoy_como_llegar'],
    'Todas las historias, sin límite': ['hoy_escuchar_historia'],
    'Cerca de ti': ['hoy_cerca_banos', 'hoy_cerca_fuentes', 'hoy_cerca_comer'],
    'Los avisos del día': ['hoy_avisos_dia', 'hoy_aviso_lluvia'],
    'Tu billete, siempre a mano': ['hoy_billete'],
    'Todas las fotos que quieras': ['logros_guarda_recuerdo'],
    'Tus fotos, guardadas en la nube': ['logros_guarda_recuerdo'],
    'El resumen de cada día y de tu viaje': ['despues_resumen_dia', 'despues_resumen_viaje'],
    'Los sellos de Roma y del Vaticano': ['logros_sellos'],
    'Tu pasaporte de viajero': ['logros_viajero'],
    'Tu mapa del mundo': ['logros_viajero'],
    '11 colecciones y 12 emblemas secretos': ['logros_colecciones', 'logros_emblemas'],
    'Vuelve a Roma cuando quieras': ['despues_volver'],
    'Tu segundo viaje, a tu manera': ['despues_ruta_segundo_viaje'],
  }
  const sinRespaldo = Object.entries(respaldo).filter(([, ids]) => !ids.every((id) => incluye.includes(id)))
  debe(sinRespaldo.length === 0, 'existe', `cada punto de la lista tiene su ventaja en data/pase/incluye.json (${sinRespaldo.map(([t]) => t).join(', ') || 'todos'})`)
  const deLista = titulos.slice(0, 20)
  debe(deLista.filter((t) => t !== 'Viaja en pareja o en grupo').every((t) => t in respaldo), 'existe', 'todos los puntos de la lista (menos el de compartir) están en la tabla de comprobación de esta prueba')
}

/* ───────────────────────── 2. La app ───────────────────────── */
const precios = JSON.parse(leer('data/pase/precios.json'))
const eur = (v) => `${v.toFixed(2).replace('.', ',')} €`
const duo = precios.planes.find((p) => p.id === 'duo')
const grupo = precios.planes.find((p) => p.id === 'grupo')
const uno = precios.planes.find((p) => p.id === 'uno')

async function conViaje(pase, ruta = '/?cuentas=off&logros=on&logrosDemo=1&version=gratis&apertura=0') {
  const antes = `try{localStorage.setItem('trazo:moneda-pase','EUR')}catch(x){}; window.__pruebaDelPase = ${JSON.stringify(pase)}`
  const a = await abrirApp(BASE, { ruta, antes })
  for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 60 && !(await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
  await a.esp(3500)
  await cerrarAvisos(a)
  return a
}
async function cerrarAvisos(a) {
  for (let i = 0; i < 4; i++) {
    const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Siguiente|Genial|Ya lo sé)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await a.esp(600)
  }
}
const texto = (a, sel) => a.evaluar(`(document.querySelector(${JSON.stringify(sel)})?.innerText ?? '').replace(/\\s+/g, ' ')`)
const abrirLista = async (a) => {
  await a.evaluar("window.dispatchEvent(new CustomEvent('trazo:pagar')); true")
  for (let i = 0; i < 30 && !(await a.evaluar("Boolean(document.querySelector('[data-lista-del-pase] [data-lista-pase]')) && /Todo lo que incluye/.test(document.querySelector('[data-lista-del-pase]').innerText)")); i++) await a.esp(500)
  await a.esp(600)
}
const store = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState())"

// 2a. La lista, sin pase.
{
  const a = await conViaje({ cobro: true, conPase: false, puede: true, pruebaGastada: false })
  try {
    await abrirLista(a)
    const t = await texto(a, '[data-lista-del-pase]')
    debe(/Todo lo que incluye tu Pase Roma/.test(t) && /Se paga una vez · No caduca/.test(t), 'lista', 'cabecera de Design: «Todo lo que incluye tu Pase Roma» · «Se paga una vez · No caduca»')
    const secciones = await a.evaluar("Array.from(document.querySelectorAll('[data-lista-seccion]')).map((e) => e.getAttribute('data-lista-seccion'))")
    debe(JSON.stringify(secciones) === JSON.stringify(['I · ANTES DEL VIAJE', 'II · DURANTE EL VIAJE: HOY', 'III · TUS RECUERDOS', 'IV · TUS LOGROS', 'V · DESPUÉS DEL VIAJE', 'VI · PARA COMPARTIR']), 'lista', `las 6 secciones de Design (${secciones})`)
    const puntos = await a.evaluar("document.querySelectorAll('[data-lista-punto]').length")
    debe(puntos === 20, 'lista', `20 puntos (antes 19 → ahora 20 → decisión de Eric, 10S7, 31-oct: +«Tu día, reorganizado en un toque») (${puntos})`)
    const dibujos = await a.evaluar("Array.from(document.querySelectorAll('[data-lista-punto]')).filter((e) => e.querySelector('svg')).length")
    debe(dibujos === 20, 'lista', `cada punto con su dibujo (${dibujos})`)
    debe(t.includes('Tu ruta empieza donde duermes') && t.includes('Dinos tu zona y tu primer y último día salen desde tu alojamiento, con cómo llegar.'), 'lista', 'el texto del alojamiento es el de Design')
    debe(!/€/.test(t), 'precios', '(10N12) la lista no enseña ningún precio: solo salen en «¿Cuántos sois?»')
    debe(/Elegir mi pase/.test(t) && !/Pase Dúo · 2 personas/.test(t), 'precios', '[Elegir mi pase] fijo y sin las tarjetas de Dúo y Grupo')
    debe(!/✓ Tu Pase/.test(t), 'lista', 'sin pase no sale «✓ Tu Pase … está activo»')
    await a.captura(path.join(SALIDA, '10n11_lista_pase_1.jpg'))
    // Se mueve con el dedo: tiene scroll y [Elegir mi pase] está fijo y a la vista (10N12).
    const sc = await a.evaluar("(() => { const l = document.querySelector('[data-lista-pase]'); const o = getComputedStyle(l).overflowY; l.scrollTop = l.scrollHeight; const e = document.querySelector('[data-elegir-pase]'); const r = e.getBoundingClientRect(); return { o, sh: l.scrollHeight, ch: l.clientHeight, b: r.bottom, vh: innerHeight, l: r.left, rr: r.right, vw: innerWidth } })()")
    debe(sc.o === 'auto' && sc.sh > sc.ch, 'lista', 'la lista se mueve con el dedo')
    debe(sc.b <= sc.vh - 8 && sc.l >= 0 && sc.rr <= sc.vw, 'lista', `[Elegir mi pase] entero a la vista al final (${Math.round(sc.b)} de ${sc.vh})`)
    await a.captura(path.join(SALIDA, '10n11_lista_pase_2_final.jpg'))
    // ¿Cuántos sois?
    await a.evaluar("document.querySelector('[data-elegir-pase]').click(); true")
    await a.esp(800)
    const h = await texto(a, '[data-hoja-cuantos-sois]')
    debe(/¿Cuántos sois\?/.test(h) && /4 personas/.test(h), 'cuantos', 'abre «¿Cuántos sois?» con 4 personas')
    debe(h.includes(`Comprar · ${eur(grupo.precio_por_persona * 4)}`), 'cuantos', `con 4 personas: Comprar · ${eur(grupo.precio_por_persona * 4)} (${h.match(/Comprar · [\d,]+ €/)?.[0]})`)
    debe(/Pase de 1 persona/.test(h) && /Pase Dúo/.test(h) && /Pase Grupo/.test(h) && /Se paga una vez y no caduca/.test(h), 'cuantos', 'las tres filas y «Se paga una vez y no caduca»')
    debe(await a.evaluar("Boolean(document.querySelector('[data-comprar]')) && Boolean(document.querySelector('[data-linea-legal]'))"), 'cuantos', '[Comprar] y la línea legal')
    await a.captura(path.join(SALIDA, '10n11_lista_pase_3_cuantos.jpg'))
    // «−» hasta 1 y 2.
    await a.evaluar("Array.from(document.querySelectorAll('[data-hoja-cuantos-sois] [role=button]')).find((x) => x.getAttribute('aria-label') === 'Menos').click(); true")
    await a.evaluar("Array.from(document.querySelectorAll('[data-hoja-cuantos-sois] [role=button]')).find((x) => x.getAttribute('aria-label') === 'Menos').click(); true")
    await a.evaluar("Array.from(document.querySelectorAll('[data-hoja-cuantos-sois] [role=button]')).find((x) => x.getAttribute('aria-label') === 'Menos').click(); true")
    await a.esp(300)
    debe(/Comprar · 6,99 €/.test(await texto(a, '[data-hoja-cuantos-sois]')), 'cuantos', 'con 1 persona: Comprar · 6,99 €')
    // La moneda.
    await a.evaluar("Array.from(document.querySelectorAll('[data-hoja-cuantos-sois] span')).find((x) => x.style.borderRadius === '999px').click(); true")
    await a.esp(300)
    debe(/Moneda/.test(await texto(a, '[data-hoja-cuantos-sois]')) && (await a.evaluar("document.querySelectorAll('[data-moneda-opcion]').length")) >= 1, 'cuantos', 'el selector de moneda se abre')
    // El ✕ cierra la lista y se vuelve a donde se estaba.
    await a.evaluar("document.querySelector('[data-pelicula-cerrar]').click(); true")
    await a.esp(500)
    debe(!(await a.evaluar("Boolean(document.querySelector('[data-lista-del-pase]'))")), 'cerrar', 'el ✕ cierra la lista')
  } finally {
    a.cerrar()
  }
}

// 2b. La lista, con pase.
{
  const a = await conViaje({ cobro: false, conPase: true, puede: true, pruebaGastada: false })
  try {
    await abrirLista(a)
    const t = await texto(a, '[data-lista-del-pase]')
    debe(/✓ Tu Pase Roma está activo/.test(t), 'con', 'con pase: «✓ Tu Pase Roma está activo»')
    debe(!/Elegir mi pase/.test(t) && !/€/.test(t) && !/Se paga una vez/.test(t), 'con', 'con pase: sin [Elegir mi pase], sin precios y sin «Se paga una vez»')
    debe(!(await a.evaluar("Boolean(document.querySelector('[data-hoja-cuantos-sois]'))")), 'con', 'la hoja de compra no se abre')
    debe((await a.evaluar("document.querySelectorAll('[data-lista-punto]').length")) === 20, 'con', 'con pase siguen los 20 puntos')
    await a.evaluar("(() => { const l = document.querySelector('[data-lista-pase]'); l.scrollTop = l.scrollHeight; return true })()")
    await a.esp(300)
    await a.captura(path.join(SALIDA, '10n11_lista_pase_4_con_pase.jpg'))
  } finally {
    a.cerrar()
  }
}

// 2c. HOY sin pase, con sus dos cajas.
{
  const sinUsar = { estado: 'pendiente', fecha: '2099-01-02', tripId: null }
  const a = await conViaje({ cobro: true, conPase: false, puede: false, pruebaGastada: false, prueba: sinUsar })
  try {
    await a.evaluar(`${store}.then((s) => { s.setDevSimulatedTodayIso('2000-01-01'); s.setMode('today'); return true })`)
    await a.esp(2500)
    await cerrarAvisos(a)
    const leer = () => a.evaluar("(() => { const e = document.querySelector('[data-hoy-sin-pase]'); return e ? { t: e.innerText.replace(/\\s+/g, ' '), caja: document.querySelector('[data-hoy-caja-prueba]')?.getAttribute('data-hoy-caja-prueba') ?? null, puntos: document.querySelectorAll('[data-hoy-sin-pase-punto]').length, dibujos: document.querySelectorAll('[data-hoy-sin-pase-punto] svg').length } : null })()")
    let r = await leer()
    debe(r !== null, 'hoy', 'sin pase, la pestaña HOY enseña la pantalla de Design')
    if (r) {
      debe(/HOY, tu guía del día/.test(r.t) && /Cuando estés en Roma, HOY te lleva de la mano, parada a parada\./.test(r.t), 'hoy', '«HOY, tu guía del día» y su línea')
      debe(r.puntos === 8 && r.dibujos === 8, 'hoy', `8 tarjetas con su dibujo (${r.puntos}/${r.dibujos})`)
      for (const x of ['Tu siguiente parada, en grande', 'Escucha la historia de cada sitio', 'Sobre este lugar', 'Cerca de ti', 'Más visitas, si te sobra tiempo', 'Los avisos del día', 'Tu billete, el día que toca', 'Tus logros, mientras viajas']) debe(r.t.includes(x), 'hoy', `tarjeta «${x}»`)
      debe(r.caja === 'sin_usar' && r.t.includes('Tienes un día de prueba con HOY completo, gratis.') && r.t.includes('Lo usamos el día que llegas, si es antes de las 10:00; si no, el día siguiente.'), 'hoy', 'día de prueba sin usar: su caja')
      debe(!r.t.includes('Ya has usado tu día de prueba.') && r.t.includes('Ver el Pase Roma'), 'hoy', 'sin la caja de «ya usado» y con [Ver el Pase Roma]')
    }
    await a.captura(path.join(SALIDA, '10n11_hoy_sin_pase_1_sin_usar.jpg'))
    // [Ver el Pase Roma] abre la lista.
    await a.evaluar("document.querySelector('[data-hoy-ver-pase]').click(); true")
    for (let i = 0; i < 30 && !(await a.evaluar("Boolean(document.querySelector('[data-lista-del-pase] [data-lista-pase]'))")); i++) await a.esp(500)
    debe(await a.evaluar("Boolean(document.querySelector('[data-lista-del-pase] [data-lista-pase]')) && /Elegir mi pase/.test(document.querySelector('[data-lista-del-pase]').innerText)"), 'hoy', '[Ver el Pase Roma] abre la lista del pase')
    await a.evaluar("document.querySelector('[data-pelicula-cerrar]').click(); true")
    await a.esp(500)
    // Ya usado.
    await a.evaluar(`window.__pruebaDelPase = ${JSON.stringify({ cobro: true, conPase: false, puede: false, pruebaGastada: true, prueba: { estado: 'gastada', fecha: '2026-06-02', tripId: 'otro-viaje' } })}; true`)
    await a.evaluar(`${store}.then((s) => { s.setDevSimulatedTodayIso('2000-01-02'); return true })`)
    await a.esp(1800)
    r = await leer()
    debe(r !== null && r.caja === 'usada' && r.t.includes('Ya has usado tu día de prueba.') && r.t.includes('Con el Pase Roma, tienes HOY todos los días de tu viaje.'), 'hoy', 'día de prueba ya usado: su caja')
    debe(r !== null && !r.t.includes('Tienes un día de prueba con HOY completo') && r.t.includes('Ver el Pase Roma'), 'hoy', 'sin la caja de «sin usar» y con [Ver el Pase Roma]')
    await a.captura(path.join(SALIDA, '10n11_hoy_sin_pase_2_usado.jpg'))
  } finally {
    a.cerrar()
  }
}

// 2d. Con pase, HOY no enseña la pantalla de sin pase.
{
  const a = await conViaje({ cobro: false, conPase: true, puede: true, pruebaGastada: false }, '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0')
  try {
    await a.evaluar(`${store}.then((s) => { s.setDevSimulatedTodayIso('2000-01-01'); s.setMode('today'); return true })`)
    await a.esp(2500)
    debe(!(await a.evaluar("Boolean(document.querySelector('[data-hoy-sin-pase]'))")), 'hoy', 'con pase, HOY no enseña la pantalla de sin pase')
  } finally {
    a.cerrar()
  }
}

console.log(`${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
