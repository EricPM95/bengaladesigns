import { useEffect, useState, type ReactNode } from 'react'
import { Insignia } from '../dibujos'
import { usePasePintable } from '../../../lib/pago'
import { abrirAvisoPase } from '../../../lib/avisoPase'
import { Candado } from '../../pase/Candado'
import { estadoGuardado, pedirEstado, type EstadoLogros } from '../momentos/api'
import { mismaRespuesta } from '../../../lib/logrosEnCache'
import { ListaDeColeccion } from './ListaDeColeccion'
import { logrosActivos } from '../../../lib/logros'
import { coleccionesDelSitio, textoDeFaltan, tituloDeLogros, type TarjetaDeColeccion } from './coleccionesDelSitio'

/**
 * LG1 §1 — LA PESTAÑA «LOGROS» DE LA FICHA (Design: `Piezas/Ficha Lugar` y `App Explorar y fichas` apartado 02).
 * `useLogrosDeLaFicha` trae lo mismo que la hoja de logros (`/api/logros/estado`) y saca las colecciones del sitio; la pestaña solo sale si hay alguna.
 * `PestanaLogros` pinta «La Fontana de Trevi suma en 3 colecciones» y una tarjeta plegable por colección (todas cerradas al abrir; se abren al tocarlas).
 */
export interface LogrosDeLaFicha {
  estado: EstadoLogros | null
  tarjetas: TarjetaDeColeccion[]
}

export function useLogrosDeLaFicha(tripId: string | null, nombreDelSitio: string | null): LogrosDeLaFicha {
  // (V14) Sale AL INSTANTE, como las demás pestañas: con lo último que se vio de este viaje (lo guardado en el móvil, o lo que ya cargó la hoja de logros) y lo nuevo llega por detrás: solo cambia lo que cambie.
  const [estado, setEstado] = useState<EstadoLogros | null>(() => (nombreDelSitio && logrosActivos() ? estadoGuardado(tripId) : null))
  useEffect(() => {
    if (!nombreDelSitio || !logrosActivos()) {
      setEstado(null)
      return undefined
    }
    setEstado((prev) => prev ?? estadoGuardado(tripId))
    let vivo = true
    void pedirEstado(tripId).then((e) => {
      if (vivo) setEstado((prev) => (prev && e && mismaRespuesta(prev, e) ? prev : e ?? prev))
    })
    return () => {
      vivo = false
    }
  }, [tripId, nombreDelSitio])
  return { estado, tarjetas: nombreDelSitio ? coleccionesDelSitio(estado, nombreDelSitio) : [] }
}

function TarjetaDeColeccionFicha({ t, ciudad, destino, abierta, alternar, abrir }: { t: TarjetaDeColeccion; ciudad: string; destino: string; abierta: boolean; alternar: () => void; abrir: (nombre: string) => void }): ReactNode {
  return (
    <div data-logros-coleccion={t.id} data-abierta={abierta ? '1' : '0'} style={{ borderRadius: 20, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.07)', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button type="button" aria-expanded={abierta} onClick={alternar} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', border: 'none', background: 'transparent', padding: 0, width: '100%', minHeight: 64, font: 'inherit', color: 'inherit', textAlign: 'left' }}>
        <span style={{ width: 64, height: 64, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Insignia coleccion={t.id} ganados={t.ganados} completa={t.completa} tam={64} />
        </span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span data-logros-nombre style={{ font: "400 18px/1.1 'Instrument Serif',serif" }}>{t.nombre}</span>
          <span data-logros-cuenta style={{ font: "600 11.5px 'Geist Mono',monospace", color: 'rgba(28,34,48,.6)' }}>{`${t.n} de ${t.total}`}</span>
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(28,34,48,.55)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', transform: abierta ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }} aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {abierta && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 8, borderTop: '1px solid rgba(28,34,48,.07)' }}>
          <span data-logros-faltan style={{ alignSelf: 'flex-start', height: 26, padding: '0 11px', borderRadius: 999, background: t.completa || t.n >= t.total ? 'oklch(0.96 0.035 150)' : '#F3E3B2', color: t.completa || t.n >= t.total ? 'oklch(0.38 0.1 150)' : '#6E5018', display: 'flex', alignItems: 'center', font: "700 12px 'Geist'" }}>{textoDeFaltan(t)}</span>
          <ListaDeColeccion destino={destino} coleccion={t.id} ciudad={ciudad} sitios={t.sitios.map((s) => ({ sitio: s.sitio, nombre: s.nombre, visto: s.estado === 'visto', este: s.estado === 'este' }))} alTocar={(x) => (x.este ? undefined : () => abrir(x.nombre))} />
        </div>
      )}
    </div>
  )
}

export function PestanaLogros({ datos, nombreDelSitio, abrirSitio }: { datos: LogrosDeLaFicha; nombreDelSitio: string; abrirSitio: (nombre: string) => void }): ReactNode {
  const { estado, tarjetas } = datos
  // (HOY2b 8c, Eric 5-nov) TODAS las colecciones salen CERRADAS al abrir la pestaña; se abren al tocarlas. (Antes: la primera abierta, como en el Design.)
  const [abiertas, setAbiertas] = useState<Record<string, boolean>>({})
  // Gratis o pase: la misma regla que la hoja de logros (sin pase se ve cerrada, en gris, y tocarla abre el pase).
  const estadoPase = usePasePintable()
  const sinPase = estadoPase === 'sin'
  if (!estado || tarjetas.length === 0) return null
  const alternar = (id: string) => setAbiertas((a) => ({ ...a, [id]: !a[id] }))
  return (
    <div data-pestana-logros style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 6 }}>
      {sinPase && <Candado datos="logros-sin-pase" destino={estado.ciudad} titulo="Tus logros del viaje" texto="Con el {pase}, cada sitio que ves suma." />}
      <div
        data-logros-cerrados={sinPase ? '1' : undefined}
        onClickCapture={sinPase ? (e) => { e.stopPropagation(); e.preventDefault(); abrirAvisoPase('logros', { destino: estado.ciudad }) } : undefined}
        style={{ display: 'flex', flexDirection: 'column', gap: 10, ...(sinPase ? { filter: 'grayscale(1)', opacity: 0.55, cursor: 'pointer' } : {}), ...(estadoPase === 'pendiente' ? { visibility: 'hidden' as const } : {}) }}
      >
        <span data-logros-titulo style={{ padding: '0 4px', font: "400 13px/1.45 'Geist'", color: 'rgba(28,34,48,.65)' }}>{tituloDeLogros(estado.destino, nombreDelSitio, tarjetas.length)}</span>
        {tarjetas.map((t) => (
          <TarjetaDeColeccionFicha key={t.id} t={t} ciudad={estado.ciudad} destino={estado.destino} abierta={abiertas[t.id] ?? false} alternar={() => alternar(t.id)} abrir={abrirSitio} />
        ))}
      </div>
    </div>
  )
}
