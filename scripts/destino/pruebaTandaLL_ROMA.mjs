// La prueba de la Tanda LL, parte 2 (Roma): la hora útil, el día de llegada por franjas (F0 a F7), UN SOLO CAMINO, los grandes por la mañana y en días enteros, el día de vuelta (una sola cuenta) y la frase sin pase.
//   node scripts/destino/pruebaTandaLL_ROMA.mjs        (sin Chrome ni servidores: importa el motor directo, como pruebaTandaLL_LZ.mjs)
import fs from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { planEscenario, D, toMin, toHHMM, resumenDePlan } from './llegadaLib.mjs'
import { horaUtilMin, horaDeIrseMin, fraseLibreHacia } from '../../shared/arrival/horaUtil.js'
import { elegirUltimaManana } from '../../shared/routeEngine/vueltaDia.js'

let comprobaciones = 0
let fallos = 0
const debe = (cond, texto) => { comprobaciones++; if (!cond) { fallos++; if (fallos <= 80) console.log(`✗ ${texto}`) } }
const INFO = JSON.parse(fs.readFileSync('data/dias/roma/_llegada.json', 'utf8'))
const LISTAS = JSON.parse(fs.readFileSync('data/dias/roma/listas.json', 'utf8'))
const GRANDES = new Set(['Coliseo', 'Foro Romano y Palatino', 'Museos Vaticanos y Capilla Sixtina', 'Galería Borghese'])
const ZONAS = ['centro', 'plaza_de_espana', 'prati', 'trastevere', 'termini', 'monti']
const llegada = (hora, punto = 'fco', zona = 'centro', medio = 'avion') => ({ hora, medio, puntoId: punto, zona })
const hm = (min) => toHHMM(((min % 1440) + 1440) % 1440)
const base = { city: 'Roma', scheduler: 'v3', engine: 'v4' }
const dia1De = (plan) => plan.days.find((d) => d.curatedDay)
const filasDe = (d) => (d.escritoRows ?? []).filter((r) => !r.llegada)
const esGrandeDentro = (r) => r.tipo === 'parada' && GRANDES.has(r.lugar) && r.modo !== 'fuera' && r.modo !== 'camino' && (r.min ?? 0) >= 45

// ── 1. LA HORA ÚTIL: aterrizas + 45 + trayecto a la zona + 60 ──
{
  const util = (c) => horaUtilMin({ info: INFO, instalarseMin: 60, ...c })
  debe(hm(util({ medio: 'avion', puntoId: 'fco', zona: 'centro', aterrizaMin: toMin('09:00') }).min) === '11:55', 'Fiumicino, Centro, 9:00 → 11:55 (45 + 70 + 60)')
  debe(hm(util({ medio: 'avion', puntoId: 'cia', zona: 'centro', aterrizaMin: toMin('09:00') }).min) === '11:50', 'Ciampino, Centro, 9:00 → 11:50 (45 + 65 + 60)')
  debe(hm(util({ medio: 'avion', puntoId: 'fco', zona: 'trastevere', aterrizaMin: toMin('09:00') }).min) === '11:45', 'Fiumicino, Trastevere, 9:00 → 11:45')
  debe(hm(util({ medio: 'avion', puntoId: 'cia', zona: 'trastevere', aterrizaMin: toMin('09:00') }).min) === '12:00', 'Ciampino, Trastevere, 9:00 → 12:00')
  debe(util({ medio: 'avion', puntoId: 'fco', zona: 'nose', aterrizaMin: 600 }).min === util({ medio: 'avion', puntoId: 'fco', zona: 'centro', aterrizaMin: 600 }).min, '«Aún no lo sé» cuenta como el Centro')
  debe(util({ medio: 'avion', puntoId: 'fco', zona: null, aterrizaMin: 600 }).min === util({ medio: 'avion', puntoId: 'fco', zona: 'centro', aterrizaMin: 600 }).min, 'sin zona cuenta como el Centro')
  debe(hm(util({ medio: 'tren', puntoId: 'termini', zona: 'centro', aterrizaMin: toMin('10:00') }).min) === '11:35', 'tren a Termini, Centro, 10:00 → 11:35 (10 + 25 + 60)')
  debe(hm(util({ medio: 'ferry', puntoId: 'civitavecchia', zona: 'prati', aterrizaMin: toMin('08:00') }).min) === '11:15', 'barco a Civitavecchia, Prati, 8:00 → 11:15 (45 + 90 + 60)')
  for (const aterriza of ['09:00', '14:30', '20:00']) for (const [punto, zona] of [['fco', 'centro'], ['cia', 'prati'], ['fco', 'trastevere']]) {
    const esperado = util({ medio: 'avion', puntoId: punto, zona, aterrizaMin: toMin(aterriza) }).min
    const plan = planEscenario({ n: 3, inicio: '2027-06-10' }, { llegada: llegada(aterriza, punto, zona) })
    debe(plan?.llegada?.interno?.horaUtilMin === esperado, `el motor usa la misma cuenta: ${aterriza} ${punto} ${zona} → ${hm(esperado)} (sale ${plan?.llegada?.interno?.horaUtilMin})`)
  }
  debe(!('libre_extra_min' in D.destination_config.llegada) && D.destination_config.llegada.instalarse_min === 60, 'el destino tiene instalarse_min: 60 y ya no libre_extra_min')
  debe(fraseLibreHacia(toMin('17:25')) === 'Con tu vuelo estarás libre hacia las 17:25' && fraseLibreHacia(toMin('17:30')) === 'Con tu vuelo estarás libre hacia las 17:30', 'frase sin pase: «Con tu vuelo estarás libre hacia las HH:MM»')
  debe(fraseLibreHacia(24 * 60 + 10) === null, 'sin frase si la hora útil pasa de la medianoche')
}

