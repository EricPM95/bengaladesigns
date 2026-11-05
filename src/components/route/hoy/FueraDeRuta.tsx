import { useEffect, useState } from 'react'
import type { DayPlan, Route } from '../../../lib/types'
import { fetchDestinationPlaces } from '../../../lib/destinationPlacesApi'
import { fetchPlacePhoto } from '../../../lib/placePhoto'
import { posicionDeMenosRodeo, primerHuecoLibre } from '../../../lib/masVisitas'
import { useCamaraViajeStore } from '../../../lib/camaraViaje'
import { alDia } from '../../../lib/nombreDeDia'
import { useRouteStore } from '../../../store/useRouteStore'
import { withUndo } from '../../../store/useAddFlowStore'
import type { SitioCerca } from './useCercaDeAqui'

/**
 * «CERCA DE TI» FUERA DE RUTA (Tanda HOY1, H8 y H8b; Design «Hoy Estados»).
 *   - H8: estás DENTRO del radio de un sitio con algo por ganar que no está en tu ruta de hoy (La Graciosa, por ejemplo): «Estás en La Graciosa · Haz tu foto para ganar "La octava isla"» + [Hacer la foto].
 *   - H8b: pasas AL LADO de un sitio con un pedazo por ganar que no está en tu ruta: «Estás junto a… ¿Lo añadimos?» con [Añadir a mi ruta] y [Ahora no].
 * Nada se mueve solo: [Añadir a mi ruta] es lo único que toca el día, lo mete donde menos rodeo hace sin quitar nada y lleva su [Deshacer]. Las reservas no se tocan. Se apaga con «Sugerencias del compañero».
 */
const CLAVE_AHORA_NO = (tripId: string, fecha: string, sitio: string) => `trazo:hoy1:junto-ahora-no:${tripId}:${fecha}:${sitio}`

export const yaDijoAhoraNo = (tripId: string, fecha: string, sitio: string): boolean => {
  try {
    return window.localStorage.getItem(CLAVE_AHORA_NO(tripId, fecha, sitio)) === '1'
  } catch {
    return false
  }
}
const anotarAhoraNo = (tripId: string, fecha: string, sitio: string) => {
  try {
    window.localStorage.setItem(CLAVE_AHORA_NO(tripId, fecha, sitio), '1')
  } catch {
    /* sin almacenamiento: volverá a salir */
  }
}

const GRADIENTE = (nombre: string) => {
  let h = 0
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) % 997
  const hu = ['30', '60', '150', '200', '220', '320'][h % 6]
  return `linear-gradient(150deg,oklch(0.72 0.07 ${hu}),oklch(0.46 0.06 ${Number(hu) + 25}))`
}

/** Mete el sitio en la ruta de hoy donde menos rodeo hace, sin quitar nada, con [Deshacer]. Devuelve false si el sitio no está en el catálogo de paradas. */
export async function anadirSitioAHoy(route: Route, day: DayPlan, nombre: string): Promise<boolean> {
  const catalogo = await fetchDestinationPlaces(route.destination)
  const lugar = catalogo.places.find((p) => p.kind === 'place' && p.name === nombre)
  if (!lugar) return false
  const { stopFromPlace, placeholderPhoto } = await import('../placeExplorer/PlaceExplorerScreen')
  const foto = await Promise.race([fetchPlacePhoto(lugar.photo_name ?? lugar.name, day.city || route.destination, lugar.wikipedia_title), new Promise<null>((r) => setTimeout(() => r(null), 1500))]).catch(() => null)
  const parada = stopFromPlace(lugar, foto ?? placeholderPhoto(lugar.name))
  const actual = useRouteStore.getState().route?.days.find((d) => d.id === day.id)
  if (!actual) return false
  const hueco = posicionDeMenosRodeo(actual.stops, parada.coordinates, primerHuecoLibre(actual.stops))
  withUndo(`Añadido ${alDia(route, day.dayNumber)}`, () => useRouteStore.getState().insertStopAt(day.id, hueco, parada))
  return true
}

