// La prueba de la Tanda V27: el Pase Dúo que no le llegó a Alicia (quien ya está en el viaje recibe la plaza) y lo que vio Eric en el móvil (días «Hecho», excursión repetida, franja blanca, foto de la excursión, viaje terminado).
//   node scripts/destino/pruebaV27.mjs                                    (la parte de la base de datos y las puras, sin servidores)
//   node scripts/destino/_conCola.mjs node scripts/destino/pruebaV27.mjs  (con Vite en 5173 y la API en 8787: también la parte de la app)
// Ninguna parte toca el Supabase de producción: la base de datos es PGlite con TODAS las migraciones.
import fs from 'node:fs'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'

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

/* ───────── 1. La base de datos: la plaza del Dúo para quien YA está en el viaje ───────── */
console.log('1. La base de datos (PGlite, migraciones reales): el Dúo de Alicia')
const db = new PGlite()
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, is_anonymous boolean not null default false, created_at timestamptz default now());
  create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean default false);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets (id), name text, owner uuid, created_at timestamptz default now(), unique (bucket_id, name));
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
`)
const noAplicadas = []
for (const archivo of fs.readdirSync('supabase/migrations').filter((f) => /^\d{4}_.*\.sql$/.test(f)).sort()) {
  try {
    await db.exec(leer(path.join('supabase/migrations', archivo)))
  } catch (error) {
    noAplicadas.push(`${archivo}: ${String(error.message).slice(0, 90)}`)
  }
}
debe(!noAplicadas.some((x) => /^008[78]/.test(x)), 'migracion', `las migraciones 0087 y 0088 se aplican (${noAplicadas.filter((x) => /^008[78]/.test(x)).join(' | ')})`)
await db.exec(leer('supabase/migrations/0088_plaza_del_pase_a_quien_ya_esta.sql')) // idempotente: pegada otra vez
const comprobar = leer('docs/dias/COMPROBAR_0088.sql')
debe((await db.query(comprobar)).rows.length === 1 && (await db.query(comprobar)).rows[0]?.migracion_0088 === 'Aplicada', 'migracion', 'COMPROBAR_0088.sql da UN resultado: «Aplicada»')
await db.exec(`
  grant usage on schema public, auth, storage to anon, authenticated, service_role;
  grant all on all tables in schema public to authenticated, service_role;
  grant all on all tables in schema storage to authenticated, service_role;
  grant select on auth.users to authenticated, service_role;
  grant execute on all functions in schema public to authenticated, service_role;
  grant execute on all functions in schema auth to anon, authenticated, service_role;
