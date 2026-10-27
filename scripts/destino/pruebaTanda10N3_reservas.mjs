// Tanda 10N3 (parte D1, §3): los avisos de las entradas los crea la BASE DE DATOS (migración 0042) y lo que compra el invitado viaja entre sus móviles (0038). No toca el motor de rutas.
//   node scripts/destino/pruebaTanda10N3_reservas.mjs
// 1. PGlite con las migraciones reales (hasta la 0042): el dueño guarda una entrada para 2 de 4 y cada miembro recibe SU aviso (incluido / no incluido); no se duplica; el invitado guarda la suya y, si no cuadra, recibe el aviso.
// 2. El código del navegador (esbuild + Node): el almacén de las entradas del invitado con la nube de mentira sobre PGlite («otro móvil» la recupera; lo quitado no vuelve).
// 3. Código: el móvil no calcula lo que ya creó el servidor, y los botones del aviso.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { build } from 'esbuild'
import { crearBaseDePrueba } from './_baseDeDatosPrueba.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

/* ═══════════════ 1. La base de datos ═══════════════ */
console.log('1. La base de datos (PGlite, migraciones reales hasta la 0042)')
const MIGRACIONES = /^(0001|0002|0003|0012|0018|0020|0021|0023|0024|0025|0026|0027|0028|0030|0031|0034|0035|0036|0038|0042)_/
const bd = await crearBaseDePrueba({ migraciones: MIGRACIONES, alFallar: (m) => debe(false, 'migracion', m) })
const { q, como, servidor, nuevoUsuario } = bd
debe(bd.aplicadas.includes('0042_avisos_entradas_servidor.sql') && bd.aplicadas.includes('0038_reservas_para_quien.sql'), 'migracion', 'la 0042 se aplica sobre la 0038 y las anteriores sin un error')
const sql42 = sinComentarios(leer('supabase/migrations/0042_avisos_entradas_servidor.sql'))
debe(!/avisos_tipo_check/.test(sql42), 'migracion', 'la 0042 no toca la lista de tipos de aviso: usa `reserva_grupo` de la 0035')

const dia = (n, paradas) => ({ id: 'd' + n, dayNumber: n, city: 'Roma', stops: paradas.map(([id, name, extra]) => ({ id, name, ...(extra ?? {}) })) })
const ruta = JSON.stringify({
  id: 'r1', destination: 'Roma', answers: { dateRange: { start: '2026-11-26', end: '2026-11-29' } },
  days: [dia(1, [['s1', 'Coliseo'], ['s2', 'Foro Romano y Palatino']]), dia(2, [['s3', 'Vaticano']]), dia(3, [['s4', 'Trastevere']]), dia(4, [['s5', 'Panteón', { visitMode: 'fuera' }]])],
})
const eric = await nuevoUsuario('eric@correo.es', false, 'Eric Gil')
const ana = await nuevoUsuario('ana@correo.es', false, 'Ana')
const luis = await nuevoUsuario('luis@correo.es', false, 'Luis')
const marta = await nuevoUsuario('marta@correo.es', false, 'Marta')
const ajeno = await nuevoUsuario('ajeno@correo.es', false, 'Ajeno')
const viaje = await como(eric, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [eric, ruta]))[0].id)
for (const u of [ana, luis, marta]) await servidor(() => q('insert into public.trip_members (trip_id, user_id, invited_by) values ($1, $2, $3)', [viaje, u, eric]))
const avisosDe = (uid) => servidor(() => q("select tipo, clave, payload, leido_en from public.avisos where user_id = $1 and tipo = 'reserva_grupo' order by creado_en", [uid]))
const textos = await import('../../shared/avisos/textos.js')
const textoDe = (a) => textos.textoDelAviso({ tipo: a.tipo, payload: a.payload })

