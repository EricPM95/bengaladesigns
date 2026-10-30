import { useStopEntradas } from './useStopEntradas'

/** Los tres colores de la entrada (la regla de toda la app): frambuesa = te falta · verde = ya la tienes · azul oscuro con dorado = otro del grupo la tiene y te queda elegir la tuya (Tanda 10N5: ahora también en el botón de DÍAS, en las tarjetas de RESERVAS, en el Free Tour y en las excursiones; en la ficha, `EntradaDelGrupo`). */
export const FONDO_ENTRADA = {
  falta: { fondo: 'linear-gradient(145deg, oklch(0.62 0.18 5), oklch(0.48 0.16 5))', sombra: '0 8px 14px -8px oklch(0.45 0.16 5), inset 0 1px 0 rgba(255,255,255,.35)', borde: 'oklch(0.55 0.17 5)' },
  tengo: { fondo: 'linear-gradient(145deg, #3FA066, #2B7F45)', sombra: '0 8px 14px -8px #2B7F45, inset 0 1px 0 rgba(255,255,255,.35)', borde: '#2B7F45' },
  grupo: { fondo: 'linear-gradient(135deg,#1C2230,#252F55 60%,#1C2230)', sombra: 'inset 0 0 0 1.3px rgba(233,199,122,.65), 0 8px 14px -8px rgba(14,21,48,.8)', borde: '#B58A2E' },
} as const

/** El icono de la entrada de Design (el ticket con el corte), tal cual. */
export function TicketDesign({ size = 21, color = '#fff', grosor = 1.8 }: { size?: number; color?: string; grosor?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
      <path d="M3 9a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v1.5a1.5 1.5 0 0 0 0 3V15a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2zM14 7v10" />
    </svg>
  )
}

export interface BotonEntradaEstado {
  /** 'falta' (frambuesa: no la tienes), 'tengo' (verde con ✓: la tienes tú o te cubre la del dueño). */
  estado: 'falta' | 'tengo'
  /** Cuántos del viaje la tienen ya y tú no (el numerito del botón frambuesa); 0 = sin numerito. */
  cuantos: number
}

/**
 * Qué botón de entrada lleva una parada de DÍAS (null = ninguno: los datos no dan entradas de ese sitio, o es una parada «por fuera» sin entrada tuya).
 * La tarjeta lo usa también para no poner las etiquetas por debajo del botón.
 */
export function useBotonEntrada(stop: { id: string; name: string; isFreeTour?: boolean }, soloSiReservada = false): BotonEntradaEstado | null {
  const data = useStopEntradas(stop)
  if (!data) return null
  const tengo = data.reservation != null
  // (Tanda 11, punto 4: una parada que se ve por fuera no invita a reservar; solo se queda si el viajero ya tiene su entrada.)
  if (soloSiReservada && !tengo) return null
  return { estado: tengo ? 'tengo' : 'falta', cuantos: tengo ? 0 : data.cuantosLaTienen }
}

/**
 * EL BOTÓN DE LA ENTRADA EN LA TARJETA DE DÍAS (Tanda 10N4, `Piezas/Parada Entrada`): redondo (40 px, esquinas de 13), abajo a la derecha (a 12 px), con el icono de la entrada y NUNCA con palabras.
 *   - frambuesa: no tienes entrada; con un numerito arriba a la derecha cuando alguien del grupo ya la tiene (cuántos);
 *   - verde con un ✓ (en un circulito blanco, en el mismo sitio que el numerito): ya tienes la tuya (también si te cubre la del dueño).
 * Al tocarlo, la ficha abierta en su pestaña «Entradas» (allí están [Cambiar hora] y [Ver entrada]). La tarjeta deja libre su sitio: las etiquetas no pasan por debajo (ver `TrazoCard`).
 */
export function EntradaEdgeTab({ estado, onOpenEntradas }: { estado: BotonEntradaEstado | null; onOpenEntradas: () => void }) {
  if (!estado) return null
  const tengo = estado.estado === 'tengo'
  const delGrupo = !tengo && estado.cuantos > 0
  const color = FONDO_ENTRADA[tengo ? 'tengo' : delGrupo ? 'grupo' : 'falta']
  return (
    <button
      type="button"
      data-boton-entrada={tengo ? 'tengo' : estado.cuantos > 0 ? 'grupo' : 'falta'}
      data-cuantos={estado.cuantos || undefined}
      onClick={onOpenEntradas}
      aria-label={tengo ? 'Tu entrada está reservada. Ver las entradas' : estado.cuantos > 0 ? `Ver las entradas (${estado.cuantos} del viaje ya la tienen)` : 'Ver las entradas'}
      className="zona-toque absolute bottom-3 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-[13px] active:scale-95"
      style={{ background: color.fondo, boxShadow: color.sombra }}
    >
      <TicketDesign color={delGrupo ? '#F3D88F' : '#fff'} />
      {(tengo || estado.cuantos > 0) && (
        <span
          className="absolute -right-[7px] -top-[7px] flex h-5 w-5 items-center justify-center rounded-full"
          style={{ background: '#FFFDF8', border: `1.5px solid ${color.borde}`, color: color.borde, font: "700 11px/1 'Geist'" }}
        >
          {tengo ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2B7F45" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7" />
            </svg>
          ) : (
            estado.cuantos
          )}
        </span>
      )}
    </button>
  )
}
