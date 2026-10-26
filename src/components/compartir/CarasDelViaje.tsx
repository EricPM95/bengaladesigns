import { useFotosDePerfil } from '../../hooks/useFotosDePerfil'
import { inicialDe, type Persona } from '../../store/useViajeCompartido'

const TONOS: { fondo: string; texto: string }[] = [
  { fondo: '#1C2230', texto: '#F3D59A' },
  { fondo: '#F3D59A', texto: '#1C2230' },
  { fondo: '#C9D6EA', texto: '#1C2230' },
  { fondo: '#E9D2DD', texto: '#1C2230' },
  { fondo: '#CFE3D4', texto: '#1C2230' },
]

/** El círculo de una persona: su foto, o su inicial (Tanda 10N §4a: «E A L M»). */
export function CaraDePersona({ persona, tam = 28, tono = 0, foto = null, borde = '#FFFDF8' }: { persona: Persona; tam?: number; tono?: number; foto?: string | null; borde?: string }) {
  const t = TONOS[tono % TONOS.length]
  return (
    <span
      data-cara-persona={persona.id}
      aria-hidden="true"
      style={{
        width: tam,
        height: tam,
        borderRadius: '50%',
        flex: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: foto ? `center / cover no-repeat url(${foto})` : t.fondo,
        color: t.texto,
        font: `600 ${Math.round(tam * 0.43)}px/1 'Geist'`,
        boxShadow: `0 0 0 2px ${borde}`,
      }}
    >
      {foto ? '' : inicialDe(persona)}
    </span>
  )
}

/** Las caras del viaje, solapadas: las iniciales en círculo («E A L M»). Si hay más de `max`, solo salen las primeras. */
export function CarasDelViaje({ personas, max = 4, tam = 28, borde }: { personas: Persona[]; max?: number; tam?: number; borde?: string }) {
  const visibles = personas.slice(0, max)
  const fotos = useFotosDePerfil(visibles.map((p) => p.foto))
  return (
    <span data-caras-del-viaje style={{ display: 'inline-flex', alignItems: 'center' }}>
      {visibles.map((p, i) => (
        <span key={p.id} style={{ marginLeft: i === 0 ? 0 : -tam * 0.28, zIndex: visibles.length - i, display: 'inline-flex' }}>
          <CaraDePersona persona={p} tam={tam} tono={i} foto={p.foto ? (fotos[p.foto] ?? null) : null} borde={borde} />
        </span>
      ))}
    </span>
  )
}
