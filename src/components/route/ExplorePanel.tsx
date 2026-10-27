import { useEffect, useState } from 'react'
import type { Excursion, Route, Stop } from '../../lib/types'
import { isOsmPoint, type DestinationPlace } from '../../lib/destinationPlacesApi'
import { buildDestinationSegments } from '../../lib/destinationSegments'
import type { StopsMapMarker } from '../map/StopsMapView'
import type { NearbyPlaceResult } from '../../lib/nearbyPlacesSearch'
import { AttractionsFinder } from './attractionsFinder/AttractionsFinder'
import { DayPositionPicker } from './dayDetail/DayPositionPicker'
import { NearbyPlacesView, toMarker } from './explore/NearbyPlacesView'
import { PlaceExplorerScreen } from './placeExplorer/PlaceExplorerScreen'
import { AddToDaySheet, type AddItem } from './freeDay/AddToDaySheet'
import { confirmAddedStaying } from './freeDay/AddToTripScreen'
import { useDestinationPool } from '../../lib/useDestinationPool'
import { useAlojamientoUi } from '../../store/useAlojamientoUi'
import { usePuedeCambiarLaRuta } from '../../hooks/usePuedeCambiarLaRuta'
import { EspacioParaElLapiz } from '../propuesta/BotonDePropuesta'
import { FreeTourSheet, freeTourAvailable } from './reservas/FreeTourSheet'
import { categoriesForFilters } from '../../lib/placeCategories'
import { fetchPlacePhoto } from '../../lib/placePhoto'
import { CARD_STYLE, EXPLORE_ICONOS, solidOf, type ExploreCardId, type TarjetaDeExplorar } from '../../lib/exploreStyle'
import { Icono } from '../ui/Icono'
import { usePasePintable } from '../../lib/pago'
import { abrirAvisoPase } from '../../lib/avisoPase'
import { AZUL_PASE, ORO_PASE, SOMBRA_PASE, CandadoDeDesign } from '../pase/Candado'
import type { Coordinates } from '../../lib/types'
import { useExploreAperturaStore } from '../../store/useExploreAperturaStore'

interface ExplorePanelProps {
  route: Route
  /** Ciudad del día activo — punto de partida por defecto al entrar desde DIAS ("pestaña global del día activo"). */
  defaultCity: string
  /** El mapa compartido de RouteView.tsx (mismo mapa+tirador+botón de colapsar que DIAS) — mientras "Comer y beber"/"Miradores y fotos" está activo, sus resultados sustituyen a las paradas del día en ese mapa; null lo devuelve a mostrar el día activo. */
  onMarkersChange: (markers: StopsMapMarker[] | null) => void
  activeResultId: string | null
  onSelectResultId: (id: string | null) => void
  /** true mientras la pantalla de lugares (con su propio mapa) está abierta a pantalla completa — RouteView desmonta el mapa compartido mientras tanto (ver exploreFullScreen ahí). */
  onFullScreenChange: (open: boolean) => void
}

/**
 * Las tarjetas de EXPLORAR. Todas abren la pantalla de lugares con su filtro ya puesto — el mismo componente
 * y el mismo catálogo que el "+" de DIAS, para que el viajero vea exactamente los mismos sitios busque desde
 * donde busque. Los hoteles no son una tarjeta (3-oct-2026): el botón «Hoteles» de la fila de filtros abre el mapa de alojamientos (Tanda 6z). Baños y Fuentes solo salen si el destino
 * tiene su descarga de OpenStreetMap.
 */
const EXPLORE_CARDS: { id: TarjetaDeExplorar; label: string }[] = [
  { id: 'atracciones', label: 'Atracciones' },
  { id: 'miradores', label: 'Miradores' },
  { id: 'restaurantes', label: 'Restaurantes' },
  { id: 'entradas', label: 'Entradas' },
  { id: 'excursiones', label: 'Excursiones' },
  // Tanda 10O: «Hoteles» vuelve a la pantalla, antes de Baños y Fuentes; abre el mapa de alojamientos (para todos, con pase y sin pase).
  { id: 'hoteles', label: 'Hoteles' },
  // Nueva (3-oct-2026): los baños públicos de OpenStreetMap, solo si el destino los tiene descargados.
  { id: 'banos', label: 'Baños' },
  { id: 'fuentes', label: 'Fuentes' },
]

