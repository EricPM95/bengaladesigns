/**
 * «Reorganizar este día» (Tanda 6y, punto 3): pone en buen orden las paradas que ya tiene un día del viajero, usando nuestros días escritos solo para saber el orden.
 *
 * SOLO ORDENA. Nunca añade una parada, nunca quita ninguna, nunca la manda a otro día ni a «Si te sobra tiempo». Los horarios no mueven nada.
 * Todo sale del documento (`listas.json`, que genera el convertidor): si el documento cambia, cambian los grupos y el orden. Aquí no hay ningún nombre de sitio escrito.
 *
 *   · Un GRUPO es cada franja (mañana o tarde) de cada parte de cada día escrito, con sus paradas en su orden.
 *   · Cada parada del viajero va al grupo del día escrito donde más paradas suyas haya (el día se elige repartiendo: primero el que cubre más, luego el que cubre más de lo que queda).
 *     Una parada que no está en ningún día escrito se junta con el grupo que le queda más cerca andando.
 *   · Dentro del grupo, el orden del día escrito. Un sitio que sale dos veces en la lista cuenta en su primer sitio.
 *   · Lo RESERVADO (Coliseo, Museos, Galería, Free Tour) elige su fila de la tabla del día por la hora (las variantes del documento, `cuando.reserva`): esa fila es la que ordena su grupo,
 *     y su «Llegada a…» (si el día la lleva) va justo delante. Una reserva de mañana va en la parte de la mañana; una de tarde, en la de la tarde.
 *   · Los grupos entre sí, por este orden de prioridad: lo reservado; los momentos (lo de primera hora «sin gente» al principio, el paseo de antes de cenar al final de la tarde, las
 *     nocturnas de noche); los grupos que ya van juntos en un día escrito (la mañana antes que la tarde de ese día); y por último la cercanía, sin volver atrás.
 *   · La comida (si el día ya la tiene) va entre la parte de la mañana y la de la tarde; la cena, al final, después de lo de la tarde y antes de las nocturnas. Si no las tiene, no se añaden.
 *   · Con la zona del alojamiento y sin nada de primera hora ni reservado, el día empieza por el grupo más cerca de ella.
 *
 * Puro: recibe lo que necesita (las paradas del día, los días escritos y los datos del destino) y devuelve el orden. Lo usan el servidor (`/api/reorganizar-dia`), «Crear mi propio día»
 * (diaPropio.js) y las pruebas.
 */
import { copiarParte, aplicarVariantes, norm } from './listasDia.js'
import { sitiosGrandesDe } from './listasReservas.js'
import { straightLineMeters } from './travelTimes.js'

const clone = (value) => (value == null ? value : JSON.parse(JSON.stringify(value)))
const toMin = (hhmm) => {
  const [h, m] = String(hhmm ?? '').split(':').map(Number)
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null
}
const asPair = (c) => (Array.isArray(c) && Number.isFinite(c[0]) ? [c[0], c[1]] : c && Number.isFinite(c.lat) ? [c.lat, c.lng] : null)
const dist = (a, b) => (a && b ? straightLineMeters(a, b) : 0)
/** Una reserva sin fila escrita (o sin franja en el documento) cuenta como de tarde desde esta hora. */
const MEDIODIA = 14 * 60

/**
 * El punto [lat, lng] de una zona del alojamiento: su `coordinates` ({lat,lng} o [lat,lng]) en `zonas_alojamiento`, o el centro de la zona del destino con el mismo id.
 * `null` si no hay zona, es «Aún no lo sé» (`nose`) o no se sabe dónde está.
 */
export function puntoZonaAlojamiento(destData, zoneId) {
  if (!zoneId || zoneId === 'nose') return null
  const zona = (destData?.destination_config?.zonas_alojamiento ?? []).find((z) => z.id === zoneId)
  const punto = asPair(zona?.coordinates) ?? asPair(destData?.zones?.[zoneId]?.center)
  return punto && Number.isFinite(punto[0]) && Number.isFinite(punto[1]) ? punto : null
}

const namesOf =(list) => [...new Set((list ?? []).filter((s) => s.lugar && (s.tipo === 'parada' || s.tipo === 'tour')).map((s) => s.lugar))]

