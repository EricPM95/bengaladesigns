import type { ReactNode } from 'react'
import { buildAppleMapsUrlFromHere, buildGoogleMapsUrlFromHere } from '../../../lib/mapsLinks'
import { useSyncStore } from '../../../store/useSyncStore'
import { Insignia } from '../dibujos'
import { IC, ICONO_SITIO } from '../dibujos/iconos'
import { pedirColeccion, type ColeccionDentroDatos } from './destino/api'
import { diaDeRuta, fechaCorta } from './destino/formato'
import { BotonVolver, Esperando, FONDO_PAPEL, useCarga } from './destino/piezas'
import './destino/destino.css'
import { Capa } from './Capa'
import { useLogrosPantallas, type PantallaDe } from './useLogrosPantallas'

/**
 * UNA COLECCIÓN POR DENTRO, COMO UN ÁLBUM DE CROMOS (8C2; pantalla A de «Mi vitrina»). Cada sitio es un cromo: el que ya está visto lleva la fecha;
 * el que falta y está en la ruta del viaje abierto lleva el día de su ruta y [Cómo llegar]; el resto queda en gris.
 * Todo sale del servidor (GET /api/logros/coleccion): ni los días ni las fechas se escriben a mano.
 */
export default function ColeccionPorDentro({ pantalla }: { pantalla: PantallaDe<'coleccion'> }): ReactNode {
  const tripId = useSyncStore((s) => s.activeTripId) ?? null
  const datos = useCarga(() => pedirColeccion(pantalla.destino, pantalla.coleccion, tripId), [pantalla.destino, pantalla.coleccion, tripId])
  const volver = () => useLogrosPantallas.getState().volver()
  return (
    <Capa etiqueta="Una colección por dentro" fondo={FONDO_PAPEL}>
      <div className="dst" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 'none', padding: '4px 16px' }}><BotonVolver onClick={volver} /></div>
        {!datos ? <Esperando cargando={datos === null} /> : <Album datos={datos} />}
      </div>
    </Capa>
  )
}

/** [Cómo llegar]: abre la ruta andando desde donde estés, en el mapa del propio móvil (el de Apple en iPhone y iPad, el otro en el resto). Sin hoja intermedia: así no sale el nombre de ninguna empresa. */
function comoLlegar(destino: string): void {
  const esApple = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
  window.open(esApple ? buildAppleMapsUrlFromHere(destino) : buildGoogleMapsUrlFromHere(destino), '_blank', 'noopener,noreferrer')
}

function Album({ datos }: { datos: ColeccionDentroDatos }): ReactNode {
  const c = datos.coleccion
  return (
    <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', scrollbarWidth: 'none', padding: '6px 16px calc(env(safe-area-inset-bottom,0px) + 40px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '6px 0 4px', textAlign: 'center' }}>
        <Insignia coleccion={c.id} ganados={datos.sitios.filter((x) => x.visto).map((x) => x.sitio)} completa={c.completa} tam={150} />
        <span style={{ font: "400 28px/1.05 'Instrument Serif',serif" }}>{c.nombre}</span>
        <span style={{ font: "600 11px 'Geist Mono',monospace", color: c.completa ? 'oklch(0.42 0.09 150)' : 'oklch(0.48 0.17 5)' }}>{c.completa ? '✓ COMPLETA' : `${c.n} DE ${c.total}`}</span>
        {c.completa && c.al_completar && <span style={{ font: "italic 400 17px 'Instrument Serif',serif", color: 'rgba(28,34,48,.7)' }}>{c.al_completar}</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        {datos.sitios.map((s) => (
          <Cromo key={s.sitio} s={s} alLlegar={() => comoLlegar(`${s.nombre}, ${datos.ciudad}`)} />
        ))}
      </div>
    </main>
  )
}

function Cromo({ s, alLlegar }: { s: ColeccionDentroDatos['sitios'][number]; alLlegar: () => void }): ReactNode {
  const icono = IC[ICONO_SITIO[s.sitio] ?? 'col'] ?? IC.col
  return (
    <div style={{ borderRadius: 18, background: s.visto ? '#FFFDF8' : 'transparent', border: `1px solid ${s.visto ? 'rgba(28,34,48,.07)' : 'rgba(28,34,48,.14)'}`, padding: '12px 10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
      <span style={{ width: 58, height: 58, borderRadius: 16, background: s.visto ? 'oklch(0.55 0.17 5)' : '#ECE5D7', color: s.visto ? '#FFFDF8' : 'rgba(28,34,48,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icono} /></svg>
      </span>
      <span style={{ font: "500 13px/1.2 'Geist'", color: s.visto ? '#1C2230' : 'rgba(28,34,48,.45)' }}>{s.nombre}</span>
      {s.visto && <span style={{ font: "500 10.5px 'Geist Mono',monospace", color: 'rgba(28,34,48,.55)', paddingBottom: 6 }}>{fechaCorta(s.fecha)}</span>}
      {!s.visto && s.en_ruta && (
        <>
          <span style={{ font: "600 10.5px 'Geist Mono',monospace", color: 'oklch(0.48 0.17 5)' }}>{diaDeRuta(s.dia)}</span>
          <button type="button" onClick={alLlegar} style={{ height: 44, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <span style={{ height: 28, padding: '0 10px', borderRadius: 999, border: '1px solid rgba(28,34,48,.16)', background: '#FFFFFF', display: 'flex', alignItems: 'center', font: "600 11px 'Geist'", color: '#1C2230' }}>Cómo llegar</span>
          </button>
        </>
      )}
      {!s.visto && !s.en_ruta && <span style={{ paddingBottom: 6 }} />}
    </div>
  )
}
