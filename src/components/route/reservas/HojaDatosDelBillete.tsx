import { useState, type CSSProperties } from 'react'
import type { LegState } from '../../../lib/reservasLegs'
import { legWord } from '../../../lib/reservasLegs'
import type { CambioDeVuelo } from '../../../lib/cambioDeVuelo'
import { useRouteStore } from '../../../store/useRouteStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { useViajeCompartido } from '../../../store/useViajeCompartido'
import { useBilleteStore, type BilleteGuardado } from '../../../store/useBilleteStore'
import { companiaDeCodigoDeVuelo, type DatosBilleteLeido } from '../../../lib/billeteLeer'
import { ladoDesdeBillete } from '../../../lib/billeteAplicar'
import { ciudadDeSalida } from '../../../lib/billete'
import { fechaEnProsa } from '../../../lib/nombreDeDia'
import { ponerAvisoDeDocumento, quitarAvisoDeDocumento } from '../../../lib/avisoDeDocumento'
import { CampoDeHora } from '../../ui/HojaDeHora'
import { HojaAbajo } from './HojaAbajo'

/**
 * «DATOS DEL VUELO» (10S8 §3; `Piezas/Billete Reservas` B2b; V64 §1, Design «Añadir un documento» D2 y D3), la hoja del lápiz del bloque de datos de la tarjeta y de [Escribir los datos]: la COMPAÑÍA (arriba del todo; en avión se rellena sola por el código
 * del vuelo, «VY» → Vueling, y se puede cambiar), el vuelo (o el tren…), el horario (sale a las / llega a las), la terminal (o el coche), el asiento y el localizador, con [Guardar los datos]. LAS HORAS SON EL MISMO DATO que las de la hoja del vuelo:
 * la de Roma es la del viaje (`guardarVueloDelAdmin`) y la de fuera, la «otra hora»; cambiar una aquí cambia la otra allí.
 * El número y la compañía van con el viaje (`setLegCodigo`, `setLegCompania`); localizador, terminal (o coche), asiento y el código, solo en el móvil de esta persona (`useBilleteStore`).
 *
 * (V64 §1) CON `leido` (tras subir una foto o un archivo) es «REVISA LOS DATOS»: los mismos campos ya rellenos con lo que se ha leído, «Hemos leído tu billete. Revisa los datos y cámbialos si hace falta» y [Guardar]. NADA se guarda hasta pulsarlo
 * (antes la tarjeta leída se guardaba sola). Si el documento es de otro día que el del vuelo, las horas no se tocan y, al guardar, la tarjeta lleva la línea naranja con [Es correcta] y [Cambiar].
 */
const etiquetaDeCampo: CSSProperties = { font: "700 14.5px 'Geist'", color: '#1C2230' }
const claseHora = 'flex h-[58px] w-full items-center justify-between rounded-[15px] border bg-[#FFFDF8] px-3.5 text-left'

