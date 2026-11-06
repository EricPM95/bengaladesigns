import { useRef, useState } from 'react'
import { leerReservaCoche, type DatosReservaCocheLeida } from '../../../lib/billeteLeer'
import type { GeneralBooking } from '../../../lib/readiness'
import { precioGuardado, type Importe } from '../../../lib/dinero'
import { usePrecioEditable } from '../../../lib/useMoneda'
import { HojaAbajo } from './HojaAbajo'
import { BotonAnadirDocumento } from './BotonesDeReserva'
import { Trazo as TrazoDesign } from './PiezasDesignReservas'
import { CampoDeHora } from '../../ui/HojaDeHora'
import { DateField } from '../../ui/DateField'
import { CampoPrecio } from '../../ui/CampoPrecio'

/**
 * LA RESERVA DEL COCHE DE ALQUILER (6-nov; Design `Coche Lanza` 06a), igual que la del alojamiento (A1): [Añadir tu reserva] con «Desde el PDF, una foto o una captura.». Abre el selector, la app lee la confirmación
 * (compañía, coche, recogida con su sitio, día y hora, devolución con su sitio, día y hora, precio y código) y lo pone en una hoja para verlo y cambiarlo a mano antes de guardarlo. Todo se puede corregir.
 * Sin pase lleva el candado y abre el aviso del pase (`documento_coche`), como el alojamiento; los datos a mano van aparte (`aMano`, solo con pase).
 * Se guarda en `rentalVehicleBooking` (el mismo dato que el modal de siempre y que DÍAS): `GeneralBooking` con sus campos de más.
 */
