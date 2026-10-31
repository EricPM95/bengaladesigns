import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { leerReservaAlojamiento, type DatosReservaLeida } from '../../../lib/billeteLeer'
import { usePermisosDelViaje } from '../../../hooks/usePermisosDelViaje'
import type { TuAlojamiento } from '../../../lib/tuAlojamiento'
import {
  direccionesDistintas,
  nochesEntre,
  reservaConDatos,
  reservaDeCampos,
  textoFechasReserva,
  textoHorasReserva,
  type ReservaAlojamiento,
} from '../../../lib/reservaAlojamiento'
import { HojaAbajo } from './HojaAbajo'

/**
 * LA RESERVA DEL ALOJAMIENTO (10S7 §5; `Piezas/Entradas Billete` A1 y A2). Va dentro de la caja del alojamiento de RESERVAS (AlojamientoReservas):
 *   · A1, con alojamiento y sin reserva: [Añadir tu reserva] con «Desde el PDF, una foto o una captura.». Abre el selector, la app lee la confirmación (nombre del hotel, dirección, fechas y noches, hora de
 *     entrada y de salida, teléfono y localizador) y los pone en una hoja para que el viajero los vea y los cambie a mano antes de guardarlos. Si no se puede leer nada, lo dice y la hoja sale vacía.
 *   · A2, con reserva: las filas con su icono (dirección, fechas y noches, horas, teléfono, localizador) y «Cambiar los datos». SIN código (los hoteles no lo usan).
 * Se guarda dentro del alojamiento (`accommodationSelections[...].reserva`): viaja con el viaje y «Eliminar alojamiento» se la lleva. Solo quien puede cambiar el alojamiento (el administrador) la añade.
 * Si la dirección leída es distinta de la que ya había en «Cómo llegar a tu alojamiento» (solo con pase), la hoja PREGUNTA cuál se queda antes de cambiarla.
 */