export function FueraDeRuta({ sitio, tipo, route, day, tripId, fecha, onCerrar }: { sitio: SitioCerca; tipo: 'fuera' | 'junto'; route: Route; day: DayPlan; tripId: string; fecha: string; onCerrar: () => void }) {
  const [foto, setFoto] = useState<string | null>(null)
  const [anadiendo, setAnadiendo] = useState(false)
  useEffect(() => {
    let vivo = true
    void fetchPlacePhoto(sitio.nombre, route.destination, null).then((u) => vivo && u && setFoto(u))
    return () => {
      vivo = false
    }
  }, [sitio.nombre, route.destination])
  const esJunto = tipo === 'junto'
  const titulo = esJunto ? `Estás junto ${sitio.a_sitio}` : `Estás ${sitio.en_sitio}`
  const texto = esJunto
    ? `Es un pedazo de la colección ${sitio.coleccion_nombre}. ¿Lo añadimos?`
    : sitio.hay_emblema && sitio.emblema_nombre
      ? `Haz tu foto para ganar «${sitio.emblema_nombre}».`
      : `Haz tu foto para ganar tu pedazo de «${sitio.coleccion_nombre}».`
  const boton = 'flex h-[52px] min-h-[52px] flex-none items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl px-2.5 text-[13.5px] font-bold'
  const oro = { background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)', color: '#4A3510', boxShadow: '0 10px 20px -14px rgba(110,80,24,.7),inset 0 1px 0 rgba(255,255,255,.55)' }
  return (
    <>
      <div data-fuera-de-ruta={tipo} data-sitio={sitio.sitio} className="flex-none overflow-hidden" style={{ borderRadius: 26, background: '#1C2230', color: '#FBF3E2' }}>
        <span className="relative block w-full overflow-hidden" style={{ height: 170, background: GRADIENTE(sitio.nombre) }}>
          <button type="button" aria-label="Cerrar este aviso" data-hoy-aviso-x onClick={() => { if (esJunto) anotarAhoraNo(tripId, fecha, sitio.sitio); onCerrar() }} className="absolute right-2 top-2 z-[2] flex h-11 w-11 items-center justify-center rounded-full" style={{ background: 'rgba(28,34,48,.55)', color: '#FBF3E2' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          {foto ? <img src={foto} alt="" className="h-full w-full object-cover" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} /> : <span className="absolute inset-0" style={{ background: 'repeating-linear-gradient(135deg,rgba(255,255,255,.1) 0 2px,transparent 2px 12px)' }} />}
        </span>
        <div className="flex flex-col gap-3 p-4">
          <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#F3D88F' }}>CERCA DE TI</span>
          <span style={{ font: "400 28px/1.1 'Instrument Serif',serif" }}>{titulo}</span>
          <span style={{ font: "400 14px/1.4 'Geist'", color: 'rgba(251,243,226,.8)' }}>{texto}</span>
          {esJunto ? (
            <>
              <button
                type="button"
                disabled={anadiendo}
                data-fuera-de-ruta-boton="anadir"
                onClick={async () => {
                  setAnadiendo(true)
                  const ok = await anadirSitioAHoy(route, day, sitio.nombre)
                  setAnadiendo(false)
                  if (ok) onCerrar()
                }}
                className={boton}
                style={oro}
              >
                {anadiendo ? 'Añadiendo…' : 'Añadir a mi ruta'}
              </button>
              <button
                type="button"
                data-fuera-de-ruta-boton="ahora-no"
                onClick={() => {
                  anotarAhoraNo(tripId, fecha, sitio.sitio)
                  onCerrar()
                }}
                className="zona-toque -mt-1 self-center text-[13px] font-semibold underline underline-offset-[3px]"
                style={{ color: 'rgba(251,243,226,.75)' }}
              >
                Ahora no
              </button>
            </>
          ) : (
            <button type="button" data-fuera-de-ruta-boton="foto" onClick={() => useCamaraViajeStore.getState().abrir({ sitio: sitio.sitio, nombre: sitio.nombre, oculto: sitio.hay_emblema })} className={boton} style={oro}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4A3510" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 8h3l2-3h6l2 3h3v11H4zM12 11a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />
              </svg>
              Hacer la foto
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-none items-center gap-2.5" style={{ padding: '10px 14px', borderRadius: 16, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.1)', font: "500 13px 'Geist'" }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1C2230" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
          <path d="M4 8h3l2-3h6l2 3h3v11H4zM12 11a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />
        </svg>
        <span className="flex-1">También puedes hacerla desde el botón de la cámara.</span>
      </div>
    </>
  )
}
