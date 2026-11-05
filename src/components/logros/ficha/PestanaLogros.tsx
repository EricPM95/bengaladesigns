import { useEffect, useState, type ReactNode } from 'react'
import { Insignia } from '../dibujos'
import { ParadaFoto } from '../../route/hoy/v2/ParadaFoto'
import { fetchPlacePhoto } from '../../../lib/placePhoto'
import { usePasePintable } from '../../../lib/pago'
import { abrirAvisoPase } from '../../../lib/avisoPase'
import { Candado } from '../../pase/Candado'
import { pedirEstado, type EstadoLogros } from '../momentos/api'
import { logrosActivos } from '../../../lib/logros'
import { coleccionesDelSitio, textoDeFaltan, TEXTO_DE_SITIO, tituloDeLogros, type EstadoDeSitio, type SitioDeTarjeta, type TarjetaDeColeccion } from './coleccionesDelSitio'

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
  const [estado, setEstado] = useState<EstadoLogros | null>(null)
  useEffect(() => {
    setEstado(null)
    if (!nombreDelSitio || !logrosActivos()) return undefined
    let vivo = true
    void pedirEstado(tripId).then((e) => {
      if (vivo) setEstado(e)
    })
    return () => {
      vivo = false
    }
  }, [tripId, nombreDelSitio])
  return { estado, tarjetas: nombreDelSitio ? coleccionesDelSitio(estado, nombreDelSitio) : [] }
}

const VERDE = 'oklch(0.55 0.11 150)'
const NARANJA = 'oklch(0.8 0.14 70)'

/** El color de cada estado de un sitio (tal cual el Design). */
const ESTILO: Record<EstadoDeSitio, { fondo: string; borde: string; nombre: string; texto: string; punto: string }> = {
  visto: { fondo: 'oklch(0.96 0.035 150)', borde: '1px solid rgba(28,34,48,.1)', nombre: 'oklch(0.36 0.09 150)', texto: 'oklch(0.45 0.11 150)', punto: VERDE },
  este: { fondo: 'oklch(0.8 0.14 70 / .16)', borde: `1.5px solid ${NARANJA}`, nombre: '#1C2230', texto: '#8E6820', punto: 'rgba(28,34,48,.18)' },
  pendiente: { fondo: '#FFFFFF', borde: '1px solid rgba(28,34,48,.1)', nombre: '#1C2230', texto: 'rgba(28,34,48,.5)', punto: 'rgba(28,34,48,.18)' },
}

function FotoDeSitio({ nombre, ciudad, visto }: { nombre: string; ciudad: string; visto: boolean }): ReactNode {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let vivo = true
    void fetchPlacePhoto(nombre, ciudad, null, 'thumb').then((u) => {
      if (vivo && u) setUrl(u)
    })
    return () => {
      vivo = false
    }
  }, [nombre, ciudad])
  return <ParadaFoto nombre={nombre} photoUrl={url} vista={visto} size={52} />
}

function FilaDeSitio({ s, ciudad, abrir }: { s: SitioDeTarjeta; ciudad: string; abrir: (nombre: string) => void }): ReactNode {
  const e = ESTILO[s.estado]
  const contenido = (
    <>
      <FotoDeSitio nombre={s.nombre} ciudad={ciudad} visto={s.estado === 'visto'} />
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'left' }}>
        <span style={{ font: "400 19px/1.1 'Instrument Serif',serif", color: e.nombre }}>{s.nombre}</span>
        <span style={{ font: "600 12px 'Geist'", color: e.texto }}>{TEXTO_DE_SITIO[s.estado]}</span>
      </span>
      <span style={{ width: 30, height: 30, flex: 'none', borderRadius: '50%', background: e.punto, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 14px 'Geist'", boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35)' }}>{s.estado === 'visto' ? '✓' : ''}</span>
    </>
  )
  const estilo = { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px 8px 8px', borderRadius: 18, background: e.fondo, border: e.borde, width: '100%', minHeight: 52 } as const
  // El de esta misma ficha no se abre (ya estás en ella); los demás abren la suya.
  return s.estado === 'este' ? (
    <div data-logros-sitio={s.sitio} data-estado={s.estado} style={estilo}>{contenido}</div>
  ) : (
    <button type="button" data-logros-sitio={s.sitio} data-estado={s.estado} onClick={() => abrir(s.nombre)} style={{ ...estilo, cursor: 'pointer', font: 'inherit', color: 'inherit' }}>{contenido}</button>
  )
}

function TarjetaDeColeccionFicha({ t, ciudad, abierta, alternar, abrir }: { t: TarjetaDeColeccion; ciudad: string; abierta: boolean; alternar: () => void; abrir: (nombre: string) => void }): ReactNode {
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {t.sitios.map((s) => (
              <FilaDeSitio key={s.sitio} s={s} ciudad={ciudad} abrir={abrir} />
            ))}
          </div>
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
          <TarjetaDeColeccionFicha key={t.id} t={t} ciudad={estado.ciudad} abierta={abiertas[t.id] ?? false} alternar={() => alternar(t.id)} abrir={abrirSitio} />
        ))}
      </div>
    </div>
  )
}
