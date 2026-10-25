// La prueba del motor de la Tanda 10M: tarjetas especiales (Navidad, Semana Santa, cumpleaños de Roma), un aviso por fecha con la frase de todos,
// la excepción, los cierres de cada semana, el último domingo de mes con su {día} y los campos `cierran` / `campana`.
//   node scripts/destino/pruebaTanda10M_motor.mjs
// Usa el motor de verdad (buildDayBlockV3), sin navegador ni servidor.
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { seasonNoteFor } from '../../server/engine/seasonNote.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { easterIso } from '../../shared/routeEngine/openingHours.js'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const D = findPipelineV2Data('Roma')
const sumar = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
/** Los avisos y la tarjeta de un viaje que sale el `inicio` con `total` días (el último es el de vuelta). */
async function viaje(inicio, total) {
  const dias = []
  for (let n = 1; n <= total - 1; n++) dias.push(await buildDayBlockV3(D, total, false, n, null, inicio, [], ['imprescindibles'], { city: 'Roma', scheduler: 'v3', month: null }))
  return { avisos: dias.find((d) => d?.date_notices)?.date_notices ?? [], nota: dias.find((d) => d?.season_note)?.season_note ?? null, dias }
}
const nota = (fechas) => seasonNoteFor(D, { calendar: { hasDates: true }, days: [] }, { tripDates: fechas })
const FRASE = 'Hemos preparado tu ruta para que disfrutes de todo lo que está abierto y tengas una experiencia fantástica.'

