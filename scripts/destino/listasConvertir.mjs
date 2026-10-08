// Convierte docs/dias/DIAS_ROMA_PARADAS.md (días por paradas y franjas, sin horas) en datos: data/dias/roma/listas.json.
//   node scripts/destino/listasConvertir.mjs            → escribe listas.json y las dudas en docs/dias/PREGUNTAS_TANDA6_CONVERTIDOR.md
//
// Lo que entiende como dato (cada día): las franjas (mañana, comida, tarde, cena, noche), las paradas con sus minutos aproximados (~) y cómo se visitan
// (por dentro, por fuera o de camino), el restaurante con su alternativa, las nocturnas, la línea «Si llueve» y la lista de «Prefiero quedarme en Roma».
// Lo que el documento cuenta en prosa (cierres de un día de la semana, pool, experiencias, Free Tour, reservas a otra hora) lo escribe el usuario como texto: se
// codifica en scripts/destino/listasVariantes.json, y cada variante CITA la frase del documento de la que sale; el convertidor comprueba que esa frase sigue en el documento.
// Lo que no se entiende, NO se inventa: sale en las dudas.
import fs from 'node:fs'

const DOC = 'docs/dias/DIAS_ROMA_PARADAS.md'
const OUT = 'data/dias/roma/listas.json'
const DUDAS = 'docs/dias/PREGUNTAS_TANDA6_CONVERTIDOR.md'
const D = JSON.parse(fs.readFileSync('data/pipeline_v2/roma.json', 'utf8'))
const nombres = JSON.parse(fs.readFileSync('scripts/destino/listasNombres.json', 'utf8'))
const paradasConNombre = new Set(JSON.parse(fs.readFileSync('data/dias/roma/_destino.json', 'utf8')).paradas_con_nombre ?? [])
const variantes = (await import('./listasVariantes.mjs')).default
const antiguo = (id) => {
  const file = `data/archivo/dias_roma/${id}.json`
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null
}

const norm = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
const places = new Map(D.places.map((place) => [norm(place.name), place]))
const restaurantes = new Map(D.restaurants.map((restaurant) => [norm(restaurant.name), restaurant]))
const noches = new Map((D.night_experiences ?? []).map((night) => [norm(night.name), night]))
const MES = { enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 }
const dudas = []
const duda = (dia, texto, donde) => dudas.push({ dia, texto, donde })

const md = fs.readFileSync(DOC, 'utf8')
const lineas = md.split(/\r?\n/)

// ── Utilidades ───────────────────────────────────────────────────────────────────────────────────────────────
/** «1 h 15» → 75 · «3 h» → 180 · «20» → 20 */
const minutosDe = (texto) => {
  const m = /(\d+)\s*h(?:\s*(\d+))?/.exec(texto)
  if (m) return Number(m[1]) * 60 + Number(m[2] ?? 0)
  const n = /(\d+)/.exec(texto)
  return n ? Number(n[1]) : null
}
/** Parte por comas que no estén dentro de paréntesis. */
const partirComas = (texto) => {
  const out = []
  let hondo = 0
  let actual = ''
  for (const c of texto) {
    if (c === '(') hondo++
    if (c === ')') hondo--
    if (c === ',' && hondo === 0) { out.push(actual.trim()); actual = '' } else actual += c
  }
  if (actual.trim()) out.push(actual.trim())
  return out
}
const sinParentesis = (texto) => texto.replace(/\s*\([^)]*\)/g, '').trim()
const parentesis = (texto) => [...texto.matchAll(/\(([^)]*)\)/g)].map((m) => m[1])