// ── El catálogo: los grupos que salen del documento ──────────────────────────────────────────────────────────────────────────────────

const catalogos = new WeakMap()

function construirCatalogo(written, destData) {
  const days = []
  const sinGente = new Set()
  const paseoLugares = new Set()
  const indice = new Map()
  const addIndice = (text, lugar) => { if (text) indice.set(norm(text), lugar) }
  const noches = []
  for (const place of destData.places ?? []) addIndice(place.name, place.name)
  for (const [id, dia] of Object.entries(written.days ?? {})) {
    const parts = []
    for (const [key, parte] of Object.entries(dia.partes ?? {})) {
      const base = copiarParte(parte)
      const heredada = dia.hereda_manana_de ? written.days[dia.hereda_manana_de]?.partes?.unica : null
      if (heredada) base.manana = clone(heredada.manana ?? [])
      parts.push({ key, base })
      for (const stop of [...base.manana, ...base.tarde]) {
        if (!stop.lugar) continue
        addIndice(stop.lugar, stop.lugar)
        if (stop.titulo) addIndice(stop.titulo, stop.lugar)
        if (stop.empieza_dia || /sin gente/i.test(`${stop.doc ?? ''} ${stop.titulo ?? ''}`)) sinGente.add(stop.lugar)
        if (stop.no_quita_noche) paseoLugares.add(stop.lugar)
      }
      if (base.noche?.lista?.length) noches.push(base.noche.lista)
    }
    const todos = new Set(parts.flatMap((p) => [...namesOf(p.base.manana), ...namesOf(p.base.tarde)]))
    days.push({ id, dia, nombre: dia.nombre ?? id, parts, todos, size: todos.size, tour: parts.some((p) => [...p.base.manana, ...p.base.tarde].some((s) => s.tipo === 'tour')) })
  }
  const places = new Map((destData.places ?? []).map((place) => [place.name, place]))
  const nightNames = new Set([...(destData.night_experiences ?? []).map((n) => norm(n.name)), ...noches.flat().map(norm)])
  return { days, sinGente, paseoLugares, indice, places, noches, nightNames, ids: days.map((d) => d.id), tourName: destData.default_free_tour?.name ?? null }
}

function catalogo(written, destData) {
  let porDestino = catalogos.get(written)
  if (!porDestino) { porDestino = new WeakMap(); catalogos.set(written, porDestino) }
  let cat = porDestino.get(destData)
  if (!cat) { cat = construirCatalogo(written, destData); porDestino.set(destData, cat) }
  return cat
}

/** ¿Esta condición de una variante nombra la reserva de ese lugar? */
function mencionaReserva(cuando, lugar) {
  for (const alguna of [].concat(cuando ?? [])) {
    if (!alguna || typeof alguna !== 'object') continue
    if (alguna.reserva?.lugar === lugar) return true
    if ((alguna.reservas ?? []).some((r) => r.lugar === lugar)) return true
  }
  return false
}

/** La lista de una parte de un día con la fila de la tabla que le toca a las reservas del viajero (las variantes del documento), o la lista tal cual si ninguna se cumple. */
function derivar(cat, day, part, contexto) {
  const aplicadas = []
  const ctx = {
    weekday: null, dateIso: null, month: null, hasFreeTour: contexto.hasFreeTour, freeTourFranja: null, tourName: cat.tourName,
    ftAqui: Boolean(contexto.hasFreeTour && cat.tourName && contexto.entradas[cat.tourName]), ftOtroDia: false,
    entradas: contexto.entradas, poolNames: [], experiencias: [], orden: cat.ids, parte: part.key === 'unica' ? null : part.key,
    enFechas: () => false, cerrado: () => false,
  }
  const trabajo = aplicarVariantes(clone(part.base), day.dia, ctx, aplicadas)
  const mencionadas = new Set()
  for (const id of aplicadas) {
    const variante = (day.dia.variantes ?? []).find((v) => v.id === id)
    for (const lugar of Object.keys(contexto.entradas)) if (variante && mencionaReserva(variante.cuando, lugar)) mencionadas.add(lugar)
  }
  return { manana: namesOf(trabajo.manana), tarde: namesOf(trabajo.tarde), mencionadas }
}

