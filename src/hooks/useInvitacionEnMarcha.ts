import { useEffect, useState } from 'react'
import { cuentasActivas } from '../lib/cuentas'
import { EVENTO_INVITACION, invitacionEnMarcha } from '../lib/invitaciones'

const ESPERA_MAXIMA_MS = 20_000

/**
 * ¿Hay una invitación a medias (enlace abierto, o unido y entrando en el viaje)? Mientras sí, la app no pinta «Crear viaje». Por seguridad se suelta sola pasados 20 s: si algo se
 * atasca, nunca deja a la persona sin pantalla.
 */
export function useInvitacionEnMarcha(): boolean {
  const [enMarcha, setEnMarcha] = useState(() => cuentasActivas() && invitacionEnMarcha())
  const [soltada, setSoltada] = useState(false)
  useEffect(() => {
    const mirar = () => setEnMarcha(cuentasActivas() && invitacionEnMarcha())
    window.addEventListener(EVENTO_INVITACION, mirar)
    mirar()
    const t = window.setTimeout(() => setSoltada(true), ESPERA_MAXIMA_MS)
    return () => {
      window.removeEventListener(EVENTO_INVITACION, mirar)
      window.clearTimeout(t)
    }
  }, [])
  return enMarcha && !soltada
}