const ORO = '#6E5018'
const ETIQUETA_CAJA: CSSProperties = { font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.12em', color: 'rgba(28,34,48,.5)', textTransform: 'uppercase' }
const CAJA = 'flex h-[54px] min-w-0 flex-col justify-center gap-px rounded-[15px] border bg-[#FFFDF8] px-3.5'

const ICONOS = {
  cama: 'M3 18V8M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-8v5',
  direccion: 'M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10zM12 8.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  fechas: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  horas: 'M14 10a4 4 0 1 0-3.5 4L14 17.5h2.5V20H19v-2.5M10 10h.01',
  telefono: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2',
  localizador: 'M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4zM10 6v12',
} as const

function Trazo({ d, size, color }: { d: string; size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
      <path d={d} />
    </svg>
  )
}

function Fila({ icono, datos, children }: { icono: keyof typeof ICONOS; datos: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-2.5" style={{ font: "600 14px 'Geist'" }} data-reserva-aloj-fila={datos}>
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full" style={{ background: '#F3E3B2' }}>
        <Trazo d={ICONOS[icono]} size={16} color={ORO} />
      </span>
      <span className="min-w-0 flex-1 break-words">{children}</span>
    </span>
  )
}

/** Las filas de A2. `direccion`: la de la reserva o, si no la trae, la que ya tenía el viaje. */
export function FilasDeLaReserva({ reserva, direccion }: { reserva: ReservaAlojamiento; direccion?: string | null }) {
  const fechas = textoFechasReserva(reserva)
  const horas = textoHorasReserva(reserva)
  const dir = reserva.direccion ?? direccion ?? null
  return (
    <div className="mt-1 flex flex-col gap-2.5" data-reserva-aloj-filas>
      {dir && (
        <Fila icono="direccion" datos="direccion">
          <span data-direccion-tarjeta>{dir}</span>
        </Fila>
      )}
      {fechas && (
        <Fila icono="fechas" datos="fechas">
          {fechas}
        </Fila>
      )}
      {horas && (
        <Fila icono="horas" datos="horas">
          {horas}
        </Fila>
      )}
      {reserva.telefono && (
        <Fila icono="telefono" datos="telefono">
          {reserva.telefono}
        </Fila>
      )}
      {reserva.localizador && (
        <Fila icono="localizador" datos="localizador">
          Localizador {reserva.localizador}
        </Fila>
      )}
    </div>
  )
}

/** A1: [Añadir tu reserva] con su ayuda. Lee el archivo y devuelve lo leído (`onLeida`; con `leida: false` si no se pudo leer nada). */
export function BotonAnadirReserva({ onLeida, año }: { onLeida: (datos: DatosReservaLeida) => void; año?: number }) {
  const ref = useRef<HTMLInputElement>(null)
  const [leyendo, setLeyendo] = useState(false)
  const alElegir = async (archivo: File | undefined) => {
    if (!archivo) return
    setLeyendo(true)
    try {
      onLeida(await leerReservaAlojamiento(archivo, { anioPorDefecto: año }))
    } finally {
      setLeyendo(false)
      if (ref.current) ref.current.value = ''
    }
  }
  return (
    <div className="flex flex-col gap-2.5">
      <input ref={ref} type="file" accept="application/pdf,image/*" className="hidden" data-reserva-aloj-archivo onChange={(e) => void alElegir(e.target.files?.[0])} />
      <button
        type="button"
        disabled={leyendo}
        onClick={() => ref.current?.click()}
        data-reserva-aloj-anadir
        className="flex h-[50px] items-center justify-center gap-2 rounded-[15px] text-[15.5px] font-bold disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)', color: '#4A3510', boxShadow: '0 10px 20px -14px rgba(110,80,24,.7),inset 0 1px 0 rgba(255,255,255,.55)' }}
      >
        <Trazo d={ICONOS.cama} size={18} color="#4A3510" />
        {leyendo ? 'Leyendo tu reserva…' : 'Añadir tu reserva'}
      </button>
      <span className="text-center text-[12.5px] text-text/50" data-reserva-aloj-ayuda>
        Desde el PDF, una foto o una captura.
      </span>
    </div>
  )
}

interface Campos {
  nombre: string
  direccion: string
  entrada: string
  salida: string
  noches: string
  horaEntrada: string
  horaSalida: string
  telefono: string
  localizador: string
}

/** Los datos de la reserva, en una hoja: lo leído (o lo que ya había) puesto para ver y cambiar a mano, y [Guardar la reserva]. */
export function HojaReservaAlojamiento({
  nombreActual,
  reserva,
  leidos,
  direccionDelViaje,
  conPase,
  onGuardar,
  onClose,
}: {
  nombreActual: string
  reserva: ReservaAlojamiento | null
  /** Lo que acaba de leer la app (si viene de un archivo). */
  leidos: DatosReservaLeida | null
  /** La dirección que ya había para «Cómo llegar a tu alojamiento» (solo con pase). */
  direccionDelViaje: string | null
  conPase: boolean
  onGuardar: (r: { nombre: string; reserva: ReservaAlojamiento | null; usarDireccionDeLaReserva: boolean }) => void
  onClose: () => void
}) {
  const base = leidos?.leida ? leidos : null
  const [c, setC] = useState<Campos>(() => ({
    nombre: base?.nombre ?? nombreActual,
    direccion: base?.direccion ?? reserva?.direccion ?? '',
    entrada: base?.entrada ?? reserva?.entrada ?? '',
    salida: base?.salida ?? reserva?.salida ?? '',
    noches: String(base?.noches ?? reserva?.noches ?? ''),
    horaEntrada: base?.horaEntrada ?? reserva?.horaEntrada ?? '',
    horaSalida: base?.horaSalida ?? reserva?.horaSalida ?? '',
    telefono: base?.telefono ?? reserva?.telefono ?? '',
    localizador: base?.localizador ?? reserva?.localizador ?? '',
  }))
  const pon = (cambio: Partial<Campos>) =>
    setC((previo) => {
      const nuevo = { ...previo, ...cambio }
      // Con las dos fechas, las noches salen de ellas.
      const n = nochesEntre(nuevo.entrada, nuevo.salida)
      return n ? { ...nuevo, noches: String(n) } : nuevo
    })
  // La pregunta de la dirección: solo con pase, si ya había una y la de la reserva es otra. Si la dirección es la que ya estaba guardada en la reserva (al cambiar otro dato a mano), no se vuelve a preguntar.
  const yaEstabaEnLaReserva = Boolean(reserva?.direccion) && !direccionesDistintas(c.direccion, reserva?.direccion)
  const hayPregunta = conPase && !yaEstabaEnLaReserva && direccionesDistintas(c.direccion, direccionDelViaje)
  const [eleccion, setEleccion] = useState<'reserva' | 'antes' | null>(null)
  const puede = !hayPregunta || eleccion !== null
  const guardar = () => {
    if (!puede) return
    const nueva = reservaDeCampos(c)
    onGuardar({ nombre: c.nombre.trim(), reserva: reservaConDatos(nueva) ? nueva : null, usarDireccionDeLaReserva: Boolean(nueva.direccion) && !yaEstabaEnLaReserva && (!direccionDelViaje || eleccion === 'reserva') })
  }
  const cuadro = (clave: keyof Campos, etiqueta: string, ejemplo: string, opciones: { tipo?: string; mayus?: boolean; max?: number; ancho?: boolean } = {}) => (
    <label className={`${CAJA} ${opciones.ancho ? 'w-full' : 'flex-1'}`} style={{ borderColor: 'rgba(28,34,48,.12)' }}>
      <span style={ETIQUETA_CAJA}>{etiqueta}</span>
      <input
        type={opciones.tipo ?? 'text'}
        value={c[clave]}
        onChange={(e) => pon({ [clave]: e.target.value } as Partial<Campos>)}
        maxLength={opciones.max ?? 80}
        placeholder={ejemplo}
        autoComplete="off"
        autoCapitalize={opciones.mayus ? 'characters' : 'off'}
        inputMode={clave === 'noches' ? 'numeric' : undefined}
        data-reserva-aloj-campo={clave}
        className="w-full min-w-0 bg-transparent text-[15px] font-semibold text-text outline-none placeholder:font-normal placeholder:text-text/30"
      />
    </label>
  )
  return (
    <HojaAbajo
      titleId="hoja-reserva-alojamiento"
      onClose={onClose}
      capa={115}
      pie={
        <button type="button" onClick={guardar} disabled={!puede} data-reserva-aloj-guardar className="h-[54px] w-full rounded-full btn-champan text-[16px] font-bold transition-transform active:scale-[.98] disabled:opacity-40">
          {puede ? 'Guardar la reserva' : 'Elige la dirección'}
        </button>
      }
    >
      <h2 id="hoja-reserva-alojamiento" className="max-w-[calc(100%-3rem)] font-display text-[28px] leading-[1.05] text-text">
        Tu reserva
      </h2>
      <p className="mt-2 text-[13px] leading-[1.35] text-text/60" data-reserva-aloj-aviso>
        {leidos == null
          ? 'Todo opcional.'
          : leidos.leida
            ? 'Esto es lo que hemos leído. Cámbialo si algo no cuadra.'
            : 'No hemos podido leer la reserva. Puedes escribir los datos a mano.'}
      </p>
      <div className="mt-5 flex flex-col gap-3" data-reserva-aloj-campos>
        {cuadro('nombre', 'Nombre del hotel', 'Hotel Palatino', { ancho: true })}
        {cuadro('direccion', 'Dirección', 'Via Cavour 12, Roma', { ancho: true, max: 160 })}
        {hayPregunta && (
          <div className="flex flex-col gap-2 rounded-[16px] px-3.5 py-3" style={{ background: 'rgba(181,138,46,.1)', border: '1px solid rgba(181,138,46,.4)' }} data-reserva-aloj-pregunta>
            <span className="text-[13.5px] font-semibold leading-snug text-text">La dirección de la reserva no es la que tenías. ¿Cuál dejamos?</span>
            <span className="text-[12.5px] leading-snug text-text/65">Antes: {direccionDelViaje}</span>
            <span className="text-[12.5px] leading-snug text-text/65">Reserva: {c.direccion.trim()}</span>
            <div className="flex gap-2">
              {(
                [
                  ['reserva', 'La de la reserva'],
                  ['antes', 'La de antes'],
                ] as const
              ).map(([id, texto]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={eleccion === id}
                  data-reserva-aloj-direccion={id}
                  onClick={() => setEleccion(id)}
                  className="zona-toque h-10 flex-1 rounded-full text-[13.5px] font-semibold"
                  style={eleccion === id ? { background: '#1C2230', color: '#FBF3E2' } : { background: '#FFFDF8', color: '#1C2230', border: '1px solid rgba(28,34,48,.2)' }}
                >
                  {texto}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          {cuadro('entrada', 'Entrada', '', { tipo: 'date' })}
          {cuadro('salida', 'Salida', '', { tipo: 'date' })}
        </div>
        <div className="flex gap-2">
          {cuadro('noches', 'Noches', '3', { max: 3 })}
          {cuadro('horaEntrada', 'Desde las', '15:00', { tipo: 'time' })}
          {cuadro('horaSalida', 'Hasta las', '11:00', { tipo: 'time' })}
        </div>
        {cuadro('telefono', 'Teléfono', '+39 06 1234 5678', { ancho: true, max: 30 })}
        {cuadro('localizador', 'Localizador', 'HX48K2', { ancho: true, mayus: true, max: 30 })}
      </div>
    </HojaAbajo>
  )
}

/**
 * Lo que va dentro de la caja del alojamiento: A1 (sin reserva) o A2 (con ella) y la hoja. `hotel` es el alojamiento puesto en esa estancia; `segmentDayId`, su clave en el store.
 */
export function ReservaDelAlojamiento({ hotel, segmentDayId, nombreMostrado, conPase, direccionDelViaje, año }: { hotel: TuAlojamiento; segmentDayId: string; nombreMostrado: string | null; conPase: boolean; direccionDelViaje: string | null; año?: number }) {
  const setHotel = useRouteStore((s) => s.setAccommodationHotel)
  const setDireccion = useRouteStore((s) => s.setAccommodationAddress)
  const { esAdmin } = usePermisosDelViaje()
  const [hoja, setHoja] = useState<{ leidos: DatosReservaLeida | null } | null>(null)
  const reserva = reservaConDatos(hotel.reserva) ? hotel.reserva : null
  const guardar = ({ nombre, reserva: nueva, usarDireccionDeLaReserva }: { nombre: string; reserva: ReservaAlojamiento | null; usarDireccionDeLaReserva: boolean }) => {
    // El hotel conserva su precio y todo lo demás; cambia el nombre (si lo hay) y la reserva.
    setHotel(segmentDayId, { ...hotel, name: nombre || hotel.name, reserva: nueva })
    // La dirección de «Cómo llegar» (solo con pase): se pone la de la reserva si no había otra o si el viajero lo ha elegido.
    if (conPase && nueva?.direccion && usarDireccionDeLaReserva && nueva.direccion !== direccionDelViaje) setDireccion(nueva.direccion)
    setHoja(null)
  }
  return (
    <>
      {reserva ? (
        <>
          <FilasDeLaReserva reserva={reserva} direccion={direccionDelViaje} />
          {esAdmin && (
            <button type="button" onClick={() => setHoja({ leidos: null })} data-reserva-aloj-cambiar-datos className="zona-toque self-start text-[13px] font-semibold underline underline-offset-2" style={{ color: ORO }}>
              Cambiar los datos
            </button>
          )}
        </>
      ) : (
        esAdmin && <BotonAnadirReserva año={año} onLeida={(leidos) => setHoja({ leidos })} />
      )}
      {hoja && (
        <HojaReservaAlojamiento
          nombreActual={nombreMostrado ?? ''}
          reserva={reserva}
          leidos={hoja.leidos}
          direccionDelViaje={direccionDelViaje}
          conPase={conPase}
          onGuardar={guardar}
          onClose={() => setHoja(null)}
        />
      )}
    </>
  )
}
