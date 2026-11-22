// La prueba de la Tanda V39 (parte B): «EL VIAJE DE TUS SUEÑOS» (pregunta 3 de la primera vez, Ajustes, «Destinos soñados» del panel y el aviso de la campana).
//   APP_URL=http://localhost:5173 node scripts/destino/pruebaV39_suenos.mjs     (con Vite en 5173; sin Vite solo las partes del servidor, de la base de datos y de los archivos)
// Ninguna parte toca el Supabase de producción: el servidor se prueba con bases de mentira y con PGlite (las migraciones REALES), y la app con la demo (?logrosDemo=1). Un solo Chrome a la vez.
import fs from 'node:fs'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { abrirApp } from './_enLaApp.mjs'
import { crearServicioPrimeraVez, limpiarRespuestas, limpiarSueno } from '../../server/primeraVez.js'
import { crearServicioDestinos } from '../../server/panel/destinos.js'

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
const APP = process.env.APP_URL ?? 'http://localhost:5173'

/* ───────── 1. Los datos: la lista va dentro de la app ───────── */
console.log('1. La lista del buscador: países de paises_mundo.json y destinos famosos de suenos.json (que Eric puede editar)')
const suenos = JSON.parse(leer('data/primera_vez/suenos.json'))
const paises = JSON.parse(leer('data/logros/paises_mundo.json'))
{
  const lineas = suenos.destinos.filter((x) => !x.startsWith('#'))
  const partes = lineas.map((l) => l.split('|').map((x) => x.trim()))
  debe(typeof suenos._como_editar === 'string' && /Nombre/.test(suenos._como_editar) && /minúscula/.test(suenos._como_editar), 'editar', 'el archivo explica cómo editarlo (_como_editar)')
  debe(lineas.length >= 300, 'lista', `unos cientos de destinos (${lineas.length})`)
  debe(partes.every(([n, iso]) => n && /^[a-z]{2}$/.test(iso ?? '')), 'lista', 'cada línea: nombre y código de país de 2 letras en minúscula')
  const mal = partes.filter(([, iso]) => {
    try {
      const nombre = new Intl.DisplayNames(['es'], { type: 'region' }).of(iso.toUpperCase())
      return !nombre || nombre === iso.toUpperCase()
    } catch {
      return true
    }
  })
  debe(mal.length === 0, 'lista', `todos los códigos de país existen (${mal.map((x) => x.join('|')).slice(0, 5).join(' ; ')})`)
  const nombres = new Set(partes.map(([n]) => n))
  const FAMOSOS = ['Tokio', 'Kioto', 'Nueva York', 'Sídney', 'Ciudad del Cabo', 'Buenos Aires', 'Marrakech', 'Bali', 'Reikiavik', 'Cancún', 'Auckland', 'Dubái', 'París', 'Machu Picchu', 'El Cairo', 'Río de Janeiro', 'Bangkok', 'Santorini', 'Lanzarote', 'Roma', 'Vancouver', 'Zanzíbar', 'Hawái', 'Islas Galápagos', 'Bora Bora', 'Estambul', 'Seúl', 'Singapur', 'Katmandú', 'Petra']
  const faltan = FAMOSOS.filter((x) => !nombres.has(x) && !paises.some((p) => p.n === x))
  debe(faltan.length === 0, 'lista', `cubre ciudades e islas conocidas de todos los continentes (faltan: ${faltan.join(', ') || 'ninguna'})`)
  const porPais = new Set(partes.map(([, iso]) => iso))
  debe(['es', 'it', 'jp', 'us', 'mx', 'br', 'au', 'za', 'ma', 'th', 'in', 'pe', 'nz', 'eg'].every((x) => porPais.has(x)), 'lista', 'hay destinos de Europa, Asia, África, América del Norte y del Sur y Oceanía')
  debe(Array.isArray(suenos.sugerencias) && suenos.sugerencias.length === 8 && suenos.sugerencias.join() === 'Japón,Nueva York,Islandia,Maldivas,Perú,Tailandia,Australia,Bali', 'ideas', 'las 8 ideas de antes de escribir son las de Design: Japón, Nueva York, Islandia, Maldivas, Perú, Tailandia, Australia y Bali')
  debe(paises.length > 190 && paises.every((p) => p.i && p.n), 'lista', `${paises.length} países, cada uno con su código y su nombre en español`)
}

