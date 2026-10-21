import { useEffect } from 'react'
import { cuentasActivas } from '../../lib/cuentas'
import { llamar, logrosActivos } from '../../lib/logros'
import { useSinPasePrueba } from '../../store/useSinPasePrueba'
import { useCuenta } from '../cuenta/useCuenta'

/**
 * «Verme como viajero sin pase» (Tanda 10B): pregunta al servidor si está encendido (solo el administrador lo ve encendido) y, si lo está, pone la etiqueta pequeña «Sin pase (prueba)», solo para él.
 * Nada del móvil puede encenderlo: esto solo lee.
 */
export function SinPasePrueba() {
  if (!cuentasActivas() || !logrosActivos()) return null
  return <Encendido />
}

function Encendido() {
  const cuenta = useCuenta()
  const activo = useSinPasePrueba((s) => s.activo)
  const poner = useSinPasePrueba((s) => s.poner)
  const uid = cuenta.tipo === 'cuenta' ? cuenta.uid : null
  useEffect(() => {
    if (!uid) {
      poner(false)
      return undefined
    }
    let vivo = true
    void llamar<{ ok: boolean; activo: boolean }>('/api/pase/sin-pase').then((r) => {
      if (vivo) poner(Boolean(r?.ok && r.activo))
    })
    return () => {
      vivo = false
    }
  }, [uid, poner])
  if (!activo) return null
  return (
    <div data-sin-pase-prueba className="pointer-events-none fixed left-1/2 top-0 z-[70] -translate-x-1/2 rounded-b-md bg-[#1C2230] px-2.5 text-[9.5px] font-semibold leading-[13px] tracking-wide text-[#FFFDF8]">
      Sin pase (prueba)
    </div>
  )
}
