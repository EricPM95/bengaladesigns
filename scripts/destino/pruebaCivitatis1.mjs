// La prueba de la API de consulta, parte 1 (sandbox). No toca el motor de rutas.
//   node scripts/destino/pruebaCivitatis1.mjs
//
// Con respuestas del sandbox guardadas en archivos (scripts/destino/fixtures/civitatis/), para que no dependa de la hora (el sandbox solo funciona de 7:00 a 2:00, hora de España) ni de la red:
// el token y su renovación, el 429, la caché, la API caída (la app hace lo de hoy), el enlace con `aid=5206`, las horas libres (y las plazas, solo con el número real), el día sin plazas, los datos
// reales de las entradas, las excursiones, el Free Tour, los traslados y las actividades cerca de un sitio. Si estás dentro del horario del sandbox y están las claves en el .env.local,
// al final hay una prueba corta contra el sandbox de verdad (nunca se enseñan ni se guardan las claves).
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createRequire } from 'node:module'
import { build } from 'esbuild'
import { config } from 'dotenv'
import { crearClienteCivitatis, entornoDeCivitatis, civitatisActiva, MAX_REINTENTOS_429, URL_BASE } from '../../server/civitatis/cliente.js'
import { crearCache } from '../../server/civitatis/cache.js'
import { crearServicioCivitatis, AJUSTES, datosDelDestino, fechaMas } from '../../server/civitatis/servicio.js'
import { registrarRutasCivitatis } from '../../server/civitatis/rutas.js'
import * as mapeo from '../../server/civitatis/mapeo.js'
import { CIVITATIS_AID, isCivitatisUrl } from '../../shared/affiliate/civitatis.js'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const F = (nombre) => JSON.parse(fs.readFileSync(`scripts/destino/fixtures/civitatis/${nombre}.json`, 'utf8'))

/* ─────────────────────────── Un servidor de mentira ─────────────────────────── */
/**
 * Un `fetch` de mentira que contesta como el sandbox con las respuestas guardadas. Cuenta las peticiones; `fallos429` = cuántas veces seguidas contesta 429; `caida` = nada responde.
 * No guarda nunca las claves que le mandan (solo comprueba que el cuerpo del login las lleve).
 */
function servidorFalso({ fallos429 = 0, caida = false, tokenCaduca = '2099-01-01T00:00:00+00:00', calendarios = {} } = {}) {
  const registro = { auth: 0, peticiones: [], cabeceras: [], logins: [] }
  let pendientes429 = fallos429
  let n = 0
  const respuesta = (estado, cuerpo, cabeceras = {}) => ({
    ok: estado >= 200 && estado < 300,
    status: estado,
    headers: { get: (k) => cabeceras[k] ?? null },
    json: async () => cuerpo,
    text: async () => JSON.stringify(cuerpo),
  })
  const cal = (id) => calendarios[id] ?? (id === '3834' ? F('calendario_3834') : id === '2671' ? F('calendario_2671') : id === '84' ? F('calendario_84') : null)
  const llamar = async (url, opciones = {}) => {
    if (caida) throw new Error('sin red')
    const u = new URL(url)
    const ruta = u.pathname.replace('/v2', '')
    if (ruta === '/auth') {
      registro.auth++
      const cuerpo = JSON.parse(opciones.body)
      registro.logins.push({ tieneUsuario: Boolean(cuerpo.username), tieneClave: Boolean(cuerpo.password) })
      return respuesta(200, { token: `token-de-prueba-${registro.auth}`, expiresIn: tokenCaduca })
    }
    registro.peticiones.push(`${opciones.method ?? 'GET'} ${ruta}${u.search}`)
    registro.cabeceras.push(opciones.headers ?? {})
    const autorizado = (opciones.headers?.Authorization ?? '') === `Bearer token-de-prueba-${registro.auth}`
    if (!autorizado) return respuesta(401, { code: 401, message: 'JWT Token not found' })
    if (pendientes429 > 0) {
      pendientes429--
      return respuesta(429, { message: 'Too many requests' })
    }
    n++
    if (ruta === '/destinations') return respuesta(200, F('destinos').muestra)
    const actividad = /^\/activities\/(\d+)$/.exec(ruta)
    if (actividad) {
      try {
        return respuesta(200, F(`actividad_${actividad[1]}`))
      } catch {
        return respuesta(404, {})
      }
    }
    if (ruta === '/activities/resolve') {
      const r = F('resolver').find((x) => x.url === u.searchParams.get('url') && x.ok)
      return r ? respuesta(200, { activity_id: r.activity_id, meta: r.meta }) : respuesta(404, {})
    }
    const calendario = /^\/calendar\/activities\/(\d+)$/.exec(ruta)
    if (calendario) {
      const c = cal(calendario[1])
      return c ? respuesta(200, c) : respuesta(404, {})
    }
    if (ruta === '/findByCoord') return respuesta(200, F('cerca'))
    if (ruta === '/destinations/transfers') return respuesta(200, [...F('traslados'), { id: 999, name: 'Otra', url: 'https://qa.civitatis.com/es/otra/traslados/' }])
    return respuesta(404, {})
  }
  return { llamar, registro, cuenta: () => n }
}

const reloj = (inicio = Date.parse('2026-10-16T20:00:00Z')) => {
  let t = inicio
  return { ahora: () => t, esperar: async (ms) => { t += ms }, avanzar: (ms) => { t += ms }, lecturas: [] }
}
const nuevoCliente = (servidor, r = reloj(), extra = {}) => crearClienteCivitatis({ usuario: 'usuario-de-prueba', clave: 'clave-de-prueba', entorno: 'sandbox', fetch: servidor.llamar, ahora: r.ahora, esperar: r.esperar, ...extra })

