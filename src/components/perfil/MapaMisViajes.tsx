import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { APP_LANGUAGE } from '../../lib/appLanguage'
import { COLOR_ICONO, iconoSvg } from '../../lib/iconos'
import { PROYECCION_MAPA_VIAJES, type Chincheta } from '../../lib/viajesPerfil'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

/**
 * El mapa de mis viajes (Tanda 6z6): una bola del mundo (globo de Mapbox) con una chincheta por destino de cada viaje. Tocar una chincheta abre la ficha de ese viaje.
 * Chincheta oscura = el viaje viene; verde = ya hecho. Se crea al abrir el Perfil y se destruye al cerrarlo (`map.remove()`): no deja un lienzo WebGL vivo.
 */
export function MapaMisViajes({ chinchetas, onElegir }: { chinchetas: Chincheta[]; onElegir: (viajeId: string) => void }) {
  const contenedor = useRef<HTMLDivElement>(null)
  const alElegir = useRef(onElegir)
  alElegir.current = onElegir
  const clave = chinchetas.map((c) => `${c.id}:${c.fase}:${c.coordenadas.lat.toFixed(4)},${c.coordenadas.lng.toFixed(4)}`).join('|')

  useEffect(() => {
    const elemento = contenedor.current
    if (!elemento || !mapboxgl.accessToken) return

    const mapa = new mapboxgl.Map({
      container: elemento,
      style: 'mapbox://styles/mapbox/streets-v12',
      projection: PROYECCION_MAPA_VIAJES,
      language: APP_LANGUAGE,
      center: chinchetas.length > 0 ? [chinchetas[0].coordenadas.lng, chinchetas[0].coordenadas.lat] : [10, 30],
      zoom: 1.4,
      attributionControl: false,
    })
    mapa.addControl(new mapboxgl.AttributionControl({ compact: true }))

    const marcadores = chinchetas.map((chincheta) => {
      const boton = document.createElement('button')
      boton.type = 'button'
      boton.setAttribute('aria-label', `${chincheta.ciudad}: abrir este viaje`)
      boton.className = 'flex h-8 w-8 items-center justify-center rounded-full text-white shadow-md ring-2 ring-white'
      boton.style.backgroundColor = chincheta.fase === 'hecho' ? COLOR_ICONO.hecho : COLOR_ICONO.tinta
      boton.innerHTML = iconoSvg('mapa', 16)
      boton.addEventListener('click', (evento) => {
        evento.stopPropagation()
        alElegir.current(chincheta.viajeId)
      })
      return new mapboxgl.Marker({ element: boton }).setLngLat([chincheta.coordenadas.lng, chincheta.coordenadas.lat]).addTo(mapa)
    })

    mapa.on('style.load', () => {
      // (Una bola de verdad: el espacio de un color suave, sin estrellas, y la atmósfera en el borde.)
      mapa.setFog({ color: 'rgb(255,253,248)', 'high-color': 'rgb(170,215,235)', 'horizon-blend': 0.06, 'space-color': 'rgb(244,239,230)', 'star-intensity': 0 })
      if (chinchetas.length > 1) {
        const limites = chinchetas.reduce((l, c) => l.extend([c.coordenadas.lng, c.coordenadas.lat] as [number, number]), new mapboxgl.LngLatBounds([chinchetas[0].coordenadas.lng, chinchetas[0].coordenadas.lat], [chinchetas[0].coordenadas.lng, chinchetas[0].coordenadas.lat]))
        mapa.fitBounds(limites, { padding: 40, maxZoom: 1.6, duration: 0 })
      } else if (chinchetas.length === 1) {
        mapa.jumpTo({ center: [chinchetas[0].coordenadas.lng, chinchetas[0].coordenadas.lat], zoom: 0.9 })
      }
    })

    // Mapbox no se entera solo de que su caja cambia de tamaño (la hoja que sube, el móvil que gira).
    const observador = new ResizeObserver(() => mapa.resize())
    observador.observe(elemento)

    return () => {
      observador.disconnect()
      marcadores.forEach((m) => m.remove())
      mapa.remove()
    }
    // Se rehace solo cuando cambian las chinchetas de verdad (la clave), no en cada pintado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])

  if (!mapboxgl.accessToken) {
    return (
      <div className="flex h-[240px] w-full items-center justify-center rounded-2xl border border-text/10 bg-bg-card">
        <p className="text-small text-text-muted">Mapa no disponible</p>
      </div>
    )
  }

  return <div ref={contenedor} role="region" aria-label="Mapa de mis viajes" className="isolate h-[240px] w-full overflow-hidden rounded-2xl border border-text/10 bg-bg-card" />
}
