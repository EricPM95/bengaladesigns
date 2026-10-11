import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { APP_LANGUAGE } from '../../lib/appLanguage'
import { COLOR_ICONO } from '../../lib/iconos'
import { CAJA_MAPA_VIAJES, PROYECCION_MAPA_VIAJES, TEXTOS_MAPA_VIAJES, centroDelGlobo, zoomGloboEntero, type CifrasDelPerfil, type Chincheta } from '../../lib/viajesPerfil'
import { CifrasDelMapa } from './CifrasDelMapa'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

/** El mismo estilo en local y en producción (nada de condiciones solo de desarrollo): el token es `VITE_MAPBOX_TOKEN` en los dos. */
const ESTILO_MAPA_VIAJES = 'mapbox://styles/mapbox/streets-v12'

/** El alto del mapa (Tanda 6y4): 286 px, un 30 % más que los 220 de antes. Lo repite `CAJA_MAPA_VIAJES.alto`. */
const CLASE_MARCO = 'isolate relative h-[286px] flex-none overflow-hidden rounded-[26px] border border-text/[.08]'
const DORADO = 'oklch(0.8 0.14 70)'

/** La chincheta del diseño: el punto oscuro con su anillo claro y su latido, y al lado la pastilla «Roma ×5» (el «×N» solo si hay más de un viaje a ese destino). */
function crearChincheta(chincheta: Chincheta): HTMLButtonElement {
  const boton = document.createElement('button')
  boton.type = 'button'
  boton.setAttribute('aria-label', `${chincheta.ciudad}: abrir este viaje`)
  boton.setAttribute('data-chincheta', '1')
  boton.style.cssText = 'position:relative;display:block;width:12px;height:12px;padding:0;border:0;background:transparent;cursor:pointer'
  const color = chincheta.fase === 'hecho' ? COLOR_ICONO.hecho : COLOR_ICONO.tinta
  const latido = document.createElement('span')
  latido.style.cssText = `position:absolute;inset:0;border-radius:50%;background:${DORADO};pointer-events:none`
  latido.animate?.([{ transform: 'scale(.6)', opacity: 0.7 }, { transform: 'scale(2.4)', opacity: 0 }], { duration: 2400, iterations: Infinity, easing: 'ease-out' })
  const punto = document.createElement('span')
  punto.style.cssText = `position:absolute;inset:0;border-radius:50%;background:${color};box-shadow:0 0 0 3px #FFFDF8;pointer-events:none`
  const pastilla = document.createElement('span')
  pastilla.style.cssText = `position:absolute;left:10px;top:-26px;display:flex;align-items:center;gap:6px;height:26px;padding:0 10px;border-radius:999px;background:#1C2230;color:#FFFDF8;font:500 12px Geist,system-ui,sans-serif;white-space:nowrap;pointer-events:none`
  pastilla.textContent = chincheta.ciudad
  if (chincheta.viajes > 1) {
    const veces = document.createElement('span')
    veces.style.cssText = `font:600 10.5px 'Geist Mono',ui-monospace,monospace;color:${DORADO}`
    veces.textContent = `×${chincheta.viajes}`
    pastilla.appendChild(veces)
  }
  boton.append(latido, punto, pastilla)
  return boton
}

/**
 * El mapa de mis viajes (Tanda 6z3, 6z6, 6z6b y 6y4): nuestro globo de Mapbox de verdad, dentro del marco del diseño del Perfil, con UNA chincheta por destino («Roma ×5») y las cifras
 * («1 país · 4 lugares · 14 días») abajo a la izquierda. Tocar una chincheta abre la ficha del viaje más cercano de ese destino. Chincheta oscura = el viaje viene; verde = ya hecho.
 * Se crea al abrir el Perfil y se destruye al cerrarlo (`map.remove()`): no deja un lienzo WebGL vivo.
 *  · Alto (286 px, un 30 % más que antes): con UN dedo se baja la página; para mover el mapa, DOS dedos (`cooperativeGestures`, con el aviso en español).
 *  · La bola llena el ANCHO del mapa (6z6c: se corta un poco el borde de arriba y de abajo, pero los lados siguen curvos; el zoom lo calcula `zoomGloboEntero`), centrada en la media de las chinchetas; con varias no se acerca: se ve el mundo con todas.
 */
export function MapaMisViajes({ chinchetas, cifras, onElegir }: { chinchetas: Chincheta[]; cifras: CifrasDelPerfil; onElegir: (viajeId: string) => void }) {
  const contenedor = useRef<HTMLDivElement>(null)
  const alElegir = useRef(onElegir)
  alElegir.current = onElegir
  const clave = chinchetas.map((c) => `${c.id}:${c.fase}:${c.viajes}:${c.coordenadas.lat.toFixed(4)},${c.coordenadas.lng.toFixed(4)}`).join('|')

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
      const boton = crearChincheta(chincheta)
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
      <div className={`${CLASE_MARCO} flex items-center justify-center bg-[#DDE7DF]`}>
        <p className="text-small text-text-muted">Mapa no disponible</p>
        <CifrasDelMapa cifras={cifras} />
      </div>
    )
  }

  return (
    <div className={`${CLASE_MARCO} bg-[#DDE7DF]`}>
      <div ref={contenedor} role="region" aria-label="Mapa de mis viajes" className="isolate absolute inset-0" />
      {chinchetas.length === 0 && (
        <p className="pointer-events-none absolute inset-x-0 top-3 z-10 text-center text-[12.5px] font-medium text-text/60">Aún no tienes viajes</p>
      )}
      <CifrasDelMapa cifras={cifras} />
    </div>
  )
}