/** El sitio de roma.json de un nombre del documento: el alias, el nombre exacto, o null. */
function resolver(texto, dia) {
  const claves = [texto, sinParentesis(texto)].map((t) => t.trim())
  for (const clave of claves) {
    const alias = nombres[clave]
    if (alias && typeof alias === 'object' && alias.lugar) return { ...alias }
    const sitio = places.get(norm(clave))
    if (sitio) return { lugar: sitio.name }
  }
  // «Piazza Navona ...» con una coma: el sitio es lo de antes de la primera coma.
  const [primero, ...resto] = partirComas(sinParentesis(texto))
  if (resto.length > 0) {
    const sitio = nombres[primero]?.lugar ? { ...nombres[primero] } : places.get(norm(primero)) ? { lugar: places.get(norm(primero)).name } : null
    if (sitio) return { ...sitio, titulo: sitio.titulo ?? texto.trim() }
  }
  return null
}

function restauranteDe(texto, dia) {
  const limpio = texto.trim().replace(/^en el /i, '')
  const alias = nombres._restaurantes?.[limpio]
  const hit = restaurantes.get(norm(alias ?? limpio))
  if (hit) return hit.name
  // el nombre contenido (Giggetto → Giggetto al Portico d'Ottavia)
  const candidatos = [...restaurantes.values()].filter((r) => norm(r.name).startsWith(norm(limpio)) || norm(limpio).startsWith(norm(r.name)))
  if (candidatos.length === 1) return candidatos[0].name
  duda(dia, `El restaurante «${limpio}» no está en roma.json.`, 'comida/cena')
  return null
}

