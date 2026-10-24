import { abrirPase, pagoActivo } from '../../lib/pago'
import { Icono } from '../ui/Icono'

/**
 * LA PASTILLA DEL PASE (Tanda 10G; «Piezas/Pase Incluye», P0c y P0d, con los colores de Marca JUTRIP), en la tarjeta de cada destino de RUTA:
 *  - sin el pase (P0c): «Pase de Roma» con el candado, sobre marfil;
 *  - con el pase (P0d): «Pase de Roma» con el ✓, sobre oro.
 * Al tocarla se abre `abrirPase()` (la misma función de todos los candados y de [Ver el Pase de Roma]). Con varios destinos, cada tarjeta lleva la suya («Pase de Florencia»…): el nombre sale de los datos del tramo.
 * `conPase` solo lo usan las capturas y la prueba (por defecto, la versión que se está viendo, `pagoActivo()`).
 */
export function PastillaPase({ destino, conPase = pagoActivo() }: { destino: string; conPase?: boolean }) {
  return (
    <button
      type="button"
      onClick={abrirPase}
      data-pastilla-pase={conPase ? 'con' : 'sin'}
      aria-label={conPase ? `Tienes el Pase de ${destino}` : `Ver el Pase de ${destino}`}
      className="flex h-[22px] w-fit items-center gap-1.5 rounded-full pl-1.5 pr-2.5"
      style={
        conPase
          ? { background: 'linear-gradient(110deg,#E4C58A,#F7E6BE 50%,#E4C58A)', color: '#3A2A12', border: '1px solid rgba(166,124,82,.35)' }
          : { background: '#FBF3E2', color: '#6F4E37', border: '1px solid rgba(166,124,82,.35)' }
      }
    >
      <Icono nombre={conPase ? 'hecho' : 'candado'} size={12} grosor={2.2} />
      <span style={{ font: "600 11px 'Geist'", letterSpacing: '.01em', whiteSpace: 'nowrap' }}>Pase de {destino}</span>
    </button>
  )
}
