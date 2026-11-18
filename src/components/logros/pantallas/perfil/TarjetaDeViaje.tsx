import { useState, type ReactNode } from 'react'
import { usePortadaDeViaje } from '../../../../hooks/usePortadaDeViaje'
import { HojaPortada } from '../../../perfil/HojaPortada'
import { plural, type ResumenViaje } from '../../../../lib/viajesPerfil'
import { Icono } from '../../../ui/Icono'
import { todayIso } from '../../../../lib/dateRange'
import { diasDelViaje, textoDeDias } from '../../../../lib/duracionViaje'

/**
 * (TANDA V8, `Perfil Zona` de Design: sin la etiqueta «Hecho»; debajo de la foto, «11 paradas · 5 fotos» y una flecha redonda pequeña en vez de [Abrir este viaje]; TODA la tarjeta abre el viaje (como [Abrir este viaje] de antes: un viaje ya hecho, por dentro; los demás, en la app), menos la cámara.)
 * UN VIAJE DE «MIS VIAJES» EN FILA PARA DESLIZAR (Tanda 10N5, apartado 4, `Piezas/Perfil Orden` 01 a 04 y `Piezas/Mis Viajes Tarjeta`, exactamente igual): una tarjeta de 330 px con la portada arriba (142 px), la etiqueta
 * («Próximo», «En curso», «Ya hecho») arriba a la izquierda, SOLO el icono de la cámara arriba a la derecha para cambiar la portada (sin texto), el destino en grande con «26 – 29 nov 2026» abajo a la
 * izquierda y, debajo, el botón «Abrir este viaje» bien visible. Sin foto del destino, el degradado de Design (uno por destino, siempre el mismo). Fuera la pastilla de las fotos.
 * Tocar la portada abre el viaje por dentro (su álbum / su ficha); [Abrir este viaje] lo abre en la app. En el modo [Editar] la cámara pasa a ser la papelera (o «salir», si el viaje es de otra persona).
 */
export type EtiquetaDeViaje = 'en_curso' | 'proximo' | 'hecho'

export const TEXTO_DE_ETIQUETA: Record<EtiquetaDeViaje, string> = { en_curso: 'En curso', proximo: 'Próximo', hecho: 'Ya hecho' }

/** El matiz (0 a 359) del degradado de un destino: siempre el mismo para el mismo destino. */
export function matizDe(destino: string): number {
  let h = 0
  for (const c of destino) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h % 360
}
/** El degradado de Design (`Perfil Orden`): `linear-gradient(150deg, oklch(0.7 0.07 H), oklch(0.46 0.06 H+25))`. */
export const degradadoDeViaje = (destino: string): string => {
  const m = matizDe(destino)
  return `linear-gradient(150deg,oklch(0.7 0.07 ${m}),oklch(0.46 0.06 ${(m + 25) % 360}))`
}

/** «En 12 días» (Design, `Piezas/Mis Viajes Tarjeta`): la cuenta atrás hasta el primer día; «Hoy» / «Mañana»; «Próximo» si el viaje no tiene fechas. */
export function cuentaAtras(inicioIso: string | null, hoyIso: string = todayIso()): string {
  if (!inicioIso) return 'Próximo'
  const n = Math.round((Date.parse(`${inicioIso}T00:00:00Z`) - Date.parse(`${hoyIso}T00:00:00Z`)) / 86400000)
  if (!Number.isFinite(n) || n < 0) return 'Próximo'
  if (n === 0) return 'Hoy'
  return n === 1 ? 'Mañana' : `En ${n} días`
}

/** (V12, `Perfil Viajes` de Design) Una sola línea debajo de la foto, igual para todos: «5 días · 49 paradas» (los días son los de las fechas del viaje; sin noches ni fotos). `hecho` y `fotos` se quedan por compatibilidad. */
export function chipsDeViaje(v: Pick<ResumenViaje, 'dias' | 'paradas' | 'route'>, _hecho: boolean = false, _fotos: number = 0): string[] {
  const total = diasDelViaje(v.route) || v.dias
  return [...(total > 0 ? [textoDeDias(total)] : []), plural(v.paradas, 'parada', 'paradas')]
}

const ESTILO_ETIQUETA: Record<EtiquetaDeViaje, { background: string; color: string }> = {
  en_curso: { background: '#2B7F45', color: '#fff' },
  proximo: { background: '#F3E3B2', color: '#4A3510' },
  hecho: { background: 'rgba(255,253,248,.92)', color: '#1C2230' },
}


