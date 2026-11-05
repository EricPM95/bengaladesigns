import { useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { DayPlan, Route, Stop } from '../../../../lib/types'
import { shellFromStop } from '../../../../lib/mockDayDetail'
import { buildCuratedStopDescription } from '../../../../lib/describeStopApi'
import { hasRealCoordinates } from '../../../../lib/distanceMock'
import { displayStopName, formatDuration } from '../../../../lib/format'
import { useRouteStore } from '../../../../store/useRouteStore'
import { pasarImprescindibleAOtroDia } from '../../../../lib/pasarImprescindible'
import type { NoCabe } from '../../../../lib/adaptarVuelos'
import { Icono } from '../../../ui/Icono'
import { StopDetailSheet, type DayStopRef } from '../../dayDetail/StopDetailSheet'
import { HojaPasarAOtroDia } from '../saltar'
import { ParadaFotoDeParada } from './ParadaFoto'


/**
 * HOY2 (agente A): las piezas nuevas de HOY completa que no caben en los archivos de siempre.
 *  · `FichaCompletaDeHoy`: tocar la tarjeta de la parada abre la ficha COMPLETA de DÍAS (`StopDetailSheet`: Qué vas a ver, Dónde aparcar, Tips, Logros), no «Sobre este lugar». HOY le pasa los datos del día que la ficha necesita.
 *  · `SiTeSobraTiempoHoy`: abajo del todo, la lista de «Si te sobra tiempo» de DÍAS plegada y solo si hay algo; lo saltado y lo quitado, cada uno con [Recuperar] y [Pasar a otro día].
 *  · `TarjetaBienvenida`: el día de llegada («Bienvenido a Lanzarote»: el vuelo, el coche, la hora útil de la LL).
 *  · `TarjetaMananaOscura` y `HastaAquiHoy`: el final del día (Completa 7).
 */
const ORO_CLARO = '#F3D88F'
const MARFIL = '#FBF3E2'
const BOTON_ORO = { background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)', color: '#4A3510', boxShadow: '0 10px 20px -14px rgba(110,80,24,.7),inset 0 1px 0 rgba(255,255,255,.55)' }
const OJO_ORO = { font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: ORO_CLARO, textTransform: 'uppercase' as const }

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
/* Si te sobra tiempo                                                   */
/* ------------------------------------------------------------------ */

interface ItemSobra {
  stop: Stop
  /** 'saltada' (la dejaste tú) o 'sobra' (el motor o un cambio la dejó fuera: «Si te sobra tiempo» de DÍAS). */
  origen: 'saltada' | 'sobra'
}

/** Lo que va en «Si te sobra tiempo» de HOY: lo que ya estaba en la lista de DÍAS y lo saltado de hoy. */
export function itemsDeSobraTiempo(day: DayPlan): ItemSobra[] {
  const sobra = (day.spareStops ?? []).map((stop): ItemSobra => ({ stop, origen: 'sobra' }))
  const saltadas = day.stops.filter((s) => s.saltada && !s.isArrival && !s.isBreak).map((stop): ItemSobra => ({ stop, origen: 'saltada' }))
  return [...saltadas, ...sobra]
}

export function SiTeSobraTiempoHoy({ route, day, dateIso }: { route: Route; day: DayPlan; dateIso: string }) {
  const [abierta, setAbierta] = useState(false)
  const [pasando, setPasando] = useState<ItemSobra | null>(null)
  const setStopSaltada = useRouteStore((s) => s.setStopSaltada)
  const addSpareStop = useRouteStore((s) => s.addSpareStop)
  const moveStopToDay = useRouteStore((s) => s.moveStopToDay)
  const items = itemsDeSobraTiempo(day)
  if (items.length === 0) return null
  const dias = route.days.filter((d) => !d.isReturnLeg && d.id !== day.id).map((d) => ({ id: d.id, dayNumber: d.dayNumber, city: d.city }))
  const puedePasar = (it: ItemSobra) => dias.length > 0 && !it.stop.reservedId
  const recuperar = (it: ItemSobra) => (it.origen === 'saltada' ? setStopSaltada(day.id, it.stop.id, false) : addSpareStop(day.id, it.stop.id))
  const pasar = (it: ItemSobra, aDayId: string) => {
    if (it.origen === 'saltada') moveStopToDay(it.stop.id, day.id, aDayId)
    else pasarImprescindibleAOtroDia({ dayId: day.id, stopId: it.stop.id } as unknown as NoCabe, aDayId)
    setPasando(null)
  }
  return (
    <div data-hoy-sobra-tiempo={items.length} className="flex flex-none flex-col rounded-2xl" style={{ background: '#FFFDF8', border: '1px solid rgba(28,34,48,.1)' }}>
      <button type="button" onClick={() => setAbierta((v) => !v)} aria-expanded={abierta} data-hoy-sobra-tiempo-cabecera className="flex min-h-12 items-center gap-2.5 px-4 text-left">
        <span className="flex-1 text-[14px] font-medium text-[#1C2230]">
          Si te sobra tiempo <span className="font-normal text-[#1C2230]/50">· {items.length === 1 ? '1 sitio' : `${items.length} sitios`}</span>
        </span>
        <Icono nombre={abierta ? 'arriba' : 'abajo'} size={15} grosor={2} style={{ color: 'rgba(28,34,48,.5)' }} />
      </button>
      {abierta && (
        <ul data-hoy-sobra-lista className="m-0 flex list-none flex-col divide-y p-0" style={{ borderTop: '1px solid rgba(28,34,48,.08)', borderColor: 'rgba(28,34,48,.08)' }}>
          {items.map((it) => (
            <li key={`${it.origen}-${it.stop.id}`} data-hoy-sobra-item={it.origen} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center gap-3">
                <ParadaFotoDeParada parada={it.stop} ciudad={day.city} dateIso={dateIso} vista={false} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[15px] font-semibold leading-[1.2] text-[#1C2230]">{displayStopName(it.stop.name)}</p>
                  <p className="m-0 mt-0.5 text-[12px] leading-[1.35] text-[#1C2230]/60">
                    {it.stop.durationMinutes > 0 ? `${formatDuration(it.stop.durationMinutes)} · ` : ''}
                    {it.origen === 'saltada' ? 'La dejaste para luego' : (it.stop.spareReason ?? 'Para otro momento')}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => recuperar(it)} data-hoy-recuperar className="flex h-11 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-[12.5px] font-semibold" style={{ borderColor: 'rgb(var(--accent))', color: 'rgb(var(--accent))' }}>
                  <Icono nombre="recuperar" size={13} grosor={2} />
                  Recuperar
                </button>
                {puedePasar(it) && (
                  <button type="button" onClick={() => setPasando(it)} data-hoy-pasar-otro-dia className="flex h-11 items-center gap-1.5 rounded-full border border-[rgba(28,34,48,.18)] bg-white px-3.5 text-[12.5px] font-semibold text-[#1C2230]">
                    <Icono nombre="dias" size={13} grosor={1.9} />
                    Pasar a otro día
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {pasando && <HojaPasarAOtroDia dias={dias} ahora={day.dayNumber} onElegir={(id) => pasar(pasando, id)} onCerrar={() => setPasando(null)} />}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* El día de llegada (Completa 8)                                       */
/* ------------------------------------------------------------------ */

export function TarjetaBienvenida({ aterrizaHora, horaUtil, recogerCoche, comoLlegarCoche, aviso, onVerBillete, children }: { aterrizaHora: string | null; horaUtil: string | null; recogerCoche: boolean; comoLlegarCoche: string | null; /** Una línea más (comer antes de ponerte en marcha, o «llegas tarde: descansa»). */ aviso?: ReactNode; onVerBillete?: (() => void) | null; children?: ReactNode }) {
  return (
    <div data-hoy-llegada="1" data-hoy-bienvenida className="flex flex-none flex-col gap-3 rounded-[26px] p-[18px]" style={{ background: '#1C2230', color: MARFIL, boxShadow: '0 18px 30px -18px rgba(28,34,48,.7)' }}>
      <div className="flex items-center gap-3">
        <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full" style={{ background: 'rgba(251,243,226,.1)', color: ORO_CLARO }}>
          <Icono nombre="avion" size={22} grosor={1.7} />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span style={OJO_ORO}>Tu vuelo</span>
          <b data-hoy-bienvenida-titulo style={{ font: "400 26px/1.1 'Instrument Serif',serif" }}>{aterrizaHora ? `Aterrizas a las ${aterrizaHora}` : 'Bienvenido'}</b>
        </span>
      </div>
      <div className="flex flex-col gap-2.5" style={{ font: "500 14px/1.35 'Geist'" }}>
        {recogerCoche && (
          <span data-hoy-bienvenida-linea="coche" className="flex items-center gap-2.5">
            <Icono nombre="coche" size={17} grosor={1.8} style={{ color: ORO_CLARO, flex: 'none' }} />
            Recoge tu coche en el aeropuerto.
          </span>
        )}
        {horaUtil && (
          <span data-hoy-bienvenida-linea="hora-util" className="flex items-center gap-2.5">
            <Icono nombre="reloj" size={17} grosor={1.8} style={{ color: ORO_CLARO, flex: 'none' }} />
            Empiezas hacia las {horaUtil}.
          </span>
        )}
        {aviso}
      </div>
      {comoLlegarCoche && (
        <a href={comoLlegarCoche} target="_blank" rel="noopener noreferrer" data-hoy-bienvenida-coche className="flex h-12 items-center justify-center gap-1.5 rounded-2xl px-2.5 text-[13.5px] font-bold no-underline" style={BOTON_ORO}>
          <Icono nombre="localizar" size={17} grosor={1.9} />
          Cómo llegar al coche de alquiler
        </a>
      )}
      {children}
      {onVerBillete && (
        <button type="button" onClick={onVerBillete} data-hoy-bienvenida-billete className="flex min-h-11 items-center justify-center self-center text-[12.5px] underline underline-offset-2" style={{ color: 'rgba(251,243,226,.75)' }}>
          Ver mi llegada
        </button>
      )}
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

/** «Mañana, miércoles 11 · La Graciosa»: la tarjeta oscura de lo de mañana (solo cuando no queda nada por hacer hoy). */
export function TarjetaMananaOscura({ cuando, titulo, sales, turno, consejo }: { cuando: string; titulo: string; sales: string | null; turno: string | null; consejo: string | null }) {
  return (
    <div data-hoy-manana className="flex flex-none flex-col gap-2.5 rounded-[26px] p-[18px]" style={{ background: '#1C2230', color: MARFIL, boxShadow: '0 18px 30px -18px rgba(28,34,48,.7)' }}>
      <span style={OJO_ORO}>Mañana</span>
      <b data-hoy-manana-titulo style={{ font: "400 26px/1.12 'Instrument Serif',serif", textWrap: 'balance' as never }}>
        {cuando} · {titulo}
      </b>
      <span className="flex flex-col gap-1.5 text-[13.5px] font-medium" style={{ color: 'rgba(251,243,226,.85)' }}>
        {sales && (
          <span data-hoy-manana-sales className="flex items-center gap-2">
            <Icono nombre="reloj" size={15} grosor={1.8} style={{ color: ORO_CLARO, flex: 'none' }} />
            {sales.charAt(0).toUpperCase() + sales.slice(1)}
          </span>
        )}
        {turno && (
          <span data-hoy-manana-reserva className="flex items-center gap-2">
            <Icono nombre="reservas" size={15} grosor={1.8} style={{ color: ORO_CLARO, flex: 'none' }} />
            {turno.charAt(0).toUpperCase() + turno.slice(1)}
          </span>
        )}
        {consejo && (
          <span data-hoy-manana-consejo className="flex items-center gap-2">
            <Icono nombre="info" size={15} grosor={1.8} style={{ color: ORO_CLARO, flex: 'none' }} />
            {consejo.charAt(0).toUpperCase() + consejo.slice(1)}
          </span>
        )}
      </span>
    </div>
  )
}

/** La frase de cierre de la tarjeta del día acabado: «Hoy has visto el atardecer» con su sitio, o «Has terminado tu día». */
export function fraseDeCierre(day: DayPlan, paradas: Stop[]): { titulo: string; sub: string | null } {
  const sol = paradas.find((s) => s.isSunset && s.checkedInAt && !s.saltada)
  if (sol) return { titulo: 'Hoy has visto el atardecer', sub: `Un cierre perfecto en ${displayStopName(sol.name)}.` }
  const hechas = paradas.filter((s) => s.checkedInAt && !s.saltada).length
  void day
  return { titulo: hechas === 1 ? 'Has hecho 1 parada hoy' : `Has hecho ${hechas} paradas hoy`, sub: paradas.some((s) => s.saltada) ? 'Lo que dejaste para luego está abajo, en «Si te sobra tiempo».' : null }
}


