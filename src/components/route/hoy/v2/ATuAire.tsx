import { useEffect, useMemo, useState } from 'react'
import type { Coordinates, Route, Stop } from '../../../../lib/types'
import { fetchDestinationPlaces, type DestinationPlace } from '../../../../lib/destinationPlacesApi'
import { hasRealCoordinates, haversineMeters } from '../../../../lib/distanceMock'
import { displayStopName } from '../../../../lib/format'
import { enviarVisto } from '../../../../lib/logros'
import { alCambiarSugerencias, ponerSugerenciasDelCompanero, sugerenciasDelCompanero } from '../../../../lib/sugerenciasCompanero'
import { useSyncStore } from '../../../../store/useSyncStore'
import { Icono } from '../../../ui/Icono'
import { ParadaFoto } from './ParadaFoto'
import { useFotoDeParada } from './useFotoDeParada'

/**
 * (HOY2b 5, pantalla 33 «A tu aire») EL DÍA (O LA TARDE) SIN RUTA. En lugar de una pantalla vacía:
 *  · «Hoy tienes el día a tu aire.» y la pregunta «¿Te avisamos si pasas cerca de algo que da recompensa?» con [Sí] / [No] (es el ajuste «Sugerencias del compañero»: lo mismo que en Ajustes);
 *  · la lista de sitios del destino, los más cercanos primero, para marcar [Visto] en cualquiera (cuenta para los logros igual que una parada de la ruta; no cambia la ruta);
 *  · abajo, [Volver a mi ruta].
 * Nada se mueve solo: marcar Visto aquí no toca el día.
 */
const ORO_TEXTO = '#8E6820'
const MAX_FILAS = 12

