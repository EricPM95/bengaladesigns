/** GET /api/admin/ventas (V35A): lo vendido en el periodo elegido (solo cobros reales). SIN funciones SQL: lee la base y calcula en `calculos.js`. Nunca datos de tarjeta ni referencias del cobro. */
import fs from 'node:fs'
import { leerBase } from './base.js'
import { calcularVentas } from './calculos.js'
import { leerPeriodo } from './periodo.js'

const enlaces = () => {
  try {
    const j = JSON.parse(fs.readFileSync(new URL('../../data/panel/enlaces.json', import.meta.url), 'utf8'))
    return { civitatis: String(j.civitatis ?? ''), stay22: String(j.stay22 ?? '') }
  } catch {
    return { civitatis: '', stay22: '' }
  }
}

export function crearServicioVentas({ admin, ahora = () => new Date() }) {
  return {
    async leer(query = {}) {
      const base = await leerBase(admin)
      const r = calcularVentas(base, { periodo: leerPeriodo(query), ahora: new Date(ahora()) })
      return { ...r, afiliados: { ...r.afiliados, enlaces: enlaces() }, avisos_de_lectura: base.avisos }
    },
  }
}
