import { useMemo } from 'react'
import { resolverRecomendacion, vistaPrevia, type Recomendacion } from '../../lib/aplicarRecomendacion'
import { cuentasActivas } from '../../lib/cuentas'
import type { Route } from '../../lib/types'
import { useModoInvitado } from '../../hooks/useModoInvitado'
import { useR2Store } from '../../store/useR2Store'
import { useRouteStore } from '../../store/useRouteStore'
import { useViajeCompartido } from '../../store/useViajeCompartido'

/** Los días que cambiaría cada recomendación pendiente, con la ruta de AHORA (los que necesitan que elija un día no marcan ninguno). */
export function diasConRecomendacion(route: Route, recs: Recomendacion[]): Map<string, Recomendacion[]> {
  const mapa = new Map<string, Recomendacion[]>()
  for (const rec of recs) {
    if (rec.estado !== 'pendiente') continue
    const r = resolverRecomendacion(route, rec)
    const dias = r.ok ? vistaPrevia(route, r.accion).map((c) => c.dayId) : []
    for (const id of new Set(dias)) mapa.set(id, [...(mapa.get(id) ?? []), rec])
  }
  return mapa
}

/**
 * «1 RECOMENDACIÓN» EN LA TARJETA DEL DÍA QUE CAMBIA (AV8, cuentas parte 3): una etiqueta dorada mientras el administrador no conteste. Al tocarla se abre R2 (la hoja de aceptar o no).
 * Solo la ve el administrador, con las cuentas encendidas.
 */
export function EtiquetaRecomendacion({ dayId }: { dayId: string }) {
  if (!cuentasActivas()) return null
  return <Etiqueta dayId={dayId} />
}

function Etiqueta({ dayId }: { dayId: string }) {
  const route = useRouteStore((s) => s.route)
  const recs = useViajeCompartido((s) => s.recomendaciones)
  const { esInvitado } = useModoInvitado()
  const abrir = useR2Store((s) => s.abrir)
  const mapa = useMemo(() => (route && !esInvitado ? diasConRecomendacion(route, recs) : new Map<string, Recomendacion[]>()), [route, recs, esInvitado])
  const delDia = mapa.get(dayId)
  if (!delDia || delDia.length === 0) return null
  return (
    <button
      type="button"
      data-etiqueta-recomendacion={delDia.length}
      onClick={(e) => {
        e.stopPropagation()
        abrir(delDia[0])
      }}
      className="mt-1 flex h-[44px] items-center self-start bg-transparent p-0"
      aria-label={delDia.length === 1 ? '1 recomendación' : `${delDia.length} recomendaciones`}
    >
      <span style={{ height: 26, padding: '0 10px', borderRadius: 999, background: '#F3D59A', color: '#2A1D10', display: 'flex', alignItems: 'center', font: "600 11.5px 'Geist'" }}>
        {delDia.length === 1 ? '1 recomendación' : `${delDia.length} recomendaciones`}
      </span>
    </button>
  )
}