/* ───────── 2. El servidor de la primera vez: el sueño se guarda, se cambia y SIN la 0093 todo sigue ───────── */
console.log('2. El servidor guarda el sueño (país o destino), lo cambia desde Ajustes, lo quita, y sin la 0093 no falla')
{
  const s1 = limpiarSueno({ tipo: 'destino', nombre: '  Tokio ', iso: 'JP' })
  debe(s1 && s1.tipo === 'destino' && s1.nombre === 'Tokio' && s1.iso === 'jp', 'sueno', 'un sueño bueno se limpia: espacios fuera y el país en minúscula')
  debe(limpiarSueno({ tipo: 'ciudad', nombre: 'Tokio', iso: 'jp' }) === null && limpiarSueno({ tipo: 'pais', nombre: 'J', iso: 'jp' }) === null && limpiarSueno({ tipo: 'pais', nombre: 'Japón', iso: 'jpn' }) === null && limpiarSueno({ tipo: 'pais', nombre: 'x'.repeat(81), iso: 'jp' }) === null && limpiarSueno(null) === null && limpiarSueno('Tokio') === null, 'sueno', 'lo que no encaja (tipo raro, nombre corto o largo, país de 3 letras, nada) queda vacío')
  debe(!('sueno' in limpiarRespuestas({ sueno: { tipo: 'pais', nombre: 'Japón', iso: 'jp' } }, 2026)), 'sueno', 'limpiarRespuestas sigue devolviendo lo de siempre (el sueño va aparte)')

  const baseFalsa = ({ conSueno }) => {
    const filas = new Map()
    const rotaPorSueno = (cols) => !conSueno && /sueno_/.test(Array.isArray(cols) ? cols.join(',') : String(cols)) ? { code: '42703', message: 'column viajero_primera_vez.sueno_tipo does not exist' } : null
    return {
      filas,
      from: () => ({
        select: (cols) => ({ eq: (_c, id) => ({ maybeSingle: async () => (rotaPorSueno(cols) ? { data: null, error: rotaPorSueno(cols) } : { data: filas.get(id) ?? null, error: null }) }) }),
        upsert: async (fila) => {
          const e = rotaPorSueno(Object.keys(fila))
          if (e) return { error: e }
          filas.set(fila.user_id, { ...(filas.get(fila.user_id) ?? {}), ...fila })
          return { error: null }
        },
        update: (cols) => ({
          eq: async (_c, id) => {
            const e = rotaPorSueno(Object.keys(cols))
            if (e) return { error: e }
            filas.set(id, { ...(filas.get(id) ?? {}), ...cols })
            return { error: null }
          },
        }),
      }),
    }
  }
  // Con la 0093.
  {
    const admin = baseFalsa({ conSueno: true })
    const s = crearServicioPrimeraVez({ admin })
    const g = await s.guardar({ id: 'u1' }, { frecuencia: 'dos_o_tres', compania: 'pareja', sueno: { tipo: 'destino', nombre: 'Nueva York', iso: 'us' } })
    const f = admin.filas.get('u1')
    debe(g.estado === 200 && f.sueno_tipo === 'destino' && f.sueno_nombre === 'Nueva York' && f.sueno_iso === 'us' && f.sueno_norm === 'nueva york' && Boolean(f.sueno_en), 'guardar', 'la primera vez guarda el sueño con su nombre normalizado («nueva york») y cuándo lo eligió')
    const l = (await s.leer({ id: 'u1' })).cuerpo
    debe(l.suenos_disponibles === true && l.sueno?.nombre === 'Nueva York' && l.sueno?.tipo === 'destino' && l.sueno?.iso === 'us' && l.frecuencia === 'dos_o_tres', 'leer', 'el GET devuelve el sueño y dice que se puede guardar (suenos_disponibles)')
    const c = await s.guardarSueno({ id: 'u1' }, { sueno: { tipo: 'pais', nombre: 'Japón', iso: 'jp' } })
    const l2 = (await s.leer({ id: 'u1' })).cuerpo
    debe(c.estado === 200 && c.cuerpo.guardado === true && l2.sueno?.nombre === 'Japón' && l2.sueno?.tipo === 'pais' && l2.frecuencia === 'dos_o_tres' && l2.compania === 'pareja', 'ajustes', 'cambiarlo desde Ajustes cambia SOLO el sueño (lo que contestó antes se queda)')
    const q = await s.guardarSueno({ id: 'u1' }, { sueno: null })
    const l3 = (await s.leer({ id: 'u1' })).cuerpo
    debe(q.estado === 200 && l3.sueno === null && admin.filas.get('u1').sueno_norm === null && l3.frecuencia === 'dos_o_tres', 'ajustes', 'se puede quitar (null): las cinco columnas quedan vacías')
    const nuevo = await s.guardarSueno({ id: 'u2' }, { sueno: { tipo: 'destino', nombre: 'Tokio', iso: 'jp' } })
    debe(nuevo.estado === 200 && admin.filas.get('u2')?.sueno_norm === 'tokio', 'ajustes', 'quien aún no tenía fila también puede ponerlo desde Ajustes')
    await s.guardar({ id: 'u3' }, { sueno: { tipo: 'planeta', nombre: 'Marte', iso: 'xx' } })
    debe((await s.leer({ id: 'u3' })).cuerpo.sueno === null, 'guardar', 'un sueño que no encaja no se guarda (y lo demás sí)')
  }
  // SIN la 0093.
  {
    const admin = baseFalsa({ conSueno: false })
    const s = crearServicioPrimeraVez({ admin })
    const l = await s.leer({ id: 'u1' })
    debe(l.estado === 200 && l.cuerpo.suenos_disponibles === false && l.cuerpo.sueno === null && l.cuerpo.hecho === false, 'sin_0093', 'sin la 0093 el GET responde bien y dice suenos_disponibles = false (la pregunta se salta sola)')
    const g = await s.guardar({ id: 'u1' }, { frecuencia: 'cuatro_o_mas', compania: 'amigos', anio_nacimiento: 1990, sueno: { tipo: 'pais', nombre: 'Japón', iso: 'jp' } })
    const f = admin.filas.get('u1')
    debe(g.estado === 200 && f.frecuencia === 'cuatro_o_mas' && f.anio_nacimiento === 1990 && !Object.keys(f).some((k) => k.startsWith('sueno_')), 'sin_0093', 'sin la 0093 se guarda todo lo demás y el sueño se ignora (no falla)')
    const a = await s.guardarSueno({ id: 'u1' }, { sueno: { tipo: 'pais', nombre: 'Japón', iso: 'jp' } })
    debe(a.estado === 200 && a.cuerpo.ok === true && a.cuerpo.guardado === false, 'sin_0093', 'desde Ajustes, sin la 0093: ok y guardado = false (no falla)')
    debe((await s.leer({ id: 'u1' })).cuerpo.frecuencia === 'cuatro_o_mas', 'sin_0093', 'y lo contestado sigue leyéndose')
  }
  const srv = leer('server/primeraVez.js')
  debe(srv.includes("app.get('/api/primera-vez/sueno'") && srv.includes("app.put('/api/primera-vez/sueno'"), 'rutas', 'las rutas GET y PUT /api/primera-vez/sueno están montadas')
}

