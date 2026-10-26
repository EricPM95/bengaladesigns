import { useState, type ReactNode } from 'react'
import { usePortadaDeViaje } from '../../../../hooks/usePortadaDeViaje'
import { HojaPortada } from '../../../perfil/HojaPortada'
import { botonChampan } from '../../../../lib/marcaBoton'
import { daysBetweenInclusive, todayIso } from '../../../../lib/dateRange'
import { textoDeFotos, type ResumenViaje } from '../../../../lib/viajesPerfil'
import { Icono } from '../../../ui/Icono'

/**
 * UN VIAJE DE «MIS VIAJES» COMO EN EL DISEÑO (P1 de Design, Piezas/Perfil.dc.html): una tarjeta grande con foto (176 px el que está en curso, 132 los demás), el destino en grande abajo a la izquierda con
 * sus fechas, «Día 2 de 5» arriba a la derecha si está en curso y la cifra de fotos abajo a la derecha. Sin foto del destino, el degradado de siempre del diseño (uno por destino, siempre el mismo). Tanda 10N3: la foto de fondo es la PORTADA del viaje (la del destino por defecto, [Cambiar portada] para elegir otra) y ya no sale la etiqueta «Abierto».
 * Tocarla abre su álbum; [Abrir este viaje] (viaje guardado que no es el abierto) abre el viaje en la app. Solo la usa el Perfil con logros: con los logros apagados queda `FilaDeViaje` tal cual.
 */
const DEGRADADOS = [
  'linear-gradient(160deg,#E7B98A,#B9764A 55%,#5E3A2A)',
  'linear-gradient(160deg,#F2D3A6,#D98A5E 55%,#7A3E34)',
  'linear-gradient(160deg,#D9E2EE,#8FA4C4 55%,#3E4E6E)',
  'linear-gradient(160deg,#C9C4DE,#7E7AA8 55%,#3A3858)',
  'linear-gradient(160deg,#D6E4EA,#7EA6B8 55%,#3A5866)',
]
const degradadoDe = (destino: string): string => {
  let h = 0
  for (const c of destino) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return DEGRADADOS[h % DEGRADADOS.length]
}

