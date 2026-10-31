import { useState, type ReactNode } from 'react'
import { fechaCorta } from '../../../lib/nombreDeDia'
import { Icono } from '../../ui/Icono'
import { CampoDeHora } from '../../ui/HojaDeHora'
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
  extras?: { codigo: string; compania: string; otroPunto: string; otraHora: string | null; /** (10S5) «Barcelona (El Prat)»: lo que sale en «Sales de» / «Llegas a» mientras el viajero no haya escrito nada (la ciudad de la primera pantalla y, si solo tiene un aeropuerto, el aeropuerto). */ /** (10S6) El ejemplo en gris de la casilla cuando la ciudad tiene varios aeropuertos: «Londres (Heathrow)». */ otroPuntoEjemplo?: string; otroPuntoPorDefecto?: string; /** (10S5) Lo privado del billete: localizador, terminal, asiento y (tren, autobús) coche. */ privados?: { localizador: string; terminal: string; asiento: string; coche: string }; conCoche?: boolean; etiquetaCodigo?: string; etiquetaCompania?: string; /** El icono del medio, en medio de los dos lados. */ icono: NombreIcono }
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
  const tituloDeLado = (texto: string, opcional: boolean) => (
    <div className="flex items-baseline justify-between">
      <span style={{ font: "700 14.5px 'Geist'", color: '#1C2230' }}>{texto}</span>
      {opcional && <span style={{ font: "500 12px 'Geist Mono',monospace", color: 'rgba(28,34,48,.5)' }}>opcional</span>}
    </div>
  )
  // (10S6) «Llegas a» hacía pensar en Roma: el lado de fuera de la vuelta es «Aeropuerto de llegada» (estación, puerto); el de la ida sigue siendo «Sales de».
  const sale = lado === 'ida' ? 'Sales de' : `${l.etiquetaPunto} de llegada`
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
        placeholder={l.extras?.otroPuntoEjemplo ?? ''}
        data-mi-vuelo-otro-punto
        className="h-[54px] w-full min-w-0 rounded-[15px] border bg-[#FFFDF8] px-3.5 text-[15px] font-medium text-text outline-none placeholder:font-normal placeholder:text-text/35 focus:border-text/50"
        style={{ borderColor: 'rgba(28,34,48,.12)' }}
      />
    </div>
  )
  /* (10S6) La hora, siempre igual en toda la app: la casilla abre la hoja de la hora desde abajo (✓ guarda, papelera quita, tocar fuera guarda). Vacía: hora de ejemplo en gris y el reloj, sin raya. */
  const claseCaja = 'flex h-[54px] w-full items-center justify-between rounded-[15px] border bg-[#FFFDF8] px-3.5 text-left'
  const campoHoraRoma = (
    <div data-mi-vuelo-campo-hora>
      <CampoDeHora valor={b.hora} onChange={(h) => h && cambia(lado, { hora: h })} titulo={l.llega ? 'Hora de llegada' : 'Hora de salida'} etiqueta={l.llega ? 'Llega a las' : 'Sale a las'} ejemplo={HORA_DE_SERIE[lado]} quitable={false} className={claseCaja} datos="roma" />
    </div>
  )
  const campoHoraOtra = (
    <div data-mi-vuelo-otra-hora>
      <CampoDeHora valor={b.otraHora} onChange={(h) => cambia(lado, { otraHora: h })} titulo={lado === 'ida' ? 'Hora de salida' : 'Hora de llegada'} etiqueta={lado === 'ida' ? 'Sale a las · opcional' : 'Llega a las · opcional'} ejemplo={lado === 'ida' ? '08:30' : '20:35'} className={claseCaja} datos="otra" />
    </div>
  )
  /* El lado de Roma: Fiumicino o Ciampino (o Termini y Tiburtina, o el puerto) en cuadrados. */
  const bloquePuntoRoma = (
    <div className="flex flex-col gap-3" data-mi-vuelo-punto-lista>
      {tituloDeLado(`${l.etiquetaPunto} de ${l.llega ? 'llegada' : 'salida'}`, false)}
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
  // (10S6) 10 px más de espacio arriba y 10 px más abajo.
  const lineaPase = (
    <div className="py-[10px] empty:hidden" data-vuelo-linea-pase>
      <LineaDelPase clave="vuelo" datos="vuelo-hoja" texto="Con el {pase}, adaptamos tu primer y tu último día a tus vuelos." />
    </div>
  )
  return (
    <HojaAbajo titleId="hoja-mi-vuelo" onClose={onClose} capa={110} pie={pie}>
      <h2 id="hoja-mi-vuelo" className="max-w-[calc(100%-3rem)] font-display text-[32px] leading-[1.05] text-text">
        {titulo}
      </h2>
      {aviso}
      {tarjeta}
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
        </div>
      ) : (
        <>
        {l.puntos.length > 1 ? (
          <div className="mt-5" data-mi-vuelo-punto-lista>
            <span style={ESTILO_PREGUNTA}>
              {l.llega
                ? `${l.etiquetaPunto} de llegada`
                : `${l.etiquetaPunto} de salida`}
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
            <span style={ESTILO_PREGUNTA}>{`${l.etiquetaPunto} de ${lado === 'ida' ? 'llegada' : 'salida'} (opcional)`}</span>
            <input value={b.punto ?? ''} onChange={(e) => cambia(lado, { punto: e.target.value })} maxLength={40} placeholder="Ciampino" autoComplete="off" data-mi-vuelo-punto className={campo} />
          </label>
        ) : null}
        <div className="mt-4" data-mi-vuelo-campo-hora>
          <CampoDeHora valor={b.hora} onChange={(h) => h && cambia(lado, { hora: h })} titulo={l.llega ? 'Hora de llegada' : 'Hora de salida'} etiqueta={l.llega ? 'Llega' : 'Sale'} ejemplo={HORA_DE_SERIE[lado]} quitable={false} datos="roma" />
        </div>
        </>
      )}
      {extra && <div className="mt-6 flex flex-col gap-5" data-mi-vuelo-extra>{extra}</div>}
    </HojaAbajo>
  )
}
