import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { useBilleteStore } from '../../../store/useBilleteStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { useViajeCompartido } from '../../../store/useViajeCompartido'
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
import { BotonAnadirDocumento } from './BotonesDeReserva'
import { Trazo as TrazoDesign } from './PiezasDesignReservas'
import { CampoDeHora } from '../../ui/HojaDeHora'

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
/** « · JUE 26» (con el día de la semana) o nada, para la etiqueta de la hora de entrada y de salida. */
const diaCortoDe = (iso: string): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  const f = new Date(`${iso}T12:00:00`)
  return ` · ${new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(f).replace('.', '')} ${f.getDate()}`
}
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
/** (10S7b) `localizador`: el PRIVADO de esta persona (no el de la reserva compartida, que ya no lo lleva): el otro viajero ve todo menos esta fila. */
export function FilasDeLaReserva({ reserva, direccion, localizador }: { reserva: ReservaAlojamiento; direccion?: string | null; localizador?: string | null }) {
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
      {localizador && (
        <Fila icono="localizador" datos="localizador">
          Localizador {localizador}
        </Fila>
      )}
    </div>
  )
}

/** A1: [Añadir tu reserva]. Lee el archivo y devuelve lo leído (`onLeida`; con `leida: false` si no se pudo leer nada). (10S8 §2) Sin pase lleva el candado y abre el aviso del pase; sin la línea «Desde el PDF, una foto o una captura.». */
export function BotonAnadirReserva({ onLeida, año }: { onLeida: (datos: DatosReservaLeida) => void; año?: number }) {
  const ref = useRef<HTMLInputElement>(null)
  const [leyendo, setLeyendo] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const alElegir = async (archivo: File | undefined) => {
    if (!archivo) return
    setLeyendo(true)
    try {
      setAviso(null)
      const leidos = await leerReservaAlojamiento(archivo, { anioPorDefecto: año })
      // (10S8 §1) Límite del día, archivo grande o sin sesión: se enseña el texto del servidor y no se abre la hoja vacía.
      if (leidos.aviso && !leidos.leida) setAviso(leidos.aviso)
      else onLeida(leidos)
    } finally {
      setLeyendo(false)
      if (ref.current) ref.current.value = ''
    }
  }
  return (
    <div className="flex flex-col gap-2.5">
      <input ref={ref} type="file" accept="application/pdf,image/*" className="hidden" data-reserva-aloj-archivo onChange={(e) => void alElegir(e.target.files?.[0])} />
      <BotonAnadirDocumento texto={leyendo ? 'Leyendo tu reserva…' : 'Añadir tu reserva'} clave="documento_alojamiento" datos="reserva-aloj-anadir" icono={<TrazoDesign d="cama" size={18} color="#4A3510" grosor={1.9} />} onAnadir={() => !leyendo && ref.current?.click()} />
      {aviso && (
        <span role="status" data-reserva-aloj-error className="text-center text-[12.5px] leading-snug text-accent-red">
          {aviso}
        </span>
      )}
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
  localizadorActual,
  leidos,
  direccionDelViaje,
  conPase,
  modo = 'leida',
  onGuardar,
  onClose,
}: {
  /** (10S8 §5, A3) 'datos': el lápiz del bloque de datos, «Datos de la reserva» (dirección, horas de entrada y de salida, teléfono y localizador). 'leida': lo que acaba de leer la app, con todos los campos. */
  modo?: 'leida' | 'datos'
  nombreActual: string
  reserva: ReservaAlojamiento | null
  /** El localizador privado de esta persona (la reserva compartida no lo lleva). */
  localizadorActual: string | null
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
    localizador: base?.localizador ?? localizadorActual ?? '',
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
  const cuadro = (clave: keyof Campos, etiqueta: string, ejemplo: string, opciones: { tipo?: string; mayus?: boolean; max?: number; ancho?: boolean; sinEtiqueta?: boolean } = {}) => (
    <label className={`${CAJA} ${opciones.ancho ? 'w-full' : 'flex-1'}`} style={{ borderColor: 'rgba(28,34,48,.12)' }}>
      {!opciones.sinEtiqueta && <span style={ETIQUETA_CAJA}>{etiqueta}</span>}
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
  // (10S9) Las horas de entrada y de salida, con la rueda de siempre (`CampoDeHora`: desde abajo, ✓ y papelera, tocar fuera guarda). Vacías, el ejemplo en gris («15:00», «11:00»); no se pone sola ninguna hora.
  const hora = (clave: 'horaEntrada' | 'horaSalida', etiqueta: string, ejemplo: string, titulo: string) => (
    <div className="min-w-0 flex-1" data-reserva-aloj-hora={clave}>
      <CampoDeHora valor={c[clave]} onChange={(h) => pon({ [clave]: h ?? '' } as Partial<Campos>)} titulo={titulo} etiqueta={etiqueta} ejemplo={ejemplo} datos={`aloj-${clave}`} className="flex h-[54px] w-full min-w-0 items-center justify-between rounded-[15px] border bg-[#FFFDF8] px-3.5 text-left" />
    </div>
  )
  return (
    <HojaAbajo
      titleId="hoja-reserva-alojamiento"
      onClose={onClose}
      capa={115}
      pie={
        <button type="button" onClick={guardar} disabled={!puede} data-reserva-aloj-guardar className="h-[54px] w-full rounded-full btn-champan text-[16px] font-bold transition-transform active:scale-[.98] disabled:opacity-40">
          {puede ? (modo === 'datos' ? 'Guardar los datos' : 'Guardar la reserva') : 'Elige la dirección'}
        </button>
      }
    >
      <h2 id="hoja-reserva-alojamiento" className={`max-w-[calc(100%-3rem)] font-display leading-[1.05] text-text ${modo === 'datos' ? 'text-[30px]' : 'text-[28px]'}`} data-hoja-titulo={modo === 'datos' ? 'datos-reserva' : 'reserva'}>
        {modo === 'datos' ? 'Datos de la reserva' : 'Tu reserva'}
      </h2>
      {modo !== 'datos' && (
        <p className="mt-2 text-[13px] leading-[1.35] text-text/60" data-reserva-aloj-aviso>
          {leidos == null
            ? 'Todo opcional.'
            : leidos.leida
              ? 'Esto es lo que hemos leído. Cámbialo si algo no cuadra.'
              : 'No hemos podido leer la reserva. Puedes escribir los datos a mano.'}
        </p>
      )}
      <div className="mt-5 flex flex-col gap-3" data-reserva-aloj-campos>
        {modo !== 'datos' && cuadro('nombre', 'Nombre del hotel', 'Hotel Palatino', { ancho: true })}
        {modo === 'datos' ? (
          <div className="flex flex-col gap-[7px]">
            <span style={{ font: "700 14.5px 'Geist'" }}>Dirección</span>
            {cuadro('direccion', '', 'Via Cavour 12, Roma', { ancho: true, max: 160, sinEtiqueta: true })}
          </div>
        ) : (
          cuadro('direccion', 'Dirección', 'Via Cavour 12, Roma', { ancho: true, max: 160 })
        )}
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
        {modo === 'datos' ? (
          <>
            <div className="flex gap-2">
              {hora('horaEntrada', `Entrada${diaCortoDe(c.entrada)}`, '15:00', 'Hora de entrada')}
              {hora('horaSalida', `Salida${diaCortoDe(c.salida)}`, '11:00', 'Hora de salida')}
            </div>
            <div className="flex gap-2">
              {cuadro('telefono', 'Teléfono', '+39 06 1234 5678', { max: 30 })}
              {cuadro('localizador', 'Localizador', 'HX48K2', { mayus: true, max: 30 })}
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              {cuadro('entrada', 'Entrada', '', { tipo: 'date' })}
              {cuadro('salida', 'Salida', '', { tipo: 'date' })}
            </div>
            <div className="flex gap-2">
              {cuadro('noches', 'Noches', '3', { max: 3 })}
              {hora('horaEntrada', 'Desde las', '15:00', 'Hora de entrada')}
              {hora('horaSalida', 'Hasta las', '11:00', 'Hora de salida')}
            </div>
            {cuadro('telefono', 'Teléfono', '+39 06 1234 5678', { ancho: true, max: 30 })}
            {cuadro('localizador', 'Localizador', 'HX48K2', { ancho: true, mayus: true, max: 30 })}
          </>
        )}
      </div>
    </HojaAbajo>
  )
}

/**
 * Lo que va dentro de la caja del alojamiento: A1 (sin reserva) o A2 (con ella) y la hoja. `hotel` es el alojamiento puesto en esa estancia; `segmentDayId`, su clave en el store.
 */
/** (10S8 §5) Lo que la caja del alojamiento necesita de la reserva para pintarla como Design: la reserva, el localizador privado, quién puede cambiarla y los dos gestos (el lápiz del bloque y [Añadir tu reserva]). */
export interface ApiReservaAloj {
  reserva: ReservaAlojamiento | null
  localizador: string | null
  esAdmin: boolean
  abrirDatos: () => void
  botonAnadir: ReactNode
}

export function ReservaDelAlojamiento({ hotel, segmentDayId, nombreMostrado, conPase, direccionDelViaje, año, children }: { hotel: TuAlojamiento; segmentDayId: string; nombreMostrado: string | null; conPase: boolean; direccionDelViaje: string | null; año?: number; children: (api: ApiReservaAloj) => ReactNode }) {
  const setHotel = useRouteStore((s) => s.setAccommodationHotel)
  const setDireccion = useRouteStore((s) => s.setAccommodationAddress)
  const { esAdmin } = usePermisosDelViaje()
  const [hoja, setHoja] = useState<{ leidos: DatosReservaLeida | null; modo: 'leida' | 'datos' } | null>(null)
  const tripId = useSyncStore((s) => s.activeTripId)
  const yoId = useViajeCompartido((s) => s.gente.find((p) => p.esYo)?.id ?? null)
  const aloj = useBilleteStore((s) => s.datos.alojamientos)
  const cargado = useBilleteStore((s) => s.tripId)
  const reserva = reservaConDatos(hotel.reserva) ? hotel.reserva : null
  useEffect(() => {
    if (cargado !== tripId) useBilleteStore.getState().cargar(tripId)
  }, [tripId, cargado])
  // El localizador es PRIVADO (10S7b): solo el de quien lo añadió (en su móvil y su fila privada). Si un viaje antiguo lo traía dentro de la reserva compartida, el administrador lo pasa a lo privado y se quita de lo compartido.
  const propio = cargado === tripId ? (aloj?.[segmentDayId] ?? null) : null
  const localizador = propio && (!propio.dueno || !yoId || propio.dueno === yoId) ? propio.localizador : null
  const heredado = reserva?.localizador ?? null
  useEffect(() => {
    if (!esAdmin || !heredado || cargado !== tripId || !reserva) return
    if (!localizador) useBilleteStore.getState().ponerAlojamiento(tripId, segmentDayId, heredado)
    setHotel(segmentDayId, { ...hotel, reserva: { ...reserva, localizador: null } })
  }, [esAdmin, heredado, cargado, tripId, localizador, segmentDayId, reserva, hotel, setHotel])
  const guardar = ({ nombre, reserva: nueva, usarDireccionDeLaReserva }: { nombre: string; reserva: ReservaAlojamiento | null; usarDireccionDeLaReserva: boolean }) => {
    // Lo común (nombre, dirección, fechas, teléfono) va en el alojamiento, que ve todo el viaje; el localizador, solo en lo privado de quien lo añade.
    const privado = nueva?.localizador ?? null
    const compartida = nueva ? { ...nueva, localizador: null } : null
    useBilleteStore.getState().ponerAlojamiento(tripId, segmentDayId, privado)
    // El hotel conserva su precio y todo lo demás; cambia el nombre (si lo hay) y la reserva.
    setHotel(segmentDayId, { ...hotel, name: nombre || hotel.name, reserva: reservaConDatos(compartida) ? compartida : null })
    // La dirección de «Cómo llegar» (solo con pase): se pone la de la reserva si no había otra o si el viajero lo ha elegido.
    if (conPase && nueva?.direccion && usarDireccionDeLaReserva && nueva.direccion !== direccionDelViaje) setDireccion(nueva.direccion)
    setHoja(null)
  }
  return (
    <>
      {children({ reserva, localizador, esAdmin, abrirDatos: () => setHoja({ leidos: null, modo: 'datos' }), botonAnadir: esAdmin && !reserva ? <BotonAnadirReserva año={año} onLeida={(leidos) => setHoja({ leidos, modo: 'leida' })} /> : null })}
      {hoja && (
        <HojaReservaAlojamiento
          nombreActual={nombreMostrado ?? ''}
          reserva={reserva}
          localizadorActual={reserva ? localizador : null}
          leidos={hoja.leidos}
          direccionDelViaje={direccionDelViaje}
          conPase={conPase}
          modo={hoja.modo}
          onGuardar={guardar}
          onClose={() => setHoja(null)}
        />
      )}
    </>
  )
}
