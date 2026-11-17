// PRUEBA DE LA TANDA V2 (15-nov): el nuevo HOY durante el viaje (tarjeta «Ya estás aquí» y de camino, flotantes, orden, reto único, lugares pendientes, avisos de abajo de uno en uno, nunca a un sitio cerrado).
//   APP_URL=http://localhost:5199 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV2Hoy.mjs
// Roma a pie y Lanzarote en coche. NO crea cuentas ni viajes en el Supabase de producción (Vite de pruebas con Supabase de mentira + modo demo de los logros). Capturas en docs/dias/capturas_v2/.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { build } from 'esbuild'
import { abrirApp } from './_enLaApp.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
const CAPTURAS = 'docs/dias/capturas_v2'
fs.mkdirSync(CAPTURAS, { recursive: true })

/* ───────────────────────── 1. Design y código ───────────────────────── */
console.log('1. Design y código')
const duranteV2 = leer('src/components/route/hoy/v2/HoyDuranteV2.tsx')
const parada = leer('src/components/route/hoy/v2/ParadaHoy.tsx')
{
  for (const f of ['Piezas/Hoy Aqui.dc.html', 'Piezas/Hoy Entero.dc.html', 'Piezas/Hoy Recorrido.dc.html', 'Piezas/Hoy Completa.dc.html', 'App HOY.dc.html']) debe(fs.existsSync(`docs/diseno/proyecto/${f}`), 'diseno', `Design al día: ${f}`)
  const pSin = sinComentarios(parada)
  debe(/'SIGUIENTE PARADA'/.test(pSin) && /'PRIMERA PARADA'/.test(pSin) && !/POR LLEGAR/.test(pSin) && !/'SIGUIENTE'/.test(pSin), 'etiquetas', 'la tarjeta de camino dice «SIGUIENTE PARADA» y «PRIMERA PARADA»; fuera «POR LLEGAR» y «SIGUIENTE»')
  debe(/YA ESTÁS AQUÍ/.test(pSin) && !/Ya estás aquí\. ¿Empezamos\?/.test(pSin), 'etiquetas', 'sale «YA ESTÁS AQUÍ» y fuera «Ya estás aquí. ¿Empezamos?»')
  debe(/Visita de unos/.test(pSin) && /Cierra en \{cierraEn\} min/.test(pSin) && /cierraEn < 45/.test(pSin), 'etiquetas', '«Visita de unos 50 min» y «Cierra en 25 min» solo si cierra en menos de 45 min')
  debe(/Escucha su historia por el camino · \{historia\.minutos\} min/.test(pSin) && /¿No te detecta el GPS\?/.test(pSin) && /Ya he llegado/.test(pSin), 'etiquetas', '«Escucha su historia por el camino · 3 min» y «¿No te detecta el GPS? Ya he llegado»')
  for (const et of ['Qué vas a ver', 'Escuchar historia', 'Tu entrada', 'Haz tu foto']) debe(new RegExp(`etiqueta="${et}"|'${et}'`).test(pSin), 'iconos', `el icono «${et}» lleva su aria-label`)
  debe(!/>\s*Qué vas a ver\s*</.test(pSin) && !/>\s*Haz tu foto\s*</.test(pSin) && !/>\s*Escuchar historia\s*</.test(pSin) && !/>\s*Tu entrada\s*</.test(pSin), 'iconos', 'los iconos no llevan texto (solo aria-label)')
  debe(/Saltar parada/.test(pSin) && /onClick=\{p\.onSaltar\}/.test(pSin), 'saltar', '«Saltar parada» salta directo, sin hoja ni pregunta')
  debe(!/Dónde has aparcado|DondeAparcado/.test(pSin + sinComentarios(duranteV2)), 'aparcar', 'fuera [Dónde has aparcado] de HOY')
  const hoyParada = leer('src/lib/hoyParada.ts')
  debe(!/\+\$\{aparcar\} min para aparcar/.test(hoyParada), 'aparcar', 'fuera «+10 min para aparcar» (los minutos siguen contando por dentro: totalMin)')
  debe(/totalMin: t\.minutos \+ aparcar/.test(hoyParada), 'aparcar', 'los minutos de aparcar siguen sumando al trayecto por dentro')
  debe(!/Abre de|Abre a las/.test(pSin), 'abre', 'sin «Abre» en la tarjeta: solo el reloj y «9:30–16:45»')
  debe(!fs.existsSync('src/components/route/hoy/BotonCamaHoy.tsx') && !/BotonCamaHoy/.test(leer('src/components/route/hoy/HoyView.tsx')), 'cama', 'fuera la cama de arriba (BotonCamaHoy)')
  const camara = leer('src/components/route/hoy/CamaraViaje.tsx')
  debe(/position: 'fixed'/.test(camara) && /SOBRE_LOS_LOGROS/.test(camara), 'flotantes', 'la cámara de viaje es un flotante, encima del de los logros')
  debe(/pb-\[190px\]/.test(leer('src/components/route/hoy/v2/HoyV2.tsx')), 'flotantes', 'HOY deja espacio libre al final para que con el scroll nada quede tapado')
  debe(/MAX_AVISOS_A_LA_VISTA = 1/.test(leer('src/components/route/hoy/v2/AvisosHoy.tsx')), 'avisos', 'los avisos de arriba: como mucho 1 a la vista')
  // El orden de los bloques en el código de HoyDuranteV2.
  const pos = (re) => duranteV2.search(re)
  const orden = ['{cabeceraDeHoy}', '{zonaDeAvisos}', '{principal}', '<RetoDelDia', 'data-hoy-hueco-que-hago-ahora', '<TuDia', '<CercaDeTiFila', '<TusFotosDeHoy', '<VolverAlAlojamiento', '<SiTeSobraTiempoHoy', '<LugaresPendientes'].map((x) => [x, duranteV2.lastIndexOf(x)])
  const ok = orden.every(([, p], i) => p > 0 && (i === 0 || p > orden[i - 1][1]))
  debe(ok, 'orden', `el orden de HOY: ${orden.map(([x]) => x.replace(/[{}<]/g, '').replace(/ .*/, '')).join(' › ')}`)
  void pos
  debe(!/data-mas-visitas className="flex h-11 items-center gap-1\.5 rounded-full px-3/.test(duranteV2), 'orden', 'fuera el botón suelto [Más visitas]')
  debe(/inicialAbierta = true/.test(parada) && /'trazo:hoy:tu-dia'/.test(parada), 'tu-dia', '«Tu día» abierto por defecto, se puede cerrar y se recuerda')
  debe(/hechas<\/span>|de \{total\} hechas/.test(parada), 'tu-dia', '«Tu día · 1 de 4 hechas»')
  debe(/opcionales/.test(leer('src/components/route/hoy/v2/BloquesHoy.tsx')) && !/origen: 'saltada' \}\)\)\s*\n\s*return \[\.\.\.saltadas/.test(leer('src/components/route/hoy/v2/BloquesHoy.tsx')), 'pendientes', '«Si te sobra tiempo» ya no lleva lo saltado (está en «Lugares pendientes»)')
}

