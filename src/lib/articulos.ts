import tablas from '../../data/logros/articulos.json'
import { articuloDe, conArticulo as conArt, limpiarNombre } from '../../shared/logros/articulos.js'

/**
 * El artículo delante del nombre de un sitio de Roma (8B4): `enSitio('Coliseo')` → «en el Coliseo»; `deSitio('Coliseo')` → «del Coliseo»; `enSitio('Trastevere')` → «en Trastevere».
 * La tabla está en `data/logros/articulos.json`; un sitio que no está sale sin artículo.
 */
const roma = (tablas as unknown as Record<string, Record<string, string>>).roma
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