// ── 2. LAS FRANJAS: cada hora útil cae en su fila (Fiumicino, Centro: aterrizas = hora útil − 2 h 55) ──
{
  const franjas = [['09:30', '00:00', 'D1'], ['09:35', '09:31', 'D1-centro-entera-navona'], ['12:00', '09:31', 'D1-centro-entera-navona'], ['12:05', '12:01', 'D1-centro-navona'], ['15:00', '12:01', 'D1-centro-navona'], ['15:05', '15:01', 'D1-centro-navona'],
    ['18:00', '15:01', 'D1-centro-navona'], ['18:05', '18:01', 'D1-anochecer-navona'], ['20:00', '18:01', 'D1-anochecer-navona'], ['20:05', '20:01', 'D1-noche-navona'], ['21:30', '20:01', 'D1-noche-navona'],
    ['21:35', '21:31', 'D1-noche-sin-cena-navona'], ['23:00', '21:31', 'D1-noche-sin-cena-navona'], ['23:05', '23:01', 'D1-sin-ruta']]
  for (const inicio of ['2027-06-10', '2027-01-14']) {
    for (const [util, desde, lista] of franjas) {
      const aterriza = hm(toMin(util) - 175)
      const plan = planEscenario({ n: 3, inicio }, { llegada: llegada(aterriza) })
      const d1 = plan ? dia1De(plan) : null
      debe(plan?.llegada?.fila?.desde === desde, `${inicio}: hora útil ${util} (aterrizas ${aterriza}) → la fila empieza a las ${desde} (sale ${plan?.llegada?.fila?.desde})`)
      if (lista === 'D1') debe(plan?.llegada?.caso === 'd1_de_siempre' && !plan.llegada.pasa_al_dia_2, `${inicio}: hora útil ${util}: día entero normal (F0)`)
      else debe(d1?.curatedDay?.id === lista && plan.llegada.pasa_al_dia_2 === true, `${inicio}: hora útil ${util}: el día 1 es ${lista} y el D1 pasa al día 2 (es ${d1?.curatedDay?.id})`)
    }
  }
  // De madrugada (0:00 a 4:59): día entero normal, también con hora útil de otra fila.
  for (const h of ['00:30', '04:59']) { const plan = planEscenario({ n: 3, inicio: '2027-06-10' }, { llegada: llegada(h) }); debe(plan?.llegada?.caso === 'madrugada' || plan?.llegada?.caso === 'd1_de_siempre', `aterrizas a las ${h}: día entero normal (${plan?.llegada?.caso})`) }
  // «La rápida», «de tarde» y «Coliseo por la tarde» ya no existen en las tablas de llegada.
  const ids = new Set(Object.values(LISTAS.llegadas.dia1).flatMap((tabla) => tabla.flatMap((f) => f.listas.map((l) => l.lista))))
  debe(![...ids].some((id) => /rapido|D1-tarde/.test(id)) && !Object.values(LISTAS.llegadas.dia1).flat().some((f) => f.listas.some((l) => l.variante === 'coliseo_tarde')), 'fuera «la rápida», «de tarde» y la versión «Coliseo por la tarde» de las tablas de llegada')
  debe(!LISTAS.dias['D1-rapido'] && !LISTAS.dias['D1-tarde'] && !LISTAS.dias['D1-rapido-invierno-10'], 'las listas D1-rapido y D1-tarde ya no existen')
}

