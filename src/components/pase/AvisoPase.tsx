import { useEffect, useState } from 'react'
import { abrirPase, pagoActivo } from '../../lib/pago'
import { EVENTO_AVISO_PASE, type DetalleAvisoPase } from '../../lib/avisoPase'
import { textoDelAviso } from '../../lib/avisoPaseTextos'
import { useRouteStore } from '../../store/useRouteStore'
import { Hoja } from '../ui/Hoja'
import { AZUL_PASE, ORO_PASE } from './Candado'

/**
 * EL AVISO PEQUEÑO DEL PASE (Tanda 10N6 §1g; `Piezas/Pase Estilo` 04): una hoja desde abajo con la tarjeta azul oscuro con dorado.
 * Título «Desbloquéalo con el *Pase {destino}*», línea 1 (lo que tiene o ha usado), línea 2 en negrita (lo que gana) y el botón dorado
 * [Ver el Pase {destino}], que lleva a la película del pase (o a su final si ya la vio: lo decide `abrirPase()`).
 * Una sola pieza para toda la app y todos los destinos; se abre con `abrirAvisoPase(clave)`.
 */
export function AvisoPaseHost() {
  const [abierto, setAbierto] = useState<DetalleAvisoPase | null>(null)
  const deLaRuta = useRouteStore((s) => s.route?.destination) ?? ''

  useEffect(() => {
    const alPedir = (e: Event) => {
      if (pagoActivo()) return
      setAbierto((e as CustomEvent<DetalleAvisoPase>).detail)
    }
    window.addEventListener(EVENTO_AVISO_PASE, alPedir)
    return () => window.removeEventListener(EVENTO_AVISO_PASE, alPedir)
  }, [])

  if (!abierto) return null
  const destino = abierto.destino ?? deLaRuta
  return <AvisoPase clave={abierto.clave} destino={destino} onCerrar={() => setAbierto(null)} />
}

export function AvisoPase({ clave, destino, onCerrar }: { clave: string; destino: string; onCerrar: () => void }) {
  const t = textoDelAviso(clave, destino)
  const nombre = destino ? `Pase ${destino}` : 'Pase'
  return (
    <Hoja onCerrar={onCerrar} z={140} datos="aviso-pase" etiqueta={undefined}>
      {/* (Tanda 10N8 §8b-f) La ✕ de la hoja iba montada sobre el borde de la tarjeta azul: este hueco la deja fuera, separada. */}
      <span aria-hidden="true" data-aviso-pase-hueco-x="1" style={{ display: 'block', height: 36, flex: 'none' }} />
      <div
        data-aviso-pase={clave}
        className="relative flex flex-col items-center overflow-hidden text-center"
        style={{ borderRadius: 26, background: AZUL_PASE, boxShadow: '0 18px 30px -16px rgba(14,21,48,.8),inset 0 0 0 1.5px rgba(233,199,122,.55)', color: '#FBF3E2', padding: '22px 20px', gap: 14 }}
      >
        <span aria-hidden="true" className="pointer-events-none absolute" style={{ left: '50%', top: -50, marginLeft: -110, width: 220, height: 140, borderRadius: '50%', background: 'radial-gradient(circle,rgba(233,199,122,.3),transparent 70%)' }} />
        <span data-aviso-pase-titulo="1" className="relative" style={{ font: "400 25px/1.1 'Instrument Serif',serif" }}>
          Desbloquéalo con el <em style={{ color: '#F3D88F' }}>{nombre}</em>
        </span>
        <span className="relative flex flex-col" style={{ gap: 5 }}>
          {t.linea1 && (
            <span data-aviso-pase-linea1="1" style={{ font: "400 14px/1.35 'Geist'", color: 'rgba(251,243,226,.7)' }}>{t.linea1}</span>
          )}
          <span data-aviso-pase-linea2="1" style={{ font: "600 16.5px/1.3 'Geist'", color: '#FBF3E2' }}>{t.linea2}</span>
        </span>
        <button
          type="button"
          data-aviso-pase-ver="1"
          onClick={() => {
            onCerrar()
            abrirPase()
          }}
          className="relative flex items-center justify-center self-stretch"
          style={{ height: 52, padding: '0 18px', borderRadius: 15, border: 'none', cursor: 'pointer', background: ORO_PASE, color: '#4A3510', gap: 8, font: "700 15.5px 'Geist'", boxShadow: '0 10px 20px -12px rgba(110,80,24,.7),inset 0 1px 0 rgba(255,255,255,.55)' }}
        >
          Ver el {nombre}
        </button>
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={{ borderRadius: 'inherit' }}>
          <span className="absolute" style={{ top: '-20%', bottom: '-20%', left: 0, width: '22%', background: 'linear-gradient(90deg,transparent,rgba(255,236,170,.2),transparent)', animation: 'pase-brillo 5.5s ease-in-out infinite' }} />
        </span>
      </div>
    </Hoja>
  )
}
