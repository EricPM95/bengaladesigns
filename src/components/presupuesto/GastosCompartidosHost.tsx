import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useGastosCompartidos, backendDeGastos } from '../../store/useGastosCompartidos'
import { useViajeCompartido, nombreDe } from '../../store/useViajeCompartido'
import { useSyncStore } from '../../store/useSyncStore'
import { useModoInvitado } from '../../hooks/useModoInvitado'
import { formatoImporte } from '../../lib/dinero'
import { Icono } from '../ui/Icono'

const CADA_MS = 20_000
const FRANJA_MS = 5_000

/**
 * LOS GASTOS COMPARTIDOS, EN DIRECTO (Tanda 10N, apartado 9). Siempre montado. Cuando el viaje abierto tiene más gente (o soy invitada): carga los gastos, escucha los cambios en tiempo real (Realtime de Supabase)
 * y los vuelve a leer cada poco con la app a la vista y al volver a ella. Si uno de MIS gastos pendientes lo aceptan o lo rechazan con la app abierta, sale la franja de arriba (`Presupuesto Compartido` 09 y 10),
 * que se va sola. El aviso de la campanita lo crea siempre la base de datos, con la app abierta o no.
 */
export function GastosCompartidosHost() {
  const tripId = useSyncStore((s) => s.activeTripId)
  const gente = useViajeCompartido((s) => s.gente)
  const { esInvitado } = useModoInvitado()
  const hayGente = esInvitado || gente.length > 1
  const cargar = useGastosCompartidos((s) => s.cargar)
  const recargar = useGastosCompartidos((s) => s.recargar)

  useEffect(() => {
    if (!tripId || !hayGente) return undefined
    void cargar(tripId)
    const dejarDeEscuchar = backendDeGastos().escuchar(tripId, () => void recargar())
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') void recargar()
    }, CADA_MS)
    const alVolver = () => {
      if (document.visibilityState === 'visible') void recargar()
    }
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      dejarDeEscuchar()
      window.clearInterval(t)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [tripId, hayGente, cargar, recargar])

  return <FranjaDeGasto />
}

function FranjaDeGasto() {
  const franja = useGastosCompartidos((s) => s.franja)
  const cerrar = useGastosCompartidos((s) => s.cerrarFranja)
  const gasto = useGastosCompartidos((s) => s.gastos.find((g) => g.id === s.franja?.gastoId) ?? null)
  const gente = useViajeCompartido((s) => s.gente)

  useEffect(() => {
    if (!franja) return undefined
    const t = window.setTimeout(cerrar, FRANJA_MS)
    return () => window.clearTimeout(t)
  }, [franja, cerrar])

  if (!franja) return null
  const aceptado = franja.resultado === 'aceptado'
  const quien = nombreDe(gente.find((p) => p.id === gasto?.decididoPor)) || nombreDe(gente.find((p) => p.esAdmin))
  const titulo = aceptado ? `${quien ? `${quien} ha aceptado` : 'Han aceptado'} tu gasto` : `${quien ? `${quien} ha preferido` : 'Han preferido'} no sumar tu gasto`
  const detalle = `${franja.nombre} · ${formatoImporte(franja.precio)} · ${aceptado ? 'ya suma en el grupo' : 'se queda solo para ti'}`
  return createPortal(
    <div
      role="status"
      aria-live="polite"
      data-franja-gasto={franja.resultado}
      onClick={cerrar}
      style={{ position: 'fixed', top: 'max(10px, env(safe-area-inset-top))', left: 12, right: 12, zIndex: 300, margin: '0 auto', maxWidth: 420, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px 10px 10px', borderRadius: 18, background: '#1C2230', color: '#FFFDF8', boxShadow: '0 14px 30px -12px rgba(28,34,48,.6)', border: '1px solid rgba(255,253,248,.12)' }}
    >
      <span aria-hidden="true" style={{ width: 36, height: 36, flex: 'none', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: aceptado ? 'oklch(0.35 0.07 150)' : 'rgba(255,253,248,.12)', color: aceptado ? 'oklch(0.85 0.12 150)' : '#E9C77A' }}>
        <Icono nombre={aceptado ? 'hecho' : 'avisos'} size={18} />
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ font: "600 14px/1.25 'Geist'" }}>{titulo}</span>
        <span style={{ font: "500 12px/1.3 'Geist'", color: 'rgba(255,253,248,.7)' }}>{detalle}</span>
      </span>
    </div>,
    document.body,
  )
}
