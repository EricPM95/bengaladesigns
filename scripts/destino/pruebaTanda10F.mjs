// La prueba de la Tanda 10F: ELIMINAR UN VIAJE DESDE EL PERFIL (docs/dias/PROMPT_TANDA10F_ELIMINAR.md). No toca el motor de rutas.
//   API_URL=http://localhost:8787 node scripts/destino/pruebaTanda10F.mjs [--capturas]      (hace falta `npm run server` y `npm run dev`; con --capturas hace también las de docs/dias/capturas_jutrip)
//
//  A. La base de datos de verdad (PGlite, con las migraciones reales, incluida la 0031) y el código de la nube (src/lib/eliminarViajeNube.ts) contra ella:
//     qué se borra y qué se queda, las fotos (tabla y Storage), el Pase y los logros, el invitado que sale, lo que pasa SIN la 0031 y si falla el almacén.
//  B. La app de verdad en un Chrome: [Editar] y la papelera, la hoja, eliminar uno cerrado, el abierto, el único, [Deshacer], el invitado y el viaje compartido.
import fs from 'node:fs'
import path from 'node:path'
import { crearBaseDePrueba } from './_baseDeDatosPrueba.mjs'
import { abrirApp } from './_enLaApp.mjs'
import { abrirConViajes, abrirPerfil } from './_ayuda10F.mjs'
import { borrarFilaDelViaje, contarMisFotos, eliminarViajeEnLaNube, limpiarFotosPendientes, salirDelViaje } from '../../src/lib/eliminarViajeNube.ts'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const CAPTURAS = process.argv.includes('--capturas')
const SALIDA = path.resolve('docs/dias/capturas_jutrip')

/* ───────────────────────── A. La base de datos ───────────────────────── */
console.log('A. La base de datos y el código de la nube')

/** Un cliente de Supabase de mentira, sobre la base de pruebas y como ESA persona (con las reglas de seguridad activas). */
function clienteDe(bd, uid, { fallaElAlmacen = false } = {}) {
  const { db, como } = bd
  const correr = (sql, valores) =>
    como(uid, async () => {
      try {
        const r = await db.query(sql, valores)
        return { data: r.rows, error: null }
      } catch (error) {
        return { data: null, error: { message: error.message } }
      }
    })
  return {
    from: (tabla) => {
      const e = { op: 'select', cols: '*', filtros: [] }
      const b = {
        select(cols) {
          e.op = 'select'
          e.cols = cols
          return b
        },
        delete() {
          e.op = 'delete'
          return b
        },
        eq(columna, valor) {
          e.filtros.push([columna, valor])
          return b
        },
        then(ok, ko) {
          const donde = e.filtros.map(([c], i) => `${c} = $${i + 1}`).join(' and ')
          const sql = `${e.op === 'select' ? `select ${e.cols} from` : 'delete from'} public.${tabla}${donde ? ` where ${donde}` : ''}`
          return correr(sql, e.filtros.map(([, v]) => v)).then(ok, ko)
        },
      }
      return b
    },
    storage: {
      from: (cubo) => ({
        remove: (rutas) => (fallaElAlmacen ? Promise.resolve({ error: { message: 'fallo' } }) : correr('delete from storage.objects where bucket_id = $1 and name = any($2::text[])', [cubo, rutas]).then((r) => ({ error: r.error }))),
      }),
    },
  }
}

