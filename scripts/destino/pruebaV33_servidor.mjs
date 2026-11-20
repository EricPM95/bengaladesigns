// La prueba del SERVIDOR del Panel de Jutrip (V33): server/panel/*, server/correo.js, el aviso interno de server/avisosViajeros.js y la migración 0090.
// Sin navegador y sin servidores de la app: PGlite (todas las migraciones reales), un express en un puerto aleatorio dentro de la propia prueba, un cliente de Supabase de mentira (auth y rpc sobre PGlite)
// y un `fetchFn` de mentira para Resend: NINGÚN correo real y nada contra producción.
//   node scripts/destino/pruebaV33_servidor.mjs
import fs from 'node:fs'
import express from 'express'
import { crearBaseDePrueba, crearAdminDePrueba } from './_baseDeDatosPrueba.mjs'
import { registrarRutasPanel } from '../../server/panel/index.js'
import { registrarRutasAvisosViajeros } from '../../server/avisosViajeros.js'
import { crearCorreo } from '../../server/correo.js'
import { cargarDatos } from '../../server/logros/datos.js'
import { nivelDeExp } from '../../server/logros/exp.js'

let comprobaciones = 0
const fallos = []
const debe = (cond, texto) => {
  comprobaciones++
  if (!cond) fallos.push(texto)
}

// ── La base de datos: todas las migraciones reales (las que no encajan en PGlite, como pg_cron, se ignoran) ──
const noAplicadas = []
const bd = await crearBaseDePrueba({ migraciones: /^\d{4}_.*\.sql$/, alFallar: (m) => noAplicadas.push(String(m)) })
const { q, servidor, nuevoUsuario } = bd
debe(!noAplicadas.some((m) => /^0090/.test(m)), `la migración 0090 se aplica (${noAplicadas.filter((m) => /^0090/.test(m)).join(' | ')})`)
await bd.db.exec('alter table auth.users add column if not exists last_sign_in_at timestamptz') // (Supabase la trae; la base de pruebas, no)
const migracion = fs.readFileSync('supabase/migrations/0090_panel_jutrip.sql', 'utf8')
await bd.db.exec(migracion) // repetible: pegada otra vez
debe(/SIN APLICAR/.test(migracion.split('\n')[0]) && /COMPROBAR_0090\.sql/.test(migracion.split('\n')[0]), 'la cabecera de la 0090 dice «SIN APLICAR» y nombra su COMPROBAR')
const comprobar = fs.readFileSync('docs/dias/COMPROBAR_0090.sql', 'utf8')
// Como en Supabase: lo que las migraciones revocan, revocado (la base de pruebas concede todo al final).
const FUNCIONES = ['panel_fecha(text)', 'panel_cosa_aviso(jsonb)', 'panel_inicio(timestamptz, text)', 'panel_usuarios(text, text, text, text, text, text, integer, integer, date, uuid)', 'panel_usuarios_totales(timestamptz)', 'panel_ficha(uuid, date)', 'panel_ventas(timestamptz, text)', 'panel_destinos_pedidos(integer)', 'panel_destinos_resumen(jsonb)', 'panel_destino_ya_disponible(text, text, boolean, integer)', 'panel_destino_correo_devolver(jsonb)', 'panel_reporte_responder(uuid, text)', 'panel_reportes_a_notificar(timestamptz, integer)', 'panel_reportes_desmarcar(jsonb)']
for (const f of FUNCIONES) await bd.db.exec(`revoke execute on function public.${f} from authenticated`)
debe((await q(comprobar))[0]?.migracion_0090 === 'Aplicada', 'COMPROBAR_0090.sql dice «Aplicada» con la 0090 aplicada (y repetida)')
debe((await q(comprobar)).length === 1, 'COMPROBAR_0090.sql devuelve UNA sola fila')
// Quien no es el servidor no puede llamar a ninguna función del panel.
let bloqueadas = 0
for (const f of FUNCIONES) if (!(await q(`select has_function_privilege('authenticated', 'public.${f}', 'execute') or has_function_privilege('anon', 'public.${f}', 'execute') as ok`))[0].ok) bloqueadas++
debe(bloqueadas === FUNCIONES.length, 'ninguna función del panel está abierta a «authenticated» ni a «anon»')
// Las funciones nuevas no tocan ninguna tabla con datos de una persona nueva: solo columnas en tablas que ya están en el inventario de empezar_de_cero.
debe(!/create table/i.test(migracion), 'la 0090 no crea ninguna tabla (así no hay que tocar empezar_de_cero ni pruebaTanda10J)')

// ── El reloj de mentira (todo sale de él) ──
const T0 = Date.parse('2026-11-20T10:00:00Z')
let reloj = T0
const minutos = (m) => T0 + m * 60_000

// ── Las cuentas ──
const nombres = ['admin', 'ana', 'bea', 'carlos', 'dani', 'eli', 'fran']
const id = {}
for (const n of nombres) id[n] = await nuevoUsuario(`${n}@x.es`, false, n === 'ana' ? 'Ana Pérez' : n[0].toUpperCase() + n.slice(1))
id.anonimo = await nuevoUsuario('anon@x.es', true)
for (let i = 0; i < 60; i++) await nuevoUsuario(`usuario${String(i).padStart(2, '0')}@x.es`, false, `Usuario ${String(i).padStart(2, '0')}`)
const REALES = 7 + 60
await q("update auth.users set created_at = '2026-01-01T00:00:00Z'")
await q("update auth.users set created_at = '2026-11-20T08:00:00Z' where id = $1", [id.carlos])
await q("update auth.users set created_at = '2026-11-17T08:00:00Z' where id = $1", [id.dani])
await q("update auth.users set last_sign_in_at = '2026-11-19T09:00:00Z' where id = $1", [id.bea])
await q("update auth.users set last_sign_in_at = '2026-11-18T09:00:00Z' where id = $1", [id.ana])
const fichas = new Map([['T-admin', id.admin], ['T-ana', id.ana], ['T-anon', id.anonimo]])

