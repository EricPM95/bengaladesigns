import { useState } from 'react'
import { useMiPerfil } from '../../store/useMiPerfil'
import { usePedirNombre } from '../../store/usePedirNombre'
import { BotonHoja, Hoja } from '../ui/Hoja'

/**
 * «¿CÓMO TE LLAMAS?» (cuentas parte 3B, punto 5; sin pantalla de Design, hecha con las piezas de las hojas de siempre). Se pide una sola vez, cuando hace falta (al compartir un viaje, al unirse a
 * uno o a un pase), a quien entró con el email y no tiene nombre. [Seguir] lo guarda; «Ahora no» lo deja como está. Con las dos se cierra y no se vuelve a preguntar.
 */
export function HojaComoTeLlamas() {
  const cerrar = usePedirNombre((s) => s.cerrar)
  const cambiarNombre = useMiPerfil((s) => s.cambiarNombre)
  const [texto, setTexto] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const seguir = async () => {
    if (!texto.trim()) return
    setOcupado(true)
    setError(null)
    const e = await cambiarNombre(texto)
    setOcupado(false)
    if (e) setError(e)
    else cerrar()
  }

  return (
    <Hoja onCerrar={cerrar} titulo="¿Cómo te llamas?" datos="como-te-llamas" z={97}>
      <p className="m-0 text-[14px] leading-snug text-text/70">Así te verán las personas de tus viajes.</p>
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void seguir()
        }}
        placeholder="Tu nombre"
        maxLength={40}
        autoComplete="given-name"
        aria-label="Tu nombre"
        data-nombre-campo
        className="h-[52px] rounded-[14px] border-[1.5px] border-text/20 bg-white px-3.5 text-[16px] outline-none"
      />
      {error && (
        <p role="alert" className="m-0 text-[13px]" style={{ color: 'oklch(0.5 0.17 5)' }}>
          {error}
        </p>
      )}
      <BotonHoja tipo="oscuro" disabled={ocupado || !texto.trim()} onClick={() => void seguir()} datos="nombre-seguir">
        Seguir
      </BotonHoja>
      <BotonHoja tipo="secundario" disabled={ocupado} onClick={cerrar} datos="nombre-ahora-no">
        Ahora no
      </BotonHoja>
    </Hoja>
  )
}
