// La prueba de la Tanda V35B (PANTALLA del panel y del mapa): Destinos pedidos con los botones encendidos, Ventas con comisión, devoluciones y clics, el interruptor «Sin cuentas de prueba», «Cuentas que no cuentan» en Herramientas,
// los Próximamente del mapa y los clics de afiliados; y todo SIN la 0091 (los botones salen apagados con «Pronto»). Con el servidor de mentira de la demo (?logrosDemo=1): ningún dato de nadie, nada contra producción.
//   APP_URL=http://localhost:5173 node scripts/destino/pruebaV35B_pantalla.mjs      (con Vite en 5173)
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
const clic = (a, sel) => a.evaluar(`(() => { const e = document.querySelector('${sel}'); if (!e) return false; e.click(); return true })()`)
const RUTA = (p) => `${p}?cuentas=on&logros=on&logrosDemo=1&apertura=0`
const SIN_0091 = "try{sessionStorage.setItem('trazo:demo-sin-0091','1')}catch(e){}"
const escribir = (a, sel, texto) =>
  a.evaluar(`(() => { const e = document.querySelector('${sel}'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(e, ${JSON.stringify(texto)}); e.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)

if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('(sin Vite: la prueba de pantalla se salta)')
  console.log(`\nPrueba de la Tanda V35B (pantalla): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}

