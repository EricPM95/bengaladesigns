import { useMemo } from 'react'
import { gastosQueVeo, nombresEnFrase, type GastoCompartido } from '../lib/gastosCompartidos'
import { nombreDe, useViajeCompartido, type Persona } from '../store/useViajeCompartido'
import { useGastosCompartidos } from '../store/useGastosCompartidos'
import { useSyncStore } from '../store/useSyncStore'
import { usePermisosDelViaje } from './usePermisosDelViaje'

/**
 * EL PRESUPUESTO DE ESTE VIAJE, ¿ES COMPARTIDO? (Tanda 10N, apartado 9). Lo es cuando soy invitada o el viaje ya tiene más gente que yo, y la tabla de gastos existe (migración 0037).
 * Si no, el presupuesto se queda como siempre: sin [Para todos] / [Para mí] y sin «¿Quién ha pagado?».
 */
export interface GastosDelViaje {
  compartido: boolean
  yoId: string | null
  /** Las personas del viaje (el administrador primero). */
  personas: Persona[]
  yo: Persona | null
  /** Nombre de pila de cada persona, o «Alguien» si aún no ha puesto uno. */
  nombreDe: (id: string | null | undefined) => string
  /** «Eric y Ana». */
  frase: string
  /** Administrador o quien puede editar: sus gastos [Para todos] entran directos y puede aceptar los de los demás. */
  puedeDecidir: boolean
  esInvitado: boolean
  nombreAdmin: string
  /** Lo que veo yo (lo del grupo y lo mío), con lo más nuevo al final. */
  gastos: GastoCompartido[]
}

export function useGastosDelViaje(): GastosDelViaje {
  const tripId = useSyncStore((s) => s.activeTripId)
  const gente = useViajeCompartido((s) => s.gente)
  const { puedeEditar, esInvitado, nombreAdmin } = usePermisosDelViaje()
  const disponible = useGastosCompartidos((s) => s.disponible)
  const yoDelAlmacen = useGastosCompartidos((s) => s.yoId)
  const todos = useGastosCompartidos((s) => s.gastos)
  const compartido = Boolean(tripId) && (esInvitado || gente.length > 1) && disponible !== false
  const yoPorLista = gente.find((p) => p.esYo)?.id ?? null
  const yoId = yoDelAlmacen ?? yoPorLista
  const personas = useMemo(() => [...gente].sort((a, b) => Number(b.esAdmin) - Number(a.esAdmin)), [gente])
  const nombrePorId = (id: string | null | undefined): string => nombreDe(personas.find((p) => p.id === id)) || 'Alguien'
  const gastos = useMemo(() => gastosQueVeo(todos, yoId), [todos, yoId])
  return {
    compartido,
    yoId,
    personas,
    yo: personas.find((p) => p.id === yoId) ?? null,
    nombreDe: nombrePorId,
    frase: nombresEnFrase(personas.map((p) => nombreDe(p))),
    puedeDecidir: puedeEditar,
    esInvitado,
    nombreAdmin,
    gastos,
  }
}
