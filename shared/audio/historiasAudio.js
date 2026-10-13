/**
 * Los audios de las historias (Tanda 6y9): lo que comparten el programa que los crea (scripts/destino/crearAudiosHistorias.mjs)
 * y el servidor, que solo ofrece un audio si sigue siendo el de la historia que hay ahora (mismo texto = misma huella).
 * Aquí, y en ningún otro sitio, se decide el nombre del fichero, qué texto se manda a la voz y cómo se calcula su huella.
 */
import { createHash } from 'node:crypto'

/** La voz y los ajustes elegidos por Eric (PENDIENTES_ESCUCHAR.md). Si cambia cualquiera de ellos, el programa rehace los audios. */
export const VOZ_HISTORIAS = {
  /** El nombre con el que Eric la eligió, solo para el índice y el informe (nunca sale en la app). */
  nombre: 'Javier Rojas - Calm & Friendly',
  id_voz: 'RxPoOxDaJiOdJGnMMaql',
  /** A CONFIRMAR AL LANZAR: el identificador exacto de «Eleven v4» en la API de texto a voz. Es el valor más probable; se cambia aquí y en ningún otro sitio. */
  modelo: 'eleven_v4',
  estabilidad: 0.75,
  similitud: 0.75,
  /** v4 no lleva control de estilo. */
  formato: 'mp3_44100_128',
  idioma: 'es',
}

/** Máximo de caracteres por llamada. Las historias miden unos 2.400; si un día una pasa de aquí, el programa la parte por párrafos. */
export const MAX_CARACTERES_POR_LLAMADA = 4500

/** El texto que se manda a la voz: la historia con los espacios y saltos de línea normalizados, sin nada más. */
export function textoDelAudio(historia) {
  return typeof historia === 'string' ? historia.replace(/\s+/g, ' ').trim() : ''
}

/** La huella del texto (sha-256): cambia en cuanto cambia una letra de la historia. */
export function huellaDelTexto(historia) {
  return createHash('sha256').update(textoDelAudio(historia), 'utf8').digest('hex')
}

/** Una huella de la voz y los ajustes: si cambian, hay que rehacer todos los audios. */
export function huellaDeLaVoz(voz = VOZ_HISTORIAS) {
  const { nombre: _nombre, ...ajustes } = voz
  return createHash('sha256').update(JSON.stringify(ajustes), 'utf8').digest('hex').slice(0, 16)
}

/** El nombre del fichero de un sitio: su nombre sin tildes, en minúsculas y con guiones bajos («Fontana de Trevi» -> fontana_de_trevi). */
export function identificadorDeSitio(nombre) {
  return String(nombre ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/** Cuántos caracteres hexadecimales de la huella lleva el nombre del fichero (24 = 96 bits: no se puede adivinar). */
export const LARGO_HUELLA_EN_NOMBRE = 24

/**
 * El «secreto» de la casa (Tanda 7): una variable de entorno, `AUDIOS_SECRETO`, que entra en la huella de cada audio. Sin él, alguien que conozca el texto
 * de una historia y la voz (que no son secretos) podría calcular el nombre del fichero; con él, no. Es el MISMO en el programa que crea los audios
 * (scripts/destino/crearAudiosHistorias.mjs) y en el servidor (/api/historia-audio): se lee aquí, en un solo sitio, y nunca se escribe en un fichero, un índice ni un mensaje.
 * Sin valor puesto, todo se comporta como antes de la Tanda 7 (misma huella, mismos nombres) y el programa avisa.
 */
export function secretoDeAudios() {
  return String(process.env.AUDIOS_SECRETO ?? '').trim()
}

/**
 * La huella del AUDIO (Tanda 6y10): sha-256 del texto de la historia (normalizado) + la voz y todos sus ajustes (id de voz, modelo, estabilidad, similitud, formato, idioma)
 * + (Tanda 7) el secreto de la casa, si lo hay.
 * Mismo texto con la misma voz y el mismo secreto = misma huella; cambia una letra del texto, o la voz, o el modelo, o el secreto, y cambia entera.
 * Sin secreto (cadena vacía) la huella es exactamente la de antes: no se añade nada al cálculo.
 */
export function huellaDelAudio(historia, voz = VOZ_HISTORIAS, secreto = secretoDeAudios()) {
  const { nombre: _nombre, ...ajustes } = voz
  const entrada = { texto: textoDelAudio(historia), voz: ajustes }
  if (secreto) entrada.secreto = secreto
  return createHash('sha256').update(JSON.stringify(entrada), 'utf8').digest('hex')
}

/** El nombre del fichero de un audio: `<sitio>-<huella>.mp3`. Sin conocer el texto exacto, la voz y el secreto no se puede calcular, y no hay ninguna lista pública que lo diga. */
export function nombreDelFichero(idSitio, historia, voz = VOZ_HISTORIAS, secreto = secretoDeAudios()) {
  return `${idSitio}-${huellaDelAudio(historia, voz, secreto).slice(0, LARGO_HUELLA_EN_NOMBRE)}.mp3`
}

/** La ruta pública del audio (la que el navegador pide): /audios/<destino>/<fichero con huella>. */
export const rutaPublicaDelAudio = (destino, fichero) => `/audios/${destino}/${fichero}`

/**
 * El audio que toca ofrecer para una historia: la ruta SOLO de ese sitio, y solo si el índice lo tiene con el nombre que corresponde al texto y la voz de AHORA; si no, null.
 * `indice` es data/audios/<destino>.json (solo en el servidor, nunca público): { voz, sitios: { <id>: { fichero, huella_texto, caracteres } } }.
 */
export function audioVigente(indice, destino, nombre, historia, secreto = secretoDeAudios()) {
  const id = identificadorDeSitio(nombre)
  const entrada = indice?.sitios?.[id]
  if (!entrada || !entrada.fichero || entrada.huella_texto !== huellaDelTexto(historia)) return null
  if (entrada.fichero !== nombreDelFichero(id, historia, VOZ_HISTORIAS, secreto)) return null
  return rutaPublicaDelAudio(destino, entrada.fichero)
}
