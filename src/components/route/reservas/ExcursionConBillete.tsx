import { CampoDeHora } from '../../ui/HojaDeHora'
import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { leerExcursion, type DatosExcursionLeida } from '../../../lib/billeteLeer'
import { excursionConCodigo, type BilleteDeExcursion, type CodigoDelBillete } from '../../../store/useBilleteStore'
import { estadoDelPaseParaDocumentos, usePagoActivo } from '../../../lib/pago'
import { abrirAvisoPase } from '../../../lib/avisoPase'
import type { Persona } from '../../../store/useViajeCompartido'
import { Candado } from '../../pase/Candado'
import { CodigoPantallaCompleta } from './TarjetaBillete'
import { HojaAbajo } from './HojaAbajo'
import { AvisoDeDocumentoDeReserva, BotonAnadirDocumento, IconoDeDocumento, LapizDeReserva, PapeleraRoja } from './BotonesDeReserva'
import { CajaDeDato, CajaDia, CajaHora, TarjetaCrema, Trazo } from './PiezasDesignReservas'
import { useDocumentosDeLaEntrada } from '../../../hooks/useDocumentosDeLaEntrada'
import { conCodigo as docConCodigo } from '../../../lib/entradasPorPersona'
import type { Reservation } from '../../../lib/bookings'
import { BloqueDelCodigo, DatosDeLaEntrada, accesoDeLaEntrada, nombresDeLasPersonas, type DocumentoDelBloque } from './DatosDeLaEntrada'

/**
 * (10R §4) LA EXCURSIÓN RESERVADA, COMO UNA ENTRADA (`Piezas/Entradas Billete` E1 a E5): la tarjeta crema con «Excursión» pequeño, el nombre grande y su lápiz (excursión, día y hora), el día y la hora en sus cajas,
 * los datos con su lápiz (para quién, precio, localizador, punto de encuentro), el código con «Toca para ampliar», [Añadir tu excursión] (candado dorado sin pase), [Cómo llegar al punto de encuentro] (solo con pase) y la papelera roja.
 * Todo lo del billete es de esta persona: se guarda en su móvil (y en su fila privada, 0070) y se ve sin internet. El día de la excursión no cambia de sitio al reservarla (regla 6j).
 */

/** Cómo llegar al punto de encuentro: Google Maps en transporte público hacia el punto de encuentro (en Roma, no en otra ciudad). */
export function enlaceComoLlegarPunto(punto: string | null | undefined, ciudad?: string): string | null {
  const limpio = (punto ?? '').replace(/\s+/g, ' ').trim()
  if (!limpio) return null
  const destino = ciudad && !limpio.toLowerCase().includes(ciudad.toLowerCase()) ? `${limpio}, ${ciudad}` : limpio
  return `https://www.google.com/maps/dir/?${new URLSearchParams({ api: '1', destination: destino, travelmode: 'transit' }).toString()}`
}

/** [Cómo llegar al punto de encuentro]: el botón azul noche con letra dorada del alojamiento (A2p). SIN pase: el candado pequeño de siempre. Sin punto de encuentro no sale. */
export function BotonComoLlegarPuntoDeEncuentro({ punto, ciudad, className = '' }: { punto: string | null | undefined; ciudad?: string; className?: string }) {
  // (V49) Fuera [Cómo llegar al punto de encuentro] de la tarjeta de la excursión: el punto no se verifica y el camino salía hacia las coordenadas del destino de la excursión.
  const pago = usePagoActivo() // (noche 24-nov) el gancho va ANTES de cualquier `return` (reglas de los ganchos de React)
  if (punto === '__nunca__') return null
  const enlace = null as string | null
  void ciudad
  if (!enlace) return null
  if (!pago) return <Candado datos="como-llegar-punto-encuentro" titulo="Cómo llegar al punto de encuentro" texto="Con el {pase}, llegas al punto de encuentro de tu excursión en un toque." />
  return (
    <a href={enlace} target="_blank" rel="noopener noreferrer" data-como-llegar-punto-encuentro className={`flex h-[46px] items-center justify-center gap-2 rounded-[14px] ${className}`} style={{ background: '#1C2230', color: '#F3D88F', font: "700 14.5px 'Geist'" }}>
      <Trazo d="llegar" size={17} color="#F3D88F" grosor={2} />
      Cómo llegar al punto de encuentro
    </a>
  )
}