/* ───────── 1. Destinos pedidos: los botones encendidos ───────── */
console.log('1. Destinos pedidos: [Pasar a Próximamente], [Quitar], [+ Añadir un destino], [Avisar] solo si está publicado')
{
  const a = await abrirApp(APP, { ruta: RUTA('/admin/destinos'), ancho: 1280, alto: 1100, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(a, "Boolean(document.querySelector('[data-pedido]'))"), 'destinos', 'Destinos pedidos sale')
    const m = await J(a, `JSON.stringify({ anadir: document.querySelector('[data-anadir-destino]').disabled, pasar: [...document.querySelectorAll('[data-pasar-proximamente]')].map((b) => b.disabled), quitar: [...document.querySelectorAll('[data-quitar]')].map((b) => b.disabled), pronto: document.querySelectorAll('[data-pronto]').length })`)
    debe(m.anadir === false && m.pasar.length > 0 && m.pasar.every((x) => x === false) && m.quitar.length === 3 && m.quitar.every((x) => x === false) && m.pronto === 0, 'botones', 'con la 0091 los tres botones están encendidos y no sale «Pronto»')
    // Avisar solo si ya está publicado
    const av = await J(a, `JSON.stringify({ pedidos: [...document.querySelectorAll('[data-pedido]')].map((e) => ({ d: e.getAttribute('data-pedido'), avisar: e.querySelector('[data-avisar]')?.disabled ?? null, aun: Boolean(e.querySelector('[data-aun-no-esta]')) })), prox: [...document.querySelectorAll('[data-proximamente]')].map((e) => ({ d: e.getAttribute('data-proximamente'), ya: e.querySelector('[data-ya-disponible]').disabled, aun: Boolean(e.querySelector('[data-aun-no-esta]')) })) })`)
    const amsterdam = av.pedidos.find((x) => x.d === 'Ámsterdam')
    debe(amsterdam && amsterdam.avisar === true && amsterdam.aun, 'avisar', '[Avisar] de un destino que aún no está en la app sale apagado, con «Aún no está en la app»')
    const flo = av.prox.find((x) => x.d === 'Florencia')
    const ber = av.prox.find((x) => x.d === 'Berlín')
    debe(flo && flo.ya === false && !flo.aun, 'avisar', '[Ya está disponible: avisarles] de uno ya publicado (Florencia) está encendido')
    debe(ber && ber.ya === true && ber.aun, 'avisar', '…y el de uno sin publicar (Berlín) sale apagado, con «Aún no está en la app»')
    // «En Próximamente» bien calculado: la etiqueta solo en los que están en Próximamente (y aún sin publicar)
    const etiquetas = await J(a, `JSON.stringify([...document.querySelectorAll('[data-pedido]')].map((e) => [e.getAttribute('data-pedido'), /En Próximamente/.test(e.innerText), Boolean(e.querySelector('[data-pasar-proximamente]'))]))`)
    debe(etiquetas.every(([, etiqueta, boton]) => !(etiqueta && boton)), 'dos_sitios', 'un destino nunca tiene a la vez la etiqueta «En Próximamente» y el botón [Pasar a Próximamente]')
    debe(etiquetas.find((x) => x[0] === 'Berlín')?.[1] === true && etiquetas.find((x) => x[0] === 'Ámsterdam')?.[1] === false, 'dos_sitios', '«En Próximamente» sale en Berlín (está) y no en Ámsterdam (no está)')
    // Pasar a Próximamente
    await clic(a, '[data-pasar-proximamente="Ámsterdam"]')
    debe(await esperar(a, "Boolean(document.querySelector('[data-proximamente=\"Ámsterdam\"]'))", 40), 'pasar', '[Pasar a Próximamente] lo mueve al bloque de Próximamente')
    const tras = await J(a, `JSON.stringify({ pedido: Boolean(document.querySelector('[data-pedido="Ámsterdam"]')), msg: document.querySelector('[data-mensaje-destinos]')?.textContent })`)
    const rotulo = await a.evaluar("/En Próximamente/.test(document.querySelector('[data-pedido=\"Ámsterdam\"]')?.innerText ?? '') && !document.querySelector('[data-pedido=\"Ámsterdam\"] [data-pasar-proximamente]')")
    debe(tras.pedido === true && rotulo === true && /Ámsterdam está ahora en Próximamente/.test(tras.msg ?? ''), 'pasar', `y su fila pasa a llevar «En Próximamente» en vez del botón: «${tras.msg}»`)
    // Quitar con confirmación
    await clic(a, '[data-quitar="Ámsterdam"]')
    debe(await esperar(a, "Boolean(document.querySelector('[data-confirmar-quitar]'))", 20), 'quitar', '[Quitar] pide confirmación')
    await clic(a, '[data-quitar-no]')
    await a.esp(300)
    debe((await a.evaluar("Boolean(document.querySelector('[data-proximamente=\"Ámsterdam\"]'))")) && !(await a.evaluar("Boolean(document.querySelector('[data-confirmar-quitar]'))")), 'quitar', 'con «No» se queda como estaba')
    await clic(a, '[data-quitar="Ámsterdam"]')
    await clic(a, '[data-quitar-si]')
    debe(await esperar(a, "!document.querySelector('[data-proximamente=\"Ámsterdam\"]')", 40), 'quitar', 'con «Sí, quitar» sale de Próximamente')
    // + Añadir un destino
    await clic(a, '[data-anadir-destino]')
    debe(await esperar(a, "Boolean(document.querySelector('[data-formulario-destino]'))", 20), 'anadir', '[+ Añadir un destino] abre nombre y país')
    await escribir(a, '[data-destino-nombre]', 'Tokio')
    await escribir(a, '[data-destino-pais]', 'Japón')
    await clic(a, '[data-guardar-destino]')
    debe(await esperar(a, "Boolean(document.querySelector('[data-proximamente=\"Tokio\"]'))", 40), 'anadir', 'con nombre y país se añade a Próximamente')
    const guardado = await J(a, 'JSON.stringify(window.__demoPanel.pedidos.filter((p) => p.startsWith("POST /api/admin/destinos/proximamente")))')
    debe(guardado.length >= 3, 'anadir', 'y todo pasa por el servidor del panel (/api/admin/destinos/proximamente)')
    await a.captura('docs/dias/V35B_capturas/panel_destinos.jpg')
  } finally {
    a.cerrar()
  }
}

