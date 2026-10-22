import { marca } from '../../lib/marca'
import { EstrellaJutrip, LogoJutrip } from './LogoJutrip'

/**
 * El hueco del logo (cuentas parte 3): con `logo` en data/marca.json pinta el logo de JUTRIP (Tanda 10E: la palabra en Italiana con su estrella sobre la I; en un hueco pequeño, solo la estrella);
 * sin él, el recuadro de puntos del diseño. Lo usan la pantalla de «te invitan» y los avisos. `size` es el lado del hueco: la palabra usa la mitad como cuerpo de letra.
 */
export function LogoDeLaApp({ size = 84, tono = 'claro' }: { size?: number; radius?: number; tono?: 'claro' | 'oscuro' }) {
  if (marca.logo) return size < 60 ? <EstrellaJutrip tam={Math.round(size * 0.8)} /> : <LogoJutrip tam={Math.round(size / 2)} tono={tono} />
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
