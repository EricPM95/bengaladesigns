// Tanda 10S5 (agente L, segunda parte): el billete en varios móviles de la MISMA persona (migración 0070), privado, y el invitado que añade el suyo.
//   1 · la migración 0070 en PGlite (se aplica y se repite, RLS con 4 reglas propias, otra persona no lee ni escribe lo ajeno) y COMPROBAR_0070.sql («FALTA» antes, «Aplicada» después).
//   2 · la sincronización del store con una nube de mentira que hace de RLS: dos móviles de la misma persona, otra cuenta sin acceso, sin conexión (pendiente y se sube al volver), sin la 0070 (no pasa nada), quitar en un móvil.
//   3 · en la app (Chrome): el invitado añade su tarjeta de embarque desde su tarjeta de vuelo; el administrador no la ve.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S5_L2.mjs
// (La prueba contra el Supabase REAL, con cuentas fijas, está aparte: pruebaTanda10S5_L2_real.mjs, que solo vale con la 0070 aplicada.)
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { build } from 'esbuild'
import { PGlite } from '@electric-sql/pglite'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  ✗ [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n')

// ═══ 1. La migración (PGlite) ═══
console.log('1. La migración 0070 (PGlite) y su comprobación')
{
  const bd = new PGlite()
  // Lo que Supabase ya trae: el esquema auth, auth.uid() (de una variable de la sesión), el rol authenticated y la tabla de viajes.
  await bd.exec(`
    create schema if not exists auth;
    create table auth.users (id uuid primary key);
    create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    do $$ begin if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if; end $$;
    create table public.trips (id uuid primary key);
    grant usage on schema public, auth to authenticated;
    grant execute on function auth.uid() to authenticated;
  `)
  const sql = leer('supabase/migrations/0070_billetes_personales.sql')
  const comprobar = leer('docs/dias/COMPROBAR_0070.sql').split('-- Cuántas')[0]
  const antes = await bd.query(comprobar)
  debe(antes.rows[0]?.migracion_0070 === 'FALTA', '1 comprobar', `antes de aplicarla dice «${antes.rows[0]?.migracion_0070}»`)
  try {
    await bd.exec(sql)
    await bd.exec(sql)
    debe(true, '1 migración', 'la 0070 se aplica y se puede pegar dos veces')
  } catch (e) {
    debe(false, '1 migración', `la 0070 falla: ${String(e.message).slice(0, 200)}`)
  }
  const despues = await bd.query(comprobar)
  debe(despues.rows[0]?.migracion_0070 === 'Aplicada', '1 comprobar', `después de aplicarla dice «${despues.rows[0]?.migracion_0070}»`)
  const pol = await bd.query("select cmd, qual, with_check from pg_policies where tablename = 'billetes_personales'")
  debe(pol.rows.length === 4, '1 rls', `4 reglas, una por operación (${pol.rows.length})`)
  debe(pol.rows.every((p) => /auth\.uid\(\)/.test(`${p.qual ?? ''}${p.with_check ?? ''}`) && /user_id/.test(`${p.qual ?? ''}${p.with_check ?? ''}`)), '1 rls', 'todas miran SOLO que la fila sea de quien pregunta (user_id = auth.uid())')
  debe(!pol.rows.some((p) => /es_miembro|trips|admin/.test(`${p.qual ?? ''}${p.with_check ?? ''}`)), '1 rls', 'ninguna regla deja leer al administrador ni a los miembros del viaje')
  const cols = await bd.query("select column_name from information_schema.columns where table_name = 'billetes_personales'")
  debe(!cols.rows.some((c) => /pdf|archivo|file|imagen/i.test(c.column_name)), '1 privado', `no hay columna para el PDF (${cols.rows.map((c) => c.column_name)})`)
  // Comportamiento de verdad: dos personas, el mismo viaje.
  await bd.exec('grant all on public.billetes_personales to authenticated;') // (Supabase da estos permisos de partida a sus tablas; lo que decide quién ve qué son las reglas.)
  const U1 = '11111111-1111-1111-1111-111111111111', U2 = '22222222-2222-2222-2222-222222222222', T = '33333333-3333-3333-3333-333333333333'
  await bd.exec(`insert into auth.users values ('${U1}'), ('${U2}'); insert into public.trips values ('${T}');`)
  const como = async (uid, consulta) => {
    await bd.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);`)
    try {
      return await bd.query(consulta)
    } finally {
      await bd.exec('reset role;')
    }
  }
  await como(U1, `insert into public.billetes_personales (trip_id, user_id, datos) values ('${T}', '${U1}', '{"arrival":{"asiento":"14C"}}')`)
  const propia = await como(U1, 'select datos from public.billetes_personales')
  debe(propia.rows.length === 1 && propia.rows[0].datos?.arrival?.asiento === '14C', '1 rls', 'la dueña lee su billete')
  const ajena = await como(U2, 'select datos from public.billetes_personales')
  debe(ajena.rows.length === 0, '1 rls', `otra persona del mismo viaje NO lo ve (${ajena.rows.length} filas)`)
  let escribirAjeno = false
  try {
    await como(U2, `insert into public.billetes_personales (trip_id, user_id, datos) values ('${T}', '${U1}', '{}')`)
    escribirAjeno = true
  } catch {
    escribirAjeno = false
  }
  debe(!escribirAjeno, '1 rls', 'otra persona no puede escribir en la fila de la dueña')
  const upd = await como(U2, "update public.billetes_personales set datos = '{}'::jsonb returning 1")
  debe(upd.rows.length === 0, '1 rls', 'ni cambiarla')
  const del = await como(U2, 'delete from public.billetes_personales returning 1')
  debe(del.rows.length === 0, '1 rls', 'ni borrarla')
  const sigue = await como(U1, 'select count(*)::int as n from public.billetes_personales')
  debe(sigue.rows[0].n === 1, '1 rls', 'y la de la dueña sigue ahí')
  await bd.close()
}

// ═══ 2. La sincronización del store ═══
console.log('2. La sincronización (nube de mentira con RLS)')
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba10s5l2-'))
  const falso = path.join(tmp, 'supabaseFalso.ts')
  fs.writeFileSync(falso, `
// (Una sola nube para todos los «móviles»: cada import del store trae su propia copia de este módulo.)
export const nube: any = ((globalThis as any).__nubeFalsa ??= { filas: new Map<string, any>(), uid: 'u1' as string | null, sin0070: false, sinRed: false, subidas: 0 })
const clave = (t: string, u: string) => t + '|' + u
export const supabase: any = {
  auth: { getUser: async () => (nube.sinRed ? { data: { user: null } } : { data: { user: nube.uid ? { id: nube.uid } : null } }) },
  from: (_t: string) => ({
    select: () => {
      const f: any = {}
      const eq = (c: string, v: string) => { f[c] = v; return q }
      const q: any = { eq, maybeSingle: async () => {
        if (nube.sin0070) return { data: null, error: { message: 'relation does not exist' } }
        if (nube.sinRed) return { data: null, error: { message: 'Failed to fetch' } }
        // RLS: solo las filas de quien pregunta, diga lo que diga el filtro
        const fila = nube.filas.get(clave(f.trip_id, nube.uid))
        return { data: fila ?? null, error: null }
      } }
      return q
    },
    upsert: async (row: any) => {
      if (nube.sin0070) return { error: { message: 'relation does not exist' } }
      if (nube.sinRed) return { error: { message: 'Failed to fetch' } }
      if (row.user_id !== nube.uid) return { error: { message: 'new row violates row-level security policy' } }
      nube.subidas++
      nube.filas.set(clave(row.trip_id, row.user_id), { datos: row.datos, actualizado_en: row.actualizado_en })
      return { error: null }
    },
  }),
}
`)
  const entrada = path.join(tmp, 'entrada.ts')
  fs.writeFileSync(entrada, `export * from '${path.resolve('src/store/useBilleteStore.ts').replace(/\\/g, '/')}'\nexport { nube } from '${falso.replace(/\\/g, '/')}'\n`)
  const salida = path.join(tmp, 'store.mjs')
  await build({
    entryPoints: [entrada], bundle: true, format: 'esm', platform: 'node', outfile: salida, logLevel: 'silent', define: { 'import.meta.env.DEV': 'true', 'import.meta.env.MODE': '"test"' },
    plugins: [{ name: 'falso', setup(b) { b.onResolve({ filter: /supabaseClient$/ }, () => ({ path: falso })) } }],
  })
  // «Móviles»: cada uno su localStorage y su propia copia del store (el módulo se importa dos veces).
  const memoria = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m } }
  const eventos = {}
  globalThis.window = { addEventListener: (n, f) => { (eventos[n] ??= []).push(f) }, localStorage: null }
  const importar = (id) => import(`file://${salida.replace(/\\/g, '/')}?movil=${id}`)
  const A = await importar('A')
  const B = await importar('B')
  const movA = memoria(), movB = memoria()
  const en = (movil, m, f) => { globalThis.window.localStorage = movil; return f(m) }
  const nube = A.nube
  const T = 'viaje-1'
  const billete = (asiento, extra = {}) => ({ horaRoma: '11:25', localizador: 'ABC123', terminal: '1', asiento, coche: null, codigo: { texto: 'x', formato: 'qr', imagen: null, dibujo: 'data:image/svg+xml;utf8,<svg/>' }, codigoFuera: 'BCN', dueno: null, ...extra })
  const esperar = () => new Promise((r) => setTimeout(r, 30))

  // 2a. Móvil A guarda → sube a la fila de u1.
  nube.uid = 'u1'
  await en(movA, A, async (m) => { m.useBilleteStore.getState().cargar(T); m.useBilleteStore.getState().poner(T, 'arrival', billete('14C')); await esperar() })
  debe(nube.filas.has(`${T}|u1`), '2 sube', 'al guardar en el móvil A, el billete sube a la fila privada de la persona')
  const fila = nube.filas.get(`${T}|u1`)
  debe(fila.datos.arrival?.asiento === '14C' && fila.datos.arrival?.dueno === 'u1', '2 sube', 'con su dueño apuntado (se le apunta aunque no se supiera al guardar)')
  debe(!/pdf|archivo/i.test(JSON.stringify(fila)), '2 sube', 'y sin el PDF: solo los datos y el código')
  // 2b. Móvil B, la misma persona, vacío → se lo trae.
  await en(movB, B, async (m) => { m.useBilleteStore.getState().cargar(T); await m.useBilleteStore.getState().sincronizar(T) })
  const enB = en(movB, B, (m) => m.useBilleteStore.getState().datos)
  debe(enB.arrival?.asiento === '14C' && enB.arrival?.codigo?.dibujo, '2 otro móvil', 'el móvil B de la misma persona ve el billete y el código')
  debe(movB.getItem(`trazo:billete:v1:${T}`)?.includes('14C'), '2 otro móvil', 'y lo deja guardado en B (se ve sin internet)')
  // 2c. Otra cuenta (el administrador, otro viajero) en el MISMO viaje: nada.
  nube.uid = 'u2'
  const movC = memoria()
  await en(movC, B, async (m) => { m.useBilleteStore.setState({ tripId: null, datos: {} }); m.useBilleteStore.getState().cargar(T); await m.useBilleteStore.getState().sincronizar(T) })
  debe(Object.keys(en(movC, B, (m) => m.useBilleteStore.getState().datos)).length === 0, '2 privado', 'otra cuenta del mismo viaje NO recibe el billete')
  // 2d. Un móvil compartido con billete de OTRA persona dentro: no sube a la cuenta de u2.
  const movD = memoria()
  movD.setItem(`trazo:billete:v1:${T}`, JSON.stringify({ arrival: { ...billete('99Z'), dueno: 'u1' } }))
  await en(movD, A, async (m) => { m.useBilleteStore.setState({ tripId: null, datos: {} }); m.useBilleteStore.getState().cargar(T); await m.useBilleteStore.getState().sincronizar(T) })
  debe(!nube.filas.has(`${T}|u2`) || !JSON.stringify(nube.filas.get(`${T}|u2`)).includes('99Z'), '2 privado', 'el billete de otra persona que quedó en este móvil no se sube a la cuenta de quien lo usa ahora')
  // 2e. Sin conexión: se guarda en el móvil, queda pendiente, y sube al volver.
  nube.uid = 'u1'
  nube.sinRed = true
  await en(movA, A, async (m) => { m.useBilleteStore.getState().poner(T, 'departure', billete('15D', { horaRoma: '18:05' })); await esperar() })
  debe(en(movA, A, (m) => m.useBilleteStore.getState().datos.departure?.asiento === '15D'), '2 sin conexión', 'sin conexión se guarda en el móvil y se ve')
  debe(movA.getItem(`trazo:billete:v1:${T}:pend`) === '1', '2 sin conexión', 'y queda marcado como pendiente de subir')
  debe(nube.filas.get(`${T}|u1`).datos.departure === undefined, '2 sin conexión', 'la nube aún no lo tiene')
  nube.sinRed = false
  await en(movA, A, async (m) => { await m.useBilleteStore.getState().sincronizar(T) })
  debe(nube.filas.get(`${T}|u1`).datos.departure?.asiento === '15D', '2 sin conexión', 'al volver la conexión, sube')
  debe(movA.getItem(`trazo:billete:v1:${T}:pend`) === null, '2 sin conexión', 'y se quita la marca de pendiente')
  // 2f. B se entera del cambio de A.
  await en(movB, B, async (m) => { await m.useBilleteStore.getState().sincronizar(T) })
  debe(en(movB, B, (m) => m.useBilleteStore.getState().datos.departure?.asiento === '15D'), '2 otro móvil', 'B recibe la vuelta que se guardó en A')
  // 2g. Quitar en un móvil se quita en el otro (gana lo último).
  await esperar()
  await en(movA, A, async (m) => { m.useBilleteStore.getState().quitar(T, 'arrival'); await esperar() })
  await en(movB, B, async (m) => { await m.useBilleteStore.getState().sincronizar(T) })
  const trasQuitar = en(movB, B, (m) => m.useBilleteStore.getState().datos)
  debe(!trasQuitar.arrival && trasQuitar.departure?.asiento === '15D', '2 quitar', 'lo que se quita en A se quita en B, y lo demás sigue')
  // 2h. Sin la 0070: nada se rompe, todo sigue en el móvil.
  nube.sin0070 = true
  let lanzo = false
  try {
    await en(movA, A, async (m) => {
      m.useBilleteStore.getState().poner(T, 'arrival', billete('16A'))
      await esperar()
      await m.useBilleteStore.getState().sincronizar(T)
    })
  } catch {
    lanzo = true
  }
  debe(!lanzo, '2 sin la 0070', 'sin la migración aplicada no lanza ningún error')
  debe(en(movA, A, (m) => m.useBilleteStore.getState().datos.arrival?.asiento === '16A'), '2 sin la 0070', 'y el billete sigue en el móvil')
  nube.sin0070 = false
  // 2i. Otra cuenta no puede escribir en la fila ajena (la nube de mentira aplica la misma regla que la 0070).
  nube.uid = 'u2'
  const antesSubidas = nube.subidas
  await en(movA, A, async (m) => { await m.useBilleteStore.getState().sincronizar(T) })
  debe(!JSON.stringify(nube.filas.get(`${T}|u1`)).includes('16A') || nube.uid === 'u1', '2 privado', 'la fila de la dueña no la cambia otra cuenta')
  void antesSubidas
  delete globalThis.window
  fs.rmSync(tmp, { recursive: true, force: true })
}

// ═══ 3. En la app: el invitado añade el suyo ═══
console.log('3. El invitado añade su tarjeta de embarque')
const { abrirApp } = await import('./_enLaApp.mjs')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const PDF = path.resolve('scripts/destino/_ejemplos_billete/tarjeta_avion_ejemplo.pdf')
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
const GENTE = [
  { id: 'p-eric', nombre: 'Eric', foto: null, esAdmin: true, permiso: 'admin' },
  { id: 'p-ana', nombre: 'Ana', foto: null, esAdmin: false, permiso: 'editar' },
]
const LECTURA = { modo: 'avion', numero: 'VY 6102', compania: 'Vueling', localizador: 'ABC123', fecha: '2026-12-05', fecha_llegada: null, hora_salida: '08:30', hora_llegada: '10:25', origen: { ciudad: 'Barcelona', codigo: 'BCN', nombre: 'Barcelona-El Prat', terminal: '1', puerta: 'B34' }, destino: { ciudad: 'Roma', codigo: 'FCO', nombre: 'Roma-Fiumicino', terminal: '1', puerta: null }, asiento: '14C', coche: null, codigo_caja: null }
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0', ancho: 390, alto: 844 })
try {
  const ev = (js) => a.evaluar(js)
  for (let intento = 0; intento < 3; intento++) {
    for (let i = 0; i < 360 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
    try {
      await ev('window.__rutaPrueba().then(() => true)')
      break
    } catch (e) {
      if (intento === 2) throw e
      await ev('location.reload()').catch(() => undefined)
      await a.esp(5000)
    }
  }
  for (let i = 0; i < 90 && !(await ev('window.__ruta?.getState().route != null').catch(() => false)); i++) await a.esp(1000)
  await ev("Promise.all([import('/src/store/useViajeCompartido.ts'), import('/src/store/useLoSuyo.ts'), import('/src/store/useMisReservas.ts')]).then(() => true)")
  await a.esp(3000)
  for (let i = 0; i < 6; i++) {
    const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  await a.cdp('Page.setInterceptFileChooserDialog', { enabled: true }).catch(() => undefined)
  await ev(`(() => { const f0 = window.fetch.bind(window); window.fetch = async (u, o) => { if (String(u).includes('/api/read-ticket')) return new Response(JSON.stringify(${JSON.stringify(LECTURA)}), { status: 200, headers: { 'Content-Type': 'application/json' } }); return f0(u, o) }; return true })()`)
  const ponerGente = (yo) =>
    ev(`(async () => {
      const yo = ${JSON.stringify(yo)}
      const g = ${JSON.stringify(GENTE)}.map((p) => ({ ...p, esYo: p.id === 'p-' + yo }))
      sessionStorage.removeItem('trazo:invitado'); sessionStorage.removeItem('trazo:permiso')
      if (yo !== 'eric') { sessionStorage.setItem('trazo:invitado', '1'); sessionStorage.setItem('trazo:permiso', 'editar') }
      const urls = [...new Set(performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('store/useViajeCompartido.ts')))]
      const tiendas = [window.__viaje]
      for (const u of urls) tiendas.push((await import(/* @vite-ignore */ u)).useViajeCompartido)
      for (const st of new Set(tiendas)) { st.setState({ cargar: async () => {} }); st.getState().poner({ gente: g }) }
      window.__modoCuentas?.poner('cada_uno', 3)
      return true
    })()`)
  const loSuyo = (js) =>
    ev(`(async () => {
      const urls = [...new Set(performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('store/useLoSuyo.ts')))]
      const tiendas = [window.__loSuyo]
      for (const u of urls) tiendas.push((await import(/* @vite-ignore */ u)).useLoSuyo)
      for (const st of new Set(tiendas)) { st.setState({ cargar: async () => {} }); await (async (s) => { ${js} })(st) }
      return true
    })()`)
  await ev("window.__ruta.setState((s) => ({ route: { ...s.route, arrivalFlightTime: '11:15', departureFlightTime: '18:05', arrivalPointId: 'fco', departurePointId: 'cia' } })); true")
  await ponerGente('ana')
  await loSuyo("s.setState({ mio: { vuelo: { ida: { hora: '09:00', punto: 'Barcelona', fecha: null }, vuelta: { hora: '19:00', punto: 'Fiumicino', fecha: null }, puestoPor: null, para: ['p-ana'] }, alojamiento: null }, grupo: {}, entradas: [] })")
  await ev("window.__ruta.getState().setMode('bookings'); true")
  await a.esp(2000)
  const estado = () => ev(`(() => {
    const b = document.querySelector('[data-billete-invitado="arrival"]')
    return b ? { texto: b.innerText.replace(/\\s+/g, ' '), boton: b.querySelector('[data-billete-anadir]')?.textContent ?? null, chip: Boolean(b.querySelector('[data-billete-codigo-pequeno] img')) } : null
  })()`)
  let g1 = await estado()
  debe(g1 && g1.boton === 'Añadir tarjeta de embarque' && /Desde el PDF, una foto o una captura/.test(g1.texto), '3 invitado', `el invitado ve [Añadir tarjeta de embarque] en su tarjeta de vuelo (${g1 && g1.texto})`)
  await ev("document.querySelector('[data-billete-invitado=\"arrival\"] [data-billete-anadir]')?.click(); true")
  await a.esp(300)
  const doc = await a.cdp('DOM.getDocument', { depth: 1 })
  const nodo = await a.cdp('DOM.querySelector', { nodeId: doc.result.root.nodeId, selector: '[data-billete-invitado="arrival"] [data-billete-archivo]' })
  await a.cdp('DOM.setFileInputFiles', { nodeId: nodo.result.nodeId, files: [PDF] })
  await a.hasta("Boolean(document.querySelector('[data-billete-invitado=\"arrival\"] [data-billete-codigo-pequeno] img'))", { segundos: 90 })
  g1 = await estado()
  debe(g1 && g1.chip && /Asiento 14C/.test(g1.texto) && /Localizador ABC123/.test(g1.texto), '3 invitado', `tras elegir el PDF: sus datos y el código (${g1 && g1.texto})`)
  await ev("document.querySelector('[data-billete-invitado=\"arrival\"] [data-billete-codigo-pequeno]')?.click(); true")
  await a.esp(500)
  const grande = await ev("(() => { const d = document.querySelector('[data-billete-pantalla-completa]'); const i = d?.querySelector('img'); return d ? { w: Math.round(i?.getBoundingClientRect().width ?? 0), pie: d.querySelector('[data-billete-grande-pie]')?.textContent } : null })()")
  debe(grande && grande.w >= 250 && /Asiento 14C/.test(grande.pie ?? ''), '3 invitado', `y se amplía a pantalla completa (${JSON.stringify(grande)})`)
  fs.mkdirSync(SALIDA, { recursive: true })
  await a.captura(path.join(SALIDA, '10s5_billete_invitado_01_ampliado.jpg'))
  await ev("document.querySelector('[data-billete-cerrar]')?.click(); true")
  await a.esp(300)
  await ev("document.querySelector('[data-billete-invitado=\"arrival\"]')?.scrollIntoView({ block: 'center' }); true")
  await a.captura(path.join(SALIDA, '10s5_billete_invitado_02_tarjeta.jpg'))
  // El administrador, en este mismo móvil, no ve el de Ana.
  await ponerGente('eric')
  await ev("window.__ruta.getState().setMode('days'); true")
  await a.esp(500)
  await ev("window.__ruta.getState().setMode('bookings'); true")
  await a.esp(1800)
  const adm = await ev("({ chip: Boolean(document.querySelector('[data-blk=\"llegada\"] [data-billete-codigo-pequeno]')), texto: (document.querySelector('[data-blk=\"llegada\"]')?.innerText ?? '').includes('14C') })")
  debe(adm.chip === false && adm.texto === false, '3 privado', `el administrador, en el mismo móvil, NO ve ni el código ni el asiento de Ana (${JSON.stringify(adm)})`)
  const ana = await ev("(() => { const v = JSON.stringify(window.__ruta.getState().route); return /ABC123|14C/.test(v) })()")
  debe(ana === false, '3 privado', 'y nada de eso está en la ruta compartida')
} finally {
  await a.cerrar()
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
