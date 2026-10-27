// La prueba de la Tanda 10P, parte C: +200 EXP por invitar a un amigo (1.5), el sorteo (1.6) y el perfil con su pasaporte (1.8). No toca el motor de rutas.
//   node scripts/destino/pruebaTanda10P_sorteo.mjs
//
// 1. Las reglas puras: «la mitad de los días con HOY» (una sola función para el amigo y el sorteo), el tope de 5 amigos al año, la edición del sorteo y su cierre del 31 de agosto.
// 2. Los datos: exp.json (200 EXP, 5 amigos, la regla nueva del sorteo y sus datos en un solo sitio, sin enlace de bases).
// 3. El servicio de verdad sobre un Postgres de prueba (PGlite) con las migraciones reales (la 0034 incluida): el amigo que completa su primer viaje con HOY da +200 EXP una sola vez (no si no llega a la
//    mitad de los días, ni el sexto del año, ni dos veces el mismo), con su aviso en la campana; el sorteo con sus tres estados, el aviso dorado una sola vez, el cierre del 31 de agosto, el panel de Eric;
//    el Perfil y el pasaporte salen del mismo sitio (los mismos números).
// 4. El código: ninguna cifra, año, destino ni premio escritos en el cerebro ni en las pantallas del sorteo.
// 5. La pantalla (hace falta Vite en APP_URL, por defecto http://localhost:5183 con API_TARGET apuntando a un servidor; sin él se salta): el billete en sus tres estados, la página (sin [Bases legales] sin enlace),
//    el aviso dorado de la campana, el Perfil sin el mapa suelto y con la tarjeta del pasaporte como P1, y dentro «Pasaporte de {nombre}» con el mapa grande. Capturas en docs/dias/capturas_jutrip/.
import fs from 'node:fs'
import { crearBaseDePrueba } from './_baseDeDatosPrueba.mjs'
import { crearRepoPG } from './_repoLogrosPG.mjs'
import { cargarCatalogo, cargarDatos, coordenadasDeSitio } from '../../server/logros/datos.js'
import { crearServicioLogros } from '../../server/logros/servicio.js'
import { registrarRutasLogros } from '../../server/logros/rutas.js'
import * as E from '../../server/logros/exp.js'
import { textoDelAviso } from '../../shared/avisos/textos.js'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

const datos = cargarDatos()
const tabla = datos.exp
const catalogo = cargarCatalogo('roma')
const catalogos = { roma: catalogo }
const nombreDe = (id) => catalogo.places.find((p) => p.id === id).name
const coords = (id) => coordenadasDeSitio(catalogos, 'roma', id)

/* ─────────────────────────── 1. Las reglas puras ─────────────────────────── */
console.log('1. Las reglas puras')
{
  const c = E.cumpleMitadDeDias
  debe(c(2, 1) && c(4, 2) && c(5, 3) && c(3, 2) && c(1, 1) && c(6, 3) && c(7, 4), 'mitad', 'la mitad de los días redondeando hacia arriba: 1 de 2, 2 de 4, 3 de 5, 2 de 3, 1 de 1, 3 de 6, 4 de 7 cumplen')
  debe(!c(5, 2) && !c(3, 1) && !c(4, 1) && !c(7, 3) && !c(2, 0) && !c(0, 0) && !c(0, 1), 'mitad', '2 de 5, 1 de 3, 1 de 4, 3 de 7, 0 de 2 y un viaje de 0 días no cumplen')
  // El tope de amigos al año: solo los 5 primeros de cada año dan EXP.
  const amigos = Array.from({ length: 7 }, (_, i) => ({ invitado: `u${i}`, viaje_acabado_en: `2026-0${1 + i}-15T10:00:00Z` }))
  debe([0, 1, 2, 3, 4].every((i) => E.invitacionDaExp(amigos, `u${i}`, tabla)) && !E.invitacionDaExp(amigos, 'u5', tabla) && !E.invitacionDaExp(amigos, 'u6', tabla), 'tope', 'de 7 amigos del mismo año, solo los 5 primeros dan EXP (el sexto y el séptimo, no)')
  debe(E.invitacionDaExp([...amigos.slice(0, 5), { invitado: 'otro', viaje_acabado_en: '2027-01-10T10:00:00Z' }], 'otro', tabla), 'tope', 'el tope es por año: el primer amigo del año siguiente vuelve a dar EXP')
  debe(!E.invitacionDaExp([{ invitado: 'x', viaje_acabado_en: null }], 'x', tabla), 'tope', 'un amigo que no ha completado su viaje no da EXP')
  const r7 = E.calcularExp({ datos, items: new Map(), hechos: [], viajes: {}, ahora: new Date('2026-12-31'), referidos: amigos })
  debe(r7.total === 5 * tabla.invitacion.exp && r7.entradas.every((x) => x.exp === tabla.invitacion.exp), 'tope', `7 amigos en un año suman 5 x ${tabla.invitacion.exp} EXP, no 7 x`)
  // El nivel conseguido hasta el cierre: lo ganado después del 31 de agosto no cuenta para esa edición.
  const ed = E.edicionDeAnio(tabla, 2027)
  const v = [{ trip_id: 't', fin: '2027-08-20', dias: 4, dias_con_hoy: 2, cumple: true }]
  const antes = E.entradaEnEdicion({ tabla, edicion: ed, entradas: [{ fecha: '2027-08-30', exp: 1000 }, { fecha: '2027-09-02', exp: 500 }], expActual: 1500, viajes: v, hoy: '2027-09-05' })
  const dentro = E.entradaEnEdicion({ tabla, edicion: ed, entradas: [{ fecha: '2027-08-30', exp: 1000 }, { fecha: '2027-08-31', exp: 500 }], expActual: 1500, viajes: v, hoy: '2027-09-05' })
  debe(antes.exp === 1000 && antes.nivel < tabla.sorteo.nivel_minimo && !antes.entra, 'cierre', 'cerrada la edición, el nivel que cuenta es el conseguido hasta el 31 de agosto: 1.000 EXP (nivel 2) no entra aunque ahora tenga 1.500')
  debe(dentro.exp === 1500 && dentro.entra, 'cierre', 'con 1.500 EXP ganadas hasta el 31 de agosto (nivel 3) y un viaje con HOY, entra')
  const tarde = E.entradaEnEdicion({ tabla, edicion: ed, entradas: [{ fecha: '2027-08-31', exp: 1500 }], expActual: 1500, viajes: [{ trip_id: 't', fin: '2027-09-01', dias: 4, dias_con_hoy: 2, cumple: true }], hoy: '2027-09-05' })
  const enElCierre = E.entradaEnEdicion({ tabla, edicion: ed, entradas: [{ fecha: '2027-08-31', exp: 1500 }], expActual: 1500, viajes: [{ trip_id: 't', fin: '2027-08-31', dias: 4, dias_con_hoy: 2, cumple: true }], hoy: '2027-09-05' })
  debe(!tarde.entra && enElCierre.entra, 'cierre', 'un viaje acabado el 1 de septiembre de 2027 ya no cuenta para el de 2027; uno acabado el 31 de agosto, sí')
  const v28 = E.ventanaDeViajes(tabla, E.edicionDeAnio(tabla, 2028))
  debe(E.ventanaDeViajes(tabla, ed).desde === null && v28.desde === '2027-09-01' && v28.hasta === '2028-08-31', 'cierre', `la primera edición cuenta desde siempre; las siguientes, del 1 de septiembre al 31 de agosto (${v28.desde} a ${v28.hasta})`)
  debe(E.edicionVigente(tabla, '2027-09-05').anio === 2027 && E.edicionVigente(tabla, '2027-10-11').anio === 2028 && E.edicionVigente(tabla, '2026-10-26').anio === 2027, 'cierre', 'hasta el sorteo (10 de octubre) sigue la de 2027; pasado el sorteo, la de 2028')
  const g = E.edicionDeAnio(tabla, 2028)
  debe(g.generica === true && g.destino === null && g.premio === tabla.sorteo.siguiente.premio && g.cierre === '2028-08-31' && g.bases_url === '', 'cierre', 'la del año siguiente sale genérica: «Un viaje al destino del año», sin destino ni enlace de bases, cierre el 31 de agosto')
}

