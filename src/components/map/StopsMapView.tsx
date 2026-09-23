import { useEffect, useMemo, useRef } from 'react'
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
  /** Ronda 10: pin un punto más pequeño — lo usan los días NO activos de "Ver todo" (ver
      routeMapMarkers.ts), donde el tamaño es lo que distingue el día que se está mirando del resto,
      en vez de una opacidad tan baja que dejaba el número ilegible. */
  small?: boolean
}

/** Ronda 9 (Mejora 1A): línea recta uniendo las paradas de un día en orden — un `StopsMapMarkerLine`
    por día, para que "Ver todo" pueda dibujar cada una en su propio color con su propia opacidad. */
export interface StopsMapMarkerLine {
  id: string
  coordinates: Coordinates[]
  color: string
  opacity?: number
  width?: number
  /** Trazo discontinuo — para un trayecto que no se recorre a pie parada a parada, como la ida a una
      excursión fuera de la ciudad (Prompt 4). La línea continua significa "este es tu recorrido". */
  dashed?: boolean
}

interface StopsMapViewProps {
  markers: StopsMapMarker[]
  /** Líneas rectas conectando paradas en orden — una por día. Vacío/omitido = sin líneas (comportamiento previo). */
  lines?: StopsMapMarkerLine[]
  /** Dónde centrar el mapa cuando NO hay marcadores. Sin esto, un mapa sin pines no se pinta (ver el
      early return de abajo) — y un día libre vacío tiene que poder enseñar la ciudad igualmente. */
  center?: Coordinates | null
  activeStopId?: string | null
  onSelectStop?: (stopId: string) => void
  /**
   * Prompt 3 (bug 1): ids de marcadores que se pintan pero NO se ven. Existe porque este mapa se
   * reconstruye entero (map.remove() + new Map) cuando cambia el conjunto de marcadores, y eso
   * hacía que marcar un filtro en la pantalla de lugares reseteara la vista: nuevo fitBounds, nuevo
   * zoom, el mapa "saltando" bajo el dedo. Pasando SIEMPRE el mismo conjunto de marcadores y
   * moviendo solo esta lista, el mapa no se toca: los pines aparecen y desaparecen con un fundido
   * sobre la vista exacta que el viajero tenía.
   */
  hiddenMarkerIds?: string[]
  /** Cuando true, cambiar `activeStopId` mueve la cámara: `flyTo` el marcador activo (acercando el zoom), o vuelve al `fitBounds` de todos los marcadores cuando pasa a null — usado por MealDetailSheet.tsx para el highlight mapa↔lista de restaurantes. Por defecto false: el resto de usos de este mapa (RUTA, DIAS, StopDetailSheet) solo quieren el resaltado visual del pin, sin mover la cámara. */
  flyToActiveStop?: boolean
  /**
   * Encuadra estos marcadores cuando la lista CAMBIA. Es la excepción a la regla de "los filtros no
   * mueven la cámara" (ver hiddenMarkerIds): vale para un filtro que cambia la escala del mapa
   * entera, como las excursiones de Roma — sus destinos están entre 30 y 250 km de la ciudad, así
   * que sin encuadrar se quedaría el mapa de Roma con los seis pines fuera de pantalla. Para
   * filtrar dentro de la misma ciudad NO se usa: ahí mover la cámara es justo lo que molesta.
   */
  fitToMarkerIds?: string[] | null
  /** Arrancar centrado en este punto, a escala de barrio, en vez de encuadrar todos los marcadores. */
  focusCenter?: Coordinates | null
}

/**
 * Mapa real de paradas vía Mapbox GL JS (mismo proveedor/token que RouteOverviewMap.tsx) — un pin
 * numerado y coloreado por parada; los colores/números los decide quien llama (DIAS: color único,
 * numerado por posición en el día; RUTA en destino único: coloreado por día vía dayColors.ts) para
 * que este componente no necesite saber nada de "día" ni de la forma de la ruta. Sustituye a
 * MapPlaceholder/AllDaysMapPlaceholder (fondo estático de picsum) en esos dos sitios.
 */
