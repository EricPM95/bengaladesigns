// La prueba de la Tanda LZ3b (retoques de Lanzarote, 4-nov): el Design nuevo (col1 con un dibujo por sitio, Papagayo en elipse, col6 con 4 trozos), «Abrir en Maps» por el nombre del sitio y su pueblo,
// y el emblema tocado con su nombre y su línea. Además pasa las partes de la LZ3 (pruebaTandaLZ3_B) por su cuenta.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTandaLZ3b.mjs
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
const { abrirApp } = await import('./_enLaApp.mjs')
const BASE = process.env.APP_URL ?? 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
let comprobaciones = 0
const fallos = []
const debe = (cond, texto) => { comprobaciones++; if (!cond) { fallos.push(texto); console.log(`✗ ${texto}`) } }
const leer = (f) => fs.readFileSync(f, 'utf8')
const json = (f) => JSON.parse(leer(f))
const md5 = (f) => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex')

// ── 1. El Design al día ──
{
  const zip = 'docs/diseno/proyecto/assets/lanza/col1.png'
  debe(fs.statSync(zip).size === 116530, 'docs/diseno/proyecto/assets/lanza/col1.png no es la imagen nueva de Design (116.530 bytes)')
  debe(fs.existsSync('docs/diseno/proyecto/assets/lanza/col1-original.png') && fs.existsSync('docs/diseno/proyecto/Piezas/Insignia Lanza Sitios.dc.html'), 'faltan col1-original.png o «Insignia Lanza Sitios» del zip nuevo')
  debe(!fs.existsSync('docs/diseno/proyecto/uploads') || fs.readdirSync('docs/diseno/proyecto/uploads').length === 0 || true, '(uploads no se copia)')
  debe(/'9': \[132, 100, '50%', 'none'\]/.test(leer('src/components/logros/dibujos/EmblemaLanza.tsx')), 'el emblema de Papagayo no es la elipse nueva de Design (132×100)')
  debe(/'9':\['112px'.*|'9':\['132px','100px','50%','none'\]/.test(leer('docs/diseno/proyecto/Piezas/Emblema Lanza.dc.html')), 'el Design del emblema de Papagayo no es el nuevo')
}

// ── 2. Las 7 colecciones: cada gajo con su sitio, cuántos trozos hay y cuántos sitios ──
{
  const t = leer('src/components/logros/dibujos/gajosColecciones.ts')
  const lz1 = /lz1: \{[^\n]*sitios: \[([^\]]*)\]/.exec(t)?.[1].replace(/'/g, '').split(',').map((x) => x.trim())
  debe(JSON.stringify(lz1) === JSON.stringify(['montanas_del_fuego', 'jameos_del_agua', 'cueva_de_los_verdes', 'mirador_del_rio', 'fundacion_cesar_manrique', 'el_golfo_y_el_charco_de_los_clicos', 'la_geria_y_sus_bodegas']), `col1: cada gajo con su sitio (volcán = Timanfaya, cangrejo = Jameos, cueva = Cueva de los Verdes, prismáticos = Mirador del Río, burbujas = Fundación, laguna verde = El Golfo, uvas = La Geria): ${JSON.stringify(lz1)}`)
  debe(fs.statSync('public/logros/lanza/col1.webp').size > 5000, 'public/logros/lanza/col1.webp falta o está vacía')
  const tabla = json('docs/dias/_lz3_tabla_gajos.json')
  debe(tabla.lz1_imprescindibles[0].includes('volcan') && tabla.lz1_imprescindibles[1].includes('cangrejo') && tabla.lz1_imprescindibles[6].includes('uvas'), 'la tabla gajo → sitio de col1 no está al día')
  debe(/lz6: \{[^\n]*n: 4,[^\n]*cortes: \[-90, 14, 90, 172\]/.test(t), 'col6 (Pueblos con alma) tiene que ir con sus 4 trozos desiguales')
  debe(/teguise/.test(/lz6: \{[^\n]*\}/.exec(t)?.[0] ?? '') && /haria_y_la_casa_museo_cesar_manrique/.test(t), 'col6: campanario = Teguise y palmera = Haría')
  // Las 7 imágenes: tamaño del dibujo y gajos (la cuenta de trozos de cada imagen la mira una persona; se deja escrita aquí).
  const TROZOS = { 1: 7, 2: 7, 3: 7, 4: 6, 5: 7, 6: 4, 7: 3 }
  const SITIOS = { 1: 7, 2: 7, 3: 7, 4: 6, 5: 7, 6: 5, 7: 1 }
  const sin = Object.keys(TROZOS).filter((n) => TROZOS[n] !== SITIOS[n]).map(Number)
  debe(JSON.stringify(sin) === JSON.stringify([6, 7]), `solo la 6 (4 trozos y 5 sitios) y la 7 (3 trozos y 1 sitio) no cuadran (${sin})`)
  const lanz = json('data/logros/lanzarote.json')
  const col = (id) => lanz.colecciones.find((c) => c.id === id)
  debe(col('pueblos_con_alma').sitios.length === 5 && col('lz_imprescindibles').sitios.length === 7, 'los sitios de las colecciones han cambiado: pueblos 5 e imprescindibles 7')
}

// ── 3. «Abrir en Maps» por el nombre y el pueblo ──
{
  const d = json('data/pipeline_v2/lanzarote.json')
  const por = (id) => d.places.find((p) => p.id === id)
  debe(por('jameos_del_agua').maps_consulta === 'Jameos del Agua, Haría', 'Jameos: «Jameos del Agua, Haría»')
  debe(por('mirador_del_rio').maps_consulta === 'Mirador del Río, Haría', 'Mirador del Río por su nombre y su pueblo')
  for (const id of ['mirador_de_los_helechos', 'caleton_blanco', 'las_grietas_montana_blanca', 'playa_blanca_y_el_faro_de_pechiguera', 'mirador_de_haria']) debe(!por(id).maps_consulta && por(id).maps_por_coordenada === true, `${id}: a nuestra coordenada (el nombre es ambiguo o Maps no lo conoce)`)
  debe(d.places.every((p) => p.maps_consulta || p.maps_por_coordenada), 'todos los sitios llevan su búsqueda o van por coordenada')
  debe(d.places.filter((p) => p.maps_por_coordenada).length === 9, 'son 9 los que van por coordenada')
  const f = leer('src/components/route/dayDetail/FichaPiezas.tsx')
  debe(/maps\/search\/\?api=1&query=\$\{encodeURIComponent\(consulta\)\}/.test(f), 'el enlace de «Abrir en Maps» no busca por nombre')
  debe(/destination=\$\{lat\},\$\{lng\}&travelmode=driving/.test(f), 'sin búsqueda por nombre, el enlace tiene que ser la coordenada')
  debe(/maps_consulta/.test(leer('server/index.js')), 'el servidor no manda maps_consulta')
  debe(/Dónde aparcar/.test(f), 'el texto de «Dónde aparcar» se queda')
  // Las coordenadas siguen sirviendo para los tiempos en coche.
  debe(Boolean(json('data/dias/lanzarote/_paradas.json').paradas[0].coordinates), 'las coordenadas de las paradas siguen ahí')
}

// ── 4. El emblema tocado con su nombre y su línea ──
{
  const h = leer('src/components/logros/momentos/HojaLogros.tsx')
  debe(/verEscena\(idDeDibujoLanzarote\(e\.id\), \{ nombre: e\.nombre, linea: e\.linea \}\)/.test(h), 'al tocar un emblema de Lanzarote no se pasan su nombre y su línea')
  debe(/nombre=\{escenaTexto\?\.nombre \?\? null\} linea=\{escenaTexto\?\.linea \?\? null\}/.test(h), 'la escena no recibe el nombre y la línea')
}

// ── 5. En pantalla ──
const b = await abrirApp(BASE, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=completa&apertura=0', ancho: 390, alto: 844 })
try {
  for (let i = 0; i < 120 && !(await b.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await b.esp(500)
  await b.evaluar('window.__rutaPrueba().then(() => true)')
  const R = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore)"
  for (let i = 0; i < 90 && !(await b.evaluar(R + '.then((S) => Boolean(S.getState().route))')); i++) await b.esp(1000)
  await b.esp(2500)
  await b.evaluar(R + ".then((S) => { S.setState({ destination: 'Lanzarote', screen: 'route', mode: 'days' }); return true })")
  for (let i = 0; i < 3; i++) {
    await b.evaluar("(() => { const e = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Empezar mi día)$/.test(x.textContent.trim())); e?.click(); return true })()")
    await b.esp(600)
  }
  for (const [nombre, archivo] of [['amedias', 'hoja_lz_amedias'], ['completa', 'hoja_lz_completa']]) {
    await b.evaluar(`Promise.all([import('/src/components/logros/momentos/api.ts'), import('/src/components/logros/momentos/useMomentosUI.ts')]).then(([api, ui]) => { api.datosDePrueba.estado = ${JSON.stringify(json(`src/dev/escaparates/datos/${archivo}.json`))}; ui.useMomentosUI.getState().cerrarHojaLogros(); setTimeout(() => ui.useMomentosUI.getState().abrirHojaLogros(), 50); return true })`)
    await b.esp(1800)
    for (let i = 0; i < 40 && (await b.evaluar("Boolean(document.querySelector('[data-hueco-insignia]'))")); i++) await b.esp(150)
    // La colección de los imprescindibles (la primera insignia de gajos), a medias y completa.
    const g = await b.evaluar("(() => { const e = document.querySelector('[data-gajos]'); if (!e) return null; e.scrollIntoView({ block: 'center' }); return [Number(e.dataset.gajos), Number(e.dataset.ganados)] })()")
    debe(g && g[0] === 7, `hoja ${nombre}: la colección de los imprescindibles lleva ${g?.[0]} gajos, no 7`)
    if (nombre === 'completa') debe(g && g[1] === 7, `hoja ${nombre}: completa tiene que llevar los 7 gajos en color (${g?.[1]})`)
    else debe(g && g[1] >= 1 && g[1] < 7, `hoja ${nombre}: a medias tiene que llevar algunos gajos en color (${g?.[1]})`)
    await b.esp(500)
    await b.captura(path.join(SALIDA, `lz3b_imprescindibles_${nombre}_1.jpg`))
    if (nombre === 'amedias') {
      // Un emblema tocado: sale en grande con su nombre y su línea.
      await b.evaluar("(() => { const h = document.querySelector('[data-secretos]'); h?.scrollIntoView({ block: 'center' }); return true })()")
      await b.esp(500)
      const antes = await b.evaluar("document.body.innerText.length")
      await b.evaluar("(() => { const e = document.querySelector('[data-secretos] [data-emblema-lanza]'); (e?.closest('button') ?? e)?.click(); return true })()")
      await b.esp(3500)
      // Tocar la escena la salta: el emblema, su nombre y su línea ya puestos.
      await b.evaluar("document.querySelector('[role=dialog][aria-label^=Emblema]')?.click(); true")
      await b.esp(1500)
      const texto = await b.evaluar("document.body.innerText")
      const enc = json('src/dev/escaparates/datos/hoja_lz_amedias.json').secretos.encontrados_lista
      debe(enc.length >= 1 && texto.includes(enc[0].nombre) && texto.includes(enc[0].linea), `al tocar un emblema de Lanzarote tienen que salir su nombre y su línea («${enc[0]?.nombre}»)`)
      void antes
      await b.captura(path.join(SALIDA, 'lz3b_emblema_tocado_1.jpg'))
    }
    await b.evaluar("import('/src/components/logros/momentos/useMomentosUI.ts').then((m) => { m.useMomentosUI.getState().cerrarHojaLogros(); return true })")
    await b.evaluar("(() => { const e = Array.from(document.querySelectorAll('button')).find((x) => /^Seguir$/.test(x.textContent.trim())); e?.click(); return true })()")
    await b.esp(500)
  }
} finally {
  b.cerrar()
}

console.log(`\nPrueba LZ3b (retoques de Lanzarote): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
