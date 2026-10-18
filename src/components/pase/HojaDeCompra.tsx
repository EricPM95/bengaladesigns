import { useEffect, useState } from 'react'
import textos from '../../../data/pase/textos.json'
import { configDelPase, crearPagoDelPase, eur, filasDeCompra, irAPagar, limitesDelGrupo, totalDe, type ConfigPase, type PlanId } from '../../lib/pagoPase'
import { BotonHoja, Hoja } from '../ui/Hoja'
import { TextoConPase } from '../cuenta/TextoConPase'

const ORO = 'oklch(0.8 0.14 70)'

/**
 * LA HOJA DE COMPRA (cuentas parte 3, diseño «Pase y cuenta» P6): «¿Cuántos sois?» con 1 persona, el Pase Dúo (con su precio tachado y «5,50 € cada uno») y el Pase Grupo
 * (3 o más, con [−] y [+]). Los precios y el máximo del Grupo salen del servidor (data/pase/precios.json), nunca del móvil: al comprar solo se manda qué pase y cuántas personas.
 * Antes de [Comprar] hay un hueco para la línea legal que escribe el gestor (data/pase/textos.json). No nombra al servicio de pago.
 * `configInicial` solo lo usan las capturas y la prueba.
 */
export function HojaDeCompra({ destino, tripId, onCerrar, configInicial = null }: { destino: string; tripId: string | null; onCerrar: () => void; configInicial?: ConfigPase | null }) {
  const [config, setConfig] = useState<ConfigPase | null>(configInicial)
  const [plan, setPlan] = useState<PlanId>('grupo')
  const [personas, setPersonas] = useState(4)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (configInicial) return undefined
    let vivo = true
    void configDelPase().then((c) => {
      if (vivo) setConfig(c)
    })
    return () => {
      vivo = false
    }
  }, [configInicial])

  const planes = config?.precios?.planes ?? []
  const { desde, hasta } = limitesDelGrupo(planes)
  const n = Math.min(Math.max(personas, desde), hasta)
  const filas = filasDeCompra(planes, n)
  const total = totalDe(planes, plan, n)

  const comprar = async () => {
    setOcupado(true)
    setError(null)
    const r = await crearPagoDelPase({ destino, plan, personas: n, tripId })
    if (r.url) {
      irAPagar(r.url)
      return // (la app sale a la página de pago; al volver, PagoHost recoge el resultado)
    }
    setOcupado(false)
    setError(r.error)
  }

  return (
    <Hoja onCerrar={onCerrar} etiqueta={`Pase de ${destino}`} titulo="¿Cuántos sois?" datos="P6" z={92}>
      <span style={{ font: "400 13.5px/1.5 'Geist'", opacity: 0.75 }}>
        <TextoConPase texto="Se paga una vez y no caduca." />
      </span>
      {planes.length === 0 && <span style={{ font: "400 13.5px 'Geist'", opacity: 0.6 }}>Cargando los precios…</span>}
      {filas.map((f) => {
        const activa = plan === f.plan
        return (
          <div
            key={f.plan}
            role="radio"
            aria-checked={activa}
            tabIndex={0}
            data-fila-compra={f.plan}
            onClick={() => setPlan(f.plan)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setPlan(f.plan)
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', borderRadius: 16, background: activa ? 'oklch(0.8 0.14 70 / .14)' : '#FFFFFF', border: `1.5px solid ${activa ? ORO : 'rgba(28,34,48,.12)'}`, cursor: 'pointer', minHeight: 44 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ font: "600 14px 'Geist'" }}>{f.nombre}</span>
                {f.sub && <span style={{ font: "500 11.5px 'Geist'", color: 'oklch(0.48 0.17 5)' }}>{f.sub}</span>}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                {f.tachado && <span style={{ font: "500 11.5px 'Geist'", opacity: 0.5, textDecoration: 'line-through' }}>{f.tachado}</span>}
                <span style={{ font: "400 22px/1 'Instrument Serif',serif" }}>{f.precio}</span>
              </span>
            </div>
            {f.plan === 'grupo' && activa && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  aria-label="Una persona menos"
                  disabled={n <= desde}
                  onClick={(e) => {
                    e.stopPropagation()
                    setPersonas(Math.max(desde, n - 1))
                  }}
                  style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(28,34,48,.2)', background: '#FFFFFF', font: "600 18px 'Geist'", color: '#1C2230', cursor: 'pointer', opacity: n <= desde ? 0.4 : 1 }}
                >
                  −
                </button>
                <span data-personas style={{ flex: 1, textAlign: 'center', font: "600 15px 'Geist'" }}>
                  {n} personas
                </span>
                <button
                  type="button"
                  aria-label="Una persona más"
                  disabled={n >= hasta}
                  onClick={(e) => {
                    e.stopPropagation()
                    setPersonas(Math.min(hasta, n + 1))
                  }}
                  style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: '#1C2230', color: '#FFFDF8', font: "600 18px 'Geist'", cursor: 'pointer', opacity: n >= hasta ? 0.4 : 1 }}
                >
                  +
                </button>
              </div>
            )}
          </div>
        )
      })}
      {textos.linea_legal_compra && (
        <p data-linea-legal style={{ margin: 0, padding: '8px 12px', borderRadius: 10, background: 'rgba(28,34,48,.05)', font: "400 12px/1.45 'Geist'", opacity: 0.8 }}>
          {textos.linea_legal_compra}
        </p>
      )}
      {error && (
        <p role="alert" data-error-compra style={{ margin: 0, font: "500 13px/1.4 'Geist'", color: 'oklch(0.5 0.17 5)' }}>
          {error}
        </p>
      )}
      <BotonHoja tipo="principal" onClick={() => void comprar()} disabled={ocupado || total == null} datos="comprar">
        {total == null ? 'Comprar' : `Comprar · ${eur(total)}`}
      </BotonHoja>
    </Hoja>
  )
}
