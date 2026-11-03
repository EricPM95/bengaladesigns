/**
 * LZ1 (agente C): calcula CADA día de DIAS_CURADOS_LANZAROTE.md desde las 6 zonas de alojamiento con la
 * tabla de coche de Mapbox (data/pipeline_v2/travel/lanzarote_coche.json) y escribe
 *   - docs/destinos/lanzarote/INFORME_DIAS_MAPBOX.md  (un informe por día, en sencillo)
 *   - data/dias/lanzarote/_dias_coche.json            (los números, para la prueba)
 * NO cambia los días: solo los mide. Los días están aquí copiados tal cual el borrador 2 (orden, duraciones,
 * horas fijas). Invierno (primeros de noviembre, atardecer 18:05, hora de Canarias).
 *
 * Cómo se lee un paso: { p: id de parada, m: minutos que dura la visita, fijo: 'HH:MM' (turno u hora con reserva:
 * hay que estar 15 min antes), abre: 'HH:MM' (no se entra antes), ult: 'HH:MM' (última entrada), llegar: 'HH:MM'
 * (hora a la que se quiere estar), sol: true (se queda hasta el atardecer), comida/cena: true }.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const T = JSON.parse(readFileSync(join(ROOT, 'data/pipeline_v2/travel/lanzarote_coche.json'), 'utf8'))
const P = JSON.parse(readFileSync(join(ROOT, 'data/dias/lanzarote/_paradas.json'), 'utf8'))
const idx = new Map(T.points.map((p, i) => [p.refs[0].id, i]))
const park = new Map(P.paradas.map((p) => [p.id, p]))
const SEC = T.modes.driving.seconds, MET = T.modes.driving.meters
export const drive = (a, b) => (a === b ? 0 : Math.round(SEC[idx.get(a)][idx.get(b)] / 60))
export const km = (a, b) => (a === b ? 0 : Math.round(MET[idx.get(a)][idx.get(b)] / 100) / 10)

const ZONAS = [['puerto_del_carmen', 'Puerto del Carmen'], ['playa_blanca', 'Playa Blanca'], ['costa_teguise', 'Costa Teguise'], ['arrecife', 'Arrecife'], ['el_norte', 'El norte'], ['el_interior', 'El interior']]
const TOPE = 180, SOL = hm('18:05'), MARGEN_TURNO = 15
function hm(s) { const [h, m] = s.split(':').map(Number); return h * 60 + m }
export const fh = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.round(m) % 60).padStart(2, '0')}`
const dur = (m) => (m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min` : `${m} min`)
const aparcar = (id, domingo) => { const p = park.get(id); return p ? (domingo && p.aparcar_min_domingo != null ? p.aparcar_min_domingo : p.aparcar_min) : 0 }

// ---------------------------------------------------------------- los días (borrador 2)
const s = (p, m, o = {}) => ({ p, m, ...o })
export const DIAS = [
  { id: 'D1', nombre: 'D1 · Fuego y mar: el sur volcánico', pasos: [
    s('montanas_del_fuego', 90, { fijo: '09:30', nota: 'turno de las 09:30' }),
    s('la_geria_y_sus_bodegas', 60, { nota: 'mirador de los hoyos de viña y parada corta en una bodega' }),
    s('bodega_la_geria', 75, { comida: true, nota: 'comida (La Cepa), hacia las 13:15' }),
    s('salinas_de_janubio', 20), s('playa_de_montana_bermeja', 15, { opc: true, nota: 'opcional' }), s('los_hervideros', 30),
    s('el_golfo_y_el_charco_de_los_clicos', 60, { sol: true, nota: 'hasta el atardecer' }),
    s('el_golfo_y_el_charco_de_los_clicos', 60, { cena: true, nota: 'cena en El Golfo' })] },
  { id: 'D1-volcanes', nombre: 'D1 · variante Volcanes (Volcán del Cuervo)', pasos: [
    s('montanas_del_fuego', 90, { fijo: '09:30' }), s('volcan_del_cuervo', 90), s('la_geria_y_sus_bodegas', 30, { nota: 'mirador, camino de la comida' }),
    s('bodega_la_geria', 75, { comida: true }), s('salinas_de_janubio', 20), s('los_hervideros', 30),
    s('el_golfo_y_el_charco_de_los_clicos', 60, { sol: true }), s('el_golfo_y_el_charco_de_los_clicos', 60, { cena: true })] },
  { id: 'D2', nombre: 'D2 · El norte de Manrique', pasos: [
    s('jameos_del_agua', 60, { abre: '10:00', ult: '17:15' }),
    s('cueva_de_los_verdes', 50, { fijo: '11:30', nota: 'turno de las 11:30 (⚠️ los turnos reales)' }),
    s('mirador_del_rio', 45, { ult: '16:40' }),
    s('haria_y_la_casa_museo_cesar_manrique', 75, { comida: true, nota: 'comida en Haría (Tacande), hacia las 13:45' }),
    s('haria_y_la_casa_museo_cesar_manrique', 90, { ult: '17:00', nota: 'pueblo y Casa-Museo (taquilla hasta las 17:00)' }),
    s('mirador_de_los_helechos', 15)] },
  { id: 'D2-sabado', nombre: 'D2 · sábado (mercado de Haría)', pasos: [
    s('jameos_del_agua', 60, { abre: '10:00' }), s('cueva_de_los_verdes', 50, { fijo: '11:30' }),
    s('haria_y_la_casa_museo_cesar_manrique', 75, { comida: true, nota: 'mercado y comida, hacia las 12:35 (el mercado cierra a las 14:30)' }),
    s('haria_y_la_casa_museo_cesar_manrique', 60, { ult: '17:00', nota: 'Casa-Museo hasta las ~15:50' }),
    s('mirador_del_rio', 45, { ult: '16:40', nota: 'hacia las 16:10, última entrada 16:40' })] },
  { id: 'D2-2dias', nombre: 'D2 · viaje de 2 días (con la Fundación)', pasos: [
    s('jameos_del_agua', 60, { abre: '10:00' }), s('cueva_de_los_verdes', 50, { fijo: '11:30' }), s('mirador_del_rio', 45, { ult: '16:40' }),
    s('haria_y_la_casa_museo_cesar_manrique', 75, { comida: true, nota: 'comida en Haría, sin Casa-Museo' }),
    s('fundacion_cesar_manrique', 90, { ult: '17:00', nota: 'entrar hacia las 16:00 (taquilla hasta las 17:00)' })] },
  { id: 'D2-cueva-primero', nombre: 'D2 · al revés (la Cueva a primera hora)', pasos: [
    s('cueva_de_los_verdes', 50, { fijo: '09:30' }), s('jameos_del_agua', 60, { abre: '10:00' }), s('mirador_del_rio', 45, { ult: '16:40' }),
    s('haria_y_la_casa_museo_cesar_manrique', 75, { comida: true }), s('haria_y_la_casa_museo_cesar_manrique', 90, { ult: '17:00' }),
    s('mirador_de_los_helechos', 15)] },
  { id: 'D2-viernes', nombre: 'D2 · viernes con Noches de Jameos (opcional)', pasos: [
    s('cueva_de_los_verdes', 50, { fijo: '09:30' }), s('mirador_del_rio', 45, { ult: '16:40' }),
    s('haria_y_la_casa_museo_cesar_manrique', 75, { comida: true }), s('haria_y_la_casa_museo_cesar_manrique', 90, { ult: '17:00' }),
    s('jameos_del_agua', 285, { fijo: '18:30', nota: 'visita al atardecer, cena (18:30-20:30) y concierto (22:30-23:15); se vuelve de noche' })] },
  { id: 'D3', nombre: 'D3 · Manrique en casa: Tahíche, Teguise y Arrecife', pasos: [
    s('fundacion_cesar_manrique', 90, { abre: '10:00', ult: '17:00' }),
    s('jardin_de_cactus', 60, { ult: '16:30' }),
    s('teguise', 75, { comida: true, nota: 'comida en Teguise (La Cantina), hacia las 13:00' }),
    s('teguise', 90, { nota: 'el casco y el Palacio Spínola por fuera' }),
    s('castillo_de_santa_barbara', 20, { opc: true, nota: 'opcional, por fuera' }), s('ciudad_estratificada_rofera_de_teseguite', 25, { opc: true, nota: 'opcional' }),
    s('casa_museo_del_campesino', 50, { ult: '17:10', nota: 'cierra a las 18:00' }),
    s('arrecife_charco_de_san_gines_y_el_paseo', 90, { nota: 'al caer la tarde, con las luces del Charco' }),
    s('arrecife_charco_de_san_gines_y_el_paseo', 75, { cena: true })] },
  { id: 'D3-domingo', nombre: 'D3 · domingo (mercadillo de Teguise)', domingo: true, pasos: [
    s('teguise', 120, { llegar: '10:00', nota: 'antes del gentío de las 11:00' }),
    s('teguise', 75, { comida: true, nota: 'comida en Teguise' }),
    s('jardin_de_cactus', 60, { ult: '16:30', nota: 'hacia las 14:30' }),
    s('fundacion_cesar_manrique', 90, { ult: '17:00', nota: 'hacia las 15:45, taquilla hasta las 17:00' }),
    s('arrecife_charco_de_san_gines_y_el_paseo', 60), s('arrecife_charco_de_san_gines_y_el_paseo', 75, { cena: true })] },
  { id: 'D3-arte', nombre: 'D3 · con Arte (LagOmar, sin el Castillo)', pasos: [
    s('fundacion_cesar_manrique', 90, { abre: '10:00', ult: '17:00' }), s('jardin_de_cactus', 60, { ult: '16:30' }),
    s('teguise', 75, { comida: true }), s('teguise', 90, { nota: 'hasta las 15:30' }),
    s('lagomar', 60, { ult: '17:00', nota: '⚠️ cierra a las 18:00' }), s('casa_museo_del_campesino', 50, { ult: '17:10' }),
    s('arrecife_charco_de_san_gines_y_el_paseo', 90), s('arrecife_charco_de_san_gines_y_el_paseo', 75, { cena: true })] },
  { id: 'D4', nombre: 'D4 · Papagayo y Playa Blanca', pasos: [
    s('playas_de_papagayo', 270, { abre: '09:00', nota: 'toda la mañana, pista de tierra y 3 € por coche' }),
    s('marina_rubicon', 75, { comida: true, nota: 'comida (Liken), hacia las 14:00' }),
    s('playa_blanca_y_el_faro_de_pechiguera', 60, { nota: 'paseo marítimo' }),
    s('faro_de_pechiguera', 60, { sol: true, nota: 'atardecer en el faro' }),
    s('marina_rubicon', 75, { cena: true, nota: 'cena en Marina Rubicón' })] },
  { id: 'D5', nombre: 'D5 · Volcanes y Famara', pasos: [
    s('volcan_del_cuervo', 90, { llegar: '09:00', nota: 'temprano, sin sombra' }),
    s('ermita_de_las_nieves', 30, { opc: true, nota: 'opcional' }),
    s('caleta_de_famara_y_playa_de_famara', 75, { comida: true, nota: 'comida (El Risco), hacia las 13:30' }),
    s('caleta_de_famara_y_playa_de_famara', 90, { nota: 'calles de arena y paseo por la playa' }),
    s('caleta_de_famara_y_playa_de_famara', 30, { sol: true, nota: 'atardecer' }),
    s('caleta_de_famara_y_playa_de_famara', 60, { cena: true })] },
  { id: 'DG', nombre: 'DG · La Graciosa (con coche hasta Órzola)', pasos: [
    s('orzola_puerto_de_la_graciosa', 450, { fijo: '10:00', nota: 'ferry de las 10:00; la última vuelta de La Graciosa sale a las 17:00 (invierno) y llega a Órzola hacia las 17:30' })] },
]

// ---------------------------------------------------------------- el cálculo de un día desde una zona
export function calcularDia(dia, zona) {
  const domingo = !!dia.domingo
  const pasos = dia.pasos
  const primero = pasos[0]
  const meta = primero.fijo ? hm(primero.fijo) - MARGEN_TURNO : primero.abre ? hm(primero.abre) : primero.llegar ? hm(primero.llegar) : hm('09:00')
  const ida = drive(zona, primero.p), ap0 = aparcar(primero.p, domingo)
  const salida = meta - ida - ap0
  let t = salida + ida + ap0, prev = primero.p, coche = ida, conAparcar = ida + ap0
  const lineas = [], avisos = []
  let esperas = 0
  pasos.forEach((st, i) => {
    let llegada = t
    if (i > 0) {
      const d = drive(prev, st.p), ap = prev === st.p ? 0 : aparcar(st.p, domingo)
      llegada = t + d + ap; coche += d; conAparcar += d + ap
      lineas.push({ tipo: 'coche', de: prev, a: st.p, min: d, km: km(prev, st.p) })
    }
    let entra = llegada
    if (st.fijo) {
      if (llegada > hm(st.fijo) - MARGEN_TURNO) avisos.push(`no llega a ${st.p}: llega a las ${fh(llegada)} y hay que estar a las ${fh(hm(st.fijo) - MARGEN_TURNO)} (turno de las ${st.fijo}); le faltan ${llegada - (hm(st.fijo) - MARGEN_TURNO)} min`)
      entra = Math.max(hm(st.fijo), llegada)
    }
    if (st.abre) entra = Math.max(entra, hm(st.abre))
    if (st.ult && entra > hm(st.ult)) avisos.push(`llega tarde a ${st.p}: entra a las ${fh(entra)} y la última entrada es a las ${st.ult}`)
    if (st.comida) { const d0 = st.desde ?? st.nota?.match(/hacia las (dd:dd)/)?.[1] ?? '13:00'; if (hm(d0) > entra) { esperas += hm(d0) - entra; entra = hm(d0) } }
    let fin = entra + st.m
    if (st.sol) { if (llegada > SOL) avisos.push(`llega a ${st.p} a las ${fh(llegada)}, después del atardecer (${fh(SOL)})`); fin = Math.max(fin, SOL + 5) }
    if (st.comida && entra > hm('15:00')) avisos.push(`la comida empieza a las ${fh(entra)}, pasadas las 15:00`)
    lineas.push({ tipo: 'parada', p: st.p, llegada, entra, fin, m: st.m, comida: !!st.comida, cena: !!st.cena, sol: !!st.sol, nota: st.nota || '' })
    t = fin; prev = st.p
  })
  const vuelta = drive(prev, zona)
  coche += vuelta; conAparcar += vuelta
  const regreso = t + vuelta
  if (coche > TOPE) avisos.push(`el coche suma ${dur(coche)}: pasa del tope de 3 h por ${coche - TOPE} min`)
  if (salida < hm('07:30')) avisos.push(`hay que salir a las ${fh(salida)}: muy temprano`)
  if (salida < hm('06:00')) avisos.push(`salir antes de las 06:00 no es razonable`)
  return { zona, esperas, salida, coche, conAparcar, vuelta, regreso, lineas, avisos, ida }
}

export const DIAS_TODOS = DIAS.flatMap((d) => (d.pasos.some((x) => x.opc) ? [d, { ...d, id: d.id + '-sin-opcionales', nombre: d.nombre + ' (sin los opcionales)', pasos: d.pasos.filter((x) => !x.opc) }] : [d]))

export function calcularTodo() {
  return DIAS_TODOS.map((d) => ({ id: d.id, nombre: d.nombre, zonas: Object.fromEntries(ZONAS.map(([z]) => [z, calcularDia(d, z)])) }))
}

// ---------------------------------------------------------------- el informe
const nom = (id) => park.get(id)?.nombre ?? id
function informe(res) {
  const out = []
  out.push('# Lanzarote · los días del borrador 2 medidos con Mapbox (LZ1, 3-nov-2026)\n')
  out.push('Cada día de `DIAS_CURADOS_LANZAROTE.md` se ha recorrido **desde las 6 zonas de alojamiento** con la tabla de coche de Mapbox (`data/pipeline_v2/travel/lanzarote_coche.json`, sin tráfico). **No se ha cambiado ningún día:** esto solo dice qué cabe y qué no.\n')
  out.push('**Cómo se ha medido.** El día empieza en el primer sitio: se sale de casa para llegar a su turno u hora de apertura (15 min antes en Timanfaya y la Cueva). A cada tramo se le suma el rato de aparcar de `_paradas.json`. Las visitas duran lo que dice `LANZAROTE_SITIOS.md`. «Coche» es solo conducir (ida, tramos y vuelta); el tope es 3 h. Invierno, atardecer a las 18:05. La comida debe empezar antes de las 15:00. Las horas son las de Canarias.\n')
  out.push('**Ojo con la precisión:** 12 de las 43 paradas llevan una coordenada aproximada (`verificar` en `_paradas.json`; sobre todo las bodegas de La Geria, Caletón Blanco, Las Grietas, la Ciudad Estratificada, los Helechos y la Marina Rubicón). Sirve para tiempos de ±3 minutos, no para guiar a nadie.\n')
  // resumen
  out.push('## Resumen\n')
  out.push('| Día | ' + ZONAS.map((z) => z[1]).join(' | ') + ' |')
  out.push('|---|' + ZONAS.map(() => '---').join('|') + '|')
  for (const d of res) {
    out.push(`| ${d.nombre} | ` + ZONAS.map(([z]) => { const r = d.zonas[z]; return `${dur(r.coche)}${r.avisos.length ? ' ⚠️' + r.avisos.length : ' ✅'}` }).join(' | ') + ' |')
  }
  out.push('\n✅ = cabe sin ningún aviso. ⚠️N = N avisos (abajo, en cada día).\n')
  for (const d of res) {
    out.push(`## ${d.nombre}\n`)
    const mejor = Object.values(d.zonas).sort((a, b) => a.coche - b.coche)
    const peor = mejor[mejor.length - 1], bueno = mejor[0]
    const zn = (z) => ZONAS.find((x) => x[0] === z)[1]
    const sin = Object.values(d.zonas).filter((r) => !r.avisos.length)
    if (sin.length === ZONAS.length) out.push(`**En sencillo:** cabe desde las 6 zonas. El coche va de ${dur(bueno.coche)} (${zn(bueno.zona)}) a ${dur(peor.coche)} (${zn(peor.zona)}).\n`)
    else if (!sin.length) out.push(`**En sencillo:** desde ninguna zona sale limpio. El coche va de ${dur(bueno.coche)} (${zn(bueno.zona)}) a ${dur(peor.coche)} (${zn(peor.zona)}).\n`)
    else out.push(`**En sencillo:** cabe sin avisos desde ${sin.map((r) => zn(r.zona)).join(', ')}; desde las demás hay avisos. El coche va de ${dur(bueno.coche)} (${zn(bueno.zona)}) a ${dur(peor.coche)} (${zn(peor.zona)}).\n`)
    out.push('| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |')
    out.push('|---|---|---|---|---|---|')
    for (const [z, n] of ZONAS) {
      const r = d.zonas[z]
      out.push(`| ${n} | ${fh(r.salida)} | ${dur(r.coche)} | ${dur(r.conAparcar)} | ${fh(r.regreso)} | ${r.avisos.length ? r.avisos.map((a) => a).join('; ') : '—'} |`)
    }
    // recorrido tipo: desde la zona más lejana
    const lej = peor
    out.push(`\nRecorrido desde ${zn(lej.zona)} (la zona con más coche):\n`)
    out.push(`- ${fh(lej.salida)} sales de casa (${lej.ida} min de coche hasta el primer sitio).`)
    for (const l of lej.lineas) {
      if (l.tipo === 'coche') { if (l.min > 0) out.push(`  - coche ${l.min} min (${l.km} km) a ${nom(l.a)}`) }
      else out.push(`- ${fh(l.llegada)} llegas a **${nom(l.p)}**${l.entra > l.llegada ? ` (entras a las ${fh(l.entra)})` : ''}; ${l.comida ? 'comida' : l.cena ? 'cena' : 'visita'} de ${dur(l.m)} hasta las ${fh(l.fin)}${l.nota ? ` (${l.nota})` : ''}.`)
    }
    out.push(`- ${fh(lej.regreso - lej.vuelta)} vuelves a casa: ${lej.vuelta} min de coche; llegas hacia las ${fh(lej.regreso)}.\n`)
  }
  return out
}

export function escribir() {
  const res = calcularTodo()
  const md = informe(res)
  return { res, md }
}

if (process.argv[1] && process.argv[1].endsWith('calcularDiasLanzarote.mjs')) {
  const { res, md } = escribir()
  writeFileSync(join(ROOT, 'data/dias/lanzarote/_dias_coche.json'), JSON.stringify(res.map((d) => ({ id: d.id, nombre: d.nombre, zonas: Object.fromEntries(Object.entries(d.zonas).map(([z, r]) => [z, { salida: fh(r.salida), coche_min: r.coche, con_aparcar_min: r.conAparcar, regreso: fh(r.regreso), avisos: r.avisos }])) })), null, 1) + '\n')
  writeFileSync(join(ROOT, 'docs/destinos/lanzarote/INFORME_DIAS_MAPBOX.md'), md.join('\n') + '\n')
  console.log('escrito; días:', res.length)
}
