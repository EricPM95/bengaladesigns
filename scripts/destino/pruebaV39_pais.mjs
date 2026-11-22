// V39 (parte A): «TU PAÍS». Prueba SIN navegador, con el motor de logros de verdad (server/logros/motor.js) y las pantallas del servidor (momentos, ficha).
//   node scripts/destino/pruebaV39_pais.mjs
// Comprueba que quien viaja a un destino de SU país recibe «Turista en tu país» (y «Destino nuevo»), no «País nuevo»; que España cuenta en el pasaporte; que quien contestó «¿En qué país vives?» no
// se pisa con el origen de un viaje; que quien lo saltó se mira viaje a viaje por su origen; que lo ya ganado se conserva; y que la ficha nunca dice 0 ni «te falta» para lo conseguido.
// Madrid, Barcelona y Cancún no son destinos de la app todavía: aquí se montan como copias de Lanzarote (con su país) para probar la regla con cualquier país.
import { cargarDatos } from '../../server/logros/datos.js'
import { calcular, diferencia, hechosQueCuentan, nombreDePaisIso, paisDeLaPersona } from '../../server/logros/motor.js'
import { armarMomentos } from '../../server/logros/momentos.js'
import { construirGanados } from '../../server/logros/pantallas/ganados.js'
import { crearServicioLogros, contextoDeViaje } from '../../server/logros/servicio.js'
import { pasaporte } from '../../server/logros/vistas.js'
import { expDeItem } from '../../server/logros/exp.js'
import { dondeViven, paisDeVive } from '../../server/panel/calculosPersonas.js'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}

/* ───────── Los datos: los de verdad + Madrid, Barcelona (España) y Cancún (México) como copias de Lanzarote ───────── */
const real = cargarDatos()
function conCopias() {
  const datos = { ...real, destinos: { ...real.destinos } }
  const copia = (clave, ciudad, pais) => {
    const base = real.destinos.lanzarote
    const sitios = Object.fromEntries(Object.entries(base.sitios).map(([id, s]) => [id, { ...s, pais }]))
    datos.destinos[clave] = { ...base, clave, ciudad, destino: ciudad, pais_defecto: pais, sitios, anadido: '2026-11-05' }
  }
  copia('madrid', 'Madrid', 'España')
  copia('barcelona', 'Barcelona', 'España')
  copia('cancun', 'Cancún', 'México')
  return datos
}
const datos = conCopias()
const primerSitio = (destino) => Object.keys(datos.destinos[destino].sitios)[0]

/**
 * Una persona: `paisVive` (lo que contestó, o null) y sus viajes [{ destino, origen_iso }] (uno detrás de otro, cada uno en su semana). Da lo que gana con cada viaje, uno a uno:
 * [{ destino, items, nuevos (los momentos que saldrían en pantalla) }], y el total.
 */
function vivir({ paisVive = null, viajes: lista, guardado = new Map() }) {
  const hechos = []
  const viajes = {}
  const pasos = []
  let antes = guardado
  lista.forEach((v, i) => {
    const id = `t${i + 1}`
    const inicio = `2026-12-${String(1 + i * 6).padStart(2, '0')}`
    const fin = `2026-12-${String(4 + i * 6).padStart(2, '0')}`
    viajes[id] = { id, destino: v.destino, inicio, fin, con_quien: null, dias: [], origen_pais: nombreDePaisIso(v.origen_iso), origen_iso: v.origen_iso ?? null }
    hechos.push({ id: `h${i}`, tipo: 'visto', trip_id: id, destino: v.destino, sitio: primerSitio(v.destino), stop_id: `s${i}`, instante: `${inicio}T11:00:00Z`, ubic: 'cerca', valido: true, recibido_en: `${inicio}T20:00:00Z` })
    const despues = calcular({ datos, hechos, viajes, cuenta: { alta_cuenta: '2026-10-01T00:00:00Z' }, ahora: '2027-01-30T10:00:00Z', pais_vive: paisVive })
    const nuevos = diferencia(antes, despues, datos.ajustes)
    const momentos = armarMomentos({ datos, nuevos, despues, antes, ultimaFrase: null, azar: () => 0, viajes })
    pasos.push({ destino: v.destino, items: despues, nuevos, momentos })
    antes = despues
  })
  return { pasos, items: antes, hechos, viajes }
}
const tiene = (items, logro, escalon = null) => [...items.values()].some((it) => it.logro === logro && (escalon == null || String(it.escalon) === String(escalon)))
const nombres = (momentos) => momentos.map((m) => m.nombre)
const hayPais = (momentos) => momentos.some((m) => m.tipo === 'pais')
const turista = (momentos) => momentos.find((m) => m.tipo === 'viajero' && m.logro === 'viajero_nacional' && String(m.escalon) === '1')

