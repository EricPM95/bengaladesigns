// La prueba de la Tanda V20: EL BOTÓN «CUÉNTANOS» (docs/dias/PROMPT_V20_CUENTANOS.md), la parte de la APP (la del servidor está en pruebaV20_servidor.mjs).
//   node scripts/destino/_conCola.mjs node scripts/destino/pruebaV20.mjs      (hace falta Vite en 5173 y la API en 8787; ningún aviso llega al servidor: la prueba intercepta las llamadas)
//  1. Las reglas puras (qué se puede enviar, qué datos salen, los textos)   2. El código   3. En un Chrome: el botón, las 8 pantallas, el mapa, la captura, sin red…
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'
import { FALLOS, TIPOS, avisoValido, borradorVacio, datosDelAviso, textosDeGracias } from '../../src/lib/cuentanos/tipos.ts'

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
const CAP = 'docs/dias/V20_capturas'
fs.mkdirSync(CAP, { recursive: true })

/* ───────── 1. Las reglas puras ───────── */
console.log('1. Qué se puede enviar y qué datos salen')
{
  debe(TIPOS.length === 8 && TIPOS.map((t) => t.id).join() === 'restaurante,lugar,destino,foto,dato_mal,consejo,no_funciona,idea', 'tipos', 'los 8 botones de U1, en su orden')
  debe(TIPOS.map((t) => t.boton).join('|') === 'Añadir un restaurante|Añadir un lugar|Añadir un destino|Comparte tu foto|Un dato está mal|Un consejo|Algo no funciona|Una idea', 'tipos', 'con los textos del prompt')
  const b = (o) => ({ ...borradorVacio(), ...o })
  debe(!avisoValido('restaurante', b({})) && avisoValido('restaurante', b({ nombre: 'Trattoria da Enzo' })), 'valido', 'restaurante: pide el nombre; el resto es opcional')
  debe(avisoValido('lugar', b({ nombre: 'Mirador del Gianicolo' })) && !avisoValido('lugar', b({ nombre: 'a' })), 'valido', 'lugar: pide el nombre')
  debe(!avisoValido('dato_mal', b({ sitio: { nombre: 'Coliseo' } })) && avisoValido('dato_mal', b({ sitio: { nombre: 'Coliseo' }, falla: 'horario' })), 'valido', 'dato mal: el sitio y qué falla (lo demás, opcional)')
  debe(avisoValido('consejo', b({ sitio: { nombre: 'Coliseo' }, consejo: 'Llega antes de las 9' })) && !avisoValido('consejo', b({ sitio: { nombre: 'Coliseo' } })), 'valido', 'consejo: el sitio y el consejo')
  debe(avisoValido('no_funciona', b({ que: 'Toqué Días y se quedó en blanco' })) && !avisoValido('no_funciona', b({})), 'valido', 'algo no funciona: qué tocó y qué pasó')
  debe(avisoValido('idea', b({ texto: 'Un modo oscuro' })) && !avisoValido('idea', b({})), 'valido', 'idea: solo el texto')
  debe(avisoValido('destino', b({ destino: 'Lisboa' })) && !avisoValido('destino', b({ destino: '' })), 'valido', 'destino: el destino (y cuándo, que ya viene puesto)')
  const foto = b({ sitio: { nombre: 'Coliseo' }, nombreEnFoto: 'Laura G.', acepta: false })
  debe(!avisoValido('foto', foto, 1) && avisoValido('foto', { ...foto, acepta: true }, 1), 'casilla', '«Comparte tu foto» NO se puede enviar sin marcar la casilla; con ella, sí')
  debe(!avisoValido('foto', { ...foto, acepta: true }, 0), 'casilla', 'y tampoco sin foto')
  debe(FALLOS.map((f) => f.texto).join('|') === 'Horario|Precio|Está cerrado|Ubicación|La foto|Otro', 'falla', 'qué falla: Horario · Precio · Está cerrado · Ubicación · La foto · Otro')
  const d = datosDelAviso('restaurante', b({ nombre: ' Enzo ', precio: '€€', bueno: 'La carbonara' }))
  debe(d.nombre === 'Enzo' && d.precio === '€€' && d.bueno === 'La carbonara', 'datos', 'restaurante: nombre, precio y lo bueno, recortados')
  const f = datosDelAviso('foto', { ...foto, acepta: true })
  debe(f.acepta === true && f.nombre_en_foto === 'Laura G.' && f.sitio === 'Coliseo', 'datos', 'foto: el sitio, el nombre y el sí a la casilla')
  const g = textosDeGracias('destino', true, true, 'Lisboa')
  debe(g.titulo === '¡Apuntado! Te avisaremos cuando Lisboa esté en JUTRIP.' && g.sub === 'Te avisaremos en la campana', 'gracias', 'U2i: «¡Apuntado! Te avisaremos cuando Lisboa esté en JUTRIP.»')
  debe(textosDeGracias('idea', true, true).sub === 'Te avisaremos en la campana' && textosDeGracias('idea', false, true).sub === '' && textosDeGracias('idea', true, false).sub === '', 'gracias', 'U3: «Te avisaremos en la campana» solo si dejó el «Avísame» y tiene cuenta')
  debe(textosDeGracias('foto', true, true).titulo === '¡Gracias! Si la elegimos, saldrá en la app con tu nombre.', 'gracias', 'U2j: el gracias de la foto')
}

