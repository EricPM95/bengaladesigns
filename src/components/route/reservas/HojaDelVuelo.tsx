import { useState, type CSSProperties, type ReactNode } from 'react'
import { fechaCorta } from '../../../lib/nombreDeDia'
import { Icono } from '../../ui/Icono'
import { RuedaDeHora } from '../../ui/RuedaDeHora'
import { HojaAbajo, ojoStyle } from './HojaAbajo'

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
}
export interface LadoGuardado {
  hora: string
  punto: string | null
  fecha: string | null
  /** El viajero ha tocado este lado en esta hoja (o ya estaba hecho). */
  puesto: boolean
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
      className="inline-flex h-10 items-center gap-1.5 rounded-full px-[15px] text-[14px] font-semibold"
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
}) {
  const primero = lados[ladoInicial].activo ? ladoInicial : ladoInicial === 'ida' ? 'vuelta' : 'ida'
  const [lado, setLado] = useState<'ida' | 'vuelta'>(primero)
  const [borrador, setBorrador] = useState(() => {
    const parte = (k: 'ida' | 'vuelta') => ({ hora: lados[k].hora ?? HORA_DE_SERIE[k], punto: lados[k].punto, fecha: lados[k].fecha ?? lados[k].dias[0]?.iso ?? null, tocado: false })
    return { ida: parte('ida'), vuelta: parte('vuelta') }
  })
  const cambia = (k: 'ida' | 'vuelta', cambio: Partial<{ hora: string; punto: string | null; fecha: string | null }>) => setBorrador((previo) => ({ ...previo, [k]: { ...previo[k], ...cambio, tocado: true } }))

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
    const salida = (k: 'ida' | 'vuelta'): LadoGuardado => ({ hora: borrador[k].hora, punto: borrador[k].punto, fecha: borrador[k].fecha, puesto: puesto(k) })
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
  return (
    <HojaAbajo titleId="hoja-mi-vuelo" onClose={onClose} capa={110} pie={pie}>
      <p className="max-w-[calc(100%-2.5rem)]" style={{ ...ojoStyle, color: '#6F4E37', letterSpacing: '.18em' }}>
        Llegada y vuelta
      </p>
      <h2 id="hoja-mi-vuelo" className="mt-1 max-w-[calc(100%-3rem)] font-display text-[32px] leading-[1.05] text-text">
        {titulo}
      </h2>
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
        <div className="mt-4" data-mi-vuelo-dias>
          <span style={etiquetaMono}>{l.llega ? 'Día de llegada' : 'Día de salida'}</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {l.dias.map((d) => (
              <Pastilla key={d.iso} activa={b.fecha === d.iso} onClick={l.diasFijos ? undefined : () => cambia(lado, { fecha: d.iso })} dato={{ 'data-mi-vuelo-dia': d.iso }}>
                {d.texto.charAt(0).toUpperCase() + d.texto.slice(1)}
              </Pastilla>
            ))}
          </div>
          {avisoFechas}
        </div>
      )}
      {l.puntos.length > 1 ? (
        <div className="mt-4" data-mi-vuelo-punto-lista>
          <span style={etiquetaMono}>{l.etiquetaPunto}</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {l.puntos.map((p) => (
              <Pastilla key={p} activa={b.punto === p} onClick={() => cambia(lado, { punto: p })} dato={{ 'data-mi-vuelo-punto-opcion': p }}>
                {p}
              </Pastilla>
            ))}
          </div>
        </div>
      ) : l.puntoLibre ? (
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-text">{lado === 'ida' ? '¿Dónde llegas? (opcional)' : '¿De dónde sales? (opcional)'}</span>
          <input value={b.punto ?? ''} onChange={(e) => cambia(lado, { punto: e.target.value })} maxLength={40} placeholder="Ciampino" autoComplete="off" data-mi-vuelo-punto className={campo} />
        </label>
      ) : null}
      <div className="mt-4 flex items-baseline justify-between">
        <span style={etiquetaMono}>{l.llega ? 'Hora de llegada' : 'Hora de salida'}</span>
        <span className="text-[12px] font-semibold text-text/55" data-mi-vuelo-hora>
          {b.hora}
        </span>
      </div>
      <div className="mt-2">
        <RuedaDeHora value={b.hora} onChange={(h) => cambia(lado, { hora: h })} label={l.llega ? 'Hora de llegada' : 'Hora de salida'} />
      </div>
      {extra && <div className="mt-5 flex flex-col gap-5">{extra}</div>}
    </HojaAbajo>
  )
}