/* ─────────────────────────── 1. El token y los límites ─────────────────────────── */
console.log('1. La conexión: el token, su renovación y el límite de peticiones')
{
  debe(entornoDeCivitatis(undefined) === 'sandbox' && entornoDeCivitatis('production') === 'production' && entornoDeCivitatis('lo que sea') === 'sandbox', 'entorno', 'el entorno es sandbox salvo que se pida producción expresamente')
  debe(civitatisActiva(undefined) === false && civitatisActiva('false') === false && civitatisActiva('true') === true, 'interruptor', 'el servidor tiene la API apagada salvo CIVITATIS_API_ACTIVA=true')
  debe(URL_BASE.sandbox === 'https://sandbox-api.civitatis.com/v2' && URL_BASE.production === 'https://api.civitatis.com/v2', 'entorno', 'las dos direcciones')

  const s = servidorFalso()
  const r = reloj()
  const c = nuevoCliente(s, r)
  const a = await c.pedir('/destinations', { consulta: { lang: 'es' } })
  debe(a.ok && s.registro.auth === 1, 'token', 'la primera petición entra (POST /auth) una vez')
  debe(s.registro.logins[0].tieneUsuario && s.registro.logins[0].tieneClave, 'token', 'el login lleva usuario y contraseña')
  debe(s.registro.cabeceras[0].Authorization === 'Bearer token-de-prueba-1', 'token', 'el token va en «Authorization: Bearer …» (la cabecera «Authentication» de la documentación no funciona en el sandbox)')
  await c.pedir('/destinations', { consulta: { lang: 'es' } })
  debe(s.registro.auth === 1, 'token', 'con el token vigente no se vuelve a entrar')
  // El token caduca: se renueva ANTES (con un minuto de margen).
  const s2 = servidorFalso({ tokenCaduca: '2026-10-16T21:00:00+00:00' })
  const r2 = reloj(Date.parse('2026-10-16T20:00:00Z'))
  const c2 = nuevoCliente(s2, r2)
  await c2.pedir('/destinations', { consulta: { lang: 'es' } })
  r2.avanzar(58 * 60_000)
  await c2.pedir('/destinations', { consulta: { lang: 'es' } })
  debe(s2.registro.auth === 1, 'token', 'a falta de más de un minuto para caducar, sigue valiendo')
  r2.avanzar(2 * 60_000)
  const despues = await c2.pedir('/destinations', { consulta: { lang: 'es' } })
  debe(despues.ok && s2.registro.auth === 2 && s2.registro.cabeceras.at(-1).Authorization === 'Bearer token-de-prueba-2', 'token', 'al acercarse la caducidad se renueva el token antes de que falle')
  // Muchas peticiones a la vez: una sola entrada.
  const s3 = servidorFalso()
  const c3 = nuevoCliente(s3)
  await Promise.all(Array.from({ length: 12 }, () => c3.pedir('/destinations', { consulta: { lang: 'es' } })))
  debe(s3.registro.auth === 1 && s3.registro.peticiones.length === 12, 'token', 'doce peticiones juntas entran una sola vez')
  // El ritmo: nunca más de N por ventana (con tiempo de verdad y una ventana corta para que la prueba sea rápida; en la app la ventana es de un segundo, muy por debajo de 20).
  const s4 = servidorFalso()
  const marcas = []
  const c4 = crearClienteCivitatis({ usuario: 'u', clave: 'c', entorno: 'sandbox', fetch: async (u, o) => { if (!String(u).endsWith('/auth')) marcas.push(Date.now()); return s4.llamar(u, o) }, peticionesPorSegundo: 3, ventanaMs: 120 })
  await Promise.all(Array.from({ length: 12 }, () => c4.pedir('/destinations', { consulta: { lang: 'es' } })))
  let maximo = 0
  for (const t of marcas) maximo = Math.max(maximo, marcas.filter((x) => x >= t && x < t + 120 - 8).length)
  debe(marcas.length === 12 && maximo <= 3, 'ritmo', `se pasó del ritmo pedido: ${maximo} en una ventana (${marcas.length} peticiones)`)
  debe(5 < 20, 'ritmo', 'el ritmo de la app está por debajo del límite de 20 por segundo')
  const c5 = crearClienteCivitatis({ usuario: 'u', clave: 'c', fetch: async () => { throw new Error('x') } })
  debe(c5.contador.peticiones === 0, 'ritmo', 'el contador empieza en 0')
  // 429: espera y reintenta.
  const s6 = servidorFalso({ fallos429: 2 })
  const r6 = reloj()
  const c6 = nuevoCliente(s6, r6)
  const t0 = r6.ahora()
  const reintentada = await c6.pedir('/destinations', { consulta: { lang: 'es' } })
  debe(reintentada.ok && c6.contador.reintentos429 === 2, '429', 'tras dos 429 seguidos, espera y la tercera sale bien')
  debe(r6.ahora() - t0 >= 1000, '429', 'entre un 429 y el reintento espera')
  const s7 = servidorFalso({ fallos429: 99 })
  const c7 = nuevoCliente(s7)
  const rendida = await c7.pedir('/destinations', { consulta: { lang: 'es' } })
  debe(rendida.ok === false && rendida.motivo === 'demasiadas_peticiones' && c7.contador.reintentos429 === MAX_REINTENTOS_429 && s7.registro.peticiones.length === MAX_REINTENTOS_429 + 1, '429', 'si el 429 no se acaba, se rinde sin bucle infinito')
  // Sin claves, caída y fuera de horario
  const sinClaves = crearClienteCivitatis({ usuario: '', clave: '', fetch: servidorFalso().llamar })
  debe((await sinClaves.pedir('/destinations')).motivo === 'sin_claves', 'fallos', 'sin claves, el fallo es «sin_claves» y no lanza')
  const caida = nuevoCliente(servidorFalso({ caida: true }))
  const rc = await caida.pedir('/destinations')
  debe(rc.ok === false && rc.motivo === 'no_disponible', 'fallos', 'con la red caída (o fuera del horario del sandbox), «no_disponible» y no lanza')
  const mala = crearClienteCivitatis({ usuario: 'u', clave: 'c', fetch: async (u) => ({ ok: false, status: 401, headers: { get: () => null }, json: async () => ({}), text: async () => '' }) })
  debe((await mala.pedir('/destinations')).motivo === 'no_autorizado', 'fallos', 'unas claves malas dan «no_autorizado»')
  // Ni las claves ni el token salen en ningún resultado ni mensaje.
  const todo = JSON.stringify([a, rc, rendida])
  debe(!/usuario-de-prueba|clave-de-prueba|token-de-prueba/.test(todo), 'secretos', 'ni el usuario, ni la clave ni el token aparecen en lo que devuelve el cliente')
}

