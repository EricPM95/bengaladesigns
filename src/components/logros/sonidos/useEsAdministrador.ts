import { useEffect, useState } from 'react'
import { llamar, logrosActivos } from '../../../lib/logros'

/** Pasa por la comprobación de administrador del servidor (la misma que /admin/logros): sin serlo, el servidor da 403 y la página no enseña nada. */
export function useEsAdministrador(): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null)
  useEffect(() => {
    if (!logrosActivos()) {
      setOk(false)
      return
    }
    void llamar<{ ok: boolean }>('/api/admin/avisos-viajeros?limite=1').then((r) => setOk(Boolean(r?.ok)))
  }, [])
  return ok
}
