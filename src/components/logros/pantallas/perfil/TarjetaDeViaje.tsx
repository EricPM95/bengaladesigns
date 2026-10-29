import { useEffect, useState, type ReactNode } from 'react'
import { usePortadaDeViaje } from '../../../../hooks/usePortadaDeViaje'
import { HojaPortada } from '../../../perfil/HojaPortada'
import { plural, type ResumenViaje } from '../../../../lib/viajesPerfil'
import { Icono } from '../../../ui/Icono'
import { contarFotos } from '../../../../lib/fotosViaje'
import { todayIso } from '../../../../lib/dateRange'
import { textoDeDias, textoDeNoches } from '../../../../lib/duracionViaje'

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

/** «En 12 días» (Design, `Piezas/Mis Viajes Tarjeta`): la cuenta atrás hasta el primer día; «Hoy» / «Mañana»; «Próximo» si el viaje no tiene fechas. */
export function cuentaAtras(inicioIso: string | null, hoyIso: string = todayIso()): string {
  if (!inicioIso) return 'Próximo'
  const n = Math.round((Date.parse(`${inicioIso}T00:00:00Z`) - Date.parse(`${hoyIso}T00:00:00Z`)) / 86400000)
  if (!Number.isFinite(n) || n < 0) return 'Próximo'
  if (n === 0) return 'Hoy'
  return n === 1 ? 'Mañana' : `En ${n} días`
}

/** Los chips de debajo: «4 días · 3 noches · 10 paradas»; en un viaje hecho, «12 paradas · 41 fotos» (las fotos solo si hay). */
export function chipsDeViaje(v: Pick<ResumenViaje, 'dias' | 'paradas' | 'route'>, hecho: boolean, fotos: number): string[] {
  const total = v.route.days.length || v.dias
  const paradas = plural(v.paradas, 'parada', 'paradas')
  if (hecho) return [paradas, ...(fotos > 0 ? [plural(fotos, 'foto', 'fotos')] : [])]
  return [...(total > 0 ? [textoDeDias(total), ...(total > 1 ? [textoDeNoches(total - 1)] : [])] : []), paradas]
}

const ESTILO_ETIQUETA: Record<EtiquetaDeViaje, { background: string; color: string }> = {
  en_curso: { background: '#2B7F45', color: '#fff' },
  proximo: { background: '#F3E3B2', color: '#4A3510' },
  hecho: { background: 'rgba(255,253,248,.92)', color: '#1C2230' },
}

/** «26 – 29 nov 2026 · 4 días». */
export const fechasYDias = (v: Pick<ResumenViaje, 'cuando' | 'dias'>): string => [v.cuando, v.dias > 0 ? plural(v.dias, 'día', 'días') : ''].filter(Boolean).join(' · ')

const CHIP = { height: 26, padding: '0 11px', borderRadius: 999, background: '#F1EADC', display: 'flex', alignItems: 'center', font: "600 12px 'Geist'", color: '#4A3C28' } as const

export function TarjetaDeViaje({ viaje, etiqueta, onAbrir, onAbrirViaje, editando = false, onEliminar, ancho = '60%' }: { viaje: ResumenViaje; etiqueta: EtiquetaDeViaje; onAbrir: () => void; onAbrirViaje: () => void; editando?: boolean; onEliminar?: () => void; ancho?: string }): ReactNode {
  const esInvitado = Boolean(viaje.guardado?.esInvitado)
  // La portada: la que eligió; si no, la primera foto suya al acabar el viaje; y si no, la del destino (o el degradado de siempre).
  const portada = usePortadaDeViaje(viaje.id, viaje.destino, viaje.fase === 'hecho')
  const [cambiandoPortada, setCambiandoPortada] = useState(false)
  const [fotos, setFotos] = useState(0)
  const hecho = etiqueta === 'hecho'
  useEffect(() => {
    if (!hecho) return
    let vivo = true
    void contarFotos([viaje.id]).then((m) => { if (vivo) setFotos(m.get(viaje.id) ?? 0) }).catch(() => undefined)
    return () => { vivo = false }
  }, [hecho, viaje.id])
  const fechas = fechasYDias(viaje)
  const textoEtiqueta = etiqueta === 'proximo' ? cuentaAtras(viaje.inicioIso) : etiqueta === 'hecho' ? 'Hecho' : TEXTO_DE_ETIQUETA[etiqueta]
  const chips = chipsDeViaje(viaje, hecho, fotos)
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
        <button type="button" onClick={onAbrir} data-viaje-del-perfil={viaje.id} aria-label={`${viaje.destino}, ${fechas}`} style={{ position: 'absolute', inset: 0, width: '100%', border: 'none', padding: 0, background: 'linear-gradient(180deg,rgba(10,12,20,.1) 25%,rgba(10,12,20,.7))', cursor: 'pointer' }} />
        <span data-etiqueta-texto style={{ position: 'absolute', left: 14, top: 14, height: 26, padding: '0 11px', borderRadius: 999, ...ESTILO_ETIQUETA[etiqueta], display: 'flex', alignItems: 'center', font: "600 12px 'Geist'", pointerEvents: 'none' }}>
          {textoEtiqueta}
        </span>
        {editando && onEliminar ? (
          <button
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
          <button type="button" onClick={() => setCambiandoPortada(true)} data-cambiar-portada={viaje.id} aria-label={`Cambiar la portada del viaje a ${viaje.destino}`} style={{ position: 'absolute', right: 12, top: 12, width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'rgba(255,253,248,.92)', color: '#1C2230', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#1C2230" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
              <path d="M4 8h3l2-3h6l2 3h3v11H4zM12 11a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />
            </svg>
          </button>
        )}
        {portada.credito && (
          <span data-credito-portada style={{ position: 'absolute', right: 14, bottom: 3, font: "500 8.5px 'Geist'", color: 'rgba(255,253,248,.62)', pointerEvents: 'none' }}>
            {portada.credito}
          </span>
        )}
        <span style={{ position: 'absolute', left: 16, bottom: 12, right: 14, display: 'flex', flexDirection: 'column', gap: 3, color: '#fff', pointerEvents: 'none' }}>
          <span style={{ font: "400 34px/1 'Instrument Serif',serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{viaje.destino}</span>
          <span data-fechas-del-viaje style={{ font: "500 12px 'Geist Mono',monospace", opacity: 0.9 }}>{viaje.cuando || fechas}</span>
        </span>
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span data-chips-del-viaje style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {chips.map((c) => (
            <span key={c} data-chip-del-viaje style={CHIP}>
              {c}
            </span>
          ))}
        </span>
        <button
          type="button"
          onClick={onAbrirViaje}
          disabled={editando}
          data-abrir-este-viaje
          style={{ height: 52, borderRadius: 16, border: 'none', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, font: "700 15.5px 'Geist'", cursor: 'pointer', ...(hecho ? { background: '#1C2230', color: '#F3D88F', boxShadow: '0 10px 20px -12px rgba(14,21,48,.8), inset 0 0 0 1px rgba(233,199,122,.4)' } : { background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)', color: '#4A3510', boxShadow: '0 10px 20px -12px rgba(110,80,24,.7), inset 0 1px 0 rgba(255,255,255,.55)' }), opacity: editando ? 0.45 : 1 }}
        >
          Abrir este viaje
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={hecho ? '#F3D88F' : '#4A3510'} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      {cambiandoPortada && <HojaPortada tripId={viaje.id} destino={viaje.destino} onCerrar={() => setCambiandoPortada(false)} />}
    </div>
  )
}