/* ───────── 2. Ventas ───────── */
console.log('2. Ventas: comisión de Stripe, devoluciones y clics de afiliados')
{
  const a = await abrirApp(APP, { ruta: RUTA('/admin/ventas'), ancho: 1280, alto: 1100, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(a, "Boolean(document.querySelector('[data-bloque=\"afiliados\"]'))"), 'ventas', 'Ventas sale')
    const m = await J(a, `JSON.stringify({ texto: document.querySelector('[data-seccion="ventas"]').innerText, afil: document.querySelector('[data-bloque="afiliados"]').innerText, dev: document.querySelector('[data-compra="reembolsado"]') ? { fondo: getComputedStyle(document.querySelector('[data-compra="reembolsado"]')).backgroundColor, tachado: getComputedStyle(document.querySelector('[data-compra="reembolsado"]')).textDecorationLine } : null, pronto: document.querySelectorAll('[data-bloque="afiliados"] [data-pronto]').length })`)
    debe(/Comisión de Stripe: \d+,\d\d €/.test(m.texto) && /Devoluciones: 6,99 €/.test(m.texto) && /antes de impuestos/.test(m.texto), 'ventas', '«Lo que te queda» enseña la comisión de Stripe, las devoluciones y «antes de impuestos»')
    debe(m.dev && m.dev.tachado === 'line-through' && m.dev.fondo !== 'rgba(0, 0, 0, 0)' && m.dev.fondo !== 'transparent', 'ventas', `la devolución sale tachada y en rojo suave (${m.dev?.tachado}, ${m.dev?.fondo})`)
    debe(/Roma/.test(m.afil) && /24/.test(m.afil) && /11/.test(m.afil) && m.pronto === 0, 'afiliados', 'Ventas › Afiliados cuenta los clics por destino y tipo (Roma: 24 actividades, 11 hoteles)')
    await a.captura('docs/dias/V35B_capturas/panel_ventas.jpg')
  } finally {
    a.cerrar()
  }
}

/* ───────── 3. El interruptor «Sin cuentas de prueba» ───────── */
console.log('3. «Sin cuentas de prueba»: encendido por defecto y afecta a las cifras')
{
  const a = await abrirApp(APP, { ruta: RUTA('/admin'), ancho: 1280, alto: 900, sinEsperarRoot: true, esperaFija: 5, antes: "try{localStorage.removeItem('jutrip.panel.sin_pruebas')}catch(e){}" })
  try {
    debe(await esperar(a, "Boolean(document.querySelector('[data-sin-pruebas]'))"), 'interruptor', 'arriba del panel hay un interruptor «Sin cuentas de prueba»')
    const antes = await J(a, `JSON.stringify({ on: document.querySelector('[data-sin-pruebas]').checked, texto: document.querySelector('[data-interruptor-pruebas]').innerText, pedidos: window.__demoPanel.pedidos.filter((p) => p.includes('/api/admin/inicio?') && !p.includes('resumen')) })`)
    debe(antes.on === true && /Sin cuentas de prueba/.test(antes.texto) && antes.pedidos.length >= 1 && antes.pedidos.every((p) => !p.includes('sin_pruebas=0')), 'interruptor', 'está encendido por defecto y las peticiones piden las cifras sin ellas')
    await a.evaluar("window.__demoPanel.pedidos.length = 0; true")
    await clic(a, '[data-sin-pruebas]')
    debe(await esperar(a, "window.__demoPanel.pedidos.some((p) => p.includes('/api/admin/inicio?') && p.includes('sin_pruebas=0'))", 40), 'interruptor', 'al apagarlo se vuelven a pedir las cifras CON las cuentas de prueba (sin_pruebas=0)')
    debe((await a.evaluar("localStorage.getItem('jutrip.panel.sin_pruebas')")) === '0', 'interruptor', 'y se acuerda en este navegador')
    for (const ruta of ['/admin/ventas', '/admin/usuarios', '/admin/logros']) {
      await a.evaluar(`document.querySelector('[data-nav="${ruta.split('/')[2]}"]').click(); true`)
      await a.esp(600)
      debe(await a.evaluar("Boolean(document.querySelector('[data-sin-pruebas]'))"), 'interruptor', `el interruptor sigue arriba en ${ruta}`)
    }
    await a.evaluar("localStorage.removeItem('jutrip.panel.sin_pruebas'); true")
  } finally {
    a.cerrar()
  }
}