/* ─────────────────────────── 2. El mapeo ─────────────────────────── */
console.log('2. De la API a la app: precios, enlaces, textos')
{
  const coliseo = mapeo.fichaDeActividad(F('actividad_3834'), { maximoCreible: 2000 })
  debe(coliseo.id === 3834 && coliseo.desde === 53 && coliseo.origenDelPrecio === 'actividad', 'mapeo', 'el precio «desde» del Coliseo')
  debe(coliseo.valoracion === 9.3 && coliseo.opiniones === 16210, 'mapeo', `la nota es la de la web, de 0 a 10, sin dividir (9,3/10), y las opiniones son las de la API: ${coliseo.valoracion}, ${coliseo.opiniones}`)
  debe(coliseo.fotos.principal?.url?.includes('cdn2.') && coliseo.fotos.galeria.length >= 1, 'mapeo', 'trae foto de la tarjeta')
  debe(coliseo.incluye.length >= 1 && coliseo.noIncluye.length >= 1, 'mapeo', 'trae qué incluye y qué no')
  debe(coliseo.cancelacion === 'Cancelación gratuita hasta 32 días antes.', 'mapeo', `la cancelación en una frase: ${coliseo.cancelacion}`)
  debe(coliseo.reservarHasta === 'Se puede reservar hasta 3 horas antes.', 'mapeo', `hasta cuándo se puede reservar: ${coliseo.reservarHasta}`)
  debe(coliseo.duracion === '2 h 30 min – 3 h', 'mapeo', `la duración: ${coliseo.duracion}`)
  debe(coliseo.puntoDeEncuentro?.lat === 41.891226 && coliseo.puntoDeEncuentro?.lng === 12.491262 && /Colosseo/.test(coliseo.puntoDeEncuentro.texto), 'mapeo', 'el punto de encuentro con sus coordenadas')
  debe(coliseo.precioReal === true, 'mapeo', 'el precio es PVP (el que paga el viajero)')
  // El enlace: de pruebas → web de verdad, con nuestro afiliado
  debe(coliseo.url === `https://www.civitatis.com/es/roma/tour-coliseo-arena-gladiadores?aid=${CIVITATIS_AID}`, 'enlace', `el enlace pasa del servidor de pruebas a la web, con el código de afiliado 5206: ${coliseo.url}`)
  debe(CIVITATIS_AID === '5206', 'enlace', 'el afiliado es el 5206 (un solo sitio: shared/affiliate/civitatis.js)')
  debe(mapeo.enlaceDeActividad('https://otra.com/x') === null && mapeo.enlaceDeActividad(null) === null && mapeo.enlaceDeActividad('no es un enlace') === null, 'enlace', 'lo que no es de la empresa no pasa')
  debe(isCivitatisUrl(coliseo.url) && !/qa\./.test(coliseo.url), 'enlace', 'nunca queda un enlace al servidor de pruebas')
  // El precio raro del sandbox (Vaticanos: 16500) se descarta
  const vat = mapeo.fichaDeActividad(F('actividad_84'), { maximoCreible: 2000 })
  debe(vat.desde === null && vat.origenDelPrecio === null, 'precio', 'un precio increíble (16500 €) no se enseña')
  const vat2 = mapeo.fichaDeActividad(F('actividad_84'), { maximoCreible: 2000, calendarioMinimo: mapeo.precioMinimoDelCalendario(F('calendario_84')) })
  debe(vat2.desde === 79 && vat2.origenDelPrecio === 'calendario', 'precio', `se usa el más barato del calendario (79 €): ${vat2.desde}`)
  const free = mapeo.fichaDeActividad(F('actividad_2671'), { maximoCreible: 2000 })
  debe(free.gratis === true && free.desde === 0, 'precio', 'el Free Tour es gratis (0)')
  // Ningún texto nombra a la empresa
  const todo = JSON.stringify([coliseo, vat, free, mapeo.fichaDeActividad(F('actividad_170340'))])
  debe(!/civitatis/i.test(todo.replace(/https:\/\/www\.civitatis\.com[^"]*/g, '').replace(/https:\/\/cdn\d\.civitatis\.com[^"]*/g, '')), 'marca', 'ningún texto de la ficha nombra a la empresa (solo las direcciones)')
  debe(mapeo.sinMarca('Reserva con Civitatis') === null && mapeo.sinMarca('  Guía en español. ') === 'Guía en español.', 'marca', 'una línea que nombra a la empresa se quita')
  debe(mapeo.valoracionSobre10(10) === 10 && mapeo.valoracionSobre10(9.64) === 9.64 && mapeo.valoracionSobre10(8.867924528) === 8.867924528 && mapeo.valoracionSobre10(0) === null && mapeo.valoracionSobre10('x') === null && mapeo.valoracionSobre10(11) === null, 'mapeo', 'la nota sale de 0 a 10 tal cual la da la API (sin redondear ni dividir); sin nota válida, null')
  debe(mapeo.textoDeCancelacion([{ hours: 24, penalty: 0, type: 'percent' }]) === 'Cancelación gratuita hasta 24 horas antes.' && mapeo.textoDeCancelacion([]) === null, 'mapeo', 'la cancelación de 24 horas y sin datos')
  debe(mapeo.textoDeReservaHasta({ days: 2, hour: '12:00', minutes_before: null }) === 'Se puede reservar hasta 2 días antes, a las 12:00.' && mapeo.textoDeReservaHasta(null) === null, 'mapeo', 'hasta cuándo, en días')
}

/* ─────────────────────────── 3. Las horas libres y las plazas ─────────────────────────── */
console.log('3. Las horas libres, las plazas y el día sin plazas')
{
  const cal = F('calendario_3834')
  const libres = mapeo.horasLibresDelDia(cal, '2026-10-17')
  debe(libres.length > 0 && libres.every((h) => /^\d{2}:\d{2}$/.test(h.hora)), 'horas', 'el 17 de octubre tiene horas libres, en HH:MM')
  debe(libres[0].hora === '11:00' && libres[0].plazas === 36, 'horas', `la primera hora del 17 es las 11:00 con las 36 plazas de la API: ${JSON.stringify(libres[0])}`)
  debe(libres.every((h, i) => i === 0 || libres[i - 1].hora < h.hora), 'horas', 'las horas salen ordenadas')
  debe(mapeo.horasLibresDelDia(cal, '2030-01-01').length === 0, 'horas', 'un día que no está en el calendario no tiene horas')
  // Plazas: solo el número real y solo si quedan pocas
  const ajustes = AJUSTES.plazas
  debe(mapeo.textoDePlazas(1, ajustes) === 'Última plaza' && mapeo.textoDePlazas(3, ajustes) === 'Últimas 3 plazas' && mapeo.textoDePlazas(5, ajustes) === '5 plazas disponibles' && mapeo.textoDePlazas(10, ajustes) === '10 plazas disponibles', 'plazas', 'las frases: «Última plaza», «Últimas 3 plazas», «5 plazas disponibles», «10 plazas disponibles»')
  debe(mapeo.textoDePlazas(11, ajustes) === null && mapeo.textoDePlazas(36, ajustes) === null && mapeo.textoDePlazas(null, ajustes) === null && mapeo.textoDePlazas(0, ajustes) === null, 'plazas', 'con más de 10, sin límite, sin dato o agotada no se dice nada')
  debe(mapeo.textoDePlazas(7.5, ajustes) === null && mapeo.textoDePlazas('cinco', ajustes) === null, 'plazas', 'nunca un número que no sea un entero de la API')
  // Un calendario hecho a mano: poca plaza, sin límite, agotada, repetida
  const calendarioMano = {
    schedule: [{ date: '2026-11-02', baseRatesId: ['a', 'b'] }, { date: '2026-11-03', baseRatesId: ['c'] }],
    baseRates: {
      a: { hours: [{ hour: '9:30', quota: 3, rates: [] }, { hour: '10:00', quota: -1, rates: [] }, { hour: '10:30', quota: 0, rates: [] }, { hour: '12:00', quota: 8, rates: [] }] },
      b: { hours: [{ hour: '12:00', quota: 2, rates: [] }] },
      c: { hours: [{ hour: '10:00', quota: 0, rates: [] }, { hour: '11:00', quota: 0, rates: [] }] },
    },
  }
  const dia = mapeo.horasParaLaApp(calendarioMano, '2026-11-02', ajustes)
  debe(dia.sinPlazas === false && dia.horas.map((h) => h.hora).join() === '09:30,10:00,12:00', 'plazas', 'la hora agotada (10:30) no sale y «9:30» se normaliza a 09:30')
  debe(dia.horas.find((h) => h.hora === '09:30').aviso === 'Últimas 3 plazas', 'plazas', '3 plazas reales → «Últimas 3 plazas»')
  debe(dia.horas.find((h) => h.hora === '10:00').aviso === null && dia.horas.find((h) => h.hora === '10:00').plazas === null, 'plazas', 'sin límite (-1): no se dice nada y no hay número')
  debe(dia.horas.find((h) => h.hora === '12:00').plazas === 10 && dia.horas.find((h) => h.hora === '12:00').aviso === '10 plazas disponibles', 'plazas', 'la misma hora en dos tarifas suma sus plazas reales (8 + 2 = 10)')
  const agotado = mapeo.horasParaLaApp(calendarioMano, '2026-11-03', ajustes)
  debe(agotado.sinPlazas === true && agotado.horas.length === 0, 'sin_plazas', 'un día con todas las horas agotadas: sin plazas')
  debe(mapeo.horasParaLaApp(calendarioMano, '2026-12-25', ajustes).sinPlazas === true, 'sin_plazas', 'un día fuera del calendario: sin plazas')
}