// ── 3. LA MATRIZ: 5 horas × 2 aeropuertos × verano e invierno × martes y jueves ──
const HORAS = ['09:00', '11:30', '14:30', '17:00', '20:00']
const INICIOS = [['verano · martes', '2027-06-08'], ['verano · jueves', '2027-06-10'], ['invierno · martes', '2027-01-12'], ['invierno · jueves', '2027-01-14']]
const proyeccion = (generado) => JSON.stringify({ stops: (generado?.stops ?? []).map((s) => [s.name, s.suggested_time, s.duration_minutes]), meals: (generado?.meals ?? []).map((m) => [m.time ?? m.type, m.suggested_time ?? m.start ?? null, m.restaurant ?? m.name ?? null]), spare: (generado?.spare_stops ?? []).map((s) => s.name), title: generado?.title ?? null })
const idsSinVuelo = new Map()
for (const [etq0, inicio] of INICIOS) {
  const sin = planEscenario({ n: 3, inicio })
  idsSinVuelo.set(inicio, sin.days.filter((d) => d.curatedDay).map((d) => d.curatedDay.id))
}
const nocheDe = (d) => (d.escritoNights ?? []).map((x) => x.name)
for (const [etq0, inicio] of INICIOS) {
  for (const punto of ['fco', 'cia']) {
    for (const hora of HORAS) {
      const etq = `${etq0} · ${punto} · aterrizas ${hora}`
      const ll = llegada(hora, punto)
      const util = horaUtilMin({ info: INFO, medio: 'avion', puntoId: punto, zona: 'centro', aterrizaMin: toMin(hora) }).min
      const A = planEscenario({ n: 3, inicio }, { llegada: ll })
      const B = planEscenario({ n: 3, inicio }, { llegada: ll, forceOrder: idsSinVuelo.get(inicio) })
      debe(Boolean(A && B), `${etq}: sin plan`)
      if (!A || !B) continue
      const idsA = A.days.filter((d) => d.curatedDay).map((d) => d.curatedDay.id)
      const idsB = B.days.filter((d) => d.curatedDay).map((d) => d.curatedDay.id)
      // UN SOLO CAMINO (1): viaje entero con vuelo = rehacer un día suelto con el orden que el viajero ya ve (force_order)
      debe(idsA[0] === idsB[0], `${etq}: viaje entero (${idsA[0]}) y día suelto con force_order (${idsB[0]}) no dan el mismo día 1`)
      debe(JSON.stringify(resumenDePlan({ ...A, days: [dia1De(A)] }).dias) === JSON.stringify(resumenDePlan({ ...B, days: [dia1De(B)] }).dias), `${etq}: el día 1 es distinto en los dos caminos`)
      debe([...idsA].sort().join() === [...idsB].sort().join(), `${etq}: los días del viaje son otros con force_order (${idsA.join()} / ${idsB.join()})`)
      // UN SOLO CAMINO (2): lo que devuelve el servidor para el día 1 (buildDayBlockV3, lo que usa /api/rebuild-day y ahora /api/adaptar-dia-vuelo)
      const sA = await buildDayBlockV3(D, 4, false, 1, null, inicio, [], [], { ...base, llegada: ll })
      const sB = await buildDayBlockV3(D, 4, false, 1, null, inicio, [], [], { ...base, llegada: ll, forceOrder: idsSinVuelo.get(inicio) })
      debe(proyeccion(sA) === proyeccion(sB), `${etq}: el día 1 del servidor cambia con force_order`)
      debe(sA?.arrival_day?.es_dia_1 === true && (sA.arrival_day.lista ?? '').length > 0, `${etq}: el servidor no marca el día de llegada`)
      // El día de llegada
      const d1 = dia1De(A)
      const rows = filasDe(d1)
      const sinPasa = !A.llegada.pasa_al_dia_2
      const hayAlgo = rows.length > 0 || nocheDe(d1).length > 0 || (A.llegada.dia1?.texto ?? '').length > 0
      debe(hayAlgo, `${etq}: el día de llegada está vacío`)
      // (La noche tiene su hora límite —en invierno acaba antes—: con la hora útil pasadas las 22:30 ya no cabe ni el paseo y el día lleva solo su texto.)
      if (util <= 22 * 60 + 30) debe(rows.some((r) => ['parada', 'cena', 'comida', 'tour'].includes(r.tipo)) || nocheDe(d1).length > 0, `${etq}: hora útil ${hm(util)} y el día de llegada sin nada`)
      if (!sinPasa) {
        debe(!rows.some(esGrandeDentro), `${etq}: un grande por dentro el día de llegada (${rows.filter(esGrandeDentro).map((r) => r.lugar).join()})`)
        debe(!rows.some((r) => GRANDES.has(r.lugar) && r.modo !== 'fuera' && r.modo !== 'camino'), `${etq}: un grande el día de llegada`)
        debe(!nocheDe(d1).includes('Coliseo (noche)') || util < 20 * 60 + 1, `${etq}: el Coliseo de noche el día de llegada con hora útil ${hm(util)}`)
        // El Coliseo a las 23:10 con el texto de Trevi: en F5 a F7 no hay Coliseo ni de día ni de noche.
        if (util > 20 * 60) debe(!nocheDe(d1).some((n) => /Coliseo|Foro/.test(n)) && !rows.some((r) => /Coliseo|Foro/.test(r.lugar ?? '')), `${etq}: el día de llegada de noche lleva Coliseo o Foro`)
        // la nocturna escrita no sale antes de que esté libre; la cena tampoco
        for (const n of d1.escritoNights ?? []) debe(n.fixedStart >= util - 5, `${etq}: la nocturna ${n.name} a las ${hm(n.fixedStart)} es antes de la hora útil ${hm(util)}`)
        const cena = rows.find((r) => r.tipo === 'cena')
        if (cena) debe(toMin(cena.hora) >= util - 5, `${etq}: la cena a las ${cena.hora} es antes de la hora útil ${hm(util)}`)
        // el último día de ruta se cae (con 3 días de ruta) y su parte ligera va en el día de llegada
        debe(A.llegada.dia_caido?.id != null, `${etq}: con la llegada de las ${hm(util)} no se cae el último día`)
        for (const r of rows.filter((x) => x.tipo === 'parada' && x.modo !== 'camino')) debe(!(r.hora && toMin(r.hora) < util - 5), `${etq}: ${r.lugar} a las ${r.hora}, antes de la hora útil ${hm(util)}`)
      } else {
        debe(util <= 9 * 60 + 30, `${etq}: día entero con hora útil ${hm(util)}`)
      }
      // Los grandes de los demás días van por la mañana (excepto el Free Tour y D1-vaticano, que aquí no salen)
      for (const d of A.days.filter((x) => x.curatedDay && x !== d1)) for (const r of filasDe(d).filter(esGrandeDentro)) debe(toMin(r.hora) < 13 * 60, `${etq}: ${r.lugar} el día ${d.dayNumber} a las ${r.hora} (los grandes empiezan antes de las 13:00)`)
    }
  }
}