// ── Viajes, pases, dinero, logros, primera vez, reportes y avisos de destino ──
const viaje = (destino, inicio, fin) => JSON.stringify({ destination: destino, answers: { dateRange: { start: inicio, end: fin } } })
const trip1 = (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [id.ana, viaje('Roma', '2026-05-01', '2026-05-05')]))[0].id
await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb)', [id.ana, viaje('Roma', '2026-12-10', '2026-12-14')])
await q('insert into public.trip_members (trip_id, user_id) values ($1, $2)', [trip1, id.bea])
const comprar = async (ref, intencion, proveedor, quien, destino, plan, cent, cuando) => {
  await q('select public.registrar_pago($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [ref, intencion, proveedor, quien, destino, plan, plan === 'uno' ? 1 : 2, cent, 'eur', null])
  await q('update public.pagos_registro set creado_en = $2 where pago_ref = $1', [ref, cuando])
}
await comprar('cs_mock_1', 'pi_mock_1', 'stripe', id.ana, 'Roma', 'uno', 1900, '2026-11-20T09:00:00Z')
await comprar('cs_mock_2', 'pi_mock_2', 'stripe', id.ana, 'Lanzarote', 'uno', 2900, '2026-11-05T09:00:00Z')
await comprar('cs_mock_3', 'pi_mock_3', 'stripe', id.fran, 'Roma', 'uno', 1900, '2026-10-25T09:00:00Z')
await comprar('cs_mock_4', 'pi_mock_4', 'stripe', id.dani, 'Roma', 'uno', 1900, '2026-11-10T09:00:00Z')
await q('select public.devolver_pago($1)', ['pi_mock_4'])
await comprar('cs_mock_5', 'pi_mock_5', 'mentira', id.eli, 'Roma', 'uno', 1900, '2026-11-12T09:00:00Z')
// Un pase dado a mano (sin cobro) a Bea, y Carlos entra con su código.
const paseBea = (await q("insert into public.passes (destino, comprador_id, tipo, usos_max, usos_usados, codigo) values ('Roma', $1, 'duo', 2, 2, 'CODIGOBEA1') returning id", [id.bea]))[0].id
await q('insert into public.pass_members (pass_id, user_id) values ($1, $2), ($1, $3)', [paseBea, id.bea, id.carlos])
// Logros y EXP de Ana.
await q('insert into public.logro_perfil (user_id, exp_max) values ($1, 1200)', [id.ana])
await q("insert into public.achievements (user_id, logro, escalon, destino) values ($1, 'sello', 'roma:bronce', 'roma'), ($1, 'coleccion', 'imprescindibles', 'roma'), ($1, 'pais', 'Italia', 'roma'), ($1, 'destino_nuevo', 'roma', 'roma')", [id.ana])
// La primera vez.
await q("insert into public.viajero_primera_vez (user_id, frecuencia, compania, anio_nacimiento) values ($1, 'dos_o_tres', 'pareja', 1990), ($2, 'cuatro_o_mas', 'familia', 1960), ($3, null, null, null), ($4, 'dos_o_tres', 'amigos', null), ($5, null, null, 2015)", [id.ana, id.bea, id.carlos, id.dani, id.eli])
// Reportes (por la función de la 0085, como hace el servidor).
const guardar = async (p) => (await q('select public.aviso_viajero_guardar($1::jsonb) as id', [JSON.stringify(p)]))[0].id
const rAna = await guardar({ tipo: 'dato_mal', datos: { sitio: 'Coliseo', falla: 'horario', mas: 'Abre más tarde' }, destino: 'Roma', avisame: true, user_id: id.ana })
const rAnon = await guardar({ tipo: 'idea', datos: { texto: 'Una idea suelta' }, avisame: false })
const rFoto = await guardar({ tipo: 'foto', datos: { sitio: 'Fontana', nombre_en_foto: 'Lu', acepta: true }, destino: 'Roma', fotos: ['foto/abcdef123456'], avisame: false })
const rCarlos = await guardar({ tipo: 'no_funciona', datos: { que: 'No carga el mapa' }, avisame: false, user_id: id.carlos })
// Avisos de destino («Avísame»).
const avisoDestino = (destino, norm, email, uid) => q('insert into public.avisos_destino (destino, destino_norm, email, email_norm, user_id) values ($1, $2, $3, $3, $4)', [destino, norm, email, uid])
await avisoDestino('Florencia', 'florencia', 'f1@x.es', id.ana)
await avisoDestino('Florencia', 'florencia', 'f2@x.es', null)
await avisoDestino('florencia', 'florencia', 'f3@x.es', id.bea)
await avisoDestino('Berlín', 'berlin', 'b1@x.es', id.dani)
await avisoDestino('Cartagena de Indias', 'cartagena de indias', 'c1@x.es', null)

// ── El cliente de Supabase de mentira y el correo de mentira ──
// (V35A) Destinos y Reportes ya leen las tablas con `admin.from(...)`: un trocito de «from» sobre PGlite (select * y los filtros de siempre hechos aquí), solo para esta prueba.
const conFrom = (admin) => {
  const from = (tabla) => {
    if (!/^[a-z_]+$/.test(tabla)) throw new Error('tabla rara')
    const filtros = []
    let orden = null
    let tope = null
    let cuenta = false
    let cambios = null
    const construir = {
      select: (_cols, o) => (o?.head && o?.count ? ((cuenta = true), construir) : construir),
      update: (c) => ((cambios = c), construir),
      eq: (k, v) => (filtros.push((f) => f[k] === v), construir),
      neq: (k, v) => (filtros.push((f) => f[k] !== v), construir),
      in: (k, vs) => (filtros.push((f) => vs.includes(f[k])), construir),
      like: (k, pat) => (filtros.push((f) => String(f[k] ?? '').startsWith(String(pat).replace(/%$/, ''))), construir),
      order: (k, o) => ((orden = [k, o?.ascending !== false]), construir),
      limit: (n) => ((tope = n), construir),
      range: (d, h) => ((tope = h + 1), construir),
      maybeSingle: async () => ({ data: (await construir.then((r) => r)).data?.[0] ?? null, error: null }),
      then: async (ok, no) => {
        try {
          if (cambios) {
            const filas = (await bd.q(`select * from public.${tabla}`)).filter((f) => filtros.every((x) => x(f)))
            for (const f of filas) for (const [k, v] of Object.entries(cambios)) await bd.q(`update public.${tabla} set ${k} = $1 where id = $2`, [v, f.id])
            return ok({ data: null, error: null })
          }
          let filas = (await bd.q(`select * from public.${tabla}`)).filter((f) => filtros.every((x) => x(f)))
          if (orden) filas = filas.sort((x, y) => (String(x[orden[0]]) < String(y[orden[0]]) ? -1 : 1) * (orden[1] ? 1 : -1))
          if (tope !== null) filas = filas.slice(0, tope)
          return ok(cuenta ? { count: filas.length, data: null, error: null } : { data: filas, error: null })
        } catch (e) {
          return no ? no(e) : ok({ data: null, error: { message: e.message } })
        }
      },
    }
    return construir
  }
  return Object.assign(admin, { from })
}
const adminSupabase = conFrom(crearAdminDePrueba(bd, fichas))
const mandados = []
let fallaResend = false
const fetchFalso = async (url, opciones) => {
  mandados.push({ url, auth: opciones?.headers?.Authorization, cuerpo: JSON.parse(opciones.body) })
  return { ok: !fallaResend, json: async () => ({ id: `email_${mandados.length}` }) }
}
const CLAVE_FALSA = 'clave-de-mentira-para-la-prueba'
const correoConClave = crearCorreo({ apiKey: CLAVE_FALSA, fetchFn: fetchFalso })
const correoSinClave = crearCorreo({ apiKey: undefined, fetchFn: async () => { throw new Error('sin clave no se llama a nadie') } })
const ENV = { LOGROS_ADMIN_EMAILS: 'admin@x.es', APP_URL: 'https://app.test' }
const consola = { log() {}, error() {} }
const datos = cargarDatos()
const montar = ({ admin = adminSupabase, correo = correoConClave } = {}) => {
  const app = express()
  app.use(express.json())
  registrarRutasPanel(app, { admin, env: ENV, correo, ahora: () => reloj, consola, datos })
  registrarRutasAvisosViajeros(app, { admin, env: ENV, correo, ahora: () => reloj, consola })
  return new Promise((ok) => {
    const s = app.listen(0, '127.0.0.1', () => ok({ s, base: `http://127.0.0.1:${s.address().port}` }))
  })
}
const cuerpos = [] // todo lo que responde el servidor (para el barrido de privacidad)
const pedir = async (srv, ruta, { token = 'T-admin', metodo = 'GET', cuerpo } = {}) => {
  const r = await fetch(`${srv.base}${ruta}`, { method: metodo, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), 'content-type': 'application/json' }, ...(cuerpo !== undefined ? { body: JSON.stringify(cuerpo) } : {}) })
  const texto = await r.text()
  cuerpos.push(texto)
  let json = null
  try {
    json = JSON.parse(texto)
  } catch {
    /* no era JSON */
  }
  return { estado: r.status, json }
}
const aSoporte = () => mandados.filter((m) => m.cuerpo.to.includes('soporte@jutrip.app'))
const aGente = () => mandados.filter((m) => !m.cuerpo.to.includes('soporte@jutrip.app'))

