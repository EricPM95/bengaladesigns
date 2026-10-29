// Tanda 10N10 (A) · apartado 1, lo comprobable SIN red: textos, unir / no unir, la migración 0065 (PGlite con las migraciones reales), el anfitrión de cambios y el sonido.
//   node scripts/destino/pruebaTanda10N10_avisos.mjs
// (La prueba contra el Supabase REAL es `pruebaTanda10N10_avisos_real.mjs`.)
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { buildSync } from 'esbuild'
import { crearBaseDePrueba } from './_baseDeDatosPrueba.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const esp = (ms) => new Promise((r) => setTimeout(r, ms))
globalThis.window = { localStorage: { getItem: () => null, setItem: () => undefined }, __sonidosPedidos: [], setTimeout }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'n10avisos-'))
const R = (p) => path.resolve(p).replace(/\\/g, '/')
fs.writeFileSync(path.join(tmp, 'e.ts'), `export * from '${R('src/lib/sellarCambio.ts')}'\nexport { useFranjaStore, anunciarAvisosNuevos, avisosAnunciados } from '${R('src/store/useFranjaStore.ts')}'\nexport { crearAnfitrionDeCambios } from '${R('src/lib/anfitrionDeCambios.ts')}'\nexport * from '${R('shared/avisos/textos.js')}'\n`)
buildSync({ entryPoints: [path.join(tmp, 'e.ts')], bundle: true, format: 'esm', platform: 'node', outfile: path.join(tmp, 'app.mjs'), logLevel: 'silent', define: { 'import.meta.env.DEV': 'false', 'import.meta.env': '{}' } })
const app = await import('file://' + path.join(tmp, 'app.mjs').replace(/\\/g, '/'))

console.log('1. Los textos')
{
  const v = { tipo: 'reserva_grupo', payload: { caso: 'vuelo_propio', con_horas: true, quien: 'Viajes', detalle: 'ida jue 29 · 11:20, vuelta sáb 31 · 18:05' } }
  debe(app.textoDelAviso(v) === 'Viajes ha puesto su vuelo: ida jue 29 · 11:20, vuelta sáb 31 · 18:05.', 'vuelo invitado', app.textoDelAviso(v))
  debe(app.franjaDelAviso(v).titulo === 'Viajes ha puesto su vuelo' && /ida jue 29/.test(app.franjaDelAviso(v).detalle), 'vuelo invitado', 'la franja: ' + JSON.stringify(app.franjaDelAviso(v)))
  debe(app.textoDelAviso({ tipo: 'reserva_grupo', payload: { caso: 'vuelo_propio', quien: 'Ana', detalle: 'Llegada a Roma' } }) === 'Ana ha puesto su propio vuelo.', 'vuelo viejo', 'el aviso de siempre se queda igual')
  const ft = app.franjaDelAviso({ tipo: 'viaje_cambiado', payload: { quien: 'Eric', destino: 'Roma', cambio: { id: 'c1', quitadas: [{ nombre: 'Free Tour de Roma' }], n_quitadas: 1, dias_antes: 5, dias_despues: 5 } } })
  debe(ft.titulo === 'Eric ha quitado el Free Tour', 'free tour', ft.titulo)
}

