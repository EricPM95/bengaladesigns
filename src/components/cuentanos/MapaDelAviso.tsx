import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useRouteStore } from '../../store/useRouteStore'
import type { Punto } from '../../lib/cuentanos/tipos'
import { BOTON_ORO } from '../ui/botonesOro'

/**
 * (V20, Design U2h) «BUSCAR EN EL MAPA»: el mapa a pantalla completa con un pin fijo en el centro; el viajero mueve el mapa hasta dejar el pin encima del sitio, debajo sale la dirección de ese punto
 * y [Este es el sitio] guarda el punto. Arriba, una búsqueda de calles y sitios. Mapbox se baja solo al abrir esta pantalla.
 */
const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

/** La dirección de un punto (Mapbox, en español). null si no se puede. */
export async function direccionDe(lat: number, lng: number): Promise<string | null> {
  if (!TOKEN) return null
  try {
    const r = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?language=es&limit=1&access_token=${TOKEN}`)
    const j = (await r.json()) as { features?: { place_name?: string }[] }
    return j.features?.[0]?.place_name ?? null
  } catch {
    return null
  }
}

async function buscarDirecciones(q: string, cerca: [number, number] | null): Promise<{ nombre: string; lng: number; lat: number }[]> {
  if (!TOKEN || q.trim().length < 2) return []
  try {
    const prox = cerca ? `&proximity=${cerca[0]},${cerca[1]}` : ''
    const r = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?language=es&limit=5${prox}&access_token=${TOKEN}`)
    const j = (await r.json()) as { features?: { place_name?: string; center?: [number, number] }[] }
    return (j.features ?? []).flatMap((f) => (f.center && f.place_name ? [{ nombre: f.place_name, lng: f.center[0], lat: f.center[1] }] : []))
  } catch {
    return []
  }
}

const PIN = (
  <svg width="44" height="54" viewBox="0 0 44 54" aria-hidden="true">
    <path d="M22 52 C 22 52 4 32 4 20 a18 18 0 0 1 36 0 C 40 32 22 52 22 52z" fill="#1C2230" stroke="#F3D88F" strokeWidth="2.4" />
    <circle cx="22" cy="20" r="6.5" fill="#F3D88F" />
  </svg>
)

