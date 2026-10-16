import { useState } from 'react'
import { createPortal } from 'react-dom'
import { entrarConEmail, entrarConGoogle } from '../../lib/cuentas'

/**
 * LA PANTALLA DE ENTRAR, PROVISIONAL (cuentas, parte 1): sencilla, solo con el interruptor de las cuentas encendido. Las de verdad las dibuja Design.
 * Email con enlace mágico, o Google. «Seguir sin cuenta» existe solo para las pruebas.
 */
export function EntrarProvisional({ onSaltar }: { onSaltar: () => void }) {
  const [email, setEmail] = useState('')
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const alEnviar = async (evento: React.FormEvent) => {
    evento.preventDefault()
    setOcupado(true)
    const resultado = await entrarConEmail(email)
    setOcupado(false)
    setMensaje(resultado.error ? { texto: resultado.error, error: true } : { texto: resultado.aviso ?? 'Te hemos enviado un enlace.', error: false })
  }

  const alGoogle = async () => {
    setOcupado(true)
    const resultado = await entrarConGoogle()
    setOcupado(false)
    if (resultado.error) setMensaje({ texto: resultado.error, error: true })
  }

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Entrar" data-entrar-provisional className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-6 bg-bg px-6 text-text">
      <div className="flex w-full max-w-sm flex-col gap-5">
        <p className="m-0 uppercase text-text/50" style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em' }}>
          Pantalla provisional
        </p>
        <h1 className="m-0 font-display text-[34px] leading-[1.05]">Entra en tu cuenta</h1>
        <p className="m-0 text-[14px] text-text/65">Así tus viajes y tus fotos te siguen a cualquier móvil.</p>
        <form onSubmit={alEnviar} className="flex flex-col gap-3">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Tu email"
            className="h-12 rounded-xl border border-text/15 bg-transparent px-4 text-[16px] outline-none focus:border-text/40"
          />
          <button type="submit" disabled={ocupado || email.trim().length === 0} className="h-12 rounded-full bg-[#1C2230] text-[15px] font-semibold text-[#FFFDF8] disabled:opacity-50">
            Enviarme un enlace
          </button>
        </form>
        <button type="button" onClick={alGoogle} disabled={ocupado} className="h-12 rounded-full border border-text/20 text-[15px] font-medium disabled:opacity-50">
          Entrar con Google
        </button>
        {mensaje && (
          <p role="status" data-mensaje-entrar className={`m-0 text-[13px] ${mensaje.error ? 'text-[#b3261e]' : 'text-text/70'}`}>
            {mensaje.texto}
          </p>
        )}
        <button type="button" onClick={onSaltar} className="self-center p-1 text-[12px] text-text/45 underline underline-offset-[3px]">
          Seguir sin cuenta (solo para pruebas)
        </button>
      </div>
    </div>,
    document.body,
  )
}
