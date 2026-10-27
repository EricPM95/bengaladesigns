import { haceCuanto, type AvisoDeCuenta } from '../../lib/avisos'
import { proponerCambioDeReserva } from '../../lib/reservasGrupo'
import { etiquetaDelCambio } from '../../lib/cambiarDiaPorReserva'
import { usePermisosDelViaje } from '../../hooks/usePermisosDelViaje'
import { useAvisosStore } from '../../store/useAvisosStore'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import { useReservasFocusStore } from '../../store/useReservasFocusStore'
import { useReservasGrupoUi } from '../../store/useReservasGrupoUi'
import { Avatar } from '../ajustes/Avatar'

/**
 * EL AVISO DE UNA ENTRADA (Tanda 10N3 §3; lo crea la base de datos, migración 0042): «Eric ha reservado el Coliseo para ti: jueves 26, 8:00.» (sin botones), «…el jueves 26 a las 8:00.» con [Reservar la mía a la
 * misma hora] y [Ya la tengo], y «Tu entrada del Coliseo es el viernes 27, y en la ruta está el jueves 26.» con [Ver mi reserva] y [Proponer el cambio] (el gancho de la propuesta: `proponerCambioDeReserva`).
 * Leído = deja de contar; se queda en la lista.
 */
export function AvisoDeEntrada({ aviso, ahora, foto, resaltado }: { aviso: AvisoDeCuenta; ahora: number; foto: string | null; resaltado: boolean }) {
  const p = aviso.payload as { caso?: string; trip_id?: string; reserva_id?: string; sitio?: string; dia_reserva?: string; dia_ruta?: string; date_iso?: string | null }
  const marcarLeidos = useAvisosStore((s) => s.marcarLeidos)
  const cerrar = useAvisosStore((s) => s.cerrar)
  const { rol } = usePermisosDelViaje()
  const sinLeer = !aviso.leido
  const caso = p.caso ?? 'incluido'

  /** Va al viaje de este aviso (si no es el abierto) y a RESERVAS, en Entradas. */
  const irAReservas = async (): Promise<boolean> => {
    void marcarLeidos([aviso.id])
    cerrar()
    const tripId = String(p.trip_id ?? '')
    if (tripId && useSyncStore.getState().activeTripId !== tripId) {
      const { abrirViajeGuardado } = await import('../../lib/abrirViaje')
      if (!abrirViajeGuardado(tripId)) return false
    }
    useRouteStore.getState().setMode('bookings')
    useReservasFocusStore.getState().pedir('entradas')
    return true
  }
  const pedir = (accion: 'misma-hora' | 'ya-la-tengo') => async () => {
    if (!(await irAReservas()) || !p.reserva_id) return
    useReservasGrupoUi.getState().pedir({ accion, reservaId: p.reserva_id })
  }
  const boton = 'rounded-full border border-accent px-3 py-1 text-[12.5px] font-semibold text-accent transition-colors hover:bg-accent-soft'

  return (
    <div
      data-aviso={aviso.id}
      data-aviso-tipo="reserva_grupo"
      data-aviso-caso={caso}
      data-sin-leer={sinLeer ? '1' : undefined}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 16, minHeight: 44, background: sinLeer ? 'oklch(0.8 0.14 70 / .14)' : 'transparent', outline: resaltado ? '2px solid oklch(0.8 0.14 70)' : 'none' }}
    >
      {aviso.quien ? (
        <Avatar foto={foto} inicial={(aviso.quien[0] ?? '·').toUpperCase()} tam={38} radio={12} fondo="#F1EADC" color="#1C2230" />
      ) : (
        <span aria-hidden="true" style={{ width: 38, height: 38, flex: 'none', borderRadius: 12, background: '#F1EADC', color: '#1C2230', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ·
        </span>
      )}
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ font: sinLeer ? "600 14px/1.35 'Geist'" : "500 14px/1.35 'Geist'", textWrap: 'pretty' }}>{aviso.texto}</span>
        <span style={{ font: "500 11px 'Geist'", color: 'rgba(28,34,48,.5)' }}>{haceCuanto(aviso.creado_en, ahora)}</span>
        {caso === 'no_incluido' && (
          <span className="flex flex-wrap items-center gap-2">
            <button type="button" data-accion="misma-hora" onClick={() => void pedir('misma-hora')()} className={boton}>
              Reservar la mía a la misma hora
            </button>
            <button type="button" data-accion="ya-la-tengo" onClick={() => void pedir('ya-la-tengo')()} className={boton}>
              Ya la tengo
            </button>
          </span>
        )}
        {caso === 'no_cuadra' && (
          <span className="flex flex-wrap items-center gap-2">
            <button type="button" data-accion="ver-mi-reserva" onClick={() => void irAReservas()} className={boton}>
              Ver mi reserva
            </button>
            <button
              type="button"
              data-accion="proponer-cambio"
              onClick={() => {
                void marcarLeidos([aviso.id])
                cerrar()
                proponerCambioDeReserva({ reservaId: p.reserva_id ?? '', sitio: p.sitio ?? '', diaDeLaReserva: p.dia_reserva ?? '', diaDeLaRuta: p.dia_ruta ?? '', dateIso: p.date_iso ?? null })
              }}
              className={boton}
            >
              {etiquetaDelCambio(rol, p.dia_reserva ?? '')}
            </button>
          </span>
        )}
      </span>
      {sinLeer && <span aria-label="Sin leer" data-punto-aviso style={{ width: 10, height: 10, flex: 'none', marginTop: 6, borderRadius: '50%', background: '#B58A2E' }} />}
    </div>
  )
}
