/**
 * LG1 §1 — la pestaña «Logros» de la ficha de un lugar: LO QUE DECIDE (puro, sin React, para poder probarlo).
 * Parte de lo mismo que la hoja de logros de hoy: `GET /api/logros/estado` (colecciones con sus sitios, el nombre de cada uno y si está visto). Ningún dato nuevo, ningún número a mano:
 *   - las colecciones de este sitio son las del estado en las que sale un sitio con su nombre (el de la parada, sin el «(noche)»);
 *   - «3 de 8» = lo que cuenta el servidor (`n` de `total`); «Te faltan 5 sitios» = total − n;
 *   - cada sitio de la lista es «Visto» (verde con ✓), «Estás aquí · te falta este» (naranja; solo si es el de esta ficha y aún no lo tiene) o «Por ver».
 */
import { conArticulo, limpiarNombre } from '../../../../shared/logros/articulos.js'
import tablas from '../../../../data/logros/articulos.json' with { type: 'json' }
import type { EstadoLogros } from '../momentos/api'

export type EstadoDeSitio = 'visto' | 'este' | 'pendiente'

export interface SitioDeTarjeta {
  sitio: string
  nombre: string
  estado: EstadoDeSitio
}

export interface TarjetaDeColeccion {
  id: string
  nombre: string
  n: number
  total: number
  completa: boolean
  /** Los ids de los sitios ya vistos (los pedazos de color de la insignia). */
  ganados: string[]
  sitios: SitioDeTarjeta[]
}

const norma = (s: string): string => limpiarNombre(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Las colecciones en las que está el sitio de la ficha, con el estado de cada sitio. Vacío (la pestaña no sale) si el sitio no está en ninguna. */
export function coleccionesDelSitio(estado: EstadoLogros | null, nombreDelSitio: string): TarjetaDeColeccion[] {
  if (!estado || !nombreDelSitio) return []
  const clave = norma(nombreDelSitio)
  const salida: (TarjetaDeColeccion & { orden: number })[] = []
  for (const c of estado.colecciones ?? []) {
    const nombreDe = (s: { sitio: string; nombre?: string }) => s.nombre ?? s.sitio
    if (!c.sitios.some((s) => norma(nombreDe(s)) === clave)) continue
    salida.push({
      id: c.id,
      nombre: c.nombre,
      n: c.n,
      total: c.total,
      completa: c.completa,
      ganados: c.sitios.filter((s) => s.visto).map((s) => s.sitio),
      sitios: c.sitios.map((s) => ({ sitio: s.sitio, nombre: nombreDe(s), estado: s.visto ? 'visto' : norma(nombreDe(s)) === clave ? 'este' : 'pendiente' })),
      orden: (c as { orden?: number }).orden ?? 99,
    })
  }
  return salida.sort((a, b) => a.orden - b.orden).map(({ orden: _orden, ...tarjeta }) => tarjeta)
}

/** «Te faltan 5 sitios» / «Te falta 1 sitio» / «Colección completa». */
export function textoDeFaltan(t: Pick<TarjetaDeColeccion, 'n' | 'total' | 'completa'>): string {
  const faltan = Math.max(0, t.total - t.n)
  if (t.completa || faltan === 0) return 'Colección completa'
  return faltan === 1 ? 'Te falta 1 sitio' : `Te faltan ${faltan} sitios`
}

/** El texto de cada sitio de la lista. */
export const TEXTO_DE_SITIO: Record<EstadoDeSitio, string> = { visto: 'Visto', este: 'Estás aquí · te falta este', pendiente: 'Por ver' }

/** «La Fontana de Trevi suma en 3 colecciones» (con el artículo de los datos; «Los Jameos del Agua suman…»; sin artículo: «Trastevere suma…»). */
export function tituloDeLogros(destino: string, nombreDelSitio: string, colecciones: number): string {
  const nombre = limpiarNombre(nombreDelSitio)
  const tabla = (tablas as unknown as Record<string, Record<string, string>>)[destino] ?? {}
  const con = conArticulo(tabla, nombre, 'en') // «en la Fontana de Trevi» / «en Trastevere»
  const art = /^en (el|la|los|las) /.exec(con)?.[1] ?? ''
  const sujeto = art ? `${art[0]!.toUpperCase()}${art.slice(1)} ${nombre}` : nombre
  const plural = art === 'los' || art === 'las'
  return `${sujeto} ${plural ? 'suman' : 'suma'} en ${colecciones} ${colecciones === 1 ? 'colección' : 'colecciones'}`
}
