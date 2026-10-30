import { useState, type CSSProperties, type ReactNode } from 'react'
import { fechaCorta } from '../../../lib/nombreDeDia'
import { Icono } from '../../ui/Icono'
import { RuedaDeHora } from '../../ui/RuedaDeHora'
import { ESTILO_PREGUNTA } from '../../ui/PersonasCuadradas'
import { HojaAbajo } from './HojaAbajo'
import { LineaDelPase } from '../../pase/Candado'
import type { NombreIcono } from '../../../lib/iconos'

/**
 * LA HOJA DEL VUELO (Tanda 10N9; `Piezas/Reservas Cada Uno` 02 y 02b), la misma para quien pone el suyo (invitado) y para el administrador: las pestañas Ida / Vuelta (con el resumen «✓ Ida · mar 10 · 11:15» de la otra),
 * el día, el aeropuerto, la rueda de la hora de dos columnas (hora : minutos) y, pegado al pie de la hoja, UN solo botón «Guardar el vuelo». Sin precio. La rueda NO tiene [Guardar]: nada se guarda hasta pulsar el botón.
 */
export interface LadoDeHoja {
  /** false = ese lado va en coche: no se edita. */
  activo: boolean
  hora: string | null
  punto: string | null
  /** «yyyy-mm-dd» del día (el elegido, o el único del viaje). */
  fecha: string | null
  /** Ya había algo guardado en este lado. */
  hecho: boolean
  /** Los días que se ofrecen (el invitado: los tres primeros o últimos). Con `diasFijos`, solo el del viaje y no se puede cambiar. */
  dias: { iso: string; texto: string }[]
  diasFijos?: boolean
  /** Los puntos para elegir (Fiumicino, Ciampino…). */
  puntos: string[]
  /** «Aeropuerto», «Estación», «Puerto». */
  etiquetaPunto: string
  /** Con un solo punto o ninguno, un campo de texto libre (el invitado). */
  puntoLibre?: boolean
  /** Hay que elegir el punto para guardar este lado (el administrador, con varios puntos). */
  puntoObligatorio?: boolean
  llega: boolean
  /** (10S5) Ya viene tocado (los datos se han leído de un billete y hay que guardarlos aunque el viajero no toque nada). */
  tocado?: boolean
  /** (10N10, 10S3) Las casillas de Design: el otro lado (casilla en blanco para escribir y su hora, opcionales), referencia y aerolínea. Solo el administrador las lleva. */
  extras?: { codigo: string; compania: string; otroPunto: string; otraHora: string | null; /** (10S5) «Barcelona (El Prat)»: lo que sale en «Sales de» / «Llegas a» mientras el viajero no haya escrito nada (la ciudad de la primera pantalla y, si solo tiene un aeropuerto, el aeropuerto). */ otroPuntoPorDefecto?: string; /** (10S5) Lo privado del billete: localizador, terminal, asiento y (tren, autobús) coche. */ privados?: { localizador: string; terminal: string; asiento: string; coche: string }; conCoche?: boolean; etiquetaCodigo?: string; etiquetaCompania?: string; /** El icono del medio, en medio de los dos lados. */ icono: NombreIcono }
}
export interface LadoGuardado {
  hora: string
  punto: string | null
  fecha: string | null
  /** El viajero ha tocado este lado en esta hoja (o ya estaba hecho). */
  puesto: boolean
  codigo: string
  compania: string
  otroPunto: string
  otraHora: string | null
  localizador: string
  terminal: string
  asiento: string
  coche: string
}

const HORA_DE_SERIE = { ida: '11:15', vuelta: '18:05' } as const
const etiquetaMono: CSSProperties = { font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: '#6F4E37' }

function Pastilla({ activa, onClick, children, dato }: { activa: boolean; onClick?: () => void; children: ReactNode; dato?: Record<string, string> }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      {...dato}
      className="zona-toque inline-flex h-10 items-center gap-1.5 rounded-full px-[15px] text-[14px] font-semibold"
      style={activa ? { background: '#1C2230', color: '#F3D88F' } : { background: '#FFFDF8', border: '1px solid rgba(28,34,48,.18)', color: '#1C2230' }}
    >
      {activa && <Icono nombre="hecho" size={14} grosor={3} style={{ color: '#E9C77A' }} />}
      {children}
    </button>
  )
}

