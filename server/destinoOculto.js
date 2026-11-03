/**
 * EL GUARDIÁN DE LOS DESTINOS OCULTOS (LZ1, Eric: «Lanzarote oculto: nadie más puede elegirlo»). Un solo middleware para TODAS las rutas `/api/*`: si la petición trae un destino
 * (`destination`, `destino`, `city`, `destinationName` en el cuerpo o en la consulta, o el destino de un viaje dentro de `route`/`answers`) que es uno de `DESTINOS_OCULTOS`
 * y quien pide no es administrador (el mismo permiso que `/api/destinos-curados`), responde 404 como si ese destino no existiera, sin revelar nada y SIN llegar a la ruta
 * (ni a Claude de respaldo). Con administrador, o con cualquier otro destino, no hace nada. Ante cualquier fallo al comprobar al administrador: no es administrador.
 */
const sinAcentos = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const CAMPOS = ['destination', 'destino', 'city', 'destinationName']

/** Los textos de destino que trae la petición (cuerpo y consulta, un nivel dentro de route/answers/trip). */
export function destinosDeLaPeticion(req) {
  const fuentes = [req.body, req.query, req.body?.route, req.body?.answers, req.body?.trip]
  const salida = []
  for (const f of fuentes) {
    if (!f || typeof f !== 'object') continue
    for (const c of CAMPOS) if (typeof f[c] === 'string' && f[c].trim()) salida.push(f[c])
  }
  return salida
}

/** ¿Alguno de esos textos nombra un destino oculto? (por palabra completa, como los alias del motor: «Arrecife, Lanzarote» sí, «Lanzarotes» no). */
export function nombraUnOculto(textos, ocultos) {
  for (const t of textos) {
    const palabras = new Set(sinAcentos(t).split(/[^a-z]+/).filter(Boolean))
    for (const o of ocultos) if (palabras.has(o)) return true
  }
  return false
}

/** @param {{ ocultos: Set<string>, esAdminDe: (req:any)=>Promise<boolean> }} o */
export function crearGuardianDestinosOcultos({ ocultos, esAdminDe }) {
  return async function guardian(req, res, next) {
    try {
      if (ocultos.size === 0 || !nombraUnOculto(destinosDeLaPeticion(req), ocultos)) return next()
      let admin = false
      try {
        admin = (await esAdminDe(req)) === true
      } catch {
        admin = false
      }
      if (admin) return next()
      return res.status(404).json({ ok: false, error: 'Not found' })
    } catch {
      return next()
    }
  }
}
