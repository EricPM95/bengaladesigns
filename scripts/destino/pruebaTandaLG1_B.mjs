// La prueba de la Tanda LG1, agente B: el sello «Por conseguir» y el botón antes del viaje (Logros Boton 1a, 1b, 2a) en Roma y Lanzarote, y los retoques de la HOY1 (radios por sitio, atardecer de Lanzarote).
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTandaLG1_B.mjs
// Un solo Chrome. Los estados de la hoja salen de las funciones reales del servidor (hoja_antes.json de Roma y hoja_lz_antes.json de Lanzarote: scripts/destino/generarEstadosHojaLG1.mjs).
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { cargarCatalogo, cargarDatos } from '../../server/logros/datos.js'
import { RADIO_SIN_DATOS_AQUI_M, RADIO_SIN_DATOS_FOTO_M, sitioDeFotoLibre, sitiosCerca } from '../../server/logros/cerca.js'

const BASE = process.env.APP_URL || 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
let comprobaciones = 0
const fallos = []
const debe = (cond, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push(texto)
    console.log('✗', texto)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const json = (f) => JSON.parse(leer(f))

// ── 0. Los radios de los sitios (servidor, con los datos de verdad) ───────────────────────────────────────────────────────────
{
  const datos = cargarDatos()
  const catalogos = { roma: cargarCatalogo('roma'), lanzarote: cargarCatalogo('lanzarote') }
  const lz = datos.destinos.lanzarote
  debe(RADIO_SIN_DATOS_AQUI_M === 150 && RADIO_SIN_DATOS_FOTO_M === 800, 'los radios de un sitio sin radio no son 150 (Ya estás aquí) y 800 (foto)')
  const grandes = Object.entries(lz.sitios).filter(([, s]) => s.radio_m >= 2500).map(([id]) => id)
  debe(grandes.length >= 2, `Lanzarote debería tener sitios de 2.500 m (La Graciosa, Timanfaya); tiene ${grandes.length}`)
  // Un punto a 2.000 m de un sitio de 2.500 m: la foto libre cuenta para él (antes se recortaba a 800 m y no contaba).
  const id = grandes[0]
  const c = catalogos.lanzarote.sitios?.[id]?.coordinates ?? catalogos.lanzarote.places?.find((p) => p.id === id)?.coordinates
  const dentro = (m) => ({ lat: (c[0] ?? c.lat) + m / 111000, lng: c[1] ?? c.lng })
  const foto2000 = sitioDeFotoLibre({ datos, catalogos, destino: 'lanzarote', ubicacion: dentro(2000), items: new Map() })
  debe(foto2000 != null && lz.sitios[foto2000].radio_m >= 2000, `una foto a 2.000 m de «${id}» (radio ${lz.sitios[id].radio_m} m) no cuenta para ningún sitio con ese radio (${foto2000})`)
  const foto3000 = sitioDeFotoLibre({ datos, catalogos, destino: 'lanzarote', ubicacion: dentro(3200), items: new Map() })
  debe(foto3000 == null || foto3000 !== id, `una foto a 3.200 m de «${id}» cuenta para él`)
  // Los avisos de «cerca» siguen recortados a 800 m (no cambian).
  const aviso = sitiosCerca({ datos, catalogos, destino: 'lanzarote', ubicacion: dentro(2000), items: new Map(), margenM: 0 }).find((s) => s.sitio === id)
  debe(!aviso, `el aviso de «cerca» de «${id}» sigue sin recortarse a 800 m (a 2.000 m dice que estás dentro)`)
  // Un sitio sin radio en los datos: 800 m para la foto y 150 m para «Ya estás aquí».
  const sinRadio = JSON.parse(JSON.stringify(datos))
  const idSin = Object.keys(sinRadio.destinos.roma.sitios).find((k) => (sinRadio.destinos.roma.colecciones ?? []).some((col) => col.sitios.includes(k)))
  delete sinRadio.destinos.roma.sitios[idSin].radio_m
  const cc = catalogos.roma.sitios?.[idSin]?.coordinates ?? catalogos.roma.places?.find((p) => p.id === idSin)?.coordinates
  const lat0 = cc[0] ?? cc.lat
  const lng0 = cc[1] ?? cc.lng
  const aMetros = (m) => ({ lat: lat0 + m / 111000, lng: lng0 })
  const libre = (m) => sitioDeFotoLibre({ datos: sinRadio, catalogos, destino: 'roma', ubicacion: aMetros(m), items: new Map() })
  debe(libre(700) === idSin, `sin radio, la foto a 700 m de «${idSin}» tendría que contar (800 m)`)
  const lejos = libre(900)
  debe(lejos !== idSin, `sin radio, la foto a 900 m de «${idSin}» no tendría que contar`)
  const cerca150 = sitiosCerca({ datos: sinRadio, catalogos, destino: 'roma', ubicacion: aMetros(140), items: new Map(), margenM: 0 }).find((s) => s.sitio === idSin)
  const cerca200 = sitiosCerca({ datos: sinRadio, catalogos, destino: 'roma', ubicacion: aMetros(200), items: new Map(), margenM: 0 }).find((s) => s.sitio === idSin)
  debe(cerca150?.dentro === true && !cerca200?.dentro, 'sin radio, «dentro» tiene que ser 150 m')
  const servicio = leer('server/logros/servicio.js')
  debe(/radios_hoy/.test(servicio) && /sitioInfo\(viaje\.destino, sitio, 800\)/.test(servicio), 'servicio.js no manda radios_hoy ni usa 800 m para la foto')
}

// ── 1. En pantalla ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const a = await abrirApp(BASE, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=completa&apertura=0', ancho: 390, alto: 844 })
try {
  for (let i = 0; i < 120 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  const R = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore)"
  for (let i = 0; i < 90 && !(await a.evaluar(R + '.then((S) => Boolean(S.getState().route))')); i++) await a.esp(1000)
  await a.esp(2500)
  await a.evaluar(R + ".then((S) => { S.setState({ screen: 'route', mode: 'days' }); return true })")
  for (let i = 0; i < 3; i++) {
    await a.evaluar("(() => { const e = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Empezar mi día)$/.test(x.textContent.trim())); e?.click(); return true })()")
    await a.esp(600)
  }
  const abrir = async (est) => {
    await a.evaluar(`Promise.all([import('/src/components/logros/momentos/api.ts'), import('/src/components/logros/momentos/useMomentosUI.ts')]).then(([api, ui]) => { api.datosDePrueba.estado = ${JSON.stringify(est)}; ui.useMomentosUI.getState().cerrarHojaLogros(); setTimeout(() => ui.useMomentosUI.getState().abrirHojaLogros(), 200); return true })`)
    await a.esp(1800)
    for (let i = 0; i < 40 && (await a.evaluar("Boolean(document.querySelector('[data-hueco-insignia]'))")); i++) await a.esp(150)
  }
  const cerrar = async () => {
    await a.evaluar("import('/src/components/logros/momentos/useMomentosUI.ts').then((m) => { m.useMomentosUI.getState().cerrarHojaLogros(); return true })")
    await a.esp(500)
  }
  const leerHoja = () =>
    a.evaluar(`(() => {
      const sellos = Array.from(document.querySelectorAll('[data-sello]')).map((e) => ({ id: e.dataset.sello, texto: e.innerText, filtro: e.querySelector('span')?.style.filter || '', opacidad: e.querySelector('span')?.style.opacity || '' }))
      const filas = Array.from(document.querySelectorAll('[data-coleccion]'))
      return { fase: document.querySelector('[data-hoja-logros]')?.dataset.hojaLogros, sellos, banner: Array.from(document.querySelectorAll('svg path')).length ? (document.body.innerText.match(/Con tu ruta puedes completar[^\\n]*/) || [''])[0] : '', enRuta: filas.filter((f) => /En tu ruta/.test(f.innerText)).length, filas: filas.length, abiertas: filas.filter((f) => f.querySelector('[style*="F5EFE4"]') && f.innerText.includes('Cómo llegar')).length, gajos: document.querySelectorAll('[data-gajos]').length, titulo: document.querySelector('[role=dialog]')?.innerText.split('\\n').slice(0, 3).join(' | '), secretos: document.querySelector('[data-secretos]')?.innerText.split('\\n')[0] || '', secretosHuecos: document.querySelectorAll('[data-hueco-emblema]').length, cuenta: Array.from(document.querySelectorAll('[data-secretos] [data-emblema], [data-secretos] [data-emblema-lanza]')).length }
    })()`)

  // ── Roma ──
  const antesRoma = json('src/dev/escaparates/datos/hoja_antes.json')
  await abrir(antesRoma)
  let h = await leerHoja()
  debe(h.fase === 'antes', `Roma: la hoja no es la de «antes» (${h.fase})`)
  const roma = h.sellos.find((s) => s.id === 'roma')
  const vat = h.sellos.find((s) => s.id === 'vaticano')
  debe(roma && /Por conseguir\s*·\s*0 de 8 imprescindibles/i.test(roma.texto.replace(/\n/g, ' ')), `Roma: el sello no dice «Por conseguir · 0 de 8 imprescindibles»: «${roma?.texto.replace(/\n/g, ' ')}»`)
  debe(roma && /Empieza en bronce/.test(roma.texto), 'Roma: el sello no dice «Empieza en bronce»')
  debe(vat && /Por conseguir\s*·\s*0 de 3 sitios/i.test(vat.texto.replace(/\n/g, ' ')), `Vaticano: no dice «Por conseguir · 0 de 3 sitios»: «${vat?.texto.replace(/\n/g, ' ')}»`)
  debe(vat && /Empieza en plata/.test(vat.texto), 'Vaticano: el sello no dice «Empieza en plata»')
  debe(roma && /grayscale\(0\.4\)/.test(roma.filtro) && /sepia\(0\.3\)/.test(roma.filtro) && /saturate\(1\.2\)/.test(roma.filtro) && roma.opacidad === '0.9', `Roma: el sello gris no lleva el filtro del Design (gris cálido, opacidad .9): «${roma?.filtro}» ${roma?.opacidad}`)
  debe(h.banner === `Con tu ruta puedes completar ${antesRoma.con_tu_ruta_puedes_completar} de las ${antesRoma.colecciones.length} colecciones`, `Roma: la línea verde no dice los números de verdad: «${h.banner}»`)
  debe(h.enRuta === antesRoma.colecciones.filter((c) => c.en_tu_ruta).length, `Roma: «En tu ruta» sale en ${h.enRuta} colecciones, son ${antesRoma.colecciones.filter((c) => c.en_tu_ruta).length}`)
  debe(h.filas === 11, `Roma: salen ${h.filas} colecciones, no 11`)
  debe(/esconde 14 secretos|esconde \d+ secretos/.test(h.secretos), `Roma: el bloque de secretos no dice «Roma esconde N secretos»: «${h.secretos}»`)
  debe(!/Lo nuevo de hoy/.test(await a.evaluar('document.body.innerText')), 'Roma: antes del viaje no hay «Lo nuevo de hoy»')
  await a.captura(path.join(SALIDA, 'lg1_hoja_antes_roma_1.jpg'))
  await cerrar()

  // ── Lanzarote ──
  const antesLz = json('src/dev/escaparates/datos/hoja_lz_antes.json')
  await a.evaluar(R + ".then((S) => { S.setState({ destination: 'Lanzarote' }); return true })")
  await abrir(antesLz)
  h = await leerHoja()
  debe(h.fase === 'antes', `Lanzarote: la hoja no es la de «antes» (${h.fase})`)
  const lan = h.sellos.find((s) => s.id === 'lanzarote')
  debe(h.sellos.length === 1, `Lanzarote: salen ${h.sellos.length} sellos, no 1`)
  debe(lan && /Por conseguir\s*·\s*0 de 7 imprescindibles/i.test(lan.texto.replace(/\n/g, ' ')), `Lanzarote: el sello no dice «Por conseguir · 0 de 7 imprescindibles»: «${lan?.texto.replace(/\n/g, ' ')}»`)
  debe(lan && /Empieza en bronce/.test(lan.texto), 'Lanzarote: el sello no dice «Empieza en bronce»')
  debe(lan && /sepia\(0\.3\)/.test(lan.filtro), 'Lanzarote: el sello gris no lleva el filtro del Design')
  debe(h.banner === `Con tu ruta puedes completar ${antesLz.con_tu_ruta_puedes_completar} de las ${antesLz.colecciones.length} colecciones`, `Lanzarote: la línea verde no dice los números de verdad: «${h.banner}»`)
  debe(h.enRuta === antesLz.colecciones.filter((c) => c.en_tu_ruta).length, `Lanzarote: «En tu ruta» sale en ${h.enRuta} colecciones, son ${antesLz.colecciones.filter((c) => c.en_tu_ruta).length}`)
  debe(h.filas === 7 && h.gajos === 7, `Lanzarote: ${h.filas} colecciones y ${h.gajos} insignias de gajos, tienen que ser 7 y 7`)
  debe(!/Roma|Coliseo|Vaticano/.test(await a.evaluar("document.querySelector('[role=dialog]').innerText")), 'Lanzarote: la hoja nombra algo de Roma')
  await a.captura(path.join(SALIDA, 'lg1_hoja_antes_lanzarote_1.jpg'))
  await cerrar()
  await a.evaluar(R + ".then((S) => { S.setState({ destination: 'Roma' }); return true })")

  // ── El botón flotante antes del viaje (1b «Antes del viaje») ──
  await a.evaluar(`import('/src/components/logros/momentos/api.ts').then((api) => { api.datosDePrueba.estado = ${JSON.stringify(antesRoma)}; return true })`)
  await a.evaluar(R + ".then((S) => { S.setState({ screen: 'route', mode: 'days' }); return true })")
  // El botón vuelve a pedir su estado cuando cambia el puntito.
  await a.evaluar("import('/src/store/useLogrosStore.ts').then((m) => { m.useLogrosStore.setState({ puntito: true }); setTimeout(() => m.useLogrosStore.setState({ puntito: false }), 300); return true })")
  await a.esp(2200)
  const b = await a.evaluar(`(() => { const e = document.querySelector('[data-boton-logros]'); if (!e) return null; const r = e.getBoundingClientRect(); const c = e.querySelectorAll('svg circle'); return { grado: e.dataset.grado, w: r.width, h: r.height, der: Math.round(innerWidth - r.right), pista: c[0]?.getAttribute('stroke-dasharray'), aro: c[1]?.getAttribute('stroke'), puntito: Boolean(e.querySelector('span[style*="moPuntito"]')), opSello: e.querySelector('span')?.style.opacity, label: e.getAttribute('aria-label') } })()`)
  debe(b != null, 'el botón flotante no sale antes del viaje')
  if (b) {
    debe(b.grado === 'ninguno', `el botón antes del viaje tiene grado «${b.grado}»`)
    debe(b.w === 58 && b.h === 58 && b.der === 14, `el botón no mide 58 px a 14 px del borde (${b.w}x${b.h}, ${b.der})`)
    debe(b.pista === '4 3', `el aro del botón antes del viaje no es a rayas (${b.pista})`)
    debe(b.aro === 'transparent', `el aro de avance del botón antes del viaje debería ir vacío (${b.aro})`)
    debe(b.opSello === '0.5', `el sello del botón antes del viaje debería ir al 50 % (${b.opSello})`)
    debe(b.label === 'Tus logros en Roma', `el botón dice «${b.label}»`)
  }
  await a.captura(path.join(SALIDA, 'lg1_boton_antes_1.jpg'))
  await a.evaluar("import('/src/components/logros/momentos/api.ts').then((api) => { api.datosDePrueba.estado = null; return true })")

  // ── 3a. Los radios: «Ya estás aquí» con el radio del sitio ──
  const r1 = await a.evaluar(`import('/src/lib/hoyParada.ts').then((m) => {
    const stop = { coordinates: { lat: 28.9, lng: -13.6 } }
    const ub = (m2) => ({ lat: 28.9 + m2 / 111000, lng: -13.6 })
    return { d150: m.estaAqui(ub(120), stop), f150: m.estaAqui(ub(300), stop), g2500: m.estaAqui(ub(2000), stop, 2500), f2500: m.estaAqui(ub(3000), stop, 2500) }
  })`)
  debe(r1.d150 && !r1.f150, 'estaAqui con el radio de siempre (150 m) falla')
  debe(r1.g2500 && !r1.f2500, 'estaAqui con un radio de 2.500 m: a 2.000 m tiene que estar aquí y a 3.000 no')
  const r2 = await a.evaluar(`import('/src/lib/radiosDeHoy.ts').then((m) => ({ sin: m.RADIO_YA_ESTAS_AQUI_SIN_DATOS_M, tiene: typeof m.useRadioDeParada }))`)
  debe(r2.sin === 150 && r2.tiene === 'function', 'radiosDeHoy.ts no da 150 m a un sitio sin radio')
  const hp = leer('src/components/route/hoy/v2/ParadaHoy.tsx')
  debe(/useRadioDeParada\(/.test(hp) && /estaAqui\(ubicacion, siguiente, radioAqui\)/.test(hp), 'ParadaHoy no usa el radio del sitio en «Ya estás aquí»')

  // ── 3b. El atardecer (H13) en Roma y en Lanzarote ──
  const s = await a.evaluar(`import('/src/lib/puestaDeSolYManana.ts').then((m) => {
    const parada = (id, name) => ({ id, name, coordinates: { lat: 28.98, lng: -13.83 } })
    const lz = m.atardecerDelDestino('Lanzarote', '2026-11-08')
    const roma = m.atardecerDelDestino('Roma', '2026-11-08')
    const golfo = parada('g', 'El Golfo y el Charco de los Clicos')
    const mont = parada('m', 'Montañas del Fuego')
    const f = (o) => m.fraseDeAtardecer({ day: { id: 'd1' }, ahoraMin: 17 * 60, ...o })
    const desdeLz = { lat: 28.96, lng: -13.82 }
    return {
      hora: lz && lz.hora, romaHora: roma && roma.hora, sinFecha: m.atardecerDelDestino('Lanzarote', undefined), otro: m.atardecerDelDestino('Madrid', '2026-11-08'),
      parada: f({ pendientes: [mont, golfo], delDestino: lz, desde: desdeLz }),
      sin: f({ pendientes: [mont], delDestino: lz, desde: desdeLz, enCoche: true }),
      sinCoche: f({ pendientes: [mont], delDestino: lz, desde: { lat: 29.2, lng: -13.5 }, enCoche: false }),
      temprano: f({ pendientes: [mont], delDestino: lz, desde: desdeLz, ahoraMin: 15 * 60 }),
      limite: f({ pendientes: [mont], delDestino: lz, desde: desdeLz, ahoraMin: 16 * 60 + 4 }),
      pasado: f({ pendientes: [mont], delDestino: lz, desde: desdeLz, ahoraMin: 18 * 60 + 30 }),
      motor: f({ day: { id: 'd1', sunsetText: 'Hoy el sol se pone a las 17:05' }, pendientes: [{ ...mont, isSunset: true }], delDestino: roma, desde: desdeLz, ahoraMin: 15 * 60 + 30 }),
      romaCerca: m.fraseDeAtardecer({ day: { id: 'd1' }, pendientes: [mont], delDestino: roma, desde: { lat: 41.9033, lng: 12.4663 }, ahoraMin: 16 * 60 + 30 }),
      famara: lz && m.sitioDeAtardecerDe(lz, { name: 'Caleta de Famara y Playa de Famara' })?.id, bosque: lz && m.sitioDeAtardecerDe(lz, { name: 'Mirador del Bosquecillo (Risco de Famara)' })?.id,
      faro: lz && m.sitioDeAtardecerDe(lz, { name: 'Playa Blanca y el Faro de Pechiguera' })?.id, pincio: roma && m.sitioDeAtardecerDe(roma, { name: 'Terraza del Pincio' })?.id,
    }
  })`)
  debe(s.hora === '18:04', `el sol de Lanzarote el 8 de noviembre no es 18:04 (${s.hora})`)
  debe(/^\d{1,2}:\d{2}$/.test(s.romaHora || ''), `no hay hora del sol para Roma (${s.romaHora})`)
  debe(s.sinFecha === null && s.otro === null, 'atardecerDelDestino da algo sin fecha o para otro destino')
  debe(s.parada?.tipo === 'parada' && s.parada.texto === 'Hoy ves el atardecer en El Golfo: el sol se pone a las 18:04. Llega un cuarto de hora antes, que es cuando más bonito está.', `parada de atardecer: «${s.parada?.texto}»`)
  debe(s.parada?.extra === 'Aquí el sol cae al mar.', 'Lanzarote: falta «Aquí el sol cae al mar.»')
  debe(s.sin?.tipo === 'cerca' && s.sin.texto === 'Hoy el sol se pone a las 18:04. Si te apetece verlo, estos sitios están cerca:', `sin parada: «${s.sin?.texto}»`)
  debe(s.sin?.cerca.length >= 2 && s.sin.cerca.length <= 3, `en Lanzarote deberían salir 2 o 3 sitios cerca (${s.sin?.cerca.length})`)
  debe(s.sin?.cerca.every((c, i, l) => i === 0 || l[i - 1].minutos <= c.minutos), 'los sitios cerca no van del más cercano al más lejano')
  debe(s.sin?.cerca.every((c) => c.minutos > 0 && (c.modo === 'a_pie' || c.modo === 'coche')), 'los sitios cerca no llevan tiempo y modo')
  debe(s.sinCoche?.tipo === 'solo_hora' && s.sinCoche.cerca.length === 0, `sin coche y lejos de todo, solo la hora (${s.sinCoche?.tipo})`)
  debe(s.temprano === null, 'a las 15:00 (más de 2 h antes) ya sale la tarjeta')
  debe(s.limite !== null && s.pasado === null, 'la ventana de 2 horas: a 2 h justas tiene que salir y media hora después de la puesta, no')
  debe(s.motor?.tipo === 'parada' && /17:05/.test(s.motor.texto), `con el sol del motor y una parada isSunset: «${s.motor?.texto}»`)
  debe(s.romaCerca?.tipo === 'cerca' && s.romaCerca.extra === null && s.romaCerca.cerca.length >= 2, `Roma sin parada de atardecer: debería enseñar 2 o 3 sitios y no «cae al mar» (${JSON.stringify(s.romaCerca)})`)
  debe(s.famara === 'caleta_de_famara_y_playa_de_famara' && s.bosque == null && s.faro === 'playa_blanca_y_el_faro_de_pechiguera' && s.pincio === 'terraza_del_pincio', `qué paradas son de atardecer (Famara ${s.famara}, Bosquecillo ${s.bosque}, Faro ${s.faro}, Pincio ${s.pincio})`)
  const sit = json('src/data/sitiosDeAtardecer.json')
  debe(sit.roma.sitios.length >= 5 && sit.lanzarote.sitios.length >= 6 && sit.lanzarote.mar === true && sit.roma.mar === false, 'sitiosDeAtardecer.json no tiene los sitios de Roma y Lanzarote')
  const hy = leer('src/components/route/hoy/v2/HoyDuranteV2.tsx')
  debe(/atardecerDelDestino\(route\.destination, dateIso\)/.test(hy) && /data-hoy-atardecer-como-llegar/.test(hy), 'HoyDuranteV2 no engancha el atardecer')

  // ── 3c. La siguiente parada en cuanto acabas la anterior (H1) ──
  const pp = leer('src/components/route/hoy/v2/ParadaHoy.tsx')
  debe(/data-hoy-ya-he-llegado/.test(pp) && /¿No te detecta el GPS\? Ya he llegado/.test(pp), 'falta la línea pequeña [Ya he llegado]')
  debe(/data-hoy-abrir-ficha/.test(pp), 'tocar la tarjeta no abre la ficha')
} finally {
  a.cerrar()
}

console.log(`\nPrueba LG1 B (sello «Por conseguir», botón, radios y atardecer): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
