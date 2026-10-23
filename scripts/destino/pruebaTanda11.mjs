// Tanda 11 (rutas de Roma, sin vuelos): una comprobación por cada punto de la Parte A (0 a 14) y de la Parte C (C8, C9) de docs/dias/NOTAS_REVISION_RUTAS.md.
// Lee las dos páginas ya sacadas con la generación de la app (scripts/destino/_rutasRevisionViajes.json = 126 rutas y _rutasRevisionLargosViajes.json = 210) y los datos del motor;
// no toca nada. Antes hay que sacar las páginas (`node scripts/destino/rutasRevision.mjs` y `--set=largos`).
//   node scripts/destino/pruebaTanda11.mjs
import fs from 'node:fs'

const cortas = JSON.parse(fs.readFileSync('scripts/destino/_rutasRevisionViajes.json', 'utf8')).viajes
const largas = JSON.parse(fs.readFileSync('scripts/destino/_rutasRevisionLargosViajes.json', 'utf8')).viajes
const todas = [...cortas, ...largas]
const roma = JSON.parse(fs.readFileSync('data/pipeline_v2/roma.json', 'utf8'))
const listas = JSON.parse(fs.readFileSync('data/dias/roma/listas.json', 'utf8'))
const norm = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
let comprobaciones = 0
const fallos = []
const debe = (c, punto, texto) => {
  comprobaciones++
  if (!c) fallos.push({ punto, texto })
}
const nombreRuta = (v) => `${v.n} días${v.dia4 ? ` (día 4: ${v.dia4})` : ''} ${v.combo} ${v.inicio}`
const reales = (d) => d.paradas.filter((p) => ['parada', 'noche', 'free_tour', 'pausa'].includes(p.tipo))
const nombres = (d) => reales(d).map((p) => p.nombre_app)
const conCierre = (p) => (p.avisos ?? []).filter((a) => /cerrad|cierra/i.test(a))

// ── P0 · la comida: ningún imprescindible se recorta («la comida iba a caer tarde») ─────────────────────────────────────────────────────────
const NIVEL1 = new Set(roma.places.filter((p) => p.level === 1).map((p) => norm(p.name)))
for (const v of todas) for (const d of v.dias) for (const p of d.paradas) {
  if (!NIVEL1.has(norm(p.nombre_base ?? p.nombre_app))) continue
  debe(!(p.por_que ?? []).some((r) => /comida iba a caer tarde/.test(r)), 'P0', `${nombreRuta(v)} día ${d.numero}: «${p.nombre_app}» (nivel 1) recortado por la comida`)
}

// ── P1 · Basílica y Cúpula: una sola visita; nunca «Basílica por fuera» + Cúpula ────────────────────────────────────────────────────────────
for (const v of todas) for (const d of v.dias) {
  const ns = nombres(d)
  const cupula = ns.filter((n) => /Cúpula de San Pedro/.test(n))
  const basilica = ns.filter((n) => n === 'Basílica de San Pedro')
  debe(!(cupula.length > 0 && basilica.length > 0), 'P1', `${nombreRuta(v)} día ${d.numero}: Cúpula y Basílica como dos paradas`)
  debe(cupula.length <= 1, 'P1', `${nombreRuta(v)} día ${d.numero}: la Cúpula dos veces`)
  for (const c of cupula) debe(c === 'Cúpula de San Pedro y Basílica por dentro', 'P1', `${nombreRuta(v)} día ${d.numero}: la Cúpula no sale como la visita única («${c}»)`)
}

// ── P2 · la Basílica de San Pedro no desaparece: todo día con los Museos Vaticanos lleva la Basílica (sola o con la Cúpula), como parada y no como «pasas por…» ───
for (const v of todas) for (const d of v.dias) {
  if (!nombres(d).some((n) => /Museos Vaticanos/.test(n))) continue
  const p = reales(d).find((x) => /Basílica de San Pedro|Cúpula de San Pedro y Basílica/.test(x.nombre_app))
  debe(Boolean(p), 'P2', `${nombreRuta(v)} día ${d.numero}: el día del Vaticano sin la Basílica de San Pedro como parada`)
}

