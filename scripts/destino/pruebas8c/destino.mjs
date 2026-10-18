// La prueba de las pantallas de un destino (Tanda 8C2): la página de cada destino (G1, G2, T3), una colección por dentro (A) y «Mi colección» (M1, M2).
// Comprueba el código (reglas del encargo) y la lógica pura del servidor (server/logros/pantallas/destino.js) sobre los datos de verdad (data/logros/*.json).
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const titulo = 'Pantallas de un destino: página de destino, colección por dentro y Mi colección'

const raiz = process.cwd()
const ruta = (...p) => path.join(raiz, ...p)
const importar = (f) => import(pathToFileURL(ruta(f)).href)

export default async function ({ debe, leer, archivos, sinComentarios }) {
  const ficheros = {
    pagina: 'src/components/logros/pantallas/PaginaDeDestino.tsx',
    coleccion: 'src/components/logros/pantallas/ColeccionPorDentro.tsx',
    mi: 'src/components/logros/pantallas/MiColeccion.tsx',
    servidor: 'server/logros/pantallas/destino.js',
    demo: 'src/lib/logrosDemo_destino.ts',
    escaparate: 'src/dev/escaparates/destino.ts',
  }
  for (const [k, f] of Object.entries(ficheros)) debe(fs.existsSync(ruta(f)), 'archivos', `existe ${f}`)
  const subcarpeta = archivos(ruta('src/components/logros/pantallas/destino'), /.(ts|tsx|css)$/)
  debe(subcarpeta.length >= 4, 'archivos', 'la subcarpeta pantallas/destino tiene sus archivos (api, formato, piezas, css)')
  const codigo = [ficheros.pagina, ficheros.coleccion, ficheros.mi, ...subcarpeta.map((f) => path.relative(raiz, f))].filter((f) => /\.(tsx?|css)$/.test(f))
  const texto = (f) => sinComentarios(leer(ruta(f)))

  /* ── Las pantallas se abren con las firmas de la base y cargan perezosamente ── */
  const host = leer(ruta('src/components/logros/pantallas/PantallasHost.tsx'))
  for (const f of ['PaginaDeDestino', 'ColeccionPorDentro', 'MiColeccion']) debe(new RegExp(`import\\('\\./${f}'\\)`).test(host), 'lazy', `${f} se carga con import() desde PantallasHost (nada nuevo en el paquete que baja al abrir)`)
  for (const f of codigo.filter((x) => x.endsWith('.tsx') || x.endsWith('.ts'))) {
    const t = texto(f)
    // Ningún archivo de la app (fuera de las pantallas) importa estos archivos: solo el anfitrión, perezoso.
    debe(!/from '\.\.\/\.\.\/\.\.\/\.\.\/server/.test(t), 'servidor', `${f} no importa código del servidor`)
  }
  for (const f of archivos(ruta('src'), /\.(ts|tsx)$/)) {
    const rel = path.relative(raiz, f).replace(/\\/g, '/')
    if (rel.includes('pantallas/')) continue
    if (rel.startsWith('src/dev/') || rel === 'src/lib/logrosDemo_destino.ts') continue
    debe(!/pantallas\/(PaginaDeDestino|ColeccionPorDentro|MiColeccion)['"]/.test(leer(f)), 'lazy', `${rel} no importa mis pantallas de forma fija`)
  }

  /* ── Las reglas que no se pueden saltar ── */
  const visible = codigo.map((f) => texto(f)).join('\n')
  debe(!/Civitatis|Booking|Stay22|WhatsApp|Instagram|Tiktok|TikTok|Apple Maps|Google Maps|Routy/i.test(visible), 'empresas', 'ningún nombre de empresa ni de la app en los textos de mis pantallas')
  debe(!/\b([01]?\d|2[0-3]):[0-5]\d\b/.test(visible.replace(/viewBox|rotate\([^)]*\)/g, '')), 'horas', 'ninguna hora (ni la de Madrugador ni la de Nocturno) en mis pantallas')
  debe(!/madrugador|nocturno/i.test(visible), 'horas', 'mis pantallas no nombran a Madrugador ni Nocturno')
  debe(/prefers-reduced-motion: reduce/.test(leer(ruta('src/components/logros/pantallas/destino/destino.css'))), 'reducir_movimiento', 'destino.css apaga las animaciones con «reducir movimiento»')
  for (const f of [ficheros.pagina, ficheros.coleccion, ficheros.mi]) debe(/className="dst"/.test(texto(f)), 'reducir_movimiento', `${f} cuelga de la clase .dst (la que apaga el movimiento)`)
  // Zonas de toque: todo botón es de 44 px como mínimo.
  debe(/width: 44, height: 44/.test(texto('src/components/logros/pantallas/destino/piezas.tsx')), '44px', 'el botón de volver mide 44 × 44')
  debe(/height: 44, padding: '0 14px 0 12px'/.test(texto(ficheros.pagina)), '44px', '«Todos mis logros» mide 44 de alto')
  debe(/minHeight: 44, borderRadius: 18/.test(texto(ficheros.pagina)), '44px', 'cada colección de la página mide al menos 44')
  debe(/height: 44, padding: 0, border: 'none'/.test(texto(ficheros.coleccion)), '44px', '[Cómo llegar] tiene 44 de zona de toque (el dibujo es de 28)')
  debe(/minHeight: 44, border: 'none'/.test(texto(ficheros.mi)), '44px', 'cada hueco de Mi colección mide al menos 44')
  debe(/width: 48, height: 48/.test(texto(ficheros.mi)), '44px', 'cerrar la hoja de «cómo conseguirlo» mide 48')
  // Los emblemas ocultos que faltan: solo «?», nunca cuáles son.
  const pag = texto(ficheros.pagina)
  debe(/faltan/.test(pag) && />\?<\/span>/.test(pag), 'secretos', 'los emblemas que faltan se pintan como «?»')
  debe(!/emblemas\.(todos|catalogo)|d\.emblemas/.test(pag), 'secretos', 'la página no lee la lista de emblemas del destino: solo los encontrados')
  debe(/\.emblemas\.lista\.map/.test(pag), 'secretos', 'solo se dibujan los emblemas de la lista de encontrados')
  // Ningún número escrito a mano: los que se ven salen de los datos.
  debe(!/\b(de 11|de 12|de 8)\b/.test(visible), 'numeros', 'ningún «N de 11/12/8» escrito a mano en el código')
  // Los demás nombres de pantalla del encargo (se abren con las firmas de la base).
  debe(/abrir\(\{ t: 'coleccion'/.test(pag), 'navegacion', 'cada colección abre su álbum con abrir({ t: «coleccion», … })')
  debe(/abrir\(\{ t: 'ficha', clave: l\.clave/.test(texto(ficheros.mi)), 'navegacion', 'tocar un logro ganado abre su ficha con su clave')
  debe(/setAbierto\(l\)/.test(texto(ficheros.mi)), 'navegacion', 'tocar un hueco abre la hoja de «cómo conseguirlo»')
  debe(/como/.test(texto(ficheros.mi)) && !/linea}/.test(texto(ficheros.mi).split('ComoConseguirlo')[2] ?? ''), 'como', 'la hoja de un hueco solo dice la línea «como»')
  // El Vaticano dentro de Roma.
  debe(/Estás aquí/.test(pag) && /vaticano/.test(pag), 'vaticano', 'el sello del Vaticano sale marcado «Estás aquí» dentro de Roma')

  /* ── La lógica pura de las fechas y las páginas ── */
  const f = await importar('src/components/logros/pantallas/destino/formato.ts')
  debe(f.fechaCorta('2026-10-11') === '11 oct 2026', 'fechas', 'fechaCorta: 11 oct 2026')
  debe(f.fechaCorta(null) === '' && f.fechaCorta('mal') === '', 'fechas', 'fechaCorta: sin fecha, nada')
  debe(f.diaDeRuta({ numero: 3, fecha: '2026-10-14' }) === 'Día 3 · mié 14', 'fechas', 'diaDeRuta: Día 3 · mié 14')
  debe(f.diaDeRuta(null) === '', 'fechas', 'diaDeRuta: sin día, nada')
  debe(f.conDe('Roma') === 'de Roma' && f.conDe('El Vaticano') === 'del Vaticano', 'textos', 'conDe: de Roma / del Vaticano')
  debe(f.enPaginas([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).length === 2 && f.enPaginas([]).length === 1, 'paginas', 'enPaginas: 10 logros → 2 páginas; vacío → 1')

  /* ── El servidor, con los datos de verdad ── */
  const { cargarDatos, cargarCatalogo } = await importar('server/logros/datos.js')
  const s = await importar('server/logros/pantallas/destino.js')
  const { logrosVisibles } = await importar('server/logros/vistas.js')
  const datos = cargarDatos()
  const catalogos = { roma: cargarCatalogo('roma') }
  const roma = datos.destinos.roma
  const nombreDe = (id) => catalogos.roma.places.find((p) => p.id === id)?.name ?? id
  const item = (destino, logro, escalon, dia = '2026-10-11') => [`${destino}|${logro}|${escalon}`, { clave: `${destino}|${logro}|${escalon}`, logro, escalon: String(escalon), destino, en: `${dia}T10:00:00Z` }]
  const mapa = (...it) => new Map(it)

  // Sin nada ganado: ningún emblema a la vista, ni su nombre ni su sitio.
  const vacia = s.paginaDeDestino({ datos, destino: 'roma', items: new Map() })
  debe(vacia.ok && vacia.emblemas.lista.length === 0 && vacia.emblemas.faltan === roma.emblemas.length && vacia.emblemas.total === roma.emblemas.length, 'secretos', 'sin nada ganado: 0 emblemas encontrados y faltan todos')
  const json0 = JSON.stringify(vacia)
  for (const e of roma.emblemas) debe(!JSON.stringify(vacia.emblemas).includes(`"${e.id}"`) && !json0.includes(e.nombre) && !json0.includes(e.linea), 'secretos', `sin encontrar, la página no nombra el emblema «${e.id}»`)
  debe(vacia.sellos.every((x) => x.grado === null) && vacia.numeros.avance === 0, 'numeros', 'sin nada ganado: sellos sin grado y avance 0')
  debe(vacia.sellos.length === roma.sellos.length && vacia.colecciones.length === roma.colecciones.length, 'numeros', 'la página trae todos los sellos y todas las colecciones de los datos')
  debe(vacia.colecciones.every((c) => c.total === roma.colecciones.find((d) => d.id === c.id).sitios.length), 'numeros', 'el total de cada colección sale de los datos')

  // Con una parte hecha.
  const items = mapa(
    item('roma', 'pedazo', 'imprescindibles:coliseo', '2026-10-10'),
    item('roma', 'pedazo', 'imprescindibles:panteon', '2026-10-11'),
    item('roma', 'pedazo', 'cuatro_joyas:coliseo', '2026-10-10'),
    item('roma', 'sello', 'roma:bronce', '2026-10-10'),
    item('roma', 'emblema', 'coliseo', '2026-10-10'),
  )
  const viaje = { destino: 'roma', dias: [{ numero: 3, fecha: '2026-10-12', paradas: [{ sitio: 'piazza_navona' }] }] }
  const p = s.paginaDeDestino({ datos, destino: 'roma', items, viaje })
  const impr = p.colecciones.find((c) => c.id === 'imprescindibles')
  debe(impr.n === 2 && impr.total === 8 && !impr.completa, 'numeros', 'imprescindibles: 2 de 8 calculado')
  debe(impr.sitios.find((x) => x.sitio === 'coliseo').fecha === '2026-10-10' && impr.sitios.find((x) => x.sitio === 'foro_romano_y_palatino').fecha === null, 'fechas', 'cada pedazo trae su fecha, y el que falta no')
  debe(p.emblemas.encontrados === 1 && p.emblemas.lista[0].id === 'coliseo' && p.emblemas.lista[0].fecha === '2026-10-10' && p.emblemas.faltan === roma.emblemas.length - 1, 'secretos', 'solo el emblema encontrado sale, con su fecha')
  const json1 = JSON.stringify(p)
  for (const e of roma.emblemas.filter((x) => x.id !== 'coliseo')) debe(!json1.includes(e.nombre) && !JSON.stringify(p.emblemas).includes(`"${e.id}"`), 'secretos', `con otro encontrado, «${e.id}» sigue sin salir`)
  debe(p.principal.id === roma.sello_principal && p.principal.grado === 'bronce', 'numeros', 'el sello principal y su grado salen de lo ganado')
  debe(Math.abs(p.numeros.avance - (p.numeros.colecciones_completas + p.numeros.secretos_encontrados) / (p.numeros.colecciones_total + p.numeros.secretos_total)) < 1e-9, 'numeros', 'la barra es (colecciones completas + secretos) sobre el total')
  debe(p.con_ruta === true && s.paginaDeDestino({ datos, destino: 'roma', items }).con_ruta === false, 'ruta', 'sin viaje abierto no se habla de «tu ruta»')
  const otroDestino = s.paginaDeDestino({ datos, destino: 'roma', items, viaje: { destino: 'paris', dias: [] } })
  debe(otroDestino.con_ruta === false, 'ruta', 'un viaje de otro destino no cuenta')
  debe(s.paginaDeDestino({ datos, destino: 'noexiste', items }) === null, 'datos', 'un destino sin logros devuelve null')

  // El álbum.
  const a = s.coleccionPorDentro({ datos, destino: 'roma', coleccion: 'imprescindibles', items, viaje, nombreDe })
  debe(a.coleccion.n === 2 && a.sitios.length === 8, 'album', 'el álbum cuenta 2 de 8')
  const navona = a.sitios.find((x) => x.sitio === 'piazza_navona')
  debe(navona.en_ruta && navona.dia.numero === 3 && navona.dia.fecha === '2026-10-12' && !navona.visto, 'album', 'lo que falta y está en la ruta trae el día de su ruta')
  const coliseo = a.sitios.find((x) => x.sitio === 'coliseo')
  debe(coliseo.visto && coliseo.fecha === '2026-10-10' && !coliseo.en_ruta && coliseo.dia === null, 'album', 'lo visto trae su fecha y nunca «en ruta»')
  debe(a.sitios.filter((x) => !x.visto && !x.en_ruta).length === 5 && a.sitios.every((x) => x.nombre && x.nombre !== x.sitio), 'album', 'el resto queda sin día y todos traen su nombre en español')
  debe(s.coleccionPorDentro({ datos, destino: 'roma', coleccion: 'imprescindibles', items, nombreDe }).sitios.every((x) => !x.en_ruta), 'album', 'sin viaje abierto, ningún sitio sale «en ruta»')
  debe(s.coleccionPorDentro({ datos, destino: 'roma', coleccion: 'no_existe', items, nombreDe }) === null, 'album', 'una colección que no existe devuelve null')
  const completa = s.coleccionPorDentro({ datos, destino: 'roma', coleccion: 'miradores', items: mapa(item('roma', 'coleccion', 'miradores', '2026-10-12'), ...roma.colecciones.find((c) => c.id === 'miradores').sitios.map((x) => item('roma', 'pedazo', `miradores:${x}`, '2026-10-12'))), nombreDe })
  debe(completa.coleccion.completa && completa.coleccion.fecha === '2026-10-12' && completa.coleccion.al_completar, 'album', 'una colección completa trae su fecha y su frase de completada')

  // Mi colección.
  const viajeroBase = () => ({ ok: true, logros: logrosVisibles(datos, new Date('2027-01-01')).map((d) => ({ id: d.id, grupo: d.grupo, nombre: d.nombre ?? null, linea: d.linea ?? null, como: d.como ?? null, avance: undefined, escalones: (d.escalones ?? []).map((e) => ({ n: e.n, nombre: e.nombre, nuevo: e.nuevo, ganado: false })), nuevo: d.nuevo ?? false })) })
  const viajero = viajeroBase()
  const ganados = mapa(item('*', 'viajero:paises', 1, '2026-10-10'), item('roma', 'viajero:ciudad_completa', '', '2026-10-12'), item('*', 'maravilla', 'coliseo'))
  const m = s.miColeccion({ datos, viajero, items: ganados })
  const todos = m.grupos.flatMap((g) => g.logros)
  const activos = new Set(datos.viajero.logros.map((l) => l.id))
  debe(todos.every((l) => activos.has(l.id)), 'version1', 'solo salen logros encendidos de la versión 1')
  debe(!todos.some((l) => l.id === 'maravillas') && !m.grupos.some((g) => g.id === 'exclusivos'), 'grupos', 'las 7 maravillas y los exclusivos no salen aquí (tienen su sitio aparte)')
  debe(m.grupos.map((g) => g.id).join() === s.GRUPOS_DE_MI_COLECCION.filter(([id]) => m.grupos.some((g) => g.id === id)).map(([id]) => id).join(), 'grupos', 'los grupos salen en el orden del diseño')
  const paises = todos.find((l) => l.id === 'paises')
  debe(paises.ganado && paises.clave === '*|viajero:paises|1' && paises.fecha === '2026-10-10' && paises.nombre === paises.escalones[0].nombre, 'ganados', 'un logro ganado trae su clave (para su ficha), su fecha y el nombre de su escalón')
  const ciudad = todos.find((l) => l.id === 'ciudad_completa')
  debe(ciudad.ganado && ciudad.clave === 'roma|viajero:ciudad_completa|' && ciudad.nombre === 'Roma al completo', 'ganados', 'un logro de una ciudad rellena su nombre con la ciudad')
  debe(todos.filter((l) => l.n_total > 1 && !l.ganado).every((l) => l.nombre === null) && todos.some((l) => l.n_total > 1 && !l.ganado), 'ganados', 'lo que falta no trae nombre (la pantalla pone «Por conseguir»)')
  debe(todos.filter((l) => !l.ganado).every((l) => l.clave === null && l.como), 'ganados', 'lo que falta trae su línea «como» y ninguna clave')
  const sumaEsc = todos.reduce((n, l) => n + l.n_total, 0)
  debe(m.numeros.total === sumaEsc && m.numeros.ganados === todos.reduce((n, l) => n + l.n_ganados, 0) && m.numeros.avance === m.numeros.ganados / m.numeros.total, 'numeros', 'el aro cuenta escalones ganados sobre escalones visibles (calculado)')
  debe(m.numeros.ganados === 2, 'numeros', 'dos logros ganados en el ejemplo → 2')
  const pags = f.paginasDe(m)
  debe(pags.every((x) => x.logros.length <= 9) && pags.reduce((n, x) => n + x.logros.length, 0) === todos.length, 'paginas', 'las páginas llevan 9 huecos como mucho y no pierden ningún logro')

  // El demo (solo desarrollo) tiene el servidor de mentira para las tres rutas.
  const demo = leer(ruta(ficheros.demo))
  for (const r of ['/api/logros/destino', '/api/logros/coleccion', '/api/logros/mi-coleccion']) debe(demo.includes(r) && s && leer(ruta(ficheros.servidor)).includes(r), 'demo', `el demo y el servidor responden a ${r}`)
  // El escaparate trae todas las pantallas del diseño.
  const esc = leer(ruta(ficheros.escaparate))
  for (const id of ['G1', 'G2', 'T3', 'A', 'M1', 'M2']) debe(new RegExp(`id: '${id}'`).test(esc), 'escaparate', `el escaparate tiene ${id}`)
}
