import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Coordinates, Route } from '../../../lib/types'
import { esDestinoDeCoche } from '../../../lib/experienceCategoryBank'
import { estimateWalkMinutes, haversineMeters, hasRealCoordinates } from '../../../lib/distanceMock'
import { abrirAvisoPase } from '../../../lib/avisoPase'
import { urlDeCamino } from '../../../lib/camaraViaje'
import { useDestinationPool } from '../../../lib/useDestinationPool'
import { EstilosDelVisto } from '../../logros/visto/Hojas'
import { AVISO_GASOLINERAS_NORTE } from './CercaDeTi'

/**
 * «CERCA DE TI» EN HOY (Tanda HOY1, K5 a K8; Design «Hoy Estados», apartado 04). La fila fija debajo de la tarjeta de la siguiente parada.
 *   - Roma: Baños · Fuentes · Comer (a pie).  - Lanzarote: Gasolineras · Aparcar · Comer (en coche).
 * Cada botón abre una hoja con los 4 sitios más cercanos; cada sitio se toca ENTERO y abre Google Maps (Apple Maps en iPhone) con el camino desde donde estés: a pie en Roma, en coche en Lanzarote.
 * Sin pase, cada botón lleva su candado y al tocarlo sale el aviso pequeño del pase. Nada de esto cambia el día.
 */
const TINTA = '#1C2230'
const ORO = '#B58A2E'
const SERIF = "'Instrument Serif',serif"

const ICONOS = {
  banos: 'M9 3.5a1.8 1.8 0 1 0 .01 0M15.5 3.5a1.8 1.8 0 1 0 .01 0M7 8.5h4l-1 5.5v7M13.5 8.5h4l-1 5.5v7',
  fuentes: 'M12 3c3 4 6 7 6 10.5a6 6 0 0 1-12 0C6 10 9 7 12 3z',
  comer: 'M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-3 5-3 8h3v10',
  gasolineras: 'M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M4 21h12M7 8h6M15 9l3 2v6a1.5 1.5 0 0 0 3 0v-6l-3-3',
  aparcar: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9.5 17V7.5h3.2a2.8 2.8 0 0 1 0 5.6H9.5',
  aPie: 'M13.5 3.2a1.7 1.7 0 1 0 .01 0M12 8l-1.5 6-3 7M10.5 14l3.5 3v4M12 8.5l-4 2.5M12 8.5l4 3',
  coche: 'M5 17v-5l2-5h10l2 5v5M3 17h18M7 20v-3M17 20v-3M7.5 13.5h.01M16.5 13.5h.01',
  mapa: 'M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10zM12 8.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  candado: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z',
  derecha: 'M9 5l7 7-7 7',
  cerrar: 'M6 6l12 12M18 6L6 18',
}

function Trazo({ d, tam, color = 'currentColor', grosor = 1.8 }: { d: string; tam: number; color?: string; grosor?: number }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
      <path d={d} />
    </svg>
  )
}

export type ClaveCerca = 'banos' | 'fuentes' | 'comer' | 'gasolineras' | 'aparcar'

const BOTONES_ROMA: { clave: ClaveCerca; etiqueta: string; aviso: string }[] = [
  { clave: 'banos', etiqueta: 'Baños', aviso: 'banos' },
  { clave: 'fuentes', etiqueta: 'Fuentes', aviso: 'fuentes' },
  { clave: 'comer', etiqueta: 'Comer', aviso: 'generico' },
]
const BOTONES_COCHE: { clave: ClaveCerca; etiqueta: string; aviso: string }[] = [
  { clave: 'gasolineras', etiqueta: 'Gasolineras', aviso: 'generico' },
  { clave: 'aparcar', etiqueta: 'Aparcar', aviso: 'generico' },
  { clave: 'comer', etiqueta: 'Comer', aviso: 'generico' },
]
const TITULO: Record<ClaveCerca, string> = { banos: 'Baños cerca', fuentes: 'Fuentes cerca', comer: 'Comer cerca', gasolineras: 'Gasolineras cerca', aparcar: 'Aparcamientos cerca' }

