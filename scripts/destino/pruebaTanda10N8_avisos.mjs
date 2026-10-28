// Tanda 10N8 (N2) · apartados 0a, 0b, 2 y 4: los avisos que no llegaban. Sin navegador: la base de datos de verdad (PGlite con las migraciones reales, la 0058 y la 0059 encima) y las frases.
//   node scripts/destino/pruebaTanda10N8_avisos.mjs
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
const MIGRACIONES = /^(0001|0002|0003|0012|0018|0020|0021|0023|0024|0025|0026|0027|0028|0030|0031|0034|0035|0036|0037|0038|0040|0041|0042|0043|0046|0048|0049|0051|0053|0054|0055|0058|0059)_/
const bd = await crearBaseDePrueba({ migraciones: MIGRACIONES, alFallar: (m) => debe(false, 'migracion', m) })
const { q, como, servidor, nuevoUsuario } = bd
debe(bd.aplicadas.includes('0058_avisos_viaje_nuevos_y_salir.sql') && bd.aplicadas.includes('0059_avisos_juntar_2_minutos.sql'), 'migracion', 'la 0058 y la 0059 se aplican')
const textos = await import('../../shared/avisos/textos.js')
const { resumirCambio, ultimoCambioDe } = await import('../../shared/avisos/cambioViaje.js')
textos.ponerTablaDeArticulos({ Panteón: 'el', 'Piazza Navona': 'la' })

// sellarRuta (TypeScript) empaquetado a un archivo temporal.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'n8avisos-'))
buildSync({ entryPoints: ['src/lib/sellarCambio.ts'], bundle: true, format: 'esm', platform: 'node', outfile: path.join(tmp, 'sellar.mjs'), logLevel: 'silent' })
const { sellarRuta, recordarBase, olvidarBases } = await import('file://' + path.join(tmp, 'sellar.mjs').replace(/\\/g, '/'))

const dia = (n, paradas, comidas = []) => ({ id: 'd' + n, dayNumber: n, city: 'Roma', stops: paradas.map(([id, name]) => ({ id, name })), meals: comidas })
const ruta = (dias, fin = '2026-11-15', extra = {}) => ({ id: 'r1', destination: 'Roma', answers: { dateRange: { start: '2026-11-11', end: fin } }, days: dias, ...extra })
const base = () => [dia(1, [['a1', 'Coliseo'], ['a2', 'Foro Romano']]), dia(2, [['a3', 'Panteón'], ['a4', 'Piazza Navona']]), dia(3, [['a5', 'Trastevere']]), dia(4, [['a6', 'Villa Borghese']]), dia(5, [['a7', 'Vaticano']])]
const frase = (antes, despues) => textos.textoDelAviso({ tipo: 'viaje_cambiado', payload: { quien: 'Eric', cambio: ultimoCambioDe(antes, despues, null) } })

console.log('1. Las frases de cada cambio')
{
  const antes = ruta(base())
  // Quitar el sábado 14 (día 4): el viaje pasa a acabar el 14.
  const sinSabado = ruta(base().filter((d) => d.id !== 'd4').map((d, i) => ({ ...d, dayNumber: i + 1 })), '2026-11-14')
  debe(frase(antes, sinSabado) === 'Eric ha quitado el sábado 14.', 'quitar día', frase(antes, sinSabado))
  const orden = base()
  const reordenado = ruta([orden[1], orden[0], orden[2], orden[3], orden[4]].map((d, i) => ({ ...d, dayNumber: i + 1 })))
  debe(frase(antes, reordenado) === 'Eric ha cambiado el orden de los días.', 'orden', frase(antes, reordenado))
  const conRest = base()
  conRest[1] = dia(2, [['a3', 'Panteón'], ['a4', 'Piazza Navona']], [{ id: 'm1', mealTime: 'dinner', chosenRestaurant: { name: 'Da Enzo', coordinates: { lat: 1, lng: 1 } } }])
  debe(frase(antes, ruta(conRest)) === 'Eric ha añadido Da Enzo al jueves 12.', 'restaurante', frase(antes, ruta(conRest)))
  const tres = base()
  tres[1] = dia(2, [['a3', 'Panteón'], ['a4', 'Piazza Navona'], ['n1', 'Castel Sant\'Angelo'], ['n2', 'Ara Pacis'], ['n3', 'Pincio']])
  debe(frase(antes, ruta(tres)) === 'Eric ha añadido Castel Sant\'Angelo y 2 sitios más al jueves 12.', 'sitios', frase(antes, ruta(tres)))
  const panteon = [dia(1, [['a1', 'Coliseo'], ['a2', 'Foro Romano']]), dia(2, [['a4', 'Piazza Navona']]), ...base().slice(2)]
  const conPanteon = ruta([dia(1, [['a1', 'Coliseo'], ['a2', 'Foro Romano']]), dia(2, [['a4', 'Piazza Navona'], ['p1', 'Panteón'], ['p2', 'Ara Pacis'], ['p3', 'Pincio']]), ...base().slice(2)])
  debe(frase(ruta(panteon), conPanteon) === 'Eric ha añadido el Panteón y 2 sitios más al jueves 12.', 'panteón', frase(ruta(panteon), conPanteon))
  const franja = textos.franjaDelAviso({ tipo: 'viaje_cambiado', payload: { quien: 'Eric', destino: 'Roma', cambio: ultimoCambioDe(antes, sinSabado, null) } })
  debe(/ha quitado el sábado 14/.test(franja.titulo), 'franja', JSON.stringify(franja))
}

