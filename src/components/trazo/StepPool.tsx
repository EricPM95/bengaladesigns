import { useEffect, useState } from 'react'
import type { ExperienceId } from '../../lib/types'
import type { PoolPlace } from '../../lib/placePoolCache'
import { fetchPlacePhoto } from '../../lib/placePhoto'
import { suggestPlacesOnDemand } from '../../lib/suggestPlacesOnDemand'
import { useRouteStore } from '../../store/useRouteStore'
import { poolSelectionLimit } from '../questionnaire/CuratedPlacesPool'
import { AMBER, Cta, DARK, Em, INK, MONO, SERIF, Title } from './trazoUi'

interface Tile {
  key: string
  name: string
  tag: string
}

interface StepPoolProps {
  destinationName: string
  days: number | undefined
  /** Pool curado del JSON (cero coste); `false` = destino no curado; `null` = todavía no se sabe. */
  curatedPool: PoolPlace[] | null | false
  experiences: ExperienceId[]
  onNext: () => void
}

/**
 * 07 — Pool: los lugares del destino con NUESTRAS fotos, en las baldosas del prototipo. Lo marcado entra
 * seguro en la ruta (must_include_places). Tope por duración (poolSelectionLimit: 5 hasta 2 días, 7 de
 * 3 a 5, 10 desde 6) con contador visible; sin "Añadir todos". Destino curado: pool del JSON; no curado:
 * lo que sugiere /api/suggest-places, como siempre.
 */
