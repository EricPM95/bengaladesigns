import { useState } from 'react'
import { cuentasActivas } from '../../lib/cuentas'
import { EntrarProvisional } from './EntrarProvisional'
import { useCuenta } from './useCuenta'

const CLAVE_SALTADA = 'trazo:cuenta:saltada'

/**
 * La puerta de la app (cuentas, parte 1): con las cuentas encendidas y sin cuenta de verdad, pide entrar al empezar. Con el interruptor apagado no pinta nada
 * y la app es la de hoy. «Seguir sin cuenta» solo existe para las pruebas y se recuerda mientras la pestaña esté abierta.
 */
export function PuertaDeCuenta() {
  if (!cuentasActivas()) return null
  return <PuertaEncendida />
}

function PuertaEncendida() {
  const estado = useCuenta()
  const [saltada, setSaltada] = useState(() => {
    try {
      return window.sessionStorage.getItem(CLAVE_SALTADA) === '1'
    } catch {
      return false
    }
  })
  if (saltada || (estado.tipo !== 'anonima' && estado.tipo !== 'sin_sesion')) return null
  return (
    <EntrarProvisional
      onSaltar={() => {
        try {
          window.sessionStorage.setItem(CLAVE_SALTADA, '1')
        } catch {
          /* sin almacenamiento: se vuelve a pedir al recargar */
        }
        setSaltada(true)
      }}
    />
  )
}