/**
 * Destinos SIN catálogo curado: ahí no hay lugares que filtrar, así que las tarjetas siguen cayendo
 * en los buscadores de siempre (Mapbox para comer y miradores, AttractionsFinder para atracciones).
 * Las tarjetas que no tienen equivalente sin catálogo (entradas, excursiones) no se pintan.
 */
const LEGACY_FALLBACK: Partial<Record<TarjetaDeExplorar, 'food' | 'viewpoints' | 'attractions'>> = {
  restaurantes: 'food',
  miradores: 'viewpoints',
  atracciones: 'attractions',
}

/**
 * Una tarjeta de Explorar (diseño «Trazo Reservas», pantalla 12): el cuadro de icono de color, la franja en diagonal con la foto o el degradado,
 * el nombre en Instrument Serif y el contador pequeño.
 */
function ExploreCard({ id, label, sub, photo, delay, wide, onClick, cerrado = false }: { id: TarjetaDeExplorar; label: string; sub: string; photo: string | null; delay: number; wide: boolean; onClick: () => void; cerrado?: boolean }) {
  const style = CARD_STYLE[id]
  const diagonal = 'polygon(34px 0,100% 0,100% 100%,0 100%)'
  const background = photo ? `url("${photo}") center/cover, ${solidOf(style.color)}` : `linear-gradient(135deg,${solidOf(style.shadow)},#EFE7D8)`
  const inner = (
    <>
      <span aria-hidden="true" className="absolute bottom-0 right-0 top-0" style={{ width: '58%', clipPath: diagonal, background }} />
      <span aria-hidden="true" className="absolute bottom-0 right-0 top-0" style={{ width: '58%', clipPath: diagonal, background: 'linear-gradient(90deg,rgb(var(--bg-card) / .55),rgb(var(--bg-card) / 0) 45%)' }} />
      <span
        aria-hidden="true"
        className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center text-white"
        style={{ borderRadius: 12, background: style.color, boxShadow: `0 6px 14px -6px ${style.shadow}` }}
      >
        <Icono nombre={EXPLORE_ICONOS[style.icon]} size={19} />
      </span>
      <span className="absolute bottom-3 left-3 right-3 flex flex-col gap-[3px]">
        <span className="font-display text-text" style={{ fontSize: 21, lineHeight: 1, textShadow: '0 0 12px rgb(var(--bg-card)),0 0 4px rgb(var(--bg-card))' }}>
          {label}
        </span>
        {sub && (
          <span
            className="self-start rounded-md bg-bg-card py-0.5 pl-0 pr-1.5"
            style={{ font: "500 11px 'Geist Mono',monospace", color: 'rgb(var(--text) / .65)' }}
          >
            {sub}
          </span>
        )}
      </span>
    </>
  )
  const className = `${wide ? 'col-span-2 ' : ''}relative block h-[132px] overflow-hidden rounded-[20px] border border-text/[0.08] bg-bg-card p-0 text-left text-text transition-transform active:scale-[.98]`
  const cardStyle = { boxShadow: '0 1px 2px rgba(28,34,48,.05),0 10px 24px -18px rgba(28,34,48,.35)', animation: `explore-pop .45s cubic-bezier(.2,.8,.2,1) ${delay}ms both` } as const
  // (Tanda 10G: lo del pase, cerrado y a la vista: la tarjeta en gris, con el candado dorado sobre marfil y lo que se ganaría; al tocarla se abre el pase.)
  // (Tanda 10N5 §6b: lo pequeño bloqueado por el pase, en azul oscuro con el candado dorado —los colores de la caja de `Pase Estilo` 01—, solo con el nombre y el candado.)
  if (cerrado) {
    return (
      <button type="button" onClick={() => abrirAvisoPase(id === 'banos' || id === 'fuentes' ? id : 'generico')} data-candado={`explorar-${id}`} data-bloqueado-pase="1" className={className} style={{ ...cardStyle, background: AZUL_PASE, boxShadow: SOMBRA_PASE, border: 'none' }}>
        <span className="absolute bottom-3 left-4 right-4 flex flex-col gap-[3px]">
          <span className="font-display" style={{ fontSize: 21, lineHeight: 1, color: '#FBF3E2' }}>
            {label}
          </span>
        </span>
        <span aria-hidden="true" className="absolute right-3 top-3 flex h-[30px] w-[30px] items-center justify-center rounded-full" style={{ background: ORO_PASE }}>
          <CandadoDeDesign size={15} />
        </span>
      </button>
    )
  }
  return (
    <button type="button" onClick={onClick} className={className} style={cardStyle}>
      {inner}
    </button>
  )
}

