// La prueba de la Tanda V31: LA PRIMERA VEZ (las preguntas, el Perfil del viajero nuevo con el mapa, [Ver destino] sin viaje, el «+» versión C).
//   APP_URL=http://localhost:5173 node scripts/destino/pruebaV31.mjs      (con Vite en 5173; sin Vite solo la parte del servidor y de los datos)
// Ninguna parte toca el Supabase de producción: el servidor se prueba con una base de mentira y la app con el servidor de mentira de la demo (?logrosDemo=1).
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'
import { crearServicioPrimeraVez, limpiarRespuestas } from '../../server/primeraVez.js'
import { leerDestinosCurados } from '../../server/destinosCurados.js'

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
const CAP = 'docs/dias/V31_capturas'
fs.mkdirSync(CAP, { recursive: true })

/* ───────── 1. El servidor: solo se guardan tres cosas ───────── */
console.log('1. El servidor guarda SOLO la frecuencia, con quién y el año; del ritmo y los gustos, nada')
{
  const l = limpiarRespuestas({ frecuencia: 'dos_o_tres', compania: 'pareja', anio_nacimiento: 1990, ritmo: 'intenso', gustos: ['Arte'], extra: 1 }, 2026)
  debe(JSON.stringify(Object.keys(l).sort()) === '["anio_nacimiento","compania","frecuencia"]', 'tres_datos', 'lo que se guarda tiene solo esas tres claves (el ritmo y los gustos se descartan)')
  debe(l.frecuencia === 'dos_o_tres' && l.compania === 'pareja' && l.anio_nacimiento === 1990, 'tres_datos', 'los tres datos buenos pasan tal cual')
  debe(limpiarRespuestas({ anio_nacimiento: 1919 }, 2026).anio_nacimiento === null && limpiarRespuestas({ anio_nacimiento: 2027 }, 2026).anio_nacimiento === null && limpiarRespuestas({ anio_nacimiento: 1920 }, 2026).anio_nacimiento === 1920 && limpiarRespuestas({ anio_nacimiento: 2026 }, 2026).anio_nacimiento === 2026, 'anio', 'el año va de 1920 al año actual; fuera de eso, no se guarda')
  debe(limpiarRespuestas({}, 2026).anio_nacimiento === null && limpiarRespuestas({ frecuencia: 'mucho', compania: 'solo' }, 2026).frecuencia === null && limpiarRespuestas({ frecuencia: 'mucho', compania: 'solo' }, 2026).compania === null, 'anio', 'sin año no se guarda; un valor que no es de la lista tampoco')
  const filas = []
  const admin = { from: () => ({ upsert: async (fila) => (filas.push(fila), { error: null }), select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: filas[0] ?? null, error: null }) }) }) }) }
  const s = crearServicioPrimeraVez({ admin })
  const antes = await s.leer({ id: 'u1' })
  debe(antes.cuerpo.hecho === false, 'una_vez', 'una cuenta nueva no ha contestado: hecho = falso')
  const r = await s.guardar({ id: 'u1' }, { frecuencia: 'cuatro_o_mas', ritmo: 'tranquilo', gustos: ['Playas'] })
  debe(r.estado === 200 && filas.length === 1 && filas[0].user_id === 'u1' && !('ritmo' in filas[0]) && !('gustos' in filas[0]) && filas[0].anio_nacimiento === null && Boolean(filas[0].hecho_en), 'tres_datos', 'saltando todo, se guarda «hecho» y nada más: sin año, sin ritmo, sin gustos')
  const despues = await s.leer({ id: 'u1' })
  debe(despues.cuerpo.hecho === true && despues.cuerpo.frecuencia === 'cuatro_o_mas', 'una_vez', 'tras contestar (o saltar) ya consta como hecho: las preguntas no vuelven')
  const sin = crearServicioPrimeraVez({ admin: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: { code: '42P01', message: 'relation does not exist' } }) }) }) }) } })
  debe((await sin.leer({ id: 'u1' })).estado === 503, 'sin_tabla', 'sin la tabla (migración sin aplicar) responde 503 y la app sigue como siempre')
  const srv = leer('server/index.js')
  debe(srv.includes('registrarRutasPrimeraVez(app, { admin: salesAdmin })') && leer('server/primeraVez.js').includes("app.put('/api/primera-vez'"), 'servidor', 'las rutas GET y PUT /api/primera-vez están montadas')
}

