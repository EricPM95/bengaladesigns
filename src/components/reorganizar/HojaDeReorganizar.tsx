import { useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CruzDeHoja } from '../ui/CruzDeHoja'
import { TiradorDeHoja } from '../ui/TiradorDeHoja'
import { BOTON_CLARO, BOTON_ORO } from '../ui/botonesOro'
import { FONDO_DE_HOJA } from '../ui/fondoDeHoja'
import { IconoReorganizar } from './IconoReorganizar'
import { FranjaVerde, TarjetaDelSitio } from '../route/hoy/v2/CambiarPlan'
import type { CambiosDeReorganizar } from '../../lib/tarjetasDePropuesta'

/**
 * (V61; Design «Reorganizar Hoja» RO1, RO2 y RO3) LA HOJA DE REORGANIZAR, una sola para las tres:
 *  - RO1 «¿Reorganizamos tu día?» (un día), RO2 «¿Reorganizamos tus días?» (varios: las tarjetas agrupadas por día, con una cabecera pequeña «VIERNES 27») y RO3 «¿Adaptamos tus días a tu vuelo?» (al guardar un vuelo).
 *  - Arriba, el texto concreto; una tarjeta (`TarjetaDelSitio`) SOLO por cada sitio que cambia de verdad, con a dónde va en gris y su cuadrado; la franja verde (`FranjaVerde`) con un solo ✓; y el dorado y el blanco con borde lado a lado.
 * Con más de 4 tarjetas se ven 4 y debajo «y N más», que al tocarlo despliega el resto. Piezas que ya existen; nada nuevo de diseño.
 */
const MAXIMO_VISIBLE = 4

export function HojaDeReorganizar({ id, titulo, texto, cambios, botonSi, trabajando = false, onSi, onNo }: {
  id: 'reorganizar' | 'adaptar-vuelos'
  titulo: string
  texto: string
  cambios: CambiosDeReorganizar
  botonSi: string
  trabajando?: boolean
  onSi: () => void
  onNo: () => void
}): ReactNode {
  const [abierto, setAbierto] = useState(false)
  let pintadas = 0
  const limite = abierto ? Infinity : MAXIMO_VISIBLE
  const resto = Math.max(0, cambios.total - MAXIMO_VISIBLE)
  const esAdaptar = id === 'adaptar-vuelos'
  return createPortal(
    <div data-hoja={id} data-alerta-reorganizar={esAdaptar ? undefined : '1'} data-alerta-adaptar={esAdaptar ? '1' : undefined} role="dialog" aria-modal="true" aria-label={titulo} style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="hoja-fondo" onClick={trabajando ? undefined : onNo} style={{ position: 'absolute', inset: 0, background: FONDO_DE_HOJA }} />
      <div className="hoja-panel" style={{ position: 'relative', width: '100%', maxWidth: 520, maxHeight: '92dvh', overflowY: 'auto', borderRadius: '32px 32px 0 0', background: '#FBF3E2', color: '#1C2230', padding: '10px 18px calc(28px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 -20px 40px rgba(0,0,0,.25)' }}>
        <TiradorDeHoja />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <IconoReorganizar circulo={44} />
            <span style={{ font: "400 28px/1.1 'Instrument Serif',serif" }}>{titulo}</span>
          </div>
          <CruzDeHoja enLinea onCerrar={onNo} />
        </div>
        <span data-reorganizar-texto="1" style={{ font: "400 14.5px/1.45 'Geist',sans-serif", color: 'rgba(28,34,48,.7)' }}>{texto}</span>
        {/* (V69) Si cambia el orden del mismo día, UNA frase que dice por qué (nunca una tarjeta «Después de…» por sitio). */}
        {cambios.frase && <span data-reorganizar-frase="1" style={{ font: "500 14.5px/1.45 'Geist',sans-serif", color: '#1C2230' }}>{cambios.frase}</span>}
        <div data-propuesta-tarjetas={cambios.total} className="flex flex-col gap-3">
          {cambios.grupos.map((g, gi) => {
            const visibles = g.tarjetas.filter(() => pintadas++ < limite)
            if (visibles.length === 0) return null
            return (
              <div key={gi} data-reorganizar-grupo={g.cabecera ?? 'unico'} className="flex flex-col gap-3">
                {g.cabecera && <span style={{ padding: '6px 4px 0', font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#6F4E37' }}>{g.cabecera}</span>}
                {visibles.map((t, k) => <TarjetaDelSitio key={`${t.nombre}-${k}`} t={t} sinFranja />)}
              </div>
            )
          })}
          {!abierto && resto > 0 && (
            <button type="button" onClick={() => setAbierto(true)} data-propuesta-mas-tarjetas className="zona-toque flex min-h-11 items-center justify-center text-[13.5px] font-semibold text-[#1C2230]/55">
              y {resto} más
            </button>
          )}
        </div>
        {cambios.franja && <FranjaVerde texto={cambios.franja} />}
        <div data-dos-botones="1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button type="button" data-reorganizar-si={esAdaptar ? undefined : '1'} data-adaptar-si={esAdaptar ? '1' : undefined} onClick={onSi} disabled={trabajando} style={{ ...BOTON_ORO, minHeight: 52, padding: '0 10px', lineHeight: 1.2, borderRadius: 16, border: 'none', cursor: 'pointer', font: "700 15px 'Geist',sans-serif", opacity: trabajando ? 0.7 : 1 }}>
            {botonSi}
          </button>
          <button type="button" data-reorganizar-no={esAdaptar ? undefined : '1'} data-adaptar-no={esAdaptar ? '1' : undefined} onClick={onNo} disabled={trabajando} style={{ ...BOTON_CLARO, minHeight: 52, padding: '0 10px', lineHeight: 1.2, borderRadius: 16, cursor: 'pointer', font: "700 15px 'Geist',sans-serif" }}>
            Dejarlo como está
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
