import { useEffect, useState } from 'react'
import { darPlazaDelPase, plazasSinDar, type PersonaSinPlaza } from '../../lib/invitaciones'
import { AZUL_PASE, ORO_PASE, SOMBRA_PASE } from './Candado'

/**
 * (V27) LA PLAZA DEL PASE, en el azul y el dorado del pase (los mismos de las tarjetas bloqueadas), para que nadie la confunda con el código para unirse a un VIAJE (que sigue con los colores de siempre).
 *   · `CodigoDeLaPlaza`: el código de la plaza + el botón de compartirlo;
 *   · `DarLaPlaza`: «Dar la plaza a…»: las personas que ya están en el viaje y aún no tienen plaza, un toque y listo (sin código).
 */
export function CodigoDeLaPlaza({ codigo, sub, textoBoton, onCompartir, deshabilitado }: { codigo: string | null; sub?: string; textoBoton: string; onCompartir: () => void; deshabilitado?: boolean }) {
  return (
    <div data-codigo-de-la-plaza style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '16px 14px', borderRadius: 18, background: AZUL_PASE, boxShadow: SOMBRA_PASE, color: '#FFFDF8' }}>
      <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: '#E9C77A' }}>Código de la plaza del pase</span>
      <span data-codigo-invitacion data-codigo-del-pase style={{ font: "600 26px 'Geist Mono',monospace", letterSpacing: '.3em', minHeight: 32, color: '#F3D88F' }}>
        {codigo ?? '········'}
      </span>
      {sub && <span style={{ font: "500 12px 'Geist'", color: 'rgba(255,253,248,.7)', textAlign: 'center' }}>{sub}</span>}
      <button type="button" data-compartir-plaza data-boton-hoja="compartir-enlace" onClick={onCompartir} disabled={deshabilitado} style={{ height: 44, padding: '0 20px', borderRadius: 999, border: 'none', background: ORO_PASE, color: '#3A2A08', font: "700 13.5px 'Geist'", cursor: deshabilitado ? 'default' : 'pointer', opacity: deshabilitado ? 0.55 : 1 }}>
        {textoBoton}
      </button>
    </div>
  )
}

/** «Dar la plaza a…»: no sale si nadie del viaje está sin plaza. `alDar` avisa al padre para que vuelva a pedir los pases. */
export function DarLaPlaza({ passId, alDar, inicial = null }: { passId: string; alDar?: () => void; inicial?: PersonaSinPlaza[] | null }) {
  const [gente, setGente] = useState<PersonaSinPlaza[] | null>(inicial)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (inicial) return undefined
    let vivo = true
    void plazasSinDar(passId).then((g) => vivo && setGente(g))
    return () => {
      vivo = false
    }
  }, [passId, inicial])
  if (!gente || gente.length === 0) return null
  const dar = async (p: PersonaSinPlaza) => {
    setOcupado(p.id)
    setError(null)
    const e = await darPlazaDelPase(passId, p.id)
    setOcupado(null)
    if (e) {
      setError(e)
      return
    }
    setGente((g) => (g ?? []).filter((x) => x.id !== p.id))
    alDar?.()
  }
  return (
    <div data-dar-la-plaza style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 16, background: AZUL_PASE, boxShadow: SOMBRA_PASE, color: '#FFFDF8' }}>
      <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: '#E9C77A' }}>Dar la plaza a…</span>
      <span style={{ font: "400 12.5px/1.4 'Geist'", color: 'rgba(255,253,248,.7)' }}>Ya están en tu viaje: sin código, de un toque.</span>
      {gente.map((p) => (
        <div key={p.id} data-persona-sin-plaza={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span aria-hidden="true" style={{ width: 34, height: 34, flex: 'none', borderRadius: '50%', background: '#F1E3BF', color: '#6F4E37', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "400 17px/1 'Instrument Serif',serif" }}>
            {(p.nombre?.[0] ?? 'V').toUpperCase()}
          </span>
          <span style={{ flex: 1, font: "500 14px 'Geist'" }}>{p.nombre ?? 'Viajero'}</span>
          <button type="button" data-dar-plaza onClick={() => void dar(p)} disabled={ocupado !== null} style={{ height: 44, padding: '0 16px', borderRadius: 999, border: 'none', background: ORO_PASE, color: '#3A2A08', font: "700 13px 'Geist'", cursor: 'pointer', opacity: ocupado === p.id ? 0.6 : 1 }}>
            {ocupado === p.id ? 'Dando…' : 'Dar la plaza'}
          </button>
        </div>
      ))}
      {error && (
        <p role="alert" style={{ margin: 0, font: "500 12.5px/1.4 'Geist'", color: '#F3D88F' }}>
          {error}
        </p>
      )}
    </div>
  )
}