/* ───────── 2. El código ───────── */
console.log('2. El código')
{
  const app = leer('src/App.tsx')
  debe(app.includes('<CuentanosHost />') && !app.includes('<BotonCuentanos />') && fs.readFileSync('src/components/route/RouteScreen.tsx', 'utf8').includes('<BotonCuentanos />'), 'montaje', '(V28b) la hoja está montada una vez en App; el botón flotante, junto a la cámara y el trofeo, en RouteScreen (dentro del viaje)')
  debe(!fs.existsSync('src/components/proponerSitio/HojaProponerSitio.tsx') && /abrirCuentanos\(\{ tipo: 'lugar'/.test(leer('src/store/useProponerSitioStore.ts')), 'un_camino', '«Propón un sitio» ya no es una hoja aparte: abre U2b con el nombre ya escrito')
  debe(/abrirProponerSitio\(\{ nombre: limpio, origen: 'reservas' \}\)/.test(leer('src/components/route/reservas/OtraReservaBuscador.tsx')), 'un_camino', 'y lo que la abría (Añadir otra reserva) abre U2b')
  const envio = leer('src/lib/cuentanos/envio.ts')
  debe(/reducirFoto/.test(envio) && /fotosEnteras/.test(envio) && /guardarEnCola/.test(envio) && /vaciarCola/.test(envio) && /addEventListener\('online'/.test(envio), 'envio', 'fotos reducidas (enteras solo en «Comparte tu foto»), cola sin red y envío al volver la red')
  debe(/erroresRecientes\(\)/.test(leer('src/components/cuentanos/Cuentanos.tsx')) && /tacharLlaves/.test(envio), 'errores', '«Algo no funciona» manda los últimos errores, limpios con tacharLlaves')
  debe(/AvisosDeViajeros/.test(leer('src/components/logros/AdminLogros.tsx')) && /Destinos más pedidos/.test(leer('src/components/logros/AvisosDeViajeros.tsx')) && /Fotos de viajeros/.test(leer('src/components/logros/AvisosDeViajeros.tsx')), 'panel', 'el panel tiene «Avisos de viajeros», «Destinos más pedidos» y «Fotos de viajeros»')
  debe(/AVISO_DE_CUENTANOS_PRIVACIDAD/.test(leer('src/lib/privacidad.ts')), 'privacidad', 'la pantalla de Privacidad dice qué manda «Cuéntanos» y para qué')
  debe(/data-cuentanos-dato-mal/.test(leer('src/components/route/dayDetail/StopDetailSheet.tsx')), 'ficha', 'la ficha de un sitio tiene «Un dato está mal» con el sitio ya puesto')
}

/* ───────── 3. En un Chrome ───────── */
console.log('3. En la app')
{
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=off&apertura=0&version=completa', ancho: 390, alto: 844 })
  try {
    const ev = (js) => a.evaluar(js)
    for (let i = 0; i < 120 && !(await ev("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
    for (let i = 0; i < 60 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
    // Las llamadas de «Cuéntanos» se interceptan: ningún aviso de prueba llega al servidor.
    await ev(`(() => {
      window.__enviados = []; window.__sinRed = false
      const real = window.fetch.bind(window)
      window.fetch = async (url, init) => {
        const u = String(url)
        const propio = u.includes('/api/avisos-viajeros') || u.includes('/api/avisos/subida') || u.includes('subida-de-mentira')
        if (!propio) return real(url, init)
        if (window.__sinRed) throw new TypeError('Failed to fetch')
        if (u.includes('/api/avisos/subida')) { const n = JSON.parse(init.body).cuantas; return new Response(JSON.stringify({ ok: true, subidas: Array.from({ length: n }, (_, i) => ({ ruta: 'avisos/t' + Math.random().toString(36).slice(2, 7) + i + '.jpg', url: 'http://localhost/subida-de-mentira/' + i })) }), { status: 200, headers: { 'Content-Type': 'application/json' } }) }
        if (u.includes('subida-de-mentira')) return new Response('', { status: 200 })
        window.__enviados.push(JSON.parse(init.body))
        return new Response(JSON.stringify({ ok: true, id: 'aviso-' + window.__enviados.length }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      return true
    })()`)
    // Sin viaje ni cuenta: el botón ya está.
    debe(!(await ev("Boolean(document.querySelector('[data-boton-cuentanos]'))")), 'boton', '(V28b, decisión de Eric) sin viaje y sin cuenta el botón «Cuéntanos» NO sale: solo dentro del viaje')
    await ev('window.__rutaPrueba().then(() => true)')
    for (let i = 0; i < 60 && !(await ev("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
    await a.esp(4500)
    for (let i = 0; i < 4; i++) {
      const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(600)
    }
    // El botón está ENCIMA de los demás y mide lo mismo
    for (const modo of ['route', 'days', 'today']) {
      await ev(`import('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.getState().setActiveDayId(null); m.useRouteStore.getState().setMode('${modo}'); return true })`)
      await a.esp(2200)
      const pos = await ev(`(() => { const c = document.querySelector('[data-boton-cuentanos]'); if (!c) return null; const rc = c.getBoundingClientRect(); const otros = Array.from(document.querySelectorAll('[data-flotante]')).map((e) => e.getBoundingClientRect()); return { w: Math.round(rc.width), h: Math.round(rc.height), encima: otros.every((r) => rc.bottom <= r.top + 1), n: otros.length, x: Math.round(rc.right), xs: otros.map((r) => Math.round(r.right)) } })()`)
      debe(pos && pos.w === 44 && pos.h === 44 && pos.encima && pos.xs.every((x) => Math.abs(x - pos.x) <= 3), 'boton', `${modo}: «Cuéntanos» mide 44 px, va en la misma columna y ENCIMA de los otros ${pos?.n} flotantes`)
    }
    await ev("import('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.getState().setMode('route'); return true })")
    await a.esp(1500)
    await a.captura(`${CAP}/boton.jpg`)
    // U1
    await ev("document.querySelector('[data-boton-cuentanos]').click(); true")
    await a.esp(700)
    const u1 = await ev("({ titulo: document.querySelector('[data-titulo-cuentanos]')?.innerText, tipos: Array.from(document.querySelectorAll('[data-tipo-cuentanos]')).map((b) => b.dataset.tipoCuentanos) })")
    debe(u1.titulo === '¿Qué quieres contarnos?' && u1.tipos.join() === 'restaurante,lugar,destino,foto,dato_mal,consejo,no_funciona,idea', 'U1', `U1: «¿Qué quieres contarnos?» con los 8 botones (${u1.tipos.length})`)
    await a.captura(`${CAP}/U1_menu.jpg`)
    const foto = (sel) => `(async () => { const c = document.createElement('canvas'); c.width = 64; c.height = 48; c.getContext('2d').fillStyle = '#c96'; c.getContext('2d').fillRect(0, 0, 64, 48); const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg')); const f = new File([blob], 'foto.jpg', { type: 'image/jpeg' }); const dt = new DataTransfer(); dt.items.add(f); const i = document.querySelector('${sel}'); i.files = dt.files; i.dispatchEvent(new Event('change', { bubbles: true })); return true })()`
    const escribir = async (campo, texto) => ev(`(() => { const e = document.querySelector('[data-campo="${campo}"]'); const set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(e), 'value').set; set.call(e, ${JSON.stringify(texto)}); e.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
    const abrir = async (tipo) => {
      await ev(`document.querySelector('[data-tipo-cuentanos="${tipo}"]').click(); true`)
      await a.esp(500)
    }
    const enviar = async () => {
      await ev("document.querySelector('[data-enviar-cuentanos]').click(); true")
      await a.esp(1800)
    }
    const cerrar = async () => {
      await ev("(document.querySelector('[data-cerrar-gracias]') ?? document.querySelector('[data-hoja-cuentanos] button[aria-label=Cerrar]'))?.click(); true")
      await a.esp(400)
    }
    const ultimo = () => ev('window.__enviados[window.__enviados.length - 1]')

    // U2a restaurante (con foto reducida y el punto de «Buscar en el mapa»)
    await abrir('restaurante')
    debe(await ev("document.querySelector('[data-enviar-cuentanos]').disabled"), 'U2a', 'U2a: sin nombre, [Enviar] está apagado')
    await escribir('nombre', 'Trattoria da Enzo')
    await ev("document.querySelector('[data-ficha=\"€€\"]').click(); true")
    await ev(foto('[data-campo="foto"]'))
    await a.esp(300)
    await a.captura(`${CAP}/U2a_restaurante.jpg`)
    // U2h: el mapa
    await ev("document.querySelector('[data-donde=\"mapa\"]').click(); true")
    for (let i = 0; i < 40 && !(await ev("Boolean(document.querySelector('[data-mapa-del-aviso] .mapboxgl-canvas'))")); i++) await a.esp(500)
    await a.esp(2500)
    const mapa = await ev("({ pin: Boolean(document.querySelector('[data-pin-fijo]')), buscador: Boolean(document.querySelector('[data-buscar-mapa]')), boton: document.querySelector('[data-este-es-el-sitio]')?.innerText, dir: document.querySelector('[data-direccion-del-punto]')?.innerText })")
    debe(mapa.pin && mapa.buscador && mapa.boton === 'Este es el sitio', 'U2h', `U2h: el mapa a pantalla completa con el pin fijo, la búsqueda y [Este es el sitio] (dirección: ${mapa.dir})`)
    await a.captura(`${CAP}/U2h_mapa.jpg`)
    await ev("document.querySelector('[data-este-es-el-sitio]').click(); true")
    await a.esp(800)
    const punto = await ev("document.querySelector('[data-punto-elegido]')?.innerText ?? null")
    const nombreVuelta = await ev("document.querySelector('[data-campo=\"nombre\"]')?.value")
    const fotosVuelta = await ev("document.querySelectorAll('[data-quitar-foto]').length")
    debe(punto && nombreVuelta === 'Trattoria da Enzo' && fotosVuelta === 1, 'U2h', `el pin guarda su punto (${punto}) y al volver no se pierde lo escrito ni la foto`)
    await enviar()
    let e = await ultimo()
    debe(e && e.tipo === 'restaurante' && e.datos.nombre === 'Trattoria da Enzo' && e.datos.precio === '€€' && e.punto && Number.isFinite(e.punto.lat) && e.punto.lng !== undefined, 'U2a', `U2a: se manda con el nombre, el precio y el punto del mapa (${JSON.stringify(e?.datos)} ${JSON.stringify(e?.punto)?.slice(0, 60)})`)
    debe(e.fotos.length === 1 && /^avisos\//.test(e.fotos[0]), 'U2a', 'con su foto subida al almacén (reducida)')
    debe(e.destino === 'Roma' && e.pantalla && e.pestana === 'route' && e.version && e.dispositivo && e.navegador && /^\d{4}-\d\d-\d\dT/.test(e.hora) && 'avisame' in e, 'solo', `lo que se manda solo: destino ${e.destino}, pantalla ${e.pantalla}, pestaña ${e.pestana}, versión ${e.version}, móvil ${e.dispositivo}, navegador ${e.navegador}, hora`)
    const g1 = await ev("document.querySelector('[data-gracias]')?.innerText")
    debe(g1 === 'Gracias. Lo revisamos y, si encaja, lo añadimos.', 'U3', `U3: «${g1}»`)
    await a.captura(`${CAP}/U3_gracias.jpg`)
    await cerrar()

    // U2b lugar (la hoja de «Propón un sitio»: abre con el nombre ya escrito)
    await ev("import('/src/store/useProponerSitioStore.ts').then((m) => { m.abrirProponerSitio({ nombre: 'Café Procope', origen: 'prueba' }); return true })")
    await a.esp(600)
    debe((await ev("document.querySelector('[data-campo=\"nombre\"]')?.value")) === 'Café Procope' && /Añadir un lugar/.test(await ev("document.querySelector('[data-titulo-cuentanos]')?.innerText")), 'U2b', '«Propón un sitio» abre U2b con el nombre ya escrito')
    await escribir('porque', 'Es el café más antiguo')
    await a.captura(`${CAP}/U2b_lugar.jpg`)
    await enviar()
    e = await ultimo()
    debe(e.tipo === 'lugar' && e.datos.nombre === 'Café Procope' && e.datos.porque === 'Es el café más antiguo' && e.pestana !== undefined, 'U2b', 'U2b: nombre y «¿Por qué merece la pena?»')
    await cerrar()

    // U2c: un dato está mal desde una ficha (el sitio ya va puesto)
    await ev("import('/src/store/useCuentanosStore.ts').then((m) => { m.abrirCuentanos({ tipo: 'dato_mal', sitio: { nombre: 'Coliseo' }, origen: 'ficha', parada: 'p1' }); return true })")
    await a.esp(600)
    debe((await ev("document.querySelector('[data-sitio-puesto]')?.innerText")) === 'Coliseo', 'U2c', 'U2c: desde una ficha, el sitio ya va puesto')
    await ev("document.querySelector('[data-ficha=\"horario\"]').click(); true")
    await escribir('mas', 'Ahora cierra a las 18:00')
    await a.captura(`${CAP}/U2c_dato_mal.jpg`)
    await enviar()
    e = await ultimo()
    debe(e.tipo === 'dato_mal' && e.datos.sitio === 'Coliseo' && e.datos.falla === 'horario' && e.datos.mas === 'Ahora cierra a las 18:00' && e.parada === 'p1', 'U2c', 'se manda con el sitio, qué falla, lo de más y la parada de la que venía')
    await cerrar()
    // U2d: desde cualquier pantalla, con buscador
    await abrir('dato_mal').catch(() => undefined)
    await ev("document.querySelector('[data-boton-cuentanos]')?.click(); true")
    await a.esp(500)
    await abrir('dato_mal')
    debe(await ev("Boolean(document.querySelector('[data-campo=\"sitio\"]')) && !document.querySelector('[data-sitio-puesto]')"), 'U2d', 'U2d: desde cualquier pantalla, el sitio se busca (buscador)')
    await a.captura(`${CAP}/U2d_dato_mal_buscador.jpg`)
    await cerrar()
    // U2e consejo
    await ev("document.querySelector('[data-boton-cuentanos]')?.click(); true")
    await a.esp(500)
    await abrir('consejo')
    await escribir('sitio', 'Coliseo')
    await escribir('consejo', 'Llega antes de las 9, después hay cola')
    await a.captura(`${CAP}/U2e_consejo.jpg`)
    await enviar()
    e = await ultimo()
    debe(e.tipo === 'consejo' && e.datos.sitio === 'Coliseo' && /Llega antes/.test(e.datos.consejo), 'U2e', 'U2e: el sitio y el consejo')
    await cerrar()
    // U2f: algo no funciona, con la captura puesta y quitable
    await ev("document.querySelector('[data-boton-cuentanos]')?.click(); true")
    await a.esp(500)
    await abrir('no_funciona')
    for (let i = 0; i < 40 && !(await ev("Boolean(document.querySelector('[data-captura]'))")); i++) await a.esp(500)
    debe(await ev("Boolean(document.querySelector('[data-captura]')) && Boolean(document.querySelector('[data-quitar-captura]'))"), 'U2f', 'U2f: la captura de la pantalla ya viene puesta, con su × para quitarla')
    debe(/Con tu aviso enviamos la pantalla en la que estabas y el modelo de tu móvil, para encontrar el fallo\./.test(await ev("document.querySelector('[data-hoja-cuentanos]').innerText")), 'U2f', 'y la línea pequeña con lo que se envía')
    await escribir('que', 'Toqué Días y se quedó en blanco')
    await a.captura(`${CAP}/U2f_no_funciona.jpg`)
    await enviar()
    e = await ultimo()
    debe(e.tipo === 'no_funciona' && e.datos.que.startsWith('Toqué Días') && /^avisos\//.test(e.captura ?? '') && Array.isArray(e.errores) !== undefined, 'U2f', 'se manda con la captura subida y los últimos errores')
    await cerrar()
    await ev("document.querySelector('[data-boton-cuentanos]')?.click(); true")
    await a.esp(500)
    await abrir('no_funciona')
    for (let i = 0; i < 40 && !(await ev("Boolean(document.querySelector('[data-captura]'))")); i++) await a.esp(500)
    await ev("document.querySelector('[data-quitar-captura]').click(); true")
    await escribir('que', 'Sin captura')
    await enviar()
    e = await ultimo()
    debe(e.tipo === 'no_funciona' && !e.captura, 'U2f', 'si la quita, la captura NO se manda')
    await cerrar()
    // U2g idea
    await ev("document.querySelector('[data-boton-cuentanos]')?.click(); true")
    await a.esp(500)
    await abrir('idea')
    await escribir('texto', 'Un modo oscuro')
    await a.captura(`${CAP}/U2g_idea.jpg`)
    await ev("document.querySelector('[data-avisame]').click(); true") // apaga «Avísame»
    await enviar()
    e = await ultimo()
    debe(e.tipo === 'idea' && e.datos.texto === 'Un modo oscuro' && e.avisame === false, 'U2g', 'U2g: solo el texto; con «Avísame» apagado, se manda avisame: false')
    await cerrar()
    // U2i destino
    await ev("document.querySelector('[data-boton-cuentanos]')?.click(); true")
    await a.esp(500)
    await abrir('destino')
    await escribir('destino', 'Lisboa')
    await a.captura(`${CAP}/U2i_destino.jpg`)
    debe(/Avísame cuando esté/.test(await ev("document.querySelector('[data-hoja-cuentanos]').innerText")), 'U2i', 'U2i: «Avísame cuando esté»')
    await enviar()
    e = await ultimo()
    debe(e.tipo === 'destino' && e.datos.destino === 'Lisboa' && e.datos.cuando === 'el_ano_que_viene' && e.avisame === true, 'U2i', 'U2i: el destino, cuándo (el año que viene por defecto) y avisame encendido')
    debe(/Apuntado/.test(await ev("document.querySelector('[data-gracias]')?.innerText")), 'U2i', 'y «¡Apuntado! Te avisaremos cuando Lisboa esté en JUTRIP.»')
    await cerrar()
    // U2j foto: la casilla es obligatoria
    await ev("document.querySelector('[data-boton-cuentanos]')?.click(); true")
    await a.esp(500)
    await abrir('foto')
    await escribir('sitio', 'Coliseo')
    await ev(foto('[data-campo="foto"]'))
    await escribir('nombre_en_foto', 'Foto: Laura G.')
    await a.esp(300)
    debe(await ev("document.querySelector('[data-enviar-cuentanos]').disabled"), 'U2j', 'U2j: sin marcar la casilla, «Comparte tu foto» NO se puede enviar')
    await a.captura(`${CAP}/U2j_foto.jpg`)
    await ev("document.querySelector('[data-casilla-permiso]').click(); true")
    await a.esp(200)
    debe(!(await ev("document.querySelector('[data-enviar-cuentanos]').disabled")), 'U2j', 'con la casilla marcada, sí')
    await enviar()
    e = await ultimo()
    debe(e.tipo === 'foto' && e.datos.acepta === true && e.datos.nombre_en_foto === 'Foto: Laura G.' && e.fotos.length === 1, 'U2j', 'se manda con el sí a la casilla, el nombre y la foto')
    await cerrar()

    // Sin red: se guarda en el móvil y se manda solo al volver
    const antes = (await ev('window.__enviados.length'))
    await ev('window.__sinRed = true')
    await ev("document.querySelector('[data-boton-cuentanos]')?.click(); true")
    await a.esp(500)
    await abrir('idea')
    await escribir('texto', 'Idea sin red')
    await enviar()
    const sinRed = await ev("document.querySelector('[data-gracias]')?.parentElement?.innerText ?? ''")
    debe((await ev('window.__enviados.length')) === antes && /Lo mandamos en cuanto vuelva la conexión/.test(sinRed), 'sin_red', 'sin red: no se manda, se guarda y la pantalla lo dice')
    await cerrar()
    await ev('window.__sinRed = false; window.dispatchEvent(new Event("online")); true')
    for (let i = 0; i < 20 && (await ev('window.__enviados.length')) === antes; i++) await a.esp(400)
    e = await ultimo()
    debe((await ev('window.__enviados.length')) === antes + 1 && e.tipo === 'idea' && e.datos.texto === 'Idea sin red', 'sin_red', 'al volver la red, el aviso se manda solo')
  } finally {
    await a.cerrar()
  }
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