// ── C9 · la Cúpula solo con Naturaleza y Vistas (B, C y F) ─────────────────────────────────────────────────────────────────────────────────
for (const v of todas) {
  const conNaturaleza = ['B', 'C', 'F'].includes(v.combo)
  const tiene = v.dias.some((d) => nombres(d).some((n) => /Cúpula de San Pedro/.test(n)))
  if (!conNaturaleza) debe(!tiene, 'C9', `${nombreRuta(v)}: la Cúpula sin Naturaleza y Vistas`)
}

// ── P3 · 2 días con Free Tour: el Gueto se queda, el Janículo va después de cenar y el Tempietto no va de noche ────────────────────────────
for (const v of cortas.filter((x) => x.n === 2 && ['D', 'E', 'F'].includes(x.combo))) {
  const d2 = v.dias.find((d) => nombres(d).includes('Barrio Judío'))
  debe(Boolean(d2), 'P3', `${nombreRuta(v)}: el Gueto (Barrio Judío) tiene que seguir en el viaje`)
  if (!d2) continue
  debe(!nombres(d2).includes("Fontana dell'Acqua Paola") && !reales(d2).some((p) => p.tipo !== 'noche' && /Mirador del Janículo/.test(p.nombre_app)), 'P3', `${nombreRuta(v)}: el Janículo sigue en la tarde`)
  debe(reales(d2).some((p) => p.tipo === 'noche' && /Janículo/.test(p.nombre_app)), 'P3', `${nombreRuta(v)}: falta el Janículo de noche, después de cenar`)
  debe(!reales(d2).some((p) => p.tipo === 'noche' && /Montorio|Tempietto/.test(p.nombre_app)), 'P3', `${nombreRuta(v)}: el Tempietto de noche`)
  const ps = reales(d2)
  debe(ps.length <= 14, 'P3', `${nombreRuta(v)}: el día del Gueto lleva ${ps.length} paradas (antes 15; más de 14)`)
}

// ── P4 · un solo aviso de cierre por parada; el mirador no «cierra»; el Tempietto cerrado es siempre el mirador ──────────────────────────
for (const v of todas) for (const d of v.dias) for (const p of reales(d)) {
  // («Cerrado este día» es el caso del día que se queda cerrado porque no hay otro día; trae su explicación aparte y no es una parada «por fuera».)
  if (!(p.avisos ?? []).includes('Cerrado este día')) debe(conCierre(p).length <= 1, 'P4', `${nombreRuta(v)} día ${d.numero}: «${p.nombre_app}» con ${conCierre(p).length} avisos de cierre (${conCierre(p).join(' / ')})`)
  if (/^El mirador de San Pietro in Montorio/.test(p.nombre_app)) debe(conCierre(p).length === 0 && !(p.marcas ?? []).includes('cerrada'), 'P4', `${nombreRuta(v)} día ${d.numero}: el mirador sale «cerrado» (${conCierre(p).join(' / ')})`)
  if (/Tempietto/.test(p.nombre_app)) debe(!conCierre(p).length && !(p.marcas ?? []).includes('cerrada'), 'P4', `${nombreRuta(v)} día ${d.numero}: el Tempietto cerrado no pasa a «El mirador» (${conCierre(p).join(' / ')})`)
}

// ── P5 · los falsos avisos de la página: ni «repetida» del Parque/Reloj ni «título» de Santa Maria la Mayor; ni «Reserva» en lo que se ve por fuera ───
for (const v of todas) for (const d of v.dias) for (const p of d.paradas) {
  if (/Parque de Villa Borghese|Reloj de agua/.test(p.nombre_app)) debe(!(p.marcas ?? []).includes('repetida'), 'P5', `${nombreRuta(v)}: «${p.nombre_app}» marcado como repetido`)
  if (/Santa Mar[ií]a la Mayor/i.test(p.nombre_app)) debe(!(p.marcas ?? []).includes('titulo'), 'P5', `${nombreRuta(v)}: Santa María la Mayor marcada con el título distinto`)
  if ((p.avisos ?? []).some((a) => /^Por fuera:/.test(a))) debe(!(p.avisos ?? []).some((a) => /^Reserva/.test(a)), 'P5', `${nombreRuta(v)} día ${d.numero}: «${p.nombre_app}» por fuera y con «Reserva»`)
}

