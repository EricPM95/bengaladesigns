// La prueba de la Tanda 10H: [Escuchar historia] cerrado con su candado dentro, el nombre del pase siempre del destino, «HOY» y «Pase de X» en oro y cada fila de la tabla del día de prueba.
// Además saca las capturas (docs/dias/capturas_jutrip/h10_*.jpg) y las añade a docs/dias/GRATIS_REVISION.html.
// Hace falta `npm run server` y `npm run dev`.
//   API_URL=http://localhost:8787 node scripts/destino/pruebaTanda10H.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const png = (n) => path.join(SALIDA, `h10_${n}.jpg`)
const store = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState())"

/* ───────────────────────── 1. Ningún «Pase de Roma» escrito a mano ───────────────────────── */
{
  const ficheros = fs.readdirSync('src', { recursive: true }).map((f) => path.join('src', f)).filter((f) => /\.(tsx?|jsx?)$/.test(f))
  const sueltos = []
  for (const f of ficheros) {
    fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
      if (!/[Pp]ase de (Roma|París|Londres)/.test(l)) return
      if (/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(l) || /(\/\/|\/\*\*?)\s.*[Pp]ase de (Roma|París|Londres)/.test(l)) return // comentarios
      if (f.includes(`${path.sep}dev${path.sep}`)) return // datos de la ruta de pruebas
      // La lista del pase (antes película, Tanda 10I): `pelicula/gen/` es el código de Design tal cual (no se edita a mano) y `pelicula/adaptar.ts` lo lleva a cada destino: ahí «Pase de Roma» es el TEXTO ORIGINAL
      // de Design que se busca para cambiarlo por el nombre del pase del destino; no es un nombre escrito para mostrar.
      if (f.includes(`${path.sep}pelicula${path.sep}gen${path.sep}`) || f.endsWith(`${path.sep}pelicula${path.sep}adaptar.ts`)) return
      sueltos.push(`${f}:${i + 1}: ${l.trim().slice(0, 120)}`)
    })
  }
  debe(sueltos.length === 0, 'nombre', `ningún «Pase de Roma» escrito a mano en el código de la app (${sueltos.join(' | ') || 'ninguno'})`)
  const marca = fs.readFileSync('src/components/pase/Marca.tsx', 'utf8')
  debe(/#6F4E37/.test(marca) && /#A67C52/.test(marca) && /#E9C77A/.test(marca), 'oro', 'Marca lleva los tres oros: profundo (#6F4E37), oscuro (#A67C52) y pálido (#E9C77A)')
}