/** «180 m» / «3,2 km». */
export function distanciaTexto(metros: number): string {
  return metros < 1000 ? `${Math.max(10, Math.round(metros / 10) * 10)} m` : `${(metros / 1000).toFixed(metros < 10000 ? 1 : 0).replace('.', ',')} km`
}
/** Minutos en coche por la isla (unos 45 km/h de media, con curvas y pueblos). */
export function minutosEnCoche(metros: number): number {
  return Math.max(1, Math.round((metros / 1000 / 45) * 60))
}

interface Fila {
  id: string
  nombre: string
  lat: number
  lng: number
  metros: number | null
  consulta: string | null
  extra: string | null
}

interface PuntoCoche {
  id: string
  nombre: string
  lat: number
  lng: number
  de_pago: boolean | null
  de_noche_24h: boolean | null
}

/** Dónde está el viajero ahora (si deja), una sola vez al abrir la hoja. null si no hay permiso o señal. */
function usePosicion(activo: boolean): { posicion: Coordinates | null; buscando: boolean } {
  const [estado, setEstado] = useState<{ posicion: Coordinates | null; buscando: boolean }>({ posicion: null, buscando: activo })
  useEffect(() => {
    if (!activo) return undefined
    let vivo = true
    const dev = (import.meta.env.DEV ? (window as unknown as { __hoy1Ubicacion?: Coordinates }).__hoy1Ubicacion : null) ?? null
    if (dev) {
      setEstado({ posicion: dev, buscando: false })
      return undefined
    }
    if (!('geolocation' in navigator)) {
      setEstado({ posicion: null, buscando: false })
      return undefined
    }
    setEstado({ posicion: null, buscando: true })
    navigator.geolocation.getCurrentPosition(
      (p) => vivo && setEstado({ posicion: { lat: p.coords.latitude, lng: p.coords.longitude }, buscando: false }),
      () => vivo && setEstado({ posicion: null, buscando: false }),
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 },
    )
    return () => {
      vivo = false
    }
  }, [activo])
  return estado
}