/* ───────────────────────── 2. Lógica pura: pendientes, cerrado y avisos de uno en uno ───────────────────────── */
console.log('2. Lugares pendientes, sitio cerrado y avisos de abajo')
const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'pruebaV2Hoy-'))
{
  const abs = (f) => path.resolve(f).split(path.sep).join('/')
  fs.writeFileSync(path.join(carpeta, 'entrada.ts'), `export * from '${abs('src/lib/hoyPendientes.ts')}'\nexport { useAvisoDeAbajo, avisarAbajo } from '${abs('src/store/useAvisoDeAbajo.ts')}'\n`)
  await build({ entryPoints: [path.join(carpeta, 'entrada.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: path.join(carpeta, 'h.cjs'), logLevel: 'silent', define: { 'import.meta.env': '{}' } })
  const H = createRequire(import.meta.url)(path.join(carpeta, 'h.cjs'))
  const h = (tramos, extra = {}) => ({ cerrado: false, tramos, ultimaEntrada: null, ...extra })
  const hm = (a) => a * 60
  debe(H.cerradoAlLlegar(h([{ abre: '9:30', cierra: '16:45' }]), hm(18) + 53) === true, 'cerrado', 'a las 18:53 la Cueva de los Verdes (cierra a las 16:45) está cerrada')
  debe(H.cerradoAlLlegar(h([{ abre: '9:30', cierra: '16:45' }]), hm(16)) === false, 'cerrado', 'a las 16:00 sigue abierta')
  debe(H.cerradoAlLlegar(h([{ abre: '9:30', cierra: '16:45' }]), hm(16) + 10 + 40) === true, 'cerrado', 'ahora + trayecto: llegando a las 16:50 está cerrada')
  debe(H.cerradoAlLlegar(h([{ abre: '9:00', cierra: '13:00' }, { abre: '15:00', cierra: '19:00' }]), hm(13) + 30) === false, 'cerrado', 'en la pausa de mediodía no está «cerrada»: se espera a que abra')
  debe(H.cerradoAlLlegar(h([{ abre: '9:00', cierra: '19:00' }], { ultimaEntrada: '18:15' }), hm(18) + 20) === true, 'cerrado', 'pasada la última entrada, cerrada')
  debe(H.cerradoAlLlegar(h([], { cerrado: true }), 0) === true && H.cerradoAlLlegar(null, hm(23)) === false, 'cerrado', 'un día que no abre, cerrado; sin horario, nunca se da por cerrada')
  const st = (id, extra = {}) => ({ id, name: id, durationMinutes: 60, isArrival: false, isBreak: false, ...extra })
  const dia = (n, stops, extra = {}) => ({ id: `d${n}`, dayNumber: n, city: 'X', stops, meals: [], ...extra })
  const horarios = { a: h([{ abre: '9:30', cierra: '16:45' }]), b: h([{ abre: '9:00', cierra: '20:00' }]) }
  const hoy = dia(2, [st('a'), st('b'), st('c')])
  const cerr = H.cerradasDeHoy({ day: hoy, horarioDe: (s) => horarios[s.id] ?? null, ahoraMin: hm(18) + 53, trayectoMin: () => 20 })
  debe(cerr.has('a') && !cerr.has('b') && !cerr.has('c'), 'cerrado', 'a las 18:53: la primera (cerrada) pasa sola a pendientes y la siguiente abierta sale como siguiente (la que viene después no se toca)')
  const cerr2 = H.cerradasDeHoy({ day: dia(2, [st('a', { reservedId: 'r1' }), st('b')]), horarioDe: (s) => horarios[s.id] ?? null, ahoraMin: hm(18) + 53, trayectoMin: () => 20 })
  debe(cerr2.size === 0, 'cerrado', 'una parada con reserva no se pasa sola a pendientes (tiene su propio aviso)')
  debe(H.avisoDeCerrada('Cueva de los Verdes') === 'Cueva de los Verdes ya ha cerrado · la tienes en Lugares pendientes', 'cerrado', 'el aviso de abajo: «Cueva de los Verdes ya ha cerrado · la tienes en Lugares pendientes»')
  debe(H.AVISO_SALTADA === 'Parada saltada · la tienes en Lugares pendientes', 'pendientes', 'el aviso de abajo de la parada saltada: «Parada saltada · la tienes en Lugares pendientes»')
  // Lugares pendientes
  const ruta = {
    days: [
      dia(1, [st('x1', { checkedInAt: 't' }), st('x2'), st('x3', { saltada: true })]), // usado: x2 no dio tiempo, x3 saltada
      dia(2, [st('a', { saltada: true }), st('b'), st('c', { checkedInAt: 't' })]),
      dia(3, [st('y1')]),
    ],
  }
  const p = H.lugaresPendientes({ route: ruta, day: ruta.days[1], cerradas: new Set(['b']) })
  const motivos = Object.fromEntries(p.map((x) => [x.stop.id, x.motivo]))
  debe(motivos.a === 'saltada' && motivos.b === 'cerrada' && !('c' in motivos), 'pendientes', 'lo saltado y lo cerrado de hoy salen; lo hecho no')
  debe(motivos.x2 === 'sin_tiempo' && motivos.x3 === 'saltada' && !('x1' in motivos), 'pendientes', 'lo que quedó sin ver de ayer (saltado o sin tiempo) sigue saliendo hoy hasta que decidas')
  debe(!('y1' in motivos), 'pendientes', 'lo de mañana no es pendiente')
  const p2 = H.lugaresPendientes({ route: { days: [dia(1, [st('z1'), st('z2')]), dia(2, [st('q')])] }, day: dia(2, [st('q')]), cerradas: new Set() })
  debe(p2.length === 0, 'pendientes', 'un día anterior en el que no se marcó NADA (no se usó la app) no llena la lista')
  debe(p.find((x) => x.stop.id === 'a').texto === 'Saltada hoy' && p.find((x) => x.stop.id === 'b').texto === 'Ya ha cerrado' && /día 1/.test(p.find((x) => x.stop.id === 'x2').texto), 'pendientes', 'los textos: «Saltada hoy», «Ya ha cerrado», «No dio tiempo el día 1»')
  // Avisos de abajo, de uno en uno
  const A = H.useAvisoDeAbajo
  A.getState().vaciar()
  H.avisarAbajo({ id: 'uno', texto: 'Uno' })
  H.avisarAbajo({ id: 'dos', texto: 'Dos' })
  H.avisarAbajo({ id: 'dos', texto: 'Dos' })
  H.avisarAbajo({ id: 'tres', texto: 'Tres', accion: { etiqueta: 'Deshacer', alTocar: () => undefined } })
  debe(A.getState().actual.id === 'uno' && A.getState().cola.map((x) => x.id).join() === 'dos,tres', 'avisos', 'un aviso a la vez: el primero se ve y los demás esperan (sin repetirse)')
  A.getState().siguiente()
  A.getState().siguiente()
  debe(A.getState().actual.id === 'tres' && A.getState().actual.accion.etiqueta === 'Deshacer' && A.getState().cola.length === 0, 'avisos', 'al irse uno sale el siguiente; «Plan actualizado» conserva su [Deshacer]')
  const cp = leer('src/components/route/hoy/v2/CambiarPlan.tsx')
  debe(/texto, ms: 12000, accion: conDeshacer \? \{ etiqueta: 'Deshacer'/.test(cp), 'avisos', '«Plan actualizado» sigue con su [Deshacer] (Design lo quitó, pero no se decidió)')
  debe(!/\[Deshacer\]/.test(sinComentarios(leer('src/lib/hoyPendientes.ts'))) && !/AVISO_SALTADA[^\n]*accion/.test(duranteV2), 'avisos', '«Parada saltada» no lleva [Deshacer]')
  debe(/<AvisoDeAbajoHost \/>/.test(duranteV2), 'avisos', 'los avisos de abajo los pinta un solo anfitrión, en la misma zona encima de las pestañas')
}

/* ───────────────────────── 2b. El reto del día ───────────────────────── */
console.log('2b. El reto del día, uno solo')
{
// El reto del día: uno solo (elige el servidor).
{
  const { elegirRetos } = await import('../../server/logros/cerca.js')
  const sitio = (estado) => ({ estado, ganado: false })
  const reto = (nombre, total, completable, hoy) => ({ coleccion: nombre, nombre, total, faltan: total, completable_hoy: completable, sitios: Array.from({ length: hoy }, () => sitio('hoy')) })
  const r = elegirRetos([reto('Pequeña', 1, true, 1), reto('Muchos', 7, false, 3), reto('Completable', 5, true, 1), reto('Pocos', 6, false, 2)])
  debe(r[0].nombre === 'Completable', 'reto', 'el reto es la colección que puedes completar hoy')
  debe(!r.some((x) => x.nombre === 'Pequeña'), 'reto', 'nunca una colección de menos de 3 sitios (adiós al «0 de 1»)')
  debe(elegirRetos([reto('A', 5, false, 1), reto('B', 5, false, 3)])[0].nombre === 'B', 'reto', 'si no hay ninguna completable, la que tiene más pedazos de hoy')
  debe(r.length - 1 === 2, 'reto', 'debajo, «Y 2 colecciones más avanzan hoy» (las demás)')
  const re = sinComentarios(leer('src/components/route/hoy/v2/RetoDelDia.tsx'))
  debe(/Y ${n} colecci|textoColeccionesMas/.test(re) && /Hoy puedes completar/.test(re) && /RETO DEL DÍA/.test(re), 'reto', 'la tarjeta: «RETO DEL DÍA», «Hoy puedes completar «…»» y «Y N colecciones más avanzan hoy ›»')
  debe(/principal, \..\.demas\] = retos/.test(re), 'reto', 'la app enseña un solo reto y la lista de las demás debajo')
}

}

/* ───────────────────────── 3. En el móvil: Roma a pie y Lanzarote en coche ───────────────────────── */
console.log('3. En el móvil')
const nuevaApp = async (destino, hoy) => {
  const app = await abrirApp(process.env.APP_URL || 'http://localhost:5199', { ruta: '/?cuentas=on&logros=on&logrosDemo=1&apertura=0&version=completa&hoy2=on', ancho: 390, alto: 844 })
  const fn = destino === 'lanzarote' ? '__rutaLanzarote' : '__rutaPrueba'
  for (let i = 0; i < 360 && !(await app.evaluar(`typeof window.${fn} === 'function'`).catch(() => false)); i++) await app.esp(500)
  await app.evaluar(destino === 'lanzarote' ? `window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '${hoy}' }).then(() => true)` : `Promise.resolve(window.__rutaPrueba()).then(() => true)`)
  await app.esp(3000)
  await app.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); R.useRouteStore.setState({ dev_simulated_today_iso: '${hoy}' }); R.useRouteStore.getState().setMode('today'); return true })()`)
  await app.esp(2500)
  const cierra = () => app.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Ahora no)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
  for (let i = 0; i < 6 && (await cierra()); i++) await app.esp(700)
  await app.hasta("Boolean(document.querySelector('[data-hoy-siguiente]'))", { segundos: 40 })
  return app
}
const pantalla = (app) => app.evaluar("document.querySelector('[data-hoy]')?.innerText ?? ''")

for (const [destino, hoy, coche] of [['roma', '2026-10-17', false], ['lanzarote', '2026-11-09', true]]) {
  const app = await nuevaApp(destino, hoy)
  const etq = `${destino === 'roma' ? 'Roma a pie' : 'Lanzarote en coche'}`
  try {
    const t = await pantalla(app)
    const tarjeta = await app.evaluar("document.querySelector('[data-hoy-siguiente]')?.innerText ?? ''")
    debe(/PRIMERA PARADA/i.test(t) && !/POR LLEGAR/i.test(t), 'etiquetas', `${etq}: la primera tarjeta dice «PRIMERA PARADA»`)
    debe(!/aparcar/i.test(tarjeta) && !/Abre\b/.test(tarjeta), 'aparcar', `${etq}: sin «aparcar» ni «Abre» en la tarjeta`)
    debe(!/\+\d+ min para aparcar/.test(t), 'aparcar', `${etq}: sin «+10 min para aparcar» en todo HOY`)
    if (coche) debe(/En coche · \d+ min/.test(tarjeta), 'trayecto', `${etq}: el trayecto, «En coche · 22 min · 17 km»`)
    debe(/Cómo llegar/.test(t) && /Cambiar plan/.test(t) && /Ya he llegado/.test(t), 'etiquetas', `${etq}: [Cómo llegar], [Cambiar plan] y «¿No te detecta el GPS? Ya he llegado»`)
    debe(!(await app.evaluar("Boolean(document.querySelector('[data-boton-cama-hoy]'))")), 'cama', `${etq}: sin la cama de arriba`)
    // Los flotantes: solo dos (la cámara y los logros), fijos; nada encima de la foto.
    const flot = await app.evaluar(`(() => Array.from(document.querySelectorAll('button')).filter((b) => getComputedStyle(b).position === 'fixed' && b.getBoundingClientRect().width >= 40 && b.getBoundingClientRect().width <= 60 && !/Pruebas/.test(b.textContent || '')).map((b) => b.getAttribute('data-camara-viaje') ? 'camara' : b.getAttribute('data-boton-logros') ? 'logros' : 'otro:' + (b.getAttribute('aria-label') || b.textContent)))()`)
    debe(flot.length === 2 && flot.includes('camara') && flot.includes('logros'), 'flotantes', `${etq}: flotantes, solo dos: la cámara de viaje y el de los logros (${flot.join(', ')})`)
    const sobreFoto = await app.evaluar("(() => { const f = document.querySelector('[data-hoy-foto-parada]'); if (!f) return 0; const r = f.getBoundingClientRect(); return Array.from(f.querySelectorAll('button, a')).length })()")
    debe(sobreFoto === 0, 'flotantes', `${etq}: encima de la foto, nada (ningún botón dentro de la foto)`)
    debe(await app.evaluar("document.querySelector('[data-camara-viaje=\"boton\"]')?.getAttribute('aria-label')?.length > 0"), 'flotantes', `${etq}: la cámara lleva su aria-label`)
    // «Tu día» abierto por defecto.
    debe(await app.evaluar("document.querySelector('[data-hoy-tu-dia]')?.getAttribute('data-hoy-tu-dia') === 'abierta'"), 'tu-dia', `${etq}: «Tu día» abierto por defecto`)
    debe(/Tu día/i.test(t) && /de \d+ hechas/.test(t), 'tu-dia', `${etq}: «Tu día · N de M hechas»`)
    debe(/MAÑANA|MEDIODÍA|TARDE|NOCHE/.test(t) && (!/Comida/.test(t) || /MEDIODÍA/.test(t)), 'tu-dia', `${etq}: «Tu día» por franjas (MAÑANA, MEDIODÍA con la comida, TARDE…)`)
    const filaFoto = await app.evaluar("(() => { const f = document.querySelector('[data-hoy-tu-dia] [data-hoy-fila=\"parada\"]'); if (!f) return null; const e = f.querySelector('span[aria-hidden]'); const r = e?.getBoundingClientRect(); return r ? Math.round(r.width) : 0 })()")
    debe(filaFoto === 46, 'tu-dia', `${etq}: cada parada de «Tu día» lleva su FOTO de 46 px (${filaFoto}), su nombre y su estado, sin números en círculo`)
    // El orden de los bloques en pantalla.
    const ys = await app.evaluar(`(() => { const hoyEl = document.querySelector('[data-hoy]'); const y = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().top - hoyEl.getBoundingClientRect().top + hoyEl.scrollTop) : null }; return { cab: y('[data-hoy-parada-cabecera]'), card: y('[data-hoy-siguiente]'), hueco: y('[data-hoy-hueco-que-hago-ahora]'), dia: y('[data-hoy-tu-dia]'), cerca: y('[data-cerca-de-ti]'), fotos: y('[data-fotos-de-hoy]'), aloj: y('[data-alojamiento-hoy]'), sobra: y('[data-hoy-sobra-tiempo]'), pend: y('[data-hoy-pendientes]') } })()`)
    const presentes = ['cab', 'card', 'hueco', 'dia', 'cerca', 'fotos', 'aloj', 'sobra', 'pend'].filter((k) => ys[k] != null)
    const crece = presentes.every((k, i) => i === 0 || ys[k] >= ys[presentes[i - 1]])
    debe(crece && presentes.includes('card') && presentes.includes('dia') && presentes.includes('cerca'), 'orden', `${etq}: el orden en pantalla: ${presentes.join(' › ')} (${presentes.map((k) => ys[k]).join(', ')})`)
    debe(await app.evaluar("Boolean(document.querySelector('[data-hoy-tu-dia] [data-hoy-fila=\"parada\"] img, [data-hoy-tu-dia] [data-hoy-fila=\"parada\"] span[aria-hidden]'))"), 'tu-dia', `${etq}: cada parada de «Tu día» lleva su foto`)
    await app.captura(`${CAPTURAS}/${destino}_camino.jpg`)
    await app.evaluar("(() => { const e = document.querySelector('[data-hoy]'); if (e) e.scrollTop = e.scrollHeight; return true })()")
    await app.esp(800)
    await app.captura(`${CAPTURAS}/${destino}_final_de_hoy.jpg`)
    const finalTxt = await pantalla(app)
    debe(/CERCA DE TI/i.test(finalTxt) && (coche ? /Gasolineras/.test(finalTxt) && /Aparcar/.test(finalTxt) : /Baños/.test(finalTxt) && /Fuentes/.test(finalTxt)) && /Comer/.test(finalTxt), 'cerca', `${etq}: «Cerca de ti» con ${coche ? '[Gasolineras], [Aparcar] y [Comer]' : '[Baños], [Fuentes] y [Comer]'}`)
    debe(/Pon tu alojamiento para volver con un toque|VOLVER AL ALOJAMIENTO/i.test(finalTxt), 'alojamiento', `${etq}: la fila «Volver al alojamiento» (con o sin dirección)`)
    // «Ya estás aquí» (a mano con «Ya he llegado»).
    await app.evaluar("(() => { const e = document.querySelector('[data-hoy]'); if (e) e.scrollTop = 0; document.querySelector('[data-hoy-ya-he-llegado]')?.click(); return true })()")
    await app.esp(1500)
    const aqui = await pantalla(app)
    debe(/YA ESTÁS AQUÍ/.test(aqui) && !/Ya estás aquí\. ¿Empezamos/.test(aqui), 'etiquetas', `${etq}: «YA ESTÁS AQUÍ» sin «¿Empezamos?»`)
    debe(/Visita de unos \d+ min/.test(aqui), 'etiquetas', `${etq}: «Visita de unos N min»`)
    debe(/He terminado/.test(aqui) && /Necesito más tiempo/.test(aqui) && /Saltar parada/.test(aqui), 'etiquetas', `${etq}: [He terminado], [Necesito más tiempo] y «Saltar parada»`)
    debe(!/Dónde has aparcado/.test(aqui) && !/Cambiar plan/.test(aqui), 'aparcar', `${etq}: sin [Dónde has aparcado] ni [Cambiar plan] en «Ya estás aquí»`)
    debe(!/\d{1,2}:\d{2}–\d{1,2}:\d{2}/.test(aqui) && !/En coche · \d|A pie · \d/.test(aqui), 'etiquetas', `${etq}: «Ya estás aquí» sin horario ni trayecto`)
    const iconos = await app.evaluar("Array.from(document.querySelectorAll('[data-hoy-icono]')).map((b) => b.getAttribute('aria-label') + '|' + (b.textContent || '').trim())")
    debe(iconos.some((x) => /^Qué vas a ver\|$/.test(x)) && iconos.some((x) => /^Haz tu foto\|$/.test(x)), 'iconos', `${etq}: los iconos van sin texto y con su aria-label (${iconos.join(' · ')})`)
    await app.captura(`${CAPTURAS}/${destino}_aqui.jpg`)
    // «Saltar parada»: sin hoja ni pregunta; la parada pasa a «Lugares pendientes» y sale UN aviso abajo, sin [Deshacer].
    await app.evaluar("document.querySelector('[data-hoy-saltar-parada]')?.click()")
    await app.esp(1500)
    const hojaAbierta = await app.evaluar("Boolean(document.querySelector('[role=dialog]:not([data-flotantes])'))")
    debe(!hojaAbierta, 'saltar', `${etq}: «Saltar parada» no abre ninguna hoja ni pregunta`)
    const avisos = await app.evaluar("Array.from(document.querySelectorAll('[data-aviso-de-abajo]')).map((a) => a.innerText.replace(/\\s+/g, ' '))")
    debe(avisos.length === 1 && /Parada saltada · la tienes en Lugares pendientes/.test(avisos[0]) && !/Deshacer/.test(avisos[0]), 'avisos', `${etq}: un solo aviso abajo: «Parada saltada · la tienes en Lugares pendientes», sin [Deshacer] (${avisos.join(' | ')})`)
    await app.captura(`${CAPTURAS}/${destino}_saltada.jpg`)
    const pend = await app.evaluar("document.querySelector('[data-hoy-pendientes]')?.getAttribute('data-hoy-pendientes')")
    debe(Number(pend) >= 1, 'pendientes', `${etq}: «Lugares pendientes» con lo saltado (${pend})`)
    debe(await app.evaluar("document.querySelector('[data-hoy-pendientes]')?.getAttribute('data-hoy-pendientes-estado') === 'cerrada'"), 'pendientes', `${etq}: «Lugares pendientes» cerrado con su número (H6)`)
    await app.evaluar("(() => { const e = document.querySelector('[data-hoy]'); if (e) e.scrollTop = e.scrollHeight; document.querySelector('[data-hoy-pendientes-cabecera]')?.click(); return true })()")
    await app.esp(800)
    await app.evaluar("(() => { const e = document.querySelector('[data-hoy]'); if (e) e.scrollTop = e.scrollHeight; return true })()")
    await app.esp(600)
    const abierto = await pantalla(app)
    debe(/Pasar a otro día/.test(abierto) && /Recuperar hoy/.test(abierto) && /Ya lo visité/.test(abierto) && /Quitar/.test(abierto) && /Saltada hoy/.test(abierto), 'pendientes', `${etq}: abierto, con «Saltada hoy» y [Pasar a otro día] [Recuperar hoy] [Ya lo visité] [Quitar]`)
    debe(!/Si te sobra tiempo[^\n]*Saltad/.test(abierto), 'pendientes', `${etq}: lo saltado no está en «Si te sobra tiempo»`)
    await app.captura(`${CAPTURAS}/${destino}_pendientes.jpg`)
    // [Recuperar hoy]: vuelve a la ruta y ya no está pendiente.
    await app.evaluar("Array.from(document.querySelectorAll('[data-hoy-pendiente=\"saltada\"]')).find((li) => /Saltada hoy/.test(li.innerText))?.querySelector('[data-hoy-pendiente-recuperar]')?.click()")
    await app.esp(1200)
    debe(!(await app.evaluar("Array.from(document.querySelectorAll('[data-hoy-pendiente=\"saltada\"]')).some((li) => /Saltada hoy/.test(li.innerText))")), 'pendientes', `${etq}: [Recuperar hoy] la devuelve a la ruta y deja de ser pendiente`)
  } finally {
    app.cerrar()
  }
}

// El sitio cerrado en el viaje: la siguiente parada, cerrada, pasa sola a «Lugares pendientes» y sale la siguiente abierta (con su aviso de abajo).
{
  const app = await nuevaApp('lanzarote', '2026-11-09')
  try {
    const antes = await app.evaluar("document.querySelector('[data-hoy-titulo]')?.innerText")
    // La parada que sale como siguiente pasa a abrir solo un minuto de madrugada: a cualquier hora del día ya habrá cerrado (no depende del reloj: se cierra la que se ve ahora).
    const nombre = await app.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const T = await import('/src/lib/todayMode.ts'); const { numberedStopsOf } = await import('/src/lib/stopKind.ts'); const titulo = (document.querySelector('[data-hoy-titulo]')?.innerText ?? '').toLowerCase().slice(0, 12); const ruta = structuredClone(R.useRouteStore.getState().route); const h = T.getTodayTripContext(ruta, '2026-11-09'); const dia = ruta.days[h.dayIndex]; const stops = T.resolveRealStops(dia); const s = numberedStopsOf({ ...dia, stops }).find((x) => !x.checkedInAt && !x.saltada && x.name.toLowerCase().includes(titulo)); if (!s) return null; s.hoursData = { schedule: '00:01-00:02' }; s.reservedId = undefined; s.reservationTime = undefined; dia.stops = stops; R.useRouteStore.setState({ route: ruta }); return s.name })()`)
    debe(Boolean(nombre), 'cerrado', 'hay una parada siguiente a la que cerrar')
    await app.esp(2500)
    const despues = await app.evaluar("document.querySelector('[data-hoy-titulo]')?.innerText ?? ''")
    debe(Boolean(nombre) && !String(despues).toLowerCase().includes(String(nombre).toLowerCase().slice(0, 12)), 'cerrado', `el sitio cerrado («${nombre}») ya no sale como siguiente (ahora: «${despues}»; antes: «${antes}»)`)
    const pend = await app.evaluar("document.querySelector('[data-hoy-pendientes]')?.getAttribute('data-hoy-pendientes')")
    debe(Number(pend) >= 1, 'cerrado', 'el cerrado está en «Lugares pendientes»')
    // El aviso de abajo (uno a la vez: puede esperar tras otro; cada uno dura 6 s).
    let aviso = ''
    for (let k = 0; k < 40 && !/ya ha cerrado · la tienes en Lugares pendientes/.test(aviso); k++) {
      aviso = await app.evaluar("Array.from(document.querySelectorAll('[data-aviso-de-abajo]')).map((a) => a.innerText.replace(/\\s+/g, ' ')).join(' | ')")
      if (!/ya ha cerrado/.test(aviso)) await app.esp(500)
    }
    debe(/ya ha cerrado · la tienes en Lugares pendientes/.test(aviso), 'cerrado', `el aviso de abajo: «… ya ha cerrado · la tienes en Lugares pendientes» (${aviso})`)
    // (V2b) El aviso de arriba solo habla de paradas de hoy por hacer: nunca de la que acaba de pasar a «Lugares pendientes».
    const arriba = await app.evaluar("Array.from(document.querySelectorAll('[data-hoy-horario-vivo-texto]')).map((e) => e.innerText).join(' | ')")
    debe(!String(arriba).toLowerCase().includes(String(nombre).toLowerCase().slice(0, 12)), 'aviso', `el aviso de arriba no habla del sitio ya cerrado («${nombre}»): «${arriba}»`)
    const idsAviso = await app.evaluar("Array.from(document.querySelectorAll('[data-hoy-horario-vivo]')).map((e) => e.getAttribute('data-hoy-horario-vivo'))")
    await app.evaluar("document.querySelector('[data-hoy-pendientes-estado=\"cerrada\"] [data-hoy-pendientes-cabecera]')?.click()")
    await app.esp(600)
    const idsPend = await app.evaluar("Array.from(document.querySelectorAll('[data-hoy-pendiente-id]')).map((e) => e.getAttribute('data-hoy-pendiente-id'))")
    debe(!idsAviso.some((id) => idsPend.includes(id)), 'aviso', 'ningún aviso de horario es de una parada que está en «Lugares pendientes»')
    await app.captura(`${CAPTURAS}/lanzarote_cerrado.jpg`)
  } finally {
    app.cerrar()
  }
}