const con = await montar()
const sin = await montar({ correo: correoSinClave })

// ── 0. El correo (server/correo.js) ──
{
  const r0 = await correoSinClave.enviar({ de: 'a@b.es', para: 'c@d.es', asunto: 'x', texto: 'y' })
  debe(correoSinClave.activo === false && r0.enviado === false && r0.motivo === 'sin_clave', 'correo sin clave: activo false y enviar devuelve sin_clave sin llamar a nadie')
  const antes = mandados.length
  const r1 = await correoConClave.enviar({ de: 'Jutrip <no-reply@jutrip.app>', para: 'ana@x.es', asunto: 'Hola', html: '<p>hola</p>', texto: 'hola' })
  const ultima = mandados[mandados.length - 1]
  debe(correoConClave.activo === true && r1.enviado === true && mandados.length === antes + 1, 'correo con clave: manda UNA petición')
  debe(ultima.url === 'https://api.resend.com/emails' && ultima.auth === `Bearer ${CLAVE_FALSA}` && ultima.cuerpo.from === 'Jutrip <no-reply@jutrip.app>' && ultima.cuerpo.to[0] === 'ana@x.es' && ultima.cuerpo.subject === 'Hola', 'va a la API de Resend, con Authorization Bearer, y el JSON from/to/subject')
  fallaResend = true
  const r2 = await correoConClave.enviar({ de: 'a@b.es', para: 'c@d.es', asunto: 'x', texto: 'y' })
  fallaResend = false
  debe(r2.enviado === false && r2.motivo === 'fallo', 'si Resend dice que no: fallo (sin lanzar)')
  const r3 = await correoConClave.enviar({ de: 'a@b.es', para: 'esto no es un correo', asunto: 'x', texto: 'y' })
  debe(r3.enviado === false && r3.motivo === 'datos', 'un destinatario que no es un correo: datos (no se llama a Resend)')
  mandados.length = 0
}

// ── 1. Seguridad: 401 sin sesión, 403 sin ser administrador, 503 sin clave de servicio ──
const RUTAS = [
  ['GET', '/api/admin/inicio'],
  ['GET', '/api/admin/usuarios'],
  ['GET', '/api/admin/usuarios/totales'],
  ['GET', `/api/admin/usuarios/${id.ana}`],
  ['GET', '/api/admin/ventas'],
  ['POST', `/api/admin/reportes/${rAna}/responder`, { texto: 'Gracias' }],
  ['GET', '/api/admin/destinos'],
  ['POST', '/api/admin/destinos/ya-disponible', { destino: 'Florencia' }],
]
{
  const nuncaLlama = montar
  const sinClaveServicio = await nuncaLlama({ admin: null })
  for (const [metodo, ruta, cuerpo] of RUTAS) {
    const a = await pedir(con, ruta, { token: null, metodo, cuerpo })
    debe(a.estado === 401 && a.json?.ok === false, `${metodo} ${ruta.replace(/[0-9a-f-]{36}/, ':id')} sin sesión: 401`)
    const b = await pedir(con, ruta, { token: 'T-ana', metodo, cuerpo })
    debe(b.estado === 403 && b.json?.ok === false, `${metodo} ${ruta.replace(/[0-9a-f-]{36}/, ':id')} con una cuenta que no es administrador: 403`)
    const c = await pedir(con, ruta, { token: 'T-anon', metodo, cuerpo })
    debe(c.estado === 403, `${metodo} ${ruta.replace(/[0-9a-f-]{36}/, ':id')} con una sesión anónima: 403`)
    const d = await pedir(con, ruta, { token: 'T-que-no-existe', metodo, cuerpo })
    debe(d.estado === 401, `${metodo} ${ruta.replace(/[0-9a-f-]{36}/, ':id')} con un token que no vale: 401`)
    const e = await pedir(sinClaveServicio, ruta, { metodo, cuerpo })
    debe(e.estado === 503, `${metodo} ${ruta.replace(/[0-9a-f-]{36}/, ':id')} sin clave de servicio de Supabase: 503`)
  }
  debe(mandados.length === 0 && (await q("select count(*)::int as n from public.avisos where tipo = 'gracias_viajero'"))[0].n === 0, 'los 401/403/503 no mandan ningún correo ni dejan ningún aviso')
  await new Promise((ok) => sinClaveServicio.s.close(ok))
}

