// La prueba de la Tanda V8: RETOQUES DEL PERFIL (`Perfil Zona` de Design: el bloque del viajero en una tarjeta blanca, la hoja «Elige tu título», «Mis viajes» con el lápiz y las tarjetas sin «Hecho»,
// y «Mi vitrina» con el [+] pequeño), con aire entre bloques.
//   APP_URL=http://localhost:5199 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV8.mjs
// Capturas en docs/dias/V8_capturas/ (sin tocar ningún dato de producción: demo de logros).
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
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
const APP = process.env.APP_URL ?? 'http://localhost:5199'
const CAPTURAS = 'docs/dias/V8_capturas'
fs.mkdirSync(CAPTURAS, { recursive: true })

/* ───────── 1. El código ───────── */
console.log('1. El código')
{
  const cuerpo = sinComentarios(leer('src/components/logros/pantallas/perfil/CuerpoConLogros.tsx'))
  const tarjeta = sinComentarios(leer('src/components/logros/pantallas/perfil/TarjetaDeViaje.tsx'))
  const lapiz = sinComentarios(leer('src/components/perfil/BotonEditarViajes.tsx'))
  debe(/data-tarjeta-del-viajero/.test(cuerpo) && /background: '#FFFDF8'/.test(cuerpo) && /borderRadius: 30/.test(cuerpo), 'viajero', 'el bloque del viajero va en una tarjeta blanca de esquinas de 30')
  debe(!/Icono nombre="abajo"/.test(cuerpo), 'título', 'fuera la flecha de desplegable del título')
  debe(/Te faltan \$\{miles\(exp\.falta\)\} EXP para el nivel/.test(leer('src/components/logros/pantallas/perfil/NivelYBarra.tsx')), 'barra', '«Te faltan N EXP para el nivel N»')
  debe(/width: 34, height: 34/.test(lapiz) && /M4 20l1-4L16\.5 4\.5/.test(lapiz) && !/>\s*\{editando \? 'Hecho' : 'Editar'\}\s*</.test(lapiz), 'lápiz', 'el lápiz redondo de 34 px (no el texto «Editar»)')
  debe(!/'Hecho' : TEXTO_DE_ETIQUETA/.test(tarjeta) && /\{!hecho && \(/.test(tarjeta), 'tarjeta', 'sin la etiqueta «Hecho»')
  debe(!/Abrir este viaje\s*$/m.test(tarjeta.replace(/aria-label[^\n]*/g, '')) && /data-flecha-del-viaje/.test(tarjeta), 'tarjeta', 'la flecha redonda sustituye al botón [Abrir este viaje]')
  debe(/data-mas-de-vitrina/.test(cuerpo) && /h-\[38px\] w-\[38px\]/.test(cuerpo) && /dashed rgba\(243,213,154,\.4\)/.test(cuerpo), 'vitrina', 'el [+] de 38 px y los huecos con borde de puntos')
  debe(/marginTop: 40/.test(cuerpo) && /margin: '40px 20px 0'/.test(cuerpo), 'aire', 'más aire entre bloques que en Design (40 px; Design deja 14)')
}

/* ───────── 2. La pantalla ───────── */
console.log('2. La pantalla (móvil de 390 px, demo de logros)')
const preparar = async () => {
  const app = await abrirApp(APP, { ancho: 390, alto: 844, ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
  const ev = (js) => app.evaluar(js)
  const esperar = async (js, intentos = 40, ms = 400) => {
    for (let i = 0; i < intentos; i++) {
      if (await ev(js).catch(() => false)) return true
      await app.esp(ms)
    }
    return false
  }
  for (let i = 0; i < 120 && !(await ev("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await app.esp(500)
  for (let i = 0; i < 60 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await app.esp(500)
  await ev("window.__imp = (p) => { const e = performance.getEntriesByType('resource').map((r) => r.name).find((n) => n.includes(p)); return import(e ?? p) }; true")
  await ev('window.__rutaPrueba().then(() => true)')
  await esperar("__imp('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))", 90, 1000)
  await app.esp(3000)
  for (let i = 0; i < 6; i++) {
    const hecho = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await app.esp(700)
  }
  await ev("window.__miPerfil.getState().poner({ nombre: 'ALICE' }); true")
  // Tres viajes: uno en curso, uno próximo y uno ya hecho (copias del viaje de pruebas con otras fechas).
  await ev(`Promise.all([__imp('/src/store/useRouteStore.ts'), __imp('/src/store/useSyncStore.ts'), __imp('/src/components/sync/TripSync.tsx')]).then(([r, s, t]) => {
    const base = t.buildTripPayload()
    const hoy = new Date()
    const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
    const mas = (n) => new Date(hoy.getTime() + n * 86400000)
    const crear = (id, destino, ini, fin) => ({ ...base, id, route: { ...base.route, id, destination: destino, answers: { ...base.route.answers, dateRange: { start: iso(mas(ini)), end: iso(mas(fin)) } } }, generationState: null })
    s.useSyncStore.getState().setSavedTrips([crear('t-curso', 'Florencia', -1, 2), crear('t-prox', 'París', 40, 43), crear('t-hecho', 'Roma', -60, -57)])
    return true
  })`)
  await app.esp(1500)
  return { app, ev, esperar }
}
const abrirPerfil = async ({ ev, esperar, app }) => {
  await ev("__imp('/src/store/usePerfilUi.ts').then((m) => { m.usePerfilUi.getState().abrir(); return true })")
  await esperar("Boolean(document.querySelector('[data-fila-de-viajes]'))", 60, 300)
  await app.esp(1200)
}
const cerrarPerfil = async ({ ev, app }) => {
  await ev("__imp('/src/store/usePerfilUi.ts').then((m) => { m.usePerfilUi.getState().cerrar?.(); return true })").catch(() => undefined)
  await app.esp(500)
}
const foto = async (app, nombre) => {
  const r = await app.captura?.(`${CAPTURAS}/${nombre}.jpg`)
  return r
}

{
  const P = await preparar()
  const { app, ev, esperar } = P
  try {
    await abrirPerfil(P)
    // 2a. Con título (el viajero de ejemplo lo tiene) y con logros.
    const o = await ev(`(() => {
      const d = document.querySelector('[role="dialog"][aria-label="Perfil"]')
      const r = (sel) => { const e = d.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { t: Math.round(b.top), b: Math.round(b.bottom), l: Math.round(b.left), r: Math.round(b.right), w: Math.round(b.width), h: Math.round(b.height) } }
      const tar = d.querySelector('[data-tarjeta-del-viajero]')
      const cs = tar ? getComputedStyle(tar) : null
      const lineaEl = d.querySelector('[data-exp-linea]')
      const tit = d.querySelector('[data-titulo-del-perfil]')
      return {
        tarjeta: r('[data-tarjeta-del-viajero]'), fondo: cs?.backgroundColor, radio: cs?.borderTopLeftRadius,
        dentro: { avatar: Boolean(tar?.querySelector('[data-editar-perfil]')), hola: tar?.querySelector('h2')?.innerText, nivel: tar?.querySelector('[data-nivel-y-rango]')?.innerText, titulo: tit?.innerText?.trim(), barra: Boolean(tar?.querySelector('[role="progressbar"]')), linea: lineaEl?.innerText },
        izq: d.querySelector('[data-exp-numeros]')?.innerText, der: d.querySelector('[data-exp-falta]')?.innerText,
        flechaTitulo: Boolean(tit?.querySelector('svg:not([data-chapa])') && /abajo/.test(tit.innerHTML)),
        viajes: r('[data-mis-viajes]'), filaViajes: r('[data-fila-de-viajes]'), vitrina: r('[data-vitrina-del-perfil]'),
        lapiz: r('[data-editar-viajes]'), lapizLabel: d.querySelector('[data-editar-viajes]')?.getAttribute('aria-label'), lapizTexto: d.querySelector('[data-editar-viajes]')?.innerText,
        ver: d.querySelector('[data-numero-de-viajes]')?.innerText,
        tarjetas: Array.from(d.querySelectorAll('[data-tarjeta-de-viaje]')).map((c) => ({ id: c.dataset.tarjetaDeViaje, etiqueta: c.querySelector('[data-etiqueta-texto]')?.innerText ?? null, texto: c.innerText.split(String.fromCharCode(10)).join(' | '), flecha: (() => { const f = c.querySelector('[data-flecha-del-viaje]'); if (!f) return null; const b = f.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height) } })(), boton: Boolean(c.querySelector('[data-abrir-este-viaje]')), camara: Boolean(c.querySelector('[data-cambiar-portada]')) })),
        huecos: Array.from(d.querySelectorAll('[data-hueco-de-vitrina]')).map((h) => h.dataset.huecoDeVitrina),
        horizontal: d.scrollWidth <= d.clientWidth + 1,
      }
    })()`)
    debe(Boolean(o.tarjeta) && /255, 253, 248/.test(o.fondo ?? '') && o.radio === '30px', 'viajero', `tarjeta blanca de 30 de radio (${o.fondo}, ${o.radio})`)
    debe(o.dentro.avatar && o.dentro.hola === 'Hola, Alice' && /^Nivel \d+ · \S+/.test(o.dentro.nivel ?? '') && o.dentro.barra, 'viajero', `dentro: avatar, «${o.dentro.hola}», «${o.dentro.nivel}» y la barra`)
    debe(Boolean(o.dentro.titulo) && !o.flechaTitulo, 'título', `el título como distintivo pequeño y sin flecha de desplegable («${o.dentro.titulo}»)`)
    debe(/^[\d.]+ \/ [\d.]+$/.test(o.izq ?? '') && /^Te faltan [\d.]+ EXP para el nivel \d+$/.test(o.der ?? ''), 'barra', `«${o.izq}» a la izquierda y «${o.der}» a la derecha`)
    debe(o.viajes.t - o.tarjeta.b >= 32, 'aire', `entre el bloque del viajero y «Mis viajes» hay ${o.viajes.t - o.tarjeta.b} px (≥ 32; Design deja 14)`)
    debe(o.vitrina.t - o.filaViajes.b >= 32, 'aire', `entre «Mis viajes» y «Mi vitrina» hay ${o.vitrina.t - o.filaViajes.b} px (≥ 32; Design deja 14)`)
    debe(o.lapiz && o.lapiz.w === 34 && o.lapiz.h === 34 && o.lapizLabel === 'Editar' && !/Editar/.test(o.lapizTexto ?? ''), 'lápiz', `el lápiz redondo junto al título (${JSON.stringify(o.lapiz)}, «${o.lapizLabel}»)`)
    debe(/^Ver todos \(\d+\)$/.test(o.ver ?? ''), 'viajes', `«${o.ver}» a la derecha`)
    debe(o.tarjetas.length >= 3 && o.tarjetas.every((t) => t.flecha && t.flecha.w === 30 && !t.boton === false && t.camara), 'viajes', `cada tarjeta lleva la flecha redonda de 30 y la cámara (${o.tarjetas.length} tarjetas)`)
    const hecho = o.tarjetas.find((t) => t.id === 't-hecho')
    debe(hecho && hecho.etiqueta === null && !/Hecho|Abrir este viaje/.test(hecho.texto), 'viajes', `el viaje hecho: sin etiqueta «Hecho» ni botón (${hecho?.texto})`)
    debe(o.tarjetas.filter((t) => t.id === 't-curso' || t.id === 't-prox').every((t) => t.etiqueta), 'viajes', 'el en curso y el próximo conservan su etiqueta')
    debe(o.tarjetas.every((t) => /\d+ paradas?/.test(t.texto)), 'viajes', `«N paradas» debajo de cada foto (${o.tarjetas[0]?.texto})`)
    debe(o.huecos.length === 3 && o.huecos.filter((h) => h === 'pieza').length === 3, 'vitrina', `con logros: 3 piezas (${o.huecos.join(',')})`)
    debe(o.horizontal, 'pantalla', 'sin desbordar de lado')
    await app.captura?.(`${CAPTURAS}/perfil_con_titulo.jpg`)

    // 2b. La hoja «Elige tu título»: cambiar y que se guarde.
    await ev("document.querySelector('[data-titulo-del-perfil]').click(); true")
    await esperar("Boolean(document.querySelector('[data-elegir-titulo]'))", 20, 300)
    await app.esp(500)
    const h = await ev(`(() => { const hoja = document.querySelector('[data-elegir-titulo]'); const filas = Array.from(hoja.querySelectorAll('[data-titulo]')); return { n: filas.length, texto: hoja.innerText.split(String.fromCharCode(10)).join(' | ').slice(0, 300), elegido: filas.filter((f) => f.getAttribute('aria-pressed') === 'true').length, chapas: filas.every((f) => f.querySelector('svg,img,canvas')), claves: filas.map((f) => f.dataset.titulo), actual: document.querySelector('[data-titulo-del-perfil]').innerText.trim() } })()`)
    debe(h.n >= 2 && h.elegido === 1 && h.chapas && /Elige tu título/.test(h.texto), 'hoja', `la hoja «Elige tu título» con ${h.n} títulos, cada uno con su chapa y el elegido marcado`)
    await app.captura?.(`${CAPTURAS}/hoja_titulos.jpg`)
    const otra = h.claves.find((c) => true) // el primero distinto del actual
    const ids = await ev(`Array.from(document.querySelectorAll('[data-elegir-titulo] [data-titulo]')).map((f) => ({ c: f.dataset.titulo, on: f.getAttribute('aria-pressed') === 'true' }))`)
    const nuevo = ids.find((x) => !x.on)
    await ev(`document.querySelector('[data-elegir-titulo] [data-titulo="${nuevo.c}"]').click(); true`)
    await app.esp(900)
    const tras = await ev(`({ hoja: Boolean(document.querySelector('[data-elegir-titulo]')), badge: document.querySelector('[data-titulo-del-perfil]').innerText.trim() })`)
    debe(!tras.hoja && tras.badge && tras.badge !== h.actual, 'hoja', `al elegir otro la hoja se cierra y el distintivo cambia («${h.actual}» → «${tras.badge}»)`)
    // Se guardó: cerrar y volver a abrir el Perfil.
    await ev("document.querySelector('[aria-label=\"Cerrar el Perfil\"]').click(); true")
    await app.esp(900)
    await abrirPerfil(P)
    const guardado = await ev("document.querySelector('[data-titulo-del-perfil]')?.innerText.trim()")
    debe(guardado === tras.badge, 'hoja', `el título elegido se guarda al volver a abrir el Perfil («${guardado}»)`)

    // 2c. El lápiz: enseña las papeleras y vuelve.
    await ev("document.querySelector('[data-editar-viajes]').click(); true")
    await app.esp(600)
    const ed = await ev("({ papeleras: document.querySelectorAll('[data-eliminar-viaje]').length, modo: document.querySelector('[data-editar-viajes]').dataset.editarViajes, label: document.querySelector('[data-editar-viajes]').getAttribute('aria-label'), boton: document.querySelector('[data-abrir-este-viaje]').disabled })")
    debe(ed.papeleras >= 3 && ed.modo === 'hecho' && ed.label === 'Hecho', 'lápiz', `el lápiz hace lo de [Editar]: ${ed.papeleras} papeleras y pasa a «Hecho»`)
    await ev("document.querySelector('[data-editar-viajes]').click(); true")
    await app.esp(500)
    const ed2 = await ev("({ papeleras: document.querySelectorAll('[data-eliminar-viaje]').length, modo: document.querySelector('[data-editar-viajes]').dataset.editarViajes })")
    debe(ed2.papeleras === 0 && ed2.modo === 'editar', 'lápiz', 'al tocarlo otra vez vuelve a la normalidad')

    // 2d. Tocar la tarjeta abre el viaje (la de «Hecho», sin el botón de antes).
    await ev("document.querySelector('[data-tarjeta-de-viaje=\"t-hecho\"] [data-viaje-del-perfil]').scrollIntoView({ inline: 'center' }); true")
    await app.esp(400)
    await ev("document.querySelector('[data-tarjeta-de-viaje=\"t-hecho\"] [data-viaje-del-perfil]').click(); true")
    await app.esp(1500)
    const pilaHecho = await ev("__imp('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => m.useLogrosPantallas.getState().pila.length)")
    debe(pilaHecho >= 1, 'tarjeta', `tocar la foto de un viaje ya hecho lo abre por dentro, como [Abrir este viaje] de antes (pila ${pilaHecho})`)
    await ev("__imp('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().cerrarTodo(); return true })").catch(() => undefined)
    // y la flecha (la fila de abajo) también.
    await abrirPerfil(P)
    await ev("document.querySelector('[data-tarjeta-de-viaje=\"t-prox\"] [data-abrir-este-viaje]').click(); true")
    await app.esp(1500)
    const abierto2 = await ev("__imp('/src/store/useSyncStore.ts').then((m) => ({ activo: m.useSyncStore.getState().activeTripId, perfil: Boolean(document.querySelector('[role=\"dialog\"][aria-label=\"Perfil\"]')) }))")
    debe(abierto2.activo === 't-prox' || !abierto2.perfil, 'tarjeta', `tocar la fila de abajo (la flecha) abre el viaje (activo: ${abierto2.activo})`)

    // 2e. El Perfil de nivel 1: sin título y sin logros (los huecos con borde de puntos).
    await ev(`Promise.all([__imp('/src/lib/logrosDemo_perfil.ts')]).then(([m]) => { m.ponerPerfilDemo({ exp: m.expDeEjemplo(m.expEnNivel(1, 40)), titulo: null, titulos: [], vitrina: { logros: 0, recientes: [] } }); return true })`)
    await ev("try { for (const k of Object.keys(localStorage)) if (/perfil:ultimo/.test(k)) localStorage.removeItem(k) } catch {} ; true")
    await abrirPerfil(P).catch(() => undefined)
    await ev("document.querySelector('[aria-label=\"Cerrar el Perfil\"]')?.click(); true")
    await app.esp(700)
    await abrirPerfil(P)
    const n1 = await ev(`(() => { const d = document.querySelector('[role="dialog"][aria-label="Perfil"]'); return { titulo: Boolean(d.querySelector('[data-titulo-del-perfil]')), nivel: d.querySelector('[data-nivel-y-rango]')?.innerText, huecos: Array.from(d.querySelectorAll('[data-hueco-de-vitrina]')).map((h) => h.dataset.huecoDeVitrina), mas: (() => { const b = d.querySelector('[data-mas-de-vitrina]')?.getBoundingClientRect(); return b ? { w: Math.round(b.width), h: Math.round(b.height) } : null })(), pill: d.querySelector('[data-abrir-vitrina]')?.innerText.trim(), dashed: Array.from(d.querySelectorAll('[data-hueco-de-vitrina="vacio"] span')).some((s) => getComputedStyle(s).borderTopStyle === 'dashed') } })()`)
    debe(!n1.titulo, 'nivel 1', 'sin títulos ganados, no sale el distintivo')
    debe(/^Nivel 1 ·/.test(n1.nivel ?? ''), 'nivel 1', `«${n1.nivel}»`)
    debe(n1.huecos.join(',') === 'vacio,mas,vacio' && n1.mas && n1.mas.w === 38 && n1.mas.h === 38 && n1.dashed, 'vitrina', `sin logros: hueco de puntos, [+] de 38 px y hueco de puntos (${n1.huecos.join(',')})`)
    debe(/^0 logros/.test(n1.pill ?? ''), 'vitrina', `«${n1.pill}»`)
    await app.captura?.(`${CAPTURAS}/perfil_nivel_1.jpg`)
    // El [+] lleva a la vitrina.
    await ev("document.querySelector('[data-mas-de-vitrina]').click(); true")
    await app.esp(1200)
    const pila = await ev("__imp('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => m.useLogrosPantallas.getState().pila.length)")
    debe(pila >= 1, 'vitrina', `el [+] abre la pantalla de «Todos mis logros» (pila ${pila})`)
  } finally {
    await app.cerrar()
  }
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