/** La foto de cada tarjeta: la de un lugar representativo del propio catálogo del destino (el de menor nivel de la categoría), con el mismo servicio de fotos de siempre. */
function useCardPhotos(city: string, pool: DestinationPlace[], excursions: Excursion[]): Partial<Record<TarjetaDeExplorar, string>> {
  const [photos, setPhotos] = useState<Partial<Record<TarjetaDeExplorar, string>>>({})
  const poolKey = pool.length
  useEffect(() => {
    let cancelled = false
    const best = (filter: (place: DestinationPlace) => boolean) => pool.filter((place) => place.kind === 'place' && filter(place)).sort((a, b) => (a.level ?? 9) - (b.level ?? 9))[0] ?? null
    const pick: [TarjetaDeExplorar, string | null, string | null | undefined][] = []
    const attractionCategories: (string | null)[] = categoriesForFilters(['atracciones'])
    const attraction = best((place) => attractionCategories.includes(place.filter_category))
    const viewpoint = best((place) => place.filter_category === 'miradores')
    const ticketed = best((place) => place.requires_ticket && place.name !== attraction?.name)
    pick.push(['atracciones', attraction?.name ?? null, attraction?.wikipedia_title], ['miradores', viewpoint?.name ?? null, viewpoint?.wikipedia_title], ['entradas', ticketed?.name ?? null, ticketed?.wikipedia_title])
    // Restaurantes, baños y fuentes no tienen un monumento que fotografiar: una foto del artículo de Wikipedia de lo que son.
    pick.push(['restaurantes', 'Trattoria', 'Trattoria'], ['banos', 'Baños públicos', 'es:Baño público'], ['fuentes', 'Nasoni de Roma', 'en:Nasone'])
    pick.push(['excursiones', excursions[0]?.photoName ?? excursions[0]?.title ?? null, null])
    // Tanda 10O: la tarjeta de Hoteles lleva una foto de un hotel de la ciudad, con el mismo servicio de fotos de siempre.
    pick.push(['hoteles', 'Hotel Eden', 'en:Hotel Eden'])
    for (const [id, name, wiki] of pick) {
      if (!name) continue
      fetchPlacePhoto(name, city, wiki).then((url) => {
        if (!cancelled && url) setPhotos((prev) => (prev[id] === url ? prev : { ...prev, [id]: url }))
      })
    }
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, poolKey, excursions.length])
  return photos
}

/**
 * Pestaña EXPLORAR — seis tarjetas en rejilla de dos columnas, cada una con su contador real (no
 * hay número inventado: sale del catálogo del destino que ya está cargado). Sin catálogo curado se
 * cae a los buscadores de siempre y la rejilla se queda en las tres tarjetas que sí saben qué hacer.
 */