console.log('2. La base de datos (0058 + 0059 + 0061 + 0065)')
const MIGRACIONES = /^(0001|0002|0003|0012|0018|0020|0021|0023|0024|0025|0026|0027|0028|0030|0031|0034|0035|0036|0037|0038|0040|0041|0042|0043|0046|0048|0049|0051|0053|0054|0055|0058|0059|0061|0065)_/
const bd = await crearBaseDePrueba({ migraciones: MIGRACIONES, alFallar: (m) => { console.log(String(m).slice(0, 250)); debe(false, 'migracion', m) } })
const { q, como, servidor, nuevoUsuario } = bd
debe(bd.aplicadas.includes('0065_avisos_cada_cambio_nuevo_y_vuelo_del_invitado.sql'), 'migracion', 'la 0065 se aplica')
// Se puede repetir (idempotente): se aplica otra vez.
{
  const sql = fs.readFileSync('supabase/migrations/0065_avisos_cada_cambio_nuevo_y_vuelo_del_invitado.sql', 'utf8')
  let ok = true
  try { await bd.db.exec(sql) } catch (e) { ok = false; console.log(String(e.message).slice(0, 200)) }
  debe(ok, 'idempotente', 'la 0065 se puede repetir')
}
const { ultimoCambioDe } = await import('../../shared/avisos/cambioViaje.js')
const dia = (n, paradas) => ({ id: 'd' + n, dayNumber: n, city: 'Roma', stops: paradas.map(([id, name]) => ({ id, name })), meals: [] })
const ruta = (dias, extra = {}) => ({ id: 'r1', destination: 'Roma', answers: { dateRange: { start: '2026-11-11', end: '2026-11-15' } }, days: dias, modoCuentas: 'conjunta', ...extra })
const base = () => [dia(1, [['a1', 'Coliseo'], ['a2', 'Foro Romano']]), dia(2, [['a3', 'Panteón'], ['ft', 'Free Tour de Roma']]), dia(3, [['a5', 'Trastevere']])]
const eric = await nuevoUsuario('eric@correo.es', false, 'Eric')
const viajes = await nuevoUsuario('viajes@correo.es', false, 'Viajes')
const viaje = await como(eric, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [eric, JSON.stringify(ruta(base()))]))[0].id)
await servidor(() => q("insert into public.trip_members (trip_id, user_id, invited_by, permiso) values ($1, $2, $3, 'editar')", [viaje, viajes, eric]))
const avisosDe = (uid, tipo = 'viaje_cambiado') => servidor(() => q('select id, payload, leido_en from public.avisos where user_id = $1 and tipo = $2 order by creado_en', [uid, tipo]))
const guarda = (uid, r) => como(uid, () => q('update public.trips set route = $2::jsonb where id = $1', [viaje, JSON.stringify(r)]))
let actual = ruta(base())
const paso = async (uid, despues, accion = null) => {
  const antes = actual
  const conId = { ...despues, ultimoCambio: ultimoCambioDe(antes, despues, accion) }
  await guarda(uid, conId)
  actual = conId
}
{
  // Dos cambios seguidos de la misma persona: dos avisos, ninguno se pierde, ambos nuevos.
  await paso(eric, { ...actual, days: actual.days.map((d) => ({ ...d, stops: d.stops.filter((s) => s.id !== 'ft') })) })
  const a1 = await avisosDe(viajes)
  await paso(eric, { ...actual, days: actual.days.map((d, i) => (i === 0 ? { ...d, stops: [...d.stops, { id: 'n1', name: 'Ara Pacis' }] } : d)) })
  const a2 = await avisosDe(viajes)
  debe(a1.length === 1 && a2.length === 2 && a2[0].id === a1[0].id, 'dos seguidos', `dos cambios seguidos = dos avisos, el primero se queda (${a1.length} → ${a2.length})`)
  debe(app.textoDelAviso({ tipo: 'viaje_cambiado', payload: a2[0].payload }) === 'Eric ha quitado el Free Tour.', 'dos seguidos', 'el primero sigue diciendo lo suyo: ' + app.textoDelAviso({ tipo: 'viaje_cambiado', payload: a2[0].payload }))
  debe(/Ara Pacis/.test(app.textoDelAviso({ tipo: 'viaje_cambiado', payload: a2[1].payload })), 'dos seguidos', 'y el segundo lo suyo')
  // Un paso más de la MISMA acción (mismo id) se junta con el aviso de esa acción; no con otro.
  const mismoId = actual.ultimoCambio
  await guarda(eric, { ...actual, days: actual.days.map((d, i) => (i === 2 ? { ...d, stops: [{ id: 'a5', name: 'Trastevere' }, { id: 'zz', name: 'Gianicolo' }] } : d)), ultimoCambio: mismoId })
  const a3 = await avisosDe(viajes)
  debe(a3.length === 2, 'misma acción', `un paso más con el mismo id no crea otro aviso (${a3.length})`)
  // Una acción con nombre propio sigue siendo su propio aviso.
  await paso(eric, { ...actual, days: actual.days.map((d) => ({ ...d })) }, { tipo: 'recuperar_ruta' })
  const a4 = await avisosDe(viajes)
  debe(a4.length === 3, 'con nombre', 'recuperar la ruta es un aviso más')
  debe((await avisosDe(eric)).length === 0, 'propio', 'Eric no recibe los suyos')
}
{
  // El vuelo del invitado, solo para él, en una cuenta CONJUNTA: al administrador le llega.
  const vuelo = { ida: { fecha: '2026-10-29', hora: '11:20' }, vuelta: { fecha: '2026-10-31', hora: '18:05' } }
  const det = 'ida jue 29 · 11:20, vuelta sáb 31 · 18:05'
  await como(viajes, () => q('select public.poner_lo_suyo_para($1, $2::jsonb, null, $3::uuid[], $4)', [viaje, JSON.stringify({ ...vuelo, puestoPor: viajes, para: [viajes] }), [viajes], det]))
  const av = await avisosDe(eric, 'reserva_grupo')
  debe(av.length === 1, 'vuelo invitado', `al administrador le llega 1 aviso (${av.length})`)
  debe(av[0] && app.textoDelAviso({ tipo: 'reserva_grupo', payload: av[0].payload }) === 'Viajes ha puesto su vuelo: ida jue 29 · 11:20, vuelta sáb 31 · 18:05.', 'vuelo invitado', av[0] ? app.textoDelAviso({ tipo: 'reserva_grupo', payload: av[0].payload }) : 'sin aviso')
  // El alojamiento «solo para mí» en cuenta conjunta sigue sin avisar (10N7).
  await como(viajes, () => q('select public.poner_lo_suyo_para($1, null, $2::jsonb, $3::uuid[], $4)', [viaje, JSON.stringify({ name: 'Hotel Prati', puestoPor: viajes, para: [viajes] }), [viajes], 'Hotel Prati']))
  debe((await avisosDe(eric, 'reserva_grupo')).length === 1, 'alojamiento', 'el alojamiento solo para él en cuenta conjunta no avisa (como decidió la 10N7)')
}