// ── P7 · «se ve dentro del Free Tour» solo el día del Free Tour y nunca en un viaje sin Free Tour ─────────────────────────────────────────
for (const v of todas) {
  const conTour = ['D', 'E', 'F'].includes(v.combo)
  for (const d of v.dias) {
    const diaConTour = d.paradas.some((p) => p.tipo === 'free_tour')
    for (const p of d.paradas) if ((p.por_que ?? []).some((r) => /dentro del Free Tour/.test(r))) {
      debe(conTour && diaConTour, 'P7', `${nombreRuta(v)} día ${d.numero}: «${p.nombre_app}» dice «dentro del Free Tour» ${conTour ? 'en un día sin tour' : 'en un viaje sin Free Tour'}`)
    }
  }
}

// ── P8 a P11 · el orden de los días ────────────────────────────────────────────────────────────────────────────────────────────────────────
const dia = (v, patron) => v.dias.findIndex((d) => patron.test(d.nombre_escrito ?? d.dia_escrito ?? d.nombre))
for (const v of cortas.filter((x) => x.n >= 3 && ['A', 'B', 'C'].includes(x.combo))) {
  const iRoma = dia(v, /Roma antigua/)
  const iVat = dia(v, /Vaticano/)
  const iBas = dia(v, /basílicas/i)
  const sem = v.dia_semana_inicio
  // El Vaticano no cae en domingo ni en miércoles.
  const semanaDe = (i) => ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][new Date(`${v.dias[i].fecha}T12:00:00Z`).getUTCDay()]
  debe(!['domingo', 'miércoles'].includes(semanaDe(iVat)), 'P8', `${nombreRuta(v)}: el Vaticano cae en ${semanaDe(iVat)}`)
  // Primero los cierres; luego el Vaticano no el último; luego la Roma antigua el día 1.
  if (v.n === 4) debe(iBas === 3 || iRoma === 3 || iBas >= 0, 'P9', `${nombreRuta(v)}: sin el día de las basílicas`)
  if (v.n >= 3) debe(iVat !== v.dias.length - 1 || ['domingo', 'miércoles'].includes(semanaDe(0)) || false, 'P9', `${nombreRuta(v)}: el Vaticano es el último día (${sem})`)
}
// El caso del viernes 13 de noviembre (4 días): Roma antigua, Vaticano, Centro y Villa Borghese, Basílicas y el Aventino.
{
  const v = cortas.find((x) => x.n === 4 && x.combo === 'A' && x.inicio === '2026-11-13')
  debe(Boolean(v) && v.dias.map((d) => d.nombre_escrito).join('|').includes('Roma antigua') && dia(v, /Roma antigua/) === 0 && dia(v, /Vaticano/) === 1 && dia(v, /basílicas/i) === 3, 'P9', `4 días A del viernes 13: el orden es ${v?.dias.map((d) => d.nombre_escrito).join(' / ')}`)
}
// 3 días desde el sábado y desde el martes: primero los cierres, luego «el Vaticano no el último día»: el Vaticano abre el viaje.
for (const ini of ['2026-11-14', '2026-11-10']) {
  const v = cortas.find((x) => x.n === 3 && x.combo === 'A' && x.inicio === ini)
  if (v) debe(dia(v, /Vaticano/) !== v.dias.length - 1, 'P11', `3 días A desde el ${v.dia_semana_inicio}: el Vaticano es el último día`)
}
// Un cierre que se ve por fuera (el Castillo) pesa poco: el día del Vaticano no se mueve por él (el lunes 9 de noviembre, 3 días: el Vaticano el martes).
{
  const v = cortas.find((x) => x.n === 3 && x.combo === 'A' && x.inicio === '2026-11-09')
  debe(Boolean(v) && dia(v, /Vaticano/) === 1, 'P10', `3 días A desde el lunes 9: el Vaticano no está el día 2 (${v?.dias.map((d) => d.nombre_escrito).join(' / ')})`)
}
// D5 tiene su versión de lunes (sin Caracalla): no cuenta como día malo.
debe(Boolean(listas.dias.D5.variantes.find((x) => x.id === 'lunes_sin_caracalla')), 'P8', 'D5 tiene su versión de lunes')
{
  const v = cortas.find((x) => x.n === 4 && x.combo === 'A' && x.inicio === '2026-11-13')
  const lunes = v?.dias.at(-1)
  debe(Boolean(lunes) && /basílicas/i.test(lunes.nombre_escrito ?? '') && !nombres(lunes).includes('Termas de Caracalla'), 'P8', 'el lunes de las basílicas sale sin las Termas de Caracalla')
}