function HojaCerca({ clave, route, origenRespaldo, onCerrar }: { clave: ClaveCerca; route: Route; origenRespaldo: Coordinates | null; onCerrar: () => void }) {
  const deCoche = esDestinoDeCoche(route.destination)
  const { posicion, buscando } = usePosicion(true)
  const origen = posicion ?? origenRespaldo
  const delPool = clave === 'banos' || clave === 'fuentes' || clave === 'comer'
  const { places, resolved } = useDestinationPool(route.destination, delPool)
  const [coche, setCoche] = useState<PuntoCoche[] | null>(null)
  useEffect(() => {
    if (clave !== 'gasolineras' && clave !== 'aparcar') return undefined
    let vivo = true
    fetch('/api/cerca-de-ti-coche', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: route.destination, lat: origen?.lat, lng: origen?.lng }) })
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: { gasolineras?: PuntoCoche[]; aparcamientos?: PuntoCoche[] }) => vivo && setCoche((clave === 'gasolineras' ? d.gasolineras : d.aparcamientos) ?? []))
      .catch(() => vivo && setCoche([]))
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, route.destination, origen?.lat, origen?.lng])

  let filas: Fila[] | null = null
  if (delPool) {
    if (resolved) {
      const tipo = clave === 'banos' ? 'toilet' : clave === 'fuentes' ? 'fountain' : 'restaurant'
      filas = places
        .filter((p) => p.kind === tipo && hasRealCoordinates(p.coordinates))
        .map((p, i) => ({
          id: `${p.name}-${i}`,
          // Los baños y las fuentes de OpenStreetMap casi nunca traen nombre: «Baño público · Testaccio» (con su barrio) dice más que «Baño público» cuatro veces.
          nombre: tipo !== 'restaurant' && p.zone_label ? `${p.name} · ${p.zone_label}` : p.name,
          lat: p.coordinates.lat,
          lng: p.coordinates.lng,
          metros: origen ? haversineMeters(origen, p.coordinates) : null,
          consulta: p.maps_consulta ?? null,
          extra: tipo === 'toilet' ? (p.de_pago === true ? 'de pago' : p.de_pago === false ? 'gratis' : null) : null,
        }))
        .sort((a, b) => (a.metros ?? 0) - (b.metros ?? 0))
        .slice(0, 4)
    }
  } else if (coche) {
    filas = coche
      .map((p) => ({ id: p.id, nombre: p.nombre, lat: p.lat, lng: p.lng, metros: origen ? haversineMeters(origen, { lat: p.lat, lng: p.lng }) : null, consulta: null, extra: clave === 'gasolineras' ? (p.de_noche_24h ? 'abierta 24 h' : null) : p.de_pago === true ? 'de pago' : p.de_pago === false ? 'gratis' : null }))
      .sort((a, b) => (a.metros ?? 0) - (b.metros ?? 0))
      .slice(0, 4)
  }
  const modo = deCoche ? 'driving' : 'walking'
  const icono = ICONOS[clave === 'comer' ? 'comer' : clave]
  return createPortal(
    <div data-cerca-hoja={clave} role="dialog" aria-label={TITULO[clave]} className="fixed inset-0 z-[80] flex flex-col justify-end">
      <EstilosDelVisto />
      <button type="button" aria-label="Cerrar" onClick={onCerrar} className="absolute inset-0 cursor-default border-0 p-0" style={{ background: 'rgba(20,16,10,.5)', animation: 'vistoFade .3s ease both' }} />
      <div className="relative mx-auto flex max-h-[85%] w-full max-w-[520px] flex-col gap-2.5 px-[18px] pb-[26px] pt-2.5" style={{ borderRadius: '32px 32px 0 0', background: '#FBF3E2', boxShadow: '0 -20px 40px rgba(0,0,0,.25)', animation: 'vistoSheet .5s cubic-bezier(.2,.8,.2,1) both', color: TINTA }}>
        <span className="self-center" style={{ width: 44, height: 4, borderRadius: 2, background: 'rgba(28,34,48,.25)' }} />
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-3">
            <span className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: '#F3E3B2', color: '#6E5018' }}>
              <Trazo d={icono} tam={20} />
            </span>
            <span style={{ font: `400 28px/1 ${SERIF}` }}>{TITULO[clave]}</span>
          </span>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="zona-toque flex h-9 w-9 items-center justify-center rounded-full" style={{ background: 'rgba(28,34,48,.08)' }}>
            <Trazo d={ICONOS.cerrar} tam={17} color={TINTA} grosor={2} />
          </button>
        </div>
        {clave === 'gasolineras' && (
          <p data-aviso-gasolineras="1" style={{ font: "400 12.5px/1.4 'Geist'", color: 'rgba(28,34,48,.65)' }}>
            {AVISO_GASOLINERAS_NORTE}
          </p>
        )}
        {!posicion && !buscando && origen && (
          <p data-cerca-sin-ubicacion="1" style={{ font: "400 12.5px/1.4 'Geist'", color: 'rgba(28,34,48,.6)' }}>
            Sin tu ubicación, las distancias son desde tu siguiente parada.
          </p>
        )}
        <div className="flex flex-col gap-2 overflow-y-auto">
          {filas === null && <p style={{ font: "400 13px 'Geist'", color: 'rgba(28,34,48,.6)' }}>Buscando…</p>}
          {filas?.length === 0 && <p data-cerca-vacio="1" style={{ font: "400 13px 'Geist'", color: 'rgba(28,34,48,.6)' }}>No tenemos datos de {TITULO[clave].replace(' cerca', '').toLowerCase()} aquí.</p>}
          {filas?.map((f) => (
            <a
              key={f.id}
              href={urlDeCamino({ lat: f.lat, lng: f.lng, consulta: f.consulta, modo })}
              target="_blank"
              rel="noopener noreferrer"
              data-cerca-fila={f.id}
              className="flex items-center gap-3"
              style={{ padding: '11px 12px 11px 14px', borderRadius: 20, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.12)', boxShadow: '0 6px 12px -10px rgba(28,34,48,.4)', color: TINTA, textDecoration: 'none' }}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <b className="truncate" style={{ font: "700 15px/1.2 'Geist'" }}>{f.nombre}</b>
                <span className="flex items-center gap-1.5" style={{ font: "500 12.5px 'Geist'", color: 'rgba(28,34,48,.62)' }}>
                  <Trazo d={modo === 'walking' ? ICONOS.aPie : ICONOS.coche} tam={14} />
                  {f.metros == null ? (modo === 'walking' ? 'a pie' : 'en coche') : `${distanciaTexto(f.metros)} · ${modo === 'walking' ? `${estimateWalkMinutes(f.metros)} min a pie` : `${minutosEnCoche(f.metros)} min en coche`}`}
                  {f.extra ? ` · ${f.extra}` : ''}
                </span>
              </span>
              <span className="flex flex-none items-center gap-[5px]" style={{ height: 34, padding: '0 12px', borderRadius: 999, background: '#FBF3E2', border: '1px solid rgba(181,138,46,.55)', font: "700 12px 'Geist'", color: '#4A3510' }}>
                <Trazo d={ICONOS.mapa} tam={14} color="#4A3510" grosor={2} />
                Maps
              </span>
              <Trazo d={ICONOS.derecha} tam={16} color="rgba(28,34,48,.35)" />
            </a>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}

/**
 * La fila «Cerca de ti» de HOY.
 * @param origen  respaldo para las distancias si no hay ubicación (la siguiente parada), o null
 * @param conPase sin pase, cada botón lleva su candado y abre el aviso pequeño del pase
 */
export function CercaDeTiFila({ route, origen, conPase }: { route: Route; origen: Coordinates | null; conPase: boolean }) {
  const [abierta, setAbierta] = useState<ClaveCerca | null>(null)
  const botones = esDestinoDeCoche(route.destination) ? BOTONES_COCHE : BOTONES_ROMA
  return (
    <div className="flex flex-none flex-col gap-2 pt-1" data-cerca-de-ti={conPase ? 'con-pase' : 'sin-pase'} data-cerca-modo={esDestinoDeCoche(route.destination) ? 'coche' : 'pie'}>
      <span className="px-1" style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#6F4E37' }}>
        CERCA DE TI
      </span>
      <div className="flex gap-2">
        {botones.map((b) => (
          <button
            key={b.clave}
            type="button"
            data-cerca-boton={b.clave}
            data-candado={conPase ? undefined : `cerca-${b.clave}`}
            onClick={() => (conPase ? setAbierta(b.clave) : abrirAvisoPase(b.aviso, { destino: route.destination }))}
            className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-[5px]"
            style={{ height: 62, borderRadius: 18, background: '#FFFDF8', border: '1px solid rgba(181,138,46,.5)', boxShadow: '0 6px 12px -10px rgba(110,80,24,.5)', font: "600 12.5px 'Geist'", color: TINTA }}
          >
            <span className="flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(145deg,#FFF6DC,#D9BC6E 60%,#B58A2E)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.7)', color: TINTA }}>
              <Trazo d={ICONOS[b.clave]} tam={16} />
            </span>
            {b.etiqueta}
            {!conPase && (
              <span className="absolute flex items-center justify-center" style={{ right: -4, top: -6, width: 20, height: 20, borderRadius: '50%', background: TINTA, border: `1.5px solid ${ORO}`, boxSizing: 'border-box' }}>
                <Trazo d={ICONOS.candado} tam={12} color="#F3D88F" grosor={2.4} />
              </span>
            )}
          </button>
        ))}
      </div>
      {abierta && <HojaCerca clave={abierta} route={route} origenRespaldo={origen} onCerrar={() => setAbierta(null)} />}
    </div>
  )
}