/* ───────── 1. Contestó que vive en España y va a Madrid ───────── */
console.log('1. Vive en España (contestado) y va a Madrid')
{
  const p = vivir({ paisVive: 'ES', viajes: [{ destino: 'madrid', origen_iso: 'ES' }] })
  const m = p.pasos[0].momentos
  debe(Boolean(turista(m)) && turista(m).nombre === 'Turista en tu país', 'turista', `recibe «Turista en tu país» (${nombres(m).join(' | ')})`)
  debe(turista(m)?.linea === 'Has empezado a descubrir España.', 'turista', `y su línea nombra el país: «${turista(m)?.linea}»`)
  debe(m.some((x) => x.tipo === 'destino_nuevo' && x.nombre === 'Tu destino número 1: Madrid'), 'destino_nuevo', '«Destino nuevo» se queda: «Tu destino número 1: Madrid»')
  debe(!hayPais(m), 'pais_nuevo', 'NO sale la pantalla «País nuevo: España»')
  debe(tiene(p.items, 'pais', 'España') && p.items.get('*|pais|España').propio === true, 'pasaporte', 'España cuenta como país visitado (se guarda), solo que sin pantalla')
  const pas = pasaporte({ datos, items: p.items, ahora: new Date('2027-01-30T10:00:00Z') })
  debe(pas.tus_paises.some((x) => x.pais === 'España') && pas.numeros.paises === 1, 'pasaporte', `el pasaporte lleva España y cuenta 1 país (${pas.numeros.paises})`)
  debe(expDeItem(datos, [...p.items.values()].find((it) => it.logro === 'viajero:viajero_nacional')) === 25, 'exp', '«Turista en tu país» da 25 EXP')
}

/* ───────── 2. Saltó la pregunta: Barcelona → Madrid ───────── */
console.log('2. Saltó la pregunta: sale de Barcelona a Madrid, igual')
{
  const p = vivir({ paisVive: null, viajes: [{ destino: 'madrid', origen_iso: 'ES' }] })
  const m = p.pasos[0].momentos
  debe(Boolean(turista(m)) && m.some((x) => x.tipo === 'destino_nuevo') && !hayPais(m), 'sin_respuesta', `por el origen: «Turista en tu país» + «Destino nuevo», sin «País nuevo» (${nombres(m).join(' | ')})`)
  debe(tiene(p.items, 'pais', 'España'), 'sin_respuesta', 'y España cuenta en el pasaporte')
}

/* ───────── 3. Sale de Londres a Madrid ───────── */
console.log('3. Sale de Londres a Madrid: es un país nuevo')
{
  const p = vivir({ paisVive: null, viajes: [{ destino: 'madrid', origen_iso: 'GB' }] })
  const m = p.pasos[0].momentos
  const pais = m.find((x) => x.tipo === 'pais')
  debe(Boolean(pais) && pais.pais === 'España' && pais.nombre === 'Tu país número 1: España', 'pais_nuevo', `recibe «País nuevo: España» (${nombres(m).join(' | ')})`)
  debe(!turista(m) && !tiene(p.items, 'viajero:viajero_nacional'), 'pais_nuevo', 'y no «Turista en tu país»: su país es Reino Unido')
  debe(p.items.get('*|pais|España').propio !== true, 'pais_nuevo', 'España no se marca como «propio»')
}

/* ───────── 4. La respuesta contestada manda ───────── */
console.log('4. La respuesta contestada no la pisa ningún viaje')
{
  // Vive en Francia (contestado) pero este viaje sale de Madrid a Madrid: para ella, España es un país nuevo.
  const a = vivir({ paisVive: 'FR', viajes: [{ destino: 'madrid', origen_iso: 'ES' }] })
  debe(hayPais(a.pasos[0].momentos) && !turista(a.pasos[0].momentos), 'contestado', 'vive en Francia (contestado) y el viaje sale de Madrid: España es «País nuevo», no «Turista en tu país»')
  // Vive en España (contestado) pero el viaje sale de Londres: Madrid es su país igualmente.
  const b = vivir({ paisVive: 'ES', viajes: [{ destino: 'madrid', origen_iso: 'GB' }] })
  debe(Boolean(turista(b.pasos[0].momentos)) && !hayPais(b.pasos[0].momentos), 'contestado', 'vive en España (contestado) y el viaje sale de Londres: Madrid es de su país')
  debe(paisDeLaPersona({ origen_pais: 'Reino Unido' }, 'ES') === 'España' && paisDeLaPersona({ origen_pais: 'Reino Unido' }, null) === 'Reino Unido' && paisDeLaPersona({}, null) === null, 'contestado', 'paisDeLaPersona: lo contestado manda; si no, el origen; si no, nada')
  // Sin saber el origen ni la respuesta: no se inventa nada («País nuevo» como antes).
  const c = vivir({ paisVive: null, viajes: [{ destino: 'madrid', origen_iso: null }] })
  debe(hayPais(c.pasos[0].momentos) && !turista(c.pasos[0].momentos), 'sin_dato', 'sin respuesta y sin origen del viaje: sale «País nuevo» como hasta ahora')
}