// (V35A) Usuarios, Inicio y Ventas ya NO usan las funciones SQL de la 0090: se calculan en JavaScript sobre la base (server/panel/base.js + calculos.js + calculosUsuarios.js). Sus pruebas viven en pruebaV35A.mjs (cálculos con una base falsa)
// y pruebaV35A_usuarios.mjs. Las secciones 2 a 6 de esta prueba (que probaban esas funciones SQL, ya sin uso) se apartan; las funciones siguen en la migración 0090 por si hiciera falta volver.
const SECCIONES_SQL_APARTADAS = true
if (!SECCIONES_SQL_APARTADAS) {
// ── 2. Usuarios: lista, paginación, búsqueda, filtros y orden ──
let todos
{
  const p1 = await pedir(con, '/api/admin/usuarios')
  debe(p1.estado === 200 && p1.json.ok === true && p1.json.pagina === 1 && p1.json.por_pagina === 50 && p1.json.total === REALES, `la lista cuenta ${REALES} cuentas de verdad (sin la anónima): ${p1.json?.total}`)
  debe(p1.json.usuarios.length === 50, 'la primera página trae 50')
  const p2 = await pedir(con, '/api/admin/usuarios?pagina=2')
  debe(p2.json.usuarios.length === REALES - 50 && p2.json.pagina === 2, `la segunda página trae el resto (${REALES - 50})`)
  const ids = new Set([...p1.json.usuarios, ...p2.json.usuarios].map((u) => u.id))
  debe(ids.size === REALES && !ids.has(id.anonimo), 'las dos páginas no repiten a nadie y no sale la sesión anónima')
  const p3 = await pedir(con, '/api/admin/usuarios?pagina=3')
  debe(p3.json.usuarios.length === 0 && p3.json.total === REALES, 'una página más allá del final viene vacía y el total sigue bien')
  todos = [...p1.json.usuarios, ...p2.json.usuarios]
  const ana = todos.find((u) => u.id === id.ana)
  debe(ana && ana.nombre === 'Ana Pérez' && ana.email === 'ana@x.es' && typeof ana.alta === 'string' && typeof ana.ultimo_acceso === 'string', 'la fila lleva nombre, correo, alta y último acceso')
  debe(ana.nivel === nivelDeExp(1200, datos.exp).nivel && ana.nivel > 1, `el nivel sale de la EXP guardada (${ana.nivel})`)
  debe(ana.pase.tiene === true && JSON.stringify(ana.pase.destinos) === JSON.stringify([{ destino: 'Lanzarote', tipo: 'uno' }, { destino: 'Roma', tipo: 'uno' }]), 'el pase de Ana: tiene y los destinos con su tipo')
  debe(ana.viajes.creados === 2 && ana.viajes.hechos === 1, 'viajes: 2 creados y 1 hecho (el que ya terminó)')
  debe(ana.gastado_cent === 4800 && ana.moneda === 'eur', 'el dinero gastado de Ana suma sus dos pases comprados (4800)')
  debe(ana.primera_vez?.frecuencia === 'dos_o_tres' && ana.primera_vez?.compania === 'pareja' && ana.primera_vez?.anio_nacimiento === 1990, 'las respuestas de la primera vez salen en la fila')
  const bea = todos.find((u) => u.id === id.bea)
  debe(bea.pase.tiene === true && bea.gastado_cent === 0, 'un pase dado a mano cuenta como pase pero 0 € gastados')
  const carlos = todos.find((u) => u.id === id.carlos)
  debe(carlos.pase.tiene === true && carlos.gastado_cent === 0 && carlos.primera_vez === null, 'quien entra con un código tiene pase y 0 €; sin respuestas, primera_vez es null (aunque tenga la fila vacía)')
  const dani = todos.find((u) => u.id === id.dani)
  debe(dani.pase.tiene === false && dani.gastado_cent === 0, 'un pago devuelto ni suma ni da pase')
  const eli = todos.find((u) => u.id === id.eli)
  debe(eli.gastado_cent === 0 && eli.primera_vez?.anio_nacimiento === 2015 && eli.primera_vez?.frecuencia === null, 'un cobro de la pasarela de mentira no suma; y la primera_vez puede llevar solo algún dato')
  debe(todos.find((u) => u.id === id.fran).gastado_cent === 1900, 'Fran gastó 1900')

  const busca = async (consulta) => (await pedir(con, `/api/admin/usuarios?${consulta}`)).json
  let r = await busca('q=ana')
  debe(r.total === 1 && r.usuarios[0].id === id.ana, 'buscar «ana» da a Ana (por nombre o correo)')
  r = await busca('q=P%C3%89REZ'.replace('%C3%89', 'é'))
  debe(r.total === 1 && r.usuarios[0].id === id.ana, 'buscar «pérez» (con tilde) también da a Ana')
  r = await busca('q=PEREZ')
  debe(r.total === 1 && r.usuarios[0].id === id.ana, 'buscar «PEREZ» (mayúsculas, sin tilde) también')
  r = await busca('q=carlos%40x')
  debe(r.total === 1 && r.usuarios[0].id === id.carlos, 'buscar por parte del correo')
  r = await busca('q=%25')
  debe(r.total === 0, 'un «%» en la búsqueda no es un comodín')
  r = await busca('q=_')
  debe(r.total === 0 || r.usuarios.every((u) => `${u.nombre} ${u.email}`.includes('_')), 'un «_» en la búsqueda no es un comodín')
  r = await busca(`q=${'a'.repeat(5000)}`)
  debe(r.ok === true && r.total === 0, 'una búsqueda larguísima se recorta y no rompe nada')
  r = await busca('q=usuario')
  debe(r.total === 60, 'buscar «usuario» da los 60')

  r = await busca('pase=si&por=1')
  debe(r.total === 5 && r.usuarios.every((u) => u.pase.tiene), 'pase=si: los 5 que tienen pase (Ana, Bea, Carlos, Eli y Fran)')
  r = await busca('pase=no')
  debe(r.total === REALES - 5 && r.usuarios.every((u) => !u.pase.tiene), 'pase=no: el resto')
  r = await busca('destino=roma')
  debe(r.usuarios.map((u) => u.id).sort().join() === [id.ana, id.bea, id.carlos, id.eli, id.fran].sort().join(), 'destino=roma: quien tiene un pase o un viaje a Roma')
  r = await busca('destino=Lanzarote')
  debe(r.total === 1 && r.usuarios[0].id === id.ana, 'destino=Lanzarote: solo Ana')
  r = await busca('frecuencia=dos_o_tres')
  debe(r.usuarios.map((u) => u.id).sort().join() === [id.ana, id.dani].sort().join(), 'frecuencia=dos_o_tres: Ana y Dani')
  r = await busca('compania=familia')
  debe(r.total === 1 && r.usuarios[0].id === id.bea, 'compania=familia: Bea')
  r = await busca('frecuencia=dos_o_tres&compania=pareja')
  debe(r.total === 1 && r.usuarios[0].id === id.ana, 'frecuencia y compañía juntas')
  r = await busca('frecuencia=inventada')
  debe(r.total === REALES, 'un filtro que no existe se ignora')
  r = await busca('pase=si&destino=roma&q=ana')
  debe(r.total === 1, 'los filtros se combinan')

  r = await busca('orden=viajes')
  debe(r.usuarios[0].id === id.ana, 'orden=viajes: primero quien más viajes creó')
  r = await busca('orden=gastado')
  debe(r.usuarios[0].id === id.ana && r.usuarios[1].id === id.fran, 'orden=gastado: Ana (4800) y luego Fran (1900)')
  r = await busca('orden=reciente')
  debe(r.usuarios[0].id === id.carlos && r.usuarios[1].id === id.dani, 'orden=reciente: el último en darse de alta primero')
  r = await busca('orden=acceso')
  debe(r.usuarios[0].id === id.bea && r.usuarios[1].id === id.ana, 'orden=acceso: el último en entrar primero (los que nunca, al final)')
  r = await busca('orden=lo-que-sea')
  debe(r.ok === true && r.usuarios[0].id === id.carlos, 'un orden que no existe cae en «reciente»')
}

// ── 3. Totales y respuestas de la primera vez ──
{
  const t = (await pedir(con, '/api/admin/usuarios/totales')).json
  debe(t.ok === true && t.total === REALES && t.con_viaje === 2 && t.nuevos_semana === 2, `totales: ${REALES} cuentas, 2 con viaje (Ana y Bea de invitada) y 2 nuevas esta semana (${t.total}/${t.con_viaje}/${t.nuevos_semana})`)
  debe(t.contestaron === 4, `contestaron 4 (Carlos tiene la fila vacía): ${t.contestaron}`)
  const f = Object.fromEntries(t.respuestas.frecuencia.map((x) => [x.valor, x]))
  debe(f.dos_o_tres.n === 2 && f.dos_o_tres.pct === 66.7 && f.cuatro_o_mas.n === 1 && f.cuatro_o_mas.pct === 33.3 && f.una_vez_al_anio.n === 0 && f.una_vez_al_anio.pct === 0, 'frecuencia: 2 / 1 / 0 con 66,7 % / 33,3 % / 0 % (sobre quienes la contestaron)')
  const c = Object.fromEntries(t.respuestas.compania.map((x) => [x.valor, x]))
  debe(c.pareja.n === 1 && c.familia.n === 1 && c.amigos.n === 1 && c.a_mi_aire.n === 0 && c.pareja.pct === 33.3, 'compañía: 1 pareja, 1 familia, 1 amigos, 0 a mi aire (33,3 % cada una)')
  const e = Object.fromEntries(t.respuestas.edad.map((x) => [x.tramo, x]))
  debe(e['30 – 44'].n === 1 && e['60 o más'].n === 1 && e['Menos de 18'].n === 1 && e['18 – 29'].n === 0 && e['45 – 59'].n === 0 && e['30 – 44'].pct === 33.3, 'edad (del año de nacimiento, con el año del reloj): 1990 → 30 – 44, 1960 → 60 o más, 2015 → Menos de 18')
}

// ── 4. La ficha ──
{
  const f = (await pedir(con, `/api/admin/usuarios/${id.ana}`)).json
  debe(f.ok === true && f.usuario.id === id.ana && f.usuario.email === 'ana@x.es' && f.usuario.gastado_cent === 4800, 'la ficha trae la misma fila de la lista')
  debe(f.viajes.length === 2 && f.viajes[0].inicio === '2026-12-10' && f.viajes[0].grupo === 'solo' && f.viajes[0].miembros === 1, 'viajes: el próximo, solo')
  debe(f.viajes[1].destino === 'Roma' && f.viajes[1].fin === '2026-05-05' && f.viajes[1].grupo === 'grupo' && f.viajes[1].miembros === 2, 'viajes: el hecho, en grupo con 2')
  debe(f.pases.length === 2 && f.pases.some((p) => p.destino === 'Roma' && p.tipo === 'uno' && p.importe_cent === 1900 && p.moneda === 'eur' && typeof p.fecha === 'string') && f.pases.some((p) => p.destino === 'Lanzarote' && p.importe_cent === 2900), 'pases: fecha, destino, tipo e importe de cada uno')
  const sello = datos.destinos.roma.sellos.find((s) => s.id === 'roma')
  debe(f.logros.sellos.length === 1 && f.logros.sellos[0].nombre === sello.nombre && f.logros.sellos[0].grado === 'bronce', 'logros: el sello con su nombre y su grado')
  debe(f.logros.colecciones.hechas === 1 && f.logros.colecciones.total > 1 && JSON.stringify(f.logros.paises) === '["Italia"]' && f.logros.destinos.length === 1, 'logros: colecciones hechas / total, países y destinos')
  debe(f.reportes.length === 1 && f.reportes[0].id === rAna && f.reportes[0].tipo === 'dato_mal' && f.reportes[0].titulo === 'Coliseo' && f.reportes[0].estado === 'nuevo', 'reportes: el suyo, con título y estado')
  const bea = (await pedir(con, `/api/admin/usuarios/${id.bea}`)).json
  debe(bea.pases.length === 1 && bea.pases[0].importe_cent === 0 && bea.viajes.length === 1 && bea.viajes[0].grupo === 'grupo', 'Bea: su pase a mano cuenta 0 € y ve el viaje en el que es invitada')
  const carlos = (await pedir(con, `/api/admin/usuarios/${id.carlos}`)).json
  debe(carlos.pases.length === 1 && carlos.pases[0].importe_cent === 0 && carlos.reportes.length === 1, 'Carlos: el pase al que entró con código cuenta 0 €')
  debe((await pedir(con, '/api/admin/usuarios/no-es-un-id')).estado === 404, 'un id que no es un id: 404')
  debe((await pedir(con, '/api/admin/usuarios/00000000-0000-4000-8000-000000000000')).estado === 404, 'un id que no existe: 404')
  debe((await pedir(con, `/api/admin/usuarios/${id.anonimo}`)).estado === 404, 'una sesión anónima no tiene ficha: 404')
}

// ── 5. Ventas ──
{
  const v = (await pedir(con, '/api/admin/ventas')).json
  debe(v.ok === true && v.importes_conocidos === true, 'ventas: importes conocidos')
  debe(v.pases_hoy === 1 && v.pases_mes === 2 && v.ingresos_mes_cent === 4800 && v.moneda === 'eur', `ventas: 1 hoy, 2 este mes, 4800 € de céntimos (${v.pases_hoy}/${v.pases_mes}/${v.ingresos_mes_cent})`)
  debe(v.por_dia.length === 30 && v.por_dia[29].dia === '2026-11-20' && v.por_dia[29].n === 1 && v.por_dia.find((x) => x.dia === '2026-10-25').n === 1, 'por_dia: 30 días, acabando hoy, con el de octubre')
  debe(JSON.stringify(v.por_destino) === JSON.stringify([{ destino: 'Roma', n: 2 }, { destino: 'Lanzarote', n: 1 }]), 'por_destino: Roma 2, Lanzarote 1 (sin lo devuelto ni lo de mentira)')
  debe(v.compras.length === 3 && v.compras[0].destino === 'Roma' && v.compras[0].importe_cent === 1900 && Object.keys(v.compras[0]).sort().join() === 'destino,fecha,importe_cent,moneda,tipo', 'compras: las últimas, solo con fecha, destino, tipo, importe y moneda')
  // Un pase con cobro que no está en el registro (no debería existir): importes_conocidos pasa a false.
  await q("insert into public.passes (destino, comprador_id, tipo, usos_max, usos_usados, codigo, pago_ref) values ('Roma', $1, 'uno', 1, 1, 'CODIGOVIEJO', 'cs_viejo_sin_registro')", [id.fran])
  const v2 = (await pedir(con, '/api/admin/ventas')).json
  debe(v2.importes_conocidos === false, 'importes_conocidos es false si algún pase con cobro no tiene importe')
  await q("delete from public.passes where codigo = 'CODIGOVIEJO'")
}

// ── 6. Inicio ──
{
  const i = (await pedir(con, '/api/admin/inicio')).json
  debe(i.ok === true && i.reportes_nuevos === 3 && i.fotos_por_aprobar === 1, `inicio: 3 reportes nuevos y 1 foto por aprobar (${i.reportes_nuevos}/${i.fotos_por_aprobar})`)
  debe(i.pases.hoy === 1 && i.pases.mes === 2 && i.ingresos.hoy_cent === 1900 && i.ingresos.mes_cent === 4800 && i.ingresos.moneda === 'eur', 'inicio: pases e ingresos de hoy y del mes')
  debe(i.usuarios.hoy === 1 && i.usuarios.semana === 2 && i.usuarios.total === REALES && i.usuarios.con_viaje === 2, `inicio: usuarios hoy 1, semana 2, total ${REALES}, con viaje 2`)
  debe(i.serie14.length === 14 && i.serie14[13].dia === '2026-11-20' && i.serie14[13].pases === 1 && i.serie14[0].dia === '2026-11-07' && i.serie14.reduce((s, x) => s + x.pases, 0) === 1, 'inicio: serie de 14 días acabando hoy')
  debe(i.atencion.length === 7 && ['reporte', 'foto', 'fallo', 'venta'].every((t) => i.atencion.some((x) => x.tipo === t)) && i.atencion.every((x) => x.titulo && x.en), 'inicio: «necesita atención» con reportes, foto, fallo y ventas')
  debe(i.correo.activo === true, 'inicio: correo.activo true con clave')
  const s = (await pedir(sin, '/api/admin/inicio')).json
  debe(s.ok === true && s.correo.activo === false, 'inicio sin RESEND_API_KEY: funciona y dice correo.activo false')
  debe(aSoporte().length === 1, 'el inicio (con clave) mandó UN correo interno con los reportes que esperaban')
  mandados.length = 0
}

}

