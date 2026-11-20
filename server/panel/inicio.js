/** GET /api/admin/inicio (V33): los números de la primera pantalla del panel. Todo sale de UNA función SQL (`panel_inicio`, migración 0090); aquí solo se le da la forma del contrato. */
import { rpc, hoyEnPanel, ZONA_PANEL } from './guardian.js'

const n = (v) => Number(v) || 0

export function crearServicioInicio({ admin, correo, avisoInterno, ahora = () => new Date() }) {
  return {
    async leer() {
      const crudo = (await rpc(admin, 'panel_inicio', { p_ahora: new Date(ahora()).toISOString(), p_tz: ZONA_PANEL })) ?? {}
      // De paso, si hay reportes sin avisar y ya toca, sale el correo interno (nunca rompe la pantalla).
      if (avisoInterno) await avisoInterno.intentar()
      const atencion = (Array.isArray(crudo.atencion) ? crudo.atencion : [])
        .map((x) => ({ tipo: x.tipo, titulo: String(x.titulo ?? ''), en: x.en ? new Date(x.en).toISOString() : null }))
        .sort((a, b) => String(b.en).localeCompare(String(a.en)))
        .slice(0, 8)
      return {
        ok: true,
        reportes_nuevos: n(crudo.reportes_nuevos),
        fotos_por_aprobar: n(crudo.fotos_por_aprobar),
        pases: { hoy: n(crudo.pases_hoy), mes: n(crudo.pases_mes) },
        ingresos: { hoy_cent: n(crudo.ingresos_hoy_cent), mes_cent: n(crudo.ingresos_mes_cent), moneda: crudo.moneda ?? 'eur' },
        usuarios: { hoy: n(crudo.usuarios_hoy), semana: n(crudo.usuarios_semana), total: n(crudo.usuarios_total), con_viaje: n(crudo.usuarios_con_viaje) },
        serie14: (Array.isArray(crudo.serie14) ? crudo.serie14 : []).map((x) => ({ dia: x.dia, pases: n(x.pases) })),
        atencion,
        correo: { activo: Boolean(correo?.activo) },
        hoy: hoyEnPanel(new Date(ahora())),
      }
    },
  }
}
