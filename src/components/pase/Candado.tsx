import { Fragment } from 'react'
import { abrirPase, usePasePintable } from '../../lib/pago'
import { useRouteStore } from '../../store/useRouteStore'

/** El candado de Design (`Piezas/Pase Estilo` 01), tal cual: 13 px, trazo de 2,4 en marrón oscuro. */
export function CandadoDeDesign({ size = 13, color = '#4A3510' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
      <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" />
    </svg>
  )
}

/** Los colores de lo bloqueado por el pase (Tanda 10N5 §6b, `Piezas/Pase Estilo` 01): azul oscuro con dorado, los mismos en la caja, en las pastillas y en las tarjetas bloqueadas. */
export const AZUL_PASE = 'linear-gradient(135deg,#1C2230,#252F55 60%,#1C2230)'
export const SOMBRA_PASE = 'inset 0 0 0 1.3px rgba(233,199,122,.55),0 10px 18px -12px rgba(14,21,48,.7)'
export const ORO_PASE = 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)'

/** El destino del pase: el del viaje abierto (nunca escrito a mano). */
export function useDestinoDelPase(): string {
  return useRouteStore((s) => s.route?.destination) ?? ''
}

/** «Con el {pase}, …»: el marcador `{pase}` sale en oro y en negrita como «Pase Roma» (el nombre del pase del destino, tal cual el diseño). */
export function LineaConPase({ texto, destino }: { texto: string; destino: string }) {
  const partes = texto.split('{pase}')
  return (
    <>
      {partes.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <b style={{ fontWeight: 700, color: '#F3D88F' }}>{destino ? `Pase ${destino}` : 'Pase'}</b>}
          {p}
        </Fragment>
      ))}
    </>
  )
}

/**
 * LA CAJA DE «ESTO LO PIDE EL PASE» DE TODA LA APP (Tanda 10N5 §6b; `Piezas/Pase Estilo` 01, «Dentro de Alojamiento, sin pase»; antes, el candado de la Tanda 10G). Quien no tiene el pase ve lo que el pase le daría,
 * cerrado y con su invitación: una caja pequeña, en azul oscuro con dorado, con el título («¿En qué zona te alojas?»), una línea («Con el **Pase Roma**, adaptamos tu ruta a tu alojamiento.») y el botón dorado
 * pequeño [candado Ver]. Pequeña a propósito: no agobia ni ocupa la pantalla. Al tocarla se abre `abrirPase()` (la película del pase). Es la ÚNICA pieza: RESERVAS, DÍAS, EXPLORAR, el alojamiento y Logros son esta.
 *
 * (Tanda 10N5 §0.2) Mientras no se sabe si hay pase, NO se pinta (ni cerrada ni abierta); al llegar la respuesta se repinta sola. Con pase no sale nunca, ni aunque quien la monta se equivoque.
 */
export function Candado({
  titulo,
  texto,
  boton = 'Ver',
  datos = 'candado',
  className = '',
  destino,
}: {
  titulo: string
  /** La línea, con `{pase}` donde va «Pase Roma» en oro: «Con el {pase}, adaptamos tu ruta a tu alojamiento.» */
  texto: string
  boton?: string
  datos?: string
  className?: string
  /** Solo las capturas y la prueba: el destino a mano (por defecto, el del viaje abierto). */
  destino?: string
}) {
  const estado = usePasePintable()
  const deLaRuta = useDestinoDelPase()
  if (estado !== 'sin') return null
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={abrirPase}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          abrirPase()
        }
      }}
      data-candado={datos}
      data-caja-pase="1"
      className={`relative flex w-full shrink-0 cursor-pointer items-center gap-3 overflow-hidden rounded-[20px] text-left ${className}`}
      style={{ background: AZUL_PASE, boxShadow: SOMBRA_PASE, color: '#FBF3E2', padding: '11px 12px 11px 16px' }}
    >
      <span className="flex min-w-0 flex-1 flex-col" style={{ gap: 1 }}>
        <span style={{ font: "400 20px/1.1 'Instrument Serif',serif" }}>{titulo}</span>
        <span style={{ font: "400 12.5px/1.3 'Geist'", color: 'rgba(251,243,226,.72)' }}>
          <LineaConPase texto={texto} destino={destino ?? deLaRuta} />
        </span>
      </span>
      <span data-caja-pase-ver="1" className="flex flex-none items-center" style={{ height: 34, padding: '0 13px', borderRadius: 12, background: ORO_PASE, color: '#4A3510', gap: 6, font: "700 13px 'Geist'" }}>
        <CandadoDeDesign />
        {boton}
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={{ borderRadius: 'inherit' }}>
        <span className="absolute" style={{ top: '-20%', bottom: '-20%', left: 0, width: '22%', background: 'linear-gradient(90deg,transparent,rgba(255,236,170,.2),transparent)', animation: 'pase-brillo 5.5s ease-in-out infinite' }} />
      </span>
    </div>
  )
}