// ── P12 · datos de horarios ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const detalle = (f) => JSON.parse(fs.readFileSync(`data/pipeline_v2/detalle/roma/${f}.json`, 'utf8'))
const fichas = (f) => { const d = detalle(f); return Array.isArray(d) ? d : d.places ?? d.lugares ?? Object.values(d).find(Array.isArray) ?? [] }
const ficha = (f, nombre) => fichas(f).find((x) => x.name === nombre)
debe(!(ficha('roma_antigua', 'Museos Capitolinos').schedule.closed ?? []).some((c) => /lunes/i.test(c)), 'P12', 'la ficha de los Museos Capitolinos dice que cierran los lunes')
debe(!(ficha('roma_antigua', 'Mercados de Trajano').schedule.closed ?? []).some((c) => /lunes/i.test(c)), 'P12', 'la ficha de los Mercados de Trajano dice que cierran los lunes')
debe(!(ficha('centro_historico', 'Ara Pacis').schedule.closed ?? []).some((c) => /lunes/i.test(c)), 'P12', 'la ficha del Ara Pacis dice que cierra los lunes')
{
  const sl = ficha('centro_historico', 'Iglesia de San Luigi dei Francesi')
  debe(/14:30–18:30/.test(sl.schedule.periods[0].hours), 'P12', `San Luigi en la ficha: ${sl.schedule.periods[0].hours}`)
  const motor = roma.places.find((p) => p.name === 'Iglesia de San Luigi dei Francesi')
  debe(!JSON.stringify(motor.windows).includes('18:15'), 'P12', 'San Luigi en el motor sigue cerrando a las 18:15 en `windows`')
}
// Y la auditoría: ninguna ficha dice que cierra un día que el motor tiene abierto.
{
  const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
  const motor = new Map(roma.places.map((p) => [norm(p.name), p]))
  for (const f of fs.readdirSync('data/pipeline_v2/detalle/roma').filter((x) => x.endsWith('.json'))) for (const l of fichas(f.replace('.json', ''))) {
    const m = motor.get(norm(l.name))
    if (!m || !l.schedule) continue
    const cierraFicha = (l.schedule.closed ?? []).map(norm).filter((c) => !/reducido/.test(c)).map((c) => DIAS.find((d) => c.startsWith(d))).filter(Boolean)
    const cierraMotor = (m.closed_on ?? []).map(norm).map((c) => DIAS.find((d) => c.startsWith(d))).filter(Boolean)
    for (const dia of cierraFicha) debe(cierraMotor.includes(dia), 'P12', `la ficha de «${l.name}» dice que cierra el ${dia} y el motor lo tiene abierto`)
  }
}

