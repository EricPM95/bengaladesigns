import { useMemo, useState } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { useMisReservas } from '../../../store/useMisReservas'
import { useAnadirReservaStore } from '../../../store/useAnadirReservaStore'
import { CampoDeHora } from '../../ui/HojaDeHora'
import { BOTON_ORO } from '../../ui/botonesOro'
import { BloqueDinero, textoDelBoton } from '../presupuesto/BloqueDinero'
import { useDineroDeReserva } from './DineroDeReserva'
import { useEntradasDelGrupo } from '../../../hooks/useEntradasDelGrupo'
import { HojaAbajo, ojoStyle } from './HojaAbajo'
import { ESTILO_PREGUNTA } from '../../ui/PersonasCuadradas'
import { cuentaDelViaje, esFamilia } from '../../../lib/cuentaDelViaje'
import { dateOfDay } from '../../../lib/bookings'
import {
  borradorDeLaReserva,
  borradorVacio,
  construirReservaExtra,
  diasParaElegir,
  fichaDeDia,
  loQueFalta,
  textoDeGuardarExtra,
  tituloDeLaHojaExtra,
  type BorradorExtra,
  type ReservaExtra,
  type TipoExtra,
} from '../../../lib/reservasExtra'

/**
 * (V75; Design «Añadir una reserva» R3, R3b, R3c, R4, R3g y R3h) LA HOJA DE UN FERRY, UN TREN, UN AUTOBÚS O «OTRA» (carga perezosa: solo cuando se abre).
 *   · Ferry: naviera y de qué puerto a qué puerto. Tren y autobús: compañía y estación de salida y de llegada; en el tren, coche y asiento (opcionales). Otra: nombre, lugar (opcional).
 *   · En todas: el día (todos los del viaje, deslizando, con los botones de día de siempre), la hora (con la rueda de siempre, `CampoDeHora`), localizador y precio opcionales.
 *   · En un viaje con más gente, dos pasos como en las entradas y excursiones: 1) lo de la reserva [Siguiente]; 2) «Casi lista» (¿A qué cuenta lo sumamos?, ¿Para quién es?, ¿Quién la ha pagado?) y el precio.
 *   · Primero se guarda, después se sube: la hoja no pide el billete (la tarjeta guardada lleva «+ Sube tu billete»).
 * Se guarda con `addReservation` (o, quien mira el viaje de otra persona, en sus reservas: `useMisReservas`), igual que las entradas; no toca la ruta.
 */

const ETIQUETA = { font: "700 14.5px 'Geist'", color: '#1C2230' } as const
const OPCIONAL = { font: "500 12px 'Geist'", color: 'rgba(28,34,48,.5)', marginLeft: 6 } as const

function Etiqueta({ children, opcional = false }: { children: string; opcional?: boolean }) {
  return (
    <span style={ETIQUETA}>
      {children}
      {opcional && <span style={OPCIONAL}>· opcional</span>}
    </span>
  )
}

/** Una casilla de texto de la hoja (el mismo blanco con borde de las demás casillas de RESERVAS). */
function CampoTexto({ etiqueta, opcional, valor, onChange, ejemplo, datos, mayusculas = false }: { etiqueta: string; opcional?: boolean; valor: string; onChange: (v: string) => void; ejemplo: string; datos: string; mayusculas?: boolean }) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5">
      <Etiqueta opcional={opcional}>{etiqueta}</Etiqueta>
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={ejemplo}
        maxLength={60}
        autoComplete="off"
        autoCapitalize={mayusculas ? 'characters' : 'sentences'}
        data-extra-campo={datos}
        aria-label={etiqueta}
        className={`h-[52px] w-full min-w-0 rounded-[16px] border border-text/15 bg-white px-3.5 text-[16px] font-medium text-text outline-none placeholder:font-normal placeholder:text-text/35 focus:border-text/50 ${mayusculas ? 'uppercase placeholder:normal-case' : ''}`}
      />
    </label>
  )
}

