import type { ReactNode } from 'react'
import { abrirPase } from '../../lib/pago'
import { Icono } from '../ui/Icono'

/**
 * LA PIEZA DE «CERRADO» DE TODA LA APP (Tanda 10G, la versión gratis; Eric, 23-oct): quien no tiene el pase ve TODO lo que el pase le daría, cerrado y con su invitación, nunca escondido.
 * Lo de pago se ve en gris, con un candado dorado sobre fondo marfil y una línea corta con lo que se ganaría; al tocarlo se abre `abrirPase()` (la hoja de compra). Es la ÚNICA pieza: los candados de
 * RESERVAS, DÍAS, EXPLORAR, el alojamiento y Logros son esta.
 *
 *  - `variante="linea"` (por defecto): una fila discreta, para ir debajo de algo ya guardado o de algo gris.
 *  - `variante="tarjeta"`: la invitación grande (como mucho UNA por pantalla): una tarjeta marfil con el titular y [Ver el Pase de {destino}].
 * `children` (opcional) es el contenido gris que está cerrado (por ejemplo, la fila «Baños» de «Cerca de mí»): se ve, apagado, y todo él abre el pase.
 */
export function Candado({
  texto,
  variante = 'linea',
  titulo,
  boton,
  datos = 'candado',
  children,
  className = '',
}: {
  texto: string
  variante?: 'linea' | 'tarjeta'
  titulo?: string
  boton?: string
  datos?: string
  children?: ReactNode
  className?: string
}) {
  const insignia = (
    <span aria-hidden="true" className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full" style={{ background: '#FBF3E2', border: '1px solid rgba(166,124,82,.35)', color: '#A67C52' }}>
      <Icono nombre="candado" size={14} grosor={1.8} />
    </span>
  )
  if (variante === 'tarjeta') {
    return (
      <div data-candado={datos} data-candado-tarjeta="1" className={`flex flex-col gap-3 rounded-[22px] p-4 ${className}`} style={{ background: '#FFFDF8', border: '1px solid rgba(166,124,82,.28)' }}>
        <div className="flex items-start gap-3">
          {insignia}
          <div className="flex flex-col gap-1">
            {titulo && <span style={{ font: "400 21px/1.12 'Instrument Serif',serif", textWrap: 'balance' as never }}>{titulo}</span>}
            <span style={{ font: "400 13px/1.45 'Geist'", color: 'rgba(28,34,48,.68)' }}>{texto}</span>
          </div>
        </div>
        <button type="button" onClick={abrirPase} className="h-[48px] rounded-full text-[14.5px] font-bold text-[#17120a]" style={{ background: 'linear-gradient(110deg,#E4C58A,#F7E6BE 50%,#E4C58A)' }}>
          {boton ?? 'Ver el Pase'}
        </button>
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={abrirPase}
      data-candado={datos}
      className={`flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left ${className}`}
      style={{ background: 'rgba(251,243,226,.7)', border: '1px solid rgba(166,124,82,.22)' }}
    >
      {insignia}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        {children && <span style={{ opacity: 0.5, filter: 'grayscale(1)' }}>{children}</span>}
        <span style={{ font: "500 12.5px/1.4 'Geist'", color: 'rgba(28,34,48,.62)' }}>{texto}</span>
      </span>
    </button>
  )
}