async function escenario(bd, { con0031 = true } = {}) {
  const { q, servidor, nuevoUsuario } = bd
  if (!con0031) {
    // (Sin la 0031: se quita el disparador, como si la migración no estuviera aplicada. Quitarlo lo puede hacer la dueña de la tabla, no el servidor.)
    await bd.db.exec('reset role')
    await bd.db.exec('drop trigger if exists trg_al_borrar_viaje on public.trips')
  }
  const O = await nuevoUsuario(`o${Math.random()}@x.es`, false, 'Elena Ruiz')
  const G = await nuevoUsuario(`g${Math.random()}@x.es`, false, 'Ana Gil')
  const viaje = async (ruta) => (await servidor(() => q('insert into public.trips (traveler_id, route) values ($1, $2) returning id', [O, JSON.stringify({ id: ruta, destination: 'Roma' })])))[0].id
  const T1 = await viaje('ruta-1')
  const T2 = await viaje('ruta-2')
  const foto = async (uid, ruta, n) => {
    for (let i = 0; i < n; i++) {
      const p = `${uid}/${ruta}/f${i}.jpg`
      const id = (await servidor(() => q("insert into public.trip_photos (user_id, trip_id, day_id, day_number, storage_path, width, height, bytes) values ($1, $2, 'd1', 1, $3, 10, 10, 10) returning id", [uid, ruta, p])))[0].id
      await servidor(() => q("insert into public.trip_photo_meta (photo_id, user_id) values ($1, $2)", [id, uid]))
      for (const nombre of [p, p.replace('.jpg', '_min.jpg')]) await servidor(() => q("insert into storage.objects (bucket_id, name, owner) values ('fotos-viaje', $1, $2)", [nombre, uid]))
    }
  }
  await foto(O, 'ruta-1', 3)
  await foto(G, 'ruta-1', 2)
  await foto(O, 'ruta-2', 2)
  // Lo ligado al viaje T1: la gente, una invitación, una recomendación, un Visto y un aviso (se borran con él); un Pase, un logro, un hecho de logros y la prueba de HOY (se quedan).
  await servidor(() => q("insert into public.trip_members (trip_id, user_id, invited_by) values ($1, $2, $3)", [T1, G, O]))
  await servidor(() => q("insert into public.trip_invitations (trip_id, creada_por, codigo) values ($1, $2, $3)", [T1, O, 'C' + Math.random().toString(36).slice(2, 9)]))
  await servidor(() => q("insert into public.trip_recommendations (trip_id, author_id, tipo, payload) values ($1, $2, 'ruta', '{}'::jsonb)", [T1, G]))
  await servidor(() => q("insert into public.stop_visits (user_id, trip_id, day_id, stop_id) values ($1, $2, 'd1', 's1')", [O, T1]))
  await servidor(() => q("insert into public.logro_avisos (user_id, trip_id, tipo, enviar_en) values ($1, $2, 'resumen_viaje', now())", [O, T1]))
  const pase = (await servidor(() => q("insert into public.passes (destino, comprador_id, tipo, usos_max, codigo, trip_id) values ('Roma', $1, 'uno', 1, $3, $2) returning id", [O, T1, 'P' + Math.random().toString(36).slice(2, 9)])))[0].id
  await servidor(() => q("insert into public.achievements (user_id, logro, escalon, destino, trip_id) values ($1, 'primer_sello', '', 'Roma', $2)", [O, T1]))
  await servidor(() => q("insert into public.logro_hechos (user_id, trip_id, destino, tipo, instante) values ($1, $2, 'Roma', 'visto', now())", [O, T1]))
  await servidor(() => q("insert into public.hoy_prueba (user_id, trip_id, fecha) values ($1, $2, current_date)", [O, T1]))
  return { O, G, T1, T2, pase }
}
const cuenta = async (bd, sql, valores = []) => Number((await bd.servidor(() => bd.q(sql, valores)))[0].n)

console.log('  (preparando la base de pruebas: las migraciones reales)')
const mal = []
const bd = await crearBaseDePrueba({ alFallar: (m) => mal.push(m) })
debe(mal.length === 0 && bd.aplicadas.some((f) => f.startsWith('0031_')), 'migracion', `la 0031 se aplica con las demás sin error (${mal.join('; ')})`)