/** [Añadir tu excursión]: abre el selector, lee el billete (`read-ticket`, tipo excursión) y devuelve lo leído. Sin pase, candado y aviso pequeño (clave `documento_excursion`). */
export function BotonAnadirExcursion({ onLeida, año, datos = 'excursion-anadir', onAMano, borde = false, alPulsar }: { onLeida: (datos: DatosExcursionLeida) => void; /** (V65) Una excursión de más de una persona: abre «Las entradas de cada uno» (igual que las entradas). */ alPulsar?: () => void; año?: number; datos?: string; /** (V45 §1) El botón de borde «+ Sube tu reserva» de la tarjeta guardada. */ borde?: boolean; /** (10S9b §1) «o escribe los datos a mano» (solo con pase): abre «Datos de la excursión» vacía. */ onAMano?: () => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [leyendo, setLeyendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const alElegir = async (archivo: File | undefined) => {
    if (!archivo) return
    setLeyendo(true)
    setError(null)
    try {
      const leida = await leerExcursion(archivo, { anioPorDefecto: año })
      if (leida.aviso) setError(leida.aviso)
      else if (leida.fuentes.length === 0 && !leida.codigo) setError('No hemos podido leer el billete de la excursión. Puedes añadir los datos a mano.')
      else onLeida(leida)
    } catch {
      setError('No hemos podido leer el billete de la excursión. Puedes añadir los datos a mano.')
    } finally {
      setLeyendo(false)
      if (ref.current) ref.current.value = ''
    }
  }
  return (
    <div className="flex flex-col gap-2.5">
      <input ref={ref} type="file" accept="application/pdf,image/*" className="hidden" data-excursion-archivo={datos} onChange={(e) => void alElegir(e.target.files?.[0])} />
      <BotonAnadirDocumento estilo={borde ? 'borde' : 'dorado'} texto={leyendo ? 'Leyendo tu excursión…' : borde ? 'Sube tu reserva' : 'Añadir tu excursión'} clave="documento_excursion" datos={datos} icono={<Trazo d="entrada" size={18} color="#4A3510" grosor={1.9} />} onAnadir={() => !leyendo && (alPulsar ? alPulsar() : ref.current?.click())} aMano={alPulsar ? undefined : onAMano} />
      {error && (
        <span role="status" data-excursion-error className="text-center text-[12.5px] leading-snug text-accent-red">
          {error}
        </span>
      )}
    </div>
  )
}

export function TarjetaExcursionDesign({
  chip,
  nombre,
  diaRotulo,
  diaGrande,
  hora,
  gente,
  precio,
  billete,
  puntoEncuentro,
  ciudad,
  cuando,
  nota,
  onLapizArriba,
  onLapizDatos,
  onQuitar,
  onLeida,
  año,
  extra,
  claveDeAviso,
  onSubirVarias,
  compro,
  documentos,
  paraTodos,
  reserva,
  compradorId,
}: {
  chip: string
  nombre: string
  diaRotulo: string
  diaGrande: string
  hora: string
  gente: Persona[]
  precio: string | null
  billete: BilleteDeExcursion | null
  puntoEncuentro: string | null
  ciudad?: string
  cuando: string
  nota?: string
  onLapizArriba?: () => void
  onLapizDatos?: () => void
  onQuitar?: () => void
  onLeida: (datos: DatosExcursionLeida) => void
  año?: number
  extra?: ReactNode
  /** (V52 §5b) El id de la reserva: la línea naranja «Esta reserva es del… Revisa que sea la buena» + [Es correcta]. */
  claveDeAviso?: string
  /** (V65) Excursión de más de una persona: [+ Sube tu reserva] abre «Las entradas de cada uno» (`HojaEntradasDeCadaUno`, tipo excursión). */
  onSubirVarias?: () => void
  /** (V65 §1) En el móvil de quien NO la compró: quién la compró. */
  compro?: string | null
  /** (V65 §2) Los códigos del bloque oscuro (uno por persona, el tuyo primero). Sin esto, el del billete guardado. */
  documentos?: DocumentoDelBloque[]
  paraTodos?: number | null
  /** (V65 §2) La reserva: de ella salen los documentos de cada persona (el hook de la V65). Sin ella, solo el billete guardado. */
  reserva?: Pick<Reservation, 'refId' | 'paraQuien'>
  compradorId?: string | null
}) {
  const uso = useDocumentosDeLaEntrada(reserva ?? null, 'excursion', compradorId)
  const conDoc = uso.lista.filter((x) => docConCodigo(x.doc))
  // «Un QR por persona»: el mío primero y los demás deslizando; «un solo QR para todos»: uno, «ENTRADA PARA N».
  const deLaLista: DocumentoDelBloque[] | undefined = uso.modo === 'unico' || conDoc.length === 0 ? undefined : uso.modo === 'comun' ? [{ clave: 'comun', codigo: conDoc[0].doc!.codigo!, tuya: true }] : conDoc.map((x) => ({ clave: x.personaId, codigo: x.doc!.codigo!, nombre: x.nombre, tuya: x.esMio }))
  const paraTodosEf = paraTodos ?? (uso.modo === 'comun' ? uso.lista.length : null)
  const [ampliado, setAmpliado] = useState<DocumentoDelBloque | null>(null)
  // (V64 §2) [Cambiar] de la línea naranja: subir otra vez (el mismo selector de archivos de siempre) o escribir los datos.
  const otroArchivo = useRef<HTMLInputElement>(null)
  const subirOtra = async (archivo: File | undefined) => {
    if (!archivo) return
    try {
      const leida = await leerExcursion(archivo, { anioPorDefecto: año })
      if (!leida.aviso && (leida.fuentes.length > 0 || leida.codigo)) onLeida(leida)
    } catch {
      // Sin lectura no cambia nada: la reserva se queda como estaba.
    } finally {
      if (otroArchivo.current) otroArchivo.current.value = ''
    }
  }
  const pedirOtra = () => {
    if (estadoDelPaseParaDocumentos() === 'sin') abrirAvisoPase('documento_excursion', {})
    else otroArchivo.current?.click()
  }
  const docs: DocumentoDelBloque[] = documentos ?? deLaLista ?? (excursionConCodigo(billete) ? [{ clave: 'mio', codigo: billete.codigo, tuya: true }] : [])
  const conCodigo = docs.length > 0
  const localizador = billete?.localizador ? billete.localizador.toUpperCase() : null
  // (10S9b §1) Lo escrito a mano cuenta como datos: el localizador o las personas (igual que si vinieran del documento) abren el bloque con su lápiz.
  const personasEscritas = billete?.personas ?? null
  const personas = gente.length >= 2 ? gente.length : personasEscritas
  const hayFilas = personas !== null || Boolean(precio) || Boolean(localizador) || Boolean(puntoEncuentro) || accesoDeLaEntrada(nombre, hora) !== null
  return (
    <TarjetaCrema datos="excursion">
      <div className="flex items-start gap-2.5">
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="inline-flex h-[22px] items-center self-start whitespace-nowrap rounded-full px-[9px]" data-excursion-chip style={{ background: '#F3E3B2', color: '#6E5018', font: "600 10.5px 'Geist'" }}>
            {chip}
          </span>
          <span data-excursion-nombre className="[overflow-wrap:anywhere]" style={{ font: "400 28px/1.05 'Instrument Serif',serif" }}>
            {nombre}
          </span>
          {nota && (
            <span data-nota-reserva className="text-[12.5px] leading-snug text-text/60">
              {nota}
            </span>
          )}
        </span>
        {onLapizArriba && (
          <span className="flex flex-none items-center">
            <IconoDeDocumento hay={conCodigo} tipo="reserva" onAbrir={() => setAmpliado(docs[0] ?? null)} datos="excursion" />
            <LapizDeReserva onClick={onLapizArriba} etiqueta="Cambiar la excursión, el día y la hora" datos="excursion-arriba" />
          </span>
        )}
      </div>
      <div className="flex items-stretch gap-2.5">
        <CajaDia rotulo={diaRotulo} grande={diaGrande} />
        <CajaHora hora={hora} />
      </div>
      <div className="relative flex flex-col gap-2" data-seccion-datos="excursion">
        <DatosDeLaEntrada rotulo="DATOS DE LA EXCURSIÓN" datos="excursion" precio={precio} localizador={localizador} personas={personas} quienes={gente.length >= 2 ? nombresDeLasPersonas(gente, !compro) : null} compro={compro ?? null} acceso={accesoDeLaEntrada(nombre, hora)} />
        {/* (V49) El punto de encuentro solo sale si es verdad (lo escribió el viajero o viene del documento). */}
        {puntoEncuentro && (
          <span data-excursion-fila="punto-encuentro">
            <CajaDeDato rotulo="PUNTO DE ENCUENTRO" icono={{ d: 'M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10zM12 8.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z' }} datos="punto-encuentro">
              {puntoEncuentro}
            </CajaDeDato>
          </span>
        )}
        {(conCodigo || localizador || personasEscritas) && onLapizDatos && (
          <span className="absolute -right-[7px] -top-[17px]">
            <LapizDeReserva onClick={onLapizDatos} etiqueta="Cambiar los datos de la excursión" datos="excursion-datos" />
          </span>
        )}
        {!hayFilas && <span className="text-[13px] text-text/55">Para quién es, cuánto ha costado y dónde es el punto de encuentro.</span>}
      </div>
      <div data-excursion-billete={billete && (billete.localizador || conCodigo) ? 'con-billete' : 'sin-billete'} className="flex flex-col gap-3">
        <input ref={otroArchivo} type="file" accept="application/pdf,image/*" className="hidden" data-excursion-archivo="cambiar" onChange={(e) => void subirOtra(e.target.files?.[0])} />
        <AvisoDeDocumentoDeReserva clave={claveDeAviso} documento="documento_excursion" onSubir={pedirOtra} onEscribir={onLapizDatos} />
        {conCodigo && <BloqueDelCodigo datos="excursion" documentos={docs} paraTodos={paraTodosEf} onAmpliar={(d) => setAmpliado(d)} faltan={uso.modo === 'porPersona' ? uso.lista.filter((x) => !docConCodigo(x.doc)).map((x) => ({ clave: x.personaId, nombre: x.nombre })) : []} onSubir={onSubirVarias} />}
        {!conCodigo && <BotonAnadirExcursion borde onLeida={onLeida} año={año} datos="excursion-sin-codigo" onAMano={onLapizDatos} alPulsar={onSubirVarias} />}
        <BotonComoLlegarPuntoDeEncuentro punto={puntoEncuentro} ciudad={ciudad} />
        {extra}
        {onQuitar && (
          <>
            
            <PapeleraRoja onClick={onQuitar} etiqueta="Quitar la excursión" datos="excursion" />
          </>
        )}
      </div>
      {ampliado && <CodigoPantallaCompleta codigo={ampliado.codigo} titulo={nombre} cuando={cuando} pie={ampliado.tuya === false && ampliado.nombre ? `Entrada de ${ampliado.nombre}` : billete?.localizador ? `Localizador ${billete.localizador.toUpperCase()}` : ''} onClose={() => setAmpliado(null)} />}
    </TarjetaCrema>
  )
}

/** El código de la excursión a pantalla completa (como E3): el nombre y «Sábado 28 · 07:30» arriba, el código lo más grande posible y «Localizador ABC123» abajo. */
export function CodigoDeExcursionPantallaCompleta({ billete, titulo, cuando, onClose }: { billete: BilleteDeExcursion & { codigo: NonNullable<BilleteDeExcursion['codigo']> }; titulo: string; cuando: string; onClose: () => void }) {
  return <CodigoPantallaCompleta codigo={billete.codigo} titulo={titulo} cuando={cuando} pie={billete.localizador ? `Localizador ${billete.localizador.toUpperCase()}` : ''} onClose={onClose} />
}

const ETIQUETA: CSSProperties = { font: "700 14.5px 'Geist'", color: '#1C2230' }
const CAJA = 'flex h-[54px] w-full min-w-0 items-center rounded-[15px] border bg-[#FFFDF8] px-3.5'

export interface DatosDeLaExcursion {
  personas: number | null
  localizador: string | null
  puntoEncuentro: string | null
  /** La hora «HH:MM» del billete, si cambió. */
  hora: string | null
  codigo: CodigoDelBillete | null
}

/**
 * «DATOS DE LA EXCURSIÓN» (la hoja del lápiz del bloque de datos y, con `leida`, lo que acaba de leer la app): personas, localizador, punto de encuentro y la hora de recogida. [Guardar los datos].
 * El día no se cambia aquí (la excursión no se mueve de sitio): eso se hace con el lápiz de arriba.
 */
export function HojaDatosDeLaExcursion({ billete, puntoActual, horaActual, leida, onGuardar, onClose }: { billete: BilleteDeExcursion | null; puntoActual: string | null; horaActual: string; leida: DatosExcursionLeida | null; onGuardar: (d: DatosDeLaExcursion) => void; onClose: () => void }) {
  const [personas, setPersonas] = useState(String(leida?.personas ?? billete?.personas ?? ''))
  const [localizador, setLocalizador] = useState(leida?.localizador ?? billete?.localizador ?? '')
  const [punto, setPunto] = useState(leida?.puntoEncuentro ?? puntoActual ?? '')
  const [hora, setHora] = useState(leida?.hora ?? horaActual)
  const guardar = () => {
    const n = Number.parseInt(personas, 10)
    onGuardar({
      personas: Number.isFinite(n) && n > 0 ? n : null,
      localizador: localizador.trim() || null,
      puntoEncuentro: punto.trim() || null,
      hora: /^\d{1,2}:\d{2}$/.test(hora) ? (hora.length === 4 ? `0${hora}` : hora) : null,
      codigo: (leida?.codigo as CodigoDelBillete | null | undefined) ?? billete?.codigo ?? null,
    })
  }
  const campo = (clave: string, etiqueta: string, valor: string, cambiar: (v: string) => void, ejemplo: string, opciones: { tipo?: string; mayus?: boolean; max?: number; num?: boolean } = {}) => (
    <div className="flex flex-col gap-[7px]">
      <span style={ETIQUETA}>{etiqueta}</span>
      <label className={CAJA} style={{ borderColor: 'rgba(28,34,48,.12)' }}>
        <input
          type={opciones.tipo ?? 'text'}
          value={valor}
          onChange={(e) => cambiar(e.target.value)}
          maxLength={opciones.max ?? 80}
          placeholder={ejemplo}
          autoComplete="off"
          autoCapitalize={opciones.mayus ? 'characters' : 'off'}
          inputMode={opciones.num ? 'numeric' : undefined}
          data-excursion-campo={clave}
          className="w-full min-w-0 bg-transparent text-[15px] font-semibold text-text outline-none placeholder:font-normal placeholder:text-text/30"
        />
      </label>
    </div>
  )
  return (
    <HojaAbajo
      titleId="hoja-datos-excursion"
      onClose={onClose}
      capa={115}
      pie={
        <button type="button" onClick={guardar} data-excursion-guardar className="h-[54px] w-full rounded-full btn-champan text-[16px] font-bold transition-transform active:scale-[.98]">
          Guardar los datos
        </button>
      }
    >
      <h2 id="hoja-datos-excursion" className="max-w-[calc(100%-3rem)] font-display text-[30px] leading-[1.05] text-text" data-hoja-titulo="datos-excursion">
        {leida ? 'Revisa los datos' : 'Datos de la excursión'}
      </h2>
      {leida && (
        <p className="mt-2 text-[14px] font-medium leading-[1.4] text-text/75" data-excursion-aviso-leida>
          Hemos leído tu reserva. Revisa los datos y cámbialos si hace falta
        </p>
      )}
      <div className="mt-5 flex flex-col gap-3.5" data-excursion-campos>
        <div className="flex flex-col gap-[7px]" data-excursion-hora>
          <span style={ETIQUETA}>Hora de recogida</span>
          <CampoDeHora valor={hora} onChange={(h) => h && setHora(h)} titulo="Hora de recogida" ejemplo="07:30" quitable={false} datos="excursion-hora" className="flex h-[54px] w-full min-w-0 items-center justify-between rounded-[15px] border bg-[#FFFDF8] px-3.5 text-left" />
        </div>
        {campo('punto', 'Punto de encuentro', punto, setPunto, 'Piazza della Repubblica, Roma', { max: 160 })}
        <div className="flex gap-2.5">
          <div className="min-w-0 flex-1">{campo('localizador', 'Localizador', localizador, setLocalizador, 'ABC123', { mayus: true, max: 30 })}</div>
          <div className="w-[110px] flex-none">{campo('personas', 'Personas', personas, setPersonas, '2', { max: 2, num: true })}</div>
        </div>
      </div>
    </HojaAbajo>
  )
}
