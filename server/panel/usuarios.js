/**
 * LOS USUARIOS DEL PANEL (V35A): ya sin funciones SQL. Se lee la base (`base.js`, solo lectura, con la clave de servicio) y se calcula en JavaScript (`calculosUsuarios.js`, funciones puras que se prueban con una base falsa).
 * Cuatro respuestas: la lista paginada (50 en 50, con «Viajan entre…»), el resumen de arriba (periodo, embudo, calendario…), y la ficha de una persona (con los reportes que ha mandado, que se leen aparte y solo de ella).
 * La base se guarda 30 segundos para no leerla entera a cada tecla del buscador.
 */
import fs from 'node:fs'
import { leerBase } from './base.js'
import { diaDe, leerPeriodo } from './periodo.js'
import { tituloDeAviso } from './calculos.js'
import { ficha as fichaDe, indiceDeDestinos, listar, prepararUsuarios, resumen } from './calculosUsuarios.js'

export { POR_PAGINA, ORDENES, FRECUENCIAS, COMPANIAS, leerFiltros, limpiarBusqueda } from './calculosUsuarios.js'

const leerDestinos = () => {
  try {
    const j = JSON.parse(fs.readFileSync(new URL('../../data/primera_vez/destinos.json', import.meta.url), 'utf8'))
    return [...(j.salida ?? []), ...(j.proximamente ?? [])]
  } catch {
    return []
  }
}

export function crearServicioUsuarios({ admin, datos, ahora = () => new Date(), leer = leerBase, ttl = 30000, destinos = leerDestinos }) {
  const conocidos = indiceDeDestinos(destinos())
  let cache = null
  const base = async () => {
    const t = Date.now()
    if (cache && t - cache.t < ttl) return cache.base
    const b = await leer(admin)
    cache = { t, base: b }
    return b
  }
  const registros = async () => {
    const b = await base()
    return { b, ...prepararUsuarios(b, { hoy: diaDe(ahora()), datos: datos(), conocidos }) }
  }
  return {
    async listar(query) {
      const { registros: r } = await registros()
      return listar(r, query, { hoy: diaDe(ahora()), conocidos })
    },
    /** El resumen de arriba. `query` lleva el periodo (`?periodo=30d`). */
    async totales(query = {}) {
      return resumen(await base(), { periodo: leerPeriodo(query), ahora: ahora(), datos: datos(), conocidos })
    },
    /** La ficha, o null si el id no es válido o no existe. */
    async ficha(id) {
      if (!/^[\w-]{1,64}$/.test(String(id))) return null
      const { registros: r } = await registros()
      let reportes = []
      if (r.some((x) => x.id === id)) {
        try {
          const { data } = await admin.from('avisos_de_viajeros').select('id,tipo,estado,creado,datos').eq('user_id', id).order('creado', { ascending: false }).limit(20)
          reportes = (data ?? []).map((a) => ({ id: a.id, tipo: a.tipo, titulo: tituloDeAviso(a), estado: a.estado, en: a.creado }))
        } catch {
          reportes = []
        }
      }
      return fichaDe(r, id, { hoy: diaDe(ahora()), ahora: ahora(), datos: datos(), reportes })
    },
  }
}