/* ───────── 4. Herramientas › Cuentas que no cuentan ───────── */
console.log('4. Herramientas › «Cuentas que no cuentan»')
{
  const a = await abrirApp(APP, { ruta: `${RUTA('/admin/logros')}&pestana=herramientas`, ancho: 1280, alto: 1100, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(a, "Boolean(document.querySelector('[data-herramienta=\"cuentas-que-no-cuentan\"]'))"), 'pruebas', 'Herramientas tiene «Cuentas que no cuentan»')
    await esperar(a, "Boolean(document.querySelector('[data-cuenta-de-prueba]'))", 20)
    const m = await J(a, `JSON.stringify({ lista: [...document.querySelectorAll('[data-cuenta-de-prueba]')].map((e) => e.getAttribute('data-cuenta-de-prueba')), admin: document.querySelector('[data-administradores]')?.textContent })`)
    debe(m.lista.includes('pruebas1@demo.test') && /no cuentan nunca/.test(m.admin ?? ''), 'pruebas', 'sale la cuenta de pruebas ya marcada y los administradores (no cuentan nunca)')
    await escribir(a, '[data-correo-de-prueba]', 'otra@example.com')
    await clic(a, '[data-marcar-prueba]')
    debe(await esperar(a, "Boolean(document.querySelector('[data-cuenta-de-prueba=\"otra@example.com\"]'))", 40), 'pruebas', 'marcar una cuenta por correo la añade a la lista')
    await clic(a, '[data-desmarcar-prueba="otra@example.com"]')
    debe(await esperar(a, "!document.querySelector('[data-cuenta-de-prueba=\"otra@example.com\"]')", 40), 'pruebas', 'desmarcarla la quita')
    await a.captura('docs/dias/V35B_capturas/panel_cuentas_de_prueba.jpg')
  } finally {
    a.cerrar()
  }
}

/* ───────── 5. SIN la 0091: «Pronto» y nada se rompe ───────── */
console.log('5. SIN la 0091 (migración sin aplicar): los botones nuevos salen apagados con «Pronto»')
{
  const a = await abrirApp(APP, { ruta: RUTA('/admin/destinos'), ancho: 1280, alto: 1100, sinEsperarRoot: true, esperaFija: 5, antes: SIN_0091 })
  try {
    debe(await esperar(a, "Boolean(document.querySelector('[data-pedido]'))"), 'sin_0091', 'Destinos pedidos sale sin la 0091')
    const m = await J(a, `JSON.stringify({ anadir: document.querySelector('[data-anadir-destino]').disabled, pasar: [...document.querySelectorAll('[data-pasar-proximamente]')].map((b) => b.disabled), quitar: [...document.querySelectorAll('[data-quitar]')].map((b) => b.disabled), texto: document.querySelector('[data-seccion="destinos"]').innerText, pronto: document.querySelectorAll('[data-pronto]').length })`)
    debe(m.anadir === true && m.pasar.every((x) => x === true) && m.quitar.every((x) => x === true) && /Pronto/.test(m.texto) && m.pronto >= 1, 'sin_0091', 'los tres botones salen apagados con «Pronto»')
    await a.captura('docs/dias/V35B_capturas/panel_destinos_sin_0091.jpg')
  } finally {
    a.cerrar()
  }
  const v = await abrirApp(APP, { ruta: RUTA('/admin/ventas'), ancho: 1280, alto: 1100, sinEsperarRoot: true, esperaFija: 5, antes: SIN_0091 })
  try {
    debe(await esperar(v, "Boolean(document.querySelector('[data-bloque=\"afiliados\"]'))"), 'sin_0091', 'Ventas sale sin la 0091')
    const m = await J(v, `JSON.stringify({ texto: document.querySelector('[data-seccion="ventas"]').innerText, pronto: document.querySelectorAll('[data-bloque="afiliados"] [data-pronto]').length })`)
    debe(/Comisión de Stripe: pronto/.test(m.texto) && m.pronto === 1 && /Pronto: los clics/.test(m.texto), 'sin_0091', 'la comisión sale «pronto» y los clics de afiliados «Pronto»')
  } finally {
    v.cerrar()
  }
  const h = await abrirApp(APP, { ruta: `${RUTA('/admin/logros')}&pestana=herramientas`, ancho: 1280, alto: 1100, sinEsperarRoot: true, esperaFija: 5, antes: SIN_0091 })
  try {
    debe(await esperar(h, "Boolean(document.querySelector('[data-herramienta=\"cuentas-que-no-cuentan\"] [data-pronto]'))", 60), 'sin_0091', 'Cuentas que no cuentan dice «Pronto» sin la 0091')
  } finally {
    h.cerrar()
  }
}

