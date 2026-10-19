import { lazy, Suspense, useEffect } from 'react'
import { useAjustesUi } from '../../store/useAjustesUi'
import { useMiPerfil } from '../../store/useMiPerfil'
import { CLAVE_PEDIR_AL_VOLVER, usePedirNombre } from '../../store/usePedirNombre'
import { cuentasActivas } from '../../lib/cuentas'

// Ajustes, Mis pases, editar el perfil y «¿Cómo te llamas?» se bajan cuando se abren, no al abrir la app (cuentas 3B, punto 2).
const AjustesHost = lazy(() => import('./AjustesScreen').then((m) => ({ default: m.AjustesHost })))
const EditarPerfil = lazy(() => import('./EditarPerfil').then((m) => ({ default: m.EditarPerfil })))
const HojaComoTeLlamas = lazy(() => import('./HojaComoTeLlamas').then((m) => ({ default: m.HojaComoTeLlamas })))

/** Las pantallas que abre el Perfil (cuentas parte 3): Ajustes (P3), Mis pases (P4) y editar mi foto y mi nombre; y la pregunta «¿Cómo te llamas?». Siempre montado; con las cuentas apagadas no hace nada. */
export function AjustesHosts() {
  if (!cuentasActivas()) return null
  return <Encendidos />
}

function Encendidos() {
  const pantalla = useAjustesUi((s) => s.pantalla)
  const editando = useAjustesUi((s) => s.editandoPerfil)
  const editarPerfil = useAjustesUi((s) => s.editarPerfil)
  const preguntando = usePedirNombre((s) => s.abierta)
  const perfilCargado = useMiPerfil((s) => s.cargado)

  // Quien acaba de entrar en un viaje al crear su cuenta (la página se recargó): si no tiene nombre, se le pregunta ahora, una sola vez.
  useEffect(() => {
    if (!perfilCargado) return
    try {
      if (window.sessionStorage.getItem(CLAVE_PEDIR_AL_VOLVER) !== '1') return
      window.sessionStorage.removeItem(CLAVE_PEDIR_AL_VOLVER)
    } catch {
      return
    }
    void usePedirNombre.getState().pedir()
  }, [perfilCargado])

  return (
    <Suspense fallback={null}>
      {pantalla && <AjustesHost />}
      {editando && <EditarPerfil onCerrar={() => editarPerfil(false)} />}
      {preguntando && <HojaComoTeLlamas />}
    </Suspense>
  )
}
