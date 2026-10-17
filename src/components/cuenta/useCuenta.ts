import { useEffect, useState } from 'react'
import { demoActivo } from '../../lib/logros'
import { cuentasActivas, vigilarSesion, type EstadoDeCuenta } from '../../lib/cuentas'

/** El estado de la cuenta, al día. Con las cuentas apagadas no engancha nada y devuelve `cargando` para siempre (quien lo usa ya mira `cuentasActivas()` antes). */
export function useCuenta(): EstadoDeCuenta {
  const [estado, setEstado] = useState<EstadoDeCuenta>({ tipo: 'cargando' })
  useEffect(() => {
    if (!cuentasActivas()) return undefined
    return vigilarSesion(setEstado)
  }, [])
  // Solo desarrollo (?logrosDemo=1): una cuenta de mentira para probar las pantallas de los logros.
  if (demoActivo()) return { tipo: 'cuenta', uid: 'demo', email: 'demo@local' }
  return estado
}
