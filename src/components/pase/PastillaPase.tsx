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
      className="flex h-[30px] w-fit items-center gap-1.5 rounded-full pl-2.5 pr-3.5"
      style={
        conPase
          ? { background: 'linear-gradient(100deg,#E6CB8E 0%,#D2AE62 55%,#B38B3A 100%)', color: '#2E2008', border: '1px solid rgba(166,124,82,.45)', boxShadow: '0 1px 2px rgba(111,78,55,.25)' }
          : { background: '#FCF4E3', color: '#6F4E37', border: '1px solid #E4D2A4' }
      }
    >
      <Icono nombre={conPase ? 'hecho' : 'candado'} size={13} grosor={2} />
      <span style={{ font: "700 13px 'Geist'", letterSpacing: '.005em', whiteSpace: 'nowrap' }}>Pase de {destino}</span>
    </button>
  )
}