/* ─────────────────────────── 2. Los datos ─────────────────────────── */
console.log('2. Los datos: data/logros/exp.json')
{
  const S = tabla.sorteo
  debe(tabla.invitacion.exp === 200 && tabla.invitacion.maximo_al_anio === 5, 'datos', '200 EXP por amigo y como mucho 5 al año')
  debe(!('viajes_acabados_minimos_al_anio' in S) && S.nivel_minimo === 3 && S.viajes_con_hoy_minimos === 1, 'datos', 'la regla vieja (viajes acabados con la app) ya no está: nivel 3 y un viaje con HOY')
  debe(S.edicion.anio === 2027 && S.edicion.destino === 'Roma' && S.edicion.premio === 'Un viaje a Roma para dos personas' && S.edicion.fechas === 'del 8 al 10 de octubre de 2027' && S.edicion.cierre === '2027-08-31', 'datos', 'año 2027, destino Roma, el premio «Un viaje a Roma para dos personas», las fechas y el cierre del 31 de agosto, en un solo sitio')
  debe(S.edicion.bases_url === '', 'datos', 'las bases todavía no están: el enlace va vacío')
  debe(S.cierre_mes_dia === '08-31' && S.primer_anio === 2027 && S.siguiente.destino === null, 'datos', 'el cierre es el 31 de agosto y el año siguiente no lleva destino hasta que se ponga')
}

/* ─────────────────────────── 3. El servicio sobre Postgres ─────────────────────────── */
console.log('3. El servicio de verdad (PGlite, migraciones reales)')
const bd = await crearBaseDePrueba({ alFallar: (m) => debe(false, 'migracion', m) })
const { q, servidor, nuevoUsuario } = bd
debe(bd.aplicadas.includes('0034_avisos_sorteo_y_amigo.sql'), 'migracion', 'la migración 0034 se aplica')
const S = (sql, params = []) => servidor(() => q(sql, params))
const repoPG = crearRepoPG(S)
let reloj = new Date('2026-10-12T12:00:00Z')
const servicio = crearServicioLogros({ repo: repoPG, datos, catalogos, ahora: () => reloj, cobro: false, azar: () => 0 })

