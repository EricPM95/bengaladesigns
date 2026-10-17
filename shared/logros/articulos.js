/**
 * El artículo delante del nombre de un sitio (Tanda 8B4): «en el Coliseo», «del Panteón», «en la Basílica de San Pedro», pero «en Trastevere» y «en Piazza Navona».
 * Pura: recibe la tabla (`data/logros/articulos.json › <destino>`, nombre del sitio → 'el' | 'la' | 'los' | 'las' | ''). Un nombre que no está en la tabla sale SIN artículo
 * (es mejor decir «en Foo» que «en el Foo» mal puesto). Sirve igual en el móvil y en el servidor.
 */
const norma = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s*\((noche|por fuera)\)\s*$/i, '').trim().toLowerCase()

/** El nombre del sitio sin lo que se añade a las paradas («(noche)»). */
export const limpiarNombre = (nombre) => String(nombre ?? '').replace(/\s*\((noche|por fuera)\)\s*$/i, '').trim()

/** 'el' | 'la' | 'los' | 'las' | '' */
export function articuloDe(tabla, nombre) {
  const clave = norma(nombre)
  for (const [k, v] of Object.entries(tabla ?? {})) if (norma(k) === clave) return v
  return ''
}

/** `prep`: 'en' → «en el Coliseo» · 'de' → «del Coliseo» · 'a' → «al Coliseo». Sin artículo: «en Trastevere». */
export function conArticulo(tabla, nombre, prep = 'en') {
  const n = limpiarNombre(nombre)
  const art = articuloDe(tabla, n)
  if (!art) return `${prep} ${n}`
  if (art === 'el' && prep === 'de') return `del ${n}`
  if (art === 'el' && prep === 'a') return `al ${n}`
  return `${prep} ${art} ${n}`
}
