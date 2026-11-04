import { useEffect, useRef, useState } from 'react'
import type { DayPlan, Route } from '../../../lib/types'
import { numberedStopsOf } from '../../../lib/stopKind'
import { pagoActivo } from '../../../lib/pago'
import { alCambiarSugerencias, sugerenciasDelCompanero } from '../../../lib/sugerenciasCompanero'
import { useSyncStore } from '../../../store/useSyncStore'
import { FueraDeRuta, yaDijoAhoraNo } from './FueraDeRuta'
import { HojaLlegadaOculta, RetoDelDiaTarjeta, TarjetaBrilla } from './JuegoCerca'
import { useCercaDeAqui, type SitioCerca } from './useCercaDeAqui'

/**
 * LO QUE EL COMPAÑERO TE SUGIERE POR DONDE ESTÁS (Tanda HOY1, apartados 3-fuera de ruta y 5): el reto del día (C18), el juego de los emblemas ocultos (C16, C17 y la pantalla de llegada) y «Estás en… / Estás junto a…» (H8, H8b).
 * Un solo componente para enganchar en HOY con UNA línea: `<AvisosDeCerca route={route} day={day} dateIso={dateIso} />`. No pinta nada si no hay nada que decir.
 * Solo con el pase (o en el día de prueba) y con «Sugerencias del compañero» encendido. Nada cambia el día salvo [Añadir a mi ruta], que lleva [Deshacer].
 */
const claveJuego = (tripId: string, fecha: string, sitio: string, nivel: string) => `trazo:hoy1:juego:${tripId}:${fecha}:${sitio}:${nivel}`
const yaSalio = (tripId: string, fecha: string, sitio: string, nivel: string): boolean => {
  try {
    return window.localStorage.getItem(claveJuego(tripId, fecha, sitio, nivel)) === '1'
  } catch {
    return false
  }
}
const anotarQueSalio = (tripId: string, fecha: string, sitio: string, nivel: string) => {
  try {
    window.localStorage.setItem(claveJuego(tripId, fecha, sitio, nivel), '1')
  } catch {
    /* sin almacenamiento: puede volver a salir */
  }
}

/** «Por la mañana»: antes de las 12 en el móvil (en desarrollo, `window.__hoy1HoraLocal` pone otra hora). */
export function esDeManana(): boolean {
  const falsa = import.meta.env.DEV ? (window as unknown as { __hoy1HoraLocal?: number }).__hoy1HoraLocal : undefined
  return (typeof falsa === 'number' ? falsa : new Date().getHours()) < 12
}

type Mostrando = { nivel: 'brilla' | 'mas_cerca'; sitio: string } | null

export function AvisosDeCerca({ route, day, dateIso }: { route: Route; day: DayPlan; dateIso: string }) {
  const tripId = useSyncStore((s) => s.activeTripId) ?? route.id
  const [sugerencias, setSugerencias] = useState(sugerenciasDelCompanero())
  useEffect(() => alCambiarSugerencias(() => setSugerencias(sugerenciasDelCompanero())), [])
  const activo = pagoActivo() && sugerencias
  const sitiosHoy = numberedStopsOf(day).map((s) => s.name)
  const datos = useCercaDeAqui({ tripId, sitiosHoy, activo })
  const [mostrando, setMostrando] = useState<Mostrando>(null)
  const [llegada, setLlegada] = useState<SitioCerca | null>(null)
  const [cerradas, setCerradas] = useState<Set<string>>(new Set())
  const actual = useRef<Mostrando>(null)

  // El juego, una vez por sitio y por día: cada paso (brilla → más cerca → llegada) sale una sola vez, y si ya no estás cerca, se va.
  useEffect(() => {
    if (!tripId || !datos?.juego || !datos.juego_sitio) {
      actual.current = null
      setMostrando(null)
      return
    }
    const { juego, juego_sitio: sitio } = datos
    if (juego === 'llegada') {
      actual.current = null
      setMostrando(null)
      if (!yaSalio(tripId, dateIso, sitio, 'llegada')) {
        const s = datos.cerca.find((x) => x.sitio === sitio)
        if (s) {
          anotarQueSalio(tripId, dateIso, sitio, 'llegada')
          setLlegada(s)
        }
      }
      return
    }
    // (Sin efectos dentro de `setMostrando`: en desarrollo React lo ejecuta dos veces y la segunda ya vería el sitio como «enseñado».)
    if (actual.current?.nivel === juego && actual.current.sitio === sitio) return
    if (yaSalio(tripId, dateIso, sitio, juego)) {
      actual.current = null
      setMostrando(null)
      return
    }
    anotarQueSalio(tripId, dateIso, sitio, juego)
    actual.current = { nivel: juego, sitio }
    setMostrando(actual.current)
  }, [datos?.juego, datos?.juego_sitio, tripId, dateIso, datos?.cerca])

  if (!activo || !tripId || !datos) return null
  const fuera = datos.fuera_de_ruta ? datos.cerca.find((s) => s.sitio === datos.fuera_de_ruta) : null
  const junto = !fuera && datos.junto_a && !yaDijoAhoraNo(tripId, dateIso, datos.junto_a) ? datos.cerca.find((s) => s.sitio === datos.junto_a) : null
  const tarjetaFuera = fuera ?? junto ?? null
  const cerrar = (clave: string) => setCerradas((a) => new Set(a).add(clave))
  return (
    <>
      {datos.reto && esDeManana() && <RetoDelDiaTarjeta reto={datos.reto} />}
      {mostrando && <TarjetaBrilla nivel={mostrando.nivel} onAhoraNo={() => { actual.current = null; setMostrando(null) }} />}
      {tarjetaFuera && !cerradas.has(tarjetaFuera.sitio) && <FueraDeRuta sitio={tarjetaFuera} tipo={fuera ? 'fuera' : 'junto'} route={route} day={day} tripId={tripId} fecha={dateIso} onCerrar={() => cerrar(tarjetaFuera.sitio)} />}
      {llegada && <HojaLlegadaOculta sitio={llegada} onCerrar={() => setLlegada(null)} />}
    </>
  )
}