export function MapaDelAviso({ inicial, onVolver, onElegido }: { inicial: Punto | null; onVolver: () => void; onElegido: (p: Punto) => void }): ReactNode {
  const contenedor = useRef<HTMLDivElement>(null)
  const mapaRef = useRef<{ getCenter: () => { lng: number; lat: number }; flyTo: (o: unknown) => void; remove: () => void } | null>(null)
  const route = useRouteStore((s) => s.route)
  const [centro, setCentro] = useState<{ lat: number; lng: number } | null>(inicial ? { lat: inicial.lat, lng: inicial.lng } : null)
  const [direccion, setDireccion] = useState<string | null>(null)
  const [consulta, setConsulta] = useState('')
  const [resultados, setResultados] = useState<{ nombre: string; lng: number; lat: number }[]>([])

  useEffect(() => {
    let vivo = true
    const arranque = (): [number, number] => {
      if (inicial) return [inicial.lng, inicial.lat]
      const c = route?.destinationCoordinates ?? route?.days.flatMap((d) => d.stops).find((s) => s.coordinates && (s.coordinates.lat !== 0 || s.coordinates.lng !== 0))?.coordinates
      return c ? [c.lng, c.lat] : [12.4964, 41.9028]
    }
    void import('mapbox-gl').then(({ default: mapboxgl }) => {
      if (!vivo || !contenedor.current) return
      mapboxgl.accessToken = TOKEN ?? ''
      const mapa = new mapboxgl.Map({ container: contenedor.current, style: 'mapbox://styles/mapbox/streets-v12', center: arranque(), zoom: inicial ? 17 : 14.5, attributionControl: false })
      mapaRef.current = mapa as never
      const alMoverse = () => {
        const c = mapa.getCenter()
        setCentro({ lat: c.lat, lng: c.lng })
      }
      mapa.on('moveend', alMoverse)
      mapa.on('load', alMoverse)
    })
    return () => {
      vivo = false
      mapaRef.current?.remove()
      mapaRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // La dirección del punto donde está el pin (con un respiro mientras se mueve el mapa).
  useEffect(() => {
    if (!centro) return undefined
    const t = window.setTimeout(() => void direccionDe(centro.lat, centro.lng).then(setDireccion), 350)
    return () => window.clearTimeout(t)
  }, [centro])

  useEffect(() => {
    if (consulta.trim().length < 2) return setResultados([])
    const t = window.setTimeout(() => {
      const c = mapaRef.current?.getCenter()
      void buscarDirecciones(consulta, c ? [c.lng, c.lat] : null).then(setResultados)
    }, 300)
    return () => window.clearTimeout(t)
  }, [consulta])

  return createPortal(
    <div data-cuentanos="mapa" data-mapa-del-aviso role="dialog" aria-modal="true" aria-label="Buscar en el mapa" className="fixed inset-0 z-[98]" style={{ background: '#F3EBD8', fontFamily: "'Geist',sans-serif", color: '#1C2230' }}>
      <div ref={contenedor} data-mapa-lienzo style={{ position: 'absolute', inset: 0 }} />
      {/* El pin, fijo en el centro: la punta queda justo en el centro del mapa. */}
      <span data-pin-fijo style={{ position: 'absolute', left: '50%', top: '50%', marginLeft: -22, marginTop: -52, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {PIN}
      </span>
      <div style={{ position: 'absolute', left: 14, right: 14, top: 'calc(env(safe-area-inset-top,0px) + 14px)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" aria-label="Volver" onClick={onVolver} style={{ flex: 'none', width: 46, height: 46, borderRadius: '50%', background: '#FFFDF8', boxShadow: '0 8px 16px -8px rgba(28,34,48,.5)', border: '1px solid rgba(28,34,48,.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C2230" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
          </button>
          <input data-buscar-mapa value={consulta} onChange={(e) => setConsulta(e.target.value)} placeholder="Busca una calle o un sitio" style={{ flex: 1, height: 46, borderRadius: 999, background: '#FFFDF8', boxShadow: '0 8px 16px -8px rgba(28,34,48,.5)', border: '1px solid rgba(28,34,48,.08)', padding: '0 16px', font: "400 14px 'Geist'", minWidth: 0 }} />
        </div>
        {resultados.length > 0 && (
          <div style={{ borderRadius: 18, background: '#FFFDF8', boxShadow: '0 8px 16px -8px rgba(28,34,48,.5)', overflow: 'hidden' }}>
            {resultados.map((r) => (
              <button key={`${r.lng},${r.lat}`} type="button" onClick={() => { mapaRef.current?.flyTo({ center: [r.lng, r.lat], zoom: 17 }); setResultados([]); setConsulta('') }} style={{ display: 'block', width: '100%', minHeight: 44, textAlign: 'left', padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', font: "500 13.5px 'Geist'" }}>
                {r.nombre}
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ position: 'absolute', left: 14, right: 14, bottom: 'calc(env(safe-area-inset-bottom,0px) + 22px)', borderRadius: 26, background: '#FFFDF8', boxShadow: '0 18px 34px -14px rgba(28,34,48,.55)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ flex: 'none', width: 42, height: 42, borderRadius: 13, background: '#F7F1E4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A5A1E" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-6-5.6-6-10.5a6 6 0 0 1 12 0C18 15.4 12 21 12 21zM12 12.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></svg>
          </span>
          <span data-direccion-del-punto style={{ font: "600 15px/1.25 'Geist'", minWidth: 0 }}>{direccion ?? (centro ? `${centro.lat.toFixed(4)}, ${centro.lng.toFixed(4)}` : 'Mueve el mapa hasta el sitio')}</span>
        </div>
        <button type="button" data-este-es-el-sitio disabled={!centro} onClick={() => centro && onElegido({ lat: centro.lat, lng: centro.lng, ...(direccion ? { direccion } : {}) })} style={{ height: 52, borderRadius: 16, border: 'none', cursor: centro ? 'pointer' : 'default', ...BOTON_ORO, font: "700 15.5px 'Geist'" }}>
          Este es el sitio
        </button>
      </div>
    </div>,
    document.body,
  )
}