console.log('3. El anfitrión de cambios (la línea «Han cambiado el viaje» ya no pisa al aviso)')
{
  const montar = (opc = {}) => {
    const dichas = []
    let anunciados = 0
    let cargas = 0
    const a = app.crearAnfitrionDeCambios({
      tripId: 't1',
      refrescar: async () => 'cambiado',
      cargarAvisos: async () => { cargas++; if (opc.llegaEnLaLista && cargas >= 2) { anunciados++; opc.llegaEnLaLista = false } },
      anunciados: () => anunciados,
      decir: (t) => dichas.push(t),
      alQuitado: () => undefined,
      esperaMs: 20,
      esperaAvisoMs: 300,
    })
    return { a, dichas, subir: () => { anunciados++ } }
  }
  // a) El cambio llega y, 150 ms después, el aviso: nada de línea.
  let m = montar()
  m.a.alViaje(); await esp(150); m.subir(); m.a.alAvisoDeCambio(); await esp(500)
  debe(m.dichas.length === 0, 'anfitrión', 'si el aviso llega después del cambio del viaje, no sale la línea «Han cambiado el viaje»')
  // b) El aviso llega antes que el cambio del viaje.
  m = montar(); m.subir(); m.a.alAvisoDeCambio(); await esp(30); m.a.alViaje(); await esp(500)
  debe(m.dichas.length === 0, 'anfitrión', 'si el aviso llega antes, tampoco')
  // c) El aviso no llega por Realtime pero sale al volver a pedir la lista.
  m = montar({ llegaEnLaLista: true }); m.a.alViaje(); await esp(600)
  debe(m.dichas.length === 0, 'anfitrión', 'si el aviso se pierde por el camino pero está en la lista, sale él y no la línea')
  // d) De verdad no hay aviso (un móvil viejo): la línea, pero pasado el plazo.
  m = montar(); m.a.alViaje(); await esp(150)
  debe(m.dichas.length === 0, 'anfitrión', 'antes del plazo no sale la línea')
  await esp(450)
  debe(m.dichas.length === 1 && m.dichas[0] === 'Han cambiado el viaje', 'anfitrión', 'sin ningún aviso, pasado el plazo sale la línea una vez')
  m.a.parar()
}

console.log('4. La franja y el sonido: cada aviso distinto suena')
{
  const aviso = (id, creado) => ({ id, tipo: 'viaje_cambiado', texto: 'x', quien: 'Eric', creado_en: creado ?? new Date().toISOString(), leido: false, payload: { trip_id: 't1', quien: 'Eric', cambio: { id, quitadas: [{ nombre: 'Panteón' }], n_quitadas: 1, dias_antes: 3, dias_despues: 3 } }, etiqueta: null })
  window.__sonidosPedidos.length = 0
  app.anunciarAvisosNuevos([], [aviso('u1')])
  const antes = app.avisosAnunciados()
  await esp(1300)
  app.anunciarAvisosNuevos([aviso('u1')], [aviso('u2'), aviso('u1')])
  debe(window.__sonidosPedidos.length === 2, 'sonido', `dos avisos distintos con 1,3 s de diferencia: suenan los dos (${window.__sonidosPedidos.length})`)
  debe(app.avisosAnunciados() === antes + 1, 'contador', 'el contador de avisos anunciados sube con cada uno')
  // Una línea de la app con la misma clave que un aviso no se lo traga.
  const store = app.useFranjaStore.getState()
  store.mostrar([{ id: 'linea:cambiado:t1:1', clave: 'cambiado:t1', titulo: 'Han cambiado el viaje', detalle: '', icono: 'info', quien: null }])
  app.anunciarAvisosNuevos([], [aviso('u3')])
  const f = app.useFranjaStore.getState().franja
  debe(f && f.items.some((i) => i.id === 'u3'), 'clave', 'el aviso de cambio nunca se descarta por haber salido la línea de la app')
}

fs.rmSync(tmp, { recursive: true, force: true })
console.log(`${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  MAL [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
