import { useState } from 'react'
import { borrarMiCuenta, cerrarSesion, cuentasActivas } from '../../lib/cuentas'
import { InvitarProvisional } from './InvitarProvisional'
import { PrivacidadScreen } from './PrivacidadScreen'
import { useCuenta } from './useCuenta'

const ETIQUETA = { font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em' } as const

/**
 * LA CUENTA EN EL PERFIL, PROVISIONAL (cuentas, parte 1): quién es, [Cerrar sesión], [Privacidad] y [Borrar mi cuenta] (con confirmación). Solo con las cuentas
 * encendidas. Las pantallas de verdad las dibuja Design.
 */
export function CuentaEnPerfil() {
  if (!cuentasActivas()) return null
  return <CuentaEncendida />
}

function CuentaEncendida() {
  const estado = useCuenta()
  const [privacidad, setPrivacidad] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [borrando, setBorrando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const borrar = async () => {
    setBorrando(true)
    setError(null)
    const resultado = await borrarMiCuenta()
    setBorrando(false)
    if (resultado) setError(resultado)
  }

  return (
    <div className="flex flex-col gap-2" data-cuenta-en-perfil>
      <h3 className="m-0 px-1 uppercase text-text/55" style={ETIQUETA}>
        Mi cuenta
      </h3>
      <div className="flex flex-col gap-2 rounded-2xl border border-text/10 p-4">
        <p className="m-0 text-[14px] text-text/80" data-estado-cuenta>
          {estado.tipo === 'cuenta' ? (estado.email ? `Has entrado como ${estado.email}.` : 'Has entrado con tu cuenta.') : 'Todavía no has entrado con una cuenta.'}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {estado.tipo === 'cuenta' && (
            <button type="button" onClick={() => void cerrarSesion()} className="p-1 text-[13px] text-text/70 underline underline-offset-[3px]">
              Cerrar sesión
            </button>
          )}
          <button type="button" onClick={() => setPrivacidad(true)} className="p-1 text-[13px] text-text/70 underline underline-offset-[3px]">
            Privacidad
          </button>
          {estado.tipo === 'cuenta' && !confirmando && (
            <button type="button" onClick={() => setConfirmando(true)} className="p-1 text-[13px] text-[#b3261e] underline underline-offset-[3px]">
              Borrar mi cuenta
            </button>
          )}
        </div>
        {confirmando && (
          <div className="flex flex-col gap-2 rounded-xl bg-[#b3261e]/8 p-3" role="alertdialog" aria-label="Borrar mi cuenta">
            <p className="m-0 text-[13px] text-text/80">Se borrarán tu cuenta, tus viajes, tus fotos, tus Vistos, tus logros y tus pases. No se puede deshacer.</p>
            <div className="flex gap-3">
              <button type="button" disabled={borrando} onClick={() => void borrar()} className="h-10 rounded-full bg-[#b3261e] px-4 text-[13px] font-semibold text-white disabled:opacity-50">
                {borrando ? 'Borrando…' : 'Sí, borrar todo'}
              </button>
              <button type="button" disabled={borrando} onClick={() => setConfirmando(false)} className="h-10 px-2 text-[13px] text-text/70">
                Cancelar
              </button>
            </div>
          </div>
        )}
        {error && (
          <p role="alert" className="m-0 text-[13px] text-[#b3261e]">
            {error}
          </p>
        )}
      </div>
      {estado.tipo === 'cuenta' && <InvitarProvisional />}
      {privacidad && <PrivacidadScreen onVolver={() => setPrivacidad(false)} />}
    </div>
  )
}