/* ───────────────────────── 2. La app ───────────────────────── */
async function conViaje(version) {
  const a = await abrirApp('http://localhost:5173', { ruta: `/?cuentas=off&logros=on&logrosDemo=1&version=${version}` })
  for (let i = 0; i < 120 && !(await a.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
  for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 60 && !(await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
  await a.esp(5000)
  await cerrar(a)
  return a
}
async function cerrar(a) {
  for (let i = 0; i < 4; i++) {
    const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await a.esp(700)
  }
}
const modo = async (a, m, dia = null) => {
  await a.evaluar(`${store}.then((s) => { s.setActiveDayId(${dia === null ? 'null' : 's.route.days[' + dia + '].id'}); s.setMode('${m}'); return true })`)
  await a.esp(2500)
  await cerrar(a)
}
const hoy = async (a, iso) => {
  // (si «hoy» no cambia, la pantalla no se vuelve a pintar: se pasa antes por otro día)
  await a.evaluar(`${store}.then((s) => { s.setDevSimulatedTodayIso('2000-01-01'); return true })`)
  await a.esp(400)
  await a.evaluar(`${store}.then((s) => { s.setDevSimulatedTodayIso(${iso ? `'${iso}'` : 'null'}); return true })`)
  await a.esp(1500)
}
const prueba = async (a, p) => {
  await a.evaluar(`window.__pruebaDelPase = ${p ? JSON.stringify({ cobro: true, conPase: false, puede: p.estado !== 'gastada', pruebaGastada: p.estado === 'gastada', prueba: p }) : 'undefined'}; true`)
  await a.esp(300)
}
const hojas = []
const sacar = async (a, id, titulo, texto) => {
  await a.captura(png(id))
  hojas.push({ id, titulo, texto })
}
const leerHoy = (a) =>
  a.evaluar(`(() => {
    const fila = document.querySelector('[data-hoy-prueba-fila]')
    const franja = document.querySelector('[data-franja-prueba]')
    const t = (e) => (e ? e.innerText.replace(/\\s+/g, ' ').trim() : null)
    return { fila: fila?.getAttribute('data-hoy-prueba-fila') ?? null, filaTexto: t(fila), franja: t(franja), verPase: Boolean(document.querySelector('[data-hoy-ver-pase]')), cuerpo: document.body.innerText.replace(/\\s+/g, ' ') }
  })()`)

// 2a. La función pura, con todas las filas de la tabla (se carga a través de vite).
const g = await conViaje('gratis')
{
  const r = await g.evaluar(`import('/src/lib/diaDePrueba.ts').then((m) => {
    const base = { destino: 'Roma', tripId: 'a' }
    const f = (o) => m.filaDeHoySinPase({ ...base, ...o })
    const pend = (fecha, tripId = 'a') => ({ estado: 'pendiente', fecha, tripId })
    const gast = (fecha, tripId = 'a') => ({ estado: 'gastada', fecha, tripId })
    return {
      lejos: f({ fase: 'before', hoyIso: '2026-10-01', inicioIso: '2026-10-17', prueba: pend('2026-10-18') }),
      otroDia: f({ fase: 'before', hoyIso: '2026-10-14', inicioIso: '2026-10-17', prueba: pend('2026-10-18') }),
      primerDia: f({ fase: 'before', hoyIso: '2026-10-14', inicioIso: '2026-10-17', prueba: pend('2026-10-17') }),
      otroViaje: f({ fase: 'before', hoyIso: '2026-10-14', inicioIso: '2026-10-17', prueba: gast('2026-06-02', 'b') }),
      manana: f({ fase: 'during', hoyIso: '2026-10-17', inicioIso: '2026-10-17', prueba: pend('2026-10-18') }),
      hoyEs: f({ fase: 'during', hoyIso: '2026-10-18', inicioIso: '2026-10-17', prueba: pend('2026-10-18') }),
      tras: f({ fase: 'during', hoyIso: '2026-10-19', inicioIso: '2026-10-17', prueba: gast('2026-10-18') }),
      parte: f({ fase: 'during', hoyIso: '2026-10-19', inicioIso: '2026-10-17', prueba: gast('2026-06-02', 'b') }),
      despues: f({ fase: 'after', hoyIso: '2026-10-25', inicioIso: '2026-10-17', prueba: pend('2026-10-18') }),
      sinFechas: f({ fase: null, hoyIso: '2026-10-14', inicioIso: null, prueba: pend('2026-10-18') }),
      paris: m.filaDeHoySinPase({ fase: 'after', hoyIso: '2026-10-25', inicioIso: '2026-10-17', prueba: { estado: null }, destino: 'París' }),
    }
  })`)
  debe(r.lejos.tipo === 'antes_sin_prueba' && r.lejos.texto === null, 'tabla', 'más de 5 días antes: ni una palabra de la prueba')
  debe(r.otroDia.tipo === 'prueba_otro_dia' && /Te regalamos un día con HOY para que lo pruebes: el domingo 18, gratis y completo\./.test(r.otroDia.texto), 'tabla', `desde 5 días antes, prueba otro día: ${r.otroDia.texto}`)
  debe(/las fotos que hagas el sábado también suman a tus logros/.test(r.otroDia.texto), 'tabla', 'y la frase de los logros promete las FOTOS (lo único que de verdad suma después), no «lo que veas»')
  debe(r.primerDia.tipo === 'prueba_primer_dia' && r.primerDia.texto === 'Te regalamos tu primer día con HOY para que lo pruebes: el sábado 17, gratis y completo.', 'tabla', `prueba el primer día: ${r.primerDia.texto}`)
  debe(r.otroViaje.tipo === 'antes_sin_prueba' && r.otroViaje.texto === null, 'tabla', 'antes del viaje con la prueba ya usada en otro viaje: solo la cuenta atrás')
  debe(r.manana.tipo === 'manana_es_prueba' && r.manana.texto === 'Mañana es tu día de prueba: queremos que vivas Roma con el Pase de Roma completo, gratis, un día entero.', 'tabla', `mañana es la prueba: ${r.manana.texto}`)
  debe(r.hoyEs.tipo === 'hoy_es_prueba' && r.hoyEs.texto === 'Hoy es tu día de prueba: tienes el Pase de Roma completo, gratis, hasta medianoche. Disfrútalo.', 'tabla', 'el día de la prueba: la franja')
  debe(r.tras.tipo === 'tras_prueba' && r.tras.verElPase && r.tras.texto === '¿Qué tal ayer con HOY? Sigue con tu compañero el resto del viaje y completa los secretos y las colecciones de Roma. Lo que conseguiste ayer ya es tuyo.', 'tabla', 'después de la prueba, con [Ver el Pase de Roma]')
  debe(r.parte.tipo === 'parte_del_pase' && r.parte.texto === 'Tu modo Hoy es parte del Pase de Roma.', 'tabla', 'prueba usada en otro viaje, durante el viaje')
  debe(r.despues.tipo === 'viaje_terminado' && r.despues.texto === 'Tu viaje a Roma ha terminado. La próxima vez, con el Pase de Roma, te acompañamos todo el viaje.' && !/prueba/i.test(r.despues.texto), 'tabla', 'después del viaje: nada de la prueba')
  debe(r.sinFechas.tipo === 'pon_fechas', 'tabla', 'sin fechas: «Pon tus fechas»')
  debe(/Pase de París/.test(r.paris.texto) && /viaje a París/.test(r.paris.texto) && !/Roma/.test(r.paris.texto), 'nombre', `con otro destino, el nombre sale del dato: ${r.paris.texto}`)
}

// 2b. HOY en pantalla, fila a fila.
await g.evaluar("import('/src/store/useSyncStore.ts').then((m) => { m.useSyncStore.getState().setActiveTripId('viaje-de-esta-prueba'); return true })")
await modo(g, 'today')
const casos = [
  { id: '01_lejos', hoy: '2026-10-01', p: { estado: 'pendiente', fecha: '2026-10-18', tripId: 'viaje-de-esta-prueba' }, tipo: null, titulo: 'HOY, más de 5 días antes', texto: 'La cuenta atrás y lo que tendrás. Nada de la prueba.' },
  { id: '02_otro_dia', hoy: '2026-10-14', p: { estado: 'pendiente', fecha: '2026-10-18', tripId: 'viaje-de-esta-prueba' }, tipo: 'prueba_otro_dia', titulo: 'HOY, desde 5 días antes (la prueba es otro día)', texto: 'Debajo de la cuenta atrás: «Te regalamos un día con HOY… el domingo 18, gratis y completo».' },
  { id: '03_primer_dia', hoy: '2026-10-14', p: { estado: 'pendiente', fecha: '2026-10-17', tripId: 'viaje-de-esta-prueba' }, tipo: 'prueba_primer_dia', titulo: 'HOY, desde 5 días antes (la prueba es el primer día)', texto: '«Te regalamos tu primer día con HOY… el sábado 17, gratis y completo».' },
  { id: '04_otro_viaje', hoy: '2026-10-14', p: { estado: 'gastada', fecha: '2026-06-02', tripId: 'otro-viaje' }, tipo: null, titulo: 'HOY, antes, con la prueba ya usada en otro viaje', texto: 'Solo la cuenta atrás.' },
  { id: '05_manana', hoy: '2026-10-17', p: { estado: 'pendiente', fecha: '2026-10-18', tripId: 'viaje-de-esta-prueba' }, tipo: 'manana_es_prueba', titulo: 'HOY, el día de llegada (la prueba es mañana)', texto: '«Mañana es tu día de prueba…».' },
  { id: '06_hoy_es_prueba', hoy: '2026-10-18', p: { estado: 'pendiente', fecha: '2026-10-18', tripId: 'viaje-de-esta-prueba' }, tipo: 'franja', titulo: 'HOY, el día de la prueba', texto: 'HOY entero y, arriba, la franja «Hoy es tu día de prueba…».' },
  { id: '07_tras_prueba', hoy: '2026-10-19', p: { estado: 'gastada', fecha: '2026-10-18', tripId: 'viaje-de-esta-prueba' }, tipo: 'tras_prueba', titulo: 'HOY, después de la prueba', texto: '«¿Qué tal ayer con HOY?…» y [Ver el Pase de Roma].' },
  { id: '08_parte_del_pase', hoy: '2026-10-19', p: { estado: 'gastada', fecha: '2026-06-02', tripId: 'otro-viaje' }, tipo: 'parte_del_pase', titulo: 'HOY, durante el viaje con la prueba usada en otro viaje', texto: '«Tu modo Hoy es parte del Pase de Roma.»' },
  { id: '09_despues', hoy: '2026-10-25', p: { estado: 'pendiente', fecha: '2026-10-18', tripId: 'viaje-de-esta-prueba' }, tipo: 'viaje_terminado', titulo: 'HOY, después del viaje', texto: 'Nada de la prueba: «Tu viaje a Roma ha terminado…».' },
]
const COLORES_ORO = ['rgb(111, 78, 55)', 'rgb(166, 124, 82)', 'rgb(233, 199, 122)']
for (const c of casos) {
  await prueba(g, c.p)
  await hoy(g, c.hoy)
  await g.esp(1500)
  const r = await leerHoy(g)
  if (c.tipo === null) {
    debe(r.fila === null && !r.franja && !/día de prueba|Te regalamos/.test(r.cuerpo), 'pantalla', `${c.titulo}: no se habla de la prueba (${r.fila ?? 'sin fila'})`)
  } else if (c.tipo === 'franja') {
    debe(Boolean(r.franja) && /Hoy es tu día de prueba: tienes el Pase de Roma completo, gratis, hasta medianoche\. Disfrútalo\./.test(r.franja), 'pantalla', `${c.titulo}: la franja arriba (${r.franja})`)
    debe(!/Con el pase tendrás/.test(r.cuerpo), 'pantalla', `${c.titulo}: HOY entero, sin la lista de lo cerrado`)
  } else {
    debe(r.fila === c.tipo, 'pantalla', `${c.titulo}: sale la fila ${c.tipo} (${r.fila})`)
    if (c.tipo === 'tras_prueba') debe(r.verPase && /Ver el Pase de Roma/.test(r.cuerpo), 'pantalla', `${c.titulo}: con [Ver el Pase de Roma]`)
    if (c.tipo === 'viaje_terminado') debe(!/Tienes un día de prueba/.test(r.cuerpo), 'pantalla', `${c.titulo}: ya no sale «Tienes un día de prueba»`)
  }
  // El oro de HOY y de Pase de Roma en el texto de la fila.
  const oro = await g.evaluar(`Array.from(document.querySelectorAll('[data-hoy-prueba-fila] [data-marca], [data-franja-prueba] [data-marca]')).map((e) => ({ t: e.textContent, c: getComputedStyle(e).color }))`)
  if (c.tipo) {
    debe(oro.length > 0 && oro.every((m) => COLORES_ORO.includes(m.c)), 'oro', `${c.titulo}: «${oro.map((m) => m.t).join('», «')}» en oro (${oro.map((m) => m.c).join(' ')})`)
    const texto = r.filaTexto ?? r.franja ?? ''
    const cuantosHoy = (texto.match(/\bHOY\b/g) ?? []).length
    debe(oro.filter((m) => m.t === 'HOY').length >= cuantosHoy, 'oro', `${c.titulo}: todo «HOY» del texto va dentro de Marca`)
  }
  await sacar(g, c.id, c.titulo, c.texto)
}
// Sin fechas: «Pon tus fechas».
await prueba(g, { estado: 'pendiente', fecha: '2026-10-18', tripId: 'viaje-de-esta-prueba' })
await hoy(g, null)
await g.evaluar(`${store}.then((s) => { s.setRouteDateRange(undefined); return true })`)
await g.esp(2500)
{
  const r = await leerHoy(g)
  debe(/Pon tus fechas/.test(r.cuerpo) && !/Te regalamos|día de prueba/.test(r.cuerpo), 'pantalla', 'sin fechas: «Pon tus fechas» y nada de la prueba')
  await sacar(g, '10_sin_fechas', 'HOY, sin fechas', '«Pon tus fechas» (sin prueba hasta que haya fechas).')
}
await prueba(g, null)
g.cerrar()

// 2c. [Escuchar historia] sin pase, en la ficha.
const e = await conViaje('gratis')
for (let i = 0; i < 30 && !(await e.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await e.esp(1000)
// (Tanda 10P: la historia de prueba es la que el viajero elija; para ver el botón CERRADO, ya se ha gastado la de Roma en otro sitio.)
await e.evaluar("import('/src/lib/historiaDePrueba.ts').then((m) => { m.useHistoriaDePrueba.getState().poner({ roma: { sitio: 'otro sitio', nombre: 'Otro sitio' } }); return true })")
await modo(e, 'days', 0)
await e.evaluar("(() => { const p = document.querySelector('[data-stop-id]'); if (!p) return false; (p.querySelector('button') || p).click(); return true })()")
await e.esp(3500)
{
  const cerrados = await e.evaluar(`Array.from(document.querySelectorAll('[data-escuchar="candado"]')).map((x) => ({ candado: Boolean(x.querySelector('[data-candado-dentro]')), dentro: Boolean(x.querySelector('button [data-candado-dentro]')), texto: x.innerText.replace(/\\s+/g, ' ').trim() }))`)
  debe(cerrados.length > 0, 'escuchar', `sin pase, en la ficha sale [Escuchar historia] cerrado (${cerrados.length})`)
  debe(cerrados.every((x) => x.candado && x.dentro), 'escuchar', 'con el candado dorado dentro del botón')
  debe(cerrados.every((x) => !/versión completa/i.test(x.texto)), 'escuchar', 'y ya no dice «Con la versión completa»')
  debe(!(await e.evaluar("document.body.innerText.includes('Con la versión completa')")), 'escuchar', 'ese texto no sale en ninguna parte de la pantalla')
  const pos = await e.evaluar(`(() => { const b = document.querySelector('[data-escuchar="candado"] button'); const c = b?.querySelector('[data-candado-dentro]'); if (!b || !c) return null; const rb = b.getBoundingClientRect(), rc = c.getBoundingClientRect(); return { derecha: rb.right - rc.right, izquierda: rc.left - rb.left } })()`)
  debe(pos && pos.derecha < pos.izquierda && pos.derecha < 30, 'escuchar', `el candado está en el extremo derecho del botón (${JSON.stringify(pos)})`)
  await sacar(e, '11_escuchar_cerrado', '[Escuchar historia] sin pase', 'El mismo botón de siempre, con el candado dorado en el extremo derecho, dentro, sobre marfil. Se quitó «Con la versión completa».')
  await e.evaluar("(() => { const b = document.querySelector('[data-escuchar=\"candado\"] button'); if (b) b.click(); return true })()")
  await e.esp(1500)
  // (Tanda 10N6 §1g) Ya no se pinta «Incluido con el Pase» en el botón: sale el aviso pequeño del pase (escuchar_historia) y su [Ver el Pase] abre la lista del pase.
  const aviso = await e.evaluar("document.querySelector('[data-aviso-pase=\"escuchar_historia\"]')?.innerText ?? null")
  debe(/Desbloquéalo con el Pase/.test(aviso ?? "") && /podrás escuchar todas las historias que quieras, sin límite/.test(aviso ?? ""), 'escuchar', `al tocarlo sale el aviso pequeño del pase (${aviso})`)
  const oroIncl = await e.evaluar("getComputedStyle(document.querySelector('[data-aviso-pase-titulo] em')).color")
  debe(COLORES_ORO.includes(oroIncl) || oroIncl === 'rgb(243, 216, 143)', 'oro', `«Pase Roma» del aviso va en oro (${oroIncl})`)
  await e.evaluar("document.querySelector('[data-aviso-pase-ver]').click(); true")
  // (Tanda 10I: abrirPase() ya no abre la hoja de compra suelta: lo escucha ListaDelPaseHost y abre la lista del pase (10N10, 8b), que se baja al abrirse.)
  let pelicula = false
  for (let i = 0; i < 10 && !pelicula; i++) {
    pelicula = await e.evaluar("Boolean(document.querySelector('[data-lista-del-pase]'))")
    if (!pelicula) await e.esp(500)
  }
  debe(pelicula === true, 'escuchar', 'y se abre el pase (abrirPase abre la lista del pase)')
}
e.cerrar()
{
  const usos = fs.readdirSync('src/components', { recursive: true }).filter((f) => /\.tsx$/.test(f)).map((f) => fs.readFileSync(path.join('src/components', f), 'utf8')).filter((t) => /<Escuchar[\s\S]{0,400}\blibre\b/.test(t))
  debe(usos.length > 0, 'escuchar', 'la historia de muestra (Coliseo) sigue marcada como libre')
}

/* ───────────────────────── 3. GRATIS_REVISION.html ───────────────────────── */
{
  const img = (id) => `data:image/jpeg;base64,${fs.readFileSync(png(id)).toString('base64')}`
  const bloque = hojas.map((h) => `<figure data-h10><img src="${img(h.id)}" alt="${h.titulo}" loading="lazy"><figcaption><strong>10H · ${h.titulo}</strong><span>${h.texto}</span></figcaption></figure>`).join('\n')
  let html = fs.readFileSync('docs/dias/GRATIS_REVISION.html', 'utf8')
  html = html.replace(/<figure data-h10>[\s\S]*?<\/figure>\n?/g, '')
  html = html.replace('</main>', `${bloque}\n</main>`)
  fs.writeFileSync('docs/dias/GRATIS_REVISION.html', html)
}

if (fallos.length) {
  console.log(`\n${fallos.length} FALLOS de ${comprobaciones}:`)
  for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
  process.exit(1)
}
console.log(`Tanda 10H: ${comprobaciones} comprobaciones, 0 fallos`)
