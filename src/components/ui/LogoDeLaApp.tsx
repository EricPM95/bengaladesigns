import { marca } from '../../lib/marca'
import { LogoJutrip } from './LogoJutrip'

/**
 * El hueco del logo (cuentas parte 3): con `logo` en data/marca.json pinta el logo de JUTRIP (Tanda 10: la estrella con su anillo y su ruta de puntos, y la palabra debajo);
 * sin él, el recuadro de puntos del diseño. Lo usan la pantalla de «te invitan» y los avisos. `size` es el ancho de la estrella.
 */
export function LogoDeLaApp({ size = 84, tono = 'claro' }: { size?: number; radius?: number; tono?: 'claro' | 'oscuro' }) {
  if (marca.logo) return <LogoJutrip tam={size} tono={tono} />
  return (
    <span
      data-logo-hueco
      aria-hidden="true"
      style={{ width: size, height: size, borderRadius: 24, border: '1.5px dashed rgba(255,253,248,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', color: 'rgba(255,253,248,.55)' }}
    >
      LOGO
    </span>
  )
}