/* ───────── 6. El mapa lee los Próximamente de la base (y el JSON si no hay) y los clics de afiliados ───────── */
console.log('6. Los Próximamente del mapa y los clics en «Reservar»')
{
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0', ancho: 390, alto: 844, sinEsperarRoot: true, esperaFija: 5 })
  try {
    await a.esp(1500)
    const json = JSON.parse(fs.readFileSync('data/primera_vez/destinos.json', 'utf8'))
    const sinBase = await J(a, `import('/src/lib/primeraVez.ts').then((M) => JSON.stringify(M.destinosDelMapa([]).filter((d) => !d.listo).map((d) => d.clave)))`)
    debe(JSON.stringify(sinBase) === JSON.stringify(json.proximamente.map((d) => d.clave)), 'mapa', `sin lista de la base, el mapa sigue con los Próximamente del JSON (${sinBase.join(', ')})`)
    await a.evaluar("window.__proximamente = [{ clave: 'tokio', nombre: 'Tokio', pais: 'Japón', iso: 'jp', continente: 'Otros', lat: 35.68, lng: 139.69 }]; true")
    const conBase = await J(a, `import('/src/lib/primeraVez.ts').then((M) => JSON.stringify(M.destinosDelMapa([]).filter((d) => !d.listo).map((d) => d.clave)))`)
    debe(JSON.stringify(conBase) === JSON.stringify(['tokio']), 'mapa', `con la lista de la base el mapa enseña esos (${conBase.join(', ')}) y no los del JSON`)
    // Un destino ya listo en la app nunca sale además en gris.
    const doble = await J(a, `import('/src/lib/primeraVez.ts').then((M) => { window.__proximamente = [{ clave: 'roma', nombre: 'Roma', pais: 'Italia', iso: 'it', continente: 'Europa', lat: 41.9, lng: 12.5 }]; const l = M.destinosDelMapa([{ clave: 'roma', nombre: 'Roma', pais: 'Italia', iso: 'it', lat: 41.9, lng: 12.5 }]); return JSON.stringify(l.filter((d) => d.clave === 'roma').map((d) => d.listo)) })`)
    debe(JSON.stringify(doble) === JSON.stringify([true]), 'mapa', 'un destino listo en la app no sale además en gris')
    await a.evaluar('delete window.__proximamente; true')

    // Clics en «Reservar»: sin saber quién.
    await a.evaluar(`(() => {
      navigator.sendBeacon = () => true
      window.fetch = (u, i) => (String(u).includes('/api/afiliados/clic') ? Promise.resolve(new Response(null, { status: 204 })) : Promise.reject(new Error('sin red')))
      window.__clicsAfiliados = []
      const caja = document.createElement('div'); caja.setAttribute('data-destino-nombre', 'Roma'); caja.id = 'caja-clics'; document.body.appendChild(caja)
      for (const [id, href, hotel] of [['act', 'https://www.civitatis.com/es/roma/', false], ['hot', 'https://hoteles.example.test/x', true], ['otro', 'https://example.test/nada', false]]) {
        const e = document.createElement('a'); e.id = id; e.href = href; e.textContent = id; if (hotel) e.setAttribute('data-hotel', 'h1'); e.addEventListener('click', (ev) => ev.preventDefault()); caja.appendChild(e)
      }
      return true
    })()`)
    for (const id of ['act', 'hot', 'otro']) await clic(a, `#${id}`)
    const clics = await J(a, 'JSON.stringify(window.__clicsAfiliados)')
    debe(clics.length === 2 && clics[0].tipo === 'actividad' && clics[0].proveedor === 'civitatis' && clics[0].destino === 'Roma' && clics[1].tipo === 'hotel' && clics[1].proveedor === 'stay22', 'clics', 'un clic en Civitatis cuenta como actividad y uno en un hotel como hotel, por destino; un enlace cualquiera no cuenta')
    debe(clics.every((c) => JSON.stringify(Object.keys(c).sort()) === JSON.stringify(['destino', 'proveedor', 'tipo'])), 'clics', 'el aviso lleva SOLO destino, tipo y proveedor: ni cuenta, ni IP, ni aparato')
  } finally {
    a.cerrar()
  }
}

console.log(`\nPrueba de la Tanda V35B (pantalla): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
