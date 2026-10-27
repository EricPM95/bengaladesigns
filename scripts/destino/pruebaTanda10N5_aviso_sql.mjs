// Tanda 10N5 (H1), apartados 2 y 2b: el disparador de la migración 0051 (PGlite con las migraciones reales, la 0051 encima de la 0036): el aviso de «ha cambiado el viaje» dice lo que pasó.
//   node scripts/destino/pruebaTanda10N5_aviso_sql.mjs
import { crearBaseDePrueba } from './_baseDeDatosPrueba.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const MIGRACIONES = /^(0001|0002|0003|0012|0018|0020|0021|0023|0024|0025|0026|0027|0028|0030|0031|0034|0035|0036|0051)_/
const bd = await crearBaseDePrueba({ migraciones: MIGRACIONES, alFallar: (m) => debe(false, 'migracion', m) })
const { q, como, servidor, nuevoUsuario } = bd
debe(bd.aplicadas.includes('0051_aviso_cambio_viaje_claro.sql'), 'migracion', 'la 0051 se aplica sobre la 0036')
const textos = await import('../../shared/avisos/textos.js')
await import('../../server/avisos.js')

const dia = (n, paradas) => ({ id: 'd' + n, dayNumber: n, city: 'Roma', stops: paradas.map(([id, name]) => ({ id, name })) })
const rutaDe = (dias, inicio = '2026-11-11', fin = '2026-11-15', extra = {}) => JSON.stringify({ id: 'r1', destination: 'Roma', answers: { dateRange: { start: inicio, end: fin } }, days: dias, ...extra })
const base = [dia(1, [['a1', 'Coliseo'], ['a2', 'Foro Romano']]), dia(2, [['a3', 'Panteón'], ['a4', 'Piazza Navona']]), dia(3, [['a5', 'Trastevere']]), dia(4, [['a6', 'Villa Borghese']]), dia(5, [['a7', 'Vaticano']])]

const eric = await nuevoUsuario('eric@correo.es', false, 'Eric')
const ana = await nuevoUsuario('ana@correo.es', false, 'VIAJES')
const viaje = await como(eric, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [eric, rutaDe(base)]))[0].id)
await servidor(() => q("insert into public.trip_members (trip_id, user_id, invited_by, permiso) values ($1, $2, $3, 'editar')", [viaje, ana, eric]))
const avisosDe = async (uid) => servidor(() => q("select payload from public.avisos where user_id = $1 and tipo = 'viaje_cambiado' order by creado_en", [uid]))
const limpiar = () => servidor(() => q("delete from public.avisos where tipo = 'viaje_cambiado'"))
const actualiza = (uid, ruta) => como(uid, () => q('update public.trips set route = $2::jsonb where id = $1', [viaje, ruta]))
const texto = (a) => textos.textoDelAviso({ tipo: 'viaje_cambiado', payload: a.payload })

console.log('1. Mover sitios (otros ids al rehacer el día): no es «quitar» ni «añadir»')
{
  await limpiar()
  // Ana (VIAJES, puede editar) mueve el Coliseo al día 2 y la app le pone otros ids a todo
  const movida = [dia(1, [['n1', 'Foro Romano']]), dia(2, [['n2', 'Panteón'], ['n3', 'Piazza Navona'], ['n4', 'Coliseo']]), dia(3, [['n5', 'Trastevere']]), dia(4, [['n6', 'Villa Borghese']]), dia(5, [['n7', 'Vaticano']])]
  await actualiza(ana, rutaDe(movida))
  const av = await avisosDe(eric)
  debe(av.length === 1, 'ap2', 'un aviso')
  const p = av[0].payload
  debe(p.anadidas.length === 0 && p.quitadas.length === 0 && p.movidas === 1 && p.movidas_lista[0].nombre === 'Coliseo' && p.movidas_lista[0].fecha === '2026-11-12', 'ap2', `se compara por nombre: 0 añadidas, 0 quitadas, 1 movida (${JSON.stringify({ a: p.anadidas.length, q: p.quitadas.length, m: p.movidas, l: p.movidas_lista })})`)
  debe(texto(av[0]) === 'Viajes ha movido Coliseo al jueves 12.' || texto(av[0]) === 'Viajes ha movido el Coliseo al jueves 12.', 'ap2', `el aviso dice: «${texto(av[0])}»`)
}