/* ───────── 1. Las tarjetas especiales ───────── */
console.log('1. Tarjetas: Navidad, Semana Santa, cumpleaños de Roma')
{
  const TEXTOS = {
    navidad: '¡Vas a vivir Roma en Navidad! Uno de los momentos más bonitos del año para recorrerla. Te hemos preparado la mejor ruta para que disfrutes cada rincón de la ciudad.',
    semana_santa: '¡Vas a vivir Roma en Semana Santa! Uno de los momentos más especiales del año en la ciudad. Te hemos preparado la mejor ruta para que lo vivas todo.',
    cumpleanos_ciudad: '¡Estás en Roma el día de su cumpleaños! El 21 de abril la ciudad celebra su fundación, hace más de 2.700 años. Te hemos preparado la mejor ruta para que lo disfrutes.',
  }
  const n1 = nota(['2026-12-10', '2026-12-11'])
  debe(n1?.season === 'navidad' && n1.text === TEXTOS.navidad && n1.icon === 'navidad', 'tarjetas', 'Navidad: su tarjeta con su texto exacto')
  debe(nota(['2026-11-25', '2026-11-26'])?.season === 'navidad' && nota(['2027-01-06', '2027-01-07'])?.season === 'navidad', 'tarjetas', 'Navidad sale con ALGÚN día del viaje en la temporada (26 nov y 6 ene, aunque el primer día no lo esté)')
  debe(nota(['2026-11-24', '2026-11-25']) === null && nota(['2027-01-07', '2027-01-08']) === null, 'tarjetas', 'Navidad no sale el 25 de noviembre ni el 7 de enero')
  const e = easterIso(2027) // 2027-03-28
  const ramos = sumar(e, -7)
  const n2 = nota([sumar(ramos, -2), sumar(ramos, -1)])
  debe(n2 === null, 'tarjetas', 'el sábado antes del Domingo de Ramos no sale nada')
  const n3 = nota([sumar(ramos, -1), ramos])
  debe(n3?.season === 'semana_santa' && n3.text === TEXTOS.semana_santa && n3.icon === 'semana_santa', 'tarjetas', 'Semana Santa: desde el Domingo de Ramos, con su texto exacto')
  const n4 = nota([sumar(e, 1), sumar(e, 2)])
  debe(n4?.season === 'semana_santa', 'tarjetas', 'el Lunes de Pascua todavía es Semana Santa')
  debe(nota([sumar(e, 2), sumar(e, 3)]) === null, 'tarjetas', 'el martes después de Pascua ya no')
  const n5 = nota(['2027-04-20', '2027-04-21', '2027-04-22'])
  debe(n5?.season === 'cumpleanos_ciudad' && n5.text === TEXTOS.cumpleanos_ciudad && n5.icon === 'cumpleanos', 'tarjetas', 'el 21 de abril: el cumpleaños de Roma, con su texto exacto')
  // Pascua cerca del 21 de abril (2038: Pascua el 25 de abril; Ramos el 18): gana Semana Santa.
  const e38 = easterIso(2038)
  debe(e38 === '2038-04-25', 'tarjetas', 'Pascua de 2038 es el 25 de abril (el caso de la prueba)')
  const n6 = nota(['2038-04-20', '2038-04-21'])
  debe(n6?.season === 'semana_santa', 'tarjetas', 'Semana Santa y 21 de abril a la vez: solo la de Semana Santa')
  debe(nota(['2027-07-10', '2027-07-11']) === null && nota(['2027-10-05']) === null, 'tarjetas', 'otra fecha: ninguna')
  debe(new Set([n1, n3, n5].map((n) => n.text)).size === 3 && [n1, n3, n5].every((n) => !n.text.includes('{') && n.title), 'tarjetas', 'un texto distinto por tarjeta, con el destino puesto y su título')
  debe(seasonNoteFor(D, { calendar: { hasDates: false }, days: [] }, { tripDates: ['2026-12-10'] }) === null, 'tarjetas', 'sin fechas no sale ninguna')
  // El destino pone las suyas: otro destino con otro nombre.
  const otro = seasonNoteFor({ ...D, destination: 'Florencia, Italia' }, { calendar: { hasDates: true }, days: [] }, { tripDates: ['2026-12-10'] })
  debe(otro?.text.includes('Florencia') && !otro.text.includes('Roma'), 'tarjetas', '«Roma» sale del dato del destino')
  debe(seasonNoteFor({ destination: 'X' }, { calendar: { hasDates: true }, days: [] }, { tripDates: ['2026-12-10'] }) === null, 'tarjetas', 'un destino sin tarjetas no saca ninguna')
  // En el viaje de verdad: viene en el primer día de ciudad y con el contrato nuevo.
  const v = await viaje('2027-03-22', 3)
  debe(v.nota?.season === 'semana_santa' && v.nota.text === TEXTOS.semana_santa && v.nota.title === 'Semana Santa en Roma' && v.nota.icon === 'semana_santa', 'tarjetas', 'un viaje real en Semana Santa saca { season, title, text, icon }')
  const f = D.destination_config.nota_temporada._fuentes
  debe(f?.comprobado === '2026-10-25' && /vatican\.va/.test(f.semana_santa) && /turismoroma\.it/.test(f.cumpleanos_ciudad), 'tarjetas', 'las fuentes y la fecha de comprobación están en los datos')
}