/* ───────── 5. Los escalones: 1, 3 y el 5 sin encender ───────── */
console.log('5. Tres destinos de su país: «Viajero nacional»')
let tres
{
  tres = vivir({ paisVive: 'ES', viajes: [{ destino: 'madrid', origen_iso: 'ES' }, { destino: 'barcelona', origen_iso: 'ES' }, { destino: 'lanzarote', origen_iso: 'ES' }] })
  debe(Boolean(turista(tres.pasos[0].momentos)) && !tiene(tres.pasos[0].items, 'viajero:viajero_nacional', 3), 'escalones', 'con el primero: «Turista en tu país» y todavía no «Viajero nacional»')
  const m1 = tres.pasos[1].momentos
  debe(!m1.some((x) => x.tipo === 'viajero' && x.logro === 'viajero_nacional') && !hayPais(m1), 'escalones', 'con el segundo: ningún logro de «Tu país» nuevo, y España no vuelve a salir')
  const m2 = tres.pasos[2].momentos
  const vn = m2.find((x) => x.tipo === 'viajero' && x.logro === 'viajero_nacional')
  debe(vn?.nombre === 'Viajero nacional' && vn.linea === 'También se viaja cerca: 3 destinos de tu país.', 'escalones', `con el tercero: «Viajero nacional» (${vn?.nombre} · ${vn?.linea})`)
  debe(!tiene(tres.items, 'viajero:viajero_nacional', 5), 'escalones', 'el escalón 5 está preparado pero sin activar: no se gana')
  const def = real.viajero.logros.find((l) => l.id === 'viajero_nacional')
  debe(def.escalones.map((e) => e.n).join() === '1,3,5' && def.escalones[2].activo === false, 'escalones', 'viajero.json: escalones 1, 3 y 5 (el 5 con activo:false)')
  // Con 5 destinos del mismo país tampoco se gana mientras esté apagado (aquí no hay tantos destinos distintos: se comprueba con la propia definición).
  debe(tres.pasos[2].items.get('*|viajero:viajero_nacional|3').pais === 'España', 'escalones', 'el escalón guarda el país para el texto')
}

/* ───────── 6. Un mexicano en Cancún ───────── */
console.log('6. Vive en México y va a Cancún')
{
  const p = vivir({ paisVive: 'MX', viajes: [{ destino: 'cancun', origen_iso: 'MX' }] })
  const m = p.pasos[0].momentos
  debe(Boolean(turista(m)) && turista(m).linea === 'Has empezado a descubrir México.' && !hayPais(m) && m.some((x) => x.tipo === 'destino_nuevo' && /Cancún/.test(x.nombre)), 'mexico', `igual que en España: «Turista en tu país» + «Destino nuevo», sin «País nuevo» (${nombres(m).join(' | ')})`)
  // Y un español que va a Cancún: México es país nuevo.
  const e = vivir({ paisVive: 'ES', viajes: [{ destino: 'cancun', origen_iso: 'ES' }] })
  debe(hayPais(e.pasos[0].momentos) && !turista(e.pasos[0].momentos), 'mexico', 'un español en Cancún: «País nuevo: México»')
  // Y el segundo país, si el primero fue el suyo, es «Tu país número 2» (el suyo cuenta en el pasaporte).
  const dos = vivir({ paisVive: 'ES', viajes: [{ destino: 'madrid', origen_iso: 'ES' }, { destino: 'cancun', origen_iso: 'ES' }] })
  debe(dos.pasos[1].momentos.find((x) => x.tipo === 'pais')?.nombre === 'Tu país número 2: México', 'pasaporte', 'tras España (el suyo, que cuenta), México es el país número 2')
}