{
  const e = await escenario(bd)
  const { q } = bd
  debe((await contarMisFotos(clienteDe(bd, e.O), e.O, 'ruta-1')) === 3 && (await contarMisFotos(clienteDe(bd, e.G), e.G, 'ruta-1')) === 2, 'fotos', 'antes de eliminar, quien creó el viaje tiene 3 fotos en él y la invitada 2')
  const error = await eliminarViajeEnLaNube(clienteDe(bd, e.O), e.O, { rutaId: 'ruta-1', filaId: e.T1, esInvitado: false })
  debe(error === null, 'eliminar', `quien creó el viaje lo elimina sin error (${error})`)
  debe((await cuenta(bd, "select count(*) n from public.trips where id = $1", [e.T1])) === 0, 'eliminar', 'la fila del viaje ya no está')
  debe((await cuenta(bd, "select count(*) n from public.trips where id = $1", [e.T2])) === 1, 'eliminar', 'el otro viaje de la misma persona sigue')
  // Las fotos de quien eliminó: ni en la tabla ni en Storage (la grande y la pequeña), y su meta tampoco.
  debe((await cuenta(bd, "select count(*) n from public.trip_photos where user_id = $1 and trip_id = 'ruta-1'", [e.O])) === 0, 'fotos', 'sus fotos ya no están en trip_photos')
  debe((await cuenta(bd, "select count(*) n from storage.objects where bucket_id = 'fotos-viaje' and name like $1", [`${e.O}/ruta-1/%`])) === 0, 'fotos', 'ni sus archivos en Storage (la grande y la pequeña de cada una)')
  debe((await cuenta(bd, "select count(*) n from public.trip_photo_meta where user_id = $1 and photo_id not in (select id from public.trip_photos)", [e.O])) === 0, 'fotos', 'ni su trip_photo_meta (cae en cascada con la foto)')
  debe((await cuenta(bd, "select count(*) n from public.trip_photos where user_id = $1 and trip_id = 'ruta-2'", [e.O])) === 2 && (await cuenta(bd, "select count(*) n from storage.objects where name like $1", [`${e.O}/ruta-2/%`])) === 4, 'fotos', 'las fotos del OTRO viaje (tabla y archivos) siguen')
  // Lo que se borra con el viaje.
  for (const tabla of ['trip_members', 'trip_invitations', 'trip_recommendations', 'stop_visits', 'logro_avisos']) {
    debe((await cuenta(bd, `select count(*) n from public.${tabla} where trip_id = $1`, [e.T1])) === 0, 'borra', `${tabla}: se borra con el viaje`)
  }
  // Lo que se queda.
  const pase = (await bd.servidor(() => q('select destino, trip_id from public.passes where id = $1', [e.pase])))[0]
  debe(pase && pase.destino === 'Roma' && pase.trip_id === null, 'queda', 'el Pase de Roma sigue (solo pierde la referencia al viaje)')
  const logro = (await bd.servidor(() => q("select trip_id from public.achievements where user_id = $1 and logro = 'primer_sello'", [e.O])))[0]
  debe(logro && logro.trip_id === null, 'queda', 'el logro ganado sigue (trip_id a null)')
  const hecho = (await bd.servidor(() => q("select trip_id, foto_id from public.logro_hechos where user_id = $1", [e.O])))[0]
  debe(hecho && hecho.trip_id === null, 'queda', 'el hecho de los logros (sellos y EXP) sigue (trip_id a null)')
  debe((await cuenta(bd, "select count(*) n from public.hoy_prueba where user_id = $1", [e.O])) === 1, 'queda', 'la prueba de HOY sigue')
  // Las fotos de la invitada: con la 0031 el disparador las apunta y ella las borra al abrir la app.
  debe((await cuenta(bd, "select count(*) n from public.trip_photos where user_id = $1", [e.G])) === 0, '0031', 'con la 0031, las filas de las fotos de la invitada se van con el viaje')
  debe((await cuenta(bd, "select count(*) n from public.fotos_por_borrar where user_id = $1", [e.G])) === 2, '0031', 'y sus 2 archivos quedan apuntados en fotos_por_borrar')
  debe((await cuenta(bd, "select count(*) n from storage.objects where name like $1", [`${e.G}/ruta-1/%`])) === 4, '0031', 'sus archivos siguen en Storage hasta que ella abra la app (solo ella puede borrarlos)')
  const otra = await limpiarFotosPendientes(clienteDe(bd, e.O), e.O)
  debe(otra === 0 && (await cuenta(bd, "select count(*) n from public.fotos_por_borrar where user_id = $1", [e.G])) === 2, '0031', 'otra persona no puede vaciar lo de la invitada (cada una, lo suyo)')
  const quitadas = await limpiarFotosPendientes(clienteDe(bd, e.G), e.G)
  debe(quitadas === 2, '0031', `la invitada, al abrir la app, quita sus 2 fotos pendientes (${quitadas})`)
  debe((await cuenta(bd, "select count(*) n from storage.objects where name like $1", [`${e.G}/ruta-1/%`])) === 0 && (await cuenta(bd, "select count(*) n from public.fotos_por_borrar where user_id = $1", [e.G])) === 0, '0031', 'sus archivos ya no están en Storage y su lista pendiente, vacía')
  debe((await cuenta(bd, "select count(*) n from storage.objects where bucket_id = 'fotos-viaje' and name like '%/ruta-1/%'")) === 0, 'fotos', 'ninguna foto de ese viaje queda en Storage, de nadie')
}

