import { useAjustesUi } from '../../store/useAjustesUi'
import { cuentasActivas } from '../../lib/cuentas'
import { AjustesHost } from './AjustesScreen'
import { EditarPerfil } from './EditarPerfil'

/** Las pantallas que abre el Perfil (cuentas parte 3): Ajustes (P3), Mis pases (P4) y editar mi foto y mi nombre. Siempre montado; con las cuentas apagadas no hace nada. */
export function AjustesHosts() {
  if (!cuentasActivas()) return null
  return <Encendidos />
}

function Encendidos() {
  const editando = useAjustesUi((s) => s.editandoPerfil)
  const editarPerfil = useAjustesUi((s) => s.editarPerfil)
  return (
    <>
      <AjustesHost />
      {editando && <EditarPerfil onCerrar={() => editarPerfil(false)} />}
    </>
  )
}