console.log('2. Un cambio con nombre propio es SU aviso, con su acción')
{
  await limpiar()
  const ft = [dia(1, [['f1', 'Free Tour por Roma'], ['f2', 'Coliseo']]), dia(2, [['f3', 'Panteón']]), dia(3, [['f4', 'Trastevere']]), dia(4, [['f5', 'Villa Borghese']]), dia(5, [['f6', 'Vaticano']])]
  const cambio = { id: 'c-uno', accion: { tipo: 'free_tour', dia_n: 1, fecha: '2026-11-11', reorganizados: 2 }, movidas: [], anadidas: [], quitadas: [] }
  await actualiza(ana, rutaDe(ft, '2026-11-11', '2026-11-15', { ultimoCambio: cambio }))
  let av = await avisosDe(eric)
  debe(av.length === 1 && av[0].payload.cambio?.accion?.tipo === 'free_tour', 'ap2', 'el aviso lleva la acción de la persona')
  debe(texto(av[0]) === 'Viajes ha añadido el Free Tour al miércoles 11 y se han reorganizado 2 días.', 'ap2', `«${texto(av[0])}»`)
  // Un paso más de la misma acción (mismo id): se junta con el aviso, no crea otro ni cambia el texto
  const ft2 = ft.map((d, i) => (i === 1 ? { ...d, stops: [{ id: 'g3', name: 'Panteón' }] } : d))
  await actualiza(ana, rutaDe(ft2, '2026-11-11', '2026-11-15', { ultimoCambio: cambio }))
  av = await avisosDe(eric)
  debe(av.length === 1 && texto(av[0]) === 'Viajes ha añadido el Free Tour al miércoles 11 y se han reorganizado 2 días.', 'ap2', 'un paso más de la misma acción (mismo id) no crea otro aviso ni cambia lo dicho')
  // Otra acción nueva: su propio aviso
  await actualiza(ana, rutaDe(ft2, '2026-11-11', '2026-11-15', { ultimoCambio: { id: 'c-dos', accion: { tipo: 'recuperar_ruta' } } }))
  av = await avisosDe(eric)
  debe(av.length === 2 && texto(av[1]) === 'Viajes ha vuelto a la ruta inicial.', 'ap2b', `una acción nueva, aviso nuevo: «${av[1] ? texto(av[1]) : ''}»`)
}

console.log('3. Quitar un día y volver a ponerlo: nada (ni «ha cambiado las fechas»)')
{
  await limpiar()
  await actualiza(eric, rutaDe(base, '2026-11-11', '2026-11-15'))
  await limpiar()
  const cuatro = base.slice(0, 4)
  await actualiza(eric, rutaDe(cuatro, '2026-11-11', '2026-11-14'))
  await actualiza(eric, rutaDe(base, '2026-11-11', '2026-11-15'))
  const av = await avisosDe(ana)
  debe(av.length === 1, 'ap2b', 'un solo aviso (los dos pasos seguidos de la misma persona se juntan)')
  const p = av[0]?.payload ?? {}
  debe(p.dias_quitados === 0 && p.dias_anadidos === 0 && p.fechas === false, 'ap2b', `de 5 días a 4 y otra vez a 5, con las mismas fechas: ni días quitados ni añadidos ni fechas (${JSON.stringify({ q: p.dias_quitados, a: p.dias_anadidos, f: p.fechas })})`)
  debe(!/fechas|quitado|añadido/.test(av[0] ? texto(av[0]) : ''), 'ap2b', `el texto no dice nada de eso: «${av[0] ? texto(av[0]) : ''}»`)
}

console.log('4. Cambiar las fechas de verdad sigue avisando')
{
  await limpiar()
  await actualiza(eric, rutaDe(base, '2026-11-12', '2026-11-16'))
  const av = await avisosDe(ana)
  debe(av.length === 1 && av[0].payload.fechas === true && /ha cambiado las fechas/.test(texto(av[0])), 'ap2b', `de verdad cambian: «${av[0] ? texto(av[0]) : ''}»`)
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
