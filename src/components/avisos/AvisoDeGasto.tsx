import { useState } from 'react'
import { haceCuanto, type AvisoDeCuenta } from '../../lib/avisos'
import { formatoImporte, leerImporte } from '../../lib/dinero'
import { useAvisosStore } from '../../store/useAvisosStore'
import { useGastosCompartidos } from '../../store/useGastosCompartidos'
import { Avatar } from '../ajustes/Avatar'
import { Icono } from '../ui/Icono'

/**
 * EL AVISO «ANA QUIERE AÑADIR AL PRESUPUESTO» (Tanda 10N, apartado 9; `Piezas/Presupuesto Compartido` 06, 07 y 08): en la campanita de quien decide (el administrador y quien puede editar), con el gasto DENTRO
 * del aviso («Cena día 1 · Para todos · pagó Ana · 30 €») y [Rechazar] [Aceptar] en el mismo aviso. Al decidir, ahí mismo queda «✓ Aceptado · suma al grupo» o «Rechazado», y el aviso se queda en la lista.
 * Si ya lo decidió otra persona (vale lo que decida el primero), se ve ya decidido, sin botones.
 */
export function AvisoDeGasto({ aviso, ahora, foto, resaltado }: { aviso: AvisoDeCuenta; ahora: number; foto: string | null; resaltado: boolean }) {
  const p = aviso.payload as { gasto_id?: string; nombre?: string; precio?: unknown; pago?: string; gasto_estado?: string }
  const [local, setLocal] = useState<'aceptado' | 'rechazado' | null>(null)
  const [enCurso, setEnCurso] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const decidir = useGastosCompartidos((s) => s.decidir)
  const marcarLeidos = useAvisosStore((s) => s.marcarLeidos)
  const estado = local ?? (p.gasto_estado === 'aceptado' ? 'aceptado' : p.gasto_estado === 'rechazado' ? 'rechazado' : p.gasto_estado === 'pendiente' ? 'pendiente' : p.gasto_estado ? 'retirado' : 'pendiente')
  const precio = leerImporte(p.precio)
  const sinLeer = !aviso.leido && estado === 'pendiente'

  const responder = async (decision: 'aceptado' | 'rechazado') => {
    if (enCurso || !p.gasto_id) return
    setEnCurso(true)
    setError(null)
    const fallo = await decidir(p.gasto_id, decision)
    setEnCurso(false)
    if (fallo && fallo !== 'YA_DECIDIDO') {
      setError(fallo)
      return
    }
    // (Si otra persona lo decidió antes, la lista que se recarga ya lo trae decidido.)
    if (!fallo) setLocal(decision)
    void marcarLeidos([aviso.id])
  }

  return (
    <div
      data-aviso={aviso.id}
      data-aviso-tipo="gasto_pendiente"
      data-gasto-estado={estado}
      data-sin-leer={sinLeer ? '1' : undefined}
      style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 18, background: estado === 'pendiente' ? 'oklch(0.8 0.14 70 / .14)' : '#FBF3E2', outline: resaltado ? '2px solid oklch(0.8 0.14 70)' : 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Avatar foto={foto} inicial={(aviso.quien?.[0] ?? '·').toUpperCase()} tam={38} radio={12} fondo="#F3D59A" color="#1C2230" />
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ font: sinLeer ? "600 14px/1.35 'Geist'" : "500 14px/1.35 'Geist'", textWrap: 'pretty' }}>{aviso.texto}</span>
          <span style={{ font: "500 11px 'Geist'", color: 'rgba(28,34,48,.5)' }}>{haceCuanto(aviso.creado_en, ahora)}</span>
        </span>
        {sinLeer && <span aria-label="Sin leer" data-punto-aviso style={{ width: 10, height: 10, flex: 'none', marginTop: 6, borderRadius: '50%', background: '#B58A2E' }} />}
      </div>
      <div data-gasto-dentro style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 14, background: 'rgba(255,253,248,.7)' }}>
        <span aria-hidden="true" style={{ width: 32, height: 32, flex: 'none', borderRadius: 10, background: 'oklch(0.55 0.1 220 / .14)', color: 'oklch(0.45 0.1 220)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icono nombre="comida" size={16} />
        </span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ font: "600 13.5px/1.25 'Geist'" }}>{p.nombre}</span>
          <span style={{ font: "500 11px 'Geist'", color: 'rgba(28,34,48,.55)' }}>Para todos{p.pago ? ` · pagó ${p.pago}` : ''}</span>
        </span>
        {precio && <span style={{ font: "600 14px 'Geist Mono',monospace" }}>{formatoImporte(precio)}</span>}
      </div>
      {estado === 'pendiente' ? (
        <>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" data-gasto-rechazar disabled={enCurso} onClick={() => void responder('rechazado')} style={{ flex: 1, height: 44, borderRadius: 999, border: '1px solid rgba(28,34,48,.18)', background: '#FFFDF8', color: '#1C2230', font: "600 14px 'Geist'", opacity: enCurso ? 0.5 : 1 }}>
              Rechazar
            </button>
            <button type="button" data-gasto-aceptar disabled={enCurso} onClick={() => void responder('aceptado')} className="btn-champan" style={{ flex: 1, height: 44, borderRadius: 999, font: "600 14px 'Geist'", opacity: enCurso ? 0.5 : 1 }}>
              Aceptar
            </button>
          </div>
          {error && <span role="alert" style={{ font: "500 12px 'Geist'", color: 'rgb(var(--accent-red))' }}>{error}</span>}
        </>
      ) : (
        <span
          data-gasto-resultado={estado}
          style={{
            height: 40,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            font: "600 13.5px 'Geist'",
            background: estado === 'aceptado' ? 'oklch(0.96 0.035 150)' : '#EDE8DE',
            color: estado === 'aceptado' ? 'oklch(0.36 0.09 150)' : 'rgba(28,34,48,.6)',
          }}
        >
          {estado === 'aceptado' ? (
            <>
              <Icono nombre="hecho" size={15} /> Aceptado · suma al grupo
            </>
          ) : estado === 'rechazado' ? (
            <>
              <Icono nombre="cerrar" size={13} /> Rechazado
            </>
          ) : (
            'Ya no está'
          )}
        </span>
      )}
    </div>
  )
}
