/**
 * GET /api/admin/inicio (V35A): los números de la primera pantalla del panel, para el periodo elegido (`?periodo=30d`…). SIN funciones SQL: lee la base (`base.js`) y calcula en `calculos.js`. Los reportes nuevos y las fotos
 * por aprobar salen de `avisos_de_viajeros` (solo cuentas y el último aviso de cada uno, nada de fotos ni de datos personales).
 */
import { leerBase } from './base.js'
import { calcularInicio } from './calculos.js'
import { leerPeriodo } from './periodo.js'

/** Los reportes: cuántos nuevos, cuántas fotos esperan y los últimos que han llegado. */
export async function leerResumenDeAvisos(admin) {
  const cuenta = async (q) => {
    const { count } = await q
    return Number(count) || 0
  }
  try {
    const [nuevos, fotos, recientes] = await Promise.all([
      cuenta(admin.from('avisos_de_viajeros').select('id', { count: 'exact', head: true }).eq('estado', 'nuevo').neq('tipo', 'foto')),
      cuenta(admin.from('avisos_de_viajeros').select('id', { count: 'exact', head: true }).eq('tipo', 'foto').in('estado', ['nuevo', 'visto'])),
      admin.from('avisos_de_viajeros').select('id,creado,tipo,estado,datos').eq('estado', 'nuevo').order('creado', { ascending: false }).limit(8),
    ])
    return { nuevos, fotos, recientes: recientes.data ?? [] }
  } catch {
    return { nuevos: 0, fotos: 0, recientes: [] }
  }
}

export function crearServicioInicio({ admin, correo, avisoInterno, ahora = () => new Date() }) {
  return {
    async leer(query = {}) {
      // El menú solo necesita los dos números rojos (reportes nuevos y fotos): sin leer toda la base.
      if (query.resumen === '1') {
        const a = await leerResumenDeAvisos(admin)
        return { ok: true, reportes_nuevos: a.nuevos, fotos_por_aprobar: a.fotos }
      }
      const [base, avisos] = await Promise.all([leerBase(admin), leerResumenDeAvisos(admin)])
      // De paso, si hay reportes sin avisar y ya toca, sale el correo interno (nunca rompe la pantalla).
      if (avisoInterno) await avisoInterno.intentar()
      return { ...calcularInicio(base, avisos, { periodo: leerPeriodo(query), ahora: new Date(ahora()) }), correo: { activo: Boolean(correo?.activo) }, avisos_de_lectura: base.avisos }
    },
  }
}