/* ───────── 2. Un aviso por fecha ───────── */
console.log('2. Un aviso por fecha, con la frase de todos y la excepción')
{
  const datos = D.fechas_especiales
  debe(datos.fechas.every((e) => !('hecho' in e) && !('cubre' in e)), 'un_aviso', 'ninguna entrada lleva ya variantes `hecho` ni `cubre`')
  debe(datos.frases.hecho === FRASE, 'un_aviso', 'la frase de lo hecho es la de Eric, palabra por palabra')
  const palabras = (t) => t.split(/\s+/).filter(Boolean).length
  debe(datos.fechas.every((e) => palabras(e.texto) <= 35), 'un_aviso', 'cada aviso de los datos, con su frase, lleva 35 palabras como mucho')
  const salidas = ['2026-11-05', '2026-11-22', '2026-11-27', '2026-12-04', '2026-12-23', '2026-12-30', '2027-01-04', '2027-03-22', '2027-04-30', '2027-05-29', '2027-06-27', '2027-08-12', '2027-10-30', '2027-11-01']
  let tarjetas = 0
  let conFrase = 0
  const rotas = []
  const largas = []
  const repetidos = []
  for (const salida of salidas) {
    for (const total of [3, 5]) {
      const { avisos } = await viaje(salida, total)
      const ids = avisos.map((a) => a.id)
      if (new Set(ids).size !== ids.length) repetidos.push(`${salida}/${total}`)
      for (const a of avisos) {
        tarjetas++
        if (!/^\d{4}-\d{2}-\d{2}:/.test(a.id) || /\d+$/.test(a.id.split(':')[1] ?? '')) rotas.push(`${salida}: id ${a.id}`)
        if (!Array.isArray(a.cierran) || typeof a.campana !== 'string' || !a.campana || !a.title || !a.tag || !Array.isArray(a.texts) || !a.texts[0] || !a.date_iso || !a.icon || !a.kind) rotas.push(`${salida}: campos de ${a.id}`)
        if (a.hecho === FRASE) {
          conFrase++
          if (!a.texts[0].endsWith(FRASE)) rotas.push(`${salida}: ${a.id} no acaba con la frase`)
          if (palabras(a.texts[0]) > 35) largas.push(`${salida}/${total} ${a.id} (${palabras(a.texts[0])})`)
        }
        if (/Hemos puesto tu visita el|Hemos puesto el Vaticano otro d/.test(a.texts.join(' '))) rotas.push(`${salida}: ${a.id} conserva una variante vieja`)
      }
    }
  }
  debe(tarjetas > 20 && rotas.length === 0, 'un_aviso', `todos los avisos llevan id estable por fecha, campos, cierran y campana (${tarjetas} tarjetas; ${rotas.slice(0, 3).join(' | ') || 'ninguna rota'})`)
  debe(repetidos.length === 0, 'un_aviso', `ninguna fecha repite aviso (${repetidos.join(', ') || 'ninguna'})`)
  debe(conFrase > 10 && largas.length === 0, 'un_aviso', `los avisos con la frase de todos pasan de 35 palabras (${conFrase} con frase; ${largas.slice(0, 3).join(' | ') || 'ninguno'})`)
  // Navidad, sin excepción posible: el 25 y el 26 en el viaje.
  const n = await viaje('2026-12-24', 4)
  const nav = n.avisos.find((a) => a.id === '2026-12-25:navidad')
  debe(nav && nav.date_iso === '2026-12-25' && nav.cierran.includes('Coliseo') && nav.cierran.includes('Panteón') && nav.cierran.includes('Museos Vaticanos y Capilla Sixtina'), 'un_aviso', 'el 25 de diciembre cierran el Coliseo, el Panteón y los Museos Vaticanos: lo lleva la tarjeta (`cierran`)')
  debe(n.avisos.find((a) => a.id === '2026-12-26:san_esteban')?.texts[0] === `Es festivo y cierran los Museos Vaticanos. ${FRASE}`, 'un_aviso', 'San Esteban: qué pasa + la frase de todos')
  // Sale aunque nada de su ruta cierre: el 15 de agosto sin Vaticano en el viaje (viaje de 2 días con el Vaticano otro día).
  const f = await viaje('2027-08-14', 3)
  debe(f.avisos.some((a) => a.id === '2027-08-15:ferragosto' && a.title === '15 de agosto · Ferragosto' && a.texts[0].startsWith('Es festivo y cierran los Museos Vaticanos y muchos comercios.')), 'un_aviso', 'Ferragosto: «15 de agosto · Ferragosto» con su texto, esté o no el Vaticano en la ruta')
  // La excepción: la Galería Borghese se queda el 25 de diciembre (no hay otro día en el viaje).
  const ex = n.avisos.find((a) => a.id === '2026-12-25:navidad')
  const exTodos = (await Promise.all(['2026-12-25', '2026-12-24', '2027-01-01'].map((s) => viaje(s, 2)))).flatMap((r) => r.avisos)
  const conExcepcion = [ex, ...exTodos].filter(Boolean).filter((a) => /En tu viaje no hay otro día para .+: se quedan? en su día y decides tú\./.test(a.texts[0]))
  debe(conExcepcion.length > 0 && conExcepcion.every((a) => !a.texts[0].includes(FRASE)), 'excepcion', `un sitio que no se quita y se queda en un día que cierra: «En tu viaje no hay otro día para…» y SIN la frase de todos (${conExcepcion.map((a) => a.id).join(', ')})`)
  debe(conExcepcion.some((a) => /los Museos Vaticanos: se quedan en su día/.test(a.texts[0]) || /la Galería Borghese: se queda en su día/.test(a.texts[0])), 'excepcion', 'con la concordancia: «los Museos Vaticanos … se quedan», «la Galería Borghese … se queda»')
  const fuera = [ex, ...exTodos].filter(Boolean).filter((a) => /te lo enseñamos por fuera, merece la pena igual/.test(a.texts[0]))
  debe(fuera.length > 0 && fuera.every((a) => !a.texts[0].includes(FRASE)), 'excepcion', 'si se enseña por fuera, el texto de siempre («…te lo enseñamos por fuera, merece la pena igual») y sin la frase de todos')
}