const reserva = (extra = {}) => ({ id: 'res-1', kind: 'entrada', refId: 'Coliseo, Foro y Palatino', name: 'Coliseo, Foro y Palatino', shortName: 'el Coliseo', placeNames: ['Coliseo', 'Foro Romano y Palatino'], dateIso: '2026-11-26', dayNumber: null, time: '08:00', paraQuien: [eric, ana], ...extra })
const guardar = (reservas) => como(eric, () => q('update public.trips set bookings = $2::jsonb where id = $1', [viaje, JSON.stringify({ reservations: reservas })]))

// El dueño guarda una entrada del Coliseo para 2 de 4 (Eric y Ana).
await guardar([reserva()])
const aAna = await avisosDe(ana)
const aLuis = await avisosDe(luis)
const aMarta = await avisosDe(marta)
const aEric = await avisosDe(eric)
debe(aEric.length === 0, 'dueno', 'el dueño no recibe aviso de su propia entrada')
debe(aAna.length === 1 && aAna[0].payload.caso === 'incluido' && aAna[0].payload.incluido === true, 'incluido', 'Ana (marcada) recibe su aviso «incluido»')
debe(textoDe(aAna[0]) === 'Eric ha reservado el Coliseo para ti · jueves 26 · 8:00', 'incluido', `el texto de Ana: «${textoDe(aAna[0])}»`)
debe(aLuis.length === 1 && aLuis[0].payload.caso === 'no_incluido' && aMarta.length === 1 && aMarta[0].payload.caso === 'no_incluido', 'no_incluido', 'Luis y Marta (sin marcar) reciben su aviso «no incluido»')
debe(textoDe(aLuis[0]) === 'Eric ha reservado el Coliseo · jueves 26 · 8:00. ¿Reservas la tuya a la misma hora?', 'no_incluido', `el texto de Luis: «${textoDe(aLuis[0])}»`)
debe(aLuis[0].payload.reserva_id === 'res-1' && aLuis[0].payload.trip_id === viaje && aLuis[0].payload.date_iso === '2026-11-26', 'no_incluido', 'el aviso lleva la reserva, el viaje y la fecha (para [Reservar la mía a la misma hora])')
debe(aLuis[0].leido_en === null, 'campana', 'llega sin leer (cuenta en la campana)')
const sinAvisos = await avisosDe(ajeno)
debe(sinAvisos.length === 0, 'seguridad', 'alguien que no es del viaje no recibe nada')
// La app abierta: el mismo guardado otra vez (o cambiar otra cosa del viaje) no duplica.
await guardar([reserva(), { ...reserva({ id: 'res-2', refId: 'Panteón', name: 'Panteón', shortName: 'el Panteón', placeNames: ['Panteón'], paraQuien: undefined }) }])
debe((await avisosDe(luis)).length === 1 && (await avisosDe(ana)).length === 1, 'no_duplica', 'guardar otra vez lo mismo (o una reserva «solo para mí») no repite el aviso')
// Si el dueño cambia la hora, avisa de nuevo (es otra cosa).
await guardar([reserva({ time: '09:30' })])
const luis2 = await avisosDe(luis)
debe(luis2.length === 2 && textoDe(luis2[1]) === 'Eric ha reservado el Coliseo · jueves 26 · 9:30. ¿Reservas la tuya a la misma hora?', 'cambio', 'si el dueño cambia la hora, llega el aviso nuevo con la hora nueva')
// Sin fechas en el viaje: «día 2».
const viajeSin = await como(eric, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [eric, JSON.stringify({ id: 'r2', destination: 'Roma', answers: {}, days: [dia(1, [['s1', 'Coliseo']])] })]))[0].id)
await servidor(() => q('insert into public.trip_members (trip_id, user_id, invited_by) values ($1, $2, $3)', [viajeSin, luis, eric]))
await como(eric, () => q('update public.trips set bookings = $2::jsonb where id = $1', [viajeSin, JSON.stringify({ reservations: [reserva({ id: 'res-9', dateIso: null, dayNumber: 2, paraQuien: [eric] })] })]))
const sinFechas = (await avisosDe(luis)).find((a) => a.payload.trip_id === viajeSin)
debe(sinFechas && textoDe(sinFechas) === 'Eric ha reservado el Coliseo · día 2 · 8:00. ¿Reservas la tuya a la misma hora?', 'sin_fechas', `sin fechas en el viaje: «${sinFechas && textoDe(sinFechas)}»`)