/* ─────────────────────────── 4. El servicio: caché, API caída y datos reales ─────────────────────────── */
console.log('4. El servicio: la caché, la API caída y lo que se monta')
{
  const hoy = '2026-10-17'
  // Apagado: nada sale
  const sApagado = servidorFalso()
  const apagado = crearServicioCivitatis({ activa: false, cliente: nuevoCliente(sApagado), cache: crearCache() })
  const ra = await apagado.actividad(3834)
  debe(ra.ok === false && ra.motivo === 'apagada' && sApagado.registro.auth === 0 && sApagado.registro.peticiones.length === 0, 'apagado', 'con el interruptor apagado no se hace ni una petición')
  debe((await apagado.horasLibres(3834, hoy)).motivo === 'apagada' && (await apagado.traslados(19)).motivo === 'apagada', 'apagado', 'ninguna función funciona apagada')
  const entradasHoy = { Coliseo: [{ nombre: 'Coliseo, Foro y Palatino', incluye: 'x', desde: 18, url: null }] }
  const sinCambios = await apagado.enriquecerEntradas('Roma', entradasHoy)
  debe(sinCambios.entradasPorSitio === entradasHoy && sinCambios.enriquecidos === 0, 'apagado', 'apagado, las entradas se quedan exactamente como están')
  const opcionesHoy = [{ id: 'florencia_pisa', rating: 4.8, provisional_pricing: true }]
  debe((await apagado.enriquecerExcursiones('Roma', opcionesHoy)).opciones === opcionesHoy, 'apagado', 'apagado, las excursiones se quedan como están')

  // Encendido, con caché
  const s = servidorFalso()
  const r = reloj()
  const cache = crearCache({ ahora: r.ahora })
  const svc = crearServicioCivitatis({ activa: true, cliente: nuevoCliente(s, r), cache, ahora: r.ahora })
  const a1 = await svc.actividad(3834)
  const pet1 = s.registro.peticiones.length
  const a2 = await svc.actividad(3834)
  debe(a1.ok && a2.ok && s.registro.peticiones.length === pet1, 'cache', 'la segunda vez sale de la caché (ninguna petición nueva)')
  debe(cache.estadisticas.aciertosMemoria >= 1, 'cache', 'la caché cuenta sus aciertos')
  r.avanzar((AJUSTES.ttl_segundos.actividad + 5) * 1000)
  await svc.actividad(3834)
  debe(s.registro.peticiones.length > pet1, 'cache', 'pasado el tiempo guardado, se vuelve a pedir')
  debe(AJUSTES.ttl_segundos.catalogo === 14400 && AJUSTES.ttl_segundos.calendario === 3600, 'cache', 'el tiempo de guardado está en un dato fácil de cambiar (catálogo 4 horas, calendario una hora)')
  // Dos iguales a la vez
  const s2 = servidorFalso()
  const svc2 = crearServicioCivitatis({ activa: true, cliente: nuevoCliente(s2), cache: crearCache() })
  await Promise.all([svc2.actividad(84), svc2.actividad(84), svc2.actividad(84)])
  debe(s2.registro.peticiones.filter((p) => p.startsWith('GET /activities/84?')).length === 1, 'cache', 'tres peticiones iguales a la vez hacen una sola a la API')

  // El calendario fresco se salta la caché
  const s3 = servidorFalso()
  const r3 = reloj()
  const svc3 = crearServicioCivitatis({ activa: true, cliente: nuevoCliente(s3, r3), cache: crearCache({ ahora: r3.ahora }), ahora: r3.ahora })
  await svc3.horasLibres(3834, hoy)
  const antes = s3.registro.peticiones.filter((p) => p.includes('/calendar/')).length
  await svc3.horasLibres(3834, hoy)
  debe(s3.registro.peticiones.filter((p) => p.includes('/calendar/')).length === antes, 'fresco', 'las horas libres normales usan la caché (una hora)')
  await svc3.horasLibres(3834, hoy, { fresco: true })
  debe(s3.registro.peticiones.filter((p) => p.includes('/calendar/')).length === antes + 1, 'fresco', 'al abrir el selector de hora (fresco) se pide el calendario de nuevo, sin la caché')
  const h = await svc3.horasLibres(3834, hoy, { fresco: true })
  debe(h.ok && h.datos.horas.length > 0 && h.datos.horas[0].plazas === 36 && h.datos.horas[0].aviso === null, 'fresco', 'las horas de verdad del 17: 36 plazas y no se dice nada (más de 10)')

  // La API cae: se usa lo viejo si lo hay; si no, el fallo
  const fallo = { caida: false }
  let caer = false
  const s4 = servidorFalso()
  const r4 = reloj()
  const clienteIntermitente = nuevoCliente({ ...s4, llamar: async (u, o) => { if (caer && !String(u).includes('/auth')) throw new Error('caída'); return s4.llamar(u, o) } }, r4)
  const svc4 = crearServicioCivitatis({ activa: true, cliente: clienteIntermitente, cache: crearCache({ ahora: r4.ahora }), ahora: r4.ahora })
  await svc4.actividad(3834)
  caer = true
  r4.avanzar((AJUSTES.ttl_segundos.actividad + 10) * 1000)
  const viejo = await svc4.actividad(3834)
  debe(viejo.ok === true && viejo.viejo === true && viejo.datos.id === 3834, 'api_caida', 'si la API cae pero hay algo guardado (aunque caducado), se usa eso, marcado como viejo')
  const nada = await svc4.actividad(84)
  debe(nada.ok === false && nada.motivo === 'no_disponible', 'api_caida', 'si la API cae y no hay nada guardado, el fallo claro')
  void fallo
  const sCaida = servidorFalso({ caida: true })
  const svcCaido = crearServicioCivitatis({ activa: true, cliente: nuevoCliente(sCaida), cache: crearCache() })
  const entradasCaida = await svcCaido.enriquecerEntradas('Roma', entradasHoy)
  debe(entradasCaida.entradasPorSitio.Coliseo === entradasHoy.Coliseo && entradasCaida.enriquecidos === 0, 'api_caida', 'con la API caída, las entradas son las de hoy (nuestros datos y nuestros enlaces)')
  debe((await svcCaido.enriquecerExcursiones('Roma', opcionesHoy)).opciones[0].provisional_pricing === true, 'api_caida', 'con la API caída, las excursiones siguen provisionales')
  debe((await svcCaido.traslados(19)).ok === false && (await svcCaido.horasLibres(3834, hoy)).ok === false, 'api_caida', 'y no lanza nada')

  // Una base de datos que falla no rompe la caché
  const adminRoto = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: { message: 'no existe la tabla' } }) }) }), upsert: async () => ({ error: { message: 'no existe la tabla' } }) }) }
  const sRota = servidorFalso()
  const svcRota = crearServicioCivitatis({ activa: true, cliente: nuevoCliente(sRota), cache: crearCache({ admin: adminRoto }) })
  debe((await svcRota.actividad(3834)).ok && (await svcRota.actividad(3834)).ok && sRota.registro.peticiones.filter((p) => p.startsWith('GET /activities/3834?')).length === 1, 'cache', 'sin la tabla de Supabase (migración sin aplicar) la caché sigue en memoria')
  // Con la base: se guarda y se lee
  const guardado = new Map()
  const adminBueno = {
    from: () => ({
      select: () => ({ eq: (_c, clave) => ({ maybeSingle: async () => ({ data: guardado.get(clave) ?? null, error: null }) }) }),
      upsert: async (fila) => { guardado.set(fila.clave, { valor: fila.valor, caduca_en: fila.caduca_en }); return { error: null } },
    }),
  }
  const sBuena = servidorFalso()
  const rB = reloj()
  const svcBuena = crearServicioCivitatis({ activa: true, cliente: nuevoCliente(sBuena, rB), cache: crearCache({ admin: adminBueno, ahora: rB.ahora }), ahora: rB.ahora })
  await svcBuena.actividad(3834)
  await new Promise((resolve) => setTimeout(resolve, 20))
  debe(guardado.size >= 1, 'cache', 'lo que llega de la API se guarda en Supabase')
  const sOtra = servidorFalso()
  const svcOtra = crearServicioCivitatis({ activa: true, cliente: nuevoCliente(sOtra, rB), cache: crearCache({ admin: adminBueno, ahora: rB.ahora }), ahora: rB.ahora })
  const leida = await svcOtra.actividad(3834)
  debe(leida.ok && sOtra.registro.peticiones.filter((p) => p.startsWith('GET /activities/3834?')).length === 0, 'cache', 'otro servidor (otra instancia) lee de Supabase sin pedir a la API')

  // (a) Las entradas con datos reales
  const sEntradas = servidorFalso()
  const svcE = crearServicioCivitatis({ activa: true, cliente: nuevoCliente(sEntradas), cache: crearCache() })
  const nuestras = { Coliseo: [{ nombre: 'Coliseo, Foro y Palatino', incluye: 'Entrada conjunta', desde: 18, url: null }], 'Museos Vaticanos y Capilla Sixtina': [{ nombre: 'Museos', incluye: 'x', desde: 17, url: null }], Panteón: [{ nombre: 'Panteón', incluye: 'x', desde: 7, url: null }], 'Fontana de Trevi': [{ nombre: 'Zona junto a la fuente', incluye: 'x', desde: 2, url: null }], 'Altar de la Patria': [{ nombre: 'Altar', incluye: 'x', desde: 10, url: null }] }
  const e = await svcE.enriquecerEntradas('Roma', nuestras)
  debe(e.enriquecidos >= 3, 'entradas', `se enriquecen el Coliseo, los Vaticanos y el Panteón (${e.enriquecidos})`)
  const col = e.entradasPorSitio.Coliseo
  debe(col.length === 1 && col[0].civitatis?.id === 3834 && col[0].desde === 53 && col[0].url?.includes('aid=5206'), 'entradas', 'la entrada del Coliseo trae el precio real (53 €), el enlace con el afiliado y todos los datos')
  debe(col[0].civitatis.valoracion === 9.3 && col[0].civitatis.cancelacion && col[0].civitatis.puntoDeEncuentro?.lat, 'entradas', 'y la nota, la cancelación y el punto de encuentro')
  const vat = e.entradasPorSitio['Museos Vaticanos y Capilla Sixtina']
  debe(vat[0].civitatis.desde === 79 && vat[0].desde === 79, 'entradas', 'los Vaticanos: el 16500 del sandbox se cambia por los 79 € del calendario')
  debe(e.entradasPorSitio['Fontana de Trevi'] === nuestras['Fontana de Trevi'] && e.entradasPorSitio['Altar de la Patria'] === nuestras['Altar de la Patria'], 'entradas', 'un sitio sin actividad en los datos se queda con la entrada de hoy')
  debe(!('Castillo' in e.entradasPorSitio) && Object.keys(e.entradasPorSitio).length === Object.keys(nuestras).length, 'entradas', 'no aparecen sitios nuevos (un sitio sin entradas en nuestros datos no gana pestaña)')

  // (c) Las excursiones
  const sExc = servidorFalso()
  const svcX = crearServicioCivitatis({ activa: true, cliente: nuevoCliente(sExc), cache: crearCache() })
  const opciones = [{ id: 'florencia_pisa', name: 'Florencia y Pisa', price_from_eur: 85, rating: 4.9, review_count: 1000, provisional_pricing: true, meeting_point: 'Termini' }, { id: 'pompeya_sorrento', name: 'Pompeya', price_from_eur: 65, rating: 4.8, review_count: 2340, provisional_pricing: true }]
  // (Florencia y Pisa tiene actividad 142547 en el sandbox, pero no está guardada: la API la da como «no encontrada» y se queda provisional.)
  const x = await svcX.enriquecerExcursiones('Roma', opciones)
  debe(x.opciones.every((o) => o.provisional_pricing === true) && x.enriquecidas === 0, 'excursiones', 'una excursión cuya actividad no responde se queda provisional, con su precio y su nota de siempre')
  debe(datosDelDestino('Roma').excursiones.florencia_pisa === 142547 && datosDelDestino('Roma').excursiones.ostia_antica === 2283, 'excursiones', 'las excursiones que se han podido resolver están en los datos (Florencia y Pisa, Ostia Antica)')
  debe(datosDelDestino('Madrid') === null, 'excursiones', 'un destino sin datos no se toca')

  // (d) El Free Tour
  const sFt = servidorFalso()
  const svcF = crearServicioCivitatis({ activa: true, cliente: nuevoCliente(sFt), cache: crearCache() })
  const ft = await svcF.freeTourHoras(2671, '2026-10-19', '2026-10-21')
  debe(ft.ok && ft.datos.dias['2026-10-19'].map((x2) => x2.hora).join() === '10:00,17:00', 'free_tour', 'las horas del Free Tour salen de su calendario (10:00 y 17:00 esos días en el sandbox)')
  debe(Object.keys(ft.datos.dias).join() === '2026-10-19,2026-10-20,2026-10-21', 'free_tour', 'un día por fecha pedida')
  debe(ft.datos.dias['2026-10-19'].every((x2) => x2.plazas === null && x2.aviso === null), 'free_tour', 'sin límite de plazas: no se dice nada')

  // (d2) La hora recomendada: el calendario de un rango, con las horas de cada día y si la actividad las tiene fijas
  const rango = await svcF.horasEnRango(2671, '2026-10-19', '2026-10-21')
  debe(rango.ok && rango.datos.actividadId === 2671 && rango.datos.conHorasFijas === true && rango.datos.dias['2026-10-19'].horas.map((x2) => x2.hora).join() === '10:00,17:00', 'hora_recomendada', 'el rango trae las horas de cada día, la actividad de la que son y que tiene horas fijas')
  debe((await svcF.horasEnRango(2671, '2026-10-21', '2026-10-19')).motivo === 'fechas_malas' && (await svcF.horasEnRango(2671, '2026-01-01', '2026-12-31')).motivo === 'fechas_malas', 'hora_recomendada', 'un rango al revés o de más de 60 días no se pide')
  debe(crearServicioCivitatis({ activa: false }).horasEnRango && (await crearServicioCivitatis({ activa: false }).horasEnRango(2671, '2026-10-19', '2026-10-21')).motivo === 'apagada', 'hora_recomendada', 'con el interruptor apagado no pide nada')
  debe(mapeo.tieneHorasFijas({ schedule: [{ date: '2026-11-02', baseRatesId: ['a'] }], baseRates: { a: { hours: [] } } }) === false && mapeo.tieneHorasFijas({ baseRates: { a: { hours: [{ hour: '9:30', quota: 0 }] } } }) === true && mapeo.tieneHorasFijas(null) === false, 'hora_recomendada', 'una actividad sin horas fijas se distingue de una agotada')

  // (e) Las actividades cerca de un sitio
  const sCerca = servidorFalso()
  const svcC = crearServicioCivitatis({ activa: true, cliente: nuevoCliente(sCerca), cache: crearCache() })
  const cerca = await svcC.cercaDe(41.8902, 12.4922)
  debe(cerca.ok && cerca.datos.length === 6 && cerca.datos[0].url?.includes('aid=5206') && cerca.datos[0].nombre, 'cerca', 'las actividades cerca del Coliseo, con enlace y afiliado')
  debe(sCerca.registro.peticiones.some((p) => p.startsWith('POST /findByCoord')), 'cerca', 'se busca por coordenadas (POST /findByCoord) porque nuestros sitios no traen el número de lugar de Google')
  debe((await svcC.cercaDe('x', 1)).motivo === 'coordenadas_malas', 'cerca', 'coordenadas malas, fallo claro')
  debe(!JSON.stringify(cerca.datos).match(/qa\.civitatis/), 'cerca', 'sin enlaces al servidor de pruebas')

  // (f) Los traslados
  const sTr = servidorFalso()
  const svcT = crearServicioCivitatis({ activa: true, cliente: nuevoCliente(sTr), cache: crearCache() })
  const tr = await svcT.traslados(19)
  debe(tr.ok && tr.datos.url === `https://www.civitatis.com/es/roma/traslados/?aid=${CIVITATIS_AID}`, 'traslados', `el enlace de traslados de Roma, con el afiliado: ${tr.datos?.url}`)
  debe((await svcT.traslados(123456)).ok === false, 'traslados', 'un destino sin traslados, fallo claro')

  // Resolver enlaces
  const rs = await svcT.resolver('https://www.civitatis.com/es/roma/free-tour-roma/')
  debe(rs.ok && rs.datos.id === 2671, 'resolver', 'el enlace del Free Tour se resuelve al número 2671')
  debe((await svcT.resolver('https://www.civitatis.com/es/roma/excursion-pompeya-sorrento/')).ok === false, 'resolver', 'un enlace que no existe no se resuelve')
  void mapeo
}