export function HojaDatosDelBillete({ leg, billete, onClose, onCambioDeVuelo, leido = null }: { leg: LegState; billete: BilleteGuardado | null; onClose: () => void; onCambioDeVuelo?: (cambio: CambioDeVuelo) => void; /** (V64) Lo leído del documento recién subido: la hoja es «Revisa los datos». */ leido?: DatosBilleteLeido | null }) {
  const setLegCodigo = useRouteStore((s) => s.setLegCodigo)
  const setLegCompania = useRouteStore((s) => s.setLegCompania)
  const setLegOtraHora = useRouteStore((s) => s.setLegOtraHora)
  const setLegOtroPunto = useRouteStore((s) => s.setLegOtroPunto)
  const guardarVueloDelAdmin = useRouteStore((s) => s.guardarVueloDelAdmin)
  const route = useRouteStore((s) => s.route)
  const tripId = useSyncStore((s) => s.activeTripId)
  const yoId = useViajeCompartido((s) => s.gente.find((p) => p.esYo)?.id ?? null)
  const ponerBillete = useBilleteStore((s) => s.poner)
  const quitarBillete = useBilleteStore((s) => s.quitar)
  const word = legWord(leg.mode)
  const conCoche = leg.mode === 'tren' || leg.mode === 'bus'
  const esIda = leg.kind === 'arrival'
  const nombre = word.noun.charAt(0).toUpperCase() + word.noun.slice(1)
  const ciudadFuera = route ? ciudadDeSalida(route) : ''
  const l = leido ? ladoDesdeBillete(leg, leido, ciudadFuera) : null
  // El día que trae el documento (el de llegada en la ida; el de salida en la vuelta) frente al del vuelo.
  const fechaDoc = leido ? (esIda ? (leido.fechaLlegada ?? leido.fecha) : leido.fecha) : null
  const fechaDistinta = Boolean(fechaDoc && leg.dateIso && fechaDoc !== leg.dateIso)
  const leidoAlgo = leido ? Boolean(leido.numero || leido.horaSalida || leido.horaLlegada || leido.localizador || leido.asiento || leido.fuentes.length > 0) : false
  const codigoInicial = l?.codigo ?? leg.codigo ?? ''
  const [d, setD] = useState({
    compania: l?.compania ?? leg.compania ?? (leg.mode === 'avion' ? (companiaDeCodigoDeVuelo(codigoInicial) ?? '') : ''),
    codigo: codigoInicial,
    localizador: l?.localizador ?? billete?.localizador ?? '',
    terminal: l?.terminal ?? billete?.terminal ?? '',
    asiento: l?.asiento ?? billete?.asiento ?? '',
    coche: l?.coche ?? billete?.coche ?? '',
  })
  // La compañía se rellena sola por el código del vuelo hasta que el viajero la toca.
  const [companiaTocada, setCompaniaTocada] = useState(Boolean(d.compania))
  // Las dos horas: la de Roma es la del viaje; la otra, opcional. En la ida se sale de fuera y se llega a Roma; en la vuelta, al revés.
  const [horaRoma, setHoraRoma] = useState<string | null>(!fechaDistinta && l?.hora ? l.hora : leg.time)
  const [horaFuera, setHoraFuera] = useState<string | null>(!fechaDistinta && l?.otraHora ? l.otraHora : (leg.otraHora ?? null))
  const pon = (cambio: Partial<typeof d>) => setD((previo) => ({ ...previo, ...cambio }))
  const guardar = () => {
    setLegCodigo(leg.kind, d.codigo)
    setLegCompania(leg.kind, d.compania)
    const hora = horaRoma && /^\d{1,2}:\d{2}$/.test(horaRoma) ? horaRoma : leg.time
    if (hora && hora !== leg.time) {
      guardarVueloDelAdmin({ [leg.kind]: { time: hora }, medio: word.noun })
      onCambioDeVuelo?.({ que: 'hora', mitad: leg.kind })
    }
    setLegOtraHora(leg.kind, horaFuera)
    if (l?.otroPunto && !leg.otroPunto && l.otroPunto.trim() !== ciudadFuera && !fechaDistinta) setLegOtroPunto(leg.kind, l.otroPunto)
    const limpio = (t: string) => t.trim() || null
    const codigo = leido?.codigo ? { texto: leido.codigo.texto, formato: leido.codigo.formato, imagen: leido.codigo.imagen, dibujo: leido.codigo.dibujo ?? null } : (billete?.codigo ?? null)
    if (limpio(d.localizador) || limpio(d.terminal) || limpio(d.asiento) || limpio(d.coche) || codigo) {
      ponerBillete(tripId, leg.kind, {
        horaRoma: hora ?? billete?.horaRoma ?? null,
        localizador: limpio(d.localizador),
        terminal: limpio(d.terminal),
        asiento: limpio(d.asiento),
        coche: limpio(d.coche),
        codigo,
        codigoFuera: l?.codigoFuera ?? billete?.codigoFuera ?? null,
        dueno: billete?.dueno ?? yoId,
      })
    } else if (billete) quitarBillete(tripId, leg.kind)
    // (V45 §6 y V64 §2) Un documento de otro día: la línea naranja dentro de la tarjeta (con [Es correcta] y [Cambiar]); si cuadra, se quita la que hubiera.
    if (leido) {
      if (fechaDistinta && fechaDoc && leg.dateIso) {
        ponerAvisoDeDocumento(tripId, leg.kind, `${leg.mode === 'avion' ? 'Esta tarjeta de embarque' : 'Este billete'} es del ${fechaEnProsa(fechaDoc)} y tu ${word.noun} es el ${fechaEnProsa(leg.dateIso)}. Si no es la buena, súbela otra vez o cambia los datos a mano.`)
      } else quitarAvisoDeDocumento(tripId, leg.kind)
    }
    onClose()
  }
  const cuadro = (clave: keyof typeof d, etiqueta: string, ejemplo: string, mayus: boolean, max: number, alCambiar?: (valor: string) => void) => (
    <label className="flex min-w-0 flex-1 flex-col gap-2">
      <span style={etiquetaDeCampo}>{etiqueta}</span>
      <input value={d[clave]} onChange={(e) => (alCambiar ? alCambiar(e.target.value) : pon({ [clave]: e.target.value }))} maxLength={max} placeholder={ejemplo} autoComplete="off" autoCapitalize={mayus ? 'characters' : 'off'} data-datos-billete={clave} className={`h-[54px] w-full min-w-0 rounded-[15px] border bg-[#FFFDF8] px-3.5 text-[15px] font-medium outline-none placeholder:font-normal placeholder:normal-case placeholder:text-text/40 focus:border-text/50 ${mayus ? 'uppercase' : ''}`} style={{ borderColor: 'rgba(28,34,48,.12)' }} />
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
          {leido ? 'Guardar' : 'Guardar los datos'}
        </button>
      }
    >
      <h2 id="hoja-datos-billete" className="max-w-[calc(100%-3rem)] font-display text-[28px] leading-[1.05] text-text" data-hoja-titulo={leido ? 'revisa-los-datos' : 'datos-billete'}>
        {leido ? 'Revisa los datos' : `Datos del ${word.noun}`}
      </h2>
      {leido && (
        <p className="mt-2 text-[14px] font-medium leading-[1.4] text-text/75" data-billete-leido={leidoAlgo ? 'si' : 'no'}>
          {leidoAlgo ? 'Hemos leído tu billete. Revisa los datos y cámbialos si hace falta' : (leido.aviso ?? 'No hemos podido leer los datos de este archivo. Ponlos a mano: el código se guarda igual si lo hemos encontrado.')}
        </p>
      )}
      <div className="mt-5 flex flex-col gap-4" data-datos-billete-campos>
        <div className="flex gap-2">{cuadro('compania', leg.mode === 'ferry' ? word.companiaLabel : 'Compañía', leg.mode === 'avion' ? 'Vueling' : leg.mode === 'ferry' ? 'Grimaldi' : 'Iryo', false, 40, (valor) => { setCompaniaTocada(true); pon({ compania: valor }) })}</div>
        <div className="flex gap-2">
          {cuadro('codigo', nombre, leg.mode === 'avion' ? 'VY 6102' : '03180', true, 20, (valor) => {
            // La compañía sale sola del código del vuelo mientras el viajero no la haya tocado («VY» → Vueling).
            const sola = leg.mode === 'avion' && !companiaTocada ? companiaDeCodigoDeVuelo(valor) : null
            pon({ codigo: valor, ...(sola ? { compania: sola } : {}) })
          })}
        </div>
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
