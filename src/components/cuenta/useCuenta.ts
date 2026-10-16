import { useEffect, useState } from 'react'
import { cuentasActivas, vigilarSesion, type EstadoDeCuenta } from '../../lib/cuentas'

/** El estado de la cuenta, al día. Con las cuentas apagadas no engancha nada y devuelve `cargando` para siempre (quien lo usa ya mira `cuentasActivas()` antes). */
export function useCuenta(): EstadoDeCuenta {
  const [estado, setEstado] = useState<EstadoDeCuenta>({ tipo: 'cargando' })
  useEffect(() => {
    if (!cuentasActivas()) return undefined
    return vigilarSesion(setEstado)
  }, [])
  return estado
}
