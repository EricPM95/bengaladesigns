import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useRouteStore } from '../../../store/useRouteStore'
import { BOTON_ORO } from '../../ui/botonesOro'
import { buscarLugarPhoton, direccionDePhoton, partirDireccion, ESPERA_PHOTON_MS, MIN_LETRAS_PHOTON, referenciasDelViaje, type LugarPhoton } from '../../../lib/buscarLugarPhoton'

/**
 * (V45; `Alojamiento Mapa` de Design, M2) «¿DÓNDE TE ALOJAS?»: el mapa a pantalla completa con un pin fijo en el centro, un buscador (SOLO de la ciudad del viaje) y, debajo, la dirección del punto
 * con [Mi alojamiento está aquí]. Tocar una sugerencia lleva el mapa allí; con el dedo se afina moviendo el mapa bajo el pin.
 *
 * Buscar: Photon (OpenStreetMap), no Mapbox Search (sus resultados no se pueden guardar). Una petición cuando el viajero PARA de escribir (≥ 700 ms, ≥ 3 letras, la anterior se cancela): ~1-3 KB.
 * Dirección tras mover el pin: Photon `reverse`, una vez cuando el mapa se queda quieto tras moverlo con el dedo (≥ 600 ms): <1 KB. Ninguna llamada a Supabase: el punto se guarda con el viaje.
 * El mapa base (Mapbox GL) se baja solo al abrir esta pantalla y se quita al cerrarla (un solo lienzo). Créditos: «© OpenStreetMap contributors · © Mapbox».
 */
const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

export interface PuntoAlojamiento {
  lat: number
  lng: number
  direccion: string
}

const PIN = (
  <svg width="44" height="54" viewBox="0 0 44 54" aria-hidden="true">
    <path d="M22 52 C 22 52 4 32 4 20 a18 18 0 0 1 36 0 C 40 32 22 52 22 52z" fill="#1C2230" stroke="#F3D88F" strokeWidth="2.4" />
    <circle cx="22" cy="20" r="6.5" fill="#F3D88F" />
  </svg>
)

const TRAZO_PIN = 'M12 21s-6-5.6-6-10.5a6 6 0 0 1 12 0C18 15.4 12 21 12 21zM12 12.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'

function IconoPin({ size = 17, color = '#7A5A1E' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={TRAZO_PIN} />
    </svg>
  )
}

type MapaGl = { getCenter: () => { lng: number; lat: number }; flyTo: (o: unknown) => void; remove: () => void; on: (e: string, f: (ev: { originalEvent?: unknown }) => void) => void }

/**
 * (V50) LA BÚSQUEDA DE SITIOS, compartida por el mapa (M2) y por el campo «O escribe la dirección» de «Tu alojamiento»: Photon cuando el viajero PARA de escribir (≥ 700 ms, ≥ 3 letras, la anterior se cancela).
 * Cada búsqueda baja ~1-3 KB (1 o 2 peticiones a photon.komoot.io). Ninguna llamada a Supabase.
 */
export function useBusquedaDeLugares(consulta: string, referencias: { lat: number; lng: number }[]) {
  const [resultados, setResultados] = useState<LugarPhoton[]>([])
  const [buscando, setBuscando] = useState(false)
  const [sinResultados, setSinResultados] = useState(false)
  useEffect(() => {
    setSinResultados(false)
    if (consulta.trim().length < MIN_LETRAS_PHOTON) {
      setResultados([])
      setBuscando(false)
      return undefined
    }
    const ctl = new AbortController()
    const t = window.setTimeout(() => {
      setBuscando(true)
      void buscarLugarPhoton(consulta, referencias[0] ?? null, referencias, ctl.signal).then((r) => {
        if (ctl.signal.aborted) return
        setBuscando(false)
        setResultados(r)
        setSinResultados(r.length === 0)
      })
    }, ESPERA_PHOTON_MS)
    return () => {
      window.clearTimeout(t)
      ctl.abort()
    }
  }, [consulta, referencias])
  const limpiar = () => {
    setResultados([])
    setSinResultados(false)
    setBuscando(false)
  }
  return { resultados, buscando, sinResultados, limpiar }
}

const SOMBRA_LISTA = '0 8px 16px -8px rgba(28,34,48,.5)'

