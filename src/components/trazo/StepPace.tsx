import { useMemo } from 'react'
import type { TripPace } from '../../lib/types'
import type { PaceTexts } from '../../lib/destinationTextsApi'
import { AMBER, Cta, Em, INK, MONO, SERIF, Title } from './trazoUi'

interface StepPaceProps {
  pace: TripPace | undefined
  texts: PaceTexts | null
  onPick: (pace: TripPace) => void
  onNext: () => void
}

const hourOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h + (m || 0) / 60
}
/** El eje del gráfico: de 08h a 24h. */
const AXIS_START = 8
const AXIS_SPAN = 16
/** Hasta dónde llegan las paradas del día (luego se cena) y la comida en medio. */
const DAY_END = 20
const LUNCH: [number, number] = [13, 14.5]

/** Los bloques del gráfico: tantas paradas como la media del motor, desde la hora de inicio de ese ritmo, con la comida en medio. */
function dayBlocks(stops: number, startHour: number): [number, number][] {
  const morning = Math.max(0, LUNCH[0] - startHour)
  const afternoon = DAY_END - LUNCH[1]
  const total = morning + afternoon
  const nMorning = Math.max(1, Math.round((stops * morning) / total))
  const nAfternoon = Math.max(1, stops - nMorning)
  const spread = (from: number, to: number, n: number): [number, number][] => {
    const slot = (to - from) / n
    return Array.from({ length: n }, (_, i) => [from + i * slot, slot * 0.78])
  }
  return [...spread(startHour, LUNCH[0], nMorning), [LUNCH[0], LUNCH[1] - LUNCH[0]], ...spread(LUNCH[1], DAY_END, nAfternoon)]
}

/**
 * 05 — Ritmo: "Completo" (Recomendado) y "Tranquilo". Textos del destino (destinationTextsApi) y "≈ N
 * planes al día" con la media real del motor para todos los viajes con ese ritmo (pace_stats). La barra
 * de horas empieza a la hora real de cada ritmo: la de la primera parada, medida con el motor (pace_stats.inicio); si
 * no todos los días empiezan igual, el texto da el rango (PROMPT_TEXTOS_RITMO).
 */
export function StepPace({ pace, texts, onPick, onNext }: StepPaceProps) {
  const open: TripPace = pace ?? 'nonstop'
  const cards = useMemo(
    () => [
      { value: 'nonstop' as TripPace, name: 'Completo', rec: true, text: texts?.completo ?? '', stat: texts?.stats.completo ?? { media: 9, inicio: '08:00' }, bg: AMBER, fg: '#17120a' },
      { value: 'zen' as TripPace, name: 'Tranquilo', rec: false, text: texts?.tranquilo ?? '', stat: texts?.stats.tranquilo ?? { media: 6, inicio: '10:00' }, bg: 'oklch(0.3 0.045 200)', fg: INK },
    ],
    [texts],
  )
  const pc = (h: number) => `${((h - AXIS_START) / AXIS_SPAN) * 100}%`

  return (
    <>
      <div style={{ font: `500 11px/1 ${MONO}`, letterSpacing: '.14em', color: AMBER, textTransform: 'uppercase' }}>05 — Ritmo</div>
      <Title>
        ¿Qué <Em>ritmo</Em> quieres?
      </Title>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10, margin: '22px 0 12px' }}>
        {cards.map((card) => {
          const active = open === card.value
          const stops = Math.round(card.stat.media)
          const start = hourOf(card.stat.inicio)
          const blocks = dayBlocks(stops, start)
          const measured = Boolean((card.stat as { medido?: boolean }).medido)
          return (
            <button
              key={card.value}
              type="button"
              onClick={() => onPick(card.value)}
              style={{
                flex: active ? 2.3 : 1,
                minHeight: 0,
                transition: 'flex .8s cubic-bezier(.2,.8,.2,1),box-shadow .3s',
                borderRadius: 26,
                border: 'none',
                boxShadow: active ? `0 0 0 2px #0D1A2E,0 0 0 4px ${card.value === 'nonstop' ? AMBER : INK}` : 'none',
                background: card.bg,
                color: card.fg,
                padding: 20,
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ font: `400 40px/1 ${SERIF}` }}>{card.name}</span>
                  {card.rec && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        height: 24,
                        padding: '0 10px',
                        borderRadius: 999,
                        background: '#17120a',
                        color: AMBER,
                        font: `600 10px ${MONO}`,
                        letterSpacing: '.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      ★ {texts?.recomendado ?? 'Recomendado'}
                    </span>
                  )}
                </span>
                <span style={{ font: `500 10px ${MONO}`, letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.8, whiteSpace: 'nowrap' }}>≈ {stops} planes al día</span>
              </div>
              {/* Plegada: el texto en dos líneas con "…", nunca cortado a media línea. */}
              <div
                style={{
                  position: 'relative',
                  marginTop: 6,
                  font: "400 14px/1.4 'Geist'",
                  opacity: 0.85,
                  ...(active ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }),
                }}
              >
                {card.text}
              </div>
              <div style={{ position: 'relative', marginTop: 'auto', paddingTop: 14, display: active ? 'flex' : 'none', flexDirection: 'column', gap: 8, animation: 'trazo-chipIn .5s ease both' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', justifyContent: 'space-between', font: `500 10px ${MONO}`, letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.75 }}>
                  {/* Sin medición del motor para ese destino, ninguna hora (regla 391): ni el texto ni la marca de inicio. */}
                  {measured && (
                    <span>
                      {card.stat.inicio_desde && card.stat.inicio_hasta
                        ? `El día empieza entre las ${card.stat.inicio_desde} y las ${card.stat.inicio_hasta}`
                        : `El día empieza a las ${card.stat.inicio}`}
                    </span>
                  )}
                  <span>Comida y cena incluidas</span>
                </div>
                <div style={{ position: 'relative', height: active ? 46 : 26, transition: 'height .7s cubic-bezier(.2,.8,.2,1)' }}>
                  <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '1px dashed currentColor', opacity: 0.35 }} />
                  {measured && <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: pc(start), borderRadius: 8, background: 'repeating-linear-gradient(135deg,currentColor 0 1px,transparent 1px 6px)', opacity: 0.18 }} />}
                  {measured && <span style={{ position: 'absolute', top: -6, bottom: -6, left: pc(start), borderLeft: '1.5px solid currentColor', opacity: 0.8 }} />}
                  {blocks.map(([h, d], i) => (
                    <span
                      key={i}
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: pc(h),
                        width: `calc(${(d / AXIS_SPAN) * 100}% - 3px)`,
                        borderRadius: 8,
                        background: 'currentColor',
                        opacity: h === LUNCH[0] ? 0.4 : i % 2 ? 0.75 : 0.95,
                        transform: active ? 'scaleY(1)' : 'scaleY(.55)',
                        transformOrigin: 'bottom',
                        transition: `transform .6s cubic-bezier(.3,1.4,.5,1) ${i * 0.06}s`,
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', font: `500 10px ${MONO}`, opacity: 0.65 }}>
                  <span>08h</span>
                  <span>12h</span>
                  <span>16h</span>
                  <span>20h</span>
                  <span>24h</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
      <Cta
        light
        onClick={() => {
          if (!pace) onPick(open)
          onNext()
        }}
      >
        Continuar
      </Cta>
    </>
  )
}