/* ───────── 3. La migración 0093 en un Postgres de verdad (PGlite) y el panel ───────── */
console.log('3. La 0093 (PGlite, migraciones reales): panel_suenos cuenta, panel_sueno_avisar avisa UNA vez, «Destinos soñados» del panel')
const db = await (async () => {
  const ventana = globalThis.window
  const documento = globalThis.document
  delete globalThis.window
  delete globalThis.document
  const d = new PGlite()
  await d.waitReady
  globalThis.window = ventana
  globalThis.document = documento
  return d
})()
{
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
      noAplicadas.push(`${archivo}: ${String(error.message).slice(0, 80)}`)
    }
  }
  debe(!noAplicadas.some((x) => /^(0026|0085|0089|0090|0091|0093)/.test(x)), 'migracion', `las migraciones que hacen falta se aplican (${noAplicadas.filter((x) => /^(0026|0085|0089|0090|0091|0093)/.test(x)).join(' | ')})`)
  await db.exec(leer('supabase/migrations/0093_turista_y_suenos.sql')) // idempotente: pegada otra vez
  await db.exec(`
    grant usage on schema public, auth to anon, authenticated, service_role;
    grant all on all tables in schema public to authenticated, service_role;
    grant execute on all functions in schema public to authenticated, service_role;
  `)
  await db.exec('revoke execute on function public.panel_suenos(date, date, integer) from authenticated')
  await db.exec('revoke execute on function public.panel_sueno_avisar(text, text, text, text) from authenticated')
  const comprobar = (await db.query(leer('docs/dias/COMPROBAR_0093.sql'))).rows
  debe(comprobar.length === 1 && comprobar[0].todo === true, 'migracion', `COMPROBAR_0093.sql da UNA fila con todo = true (${JSON.stringify(comprobar[0])})`)
  debe(!/empezar_de_cero/.test(leer('supabase/migrations/0093_turista_y_suenos.sql').replace(/--.*$/gm, '')), 'empezar', 'la 0093 no vuelve a crear empezar_de_cero (las columnas van en viajero_primera_vez, que ya está en su inventario: 10J lo comprueba)')

  const usuario = async (email) => (await db.query('insert into auth.users (email) values ($1) returning id', [email])).rows[0].id
  const [A, B, C, D, E] = [await usuario('a@x.es'), await usuario('b@x.es'), await usuario('c@x.es'), await usuario('d@x.es'), await usuario('e@x.es')]
  const sueña = (u, tipo, nombre, iso, norm, dias = 0) =>
    db.query("insert into public.viajero_primera_vez (user_id, sueno_tipo, sueno_nombre, sueno_iso, sueno_norm, sueno_en) values ($1,$2,$3,$4,$5, now() - ($6 || ' days')::interval)", [u, tipo, nombre, iso, norm, String(dias)])
  await sueña(A, 'destino', 'Tokio', 'jp', 'tokio')
  await sueña(B, 'pais', 'Japón', 'jp', 'japon')
  await sueña(C, 'destino', 'Roma', 'it', 'roma')
  await sueña(E, 'destino', 'Tokio', 'jp', 'tokio', 60)
  await db.query("insert into public.viajero_primera_vez (user_id) values ($1)", [D])
  let malo = null
  try {
    await db.query("insert into public.viajero_primera_vez (user_id, sueno_tipo, sueno_nombre, sueno_iso, sueno_norm) values ($1,'cosa','Marte','xx','marte')", [await usuario('z@x.es')])
  } catch (e) {
    malo = e
  }
  debe(Boolean(malo), 'migracion', 'la base rechaza un sueño con tipo raro o país mal escrito (check)')

  // El «admin» de mentira para el servicio del panel: las funciones van a PGlite de verdad.
  const rpcReal = async (nombre, args) => {
    try {
      const claves = Object.keys(args)
      const r = await db.query(`select public.${nombre}(${claves.map((k, i) => `${k} => $${i + 1}`).join(', ')}) as r`, claves.map((k) => args[k]))
      return { data: r.rows[0].r, error: null }
    } catch (e) {
      return { data: null, error: { message: String(e.message) } }
    }
  }
  const adminConBase = {
    rpc: rpcReal,
    from: () => {
      const cadena = { select: () => cadena, eq: () => cadena, neq: () => cadena, limit: async () => ({ data: [], error: null }) }
      return cadena
    },
  }
  let publicados = [{ clave: 'roma', nombre: 'Roma', iso: 'it' }]
  const panel = crearServicioDestinos({ admin: adminConBase, correo: { activo: false }, proximamente: async () => [], lanzados: () => publicados, ahora: () => new Date() })
  const avisosDe = async (u) => (await db.query("select payload from public.avisos where user_id = $1 and clave like 'sueno:%'", [u])).rows.map((r) => r.payload.texto)

  const d1 = await panel.leer({ periodo: 'todo' })
  debe(d1.sonados?.disponible === true && d1.sonados.lista.length === 3 && d1.sonados.lista[0].destino === 'Tokio' && d1.sonados.lista[0].veces === 2, 'panel', `«Destinos soñados» cuenta en la base de datos: Tokio 2, Japón 1, Roma 1 (${JSON.stringify(d1.sonados?.lista)})`)
  const d2 = await panel.leer({ periodo: '30d' })
  debe(d2.sonados.lista.find((x) => x.destino === 'Tokio')?.veces === 1, 'panel', 'con el periodo de arriba (últimos 30 días) el que lo eligió hace 60 días no cuenta: Tokio 1')
  debe(d1.sonados.lista.find((x) => x.destino === 'Roma')?.lanzado === true && d1.sonados.lista.find((x) => x.destino === 'Tokio')?.lanzado === false && d1.sonados.lista.find((x) => x.tipo === 'pais')?.lanzado === false, 'panel', 'marca cuáles ya están en la app (Roma sí; Tokio y Japón aún no)')

  // Avisos: aún no está publicado → no se avisa.
  const antes = await panel.sonadosAvisar({ tipo: 'destino', destino: 'Tokio', iso: 'jp' })
  debe(antes.estado === 409 && antes.cuerpo.no_publicado === true && (await avisosDe(A)).length === 0, 'aviso', 'un destino que aún no está en la app no avisa a nadie («Aún no está en la app»)')
  // Se publica Tokio y Eric pulsa [Ya está disponible]: avisa a quien eligió Tokio Y a quien eligió Japón (solo el país).
  publicados = [{ clave: 'roma', nombre: 'Roma', iso: 'it' }, { clave: 'tokio', nombre: 'Tokio', iso: 'jp' }, { clave: 'kioto', nombre: 'Kioto', iso: 'jp' }]
  const y1 = await panel.yaDisponible({ destino: 'Tokio' })
  debe(y1.estado === 200 && y1.cuerpo.suenos.avisadas === 3 && y1.cuerpo.suenos.ya_avisadas === 0, 'aviso', `[Ya está disponible] de Tokio avisa a las 3 personas que lo soñaban (la de Tokio, la de hace 60 días y la que eligió Japón): ${JSON.stringify(y1.cuerpo.suenos)}`)
  const aA = await avisosDe(A)
  const aB = await avisosDe(B)
  debe(aA.length === 1 && aA[0] === '¡Tu viaje soñado ya está en Jutrip: Tokio!' && aB.length === 1 && aB[0] === '¡Tu viaje soñado ya está en Jutrip: Tokio!', 'aviso', `el texto es «¡Tu viaje soñado ya está en Jutrip: Tokio!» (${aA[0]})`)
  debe((await avisosDe(C)).length === 0 && (await avisosDe(D)).length === 0, 'aviso', 'quien soñaba Roma o no soñaba nada no recibe nada')
  const tipoAviso = (await db.query("select tipo from public.avisos where user_id = $1 and clave like 'sueno:%'", [A])).rows[0].tipo
  debe(tipoAviso === 'gracias_viajero', 'aviso', 'se reutiliza el aviso de campana de los [Avísame] (gracias_viajero): ningún mecanismo nuevo')
  // Una sola vez: pulsarlo otra vez no repite.
  const y2 = await panel.yaDisponible({ destino: 'Tokio' })
  debe(y2.cuerpo.suenos.avisadas === 0 && y2.cuerpo.suenos.ya_avisadas === 3 && (await avisosDe(A)).length === 1, 'una_vez', 'pulsarlo otra vez NO repite el aviso (0 nuevos, 3 ya avisados)')
  // Otro destino del mismo país: la persona que eligió «Japón» ya fue avisada de su viaje soñado: no se repite.
  const y3 = await panel.yaDisponible({ destino: 'Kioto' })
  debe(y3.cuerpo.suenos.avisadas === 0 && (await avisosDe(B)).length === 1, 'una_vez', 'si luego se publica Kioto, quien eligió «Japón» NO recibe un segundo aviso')
  // El botón [Avisar] de «Destinos soñados» (de un país, con un destino publicado de ese país).
  const F = await usuario('f@x.es')
  await sueña(F, 'pais', 'Italia', 'it', 'italia')
  const p = await panel.sonadosAvisar({ tipo: 'pais', destino: 'Italia', iso: 'it' })
  debe(p.estado === 200 && p.cuerpo.avisadas === 1 && (await avisosDe(F))[0] === '¡Tu viaje soñado ya está en Jutrip: Roma!', 'aviso', `[Avisar] de un país avisa con un destino publicado de ese país (${JSON.stringify(p.cuerpo)})`)
  const p2 = await panel.sonadosAvisar({ tipo: 'pais', destino: 'Italia', iso: 'it' })
  debe(p2.cuerpo.avisadas === 0 && p2.cuerpo.ya_avisadas === 1, 'una_vez', 'y pulsarlo otra vez no repite')
  const r1 = await panel.sonadosAvisar({ tipo: 'destino', destino: 'Roma', iso: 'it' })
  debe(r1.estado === 200 && r1.cuerpo.avisadas === 1 && (await avisosDe(C)).length === 1, 'aviso', 'y el de un destino (Roma) avisa a quien lo soñaba')
  debe((await panel.sonadosAvisar({ tipo: 'destino', destino: '', iso: 'it' })).estado === 400, 'aviso', 'sin nombre: 400')

  // Solo el servidor.
  let ok = false
  try {
    await db.exec('set role authenticated')
    await db.query("select public.panel_suenos(null, null, 5)")
    ok = true
  } catch {
    ok = false
  } finally {
    await db.exec('reset role')
  }
  debe(ok === false, 'seguridad', 'una persona (authenticated) NO puede llamar a panel_suenos: solo el servidor')

  // SIN la 0093 (la función no existe): «Pronto» y nada falla.
  const sin = crearServicioDestinos({ admin: { rpc: async (n, args) => (/^panel_sueno/.test(n) ? { data: null, error: { message: `Could not find the function public.${n} in the schema cache`, code: 'PGRST202' } } : rpcReal(n, args)), from: adminConBase.from }, correo: { activo: false }, proximamente: async () => [], lanzados: () => publicados })
  const ds = await sin.leer({ periodo: 'todo' })
  debe(ds.ok === true && ds.sonados.disponible === false && ds.sonados.lista.length === 0 && Array.isArray(ds.pedidos), 'sin_0093', 'sin la 0093 el panel carga igual y «sonados» dice disponible = false (la pantalla enseña «Pronto»)')
  const ys = await sin.yaDisponible({ destino: 'Tokio' })
  debe(ys.estado === 200 && ys.cuerpo.suenos.avisadas === 0, 'sin_0093', 'sin la 0093, [Ya está disponible] sigue funcionando (sin avisos de sueños)')
  const as = await sin.sonadosAvisar({ tipo: 'destino', destino: 'Tokio', iso: 'jp' })
  debe(as.estado === 503 && as.cuerpo.pronto === true, 'sin_0093', 'y [Avisar] de «Destinos soñados» responde «pronto», sin romper nada')
}
await db.close?.()