// ── 4. LAS CINCO ZONAS: cada una con su ruta y su noche ──
{
  const NOCHE_DE_ZONA = { trastevere: 'Trastevere de noche', prati: "El Puente y el Castillo de Sant'Angelo (noche)" }
  const INICIO_POR_ZONA = LISTAS.llegadas.inicio_por_zona
  for (const zona of [...ZONAS, 'nose']) {
    for (const hora of ['09:00', '11:30', '14:30', '17:00', '20:00']) {
      const plan = planEscenario({ n: 3, inicio: '2027-06-10' }, { llegada: llegada(hora, 'fco', zona) })
      const d1 = plan ? dia1De(plan) : null
      const etq = `zona ${zona} · ${hora}`
      debe(Boolean(d1), `${etq}: sin plan`)
      if (!d1) continue
      const id = d1.curatedDay.id
      debe(id.endsWith(`-${INICIO_POR_ZONA[zona] === 'plaza_de_espana' ? 'espana' : INICIO_POR_ZONA[zona]}`) || id === 'D1' || id === 'D1-sin-ruta', `${etq}: la lista ${id} no es de su zona (${INICIO_POR_ZONA[zona]})`)
      debe(nocheDe(d1).length <= 1 && !nocheDe(d1).some((n) => /Coliseo/.test(n)), `${etq}: más de una nocturna o el Coliseo (${nocheDe(d1).join()})`)
      if (NOCHE_DE_ZONA[zona] && id.startsWith('D1-') && id !== 'D1-sin-ruta' && nocheDe(d1).length) debe(nocheDe(d1)[0] === NOCHE_DE_ZONA[zona] || zona === 'prati' && hora === '09:00', `${etq}: la noche debería ser ${NOCHE_DE_ZONA[zona]} y es ${nocheDe(d1)[0]}`)
    }
  }
  // La Trastevere y Prati no repiten la ruta del centro: las tres nuevas tienen su propia lista y su propio primer sitio.
  const primer = (id) => LISTAS.dias[id].partes.unica.tarde[0]?.lugar ?? LISTAS.dias[id].partes.unica.manana[0]?.lugar
  debe(primer('D1-centro-trastevere') === 'Plaza Trilussa' && primer('D1-centro-prati') === "Castillo de Sant'Angelo" && primer('D1-centro-monti') === 'Basílica de Santa María la Mayor', 'las rutas nuevas empiezan donde duerme el viajero')
}