export function HojaDelVuelo({
  titulo = 'Tu vuelo',
  textoGuardar = 'Guardar el vuelo',
  lados,
  extra,
  avisoFechas,
  onGuardar,
  onQuitar,
  textoQuitar = 'Quitar el mío',
  onClose,
  ladoInicial = 'ida',
  datos = 'mi-vuelo',
  guardaSiempre = false,
  aviso,
  tarjeta,
}: {
  titulo?: string
  textoGuardar?: string
  lados: { ida: LadoDeHoja; vuelta: LadoDeHoja }
  extra?: ReactNode
  /** «¿Llegas o te vas otro día? Cambia las fechas del viaje» (el administrador). */
  avisoFechas?: ReactNode
  onGuardar: (ida: LadoGuardado, vuelta: LadoGuardado) => void
  onQuitar?: () => void
  textoQuitar?: string
  onClose: () => void
  ladoInicial?: 'ida' | 'vuelta'
  datos?: string
  /** El invitado guarda siempre los dos lados con lo que enseña la rueda (como antes); el administrador, solo los que ha puesto (no se inventa ninguna hora). */
  guardaSiempre?: boolean
  /** (10S5) «Hemos leído tu billete. Revísalo.» arriba, tras añadir el PDF o la foto. */
  aviso?: ReactNode
  /** (10S5) El bloque de la tarjeta de embarque (cambiar el archivo o quitarla), debajo de los datos. */
  tarjeta?: ReactNode
}) {
  const primero = lados[ladoInicial].activo ? ladoInicial : ladoInicial === 'ida' ? 'vuelta' : 'ida'
  const [lado, setLado] = useState<'ida' | 'vuelta'>(primero)
  const [borrador, setBorrador] = useState(() => {
    const parte = (k: 'ida' | 'vuelta') => ({ hora: lados[k].hora ?? HORA_DE_SERIE[k], punto: lados[k].punto, fecha: lados[k].fecha ?? lados[k].dias[0]?.iso ?? null, tocado: lados[k].tocado ?? false, codigo: lados[k].extras?.codigo ?? '', compania: lados[k].extras?.compania ?? '', otroPunto: lados[k].extras?.otroPunto || lados[k].extras?.otroPuntoPorDefecto || '', otraHora: lados[k].extras?.otraHora ?? null, localizador: lados[k].extras?.privados?.localizador ?? '', terminal: lados[k].extras?.privados?.terminal ?? '', asiento: lados[k].extras?.privados?.asiento ?? '', coche: lados[k].extras?.privados?.coche ?? '' })
    return { ida: parte('ida'), vuelta: parte('vuelta') }
  })
  const cambia = (k: 'ida' | 'vuelta', cambio: Partial<{ hora: string; punto: string | null; fecha: string | null; codigo: string; compania: string; otroPunto: string; otraHora: string | null; localizador: string; terminal: string; asiento: string; coche: string }>) => setBorrador((previo) => ({ ...previo, [k]: { ...previo[k], ...cambio, tocado: previo[k].tocado || 'hora' in cambio || 'punto' in cambio || 'fecha' in cambio } }))

  const [ruedaAbierta, setRuedaAbierta] = useState<'roma' | 'otra' | null>(null)
  const l = lados[lado]
  const b = borrador[lado]
  const elegida = (k: 'ida' | 'vuelta') => lados[k].activo && (lados[k].hecho || borrador[k].tocado)
  const puesto = (k: 'ida' | 'vuelta') => lados[k].activo && (guardaSiempre || elegida(k))
  const resumen = (k: 'ida' | 'vuelta') => `${k === 'ida' ? 'Ida' : 'Vuelta'}${borrador[k].fecha ? ` · ${fechaCorta(borrador[k].fecha as string)}` : ''} · ${borrador[k].hora}`
  // Cada lado que se va a guardar con punto obligatorio y sin punto frena el botón.
  const faltaPunto = (['ida', 'vuelta'] as const).find((k) => puesto(k) && lados[k].puntoObligatorio && lados[k].puntos.length > 0 && !borrador[k].punto) ?? null
  const hayAlgo = puesto('ida') || puesto('vuelta')
  const puedeGuardar = hayAlgo && !faltaPunto
  const guardar = () => {
    if (!puedeGuardar) return
    const salida = (k: 'ida' | 'vuelta'): LadoGuardado => ({ hora: borrador[k].hora, punto: borrador[k].punto, fecha: borrador[k].fecha, puesto: puesto(k), codigo: borrador[k].codigo, compania: borrador[k].compania, otroPunto: borrador[k].otroPunto, otraHora: borrador[k].otraHora, localizador: borrador[k].localizador, terminal: borrador[k].terminal, asiento: borrador[k].asiento, coche: borrador[k].coche })
    onGuardar(salida('ida'), salida('vuelta'))
  }
  const pestanas = (['ida', 'vuelta'] as const).filter((k) => lados[k].activo)
  const campo = 'h-12 w-full rounded-[14px] border border-text/15 bg-white px-3.5 text-[15px] text-text outline-none focus:border-text/50'
  const pie = (
    <>
      {faltaPunto && (
        <p className="mb-2 text-center text-[12.5px] text-text/60" data-vuelo-falta-punto>
          Elige primero {lados[faltaPunto].etiquetaPunto === 'Aeropuerto' ? 'el aeropuerto' : lados[faltaPunto].etiquetaPunto === 'Puerto' ? 'el puerto' : 'la estación'} {faltaPunto === 'ida' ? 'de la ida' : 'de la vuelta'}
        </p>
      )}
      <button
        type="button"
        onClick={guardar}
        disabled={!puedeGuardar}
        data-mi-vuelo-guardar
        data-guardar-vuelo={datos}
        className="h-[54px] w-full rounded-full btn-champan text-[16px] font-bold transition-transform active:scale-[.98] disabled:opacity-40"
      >
        {textoGuardar}
      </button>
      {onQuitar && (
        <button type="button" onClick={onQuitar} data-mi-vuelo-quitar className="mt-1.5 w-full py-2 text-center text-[13px] font-semibold text-text/60 underline underline-offset-2">
          {textoQuitar}
        </button>
      )}
    </>
  )
  const cajaDeDesign = 'flex h-[54px] min-w-0 flex-1 flex-col justify-center gap-px rounded-[15px] border bg-[#FFFDF8] px-3.5'
  const etiquetaDeCaja: CSSProperties = { font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.12em', color: 'rgba(28,34,48,.5)', textTransform: 'uppercase' }
  const tituloDeLado = (texto: string, opcional: boolean) => (
    <div className="flex items-baseline justify-between">
      <span style={{ font: "700 14.5px 'Geist'", color: '#1C2230' }}>{texto}</span>
      {opcional && <span style={{ font: "500 12px 'Geist Mono',monospace", color: 'rgba(28,34,48,.5)' }}>opcional</span>}
    </div>
  )
  const sale = lado === 'ida' ? 'Sales de' : 'Llegas a'
  /* El lado de fuera (Barcelona): casilla en blanco para escribir, opcional. La app no propone nada. */
  const bloqueOtroPunto = (
    <div className="flex flex-col gap-3" data-mi-vuelo-otro-lado>
      {tituloDeLado(sale, true)}
      <input
        value={b.otroPunto}
        onChange={(e) => cambia(lado, { otroPunto: e.target.value })}
        maxLength={60}
        autoComplete="off"
        aria-label={sale}
        data-mi-vuelo-otro-punto
        className="h-[54px] w-full min-w-0 rounded-[15px] border bg-[#FFFDF8] px-3.5 text-[15px] font-medium text-text outline-none focus:border-text/50"
        style={{ borderColor: 'rgba(28,34,48,.12)' }}
      />
    </div>
  )
  const campoDeHora = (clave: 'roma' | 'otra', etiqueta: string, valor: string | null, datos: Record<string, string>, datosValor: Record<string, string>) => (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => {
          if (clave === 'otra' && !b.otraHora && ruedaAbierta !== 'otra') cambia(lado, { otraHora: lado === 'ida' ? '08:30' : '20:35' })
          setRuedaAbierta((v) => (v === clave ? null : clave))
        }}
        aria-expanded={ruedaAbierta === clave ? true : false}
        {...datos}
        className="flex h-[54px] w-full items-center gap-2 rounded-[15px] border bg-[#FFFDF8] px-3.5 text-left"
        style={{ borderColor: 'rgba(28,34,48,.12)' }}
      >
        <span className="flex min-w-0 flex-1 flex-col gap-px">
          <span style={etiquetaDeCaja}>{etiqueta}</span>
          <span className="text-[15px] font-medium text-text" {...datosValor}>
            {valor ?? '—'}
          </span>
        </span>
        <Icono nombre="reloj" size={18} style={{ color: 'rgba(28,34,48,.4)' }} />
      </button>
      {ruedaAbierta === clave && (
        <div data-mi-vuelo-rueda>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span style={etiquetaMono}>{(clave === 'roma') === l.llega ? 'Hora de llegada' : 'Hora de salida'}</span>
            <span className="text-[12px] font-semibold text-text/55">{valor}</span>
          </div>
          <RuedaDeHora value={(clave === 'roma' ? b.hora : b.otraHora) ?? '08:30'} onChange={(h) => cambia(lado, clave === 'roma' ? { hora: h } : { otraHora: h })} label={(clave === 'roma') === l.llega ? 'Hora de llegada' : 'Hora de salida'} />
          <p className="mt-2 text-center text-[12px] text-text/55">Toca fuera para cerrar: la hora se queda puesta</p>
          {clave === 'otra' && (
            <button
              type="button"
              onClick={() => {
                cambia(lado, { otraHora: null })
                setRuedaAbierta(null)
              }}
              data-mi-vuelo-otra-hora-quitar
              className="mt-1 w-full py-1.5 text-center text-[13px] font-semibold text-text/60 underline underline-offset-2"
            >
              Quitar la hora
            </button>
          )}
        </div>
      )}
    </div>
  )
  const campoHoraRoma = campoDeHora('roma', l.llega ? 'Llega a las' : 'Sale a las', b.hora, { 'data-mi-vuelo-campo-hora': '' }, { 'data-mi-vuelo-hora': '' })
  const campoHoraOtra = campoDeHora('otra', lado === 'ida' ? 'Sale a las · opcional' : 'Llega a las · opcional', b.otraHora, { 'data-mi-vuelo-otra-hora': '' }, { 'data-mi-vuelo-otra-hora-valor': '' })
  /* El lado de Roma: Fiumicino o Ciampino (o Termini y Tiburtina, o el puerto) en cuadrados. */
  const bloquePuntoRoma = (
    <div className="flex flex-col gap-3" data-mi-vuelo-punto-lista>
      {tituloDeLado(l.llega ? 'Llegas a' : 'Sales de', false)}
      <div className="flex gap-2">
        {l.puntos.map((p) => {
          const activa = (b.punto ?? (l.puntos.length === 1 ? p : null)) === p
          return (
            <button
              key={p}
              type="button"
              aria-pressed={activa}
              data-mi-vuelo-punto-opcion={p}
              onClick={() => cambia(lado, { punto: p })}
              className="flex h-[54px] flex-1 items-center justify-center gap-1.5 rounded-[16px] px-2 text-[15px] font-semibold"
              style={activa ? { background: '#1C2230', color: '#FBF3E2', border: '1px solid #1C2230' } : { background: '#FFFDF8', border: '1px solid rgba(28,34,48,.14)', color: '#1C2230' }}
            >
              {activa && <Icono nombre="hecho" size={15} grosor={2.6} style={{ color: '#F3D88F' }} />}
              {p}
            </button>
          )
        })}
      </div>
    </div>
  )
  const divisor = l.extras ? (
    <div className="flex items-center gap-2.5 py-px" aria-hidden="true" data-mi-vuelo-medio>
      <span className="h-px flex-1" style={{ background: 'rgba(28,34,48,.16)' }} />
      <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: '#FFFDF8', border: '1.5px solid #B58A2E', color: '#1C2230' }}>
        <Icono nombre={l.extras.icono} size={15} style={{ transform: l.extras.icono === 'avion' ? 'rotate(45deg)' : undefined }} />
      </span>
      <span className="h-px flex-1" style={{ background: 'rgba(28,34,48,.16)' }} />
    </div>
  ) : null
  /* (10N11 §4) Sin pase, la línea en gris con el candado; con pase, nada. (10S3) Va en los dos lados: en la ida debajo de «Llega a las» y en la vuelta debajo de «Sale a las». */
  const lineaPase = <LineaDelPase clave="vuelo" datos="vuelo-hoja" texto="Con el {pase}, adaptamos tu primer y tu último día a tus vuelos." />
  return (
    <HojaAbajo titleId="hoja-mi-vuelo" onClose={onClose} capa={110} pie={pie}>
      <h2 id="hoja-mi-vuelo" className="max-w-[calc(100%-3rem)] font-display text-[32px] leading-[1.05] text-text">
        {titulo}
      </h2>
      {aviso}
      {pestanas.length > 1 && (
        <div className="mt-4 grid grid-cols-2 gap-2" role="tablist">
          {pestanas.map((k) => {
            const activa = lado === k
            const mostrarResumen = !activa && elegida(k)
            return (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={activa}
                data-mi-vuelo-lado={k}
                onClick={() => setLado(k)}
                className="flex h-11 items-center justify-center gap-1.5 rounded-[14px] text-[14px] font-semibold"
                style={activa ? { background: '#1C2230', color: '#F3D88F' } : { background: '#FFFDF8', border: '1px solid rgba(28,34,48,.18)', color: '#1C2230' }}
              >
                {mostrarResumen && <Icono nombre="hecho" size={14} grosor={3} style={{ color: '#2B7F45' }} />}
                <span data-mi-vuelo-resumen={mostrarResumen ? '1' : undefined}>{mostrarResumen ? resumen(k) : k === 'ida' ? 'Ida' : 'Vuelta'}</span>
              </button>
            )
          })}
        </div>
      )}
      {l.dias.length > 0 && (
        <div className="mt-5" data-mi-vuelo-dias>
          <span style={ESTILO_PREGUNTA}>{l.llega ? 'Día de llegada' : l.extras ? 'Día de vuelta' : 'Día de salida'}</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {l.dias.map((d) =>
              l.diasFijos ? (
                <span key={d.iso} data-mi-vuelo-dia={d.iso} className="flex h-11 w-full items-center gap-2 rounded-[14px] px-3.5 text-[14px] font-semibold" style={{ background: '#F5E3AE', color: '#6F4E37' }}>
                  <Icono nombre="dias" size={15} />
                  {d.texto.charAt(0).toUpperCase() + d.texto.slice(1)}
                </span>
              ) : (
                <Pastilla key={d.iso} activa={b.fecha === d.iso} onClick={() => cambia(lado, { fecha: d.iso })} dato={{ 'data-mi-vuelo-dia': d.iso }}>
                  {d.texto.charAt(0).toUpperCase() + d.texto.slice(1)}
                </Pastilla>
              ),
            )}
          </div>
        </div>
      )}
      {l.extras ? (
        <div className="mt-5 flex flex-col gap-3" data-mi-vuelo-lados={lado}>
          {lado === 'ida' ? (
            <>
              {bloqueOtroPunto}
              {campoHoraOtra}
              {divisor}
              {bloquePuntoRoma}
              {campoHoraRoma}
              {lineaPase}
            </>
          ) : (
            <>
              {bloquePuntoRoma}
              {campoHoraRoma}
              {lineaPase}
              {divisor}
              {bloqueOtroPunto}
              {campoHoraOtra}
            </>
          )}
          <div className="flex gap-2">
            <label className={cajaDeDesign} style={{ borderColor: 'rgba(28,34,48,.12)' }}>
              <span style={etiquetaDeCaja}>{l.extras.etiquetaCodigo ?? 'Ref. vuelo'}</span>
              <input value={b.codigo} onChange={(e) => cambia(lado, { codigo: e.target.value })} maxLength={20} placeholder="AB 1234" autoComplete="off" autoCapitalize="characters" data-mi-vuelo-codigo className="w-full min-w-0 bg-transparent text-[15px] font-medium uppercase outline-none placeholder:font-normal placeholder:normal-case placeholder:text-text/40" />
            </label>
            <label className={cajaDeDesign} style={{ borderColor: 'rgba(28,34,48,.12)' }}>
              <span style={etiquetaDeCaja}>{l.extras.etiquetaCompania ?? 'Aerolínea'}</span>
              <input value={b.compania} onChange={(e) => cambia(lado, { compania: e.target.value })} maxLength={40} placeholder="Opcional" autoComplete="off" data-mi-vuelo-compania className="w-full min-w-0 bg-transparent text-[15px] font-medium outline-none placeholder:font-normal placeholder:text-text/40" />
            </label>
          </div>
          {l.extras.privados && (
            <div className="flex flex-wrap gap-2" data-mi-vuelo-privados>
              {([
                ['localizador', 'Localizador', 'ABC123', true],
                [l.extras.conCoche ? 'coche' : 'terminal', l.extras.conCoche ? 'Coche' : 'Terminal', l.extras.conCoche ? '003' : '1', false],
                ['asiento', 'Asiento', l.extras.conCoche ? '01D' : '14C', true],
              ] as const).map(([clave, etiqueta, ejemplo, mayus]) => (
                <label key={clave} className={cajaDeDesign} style={{ borderColor: 'rgba(28,34,48,.12)', flexBasis: 'calc(50% - 4px)', flexGrow: 0 }}>
                  <span style={etiquetaDeCaja}>{etiqueta}</span>
                  <input value={b[clave]} onChange={(e) => cambia(lado, { [clave]: e.target.value })} maxLength={20} placeholder={`Opcional · ${ejemplo}`} autoComplete="off" autoCapitalize={mayus ? 'characters' : 'off'} data-mi-vuelo-privado={clave} className={`w-full min-w-0 bg-transparent text-[15px] font-medium outline-none placeholder:font-normal placeholder:normal-case placeholder:text-text/40 ${mayus ? 'uppercase' : ''}`} />
                </label>
              ))}
              <span className="w-full text-[12px] leading-[1.35] text-text/55" data-mi-vuelo-privados-nota>
                Solo lo ves tú: se guarda en tu móvil y se ve sin internet.
              </span>
            </div>
          )}
          {tarjeta}
        </div>
      ) : (
        <>
        {l.puntos.length > 1 ? (
          <div className="mt-5" data-mi-vuelo-punto-lista>
            <span style={ESTILO_PREGUNTA}>
              {l.llega
                ? l.etiquetaPunto === 'Aeropuerto' ? '¿A qué aeropuerto llegas?' : l.etiquetaPunto === 'Puerto' ? '¿A qué puerto llegas?' : '¿A qué estación llegas?'
                : l.etiquetaPunto === 'Aeropuerto' ? '¿De qué aeropuerto sales?' : l.etiquetaPunto === 'Puerto' ? '¿De qué puerto sales?' : '¿De qué estación sales?'}
            </span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {l.puntos.map((p) => {
                const activa = b.punto === p
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={activa}
                    data-mi-vuelo-punto-opcion={p}
                    onClick={() => cambia(lado, { punto: p })}
                    className="flex h-[52px] items-center justify-center gap-1.5 rounded-[16px] px-2 text-[14.5px] font-semibold"
                    style={activa ? { background: '#1C2230', color: '#FBF3E2' } : { background: '#FFFDF8', border: '1px solid rgba(28,34,48,.14)', color: '#1C2230' }}
                  >
                    {activa && <Icono nombre="hecho" size={14} grosor={3} style={{ color: '#E9C77A' }} />}
                    {p}
                  </button>
                )
              })}
            </div>
          </div>
        ) : l.puntoLibre ? (
          <label className="mt-5 flex flex-col gap-1.5">
            <span style={ESTILO_PREGUNTA}>{lado === 'ida' ? '¿Dónde llegas? (opcional)' : '¿De dónde sales? (opcional)'}</span>
            <input value={b.punto ?? ''} onChange={(e) => cambia(lado, { punto: e.target.value })} maxLength={40} placeholder="Ciampino" autoComplete="off" data-mi-vuelo-punto className={campo} />
          </label>
        ) : null}
        <button type="button" onClick={() => setRuedaAbierta((v) => (v ? null : 'roma'))} aria-expanded={ruedaAbierta !== null} data-mi-vuelo-campo-hora className="mt-4 flex h-[60px] w-full items-center justify-between rounded-[16px] border border-text/15 bg-white px-3.5 text-left">
          <span className="flex flex-col gap-0.5">
            <span style={{ ...etiquetaMono, fontSize: 10 }}>{l.llega ? 'Llega' : 'Sale'}</span>
            <span className="text-[17px] font-medium text-text" data-mi-vuelo-hora>
              {b.hora}
            </span>
          </span>
          <Icono nombre="reloj" size={16} style={{ color: 'rgba(28,34,48,.5)' }} />
        </button>
        {ruedaAbierta && (
          <div className="mt-2" data-mi-vuelo-rueda>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span style={etiquetaMono}>{l.llega ? 'Hora de llegada' : 'Hora de salida'}</span>
              <span className="text-[12px] font-semibold text-text/55">{b.hora}</span>
            </div>
            <RuedaDeHora value={b.hora} onChange={(h) => cambia(lado, { hora: h })} label={l.llega ? 'Hora de llegada' : 'Hora de salida'} />
            <p className="mt-2 text-center text-[12px] text-text/55">Toca fuera para cerrar: la hora se queda puesta</p>
          </div>
        )}
        </>
      )}
      {l.dias.length > 0 && avisoFechas}
      {extra && <div className="mt-6 flex flex-col gap-5" data-mi-vuelo-extra>{extra}</div>}
    </HojaAbajo>
  )
}