// «Tu entrada no cuadra»: Luis guarda la suya el viernes 27 y la ruta tiene el Coliseo el jueves 26.
await como(luis, () => q("insert into public.reservas_invitado (trip_id, user_id, reservas) values ($1, $2, $3::jsonb)", [viaje, luis, JSON.stringify([reserva({ id: 'res-luis', dateIso: '2026-11-27', paraQuien: undefined })])]))
const nc = (await avisosDe(luis)).filter((a) => a.payload.caso === 'no_cuadra')
debe(nc.length === 1 && textoDe(nc[0]) === 'Tu entrada del Coliseo es el viernes 27, y en la ruta está el jueves 26.', 'no_cuadra', `el aviso de que no cuadra: «${nc[0] && textoDe(nc[0])}»`)
debe(nc[0].payload.dia_reserva === 'viernes 27' && nc[0].payload.dia_ruta === 'jueves 26' && nc[0].payload.reserva_id === 'res-luis' && nc[0].payload.sitio === 'el Coliseo', 'no_cuadra', 'lleva los datos para [Proponer el cambio]: sitio, día de la reserva, día de la ruta y la reserva')
// Una que SÍ cuadra, o un sitio visto por fuera, no avisa.
await como(luis, () => q('update public.reservas_invitado set reservas = $3::jsonb where trip_id = $1 and user_id = $2', [viaje, luis, JSON.stringify([reserva({ id: 'res-luis', dateIso: '2026-11-27', paraQuien: undefined }), reserva({ id: 'res-ok', dateIso: '2026-11-26', paraQuien: undefined }), reserva({ id: 'res-fuera', refId: 'Panteón', name: 'Panteón', placeNames: ['Panteón'], dateIso: '2026-11-27', paraQuien: undefined })])]))
debe((await avisosDe(luis)).filter((a) => a.payload.caso === 'no_cuadra').length === 1, 'no_cuadra', 'la que cuadra y la de un sitio visto por fuera no avisan; la que ya avisó no se repite')
// Seguridad: la entrada de Luis no la lee nadie más.
const deLuisParaAna = await como(ana, () => q('select 1 from public.reservas_invitado where trip_id = $1', [viaje]))
const deLuisParaEric = await como(eric, () => q('select 1 from public.reservas_invitado where trip_id = $1', [viaje]))
debe(deLuisParaAna.length === 0 && deLuisParaEric.length === 0, 'suya', 'lo que compra el invitado es suyo: ni el dueño ni otro invitado lo leen (RLS)')
// Los avisos salen por la función del servidor, como los demás.
const lista = await servidor(async () => (await q('select public.avisos_de($1) as r', [luis]))[0].r)
debe(lista.some((a) => a.tipo === 'reserva_grupo' && a.payload.caso === 'no_incluido') && lista.some((a) => a.payload.caso === 'no_cuadra'), 'campana', '`avisos_de` los devuelve en la lista de la campana (la que lee la app, también con la app cerrada)')
const push = await servidor(async () => (await q('select count(*)::int as n from public.avisos where tipo = $1 and push_en is null', ['reserva_grupo']))[0].n)
debe(push > 0, 'push', 'quedan pendientes de mandar al móvil (entran en la cola del aviso del móvil como los demás)')