// ── 7. [Responder] ──
{
  const ok = await pedir(con, `/api/admin/reportes/${rAna}/responder`, { metodo: 'POST', cuerpo: { texto: 'Gracias, ya lo hemos arreglado.' } })
  debe(ok.estado === 200 && ok.json.ok === true && ok.json.campana === true && ok.json.correo === 'enviado', 'responder a una cuenta con «avísame»: campana y correo enviado')
  const camp = await q("select payload from public.avisos where user_id = $1 and tipo = 'gracias_viajero'", [id.ana])
  debe(camp.length === 1 && camp[0].payload.texto === 'Gracias, ya lo hemos arreglado.' && camp[0].payload.aviso_id === rAna, 'el aviso queda en la campana de Ana con el texto')
  const mail = aGente()[0]
  debe(aGente().length === 1 && mail.cuerpo.to.join() === 'ana@x.es' && mail.cuerpo.from === 'Jutrip Soporte <soporte@jutrip.app>' && /Gracias, ya lo hemos arreglado/.test(mail.cuerpo.html) && /JUTRIP/.test(mail.cuerpo.html) && mail.cuerpo.subject.length > 3, 'el correo va a Ana, desde «Jutrip Soporte <soporte@jutrip.app>», con la marca y el texto')
  debe((await q('select estado from public.avisos_de_viajeros where id = $1', [rAna]))[0].estado === 'visto', 'el reporte pasa de «nuevo» a «visto»')
  const otra = await pedir(con, `/api/admin/reportes/${rAna}/responder`, { metodo: 'POST', cuerpo: { texto: 'Otra cosa más.' } })
  debe(otra.json.correo === 'enviado' && (await q("select count(*)::int as n from public.avisos where user_id = $1 and tipo = 'gracias_viajero'", [id.ana]))[0].n === 2, 'se puede responder otra vez (otro aviso)')
  mandados.length = 0
  const noAv = await pedir(con, `/api/admin/reportes/${rCarlos}/responder`, { metodo: 'POST', cuerpo: { texto: 'Lo miramos.' } })
  debe(noAv.json.campana === true && noAv.json.correo === 'no_avisame' && aGente().length === 0, 'cuenta sin «avísame»: campana sí, correo no (no_avisame)')
  const anon = await pedir(con, `/api/admin/reportes/${rAnon}/responder`, { metodo: 'POST', cuerpo: { texto: 'Gracias por la idea.' } })
  debe(anon.json.campana === false && anon.json.correo === 'sin_cuenta' && aGente().length === 0, 'reporte sin cuenta: ni campana ni correo (sin_cuenta)')
  const sc = await pedir(sin, `/api/admin/reportes/${rAna}/responder`, { metodo: 'POST', cuerpo: { texto: 'Sin clave de correo.' } })
  debe(sc.estado === 200 && sc.json.ok === true && sc.json.campana === true && sc.json.correo === 'sin_clave' && aGente().length === 0, 'sin RESEND_API_KEY: deja el aviso, no manda nada y dice sin_clave')
  debe((await pedir(con, `/api/admin/reportes/${rAna}/responder`, { metodo: 'POST', cuerpo: { texto: 'x' } })).estado === 400, 'una respuesta de 1 carácter: 400')
  debe((await pedir(con, `/api/admin/reportes/${rAna}/responder`, { metodo: 'POST', cuerpo: { texto: 'x'.repeat(301) } })).estado === 400, 'una respuesta de 301 caracteres: 400')
  debe((await pedir(con, `/api/admin/reportes/${rAna}/responder`, { metodo: 'POST', cuerpo: { texto: 'x'.repeat(300) } })).estado === 200, 'una respuesta de 300 caracteres: vale')
  debe((await pedir(con, '/api/admin/reportes/00000000-0000-4000-8000-000000000000/responder', { metodo: 'POST', cuerpo: { texto: 'Hola' } })).estado === 404, 'un reporte que no existe: 404')
  debe((await pedir(con, '/api/admin/reportes/no-es-un-id/responder', { metodo: 'POST', cuerpo: { texto: 'Hola' } })).estado === 404, 'un id que no es un id: 404')
  fallaResend = true
  const f = await pedir(con, `/api/admin/reportes/${rAna}/responder`, { metodo: 'POST', cuerpo: { texto: 'Si Resend falla.' } })
  fallaResend = false
  debe(f.estado === 200 && f.json.campana === true && f.json.correo === 'fallo', 'si Resend falla: la campana queda y se dice fallo')
  mandados.length = 0
}