const rutaRoma = (inicio, fin, dias) => ({
  destination: 'Roma',
  answers: { dateRange: { start: inicio, end: fin }, companion: 'couple' },
  days: dias.map((ids, i) => ({ id: `d${i + 1}`, dayNumber: i + 1, stops: ids.map((id, j) => ({ id: `d${i + 1}s${j + 1}`, name: nombreDe(id) })) })),
})
const nuevoViaje = async (uid, ruta) => (await S('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [uid, JSON.stringify(ruta)]))[0].id
const SITIOS = ['coliseo', 'panteon', 'trastevere', 'galeria_borghese']
const RUTA_4 = rutaRoma('2026-10-10', '2026-10-13', SITIOS.map((s) => [s]))
const persona = async (email, nombre = null, ruta = RUTA_4) => {
  const uid = await nuevoUsuario(email, false, nombre)
  return { uid, trip: await nuevoViaje(uid, ruta) }
}
/** Un Visto en el sitio del día `n` del viaje (2026-10-10 = día 1), con la ubicación en el sitio. */
const visto = (p, n, { dia0 = '2026-10-09', sitio = SITIOS[n - 1] } = {}) => {
  const d = new Date(`${dia0}T10:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  const instante = d.toISOString()
  return servicio.visto(p.uid, { trip_id: p.trip, sitio, instante, recibido_en: instante, ubicacion: coords(sitio) })
}
const avisosDe = (uid, tipo) => S('select * from public.avisos where user_id = $1 and tipo = $2 order by creado_en', [uid, tipo])

// ── 1.5 · +200 EXP por invitar a un amigo ──
{
  const ana = await persona('inv-ana@correo.es', 'Ana Gómez')
  const luis = await persona('inv-luis@correo.es', 'Luis')
  const base = (await servicio.expDe(luis.uid)).exp
  debe((await servicio.registrarInvitacion(luis.uid, ana.uid)).ok === true, 'invitaciones', 'se apunta que Luis invitó a Ana')
  debe((await servicio.expDe(luis.uid)).exp === base, 'invitaciones', 'crear la cuenta no da EXP a quien invita')
  // Ana usa HOY un día de cuatro (menos de la mitad) y el viaje acaba.
  await visto(ana, 1)
  reloj = new Date('2026-10-20T12:00:00Z')
  await servicio.expDe(ana.uid)
  debe((await servicio.expDe(luis.uid)).exp === base && (await avisosDe(luis.uid, 'amigo_viaje')).length === 0, 'invitaciones', 'un viaje con HOY 1 de 4 días (menos de la mitad) no da EXP ni aviso a quien invita')
  // Ana no cumplía y el viaje ya acabó: aunque abra la app otra vez, sigue sin dar nada.
  await servicio.estado(ana.uid, ana.trip)
  debe((await servicio.expDe(luis.uid)).exp === base, 'invitaciones', 'abrir la app otra vez no cambia nada')

  // Berta: 2 de 4 días con HOY, y el viaje acaba → +200 a Luis, una sola vez.
  reloj = new Date('2026-10-12T12:00:00Z')
  const berta = await persona('inv-berta@correo.es', 'Berta Ruiz')
  await servicio.registrarInvitacion(luis.uid, berta.uid)
  await visto(berta, 1)
  await visto(berta, 2)
  const sinAcabar = await servicio.expDe(berta.uid)
  debe((await servicio.expDe(luis.uid)).exp === base && sinAcabar.ok, 'invitaciones', 'con el viaje sin acabar todavía, aún no da EXP')
  reloj = new Date('2026-10-20T12:00:00Z')
  await servicio.expDe(berta.uid)
  const conAmiga = await servicio.expDe(luis.uid)
  debe(conAmiga.exp === base + 200, 'invitaciones', `+200 EXP cuando el amigo completa su primer viaje con HOY (2 de 4 días): ${base} → ${conAmiga.exp}`)
  const av = await avisosDe(luis.uid, 'amigo_viaje')
  debe(av.length === 1 && textoDelAviso({ tipo: 'amigo_viaje', payload: av[0].payload }) === 'Berta ha hecho su primer viaje con HOY: +200 EXP', 'invitaciones', `el aviso de la campana de quien invita: «${av[0] ? textoDelAviso({ tipo: 'amigo_viaje', payload: av[0].payload }) : '(ninguno)'}»`)
  await servicio.expDe(berta.uid)
  await servicio.estado(berta.uid, berta.trip)
  await servicio.registrarInvitacion(luis.uid, berta.uid)
  debe((await servicio.expDe(luis.uid)).exp === base + 200 && (await avisosDe(luis.uid, 'amigo_viaje')).length === 1, 'invitaciones', 'el mismo amigo da +200 una sola vez y un solo aviso, aunque se vuelva a mirar o a registrar')
  // Otra persona que dice haber invitado a Berta: nada (un amigo solo tiene un invitador).
  const otro = await persona('inv-otro@correo.es', 'Otro')
  await servicio.registrarInvitacion(otro.uid, berta.uid)
  await servicio.expDe(berta.uid)
  debe((await servicio.expDe(otro.uid)).exp === 0 && (await avisosDe(otro.uid, 'amigo_viaje')).length === 0, 'invitaciones', 'un amigo solo da EXP a quien lo invitó primero')

  // El sexto amigo del año ya no da (ni EXP ni aviso).
  reloj = new Date('2026-10-12T12:00:00Z')
  const amigos = []
  for (let i = 0; i < 6; i++) {
    const f = await persona(`inv-amigo${i}@correo.es`, `Amigo${i}`)
    await servicio.registrarInvitacion(luis.uid, f.uid)
    await visto(f, 1)
    await visto(f, 2)
    amigos.push(f)
  }
  reloj = new Date('2026-10-20T12:00:00Z')
  for (const f of amigos) await servicio.expDe(f.uid)
  const final = await servicio.expDe(luis.uid)
  debe(final.exp === base + 5 * 200, 'invitaciones', `como mucho 5 amigos al año: con Berta y 6 más (7 en total) quien invita suma 5 x 200 EXP (${final.exp - base})`)
  debe((await avisosDe(luis.uid, 'amigo_viaje')).length === 5, 'invitaciones', 'y solo hay 5 avisos: el sexto amigo del año no da aviso')
  // Idempotente de verdad: volver a calcular no cambia nada.
  await servicio.recalcular?.(luis.uid)
  debe((await servicio.expDe(luis.uid)).exp === final.exp, 'invitaciones', 'volver a calcular todo no cambia la EXP')
}

// ── 1.6 · El sorteo, de punta a punta ──
reloj = new Date('2026-10-20T12:00:00Z')
const expDeNivel3 = E.expDeNivel(tabla.sorteo.nivel_minimo, tabla)
let u4
{
  const nivelTres = async (p) => repoPG.guardarPerfil(p.uid, { exp_max: expDeNivel3 })
  // Estado 1: sin el nivel.
  const u1 = await persona('sor-1@correo.es', 'Uno')
  await repoPG.guardarPerfil(u1.uid, { exp_max: 160 })
  const s1 = await servicio.sorteoDeCuenta(u1.uid)
  debe(s1.estado === 'sin_nivel' && s1.falta_exp === expDeNivel3 - 160 && s1.nivel_minimo === 3 && Math.abs(s1.barra - 160 / expDeNivel3) < 1e-9, 'sorteo', `sin el nivel: «Te faltan ${s1.falta_exp} EXP para el nivel ${s1.nivel_minimo}» con el número real y su barra`)
  debe(s1.condiciones.find((c) => c.id === 'nivel').ok === false && s1.condiciones.find((c) => c.id === 'viaje_con_hoy').ok === false, 'sorteo', 'las dos condiciones sin cumplir')
  debe(s1.edicion.anio === 2027 && s1.edicion.destino === 'Roma' && s1.edicion.premio === 'Un viaje a Roma para dos personas' && s1.edicion.fechas === 'del 8 al 10 de octubre de 2027' && s1.edicion.bases_url === '' && s1.cerrado === false, 'sorteo', 'la edición sale del dato: 2027, Roma, el premio, las fechas y sin enlace de bases')
  // La experiencia sube de verdad con los Vistos y el nivel se ve en el perfil.
  const antes = (await servicio.expDe(u1.uid)).exp
  await visto(u1, 1)
  const despues = await servicio.expDe(u1.uid)
  debe(despues.exp > antes || antes >= 160, 'sorteo', 'la experiencia sube con los Vistos (o se queda en lo máximo que ya tenía: nunca baja)')
  // Estado 2: tiene el nivel, falta el viaje.
  const u2 = await persona('sor-2@correo.es', 'Dos')
  await nivelTres(u2)
  const s2 = await servicio.sorteoDeCuenta(u2.uid)
  debe(s2.estado === 'falta_viaje' && s2.nivel >= 3 && s2.condiciones.find((c) => c.id === 'nivel').ok === true && s2.condiciones.find((c) => c.id === 'viaje_con_hoy').ok === false, 'sorteo', 'con el nivel pero sin viaje: «Ya tienes el nivel. Haz un viaje con HOY activado y entras.»')
  // Un viaje con HOY menos de la mitad de los días no cuenta.
  reloj = new Date('2026-10-12T12:00:00Z')
  const u3 = await persona('sor-3@correo.es', 'Tres')
  await nivelTres(u3)
  await visto(u3, 1)
  reloj = new Date('2026-10-20T12:00:00Z')
  const s3 = await servicio.sorteoDeCuenta(u3.uid)
  debe(s3.estado === 'falta_viaje' && s3.viajes_con_hoy === 0 && (await avisosDe(u3.uid, 'sorteo')).length === 0, 'sorteo', 'un viaje con HOY 1 de 4 días (menos de la mitad) no cuenta: sigue sin entrar y sin aviso')
  // Estado 3: dentro (2 de 4 días).
  reloj = new Date('2026-10-12T12:00:00Z')
  u4 = await persona('sor-4@correo.es', 'Cuatro')
  await nivelTres(u4)
  await visto(u4, 1)
  await visto(u4, 3)
  const durante = await servicio.sorteoDeCuenta(u4.uid)
  debe(durante.estado === 'falta_viaje', 'sorteo', 'mientras el viaje no ha acabado, no entra')
  reloj = new Date('2026-10-20T12:00:00Z')
  const s4 = await servicio.sorteoDeCuenta(u4.uid)
  debe(s4.estado === 'dentro' && s4.viajes_con_hoy === 1 && s4.condiciones.every((c) => c.ok), 'sorteo', 'viaje acabado con HOY 2 de 4 días y nivel 3: Estás dentro')
  await servicio.sorteoDeCuenta(u4.uid)
  await servicio.expDe(u4.uid)
  const avs = await avisosDe(u4.uid, 'sorteo')
  debe(avs.length === 1 && textoDelAviso({ tipo: 'sorteo', payload: avs[0].payload }) === '¡Ya estás en el sorteo de 2027!' && avs[0].clave === 'sorteo:2027', 'sorteo', 'el aviso dorado de la campana «¡Ya estás en el sorteo de 2027!» llega UNA sola vez (aunque se mire varias veces)')

  // El panel de Eric cuenta con la regla nueva.
  const montadas = {}
  const tokens = { a: { id: u4.uid, email: 'eric@ejemplo.es', is_anonymous: false }, u: { id: u2.uid, email: 'x@y.z', is_anonymous: false }, v: { id: u4.uid, email: 'v@y.z', is_anonymous: false } }
  const adminFalso = { auth: { getUser: async (t) => (tokens[t] ? { data: { user: tokens[t] } } : { error: { message: 'no' } }) } }
  registrarRutasLogros({ get: (r, h) => (montadas[`GET ${r}`] = h), post: (r, h) => (montadas[`POST ${r}`] = h), put: (r, h) => (montadas[`PUT ${r}`] = h) }, { admin: adminFalso, servicio, repo: repoPG, env: { LOGROS_ACTIVOS: 'true', CUENTAS_ACTIVAS: 'true', LOGROS_ADMIN_EMAILS: 'eric@ejemplo.es' }, ahora: () => reloj })
  const llamar = async (ruta, token, query = {}) => {
    let estado = 200
    let cuerpo = null
    const res = { status: (e) => ((estado = e), res), json: (c) => ((cuerpo = c), res) }
    await montadas[ruta]({ headers: { authorization: `Bearer ${token}` }, get: () => `Bearer ${token}`, body: {}, query }, res)
    return { estado, cuerpo }
  }
  const adm = await llamar('GET /api/admin/logros/sorteo', 'a', { anio: '2027' })
  const ids = adm.cuerpo?.lista?.map((x) => x.user_id) ?? []
  debe(adm.estado === 200 && ids.includes(u4.uid) && !ids.includes(u2.uid) && !ids.includes(u3.uid) && !ids.includes(u1.uid), 'admin', 'la pestaña «Sorteo» del admin cuenta a la cuenta que está dentro (y no a las que no)')
  debe(adm.cuerpo.lista.every((x) => !('email' in x) && !('nombre' in x) && 'viajes_con_hoy' in x) && adm.cuerpo.edicion?.anio === 2027 && !('viajes_acabados_minimos_al_anio' in (adm.cuerpo.regla ?? {})), 'admin', 'solo ids (sin nombres ni correos), con los viajes con HOY y la edición, y la regla nueva')
  debe((await llamar('GET /api/admin/logros/sorteo', 'u')).estado === 403, 'admin', 'una cuenta normal no entra al panel (403)')
  const porDefecto = await llamar('GET /api/admin/logros/sorteo', 'a')
  debe(porDefecto.cuerpo.anio === 2027, 'admin', 'sin año, el panel enseña la edición en marcha (2027)')
  const mio = await llamar('GET /api/logros/sorteo', 'v')
  debe(mio.estado === 200 && mio.cuerpo.estado === 'dentro' && mio.cuerpo.edicion.anio === 2027, 'sorteo', 'GET /api/logros/sorteo da el estado de la cuenta')

  // El Perfil y el pasaporte salen del mismo sitio: los mismos números, de lo visitado.
  reloj = new Date('2026-10-12T12:00:00Z')
  const viajero = await persona('perfil-viajero@correo.es', 'Marta')
  await visto(viajero, 1)
  await visto(viajero, 2, { sitio: 'basilica_de_san_pedro' })
  reloj = new Date('2026-10-20T12:00:00Z')
  tokens.m = { id: viajero.uid, email: 'm@y.z', is_anonymous: false }
  const perfil = await llamar('GET /api/logros/perfil', 'm')
  const pasaporte = await llamar('GET /api/logros/pasaporte2', 'm')
  const pp = perfil.cuerpo?.pasaporte
  const pn = pasaporte.cuerpo?.numeros
  debe(perfil.estado === 200 && pasaporte.estado === 200 && pp && pn && pp.paises === pn.paises && pp.ciudades === pn.ciudades && pp.sellos === pn.sellos && pp.dias_viajando === pn.dias_viajando, 'perfil', `los mismos números en el perfil y dentro del pasaporte: ${pp?.paises} países · ${pp?.ciudades} ciudades · ${pp?.sellos} sellos · ${pp?.dias_viajando} días`)
  debe(pp.paises >= 2 && Array.isArray(pp.paises_iso) && pp.paises_iso.includes('it') && pp.paises_iso.includes('va'), 'perfil', 'el mapa del perfil sale de lo visitado: Italia y el Vaticano')
  debe((pp.sellos_recientes ?? []).length <= 2 && (pp.sellos_recientes ?? []).every((s) => s.ciudad && s.fecha), 'perfil', 'los sellos que asoman en la tarjeta son como mucho dos, con su ciudad y su fecha')
  debe(perfil.cuerpo.sorteo?.estado && perfil.cuerpo.sorteo.edicion.anio === 2027 && perfil.cuerpo.exp.nivel >= 1, 'perfil', 'el perfil trae el billete del sorteo y el nivel')
  const perfilU4 = await llamar('GET /api/logros/perfil', 'a')
  debe(perfilU4.cuerpo.exp.nivel >= 3 && perfilU4.cuerpo.sorteo.estado === 'dentro', 'sorteo', 'el nivel 3 se ve en el perfil y el billete está en «Estás dentro»')
}

// ── El cierre del 31 de agosto, con cuentas de verdad ──
console.log('   El cierre del 31 de agosto')
{
  // (Se baja el nivel mínimo a 1 en estas cuentas para probar solo el cierre de los VIAJES: el nivel conseguido hasta el cierre ya se probó arriba, con las reglas puras.)
  const datos2 = { ...datos, exp: { ...tabla, sorteo: { ...tabla.sorteo, nivel_minimo: 1 } } }
  const servicio2 = crearServicioLogros({ repo: repoPG, datos: datos2, catalogos, ahora: () => reloj, cobro: false, azar: () => 0 })
  const visto2 = (p, instante, sitio) => servicio2.visto(p.uid, { trip_id: p.trip, sitio, instante, recibido_en: instante, ubicacion: coords(sitio) })
  const rutaA = rutaRoma('2027-08-29', '2027-08-31', [['coliseo'], ['panteon'], ['trastevere']])
  const rutaB = rutaRoma('2027-08-30', '2027-09-01', [['coliseo'], ['panteon'], ['trastevere']])
  const a = await persona('cierre-a@correo.es', 'Alba', rutaA)
  const b = await persona('cierre-b@correo.es', 'Blas', rutaB)
  const c = await persona('cierre-c@correo.es', 'Clara', rutaA)
  reloj = new Date('2027-08-29T10:00:00Z')
  await visto2(a, '2027-08-29T10:00:00Z', 'coliseo')
  reloj = new Date('2027-08-30T10:00:00Z')
  await visto2(a, '2027-08-30T10:00:00Z', 'panteon')
  await visto2(b, '2027-08-30T10:00:00Z', 'coliseo')
  reloj = new Date('2027-08-31T10:00:00Z')
  await visto2(b, '2027-08-31T10:00:00Z', 'panteon')
  // c: sin Vistos.
  reloj = new Date('2027-09-05T12:00:00Z')
  const lista = async (anio) => (await servicio2.sorteoDe(anio, [a.uid, b.uid, c.uid])).lista.map((x) => x.user_id)
  const l2027 = await lista(2027)
  debe(l2027.includes(a.uid) && !l2027.includes(b.uid) && !l2027.includes(c.uid), 'cierre', 'para el de 2027 entra el viaje acabado el 31 de agosto (2 de 3 días con HOY) y NO el acabado el 1 de septiembre ni quien no usó HOY')
  const sa = await servicio2.sorteoDeCuenta(a.uid)
  debe(sa.estado === 'dentro' && sa.edicion.anio === 2027 && sa.cerrado === true && sa.para_el_siguiente === false, 'cierre', 'quien está dentro sigue viendo «Estás dentro» de 2027 después del cierre')
  const sb = await servicio2.sorteoDeCuenta(b.uid)
  debe(sb.edicion.anio === 2028 && sb.para_el_siguiente === true && sb.edicion.destino === null && sb.edicion.premio === 'Un viaje al destino del año' && sb.estado === 'dentro', 'cierre', 'el viaje acabado el 1 de septiembre de 2027 cuenta para el del año siguiente (sin destino: «Un viaje al destino del año»)')
  const avB = await avisosDe(b.uid, 'sorteo')
  debe(avB.length === 1 && avB[0].clave === 'sorteo:2028' && textoDelAviso({ tipo: 'sorteo', payload: avB[0].payload }) === '¡Ya estás en el sorteo de 2028!', 'cierre', 'y su aviso dorado dice 2028, una sola vez')
  const sc = await servicio2.sorteoDeCuenta(c.uid)
  debe(sc.edicion.anio === 2028 && sc.para_el_siguiente === true && sc.estado === 'falta_viaje', 'cierre', 'quien no entró ve ya el billete del año siguiente')
  reloj = new Date('2027-10-11T12:00:00Z')
  const pasado = await servicio2.sorteoDeCuenta(a.uid)
  debe(pasado.edicion.anio === 2028 && pasado.estado === 'falta_viaje', 'cierre', 'pasado el sorteo (10 de octubre), todos pasan al de 2028: el viaje de agosto ya no cuenta para él')
}
await bd.db.close?.()

/* ─────────────────────────── 4. El código ─────────────────────────── */
console.log('4. El código: nada escrito a mano')
{
  const exp = sinComentarios(fs.readFileSync('server/logros/exp.js', 'utf8'))
  debe(!/\b(200|2027|2028|1400)\b|Roma|31/.test(exp.slice(exp.indexOf('export function edicionDeAnio'))), 'codigo', 'el cerebro del sorteo no lleva ni la EXP, ni el año, ni el destino, ni el día de cierre escritos: todo sale de exp.json')
  for (const f of ['Billete.tsx', 'PaginaDelSorteo.tsx', 'api.ts']) {
    const t = sinComentarios(fs.readFileSync(`src/components/logros/pantallas/sorteo/${f}`, 'utf8'))
    debe(!/2027|Roma\b|octubre de 20|Un viaje a Roma/.test(t), 'codigo', `${f}: el año, el destino, el premio y las fechas no están escritos en la pantalla`)
  }
  const pag = fs.readFileSync('src/components/logros/pantallas/sorteo/PaginaDelSorteo.tsx', 'utf8')
  debe(/edicion\.bases_url\s*&&/.test(pag), 'codigo', '[Bases legales] solo sale si hay enlace')
  const cuerpoEntero = fs.readFileSync('src/components/logros/pantallas/perfil/CuerpoConLogros.tsx', 'utf8')
  const cuerpo = cuerpoEntero.slice(cuerpoEntero.indexOf('const { exp } = perfil')) // (10N4) antes de esa línea va la rama sin logros
  const orden = ['<ExpEnPequeno', '{misViajes}', 'data-vitrina-del-perfil', '<TarjetaPasaporte', '<BilleteDelSorteo'].map((k) => (k === '{misViajes}' ? cuerpo.lastIndexOf(k) : cuerpo.indexOf(k)))
  debe(orden.every((x, i) => x > 0 && (i === 0 || x > orden[i - 1])), 'perfil', 'el orden del perfil en el código (10N5 §4): EXP en la cabecera, Mis viajes, Mi vitrina, Mi pasaporte y el billete abajo del todo')
  debe(!/MapaMisViajes/.test(sinComentarios(cuerpo)), 'perfil', 'el mapa suelto (MapaMisViajes) ya no está en el perfil con logros')
}

/* ─────────────────────────── 5. La pantalla ─────────────────────────── */
const urlApp = process.env.APP_URL || 'http://localhost:5183'
const hayApp = await fetch(urlApp).then((r) => r.ok).catch(() => false)
if (!hayApp) {
  console.log(`5. La pantalla: SE SALTA (no hay Vite en ${urlApp}; arráncalo con «API_TARGET=http://localhost:8853 npx vite --port 5183 --strictPort» y pon APP_URL)`)
} else {
  console.log('5. La pantalla (móvil de 390 px, logros de mentira)')
  const { abrirConPerfil } = await import('./_10p_sorteo_app.mjs')
  const carpeta = 'docs/dias/capturas_jutrip'
  fs.mkdirSync(carpeta, { recursive: true })
  const { app, texto, abrirElPerfil } = await abrirConPerfil({ nombre: 'Eric' })
  const ev = (js) => app.evaluar(js)
  const poner = async (estado) => {
    await ev(`window.__demoSorteo.poner('${estado}'); true`)
    await ev("import('/src/store/usePerfilUi.ts').then((m) => { m.usePerfilUi.getState().cerrar?.(); return true })")
    await app.esp(500)
    await abrirElPerfil()
  }
  const estadoReal = (estado) => ev(`window.__demoSorteo.poner('${estado}'), window.__demoSorteo.estado()`)
  const billete = () => ev("(() => { const b = document.querySelector('[data-billete-sorteo]'); return b ? { estado: b.getAttribute('data-billete-sorteo'), texto: b.innerText.split(String.fromCharCode(10)).join(' | '), barra: b.querySelector('[data-billete-barra]')?.style.width ?? null, dentro: Boolean(b.querySelector('[data-billete-dentro]')) } : null })()")

  // Los tres estados del billete.
  const e1 = await estadoReal('sin_nivel')
  await poner('sin_nivel')
  let b = await billete()
  debe(b && b.estado === 'sin_nivel' && b.texto.includes(`Te faltan ${String(e1.falta_exp).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} EXP para el nivel 3`) && b.barra === `${Math.round(e1.barra * 100)}%`, 'pantalla', `el billete sin el nivel: «Te faltan ${e1.falta_exp} EXP para el nivel 3» con su barra (${b?.barra})`)
  debe(/Un viaje a Roma/.test(b?.texto ?? '') && /2027/.test(b?.texto ?? ''), 'pantalla', 'el billete dice 2027 y «Un viaje a Roma» (del dato)')
  await app.captura(`${carpeta}/10p_perfil_1_billete_sin_nivel.jpg`)
  await poner('falta_viaje')
  b = await billete()
  debe(b && b.estado === 'falta_viaje' && b.texto.includes('Ya tienes el nivel. Haz un viaje con HOY activado y entras.') && b.barra === null, 'pantalla', 'el billete con el nivel: «Ya tienes el nivel. Haz un viaje con HOY activado y entras.»')
  await app.captura(`${carpeta}/10p_perfil_2_billete_falta_viaje.jpg`)
  await poner('dentro')
  b = await billete()
  debe(b && b.estado === 'dentro' && b.dentro && b.texto.includes('Estás dentro'), 'pantalla', 'el billete dentro: [✓ Estás dentro]')
  await app.captura(`${carpeta}/10p_perfil_3_billete_dentro.jpg`)

  // El orden del perfil y lo que ya no está.
  const orden = await ev(`(() => { const d = document.querySelector('[role=dialog][aria-label=Perfil]'); const y = (s) => d.querySelector(s)?.getBoundingClientRect().top ?? -1; return { exp: y('[data-exp-pequena]'), billete: y('[data-billete-sorteo]'), vitrina: y('[data-vitrina-del-perfil]'), pasaporte: y('[data-abrir-pasaporte]'), viajes: y('[data-numero-de-viajes]'), mapa: d.querySelector('[data-cifras-del-mapa]') ? 1 : 0, canvas: d.querySelectorAll('canvas.mapboxgl-canvas').length } })()`)
  debe(orden.exp > 0 && orden.exp < orden.viajes && orden.viajes < orden.vitrina && orden.vitrina < orden.pasaporte && orden.pasaporte < orden.billete, 'perfil', `el orden en pantalla (10N5 §4): EXP, Mis viajes, Mi vitrina, Mi pasaporte y el billete (${JSON.stringify(orden)})`)
  debe(orden.mapa === 0 && orden.canvas === 0, 'perfil', 'fuera el mapa de países suelto debajo de «Mi pasaporte» (ni sus cifras «lugares · días», ni su mapa de Mapbox)')
  const tarjeta = await ev("(() => { const t = document.querySelector('[data-abrir-pasaporte]'); return { texto: t.innerText.split(String.fromCharCode(10)).join(' | '), numeros: t.querySelector('[data-numeros-pasaporte]')?.textContent ?? '', mapa: Boolean(t.querySelector('[data-mapa-pasaporte] svg')), sellos: t.querySelectorAll('[data-sello-asomando]').length, alto: Math.round(t.getBoundingClientRect().height) } })()")
  debe(/^\d+ países? · \d+ ciudad(es)?$/.test(tarjeta.numeros) && !/días viajando/.test(tarjeta.texto) && tarjeta.texto.includes('Mi pasaporte'), 'perfil', `la tarjeta del pasaporte lleva solo países y ciudades, sin «días viajando»: «${tarjeta.numeros}»`)
  debe(tarjeta.mapa && tarjeta.sellos === 2, 'perfil', 'la tarjeta lleva el círculo con el mapa a la izquierda y los sellos asomando a la derecha')
  await ev("document.querySelector('[data-abrir-pasaporte]').scrollIntoView({ block: 'center' }); true")
  await app.esp(1500)
  await app.captura(`${carpeta}/10p_perfil_4_pasaporte_tarjeta.jpg`)

  // Dentro del pasaporte.
  await ev("document.querySelector('[data-abrir-pasaporte]').click(); true")
  await app.esp(4500)
  const dentroP = await ev(`(() => { const p = document.querySelector('[data-pantalla-logros=PasaporteScreen]'); const t = p.querySelector('[data-titulo-pasaporte]'); const m = p.querySelector('[data-mapa-grande]'); const n = [...p.querySelectorAll('span')].map((s) => s.textContent).find((x) => /días viajando/.test(x)) ?? ''; return { titulo: (t?.textContent ?? '').replace(/\\s+/g, ' ').trim(), mapa: Math.round(m?.getBoundingClientRect().width ?? 0), numeros: n } })()`)
  debe(/^Pasaporte de Eric$/i.test(dentroP.titulo), 'pasaporte', `arriba dice «Pasaporte de {nombre}»: «${dentroP.titulo}»`)
  debe(dentroP.mapa >= 340, 'pasaporte', `el círculo del mapa es mucho más grande en el móvil (${dentroP.mapa} px; antes 268)`)
  const nf = tarjeta.numeros.match(/^(\d+) países? · (\d+) ciudad/)
  const nd = dentroP.numeros.match(/^(\d+) países? · (\d+) ciudad(es)? · (\d+) días? viajando/)
  debe(nf && nd && nf[1] === nd[1] && nf[2] === nd[2], 'pasaporte', `los mismos números fuera y dentro: «${tarjeta.numeros}» y «${dentroP.numeros}» (dentro, además, los días viajando)`)
  await app.captura(`${carpeta}/10p_perfil_5_pasaporte_dentro.jpg`)
  await ev("import('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().cerrarTodo(); return true })")
  await app.esp(500)

  // La página del sorteo en cada estado.
  const abrirPagina = async () => {
    await ev("document.querySelector('[data-billete-sorteo]').click(); true")
    await app.esp(1800)
    return ev(`(() => { const p = document.querySelector('[data-sorteo]'); const cond = (id) => p.querySelector('[data-condicion=' + id + ']')?.getAttribute('data-condicion-ok'); return { texto: p.innerText.split(String.fromCharCode(10)).join(' | '), nivel: cond('nivel'), viaje: cond('viaje_con_hoy'), bases: Boolean(p.querySelector('[data-bases-legales]')), boton: p.querySelector('[data-sorteo-boton]')?.getAttribute('data-sorteo-boton') ?? null, foto: p.querySelector('[data-foto-sorteo]')?.getAttribute('src') ?? null, volver: Boolean(p.querySelector('[data-sorteo-volver]')), premio: p.querySelector('[data-sorteo-premio]')?.textContent ?? '', fechas: p.querySelector('[data-sorteo-fechas]')?.textContent ?? '' } })()`)
  }
  const cerrarPagina = async () => {
    await ev("document.querySelector('[data-sorteo-volver]').click(); true")
    await app.esp(600)
  }
  for (const [estado, nivel, viaje, n] of [['sin_nivel', '0', '0', 1], ['falta_viaje', '1', '0', 2], ['dentro', '1', '1', 3]]) {
    await poner(estado)
    const pg = await abrirPagina()
    debe(pg.nivel === nivel && pg.viaje === viaje && pg.boton === estado, 'pagina', `la página en «${estado}»: ✓ solo en las condiciones que cumple (nivel ${pg.nivel}, viaje ${pg.viaje}) y el botón de abajo con su estado`)
    debe(pg.premio === 'Un viaje a Roma para dos personas' && pg.fechas === 'del 8 al 10 de octubre de 2027' && /Viajeros de nivel 3 o más/.test(pg.texto) && /CÓMO SE ENTRA|Cómo se entra/i.test(pg.texto) && pg.foto?.includes('/fotos/roma/') && pg.volver, 'pagina', 'la página lleva la foto de Roma, la flecha para volver, el premio, cuándo se sortea, quién puede entrar y «Cómo se entra»')
    debe(pg.bases === false && !/Bases legales/i.test(pg.texto), 'pagina', 'sin enlace de bases, el botón [Bases legales] NO sale')
    await app.captura(`${carpeta}/10p_sorteo_${n}_pagina_${estado}.jpg`)
    await cerrarPagina()
  }
  await ev("window.__demoSorteo.bases('https://ejemplo.es/bases'); true")
  await poner('dentro')
  const conBases = await abrirPagina()
  debe(conBases.bases === true && /Bases legales/.test(conBases.texto), 'pagina', 'con enlace en el dato, el botón [Bases legales] sale')
  await app.captura(`${carpeta}/10p_sorteo_4_pagina_con_bases.jpg`)
  await cerrarPagina()
  await ev("window.__demoSorteo.bases(''); true")

  // El aviso dorado de la campana.
  await ev("import('/src/store/usePerfilUi.ts').then((m) => { m.usePerfilUi.getState().cerrar?.(); return true })")
  await app.esp(600)
  await ev(`window.__avisos.getState().poner([{ id: 'aviso-sorteo', tipo: 'sorteo', texto: '¡Ya estás en el sorteo de 2027!', quien: null, creado_en: new Date().toISOString(), leido: false, payload: { anio: 2027 }, etiqueta: null }, { id: 'aviso-amigo', tipo: 'amigo_viaje', texto: 'Ana ha hecho su primer viaje con HOY: +200 EXP', quien: null, creado_en: new Date(Date.now() - 3600000).toISOString(), leido: false, payload: { nombre: 'Ana', exp: 200 }, etiqueta: null }]); window.__avisos.getState().abrir(); true`)
  await app.esp(1200)
  const camp = await ev("(() => { const l = document.querySelector('[data-aviso-tipo=sorteo]'); const a = document.querySelector('[data-aviso-tipo=amigo_viaje]'); return { sorteo: l ? l.innerText.split(String.fromCharCode(10)).join(' | ') : null, borde: l ? (Array.from(l.querySelectorAll('*')).some((e) => /linear-gradient[(]145deg/.test(getComputedStyle(e).backgroundImage)) ? 'oro' : 'sin oro') : null, amigo: a ? a.innerText.split(String.fromCharCode(10)).join(' | ') : null } })()")
  debe(/¡Ya estás en el sorteo de 2027!/.test(camp.sorteo ?? '') && camp.borde === 'oro', 'campana', `el aviso especial del sorteo en la campana (desde 10N4 sin borde dorado: lleva su icono dorado): «${camp.sorteo}»`)
  debe(/Ana ha hecho su primer viaje con HOY: \+200 EXP/.test(camp.amigo ?? ''), 'campana', `el aviso de quien invita: «${camp.amigo}»`)
  await app.captura(`${carpeta}/10p_sorteo_5_campana.jpg`)
  await ev("document.querySelector('[data-aviso-tipo=sorteo]').click(); true")
  await app.esp(1800)
  debe(await ev("Boolean(document.querySelector('[data-sorteo]'))"), 'campana', 'tocar el aviso dorado abre la página del sorteo')

  // El mapa se centra en lo visitado y, sin ningún país, en Europa (la misma función para la tarjeta y para el pasaporte).
  const vistas = await ev(`import('/src/components/logros/pantallas/mundo/mapaDeVisitados.ts').then((m) => {
    const cat = [{ i: 'it', n: 'Italia', c: 'Europa', lat: 42.5, lng: 12.5, p: 0 }, { i: 'es', n: 'España', c: 'Europa', lat: 40, lng: -4, p: 0 }, { i: 'jp', n: 'Japón', c: 'Asia', lat: 36, lng: 138, p: 0 }]
    return { ninguno: m.mapaDeVisitados(cat, []).inicial, uno: m.mapaDeVisitados(cat, ['jp']).inicial, dos: m.mapaDeVisitados(cat, ['it', 'es']).inicial, pintados: Object.keys(m.mapaDeVisitados(cat, ['it', 'es', 'xx']).rellenos) }
  })`)
  debe(vistas.ninguno.lat === 48 && vistas.ninguno.lng === 12, 'mapa', 'sin ningún país visitado, el mapa se ve centrado en Europa')
  debe(vistas.uno.lat === 36 && vistas.uno.lng === 138 && vistas.dos.lng > -4 && vistas.dos.lng < 12.5 && vistas.pintados.join() === 'it,es', 'mapa', 'con uno, centrado en él; con varios, en su punto medio; y solo se pintan los países que existen')
  app.cerrar()
}

console.log(`\nLa prueba del sorteo, las invitaciones y el perfil: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
