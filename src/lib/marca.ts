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
  logo: string | null
  color_apertura: string
  color_tema: string
  color_fondo: string
}

export const marca: Marca = {
  nombre: marcaJson.nombre,
  nombre_corto: marcaJson.nombre_corto,
  descripcion: marcaJson.descripcion,
  logo: (marcaJson as { logo?: string | null }).logo ?? null,
  color_apertura: (marcaJson as { color_apertura?: string }).color_apertura ?? '#141826',
  color_tema: marcaJson.color_tema,
  color_fondo: marcaJson.color_fondo,
}

export const nombreDeLaApp = (): string => marca.nombre