// ── P13 · el Gesù y San Luigi: lo que cierra antes, primero; nada llega cerrado ───────────────────────────────────────────────────────────────
for (const v of todas) for (const d of v.dias) {
  const ns = nombres(d)
  const iG = ns.indexOf('Iglesia del Gesù')
  const iN = ns.indexOf('Piazza Navona')
  const iL = ns.indexOf('San Luigi dei Francesi (los Caravaggio)')
  const iP = ns.indexOf('Panteón')
  if (iG >= 0 && iN >= 0 && !d.paradas.find((p) => p.nombre_app === 'Piazza Navona')?.tipo?.includes('noche')) debe(iG < iN, 'P13', `${nombreRuta(v)} día ${d.numero}: Piazza Navona antes que el Gesù`)
  if (iL >= 0 && iP >= 0) debe(iL < iP, 'P13', `${nombreRuta(v)} día ${d.numero}: San Luigi después del Panteón`)
  const g = d.paradas.find((p) => p.nombre_app === 'Iglesia del Gesù')
  if (g) debe(!(g.marcas ?? []).includes('cerrada'), 'P13', `${nombreRuta(v)} día ${d.numero}: el Gesù sale cerrado`)
}
// El día 1 del miércoles 11 de noviembre, tres días C: Argentina → San Luigi → Panteón → Gesù → Navona.
{
  const v = cortas.find((x) => x.n === 3 && x.combo === 'C' && x.inicio === '2026-11-11')
  const ns = nombres(v.dias[0])
  const orden = ['Largo di Torre Argentina', 'San Luigi dei Francesi (los Caravaggio)', 'Panteón', 'Iglesia del Gesù', 'Piazza Navona'].map((n) => ns.indexOf(n))
  debe(orden.every((i, k) => i >= 0 && (k === 0 || i > orden[k - 1])), 'P13', `3 días C del miércoles 11: el orden de la tarde es ${ns.join(' → ')}`)
}

// ── P14 · el día de vuelta sin vuelo: la página cuenta N días de contenido + el de vuelta (la app: N+1 días, N noches) ──────────────────────────
for (const v of cortas) debe(v.dias.length === v.n, 'P14', `${nombreRuta(v)}: la página lleva ${v.dias.length} días y dice ${v.n}`)

// ── C8 · Roma lleva 5 días curados; el 6.º, en blanco ────────────────────────────────────────────────────────────────────────────────────────
for (const v of largas.filter((x) => x.n === 6 && x.dia4 === 'roma')) {
  debe(v.dias.length === 6 && v.dias[5].paradas.filter((p) => ['parada', 'noche', 'free_tour', 'pausa'].includes(p.tipo)).length === 0, 'C8', `${nombreRuta(v)}: el día 6 no está en blanco`)
  // (Si un cierre no deja la Vía Appia en su día —las Catacumbas cierran los miércoles—, se cambia con las basílicas, nunca con los tres primeros.)
  const finales = v.dias.slice(3, 5).map((d) => d.nombre)
  debe(finales.some((n) => /Vía Appia/.test(n)) && finales.some((n) => /Basílicas/.test(n)), 'C8', `${nombreRuta(v)}: los días 4 y 5 no son las basílicas y la Vía Appia (${finales.join(' / ')})`)
}
for (const v of largas.filter((x) => x.n === 6 && x.dia4 === 'excursion')) {
  const ultimo = v.dias.at(-1)
  const finalesE = v.dias.slice(4).map((d) => d.nombre)
  debe(finalesE.some((n) => /Vía Appia/.test(n)) && finalesE.some((n) => /Basílicas/.test(n)), 'C8', `${nombreRuta(v)}: con excursión los dos últimos días no son las basílicas y la Vía Appia (${finalesE.join(' / ')})`)
  debe(v.dias.every((d) => reales(d).length > 0 || /Excursión/.test(d.nombre)), 'C8', `${nombreRuta(v)}: queda algún día en blanco con la excursión`)
}
for (const v of largas.filter((x) => x.n === 5 && x.dia4 === 'roma')) debe(v.dias.slice(3, 5).some((d) => /Vía Appia/.test(d.nombre)), 'C8', `${nombreRuta(v)}: falta la Vía Appia`)
debe(Boolean(listas.dias.D6), 'C8', 'Roma desde arriba (D6) sigue en los datos')
debe(!roma.curated_routes.por_dias_ciudad['5'].sin_free_tour.includes('D6') && roma.curated_routes.por_dias_ciudad['6'].sin_free_tour.length === 5, 'C8', 'la tabla de días ya no lleva D6')

