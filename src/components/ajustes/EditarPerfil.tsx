import { useRef, useState } from 'react'
import { inicialDeNombre } from '../../lib/miPerfil'
import { useMiNombreYFoto, useMiPerfil } from '../../store/useMiPerfil'
import { BotonHoja, Hoja } from '../ui/Hoja'
import { Avatar } from './Avatar'

/**
 * EDITAR MI PERFIL (cuentas parte 3, punto 6; sin pantalla de Design, hecho con las piezas que ya hay): al tocar el círculo del Perfil, la hoja con la foto (hacer una foto o elegirla de la
 * galería; pequeña, sin datos escondidos, en la nube y se borra con la cuenta) y el nombre. Si entra con Google, su foto y su nombre de Google hasta que ponga otros. Sin foto, la inicial.
 */
export function EditarPerfil({ onCerrar }: { onCerrar: () => void }) {
  const { nombre, tieneNombre, foto } = useMiNombreYFoto()
  const fotoPropia = useMiPerfil((s) => s.fotoPath)
  const cambiarNombre = useMiPerfil((s) => s.cambiarNombre)
  const cambiarFoto = useMiPerfil((s) => s.cambiarFoto)
  const borrarFoto = useMiPerfil((s) => s.borrarFoto)
  const [texto, setTexto] = useState(tieneNombre ? nombre : '')
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const camara = useRef<HTMLInputElement>(null)
  const galeria = useRef<HTMLInputElement>(null)

  const alElegir = async (archivo: File | undefined) => {
    if (!archivo) return
    setOcupado(true)
    setError(null)
    setError(await cambiarFoto(archivo))
    setOcupado(false)
  }
  const guardar = async () => {
    setOcupado(true)
    setError(null)
    const e = texto.trim() ? await cambiarNombre(texto) : null
    setOcupado(false)
    if (e) setError(e)
    else onCerrar()
  }

  return (
    <Hoja onCerrar={onCerrar} titulo="Tu perfil" datos="editar-perfil" z={92}>
      <div className="flex items-center gap-4">
        <Avatar foto={foto} inicial={inicialDeNombre(tieneNombre ? nombre : null)} tam={84} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <button type="button" disabled={ocupado} onClick={() => camara.current?.click()} data-hacer-foto className="h-11 rounded-full border border-text/20 text-[13.5px] font-semibold">
            Hacer una foto
          </button>
          <button type="button" disabled={ocupado} onClick={() => galeria.current?.click()} data-elegir-foto className="h-11 rounded-full border border-text/20 text-[13.5px] font-semibold">
            Elegir de la galería
          </button>
        </div>
      </div>
      <input ref={camara} type="file" accept="image/*" capture="user" hidden onChange={(e) => void alElegir(e.target.files?.[0])} />
      <input ref={galeria} type="file" accept="image/*" hidden onChange={(e) => void alElegir(e.target.files?.[0])} />
      {fotoPropia && (
        <button type="button" disabled={ocupado} onClick={() => void borrarFoto()} className="self-start p-1 text-[12.5px] text-text/70 underline underline-offset-[3px]" style={{ minHeight: 44 }}>
          Quitar la foto
        </button>
      )}
      <label className="flex flex-col gap-1.5">
        <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(28,34,48,.55)' }}>Tu nombre</span>
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Tu nombre" maxLength={40} className="h-[52px] rounded-[14px] border-[1.5px] border-text/20 bg-white px-3.5 text-[16px] outline-none" />
      </label>
      {error && (
        <p role="alert" className="m-0 text-[13px]" style={{ color: 'oklch(0.5 0.17 5)' }}>
          {error}
        </p>
      )}
      <BotonHoja tipo="oscuro" disabled={ocupado} onClick={() => void guardar()} datos="guardar-perfil">
        Guardar
      </BotonHoja>
    </Hoja>
  )
}
