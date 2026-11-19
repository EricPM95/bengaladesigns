// La prueba de la Tanda V5: reclamar con tus fotos, la cámara de viaje en todas las pantallas y los dos botones flotantes.
//   APP_URL=http://localhost:5199 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV5.mjs
//
// 1. El servidor de verdad (servicio de logros sobre un repo en memoria, datos reales de Roma y de Lanzarote): 10 fotos de golpe con ubicación en la ruta, fuera de la ruta, en dos sitios a la vez,
//    sin ubicación, de otra fecha y una captura de pantalla; el plazo de 30 días; el mismo día; sin pase y con pase; los emblemas que dependen de la hora (madrugador, atardecer).
// 2. El código: textos del plazo y de «Lo de ayer», la hoja «Tu cámara de viaje», sin pase una foto por parada y sin logros, los dos flotantes del mismo tamaño.
// 3. En pantalla (Chrome, demo): el botón en la hoja de logros, 10 fotos reales (JPEG con datos de iPhone) elegidas a la vez, la pregunta de las sin ubicación, el resumen y la lista de las que no valen;
//    la cámara en las 5 pestañas, en el mismo sitio; el botón de logros con color sin logros.
import fs from 'node:fs'
import path from 'node:path'
import { cargarDatos, cargarCatalogo, coordenadasDeSitio } from '../../server/logros/datos.js'
import { crearServicioLogros } from '../../server/logros/servicio.js'
import { sunsetMinutesOn } from '../../shared/routeEngine/sunset.js'
import { crearJpegConExif } from './_jpegConExif.mjs'

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

const datos = cargarDatos()
const catalogos = { roma: cargarCatalogo('roma'), lanzarote: cargarCatalogo('lanzarote') }
const punto = (destino, id) => coordenadasDeSitio(catalogos, destino, id)
const alNorte = (destino, id, m = 0) => { const c = punto(destino, id); return { lat: c.lat + m / 111000, lng: c.lng } }

