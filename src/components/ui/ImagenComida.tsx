/**
 * (V59 §3; Design «Piezas/Imagen Comida», I1) LA imagen fija de una comida o una cena, en lugar de la foto: comer, color cálido con los cubiertos claros; cenar, azul noche con los cubiertos dorados y unas estrellas.
 * Una sola pieza para toda la app donde salga una comida o una cena (la tarjeta de HOY, «Tu día», la fila de DÍAS). Llena su contenedor (`absolute inset-0`) o, con `tam`, es un cuadrado.
 */
export type TipoDeComida = 'comer' | 'cenar'

const COLORES: Record<TipoDeComida, { fondo: string; brillo: string; tinta: string; opacidad: number }> = {
  comer: { fondo: 'linear-gradient(160deg,#F2C48A 0%,#E39A58 55%,#C46F32 100%)', brillo: 'radial-gradient(60% 80% at 50% 40%,rgba(255,240,200,.45),transparent 70%)', tinta: '#FFF6E2', opacidad: 0.95 },
  cenar: { fondo: 'linear-gradient(160deg,#2A3050 0%,#1C2230 60%,#141826 100%)', brillo: 'radial-gradient(60% 80% at 50% 45%,rgba(243,216,143,.2),transparent 70%)', tinta: '#F3D88F', opacidad: 1 },
}

export function ImagenComida({ tipo, tam, className = '', redondeo }: { tipo: TipoDeComida; /** Un cuadrado de este lado (px). Sin él, llena el contenedor. */ tam?: number; className?: string; redondeo?: number }) {
  const c = COLORES[tipo]
  const caja = tam ? { width: tam, height: tam, position: 'relative' as const, flex: 'none' as const, borderRadius: redondeo ?? 14 } : { position: 'absolute' as const, inset: 0 }
  return (
    <span data-imagen-comida={tipo} aria-hidden="true" className={`block overflow-hidden ${className}`} style={{ ...caja, background: c.fondo }}>
      <span className="absolute inset-0" style={{ background: c.brillo }} />
      <span className="absolute inset-0" style={{ background: 'repeating-linear-gradient(135deg,rgba(255,255,255,.05) 0 2px,transparent 2px 16px)' }} />
      <svg viewBox="0 0 120 80" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <g transform="translate(78 40) scale(.82)" stroke={c.tinta} strokeWidth="2.4" opacity={c.opacidad}>
          <path d="M-16 -22v12a5 5 0 0 0 10 0v-12M-11 -22v44M-16 -22M-11 -10v32" />
          <path d="M13 -22c-6 5-6 15-2 20h6v24M17 -22v44" />
        </g>
        <g transform="translate(78 40) scale(.82)" stroke="#FFFFFF" strokeOpacity=".5" strokeWidth=".7">
          <path d="M-16.8 -21.5v11.5M13.2 -21.5c-5 4.6-5 14-1.6 18.5" />
        </g>
        {tipo === 'cenar' && (
          <g fill="#F3D88F">
            <circle cx="14" cy="12" r="1.1" />
            <circle cx="104" cy="16" r="1.4" />
            <circle cx="96" cy="64" r=".9" />
            <circle cx="24" cy="60" r="1.2" />
            <circle cx="82" cy="10" r=".8" />
          </g>
        )}
      </svg>
    </span>
  )
}