`)
const q = async (sql, params = []) => (await db.query(sql, params)).rows
const como = async (uid, fn) => {
  await db.exec('reset role')
  await db.exec('set role service_role')
  const claims = uid ? JSON.stringify({ sub: uid, is_anonymous: false, role: 'authenticated' }) : ''
  try {
    if (uid) {
      await db.query("select set_config('request.jwt.claims', $1, false)", [claims])
      await db.exec('set role authenticated')
    }
    return await fn()
  } finally {
    await db.exec('reset role')
    await db.exec('set role service_role')
    await db.query("select set_config('request.jwt.claims', '', false)")
  }
}
const servidor = (fn) => como(null, fn)
const usuario = async (email) => {
  await db.exec('reset role')
  const id = (await q('insert into auth.users (email, is_anonymous) values ($1, false) returning id', [email]))[0].id
  await q('insert into public.travelers (id, is_anonymous) values ($1, false) on conflict (id) do nothing', [id])
  return id
}

const eric = await usuario('eric@ejemplo.es')
const alicia = await usuario('alicia@ejemplo.es')
const bea = await usuario('bea@ejemplo.es')
const viaje = (await servidor(() => q("insert into public.trips (traveler_id, route) values ($1, '{\"destination\":\"Lanzarote\"}') returning id", [eric])))[0].id
const pase = (await servidor(() => q("insert into public.passes (destino, comprador_id, tipo, usos_max, usos_usados, codigo, trip_id) values ('Lanzarote',$1,'duo',2,1,'PASE-DUO-1',$2) returning id", [eric, viaje])))[0].id
await servidor(() => q('insert into public.pass_members (pass_id, user_id) values ($1,$2)', [pase, eric]))
await servidor(() => q("insert into public.trip_invitations (trip_id, creada_por, codigo, pass_id, usos_max) values ($1,$2,'CODPASE1',$3,2)", [viaje, eric, pase]))
await servidor(() => q("insert into public.trip_invitations (trip_id, creada_por, codigo, usos_max) values ($1,$2,'CODVIAJE',10)", [viaje, eric]))
// Alicia y Bea YA están en el viaje (por el código del viaje compartido), sin pase.
for (const u of [alicia, bea]) await servidor(() => q("insert into public.trip_members (trip_id, user_id, invited_by, permiso) values ($1,$2,$3,'recomendar')", [viaje, u, eric]))
const estado = async () => ({
  pase: (await servidor(() => q('select usos_usados from public.passes where id = $1', [pase])))[0].usos_usados,
  dentro: (await servidor(() => q('select user_id from public.pass_members where pass_id = $1', [pase]))).map((r) => r.user_id),
  miembroConPase: (await servidor(() => q('select user_id from public.trip_members where trip_id = $1 and pass_id = $2', [viaje, pase]))).map((r) => r.user_id),
})

// Con el código del VIAJE (sin pase) quien ya está dentro no recibe plaza.
const viajeSolo = await como(alicia, async () => (await q("select public.canjear_invitacion('CODVIAJE') as r"))[0].r)
debe(viajeSolo.ya_estaba === true && !viajeSolo.plaza_dada && (await estado()).dentro.length === 1, 'codigo_viaje', 'el código del VIAJE no da ninguna plaza del pase a quien ya está dentro')
// Con el código del PASE: Alicia, que ya estaba en el viaje, recibe la plaza.
const r1 = await como(alicia, async () => (await q("select public.canjear_invitacion('CODPASE1') as r"))[0].r)
let e = await estado()
debe(r1.ya_estaba === true && r1.plaza_dada === true, 'duo', 'Alicia, que YA estaba en el viaje, canjea el código del pase y recibe la plaza (plaza_dada)')
debe(e.dentro.includes(alicia) && e.pase === 2 && e.miembroConPase.includes(alicia), 'duo', 'queda en pass_members, usos 2 de 2 y su fila de trip_members lleva el pase')
// Otra vez: no se duplica.
const r2 = await como(alicia, async () => (await q("select public.canjear_invitacion('CODPASE1') as r"))[0].r)
e = await estado()
debe(r2.plaza_dada === false && e.pase === 2 && e.dentro.filter((u) => u === alicia).length === 1, 'duo', 'canjearlo otra vez no la duplica ni gasta otra plaza (Eric ya la había metido a mano: lo mismo)')
// Bea: el pase está lleno.
const r3 = await como(bea, async () => (await q("select public.canjear_invitacion('CODPASE1') as r"))[0].r)
e = await estado()
debe(r3.ya_estaba === true && r3.plaza_dada === false && !e.dentro.includes(bea) && e.pase === 2, 'duo', 'con el pase lleno (2 de 2), otra persona del viaje no entra en el pase (no se pasa de las plazas)')
// El comprador con su propio código: nada.
const r4 = await como(eric, async () => (await q("select public.canjear_invitacion('CODPASE1') as r"))[0].r)
debe(r4.plaza_dada === false && (await estado()).pase === 2, 'duo', 'quien compró el pase, con su propio código, no gasta una plaza')

// «Dar la plaza a…»: un Dúo nuevo, sin código.
const viaje2 = (await servidor(() => q("insert into public.trips (traveler_id, route) values ($1, '{\"destination\":\"Lanzarote\"}') returning id", [eric])))[0].id
const pase2 = (await servidor(() => q("insert into public.passes (destino, comprador_id, tipo, usos_max, usos_usados, codigo, trip_id) values ('Lanzarote',$1,'duo',2,1,'PASE-DUO-2',$2) returning id", [eric, viaje2])))[0].id
await servidor(() => q('insert into public.pass_members (pass_id, user_id) values ($1,$2)', [pase2, eric]))
for (const u of [alicia, bea]) await servidor(() => q("insert into public.trip_members (trip_id, user_id, invited_by, permiso) values ($1,$2,$3,'recomendar')", [viaje2, u, eric]))
const lista = await como(eric, async () => (await q('select public.plazas_sin_dar($1) as r', [pase2]))[0].r)
debe(Array.isArray(lista) && lista.length === 2 && lista.every((p) => [alicia, bea].includes(p.id)), 'dar', '«Dar la plaza a…» lista a los dos miembros del viaje que aún no tienen plaza')
const listaDeOtro = await como(alicia, async () => (await q('select public.plazas_sin_dar($1) as r', [pase2]))[0].r)
debe(Array.isArray(listaDeOtro) && listaDeOtro.length === 0, 'dar', 'quien no compró el pase no ve esa lista')
await como(eric, () => q('select public.dar_plaza_del_pase($1, $2)', [pase2, alicia]))
const t1 = await servidor(() => q('select usos_usados from public.passes where id = $1', [pase2]))
const t2 = await servidor(() => q('select user_id from public.trip_members where trip_id = $1 and pass_id = $2', [viaje2, pase2]))
debe(t1[0].usos_usados === 2 && t2.length === 1 && t2[0].user_id === alicia, 'dar', 'dar la plaza a Alicia: usos 2 de 2, y su fila del viaje lleva el pase')
let error = null
try {
  await como(eric, () => q('select public.dar_plaza_del_pase($1, $2)', [pase2, bea]))
} catch (x) {
  error = String(x.message)
}
debe(/no quedan plazas/i.test(error ?? ''), 'dar', `con el pase lleno no se puede dar otra plaza (${error})`)
error = null
try {
  await como(alicia, () => q('select public.dar_plaza_del_pase($1, $2)', [pase2, bea]))
} catch (x) {
  error = String(x.message)
}
debe(/solo quien compr/i.test(error ?? ''), 'dar', `solo quien compró el pase puede dar plazas (${error})`)
const avisos = await servidor(() => q('select count(*)::int as n from public.trip_cambios where trip_id = $1', [viaje2]))
debe(avisos[0].n === 1, 'aviso', 'al entrar alguien en el pase, el viaje avisa (trip_cambios) para que a su móvil le llegue el pase sin cerrar la app')

/* ───────── 2. Las reglas puras y el texto ───────── */
console.log('2. Reglas puras')
{
  const { completarExcursion } = await import('../../src/lib/excursionesDatos.ts')
  const datos = JSON.parse(leer('public/datos/excursiones.json'))
  const stub = { id: 'la_graciosa', title: 'La Graciosa', length: 'full-day', durationLabel: 'Día completo', price: 0, photoUrl: null, photoUrlBig: null }
  const c = completarExcursion(stub, datos)
  debe(Boolean(c.photoUrl) && c.price === 74 && c.rating === 9.1 && c.reviewCount === 2332 && c.ratingMax === 10, 'excursion', 'La Graciosa sin ficha se completa con la de Civitatis: foto, desde 74 €, 9,1/10 y 2.332 opiniones')
  const sinOperador = completarExcursion(stub, { la_graciosa: { fotoPropia: '/fotos/lanzarote/la_graciosa.jpg' } })
  debe(sinOperador.photoUrl === '/fotos/lanzarote/la_graciosa.jpg' && fs.existsSync('public/fotos/lanzarote/la_graciosa.jpg'), 'excursion', 'sin foto del operador, la foto propia de La Graciosa (la_graciosa.jpg): nunca el degradado vacío')
  debe(completarExcursion({ ...stub, price: 99, photoUrl: '/mia.jpg' }, datos).price === 99 && completarExcursion({ ...stub, price: 99, photoUrl: '/mia.jpg' }, datos).photoUrl === '/mia.jpg', 'excursion', 'nunca se pisa un dato que el viaje ya trae')
  const roma = Object.keys(datos).filter((k) => /pompeya|florencia/.test(k))
  debe(roma.length >= 2 && roma.every((k) => datos[k].photoUrl), 'excursion', 'en Roma (Pompeya, Florencia…) también hay foto y datos para cada excursión')
}

/* ───────── 3. El código del repo ───────── */
console.log('3. El código')
{
  const hoja = leer('src/components/pase/HojaInvitar.tsx')
  const plaza = leer('src/components/pase/PlazaDelPase.tsx')
  const mis = leer('src/components/ajustes/MisPases.tsx')
  debe(/AZUL_PASE/.test(plaza) && /ORO_PASE/.test(plaza) && /CodigoDeLaPlaza/.test(hoja) && /CodigoDeLaPlaza/.test(mis), 'azul', 'el código y el botón de la plaza del pase llevan el azul y el dorado del pase (en la hoja de invitar y en «Mis pases»)')
  debe(/DarLaPlaza/.test(hoja) && /DarLaPlaza/.test(mis), 'dar', '«Dar la plaza a…» sale en la hoja del pase y en «Mis pases»')
  debe(!/CodigoDeLaPlaza/.test(leer('src/components/compartir/PersonasDelViaje.tsx')), 'azul', 'el código de unirse a un VIAJE sigue con los colores de siempre')
  const visto = leer('src/components/logros/visto/VistoFlujo.tsx')
  debe(/hoy > f\.fin\)\) return false/.test(visto), 'ayer', '«Lo de ayer también cuenta» no sale sola con el viaje terminado')
  const hojas = leer('src/components/logros/visto/Hojas.tsx')
  debe(/paradas\.some\(\(p\) => miniaturas\[p\.stopId\]\)/.test(hojas), 'ayer', '«Lo de ayer…» nunca enseña huecos de colores vacíos')
  const porVisto = leer('src/components/logros/LogrosPorVisto.tsx')
  debe(/esEcoRemoto/.test(porVisto) && /sinHoja/.test(porVisto), 'recuerdo', 'un [Visto] que llega de otro móvil no abre «Guarda un recuerdo»; con el viaje terminado tampoco')
  debe(/data-hueco-solo-anadir/.test(leer('src/components/route/dayDetail/StopConnector.tsx')) && /data-hueco-solo-anadir/.test(leer('src/index.css')), 'franja', 'el hueco que solo traía «+ Añadir parada» desaparece cuando esa herramienta no se ve (la franja blanca)')
  const lista = leer('src/components/route/DayList.tsx')
  debe(!/#F3EEE2|#CFC8B6/.test(lista), 'gris', 'los días «Hecho» ya no llevan el gris (ni el fondo ni la franja)')
  debe(/\bml-2\.5 rounded-3xl/.test(lista) && /-left-\[34px\]/.test(lista), 'alineado', '(V38, decisión de Eric: «las tres rayas de DÍAS otra vez a la izquierda») todas las tarjetas llevan el mismo desplazamiento de 10 px para dejar sitio al asa')
  debe(/!pasado && \(day\.excursions/.test(lista), 'reservar', 'en un día «Hecho» no sale «Sin reservar»')
}

if (!process.env.APP_URL && !(await fetch('http://localhost:5173').then((r) => r.ok).catch(() => false))) {
  console.log('(sin Vite en 5173: la parte de la app se salta)')
  console.log(`\nPrueba de la Tanda V27: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}