export function StopsMapView({ markers, lines = [], activeStopId, onSelectStop, flyToActiveStop = false, hiddenMarkerIds, center, fitToMarkerIds, focusCenter = null }: StopsMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const innerElsRef = useRef<Map<string, HTMLElement>>(new Map())
  const rootElsRef = useRef<Map<string, HTMLElement>>(new Map())
  const mapRef = useRef<mapboxgl.Map | null>(null)
  // Prompt 3 (bug 1): deliberadamente FUERA de markersKey. Cambiar qué pines se ven no puede
  // reconstruir el mapa — ver el comentario de hiddenMarkerIds en las props.
  const hiddenKey = (hiddenMarkerIds ?? []).join('|')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hidden = useMemo(() => new Set(hiddenMarkerIds ?? []), [hiddenKey])
  const markersKey = markers
    .map(
      (marker) =>
        `${marker.id}:${marker.coordinates.lat.toFixed(5)},${marker.coordinates.lng.toFixed(5)}:${marker.icon ?? marker.number}:${marker.bg}:${marker.opacity ?? 1}:${marker.small ? 's' : 'n'}`,
    )
    .join('|')
  const centerKey = [center, focusCenter].map((point) => (point ? `${point.lat.toFixed(4)},${point.lng.toFixed(4)}` : '')).join('|')
  const linesKey = lines
    .map((line) => `${line.id}:${line.color}:${line.opacity ?? 1}:${line.width ?? 3}:${line.coordinates.map((c) => `${c.lat.toFixed(5)},${c.lng.toFixed(5)}`).join(',')}`)
    .join('|')

  useEffect(() => {
    if (!containerRef.current) return
    const origin = markers[0]?.coordinates ?? center
    if (!origin) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [origin.lng, origin.lat],
      zoom: markers.length === 0 ? 12 : 14,
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
          paint: {
            'line-color': line.color,
            'line-width': line.width ?? 3,
            'line-opacity': line.opacity ?? 1,
            ...(line.dashed ? { 'line-dasharray': [2, 2] } : {}),
          },
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
        // Ronda 10: h-6/h-5 en vez de h-7 fijo — los pines numerados tapaban demasiado mapa. El
        // borde blanco se mantiene en ring-2 (y el número en font-bold) también en el tamaño
        // pequeño: es justo lo que hacía ilegibles los días no activos de "Ver todo".
        inner.className = `flex ${marker.small ? 'h-5 w-5' : 'h-6 w-6'} cursor-pointer items-center justify-center rounded-full text-caption font-bold shadow-md ring-2 ring-white transition-transform`
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
        rootElsRef.current.set(marker.id, root)
        // El estado inicial de "oculto" se aplica AQUÍ, no solo en el efecto de visibilidad: los
        // marcadores se crean dentro de map.on('load'), que es asíncrono, así que cuando ese efecto
        // corre por primera vez todavía no existe ninguno y no tiene a qué aplicárselo. Sin esto, el
        // primer pintado enseñaba el catálogo entero y los pines no se ocultaban hasta tocar un filtro.
        if (hidden.has(marker.id)) {
          inner.style.opacity = '0'
          inner.style.transform = 'scale(0.6)'
          root.style.pointerEvents = 'none'
        }
        // El fundido va en el HIJO, no en el raíz. Mapbox no solo escribe `transform` en el raíz
        // para posicionarlo: también le reescribe `opacity` en cada render (su propio
        // _updateOpacity, para la oclusión con terreno), así que un opacity puesto ahí desde fuera
        // se pierde solo. Encontrado de verdad: con la primera versión, los 67 pines filtrados se
        // quedaban con pointer-events:none —que Mapbox sí respeta— pero perfectamente visibles.
        inner.style.transition = 'opacity 180ms ease, transform 180ms ease'
        new mapboxgl.Marker({ element: root }).setLngLat([marker.coordinates.lng, marker.coordinates.lat]).addTo(map)
      })

      // El encuadre inicial mira solo los pines VISIBLES: quien llama puede tener cargado todo el
      // catálogo del destino con casi todo oculto (ver hiddenMarkerIds), y encuadrar sobre eso
      // abriría el mapa a vista de ciudad entera en vez de sobre lo que el viajero está mirando.
      const visible = markers.filter((marker) => !hidden.has(marker.id))
      const toFit = visible.length > 1 ? visible : markers
      if (focusCenter) {
        map.jumpTo({ center: [focusCenter.lng, focusCenter.lat], zoom: 15 })
      } else if (toFit.length > 1) {
        map.fitBounds(computeBounds(toFit), { padding: 56, maxZoom: 15 })
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
  }, [markersKey, linesKey, centerKey])

  // Un único efecto manda sobre el aspecto del pin — si el "activo" y el "oculto" escribieran cada
  // uno su propio transform sobre el mismo elemento, el último en correr borraría al otro.
  useEffect(() => {
    for (const [stopId, el] of innerElsRef.current) {
      const isHidden = hidden.has(stopId)
      const marker = markers.find((candidate) => candidate.id === stopId)
      el.style.opacity = isHidden ? '0' : String(marker?.opacity ?? 1)
      el.style.transform = isHidden ? 'scale(0.6)' : stopId === activeStopId ? 'scale(1.2)' : ''
      el.style.zIndex = !isHidden && stopId === activeStopId ? '10' : ''
    }
    // El pointer-events sí va en el raíz (Mapbox no lo toca): un pin invisible no debe seguir
    // capturando clicks ni abriendo su popup.
    for (const [stopId, root] of rootElsRef.current) {
      root.style.pointerEvents = hidden.has(stopId) ? 'none' : ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStopId, hidden, markersKey])

  const fitKey = (fitToMarkerIds ?? []).join('|')
  useEffect(() => {
    const map = mapRef.current
    if (!map || !fitKey) return
    const ids = new Set(fitKey.split('|'))
    const toFit = markers.filter((marker) => ids.has(marker.id))
    if (toFit.length === 0) return
    // Con un solo destino no hay caja que encuadrar: se vuela a él y se deja un zoom que enseñe
    // dónde cae respecto a la ciudad, no la calle.
    if (toFit.length === 1) {
      map.flyTo({ center: [toFit[0].coordinates.lng, toFit[0].coordinates.lat], zoom: 9, duration: 800 })
      return
    }
    map.fitBounds(computeBounds(toFit), { padding: 56, maxZoom: 15, duration: 800 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, markersKey])

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

  if (markers.length === 0 && !center) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-bg-card">
        <p className="text-small text-text-muted">Mapa no disponible</p>
      </div>
    )
  }

  return <div ref={containerRef} className="isolate h-full w-full" />
}