// ── 5. LOS GRANDES: por la mañana y en días enteros; la Basílica sola NO es grande ──
{
  const sitios = D.sitios_grandes.lugares.map((s) => s.nombre)
  debe(['Coliseo', 'Museos Vaticanos y Capilla Sixtina', 'Galería Borghese'].every((n) => sitios.includes(n)) && !sitios.includes('Basílica de San Pedro'), 'los grandes de Roma: Coliseo (con el Foro), Museos Vaticanos y Galería Borghese; la Basílica sola no')
  // viajes con un solo día entero (2 noches con llegada tarde): D1-vaticano, la excepción (dos grandes ese día)
  const dos = planEscenario({ n: 2, inicio: '2027-06-10' }, { llegada: llegada('11:30') })
  debe(dos?.days.some((d) => d.curatedDay?.id === 'D1-vaticano'), '2 noches con llegada de las 11:30: el día 2 es D1-vaticano (un solo día entero: puede llevar dos grandes)')
  const uno = planEscenario({ n: 1, inicio: '2027-06-10' }, { llegada: llegada('11:30') })
  debe(uno && !filasDe(dia1De(uno)).some(esGrandeDentro), '1 noche con llegada de las 11:30: el día 1 no lleva grandes (van a «Si te sobra tiempo»)')
  // una reserva del viajero manda siempre
  const reserva = planEscenario({ n: 3, inicio: '2027-06-10', reservasGrandes: [{ name: 'Coliseo', dayNumber: 1, dateIso: '2027-06-10', time: '16:00' }], entradas: { Coliseo: '16:00' } }, { llegada: llegada('09:00') })
  debe(reserva && filasDe(dia1De(reserva)).some((r) => r.lugar === 'Coliseo'), 'una reserva del Coliseo el día de llegada manda: se queda y no se quita')
  debe((reserva?.llegada?.avisos ?? []).every((a) => a.tipo !== 'x') && Array.isArray(reserva?.llegada?.avisos), 'con la reserva, los avisos viajan (nunca se quita)')
}