/* ───────── 7. Lo que ya tenían se conserva ───────── */
console.log('7. Las cuentas que ya tenían «País nuevo» de su propio país no cambian')
{
  // Cuenta de antes: «País nuevo: España» y «Destino nuevo: Madrid» ya guardados (sin la marca, que solo vive en lo recién calculado).
  const antesDeV39 = vivir({ paisVive: null, viajes: [{ destino: 'madrid', origen_iso: 'GB' }] }).items // (la cuenta de antes lo tenía por no conocer el origen)
  const guardado = new Map([...antesDeV39].filter(([, it]) => it.logro === 'pais' || it.logro === 'destino_nuevo').map(([k, it]) => [k, { ...it, propio: undefined }]))
  // Ahora hace su segundo destino de España (Barcelona), ya viviendo en España: no se le quita ni se le repite «País nuevo».
  const mas = vivir({ paisVive: 'ES', viajes: [{ destino: 'madrid', origen_iso: 'ES' }, { destino: 'barcelona', origen_iso: 'ES' }], guardado })
  debe(!hayPais(mas.pasos[0].momentos) && !hayPais(mas.pasos[1].momentos), 'conservar', 'lo ya guardado no se vuelve a enseñar ni cambia')
  debe(tiene(mas.items, 'pais', 'España'), 'conservar', 'y «País nuevo: España» sigue en lo ganado (nada se quita)')
  // «Viajero nacional» guardado como el logro viejo (sin escalón) se lee como el escalón 3: ni se quita ni se duplica.
  const servicio = crearServicioLogros({ repo: {}, datos, catalogos: {} })
  const items = servicio.aItems([{ destino: '*', logro: 'viajero:viajero_nacional', escalon: '', trip_id: 't1', ganado_en: '2026-12-10T10:00:00Z' }])
  debe(items.has('*|viajero:viajero_nacional|3') && items.size === 1, 'conservar', 'un «Viajero nacional» ya ganado (sin escalón) se lee como el escalón 3')
  const calculado = tres.items
  debe(!diferencia(items, new Map([...calculado].filter(([k]) => k === '*|viajero:viajero_nacional|3')), datos.ajustes).length, 'conservar', 'y el cálculo de ahora no lo vuelve a dar')
}

/* ───────── 8. La ficha nunca dice 0 ni «te falta» para lo conseguido ───────── */
console.log('8. La ficha (V38C): la cuenta nunca baja de lo ganado')
{
  const fila = (items, cuentan, viajes, paisVive) => {
    const r = construirGanados({ datos, catalogos: {}, items, cuentan, viajes, perfil: {}, ahora: new Date('2027-01-30T10:00:00Z'), paisVive })
    return r.viajero.flatMap((g) => g.filas).find((f) => f.id === 'viajero_nacional')
  }
  for (const [k, esperado] of [[1, 1], [2, 1], [3, 3]]) {
    const items = tres.pasos[k - 1].items
    const hs = tres.hechos.slice(0, k)
    const viajes = Object.fromEntries(Object.entries(tres.viajes).slice(0, k))
    const f = fila(items, hechosQueCuentan(hs, viajes, datos), viajes, 'ES')
    debe(f && f.ganado && f.escalon === esperado && f.cuenta.n >= esperado && f.cuenta.n > 0, 'ficha', `con ${k} destino(s): ganado, escalón ${esperado}, cuenta ${f?.cuenta?.n} (nunca 0)`)
    debe(!f.siguiente || f.siguiente.faltan > 0, 'ficha', `con ${k}: nunca «te falta 0» (${JSON.stringify(f.siguiente)})`)
    debe(f.nombre === (esperado === 1 ? 'Turista en tu país' : 'Viajero nacional'), 'ficha', `el nombre es el del escalón ganado: «${f.nombre}»`)
    debe(f.familia === 'Tu país' && f.cuenta.unidad_varios === 'destinos de tu país', 'ficha', 'la familia es «Tu país» y cuenta destinos de tu país')
  }
  // Con los datos de verdad solo se ve el escalón 1 (el 3 pide 3 destinos de un mismo país).
  const p = vivir({ paisVive: 'ES', viajes: [{ destino: 'lanzarote', origen_iso: 'ES' }] })
  const v = { t1: { id: 't1', destino: 'lanzarote', inicio: '2026-12-01', fin: '2026-12-04', dias: [], origen_iso: 'ES', origen_pais: 'España' } }
  const r = construirGanados({ datos: real, catalogos: {}, items: p.items, cuentan: hechosQueCuentan(p.hechos, v, real), viajes: v, perfil: {}, ahora: new Date('2027-01-30T10:00:00Z'), paisVive: 'ES' })
  const fr = r.viajero.flatMap((g) => g.filas).find((f) => f.id === 'viajero_nacional')
  debe(fr?.ganado && fr.escalon === 1 && fr.nombre === 'Turista en tu país' && fr.linea === 'Has empezado a descubrir España.' && fr.siguiente === null && fr.completo === true, 'ficha', `con los destinos de hoy: «${fr?.nombre}», línea «${fr?.linea}», sin siguiente aún (el 3 espera a tener 3 destinos de un país)`)
  // La persona cambia de país en Ajustes (ahora Francia): lo ganado se queda y la cuenta no baja a 0.
  const f2 = fila(tres.items, hechosQueCuentan(tres.hechos, tres.viajes, datos), tres.viajes, 'FR')
  debe(f2.ganado && f2.escalon === 3 && f2.cuenta.n === 3 && (!f2.siguiente || f2.siguiente.faltan > 0), 'ficha', `si cambia su país a Francia, la ficha sigue en 3 y no dice 0 (${f2.cuenta.n})`)
}