// ── Los nombres de los días (C4) ───────────────────────────────────────────────────────────────────────────────────────────────────────────
for (const v of largas.filter((x) => x.n >= 5)) for (const d of v.dias) if (/Vía Appia/.test(d.nombre_escrito ?? '')) debe(/Vía Appia/.test(d.nombre), 'nombres', `${nombreRuta(v)}: el día de la Vía Appia se llama «${d.nombre}»`)
for (const v of todas) for (const d of v.dias) if (/basílicas y el Aventino/i.test(d.nombre_escrito ?? '')) debe(/^Basílicas y el Aventino$/.test(d.nombre), 'nombres', `${nombreRuta(v)}: el día de las basílicas se llama «${d.nombre}»`)

// ── 11B · la Galería Borghese nunca cae en lunes en los viajes de 3 a 6 días que empiezan en sábado o domingo ─────────────────────────────────
// (Hay siempre otro orden que cumple las reglas: Roma antigua, Villa Borghese (sábado o domingo), Vaticano en medio —no el último—, Basílicas al final.)
const semanaDeFecha = (iso) => ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][new Date(`${iso}T12:00:00Z`).getUTCDay()]
for (const v of todas.filter((x) => x.n >= 3 && ['sábado', 'domingo'].includes(x.dia_semana_inicio))) for (const d of v.dias) {
  const g = d.paradas.find((p) => p.nombre_app === 'Galería Borghese')
  if (!g) continue
  debe(semanaDeFecha(d.fecha) !== 'lunes' && !(g.marcas ?? []).includes('cerrada') && !(g.avisos ?? []).includes('Cerrado este día'), '11B', `${nombreRuta(v)} (empieza el ${v.dia_semana_inicio}): la Galería Borghese cae el ${semanaDeFecha(d.fecha)} ${d.fecha} y está cerrada`)
}
{
  // El ejemplo de Eric: 4 días desde el sábado 14-nov-2026 (A): sábado Roma antigua, domingo Villa Borghese, lunes Vaticano, martes Basílicas.
  const v = cortas.find((x) => x.n === 4 && x.combo === 'A' && x.inicio === '2026-11-14')
  const orden = v?.dias.map((d) => d.nombre_escrito).join(' | ')
  debe(Boolean(v) && /Roma antigua/.test(v.dias[0].nombre_escrito) && /Villa Borghese/.test(v.dias[1].nombre_escrito) && /Vaticano/.test(v.dias[2].nombre_escrito) && /basílicas/i.test(v.dias[3].nombre_escrito), '11B', `4 días A desde el sábado 14: el orden es ${orden}`)
}
// Aracoeli: todos los días de 9:00 a 18:00, con su nota de horario orientativo.
{
  const a = roma.places.find((p) => p.name === 'Santo Bambino de Aracoeli')
  debe(a?.schedule === '09:00-18:00' && (a.closed_on ?? []).length === 0 && /orientativo/i.test(a.horario_orientativo ?? ''), '11B', 'Aracoeli: 9:00-18:00 todos los días con la nota «horario orientativo»')
}
// Roma desde arriba no se ofrece en el día en blanco.
{
  const notas = fs.readFileSync('docs/dias/NOTAS_REVISION_RUTAS.md', 'utf8')
  debe(!/Te lo organizamos\? Roma desde arriba»\./.test(notas) && /Roma desde arriba no se ofrece en el día en blanco \(Eric, 22-oct\)/.test(notas), '11B', 'NOTAS_REVISION_RUTAS.md aún propone «¿Te lo organizamos?»')
}

console.log(`${comprobaciones} comprobaciones · ${fallos.length} fallos`)
const porPunto = new Map()
for (const f of fallos) porPunto.set(f.punto, (porPunto.get(f.punto) ?? 0) + 1)
console.log('Fallos por punto:', [...porPunto.entries()].map(([k, n]) => `${k} ${n}`).join(' · ') || 'ninguno')
for (const f of fallos.filter((x) => !process.argv[2] || x.punto === process.argv[2]).slice(0, 40)) console.log(` · ${f.punto}: ${f.texto}`)
if (fallos.length > 40) console.log(` … y ${fallos.length - 40} más`)
process.exit(fallos.length ? 1 : 0)
