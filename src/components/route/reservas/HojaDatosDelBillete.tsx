import { useState, type CSSProperties } from 'react'
import type { LegState } from '../../../lib/reservasLegs'
import { legWord } from '../../../lib/reservasLegs'
import { useRouteStore } from '../../../store/useRouteStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { useViajeCompartido } from '../../../store/useViajeCompartido'
import { useBilleteStore, type BilleteGuardado } from '../../../store/useBilleteStore'
import { HojaAbajo } from './HojaAbajo'

/**
 * (10S6) LOS DATOS DEL BILLETE, en la tarjeta de RESERVAS. La hoja del vuelo ya no pide Ref. vuelo, Aerolínea, Localizador, Terminal ni Asiento (llegan con la tarjeta de embarque o el billete):
 * si hay que cambiar alguno a mano, se hace aquí, desde «Cambiar los datos» de la tarjeta. Lo que ya estaba guardado sale puesto y no se pierde.
 * Referencia y aerolínea van con el viaje (`setLegCodigo`, `setLegCompania`); localizador, terminal (o coche), asiento y el código, solo en el móvil de esta persona (`useBilleteStore`).
 */
const etiquetaDeCaja: CSSProperties = { font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.12em', color: 'rgba(28,34,48,.5)', textTransform: 'uppercase' }
const caja = 'flex h-[54px] min-w-0 flex-col justify-center gap-px rounded-[15px] border bg-[#FFFDF8] px-3.5'

export function HojaDatosDelBillete({ leg, billete, onClose }: { leg: LegState; billete: BilleteGuardado | null; onClose: () => void }) {
  const setLegCodigo = useRouteStore((s) => s.setLegCodigo)
  const setLegCompania = useRouteStore((s) => s.setLegCompania)
  const tripId = useSyncStore((s) => s.activeTripId)
  const yoId = useViajeCompartido((s) => s.gente.find((p) => p.esYo)?.id ?? null)
  const ponerBillete = useBilleteStore((s) => s.poner)
  const quitarBillete = useBilleteStore((s) => s.quitar)
  const word = legWord(leg.mode)
  const conCoche = leg.mode === 'tren' || leg.mode === 'bus'
  const [d, setD] = useState({ codigo: leg.codigo ?? '', compania: leg.compania ?? '', localizador: billete?.localizador ?? '', terminal: billete?.terminal ?? '', asiento: billete?.asiento ?? '', coche: billete?.coche ?? '' })
  const pon = (cambio: Partial<typeof d>) => setD((previo) => ({ ...previo, ...cambio }))
  const guardar = () => {
    setLegCodigo(leg.kind, d.codigo)
    setLegCompania(leg.kind, d.compania)
    const limpio = (t: string) => t.trim() || null
    if (limpio(d.localizador) || limpio(d.terminal) || limpio(d.asiento) || limpio(d.coche) || billete?.codigo) {
      ponerBillete(tripId, leg.kind, {
        horaRoma: billete?.horaRoma ?? leg.time,
        localizador: limpio(d.localizador),
        terminal: limpio(d.terminal),
        asiento: limpio(d.asiento),
        coche: limpio(d.coche),
        codigo: billete?.codigo ?? null,
        codigoFuera: billete?.codigoFuera ?? null,
        dueno: billete?.dueno ?? yoId,
      })
    } else if (billete) quitarBillete(tripId, leg.kind)
    onClose()
  }
  const cuadro = (clave: keyof typeof d, etiqueta: string, ejemplo: string, mayus: boolean, max: number) => (
    <label className={caja} style={{ borderColor: 'rgba(28,34,48,.12)' }}>
      <span style={etiquetaDeCaja}>{etiqueta}</span>
      <input value={d[clave]} onChange={(e) => pon({ [clave]: e.target.value })} maxLength={max} placeholder={ejemplo} autoComplete="off" autoCapitalize={mayus ? 'characters' : 'off'} data-datos-billete={clave} className={`w-full min-w-0 bg-transparent text-[15px] font-medium outline-none placeholder:font-normal placeholder:normal-case placeholder:text-text/40 ${mayus ? 'uppercase' : ''}`} />
    </label>
  )
  return (
    <HojaAbajo
      titleId="hoja-datos-billete"
      onClose={onClose}
      capa={115}
      pie={
        <button type="button" onClick={guardar} data-datos-billete-guardar className="h-[54px] w-full rounded-full btn-champan text-[16px] font-bold transition-transform active:scale-[.98]">
          Guardar los datos
        </button>
      }
    >
      <h2 id="hoja-datos-billete" className="max-w-[calc(100%-3rem)] font-display text-[28px] leading-[1.05] text-text">
        Datos de tu {leg.mode === 'avion' ? 'tarjeta de embarque' : 'billete'}
      </h2>
      <p className="mt-2 text-[13px] leading-[1.35] text-text/60">{leg.kind === 'arrival' ? 'Ida' : 'Vuelta'}. Todos opcionales.</p>
      <div className="mt-5 flex flex-col gap-3" data-datos-billete-campos>
        <div className="flex gap-2">
          {cuadro('codigo', word.refLabel, 'AB 1234', true, 20)}
          {cuadro('compania', word.companiaLabel, 'Opcional', false, 40)}
        </div>
        <div className="flex flex-wrap gap-2">
          {cuadro('localizador', 'Localizador', 'ABC123', true, 20)}
          {conCoche ? cuadro('coche', 'Coche', '003', false, 20) : cuadro('terminal', 'Terminal', '1', false, 20)}
          {cuadro('asiento', 'Asiento', conCoche ? '01D' : '14C', true, 20)}
        </div>
        <span className="text-[12px] leading-[1.35] text-text/55">Localizador, terminal y asiento se guardan en tu móvil.</span>
      </div>
    </HojaAbajo>
  )
}