{
  // SIN la 0031: todo funciona igual; solo las fotos de la invitada se quedan (la app no puede tocar su carpeta).
  const e = await escenario(bd, { con0031: false })
  const error = await eliminarViajeEnLaNube(clienteDe(bd, e.O), e.O, { rutaId: 'ruta-1', filaId: e.T1, esInvitado: false })
  debe(error === null && (await cuenta(bd, "select count(*) n from public.trips where id = $1", [e.T1])) === 0 && (await cuenta(bd, "select count(*) n from public.trip_photos where user_id = $1 and trip_id = 'ruta-1'", [e.O])) === 0, 'sin0031', 'sin la 0031 el viaje y las fotos de quien lo eliminó se borran igual')
  debe((await cuenta(bd, "select count(*) n from public.trip_photos where user_id = $1 and trip_id = 'ruta-1'", [e.G])) === 2, 'sin0031', 'y solo las fotos de la invitada se quedan (límite conocido hasta aplicar la 0031)')
}

{
  // Si falla el almacén: no se toca nada (ni las filas de las fotos ni el viaje) y se dice.
  const e = await escenario(bd)
  const error = await eliminarViajeEnLaNube(clienteDe(bd, e.O, { fallaElAlmacen: true }), e.O, { rutaId: 'ruta-1', filaId: e.T1, esInvitado: false })
  debe(typeof error === 'string' && error.length > 10, 'fallo', 'si falla el almacén devuelve un aviso en palabras sencillas')
  debe((await cuenta(bd, "select count(*) n from public.trips where id = $1", [e.T1])) === 1 && (await cuenta(bd, "select count(*) n from public.trip_photos where user_id = $1 and trip_id = 'ruta-1'", [e.O])) === 3, 'fallo', 'y no se ha tocado nada: el viaje y sus fotos siguen (nunca fotos sin viaje)')
  const bien = await eliminarViajeEnLaNube(clienteDe(bd, e.O), e.O, { rutaId: 'ruta-1', filaId: e.T1, esInvitado: false })
  debe(bien === null && (await cuenta(bd, "select count(*) n from public.trips where id = $1", [e.T1])) === 0, 'fallo', 'al reintentar, se borra todo')
}

{
  // La invitada sale del viaje: no lo borra para quien lo creó.
  const e = await escenario(bd)
  const intento = await borrarFilaDelViaje(clienteDe(bd, e.G), e.T1)
  debe((await cuenta(bd, "select count(*) n from public.trips where id = $1", [e.T1])) === 1, 'invitado', `una invitada NO puede borrar el viaje de otra persona (las reglas de seguridad lo impiden; respuesta: ${intento})`)
  const error = await eliminarViajeEnLaNube(clienteDe(bd, e.G), e.G, { rutaId: 'ruta-1', filaId: e.T1, esInvitado: true })
  debe(error === null, 'invitado', `[Salir de este viaje] no da error (${error})`)
  debe((await cuenta(bd, "select count(*) n from public.trips where id = $1", [e.T1])) === 1, 'invitado', 'el viaje sigue para quien lo creó')
  debe((await cuenta(bd, "select count(*) n from public.trip_members where trip_id = $1 and user_id = $2", [e.T1, e.G])) === 0, 'invitado', 'ella ya no está en el viaje')
  debe((await cuenta(bd, "select count(*) n from public.trip_photos where user_id = $1 and trip_id = 'ruta-1'", [e.G])) === 0 && (await cuenta(bd, "select count(*) n from storage.objects where name like $1", [`${e.G}/ruta-1/%`])) === 0, 'invitado', 'sus propias fotos de ese viaje se borran (tabla y Storage)')
  debe((await cuenta(bd, "select count(*) n from public.trip_photos where user_id = $1 and trip_id = 'ruta-1'", [e.O])) === 3 && (await cuenta(bd, "select count(*) n from public.trip_invitations where trip_id = $1", [e.T1])) === 1, 'invitado', 'las fotos y las invitaciones de quien creó el viaje siguen')
  const sola = await salirDelViaje(clienteDe(bd, e.O), e.O, e.T1)
  debe(sola === null, 'invitado', 'salir de un viaje donde no se es invitada no rompe nada')
}