export default function HojaReservaExtra({ tipo, editar, onClose, onGuardada }: { tipo: TipoExtra; /** El id de la reserva guardada que se cambia (el lápiz). */ editar?: string; onClose: () => void; onGuardada?: (reserva: ReservaExtra) => void }) {
  const route = useRouteStore((state) => state.route)
  const reservations = useRouteStore((state) => state.reservations)
  const misReservas = useMisReservas((state) => state.lista)
  const addReservation = useRouteStore((state) => state.addReservation)
  const existente = useMemo(() => [...reservations, ...misReservas].find((r) => r.id === editar && r.kind === tipo) as ReservaExtra | undefined, [reservations, misReservas, editar, tipo])
  const [b, setB] = useState<BorradorExtra>(() => (existente ? borradorDeLaReserva(existente) : borradorVacio(tipo)))
  const [paso, setPaso] = useState<1 | 2>(1)
  const grupo = useEntradasDelGrupo()
  const dinero = useDineroDeReserva({ para: existente?.paraQuien ?? null, precio: existente?.precio ?? null, pagado: existente?.pagadoPor ?? null })
  const dias = useMemo(() => (route ? diasParaElegir(route) : []), [route])
  if (!route) return null
  const conFechas = Boolean(route.answers.dateRange)
  const set = (parche: Partial<BorradorExtra>) => setB((antes) => ({ ...antes, ...parche }))
  const falta = loQueFalta(b)
  const listo = falta.length === 0
  const enGrupo = !dinero.solo
  const dosPasos = enGrupo
  const diaElegido = dias.find((day) => (conFechas ? dateOfDay(route, day) === b.dateIso : String(day.dayNumber) === b.dayNumber)) ?? null
  const esTransporte = tipo !== 'otra'

  const compania = tipo === 'ferry' ? 'Naviera' : 'Compañía'
  const alternar = (lista: string[], id: string, minimo = 0) => (lista.includes(id) ? (lista.length > minimo ? lista.filter((x) => x !== id) : lista) : [...lista, id])
  const cuenta = cuentaDelViaje(dinero.gente.length, esFamilia(route)) === 'grupo' ? 'grupo' : 'conjunta'
  const marcados = dinero.paraIds
  const nombreDeLaCuentaComun = cuenta === 'grupo' ? 'Cuenta del grupo' : 'Cuenta conjunta'

  const guardar = () => {
    if (!listo || !diaElegido) return
    const id = existente?.id ?? `res-${Date.now()}`
    const reserva = construirReservaExtra(
      b,
      { id, precio: dinero.precio.importe, ...(enGrupo ? { paraQuien: dinero.paraIds, pagadoPor: dinero.paraIds.length > 1 && dinero.precio.importe ? dinero.pagadoIds : null } : {}) },
      conFechas,
      diaElegido.dayNumber,
    )
    // (Quien mira el viaje de otra persona: la reserva es SUYA, va a su lista y no toca el viaje del dueño. Igual que las entradas.)
    if (grupo.esInvitado) useMisReservas.getState().anadir(reserva)
    else addReservation(reserva, null, null)
    onGuardada?.(reserva)
    useAnadirReservaStore.getState().cerrar()
    onClose()
  }

  const botonTexto = textoDelBoton({ normal: textoDeGuardarExtra(tipo), solo: dinero.solo, marcados, yoId: dinero.yoId, permiso: dinero.permiso, nombreAdmin: dinero.nombreAdmin })
  const pie =
    dosPasos && paso === 1 ? (
      <button type="button" disabled={!listo} data-siguiente-paso onClick={() => setPaso(2)} className="h-[54px] w-full rounded-2xl text-[16px] font-bold transition-transform active:scale-[.98] disabled:opacity-40" style={{ ...BOTON_ORO, border: 'none' }}>
        Siguiente
      </button>
    ) : (
      <button type="button" disabled={!listo} data-guardar-extra={tipo} onClick={guardar} className="h-[54px] w-full rounded-2xl text-[16px] font-bold transition-transform active:scale-[.98] disabled:opacity-40" style={{ ...BOTON_ORO, border: 'none' }}>
        {botonTexto}
      </button>
    )

  return (
    <HojaAbajo titleId="hoja-reserva-extra" onClose={onClose} capa={110} pie={pie}>
      <div data-hoja-reserva-extra={tipo} data-paso={dosPasos ? paso : 1} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <p className="max-w-[calc(100%-2.5rem)] text-text/50" style={ojoStyle}>
            {dosPasos && paso === 2 ? `${tituloDeLaHojaExtra(tipo)} · paso 2 de 2` : existente ? 'Cambiar la reserva' : 'Añadir una reserva'}
          </p>
          <h2 id="hoja-reserva-extra" className="font-display text-[28px] leading-[1.05] text-text" data-extra-titulo>
            {dosPasos && paso === 2 ? 'Casi lista' : tituloDeLaHojaExtra(tipo)}
          </h2>
          {dosPasos && paso === 2 && diaElegido && (
            <span data-casi-lista-cuando className="text-[15px] font-semibold text-text/70">
              {fichaDeDia(route, diaElegido).semana} {fichaDeDia(route, diaElegido).numero} · {b.hora}
            </span>
          )}
        </div>

        {(!dosPasos || paso === 1) && (
          <>
            {tipo === 'otra' ? (
              <CampoTexto etiqueta="Nombre" valor={b.nombre} onChange={(v) => set({ nombre: v })} ejemplo="Tour en kayak" datos="nombre" />
            ) : (
              <>
                <CampoTexto etiqueta={compania} opcional valor={b.compania} onChange={(v) => set({ compania: v })} ejemplo={tipo === 'ferry' ? 'Fred. Olsen' : tipo === 'tren' ? 'Iryo' : 'Alsa'} datos="compania" />
                <div className="flex gap-3">
                  <CampoTexto etiqueta={tipo === 'ferry' ? 'De' : 'Estación de salida'} valor={b.origen} onChange={(v) => set({ origen: v })} ejemplo={tipo === 'ferry' ? 'Órzola' : tipo === 'tren' ? 'Sants' : 'Sur'} datos="origen" />
                  <CampoTexto etiqueta={tipo === 'ferry' ? 'A' : 'Estación de llegada'} valor={b.destino} onChange={(v) => set({ destino: v })} ejemplo={tipo === 'ferry' ? 'La Graciosa' : tipo === 'tren' ? 'Atocha' : 'Aeropuerto'} datos="destino" />
                </div>
              </>
            )}

            <div className="flex flex-col gap-2" data-extra-dias>
              <Etiqueta>Día</Etiqueta>
              <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Día de tu reserva" style={{ scrollSnapType: 'x proximity' }}>
                {dias.map((day) => {
                  const iso = conFechas ? (dateOfDay(route, day) ?? '') : ''
                  const elegido = conFechas ? b.dateIso === iso : b.dayNumber === String(day.dayNumber)
                  const ficha = fichaDeDia(route, day)
                  return (
                    <button
                      key={day.id}
                      type="button"
                      aria-pressed={elegido}
                      data-dia-cuadrado={day.id}
                      data-elegida={elegido ? '1' : '0'}
                      onClick={() => set(conFechas ? { dateIso: iso, dayNumber: '' } : { dayNumber: String(day.dayNumber), dateIso: '' })}
                      className="relative flex h-[72px] w-[72px] flex-none flex-col items-center justify-center gap-0.5 rounded-2xl"
                      style={{ scrollSnapAlign: 'start', border: `1px solid ${elegido ? '#1C2230' : 'rgba(28,34,48,.14)'}`, background: elegido ? '#1C2230' : '#FFFDF8', color: elegido ? '#FBF3E2' : '#1C2230' }}
                    >
                      <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.12em', opacity: 0.7 }}>{ficha.semana}</span>
                      <span style={{ font: "400 26px/1 'Instrument Serif',serif" }}>{ficha.numero}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5" data-extra-hora>
                <Etiqueta>{tipo === 'otra' ? 'Hora' : 'Hora de salida'}</Etiqueta>
                <CampoDeHora valor={b.hora || null} onChange={(h) => set({ hora: h ?? '' })} titulo={tipo === 'otra' ? 'Hora de la reserva' : 'Hora de salida'} ejemplo={tipo === 'ferry' ? '10:00' : tipo === 'tren' ? '08:30' : '14:30'} quitable={false} datos={`extra-${tipo}-hora`} />
              </div>
              {esTransporte && (
                <div className="flex min-w-0 flex-1 flex-col gap-1.5" data-extra-llegada>
                  <Etiqueta opcional>Llega</Etiqueta>
                  <CampoDeHora valor={b.llegada || null} onChange={(h) => set({ llegada: h ?? '' })} titulo="Hora de llegada" ejemplo={tipo === 'ferry' ? '10:45' : tipo === 'tren' ? '11:15' : '15:00'} quitable datos={`extra-${tipo}-llegada`} />
                </div>
              )}
            </div>

            {tipo === 'otra' && <CampoTexto etiqueta="Lugar" opcional valor={b.lugar} onChange={(v) => set({ lugar: v })} ejemplo="Playa de Famara" datos="lugar" />}
            {tipo === 'tren' && (
              <div className="flex gap-3">
                <CampoTexto etiqueta="Coche" opcional valor={b.coche} onChange={(v) => set({ coche: v })} ejemplo="5" datos="coche" />
                <CampoTexto etiqueta="Asiento" opcional valor={b.asiento} onChange={(v) => set({ asiento: v })} ejemplo="12A" datos="asiento" mayusculas />
              </div>
            )}
            <CampoTexto etiqueta="Localizador" opcional valor={b.localizador} onChange={(v) => set({ localizador: v })} ejemplo="K7M2QX" datos="localizador" mayusculas />
          </>
        )}

        {/* (V45 §4 y R3h) Paso 2 en grupo: «Casi lista», con «¿A qué cuenta lo sumamos?» y lo de siempre (para quién, quién la ha pagado). Viajando solo, solo el precio. */}
        {dosPasos && paso === 2 && (
          <div className="flex flex-col gap-2.5" data-a-que-cuenta>
            <span style={ESTILO_PREGUNTA}>¿A qué cuenta lo sumamos?</span>
            <div className="flex gap-2">
              {([
                { id: 'mia', etiqueta: 'Mi cuenta', activa: marcados.length <= 1 },
                { id: 'comun', etiqueta: nombreDeLaCuentaComun, activa: marcados.length > 1 },
              ] as const).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={o.activa}
                  data-cuenta-opcion={o.id}
                  onClick={() => dinero.setPara(o.id === 'mia' ? (dinero.yoId ? [dinero.yoId] : []) : dinero.personas.map((p) => p.id))}
                  className="flex h-[52px] min-w-0 flex-1 items-center justify-center rounded-2xl px-3 text-[14.5px] font-bold"
                  style={o.activa ? { background: '#1C2230', color: '#F3D88F', border: '1px solid #1C2230' } : { background: '#FFFDF8', color: '#1C2230', border: '1px solid rgba(28,34,48,.14)' }}
                >
                  {o.etiqueta}
                </button>
              ))}
            </div>
          </div>
        )}
        {(!dosPasos || paso === 2) && (
          <div data-para-quien={dosPasos ? '' : undefined} data-extra-dinero>
            <BloqueDinero
              sinLineas
              quienSinPrecio={dosPasos}
              tipo="excursion"
              pregunta={tipo === 'otra' ? '¿Para quién es la reserva?' : `¿Para quién es el ${tipo === 'bus' ? 'autobús' : tipo}?`}
              solo={dinero.solo}
              personas={dinero.personas}
              yoId={dinero.yoId}
              paraQuien={marcados}
              onParaQuien={(id) => dinero.setPara(alternar(marcados, id, 1))}
              precio={dinero.precio}
              pagadoPor={dinero.pagadoIds}
              onPagadoPor={(id) => dinero.setPagado(alternar(dinero.pagadoIds, id))}
              cuenta={cuenta}
              permiso={dinero.permiso}
              nombreAdmin={dinero.nombreAdmin}
            />
          </div>
        )}
      </div>
    </HojaAbajo>
  )
}
