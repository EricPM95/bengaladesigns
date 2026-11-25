import tablas from '../../data/logros/articulos.json'
import { articuloDe, conArticulo as conArt, limpiarNombre } from '../../shared/logros/articulos.js'

/**
 * El artículo delante del nombre de un sitio de Roma (8B4): `enSitio('Coliseo')` → «en el Coliseo»; `deSitio('Coliseo')` → «del Coliseo»; `enSitio('Trastevere')` → «en Trastevere».
 * La tabla está en `data/logros/articulos.json`; un sitio que no está sale sin artículo.
 */
// (V58 §5) La tabla junta los artículos de TODOS los destinos (Roma, Lanzarote…): «en el Coliseo», «en las Montañas del Fuego», «en Teguise»; vale para todos los destinos.
const roma: Record<string, string> = Object.assign({}, ...Object.entries(tablas as unknown as Record<string, Record<string, string>>).filter(([clave]) => !clave.startsWith('_')).map(([, t]) => t))
export const enSitio = (nombre: string): string => conArt(roma, nombre, 'en')
export const deSitio = (nombre: string): string => conArt(roma, nombre, 'de')
/** «la Galería Borghese», «el Coliseo»; un sitio sin artículo en la tabla («Trastevere») sale tal cual. */
export const elSitio = (nombre: string): string => {
  const limpio = limpiarNombre(nombre)
  const art = articuloDe(roma, limpio)
  return art ? `${art} ${limpio}` : limpio
}

/** ¿El sitio va en plural («los Museos Capitolinos», «las Termas de Caracalla»)? Para la concordancia del verbo: «cierran» / «cierra». */
export const sitioEnPlural = (nombre: string): boolean => {
  const art = articuloDe(roma, limpiarNombre(nombre))
  return art === 'los' || art === 'las'
}
/** «cierran los Museos Capitolinos» · «cierra la Galería Borghese» (con su artículo y el verbo en plural cuando toca). */
export const cierraElSitio = (nombre: string): string => `${sitioEnPlural(nombre) ? 'cierran' : 'cierra'} ${elSitio(nombre)}`

/**
 * (V58 §5) UNA regla para toda la app: «a el» → «al» y «de el» → «del» (también con mayúscula). Se pasa por aquí cualquier frase que junta una preposición con un nombre de sitio que ya trae su artículo
 * («el Coliseo», de `entradas_nombres_cortos`): «Tu entrada a el Coliseo» sale «Tu entrada al Coliseo». No toca «enseña el»: solo la palabra suelta «a» o «de».
 */
export const contraer = (texto: string): string => texto.replace(/(?<![p{L}p{N}])([Aa]|[Dd]e) el(?![p{L}p{N}])/gu, (_m, p: string) => (p.toLowerCase() === 'a' ? (p === 'A' ? 'Al' : 'al') : p === 'De' ? 'Del' : 'del'))

/**
 * (V58 §5) «a|de|en» + el sitio con su artículo, sea cual sea el nombre que llegue: «Coliseo» (de los datos del destino, con su artículo en la tabla) o «el Coliseo» (nombre corto que ya lo trae).
 * `lugarCon('en', 'Coliseo')` → «en el Coliseo»; `lugarCon('a', 'el Coliseo')` → «al Coliseo»; `lugarCon('en', 'Montserrat')` → «en Montserrat» (sin artículo en los datos).
 */
export const lugarCon = (prep: 'a' | 'de' | 'en', nombre: string): string => {
  const limpio = limpiarNombre(nombre)
  if (/^(el|la|los|las)s/i.test(limpio)) return contraer(`${prep} ${limpio}`)
  return contraer(`${prep} ${elSitio(limpio)}`)
}

/** (V58 §5) El artículo que dicen los DATOS del destino para este sitio: 'el' | 'la' | 'los' | 'las' | '' (sin artículo: «Montserrat») o null si el sitio no está en la tabla (entonces quien llama adivina por la terminación). */
export const articuloDeLosDatos = (nombre: string): string | null => {
  const limpio = limpiarNombre(nombre)
  const clave = limpio.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  for (const [k, v] of Object.entries(roma)) if (k.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() === clave) return v
  return null
}