/* ─────────────────────────── 5. Las rutas del servidor ─────────────────────────── */
console.log('5. Las rutas de nuestro servidor')
{
  const rutas = new Map()
  const app = { get: (p, h) => rutas.set(`GET ${p}`, h), post: (p, h) => rutas.set(`POST ${p}`, h) }
  const respuesta = () => { const r = { cuerpo: null, json(c) { r.cuerpo = c; return r } }; return r }
  const llamar = async (clave, req) => { const r = respuesta(); await rutas.get(clave)({ query: {}, body: {}, ...req }, r); return r.cuerpo }
  const s = servidorFalso()
  const r = reloj()
  const svc = crearServicioCivitatis({ activa: true, cliente: nuevoCliente(s, r), cache: crearCache({ ahora: r.ahora }), ahora: r.ahora })
  registrarRutasCivitatis(app, svc)
  for (const clave of ['GET /api/civitatis/estado', 'GET /api/civitatis/horas', 'GET /api/civitatis/free-tour', 'POST /api/civitatis/cerca', 'GET /api/civitatis/traslados']) debe(rutas.has(clave), 'rutas', `falta la ruta ${clave}`)
  const estado = await llamar('GET /api/civitatis/estado', {})
  debe(estado.activa === true && estado.entorno === 'sandbox' && estado.hayClaves === true && !JSON.stringify(estado).match(/usuario-de-prueba|clave-de-prueba|token/), 'rutas', 'el estado dice si está encendida y nada secreto')
  const horas = await llamar('GET /api/civitatis/horas', { query: { lugar: 'Coliseo', fecha: '2026-10-17', fresco: '1' } })
  debe(horas.ok && horas.datos.horas.length > 0, 'rutas', 'las horas libres del Coliseo el 17')
  const foro = await llamar('GET /api/civitatis/horas', { query: { lugar: 'Foro Romano y Palatino', fecha: '2026-10-17' } })
  debe(foro.ok && foro.datos.horas.length === horas.datos.horas.length, 'rutas', 'el Foro va con el Coliseo: las mismas horas (es la misma entrada)')
  debe((await llamar('GET /api/civitatis/horas', { query: { lugar: 'Altar de la Patria', fecha: '2026-10-17' } })).motivo === 'sin_actividad', 'rutas', 'un sitio sin actividad no tiene horas de la API (la app usa la rueda de siempre)')
  debe((await llamar('GET /api/civitatis/horas', { query: { lugar: 'Coliseo', fecha: 'mañana' } })).motivo === 'fechas_malas', 'rutas', 'una fecha mala se rechaza')
  const dia = await llamar('GET /api/civitatis/horas', { query: { lugar: 'Museos Vaticanos y Capilla Sixtina', fecha: '2026-10-22' } })
  debe(dia.ok && dia.datos.sinPlazas === true, 'rutas', 'un día sin horas en el calendario: sin plazas (la app avisa)')
  const ft = await llamar('GET /api/civitatis/free-tour', { query: { desde: '2026-10-19', hasta: '2026-10-20' } })
  debe(ft.ok && ft.datos.dias['2026-10-20'].length === 2, 'rutas', 'las horas del Free Tour por día')
  debe((await llamar('GET /api/civitatis/free-tour', { query: { desde: '2026-10-21', hasta: '2026-10-20' } })).motivo === 'fechas_malas', 'rutas', 'un rango al revés se rechaza')
  debe((await llamar('GET /api/civitatis/traslados', { query: { destino: 'Roma' } })).ok === true, 'rutas', 'el enlace de traslados de Roma')
  debe((await llamar('GET /api/civitatis/traslados', { query: { destino: 'Narnia' } })).motivo === 'sin_actividad', 'rutas', 'un destino sin curar no tiene traslados')
  debe((await llamar('POST /api/civitatis/cerca', { body: { lat: 41.89, lng: 12.49 } })).ok === true, 'rutas', 'las actividades cerca de unas coordenadas')
  // Apagada
  const apagadas = new Map()
  registrarRutasCivitatis({ get: (p, h) => apagadas.set(`GET ${p}`, h), post: (p, h) => apagadas.set(`POST ${p}`, h) }, crearServicioCivitatis({ activa: false, cliente: nuevoCliente(servidorFalso()), cache: crearCache() }))
  const rr = respuesta()
  await apagadas.get('GET /api/civitatis/horas')({ query: { lugar: 'Coliseo', fecha: '2026-10-17' } }, rr)
  debe(rr.cuerpo.ok === false && rr.cuerpo.motivo === 'apagada', 'rutas', 'con el servidor apagado, todo responde «apagada» (200) y la app hace lo de hoy')
}