/* ═══════════════ 2. El almacén del invitado, con la nube de mentira ═══════════════ */
console.log('2. Lo que compra el invitado viaja entre sus móviles')
const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-10n3-'))
const salida = path.join(carpeta, 'almacen.cjs')
await build({
  entryPoints: ['src/store/useMisReservas.ts'],
  outfile: salida, bundle: true, platform: 'node', format: 'cjs', logLevel: 'error',
  define: { 'import.meta.env': JSON.stringify({ DEV: false }) },
  plugins: [
    {
      name: 'nube-de-mentira',
      setup(b) {
        b.onResolve({ filter: /supabaseClient$/ }, () => ({ path: 'supabaseClient', namespace: 'mentira' }))
        b.onResolve({ filter: /useSyncStore$/ }, () => ({ path: 'useSyncStore', namespace: 'mentira' }))
        b.onLoad({ filter: /^supabaseClient$/, namespace: 'mentira' }, () => ({ contents: 'module.exports = { supabase: globalThis.__nube }', loader: 'js' }))
        b.onLoad({ filter: /^useSyncStore$/, namespace: 'mentira' }, () => ({ contents: "module.exports = { useSyncStore: { getState: () => ({ activeTripId: globalThis.__viajeActivo }) } }", loader: 'js' }))
      },
    },
  ],
})
let quienSoy = luis
globalThis.__nube = {
  auth: { getUser: async () => ({ data: { user: { id: quienSoy } } }) },
  from: () => ({
    upsert: async (fila) => {
      try {
        await como(quienSoy, () => q('insert into public.reservas_invitado (trip_id, user_id, reservas) values ($1, $2, $3::jsonb) on conflict (trip_id, user_id) do update set reservas = excluded.reservas', [fila.trip_id, fila.user_id, JSON.stringify(fila.reservas)]))
        return { error: null }
      } catch (e) {
        return { error: { message: e.message } }
      }
    },
    select: () => {
      const f = {}
      const cadena = { eq: (c, v) => ((f[c] = v), cadena), maybeSingle: async () => ({ data: (await como(quienSoy, () => q('select reservas from public.reservas_invitado where trip_id = $1 and user_id = $2', [f.trip_id, f.user_id])))[0] ?? null, error: null }) }
      return cadena
    },
  }),
}
const movil = (n) => {
  const datos = new Map()
  return { id: n, localStorage: { getItem: (k) => datos.get(k) ?? null, setItem: (k, v) => datos.set(k, v), removeItem: (k) => datos.delete(k) } }
}
const movilA = movil('A')
const movilB = movil('B')
globalThis.window = movilA
globalThis.__viajeActivo = viaje
const { useMisReservas } = createRequire(import.meta.url)(salida)
await useMisReservas.getState().cargar(viaje)
// (la compra de Luis en el móvil A; las reservas de antes de la prueba se vacían para verlo limpio)
await como(luis, () => q('delete from public.reservas_invitado where trip_id = $1 and user_id = $2', [viaje, luis]))
movilA.localStorage.removeItem(`trazo:mis-reservas:v1:${viaje}`)
useMisReservas.setState({ lista: [], tripId: viaje })
useMisReservas.getState().anadir(reserva({ id: 'res-compra', dateIso: '2026-11-26', time: '08:00', paraQuien: undefined }))
await new Promise((r) => setTimeout(r, 400))
const enNube = await como(luis, () => q('select reservas from public.reservas_invitado where trip_id = $1 and user_id = $2', [viaje, luis]))
debe(enNube.length === 1 && enNube[0].reservas.length === 1 && enNube[0].reservas[0].id === 'res-compra', 'nube', 'la compra del invitado queda guardada en su cuenta (reservas_invitado)')
// Otro móvil (sin nada guardado): al abrir el viaje la recupera.
globalThis.window = movilB
useMisReservas.setState({ lista: [], tripId: null })
await useMisReservas.getState().cargar(viaje)
debe(useMisReservas.getState().lista.length === 1 && useMisReservas.getState().lista[0].id === 'res-compra', 'otro_movil', 'en otro móvil, al abrir el viaje con su cuenta, la compra aparece')
// Quitarla en B: A no la vuelve a subir al abrir.
useMisReservas.getState().quitar('res-compra')
await new Promise((r) => setTimeout(r, 400))
globalThis.window = movilA
useMisReservas.setState({ lista: [], tripId: null })
await useMisReservas.getState().cargar(viaje)
debe(useMisReservas.getState().lista.length === 0, 'quitar', 'lo que se quita en un móvil no vuelve desde el otro (la nube manda)')
// Un móvil con compras sin subir (sin nube) las sube al abrir con cuenta.
globalThis.window = movil('C')
useMisReservas.setState({ lista: [], tripId: viaje })
globalThis.window.localStorage.setItem(`trazo:mis-reservas:v1:${viaje}`, JSON.stringify([reserva({ id: 'res-sin-subir', paraQuien: undefined })]))
globalThis.window.localStorage.setItem(`trazo:mis-reservas:v1:pendiente:${viaje}`, '1')
await useMisReservas.getState().cargar(viaje)
await new Promise((r) => setTimeout(r, 400))
const subida = await como(luis, () => q('select jsonb_array_length(reservas) as n from public.reservas_invitado where trip_id = $1 and user_id = $2', [viaje, luis]))
debe(subida[0]?.n === 1, 'sube', 'las compras hechas sin conexión se suben a la cuenta al abrir con ella')
// Otra persona (Ana) con el mismo viaje: lo suyo es suyo.
quienSoy = ana
globalThis.window = movil('D')
useMisReservas.setState({ lista: [], tripId: null })
await useMisReservas.getState().cargar(viaje)
debe(useMisReservas.getState().lista.length === 0, 'suya', 'Ana, en su móvil, no ve lo que compró Luis')

