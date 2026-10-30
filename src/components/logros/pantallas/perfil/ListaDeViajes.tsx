import type { ReactNode } from 'react'
import { PiezaSegura } from '../../../PiezaSegura'
import { createPortal } from 'react-dom'
import { usePortadaDeViaje } from '../../../../hooks/usePortadaDeViaje'
import { plural, type ResumenViaje } from '../../../../lib/viajesPerfil'
import { Icono } from '../../../ui/Icono'
import { degradadoDeViaje, TEXTO_DE_ETIQUETA, type EtiquetaDeViaje } from './TarjetaDeViaje'
import type { GrupoDeViajes } from '../../../perfil/agruparViajes'

/**
 * «VER TODOS» (Tanda 10N5, apartado 4, `Piezas/Perfil Orden` 05, exactamente igual): la lista de todos los viajes, por grupos —EN CURSO, PRÓXIMOS, YA HECHOS y ANTES DE LA APP—, cada uno una fila con su miniatura (72 px),
 * el destino, las fechas y su etiqueta a la derecha. Pantalla completa con [‹] y «Mis viajes».
 */
const ETIQUETA_DE_GRUPO = { font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#6F4E37', marginTop: 6 } as const
const TITULO_DE_GRUPO: Record<GrupoDeViajes['clave'], string> = { en_curso: 'EN CURSO', proximo: 'PRÓXIMOS', hecho: 'YA HECHOS' }
const ESTILO_CHIP: Record<EtiquetaDeViaje, { background: string; color: string }> = {
  en_curso: { background: '#2B7F45', color: '#fff' },
  proximo: { background: '#F3E3B2', color: '#4A3510' },
  hecho: { background: '#E9E3D6', color: '#4A3C28' },
}
const FILA = { display: 'flex', gap: 12, alignItems: 'center', padding: 10, borderRadius: 22, background: '#FFFDF8', boxShadow: '0 8px 16px -12px rgba(28,34,48,.45)', border: 'none', width: '100%', textAlign: 'left', color: '#1C2230', cursor: 'pointer', fontFamily: "'Geist',system-ui,sans-serif" } as const

function Miniatura({ destino, url }: { destino: string; url: string | null }): ReactNode {
  return (
    <div style={{ width: 72, height: 72, background: degradadoDeViaje(destino), position: 'relative', overflow: 'hidden', borderRadius: 16, flex: 'none' }}>
      {url ? <img src={url} alt="" aria-hidden="true" loading="lazy" decoding="async" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg,rgba(255,255,255,.1) 0 2px,transparent 2px 12px)' }} />}
    </div>
  )
}

function FilaDeLista({ viaje, etiqueta, onAbrir, editando, onEliminar }: { viaje: ResumenViaje; etiqueta: EtiquetaDeViaje; onAbrir: () => void; editando: boolean; onEliminar: () => void }): ReactNode {
  const portada = usePortadaDeViaje(viaje.id, viaje.destino, viaje.fase === 'hecho')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} data-fila-de-viaje={viaje.id}>
      <button type="button" onClick={onAbrir} style={FILA} data-abrir-fila={viaje.id}>
        <Miniatura destino={viaje.destino} url={portada.url} />
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ font: "400 24px/1 'Instrument Serif',serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{viaje.destino}</span>
          <span style={{ font: "500 12px 'Geist Mono',monospace", color: 'rgba(28,34,48,.6)' }}>{viaje.cuando || viaje.duracion}</span>
        </span>
        <span style={{ height: 26, padding: '0 10px', borderRadius: 999, ...ESTILO_CHIP[etiqueta], display: 'flex', alignItems: 'center', font: "600 11.5px 'Geist'", flex: 'none' }}>{TEXTO_DE_ETIQUETA[etiqueta]}</span>
      </button>
      {editando && (
        <button type="button" onClick={onEliminar} data-eliminar-viaje={viaje.id} aria-label={`Eliminar el viaje a ${viaje.destino}`} style={{ width: 44, height: 44, flex: 'none', borderRadius: '50%', border: 'none', background: 'rgba(255,253,248,.95)', color: 'rgb(var(--accent-red))', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icono nombre={viaje.guardado?.esInvitado ? 'salir' : 'papelera'} size={19} />
        </button>
      )}
    </div>
  )
}

export function ListaDeViajes({ grupos, antesDeLaApp, onVolver, onAbrirViaje, onAbrirAntes, editando, onEliminar }: { grupos: GrupoDeViajes[]; antesDeLaApp: number; onVolver: () => void; onAbrirViaje: (v: ResumenViaje, etiqueta: EtiquetaDeViaje) => void; onAbrirAntes: () => void; editando: boolean; onEliminar: (v: ResumenViaje) => void }): ReactNode {
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Todos mis viajes" data-lista-de-viajes className="fixed inset-0 z-[75] flex flex-col bg-bg text-text">
      <div style={{ padding: 'calc(env(safe-area-inset-top) + 10px) 18px 0', display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0, overflowY: 'auto', scrollbarWidth: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="zona-toque" type="button" onClick={onVolver} aria-label="Volver" data-volver-lista style={{ width: 40, height: 40, borderRadius: '50%', background: '#FFFDF8', border: '1px solid rgba(28,34,48,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#1C2230" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <h2 style={{ margin: 0, font: "400 36px/1 'Instrument Serif',serif" }}>Mis viajes</h2>
        </div>
        {grupos.map((g) => (
          <div key={g.clave} style={{ display: 'flex', flexDirection: 'column', gap: 10 }} data-grupo-de-lista={g.clave}>
            <span style={ETIQUETA_DE_GRUPO}>{TITULO_DE_GRUPO[g.clave]}</span>
            {g.viajes.map((v) => (
              <PiezaSegura key={v.id} nombre="fila de Mis viajes">
                <FilaDeLista viaje={v} etiqueta={g.clave} onAbrir={() => onAbrirViaje(v, g.clave)} editando={editando} onEliminar={() => onEliminar(v)} />
              </PiezaSegura>
            ))}
          </div>
        ))}
        {antesDeLaApp > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} data-grupo-de-lista="antes">
            <span style={ETIQUETA_DE_GRUPO}>ANTES DE LA APP</span>
            <button type="button" onClick={onAbrirAntes} style={FILA} data-abrir-fila="antes">
              <Miniatura destino="Antes de la app" url={null} />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ font: "400 24px/1 'Instrument Serif',serif" }}>Antes de la app</span>
                <span style={{ font: "500 12px 'Geist Mono',monospace", color: 'rgba(28,34,48,.6)' }}>{plural(antesDeLaApp, 'país', 'países')}</span>
              </span>
              <span style={{ height: 26, padding: '0 10px', borderRadius: 999, background: '#E9E3D6', color: '#4A3C28', display: 'flex', alignItems: 'center', font: "600 11.5px 'Geist'", flex: 'none' }}>{plural(antesDeLaApp, 'país', 'países')}</span>
            </button>
          </div>
        )}
        <div style={{ height: 40, flex: 'none' }} />
      </div>
    </div>,
    document.body,
  )
}