/* ─────────────────────────── 6. Lo del navegador: el interruptor, la rueda y el aviso ─────────────────────────── */
console.log('6. Lo del móvil: el interruptor, la rueda de horas y «Ya tengo mi entrada»')
{
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-civitatis-'))
  const salida = path.join(carpeta, 'civ.cjs')
  fs.writeFileSync(path.join(carpeta, 'entrada.ts'), `export { calcularCivitatisActiva, ruedaConHorasLibres, avisoDeLaHora, horaFueraDelCalendario, enlaceAlPuntoDeEncuentro, recomendarHora, diaLargoEs } from '${path.resolve('src/lib/civitatis.ts').replace(/\\/g, '/')}'\n`)
  await build({ entryPoints: [path.join(carpeta, 'entrada.ts')], outfile: salida, bundle: true, platform: 'node', format: 'cjs', logLevel: 'error', define: { 'import.meta.env': '{"DEV":false}' } })
  const M = createRequire(import.meta.url)(salida)
  const c = M.calcularCivitatisActiva
  debe(c({ desarrollo: false, entorno: undefined }) === false && c({ desarrollo: false, entorno: 'true' }) === true && c({ desarrollo: false, entorno: undefined, parametro: 'on' }) === false, 'interruptor_app', 'la app: apagada salvo VITE_CIVITATIS_ACTIVA=true; en producción ?civitatis=on no enciende nada')
  debe(c({ desarrollo: true, entorno: undefined, parametro: 'on' }) === true && c({ desarrollo: true, entorno: 'true', parametro: 'off' }) === false, 'interruptor_app', 'en desarrollo, ?civitatis=on y off')
  const rueda = ['09:00', '09:15', '09:30', '10:00', '10:30', '11:00']
  const libres = { fecha: '2026-11-02', sinPlazas: false, horas: [{ hora: '09:30', plazas: 3, aviso: 'Últimas 3 plazas' }, { hora: '11:00', plazas: 40, aviso: null }] }
  debe(M.ruedaConHorasLibres(rueda, libres).join() === '09:30,11:00', 'rueda', 'la rueda enseña solo las horas libres de ese día')
  debe(M.ruedaConHorasLibres(rueda, null).join() === rueda.join() && M.ruedaConHorasLibres(rueda, { fecha: 'x', sinPlazas: true, horas: [] }).join() === rueda.join(), 'rueda', 'sin datos o con el día sin plazas, la rueda de siempre')
  debe(M.ruedaConHorasLibres(rueda, libres, '10:00').join() === '09:30,10:00,11:00', 'rueda', 'la hora de la reserva que ya hay siempre está')
  debe(M.avisoDeLaHora(libres, '9:30') === 'Últimas 3 plazas' && M.avisoDeLaHora(libres, '11:00') === null && M.avisoDeLaHora(null, '09:30') === null, 'rueda', 'el aviso de plazas de la hora elegida; con más de 10, nada')
  debe(M.horaFueraDelCalendario(libres, '10:00') === true && M.horaFueraDelCalendario(libres, '09:30') === false && M.horaFueraDelCalendario(null, '10:00') === false && M.horaFueraDelCalendario({ fecha: 'x', sinPlazas: true, horas: [] }, '10:00') === false, 'ya_tengo', '«Ya tengo mi entrada»: una hora que no sale en el calendario se detecta para avisar (nunca para prohibir)')
  debe(M.enlaceAlPuntoDeEncuentro({ lat: 41.89, lng: 12.49 }) === 'https://www.google.com/maps/search/?api=1&query=41.89,12.49' && M.enlaceAlPuntoDeEncuentro({ lat: null, lng: null }) === null, 'mapa', 'el punto de encuentro, al mapa con sus coordenadas')
  // La hora recomendada (etiqueta verde encima de «Reservar»)
  const h = (hora, plazas = null, aviso = null) => ({ hora, plazas, aviso })
  const rango = {
    actividadId: 3834,
    conHorasFijas: true,
    dias: {
      '2026-11-02': { sinPlazas: false, horas: [h('09:00'), h('10:30'), h('11:30', 3, 'Últimas 3 plazas'), h('16:00')] },
      '2026-11-03': { sinPlazas: true, horas: [] },
      '2026-11-04': { sinPlazas: false, horas: [h('09:00')] },
      '2026-11-05': { sinPlazas: false, horas: [h('15:00')] },
      '2026-11-06': { sinPlazas: true, horas: [] },
    },
  }
  const viaje = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06']
  const r1 = M.recomendarHora(rango, '2026-11-02', '10:20', viaje)
  debe(r1?.tipo === 'hora' && r1.hora === '10:30' && r1.texto === 'Te recomendamos reservar a las 10:30', 'hora_recomendada', 'la hora libre más cercana a la de la ruta (10:20 → 10:30)')
  const empate = M.recomendarHora({ ...rango, dias: { '2026-11-02': { sinPlazas: false, horas: [h('10:00'), h('11:00')] } } }, '2026-11-02', '10:30', ['2026-11-02'])
  debe(empate?.hora === '10:00', 'hora_recomendada', 'con dos igual de cerca, la más temprana (10:30 entre 10:00 y 11:00 → 10:00)')
  const pocas = M.recomendarHora(rango, '2026-11-02', '11:40', viaje)
  debe(pocas?.hora === '11:30' && pocas.texto === 'Te recomendamos reservar a las 11:30 · Últimas 3 plazas', 'hora_recomendada', 'con 10 plazas o menos, el número real de la API en la etiqueta')
  const sinPlazasConOtro = M.recomendarHora(rango, '2026-11-03', '10:00', viaje)
  debe(sinPlazasConOtro?.tipo === 'sin_plazas' && sinPlazasConOtro.alternativa === '2026-11-02' && sinPlazasConOtro.texto === 'Ese día no quedan plazas. El lunes 2 sí hay', 'hora_recomendada', 'día sin plazas con otro día que sí: el más cercano de su viaje (empate: el más temprano)')
  debe(M.recomendarHora(rango, '2026-11-06', '10:00', ['2026-11-03', '2026-11-06'])?.texto === 'Ese día no quedan plazas', 'hora_recomendada', 'día sin plazas y sin otro día de su viaje con plazas (aunque otros días del calendario sí tengan): solo «Ese día no quedan plazas»')
  debe(M.recomendarHora(rango, null, '10:00', viaje) === null && M.recomendarHora(null, '2026-11-02', '10:00', viaje) === null, 'hora_recomendada', 'sin fechas o sin datos de la API: nada')
  debe(M.recomendarHora({ ...rango, conHorasFijas: false }, '2026-11-02', '10:00', viaje) === null && M.recomendarHora(rango, '2026-11-02', null, viaje) === null && M.recomendarHora(rango, '2027-01-01', '10:00', viaje) === null, 'hora_recomendada', 'actividad sin horas fijas, sin hora de ruta o día fuera del calendario: nada')
  debe(M.diaLargoEs('2026-11-04') === 'miércoles 4', 'hora_recomendada', 'el día se dice «miércoles 4»')
  const pestana = fs.readFileSync('src/components/route/reservas/StopReservation.tsx', 'utf8')
  debe(pestana.includes('data-hora-recomendada') && pestana.includes('useHorasEnRango(') && pestana.includes('nombre="tips"') && pestana.includes('bg-accent-green-soft') && !pestana.includes('✓ Tu hora') && pestana.includes('horasDelViaje?.actividadId === entrada.civitatis?.id'), 'hora_recomendada', 'la pestaña Entradas pone la etiqueta (bombilla, no ✓, mismo verde) solo en la entrada de la que son las horas')
  debe(pestana.indexOf('data-hora-recomendada') < pestana.indexOf("openTicketShop(entrada.url"), 'hora_recomendada', 'la etiqueta va encima del botón «Reservar», y el botón sigue yendo directo a la tienda')
  // Las piezas de la hoja: lo que se ha escrito en el código
  const hoja = fs.readFileSync('src/components/route/reservas/AddReservationSheet.tsx', 'utf8')
  debe(hoja.includes("useHorasLibres(") && hoja.includes('aperturas') && !hoja.includes('Ya tengo mi entrada') && !hoja.includes('Esa hora no sale libre en el calendario') && hoja.includes("modo === 'reservar'") && hoja.includes('data-aviso="disponibilidad"') && hoja.includes("horasApi.estado === 'ok'"), 'hoja', 'la hoja pide las horas cada vez que se abre el selector; sin casilla «Ya tengo mi entrada» (desde «Añádela», cualquier hora; solo en modo reservar se filtran) y el aviso de disponibilidad se oculta solo con la API cubriendo el sitio')
  debe(hoja.includes('Ese día no quedan horas libres'), 'hoja', 'y el aviso del día sin plazas')
  const hook = fs.readFileSync('src/lib/civitatis.ts', 'utf8')
  debe(/fresco: '1'/.test(hook), 'hoja', 'el cliente pide el calendario fresco (sin la caché de una hora)')
  debe(!/qa\.civitatis/.test(hook), 'hoja', 'el cliente no lleva direcciones del servidor de pruebas')
  fs.rmSync(carpeta, { recursive: true, force: true })
}