/* ═══════════════ 3. El código ═══════════════ */
console.log('3. El código')
{
  const notices = sinComentarios(leer('src/hooks/useAppNotices.ts'))
  debe(/avisosDelServidor\.some\(\(a\) => a\.tipo === 'reserva_grupo'/.test(notices) && /reserva_id === reserva\.id/.test(notices), 'dedupe', 'el móvil no calcula el aviso de una entrada si el servidor ya lo creó (mismo reserva_id)')
  debe(/etiquetaDelCambio/.test(notices) && /proponerCambioDeReserva/.test(notices), 'gancho', 'el aviso calculado en el móvil también lleva [Proponer el cambio]')
  const lista = sinComentarios(leer('src/components/avisos/ListaDeAvisos.tsx'))
  const aviso = sinComentarios(leer('src/components/avisos/AvisoDeEntrada.tsx'))
  debe(/a\.tipo === 'reserva_grupo'[\s\S]{0,200}<AvisoDeEntrada/.test(lista), 'campana', 'la lista de la cuenta pinta los avisos de entradas con sus botones')
  debe(/Reservar la mía a la misma hora/.test(aviso) && /Ya la tengo/.test(aviso) && /etiquetaDelCambio/.test(aviso) && /proponerCambioDeReserva\(\{ reservaId/.test(aviso), 'botones', 'los tres botones del aviso, con el gancho de la propuesta con los datos (reserva, sitio, día de la reserva, día de la ruta)')
  const grupo = leer('src/lib/reservasGrupo.ts')
  debe(/trazo:proponer-cambio-reserva/.test(grupo), 'gancho', 'el gancho es el evento `trazo:proponer-cambio-reserva` (lo escucha la propuesta)')
  const hoja = sinComentarios(leer('src/components/route/reservas/AddReservationSheet.tsx'))
  debe(/shortName: nombresCortos/.test(hoja), 'nombre_corto', 'la reserva guarda su nombre corto con artículo («el Coliseo»): el aviso del servidor lo dice bien')
  const textos2 = textos.textoDelAviso({ tipo: 'reserva_grupo', payload: { caso: 'no_cuadra', sitio: 'el Coliseo', dia_reserva: 'viernes 27', dia_ruta: 'jueves 26' } })
  debe(textos2 === 'Tu entrada del Coliseo es el viernes 27, y en la ruta está el jueves 26.', 'texto', 'el mismo texto en el servidor y en el móvil (shared/avisos/textos.js)')
}

for (const f of fallos) console.log(`✗ [${f.regla}] ${f.texto}`)
console.log(`\nPrueba de la Tanda 10N3 (D1, avisos de entradas y compra del invitado): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
