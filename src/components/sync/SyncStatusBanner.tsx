import { useSyncStore } from '../../store/useSyncStore'

/**
 * Aviso discreto — solo visible mientras el último intento de guardar en Supabase falló (status
 * 'error'). No bloquea nada: el viaje sigue completamente usable con el estado en memoria, y
 * TripSync.tsx reintenta solo en cuanto vuelve la conexión o hay un cambio nuevo que guardar.
 */
export function SyncStatusBanner() {
  const status = useSyncStore((state) => state.status)
  if (status !== 'error') return null

  return (
    <div className="fixed left-1/2 top-16 z-30 -translate-x-1/2 rounded-full bg-accent-red/10 px-4 py-2 text-caption font-medium text-accent-red shadow-md backdrop-blur-sm">
      ⚠️ Cambios sin guardar — revisa tu conexión
    </div>
  )
}
