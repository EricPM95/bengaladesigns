import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Coordinates, DayPlan } from '../../lib/types'
import { segmentCentroid, type DestinationSegment } from '../../lib/destinationSegments'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

interface RouteOverviewMapProps {
  segments: DestinationSegment[]
  days: DayPlan[]
}

function collectPoints(segments: DestinationSegment[], days: DayPlan[]): Coordinates[] {
  return segments.map((segment) => segmentCentroid(segment, days)).filter((coords): coords is Coordinates => Boolean(coords))
}

/**
 * Mapa real de la pestaña RUTA vía Mapbox GL JS (mismo token/proveedor que el buscador de
 * lugares) — un marcador si el viaje es de un único destino, o marcadores numerados unidos por la
 * ruta trazada en orden de la lista si hay varios. El centroide de cada tramo (`segmentCentroid`)
 * es su posición en el mapa.
 */
export function RouteOverviewMap({ segments, days }: RouteOverviewMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const points = collectPoints(segments, days)
  const pointsKey = points.map((c) => `${c.lat.toFixed(5)},${c.lng.toFixed(5)}`).join('|')

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [points[0].lng, points[0].lat],
      zoom: 11,
    })

    map.on('load', () => {
      points.forEach((coords, index) => {
        const el = document.createElement('div')
        el.className =
          'flex h-7 w-7 items-center justify-center rounded-full bg-accent text-caption font-semibold text-white shadow-md ring-2 ring-white'
        if (points.length > 1) el.textContent = String(index + 1)
        new mapboxgl.Marker({ element: el }).setLngLat([coords.lng, coords.lat]).addTo(map)
      })

      if (points.length > 1) {
        map.addSource('route-line', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: points.map((c) => [c.lng, c.lat]) },
          },
        })
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-line',
          paint: { 'line-color': '#2DD4BF', 'line-width': 3, 'line-dasharray': [2, 1.5] },
        })

        const bounds = points.reduce(
          (b, c) => b.extend([c.lng, c.lat] as [number, number]),
          new mapboxgl.LngLatBounds([points[0].lng, points[0].lat], [points[0].lng, points[0].lat]),
        )
        map.fitBounds(bounds, { padding: 48, maxZoom: 12 })
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
  }, [pointsKey])

  if (points.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-bg-card">
        <p className="text-small text-text-muted">Mapa no disponible</p>
      </div>
    )
  }

  return <div ref={containerRef} className="isolate h-full w-full" />
}
