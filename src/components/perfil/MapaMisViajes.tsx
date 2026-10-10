import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { APP_LANGUAGE } from '../../lib/appLanguage'
import { COLOR_ICONO, iconoSvg } from '../../lib/iconos'
import { CAJA_MAPA_VIAJES, PROYECCION_MAPA_VIAJES, TEXTOS_MAPA_VIAJES, centroDelGlobo, zoomGloboEntero, type Chincheta } from '../../lib/viajesPerfil'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

/** El mismo estilo en local y en producción (nada de condiciones solo de desarrollo): el token es `VITE_MAPBOX_TOKEN` en los dos. */
const ESTILO_MAPA_VIAJES = 'mapbox://styles/mapbox/streets-v12'

/**
 * El mapa de mis viajes (Tanda 6z3, 6z6 y 6z6b): una bola del mundo (globo de Mapbox) con una chincheta por destino de cada viaje. Tocar una chincheta abre la ficha de ese viaje.
 * Chincheta oscura = el viaje viene; verde = ya hecho. Se crea al abrir el Perfil y se destruye al cerrarlo (`map.remove()`): no deja un lienzo WebGL vivo.
 *  · Bajo (220 px): con UN dedo se baja la página; para mover el mapa, DOS dedos (`cooperativeGestures`, con el aviso en español).
 *  · La bola se ve ENTERA, con su borde curvo (el zoom lo calcula `zoomGloboEntero`), centrada en la media de las chinchetas; con varias no se acerca: se ve el mundo con todas.
 */
export function MapaMisViajes({ chinchetas, onElegir }: { chinchetas: Chincheta[]; onElegir: (viajeId: string) => void }) {
  const contenedor = useRef<HTMLDivElement>(null)
  const alElegir = useRef(onElegir)
  alElegir.current = onElegir
  const clave = chinchetas.map((c) => `${c.id}:${c.fase}:${c.coordenadas.lat.toFixed(4)},${c.coordenadas.lng.toFixed(4)}`).join('|')

  useEffect(() => {
    const elemento = contenedor.current
    if (!elemento || !mapboxgl.accessToken) return

    const centro = centroDelGlobo(chinchetas)
    const zoomEntero = zoomGloboEntero(elemento.clientWidth || CAJA_MAPA_VIAJES.ancho, elemento.clientHeight || CAJA_MAPA_VIAJES.alto)
    const mapa = new mapboxgl.Map({
      container: elemento,
      style: ESTILO_MAPA_VIAJES,
      projection: PROYECCION_MAPA_VIAJES,
      language: APP_LANGUAGE,
      center: [centro.lng, centro.lat],
      zoom: zoomEntero,
      cooperativeGestures: true,
      locale: { ...TEXTOS_MAPA_VIAJES },
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
      // La bola, también si el estilo llega sin proyección: se pide otra vez al cargar el estilo.
      mapa.setProjection(PROYECCION_MAPA_VIAJES)
      // (Una bola de verdad: el espacio de un color suave, sin estrellas, y la atmósfera en el borde.)
      mapa.setFog({ color: 'rgb(255,253,248)', 'high-color': 'rgb(170,215,235)', 'horizon-blend': 0.06, 'space-color': 'rgb(244,239,230)', 'star-intensity': 0 })
      mapa.jumpTo({ center: [centro.lng, centro.lat], zoom: zoomEntero })
    })

    // Mapbox no se entera solo de que su caja cambia de tamaño (el móvil que gira).
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
      <div className="flex h-[220px] w-full items-center justify-center rounded-2xl border border-text/10 bg-bg-card">
        <p className="text-small text-text-muted">Mapa no disponible</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div ref={contenedor} role="region" aria-label="Mapa de mis viajes" className="isolate h-[220px] w-full overflow-hidden rounded-2xl border border-text/10 bg-bg-card" />
      {chinchetas.length === 0 && (
        <p className="pointer-events-none absolute inset-x-0 bottom-3 z-10 text-center text-[12.5px] font-medium text-text/60">Aún no tienes viajes</p>
      )}
    </div>
  )
}
