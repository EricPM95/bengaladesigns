import { useEffect, useRef, useState } from 'react'
import type { Place } from '../../lib/types'
import { searchPlaces } from '../../lib/mapboxGeocoding'
import { cityCode, countryOf } from './cityCode'
import { AMBER, Cta, Em, Eyebrow, INK, MONO, SERIF, Title } from './trazoUi'
import { RouteSearch, type ConfirmedRoute } from '../destination/RouteSearch'

interface StepRouteProps {
  origin: Place | null
  destination: Place | null
  onOrigin: (place: Place | null) => void
  onDestination: (place: Place | null) => void
  onPanoramic: (route: ConfirmedRoute) => void
  onNext: () => void
}

/**
 * 01 — Ruta: origen y destino con nuestro buscador de siempre (Mapbox, searchPlaces), en el aspecto del
 * prototipo: código de la ciudad, nombre y país. Debajo, la ruta panorámica de siempre.
 */
export function StepRoute({ origin, destination, onOrigin, onDestination, onPanoramic, onNext }: StepRouteProps) {
  const [focus, setFocus] = useState<'o' | 'd' | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [searching, setSearching] = useState(false)
  const [panoramicOpen, setPanoramicOpen] = useState(false)
  const destinationRef = useRef<HTMLInputElement>(null)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const text = query.trim()
    if (!focus || text.length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    const controller = new AbortController()
    setSearching(true)
    const timer = setTimeout(() => {
      searchPlaces(text, controller.signal)
        .then((places) => {
          setResults(places.slice(0, 5))
          setSearching(false)
        })
        .catch(() => setSearching(false))
    }, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, focus])

  const pick = (place: Place) => {
    if (focus === 'o') {
      onOrigin(place)
      setQuery('')
      if (!destination) setTimeout(() => destinationRef.current?.focus(), 30)
      else setFocus(null)
    } else {
      onDestination(place)
      setQuery('')
      setFocus(null)
      destinationRef.current?.blur()
    }
  }

  const onFocus = (which: 'o' | 'd') => {
    if (blurTimer.current) clearTimeout(blurTimer.current)
    setFocus(which)
    setQuery('')
  }
  const onBlur = () => {
    blurTimer.current = setTimeout(() => {
      setFocus(null)
      setQuery('')
    }, 160)
  }

  const showSuggestions = focus !== null && query.trim().length >= 2
  const inputStyle = { background: 'transparent', border: 'none', outline: 'none', color: INK, font: `400 26px/1.1 ${SERIF}`, padding: 0, width: '100%' }

  return (
    <>
      <Eyebrow>01 — Ruta</Eyebrow>
      <Title>
        ¿De dónde sales y <Em>a dónde vas?</Em>
      </Title>
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {showSuggestions && (
          <div
            className="trazo-noscroll"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 10,
              maxHeight: '100%',
              overflow: 'auto',
              background: 'rgba(12,16,26,.9)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              border: '1px solid rgba(243,238,228,.09)',
              borderRadius: 22,
              padding: 8,
              display: 'flex',
              flexDirection: 'column',
              animation: 'trazo-chipIn .35s ease both',
            }}
          >
            <div style={{ padding: '8px 12px 6px', font: `500 10px ${MONO}`, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(243,238,228,.55)' }}>Resultados</div>
            {results.map((place) => (
              <div
                key={`${place.fullName}-${place.coordinates.lat}`}
                className="trazo-hover"
                onPointerDown={(event) => {
                  event.preventDefault()
                  pick(place)
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, minHeight: 48, borderRadius: 14, cursor: 'pointer' }}
              >
                <span style={{ font: `500 12px ${MONO}`, letterSpacing: '.06em', color: AMBER, width: 34 }}>{cityCode(place)}</span>
                <span style={{ font: "400 16px 'Geist'", flex: 1, color: INK }}>{place.name}</span>
                <span style={{ font: "400 12px 'Geist'", color: 'rgba(243,238,228,.55)' }}>{countryOf(place)}</span>
              </div>
            ))}
            {!searching && results.length === 0 && <div style={{ padding: '14px 12px', font: "400 14px 'Geist'", color: 'rgba(243,238,228,.6)' }}>No encontramos esa ciudad todavía.</div>}
            {searching && results.length === 0 && <div style={{ padding: '14px 12px', font: "400 14px 'Geist'", color: 'rgba(243,238,228,.6)' }}>Buscando…</div>}
          </div>
        )}
      </div>
      <div style={{ position: 'relative', background: 'rgba(12,16,26,.74)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(243,238,228,.1)', borderRadius: 24 }}>
        <div style={{ position: 'absolute', left: 23, top: 40, bottom: 40, borderLeft: '1px dashed rgba(243,238,228,.3)' }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 70px 16px 18px', cursor: 'text' }}>
          <span style={{ width: 11, height: 11, borderRadius: '50%', border: `2px solid ${INK}`, flex: 'none', background: '#0A0D14' }} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
            <span style={{ font: `500 10px ${MONO}`, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(243,238,228,.55)' }}>Origen</span>
            <input
              value={focus === 'o' ? query : origin?.name ?? ''}
              placeholder="Ciudad de salida"
              onFocus={() => onFocus('o')}
              onBlur={onBlur}
              onChange={(event) => setQuery(event.target.value)}
              style={inputStyle}
            />
          </span>
        </label>
        <div style={{ height: 1, background: 'rgba(243,238,228,.08)', margin: '0 18px 0 46px' }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 70px 16px 18px', cursor: 'text' }}>
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: AMBER, flex: 'none', boxShadow: '0 0 0 4px rgba(242,181,68,.18)' }} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
            <span style={{ font: `500 10px ${MONO}`, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(243,238,228,.55)' }}>Destino</span>
            <input
              ref={destinationRef}
              value={focus === 'd' ? query : destination?.name ?? ''}
              placeholder="¿A dónde?"
              onFocus={() => onFocus('d')}
              onBlur={onBlur}
              onChange={(event) => setQuery(event.target.value)}
              style={inputStyle}
            />
          </span>
        </label>
        <button
          type="button"
          onClick={() => {
            const o = origin
            onOrigin(destination)
            onDestination(o)
          }}
          aria-label="Intercambiar"
          style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(243,238,228,.14)', background: '#141925', color: INK, fontSize: 18, cursor: 'pointer' }}
        >
          ⇅
        </button>
      </div>
      <Cta onClick={onNext} enabled={Boolean(origin && destination)} style={{ marginTop: 12 }}>
        Trazar ruta
      </Cta>
      <button
        type="button"
        onClick={() => setPanoramicOpen((open) => !open)}
        style={{ marginTop: 10, border: 'none', background: 'transparent', color: 'rgba(243,238,228,.62)', font: "400 13px 'Geist'", textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}
      >
        ¿Buscas una ruta panorámica?
      </button>
      {panoramicOpen && (
        <div style={{ marginTop: 8, padding: 12, borderRadius: 18, background: '#F3EEE4' }}>
          <RouteSearch onConfirm={onPanoramic} defaultOpen />
        </div>
      )}
      {import.meta.env.DEV && (
        <button
          type="button"
          onClick={() => import('../../store/useRouteStore').then(({ useRouteStore }) => useRouteStore.getState().setScreen('devQuickRoute'))}
          style={{ marginTop: 6, border: 'none', background: 'transparent', color: 'rgba(243,238,228,.4)', font: "400 11px 'Geist'", textDecoration: 'underline', cursor: 'pointer' }}
        >
          🧪 Dev: ruta rápida (sin IA)
        </button>
      )}
    </>
  )
}
