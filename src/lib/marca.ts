import marcaJson from '../../data/marca.json'

/**
 * La marca de la app: el nombre, el logo y los colores salen de `data/marca.json` (UN solo sitio). Ninguna pantalla ni aviso lleva el nombre escrito a mano:
 * todas lo piden aquí. Mientras el nombre no esté decidido se cambia en ese archivo y se vuelve a desplegar. `logo` es la ruta del logo cuando exista (null = el
 * hueco vacío y preparado que ya dibujan la pantalla de entrar, la de apertura y los avisos del móvil).
 */
export interface Marca {
  nombre: string
  nombre_corto: string
  descripcion: string
  /** El lema (Tanda 10: «De viajeros, para viajeros»): debajo del logo en la pantalla de apertura y descripción del manifiesto. */
  lema: string
  logo: string | null
  /** El mismo logo en su tono oscuro (el que se lee sobre fondos oscuros, como el pie de las imágenes para compartir). */
  logo_oscuro: string | null
  color_apertura: string
  color_tema: string
  color_fondo: string
}

export const marca: Marca = {
  nombre: marcaJson.nombre,
  nombre_corto: marcaJson.nombre_corto,
  descripcion: marcaJson.descripcion,
  lema: (marcaJson as { lema?: string }).lema ?? marcaJson.descripcion,
  logo: (marcaJson as { logo?: string | null }).logo ?? null,
  logo_oscuro: (marcaJson as { logo_oscuro?: string | null }).logo_oscuro ?? null,
  color_apertura: (marcaJson as { color_apertura?: string }).color_apertura ?? '#141826',
  color_tema: marcaJson.color_tema,
  color_fondo: marcaJson.color_fondo,
}

export const nombreDeLaApp = (): string => marca.nombre