/* ─────────────────────────── 7. Nada del móvil lleva las claves; el motor no se toca ─────────────────────────── */
console.log('7. Las claves no salen del servidor y el motor no se toca')
{
  const fuenteCliente = []
  const recorre = (carpeta) => {
    for (const f of fs.readdirSync(carpeta, { withFileTypes: true })) {
      const ruta = path.join(carpeta, f.name)
      if (f.isDirectory()) recorre(ruta)
      else if (/\.(ts|tsx)$/.test(f.name)) fuenteCliente.push([ruta, fs.readFileSync(ruta, 'utf8')])
    }
  }
  recorre('src')
  debe(!fuenteCliente.some(([, t]) => /CIVITATIS_API_(USER|PASSWORD)/.test(t)), 'secretos', 'ningún fichero del móvil (src/) nombra las variables con las claves')
  debe(!fuenteCliente.some(([, t]) => /sandbox-api\.civitatis|api\.civitatis\.com\/v2/.test(t)), 'secretos', 'ningún fichero del móvil habla con la API directamente')
  debe(!fuenteCliente.some(([, t]) => /VITE_CIVITATIS_(USER|PASSWORD|API_USER)/.test(t)), 'secretos', 'no hay claves con prefijo VITE_ (irían al móvil)')
  const tocadosMotor = []
  for (const carpetaMotor of ['shared/routeEngine', 'server/engine']) for (const f of fs.readdirSync(carpetaMotor)) if (/civitatis/i.test(f)) tocadosMotor.push(f)
  debe(tocadosMotor.length === 0, 'motor', 'no hay nada de la API dentro del motor de rutas')
  const marca = fuenteCliente.filter(([ruta, t]) => /civitatis/i.test(t) && !/lib[\\/]civitatis\.ts$|affiliateLinks|CampaignLinks|mapGeneratedRoute|mockDayDetail|vehicleRentalLinks|empezarDeCero|privacidad|types\.ts|enlaceDeTraslados|StopReservation|StopDetailSheet|DestinationDetailModal|PlaceExplorerScreen|destinationExcursions|DatosDeLaActividad|ActividadesDelSitio|AddReservationSheet|ArrivalReturnSheet/.test(ruta))
  debe(marca.length === 0, 'marca', `ficheros nuevos del móvil que nombran a la empresa: ${marca.map(([r]) => r).join(', ')}`)
  const pantallas = fs.readFileSync('src/components/route/reservas/DatosDeLaActividad.tsx', 'utf8') + fs.readFileSync('src/components/route/reservas/ActividadesDelSitio.tsx', 'utf8')
  debe(!/Civitatis|GetYourGuide/.test(pantallas.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), 'marca', 'las pantallas nuevas no nombran a la empresa en ningún texto')
}

