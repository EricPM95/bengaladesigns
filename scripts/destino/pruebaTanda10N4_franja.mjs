// Tanda 10N4 (G2b): la franja de aviso nuevo (Design 11), su sonido, los textos de todos los avisos y de dónde salían «Sobre tu ruta» y «Mañana empieza tu viaje».
//   APP_URL=http://localhost:5183 API_URL=http://localhost:8853 node scripts/destino/pruebaTanda10N4_franja.mjs
// No toca el motor de rutas.
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const CAPS = 'docs/dias/capturas_jutrip'

/* ------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
console.log('1. Los textos de los avisos (con la tabla de artículos del servidor)')
const { crearServicioAvisos } = await import('../../server/avisos.js') // (al cargarse pone la tabla de artículos)
const textos = await import('../../shared/avisos/textos.js')
const t = (tipo, payload) => textos.textoDelAviso({ tipo, payload })
{
  debe(t('viaje_cambiado', { quien: 'Eric', anadidas: [{ nombre: 'Fontana de Trevi', fecha: '2026-11-28' }] }) === 'Eric ha añadido la Fontana de Trevi al sábado 28', '4b2', '«Eric ha añadido la Fontana de Trevi al sábado 28» (sin «ha cambiado el viaje:» delante)')
  debe(t('viaje_cambiado', { quien: 'Eric', dias_quitados: 2 }) === 'Eric ha quitado 2 días', '4b2', '«Eric ha quitado 2 días»')
  debe(t('viaje_cambiado', { dias_quitados: 2 }) === 'Han quitado 2 días', '4b2', 'sin nombre: «Han quitado 2 días»')
  debe(t('viaje_cambiado', { quien: 'Eric' }) === 'Eric ha cambiado el viaje', '4b2', 'sin detalle: «Eric ha cambiado el viaje»')
  debe(t('recomendacion', { autor: 'Laura', tipo_rec: 'cambio', dia: 2 }) === 'Laura te ha recomendado un cambio en el día 2', '4b2', 'la recomendación en pasado, como el resto: «Laura te ha recomendado un cambio en el día 2»')
  debe(t('recomendacion', { autor: 'Ana', n_cambios: 5, destino: 'Roma' }) === 'Ana te ha mandado una propuesta de 5 cambios para el viaje a Roma', '4b2', '«Ana te ha mandado una propuesta de 5 cambios para el viaje a Roma»')
  debe(t('recomendacion', { autor: 'Ana', n_cambios: 1 }) === 'Ana te ha mandado una propuesta de 1 cambio', '4b2', 'singular: «de 1 cambio»')
  debe(t('reserva_grupo', { quien: 'Eric', sitio: 'Coliseo', dia: 'jueves 26', hora: '08:00', incluido: true }) === 'Eric ha reservado el Coliseo para ti el jueves 26 a las 8:00.', '4b2', '«Eric ha reservado el Coliseo para ti el jueves 26 a las 8:00.» (con artículo, sin los dos puntos)')
  debe(t('reserva_grupo', { quien: 'Eric', sitio: 'Museos Capitolinos', dia: 'jueves 12', hora: '11:45' }) === 'Eric ha reservado los Museos Capitolinos el jueves 12 a las 11:45.', '4b2', 'plural con artículo: «los Museos Capitolinos»')
  debe(t('reserva_grupo', { caso: 'no_cuadra', sitio: 'Museos Capitolinos', dia_reserva: 'viernes 27', dia_ruta: 'jueves 26' }) === 'Tu entrada de los Museos Capitolinos es el viernes 27, y en la ruta está el jueves 26.', '4b2', '«Tu entrada de los Museos Capitolinos es el viernes 27…» (de + artículo)')
  debe(t('permiso', { admin: 'Eric', permiso: 'recomendar', destino: 'Roma' }) === 'Eric ha cambiado tu permiso: ahora puedes recomendar cambios en el viaje a Roma', '4b2', 'el permiso de recomendar, en una frase corta')
  debe(t('permiso', { admin: 'Eric', permiso: 'editar', destino: 'Roma' }) === 'Eric te ha dado permiso para editar el viaje a Roma', '4b2', '«Eric te ha dado permiso para editar el viaje a Roma»')
  debe(t('d10', { destino: 'Roma', dias: 1 }) === 'Mañana empieza tu viaje a Roma' && t('d10', { destino: 'Roma', dias: 10 }) === 'En 10 días empieza tu viaje a Roma', '4b2', '«Mañana empieza…» solo con dias = 1; si no, «Tu viaje a Roma empieza en 10 días»')
  debe(t('sorpresas', { dias: 1 }) === 'Te queda 1 día para reclamar tus sorpresas' && t('sorpresas', { dias: 3 }) === 'Te quedan 3 días para reclamar tus sorpresas', '4b2', 'sorpresas: singular y plural')
  debe(t('gasto_pendiente', { autor: 'Ana' }) === 'Ana quiere añadir al presupuesto', '4b2', '«Ana quiere añadir al presupuesto»')
  // La franja: título corto y detalle (Design 11)
  const f = (tipo, payload) => textos.franjaDelAviso({ tipo, payload })
  const fa = f('viaje_cambiado', { quien: 'Eric', anadidas: [{ nombre: 'Fontana di Trevi', fecha: '2026-11-14' }] })
  debe(fa.titulo === 'Eric ha añadido un sitio' && fa.detalle === 'Fontana di Trevi · sábado 14' && fa.icono === 'persona', '4b', 'la franja: «Eric ha añadido un sitio» / «Fontana di Trevi · sábado 14» con la moneda de la persona')
  const fg = f('gasto_pendiente', { autor: 'Ana', nombre: 'Cena en Trastevere', precio: { amount: 84, currency: 'EUR' } })
  debe(fg.titulo === 'Ana ha añadido un gasto' && /^Cena en Trastevere · 84/.test(fg.detalle), '4b', 'la franja del gasto: «Ana ha añadido un gasto» / «Cena en Trastevere · 84 €»')
  const fp = f('recomendacion', { autor: 'Laura', n_cambios: 3 })
  debe(fp.titulo === 'Laura te ha mandado una propuesta' && fp.detalle === '3 cambios', '4b', 'la franja de la propuesta: «Laura te ha mandado una propuesta» / «3 cambios»')
  const fe = f('reserva_grupo', { quien: 'Eric', sitio: 'Coliseo', dia: 'jueves 12', hora: '11:45', incluido: true })
  debe(fe.titulo === 'Eric ha reservado el Coliseo para ti' && fe.detalle === 'Jueves 12 · 11:45', '4b', 'la franja de la entrada: «Eric ha reservado el Coliseo para ti» / «Jueves 12 · 11:45»')
  debe(f('d10', { dias: 1, destino: 'Roma', inicio: '2026-11-26', fin: '2026-11-29' }).icono === 'calendario' && f('d10', { dias: 1, destino: 'Roma', inicio: '2026-11-26', fin: '2026-11-29' }).detalle === 'Roma · 26 – 29 nov', '4b', '«Mañana empieza tu viaje» lleva el calendario y «Roma · 26 – 29 nov»')
  debe(f('quitado', { destino: 'Roma' }).icono === 'info', '4b', 'la información lleva la «i»')
  debe(f('sorteo', { anio: 2026 }).icono === 'estrella' && f('sorteo', { anio: 2026 }).titulo === 'Ya tienes tu billete', '4b', 'el sorteo lleva la estrella: «Ya tienes tu billete»')
  debe(f('reserva_grupo', { caso: 'no_cuadra', sitio: 'Coliseo', dia_reserva: 'viernes 27' }).icono === 'ticket', '4b', 'la entrada que avisa la app lleva el ticket')
  debe(f('permiso', { admin: 'Eric', permiso: 'editar', destino: 'Roma' }).titulo === 'Eric te ha dado permiso' && f('permiso', { admin: 'Eric', permiso: 'editar', destino: 'Roma' }).detalle === 'Para editar el viaje a Roma', '4b', 'el permiso: «Eric te ha dado permiso» / «Para editar el viaje a Roma»')
  // Todos los tipos tienen franja con título (ningún «Tienes un aviso»)
  const tipos = ['recomendacion', 'aceptada', 'rechazada', 'unido', 'd10', 'resumen', 'sorpresas', 'sorteo', 'amigo_viaje', 'reserva_grupo', 'gasto_pendiente', 'gasto_resuelto', 'pago_marcado', 'permiso', 'quitado', 'viaje_cambiado', 'sin_enviar']
  debe(tipos.every((x) => f(x, { autor: 'Ana', admin: 'Eric', n: 2, dias: 3, destino: 'Roma' }).titulo !== 'Tienes un aviso'), '4b', 'todos los tipos de aviso tienen su franja')
  // Las fechas: «Los Museos Vaticanos y la Villa Farnesina cierran el domingo 15 de noviembre.»
  const fuente = fs.readFileSync('src/lib/dateNotices.ts', 'utf8')
  debe(fuente.includes('conArticulos') && fuente.includes('placeWithArticle'), '4b2', 'las frases de cierre de la campana se dicen con artículo («Los Museos Vaticanos y la Villa Farnesina cierran…»)')
}

console.log('2. «Mañana empieza tu viaje» solo el día antes (servidor, con las fechas de hoy)')
{
  const AHORA = new Date('2026-10-26T12:00:00Z')
  const crear = ({ viajes, avisos }) =>
    crearServicioAvisos({
      admin: {
        rpc: async (nombre) => {
          const datos = nombre === 'viajes_para_avisos' ? viajes : nombre === 'avisos_de' ? avisos : nombre === 'pases_de' || nombre === 'logro_avisos_vencidos' ? [] : nombre === 'crear_aviso' ? true : null
          return { data: datos, error: null }
        },
      },
      ahora: () => AHORA,
      log: { warn() {} },
    })
  const d10 = (id, payload) => ({ id, tipo: 'd10', payload: { trip_id: 'v1', destino: 'Roma', ...payload }, creado_en: AHORA.toISOString(), leido: false })
  // a) el viaje de 11 a 15 de nov (16 días): ningún «mañana», aunque el aviso se hubiera creado con dias = 1 para otras fechas
  let s = crear({ viajes: [{ id: 'v1', destino: 'Roma', inicio: '2026-11-11', fin: '2026-11-15', zona: 'Europe/Rome' }], avisos: [d10('a1', { inicio: '2026-10-27', fin: '2026-10-30', dias: 1 })] })
  let r = await s.listar('u')
  debe(r.avisos.length === 0, '2', 'un aviso «Mañana empieza» de otras fechas ya no sale en el viaje de 11 a 15 de noviembre')
  // b) el viaje empieza de verdad mañana: sí
  s = crear({ viajes: [{ id: 'v1', destino: 'Roma', inicio: '2026-10-27', fin: '2026-10-30', zona: 'Europe/Rome' }], avisos: [d10('a2', { inicio: '2026-10-27', fin: '2026-10-30', dias: 10 })] })
  r = await s.listar('u')
  debe(r.avisos.length === 1 && r.avisos[0].texto === 'Mañana empieza tu viaje a Roma', '2', 'el día antes sí sale, y dice «Mañana» aunque se creara con «10 días»')
  debe(r.avisos[0]?.franja?.titulo === 'Mañana empieza tu viaje' && r.avisos[0]?.franja?.icono === 'calendario', '2', 'y su franja lleva el calendario')
  // c) faltan 5 días: «Tu viaje a Roma empieza en 5 días»
  s = crear({ viajes: [{ id: 'v1', destino: 'Roma', inicio: '2026-10-31', fin: '2026-11-02', zona: 'Europe/Rome' }], avisos: [d10('a3', { inicio: '2026-10-31', fin: '2026-11-02', dias: 10 })] })
  r = await s.listar('u')
  debe(r.avisos[0]?.texto === 'En 5 días empieza tu viaje a Roma', '2', 'con 5 días por delante dice «En 5 días», no el número con el que se creó')
  // d) el viaje ya no existe / cambió de fechas
  s = crear({ viajes: [], avisos: [d10('a4', { inicio: '2026-10-27', dias: 1 })] })
  debe((await s.listar('u')).avisos.length === 0, '2', 'si el viaje ya no existe, el aviso tampoco')
  s = crear({ viajes: [{ id: 'v1', destino: 'Roma', inicio: '2026-10-27', fin: '2026-10-30', zona: 'Europe/Rome' }], avisos: [d10('a5', { inicio: '2026-10-20', dias: 1 })] })
  debe((await s.listar('u')).avisos.length === 0, '2', 'si el viaje cambió de fecha desde que se creó el aviso, ya no vale')
  // e) los demás avisos no se tocan
  s = crear({ viajes: [], avisos: [{ id: 'p1', tipo: 'permiso', payload: { trip_id: 'v1', admin: 'Eric', permiso: 'editar', destino: 'Roma' }, creado_en: AHORA.toISOString(), leido: false }] })
  r = await s.listar('u')
  debe(r.avisos.length === 1 && r.avisos[0].texto === 'Eric te ha dado permiso para editar el viaje a Roma' && r.avisos[0].franja?.titulo === 'Eric te ha dado permiso', '2', 'los demás avisos salen igual, con su franja escrita en el servidor')
}

console.log('3. «Sobre tu ruta» solo si es de este viaje')
{
  const { default: ts } = await import('typescript')
  const src = fs.readFileSync('src/lib/contextBannerVigente.ts', 'utf8')
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  const { bannerDeContextoVigente } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))
  const dias = (n) => Array.from({ length: n }, (_, i) => ({ id: `d${i}` }))
  debe(bannerDeContextoVigente({ contextBanner: '2 días en Roma dan para mucho si se aprovechan bien.', days: dias(5) }) === null, '2', '«2 días en Roma dan para mucho…» no sale en un viaje de 5 días')
  debe(bannerDeContextoVigente({ contextBanner: '2 días en Roma dan para mucho si se aprovechan bien.', days: dias(2) }) !== null, '2', 'en un viaje de 2 días sí')
  debe(bannerDeContextoVigente({ contextBanner: 'Un día en Roma da para mucho si se aprovecha bien.', days: dias(3) }) === null, '2', '«Un día en Roma…» no sale en un viaje de 3 días')
  debe(bannerDeContextoVigente({ contextBanner: 'En invierno Roma madruga y cierra pronto: anochece antes de las 17:00.', days: dias(5) }) !== null, '2', 'el de invierno, que no cuenta los días, sale siempre')
}

/* ------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
console.log('4. La franja en la app (390 px)')
let a
try {
  const falsoAudio = `
    window.__arrancados = 0
    class FalsoContexto { constructor(){ this.state = 'running'; this.destination = {} }
      resume(){ return Promise.resolve() }
      decodeAudioData(){ return Promise.resolve({ duration: 0.72 }) }
      createBufferSource(){ return { connect(){}, start(){ window.__arrancados++ } } } }
    window.AudioContext = FalsoContexto; window.webkitAudioContext = FalsoContexto;
  `
  a = await abrirApp(APP, { ancho: 390, alto: 844, ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0', antes: falsoAudio })
  const ev = a.evaluar
  for (let i = 0; i < 60 && !(await ev('typeof window.__rutaPrueba === "function" && typeof window.__avisos === "function"')); i++) await a.esp(500)
  await a.esp(2500)
  for (let intento = 0; intento < 4; intento++) {
    try {
      await ev('window.__rutaPrueba().then(() => true)')
      break
    } catch (e) {
      if (intento === 3) throw e
      await a.esp(2500)
    }
  }
  await a.esp(2500)
  await ev("localStorage.removeItem('trazo:sonido')")
  // (La ventana de «Hemos preparado tu viaje para estas fechas» se cierra, para que la captura se vea limpia.)
  for (let i = 0; i < 5; i++) {
    await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)/.test((x.textContent ?? '').trim())); b?.click(); return Boolean(b) })()")
    await a.esp(500)
  }
  await ev("window.__ruta.setState({ screen: 'route', mode: 'days' })")
  await a.esp(800)

  // Ayudantes en la página
  await ev(`
    window.__av = (id, tipo, payload, quien, extra = {}) => ({ id, tipo, texto: 'x', quien, creado_en: new Date().toISOString(), leido: false, payload, etiqueta: null, ...extra })
    window.__lista = []
    window.__llega = (...nuevos) => { window.__lista = [...nuevos, ...window.__lista]; window.__avisos.getState().poner(window.__lista) }
    window.__franjaAhora = () => { const e = document.querySelector('[data-franja-aviso]'); if (!e) return null; const r = e.getBoundingClientRect(); const mon = e.querySelector('[data-avatar]'); return { tipo: e.dataset.franjaAviso, n: Number(e.dataset.franjaN), titulo: e.querySelector('[data-franja-titulo]')?.textContent ?? '', detalle: e.querySelector('[data-franja-detalle]')?.textContent ?? '', icono: e.querySelector('[data-franja-icono]')?.dataset.franjaIcono ?? null, inicial: mon?.textContent ?? null, ver: Boolean(e.querySelector('[data-franja-ver]')), top: r.top, bottom: r.bottom, left: r.left, right: r.right, fondo: getComputedStyle(e.firstElementChild.nextElementSibling ?? e.firstElementChild).backgroundColor } }
    window.__sonidos = () => (window.__sonidosPedidos ?? []).filter((x) => x === 'aviso').length
    window.__avisos.getState().poner([])
    true`)
  await a.esp(300)
  const esperaFranja = async (ms = 3000) => {
    for (let i = 0; i < ms / 100; i++) {
      if (await ev('window.__franjaAhora()')) {
        await a.esp(700) // (lo que dura la entrada de la franja)
        return await ev('window.__franjaAhora()')
      }
      await a.esp(100)
    }
    return null
  }
  const cerrarFranja = async () => {
    await ev('window.__franja.getState().cerrar()')
    await a.esp(150)
  }

  // La primera lista que se carga NO saca franja
  debe((await ev('window.__franjaAhora()')) === null, '4b', 'al abrir la app, sin avisos nuevos, no sale franja')

  // 4.1 Una de cada tipo
  const casos = [
    { id: 'c1', tipo: 'permiso', payload: { trip_id: 'T', admin: 'Eric', permiso: 'editar', destino: 'Roma' }, quien: 'Eric', titulo: 'Eric te ha dado permiso', detalle: 'Para editar el viaje a Roma', persona: 'E', cap: 'permiso' },
    { id: 'c2', tipo: 'viaje_cambiado', payload: { trip_id: 'T', quien: 'Eric', anadidas: [{ nombre: 'Fontana di Trevi', fecha: '2026-11-14' }] }, quien: 'Eric', titulo: 'Eric ha añadido un sitio', detalle: 'Fontana di Trevi · sábado 14', persona: 'E', cap: 'sitio' },
    { id: 'c3', tipo: 'gasto_pendiente', payload: { trip_id: 'T', autor: 'Ana', nombre: 'Cena en Trastevere', precio: { amount: 84, currency: 'EUR' } }, quien: 'Ana', titulo: 'Ana ha añadido un gasto', detalle: 'Cena en Trastevere · 84', persona: 'A', cap: 'gasto' },
    { id: 'c4', tipo: 'recomendacion', payload: { trip_id: 'T', rec_id: 'R', autor: 'Laura', n_cambios: 3, destino: 'Roma' }, quien: 'Laura', titulo: 'Laura te ha mandado una propuesta', detalle: '3 cambios', persona: 'L', cap: 'propuesta' },
    { id: 'c5', tipo: 'reserva_grupo', payload: { trip_id: 'T', quien: 'Eric', sitio: 'Coliseo', dia: 'jueves 12', hora: '11:45', incluido: true }, quien: 'Eric', titulo: 'Eric ha reservado el Coliseo para ti', detalle: 'Jueves 12 · 11:45', persona: 'E', cap: 'entrada' },
    { id: 'c6', tipo: 'd10', payload: { trip_id: 'T', destino: 'Roma', dias: 1, inicio: '2026-11-26', fin: '2026-11-29' }, quien: null, titulo: 'Mañana empieza tu viaje', detalle: 'Roma · 26 – 29 nov', icono: 'calendario', cap: 'fecha' },
    { id: 'c7', tipo: 'quitado', payload: { trip_id: 'T', destino: 'Roma' }, quien: null, titulo: 'Ya no formas parte del viaje', detalle: 'Viaje a Roma', icono: 'info', cap: 'info' },
    { id: 'c8', tipo: 'sorteo', payload: { anio: 2026 }, quien: null, titulo: 'Ya tienes tu billete', detalle: 'Para el sorteo de 2026', icono: 'estrella', cap: 'sorteo' },
    { id: 'c9', tipo: 'reserva_grupo', payload: { trip_id: 'T', caso: 'no_cuadra', sitio: 'Coliseo', dia_reserva: 'viernes 27', dia_ruta: 'jueves 26' }, quien: null, titulo: 'Tu entrada no cuadra con la ruta', detalle: 'El Coliseo · viernes 27', icono: 'ticket', cap: 'ticket' },
    { id: 'c10', tipo: 'gasto_resuelto', payload: { trip_id: 'T', admin: 'Eric', resultado: 'aceptado', nombre: 'Cena', precio: { amount: 30, currency: 'EUR' } }, quien: 'Eric', titulo: 'Eric ha aceptado tu gasto', detalle: 'Cena · 30', persona: 'E', cap: 'gasto_ok' },
    { id: 'c11', tipo: 'aceptada', payload: { trip_id: 'T', rec_id: 'R', admin: 'Eric', n_total: 5, n_aceptados: 3 }, quien: 'Eric', titulo: 'Eric ha aceptado tu propuesta', detalle: '3 de tus 5 cambios', persona: 'E', cap: 'aceptada' },
  ]
  let sonidosEsperados = 0
  for (const c of casos) {
    const antesSonidos = await ev('window.__sonidos()')
    await ev(`window.__llega(window.__av(${JSON.stringify(c.id)}, ${JSON.stringify(c.tipo)}, ${JSON.stringify(c.payload)}, ${JSON.stringify(c.quien)}))`)
    const f = await esperaFranja()
    debe(f !== null && f.tipo === c.tipo && f.n === 1, '4b', `${c.tipo}: sale la franja con el aviso nuevo`)
    if (f) {
      debe(f.titulo === c.titulo, '4b', `${c.tipo}: título «${c.titulo}» (sale «${f.titulo}»)`)
      debe(f.detalle.startsWith(c.detalle), '4b', `${c.tipo}: detalle «${c.detalle}» (sale «${f.detalle}»)`)
      if (c.persona) debe(f.inicial === c.persona && f.icono === null, '4b', `${c.tipo}: la inicial «${c.persona}» en la moneda dorada`)
      else debe(f.icono === c.icono && f.inicial === null, '4b', `${c.tipo}: el icono «${c.icono}» en el círculo oscuro con borde dorado`)
      debe(f.top >= 0 && f.left >= 8 && f.right <= 390 - 8, '4b', `${c.tipo}: la franja cabe en el ancho del móvil y no se sale por arriba`)
    }
    if (c.cap) await a.captura(`${CAPS}/10n4_franja_${c.cap}.jpg`)
    // el aviso (y su sonido): uno por franja
    await a.esp(150)
    debe((await ev('window.__sonidos()')) >= antesSonidos, '4b', `${c.tipo}: suena la campanita`)
    sonidosEsperados++
    await cerrarFranja()
    await a.esp(2600) // (separa un sonido de otro: la regla es «uno por tanda»)
  }
  // 4.2 El sonido: uno por aviso cuando llegan separados
  const sonados = await ev('window.__sonidos()')
  const arrancados = await ev('window.__arrancados')
  debe(sonados === sonidosEsperados, '4b', `un sonido por cada aviso que llega suelto (${sonados} de ${sonidosEsperados})`)
  debe(arrancados >= 1, '4b', `el sonido llega a reproducirse (Audio falso: ${arrancados} reproducciones)`)
  debe((await ev('document.documentElement.innerHTML.includes("vibrate")')) === false, '4b', 'nada de vibración')

  // 4.3 Varios a la vez: una franja, un sonido
  await ev('window.__lista = []; window.__avisos.getState().poner([])')
  await a.esp(2700)
  const s0 = await ev('window.__sonidos()')
  const a0 = await ev('window.__arrancados')
  await ev(`window.__llega(
    window.__av('v3', 'recomendacion', { trip_id: 'T', rec_id: 'R', autor: 'Laura', n_cambios: 3, destino: 'Roma' }, 'Laura'),
    window.__av('v2', 'gasto_pendiente', { trip_id: 'T', autor: 'Ana', nombre: 'Cena', precio: { amount: 84, currency: 'EUR' } }, 'Ana'),
    window.__av('v1', 'viaje_cambiado', { trip_id: 'T', quien: 'Eric', anadidas: [{ nombre: 'Fontana di Trevi', fecha: '2026-11-14' }] }, 'Eric'))`)
  const fv = await esperaFranja()
  debe(fv !== null && fv.n === 3 && fv.tipo === 'varios', '4b', 'tres avisos a la vez: UNA sola franja')
  debe(fv?.titulo === '3 avisos nuevos', '4b', `«3 avisos nuevos» (sale «${fv?.titulo}»)`)
  debe(fv?.detalle === 'Laura, Ana y Eric', '4b', `los nombres debajo (sale «${fv?.detalle}»)`)
  debe(fv?.ver === true, '4b', '[Ver] a la derecha')
  debe((await ev("document.querySelectorAll('[data-franja-aviso]').length")) === 1, '4b', 'solo hay una franja en pantalla')
  await a.esp(300)
  debe((await ev('window.__sonidos()')) - s0 === 1 && (await ev('window.__arrancados')) - a0 === 1, '4b', 'tres avisos a la vez: UN solo sonido')
  await a.captura(`${CAPS}/10n4_franja_varios.jpg`)
  // tocarla: abre la campana
  await ev("window.__avisos.getState().cerrar()")
  await ev(`(() => { const e = document.querySelector('[data-franja-aviso]').getBoundingClientRect(); window.__xy = [e.left + e.width / 2, e.top + e.height / 2] })()`)
  const [x, y] = await ev('window.__xy')
  await a.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 })
  await a.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 })
  await a.esp(700)
  debe((await ev('window.__avisos.getState().abierta')) === true, '4b', 'tocar la franja de varios abre la campana')
  debe((await ev('window.__franjaAhora()')) === null, '4b', 'y la franja se va')
  await ev('window.__avisos.getState().cerrar()')

  // 4.4 Tocar una franja suelta: abre lo que sea y lo marca leído
  await ev('window.__lista = []; window.__avisos.getState().poner([])')
  await a.esp(2700)
  await ev(`window.__llega(window.__av('t1', 'unido', { trip_id: 'T', nombre: 'Marta' }, 'Marta'))`)
  const ft = await esperaFranja()
  debe(ft !== null && ft.titulo === 'Marta se ha unido al viaje', '4b', `una persona que se une: «${ft?.titulo}»`)
  await ev(`(() => { const e = document.querySelector('[data-franja-aviso]').getBoundingClientRect(); window.__xy = [e.left + e.width / 2, e.top + e.height / 2] })()`)
  const [tx, ty] = await ev('window.__xy')
  await a.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: tx, y: ty, button: 'left', clickCount: 1 })
  await a.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: tx, y: ty, button: 'left', clickCount: 1 })
  await a.esp(800)
  debe((await ev("window.__avisos.getState().avisos.find((x) => x.id === 't1')?.leido")) === true, '4b', 'tocar la franja marca el aviso como leído')
  debe((await ev('window.__franjaAhora()')) === null, '4b', 'tocar la franja la quita')

  // 4.5 Deslizarla hacia arriba la quita antes de tiempo
  await ev('window.__lista = []; window.__avisos.getState().poner([])')
  await a.esp(2700)
  await ev(`window.__llega(window.__av('s1', 'permiso', { trip_id: 'T', admin: 'Eric', permiso: 'editar', destino: 'Roma' }, 'Eric'))`)
  await esperaFranja()
  await ev(`(() => { const e = document.querySelector('[data-franja-aviso]').getBoundingClientRect(); window.__xy = [e.left + e.width / 2, e.top + e.height / 2] })()`)
  const [sx, sy] = await ev('window.__xy')
  await a.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: sx, y: sy, button: 'left', clickCount: 1 })
  for (const dy of [-15, -35, -60]) await a.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: sx, y: sy + dy, button: 'left' })
  await a.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: sx, y: sy - 60, button: 'left', clickCount: 1 })
  await a.esp(700)
  debe((await ev('window.__franjaAhora()')) === null, '4b', 'deslizarla hacia arriba la quita antes de tiempo')
  debe((await ev("window.__avisos.getState().avisos.find((x) => x.id === 's1')?.leido")) === false, '4b', 'deslizarla no marca el aviso como leído (sigue en la campana)')

  // 4.6 Se va sola
  await ev('window.__lista = []; window.__avisos.getState().poner([])')
  await a.esp(2700)
  await ev(`window.__llega(window.__av('z1', 'permiso', { trip_id: 'T', admin: 'Eric', permiso: 'recomendar', destino: 'Roma' }, 'Eric'))`)
  await esperaFranja()
  await a.esp(5600)
  debe((await ev('window.__franjaAhora()')) === null, '4b', 'la franja se va sola a los pocos segundos')
  debe((await ev("window.__avisos.getState().avisos.some((x) => x.id === 'z1')")) === true, '4b', 'y el aviso se queda en la campana')

  // 4.7 «Sonido de los momentos» apagado: franja sí, sonido no
  await ev('window.__lista = []; window.__avisos.getState().poner([])')
  await a.esp(2700)
  await ev("localStorage.setItem('trazo:sonido', 'no')")
  const s1 = await ev('window.__sonidos()')
  await ev(`window.__llega(window.__av('m1', 'permiso', { trip_id: 'T', admin: 'Eric', permiso: 'editar', destino: 'Roma' }, 'Eric'))`)
  debe((await esperaFranja()) !== null, '4b', 'con el sonido apagado la franja sale igual')
  await a.esp(300)
  debe((await ev('window.__sonidos()')) === s1, '4b', 'con «Sonido de los momentos» apagado, sin sonido')
  await ev("localStorage.setItem('trazo:sonido', 'si')")
  await cerrarFranja()

  // 4.8 Los leídos, los viejos y la primera carga no sacan franja
  await ev('window.__lista = []; window.__avisos.getState().poner([])')
  await a.esp(2700)
  await ev(`window.__llega(window.__av('o1', 'permiso', { trip_id: 'T', admin: 'Eric', permiso: 'editar', destino: 'Roma' }, 'Eric', { creado_en: new Date(Date.now() - 3 * 3600e3).toISOString() }), window.__av('o2', 'unido', { nombre: 'Ana' }, 'Ana', { leido: true }))`)
  await a.esp(500)
  debe((await ev('window.__franjaAhora()')) === null, '4b', 'un aviso de hace horas o ya leído no saca franja')

  // 4.9 Mismo aviso en la franja y en la campana (la campana lo tiene)
  await ev('window.__lista = []; window.__avisos.getState().poner([])')
  await a.esp(2700)
  await ev(`window.__llega(window.__av('k1', 'unido', { nombre: 'Marta' }, 'Marta'))`)
  await esperaFranja()
  debe((await ev("window.__avisos.getState().avisos.some((x) => x.id === 'k1' && !x.leido)")) === true, '4b', 'el aviso de la franja está también, sin leer, en la campana')
  await cerrarFranja()

  // 4.10 El mismo aviso otra vez (la lista se vuelve a cargar) no repite franja
  const antes = await ev('window.__sonidos()')
  await ev('window.__avisos.getState().poner(window.__lista)')
  await a.esp(400)
  debe((await ev('window.__franjaAhora()')) === null && (await ev('window.__sonidos()')) === antes, '4b', 'volver a cargar la misma lista no repite ni la franja ni el sonido')

  // 4.11 El gasto que decide Eric sale en la MISMA pieza (no en una pastilla aparte)
  const fuenteGastos = fs.readFileSync('src/components/presupuesto/GastosCompartidosHost.tsx', 'utf8')
  debe(!fuenteGastos.includes('createPortal') && fuenteGastos.includes('useFranjaStore'), '4b', 'la franja del gasto aceptado usa la misma pieza que los demás avisos')
  const fuenteCompartido = fs.readFileSync('src/components/compartir/CompartidoHost.tsx', 'utf8')
  debe(!fuenteCompartido.includes('data-linea-viaje-cambiado') && fuenteCompartido.includes('useFranjaStore'), '4b', 'las líneas «Ya no formas parte…» / «Eric ha cambiado el viaje» usan también la misma franja')
} catch (e) {
  debe(false, 'error', `la prueba de la app falló: ${e.message}`)
} finally {
  a?.cerrar()
}

console.log('5. Capturas de Design al lado')
try {
  const despues03 = ''
  await capturarDesign('Piezas/Avisos Franja.dc.html', `${CAPS}/10n4_design_avisos_franja.jpg`, { ancho: 1500, alto: 900, despues: despues03 })
  debe(fs.existsSync(`${CAPS}/10n4_design_avisos_franja.jpg`), 'capturas', 'captura de la pieza de Design')
} catch (e) {
  debe(false, 'capturas', `no se pudo capturar Design: ${e.message}`)
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
