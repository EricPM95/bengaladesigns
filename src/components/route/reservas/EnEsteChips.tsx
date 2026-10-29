import type { Persona } from '../../../store/useViajeCompartido'
import { inicialDe, nombreDe } from '../../../store/useViajeCompartido'

const ORO = 'linear-gradient(145deg,#FFF6DC,#E9C77A 60%,#B58A2E)'

/** «En este vuelo» / «En este alojamiento» (Design 06 y 09): una pastilla redonda por persona con su inicial y su nombre («Tú» para quien mira). Solo se enseña quién es, sin elegir: redondo. */
export function EnEsteChips({ gente, datos }: { gente: Persona[]; datos: string }) {
  return (
    <div className="flex flex-wrap gap-2" data-en-este-chips={datos}>
      {gente.map((p) => (
        <span key={p.id} className="inline-flex h-10 items-center gap-2 rounded-full pl-1.5 pr-3.5 text-[14px] font-semibold" style={{ background: '#FFFDF8', border: '1px solid rgba(28,34,48,.14)' }}>
          <span className="flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold" style={p.esAdmin ? { background: '#1C2230', color: '#F3D88F' } : { background: ORO, color: '#4A3510' }}>
            {inicialDe(p)}
          </span>
          {p.esYo ? 'Tú' : nombreDe(p) || 'Alguien'}
        </span>
      ))}
    </div>
  )
}
