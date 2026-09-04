import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Coordinates } from '../../lib/types'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

export interface StopsMapMarker {
  id: string
  name: string
  coordinates: Coordinates
  /** Número mostrado en el pin — quien llama decide qué significa (posición en el día, orden global...). */
  number: number
  bg: string
  text: string
  /** Foto ya existente de la parada (mismo dato que su tarjeta) — si falta, el popup muestra solo el nombre, sin pedirla a ninguna API. */
  photoUrl?: string
}

interface StopsMapViewProps {
  markers: StopsMapMarker[]
  activeStopId?: string | null
  onSelectStop?: (stopId: string) => void
}

/**
 * Mapa real de paradas vía Mapbox GL JS (mismo proveedor/token que RouteOverviewMap.tsx) — un pin
 * numerado y coloreado por parada; los colores/números los decide quien llama (DIAS: color único,
 * numerado por posición en el día; RUTA en destino único: coloreado por día vía dayColors.ts) para
 * que este componente no necesite saber nada de "día" ni de la forma de la ruta. Sustituye a
 * MapPlaceholder/AllDaysMapPlaceholder (fondo estático de picsum) en esos dos sitios.
 */
export function StopsMapView({ markers, activeStopId, onSelectStop }: StopsMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const innerElsRef = useRef<Map<string, HTMLElement>>(new Map())
  const markersKey = markers.map((marker) => `${marker.id}:${marker.coordinates.lat.toFixed(5)},${marker.coordinates.lng.toFixed(5)}:${marker.number}:${marker.bg}`).join('|')

  useEffect(() => {
    if (!containerRef.current || markers.length === 0) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [markers[0].coordinates.lng, markers[0].coordinates.lat],
      zoom: 14,
    })
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
      markers.forEach((marker) => {
        // Mapbox aplica su propio transform de posicionamiento al elemento raíz del Marker — si se
        // le toca el transform desde fuera (p.ej. para el estado "activo") el pin salta de sitio.
        // Por eso el círculo visible va en un DIV HIJO aparte, nunca en el que recibe `new Marker()`.
        const root = document.createElement('div')
        const inner = document.createElement('div')
        inner.style.backgroundColor = marker.bg
        inner.style.color = marker.text
        inner.className =
          'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-caption font-semibold shadow-md ring-2 ring-white transition-transform'
        inner.textContent = String(marker.number)
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
        const bounds = markers.reduce(
          (bound, marker) => bound.extend([marker.coordinates.lng, marker.coordinates.lat] as [number, number]),
          new mapboxgl.LngLatBounds(
            [markers[0].coordinates.lng, markers[0].coordinates.lat],
            [markers[0].coordinates.lng, markers[0].coordinates.lat],
          ),
        )
        map.fitBounds(bounds, { padding: 56, maxZoom: 15 })
      }
    })

    // Mapbox GL no detecta solo que su contenedor cambió de tamaño (p.ej. al arrastrar el tirador
    // del panel en móvil) — sin esto el canvas se queda fijo en el tamaño que tenía al crearse.
    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      map.remove()
    }
  }, [markersKey])

  useEffect(() => {
    for (const [stopId, el] of innerElsRef.current) {
      el.style.transform = stopId === activeStopId ? 'scale(1.2)' : ''
      el.style.zIndex = stopId === activeStopId ? '10' : ''
    }
  }, [activeStopId])

  if (markers.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-bg-card">
        <p className="text-small text-text-muted">Mapa no disponible</p>
      </div>
    )
  }

  return <div ref={containerRef} className="isolate h-full w-full" />
}
