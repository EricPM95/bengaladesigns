/**
 * LOS DATOS DE UN SITIO PARA LOS LOGROS (Tanda 8A2). Cualquier sitio del catálogo del destino cuenta para su país, su capital y su Patrimonio, esté o no en una
 * colección: lo que no se escribe sitio por sitio se saca de los valores por defecto del destino (`pais_defecto`, `capital_defecto`) y de sus excepciones
 * (`excepciones_pais`: por ejemplo, los sitios que son del Vaticano). El Patrimonio sale de la lista `sitios` de cada Patrimonio en `data/logros/<destino>.json`.
 */

/** El Patrimonio de la Humanidad al que pertenece un sitio (su id), o null. Solo cuenta lo que está en la lista `sitios` (lo «por comprobar» no cuenta). */
export function patrimonioDe(destino, id) {
  if (!id) return null
  return Object.entries(destino.patrimonios ?? {}).find(([, p]) => p.sitios?.includes(id))?.[0] ?? null
}

/** País, capital, Patrimonio, maravilla y hemisferio de un sitio del catálogo; null si no hay sitio. */
export function datosDeSitio(destino, id) {
  if (!id || !destino) return null
  const explicito = destino.sitios?.[id] ?? null
  const excepcion = Object.entries(destino.excepciones_pais ?? {}).find(([, v]) => v.sitios?.includes(id))
  const pais = explicito?.pais ?? (excepcion ? excepcion[0] : (destino.pais_defecto ?? null))
  const capital = explicito?.capital ?? (excepcion ? Boolean(excepcion[1].capital) : Boolean(destino.capital_defecto))
  return { ...(explicito ?? {}), pais, capital, patrimonio: patrimonioDe(destino, id), maravilla: explicito?.maravilla ?? null, hemisferio: explicito?.hemisferio ?? null }
}

/** Los países que tiene un destino (el de por defecto, los de sus excepciones y los que digan sus sitios). */
export function paisesDelDestino(destino) {
  const paises = new Set()
  if (destino.pais_defecto) paises.add(destino.pais_defecto)
  for (const p of Object.keys(destino.excepciones_pais ?? {})) paises.add(p)
  for (const s of Object.values(destino.sitios ?? {})) if (s.pais) paises.add(s.pais)
  return paises
}
