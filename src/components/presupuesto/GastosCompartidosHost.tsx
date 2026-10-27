import { useEffect } from 'react'
import { useGastosCompartidos, backendDeGastos } from '../../store/useGastosCompartidos'
import { useViajeCompartido, nombreDe } from '../../store/useViajeCompartido'
import { useSyncStore } from '../../store/useSyncStore'
import { useModoInvitado } from '../../hooks/useModoInvitado'
import { formatoImporte } from '../../lib/dinero'
import { useFranjaStore } from '../../store/useFranjaStore'

const CADA_MS = 20_000

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

/**
 * (10N4 §4b) Antes pintaba su propia franja; ahora usa la MISMA pieza que todos los avisos (`FranjaDeAviso`), con su sonido. El mismo gasto no sale dos veces: el aviso «ha aceptado tu gasto» de la campana
 * lleva la misma clave (`gasto:ID`).
 */
function FranjaDeGasto() {
  const franja = useGastosCompartidos((s) => s.franja)
  const cerrar = useGastosCompartidos((s) => s.cerrarFranja)
  const gasto = useGastosCompartidos((s) => s.gastos.find((g) => g.id === s.franja?.gastoId) ?? null)
  const gente = useViajeCompartido((s) => s.gente)

  useEffect(() => {
    if (!franja) return
    const aceptado = franja.resultado === 'aceptado'
    const decisor = gente.find((p) => p.id === gasto?.decididoPor) ?? gente.find((p) => p.esAdmin)
    const quien = nombreDe(decisor)
    const titulo = aceptado ? `${quien ? `${quien} ha aceptado` : 'Han aceptado'} tu gasto` : `${quien ? `${quien} ha preferido` : 'Han preferido'} no sumar tu gasto`
    const detalle = `${franja.nombre} · ${formatoImporte(franja.precio)} · ${aceptado ? 'ya suma en el grupo' : 'se queda solo para ti'}`
    useFranjaStore.getState().mostrar([{ id: `gasto-franja:${franja.gastoId}:${franja.n}`, clave: `gasto:${franja.gastoId}`, titulo, detalle, icono: quien ? 'persona' : 'info', quien: quien || null }])
    cerrar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [franja])
  return null
}