const claveVistos = (tripId: string, dateIso: string) => `trazo:hoy2b:a-tu-aire-vistos:${tripId}:${dateIso}`
function leerVistos(tripId: string, dateIso: string): string[] {
  try {
    const l = JSON.parse(window.localStorage.getItem(claveVistos(tripId, dateIso)) ?? '[]')
    return Array.isArray(l) ? l.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}
function guardarVistos(tripId: string, dateIso: string, ids: string[]) {
  try {
    window.localStorage.setItem(claveVistos(tripId, dateIso), JSON.stringify(ids))
  } catch {
    /* sin almacenamiento: vale hasta cerrar la pantalla */
  }
}

/** Los sitios de la lista: lugares de verdad (no restaurantes ni baños), los más cercanos a `desde` primero; sin ubicación, por su orden en los datos. */
export function sitiosParaATuAire(places: DestinationPlace[], desde: Coordinates | null, max = MAX_FILAS): DestinationPlace[] {
  const lugares = places.filter((p) => p.kind === 'place' && !p.fuera_de_lista && hasRealCoordinates(p.coordinates))
  if (!desde || !hasRealCoordinates(desde)) return lugares.slice(0, max)
  return [...lugares].sort((a, b) => haversineMeters(desde, a.coordinates) - haversineMeters(desde, b.coordinates)).slice(0, max)
}

function Fila({ sitio, ciudad, dateIso, visto, onVisto }: { sitio: DestinationPlace; ciudad: string; dateIso: string; visto: boolean; onVisto: () => void }) {
  const falsa = { id: `aire:${sitio.name}`, name: sitio.name } as unknown as Stop
  const foto = useFotoDeParada(falsa, ciudad, dateIso)
  return (
    <div data-hoy-aire-fila={sitio.name} data-visto={visto ? '1' : '0'} className="flex items-center gap-3 rounded-2xl bg-white px-2.5 py-2" style={{ border: '1px solid rgba(28,34,48,.08)' }}>
      <ParadaFoto nombre={sitio.name} photoUrl={foto} vista={visto} size={44} marca={visto} />
      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{displayStopName(sitio.name)}</span>
      <button
        type="button"
        onClick={onVisto}
        aria-pressed={visto}
        aria-label={visto ? `Quitar el visto de ${displayStopName(sitio.name)}` : `Marcar ${displayStopName(sitio.name)} como visto`}
        data-hoy-aire-visto
        className="flex h-11 w-11 flex-none items-center justify-center rounded-full"
        style={visto ? { background: 'oklch(0.94 0.04 150)', color: 'oklch(0.35 0.09 150)' } : { border: '1.5px solid rgba(28,34,48,.25)', color: 'rgba(28,34,48,.55)' }}
      >
        <Icono nombre="hecho" size={18} grosor={1.8} />
      </button>
    </div>
  )
}

export function ATuAire({ route, dateIso, desde, onVolverALaRuta }: { route: Route; dateIso: string; desde: Coordinates | null; onVolverALaRuta: () => void }) {
  const tripId = useSyncStore((s) => s.activeTripId) ?? route.id
  const [avisos, setAvisos] = useState(() => sugerenciasDelCompanero())
  useEffect(() => alCambiarSugerencias(() => setAvisos(sugerenciasDelCompanero())), [])
  const [places, setPlaces] = useState<DestinationPlace[]>([])
  useEffect(() => {
    let vivo = true
    void fetchDestinationPlaces(route.destination).then((c) => {
      if (vivo) setPlaces(c.places)
    })
    return () => {
      vivo = false
    }
  }, [route.destination])
  const filas = useMemo(() => sitiosParaATuAire(places, desde), [places, desde])
  const [vistos, setVistos] = useState<string[]>(() => leerVistos(tripId, dateIso))
  const alternar = (sitio: DestinationPlace) => {
    const ya = vistos.includes(sitio.name)
    const nuevos = ya ? vistos.filter((x) => x !== sitio.name) : [...vistos, sitio.name]
    setVistos(nuevos)
    guardarVistos(tripId, dateIso, nuevos)
    // Cuenta para los logros como cualquier Visto (con la hora y la ubicación de ahora); sin conexión, queda en la cola de siempre.
    if (!ya) void enviarVisto({ tripId, stopId: `aire:${sitio.name}`, nombre: sitio.name })
  }
  return (
    <div data-hoy-a-tu-aire className="flex flex-none flex-col gap-3.5">
      <div className="flex flex-none flex-col gap-2.5 rounded-[22px] bg-[#1C2230] p-4 text-[#FFFDF8]">
        <span data-hoy-aire-titulo style={{ font: "400 22px/1.15 'Instrument Serif',serif" }}>Hoy tienes el día a tu aire.</span>
        <span data-hoy-aire-pregunta className="text-[14px] leading-[1.4]" style={{ color: 'rgba(251,243,226,.82)' }}>
          ¿Te avisamos si pasas cerca de algo que da recompensa?
        </span>
        <div className="flex gap-2">
          {([true, false] as const).map((si) => (
            <button
              key={String(si)}
              type="button"
              onClick={() => ponerSugerenciasDelCompanero(si)}
              aria-pressed={avisos === si}
              data-hoy-aire-avisos={si ? 'si' : 'no'}
              className="flex h-11 min-w-[84px] flex-1 items-center justify-center rounded-full text-[14px] font-semibold"
              style={avisos === si ? { background: '#F3D88F', color: '#4A3510' } : { border: '1.5px solid rgba(251,243,226,.4)', color: '#FBF3E2' }}
            >
              {si ? 'Sí' : 'No'}
            </button>
          ))}
        </div>
      </div>
      {filas.length > 0 && (
        <div className="flex flex-none flex-col gap-2" data-hoy-aire-lista>
          <span className="px-1" style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.12em', textTransform: 'uppercase', color: ORO_TEXTO }}>Lo que vayas viendo</span>
          <span className="px-1 text-[13px] leading-[1.4] text-text/65">Márcalo como visto cuando lo veas: cuenta para tus logros igual que si estuviera en tu ruta.</span>
          {filas.map((s) => (
            <Fila key={s.name} sitio={s} ciudad={route.destination} dateIso={dateIso} visto={vistos.includes(s.name)} onVisto={() => alternar(s)} />
          ))}
        </div>
      )}
      <button type="button" onClick={onVolverALaRuta} data-hoy-aire-volver className="flex h-12 flex-none items-center justify-center rounded-full bg-[#1C2230] text-[14px] font-semibold text-[#FFFDF8]">
        Volver a mi ruta
      </button>
    </div>
  )
}