export function TarjetaDeViaje({ viaje, fotos, enCurso, abierto, onAbrir, onAbrirViaje, editando = false, onEliminar }: { viaje: ResumenViaje; fotos: number | null; enCurso: boolean; abierto: boolean; onAbrir: () => void; onAbrirViaje: () => void; editando?: boolean; onEliminar?: () => void }): ReactNode {
  const sePuedeAbrir = !abierto && Boolean(viaje.guardado) && !editando
  const esInvitado = Boolean(viaje.guardado?.esInvitado)
  const fin = viaje.inicioIso && viaje.dias > 0 ? new Date(new Date(`${viaje.inicioIso}T12:00:00`).getTime() + (viaje.dias - 1) * 86400000).toISOString().slice(0, 10) : null
  const diaN = enCurso && viaje.inicioIso && fin ? daysBetweenInclusive(viaje.inicioIso, todayIso()) : null
  const fechas = [viaje.cuando, viaje.duracion].filter(Boolean).join(' · ')
  // (Tanda 10N3, §3b.6) La portada: la que eligió; si no, la primera foto suya al acabar el viaje; y si no, la del destino (o el degradado de siempre).
  const portada = usePortadaDeViaje(viaje.id, viaje.destino, viaje.fase === 'hecho')
  const [cambiandoPortada, setCambiandoPortada] = useState(false)
  return (
    <div data-tarjeta-de-viaje={viaje.id} data-portada-origen={portada.url ? portada.origen : 'degradado'} style={{ position: 'relative', flex: 'none', height: enCurso ? 176 : 132, borderRadius: 22, overflow: 'hidden', background: degradadoDe(viaje.destino), color: '#FFFDF8', boxShadow: enCurso ? '0 18px 30px -18px rgba(90,40,20,.7)' : 'none' }}>
      {portada.url && <img src={portada.url} alt="" aria-hidden="true" loading="lazy" decoding="async" draggable={false} data-portada-foto-url={portada.url.slice(0, 80)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
      <button type="button" onClick={onAbrir} data-viaje-del-perfil={viaje.id} aria-label={`${viaje.destino}, ${fechas}`} style={{ position: 'absolute', inset: 0, width: '100%', border: 'none', padding: 0, background: 'linear-gradient(180deg,rgba(10,12,20,.1) 20%,rgba(10,12,20,.72))', cursor: 'pointer' }} />
      {editando && onEliminar && (
        <button
          type="button"
          onClick={onEliminar}
          data-eliminar-viaje={viaje.id}
          aria-label={esInvitado ? `Salir del viaje a ${viaje.destino}` : `Eliminar el viaje a ${viaje.destino}`}
          title={esInvitado ? 'Salir de este viaje' : 'Eliminar viaje'}
          style={{ position: 'absolute', right: 8, top: 8, width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'rgba(255,253,248,.95)', color: 'rgb(var(--accent-red))', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <Icono nombre={esInvitado ? 'salir' : 'papelera'} size={19} />
        </button>
      )}
      {!editando && diaN !== null && (
        <span style={{ position: 'absolute', right: 12, top: 12, height: 24, padding: '0 9px', borderRadius: 999, ...botonChampan(), display: 'flex', alignItems: 'center', gap: 6, font: "600 11px 'Geist'", pointerEvents: 'none' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#A67C52' }} />
          {viaje.dias > 0 ? `Día ${Math.min(diaN, viaje.dias)} de ${viaje.dias}` : 'En curso'}
        </span>
      )}
      {!editando && (
        <button type="button" onClick={() => setCambiandoPortada(true)} data-cambiar-portada={viaje.id} aria-label={`Cambiar la portada del viaje a ${viaje.destino}`} style={{ position: 'absolute', left: 10, top: 10, height: 28, padding: '0 10px 0 8px', borderRadius: 999, border: 'none', background: 'rgba(255,253,248,.88)', color: '#1C2230', display: 'flex', alignItems: 'center', gap: 5, font: "600 11px 'Geist'", cursor: 'pointer' }}>
          <Icono nombre="camara" size={13} />
          Cambiar portada
        </button>
      )}
      {portada.credito && <span data-credito-portada style={{ position: 'absolute', left: 14, bottom: 2, font: "500 8.5px 'Geist'", color: 'rgba(255,253,248,.62)', pointerEvents: 'none' }}>{portada.credito}</span>}
      {cambiandoPortada && <HojaPortada tripId={viaje.id} destino={viaje.destino} onCerrar={() => setCambiandoPortada(false)} />}
      <span style={{ position: 'absolute', left: 14, bottom: 12, right: 120, display: 'flex', flexDirection: 'column', gap: 3, pointerEvents: 'none' }}>
        <span style={{ font: `400 ${enCurso ? 30 : 24}px/1 'Instrument Serif',serif`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{viaje.destino}</span>
        <span style={{ font: "500 11px 'Geist Mono',monospace", color: 'rgba(255,253,248,.85)' }}>{viaje.cuando}</span>
        {viaje.duracion && <span style={{ font: "500 11px 'Geist Mono',monospace", color: 'rgba(255,253,248,.7)' }}>{viaje.duracion}</span>}
      </span>
      <span style={{ position: 'absolute', right: 10, bottom: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        {sePuedeAbrir && (
          <button type="button" onClick={onAbrirViaje} data-abrir-este-viaje style={{ height: 32, padding: '0 12px', borderRadius: 999, border: 'none', background: 'rgba(255,253,248,.92)', color: '#1C2230', font: "600 12px 'Geist'", cursor: 'pointer' }}>
            Abrir este viaje
          </button>
        )}
        {fotos !== null && (
          <span data-fotos-del-viaje style={{ height: 26, padding: '0 10px', borderRadius: 999, background: 'rgba(255,253,248,.9)', color: '#1C2230', display: 'flex', alignItems: 'center', gap: 5, font: "600 11px 'Geist'", pointerEvents: 'none' }}>
            <Icono nombre="camara" size={13} />
            {textoDeFotos(fotos)}
          </span>
        )}
      </span>
    </div>
  )
}
