import { botonChampan } from '../../lib/marcaBoton'
import { lazy, Suspense, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useModoInvitado } from '../../hooks/useModoInvitado'
import { resolverRecomendacion, vistaPrevia } from '../../lib/aplicarRecomendacion'
import { cambiosDeLaPropuesta, cambiosDeUnaRecomendacion, textoDeCuantos, textoEnviarA, textoEsperandoA } from '../../lib/propuesta'
import { pedirPermisoUnaVez } from '../../lib/permisoAvisos'
import { usePropuestaStore } from '../../store/usePropuestaStore'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import { useViajeCompartido } from '../../store/useViajeCompartido'

// La hoja se baja cuando se abre (cuentas 3B, punto 2).
const HojaVerPropuesta = lazy(() => import('./HojaVerPropuesta').then((m) => ({ default: m.HojaVerPropuesta })))

const ESTILO_BARRA = { position: 'fixed', left: 12, right: 12, bottom: 'calc(96px + env(safe-area-inset-bottom))', zIndex: 60, margin: '0 auto', maxWidth: 520, borderRadius: 20, background: '#1C2230', color: '#FFFDF8', padding: '10px 10px 10px 16px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 16px 30px -12px rgba(0,0,0,.6)' } as const

/**
 * LA BARRA «TU PROPUESTA · N CAMBIOS» (RM, cuentas parte 3): flota encima de la barra de abajo mientras una persona invitada recomienda cambios. Con [Ver] (la lista de sus cambios, RV) y
 * [Enviar a Elena]. Sin cambios todavía, dice que no hay y deja [Salir]. Nada cambia de verdad hasta enviar.
 * Una vez enviada, mientras el administrador no conteste, la misma barra dice «Enviada · esperando a Elena» con [Ver] (AV7).
 */
export function BarraDePropuesta() {
  const activa = usePropuestaStore((s) => s.activa)
  if (activa) return <BarraAbierta />
  return <BarraEnviada />
}

function BarraAbierta() {
  const base = usePropuestaStore((s) => s.base)
  const enviando = usePropuestaStore((s) => s.enviando)
  const error = usePropuestaStore((s) => s.error)
  const verLista = usePropuestaStore((s) => s.verLista)
  const enviar = usePropuestaStore((s) => s.enviar)
  const cancelar = usePropuestaStore((s) => s.cancelar)
  const route = useRouteStore((s) => s.route)
  const { nombreAdmin } = useModoInvitado()
  const cambios = useMemo(() => (base && route ? cambiosDeLaPropuesta(base, route) : []), [base, route])
  const n = cambios.length

  return createPortal(
    <div data-barra-propuesta style={ESTILO_BARRA}>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: '#F3D59A' }}>Tu propuesta</span>
        <span data-propuesta-cuantos style={{ font: "500 14px 'Geist'" }}>
          {error ?? (n === 0 ? 'Aún sin cambios' : textoDeCuantos(n))}
        </span>
      </span>
      {n === 0 ? (
        <button type="button" onClick={cancelar} style={{ height: 44, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(255,253,248,.3)', background: 'transparent', color: 'inherit', font: "600 12.5px 'Geist'", cursor: 'pointer' }}>
          Salir
        </button>
      ) : (
        <>
          <button type="button" onClick={() => verLista(true)} style={{ height: 44, padding: '0 13px', borderRadius: 999, border: '1px solid rgba(255,253,248,.3)', background: 'transparent', color: 'inherit', font: "600 12.5px 'Geist'", cursor: 'pointer' }}>
            Ver
          </button>
          <button type="button" disabled={enviando} onClick={() => { void pedirPermisoUnaVez(); void enviar() }} style={{ height: 44, padding: '0 13px', borderRadius: 999, ...botonChampan(true), font: "700 12.5px 'Geist'", cursor: 'pointer', opacity: enviando ? 0.6 : 1 }}>
            {textoEnviarA(nombreAdmin)}
          </button>
        </>
      )}
    </div>,
    document.body,
  )
}

/** Lo ya mandado y sin contestar (AV7): «Tu propuesta · Enviada · esperando a Elena» con [Ver]. Solo para quien mira el viaje de otra persona y tiene algo pendiente. */
function BarraEnviada() {
  const { esInvitado, nombreAdmin } = useModoInvitado()
  const recs = useViajeCompartido((s) => s.recomendaciones)
  const yo = useSyncStore((s) => s.travelerId)
  const route = useRouteStore((s) => s.route)
  const [abierta, setAbierta] = useState(false)
  const pendientes = useMemo(() => recs.filter((r) => r.estado === 'pendiente' && (yo == null || r.authorId === yo)), [recs, yo])
  const cambios = useMemo(() => {
    if (!route) return []
    return pendientes.flatMap((rec) => {
      const r = resolverRecomendacion(route, rec)
      return r.ok ? cambiosDeUnaRecomendacion(route, vistaPrevia(route, r.accion)) : []
    })
  }, [pendientes, route])
  if (!esInvitado || pendientes.length === 0) return null
  return (
    <>
      {createPortal(
        <div data-barra-enviada style={ESTILO_BARRA}>
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: '#F3D59A' }}>Tu propuesta</span>
            <span style={{ font: "500 14px 'Geist'" }}>Enviada · {textoEsperandoA(nombreAdmin)}</span>
          </span>
          <button type="button" onClick={() => setAbierta(true)} style={{ height: 44, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(255,253,248,.3)', background: 'transparent', color: 'inherit', font: "600 12.5px 'Geist'", cursor: 'pointer' }}>
            Ver
          </button>
        </div>,
        document.body,
      )}
      {abierta && (
        <Suspense fallback={null}>
          <HojaVerPropuesta cambiosEnviados={cambios} onCerrar={() => setAbierta(false)} />
        </Suspense>
      )}
    </>
  )
}
