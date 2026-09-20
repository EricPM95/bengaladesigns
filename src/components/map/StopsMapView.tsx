import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Coordinates } from '../../lib/types'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

function computeBounds(markers: { coordinates: Coordinates }[]): mapboxgl.LngLatBounds {
  return markers.reduce(
    (bound, marker) => bound.extend([marker.coordinates.lng, marker.coordinates.lat] as [number, number]),
    new mapboxgl.LngLatBounds(
      [markers[0].coordinates.lng, markers[0].coordinates.lat],
      [markers[0].coordinates.lng, markers[0].coordinates.lat],
    ),
  )
}

export interface StopsMapMarker {
  id: string
  name: string
  coordinates: Coordinates
  /** Número mostrado en el pin — quien llama decide qué significa (posición en el día, orden global...). Ignorado si `icon` está presente. */
  number: number
  bg: string
  text: string
  /** Emoji/icono mostrado en vez del número — para el pin morado de "punto de llegada" (avión/barco/tren), ver arrivalIcon.ts. */
  icon?: string
  /** Foto ya existente de la parada (mismo dato que su tarjeta) — si falta, el popup muestra solo el nombre, sin pedirla a ninguna API. */
  photoUrl?: string
  /** Ronda 9 (Mejora 1C, "Ver todo"): opacidad del pin — 1 (por defecto) para el día activo, ~0.4
      para el resto de días cuando se muestran todos a la vez. Nunca se ocultan del todo, solo se
      atenúan (mismo criterio que ya usaban los colores mudos antes de esta ronda). */
  opacity?: number
}

/** Ronda 9 (Mejora 1A): línea recta uniendo las paradas de un día en orden — un `StopsMapMarkerLine`
    por día, para que "Ver todo" pueda dibujar cada una en su propio color con su propia opacidad. */
export interface StopsMapMarkerLine {
  id: string
  coordinates: Coordinates[]
  color: string
  opacity?: number
  width?: number
}

interface StopsMapViewProps {
  markers: StopsMapMarker[]
  /** Líneas rectas conectando paradas en orden — una por día. Vacío/omitido = sin líneas (comportamiento previo). */
  lines?: StopsMapMarkerLine[]
  activeStopId?: string | null
  onSelectStop?: (stopId: string) => void
  /** Cuando true, cambiar `activeStopId` mueve la cámara: `flyTo` el marcador activo (acercando el zoom), o vuelve al `fitBounds` de todos los marcadores cuando pasa a null — usado por MealDetailSheet.tsx para el highlight mapa↔lista de restaurantes. Por defecto false: el resto de usos de este mapa (RUTA, DIAS, StopDetailSheet) solo quieren el resaltado visual del pin, sin mover la cámara. */
  flyToActiveStop?: boolean
}

/**
 * Mapa real de paradas vía Mapbox GL JS (mismo proveedor/token que RouteOverviewMap.tsx) — un pin
 * numerado y coloreado por parada; los colores/números los decide quien llama (DIAS: color único,
 * numerado por posición en el día; RUTA en destino único: coloreado por día vía dayColors.ts) para
 * que este componente no necesite saber nada de "día" ni de la forma de la ruta. Sustituye a
 * MapPlaceholder/AllDaysMapPlaceholder (fondo estático de picsum) en esos dos sitios.
 */