/* ───────── 3. Los cierres de cada semana ───────── */
console.log('3. Cierres de la semana: domingo + Vaticanos, lunes + Borghese')
{
  // El viaje de Eric: del jueves 5 al domingo 8 de noviembre de 2026 (4 días: el domingo es el de vuelta). El Vaticano cae solo el viernes.
  const v = await viaje('2026-11-05', 4)
  const dom = v.avisos.find((a) => a.date_iso === '2026-11-08')
  debe(dom?.texts[0] === `Los domingos cierran los Museos Vaticanos. ${FRASE}`, 'semana', 'domingo 8 con los Vaticanos en la ruta (otro día): «Los domingos cierran los Museos Vaticanos.» + la frase de todos')
  debe(dom?.title === 'Domingo 8 · Museos Vaticanos cerrados' && dom.day_number === 4 && dom.kind === 'auto', 'semana', 'su título nombra el sitio, nunca «los museos», y cae en el día 4 del viaje')
  debe(JSON.stringify(dom?.cierran) === JSON.stringify(['Museos Vaticanos y Capilla Sixtina']) && dom?.campana === 'Museos Vaticanos cierran el domingo 8 de noviembre.', 'semana', `su campana: «${dom?.campana}»`)
  // Un viaje con el lunes dentro y la Borghese en la ruta.
  const l = await viaje('2026-11-27', 4)
  const lun = l.avisos.find((a) => a.date_iso === '2026-11-30')
  debe(lun && /^Los lunes cierra la Galería Borghese\./.test(lun.texts[0]) && lun.cierran.includes('Galería Borghese'), 'semana', 'lunes 30 con la Galería Borghese en la ruta: «Los lunes cierra la Galería Borghese.»')
  // Un viaje sin el Vaticano en la ruta (un solo día en domingo): no se avisa de lo que no lleva.
  const sin = D.places.filter((p) => (p.level ?? 3) <= 2 && ((Array.isArray(p.closed_on) ? p.closed_on : String(p.closed_on ?? '').split(',')).map((s) => s.trim()).includes('lunes')))
  debe(sin.length >= 2, 'semana', `en Roma, el lunes cierran varios sitios además de la Borghese (${sin.map((p) => p.name).join(', ')})`)
}

