/** GET /api/admin/ventas (V33): lo vendido (solo cobros reales). Sale de `panel_ventas` (migración 0090). Nunca datos de tarjeta ni referencias del cobro. */
import { rpc, ZONA_PANEL } from './guardian.js'

const n = (v) => Number(v) || 0

export function crearServicioVentas({ admin, ahora = () => new Date() }) {
  return {
    async leer() {
      const c = (await rpc(admin, 'panel_ventas', { p_ahora: new Date(ahora()).toISOString(), p_tz: ZONA_PANEL })) ?? {}
      return {
        ok: true,
        importes_conocidos: c.importes_conocidos !== false,
        pases_hoy: n(c.pases_hoy),
        pases_mes: n(c.pases_mes),
        ingresos_mes_cent: n(c.ingresos_mes_cent),
        moneda: c.moneda ?? 'eur',
        por_destino: (c.por_destino ?? []).map((x) => ({ destino: x.destino, n: n(x.n) })),
        por_dia: (c.por_dia ?? []).map((x) => ({ dia: x.dia, n: n(x.n) })),
        compras: (c.compras ?? []).map((x) => ({ fecha: x.fecha, destino: x.destino, tipo: x.tipo, importe_cent: n(x.importe_cent), moneda: x.moneda ?? 'eur' })),
      }
    },
  }
}
