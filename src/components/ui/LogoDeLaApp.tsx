import { marca } from '../../lib/marca'

/**
 * El hueco del logo (cuentas parte 3): vacío y preparado. Con `logo` en data/marca.json pinta la imagen; sin él, el recuadro de puntos del diseño.
 * Lo usan la pantalla de entrar, la de apertura y la de «te invitan».
 */
export function LogoDeLaApp({ size = 84, radius = 24 }: { size?: number; radius?: number }) {
  if (marca.logo) return <img src={marca.logo} alt="" width={size} height={size} style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover' }} />
  return (
    <span
      data-logo-hueco
      aria-hidden="true"
      style={{ width: size, height: size, borderRadius: radius, border: '1.5px dashed rgba(255,253,248,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', color: 'rgba(255,253,248,.55)' }}
    >
      LOGO
    </span>
  )
}
