// La prueba de la Tanda V37C (22-nov): LA COLECCIÓN Y EL PEDAZO, BIEN EN EL ESTUDIO DE SONIDOS. La demo del estudio llevaba momentos pero no `estado`, y la insignia salía vacía («0 DE 0»).
// Ahora cada tarjeta que depende del estado lleva uno de ejemplo (src/lib/sonidos/ejemploEstado.ts, con las colecciones reales de Roma) y vive SOLO en el estudio.
//   APP_URL=http://localhost:5173 node scripts/destino/pruebaV37C.mjs      (con Vite en 5173)
// Ninguna parte toca el Supabase de producción: el administrador es de mentira y la app usa el servidor de mentira de la demo (?logrosDemo=1).
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
const J = async (a, js) => {
  const r = await a.evaluar(js)
  return typeof r === 'string' ? JSON.parse(r) : r
}
const esperar = async (a, js, n = 80) => {
  for (let i = 0; i < n; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(250)
  }
  return false
}
const toque = async (a, sel) => {
  const r = JSON.parse(await a.evaluar(`(() => { const e = document.querySelector('${sel}'); e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return JSON.stringify({ x: b.left + b.width / 2, y: b.top + b.height / 2 }) })()`))
  await a.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x, y: r.y })
  await a.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x, y: r.y, button: 'left', clickCount: 1 })
  await a.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x, y: r.y, button: 'left', clickCount: 1 })
}
const RUTA = '/?cuentas=off&logros=on&logrosDemo=1&admin=sonidos&apertura=0'
const MOCK = "const f = window.fetch.bind(window); window.fetch = (u, i) => String(u).includes('/api/admin/avisos-viajeros') ? Promise.resolve(new Response(JSON.stringify({ ok: true, nuevos: 0, avisos: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })) : f(u, i);"
const IFR = "document.querySelector('[data-visor-iframe]')"

