import { useMemo, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { DayPlan, Route, Stop } from '../../../../lib/types'
import { shellFromStop } from '../../../../lib/mockDayDetail'
import { buildCuratedStopDescription } from '../../../../lib/describeStopApi'
import { hasRealCoordinates } from '../../../../lib/distanceMock'
import { displayStopName } from '../../../../lib/format'
import { elSitio } from '../../../../lib/articulos'
import { StopDetailSheet, type DayStopRef } from '../../dayDetail/StopDetailSheet'


/**
 * HOY2 (agente A): las piezas nuevas de HOY completa que no caben en los archivos de siempre.
 *  · `FichaCompletaDeHoy`: tocar la tarjeta de la parada abre la ficha COMPLETA de DÍAS (`StopDetailSheet`: Qué vas a ver, Dónde aparcar, Tips, Logros), no «Sobre este lugar». HOY le pasa los datos del día que la ficha necesita.
 *  · `SiTeSobraTiempoHoy`: abajo del todo, la lista de «Si te sobra tiempo» de DÍAS plegada y solo si hay algo; lo saltado y lo quitado, cada uno con [Recuperar] y [Pasar a otro día].
 *  · `TarjetaBienvenida`: el día de llegada («Bienvenido a Lanzarote»: el vuelo, el coche, la hora útil de la LL).
 *  · `TarjetaMananaOscura` y `HastaAquiHoy`: el final del día (Completa 7).
 */
const MARFIL = '#FBF3E2'

/* ------------------------------------------------------------------ */
/* La ficha completa                                                    */
/* ------------------------------------------------------------------ */

export function FichaCompletaDeHoy({ route, day, dateIso, parada, onCerrar }: { route: Route; day: DayPlan; dateIso: string; parada: Stop; onCerrar: () => void }) {
  const detalle = useMemo(() => shellFromStop(parada), [parada])
  const refs: DayStopRef[] = day.stops.filter((s) => hasRealCoordinates(s.coordinates)).map((s) => ({ id: s.id, name: s.name, coordinates: s.coordinates, photoUrl: s.photoUrl }))
  const anclas = new Set((route.anchorNames ?? []).map((n) => n.toLowerCase()))
  // Lo mismo que hace DÍAS: en los días del motor nuevo la ficha trae ya su texto (sin llamar a Claude); en los demás, el de la ficha curada de siempre.
  const externo = day.timesAreFinal && !parada.isFreeTour && parada.description ? { description: buildCuratedStopDescription(detalle.description, detalle.tips[0]), loading: false } : undefined
  const ficha = (
    <StopDetailSheet
      stop={detalle}
      visitTime={parada.time ?? null}
      city={day.city}
      dayNumber={day.dayNumber}
      dateIso={dateIso}
      dayStops={refs}
      isAnchor={!day.timesAreFinal && anclas.has(parada.name.toLowerCase())}
      externalContent={externo}
      onClose={onCerrar}
    />
  )
  return typeof document === 'undefined' ? ficha : createPortal(ficha, document.body)
}

/* ------------------------------------------------------------------ */
/* El día de llegada (Completa 8)                                       */
/* ------------------------------------------------------------------ */

export function TarjetaBienvenida({ aviso, children }: { /** Una línea más (comer antes de ponerte en marcha, o «llegas tarde: descansa»). */ aviso?: ReactNode; children?: ReactNode }) {
  // (V62) El vuelo, la hora, el coche y «Empiezas hacia las…» ya no salen aquí: los lleva la tarjeta de llegada (TarjetaDeLlegada). Esta solo queda con lo que esa no tiene (comer antes de ponerte en marcha, «llegas tarde», restaurantes); sin nada de eso, no sale.
  if (!aviso && !children) return null
  return (
    <div data-hoy-llegada="1" data-hoy-bienvenida className="flex flex-none flex-col gap-3 rounded-[26px] p-[18px]" style={{ background: '#1C2230', color: MARFIL, boxShadow: '0 18px 30px -18px rgba(28,34,48,.7)' }}>
      <div className="flex flex-col gap-2.5" style={{ font: "500 14px/1.35 'Geist'" }}>{aviso}</div>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* El día acabado (Completa 7)                                          */
/* ------------------------------------------------------------------ */

/** «Hasta aquí, hoy»: la línea que separa el día que acaba de lo de mañana. */
export function HastaAquiHoy() {
  return (
    <span data-hoy-hasta-aqui className="flex-none px-1 pt-1 text-center" style={{ font: "italic 400 22px/1.1 'Instrument Serif',serif", color: 'rgba(28,34,48,.6)' }}>
      Hasta aquí, hoy
    </span>
  )
}

/** (V73) «Mañana, viernes 27 · La Graciosa» con sus líneas: la tarjeta vive en su archivo (TarjetaMananaOscura.tsx). */
export { TarjetaMananaOscura } from './TarjetaMananaOscura'

/** La frase de cierre de la tarjeta del día acabado: «Hoy has visto el atardecer» con su sitio, o «Has terminado tu día». */
export function fraseDeCierre(day: DayPlan, paradas: Stop[], /** (V73) El peso del sitio (0 = imprescindible; ver `pesoDe` en lib/masVisitas): para «Lo mejor:» los imprescindibles primero. Sin él, las primeras paradas. */ pesoDe?: (nombre: string) => number, /** (V77 §2) El nombre corto del sitio para las frases que nombran varios (dato `nombre_corto`); null = sin nombre corto, va el entero. */ nombreCorto?: (nombre: string) => string | null): { titulo: string; sub: string | null; atardecer: boolean; sitioAtardecer: string | null; hechas: number } {
  const sol = paradas.find((s) => s.isSunset && s.checkedInAt && !s.saltada)
  const visitas = paradas.filter((s) => s.checkedInAt && !s.saltada && !(s.isBreak || s.isZoneWalk || s.isFreeWalk || s.isFreeTime || s.passThrough || s.isArrival))
  const hechas = paradas.filter((s) => s.checkedInAt && !s.saltada).length
  void day
  if (sol) return { titulo: 'Hoy has visto el atardecer', sub: `Un cierre perfecto en ${displayStopName(sol.name)}.`, atardecer: true, sitioAtardecer: displayStopName(sol.name), hechas }
  // (V73 §2) La tarjeta NUNCA vacía: «Lo mejor:» con hasta 3 sitios de lo visto, los imprescindibles primero y, si no hay, las primeras paradas (el orden de la ruta, que ya es el de las horas).
  const imprescindibles = pesoDe ? visitas.filter((s) => pesoDe(s.name) === 0) : []
  const mejores = [...imprescindibles, ...visitas.filter((s) => !imprescindibles.includes(s))].slice(0, 3)
  const lomejor = mejores.length > 0 ? `Lo mejor: ${unirLista(mejores.map((s) => nombreCorto?.(s.name) ?? elSitio(displayStopName(s.name).replace(/\s*\([^)]*\)/g, '').trim())))}.` : null
  const dejadas = paradas.some((s) => s.saltada) ? 'Lo que dejaste para luego está abajo, en «Lugares pendientes».' : null
  return { titulo: hechas === 1 ? 'Has hecho 1 parada hoy' : `Has hecho ${hechas} paradas hoy`, sub: [lomejor, dejadas].filter(Boolean).join(' ') || null, atardecer: false, sitioAtardecer: null, hechas }
}

const unirLista = (lista: string[]): string => (lista.length <= 1 ? (lista[0] ?? '') : `${lista.slice(0, -1).join(', ')} y ${lista[lista.length - 1]}`)


