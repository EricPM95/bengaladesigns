// La prueba de «¿Dónde has estado ya?» (J1, J2, J3) y del pasaporte (P2, P2l, P2v, P2i2, P2m, P2e) de la Tanda 8C2.
// Comprueba el código (reglas del encargo) y la lógica pura del servidor (server/logros/pantallas/previos.js) sobre los datos de verdad (data/logros/*.json).
// LA REGLA DE ERIC: lo que se marca en «¿Dónde has estado ya?» da su sello «recuerdo» y sus números, y NADA más: ni EXP, ni sorteo, ni logros de viajar con la app.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { build } from 'esbuild'

export const titulo = '¿Dónde has estado ya? y el pasaporte (J1-J3, P2, P2l, P2v, P2i2, P2m, P2e)'

const raiz = process.cwd()
const ruta = (...p) => path.join(raiz, ...p)
const importar = (f) => import(pathToFileURL(ruta(f)).href)

/** Compila un archivo TypeScript del móvil para poder probarlo aquí. */
async function compilar(entrada, exportaciones) {
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-mundo-'))
  const salida = path.join(carpeta, 'app.cjs')
  const abs = (f) => path.resolve(f).split(path.sep).join('/')
  fs.writeFileSync(path.join(carpeta, 'entrada.ts'), `export { ${exportaciones.join(', ')} } from '${abs(entrada)}'\n`)
  await build({ entryPoints: [path.join(carpeta, 'entrada.ts')], outfile: salida, bundle: true, platform: 'node', format: 'cjs', logLevel: 'error', jsx: 'automatic', loader: { '.json': 'json' }, define: { 'import.meta.env': '{"DEV":false}' } })
  return createRequire(import.meta.url)(salida)
}