/* ───────── 1. El servidor ───────── */
console.log('1. El servidor: reclamar con las fotos de la galería')
function repoEnMemoria({ pases = [] } = {}) {
  const hechos = []
  const logros = []
  const viajes = []
  let n = 0
  return {
    hechos, logros, viajes,
    hechosDe: async (u) => hechos.filter((h) => h.user_id === u && !h.deshecho_en),
    insertarHecho: async (f) => { const h = { ...f, id: `h${++n}`, deshecho_en: null }; hechos.push(h); return h },
    deshacerHecho: async () => {},
    viajesDe: async (u) => viajes.filter((v) => v.traveler_id === u),
    logrosDe: async (u) => logros.filter((l) => l.user_id === u),
    insertarLogros: async (u, filas) => {
      const dentro = []
      for (const f of filas) {
        if (logros.some((l) => l.user_id === u && l.destino === f.destino && l.logro === f.logro && String(l.escalon) === String(f.escalon))) continue
        const l = { user_id: u, ...f, escalon: String(f.escalon), animacion_vista: false }
        logros.push(l); dentro.push(l)
      }
      return dentro
    },
    borrarLogros: async () => {},
    cuentaDe: async () => ({ alta_cuenta: '2026-10-01T10:00:00.000Z', salida: null }),
    ordenPionero: async () => ({}),
    probadorDe: async () => null,
    ultimaFrase: async () => null,
    sinPaseDe: async () => false,
    pasesDe: async () => pases,
    pruebaDe: async () => null,
    guardarPrueba: async () => {},
    perfilDe: async () => ({ previos: { paises: [], dias: 0 }, vitrina: { baldas: {}, titulo: null }, exp_max: 0 }),
    guardarPerfil: async () => {},
    referidosDe: async () => [],
    invitadorDe: async () => null,
    marcarAnimacion: async () => {},
  }
}
// El viaje: del 9 al 13 de noviembre de 2026 (el plazo acaba el 13 de diciembre). «Hoy»: el 12 de noviembre.
let reloj = new Date('2026-11-12T20:00:00Z')
const PARADAS = { Roma: ['Coliseo', 'Panteón'], Lanzarote: ['Teguise (villa)'] }
function mundo(destino, opciones = {}) {
  const repo = repoEnMemoria(opciones)
  const servicio = crearServicioLogros({ repo, datos, catalogos, ahora: () => reloj, cobro: Boolean(opciones.cobro), azar: () => 0 })
  let u = 0
  const persona = () => {
    const id = `u${++u}`
    repo.viajes.push({ id: `v${u}`, traveler_id: id, route: { destination: destino, answers: { dateRange: { start: '2026-11-09', end: '2026-11-13' }, companion: 'couple' }, days: [{ dayNumber: 1, stops: PARADAS[destino].map((name, i) => ({ id: `v${u}-s${i}`, name })) }] } })
    return { id, trip: `v${u}` }
  }
  const pedazos = (p) => repo.logros.filter((l) => l.user_id === p.id && l.logro === 'pedazo').map((l) => l.escalon).sort()
  const emblemas = (p) => repo.logros.filter((l) => l.user_id === p.id && l.logro === 'emblema').map((l) => l.escalon).sort()
  const foto = (p, cuerpo) => servicio.foto(p.id, { trip_id: p.trip, libre: true, origen: 'galeria', con_camara: true, ...cuerpo })
  return { repo, servicio, persona, pedazos, emblemas, foto }
}
{
  const m = mundo('roma'.replace('roma', 'Roma'))
  const p = m.persona()
  const T = '2026-11-10T10:00:00'
  // Las 10 de golpe (como las mandaría la app una a una).
  const r1 = await m.foto(p, { tomada_en: T, ubicacion: alNorte('roma', 'coliseo', 20) })
  debe(r1.valida && r1.cuenta && r1.sitios.some((s) => s.sitio === 'coliseo'), '10fotos', '1. con ubicación en la ruta (Coliseo): cuenta para el Coliseo')
  const r2 = await m.foto(p, { tomada_en: T, ubicacion: alNorte('roma', 'fontana_de_trevi', 10) })
  debe(r2.valida && r2.cuenta && r2.sitios.some((s) => s.sitio === 'fontana_de_trevi'), '10fotos', '2. con ubicación FUERA de la ruta (la Fontana de Trevi no está en el viaje): cuenta')
  const r4 = await m.foto(p, { tomada_en: T, ubicacion: null })
  debe(r4.valida && r4.cuenta === false && r4.motivo === 'sin_ubicacion', '10fotos', '4. sin ubicación: es válida y se pregunta de qué sitio es (no cuenta todavía)')
  const r4b = await m.servicio.foto(p.id, { trip_id: p.trip, sitio: 'panteon', origen: 'galeria', tomada_en: T, con_camara: true, ubicacion: null })
  debe(r4b.valida && r4b.cuenta && m.pedazos(p).some((x) => x.endsWith(':panteon')), '10fotos', '4b. elegido el sitio (el Panteón), la foto sin ubicación cuenta para él')
  const r5 = await m.foto(p, { tomada_en: '2026-11-20T10:00:00', ubicacion: alNorte('roma', 'coliseo', 5) })
  debe(r5.valida === false && r5.motivo === 'otra_fecha' && /noviembre/.test(r5.mensaje ?? ''), '10fotos', `5. de otra fecha: no vale y dice por qué («${r5.mensaje}»)`)
  const r6 = await m.foto(p, { tomada_en: T, con_camara: false, ubicacion: alNorte('roma', 'coliseo', 5) })
  debe(r6.valida === false && r6.motivo === 'no_camara', '10fotos', '6. una captura de pantalla (sin marca ni modelo de cámara): no vale')
  const r7 = await m.foto(p, { tomada_en: T, ubicacion: { lat: 40.0, lng: 10.0 } })
  debe(r7.valida && r7.cuenta === false && r7.motivo === 'sin_logro_aqui', '10fotos', '7. fuera del radio de todos los sitios: válida (recuerdo) pero no gana nada')
  const antes = m.pedazos(p).length
  const r8 = await m.foto(p, { tomada_en: '2026-11-11T11:00:00', ubicacion: alNorte('roma', 'coliseo', 30) })
  debe(r8.valida && r8.cuenta && (r8.nuevos ?? []).length === 0 && m.pedazos(p).length === antes, '10fotos', '8. otra foto del mismo sitio: no vuelve a dar lo mismo (cuenta una vez)')
  // La lista: el servidor dice cuántos pedazos hay y de qué sitios.
  debe(m.pedazos(p).some((x) => x.endsWith(':coliseo')) && m.pedazos(p).some((x) => x.endsWith(':fontana_de_trevi')) && m.pedazos(p).some((x) => x.endsWith(':panteon')), '10fotos', 'lo ganado de las 10: Coliseo, Fontana de Trevi y Panteón')
  // Los sitios del viaje para «¿De qué sitio es esta foto?».
  const lista = await m.servicio.sitiosParaReclamar(p.id, p.trip)
  debe(lista.ok && lista.sitios.length >= 8 && lista.sitios.every((s) => s.nombre && Array.isArray(s.dias)), 'sitios', `el servidor da los sitios del destino con su nombre y sus días (${lista.sitios?.length})`)
  const coli = lista.sitios.find((s) => s.sitio === 'coliseo')
  debe(coli && coli.dias.includes('2026-11-09') && !coli.pendiente === false || coli?.dias.length === 1, 'sitios', 'el Coliseo sale con el día de la ruta en que está')
  debe(lista.sitios.find((s) => s.sitio === 'fontana_de_trevi').dias.length === 0, 'sitios', 'la Fontana de Trevi sale sin día de ruta (fuera de la ruta)')
  const sinViaje = await m.servicio.sitiosParaReclamar(p.id, 'no-existe')
  debe(sinViaje.ok === false, 'sitios', 'un viaje desconocido no da sitios')
}
{
  // En dos sitios a la vez (Lanzarote: el pueblo de Haría y la Casa-Museo se solapan).
  const m = mundo('Lanzarote')
  const p = m.persona()
  const r = await m.foto(p, { tomada_en: '2026-11-10T11:00:00', ubicacion: alNorte('lanzarote', 'casa_museo_cesar_manrique', 0) })
  debe(r.valida && r.cuenta && r.sitios.length >= 2 && r.sitios.some((s) => s.sitio === 'casa_museo_cesar_manrique') && r.sitios.some((s) => s.sitio === 'haria_pueblo'), '10fotos', `3. en dos sitios a la vez (Haría y la Casa-Museo): cuenta para los dos (${r.sitios?.map((s) => s.sitio)})`)
  debe(m.pedazos(p).includes('cesar_manrique:casa_museo_cesar_manrique') && m.pedazos(p).includes('pueblos_con_alma:haria_pueblo'), '10fotos', 'y los dos pedazos están ganados')
  // La bodega no da La Geria (V4) también por la galería.
  const q = m.persona()
  const rb = await m.foto(q, { tomada_en: '2026-11-10T11:00:00', ubicacion: alNorte('lanzarote', 'bodega_la_geria', 0) })
  debe(rb.cuenta && rb.sitios.length === 1 && rb.sitios[0].sitio === 'bodega_la_geria', '10fotos', 'una foto de la galería en una bodega da solo la bodega')
  // Los emblemas que dependen de la hora: la hora es la de la TOMA (la de la foto), no la de cuando se sube.
  const mad = mundo('Lanzarote')
  const pm = mad.persona()
  const rm = await mad.foto(pm, { tomada_en: '2026-11-10T07:30:00', ubicacion: alNorte('lanzarote', 'montanas_del_fuego', 50) })
  debe(rm.cuenta && mad.emblemas(pm).includes('lz_madrugador'), 'horas', 'una foto de la galería hecha a las 07:30 da «Madrugador» de Lanzarote (cuenta la hora de la toma, aunque se suba de noche)')
  const sol = Math.round(sunsetMinutesOn('2026-11-10', datos.destinos.lanzarote.momentos.atardecer_atlantico.punto, 'Atlantic/Canary')) - 20
  const hhmm = `${String(Math.floor(sol / 60)).padStart(2, '0')}:${String(sol % 60).padStart(2, '0')}:00`
  const pa = mad.persona()
  const ra = await mad.foto(pa, { tomada_en: `2026-11-10T${hhmm}`, ubicacion: alNorte('lanzarote', 'caleta_de_famara_y_playa_de_famara', 0) })
  debe(ra.cuenta && mad.emblemas(pa).includes('atardecer_atlantico'), 'horas', 'una foto de la galería a la puesta de sol en la Playa de Famara da el «Atardecer atlántico»')
  const pn = mad.persona()
  await mad.foto(pn, { tomada_en: '2026-11-10T12:00:00', ubicacion: alNorte('lanzarote', 'caleta_de_famara_y_playa_de_famara', 0) })
  debe(!mad.emblemas(pn).includes('atardecer_atlantico') && !mad.emblemas(pn).includes('lz_madrugador'), 'horas', 'a mediodía no da ni Madrugador ni el Atardecer')
  const rom = mundo('Roma')
  const pr = rom.persona()
  await rom.foto(pr, { tomada_en: '2026-11-10T07:20:00', ubicacion: alNorte('roma', 'coliseo', 10) })
  debe(rom.emblemas(pr).includes('madrugador') && rom.emblemas(pr).includes('coliseo'), 'horas', `en Roma, una foto de la galería a las 07:20 en el Coliseo da «Madrugador» (cuenta la hora de la toma) y el emblema del Coliseo (la foto es de allí): ${rom.emblemas(pr)}`)
}
{
  // El plazo de 30 días: la foto se puede subir hasta 30 días después del último día (13 de noviembre → 13 de diciembre).
  const m = mundo('Roma')
  const p = m.persona()
  const f = { tomada_en: '2026-11-10T10:00:00', ubicacion: alNorte('roma', 'coliseo', 5) }
  reloj = new Date('2026-12-13T09:00:00Z')
  const dentro = await m.foto(p, { ...f, recibido_en: reloj.toISOString() })
  debe(dentro.valida && dentro.cuenta, 'plazo', 'el último día del plazo (13 de diciembre) todavía cuenta')
  reloj = new Date('2026-12-14T09:00:00Z')
  const q = m.persona()
  const fuera = await m.foto(q, { ...f, recibido_en: reloj.toISOString() })
  debe(fuera.valida === false && fuera.motivo === 'fuera_de_plazo', 'plazo', 'al día siguiente ya no (fuera de plazo)')
  // El mismo día: la foto de hoy, subida hoy.
  reloj = new Date('2026-11-11T20:00:00Z')
  const z = m.persona()
  const hoy = await m.foto(z, { tomada_en: '2026-11-11T09:30:00', ubicacion: alNorte('roma', 'panteon', 5), recibido_en: reloj.toISOString() })
  debe(hoy.valida && hoy.cuenta, 'mismo_dia', 'el mismo día: una foto de esta mañana subida esta noche cuenta')
  reloj = new Date('2026-11-12T20:00:00Z')
}
{
  // Sin pase no se gana nada (la foto es válida); con pase, sí.
  const sin = mundo('Roma', { cobro: true })
  const ps = sin.persona()
  const r = await sin.foto(ps, { tomada_en: '2026-11-10T10:00:00', ubicacion: alNorte('roma', 'coliseo', 5) })
  debe(r.valida && r.cuenta === false && ['sin_pase', 'prueba_ya_usada', 'sin_pase_prueba'].includes(r.motivo) && sin.pedazos(ps).length === 0 && sin.repo.hechos.length === 0, 'pase', `sin pase, la foto no gana nada ni deja ningún hecho (motivo ${r.motivo})`)
  const con = mundo('Roma', { cobro: true, pases: [{ id: 'p1', destino: 'Roma', tipo: 'uno' }] })
  const pc = con.persona()
  const rc = await con.foto(pc, { tomada_en: '2026-11-10T10:00:00', ubicacion: alNorte('roma', 'coliseo', 5) })
  debe(rc.valida && rc.cuenta && con.pedazos(pc).length >= 1, 'pase', 'con pase, la misma foto gana su pedazo')
  // Una foto hecha sin pase NO da logros luego si compra el pase: no se guardó ningún hecho; solo cuenta lo que se reclame después con el pase.
  debe(sin.repo.hechos.length === 0, 'pase', 'las fotos de antes de comprar el pase no dejan hecho: no cuentan si luego se compra (el pase cuenta desde que se compra); lo que se reclama con la galería ya con el pase, sí')
}