// ── 8. El aviso interno a soporte@ (un correo cada 15 minutos, juntos) ──
{
  await q("update public.avisos_de_viajeros set notificado_en = '2026-01-01T00:00:00Z'")
  const reportar = (texto, minuto) => {
    reloj = minutos(minuto)
    return pedir(con, '/api/avisos-viajeros', { token: 'T-ana', metodo: 'POST', cuerpo: { tipo: 'idea', datos: { texto }, destino: 'Roma', avisame: true } })
  }
  const a = await reportar('Idea uno de prueba', 0)
  debe(a.estado === 200 && a.json.guardado === true && aSoporte().length === 1, 'entra un reporte: sale UN correo a soporte@')
  const m1 = aSoporte()[0]?.cuerpo
  debe(m1.from === 'Jutrip <no-reply@jutrip.app>' && m1.to.join() === 'soporte@jutrip.app', 'el correo interno va a soporte@jutrip.app desde no-reply@jutrip.app')
  debe(m1.html.includes(`https://app.test/admin?reporte=${a.json.id}`) && /Idea uno de prueba/.test(m1.html) && /Roma/.test(m1.html), 'lleva el tipo, el destino, el texto y el enlace al reporte en el panel (APP_URL/admin?reporte=<id>)')
  debe(!/ana@x\.es/i.test(JSON.stringify(m1)) && !/@x\.es/.test(m1.subject), 'NO lleva el correo del viajero (ni en el asunto ni en el cuerpo)')
  const b = await reportar('Idea dos de prueba', 1)
  const c = await reportar('Idea tres de prueba', 2)
  debe(aSoporte().length === 1, 'dos reportes más en los 15 minutos: NO salen más correos')
  debe((await q("select count(*)::int as n from public.avisos_de_viajeros where id = any($1::uuid[]) and notificado_en is null", [[b.json.id, c.json.id]]))[0].n === 2, 'esos dos quedan esperando (sin notificar)')
  const d = await reportar('Idea cuatro de prueba', 16)
  debe(aSoporte().length === 2, 'pasados 15 minutos: sale el siguiente correo')
  const m2 = aSoporte()[1]?.cuerpo
  const enlaces = (m2.html.match(/admin\?reporte=/g) ?? []).length
  debe(enlaces === 3 && /3 reportes nuevos/.test(m2.subject) && [b.json.id, c.json.id, d.json.id].every((x) => m2.html.includes(x)), 'los reportes seguidos van JUNTOS en UN correo (3 enlaces)')
  debe(!/@x\.es/.test(JSON.stringify(m2)), 'el correo juntado tampoco lleva el correo de nadie')
  await guardar({ tipo: 'idea', datos: { texto: 'Esta entró sin pasar por el gancho' }, avisame: false })
  reloj = minutos(20)
  await pedir(con, '/api/admin/inicio')
  debe(aSoporte().length === 2, 'el inicio, dentro de los 15 minutos, no manda nada')
  reloj = minutos(40)
  await pedir(con, '/api/admin/inicio')
  debe(aSoporte().length === 3 && /Esta entró sin pasar por el gancho/.test(aSoporte()[2].cuerpo.html), 'el inicio también dispara el aviso cuando toca (pasados 15 minutos)')
  // Si Resend falla, los reportes quedan para el siguiente intento.
  await guardar({ tipo: 'idea', datos: { texto: 'Para cuando falle el correo' }, avisame: false })
  reloj = minutos(80)
  fallaResend = true
  await pedir(con, '/api/admin/inicio')
  fallaResend = false
  debe((await q("select count(*)::int as n from public.avisos_de_viajeros where datos ->> 'texto' = 'Para cuando falle el correo' and notificado_en is null"))[0].n === 1, 'si el correo interno falla, el reporte queda sin notificar para el siguiente intento')
  // Sin clave: no hace nada y no marca nada.
  const antes = mandados.length
  const sinMarcar = (await q('select count(*)::int as n from public.avisos_de_viajeros where notificado_en is null'))[0].n
  reloj = minutos(120)
  const s = await pedir(sin, '/api/avisos-viajeros', { token: 'T-ana', metodo: 'POST', cuerpo: { tipo: 'idea', datos: { texto: 'Reporte sin clave de correo' }, avisame: false } })
  debe(s.estado === 200 && s.json.guardado === true && mandados.length === antes && (await q('select count(*)::int as n from public.avisos_de_viajeros where notificado_en is null'))[0].n === sinMarcar + 1, 'sin RESEND_API_KEY el reporte se guarda y el aviso interno no hace nada (ni marca)')
  reloj = T0
  mandados.length = 0
}