export function StepPool({ destinationName, days, curatedPool, experiences, onNext }: StepPoolProps) {
  const curatedNames = useRouteStore((state) => state.selected_curated_place_names)
  const toggleCurated = useRouteStore((state) => state.toggleCuratedPlaceSelection)
  const suggested = useRouteStore((state) => state.suggested_places)
  const suggestedLoading = useRouteStore((state) => state.suggested_places_loading)
  const suggestedFailed = useRouteStore((state) => state.suggested_places_failed)
  const selectedIds = useRouteStore((state) => state.selected_place_ids)
  const toggleSuggested = useRouteStore((state) => state.toggleSelectedPlace)

  const curated = Array.isArray(curatedPool)
  // Red de seguridad para destinos no curados (idempotente: no repite si las experiencias no cambian).
  useEffect(() => {
    if (curatedPool === false) suggestPlacesOnDemand(destinationName, experiences)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curatedPool, destinationName])

  const tiles: Tile[] = curated
    ? curatedPool.map((place) => ({
        key: place.name,
        name: place.name,
        tag: [place.category, place.duration_min ? `~${place.duration_min} min` : null].filter(Boolean).join(' · '),
      }))
    : suggested.map((place) => ({ key: place.id, name: place.name, tag: place.isMainAttraction ? 'Imprescindible' : '' }))
  const selected = curated ? curatedNames : selectedIds
  const toggle = curated ? toggleCurated : toggleSuggested
  const limit = poolSelectionLimit(days)
  const atLimit = selected.length >= limit

  const [photos, setPhotos] = useState<Record<string, string>>({})
  const namesKey = tiles.map((tile) => tile.name).join('|')
  useEffect(() => {
    let alive = true
    for (const tile of tiles) {
      if (photos[tile.name]) continue
      fetchPlacePhoto(tile.name, destinationName).then((url) => {
        if (alive && url) setPhotos((prev) => ({ ...prev, [tile.name]: url }))
      })
    }
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namesKey, destinationName])

  const nameOf = (key: string) => tiles.find((tile) => tile.key === key)?.name ?? key
  const trayLabel = selected.length ? `${selected.length} ${selected.length === 1 ? 'lugar elegido' : 'lugares elegidos'} de ${limit}` : 'Toca para añadir a tu pool'
  const waiting = curatedPool === null || (!curated && suggested.length === 0 && suggestedLoading)
  // Curado: siempre se puede crear, marque o no. No curado: basta con que haya algún lugar donde elegir.
  const canCreate = curated || (curatedPool === false && (suggested.length > 0 || !(suggestedLoading || suggestedFailed)))

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ font: `500 11px/1 ${MONO}`, letterSpacing: '.14em', color: AMBER, textTransform: 'uppercase' }}>07 — Lugares</span>
        <span
          style={{
            font: `600 11px ${MONO}`,
            letterSpacing: '.08em',
            padding: '5px 10px',
            borderRadius: 999,
            background: atLimit ? AMBER : 'rgba(243,238,228,.08)',
            color: atLimit ? DARK : 'rgba(243,238,228,.75)',
            transition: 'background .3s,color .3s',
          }}
        >
          {selected.length}/{limit}
        </span>
      </div>
      <Title size={42}>
        Arma tu pool de <Em>{destinationName}</Em>
      </Title>
      <p style={{ margin: '10px 0 0', font: "400 14px/1.4 'Geist'", color: 'rgba(243,238,228,.72)' }}>
        {atLimit ? 'Ya tienes tu lista: estos entran seguro en tu ruta.' : 'Marca los que te apetezcan: esos entran seguro, el resto lo elegimos nosotros.'}
      </p>
      <div className="trazo-noscroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', margin: '14px 0 8px' }}>
        {waiting && <p style={{ font: "400 14px 'Geist'", color: 'rgba(243,238,228,.65)' }}>Viendo qué lugares hay en {destinationName}…</p>}
        {!curated && !waiting && suggested.length === 0 && suggestedFailed && (
          <p style={{ font: "400 14px 'Geist'", color: 'rgba(243,238,228,.65)' }}>
            No pudimos cargar los lugares.{' '}
            <button type="button" onClick={() => suggestPlacesOnDemand(destinationName, experiences)} style={{ border: 'none', background: 'transparent', color: AMBER, textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}>
              Reintentar
            </button>
          </p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: 132, gap: 8 }}>
          {tiles.map((tile) => {
            const index = selected.indexOf(tile.key)
            const active = index >= 0
            const disabled = atLimit && !active
            const photo = photos[tile.name]
            return (
              <button
                key={tile.key}
                type="button"
                disabled={disabled}
                aria-pressed={active}
                onClick={() => toggle(tile.key)}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 20,
                  border: `1px solid ${active ? AMBER : 'rgba(243,238,228,.1)'}`,
                  background: 'rgba(10,13,20,.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '12px 13px',
                  textAlign: 'left',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  color: INK,
                  opacity: disabled ? 0.4 : 1,
                  transform: active ? 'scale(1)' : 'scale(.985)',
                  transition: 'border-color .35s,transform .35s cubic-bezier(.3,1.6,.5,1),opacity .3s',
                }}
              >
                {photo && <img src={photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: disabled ? 'grayscale(1)' : 'none' }} />}
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: active ? 'linear-gradient(180deg,rgba(242,181,68,.28),rgba(10,13,20,.88))' : 'linear-gradient(180deg,rgba(10,13,20,.15),rgba(10,13,20,.85))',
                    transition: 'background .35s',
                  }}
                />
                <span style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end' }}>
                  <span
                    style={{
                      minWidth: 24,
                      height: 24,
                      borderRadius: 12,
                      padding: '0 7px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      font: `600 11px ${MONO}`,
                      background: active ? AMBER : 'rgba(10,13,20,.35)',
                      border: active ? 'none' : '1.5px solid rgba(243,238,228,.8)',
                      color: DARK,
                      transition: 'background .3s',
                    }}
                  >
                    {active ? index + 1 : ''}
                  </span>
                </span>
                <span style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ font: `400 19px/1.05 ${SERIF}`, textWrap: 'balance', textShadow: '0 1px 8px rgba(0,0,0,.5)' }}>{tile.name}</span>
                  {tile.tag && <span style={{ font: `500 9.5px ${MONO}`, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(243,238,228,.72)' }}>{tile.tag}</span>}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div style={{ height: 48, flex: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '0 6px 0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {selected.map((key, i) => (
            <span
              key={key}
              title={nameOf(key)}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                marginLeft: i ? -10 : 0,
                background: photos[nameOf(key)] ? `center/cover url("${photos[nameOf(key)]}")` : AMBER,
                border: `2px solid ${AMBER}`,
                animation: 'trazo-chipIn .45s cubic-bezier(.2,.8,.2,1) both',
              }}
            />
          ))}
        </div>
        <span style={{ font: "400 13px 'Geist'", color: 'rgba(243,238,228,.75)' }}>{trayLabel}</span>
      </div>
      <Cta onClick={onNext} enabled={canCreate}>
        {canCreate ? 'Crear mi ruta' : 'Cargando lugares…'}
      </Cta>
    </>
  )
}