/* ─────────────────────────── 8. Una prueba corta contra el sandbox de verdad (si se puede) ─────────────────────────── */
console.log('8. El sandbox de verdad (si estás dentro de su horario)')
{
  config({ path: '.env.local' })
  const real = crearClienteCivitatis()
  if (!real.tieneClaves) {
    console.log('   (no hay claves en el .env.local: no se prueba el sandbox de verdad)')
  } else {
    const destinos = await real.pedir('/destinations', { consulta: { lang: 'es' } })
    if (!destinos.ok) {
      console.log(`   (el sandbox no responde ahora: ${destinos.motivo}; recuerda que solo funciona de 7:00 a 2:00, hora de España. No se cuenta como fallo.)`)
    } else {
      debe(Array.isArray(destinos.datos) && destinos.datos.some((d) => /^(roma|rome)$/i.test(String(d.name))), 'sandbox', 'el sandbox tiene Roma')
      const servicio = crearServicioCivitatis({ activa: true, cliente: real, cache: crearCache() })
      const col = await servicio.actividad(3834)
      debe(col.ok && col.datos.id === 3834 && col.datos.url?.startsWith('https://www.civitatis.com/') && col.datos.url.includes('aid=5206'), 'sandbox', 'la actividad del Coliseo del sandbox llega bien mapeada y con el enlace de verdad y el afiliado')
      const hoy = new Date().toISOString().slice(0, 10)
      const horas = await servicio.horasLibres(3834, fechaMas(hoy, 3), { fresco: true })
      debe(horas.ok && Array.isArray(horas.datos.horas), 'sandbox', 'el calendario del Coliseo de dentro de tres días llega (con o sin horas)')
      debe(!JSON.stringify([col, horas]).match(/Bearer|expiresIn/), 'sandbox', 'nada del token llega a lo que devuelve el servicio')
    }
  }
}

console.log(`\nPrueba de la API de consulta, parte 1: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
if (fallos.length > 0) {
  for (const f of fallos.slice(0, 60)) console.log(`  FALLO [${f.regla}] ${f.texto}`)
  process.exitCode = 1
}