export function StopsMapView({ markers, lines = [], activeStopId, onSelectStop, flyToActiveStop = false }: StopsMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const innerElsRef = useRef<Map<string, HTMLElement>>(new Map())
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersKey = markers
    .map(
      (marker) =>
        `${marker.id}:${marker.coordinates.lat.toFixed(5)},${marker.coordinates.lng.toFixed(5)}:${marker.icon ?? marker.number}:${marker.bg}:${marker.opacity ?? 1}`,
    )
    .join('|')
  const linesKey = lines
    .map((line) => `${line.id}:${line.color}:${line.opacity ?? 1}:${line.width ?? 3}:${line.coordinates.map((c) => `${c.lat.toFixed(5)},${c.lng.toFixed(5)}`).join(',')}`)
    .join('|')

  useEffect(() => {
    if (!containerRef.current || markers.length === 0) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [markers[0].coordinates.lng, markers[0].coordinates.lat],
      zoom: 14,
    })
    mapRef.current = map
    innerElsRef.current = new Map()
    // Un único popup vivo a la vez — reutilizado (nunca varios apilados) para que abrir uno nuevo
    // cierre automáticamente el anterior, y closeOnClick para que un click fuera de cualquier pin
    // también lo cierre (click en OTRO pin no llega al mapa, así que ese caso lo cubre el propio
    // toggle de abajo).
    const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: true, offset: 18, className: 'stops-map-popup' })
    let openPinId: string | null = null
    popup.on('close', () => {
      openPinId = null
    })

    map.on('load', () => {
      // Ronda 9 (Mejora 1A): líneas rectas de ruta, una capa por día — SIEMPRE debajo de los pines
      // (añadidas antes de los mapboxgl.Marker, que van en su propio overlay HTML por encima del
      // canvas del mapa base sin importar el orden de inserción, pero mantener el orden lógico
      // aquí evita sorpresas si algún día se dibuja algo más en el canvas).
      lines.forEach((line) => {
        if (line.coordinates.length < 2) return
        const sourceId = `stops-line-${line.id}`
        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: line.coordinates.map((c) => [c.lng, c.lat]) },
          },
        })
        map.addLayer({
          id: sourceId,
          type: 'line',
          source: sourceId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': line.color, 'line-width': line.width ?? 3, 'line-opacity': line.opacity ?? 1 },
        })
      })

      markers.forEach((marker) => {
        // Mapbox aplica su propio transform de posicionamiento al elemento raíz del Marker — si se
        // le toca el transform desde fuera (p.ej. para el estado "activo") el pin salta de sitio.
        // Por eso el círculo visible va en un DIV HIJO aparte, nunca en el que recibe `new Marker()`.
        const root = document.createElement('div')
        const inner = document.createElement('div')
        inner.style.backgroundColor = marker.bg
        inner.style.color = marker.text
        inner.style.opacity = String(marker.opacity ?? 1)
        inner.className =
          'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-caption font-semibold shadow-md ring-2 ring-white transition-transform'
        inner.textContent = marker.icon ?? String(marker.number)
        root.appendChild(inner)
        root.addEventListener('click', (event) => {
          event.stopPropagation()
          onSelectStop?.(marker.id)
          // Tocar el mismo pin que ya tiene el popup abierto lo cierra (toggle); tocar cualquier
          // otro pin reemplaza el contenido y lo mueve ahí, nunca se apilan dos popups.
          const alreadyOpenHere = popup.isOpen() && openPinId === marker.id
          popup.remove()
          if (alreadyOpenHere) return
          const card = document.createElement('div')
          card.className = 'w-40 overflow-hidden rounded-xl bg-bg-card shadow-lg'
          if (marker.photoUrl) {
            const img = document.createElement('img')
            img.src = marker.photoUrl
            img.alt = ''
            img.className = 'h-20 w-full object-cover'
            card.appendChild(img)
          }
          const label = document.createElement('p')
          label.className = 'line-clamp-2 p-2 text-caption font-semibold text-text'
          label.textContent = marker.name
          card.appendChild(label)
          openPinId = marker.id
          popup.setLngLat([marker.coordinates.lng, marker.coordinates.lat]).setDOMContent(card).addTo(map)
        })
        innerElsRef.current.set(marker.id, inner)
        new mapboxgl.Marker({ element: root }).setLngLat([marker.coordinates.lng, marker.coordinates.lat]).addTo(map)
      })

      if (markers.length > 1) {
        map.fitBounds(computeBounds(markers), { padding: 56, maxZoom: 15 })
      }
    })

    // Mapbox GL no detecta solo que su contenedor cambió de tamaño (p.ej. al arrastrar el tirador
    // del panel en móvil) — sin esto el canvas se queda fijo en el tamaño que tenía al crearse.
    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [markersKey, linesKey])

  useEffect(() => {
    for (const [stopId, el] of innerElsRef.current) {
      el.style.transform = stopId === activeStopId ? 'scale(1.2)' : ''
      el.style.zIndex = stopId === activeStopId ? '10' : ''
    }
  }, [activeStopId])

  // Solo cuando `flyToActiveStop` (MealDetailSheet.tsx: highlight mapa↔lista de restaurantes) — el
  // resto de usos de activeStopId (RUTA, DIAS, StopDetailSheet) solo quieren el pin resaltado, sin
  // mover la cámara del viajero de donde la dejó.
  useEffect(() => {
    if (!flyToActiveStop) return
    const map = mapRef.current
    if (!map) return
    if (activeStopId) {
      const marker = markers.find((candidate) => candidate.id === activeStopId)
      if (marker) map.flyTo({ center: [marker.coordinates.lng, marker.coordinates.lat], zoom: Math.max(map.getZoom(), 16), duration: 800 })
    } else if (markers.length > 1) {
      map.fitBounds(computeBounds(markers), { padding: 56, maxZoom: 15, duration: 800 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStopId, flyToActiveStop, markersKey])

  if (markers.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-bg-card">
        <p className="text-small text-text-muted">Mapa no disponible</p>
      </div>
    )
  }

  return <div ref={containerRef} className="isolate h-full w-full" />
}