/* ───────────────────────── 4. V2b (17-nov): aviso de arriba, pedazos, reto, pendientes con foto, textos, fotos de hoy ───────────────────────── */
console.log('4. V2b')
{
  // Código: el texto de fin de día y «Tus fotos de hoy».
  const bloques = sinComentarios(leer('src/components/route/hoy/v2/BloquesHoy.tsx'))
  debe(/Lo que dejaste para luego está abajo, en «Lugares pendientes»/.test(bloques) && !/Lo que dejaste para luego está abajo, en «Si te sobra/.test(bloques), 'textos', 'al acabar el día: «…está abajo, en «Lugares pendientes»»')
  const fotosCod = sinComentarios(leer('src/components/route/fotos/TusFotosDeHoy.tsx'))
  debe(/if \(deHoy\.length === 0\) return null/.test(fotosCod) && !/BotonFoto/.test(fotosCod), 'fotos de hoy', '«Tus fotos de hoy» solo sale con fotos de hoy y sin botón [+ Foto] (la cámara flotante ya está)')
  const hor = sinComentarios(leer('src/components/route/hoy/v2/HorarioHoy.tsx'))
  debe(/#FFF1D6/.test(hor) && /#E5B565/.test(hor) && !/accent-red/.test(hor.slice(hor.indexOf('AvisoDeHorarioEnDirecto'))), 'aviso', 'el aviso «A este ritmo…» es la tarjeta pequeña en ámbar de Design (no la roja grande)')
  debe(/diaVivo/.test(sinComentarios(duranteV2)) && /<AvisoDeHorarioEnDirecto[^>]*day=\{diaVivo\}/.test(sinComentarios(duranteV2)), 'aviso', 'el aviso de horario mira el día SIN lo cerrado/saltado (diaVivo)')
  // Servidor: los datos reales de Roma y de Lanzarote (la misma lógica que contesta el servidor).
  const { cargarDatos, cargarCatalogo } = await import('../../server/logros/datos.js')
  const { sitiosCerca, retosDelDia, elegirRetos } = await import('../../server/logros/cerca.js')
  const { sitioDeParada } = await import('../../server/logros/servicio.js')
  const { textoDePedazosDe } = { textoDePedazosDe: (n) => (n.length === 0 ? null : `Aquí ${n.length === 1 ? 'ganas 1 pedazo' : `ganas ${n.length} pedazos`}: ${n.length === 1 ? `«${n[0]}»` : `${n.slice(0, -1).map((x) => `«${x}»`).join(', ')} y «${n[n.length - 1]}»`}`) }
  const datos = cargarDatos()
  const catalogos = Object.fromEntries(Object.keys(datos.destinos).map((c) => [c, cargarCatalogo(c)]))
  const pantallaV2b = (app) => app.evaluar("document.querySelector('[data-hoy]')?.innerText ?? ''")
  for (const [destino, hoy] of [['roma', '2026-10-17'], ['lanzarote', '2026-11-09']]) {
    const app = await nuevaApp(destino, hoy)
    const etq = destino === 'roma' ? 'Roma a pie' : 'Lanzarote en coche'
    try {
      const nombres = await app.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const T = await import('/src/lib/todayMode.ts'); const { numberedStopsOf } = await import('/src/lib/stopKind.ts'); const r = R.useRouteStore.getState().route; const h = T.getTodayTripContext(r, '${hoy}'); return numberedStopsOf(h.day).map((s) => s.name) })()`)
      const sitiosHoy = new Set(nombres.map((n) => sitioDeParada({ name: n }, catalogos[destino])).filter(Boolean))
      // El reto del día: el que daría el servidor con los datos reales de ESE día.
      const retos = elegirRetos(retosDelDia({ datos, catalogos, destino, items: new Map(), sitiosHoy }))
      debe(retos.length >= 1 && retos.every((r) => r.total >= 3 && (r.completable_hoy || r.sitios.some((s) => s.estado === 'hoy'))), 'reto', `${etq}: con los datos reales del día (${[...sitiosHoy].length} sitios con logro) el servidor da ${retos.length} retos, todos de colecciones que avanzan hoy`)
      if (destino === 'roma') debe(retos.length >= 2, 'reto', `${etq}: ese día de Roma tiene reto (${retos.map((r) => r.nombre).join(' · ')})`)
      await app.evaluar(`window.__hoy1Cerca = ${JSON.stringify({ ok: true, cerca: [], juego: null, juego_sitio: null, fuera_de_ruta: null, junto_a: null, reto: null, retos })}; window.dispatchEvent(new Event('trazo:hoy1-repreguntar')); true`)
      await app.esp(3500)
      const t = await pantallaV2b(app)
      const n = await app.evaluar("document.querySelector('[data-hoy-retos]')?.getAttribute('data-hoy-retos')")
      debe(Number(n) === retos.length && /RETO DEL D[ÍI]A/i.test(t), 'reto', `${etq}: sale UN reto del día (${n} colecciones) con su tarjeta`)
      if (retos.length > 1) debe(new RegExp(`Y ${retos.length - 1} colecci`).test(t), 'reto', `${etq}: «Y ${retos.length - 1} colecciones más avanzan hoy ›»`)
      await app.evaluar("(() => { const e = Array.from(document.querySelectorAll('[data-hoy-reto-mas]')).pop(); e?.click(); return true })()")
      await app.esp(1200)
      await app.captura(`${CAPTURAS}/${destino}_reto_lista.jpg`)
      await app.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Cerrar|Cerrar lista)$/.test(x.getAttribute('aria-label') || '')); b?.click(); return true })()")
      await app.esp(600)
      // La línea de los pedazos en la primera parada (la que sale en «Ya estás aquí»).
      const primera = nombres[0]
      const idPrimera = sitioDeParada({ name: primera }, catalogos[destino])
      const esperados = idPrimera ? datos.destinos[destino].colecciones.filter((c) => c.sitios.includes(idPrimera)).map((c) => c.nombre) : []
      await app.evaluar(`window.__pedazosDemo = { ${JSON.stringify(primera)}: ${JSON.stringify(esperados)} }; true`)
      await app.evaluar("(() => { const e = document.querySelector('[data-hoy]'); if (e) e.scrollTop = 0; document.querySelector('[data-hoy-ya-he-llegado]')?.click(); return true })()")
      await app.esp(2200)
      const aqui = await pantallaV2b(app)
      if (esperados.length > 0) debe(aqui.includes(textoDePedazosDe(esperados)), 'pedazos', `${etq}: «${primera}» dice «${textoDePedazosDe(esperados)}»`)
      else debe(!/Aquí ganas/.test(aqui), 'pedazos', `${etq}: «${primera}» no está en ninguna colección: sin línea de pedazos`)
      debe(!/emblema/i.test(await app.evaluar("document.querySelector('[data-hoy-pedazos]')?.innerText ?? ''")), 'pedazos', `${etq}: la línea de pedazos nunca nombra emblemas ocultos`)
      if (destino === 'roma') await app.captura(`${CAPTURAS}/roma_aqui_pedazos.jpg`)
      // «Tus fotos de hoy»: sin fotos, no sale.
      debe(!(await app.evaluar("Boolean(document.querySelector('[data-fotos-de-hoy]'))")) && !/Tus fotos de hoy/i.test(aqui), 'fotos de hoy', `${etq}: sin fotos de hoy no sale «Tus fotos de hoy» ni [+ Foto]`)
      // (V2b, 2) La Plaza de San Pedro (en dos colecciones: «El país más pequeño del mundo» y «La Roma de Bernini»): con las paradas de antes hechas, «Ya estás aquí» dice sus 2 pedazos.
      if (destino === 'roma' && nombres.includes('Plaza de San Pedro')) {
        const idPlaza = sitioDeParada({ name: 'Plaza de San Pedro' }, catalogos.roma)
        const colPlaza = datos.destinos.roma.colecciones.filter((c) => c.sitios.includes(idPlaza)).map((c) => c.nombre)
        debe(colPlaza.length === 2 && colPlaza.includes('El país más pequeño del mundo') && colPlaza.includes('La Roma de Bernini'), 'pedazos', 'la Plaza de San Pedro está en 2 colecciones: «El país más pequeño del mundo» y «La Roma de Bernini»')
        await app.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const T = await import('/src/lib/todayMode.ts'); const { numberedStopsOf } = await import('/src/lib/stopKind.ts'); const st = R.useRouteStore.getState(); const h = T.getTodayTripContext(st.route, '${hoy}'); for (const s of numberedStopsOf(h.day)) { if (s.name === 'Plaza de San Pedro') break; st.setStopVisto(h.day.id, s.id, true) } window.__pedazosDemo = { 'Plaza de San Pedro': ${JSON.stringify(colPlaza)} }; return true })()`)
        await app.esp(2000)
        await app.evaluar("(() => { const e = document.querySelector('[data-hoy]'); if (e) e.scrollTop = 0; document.querySelector('[data-hoy-ya-he-llegado]')?.click(); return true })()")
        await app.esp(2200)
        const plaza = await pantallaV2b(app)
        debe(/Plaza de San Pedro/.test(plaza) && plaza.includes(textoDePedazosDe(colPlaza)), 'pedazos', `Roma: en la Plaza de San Pedro sale «${textoDePedazosDe(colPlaza)}»`)
        await app.captura(`${CAPTURAS}/roma_plaza_san_pedro.jpg`)
      }
      // El día se acaba: todo hecho menos lo último, que se salta.
      await app.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const T = await import('/src/lib/todayMode.ts'); const { numberedStopsOf } = await import('/src/lib/stopKind.ts'); const st = R.useRouteStore.getState(); const h = T.getTodayTripContext(st.route, '${hoy}'); const ps = numberedStopsOf(h.day); ps.forEach((s, i) => { if (i < ps.length - 1) st.setStopVisto(h.day.id, s.id, true) }); st.setStopSaltada(h.day.id, ps[ps.length - 1].id, true); return true })()`)
      await app.esp(2500)
      const fin = await pantallaV2b(app)
      debe(/Lo que dejaste para luego está abajo, en «Lugares pendientes»/.test(fin) && !/en «Si te sobra tiempo»/.test(fin), 'textos', `${etq}: al acabar el día, «Lo que dejaste para luego está abajo, en «Lugares pendientes»»`)
      debe(!(await app.evaluar("Boolean(document.querySelector('[data-hoy-horario-vivo]'))")), 'aviso', `${etq}: con el día terminado no sale el aviso «A este ritmo llegarías…»`)
      await app.captura(`${CAPTURAS}/${destino}_fin_del_dia.jpg`)
      // «Lugares pendientes» como Design: foto, pastilla y los 4 botones en dos filas.
      await app.evaluar("(() => { const e = document.querySelector('[data-hoy]'); if (e) e.scrollTop = e.scrollHeight; if (document.querySelector('[data-hoy-pendientes-estado=\"cerrada\"]')) document.querySelector('[data-hoy-pendientes-cabecera]')?.click(); return true })()")
      await app.esp(900)
      await app.evaluar("(() => { const e = document.querySelector('[data-hoy]'); if (e) e.scrollTop = e.scrollHeight; return true })()")
      await app.esp(700)
      const pend = await app.evaluar(`(() => { const li = document.querySelector('[data-hoy-pendiente]'); if (!li) return null; const r = (s) => { const e = li.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } }; const foto = li.querySelector('[data-hoy-pendiente-foto] > span > span'); return { foto: r('[data-hoy-pendiente-foto]'), opacidad: foto ? getComputedStyle(foto).opacity : null, pastilla: r('[data-hoy-pendiente-pastilla]'), pasar: r('[data-hoy-pendiente-pasar]'), recuperar: r('[data-hoy-pendiente-recuperar]'), visitado: r('[data-hoy-pendiente-visitado]'), quitar: r('[data-hoy-pendiente-quitar]'), iconos: li.querySelectorAll('[data-hoy-pendiente-botones] svg').length, pasarFondo: getComputedStyle(li.querySelector('[data-hoy-pendiente-pasar]') ?? li).backgroundImage.slice(0, 20) } })()`)
      debe(pend && pend.foto && pend.foto.w >= 88 && pend.opacidad === '1', 'pendientes', `${etq}: cada sitio de «Lugares pendientes» lleva su FOTO a todo color (${pend?.foto?.w}px, opacidad ${pend?.opacidad})`)
      debe(pend && pend.pastilla && /Saltada|cerrado|No dio/.test(await app.evaluar("document.querySelector('[data-hoy-pendiente-pastilla]')?.innerText ?? ''")), 'pendientes', `${etq}: la pastilla con el motivo («Saltada hoy»)`)
      debe(pend && pend.pasar && pend.recuperar && pend.visitado && pend.quitar && pend.pasar.y === pend.recuperar.y && pend.visitado.y === pend.quitar.y && pend.visitado.y > pend.pasar.y && Math.abs(pend.pasar.w - pend.recuperar.w) <= 2 && Math.abs(pend.visitado.w - pend.quitar.w) <= 2 && Math.abs(pend.pasar.w - pend.visitado.w) <= 2, 'pendientes', `${etq}: los botones en dos filas, mitad y mitad (${JSON.stringify([pend?.pasar, pend?.recuperar, pend?.visitado, pend?.quitar].map((b) => b && `${b.x},${b.y} ${b.w}x${b.h}`))})`)
      debe(pend && pend.iconos >= 4 && /linear-gradient/.test(pend.pasarFondo), 'pendientes', `${etq}: cada botón con su icono y [Pasar a otro día] en oro (${pend?.iconos} iconos)`)
      await app.captura(`${CAPTURAS}/${destino}_pendientes_v2b.jpg`)
    } finally {
      app.cerrar()
    }
  }
}

fs.rmSync(carpeta, { recursive: true, force: true })
console.log(`\nLa prueba V2 (HOY): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
