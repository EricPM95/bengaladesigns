/**
 * (Tanda 10S10, apartado 2) CÓMO SE VE UN SITIO: «por dentro y por fuera» o «solo por dentro». De nuestros datos, sin inventar nada:
 *
 *  · `dentro_y_fuera`: un sitio con horario de apertura que además tiene su texto «por fuera» (`por_fuera` / `minutos_fuera` en los datos del destino): si a esa hora está cerrado, se ve desde fuera igualmente (el Coliseo, el Castillo de Sant'Angelo, el Panteón…).
 *  · `solo_dentro`: un sitio con horario que se visita por dentro y NO tiene texto «por fuera» (los Museos Vaticanos, los Museos Capitolinos…), y los recintos cerrados con horario (el Bioparque, el Cementerio Protestante).
 *  · null: un sitio sin horario (una plaza, una calle, una fuente), o un parque/mirador abierto: no lleva aviso.
 *
 * El dato manda: si un sitio trae `ver_por` escrito a mano en el JSON del destino, gana sobre la regla (la Galería Borghese: Eric, 1-nov, se ve solo por dentro aunque tenga texto «por fuera»).
 *
 * Y el nombre con su artículo para la frase del aviso («el Castillo de Sant'Angelo», «los Museos Vaticanos»): por la primera palabra, con una tabla de excepciones. Lo usan el servidor (lo manda con el horario del sitio) y la tabla del REPASO.
 */

/** Los ids que Eric ha decidido a mano (si el JSON no lo trae escrito). */
export const VER_POR_A_MANO = {
  galeria_borghese: 'solo_dentro',
  // (10S11, Eric 1-nov) La subida a la cúpula es solo por dentro: no se ve «por fuera» como la basílica.
  cupula_de_san_pedro: 'solo_dentro',
}

/** Cómo se dice el sitio en la frase del aviso, cuando el nombre largo del dato no sirve. */
export const NOMBRE_DE_AVISO = {
  museos_vaticanos_y_capilla_sixtina: 'los Museos Vaticanos',
  foro_romano_y_palatino: 'el Foro Romano',
  san_pietro_in_montorio_y_tempietto_de_bramante: 'la Iglesia de San Pietro in Montorio',
  santa_maria_del_popolo: 'la Iglesia de Santa Maria del Popolo',
  trinita_dei_monti: 'la Iglesia de la Trinità dei Monti',
  iglesia_de_san_luigi_dei_francesi: 'la Iglesia de San Luigi dei Francesi',
  iglesia_de_santa_maria_sopra_minerva: 'la Iglesia de Santa Maria sopra Minerva',
  iglesia_de_san_ignacio_de_loyola: 'la Iglesia de San Ignacio de Loyola',
  iglesia_de_santa_maria_della_vittoria: 'la Iglesia de Santa Maria della Vittoria',
  iglesia_de_santa_maria_in_trastevere: 'la Iglesia de Santa Maria in Trastevere',
  iglesia_de_san_pietro_in_vincoli: 'la Iglesia de San Pietro in Vincoli',
}

const MASCULINO = new Set(['coliseo', 'foro', 'panteon', 'castillo', 'altar', 'arco', 'puente', 'palazzo', 'teatro', 'mercado', 'templo', 'jardin', 'cementerio', 'bioparque', 'parque', 'mirador', 'museo', 'ara', 'barrio', 'circo'])
const FEMENINO = new Set(['fundacion', 'casa', 'cueva', 'basilica', 'iglesia', 'galeria', 'cupula', 'domus', 'cripta', 'villa', 'catedral', 'terraza', 'fontana', 'plaza', 'trinita', 'capilla', 'isla', 'piramide'])
// (HOY2b 8b: 'jameos' y 'montañas' —Lanzarote— para que las frases de HOY digan «los Jameos del Agua» y «las Montañas del Fuego».)
const MASCULINO_PLURAL = new Set(['museos', 'mercados', 'jardines', 'foros', 'jameos'])
const FEMENINO_PLURAL = new Set(['termas', 'catacumbas', 'ruinas', 'montanas'])

const sinTildes = (texto) => String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/**
 * El nombre con su artículo y su concordancia.
 * @param {string} nombre  el nombre del sitio en los datos
 * @param {string} [id]    su id (para las excepciones)
 * @returns {{ frase: string, genero: 'm'|'f', plural: boolean }}
 */