/** La lista de sugerencias de M2 (la misma en el mapa y en la hoja «Tu alojamiento»). */
export function ListaDeSugerencias({ resultados, buscando, sinResultados, ciudad, onElegir }: { resultados: LugarPhoton[]; buscando: boolean; sinResultados: boolean; ciudad: string; onElegir: (l: LugarPhoton) => void }): ReactNode {
  if (!(resultados.length > 0 || buscando || sinResultados)) return null
  return (
    <div data-sugerencias-alojamiento style={{ borderRadius: 20, background: '#FFFDF8', boxShadow: SOMBRA_LISTA, overflow: 'hidden', border: '1px solid rgba(28,34,48,.06)' }}>
      {resultados.map((r) => (
        <button key={`${r.lng},${r.lat},${r.titulo}`} type="button" data-sugerencia-alojamiento onClick={() => onElegir(r)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 52, textAlign: 'left', padding: '8px 14px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
          <span style={{ flex: 'none', width: 32, height: 32, borderRadius: '50%', background: '#F3E3B2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconoPin size={16} />
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ font: "700 14.5px/1.2 'Geist'" }}>{r.titulo}</span>
            {r.detalle && <span style={{ font: "400 12px/1.3 'Geist'", color: 'rgba(28,34,48,.55)' }}>{r.detalle}</span>}
          </span>
        </button>
      ))}
      {resultados.length === 0 && <span data-sugerencias-vacio style={{ display: 'block', padding: '14px 16px', font: "400 13.5px 'Geist'", color: 'rgba(28,34,48,.6)' }}>{buscando ? 'Buscando…' : `No encontramos eso en ${ciudad || 'tu destino'}. Prueba con otra calle.`}</span>}
    </div>
  )
}

export function MapaDelAlojamiento({ inicial, onVolver, onElegido }: { inicial: PuntoAlojamiento | null; onVolver: () => void; onElegido: (p: PuntoAlojamiento) => void }): ReactNode {
  const contenedor = useRef<HTMLDivElement>(null)
  const mapaRef = useRef<MapaGl | null>(null)
  const route = useRouteStore((s) => s.route)
  const referencias = useMemo(() => referenciasDelViaje(route), [route])
  const ciudad = route?.destination ?? ''
  const arranque = useMemo<{ lat: number; lng: number }>(() => inicial ?? referencias[0] ?? { lat: 41.9028, lng: 12.4964 }, [inicial, referencias])
  const [centro, setCentro] = useState<{ lat: number; lng: number }>(() => (inicial ? { lat: inicial.lat, lng: inicial.lng } : arranque))
  const [direccion, setDireccion] = useState<string | null>(inicial?.direccion ?? null)
  const [consulta, setConsulta] = useState('')
  const { resultados, buscando, sinResultados, limpiar } = useBusquedaDeLugares(consulta, referencias)
  // true mientras el mapa se mueve solo (al tocar una sugerencia): ahí la dirección ya la tenemos y no se pregunta otra vez.
  const programado = useRef(true)

  useEffect(() => {
    let vivo = true
    void import('mapbox-gl')
      .then(({ default: mapboxgl }) => {
        if (!vivo || !contenedor.current) return
        mapboxgl.accessToken = TOKEN ?? ''
        const mapa = new mapboxgl.Map({ container: contenedor.current, style: 'mapbox://styles/mapbox/streets-v12', center: [arranque.lng, arranque.lat], zoom: inicial ? 17 : 14.5, attributionControl: false })
        mapaRef.current = mapa as unknown as MapaGl
        mapa.on('moveend', (ev: { originalEvent?: unknown }) => {
          const c = mapa.getCenter()
          if (ev.originalEvent) {
            // El viajero ha movido el mapa con el dedo: el punto es el de ahora y la dirección se vuelve a pedir.
            programado.current = false
            setCentro({ lat: c.lat, lng: c.lng })
            setDireccion(null)
          }
        })
      })
      .catch(() => undefined)
    return () => {
      vivo = false
      mapaRef.current?.remove()
      mapaRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // La dirección del punto tras moverlo a mano: Photon reverse, cuando el pin se queda quieto (nunca a cada movimiento).
  useEffect(() => {
    if (direccion !== null || programado.current) return undefined
    const ctl = new AbortController()
    const t = window.setTimeout(() => void direccionDePhoton(centro.lat, centro.lng, ctl.signal).then((d) => !ctl.signal.aborted && setDireccion(d ?? 'Punto elegido en el mapa')), 600)
    return () => {
      window.clearTimeout(t)
      ctl.abort()
    }
  }, [centro, direccion])

  const elegir = (l: LugarPhoton) => {
    programado.current = true
    setCentro({ lat: l.lat, lng: l.lng })
    setDireccion(l.direccion)
    mapaRef.current?.flyTo({ center: [l.lng, l.lat], zoom: 17 })
    limpiar()
    setConsulta('')
  }

  const [calle, resto] = partirDireccion(direccion ?? '')
  const linea1 = direccion ? calle : 'Mueve el mapa hasta tu alojamiento'
  const linea2 = direccion ? resto : ''
  const ancho = { position: 'absolute', left: 14, right: 14 } as const
  const sombra = '0 8px 16px -8px rgba(28,34,48,.5)'

  return createPortal(
    <div data-mapa-alojamiento role="dialog" aria-modal="true" aria-label="¿Dónde te alojas?" className="fixed inset-0 z-[130]" style={{ background: '#F3EBD8', fontFamily: "'Geist',sans-serif", color: '#1C2230' }}>
      <div ref={contenedor} data-mapa-lienzo style={{ position: 'absolute', inset: 0 }} />
      <span data-pin-fijo style={{ position: 'absolute', left: '50%', top: '50%', marginLeft: -22, marginTop: -52, pointerEvents: 'none', display: 'flex' }}>
        {PIN}
      </span>
      <div style={{ ...ancho, top: 'calc(env(safe-area-inset-top,0px) + 14px)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" aria-label="Volver" data-mapa-alojamiento-volver onClick={onVolver} style={{ flex: 'none', width: 46, height: 46, borderRadius: '50%', background: '#FFFDF8', boxShadow: sombra, border: '1px solid rgba(28,34,48,.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C2230" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
          </button>
          <h2 style={{ font: "400 28px/1 'Instrument Serif',serif", margin: 0, textShadow: '0 1px 6px rgba(255,253,248,.9)' }}>¿Dónde te alojas?</h2>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, height: 48, borderRadius: 999, background: '#FFFDF8', boxShadow: sombra, border: '1px solid rgba(181,138,46,.45)', padding: '0 16px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A5A1E" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input data-buscar-alojamiento-mapa value={consulta} onChange={(e) => setConsulta(e.target.value)} placeholder={ciudad ? `Busca una calle o un hotel en ${ciudad}` : 'Busca una calle o un hotel'} autoComplete="off" maxLength={80} style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', font: "500 14.5px 'Geist'" }} />
        </label>
        <ListaDeSugerencias resultados={resultados} buscando={buscando} sinResultados={sinResultados} ciudad={ciudad} onElegir={elegir} />
      </div>
      <span data-creditos-mapa style={{ position: 'absolute', left: 16, bottom: 'calc(env(safe-area-inset-bottom,0px) + 186px)', font: "400 9.5px 'Geist'", color: 'rgba(28,34,48,.6)', background: 'rgba(255,253,248,.7)', padding: '1px 5px', borderRadius: 6 }}>
        © OpenStreetMap contributors · © Mapbox
      </span>
      <div style={{ ...ancho, bottom: 'calc(env(safe-area-inset-bottom,0px) + 22px)', borderRadius: 26, background: '#FFFDF8', boxShadow: '0 18px 34px -14px rgba(28,34,48,.55)', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ flex: 'none', width: 42, height: 42, borderRadius: 13, background: '#F6F0E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconoPin size={20} />
          </span>
          <span data-direccion-del-punto style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ font: "700 15.5px/1.25 'Geist'" }}>{linea1}</span>
            {linea2 && <span style={{ font: "400 12.5px/1.3 'Geist'", color: 'rgba(28,34,48,.55)' }}>{linea2}</span>}
          </span>
        </div>
        <button type="button" data-alojamiento-aqui onClick={() => onElegido({ lat: centro.lat, lng: centro.lng, direccion: direccion ?? 'Punto elegido en el mapa' })} className="h-[54px] w-full rounded-full text-[16px] font-bold transition-transform active:scale-[.98]" style={BOTON_ORO}>
          Mi alojamiento está aquí
        </button>
      </div>
    </div>,
    document.body,
  )
}

/**
 * M3: el mapa pequeño con el pin, la dirección debajo y [Cambiar]. El mapa es una imagen (Mapbox Static Images): sin lienzo, sin segundo mapa vivo. Una petición al dibujarse (la guarda el navegador), ~15-25 KB.
 */
export function MapaPequenoDelAlojamiento({ punto, onCambiar, puedeCambiar = true }: { punto: PuntoAlojamiento; onCambiar?: () => void; puedeCambiar?: boolean }): ReactNode {
  const url = TOKEN ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+1c2230(${punto.lng},${punto.lat})/${punto.lng},${punto.lat},15.5,0/640x240@2x?access_token=${TOKEN}` : null
  const [calle, resto] = partirDireccion(punto.direccion)
  return (
    <div data-mapa-pequeno-alojamiento className="overflow-hidden rounded-[18px]" style={{ border: '1px solid rgba(181,138,46,.45)', background: '#FFFDF8' }}>
      <div className="relative h-[118px] w-full" style={{ background: '#E9E2CE' }}>
        {url && <img src={url} alt="" width={320} height={118} loading="lazy" decoding="async" className="h-full w-full object-cover" />}
        <span style={{ position: 'absolute', left: 6, bottom: 3, font: "400 9px 'Geist'", color: 'rgba(28,34,48,.65)', background: 'rgba(255,253,248,.75)', padding: '0 4px', borderRadius: 4 }}>© OpenStreetMap · © Mapbox</span>
      </div>
      <div className="flex items-center gap-3 px-3.5 py-3">
        <span className="flex min-w-0 flex-1 flex-col" data-direccion-tarjeta>
          <span style={{ font: "700 14.5px/1.25 'Geist'" }}>{calle}</span>
          {resto && <span style={{ font: "400 12.5px/1.3 'Geist'", color: 'rgba(28,34,48,.55)' }}>{resto}</span>}
        </span>
        {puedeCambiar && onCambiar && (
          <button type="button" data-alojamiento-cambiar-punto onClick={onCambiar} className="zona-toque h-10 flex-none rounded-full px-4 text-[13.5px] font-bold" style={{ background: '#FBF3E2', border: '1px solid rgba(181,138,46,.55)', color: '#4A3510' }}>
            Cambiar
          </button>
        )}
      </div>
    </div>
  )
}