/* ───────── 1. El código ───────── */
console.log('1. El código')
const ejemplo = leer('src/lib/sonidos/ejemploEstado.ts')
const estudio = leer('src/lib/sonidos/estudio.ts')
const visorSrc = leer('src/components/logros/sonidos/VisorDeAnimacion.tsx')
debe(!/supabase|fetch\(|\/api\//i.test(ejemplo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), 'base', 'el estado de ejemplo no llama a Supabase ni a ninguna ruta de /api: son datos puros')
debe(/datosDePrueba\.estado = ESTADO_DEL_ESTUDIO\[/.test(visorSrc) && /datosDePrueba\.estado = null/.test(visorSrc), 'estado', 'el visor pone el estado de ejemplo al empezar una tarjeta y lo quita al parar')
debe(/\.\.\.MOMENTOS_DE_COLECCIONES/.test(estudio), 'momentos', 'la colección y el pedazo del estudio salen de los momentos de ejemplo con sus sitios REALES (no «janiculo»)')
debe(!/'janiculo'/.test(estudio) && /mirador_del_janiculo/.test(ejemplo), 'momentos', 'el Janículo se llama como en los datos (mirador_del_janiculo)')
const roma = JSON.parse(leer('data/logros/roma.json'))
const joyas = roma.colecciones.find((c) => c.id === 'cuatro_joyas')
const imp = roma.colecciones.find((c) => c.id === 'imprescindibles')
const mirad = roma.colecciones.find((c) => c.id === 'miradores')
debe(joyas.sitios.length === 4 && imp.sitios.length === 8 && mirad.sitios.length === 3 && mirad.sitios.includes('mirador_del_janiculo'), 'datos', 'las colecciones reales de Roma son las que usa el ejemplo (4 joyas, 8 imprescindibles, 3 miradores)')
const idsDelEstudio = [...estudio.matchAll(/\{ id: '([a-z_0-9]+)', nombre:/g)].map((x) => x[1])
debe(idsDelEstudio.includes('coleccion_imprescindibles') && idsDelEstudio.includes('pedazo_dos'), 'tarjetas', 'hay tarjeta de «Los imprescindibles» (7 de 8 → 8 de 8) y de dos colecciones a la vez')

if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('(sin Vite: la parte de la pantalla se salta)')
  console.log(`\nPrueba de la Tanda V37C: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}

const CAPTURAS = 'docs/dias/V37C_capturas'
fs.mkdirSync(CAPTURAS, { recursive: true })
const adm = await abrirApp(APP, { ruta: RUTA, ancho: 1280, alto: 1000, sinEsperarRoot: true, esperaFija: 5, antes: MOCK })
const informe = {}
try {
  debe(await esperar(adm, "document.querySelectorAll('[data-animacion-tarjeta]').length >= 20"), 'pagina', 'la página sale con su lista')
  debe(await esperar(adm, `Boolean(${IFR}?.contentWindow?.__estudioVisor?.listo)`, 160), 'marco', 'el marco carga y queda listo')

  // Un registro fotograma a fotograma dentro del marco: cuándo cambia cada insignia de fase y cuántos trozos lleva encendidos.
  const INSTALAR = `(() => { const w = ${IFR}.contentWindow; w.__reg = []; w.__t0 = null; if (w.__regVivo) return true; w.__regVivo = true; let ult = '';
    const paso = () => { const d = w.document; const raiz = d.querySelector('[data-visor-de-animacion]'); const act = raiz?.getAttribute('data-animacion-actual') || '';
      const ins = [...d.querySelectorAll('[data-insignia-partes]')].map((e) => e.getAttribute('data-insignia-partes') + ':' + e.getAttribute('data-ganados') + '/' + e.getAttribute('data-trozos'));
      const fases = [...d.querySelectorAll('[data-pedazo-fase]')].map((e) => e.getAttribute('data-pedazo-fase'));
      const cuentas = [...d.querySelectorAll('[data-cuenta-del-pedazo]')].map((e) => e.textContent);
      const k = act + '|' + ins.join(',') + '|' + fases.join(',') + '|' + cuentas.join(',');
      if (k !== ult) { ult = k; if (act && w.__t0 === null) w.__t0 = w.performance.now(); w.__reg.push({ t: w.performance.now(), act, ins, fases, cuentas, texto: (raiz?.innerText || '').replace(/\\s+/g, ' ').trim() }) }
      w.requestAnimationFrame(paso) }
    w.requestAnimationFrame(paso); return true })()`
  await adm.evaluar(INSTALAR)

  const jugar = async (id, ms) => {
    await adm.evaluar(`(() => { const w = ${IFR}.contentWindow; w.__reg.length = 0; w.__t0 = null; return true })()`)
    await toque(adm, `[data-animacion-tarjeta="${id}"]`)
    await esperar(adm, `${IFR}.contentDocument.querySelector('[data-visor-de-animacion]')?.getAttribute('data-animacion-actual') === '${id}'`, 60)
    await adm.esp(ms)
    return J(adm, `JSON.stringify((() => { const w = ${IFR}.contentWindow; const t0 = w.__t0 ?? 0; return { reg: w.__reg.map((r) => ({ ...r, t: +(((r.t - t0)) / 1000).toFixed(3) })), recursos: w.performance.getEntriesByType('resource').map((r) => r.name).filter((n) => /supabase\\.co|\\/api\\/logros|\\/rest\\/v1/.test(n)) } })())`)
  }
  const ultimo = (r, f) => [...r.reg].reverse().find(f)
  const primero = (r, f) => r.reg.find(f)
  const sacar = async (archivo) => {
    await adm.evaluar("document.querySelector('[data-marco-iphone]').scrollIntoView({ block: 'center' }); true")
    await adm.esp(250)
    await adm.captura(`${CAPTURAS}/${archivo}.jpg`)
  }

  // Los tiempos de las partituras (los que oye Eric) para compararlos con los de la animación.
  const tp = await J(adm, `import('/src/lib/sonidos/partituras.ts').then((P) => { const n = (id, a) => P.partituraDe(id).notas.filter((x) => x.tipo === 'archivo' && x.archivo === a).map((x) => x.golpe); return JSON.stringify({ colCierra: n('coleccion', 'coleccion')[0], pedClic: n('pedazo', 'clic')[0], pedBrillo: n('pedazo', 'brillo')[0] }) })`)

  // Calentamiento (la primera vez se descargan las piezas): no se cuenta.
  await jugar('coleccion', 600)

  /* ───────── 2. Colección completa: Las 4 joyas, 3 de 4 → 4 de 4 ───────── */
  console.log('2. Colección completa: las 4 joyas (3 de 4 → 4 de 4)')
  let r = await jugar('coleccion', 4200)
  informe.coleccion = r
  let a0 = primero(r, (x) => x.ins.some((i) => i.startsWith('cuatro_joyas')))
  debe(a0 && a0.ins[0] === 'cuatro_joyas:3/4', 'joyas', `antes de encajar la insignia lleva 3 de 4 trozos (${a0?.ins.join()})`)
  debe(a0 && a0.fases[0] === '0', 'joyas', 'empieza en la fase 0 (la insignia con lo que ya tenías)')
  let fin = ultimo(r, (x) => x.ins.length)
  debe(fin && fin.ins[0] === 'cuatro_joyas:4/4' && fin.fases[0] === '4', 'joyas', `después, el 4.º encaja y se enciende el círculo: 4 de 4 en la fase 4 (${fin?.ins.join()} fase ${fin?.fases.join()})`)
  debe(/4 DE 4 · COMPLETA/.test(fin?.texto ?? '') && !/0 DE 0/.test(fin?.texto ?? ''), 'joyas', `sale «4 DE 4 · COMPLETA», nunca «0 DE 0» (${(fin?.texto ?? '').slice(0, 140)})`)
  debe(/Las 4 joyas de Roma/.test(fin?.texto ?? '') && /Cuatro joyas, cuatro recuerdos para siempre/.test(fin?.texto ?? ''), 'joyas', 'con su título y su frase')
  const f2 = primero(r, (x) => x.fases[0] === '2')
  const f4 = primero(r, (x) => x.fases[0] === '4')
  debe(Boolean(primero(r, (x) => x.fases[0] === '1')) && Boolean(f2) && Boolean(primero(r, (x) => x.fases[0] === '3')) && Boolean(f4), 'joyas', 'el pedazo pasa por todas las fases: vuela (1), encaja (2), se llena de color (3) y queda (4)')
  debe(f4 && Math.abs(f4.t - tp.colCierra) < 0.25, 'sonido', `el golpe de la colección (${tp.colCierra.toFixed(2)} s) cae cuando se cierra el círculo (la fase 4 llega a los ${f4?.t.toFixed(2)} s)`)
  debe(r.recursos.length === 0, 'base', `la tarjeta no pide nada a Supabase ni a /api/logros (${r.recursos.join() || 'nada'})`)
  await sacar('coleccion_despues')

  /* ───────── 3. Colección completa: Los imprescindibles, 7 de 8 → 8 de 8 ───────── */
  console.log('3. Colección completa: los imprescindibles (7 de 8 → 8 de 8)')
  r = await jugar('coleccion_imprescindibles', 4200)
  informe.coleccion_imprescindibles = r
  a0 = primero(r, (x) => x.ins.some((i) => i.startsWith('imprescindibles')))
  debe(a0 && a0.ins[0] === 'imprescindibles:7/8', 'imprescindibles', `antes de encajar lleva 7 de 8 (${a0?.ins.join()})`)
  fin = ultimo(r, (x) => x.ins.length)
  debe(fin && fin.ins[0] === 'imprescindibles:8/8' && fin.fases[0] === '4', 'imprescindibles', `después, 8 de 8 en la fase 4 (${fin?.ins.join()})`)
  debe(/8 DE 8 · COMPLETA/.test(fin?.texto ?? '') && !/0 DE 0/.test(fin?.texto ?? '') && /Los imprescindibles de Roma/.test(fin?.texto ?? ''), 'imprescindibles', `«8 DE 8 · COMPLETA» con su título (${(fin?.texto ?? '').slice(0, 140)})`)
  debe(r.recursos.length === 0, 'base', 'sin peticiones a Supabase ni a /api/logros')
  await sacar('coleccion_imprescindibles_despues')

  /* ───────── 4. Pedazo: Los miradores, 1 de 3 → 2 de 3 ───────── */
  console.log('4. Pedazo nuevo: los miradores (1 de 3 → 2 de 3, el Janículo encaja)')
  r = await jugar('pedazo', 3800)
  informe.pedazo = r
  a0 = primero(r, (x) => x.ins.some((i) => i.startsWith('miradores')))
  debe(a0 && a0.ins[0] === 'miradores:1/3', 'miradores', `la insignia enseña lo que ya tenías: 1 de 3 (${a0?.ins.join()})`)
  debe(a0 && /^1 DE 3$/.test(a0.cuentas[0] ?? ''), 'miradores', `y la cuenta dice «1 DE 3» (${a0?.cuentas.join()})`)
  fin = ultimo(r, (x) => x.ins.length)
  debe(fin && fin.ins[0] === 'miradores:2/3' && fin.fases[0] === '4' && /^2 DE 3$/.test(fin.cuentas[0] ?? ''), 'miradores', `después: 2 de 3, fase 4, «2 DE 3» (${fin?.ins.join()} · ${fin?.cuentas.join()})`)
  debe(/Los miradores/.test(fin?.texto ?? '') && /Un pedazo nuevo/i.test(fin?.texto ?? ''), 'miradores', 'con su título y «Un pedazo nuevo»')
  const m2 = primero(r, (x) => x.fases[0] === '2')
  const m3 = primero(r, (x) => x.fases[0] === '3')
  debe(Boolean(primero(r, (x) => x.fases[0] === '1')) && Boolean(m2) && Boolean(m3), 'miradores', 'el pedazo nuevo vuela y encaja')
  informe.pedazoTiempos = { encaja: m2?.t, color: m3?.t, clic: tp.pedClic, brillo: tp.pedBrillo }
  debe(m2 && Math.abs(m2.t - tp.pedClic) < 0.25, 'sonido', `el clic del pedazo (${tp.pedClic.toFixed(2)} s) cae cuando encaja (fase 2 a los ${m2?.t.toFixed(2)} s)`)
  debe(m3 && Math.abs(m3.t + 0.05 - tp.pedBrillo) < 0.25, 'sonido', `el brillo (${tp.pedBrillo.toFixed(2)} s) cae cuando se llena de color (fase 3 a los ${m3?.t.toFixed(2)} s)`)
  debe(r.recursos.length === 0, 'base', 'sin peticiones a Supabase ni a /api/logros')
  await sacar('pedazo_despues')

  /* ───────── 5. Dos colecciones a la vez ───────── */
  console.log('5. Pedazos nuevos: el Coliseo en dos colecciones a la vez')
  r = await jugar('pedazo_dos', 5600)
  informe.pedazo_dos = r
  a0 = primero(r, (x) => x.ins.length >= 2)
  debe(a0 && a0.ins.join() === 'imprescindibles:1/8,roma_antigua:1/6', 'dos', `salen las dos insignias con lo que ya tenían (${a0?.ins.join()})`)
  fin = ultimo(r, (x) => x.ins.length)
  debe(fin && fin.ins.join() === 'imprescindibles:2/8,roma_antigua:2/6' && fin.fases.join() === '4,4', 'dos', `y las dos acaban encajadas: 2 de 8 y 2 de 6 (${fin?.ins.join()} fases ${fin?.fases.join()})`)
  debe(fin && fin.cuentas.join() === '2 DE 8,2 DE 6', 'dos', `con sus cuentas (${fin?.cuentas.join()})`)
  debe(/Pedazos nuevos/i.test(fin?.texto ?? '') && /Los imprescindibles de Roma/.test(fin?.texto ?? '') && /La Roma antigua/.test(fin?.texto ?? ''), 'dos', 'con el título «Pedazos nuevos» y los nombres de las dos colecciones')
  const seg = primero(r, (x) => x.fases[1] === '2')
  const pri = primero(r, (x) => x.fases[0] === '2')
  debe(pri && seg && seg.t - pri.t > 1.2 && seg.t - pri.t < 2.0, 'dos', `la segunda encaja unos 1,6 s después de la primera (${pri && seg ? (seg.t - pri.t).toFixed(2) : '?'} s)`)
  debe(r.recursos.length === 0, 'base', 'sin peticiones a Supabase ni a /api/logros')
  await sacar('pedazo_dos_despues')

  /* ───────── 6. Ninguna tarjeta del estudio sale vacía ───────── */
  console.log('6. Ninguna tarjeta del estudio sale vacía')
  const ids = await J(adm, `JSON.stringify([...document.querySelectorAll('[data-animacion-tarjeta]')].map((e) => e.getAttribute('data-animacion-tarjeta')))`)
  debe(ids.length >= 27, 'lista', `el estudio tiene sus 27 tarjetas (${ids.length})`)
  const vacias = []
  const ceros = []
  const peticiones = []
  let resumen = null
  for (const id of ids) {
    const rr = await jugar(id, id === 'sello' ? 1200 : id === 'resumen_viaje' ? 2500 : 1800)
    // La hoja del pasaporte descarga su mapa antes de pintarse (a veces tarda): se espera a que salga, hasta 10 s.
    if (id === 'sello') await esperar(adm, `(${IFR}.contentDocument.querySelector('[data-visor-de-animacion]')?.querySelectorAll('*').length ?? 0) > 8`, 40)
    const v = await J(adm, `JSON.stringify((() => { const d = ${IFR}.contentDocument; const raiz = d.querySelector('[data-visor-de-animacion]'); const t = (raiz?.innerText ?? '').replace(/\\s+/g, ' ').trim(); return { hijos: raiz?.children.length ?? 0, texto: t, dibujos: raiz?.querySelectorAll('*').length ?? 0 } })())`)
    // «Vacía» = ni un texto ni una pieza dibujada (los fuegos y la hoja del sello son puro dibujo: sin texto, pero con muchos elementos).
    // La hoja del pasaporte se pinta fuera del marco de la animación (en el cuerpo de la página): su texto («Italia») se lee de allí.
    if (id === 'sello') v.texto = await J(adm, `JSON.stringify((${IFR}.contentDocument.body.textContent ?? '').replace(/\\s+/g, ' ').trim().replace(/^.*?(Italia)/i, '$1').slice(0, 120))`)
    if (!(v.texto.length > 0 || v.dibujos > 8)) {
      vacias.push(id)
      console.log(`    (${id}: texto «${v.texto}», ${v.dibujos} elementos, ${v.hijos} hijos)`)
    }
    if (/\b0 DE 0\b/.test(v.texto)) ceros.push(id)
    if (rr.recursos.length) peticiones.push(id)
    if (id === 'sello') debe(/Italia/i.test(v.texto), 'sello', `la hoja del sello enseña Italia, no vacía (${v.texto})`)
    if (id === 'resumen_dia') resumen = v.texto
  }
  debe(vacias.length === 0, 'vacias', `ninguna tarjeta sale vacía en el marco (vacías: ${vacias.join(', ') || 'ninguna'})`)
  debe(ceros.length === 0, 'vacias', `ninguna enseña «0 DE 0» (${ceros.join(', ') || 'ninguna'})`)
  debe(peticiones.length === 0, 'base', `ninguna tarjeta pide a Supabase ni a /api/logros (${peticiones.join(', ') || 'ninguna'})`)
  debe(/Tu día en Roma/i.test(resumen ?? '') && /aún esconde 13 secretos/i.test(resumen ?? '') && /Te quedan 27 días/i.test(resumen ?? ''), 'resumen', `el resumen del día sale con su ciudad, su línea de secretos y los días para reclamar, no vacío (${resumen ?? ''})`)

  /* ───────── 7. El «antes»: lo que se veía sin estado (para el REPASO) ───────── */
  console.log('7. El «antes» (sin estado de ejemplo), solo para las capturas')
  await adm.evaluar(`${IFR}.contentWindow.Function("return import('/src/components/logros/momentos/api.ts')")().then((m) => { Object.defineProperty(m.datosDePrueba, 'estado', { get() { return null }, set() {}, configurable: true }); return true })`)
  for (const [id, ms] of [['coleccion', 4200], ['coleccion_imprescindibles', 4200], ['pedazo', 3800], ['pedazo_dos', 5600]]) {
    const ra = await jugar(id, ms)
    const f = ultimo(ra, (x) => x.ins.length || x.texto)
    informe[`${id}_antes`] = f?.texto ?? ''
    await sacar(`${id}_antes`)
  }
  const antesCol = informe.coleccion_antes ?? ''
  debe(/0 DE 0|COMPLETA/.test(antesCol) || !/4 DE 4/.test(antesCol), 'antes', `(control) sin estado la colección NO decía «4 DE 4»: así salía vacía (${antesCol.slice(0, 100)})`)
  fs.writeFileSync(`${CAPTURAS}/informe.json`, JSON.stringify({ tiempos: tp, ...informe.pedazoTiempos && { pedazoTiempos: informe.pedazoTiempos }, antes: { coleccion: informe.coleccion_antes, pedazo: informe.pedazo_antes } }, null, 1))
} finally {
  adm.cerrar()
}

console.log(`\nPrueba de la Tanda V37C: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