// ── Una parada ────────────────────────────────────────────────────────────────────────────────────────────────
function paradaDe(texto, dia, { camino = false } = {}) {
  let t = texto.trim().replace(/\.$/, '')
  const raw = t
  const entrada = t.startsWith('🎟')
  t = t.replace(/^🎟\s*/, '')
  // Traslado: «Taxi a la Plaza de España», «Bus 23 por el Lungotevere hasta la Isla Tiberina», «Bus 40 o taxi al Vaticano».
  const traslado = /^(Taxi|Bus \d+(?: o taxi)?|Metro [A-Z]|Tranvía \d+|Tren)\b(.*)$/i.exec(t)
  if (traslado && !camino) return { tipo: 'traslado', como: traslado[1].replace(/^./, (c) => c.toLowerCase()), texto: t, doc: raw }
  // Desayuno
  if (/^Desayuno\b/i.test(t)) {
    const lugar = (D.curated_breaks ?? [])[0]?.name ?? 'Desayuno romano'
    return { tipo: 'desayuno', lugar, titulo: t.replace(/\s*\(.*$/, ''), min: minutosDe(/~\s*(\d+)/.exec(t)?.[1] ?? '') ?? 30, modo: null, doc: raw }
  }
  // «Via Garibaldi (se sube andando, ~20 min)»: los minutos dentro del paréntesis de un «de camino» son los suyos.
  const enParentesis = camino ? /\(([^)]*)~\s*(\d+)[^)]*\)/.exec(t) : null
  if (enParentesis) t = t.replace(enParentesis[0], '').trim()
  const tilde = enParentesis ? null : /~\s*((?:\d+\s*h(?:\s*\d+)?)|\d+)/.exec(t)
  const min = enParentesis ? Number(enParentesis[2]) : tilde ? minutosDe(tilde[1]) : null
  const cabeza = tilde ? t.slice(0, tilde.index).trim() : t
  const cola = tilde ? t.slice(tilde.index + tilde[0].length) : ''
  let modo = camino ? 'camino' : null
  let nombre = cabeza.replace(/\s*,\s*(\d{1,2}:\d{2})$/, '')
  const hora = /,\s*(\d{1,2}:\d{2})\s*$/.exec(cabeza)?.[1] ?? null
  // («Basílica de San Pedro, por dentro (gratis; …) ~1 h»: el modo va delante del paréntesis.)
  const sinP = sinParentesis(nombre)
  const m = /,\s*por (dentro|fuera)\s*$/.exec(sinP)
  if (m) { modo = m[1] === 'dentro' ? 'dentro' : 'fuera'; nombre = sinP.slice(0, m.index).trim() }
  // «Castillo, por fuera» sin ~: ya cubierto; «..., ya iluminada» etc. se resuelven por la coma.
  const sitio = resolver(nombre, dia)
  if (!sitio) {
    duda(dia, `No sé a qué sitio de roma.json corresponde «${nombre}» (línea: «${raw}»).`, 'paradas')
    return { tipo: 'parada', lugar: null, titulo: nombre, min: min ?? 15, modo, sin_resolver: true, doc: raw }
  }
  const notas = [...parentesis(cola), ...parentesis(cabeza).filter((p) => !nombres[`${sinParentesis(nombre)} (${p})`] && nombres[nombre] === undefined)]
  const frases = cola.replace(/\([^)]*\)/g, '').split('.').map((s) => s.trim()).filter(Boolean)
  const place = places.get(norm(sitio.lugar))
  const stop = { tipo: sitio.lugar === 'Free Tour Centro Histórico' ? 'tour' : 'parada', lugar: sitio.lugar, ...(sitio.titulo ? { titulo: sitio.titulo } : {}), ...(sitio.foto ? { foto: sitio.foto } : {}), ...(sitio.no_quita_noche ? { no_quita_noche: true } : {}), ...(Array.isArray(sitio.coordenadas) ? { coordenadas: sitio.coordenadas } : {}), modo: modo ?? sitio.modo ?? null, doc: raw }
  stop.min = min ?? (stop.modo === 'camino' ? 5 : null)
  if (stop.min == null) {
    stop.min = place?.minutos_fuera ?? Math.min(place?.duration_minutes ?? 15, 20)
    stop.min_sin_escribir = true
    duda(dia, `«${raw}» no trae minutos: pongo ${stop.min} (los del dato del sitio).`, 'paradas')
  }
  if (entrada) {
    const palabras = [...notas, ...frases].join(' ')
    stop.hora_tipo = stop.tipo === 'tour' ? 'turno' : /turno/i.test(palabras) ? 'turno' : 'reserva'
    if (hora) stop.hora = hora
  }
  for (const nota of notas) {
    // «el día empieza a las 7:30» (Trevi sin gente): cuándo empieza el día que empieza con esta parada.
    const empieza = /el d[ií]a empieza a las (\d{1,2}:\d{2})/i.exec(nota)
    if (empieza) { stop.empieza_dia = empieza[1].padStart(5, '0'); continue }
    // «cierra a las 18:30 de octubre a marzo y a las 19:00 de abril a septiembre»: el cierre depende del mes.
    const porMeses = [...nota.matchAll(/cierra a las (\d{1,2}:\d{2}) de (\w+) a (\w+)/gi)]
    if (porMeses.length > 0) { stop.cierra_meses = porMeses.map((m) => ({ hora: m[1].padStart(5, '0'), desde: MES[norm(m[2])], hasta: MES[norm(m[3])] })); continue }
    const aviso = /^⚠️\s*(.*)$/.exec(nota)
    if (aviso && /^en invierno\b/i.test(aviso[1])) { stop.aviso_invierno = aviso[1].charAt(0).toUpperCase() + aviso[1].slice(1); continue }
    if (aviso) {
      ;(stop.avisos ??= []).push(aviso[1])
      const abre = /abre a las (\d{1,2}:\d{2})/i.exec(aviso[1])
      const cierra = /cierra(?:n)? a las (\d{1,2}:\d{2})/i.exec(aviso[1])
      if (abre) stop.abre = abre[1].padStart(5, '0')
      if (cierra) stop.cierra = cierra[1].padStart(5, '0')
    } else if (/^si est[aá] cerrado: «(.+)»$/i.test(nota)) {
      stop.si_cerrado = { cambiar_titulo: /«(.+)»/.exec(nota)[1] }
    } else (stop.notas ??= []).push(nota)
  }
  if (frases.length) (stop.notas ??= []).push(...frases)
  return stop
}