/* ───────── 2. Los destinos y la migración ───────── */
console.log('2. Los destinos del mapa (en un archivo que Eric puede cambiar), los ocultos y la migración')
{
  const d = JSON.parse(leer('data/primera_vez/destinos.json'))
  debe(d.salida.length === 11 && JSON.stringify(d.salida.map((x) => x.nombre)) === JSON.stringify(['Roma', 'París', 'Londres', 'Madrid', 'Barcelona', 'Lisboa', 'Ámsterdam', 'Praga', 'Lanzarote', 'Nueva York', 'Cancún']), 'destinos', 'los 11 destinos de salida: Roma, París, Londres, Madrid, Barcelona, Lisboa, Ámsterdam, Praga, Nueva York, Cancún y Lanzarote')
  debe(d.proximamente.map((x) => x.nombre).join() === 'Florencia,Berlín,Cartagena de Indias', 'destinos', 'los 3 «Próximamente»: Florencia, Berlín y Cartagena de Indias')
  debe(d.salida.find((x) => x.nombre === 'Cancún').iso === 'mx', 'destinos', 'Cancún lleva la bandera de México')
  const publica = leerDestinosCurados('data')
  const admin = leerDestinosCurados('data', { esAdmin: true })
  debe(publica.map((x) => x.clave).join() === 'roma' && admin.map((x) => x.clave).sort().join() === 'lanzarote,roma', 'ocultos', 'los destinos ocultos (Lanzarote) solo salen para administradores: lo demás, solo Roma')
  debe(publica[0].linea === 'La ciudad eterna' && admin.find((x) => x.clave === 'lanzarote').linea === 'Isla de volcanes', 'linea', 'la línea corta de cada destino está en sus datos («La ciudad eterna», «Isla de volcanes»)')
  const m = leer('supabase/migrations/0089_viajero_primera_vez.sql')
  debe(m.includes("('viajero_primera_vez', 'user_id')") && fs.existsSync('docs/dias/COMPROBAR_0089.sql') && leer('scripts/destino/pruebaTanda10J.mjs').includes('viajero_primera_vez'), 'empezar_de_cero', 'la migración 0089 crea la tabla, mete la tabla en «Empezar de cero» y tiene su COMPROBAR y su sitio en pruebaTanda10J (los tres pasos)')
  debe(/anio_nacimiento smallint/.test(m) && !/ritmo|gustos/i.test(m.replace(/--.*$/gm, '')), 'tres_datos', 'la tabla solo tiene frecuencia, compañía y año: ni ritmo ni gustos')
}

