/**
 * (V21) LA PÁGINA DEL DESTINO: las actividades de Civitatis y los hoteles, con datos de verdad de cada destino.
 *   POST /api/destino-pagina  { destination }  →  { ok, destino, actividades: [...], hoteles: [...] }
 * ACTIVIDADES: de `data/dias/<destino>/_civitatis.json` (Lanzarote: excursiones y free tours) o, si el destino no lo tiene, de las excursiones del JSON del destino (`data/pipeline_v2/<destino>.json`, Roma).
 * Solo las de nota 8,5 o más (sobre 10), sin repetir el mismo tipo (no tres de Timanfaya) y de la MÁS popular a la MENOS (por número de opiniones); como mucho 7.
 * HOTELES: de `data/dias/<destino>/_hoteles.json` (uno por zona, elegidos por Eric; la nota y las opiniones son las de Booking del día de `nota_de`). Los marcados `pendiente` no salen.
 * Los enlaces de afiliado: los de los hoteles (Stay22) van tal cual; los de Civitatis los sella la app con nuestro `aid` al abrirlos. Sin precio de hoteles. Pura: no lee la red.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const NOTA_MINIMA = 8.5
const MAXIMO = 7

/** Pura: de qué «tipo» es una actividad (para no repetir): Timanfaya, La Graciosa, Papagayo… Sin tipo conocido, ella misma. */
export function tipoDeActividad(nombre, id = '') {
  const t = `${nombre} ${id}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const tipos = [
    ['graciosa', /graciosa/],
    ['lobos', /lobos/],
    ['fuerteventura', /fuerteventura|corralejo/],
    ['timanfaya', /timanfaya|fuego/],
    ['papagayo', /papagayo/],
    ['pompeya', /pompey|pompei|napoles|sorrento|amalfi/],
    ['florencia', /florencia|pisa/],
    ['venecia', /venecia/],
    ['tivoli', /tivoli|villa adriana|villa d.este/],
    ['ostia', /ostia/],
    ['vaticano', /vatican/],
    ['coliseo', /coliseo|foro romano|palatino/],
    ['catacumbas', /catacumba|via apia/],
  ]
  return tipos.find(([, re]) => re.test(t))?.[0] ?? id ?? nombre
}

const sobre10 = (nota, max) => (typeof nota === 'number' ? (max === 5 ? nota * 2 : nota) : null)

/** Pura: de una lista de actividades en bruto ({ id, nombre, foto, nota (sobre 10), opiniones, duracion, desde, url }) deja las que valen, sin repetir tipo, de más a menos opiniones. */
export function elegirActividades(brutas, { notaMinima = NOTA_MINIMA, maximo = MAXIMO } = {}) {
  const validas = brutas
    .filter((a) => a && a.nombre && a.url && typeof a.nota === 'number' && a.nota >= notaMinima && Number.isFinite(a.opiniones) && a.opiniones > 0)
    .sort((a, b) => b.opiniones - a.opiniones)
  const vistos = new Set()
  const salida = []
  for (const a of validas) {
    const tipo = tipoDeActividad(a.nombre, a.id)
    if (vistos.has(tipo)) continue
    vistos.add(tipo)
    salida.push({ ...a, tipo })
    if (salida.length >= maximo) break
  }
  return salida
}

/**
 * (V42 §2) El orden propio de un destino: una lista de ids (orden_actividades, dentro de excursions del JSON del destino o en su _civitatis.json). Las que estén en la lista van primero y en ese orden; el resto, detrás, como estaban.
 * Sin lista, no cambia nada (Roma y Lanzarote, como hoy). Madrid lo usará (MADRID_EXPLORAR.md). Pura.
 */
export function ordenarActividades(lista, orden) {
  if (!Array.isArray(orden) || orden.length === 0) return lista
  const pos = (a) => {
    const i = orden.indexOf(a.id)
    return i < 0 ? Number.MAX_SAFE_INTEGER : i
  }
  return lista.map((a, i) => ({ a, i })).sort((x, y) => pos(x.a) - pos(y.a) || x.i - y.i).map((x) => x.a)
}

const leer = (f) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null)

/** Las actividades en bruto de un destino (Civitatis del destino si lo tiene; si no, las excursiones de su JSON). */
export function actividadesEnBruto({ civitatis, datosDestino }) {
  const salida = []
  if (civitatis?.excursiones?.length) {
    for (const e of [...civitatis.excursiones, ...(civitatis.free_tours ?? [])]) {
      salida.push({ id: e.id, nombre: e.name, foto: e.photo_url ?? null, nota: sobre10(e.rating, e.rating_max), opiniones: e.review_count, duracion: e.duration_label ?? null, desde: typeof e.price_from_eur === 'number' ? e.price_from_eur : null, gratis: e.price_from_eur === 0, url: e.url ?? null, ...((civitatis.free_tours ?? []).includes(e) ? { free_tour: true } : {}) })
    }
    return salida
  }
  const ciudad = datosDestino?.excursions?.civitatis_city ?? String(datosDestino?.destination ?? '').toLowerCase()
  for (const o of datosDestino?.excursions?.options ?? []) {
    salida.push({
      id: o.id,
      nombre: o.name,
      // (V28) La foto PEQUEÑA de la tarjeta (`-list.jpg`, ~7 KB), no la grande (~730 KB): el iPhone tardaba en cargarla.
      foto: o.photo_url || o.photo_url_big || null,
      nota: sobre10(o.rating, o.rating_max),
      opiniones: o.review_count,
      duracion: o.duration_label ?? (o.duration_hours ? `${o.duration_hours} h` : null),
      desde: typeof o.price_from_eur === 'number' ? Math.round(o.price_from_eur) : null,
      gratis: o.price_from_eur === 0,
      url: o.civitatis_slug ? `https://www.civitatis.com/es/${ciudad}/${o.civitatis_slug}/` : null,
    })
  }
  return salida
}