// ── 6. LA VUELTA: una sola cuenta, filas por la hora de irse, sin grandes por dentro y paradas ligeras hasta irse ──
{
  const irse = (vuelo, punto = 'fco', zona = 'centro', medio = 'avion') => horaDeIrseMin({ info: INFO, medio, puntoId: punto, zona, vueloMin: toMin(vuelo) })
  debe(hm(irse('18:00').irseMin) === '14:20' && irse('18:00').margenMin === 220, 'Fiumicino, Centro, vuelo 18:00 → irse a las 14:20 (3 h 40 antes)')
  debe(hm(irse('18:00', 'cia', 'centro').irseMin) === '14:25', 'Ciampino, Centro, 18:00 → 14:25 (2 h + 65 + 30)')
  debe(hm(irse('18:00', 'fco', 'trastevere').irseMin) === '14:30', 'Fiumicino, Trastevere, 18:00 → 14:30')
  debe(hm(irse('12:00', 'termini', 'centro', 'tren').irseMin) === '10:35', 'tren desde Termini, Centro, 12:00 → 10:35 (30 + 25 + 30)')
  const FILAS = [['antes de 2:00', 0, 119], ['2:00-5:59', 120, 359], ['6:00-9:59', 360, 599], ['10:00-11:29', 600, 689], ['11:30-13:59', 690, 839], ['14:00 o más', 840, 2000]]
  const filaEsperada = (irseMin) => (irseMin < 0 ? 0 : FILAS.findIndex(([, a, b]) => irseMin >= a && irseMin <= b))
  const LLEVA = ['solo_traslado', 'solo_traslado', 'solo_traslado', 'manana_corta', 'manana_sin_comida', 'manana_con_comida']
  const GRANDES_VUELTA = GRANDES
  for (const [etq0, inicio] of [['verano', '2027-06-10'], ['invierno', '2027-01-14']]) {
    for (const zona of ['centro', 'prati', 'trastevere', 'monti']) {
      for (const vuelo of ['04:00', '08:00', '11:00', '13:30', '15:30', '17:30', '18:50', '19:00', '21:00', '23:30']) {
        const etq = `vuelta ${etq0} · ${zona} · vuelo ${vuelo}`
        const plan = planEscenario({ n: 3, inicio }, { vuelta: { hora: vuelo, modo: 'flight', puntoId: 'fco', zona } })
        const v = plan?.vuelta
        debe(Boolean(v), `${etq}: sin vuelta`)
        if (!v) continue
        const c = irse(vuelo, 'fco', zona)
        debe(v.interno?.irseMin === c.irseMin, `${etq}: el motor irse ${v.interno?.irseMin} y la función compartida ${c.irseMin} no dicen lo mismo`)
        const esperada = toMin(vuelo) >= 19 * 60 ? 'dia_mas' : LLEVA[filaEsperada(c.irseMin)]
        debe(v.lleva === esperada, `${etq}: irse a las ${hm(c.irseMin)} debería llevar ${esperada} y lleva ${v.lleva}`)
        const filasVuelta = (v.diaPlan?.escritoRows ?? []).filter((r) => !r.llegada)
        // hora límite: lo que sale de paradas acaba antes de la hora de irse
        for (const r of filasVuelta.filter((x) => ['parada', 'comida'].includes(x.tipo))) debe(toMin(r.hora) + (r.min ?? 0) <= c.irseMin + 5 || r.modo === 'camino', `${etq}: ${r.lugar ?? r.restaurante} acaba a las ${hm(toMin(r.hora) + (r.min ?? 0))}, después de la hora de irse (${hm(c.irseMin)})`)
        if (toMin(vuelo) < 19 * 60) debe(!filasVuelta.some(esGrandeDentro), `${etq}: un grande por dentro en la última mañana (${filasVuelta.filter(esGrandeDentro).map((r) => r.lugar).join()})`)
        else debe(v.diaMas != null || v.manana != null, `${etq}: el vuelo desde las 19:00 cuenta como día entero`)
        if (v.lleva === 'manana_con_comida') debe(v.tardeLibre == null || v.paradasHastaIrte === 0, `${etq}: «tarde libre» con paradas ligeras que caben`)
        if (v.lleva === 'solo_traslado') debe(filasVuelta.length === 0 && v.tarjeta != null, `${etq}: sin paradas y sin la tarjeta`)
        else if (v.lleva !== 'dia_mas') debe(filasVuelta.length > 0, `${etq}: ${v.lleva} sin paradas`)
        if (v.lleva === 'manana_corta') debe(filasVuelta.filter((r) => r.tipo === 'parada').length <= 5, `${etq}: la mañana corta lleva demasiadas paradas`)
      }
    }
  }
  // la última mañana: lo más cercano a la zona entre lo no visto
  const manana = (zona) => planEscenario({ n: 2, inicio: '2027-06-10' }, { vuelta: { hora: '15:30', modo: 'flight', puntoId: 'fco', zona } })?.vuelta?.manana?.lista
  debe(manana('prati') !== manana('trastevere') || manana('prati') !== manana('monti'), `la última mañana depende de la zona (prati: ${manana('prati')}, trastevere: ${manana('trastevere')}, monti: ${manana('monti')})`)
  debe(/vaticano|cupula/i.test(String(manana('prati'))), `desde Prati, la última mañana es la del Vaticano o la Cúpula (${manana('prati')})`)
  {
    // la función pura, sin nada visto: lo más cercano a la zona
    const coord = (n) => D.places.find((p) => p.name === n).coordinates
    const zonaC = (id) => { const c = D.destination_config.zonas_alojamiento.find((z) => z.id === id).coordinates; return [c.lat, c.lng] }
    const m = (a, b) => Math.hypot((a[0] - b[0]) * 111000, (a[1] - b[1]) * 82000)
    const dist = (zona) => (fila) => { const ps = (fila.lo_principal ?? []).map(coord); if (!ps.length) return null; return m(zonaC(zona), [ps.reduce((s, c) => s + c[0], 0) / ps.length, ps.reduce((s, c) => s + c[1], 0) / ps.length]) }
    const escribe = { days: Object.fromEntries(LISTAS.llegadas.ultimas_mananas.filter((f) => f.lista).map((f) => [f.lista, { id: f.lista }])) }
    const elige = (zona) => elegirUltimaManana({ ultimas: LISTAS.llegadas.ultimas_mananas, vistos: new Set(), written: escribe, weekday: 'jueves', dateIso: '2027-06-10', distancia: dist(zona) }).fila?.lista
    debe(elige('monti') === 'D1', `sin nada visto, desde Monti la última mañana es la de la Roma antigua (${elige('monti')})`)
    debe(['D0-medio', 'D6'].includes(elige('prati')), `sin nada visto, desde Prati es la del Vaticano (${elige('prati')})`)
    debe(elige('plaza_de_espana') === 'DT-medio', `sin nada visto, desde la Plaza de España es la del Pincio y el Popolo (${elige('plaza_de_espana')})`)
  }
  // las listas de la última mañana no llevan ningún grande por dentro
  for (const id of Object.keys(LISTAS.dias).filter((x) => /^(DC|DS|DCC)-/.test(x))) {
    const paradas = Object.values(LISTAS.dias[id].partes).flatMap((p) => [...p.manana, ...p.tarde])
    debe(!paradas.some((s) => GRANDES_VUELTA.has(s.lugar) && s.modo === 'dentro'), `${id}: lleva un grande por dentro`)
  }
}