/* ───────── 9. El país de origen sale del viaje ───────── */
console.log('9. El país de origen sale del viaje (ya se guarda con la ciudad de salida)')
{
  const route = { destination: 'Lanzarote', answers: { dateRange: { start: '2026-12-01', end: '2026-12-04' }, originPlace: { name: 'Londres', fullName: 'Londres, Reino Unido', coordinates: { lat: 51.5, lng: -0.1 }, countryCode: 'gb' } }, days: [] }
  const c = contextoDeViaje({ id: 'v1', route }, real, {}, {})
  debe(c?.origen_pais === 'Reino Unido' && c.origen_iso === 'GB', 'origen', `el viaje guarda el país de origen: ${c?.origen_pais} (${c?.origen_iso})`)
  const sin = contextoDeViaje({ id: 'v2', route: { ...route, answers: { ...route.answers, originPlace: null } } }, real, {}, {})
  debe(sin && sin.origen_pais === null && sin.origen_iso === null, 'origen', 'sin ciudad de salida: sin país de origen (no se inventa)')
}

/* ───────── 10. El panel: dónde viven ───────── */
console.log('10. El panel: lo contestado manda; si no, el origen de su último viaje')
{
  const lugar = (iso) => ({ name: 'X', countryCode: iso })
  const base = {
    hay: { pais: true },
    usuarios: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
    primera_vez: [{ user_id: 'a', pais_vive: 'ES' }, { user_id: 'b', pais_vive: null }, { user_id: 'd', pais_vive: 'MX' }],
    trips: [
      { id: '1', traveler_id: 'a', origen: 'Londres', lugar: lugar('gb'), actualizado: '2026-11-01T00:00:00Z' }, // contestó España: el viaje no lo pisa
      { id: '2', traveler_id: 'b', origen: 'París', lugar: lugar('fr'), actualizado: '2026-10-01T00:00:00Z' },
      { id: '3', traveler_id: 'b', origen: 'Lisboa', lugar: lugar('pt'), actualizado: '2026-11-10T00:00:00Z' }, // su último viaje
      { id: '4', traveler_id: 'c', origen: 'Roma', lugar: lugar('it'), actualizado: '2026-11-02T00:00:00Z' }, // sin fila de primera vez
    ],
  }
  const v = dondeViven(base)
  const por = Object.fromEntries(v.paises.map((p) => [p.iso, p]))
  debe(v.total === 4 && v.fuentes.contestado === 2 && v.fuentes.origen === 2, 'panel', `4 personas: 2 contestadas y 2 por el origen (${JSON.stringify(v.fuentes)})`)
  debe(por.es?.n === 1 && por.es.contestado === 1 && !por.gb, 'panel', 'la que contestó España sigue en España (su viaje desde Londres no la cambia)')
  debe(por.pt?.n === 1 && por.pt.origen === 1 && !por.fr, 'panel', 'la que la saltó cuenta por el origen de su ÚLTIMO viaje (Lisboa, no París)')
  debe(por.it?.origen === 1 && por.mx?.contestado === 1, 'panel', 'sin fila de primera vez, también por el origen; México contestado')
  debe(paisDeVive(base, 'b')?.fuente === 'origen' && paisDeVive(base, 'a')?.fuente === 'contestado' && paisDeVive(base, 'a').iso === 'es', 'panel', 'la ficha dice de dónde sale cada país')
  debe(dondeViven({ ...base, hay: {} }) === null, 'panel', 'sin la 0091 («Pronto»), todo como antes')
}

console.log(`\nPrueba de la Tanda V39 (Tu país): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
if (fallos.length) process.exit(1)
