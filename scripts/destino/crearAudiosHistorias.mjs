/**
 * Crea los audios de las historias (Tanda 6y9). SE LANZA UNA SOLA VEZ, justo antes de abrir la app, cuando Eric ya tiene la clave:
 *
 *     node scripts/destino/crearAudiosHistorias.mjs
 *
 * Qué hace: lee las historias de data/pipeline_v2/detalle/<destino>/*.json (campo `historia`), y para cada una que NO tenga ya su audio al día
 * crea el .mp3 con la voz elegida (shared/audio/historiasAudio.js) y lo guarda en public/audios/<destino>/<sitio>-<huella>.mp3 (la huella sale del texto y de la voz: un nombre que no se puede adivinar; Tanda 6y10).
 * Apunta en data/audios/<destino>.json, por sitio, la huella del texto con el que se creó: si la historia cambia (o cambia la voz o sus ajustes),
 * la próxima vez SOLO se rehace ese audio. Los que ya están al día no se tocan ni gastan créditos.
 *
 * Opciones:
 *   --simular        no llama a nadie: dice qué crearía y cuántos caracteres (créditos) gastaría. No necesita clave.
 *   --solo=<sitio>   solo ese sitio (su nombre o su identificador, p. ej. --solo=fontana_de_trevi).
 *   --destino=<d>    otro destino (por defecto, roma).
 *
 * La clave ELEVENLABS_API_KEY se lee de .env.local (o del entorno). Nunca se escribe en ningún fichero ni se muestra.
 * El «secreto» AUDIOS_SECRETO (Tanda 7) se lee igual y entra en la huella de cada audio; el servidor usa el mismo. Sin él, el programa avisa y se comporta como antes.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MAX_CARACTERES_POR_LLAMADA, VOZ_HISTORIAS, huellaDeLaVoz, huellaDelTexto, identificadorDeSitio, nombreDelFichero, secretoDeAudios, textoDelAudio } from '../../shared/audio/historiasAudio.js'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const argumentos = process.argv.slice(2)
const opcion = (nombre) => argumentos.find((a) => a.startsWith(`--${nombre}=`))?.slice(nombre.length + 3)
const simular = argumentos.includes('--simular')
const solo = opcion('solo')
const destino = opcion('destino') ?? 'roma'

const carpetaDetalle = join(raiz, 'data', 'pipeline_v2', 'detalle', destino)
const carpetaAudios = join(raiz, 'public', 'audios', destino)
const rutaIndice = join(raiz, 'data', 'audios', `${destino}.json`)

/** Una variable, de .env.local o del entorno. Se devuelve para usarla; nunca se imprime ni se guarda. */
function leerVariable(nombre) {
  if (process.env[nombre]?.trim()) return process.env[nombre].trim()
  const ruta = join(raiz, '.env.local')
  if (!existsSync(ruta)) return ''
  for (const linea of readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const m = new RegExp(`^\\s*${nombre}\\s*=\\s*(.*?)\\s*$`).exec(linea)
    if (m) return m[1].replace(/^['"]|['"]$/g, '')
  }
  return ''
}
const leerClave = () => leerVariable('ELEVENLABS_API_KEY')

// (Tanda 7) El secreto de la casa entra en la huella de cada audio. El servidor lo lee de su entorno (.env.local en local, las variables de Vercel en producción):
// aquí se pone en el entorno de este programa, así que `nombreDelFichero` (shared/audio/historiasAudio.js) lo usa igual que el servidor. Nunca se muestra ni se guarda.
if (!process.env.AUDIOS_SECRETO?.trim()) {
  const secreto = leerVariable('AUDIOS_SECRETO')
  if (secreto) process.env.AUDIOS_SECRETO = secreto
}
const conSecreto = Boolean(secretoDeAudios())

/** Las historias del destino: { id, nombre, texto, huella }. */
function leerHistorias() {
  if (!existsSync(carpetaDetalle)) return []
  const lista = []
  for (const fichero of readdirSync(carpetaDetalle).sort()) {
    if (!fichero.endsWith('.json')) continue
    const datos = JSON.parse(readFileSync(join(carpetaDetalle, fichero), 'utf8'))
    for (const lugar of datos.places ?? []) {
      const texto = textoDelAudio(lugar?.historia)
      if (!texto) continue
      const id = identificadorDeSitio(lugar.name)
      lista.push({ id, nombre: lugar.name, texto, huella: huellaDelTexto(lugar.historia), fichero: nombreDelFichero(id, lugar.historia) })
    }
  }
  return lista
}

/** Parte el texto en trozos de como mucho `max` caracteres, cortando por frases (para el caso de una historia más larga que el máximo de una llamada). */
function trocear(texto, max = MAX_CARACTERES_POR_LLAMADA) {
  if (texto.length <= max) return [texto]
  const frases = texto.match(/[^.!?…]+[.!?…]*\s*/g) ?? [texto]
  const trozos = []
  let actual = ''
  for (const frase of frases) {
    if (actual && (actual + frase).length > max) {
      trozos.push(actual.trim())
      actual = ''
    }
    actual += frase
  }
  if (actual.trim()) trozos.push(actual.trim())
  return trozos
}

/** Pide un trozo de audio a la voz. Devuelve los bytes del .mp3. Si falla, lanza un error SIN datos de la petición (nunca la clave). */
async function pedirAudio(clave, texto) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOZ_HISTORIAS.id_voz}?output_format=${VOZ_HISTORIAS.formato}`
  const respuesta = await fetch(url, {
    method: 'POST',
    headers: { 'xi-api-key': clave, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({
      text: texto,
      model_id: VOZ_HISTORIAS.modelo,
      language_code: VOZ_HISTORIAS.idioma,
      voice_settings: { stability: VOZ_HISTORIAS.estabilidad, similarity_boost: VOZ_HISTORIAS.similitud },
    }),
  })
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.text().catch(() => '')).slice(0, 300)
    throw new Error(`La voz contestó ${respuesta.status}: ${cuerpo}`)
  }
  return Buffer.from(await respuesta.arrayBuffer())
}

function leerIndice() {
  try {
    return JSON.parse(readFileSync(rutaIndice, 'utf8'))
  } catch {
    return { sitios: {} }
  }
}

function guardarIndice(indice) {
  mkdirSync(dirname(rutaIndice), { recursive: true })
  const temporal = `${rutaIndice}.tmp`
  writeFileSync(temporal, `${JSON.stringify(indice, null, 2)}\n`, 'utf8')
  renameSync(temporal, rutaIndice)
}

const numero = (n) => n.toLocaleString('es-ES')

async function principal() {
  const historias = leerHistorias()
  const elegidas = solo ? historias.filter((h) => h.id === identificadorDeSitio(solo)) : historias
  if (solo && elegidas.length === 0) {
    console.log(`No hay ninguna historia con el sitio «${solo}». No se hace nada.`)
    process.exitCode = 1
    return
  }
  const indice = leerIndice()
  const vozAhora = huellaDeLaVoz()
  const vozCambio = Boolean(indice.voz) && indice.voz !== vozAhora
  const alDia = (h) => {
    const entrada = indice.sitios?.[h.id]
    return Boolean(entrada) && !vozCambio && entrada.huella_texto === h.huella && entrada.fichero === h.fichero && existsSync(join(carpetaAudios, h.fichero))
  }
  const pendientes = elegidas.filter((h) => !alDia(h))
  const caracteres = pendientes.reduce((suma, h) => suma + h.texto.length, 0)

  console.log(`Destino: ${destino}. Historias: ${elegidas.length}. Ya al día: ${elegidas.length - pendientes.length}. Por crear: ${pendientes.length}.`)
  if (!conSecreto) {
    console.log('AVISO: no hay AUDIOS_SECRETO. Los nombres de los audios se calculan solo con el texto y la voz, y alguien que conozca la historia podría adivinarlos. Pon AUDIOS_SECRETO=... en el archivo .env.local (y el mismo valor en las variables de entorno de Vercel) antes de crear los audios definitivos.')
  } else {
    console.log('AUDIOS_SECRETO puesto: entra en el nombre de cada audio. Tiene que ser el mismo valor en el servidor; si lo cambias, los audios se recrean con nombres nuevos y los viejos dejan de usarse.')
  }
  if (vozCambio) console.log('La voz o sus ajustes han cambiado desde la última vez: se rehacen todos los audios.')
  if (vozCambio && solo && !simular) {
    console.log('Con la voz o los ajustes cambiados hay que rehacerlos todos: lanza la orden sin --solo. No se ha hecho nada.')
    process.exitCode = 1
    return
  }
  if (simular) {
    for (const h of pendientes) {
      const viejo = indice.sitios?.[h.id]?.fichero
      if (viejo && viejo !== h.fichero) console.log(`  (${h.id}: el texto o la voz ha cambiado: hay que recrearlo; el fichero viejo ${viejo} dejará de usarse)`)
    }
    for (const h of pendientes) console.log(`  crearía ${h.fichero}  (${numero(h.texto.length)} caracteres)`)
    console.log(`Modo simulación: no se ha llamado a nadie ni se ha escrito nada. Gastaría unos ${numero(caracteres)} caracteres (créditos) de la voz.`)
    return
  }
  if (pendientes.length === 0) {
    console.log('Todos los audios están al día. No hace falta hacer nada.')
    return
  }

  const clave = leerClave()
  if (!clave) {
    console.log('Falta la clave de la voz: pon ELEVENLABS_API_KEY=... en el archivo .env.local (en la carpeta del proyecto) y vuelve a lanzar la orden. No se ha hecho nada.')
    process.exitCode = 1
    return
  }

  mkdirSync(carpetaAudios, { recursive: true })
  indice.destino = destino
  indice.voz = vozAhora
  indice.voz_ajustes = { ...VOZ_HISTORIAS }
  indice.sitios ??= {}
  const sobrantes = []
  let hechos = 0
  let gastados = 0
  for (const h of pendientes) {
    process.stdout.write(`Creando ${h.fichero} (${numero(h.texto.length)} caracteres)... `)
    try {
      const partes = []
      for (const trozo of trocear(h.texto)) partes.push(await pedirAudio(clave, trozo))
      const fichero = h.fichero
      const anterior = indice.sitios[h.id]?.fichero
      writeFileSync(join(carpetaAudios, fichero), Buffer.concat(partes))
      indice.sitios[h.id] = { nombre: h.nombre, fichero, huella_texto: h.huella, caracteres: h.texto.length, creado: new Date().toISOString().slice(0, 10) }
      guardarIndice(indice)
      if (anterior && anterior !== fichero) sobrantes.push(anterior)
      hechos++
      gastados += h.texto.length
      console.log('hecho.')
    } catch (error) {
      console.log('FALLÓ.')
      console.log(`  ${error.message}`)
      console.log(`Se para aquí. Hechos ${hechos} de ${pendientes.length}. Al volver a lanzar la orden solo se crean los que faltan.`)
      process.exitCode = 1
      return
    }
  }
  if (sobrantes.length) console.log(`Ficheros viejos que ya no se usan (puedes borrarlos de ${carpetaAudios}): ${sobrantes.join(", ")}`)
  console.log(`Terminado: ${hechos} audios creados, ${numero(gastados)} caracteres gastados.`)
}

principal().catch((error) => {
  console.log(`Error inesperado: ${error.message}`)
  process.exitCode = 1
})