// ── Comida, cena y noche ───────────────────────────────────────────────────────────────────────────────────────
function mesaDe(texto, dia) {
  // (Lo que sigue al primer punto es otra frase —«Tonnarello no, si ya es la cena del D2»—: no es un restaurante.)
  let t = texto.trim().split(/\.\s+(?=[A-ZÁÉÍÓÚ])/)[0].replace(/\.$/, '')
  let zona = null
  // «en el Mercado de Testaccio, Mordi e Vai (o Felice a Testaccio)»: primero la alternativa (el paréntesis) y después la zona.
  let alternativas = []
  const par = /\(([^)]*)\)/.exec(t)
  if (par) {
    // («Tonnarello, solo si no ha salido en el viaje: es la cena del D2»: lo de después de la coma es la condición, no el nombre.)
    alternativas = par[1].split(';').flatMap((p) => p.trim().replace(/^si cierran los dos,\s*/i, '').replace(/^o\s+/i, '').replace(/,\s*solo si .*$/i, '').split(/\s*,\s*o\s+|\s+o\s+/)).map((p) => p.trim()).filter(Boolean)
    t = t.replace(par[0], '').trim()
  }
  const z = /,\s*(en el [^,(]+|en [^,(]+|junto a [^,(]+)\s*$/i.exec(t)
  if (z) { zona = z[1].trim(); t = t.slice(0, z.index) }
  let principal = t
  const antes = /^en el ([^,]+),\s*(.+)$/i.exec(t)
  if (antes) { zona ??= `en el ${antes[1]}`; principal = antes[2] }
  const nombres0 = [principal, ...alternativas].map((n) => restauranteDe(n, dia)).filter(Boolean)
  return { restaurante: nombres0[0] ?? null, alternativa: nombres0[1] ?? null, tercera: nombres0[2] ?? null, ...(nombres0.length > 3 ? { otras: nombres0.slice(3) } : {}), zona, doc: texto.trim() }
}

function nocheDe(texto, dia) {
  const doc = texto.trim()
  let t = doc.replace(/\.$/, '')
  const out = { lista: [], doc }
  // «la que no haya salido» / «la pareja de nocturnas que toque (regla 13)»: la elige el motor por las parejas cercanas (regla 13).
  if (/^la que no haya salido|^la pareja( de nocturnas)? que toque/i.test(t)) return { ...out, libre: true, texto: t }
  const o = /\(o la imprescindible que falte\)/i.exec(t)
  if (o) { out.o_imprescindible = true; t = t.replace(o[0], '').trim() }
  if (/\(taxi\)/i.test(t)) { out.taxi = true; t = t.replace(/\s*\(taxi\)/i, '') }
  const si = /,\s*si el día entero no las ha llevado;\s*si no,\s*(.+)$/i.exec(t)
  let alternativa = null
  if (si) { alternativa = si[1]; t = t.slice(0, si.index) }
  const claves = Object.keys(nombres._noches).sort((a, b) => b.length - a.length)
  const buscar = (frase) => {
    const hallados = []
    let resto = frase
    for (const clave of claves) {
      const i = norm(resto).indexOf(norm(clave))
      if (i >= 0) { hallados.push({ i, nombre: nombres._noches[clave] }); resto = resto.slice(0, i) + ' '.repeat(clave.length) + resto.slice(i + clave.length) }
    }
    return hallados.sort((a, b) => a.i - b.i).map((h) => h.nombre)
  }
  out.lista = buscar(t)
  if (alternativa) out.alternativa = buscar(alternativa)
  if (out.lista.length === 0 && !out.o_imprescindible) duda(dia, `No reconozco la noche «${doc}».`, 'noche')
  for (const n of [...out.lista, ...(out.alternativa ?? [])]) if (!noches.has(norm(n))) duda(dia, `La noche «${n}» no está en night_experiences de roma.json.`, 'noche')
  return out
}

// ── El documento, día a día ─────────────────────────────────────────────────────────────────────────────────────
const IDS = ['D0', 'D0-medio', 'D1-corto', 'D1', 'D2', 'D3', 'D1-FT', 'DT-medio', 'DM-medio', 'D4', 'DA-medio', 'D5', 'D6', 'D7']
const secciones = []
for (let i = 0; i < lineas.length; i++) {
  const h = /^(#{2,3})\s+(.+?)\s+·\s+(D[0-9A-Za-z-]+)\b(.*)$/.exec(lineas[i])
  if (h && IDS.includes(h[3])) secciones.push({ id: h[3], nombre: h[2].trim(), desde: i, titulo: lineas[i] })
}
for (let k = 0; k < secciones.length; k++) {
  let hasta = lineas.length
  for (let j = secciones[k].desde + 1; j < lineas.length; j++) if (/^(#{2,3})\s/.test(lineas[j]) || /^---\s*$/.test(lineas[j])) { hasta = j; break }
  secciones[k].cuerpo = lineas.slice(secciones[k].desde + 1, hasta)
}
const FLAT = new Set(['D0-medio', 'DT-medio', 'DM-medio', 'DA-medio'])

const dias = {}
for (const seccion of secciones) {
  const { id } = seccion
  const dia = { id, nombre: seccion.nombre, titulo_documento: seccion.titulo.replace(/^#+\s*/, ''), partes: {}, lluvia: null, quedarme: null }
  const parteNombre = FLAT.has(id) && (id === 'D0-medio' || id === 'DT-medio') ? null : 'unica'
  let parte = parteNombre ? (dia.partes[parteNombre] ??= { manana: [], comida: null, tarde: [], cena: null, noche: null }) : null
  let franja = FLAT.has(id) ? 'manana' : null
  let modo = FLAT.has(id) ? 'lista' : 'prosa'
  const tomarParte = (nombre) => (dia.partes[nombre] ??= { manana: [], comida: null, tarde: [], cena: null, noche: null })
  // (Tanda 6d) Los bloques escritos para una reserva a otra hora («El Coliseo reservado a otra hora», «Museos reservados por la tarde») son variantes: llevan sus propias listas y NO son la lista base del día.
  let bloqueVariante = false
  for (const linea of seccion.cuerpo) {
    if (!linea.trim()) continue
    // Cabeceras en negrita sueltas (no son un punto de lista)
    if (/^\*\*/.test(linea)) {
      bloqueVariante = /^\*\*(El Coliseo reservado a otra hora|Con el Coliseo reservado|Con los Museos reservados|Museos reservados|La Galería Borghese a otra hora)/.test(linea)
      const lq = /^\*\*Lista de «Prefiero quedarme en Roma»:\*\*\s*(.+)$/.exec(linea)
      if (lq) { dia.quedarme = lq[1].split('·').map((s) => s.trim()).filter(Boolean); continue }
      if (/^\*\*De mañana\b/.test(linea)) { parte = tomarParte('manana'); franja = 'manana'; modo = 'lista'; continue }
      if (/^\*\*De tarde\b/.test(linea)) { parte = tomarParte('tarde'); franja = 'tarde'; modo = 'lista'; continue }
      modo = 'prosa'
      continue
    }
    const b = /^(\s*)-\s+(.*)$/.exec(linea)
    if (!b) continue
    const profundidad = Math.floor(b[1].length / 2)
    const texto = b[2].trim()
    // («**Tarde** (cambiado el 8-oct-2026: …):»: la etiqueta con una nota entre paréntesis detrás; la nota no es parte del nombre.)
    const conNota = /^\*\*([^*:]+)\*\*\s*\([^)]*\):?\s*$/.exec(texto)
    const etiqueta = /^\*\*([^*]+?):\*\*\s*(.*)$/.exec(texto) ?? (conNota ? [texto, conNota[1], ''] : null)
    const lluvia = /^\*\*🌧\s*Si llueve:\*\*\s*(.*)$/.exec(texto)
    if (lluvia) { dia.lluvia = { texto: lluvia[1].trim(), doc: texto }; bloqueVariante = false; continue }
    if (bloqueVariante) continue
    if (etiqueta && profundidad === 0) {
      const nombreEt = norm(etiqueta[1])
      const resto = etiqueta[2].trim()
      if (nombreEt === 'manana') {
        parte = parte ?? tomarParte('unica'); franja = 'manana'; modo = 'lista'
        const hereda = /la del d[ií]a de la roma antigua \((D\d+)\)/i.exec(resto)
        if (hereda) { dia.hereda_manana_de = hereda[1]; modo = 'prosa' }
        continue
      }
      if (nombreEt === 'tarde') { parte = parte ?? tomarParte('unica'); franja = 'tarde'; modo = 'lista'; continue }
      if (nombreEt === 'comida') { parte = parte ?? tomarParte('unica'); parte.comida = mesaDe(resto, id); franja = 'tarde'; modo = FLAT.has(id) ? 'lista' : 'prosa'; continue }
      if (nombreEt === 'cena') { parte = parte ?? tomarParte('unica'); parte.cena = mesaDe(resto, id); modo = FLAT.has(id) ? 'prosa' : 'prosa'; continue }
      if (nombreEt === 'noche') { parte = parte ?? tomarParte('unica'); parte.noche = nocheDe(resto, id); modo = 'prosa'; continue }
      modo = 'prosa'
      continue
    }
    if (modo !== 'lista' || !parte || !franja) continue
    const destino = parte[franja]
    // «*de camino:* A, B, C»
    const camino = /^\*de camino:\*\s*(.*)$/.exec(texto)
    if (camino) {
      for (const nombre of partirComas(camino[1])) {
        const stop = paradaDe(nombre, id, { camino: true })
        if (stop.tipo === 'parada' && stop.modo !== 'camino') stop.modo = 'camino'
        if (stop.tipo === 'parada' && (stop.min_sin_escribir || stop.min == null)) { stop.min = 5; delete stop.min_sin_escribir }
        if (stop.min_sin_escribir === undefined && stop.min == null) stop.min = 5
        destino.push(stop)
      }
      continue
    }
    const nueva = paradaDe(texto, id)
    destino.push(nueva)
    if (nueva.empieza_dia && !parte.empieza) parte.empieza = nueva.empieza_dia
  }
  // Paradas con nombre (Tanda 6f, 4j): lo que antes iba «de camino» y ahora es parada (~10 min).
  for (const parte of Object.values(dia.partes)) for (const key of ['manana', 'tarde']) for (const stop of parte[key]) if (stop.lugar && stop.modo === 'camino' && paradasConNombre.has(stop.lugar)) { stop.modo = null; stop.min = 10; delete stop.min_sin_escribir }
  // sin_resolver: las dudas ya están; la parada no se queda en el día.
  for (const p of Object.values(dia.partes)) for (const key of ['manana', 'tarde']) p[key] = p[key].filter((stop) => !stop.sin_resolver)
  // Lo que el orden de los días mira de cada día (cierres y fechas que le van mal): se conserva de la tabla anterior, que ya vale («Qué días lleva cada viaje y el orden: igual que en DIAS_ESCRITOS_ROMA.md»).
  const viejo = antiguo(id)
  if (viejo?.fechas_malas) dia.fechas_malas = viejo.fechas_malas
  dias[id] = dia
}

// ── Variantes, pool, experiencias (prosa del documento escrita como datos, con su frase citada) ──────────────────────
for (const [id, extra] of Object.entries(variantes.dias ?? {})) {
  if (!dias[id]) { duda(id, `Las variantes hablan de un día que no está en el documento: ${id}.`, 'variantes'); continue }
  for (const key of ['variantes', 'pool', 'experiencias', 'sugerencias', 'reservas']) if (extra[key]) dias[id][key] = extra[key]
  if (extra.empieza) dias[id].empieza = extra.empieza
  if (extra.lluvia_ops && dias[id].lluvia) dias[id].lluvia.ops = extra.lluvia_ops
  // Cada frase citada tiene que seguir en el documento.
  // (Lo que cita otro fichero —`fuente`: lo que el usuario pidió en una tanda— se comprueba en ese fichero.)
  const sinNegritas = (t) => String(t).split('**').join('')
  const citasDe = (lista) => lista.filter((x) => x?.doc).map((x) => ({ doc: x.doc, fuente: x.fuente ?? null }))
  const citas = [...citasDe(extra.variantes ?? []), ...citasDe(Object.values(extra.pool ?? {})), ...citasDe(Object.values(extra.experiencias ?? {}).flat()), ...citasDe(extra.sugerencias ?? []), ...(extra.lluvia_doc ? [{ doc: extra.lluvia_doc, fuente: null }] : [])]
  for (const { doc, fuente } of citas) {
    const texto = fuente ? (fs.existsSync(fuente) ? fs.readFileSync(fuente, 'utf8') : '') : md
    if (!sinNegritas(texto).includes(sinNegritas(doc))) duda(id, `La frase citada ya no está en ${fuente ?? 'el documento'}: «${doc}».`, 'variantes')
  }
}

// ── Cambios pedidos en la tanda (cada uno cita su frase en el fichero de la tanda) ──────────────────────────────────────
for (const cambio of variantes.ajustes_base ?? []) {
  const fuente = fs.existsSync(cambio.fuente) ? fs.readFileSync(cambio.fuente, 'utf8') : ''
  const sinNegritas = (t) => String(t).split('**').join('')
  if (!sinNegritas(fuente).includes(sinNegritas(cambio.doc))) { duda(cambio.dia ?? 'todos', `La frase citada ya no está en ${cambio.fuente}: «${cambio.doc}».`, 'ajustes'); continue }
  for (const dia of Object.values(dias)) {
    if (cambio.dia && dia.id !== cambio.dia) continue
    for (const parte of Object.values(dia.partes)) {
      if (cambio.ajustar) for (const stop of parte[cambio.parte] ?? []) if (cambio.ajustar[stop.lugar]) Object.assign(stop, cambio.ajustar[stop.lugar])
      if (cambio.tercera_comida && parte.comida && !parte.comida.tercera && restaurantes.get(norm(parte.comida.restaurante))?.zone === cambio.tercera_comida.zona) parte.comida.tercera = cambio.tercera_comida.restaurante
    }
  }
}

// ── Comprobaciones de lo convertido ───────────────────────────────────────────────────────────────────────────────
for (const dia of Object.values(dias)) {
  const mesas = Object.values(dia.partes).flatMap((p) => [p.comida, p.cena].filter(Boolean))
  if (Object.keys(dia.partes).length === 0) duda(dia.id, 'El día no trae ninguna lista.', 'día')
  for (const parte of Object.values(dia.partes)) for (const stop of [...parte.manana, ...parte.tarde]) if (stop.lugar && !places.has(norm(stop.lugar)) && stop.tipo !== 'tour' && stop.tipo !== 'desayuno') duda(dia.id, `El sitio «${stop.lugar}» no está en roma.json.`, 'paradas')
  if (mesas.some((m) => !m.restaurante)) duda(dia.id, 'Una comida o cena sin restaurante reconocido.', 'mesas')
}

const salida = { formato: 'listas', fuente: DOC, generado: 'scripts/destino/listasConvertir.mjs', destino: 'roma', dias }
fs.writeFileSync(OUT, `${JSON.stringify(salida, null, 1)}\n`)
const textoDudas = ['# Dudas del convertidor (Tanda 6)', '', 'Lo que `scripts/destino/listasConvertir.mjs` no ha entendido como dato o ha tenido que completar. Se vuelve a generar al convertir.', '', ...(dudas.length ? dudas.map((d) => `- **${d.dia}** (${d.donde}): ${d.texto}`) : ['Ninguna.']), ''].join('\n')
fs.writeFileSync(DUDAS, textoDudas)
const paradas = Object.values(dias).reduce((n, d) => n + Object.values(d.partes).reduce((m, p) => m + p.manana.length + p.tarde.length, 0), 0)
console.log(JSON.stringify({ dias: Object.keys(dias).length, paradas, dudas: dudas.length }))
