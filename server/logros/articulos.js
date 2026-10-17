import { readFileSync } from 'node:fs'
import { conArticulo as conArt } from '../../shared/logros/articulos.js'

/** Los artículos de los sitios (data/logros/articulos.json), para los mensajes del servidor: «Parece que no estás en el Coliseo». */
const TABLAS = JSON.parse(readFileSync(new URL('../../data/logros/articulos.json', import.meta.url), 'utf8'))

export const conArticulo = (destino, nombre, prep = 'en') => conArt(TABLAS[destino] ?? {}, nombre, prep)
export const tablaDe = (destino) => TABLAS[destino] ?? {}