// ── 9. Destinos y [Ya está disponible] ──
{
  const d0 = (await pedir(con, '/api/admin/destinos')).json
  const porNombre = Object.fromEntries(d0.proximamente.map((x) => [x.destino, x]))
  debe(d0.ok === true && d0.correo.activo === true && d0.proximamente.map((x) => x.destino).join() === 'Florencia,Berlín,Cartagena de Indias', 'destinos: los Próximamente de data/primera_vez/destinos.json')
  debe(porNombre['Florencia'].avisos === 3 && porNombre['Florencia'].avisados === 0 && porNombre['Berlín'].avisos === 1 && porNombre['Cartagena de Indias'].avisos === 1, 'destinos: cuántos pulsaron «Avísame» en cada uno')
  debe(d0.pedidos[0].destino.toLowerCase() === 'florencia' && d0.pedidos[0].veces === 3 && d0.pedidos.length === 3, 'destinos: lo pedido (agrupado por destino, de más a menos)')
  debe((await pedir(sin, '/api/admin/destinos')).json.correo.activo === false, 'destinos sin clave: correo.activo false')

  const y1 = await pedir(con, '/api/admin/destinos/ya-disponible', { metodo: 'POST', cuerpo: { destino: 'Florencia' } })
  debe(y1.estado === 200 && y1.json.ok === true && y1.json.campana === 2 && y1.json.correos === 3 && y1.json.ya_avisados === 0 && y1.json.correo === 'activo', `ya-disponible: 2 campanas (con cuenta), 3 correos, 0 ya avisados (${JSON.stringify(y1.json)})`)
  const camp = await q("select user_id, payload from public.avisos where tipo = 'gracias_viajero' and payload ->> 'tipo' = 'destino' order by user_id")
  debe(camp.length === 2 && camp.every((x) => /Florencia ya está en JUTRIP/.test(x.payload.texto)) && camp.some((x) => x.user_id === id.ana) && camp.some((x) => x.user_id === id.bea), 'la campana de Ana y de Bea dice que Florencia ya está')
  debe(aGente().length === 3 && aGente().map((m) => m.cuerpo.to[0]).sort().join() === 'f1@x.es,f2@x.es,f3@x.es' && aGente().every((m) => m.cuerpo.from === 'Jutrip Soporte <soporte@jutrip.app>' && /Florencia/.test(m.cuerpo.subject) && /JUTRIP/.test(m.cuerpo.html)), 'los 3 correos van a quien pulsó «Avísame» (también al que no tiene cuenta), con la marca')
  const y2 = await pedir(con, '/api/admin/destinos/ya-disponible', { metodo: 'POST', cuerpo: { destino: 'Florencia' } })
  debe(y2.json.campana === 0 && y2.json.correos === 0 && y2.json.ya_avisados === 3 && aGente().length === 3, 'la segunda vez: 0 nuevos (ni campana ni correo), 3 ya avisados')
  const y3 = await pedir(con, '/api/admin/destinos/ya-disponible', { metodo: 'POST', cuerpo: { destino: '  FLORENCIA ' } })
  debe(y3.json.campana === 0 && y3.json.correos === 0 && aGente().length === 3, 'escrito distinto (mayúsculas y espacios) tampoco repite')
  debe((await q("select count(*)::int as n from public.avisos where tipo = 'gracias_viajero' and payload ->> 'tipo' = 'destino'"))[0].n === 2, 'en la campana sigue habiendo un solo aviso por persona')
  const d1 = (await pedir(con, '/api/admin/destinos')).json
  debe(d1.proximamente.find((x) => x.destino === 'Florencia').avisados === 3, 'destinos: Florencia ya tiene 3 avisados')
  debe((await pedir(con, '/api/admin/destinos/ya-disponible', { metodo: 'POST', cuerpo: { destino: 'x' } })).estado === 400, 'ya-disponible sin destino: 400')

  // Sin clave: campana sí, correo no (y no se marca para poder mandarlo después).
  mandados.length = 0
  const s1 = await pedir(sin, '/api/admin/destinos/ya-disponible', { metodo: 'POST', cuerpo: { destino: 'Berlín' } })
  debe(s1.json.campana === 1 && s1.json.correos === 0 && s1.json.correo === 'sin_clave' && mandados.length === 0, 'sin RESEND_API_KEY: campana sí, correo no, y lo dice (sin_clave)')
  debe((await q("select avisado_correo_en from public.avisos_destino where destino_norm = 'berlin'"))[0].avisado_correo_en === null, 'el correo de Berlín no se marca como mandado (se podrá mandar luego)')
  const s2 = await pedir(con, '/api/admin/destinos/ya-disponible', { metodo: 'POST', cuerpo: { destino: 'Berlín' } })
  debe(s2.json.campana === 0 && s2.json.correos === 1 && aGente().length === 1 && aGente()[0].cuerpo.to[0] === 'b1@x.es', 'cuando ya hay clave: el correo pendiente sale, y la campana no se repite')
  const s3 = await pedir(con, '/api/admin/destinos/ya-disponible', { metodo: 'POST', cuerpo: { destino: 'Berlín' } })
  debe(s3.json.campana === 0 && s3.json.correos === 0 && s3.json.ya_avisados === 1, 'y la siguiente vez, nada')
  // Si Resend falla, no se da por avisado.
  mandados.length = 0
  fallaResend = true
  const f1 = await pedir(con, '/api/admin/destinos/ya-disponible', { metodo: 'POST', cuerpo: { destino: 'Cartagena de Indias' } })
  fallaResend = false
  debe(f1.json.correos === 0 && f1.json.quedan === 1 && (await q("select avisado_correo_en from public.avisos_destino where destino_norm = 'cartagena de indias'"))[0].avisado_correo_en === null, 'si Resend falla, el correo no se da por mandado (quedan 1)')
  const f2 = await pedir(con, '/api/admin/destinos/ya-disponible', { metodo: 'POST', cuerpo: { destino: 'Cartagena de Indias' } })
  debe(f2.json.correos === 1 && f2.json.quedan === 0, 'y al repetir, sale')
  mandados.length = 0
}

// ── 10. Privacidad: ni una palabra de tarjeta, claves o contraseñas en ninguna respuesta ──
{
  const todo = cuerpos.join('\n').toLowerCase()
  debe(cuerpos.length > 60, `se han recorrido ${cuerpos.length} respuestas`)
  for (const palabra of ['card', 'stripe_', 'stripe', 'password', 'token', 'secret', 'recibo', 'intencion', 'pago_ref', 'cs_mock', 'pi_mock', CLAVE_FALSA]) debe(!todo.includes(palabra.toLowerCase()), `ninguna respuesta lleva «${palabra}»`)
  debe(!/resend_api_key|re_[a-z0-9]{20,}/i.test(todo), 'ninguna respuesta lleva la clave de Resend')
  // (V35A) La ficha ya no sale de la base de esta prueba (se calcula en JavaScript): que no enseña ids de otras tablas ni códigos de pase se comprueba en pruebaV35A_usuarios.mjs.
}

await new Promise((ok) => con.s.close(ok))
await new Promise((ok) => sin.s.close(ok))
await bd.db.close()

console.log(`\nLa prueba del servidor del Panel de Jutrip (V33): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log('  FALLO', f)
process.exit(fallos.length ? 1 : 0)