/** Lo que la fila no trae pero la lista base sí (el Altar en una fila que solo lleva la Plaza Venecia) se queda en su sitio: detrás de lo que tenía delante. */
function sumarRestos(base, derivada) {
  const out = { manana: [...derivada.manana], tarde: [...derivada.tarde] }
  const enFila = new Set([...out.manana, ...out.tarde])
  const secuencia = [...base.manana.map((n) => ['manana', n]), ...base.tarde.map((n) => ['tarde', n])]
  secuencia.forEach(([franja, nombre], i) => {
    if (enFila.has(nombre)) return
    let anterior = null
    for (let k = i - 1; k >= 0; k--) if (enFila.has(secuencia[k][1])) { anterior = secuencia[k][1]; break }
    let sitio = null
    if (anterior) for (const f of ['manana', 'tarde']) { const at = out[f].indexOf(anterior); if (at >= 0) sitio = [f, at + 1] }
    if (!sitio) {
      let siguiente = null
      for (let k = i + 1; k < secuencia.length; k++) if (enFila.has(secuencia[k][1])) { siguiente = secuencia[k][1]; break }
      if (siguiente) for (const f of ['manana', 'tarde']) { const at = out[f].indexOf(siguiente); if (at >= 0) sitio = [f, at] }
    }
    const [f, at] = sitio ?? [franja, out[franja].length]
    out[f].splice(at, 0, nombre)
    enFila.add(nombre)
  })
  return out
}

// ── Orden por cercanía ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * El orden de los grupos de un día. Se prueba el camino más corto (sin volver atrás) que cumple lo que NO se negocia:
 *   · lo reservado va por su hora, y lo reservado de mañana va delante de todo lo demás; lo reservado de tarde va después de lo libre de la mañana y delante de lo libre de la tarde;
 *   · los grupos que van juntos en un día escrito (su mañana y su tarde, sus partes) van en el orden del documento.
 * Entre lo demás manda la cercanía (desde `desde`, y hasta `meta` si hay paseo de antes de cenar). «Mañana o tarde» solo desempata: a igual camino (1 m), gana el que tiene menos
 * tardes delante de mañanas. Hasta 10 grupos se prueban todos (con poda); más, el más cercano disponible cada vez.
 */
function ordenarGrupos(grupos, { desde, meta, escrito }) {
  const lista = [...grupos].sort((a, b) => a.key.localeCompare(b.key))
  const n = lista.length
  if (n <= 1) return lista
  const reservadas = lista.filter((g) => g.hora != null).sort((a, b) => a.hora - b.hora || a.key.localeCompare(b.key))
  const antes = lista.map(() => new Set())
  const idx = new Map(lista.map((g, i) => [g, i]))
  const exige = (a, b) => { if (a !== b) antes[idx.get(b)].add(idx.get(a)) }
  reservadas.forEach((g, i) => { if (i > 0) exige(reservadas[i - 1], g) })
  for (const r of reservadas) {
    if (r.franja === 'manana') for (const g of lista) { if (g !== r && g.hora == null) exige(r, g) }
    else for (const g of lista) { if (g.hora == null) exige(g.franja === 'manana' ? g : r, g.franja === 'manana' ? r : g) }
  }
  for (const a of lista) for (const b of lista) {
    const ea = escrito(a)
    const eb = escrito(b)
    if (ea && eb && ea.dayId === eb.dayId && ea.n < eb.n) exige(a, b)
  }
  const dosMitades = (orden) => {
    let inversiones = 0
    orden.forEach((g, i) => { if (g.franja === 'tarde') for (const h of orden.slice(i + 1)) if (h.franja === 'manana') inversiones++ })
    return inversiones
  }
  let mejor = null
  let mejorCoste = Infinity
  let mejorInv = Infinity
  const hechos = new Set()
  const probar = (orden, coste, punto) => {
    if (coste > mejorCoste + 1) return
    if (orden.length === n) {
      const total = coste + dist(punto, meta)
      const inv = dosMitades(orden)
      if (total < mejorCoste - 1 || (total <= mejorCoste + 1 && inv < mejorInv)) { mejor = orden; mejorCoste = Math.min(total, mejorCoste); mejorInv = inv }
      return
    }
    for (let i = 0; i < n; i++) {
      if (hechos.has(i) || [...antes[i]].some((p) => !hechos.has(p))) continue
      const g = lista[i]
      hechos.add(i)
      probar([...orden, g], coste + dist(punto, g.inicio), g.fin ?? punto)
      hechos.delete(i)
    }
  }
  if (n <= 10) {
    probar([], 0, desde)
    if (mejor) return mejor
  } else {
    // Muchos grupos: el más cercano de los que ya se pueden poner, cada vez.
    const orden = []
    const puestos = new Set()
    let punto = desde
    while (orden.length < n) {
      const libres = lista.map((g, i) => i).filter((i) => !puestos.has(i) && [...antes[i]].every((p) => puestos.has(p)))
      if (libres.length === 0) break
      const k = libres.reduce((a, b) => (dist(punto, lista[b].inicio) < dist(punto, lista[a].inicio) - 1 ? b : a))
      puestos.add(k)
      orden.push(lista[k])
      punto = lista[k].fin ?? punto
    }
    if (orden.length === n) return orden
  }
  // (Si lo que se exige se contradice, la hora de la reserva y la mañana antes que la tarde, como antes.)
  return lista.sort((a, b) => (a.franja === b.franja ? 0 : a.franja === 'manana' ? -1 : 1) || (a.hora ?? 1e9) - (b.hora ?? 1e9) || a.key.localeCompare(b.key))
}