/* ───────── 4. El último domingo de mes ───────── */
console.log('4. Último domingo de mes con su {día}')
{
  const v = await viaje('2026-11-27', 4)
  const ult = v.avisos.find((a) => a.id === '2026-11-29:ultimo_domingo_vaticanos')
  debe(ult?.texts[0] === 'Último domingo de mes: los Museos Vaticanos abren gratis por la mañana, hay mucha cola y puedes perder todo el día. Por eso te los hemos puesto el sábado 28.', 'ultimo', `el texto de Eric con el día del viaje en que están los Vaticanos (${ult?.texts[0]})`)
  debe(!v.avisos.some((a) => a.date_iso === '2026-11-29' && /domingos cierran/.test(a.texts.join(' '))), 'ultimo', 'ese domingo NO sale «los domingos cierran»')
  debe(ult?.title === 'Domingo 29 · Los Museos Vaticanos abren gratis' && ult.campana === ult.title && JSON.stringify(ult.cierran) === '[]', 'ultimo', 'su campana es su título y no cierra nada')
  const dia = v.dias.findIndex((d) => (d?.stops ?? []).some((s) => s.name === 'Museos Vaticanos y Capilla Sixtina'))
  debe(dia === 1 && sumar('2026-11-27', dia) === '2026-11-28', 'ultimo', 'y es verdad: los Vaticanos están ese día de la ruta, y ninguno es el domingo')
  // Otro mes y otro día de la semana de los Vaticanos.
  const w = await viaje('2026-12-24', 4)
  debe(w.avisos.find((a) => a.id === '2026-12-27:ultimo_domingo_vaticanos')?.texts[0].endsWith('Por eso te los hemos puesto el jueves 24.'), 'ultimo', 'otro viaje: «el jueves 24» (el día se calcula)')
  // Sin los Vaticanos en otro día (el viaje es solo ese domingo): no sale.
  const solo = await viaje('2026-11-29', 2)
  debe(!solo.avisos.some((a) => a.id.endsWith('ultimo_domingo_vaticanos')), 'ultimo', 'si los Vaticanos no están en la ruta en otro día, no sale el aviso')
  // Pascua: no es "último domingo" para los Vaticanos.
  const pascua = await viaje('2027-03-27', 3)
  debe(!pascua.avisos.some((a) => a.id.endsWith('ultimo_domingo_vaticanos')), 'ultimo', 'el domingo de Pascua no sale el del último domingo')
}

/* ───────── 5. `cierran` y `campana` ───────── */
console.log('5. Campos de la campana')
{
  const v = await viaje('2026-12-30', 4)
  const ano = v.avisos.find((a) => a.id === '2027-01-01:ano_nuevo')
  debe(ano && /^1 de enero · Año Nuevo: el Coliseo, el Foro Romano y \d+ lugares más cierran\.$/.test(ano.campana), 'campana', `con un día especial, su nombre delante (${ano?.campana})`)
  debe(ano && ano.cierran.length >= 4 && ['Coliseo', 'Foro Romano y Palatino', 'Panteón', 'Museos Vaticanos y Capilla Sixtina'].every((n) => ano.cierran.includes(n)), 'campana', '`cierran` lleva TODOS los lugares que cierran ese día')
  const nav = (await viaje('2026-12-24', 3)).avisos.find((a) => a.id === '2026-12-25:navidad')
  debe(nav && /^25 de diciembre · Navidad: el Coliseo, el Foro Romano y \d+ lugares más cierran\.$/.test(nav.campana), 'campana', `Navidad (${nav?.campana})`)
  const info = (await viaje('2026-12-31', 4)).avisos.find((a) => a.id.endsWith('mercadillo_navona'))
  debe(!info || (info.campana === info.title && info.cierran.length === 0), 'campana', 'sin nada que cierre, la campana es el título del aviso')
  const borg = (await viaje('2026-12-05', 3)).avisos.find((a) => a.id.endsWith('domenica_borghese'))
  debe(!borg || borg.campana === 'Domingo 6 · La Galería Borghese, gratis', 'campana', `«Domingo 6 · La Galería Borghese, gratis» (${borg?.campana})`)
}

if (fallos.length) {
  console.log(`\n${fallos.length} FALLOS de ${comprobaciones}:`)
  for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
  process.exit(1)
}
console.log(`\nPrueba de la Tanda 10M (motor): ${comprobaciones} comprobaciones · 0 fallos`)
