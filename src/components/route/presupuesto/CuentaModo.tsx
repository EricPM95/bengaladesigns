import { useEffect } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { useViajeCompartido } from '../../../store/useViajeCompartido'
import { esFamilia } from '../../../lib/cuentaDelViaje'
import { miPermisoAhora } from '../../../hooks/useModoInvitado'

/**
 * (Tanda 10N10 §5a) Ya no hay botón, hoja, confirmación ni pregunta de «¿Cómo lleváis las cuentas?»: la forma de las cuentas sale sola del número de personas (`lib/cuentaDelViaje.ts`).
 * Este componente, siempre montado, solo hace una cosa: el ADMINISTRADOR apunta en la ruta cuántas personas hay (`cuentasPersonas`, que lee la base de datos, migración 0067) y, mientras son dos,
 * quiénes (`cuentaConjuntaCon`), para que al entrar una tercera persona lo apuntado en la cuenta conjunta se quede entre esos dos y no se reparta entre tres.
 */
export function ModoCuentasHost() {
  const gente = useViajeCompartido((s) => s.gente)
  const hayRuta = useRouteStore((s) => Boolean(s.route))
  useEffect(() => {
    if (!hayRuta || miPermisoAhora() !== 'admin' || gente.length < 1) return
    const ruta = useRouteStore.getState().route
    if (!ruta) return
    const ids = [...gente].sort((a, b) => Number(b.esAdmin) - Number(a.esAdmin)).map((p) => p.id)
    // Mientras son dos (y no es una familia), se apunta quiénes son; con tres o más, solo cuántos.
    useRouteStore.getState().setCuentasPersonas(gente.length, gente.length === 2 && !esFamilia(ruta) ? ids : null)
  }, [gente, hayRuta])
  return null
}
