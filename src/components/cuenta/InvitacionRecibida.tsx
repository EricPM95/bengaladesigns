import { botonChampan } from '../../lib/marcaBoton'
import { createPortal } from 'react-dom'
import { titularDeInvitacion, textoDeInvitacionNoValida, type VistaDeInvitacion } from '../../lib/invitaciones'
import { formatHeaderDateRangeShortEs } from '../../lib/dateRange'
import { TextoConPase } from './TextoConPase'
import { LogoPequeno } from '../ui/LogoJutrip'

/** «Roma · 16 – 19 oct 2026»: el destino y las fechas, en una línea. Sin fechas, solo el destino. */
export function lineaDelViaje(v: Pick<VistaDeInvitacion, 'destino' | 'inicio' | 'fin'>): string {
  const destino = v.destino?.trim() ?? ''
  if (!v.inicio || !v.fin) return destino
  return `${destino ? `${destino} · ` : ''}${formatHeaderDateRangeShortEs(v.inicio, v.fin)} ${v.fin.slice(0, 4)}`
}

/**
 * LO QUE VE QUIEN RECIBE EL ENLACE (cuentas parte 3, P7b): «Laura te invita a su Pase de Roma», las fechas, «Sin pagar nada» (si la invitación va con pase) y [Unirme].
 * Si todavía no tiene cuenta, [Unirme] lleva a la pantalla de entrar y, al entrar, se une. Una invitación que no vale (anulada, sin plazas) lo dice y deja seguir.
 */
export function InvitacionRecibida({ vista, onUnirme, onSeguir, ocupado = false, error = null }: { vista: VistaDeInvitacion; onUnirme: () => void; onSeguir: () => void; ocupado?: boolean; error?: string | null }) {
  const inicial = (vista.invitador?.trim()?.[0] ?? '?').toUpperCase()
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Te invitan a un viaje"
      data-invitacion-recibida
      style={{ position: 'fixed', inset: 0, zIndex: 91, background: 'radial-gradient(120% 70% at 50% 10%,#3A3550 0%,#141826 70%)', color: '#FFFDF8', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'max(150px, 18vh) 26px calc(44px + env(safe-area-inset-bottom))', gap: 16, textAlign: 'center', overflowY: 'auto' }}
    >
      {/* (Tanda 10N §5) El logo de JUTRIP, pequeño, arriba del todo y en el centro. */}
      <span data-logo-invitacion style={{ position: 'absolute', top: 'calc(22px + env(safe-area-inset-top))', left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <LogoPequeno tono="oscuro" tam={22} />
      </span>
      {vista.valida ? (
        <>
          <span aria-hidden="true" style={{ width: 84, height: 84, borderRadius: '50%', background: '#F3D59A', color: '#1C2230', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "400 40px/1 'Instrument Serif',serif", boxShadow: '0 0 0 4px rgba(243,213,154,.25)' }}>
            {inicial}
          </span>
          <h1 data-titular style={{ margin: 0, font: "400 32px/1.12 'Instrument Serif',serif", textWrap: 'balance' }}>
            <TextoConPase texto={titularDeInvitacion(vista)} oscuro />
          </h1>
          <p style={{ margin: 0, font: "500 12.5px 'Geist Mono',monospace", color: 'rgba(255,253,248,.7)' }}>{lineaDelViaje(vista)}</p>
          {vista.con_pase && (
            <span style={{ height: 30, padding: '0 12px', borderRadius: 999, background: 'rgba(255,253,248,.1)', display: 'flex', alignItems: 'center', font: "500 12.5px 'Geist'", color: '#F3D59A' }}>Sin pagar nada</span>
          )}
        </>
      ) : (
        <h1 data-titular style={{ margin: 0, font: "400 30px/1.15 'Instrument Serif',serif", textWrap: 'balance' }}>
          {textoDeInvitacionNoValida(vista.motivo)}
        </h1>
      )}
      <span style={{ flex: 1, minHeight: 24 }} />
      {error && (
        <p role="alert" style={{ margin: 0, font: "500 13px/1.4 'Geist'", color: '#F3D59A' }}>
          {error}
        </p>
      )}
      {vista.valida ? (
        <button type="button" onClick={onUnirme} disabled={ocupado} data-unirme style={{ width: '100%', maxWidth: 420, height: 56, flex: 'none', borderRadius: 999, ...botonChampan(true), font: "700 16px 'Geist'", cursor: 'pointer', opacity: ocupado ? 0.6 : 1 }}>
          Unirme
        </button>
      ) : (
        <button type="button" onClick={onSeguir} data-seguir style={{ width: '100%', maxWidth: 420, height: 56, flex: 'none', borderRadius: 999, border: '1px solid rgba(255,253,248,.3)', background: 'transparent', color: '#FFFDF8', font: "600 15px 'Geist'", cursor: 'pointer' }}>
          Seguir
        </button>
      )}
    </div>,
    document.body,
  )
}