// ── Reorganizar ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * @param {object} args
 *   stops      [{ id, name, fullName?, night?, arrival?, freeTour?, reservedTime?: 'HH:MM', coordinates? }] en el orden en que están ahora
 *   written    los días escritos del destino: { days: { D1: {...}, … } } (lo que da writtenDaysFor)
 *   destData   los datos del destino (roma.json)
 *   hasLunch / hasDinner   si el día ya tiene comida o cena
 *   lodging    [lat, lng] de la zona del alojamiento (opcional)
 * @returns {{ order: string[], changed: boolean, mealAfter: { lunch?: number, dinner?: number }, groups: object[] }}
 *   `order` son los mismos ids de entrada, solo reordenados; `mealAfter` dice detrás de qué posición de `order` van la comida y la cena (-1 = antes de la primera).
 */
export function reorganizarDia({ stops, written, destData, hasLunch = false, hasDinner = false, lodging = null }) {
  const original = stops.map((s) => s.id)
  const sinCambios = { order: original, changed: false, mealAfter: {}, groups: [] }
  if (stops.length < 2 || !written?.days || !destData) return sinCambios
  const cat = catalogo(written, destData)
  const sitiosGrandes = sitiosGrandesDe(destData)

  // 1. Qué es cada parada: «Llegada a…», nocturna o parada.
  const info = new Map()
  for (const s of stops) {
    const lugar = s.freeTour ? cat.tourName : cat.indice.get(norm(s.name)) ?? (s.fullName ? cat.indice.get(norm(s.fullName)) : null) ?? null
    const place = cat.places.get(lugar ?? s.name) ?? null
    const coords = asPair(s.coordinates) ?? asPair(place?.coordinates)
    const night = Boolean(s.night) || cat.nightNames.has(norm(s.name))
    info.set(s.id, { ...s, lugar: night ? null : lugar, coords, night, arrival: Boolean(s.arrival) && !night, hora: toMin(s.reservedTime) })
  }
  const llegadas = stops.filter((s) => info.get(s.id).arrival)
  const nocturnas = stops.filter((s) => info.get(s.id).night)
  const cuerpo = stops.filter((s) => !info.get(s.id).arrival && !info.get(s.id).night)
  const hasFreeTour = cuerpo.some((s) => info.get(s.id).lugar && info.get(s.id).lugar === cat.tourName)

  // «Llegada a X» va pegada delante de X (si no se sabe de cuál, delante de la que tenía detrás).
  const delante = new Map()
  for (const llegada of llegadas) {
    const objetivo = norm(String(llegada.name ?? '').replace(/^Llegada a\s+/i, ''))
    let meta = cuerpo.find((s) => norm(s.name) === objetivo || norm(info.get(s.id).lugar ?? '') === objetivo)
    if (!meta) { const after = stops.slice(stops.indexOf(llegada) + 1).find((s) => !info.get(s.id).arrival); meta = after ?? null }
    const clave = meta?.id ?? '__fin__'
    delante.set(clave, [...(delante.get(clave) ?? []), llegada.id])
  }

  // 2. Los grupos. Primero lo reservado (la fila de su tabla), luego el reparto por días.
  const entradas = {}
  for (const s of cuerpo) {
    const i = info.get(s.id)
    if (i.lugar && i.hora != null && sitiosGrandes.has(i.lugar)) entradas[i.lugar] = s.reservedTime.replace(/^(\d):/, '0$1:')
  }
  const contexto = { entradas, hasFreeTour }
  const grupos = new Map()
  const asignada = new Map()
  const dia = (d) => (!d.tour || hasFreeTour)
  const grupoDe = (d, part, franja, nombres, fila) => {
    const key = `${d.id}/${part.key}/${franja}`
    if (!grupos.has(key)) grupos.set(key, { key, dayId: d.id, partKey: part.key, franja, nombres, miembros: [], etiqueta: `${d.nombre}${Object.keys(d.dia.partes).length > 1 ? ` (${part.key})` : ''}, ${franja === 'manana' ? 'mañana' : 'tarde'}`, fila, base: part.base })
    return grupos.get(key)
  }
  const quedan = new Set(cuerpo.filter((s) => info.get(s.id).lugar).map((s) => s.id))
  let primera = []

  // 2a. La fila de cada reserva grande: el día (y la parte) cuya lista, con la fila que toca por la hora, lleva esa reserva y más paradas del viajero.
  let porCubrir = Object.keys(entradas)
  while (porCubrir.length > 0) {
    let mejor = null
    for (const d of cat.days) {
      if (!dia(d)) continue
      for (const part of d.parts) {
        const fila = derivar(cat, d, part, contexto)
        const enLista = new Set([...fila.manana, ...fila.tarde])
        const cubre = porCubrir.filter((lugar) => enLista.has(lugar))
        if (cubre.length === 0) continue
        const nombradas = cubre.filter((lugar) => fila.mencionadas.has(lugar)).length
        const todosLosNombres = new Set([...enLista, ...namesOf(part.base.manana), ...namesOf(part.base.tarde)])
        // (Lo de primera hora sin gente no cuenta aquí: es un momento, no una razón para elegir un día.)
        const tuyas = [...quedan].filter((id) => todosLosNombres.has(info.get(id).lugar) && !cat.sinGente.has(info.get(id).lugar)).length
        const puntos = cubre.length * 1000000 + tuyas * 1000 + nombradas
        if (!mejor || puntos > mejor.puntos || (puntos === mejor.puntos && d.size < mejor.d.size)) mejor = { d, part, fila, cubre, puntos, todosLosNombres }
      }
    }
    if (!mejor) break
    const lista = sumarRestos({ manana: namesOf(mejor.part.base.manana), tarde: namesOf(mejor.part.base.tarde) }, mejor.fila)
    for (const id of [...quedan]) {
      const lugar = info.get(id).lugar
      for (const franja of ['manana', 'tarde']) {
        if (!lista[franja].includes(lugar)) continue
        const g = grupoDe(mejor.d, mejor.part, franja, lista[franja], mejor.fila.mencionadas.size > 0)
        g.nombres = lista[franja]
        g.miembros.push(id)
        asignada.set(id, g)
        quedan.delete(id)
        break
      }
    }
    porCubrir = porCubrir.filter((lugar) => !mejor.cubre.includes(lugar))
  }

  // Lo de primera hora «sin gente» es un momento propio: va al principio, no cuenta para elegir el día y no entra en ningún grupo (salvo que la fila de una reserva lo lleve en su sitio).
  primera = cuerpo.filter((s) => cat.sinGente.has(info.get(s.id).lugar) && info.get(s.id).hora == null && !asignada.has(s.id)).map((s) => s.id)
  for (const id of primera) quedan.delete(id)

  // 2b. El resto: el día escrito que cubre más de lo que queda (a igual, el más corto), y en él la lista donde más paradas hay.
  const repartir = (permitirTour) => {
    while (quedan.size > 0) {
      let mejor = null
      for (const d of cat.days) {
        if (!permitirTour && !dia(d)) continue
        const cubre = [...quedan].filter((id) => d.todos.has(info.get(id).lugar))
        if (cubre.length === 0) continue
        if (!mejor || cubre.length > mejor.cubre.length || (cubre.length === mejor.cubre.length && d.size < mejor.d.size)) mejor = { d, cubre }
      }
      if (!mejor) return
      const enDia = new Set(mejor.cubre)
      const listas = []
      for (const part of mejor.d.parts) for (const franja of ['manana', 'tarde']) {
        const previa = grupos.get(`${mejor.d.id}/${part.key}/${franja}`)
        listas.push({ part, franja, nombres: previa?.nombres ?? namesOf(part.base[franja]) })
      }
      for (const id of mejor.cubre) {
        const lugar = info.get(id).lugar
        let elegida = null
        for (const l of listas) {
          if (!l.nombres.includes(lugar)) continue
          const puntos = l.nombres.filter((n) => [...enDia].some((x) => info.get(x).lugar === n)).length
          if (!elegida || puntos > elegida.puntos || (puntos === elegida.puntos && l.nombres.length < elegida.l.nombres.length)) elegida = { l, puntos }
        }
        const g = grupoDe(mejor.d, elegida.l.part, elegida.l.franja, elegida.l.nombres, false)
        g.miembros.push(id)
        asignada.set(id, g)
        quedan.delete(id)
      }
    }
  }
  repartir(false)
  repartir(true)

  // 3. Los momentos: lo de primera hora «sin gente» (al principio) y el paseo de antes de cenar (al final de la tarde).
  const paseoCena = []
  for (const g of grupos.values()) {
    const entradasLista = [...g.base.manana, ...g.base.tarde]
    g.miembros = g.miembros.filter((id) => {
      const lugar = info.get(id).lugar
      const entrada = entradasLista.find((e) => e.lugar === lugar)
      // El paseo de antes de cenar, donde el documento lo escribe así; o ese mismo sitio en un grupo de menos de 3 paradas del viajero (donde el documento lo pone de mañana, como en el
      // D7, hay un grupo de verdad con él: con 3 o más se queda como está escrito).
      if ((entrada?.no_quita_noche || (cat.paseoLugares.has(lugar) && g.miembros.length < 3)) && info.get(id).hora == null) { paseoCena.push(id); return false }
      return true
    })
  }

  // 4. Las paradas que no están en ningún día escrito: junto al grupo más cercano andando.
  const desconocidas = cuerpo.filter((s) => !asignada.has(s.id) && !primera.includes(s.id))
  const vivos = () => [...grupos.values()].filter((g) => g.miembros.length > 0)
  const ordenDe = (g) => g.miembros.slice().sort((a, b) => g.nombres.indexOf(info.get(a).lugar) - g.nombres.indexOf(info.get(b).lugar))
  const sueltas = []
  for (const g of grupos.values()) g.ordenado = ordenDe(g)
  for (const s of desconocidas) {
    const i = info.get(s.id)
    let cerca = null
    for (const g of vivos()) for (const m of g.ordenado) {
      const d = i.coords && info.get(m).coords ? dist(i.coords, info.get(m).coords) : Infinity
      if (!cerca || d < cerca.d || (d === cerca.d && g.key < cerca.g.key)) cerca = { g, d }
    }
    if (!cerca) { sueltas.push(s.id); continue }
    // El sitio dentro del grupo donde menos alarga el camino.
    const lista = cerca.g.ordenado
    let mejorAt = lista.length
    let mejorCoste = Infinity
    for (let at = 0; at <= lista.length; at++) {
      const a = at > 0 ? info.get(lista[at - 1]).coords : null
      const b = at < lista.length ? info.get(lista[at]).coords : null
      const extra = (a ? dist(a, i.coords) : 0) + (b ? dist(i.coords, b) : 0) - (a && b ? dist(a, b) : 0)
      if (extra < mejorCoste - 1) { mejorCoste = extra; mejorAt = at }
    }
    lista.splice(mejorAt, 0, s.id)
    cerca.g.miembros.push(s.id)
    asignada.set(s.id, cerca.g)
  }
  // (Si el día no tiene ni un grupo —nada de lo que puso el viajero está escrito—, las sueltas van por cercanía, como un solo grupo.)
  if (sueltas.length > 0) {
    const g = { key: 'zz/sueltas/tarde', dayId: null, partKey: 'sueltas', franja: 'tarde', nombres: [], miembros: [], ordenado: [], etiqueta: 'paradas sin día escrito', fila: false, base: { manana: [], tarde: [] } }
    const restantes = [...sueltas]
    let punto = lodging
    while (restantes.length) {
      let k = 0
      restantes.forEach((id, i) => { if (dist(punto, info.get(id).coords) < dist(punto, info.get(restantes[k]).coords)) k = i })
      const [id] = restantes.splice(k, 1)
      g.ordenado.push(id)
      g.miembros.push(id)
      punto = info.get(id).coords ?? punto
    }
    grupos.set(g.key, g)
  }

  // 5. Cada grupo: su orden, sus puntas y la franja (una reserva sin fila escrita va a la mañana o a la tarde por su hora).
  const lista = vivos()
  for (const g of lista) {
    g.ordenado = g.ordenado?.length ? g.ordenado : ordenDe(g)
    const coords = g.ordenado.map((id) => info.get(id).coords).filter(Boolean)
    g.inicio = coords[0] ?? null
    g.fin = coords.at(-1) ?? null
    const horas = g.ordenado.map((id) => info.get(id).hora).filter((h) => h != null)
    g.hora = horas.length ? Math.min(...horas) : null
    if (g.hora != null && !g.fila && !g.ordenado.some((id) => sitiosGrandes.has(info.get(id).lugar))) g.franja = g.hora >= MEDIODIA ? 'tarde' : 'manana'
  }

  // 6. Los grupos entre sí. Prioridad: lo reservado; los momentos (primera hora sin gente al principio, paseo de antes de cenar al final de la tarde, nocturnas de noche); dentro de cada grupo
  //    el orden de nuestro día escrito; los grupos que van juntos en un día escrito, en ese orden; entre grupos, la cercanía sin volver atrás; «mañana o tarde» solo para desempatar.
  const reservados = lista.some((g) => g.hora != null) || primera.length > 0
  let desde = reservados ? null : lodging
  const salida = []
  const hechos = []
  const poner = (g, tipo) => { salida.push(...g.ordenado); hechos.push({ tipo, g }); desde = g.fin ?? desde }
  const primeraIds = primera.slice()
  salida.push(...primeraIds)
  if (primeraIds.length) desde = info.get(primeraIds.at(-1)).coords ?? desde
  const meta = paseoCena.length ? info.get(paseoCena.slice().sort((a, b) => a.localeCompare(b))[0]).coords : null
  const ordenEscrito = (g) => {
    const dia = cat.days.find((d) => d.id === g.dayId)
    const parte = dia ? dia.parts.findIndex((p) => p.key === g.partKey) : -1
    return dia && parte >= 0 ? { dayId: g.dayId, n: parte * 2 + (g.franja === 'tarde' ? 1 : 0) } : null
  }
  const ordenados = ordenarGrupos(lista, { desde, meta, escrito: ordenEscrito })
  for (const g of ordenados) poner(g, g.franja)
  if (paseoCena.length) {
    const ordenPaseo = paseoCena.slice().sort((a, b) => a.localeCompare(b))
    for (const id of ordenPaseo) { salida.push(id); desde = info.get(id).coords ?? desde }
  }
  const finDiaPos = salida.length

  // Las nocturnas: el orden del documento si salen en la misma lista; si no, por cercanía.
  const listasNoche = cat.noches.map((l) => l.map(norm))
  const vaAntes = (a, b) => {
    const na = norm(info.get(a).name)
    const nb = norm(info.get(b).name)
    const sale = (x, y) => listasNoche.some((l) => l.includes(x) && l.includes(y) && l.indexOf(x) < l.indexOf(y))
    return sale(na, nb) && !sale(nb, na)
  }
  const noches = nocturnas.map((s) => s.id)
  const permutaciones = (items) => (items.length <= 1 ? [items] : items.flatMap((x, i) => permutaciones([...items.slice(0, i), ...items.slice(i + 1)]).map((r) => [x, ...r])))
  let mejorNoche = noches
  if (noches.length > 1) {
    let mejorCoste = Infinity
    for (const p of permutaciones(noches.slice(0, 6))) {
      const rotas = p.some((a, i) => p.slice(i + 1).some((b) => vaAntes(b, a)))
      if (rotas) continue
      let punto = desde
      let coste = 0
      for (const id of p) { coste += dist(punto, info.get(id).coords); punto = info.get(id).coords ?? punto }
      if (coste < mejorCoste - 1) { mejorCoste = coste; mejorNoche = p }
    }
  }
  salida.push(...mejorNoche)
  // (Lo que no cuadró en ningún grupo, por si acaso: nunca se pierde una parada.)
  for (const s of cuerpo) if (!salida.includes(s.id)) salida.splice(finDiaPos, 0, s.id)

  // 7. El orden final con las «Llegada a…» delante de lo suyo.
  const order = []
  for (const id of salida) {
    order.push(...(delante.get(id) ?? []), id)
  }
  order.push(...(delante.get('__fin__') ?? []))

  // 8. La comida y la cena (solo si el día ya las tiene).
  const posDe = (id) => order.indexOf(id)
  const diaIds = salida.slice(0, finDiaPos)
  const mealAfter = {}
  if (hasDinner) mealAfter.dinner = diaIds.length ? posDe(diaIds.at(-1)) : -1
  if (hasLunch) {
    // La comida va en un límite entre grupos: donde menos grupos de la mañana quedan detrás y de la tarde delante (si el día tiene de las dos); a igual, el más cercano a la mitad.
    const unidades = []
    if (primeraIds.length) unidades.push({ n: primeraIds.length, franja: 'manana' })
    for (const h of hechos) unidades.push({ n: h.g.ordenado.length, franja: h.g.franja })
    if (paseoCena.length) unidades.push({ n: paseoCena.length, franja: 'tarde' })
    const n = diaIds.length
    const mitad = Math.max(0, Math.ceil(n / 2) - 1)
    const hayDeLasDos = unidades.some((u) => u.franja === 'manana') && unidades.some((u) => u.franja === 'tarde')
    const candidatos = []
    let acumulado = 0
    for (let k = 0; k < unidades.length - 1; k++) {
      acumulado += unidades[k].n
      const mal = hayDeLasDos ? unidades.filter((u, i) => (i <= k && u.franja === 'tarde') || (i > k && u.franja === 'manana')).length : 0
      candidatos.push({ corte: acumulado - 1, mal })
    }
    if (candidatos.length) {
      const mejor = candidatos.reduce((a, b) => (b.mal < a.mal || (b.mal === a.mal && Math.abs(b.corte - mitad) < Math.abs(a.corte - mitad)) ? b : a))
      mealAfter.lunch = posDe(diaIds[Math.min(mejor.corte, n - 1)])
    } else {
      // Todo el día es un solo grupo: la comida a la mitad.
      mealAfter.lunch = posDe(diaIds[Math.min(mitad, n - 1)])
    }
  }

  const changed = order.length === original.length && order.some((id, i) => id !== original[i])
  const descripcion = hechos.map((h) => ({ grupo: h.g.etiqueta, tramo: h.tipo, paradas: h.g.ordenado.map((id) => info.get(id).name) }))
  return { order: order.length === original.length ? order : original, changed: order.length === original.length ? changed : false, mealAfter, groups: descripcion, moments: { primera: primeraIds.map((id) => info.get(id).name), paseoCena: paseoCena.map((id) => info.get(id).name), noche: mejorNoche.map((id) => info.get(id).name) } }
}