/* ───────── 4. En la app ───────── */
console.log('4. En la app (móvil de 375 px)')
const { abrirApp } = await import('./_enLaApp.mjs')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const CAP = 'docs/dias/V27_capturas'
fs.mkdirSync(CAP, { recursive: true })
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=off&apertura=0', ancho: 375, alto: 812 })
try {
  for (let i = 0; i < 120 && !(await a.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
  for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 60 && !(await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
  await a.esp(3500)
  // El viaje de pruebas (Roma, 17 a 20 oct) visto el 19 de octubre: los días 1 y 2 ya pasaron. El día 3 se vuelve de excursión (como en Lanzarote: La Graciosa sin ficha) y el 4 repite el nombre.
  await a.evaluar(`import('/src/store/useRouteStore.ts').then((m) => {
    const st = m.useRouteStore.getState()
    const dias = st.route.days.map((d) => ({ ...d }))
    const exc = [{ id: 'la_graciosa', title: 'La Graciosa', length: 'full-day', durationLabel: 'Día completo', price: 0, photoUrl: null, photoUrlBig: null, bookUrl: 'https://www.civitatis.com/es/buscar?q=La%20Graciosa' }]
    dias[2] = { ...dias[2], dayType: 'excursion', curatedTitle: 'La Graciosa (excursión)', stops: [], excursions: exc }
    dias[3] = { ...dias[3], dayType: 'excursion', curatedTitle: 'La Graciosa (excursión)', stops: [], excursions: exc }
    m.useRouteStore.setState({ route: { ...st.route, days: dias }, dev_simulated_today_iso: '2026-10-19' })
    m.useRouteStore.getState().setMode('days')
    return true
  })`)
  await a.esp(3000)
  for (let k = 0; k < 4; k++) {
    await a.evaluar("(() => { const b = document.querySelector('button[aria-label=Cerrar]'); if (b) b.click(); return !!b })()")
    await a.esp(500)
  }
  const puras = JSON.parse(await a.evaluar(`Promise.all([import('/src/lib/tituloDelDia.ts'), import('/src/lib/invitaciones.ts')]).then(([t, inv]) => {
    const dia = (n, extra = {}) => ({ id: 'd' + n, dayNumber: n, city: 'Arrecife', title: 'x', stops: [], meals: [], dayType: 'excursion', curatedTitle: 'La Graciosa (excursión)', ...extra })
    const ruta = { destination: 'Lanzarote', answers: { dateRange: { start: '2026-11-08', end: '2026-11-13' } }, days: [dia(4), dia(5)] }
    return JSON.stringify({
      segundo: t.esNombreDeLaExcursionDeOtroDia(ruta, ruta.days[1]), primero: t.esNombreDeLaExcursionDeOtroDia(ruta, ruta.days[0]), escrito: t.esNombreDeLaExcursionDeOtroDia(ruta, { ...ruta.days[1], nameByUser: true }),
      n1: t.nombreDelDia(ruta, ruta.days[0], null).titulo, n2: t.nombreDelDia(ruta, ruta.days[1], null).titulo,
      con: inv.titularDeInvitacion({ valida: true, invitador: 'Eric', destino: 'Lanzarote', con_pase: true }), sin: inv.titularDeInvitacion({ valida: true, invitador: 'Eric', destino: 'Lanzarote', con_pase: false }),
    })
  })`))
  debe(puras.segundo === true && puras.primero === false, 'nombre', 'el segundo día de excursión con el nombre de la excursión del primero se detecta; el primero no')
  debe(puras.escrito === false, 'nombre', 'un nombre que escribió el viajero no se toca')
  debe(puras.n1 === 'La Graciosa (excursión)' && puras.n2 === 'Excursión desde Arrecife', 'nombre', `el miércoles 11 sigue «La Graciosa (excursión)» y el jueves 12 pasa a «${puras.n2}»`)
  debe(puras.con === 'Eric te regala una plaza de su Pase Lanzarote' && puras.sin === 'Eric te invita a su viaje a Lanzarote', 'texto', `el mensaje que recibe el invitado con pase: «${puras.con}»; el del viaje sin pase no cambia`)
  const medidas = await a.evaluar(`(() => {
    const dias = [...document.querySelectorAll('[data-day-id]')]
    const izq = dias.map((d) => Math.round(d.getBoundingClientRect().left))
    const anch = dias.map((d) => Math.round(d.getBoundingClientRect().width))
    const bloque = document.querySelector('[data-bloques-del-viaje] > *')
    const pasados = dias.filter((d) => d.getAttribute('data-dia-pasado') === '1')
    const fondo = pasados.map((d) => getComputedStyle(d).backgroundColor)
    const normal = dias.filter((d) => d.getAttribute('data-dia-pasado') !== '1').map((d) => getComputedStyle(d).backgroundColor)
    return JSON.stringify({ n: dias.length, izq, anch, bloqueIzq: bloque ? Math.round(bloque.getBoundingClientRect().left) : null, bloqueAnch: bloque ? Math.round(bloque.getBoundingClientRect().width) : null, pasados: pasados.length, fondo, normal, sinReservar: pasados.map((d) => d.innerText.includes('Sin reservar')), titulos: dias.map((d) => d.querySelector('[data-titulo-del-dia]')?.innerText ?? '') })
  })()`)
  const m = JSON.parse(medidas)
  console.log('  ', medidas.slice(0, 600))
  debe(m.n >= 4 && m.pasados === 2, 'hecho', `con hoy = 19 oct, los días 1 y 2 salen «Hecho» (${m.pasados} de ${m.n})`)
  debe(new Set(m.izq).size === 1 && new Set(m.anch).size === 1, 'alineado', `todos los días (con asa o sin ella, «Hecho» o no) tienen el mismo borde izquierdo y el mismo ancho (${[...new Set(m.izq)].join('/')} · ${[...new Set(m.anch)].join('/')})`)
  debe(m.bloqueIzq === null || m.bloqueIzq + 10 === m.izq[0], 'alineado', `(V38) y solo se desplaza los 10 px del asa respecto al bloque del alojamiento o del vehículo (${m.bloqueIzq} + 10 = ${m.izq[0]})`)
  debe(m.fondo.length > 0 && m.fondo.every((f) => f === m.normal[0]), 'gris', `un día «Hecho» tiene el fondo de un día normal, sin gris (${m.fondo[0]} · ${m.normal[0]})`)
  debe(m.sinReservar.every((x) => x === false), 'reservar', 'ningún día «Hecho» dice «Sin reservar»')
  debe(!(m.titulos[3] === m.titulos[2] && /Graciosa/.test(m.titulos[2])), 'nombre', `el día 4 no lleva el nombre de la excursión del día 3 (${m.titulos[2]} · ${m.titulos[3]})`)
  await a.captura(`${CAP}/dias_hecho_alineados.jpg`)
  // El día de excursión abierto: la foto, nunca el degradado vacío.
  await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => { const s = m.useRouteStore.getState(); s.setActiveDayId(s.route.days[2].id); return true })")
  await a.esp(6000)
  await a.captura(`${CAP}/dia_excursion_abierto.jpg`)
  const foto = await a.evaluar("(() => { const f = document.querySelector('[data-excursion-foto]'); return f ? f.getAttribute('data-excursion-foto') : 'sin bloque' })()")
  debe(foto === 'operador', 'foto', `el bloque de La Graciosa lleva foto, no el degradado vacío (${foto})`)
  await a.captura(`${CAP}/dia_excursion_con_foto.jpg`)
} finally {
  a.cerrar()
}

console.log(`\nPrueba de la Tanda V27: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