const ETIQUETA_CAJA = { font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.12em', color: 'rgba(28,34,48,.5)', textTransform: 'uppercase' as const }
const CAJA = 'flex h-[54px] min-w-0 flex-col justify-center gap-px rounded-[15px] border bg-[#FFFDF8] px-3.5'
const TITULO_FILA = { font: "700 14.5px 'Geist'" }

/** Lo leído → lo que ya hay: lo leído manda si se ha leído algo; si no, lo que ya estaba guardado. */
export function BotonAnadirReservaCoche({ onLeida, año, onAMano }: { onLeida: (datos: DatosReservaCocheLeida) => void; año?: number; /** «o escribe los datos a mano» (solo con pase): abre la hoja vacía. */ onAMano?: () => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [leyendo, setLeyendo] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const alElegir = async (archivo: File | undefined) => {
    if (!archivo) return
    setLeyendo(true)
    try {
      setAviso(null)
      const leidos = await leerReservaCoche(archivo, { anioPorDefecto: año })
      // Límite del día, archivo grande o sin sesión: se enseña el texto del servidor y no se abre la hoja vacía.
      if (leidos.aviso && !leidos.leida) setAviso(leidos.aviso)
      else onLeida(leidos)
    } finally {
      setLeyendo(false)
      if (ref.current) ref.current.value = ''
    }
  }
  return (
    <div className="flex flex-col gap-2.5" data-reserva-coche-anadir-envoltorio>
      <input ref={ref} type="file" accept="application/pdf,image/*" className="hidden" data-reserva-coche-archivo onChange={(e) => void alElegir(e.target.files?.[0])} />
      <BotonAnadirDocumento
        texto={leyendo ? 'Leyendo tu reserva…' : 'Añadir tu reserva'}
        clave="documento_coche"
        datos="reserva-coche-anadir"
        icono={<TrazoDesign d="coche" size={18} color="#4A3510" grosor={1.9} />}
        onAnadir={() => !leyendo && ref.current?.click()}
        aMano={onAMano}
      />
      <span className="text-center text-[12.5px] leading-snug text-text/55" data-reserva-coche-linea>
        Desde el PDF, una foto o una captura.
      </span>
      {aviso && (
        <span role="status" data-reserva-coche-error className="text-center text-[12.5px] leading-snug text-accent-red">
          {aviso}
        </span>
      )}
    </div>
  )
}

interface Campos {
  compania: string
  coche: string
  lugarRecogida: string
  fechaRecogida: string
  horaRecogida: string
  lugarDevolucion: string
  fechaDevolucion: string
  horaDevolucion: string
  codigo: string
}

/** La reserva que sale de la hoja: la `GeneralBooking` de siempre con los campos de más (lo vacío se guarda como `null`). */
export function reservaDeCocheDeCampos(c: Campos, precio: Importe | null): GeneralBooking {
  const limpio = (v: string) => v.trim() || null
  return {
    provider: c.compania.trim(),
    startDate: c.fechaRecogida,
    endDate: c.fechaDevolucion,
    precio,
    coche: limpio(c.coche),
    lugarRecogida: limpio(c.lugarRecogida),
    horaRecogida: limpio(c.horaRecogida),
    lugarDevolucion: limpio(c.lugarDevolucion),
    horaDevolucion: limpio(c.horaDevolucion),
    codigo: limpio(c.codigo),
  }
}

/** Los datos de la reserva del coche, en una hoja: lo leído (o lo que ya había) puesto para ver y cambiar a mano, y [Guardar la reserva]. */
export function HojaReservaCoche({
  reserva,
  leidos,
  fechasDelViaje,
  onGuardar,
  onQuitar,
  onClose,
}: {
  /** Lo que ya había guardado. */
  reserva: GeneralBooking | null
  /** Lo que acaba de leer la app (si viene de un archivo). */
  leidos: DatosReservaCocheLeida | null
  /** Las fechas del viaje: sirven de fecha por defecto de la recogida y la devolución. */
  fechasDelViaje: { start: string; end: string }
  onGuardar: (reserva: GeneralBooking) => void
  /** Solo si ya había reserva. */
  onQuitar?: () => void
  onClose: () => void
}) {
  const base = leidos?.leida ? leidos : null
  const [c, setC] = useState<Campos>(() => ({
    compania: base?.compania ?? reserva?.provider ?? '',
    coche: base?.coche ?? reserva?.coche ?? '',
    lugarRecogida: base?.lugarRecogida ?? reserva?.lugarRecogida ?? '',
    fechaRecogida: base?.fechaRecogida ?? reserva?.startDate ?? fechasDelViaje.start,
    horaRecogida: base?.horaRecogida ?? reserva?.horaRecogida ?? '',
    lugarDevolucion: base?.lugarDevolucion ?? reserva?.lugarDevolucion ?? '',
    fechaDevolucion: base?.fechaDevolucion ?? reserva?.endDate ?? fechasDelViaje.end,
    horaDevolucion: base?.horaDevolucion ?? reserva?.horaDevolucion ?? '',
    codigo: base?.codigo ?? reserva?.codigo ?? '',
  }))
  const importeInicial: Importe | null = base?.precio != null ? { amount: base.precio, currency: base.moneda ?? precioGuardado(reserva)?.currency ?? 'EUR' } : precioGuardado(reserva)
  const precio = usePrecioEditable(importeInicial)
  const pon = (cambio: Partial<Campos>) => setC((previo) => ({ ...previo, ...cambio }))
  const puede = c.compania.trim().length > 0
  const guardar = () => {
    if (!puede) return
    onGuardar(reservaDeCocheDeCampos(c, precio.importe))
  }
  const cuadro = (clave: keyof Campos, etiqueta: string, ejemplo: string, opciones: { mayus?: boolean; max?: number; ancho?: boolean } = {}) => (
    <label className={`${CAJA} ${opciones.ancho ? 'w-full' : 'flex-1'}`} style={{ borderColor: 'rgba(28,34,48,.12)' }}>
      <span style={ETIQUETA_CAJA}>{etiqueta}</span>
      <input
        type="text"
        value={c[clave]}
        onChange={(e) => pon({ [clave]: e.target.value } as Partial<Campos>)}
        maxLength={opciones.max ?? 80}
        placeholder={ejemplo}
        autoComplete="off"
        autoCapitalize={opciones.mayus ? 'characters' : 'off'}
        data-reserva-coche-campo={clave}
        className="w-full min-w-0 bg-transparent text-[15px] font-semibold text-text outline-none placeholder:font-normal placeholder:text-text/30"
      />
    </label>
  )
  const fecha = (clave: 'fechaRecogida' | 'fechaDevolucion', titulo: string) => (
    <div className="min-w-0 flex-1" data-reserva-coche-fecha={clave}>
      <DateField
        value={c[clave]}
        onChange={(v) => pon({ [clave]: v } as Partial<Campos>)}
        title={titulo}
        min={clave === 'fechaDevolucion' ? c.fechaRecogida || undefined : undefined}
        max={clave === 'fechaRecogida' ? c.fechaDevolucion || undefined : undefined}
        className={`${CAJA} w-full border text-left`}
      />
    </div>
  )
  const hora = (clave: 'horaRecogida' | 'horaDevolucion', etiqueta: string, ejemplo: string, titulo: string) => (
    <div className="min-w-0 flex-1" data-reserva-coche-hora={clave}>
      <CampoDeHora valor={c[clave]} onChange={(h) => pon({ [clave]: h ?? '' } as Partial<Campos>)} titulo={titulo} etiqueta={etiqueta} ejemplo={ejemplo} datos={`coche-${clave}`} className="flex h-[54px] w-full min-w-0 items-center justify-between rounded-[15px] border bg-[#FFFDF8] px-3.5 text-left" />
    </div>
  )
  return (
    <HojaAbajo
      titleId="hoja-reserva-coche"
      onClose={onClose}
      capa={115}
      pie={
        <button type="button" onClick={guardar} disabled={!puede} data-reserva-coche-guardar className="h-[54px] w-full rounded-full btn-champan text-[16px] font-bold transition-transform active:scale-[.98] disabled:opacity-40">
          {puede ? 'Guardar la reserva' : 'Pon la compañía'}
        </button>
      }
    >
      <h2 id="hoja-reserva-coche" className="max-w-[calc(100%-3rem)] font-display text-[28px] leading-[1.05] text-text" data-hoja-titulo="reserva-coche">
        Tu reserva del coche
      </h2>
      <p className="mt-2 text-[13px] leading-[1.35] text-text/60" data-reserva-coche-aviso>
        {leidos == null ? 'Escribe lo que sepas; lo demás se puede dejar vacío.' : leidos.leida ? 'Esto es lo que hemos leído. Cámbialo si algo no cuadra.' : 'No hemos podido leer la reserva. Puedes escribir los datos a mano.'}
      </p>
      <div className="mt-5 flex flex-col gap-3" data-reserva-coche-campos>
        {cuadro('compania', 'Compañía', 'Hertz, Cicar, Goldcar…', { ancho: true, max: 60 })}
        {cuadro('coche', 'Coche', 'Fiat 500 o similar', { ancho: true })}
        <div className="flex flex-col gap-[7px]">
          <span style={TITULO_FILA}>Recogida</span>
          {cuadro('lugarRecogida', 'Dónde', 'Aeropuerto de Lanzarote', { ancho: true, max: 120 })}
          <div className="flex gap-2">
            {fecha('fechaRecogida', 'Día de recogida')}
            {hora('horaRecogida', 'A las', '10:00', 'Hora de recogida')}
          </div>
        </div>
        <div className="flex flex-col gap-[7px]">
          <span style={TITULO_FILA}>Devolución</span>
          {cuadro('lugarDevolucion', 'Dónde', 'Aeropuerto de Lanzarote', { ancho: true, max: 120 })}
          <div className="flex gap-2">
            {fecha('fechaDevolucion', 'Día de devolución')}
            {hora('horaDevolucion', 'Antes de las', '17:00', 'Hora de devolución')}
          </div>
        </div>
        <CampoPrecio estado={precio} />
        {cuadro('codigo', 'Código de la reserva', 'HX48K2', { ancho: true, mayus: true, max: 30 })}
        {onQuitar && (
          <button type="button" onClick={onQuitar} data-reserva-coche-quitar className="zona-toque mx-auto mt-1 border-none bg-transparent p-0 text-[13.5px] font-semibold text-accent-red underline underline-offset-2">
            Quitar la reserva
          </button>
        )}
      </div>
    </HojaAbajo>
  )
}