/* ───────── 4. El código: nada de fuera y nada que engorde el peso inicial ───────── */
console.log('4. El código: lista local (cero llamadas de fuera), carga perezosa y consultas con su comentario')
{
  const lib = leer('src/lib/suenos.ts')
  debe(!/fetch\(|XMLHttpRequest|nominatim|mapbox|geocod|google/i.test(lib.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), 'local', 'el buscador no llama a ningún servicio de fuera (ni fetch, ni geocodificador)')
  debe(/import\('\.\.\/\.\.\/data\/logros\/paises_mundo\.json'\)/.test(lib) && /import\('\.\.\/\.\.\/data\/primera_vez\/suenos\.json'\)/.test(lib) && !/^import .*(paises_mundo|suenos)\.json/m.test(lib), 'peso', 'los dos JSON se cargan con import() dinámico, no estático (no engordan el peso inicial)')
  const todoSrc = []
  const recorre = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) recorre(p)
      else if (/\.(ts|tsx)$/.test(e.name)) todoSrc.push(p)
    }
  }
  recorre('src')
  const estaticos = todoSrc.filter((f) => /^import .*primera_vez\/suenos\.json/m.test(leer(f)))
  const mios = ['src/lib/suenos.ts', 'src/components/primeraVez/BuscadorSueno.tsx', 'src/components/ajustes/HojaSueno.tsx', 'src/components/primeraVez/PreguntasPrimeraVez.tsx', 'src/components/ajustes/AjustesScreen.tsx'].filter((f) => /^import .*(primera_vez\/suenos|logros\/paises_mundo)\.json/m.test(leer(f)))
  debe(estaticos.length === 0 && mios.length === 0, 'peso', `ningún archivo de la pregunta ni de Ajustes importa esos JSON de forma estática (${[...estaticos, ...mios].join(', ') || 'ninguno'})`)
  debe(/Se hace una vez al abrir la app un viajero nuevo/.test(leer('server/primeraVez.js')) && /una consulta por apertura del panel/.test(leer('server/panel/destinos.js')) && /ninguna desde el móvil/.test(lib), 'consultas', 'las consultas nuevas llevan su comentario de cada cuánto y cuánto baja')
  const sinTexto = ['src/components/primeraVez/BuscadorSueno.tsx', 'src/components/ajustes/HojaSueno.tsx', 'src/components/panel/Destinos.tsx'].filter((f) => /sello/i.test(leer(f).replace(/\/\*[\s\S]*?\*\//g, '')))
  debe(sinTexto.length === 0, 'textos', 'ningún texto nuevo dice «sello» (la medalla se llama medalla)')
}

/* ───────── La app (con Vite en 5173) ───────── */
if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('(sin Vite: la parte de la app se salta)')
  console.log(`\nPrueba de la Tanda V39 (suenos): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}
const RUTA = '/?cuentas=on&logros=on&logrosDemo=1&apertura=0'
const NUEVA = "try{localStorage.setItem('trazo:demo:primera_vez_nueva','si');localStorage.removeItem('trazo:demo:primera_vez_hecha');localStorage.removeItem('trazo:primera_vez:avisados')}catch(e){}"
const SIN_SUENOS = "try{localStorage.setItem('trazo:demo:sin_suenos','si')}catch(e){}"
const CON_SUENOS = "try{localStorage.removeItem('trazo:demo:sin_suenos')}catch(e){}"
const CURADOS = "window.__destinosCurados = [{ clave: 'roma', nombre: 'Roma', pais: 'Italia', iso: 'it', lat: 41.9028, lng: 12.4964, linea: 'La ciudad eterna', portada: '/fotos/roma/dia_coliseo.jpg', portada_pequena: '/fotos/roma/dia_coliseo_p.jpg' }];"
const esperar = async (a, js, n = 60) => {
  for (let i = 0; i < n; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(500)
  }
  return false
}
const clic = (a, sel) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
const J = async (a, js) => JSON.parse(await a.evaluar(js))
const pasarBienvenida = async (a) => {
  await esperar(a, "Boolean(document.querySelector('[data-bienvenida-primera-vez]'))")
}
const resultados = (a) => J(a, "JSON.stringify([...document.querySelectorAll('[data-sueno-resultado]')].map((e) => ({ n: e.getAttribute('data-sueno-resultado'), tipo: e.getAttribute('data-sueno-tipo'), txt: e.innerText.replace(/\\s+/g, ' ').trim(), flag: e.querySelector('.fi')?.className ?? '' })))")
const escribirBuscador = async (a, texto) => {
  await a.escribir('[data-sueno-buscador]', texto)
  await a.esp(350)
}

console.log('5. La lista y el buscador (sin tildes ni mayúsculas) en la app')
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844 })
  try {
    const r = await J(a, `import('/src/lib/suenos.ts').then(async (m) => {
      const l = await m.cargarLista()
      const f = (t) => m.buscarSuenos(l.opciones, t).map((o) => o.tipo + ':' + o.nombre + ':' + o.iso)
      return JSON.stringify({ n: l.opciones.length, paises: l.opciones.filter((o) => o.tipo === 'pais').length, ideas: l.sugerencias.map((o) => o.nombre + ':' + o.tipo + ':' + o.iso),
        japon: f('japon'), JAPON: f('  JAPÓN '), ny: f('nueva york'), ny2: f('NUEVA   YORK'), tokyo: f('tokyo'), newyork: f('new york'), kioto: f('kioto'), vacio: f(''), nada: f('zzzzqx'),
        cdc: f('ciudad del cabo'), sydney: f('sydney'), peru: f('peru'), linea: [m.lineaDelSueno({ tipo: 'pais', iso: 'jp' }), m.lineaDelSueno({ tipo: 'destino', iso: 'jp' })] })
    })`)
    debe(r.n >= 750 && r.paises > 190, 'lista', `la lista junta ${r.paises} países y ${r.n - r.paises} destinos (${r.n})`)
    debe(r.ideas.join() === 'Japón:pais:jp,Nueva York:destino:us,Islandia:pais:is,Maldivas:pais:mv,Perú:pais:pe,Tailandia:pais:th,Australia:pais:au,Bali:destino:id', 'ideas', `las 8 ideas, cada una con su tipo y su país (${r.ideas})`)
    debe(r.japon[0] === 'pais:Japón:jp' && r.japon.includes('destino:Tokio:jp') && r.japon.includes('destino:Kioto:jp') && r.JAPON[0] === 'pais:Japón:jp', 'buscar', `«japon» (y «  JAPÓN ») encuentra Japón primero y luego sus destinos Tokio, Kioto… (${r.japon.join(', ')})`)
    debe(r.ny[0] === 'destino:Nueva York:us' && r.ny2[0] === 'destino:Nueva York:us' && r.newyork[0] === 'destino:Nueva York:us', 'buscar', `«nueva york», «NUEVA   YORK» y «new york» encuentran Nueva York (${r.ny.join(', ')})`)
    debe(r.tokyo[0] === 'destino:Tokio:jp' && r.cdc[0] === 'destino:Ciudad del Cabo:za' && r.sydney[0] === 'destino:Sídney:au' && r.peru[0] === 'pais:Perú:pe' && r.kioto[0] === 'destino:Kioto:jp', 'buscar', 'también por otros nombres (Tokyo, Sydney) y sin tildes (peru, Ciudad del Cabo)')
    debe(r.vacio.length === 0 && r.nada.length === 0, 'buscar', 'sin escribir o sin resultados, nada')
    debe(r.linea[0] === 'País' && r.linea[1] === 'Destino · Japón', 'linea', 'la línea de la tarjeta: «País» o «Destino · Japón»')
  } finally {
    a.cerrar()
  }
}

console.log('6. La pregunta 3 de la primera vez: «El viaje de tus sueños» (siguen siendo 5 preguntas)')
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: NUEVA + CON_SUENOS + CURADOS })
  try {
    await pasarBienvenida(a)
    const b = await a.evaluar("document.querySelector('[data-bienvenida-primera-vez]').innerText.replace(/\\s+/g, ' ')")
    debe(/Cinco preguntas rápidas/.test(b), 'cinco', 'la bienvenida sigue diciendo «Cinco preguntas rápidas»')
    await clic(a, '[data-empezar]')
    await esperar(a, "Boolean(document.querySelector('[data-pregunta=\"1\"]'))")
    await clic(a, '[data-continuar]')
    await a.esp(300)
    await clic(a, '[data-continuar]')
    await a.esp(400)
    const q = await J(a, `JSON.stringify({ n: document.querySelector('[data-pregunta]').getAttribute('data-pregunta'), texto: document.body.innerText.replace(/\\s+/g, ' '), progreso: document.querySelector('[aria-label^="Pregunta "]')?.getAttribute('aria-label'), barras: document.querySelector('[aria-label^="Pregunta "]').children.length, caja: Boolean(document.querySelector('[data-sueno-buscador]')),
      ideas: [...document.querySelectorAll('[data-sueno-sugerencia]')].map((e) => e.getAttribute('data-sueno-sugerencia') + ':' + Boolean(e.querySelector('.fi'))), saltar: Boolean(document.querySelector('[data-saltar]')), viejo: /Cómo te gusta viajar|Tranquilo|Qué te gusta ver/.test(document.body.innerText) })`)
    debe(q.n === '3' && /¿Cuál es el viaje de tus sueños\?/.test(q.texto) && /Un país o una ciudad que te encantaría visitar\./.test(q.texto) && !q.viejo, 'pregunta3', 'la pregunta 3 es «¿Cuál es el viaje de tus sueños?» con «Un país o una ciudad que te encantaría visitar.» (y ya no la de «¿Cómo te gusta viajar?»)')
    debe(q.progreso === 'Pregunta 3 de 5' && q.barras === 5, 'cinco', `siguen siendo 5 preguntas: «${q.progreso}» y ${q.barras} barras`)
    debe(q.caja && /ALGUNAS IDEAS/.test(q.texto) && q.ideas.join() === 'Japón:true,Nueva York:true,Islandia:true,Maldivas:true,Perú:true,Tailandia:true,Australia:true,Bali:true' && q.saltar, 'ideas', `buscador, «ALGUNAS IDEAS» con las 8 (cada una con su bandera) y «Saltar» (${q.ideas})`)
    // Escribe «japon»: Japón (País) y los destinos de Japón, cada uno con su bandera y su etiqueta.
    await escribirBuscador(a, 'japon')
    const r = await resultados(a)
    const japon = r.find((x) => x.n === 'Japón')
    const tokio = r.find((x) => x.n === 'Tokio')
    debe(japon && japon.tipo === 'pais' && /^Japón País$/.test(japon.txt) && /fi-jp/.test(japon.flag), 'buscador', `«japon» → «Japón · País» con la bandera de Japón (${japon?.txt})`)
    debe(tokio && tokio.tipo === 'destino' && /^Tokio · Japón Destino$/.test(tokio.txt) && /fi-jp/.test(tokio.flag), 'buscador', `y «Tokio · Japón · Destino» con la bandera de Japón (${tokio?.txt})`)
    debe(!/ALGUNAS IDEAS/.test(await a.evaluar('document.body.innerText')), 'buscador', 'al escribir, las ideas se van y salen los resultados')
    await a.escribir('[data-sueno-buscador]', 'nueva york')
    await a.esp(350)
    const ny = await resultados(a)
    debe(ny[0]?.n === 'Nueva York' && ny[0].tipo === 'destino' && /^Nueva York · Estados Unidos Destino$/.test(ny[0].txt) && /fi-us/.test(ny[0].flag), 'buscador', `«nueva york» → «Nueva York · Estados Unidos · Destino» con la bandera de EE. UU. (${ny[0]?.txt})`)
    await a.escribir('[data-sueno-buscador]', 'zzzzqx')
    await a.esp(300)
    debe(await a.evaluar("Boolean(document.querySelector('[data-sueno-sin-resultados]'))"), 'buscador', 'sin resultados lo dice con claridad')
    // Elige un destino: la tarjeta con «Cambiar».
    await a.escribir('[data-sueno-buscador]', 'tokio')
    await a.esp(300)
    await clic(a, '[data-sueno-resultado="Tokio"]')
    await a.esp(300)
    const t = await J(a, "JSON.stringify({ texto: document.querySelector('[data-sueno-elegido]')?.innerText.replace(/\\s+/g, ' ') ?? null, bandera: document.querySelector('[data-sueno-elegido] .fi-jp') !== null, caja: Boolean(document.querySelector('[data-sueno-buscador]')) })")
    debe(t.texto === 'Tokio Destino · Japón Cambiar' && t.bandera && !t.caja, 'elegido', `elegido «Tokio»: tarjeta con su bandera, «Destino · Japón» y «Cambiar» (${t.texto})`)
    await clic(a, '[data-sueno-cambiar]')
    await a.esp(300)
    debe(await a.evaluar("Boolean(document.querySelector('[data-sueno-buscador]')) && !document.querySelector('[data-sueno-elegido]')"), 'elegido', '«Cambiar» vuelve al buscador (solo uno a la vez)')
    await a.escribir('[data-sueno-buscador]', 'japon')
    await a.esp(300)
    await clic(a, '[data-sueno-resultado="Japón"]')
    await a.esp(300)
    debe((await a.evaluar("document.querySelector('[data-sueno-elegido]')?.innerText.replace(/\\s+/g, ' ')")) === 'Japón País Cambiar', 'elegido', 'elegido un país: «Japón · País · Cambiar»')
    await a.captura('docs/dias/V39_suenos_q3.jpg').catch(() => {})
    await clic(a, '[data-continuar]')
    await a.esp(300)
    debe(/En qué año naciste/.test(await a.evaluar('document.body.innerText')) && (await a.evaluar("document.querySelector('[aria-label^=\"Pregunta \"]').getAttribute('aria-label')")) === 'Pregunta 4 de 5', 'cinco', 'sigue la 4 (año) de 5…')
    await clic(a, '[data-continuar]')
    await a.esp(300)
    debe(/En qué país vives/.test(await a.evaluar('document.body.innerText')), 'cinco', '…y la 5 (país donde vives)')
    await clic(a, '[data-continuar]')
    await esperar(a, "Boolean(document.querySelector('[data-mapa-primera-vez]'))")
    const g = await J(a, 'JSON.stringify(window.__demoPrimeraVez)')
    debe(g.guardados === 1 && g.sueno?.tipo === 'pais' && g.sueno.nombre === 'Japón' && g.sueno.iso === 'jp', 'guardar', `al acabar se guarda el sueño elegido (${JSON.stringify(g.sueno)})`)
    debe(JSON.stringify(g.ultimo.sueno) === '{"tipo":"pais","nombre":"Japón","iso":"jp"}', 'guardar', 'lo enviado: solo { tipo, nombre, iso }')
  } finally {
    a.cerrar()
  }
}
{
  // «Saltar» en la pregunta 3 con uno elegido NO lo guarda.
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: NUEVA + CON_SUENOS + CURADOS })
  try {
    await pasarBienvenida(a)
    await clic(a, '[data-empezar]')
    await esperar(a, "Boolean(document.querySelector('[data-pregunta=\"1\"]'))")
    await clic(a, '[data-continuar]')
    await a.esp(300)
    await clic(a, '[data-continuar]')
    await a.esp(400)
    await clic(a, '[data-sueno-sugerencia="Bali"]')
    await a.esp(300)
    debe((await a.evaluar("document.querySelector('[data-sueno-elegido]')?.innerText.replace(/\\s+/g, ' ')")) === 'Bali Destino · Indonesia Cambiar', 'ideas', 'tocar una idea («Bali») la elige: «Destino · Indonesia»')
    await clic(a, '[data-saltar]')
    await a.esp(300)
    for (let i = 0; i < 2; i++) {
      await clic(a, '[data-continuar]')
      await a.esp(300)
    }
    await esperar(a, "Boolean(document.querySelector('[data-mapa-primera-vez]'))")
    const g = await J(a, 'JSON.stringify(window.__demoPrimeraVez)')
    debe(g.guardados === 1 && g.sueno === null && g.ultimo.sueno === null, 'saltar', '«Saltar» en la pregunta 3 no guarda nada (aunque hubiera uno elegido)')
  } finally {
    a.cerrar()
  }
}

console.log('7. SIN la 0093: la pregunta de los sueños se salta sola (siguen 4 preguntas y todo lo demás)')
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: NUEVA + SIN_SUENOS + CURADOS })
  try {
    await pasarBienvenida(a)
    const b = await a.evaluar("document.querySelector('[data-bienvenida-primera-vez]').innerText.replace(/\\s+/g, ' ')")
    debe(/Cuatro preguntas rápidas/.test(b), 'sin_0093', 'la bienvenida dice «Cuatro preguntas rápidas»')
    await clic(a, '[data-empezar]')
    await esperar(a, "Boolean(document.querySelector('[data-pregunta=\"1\"]'))")
    const vistos = []
    for (let i = 0; i < 4; i++) {
      const v = await J(a, "JSON.stringify({ n: document.querySelector('[data-pregunta]')?.getAttribute('data-pregunta'), h1: document.querySelector('[data-pregunta] h1')?.innerText, progreso: document.querySelector('[aria-label^=\"Pregunta \"]')?.getAttribute('aria-label'), buscador: Boolean(document.querySelector('[data-sueno-buscador]')) })")
      vistos.push(v)
      if (i < 3) {
        await clic(a, '[data-continuar]')
        await a.esp(350)
      }
    }
    debe(vistos.map((v) => v.h1).join('|') === '¿Cada cuánto viajas?|¿Con quién sueles viajar?|¿En qué año naciste?|¿En qué país vives?' && vistos.every((v) => !v.buscador), 'sin_0093', `las 4 preguntas son: cada cuánto, con quién, año y país; sin la de los sueños (${vistos.map((v) => v.h1).join(' | ')})`)
    debe(vistos[2].progreso === 'Pregunta 3 de 4' && vistos[3].progreso === 'Pregunta 4 de 4', 'sin_0093', `la barra dice «${vistos[2].progreso}» y «${vistos[3].progreso}»`)
    await clic(a, '[data-continuar]')
    await esperar(a, "Boolean(document.querySelector('[data-mapa-primera-vez]'))")
    const g = await J(a, 'JSON.stringify(window.__demoPrimeraVez)')
    debe(g.guardados === 1 && g.sueno === null && g.ultimo.sueno === null, 'sin_0093', 'termina bien y llega al Perfil con el mapa; no se manda ningún sueño')
  } finally {
    a.cerrar()
  }
}

console.log('8. Ajustes: «El viaje de tus sueños» se ve, se cambia y se quita')
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: CON_SUENOS })
  try {
    await a.evaluar("import('/src/store/useAjustesUi.ts').then((m) => m.useAjustesUi.getState().abrir('ajustes')).then(() => true)")
    debe(await esperar(a, "Boolean(document.querySelector('[data-ajuste=\"sueno\"]'))", 40), 'ajustes', 'Ajustes tiene la fila «El viaje de tus sueños»')
    const fila = () => a.evaluar("document.querySelector('[data-ajuste=\"sueno\"]').innerText.replace(/\\s+/g, ' ')")
    debe(/El viaje de tus sueños/.test(await fila()) && /Sin decirlo/.test(await fila()), 'ajustes', `sin sueño dice «Sin decirlo» (${await fila()})`)
    await clic(a, '[data-ajuste="sueno"]')
    debe(await esperar(a, "Boolean(document.querySelector('[data-sueno-buscador]'))", 40), 'ajustes', 'abre la hoja con el mismo buscador')
    debe(!(await a.evaluar("Boolean(document.querySelector('[data-opcion-hoja=\"sueno-quitar\"]'))")), 'ajustes', 'sin sueño no hay «Quitar»')
    await escribirBuscador(a, 'nueva york')
    await clic(a, '[data-sueno-resultado="Nueva York"]')
    await esperar(a, "!document.querySelector('[data-sueno-buscador]')")
    await a.esp(300)
    let g = await J(a, 'JSON.stringify(window.__demoPrimeraVez)')
    debe(/Nueva York/.test(await fila()) && g.sueno?.nombre === 'Nueva York' && g.sueno.tipo === 'destino' && g.sueno.iso === 'us' && g.suenos.length === 1, 'ajustes', `elegir Nueva York: la fila lo dice y se guarda SOLO el sueño (${await fila()}; ${JSON.stringify(g.suenos)})`)
    await clic(a, '[data-ajuste="sueno"]')
    await esperar(a, "Boolean(document.querySelector('[data-sueno-elegido]'))", 40)
    debe(/Nueva York/.test(await a.evaluar("document.querySelector('[data-sueno-elegido]').innerText")), 'ajustes', 'al volver a abrir enseña el elegido con «Cambiar»')
    await clic(a, '[data-sueno-cambiar]')
    await escribirBuscador(a, 'peru')
    await clic(a, '[data-sueno-resultado="Perú"]')
    await esperar(a, "!document.querySelector('[data-sueno-buscador]')")
    await a.esp(300)
    g = await J(a, 'JSON.stringify(window.__demoPrimeraVez)')
    debe(/Perú/.test(await fila()) && g.sueno?.tipo === 'pais' && g.sueno.iso === 'pe' && g.suenos.length === 2, 'ajustes', 'cambiarlo por un país (Perú) lo guarda')
    await clic(a, '[data-ajuste="sueno"]')
    await esperar(a, "Boolean(document.querySelector('[data-opcion-hoja=\"sueno-quitar\"]'))", 40)
    await clic(a, '[data-opcion-hoja="sueno-quitar"]')
    await a.esp(400)
    g = await J(a, 'JSON.stringify(window.__demoPrimeraVez)')
    debe(g.sueno === null && /Sin decirlo/.test(await fila()), 'ajustes', '«Quitar mi viaje soñado» lo deja vacío')
  } finally {
    a.cerrar()
  }
}
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: SIN_SUENOS })
  try {
    await a.evaluar("import('/src/store/useAjustesUi.ts').then((m) => m.useAjustesUi.getState().abrir('ajustes')).then(() => true)")
    await esperar(a, "Boolean(document.querySelector('[data-ajuste=\"pais-vive\"]'))", 40)
    await a.esp(1200)
    debe(!(await a.evaluar("Boolean(document.querySelector('[data-ajuste=\"sueno\"]'))")) && (await a.evaluar("Boolean(document.querySelector('[data-ajuste=\"pais-vive\"]'))")), 'sin_0093', 'sin la 0093, Ajustes no enseña la fila de los sueños y lo demás sigue igual')
  } finally {
    a.cerrar()
  }
}

console.log('9. El panel: «Destinos soñados» con las mismas barras, banderas y periodo; sin la 0093, «Pronto»')
const RUTA_PANEL = (ruta, extra = '') => `${ruta}?cuentas=on&logros=on&logrosDemo=1&apertura=0${extra}`
{
  const a = await abrirApp(APP, { ruta: RUTA_PANEL('/admin/destinos'), ancho: 1280, alto: 900, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(a, "Boolean(document.querySelector('[data-bloque=\"sonados\"]'))", 80), 'panel', 'Destinos carga y tiene el bloque «Destinos soñados»')
    await a.esp(500)
    const p = await J(a, `JSON.stringify({ texto: document.querySelector('[data-bloque="sonados"]').innerText.replace(/\\s+/g, ' '), banderas: [...document.querySelectorAll('[data-bloque="sonados"] [data-bandera]')].map((b) => b.getAttribute('data-bandera')),
      barras: document.querySelectorAll('[data-bloque="sonados"] [data-sonado] span[style*="linear-gradient"]').length, pedidosTitulo: document.querySelector('[data-bloque="mas-pedidos"]').innerText.replace(/\\s+/g, ' ').slice(0, 60),
      avisarRoma: document.querySelector('[data-avisar-sonado="Roma"]')?.disabled, avisarTokio: document.querySelector('[data-avisar-sonado="Tokio"]')?.disabled, pronto: Boolean(document.querySelector('[data-pronto-sonados]')) })`)
    debe(/Destinos soñados/.test(p.texto) && /Tokio/.test(p.texto) && /Japón/.test(p.texto) && /58/.test(p.texto) && !p.pronto, 'panel', `el panel enseña «Destinos soñados» con Tokio, Japón… y sus números (${p.texto.slice(0, 120)})`)
    debe(p.banderas.join() === 'jp,jp,it,id' && p.barras >= 4, 'panel', `con banderas (${p.banderas}) y barras como «Los más pedidos»`)
    debe(/este mes|Este mes|Últimos|mes/i.test(p.texto), 'panel', 'y con el periodo de arriba en el título (como «Los más pedidos»)')
    debe(p.avisarRoma === false && p.avisarTokio === true, 'panel', '[Avisar] solo se enciende en lo que ya está en la app (Roma sí; Tokio aún no)')
    await clic(a, '[data-avisar-sonado="Roma"]')
    await esperar(a, "/avisadas 22 personas que lo soñaban/.test(document.querySelector('[data-mensaje-destinos]')?.innerText ?? '')", 20)
    debe(/Roma: avisadas 22 personas que lo soñaban/.test((await a.evaluar("document.querySelector('[data-mensaje-destinos]')?.innerText ?? ''")) ?? ''), 'panel', '[Avisar] dice cuántas personas se han avisado')
  } finally {
    a.cerrar()
  }
}
{
  const SIN = "try{sessionStorage.setItem('trazo:demo-sin-0091','1')}catch(e){}"
  const a = await abrirApp(APP, { ruta: RUTA_PANEL('/admin/destinos'), ancho: 1280, alto: 900, sinEsperarRoot: true, esperaFija: 5, antes: SIN })
  try {
    debe(await esperar(a, "Boolean(document.querySelector('[data-bloque=\"sonados\"]'))", 80), 'panel', 'sin la 0093 el panel carga y tiene el bloque')
    const t = await a.evaluar("document.querySelector('[data-bloque=\"sonados\"]').innerText.replace(/\\s+/g, ' ')")
    debe(/Destinos soñados/.test(t) && /Pronto/.test(t) && !/Tokio/.test(t), 'sin_0093', `sin la 0093 el bloque enseña «Pronto» (${t})`)
  } finally {
    a.cerrar()
  }
}

console.log(`\nPrueba de la Tanda V39 (suenos): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
