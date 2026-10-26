import { useState } from 'react'
import type { Encuadre } from '../../lib/encuadreFoto'
import { FotoEncuadrada } from '../ui/FotoEncuadrada'

/** El círculo de una persona: su foto (la suya o la de Google) o, sin foto, su inicial. Se usa en el Perfil, en la lista de avisos y en lo que ven los demás del viaje. */
export function Avatar({ foto, inicial, tam = 38, fondo = '#1C2230', color = '#FFFDF8', radio = '50%', encuadre = null }: { foto?: string | null; inicial: string; tam?: number; fondo?: string; color?: string; radio?: string | number; encuadre?: Encuadre | null }) {
  const [rota, setRota] = useState(false)
  const verFoto = Boolean(foto) && !rota
  return (
    <span aria-hidden="true" data-avatar={verFoto ? 'foto' : 'inicial'} style={{ position: 'relative', width: tam, height: tam, flex: 'none', borderRadius: radio, background: fondo, color, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', font: `400 ${Math.round(tam * 0.47)}px/1 'Instrument Serif',serif` }}>
      {verFoto ? <FotoEncuadrada src={foto as string} encuadre={encuadre} alRomper={() => setRota(true)} /> : inicial}
    </span>
  )
}