export function nombreParaAviso(nombre, id) {
  const clave = id && NOMBRE_DE_AVISO[id] ? NOMBRE_DE_AVISO[id] : null
  const texto = clave ?? String(nombre ?? '').trim()
  const base = sinTildes(texto)
  const primera = base.split(/\s+/)[0].split('-')[0]
  // Si el nombre ya trae su artículo («La Geria»), se queda con él, en minúscula dentro de la frase.
  if (/^(el|la|los|las)$/.test(primera) && base.split(/\s+/).length > 1) {
    const [art, ...resto] = texto.split(/\s+/)
    const a = art.toLowerCase()
    return { frase: `${a} ${resto.join(' ')}`, genero: a === 'la' || a === 'las' ? 'f' : 'm', plural: a === 'los' || a === 'las' }
  }
  let genero = 'm'
  let plural = false
  let articulo = null
  if (clave) {
    const [art] = clave.split(/\s+/)
    articulo = /^(el|la|los|las)$/i.test(art) ? art.toLowerCase() : null
    genero = articulo === 'la' || articulo === 'las' ? 'f' : 'm'
    plural = articulo === 'los' || articulo === 'las'
    return { frase: clave, genero, plural }
  }
  if (MASCULINO_PLURAL.has(primera)) ({ articulo, genero, plural } = { articulo: 'los', genero: 'm', plural: true })
  else if (FEMENINO_PLURAL.has(primera)) ({ articulo, genero, plural } = { articulo: 'las', genero: 'f', plural: true })
  else if (FEMENINO.has(primera)) ({ articulo, genero } = { articulo: 'la', genero: 'f' })
  else if (MASCULINO.has(primera)) ({ articulo, genero } = { articulo: 'el', genero: 'm' })
  // «San Pietro in Montorio», «Santa Maria del Popolo»: sin artículo.
  return { frase: articulo ? `${articulo} ${texto}` : texto, genero, plural }
}

/** ¿Tiene horario de apertura de verdad (no 24 h, no «00:00-24:00»)? */
function tieneHorarioDeApertura(lugar) {
  if (lugar.abierto_24h === true) return false
  const hay = lugar.windows != null || lugar.schedule != null || lugar.by_period != null || lugar.by_day != null || lugar.by_season != null || lugar.special_hours != null
  if (!hay) return false
  const franjas = Array.isArray(lugar.windows) ? lugar.windows : null
  if (franjas && franjas.length > 0 && franjas.every((franja) => /^00:00\s*-\s*24:00$/.test(String(franja)))) return false
  return true
}

/**
 * Cómo se ve un sitio de los datos del destino.
 * @param {object} lugar  un elemento de `places` del JSON (con `id`, `type`, `por_fuera`…)
 * @returns {'dentro_y_fuera'|'solo_dentro'|null}
 */
export function verPorDeLugar(lugar) {
  if (!lugar || typeof lugar !== 'object') return null
  if (lugar.ver_por === 'dentro_y_fuera' || lugar.ver_por === 'solo_dentro') return lugar.ver_por
  if (lugar.id && VER_POR_A_MANO[lugar.id]) return VER_POR_A_MANO[lugar.id]
  if (!tieneHorarioDeApertura(lugar)) return null
  const conTextoPorFuera = Boolean(lugar.por_fuera) || Number.isFinite(lugar.minutos_fuera)
  if (lugar.type === 'interior') return conTextoPorFuera ? 'dentro_y_fuera' : 'solo_dentro'
  // Un recinto cerrado con horario (no un parque ni un mirador abierto): el Bioparque, el Cementerio Protestante.
  if (lugar.id === 'bioparque_de_roma' || lugar.id === 'cementerio_protestante') return 'solo_dentro'
  return null
}

/**
 * La línea del aviso de horario (la misma frase la usa la tarjeta y la tabla del REPASO).
 * @param {{ tipo: 'cerrado'|'sin_abrir'|'noche', verPor?: string|null, nombre: { frase: string, genero: 'm'|'f', plural: boolean }|null, hueco?: boolean }} datos
 */
export function frasePorHora({ tipo, verPor, nombre, hueco = false }) {
  if (tipo === 'noche') return 'Esta parada es para verla de noche: a esta hora posiblemente aún sea de día.'
  const plural = nombre?.plural ?? false
  if (tipo === 'sin_abrir') return `A esta hora, posiblemente aún no ${plural ? 'hayan' : 'haya'} abierto.`
  if (!nombre) return null
  const cerrado = nombre.plural ? (nombre.genero === 'f' ? 'cerradas' : 'cerrados') : nombre.genero === 'f' ? 'cerrada' : 'cerrado'
  const estar = `${hueco ? '' : 'ya '}${plural ? 'estén' : 'esté'} ${cerrado}`
  if (verPor === 'dentro_y_fuera') {
    const verlo = nombre.plural ? (nombre.genero === 'f' ? 'verlas' : 'verlos') : nombre.genero === 'f' ? 'verla' : 'verlo'
    return `A esta hora, posiblemente ${nombre.frase} ${estar}, pero puedes ${verlo} por fuera igualmente.`
  }
  return `A esta hora, posiblemente ${nombre.frase} ${estar}.`
}
