/**
 * LO QUE PIDEN LAS PANTALLAS DE LA 8C2 (rutas nuevas, solo de lectura salvo donde se diga). Cada archivo es de una parte de las pantallas y registra sus propias rutas
 * (`registrar(app, ctx)`), para que dos personas no editen el mismo archivo:
 *   ganados.js   Todos mis logros, la vitrina, la ficha de un logro, Mi colección
 *   destino.js   la página de cada destino, una colección por dentro, un viaje guardado
 *   previos.js   «¿Dónde has estado ya?» y el pasaporte
 *   perfil.js    el Perfil (nivel, rango, título, marco)
 * `ctx` = { conUsuario, servicio, repo, datos, catalogos, ahora }. `servicio.cargar(userId)` da los hechos y lo ganado; `servicio.aItems(c.logros)` lo pasa a mapa de claves.
 */
import { registrar as ganados } from './ganados.js'
import { registrar as destino } from './destino.js'
import { registrar as previos } from './previos.js'
import { registrar as perfil } from './perfil.js'

export function registrarPantallas(app, ctx) {
  for (const registrar of [ganados, destino, previos, perfil]) registrar(app, ctx)
}
