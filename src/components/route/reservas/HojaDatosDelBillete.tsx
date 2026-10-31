import { useState, type CSSProperties } from 'react'
import type { LegState } from '../../../lib/reservasLegs'
import { legWord } from '../../../lib/reservasLegs'
import type { CambioDeVuelo } from '../../../lib/cambioDeVuelo'
import { useRouteStore } from '../../../store/useRouteStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { useViajeCompartido } from '../../../store/useViajeCompartido'
import { useBilleteStore, type BilleteGuardado } from '../../../store/useBilleteStore'
import { CampoDeHora } from '../../ui/HojaDeHora'
import { HojaAbajo } from './HojaAbajo'

/**
 * «DATOS DEL VUELO» (10S8 §3; `Piezas/Billete Reservas` B2b), la hoja del lápiz del bloque de datos de la tarjeta: el vuelo (o el tren…), el horario (sale a las / llega a las), la terminal (o el coche), el asiento y el localizador,
 * con [Guardar los datos]. LAS HORAS SON EL MISMO DATO que las de la hoja del vuelo: la de Roma es la del viaje (`guardarVueloDelAdmin`) y la de fuera, la «otra hora»; cambiar una aquí cambia la otra allí.
 * El número y la compañía van con el viaje (`setLegCodigo`, `setLegCompania`); localizador, terminal (o coche), asiento y el código, solo en el móvil de esta persona (`useBilleteStore`).
 */
const etiquetaDeCampo: CSSProperties = { font: "700 14.5px 'Geist'", color: '#1C2230' }
const claseHora = 'flex h-[58px] w-full items-center justify-between rounded-[15px] border bg-[#FFFDF8] px-3.5 text-left'

export function HojaDatosDelBillete({ leg, billete, onClose, onCambioDeVuelo }: { leg: LegState; billete: BilleteGuardado | null; onClose: () => void; onCambioDeVuelo?: (cambio: CambioDeVuelo) => void }) {
  const setLegCodigo = useRouteStore((s) => s.setLegCodigo)
  const setLegOtraHora = useRouteStore((s) => s.setLegOtraHora)
  const guardarVueloDelAdmin = useRouteStore((s) => s.guardarVueloDelAdmin)
  const tripId = useSyncStore((s) => s.activeTripId)
  const yoId = useViajeCompartido((s) => s.gente.find((p) => p.esYo)?.id ?? null)
  const ponerBillete = useBilleteStore((s) => s.poner)
  const quitarBillete = useBilleteStore((s) => s.quitar)
  const word = legWord(leg.mode)
  const conCoche = leg.mode === 'tren' || leg.mode === 'bus'
  const esIda = leg.kind === 'arrival'
  const nombre = word.noun.charAt(0).toUpperCase() + word.noun.slice(1)
  const [d, setD] = useState({ codigo: leg.codigo ?? '', localizador: billete?.localizador ?? '', terminal: billete?.terminal ?? '', asiento: billete?.asiento ?? '', coche: billete?.coche ?? '' })
  // Las dos horas: la de Roma es la del viaje; la otra, opcional. En la ida se sale de fuera y se llega a Roma; en la vuelta, al revés.
  const [horaRoma, setHoraRoma] = useState<string | null>(leg.time)
  const [horaFuera, setHoraFuera] = useState<string | null>(leg.otraHora ?? null)
  const pon = (cambio: Partial<typeof d>) => setD((previo) => ({ ...previo, ...cambio }))
  const guardar = () => {
    setLegCodigo(leg.kind, d.codigo)
    const hora = horaRoma && /^\d{1,2}:\d{2}$/.test(horaRoma) ? horaRoma : leg.time
    if (hora && hora !== leg.time) {
      guardarVueloDelAdmin({ [leg.kind]: { time: hora }, medio: word.noun })
      onCambioDeVuelo?.({ que: 'hora', mitad: leg.kind })
    }
    setLegOtraHora(leg.kind, horaFuera)
    const limpio = (t: string) => t.trim() || null
    if (limpio(d.localizador) || limpio(d.terminal) || limpio(d.asiento) || limpio(d.coche) || billete?.codigo) {
      ponerBillete(tripId, leg.kind, {
        horaRoma: hora ?? billete?.horaRoma ?? null,
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
    <label className="flex min-w-0 flex-1 flex-col gap-2">
      <span style={etiquetaDeCampo}>{etiqueta}</span>
      <input value={d[clave]} onChange={(e) => pon({ [clave]: e.target.value })} maxLength={max} placeholder={ejemplo} autoComplete="off" autoCapitalize={mayus ? 'characters' : 'off'} data-datos-billete={clave} className={`h-[54px] w-full min-w-0 rounded-[15px] border bg-[#FFFDF8] px-3.5 text-[15px] font-medium outline-none placeholder:font-normal placeholder:normal-case placeholder:text-text/40 focus:border-text/50 ${mayus ? 'uppercase' : ''}`} style={{ borderColor: 'rgba(28,34,48,.12)' }} />
    </label>
  )
  const sale = (
    <div className="min-w-0 flex-1" data-datos-hora="sale">
      <CampoDeHora valor={esIda ? horaFuera : horaRoma} onChange={(h) => (esIda ? setHoraFuera(h) : h && setHoraRoma(h))} titulo="Hora de salida" etiqueta="Sale a las" ejemplo="08:30" quitable={esIda} className={claseHora} datos="datos-sale" />
    </div>
  )
  const llega = (
    <div className="min-w-0 flex-1" data-datos-hora="llega">
      <CampoDeHora valor={esIda ? horaRoma : horaFuera} onChange={(h) => (esIda ? h && setHoraRoma(h) : setHoraFuera(h))} titulo="Hora de llegada" etiqueta="Llega a las" ejemplo="11:25" quitable={!esIda} className={claseHora} datos="datos-llega" />
    </div>
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
        Datos del {word.noun}
      </h2>
      <div className="mt-5 flex flex-col gap-4" data-datos-billete-campos>
        <div className="flex gap-2">{cuadro('codigo', nombre, leg.mode === 'avion' ? 'VY 6102' : '03180', true, 20)}</div>
        <div className="flex flex-col gap-2" data-datos-horario>
          <span style={etiquetaDeCampo}>Horario</span>
          <div className="flex gap-2">
            {sale}
            {llega}
          </div>
        </div>
        <div className="flex gap-2">
          {conCoche ? cuadro('coche', 'Coche', '003', false, 20) : cuadro('terminal', 'Terminal', '1', false, 20)}
          {cuadro('asiento', 'Asiento', conCoche ? '01D' : '14C', true, 20)}
        </div>
        <div className="flex gap-2">{cuadro('localizador', 'Localizador', 'ABC123', true, 20)}</div>
        <span className="text-[12px] leading-[1.35] text-text/55">Localizador, terminal y asiento se guardan en tu móvil.</span>
      </div>
    </HojaAbajo>
  )
}
