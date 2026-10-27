import { useState, type ReactNode } from 'react'
import { usePortadaDeViaje } from '../../../../hooks/usePortadaDeViaje'
import { HojaPortada } from '../../../perfil/HojaPortada'
import { plural, type ResumenViaje } from '../../../../lib/viajesPerfil'
import { Icono } from '../../../ui/Icono'

/**
 * UN VIAJE DE «MIS VIAJES» EN FILA PARA DESLIZAR (Tanda 10N5, apartado 4, `Piezas/Perfil Orden` 01 a 04 y `Piezas/Mis Viajes Tarjeta`, exactamente igual): una tarjeta de 330 px con la portada arriba (142 px), la etiqueta
 * («Próximo», «En curso», «Ya hecho») arriba a la izquierda, SOLO el icono de la cámara arriba a la derecha para cambiar la portada (sin texto), el destino en grande con «26 – 29 nov 2026 · 4 días» abajo a la
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

const ESTILO_ETIQUETA: Record<EtiquetaDeViaje, { background: string; color: string }> = {
  en_curso: { background: '#2B7F45', color: '#fff' },
  proximo: { background: '#F3E3B2', color: '#4A3510' },
  hecho: { background: '#E9E3D6', color: '#4A3C28' },
}

/** «26 – 29 nov 2026 · 4 días». */
export const fechasYDias = (v: Pick<ResumenViaje, 'cuando' | 'dias'>): string => [v.cuando, v.dias > 0 ? plural(v.dias, 'día', 'días') : ''].filter(Boolean).join(' · ')

export function TarjetaDeViaje({ viaje, etiqueta, onAbrir, onAbrirViaje, editando = false, onEliminar }: { viaje: ResumenViaje; etiqueta: EtiquetaDeViaje; onAbrir: () => void; onAbrirViaje: () => void; editando?: boolean; onEliminar?: () => void }): ReactNode {
  const esInvitado = Boolean(viaje.guardado?.esInvitado)
  // La portada: la que eligió; si no, la primera foto suya al acabar el viaje; y si no, la del destino (o el degradado de siempre).
  const portada = usePortadaDeViaje(viaje.id, viaje.destino, viaje.fase === 'hecho')
  const [cambiandoPortada, setCambiandoPortada] = useState(false)
  const hecho = etiqueta === 'hecho'
  const fechas = fechasYDias(viaje)
  return (
    <div data-tarjeta-de-viaje={viaje.id} data-etiqueta-de-viaje={etiqueta} data-portada-origen={portada.url ? portada.origen : 'degradado'} style={{ flex: 'none', width: 330, scrollSnapAlign: 'start', borderRadius: 26, overflow: 'hidden', background: '#FFFDF8', boxShadow: '0 12px 24px -14px rgba(28,34,48,.5)' }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: '100%', height: 142, background: degradadoDeViaje(viaje.destino), position: 'relative', overflow: 'hidden' }}>
          {portada.url ? (
            <img src={portada.url} alt="" aria-hidden="true" loading="lazy" decoding="async" draggable={false} data-portada-foto-url={portada.url.slice(0, 80)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg,rgba(255,255,255,.1) 0 2px,transparent 2px 12px)' }} />
          )}
        </div>
        <button type="button" onClick={onAbrir} data-viaje-del-perfil={viaje.id} aria-label={`${viaje.destino}, ${fechas}`} style={{ position: 'absolute', inset: 0, width: '100%', border: 'none', padding: 0, background: 'linear-gradient(180deg,rgba(10,12,20,.08) 30%,rgba(10,12,20,.72))', cursor: 'pointer' }} />
        <span data-etiqueta-texto style={{ position: 'absolute', left: 12, top: 12, height: 26, padding: '0 11px', borderRadius: 999, ...ESTILO_ETIQUETA[etiqueta], display: 'flex', alignItems: 'center', font: "600 12px 'Geist'", pointerEvents: 'none' }}>
          {TEXTO_DE_ETIQUETA[etiqueta]}
        </span>
        {editando && onEliminar ? (
          <button
            type="button"
            onClick={onEliminar}
            data-eliminar-viaje={viaje.id}
            aria-label={esInvitado ? `Salir del viaje a ${viaje.destino}` : `Eliminar el viaje a ${viaje.destino}`}
            title={esInvitado ? 'Salir de este viaje' : 'Eliminar viaje'}
            style={{ position: 'absolute', right: 12, top: 12, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,253,248,.95)', color: 'rgb(var(--accent-red))', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Icono nombre={esInvitado ? 'salir' : 'papelera'} size={18} />
          </button>
        ) : (
          <button type="button" onClick={() => setCambiandoPortada(true)} data-cambiar-portada={viaje.id} aria-label={`Cambiar la portada del viaje a ${viaje.destino}`} style={{ position: 'absolute', right: 12, top: 12, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,253,248,.92)', color: '#1C2230', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C2230" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
              <path d="M4 8h3l2-3h6l2 3h3v11H4zM12 11a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />
            </svg>
          </button>
        )}
        {portada.credito && (
          <span data-credito-portada style={{ position: 'absolute', right: 14, bottom: 3, font: "500 8.5px 'Geist'", color: 'rgba(255,253,248,.62)', pointerEvents: 'none' }}>
            {portada.credito}
          </span>
        )}
        <span style={{ position: 'absolute', left: 14, bottom: 11, right: 14, display: 'flex', flexDirection: 'column', gap: 2, color: '#fff', pointerEvents: 'none' }}>
          <span style={{ font: "400 30px/1 'Instrument Serif',serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{viaje.destino}</span>
          <span data-fechas-del-viaje style={{ font: "500 12px 'Geist Mono',monospace", opacity: 0.92 }}>{fechas}</span>
        </span>
      </div>
      <div style={{ padding: '10px 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onAbrirViaje}
          disabled={editando}
          data-abrir-este-viaje
          style={{ height: 34, padding: '0 15px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, font: "600 13px 'Geist'", cursor: 'pointer', ...(hecho ? { background: 'transparent', border: '1px solid rgba(28,34,48,.22)', color: '#4A3C28' } : { background: '#FBF3E2', border: '1px solid rgba(181,138,46,.55)', color: '#6E5018' }), opacity: editando ? 0.45 : 1 }}
        >
          Abrir este viaje
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={hecho ? '#4A3C28' : '#6E5018'} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
      {cambiandoPortada && <HojaPortada tripId={viaje.id} destino={viaje.destino} onCerrar={() => setCambiandoPortada(false)} />}
    </div>
  )
}