if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('(sin Vite: la parte de la app se salta)')
  console.log(`\nPrueba de la Tanda V31: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}

/* ───────── 3. En la app ───────── */
const RUTA = '/?cuentas=on&logros=on&logrosDemo=1&apertura=0'
const NUEVA = "try{localStorage.setItem('trazo:demo:primera_vez_nueva','si');localStorage.removeItem('trazo:demo:primera_vez_hecha');localStorage.removeItem('trazo:primera_vez:avisados')}catch(e){}"
const esperar = async (a, js, n = 60) => {
  for (let i = 0; i < n; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(500)
  }
  return false
}
const clic = (a, sel) => a.evaluar(`(() => { const e = document.querySelector('${sel}'); if (!e) return false; e.click(); return true })()`)
const CURADOS_PRUEBA = "window.__destinosCurados = [{ clave: 'roma', nombre: 'Roma', pais: 'Italia', iso: 'it', lat: 41.9028, lng: 12.4964, linea: 'La ciudad eterna', portada: '/fotos/roma/dia_coliseo.jpg', portada_pequena: '/fotos/roma/dia_coliseo_p.jpg' }, { clave: 'lanzarote', nombre: 'Lanzarote', pais: 'España', iso: 'es', lat: 29.0469, lng: -13.59, linea: 'Isla de volcanes', portada: '/fotos/lanzarote/playas_de_papagayo.jpg', portada_pequena: '/fotos/lanzarote/playas_de_papagayo_p.jpg' }];"

// Quien no es administrador solo recibe Roma (el servidor no manda los ocultos).
const CURADOS_ROMA = CURADOS_PRUEBA.replace(/, { clave: 'lanzarote'.*?}];/, '];')
console.log('3. Una cuenta nueva ve las preguntas una vez y acaba en el Perfil')
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: NUEVA + CURADOS_ROMA })
  try {
    const salen = await esperar(a, "Boolean(document.querySelector('[data-preguntas-primera-vez]'))")
    debe(salen, 'preguntas', 'una cuenta nueva (sin ningún viaje) ve las preguntas al entrar')
    debe(Boolean(await a.evaluar("document.querySelector('[data-pregunta=\"1\"]') && /Cada cuánto viajas/.test(document.body.innerText) && document.querySelectorAll('[data-opcion]').length === 3")), 'preguntas', 'pregunta 1: ¿Cada cuánto viajas? con tres tarjetas')
    debe(Boolean(await a.evaluar("(() => { const t = [...document.querySelectorAll('[data-opcion] svg path')].map((p) => p.getAttribute('d')); return new Set(t).size === 3 })()")), 'preguntas', 'cada tarjeta de la pregunta 1 lleva un icono distinto')
    await a.captura(`${CAP}/Q1.jpg`)
    await clic(a, '[data-opcion="dos_o_tres"]')
    await clic(a, '[data-continuar]')
    await a.esp(300)
    debe(/Con quién sueles viajar/.test(await a.evaluar('document.body.innerText')) && (await a.evaluar("document.querySelectorAll('[data-opcion]').length")) === 4, 'preguntas', 'pregunta 2: ¿Con quién sueles viajar? A mi aire · En pareja · En familia · Con amigos')
    await a.captura(`${CAP}/Q2.jpg`)
    await clic(a, '[data-opcion="pareja"]')
    await clic(a, '[data-continuar]')
    await a.esp(300)
    const q3 = await a.evaluar('document.body.innerText')
    debe(/Cómo te gusta viajar/.test(q3) && /Tranquilo/.test(q3) && /Equilibrado/.test(q3) && /Intenso/.test(q3) && /Qué te gusta ver/.test(q3), 'preguntas', 'pregunta 3: ritmo (Tranquilo · Equilibrado · Intenso) y «¿Qué te gusta ver?»')
    await clic(a, '[data-opcion="intenso"]')
    await clic(a, '[data-gusto="Arte"]')
    await clic(a, '[data-gusto="Comida"]')
    debe((await a.evaluar("document.querySelectorAll('[data-gusto][aria-pressed=\"true\"]').length")) === 2, 'preguntas', 'se pueden marcar varios gustos a la vez')
    await a.captura(`${CAP}/Q3.jpg`)
    await clic(a, '[data-continuar]')
    await a.esp(300)
    const q4 = await a.evaluar("JSON.stringify({ texto: document.body.innerText, marcados: document.querySelectorAll('[data-anio][aria-pressed=\"true\"]').length, primero: document.querySelector('[data-anio]')?.textContent, ultimo: [...document.querySelectorAll('[data-anio]')].at(-1)?.textContent })")
    const j4 = JSON.parse(q4)
    debe(/En qué año naciste/.test(j4.texto) && j4.marcados === 0, 'anio', 'pregunta 4: ¿En qué año naciste? y empieza SIN ningún año marcado')
    debe(j4.ultimo === '1920' && Number(j4.primero) === new Date().getFullYear(), 'anio', `los años van de 1920 al año actual (${j4.ultimo} … ${j4.primero})`)
    debe(/Opcional\. Nos ayuda a mejorar Jutrip; nunca lo enseñamos/.test(j4.texto), 'anio', 'debajo, en pequeño: «Opcional. Nos ayuda a mejorar Jutrip; nunca lo enseñamos»')
    await a.captura(`${CAP}/Q4.jpg`)
    await clic(a, '[data-continuar]') // sin marcar ningún año
    const sale = await esperar(a, "Boolean(document.querySelector('[data-mapa-primera-vez]'))")
    debe(sale, 'perfil', 'al acabar la última pregunta, directo al Perfil (con el mapa)')
    const g = JSON.parse(await a.evaluar('JSON.stringify(window.__demoPrimeraVez)'))
    debe(g.guardados === 1 && g.frecuencia === 'dos_o_tres' && g.compania === 'pareja' && g.anio_nacimiento === null, 'tres_datos', 'se guardó la frecuencia y con quién; el año sin marcar NO se guardó')
    debe(JSON.stringify(Object.keys(g.ultimo).sort()) === '["anio_nacimiento","compania","frecuencia"]', 'tres_datos', `lo enviado al servidor lleva SOLO esas tres claves (${Object.keys(g.ultimo).join(', ')}): del ritmo y los gustos, nada`)
    debe(!(await a.evaluar("document.querySelector('[data-preguntas-primera-vez]') !== null")), 'preguntas', 'las preguntas se cierran')
    // El cuestionario de crear viaje sale sin rellenar (nada de lo contestado se usa)
    const q = JSON.parse(await a.evaluar(`import('/src/store/useRouteStore.ts').then((m) => { const s = m.useRouteStore.getState(); return JSON.stringify({ origen: s.answers.origin ?? null, destino: s.destination ?? null, companion: s.answers.companion ?? null, ritmo: s.answers.pace ?? null, experiencias: (s.answers.experiences ?? []).length }) })`))
    debe(!q.origen && !q.destino && !q.companion && !q.ritmo && q.experiencias === 0, 'sin_rellenar', `el cuestionario de crear viaje sale como siempre, sin rellenar nada (${JSON.stringify(q)})`)

    console.log('4. El Perfil del viajero nuevo: el de siempre más el mapa')
    await esperar(a, "document.querySelectorAll('[data-pin]').length >= 4")
    await a.esp(800)
    const p = JSON.parse(await a.evaluar(`JSON.stringify({
      mapa: Boolean(document.querySelector('[data-mapa-primera-vez]')),
      titulo: /A dónde te apetece ir/.test(document.body.innerText),
      mapaSvg: Boolean(document.querySelector('svg[data-mapa-destinos]')),
      mapbox: Boolean(document.querySelector('.mapboxgl-map, canvas.mapboxgl-canvas')),
      pines: [...document.querySelectorAll('[data-pin]')].map((x) => x.getAttribute('data-pin') + ':' + x.getAttribute('data-listo')),
      lista: [...document.querySelectorAll('[data-destino-lista]')].map((x) => x.getAttribute('data-destino-lista') + ':' + x.getAttribute('data-listo')),
      continentes: [...document.querySelectorAll('[data-continente]')].map((x) => x.getAttribute('data-continente')),
      vitrina: /Mi vitrina/i.test(document.body.innerText), pasaporte: /pasaporte/i.test(document.body.innerText),
      botonGrande: Boolean(document.querySelector('[data-crear-viaje-perfil]')), sorteo: /sorteo/i.test(document.body.innerText),
      mas: (() => { const b = document.querySelector('[data-anadir-viaje]'); return b ? { texto: b.innerText.trim(), reflejo: document.getAnimations().some((x) => x.animationName === 'bmShine') } : null })(),
      toque: [...document.querySelectorAll('[data-destino-lista]')].every((x) => x.getBoundingClientRect().height >= 44)
    })`))
    debe(p.mapa && p.titulo && p.mapaSvg && !p.mapbox, 'mapa', 'el Perfil lleva «¿A dónde te apetece ir?» con el mapa DIBUJADO (SVG), nunca un Mapbox')
    debe(p.vitrina && p.pasaporte, 'perfil', 'sigue siendo el Perfil de siempre: su vitrina y su pasaporte')
    debe(!p.botonGrande, 'perfil', 'fuera el botón grande [Crear mi viaje] del Perfil')
    debe(!p.sorteo, 'sorteo', 'ni rastro del sorteo en el Perfil')
    debe(p.lista.join() === 'roma:1,florencia:0,berlin:0,cartagena_de_indias:0' && p.pines.length >= 3, 'destinos', `destinos: Roma (listo) y los 3 «Próximamente» en gris; Lanzarote y el resto no salen para quien no es administrador (${p.lista.join(', ')})`)
    debe(p.continentes.join() === 'Europa,América y Caribe', 'destinos', `la lista, por continentes (${p.continentes.join(', ')})`)
    debe(p.toque, 'toque', 'cada destino de la lista se toca bien con el dedo (44 px o más)')
    debe(p.mas && p.mas.texto === '' && p.mas.reflejo, 'boton_mas', 'el «+» flotante es el de siempre, SIN texto, con el reflejo que pasa (versión C)')
    await a.captura(`${CAP}/P1_perfil_nuevo.jpg`)

    console.log('5. La tarjeta de un destino: listo, «Próximamente» y el «+» escondido')
    await clic(a, '[data-destino-lista="roma"]')
    await esperar(a, "Boolean(document.querySelector('[data-tarjeta-destino=\"roma\"] [data-llevar-numeros]')) && !/·/.test(document.querySelector('[data-llevar-numeros]').innerText)")
    const t = JSON.parse(await a.evaluar(`JSON.stringify({ texto: document.querySelector('[data-tarjeta-destino]').innerText.replace(/\\s+/g, ' '), ver: Boolean(document.querySelector('[data-ver-destino]')), crear: Boolean(document.querySelector('[data-crear-viaje-destino]')), mas: Boolean(document.querySelector('[data-anadir-viaje]')) })`))
    debe(/Roma/.test(t.texto) && /LO QUE TE PUEDES LLEVAR/i.test(t.texto) && /medalla/.test(t.texto) && /colecciones/.test(t.texto) && /emblemas secretos/.test(t.texto) && t.ver && t.crear, 'tarjeta', `la tarjeta de Roma: nombre, «Lo que te puedes llevar» con medallas, colecciones y emblemas, [Ver destino] y [Crear viaje] (${t.texto})`)
    debe(!t.mas, 'boton_mas', 'con la tarjeta abierta el «+» se esconde')
    await a.captura(`${CAP}/P2_tarjeta_roma.jpg`)
    await clic(a, '[data-tarjeta-destino] > div:first-child')
    await a.esp(300)
    debe(Boolean(await a.evaluar("Boolean(document.querySelector('[data-anadir-viaje]'))")), 'boton_mas', 'al cerrar la tarjeta el «+» vuelve')
    await clic(a, '[data-destino-lista="florencia"]')
    await a.esp(500)
    const f = await a.evaluar("document.querySelector('[data-tarjeta-destino]').innerText.replace(/\\s+/g, ' ')")
    debe(/Próximamente/.test(f) && /Lo estamos preparando\. Te lo contamos en cuanto esté\./.test(f) && /Avísame/.test(f), 'proximamente', `un «Próximamente»: «Lo estamos preparando. Te lo contamos en cuanto esté.» y [Avísame] (${f})`)
    await a.captura(`${CAP}/P3_tarjeta_proximamente.jpg`)
    await clic(a, '[data-avisame="florencia"]')
    await esperar(a, "/Te avisaremos ✓/.test(document.querySelector('[data-tarjeta-destino]')?.innerText ?? '')")
    const av = JSON.parse(await a.evaluar('JSON.stringify(window.__demoPrimeraVez.avisos)'))
    debe(av.length === 1 && av[0].destino === 'Florencia', 'avisame', '[Avísame] guarda el aviso de Florencia en la cuenta')
    debe(/Te avisaremos ✓/.test(await a.evaluar("document.querySelector('[data-avisame=\"florencia\"]').innerText")), 'avisame', 'y el botón pasa a «Te avisaremos ✓»')

    console.log('6. [Ver destino] sin viaje y [Crear viaje] con el destino elegido')
    await clic(a, '[data-tarjeta-destino] > div:first-child')
    await clic(a, '[data-destino-lista="roma"]')
    await esperar(a, "Boolean(document.querySelector('[data-ver-destino]'))")
    await clic(a, '[data-ver-destino]')
    await esperar(a, "Boolean(document.querySelector('[data-pagina-destino] [data-lo-que-te-puedes-llevar]'))")
    await a.esp(1500)
    const d = JSON.parse(await a.evaluar(`JSON.stringify({
      linea: document.querySelector('[data-linea-destino]')?.innerText, noches: Boolean(document.querySelector('[data-noches-destino]')), tuAloj: Boolean(document.querySelector('[data-tu-alojamiento]')),
      llevar: Boolean(document.querySelector('[data-lo-que-te-puedes-llevar]')), medallas: document.querySelectorAll('[data-llevar-medallas] [data-medalla]').length, colecciones: document.querySelectorAll('[data-coleccion-adelanto]').length,
      sitios: [...document.querySelectorAll('[data-coleccion-adelanto] [data-sitios]')].every((x) => /\\d+ sitios?/.test(x.innerText)), emblemas: document.querySelectorAll('[data-emblema-silueta]').length,
      crear: document.querySelector('[data-crear-mi-viaje]')?.innerText.trim(), actividades: Boolean(document.querySelector('[data-actividades]')) || true,
      x: Boolean(document.querySelector('[data-cerrar-destino]')), barra: Boolean(document.querySelector('[data-crear-mi-viaje-barra]'))
    })`))
    debe(d.linea === 'Italia · La ciudad eterna', 'ver_destino', `la portada sin fechas, con el país y la línea corta (${d.linea})`)
    debe(!d.noches && !d.tuAloj, 'ver_destino', 'sin fechas y sin «Tu alojamiento»')
    debe(d.llevar && d.medallas >= 1 && d.colecciones >= 1 && d.sitios && d.emblemas >= 1, 'ver_destino', `«Lo que te puedes llevar»: ${d.medallas} medallas, ${d.colecciones} colecciones con su número de sitios y ${d.emblemas} emblemas secretos`)
    debe(/Crear mi viaje a Roma/.test(d.crear ?? '') && d.barra && d.x, 'ver_destino', '[Crear mi viaje a Roma] fijo abajo y la ✕ arriba en su sitio')
    const hueco = await a.evaluar("(() => { const c = document.querySelector('[data-pagina-destino]'); c.scrollTop = c.scrollHeight; const u = c.lastElementChild?.previousElementSibling ?? c; const b = document.querySelector('[data-crear-mi-viaje-barra]').getBoundingClientRect(); const ultimo = document.querySelector('[data-llevar-emblemas]').getBoundingClientRect(); return ultimo.bottom <= b.top + 40 })()")
    debe(hueco, 'ver_destino', 'al final de la página, lo último no queda tapado por el botón fijo')
    await a.esp(300)
    await a.captura(`${CAP}/D1_ver_destino_roma_abajo.jpg`)
    await a.evaluar("document.querySelector('[data-pagina-destino]').scrollTop = 0; true")
    await a.esp(400)
    await a.captura(`${CAP}/D1_ver_destino_roma.jpg`)
    debe(!(await a.evaluar("Boolean(document.querySelector('[data-anadir-viaje]'))")), 'boton_mas', 'en la página del destino el «+» está escondido')
    await clic(a, '[data-crear-mi-viaje]')
    await esperar(a, "Boolean(document.querySelector('[data-campo-destino]'))")
    const c = JSON.parse(await a.evaluar(`import('/src/store/useRouteStore.ts').then((m) => { const s = m.useRouteStore.getState(); return JSON.stringify({ pantalla: s.screen, destino: s.destination, lugar: s.destinationPlace?.name ?? null, origen: s.answers.origin ?? null }) })`))
    debe(c.pantalla === 'destination' && c.destino === 'Roma' && c.lugar === 'Roma' && !c.origen, 'crear_viaje', `[Crear mi viaje a Roma] abre la pantalla de crear viaje de siempre con Roma ya elegida y el origen vacío (${JSON.stringify(c)})`)
    const campos = await a.evaluar("JSON.stringify({ destino: document.querySelector('[data-campo-destino]')?.value ?? null, texto: document.body.innerText.slice(0, 400) })")
    debe(/Roma/.test(campos), 'crear_viaje', 'y se ve Roma en el destino de la pantalla')
    await a.captura(`${CAP}/crear_viaje_con_roma.jpg`)
  } finally {
    a.cerrar()
  }
}

console.log('7. Lanzarote (solo administradores): su tarjeta, [Crear viaje] y su página')
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: NUEVA + CURADOS_PRUEBA })
  try {
    await esperar(a, "Boolean(document.querySelector('[data-preguntas-primera-vez]'))")
    await clic(a, '[data-saltar]')
    for (let i = 0; i < 3; i++) {
      await a.esp(200)
      await clic(a, '[data-saltar]')
    }
    await esperar(a, "document.querySelectorAll('[data-pin]').length >= 4")
    const g = JSON.parse(await a.evaluar('JSON.stringify(window.__demoPrimeraVez)'))
    debe(g.guardados === 1 && g.frecuencia === null && g.compania === null && g.anio_nacimiento === null, 'una_vez', 'saltando todas las preguntas queda «hecho» sin guardar ningún dato')
    const lista = await a.evaluar("[...document.querySelectorAll('[data-destino-lista]')].map((x) => x.getAttribute('data-destino-lista') + ':' + x.getAttribute('data-listo')).join()")
    debe(lista === 'roma:1,lanzarote:1,florencia:0,berlin:0,cartagena_de_indias:0', 'ocultos', `para el administrador sale también Lanzarote (${lista})`)
    await clic(a, '[data-destino-lista="lanzarote"]')
    await esperar(a, "Boolean(document.querySelector('[data-crear-viaje-destino]'))")
    await a.captura(`${CAP}/P2_tarjeta_lanzarote.jpg`)
    await clic(a, '[data-crear-viaje-destino]')
    await esperar(a, "Boolean(document.querySelector('[data-campo-destino]'))")
    const c = JSON.parse(await a.evaluar(`import('/src/store/useRouteStore.ts').then((m) => { const s = m.useRouteStore.getState(); return JSON.stringify({ destino: s.destination, origen: s.answers.origin ?? null }) })`))
    debe(c.destino === 'Lanzarote' && !c.origen, 'crear_viaje', `[Crear viaje] desde Lanzarote abre ORIGEN/DESTINO con Lanzarote ya seleccionado (${JSON.stringify(c)})`)
  } finally {
    a.cerrar()
  }
}
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: NUEVA + CURADOS_PRUEBA })
  try {
    await esperar(a, "Boolean(document.querySelector('[data-preguntas-primera-vez]'))")
    for (let i = 0; i < 4; i++) {
      await clic(a, '[data-saltar]')
      await a.esp(250)
    }
    await esperar(a, "document.querySelectorAll('[data-pin]').length >= 4")
    await clic(a, '[data-destino-lista="lanzarote"]')
    await esperar(a, "Boolean(document.querySelector('[data-ver-destino]'))")
    await clic(a, '[data-ver-destino]')
    await esperar(a, "Boolean(document.querySelector('[data-linea-destino]'))")
    await a.esp(2000)
    const l = await a.evaluar("document.querySelector('[data-linea-destino]')?.innerText")
    debe(l === 'España · Isla de volcanes', 'ver_destino', `[Ver destino] de Lanzarote: «${l}»`)
    debe(!(await a.evaluar("Boolean(document.querySelector('[data-tu-alojamiento]'))")), 'ver_destino', 'Lanzarote sin «Tu alojamiento»')
    await a.captura(`${CAP}/D2_ver_destino_lanzarote.jpg`)
    await clic(a, '[data-crear-mi-viaje]')
    await esperar(a, "Boolean(document.querySelector('[data-campo-destino]'))")
    const c = await a.evaluar(`import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState().destination)`)
    debe(c === 'Lanzarote', 'crear_viaje', '[Crear mi viaje a Lanzarote] abre ORIGEN/DESTINO con Lanzarote ya seleccionado')
  } finally {
    a.cerrar()
  }
}

console.log('8. Con un viaje, el Perfil vuelve a ser el de siempre; quien ya contestó no ve las preguntas')
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: "try{localStorage.setItem('trazo:demo:primera_vez_nueva','si');localStorage.setItem('trazo:demo:primera_vez_hecha','si')}catch(e){}" })
  try {
    await a.esp(4000)
    debe(!(await a.evaluar("Boolean(document.querySelector('[data-preguntas-primera-vez]'))")), 'una_vez', 'quien ya las contestó (o saltó) no las vuelve a ver, aunque cierre y abra la app')
  } finally {
    a.cerrar()
  }
}
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844 })
  try {
    for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
    await a.evaluar('window.__rutaPrueba().then(() => true)')
    await a.esp(800)
    await a.evaluar("import('/src/store/usePerfilUi.ts').then((m) => m.usePerfilUi.getState().abrir()); true")
    await a.esp(2500)
    const p = JSON.parse(await a.evaluar("JSON.stringify({ mapa: Boolean(document.querySelector('[data-mapa-primera-vez]')), preguntas: Boolean(document.querySelector('[data-preguntas-primera-vez]')), misViajes: Boolean(document.querySelector('[data-mis-viajes]')) })"))
    debe(!p.mapa && !p.preguntas && p.misViajes, 'con_viaje', 'con un viaje el Perfil es el de siempre: sin el mapa y con «Mis viajes»')
  } finally {
    a.cerrar()
  }
}

console.log('9. El código')
{
  const sinComentarios = (t) => t.split('\n').filter((l) => !/^\s*(\/\*|\*|\/\/)/.test(l)).join('\n')
  const cuerpo = sinComentarios(leer('src/lib/primeraVez.ts') + leer('src/components/primeraVez/PreguntasPrimeraVez.tsx'))
  debe(!/ritmo|gustos/.test(cuerpo.split('guardarPrimeraVez')[1]?.split('export')[0] ?? ''), 'tres_datos', 'guardarPrimeraVez no manda el ritmo ni los gustos')
  debe(!/mapbox/i.test(sinComentarios(leer('src/components/primeraVez/MapaDeDestinos.tsx'))), 'mapa', 'el mapa del Perfil no usa Mapbox')
  debe(!/sorteo/i.test(sinComentarios(leer('src/components/primeraVez/MapaDeDestinos.tsx') + leer('src/components/primeraVez/TarjetaDeDestino.tsx'))), 'sorteo', 'nada del sorteo en lo nuevo')
  const mas = leer('src/components/primeraVez/BotonMas.tsx')
  debe(/prefers-reduced-motion/.test(mas) && /4\.5s/.test(mas) && !/infinite.*Crear viaje/.test(mas), 'boton_mas', 'el «+»: el reflejo cada 4,5 s (no sin parar) y quieto con «reducir movimiento»')
}

console.log(`\nPrueba de la Tanda V31: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