export function TarjetaDeViaje({ viaje, etiqueta, onAbrirViaje, onRecuerdos, editando = false, onEliminar, ancho = '60%' }: { viaje: ResumenViaje; etiqueta: EtiquetaDeViaje; onAbrirViaje: () => void; onRecuerdos: () => void; editando?: boolean; onEliminar?: () => void; ancho?: string }): ReactNode {
  const esInvitado = Boolean(viaje.guardado?.esInvitado)
  // La portada: la que eligió; si no, la primera foto suya al acabar el viaje; y si no, la del destino (o el degradado de siempre).
  const portada = usePortadaDeViaje(viaje.id, viaje.destino, viaje.fase === 'hecho')
  const [cambiandoPortada, setCambiandoPortada] = useState(false)
  const hecho = etiqueta === 'hecho'
  // (10S) La línea de fechas lleva SOLO las fechas («26 – 29 nov 2026»); los días ya van en los chips de debajo.
  const fechas = viaje.cuando
  const textoEtiqueta = etiqueta === 'proximo' ? cuentaAtras(viaje.inicioIso) : TEXTO_DE_ETIQUETA[etiqueta]
  const chips = chipsDeViaje(viaje)
  return (
    <div data-tarjeta-de-viaje={viaje.id} data-etiqueta-de-viaje={etiqueta} data-portada-origen={portada.url ? portada.origen : 'degradado'} style={{ flex: 'none', width: ancho, scrollSnapAlign: 'start', borderRadius: 26, overflow: 'hidden', background: '#FFFDF8', boxShadow: '0 12px 24px -14px rgba(28,34,48,.5)' }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: '100%', height: 150, background: degradadoDeViaje(viaje.destino), position: 'relative', overflow: 'hidden' }}>
          {portada.url ? (
            <img src={portada.url} alt="" aria-hidden="true" loading="lazy" decoding="async" draggable={false} data-portada-foto-url={portada.url.slice(0, 80)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg,rgba(255,255,255,.1) 0 2px,transparent 2px 12px)' }} />
          )}
        </div>
        <button type="button" onClick={editando ? undefined : onAbrirViaje} data-viaje-del-perfil={viaje.id} aria-label={`${viaje.destino}, ${fechas}`} style={{ position: 'absolute', inset: 0, width: '100%', border: 'none', padding: 0, background: 'linear-gradient(180deg,rgba(10,12,20,.1) 25%,rgba(10,12,20,.7))', cursor: 'pointer' }} />
        {!hecho && (
          <span data-etiqueta-texto style={{ position: 'absolute', left: 14, top: 14, height: 24, padding: '0 10px', borderRadius: 999, ...ESTILO_ETIQUETA[etiqueta], display: 'flex', alignItems: 'center', font: "500 11.5px 'Geist'", letterSpacing: '.01em', pointerEvents: 'none' }}>
            {textoEtiqueta}
          </span>
        )}
        {editando && onEliminar ? (
          <button className="zona-toque"
            type="button"
            onClick={onEliminar}
            data-eliminar-viaje={viaje.id}
            aria-label={esInvitado ? `Salir del viaje a ${viaje.destino}` : `Eliminar el viaje a ${viaje.destino}`}
            title={esInvitado ? 'Salir de este viaje' : 'Eliminar viaje'}
            style={{ position: 'absolute', right: 12, top: 12, width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'rgba(255,253,248,.95)', color: 'rgb(var(--accent-red))', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Icono nombre={esInvitado ? 'salir' : 'papelera'} size={19} />
          </button>
        ) : (
          <button className="zona-toque" type="button" onClick={() => setCambiandoPortada(true)} data-cambiar-portada={viaje.id} aria-label={`Cambiar la portada del viaje a ${viaje.destino}`} style={{ position: 'absolute', right: 12, top: 12, width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'rgba(255,253,248,.92)', color: '#1C2230', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#1C2230" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
              <path d="M4 8h3l2-3h6l2 3h3v11H4zM12 11a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />
            </svg>
          </button>
        )}
        {portada.credito && (
          <span data-credito-portada style={{ position: 'absolute', left: 14, top: hecho ? 16 : 44, maxWidth: 'calc(100% - 70px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', font: "400 8.5px 'Geist Mono',monospace", letterSpacing: '.04em', color: 'rgba(255,253,248,.65)', pointerEvents: 'none' }}>
            {portada.credito}
          </span>
        )}
        <span style={{ position: 'absolute', left: 16, bottom: 12, right: 14, display: 'flex', flexDirection: 'column', gap: 3, color: '#fff', pointerEvents: 'none' }}>
          <span style={{ font: "400 34px/1 'Instrument Serif',serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{viaje.destino}</span>
          <span data-fechas-del-viaje style={{ font: "500 12px 'Geist Mono',monospace", opacity: 0.9 }}>{fechas}</span>
        </span>
      </div>
      <div data-chips-del-viaje style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px 4px 0' }}>
        <button type="button" onClick={onAbrirViaje} disabled={editando} data-abrir-este-viaje aria-label={`Abrir el viaje a ${viaje.destino}`} style={{ flex: 1, minWidth: 0, minHeight: 44, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 0 0 16px', font: "500 14px 'Geist'", color: 'rgba(28,34,48,.62)', textAlign: 'left', opacity: editando ? 0.45 : 1 }}>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {chips.map((c, i) => (
              <span key={c} data-chip-del-viaje>
                {i > 0 ? ' · ' : ''}
                {c}
              </span>
            ))}
          </span>
        </button>
        <button type="button" onClick={onRecuerdos} disabled={editando} data-recuerdos-del-viaje={viaje.id} aria-label="Recuerdos del viaje" title="Recuerdos del viaje" style={{ flex: 'none', width: 38, height: 38, borderRadius: '50%', border: 'none', padding: 0, background: '#F3E6C8', color: '#6E5018', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: editando ? 0.45 : 1 }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="7" y="3.5" width="13.5" height="13.5" rx="3" />
            <path d="M4 7.5v10A3.5 3.5 0 0 0 7.5 21h10M7 14l3.5-3.5L14 14l2-2 4.5 4.5M16 8.2h.01" />
          </svg>
        </button>
      </div>
      {cambiandoPortada && <HojaPortada tripId={viaje.id} destino={viaje.destino} onCerrar={() => setCambiandoPortada(false)} />}
    </div>
  )
}
