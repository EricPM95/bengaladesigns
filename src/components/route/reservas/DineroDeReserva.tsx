import { useState } from 'react'
import { useEntradasDelGrupo } from '../../../hooks/useEntradasDelGrupo'
import { usePermisosDelViaje } from '../../../hooks/usePermisosDelViaje'
import { usePrecioEditable } from '../../../lib/useMoneda'
import type { Importe } from '../../../lib/dinero'
import { nombreDe } from '../../../store/useViajeCompartido'
import { useRouteStore } from '../../../store/useRouteStore'
import { cuentaDelViaje, esFamilia } from '../../../lib/cuentaDelViaje'
import { BloqueDinero, type CuentaComun, type TipoDeHoja } from '../presupuesto/BloqueDinero'

/**
 * EL BLOQUE DEL DINERO DE LAS HOJAS DE RESERVAS (Tanda 10N10 §6 y §7): vuelo, alojamiento y entradas. Guarda el estado de «¿Para quién…?», «¿Cuánto ha costado en total?» y «¿Quién lo ha pagado?»
 * y pinta el `BloqueDinero` de Presupuesto (una sola pieza para todas las hojas). Viajando solo, solo el precio.
 *   const dinero = useDineroDeReserva({ para: [...], precio, pagado: [...] })
 *   dinero.bloque('vuelo') // el JSX
 *   dinero.paraIds / dinero.pagadoIds / dinero.precio.importe // al guardar
 */
export function useDineroDeReserva(inicial: { para?: readonly string[] | null; precio?: Importe | null; pagado?: readonly string[] | null; marcarTodos?: boolean; pagadoTodos?: boolean } = {}) {
  const g = useEntradasDelGrupo()
  const permisos = usePermisosDelViaje()
  const personas = g.gente.map((p) => ({ id: p.id, nombre: nombreDe(p) }))
  const route = useRouteStore((s) => s.route)
  const laCuenta = cuentaDelViaje(g.gente.length, esFamilia(route))
  const solo = laCuenta === 'solo'
  const yoId = g.yoId
  const [para, setPara] = useState<string[]>(() => (inicial.para && inicial.para.length > 0 ? [...inicial.para] : inicial.marcarTodos ? g.gente.map((p) => p.id) : yoId ? [yoId] : []))
  const [pagado, setPagado] = useState<string[]>(() => (inicial.pagado && inicial.pagado.length > 0 ? [...inicial.pagado] : inicial.pagadoTodos ? g.gente.map((p) => p.id) : yoId ? [yoId] : []))
  const precio = usePrecioEditable(inicial.precio ?? null)
  const alternar = (lista: string[], id: string) => (lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id])
  // (10N10 §4/§6) Cuenta común: dos personas, conjunta; tres o más, del grupo. (La regla de la familia la decide `cuentaDelViaje` del presupuesto cuando exista.)
  const cuenta: CuentaComun = laCuenta === 'grupo' ? 'grupo' : 'conjunta'
  const paraIds = solo ? (yoId ? [yoId] : []) : para.length > 0 ? para : yoId ? [yoId] : []
  const pagadoIds = pagado.length > 0 ? pagado : yoId ? [yoId] : []
  const bloque = (tipo: TipoDeHoja) => (
    <BloqueDinero
      tipo={tipo}
      solo={solo}
      personas={personas}
      yoId={yoId}
      paraQuien={paraIds}
      onParaQuien={(id) => setPara(alternar(paraIds, id))}
      precio={precio}
      pagadoPor={pagadoIds}
      onPagadoPor={(id) => setPagado(alternar(pagadoIds, id))}
      cuenta={cuenta}
      permiso={permisos.rol}
      nombreAdmin={g.nombreAdmin}
    />
  )
  return { bloque, solo, paraIds, pagadoIds, precio, personas, yoId, gente: g.gente, esAdmin: g.esAdmin, setPara, setPagado, permiso: permisos.rol, nombreAdmin: g.nombreAdmin }
}