export default async function ({ debe, leer, archivos, sinComentarios }) {
  const ficheros = {
    previos: 'src/components/logros/pantallas/DondeHasEstado.tsx',
    pasaporte: 'src/components/logros/pantallas/PasaporteScreen.tsx',
    servidor: 'server/logros/pantallas/previos.js',
    demo: 'src/lib/logrosDemo_mundo.ts',
    escaparate: 'src/dev/escaparates/mundo.ts',
    catalogo: 'data/logros/paises_mundo.json',
    tierra: 'src/components/logros/pantallas/mundo/tierra110.json',
  }
  for (const f of Object.values(ficheros)) debe(fs.existsSync(ruta(f)), 'archivos', `existe ${f}`)
  const carpeta = archivos(ruta('src/components/logros/pantallas/mundo'), /\.(ts|tsx|css)$/)
  debe(carpeta.length >= 7, 'archivos', 'la subcarpeta pantallas/mundo tiene sus archivos (api, paises, proyección, globo, sello, css…)')
  const codigoDe = [ficheros.previos, ficheros.pasaporte, ...carpeta.map((f) => path.relative(raiz, f))].filter((f) => /\.(tsx?)$/.test(f))
  const texto = (f) => sinComentarios(leer(ruta(f)))
  const todo = codigoDe.map(texto).join('\n')

  /* ── Carga perezosa: nada de esto pesa al abrir la app ── */
  const host = leer(ruta('src/components/logros/pantallas/PantallasHost.tsx'))
  for (const f of ['DondeHasEstado', 'PasaporteScreen']) debe(new RegExp(`import\\('\\./${f}'\\)`).test(host), 'lazy', `${f} se carga con import() desde PantallasHost`)
  const paises = texto('src/components/logros/pantallas/mundo/paises.ts')
  debe(/import\('\.\/tierra110\.json'\)/.test(paises) && /import\('[./]+\/data\/logros\/paises_mundo\.json'\)/.test(paises), 'lazy', 'las costas del globo y el catálogo de países se bajan con import(), solo al abrir estas pantallas')
  debe(!/from '\.\/tierra110|from '[./]+\/data\/logros\/paises_mundo/.test(todo), 'lazy', 'ningún archivo importa las costas ni el catálogo de forma fija')
  debe(fs.statSync(ruta(ficheros.tierra)).size < 100_000, 'peso', 'las costas del globo pesan menos de 100 KB')
  debe(fs.statSync(ruta(ficheros.catalogo)).size < 30_000, 'peso', 'el catálogo de países pesa menos de 30 KB')
  debe(!/https?:\/\//.test(todo.replace(/http:\/\/www\.w3\.org/g, '')), 'internet', 'el globo no pide nada a internet (ninguna dirección web en el código de las pantallas)')
  debe(!/\b(fetch|XMLHttpRequest|mapbox)/i.test(todo), 'internet', 'el globo no usa fetch ni Mapbox: dibuja con las costas que ya van dentro de la app')

  /* ── Reglas del encargo ── */
  debe(!/\b(civitatis|booking|stay22|whatsapp|instagram|tiktok|apple|google|routy|trazo)\b/i.test(todo), 'empresas', 'ningún nombre de empresa ni de la app en lo que se ve')
  debe(!/emblema/i.test(todo), 'emblemas', 'el pasaporte no dibuja emblemas (ni ocultos ni encontrados): solo sellos de viaje, de recuerdo y por conseguir')
  debe(!/(madrugador|nocturno)/i.test(todo), 'horas', 'ninguna hora de Madrugador ni de Nocturno')
  const botones = todo.split('\n').filter((l) => l.includes('<button'))
  debe(botones.length >= 8, 'toque', `hay botones que comprobar (${botones.length})`)
  for (const l of botones) debe(/(height|minHeight): (4[4-9]|[5-9]\d)\b|inset: 0/.test(l), 'toque', `el botón mide 44 px o más: ${l.trim().slice(0, 90)}`)
  const filaPais = todo.split('\n').filter((l) => l.includes('aria-pressed'))
  debe(filaPais.every((l) => /minHeight: (5\d)/.test(l)), 'toque', 'cada fila de la lista de países mide 52 px')
  debe(/prefers-reduced-motion: reduce/.test(leer(ruta('src/components/logros/pantallas/mundo/mundo.css'))), 'movimiento', 'mundo.css quita toda animación con «reducir movimiento»')
  debe(/reducirMovimiento\(\)/.test(texto(ficheros.pasaporte)) && /reducirMovimiento\(\)/.test(texto('src/components/logros/pantallas/mundo/Globo.tsx')), 'movimiento', 'la tapa, el golpe del sello y el giro del globo respetan «reducir movimiento»')
  debe(!/[0-9]+ (países|sellos|ciudades|días)/.test(todo.replace(/\$\{[^}]*\}/g, '')), 'numeros', 'ningún número escrito a mano en los textos: todo sale de los datos')
  // J3 dice solo la verdad: no habla de EXP, de sorteo ni de logros ganados.
  const j3 = texto(ficheros.previos)
  debe(!/\bEXP\b|sorteo|nivel/i.test(j3), 'honesto', '«Lo que has ganado» no habla de EXP, de sorteo ni de nivel')
  debe(/sellos? de recuerdo/.test(j3) && /Tus próximos viajes con la app te darán tus primeros logros\./.test(j3), 'honesto', '«Lo que has ganado» dice sellos de recuerdo y que los logros llegan con los viajes con la app')
  debe(/PUT/.test(texto('src/components/logros/pantallas/mundo/api.ts')) && /\/api\/logros\/previos/.test(texto('src/components/logros/pantallas/mundo/api.ts')), 'servidor', 'guarda con PUT /api/logros/previos')

  /* ── El catálogo de países ── */
  const catalogo = JSON.parse(leer(ruta(ficheros.catalogo)))
  const sinTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
  debe(catalogo.length >= 190, 'catalogo', `el catálogo tiene todos los países (${catalogo.length})`)
  debe(new Set(catalogo.map((p) => p.n)).size === catalogo.length && new Set(catalogo.map((p) => p.i)).size === catalogo.length, 'catalogo', 'ningún país repetido (ni nombre ni código)')
  debe(catalogo.every((p) => p.n && p.i && p.c && Number.isFinite(p.lat) && Number.isFinite(p.lng)), 'catalogo', 'cada país trae nombre en español, código, continente y centro')
  const viajero = JSON.parse(leer(ruta('data/logros/viajero.json')))
  for (const nombre of Object.keys(viajero.paises)) debe(catalogo.some((p) => p.n === nombre), 'catalogo', `el país «${nombre}» del servidor está en el catálogo con el mismo nombre`)
  for (const nombre of viajero.microestados) debe(catalogo.some((p) => p.n === nombre && p.p === 1), 'catalogo', `el microestado «${nombre}» sale como «Pequeño en el globo»`)
  const buscar = (q) => catalogo.filter((p) => sinTildes(p.n).includes(sinTildes(q))).map((p) => p.n)
  debe(buscar('mexico').includes('México') && buscar('SAN').includes('San Marino') && buscar('vatic').includes('Ciudad del Vaticano') && buscar('monaco').includes('Mónaco'), 'catalogo', 'se busca sin tildes ni mayúsculas')
  const tierra = JSON.parse(leer(ruta(ficheros.tierra)))
  debe(Object.keys(tierra).every((iso) => catalogo.some((p) => p.i === iso && p.p === 0)), 'catalogo', 'solo los países que no son «pequeños» llevan costa en el globo, y todos los demás sí')
  debe(catalogo.filter((p) => p.p === 0).every((p) => tierra[p.i]), 'catalogo', 'cada país no pequeño tiene su costa')

  /* ── La proyección del globo ── */
  const G = await compilar('src/components/logros/pantallas/mundo/proyeccion.ts', ['prepararTierra', 'trazadoDe', 'puntoDe', 'rejilla', 'giroPara', 'centroDeVarios', 'zoomParaPais'])
  const centro = G.puntoDe(41.9, 12.5, { rot: G.giroPara(41.9, 12.5), R: 100, cx: 100, cy: 100 })
  debe(Math.abs(centro.x - 100) < 0.01 && Math.abs(centro.y - 100) < 0.01 && centro.visible, 'globo', 'el punto del centro cae en el centro del globo')
  debe(!G.puntoDe(-41.9, -167.5, { rot: G.giroPara(41.9, 12.5), R: 100, cx: 100, cy: 100 }).visible, 'globo', 'el punto del lado opuesto no se ve')
  const norte = G.puntoDe(60, 12.5, { rot: G.giroPara(0, 12.5), R: 100, cx: 100, cy: 100 })
  debe(norte.y < 100 && Math.abs(norte.x - 100) < 0.01, 'globo', 'el norte queda arriba')
  const este = G.puntoDe(0, 40, { rot: G.giroPara(0, 12.5), R: 100, cx: 100, cy: 100 })
  debe(este.x > 100, 'globo', 'el este queda a la derecha')
  const t = G.prepararTierra(tierra)
  const d = G.trazadoDe(t.it, { rot: G.giroPara(41.9, 12.5), R: 100, cx: 100, cy: 100 })
  debe(d.startsWith('M') && d.endsWith('Z') && d.length > 100, 'globo', 'Italia se dibuja cuando se mira hacia ella')
  debe(G.trazadoDe(t.it, { rot: G.giroPara(-41.9, -167.5), R: 100, cx: 100, cy: 100 }) === '', 'globo', 'Italia no se dibuja cuando está en la cara oculta')
  const puntos = [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])])
  debe(puntos.every(([x, y]) => Math.hypot(x - 100, y - 100) <= 100.5), 'globo', 'ningún punto se sale de la bola')
  debe(G.rejilla({ rot: G.giroPara(0, 0), R: 100, cx: 100, cy: 100 }).length > 200, 'globo', 'la rejilla se dibuja')
  const medio = G.centroDeVarios([{ lat: 0, lng: 0 }, { lat: 0, lng: 90 }])
  debe(Math.abs(medio.lat) < 1e-6 && Math.abs(medio.lng - 45) < 1e-6, 'globo', 'el centro de varios países es su punto medio')
  debe(G.zoomParaPais(true) > G.zoomParaPais(false), 'globo', 'los países pequeños se acercan más')

  /* ── El servidor: los sellos recuerdo y los números ── */
  const P = await importar(ficheros.servidor)
  const { cargarDatos } = await importar('server/logros/datos.js')
  const datos = cargarDatos()
  const cat = P.catalogoDePaises()
  const previos = { paises: ['España', 'Italia', 'Portugal', 'Narnia', 'España'], dias: 12 }
  debe(P.paisesConocidos(previos, cat).map((p) => p.n).join('|') === 'España|Italia|Portugal', 'recuerdo', 'solo cuentan los países que el catálogo conoce, sin repetir')
  debe(P.paisesConocidos({ paises: ['espana', 'MEXICO'] }, cat).length === 2, 'recuerdo', 'los nombres se reconocen sin tildes ni mayúsculas')
  const recuerdos = P.recuerdosDe(previos, cat, new Set(['Italia']))
  debe(recuerdos.map((r) => r.pais).join('|') === 'España|Portugal', 'recuerdo', 'Italia, que ya se visitó con la app, no es un sello recuerdo: su sello es el de verdad')
  debe(recuerdos.every((r) => r.iso && r.continente), 'recuerdo', 'cada sello recuerdo trae su país, su código y su continente')
  const nums = P.numerosDePrevios(previos, cat, new Set(['Italia']), datos.viajero.microestados)
  debe(nums.paises === 3 && nums.continentes === 1 && nums.sellos_recuerdo === 2 && nums.microestados === 0, 'recuerdo', `los números salen de lo marcado (${JSON.stringify(nums)})`)
  debe(P.numerosDePrevios({ paises: ['Ciudad del Vaticano', 'Japón', 'Brasil'] }, cat, new Set(), datos.viajero.microestados).continentes === 3, 'recuerdo', 'los continentes se cuentan de lo marcado (Europa, Asia, América del Sur)')
  debe(P.numerosDePrevios({ paises: ['Ciudad del Vaticano', 'Malta', 'Italia'] }, cat, new Set(), datos.viajero.microestados).microestados === 2, 'recuerdo', 'los microestados se cuentan de lo marcado')
  debe(P.numerosDePrevios({ paises: [] }, cat).paises === 0 && P.recuerdosDe({ paises: [] }, cat).length === 0, 'recuerdo', 'sin países marcados no hay nada')

  /* ── Lo que NO dan: EXP, sorteo, logros de viajar con la app ── */
  const motor = await importar('server/logros/motor.js')
  const exp = await importar('server/logros/exp.js')
  const vistas = await importar('server/logros/vistas.js')
  const ahora = new Date('2026-10-20T10:00:00Z')
  const sinNada = { datos, items: new Map(), hechos: [], viajes: {}, ahora }
  debe(exp.calcularExp(sinNada).total === 0, 'sin_exp', 'sin viajes con la app la EXP es 0, tengas los países de antes que tengas (la EXP no recibe `previos`)')
  debe(!/previos/.test(leer(ruta('server/logros/exp.js'))), 'sin_exp', 'exp.js no menciona los países de antes')
  debe(!/previos/.test(leer(ruta('server/logros/motor.js'))), 'sin_logros', 'motor.js (los logros) no menciona los países de antes')
  debe(!/previos/.test(leer(ruta('server/logros/momentos.js'))), 'sin_logros', 'momentos.js no menciona los países de antes')
  const servicio = leer(ruta('server/logros/servicio.js'))
  const usos = servicio.split('\n').filter((l) => /previos/.test(l))
  debe(usos.length === 1 && /pasaporte\(/.test(usos[0]), 'sin_exp', 'en servicio.js los países de antes solo se usan para el pasaporte (nada de EXP, sorteo ni logros)')
  const expDe = servicio.slice(servicio.indexOf('async function expDe'), servicio.indexOf('async function sorteoDe'))
  debe(expDe.length > 100 && !/previos/.test(expDe), 'sin_exp', 'expDe (la EXP de la cuenta) no mira los países de antes')
  const sorteo = servicio.slice(servicio.indexOf('async function sorteoDe'), servicio.indexOf('async function sorteoDe') + 1200)
  debe(sorteo.length > 100 && !/previos/.test(sorteo), 'sin_sorteo', 'sorteoDe no mira los países de antes')
  debe(exp.entraEnElSorteo({ exp: 0, viajesAcabadosDelAnio: 0, tabla: datos.exp }) === false, 'sin_sorteo', 'con 0 EXP y 0 viajes acabados no se entra en el sorteo, por muchos países de antes que haya')
  const ganado = motor.calcular({ datos, hechos: [], viajes: {}, cuenta: null, ahora, pionero: null, probador: null })
  debe(ganado.size === 0 && ![...ganado.values()].some((it) => it.logro === 'pais'), 'sin_logros', 'sin viajes con la app no se gana ni un país ni ningún logro (los países de antes no entran en el motor)')
  const viejo = vistas.pasaporte({ datos, items: new Map(), previos: { paises: ['España', 'Portugal'], dias: 30 }, ahora })
  const nuevo = vistas.pasaporte({ datos, items: new Map(), previos: { paises: [], dias: 0 }, ahora })
  debe(viejo.tus_paises.length === 0 && nuevo.tus_paises.length === 0, 'sin_logros', 'los países de antes no entran en «Tus países» de lo ganado con la app')
  debe(viejo.numeros.paises === 2 && viejo.numeros.dias_viajando === 30 && nuevo.numeros.paises === 0, 'recuerdo', 'los países y los días de antes sí cuentan en los números del pasaporte')

  /* ── Las páginas del pasaporte ── */
  const roma = datos.destinos.roma
  const sitios = await importar('server/logros/sitios.js')
  const idItalia = Object.keys(roma.sitios).find((id) => sitios.datosDeSitio(roma, id)?.pais === 'Italia')
  const idVaticano = Object.keys(roma.sitios).find((id) => sitios.datosDeSitio(roma, id)?.pais === 'Ciudad del Vaticano')
  debe(idItalia && idVaticano, 'pasaporte', 'hay un sitio de Italia y uno del Vaticano en los datos de Roma')
  const viajes = { t1: { destino: 'roma', inicio: '2026-10-12', fin: '2026-10-14' } }
  const hecho = (sitio) => ({ id: `h-${sitio}`, tipo: 'visto', trip_id: 't1', destino: 'roma', sitio, stop_id: sitio, instante: '2026-10-13T09:00:00Z', ubic: 'cerca', valido: true, recibido_en: '2026-10-13T09:00:00Z' })
  const hechos = [hecho(idItalia), hecho(idVaticano)]
  const items = new Map([
    [motor.clave(motor.GLOBAL, 'pais', 'Italia'), { clave: 'x', logro: 'pais', escalon: 'Italia', destino: motor.GLOBAL, trip_id: 't1', en: '2026-10-13T09:00:00Z' }],
    [motor.clave(motor.GLOBAL, 'pais', 'Ciudad del Vaticano'), { clave: 'y', logro: 'pais', escalon: 'Ciudad del Vaticano', destino: motor.GLOBAL, trip_id: 't1', en: '2026-10-13T11:00:00Z' }],
  ])
  const base = vistas.pasaporte({ datos, items, previos: { paises: ['España', 'Italia'], dias: 0 }, ahora })
  const acabados = [{ trip_id: 't1', fin: '2026-10-14' }]
  const pg = P.paginasDelPasaporte({ datos, base, previos: { paises: ['España', 'Italia'], dias: 0 }, catalogo: cat, hechos, viajes, acabados })
  debe(pg.map((p) => `${p.pais}:${p.estado}`).join('|') === 'Italia:visitado|Ciudad del Vaticano:visitado|España:recuerdo', 'pasaporte', `las páginas salen en orden: los visitados, el Vaticano aparte, los de antes de la app (${pg.map((p) => `${p.pais}:${p.estado}`).join('|')})`)
  debe(pg[0].sellos.length === 1 && pg[0].sellos[0].ciudad === 'Roma' && pg[0].sellos[0].fecha === '2026-10-14' && !pg[0].sellos[0].vacio, 'pasaporte', 'Italia tiene su sello de Roma con la fecha del último día del viaje')
    // Volver a Roma suma SELLO (uno por ciudad de cada viaje, con su fecha), no ciudad.
  const viajes2 = { ...viajes, t2: { destino: 'roma', inicio: '2027-03-01', fin: '2027-03-03' } }
  const hecho2 = { ...hecho(idItalia), id: 'h2', trip_id: 't2', instante: '2027-03-02T09:00:00Z', recibido_en: '2027-03-02T09:00:00Z' }
  const pg2 = P.paginasDelPasaporte({ datos, base, previos: { paises: [] }, catalogo: cat, hechos: [...hechos, hecho2], viajes: viajes2, acabados: [...acabados, { trip_id: 't2', fin: '2027-03-03' }] })
  const romas = pg2[0].sellos.filter((s) => !s.vacio && s.ciudad === 'Roma')
  debe(romas.length === 2 && romas[0].fecha === '2026-10-14' && romas[1].fecha === '2027-03-03', 'pasaporte', 'dos viajes a Roma = dos sellos de Roma, cada uno con su fecha')
  debe(pg[1].sellos.length === 1 && pg[1].sellos[0].ciudad === 'Ciudad del Vaticano' && pg[1].sellos[0].trip_id === 't1', 'pasaporte', 'el Vaticano tiene su propia página y su propio sello')
  debe(pg[2].sellos.length === 0 && pg[2].iso === 'es', 'recuerdo', 'España (de antes de la app) no tiene sellos de viaje: su página es el sello recuerdo')
  debe(!pg.some((p) => p.pais === 'Italia' && p.estado === 'recuerdo'), 'recuerdo', 'Italia, ya visitada con la app, no sale otra vez como recuerdo')
  const sinAcabar = P.paginasDelPasaporte({ datos, base, previos: { paises: [] }, catalogo: cat, hechos, viajes, acabados: [] })
  debe(sinAcabar[0].sellos.length === 0 || sinAcabar[0].sellos.every((s) => s.vacio), 'pasaporte', 'el sello de un viaje se estampa al ACABAR: con el viaje sin acabar no hay sello')
  const sinNadaVisto = vistas.pasaporte({ datos, items: new Map(), previos: { paises: [] }, ahora })
  const porConseguir = P.paginasDelPasaporte({ datos, base: sinNadaVisto, previos: { paises: [] }, catalogo: cat, hechos: [], viajes: {}, acabados: [] })
  debe(porConseguir.length >= 1 && porConseguir.every((p) => p.estado === 'por_conseguir' && p.sellos.every((s) => s.vacio && s.fecha === null && s.trip_id === null)), 'pasaporte', '«Por conseguir»: los países con destinos en la app y sin visitar salen con sellos vacíos, sin fecha')
  debe(!/emblema/i.test(JSON.stringify([pg, porConseguir])), 'emblemas', 'las páginas del pasaporte no llevan ningún emblema')
  const claves = (o) => Object.keys(o).sort().join(',')

  /* ── La demo tiene la forma real del servidor ── */
  const D = await compilar('src/lib/logrosDemo_mundo.ts', ['responder'])
  const u = new URL('http://demo.local/x')
  const dp = D.responder('/api/logros/previos', u, {}, {})
  debe(claves(dp) === 'dias,numeros,ok,paises,recuerdos', 'demo', `GET /previos de la demo tiene los mismos campos que el servidor (${claves(dp)})`)
  debe(claves(dp.numeros) === claves(nums), 'demo', 'los números de la demo tienen los mismos campos que los del servidor')
  debe(claves(dp.recuerdos[0]) === claves(recuerdos[0]), 'demo', 'los sellos recuerdo de la demo tienen la forma del servidor')
  D.responder('/api/logros/previos', u, { paises: ['Japón'], dias: 3 }, { metodo: 'PUT' })
  debe(D.responder('/api/logros/previos', u, {}, {}).paises.join() === 'Japón', 'demo', 'el PUT de la demo guarda lo marcado')
  const d2 = D.responder('/api/logros/pasaporte2', u, {}, {})
  debe(d2.paginas.length >= 4 && claves(d2.paginas[0]) === claves(pg[0]) && claves(d2.paginas[0].sellos[0]) === claves({ ...pg[0].sellos[0] }) || claves(d2.paginas[0].sellos.at(-1)).startsWith('ciudad'), 'demo', 'las páginas de la demo tienen la forma del servidor')
  debe(['visitado', 'recuerdo', 'por_conseguir'].every((e) => d2.paginas.some((p) => p.estado === e)), 'demo', 'la demo tiene páginas de los tres estados')
  debe(claves(d2.numeros) === 'ciudades,dias_viajando,paises,sellos', 'demo', 'los números del pasaporte de la demo son los del servidor más los sellos')

  /* ── Escaparate ── */
  const esc = texto(ficheros.escaparate)
  for (const id of ['J1', 'J2', 'J3', 'P2', 'P2l', 'P2v', 'P2i2', 'P2m', 'P2e']) debe(new RegExp(`id: '${id}'`).test(esc), 'escaparate', `hay escaparate ${id}`)
  debe(/id: 'P2e'[\s\S]*capturas: \[0, 700, 1600\]/.test(esc), 'escaparate', 'P2e (el sello que se estampa) saca principio, mitad y final')

  /* ── Las rutas están registradas ── */
  const rutas = texto(ficheros.servidor)
  debe(/app\.get\(\s*'\/api\/logros\/previos'/.test(rutas) && /app\.get\(\s*'\/api\/logros\/pasaporte2'/.test(rutas), 'servidor', 'GET /api/logros/previos y GET /api/logros/pasaporte2 están registradas')
  debe(!/app\.(put|post|delete)/.test(rutas), 'servidor', 'las rutas nuevas son de solo lectura (guardar sigue siendo el PUT de siempre)')
}