// ── 7. SIN PASE: la tarjeta informa, sin mover nada ──
{
  const sin = planEscenario({ n: 3, inicio: '2027-06-10' })
  const conPagoApagado = planEscenario({ n: 3, inicio: '2027-06-10' }, { llegada: { ...llegada('14:30'), pago: false } })
  debe(JSON.stringify(resumenDePlan(conPagoApagado)) === JSON.stringify(resumenDePlan(sin)), 'sin pase la llegada no mueve nada')
  const u = horaUtilMin({ info: INFO, medio: 'avion', puntoId: 'fco', zona: null, aterrizaMin: toMin('14:30') }).min
  debe(fraseLibreHacia(u) === 'Con tu vuelo estarás libre hacia las 17:25', `la frase de la tarjeta de llegada sin pase (${fraseLibreHacia(u)})`)
}

// ── 8. EL FREE TOUR DEL DÍA 1 con la hora útil (antes → ahora en la prueba de la Tanda 7) ──
{
  const caso = (ft, hora, zona = 'centro') => planEscenario({ n: 3, inicio: '2027-06-10', ft }, { llegada: llegada(hora, 'fco', zona) })?.llegada?.caso
  // (Free Tour de las 12:00 con su entrada: entero si la hora útil es antes de las 11:30; solo la parte del tour si está libre al menos 30 min antes; si no, ya ha empezado.)
  debe(/entero/.test(caso('12:00', '08:30')), `Free Tour 12:00, aterrizas 8:30 (útil 11:25): el D3 entero (${caso('12:00', '08:30')})`)
  debe(/solo_la_parte_del_tour/.test(caso('12:00', '08:35')), `Free Tour 12:00, aterrizas 8:35 (útil 11:30): solo la parte del tour (${caso('12:00', '08:35')})`)
  debe(/ya_empezado/.test(caso('12:00', '08:40')), `Free Tour 12:00, aterrizas 8:40 (útil 11:35): el tour ya ha empezado (${caso('12:00', '08:40')})`)
  debe(/solo_la_parte_del_tour/.test(caso('17:00', '09:00')), `Free Tour 17:00, aterrizas 9:00 (útil 11:55): solo la parte del tour (${caso('17:00', '09:00')})`)
  debe(/entero/.test(caso('17:00', '05:30')) || /entero/.test(caso('17:00', '04:30')), `Free Tour 17:00, aterrizas pronto: el D3 entero (${caso('17:00', '05:30')})`)
  // el Free Tour del día 1 nunca lleva el Coliseo de noche con el texto de Trevi
  const p = planEscenario({ n: 3, inicio: '2027-06-10', ft: '17:00' }, { llegada: llegada('09:00') })
  debe(p && !nocheDe(dia1De(p)).some((n) => /Coliseo/.test(n)), 'la parte del Free Tour: su noche es la escrita (Trevi), no el Coliseo')
}

// ── 9. UN SOLO CAMINO en el servidor: «Sí, adaptarlos» delega en el mismo motor que rehacer un día ──
{
  const server = fs.readFileSync('server/index.js', 'utf8')
  debe(/const reconstruirDia = async \(req, res\)/.test(server) && /app\.post\('\/api\/rebuild-day', reconstruirDia\)/.test(server), '/api/rebuild-day es el manejador `reconstruirDia`')
  debe(/numeroDia === 1 \|\| numeroDia > b\.all_days\.length\)\) return reconstruirDia\(req, res\)/.test(server), '/api/adaptar-dia-vuelo delega en `reconstruirDia` para el primer día y el de vuelta')
  const adaptar = fs.readFileSync('shared/routeEngine/adaptarDiaVuelo.js', 'utf8')
  debe(/Nunca añade|nunca se pierde ni se añade/.test(adaptar), 'el recorte sigue solo para los días de en medio')
}

console.log(`${comprobaciones} comprobaciones · ${fallos} fallos`)
process.exit(fallos > 0 ? 1 : 0)