/* ───────────────────────── B. La app ───────────────────────── */
console.log('B. La app en un Chrome')
{
  const src = {
    perfil: leer('src/components/layout/PerfilSheet.tsx'),
    fila: leer('src/components/perfil/FilaDeViaje.tsx'),
    tarjeta: leer('src/components/logros/pantallas/perfil/TarjetaDeViaje.tsx'),
    cuerpo: leer('src/components/logros/pantallas/perfil/CuerpoConLogros.tsx'),
    host: leer('src/components/perfil/EliminarViajeHost.tsx'),
    store: leer('src/lib/eliminarViaje.ts'),
    antigua: leer('src/components/myTrips/MyTripsScreen.tsx') + leer('src/components/myTrips/TripCard.tsx'),
    app: leer('src/App.tsx'),
  }
  debe(!/window\.confirm|\bconfirm\(|\balert\(/.test(Object.values(src).join('\n')), 'hoja', 'no hay ninguna ventana del navegador (confirm/alert): es una hoja de abajo')
  debe(/Hoja,|<Hoja /.test(src.host) && /EliminarViajeHost/.test(src.app), 'hoja', 'la hoja es la de siempre (`Hoja`) y está montada una vez en App.tsx')
  debe(/BotonEditarViajes/.test(src.perfil) && /BotonEditarViajes/.test(src.cuerpo), 'editar', '[Editar] está en el Perfil de siempre y en el Perfil con logros')
  debe(/editando/.test(src.fila) && /editando/.test(src.tarjeta), 'editar', 'las dos filas (la de siempre y la tarjeta con foto) enseñan la papelera en modo editar')
  debe(/useEliminarViaje/.test(src.antigua) && !/deleteTrip|confirming/.test(src.antigua), 'antigua', 'la pantalla antigua «Mis viajes» usa la misma hoja y el mismo camino (sin su confirmación propia)')
  debe(/rgb\(var\(--accent-red\)\)/.test(src.host) && /Eliminar viaje/.test(src.host) && /Salir de este viaje/.test(src.host) && /Cancelar/.test(src.host), 'hoja', '[Eliminar viaje] en el rojo de los avisos importantes, [Salir de este viaje] y [Cancelar]')
}

const { app, ids } = await abrirConViajes()
const T = (n) => `[data-eliminar-viaje="${n}"]`
const texto = (sel) => app.evaluar(`document.querySelector(${JSON.stringify(sel)})?.innerText ?? ''`)
const hay = (sel) => app.evaluar(`Boolean(document.querySelector(${JSON.stringify(sel)}))`)
const clic = (sel) => app.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
const llamadas = () => app.evaluar('JSON.stringify(window.__llamadasNube)').then(JSON.parse)
const estado = () =>
  app.evaluar(`(async () => {
    const r = (await import('/src/store/useRouteStore.ts')).useRouteStore.getState()
    const s = (await import('/src/store/useSyncStore.ts')).useSyncStore.getState()
    return JSON.stringify({ ruta: r.route?.id ?? null, pantalla: r.screen, activa: s.activeTripId, guardados: (s.savedTrips ?? []).map((t) => t.id) })
  })()`).then(JSON.parse)
const cerrarPerfil = () => clic('[aria-label="Cerrar el Perfil"]')
const aMisViajes = () => app.evaluar("(() => { const t = document.querySelector('[data-numero-de-viajes]'); if (!t) return false; t.scrollIntoView({ block: 'start' }); let p = t.parentElement; while (p && getComputedStyle(p).overflowY !== 'auto') p = p.parentElement; if (p) p.scrollTop -= 70; return true })()")
const captura = async (nombre) => {
  if (CAPTURAS) await app.captura(path.join(SALIDA, `10f_${nombre}.jpg`))
}
const ESPERA_PLAZO = 9500

await abrirPerfil(app)
await aMisViajes()
await app.esp(500)
debe((await hay('[data-editar-viajes="editar"]')) && (await texto('[data-editar-viajes]')) === 'Editar', 'editar', 'al lado de «Mis viajes» sale [Editar]')
debe(!(await hay('[data-eliminar-viaje]')), 'editar', 'fuera del modo editar no hay ninguna papelera: la lista sigue como antes')
await captura('1_mis_viajes_con_editar')
await clic('[data-editar-viajes]')
await app.esp(500)
debe((await texto('[data-editar-viajes]')) === 'Hecho', 'editar', '[Editar] pasa a [Hecho]')
const papeleras = await app.evaluar("Array.from(document.querySelectorAll('[data-eliminar-viaje]')).map((e) => e.getAttribute('data-eliminar-viaje') + '|' + e.getAttribute('aria-label')).join('\\n')")
debe(papeleras.split('\n').length === 4 && papeleras.includes(`${ids.hecho}|Eliminar el viaje a Florencia`) && papeleras.includes(`${ids.compartido}|Salir del viaje a Nápoles`), 'editar', `cada viaje enseña su botón a la derecha (la papelera; «Salir» en el de otra persona): ${papeleras.replace(/\n/g, ' · ')}`)
debe(!(await hay('[data-abrir-este-viaje]')), 'editar', 'en modo editar no sale [Abrir este viaje]')
await app.evaluar("document.querySelector('[data-eliminar-viaje]')?.scrollIntoView({ block: 'center' }); true")
await captura('2_modo_editar')

// La hoja de un viaje cerrado con fotos.
await clic(T(ids.hecho))
await app.esp(700)
let hoja = await texto('[data-hoja="eliminar-viaje"]')
debe(/¿Eliminar tu viaje a Florencia\?/.test(hoja) && /13 – 16 mar 2026/.test(hoja), 'hoja', `la hoja pregunta «¿Eliminar tu viaje a Florencia?» con sus fechas (${hoja.split('\n').slice(0, 3).join(' | ')})`)
debe(/Se borra/i.test(hoja) && /la ruta, los días, las reservas que has apuntado y las fotos de este viaje/i.test(hoja), 'hoja', 'dice lo que se borra: la ruta, los días, las reservas y las fotos')
debe(/Se queda/i.test(hoja) && /logros, sellos y EXP/.test(hoja) && /Pase de Florencia/.test(hoja) && /por destino, no por viaje/.test(hoja), 'hoja', 'dice lo que se queda: logros, sellos y EXP y el Pase (se paga por destino, no por viaje)')
debe(/Tienes 155 fotos en este viaje/.test(hoja) && (await hay('[data-boton-hoja="guardar-fotos"]')), 'hoja', 'con fotos: «Tienes 155 fotos en este viaje» y [Guardar en mi galería] antes de eliminar')
debe(!(await hay('[data-aviso-eliminar]')), 'hoja', 'un viaje cerrado y sin invitados no lleva avisos de más')
debe((await hay('[data-confirmar-eliminar]')) && (await hay('[data-boton-hoja="cancelar-eliminar"]')) && (await app.evaluar("getComputedStyle(document.querySelector('[data-confirmar-eliminar]')).backgroundColor")) === 'rgb(204, 39, 46)', 'hoja', '[Eliminar viaje] en el rojo de los avisos importantes y [Cancelar]')
await captura('3_hoja_con_fotos')
// Cancelar no hace nada.
await clic('[data-boton-hoja="cancelar-eliminar"]')
await app.esp(500)
debe(!(await hay('[data-hoja="eliminar-viaje"]')) && (await estado()).guardados.length === 4 && (await llamadas()).length === 0, 'cancelar', '[Cancelar] cierra la hoja y no toca nada')

// Un viaje compartido que creó esta persona: avisa de quién más lo pierde.
await clic(T(ids.proximo))
await app.esp(900)
hoja = await texto('[data-hoja="eliminar-viaje"]')
debe(/También desaparece para Ana y Luis/.test(hoja) && /Eliminar viaje\s*$/m.test(hoja) && !/Salir de este viaje/.test(hoja), 'compartido', 'quien creó un viaje compartido ve «También desaparece para Ana y Luis» y su botón es [Eliminar viaje]')
debe(!/Tienes \d+ fotos/.test(hoja), 'hoja', 'sin fotos, no sale lo de las fotos ni [Guardar en mi galería]')
await captura('4_hoja_viaje_compartido')
await clic('[data-boton-hoja="cancelar-eliminar"]')
await app.esp(400)

// Un viaje de otra persona (estás invitada): [Salir de este viaje].
await clic(T(ids.compartido))
await app.esp(700)
hoja = await texto('[data-hoja="eliminar-viaje"]')
debe(/¿Salir de tu viaje a Nápoles\?/.test(hoja) && (await texto('[data-confirmar-eliminar]')) === 'Salir de este viaje' && !/También desaparece/.test(hoja), 'invitado', 'quien está invitada ve «¿Salir de tu viaje a Nápoles?» y [Salir de este viaje]: no lo borra para los demás')
debe(/Tienes 12 fotos en este viaje/.test(hoja), 'invitado', 'y sus 12 fotos de ese viaje salen en la hoja para guardarlas antes')
await captura('5_hoja_invitada_salir')
await clic('[data-confirmar-eliminar]')
await app.esp(900)
debe((await hay('[data-aviso-viaje-eliminado]')) && /Has salido del viaje/.test(await texto('[data-aviso-viaje-eliminado]')), 'invitado', 'sale «Has salido del viaje» con [Deshacer]')
await app.esp(ESPERA_PLAZO)
let ll = await llamadas()
debe(ll.length === 1 && ll[0].esInvitado === true && ll[0].filaId === 'fila-compartido', 'invitado', `pasado el plazo se pide a la nube salir (no borrar): ${JSON.stringify(ll)}`)
debe(!(await estado()).guardados.includes('fila-compartido') && (await estado()).guardados.length === 3, 'invitado', 'y se va de la lista')

// Eliminar uno cerrado + [Deshacer].
await app.evaluar('window.__llamadasNube.length = 0; true')
await clic(T(ids.hecho))
await app.esp(600)
await clic('[data-confirmar-eliminar]')
await app.esp(800)
let est = await estado()
debe(!(await hay(T(ids.hecho))) && est.guardados.join() === 'fila-abierto,fila-proximo', 'cerrado', 'al confirmar, el viaje se va de la lista al momento')
debe((await texto('[data-aviso-viaje-eliminado]')).includes('Viaje eliminado') && (await hay('[data-deshacer-eliminar]')), 'deshacer', 'sale abajo «Viaje eliminado» con [Deshacer]')
debe(est.ruta === ids.abierto && est.activa === 'fila-abierto', 'cerrado', 'el viaje abierto en la app no cambia')
debe((await llamadas()).length === 0, 'deshacer', 'mientras corre el plazo no se ha tocado la nube')
await captura('6_aviso_viaje_eliminado_con_deshacer')
const pendienteGuardado = async () => JSON.parse((await app.evaluar("localStorage.getItem('jutrip:eliminar-pendiente')")) ?? 'null')
debe((await pendienteGuardado())?.rutaId === ids.hecho && (await pendienteGuardado())?.filaId === 'fila-hecho', 'cierre', 'mientras corre el plazo, lo que hay que borrar queda apuntado en el dispositivo (por si la app se cierra)')
await clic('[data-deshacer-eliminar]')
await app.esp(800)
debe((await pendienteGuardado()) === null, 'cierre', '[Deshacer] borra esa anotación')
est = await estado()
debe(est.guardados.includes('fila-hecho') && (await hay(T(ids.hecho))) && !(await hay('[data-aviso-viaje-eliminado]')), 'deshacer', '[Deshacer] lo devuelve a la lista y quita el aviso')
await app.esp(ESPERA_PLAZO)
debe((await llamadas()).length === 0, 'deshacer', 'y pasado el plazo no se borra nada: ni se llegó a tocar la nube')
// Otra vez, y esta vez se deja pasar el plazo.
await clic(T(ids.hecho))
await app.esp(500)
await clic('[data-confirmar-eliminar]')
await app.esp(ESPERA_PLAZO)
ll = await llamadas()
debe(ll.length === 1 && ll[0].rutaId === ids.hecho && ll[0].filaId === 'fila-hecho' && ll[0].esInvitado === false, 'cerrado', `pasado el plazo se borra de verdad (una sola vez): ${JSON.stringify(ll)}`)
debe(!(await hay('[data-aviso-viaje-eliminado]')), 'cerrado', 'el aviso se va con el plazo')
debe((await pendienteGuardado()) === null, 'cierre', 'y, borrado de verdad, la anotación se quita');
{
  // Si la app se cierra durante el plazo: al volver a abrirla, el viaje se borra (la persona ya dijo que lo quería eliminar), en vez de volver a salir.
  const reabierta = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off', antes: `try { localStorage.setItem('jutrip:eliminar-pendiente', JSON.stringify({ rutaId: 'ruta-x', filaId: 'fila-x', esInvitado: false })) } catch (e) {}` })
  for (let i = 0; i < 120 && !(await reabierta.evaluar("typeof window.__procesarEliminarPendiente === 'function'").catch(() => false)); i++) await reabierta.esp(500)
  await reabierta.evaluar("window.__llamadasNube = []; window.__ponerNubeEliminar({ eliminar: async (v) => { window.__llamadasNube.push(v); return null }, invitados: async () => [] }); true")
  const habia = await reabierta.evaluar('window.__procesarEliminarPendiente()')
  const hechas = JSON.parse(await reabierta.evaluar('JSON.stringify(window.__llamadasNube)'))
  debe(habia === true && hechas.length === 1 && hechas[0].rutaId === 'ruta-x' && hechas[0].filaId === 'fila-x', 'cierre', `al volver a abrir la app, el viaje que quedó pendiente se borra (${JSON.stringify(hechas)})`)
  debe((await reabierta.evaluar("localStorage.getItem('jutrip:eliminar-pendiente')")) === null, 'cierre', 'y la anotación se quita')
  debe((await reabierta.evaluar('window.__procesarEliminarPendiente()')) === false, 'cierre', 'sin nada pendiente, no hace nada')
  reabierta.cerrar()
  const tripSync = leer('src/components/sync/TripSync.tsx')
  debe(tripSync.indexOf('procesarPendienteAlAbrir') > 0 && tripSync.indexOf('procesarPendienteAlAbrir') < tripSync.indexOf('await loadAllTrips'), 'cierre', 'TripSync lo remata ANTES de cargar los viajes guardados (ni sale en la lista ni se abre solo)')
}

// El viaje abierto (y que es ahora): avisa y abre el siguiente.
await app.evaluar('window.__llamadasNube.length = 0; true')
await clic(T(ids.abierto))
await app.esp(800)
hoja = await texto('[data-hoja="eliminar-viaje"]')
debe(/Es el viaje que tienes abierto/.test(hoja) && /Estás de viaje ahora mismo/.test(hoja), 'abierto', 'el viaje abierto y de ahora avisa («Es el viaje que tienes abierto», «Estás de viaje ahora mismo»)')
debe(await hay('[data-confirmar-eliminar]'), 'abierto', 'pero se deja eliminar igual: se avisa, nunca se niega')
await captura('7_hoja_viaje_abierto_y_ahora')
await clic('[data-confirmar-eliminar]')
await app.esp(1500)
est = await estado()
debe(est.ruta === 'ruta-proximo' && est.activa === 'fila-proximo' && est.pantalla === 'route', 'abierto', `si era el viaje abierto, la app abre el siguiente guardado (${est.ruta})`)
debe(!(await hay('[aria-label="Cerrar el Perfil"]')) && (await hay('[data-aviso-viaje-eliminado]')), 'abierto', 'el Perfil se cierra y se ve el aviso con [Deshacer]')
await clic('[data-deshacer-eliminar]')
await app.esp(1500)
est = await estado()
debe(est.ruta === ids.abierto && est.activa === 'fila-abierto' && est.guardados.includes('fila-abierto'), 'deshacer', '[Deshacer] en el abierto: vuelve el viaje entero, abierto y en su fila')
await app.esp(ESPERA_PLAZO)
debe((await llamadas()).length === 0, 'deshacer', 'sin tocar la nube')

// Si la nube falla, el viaje vuelve a su sitio y se dice.
await app.evaluar("window.__ponerNubeEliminar({ eliminar: async () => 'No se han podido borrar las fotos del viaje.', invitados: async () => [] }); true")
await abrirPerfil(app)
await clic('[data-editar-viajes]')
await app.esp(400)
await clic(T('ruta-proximo'))
await app.esp(500)
await clic('[data-confirmar-eliminar]')
await app.esp(ESPERA_PLAZO)
est = await estado()
debe(est.guardados.includes('fila-proximo') && /No se han podido borrar las fotos del viaje\. El viaje sigue en tu lista\./.test(await texto('[data-aviso-viaje-eliminado]')), 'fallo', 'si la nube falla, el viaje vuelve a la lista y sale el aviso (sin [Deshacer])')
await app.esp(6500)
await app.evaluar("window.__ponerNubeEliminar({ eliminar: async (v) => { window.__llamadasNube.push(v); return null }, invitados: async () => [] }); true")

// El único viaje: la primera pantalla.
await app.evaluar(`(async () => {
  const s = (await import('/src/store/useSyncStore.ts')).useSyncStore.getState()
  s.setSavedTrips(s.savedTrips.filter((t) => t.id === 'fila-abierto'))
  return true
})()`)
await app.esp(800)
if (!(await hay('[data-numero-de-viajes]'))) await abrirPerfil(app)
await app.esp(600)
if ((await texto('[data-editar-viajes]')) !== 'Hecho') await clic('[data-editar-viajes]')
await app.esp(400)
await clic(T(ids.abierto))
await app.esp(600)
await clic('[data-confirmar-eliminar]')
await app.esp(2500)
est = await estado()
debe(est.ruta === null && est.activa === null && est.guardados.length === 0, 'unico', 'el único viaje: ya no queda ninguno abierto ni guardado')
debe((await hay('[data-primera-pantalla]')) && !(await hay('[aria-label="Cerrar el Perfil"]')), 'unico', 'y se ve la primera pantalla (crear viaje), con el Perfil cerrado')
debe(await hay('[data-deshacer-eliminar]'), 'unico', 'con su [Deshacer]')
await clic('[data-deshacer-eliminar]')
await app.esp(2000)
est = await estado()
debe(est.ruta === ids.abierto && est.activa === 'fila-abierto' && est.pantalla === 'route', 'unico', '[Deshacer] devuelve el único viaje, abierto como estaba')
app.cerrar()

/* ───────────────────────── Resultado ───────────────────────── */
console.log(`\nLa prueba de la Tanda 10F: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