console.log('2. sellarRuta: cada guardado lleva lo que ha pasado')
{
  olvidarBases()
  const nube = ruta(base())
  recordarBase('t1', nube, 0)
  const igual = sellarRuta('t1', { ...nube, contextBannerDismissed: true }, null, 5)
  debe(!igual.ultimoCambio, 'sellar', 'un cambio sin nada que contar no lleva ultimoCambio')
  const b1 = base(); b1[0] = dia(1, [['a1', 'Coliseo']])
  const s1 = sellarRuta('t1', ruta(b1), null, 100)
  debe(Boolean(s1.ultimoCambio?.id), 'sellar', 'un cambio de verdad lleva un id nuevo')
  recordarBase('t1', s1, 100)
  const b2 = base(); b2[0] = dia(1, [['a1', 'Coliseo'], ['x', 'Ara Pacis']])
  const s2 = sellarRuta('t1', ruta(b2), null, 200)
  debe(s2.ultimoCambio?.id && s2.ultimoCambio.id !== s1.ultimoCambio.id, 'sellar', 'el siguiente cambio lleva otro id (aviso nuevo)')
  // Un cambio con nombre propio nuevo manda sobre el sello.
  const nombrado = { ...ruta(b2), ultimoCambio: { id: 'cNOMBRE', accion: { tipo: 'recuperar_ruta' } } }
  debe(sellarRuta('t1', nombrado, null, 300).ultimoCambio.id === 'cNOMBRE', 'sellar', 'una acción con nombre propio nueva conserva su id')
}