/* ───────── 2. El código ───────── */
console.log('2. El código')
{
  const rec = leer('src/lib/reclamar.ts')
  const cam = leer('src/lib/camaraViaje.ts')
  const hoja = leer('src/components/route/hoy/CamaraViaje.tsx')
  // El plazo y los textos de «Lo de ayer» (se leen las funciones puras del propio archivo).
  const plazo = (fin) => { const d = new Date(Date.UTC(Number(fin.slice(0, 4)), Number(fin.slice(5, 7)) - 1, Number(fin.slice(8, 10))) + 30 * 86400000); const M = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']; return `Puedes reclamar hasta el ${d.getUTCDate()} de ${M[d.getUTCMonth()]}` }
  debe(plazo('2026-11-13') === 'Puedes reclamar hasta el 13 de diciembre', 'plazo', 'el viaje del 9 al 13 de noviembre: «Puedes reclamar hasta el 13 de diciembre»')
  debe(/Puedes reclamar hasta el \$\{fechaLarga\(u\)\}/.test(rec) && /PLAZO_DIAS = 30/.test(rec), 'plazo', 'reclamar.ts calcula el plazo de la misma forma (30 días)')
  debe(/Ayer tenías en tu ruta: \$\{cuerpo\}/.test(rec) && /En tu viaje tenías: \$\{cuerpo\}/.test(rec), 'lo_de_ayer', '«Lo de ayer»: «Ayer tenías en tu ruta…» durante el viaje y «En tu viaje tenías…» después')
  debe(/hayBotonDeReclamar[\s\S]{0,200}\['durante', 'despues'\]/.test(rec), 'boton', 'el botón se ve durante el viaje y hasta que acaba el plazo (no antes ni después del plazo)')
  const ho = leer('src/components/logros/visto/Hojas.tsx')
  debe(/data-visto="lo-de-ayer-reclamar"/.test(ho) && /Reclamar con tus fotos/.test(ho), 'lo_de_ayer', '«Lo de ayer» lleva su botón [Reclamar con tus fotos]')
  debe(/¿Ya has estado hoy \$\{enSitio\(nombre\)\}\?/.test(ho) && /Sube una foto que hiciste allí y gana tu pedazo\./.test(ho) && /Elegir de la galería/.test(ho), 'mismo_dia', 'la hoja «no estás aquí»: «¿Ya has estado hoy en…? Sube una foto que hiciste allí y gana tu pedazo.» y [Elegir de la galería]')
  debe(/enviarFotoDeGaleria[\s\S]{0,200}libre: true/.test(rec) && /abrirGaleriaDeReclamo/.test(leer('src/components/logros/visto/VistoFlujo.tsx')), 'galeria', 'el reclamo manda cada foto como «libre» (el servidor busca el sitio) y «Lo de ayer» lleva aquí')
  debe(/multiple/.test(leer('src/components/logros/reclamar/Reclamar.tsx')), 'galeria', 'la galería se abre con varias fotos a la vez (input multiple)')
  debe(/Comprobando \{Math\.min\(hechas \+ 1, total\)\} de \{total\}/.test(leer('src/components/logros/reclamar/Reclamar.tsx')), 'subida', '«Comprobando 12 de 30…» mientras sube')
  debe(/mandarHecho/.test(leer('src/lib/logros.ts')) && /guardarCola\(\[\.\.\.leerCola\(\), hecho\]\)/.test(leer('src/lib/logros.ts')) && /enEspera/.test(rec), 'red', 'si se corta la red, la foto queda en la cola del móvil y se comprueba sola al volver la señal (y el resumen lo dice)')
  debe(/alAlbum\(foto\.archivo, foto\.fecha\)/.test(rec) && /diaDeLaFecha/.test(rec), 'recuerdos', 'las fotos que valen van también a los recuerdos de su día')
  debe(!/TOPE_DE_ANIMACIONES/.test(rec) && /Ver lo que has ganado/.test(leer('src/components/logros/reclamar/Reclamar.tsx')) && /logros\.recibir\(r\)/.test(rec), 'animaciones', '(V6) las sorpresas van a la fila de momentos, agrupadas, sin tope; el botón es [Ver lo que has ganado]')
  // La cámara en todas las pantallas y la hoja nueva.
  debe(/CamaraDeViajeGlobal/.test(leer('src/components/route/RouteScreen.tsx')) && !/BotonCamaraViaje/.test(leer('src/components/route/hoy/HoyView.tsx').replace(/\/\/.*$/gm, '')), 'camara', 'la cámara la monta RouteScreen (todas las pantallas del viaje), no solo HOY')
  debe(/Tu cámara de viaje/.test(hoja) && /Las fotos que hagas con ella se guardan en el álbum de tu viaje, día a día, para que tengas todos tus recuerdos juntos\./.test(hoja) && /Una foto por cada lugar\./.test(hoja), 'camara', 'la hoja: título, texto para todos y «Una foto por cada lugar.» sin pase')
  debe(/Con tu <b[^>]*>\{pase\}<\/b>, fotos sin límite\. Y además, podrás coleccionar recompensas: pedazos de colección y emblemas ocultos\./.test(hoja) && /Con el <b[^>]*>\{pase\}<\/b>, fotos sin límite\./.test(hoja), 'camara', 'el segundo párrafo: «Con tu Pase…» con pase, «Con el Pase…» (con candado y enlace al pase) sin pase')
  debe(/Sin el Pase, una foto por lugar\. ¿Cambias la que tenías\?/.test(hoja), 'camara', 'sin pase, la segunda foto del lugar pregunta «¿Cambias la que tenías?»')
  debe(/Podrás usarla durante tu viaje, \$\{rango\}/.test(hoja), 'camara', 'antes del viaje, debajo: «Podrás usarla durante tu viaje, del 8 al 13 de noviembre»')
  debe(!/candado-boton/.test(hoja) && !/modo === 'sin_pase'/.test(hoja), 'camara', 'el botón de la cámara ya no lleva candado')
  debe(/if \(!conAcceso\) \{[\s\S]{0,1400}guardarFotoSinSubir[\s\S]{0,400}return\s*\}/.test(hoja), 'sin_pase', 'sin pase: la foto va al álbum (una por parada) y se acaba ahí')
  const sinPaseBloque = hoja.slice(hoja.indexOf('if (!conAcceso) {'), hoja.indexOf('const r = await enviarFotoDeLaCamara'))
  debe(sinPaseBloque.length > 100 && !/enviarFotoDeLaCamara/.test(sinPaseBloque), 'sin_pase', 'sin pase, la foto NO se manda al servidor de los logros (nunca da pedazos ni emblemas)')
  debe(/modoDeFoto\(fotos, dayNumber, nombreParada\) === 'cambiar'/.test(hoja) && /limiteDeFotos/.test(leer('src/lib/fotosViaje.ts')) && /porParada: pagoActivo\(\) \? null : 1/.test(leer('src/lib/fotosViaje.ts')), 'sin_pase', 'la regla de una foto por parada es la que ya existía (`limiteDeFotos`), con pase sin límite')
  debe(/data-camara-viaje="hacer-foto"/.test(hoja) && /data-camara-viaje="subir-galeria"/.test(hoja) && /abrirGaleriaDeReclamo()/.test(hoja) && /Subir de la galería/.test(hoja), 'camara', 'la cámara flotante ofrece [Hacer foto] y [Subir de la galería] (con pase, durante el viaje); la galería usa lo del reclamo')
  const logrosBtn = leer('src/components/logros/momentos/BotonFlotanteLogros.tsx')
  const flot = leer('src/components/flotantes/flotantes.ts')
  debe(/ESTILO_FLOTANTE/.test(logrosBtn) && /ESTILO_FLOTANTE/.test(hoja) && /LADO_DE_LOS_FLOTANTES = 44/.test(flot) && flot.includes("width: 44,"), 'flotantes', '(V18) la cámara y el botón de los logros miden lo mismo (44 px) y van uno encima del otro');
  debe(/data-boton-logros-trofeo/.test(logrosBtn) && /#7A5A1E/.test(logrosBtn) && flot.includes("radial-gradient(circle at 32% 26%"), 'flotantes', '(V18) el botón de logros lleva el trofeo sobre fondo crema con aro dorado');
}

/* ───────── 3. En pantalla ───────── */
let abrirApp = null
try {
  ;({ abrirApp } = await import('./_enLaApp.mjs'))
} catch { /* sin navegador */ }
const BASE = process.env.APP_URL
if (abrirApp && BASE) {
  console.log('3. En pantalla')
  const CAPTURAS = 'docs/dias/V5_capturas'
  fs.mkdirSync(CAPTURAS, { recursive: true })
  const TMP = path.join(process.env.TEMP || '.', `v5_fotos_${Date.now()}`)
  fs.mkdirSync(TMP, { recursive: true })
  // Coordenadas de los sitios de la demo (src/lib/logrosDemo_reclamar.ts).
  const dms = (v) => { const a = Math.abs(v); const g = Math.floor(a); const mm = Math.floor((a - g) * 60); return [g, mm, Math.round(((a - g) * 60 - mm) * 60 * 100) / 100] }
  const foto = (nombre, { fecha = '2026:10:13 10:30:15', lat = null, lng = null, make = 'Apple', model = 'iPhone 15' } = {}) => {
    const bytes = crearJpegConExif({ make, model, fecha, zona: null, ...(lat != null ? { lat: dms(lat), latRef: lat >= 0 ? 'N' : 'S', lng: dms(lng), lngRef: lng >= 0 ? 'E' : 'W' } : { conGps: false }) })
    const f = path.join(TMP, nombre)
    fs.writeFileSync(f, bytes)
    return f
  }
  // Roma, viaje de pruebas (del 12 al 14 de octubre de 2026; «hoy» 13 de octubre). Ver `__rutaPrueba`.
  const url = '/?cuentas=on&logros=on&logrosDemo=1&apertura=0&version=completa&hoy2=on'
  const app = await abrirApp(BASE, { ruta: url, ancho: 390, alto: 844 })
  try {
    for (let i = 0; i < 360 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await app.esp(500)
    await app.evaluar('Promise.resolve(window.__rutaPrueba()).then(() => true)')
    await app.esp(3000)
    const rango = await app.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const r = R.useRouteStore.getState().route; return r.answers.dateRange })()`)
    const inicio = rango.start
    const dia = (n) => { const d = new Date(Date.parse(`${inicio}T12:00:00Z`) + (n - 1) * 86400000).toISOString().slice(0, 10); return d.replace(/-/g, ':') + ' 10:30:15' }
    await app.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); R.useRouteStore.setState({ dev_simulated_today_iso: '${rango.start}' }); R.useRouteStore.getState().setMode('today'); return true })()`)
    await app.esp(2500)
    for (let i = 0; i < 6; i++) { const c = await app.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Ahora no)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()"); if (!c) break; await app.esp(700) }
    await app.esp(1500)
    // La cámara en las 5 pestañas, en el mismo sitio y del mismo tamaño que el botón de logros.
    const rect = (sel) => app.evaluar(`(() => { const e = document.querySelector('${sel}'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) } })()`)
    const pestanas = [['Ruta', 'ruta'], ['Días', 'dias'], ['Explorar', 'explorar'], ['Reservas', 'reservas'], ['Hoy', 'hoy']]
    const rects = {}
    for (const [nombre] of pestanas) {
      await app.evaluar(`(() => { const b = Array.from(document.querySelectorAll('nav button, [role=tablist] button, button')).find((x) => (x.textContent || '').trim() === '${nombre}'); if (b) b.click(); return true })()`)
      await app.esp(1800)
      const c = await rect('[data-camara-viaje=boton]')
      const l = await rect('[data-boton-logros]')
      rects[nombre] = { c, l }
      debe(c && c.w === 44 && c.h === 44, 'camara_5', `${nombre}: sale la cámara de viaje (44×44)`)
      debe(l && l.w === 44 && l.h === 44, 'flotantes', `${nombre}: el botón de logros mide 44×44, como la cámara`)
      if (c && l) debe(c.x === l.x && l.y - c.y >= 44, 'flotantes', `${nombre}: la cámara va justo encima del botón de logros (misma columna)`)
      if (nombre === 'Ruta' || nombre === 'Hoy') await app.captura(`${CAPTURAS}/camara_${nombre.toLowerCase()}.jpg`)
    }
    const xs = new Set(Object.values(rects).map((r) => r.c && r.c.x))
    debe(xs.size === 1, 'camara_5', `la cámara está en el mismo sitio en todas las pestañas (x: ${[...xs]})`)
    // El botón de logros, sin nada ganado: con color (trofeo en oro).
    const trofeo = await app.evaluar("Boolean(document.querySelector('[data-boton-logros-trofeo]')) && getComputedStyle(document.querySelector('[data-boton-logros]')).backgroundImage.includes('gradient')")
    debe(trofeo, 'flotantes', 'sin logros, el botón de logros lleva el trofeo en oro y un fondo crema (no un círculo blanco vacío)')
    await app.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => (x.textContent || '').trim() === 'Ruta'); if (b) b.click(); return true })()")
    await app.esp(1200)
    await app.captura(`${CAPTURAS}/flotantes_sin_logros.jpg`)
    // La hoja de la cámara (primera vez), con pase (completa).
    await app.evaluar("(() => { try { localStorage.removeItem('trazo:hoy:camara-explicada') } catch {} document.querySelector('[data-camara-viaje=boton]')?.click(); return true })()")
    await app.esp(900)
    const hojaTexto = await app.evaluar("document.querySelector('[data-camara-viaje=hoja]')?.innerText ?? ''")
    debe(/Tu cámara de viaje/.test(hojaTexto) && /Las fotos que hagas con ella se guardan en el álbum de tu viaje/.test(hojaTexto) && !/Una foto por cada lugar/.test(hojaTexto) && /Con tu .*, fotos sin límite/.test(hojaTexto), 'camara', `con pase: la hoja dice el texto de siempre y «Con tu Pase… fotos sin límite» (${hojaTexto.slice(0, 90).replace(/\n/g, ' ')}…)`)
    await app.captura(`${CAPTURAS}/hoja_camara_con_pase.jpg`)
    await app.evaluar("document.querySelector('[data-camara-viaje=hoja] button[aria-label=Cerrar]')?.click(); true")
    await app.esp(500)

    // El botón de Reclamar en la hoja de logros.
    await app.evaluar("document.querySelector('[data-boton-logros]')?.click(); true")
    await app.hasta("Boolean(document.querySelector('[data-reclamar=boton]'))", { segundos: 20 }).catch(() => undefined)
    const boton = await app.evaluar("({ hay: Boolean(document.querySelector('[data-reclamar=boton]')), texto: document.querySelector('[data-reclamar=boton]')?.innerText ?? '', plazo: document.querySelector('[data-reclamar=plazo]')?.innerText ?? '', candado: Boolean(document.querySelector('[data-candado-dato=reclamar-candado]')) })")
    debe(boton.hay && /Reclamar con tus fotos/.test(boton.texto) && !boton.candado, 'boton', 'con pase, en la hoja de logros sale [Reclamar con tus fotos] sin candado')
    debe(/^Puedes reclamar hasta el \d+ de \w+/.test(boton.plazo), 'boton', `y debajo el plazo (${boton.plazo})`)
    await app.captura(`${CAPTURAS}/boton_reclamar.jpg`)

    // 10 fotos de golpe (el `<input multiple>`).
    const fotos = [
      foto('01_coliseo.jpg', { fecha: dia(1), lat: 41.8902, lng: 12.4922 }),
      foto('02_trevi.jpg', { fecha: dia(1), lat: 41.9009, lng: 12.4833 }),
      foto('03_panteon_y_navona.jpg', { fecha: dia(2), lat: 41.8989, lng: 12.4752 }),
      foto('04_sin_ubicacion_a.jpg', { fecha: dia(1) }),
      foto('05_sin_ubicacion_b.jpg', { fecha: dia(2) }),
      foto('06_otra_fecha.jpg', { fecha: '2025:01:05 10:30:15', lat: 41.8902, lng: 12.4922 }),
      foto('07_captura.jpg', { fecha: dia(1), lat: 41.8902, lng: 12.4922, make: '', model: '' }),
      foto('08_mar.jpg', { fecha: dia(1), lat: 40.0, lng: 10.0 }),
      foto('09_coliseo_otra.jpg', { fecha: dia(2), lat: 41.8903, lng: 12.4923 }),
      foto('10_espana.jpg', { fecha: dia(1), lat: 41.9059, lng: 12.4823 }),
    ]
    const nodo = await app.cdp('DOM.getDocument', {})
    const q = await app.cdp('DOM.querySelector', { nodeId: nodo.result.root.nodeId, selector: '[data-reclamar=entrada]' })
    await app.cdp('DOM.setFileInputFiles', { nodeId: q.result.nodeId, files: fotos.map((f) => f.replace(/\\/g, '/')) })
    // Mientras comprueba: «Comprobando N de 10…».
    let progreso = ''
    for (let i = 0; i < 40; i++) {
      progreso = await app.evaluar("document.querySelector('[data-reclamar=progreso]')?.innerText ?? ''")
      if (/Comprobando \d+ de 10/.test(progreso)) break
      await app.esp(100)
    }
    debe(/Comprobando \d+ de 10…/.test(progreso), 'subida', `mientras sube: «${progreso}»`)
    if (progreso) await app.captura(`${CAPTURAS}/subiendo.jpg`)
    // Las 2 sin ubicación: pregunta «¿De qué sitio es esta foto?».
    await app.hasta("Boolean(document.querySelector('[data-reclamar=pregunta]'))", { segundos: 40 }).catch(() => undefined)
    const pregunta = await app.evaluar("document.querySelector('[data-reclamar=pregunta]')?.innerText ?? ''")
    debe(/¿De qué sitio es esta foto\?/.test(pregunta) && /Otros sitios/i.test(pregunta) && /Saltar esta foto/i.test(pregunta), 'pregunta', 'las fotos sin ubicación preguntan «¿De qué sitio es esta foto?», con buscador y [Saltar]')
    debe(/De ese día, sin su pedazo/i.test(pregunta), 'pregunta', 'primero las paradas de ese día sin su pedazo; después el resto')
    await app.esp(800)
    await app.captura(`${CAPTURAS}/pregunta.jpg`)
    await app.evaluar("(() => { const i = document.querySelector('[data-reclamar=buscador]'); const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(i, 'nav'); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()")
    await app.esp(400)
    const filtrado = await app.evaluar("Array.from(document.querySelectorAll('[data-reclamar=sitio]')).map((e) => e.innerText)")
    debe(filtrado.length >= 1 && filtrado.every((t) => /nav/i.test(t)), 'pregunta', `el buscador filtra (${filtrado.length}: ${filtrado[0]?.slice(0, 20)})`)
    await app.evaluar("document.querySelector('[data-reclamar=sitio]')?.click(); true")
    await app.hasta("Boolean(document.querySelector('[data-reclamar=pregunta]'))", { segundos: 10 }).catch(() => undefined)
    await app.evaluar("document.querySelector('[data-reclamar=saltar]')?.click(); true")
    await app.hasta("Boolean(document.querySelector('[data-reclamar=resumen]'))", { segundos: 30 })
    const resumen = await app.evaluar("document.querySelector('[data-reclamar=resumen]')?.innerText ?? ''")
    const titulo = await app.evaluar("document.querySelector('[data-reclamar=titulo]')?.innerText ?? ''")
    debe(/^Has ganado \d+ pedazos?/.test(titulo), 'resumen', `el resumen dice lo ganado («${titulo}»)`)
    for (const n of ['Coliseo', 'Fontana de Trevi', 'Panteón']) debe(resumen.includes(n), 'resumen', `la lista de sitios ganados incluye ${n}`)
    debe(/Piazza Navona/.test(resumen), 'resumen', 'una foto en dos sitios a la vez (Panteón y Piazza Navona) cuenta para los dos')
    debe(/fotos que no cuentan|Una foto que no cuenta/i.test(resumen) && /no es de los días de tu viaje|no son de los días de tu viaje/.test(resumen) && /tu móvil/.test(resumen), 'resumen', 'las que no valen, en una lista corta con el motivo (otra fecha, sin datos de cámara), sin una hoja por foto')
    debe((await app.evaluar("document.querySelectorAll('[data-reclamar=no-valen] > div').length")) >= 3, 'resumen', 'sin ubicación fuera de radio y las dos que no valen salen en la lista (3 o más)')
    await app.esp(800)
    await app.captura(`${CAPTURAS}/resumen.jpg`)
    await app.evaluar("(() => { const e = document.querySelector('[data-reclamar=resumen]'); if (e) e.scrollTop = e.scrollHeight; return true })()")
    await app.esp(500)
    await app.captura(`${CAPTURAS}/resumen_no_valen.jpg`)
    debe(await app.evaluar("Boolean(document.querySelector('[data-reclamar=ver-lo-ganado]'))"), 'resumen', '(V6) el botón dorado del resumen es [Ver lo que has ganado] (lleva a las animaciones agrupadas)')
    await app.evaluar("document.querySelector('[data-reclamar=ver-lo-ganado]')?.click(); true")
    await app.esp(1500)
    const fila = await app.evaluar("document.querySelector('[data-momento], [data-momentos], .mo-escena, [data-visto=\"pedazo\"]') ? 'si' : 'no'")
    void fila
  } finally {
    await app.cerrar()
  }
  // Sin pase (?version=gratis): la cámara sale sin candado, la hoja dice «Una foto por cada lugar» y el botón de reclamar lleva el candado pequeño.
  const gratis = await abrirApp(BASE, { ruta: url.replace('version=completa', 'version=gratis'), ancho: 390, alto: 844 })
  try {
    for (let i = 0; i < 360 && !(await gratis.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await gratis.esp(500)
    await gratis.evaluar('Promise.resolve(window.__rutaPrueba()).then(() => true)')
    await gratis.esp(3000)
    const r2 = await gratis.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); R.useRouteStore.setState({ dev_simulated_today_iso: R.useRouteStore.getState().route.answers.dateRange.start }); return R.useRouteStore.getState().route.answers.dateRange })()`)
    void r2
    await gratis.esp(2500)
    for (let i = 0; i < 6; i++) { const c = await gratis.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Ahora no)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()"); if (!c) break; await gratis.esp(700) }
    await gratis.esp(1200)
    const hayCamara = await gratis.evaluar("Boolean(document.querySelector('[data-camara-viaje=boton]'))")
    debe(hayCamara, 'sin_pase', 'sin pase también sale la cámara de viaje')
    debe(!(await gratis.evaluar("Boolean(document.querySelector('[data-camara-viaje=candado-boton]'))")), 'sin_pase', 'y sin el candado en el botón')
    await gratis.evaluar("(() => { try { localStorage.removeItem('trazo:hoy:camara-explicada') } catch {} document.querySelector('[data-camara-viaje=boton]')?.click(); return true })()")
    await gratis.esp(900)
    const ht = await gratis.evaluar("document.querySelector('[data-camara-viaje=hoja]')?.innerText ?? ''")
    debe(/Tu cámara de viaje/.test(ht) && /Una foto por cada lugar\./.test(ht) && /Con el .*, fotos sin límite\. Y además, podrás coleccionar recompensas: pedazos de colección y emblemas ocultos\./.test(ht.replace(/\n/g, ' ')), 'sin_pase', `sin pase la hoja dice «Una foto por cada lugar.» y «Con el Pase…» (${ht.slice(0, 60).replace(/\n/g, ' ')}…)`)
    debe(await gratis.evaluar("Boolean(document.querySelector('[data-camara-viaje=hoja] [data-camara-viaje=ver-pase]'))"), 'sin_pase', 'el segundo párrafo lleva el enlace al pase (con el candado pequeño)')
    await gratis.captura(`${CAPTURAS}/hoja_camara_sin_pase.jpg`)
    // La regla de una foto por parada sin pase: modoDeFoto dice «cambiar» si la parada ya tiene la suya.
    const reglas = await gratis.evaluar(`(async () => { const F = await import('/src/lib/fotosViaje.ts'); const fotos = [{ dayNumber: 1, stopName: 'Coliseo' }]; return { sin: F.modoDeFoto(fotos, 1, 'Coliseo'), otraParada: F.modoDeFoto(fotos, 1, 'Panteón'), limite: F.limiteDeFotos().porParada } })()`)
    debe(reglas.sin === 'cambiar' && reglas.otraParada === 'anadir' && reglas.limite === 1, 'sin_pase', `sin pase, una foto por parada: la segunda en el Coliseo pregunta si cambia la primera (${reglas.sin}), otra parada deja añadir (${reglas.otraParada})`)
    await gratis.evaluar("document.querySelector('[data-camara-viaje=hoja] button[aria-label=Cerrar]')?.click(); document.querySelector('[data-boton-logros]')?.click(); true")
    await gratis.hasta("Boolean(document.querySelector('[data-reclamar=boton]'))", { segundos: 20 }).catch(() => undefined)
    const sinPase = await gratis.evaluar("({ hay: Boolean(document.querySelector('[data-reclamar=boton]')), candado: Boolean(document.querySelector('[data-candado-dato=reclamar-candado]')) })")
    debe(sinPase.hay && sinPase.candado, 'sin_pase', 'sin pase, [Reclamar con tus fotos] sale con el candado pequeño (lleva al pase)')
    await gratis.captura(`${CAPTURAS}/boton_reclamar_sin_pase.jpg`)
  } finally {
    await gratis.cerrar()
  }
  try { fs.rmSync(TMP, { recursive: true, force: true }) } catch { /* nada */ }
} else console.log('3. En pantalla: se salta (sin APP_URL)')

console.log(`\nLa prueba V5: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
if (fallos.length) {
  for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
  process.exit(1)
}