export function ExplorePanel({ route, defaultCity, onMarkersChange, activeResultId, onSelectResultId, onFullScreenChange }: ExplorePanelProps) {
  const cities = [...new Set(buildDestinationSegments(route.days).map((segment) => segment.city))]
  const [city, setCity] = useState(cities.includes(defaultCity) ? defaultCity : (cities[0] ?? defaultCity))
  const [activeCard, setActiveCard] = useState<ExploreCardId | null>(null)
  const [pendingStop, setPendingStop] = useState<Stop | null>(null)
  const [results, setResults] = useState<NearbyPlaceResult[] | null>(null)
  /** "+ Añadir" desde Explorar (decisión del usuario, 2026-09-28): la ventana pregunta a qué día. */
  const [addItem, setAddItem] = useState<AddItem | null>(null)
  // Tanda 10N: quien solo recomienda añade directamente (el cambio va a su propuesta); durante el viaje ya no puede añadir.
  const { puede: puedeCambiar } = usePuedeCambiarLaRuta()
  const alAnadir = <T,>(abrir: (x: T) => void) => (puedeCambiar ? abrir : undefined) as (x: T) => void
  const [freeTourOpen, setFreeTourOpen] = useState(false)
  /** Desde dónde se ordena por cercanía cuando EXPLORAR se abre desde HOY («Cerca de ti»). */
  const [origenApertura, setOrigenApertura] = useState<Coordinates | null>(null)
  /** EXPLORAR se abre directamente en «Cerca de mí» (la tarjeta «Hoy vuelves a casa», Tanda 7). */
  const [aperturaCerca, setAperturaCerca] = useState(false)
  // (Tanda 10N5 §0.2) Mientras no se sabe si hay pase, Baños y Fuentes no se pintan (ni cerradas ni abiertas); al llegar la respuesta se repintan solas.
  const estadoPase = usePasePintable()
  const banosYFuentes = estadoPase === 'con'
  // «Cerca de ti» de HOY deja aquí lo que pide (filtro + punto de partida): se lee y se vacía al abrir.
  const pedido = useExploreAperturaStore((state) => state.pedido)
  useEffect(() => {
    if (!pedido) return
    const apertura = useExploreAperturaStore.getState().tomar()
    if (!apertura) return
    if ((apertura.categoria === 'banos' || apertura.categoria === 'fuentes') && !banosYFuentes) return
    setOrigenApertura(apertura.origen)
    setAperturaCerca(Boolean(apertura.cerca))
    setActiveCard(apertura.categoria)
  }, [pedido, banosYFuentes])

  // El catálogo se pide al entrar en la pestaña, no al pulsar una tarjeta: los contadores salen de
  // él y tienen que estar ya en la rejilla. Es una sola petición por destino y sesión (se cachea).
  const { places: curatedPool, excursions, resolved: curatedPoolResolved } = useDestinationPool(city, true)
  const hasCuratedCatalog = curatedPoolResolved && curatedPool.length > 0
  // (Tanda 10G: Baños y Fuentes salen siempre que el destino los tenga; sin el pase, cerradas y con su candado.)
  const hasToilets = curatedPool.some((place) => place.kind === 'toilet')
  const hasFountains = curatedPool.some((place) => place.kind === 'fountain')
  const cardPhotos = useCardPhotos(city, curatedPool, excursions)
  const legacyCategory = activeCard ? LEGACY_FALLBACK[activeCard] : undefined

  // Solo los buscadores viejos publican marcadores hacia el mapa compartido — al salir de esa
  // categoría el mapa vuelve a mostrar el día activo, como siempre.
  useEffect(() => {
    if (hasCuratedCatalog || (legacyCategory !== 'food' && legacyCategory !== 'viewpoints')) {
      onMarkersChange(null)
      return
    }
    onMarkersChange(results ? results.map(toMarker) : [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legacyCategory, hasCuratedCatalog, results])

  useEffect(() => {
    // Al desmontar EXPLORAR entero (cambio de pestaña), devuelve el mapa compartido a su estado normal.
    return () => onMarkersChange(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const placeExplorerOpen = activeCard !== null && hasCuratedCatalog

  // Avisa a RouteView de que hay una pantalla con mapa propio encima, para que desmonte el mapa
  // compartido mientras tanto (ver exploreFullScreen ahí).
  useEffect(() => {
    onFullScreenChange(placeExplorerOpen)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeExplorerOpen])

  useEffect(() => {
    return () => onFullScreenChange(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const backToCards = () => {
    setActiveCard(null)
    setOrigenApertura(null)
    setAperturaCerca(false)
    setResults(null)
    onSelectResultId(null)
  }

  /** Cuántos elementos hay detrás de cada tarjeta. */
  const countFor = (id: TarjetaDeExplorar): number | null => {
    if (id === 'hoteles') return null
    if (id === 'excursiones') return excursions.length
    // (Tanda 10O: lo que está fuera de la lista de EXPLORAR tampoco cuenta.)
    if (id === 'entradas') return curatedPool.filter((place) => place.requires_ticket && !isOsmPoint(place) && !place.fuera_de_lista).length
    const categories = categoriesForFilters([id])
    return curatedPool.filter((place) => place.filter_category !== null && categories.includes(place.filter_category) && !place.fuera_de_lista).length
  }

  const countLabel = (id: TarjetaDeExplorar): string => {
    if (id === 'hoteles') return 'Dónde dormir'
    const count = countFor(id)
    if (count === null) return ''
    if (id === 'excursiones') return `${count} ${count === 1 ? 'opción' : 'opciones'}`
    if (id === 'entradas') return `${count} con entrada`
    if (id === 'restaurantes') return `${count} ${count === 1 ? 'sitio' : 'sitios'}`
    if (id === 'fuentes') return `${count} ${count === 1 ? 'fuente' : 'fuentes'}`
    if (id === 'banos') return `${count} ${count === 1 ? 'baño' : 'baños'}`
    return `${count} ${count === 1 ? 'lugar' : 'lugares'}`
  }

  // Destino curado: las tarjetas abren la pantalla compartida de lugares, con "+ Añadir" en cada sitio
  // (decisión del usuario, 2026-09-28): la ventana pregunta a qué día va. Los destinos sin catálogo
  // siguen con la búsqueda de Mapbox de siempre.
  if (placeExplorerOpen && activeCard) {
    return (
      <>
      <PlaceExplorerScreen
        open
        destination={city}
        places={curatedPool}
        toiletsEnabled={banosYFuentes}
        excursions={excursions}
        title={`Explorar ${city}`}
        subtitle={EXPLORE_CARDS.find((card) => card.id === activeCard)?.label ?? null}
        route={route}
        initialFilters={[activeCard]}
        initialOrigin={origenApertura}
        initialNearby={aperturaCerca}
        onHotels={() => useAlojamientoUi.getState().abrirMapa()}
        onAddFreeTour={freeTourAvailable(route) ? alAnadir<void>(() => setFreeTourOpen(true)) : undefined}
        onQuickAdd={alAnadir((place: DestinationPlace) => setAddItem({ kind: 'place', place }))}
        onQuickAddExcursion={alAnadir((excursion: Excursion) => setAddItem({ kind: 'excursion', excursion }))}
        onClose={backToCards}
      />
      {freeTourOpen && <FreeTourSheet route={route} onClose={() => setFreeTourOpen(false)} />}
      {addItem && (
        <AddToDaySheet
          route={route}
          item={addItem}
          initialDayId={null}
          onClose={() => setAddItem(null)}
          onAdded={(result) => {
            confirmAddedStaying(result)
            setAddItem(null)
          }}
        />
      )}
      </>
    )
  }

  // Aún no se sabe si esta ciudad tiene catálogo — un render sin nada antes que enseñar el buscador
  // viejo medio segundo y cambiarlo por la pantalla nueva.
  if (activeCard !== null && !curatedPoolResolved) return null

  if (!hasCuratedCatalog && (legacyCategory === 'food' || legacyCategory === 'viewpoints')) {
    return (
      <NearbyPlacesView
        city={city}
        categoryLabel={legacyCategory === 'food' ? 'Comer y beber' : 'Miradores y fotos'}
        categoryIds={legacyCategory === 'food' ? ['restaurant', 'cafe'] : ['viewpoint']}
        onBack={backToCards}
        results={results}
        onResultsChange={setResults}
        activeId={activeResultId}
        onSelectId={onSelectResultId}
      />
    )
  }

  const visibleCards = hasCuratedCatalog
    ? EXPLORE_CARDS.filter((card) => (card.id !== 'excursiones' || excursions.length > 0) && (card.id !== 'banos' || (hasToilets && estadoPase !== 'pendiente')) && (card.id !== 'fuentes' || (hasFountains && estadoPase !== 'pendiente')))
    : EXPLORE_CARDS.filter((card) => LEGACY_FALLBACK[card.id] !== undefined)

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-3.5 pb-6">
      {cities.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {cities.map((candidate) => (
            <button
              key={candidate}
              type="button"
              onClick={() => setCity(candidate)}
              className={`rounded-full px-3 py-1.5 text-caption font-semibold transition-colors ${
                candidate === city ? 'bg-text text-bg' : 'bg-bg-hover text-text-soft hover:bg-border'
              }`}
            >
              {candidate}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        {visibleCards.map((card, index) => {
          const label = hasCuratedCatalog ? countLabel(card.id) : 'Buscar'
          return (
            <ExploreCard
              key={card.id}
              id={card.id}
              label={card.label}
              sub={label}
              photo={cardPhotos[card.id] ?? null}
              delay={index * 40}
              wide={false}
              cerrado={(card.id === 'banos' || card.id === 'fuentes') && !banosYFuentes}
              onClick={() => (card.id === 'hoteles' ? useAlojamientoUi.getState().abrirMapa() : setActiveCard(card.id))}
            />
          )
        })}
      </div>

      {!hasCuratedCatalog && legacyCategory === 'attractions' && (
        <AttractionsFinder
          route={route}
          city={city}
          open
          title={`Atracciones en ${city}`}
          onPick={setPendingStop}
          onClose={backToCards}
        />
      )}

      <EspacioParaElLapiz />

      <DayPositionPicker route={route} stop={pendingStop} onClose={() => setPendingStop(null)} onInserted={() => setPendingStop(null)} />
    </div>
  )
}