console.log('3. La base de datos: franja y sonido de cada cambio, aviso propio, salir')
const eric = await nuevoUsuario('eric@correo.es', false, 'Eric')
const ana = await nuevoUsuario('ana@correo.es', false, 'Ana')
const viaje = await como(eric, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [eric, JSON.stringify(ruta(base()))]))[0].id)
await servidor(() => q("insert into public.trip_members (trip_id, user_id, invited_by, permiso) values ($1, $2, $3, 'editar')", [viaje, ana, eric]))
const avisosDe = (uid, tipo = 'viaje_cambiado') => servidor(() => q('select id, payload, leido_en, oculto_en from public.avisos where user_id = $1 and tipo = $2 order by creado_en', [uid, tipo]))
const guarda = (uid, r) => como(uid, () => q('update public.trips set route = $2::jsonb where id = $1', [viaje, JSON.stringify(r)]))
let actual = ruta(base())
const paso = async (uid, despues) => {
  olvidarBases()
  recordarBase(viaje, actual, 0)
  const sellada = sellarRuta(viaje, despues, null, 1_000_000)
  await guarda(uid, sellada)
  actual = sellada
}
{
  const sinSabado = ruta(base().filter((d) => d.id !== 'd4').map((d, i) => ({ ...d, dayNumber: i + 1 })), '2026-11-14')
  await paso(eric, sinSabado)
  const a1 = await avisosDe(ana)
  debe(a1.length === 1 && textos.textoDelAviso({ tipo: 'viaje_cambiado', payload: a1[0].payload }) === 'Eric ha quitado el sábado 14.', 'quitar día', `Ana recibe «quitar el sábado 14» (${a1.length})`)
  const antesId = a1[0]?.id
  const orden = sinSabado.days
  await paso(eric, ruta([orden[1], orden[0], orden[2], orden[3]].map((d, i) => ({ ...d, dayNumber: i + 1 })), '2026-11-14'))
  const a2 = await avisosDe(ana)
  if (a2.length !== 1) console.log(JSON.stringify(a2.map((x) => ({ id: x.id.slice(0, 4), c: x.payload.cambio?.id, ac: x.payload.cambio?.accion }))))
  debe(a2.length === 1 && a2[0].id !== antesId, 'nuevo', `el segundo cambio seguido sustituye al primero y es un aviso NUEVO (otro id): ${a2.length} aviso(s)`)
  debe(textos.textoDelAviso({ tipo: 'viaje_cambiado', payload: a2[0].payload }) === 'Eric ha cambiado el orden de los días.', 'orden', 'con la frase de lo último')
  debe((await avisosDe(eric)).length === 0, 'propio', 'Eric no recibe avisos de lo que ha hecho él')
  // Ana (puede editar) añade un restaurante: Eric lo recibe, Ana no.
  const dias = actual.days.map((d) => ({ ...d }))
  dias[0] = { ...dias[0], meals: [{ id: 'm9', mealTime: 'lunch', chosenRestaurant: { name: 'Da Enzo', coordinates: { lat: 1, lng: 1 } } }] }
  await paso(ana, { ...actual, days: dias })
  const e1 = await avisosDe(eric)
  debe(e1.length === 1 && /Ana ha añadido Da Enzo/.test(textos.textoDelAviso({ tipo: 'viaje_cambiado', payload: e1[0].payload })), 'restaurante', `Eric recibe el restaurante que añade Ana (${e1.length})`)
  debe((await avisosDe(ana)).length === 1, 'propio', 'Ana no recibe el suyo (solo queda el de Eric)')
  // Un guardado sin cambio de contenido no hace ningún aviso.
  const antes = (await avisosDe(ana)).length
  await paso(eric, { ...actual, contextBannerDismissed: true })
  debe((await avisosDe(ana)).length === antes, 'sin cambio', 'guardar sin cambiar nada no avisa')
}
{
  // cuentas_modo: dos cambios seguidos → un aviso nuevo
  await servidor(() => q("delete from public.avisos where tipo = 'cuentas_modo'"))
  await como(eric, () => q("update public.trips set route = jsonb_set(route, '{modoCuentas}', '\"conjunta\"') where id = $1", [viaje]))
  const m1 = await avisosDe(ana, 'cuentas_modo')
  await como(eric, () => q("update public.trips set route = jsonb_set(route, '{modoCuentas}', '\"cada_uno\"') where id = $1", [viaje]))
  const m2 = await avisosDe(ana, 'cuentas_modo')
  debe(m1.length === 1 && m2.length === 1 && m1[0].id !== m2[0].id, 'cuentas', 'la 0059: «ha cambiado las cuentas» dos veces seguidas = un solo aviso, y nuevo')
  const ventana = fs.readFileSync('supabase/migrations/0059_avisos_juntar_2_minutos.sql', 'utf8') + fs.readFileSync('supabase/migrations/0058_avisos_viaje_nuevos_y_salir.sql', 'utf8')
  debe(!/15 minutes/.test(ventana.replace(/--.*$/gm, '')) && (ventana.match(/interval '2 minutes'/g) ?? []).length >= 4, 'ventana', 'las dos migraciones juntan 2 minutos, no 15')
}
{
  // Salir del viaje: sus avisos desaparecen, menos «Ya no formas parte…»
  const antes = await avisosDe(ana)
  debe(antes.length > 0, 'salir', 'Ana tenía avisos del viaje')
  await como(ana, () => q('select public.salir_del_viaje($1)', [viaje]))
  const queda = await servidor(() => q('select tipo from public.avisos where user_id = $1 and oculto_en is null', [ana]))
  debe(queda.every((f) => f.tipo === 'quitado') , 'salir', `al salir no queda ningún aviso del viaje en su campana (${queda.map((f) => f.tipo).join(',') || 'ninguno'})`)
}
fs.rmSync(tmp, { recursive: true, force: true })
console.log(`${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  MAL [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