/** (V45 §5) Pura: de qué CATEGORÍA es (para los filtros de la página de todas): Free tours, Entradas, Excursiones (un día fuera: excursión, ferry, isla…) o Actividades (lo demás). */
export function categoriaDeActividad(a) {
  const t = `${a.nombre ?? ''}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  if (a.free_tour || /free ?tour|gratuit/.test(t)) return 'free_tour'
  if (/^entradas?\b|\bentradas? (a|al|para|del)\b|^billete|\bticket/.test(t) && !/tour|excursion/.test(t)) return 'entrada'
  if (/excursion|\bferry\b|\bisla\b|\bdesde\b|traslado|\bday ?trip\b/.test(t)) return 'excursion'
  return 'actividad'
}

/**
 * (V45 §5) Pura: TODAS las actividades de un destino (la página que abre [Ver todas] de RESERVAS): las del carrusel PRIMERO y en su orden, y luego lo demás (de Civitatis y nuestras) de más a menos opiniones, cada una con su categoría.
 * Sin repetir (por id ni por nombre). Solo las que tienen nombre y enlace.
 */
export function todasLasActividades(brutas, carrusel = []) {
  const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const vistos = new Set()
  const salida = []
  const meter = (a) => {
    if (!a || !a.nombre || !a.url) return
    const k = norm(a.nombre)
    if (vistos.has(a.id) || vistos.has(k)) return
    vistos.add(a.id)
    vistos.add(k)
    salida.push({ ...a, categoria: categoriaDeActividad(a) })
  }
  for (const a of carrusel) meter(a)
  for (const a of [...brutas].sort((x, y) => (y.opiniones ?? 0) - (x.opiniones ?? 0))) meter(a)
  return salida
}

/** Pura: los hoteles que salen (sin los pendientes ni los que no tienen todo). (V28, decisión de Eric) SIN etiqueta encima de la foto («Mejor nota de …» ni otra): foto, nombre, zona y nota con sus opiniones. */
export function hotelesDeLaPagina(archivo) {
  return (archivo?.hoteles ?? [])
    .filter((h) => !h.pendiente && h.nombre && h.stay22 && typeof h.nota === 'number' && Number.isFinite(h.opiniones))
    .map((h) => ({ id: h.id, nombre: h.nombre, zona: h.zona, nota: h.nota, opiniones: h.opiniones, nota_de: h.nota_de ?? null, foto: h.foto ?? null, foto_pequena: h.foto_pequena ?? null, enlace: h.stay22 }))
}

export function paginaDelDestino({ raiz, destination, datosDestino }) {
  const clave = String(destination ?? '').trim().toLowerCase()
  const dir = join(raiz, 'data', 'dias', clave)
  const civitatis = leer(join(dir, '_civitatis.json'))
  const brutas = actividadesEnBruto({ civitatis, datosDestino })
  const actividades = ordenarActividades(elegirActividades(brutas), civitatis?.orden_actividades ?? datosDestino?.excursions?.orden_actividades)
  // (V45 §5) Todas: el carrusel primero y lo demás de Civitatis y nuestras (las excursiones del JSON del destino) detrás. CADA CUÁNTO y CUÁNTO BAJA: va en la MISMA petición de siempre (/api/destino-pagina, estática, una vez por destino y sesión); +20-30 actividades × ~350 B = unos 8-10 KB más, no hay bucle.
  const todas = todasLasActividades([...brutas, ...(civitatis?.excursiones?.length ? actividadesEnBruto({ civitatis: null, datosDestino }) : [])], actividades)
  const hoteles = hotelesDeLaPagina(leer(join(dir, '_hoteles.json')))
  return { ok: true, destino: destination, actividades, todas, hoteles }
}

export function registrarRutaPaginaDestino(app, { raiz, findDatos }) {
  app.post('/api/destino-pagina', (req, res) => {
    const destination = String(req.body?.destination ?? '').trim()
    if (!destination) return res.status(400).json({ ok: false, error: 'Falta el destino.' })
    try {
      return res.json(paginaDelDestino({ raiz, destination, datosDestino: findDatos(destination) }))
    } catch (e) {
      console.error('[destino-pagina]', e?.message ?? e)
      return res.json({ ok: true, destino: destination, actividades: [], hoteles: [] })
    }
  })
}
