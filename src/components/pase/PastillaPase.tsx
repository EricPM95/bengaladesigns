import { abrirPase, pagoActivo } from '../../lib/pago'
import { usePaseEstado } from '../../lib/paseEstado'
import { useSyncStore } from '../../store/useSyncStore'
import { Icono } from '../ui/Icono'

/**
 * LA PASTILLA DEL PASE (Tanda 10G; «Piezas/Pase Incluye», P0c y P0d, con los colores de Marca JUTRIP), en la tarjeta de cada destino de RUTA:
 *  - sin el pase (10N8 §2b): fondo azul oscuro con el candado dorado; mientras no se sabe, el hueco en gris claro sin texto (del mismo tamaño);
 *  - con el pase (P0d): «Pase Roma» con el ✓, sobre oro.
 * Al tocarla se abre `abrirPase()` (la misma función de todos los candados y de [Ver el Pase Roma]). Con varios destinos, cada tarjeta lleva la suya («Pase Florencia»…): el nombre sale de los datos del tramo.
 * `conPase` solo lo usan las capturas y la prueba (por defecto, la versión que se está viendo, `pagoActivo()`).
 */
export function PastillaPase({ destino, conPase: aMano }: { destino: string; conPase?: boolean }) {
  // (Tanda 10N §3) La misma fuente que HOY: el estado del pase que da el servidor (`usePaseEstado`), y `pagoActivo()` ya cuenta el «sin pase» de las pruebas. Así RUTA y HOY dicen lo mismo.
  const pase = usePaseEstado(useSyncStore((s) => s.activeTripId))
  const conPase = aMano ?? (pagoActivo() && !(pase.cobro && !pase.conPase))
  // (Tanda 10N4 §1) Mientras no se sabe lo del pase, ni «comprado» ni «bloqueado»: el sitio reservado, sin pintar (así la tarjeta no salta cuando llega la respuesta).
  if (aMano === undefined && pase.sabido === false) return <div data-pastilla-pase="cargando" aria-hidden className="h-[30px] w-[118px] rounded-full" style={{ background: 'rgba(28,34,48,.08)' }} />
  return (
    <button
      type="button"
      onClick={abrirPase}
      data-pastilla-pase={conPase ? 'con' : 'sin'}
      aria-label={conPase ? `Tienes el Pase ${destino}` : `Ver el Pase ${destino}`}
      className="zona-toque flex h-[30px] w-fit items-center gap-1.5 rounded-full pl-2.5 pr-3.5"
      style={
        conPase
          ? { background: 'linear-gradient(100deg,#E6CB8E 0%,#D2AE62 55%,#B38B3A 100%)', color: '#2E2008', border: '1px solid rgba(166,124,82,.45)', boxShadow: '0 1px 2px rgba(111,78,55,.25)' }
          : { background: '#1C2230', color: '#F3E2B0', border: '1px solid #1C2230' }
      }
    >
      <span style={{ display: 'flex', color: conPase ? '#2E2008' : '#D2B67A' }}>
        <Icono nombre={conPase ? 'hecho' : 'candado'} size={13} grosor={2} />
      </span>
      <span style={{ font: "700 13px 'Geist'", letterSpacing: '.005em', whiteSpace: 'nowrap' }}>Pase {destino}</span>
    </button>
  )
}
